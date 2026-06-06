import { Response } from 'express';
import { db } from '../../services/db.service';
import { AuthRequest } from '../middlewares/auth';
import { generateSKU } from '../../utils/sku';

// Create Product (Vendor only - defaults to unapproved)
export const createProduct = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  const { name, description, brand, category, basePrice, specifications, images } = req.body;

  try {
    const vendor = db.vendors.findOne({ userId: req.user.id });
    if (!vendor) {
      return res.status(403).json({ message: 'Vendor profile not found. Register as vendor first.' });
    }

    if (!vendor.isApproved) {
      return res.status(403).json({ message: 'Your vendor account is pending admin approval. You cannot add products yet.' });
    }

    const newProduct = db.products.create({
      name,
      description,
      brand,
      category: category || 'General Gear',
      basePrice: Number(basePrice) || 0,
      specifications: {
        material: specifications?.material || '',
        waterproof: !!specifications?.waterproof,
        ceCertified: !!specifications?.ceCertified,
        ridingStyle: specifications?.ridingStyle || 'Street'
      },
      vendorId: vendor._id,
      images: images || [],
      averageRating: 0,
      isApproved: false // Admin must approve
    });

    // Create Audit Log
    db.auditLogs.create({
      userId: req.user.id,
      action: 'CREATE_PRODUCT',
      details: `Product created: ${name} (ID: ${newProduct._id}). Awaiting approval.`
    });

    // Notify Admins
    db.notifications.create({
      userId: 'admin', // Admin broadcast
      title: 'New Product Pending Approval',
      message: `Vendor '${vendor.businessName}' added a new product: '${name}'.`,
      type: 'product_approval',
      isRead: false
    });

    return res.status(201).json({
      message: 'Product created successfully. Awaiting administrator approval.',
      product: newProduct
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    return res.status(500).json({ message: 'Error creating product' });
  }
};

// Get all products (With Advanced Search, Filtering and Sorting)
export const getProducts = async (req: AuthRequest, res: Response) => {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    color,
    size,
    waterproof,
    ceCertified,
    ridingStyle,
    search,
    sortBy,
    limit,
    includeUnapproved
  } = req.query;

  try {
    let products = db.products.find();

    // Regular users shouldn't see unapproved products unless explicitly authorized
    if (includeUnapproved !== 'true') {
      products = products.filter(p => p.isApproved === true);
    }

    // Filter by search keyword
    if (search) {
      const q = String(search).toLowerCase();
      products = products.filter(
        p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    // Filter by specifications
    if (category) {
      products = products.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
    }
    if (brand) {
      products = products.filter(p => p.brand.toLowerCase() === String(brand).toLowerCase());
    }
    if (minPrice) {
      products = products.filter(p => p.basePrice >= Number(minPrice));
    }
    if (maxPrice) {
      products = products.filter(p => p.basePrice <= Number(maxPrice));
    }
    if (waterproof === 'true') {
      products = products.filter(p => p.specifications?.waterproof === true);
    }
    if (ceCertified === 'true') {
      products = products.filter(p => p.specifications?.ceCertified === true);
    }
    if (ridingStyle) {
      products = products.filter(p => p.specifications?.ridingStyle.toLowerCase() === String(ridingStyle).toLowerCase());
    }

    // Join variants to filter by size / color or add stock info
    const enrichedProducts = products.map(product => {
      const variants = db.variants.find({ productId: product._id });
      const totalStock = variants.reduce((sum, v) => sum + (v.totalStock || 0), 0);
      return {
        ...product,
        variants,
        totalStock
      };
    });

    let filteredResult = enrichedProducts;

    // Filter by color in variants
    if (color) {
      filteredResult = filteredResult.filter(p =>
        p.variants.some((v: any) => v.color.toLowerCase() === String(color).toLowerCase())
      );
    }

    // Filter by size in variants
    if (size) {
      filteredResult = filteredResult.filter(p =>
        p.variants.some((v: any) => v.size.toLowerCase() === String(size).toLowerCase())
      );
    }

    // Sort options
    if (sortBy === 'price_asc') {
      filteredResult.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === 'price_desc') {
      filteredResult.sort((a, b) => b.basePrice - a.basePrice);
    } else if (sortBy === 'rating') {
      filteredResult.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else {
      // Default: newest first
      filteredResult.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Apply limit
    if (limit) {
      filteredResult = filteredResult.slice(0, Number(limit));
    }

    return res.status(200).json(filteredResult);
  } catch (error) {
    console.error('Get Products Error:', error);
    return res.status(500).json({ message: 'Error fetching products' });
  }
};

// Get Product by ID (With variant details)
export const getProductById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const product = db.products.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const variants = db.variants.find({ productId: product._id });
    const vendor = db.vendors.findById(product.vendorId);
    const reviews = db.reviews.find({ productId: product._id });

    // Enriched variant details with warehouse names
    const enrichedVariants = variants.map(v => {
      const warehouseStockEnriched = (v.warehouseStock || []).map((ws: any) => {
        const wh = db.warehouses.findById(ws.warehouse);
        return {
          ...ws,
          warehouseName: wh ? wh.name : 'Unknown Warehouse'
        };
      });
      return {
        ...v,
        warehouseStock: warehouseStockEnriched
      };
    });

    return res.status(200).json({
      ...product,
      variants: enrichedVariants,
      vendor,
      reviews
    });
  } catch (error) {
    console.error('Get Product By ID Error:', error);
    return res.status(500).json({ message: 'Error retrieving product info' });
  }
};

// Update Product
export const updateProduct = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { id } = req.params;
  const updates = req.body;

  try {
    const product = db.products.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Check ownership
    const vendor = db.vendors.findOne({ userId: req.user.id });
    if (!vendor || (product.vendorId !== vendor._id && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized to modify this product' });
    }

    const updated = db.products.findByIdAndUpdate(id, {
      name: updates.name || product.name,
      description: updates.description || product.description,
      brand: updates.brand || product.brand,
      category: updates.category || product.category,
      basePrice: updates.basePrice !== undefined ? Number(updates.basePrice) : product.basePrice,
      specifications: {
        ...product.specifications,
        ...updates.specifications
      },
      images: updates.images || product.images
    });

    return res.status(200).json({ message: 'Product updated successfully', product: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating product' });
  }
};

// Delete Product
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { id } = req.params;

  try {
    const product = db.products.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const vendor = db.vendors.findOne({ userId: req.user.id });
    if (!vendor || (product.vendorId !== vendor._id && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    db.products.findByIdAndDelete(id);

    // Clean up associated variants
    const variants = db.variants.find({ productId: id });
    variants.forEach(v => db.variants.findByIdAndDelete(v._id));

    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting product' });
  }
};

// Add Product Variant
export const addVariant = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { productId } = req.params;
  const { size, color, priceAdjustment } = req.body;

  try {
    const product = db.products.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Validate ownership
    const vendor = db.vendors.findOne({ userId: req.user.id });
    if (!vendor || (product.vendorId !== vendor._id && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized to add variants to this product' });
    }

    // Check if variant combination already exists
    const existingVariant = db.variants.findOne({ productId, size, color });
    if (existingVariant) {
      return res.status(400).json({ message: 'Variant with this color and size already exists.' });
    }

    const sku = generateSKU(product.category, product.brand, product.name, color, size);

    // Initialize variant with 0 stock across our default warehouses
    const defaultWarehouses = db.warehouses.find();
    const warehouseStock = defaultWarehouses.map(wh => ({
      warehouse: wh._id,
      quantity: 0
    }));

    const newVariant = db.variants.create({
      productId,
      sku,
      size,
      color,
      priceAdjustment: Number(priceAdjustment) || 0,
      totalStock: 0,
      warehouseStock
    });

    return res.status(201).json({
      message: 'Product variant added successfully',
      variant: newVariant
    });
  } catch (error) {
    console.error('Add Variant Error:', error);
    return res.status(500).json({ message: 'Error adding variant' });
  }
};

// Update Inventory Stock (Vendor adds/removes stock at specific warehouses)
export const updateInventory = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { variantId } = req.params;
  const { warehouseId, quantityChange, type } = req.body; // type: 'restock', 'sales_deduct', 'audit_correction'

  try {
    const variant = db.variants.findById(variantId);
    if (!variant) return res.status(404).json({ message: 'Product variant not found' });

    const product = db.products.findById(variant.productId);
    if (!product) return res.status(404).json({ message: 'Parent product not found' });

    // Validate ownership
    const vendor = db.vendors.findOne({ userId: req.user.id });
    if (!vendor || (product.vendorId !== vendor._id && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized to manage this inventory' });
    }

    const warehouse = db.warehouses.findById(warehouseId);
    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });

    const warehouseStock = variant.warehouseStock || [];
    let warehouseItem = warehouseStock.find((ws: any) => ws.warehouse === warehouseId);

    const prevQuantity = warehouseItem ? warehouseItem.quantity : 0;
    const newQuantity = Math.max(0, prevQuantity + Number(quantityChange));

    if (warehouseItem) {
      warehouseItem.quantity = newQuantity;
    } else {
      warehouseStock.push({ warehouse: warehouseId, quantity: newQuantity });
    }

    // Re-sum total variant stock
    const newTotalStock = warehouseStock.reduce((sum: number, item: any) => sum + item.quantity, 0);

    const updatedVariant = db.variants.findByIdAndUpdate(variantId, {
      warehouseStock,
      totalStock: newTotalStock
    });

    // Record Stock Log
    db.inventoryLogs.create({
      variantId,
      productId: product._id,
      warehouseId,
      quantityChanged: Number(quantityChange),
      prevQuantity,
      newQuantity,
      type: type || 'restock',
      userId: req.user.id,
      description: `Stock adjusted by ${quantityChange} units via ${type || 'restock'}`
    });

    // Check for Low Stock Warning
    if (newQuantity < 3) {
      // Create warning notification
      db.notifications.create({
        userId: req.user.id,
        title: 'Low Stock Alert',
        message: `SKU '${variant.sku}' is running low in ${warehouse.name}. Current stock: ${newQuantity} units.`,
        type: 'low_stock',
        isRead: false
      });
    }

    return res.status(200).json({
      message: 'Inventory updated successfully',
      variant: updatedVariant
    });
  } catch (error) {
    console.error('Update Inventory Error:', error);
    return res.status(500).json({ message: 'Error updating inventory' });
  }
};

// Fetch Inventory logs (Vendor audits)
export const getInventoryLogs = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const vendor = db.vendors.findOne({ userId: req.user.id });
    if (!vendor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    let logs = db.inventoryLogs.find();

    // Filter logs that belong to this vendor's products
    if (req.user.role !== 'admin' && vendor) {
      const vendorProducts = db.products.find({ vendorId: vendor._id }).map(p => p._id);
      logs = logs.filter(log => vendorProducts.includes(log.productId));
    }

    // Enrich logs with details
    const enrichedLogs = logs.map(log => {
      const product = db.products.findById(log.productId);
      const variant = db.variants.findById(log.variantId);
      const warehouse = db.warehouses.findById(log.warehouseId);
      return {
        ...log,
        productName: product ? product.name : 'Unknown Product',
        sku: variant ? variant.sku : 'N/A',
        warehouseName: warehouse ? warehouse.name : 'Unknown'
      };
    });

    // Sort newest first
    enrichedLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json(enrichedLogs);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving inventory logs' });
  }
};

// Admin Moderation: Approve Product
export const approveProduct = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const product = db.products.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const updated = db.products.findByIdAndUpdate(id, { isApproved: true });

    // Notify Vendor
    const vendor = db.vendors.findById(product.vendorId);
    if (vendor) {
      db.notifications.create({
        userId: vendor.userId,
        title: 'Product Approved',
        message: `Your product '${product.name}' has been approved by the administrators and is now live!`,
        type: 'product_approved',
        isRead: false
      });
    }

    return res.status(200).json({ message: 'Product approved successfully', product: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Error approving product' });
  }
};

// Get List of Warehouses
export const getWarehouses = (req: AuthRequest, res: Response) => {
  try {
    const list = db.warehouses.find();
    return res.status(200).json(list);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving warehouses' });
  }
};
