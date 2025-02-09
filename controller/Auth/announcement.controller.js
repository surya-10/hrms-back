const Announcement = require('../../model/Auth/announcements.model');

// Create an announcement
const createAnnouncement = async (req, res) => {
  const { title, description, target } = req.body;

  try {
    const newAnnouncement = new Announcement({
      title,
      description,
      target,
    });

    await newAnnouncement.save();
    res.status(201).json(newAnnouncement);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create announcement', error });
  }
};

// Get all announcements
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch announcements', error });
  }
};

// Delete an announcement
const deleteAnnouncement = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedAnnouncement = await Announcement.findByIdAndDelete(id);
    if (!deletedAnnouncement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.status(200).json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete announcement', error });
  }
};

module.exports = { createAnnouncement, getAnnouncements, deleteAnnouncement };
