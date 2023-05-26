const express = require("express");

function createRouter(opts) {
  /** @type {import("../service/coverageService")} */
  const coverageService = opts.coverageService;
  const router = express.Router();
  router.get("/", (req, res, next) => {
    const { page = 1, pageSize = 10, name, tag, category, status, startTime, endTime } = req.query;
    const filter = { page, pageSize, name, tag, category, status, startTime, endTime };
    coverageService
      .getAll(filter)
      .then(({ tasks, total }) => {
        res.pageSuccess({ data: tasks, total, page, pageSize });
      })
      .catch(next);
  });

  router.get("/:id", (req, res, next) => {
    const { id } = req.params;
    coverageService
      .get(id)
      .then((coverage) => {
        res.success(coverage);
      })
      .catch(next);
  });

  return router;
}

module.exports = createRouter;
