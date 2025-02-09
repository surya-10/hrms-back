const mongoose = require("mongoose");

const BreakSchema = new mongoose.Schema({
    breakName: { type: String, required: true },
    startTime: { type: String, required: true },
    breakValue: { type: String, required: false },
    endTime: { type: String, required: false },
});

const UserBreakSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    date: { type: Date, default: Date.now },
    totalBreaksTaken: { type: Number, default: 0 },
    breaks: { type: [BreakSchema], default: [] },
});

module.exports = mongoose.model("UserBreak", UserBreakSchema);