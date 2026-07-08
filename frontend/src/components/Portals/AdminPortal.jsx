import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
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
  Bell,
  Trash2,
  KeyRound,
  Sliders,
  AlertCircle,
  Edit3,
  BarChart3,
  Sheet,
  ExternalLink
} from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { Input } from '../UI/Input';
import AppsScriptGuide from '../Help/AppsScriptGuide';
import { useAuth } from '../../context/AuthContext';
import ClientChat from '../UI/ClientChat';

const getTeamDisplayLabel = (assignedTeam) => {
  if (!assignedTeam) return 'Not Assigned';
  if (assignedTeam === 'all') return 'All Teams';
  if (Array.isArray(assignedTeam)) {
    if (assignedTeam.includes('all')) return 'All Teams';
    if (assignedTeam.length === 0) return 'Not Assigned';
    const names = assignedTeam.map(t => {
      if (t === 'design') return 'Designing';
      if (t === 'developer') return 'Developer';
      if (t === 'ads') return 'Ads';
      return t;
    });
    if (names.includes('Designing') && names.includes('Developer') && names.includes('Ads')) {
      return 'All Teams';
    }
    return names.join(', ') + ' Team';
  }
  if (assignedTeam === 'design') return 'Designing Team';
  if (assignedTeam === 'developer') return 'Developer Team';
  if (assignedTeam === 'ads') return 'Ads Team';
  return assignedTeam;
};

const hasTeamVal = (teamVal, team) => {
  if (!teamVal) return false;
  if (Array.isArray(teamVal)) return teamVal.includes(team) || teamVal.includes('all');
  return teamVal === team || teamVal === 'all';
};

const getStatusLabel = (status, team) => {
  if (status === 'Allocated') {
    if (!team) return 'Assigned to Specific Team';
    const label = getTeamDisplayLabel(team);
    if (label === 'Not Assigned') return 'Assigned to Specific Team';
    return `Assigned to ${label}`;
  }
  return status || 'Non-Allocated';
};

const getPerTeamStatusBadges = (lead) => {
  const teams = lead.assignedTeam;
  if (!teams) return null;
  const teamList = Array.isArray(teams)
    ? teams
    : teams === 'all' ? ['design', 'developer', 'ads'] : [teams];
  const entries = [];
  if (teamList.includes('ads') || teamList.includes('all')) {
    entries.push({ label: 'Ads Team', status: lead.adsTeamStatus || 'Pending' });
  }
  if (teamList.includes('design') || teamList.includes('all')) {
    entries.push({ label: 'Design Team', status: lead.designTeamStatus || 'Pending' });
  }
  if (teamList.includes('developer') || teamList.includes('all')) {
    entries.push({ label: 'Dev Team', status: lead.devTeamStatus || 'Pending' });
  }
  return entries.length > 0 ? entries : null;
};

