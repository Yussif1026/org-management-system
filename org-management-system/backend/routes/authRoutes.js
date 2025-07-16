const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Register
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Get own profile
router.get('/profile/:id', authMiddleware, authController.getProfile);

// Get all members (admins only)
router.get('/members', authMiddleware, authController.getAllMembers);

module.exports = router;
