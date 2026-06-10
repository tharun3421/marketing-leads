const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Config = require('../models/Config');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/leads
// @desc    Get all leads (Admin) or user-owned leads (Salesperson)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let leads;
    if (req.user.role === 'admin') {
      leads = await Lead.find({}).sort({ createdAt: -1 });
    } else if (req.user.role === 'technical') {
      leads = await Lead.find({ assignedTo: req.user.id }).sort({ createdAt: -1 });
    } else {
      leads = await Lead.find({ salesperson: req.user.id }).sort({ createdAt: -1 });
    }
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/leads/assign
// @desc    Assign leads to a technical user (Admin only)
// @access  Private/Admin
router.put('/assign', protect, async (req, res) => {
  // Enforce admin check manually since adminOnly might be in other middleware file or we can import it
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin role required' });
  }
  const { leadIds, assignedTo } = req.body;

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return res.status(400).json({ message: 'Invalid lead IDs provided' });
  }

  try {
    let techName = null;
    if (assignedTo) {
      const User = require('../models/User');
      const techUser = await User.findById(assignedTo);
      if (!techUser || techUser.role !== 'technical') {
        return res.status(400).json({ message: 'Selected user must be a technical team member' });
      }
      techName = techUser.name;
    }

    await Lead.updateMany(
      { _id: { $in: leadIds } },
      { assignedTo, assignedToName: techName }
    );

    res.json({ message: 'Leads assigned successfully', assignedToName: techName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/leads
// @desc    Create a new lead draft
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const leadData = {
      ...req.body,
      salesperson: req.user.id,
      salespersonName: req.user.name,
      status: 'Draft'
    };

    const lead = await Lead.create(leadData);
    res.status(201).json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/leads/:id
// @desc    Update a lead (resets status to Draft)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead record not found' });
    }

    // Verify ownership or assignment (only salesperson creator, admin, or assigned technical user can edit)
    const isCreator = lead.salesperson && lead.salesperson.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';
    const isAssignee = req.user.role === 'technical' && lead.assignedTo && lead.assignedTo.toString() === req.user.id.toString();

    if (!isAdmin && !isCreator && !isAssignee) {
      return res.status(403).json({ message: 'Access denied: Cannot edit leads assigned to others' });
    }

    // Update fields and preserve existing status
    const updatedData = {
      ...req.body
    };

    // Explicitly retain current status
    updatedData.status = lead.status;

    // Prevent overwriting owner
    delete updatedData.salesperson;
    delete updatedData.salespersonName;

    const updatedLead = await Lead.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.json(updatedLead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/leads/:id
// @desc    Delete a lead
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead record not found' });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && lead.salesperson.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied: Cannot delete leads assigned to others' });
    }

    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead record removed successfully' });
  } catch (error) {
    res.status(550).json({ message: error.message });
  }
});

