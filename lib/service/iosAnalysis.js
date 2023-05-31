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

module.exports = { fileMerge, fileCov, tempFiles };
