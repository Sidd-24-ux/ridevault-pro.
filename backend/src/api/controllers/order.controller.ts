import { Response } from 'express';
import { db } from '../../services/db.service';
import { AuthRequest } from '../middlewares/auth';

// Create Order (Checkout)
export const createOrder = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  const { items, shippingAddress, billingAddress, paymentMethod, rewardPointsToRedeem } = req.body;

  try {
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    const user = db.users.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let subtotal = 0;
    const orderItems: any[] = [];

    // Verify stock availability and calculate prices
    for (const item of items) {
      const variant = db.variants.findById(item.variantId);
      if (!variant) {
        return res.status(404).json({ message: `Variant with ID ${item.variantId} not found` });
      }

      const product = db.products.findById(variant.productId);
      if (!product) {
        return res.status(404).json({ message: `Product for variant ${variant.sku} not found` });
      }

      if (variant.totalStock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product '${product.name}' (${variant.size}/${variant.color}). Available: ${variant.totalStock}`
        });
      }

      const itemPrice = product.basePrice + (variant.priceAdjustment || 0);
      subtotal += itemPrice * item.quantity;

      orderItems.push({
        productId: product._id,
        variantId: variant._id,
        productName: product.name,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        quantity: item.quantity,
        price: itemPrice
      });
    }

    // Loyalty System discount calculations (100 points = ₹100 discount)
    let discount = 0;
    let redeemedPoints = 0;
    if (rewardPointsToRedeem && rewardPointsToRedeem > 0) {
      const userPoints = user.rewardPoints || 0;
      redeemedPoints = Math.min(userPoints, Number(rewardPointsToRedeem));
      discount = redeemedPoints; // 1 point = 1 rupee discount
    }

    const shippingCharge = subtotal > 1500 ? 0 : 100; // Free shipping over 1500
    const tax = Math.round(subtotal * 0.18); // 18% GST standard
    const totalAmount = Math.max(0, subtotal + shippingCharge + tax - discount);

    // Deduct stock from warehouses sequentially
    for (const item of orderItems) {
      const variant = db.variants.findById(item.variantId);
      let qtyNeeded = item.quantity;
      const warehouseStock = [...(variant.warehouseStock || [])];

      for (let ws of warehouseStock) {
        if (qtyNeeded <= 0) break;
        if (ws.quantity > 0) {
          const deduct = Math.min(ws.quantity, qtyNeeded);
          const prevQty = ws.quantity;
          ws.quantity -= deduct;
          qtyNeeded -= deduct;

          // Write Stock Deduction Log
          db.inventoryLogs.create({
            variantId: variant._id,
            productId: variant.productId,
            warehouseId: ws.warehouse,
            quantityChanged: -deduct,
            prevQuantity: prevQty,
            newQuantity: ws.quantity,
            type: 'sales_deduct',
            userId: req.user.id,
            description: `Stock deducted for Order placement`
          });
        }
      }

      const finalTotalStock = warehouseStock.reduce((s, ws) => s + ws.quantity, 0);
      db.variants.findByIdAndUpdate(variant._id, {
        warehouseStock,
        totalStock: finalTotalStock
      });
    }

    // Deduct points from user if redeemed
    if (redeemedPoints > 0) {
      db.users.findByIdAndUpdate(user._id, {
        rewardPoints: (user.rewardPoints || 0) - redeemedPoints
      });
      db.rewardPoints.create({
        userId: user._id,
        points: redeemedPoints,
        type: 'debit',
        description: 'Redeemed points at checkout'
      });
    }

    // Calculate points earned for this purchase (1 point per ₹100 spent)
    const pointsEarned = Math.floor(subtotal / 100);
    if (pointsEarned > 0) {
      db.users.findByIdAndUpdate(user._id, {
        rewardPoints: (user.rewardPoints || 0) + pointsEarned
      });
      db.rewardPoints.create({
        userId: user._id,
        points: pointsEarned,
        type: 'credit',
        description: 'Earned points from purchase'
      });
    }

    // Generate Logistics Courier Details
    const courierMock = {
      courier: 'MotoExpress Logistics',
      trackingNumber: 'MEXP-' + Math.floor(1000000000 + Math.random() * 9000000000),
      deliveryEta: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days out
      status: 'Ready for Dispatch'
    };

    const newOrder = db.orders.create({
      userId: user._id,
      customerName: user.name,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      subtotal,
      tax,
      shippingCharge,
      discount,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Awaiting Payment',
      orderStatus: 'placed',
      logistics: courierMock,
      trackingTimeline: [
        { status: 'placed', date: new Date().toISOString(), message: 'Order has been placed successfully.' }
      ]
    });

    // Notify Admins & Vendor
    db.notifications.create({
      userId: 'admin',
      title: 'New Order Placed',
      message: `Order #${newOrder._id} was placed by ${user.name} for amount ₹${totalAmount}`,
      type: 'new_order',
      isRead: false
    });

    // Send notifications to vendor accounts
    const vendorIds = new Set<string>();
    for (const item of orderItems) {
      const prod = db.products.findById(item.productId);
      if (prod) vendorIds.add(prod.vendorId);
    }
    vendorIds.forEach(vendorId => {
      const vendor = db.vendors.findById(vendorId);
      if (vendor) {
        db.notifications.create({
          userId: vendor.userId,
          title: 'New Purchase Order Received',
          message: `Your product was purchased in order #${newOrder._id}`,
          type: 'new_order',
          isRead: false
        });
      }
    });

    return res.status(201).json({
      message: 'Order created successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    return res.status(500).json({ message: 'Error processing order checkout' });
  }
};

// Verify Razorpay Payment (Simulated Checkout verification)
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  const { orderId, razorpayPaymentId, razorpaySignature } = req.body;

  try {
    const order = db.orders.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // In local simulator, we mock-verify the signature
    const isValidSignature = razorpaySignature && razorpaySignature.startsWith('mock_sig_');

    if (!isValidSignature) {
      return res.status(400).json({ message: 'Payment verification signature invalid' });
    }

    // Save payment log
    db.payments.create({
      orderId,
      razorpayPaymentId,
      amount: order.totalAmount,
      status: 'success'
    });

    const updatedTimeline = [
      ...order.trackingTimeline,
      { status: 'payment_confirmed', date: new Date().toISOString(), message: 'Payment confirmed via Razorpay.' }
    ];

    const updatedOrder = db.orders.findByIdAndUpdate(orderId, {
      paymentStatus: 'Paid',
      orderStatus: 'payment_confirmed',
      trackingTimeline: updatedTimeline
    });

    return res.status(200).json({
      message: 'Payment verified and order updated',
      order: updatedOrder
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error verifying payment status' });
  }
};

// Fetch orders (Customer orders or Vendor order manager)
export const getOrders = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let list = db.orders.find();

    if (req.user.role === 'customer') {
      list = list.filter(o => o.userId === req.user?.id);
    } else if (req.user.role === 'vendor') {
      const vendor = db.vendors.findOne({ userId: req.user.id });
      if (!vendor) return res.status(403).json({ message: 'Vendor profile not found' });

      // Filter orders where at least one item belongs to this vendor's catalog
      list = list.filter(order =>
        order.items.some((item: any) => {
          const product = db.products.findById(item.productId);
          return product && product.vendorId === vendor._id;
        })
      );
    }

    // Sort newest orders first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json(list);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving orders list' });
  }
};

