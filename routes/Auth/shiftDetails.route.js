module.exports = (app) => {
    const shiftDetails = require("../../controller/Auth/shiftDetails.controller.js");
    const asyncHandler = require("express-async-handler");
    const { authBearer2, authBearer} = require("../../middleware/authorization.service.js");
    var router = require("express").Router();
  
    router.post("/add-shift-details", authBearer, asyncHandler(shiftDetails.addDetails));
    
  
    app.use("/api/routes/shift-details", router);
  };