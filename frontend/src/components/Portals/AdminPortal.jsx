import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ChevronRight, 
  ArrowLeft, 
  Search, 
  Eye, 
  X, 
  CalendarRange, 
  Layers, 
  DollarSign, 
  ShieldCheck, 
  Globe, 
  Mail, 
  Phone,
  CheckCircle,
  FileSpreadsheet,
  Download,
  Clock,
  LogOut,
  HelpCircle,
  Bell
} from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { Input } from '../UI/Input';
import AppsScriptGuide from '../Help/AppsScriptGuide';
import { useAuth } from '../../context/AuthContext';

export default function AdminPortal({ 
  notifications = [],
  setNotifications,
  onAddToast,
  onAddNotification
}) {
  const { authFetch, logout } = useAuth();

  const [leads, setLeads] = useState([]);
  const [salespersonsList, setSalespersonsList] = useState([]);
  const [appsScriptUrl, setAppsScriptUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [localUrl, setLocalUrl] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [selectedRep, setSelectedRep] = useState(null); // name string | 'All' | null
  const [newRepName, setNewRepName] = useState('');
  const [newRepUsername, setNewRepUsername] = useState('');
  const [newRepPassword, setNewRepPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);

  // Advanced filters state
  const [filterService, setFilterService] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const leadsRes = await authFetch('/api/leads');
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData);
      }

      const salespersonsRes = await authFetch('/api/auth/salespersons');
      if (salespersonsRes.ok) {
        const salespersonsData = await salespersonsRes.json();
        setSalespersonsList(salespersonsData);
      }

      const configRes = await authFetch('/api/config/sheets-url');
      if (configRes.ok) {
        const configData = await configRes.json();
        setAppsScriptUrl(configData.url || '');
        setLocalUrl(configData.url || '');
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      onAddToast('Fetch Error', 'Failed to load system data from server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-905 dark:text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Loading administration data...</span>
        </div>
      </div>
    );
  }

  // Global derived overall status helper
  const getProjectStatus = (lead) => {
    const activeStatuses = [];
    if (Number(lead.postersRequired) > 0) activeStatuses.push(lead.postersStatus || 'Pending');
    if (Number(lead.videosRequired) > 0) activeStatuses.push(lead.videosStatus || 'Pending');
    if (Number(lead.adsRequired) > 0) activeStatuses.push(lead.adsStatus || 'Pending');
    if (lead.websiteRequired) activeStatuses.push(lead.websiteStatus || 'Pending');
    
    if (activeStatuses.length === 0) return 'Pending';
    if (activeStatuses.every(s => s === 'Completed')) return 'Completed';
    if (activeStatuses.every(s => s === 'Pending')) return 'Pending';
    return 'In Progress';
  };

  // Global Metrics
  const totalRepsCount = salespersonsList.length;
  const totalClientsCount = leads.length;
  const totalPendingCount = leads.filter(l => l.status !== 'Submitted to Admin').length;

  let totalPendingServices = 0;
  let totalInProgressServices = 0;
  let totalCompletedServices = 0;

  let totalPostersPending = 0;
  let totalPostersInProgress = 0;
  let totalPostersCompleted = 0;

  let totalVideosPending = 0;
  let totalVideosInProgress = 0;
  let totalVideosCompleted = 0;

  let totalAdsPending = 0;
  let totalAdsInProgress = 0;
  let totalAdsCompleted = 0;

  let totalWebsitePending = 0;
  let totalWebsiteInProgress = 0;
  let totalWebsiteCompleted = 0;

  leads.forEach(lead => {
    if (Number(lead.postersRequired) > 0) {
      const s = lead.postersStatus || 'Pending';
      if (s === 'Completed') { totalCompletedServices++; totalPostersCompleted++; }
      else if (s === 'In Progress') { totalInProgressServices++; totalPostersInProgress++; }
      else { totalPendingServices++; totalPostersPending++; }
    }
    if (Number(lead.videosRequired) > 0) {
      const s = lead.videosStatus || 'Pending';
      if (s === 'Completed') { totalCompletedServices++; totalVideosCompleted++; }
      else if (s === 'In Progress') { totalInProgressServices++; totalVideosInProgress++; }
      else { totalPendingServices++; totalVideosPending++; }
    }
    if (Number(lead.adsRequired) > 0) {
      const s = lead.adsStatus || 'Pending';
      if (s === 'Completed') { totalCompletedServices++; totalAdsCompleted++; }
      else if (s === 'In Progress') { totalInProgressServices++; totalAdsInProgress++; }
      else { totalPendingServices++; totalAdsPending++; }
    }
    if (lead.websiteRequired) {
      const s = lead.websiteStatus || 'Pending';
      if (s === 'Completed') { totalCompletedServices++; totalWebsiteCompleted++; }
      else if (s === 'In Progress') { totalInProgressServices++; totalWebsiteInProgress++; }
      else { totalPendingServices++; totalWebsitePending++; }
    }
  });

  // Rep Stats Mapper
  const repStats = salespersonsList.map(rep => {
    const name = typeof rep === 'string' ? rep : rep.name;
    const repLeads = leads.filter(l => l.salespersonName === name);
    const total = repLeads.length;
    const completed = repLeads.filter(l => getProjectStatus(l) === 'Completed').length;
    const inProgress = repLeads.filter(l => getProjectStatus(l) === 'In Progress').length;
    const pending = repLeads.filter(l => getProjectStatus(l) === 'Pending').length;
    const submitted = completed; // for compatibility
    return { name, total, completed, inProgress, pending, submitted };
  });

  // Handle salesperson account creation
  const handleCreateRep = async (e) => {
    e.preventDefault();
    const cleanName = newRepName.trim();
    const cleanUsername = newRepUsername.trim().toLowerCase();
    const cleanPassword = newRepPassword;

    if (!cleanName || !cleanUsername || !cleanPassword) {
      onAddToast('Validation Error', 'All fields (name, username, password) are required.', 'warning');
      return;
    }

    const nameExists = salespersonsList.some(rep => {
      const name = typeof rep === 'string' ? rep : rep.name;
      const username = typeof rep === 'string' ? '' : rep.username;
      return name.toLowerCase() === cleanName.toLowerCase() || username.toLowerCase() === cleanUsername;
    });

    if (nameExists) {
      onAddToast('Account Creation Blocked', `${cleanName} or username "${cleanUsername}" is already registered.`, 'warning');
      return;
    }

    try {
      const res = await authFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: cleanName,
          username: cleanUsername,
          password: cleanPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        onAddToast('Representative Registered', `Registered ${cleanName} successfully.`, 'success');
        if (onAddNotification) {
          onAddNotification(`New representative profile "${cleanName}" registered by Admin.`, 'assignment');
        }
        
        // Refresh salespersons list
        const salespersonsRes = await authFetch('/api/auth/salespersons');
        if (salespersonsRes.ok) {
          const salespersonsData = await salespersonsRes.json();
          setSalespersonsList(salespersonsData);
        }
        
        // Clear fields
        setNewRepName('');
        setNewRepUsername('');
        setNewRepPassword('');
      } else {
        onAddToast('Registration Failed', data.message || 'Error registering representative.', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      onAddToast('Registration Failed', 'Network or server error during registration.', 'error');
    }
  };

  // Intake Over Time Chart Data (Last 7 Days)
  const getIntakeData = () => {
    const data = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      data[dateStr] = 0;
    }
    leads.forEach(lead => {
      if (lead.timestamp) {
        const dateStr = new Date(lead.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
        if (data[dateStr] !== undefined) {
          data[dateStr]++;
        }
      }
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  };
  const intakeData = getIntakeData();

  // Inspect leads for a salesperson
  const inspectedLeads = selectedRep === 'All' 
    ? leads 
    : leads.filter(l => l.salespersonName === selectedRep);

  const filteredInspectedLeads = inspectedLeads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      (lead.clientName || '').toLowerCase().includes(searchLower) ||
      (lead.companyName || '').toLowerCase().includes(searchLower) ||
      (lead.businessCategory || '').toLowerCase().includes(searchLower)
    );

    let matchesService = true;
    if (filterService === 'Posters') matchesService = Number(lead.postersRequired) > 0;
    else if (filterService === 'Videos') matchesService = Number(lead.videosRequired) > 0;
    else if (filterService === 'Ads') matchesService = Number(lead.adsRequired) > 0;
    else if (filterService === 'Website') matchesService = lead.websiteRequired === true;

    let matchesStatus = true;
    if (filterStatus !== 'All') {
      if (filterService === 'Posters') matchesStatus = lead.postersStatus === filterStatus;
      else if (filterService === 'Videos') matchesStatus = lead.videosStatus === filterStatus;
      else if (filterService === 'Ads') matchesStatus = lead.adsStatus === filterStatus;
      else if (filterService === 'Website') matchesStatus = lead.websiteStatus === filterStatus;
      else {
        matchesStatus = getProjectStatus(lead) === filterStatus;
      }
    }

    let matchesDate = true;
    if (filterStartDate) {
      matchesDate = matchesDate && lead.startDate >= filterStartDate;
    }
    if (filterEndDate) {
      matchesDate = matchesDate && lead.startDate <= filterEndDate;
    }

    return matchesSearch && matchesService && matchesStatus && matchesDate;
  });

  // Export specific Salesperson's clients to CSV
  const handleExportRepCSV = () => {
    if (inspectedLeads.length === 0) return;

    const headers = [
      "Timestamp", "Salesperson Name", "Client Name", "Mobile Number", "Email",
      "Company Name", "Business Category", "Website URL", "Website Required", "Website Type", 
      "Facebook ID/Username", "Facebook Password", "Instagram ID/Username", "Instagram Password",
      "Posters (Total/Pending/Completed)", "Videos (Total/Pending/Completed)", 
      "Ads (Total/Pending/Completed)", "Website Status", "Website Pending", "Selected Platforms", 
      "Brand Colors", "Target Audience", "Competitors", "Ad Budget", "Start Date", "Delivery Deadline",
      "Total Count", "Pending Count", "Completed Count", "Notes"
    ];

    const csvRows = [headers.join(',')];

    inspectedLeads.forEach(lead => {
      const totalReq = Number(lead.postersRequired || 0) + Number(lead.videosRequired || 0) + Number(lead.adsRequired || 0) + (lead.websiteRequired ? 1 : 0);
      const pendingReq = Number(lead.postersPending ?? (lead.postersStatus === 'Completed' ? 0 : lead.postersRequired || 0)) + 
                         Number(lead.videosPending ?? (lead.videosStatus === 'Completed' ? 0 : lead.videosRequired || 0)) + 
                         Number(lead.adsPending ?? (lead.adsStatus === 'Completed' ? 0 : lead.adsRequired || 0)) + 
                         (lead.websiteRequired ? (lead.websiteStatus === 'Completed' ? 0 : 1) : 0);
      const completedReq = totalReq - pendingReq;

      const postersPending = Number(lead.postersPending ?? (lead.postersStatus === 'Completed' ? 0 : lead.postersRequired || 0));
      const postersReq = Number(lead.postersRequired || 0);
      const postersCompleted = postersReq - postersPending;

      const videosPending = Number(lead.videosPending ?? (lead.videosStatus === 'Completed' ? 0 : lead.videosRequired || 0));
      const videosReq = Number(lead.videosRequired || 0);
      const videosCompleted = videosReq - videosPending;

      const adsPending = Number(lead.adsPending ?? (lead.adsStatus === 'Completed' ? 0 : lead.adsRequired || 0));
      const adsReq = Number(lead.adsRequired || 0);
      const adsCompleted = adsReq - adsPending;

      const values = [
        lead.timestamp || '',
        lead.salespersonName || '',
        lead.clientName || '',
        lead.mobileNumber || '',
        lead.email || '',
        lead.companyName || '',
        lead.businessCategory || '',
        lead.websiteUrl || '',
        lead.websiteRequired ? 'Yes' : 'No',
        lead.websiteType || '',
        lead.facebookId || '',
        lead.facebookPassword || '',
        lead.instagramId || '',
        lead.instagramPassword || '',
        `Total: ${postersReq} | Pending: ${postersPending} | Completed: ${postersCompleted}`,
        `Total: ${videosReq} | Pending: ${videosPending} | Completed: ${videosCompleted}`,
        `Total: ${adsReq} | Pending: ${adsPending} | Completed: ${adsCompleted}`,
        lead.websiteStatus || 'Pending',
        lead.websiteRequired ? (lead.websiteStatus === 'Completed' ? 0 : 1) : 0,
        (lead.platforms || []).join('; '),
        lead.brandColors || '',
        lead.targetAudience || '',
        lead.competitors || '',
        lead.adBudget || '',
        lead.startDate || '',
        lead.deliveryDeadline || '',
        totalReq,
        pendingReq,
        completedReq,
        lead.notes || ''
      ].map(val => {
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_report_${selectedRep.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // INSPECTING SPECIFIC SALESPERSON BRIEFING
  if (selectedRep) {
    return (
      <div className="space-y-6">
        
        {/* Sub-Header */}
        <div className="flex items-center gap-3 border-b border-gray-200/50 dark:border-slate-800/50 pb-5">
          <button
            onClick={() => {
              setSelectedRep(null);
              setSearchTerm('');
            }}
            className="p-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white/50 hover:bg-white/80 dark:bg-slate-950/30 dark:hover:bg-slate-950/60 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Portfolio Inspection: {selectedRep}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Reviewing {inspectedLeads.length} total client brief records
            </p>
          </div>
        </div>

        {/* Portfolio Registry Table */}
        <Card title={`${selectedRep}'s Clients`} subtitle="Double click or inspect any record to audit full client brief details">
          <div className="space-y-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by client, company, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/20 text-gray-900 dark:text-white outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Service Filter */}
              <div className="w-full md:w-44">
                <select
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2.5 px-3 text-sm bg-white/60 dark:bg-slate-900/40 text-gray-905 dark:text-white cursor-pointer focus:border-indigo-500"
                >
                  <option value="All">All Services</option>
                  <option value="Posters">Posters</option>
                  <option value="Videos">Videos</option>
                  <option value="Ads">Advertisements</option>
                  <option value="Website">Websites</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-44">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2.5 px-3 text-sm bg-white/60 dark:bg-slate-900/40 text-gray-905 dark:text-white cursor-pointer focus:border-indigo-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-gray-150/40 dark:border-slate-800/40 pt-4">
              {/* Date Filters */}
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-650 dark:text-gray-400">
                <span>Timeline From:</span>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="rounded-lg border border-gray-200 dark:border-slate-800 py-1.5 px-2.5 bg-white/60 dark:bg-slate-900/40 text-gray-900 dark:text-white outline-hidden focus:border-indigo-500"
                />
                <span>To:</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="rounded-lg border border-gray-200 dark:border-slate-800 py-1.5 px-2.5 bg-white/60 dark:bg-slate-900/40 text-gray-900 dark:text-white outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2">
                {/* Reset Filters */}
                {(filterService !== 'All' || filterStatus !== 'All' || filterStartDate || filterEndDate) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilterService('All');
                      setFilterStatus('All');
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  icon={Download}
                  onClick={handleExportRepCSV}
                  disabled={inspectedLeads.length === 0}
                >
                  Export CSV Report
                </Button>
              </div>
            </div>
          </div>

          {filteredInspectedLeads.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 dark:border-slate-800/80 rounded-xl bg-gray-50/30 dark:bg-slate-900/10">
              <Users className="w-10 h-10 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {inspectedLeads.length === 0 
                  ? `${selectedRep} has not added any client records yet.` 
                  : 'No client folders match the search query.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-100 dark:border-slate-800/60 rounded-xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800/60">
                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client Contact</th>
                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Company & Sector</th>
                    {selectedRep === 'All' && (
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Representative</th>
                    )}
                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Timestamp</th>
                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Deliverables Status</th>
                    <th className="p-3 font-semibold text-center text-gray-700 dark:text-gray-300">Sync Status</th>
                    <th className="p-3 font-semibold text-center text-gray-700 dark:text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40">
                  {filteredInspectedLeads.map((lead, idx) => (
                    <tr key={idx} className="hover:bg-indigo-500/5 dark:hover:bg-indigo-500/2 transition-colors">
                      <td className="p-3 font-medium text-gray-900 dark:text-white">
                        <div>{lead.clientName}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{lead.email}</div>
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">
                        <div>{lead.companyName || '—'}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{lead.businessCategory || '—'}</div>
                      </td>
                      {selectedRep === 'All' && (
                        <td className="p-3 text-sm text-indigo-600 dark:text-indigo-400 font-bold">
                          {lead.salespersonName}
                        </td>
                      )}
                      <td className="p-3 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {lead.timestamp ? new Date(lead.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-3 text-xs">
                        <div className="space-y-1">
                          {Number(lead.postersRequired || 0) > 0 && (
                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              <span>Posters: </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {Number(lead.postersRequired || 0) - (Number(lead.postersPending ?? (lead.postersStatus === 'Completed' ? 0 : lead.postersRequired || 0)))} Comp / {Number(lead.postersPending ?? (lead.postersStatus === 'Completed' ? 0 : lead.postersRequired || 0))} Pend
                              </span>
                            </div>
                          )}
                          {Number(lead.videosRequired || 0) > 0 && (
                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              <span>Videos: </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {Number(lead.videosRequired || 0) - (Number(lead.videosPending ?? (lead.videosStatus === 'Completed' ? 0 : lead.videosRequired || 0)))} Comp / {Number(lead.videosPending ?? (lead.videosStatus === 'Completed' ? 0 : lead.videosRequired || 0))} Pend
                              </span>
                            </div>
                          )}
                          {Number(lead.adsRequired || 0) > 0 && (
                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              <span>Ads: </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {Number(lead.adsRequired || 0) - (Number(lead.adsPending ?? (lead.adsStatus === 'Completed' ? 0 : lead.adsRequired || 0)))} Comp / {Number(lead.adsPending ?? (lead.adsStatus === 'Completed' ? 0 : lead.adsRequired || 0))} Pend
                              </span>
                            </div>
                          )}
                          {!lead.postersRequired && !lead.videosRequired && !lead.adsRequired && (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`
                          text-[10px] font-bold px-2 py-0.5 rounded-md border
                          ${lead.status === 'Submitted to Admin'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10 dark:bg-emerald-500/5 dark:border-emerald-500/10'
                            : lead.status === 'Client Submitted'
                              ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/10 dark:bg-indigo-500/5 dark:border-indigo-500/10'
                              : 'bg-slate-500/10 text-slate-600 border-slate-500/10 dark:bg-slate-500/5 dark:border-slate-500/10'
                          }
                        `}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 transition-colors inline-flex cursor-pointer"
                          title="Inspect Lead"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Details Modal */}
          {selectedLead && (
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-150 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800/80">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Lead Details Brief</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Submitted by {selectedLead.salespersonName} on {new Date(selectedLead.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedLead(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-700 dark:text-gray-300">
                  {/* Client Info */}
                  <div>
                    <h4 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2.5">
                      Client Profile & Metadata
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 bg-gray-50 dark:bg-slate-950/20 p-4 rounded-xl border border-gray-100 dark:border-slate-800/40">
                      <div><span className="text-gray-400">Client Name:</span> <strong className="text-gray-900 dark:text-white">{selectedLead.clientName}</strong></div>
                      <div><span className="text-gray-400">Mobile Number:</span> <strong className="text-gray-900 dark:text-white">{selectedLead.mobileNumber}</strong></div>
                      <div><span className="text-gray-400">Email Address:</span> <span className="text-gray-900 dark:text-white font-medium">{selectedLead.email}</span></div>
                      <div><span className="text-gray-400">Company Name:</span> <span className="text-gray-900 dark:text-white">{selectedLead.companyName || '—'}</span></div>
                      <div><span className="text-gray-400">Business Category:</span> <span className="text-gray-900 dark:text-white">{selectedLead.businessCategory || '—'}</span></div>
                      <div><span className="text-gray-400">Website URL:</span> <a href={selectedLead.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline break-all">{selectedLead.websiteUrl || '—'}</a></div>
                      <div><span className="text-gray-400">Website Required:</span> <strong className="text-gray-950 dark:text-white">{selectedLead.websiteRequired ? 'Yes' : 'No'}</strong></div>
                      {selectedLead.websiteRequired && (
                        <div className="md:col-span-2"><span className="text-gray-400">Website Type:</span> <span className="text-gray-900 dark:text-white font-semibold">{selectedLead.websiteType || '—'}</span></div>
                      )}
                    </div>
                  </div>

                  {/* Account Access */}
                  <div>
                    <h4 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2.5">
                      Social Channels Credentials
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 dark:bg-slate-950/20 rounded-xl border border-gray-100 dark:border-slate-800/40">
                        <span className="text-xs font-semibold text-gray-400 block mb-1">Facebook ID</span>
                        <span className="font-mono text-gray-900 dark:text-white">{selectedLead.facebookId || '—'}</span>
                        {selectedLead.facebookPassword && (
                          <div className="mt-1">
                            <span className="text-xs font-semibold text-gray-400 block mb-1">Facebook Password</span>
                            <span className="font-mono text-rose-500 select-all">{selectedLead.facebookPassword}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-slate-950/20 rounded-xl border border-gray-100 dark:border-slate-800/40">
                        <span className="text-xs font-semibold text-gray-400 block mb-1">Instagram ID</span>
                        <span className="font-mono text-gray-900 dark:text-white">{selectedLead.instagramId || '—'}</span>
                        {selectedLead.instagramPassword && (
                          <div className="mt-1">
                            <span className="text-xs font-semibold text-gray-400 block mb-1">Instagram Password</span>
                            <span className="font-mono text-rose-500 select-all">{selectedLead.instagramPassword}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Marketing Requirements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2.5">
                        Marketing Assets
                      </h4>
                      <div className="space-y-3 bg-gray-50 dark:bg-slate-950/20 p-4 rounded-xl border border-gray-100 dark:border-slate-800/40">
                        {/* Posters */}
                        {Number(selectedLead.postersRequired || 0) > 0 && (
                          <div className="flex justify-between items-center border-b border-gray-200/40 dark:border-slate-800/40 pb-2">
                            <div>
                              <span className="text-gray-700 dark:text-gray-300 text-xs font-bold block">Posters</span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">Status: {selectedLead.postersStatus || 'Pending'}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-gray-900 dark:text-white">
                                Total: {selectedLead.postersRequired || 0}
                              </span>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-0.5">
                                Completed: {Number(selectedLead.postersRequired || 0) - Number(selectedLead.postersPending ?? (selectedLead.postersStatus === 'Completed' ? 0 : selectedLead.postersRequired || 0))} | Pending: {Number(selectedLead.postersPending ?? (selectedLead.postersStatus === 'Completed' ? 0 : selectedLead.postersRequired || 0))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Videos */}
                        {Number(selectedLead.videosRequired || 0) > 0 && (
                          <div className="flex justify-between items-center border-b border-gray-200/40 dark:border-slate-800/40 pb-2">
                            <div>
                              <span className="text-gray-700 dark:text-gray-300 text-xs font-bold block">Videos</span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">Status: {selectedLead.videosStatus || 'Pending'}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-gray-900 dark:text-white">
                                Total: {selectedLead.videosRequired || 0}
                              </span>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-0.5">
                                Completed: {Number(selectedLead.videosRequired || 0) - Number(selectedLead.videosPending ?? (selectedLead.videosStatus === 'Completed' ? 0 : selectedLead.videosRequired || 0))} | Pending: {Number(selectedLead.videosPending ?? (selectedLead.videosStatus === 'Completed' ? 0 : selectedLead.videosRequired || 0))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Ads */}
                        {Number(selectedLead.adsRequired || 0) > 0 && (
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-gray-700 dark:text-gray-300 text-xs font-bold block">Advertisements</span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">Status: {selectedLead.adsStatus || 'Pending'}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-gray-900 dark:text-white">
                                Total: {selectedLead.adsRequired || 0}
                              </span>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-0.5">
                                Completed: {Number(selectedLead.adsRequired || 0) - Number(selectedLead.adsPending ?? (selectedLead.adsStatus === 'Completed' ? 0 : selectedLead.adsRequired || 0))} | Pending: {Number(selectedLead.adsPending ?? (selectedLead.adsStatus === 'Completed' ? 0 : selectedLead.adsRequired || 0))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {!selectedLead.postersRequired && !selectedLead.videosRequired && !selectedLead.adsRequired && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 py-1">No core assets required</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2.5">
                        Selected Platforms
                      </h4>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedLead.platforms && selectedLead.platforms.length > 0 ? (
                          selectedLead.platforms.map((plat, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg border border-indigo-500/20">
                              {plat}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">None selected</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Creative Brief */}
                  <div>
                    <h4 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2.5">
                      Creative & Project Planning
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-950/20 p-4 rounded-xl border border-gray-100 dark:border-slate-800/40">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Brand Colors:</span>
                        <span className="font-mono text-gray-900 dark:text-white font-medium">{selectedLead.brandColors || '—'}</span>
                        {selectedLead.brandColors && (
                          <span 
                            className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-700 inline-block shadow-sm"
                            style={{ backgroundColor: selectedLead.brandColors }}
                          />
                        )}
                      </div>
                      <div><span className="text-gray-400">Competitors:</span> <span className="text-gray-900 dark:text-white font-medium">{selectedLead.competitors || '—'}</span></div>
                      <div><span className="text-gray-400">Ad Budget:</span> <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedLead.adBudget ? `₹${selectedLead.adBudget}` : '—'}</span></div>
                      <div><span className="text-gray-400">Start Date:</span> <span className="text-gray-900 dark:text-white font-medium">{selectedLead.startDate || '—'}</span></div>
                      <div><span className="text-gray-400">Delivery Deadline:</span> <span className="text-gray-900 dark:text-white font-medium">{selectedLead.deliveryDeadline || '—'}</span></div>
                      <div className="md:col-span-2 mt-1">
                        <span className="text-gray-400 block mb-1">Target Audience:</span>
                        <p className="text-gray-900 dark:text-white bg-white/60 dark:bg-slate-900/40 p-2.5 rounded-lg border border-gray-200/50 dark:border-slate-800/40">
                          {selectedLead.targetAudience || '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Special Notes */}
                  {selectedLead.notes && (
                    <div>
                      <h4 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                        Notes & Instructions
                      </h4>
                      <p className="p-3.5 bg-yellow-500/5 dark:bg-yellow-500/2 border border-yellow-500/20 text-yellow-900 dark:text-yellow-300 rounded-xl leading-relaxed">
                        {selectedLead.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-5 border-t border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-900/30 flex justify-end">
                  <Button onClick={() => setSelectedLead(null)} variant="outline" size="sm">
                    Close View
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/50 dark:border-slate-800/50 pb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" /> Admin Control Dashboard
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            System Administration Portal
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && setNotifications) {
                  setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                }
              }}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white/50 hover:bg-white/80 dark:bg-slate-950/30 dark:hover:bg-slate-950/60 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-sm relative"
              title="Activity Alerts"
            >
              <Bell className="w-4.5 h-4.5" />
              {notifications.filter(n => n.unread).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-950 animate-ping" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3.5 border-b border-gray-100 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Recent Activity</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-850">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400">
                        No recent activity alerts.
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <div key={notif.id} className="p-3 text-xs hover:bg-slate-500/3 dark:hover:bg-slate-500/1 transition-colors">
                          <p className="text-gray-700 dark:text-gray-300 leading-normal">{notif.message}</p>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-1">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logout();
              onAddToast('Sign Out Success', 'Admin session terminated.', 'info');
            }}
            icon={LogOut}
          >
            Sign Out Admin
          </Button>
        </div>
      </div>

      {/* 6-Card Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-indigo-500/5">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Clients</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{totalClientsCount}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-blue-500/5">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Representatives</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{totalRepsCount}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-pink-500/5">
          <div className="p-3 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pending Sync</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{totalPendingCount}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-amber-500/5">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">Pending Serv.</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{totalPendingServices}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-indigo-500/5">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">In Progress</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{totalInProgressServices}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-emerald-500/5">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">Completed</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{totalCompletedServices}</p>
          </div>
        </div>
      </div>

      {/* SVG Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Lead Intake Trend */}
        <Card title="Lead Intake Trend" subtitle="Daily lead submissions over the last 7 days">
          <div className="relative pt-2 h-44 w-full">
            {intakeData && intakeData.length > 0 ? (
              (() => {
                const width = 500;
                const height = 140;
                const paddingX = 40;
                const paddingY = 20;
                const chartWidth = width - paddingX * 2;
                const chartHeight = height - paddingY * 2;
                const maxVal = Math.max(...intakeData.map(d => d.value), 4);

                const points = intakeData.map((d, idx) => {
                  const x = paddingX + (idx / (intakeData.length - 1)) * chartWidth;
                  const y = height - paddingY - (d.value / maxVal) * chartHeight;
                  return { x, y, label: d.name, value: d.value };
                });

                const linePath = points.reduce((acc, p, idx) => {
                  return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
                }, '');

                const areaPath = points.length > 0
                  ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
                  : '';

                return (
                  <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="intakeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                      const yVal = paddingY + ratio * chartHeight;
                      return (
                        <line
                          key={index}
                          x1={paddingX}
                          y1={yVal}
                          x2={width - paddingX}
                          y2={yVal}
                          className="stroke-gray-150/40 dark:stroke-slate-800/40"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                      );
                    })}

                    {/* Area Path */}
                    {areaPath && (
                      <path
                        d={areaPath}
                        fill="url(#intakeAreaGrad)"
                      />
                    )}

                    {/* Line Path */}
                    {linePath && (
                      <path
                        d={linePath}
                        fill="none"
                        className="stroke-indigo-650 dark:stroke-indigo-400"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Circles & Tooltips */}
                    {points.map((p, idx) => (
                      <g key={idx} className="group/dot cursor-pointer">
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          className="fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900"
                          strokeWidth="1.5"
                        />
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="8"
                          className="fill-indigo-500/20 opacity-0 group-hover/dot:opacity-100 transition-opacity"
                        />
                        
                        {/* Custom label/value on hover */}
                        <text
                          x={p.x}
                          y={p.y - 10}
                          textAnchor="middle"
                          className="text-[9px] font-bold fill-indigo-600 dark:fill-indigo-400 opacity-0 group-hover/dot:opacity-100 transition-opacity"
                        >
                          {p.value}
                        </text>
                      </g>
                    ))}

                    {/* Axis Labels */}
                    {points.map((p, idx) => (
                      <text
                        key={idx}
                        x={p.x}
                        y={height - 5}
                        textAnchor="middle"
                        className="text-[8px] font-bold fill-gray-400 dark:fill-gray-500"
                      >
                        {p.label}
                      </text>
                    ))}
                  </svg>
                );
              })()
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">
                No trend data available.
              </div>
            )}
          </div>
        </Card>

        {/* Chart 2: Representative Activity */}
        <Card title="Salesforce Performance" subtitle="Total leads vs completed deliverables by rep">
          <div className="relative pt-2 h-44 w-full">
            {repStats && repStats.length > 0 ? (
              (() => {
                const width = 500;
                const height = 140;
                const paddingX = 40;
                const paddingY = 20;
                const chartWidth = width - paddingX * 2;
                const chartHeight = height - paddingY * 2;
                const maxVal = Math.max(...repStats.map(r => r.total), 4);

                const barGroupWidth = chartWidth / repStats.length;
                const barWidth = Math.max(6, Math.min(12, barGroupWidth * 0.25));

                return (
                  <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                      const yVal = paddingY + ratio * chartHeight;
                      return (
                        <line
                          key={index}
                          x1={paddingX}
                          y1={yVal}
                          x2={width - paddingX}
                          y2={yVal}
                          className="stroke-gray-150/40 dark:stroke-slate-800/40"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                      );
                    })}

                    {/* Bars */}
                    {repStats.map((rep, idx) => {
                      const groupCenterX = paddingX + idx * barGroupWidth + barGroupWidth / 2;
                      const x1 = groupCenterX - barWidth - 1.5;
                      const x2 = groupCenterX + 1.5;

                      const barHeightTotal = (rep.total / maxVal) * chartHeight;
                      const barHeightSubmitted = (rep.submitted / maxVal) * chartHeight;

                      const yTotal = height - paddingY - barHeightTotal;
                      const ySubmitted = height - paddingY - barHeightSubmitted;

                      return (
                        <g key={idx} className="group/bar cursor-pointer">
                          {/* Total Leads Bar */}
                          <rect
                            x={x1}
                            y={yTotal}
                            width={barWidth}
                            height={Math.max(2, barHeightTotal)}
                            rx="1.5"
                            className="fill-indigo-500/80 group-hover/bar:fill-indigo-500"
                          />
                          {/* Synced Leads Bar */}
                          <rect
                            x={x2}
                            y={ySubmitted}
                            width={barWidth}
                            height={Math.max(2, barHeightSubmitted)}
                            rx="1.5"
                            className="fill-emerald-500/80 group-hover/bar:fill-emerald-500"
                          />

                          {/* Tooltip labels */}
                          <text
                            x={groupCenterX}
                            y={Math.min(yTotal, ySubmitted) - 6}
                            textAnchor="middle"
                            className="text-[8px] font-bold fill-gray-650 dark:fill-gray-300 opacity-0 group-hover/bar:opacity-100 transition-opacity"
                          >
                            T:{rep.total} | S:{rep.submitted}
                          </text>

                          {/* Rep Name Label */}
                          <text
                            x={groupCenterX}
                            y={height - 4}
                            textAnchor="middle"
                            className="text-[8px] font-bold fill-gray-400 dark:fill-gray-500"
                          >
                            {rep.name.length > 8 ? rep.name.substring(0, 7) + '..' : rep.name}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                );
              })()
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">
                No salesperson records registered.
              </div>
            )}
          </div>
        </Card>

        {/* Chart 3: Service Completion Rate */}
        <Card title="Asset Portfolio Health" subtitle="Global service asset milestone ratios">
          <div className="flex items-center justify-between gap-2 h-44 pt-2">
            {/* Concentric rings SVG */}
            <div className="relative w-28 h-28 shrink-0">
              {(() => {
                const totalServices = totalPendingServices + totalInProgressServices + totalCompletedServices;
                const completedPct = totalServices > 0 ? (totalCompletedServices / totalServices) : 0;
                const inProgressPct = totalServices > 0 ? (totalInProgressServices / totalServices) : 0;
                const pendingPct = totalServices > 0 ? (totalPendingServices / totalServices) : 0;

                const c1 = 2 * Math.PI * 36;
                const c2 = 2 * Math.PI * 28;
                const c3 = 2 * Math.PI * 20;

                return (
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Ring 1 background */}
                    <circle cx="50" cy="50" r="36" className="text-gray-100 dark:text-slate-800" strokeWidth="5.5" stroke="currentColor" fill="none" />
                    {/* Ring 1 foreground */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="36" 
                      className="text-emerald-500 transition-all duration-700" 
                      strokeWidth="5.5" 
                      strokeDasharray={c1}
                      strokeDashoffset={c1 * (1 - completedPct)}
                      strokeLinecap="round"
                      stroke="currentColor" 
                      fill="none" 
                    />

                    {/* Ring 2 background */}
                    <circle cx="50" cy="50" r="28" className="text-gray-100 dark:text-slate-800" strokeWidth="5.5" stroke="currentColor" fill="none" />
                    {/* Ring 2 foreground */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="28" 
                      className="text-indigo-500 transition-all duration-700" 
                      strokeWidth="5.5" 
                      strokeDasharray={c2}
                      strokeDashoffset={c2 * (1 - inProgressPct)}
                      strokeLinecap="round"
                      stroke="currentColor" 
                      fill="none" 
                    />

                    {/* Ring 3 background */}
                    <circle cx="50" cy="50" r="20" className="text-gray-100 dark:text-slate-800" strokeWidth="5.5" stroke="currentColor" fill="none" />
                    {/* Ring 3 foreground */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="20" 
                      className="text-amber-500 transition-all duration-700" 
                      strokeWidth="5.5" 
                      strokeDasharray={c3}
                      strokeDashoffset={c3 * (1 - pendingPct)}
                      strokeLinecap="round"
                      stroke="currentColor" 
                      fill="none" 
                    />
                  </svg>
                );
              })()}
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-widest leading-none">Deliver.</span>
                <span className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">
                  {totalCompletedServices + totalInProgressServices + totalPendingServices}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2 text-xs font-semibold text-gray-650 dark:text-gray-450 pr-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate flex-1">Completed</span>
                <span className="font-bold text-gray-900 dark:text-white shrink-0">{totalCompletedServices}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                <span className="truncate flex-1">In Progress</span>
                <span className="font-bold text-gray-900 dark:text-white shrink-0">{totalInProgressServices}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="truncate flex-1">Pending</span>
                <span className="font-bold text-gray-900 dark:text-white shrink-0">{totalPendingServices}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Service-Specific Table Grid */}
      <Card title="Marketing Campaign Services Summary" subtitle="Granular counts across all required campaign assets">
        <div className="overflow-x-auto border border-gray-100 dark:border-slate-800/60 rounded-xl">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800/60">
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Service Category</th>
                <th className="p-3 font-semibold text-center text-amber-600 dark:text-amber-400">Pending</th>
                <th className="p-3 font-semibold text-center text-indigo-600 dark:text-indigo-400">In Progress</th>
                <th className="p-3 font-semibold text-center text-emerald-600 dark:text-emerald-400">Completed</th>
                <th className="p-3 font-semibold text-center text-gray-700 dark:text-gray-300">Total Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-750 dark:text-gray-350 font-medium">
              {[
                { name: 'Posters Delivery', pending: totalPostersPending, inProgress: totalPostersInProgress, completed: totalPostersCompleted },
                { name: 'Video Production', pending: totalVideosPending, inProgress: totalVideosInProgress, completed: totalVideosCompleted },
                { name: 'Ad Campaigns', pending: totalAdsPending, inProgress: totalAdsInProgress, completed: totalAdsCompleted },
                { name: 'Website Development', pending: totalWebsitePending, inProgress: totalWebsiteInProgress, completed: totalWebsiteCompleted }
              ].map((row, idx) => {
                const total = row.pending + row.inProgress + row.completed;
                return (
                  <tr key={idx} className="hover:bg-indigo-500/3 dark:hover:bg-indigo-500/1 transition-colors">
                    <td className="p-3 font-bold text-gray-900 dark:text-white">{row.name}</td>
                    <td className="p-3 text-center text-amber-600 dark:text-amber-400 font-bold">{row.pending}</td>
                    <td className="p-3 text-center text-indigo-600 dark:text-indigo-400 font-bold">{row.inProgress}</td>
                    <td className="p-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">{row.completed}</td>
                    <td className="p-3 text-center text-gray-900 dark:text-white font-extrabold">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Main Roster Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Salespersons Roster */}
        <div className="lg:col-span-2">
          <Card title="Salesforce Directory" subtitle="Inspect client brief portfolios compiled by representatives">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 border-b border-gray-100 dark:border-slate-800/40 pb-4">
              <span className="text-xs text-gray-400 font-medium">Select representative to view active portfolio</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRep('All')}
                icon={Users}
              >
                Inspect All System Leads ({leads.length})
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {repStats.map((rep, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedRep(rep.name)}
                  className="p-5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white/40 hover:bg-white/80 dark:bg-slate-950/20 dark:hover:bg-slate-950/40 transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] hover:shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8.5 h-8.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                        {rep.name.charAt(0).toUpperCase()}
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {rep.name}
                      </h4>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                  </div>

                  <div className="grid grid-cols-4 text-center border-t border-gray-150/40 dark:border-slate-800/40 pt-3.5 mt-4 text-[10px] font-semibold text-gray-400">
                    <div>
                      <span className="block text-gray-550 dark:text-gray-400 text-xs font-bold">{rep.total}</span>
                      Total
                    </div>
                    <div>
                      <span className="block text-emerald-500 text-xs font-bold">{rep.completed}</span>
                      Done
                    </div>
                    <div>
                      <span className="block text-indigo-500 text-xs font-bold">{rep.inProgress}</span>
                      Active
                    </div>
                    <div>
                      <span className="block text-amber-500 text-xs font-bold">{rep.pending}</span>
                      Pending
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Add Salesperson & Configuration Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card title="Register Representative" subtitle="Create new salesperson profile accounts dynamically">
            <form onSubmit={handleCreateRep} className="space-y-4">
              <Input
                label="Salesperson Name"
                placeholder="Enter full name"
                required
                icon={UserPlus}
                value={newRepName}
                onChange={(e) => setNewRepName(e.target.value)}
              />
              <Input
                label="Username"
                placeholder="Enter username (e.g. tharun)"
                required
                value={newRepUsername}
                onChange={(e) => setNewRepUsername(e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter password (e.g. sales123)"
                required
                value={newRepPassword}
                onChange={(e) => setNewRepPassword(e.target.value)}
              />
              
              <Button
                type="submit"
                variant="primary"
                className="w-full"
              >
                Add Account
              </Button>
            </form>
          </Card>

          <Card title="Sheets Integration" subtitle="Configure the Google Apps Script Web App endpoint">
            <div className="space-y-4">
              <Input
                label="Apps Script Web App URL"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={localUrl}
                onChange={(e) => setLocalUrl(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsHelpOpen(true)}
                  icon={HelpCircle}
                >
                  Setup Guide
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={async () => {
                    try {
                      const res = await authFetch('/api/config/sheets-url', {
                        method: 'POST',
                        body: JSON.stringify({ url: localUrl })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setAppsScriptUrl(data.url);
                        onAddToast('Integration Saved', 'Google Sheets endpoint updated successfully.', 'success');
                      } else {
                        onAddToast('Save Failed', 'Failed to update Google Sheets endpoint.', 'error');
                      }
                    } catch (error) {
                      console.error('Save error:', error);
                      onAddToast('Save Failed', 'Network error while updating integration URL.', 'error');
                    }
                  }}
                >
                  Save URL
                </Button>
              </div>
            </div>
          </Card>
        </div>

      </div>

      <AppsScriptGuide 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
      />

    </div>
  );
}
