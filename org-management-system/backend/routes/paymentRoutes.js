const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Initiate Paystack payment
router.post('/initiate', paymentController.initiatePayment);

// Paystack callback/verify endpoint
router.get('/verify', paymentController.verifyPayment);
router.post('/verify', paymentController.verifyPayment);

// WEBHOOK: Paystack will POST here for payment notifications
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.paystackWebhook
);

// GET: Payment history for a user
router.get('/history/:userId', paymentController.getPaymentHistory);

// GET: Payment totals for a user
router.get('/totals/:userId', paymentController.getPaymentTotals);

module.exports = router;
