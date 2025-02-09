const mongoose = require("mongoose");

const workingDaysSchema = new mongoose.Schema({
  year: Number,
  month: Number,
  totalWorkingDays: Number,
  createdAt: { type: Date, default: Date.now },
});

const WorkingDays = mongoose.model("WorkingDays", workingDaysSchema);

module.exports = WorkingDays;