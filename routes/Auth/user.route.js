module.exports = (app) => {
  const user = require("../../controller/Auth/user.controller.js");
  const asyncHandler = require("express-async-handler");
  const { authBearer } = require("../../middleware/authorization.service.js");
  var router = require("express").Router();

  router.post("/create-user", asyncHandler(user.createUser));

  router.get("/get-users", authBearer, asyncHandler(user.getUser));

  router.get(
    "/list-user-details/:id",
    authBearer,
    asyncHandler(user.listUserDetails)
  );

  router.put("/update-user-details/:id", asyncHandler(user.updateUserDetails));

  router.delete("/user-delete/:id", authBearer, asyncHandler(user.deleteUser));

  router.post("/login", asyncHandler(user.loginUser));

  router.get("/logout", asyncHandler(user.logoutUser));
  router.post("/notify-user", asyncHandler(user.notifyUser));

  app.use("/api/routes/user", router);
};
