const Event = require('../models/Event');

// List all events
exports.listEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Create event (admin only)
exports.createEvent = async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admins only can create events' });
  }
  try {
    const { title, description, eventType, date } = req.body;
    const event = new Event({
      title,
      description,
      eventType,
      date,
      createdBy: req.user.userId
    });
    await event.save();
    res.status(201).json({ message: 'Event created', event });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete event (admin only)
exports.deleteEvent = async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admins only can delete events' });
  }
  try {
    const eventId = req.params.id;
    await Event.findByIdAndDelete(eventId);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
