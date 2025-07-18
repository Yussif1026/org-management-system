const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// ===== CORS CONFIGURATION (PRODUCTION + LOCAL TESTING) =====
const allowedOrigins = [
  'https://org-management-system-1.onrender.com', // Deployed frontend
  'http://localhost:5500' // Local dev (for you)
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman) or if in the whitelist
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed from this origin'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight (OPTIONS) requests for all routes
app.options('*', cors());

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

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
