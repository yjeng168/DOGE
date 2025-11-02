const express = require("express");
const router = express.Router();

// Import the analysis controller
const analysisController = require("../controllers/analysisController");

// Define routes with proper function references
router.get("/overview", analysisController.getOverview);
router.get("/wordcount", analysisController.getWordCount);

// Health check for analysis routes
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Analysis API",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
