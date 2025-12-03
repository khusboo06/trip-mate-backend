const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const Message = require('../models/Message');

// GET messages for a trip
router.get('/:tripId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ trip: req.params.tripId })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new message
router.post('/', authMiddleware, async (req, res) => {
  const { tripId, text } = req.body;
  const senderId = req.user._id;

  if (!tripId || !text) return res.status(400).json({ message: 'Invalid data' });

  try {
    const msg = await Message.create({ trip: tripId, sender: senderId, text });
    await msg.populate('sender', 'name');
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
