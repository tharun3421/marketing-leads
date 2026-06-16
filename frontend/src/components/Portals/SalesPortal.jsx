import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Send, 
  Plus, 
  Edit3, 
  LogOut, 
  CheckCircle, 
  Clock, 
  FileText, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Lock,
  Globe,
  Mail,
  Phone,
  Layers,
  IndianRupeeIcon,
  Trash2,
  Bell,
  Sliders,
  User
} from 'lucide-react';
import confetti from 'canvas-confetti';

import Card from '../UI/Card';
import Button from '../UI/Button';
import { useAuth } from '../../context/AuthContext';

// Wizard Steps
import StepProfileAccess from '../FormSteps/StepProfileAccess';
import StepRequirementsBrief from '../FormSteps/StepRequirementsBrief';
import StepReviewSubmit from '../FormSteps/StepReviewSubmit';

const getStatusLabel = (status, team) => {
  if (status === 'Allocated') {
    if (team === 'developer') return 'Assigned to Developer Team';
    if (team === 'design') return 'Assigned to Design Team';
    if (team === 'ads') return 'Assigned to Ads Team';
    if (team === 'all') return 'Assigned to All Teams';
    return 'Assigned to Specific Team';
  }
  return status || 'Non-Allocated';
};

const STEPS_META = [
  { title: 'Client Profile & Credentials', desc: 'Identify details, contact channels & social logins' },
  { title: 'Campaign Brief & Requirements', desc: 'Deliverables count, targeting networks, creative details & budgets' },
  { title: 'Review & Submit Brief', desc: 'Final review of details and special instructions' }
];

