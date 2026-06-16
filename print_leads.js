const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const Lead = require('./backend/models/Lead');

async function printLeads() {
  const uri = process.env.MONGO_URI;
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const leads = await Lead.find({});
    console.log(`Total Leads: ${leads.length}`);
    leads.forEach((l, idx) => {
      console.log(`[${idx}] Name: ${l.clientName}, status: "${l.status}", workflowStatus: "${l.workflowStatus}", assignedTeam: "${l.assignedTeam}", assignedTo: "${l.assignedTo}"`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

printLeads();
