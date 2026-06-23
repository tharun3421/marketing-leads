const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Lead = require('../models/Lead');

// Generate JWT token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'aetheria_secret_key_12345', {
    expiresIn: '30d'
  });
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      // Enforce selected role verification
      if (role && user.role !== role) {
        return res.status(401).json({ message: `Invalid credentials for the selected role (${role})` });
      }

      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        team: user.team,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new salesperson or technical user
// @route   POST /api/auth/register
// @access  Private/Admin
const registerUser = async (req, res) => {
  const { name, username, password, role, team } = req.body;

  try {
    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const assignedRole = (role === 'technical' || role === 'salesperson') ? role : 'salesperson';

    const user = await User.create({
      name,
      username,
      password, // will be auto-hashed by User pre-save middleware
      role: assignedRole,
      team: assignedRole === 'technical' ? team : null
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        team: user.team
      });
    } else {
      res.status(400).json({ message: 'Invalid user data provided' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      username: req.user.username,
      role: req.user.role,
      team: req.user.team
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all salesperson users
// @route   GET /api/auth/salespersons
// @access  Private
const getSalespersons = async (req, res) => {
  try {
    const salespersons = await User.find({ role: 'salesperson' }).select('name username createdAt');
    res.json(salespersons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all technical users
// @route   GET /api/auth/technical
// @access  Private
const getTechnicalMembers = async (req, res) => {
  try {
    const technical = await User.find({ role: 'technical' }).select('name username team createdAt');
    res.json(technical);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a salesperson or technical user and handle cascade
// @route   DELETE /api/auth/salespersons/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'salesperson') {
      // Cascade delete: Remove all leads associated with this salesperson
      await Lead.deleteMany({ salesperson: req.params.id });
    } else if (user.role === 'technical') {
      // Cascade unassign: Clear assignedTo fields on all leads assigned to this technical member
      await Lead.updateMany({ assignedTo: req.params.id }, { assignedTo: null, assignedToName: null });
    } else {
      return res.status(400).json({ message: 'Only salesperson and technical accounts can be deleted' });
    }

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Account and associated leads/assignments updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset a salesperson's password (Admin only)
// @route   PUT /api/auth/salespersons/:id/reset-password
// @access  Private/Admin
const resetUserPassword = async (req, res) => {
  const { password } = req.body;

  if (!password || password.trim().length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'salesperson' && user.role !== 'technical') {
      return res.status(400).json({ message: 'Only salesperson and technical passwords can be reset' });
    }

    user.password = password;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update salesperson or technical member details (Admin only)
// @route   PUT /api/auth/salespersons/:id
// @access  Private/Admin
const updateEmployee = async (req, res) => {
  const { name, username, role, team } = req.body;

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'salesperson' && user.role !== 'technical') {
      return res.status(400).json({ message: 'Only salesperson and technical accounts can be updated' });
    }

    // Check username uniqueness if changing username
    if (username && username.toLowerCase() !== user.username.toLowerCase()) {
      const usernameExists = await User.findOne({ username: username.toLowerCase() });
      if (usernameExists) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      user.username = username.toLowerCase();
    }

    const oldName = user.name;
    if (name) user.name = name;
    
    // Manage roles and teams
    if (role) {
      user.role = (role === 'technical' || role === 'salesperson') ? role : user.role;
    }
    
    if (user.role === 'technical') {
      if (team !== undefined) {
        user.team = ['design', 'developer', 'ads'].includes(team) ? team : null;
      }
    } else {
      user.team = null;
    }

    await user.save();

    // Cascade name changes to Lead records
    if (name && name !== oldName) {
      if (user.role === 'salesperson') {
        await Lead.updateMany({ salesperson: user._id }, { salespersonName: name });
      } else if (user.role === 'technical') {
        await Lead.updateMany({ assignedTo: user._id }, { assignedToName: name });
        await Lead.updateMany({ assignedDeveloper: user._id }, { assignedDeveloperName: name });
        await Lead.updateMany({ assignedDesigner: user._id }, { assignedDesignerName: name });
        await Lead.updateMany({ assignedAdSpecialist: user._id }, { assignedAdSpecialistName: name });
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      team: user.team
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  loginUser,
  registerUser,
  getUserProfile,
  getSalespersons,
  getTechnicalMembers,
  deleteUser,
  resetUserPassword,
  updateEmployee
};

