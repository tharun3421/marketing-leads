const DailyReport = require('../models/DailyReport');
const Config = require('../models/Config');

const TEAM_SHEET_NAMES = { ads: 'Ads', design: 'Design', developer: 'Developer' };
const VALID_TEAMS = Object.keys(TEAM_SHEET_NAMES);

// Helper to format a Date into YYYY-MM-DD for the sheet
const formatDateForSheet = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

// Helper to sync a Daily Report row into the correct team sheet (Ads / Design / Developer)
// Reuses the same Apps Script Web App URL that Lead sync uses.
const syncDailyReportToGoogleSheets = async (report) => {
  const sheetsUrlConfig = await Config.findOne({ key: 'apps_script_url' });
  const appsScriptUrl = sheetsUrlConfig ? sheetsUrlConfig.value : '';

  if (!appsScriptUrl) {
    throw new Error('Google Sheets URL is not configured by Administrator');
  }

  const payload = {
    type: 'dailyReport',
    sheetName: TEAM_SHEET_NAMES[report.team] || 'Ads',
    reportId: String(report._id),
    date: formatDateForSheet(report.date),
    teamMemberName: report.teamMemberName,
    clientBusinessName: report.clientBusinessName,
    workStatus: report.workStatus,
    updatedAt: report.updatedAt ? new Date(report.updatedAt).toISOString() : new Date().toISOString()
  };

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

  if (
    responseText.includes('Sign in - Google Accounts') ||
    responseText.includes('You need access') ||
    responseText.includes('request-access-icon') ||
    responseText.includes('docs-drivelogo-text')
  ) {
    throw new Error('Google Sheets access denied. Ensure the Apps Script deployment access is set to "Anyone".');
  }

  return responseText;
};

// @route   GET /api/daily-reports
// @desc    Technical: get own daily reports. Admin: get all reports, filterable by team/member/date/client.
// @access  Private
const getDailyReports = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === 'technical') {
      query.teamMember = req.user._id;
    } else if (req.user.role === 'admin') {
      if (req.query.team && VALID_TEAMS.includes(req.query.team)) {
        query.team = req.query.team;
      }
      if (req.query.member) {
        query.teamMemberName = { $regex: req.query.member.trim(), $options: 'i' };
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.query.date) {
      const day = new Date(req.query.date);
      if (!isNaN(day.getTime())) {
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(day);
        end.setHours(23, 59, 59, 999);
        query.date = { $gte: start, $lte: end };
      }
    }

    if (req.query.search) {
      query.clientBusinessName = { $regex: req.query.search.trim(), $options: 'i' };
    }

    const reports = await DailyReport.find(query).sort({ date: -1, createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/daily-reports
// @desc    Create a new daily report (Technical team members only)
// @access  Private/Technical
const createDailyReport = async (req, res) => {
  try {
    if (req.user.role !== 'technical') {
      return res.status(403).json({ message: 'Only Technical team members can submit daily reports' });
    }
    if (!req.user.team || !VALID_TEAMS.includes(req.user.team)) {
      return res.status(400).json({ message: 'Your account is not assigned to a technical team (Ads, Design, or Developer)' });
    }

    const { date, clientBusinessName, workStatus } = req.body;
    if (!date || !clientBusinessName || !clientBusinessName.trim() || !workStatus || !workStatus.trim()) {
      return res.status(400).json({ message: 'Date, Client Business Name, and Work Status are required' });
    }

    const report = await DailyReport.create({
      date,
      team: req.user.team,
      teamMember: req.user._id,
      teamMemberName: req.user.name,
      clientBusinessName: clientBusinessName.trim(),
      workStatus: workStatus.trim()
    });

    try {
      await syncDailyReportToGoogleSheets(report);
    } catch (syncError) {
      console.error('Daily report Google Sheets sync failed on create:', syncError.message);
      const reportObj = report.toObject();
      reportObj.syncWarning = `Report saved locally, but Google Sheets sync failed: ${syncError.message}`;
      return res.status(201).json(reportObj);
    }

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/daily-reports/:id
// @desc    Update an existing daily report (own report only for Technical)
// @access  Private
const updateDailyReport = async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Daily report not found' });
    }

    if (req.user.role === 'technical') {
      if (String(report.teamMember) !== String(req.user._id)) {
        return res.status(403).json({ message: 'You can only edit your own daily reports' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { date, clientBusinessName, workStatus } = req.body;
    if (date !== undefined) report.date = date;
    if (clientBusinessName !== undefined) {
      if (!clientBusinessName.trim()) {
        return res.status(400).json({ message: 'Client Business Name cannot be empty' });
      }
      report.clientBusinessName = clientBusinessName.trim();
    }
    if (workStatus !== undefined) {
      if (!workStatus.trim()) {
        return res.status(400).json({ message: 'Work Status cannot be empty' });
      }
      report.workStatus = workStatus.trim();
    }

    await report.save();

    try {
      await syncDailyReportToGoogleSheets(report);
    } catch (syncError) {
      console.error('Daily report Google Sheets sync failed on update:', syncError.message);
      const reportObj = report.toObject();
      reportObj.syncWarning = `Report updated locally, but Google Sheets sync failed: ${syncError.message}`;
      return res.json(reportObj);
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   DELETE /api/daily-reports/:id
// @desc    Delete a daily report (own report only for Technical)
// @access  Private
const deleteDailyReport = async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Daily report not found' });
    }

    if (req.user.role === 'technical') {
      if (String(report.teamMember) !== String(req.user._id)) {
        return res.status(403).json({ message: 'You can only delete your own daily reports' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await report.deleteOne();
    res.json({ message: 'Daily report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDailyReports,
  createDailyReport,
  updateDailyReport,
  deleteDailyReport
};