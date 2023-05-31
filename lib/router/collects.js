const express = require("express");
const iosAnalysisRouter = require("./handler/iosAnalysis");

function createRouter(opts) {
  /** @type {import("../service/coverageService")} */
  const coverageService = opts.coverageService;
  const router = express.Router();
  router.get("/", (req, res, next) => {
    const { page = 1, pageSize = 10, tag, versionName, fingerprint } = req.query;
    const filter = { page, pageSize, tag, versionName, fingerprint };
    coverageService
      .getCollects(filter)
      .then(({ rows, total }) => {
        res.pageSuccess({ data: rows, total, page, pageSize });
      })
      .catch(next);
  });

  router.get("/:id", (req, res, next) => {
    const { id } = req.params;
    coverageService
      .getCollect(id)
      .then((collect) => {
        const dataValues = collect.dataValues;
        delete dataValues.coverageData;
        res.success(dataValues);
      })
      .catch(next);
  });

  router.use(
    "/:id",
    (req, res, next) => {
      const { id } = req.params;
      (async () => {
        const collect = await coverageService.getCollect(id);
        if (collect) {
          req.coverageData = collect.coverageData;
          const version = await coverageService.getVersion(collect.versionName);
          if (version) {
            req.objectFilePath = version.objectFilePath;
          }

          next();
        } else {
          throw Error("nout found collect");
        }
      })().catch(next);
    },
    iosAnalysisRouter
  );

  return router;
}

module.exports = createRouter;
