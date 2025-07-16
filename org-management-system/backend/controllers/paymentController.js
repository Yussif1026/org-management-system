const Payment = require('../models/Payment');
const User = require('../models/User');
const axios = require('axios');
const crypto = require('crypto'); // ADD THIS LINE

// Initiate Paystack payment (returns authorization_url to frontend)
exports.initiatePayment = async (req, res) => {
  try {
    const { userId, type, amount, eventType } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const callback_url = 'http://localhost:5000/api/payments/verify'; // Change to your frontend callback URL if needed

    const paystackData = {
      email: user.email,
      amount: amount * 100, // Paystack expects kobo/pesewas
      callback_url,
      metadata: {
        userId,
        type,
        eventType: eventType || null
      }
    };

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      paystackData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      authorization_url: response.data.data.authorization_url,
      reference: response.data.data.reference
    });
  } catch (err) {
    res.status(500).json({ message: 'Payment initiation failed', error: err.message });
  }
};

// Verify Paystack payment
exports.verifyPayment = async (req, res) => {
  try {
    const reference = req.query.reference || req.body.reference;
    if (!reference) return res.status(400).json({ message: 'Reference is required' });

    // Verify payment from Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
      }
    );
    const { status, customer, metadata, amount } = response.data.data;
    if (status !== 'success')
      return res.status(400).json({ message: 'Payment not successful' });

    // Log payment in database if not already logged
    const existing = await Payment.findOne({ paystackRef: reference });
    if (!existing) {
      const payment = new Payment({
        user: metadata.userId,
        type: metadata.type,
        amount: amount / 100, // convert back to GHC
        eventType: metadata.eventType || null,
        paystackRef: reference
      });
      await payment.save();

      // Update user's contributions
      const user = await User.findById(metadata.userId);
      if (metadata.type === 'monthly') {
        user.totalMonthlyContributions += amount / 100;
      } else if (metadata.type === 'occasion') {
        user.totalOccasionContributions += amount / 100;
      }
      await user.save();
    }

    res.json({ message: 'Payment verified and logged' });
  } catch (err) {
    res.status(500).json({ message: 'Payment verification failed', error: err.message });
  }
};

// PAYSTACK WEBHOOK HANDLER - ADD THIS
exports.paystackWebhook = async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto.createHmac('sha512', secret)
    .update(req.body)
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).send('Invalid signature');
  }

  // Parse the event (body is a buffer, so parse manually)
  const event = JSON.parse(req.body);

  if (event.event === 'charge.success') {
    const existing = await Payment.findOne({ paystackRef: event.data.reference });
    if (!existing) {
      const payment = new Payment({
        user: event.data.metadata.userId,
        type: event.data.metadata.type,
        amount: event.data.amount / 100,
        eventType: event.data.metadata.eventType || null,
        paystackRef: event.data.reference
      });
      await payment.save();

      const user = await User.findById(event.data.metadata.userId);
      if (event.data.metadata.type === 'monthly') {
        user.totalMonthlyContributions += event.data.amount / 100;
      } else if (event.data.metadata.type === 'occasion') {
        user.totalOccasionContributions += event.data.amount / 100;
      }
      await user.save();
    }
  }
  res.sendStatus(200);
};

// GET: Payment history for a user
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    const history = await Payment.find({ user: userId }).sort({ date: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get payment history', error: err.message });
  }
};

// GET: Payment totals for a user
exports.getPaymentTotals = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    res.json({
      totalMonthlyContributions: user.totalMonthlyContributions || 0,
      totalOccasionContributions: user.totalOccasionContributions || 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get payment totals', error: err.message });
  }
};
