/**
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @param {import('sequelize').DataTypes} DataTypes
 * @returns
 */
function Model(sequelize, DataTypes) {
  var Version = sequelize.define("version", {
    name: {
      type: DataTypes.STRING, //字段数据类型
      allowNull: false, //是否允许为空
    },
    // {
    //     "host": "gitee.com",
    //     "url": "https://gitee.com/api/v5/repos",
    //     "owner": "sunshine4me",
    //     "repo": "vue-demo",
    //     "token": "d074065f89e3195932474a47c1387e49",
    //     "platform": "gitee",
    //     "ref": "master"
    // }

    // {
    //     "path": "/Users/jpsun/Documents/perfma/gitlab/react-origin",
    //     "platform": "file",
    //     "ref": "master"
    // }
    repository: {
      type: DataTypes.JSON(1000),
    },
  });

  return Version;
}

module.exports = Model;
