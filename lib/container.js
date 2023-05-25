const { createContainer, asFunction, asValue } = require("awilix");

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

// 注册app
const Express = require("express");
const app = Express();
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
const createConnectionService = require("./service/connections");
container.register({
  connectionService: asFunction(createConnectionService).singleton(),
});

// 注册router
const createConnectionRouter = require("./router/connections");
container.register({
  connectionRouter: asFunction(createConnectionRouter).singleton(),
});

module.exports = container;
