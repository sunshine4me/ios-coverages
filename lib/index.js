const path = require("path");
const container = require("./container");

/** @type {import("express").Application} */
const app = container.resolve("app");

// 统一输出结构
app.use((req, res, next) => {
  res.success = function (data, msg) {
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
      message: msg ? msg : "ok",
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

const connectionRouter = container.resolve("connectionRouter");
app.use("/api/connections", connectionRouter);

const coverageRouter = container.resolve("coverageRouter");
app.use("/api/coverages", coverageRouter);

const collectRouter = container.resolve("collectRouter");
app.use("/api/collects", collectRouter);

//错误处理
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({
    code: 500,
    message: err.message || err,
    result: err.stack,
  });
});

//测试页面
app.set("view engine", "hbs");
app.engine("hbs", require("hbs").__express);
app.set("views", path.join(__dirname, "./views"));
app.get("/client.html", function (req, res, next) {
  res.render("client", {});
});

const express = require("express");
app.use("/static", express.static(__dirname + "/public"));

//初始化数据库
const database = container.resolve("database");

database.db.sync().then(async () => {
  //TODO 测试用数据后期删除
  const objectFilePath = path.join(__dirname, "../objectFiles/test_objectfile");
  await database.tables.Version.findOrCreate({
    where: {
      name: "ios-test-0.1",
    },
    defaults: {
      objectFilePath: objectFilePath,
    },
  });

  //启动服务
  const config = container.resolve("config");
  /** @type {import("http").Server} */
  const server = container.resolve("server");

  const port = config.port || 8888;
  server.listen(port);
  console.log("Starting server at: http://localhost:" + port);
});
