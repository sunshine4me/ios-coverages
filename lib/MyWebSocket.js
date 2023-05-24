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
  }
  customInit(req) {
    const agent = useragent.parse(req.headers["user-agent"]);
    const urlSearchParams = new URLSearchParams(req.url.split("?")[1]);
    const versionName = urlSearchParams.get("versionName");
    const fingerprint = urlSearchParams.get("fingerprint");
    const ip = req.headers["x-real-ip"] || req.connection.remoteAddress;

    this.id = _connectionId;
    this.auto = false;
    this.ip = ip;
    this.versionName = versionName;
    this.fingerprint = fingerprint;
    this.agent = agent;
    this.connectTime = new Date();
  }
  toJSON() {
    return {
      id: this.id,
      ip: this.ip,
      tag: this.tag,
      versionName: this.versionName,
      fingerprint: this.fingerprint,
      agent: this.agent,
      auto: this.auto,
      connectTime: this.connectTime,
      lastMessage: this.lastMessage
        ? {
            time: this.lastMessage.time,
            data: this.lastMessage.data,
          }
        : null,
    };
  }
}

module.exports = MyWebSocket;
