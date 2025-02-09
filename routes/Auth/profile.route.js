module.exports = (app) => {
    const user = require("../../controller/Auth/user.controller.js");
    const asyncHandler = require("express-async-handler");
    const { authBearer } = require("../../middleware/authorization.service.js");
    var router = require("express").Router();

    // Get profile details
    router.get(
        "/get-profile/:id",
        authBearer,
        asyncHandler(user.listUserDetails)
    );

    // Update emergency contacts
    router.post(
        "/update-emergency-contacts/:id",
        authBearer,
        asyncHandler(user.updateEmergencyContacts)
    );

    app.use("/api/routes/profile", router);
}; 