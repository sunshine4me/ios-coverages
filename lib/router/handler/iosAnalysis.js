const express = require("express");
const { fileMerge, fileCov, getCoverageData, getSummary } = require("../../service/iosAnalysis");

async function getLocvData(bufferData, objectFilePath) {
  const fm = new fileMerge();
  fm.inputFile(bufferData); //可以不用 await 在merge的时候会自动等待写入完成
  const profile = await fm.merge();

  const fc = new fileCov(objectFilePath);
  const result = await fc.cov(profile);
  return result.stdout;
}

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
  if (!bufferData || !objectFilePath) {
    return res.error("bufferData or objectFilePath not found");
  }

  getLocvData(bufferData, objectFilePath)
    .then((lcovData) => {
      res.success(lcovData);
    })
    .catch(next);
});

router.get("/summary", (req, res, next) => {
  const bufferData = req.coverageData;
  const objectFilePath = req.objectFilePath;
  if (!bufferData || !objectFilePath) {
    return res.error("bufferData or objectFilePath not found");
  }

  getLocvData(bufferData, objectFilePath)
    .then((lcovData) => {
      const coverageData = getCoverageData(lcovData);
      const summary = getSummary(coverageData);
      res.success(summary);
    })
    .catch(next);
});

// router.get("/detail", (req, res, next) => {
//   res.send("detail");
// });

module.exports = router;
