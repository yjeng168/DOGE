const {
  sequelize,
  Agency,
  Regulation,
  RegulationHistory,
  AnalysisMetric,
} = require("../models");
const fs = require("fs");
const path = require("path");

async function initializeDatabase() {
  try {
    console.log("🗄️  Initializing database...");

    // Create database directory if it doesn't exist
    const dbDir = path.join(__dirname, "../../database");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log("📁 Created database directory");
    }

    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Create tables (force: true drops existing tables)
    // Change to force: false in production to preserve data
    await sequelize.sync({ force: false, alter: true });
    console.log("📋 Database tables created/updated");

    // Check if we have sample data
    const agencyCount = await Agency.count();
    console.log(`📊 Current agencies in database: ${agencyCount}`);

    if (agencyCount === 0) {
      console.log("🌱 Database is empty - ready for data import");
      console.log("💡 Run: npm run import-data to fetch regulations");
    } else {
      console.log("✅ Database already has data");
    }

    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log("🎉 Database initialization completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Database initialization failed:", error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
