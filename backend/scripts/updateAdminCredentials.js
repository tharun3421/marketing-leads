// One-time script to update the existing Admin account's username and password.
// Run this ONCE from the backend folder:
//   node scripts/updateAdminCredentials.js
//
// It connects to the same DB as your app (via MONGO_URI in .env),
// finds the current admin account, and updates it using the User model
// so the password gets hashed correctly (matches your login logic).

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

// ---- New credentials ----
const NEW_USERNAME = 'admin@livedigit.in';
const NEW_PASSWORD = 'Livedigit.admin@2026';
// --------------------------

const OLD_USERNAME = 'admin'; // change this if your current admin username is different

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aetheria-crm');
    console.log('Connected to MongoDB.');

    const admin = await User.findOne({ role: 'admin', username: OLD_USERNAME.toLowerCase() });

    if (!admin) {
      console.log(`No admin account found with username "${OLD_USERNAME}".`);
      console.log('Existing admin accounts in DB:');
      const allAdmins = await User.find({ role: 'admin' }).select('username name');
      allAdmins.forEach(a => console.log(` - ${a.username} (${a.name})`));
      process.exit(1);
    }

    admin.username = NEW_USERNAME.toLowerCase();
    admin.password = NEW_PASSWORD; // pre-save hook in User model will hash this automatically
    await admin.save();

    console.log('Admin credentials updated successfully!');
    console.log(`New username: ${NEW_USERNAME}`);
    console.log('New password: (hidden, but matches what you set in the script)');

    process.exit(0);
  } catch (error) {
    console.error('Error updating admin credentials:', error.message);
    process.exit(1);
  }
};

run();