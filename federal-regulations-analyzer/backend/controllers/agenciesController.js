// FILE: backend/src/controllers/agenciesController.js
const { Agency, Regulation, sequelize } = require("../models");

const agenciesController = {
  // Get all agencies with their regulation statistics
  getAllAgencies: async (req, res) => {
    try {
      const agencies = await Agency.findAll({
        include: [
          {
            model: Regulation,
            attributes: [],
          },
        ],
        attributes: [
          "id",
          "name",
          "acronym",
          "description",
          [
            sequelize.fn("COUNT", sequelize.col("Regulations.id")),
            "regulationCount",
          ],
          [
            sequelize.fn("SUM", sequelize.col("Regulations.word_count")),
            "totalWords",
          ],
          [
            sequelize.fn("AVG", sequelize.col("Regulations.complexity_score")),
            "avgComplexity",
          ],
        ],
        group: [
          "Agency.id",
          "Agency.name",
          "Agency.acronym",
          "Agency.description",
        ],
        order: [["name", "ASC"]],
        raw: true,
      });

      const formattedAgencies = agencies.map((agency) => ({
        id: agency.id,
        name: agency.name,
        acronym: agency.acronym,
        description: agency.description,
        regulationCount: parseInt(agency.regulationCount) || 0,
        totalWords: parseInt(agency.totalWords) || 0,
        avgComplexity: parseFloat(agency.avgComplexity) || 0,
      }));

      res.json(formattedAgencies);
    } catch (error) {
      console.error("Error in getAllAgencies:", error);
      res.status(500).json({
        error: "Failed to fetch agencies",
        details: error.message,
      });
    }
  },

  // Get single agency with detailed information
  getAgency: async (req, res) => {
    try {
      const { id } = req.params;

      const agency = await Agency.findByPk(id, {
        include: [
          {
            model: Regulation,
            attributes: [
              "id",
              "title",
              "part_number",
              "word_count",
              "complexity_score",
              "last_updated",
            ],
          },
        ],
      });

      if (!agency) {
        return res.status(404).json({ error: "Agency not found" });
      }

      // Calculate statistics
      const regulations = agency.Regulations || [];
      const totalWords = regulations.reduce(
        (sum, reg) => sum + (reg.word_count || 0),
        0
      );
      const avgComplexity =
        regulations.length > 0
          ? regulations.reduce(
              (sum, reg) => sum + (reg.complexity_score || 0),
              0
            ) / regulations.length
          : 0;

      const agencyData = {
        id: agency.id,
        name: agency.name,
        acronym: agency.acronym,
        description:
          agency.description ||
          `${agency.name} is responsible for federal regulations in their domain.`,
        regulationCount: regulations.length,
        totalWords,
        avgComplexity: parseFloat(avgComplexity.toFixed(2)),
        regulations: regulations.map((reg) => ({
          id: reg.id,
          title: reg.title,
          partNumber: reg.part_number,
          wordCount: reg.word_count || 0,
          complexity: reg.complexity_score || 0,
          lastUpdated: reg.last_updated,
        })),
      };

      res.json(agencyData);
    } catch (error) {
      console.error("Error in getAgency:", error);
      res.status(500).json({
        error: "Failed to fetch agency details",
        details: error.message,
      });
    }
  },

  // Get agency statistics summary
  getAgenciesStats: async (req, res) => {
    try {
      const totalAgencies = await Agency.count();
      const totalRegulations = await Regulation.count();

      const totalWordsResult = await Regulation.findOne({
        attributes: [
          [sequelize.fn("SUM", sequelize.col("word_count")), "totalWords"],
        ],
      });
      const totalWords =
        parseInt(totalWordsResult?.dataValues?.totalWords) || 0;

      const avgComplexityResult = await Regulation.findOne({
        attributes: [
          [
            sequelize.fn("AVG", sequelize.col("complexity_score")),
            "avgComplexity",
          ],
        ],
      });
      const avgComplexity =
        parseFloat(avgComplexityResult?.dataValues?.avgComplexity) || 0;

      res.json({
        totalAgencies,
        totalRegulations,
        totalWords,
        avgComplexity: parseFloat(avgComplexity.toFixed(2)),
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in getAgenciesStats:", error);
      res.status(500).json({
        error: "Failed to fetch agency statistics",
        details: error.message,
      });
    }
  },
};

module.exports = agenciesController;
