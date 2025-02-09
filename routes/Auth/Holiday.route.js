module.exports = (app) => {
  const holidayData = require("../../controller/Auth/holiday.controller.js")
    const asyncHandler = require("express-async-handler");
    const { authBearer } = require("../../middleware/authorization.service.js");
    var router = require("express").Router();
  
    router.post("/add-holiday", asyncHandler(holidayData.addHoliday));
    router.get("/get-all-holidays", asyncHandler(holidayData.getAllHolidays))
  
  
    app.use("/api/routes/holiday", router);
  };