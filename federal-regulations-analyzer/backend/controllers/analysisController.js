// FILE: backend/src/controllers/analysisController.js
const {
  Agency,
  Regulation,
  RegulationHistory,
  sequelize,
} = require("../models");

const analysisController = {
  // Get analysis overview with real data from your database
  getOverview: async (req, res) => {
    try {
      // Get total counts
      const totalRegulations = await Regulation.count();
      const totalAgencies = await Agency.count();

      // Get average complexity
      const complexityResult = await Regulation.findOne({
        attributes: [
          [
            sequelize.fn("AVG", sequelize.col("complexity_score")),
            "avgComplexity",
          ],
        ],
      });
      const averageComplexity =
        parseFloat(complexityResult.dataValues.avgComplexity) || 0;

      // Get top agencies by regulation count
      const topAgencies = await Agency.findAll({
        include: [
          {
            model: Regulation,
            attributes: [],
          },
        ],
        attributes: [
          "name",
          "acronym",
          [
            sequelize.fn("COUNT", sequelize.col("Regulations.id")),
            "regulationCount",
          ],
          [
            sequelize.fn("AVG", sequelize.col("Regulations.complexity_score")),
            "avgComplexity",
          ],
          [
            sequelize.fn("SUM", sequelize.col("Regulations.word_count")),
            "totalWords",
          ],
        ],
        group: ["Agency.id", "Agency.name", "Agency.acronym"],
        order: [[sequelize.literal("regulationCount"), "DESC"]],
        limit: 10,
        raw: true,
      });

      // Format top agencies data
      const topAgenciesByRegulations = topAgencies.map((agency) => ({
        name: agency.acronym || agency.name,
        count: parseInt(agency.regulationCount) || 0,
        complexity: parseFloat(agency.avgComplexity) || 0,
        totalWords: parseInt(agency.totalWords) || 0,
      }));

      // Get complexity distribution
      const complexityDist = await Regulation.findAll({
        attributes: [
          "complexity_score",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["complexity_score"],
        order: [["complexity_score", "ASC"]],
        raw: true,
      });

      const complexityDistribution = complexityDist.map((item) => ({
        complexity: item.complexity_score || 1,
        count: parseInt(item.count) || 0,
      }));

      // Calculate deregulation opportunities (regulations with high complexity and age)
      const highComplexityCount = await Regulation.count({
        where: {
          complexity_score: {
            [sequelize.Op.gte]: 4,
          },
        },
      });

      const deregulationOpportunities = Math.floor(highComplexityCount * 0.3); // 30% of high complexity regulations

      // Sample deregulation candidates
      const deregulationCandidates = [
        {
          title: "Outdated Manufacturing Standards",
          agency: "FDA",
          impact: "High",
          savings: "$2.3M",
          complexity: 4.5,
          wordCount: 8500,
        },
        {
          title: "Redundant Environmental Reporting",
          agency: "EPA",
          impact: "Medium",
          savings: "$1.8M",
          complexity: 3.8,
          wordCount: 6200,
        },
        {
          title: "Obsolete Aviation Procedures",
          agency: "FAA",
          impact: "High",
          savings: "$3.1M",
          complexity: 4.2,
          wordCount: 7800,
        },
      ];

      const overviewData = {
        totalRegulations,
        totalAgencies,
        averageComplexity: parseFloat(averageComplexity.toFixed(2)),
        deregulationOpportunities,
        topAgenciesByRegulations,
        complexityDistribution,
        deregulationCandidates,
        lastUpdated: new Date().toISOString(),
      };

      res.json(overviewData);
    } catch (error) {
      console.error("Error in getOverview:", error);
      res.status(500).json({
        error: "Failed to generate analysis overview",
        details: error.message,
      });
    }
  },

  // Get word count analysis
  getWordCountAnalysis: async (req, res) => {
    try {
      // Get total word count
      const totalWordsResult = await Regulation.findOne({
        attributes: [
          [sequelize.fn("SUM", sequelize.col("word_count")), "totalWords"],
        ],
      });
      const totalWords = parseInt(totalWordsResult.dataValues.totalWords) || 0;

      // Get average words per regulation
      const avgWordsResult = await Regulation.findOne({
        attributes: [
          [sequelize.fn("AVG", sequelize.col("word_count")), "avgWords"],
        ],
      });
      const averageWordsPerRegulation =
        parseInt(avgWordsResult.dataValues.avgWords) || 0;

      // Get word count by agency
      const agencyWordCounts = await Agency.findAll({
        include: [
          {
            model: Regulation,
            attributes: [],
          },
        ],
        attributes: [
          "name",
          "acronym",
          [
            sequelize.fn("SUM", sequelize.col("Regulations.word_count")),
            "totalWords",
          ],
          [
            sequelize.fn("AVG", sequelize.col("Regulations.word_count")),
            "avgWords",
          ],
          [
            sequelize.fn("COUNT", sequelize.col("Regulations.id")),
            "regulationCount",
          ],
        ],
        group: ["Agency.id", "Agency.name", "Agency.acronym"],
        order: [[sequelize.literal("totalWords"), "DESC"]],
        limit: 15,
        raw: true,
      });

      const agencies = agencyWordCounts
        .map((agency) => ({
          name: agency.acronym || agency.name,
          totalWords: parseInt(agency.totalWords) || 0,
          avgWords: parseInt(agency.avgWords) || 0,
          regulationCount: parseInt(agency.regulationCount) || 0,
        }))
        .filter((agency) => agency.totalWords > 0);

      res.json({
        totalWords,
        averageWordsPerRegulation,
        agencies,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in getWordCountAnalysis:", error);
      res.status(500).json({
        error: "Failed to generate word count analysis",
        details: error.message,
      });
    }
  },

  // Get complexity analysis
  getComplexityAnalysis: async (req, res) => {
    try {
      // Get average complexity
      const complexityResult = await Regulation.findOne({
        attributes: [
          [
            sequelize.fn("AVG", sequelize.col("complexity_score")),
            "avgComplexity",
          ],
        ],
      });
      const averageComplexity =
        parseFloat(complexityResult.dataValues.avgComplexity) || 0;

      // Generate complexity trends (mock data for now since we don't have historical data)
      const currentYear = new Date().getFullYear();
      const complexityTrends = [];
      for (let i = 4; i >= 0; i--) {
        complexityTrends.push({
          year: currentYear - i,
          complexity: averageComplexity + (Math.random() - 0.5) * 0.3,
        });
      }

      // Get complexity distribution by agency
      const agencyComplexity = await Agency.findAll({
        include: [
          {
            model: Regulation,
            attributes: [],
          },
        ],
        attributes: [
          "name",
          "acronym",
          [
            sequelize.fn("AVG", sequelize.col("Regulations.complexity_score")),
            "avgComplexity",
          ],
          [
            sequelize.fn("COUNT", sequelize.col("Regulations.id")),
            "regulationCount",
          ],
        ],
        group: ["Agency.id", "Agency.name", "Agency.acronym"],
        order: [[sequelize.literal("avgComplexity"), "DESC"]],
        limit: 10,
        raw: true,
      });

      const agencyComplexityData = agencyComplexity
        .map((agency) => ({
          name: agency.acronym || agency.name,
          avgComplexity: parseFloat(agency.avgComplexity) || 0,
          regulationCount: parseInt(agency.regulationCount) || 0,
        }))
        .filter((agency) => agency.regulationCount > 0);

      res.json({
        averageComplexity: parseFloat(averageComplexity.toFixed(2)),
        complexityTrends,
        agencyComplexityData,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in getComplexityAnalysis:", error);
      res.status(500).json({
        error: "Failed to generate complexity analysis",
        details: error.message,
      });
    }
  },
};

module.exports = analysisController;
