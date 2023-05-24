const { Sequelize, DataTypes } = require("sequelize");

const {
  db: { dialect, host, port, database, username, password },
} = require("../config");

let sequelize;
if (dialect == "mysql") {
  sequelize = new Sequelize(database, username, password, {
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
} else {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: require("path").join(__dirname, "../../data/database.sqlit"),
    logging: false,
  });
}

const version_Model = require("./version");
const collect_Model = require("./collect");
const coverageFile_Model = require("./coverageFile");
const coverage_Model = require("./coverage");

const Version = version_Model(sequelize, DataTypes);
const Collect = collect_Model(sequelize, DataTypes);
const CoverageFile = coverageFile_Model(sequelize, DataTypes);
const Coverage = coverage_Model(sequelize, DataTypes);

//版本和task 一对多
Version.hasMany(Coverage, { constraints: false });
Coverage.belongsTo(Version, { constraints: false });

//版本和收集 一对多
Version.hasMany(Collect, { constraints: false });
Collect.belongsTo(Version, { constraints: false });

//覆盖率文件 属于某个版本 （方便检索） 后期可以考虑通过 hash 进行进一步减少数据
//hash 是通过 statementMap fnMap branchMap 等编译后的数据 使用 SHA1 进行计算获得
//可能会出现不同的源码编译后生成的hash值相同的情况，比如注释发生了变化，或者变量名发生了变化
//所以现在只考虑versoin纬度保存 这些数据来尽量减少数据量
CoverageFile.belongsTo(Version, { constraints: false });
Version.hasMany(CoverageFile, { constraints: false });

module.exports = {
  db: sequelize,
  init: function (force = false) {
    return sequelize.sync({ force });
  },
  tables: { Version, Collect, CoverageFile, Coverage },
};
