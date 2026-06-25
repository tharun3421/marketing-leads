const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getNotifications, createNotification } = require('../controllers/notificationController');

// @route   GET /api/notifications
// @desc    Get all recent notifications
// @access  Private
router.get('/', protect, getNotifications);

// @route   POST /api/notifications
// @desc    Add a notification
// @access  Private
router.post('/', protect, createNotification);

module.exports = router;
