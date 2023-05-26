const express = require("express");

function createRouter(opts) {
  /** @type {import("../service/connectionService")} */
  const connectionService = opts.connectionService;
  /** @type {import("../service/coverageService")} */
  const coverageService = opts.coverageService;

  const router = express.Router();
  router.get("/", (req, res) => {
    const connections = connectionService.getAll();
    res.success(connections);
  });

  router.get("/version/:name", function (req, res) {
    const versionName = req.params.name;
    const connections = connectionService.filter({ versionName: versionName });
    res.success(connections);
  });

  router.get("/version/:name/task", function (req, res, next) {
    const versionName = req.params.name;
    coverageService
      .getVersionAutoTask(versionName)
      .then((task) => {
        res.success(task);
      })
      .then(next);
  });

  router.post("/version/:name/task", function (req, res, next) {
    const versionName = req.params.name;

    (async () => {
      const _task = await coverageService.getVersionAutoTask(versionName);
      if (_task) {
        return res.error("Exist running task.");
      }

      const { name, overTime = 24 * 3600 * 1000 } = req.body;
      const coverage = await coverageService.createVersionAutoTask({
        name: name,
        versionName: versionName,
        completeTime: new Date(Date.now() + overTime),
      });

      const connections = connectionService.filter({ versionName });
      //已有连接发送任务
      for (var connection of connections) {
        const task = coverageService.toTask(coverage);
        connection.collect(task);
      }

      const task = coverageService.toTask(coverage);
      res.success(task);
    })().catch(next);
  });

  router.post("/version/:name/task/complete", function (req, res, next) {
    const versionName = req.params.name;
    coverageService
      .getVersionAutoCoverage(versionName)
      .then((coverage) => {
        if (coverage) {
          return coverageService.complete(coverage).then(() => {
            res.success("complete success");
          });
        } else {
          res.error("task 未找到");
        }
      })
      .catch(next);
  });

  const connectionKey = Symbol("connection");

  const connectionRouter = express.Router();
  router.use(
    "/:id",
    (req, res, next) => {
      const id = req.params.id;
      const connection = connectionService.get(id);
      req[connectionKey] = connection;
      next();
    },
    connectionRouter
  );

  connectionRouter.get("/", function (req, res) {
    const connection = req[connectionKey];
    res.success(connection);
  });

  connectionRouter.post("/collect", function (req, res) {
    /** @type {import("../websocket/MyWebSocket")} */
    const connection = req[connectionKey];
    const collectTime = new Date();
    connection.collect();
    setTimeout(() => {
      if (connection.lastCollect && connection.lastCollect.time >= collectTime) {
        res.success("收集完成");
      } else {
        res.error("收集失败");
      }
    }, 2000);
  });

  connectionRouter.post("/task", function (req, res) {
    /** @type {import("../websocket/MyWebSocket")} */
    const connection = req[connectionKey];
    if (connection.task) {
      return res.error("Exist running task.");
    }

    let { auto } = req.body;
    connection.collect({
      auto,
    });
    res.success();
  });

  connectionRouter.post("/task/stop", function (req, res) {
    /** @type {import("../websocket/MyWebSocket")} */
    const connection = req[connectionKey];
    connection.stopCollect();
    res.success();
  });

  connectionRouter.post("/reset", function (req, res) {
    const connection = req[connectionKey];
    connection.reset();
    res.success();
  });

  connectionRouter.get("/dump", function (req, res) {
    /** @type {import("../websocket/MyWebSocket")} */
    const connection = req[connectionKey];
    if (connection.lastCollect?.coverageData) {
      // 设置响应的 Content-Disposition 头部，指定文件名和下载方式
      res.set("Content-Disposition", 'attachment; filename="file.profraw"');

      const bufferData = connection.lastCollect.coverageData;
      res.send(bufferData);
    } else {
      res.error("not found lastCollect");
    }
  });

  return router;
}

module.exports = createRouter;