export default function SalesPortal({ 
  notifications = [],
  setNotifications,
  onAddToast,
  onAddNotification
}) {
  const { user, logout, authFetch } = useAuth();
  const [leads, setLeads] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);

  const [wizardMode, setWizardMode] = useState(null); // 'create' | 'edit' | null
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterWorkflowStatus, setFilterWorkflowStatus] = useState('All');
  const [filterAssignedTeam, setFilterAssignedTeam] = useState('All');
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [deleteConfirmLead, setDeleteConfirmLead] = useState(null);

  // Central Clients Management filter states
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState('All');
  const [clientTeamFilter, setClientTeamFilter] = useState('All');
  const [clientStartDateFilter, setClientStartDateFilter] = useState('');
  const [clientEndDateFilter, setClientEndDateFilter] = useState('');

  // Fetch leads on mount
  const fetchLeads = async () => {
    setIsLoadingLeads(true);
    try {
      const res = await authFetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error('Fetch leads failed:', err);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Form setup for wizard
  const { 
    register, 
    handleSubmit, 
    trigger, 
    watch, 
    setValue, 
    reset,
    formState: { errors } 
  } = useForm({
    defaultValues: {
      salespersonName: '',
      clientName: '',
      companyName: '',
      businessCategory: '',
      websiteUrl: '',
      websiteRequired: false,
      websiteType: '',
      mobileNumber: '',
      email: '',
      facebookId: '',
      facebookPassword: '',
      instagramId: '',
      instagramPassword: '',
      postersRequired: 0,
      videosRequired: 0,
      adsRequired: 0,
      postersStatus: 'Pending',
      videosStatus: 'Pending',
      adsStatus: 'Pending',
      websiteStatus: 'Pending',
      postersPending: 0,
      videosPending: 0,
      adsPending: 0,
      websitePending: 0,
      platforms: [],
      brandColors: '#6366f1',
      targetAudience: '',
      competitors: '',
      adBudget: '',
      startDate: '',
      deliveryDeadline: '',
      notes: '',
      isConfirmed: false
    }
  });

  const formValues = watch();

  // Filter leads for this salesperson (backend already filters, but double check in frontend)
  const salespersonLeads = leads;

  // Advanced filters implementation
  const filteredLeads = salespersonLeads.filter(lead => {
    // 1. Status filter
    if (filterWorkflowStatus !== 'All' && (lead.workflowStatus || 'Non-Allocated') !== filterWorkflowStatus) {
      return false;
    }

    // 2. Assigned Team filter
    if (filterAssignedTeam !== 'All') {
      if (lead.assignedTeam !== filterAssignedTeam && lead.assignedTeam !== 'all') {
        return false;
      }
    }

    return true;
  });

  // Central Clients Management filter logic
  const filteredCentralClients = leads.filter(lead => {
    if (clientSearchQuery) {
      const q = clientSearchQuery.toLowerCase();
      const nameMatch = (lead.clientName || '').toLowerCase().includes(q);
      const phoneMatch = (lead.mobileNumber || '').toLowerCase().includes(q);
      if (!nameMatch && !phoneMatch) return false;
    }

    if (clientStatusFilter !== 'All' && (lead.workflowStatus || 'Non-Allocated') !== clientStatusFilter) {
      return false;
    }

    if (clientTeamFilter !== 'All') {
      if (lead.assignedTeam !== clientTeamFilter && lead.assignedTeam !== 'all') {
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

  // Metrics
  const totalMyClients = salespersonLeads.length;
  const pendingSendCount = salespersonLeads.filter(l => l.status !== 'Submitted to Admin').length;
  const adminSubmittedCount = salespersonLeads.filter(l => l.status === 'Submitted to Admin').length;

  const editingLead = leads.find(l => (l._id || l.id) === editingLeadId);
  const isReadOnlyProfile = wizardMode === 'edit' && editingLead && (editingLead.status === 'Client Submitted' || editingLead.status === 'Submitted to Admin');

  // Wizard Triggers
  const openCreateWizard = () => {
    reset({
      salespersonName: user ? user.name : '',
      clientName: '',
      companyName: '',
      businessCategory: '',
      websiteUrl: '',
      websiteRequired: false,
      websiteType: '',
      mobileNumber: '',
      email: '',
      facebookId: '',
      facebookPassword: '',
      instagramId: '',
      instagramPassword: '',
      postersRequired: 0,
      videosRequired: 0,
      adsRequired: 0,
      postersStatus: 'Pending',
      videosStatus: 'Pending',
      adsStatus: 'Pending',
      websiteStatus: 'Pending',
      postersPending: 0,
      videosPending: 0,
      adsPending: 0,
      websitePending: 0,
      platforms: [],
      brandColors: '#6366f1',
      targetAudience: '',
      competitors: '',
      adBudget: '',
      startDate: '',
      deliveryDeadline: '',
      notes: '',
      isConfirmed: false
    });
    setCurrentStep(0);
    setWizardMode('create');
  };

  const openEditWizard = (lead) => {
    reset({
      ...lead,
      isConfirmed: false
    });
    setEditingLeadId(lead._id || lead.id);
    setCurrentStep(0);
    setWizardMode('edit');
  };

  const closeWizard = () => {
    setWizardMode(null);
    setEditingLeadId(null);
  };

  const handleNextStep = async () => {
    const fieldsToValidate = [
      ['salespersonName', 'clientName', 'websiteUrl', 'websiteRequired', 'websiteType', 'mobileNumber', 'email', 'facebookId', 'facebookPassword', 'instagramId', 'instagramPassword'],
      ['postersRequired', 'videosRequired', 'adsRequired', 'platforms', 'brandColors', 'competitors', 'adBudget', 'startDate', 'deliveryDeadline'],
      ['notes']
    ];

    const isStepValid = await trigger(fieldsToValidate[currentStep]);
    if (isStepValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBackStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  // Quick service status updates directly on client cards
  const handleQuickStatusChange = async (leadId, service, newStatus) => {
    const lead = leads.find(l => (l._id || l.id) === leadId);
    if (!lead) return;

    let statusKey = '';
    if (service === 'posters') statusKey = 'postersStatus';
    else if (service === 'videos') statusKey = 'videosStatus';
    else if (service === 'ads') statusKey = 'adsStatus';
    else if (service === 'website') statusKey = 'websiteStatus';

    let pendingKey = '';
    let pendingVal = 0;
    if (service === 'posters') {
      pendingKey = 'postersPending';
      pendingVal = newStatus === 'Completed' ? 0 : (newStatus === 'Pending' ? Number(lead.postersRequired || 0) : Number((lead.postersPending ?? lead.postersRequired) || 0));
    } else if (service === 'videos') {
      pendingKey = 'videosPending';
      pendingVal = newStatus === 'Completed' ? 0 : (newStatus === 'Pending' ? Number(lead.videosRequired || 0) : Number((lead.videosPending ?? lead.videosRequired) || 0));
    } else if (service === 'ads') {
      pendingKey = 'adsPending';
      pendingVal = newStatus === 'Completed' ? 0 : (newStatus === 'Pending' ? Number(lead.adsRequired || 0) : Number((lead.adsPending ?? lead.adsRequired) || 0));
    } else if (service === 'website') {
      pendingKey = 'websitePending';
      pendingVal = newStatus === 'Completed' ? 0 : 1;
    }

    const updatedLeadData = {
      ...lead,
      [statusKey]: newStatus,
      [pendingKey]: pendingVal
    };

    try {
      const res = await authFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedLeadData)
      });

      if (res.ok) {
        fetchLeads();
        onAddToast('Status Updated', `Updated ${service} status to ${newStatus} for ${lead.clientName}.`, 'success');
        
        if (onAddNotification) {
          onAddNotification(`${user.name} updated ${service} status to "${newStatus}" for client ${lead.clientName}.`, 'update');
          if (newStatus === 'Completed') {
            onAddNotification(`Milestone reached: ${service} assets are fully completed for client ${lead.clientName}.`, 'completion');
          }
        }
      }
    } catch (err) {
      console.error('Quick status update failed:', err);
      onAddToast('Update Error', 'Failed to update milestone status.', 'error');
    }
  };

  const renderStatusBadge = (leadId, service, currentStatus) => {
    const colors = {
      'Pending': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350',
      'In Progress': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
      'Completed': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-350'
    };

    return (
      <span className={`
        text-[10px] font-extrabold rounded-md px-1.5 py-0.5 transition-colors
        ${colors[currentStatus] || colors['Pending']}
      `}>
        {currentStatus}
      </span>
    );
  };

  const handleQuickTeamChange = async (leadId, newTeam) => {
    const lead = leads.find(l => (l._id || l.id) === leadId);
    if (!lead) return;

    const updatedLeadData = {
      ...lead,
      assignedTeam: newTeam || null,
      assignedTo: null,
      assignedToName: null,
      workflowStatus: newTeam ? 'Allocated' : 'Non-Allocated'
    };

    try {
      const res = await authFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedLeadData)
      });

      if (res.ok) {
        fetchLeads();
        onAddToast('Route Updated', `Assigned ${lead.clientName} to ${newTeam ? newTeam.toUpperCase() : 'None'}.`, 'success');
        if (onAddNotification) {
          onAddNotification(`${user.name} routed client ${lead.clientName} to ${newTeam || 'none'}.`, 'update');
        }
      } else {
        onAddToast('Update Error', 'Failed to update team routing.', 'error');
      }
    } catch (err) {
      console.error('Quick team route update failed:', err);
      onAddToast('Update Error', 'Failed to update team routing.', 'error');
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
        fetchLeads();
        onAddToast('Assignment Updated', `Updated team assignment to ${newTeam ? newTeam.toUpperCase() : 'None'}.`, 'success');
        if (onAddNotification) {
          onAddNotification(`Salesperson updated team assignment of client to ${newTeam || 'none'}.`, 'update');
        }
      }
    } catch (err) {
      console.error(err);
      onAddToast('Error', 'Failed to update team assignment.', 'error');
    }
  };

  const handleCentralStatusChange = async (leadId, newStatus) => {
    try {
      const res = await authFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ workflowStatus: newStatus })
      });
      if (res.ok) {
        fetchLeads();
        onAddToast('Status Updated', `Updated workflow status to ${newStatus}.`, 'success');
        if (onAddNotification) {
          onAddNotification(`Salesperson updated workflow status of client to ${newStatus}.`, 'update');
        }
      }
    } catch (err) {
      console.error(err);
      onAddToast('Error', 'Failed to update client status.', 'error');
    }
  };

  const handleDeleteClick = (lead) => {
    setDeleteConfirmLead(lead);
  };

  const confirmDeleteLead = async () => {
    if (!deleteConfirmLead) return;
    const leadId = deleteConfirmLead._id || deleteConfirmLead.id;
    try {
      const res = await authFetch(`/api/leads/${leadId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchLeads();
        onAddToast('Lead Deleted', `Removed client brief record for ${deleteConfirmLead.clientName}.`, 'info');
        if (onAddNotification) {
          onAddNotification(`Client folder for ${deleteConfirmLead.clientName} was deleted by ${user.name}.`, 'update');
        }
      }
    } catch (err) {
      console.error('Delete lead failed:', err);
      onAddToast('Delete Error', 'Failed to delete lead from database.', 'error');
    } finally {
      setDeleteConfirmLead(null);
    }
  };

  // Submit/Update lead wizard data
  const handleWizardSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const postersPendingVal = data.postersStatus === 'Completed' ? 0 : (data.postersStatus === 'Pending' ? Number(data.postersRequired || 0) : Math.min(Number(data.postersRequired || 0), Number(data.postersPending ?? data.postersRequired)));
      const videosPendingVal = data.videosStatus === 'Completed' ? 0 : (data.videosStatus === 'Pending' ? Number(data.videosRequired || 0) : Math.min(Number(data.videosRequired || 0), Number(data.videosPending ?? data.videosRequired)));
      const adsPendingVal = data.adsStatus === 'Completed' ? 0 : (data.adsStatus === 'Pending' ? Number(data.adsRequired || 0) : Math.min(Number(data.adsRequired || 0), Number(data.adsPending ?? data.adsRequired)));
      const websitePendingVal = data.websiteRequired ? (data.websiteStatus === 'Completed' ? 0 : 1) : 0;

      if (wizardMode === 'create') {
        const payload = {
          ...data,
          postersStatus: data.postersStatus || 'Pending',
          videosStatus: data.videosStatus || 'Pending',
          adsStatus: data.adsStatus || 'Pending',
          websiteStatus: data.websiteStatus || 'Pending',
          postersPending: postersPendingVal,
          videosPending: videosPendingVal,
          adsPending: adsPendingVal,
          websitePending: websitePendingVal
        };

        const res = await authFetch('/api/leads', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          fetchLeads();
          onAddToast('Lead Created', `Added draft lead for ${payload.clientName}.`, 'success');
          if (onAddNotification) {
            onAddNotification(`New client brief folder initialized for ${payload.clientName} by salesperson ${user.name}.`, 'submission');
          }
        }
      } else {
        const payload = {
          ...data,
          postersPending: postersPendingVal,
          videosPending: videosPendingVal,
          adsPending: adsPendingVal,
          websitePending: websitePendingVal
        };

        const res = await authFetch(`/api/leads/${editingLeadId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          fetchLeads();
          onAddToast('Lead Updated', `Updated lead records for ${payload.clientName}.`, 'success');
          if (onAddNotification) {
            onAddNotification(`Client brief folder details modified for ${payload.clientName} by salesperson ${user.name}.`, 'update');
          }
        }
      }
      closeWizard();
    } catch (err) {
      console.error(err);
      onAddToast('Error', 'An error occurred while saving the lead.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dispatch individual lead to sheets via server API
  const handleSendToAdmin = async (lead) => {
    const leadId = lead._id || lead.id;
    onAddToast('Transmitting Brief', 'Sending lead details to Google Sheets and Admin dashboard...', 'info');
    
    try {
      const res = await authFetch(`/api/leads/${leadId}/sync`, {
        method: 'POST'
      });

      if (res.ok) {
        fetchLeads();
        onAddToast('Sync Complete', `Brief for ${lead.clientName} saved to Google Sheets and Admin.`, 'success');
        
        // Trigger reward confetti
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 }
        });
      } else {
        const errData = await res.json();
        onAddToast('Sync Error', errData.message || 'Failed to dispatch lead to Google Sheets.', 'error');
      }
    } catch (err) {
      console.error(err);
      onAddToast('Sync Error', 'Failed to dispatch lead to Google Sheets.', 'error');
    }
  };

  // Derive overall client project status and completion stats
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

  const completedProjectsCount = salespersonLeads.filter(l => getProjectStatus(l) === 'Completed').length;
  const pendingProjectsCount = salespersonLeads.filter(l => getProjectStatus(l) === 'Pending').length;
  const inProgressProjectsCount = salespersonLeads.filter(l => getProjectStatus(l) === 'In Progress').length;
  const allocatedClientsCount = salespersonLeads.filter(l => l.workflowStatus === 'Allocated').length;
  const nonAllocatedClientsCount = salespersonLeads.filter(l => (l.workflowStatus || 'Non-Allocated') === 'Non-Allocated').length;

  // Personal performance service metrics
  let totalTasks = 0;
  let completedTasks = 0;
  salespersonLeads.forEach(lead => {
    if (Number(lead.postersRequired) > 0) {
      totalTasks++;
      if (lead.postersStatus === 'Completed') completedTasks++;
    }
    if (Number(lead.videosRequired) > 0) {
      totalTasks++;
      if (lead.videosStatus === 'Completed') completedTasks++;
    }
    if (Number(lead.adsRequired) > 0) {
      totalTasks++;
      if (lead.adsStatus === 'Completed') completedTasks++;
    }
    if (lead.websiteRequired) {
      totalTasks++;
      if (lead.websiteStatus === 'Completed') completedTasks++;
    }
  });

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Sales Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/50 dark:border-slate-800/50 pb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500 animate-pulse-ring rounded-full" /> Representative workspace
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Active Identity: <strong className="text-gray-900 dark:text-slate-100 font-semibold">{user ? user.name : 'Salesperson'}</strong>
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
            variant="primary"
            size="sm"
            onClick={openCreateWizard}
            icon={Plus}
          >
            Create New Client
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            icon={LogOut}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-indigo-500/5">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Clients</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{totalMyClients}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-amber-500/5">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Non-Allocated</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{nonAllocatedClientsCount}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-blue-500/5">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Allocated</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{allocatedClientsCount}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-indigo-500/5">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">In Progress</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{inProgressProjectsCount}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-emerald-500/5">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{completedProjectsCount}</p>
          </div>
        </div>
      </div>

       {/* Central Clients Section */}
          <div className="mt-8">
            <Card title="Clients" subtitle="Central client management roster for tracking and team routing">
              <div className="space-y-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search by client name or WhatsApp number..."
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
                      <option value="design">Design Team</option>
                      <option value="developer">Development Team</option>
                      <option value="ads">Ads Team</option>
                      <option value="all">All Teams</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-150/40 dark:border-slate-800/40 pt-4">
                  {/* Date Filters */}
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-650 dark:text-gray-400">
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
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client Name</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">WhatsApp Number</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Assigned To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-750 dark:text-gray-350 font-medium">
                    {filteredCentralClients.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-gray-400 dark:text-gray-500 font-normal">
                          No clients found matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredCentralClients.map((client) => {
                        const statusColors = {
                          'Completed': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                          'In Progress': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
                          'Allocated': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                          'Non-Allocated': 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        };
                        return (
                          <tr key={client._id} className="hover:bg-indigo-500/3 dark:hover:bg-indigo-500/1 transition-colors">
                            <td className="p-3 font-bold text-gray-900 dark:text-white">
                              {new Date(client.createdAt || client.timestamp).toLocaleDateString()}
                            </td>
                            <td className="p-3 text-gray-900 dark:text-white font-bold">{client.clientName}</td>
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
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold">
                                {client.assignedTeam === 'design' && 'Design Team'}
                                {client.assignedTeam === 'developer' && 'Development Team'}
                                {client.assignedTeam === 'ads' && 'Ads Team'}
                                {client.assignedTeam === 'all' && 'All Teams'}
                                {!client.assignedTeam && 'Not Assigned'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
      <div className="w-full">
        <Card title="My Onboarded Clients" subtitle="Review, edit, and transmit client folders to the central admin sheet">

          {isLoadingLeads ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-gray-500">Retrieving campaign briefs from database...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 dark:border-slate-800/80 rounded-xl bg-gray-50/30 dark:bg-slate-900/10">
              <FileText className="w-10 h-10 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {salespersonLeads.length === 0 
                  ? 'You have not registered any clients yet. Click "+ Create New Client" to start.'
                  : 'No clients found matching the selected filters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeads.map((lead) => {
                const leadId = lead._id || lead.id;
                const hasUnsavedChanges = lead.status !== 'Submitted to Admin';
                  return (
                    <div 
                      key={leadId} 
                      className={`
                        p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden glass-card
                        ${lead.status === 'Submitted to Admin'
                          ? 'border-emerald-500/15 bg-emerald-500/2 dark:bg-emerald-500/1 hover:shadow-lg' 
                          : lead.status === 'Client Submitted'
                            ? 'border-indigo-500/15 bg-indigo-500/2 dark:bg-indigo-500/1 hover:shadow-lg'
                            : 'border-gray-205 dark:border-slate-800/60 hover:shadow-lg'
                        }
                      `}
                    >
                      {/* Status Banner */}
                      <div className="absolute top-0 right-0 flex items-center gap-1.5">
                        <span className={`
                          text-[9px] font-bold px-2 py-1 rounded-bl-xl border-l border-b uppercase tracking-wider
                          ${lead.status === 'Submitted to Admin'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10'
                            : 'bg-slate-500/10 text-slate-600 border-slate-500/10'
                          }
                        `}>
                          {lead.status === 'Submitted to Admin' ? 'Synced' : 'Draft'}
                        </span>
                        <span className={`
                          text-[9px] font-extrabold px-3 py-1 rounded-bl-xl border-l border-b uppercase tracking-wider
                          ${lead.workflowStatus === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-500/15 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : lead.workflowStatus === 'In Progress'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-500/15 dark:bg-indigo-950/40 dark:text-indigo-300'
                              : lead.workflowStatus === 'Allocated'
                                ? 'bg-blue-50 text-blue-700 border-blue-500/15 dark:bg-blue-955/40 dark:text-blue-300'
                                : 'bg-amber-50 text-amber-700 border-amber-500/15 dark:bg-amber-955/40 dark:text-amber-300'
                          }
                        `}>
                          {getStatusLabel(lead.workflowStatus, lead.assignedTeam)}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {/* Header */}
                        <div>
                          <h4 className="text-base font-bold text-gray-900 dark:text-white pr-20 truncate">{lead.clientName}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5 font-medium">
                            {lead.companyName || 'No Company'} • {lead.businessCategory || 'No Category'}
                          </p>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-1 gap-1.5 text-xs text-gray-600 dark:text-gray-400 font-medium border-t border-gray-100 dark:border-slate-800/40 pt-2.5">
                          <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /> {lead.email}</div>
                          <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> WhatsApp: {lead.mobileNumber}</div>
                          {lead.websiteUrl && <div className="flex items-center gap-2 truncate"><Globe className="w-3.5 h-3.5 text-gray-400" /> {lead.websiteUrl}</div>}
                          <div className="flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-gray-400" /> {lead.platforms ? lead.platforms.length : 0} channels, {Number(lead.postersRequired || 0) + Number(lead.videosRequired || 0)} assets</div>
                          <div className="flex items-start gap-2 flex-col bg-slate-500/5 dark:bg-slate-500/2 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 mt-1">
                            <div className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider mb-0.5">Budget Specifications</div>
                            <div className="grid grid-cols-2 w-full gap-x-2 gap-y-1 text-[11px]">
                              <div>Plan Amount: <strong className="text-gray-900 dark:text-white">₹{lead.planAmount || '0'}</strong></div>
                              <div>Advance: <strong className="text-gray-900 dark:text-white">₹{lead.advanceAmount || '0'}</strong></div>
                              <div>Pending: <strong className="text-amber-600 dark:text-amber-400 font-bold">₹{lead.pendingAmount || '0'}</strong></div>
                              <div>Ad Budget: <strong className="text-emerald-600 dark:text-emerald-450">₹{lead.adBudget || '0'}</strong></div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-550 dark:text-gray-300 font-bold mt-1">
                            <User className="w-3.5 h-3.5 text-indigo-500 animate-pulse-ring rounded-full" />
                            <span>Assignee: {lead.assignedToName || <span className="italic text-gray-400 font-normal">Unclaimed ({lead.assignedTeam === 'all' ? 'All Teams' : lead.assignedTeam ? `${lead.assignedTeam.toUpperCase()} Team` : 'None'})</span>}</span>
                          </div>
                          {lead.remarks && (
                            <div className="mt-1.5 p-2 bg-slate-500/5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 text-[11px] leading-relaxed">
                              <span className="text-gray-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">Technical Remarks</span>
                              <p className="text-gray-700 dark:text-gray-350">{lead.remarks}</p>
                            </div>
                          )}
                        </div>

                        {/* Service status tracking dropdowns */}
                        <div className="border-t border-gray-100 dark:border-slate-800/40 pt-3.5 space-y-2">
                          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            Service Milestone Status
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {Number(lead.postersRequired) > 0 && (
                              <div className="flex items-center justify-between p-2 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl border border-gray-150/40 dark:border-slate-800/40">
                                <span className="font-semibold text-gray-600 dark:text-gray-400 truncate mr-2">Posters ({lead.postersRequired})</span>
                                {renderStatusBadge(leadId, 'posters', lead.postersStatus || 'Pending')}
                              </div>
                            )}
                            {Number(lead.videosRequired) > 0 && (
                              <div className="flex items-center justify-between p-2 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl border border-gray-150/40 dark:border-slate-800/40">
                                <span className="font-semibold text-gray-600 dark:text-gray-400 truncate mr-2">Videos ({lead.videosRequired})</span>
                                {renderStatusBadge(leadId, 'videos', lead.videosStatus || 'Pending')}
                              </div>
                            )}
                            {Number(lead.adsRequired) > 0 && (
                              <div className="flex items-center justify-between p-2 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl border border-gray-150/40 dark:border-slate-800/40">
                                <span className="font-semibold text-gray-600 dark:text-gray-400 truncate mr-2">Ads ({lead.adsRequired})</span>
                                {renderStatusBadge(leadId, 'ads', lead.adsStatus || 'Pending')}
                              </div>
                            )}
                            {lead.websiteRequired && (
                              <div className="flex items-center justify-between p-2 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl border border-gray-150/40 dark:border-slate-800/40 col-span-1 sm:col-span-2">
                                <span className="font-semibold text-gray-600 dark:text-gray-400 truncate mr-2">Website ({lead.websiteType || 'Dev'})</span>
                                {renderStatusBadge(leadId, 'website', lead.websiteStatus || 'Pending')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-between border-t border-gray-100 dark:border-slate-800/40 pt-3.5 mt-1 gap-2">
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditWizard(lead)}
                            icon={Edit3}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(lead)}
                            className="hover:!text-red-500 hover:!border-red-500/30 hover:!bg-red-500/5 text-gray-400 dark:text-gray-500 cursor-pointer"
                            title="Delete Client"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </Button>
                        </div>

                        {/* Assign to Technical Team select dropdown option inside actions */}
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.assignedTeam || ''}
                            onChange={(e) => handleQuickTeamChange(leadId, e.target.value)}
                            className="text-xs font-bold rounded-xl px-2.5 py-1.5 border border-indigo-150/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 outline-hidden transition-all shadow-sm"
                          >
                            <option value="">Assign to Technical Team...</option>
                            <option value="design">Design Team</option>
                            <option value="developer">Developer Team</option>
                            <option value="ads">Ads Team</option>
                            <option value="all">All Teams</option>
                          </select>
                        </div>

                        <div onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant={hasUnsavedChanges ? "primary" : "outline"}
                            size="sm"
                            disabled={!hasUnsavedChanges}
                            onClick={() => handleSendToAdmin(lead)}
                            icon={Send}
                          >
                            {lead.status === 'Submitted to Admin' ? 'Synced' : 'Send to Admin'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

         
        </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmLead && (
          <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-4 z-150">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-850 p-6 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/10 text-red-600 rounded-full flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Client Brief Folder?</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">This action is irreversible and deletes the local DB record.</p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 leading-normal">
                  Are you sure you want to permanently delete the onboarding brief database file for <strong className="text-gray-900 dark:text-white font-semibold">{deleteConfirmLead.clientName}</strong>?
                </p>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-slate-800/40">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmLead(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="!bg-red-600 hover:!bg-red-700 !border-red-600 hover:!border-red-700 text-white"
                    onClick={confirmDeleteLead}
                  >
                    Delete Folder
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reusable Form Wizard Modal Overlay */}
      <AnimatePresence>
        {wizardMode && (
          <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-4 z-150 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden my-8 max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-850">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <FileText className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {wizardMode === 'create' ? 'Create New Onboarding Brief' : 'Edit Brief Specifications'}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {STEPS_META[currentStep].title}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={closeWizard}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 dark:bg-slate-850 h-1 relative overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / STEPS_META.length) * 100}%` }}
                />
              </div>

              {/* Form Content */}
              <div className="p-6 overflow-y-auto flex-1">
                <form onSubmit={handleSubmit(handleWizardSubmit)} className="space-y-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      transition={{ duration: 0.2 }}
                    >
                      {currentStep === 0 && (
                        <StepProfileAccess 
                          register={register} 
                          errors={errors} 
                          watch={watch} 
                          isClientPortal={false}
                          salespersonsList={[]}
                        />
                      )}
                      {currentStep === 1 && (
                        <StepRequirementsBrief 
                          register={register} 
                          errors={errors} 
                          setValue={setValue} 
                          watch={watch} 
                          isClientPortal={false}
                        />
                      )}
                      {currentStep === 2 && (
                        <StepReviewSubmit 
                          register={register} 
                          watch={watch} 
                          errors={errors} 
                          formValues={formValues}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Actions footer */}
                  <div className="flex justify-between items-center border-t border-gray-100 dark:border-slate-800/40 pt-5 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackStep}
                      disabled={currentStep === 0 || isSubmitting}
                      icon={ChevronLeft}
                    >
                      Previous
                    </Button>

                    {currentStep < STEPS_META.length - 1 ? (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleNextStep}
                        icon={ChevronRight}
                        iconPosition="right"
                      >
                        Continue
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                        disabled={!formValues.isConfirmed}
                        icon={Send}
                      >
                        {wizardMode === 'create' ? 'Save Campaign Brief' : 'Update Campaign Spec'}
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
