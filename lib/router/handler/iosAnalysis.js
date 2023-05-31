const express = require("express");

const router = express.Router();
router.get("/dump", (req, res, next) => {
  // 设置响应的 Content-Disposition 头部，指定文件名和下载方式
  res.set("Content-Disposition", 'attachment; filename="file.profraw"');
  const bufferData = req.coverageData;
  res.send(bufferData);
});

router.get("/summary", (req, res, next) => {
  res.send("summary");
});

router.get("/detail", (req, res, next) => {
  res.send("detail");
});

module.exports = router;
