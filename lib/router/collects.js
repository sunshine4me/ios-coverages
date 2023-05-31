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
        res.success(collect);
      })
      .catch(next);
  });

  router.use(
    "/:id",
    (req, res, next) => {
      const { id } = req.params;
      coverageService
        .getCollect(id)
        .then((collect) => {
          if (collect) {
            req.coverageData = collect.coverageData;
            next();
          } else {
            throw Error("nout found collect");
          }
        })
        .catch(next);
    },
    iosAnalysisRouter
  );

  return router;
}

module.exports = createRouter;
