class Task {
  constructor({ tag, auto, completeTime, status, versionName, collect }) {
    this.tag = tag;
    this.auto = auto;
    this.completeTime = completeTime;
    this.status = status;
    this.versionName = versionName;
    this.collect = collect;
  }
  toJSON() {
    return {
      tag: this.tag,
      auto: this.auto,
      completeTime: this.completeTime,
      status: this.status,
      versionName: this.versionName,
      collect: this.collect
        ? {
            id: this.collect.id,
          }
        : null,
    };
  }
}
module.exports = Task;
