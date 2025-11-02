const {
  Agency,
  Regulation,
  RegulationHistory,
  AnalysisMetric,
} = require("../models");
const ecfrService = require("./ecfrService");

class RobustDataImporter {
  constructor() {
    this.importedCount = 0;
    this.errors = [];
    this.startTime = null;
    this.useRealAPI = false;
  }

  async importData() {
    this.startTime = Date.now();
    console.log("🚀 Starting Federal Regulations data import...");

    try {
      // Try to use real API first
      console.log("🌐 Attempting to connect to real eCFR API...");
      try {
        await ecfrService.initializeClient();
        this.useRealAPI = true;
        console.log("✅ Connected to real eCFR API");
      } catch (error) {
        console.log("⚠️  Real API unavailable, using realistic sample data");
        this.useRealAPI = false;
      }

      // Get CFR data (real or sample)
      const cfrData = this.useRealAPI
        ? await this.getRealCFRData()
        : await ecfrService.getSampleCFRData();

      // Process each title
      for (const title of cfrData.titles) {
        await this.processTitle(title);
        await this.delay(200);
      }

      await this.calculateMetrics();
      this.logSummary();
    } catch (error) {
      console.error("💥 Import failed:", error);
      throw error;
    }
  }

  async getRealCFRData() {
    // Try Federal Register API for real CFR data
    try {
      const frData = await ecfrService.getFederalRegisterCFR();
      return this.convertFRDataToCFR(frData);
    } catch (error) {
      console.log(
        "⚠️  Federal Register API also unavailable, using sample data"
      );
      return await ecfrService.getSampleCFRData();
    }
  }

  convertFRDataToCFR(frData) {
    // Convert Federal Register API response to our CFR structure
    const titles = [];

    if (frData.results && frData.results.length > 0) {
      // Group documents by CFR title
      const titleGroups = {};

      frData.results.forEach((doc) => {
        if (doc.cfr_references && doc.cfr_references.length > 0) {
          doc.cfr_references.forEach((cfr) => {
            if (!titleGroups[cfr.title]) {
              titleGroups[cfr.title] = {
                number: cfr.title,
                name: this.getTitleName(cfr.title),
                parts: [],
              };
            }

            titleGroups[cfr.title].parts.push({
              number: cfr.part || 1,
              name: doc.title || "General Provisions",
              sections: [
                {
                  number: `${cfr.part || 1}.1`,
                  content:
                    doc.abstract || doc.summary || "Federal regulation content",
                  lastUpdated: new Date(doc.publication_date || Date.now()),
                },
              ],
            });
          });
        }
      });

      titles = Object.values(titleGroups);
    }

    // If no real data, fall back to sample
    if (titles.length === 0) {
      return ecfrService.getSampleCFRData();
    }

    return { titles };
  }

  getTitleName(titleNumber) {
    const titleNames = {
      1: "General Provisions",
      7: "Agriculture",
      14: "Aeronautics and Space",
      17: "Commodity and Securities Exchanges",
      21: "Food and Drugs",
      29: "Labor",
      40: "Protection of Environment",
      49: "Transportation",
    };
    return titleNames[titleNumber] || `Title ${titleNumber}`;
  }

  async processTitle(titleData) {
    try {
      console.log(
        `\n📚 Processing Title ${titleData.number}: ${titleData.name}`
      );

      // Create or update agency
      const [agency] = await Agency.findOrCreate({
        where: { titleNumber: titleData.number },
        defaults: {
          name: titleData.name,
          shortName: this.getShortName(titleData.number),
          titleNumber: titleData.number,
          description: `Federal regulations for ${titleData.name}`,
        },
      });

      // Process parts (limit for demo performance)
      const partsToProcess = titleData.parts.slice(0, 3);

      for (const part of partsToProcess) {
        await this.processPart(agency, titleData.number, part);
        await this.delay(300);
      }

      console.log(
        `✅ Completed Title ${titleData.number} (${partsToProcess.length} parts)`
      );
    } catch (error) {
      console.error(
        `❌ Error processing title ${titleData.number}:`,
        error.message
      );
      this.errors.push({ title: titleData.number, error: error.message });
    }
  }

  async processPart(agency, titleNumber, partData) {
    try {
      // Process sections in this part
      for (const section of partData.sections) {
        const content = ecfrService.extractTextContent(section.content);
        const wordCount = ecfrService.countWords(content);
        const checksum = ecfrService.generateChecksum(content);

        // Check if regulation exists
        const existingRegulation = await Regulation.findOne({
          where: {
            agencyId: agency.id,
            titleNumber,
            partNumber: partData.number,
            sectionNumber: section.number,
          },
        });

        if (existingRegulation) {
          // Check if content changed
          if (existingRegulation.checksum !== checksum) {
            // Record historical version
            await RegulationHistory.create({
              regulationId: existingRegulation.id,
              content: existingRegulation.content,
              wordCount: existingRegulation.wordCount,
              checksum: existingRegulation.checksum,
              changeType: "modified",
            });

            // Update current version
            await existingRegulation.update({
              content,
              wordCount,
              checksum,
              lastUpdated: section.lastUpdated || new Date(),
            });

            console.log(
              `📝 Updated ${titleNumber}.${partData.number}.${section.number} (${wordCount} words)`
            );
          }
        } else {
          // Create new regulation
          const regulation = await Regulation.create({
            agencyId: agency.id,
            titleNumber,
            partNumber: partData.number,
            sectionNumber: section.number,
            content,
            wordCount,
            checksum,
            lastUpdated: section.lastUpdated || new Date(),
          });

          // Record creation in history
          await RegulationHistory.create({
            regulationId: regulation.id,
            content,
            wordCount,
            checksum,
            changeType: "created",
          });

          console.log(
            `✨ Created ${titleNumber}.${partData.number}.${section.number} (${wordCount} words)`
          );
        }

        this.importedCount++;
      }
    } catch (error) {
      console.error(
        `❌ Error processing part ${partData.number}:`,
        error.message
      );
      this.errors.push({
        part: `${titleNumber}.${partData.number}`,
        error: error.message,
      });
    }
  }

