const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/daily-reports', require('./routes/dailyReports'));
app.use('/api/config', require('./routes/config'));
app.use('/api/notifications', require('./routes/notifications'));

// Simple health check route
app.get('/', (req, res) => {
  res.send('Aetheria CRM API is running...');
});

// Auto-seed Admin and default Salespersons if DB is empty
const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Initializing default roster...');

      // Seed Admin
      await User.create({
        name: 'CRM Administrator',
        username: 'admin@livedigit.in',
        password: 'Livedigit.admin@2026', // Will be auto-hashed by pre-save hook
        role: 'admin'
      });
      console.log('Seeded Administrator account: admin@livedigit.in');

      // Seed default Salespeople
      const defaultSalespeople = [
        { name: 'Tharun', username: 'tharun' },
        { name: 'Sarah', username: 'sarah' },
        { name: 'John', username: 'john' },
        { name: 'Emily', username: 'emily' }
      ];

      for (const rep of defaultSalespeople) {
        await User.create({
          name: rep.name,
          username: rep.username,
          password: 'sales123', // Will be auto-hashed by pre-save hook
          role: 'salesperson'
        });
      }
      console.log('Seeded default Salesperson accounts (tharun, sarah, john, emily) with password sales123');
    }
  } catch (error) {
    console.error('Seeding error:', error.message);
  }
};

// Execute seeding
seedDatabase();

// Error handler middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});