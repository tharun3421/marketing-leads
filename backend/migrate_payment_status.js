const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const Lead = require('./models/Lead');

const migrate = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/aetheria-crm';
  console.log(`Connecting to MongoDB at: ${uri}`);
  
  try {
    await mongoose.connect(uri);
    console.log('Database connected successfully.');

    const leads = await Lead.find({});
    console.log(`Found ${leads.length} leads in total. Processing migration...`);

    let updatedCount = 0;
    for (const lead of leads) {
      const plan = Number(lead.planAmount || 0);
      const advance = Number(lead.advanceAmount || 0);
      let calculatedStatus = 'Unpaid';
      if (plan > 0 && advance >= plan) {
        calculatedStatus = 'Paid';
      } else if (advance > 0 && advance < plan) {
        calculatedStatus = 'Partial';
      }

      // Update lead
      lead.paymentStatus = calculatedStatus;
      await lead.save();
      updatedCount++;
    }

    console.log(`Successfully migrated ${updatedCount} leads.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

migrate();
