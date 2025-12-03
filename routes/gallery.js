const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getGalleryImages,
  uploadImage,
  deleteImage,
} = require("../controllers/galleryController");

/* ---------------- Multer Setup ---------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* ---------------- Routes ---------------- */
router.get("/trips/:tripId/gallery", authMiddleware, getGalleryImages);
router.post(
  "/trips/:tripId/gallery",
  authMiddleware,
  upload.single("image"),
  uploadImage
);
router.delete("/trips/:tripId/gallery/:imageId", authMiddleware, deleteImage);

module.exports = router;
