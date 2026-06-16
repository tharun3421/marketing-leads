const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getLeads,
  assignLeads,
  createLead,
  updateLead,
  deleteLead,
  syncLead
} = require('../controllers/leadController');

// @route   GET /api/leads
// @desc    Get all leads (Admin) or user-owned leads (Salesperson) or team leads (Technical)
// @access  Private
router.get('/', protect, getLeads);

// @route   PUT /api/leads/assign
// @desc    Assign leads to a technical user (Admin only)
// @access  Private/Admin
router.put('/assign', protect, assignLeads);

// @route   POST /api/leads
// @desc    Create a new lead draft
// @access  Private
router.post('/', protect, createLead);

// @route   PUT /api/leads/:id
// @desc    Update a lead
// @access  Private
router.put('/:id', protect, updateLead);

// @route   DELETE /api/leads/:id
// @desc    Delete a lead
// @access  Private
router.delete('/:id', protect, deleteLead);

// @route   POST /api/leads/:id/sync
// @desc    Sync lead details to Google Sheets Web App URL
// @access  Private
router.post('/:id/sync', protect, syncLead);

module.exports = router;
