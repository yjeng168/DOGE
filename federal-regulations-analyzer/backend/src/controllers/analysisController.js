const { sequelize } = require("../models");

const analysisController = {
  // Get analysis overview using your actual table structure
  async getOverview(req, res) {
    try {
      console.log("📊 Generating analysis overview...");

      // Get basic counts
      const [totalRegulations] = await sequelize.query(
        "SELECT COUNT(*) as count FROM regulations"
      );

      const [totalAgencies] = await sequelize.query(
        "SELECT COUNT(*) as count FROM agencies"
      );

      const regulationCount = totalRegulations[0]?.count || 0;
      const agencyCount = totalAgencies[0]?.count || 0;

      // Get word statistics
      const [wordStats] = await sequelize.query(`
        SELECT 
          AVG(word_count) as avg_words,
          SUM(word_count) as total_words,
          MAX(word_count) as max_words
        FROM regulations 
        WHERE word_count > 0
      `);

      const avgWords = Math.round(parseFloat(wordStats[0]?.avg_words || 0));
      const totalWords = parseInt(wordStats[0]?.total_words || 0);

      // Get top agencies by regulation count using your actual column names
      const [topAgenciesData] = await sequelize.query(`
        SELECT 
          a.name,
          a.short_name,
          COUNT(r.id) as regulation_count,
          AVG(r.word_count) as avg_word_count
        FROM agencies a
        LEFT JOIN regulations r ON a.id = r.agency_id
        GROUP BY a.id, a.name, a.short_name
        HAVING COUNT(r.id) > 0
        ORDER BY COUNT(r.id) DESC
        LIMIT 10
      `);

      const topAgencies = topAgenciesData.map((agency) => ({
        agency_name: agency.short_name || agency.name,
        regulation_count: parseInt(agency.regulation_count || 0),
      }));

      // Get complexity distribution based on word_count
      const [complexityData] = await sequelize.query(`
        SELECT 
          CASE 
            WHEN word_count < 100 THEN 'Low'
            WHEN word_count < 150 THEN 'Medium' 
            WHEN word_count < 200 THEN 'High'
            ELSE 'Very High'
          END as complexity,
          COUNT(*) as count
        FROM regulations 
        WHERE word_count > 0
        GROUP BY 
          CASE 
            WHEN word_count < 100 THEN 'Low'
            WHEN word_count < 150 THEN 'Medium' 
            WHEN word_count < 200 THEN 'High'
            ELSE 'Very High'
          END
      `);

      const complexityDistribution = complexityData.map((item) => ({
        name: item.complexity,
        count: parseInt(item.count || 0),
      }));

      // Get deregulation opportunities using your actual column names
      const [deregulationData] = await sequelize.query(`
        SELECT 
          r.section_number,
          r.part_number,
          r.word_count,
          r.content,
          a.name as agency_name,
          a.short_name
        FROM regulations r
        LEFT JOIN agencies a ON r.agency_id = a.id
        WHERE r.word_count >= 150
        ORDER BY r.word_count DESC
        LIMIT 15
      `);

      const deregulationOpportunities = deregulationData.map((reg) => {
        const wordCount = reg.word_count || 0;
        let complexity = "Low";
        let impact = "Low";

        if (wordCount >= 200) {
          complexity = "Very High";
          impact = "High";
        } else if (wordCount >= 175) {
          complexity = "High";
          impact = "Medium";
        } else if (wordCount >= 150) {
          complexity = "Medium";
          impact = "Medium";
        }

        // Create a meaningful title from the available data
        const title = reg.section_number
          ? `Part ${reg.part_number}, Section ${reg.section_number}`
          : `Part ${reg.part_number}`;

        return {
          title: title,
          agency_name: reg.short_name || reg.agency_name || "Unknown Agency",
          word_count: wordCount,
          complexity: complexity,
          impact: impact,
          estimated_savings: `$${Math.floor(
            wordCount * 100
          ).toLocaleString()}-${Math.floor(wordCount * 500).toLocaleString()}`,
          simplification_potential: wordCount > 175 ? "High" : "Medium",
          content_preview: reg.content
            ? reg.content.substring(0, 100) + "..."
            : "No content preview",
        };
      });

      const overviewData = {
        total_regulations: regulationCount,
        total_agencies: agencyCount,
        avg_words_per_regulation: avgWords,
        total_words: totalWords,
        top_agencies: topAgencies,
        complexity_distribution: complexityDistribution,
        deregulation_opportunities: deregulationOpportunities,
        last_updated: new Date().toISOString(),
        summary: {
          high_complexity_count: deregulationOpportunities.length,
          potential_savings_range: "$50K - $2M per regulation",
          recommended_actions: [
            "Review regulations with 200+ words for simplification",
            "Consolidate redundant requirements across agencies",
            "Implement plain language principles",
            "Digitize manual compliance processes",
          ],
        },
      };

      console.log(
        `✅ Overview generated: ${regulationCount} regulations, ${deregulationOpportunities.length} opportunities`
      );

      res.json(overviewData);
    } catch (error) {
      console.error("❌ Error generating overview:", error);

      res.status(500).json({
        error: "Failed to generate analysis overview",
        details: error.message,
        fallback_data: {
          total_regulations: 0,
          total_agencies: 0,
          avg_words_per_regulation: 0,
          total_words: 0,
          top_agencies: [],
          complexity_distribution: [],
          deregulation_opportunities: [],
          last_updated: new Date().toISOString(),
        },
      });
    }
  },

  // Get word count analysis using your actual column names
  async getWordCount(req, res) {
    try {
      console.log("📊 Generating word count analysis...");

      const [wordCountData] = await sequelize.query(`
        SELECT 
          a.name,
          a.short_name,
          COUNT(r.id) as regulation_count,
          AVG(r.word_count) as avg_word_count,
          SUM(r.word_count) as total_words,
          MAX(r.word_count) as max_word_count,
          MIN(r.word_count) as min_word_count
        FROM agencies a
        LEFT JOIN regulations r ON a.id = r.agency_id
        WHERE r.word_count > 0
        GROUP BY a.id, a.name, a.short_name
        HAVING COUNT(r.id) > 0
        ORDER BY AVG(r.word_count) DESC
      `);

      const formattedData = wordCountData.map((agency) => ({
        agency: agency.short_name || agency.name,
        regulation_count: parseInt(agency.regulation_count || 0),
        avg_word_count: Math.round(parseFloat(agency.avg_word_count || 0)),
        total_words: parseInt(agency.total_words || 0),
        max_word_count: parseInt(agency.max_word_count || 0),
        min_word_count: parseInt(agency.min_word_count || 0),
      }));

      console.log(
        `✅ Word count analysis completed for ${formattedData.length} agencies`
      );

      res.json({
        word_count_by_agency: formattedData,
        generated_at: new Date().toISOString(),
        summary: {
          total_agencies: formattedData.length,
          total_regulations: formattedData.reduce(
            (sum, agency) => sum + agency.regulation_count,
            0
          ),
          overall_avg_words: Math.round(
            formattedData.reduce(
              (sum, agency) => sum + agency.avg_word_count,
              0
            ) / formattedData.length
          ),
        },
      });
    } catch (error) {
      console.error("❌ Error in word count analysis:", error);
      res.status(500).json({
        error: "Failed to generate word count analysis",
        details: error.message,
        fallback_data: {
          word_count_by_agency: [],
          generated_at: new Date().toISOString(),
        },
      });
    }
  },
};

module.exports = analysisController;
