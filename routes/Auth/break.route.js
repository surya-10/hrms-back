module.exports = (app) => {
    const breakDetails = require("../../controller/Auth/break.controller.js");
    const asyncHandler = require("express-async-handler");
    const { authBearer2, authBearer} = require("../../middleware/authorization.service.js");
    var router = require("express").Router();
  
    router.post("/add-break/:userId", authBearer, asyncHandler(breakDetails.addBreaks));
    router.get("/get-breaks/:userId/:date", authBearer, asyncHandler(breakDetails.getBreakByDate));
    router.get("/get-all-breaks/:userId", authBearer, asyncHandler(breakDetails.getAllBreaks));

  
    app.use("/api/routes/break-details", router);
  };