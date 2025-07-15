const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from .env
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ===== ROUTES =====
app.get('/', (req, res) => {
  res.send('Organisation Management System API Running');
});

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);

// ======= EVENT ROUTES (new) =======
const eventRoutes = require('./routes/eventRoutes');
app.use('/api/events', eventRoutes);

// ===== ERROR HANDLER (Optional, for production) =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
