const Gallery = require("../models/Gallery");
const path = require("path");
const fs = require("fs");

/* ---------------- GET all images for a trip ---------------- */
exports.getGalleryImages = async (req, res) => {
  try {
    const { tripId } = req.params;
    const images = await Gallery.find({ trip: tripId })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    console.error("❌ Error fetching gallery:", err);
    res.status(500).json({ error: "Failed to fetch gallery images" });
  }
};

/* ---------------- POST upload a new image ---------------- */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const { tripId } = req.params;

    const newImage = await Gallery.create({
      trip: tripId,
      uploadedBy: req.user.id,
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
    });

    const populated = await newImage.populate("uploadedBy", "name email");
    res.status(201).json(populated);
  } catch (err) {
    console.error("❌ Error uploading image:", err);
    res.status(500).json({ error: "Image upload failed" });
  }
};

/* ---------------- DELETE image ---------------- */
exports.deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const image = await Gallery.findById(imageId);

    if (!image) return res.status(404).json({ error: "Image not found" });

    // Only uploader or admin can delete
    if (image.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this image" });
    }

    // Remove file from disk
    const filePath = path.join(__dirname, "..", "uploads", image.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await image.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error deleting image:", err);
    res.status(500).json({ error: "Failed to delete image" });
  }
};
