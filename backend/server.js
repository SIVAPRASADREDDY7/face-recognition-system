const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins (supports Vercel, localhost, and custom domains)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Body parser with 50mb limit for face snapshots
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const path = require("path");

// Serve frontend static files (for convenient unified local testing)
app.use(express.static(path.join(__dirname, "../frontend")));

// Health Check Endpoint (useful for Render web service status & pinging)
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    message: "Face Recognition API is running successfully!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// API Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/stats", require("./routes/statsRoutes"));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.url}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message
  });
});

// Start Server & Connect Database
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Face Recognition Server running on http://localhost:${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  });
};

startServer();
