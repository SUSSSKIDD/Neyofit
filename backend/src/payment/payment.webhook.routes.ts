import { Router } from 'express';
import { razorpayWebhook } from './payment.webhook';

const router = Router();

// Razorpay webhook endpoint (no auth!)
router.post('/webhook', razorpayWebhook);

export default router;
