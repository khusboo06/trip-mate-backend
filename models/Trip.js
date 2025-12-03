
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/* -------------------- MEMBER SUB-SCHEMA -------------------- */
const memberSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "member"],
    default: "member",
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

/* -------------------- ITINERARY SUB-SCHEMA -------------------- */
const itinerarySchema = new Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  startTime: String,
  endTime: String,
  location: {
    name: String,
    coords: {
      lat: Number,
      lng: Number,
    },
  },
  description: String,
});

/* -------------------- GALLERY SUB-SCHEMA -------------------- */
const gallerySchema = new Schema({
  url: String,
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  uploadedAt: { type: Date, default: Date.now },
});

/* -------------------- MAIN TRIP SCHEMA -------------------- */
const tripSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    destination: {
      type: String,
      required: false, 
      trim: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [memberSchema],

    itinerary: [itinerarySchema],

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    inviteCode: {
      type: String,
      unique: true,
      required: true,
    },

    settings: {
      currency: { type: String, default: "INR" },
      locationSharing: { type: Boolean, default: false },
    },

    gallery: [gallerySchema],
  },
  {
    timestamps: true, 
  }
);

/* -------------------- EXPORT MODEL -------------------- */
module.exports = mongoose.model("Trip", tripSchema);
