const mongoose = require("mongoose");

const logHistorySchema = new mongoose.Schema({
    startTime: {
        type: String,
        required: false
    },
    type:{
        type: String,
        required: false
    },
    endTime: {
        type: String,
        required: false
    }
});

const attendanceSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            required: true
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true
        },
        attendance: [
            {
                date: {
                    type: Date,
                    required: true
                },
                logHistory: [logHistorySchema]
            }
        ]
    },
    {
        timestamps: true
    }
);

const LoginInHistory = mongoose.model("LoginInHistory", attendanceSchema);

module.exports = LoginInHistory;
