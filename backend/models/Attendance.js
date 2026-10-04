const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  userName: {
    type: String,
    required: [true, "User name is required"],
    trim: true
  },
  userEmail: {
    type: String,
    default: "",
    trim: true
  },
  department: {
    type: String,
    default: "General",
    trim: true
  },
  confidence: {
    type: Number,
    default: 100 // Match confidence percentage (e.g., 92.5%)
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true
  },
  time: {
    type: String, // Format: HH:MM:SS AM/PM
    required: true
  },
  status: {
    type: String,
    enum: ["Present", "Verified", "Late", "Access Granted"],
    default: "Present"
  },
  photoSnapshot: {
    type: String, // Base64 thumbnail of the detected face frame
    default: ""
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model("Attendance", attendanceSchema);
