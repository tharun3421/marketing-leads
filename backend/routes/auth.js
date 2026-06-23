const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  loginUser,
  registerUser,
  getUserProfile,
  getSalespersons,
  getTechnicalMembers,
  deleteUser,
  resetUserPassword,
  updateEmployee
} = require('../controllers/authController');

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginUser);

// @route   POST /api/auth/register
// @desc    Register a new salesperson or technical user
// @access  Private/Admin
router.post('/register', protect, adminOnly, registerUser);

// @route   GET /api/auth/me
// @desc    Get current logged in user profile
// @access  Private
router.get('/me', protect, getUserProfile);

// @route   GET /api/auth/salespersons
// @desc    Get all salesperson users
// @access  Private
router.get('/salespersons', protect, getSalespersons);

// @route   GET /api/auth/technical
// @desc    Get all technical users
// @access  Private
router.get('/technical', protect, getTechnicalMembers);

// @route   DELETE /api/auth/salespersons/:id
// @desc    Delete a salesperson or technical user and handle cascade
// @access  Private/Admin
router.delete('/salespersons/:id', protect, adminOnly, deleteUser);

// @route   PUT /api/auth/salespersons/:id
// @desc    Update salesperson or technical user details (Admin only)
// @access  Private/Admin
router.put('/salespersons/:id', protect, adminOnly, updateEmployee);

// @route   PUT /api/auth/salespersons/:id/reset-password
// @desc    Reset a salesperson's password (Admin only)
// @access  Private/Admin
router.put('/salespersons/:id/reset-password', protect, adminOnly, resetUserPassword);

module.exports = router;
