var nopt = require("nopt");
const knownOpts = {
  "db.host": String,
  "db.port": Number,
  "db.database": String,
  "db.username": String,
  "db.password": String,

  "redis.host": String,
  "redis.port": Number,
  "redis.password": String,
  server: ["ios_collect", "js_collect", "analysis_api"],
};

const shortHands = {
  dh: ["--db.host"],
  dp: ["--db.port"],
  dd: ["--db.database"],
  du: ["--db.username"],
  dpw: ["--db.password"],
  rh: ["--redis.host"],
  rpo: ["--redis.port"],
  rpw: ["--redis.password"],
  s: ["--server"],
};

const { argv, ...config } = nopt(knownOpts, shortHands, process.argv, 2);

module.exports = {
  server: config.server || "analysis_api",
  db: {
    host: config["db.host"],
    port: config["db.port"] || 3306,
    database: config["db.database"],
    username: config["db.username"],
    password: config["db.password"],
  },
  redis: {
    host: config["redis.host"],
    port: config["redis.port"] || 6379,
    password: config["redis.password"],
  },
};
