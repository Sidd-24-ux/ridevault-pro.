import { Response } from 'express';
import { db } from '../../services/db.service';
import { AuthRequest } from '../middlewares/auth';

// Get Admin Dashboard KPIs & Charts
export const getAdminDashboardStats = (req: AuthRequest, res: Response) => {
  try {
    const users = db.users.find();
    const vendors = db.vendors.find();
    const products = db.products.find();
    const orders = db.orders.find();

    // Key Performance Indicators (KPIs)
    const totalUsers = users.length;
    const totalVendors = vendors.length;
    const totalProducts = products.length;
    const totalOrders = orders.length;

    // Filter paid orders to calculate total revenue
    const paidOrders = orders.filter(o => o.paymentStatus === 'Paid' || o.paymentMethod === 'COD');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Category Distribution Breakdown
    const categoryBreakdown: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || 'General';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });
    const categoryChart = Object.keys(categoryBreakdown).map(name => ({
      name,
      value: categoryBreakdown[name]
    }));

    // Revenue per month mock data (last 6 months)
    const monthlyRevenue = [
      { month: 'Jan', revenue: Math.round(totalRevenue * 0.12), orders: Math.round(totalOrders * 0.1) },
      { month: 'Feb', revenue: Math.round(totalRevenue * 0.15), orders: Math.round(totalOrders * 0.14) },
      { month: 'Mar', revenue: Math.round(totalRevenue * 0.18), orders: Math.round(totalOrders * 0.16) },
      { month: 'Apr', revenue: Math.round(totalRevenue * 0.22), orders: Math.round(totalOrders * 0.2) },
      { month: 'May', revenue: Math.round(totalRevenue * 0.25), orders: Math.round(totalOrders * 0.23) },
      { month: 'Jun', revenue: Math.round(totalRevenue * 0.08), orders: Math.round(totalOrders * 0.07) } // Current
    ];

    // Find best selling products
    const productSalesCount: Record<string, { name: string; sales: number; revenue: number }> = {};
    orders.forEach(order => {
      order.items.forEach((item: any) => {
        if (!productSalesCount[item.productId]) {
          productSalesCount[item.productId] = { name: item.productName, sales: 0, revenue: 0 };
        }
        productSalesCount[item.productId].sales += item.quantity;
        productSalesCount[item.productId].revenue += item.price * item.quantity;
      });
    });

    const bestSellers = Object.values(productSalesCount)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    return res.status(200).json({
      kpis: {
        totalUsers,
        totalVendors,
        totalProducts,
        totalOrders,
        totalRevenue,
        averageOrderValue
      },
      charts: {
        categoryDistribution: categoryChart,
        monthlyRevenue,
        bestSellers
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving analytics data' });
  }
};

// Vendor list review
export const getVendorsList = (req: AuthRequest, res: Response) => {
  try {
    const list = db.vendors.find();
    // Enrich with user name & email
    const enriched = list.map(v => {
      const u = db.users.findById(v.userId);
      return {
        ...v,
        ownerName: u ? u.name : 'Unknown',
        ownerEmail: u ? u.email : 'N/A'
      };
    });
    return res.status(200).json(enriched);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching vendors' });
  }
};

// Verify/Approve Vendor registrations (with business GST validation mock)
export const verifyVendor = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isApproved, isSuspended } = req.body;

  try {
    const vendor = db.vendors.findById(id);
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found' });

    const updated = db.vendors.findByIdAndUpdate(id, {
      isApproved: isApproved !== undefined ? isApproved : vendor.isApproved,
      isSuspended: isSuspended !== undefined ? isSuspended : vendor.isSuspended
    });

    // Write Audit Log
    db.auditLogs.create({
      userId: req.user?.id || 'admin',
      action: 'VERIFY_VENDOR',
      details: `Vendor ID: ${id} updated. Approved: ${isApproved}, Suspended: ${isSuspended}`
    });

    // Notify the user
    db.notifications.create({
      userId: vendor.userId,
      title: isApproved ? 'Vendor Account Approved' : 'Vendor Status Updated',
      message: isApproved
        ? 'Congratulations! Your RideVault Pro seller profile is approved. You can now list riding gear.'
        : 'Your vendor account status was updated by administrators.',
      type: 'vendor_verification',
      isRead: false
    });

    return res.status(200).json({ message: 'Vendor profile updated successfully', vendor: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating vendor status' });
  }
};

// List Users
export const getUsersList = (req: AuthRequest, res: Response) => {
  try {
    const list = db.users.find();
    const safeList = list.map(u => {
      const { password: _, ...rest } = u;
      return rest;
    });
    return res.status(200).json(safeList);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching user list' });
  }
};

// Block/Unblock User
export const toggleUserBlock = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isBlocked } = req.body;

  try {
    const user = db.users.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Mark active/inactive (we can add status field or handle in auth)
    db.users.findByIdAndUpdate(id, { isVerified: !isBlocked }); // repurposing verification as account state mock

    db.auditLogs.create({
      userId: req.user?.id || 'admin',
      action: isBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER',
      details: `User email: ${user.email} status changed. Blocked: ${isBlocked}`
    });

    return res.status(200).json({ message: `User status changed successfully` });
  } catch (error) {
    return res.status(500).json({ message: 'Error changing user status' });
  }
};

// Fetch audit security logs
export const getAuditLogs = (req: AuthRequest, res: Response) => {
  try {
    const logs = db.auditLogs.find();
    // Enrich with email
    const enriched = logs.map(log => {
      const u = db.users.findById(log.userId);
      return {
        ...log,
        userEmail: u ? u.email : 'System/Admin'
      };
    });
    enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.status(200).json(enriched);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching audit logs' });
  }
};
