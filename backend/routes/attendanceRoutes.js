const express = require("express");
const router = express.Router();
const dataStore = require("../config/dataStore");

// Cache recent logs in-memory to prevent spamming duplicate logs within 60 seconds
const recentLogCache = new Map();

// POST /api/attendance/log - Log a recognized face scan
router.post("/log", async (req, res) => {
  try {
    const { userId, userName, userEmail, department, confidence, photoSnapshot } = req.body;

    if (!userName) {
      return res.status(400).json({
        success: false,
        message: "User name is required for attendance log"
      });
    }

    // Cooldown check (prevent repeated logs for the same user within 60 seconds)
    const cacheKey = (userId || userName).toString().toLowerCase();
    const lastLogged = recentLogCache.get(cacheKey);
    const now = Date.now();

    if (lastLogged && now - lastLogged < 60 * 1000) {
      const remainingSeconds = Math.ceil((60 * 1000 - (now - lastLogged)) / 1000);
      return res.json({
        success: true,
        cooldown: true,
        message: `Attendance already recorded for ${userName}. Next scan available in ${remainingSeconds}s.`
      });
    }

    const todayDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    const newLog = await dataStore.createAttendance({
      userId: userId || null,
      userName: userName.trim(),
      userEmail: (userEmail || "").trim(),
      department: department || "General",
      confidence: confidence ? Math.round(confidence * 10) / 10 : 95.0,
      date: todayDate,
      time: currentTime,
      status: "Present",
      photoSnapshot: photoSnapshot || ""
    });

    recentLogCache.set(cacheKey, now);

    res.status(201).json({
      success: true,
      cooldown: false,
      message: `✅ Attendance recorded for ${userName}!`,
      log: newLog
    });
  } catch (error) {
    console.error("Attendance log error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record attendance",
      error: error.message
    });
  }
});

// GET /api/attendance - Fetch attendance records with filtering
router.get("/", async (req, res) => {
  try {
    const { date, userName, limit } = req.query;
    const logs = await dataStore.getAttendance({
      date: date || "",
      userName: userName || "",
      limit: parseInt(limit) || 100
    });

    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error("Fetch attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance logs",
      error: error.message
    });
  }
});

// GET /api/attendance/export - Export attendance logs as CSV
router.get("/export", async (req, res) => {
  try {
    const { date } = req.query;
    const logs = await dataStore.getAttendance({ date: date || "", limit: 1000 });

    let csv = "ID,Name,Email,Department,Date,Time,Status,Confidence\n";
    logs.forEach((log) => {
      const id = log._id || "";
      const name = `"${(log.userName || "").replace(/"/g, '""')}"`;
      const email = `"${(log.userEmail || "").replace(/"/g, '""')}"`;
      const dept = `"${(log.department || "").replace(/"/g, '""')}"`;
      const d = log.date || "";
      const t = log.time || "";
      const st = log.status || "Present";
      const conf = `${log.confidence || 100}%`;
      csv += `${id},${name},${email},${dept},${d},${t},${st},${conf}\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment(`attendance-report-${date || "all"}.csv`);
    res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).send("Error exporting CSV");
  }
});

module.exports = router;
