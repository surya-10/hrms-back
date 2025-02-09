const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  target: { type: String, required: true, enum: ['All', 'Admin', 'Employee'] },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Announcement', announcementSchema);