const execa = require("execa");
const path = require("path");
const fs = require("fs").promises;
const tempDir = path.join(__dirname, "../../temp");
const llvm_profdata = path.join(__dirname, "../../bin/llvm-profdata");
const llvm_cov = path.join(__dirname, "../../bin/llvm-cov");

const crypto = require("crypto");
function generateMD5Hash(inputData) {
  const hash = crypto.createHash("md5");
  hash.update(inputData);
  return hash.digest("hex");
}

//temp 文件缓存
const tempFiles = {};
async function writeProfdataTemp(bufferData) {
  const fileName = generateMD5Hash(bufferData) + ".profdata";
  const filePath = path.join(tempDir, fileName);
  let filePromise;
  const tempFile = tempFiles[fileName];
  if (tempFile) {
    filePromise = tempFile;
  } else {
    filePromise = fs
      .writeFile(filePath, bufferData)
      .then(() => {
        return filePath;
      })
      .catch((e) => {
        delete tempFiles[fileName];
        throw e;
      });
    tempFiles[fileName] = filePromise;
  }
  return filePromise;
}

class fileCov {
  constructor(objectFile) {
    this.objectFile = objectFile;
  }
  async cov(profile) {
    const args = ["export"];
    args.push(this.objectFile);
    args.push("--instr-profile=" + profile);
    args.push("--format=lcov");

    return execa(llvm_cov, args);
  }
}

class fileMerge {
  constructor() {
    this.filePromises = [];
  }

  async inputFile(bufferData) {
    const filePromise = writeProfdataTemp(bufferData);
    this.filePromises.push(filePromise);
    return filePromise;
  }

  async merge() {
    //拼接命令
    const args = ["merge", "-sparse"];

    const inputFiles = await Promise.all(this.filePromises);
    inputFiles.forEach((inputFile) => {
      args.push(inputFile);
    });

    const outputFile = generateMD5Hash(args.toString()) + ".profdata";
    const outputPath = path.join(tempDir, outputFile);
    args.push("-o");
    args.push(outputPath);

    //如果之前有缓存则直接返回
    const tempFile = tempFiles[outputFile];
    if (tempFile) {
      return tempFile;
    }

    const filePromise = execa(llvm_profdata, args)
      .then(() => {
        return outputPath;
      })
      .catch((err) => {
        delete tempFiles[outputFile];
        throw err;
      });
    tempFiles[outputFile] = filePromise;

    return filePromise;
  }
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

  ["lines", "functions", "branches"].forEach((key) => {
    node[key] = { total: 0, covered: 0, skipped: 0 };
  });

  for (const child of node.children) {
    child.file = node.file + "/" + child.file;
    countData(child);

    ["lines", "functions", "branches"].forEach((key) => {
      node[key].total += child[key].total;
      node[key].covered += child[key].covered;
      node[key].skipped += child[key].skipped;
    });
  }

  ["lines", "functions", "branches"].forEach((key) => {
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
    currentNode.lines = {
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

module.exports = { fileMerge, fileCov, tempFiles, getCoverageData, getSummary };
