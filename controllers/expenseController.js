const Expense = require('../models/Expenses.js');
const Trip = require('../models/Trip.js');
const { equalSplit } = require('../utils/splitCalculator');

/* -------------------- ADD EXPENSE -------------------- */
const addExpense = async (req, res) => {
  try {
    const { tripId, title, amount, paidBy, splitType } = req.body;
    console.log("Incoming expense data:", req.body);

    // Find the trip
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Check if the logged-in user is a member
    const userId = req.user._id.toString();
    const isMember = trip.members.some(m => m.user.toString() === userId);
    if (!isMember) return res.status(403).json({ message: 'You are not a member of this trip' });

    // Prepare splits
    const members = trip.members.map(m => m.user.toString());
    let splits = [];

    if (splitType === 'equal') {
      const per = Math.round((amount / members.length) * 100) / 100;
      splits = members.map(u => ({ user: u, amount: per }));
    }

    // Create expense
    const expense = await Expense.create({
      trip: tripId,
      title,
      amount,
      paidBy: paidBy || userId,
      splits,
      splitType,
    });

    res.status(201).json(expense);

  } catch (err) {
    console.error("❌ Error adding expense:", err);
    res.status(500).json({ error: err.message });
  }
};

/* -------------------- LIST EXPENSES -------------------- */
const listExpenses = async (req, res) => {
  try {
    const tripId = req.params.tripId;

    // Find the trip
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Check if the logged-in user is a member
    const userId = req.user._id.toString();
    const isMember = trip.members.some(m => m.user.toString() === userId);
    if (!isMember) return res.status(403).json({ message: 'You are not a member of this trip' });

    // Fetch expenses for the trip
    const list = await Expense.find({ trip: tripId }).populate('paidBy', 'name email');
    res.json(list);

  } catch (err) {
    console.error("❌ Error listing expenses:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { addExpense, listExpenses };
