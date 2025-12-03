const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");
const path = require("path");


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Only image files are allowed"));
    } else {
      cb(null, true);
    }
  },
});


router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    const filePath = req.file.path;

    
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "tripmate_messages",
      resource_type: "image",
    });

    
    fs.unlink(filePath, (err) => {
      if (err) console.warn("Failed to delete temp file:", err);
    });

    
    return res.status(200).json({
      success: true,
      url: result.secure_url,
      type: "image",
      public_id: result.public_id,
    });
  } catch (err) {
    console.error("Upload Error:", err.message);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

module.exports = router;
