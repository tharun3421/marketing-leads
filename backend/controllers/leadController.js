const Lead = require('../models/Lead');
const Config = require('../models/Config');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper to create client-related notifications and auto-prune them to 100
const createLeadNotification = async (clientId, description) => {
  try {
    const message = `[${clientId}] ${description}`;
    const notif = new Notification({
      message,
      type: 'info',
      timestamp: new Date()
    });
    await notif.save();
    
    // Auto-prune to keep only the last 100 notifications
    const count = await Notification.countDocuments();
    if (count > 100) {
      const oldest = await Notification.find()
        .sort({ timestamp: 1 })
        .limit(count - 100);
      const oldestIds = oldest.map(n => n._id);
      await Notification.deleteMany({ _id: { $in: oldestIds } });
    }
  } catch (err) {
    console.error('Error generating backend lead notification:', err.message);
  }
};


// Helper to sanitize numeric fields from empty strings
const sanitizeNumberFields = (body) => {
  const numberFields = [
    'postersRequired', 'postersPending',
    'videosRequired', 'videosPending',
    'adsRequired', 'adsPending',
    'websitePending', 'planAmount',
    'advanceAmount', 'pendingAmount',
    'adBudget', 'adBudgetPerDay',
    'metaAdsPlanDuration', 'googleAdsPlanDuration',
    'linkedinAdsPlanDuration', 'seoPlanDuration'
  ];
  numberFields.forEach(field => {
    if (body[field] === '') {
      body[field] = 0;
    } else if (body[field] !== undefined && body[field] !== null) {
      const num = Number(body[field]);
      body[field] = isNaN(num) ? 0 : num;
    }
  });

  // Sanitize enum fields — empty string must become undefined so Mongoose uses the default
  const enumFields = [
    'facebookAccountStatus',
    'instagramAccountStatus',
    'targetAudienceRequired',
    'workflowStatus',
    'postersStatus',
    'videosStatus',
    'adsStatus',
    'websiteStatus',
    'adsTeamStatus',
    'designTeamStatus',
    'devTeamStatus',
    'paymentStatus',
    'metaAdsCampaignStatus',
    'googleAdsCampaignStatus',
    'linkedinAdsCampaignStatus',
    'seoCampaignStatus',
    'gmbCampaignStatus'
  ];
  enumFields.forEach(field => {
    if (body[field] === '') {
      delete body[field];
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

// Helper to redact client details for technical department specialists
// const redactLeadForTechnicalUser = (lead, team) => {
//   const leadObj = lead.toObject ? lead.toObject() : lead;

//   // Always redact financial details for technical users
//   delete leadObj.planAmount;
//   delete leadObj.advanceAmount;
//   delete leadObj.pendingAmount;

//   if (team === 'developer') {
//     // Developers only see website-related requirements and data
//     delete leadObj.postersRequired;
//     delete leadObj.postersPending;
//     delete leadObj.postersStatus;
//     delete leadObj.videosRequired;
//     delete leadObj.videosPending;
//     delete leadObj.videosStatus;
//     delete leadObj.brandColors;

//     delete leadObj.adsRequired;
//     delete leadObj.adsPending;
//     delete leadObj.adsStatus;
//     delete leadObj.adBudget;
//     delete leadObj.adBudgetPerDay;
//     delete leadObj.facebookId;
//     delete leadObj.facebookPassword;
//     delete leadObj.instagramId;
//     delete leadObj.instagramPassword;
//     delete leadObj.platforms;
//   } else if (team === 'design') {
//     // Designing Team only sees design-related requirements
//     delete leadObj.websiteRequired;
//     delete leadObj.websiteType;
//     delete leadObj.websiteStatus;
//     delete leadObj.websitePending;
//     delete leadObj.websiteUrl;

//     delete leadObj.adsRequired;
//     delete leadObj.adsPending;
//     delete leadObj.adsStatus;
//     delete leadObj.adBudget;
//     delete leadObj.adBudgetPerDay;
//     delete leadObj.facebookId;
//     delete leadObj.facebookPassword;
//     delete leadObj.instagramId;
//     delete leadObj.instagramPassword;
//     delete leadObj.platforms;
//   } else if (team === 'ads') {
//     // Ads Team only sees campaign-related requirements and advertising details
//     delete leadObj.websiteRequired;
//     delete leadObj.websiteType;
//     delete leadObj.websiteStatus;
//     delete leadObj.websitePending;
//     delete leadObj.websiteUrl;

//     delete leadObj.postersRequired;
//     delete leadObj.postersPending;
//     delete leadObj.postersStatus;
//     delete leadObj.videosRequired;
//     delete leadObj.videosPending;
//     delete leadObj.videosStatus;
//     delete leadObj.brandColors;

//     // Redact project dates and total budget for Ads Team
//   delete leadObj.adBudget;
//   }

//   return leadObj;
// };

const redactLeadForTechnicalUser = (lead, team) => {
  const leadObj = lead.toObject ? lead.toObject() : lead;

  // Always redact financial details for technical users
  delete leadObj.planAmount;
  delete leadObj.advanceAmount;
  delete leadObj.pendingAmount;

  if (team === 'developer') {
    delete leadObj.postersRequired;
    delete leadObj.postersPending;
    delete leadObj.postersStatus;
    delete leadObj.videosRequired;
    delete leadObj.videosPending;
    delete leadObj.videosStatus;
    delete leadObj.brandColors;
    delete leadObj.adsRequired;
    delete leadObj.adsPending;
    delete leadObj.adsStatus;
    delete leadObj.adBudget;
    delete leadObj.adBudgetPerDay;
    delete leadObj.facebookId;
    delete leadObj.facebookPassword;
    delete leadObj.instagramId;
    delete leadObj.instagramPassword;
    delete leadObj.platforms;
  } else if (team === 'design') {
    delete leadObj.websiteRequired;
    delete leadObj.websiteType;
    delete leadObj.websiteStatus;
    delete leadObj.websitePending;
    delete leadObj.websiteUrl;
    delete leadObj.adsRequired;
    delete leadObj.adsPending;
    delete leadObj.adsStatus;
    delete leadObj.adBudget;
    delete leadObj.adBudgetPerDay;
    delete leadObj.facebookId;
    delete leadObj.facebookPassword;
    delete leadObj.instagramId;
    delete leadObj.instagramPassword;
    delete leadObj.platforms;
  } else if (team === 'ads') {
    delete leadObj.websiteRequired;
    delete leadObj.websiteType;
    delete leadObj.websiteStatus;
    delete leadObj.websitePending;
    delete leadObj.websiteUrl;
    delete leadObj.postersRequired;
    delete leadObj.postersPending;
    delete leadObj.postersStatus;
    delete leadObj.videosRequired;
    delete leadObj.videosPending;
    delete leadObj.videosStatus;
    delete leadObj.brandColors;
    delete leadObj.adBudget;
    // platforms is intentionally kept so ads team can see GMB, SEO etc.
  }

  return leadObj;
};

const redactLeadForRole = (lead, user) => {
  const leadObj = lead.toObject ? lead.toObject() : lead;

  // Calculate payment status dynamically if not set in DB
  let paymentStatus = leadObj.paymentStatus;
  if (!paymentStatus) {
    const plan = Number(leadObj.planAmount || 0);
    const advance = Number(leadObj.advanceAmount || 0);
    paymentStatus = 'Unpaid';
    if (plan > 0 && advance >= plan) paymentStatus = 'Paid';
    else if (advance > 0 && advance < plan) paymentStatus = 'Partial';
  }
  leadObj.paymentStatus = paymentStatus;

  // 1. Hide payment details for non-admins (except salespersons)
  if (user.role !== 'admin' && user.role !== 'salesperson') {
    delete leadObj.planAmount;
    delete leadObj.advanceAmount;
    delete leadObj.pendingAmount;
  }

  // 2. Hide ad budget details for non-admin and non-ads-team users
  const isAdsTeam = user.role === 'technical' && user.team === 'ads';
  const isAdmin = user.role === 'admin';
  if (!isAdmin && !isAdsTeam) {
    delete leadObj.adBudget;
    delete leadObj.adBudgetPerDay;
  }

  // 3. Apply technical specific redactions
  if (user.role === 'technical') {
    // Dynamically assign local team's assignee info to assignedTo/assignedToName
    if (user.team === 'developer') {
      leadObj.assignedTo = leadObj.assignedDeveloper || null;
      leadObj.assignedToName = leadObj.assignedDeveloperName || null;
    } else if (user.team === 'design') {
      leadObj.assignedTo = leadObj.assignedDesigner || null;
      leadObj.assignedToName = leadObj.assignedDesignerName || null;
    } else if (user.team === 'ads') {
      leadObj.assignedTo = leadObj.assignedAdSpecialist || null;
      leadObj.assignedToName = leadObj.assignedAdSpecialistName || null;
    }
    return redactLeadForTechnicalUser(leadObj, user.team);
  } else {
    // Admin / Salesperson: set assignedTo to a default claimant if any, and set assignedToName to the display summary
    leadObj.assignedTo = leadObj.assignedDeveloper || leadObj.assignedDesigner || leadObj.assignedAdSpecialist || null;
    leadObj.assignedToName = getAssigneeDisplay(leadObj);
    return leadObj;
  }
};

// Helper to check if a specific team is assigned (handles both array and string values)
const hasTeamVal = (teamVal, team) => {
  if (!teamVal) return false;
  if (Array.isArray(teamVal)) return teamVal.includes(team) || teamVal.includes('all');
  return teamVal === team || teamVal === 'all';
};

const hasTeam = (lead, team) => {
  return hasTeamVal(lead.assignedTeam, team);
};

// Compare two team assignments to check for changes
const areTeamsEqual = (val1, val2) => {
  const norm1 = Array.isArray(val1) ? [...val1].sort().join(',') : (val1 || '');
  const norm2 = Array.isArray(val2) ? [...val2].sort().join(',') : (val2 || '');
  return norm1 === norm2;
};

// Helper to compute summary assignee string for admin/salesperson displays
const getAssigneeDisplay = (lead) => {
  const activeTeams = [];
  if (hasTeam(lead, 'developer')) {
    activeTeams.push(`Dev: ${lead.assignedDeveloperName || 'Unclaimed'}`);
  }
  if (hasTeam(lead, 'design')) {
    activeTeams.push(`Design: ${lead.assignedDesignerName || 'Unclaimed'}`);
  }
  if (hasTeam(lead, 'ads')) {
    activeTeams.push(`Ads: ${lead.assignedAdSpecialistName || 'Unclaimed'}`);
  }
  return activeTeams.length > 0 ? activeTeams.join(' | ') : 'Unassigned';
};

// Helper to sync a lead to Google Sheets
const syncLeadToGoogleSheets = async (lead) => {
  // Get Apps Script URL from Config
  const sheetsUrlConfig = await Config.findOne({ key: 'apps_script_url' });
  const appsScriptUrl = sheetsUrlConfig ? sheetsUrlConfig.value : '';

  if (!appsScriptUrl) {
    throw new Error('Google Sheets URL is not configured by Administrator');
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
    facebookAccountStatus: lead.facebookAccountStatus || 'Existing',
    instagramId: lead.instagramId || '',
    instagramPassword: lead.instagramPassword || '',
    instagramAccountStatus: lead.instagramAccountStatus || 'Existing',
    postersSummary,
    videosSummary,
    adsSummary,
    websiteStatus: lead.websiteStatus || 'Pending',
    platforms: lead.platforms,
    brandColors: lead.brandColors,
    targetAudienceRequired: lead.targetAudienceRequired || 'Required',
    targetAudience: lead.targetAudience || '',
    competitors: lead.competitors || '',
    planAmount: lead.planAmount || 0,
    advanceAmount: lead.advanceAmount || 0,
    pendingAmount: lead.pendingAmount || 0,
    adBudget: lead.adBudget || 0,
    adBudgetPerDay: lead.adBudgetPerDay || 0,
    startDate: lead.startDate || '',
    deliveryDeadline: lead.deliveryDeadline || '',
    totalPostsCount: totalReq,
    pendingPostsCount: pendingReq,
    completedPostsCount: completedReq,
    notes: lead.notes || ''
  };

  // Trigger sync POST request to Apps Script Web App
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
};

// @desc    Get all leads (Admin) or user-owned leads (Salesperson) or team leads (Technical)
// @route   GET /api/leads
// @access  Private
const getLeads = async (req, res) => {
  try {
    const leads = await Lead.find({}).sort({ createdAt: -1 });

    // Map and redact leads according to requester role
    const processedLeads = leads.map(lead => redactLeadForRole(lead, req.user));

    res.json(processedLeads);
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
    let techUser = null;
    if (assignedTo) {
      techUser = await User.findById(assignedTo);
      if (!techUser || techUser.role !== 'technical') {
        return res.status(400).json({ message: 'Selected user must be a technical team member' });
      }
    }

    const leadsToAssign = await Lead.find({ _id: { $in: leadIds } });
    for (const lead of leadsToAssign) {
      if (techUser) {
        if (techUser.team === 'developer') {
          lead.assignedDeveloper = techUser._id;
          lead.assignedDeveloperName = techUser.name;
        } else if (techUser.team === 'design') {
          lead.assignedDesigner = techUser._id;
          lead.assignedDesignerName = techUser.name;
        } else if (techUser.team === 'ads') {
          lead.assignedAdSpecialist = techUser._id;
          lead.assignedAdSpecialistName = techUser.name;
        }
        // Also set legacy field for compatibility
        lead.assignedTo = techUser._id;
        lead.assignedToName = techUser.name;
      } else {
        // Unassign all departments
        lead.assignedDeveloper = null;
        lead.assignedDeveloperName = null;
        lead.assignedDesigner = null;
        lead.assignedDesignerName = null;
        lead.assignedAdSpecialist = null;
        lead.assignedAdSpecialistName = null;
        lead.assignedTo = null;
        lead.assignedToName = null;
      }

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
      const teamLabel = techUser ? (techUser.team === 'ads' ? 'Ads Team' : techUser.team === 'design' ? 'Design Team' : 'Developer Team') : null;
      const desc = techUser ? `Client assigned to ${teamLabel} by Admin ${req.user.name}` : `Client details updated by Admin ${req.user.name}`;
      await createLeadNotification(lead.clientId, desc);
    }

    res.json({ message: 'Leads assigned successfully', assignedToName: techUser ? techUser.name : null });
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

    // Generate sequential client ID starting with 'LD' (e.g. LD001, LD002, etc.)
    const lastLead = await Lead.findOne({ clientId: { $regex: /^LDC\d+$/i } }).sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastLead && lastLead.clientId) {
      const match = lastLead.clientId.match(/\d+/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }
    const clientId = 'LDC' + String(nextNum).padStart(4, '0');

    // const leadData = {
    //   ...req.body,
    //   clientId,
    //   salesperson: req.user.id,
    //   salespersonName: req.user.name,
    //   status: 'Draft'
    // };

    const plan = Number(req.body.planAmount || 0);
    const advance = Number(req.body.advanceAmount || 0);
    const pending = Number(req.body.pendingAmount || 0);
    let autoPaymentStatus = 'Unpaid';
    if (plan > 0 && advance >= plan) autoPaymentStatus = 'Paid';
    else if (advance > 0 && advance < plan) autoPaymentStatus = 'Partial';
    else if (plan > 0 && pending === 0 && advance === 0) autoPaymentStatus = 'Paid';

    const leadData = {
      ...req.body,
      clientId,
      salesperson: req.user.id,
      salespersonName: req.user.name,
      status: 'Draft',
      paymentStatus: autoPaymentStatus
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

    // Auto sync to Google Sheets!
    try {
      await syncLeadToGoogleSheets(lead);
      lead.status = 'Submitted to Admin';
      await lead.save();
    } catch (syncError) {
      console.error('Auto Google Sheets sync failed on lead creation:', syncError.message);
      await createLeadNotification(clientId, `Client brief created by salesperson ${req.user.name}`);
      const leadObj = lead.toObject();
      leadObj.syncWarning = `Client ID ${clientId} created locally, but Google Sheets sync failed: ${syncError.message}`;
      return res.status(201).json(leadObj);
    }

    await createLeadNotification(lead.clientId, `Client brief created by salesperson ${req.user.name}`);
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
    
    let isAssignee = false;
    let isClaimedByOtherInDept = false;
    if (req.user.role === 'technical') {
      if (req.user.team === 'developer') {
        isAssignee = lead.assignedDeveloper && lead.assignedDeveloper.toString() === req.user.id.toString();
        isClaimedByOtherInDept = lead.assignedDeveloper && lead.assignedDeveloper.toString() !== req.user.id.toString();
      } else if (req.user.team === 'design') {
        isAssignee = lead.assignedDesigner && lead.assignedDesigner.toString() === req.user.id.toString();
        isClaimedByOtherInDept = lead.assignedDesigner && lead.assignedDesigner.toString() !== req.user.id.toString();
      } else if (req.user.team === 'ads') {
        isAssignee = lead.assignedAdSpecialist && lead.assignedAdSpecialist.toString() === req.user.id.toString();
        isClaimedByOtherInDept = lead.assignedAdSpecialist && lead.assignedAdSpecialist.toString() !== req.user.id.toString();
      }
    }

    const isTeamMember = req.user.role === 'technical' && 
      hasTeam(lead, req.user.team) &&
      !isClaimedByOtherInDept;

    let isClaimAction = false;
    if (req.user.role === 'technical' && req.body.assignedTo !== undefined) {
      if (req.body.assignedTo === req.user.id.toString()) {
        if (req.user.team === 'developer' && !lead.assignedDeveloper) {
          isClaimAction = true;
        } else if (req.user.team === 'design' && !lead.assignedDesigner) {
          isClaimAction = true;
        } else if (req.user.team === 'ads' && !lead.assignedAdSpecialist) {
          isClaimAction = true;
        }
      }
    }

    if (!isAdmin && !isCreator && !isSalesperson && !isAssignee && !isTeamMember && !isClaimAction) {
      return res.status(403).json({ message: 'Access denied: Cannot edit leads assigned to others or already claimed by another specialist' });
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

    // Only Admin can update/edit the payment status
    // if (req.user.role !== 'admin') {
    //   delete updatedData.paymentStatus;
    // }

    // Auto-calculate paymentStatus from amounts for all roles
    const plan = Number(updatedData.planAmount ?? lead.planAmount ?? 0);
    const advance = Number(updatedData.advanceAmount ?? lead.advanceAmount ?? 0);
    const pending = Number(updatedData.pendingAmount ?? lead.pendingAmount ?? 0);
    let autoPaymentStatus = 'Unpaid';
    if (plan > 0 && advance >= plan) autoPaymentStatus = 'Paid';
    else if (advance > 0 && advance < plan) autoPaymentStatus = 'Partial';
    else if (plan > 0 && pending === 0 && advance === 0) autoPaymentStatus = 'Paid';

    // Admin can manually override; others get auto-calculated
    if (req.user.role !== 'admin') {
      updatedData.paymentStatus = autoPaymentStatus;
    } else {
      // Admin: if they changed amounts, recalculate; otherwise keep their manual status
      const amountsChanged = updatedData.planAmount !== undefined || updatedData.advanceAmount !== undefined;
      if (amountsChanged) {
        updatedData.paymentStatus = autoPaymentStatus;
      }
    }

    // Intercept technical user claim/accept actions
    if (req.user.role === 'technical') {
      if (req.body.assignedTo !== undefined) {
        if (req.user.team === 'developer') {
          updatedData.assignedDeveloper = req.body.assignedTo;
          updatedData.assignedDeveloperName = req.body.assignedToName;
        } else if (req.user.team === 'design') {
          updatedData.assignedDesigner = req.body.assignedTo;
          updatedData.assignedDesignerName = req.body.assignedToName;
        } else if (req.user.team === 'ads') {
          updatedData.assignedAdSpecialist = req.body.assignedTo;
          updatedData.assignedAdSpecialistName = req.body.assignedToName;
        }
        // Legacy fields for backward compatibility
        updatedData.assignedTo = req.body.assignedTo;
        updatedData.assignedToName = req.body.assignedToName;

        // Ensure their team is in the assignedTeam array
        let currentTeams = lead.assignedTeam;
        if (!currentTeams) {
          currentTeams = [req.user.team];
        } else if (Array.isArray(currentTeams)) {
          if (!currentTeams.includes(req.user.team)) {
            currentTeams = [...currentTeams, req.user.team];
          }
        } else {
          if (currentTeams !== req.user.team && currentTeams !== 'all') {
            currentTeams = [currentTeams, req.user.team];
          }
        }
        updatedData.assignedTeam = currentTeams;
      }
    }

    // Intercept team routing changes by salesperson or admin: reset unassigned department specialists
    if (updatedData.assignedTeam !== undefined && !areTeamsEqual(updatedData.assignedTeam, lead.assignedTeam)) {
      if (!hasTeamVal(updatedData.assignedTeam, 'developer')) {
        updatedData.assignedDeveloper = null;
        updatedData.assignedDeveloperName = null;
      }
      if (!hasTeamVal(updatedData.assignedTeam, 'design')) {
        updatedData.assignedDesigner = null;
        updatedData.assignedDesignerName = null;
      }
      if (!hasTeamVal(updatedData.assignedTeam, 'ads')) {
        updatedData.assignedAdSpecialist = null;
        updatedData.assignedAdSpecialistName = null;
      }
      // Sync legacy fields
      if (!updatedData.assignedDeveloper && !updatedData.assignedDesigner && !updatedData.assignedAdSpecialist) {
        updatedData.assignedTo = null;
        updatedData.assignedToName = null;
      }
    }

    // Sync legacy assignedTo fields for Admin or Salesperson updates
    if (req.user.role === 'admin' || req.user.role === 'salesperson') {
      const activeDev = updatedData.assignedDeveloper !== undefined ? updatedData.assignedDeveloper : lead.assignedDeveloper;
      const activeDesign = updatedData.assignedDesigner !== undefined ? updatedData.assignedDesigner : lead.assignedDesigner;
      const activeAds = updatedData.assignedAdSpecialist !== undefined ? updatedData.assignedAdSpecialist : lead.assignedAdSpecialist;

      const activeDevName = updatedData.assignedDeveloperName !== undefined ? updatedData.assignedDeveloperName : lead.assignedDeveloperName;
      const activeDesignName = updatedData.assignedDesignerName !== undefined ? updatedData.assignedDesignerName : lead.assignedDesignerName;
      const activeAdsName = updatedData.assignedAdSpecialistName !== undefined ? updatedData.assignedAdSpecialistName : lead.assignedAdSpecialistName;

      updatedData.assignedTo = activeDev || activeDesign || activeAds || null;
      updatedData.assignedToName = activeDevName || activeDesignName || activeAdsName || null;
    }

    // Calculate workflow status dynamically based on assignments and deliverables if not manually overridden
    if (updatedData.workflowStatus === undefined) {
      const assignedTeam = updatedData.assignedTeam !== undefined ? updatedData.assignedTeam : lead.assignedTeam;
      let calculatedWorkflowStatus = 'Non-Allocated';
      const hasAnyTeam = (teamVal) => {
        if (!teamVal) return false;
        if (Array.isArray(teamVal)) return teamVal.length > 0;
        return true;
      };
      if (hasAnyTeam(assignedTeam)) {
        const postersRequired = updatedData.postersRequired !== undefined ? updatedData.postersRequired : lead.postersRequired;
        const postersStatus = updatedData.postersStatus !== undefined ? updatedData.postersStatus : lead.postersStatus;
        const videosRequired = updatedData.videosRequired !== undefined ? updatedData.videosRequired : lead.videosRequired;
        const videosStatus = updatedData.videosStatus !== undefined ? updatedData.videosStatus : lead.videosStatus;
        const adsRequired = updatedData.adsRequired !== undefined ? updatedData.adsRequired : lead.adsRequired;
        const adsStatus = updatedData.adsStatus !== undefined ? updatedData.adsStatus : lead.adsStatus;
        const websiteRequired = updatedData.websiteRequired !== undefined ? updatedData.websiteRequired : lead.websiteRequired;
        const websiteStatus = updatedData.websiteStatus !== undefined ? updatedData.websiteStatus : lead.websiteStatus;

        const activeStatuses = [];
        if (hasTeamVal(assignedTeam, 'design')) {
          if (Number(postersRequired) > 0) activeStatuses.push(postersStatus || 'Pending');
          if (Number(videosRequired) > 0) activeStatuses.push(videosStatus || 'Pending');
        }
        if (hasTeamVal(assignedTeam, 'ads')) {
          if (Number(adsRequired) > 0) activeStatuses.push(adsStatus || 'Pending');
        }
        if (hasTeamVal(assignedTeam, 'developer')) {
          if (websiteRequired) activeStatuses.push(websiteStatus || 'Pending');
        }

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
    
    // Determine change description for notification
    const roleLabel = req.user.role === 'admin' 
      ? 'Admin' 
      : req.user.role === 'salesperson' 
        ? 'Salesperson' 
        : req.user.team === 'ads'
          ? 'Ads Team'
          : req.user.team === 'design'
            ? 'Design Team'
            : 'Developer Team';
    const userSuffix = `by ${roleLabel} ${req.user.name}`;
    let desc = `Client details updated ${userSuffix}`;

    // 1. Payment status check
    const oldPlan = Number(lead.planAmount || 0);
    const oldAdvance = Number(lead.advanceAmount || 0);
    let oldPayStatus = lead.paymentStatus;
    if (!oldPayStatus) {
      oldPayStatus = 'Unpaid';
      if (oldPlan > 0 && oldAdvance >= oldPlan) oldPayStatus = 'Paid';
      else if (oldAdvance > 0 && oldAdvance < oldPlan) oldPayStatus = 'Partial';
    }

    const newPlan = Number(updatedLead.planAmount || 0);
    const newAdvance = Number(updatedLead.advanceAmount || 0);
    let newPayStatus = updatedLead.paymentStatus;
    if (!newPayStatus) {
      newPayStatus = 'Unpaid';
      if (newPlan > 0 && newAdvance >= newPlan) newPayStatus = 'Paid';
      else if (newAdvance > 0 && newAdvance < newPlan) newPayStatus = 'Partial';
    }

    if (oldPayStatus !== newPayStatus) {
      desc = `Payment status updated to ${newPayStatus} ${userSuffix}`;
    } else {
      // 2. Assigned team check
      const getTeamList = (t) => {
        if (!t) return [];
        if (Array.isArray(t)) return t;
        return [t];
      };
      const oldTeams = getTeamList(lead.assignedTeam);
      const newTeams = getTeamList(updatedLead.assignedTeam);
      const addedTeams = newTeams.filter(t => !oldTeams.includes(t));

      if (addedTeams.length > 0) {
        if (addedTeams.includes('ads')) {
          desc = `Client assigned to Ads Team ${userSuffix}`;
        } else if (addedTeams.includes('design')) {
          desc = `Client assigned to Design Team ${userSuffix}`;
        } else if (addedTeams.includes('developer')) {
          desc = `Client assigned to Developer Team ${userSuffix}`;
        }
      } else {
        // Check if individual specialist assignees changed
        const devChanged = (lead.assignedDeveloper || '').toString() !== (updatedLead.assignedDeveloper || '').toString();
        const designChanged = (lead.assignedDesigner || '').toString() !== (updatedLead.assignedDesigner || '').toString();
        const adsChanged = (lead.assignedAdSpecialist || '').toString() !== (updatedLead.assignedAdSpecialist || '').toString();

        if (adsChanged && updatedLead.assignedAdSpecialist) {
          desc = `Client assigned to Ads Specialist ${updatedLead.assignedAdSpecialistName} ${userSuffix}`;
        } else if (designChanged && updatedLead.assignedDesigner) {
          desc = `Client assigned to Design Specialist ${updatedLead.assignedDesignerName} ${userSuffix}`;
        } else if (devChanged && updatedLead.assignedDeveloper) {
          desc = `Client assigned to Developer Specialist ${updatedLead.assignedDeveloperName} ${userSuffix}`;
        }
      }
    }

    await createLeadNotification(updatedLead.clientId, desc);

    // Process response payload mapping and redaction
    res.json(redactLeadForRole(updatedLead, req.user));
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

    await syncLeadToGoogleSheets(lead);

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

// @desc    Get a single lead by ID
// @route   GET /api/leads/:id
// @access  Private
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead record not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isCreator = lead.salesperson && lead.salesperson.toString() === req.user.id.toString();
    const isTeamMember = req.user.role === 'technical' && hasTeam(lead, req.user.team);

    if (!isAdmin && !isCreator && req.user.role !== 'salesperson' && req.user.role !== 'technical') {
      return res.status(403).json({ message: 'Access denied: You do not have access to this client brief' });
    }

    res.json(redactLeadForRole(lead, req.user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a message to lead communications
// @route   POST /api/leads/:id/messages
// @access  Private
const addLeadMessage = async (req, res) => {
  const { category, message, replyTo } = req.body;
  if (!category || !message) {
    return res.status(400).json({ message: 'Category and message text are required' });
  }
  // if (!['Work Notes', 'Customer Notes'].includes(category)) {
  //   return res.status(400).json({ message: 'Invalid category' });
  // }

  if (!['Work Notes', 'Customer Notes', 'Sales Notes'].includes(category)) {
    return res.status(400).json({ message: 'Invalid category' });
  }

  // Sales Notes are only accessible to admin and salesperson
  if (category === 'Sales Notes' && req.user.role === 'technical') {
    return res.status(403).json({ message: 'Access denied: Sales Notes are restricted to sales team and admin only' });
  }

  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead record not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isCreator = lead.salesperson && lead.salesperson.toString() === req.user.id.toString();
    const isTeamMember = req.user.role === 'technical' && hasTeam(lead, req.user.team);

    // let isAssignee = false;
    // if (req.user.role === 'technical') {
    //   if (req.user.team === 'developer') {
    //     isAssignee = lead.assignedDeveloper && lead.assignedDeveloper.toString() === req.user.id.toString();
    //   } else if (req.user.team === 'design') {
    //     isAssignee = lead.assignedDesigner && lead.assignedDesigner.toString() === req.user.id.toString();
    //   } else if (req.user.team === 'ads') {
    //     isAssignee = lead.assignedAdSpecialist && lead.assignedAdSpecialist.toString() === req.user.id.toString();
    //   }
    // }

    // if (!isAdmin && !isCreator && !isTeamMember && !isAssignee) {
    //   return res.status(403).json({ message: 'Access denied: You do not have access to this client brief' });
    // }

    const roleLabel = req.user.role === 'admin' 
      ? 'Admin' 
      : req.user.role === 'salesperson' 
        ? 'Salesperson' 
        : req.user.team === 'ads'
          ? 'Ads Team'
          : req.user.team === 'design'
            ? 'Design Team'
            : 'Developer Team';

    const newMessage = {
      sender: req.user.id,
      senderName: req.user.name,
      senderRole: roleLabel,
      category,
      message,
      timestamp: new Date()
    };

    if (replyTo && replyTo.senderName && replyTo.message) {
      newMessage.replyTo = {
        senderName: replyTo.senderName,
        message: replyTo.message
      };
    }

    lead.communications.push(newMessage);
    await lead.save();
    await createLeadNotification(lead.clientId, `New message posted in ${category} by ${roleLabel} ${req.user.name}`);

    res.status(201).json(redactLeadForRole(lead, req.user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLeads,
  getLeadById,
  assignLeads,
  createLead,
  updateLead,
  deleteLead,
  syncLead,
  addLeadMessage
};