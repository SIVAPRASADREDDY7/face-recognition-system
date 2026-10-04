const express = require("express");
const router = express.Router();
const dataStore = require("../config/dataStore");

// GET /api/stats - Dashboard analytics counts
router.get("/", async (req, res) => {
  try {
    const stats = await dataStore.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
      error: error.message
    });
  }
});

module.exports = router;
