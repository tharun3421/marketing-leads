const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  salesperson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  salespersonName: {
    type: String,
    required: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  businessCategory: {
    type: String,
    trim: true
  },
  websiteUrl: {
    type: String,
    trim: true
  },
  websiteRequired: {
    type: Boolean,
    default: false
  },
  websiteType: {
    type: String,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  facebookId: {
    type: String,
    trim: true
  },
  facebookPassword: {
    type: String,
    trim: true
  },
  instagramId: {
    type: String,
    trim: true
  },
  instagramPassword: {
    type: String,
    trim: true
  },
  postersRequired: {
    type: Number,
    default: 0
  },
  postersPending: {
    type: Number,
    default: 0
  },
  postersStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  videosRequired: {
    type: Number,
    default: 0
  },
  videosPending: {
    type: Number,
    default: 0
  },
  videosStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  adsRequired: {
    type: Number,
    default: 0
  },
  adsPending: {
    type: Number,
    default: 0
  },
  adsStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  websiteStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  websitePending: {
    type: Number,
    default: 0
  },
  platforms: [{
    type: String
  }],
  otherTools: [{
    type: String
  }],
  brandColors: {
    type: String,
    default: '#6366f1'
  },
  targetAudience: {
    type: String,
    trim: true
  },
  competitors: {
    type: String,
    trim: true
  },
  planAmount: {
    type: Number,
    default: 0
  },
  advanceAmount: {
    type: Number,
    default: 0
  },
  pendingAmount: {
    type: Number,
    default: 0
  },
  adBudget: {
    type: Number,
    default: 0
  },
  startDate: {
    type: String
  },
  deliveryDeadline: {
    type: String
  },
  notes: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted to Admin'],
    default: 'Draft'
  },
  assignedTeam: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  workflowStatus: {
    type: String,
    enum: ['Non-Allocated', 'Allocated', 'Pending', 'In Progress', 'Completed'],
    default: 'Non-Allocated'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedToName: {
    type: String,
    default: null
  },
  assignedDeveloper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedDeveloperName: {
    type: String,
    default: null
  },
  assignedDesigner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedDesignerName: {
    type: String,
    default: null
  },
  assignedAdSpecialist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedAdSpecialistName: {
    type: String,
    default: null
  },
  clientId: {
    type: String,
    default: null
  },
  adBudgetPerDay: {
    type: Number,
    default: 0
  },
  // Campaign plan duration per platform (Meta Ads / Google Ads / LinkedIn Ads / SEO only)
  metaAdsPlanDuration: {
    type: Number,
    default: 0
  },
  googleAdsPlanDuration: {
    type: Number,
    default: 0
  },
  linkedinAdsPlanDuration: {
    type: Number,
    default: 0
  },
  seoPlanDuration: {
    type: Number,
    default: 0
  },
  youtubeAdsPlanDuration: {
  type: Number,
  default: 0
},
youtubeAdsStartDate: { type: String, default: null },
youtubeAdsEndDate: { type: String, default: null },
youtubeAdsCampaignStatus: {
  type: String,
  enum: ['Pending', 'In Progress', 'Completed'],
  default: 'Pending'
},
  // Per-campaign start dates (set by Ads Team)
  metaAdsStartDate: { type: String, default: null },
  metaAdsEndDate: { type: String, default: null },
  metaAdsCampaignStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  googleAdsStartDate: { type: String, default: null },
  googleAdsEndDate: { type: String, default: null },
  googleAdsCampaignStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  linkedinAdsStartDate: { type: String, default: null },
  linkedinAdsEndDate: { type: String, default: null },
  linkedinAdsCampaignStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  seoStartDate: { type: String, default: null },
  seoEndDate: { type: String, default: null },
  seoCampaignStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  gmbCampaignStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  // Ads Team internal postings tracking (does not affect Design Team)
postingsPostersStatus: {
  type: String,
  enum: ['Pending', 'In Progress', 'Completed'],
  default: 'Pending'
},
postingsPostersPending: {
  type: Number,
  default: 0
},
postingsVideosStatus: {
  type: String,
  enum: ['Pending', 'In Progress', 'Completed'],
  default: 'Pending'
},
postingsVideosPending: {
  type: Number,
  default: 0
},
  // Plan dates for Ads campaigns
  planStartDate: {
    type: String,
    default: null
  },
  planEndDate: {
    type: String,
    default: null
  },
  // Per-team individual statuses
  adsTeamStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  designTeamStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  devTeamStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Partial', 'Paid'],
    default: 'Unpaid'
  },
  facebookAccountStatus: {
    type: String,
    enum: ['Existing', 'New'],
    default: 'Existing'
  },
  instagramAccountStatus: {
    type: String,
    enum: ['Existing', 'New'],
    default: 'Existing'
  },
  targetAudienceRequired: {
    type: String,
    enum: ['Required', 'Not Required'],
    default: 'Required'
  },
  communications: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    // category: { type: String, enum: ['Work Notes', 'Customer Notes'], required: true },
    category: { type: String, enum: ['Work Notes', 'Customer Notes', 'Sales Notes'], required: true },
    message: { type: String, required: true },
    replyTo: {
      senderName: String,
      message: String
    },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// TTL index to automatically delete client records after 1 year (31536000 seconds)
leadSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

const Lead = mongoose.model('Lead', leadSchema);
module.exports = Lead;