const checkDeadlineAlert = (deadlineStr, workflowStatus) => {
  if (workflowStatus === 'Completed') return null;
  if (!deadlineStr) return null;
  const deadlineDate = new Date(deadlineStr);
  if (isNaN(deadlineDate.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(deadlineDate);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Format deadline date as DD/MM/YYYY for display
  const formattedDate = deadline.toLocaleDateString('en-GB');

  if (diffDays === 0) {
    return {
      type: 'today',
      label: 'Due Today',
      date: null,
      color: 'text-rose-600 dark:text-rose-400 font-bold',
      dotColor: 'bg-rose-500'
    };
  } else if (diffDays < 0) {
    return {
      type: 'overdue',
      label: 'Due Day',
      date: formattedDate,
      color: 'text-rose-600 dark:text-rose-400 font-bold',
      dotColor: 'bg-rose-500'
    };
  } else if (diffDays <= 3) {
    return {
      type: 'approaching',
      label: 'Due Soon',
      date: formattedDate,
      color: 'text-amber-600 dark:text-amber-400 font-bold',
      dotColor: 'bg-amber-500'
    };
  }
  return null;
};

const getPaymentStatus = (lead) => {
  if (lead.paymentStatus) {
    if (lead.paymentStatus === 'Paid') {
      return { label: 'Fully Paid', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' };
    }
    if (lead.paymentStatus === 'Partial') {
      return { label: 'Partially Paid', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' };
    }
    return { label: 'Unpaid', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20' };
  }
  const plan = Number(lead.planAmount || 0);
  const advance = Number(lead.advanceAmount || 0);
  if (plan > 0 && advance >= plan) return { label: 'Fully Paid', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' };
  if (advance > 0 && advance < plan) return { label: 'Partially Paid', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' };
  return { label: 'Unpaid', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20' };
};

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
  const [selectedTech, setSelectedTech] = useState(null); // tech object | null
  const [newRepName, setNewRepName] = useState('');
  const [newRepUsername, setNewRepUsername] = useState('');
  const [newRepPassword, setNewRepPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [repToDelete, setRepToDelete] = useState(null);
  const [repToResetPassword, setRepToResetPassword] = useState(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [technicalList, setTechnicalList] = useState([]);
  const [newRepRole, setNewRepRole] = useState('salesperson');
  const [newRepTeam, setNewRepTeam] = useState('design');
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [assignToTechId, setAssignToTechId] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');

  // Employee editing states
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [editEmployeeName, setEditEmployeeName] = useState('');
  const [editEmployeeUsername, setEditEmployeeUsername] = useState('');
  const [editEmployeeRole, setEditEmployeeRole] = useState('salesperson');
  const [editEmployeeTeam, setEditEmployeeTeam] = useState('design');

  // Metrics modal states
  const [activeMetricsModal, setActiveMetricsModal] = useState(null);
  const [activeSummaryModal, setActiveSummaryModal] = useState(null);

  // Client Details modal states
  const [viewedClientId, setViewedClientId] = useState(null);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editedClientFields, setEditedClientFields] = useState({});

  // Relocated header config modals states
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

  // Sales Report modal state
  const [isSalesReportOpen, setIsSalesReportOpen] = useState(false);
  const [salesReportSearch, setSalesReportSearch] = useState('');
  const [salesReportSheetsLoading, setSalesReportSheetsLoading] = useState(false);
  const [repSearchQuery, setRepSearchQuery] = useState('');
  const [techSearchQuery, setTechSearchQuery] = useState('');
  const [editingAdvanceFor, setEditingAdvanceFor] = useState(null);
  const [editingAdvanceValue, setEditingAdvanceValue] = useState('');

  const [salesReportRepFilter, setSalesReportRepFilter] = useState('All');
  const [salesReportDateMode, setSalesReportDateMode] = useState('all'); // 'all' | 'monthly' | 'custom'
  const [salesReportMonth, setSalesReportMonth] = useState(new Date().getMonth() + 1);
  const [salesReportYear, setSalesReportYear] = useState(new Date().getFullYear());
  const [salesReportStartDate, setSalesReportStartDate] = useState('');
  const [salesReportEndDate, setSalesReportEndDate] = useState('');

  // Central Clients Management filter states
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState('All');
  const [clientTeamFilter, setClientTeamFilter] = useState('All');
  const [clientCreatedByFilter, setClientCreatedByFilter] = useState('All');
  const [clientAssignedToFilter, setClientAssignedToFilter] = useState('All');
  const [clientStartDateFilter, setClientStartDateFilter] = useState('');
  const [clientEndDateFilter, setClientEndDateFilter] = useState('');

  // Advanced filters state
  const [filterWorkflowStatus, setFilterWorkflowStatus] = useState('All');
  const [filterAssignedTeam, setFilterAssignedTeam] = useState('All');

  const isFirstLoadRef = React.useRef(true);

  const fetchData = async () => {
    const isFirst = isFirstLoadRef.current;
    if (isFirst) {
      setIsLoading(true);
    }
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

      const technicalRes = await authFetch('/api/auth/technical');
      if (technicalRes.ok) {
        const technicalData = await technicalRes.json();
        setTechnicalList(technicalData);
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
      if (isFirst) {
        setIsLoading(false);
        isFirstLoadRef.current = false;
      }
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCentralStatusChange = async (leadId, newStatus) => {
    try {
      const res = await authFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ workflowStatus: newStatus })
      });
      if (res.ok) {
        fetchData();
        onAddToast('Status Updated', `Updated workflow status to ${newStatus}.`, 'success');
        // if (onAddNotification) {
        //   onAddNotification(`Admin updated workflow status of client to ${newStatus}.`, 'update');
        // }
      }
    } catch (err) {
      console.error(err);
      onAddToast('Error', 'Failed to update client status.', 'error');
    }
  };

  const handleCentralTeamChange = async (leadId, newTeam) => {
    try {
      const res = await authFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          assignedTeam: newTeam || null,
          assignedTo: null,
          assignedToName: null,
          workflowStatus: newTeam ? 'Allocated' : 'Non-Allocated'
        })
      });
      if (res.ok) {
        fetchData();
        onAddToast('Assignment Updated', `Updated team assignment to ${newTeam ? newTeam.toUpperCase() : 'None'}.`, 'success');
        // if (onAddNotification) {
        //   onAddNotification(`Admin updated team assignment of client to ${newTeam || 'none'}.`, 'update');
        // }
      }
    } catch (err) {
      console.error(err);
      onAddToast('Error', 'Failed to update team assignment.', 'error');
    }
  };

  // Central Clients Management filter logic
  const filteredCentralClients = useMemo(() => {
    const q = clientSearchQuery.toLowerCase().trim();
    return leads.filter(lead => {
      if (q) {
        const nameMatch = (lead.clientName || '').toLowerCase().includes(q);
        const phoneMatch = (lead.mobileNumber || '').toLowerCase().includes(q);
        const idMatch = (lead.clientId || '').toLowerCase().includes(q);
        const createdByMatch = (lead.salespersonName || '').toLowerCase().includes(q);
        const businessMatch = (lead.companyName || '').toLowerCase().includes(q);
        const assignedToName = lead.assignedToName || '';
        const assignedTeamLabel = getTeamDisplayLabel(lead.assignedTeam);
        const assignedToMatch = assignedToName.toLowerCase().includes(q) || assignedTeamLabel.toLowerCase().includes(q);

        if (!nameMatch && !phoneMatch && !idMatch && !createdByMatch && !businessMatch && !assignedToMatch) return false;
      }

      if (clientStatusFilter !== 'All' && (lead.workflowStatus || 'Non-Allocated') !== clientStatusFilter) {
        return false;
      }

      if (clientTeamFilter !== 'All') {
        if (!hasTeamVal(lead.assignedTeam, clientTeamFilter)) {
          return false;
        }
      }

      if (clientCreatedByFilter !== 'All' && lead.salespersonName !== clientCreatedByFilter) {
        return false;
      }

      if (clientAssignedToFilter !== 'All') {
        if (clientAssignedToFilter === 'Unassigned') {
          if (lead.assignedDeveloper || lead.assignedDesigner || lead.assignedAdSpecialist || lead.assignedTo) {
            return false;
          }
        } else {
          const devId = (lead.assignedDeveloper?._id || lead.assignedDeveloper || '').toString();
          const designId = (lead.assignedDesigner?._id || lead.assignedDesigner || '').toString();
          const adsId = (lead.assignedAdSpecialist?._id || lead.assignedAdSpecialist || '').toString();
          const assignedToId = (lead.assignedTo?._id || lead.assignedTo || '').toString();
          if (devId !== clientAssignedToFilter && designId !== clientAssignedToFilter && adsId !== clientAssignedToFilter && assignedToId !== clientAssignedToFilter) {
            return false;
          }
        }
      }

      if (clientStartDateFilter) {
        const start = new Date(clientStartDateFilter);
        start.setHours(0, 0, 0, 0);
        const created = new Date(lead.createdAt || lead.timestamp);
        if (created < start) return false;
      }
      if (clientEndDateFilter) {
        const end = new Date(clientEndDateFilter);
        end.setHours(23, 59, 59, 999);
        const created = new Date(lead.createdAt || lead.timestamp);
        if (created > end) return false;
      }

      return true;
    });
  }, [leads, clientSearchQuery, clientStatusFilter, clientTeamFilter, clientCreatedByFilter, clientAssignedToFilter, clientStartDateFilter, clientEndDateFilter]);



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
  const totalEmployeesCount = salespersonsList.length + technicalList.length;
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

  let totalMetaPending = 0;
  let totalMetaInProgress = 0;
  let totalMetaCompleted = 0;

  let totalGooglePending = 0;
  let totalGoogleInProgress = 0;
  let totalGoogleCompleted = 0;

  let totalYoutubePending = 0;
  let totalYoutubeInProgress = 0;
  let totalYoutubeCompleted = 0;

  let totalLinkedinPending = 0;
  let totalLinkedinInProgress = 0;
  let totalLinkedinCompleted = 0;

  let totalGmbPending = 0;
  let totalGmbInProgress = 0;
  let totalGmbCompleted = 0;

  let totalSeoPending = 0;
  let totalSeoInProgress = 0;
  let totalSeoCompleted = 0;

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
    if (Number(lead.metaAdsPlanDuration || 0) > 0) {
      const s = lead.metaAdsCampaignStatus || 'Pending';
      if (s === 'Completed') totalMetaCompleted++;
      else if (s === 'In Progress') totalMetaInProgress++;
      else totalMetaPending++;
    }
    if (Number(lead.googleAdsPlanDuration || 0) > 0) {
      const s = lead.googleAdsCampaignStatus || 'Pending';
      if (s === 'Completed') totalGoogleCompleted++;
      else if (s === 'In Progress') totalGoogleInProgress++;
      else totalGooglePending++;
    }
    if (Number(lead.youtubeAdsPlanDuration || 0) > 0) {
      const s = lead.youtubeAdsCampaignStatus || 'Pending';
      if (s === 'Completed') totalYoutubeCompleted++;
      else if (s === 'In Progress') totalYoutubeInProgress++;
      else totalYoutubePending++;
    }
    if (Number(lead.linkedinAdsPlanDuration || 0) > 0) {
      const s = lead.linkedinAdsCampaignStatus || 'Pending';
      if (s === 'Completed') totalLinkedinCompleted++;
      else if (s === 'In Progress') totalLinkedinInProgress++;
      else totalLinkedinPending++;
    }
    if (lead.platforms && lead.platforms.includes('GMB')) {
      const s = lead.gmbCampaignStatus || 'Pending';
      if (s === 'Completed') totalGmbCompleted++;
      else if (s === 'In Progress') totalGmbInProgress++;
      else totalGmbPending++;
    }
    if (Number(lead.seoPlanDuration || 0) > 0) {
      const s = lead.seoCampaignStatus || 'Pending';
      if (s === 'Completed') totalSeoCompleted++;
      else if (s === 'In Progress') totalSeoInProgress++;
      else totalSeoPending++;
    }
  });

  const getSummaryClients = (categoryKey, status) => {
    return leads.filter(lead => {
      let isRequired = false;
      let currentStatus = 'Pending';

      switch (categoryKey) {
        case 'Posters Delivery':
          isRequired = Number(lead.postersRequired) > 0;
          currentStatus = lead.postersStatus || 'Pending';
          break;
        case 'Video Production':
          isRequired = Number(lead.videosRequired) > 0;
          currentStatus = lead.videosStatus || 'Pending';
          break;
        case 'Ad Campaigns':
          isRequired = Number(lead.adsRequired) > 0;
          currentStatus = lead.adsStatus || 'Pending';
          break;
        case 'Website Development':
          isRequired = !!lead.websiteRequired;
          currentStatus = lead.websiteStatus || 'Pending';
          break;
        case 'Meta Ad Campaign':
          isRequired = Number(lead.metaAdsPlanDuration || 0) > 0;
          currentStatus = lead.metaAdsCampaignStatus || 'Pending';
          break;
        case 'Google Ad Campaign':
          isRequired = Number(lead.googleAdsPlanDuration || 0) > 0;
          currentStatus = lead.googleAdsCampaignStatus || 'Pending';
          break;
        case 'YouTube Campaign':
          isRequired = Number(lead.youtubeAdsPlanDuration || 0) > 0;
          currentStatus = lead.youtubeAdsCampaignStatus || 'Pending';
          break;
        case 'LinkedIn Campaign':
          isRequired = Number(lead.linkedinAdsPlanDuration || 0) > 0;
          currentStatus = lead.linkedinAdsCampaignStatus || 'Pending';
          break;
        case 'GMB (Google Business Profile)':
          isRequired = lead.platforms && lead.platforms.includes('GMB');
          currentStatus = lead.gmbCampaignStatus || 'Pending';
          break;
        case 'SEO':
          isRequired = Number(lead.seoPlanDuration || 0) > 0;
          currentStatus = lead.seoCampaignStatus || 'Pending';
          break;
        default:
          break;
      }
      return isRequired && currentStatus === status;
    });
  };

  const handleSummaryCountClick = (categoryName, status) => {
    const matchingClients = getSummaryClients(categoryName, status);
    setActiveSummaryModal({
      categoryName,
      status,
      clients: matchingClients
    });
  };

  // Rep Stats Mapper
  const repStats = salespersonsList.map(rep => {
    const name = typeof rep === 'string' ? rep : rep.name;
    const id = typeof rep === 'string' ? null : rep._id;
    const username = typeof rep === 'string' ? '' : rep.username;
    const repLeads = leads.filter(l => l.salespersonName === name);
    const total = repLeads.length;
    const completed = repLeads.filter(l => getProjectStatus(l) === 'Completed').length;
    const inProgress = repLeads.filter(l => getProjectStatus(l) === 'In Progress').length;
    const pending = repLeads.filter(l => getProjectStatus(l) === 'Pending').length;
    const submitted = completed; // for compatibility
    return { id, name, username, total, completed, inProgress, pending, submitted };
  });

  const filteredRepStats = useMemo(() => {
    const q = repSearchQuery.toLowerCase().trim();
    if (!q) return repStats;
    return repStats.filter(rep => 
      (rep.name || '').toLowerCase().includes(q) || 
      (rep.username || '').toLowerCase().includes(q)
    );
  }, [repStats, repSearchQuery]);

  const filteredTechnicalList = useMemo(() => {
    const q = techSearchQuery.toLowerCase().trim();
    if (!q) return technicalList;
    return technicalList.filter(tech => 
      (tech.name || '').toLowerCase().includes(q) || 
      (tech.username || '').toLowerCase().includes(q) ||
      (tech.team || '').toLowerCase().includes(q)
    );
  }, [technicalList, techSearchQuery]);

  // Handle salesperson / staff account creation
  const handleCreateRep = async (e) => {
    e.preventDefault();
    const cleanName = newRepName.trim();
    const cleanUsername = newRepUsername.trim().toLowerCase();
    const cleanPassword = newRepPassword;

    if (!cleanName || !cleanUsername || !cleanPassword) {
      onAddToast('Validation Error', 'All fields (name, username, password) are required.', 'warning');
      return;
    }

    const checkExists = (list) => list.some(rep => {
      const name = typeof rep === 'string' ? rep : rep.name;
      const username = typeof rep === 'string' ? '' : rep.username;
      return name.toLowerCase() === cleanName.toLowerCase() || username.toLowerCase() === cleanUsername;
    });

    if (checkExists(salespersonsList) || checkExists(technicalList)) {
      onAddToast('Account Creation Blocked', `${cleanName} or username "${cleanUsername}" is already registered.`, 'warning');
      return;
    }

    try {
      const res = await authFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: cleanName,
          username: cleanUsername,
          password: cleanPassword,
          role: newRepRole,
          team: newRepRole === 'technical' ? newRepTeam : null
        })
      });

      const data = await res.json();

      if (res.ok) {
        onAddToast('Account Registered', `Registered ${cleanName} as ${newRepRole === 'salesperson' ? 'Sales' : 'Technical'} staff successfully.`, 'success');
        if (onAddNotification) {
          onAddNotification(`New staff profile "${cleanName}" (${newRepRole}) registered by Admin.`, 'assignment');
        }
        
        // Refresh appropriate lists
        const salespersonsRes = await authFetch('/api/auth/salespersons');
        if (salespersonsRes.ok) {
          const salespersonsData = await salespersonsRes.json();
          setSalespersonsList(salespersonsData);
        }
        const technicalRes = await authFetch('/api/auth/technical');
        if (technicalRes.ok) {
          const technicalData = await technicalRes.json();
          setTechnicalList(technicalData);
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

  // Handle representative deletion confirmation
  const handleDeleteRepConfirm = async () => {
    if (!repToDelete) return;
    try {
      const res = await authFetch(`/api/auth/salespersons/${repToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        onAddToast('Representative Deleted', `Successfully deleted representative ${repToDelete.name}.`, 'success');
        if (onAddNotification) {
          onAddNotification(`Representative "${repToDelete.name}" account was deleted by Admin.`, 'assignment');
        }
        await fetchData();
      } else {
        onAddToast('Deletion Failed', data.message || 'Error deleting representative.', 'error');
      }
    } catch (error) {
      console.error('Deletion error:', error);
      onAddToast('Deletion Failed', 'Network or server error during deletion.', 'error');
    } finally {
      setRepToDelete(null);
    }
  };

  // Handle representative password reset confirmation
  const handleResetPasswordConfirm = async (e) => {
    if (e) e.preventDefault();
    if (!repToResetPassword) return;
    const cleanPassword = resetPasswordInput;

    if (!cleanPassword || cleanPassword.length < 6) {
      onAddToast('Validation Error', 'Password must be at least 6 characters long.', 'warning');
      return;
    }

    try {
      const res = await authFetch(`/api/auth/salespersons/${repToResetPassword.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: cleanPassword })
      });
      const data = await res.json();
      if (res.ok) {
        onAddToast('Password Updated', `Successfully updated password for ${repToResetPassword.name}.`, 'success');
        if (onAddNotification) {
          onAddNotification(`Representative "${repToResetPassword.name}" password was reset by Admin.`, 'info');
        }
        setRepToResetPassword(null);
        setResetPasswordInput('');
      } else {
        onAddToast('Reset Failed', data.message || 'Error resetting password.', 'error');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      onAddToast('Reset Failed', 'Network or server error during password reset.', 'error');
    }
  };

  // Bulk assign leads to a technical staff member
  const handleBulkAssign = async () => {
    if (selectedLeadIds.length === 0 || !assignToTechId) return;
    const targetTechId = assignToTechId === 'unassign' ? null : assignToTechId;

    try {
      const res = await authFetch('/api/leads/assign', {
        method: 'PUT',
        body: JSON.stringify({
          leadIds: selectedLeadIds,
          assignedTo: targetTechId
        })
      });

      const data = await res.json();
      if (res.ok) {
        onAddToast('Tasks Assigned', `Successfully updated assignments for ${selectedLeadIds.length} card(s).`, 'success');
        // if (onAddNotification) {
        //   onAddNotification(`${selectedLeadIds.length} campaign task(s) updated by Admin.`, 'info');
        // }
        setSelectedLeadIds([]);
        setAssignToTechId('');
        await fetchData(); // refresh list
      } else {
        onAddToast('Assignment Failed', data.message || 'Error assigning leads.', 'error');
      }
    } catch (error) {
      console.error('Assignment error:', error);
      onAddToast('Assignment Failed', 'Network or server error during assignment.', 'error');
    }
  };

  const handleSelectLead = (leadId) => {
    setSelectedLeadIds(prev => 
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    );
  };

  const handleSelectAllLeads = (filteredLeads) => {
    const allFilteredIds = filteredLeads.map(l => l._id);
    const areAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedLeadIds.includes(id));

    if (areAllSelected) {
      setSelectedLeadIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedLeadIds(prev => {
        const newSelection = [...prev];
        allFilteredIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
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
      const ts = lead.createdAt || lead.timestamp;
      if (ts) {
        const dateStr = new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
        if (data[dateStr] !== undefined) {
          data[dateStr]++;
        }
      }
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  };
  const intakeData = getIntakeData();

  // Inspect leads for a salesperson or technical team member
  const inspectedLeads = useMemo(() => {
    if (selectedRep) {
      return selectedRep === 'All' ? leads : leads.filter(l => l.salespersonName === selectedRep);
    }
    if (selectedTech) {
      const techIdStr = selectedTech._id?.toString() || selectedTech.id?.toString();
      const techName = selectedTech.name;
      return leads.filter(l => 
        (l.assignedDeveloper && l.assignedDeveloper.toString() === techIdStr) ||
        (l.assignedDesigner && l.assignedDesigner.toString() === techIdStr) ||
        (l.assignedAdSpecialist && l.assignedAdSpecialist.toString() === techIdStr) ||
        (l.assignedToName && l.assignedToName.includes(techName)) ||
        l.assignedToName === techName
      );
    }
    return [];
  }, [leads, selectedRep, selectedTech]);

  const filteredInspectedLeads = useMemo(() => {
    return inspectedLeads.filter(lead => {
      // 1. Status filter
      if (filterWorkflowStatus !== 'All' && (lead.workflowStatus || 'Non-Allocated') !== filterWorkflowStatus) {
        return false;
      }

      // 2. Assigned Team filter
      if (filterAssignedTeam !== 'All') {
        if (!hasTeamVal(lead.assignedTeam, filterAssignedTeam)) {
          return false;
        }
      }

      return true;
    });
  }, [inspectedLeads, filterWorkflowStatus, filterAssignedTeam]);

  const filteredSalesReportLeads = useMemo(() => {
  return leads.filter(lead => {
    // 1. Client name / ID / business / phone search
    const q = salesReportSearch.toLowerCase().trim();
    if (q) {
      const match =
        (lead.clientId || '').toLowerCase().includes(q) ||
        (lead.clientName || '').toLowerCase().includes(q) ||
        (lead.companyName || '').toLowerCase().includes(q) ||
        (lead.salespersonName || '').toLowerCase().includes(q) ||
        (lead.mobileNumber || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    // 2. Salesperson filter
    if (salesReportRepFilter !== 'All' && lead.salespersonName !== salesReportRepFilter) {
      return false;
    }

    // 3. Date filter
    const createdAt = lead.createdAt ? new Date(lead.createdAt) : null;
    if (salesReportDateMode === 'monthly' && createdAt) {
      if (
        createdAt.getMonth() + 1 !== salesReportMonth ||
        createdAt.getFullYear() !== salesReportYear
      ) return false;
    }
    if (salesReportDateMode === 'custom') {
      if (salesReportStartDate && createdAt) {
        const start = new Date(salesReportStartDate);
        start.setHours(0, 0, 0, 0);
        if (createdAt < start) return false;
      }
      if (salesReportEndDate && createdAt) {
        const end = new Date(salesReportEndDate);
        end.setHours(23, 59, 59, 999);
        if (createdAt > end) return false;
      }
    }

    return true;
  });
}, [leads, salesReportSearch, salesReportRepFilter, salesReportDateMode, salesReportMonth, salesReportYear, salesReportStartDate, salesReportEndDate]);

  const salesReportTotals = useMemo(() => ({
    totalPlan: filteredSalesReportLeads.reduce((s, l) => s + Number(l.planAmount || 0), 0),
    totalPayable: filteredSalesReportLeads.reduce((s, l) => s + Number(l.pendingAmount || 0), 0),
  }), [filteredSalesReportLeads]);

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

  // ── SALES REPORT NON-HOOK HELPERS ─────────────────────────────────────────

  const getCampaignSchedule = (lead) => {
    const platforms = lead.platforms || [];
    const schedules = [];

    if (platforms.includes('Meta Ads') || lead.metaAdsPlanDuration > 0) {
      schedules.push({
        service: 'Meta Ads',
        start: lead.metaAdsStartDate || lead.planStartDate || '—',
        end: lead.metaAdsEndDate || lead.planEndDate || '—',
      });
    }
    if (platforms.includes('Google Ads') || lead.googleAdsPlanDuration > 0) {
      schedules.push({
        service: 'Google Ads',
        start: lead.googleAdsStartDate || lead.planStartDate || '—',
        end: lead.googleAdsEndDate || lead.planEndDate || '—',
      });
    }
    if (platforms.includes('YouTube Ads') || lead.youtubeAdsPlanDuration > 0) {
      schedules.push({
        service: 'YouTube Ads',
        start: lead.youtubeAdsStartDate || lead.planStartDate || '—',
        end: lead.youtubeAdsEndDate || lead.planEndDate || '—',
      });
    }
    if (platforms.includes('LinkedIn Ads') || lead.linkedinAdsPlanDuration > 0) {
      schedules.push({
        service: 'LinkedIn Ads',
        start: lead.linkedinAdsStartDate || '—',
        end: lead.linkedinAdsEndDate || '—',
      });
    }
    if (platforms.includes('SEO') || lead.seoPlanDuration > 0) {
      schedules.push({
        service: 'SEO',
        start: lead.seoStartDate || '—',
        end: lead.seoEndDate || '—',
      });
    }
    if (schedules.length === 0 && (lead.planStartDate || lead.startDate)) {
      schedules.push({
        service: 'Campaign',
        start: lead.planStartDate || lead.startDate || '—',
        end: lead.planEndDate || lead.deliveryDeadline || '—',
      });
    }
    return schedules;
  };

  // Builds the accurate list of deliverables owed to a client, matching exactly the
  // same "is this actually required" checks the Technical portal uses to decide
  // completion (postersRequired/videosRequired counts, per-platform plan durations,
  // and the GMB platform flag) — so this never shows a deliverable that isn't real.
  const getDeliverables = (lead) => {
    const items = [];

    if (lead.websiteRequired) {
      items.push({ label: 'Website', status: lead.websiteStatus || 'Pending' });
    }
    if (Number(lead.postersRequired || 0) > 0) {
      const total = Number(lead.postersRequired || 0);
      const pending = Number(lead.postersPending ?? total);
      const done = Math.max(0, total - pending);
      items.push({ label: `Posters ${done}/${total}`, status: lead.postersStatus || 'Pending' });
    }
    if (Number(lead.videosRequired || 0) > 0) {
      const total = Number(lead.videosRequired || 0);
      const pending = Number(lead.videosPending ?? total);
      const done = Math.max(0, total - pending);
      items.push({ label: `Videos ${done}/${total}`, status: lead.videosStatus || 'Pending' });
    }
    if (Number(lead.metaAdsPlanDuration || 0) > 0) {
      items.push({ label: 'Meta Ads', status: lead.metaAdsCampaignStatus || 'Pending' });
    }
    if (Number(lead.googleAdsPlanDuration || 0) > 0) {
      items.push({ label: 'Google Ads', status: lead.googleAdsCampaignStatus || 'Pending' });
    }
    if (Number(lead.youtubeAdsPlanDuration || 0) > 0) {
      items.push({ label: 'YouTube Ads', status: lead.youtubeAdsCampaignStatus || 'Pending' });
    }
    if (Number(lead.linkedinAdsPlanDuration || 0) > 0) {
      items.push({ label: 'LinkedIn Ads', status: lead.linkedinAdsCampaignStatus || 'Pending' });
    }
    if (Number(lead.seoPlanDuration || 0) > 0) {
      items.push({ label: 'SEO', status: lead.seoCampaignStatus || 'Pending' });
    }
    if (lead.platforms && lead.platforms.includes('GMB')) {
      items.push({ label: 'GMB', status: lead.gmbCampaignStatus || 'Pending' });
    }
    return items;
  };

  const getDeliverableBadgeColor = (status) => {
    if (status === 'Completed') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    if (status === 'In Progress') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
  };

  const handleSalesReportExcelDownload = () => {
    const rows = filteredSalesReportLeads.map(lead => {
      const schedules = getCampaignSchedule(lead);
      const scheduleStr = schedules.length > 0
        ? schedules.map(s => `${s.service}: ${s.start} → ${s.end}`).join(' | ')
        : '—';
      const deliverables = getDeliverables(lead);
      const deliverablesStr = deliverables.length > 0
        ? deliverables.map(d => `${d.label} (${d.status})`).join(' | ')
        : '—';
      return {
        'Client ID': lead.clientId || '—',
        'Created Date': lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN') : '—',
        'Created By': lead.salespersonName || '—',
        'Client Name': lead.clientName || '—',
        'Business Name': lead.companyName || '—',
        'Business Number': lead.mobileNumber || '—',
        'Plan Schedule': scheduleStr,
        'Deliverables': deliverablesStr,
        'Plan Amount (₹)': Number(lead.planAmount || 0),
        'Advance Amount (₹)': Number(lead.advanceAmount || 0),
        'Pending Amount (₹)': Number(lead.pendingAmount || 0),
      };
    });

    // Summary row
    rows.push({});
    rows.push({
      'Client ID': 'SUMMARY',
      'Created Date': '',
      'Created By': '',
      'Client Name': `Total Clients: ${filteredSalesReportLeads.length}`,
      'Business Name': '',
      'Business Number': '',
      'Plan Schedule': '',
      'Deliverables': '',
      'Plan Amount (₹)': salesReportTotals.totalPlan,
      'Advance Amount (₹)': '',
      'Pending Amount (₹)': salesReportTotals.totalPayable,
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
    XLSX.writeFile(wb, `sales_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleSaveAdvanceAmount = async (lead) => {
  const newAdvance = Number(editingAdvanceValue) || 0;
  const plan = Number(lead.planAmount || 0);
  const newPending = Math.max(0, plan - newAdvance);

  let newPaymentStatus = 'Unpaid';
  if (plan > 0 && newAdvance >= plan) newPaymentStatus = 'Paid';
  else if (newAdvance > 0 && newAdvance < plan) newPaymentStatus = 'Partial';

  try {
    const res = await authFetch(`/api/leads/${lead._id}`, {
      method: 'PUT',
      body: JSON.stringify({
        advanceAmount: newAdvance,
        pendingAmount: newPending,
        paymentStatus: newPaymentStatus
      })
    });

    if (res.ok) {
      onAddToast('Advance Updated', `Advance amount updated for ${lead.clientName}. Pending balance recalculated.`, 'success');
      setEditingAdvanceFor(null);
      setEditingAdvanceValue('');
      await fetchData();
    } else {
      const errData = await res.json();
      onAddToast('Update Failed', errData.message || 'Could not update advance amount.', 'error');
    }
  } catch (err) {
    console.error('Advance amount update error:', err);
    onAddToast('Update Failed', 'Network error updating advance amount.', 'error');
  }
};

  const handleSalesReportSheetsSync = async () => {
    if (!appsScriptUrl) {
      onAddToast('Sheets Not Configured', 'Please configure Google Sheets URL in Sheets Config first.', 'warning');
      return;
    }
    setSalesReportSheetsLoading(true);
    try {
      const payload = filteredSalesReportLeads.map(lead => {
        const schedules = getCampaignSchedule(lead);
        const scheduleStr = schedules.length > 0
          ? schedules.map(s => `${s.service}: ${s.start} → ${s.end}`).join(' | ')
          : '—';
        const deliverables = getDeliverables(lead);
        const deliverablesStr = deliverables.length > 0
          ? deliverables.map(d => `${d.label} (${d.status})`).join(' | ')
          : '—';
        return {
          clientId: lead.clientId || '—',
          createdDate: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN') : '—',
          createdBy: lead.salespersonName || '—',
          clientName: lead.clientName || '—',
          businessName: lead.companyName || '—',
          businessNumber: lead.mobileNumber || '—',
          planSchedule: scheduleStr,
          deliverables: deliverablesStr,
          planAmount: Number(lead.planAmount || 0),
          advanceAmount: Number(lead.advanceAmount || 0),
          pendingAmount: Number(lead.pendingAmount || 0),
        };
      });

      const res = await fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sales_report', data: payload })
      });
      onAddToast('Synced to Sheets', 'Sales report data sent to Google Sheets successfully.', 'success');
    } catch (err) {
      console.error(err);
      onAddToast('Sync Failed', 'Could not send data to Google Sheets. Check your Apps Script URL.', 'error');
    } finally {
      setSalesReportSheetsLoading(false);
    }
  };

  // ── END SALES REPORT HELPERS ───────────────────────────────────────────────

  // Export specific Salesperson's clients to CSV
  const handleExportRepCSV = () => {
    if (inspectedLeads.length === 0) return;

    const headers = [
      "Timestamp", "Salesperson Name", "Client Name", "Mobile Number", "Email",
      "Company Name", "Business Category", "Website URL", "Website Required", "Website Type", 
      "Facebook ID/Username", "Facebook Password", "Instagram ID/Username", "Instagram Password",
      "Posters (Total/Pending/Completed)", "Videos (Total/Pending/Completed)", 
      "Ads (Total/Pending/Completed)", "Website Status", "Website Pending", "Selected Platforms", 
      "Brand Colors", "Target Audience", "Competitors", "Plan Amount", "Advance Amount", "Pending Amount", "Ad Budget", "Start Date", "Delivery Deadline",
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
        lead.createdAt || lead.timestamp || '',
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
        lead.planAmount || 0,
        lead.advanceAmount || 0,
        lead.pendingAmount || 0,
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
    const exportName = selectedRep ? selectedRep : (selectedTech ? selectedTech.name : 'Leads');
    link.setAttribute('download', `leads_report_${exportName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // INSPECTING SPECIFIC SALESPERSON/TECHNICAL MEMBER BRIEFING
  if (selectedRep || selectedTech) {
    return (
      <div className="space-y-6">
        
        {/* Sub-Header */}
        <div className="flex items-center gap-3 border-b border-gray-200/50 dark:border-slate-800/50 pb-5">
          <button
            onClick={() => {
              setSelectedRep(null);
              setSelectedTech(null);
              setSearchTerm('');
            }}
            className="p-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white/50 hover:bg-white/80 dark:bg-slate-950/30 dark:hover:bg-slate-950/60 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedRep ? (selectedRep === 'All' ? 'All Leads' : `Portfolio: ${selectedRep}`) : `Tasks: ${selectedTech.name}`}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Reviewing {inspectedLeads.length} total client brief records
            </p>
          </div>
        </div>

        {/* Portfolio Registry Table */}
        <Card 
          title={selectedRep ? (selectedRep === 'All' ? 'All System Clients' : `${selectedRep}'s Clients`) : `${selectedTech.name}'s Assigned Tasks`} 
          subtitle="Double click or inspect any record to audit full client brief details"
        >
          {/* Common Filter Section */}
          <div className="flex flex-wrap items-center gap-4 mb-6 bg-slate-500/5 dark:bg-slate-500/2 border border-gray-150/40 dark:border-slate-800/40 p-4 rounded-2xl text-xs font-semibold animate-in fade-in duration-200">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" /> Filters:
            </span>
            
            <div className="flex flex-wrap items-center gap-4 flex-1">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-450 dark:text-gray-500 font-bold">Workflow Status:</span>
                <select
                  value={filterWorkflowStatus}
                  onChange={(e) => setFilterWorkflowStatus(e.target.value)}
                  className="rounded-xl border border-gray-200 dark:border-slate-805 py-1.5 px-3 text-xs bg-white dark:bg-slate-905 text-gray-905 dark:text-white cursor-pointer focus:border-indigo-500 outline-hidden"
                >
                  <option value="All">All Statuses</option>
                  <option value="Non-Allocated">Non-Allocated</option>
                  <option value="Allocated">Assigned to Specific Team</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Assigned Team Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-450 dark:text-gray-500 font-bold">Assigned Team:</span>
                <select
                  value={filterAssignedTeam}
                  onChange={(e) => setFilterAssignedTeam(e.target.value)}
                  className="rounded-xl border border-gray-200 dark:border-slate-805 py-1.5 px-3 text-xs bg-white dark:bg-slate-905 text-gray-905 dark:text-white cursor-pointer focus:border-indigo-500 outline-hidden"
                >
                  <option value="All">All Teams</option>
                  <option value="design">Designing Team</option>
                  <option value="developer">Developer Team</option>
                  <option value="ads">Ads Team</option>
                </select>
              </div>
            </div>

            {/* Actions Row */}
            <div className="flex gap-2 justify-end text-xs">
              {/* Reset Button */}
              {(filterWorkflowStatus !== 'All' || filterAssignedTeam !== 'All') && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setFilterWorkflowStatus('All');
                    setFilterAssignedTeam('All');
                  }}
                >
                  Reset Filters
                </Button>
              )}

              <Button
                variant="outline"
                size="xs"
                icon={Download}
                onClick={handleExportRepCSV}
                disabled={inspectedLeads.length === 0}
              >
                Export CSV Report
              </Button>
            </div>
          </div>

      {filteredInspectedLeads.length === 0 ? (
  <div className="text-center py-12 border border-dashed border-gray-200 dark:border-slate-800/80 rounded-xl bg-gray-50/30 dark:bg-slate-900/10">
    <Users className="w-10 h-10 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
      {inspectedLeads.length === 0 
        ? `${selectedRep ? (selectedRep === 'All' ? 'System' : selectedRep) : selectedTech.name} has no client records yet.` 
        : 'No client folders match the search query.'}
    </p>
  </div>
) : (
  <>
    {/* MOBILE / TABLET: Card layout (hidden on lg and up) */}
    <div className="lg:hidden space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
      {filteredInspectedLeads.map((lead, idx) => {
        const sc = (s) => s === 'Completed'
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
          : s === 'In Progress'
            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
        const perTeam = getPerTeamStatusBadges(lead);
        const hasDesign = Number(lead.postersRequired || 0) > 0 || Number(lead.videosRequired || 0) > 0;
        const hasAds = Number(lead.adsRequired || 0) > 0;
        const hasDev = !!lead.websiteRequired;

        return (
          <div
            key={idx}
            className="p-4 rounded-2xl border border-gray-150 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/30 space-y-3"
          >
            {/* Header row: Client ID + Name + Action */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => {
                    setViewedClientId(lead._id);
                    setIsEditingClient(false);
                    setEditedClientFields({});
                  }}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer text-xs font-mono"
                >
                  {lead.clientId || 'N/A'}
                </button>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate mt-0.5">{lead.clientName}</h4>
                <p className="text-xs text-gray-400 dark:text-gray-555 truncate">{lead.email}</p>
              </div>
              <button
                onClick={() => setSelectedLead(lead)}
                className="p-2 rounded-lg hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 transition-colors shrink-0 cursor-pointer"
                title="Inspect Lead"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {/* Company + Representative */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[6px] text-gray-400 dark:text-gray-550 font-bold uppercase block">Company</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{lead.companyName || '—'}</span>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">{lead.businessCategory || '—'}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 dark:text-gray-550 font-bold uppercase block">Rep</span>
                <span className="text-indigo-650 dark:text-indigo-400 font-bold">{lead.salespersonName}</span>
              </div>
            </div>

            {/* Assignee */}
<div className="border-t border-gray-100 dark:border-slate-800/40 pt-2.5 space-y-1.5">
  <span className="text-[10px] text-gray-400 dark:text-gray-550 font-bold uppercase block">AssignedTo</span>
  {(() => {
    const teams = lead.assignedTeam;
    const teamList = !teams ? [] : Array.isArray(teams) ? teams : teams === 'all' ? ['design', 'developer', 'ads'] : [teams];
    const assignees = [];
    if (teamList.includes('ads') || teamList.includes('all')) assignees.push({ team: 'Ads', name: lead.assignedAdSpecialistName || null, color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' });
    if (teamList.includes('design') || teamList.includes('all')) assignees.push({ team: 'Design', name: lead.assignedDesignerName || null, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' });
    if (teamList.includes('developer') || teamList.includes('all')) assignees.push({ team: 'Dev', name: lead.assignedDeveloperName || null, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' });
    if (assignees.length === 0) return <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full text-xs font-bold inline-block">Not Assigned</span>;
    return (
      <div className="flex flex-col gap-1">
        {assignees.map((a, i) => (
          <span key={i} className={`px-2 py-0.5 rounded-md text-[10px] font-bold w-fit ${a.color}`}>
            {a.team}: {a.name || <span className="opacity-50 italic">Unclaimed</span>}
          </span>
        ))}
      </div>
    );
  })()}
</div>

            {/* Deliverables */}
            <div className="border-t border-gray-100 dark:border-slate-800/40 pt-2.5 space-y-1">
              <span className="text-[10px] text-gray-400 dark:text-gray-550 font-bold uppercase block mb-1">Deliverables</span>
              {(!selectedTech || selectedTech.team === 'design') && (
                <>
                  {Number(lead.postersRequired || 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-gray-650 dark:text-gray-400 font-medium text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span>Posters: </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {Number(lead.postersRequired || 0) - (Number(lead.postersPending ?? (lead.postersStatus === 'Completed' ? 0 : lead.postersRequired || 0)))} Comp / {Number(lead.postersPending ?? (lead.postersStatus === 'Completed' ? 0 : lead.postersRequired || 0))} Pend
                      </span>
                    </div>
                  )}
                  {Number(lead.videosRequired || 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-gray-650 dark:text-gray-400 font-medium text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span>Videos: </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {Number(lead.videosRequired || 0) - (Number(lead.videosPending ?? (lead.videosStatus === 'Completed' ? 0 : lead.videosRequired || 0)))} Comp / {Number(lead.videosPending ?? (lead.videosStatus === 'Completed' ? 0 : lead.videosRequired || 0))} Pend
                      </span>
                    </div>
                  )}
                </>
              )}
              {(!selectedTech || selectedTech.team === 'ads') && Number(lead.adsRequired || 0) > 0 && (
                <div className="flex items-center gap-1.5 text-gray-650 dark:text-gray-400 font-medium text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>Ads: </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {Number(lead.adsRequired || 0) - (Number(lead.adsPending ?? (lead.adsStatus === 'Completed' ? 0 : lead.adsRequired || 0)))} Comp / {Number(lead.adsPending ?? (lead.adsStatus === 'Completed' ? 0 : lead.adsRequired || 0))} Pend
                  </span>
                </div>
              )}
              {(!selectedTech || selectedTech.team === 'developer') && lead.websiteRequired && (
                <div className="flex items-center gap-1.5 text-gray-650 dark:text-gray-400 font-medium text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>Website: </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {lead.websiteStatus === 'Completed' ? '1' : '0'} Comp / {lead.websiteStatus === 'Completed' ? '0' : '1'} Pend ({lead.websiteStatus || 'Pending'})
                  </span>
                </div>
              )}
              {(() => {
                if (selectedTech) {
                  if (selectedTech.team === 'design' && !hasDesign) return <span className="text-gray-400 text-xs">—</span>;
                  if (selectedTech.team === 'ads' && !hasAds) return <span className="text-gray-400 text-xs">—</span>;
                  if (selectedTech.team === 'developer' && !hasDev) return <span className="text-gray-400 text-xs">—</span>;
                } else {
                  if (!hasDesign && !hasAds && !hasDev) return <span className="text-gray-400 text-xs">—</span>;
                }
                return null;
              })()}
            </div>

            {/* Workflow Status */}
            <div className="border-t border-gray-100 dark:border-slate-800/40 pt-2.5">
              <span className="text-[10px] text-gray-400 dark:text-gray-550 font-bold uppercase block mb-1.5">Status</span>
              {perTeam && (lead.workflowStatus === 'In Progress' || lead.workflowStatus === 'Completed' || lead.workflowStatus === 'Allocated') ? (
                <div className="flex flex-wrap gap-1">
                  {perTeam.map((t, i) => (
                    <span key={i} className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${sc(t.status)}`}>
                      {t.label}: {t.status}
                    </span>
                  ))}
                </div>
              ) : (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider inline-block ${
                  lead.workflowStatus === 'Completed'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : lead.workflowStatus === 'In Progress'
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                      : lead.workflowStatus === 'Allocated'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                }`}>
                  {getStatusLabel(lead.workflowStatus, lead.assignedTeam)}
                </span>
              )}
            </div>

            <div className="text-[10px] text-gray-400 dark:text-gray-550 pt-1">
              {(lead.createdAt || lead.timestamp) ? new Date(lead.createdAt || lead.timestamp).toLocaleString() : 'N/A'}
            </div>
          </div>
        );
      })}
    </div>

    {/* DESKTOP: Table layout (hidden below lg) */}
    <div className="hidden lg:block overflow-auto max-h-[500px] border border-gray-100 dark:border-slate-800/60 rounded-xl scrollbar-thin">
      <table className="w-full text-left text-sm border-collapse table-fixed">
        <colgroup>
  <col className="w-[9%]" />
  <col className="w-[11%]" />
  <col className="w-[13%]" />
  <col className="w-[10%]" />
  <col className="w-[15%]" />
  <col className="w-[11%]" />
  <col className="w-[13%]" />
  <col className="w-[14%]" />
  <col className="w-[4%]" />
</colgroup>
        <thead>
          <tr className="bg-gray-50/50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800/60 sticky top-0 z-10">
            <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Client ID</th>
            <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Client Contact</th>
            <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Company & Sector</th>
            <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Representative</th>
            <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Assigned To</th>
            <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Timestamp</th>
            <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Deliverables</th>
            <th className="p-3 font-bold text-center text-gray-700 dark:text-gray-300">Status</th>
            <th className="p-3 font-bold text-center text-gray-700 dark:text-gray-300">•</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40">
          {filteredInspectedLeads.map((lead, idx) => (
            <tr key={idx} className="hover:bg-indigo-500/5 dark:hover:bg-indigo-500/2 transition-colors align-top">
              <td className="p-3 truncate">
                <button
                  onClick={() => {
                    setViewedClientId(lead._id);
                    setIsEditingClient(false);
                    setEditedClientFields({});
                  }}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer truncate block"
                  title={lead.clientId}
                >
                  {lead.clientId || 'N/A'}
                </button>
              </td>
              <td className="p-3 font-medium text-gray-900 dark:text-white overflow-hidden ">
                <div className="truncate" title={lead.clientName}>{lead.clientName}</div>
                <div className="text-xs text-gray-400 dark:text-gray-555 " title={lead.email}>{lead.email}</div>
              </td>
              <td className="p-3 text-gray-650 dark:text-gray-300 overflow-hidden">
                <div className="text-xs" title={lead.companyName}>{lead.companyName || '—'}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 ">{lead.businessCategory || '—'}</div>
              </td>
              <td className="p-3 text-[12px] text-indigo-650 dark:text-indigo-400 font-medium " title={lead.salespersonName}>
                {lead.salespersonName}
              </td>
              <td className="p-3 text-xs overflow-hidden">
  {(() => {
    const teams = lead.assignedTeam;
    const teamList = !teams ? [] : Array.isArray(teams) ? teams : teams === 'all' ? ['design', 'developer', 'ads'] : [teams];
    const assignees = [];
    if (teamList.includes('ads') || teamList.includes('all')) assignees.push({ team: 'Ads', name: lead.assignedAdSpecialistName || null, color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' });
    if (teamList.includes('design') || teamList.includes('all')) assignees.push({ team: 'Design', name: lead.assignedDesignerName || null, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' });
    if (teamList.includes('developer') || teamList.includes('all')) assignees.push({ team: 'Dev', name: lead.assignedDeveloperName || null, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' });
    if (assignees.length === 0) return <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full text-[10px] font-bold">Not Assigned</span>;
    return (
      <div className="flex flex-col gap-1">
        {assignees.map((a, i) => (
          <span key={i} className={`px-2 py-0.5 rounded-md text-[10px] font-bold  ${a.color}`}>
            {a.team}: {a.name || <span className="opacity-50 italic">Unclaimed</span>}
          </span>
        ))}
      </div>
    );
  })()}
</td>
              <td className="p-3 text-xs text-gray-400 dark:text-gray-550">
                {(lead.createdAt || lead.timestamp) ? new Date(lead.createdAt || lead.timestamp).toLocaleString() : 'N/A'}
              </td>
              <td className="p-3 text-xs overflow-hidden">
                <div className="space-y-1">
                  {(!selectedTech || selectedTech.team === 'design') && (
                    <>
                      {Number(lead.postersRequired || 0) > 0 && (
                        <div className="flex items-center gap-1.5 text-gray-650 dark:text-gray-400 font-medium truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                          <span className="truncate">Posters: <span className="font-bold text-gray-900 dark:text-white">
                            {Number(lead.postersRequired || 0) - (Number(lead.postersPending ?? (lead.postersStatus === 'Completed' ? 0 : lead.postersRequired || 0)))}/{lead.postersRequired}
                          </span></span>
                        </div>
                      )}
                      {Number(lead.videosRequired || 0) > 0 && (
                        <div className="flex items-center gap-1.5 text-gray-650 dark:text-gray-400 font-medium truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                          <span className="truncate">Videos: <span className="font-bold text-gray-900 dark:text-white">
                            {Number(lead.videosRequired || 0) - (Number(lead.videosPending ?? (lead.videosStatus === 'Completed' ? 0 : lead.videosRequired || 0)))}/{lead.videosRequired}
                          </span></span>
                        </div>
                      )}
                    </>
                  )}
                  {(!selectedTech || selectedTech.team === 'ads') && Number(lead.adsRequired || 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-gray-650 dark:text-gray-400 font-medium truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span className="truncate">Ads: <span className="font-bold text-gray-900 dark:text-white">
                        {Number(lead.adsRequired || 0) - (Number(lead.adsPending ?? (lead.adsStatus === 'Completed' ? 0 : lead.adsRequired || 0)))}/{lead.adsRequired}
                      </span></span>
                    </div>
                  )}
                  {(!selectedTech || selectedTech.team === 'developer') && lead.websiteRequired && (
                    <div className="flex items-center gap-1.5 text-gray-650 dark:text-gray-400 font-medium truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span className="truncate">Web: <span className="font-bold text-gray-900 dark:text-white">{lead.websiteStatus || 'Pending'}</span></span>
                    </div>
                  )}
                  {(() => {
                    const hasDesign = Number(lead.postersRequired || 0) > 0 || Number(lead.videosRequired || 0) > 0;
                    const hasAds = Number(lead.adsRequired || 0) > 0;
                    const hasDev = !!lead.websiteRequired;
                    if (selectedTech) {
                      if (selectedTech.team === 'design' && !hasDesign) return <span className="text-gray-400">—</span>;
                      if (selectedTech.team === 'ads' && !hasAds) return <span className="text-gray-400">—</span>;
                      if (selectedTech.team === 'developer' && !hasDev) return <span className="text-gray-400">—</span>;
                    } else {
                      if (!hasDesign && !hasAds && !hasDev) return <span className="text-gray-400">—</span>;
                    }
                    return null;
                  })()}
                </div>
              </td>
              <td className="p-3 text-center">
                {(() => {
                  const sc = (s) => s === 'Completed'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : s === 'In Progress'
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                  const perTeam = getPerTeamStatusBadges(lead);
                  if (perTeam && (lead.workflowStatus === 'In Progress' || lead.workflowStatus === 'Completed' || lead.workflowStatus === 'Allocated')) {
                    return (
                      <div className="flex flex-col gap-0.5 items-start">
                        {perTeam.map((t, i) => (
                          <span key={i} className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${sc(t.status)}  `}>
                            {t.label}: {t.status}
                          </span>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider inline-block ${
                      lead.workflowStatus === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : lead.workflowStatus === 'In Progress'
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                          : lead.workflowStatus === 'Allocated'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    }`}>
                      {getStatusLabel(lead.workflowStatus, lead.assignedTeam)}
                    </span>
                  );
                })()}
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
  </>
)}

          {/* Details Modal */}
          {selectedLead && (
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-150 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800/80">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Lead Details Brief</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-550 mt-1">
                      Submitted by {selectedLead.salespersonName} on {new Date(selectedLead.createdAt || selectedLead.timestamp).toLocaleString()}
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
                      <div><span className="text-gray-400">Plan Amount:</span> <span className="text-gray-900 dark:text-white font-bold">{selectedLead.planAmount ? `₹${selectedLead.planAmount}` : '—'}</span></div>
                      <div><span className="text-gray-400">Advance Amount:</span> <span className="text-gray-900 dark:text-white font-bold">{selectedLead.advanceAmount ? `₹${selectedLead.advanceAmount}` : '—'}</span></div>
                      <div><span className="text-gray-400">Pending Amount:</span> <span className="text-amber-600 dark:text-amber-400 font-bold">{selectedLead.pendingAmount ? `₹${selectedLead.pendingAmount}` : '—'}</span></div>
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

                  {selectedLead.remarks && (
                    <div>
                      <h4 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                        Technical Progress Updates & Remarks
                      </h4>
                      <p className="p-3.5 bg-indigo-500/5 dark:bg-indigo-500/2 border border-indigo-500/20 text-indigo-900 dark:text-indigo-300 rounded-xl leading-relaxed">
                        {selectedLead.remarks}
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

        {/* Detailed Client Profile Editor Modal (shared with main Client Workflow view) */}
        {viewedClientId && (() => {
          const client = leads.find(l => l._id === viewedClientId);
          if (!client) return null;

          return (
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-[160] overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Client Profile & Edit Console
                      </h3>
                      <span className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                        ID: {client.clientId || 'N/A'}
                      </span>
                      {(() => {
                        const badge = getPaymentStatus({ ...client, ...editedClientFields });
                        return (
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${badge.color}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-550 mt-1">
                      Created by salesperson <strong className="text-indigo-650 dark:text-indigo-405">{client.salespersonName}</strong> on {new Date(client.createdAt || client.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setViewedClientId(null);
                        setIsEditingClient(false);
                        setEditedClientFields({});
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Content Form */}
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await handleSaveClientDetails();
                    setViewedClientId(null);
                  }} 
                  className="flex-1 overflow-y-auto p-6 space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    
                    {/* Left Column: Form Details (3/5 width) */}
                    <div className="lg:col-span-3 space-y-6">
                      {/* Contact Info Card */}
                      <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          1. Contact Information
                        </h4>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase">Client Name *</label>
                          <input 
                            type="text" 
                            required
                            value={editedClientFields.clientName ?? client.clientName ?? ''}
                            onChange={(e) => handleClientFieldChange('clientName', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase">Company Name</label>
                          <input 
                            type="text" 
                            value={editedClientFields.companyName ?? client.companyName ?? ''}
                            onChange={(e) => handleClientFieldChange('companyName', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">WhatsApp Mobile *</label>
                          <input 
                            type="text" 
                            required
                            value={editedClientFields.mobileNumber ?? client.mobileNumber ?? ''}
                            onChange={(e) => handleClientFieldChange('mobileNumber', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Email Address</label>
                          <input 
                            type="email" 
                            value={editedClientFields.email ?? client.email ?? ''}
                            onChange={(e) => handleClientFieldChange('email', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Social Media Access Card */}
                      <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          2. Social Channels Credentials
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">FB Page Status</label>
                            <select 
                              value={editedClientFields.facebookAccountStatus ?? client.facebookAccountStatus ?? 'Existing'}
                              onChange={(e) => handleClientFieldChange('facebookAccountStatus', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-2 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            >
                              <option value="Existing">Existing Account</option>
                              <option value="New">Create New Account</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Facebook ID</label>
                            <input 
                              type="text" 
                              value={editedClientFields.facebookId ?? client.facebookId ?? ''}
                              onChange={(e) => handleClientFieldChange('facebookId', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Facebook Password</label>
                            <input 
                              type="text" 
                              value={editedClientFields.facebookPassword ?? client.facebookPassword ?? ''}
                              onChange={(e) => handleClientFieldChange('facebookPassword', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">IG Page Status</label>
                            <select 
                              value={editedClientFields.instagramAccountStatus ?? client.instagramAccountStatus ?? 'Existing'}
                              onChange={(e) => handleClientFieldChange('instagramAccountStatus', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-2 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            >
                              <option value="Existing">Existing Account</option>
                              <option value="New">Create New Account</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Instagram ID</label>
                            <input 
                              type="text" 
                              value={editedClientFields.instagramId ?? client.instagramId ?? ''}
                              onChange={(e) => handleClientFieldChange('instagramId', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Instagram Password</label>
                            <input 
                              type="text" 
                              value={editedClientFields.instagramPassword ?? client.instagramPassword ?? ''}
                              onChange={(e) => handleClientFieldChange('instagramPassword', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Financials Card */}
                      <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          3. Financial Information
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Plan Amount (₹)</label>
                            <input 
                              type="number" 
                              min="0"
                              value={editedClientFields.planAmount ?? client.planAmount ?? 0}
                              onChange={(e) => handleClientFieldChange('planAmount', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Advance Amount (₹)</label>
                            <input 
                              type="number" 
                              min="0"
                              value={editedClientFields.advanceAmount ?? client.advanceAmount ?? 0}
                              onChange={(e) => handleClientFieldChange('advanceAmount', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase font-extrabold text-indigo-650 dark:text-indigo-405">Pending Balance (₹)</label>
                            <input 
                              type="number" 
                              min="0"
                              value={editedClientFields.pendingAmount ?? client.pendingAmount ?? 0}
                              onChange={(e) => handleClientFieldChange('pendingAmount', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white/70 dark:bg-slate-955/20 text-gray-900 dark:text-white font-bold"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Ad Budget (₹)</label>
                            <input 
                              type="number" 
                              min="0"
                              value={editedClientFields.adBudget ?? client.adBudget ?? 0}
                              onChange={(e) => handleClientFieldChange('adBudget', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Ad Budget/Day (₹)</label>
                            <input 
                              type="number" 
                              min="0"
                              value={editedClientFields.adBudgetPerDay ?? client.adBudgetPerDay ?? 0}
                              onChange={(e) => handleClientFieldChange('adBudgetPerDay', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase font-extrabold">Payment Status</label>
                            <select 
                              value={editedClientFields.paymentStatus ?? client.paymentStatus ?? 'Unpaid'}
                              onChange={(e) => handleClientFieldChange('paymentStatus', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-bold"
                            >
                              <option value="Unpaid">Unpaid</option>
                              <option value="Partial">Partially Paid</option>
                              <option value="Paid">Fully Paid</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Deliverables Card */}
                      <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          4. Requested Assets & Milestones
                        </h4>
                        
                        {/* Posters */}
                        <div className="border-b border-gray-100 dark:border-slate-800/40 pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Graphic Posters</span>
                            <select
                              value={editedClientFields.postersStatus ?? client.postersStatus ?? 'Pending'}
                              onChange={(e) => handleClientFieldChange('postersStatus', e.target.value)}
                              className="rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[10px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[9px] text-gray-400 uppercase">Total Req</label>
                              <input 
                                type="number" 
                                min="0"
                                value={editedClientFields.postersRequired ?? client.postersRequired ?? 0}
                                onChange={(e) => handleClientFieldChange('postersRequired', e.target.value)}
                                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] text-gray-400 uppercase">Pending</label>
                              <input 
                                type="number" 
                                min="0"
                                value={editedClientFields.postersPending ?? client.postersPending ?? 0}
                                onChange={(e) => handleClientFieldChange('postersPending', e.target.value)}
                                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Videos */}
                        <div className="border-b border-gray-100 dark:border-slate-800/40 pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Reels & Videos</span>
                            <select
                              value={editedClientFields.videosStatus ?? client.videosStatus ?? 'Pending'}
                              onChange={(e) => handleClientFieldChange('videosStatus', e.target.value)}
                              className="rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[10px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[9px] text-gray-400 uppercase">Total Req</label>
                              <input 
                                type="number" 
                                min="0"
                                value={editedClientFields.videosRequired ?? client.videosRequired ?? 0}
                                onChange={(e) => handleClientFieldChange('videosRequired', e.target.value)}
                                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] text-gray-400 uppercase">Pending</label>
                              <input 
                                type="number" 
                                min="0"
                                value={editedClientFields.videosPending ?? client.videosPending ?? 0}
                                onChange={(e) => handleClientFieldChange('videosPending', e.target.value)}
                                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Ads */}
                        <div className="border-b border-gray-100 dark:border-slate-800/40 pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Ads Campaigns</span>
                            <select
                              value={editedClientFields.adsStatus ?? client.adsStatus ?? 'Pending'}
                              onChange={(e) => handleClientFieldChange('adsStatus', e.target.value)}
                              className="rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[10px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[9px] text-gray-400 uppercase">Total Req</label>
                              <input 
                                type="number" 
                                min="0"
                                value={editedClientFields.adsRequired ?? client.adsRequired ?? 0}
                                onChange={(e) => handleClientFieldChange('adsRequired', e.target.value)}
                                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] text-gray-400 uppercase">Pending</label>
                              <input 
                                type="number" 
                                min="0"
                                value={editedClientFields.adsPending ?? client.adsPending ?? 0}
                                onChange={(e) => handleClientFieldChange('adsPending', e.target.value)}
                                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Website */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox"
                                checked={editedClientFields.websiteRequired ?? client.websiteRequired ?? false}
                                onChange={(e) => handleClientFieldChange('websiteRequired', e.target.checked)}
                                className="rounded border-gray-200 dark:border-slate-800 text-indigo-600"
                              />
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Website Development</span>
                            </div>
                            <select
                              value={editedClientFields.websiteStatus ?? client.websiteStatus ?? 'Pending'}
                              onChange={(e) => handleClientFieldChange('websiteStatus', e.target.value)}
                              className="rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[10px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[9px] text-gray-400 uppercase">Website Type</label>
                              <input 
                                type="text" 
                                value={editedClientFields.websiteType ?? client.websiteType ?? ''}
                                onChange={(e) => handleClientFieldChange('websiteType', e.target.value)}
                                placeholder="e.g. E-Commerce"
                                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] text-gray-400 uppercase">Pending Count</label>
                              <input 
                                type="number" 
                                min="0"
                                value={editedClientFields.websitePending ?? client.websitePending ?? 0}
                                onChange={(e) => handleClientFieldChange('websitePending', e.target.value)}
                                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Specifications Card */}
                      <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          5. Project Specifications
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase">Business Category</label>
                            <input 
                              type="text" 
                              value={editedClientFields.businessCategory ?? client.businessCategory ?? ''}
                              onChange={(e) => handleClientFieldChange('businessCategory', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Website URL</label>
                            <input 
                              type="text" 
                              value={editedClientFields.websiteUrl ?? client.websiteUrl ?? ''}
                              onChange={(e) => handleClientFieldChange('websiteUrl', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Start Date</label>
                            <input 
                              type="date" 
                              value={editedClientFields.startDate ?? client.startDate ?? ''}
                              onChange={(e) => handleClientFieldChange('startDate', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Delivery Deadline</label>
                            <input 
                              type="date" 
                              value={editedClientFields.deliveryDeadline ?? client.deliveryDeadline ?? ''}
                              onChange={(e) => handleClientFieldChange('deliveryDeadline', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Brand Colors (e.g. #ff0000, #0000ff)</label>
                          <div className="flex gap-2 items-center">
                            <input 
                              type="color" 
                              value={((editedClientFields.brandColors ?? client.brandColors ?? '').startsWith('#') && (editedClientFields.brandColors ?? client.brandColors ?? '').length === 7) ? (editedClientFields.brandColors ?? client.brandColors ?? '') : '#6366f1'}
                              onChange={(e) => handleClientFieldChange('brandColors', e.target.value)}
                              className="w-8 h-8 rounded border border-gray-200 dark:border-slate-800 shrink-0 bg-transparent"
                            />
                            <input 
                              type="text" 
                              value={editedClientFields.brandColors ?? client.brandColors ?? ''}
                              onChange={(e) => handleClientFieldChange('brandColors', e.target.value)}
                              className="flex-1 rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2 col-span-1">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase font-semibold">Audience Status</label>
                            <select 
                              value={editedClientFields.targetAudienceRequired ?? client.targetAudienceRequired ?? 'Required'}
                              onChange={(e) => handleClientFieldChange('targetAudienceRequired', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-2 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            >
                              <option value="Required">Required</option>
                              <option value="Not Required">Not Required</option>
                            </select>
                          </div>
                          <div className="space-y-2 col-span-2">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Target Audience Description</label>
                            <input 
                              type="text" 
                              value={editedClientFields.targetAudience ?? client.targetAudience ?? ''}
                              onChange={(e) => handleClientFieldChange('targetAudience', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Key Competitors</label>
                          <input 
                            type="text" 
                            value={editedClientFields.competitors ?? client.competitors ?? ''}
                            onChange={(e) => handleClientFieldChange('competitors', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Comments & Remarks Card */}
                      <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          6. Client Notes & Remarks
                        </h4>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Salesperson Client Notes</label>
                          <textarea 
                            value={editedClientFields.notes ?? client.notes ?? ''}
                            onChange={(e) => handleClientFieldChange('notes', e.target.value)}
                            rows="2"
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-y"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Internal Remarks (Admin/Team)</label>
                          <textarea 
                            value={editedClientFields.remarks ?? client.remarks ?? ''}
                            onChange={(e) => handleClientFieldChange('remarks', e.target.value)}
                            rows="2"
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-y font-medium"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Right Column: Collaboration Chat (2/5 width) */}
                    <div className="space-y-6 lg:col-span-2 flex flex-col justify-between">
                      <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-805 flex-1 flex flex-col">
                        <h4 className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider mb-2">
                          Collaboration Chat
                        </h4>
                        <ClientChat leadId={client._id || client.id} layout="stack" />
                      </div>
                    </div>
   
                  </div>

                  {/* CRM Assignment Control Section */}
                  <div className="bg-indigo-500/5 dark:bg-slate-900/40 p-4 rounded-xl border border-indigo-500/20 dark:border-slate-800/80 space-y-4">
                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      ⚙️ CRM Technical Assignment Console
                    </h4>
                    
                    {/* Assign to Team */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Assign to Team(s)</label>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-700 dark:text-gray-300 font-semibold mt-1">
                        {['design', 'developer', 'ads'].map((team) => {
                          const currentTeams = editedClientFields.assignedTeam ?? client.assignedTeam ?? [];
                          const isChecked = Array.isArray(currentTeams) 
                            ? currentTeams.includes(team) 
                            : currentTeams === team;
                          
                          return (
                            <label key={team} className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  let nextTeams = [];
                                  const baseTeams = Array.isArray(currentTeams) ? currentTeams : (currentTeams ? [currentTeams] : []);
                                  if (e.target.checked) {
                                    nextTeams = [...baseTeams, team];
                                  } else {
                                    nextTeams = baseTeams.filter(t => t !== team);
                                  }
                                  handleClientFieldChange('assignedTeam', nextTeams);
                                }}
                                className="rounded border-gray-200 dark:border-slate-800 text-indigo-650"
                              />
                              <span className="capitalize">{team === 'ads' ? 'Ads Campaign' : team === 'design' ? 'Graphic Design' : 'Developer'}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Assign to Individual Person */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                      {/* Developer Team */}
                      {(() => {
                        const currentTeams = editedClientFields.assignedTeam ?? client.assignedTeam ?? [];
                        const hasDev = Array.isArray(currentTeams) ? currentTeams.includes('developer') : currentTeams === 'developer';
                        if (!hasDev) return null;

                        const devsList = technicalList.filter(m => m.team === 'developer');
                        return (
                          <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-100">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Developer Specialist</label>
                            <select
                              value={editedClientFields.assignedDeveloper ?? client.assignedDeveloper ?? ''}
                              onChange={(e) => handleSpecialistChange('developer', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-2.5 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            >
                              <option value="">Select Developer (Unassigned)</option>
                              {devsList.map(dev => (
                                <option key={dev._id || dev.id} value={dev._id || dev.id}>{dev.name}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })()}

                      {/* Design Team */}
                      {(() => {
                        const currentTeams = editedClientFields.assignedTeam ?? client.assignedTeam ?? [];
                        const hasDesign = Array.isArray(currentTeams) ? currentTeams.includes('design') : currentTeams === 'design';
                        if (!hasDesign) return null;

                        const designersList = technicalList.filter(m => m.team === 'design');
                        return (
                          <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-100">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Designer Specialist</label>
                            <select
                              value={editedClientFields.assignedDesigner ?? client.assignedDesigner ?? ''}
                              onChange={(e) => handleSpecialistChange('design', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-2.5 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            >
                              <option value="">Select Designer (Unassigned)</option>
                              {designersList.map(designer => (
                                <option key={designer._id || designer.id} value={designer._id || designer.id}>{designer.name}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })()}

                      {/* Ads Team */}
                      {(() => {
                        const currentTeams = editedClientFields.assignedTeam ?? client.assignedTeam ?? [];
                        const hasAds = Array.isArray(currentTeams) ? currentTeams.includes('ads') : currentTeams === 'ads';
                        if (!hasAds) return null;

                        const adsList = technicalList.filter(m => m.team === 'ads');
                        return (
                          <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-100">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Ads Specialist</label>
                            <select
                              value={editedClientFields.assignedAdSpecialist ?? client.assignedAdSpecialist ?? ''}
                              onChange={(e) => handleSpecialistChange('ads', e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-2.5 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            >
                              <option value="">Select Ads Specialist (Unassigned)</option>
                              {adsList.map(ads => (
                                <option key={ads._id || ads.id} value={ads._id || ads.id}>{ads.name}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })()}
                    </div>

                  </div>

                  {/* Footer Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800/50">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setViewedClientId(null);
                        setIsEditingClient(false);
                        setEditedClientFields({});
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                    >
                      Save Client Profile
                    </Button>
                  </div>

                </form>

              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  const handleEditEmployeeConfirm = async (e) => {
    if (e) e.preventDefault();
    if (!employeeToEdit) return;

    if (!editEmployeeName || !editEmployeeName.trim()) {
      onAddToast('Validation Error', 'Name cannot be empty.', 'warning');
      return;
    }
    if (!editEmployeeUsername || !editEmployeeUsername.trim()) {
      onAddToast('Validation Error', 'Username cannot be empty.', 'warning');
      return;
    }

    try {
      const res = await authFetch(`/api/auth/salespersons/${employeeToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editEmployeeName,
          username: editEmployeeUsername,
          role: editEmployeeRole,
          team: editEmployeeRole === 'technical' ? editEmployeeTeam : null
        })
      });

      const data = await res.json();
      if (res.ok) {
        onAddToast('Account Updated', `Successfully updated profile for ${editEmployeeName}.`, 'success');
        if (onAddNotification) {
          onAddNotification(`Staff profile for "${editEmployeeName}" updated by Admin.`, 'info');
        }
        setEmployeeToEdit(null);
        await fetchData(); // refresh lists
      } else {
        onAddToast('Update Failed', data.message || 'Error updating employee details.', 'error');
      }
    } catch (error) {
      console.error('Employee update error:', error);
      onAddToast('Update Failed', 'Network or server error during employee update.', 'error');
    }
  };

const getMetricsModalTitleAndList = () => {
    switch (activeMetricsModal) {
      case 'total':
        return { title: 'Total Clients', list: leads };
      case 'non-allocated':
        return { title: 'Non-Allocated Clients', list: leads.filter(l => !l.assignedTeam) };
      case 'allocated':
        return { title: 'Allocated Clients', list: leads.filter(l => !!l.assignedTeam) };
      case 'claimed':
        return { title: 'Claimed Tasks', list: leads.filter(l => l.assignedTo !== null) };
      case 'in-progress':
        return { title: 'In-Progress Clients/Tasks', list: leads.filter(l => l.workflowStatus === 'In Progress') };
      case 'completed':
        return { title: 'Completed Clients/Tasks', list: leads.filter(l => l.workflowStatus === 'Completed') };
      default:
        return { title: '', list: [] };
    }
  };

const handleSaveClientDetails = async () => {
    if (!viewedClientId) return;
    const lead = leads.find(l => l._id === viewedClientId);
    if (!lead) return;

    try {
      const res = await authFetch(`/api/leads/${lead._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedClientFields)
      });

      const data = await res.json();
      if (res.ok) {
        onAddToast('Client Updated', 'Client records updated successfully.', 'success');
        // if (onAddNotification) {
        //   onAddNotification(`Admin updated client records for "${editedClientFields.clientName || lead.clientName}".`, 'update');
        // }
        setIsEditingClient(false);
        setEditedClientFields({});
        await fetchData(); // refresh list
      } else {
        onAddToast('Update Failed', data.message || 'Error updating client details.', 'error');
      }
    } catch (error) {
      console.error('Save client details error:', error);
      onAddToast('Update Failed', 'Network or server error during client details save.', 'error');
    }
  };

const handleClientFieldChange = (field, value) => {
    setEditedClientFields(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecialistChange = (teamKey, specialistId) => {
    const specialist = technicalList.find(m => (m._id || m.id) === specialistId);
    const specialistName = specialist ? specialist.name : null;
    const idVal = specialistId || null;

    if (teamKey === 'developer') {
      setEditedClientFields(prev => ({
        ...prev,
        assignedDeveloper: idVal,
        assignedDeveloperName: specialistName
      }));
    } else if (teamKey === 'design') {
      setEditedClientFields(prev => ({
        ...prev,
        assignedDesigner: idVal,
        assignedDesignerName: specialistName
      }));
    } else if (teamKey === 'ads') {
      setEditedClientFields(prev => ({
        ...prev,
        assignedAdSpecialist: idVal,
        assignedAdSpecialistName: specialistName
      }));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/50 dark:border-slate-800/50 pb-5 relative z-30">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" /> Admin Control Dashboard
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            System Administration Portal
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Sales Report Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSalesReportOpen(true)}
            icon={BarChart3}
          >
            Sales Report
          </Button>

          {/* Register Staff Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRegisterModalOpen(true)}
            icon={UserPlus}
          >
            Register Staff
          </Button>

          {/* Sheets Config Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSheetsModalOpen(true)}
            icon={Sliders}
          >
            Sheets Config
          </Button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && setNotifications) {
                  localStorage.setItem('crm_notifications_last_read', Date.now().toString());
                  setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                }
              }}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white/50 hover:bg-white/80 dark:bg-slate-950/30 dark:hover:bg-slate-950/60 text-gray-550 hover:text-indigo-655 dark:text-gray-400 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-sm relative"
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
                  <div className="p-3.5 border-b border-gray-100 dark:border-slate-855 bg-gray-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Recent Activity</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-855">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400">
                        No recent activity alerts.
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <div key={notif.id} className="p-3 text-xs hover:bg-slate-500/3 dark:hover:bg-slate-500/1 transition-colors">
                          <p className="text-gray-700 dark:text-gray-300 leading-normal">{notif.message}</p>
                          <span className="text-[10px] text-gray-400 dark:text-gray-505 block mt-1">
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

          {/* Sign Out Button */}
          <Button
            variant="outline"
            size="sm"
            className="!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-950/20 !border-red-200 dark:!border-red-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            onClick={() => {
              logout();
              onAddToast('Sign Out Success', 'Admin session terminated.', 'info');
            }}
            icon={LogOut}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* 6-Card Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Total Clients Card */}
        <div 
          onClick={() => setActiveMetricsModal('total')}
          className="glass-card p-4 rounded-xl flex items-center gap-4 border border-indigo-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all animate-in fade-in duration-200"
        >
          <div className="p-3 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">Total Clients</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{totalClientsCount}</p>
          </div>
        </div>

        {/* Non-Allocated Card */}
        <div 
          onClick={() => setActiveMetricsModal('non-allocated')}
          className="glass-card p-4 rounded-xl flex items-center gap-4 border border-rose-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all animate-in fade-in duration-200"
        >
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-555 dark:text-gray-400 uppercase tracking-wider">Non-Allocated</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {leads.filter(l => !l.assignedTeam).length}
            </p>
          </div>
        </div>

        {/* Allocated Card */}
        <div 
          onClick={() => setActiveMetricsModal('allocated')}
          className="glass-card p-4 rounded-xl flex items-center gap-4 border border-blue-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all animate-in fade-in duration-200"
        >
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-555 dark:text-gray-400 uppercase tracking-wider">Allocated</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {leads.filter(l => !!l.assignedTeam).length}
            </p>
          </div>
        </div>

        {/* Claimed Tasks Card */}
        <div 
          onClick={() => setActiveMetricsModal('claimed')}
          className="glass-card p-4 rounded-xl flex items-center gap-4 border border-blue-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all animate-in fade-in duration-200"
        >
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-555 dark:text-gray-400 uppercase tracking-wider">Claimed Tasks</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {leads.filter(l => l.assignedTo !== null).length}
            </p>
          </div>
        </div>

        {/* In Progress Card */}
        <div 
          onClick={() => setActiveMetricsModal('in-progress')}
          className="glass-card p-4 rounded-xl flex items-center gap-4 border border-amber-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all animate-in fade-in duration-200"
        >
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">In Progress</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {leads.filter(l => l.workflowStatus === 'In Progress').length}
            </p>
          </div>
        </div>

        {/* Completed Card */}
        <div 
          onClick={() => setActiveMetricsModal('completed')}
          className="glass-card p-4 rounded-xl flex items-center gap-4 border border-emerald-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all animate-in fade-in duration-200"
        >
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-555 dark:text-gray-400 uppercase tracking-wider">Completed</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              {leads.filter(l => l.workflowStatus === 'Completed').length}
            </p>
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
                <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Service Category</th>
                <th className="p-3 font-bold text-center text-amber-600 dark:text-amber-400">Pending</th>
                <th className="p-3 font-bold text-center text-indigo-600 dark:text-indigo-400">In Progress</th>
                <th className="p-3 font-bold text-center text-emerald-600 dark:text-emerald-400">Completed</th>
                <th className="p-3 font-bold text-center text-gray-700 dark:text-gray-300">Total Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-750 dark:text-gray-350 font-medium">
              {[
                { name: 'Posters Delivery', pending: totalPostersPending, inProgress: totalPostersInProgress, completed: totalPostersCompleted },
                { name: 'Video Production', pending: totalVideosPending, inProgress: totalVideosInProgress, completed: totalVideosCompleted },
                { name: 'Ad Campaigns', pending: totalAdsPending, inProgress: totalAdsInProgress, completed: totalAdsCompleted },
                { name: 'Website Development', pending: totalWebsitePending, inProgress: totalWebsiteInProgress, completed: totalWebsiteCompleted },
                { name: 'Meta Ad Campaign', pending: totalMetaPending, inProgress: totalMetaInProgress, completed: totalMetaCompleted },
                { name: 'Google Ad Campaign', pending: totalGooglePending, inProgress: totalGoogleInProgress, completed: totalGoogleCompleted },
                { name: 'YouTube Campaign', pending: totalYoutubePending, inProgress: totalYoutubeInProgress, completed: totalYoutubeCompleted },
                { name: 'LinkedIn Campaign', pending: totalLinkedinPending, inProgress: totalLinkedinInProgress, completed: totalLinkedinCompleted },
                { name: 'GMB (Google Business Profile)', pending: totalGmbPending, inProgress: totalGmbInProgress, completed: totalGmbCompleted },
                { name: 'SEO', pending: totalSeoPending, inProgress: totalSeoInProgress, completed: totalSeoCompleted }
              ].map((row, idx) => {
                const total = row.pending + row.inProgress + row.completed;
                return (
                  <tr key={idx} className="hover:bg-indigo-500/3 dark:hover:bg-indigo-500/1 transition-colors">
                    <td className="p-3 font-bold text-gray-900 dark:text-white">{row.name}</td>
                    <td 
                      onClick={() => handleSummaryCountClick(row.name, 'Pending')}
                      className="p-3 text-center text-amber-600 dark:text-amber-400 font-bold cursor-pointer hover:bg-amber-500/10 active:bg-amber-500/20 transition-all rounded-lg select-none"
                      title={`View Pending clients for ${row.name}`}
                    >
                      {row.pending}
                    </td>
                    <td 
                      onClick={() => handleSummaryCountClick(row.name, 'In Progress')}
                      className="p-3 text-center text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer hover:bg-indigo-500/10 active:bg-indigo-500/20 transition-all rounded-lg select-none"
                      title={`View In Progress clients for ${row.name}`}
                    >
                      {row.inProgress}
                    </td>
                    <td 
                      onClick={() => handleSummaryCountClick(row.name, 'Completed')}
                      className="p-3 text-center text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-all rounded-lg select-none"
                      title={`View Completed clients for ${row.name}`}
                    >
                      {row.completed}
                    </td>
                    <td className="p-3 text-center text-gray-900 dark:text-white font-extrabold">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Central Clients Section */}
      <Card title="Client Work flow" subtitle="Central client management roster synchronized in real-time across portals">
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-555" />
              <input
                type="text"
                placeholder="Search by client ID, name, or business number..."
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/20 text-gray-900 dark:text-white outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-44">
              <select
                value={clientStatusFilter}
                onChange={(e) => setClientStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2.5 px-3 text-sm bg-white/60 dark:bg-slate-900/40 text-gray-900 dark:text-white cursor-pointer focus:border-indigo-500 outline-hidden"
              >
                <option value="All">All Statuses</option>
                <option value="Non-Allocated">Non-Allocated</option>
                <option value="Allocated">Assigned to Specific Team</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Team Filter */}
            <div className="w-full md:w-44">
              <select
                value={clientTeamFilter}
                onChange={(e) => setClientTeamFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2.5 px-3 text-sm bg-white/60 dark:bg-slate-900/40 text-gray-900 dark:text-white cursor-pointer focus:border-indigo-500 outline-hidden"
              >
                <option value="All">All Teams</option>
                <option value="design">Designing Team</option>
                <option value="developer">Development Team</option>
                <option value="ads">Ads Team</option>
                <option value="all">All Teams</option>
              </select>
            </div>

            {/* Created By Filter */}
            <div className="w-full md:w-44">
              <select
                value={clientCreatedByFilter}
                onChange={(e) => setClientCreatedByFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2.5 px-3 text-sm bg-white/60 dark:bg-slate-900/40 text-gray-900 dark:text-white cursor-pointer focus:border-indigo-500 outline-hidden"
              >
                <option value="All">All Creators</option>
                {salespersonsList.map(sp => (
                  <option key={sp._id || sp.id} value={sp.name}>{sp.name}</option>
                ))}
              </select>
            </div>

            {/* Assigned To Filter */}
            <div className="w-full md:w-44">
              <select
                value={clientAssignedToFilter}
                onChange={(e) => setClientAssignedToFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2.5 px-3 text-sm bg-white/60 dark:bg-slate-900/40 text-gray-900 dark:text-white cursor-pointer focus:border-indigo-500 outline-hidden"
              >
                <option value="All">All Assignees</option>
                <option value="Unassigned">Unassigned</option>
                {technicalList.map(tech => (
                  <option key={tech._id || tech.id} value={tech._id || tech.id}>
                    {tech.name} ({tech.team === 'design' ? 'Design' : tech.team === 'developer' ? 'Dev' : 'Ads'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-150/40 dark:border-slate-800/40 pt-4">
            {/* Date Filters */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span>Timeline From:</span>
                <input
                  type="date"
                  value={clientStartDateFilter}
                  onChange={(e) => setClientStartDateFilter(e.target.value)}
                  className="rounded-lg border border-gray-200 dark:border-slate-800 py-1.5 px-2.5 bg-white/60 dark:bg-slate-900/40 text-gray-900 dark:text-white outline-hidden focus:border-indigo-500 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <span>To:</span>
                <input
                  type="date"
                  value={clientEndDateFilter}
                  onChange={(e) => setClientEndDateFilter(e.target.value)}
                  className="rounded-lg border border-gray-200 dark:border-slate-800 py-1.5 px-2.5 bg-white/60 dark:bg-slate-900/40 text-gray-900 dark:text-white outline-hidden focus:border-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              {/* Clear Filters */}
              {(clientSearchQuery || clientStatusFilter !== 'All' || clientTeamFilter !== 'All' || clientCreatedByFilter !== 'All' || clientAssignedToFilter !== 'All' || clientStartDateFilter || clientEndDateFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setClientSearchQuery('');
                    setClientStatusFilter('All');
                    setClientTeamFilter('All');
                    setClientCreatedByFilter('All');
                    setClientAssignedToFilter('All');
                    setClientStartDateFilter('');
                    setClientEndDateFilter('');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-auto max-h-[380px] border border-gray-100 dark:border-slate-800/60 rounded-xl scrollbar-thin">
          <table className="w-full text-left text-sm border-collapse">
             <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800/60">
                <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Client ID</th>
                <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Created By</th>
                <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Date</th>
                <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Client Name</th>
                <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Business Name</th>
                <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Business Number</th>
                <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Assigned To</th>
                <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-750 dark:text-gray-355 font-medium">
              {filteredCentralClients.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-gray-400 dark:text-gray-555 font-normal">
                    No clients found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredCentralClients.map((client) => (
                  <tr key={client._id} className="hover:bg-indigo-500/3 dark:hover:bg-indigo-500/1 transition-colors">
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setViewedClientId(client._id);
                          setIsEditingClient(false);
                          setEditedClientFields({});
                        }}
                        className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        {client.clientId || 'N/A'}
                      </button>
                    </td>
                    <td className="p-3 text-indigo-650 text-sm dark:text-indigo-400 font-medium">
                      {client.salespersonName || '-'}
                    </td>
                    <td className="p-3 font-medium text-gray-900 dark:text-white">
                      {new Date(client.createdAt || client.timestamp).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-gray-900 dark:text-white font-medium">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{client.clientName}</span>
                        {(() => {
                          const badge = getPaymentStatus(client);
                          return (
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${badge.color}`}>
                              {badge.label}
                            </span>
                          );
                        })()}
                        {(() => {
  const deadlineAlert = checkDeadlineAlert(client.deliveryDeadline, client.workflowStatus);
  if (deadlineAlert) {
    return (
      <span className="flex flex-col gap-0.5 mt-0.5">
        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold">
          <span className={`w-1.5 h-1.5 rounded-full ${deadlineAlert.dotColor}`} />
          <span className={deadlineAlert.color}>{deadlineAlert.label}</span>
        </span>
        {deadlineAlert.date && (
          <span className={`text-[9px] ${deadlineAlert.color} opacity-80 pl-2.5`}>
            {deadlineAlert.date}
          </span>
        )}
      </span>
    );
  }
  return null;
})()}
                      </div>
                    </td>
                    <td className="p-3 text-gray-900 dark:text-white font-medium">
                      {client.companyName || '-'}
                    </td>
                    <td className="p-3 font-mono">{client.mobileNumber}</td>
                   <td className="p-3">
  {(() => {
    const teams = client.assignedTeam;
    const teamList = !teams ? [] : Array.isArray(teams) ? teams : teams === 'all' ? ['design', 'developer', 'ads'] : [teams];
    const assignees = [];
    if (teamList.includes('ads') || teamList.includes('all')) assignees.push({ team: 'Ads', name: client.assignedAdSpecialistName || null, color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' });
    if (teamList.includes('design') || teamList.includes('all')) assignees.push({ team: 'Design', name: client.assignedDesignerName || null, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' });
    if (teamList.includes('developer') || teamList.includes('all')) assignees.push({ team: 'Dev', name: client.assignedDeveloperName || null, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' });
    if (assignees.length === 0) return <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full text-xs font-bold">Not Assigned</span>;
    return (
      <div className="flex flex-col gap-1">
        {assignees.map((a, i) => (
          <span key={i} className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${a.color}`}>
            {a.team}: {a.name || <span className="opacity-50 italic">Unclaimed</span>}
          </span>
        ))}
      </div>
    );
  })()}
</td>
                    <td className="p-3">
                      {(() => {
                        const sc = (s) => s === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : s === 'In Progress'
                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
                        const perTeam = getPerTeamStatusBadges(client);
                        if (perTeam && (client.workflowStatus === 'In Progress' || client.workflowStatus === 'Completed' || client.workflowStatus === 'Allocated')) {
                          return (
                            <div className="flex flex-col gap-1">
                              {perTeam.map((t, i) => (
                                <span key={i} className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${sc(t.status)}`}>
                                  {t.label}: {t.status}
                                </span>
                              ))}
                            </div>
                          );
                        }
                        return (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            client.workflowStatus === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : client.workflowStatus === 'In Progress'
                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                : client.workflowStatus === 'Allocated'
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {getStatusLabel(client.workflowStatus, client.assignedTeam)}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Main Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Sales Team Directory" subtitle="Inspect client brief portfolios compiled by representatives">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-3 border-b border-gray-100 dark:border-slate-800/40 pb-4">
            <span className="text-xs text-gray-400 font-medium">Select representative to view active portfolio</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSelectedRep('All'); setSelectedTech(null); }}
              icon={Users}
            >
              Inspect All ({leads.length})
            </Button>
          </div>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-550" />
            <input
              type="text"
              placeholder="Search representatives..."
              value={repSearchQuery}
              onChange={(e) => setRepSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-205 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/20 text-gray-900 dark:text-white outline-hidden focus:border-indigo-500"
            />
          </div>
          
          <div className="max-h-[420px] overflow-y-auto pr-1.5 scrollbar-thin">
            <div className="grid grid-cols-1 gap-4">
              {filteredRepStats.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-200 dark:border-slate-800/80 rounded-xl bg-gray-50/30 dark:bg-slate-900/10">
                  <Users className="w-8 h-8 text-gray-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-555 dark:text-gray-400">
                    {repStats.length === 0 ? 'No representatives have been registered yet.' : 'No representatives match the search query.'}
                  </p>
                </div>
              ) : (
                filteredRepStats.map((rep, idx) => (
                  <div 
                    key={idx}
                    onClick={() => { setSelectedRep(rep.name); setSelectedTech(null); }}
                    className="p-5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white/40 hover:bg-white/80 dark:bg-slate-950/20 dark:hover:bg-slate-950/40 transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] hover:shadow-md group"
                  >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8.5 h-8.5 rounded-full bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                        {rep.name.charAt(0).toUpperCase()}
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {rep.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1">
                      {rep.id && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEmployeeToEdit({
                                id: rep.id,
                                name: rep.name,
                                username: rep.username,
                                role: 'salesperson',
                                team: null
                              });
                              setEditEmployeeName(rep.name);
                              setEditEmployeeUsername(rep.username);
                              setEditEmployeeRole('salesperson');
                              setEditEmployeeTeam('design');
                            }}
                            className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
                            title={`Edit ${rep.name}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRepToResetPassword({ id: rep.id, name: rep.name, username: rep.username });
                              setResetPasswordInput('');
                            }}
                            className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-indigo-500 hover:text-indigo-655 transition-colors cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
                            title={`Reset Password for ${rep.name}`}
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRepToDelete({ id: rep.id, name: rep.name });
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 hover:text-red-655 transition-colors cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
                            title={`Delete ${rep.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-605 transition-colors" />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 text-center border-t border-gray-150/40 dark:border-slate-800/40 pt-3.5 mt-4 text-[10px] font-semibold text-gray-400">
                    <div>
                      <span className="block text-gray-550 dark:text-gray-400 text-xs font-bold">{rep.total}</span>
                      Total
                    </div>
                    <div>
                      <span className="block text-emerald-500 text-xs font-bold">{rep.completed}</span>
                      Completed
                    </div>
                    <div>
                      <span className="block text-indigo-500 text-xs font-bold">{rep.inProgress}</span>
                      In progress
                    </div>
                    <div>
                      <span className="block text-amber-500 text-xs font-bold">{rep.pending}</span>
                      Pending
                    </div>
                  </div>
                </div>
              )))}
            </div>
          </div>
        </Card>

        {/* Technical Team Directory */}
        <Card title="Technical Team Directory" subtitle="Manage technical specialist accounts and credentials">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-550" />
            <input
              type="text"
              placeholder="Search technical specialists..."
              value={techSearchQuery}
              onChange={(e) => setTechSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-205 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/20 text-gray-900 dark:text-white outline-hidden focus:border-indigo-500"
            />
          </div>
          {filteredTechnicalList.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 dark:border-slate-800/80 rounded-xl bg-gray-50/30 dark:bg-slate-900/10">
              <Users className="w-8 h-8 text-gray-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs font-medium text-gray-555 dark:text-gray-400">
                {technicalList.length === 0 ? 'No technical team members have been registered yet.' : 'No technical team members match the search query.'}
              </p>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto pr-1.5 scrollbar-thin">
              <div className="grid grid-cols-1 gap-4">
                {filteredTechnicalList.map((tech, idx) => {
                  const techLeads = leads.filter(l => 
                    (l.assignedTo && l.assignedTo.toString() === tech._id.toString()) ||
                    (l.assignedDeveloper && l.assignedDeveloper.toString() === tech._id.toString()) ||
                    (l.assignedDesigner && l.assignedDesigner.toString() === tech._id.toString()) ||
                    (l.assignedAdSpecialist && l.assignedAdSpecialist.toString() === tech._id.toString()) ||
                    l.assignedToName === tech.name ||
                    (l.assignedToName && l.assignedToName.includes(tech.name))
                  );
                  const claimed = techLeads.length;
                  const completed = techLeads.filter(l => {
                    const status = tech.team === 'design' ? l.designTeamStatus : tech.team === 'ads' ? l.adsTeamStatus : tech.team === 'developer' ? l.devTeamStatus : l.workflowStatus;
                    return (status || 'Pending') === 'Completed';
                  }).length;
                  const inProgress = techLeads.filter(l => {
                    const status = tech.team === 'design' ? l.designTeamStatus : tech.team === 'ads' ? l.adsTeamStatus : tech.team === 'developer' ? l.devTeamStatus : l.workflowStatus;
                    return (status || 'Pending') === 'In Progress';
                  }).length;
                  const pending = techLeads.filter(l => {
                    const status = tech.team === 'design' ? l.designTeamStatus : tech.team === 'ads' ? l.adsTeamStatus : tech.team === 'developer' ? l.devTeamStatus : l.workflowStatus;
                    return (status || 'Pending') === 'Pending';
                  }).length;

                  return (
                    <div 
                      key={idx}
                      onClick={() => {
                        setSelectedTech(tech);
                        setSelectedRep(null);
                      }}
                      className="p-5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 flex flex-col justify-between hover:scale-[1.01] hover:shadow-md group cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8.5 h-8.5 rounded-full bg-blue-500/10 text-blue-600 dark:blue-400 font-bold flex items-center justify-center text-xs">
                            {tech.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white flex flex-wrap items-center gap-1.5">
                              {tech.name}
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                                {tech.team === 'design' ? 'Designing' : tech.team === 'developer' ? 'Developer' : tech.team === 'ads' ? 'Ads' : 'General'}
                              </span>
                            </h4>
                            <span className="text-[10px] text-gray-455 dark:text-gray-555 font-semibold">
                              @{tech.username}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEmployeeToEdit({
                                id: tech._id,
                                name: tech.name,
                                username: tech.username,
                                role: 'technical',
                                team: tech.team || 'design'
                              });
                              setEditEmployeeName(tech.name);
                              setEditEmployeeUsername(tech.username);
                              setEditEmployeeRole('technical');
                              setEditEmployeeTeam(tech.team || 'design');
                            }}
                            className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
                            title={`Edit ${tech.name}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRepToResetPassword({ id: tech._id, name: tech.name, username: tech.username });
                              setResetPasswordInput('');
                            }}
                            className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-indigo-500 hover:text-indigo-655 transition-colors cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
                            title={`Reset Password for ${tech.name}`}
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRepToDelete({ id: tech._id, name: tech.name });
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 hover:text-red-650 transition-colors cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
                            title={`Delete ${tech.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 text-center border-t border-gray-150/40 dark:border-slate-800/40 pt-3.5 mt-4 text-[10px] font-semibold text-gray-400">
                        <div>
                          <span className="block text-gray-550 dark:text-gray-400 text-xs font-bold">{claimed}</span>
                          Claimed
                        </div>
                        <div>
                          <span className="block text-emerald-500 text-xs font-bold">{completed}</span>
                          Completed
                        </div>
                        <div>
                          <span className="block text-indigo-505 text-xs font-bold">{inProgress}</span>
                          In progress
                        </div>
                        <div>
                          <span className="block text-amber-500 text-xs font-bold">{pending}</span>
                          Pending
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>

      <AppsScriptGuide 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
      />

      {/* Delete Representative Confirmation Modal */}
      {repToDelete && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 text-red-650 rounded-full flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Representative?</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">This action is permanent and deletes all associated leads.</p>
                </div>
              </div>

              <p className="text-xs text-gray-650 dark:text-gray-300 leading-normal">
                Are you sure you want to permanently delete the representative <strong className="text-gray-900 dark:text-white">{repToDelete.name}</strong>? This will remove their user login credentials and delete all client lead briefs they created.
              </p>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-slate-800/40">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRepToDelete(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="!bg-red-600 hover:!bg-red-700 !border-red-600 hover:!border-red-700 text-white"
                  onClick={handleDeleteRepConfirm}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Representative Password Modal */}
      {repToResetPassword && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in duration-200">
            <form onSubmit={handleResetPasswordConfirm} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Reset Representative Password</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Change password for {repToResetPassword.name}</p>
                </div>
              </div>

              <div className="text-xs text-gray-650 dark:text-gray-300 leading-normal">
                Updating password for username: <code className="bg-indigo-500/10 dark:bg-indigo-500/20 px-1 py-0.5 rounded font-mono font-bold text-indigo-600 dark:text-indigo-400">{repToResetPassword.username}</code>
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password (min 6 chars)"
                  required
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2.5 px-3.5 text-sm bg-white/60 dark:bg-slate-900/40 text-gray-900 dark:text-white transition-all outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-slate-800/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRepToResetPassword(null);
                    setResetPasswordInput('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

{/* Metrics List Modal */}
      {activeMetricsModal && (() => {
        const { title, list } = getMetricsModalTitleAndList();
        return (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-150 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in duration-200">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800/80">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-550 mt-0.5">Showing {list.length} matching client briefs</p>
                </div>
                <button 
                  onClick={() => setActiveMetricsModal(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content - Table */}
              <div className="p-6 overflow-y-auto flex-1">
                {list.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 dark:text-gray-550">
                    No client records match this category.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-100 dark:border-slate-800/60 rounded-xl">
                    <table className="w-full text-left text-sm border-collapse table-fixed">
                      <colgroup>
                        <col className="w-[10%]" />
                        <col className="w-[24%]" />
                        <col className="w-[12%]" />
                        <col className="w-[16%]" />
                        <col className="w-[24%]" />
                        <col className="w-[14%]" />
                      </colgroup>
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800/60">
                          <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Client ID</th>
                          <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Client Name</th>
                          <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Business Number</th>
                          <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Workflow Status</th>
                          <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Assigned To</th>
                          <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Created By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-750 dark:text-gray-355 font-medium">
                        {list.map((client) => (
                          <tr key={client._id} className="hover:bg-indigo-500/3 dark:hover:bg-indigo-500/1 transition-colors align-top">
                            <td className="p-3 break-words">
                              <button
                                onClick={() => {
                                  setActiveMetricsModal(null); // Close metrics list modal
                                  setViewedClientId(client._id); // Open profile editor modal
                                  setIsEditingClient(false);
                                  setEditedClientFields({});
                                }}
                                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer break-words block"
                              >
                                {client.clientId || 'N/A'}
                              </button>
                            </td>
                            <td className="p-3 text-gray-900 dark:text-white font-bold">
                              <div className="break-words">{client.clientName}</div>
                              {client.companyName && (
                                <div className="text-xs text-gray-405 dark:text-gray-500 font-normal mt-0.5 break-words">
                                  {client.companyName}
                                </div>
                              )}
                            </td>
                            <td className="p-3 font-mono break-words">{client.mobileNumber}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${
                                client.workflowStatus === 'Completed'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : client.workflowStatus === 'In Progress'
                                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                    : client.workflowStatus === 'Allocated'
                                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              }`}>
                                {getStatusLabel(client.workflowStatus, client.assignedTeam)}
                              </span>
                            </td>
                            <td className="p-3 text-xs overflow-hidden">
                              {(() => {
                                const teams = client.assignedTeam;
                                const teamList = !teams ? [] : Array.isArray(teams) ? teams : teams === 'all' ? ['design', 'developer', 'ads'] : [teams];
                                const assignees = [];
                                if (teamList.includes('ads') || teamList.includes('all')) assignees.push({ team: 'Ads', name: client.assignedAdSpecialistName || null, color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' });
                                if (teamList.includes('design') || teamList.includes('all')) assignees.push({ team: 'Design', name: client.assignedDesignerName || null, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' });
                                if (teamList.includes('developer') || teamList.includes('all')) assignees.push({ team: 'Dev', name: client.assignedDeveloperName || null, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' });
                                if (assignees.length === 0) return <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full text-[10px] font-bold inline-block">Unassigned</span>;
                                return (
                                  <div className="flex flex-col gap-1">
                                    {assignees.map((a, i) => (
                                      <span key={i} className={`px-2 py-0.5 rounded-md text-[10px] font-bold break-words ${a.color}`} title={`${a.team}: ${a.name || 'Unclaimed'}`}>
                                        {a.team}: {a.name || <span className="opacity-50 italic">Unclaimed</span>}
                                      </span>
                                    ))}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="p-3 text-indigo-650 dark:text-indigo-400 font-semibold break-words">
                              {client.salespersonName}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      {/* Detailed Client Profile Editor Modal */}
      {viewedClientId && (() => {
        const client = leads.find(l => l._id === viewedClientId);
        if (!client) return null;

        return (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-[160] overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Client Profile & Edit Console
                    </h3>
                    <span className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                      ID: {client.clientId || 'N/A'}
                    </span>
                    {(() => {
                      const badge = getPaymentStatus({ ...client, ...editedClientFields });
                      return (
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${badge.color}`}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-550 mt-1">
                    Created by salesperson <strong className="text-indigo-650 dark:text-indigo-405">{client.salespersonName}</strong> on {new Date(client.createdAt || client.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setViewedClientId(null);
                      setIsEditingClient(false);
                      setEditedClientFields({});
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content Form */}
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  await handleSaveClientDetails();
                  setViewedClientId(null);
                }} 
                className="flex-1 overflow-y-auto p-6 space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  
                  {/* Left Column: Form Details (3/5 width) */}
                  <div className="lg:col-span-3 space-y-6">
                    {/* Contact Info Card */}
                    <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        1. Contact Information
                      </h4>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase">Client Name *</label>
                        <input 
                          type="text" 
                          required
                          value={editedClientFields.clientName ?? client.clientName ?? ''}
                          onChange={(e) => handleClientFieldChange('clientName', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase">Company Name</label>
                        <input 
                          type="text" 
                          value={editedClientFields.companyName ?? client.companyName ?? ''}
                          onChange={(e) => handleClientFieldChange('companyName', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">WhatsApp Mobile *</label>
                        <input 
                          type="text" 
                          required
                          value={editedClientFields.mobileNumber ?? client.mobileNumber ?? ''}
                          onChange={(e) => handleClientFieldChange('mobileNumber', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Email Address</label>
                        <input 
                          type="email" 
                          value={editedClientFields.email ?? client.email ?? ''}
                          onChange={(e) => handleClientFieldChange('email', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Social Media Access Card */}
                    <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        2. Social Channels Credentials
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">FB Page Status</label>
                          <select 
                            value={editedClientFields.facebookAccountStatus ?? client.facebookAccountStatus ?? 'Existing'}
                            onChange={(e) => handleClientFieldChange('facebookAccountStatus', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-2 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          >
                            <option value="Existing">Existing Account</option>
                            <option value="New">Create New Account</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Facebook ID</label>
                          <input 
                            type="text" 
                            value={editedClientFields.facebookId ?? client.facebookId ?? ''}
                            onChange={(e) => handleClientFieldChange('facebookId', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Facebook Password</label>
                          <input 
                            type="text" 
                            value={editedClientFields.facebookPassword ?? client.facebookPassword ?? ''}
                            onChange={(e) => handleClientFieldChange('facebookPassword', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">IG Page Status</label>
                          <select 
                            value={editedClientFields.instagramAccountStatus ?? client.instagramAccountStatus ?? 'Existing'}
                            onChange={(e) => handleClientFieldChange('instagramAccountStatus', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-2 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          >
                            <option value="Existing">Existing Account</option>
                            <option value="New">Create New Account</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Instagram ID</label>
                          <input 
                            type="text" 
                            value={editedClientFields.instagramId ?? client.instagramId ?? ''}
                            onChange={(e) => handleClientFieldChange('instagramId', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Instagram Password</label>
                          <input 
                            type="text" 
                            value={editedClientFields.instagramPassword ?? client.instagramPassword ?? ''}
                            onChange={(e) => handleClientFieldChange('instagramPassword', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Financials Card */}
                    <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        3. Financial Information
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Plan Amount (₹)</label>
                          <input 
                            type="number" 
                            min="0"
                            value={editedClientFields.planAmount ?? client.planAmount ?? 0}
                            onChange={(e) => handleClientFieldChange('planAmount', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Advance Amount (₹)</label>
                          <input 
                            type="number" 
                            min="0"
                            value={editedClientFields.advanceAmount ?? client.advanceAmount ?? 0}
                            onChange={(e) => handleClientFieldChange('advanceAmount', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase font-extrabold text-indigo-650 dark:text-indigo-405">Pending Balance (₹)</label>
                          <input 
                            type="number" 
                            min="0"
                            value={editedClientFields.pendingAmount ?? client.pendingAmount ?? 0}
                            onChange={(e) => handleClientFieldChange('pendingAmount', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white/70 dark:bg-slate-955/20 text-gray-900 dark:text-white font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Ad Budget (₹)</label>
                          <input 
                            type="number" 
                            min="0"
                            value={editedClientFields.adBudget ?? client.adBudget ?? 0}
                            onChange={(e) => handleClientFieldChange('adBudget', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Ad Budget/Day (₹)</label>
                          <input 
                            type="number" 
                            min="0"
                            value={editedClientFields.adBudgetPerDay ?? client.adBudgetPerDay ?? 0}
                            onChange={(e) => handleClientFieldChange('adBudgetPerDay', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase font-extrabold">Payment Status</label>
                          <select 
                            value={editedClientFields.paymentStatus ?? client.paymentStatus ?? 'Unpaid'}
                            onChange={(e) => handleClientFieldChange('paymentStatus', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-bold"
                          >
                            <option value="Unpaid">Unpaid</option>
                            <option value="Partial">Partially Paid</option>
                            <option value="Paid">Fully Paid</option>
                          </select>
                        </div>
                      </div>
                    </div>


                    {/* Deliverables Card */}
                    <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        4. Requested Assets & Milestones
                      </h4>
                      
                      {/* Posters */}
                      <div className="border-b border-gray-100 dark:border-slate-800/40 pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Graphic Posters</span>
                          <select
                            value={editedClientFields.postersStatus ?? client.postersStatus ?? 'Pending'}
                            onChange={(e) => handleClientFieldChange('postersStatus', e.target.value)}
                            className="rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[10px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[9px] text-gray-400 uppercase">Total Req</label>
                            <input 
                              type="number" 
                              min="0"
                              value={editedClientFields.postersRequired ?? client.postersRequired ?? 0}
                              onChange={(e) => handleClientFieldChange('postersRequired', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] text-gray-400 uppercase">Pending</label>
                            <input 
                              type="number" 
                              min="0"
                              value={editedClientFields.postersPending ?? client.postersPending ?? 0}
                              onChange={(e) => handleClientFieldChange('postersPending', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Videos */}
                      <div className="border-b border-gray-100 dark:border-slate-800/40 pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Reels & Videos</span>
                          <select
                            value={editedClientFields.videosStatus ?? client.videosStatus ?? 'Pending'}
                            onChange={(e) => handleClientFieldChange('videosStatus', e.target.value)}
                            className="rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[10px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[9px] text-gray-400 uppercase">Total Req</label>
                            <input 
                              type="number" 
                              min="0"
                              value={editedClientFields.videosRequired ?? client.videosRequired ?? 0}
                              onChange={(e) => handleClientFieldChange('videosRequired', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] text-gray-400 uppercase">Pending</label>
                            <input 
                              type="number" 
                              min="0"
                              value={editedClientFields.videosPending ?? client.videosPending ?? 0}
                              onChange={(e) => handleClientFieldChange('videosPending', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Ads */}
                      <div className="border-b border-gray-100 dark:border-slate-800/40 pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Ads Campaigns</span>
                          <select
                            value={editedClientFields.adsStatus ?? client.adsStatus ?? 'Pending'}
                            onChange={(e) => handleClientFieldChange('adsStatus', e.target.value)}
                            className="rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[10px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[9px] text-gray-400 uppercase">Total Req</label>
                            <input 
                              type="number" 
                              min="0"
                              value={editedClientFields.adsRequired ?? client.adsRequired ?? 0}
                              onChange={(e) => handleClientFieldChange('adsRequired', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] text-gray-400 uppercase">Pending</label>
                            <input 
                              type="number" 
                              min="0"
                              value={editedClientFields.adsPending ?? client.adsPending ?? 0}
                              onChange={(e) => handleClientFieldChange('adsPending', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Website */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox"
                              checked={editedClientFields.websiteRequired ?? client.websiteRequired ?? false}
                              onChange={(e) => handleClientFieldChange('websiteRequired', e.target.checked)}
                              className="rounded border-gray-200 dark:border-slate-800 text-indigo-600"
                            />
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Website Development</span>
                          </div>
                          <select
                            value={editedClientFields.websiteStatus ?? client.websiteStatus ?? 'Pending'}
                            onChange={(e) => handleClientFieldChange('websiteStatus', e.target.value)}
                            className="rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[10px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[9px] text-gray-400 uppercase">Website Type</label>
                            <input 
                              type="text" 
                              value={editedClientFields.websiteType ?? client.websiteType ?? ''}
                              onChange={(e) => handleClientFieldChange('websiteType', e.target.value)}
                              placeholder="e.g. E-Commerce"
                              className="w-full rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] text-gray-400 uppercase">Pending Count</label>
                            <input 
                              type="number" 
                              min="0"
                              value={editedClientFields.websitePending ?? client.websitePending ?? 0}
                              onChange={(e) => handleClientFieldChange('websitePending', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 dark:border-slate-800 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Specifications Card */}
                    <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        5. Project Specifications
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase">Business Category</label>
                          <input 
                            type="text" 
                            value={editedClientFields.businessCategory ?? client.businessCategory ?? ''}
                            onChange={(e) => handleClientFieldChange('businessCategory', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Website URL</label>
                          <input 
                            type="text" 
                            value={editedClientFields.websiteUrl ?? client.websiteUrl ?? ''}
                            onChange={(e) => handleClientFieldChange('websiteUrl', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Start Date</label>
                          <input 
                            type="date" 
                            value={editedClientFields.startDate ?? client.startDate ?? ''}
                            onChange={(e) => handleClientFieldChange('startDate', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Delivery Deadline</label>
                          <input 
                            type="date" 
                            value={editedClientFields.deliveryDeadline ?? client.deliveryDeadline ?? ''}
                            onChange={(e) => handleClientFieldChange('deliveryDeadline', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Brand Colors (e.g. #ff0000, #0000ff)</label>
                        <div className="flex gap-2 items-center">
                          <input 
                            type="color" 
                            value={((editedClientFields.brandColors ?? client.brandColors ?? '').startsWith('#') && (editedClientFields.brandColors ?? client.brandColors ?? '').length === 7) ? (editedClientFields.brandColors ?? client.brandColors ?? '') : '#6366f1'}
                            onChange={(e) => handleClientFieldChange('brandColors', e.target.value)}
                            className="w-8 h-8 rounded border border-gray-200 dark:border-slate-800 shrink-0 bg-transparent"
                          />
                          <input 
                            type="text" 
                            value={editedClientFields.brandColors ?? client.brandColors ?? ''}
                            onChange={(e) => handleClientFieldChange('brandColors', e.target.value)}
                            className="flex-1 rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2 col-span-1">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase font-semibold">Audience Status</label>
                          <select 
                            value={editedClientFields.targetAudienceRequired ?? client.targetAudienceRequired ?? 'Required'}
                            onChange={(e) => handleClientFieldChange('targetAudienceRequired', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-2 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          >
                            <option value="Required">Required</option>
                            <option value="Not Required">Not Required</option>
                          </select>
                        </div>
                        <div className="space-y-2 col-span-2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Target Audience Description</label>
                          <input 
                            type="text" 
                            value={editedClientFields.targetAudience ?? client.targetAudience ?? ''}
                            onChange={(e) => handleClientFieldChange('targetAudience', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Key Competitors</label>
                        <input 
                          type="text" 
                          value={editedClientFields.competitors ?? client.competitors ?? ''}
                          onChange={(e) => handleClientFieldChange('competitors', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Comments & Remarks Card */}
                    <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        6. Client Notes & Remarks
                      </h4>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Salesperson Client Notes</label>
                        <textarea 
                          value={editedClientFields.notes ?? client.notes ?? ''}
                          onChange={(e) => handleClientFieldChange('notes', e.target.value)}
                          rows="2"
                          className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-y"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Internal Remarks (Admin/Team)</label>
                        <textarea 
                          value={editedClientFields.remarks ?? client.remarks ?? ''}
                          onChange={(e) => handleClientFieldChange('remarks', e.target.value)}
                          rows="2"
                          className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-y font-medium"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Collaboration Chat (2/5 width) */}
                  <div className="space-y-6 lg:col-span-2 flex flex-col justify-between">
                    <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-805 flex-1 flex flex-col">
                      <h4 className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider mb-2">
                        Collaboration Chat
                      </h4>
                      <ClientChat leadId={client._id || client.id} layout="stack" />
                    </div>
                  </div>
 
                </div>

                {/* CRM Assignment Control Section */}
                <div className="bg-indigo-500/5 dark:bg-slate-900/40 p-4 rounded-xl border border-indigo-500/20 dark:border-slate-800/80 space-y-4">
                  <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    ⚙️ CRM Technical Assignment Console
                  </h4>
                  
                  {/* Assign to Team */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Assign to Team(s)</label>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-700 dark:text-gray-300 font-semibold mt-1">
                      {['design', 'developer', 'ads'].map((team) => {
                        const currentTeams = editedClientFields.assignedTeam ?? client.assignedTeam ?? [];
                        const isChecked = Array.isArray(currentTeams) 
                          ? currentTeams.includes(team) 
                          : currentTeams === team;
                        
                        return (
                          <label key={team} className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                let nextTeams = [];
                                const baseTeams = Array.isArray(currentTeams) ? currentTeams : (currentTeams ? [currentTeams] : []);
                                if (e.target.checked) {
                                  nextTeams = [...baseTeams, team];
                                } else {
                                  nextTeams = baseTeams.filter(t => t !== team);
                                }
                                handleClientFieldChange('assignedTeam', nextTeams);
                              }}
                              className="rounded border-gray-200 dark:border-slate-800 text-indigo-650"
                            />
                            <span className="capitalize">{team === 'ads' ? 'Ads Campaign' : team === 'design' ? 'Graphic Design' : 'Developer'}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assign to Individual Person */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    {/* Developer Team */}
                    {(() => {
                      const currentTeams = editedClientFields.assignedTeam ?? client.assignedTeam ?? [];
                      const hasDev = Array.isArray(currentTeams) ? currentTeams.includes('developer') : currentTeams === 'developer';
                      if (!hasDev) return null;

                      const devsList = technicalList.filter(m => m.team === 'developer');
                      return (
                        <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-100">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Developer Specialist</label>
                          <select
                            value={editedClientFields.assignedDeveloper ?? client.assignedDeveloper ?? ''}
                            onChange={(e) => handleSpecialistChange('developer', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-2.5 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          >
                            <option value="">Select Developer (Unassigned)</option>
                            {devsList.map(dev => (
                              <option key={dev._id || dev.id} value={dev._id || dev.id}>{dev.name}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}

                    {/* Design Team */}
                    {(() => {
                      const currentTeams = editedClientFields.assignedTeam ?? client.assignedTeam ?? [];
                      const hasDesign = Array.isArray(currentTeams) ? currentTeams.includes('design') : currentTeams === 'design';
                      if (!hasDesign) return null;

                      const designersList = technicalList.filter(m => m.team === 'design');
                      return (
                        <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-100">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Designer Specialist</label>
                          <select
                            value={editedClientFields.assignedDesigner ?? client.assignedDesigner ?? ''}
                            onChange={(e) => handleSpecialistChange('design', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-2.5 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          >
                            <option value="">Select Designer (Unassigned)</option>
                            {designersList.map(designer => (
                              <option key={designer._id || designer.id} value={designer._id || designer.id}>{designer.name}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}

                    {/* Ads Team */}
                    {(() => {
                      const currentTeams = editedClientFields.assignedTeam ?? client.assignedTeam ?? [];
                      const hasAds = Array.isArray(currentTeams) ? currentTeams.includes('ads') : currentTeams === 'ads';
                      if (!hasAds) return null;

                      const adsList = technicalList.filter(m => m.team === 'ads');
                      return (
                        <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-100">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Ads Specialist</label>
                          <select
                            value={editedClientFields.assignedAdSpecialist ?? client.assignedAdSpecialist ?? ''}
                            onChange={(e) => handleSpecialistChange('ads', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-2.5 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          >
                            <option value="">Select Ads Specialist (Unassigned)</option>
                            {adsList.map(ads => (
                              <option key={ads._id || ads.id} value={ads._id || ads.id}>{ads.name}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}
                  </div>

                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setViewedClientId(null);
                      setIsEditingClient(false);
                      setEditedClientFields({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                  >
                    Save Client Profile
                  </Button>
                </div>

              </form>

            </div>
          </div>
        );
      })()}

      {/* Edit Employee Modal */}
      {employeeToEdit && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Edit Employee Details</h3>
              <button 
                onClick={() => setEmployeeToEdit(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-655 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditEmployeeConfirm} className="space-y-4">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-gray-750 dark:text-gray-300">
                  Staff Role
                </label>
                <select
                  value={editEmployeeRole}
                  onChange={(e) => setEditEmployeeRole(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-855 py-2.5 px-3.5 text-xs bg-white dark:bg-slate-900/40 text-gray-955 dark:text-white transition-all outline-hidden focus:border-indigo-500"
                >
                  <option value="salesperson">Salesperson</option>
                  <option value="technical">Technical Team Member</option>
                </select>
              </div>

              {editEmployeeRole === 'technical' && (
                <div className="flex flex-col gap-1.5 w-full animate-in slide-in-from-top duration-155">
                  <label className="text-xs font-semibold text-gray-750 dark:text-gray-300">
                    Assign to Team
                  </label>
                  <select
                    value={editEmployeeTeam}
                    onChange={(e) => setEditEmployeeTeam(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-855 py-2.5 px-3.5 text-xs bg-white dark:bg-slate-900/40 text-gray-955 dark:text-white transition-all outline-hidden focus:border-indigo-500"
                  >
                    <option value="design">Designing Team</option>
                    <option value="developer">Developer Team</option>
                    <option value="ads">Ads Team</option>
                  </select>
                </div>
              )}

              <Input
                label="Staff Name"
                placeholder="Enter full name"
                required
                icon={UserPlus}
                value={editEmployeeName}
                onChange={(e) => setEditEmployeeName(e.target.value)}
              />
              <Input
                label="Username"
                placeholder="Enter username"
                required
                value={editEmployeeUsername}
                onChange={(e) => setEditEmployeeUsername(e.target.value)}
              />

              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-slate-800/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEmployeeToEdit(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ── SALES REPORT MODAL ───────────────────────────────────────────────── */}
{isSalesReportOpen && (() => {
  // All filter state is driven by: salesReportSearch, salesReportDateMode,
  // salesReportMonth, salesReportYear, salesReportStartDate, salesReportEndDate,
  // salesReportRepFilter — declared at top of component (add them there).
  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-start justify-center p-4 z-150 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-7xl my-6 shadow-2xl flex flex-col">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 rounded-t-2xl z-10">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4.5 h-4.5 text-indigo-500" /> Sales Report
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Filtered client payment &amp; campaign overview — {filteredSalesReportLeads.length} client{filteredSalesReportLeads.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Google Sheets Sync */}
            <button
              onClick={handleSalesReportSheetsSync}
              disabled={salesReportSheetsLoading}
              title="Sync to Google Sheets"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
            >
              {salesReportSheetsLoading
                ? <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                : <Sheet className="w-3.5 h-3.5" />
              }
              Google Sheets
            </button>
            {/* Excel Download */}
            <button
              onClick={handleSalesReportExcelDownload}
              title="Download Excel"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Excel
            </button>
            {/* Close */}
            <button
              onClick={() => {
                setIsSalesReportOpen(false);
                setSalesReportSearch('');
                setSalesReportRepFilter('All');
                setSalesReportDateMode('all');
                setSalesReportMonth(new Date().getMonth() + 1);
                setSalesReportYear(new Date().getFullYear());
                setSalesReportStartDate('');
                setSalesReportEndDate('');
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 dark:border-slate-800/60 bg-gray-50/40 dark:bg-slate-900/50 space-y-3">
          <div className="flex flex-wrap items-end gap-3">

            {/* Client Name Search */}
            <div className="flex flex-col gap-1 min-w-[180px] flex-1">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Client Name</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search client, business, ID..."
                  value={salesReportSearch}
                  onChange={e => setSalesReportSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:border-indigo-400 w-full transition-all"
                />
              </div>
            </div>

            {/* Salesperson Filter */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Sales Person</label>
              <select
                value={salesReportRepFilter}
                onChange={e => setSalesReportRepFilter(e.target.value)}
                className="py-2 px-3 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:border-indigo-400 cursor-pointer transition-all"
              >
                <option value="All">All Sales Persons</option>
                {salespersonsList.map(sp => (
                  <option key={sp._id || sp.id} value={sp.name}>{sp.name}</option>
                ))}
              </select>
            </div>

            {/* Date Mode Toggle */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Date Filter Mode</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 text-xs font-semibold">
                {[
                  { val: 'all', label: 'All Time' },
                  { val: 'monthly', label: 'Monthly' },
                  { val: 'custom', label: 'Custom Range' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setSalesReportDateMode(opt.val)}
                    className={`px-3 py-2 transition-all cursor-pointer ${
                      salesReportDateMode === opt.val
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly Picker */}
            {salesReportDateMode === 'monthly' && (
              <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Month & Year</label>
                <div className="flex gap-2">
                  <select
                    value={salesReportMonth}
                    onChange={e => setSalesReportMonth(Number(e.target.value))}
                    className="py-2 px-3 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={salesReportYear}
                    onChange={e => setSalesReportYear(Number(e.target.value))}
                    className="py-2 px-3 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Custom Date Range */}
            {salesReportDateMode === 'custom' && (
              <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Date Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={salesReportStartDate}
                    onChange={e => setSalesReportStartDate(e.target.value)}
                    className="py-2 px-3 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:border-indigo-400 cursor-pointer"
                  />
                  <span className="text-xs text-gray-400 font-semibold">to</span>
                  <input
                    type="date"
                    value={salesReportEndDate}
                    onChange={e => setSalesReportEndDate(e.target.value)}
                    className="py-2 px-3 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:border-indigo-400 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Reset Filters */}
            {(salesReportSearch || salesReportRepFilter !== 'All' || salesReportDateMode !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSalesReportSearch('');
                  setSalesReportRepFilter('All');
                  setSalesReportDateMode('all');
                  setSalesReportStartDate('');
                  setSalesReportEndDate('');
                }}
                className="self-end py-2 px-3 text-xs font-semibold rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Active filter summary chips */}
          {(salesReportRepFilter !== 'All' || salesReportDateMode !== 'all') && (
            <div className="flex flex-wrap gap-2 pt-1">
              {salesReportRepFilter !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-bold">
                  Rep: {salesReportRepFilter}
                  <button onClick={() => setSalesReportRepFilter('All')} className="hover:text-indigo-800 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}
              {salesReportDateMode === 'monthly' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-bold">
                  Month: {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][salesReportMonth - 1]} {salesReportYear}
                  <button onClick={() => setSalesReportDateMode('all')} className="hover:text-indigo-800 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}
              {salesReportDateMode === 'custom' && (salesReportStartDate || salesReportEndDate) && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-bold">
                  Range: {salesReportStartDate || '...'} → {salesReportEndDate || '...'}
                  <button onClick={() => { setSalesReportStartDate(''); setSalesReportEndDate(''); setSalesReportDateMode('all'); }} className="hover:text-indigo-800 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 px-1">
          {filteredSalesReportLeads.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-400">
              No clients match your filters.
            </div>
          ) : (
            <table className="min-w-[1080px] w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-[5]">
                <tr className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
                  <th className="px-2.5 py-3 font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">#</th>
                  <th className="px-2.5 py-3 font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">Client ID</th>
                  <th className="px-2.5 py-3 font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">Created</th>
                  <th className="px-2.5 py-3 font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">Client Name</th>
                  <th className="px-2.5 py-3 font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">Business</th>
                  <th className="px-2.5 py-3 font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap w-[130px]">Plan Schedule</th>
                  <th className="px-2.5 py-3 font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap w-[150px]">Deliverables</th>
                  <th className="px-2.5 py-3 font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap text-right">Plan Amt</th>
                  <th className="px-2.5 py-3 font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap text-right">Advance</th>
                  <th className="px-2.5 py-3 font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap text-right">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                {filteredSalesReportLeads.map((lead, idx) => {
                  const schedules = getCampaignSchedule(lead);
                  const deliverables = getDeliverables(lead);
                  const plan = Number(lead.planAmount || 0);
                  const advance = Number(lead.advanceAmount || 0);
                  const pending = Number(lead.pendingAmount || 0);
                  const payStatus = getPaymentStatus(lead);
                  return (
                    <tr key={lead._id || idx} className="hover:bg-indigo-500/5 dark:hover:bg-indigo-500/3 transition-colors">
  <td className="px-2.5 py-2.5 text-gray-400 dark:text-gray-500 font-medium">{idx + 1}</td>
  <td className="px-2.5 py-2.5">
    <button
      type="button"
      onClick={() => {
        // setIsSalesReportOpen(false); 
        setViewedClientId(lead._id);
        setIsEditingClient(false);
        setEditedClientFields({});
      }}
      className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer break-words text-left"
    >
      {lead.clientId || '—'}
    </button>
  </td>
  <td className="px-2.5 py-2.5 text-gray-600 dark:text-gray-300">
    <div className="whitespace-nowrap">
      {lead.createdAt
        ? new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—'}
    </div>
    <div className="text-[10px] text-gray-400 dark:text-gray-500 break-words">{lead.salespersonName || '—'}</div>
  </td>
  <td className="px-2.5 py-2.5">
    <div className="font-semibold text-gray-900 dark:text-white break-words">{lead.clientName || '—'}</div>
    <span className={`inline-block mt-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${payStatus.color}`}>
      {payStatus.label}
    </span>
  </td>
  <td className="px-2.5 py-2.5">
    <div className="text-gray-600 dark:text-gray-300 break-words">{lead.companyName || '—'}</div>
    <div className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">{lead.mobileNumber || '—'}</div>
  </td>
  <td className="px-2.5 py-2.5">
    {schedules.length > 0 ? (
      <div className="flex flex-col gap-1">
        {schedules.map((s, si) => (
          <div key={si} className="flex flex-col gap-0.5 leading-tight">
            <span className="px-1 py-0.5 bg-indigo-500/10 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 rounded-md font-semibold text-[9px] whitespace-nowrap inline-block w-fit">
              {s.service}
            </span>
            <span className="text-[9px] text-gray-500 dark:text-gray-400 break-words">
              {s.start !== '—' || s.end !== '—' ? `${s.start} → ${s.end}` : 'Dates TBD'}
            </span>
          </div>
        ))}
      </div>
    ) : (
      <span className="text-gray-400 dark:text-gray-500">—</span>
    )}
  </td>
  <td className="px-2.5 py-2.5">
    {deliverables.length > 0 ? (
      <div className="flex flex-col gap-0.5">
        {deliverables.map((d, di) => (
          <span
            key={di}
            className={`px-1 py-0.5 rounded-md font-semibold text-[9px] leading-tight inline-block w-fit ${getDeliverableBadgeColor(d.status)}`}
            title={d.status}
          >
            {d.label}
          </span>
        ))}
      </div>
    ) : (
      <span className="text-gray-400 dark:text-gray-500">—</span>
    )}
  </td>
  <td className="px-2.5 py-2.5 text-right font-bold text-gray-900 dark:text-white whitespace-nowrap">
    {plan > 0 ? `₹${plan.toLocaleString('en-IN')}` : '—'}
  </td>
  <td className="px-2.5 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
    {editingAdvanceFor === lead._id ? (
      <div className="flex items-center justify-end gap-1.5">
        <input
          type="number"
          min="0"
          autoFocus
          value={editingAdvanceValue}
          onChange={(e) => setEditingAdvanceValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveAdvanceAmount(lead);
            if (e.key === 'Escape') { setEditingAdvanceFor(null); setEditingAdvanceValue(''); }
          }}
          className="w-20 rounded-lg border border-emerald-300 dark:border-emerald-700 py-1 px-2 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-right outline-none"
        />
        <button
          type="button"
          onClick={() => handleSaveAdvanceAmount(lead)}
          className="text-emerald-600 hover:text-emerald-700 cursor-pointer"
          title="Save"
        >
          <CheckCircle className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => { setEditingAdvanceFor(null); setEditingAdvanceValue(''); }}
          className="text-gray-400 hover:text-gray-600 cursor-pointer"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => { setEditingAdvanceFor(lead._id); setEditingAdvanceValue(String(advance || 0)); }}
        className="inline-flex items-center gap-1 hover:underline cursor-pointer group ml-auto"
        title="Edit advance amount"
      >
        {advance > 0 ? `₹${advance.toLocaleString('en-IN')}` : '—'}
        <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity" />
      </button>
    )}
  </td>
  <td className="px-2.5 py-2.5 text-right font-bold whitespace-nowrap">
    {pending > 0
      ? <span className="text-amber-600 dark:text-amber-400">₹{pending.toLocaleString('en-IN')}</span>
      : <span className="text-gray-400">—</span>}
  </td>
</tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Summary */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/60 rounded-b-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Showing <span className="font-bold text-gray-700 dark:text-gray-300">{filteredSalesReportLeads.length}</span> of <span className="font-bold text-gray-700 dark:text-gray-300">{leads.length}</span> total clients
          </p>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Plan Amount</p>
              <p className="text-base font-extrabold text-gray-900 dark:text-white">
                ₹{salesReportTotals.totalPlan.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-slate-700" />
            <div className="text-right">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Total Payable (Pending)</p>
              <p className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                ₹{salesReportTotals.totalPayable.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
})()}

      {/* Register Staff Member Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-150 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Register Staff Member</h3>
                <p className="text-xs text-gray-400 mt-0.5">Create new salesperson or technical accounts dynamically</p>
              </div>
              <button 
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-655 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              await handleCreateRep(e);
              setIsRegisterModalOpen(false);
            }} className="space-y-4">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-gray-750 dark:text-gray-300">
                  Staff Role
                </label>
                <select
                  value={newRepRole}
                  onChange={(e) => setNewRepRole(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-855 py-2.5 px-3.5 text-xs bg-white dark:bg-slate-900/40 text-gray-955 dark:text-white transition-all outline-hidden focus:border-indigo-500"
                >
                  <option value="salesperson">Salesperson</option>
                  <option value="technical">Technical Team Member</option>
                </select>
              </div>

              {newRepRole === 'technical' && (
                <div className="flex flex-col gap-1.5 w-full animate-in slide-in-from-top duration-155">
                  <label className="text-xs font-semibold text-gray-750 dark:text-gray-300">
                    Assign to Team
                  </label>
                  <select
                    value={newRepTeam}
                    onChange={(e) => setNewRepTeam(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-855 py-2.5 px-3.5 text-xs bg-white dark:bg-slate-900/40 text-gray-955 dark:text-white transition-all outline-hidden focus:border-indigo-500"
                  >
                    <option value="design">Designing Team</option>
                    <option value="developer">Developer Team</option>
                    <option value="ads">Ads Team</option>
                  </select>
                </div>
              )}

              <Input
                label="Staff Name"
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
              
              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-slate-800/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRegisterModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Add Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Sheets Integration Modal */}
      {isSheetsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-150 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Sheets Integration</h3>
                <p className="text-xs text-gray-400 mt-0.5">Configure the Google Sheets sync URL</p>
              </div>
              <button 
                onClick={() => setIsSheetsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-655 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
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
                  onClick={() => {
                    setIsSheetsModalOpen(false);
                    setIsHelpOpen(true);
                  }}
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
                        setIsSheetsModalOpen(false);
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
          </div>
        </div>
      )}

      {/* Marketing Campaign Services Summary Modal */}
      {activeSummaryModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-150 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{activeSummaryModal.categoryName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    activeSummaryModal.status === 'Completed'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : activeSummaryModal.status === 'In Progress'
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {activeSummaryModal.status}
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Showing {activeSummaryModal.clients.length} client{activeSummaryModal.clients.length !== 1 ? 's' : ''} in this category and status
                </p>
              </div>
              <button 
                onClick={() => setActiveSummaryModal(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-655 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto border border-gray-100 dark:border-slate-800/60 rounded-xl">
              {activeSummaryModal.clients.length === 0 ? (
                <div className="p-8 text-center text-gray-405 dark:text-gray-500 font-semibold text-sm">
                  No clients found matching this status.
                </div>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800/60">
                      <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Client ID</th>
                      <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Client Name</th>
                      <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Business / Brand</th>
                      <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Payment Status</th>
                      <th className="p-3 font-bold text-center text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-750 dark:text-gray-355 font-medium">
                    {activeSummaryModal.clients.map((client) => {
                      const clientPayment = getPaymentStatus(client);
                      return (
                        <tr key={client._id || client.id} className="hover:bg-indigo-500/3 dark:hover:bg-indigo-500/1 transition-colors">
                          <td className="p-3 text-indigo-650 dark:text-indigo-400 font-bold font-mono">
                            {client.clientId || 'N/A'}
                          </td>
                          <td className="p-3 text-gray-900 dark:text-white font-bold">
                            {client.clientName || 'N/A'}
                          </td>
                          <td className="p-3">
                            {client.businessName || 'N/A'}
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${clientPayment.color}`}>
                              {clientPayment.label}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setViewedClientId(client._id || client.id);
                                setIsEditingClient(false);
                                setEditedClientFields({});
                                setActiveSummaryModal(null);
                              }}
                              className="px-3 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850 rounded-lg shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-150 dark:border-slate-800/40">
              <Button 
                onClick={() => setActiveSummaryModal(null)}
                variant="outline" 
                size="sm"
              >
                Close Window
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}