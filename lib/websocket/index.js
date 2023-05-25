const WS = require("ws");
const MyWebSocket = require("./MyWebSocket");

function createServer(opts) {
  const server = opts.server;

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

  const pingInterval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  const collectInterval = setInterval(function autoCollect() {
    wss.clients.forEach(function each(ws) {
      if (ws.auto === true) {
        console.log("自动收集", ws.id);
        ws.send(
          JSON.stringify({
            event: "collect",
          })
        );
      }
    });
  }, 5000);

  wss.on("close", function () {
    clearInterval(pingInterval);
    clearInterval(collectInterval);
  });

  return wss;
}

module.exports = createServer;
