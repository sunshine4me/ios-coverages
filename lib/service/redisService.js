const { Redis } = require("ioredis");

class redisService {
  constructor(opts) {
    const { host, port, password } = opts.config.redis;
    if (host) {
      const redis = new Redis({
        host: host,
        port: port,
        password: password,
        db: 2,
      });
      this.redis = redis;
    }
  }
  async get(key) {
    if (this.redis) {
      const value = await this.redis.get(key);
      if (value) {
        return JSON.parse(value);
      }
    }
  }

  save(key, data) {
    if (this.redis) {
      const EX = 3600 * 24 * 2;
      this.redis.set(key, JSON.stringify(data), "EX", EX);
    }
  }
}

module.exports = redisService;
