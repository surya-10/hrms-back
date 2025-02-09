module.exports = (app) => {
    const leaveRecord = require("../../controller/Auth/employee.leave.recorder.controller.js");
    const asyncHandler = require("express-async-handler");
    const { authBearer2, authBearer} = require("../../middleware/authorization.service.js");
    var router = require("express").Router();
  
    router.get("/get-month/:monthFor/:userId", asyncHandler(leaveRecord.getMonths));
    // router.get("/get-breaks/:userId/:date", authBearer, asyncHandler(breakDetails.getBreakByDate));
    // router.get("/get-all-breaks/:userId", authBearer, asyncHandler(breakDetails.getAllBreaks));

  
    app.use("/api/routes/leave-counts", router);
}