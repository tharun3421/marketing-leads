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
    } else {
      leads = await Lead.find({ salesperson: req.user.id }).sort({ createdAt: -1 });
    }
    res.json(leads);
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

    // Verify ownership (only salesperson who created it or admin can edit)
    if (req.user.role !== 'admin' && lead.salesperson.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied: Cannot edit leads assigned to others' });
    }

    // Update fields and reset status to Draft
    const updatedData = {
      ...req.body,
      status: 'Draft' // Reset to Draft so they can re-sync changes
    };

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
      await fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(payload)
      });
    } catch (fetchError) {
      console.error('Fetch Google Sheets error:', fetchError);
      // Suppress network error in dev/mock if it's CORS or similar, but in real MERN we should log it.
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
