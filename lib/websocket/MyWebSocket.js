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
      //如果task . tag 为空则应该是实时查看请求
      if (!task?.tag) {
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

          const collect = await this.coverageService.createCollect({
            ip: ip,
            userAgent: userAgent,
            versionName: versionName,
            fingerprint: fingerprint,
            tag: tag,
            coverageData: coverageData,
          });

          this.task.collect = collect;
          this.redis.save(fingerprint, task);
        }
      })().catch(console.error);
    });
  }
  customInit(req, opts) {
    /** @type {import("../service/redisService")} */
    this.redis = opts.redis;

    /** @type {import("../service/coverageService")} */
    this.coverageService = opts.coverageService;

    const userAgent = req.headers["user-agent"];
    const urlSearchParams = new URLSearchParams(req.url.split("?")[1]);
    const versionName = urlSearchParams.get("versionName");
    const fingerprint = urlSearchParams.get("fingerprint");
    const ip = req.headers["x-real-ip"] || req.connection.remoteAddress;

    this.id = _connectionId++;
    this.ip = ip;
    this.versionName = versionName;
    this.fingerprint = fingerprint;
    this.userAgent = userAgent;
    this.connectTime = new Date();
    this.lastCollect = null;

    //首次链接后查看是否有自动收集任务需要下发
    this.coverageService
      .getVersionAutoTask(versionName)
      .then(async (task) => {
        if (task) {
          //尝试获得之前的连接数据
          const oldTask = await this.redis.get(fingerprint);
          //如果旧链接中的tag 和 自动任务一致 则 导入该数据再发送收集请求
          if (oldTask && oldTask.tag == task.tag && oldTask.collect) {
            const collect = await this.coverageService.getCollect(oldTask.collect.id);
            task.collect = collect;
          }

          //发送任务
          this.collect(task);
        }
      })
      .catch(console.error);
  }
  /**
   *
   * @param {import("../service/task")} task
   */
  collect(task) {
    //重新设定task
    if (task) {
      this.task = task;
    }

    //没有任务 或者任务不是自动的话就发送一个请求
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
            id: this.task.id,
          }
        : null,
      connectTime: this.connectTime,
      lastCollect: this.lastCollect?.time,
    };
  }
}

module.exports = MyWebSocket;
