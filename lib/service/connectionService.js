class connectionService {
  constructor(opts) {
    /** @type {import("ws").Server<import("../websocket/MyWebSocket")>} */
    this.wss = opts.wss;
    /** @type {import("../db/index").Database} */
    const database = opts.database;
    this.Collect = database.tables.Collect;
  }
  getAll() {
    return Array.from(this.wss.clients);
  }
  get(id) {
    for (const client of this.wss.clients) {
      if (client.id == id || client.fingerprint == id) {
        return client;
      }
    }
  }
  /**
   *
   * @param {import("../websocket/MyWebSocket")} ws
   */
  async saveCollect(ws) {
    if (ws.lastCollect && ws.lastCollect.coverageData) {
      return this.Collect.create({
        ip: ws.ip,
        userAgent: ws.userAgent,
        fingerprint: ws.fingerprint,
        versionName: ws.versionName,
        // tag: ws.task?.tag,
        coverageData: ws.lastCollect.coverageData,
      });
    }
  }
  /**
   *
   * @returns {Array.<import("../websocket/MyWebSocket")>}
   */
  filter({ ids, ip, versionName, fingerprint, tag }) {
    const connections = [];
    this.wss.clients.forEach((connection) => {
      const { id, ip: cIp, fingerprint: cFingerprint, versionName: cVersionName, tag: cTag } = connection;

      const idMatch = !ids || ids.includes(id);
      const ipMatch = !ip || ip === cIp;
      const fingerprintMatch = !fingerprint || fingerprint === cFingerprint;
      const versionNameMatch = !versionName || versionName === cVersionName;
      const tagMatch = !tag || tag === cTag;

      if (idMatch && ipMatch && fingerprintMatch && versionNameMatch && tagMatch) {
        connections.push(connection);
      }
    });
    return connections;
  }
}

module.exports = connectionService;
