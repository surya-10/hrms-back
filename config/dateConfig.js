const moment = require("moment")
const momentTimeZone = require("moment-timezone");
var datetime = new Date();
var hour = new Date().getHours();
var minutes = new Date().getMinutes();
let hour = new Date().getHours();
let minutes = new Date().getMinutes();

let dateUTC = momentTimeZone.tz(datetime, "UTC");
const todayDate = moment(datetime).tz('Asia/Kolkata').format('YYYY-MM-DD');
const todayDateTime = moment(datetime).tz('Asia/Kolkata').format('YYYY-MM-DD hh:mm a');
const todayTimeHour = hour;
const todayTimeMinutes = minutes;
const thisMonth = moment(datetime).tz('Asia/Kolkata').format('YYYY-MM');
const currentMonth = moment(datetime).tz('Asia/Kolkata').format('YYYY-MM');

module.exports = { dateUTC, todayDate, todayDateTime, thisMonth, currentMonth, todayTimeHour,todayTimeMinutes }
