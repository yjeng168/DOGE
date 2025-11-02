const express = require("express");
const router = express.Router();

// Import the agencies controller
const agenciesController = require("../controllers/agenciesController");

// Define routes with proper function references
router.get("/", agenciesController.getAllAgencies);
router.get("/:id", agenciesController.getAgencyById);

// Health check for agencies routes
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Agencies API",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