  getShortName(titleNumber) {
    const shortNames = {
      1: "GEN",
      7: "USDA",
      14: "FAA",
      17: "SEC",
      21: "FDA",
      29: "DOL",
      40: "EPA",
      49: "DOT",
    };
    return shortNames[titleNumber] || `T${titleNumber}`;
  }

  async calculateMetrics() {
    console.log("\n📊 Calculating analysis metrics...");

    const agencies = await Agency.findAll({
      include: [{ model: Regulation }],
    });

    for (const agency of agencies) {
      const regulations = agency.Regulations;

      if (regulations.length > 0) {
        // Word count metrics
        const totalWords = regulations.reduce(
          (sum, reg) => sum + (reg.wordCount || 0),
          0
        );
        const avgWordsPerRegulation = totalWords / regulations.length;

        // Complexity metrics
        const complexityScores = regulations.map((reg) =>
          ecfrService.calculateComplexityScore(reg.content)
        );
        const avgComplexity =
          complexityScores.reduce((a, b) => a + b, 0) / complexityScores.length;

        // Update frequency (based on last updated dates)
        const recentUpdates = regulations.filter(
          (reg) =>
            reg.lastUpdated &&
            new Date(reg.lastUpdated) >
              new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        ).length;
        const updateFrequency = (recentUpdates / regulations.length) * 100;

        // Custom metric: Deregulation Opportunity Score
        const deregulationScore = this.calculateDeregulationScore(
          regulations,
          avgComplexity,
          updateFrequency
        );

        // Store metrics
        const metrics = [
          { name: "total_words", value: totalWords },
          {
            name: "avg_words_per_regulation",
            value: Math.round(avgWordsPerRegulation),
          },
          {
            name: "avg_complexity_score",
            value: Math.round(avgComplexity * 10) / 10,
          },
          {
            name: "update_frequency_percent",
            value: Math.round(updateFrequency * 10) / 10,
          },
          {
            name: "deregulation_opportunity_score",
            value: Math.round(deregulationScore * 10) / 10,
          },
          { name: "regulation_count", value: regulations.length },
        ];

        // Clear old metrics and insert new ones
        await AnalysisMetric.destroy({ where: { agencyId: agency.id } });

        for (const metric of metrics) {
          await AnalysisMetric.create({
            agencyId: agency.id,
            metricName: metric.name,
            metricValue: metric.value,
          });
        }

        console.log(
          `📈 Calculated metrics for ${agency.shortName}: ${metrics.length} metrics`
        );
      }
    }
  }

  calculateDeregulationScore(regulations, avgComplexity, updateFrequency) {
    // Algorithm for identifying deregulation opportunities
    const totalWords = regulations.reduce(
      (sum, reg) => sum + (reg.wordCount || 0),
      0
    );
    const avgWords = totalWords / regulations.length;

    // Factors: complexity + word count + staleness = opportunity
    const complexityFactor = Math.min(100, avgComplexity * 1.2);
    const wordCountFactor = Math.min(100, avgWords / 75);
    const staleFactor = Math.max(0, 100 - updateFrequency);

    // Weighted score
    const score =
      complexityFactor * 0.4 + wordCountFactor * 0.3 + staleFactor * 0.3;

    return Math.max(10, Math.min(100, score));
  }

  logSummary() {
    const duration = (Date.now() - this.startTime) / 1000;
    const dataSource = this.useRealAPI
      ? "🌐 Real eCFR API"
      : "📋 Sample CFR Data";

    console.log("\n🎉 Import Summary:");
    console.log(`📊 Data Source: ${dataSource}`);
    console.log(`⏱️  Duration: ${duration.toFixed(1)}s`);
    console.log(`📄 Regulations imported: ${this.importedCount}`);
    console.log(`❌ Errors: ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log("\n🚨 Error Details:");
      this.errors.forEach((err) =>
        console.log(`   - ${err.title || err.part}: ${err.error}`)
      );
    }

    console.log(`\n🎯 Ready for analysis dashboard!`);
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Run if called directly
if (require.main === module) {
  const importer = new RobustDataImporter();
  importer
    .importData()
    .then(() => {
      console.log("✅ Data import completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Data import failed:", error);
      process.exit(1);
    });
}

module.exports = RobustDataImporter;