// @route   POST /api/leads/:id/sync
// @desc    Sync lead details to Google Sheets Web App URL
// @access  Private
router.post('/:id/sync', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead record not found' });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && lead.salesperson.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get Apps Script URL from Config
    const sheetsUrlConfig = await Config.findOne({ key: 'apps_script_url' });
    const appsScriptUrl = sheetsUrlConfig ? sheetsUrlConfig.value : '';

    if (!appsScriptUrl) {
      return res.status(400).json({ message: 'Google Sheets URL is not configured by Administrator' });
    }

    // Calculate totals, pending, completed posts/assets
    const totalReq = Number(lead.postersRequired || 0) + Number(lead.videosRequired || 0) + Number(lead.adsRequired || 0) + (lead.websiteRequired ? 1 : 0);
    const pendingReq = Number(lead.postersPending ?? (lead.postersStatus === 'Completed' ? 0 : lead.postersRequired || 0)) + 
                       Number(lead.videosPending ?? (lead.videosStatus === 'Completed' ? 0 : lead.videosRequired || 0)) + 
                       Number(lead.adsPending ?? (lead.adsStatus === 'Completed' ? 0 : lead.adsRequired || 0)) + 
                       (lead.websiteRequired ? (lead.websiteStatus === 'Completed' ? 0 : 1) : 0);
    const completedReq = totalReq - pendingReq;

    // Formatting summaries
    const postersPending = Number(lead.postersPending ?? (lead.postersStatus === 'Completed' ? 0 : lead.postersRequired || 0));
    const postersReq = Number(lead.postersRequired || 0);
    const postersCompleted = postersReq - postersPending;
    const postersSummary = `Total: ${postersReq} | Pending: ${postersPending} | Completed: ${postersCompleted}`;

    const videosPending = Number(lead.videosPending ?? (lead.videosStatus === 'Completed' ? 0 : lead.videosRequired || 0));
    const videosReq = Number(lead.videosRequired || 0);
    const videosCompleted = videosReq - videosPending;
    const videosSummary = `Total: ${videosReq} | Pending: ${videosPending} | Completed: ${videosCompleted}`;

    const adsPending = Number(lead.adsPending ?? (lead.adsStatus === 'Completed' ? 0 : lead.adsRequired || 0));
    const adsReq = Number(lead.adsRequired || 0);
    const adsCompleted = adsReq - adsPending;
    const adsSummary = `Total: ${adsReq} | Pending: ${adsPending} | Completed: ${adsCompleted}`;

    const payload = {
      timestamp: lead.createdAt || new Date().toISOString(),
      salespersonName: lead.salespersonName,
      clientName: lead.clientName,
      mobileNumber: lead.mobileNumber,
      email: lead.email,
      companyName: lead.companyName || '',
      businessCategory: lead.businessCategory || '',
      websiteUrl: lead.websiteUrl || '',
      websiteRequired: lead.websiteRequired,
      websiteType: lead.websiteType || '',
      facebookId: lead.facebookId || '',
      facebookPassword: lead.facebookPassword || '',
      instagramId: lead.instagramId || '',
      instagramPassword: lead.instagramPassword || '',
      postersSummary,
      videosSummary,
      adsSummary,
      websiteStatus: lead.websiteStatus || 'Pending',
      platforms: lead.platforms,
      brandColors: lead.brandColors,
      targetAudience: lead.targetAudience || '',
      competitors: lead.competitors || '',
      planAmount: lead.planAmount || 0,
      advanceAmount: lead.advanceAmount || 0,
      pendingAmount: lead.pendingAmount || 0,
      adBudget: lead.adBudget || 0,
      startDate: lead.startDate || '',
      deliveryDeadline: lead.deliveryDeadline || '',
      totalPostsCount: totalReq,
      pendingPostsCount: pendingReq,
      completedPostsCount: completedReq,
      notes: lead.notes || ''
    };

    // Trigger sync POST request to Apps Script Web App
    try {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`Google Sheets responded with status ${response.status}: ${response.statusText}`);
      }

      // If the body contains HTML indicating a Google sign-in/access prompt
      if (
        responseText.includes('Sign in - Google Accounts') || 
        responseText.includes('You need access') || 
        responseText.includes('request-access-icon') || 
        responseText.includes('docs-drivelogo-text')
      ) {
        throw new Error('Access Denied: Please check that the Google Apps Script Web App deployment has "Who has access" set to "Anyone"');
      }

      // Check if Apps Script returned an error JSON
      try {
        const jsonRes = JSON.parse(responseText);
        if (jsonRes.status === 'error') {
          throw new Error(`Apps Script execution error: ${jsonRes.message}`);
        }
      } catch (jsonErr) {
        // Response was not JSON, which is fine as long as it wasn't a Google login page
      }
    } catch (fetchError) {
      console.error('Fetch Google Sheets error:', fetchError);
      return res.status(500).json({ 
        message: `Google Sheets Sync failed: ${fetchError.message}` 
      });
    }

    // Set lead status to Synced
    lead.status = 'Submitted to Admin';
    await lead.save();

    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
