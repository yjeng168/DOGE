// FILE: backend/src/utils/inspectDatabase.js
const { sequelize } = require("../models");

async function inspectDatabase() {
  try {
    console.log("🔍 Inspecting database schema...\n");

    // Get all table names
    const [tables] = await sequelize.query(`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
    `);

    console.log(
      "📋 Tables found:",
      tables.map((t) => t.name)
    );
    console.log("\n" + "=".repeat(50) + "\n");

    // Inspect each table structure
    for (const table of tables) {
      if (table.name.startsWith("sqlite_")) continue;

      console.log(`📊 Table: ${table.name}`);

      const [columns] = await sequelize.query(`
        PRAGMA table_info(${table.name});
      `);

      console.log("Columns:");
      columns.forEach((col) => {
        console.log(
          `  - ${col.name} (${col.type}) ${col.notnull ? "NOT NULL" : "NULL"} ${
            col.pk ? "PRIMARY KEY" : ""
          }`
        );
      });

      // Get row count
      const [countResult] = await sequelize.query(`
        SELECT COUNT(*) as count FROM ${table.name};
      `);
      console.log(`Records: ${countResult[0].count}`);

      // Show sample data
      if (countResult[0].count > 0) {
        const [sample] = await sequelize.query(`
          SELECT * FROM ${table.name} LIMIT 2;
        `);
        console.log("Sample data:");
        sample.forEach((row, idx) => {
          console.log(`  Row ${idx + 1}:`, row);
        });
      }

      console.log("\n" + "-".repeat(30) + "\n");
    }
  } catch (error) {
    console.error("❌ Error inspecting database:", error);
  } finally {
    await sequelize.close();
  }
}

// Run the inspection
inspectDatabase();
