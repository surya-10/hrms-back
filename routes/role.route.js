module.exports = (app) => {
  const role = require("../controller/role.controller.js");
  const asyncHandler = require("express-async-handler");
  const { authBearer } = require("../middleware/authorization.service.js");

  var router = require("express").Router();

  router.post("/create-role", asyncHandler(role.createRole));

  router.get("/list-role", asyncHandler(role.listRoles));

  router.delete("/delete-role/:id", asyncHandler(role.deleteRole));

  app.use("/api/routes/role", router);
};