const moment = require("moment");
const holidays = require("moment-holiday");
const WorkingDays = require("../../model/WorkingDay.model.js");

const indianHolidays = [
  "2025-01-26", // Republic Day
  "2025-08-15", // Independence Day
  "2025-10-02", // Gandhi Jayanti
  "2025-12-25", // Christmas
  // Add other holidays here
];

const calculateWorkingDays = () => {
  const now = moment();
  const year = now.year();
  const month = now.month() + 1; 
  const start = moment(`${year}-${month}-01`);
  const end = start.clone().endOf("month");

  let workingDays = 0;

  for (let date = start.clone(); date.isBefore(end) || date.isSame(end); date.add(1, "day")) {
    const dayOfWeek = date.day();
    const formattedDate = date.format("YYYY-MM-DD");

    if (dayOfWeek === 0) continue; 
    if (dayOfWeek === 6 && Math.ceil(date.date() / 7) === 2) continue;
    if (indianHolidays.includes(formattedDate)) continue;

    workingDays++;
  }

  return { year, month, totalWorkingDays: workingDays };
};

const storeWorkingDays = async () => {
  const data = calculateWorkingDays();
  const existingRecord = await WorkingDays.findOne({ year: data.year, month: data.month });

  if (!existingRecord) {
    await WorkingDays.create(data);
    console.log(`Stored working days for ${data.month}-${data.year}: ${data.totalWorkingDays}`);
  } else {
    console.log("Data already exists for this month.");
  }
};

module.exports = { calculateWorkingDays, storeWorkingDays };