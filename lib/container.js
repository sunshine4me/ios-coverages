const { createContainer, asFunction, asValue, asClass } = require("awilix");

// 创建容器
const container = createContainer();

// 注册config
const config = require("./config");
container.register({
  config: asValue(config),
});

// 注册database
const { connect } = require("./db");
container.register({
  database: asFunction(connect).singleton(),
});

// 注册redis
const createRedis = require("./service/redisService");
container.register({
  redis: asClass(createRedis).singleton(),
});

// 注册app
const Express = require("express");
const bodyParser = require("body-parser");
const app = Express();
app.use(bodyParser.urlencoded({ extended: true, limit: "20mb" }));
app.use(bodyParser.json({ limit: "20mb" }));
container.register({
  app: asValue(app),
});

// 注册server
const HTTP = require("http");
function createServer(opts) {
  const { app } = opts;
  const server = HTTP.createServer(app);
  return server;
}
container.register({
  server: asFunction(createServer).singleton(),
});

// 注册wss
const createWSServer = require("./websocket");
container.register({
  wss: asFunction(createWSServer).singleton(),
});

// 注册service
const connectionService = require("./service/connectionService");
container.register({
  connectionService: asClass(connectionService).singleton(),
});

const coverageService = require("./service/coverageService");
container.register({
  coverageService: asClass(coverageService).singleton(),
});

// 注册router
const connectionRouter = require("./router/connections");
container.register({
  connectionRouter: asFunction(connectionRouter).singleton(),
});

const coverageRouter = require("./router/coverages");
container.register({
  coverageRouter: asFunction(coverageRouter).singleton(),
});

module.exports = container;
