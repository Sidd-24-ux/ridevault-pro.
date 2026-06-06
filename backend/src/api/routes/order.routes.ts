import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  getOrders,
  getOrderById,
  updateOrderStatus,
  createReturnExchange,
  getReturns,
  updateReturnStatus
} from '../controllers/order.controller';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

router.use(protect); // All order routes require authentication

router.post('/', createOrder);
router.post('/verify', verifyPayment);
router.get('/', getOrders);

// Returns & Exchanges
router.post('/returns', createReturnExchange);
router.get('/returns', authorize('admin', 'vendor'), getReturns);
router.put('/returns/:id/status', authorize('admin'), updateReturnStatus);

// Single order tracking
router.get('/:id', getOrderById);
router.put('/:id/status', authorize('vendor', 'admin'), updateOrderStatus);

export default router;
