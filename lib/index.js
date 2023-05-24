const Express = require("express");
const WS = require("ws");
const HTTP = require("http");
const MyWebSocket = require("./MyWebSocket");

const app = Express();

const server = HTTP.createServer(app);

const wss = new WS.Server({
  server: server,
  WebSocket: MyWebSocket,
});

wss.on(
  "connection",
  /** @param {MyWebSocket} ws */
  function connection(ws, req) {
    ws.customInit(req);
  }
);

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("close", function () {
  clearInterval(interval);
});

const apiRouter = require("./router/api")(wss);
app.use("/api", apiRouter);

const port = 3000;
server.listen(port);
console.log("Starting server at: http://localhost:" + port);
