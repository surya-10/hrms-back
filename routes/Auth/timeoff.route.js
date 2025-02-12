module.exports = (app) => {
    const timeoff = require("../../controller/Auth/timeoff.controller.js");
    const asyncHandler = require("express-async-handler");
    const { authBearer2, authBearer} = require("../../middleware/authorization.service.js");
    var router = require("express").Router();
  
    router.post("/create-timeoff/:id", authBearer, asyncHandler(timeoff.createTimeoff));
    router.put("/edit-timeoff/:id/:timeoffId", authBearer, asyncHandler(timeoff.editTimeoff));
    router.put("/approve-timeoff/:id/:timeoffId/:managerId", authBearer, asyncHandler(timeoff.approveTimeoff));
    router.put("/approve-timeoff-email/:id/:timeoffId/:managerId", authBearer, asyncHandler(timeoff.updateTimeoffStatusByEmail));
    router.put("/reject-timeoff-email/:id/:timeoffId/:managerId", authBearer, asyncHandler(timeoff.updateTimeoffStatusByEmailReject));
    router.put("/reject-timeoff/:id/:timeoffId/:managerId", authBearer, asyncHandler(timeoff.rejectTimeoff));
    router.get("/view-timeoff/:id", authBearer, asyncHandler(timeoff.viewTimeoff))
    router.post("/create-timeoff-admin/:adminId/:id", authBearer, asyncHandler(timeoff.createTimeoffByAdmin));
    router.put("/edit-timeoff-hr/:hr_id/:user_id/:timeoffId", authBearer, asyncHandler(timeoff.editTimeofffByHr));
    router.put("/update-timeoff/:id", authBearer, asyncHandler(timeoff.updateTimeoffStatus));
    router.put("/update-timeoff-email/:id", authBearer, asyncHandler(timeoff.updateTimeoffStatusByEmail));
    router.get("/monthly-leaves/:id/:month/:year", authBearer, asyncHandler(timeoff.getMonthlyLeaves));
    router.post("/send-pending-notifications", authBearer, asyncHandler(timeoff.sendPendingLeaveNotifications));

    // router.delete("/delete-employee/:id/:hr_id", authBearer, asyncHandler(employee.deleteEmployee));
    // router.put("/change-employee-status/:id/:hr_id", authBearer, asyncHandler(employee.changeEmployeeStatus));
    // router.get("/view-employees/:id", authBearer, asyncHandler(employee.getAllEmployees));
    // router.put("/add-employee-details/:id", authBearer, asyncHandler(employee.updateEmployeeDetails));
    // router.put("/update-profession/:id", authBearer, asyncHandler(employee.updateEmployeeProfession))
  
    app.use("/api/routes/time-off", router);
  };