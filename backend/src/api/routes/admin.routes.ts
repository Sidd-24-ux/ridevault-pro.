import { Router } from 'express';
import {
  getAdminDashboardStats,
  getVendorsList,
  verifyVendor,
  getUsersList,
  toggleUserBlock,
  getAuditLogs
} from '../controllers/admin.controller';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

router.use(protect, authorize('admin')); // Strictly admin restricted

router.get('/stats', getAdminDashboardStats);
router.get('/vendors', getVendorsList);
router.put('/vendors/:id/verify', verifyVendor);
router.get('/users', getUsersList);
router.put('/users/:id/block', toggleUserBlock);
router.get('/audit', getAuditLogs);

export default router;
