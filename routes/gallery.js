// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const path = require("path");
// const { authMiddleware } = require("../middleware/authMiddleware");
// const {
//   getGalleryImages,
//   uploadImage,
//   deleteImage,
// } = require("../controllers/galleryController");

// /* ---------------- Multer Setup ---------------- */
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, "..", "uploads"));
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage });

// /* ---------------- Routes ---------------- */
// router.get("/trips/:tripId/gallery", authMiddleware, getGalleryImages);
// router.post(
//   "/trips/:tripId/gallery",
//   authMiddleware,
//   upload.single("image"),
//   uploadImage
// );
// router.delete("/trips/:tripId/gallery/:imageId", authMiddleware, deleteImage);

// module.exports = router;






const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");
const { authMiddleware } = require("../middleware/authMiddleware");
const Gallery = require("../models/Gallery");

/* ---------------- Cloudinary Config ---------------- */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ---------------- Multer Setup (Temp Storage) ---------------- */
const upload = multer({
  dest: "uploads/", // temporary folder
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error("Only image files are allowed"));
    } else {
      cb(null, true);
    }
  },
});

/* ---------------- GET Gallery Images ---------------- */
router.get("/trips/:tripId/gallery", authMiddleware, async (req, res) => {
  try {
    const images = await Gallery.find({ trip: req.params.tripId })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(images);
  } catch (err) {
    console.error("❌ Error fetching gallery:", err);
    res.status(500).json({ error: "Failed to fetch gallery images" });
  }
});

/* ---------------- POST Upload Image ---------------- */
router.post(
  "/trips/:tripId/gallery",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "No image uploaded" });

      const { tripId } = req.params;
      const filePath = req.file.path;

      // ☁️ Upload to Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "tripmate_gallery",
        resource_type: "image",
      });

      // 🧹 Delete temp file
      fs.unlink(filePath, (err) => {
        if (err) console.warn("Temp file delete failed:", err);
      });

      const newImage = await Gallery.create({
        trip: tripId,
        uploadedBy: req.user.id,
        url: result.secure_url,     // Cloudinary URL
        filename: result.public_id, // Needed for deletion
      });

      const populated = await newImage.populate("uploadedBy", "name email");

      res.status(201).json(populated);
    } catch (err) {
      console.error("❌ Error uploading image:", err);
      res.status(500).json({ error: "Image upload failed" });
    }
  }
);

/* ---------------- DELETE Image ---------------- */
router.delete(
  "/trips/:tripId/gallery/:imageId",
  authMiddleware,
  async (req, res) => {
    try {
      const { imageId } = req.params;

      const image = await Gallery.findById(imageId);
      if (!image)
        return res.status(404).json({ error: "Image not found" });

      if (image.uploadedBy.toString() !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // ☁️ Delete from Cloudinary
      await cloudinary.uploader.destroy(image.filename);

      await image.deleteOne();

      res.json({ success: true });
    } catch (err) {
      console.error("❌ Error deleting image:", err);
      res.status(500).json({ error: "Failed to delete image" });
    }
  }
);

module.exports = router;
