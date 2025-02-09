const mongoose = require("mongoose");

// Utility function to format the date to 'yyyy-mm-dd 00:00 AM/PM'
function formatDateToIST(date) {
  // Convert the date to IST by adding 5 hours and 30 minutes
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istDate = new Date(date.getTime() + istOffset);

  // Extract year, month, day, hours, and minutes
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");

  let hours = istDate.getUTCHours();
  const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12; // Convert to 12-hour format and handle midnight (0 should be 12)

  const formattedTime = `${String(hours).padStart(2, "0")}:${minutes}`;

  return `${year}-${month}-${day} ${formattedTime} ${period}`;
}

const activitySchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    date: {
      type: String, // Store the formatted date as a string
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    event: {
      type: String,
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Users",
    },
  },
  { timestamps: true }
);

activitySchema.pre("save", function (next) {
  const activity = this;

  const now = new Date();
  activity.date = formatDateToIST(now);

  next();
});

const activity = mongoose.model('Activity', activitySchema);

module.exports = activity;