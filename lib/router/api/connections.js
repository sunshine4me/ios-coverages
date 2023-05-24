const express = require("express");

function createRouter(wss) {
  const router = express.Router();
  router.get("/", (req, res) => {
    const connections = Array.from(wss.clients);
    res.success(connections);
  });

  const connectionKey = Symbol("connection");

  const connectionRouter = express.Router();
  router.use(
    "/:id",
    (req, res, next) => {
      const id = req.params.id;
      let connection;
      wss.clients.forEach((clinet) => {
        if (clinet.id == id || clinet.fingerprint == id) {
          connection = clinet;
        }
      });
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
    const connection = req[connectionKey];
    connection.collect();
    res.success();
  });
  connectionRouter.post("/reset", function (req, res) {
    const connection = req[connectionKey];
    connection.reset();
    res.success();
  });

  return router;
}

module.exports = createRouter;
