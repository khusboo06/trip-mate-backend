// const Gallery = require("../models/Gallery");
// const path = require("path");
// const fs = require("fs");

// /* ---------------- GET all images for a trip ---------------- */
// exports.getGalleryImages = async (req, res) => {
//   try {
//     const { tripId } = req.params;
//     const images = await Gallery.find({ trip: tripId })
//       .populate("uploadedBy", "name email")
//       .sort({ createdAt: -1 });
//     res.json(images);
//   } catch (err) {
//     console.error("❌ Error fetching gallery:", err);
//     res.status(500).json({ error: "Failed to fetch gallery images" });
//   }
// };

// /* ---------------- POST upload a new image ---------------- */
// exports.uploadImage = async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ error: "No image uploaded" });

//     const { tripId } = req.params;

//     const newImage = await Gallery.create({
//       trip: tripId,
//       uploadedBy: req.user.id,
//       url: `/uploads/${req.file.filename}`,
//       filename: req.file.filename,
//     });

//     const populated = await newImage.populate("uploadedBy", "name email");
//     res.status(201).json(populated);
//   } catch (err) {
//     console.error("❌ Error uploading image:", err);
//     res.status(500).json({ error: "Image upload failed" });
//   }
// };

// /* ---------------- DELETE image ---------------- */
// exports.deleteImage = async (req, res) => {
//   try {
//     const { imageId } = req.params;
//     const image = await Gallery.findById(imageId);

//     if (!image) return res.status(404).json({ error: "Image not found" });

//     // Only uploader or admin can delete
//     if (image.uploadedBy.toString() !== req.user.id) {
//       return res.status(403).json({ error: "Not authorized to delete this image" });
//     }

//     // Remove file from disk
//     const filePath = path.join(__dirname, "..", "uploads", image.filename);
//     if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

//     await image.deleteOne();
//     res.json({ success: true });
//   } catch (err) {
//     console.error("❌ Error deleting image:", err);
//     res.status(500).json({ error: "Failed to delete image" });
//   }
// };



const Gallery = require("../models/Gallery");
const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");

/* ---------------- Cloudinary Config ---------------- */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    if (!req.file)
      return res.status(400).json({ error: "No image uploaded" });

    const { tripId } = req.params;
    const filePath = req.file.path;

    // ☁️ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "tripmate_gallery",
      resource_type: "image",
    });

    // 🧹 Delete temporary file from server
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
};

/* ---------------- DELETE image ---------------- */
exports.deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await Gallery.findById(imageId);
    if (!image)
      return res.status(404).json({ error: "Image not found" });

    // Only uploader can delete
    if (image.uploadedBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this image" });
    }

    // ☁️ Delete from Cloudinary
    await cloudinary.uploader.destroy(image.filename);

    await image.deleteOne();

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error deleting image:", err);
    res.status(500).json({ error: "Failed to delete image" });
  }
};
