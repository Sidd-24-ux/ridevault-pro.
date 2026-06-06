import { Router } from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addVariant,
  updateInventory,
  getInventoryLogs,
  approveProduct,
  getWarehouses
} from '../controllers/product.controller';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', getProducts);
router.post('/', protect, authorize('vendor', 'admin'), createProduct);
router.get('/warehouses', getWarehouses);
router.get('/logs', protect, authorize('vendor', 'admin'), getInventoryLogs);
router.get('/:id', getProductById);
router.put('/:id', protect, authorize('vendor', 'admin'), updateProduct);
router.delete('/:id', protect, authorize('vendor', 'admin'), deleteProduct);

// Variant management
router.post('/:productId/variants', protect, authorize('vendor', 'admin'), addVariant);
router.put('/variants/:variantId/inventory', protect, authorize('vendor', 'admin'), updateInventory);

// Admin moderation
router.post('/:id/approve', protect, authorize('admin'), approveProduct);

export default router;
