const mongoose = require('mongoose');

const LeaveRecordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    leaveRequestId: {
        type: String,
        required: true
    },
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    month: {
        type: Number,
        required: false,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: false
    },
    date: {
        type: [String],
        required: true
    },
    totalDays: {
        type: Number,
        required: true
    },
    startDate: {
        type: String,
        required: false
    },
    endDate: {
        type: String,
        required: false
    }
}, { timestamps: true });

module.exports = mongoose.model('LeaveRecord', LeaveRecordSchema);