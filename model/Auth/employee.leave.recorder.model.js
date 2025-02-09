const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    total_leave_taken: { type: Number, default: 0 },
    total_loss_of_pay: { type: Number, default: 0 },
    half_days_taken: { type: Number, default: 0 },
    half_day_count: { type: Number, default: 0 },
    permission_count: { type: Number, default: 0 }
});

leaveSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Leave", leaveSchema);