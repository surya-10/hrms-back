module.exports = (app) => {
    const employee = require("../../controller/Auth/employee.controller.js");
    const asyncHandler = require("express-async-handler");
    const { authBearer2, authBearer} = require("../../middleware/authorization.service.js");
    var router = require("express").Router();
  
    router.post("/create-employee/:user_id", authBearer2, asyncHandler(employee.createEmployee));
    router.delete("/delete-employee/:id/:hr_id", authBearer, asyncHandler(employee.deleteEmployee));
    router.put("/change-employee-status/:id/:hr_id", authBearer, asyncHandler(employee.changeEmployeeStatus));
    router.get("/view-employees/:id", authBearer, asyncHandler(employee.getAllEmployees));
    router.get("/get-employee/:id", authBearer, asyncHandler(employee.getEmployee));
    router.put("/add-employee-details/:id/:hr_id", authBearer, asyncHandler(employee.updateEmployeeDetails));
    router.put("/add-employee-details-hr/:id/:hr_id", authBearer, asyncHandler(employee.updateEmployeeDetailsByHr));
    router.put("/update-profession/:id/:hr_id", asyncHandler(employee.updateEmployeeProfession));
    router.put("/update-employee-details/:hr_id", authBearer, asyncHandler(employee.updateEmployeeBasicDetails))

  
    // router.get("/get-employees", authBearer2, asyncHandler(employee.getUser));
  
    // router.get(
    //   "/list-employee-details/:id",
    //   authBearer2,
    //   asyncHandler(employee.listUserDetails)
    // );
  
    // router.put("/update-employee-details/:id", authBearer, asyncHandler(employee.updateUserDetails));
  
    // router.delete("/employee-delete/:id", authBearer2, asyncHandler(employee.deleteUser));
  
  
    app.use("/api/routes/employee", router);
  };
  