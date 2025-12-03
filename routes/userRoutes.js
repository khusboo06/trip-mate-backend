const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const { authMiddleware } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Trip = require("../models/Trip");

/* ---------------------------------------------------
   🧩 MULTER STORAGE for Avatar Upload
----------------------------------------------------*/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/avatars");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });


router.put("/update", authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both current and new passwords are required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Verify existing password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash || "");
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // ✅ Hash and update new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({ message: "✅ Password updated successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/* ---------------------------------------------------
   🖼️ UPLOAD USER AVATAR
----------------------------------------------------*/
router.post(
  "/avatar",
  authMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { avatarUrl },
        { new: true }
      );

      res.json({
        message: "Avatar uploaded successfully",
        avatarUrl: user.avatarUrl,
      });
    } catch (err) {
      console.error("Avatar upload failed:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* ---------------------------------------------------
   🚀 GET CURRENT USER INFO
----------------------------------------------------*/
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Fetch user failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------------------------------
    USER STATS (Trips Created, Joined, Member Since)
----------------------------------------------------*/
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Trips the user is part of
    const tripsJoined = await Trip.countDocuments({
      "members.user": userId,
    });

    // Trips where user is admin
    const tripsCreated = await Trip.countDocuments({
      "members.user": userId,
      "members.role": "admin",
    });

    // Get user's registration year
    const user = await User.findById(userId);
    const memberSince = user.createdAt
      ? new Date(user.createdAt).getFullYear()
      : "N/A";

    res.json({
      memberSince,
      tripsJoined,
      tripsCreated,
    });
  } catch (err) {
    console.error("User stats fetch error:", err);
    res.status(500).json({ message: "Server error while fetching stats" });
  }
});

module.exports = router;
