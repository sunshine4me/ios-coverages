/**
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @param {import('sequelize').DataTypes} DataTypes
 * @returns
 */
function Model(sequelize, DataTypes) {
  var Version = sequelize.define("version", {
    name: {
      type: DataTypes.STRING(50),
    },
    objectFilePath: {
      type: DataTypes.STRING(500),
    },
  });

  return Version;
}

module.exports = Model;
