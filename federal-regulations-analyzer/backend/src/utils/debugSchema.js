const { Agency, Regulation, AnalysisMetric } = require("../models");
const sequelize = require("../models").sequelize;

async function debugDatabaseSchema() {
  try {
    console.log("🔍 Debugging database schema...\n");

    // Get table info for agencies
    const agenciesTableInfo = await sequelize.query(
      "PRAGMA table_info(agencies);",
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log("📋 AGENCIES TABLE STRUCTURE:");
    console.table(agenciesTableInfo);

    // Get table info for regulations
    const regulationsTableInfo = await sequelize.query(
      "PRAGMA table_info(regulations);",
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log("\n📜 REGULATIONS TABLE STRUCTURE:");
    console.table(regulationsTableInfo);

    // Get sample data
    console.log("\n📊 SAMPLE DATA:");

    const sampleAgencies = await sequelize.query(
      "SELECT * FROM agencies LIMIT 3;",
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log("Sample agencies:", sampleAgencies);

    const sampleRegulations = await sequelize.query(
      "SELECT * FROM regulations LIMIT 3;",
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log("Sample regulations:", sampleRegulations);

    // Check for foreign key relationships
    const foreignKeys = await sequelize.query(
      "PRAGMA foreign_key_list(regulations);",
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log("\n🔗 FOREIGN KEY RELATIONSHIPS:");
    console.table(foreignKeys);

    // Test a simple query without joins
    console.log("\n🧪 TESTING SIMPLE QUERIES:");

    const agencyCount = await Agency.count();
    console.log(`✅ Agency count: ${agencyCount}`);

    const regulationCount = await Regulation.count();
    console.log(`✅ Regulation count: ${regulationCount}`);
  } catch (error) {
    console.error("❌ Error debugging schema:", error);
  }
}

// Run the debug
debugDatabaseSchema();

module.exports = debugDatabaseSchema;
