const Holiday = require("../../model/Auth/holiday.model.js");

exports.addHoliday = async (req, res) => {
    try {
        const { holidayName, date, month_for, year, description } = req.body;

        // Check if holiday already exists
        const existingHoliday = await Holiday.findOne({ holidayName, date });

        if (existingHoliday) {
            return res.status(400).json({ 
                success: false, 
                message: 'Holiday already exists', 
                holiday: existingHoliday 
            });
        }

        // If not found, add new holiday
        const newHoliday = new Holiday({
            holidayName,
            date,
            month_for,
            year,
            description
        });

        await newHoliday.save();
        res.status(201).json({ success: true, message: 'Holiday added successfully', holiday: newHoliday });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding holiday', error: error.message });
    }
};


exports.getAllHolidays = async (req, res) => {
    try {
        const holidays = await Holiday.find();
        res.status(200).json({ success: true, holidays });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching holidays', error: error.message });
    }
};

// 📌 Get holidays by month and year (e.g., "01-2025")
exports.getHolidaysByMonth = async (req, res) => {
    try {
        const { month_for } = req.params;
        const holidays = await Holiday.find({ month_for });

        if (holidays.length === 0) {
            return res.status(404).json({ success: false, message: 'No holidays found for this month' });
        }

        res.status(200).json({ success: true, holidays });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching holidays', error: error.message });
    }
};

// 📌 Delete a holiday by ID
exports.deleteHoliday = async (req, res) => {
    try {
        const { id } = req.params;
        const holiday = await Holiday.findByIdAndDelete(id);

        if (!holiday) {
            return res.status(404).json({ success: false, message: 'Holiday not found' });
        }

        res.status(200).json({ success: true, message: 'Holiday deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting holiday', error: error.message });
    }
};
