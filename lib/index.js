const container = require("./container");

/** @type {import("express").Application} */
const app = container.resolve("app");

app.get("/", (req, res) => {
  res.send("hello");
});

const connectionRouter = container.resolve("connectionRouter");

// 统一输出结构
app.use((req, res, next) => {
  res.success = function (data) {
    const fileds = req.query.fileds;
    let rtObject = data;
    if (!Array.isArray(data) && Array.isArray(fileds)) {
      rtObject = {};
      for (var filed of fileds) {
        rtObject[filed] = data[filed];
      }
    }
    res.json({
      code: 200,
      message: "ok",
      result: rtObject,
    });
  };
  res.pageSuccess = function ({ data, page, pageSize, total }) {
    res.json({
      code: 200,
      message: "ok",
      result: data,
      page,
      pageSize,
      total,
    });
  };
  res.error = function (error) {
    res.json({
      code: 500,
      message: error?.message || error || "系统错误，请联系管理员",
    });
  };
  next();
});
app.use("/api/connections", connectionRouter);

//错误处理
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({
    code: 500,
    message: err.message || err,
    result: err.stack,
  });
});
//启动服务
const config = container.resolve("config");
/** @type {import("http").Server} */
const server = container.resolve("server");

const port = config.port || 3000;
server.listen(port);
console.log("Starting server at: http://localhost:" + port);
