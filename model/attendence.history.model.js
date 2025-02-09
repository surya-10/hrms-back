const mongoose = require("mongoose");

const attendanceHistorySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    profile_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Profile",
    },
    profession_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Profession",
    }, 
    timeoff_history_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Timeoffhistory",
    },
    no_of_days: {
        type: Number,
        required: false,
    },
    leave_request_id:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Timeoffhistory",
    },
    leave_type: {
        type: String,
        required: true,
    },
    hour_count: {
        type: Number,
        default:0,
        required: false,
    },
    month_for: {
        type: String,
        required: true,
    },
    leave_date: {
        start_date: {
            type: String,
            required: true
        },
        end_date: {
            type: String,
            required: true
        }
    },
    approval_status: [
        {
            status: {
                type: String,
                required: true,
            },
            approved_by: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: "User",
            },
            approved_on: {
                type: String,
                required: false,
            },
            approval_comments: {
                type: String,
                required: false,
            },
        },
    ],
});

module.exports = mongoose.model("AttendanceHistory", attendanceHistorySchema);
