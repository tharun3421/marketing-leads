const Notification = require('../models/Notification');

// @route   GET /api/notifications
// @desc    Get recent notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/notifications
// @desc    Create a notification
// @access  Private
const createNotification = async (req, res) => {
  try {
    const { message, type } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const newNotification = new Notification({
      message,
      type
    });

    await newNotification.save();

    // Auto-prune to keep only the last 100 notifications
    const count = await Notification.countDocuments();
    if (count > 100) {
      const oldest = await Notification.find()
        .sort({ timestamp: 1 })
        .limit(count - 100);
      const oldestIds = oldest.map(n => n._id);
      await Notification.deleteMany({ _id: { $in: oldestIds } });
    }

    res.status(201).json(newNotification);
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getNotifications,
  createNotification
};
