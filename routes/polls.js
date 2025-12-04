const express = require("express");
const router = express.Router();
const Poll = require("../models/Poll.js");
const jwt = require("jsonwebtoken");

// --- Auth middleware ---
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Unauthorized" });
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (e) {
    res.status(401).json({ message: "Invalid token" });
  }
}

router.use(authMiddleware);

// --- Create poll ---
router.post("/", async (req, res) => {
  try {
    const { tripId, question, options } = req.body;
    if (!tripId || !question || !options || options.length < 2)
      return res.status(400).json({ message: "Invalid poll data" });

    const poll = await Poll.create({
      trip: tripId,
      question,
      options: options.map((opt) => ({ text: opt, votes: [] })),
      createdBy: req.userId,
    });

    res.status(201).json(poll);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Get polls for a trip ---
router.get("/:tripId", async (req, res) => {
  try {
    const polls = await Poll.find({ trip: req.params.tripId });
    res.json(polls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Vote on a poll option ---
router.post("/:pollId/vote", async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const userId = req.userId;

    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ message: "Poll not found" });

    //  Check if user already voted in any option
    const alreadyVoted = poll.options.some((o) => o.votes.includes(userId));
    if (alreadyVoted) {
      return res.status(400).json({ message: "You have already voted in this poll" });
    }

    //  Push vote to the selected option
    poll.options[optionIndex].votes.push(userId);
    await poll.save();

    res.json(poll);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
