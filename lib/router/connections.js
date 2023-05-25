const express = require("express");

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
    connection.collect();
    res.success();
  });

  connectionRouter.post("/auto", function (req, res) {
    /** @type {import("../websocket/MyWebSocket")} */
    const connection = req[connectionKey];
    connection.collect(true);
    res.success();
  });

  connectionRouter.post("/reset", function (req, res) {
    const connection = req[connectionKey];
    connection.reset();
    res.success();
  });

  connectionRouter.get("/lastData", function (req, res) {
    /** @type {import("../websocket/MyWebSocket")} */
    const connection = req[connectionKey];
    connection.get(true);
    res.success();
  });

  return router;
}

module.exports = createRouter;
