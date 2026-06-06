import { Router } from 'express';
import { register, login, refresh, getProfile, updateProfile } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

export default router;
