const express = require("express");

function createRouter(wss) {
  const router = express.Router();

  router.use((req, res, next) => {
    // 统一输出结构
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

  if (wss) {
    const createRouter = require("./connections");
    const cRouter = createRouter(wss);
    router.use("/connections", cRouter);
  }

  router.use(function (err, req, res, next) {
    console.error(err.stack);
    res.error(err);
  });
  return router;
}

module.exports = createRouter;
