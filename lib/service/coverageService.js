const { Op } = require("sequelize");
const schedule = require("node-schedule");
const { v4: uuidv4 } = require("uuid");
const Task = require("./task");

class coverageService {
  constructor(opts) {
    /** @type {import("../db/index").Database} */
    const database = opts.database;
    this.Coverage = database.tables.Coverage;
    this.Collect = database.tables.Collect;

    /** @type {import("./connectionService")} */
    this.connectionService = opts.connectionService;
  }
  async getAll({ page = 1, pageSize = 10, name, tag, category, status, startTime, endTime }) {
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * pageSize;

    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (tag) where.tag = tag;
    if (category) where.category = category;
    if (status) where.status = status;
    if (startTime && !endTime) where.completeTime = { [Op.gte]: startTime };
    if (endTime && !startTime) where.completeTime = { [Op.lte]: endTime };
    if (startTime && endTime) where.completeTime = { [Op.between]: [startTime, endTime] };

    const { rows: tasks, count: total } = await this.Coverage.findAndCountAll({
      where,
      attributes: { exclude: ["coverageData", "details"] },
      offset,
      limit,
    });

    return { tasks, total };
  }
  async get(idOrTag) {
    const id = parseInt(idOrTag);
    if (id == idOrTag) {
      return await this.Coverage.findByPk(id);
    } else {
      return await this.Coverage.findOne({
        where: {
          tag: idOrTag,
        },
      });
    }
  }

  //values: ['running', 'completed', 'canceled', 'analyzed', 'analyzed-error'],
  async complete(coverage) {
    const tag = coverage.tag;
    //取消定时任务
    schedule.cancelJob(tag);
    //在ws端清除任务
    const connections = this.connectionService.filter({ tag });
    connections.forEach((connection) => {
      connection.stopCollect();
    });

    await coverage.update({
      status: "completed",
      completeTime: new Date(),
    });
    // 分析数据
    try {
      //   await analyzeCollectCoverage(coverage);
      await coverage.update({
        status: "analyzed",
      });
    } catch (err) {
      console.error(err);
      await coverage.update({
        status: "analyzed-error",
      });
    }
  }

  async getCollect(id) {
    return this.Collect.findByPk(id);
  }

  async createCollect(data) {
    return this.Collect.create(data);
  }

  async getVersionAutoCoverage(versionName) {
    const coverage = await this.Coverage.findOne({
      where: {
        category: "collect-auto",
        status: "running",
        versionName: versionName,
      },
    });

    return coverage;
  }

  toTask(coverage) {
    if (coverage) {
      return new Task({
        tag: coverage.tag,
        auto: coverage.category == "collect-auto" ? true : false,
        completeTime: coverage.completeTime,
        status: coverage.status,
        versionName: coverage.versionName,
      });
    }
  }

  async getVersionAutoTask(versionName) {
    const coverage = await this.getVersionAutoCoverage(versionName);
    return this.toTask(coverage);
  }

  async createVersionAutoTask({ name, versionName, completeTime }) {
    const taskId = uuidv4();

    const coverage = await this.Coverage.create({
      tag: taskId,
      name: name,
      category: "collect-auto",
      status: "running",
      completeTime: completeTime,
      versionName: versionName,
    });

    this.createJob(coverage);

    return coverage;
  }

  createJob(coverage) {
    const { tag, completeTime } = coverage;
    const intervalTime = 30000;
    let nextExecutionTime = new Date(Date.now() + intervalTime);
    if (nextExecutionTime > completeTime) {
      nextExecutionTime = completeTime;
    }

    const that = this;

    const task = schedule.scheduleJob(tag, nextExecutionTime, function () {
      const currentTime = new Date();
      if (currentTime >= completeTime) {
        that.complete(coverage).catch(console.error);
      } else {
        that
          .analyzeCollectCoverage(coverage)
          .then(() => {
            let nextExecutionTime = new Date(Date.now() + intervalTime);
            if (nextExecutionTime > completeTime) {
              nextExecutionTime = completeTime;
            }
            console.log(tag, "下次执行时间", nextExecutionTime);
            task.reschedule(nextExecutionTime); // 重新设置任务的执行时间
          })
          .catch(console.error);
      }
    });
  }

  async analyzeCollectCoverage(coverage) {
    //TODO
  }
}

module.exports = coverageService;
