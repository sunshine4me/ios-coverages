const express = require("express");
const { fileMerge, fileCov } = require("../../service/iosAnalysis");

const router = express.Router();
router.get("/dump", (req, res, next) => {
  // 设置响应的 Content-Disposition 头部，指定文件名和下载方式
  res.set("Content-Disposition", 'attachment; filename="file.profraw"');
  const bufferData = req.coverageData;
  res.send(bufferData);
});

router.get("/lcov", (req, res, next) => {
  const bufferData = req.coverageData;
  const objectFilePath = req.objectFilePath;

  const fm = new fileMerge();
  fm.inputFile(bufferData);
  fm.merge()
    .then((profile) => {
      const fc = new fileCov(objectFilePath);
      fc.cov(profile).then((e) => {
        res.success(e.stdout);
      });
    })
    .catch(next);
});

router.get("/summary", (req, res, next) => {
  res.send("summary");
});

router.get("/detail", (req, res, next) => {
  res.send("detail");
});

module.exports = router;
