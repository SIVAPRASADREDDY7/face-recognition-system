const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    default: "Member",
    trim: true
  },
  department: {
    type: String,
    default: "General",
    trim: true
  },
  // 128-dimensional float vectors representing facial landmarks and embeddings
  // Supports multiple samples per user for higher recognition accuracy
  descriptors: {
    type: [[Number]],
    required: [true, "Face descriptor vector is required"]
  },
  photo: {
    type: String, // Base64 thumbnail preview
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);
