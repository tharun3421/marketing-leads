import React, { useState } from 'react';
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
  Settings,
  Mail,
  Phone,
  Layers,
  IndianRupeeIcon,
  Trash2,
  Bell
} from 'lucide-react';
import confetti from 'canvas-confetti';

import Card from '../UI/Card';
import Button from '../UI/Button';
import { Select } from '../UI/Input';

// Wizard Steps
import StepProfileAccess from '../FormSteps/StepProfileAccess';
import StepRequirementsBrief from '../FormSteps/StepRequirementsBrief';
import StepReviewSubmit from '../FormSteps/StepReviewSubmit';

const STEPS_META = [
  { title: 'Client Profile & Credentials', desc: 'Identify details, contact channels & social logins' },
  { title: 'Campaign Brief & Requirements', desc: 'Deliverables count, targeting networks, creative details & budgets' },
  { title: 'Review & Submit Brief', desc: 'Final review of details and special instructions' }
];

export default function SalesPortal({ 
  leads = [], 
  salespersonsList = [], 
  appsScriptUrl = '',
  notifications = [],
  setNotifications,
  onAddLead, 
  onUpdateLead, 
  onDeleteLead, 
  onAddToast,
  onAddNotification,
  onBackToGateway
}) {
  const [activeSalesperson, setActiveSalesperson] = useState(() => {
    return localStorage.getItem('active_salesperson') || '';
  });

  const [selectedRepName, setSelectedRepName] = useState('');
  const [passcode, setPasscode] = useState('');

  const [wizardMode, setWizardMode] = useState(null); // 'create' | 'edit' | null
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [deleteConfirmLead, setDeleteConfirmLead] = useState(null);

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
      platforms: [],
      brandColors: '#6366f1',
      targetAudience: '',
      competitors: '',
      adBudget: '',
      startDate: '',
      deliveryDeadline: '',
      notes: ''
    }
  });

  const handleSelectSalesperson = (name) => {
    setActiveSalesperson(name);
    if (name) {
      localStorage.setItem('active_salesperson', name);
    } else {
      localStorage.removeItem('active_salesperson');
    }
  };

  const handleLogout = () => {
    handleSelectSalesperson('');
    if (onBackToGateway) {
      onBackToGateway();
    }
  };

  // Filter leads for this salesperson
  const salespersonLeads = leads.filter(lead => lead.salespersonName === activeSalesperson);

  // Search filter
  const filteredLeads = salespersonLeads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (lead.clientName || '').toLowerCase().includes(searchLower) ||
      (lead.companyName || '').toLowerCase().includes(searchLower) ||
      (lead.businessCategory || '').toLowerCase().includes(searchLower)
    );
  });

  // Metrics
  const totalMyClients = salespersonLeads.length;
  const pendingSendCount = salespersonLeads.filter(l => l.status !== 'Submitted to Admin').length;
  const adminSubmittedCount = salespersonLeads.filter(l => l.status === 'Submitted to Admin').length;

  const editingLead = leads.find(l => l.id === editingLeadId);
  const isReadOnlyProfile = wizardMode === 'edit' && editingLead && (editingLead.status === 'Client Submitted' || editingLead.status === 'Submitted to Admin');

  // Wizard Triggers
  const openCreateWizard = () => {
    reset({
      salespersonName: activeSalesperson,
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
      notes: ''
    });
    setCurrentStep(0);
    setWizardMode('create');
  };

  const openEditWizard = (lead) => {
    reset(lead);
    setEditingLeadId(lead.id);
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
  const handleQuickStatusChange = (leadId, service, newStatus) => {
    const lead = leads.find(l => l.id === leadId);
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

    const updatedLead = {
      ...lead,
      [statusKey]: newStatus,
      [pendingKey]: pendingVal,
      status: 'Draft'
    };

    onUpdateLead(updatedLead);
    onAddToast('Status Updated', `Updated ${service} status to ${newStatus} for ${lead.clientName}.`, 'success');
    
    if (onAddNotification) {
      onAddNotification(`${lead.salespersonName} updated ${service} status to "${newStatus}" for client ${lead.clientName}.`, 'update');
      if (newStatus === 'Completed') {
        onAddNotification(`Milestone reached: ${service} assets are fully completed for client ${lead.clientName}.`, 'completion');
      }
    }
  };

  const renderStatusBadge = (leadId, service, currentStatus) => {
    const colors = {
      'Pending': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350',
      'In Progress': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
      'Completed': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-350'
    };

    return (
      <select
        value={currentStatus}
        onChange={(e) => handleQuickStatusChange(leadId, service, e.target.value)}
        className={`
          text-[10px] font-extrabold rounded-md px-1.5 py-0.5 border-none outline-hidden cursor-pointer focus:ring-0 transition-colors
          ${colors[currentStatus] || colors['Pending']}
        `}
      >
        <option value="Pending">Pending</option>
        <option value="In Progress">In Progress</option>
        <option value="Completed">Completed</option>
      </select>
    );
  };

  const handleDeleteClick = (lead) => {
    setDeleteConfirmLead(lead);
  };

  const confirmDeleteLead = () => {
    if (!deleteConfirmLead) return;
    onDeleteLead(deleteConfirmLead.id);
    onAddToast('Lead Deleted', `Removed client brief record for ${deleteConfirmLead.clientName}.`, 'info');
    if (onAddNotification) {
      onAddNotification(`Client folder for ${deleteConfirmLead.clientName} was deleted by ${activeSalesperson}.`, 'update');
    }
    setDeleteConfirmLead(null);
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
          id: 's_' + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          status: 'Draft',
          postersStatus: data.postersStatus || 'Pending',
          videosStatus: data.videosStatus || 'Pending',
          adsStatus: data.adsStatus || 'Pending',
          websiteStatus: data.websiteStatus || 'Pending',
          postersPending: postersPendingVal,
          videosPending: videosPendingVal,
          adsPending: adsPendingVal,
          websitePending: websitePendingVal
        };
        onAddLead(payload);
        onAddToast('Lead Created', `Added draft lead for ${payload.clientName}.`, 'success');
        if (onAddNotification) {
          onAddNotification(`New client brief folder initialized for ${payload.clientName} by salesperson ${payload.salespersonName}.`, 'submission');
        }
      } else {
        const payload = {
          ...data,
          id: editingLeadId,
          timestamp: new Date().toISOString(),
          status: 'Draft',
          postersPending: postersPendingVal,
          videosPending: videosPendingVal,
          adsPending: adsPendingVal,
          websitePending: websitePendingVal
        };
        onUpdateLead(payload);
        onAddToast('Lead Updated', `Updated lead records for ${payload.clientName}.`, 'success');
        if (onAddNotification) {
          onAddNotification(`Client brief folder details modified for ${payload.clientName} by salesperson ${payload.salespersonName}.`, 'update');
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

  // Dispatch individual lead to sheets
  const handleSendToAdmin = async (lead) => {
    onAddToast('Transmitting Brief', 'Sending lead details to Google Sheets and Admin dashboard...', 'info');
    
    // Calculate total, pending, completed posts/assets to send
    const totalReq = Number(lead.postersRequired || 0) + Number(lead.videosRequired || 0) + Number(lead.adsRequired || 0) + (lead.websiteRequired ? 1 : 0);
    const pendingReq = Number(lead.postersPending ?? (lead.postersStatus === 'Completed' ? 0 : lead.postersRequired || 0)) + 
                       Number(lead.videosPending ?? (lead.videosStatus === 'Completed' ? 0 : lead.videosRequired || 0)) + 
                       Number(lead.adsPending ?? (lead.adsStatus === 'Completed' ? 0 : lead.adsRequired || 0)) + 
                       (lead.websiteRequired ? (lead.websiteStatus === 'Completed' ? 0 : 1) : 0);
    const completedReq = totalReq - pendingReq;

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

    const payloadToSend = {
      ...lead,
      postersSummary,
      videosSummary,
      adsSummary,
      totalPostsCount: totalReq,
      pendingPostsCount: pendingReq,
      completedPostsCount: completedReq
    };

    try {
      if (appsScriptUrl) {
        // Send payload via text/plain fetch to bypass preflight OPTIONS CORS restrictions
        await fetch(appsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain'
          },
          body: JSON.stringify(payloadToSend)
        });
        
        onAddToast('Sync Complete', `Brief for ${lead.clientName} saved to Google Sheets.`, 'success');
      } else {
        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        onAddToast('Logged (Mock Mode)', `Brief for ${lead.clientName} sent to Admin dashboard backup.`, 'info');
      }

      // Update local storage status
      const updatedLead = {
        ...lead,
        status: 'Submitted to Admin'
      };
      onUpdateLead(updatedLead);

      // Trigger reward confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (err) {
      console.error(err);
      onAddToast('Sync Error', 'Failed to dispatch lead to Google Sheets.', 'error');
    }
  };

  // Profile Selector / Login View
  if (!activeSalesperson) {
    const options = salespersonsList.map(name => ({ value: name, label: name }));

    const handleLoginSubmit = (e) => {
      e.preventDefault();
      if (!selectedRepName) {
        onAddToast('Selection Required', 'Please select your representative name.', 'warning');
        return;
      }
      if (passcode === 'sales123') {
        setActiveSalesperson(selectedRepName);
        localStorage.setItem('active_salesperson', selectedRepName);
        onAddToast('Login Success', `Authenticated as salesperson ${selectedRepName}.`, 'success');
        setPasscode('');
      } else {
        onAddToast('Authentication Failed', 'Invalid salesperson passcode. Please try again.', 'error');
      }
    };

    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <Card title="Sales Portal Gateway" subtitle="Authenticate your profile to access your client records">
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div className="w-14 h-14 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
              <Lock className="w-6 h-6" />
            </div>

            <Select
              label="Select Representative Profile"
              placeholder="Choose representative name"
              options={options}
              value={selectedRepName}
              onChange={(e) => setSelectedRepName(e.target.value)}
              required
            />

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Sales Passcode
              </label>
              <input
                type="password"
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2.5 px-3.5 text-sm bg-white/60 dark:bg-slate-900/40 text-gray-900 dark:text-white transition-all outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
              >
                Sign In to Sales
              </Button>
              {onBackToGateway && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onBackToGateway}
                >
                  Back to Portal Selector
                </Button>
              )}
            </div>

            {/* <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-center text-xs text-indigo-800 dark:text-indigo-400 font-medium">
              Static Testing Passcode: <code className="bg-indigo-500/10 dark:bg-indigo-500/20 px-1.5 py-0.5 rounded font-bold font-mono">sales123</code>
            </div> */}
          </form>
        </Card>
      </div>
    );
  }

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
            Active Identity: <strong className="text-gray-900 dark:text-slate-100 font-semibold">{activeSalesperson}</strong>
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
            onClick={handleLogout}
            icon={LogOut}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-indigo-500/5">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Assigned Clients</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{totalMyClients}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-amber-500/5">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Pending Projects</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{pendingProjectsCount}</p>
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
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Completed Projects</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{completedProjectsCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work Performance Chart Card */}
        <div className="lg:col-span-1">
          <Card title="My Work Performance" subtitle="Task and service completion status overview">
            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{completionPercentage}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">Completion Rate</p>
                </div>
                
                {/* SVG circular progress meter */}
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="26" 
                      className="text-gray-200 dark:text-slate-800" 
                      strokeWidth="5.5" 
                      stroke="currentColor" 
                      fill="transparent" 
                    />
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="26" 
                      className="text-indigo-600 dark:text-indigo-400 transition-all duration-500 ease-out" 
                      strokeWidth="5.5" 
                      strokeDasharray={2 * Math.PI * 26}
                      strokeDashoffset={2 * Math.PI * 26 * (1 - completionPercentage / 100)}
                      strokeLinecap="round"
                      stroke="currentColor" 
                      fill="transparent" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-gray-700 dark:text-gray-300">
                    {completedTasks}/{totalTasks}
                  </div>
                </div>
              </div>

              {/* Individual task types progress bars */}
              <div className="space-y-3.5 border-t border-gray-150/40 dark:border-slate-800/40 pt-4">
                <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Asset Status Breakdown
                </h4>
                {[
                  { name: 'Posters', key: 'postersRequired', statusKey: 'postersStatus' },
                  { name: 'Videos', key: 'videosRequired', statusKey: 'videosStatus' },
                  { name: 'Advertisements', key: 'adsRequired', statusKey: 'adsStatus' },
                  { name: 'Websites', key: 'websiteRequired', statusKey: 'websiteStatus', isBool: true }
                ].map(item => {
                  let active = 0, comp = 0;
                  salespersonLeads.forEach(lead => {
                    const req = item.isBool ? lead[item.key] : Number(lead[item.key]) > 0;
                    if (req) {
                      active++;
                      if (lead[item.statusKey] === 'Completed') comp++;
                    }
                  });
                  const rate = active > 0 ? Math.round((comp / active) * 100) : 0;
                  if (active === 0) return null;

                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
                        <span>{item.name}</span>
                        <span>{comp}/{active} ({rate}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Client List */}
        <div className="lg:col-span-2">
          <Card title="My Onboarded Clients" subtitle="Review, edit, and transmit client folders to the central admin sheet">
        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search by client, company, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/20 text-gray-900 dark:text-white outline-hidden focus:border-indigo-500"
          />
        </div>

        {filteredLeads.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 dark:border-slate-800/80 rounded-xl bg-gray-50/30 dark:bg-slate-900/10">
            <FileText className="w-10 h-10 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {salespersonLeads.length === 0 
                ? 'You have not registered any clients yet. Click "+ Create New Client" to start.'
                : 'No clients found matching the search query.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLeads.map((lead) => {
              const hasUnsavedChanges = lead.status !== 'Submitted to Admin';
              return (
                <div 
                  key={lead.id} 
                  className={`
                    p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden glass-card
                    ${lead.status === 'Submitted to Admin'
                      ? 'border-emerald-500/15 bg-emerald-500/2 dark:bg-emerald-500/1 hover:shadow-lg' 
                      : lead.status === 'Client Submitted'
                        ? 'border-indigo-500/15 bg-indigo-500/2 dark:bg-indigo-500/1 hover:shadow-lg'
                        : 'border-gray-200 dark:border-slate-800 hover:shadow-lg'
                    }
                  `}
                >
                  {/* Status Banner */}
                  <div className="absolute top-0 right-0">
                    <span className={`
                      text-[9px] font-bold px-3 py-1 rounded-bl-xl border-l border-b uppercase tracking-wider
                      ${lead.status === 'Submitted to Admin'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10'
                        : lead.status === 'Client Submitted'
                          ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/10'
                          : 'bg-slate-500/10 text-slate-600 border-slate-500/10'
                      }
                    `}>
                      {lead.status}
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
                      <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> {lead.mobileNumber}</div>
                      {lead.websiteUrl && <div className="flex items-center gap-2 truncate"><Globe className="w-3.5 h-3.5 text-gray-400" /> {lead.websiteUrl}</div>}
                      <div className="flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-gray-400" /> {lead.platforms ? lead.platforms.length : 0} channels, {Number(lead.postersRequired || 0) + Number(lead.videosRequired || 0)} assets</div>
                      <div className="flex items-center gap-2"><IndianRupeeIcon className="w-3.5 h-3.5 text-emerald-500" /> Budget: <strong className="text-gray-900 dark:text-white">₹{lead.adBudget || '0'}</strong></div>                    </div>

                    {/* Service status tracking dropdowns */}
                    <div className="border-t border-gray-100 dark:border-slate-800/40 pt-3.5 space-y-2">
                      <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Service Milestone Status (Click to update)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {Number(lead.postersRequired) > 0 && (
                          <div className="flex items-center justify-between p-2 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl border border-gray-150/40 dark:border-slate-800/40">
                            <span className="font-semibold text-gray-600 dark:text-gray-400 truncate mr-2">Posters ({lead.postersRequired})</span>
                            {renderStatusBadge(lead.id, 'posters', lead.postersStatus || 'Pending')}
                          </div>
                        )}
                        {Number(lead.videosRequired) > 0 && (
                          <div className="flex items-center justify-between p-2 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl border border-gray-150/40 dark:border-slate-800/40">
                            <span className="font-semibold text-gray-600 dark:text-gray-400 truncate mr-2">Videos ({lead.videosRequired})</span>
                            {renderStatusBadge(lead.id, 'videos', lead.videosStatus || 'Pending')}
                          </div>
                        )}
                        {Number(lead.adsRequired) > 0 && (
                          <div className="flex items-center justify-between p-2 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl border border-gray-150/40 dark:border-slate-800/40">
                            <span className="font-semibold text-gray-600 dark:text-gray-400 truncate mr-2">Ads ({lead.adsRequired})</span>
                            {renderStatusBadge(lead.id, 'ads', lead.adsStatus || 'Pending')}
                          </div>
                        )}
                        {lead.websiteRequired && (
                          <div className="flex items-center justify-between p-2 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl border border-gray-150/40 dark:border-slate-800/40 col-span-1 sm:col-span-2">
                            <span className="font-semibold text-gray-600 dark:text-gray-400 truncate mr-2">Website ({lead.websiteType || 'Dev'})</span>
                            {renderStatusBadge(lead.id, 'website', lead.websiteStatus || 'Pending')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800/40 pt-3.5 mt-1">
                    <div className="flex items-center gap-2">
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
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

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
              );
            })}
          </div>
        )}
      </Card>
    </div>
  </div>

      {/* Reusable Form Wizard Modal Overlay */}
      <AnimatePresence>
        {wizardMode && (
          <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-4 z-150 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800/80">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {wizardMode === 'create' ? 'Onboard New Client' : 'Modify Client Brief'}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {STEPS_META[currentStep].title} • Step {currentStep + 1} of 3
                  </p>
                </div>
                <button 
                  onClick={closeWizard}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800/80 flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gray-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
                <div 
                  className="absolute top-1/2 left-[10%] h-0.5 bg-indigo-500 -translate-y-1/2 z-0 transition-all duration-300"
                  style={{ width: `${(currentStep / (STEPS_META.length - 1)) * 80}%` }}
                />
                {STEPS_META.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center z-10 relative">
                    <span className={`
                      w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] transition-all duration-350
                      ${idx < currentStep 
                        ? 'bg-indigo-600 text-white' 
                        : idx === currentStep 
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 border border-indigo-500 ring-2 ring-indigo-500/10 font-bold' 
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-600'
                      }
                    `}>
                      {idx < currentStep ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                    </span>
                  </div>
                ))}
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1">
                <form onSubmit={handleSubmit(handleWizardSubmit)} id="sales-wizard-form" className="space-y-6">
                  {currentStep === 0 && (
                    <StepProfileAccess 
                      register={register} 
                      errors={errors} 
                      watch={watch} 
                      isClientPortal={false} 
                      salespersonsList={salespersonsList} 
                      isReadOnlyProfile={isReadOnlyProfile}
                    />
                  )}
                  {currentStep === 1 && (
                    <StepRequirementsBrief 
                      register={register} 
                      errors={errors} 
                      setValue={setValue} 
                      watch={watch} 
                      isClientPortal={false}
                      isReadOnlyProfile={isReadOnlyProfile}
                    />
                  )}
                  {currentStep === 2 && (
                    <StepReviewSubmit 
                      register={register} 
                      watch={watch} 
                      errors={errors} 
                    />
                  )}
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-900/30 flex justify-between">
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
                    form="sales-wizard-form"
                    variant="primary"
                    isLoading={isSubmitting}
                    icon={Send}
                  >
                    {wizardMode === 'create' ? 'Save Client Folder' : 'Update Client Folder'}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmLead && (
          <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-4 z-150">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Client Record?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to permanently delete the client record for <strong className="text-gray-950 dark:text-white">{deleteConfirmLead.clientName}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => setDeleteConfirmLead(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" className="!bg-red-500 hover:!bg-red-650" onClick={confirmDeleteLead}>
                  Yes, Delete Record
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
