// eslint-disable-next-line no-unused-vars
const { Sequelize, DataTypes, ModelCtor } = require("sequelize");

function connect(opts) {
  const { host, port, database, username, password } = opts.config.db;
  let sequelize = new Sequelize(database, username, password, {
    host: host,
    port: port,
    dialect: "mysql",
    dialectOptions: {
      charset: "utf8mb4",
      supportBigNumbers: true,
      bigNumberStrings: true,
    },
    pool: {
      max: 5,
      min: 0,
      idle: 30000,
    },
    timezone: "+08:00",
  });
  const collect_Model = require("./models/collect");
  const coverage_Model = require("./models/coverage");
  const version_Model = require("./models/version");

  const Collect = collect_Model(sequelize, DataTypes);
  const Coverage = coverage_Model(sequelize, DataTypes);
  const Version = version_Model(sequelize, DataTypes);

  const db = sequelize;
  const tables = { Collect, Coverage, Version };
  return new Database(db, tables);
}

class Database {
  constructor(db, tables) {
    /**
     * * @typedef {Sequelize}
     */
    this.db = db;

    /**
     * @typedef {Object} Tables
     * @property {ModelCtor<Model<any, any>>} Collect
     * @property {ModelCtor<Model<any, any>>} Coverage
     * @property {ModelCtor<Model<any, any>>} Version
     */

    /** @type {Tables} */
    this.tables = tables;
  }
}

module.exports = { connect, Database };
