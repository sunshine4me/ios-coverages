const express = require("express");
const { v4: uuidv4 } = require("uuid");

function createRouter(opts) {
  const connectionService = opts.connectionService;
  const router = express.Router();
  router.get("/", (req, res) => {
    const connections = connectionService.getAll();
    res.success(connections);
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
    let { tag, auto } = req.body;
    if (!tag) {
      tag = uuidv4();
    }

    /** @type {import("../websocket/MyWebSocket")} */
    const connection = req[connectionKey];
    connection.collect({
      tag,
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
