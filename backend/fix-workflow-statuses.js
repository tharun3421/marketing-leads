const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Lead = require('./models/Lead');
const connectDB = require('./config/db');

dotenv.config();

const fixStatuses = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB. Scanning leads...');

    const leads = await Lead.find({});
    console.log(`Found ${leads.length} leads in database.`);

    for (const lead of leads) {
      const oldStatus = lead.workflowStatus;
      let calculatedWorkflowStatus = 'Non-Allocated';

      if (lead.assignedTo) {
        const activeStatuses = [];
        if (Number(lead.postersRequired) > 0) activeStatuses.push(lead.postersStatus || 'Pending');
        if (Number(lead.videosRequired) > 0) activeStatuses.push(lead.videosStatus || 'Pending');
        if (Number(lead.adsRequired) > 0) activeStatuses.push(lead.adsStatus || 'Pending');
        if (lead.websiteRequired) activeStatuses.push(lead.websiteStatus || 'Pending');

        if (activeStatuses.length === 0 || activeStatuses.every(s => s === 'Completed')) {
          calculatedWorkflowStatus = 'Completed';
        } else if (activeStatuses.every(s => s === 'Pending')) {
          calculatedWorkflowStatus = 'Allocated';
        } else {
          calculatedWorkflowStatus = 'In Progress';
        }
      }

      if (oldStatus !== calculatedWorkflowStatus) {
        lead.workflowStatus = calculatedWorkflowStatus;
        await lead.save();
        console.log(`Updated lead "${lead.clientName}" status: "${oldStatus}" -> "${calculatedWorkflowStatus}"`);
      } else {
        console.log(`Lead "${lead.clientName}" status is already correct: "${oldStatus}"`);
      }
    }

    console.log('Finished updating lead workflow statuses.');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing workflow statuses:', error);
    process.exit(1);
  }
};

fixStatuses();
