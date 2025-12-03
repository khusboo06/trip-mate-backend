const Message = require('../models/Message');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function initSockets(io) {
  // ✅ Authenticate user on socket connection using JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error('No token provided');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded?.id) throw new Error('Invalid token');

      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) throw new Error('User not found');

      socket.user = user; 
      next();
    } catch (err) {
      console.error('❌ Socket auth failed:', err.message);
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.id}, User: ${socket.user.name}`);

    // ✅ Join a specific trip chat room
    socket.on('joinTrip', ({ tripId }) => {
      if (!tripId) return;
      socket.join(tripId);
      console.log(`👥 ${socket.user.name} joined trip room: ${tripId}`);
    });

    // ✅ Send message (text + optional image attachments)
    socket.on('sendMessage', async ({ tripId, text, attachments }) => {
      try {
        if (!tripId || (!text && !attachments?.length)) return;

        // Save message to MongoDB
        const msg = await Message.create({
          trip: tripId,
          sender: socket.user._id,
          text: text || "",
          attachments: attachments || [], 
        });

        await msg.populate('sender', 'name');

        // Emit message to all clients in the same trip room
        io.to(tripId).emit('newMessage', msg);

        console.log(`📩 Message sent in trip ${tripId} by ${socket.user.name}`);
      } catch (err) {
        console.error('Error sending message:', err.message);
      }
    });

    // ✅ Handle user disconnect
    socket.on('disconnect', () => {
      console.log(`⚡ Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = { initSockets };
