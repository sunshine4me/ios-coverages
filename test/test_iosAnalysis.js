const path = require("path");
const fs = require("fs");
const { fileMerge, fileCov, tempFiles } = require("../lib/service/iosAnalysis");

const bufferData = fs.readFileSync(path.join(__dirname, "../lib/public/file.profraw"));
const objectFile = path.join(__dirname, "../objectFiles/test_objectfile");

const fm = new fileMerge();
fm.inputFile(bufferData);
fm.merge().then((profile) => {
  const fc = new fileCov(objectFile);
  fc.cov(profile).then((e) => {
    console.log(e.stdout);
  });
});

setTimeout(() => {
  console.log(tempFiles);
}, 5000);
