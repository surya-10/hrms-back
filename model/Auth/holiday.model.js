const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
    holidayName: {
        type: String,
        required: true
    },
    date: {
        type: String,  // Format: "DD-MM-YYYY"
        required: true
    },
    month_for: {
        type: Number,  // Format: "MM-YYYY"
        required: true
    },
    year: {
        type: Number,  // Example: "2025"
        required: true
    },
    description: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Holiday', holidaySchema);
