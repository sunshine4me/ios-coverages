const { WebSocket } = require("ws");
const useragent = require("useragent");

function heartbeat() {
  this.isAlive = true;
}

let _connectionId = 1;

class MyWebSocket extends WebSocket {
  constructor(address, options) {
    super(address, options);
    this.isAlive = true;
    this.on("pong", heartbeat);
    this.on("error", console.error);
    this.on("message", (coverageData) => {
      const lastCollect = {
        coverageData: coverageData,
        time: new Date(),
      };
      this.lastCollect = lastCollect;

      const task = this.task;
      //如果task 为空则应该是实时查看请求
      if (!task) {
        return;
      }

      (async () => {
        const { tag, collect } = this.task;
        if (collect) {
          await collect.update({
            coverageData: coverageData,
          });
        } else {
          const { ip, versionName, userAgent, fingerprint } = this;
          const Collect = this.database.tables.Collect;
          const collect = await Collect.create({
            ip: ip,
            userAgent: userAgent,
            versionName: versionName,
            fingerprint: fingerprint,
            tag: tag,
            coverageData: coverageData,
          });

          this.task.collect = collect;
        }
      })().catch(console.error);
    });
  }
  customInit(req, database) {
    /** @type {import("../db/index").Database} */
    this.database = database;

    const userAgent = req.headers["user-agent"];
    const urlSearchParams = new URLSearchParams(req.url.split("?")[1]);
    const versionName = urlSearchParams.get("versionName");
    const fingerprint = urlSearchParams.get("fingerprint");
    const ip = req.headers["x-real-ip"] || req.connection.remoteAddress;

    this.id = _connectionId;
    this.auto = false;
    this.ip = ip;
    this.versionName = versionName;
    this.fingerprint = fingerprint;
    this.userAgent = userAgent;
    this.connectTime = new Date();
    this.lastCollect = null;
    this.task = null;
  }
  /**
   *
   * @param {*} task { auto, tag, collect }
   */
  collect(task) {
    //重新设定task
    if (task) {
      this.task = task;
    }

    //没有保存任务 或者任务不是自动的话就发送一个请求
    if (task && task.auto === true) {
      /* empty */
    } else {
      this.send(
        JSON.stringify({
          event: "collect",
        })
      );
    }
  }
  stopCollect() {
    console.log("停止自动收集", this.id);
    this.task = null;
  }
  reset() {
    this.send(
      JSON.stringify({
        event: "reset",
      })
    );
  }
  toJSON() {
    return {
      id: this.id,
      ip: this.ip,
      tag: this.tag,
      versionName: this.versionName,
      fingerprint: this.fingerprint,
      agent: useragent.parse(this.userAgent),
      task: this.task
        ? {
            tag: this.task.tag,
            auto: this.task.auto,
            collect: this.task.collect?.id,
          }
        : null,
      connectTime: this.connectTime,
      lastCollect: this.lastCollect?.time,
    };
  }
}

module.exports = MyWebSocket;
