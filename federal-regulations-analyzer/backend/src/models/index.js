// FILE: backend/src/models/index.js
const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../../database/regulations.db"),
  logging: false, // Set to console.log to see SQL queries
  define: {
    timestamps: true,
    underscored: true, // Use snake_case for column names
  },
});

// Agency Model
const Agency = sequelize.define("Agency", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  acronym: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  title_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

// Regulation Model
const Regulation = sequelize.define("Regulation", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  part_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  word_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  complexity: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 1.0,
  },
  checksum: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  agency_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Agency,
      key: "id",
    },
  },
  last_updated: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
});

// RegulationHistory Model (for tracking changes)
const RegulationHistory = sequelize.define("RegulationHistory", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  regulation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Regulation,
      key: "id",
    },
  },
  change_type: {
    type: DataTypes.STRING,
    allowNull: false, // 'created', 'updated', 'deleted'
  },
  old_checksum: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  new_checksum: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  change_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  changed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

// Define Associations
Agency.hasMany(Regulation, { foreignKey: "agency_id", onDelete: "CASCADE" });
Regulation.belongsTo(Agency, { foreignKey: "agency_id" });

Regulation.hasMany(RegulationHistory, {
  foreignKey: "regulation_id",
  onDelete: "CASCADE",
});
RegulationHistory.belongsTo(Regulation, { foreignKey: "regulation_id" });

// Export models and sequelize instance
module.exports = {
  sequelize,
  Agency,
  Regulation,
  RegulationHistory,
};
