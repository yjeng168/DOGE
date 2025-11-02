const { sequelize } = require("../models");

const agenciesController = {
  // Get all agencies with regulation counts using your actual columns
  async getAllAgencies(req, res) {
    try {
      console.log("📋 Fetching all agencies...");

      const [agencies] = await sequelize.query(`
        SELECT 
          a.id,
          a.name, 
          a.short_name,
          a.title_number,
          a.description,
          COUNT(r.id) as regulation_count,
          AVG(r.word_count) as avg_word_count,
          SUM(r.word_count) as total_words,
          MAX(r.word_count) as max_word_count
        FROM agencies a
        LEFT JOIN regulations r ON a.id = r.agency_id
        GROUP BY a.id, a.name, a.short_name, a.title_number, a.description
        ORDER BY a.name ASC
      `);

      const formattedAgencies = agencies.map((agency) => ({
        id: agency.id,
        name: agency.name,
        short_name: agency.short_name,
        title_number: agency.title_number,
        description: agency.description,
        regulation_count: parseInt(agency.regulation_count || 0),
        avg_word_count: Math.round(parseFloat(agency.avg_word_count || 0)),
        total_words: parseInt(agency.total_words || 0),
        max_word_count: parseInt(agency.max_word_count || 0),
        complexity_score: Math.round(
          parseFloat(agency.avg_word_count || 0) / 10
        ),
      }));

      console.log(`✅ Found ${formattedAgencies.length} agencies`);

      res.json({
        agencies: formattedAgencies,
        total_count: formattedAgencies.length,
        generated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error fetching agencies:", error);
      res.status(500).json({
        error: "Failed to fetch agencies",
        details: error.message,
        fallback_data: {
          agencies: [],
          total_count: 0,
          generated_at: new Date().toISOString(),
        },
      });
    }
  },

  // Get specific agency by ID with detailed information
  async getAgencyById(req, res) {
    try {
      const { id } = req.params;
      console.log(`📋 Fetching agency ${id}...`);

      // Get agency details
      const [agencyData] = await sequelize.query(
        `
        SELECT 
          a.id,
          a.name,
          a.short_name,
          a.title_number,
          a.description,
          COUNT(r.id) as regulation_count,
          AVG(r.word_count) as avg_word_count,
          SUM(r.word_count) as total_words
        FROM agencies a
        LEFT JOIN regulations r ON a.id = r.agency_id
        WHERE a.id = ?
        GROUP BY a.id, a.name, a.short_name, a.title_number, a.description
      `,
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (!agencyData || agencyData.length === 0) {
        return res.status(404).json({
          error: "Agency not found",
          agency_id: id,
        });
      }

      // Get agency's regulations
      const [regulations] = await sequelize.query(
        `
        SELECT 
          id,
          part_number,
          section_number,
          word_count,
          content,
          last_updated
        FROM regulations
        WHERE agency_id = ?
        ORDER BY word_count DESC
        LIMIT 10
      `,
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
        }
      );

      const agency = agencyData[0];
      const formattedAgency = {
        id: agency.id,
        name: agency.name,
        short_name: agency.short_name,
        title_number: agency.title_number,
        description: agency.description,
        regulation_count: parseInt(agency.regulation_count || 0),
        total_words: parseInt(agency.total_words || 0),
        avg_word_count: Math.round(parseFloat(agency.avg_word_count || 0)),
        complexity_score: Math.round(
          parseFloat(agency.avg_word_count || 0) / 10
        ),
        top_regulations: regulations.map((reg) => ({
          id: reg.id,
          title: `Part ${reg.part_number}, Section ${reg.section_number}`,
          part_number: reg.part_number,
          section_number: reg.section_number,
          word_count: reg.word_count || 0,
          content_preview: reg.content
            ? reg.content.substring(0, 150) + "..."
            : "No content",
          last_updated: reg.last_updated,
        })),
      };

      console.log(
        `✅ Found agency: ${agency.name} with ${regulations.length} regulations`
      );

      res.json({
        agency: formattedAgency,
        generated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error fetching agency:", error);
      res.status(500).json({
        error: "Failed to fetch agency details",
        details: error.message,
        agency_id: req.params.id,
      });
    }
  },
};

module.exports = agenciesController;
