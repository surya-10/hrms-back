module.exports = (app) => {
  const activity = require("../../controller/Auth/activity.controller.js");
  const asyncHandler = require("express-async-handler");
  const { authBearer } = require("../../middleware/authorization.service.js");
  var router = require("express").Router();

  router.post("/activity-log", authBearer, asyncHandler(activity.createLog));

  router.get("/activity-log", authBearer, asyncHandler(activity.getLog));

  app.use("/api/routes/activity", router);
};
