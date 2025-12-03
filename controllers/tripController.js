
const Trip = require("../models/Trip.js");
const User = require("../models/User.js");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

/* -------------------- CREATE TRIP -------------------- */
const createTrip = async (req, res) => {
  try {
    console.log("Create Trip Body:", req.body);
    const {
      title,
      description,
      destination, 
      startDate,
      endDate,
      memberEmails,
    } = req.body;

    const owner = req.user._id;

    if (!title || !startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Missing required fields (title, dates)" });
    }

    // Generate a unique 6-character invite code
    const inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    
    const trip = await Trip.create({
      title,
      description,
      destination, 
      owner,
      members: [
        { user: owner, role: "admin", joinedAt: new Date(), isActive: true },
      ],
      startDate,
      endDate,
      inviteCode,
    });

    /* ---------- Send Email Invites ---------- */
    if (memberEmails && memberEmails.length > 0) {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        for (const email of memberEmails) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: `TripMate - Invitation to Join Trip: ${title}`,
            text: `You’ve been invited to join the trip "${title}".
Destination: ${destination || "Not specified"}
Use this code to join: ${inviteCode}`,
          });
        }
      } catch (emailErr) {
        console.error("Email send failed:", emailErr.message);
      }
    }

    res.status(201).json(trip);
  } catch (err) {
    console.error("Trip creation failed:", err);
    res.status(500).json({ error: err.message });
  }
};

/* -------------------- GET SINGLE TRIP -------------------- */
const getTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate(
      "members.user",
      "name email"
    );

    if (!trip) return res.status(404).json({ message: "Trip not found" });

    
    const isMember = trip.members.some((m) => {
      if (!m.user) return false;
      return m.user._id.toString() === req.user._id.toString();
    });

    if (!isMember)
      return res
        .status(403)
        .json({ message: "Access denied. Not a member of this trip." });

    res.json(trip);
  } catch (err) {
    console.error("Get trip failed:", err);
    res.status(500).json({ error: err.message });
  }
};

/* -------------------- GET USER'S TRIPS -------------------- */
const getUserTrips = async (req, res) => {
  try {
    const userId = req.user._id;

    const trips = await Trip.find({
      $or: [{ owner: userId }, { "members.user": userId }],
    }).populate("members.user", "name email");

    res.json(trips);
  } catch (err) {
    console.error("Get user trips failed:", err);
    res.status(500).json({ error: err.message });
  }
};

/* -------------------- JOIN TRIP BY CODE -------------------- */
const joinTripByCode = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user._id;

    const trip = await Trip.findOne({ inviteCode: code });
    if (!trip)
      return res
        .status(404)
        .json({ message: "Invalid or expired trip code" });

    if (trip.members.some((m) => m.user.toString() === userId.toString())) {
      return res
        .status(400)
        .json({ message: "You are already a member of this trip" });
    }

    trip.members.push({
      user: userId,
      role: "member",
      joinedAt: new Date(),
      isActive: true,
    });

    await trip.save();
    res.json({ message: "Successfully joined the trip", trip });
  } catch (err) {
    console.error("Join trip failed:", err);
    res.status(500).json({ error: err.message });
  }
};

/* -------------------- UPDATE TRIP -------------------- */
const updateTrip = async (req, res) => {
  try {
    const { title, description, destination } = req.body; 
    const trip = await Trip.findById(req.params.id);

    if (!trip) return res.status(404).json({ message: "Trip not found" });

    trip.title = title || trip.title;
    trip.description = description || trip.description;
    trip.destination = destination || trip.destination; 

    await trip.save();

    res.json(trip);
  } catch (err) {
    console.error("Error updating trip:", err);
    res.status(500).json({ message: "Error updating trip" });
  }
};

/* -------------------- EXPORT ALL -------------------- */
module.exports = {
  createTrip,
  getTrip,
  getUserTrips,
  joinTripByCode,
  updateTrip,
};
