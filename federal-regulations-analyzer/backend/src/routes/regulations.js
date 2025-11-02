const express = require("express");
const { Regulation, Agency, RegulationHistory } = require("../models");
const router = express.Router();

// GET /api/regulations - List regulations with pagination
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, agencyId } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = agencyId ? { agencyId } : {};

    const { count, rows } = await Regulation.findAndCountAll({
      where: whereClause,
      include: [{ model: Agency, attributes: ["name", "shortName"] }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["lastUpdated", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        regulations: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching regulations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch regulations",
    });
  }
});

// GET /api/regulations/:id - Get specific regulation
router.get("/:id", async (req, res) => {
  try {
    const regulation = await Regulation.findByPk(req.params.id, {
      include: [
        { model: Agency, attributes: ["name", "shortName", "titleNumber"] },
        {
          model: RegulationHistory,
          attributes: ["changeType", "recordedAt"],
          order: [["recordedAt", "DESC"]],
          limit: 10,
        },
      ],
    });

    if (!regulation) {
      return res.status(404).json({
        success: false,
        error: "Regulation not found",
      });
    }

    res.json({
      success: true,
      data: regulation,
    });
  } catch (error) {
    console.error("Error fetching regulation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch regulation",
    });
  }
});

module.exports = router;
