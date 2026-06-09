const express = require('express');
const router = express.Router();
const Config = require('../models/Config');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// @route   GET /api/config/sheets-url
// @desc    Get Google Sheets Apps Script Integration URL
// @access  Private
router.get('/sheets-url', protect, async (req, res) => {
  try {
    const config = await Config.findOne({ key: 'apps_script_url' });
    res.json({ url: config ? config.value : '' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/config/sheets-url
// @desc    Update Google Sheets Apps Script Integration URL
// @access  Private/Admin
router.post('/sheets-url', protect, adminOnly, async (req, res) => {
  const { url } = req.body;

  try {
    let config = await Config.findOne({ key: 'apps_script_url' });

    if (config) {
      config.value = url || '';
      await config.save();
    } else {
      config = await Config.create({
        key: 'apps_script_url',
        value: url || ''
      });
    }

    res.json({ url: config.value });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
