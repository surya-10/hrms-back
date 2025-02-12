const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Announcement = require('../../model/Auth/announcements.model');

// ✅ Create a new announcement
// router.post(
//   '/',
//   [
//     body('title').notEmpty().withMessage('Title is required'),
//     body('description').notEmpty().withMessage('Description is required'),
//     body('target').isIn(['All', 'Admin', 'Employee']).withMessage('Invalid target value'),
//     body('priority').isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority value'),
//   ],
//   async (req, res) => {
//     console.log('Received data:', req.body);

//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       console.error('Validation errors:', errors.array());
//       return res.status(400).json({ errors: errors.array() });
//     }

//     try {
//       const { title, description, target, priority } = req.body;
//       const newAnnouncement = new Announcement({ title, description, target, priority });
//       const savedAnnouncement = await newAnnouncement.save();
//       res.status(201).json(savedAnnouncement);
//     } catch (error) {
//       console.error('Error adding announcement:', error);
//       res.status(500).json({ message: 'Failed to add announcement' });
//     }
//   }
// );

// // ✅ Fetch all announcements
// router.get('/', async (req, res) => {
//   try {
//     const announcements = await Announcement.find().sort({ createdAt: -1 });
//     res.json(announcements);
//   } catch (error) {
//     console.error('Error fetching announcements:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });

// // ✅ Mark an announcement as read
// router.patch('/:id/read', async (req, res) => {
//   try {
//     const announcement = await Announcement.findByIdAndUpdate(
//       req.params.id,
//       { read: true },
//       { new: true }
//     );

//     if (!announcement) {
//       return res.status(404).json({ message: 'Announcement not found' });
//     }

//     res.json(announcement);
//   } catch (error) {
//     console.error('Error marking announcement as read:', error);
//     res.status(400).json({ message: 'Failed to update announcement' });
//   }
// });

// // ✅ Delete an announcement
// router.delete('/:id', async (req, res) => {
//   try {
//     const announcement = await Announcement.findByIdAndDelete(req.params.id);

//     if (!announcement) {
//       return res.status(404).json({ message: 'Announcement not found' });
//     }

//     res.json({ message: 'Announcement deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting announcement:', error);
//     res.status(500).json({ message: 'Failed to delete announcement' });
//   }
// });

// module.exports = router;


// ✅ Create a new announcement
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('target').isIn(['All', 'Admin', 'Employee']).withMessage('Invalid target value'),
    body('priority').isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority value'),
  ],
  async (req, res) => {
    console.log('Received data:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, target, priority } = req.body;
      const newAnnouncement = new Announcement({ title, description, target, priority });
      const savedAnnouncement = await newAnnouncement.save();
      res.status(201).json(savedAnnouncement);
    } catch (error) {
      console.error('Error adding announcement:', error);
      res.status(500).json({ message: 'Failed to add announcement' });
    }
  }
);

// ✅ Fetch all announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ✅ Mark an announcement as read
router.patch('/:id/read', async (req, res) => {
  const employeeId = req.body.employeeId; // Get the employee ID from the request body

  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if the employee has already marked it as read
    if (!announcement.readBy.includes(employeeId)) {
      announcement.readBy.push(employeeId); // Add the employee ID to the readBy array
      await announcement.save(); // Save the updated announcement
    }

    res.json(announcement);
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    res.status(400).json({ message: 'Failed to update announcement' });
  }
});

// ✅ Delete an announcement
router.delete('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
});

module.exports = router;