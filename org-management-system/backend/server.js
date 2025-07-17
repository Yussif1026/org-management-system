const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from .env
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// ===== CORS CONFIGURATION (PRODUCTION + LOCAL) =====
app.use(cors({
  origin: [
    'https://org-management-system-1.onrender.com', // Your deployed frontend URL
    'http://localhost:5500'                         // Local dev (optional, for your own testing)
  ],
  credentials: true
}));

app.use(express.json());

// ===== ROUTES =====
app.get('/', (req, res) => {
  res.send('Organisation Management System API Running');
});

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);

const eventRoutes = require('./routes/eventRoutes');
app.use('/api/events', eventRoutes);

// ===== ERROR HANDLER (Optional, for production) =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
