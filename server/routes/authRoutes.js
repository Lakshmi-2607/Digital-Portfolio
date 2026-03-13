import { Router } from 'express';
import {
  getProfile,
  login,
  qrLogin,
  resendOtp,
  signup,
  verifyOtp
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/signup', signup);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/qr-login/:qrToken', qrLogin);
router.get('/me', protect, getProfile);

export default router;
