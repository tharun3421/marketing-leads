const Lead = require('../models/Lead');
const Config = require('../models/Config');
const User = require('../models/User');

// Helper to sanitize numeric fields from empty strings
const sanitizeNumberFields = (body) => {
  const numberFields = [
    'postersRequired', 'postersPending',
    'videosRequired', 'videosPending',
    'adsRequired', 'adsPending',
    'websitePending', 'planAmount',
    'advanceAmount', 'pendingAmount',
    'adBudget'
  ];
  numberFields.forEach(field => {
    if (body[field] === '') {
      body[field] = 0;
    } else if (body[field] !== undefined && body[field] !== null) {
      const num = Number(body[field]);
      body[field] = isNaN(num) ? 0 : num;
    }
  });

  // Sanitize empty strings for ObjectId and Enum fields to prevent cast/validation failures
  if (body.assignedTo === '') {
    body.assignedTo = null;
  }
  if (body.assignedTeam === '') {
    body.assignedTeam = null;
  }
};

// @desc    Get all leads (Admin) or user-owned leads (Salesperson) or team leads (Technical)
// @route   GET /api/leads
// @access  Private
const getLeads = async (req, res) => {
  try {
    let leads;
    if (req.user.role === 'admin') {
      leads = await Lead.find({}).sort({ createdAt: -1 });
    } else if (req.user.role === 'salesperson') {
      leads = await Lead.find({ salesperson: req.user.id }).sort({ createdAt: -1 });
    } else if (req.user.role === 'technical') {
      const query = {
        assignedTeam: { $in: [req.user.team, 'all'] }
      };

      if (req.user.team === 'developer') {
        query.websiteRequired = true;
      } else if (req.user.team === 'design') {
        query.$or = [
          { postersRequired: { $gt: 0 } },
          { videosRequired: { $gt: 0 } }
        ];
      } else if (req.user.team === 'ads') {
        query.adsRequired = { $gt: 0 };
      }

      leads = await Lead.find(query).sort({ createdAt: -1 });
    } else {
      leads = await Lead.find({ salesperson: req.user.id }).sort({ createdAt: -1 });
    }
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign leads to a technical user (Admin only)
// @route   PUT /api/leads/assign
// @access  Private/Admin
const assignLeads = async (req, res) => {
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
      const techUser = await User.findById(assignedTo);
      if (!techUser || techUser.role !== 'technical') {
        return res.status(400).json({ message: 'Selected user must be a technical team member' });
      }
      techName = techUser.name;
    }

    const leadsToAssign = await Lead.find({ _id: { $in: leadIds } });
    for (const lead of leadsToAssign) {
      lead.assignedTo = assignedTo || null;
      lead.assignedToName = techName;

      // Recalculate workflowStatus
      if (!lead.assignedTeam) {
        lead.workflowStatus = 'Non-Allocated';
      } else {
        const activeStatuses = [];
        if (Number(lead.postersRequired) > 0) activeStatuses.push(lead.postersStatus || 'Pending');
        if (Number(lead.videosRequired) > 0) activeStatuses.push(lead.videosStatus || 'Pending');
        if (Number(lead.adsRequired) > 0) activeStatuses.push(lead.adsStatus || 'Pending');
        if (lead.websiteRequired) activeStatuses.push(lead.websiteStatus || 'Pending');

        if (activeStatuses.length === 0 || activeStatuses.every(s => s === 'Completed')) {
          lead.workflowStatus = 'Completed';
        } else if (activeStatuses.every(s => s === 'Pending')) {
          lead.workflowStatus = 'Allocated';
        } else {
          lead.workflowStatus = 'In Progress';
        }
      }
      await lead.save();
    }

    res.json({ message: 'Leads assigned successfully', assignedToName: techName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new lead draft
// @route   POST /api/leads
// @access  Private
const createLead = async (req, res) => {
  try {
    // Sanitize numeric fields
    sanitizeNumberFields(req.body);

    const leadData = {
      ...req.body,
      salesperson: req.user.id,
      salespersonName: req.user.name,
      status: 'Draft'
    };

    // Calculate workflow status dynamically on creation
    if (leadData.workflowStatus === undefined) {
      const assignedTeam = leadData.assignedTeam;
      let calculatedWorkflowStatus = 'Non-Allocated';
      if (assignedTeam) {
        const postersRequired = leadData.postersRequired;
        const postersStatus = leadData.postersStatus || 'Pending';
        const videosRequired = leadData.videosRequired;
        const videosStatus = leadData.videosStatus || 'Pending';
        const adsRequired = leadData.adsRequired;
        const adsStatus = leadData.adsStatus || 'Pending';
        const websiteRequired = leadData.websiteRequired;
        const websiteStatus = leadData.websiteStatus || 'Pending';

        const activeStatuses = [];
        if (Number(postersRequired) > 0) activeStatuses.push(postersStatus);
        if (Number(videosRequired) > 0) activeStatuses.push(videosStatus);
        if (Number(adsRequired) > 0) activeStatuses.push(adsStatus);
        if (websiteRequired) activeStatuses.push(websiteStatus);

        if (activeStatuses.length === 0 || activeStatuses.every(s => s === 'Completed')) {
          calculatedWorkflowStatus = 'Completed';
        } else if (activeStatuses.every(s => s === 'Pending')) {
          calculatedWorkflowStatus = 'Allocated';
        } else {
          calculatedWorkflowStatus = 'In Progress';
        }
      }
      leadData.workflowStatus = calculatedWorkflowStatus;
    }

    const lead = await Lead.create(leadData);
    res.status(201).json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a lead
// @route   PUT /api/leads/:id
// @access  Private
const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead record not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isSalesperson = req.user.role === 'salesperson';
    const isCreator = lead.salesperson && lead.salesperson.toString() === req.user.id.toString();
    const isAssignee = lead.assignedTo && lead.assignedTo.toString() === req.user.id.toString();
    const isTeamMember = req.user.role === 'technical' && 
      (lead.assignedTeam === req.user.team || lead.assignedTeam === 'all');

    if (!isAdmin && !isCreator && !isSalesperson && !isAssignee && !isTeamMember) {
      return res.status(403).json({ message: 'Access denied: Cannot edit leads assigned to others' });
    }

    // Sanitize numeric fields
    sanitizeNumberFields(req.body);

    // Update fields and preserve existing status
    const updatedData = {
      ...req.body
    };

    // Explicitly retain current status
    updatedData.status = lead.status;

    // Prevent overwriting owner
    delete updatedData.salesperson;
    delete updatedData.salespersonName;

    // Calculate workflow status dynamically based on assignments and deliverables if not manually overridden
    if (updatedData.workflowStatus === undefined) {
      const assignedTeam = updatedData.assignedTeam !== undefined ? updatedData.assignedTeam : lead.assignedTeam;
      let calculatedWorkflowStatus = 'Non-Allocated';
      if (assignedTeam) {
        const postersRequired = updatedData.postersRequired !== undefined ? updatedData.postersRequired : lead.postersRequired;
        const postersStatus = updatedData.postersStatus !== undefined ? updatedData.postersStatus : lead.postersStatus;
        const videosRequired = updatedData.videosRequired !== undefined ? updatedData.videosRequired : lead.videosRequired;
        const videosStatus = updatedData.videosStatus !== undefined ? updatedData.videosStatus : lead.videosStatus;
        const adsRequired = updatedData.adsRequired !== undefined ? updatedData.adsRequired : lead.adsRequired;
        const adsStatus = updatedData.adsStatus !== undefined ? updatedData.adsStatus : lead.adsStatus;
        const websiteRequired = updatedData.websiteRequired !== undefined ? updatedData.websiteRequired : lead.websiteRequired;
        const websiteStatus = updatedData.websiteStatus !== undefined ? updatedData.websiteStatus : lead.websiteStatus;

        const activeStatuses = [];
        if (Number(postersRequired) > 0) activeStatuses.push(postersStatus || 'Pending');
        if (Number(videosRequired) > 0) activeStatuses.push(videosStatus || 'Pending');
        if (Number(adsRequired) > 0) activeStatuses.push(adsStatus || 'Pending');
        if (websiteRequired) activeStatuses.push(websiteStatus || 'Pending');

        if (activeStatuses.length === 0 || activeStatuses.every(s => s === 'Completed')) {
          calculatedWorkflowStatus = 'Completed';
        } else if (activeStatuses.every(s => s === 'Pending')) {
          calculatedWorkflowStatus = 'Allocated';
        } else {
          calculatedWorkflowStatus = 'In Progress';
        }
      }
      updatedData.workflowStatus = calculatedWorkflowStatus;
    }

    const updatedLead = await Lead.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.json(updatedLead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a lead
// @route   DELETE /api/leads/:id
// @access  Private
const deleteLead = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sync lead details to Google Sheets Web App URL
// @route   POST /api/leads/:id/sync
// @access  Private
const syncLead = async (req, res) => {
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
    if (!lead.workflowStatus) {
      lead.workflowStatus = 'Non-Allocated';
    }
    await lead.save();

    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLeads,
  assignLeads,
  createLead,
  updateLead,
  deleteLead,
  syncLead
};
