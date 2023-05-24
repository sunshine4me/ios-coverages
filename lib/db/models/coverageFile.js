/**
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @param {import('sequelize').DataTypes} DataTypes
 * @returns
 */
function Model(sequelize, DataTypes) {
  var coverageFile = sequelize.define("coverageFile", {
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    statementMap: {
      type: DataTypes.JSON,
    },
    fnMap: {
      type: DataTypes.JSON,
    },
    branchMap: {
      type: DataTypes.JSON,
    },
    inputSourceMap: {
      type: DataTypes.JSON,
    },
    source: {
      type: DataTypes.TEXT,
    },
    _coverageSchema: DataTypes.STRING(50),
    hash: DataTypes.STRING(50),
  });

  return coverageFile;
}

module.exports = Model;
