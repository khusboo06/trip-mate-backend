const Trip = require('../models/Trip.js');

/* -------------------- CREATE POLL -------------------- */
const createPoll = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { question, options } = req.body; 

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: 'Question and at least 2 options are required' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // 🔒 Only members can create polls
    const userId = req.user._id.toString();
    const isMember = trip.members.some(m => m.user.toString() === userId);
    if (!isMember) return res.status(403).json({ message: 'Access denied. Not a member of this trip.' });

    // Create poll
    const poll = {
      question,
      options: options.map(o => ({ text: o.text, votes: 0 })),
      voters: []
    };
    if (!trip.polls) trip.polls = [];
    trip.polls.push(poll);

    await trip.save();
    res.status(201).json({ message: 'Poll created', poll });
  } catch (err) {
    console.error('❌ Create poll failed:', err);
    res.status(500).json({ error: err.message });
  }
};

/* -------------------- VOTE ON POLL -------------------- */
const votePoll = async (req, res) => {
  try {
    const { tripId, pollIndex, optionIndex } = req.params;
    const userId = req.user._id.toString();

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    
    const isMember = trip.members.some(m => m.user.toString() === userId);
    if (!isMember) return res.status(403).json({ message: 'Access denied. Not a member of this trip.' });

    const poll = trip.polls[pollIndex];
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    poll.voters = poll.voters || [];
    if (poll.voters.includes(userId)) {
      return res.status(400).json({ message: 'You have already voted' });
    }

    poll.options[optionIndex].votes += 1;
    poll.voters.push(userId);

    await trip.save();
    res.json({ message: 'Vote registered', poll });
  } catch (err) {
    console.error('❌ Vote poll failed:', err);
    res.status(500).json({ error: err.message });
  }
};

/* -------------------- GET POLLS -------------------- */
const getPolls = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

   
    const userId = req.user._id.toString();
    const isMember = trip.members.some(m => m.user.toString() === userId);
    if (!isMember) return res.status(403).json({ message: 'Access denied. Not a member of this trip.' });

    res.json(trip.polls || []);
  } catch (err) {
    console.error('❌ Get polls failed:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createPoll, votePoll, getPolls };
