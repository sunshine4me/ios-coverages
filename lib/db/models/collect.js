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
      type: DataTypes.JSON,
    },
    coverageBlob: {
      type: DataTypes.BLOB("medium"),
    },
  });

  return Collect;
}

module.exports = Model;
