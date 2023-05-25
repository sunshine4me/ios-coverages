/**
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @param {import('sequelize').DataTypes} DataTypes
 * @returns
 */
function Model(sequelize, DataTypes) {
  var Collect = sequelize.define("collect", {
    ip: {
      type: DataTypes.STRING(50),
    },
    userAgent: {
      type: DataTypes.STRING(),
    },
    versionName: {
      type: DataTypes.STRING(50),
    },
    fingerprint: {
      type: DataTypes.STRING(50),
    },
    tag: {
      type: DataTypes.STRING(50),
    },
    platform: {
      type: DataTypes.STRING(50),
    },
    coverageData: {
      type: DataTypes.BLOB("medium"),
    },
  });

  return Collect;
}

module.exports = Model;
