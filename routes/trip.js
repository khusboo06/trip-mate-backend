

const express = require("express");
const router = express.Router();
const {
  createTrip,
  getTrip,
  getUserTrips,
  joinTripByCode,
  updateTrip,
} = require("../controllers/tripController");
const { authMiddleware } = require("../middleware/authMiddleware");
const Trip = require("../models/Trip");

/* -------------------- ROUTES -------------------- */

router.post("/", authMiddleware, createTrip);

router.get("/", authMiddleware, getUserTrips);

router.get("/:tripId", authMiddleware, getTrip);

router.post("/join", authMiddleware, joinTripByCode);

router.put("/:id", authMiddleware, updateTrip);


router.delete("/:id/leave", authMiddleware, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    trip.members = trip.members.filter(
      (m) => m.user.toString() !== req.user._id.toString()
    );

    
    if (trip.members.length === 0) {
      await Trip.findByIdAndDelete(req.params.id);
      return res.json({ message: "Trip deleted (no members left)" });
    }

    await trip.save();
    res.json({ message: "Left the trip successfully" });
  } catch (err) {
    console.error("Error leaving trip:", err);
    res.status(500).json({ message: err.message });
  }
});


router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    
    const isAdmin = trip.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === "admin"
    );

    if (!isAdmin)
      return res
        .status(403)
        .json({ message: "Only the trip admin can delete this trip" });

    await Trip.findByIdAndDelete(req.params.id);
    res.json({ message: "Trip deleted successfully" });
  } catch (err) {
    console.error("Error deleting trip:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
