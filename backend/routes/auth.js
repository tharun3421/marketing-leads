const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Lead = require('../models/Lead');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Generate JWT token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'aetheria_secret_key_12345', {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new salesperson user
// @access  Private/Admin
router.post('/register', protect, adminOnly, async (req, res) => {
  const { name, username, password } = req.body;

  try {
    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const user = await User.create({
      name,
      username,
      password, // will be auto-hashed by User pre-save middleware
      role: 'salesperson'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role
      });
    } else {
      res.status(400).json({ message: 'Invalid user data provided' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/salespersons
// @desc    Get all salesperson users
// @access  Private
router.get('/salespersons', protect, async (req, res) => {
  try {
    const salespersons = await User.find({ role: 'salesperson' }).select('name username createdAt');
    res.json(salespersons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/auth/salespersons/:id
// @desc    Delete a salesperson and their leads
// @access  Private/Admin
router.delete('/salespersons/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Salesperson not found' });
    }

    if (user.role !== 'salesperson') {
      return res.status(400).json({ message: 'Only salesperson accounts can be deleted' });
    }

    // Cascade delete: Remove all leads associated with this salesperson
    await Lead.deleteMany({ salesperson: req.params.id });

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Salesperson and all associated leads deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
