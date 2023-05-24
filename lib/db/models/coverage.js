/**
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @param {import('sequelize').DataTypes} DataTypes
 * @returns
 */
function Model(sequelize, DataTypes) {
  var Coverage = sequelize.define("coverage", {
    name: {
      type: DataTypes.STRING(50),
    },
    tag: {
      type: DataTypes.STRING(50),
    },
    category: {
      type: DataTypes.ENUM,
      values: ["collect", "merge", "collect-auto"],
      allowNull: false,
    },
    completeTime: {
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.ENUM,
      values: [
        "running",
        "completed",
        "canceled",
        "analyzed",
        "analyzed-error",
      ],
      allowNull: false,
    },
    details: {
      type: DataTypes.JSON,
    },
    coverageData: {
      type: DataTypes.JSON,
    },
    coverageSummary: {
      type: DataTypes.JSON,
    },
  });

  return Coverage;
}

module.exports = Model;
