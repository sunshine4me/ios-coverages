function createService(opts) {
  /** @type {import("ws").Server<import("../websocket/MyWebSocket")>} */
  const wss = opts.wss;
  return {
    getAll() {
      return Array.from(wss.clients);
    },
    get(id) {
      for (const client of wss.clients) {
        if (client.id == id || client.fingerprint == id) {
          return client;
        }
      }
    },
    filterConnections: function ({ ids, ip, versionName, fingerprint, tag }) {
      const connections = [];
      wss.clients.forEach((connection) => {
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
    },
  };
}

module.exports = createService;
