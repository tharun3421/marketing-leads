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
  Bell,
  Trash2,
  KeyRound,
  Sliders,
  AlertCircle,
  Edit3
} from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { Input } from '../UI/Input';
import AppsScriptGuide from '../Help/AppsScriptGuide';
import { useAuth } from '../../context/AuthContext';

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

  // Client Details modal states
  const [viewedClientId, setViewedClientId] = useState(null);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editedClientFields, setEditedClientFields] = useState({});

  // Relocated header config modals states
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

  // Central Clients Management filter states
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState('All');
  const [clientTeamFilter, setClientTeamFilter] = useState('All');
  const [clientStartDateFilter, setClientStartDateFilter] = useState('');
  const [clientEndDateFilter, setClientEndDateFilter] = useState('');

  // Advanced filters state
  const [filterWorkflowStatus, setFilterWorkflowStatus] = useState('All');
  const [filterAssignedTeam, setFilterAssignedTeam] = useState('All');

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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
        if (onAddNotification) {
          onAddNotification(`Admin updated workflow status of client to ${newStatus}.`, 'update');
        }
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
        if (onAddNotification) {
          onAddNotification(`Admin updated team assignment of client to ${newTeam || 'none'}.`, 'update');
        }
      }
    } catch (err) {
      console.error(err);
      onAddToast('Error', 'Failed to update team assignment.', 'error');
    }
  };

  // Central Clients Management filter logic
  const filteredCentralClients = leads.filter(lead => {
    if (clientSearchQuery) {
      const q = clientSearchQuery.toLowerCase();
      const nameMatch = (lead.clientName || '').toLowerCase().includes(q);
      const phoneMatch = (lead.mobileNumber || '').toLowerCase().includes(q);
      const idMatch = (lead.clientId || '').toLowerCase().includes(q);
      if (!nameMatch && !phoneMatch && !idMatch) return false;
    }

    if (clientStatusFilter !== 'All' && (lead.workflowStatus || 'Non-Allocated') !== clientStatusFilter) {
      return false;
    }

    if (clientTeamFilter !== 'All') {
      if (!hasTeamVal(lead.assignedTeam, clientTeamFilter)) {
        return false;
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
        if (onAddNotification) {
          onAddNotification(`${selectedLeadIds.length} campaign task(s) updated by Admin.`, 'info');
        }
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
  const inspectedLeads = selectedRep 
    ? (selectedRep === 'All' ? leads : leads.filter(l => l.salespersonName === selectedRep))
    : (selectedTech ? leads.filter(l => 
        (l.assignedDeveloper && l.assignedDeveloper.toString() === selectedTech._id.toString()) ||
        (l.assignedDesigner && l.assignedDesigner.toString() === selectedTech._id.toString()) ||
        (l.assignedAdSpecialist && l.assignedAdSpecialist.toString() === selectedTech._id.toString()) ||
        (l.assignedToName && l.assignedToName.includes(selectedTech.name)) ||
        l.assignedToName === selectedTech.name
      ) : []);

  const filteredInspectedLeads = inspectedLeads.filter(lead => {
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
            <div className="overflow-x-auto border border-gray-100 dark:border-slate-800/60 rounded-xl">
              <table className="min-w-[900px] w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800/60">
                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client ID</th>
                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client Contact</th>
                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Company & Sector</th>
                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Representative</th>
                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Assignee</th>
                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Timestamp</th>
                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Deliverables Status</th>
                    <th className="p-3 font-semibold text-center text-gray-700 dark:text-gray-300">Workflow Status</th>
                    <th className="p-3 font-semibold text-center text-gray-700 dark:text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40">
                  {filteredInspectedLeads.map((lead, idx) => (
                    <tr key={idx} className="hover:bg-indigo-500/5 dark:hover:bg-indigo-500/2 transition-colors">
                      <td className="p-3">
                        <button
                          onClick={() => {
                            setViewedClientId(lead._id);
                            setIsEditingClient(false);
                            setEditedClientFields({});
                          }}
                          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          {lead.clientId || 'N/A'}
                        </button>
                      </td>
                      <td className="p-3 font-medium text-gray-900 dark:text-white">
                        <div>{lead.clientName}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{lead.email}</div>
                      </td>
                      <td className="p-3 text-gray-650 dark:text-gray-300">
                        <div>{lead.companyName || '—'}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{lead.businessCategory || '—'}</div>
                      </td>
                      <td className="p-3 text-sm text-indigo-650 dark:text-indigo-400 font-bold">
                        {lead.salespersonName}
                      </td>
                      <td className="p-3 text-xs">
                        {lead.assignedToName ? (
                          <div className="space-y-1">
                            <span className="bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 rounded-lg px-2 py-0.5 font-bold text-indigo-655 dark:text-indigo-400 block w-fit">
                              👤 {lead.assignedToName}
                            </span>
                            <span className="text-[10px] text-gray-455 dark:text-gray-555 block font-semibold">
                              Team: {getTeamDisplayLabel(lead.assignedTeam)}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-0.5 block w-fit">
                              Queue: {getTeamDisplayLabel(lead.assignedTeam)}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-555 italic block font-semibold">
                              Unclaimed
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-xs text-gray-400 dark:text-gray-550 whitespace-nowrap">
                        {(lead.createdAt || lead.timestamp) ? new Date(lead.createdAt || lead.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-3 text-xs">
                        <div className="space-y-1">
                          {/* Design Team Deliverables (Posters & Videos) */}
                          {(!selectedTech || selectedTech.team === 'design') && (
                            <>
                              {Number(lead.postersRequired || 0) > 0 && (
                                <div className="flex items-center gap-1.5 text-gray-650 dark:text-gray-400 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                  <span>Posters: </span>
                                  <span className="font-bold text-gray-900 dark:text-white">
                                    {Number(lead.postersRequired || 0) - (Number(lead.postersPending ?? (lead.postersStatus === 'Completed' ? 0 : lead.postersRequired || 0)))} Comp / {Number(lead.postersPending ?? (lead.postersStatus === 'Completed' ? 0 : lead.postersRequired || 0))} Pend
                                  </span>
                                </div>
                              )}
                              {Number(lead.videosRequired || 0) > 0 && (
                                <div className="flex items-center gap-1.5 text-gray-650 dark:text-gray-400 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                  <span>Videos: </span>
                                  <span className="font-bold text-gray-900 dark:text-white">
                                    {Number(lead.videosRequired || 0) - (Number(lead.videosPending ?? (lead.videosStatus === 'Completed' ? 0 : lead.videosRequired || 0)))} Comp / {Number(lead.videosPending ?? (lead.videosStatus === 'Completed' ? 0 : lead.videosRequired || 0))} Pend
                                  </span>
                                </div>
                              )}
                            </>
                          )}

                          {/* Ads Team Deliverables */}
                          {(!selectedTech || selectedTech.team === 'ads') && Number(lead.adsRequired || 0) > 0 && (
                            <div className="flex items-center gap-1.5 text-gray-650 dark:text-gray-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              <span>Ads: </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {Number(lead.adsRequired || 0) - (Number(lead.adsPending ?? (lead.adsStatus === 'Completed' ? 0 : lead.adsRequired || 0)))} Comp / {Number(lead.adsPending ?? (lead.adsStatus === 'Completed' ? 0 : lead.adsRequired || 0))} Pend
                              </span>
                            </div>
                          )}

                          {/* Developer Team Deliverables */}
                          {(!selectedTech || selectedTech.team === 'developer') && lead.websiteRequired && (
                            <div className="flex items-center gap-1.5 text-gray-650 dark:text-gray-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              <span>Website: </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {lead.websiteStatus === 'Completed' ? '1' : '0'} Comp / {lead.websiteStatus === 'Completed' ? '0' : '1'} Pend ({lead.websiteStatus || 'Pending'})
                              </span>
                            </div>
                          )}

                          {/* Fallback if no deliverables are displayed for this view */}
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
                        <span className={`
                          text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider
                          ${lead.workflowStatus === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : lead.workflowStatus === 'In Progress'
                              ? 'bg-indigo-500/10 text-indigo-655 border-indigo-500/20'
                              : lead.workflowStatus === 'Allocated'
                                ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }
                        `}>
                          {getStatusLabel(lead.workflowStatus, lead.assignedTeam)}
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
        return { title: 'Non-Allocated Clients', list: leads.filter(l => (l.workflowStatus || 'Non-Allocated') === 'Non-Allocated') };
      case 'allocated':
        return { title: 'Allocated Clients', list: leads.filter(l => l.workflowStatus === 'Allocated') };
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
        if (onAddNotification) {
          onAddNotification(`Admin updated client records for "${editedClientFields.clientName || lead.clientName}".`, 'update');
        }
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
              {leads.filter(l => (l.workflowStatus || 'Non-Allocated') === 'Non-Allocated').length}
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
              {leads.filter(l => l.workflowStatus === 'Allocated').length}
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

      {/* Central Clients Section */}
      <Card title="Clients" subtitle="Central client management roster synchronized in real-time across portals">
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by client ID, name, or WhatsApp number..."
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
              {(clientSearchQuery || clientStatusFilter !== 'All' || clientTeamFilter !== 'All' || clientStartDateFilter || clientEndDateFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setClientSearchQuery('');
                    setClientStatusFilter('All');
                    setClientTeamFilter('All');
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

        <div className="overflow-x-auto border border-gray-100 dark:border-slate-800/60 rounded-xl">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800/60">
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client ID</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client Name</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">WhatsApp Number</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Assigned To</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Created By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-750 dark:text-gray-355 font-medium">
              {filteredCentralClients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-400 dark:text-gray-550 font-normal">
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
                    <td className="p-3 font-bold text-gray-900 dark:text-white">
                      {new Date(client.createdAt || client.timestamp).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-gray-900 dark:text-white font-bold">
                      <div>{client.clientName}</div>
                      {client.companyName && (
                        <div className="text-xs text-gray-400 dark:text-gray-555 font-normal mt-0.5">
                          {client.companyName}
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-mono">{client.mobileNumber}</td>
                    <td className="p-3">
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
                    </td>
                    <td className="p-3">
                      {client.assignedToName ? (
                        <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-max">
                          👤 {client.assignedToName}
                        </span>
                      ) : (
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold">
                          {getTeamDisplayLabel(client.assignedTeam)}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-indigo-650 dark:text-indigo-400 font-semibold">
                      {client.salespersonName || '-'}
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
        
        {/* Salesforce Directory */}
        <Card title="Salesforce Directory" subtitle="Inspect client brief portfolios compiled by representatives">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 border-b border-gray-100 dark:border-slate-800/40 pb-4">
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
          
          <div className="max-h-[420px] overflow-y-auto pr-1.5 scrollbar-thin">
            <div className="grid grid-cols-1 gap-4">
              {repStats.map((rep, idx) => (
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
          </div>
        </Card>

        {/* Technical Team Directory */}
        <Card title="Technical Team Directory" subtitle="Manage technical specialist accounts and credentials">
          {technicalList.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 dark:border-slate-800/80 rounded-xl bg-gray-50/30 dark:bg-slate-900/10">
              <Users className="w-8 h-8 text-gray-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs font-medium text-gray-555 dark:text-gray-400">
                No technical team members have been registered yet.
              </p>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto pr-1.5 scrollbar-thin">
              <div className="grid grid-cols-1 gap-4">
                {technicalList.map((tech, idx) => {
                  const techLeads = leads.filter(l => 
                    (l.assignedTo && l.assignedTo.toString() === tech._id.toString()) ||
                    (l.assignedDeveloper && l.assignedDeveloper.toString() === tech._id.toString()) ||
                    (l.assignedDesigner && l.assignedDesigner.toString() === tech._id.toString()) ||
                    (l.assignedAdSpecialist && l.assignedAdSpecialist.toString() === tech._id.toString()) ||
                    l.assignedToName === tech.name ||
                    (l.assignedToName && l.assignedToName.includes(tech.name))
                  );
                  const claimed = techLeads.length;
                  const completed = techLeads.filter(l => l.workflowStatus === 'Completed').length;
                  const inProgress = techLeads.filter(l => l.workflowStatus === 'In Progress').length;
                  const pending = techLeads.filter(l => l.workflowStatus === 'Allocated' || (l.workflowStatus || 'Non-Allocated') === 'Non-Allocated').length;

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
                          Done
                        </div>
                        <div>
                          <span className="block text-indigo-505 text-xs font-bold">{inProgress}</span>
                          Active
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
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800/60">
                          <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client ID</th>
                          <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client Name</th>
                          <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">WhatsApp</th>
                          <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Workflow Status</th>
                          <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Assigned To</th>
                          <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Created By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-750 dark:text-gray-355 font-medium">
                        {list.map((client) => (
                          <tr key={client._id} className="hover:bg-indigo-500/3 dark:hover:bg-indigo-500/1 transition-colors">
                            <td className="p-3">
                              <button
                                onClick={() => {
                                  setActiveMetricsModal(null); // Close metrics list modal
                                  setViewedClientId(client._id); // Open profile editor modal
                                  setIsEditingClient(false);
                                  setEditedClientFields({});
                                }}
                                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                              >
                                {client.clientId || 'N/A'}
                              </button>
                            </td>
                            <td className="p-3 text-gray-900 dark:text-white font-bold">
                              <div>{client.clientName}</div>
                              {client.companyName && (
                                <div className="text-xs text-gray-405 dark:text-gray-500 font-normal mt-0.5">
                                  {client.companyName}
                                </div>
                              )}
                            </td>
                            <td className="p-3 font-mono">{client.mobileNumber}</td>
                            <td className="p-3">
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
                            </td>
                            <td className="p-3 text-xs">
                              {client.assignedToName ? (
                                <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 w-max">
                                  👤 {client.assignedToName}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="p-3 text-indigo-650 dark:text-indigo-400 font-semibold">
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
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-150 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in duration-200">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Column 1 */}
                  <div className="space-y-6">
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
                      <div className="grid grid-cols-2 gap-3">
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
                      <div className="grid grid-cols-2 gap-3">
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
                      </div>
                    </div>

                  </div>

                  {/* Column 2 */}
                  <div className="space-y-6">
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
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase">Target Audience</label>
                        <input 
                          type="text" 
                          value={editedClientFields.targetAudience ?? client.targetAudience ?? ''}
                          onChange={(e) => handleClientFieldChange('targetAudience', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2 px-3 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                        />
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



    </div>
  );
}
