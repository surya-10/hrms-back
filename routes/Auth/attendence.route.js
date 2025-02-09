module.exports = (app) => {
    const attendence = require("../../controller/Auth/attendence.controller.js");
    const asyncHandler = require("express-async-handler");
    const { authBearer2, authBearer} = require("../../middleware/authorization.service.js");
    var router = require("express").Router();


  
    router.post("/create-checkin/:id", authBearer, asyncHandler(attendence.createCheckIn));
    router.get("/get-loginHistory/:id", authBearer, asyncHandler(attendence.getcheckInHistory))
    router.get("/get-allAttendance", authBearer, asyncHandler(attendence.getAllAttendance))
    router.get("/get-checkin/:id/:date", authBearer, asyncHandler(attendence.getByDate));
    router.get("/get-all-checkin/:managerId", authBearer, asyncHandler(attendence.getAllCheckIn));
    router.get("/get-all-checkin-admin/:adminId", authBearer, asyncHandler(attendence.getAllCheckInAdmin));
    router.get("/get-all-data/:adminId", authBearer, asyncHandler(attendence.getAllCheckInData));

    // router.put("/edit-timeoff/:id/:timeoffId", authBearer, asyncHandler(timeoff.editTimeoff));
    // router.get("/approve-timeoff/:id/:timeoffId/:managerId", authBearer, asyncHandler(timeoff.approveTimeoff));
    // router.get("/reject-timeoff/:id/:timeoffId/:managerId", authBearer, asyncHandler(timeoff.rejectTimeoff));
    // router.get("/view-timeoff/:id", authBearer, asyncHandler(timeoff.viewTimeoff))
    // // router.delete("/delete-employee/:id/:hr_id", authBearer, asyncHandler(employee.deleteEmployee));
    // // router.put("/change-employee-status/:id/:hr_id", authBearer, asyncHandler(employee.changeEmployeeStatus));
    // // router.get("/view-employees/:id", authBearer, asyncHandler(employee.getAllEmployees));
    // // router.put("/add-employee-details/:id", authBearer, asyncHandler(employee.updateEmployeeDetails));
    // // router.put("/update-profession/:id", authBearer, asyncHandler(employee.updateEmployeeProfession))
  
    app.use("/api/routes/attendence", router);
  };