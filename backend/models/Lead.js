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
    enum: ['Non-Allocated', 'Allocated', 'In Progress', 'Completed'],
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
  }
}, {
  timestamps: true
});

const Lead = mongoose.model('Lead', leadSchema);
module.exports = Lead;
