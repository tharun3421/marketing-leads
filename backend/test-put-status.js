const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Lead = require('./models/Lead');
const User = require('./models/User');

async function testPutStatus() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/aetheria-crm';
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    // Find or create a mock salesperson
    let salesperson = await User.findOne({ role: 'salesperson' });
    if (!salesperson) {
      salesperson = await User.create({
        name: 'Test Salesperson',
        username: 'testsales',
        password: 'password123',
        role: 'salesperson'
      });
    }

    // Create a lead with Submitted to Admin status
    const lead = await Lead.create({
      salesperson: salesperson._id,
      salespersonName: salesperson.name,
      clientName: 'Test Sync Client',
      mobileNumber: '1234567890',
      email: 'sync@example.com',
      postersRequired: 5,
      postersStatus: 'Pending',
      status: 'Submitted to Admin'
    });

    console.log('Created Lead Status:', lead.status);

    // Simulate PUT request payload (updating postersStatus)
    const updatePayload = {
      ...lead.toObject(),
      postersStatus: 'Completed',
      postersPending: 0
    };

    // Make database update simulating PUT route
    const dbLead = await Lead.findById(lead._id);
    const updatedData = {
      ...updatePayload
    };
    
    // Explicitly retain current status (like in route)
    updatedData.status = dbLead.status;
    delete updatedData.salesperson;
    delete updatedData.salespersonName;

    const finalLead = await Lead.findByIdAndUpdate(lead._id, updatedData, { new: true });
    console.log('After update, Lead Status is:', finalLead.status);
    console.log('After update, Posters Status is:', finalLead.postersStatus);

    // Clean up
    await Lead.findByIdAndDelete(lead._id);
    console.log('Cleaned up lead');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testPutStatus();
