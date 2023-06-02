const express = require("express");
const { fileMerge, fileCov } = require("../../service/iosAnalysis");

async function getLocvData(bufferData, objectFilePath) {
  const fm = new fileMerge();
  fm.inputFile(bufferData); //可以不用 await 在merge的时候会自动等待写入完成
  const profile = await fm.merge();

  const fc = new fileCov(objectFilePath);
  const result = await fc.cov(profile);
  return result.stdout;
}

function getCoverageData(lcovData) {
  const coverageData = {};

  let files = lcovData.split("end_of_record\n");
  for (let file of files) {
    const fileCoverageData = {
      path: null,
      l: {},
      f: {},
      b: {},
      fnMap: {},
    };
    let lines = file.split("\n");
    for (let line of lines) {
      let lineParts = line.split(":");
      let inputType = lineParts[0];

      if (inputType === "SF") {
        let fileName = lineParts.slice(1).join(":").trim();
        fileCoverageData.path = fileName;
      } else if (inputType === "DA") {
        let lineParts = line.split(":");
        let lineData = lineParts.slice(1).join(":").trim().split(",");
        let lineNumber = parseInt(lineData[0]);
        let lineHits = parseInt(lineData[1]);

        fileCoverageData.l[lineNumber] = lineHits;
      } else if (inputType === "BRDA") {
        let lineParts = line.split(":");
        let lineData = lineParts.slice(1).join(":").trim().split(",");
        let lineNumber = parseInt(lineData[0]);
        let blockNumber = parseInt(lineData[1]);
        let branchNumber = parseInt(lineData[2]);
        let branchHits = parseInt(lineData[3]);

        const key = Object.keys(fileCoverageData.b).length;
        fileCoverageData.b[key] = [lineNumber, blockNumber, branchNumber, branchHits];
      } else if (inputType === "FN") {
        let lineParts = line.split(":");
        let lineData = lineParts.slice(1).join(":").trim().split(",");
        let functionLine = parseInt(lineData[0]);
        let functionName = lineData[1];

        const key = Object.keys(fileCoverageData.fnMap).length;
        fileCoverageData.fnMap[key] = [functionName, functionLine];
      } else if (inputType === "FNDA") {
        let lineParts = line.split(":");
        let lineData = lineParts.slice(1).join(":").trim().split(",");
        let functionHits = parseInt(lineData[0]);
        let functionName = lineData[1];

        const key = Object.keys(fileCoverageData.f).length;
        fileCoverageData.f[key] = [functionName, functionHits];
      }
    }

    if (fileCoverageData.path) {
      coverageData[fileCoverageData.path] = fileCoverageData;
    }
  }

  return coverageData;
}

function countPct(num, total) {
  const percentage = (num / total) * 100;
  const roundedPercentage = percentage.toFixed(2); // 保留两位小数
  const formattedPercentage = parseFloat(roundedPercentage); // 将字符串转换为浮点数

  return formattedPercentage;
}
function countData(node) {
  //只有 isSummary 的 数据需要 统计
  if (!node.isSummary) {
    return;
  }

  ["line", "functions", "branches"].forEach((key) => {
    node[key] = { total: 0, covered: 0, skipped: 0 };
  });

  for (const child of node.children) {
    child.file = node.file + "/" + child.file;
    countData(child);

    ["line", "functions", "branches"].forEach((key) => {
      node[key].total += child[key].total;
      node[key].covered += child[key].covered;
      node[key].skipped += child[key].skipped;
    });
  }

  ["line", "functions", "branches"].forEach((key) => {
    node[key].pct = countPct(node[key].covered, node[key].total);
  });

  return node;
}

function getSummary(coverageData) {
  const tree = {};

  for (const key in coverageData) {
    const path = coverageData[key].path;
    const segments = path.split("/");
    let currentNode = tree;

    for (let segment of segments) {
      //初始化children
      if (!currentNode.children) {
        currentNode.children = [];
      }

      //创建 child
      let child = currentNode.children.find((child) => {
        return child.file == segment;
      });
      if (!child) {
        child = { file: segment, isSummary: true };
        currentNode.children.push(child);
      }

      //currentNode 改为这个 child
      currentNode = child;
    }

    //detail 数据写入
    currentNode.isSummary = false;
    const detail = coverageData[key];
    currentNode.detail = detail;

    const lineTotal = Object.keys(detail.l).length;
    const lineCovered = Object.keys(detail.l).filter((key) => {
      return detail.l[key] > 0;
    }).length;
    currentNode.line = {
      total: lineTotal,
      covered: lineCovered,
      skipped: lineTotal - lineCovered,
      pct: countPct(lineCovered, lineTotal),
    };

    const fnTotal = Object.keys(detail.f).length;
    const fnCovered = Object.keys(detail.f).filter((key) => {
      return detail.f[key] > 0;
    }).length;
    currentNode.functions = {
      total: fnTotal,
      covered: fnCovered,
      skipped: fnTotal - fnCovered,
      pct: countPct(fnCovered, fnTotal),
    };

    const bTotal = Object.keys(detail.b).length;
    const bCovered = Object.keys(detail.b).filter((key) => {
      return detail.b[key][3] > 0;
    }).length;
    currentNode.branches = {
      total: bTotal,
      covered: bCovered,
      skipped: bTotal - bCovered,
      pct: countPct(bCovered, bTotal),
    };
  }

  //去除无效父节点
  let root = tree;
  while (true) {
    if (root && root.children.length > 1) break;
    root = root.children[0];
  }

  //去除无效中间节点
  function removeLess(node) {
    if (!node.isSummary) {
      return;
    }

    if (node.children.length == 1) {
      if (node.children[0].isSummary) {
        node.children = node.children[0].children;
      }
      removeLess(node);
    } else {
      node.children.forEach((child) => {
        removeLess(child);
      });
    }
  }

  //计算数据
  countData(root);

  removeLess(root);
  return root;
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