// Get single order with complete specs
export const getOrderById = (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const order = db.orders.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving order' });
  }
};

// Update order timeline status (Vendor / Admin pack, ship, deliver products)
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { id } = req.params;
  const { status, message } = req.body; // 'packed', 'shipped', 'out_for_delivery', 'delivered'

  try {
    const order = db.orders.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const timeline = order.trackingTimeline || [];
    timeline.push({
      status,
      date: new Date().toISOString(),
      message: message || `Order status updated to ${status}.`
    });

    const updateFields: any = {
      orderStatus: status,
      trackingTimeline: timeline
    };

    // If marked delivered, update payment status for COD orders
    if (status === 'delivered') {
      updateFields.paymentStatus = 'Paid';
    }

    const updatedOrder = db.orders.findByIdAndUpdate(id, updateFields);

    // Notify customer
    db.notifications.create({
      userId: order.userId,
      title: `Order Status Update: ${status.replace('_', ' ').toUpperCase()}`,
      message: `Your order #${order._id} status is now: ${status}.`,
      type: 'order_update',
      isRead: false
    });

    return res.status(200).json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating status timeline' });
  }
};

// Customer Return & Exchange requests
export const createReturnExchange = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { orderId, type, items, reason, exchangeSize, images } = req.body; // type: 'return' or 'exchange'

  try {
    const order = db.orders.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. Order belongs to another client.' });
    }

    const request = db.returns.create({
      orderId,
      userId: req.user.id,
      customerName: req.user.email,
      type, // 'return' | 'exchange'
      items: items || order.items,
      reason,
      exchangeSize: exchangeSize || '',
      images: images || [],
      status: 'pending' // 'pending' -> 'approved' -> 'pickup_scheduled' -> 'refunded' / 'replacement_shipped'
    });

    // Notify Admins
    db.notifications.create({
      userId: 'admin',
      title: `New Return/Exchange Request`,
      message: `Return request placed for order #${orderId}. Reason: ${reason}`,
      type: 'return_request',
      isRead: false
    });

    return res.status(201).json({
      message: 'Return/Exchange request filed successfully. Administrators will review it.',
      request
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error filing return request' });
  }
};

// Fetch return requests
export const getReturns = (req: AuthRequest, res: Response) => {
  try {
    const list = db.returns.find();
    return res.status(200).json(list);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving returns' });
  }
};

// Admin updates return request status
export const updateReturnStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved', 'pickup_scheduled', 'refunded', 'rejected'

  try {
    const request = db.returns.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const updated = db.returns.findByIdAndUpdate(id, { status });

    if (status === 'refunded' && request.type === 'return') {
      // Return reward points or trigger payment refund logic
      const order = db.orders.findById(request.orderId);
      if (order) {
        db.orders.findByIdAndUpdate(order._id, { orderStatus: 'returned' });
      }
    } else if (status === 'approved' && request.type === 'exchange') {
      const order = db.orders.findById(request.orderId);
      if (order) {
        db.orders.findByIdAndUpdate(order._id, { orderStatus: 'exchange_processing' });
      }
    }

    // Notify user
    db.notifications.create({
      userId: request.userId,
      title: `Return Request ${status.toUpperCase()}`,
      message: `Your return/exchange request for order #${request.orderId} was updated to: ${status}`,
      type: 'return_update',
      isRead: false
    });

    return res.status(200).json({ message: 'Status updated successfully', request: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating return request' });
  }
};
