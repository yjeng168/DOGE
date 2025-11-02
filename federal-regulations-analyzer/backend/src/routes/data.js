const express = require("express");
const DataImporter = require("../services/dataImporter");
const { initializeDatabase } = require("../utils/initDatabase");
const router = express.Router();

// POST /api/data/import - Import sample data
router.post("/import", async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Data import started in background",
      note: "Check server logs for progress",
    });

    // Start import in background
    const importer = new DataImporter();
    importer.importSampleData().catch((error) => {
      console.error("Background import failed:", error);
    });
  } catch (error) {
    console.error("Error starting data import:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start data import",
    });
  }
});

// POST /api/data/init - Initialize database
router.post("/init", async (req, res) => {
  try {
    await initializeDatabase();
    res.json({
      success: true,
      message: "Database initialized successfully",
    });
  } catch (error) {
    console.error("Error initializing database:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize database",
    });
  }
});

// GET /api/data/status - Get import status
router.get("/status", async (req, res) => {
  try {
    const { Agency, Regulation } = require("../models");

    const [agencyCount, regulationCount] = await Promise.all([
      Agency.count(),
      Regulation.count(),
    ]);

    res.json({
      success: true,
      data: {
        agencies: agencyCount,
        regulations: regulationCount,
        hasData: agencyCount > 0 && regulationCount > 0,
        lastChecked: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error checking data status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check data status",
    });
  }
});

module.exports = router;
