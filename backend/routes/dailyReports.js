const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getDailyReports,
  createDailyReport,
  updateDailyReport,
  deleteDailyReport
} = require('../controllers/dailyReportController');

// @route   GET /api/daily-reports
// @desc    Get daily reports (Technical: own only. Admin: all, filterable by team/member/date/client)
// @access  Private
router.get('/', protect, getDailyReports);

// @route   POST /api/daily-reports
// @desc    Create a new daily report
// @access  Private/Technical
router.post('/', protect, createDailyReport);

// @route   PUT /api/daily-reports/:id
// @desc    Update a daily report
// @access  Private
router.put('/:id', protect, updateDailyReport);

// @route   DELETE /api/daily-reports/:id
// @desc    Delete a daily report
// @access  Private
router.delete('/:id', protect, deleteDailyReport);

module.exports = router;