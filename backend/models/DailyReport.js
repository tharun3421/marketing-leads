const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  team: {
    type: String,
    required: true,
    enum: ['ads', 'design', 'developer']
  },
  teamMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamMemberName: {
    type: String,
    required: true,
    trim: true
  },
  clientBusinessName: {
    type: String,
    required: true,
    trim: true
  },
  workStatus: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

dailyReportSchema.index({ teamMember: 1, date: -1 });
dailyReportSchema.index({ team: 1, date: -1 });

const DailyReport = mongoose.model('DailyReport', dailyReportSchema);
module.exports = DailyReport;