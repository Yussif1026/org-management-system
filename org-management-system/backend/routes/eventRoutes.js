const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');

// List all events (public for all members)
router.get('/', eventController.listEvents);

// Create event (admin only)
router.post('/', authMiddleware, eventController.createEvent);

// Delete event (admin only)
router.delete('/:id', authMiddleware, eventController.deleteEvent);

module.exports = router;
