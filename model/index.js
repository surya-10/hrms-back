const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.user = require("./Auth/user.model.js");
db.session = require("./Auth/usersession.model.js");
db.activity = require("./Auth/activitylog.model.js");
db.request = require("./requestlog.model.js");
db.role = require("./role.model.js");
db.profile = require("./profile.model.js");
db.profession = require("./profession.model.js");
db.compensation = require("./compensation.model.js");
db.bankdetails = require("./bank-details.model.js");
db.benefits = require("./benefits.model.js");
db.timeoff = require("./timeoff.model.js");
db.timeoffhistory = require("./timeoff-history.model.js");
db.attendance = require("./attendance.model.js");
db.loginHistory = require("./checkin.model.js");
db.attendenceHistory = require("./attendence.history.model.js");
db.workingDays = require("./WorkingDay.model.js");
db.breakRecords = require("./Breaks.model.js");
db.employeeLeaveRecorder = require("./Auth/employee.leave.recorder.model.js");
db.holidayRecords = require("./Auth/holiday.model.js");
db.leaveRecords = require("./Auth/employee.record.leave.js");
db.permissionRecords = require("./Auth/employee.permission.model.js")

module.exports = db;
