const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },                  // User's name
  email: { type: String, required: true, unique: true },   // User's email
  passwordHash: { type: String, required: true },          // Hashed password
  avatarUrl: String,                                       // Optional profile picture URL

  // Fields for OTP-based forgot/reset password functionality
  resetPasswordOTP: Number,                                // 6-digit OTP for password reset
  resetPasswordExpiry: Date,                               // OTP expiry timestamp

  createdAt: { type: Date, default: Date.now }             // Account creation time
});

// Export the model
module.exports = mongoose.model('User', userSchema);




