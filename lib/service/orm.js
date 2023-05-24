const {
  tables: { Version, Collect, CoverageFile },
} = require("../db/models/index");

const { initCoverageData } = require("./core");

/**
 * 通过id或name 获得版本信息
 * @param {string|Number} idOrName
 * @returns
 */
async function getVersion(idOrName) {
  const id = parseInt(idOrName);
  if (id == idOrName) {
    return await Version.findByPk(id);
  } else {
    return await Version.findOne({
      where: {
        name: idOrName,
      },
    });
  }
}

/**
 *
 * @param {Object} options
 * @param {Number} options.page
 * @param {Number} options.pageSize
 * @returns
 */
async function getVersions({ page, pageSize }) {
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const options = {
    limit: parseInt(pageSize),
    offset: offset,
    order: [["createdAt", "DESC"]],
  };

  const data = await Version.findAndCountAll(options);
  return {
    data: data.rows,
    total: data.count,
  };
}

/**
 * 通过id或name 获得相应版本的Filemaps
 * @param {String|Number} version
 * @returns
 */
async function getVersionFilemaps(version) {
  let where;
  const id = parseInt(version);
  if (id == version) {
    where = { id: id };
  } else {
    where = { name: version };
  }

  return CoverageFile.findAll({
    include: [
      {
        model: Version,
        where: where,
      },
    ],
  });
}

/**
 * 获得某个版本下的默认CoverageData，该数据由 VersionFilemaps 表里的数据生成
 * @param {*} version
 * @returns
 */
async function getVersionCoverageData(version) {
  const filemaps = await getVersionFilemaps(version);
  return initCoverageData(filemaps);
}

/**
 * 通过id或name 获得相应版本的Filemaps
 * @param {String|Number} version
 * @returns
 */
async function createVersionFilemap(version, filemap) {
  let _version = await getOrCreateVersion(version);

  //如果path 相同理论上 就不需要重复入库了，不过最好能验证一下
  const [coverageFile] = await CoverageFile.findOrCreate({
    where: {
      versionId: _version.id,
      path: filemap.path,
    },
    defaults: {
      statementMap: filemap.statementMap,
      hash: filemap.hash,
      fnMap: filemap.fnMap,
      branchMap: filemap.branchMap,
      source: filemap.source,
      inputSourceMap: filemap.inputSourceMap,
      _coverageSchema: filemap._coverageSchema,
    },
  });

  return coverageFile;
}

/**
 *
 * @param {number} collectId
 */
async function getCollect(collectId) {
  return await Collect.findByPk(collectId);
}

/**
 *
 * @param {Object} options
 * @param {string} options.versionId
 * @param {Object} options.coverageData - 覆盖率数据
 * @param {string} options.ip
 * @param {string} options.userAgent - 浏览器信息
 * @param {string} options.platform - 平台
 * @returns {Promise<Collect>}
 */
async function createCollect(data) {
  var collect = await Collect.create(data);

  return collect;
}

/**
 * 保存coverageData 数据
 * @param {Collect|number} collect - 收集对象或对象Id
 * @param {Object} coverageData - 覆盖率数据
 */
async function updateCollect(collect, coverageData) {
  if (!(collect instanceof Collect)) {
    collect = await Collect.findByPk(collect.id || collect);
  }

  await collect.update({
    coverageData: coverageData,
  });

  return collect;
}

async function getCollects({ page, pageSize, version, tag }) {
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const options = {
    attributes: { exclude: ["coverageData"] },
    limit: parseInt(pageSize),
    offset: offset,
    where: {},
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: Version,
        as: "version",
      },
    ],
  };
  if (version) {
    options.where["$version.name$"] = version;
  }
  if (tag) {
    options.where.tag = tag;
  }
  const data = await Collect.findAndCountAll(options);
  return {
    data: data.rows,
    total: data.count,
  };
}

async function getOrCreateVersion(name) {
  var [version] = await Version.findOrCreate({
    where: {
      name: name,
    },
  });
  return version;
}

module.exports = {
  getOrCreateVersion: getOrCreateVersion,
  getVersion: getVersion,
  getVersions: getVersions,
  getVersionFilemaps: getVersionFilemaps,
  getVersionCoverageData: getVersionCoverageData,
  createVersionFilemap: createVersionFilemap,
  createCollect: createCollect,
  updateCollect: updateCollect,
  getCollect: getCollect,
  getCollects: getCollects,
};
