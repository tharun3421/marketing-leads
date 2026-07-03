import React, { useState, useEffect, useMemo } from 'react';
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
  User,
  Eye,
  EyeOff,
  Check,
  ChevronDown,
  LayoutDashboard,
  Menu,
  ListChecks
} from 'lucide-react';
import confetti from 'canvas-confetti';

import Card from '../UI/Card';
import Button from '../UI/Button';
import { useAuth } from '../../context/AuthContext';

// Wizard Steps
import StepProfileAccess from '../FormSteps/StepProfileAccess';
import StepRequirementsBrief from '../FormSteps/StepRequirementsBrief';
import StepReviewSubmit from '../FormSteps/StepReviewSubmit';
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

const getStatusLabel = (status) => {
  if (status === 'Completed') return 'Completed';
  if (status === 'In Progress') return 'In Progress';
  return 'Pending';
};

// Render per-team status badges for a lead
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
  return entries;
};

const TeamMultiSelectDropdown = ({ assignedTeam, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState([]);
  const dropdownRef = React.useRef(null);

  const OPTIONS = [
    { id: 'design', label: 'Designing Team' },
    { id: 'developer', label: 'Developer Team' },
    { id: 'ads', label: 'Ads Team' },
  ];

  const getSelectedTeams = (val) => {
    if (!val) return [];
    if (val === 'all') return ['design', 'developer', 'ads'];
    if (Array.isArray(val)) {
      if (val.includes('all')) return ['design', 'developer', 'ads'];
      return val;
    }
    return [val];
  };

  // Sync state when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTempSelected(getSelectedTeams(assignedTeam));
    }
  }, [isOpen, assignedTeam]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAllSelected = OPTIONS.every(opt => tempSelected.includes(opt.id));

  const handleToggleOption = (optionId) => {
    if (tempSelected.includes(optionId)) {
      setTempSelected(tempSelected.filter(id => id !== optionId));
    } else {
      setTempSelected([...tempSelected, optionId]);
    }
  };

  const handleToggleAll = () => {
    if (isAllSelected) {
      setTempSelected([]);
    } else {
      setTempSelected(['design', 'developer', 'ads']);
    }
  };

  const handleApply = () => {
    onChange(tempSelected.length > 0 ? tempSelected : null);
    setIsOpen(false);
  };

  const displayLabel = () => {
    const selected = getSelectedTeams(assignedTeam);
    if (selected.length === 0) return 'Assign to Technical Team...';
    if (selected.length === 3) return 'All Teams';
    return selected.map(id => OPTIONS.find(opt => opt.id === id)?.label.replace(' Team', '')).join(', ') + ' Team';
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs font-bold rounded-xl px-2.5 py-1.5 border border-indigo-150/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 outline-hidden transition-all shadow-sm flex items-center justify-between gap-1.5 min-w-[170px]"
      >
        <span className="truncate text-left flex-1">{displayLabel()}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-405 dark:text-gray-550 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1.5 z-50 w-52 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-850 rounded-xl shadow-lg p-1.5 overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {OPTIONS.map(opt => {
              const isSelected = tempSelected.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  onClick={() => handleToggleOption(opt.id)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-slate-800/60 cursor-pointer text-gray-700 dark:text-gray-200 transition-colors select-none"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                    isSelected 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : 'border-gray-300 dark:border-slate-700 bg-transparent'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3.5]" />}
                  </div>
                  <span className="font-semibold">{opt.label}</span>
                </div>
              );
            })}
            
            <div className="border-t border-gray-100 dark:border-slate-800/80 my-1" />
            
            <div
              onClick={handleToggleAll}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-slate-800/60 cursor-pointer text-gray-700 dark:text-gray-200 transition-colors select-none"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                isAllSelected 
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : 'border-gray-300 dark:border-slate-700 bg-transparent'
              }`}>
                {isAllSelected && <Check className="w-3 h-3 stroke-[3.5]" />}
              </div>
              <span className="font-bold">All Teams</span>
            </div>
          </div>
          
          <div className="border-t border-gray-100 dark:border-slate-800/80 mt-1.5 pt-1.5 px-2">
            <button
              type="button"
              onClick={handleApply}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer select-none"
            >
              Apply Assignment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const STEPS_META = [
  { title: 'Client Profile & Credentials', desc: 'Identify details, contact channels & social logins' },
  { title: 'Campaign Brief & Requirements', desc: 'Deliverables count, targeting networks, creative details & budgets' },
  { title: 'Review & Submit Brief', desc: 'Final review of details and special instructions' }
];

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
  
  if (diffDays === 0) {
    return { type: 'today', label: 'Due Today', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20 font-bold' };
  } else if (diffDays < 0) {
    return { type: 'overdue', label: 'Overdue', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20 font-bold' };
  } else if (diffDays <= 3) {
    return { type: 'approaching', label: 'Due Date Reminder', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold' };
  }
  return null;
};

const getPaymentStatus = (lead) => {
  // If the backend pre-calculated and sent lead.paymentStatus, use it!
  if (lead.paymentStatus) {
    if (lead.paymentStatus === 'Paid') {
      return { label: 'Fully Paid', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' };
    }
    if (lead.paymentStatus === 'Partial') {
      return { label: 'Partially Paid', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' };
    }
    return { label: 'Unpaid', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20' };
  }
  // Fallback to local calculation if fields exist
  const plan = Number(lead.planAmount || 0);
  const advance = Number(lead.advanceAmount || 0);
  if (plan > 0 && advance >= plan) return { label: 'Fully Paid', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' };
  if (advance > 0 && advance < plan) return { label: 'Partially Paid', color: 'bg-amber-500/10 text-amber-605 dark:text-amber-400 border border-amber-500/20' };
  return { label: 'Unpaid', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20' };
};

export default function SalesPortal({ 
  notifications = [],
  setNotifications,
  onAddToast,
  onAddNotification
}) {
  const { user, logout, authFetch } = useAuth();
  const userId = user?.id || user?._id;
  const [leads, setLeads] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);

  const [wizardMode, setWizardMode] = useState(null); // 'create' | 'edit' | null
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterWorkflowStatus, setFilterWorkflowStatus] = useState('All');
  const [filterAssignedTeam, setFilterAssignedTeam] = useState('All');
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activeMetricsModal, setActiveMetricsModal] = useState(null);

  // Central Clients Management filter states
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState('All');
  const [clientTeamFilter, setClientTeamFilter] = useState('All');
  const [clientCreatedByFilter, setClientCreatedByFilter] = useState('All');
  const [clientAssignedToFilter, setClientAssignedToFilter] = useState('All');
  const [clientStartDateFilter, setClientStartDateFilter] = useState('');
  const [clientEndDateFilter, setClientEndDateFilter] = useState('');
  const [salespersonsList, setSalespersonsList] = useState([]);
  const [technicalList, setTechnicalList] = useState([]);

  // Master-detail Layout States
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [showFbPass, setShowFbPass] = useState(false);
  const [showIgPass, setShowIgPass] = useState(false);
  const [viewedClientId, setViewedClientId] = useState(null);

  const isFirstLoadRef = React.useRef(true);

  // Fetch leads on mount
  const fetchLeads = async () => {
    const isFirst = isFirstLoadRef.current;
    if (isFirst) {
      setIsLoadingLeads(true);
    }
    try {
      const res = await authFetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error('Fetch leads failed:', err);
    } finally {
      if (isFirst) {
        setIsLoadingLeads(false);
        isFirstLoadRef.current = false;
      }
    }
  };

  const fetchEmployees = async () => {
    try {
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
    } catch (err) {
      console.error('Fetch employees failed:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchEmployees();
    const interval = setInterval(fetchLeads, 5000);
    return () => clearInterval(interval);
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
      otherTools: [],
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
      adBudgetPerDay: 0,
      metaAdsPlanDuration: 0,
      googleAdsPlanDuration: 0,
      youtubeAdsPlanDuration: 0,
      linkedinAdsPlanDuration: 0,
      seoPlanDuration: 0,
      startDate: '',
      deliveryDeadline: '',
      notes: '',
      isConfirmed: false
    }
  });

  const formValues = watch();

  // Filter leads for this salesperson (backend returns all leads now, so filter to own leads on frontend)
  const salespersonLeads = useMemo(() => {
    return leads.filter(l => {
      const leadSalespersonId = l.salesperson?._id || l.salesperson;
      return leadSalespersonId && leadSalespersonId.toString() === userId?.toString();
    });
  }, [leads, userId]);

  // Advanced filters implementation
  const filteredLeads = useMemo(() => {
    const q = listSearchQuery.toLowerCase().trim();
    return salespersonLeads.filter(lead => {
      // 1. List Search Query (name, company name, ID, or WhatsApp number, created by, assigned to)
      if (q) {
        const nameMatch = (lead.clientName || '').toLowerCase().includes(q);
        const companyMatch = (lead.companyName || '').toLowerCase().includes(q);
        const idMatch = (lead.clientId || '').toLowerCase().includes(q);
        const phoneMatch = (lead.mobileNumber || '').toLowerCase().includes(q);
        const createdByMatch = (lead.salespersonName || '').toLowerCase().includes(q);
        const assignedToName = lead.assignedToName || '';
        const assignedTeamLabel = getTeamDisplayLabel(lead.assignedTeam);
        const assignedToMatch = assignedToName.toLowerCase().includes(q) || assignedTeamLabel.toLowerCase().includes(q);

        if (!nameMatch && !companyMatch && !idMatch && !phoneMatch && !createdByMatch && !assignedToMatch) return false;
      }

      // 2. Status filter
      if (filterWorkflowStatus !== 'All') {
        const leadStatus = lead.workflowStatus === 'Completed'
          ? 'Completed'
          : lead.workflowStatus === 'In Progress'
            ? 'In Progress'
            : 'Pending';
        if (leadStatus !== filterWorkflowStatus) {
          return false;
        }
      }

      // 3. Assigned Team filter
      if (filterAssignedTeam !== 'All') {
        if (!hasTeamVal(lead.assignedTeam, filterAssignedTeam)) {
          return false;
        }
      }

      return true;
    });
  }, [salespersonLeads, listSearchQuery, filterWorkflowStatus, filterAssignedTeam]);

  useEffect(() => {
    if (filteredLeads.length > 0) {
      const exists = filteredLeads.some(l => (l._id || l.id) === selectedLeadId);
      if (!exists) {
        setSelectedLeadId(filteredLeads[0]._id || filteredLeads[0].id);
      }
    } else {
      setSelectedLeadId(null);
    }
  }, [filteredLeads, selectedLeadId]);

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

      if (clientStatusFilter !== 'All') {
        const mapped = (lead.workflowStatus === 'Completed' || lead.workflowStatus === 'In Progress') ? lead.workflowStatus : 'Pending';
        if (mapped !== clientStatusFilter) return false;
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

  // Metrics
  const totalMyClients = salespersonLeads.length;
  const pendingSendCount = useMemo(() => salespersonLeads.filter(l => l.status !== 'Submitted to Admin').length, [salespersonLeads]);
  const adminSubmittedCount = useMemo(() => salespersonLeads.filter(l => l.status === 'Submitted to Admin').length, [salespersonLeads]);

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
      otherTools: [],
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
      adBudgetPerDay: 0,
      metaAdsPlanDuration: 0,
      googleAdsPlanDuration: 0,
      youtubeAdsPlanDuration: 0,
      linkedinAdsPlanDuration: 0,
      seoPlanDuration: 0,
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
      ['salespersonName', 'clientName', 'websiteUrl', 'websiteRequired', 'websiteType', 'otherTools', 'mobileNumber', 'email', 'facebookId', 'facebookPassword', 'instagramId', 'instagramPassword', 'facebookAccountStatus', 'instagramAccountStatus'],
      ['postersRequired', 'videosRequired', 'adsRequired', 'platforms', 'brandColors', 'competitors', 'adBudget', 'startDate', 'deliveryDeadline', 'notes', 'adBudgetPerDay', 'targetAudienceRequired', 'targetAudience'],
      ['isConfirmed']
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
        
        // if (onAddNotification) {
        //   onAddNotification(`${user.name} updated ${service} status to "${newStatus}" for client ${lead.clientName}.`, 'update');
        //   if (newStatus === 'Completed') {
        //     onAddNotification(`Milestone reached: ${service} assets are fully completed for client ${lead.clientName}.`, 'completion');
        //   }
        // }
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
      workflowStatus: newTeam && (Array.isArray(newTeam) ? newTeam.length > 0 : true) ? 'Allocated' : 'Non-Allocated'
    };

    try {
      const res = await authFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedLeadData)
      });

      if (res.ok) {
        fetchLeads();
        const displayTeam = getTeamDisplayLabel(newTeam);
        onAddToast('Route Updated', `Assigned ${lead.clientName} to ${displayTeam}.`, 'success');
        // if (onAddNotification) {
        //   onAddNotification(`${user.name} routed client ${lead.clientName} to ${displayTeam}.`, 'update');
        // }
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
        // if (onAddNotification) {
        //   onAddNotification(`Salesperson updated team assignment of client to ${newTeam || 'none'}.`, 'update');
        // }
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
        // if (onAddNotification) {
        //   onAddNotification(`Salesperson updated workflow status of client to ${newStatus}.`, 'update');
        // }
      }
    } catch (err) {
      console.error(err);
      onAddToast('Error', 'Failed to update client status.', 'error');
    }
  };

  // Client deletion has been removed from the Sales Portal

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
          const resData = await res.json();
          fetchLeads();
          if (resData.syncWarning) {
            onAddToast('Created with Warning', resData.syncWarning, 'warning');
            // if (onAddNotification) {
            //   onAddNotification(`New client brief folder initialized for ${payload.clientName} by salesperson ${user.name} (Google Sheets sync failed).`, 'submission');
            // }
          } else {
            onAddToast('Lead Created', `Successfully created client brief for ${payload.clientName} and synced to Google Sheets.`, 'success');
            // if (onAddNotification) {
            //   onAddNotification(`New client brief folder initialized and synced to Google Sheets for ${payload.clientName} by salesperson ${user.name}.`, 'submission');
            // }
            
            // Confetti reward
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.8 }
            });
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
          // if (onAddNotification) {
          //   onAddNotification(`Client brief folder details modified for ${payload.clientName} by salesperson ${user.name}.`, 'update');
          // }
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


  const getMetricsModalTitleAndList = () => {
    switch (activeMetricsModal) {
      case 'total':
        return { title: 'Total Clients', list: salespersonLeads };
      case 'non-allocated':
        return { title: 'Non-Allocated Clients', list: salespersonLeads.filter(l => (l.workflowStatus || 'Non-Allocated') === 'Non-Allocated') };
      case 'allocated':
        return { title: 'Allocated Clients', list: allocatedSalespersonLeads };
      case 'in-progress':
        return { title: 'In-Progress Clients (Awaiting Claim)', list: allocatedSalespersonLeads.filter(l => l.workflowStatus === 'Allocated') };
      case 'pending':
        return { title: 'Pending Clients (Claimed, Work Underway)', list: allocatedSalespersonLeads.filter(l => l.workflowStatus === 'In Progress') };
      case 'completed':
        return { title: 'Completed Clients/Tasks', list: allocatedSalespersonLeads.filter(l => l.workflowStatus === 'Completed') };
      default:
        return { title: '', list: [] };
    }
  };

  // Sales dashboard lifecycle, driven directly by workflowStatus (the same field the
  // Client Workflow table uses):
  //   Non-Allocated -> Allocated (routed to a team, nobody has claimed it yet -> shown
  //   under "In Progress") -> claimed by the technical team, work underway -> shown under
  //   "Pending" (workflowStatus flips to 'In Progress' the instant it's claimed) -> Completed.
  // "Allocated" is the umbrella count of every client that has left Non-Allocated; the
  // In Progress / Pending / Completed cards are mutually-exclusive sub-stages of it, so
  // they always sum back to the Allocated total.
  const allocatedSalespersonLeads = salespersonLeads.filter(l => l.workflowStatus && l.workflowStatus !== 'Non-Allocated');
  const nonAllocatedClientsCount = salespersonLeads.filter(l => (l.workflowStatus || 'Non-Allocated') === 'Non-Allocated').length;
  const allocatedClientsCount = allocatedSalespersonLeads.length;
  const inProgressProjectsCount = allocatedSalespersonLeads.filter(l => l.workflowStatus === 'Allocated').length;
  const pendingProjectsCount = allocatedSalespersonLeads.filter(l => l.workflowStatus === 'In Progress').length;
  const completedProjectsCount = allocatedSalespersonLeads.filter(l => l.workflowStatus === 'Completed').length;

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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/50 dark:border-slate-800/50 pb-5 relative z-30">
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
                  localStorage.setItem('crm_notifications_last_read', Date.now().toString());
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div 
          onClick={() => setActiveMetricsModal('total')}
          className="glass-card p-4 rounded-xl flex items-center gap-4 border border-indigo-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all"
        >
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Clients</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{totalMyClients}</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveMetricsModal('non-allocated')}
          className="glass-card p-4 rounded-xl flex items-center gap-4 border border-amber-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all"
        >
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Non-Allocated</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{nonAllocatedClientsCount}</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveMetricsModal('allocated')}
          className="glass-card p-4 rounded-xl flex items-center gap-4 border border-blue-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all"
        >
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Allocated</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{allocatedClientsCount}</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveMetricsModal('pending')}
          className="glass-card p-4 rounded-xl flex items-center gap-4 border border-rose-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all"
        >
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{pendingProjectsCount}</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveMetricsModal('in-progress')}
          className="glass-card p-4 rounded-xl flex items-center gap-4 border border-indigo-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all"
        >
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">In Progress</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{inProgressProjectsCount}</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveMetricsModal('completed')}
          className="glass-card p-4 rounded-xl flex items-center gap-4 border border-emerald-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all"
        >
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
            <Card title="Client Work flow" subtitle="Central client management roster for tracking and team routing">
              <div className="space-y-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search by client ID, name, or Business Number..."
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
                      <option value="Pending">Pending</option>
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
                        <td colSpan="7" className="p-6 text-center text-gray-400 dark:text-gray-550 font-normal">
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
                            <td className="p-3">
                              <button
                                onClick={() => setViewedClientId(client._id)}
                                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                              >
                                {client.clientId || 'N/A'}
                              </button>
                            </td>
                            <td className="p-2  text-indigo-650 dark:text-indigo-400 font-medium">
                              {client.salespersonName || '—'}
                            </td>
                            <td className="p-3 text-gray-800 dark:text-white font-medium">
                              <div className="flex items-center gap-2 flex-wrap"> 
                                <span>{client.clientName}</span>
                              </div>
                            </td>
                            <td className="p-3 text-gray-800  dark:text-white font-medium">
                              {client.companyName || '—'}
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
                                const perTeam = getPerTeamStatusBadges(client);
                                if (perTeam && perTeam.length > 0 && (client.workflowStatus === 'In Progress' || client.workflowStatus === 'Completed' || client.workflowStatus === 'Allocated')) {
                                  const statusColor = (s) => s === 'Completed'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : s === 'In Progress'
                                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
                                  return (
                                    <div className="flex flex-col gap-1">
                                      {perTeam.map((t, i) => (
                                        <span key={i} className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColor(t.status)}`}>
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
                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  }`}>
                                    {getStatusLabel(client.workflowStatus)}
                                  </span>
                                );
                              })()}
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
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
              {/* Left Column - Client List Panel (35%) */}
              <div className="w-full lg:w-[35%] flex flex-col border-r border-gray-150/60 dark:border-slate-800/40 pr-0 lg:pr-6 gap-4">
                {/* Search & Filters */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search onboarded clients..."
                      value={listSearchQuery}
                      onChange={(e) => setListSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-205 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/20 text-gray-900 dark:text-white outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={filterWorkflowStatus}
                      onChange={(e) => setFilterWorkflowStatus(e.target.value)}
                      className="rounded-xl border border-gray-205 dark:border-slate-800 py-1.5 px-2.5 text-[11px] bg-white/60 dark:bg-slate-900/40 text-gray-900 dark:text-white cursor-pointer focus:border-indigo-500 outline-hidden"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <select
                      value={filterAssignedTeam}
                      onChange={(e) => setFilterAssignedTeam(e.target.value)}
                      className="rounded-xl border border-gray-205 dark:border-slate-800 py-1.5 px-2.5 text-[11px] bg-white/60 dark:bg-slate-900/40 text-gray-900 dark:text-white cursor-pointer focus:border-indigo-500 outline-hidden"
                    >
                      <option value="All">All Teams</option>
                      <option value="design">Designing Team</option>
                      <option value="developer">Developer Team</option>
                      <option value="ads">Ads Team</option>
                    </select>
                  </div>
                </div>

                {/* Client List */}
                <div className="flex-1 overflow-y-auto max-h-[500px] space-y-2.5 pr-1.5 scrollbar-thin">
                  {filteredLeads.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-gray-150 dark:border-slate-800/80 rounded-xl bg-gray-50/20 dark:bg-slate-900/5">
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">No clients found matching search/filters.</p>
                    </div>
                  ) : (
                    filteredLeads.map((lead) => {
                      const leadId = lead._id || lead.id;
                      const isSelected = leadId === selectedLeadId;
                      return (
                        <div
                          key={leadId}
                          onClick={() => setSelectedLeadId(leadId)}
                          className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 shadow-sm'
                              : 'border-gray-200/80 dark:border-slate-800/40 bg-white/60 hover:bg-slate-500/3 dark:bg-slate-900/20 dark:hover:bg-slate-900/40'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-500" />
                          )}
                          <div className="space-y-1.5 pl-1.5">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewedClientId(leadId);
                                }}
                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono hover:underline cursor-pointer"
                              >
                                {lead.clientId || 'N/A'}
                              </button>
                              <div className="flex items-center gap-1.5">
                                {(() => {
                                  const badge = getPaymentStatus(lead);
                                  return (
                                    <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-md ${badge.color}`}>
                                      {badge.label}
                                    </span>
                                  );
                                })()}
                                {(() => {
                                  const deadlineAlert = checkDeadlineAlert(lead.deliveryDeadline, lead.workflowStatus);
                                  if (deadlineAlert) {
                                    return (
                                      <span className={`text-[8.5px] font-extrabold px-1 py-0.5 rounded-md ${deadlineAlert.color}`}>
                                        {deadlineAlert.label}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5 flex-wrap truncate">
                              <span>{lead.clientName}</span>
                            </h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                              {lead.companyName || 'No Company'} • {lead.businessCategory || 'No Category'}
                            </p>
                            <p className="text-[9px] text-gray-400 dark:text-gray-550 mt-1 font-semibold">
                              Created By: {lead.salespersonName}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column - Client Details Panel (65%) */}
              <div className="w-full lg:w-[65%] flex flex-col gap-4 bg-gray-50/50 dark:bg-slate-950/10 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/40">
                {(() => {
                  const lead = filteredLeads.find(l => (l._id || l.id) === selectedLeadId) || (filteredLeads.length > 0 ? filteredLeads[0] : null);
                  if (!lead) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                        <FileText className="w-12 h-12 text-gray-300 dark:text-slate-700 mb-3" />
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          No client selected or available.
                        </p>
                      </div>
                    );
                  }

                  const leadId = lead._id || lead.id;
                  const totalReq = Number(lead.postersRequired || 0) + Number(lead.videosRequired || 0) + Number(lead.adsRequired || 0) + (lead.websiteRequired ? 1 : 0);
                  const postersPending = Number(lead.postersPending ?? (lead.postersStatus === 'Completed' ? 0 : lead.postersRequired || 0));
                  const videosPending = Number(lead.videosPending ?? (lead.videosStatus === 'Completed' ? 0 : lead.videosRequired || 0));
                  const adsPending = Number(lead.adsPending ?? (lead.adsStatus === 'Completed' ? 0 : lead.adsRequired || 0));
                  const websitePending = lead.websiteRequired ? (lead.websiteStatus === 'Completed' ? 0 : 1) : 0;
                  const pendingReq = postersPending + videosPending + adsPending + websitePending;
                  const completedReq = totalReq - pendingReq;

                  return (
                    <div className="space-y-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-5">
                        {/* Header Details */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-200/50 dark:border-slate-800/40 pb-4">
                          <div className="space-y-1">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                              {lead.clientId && (
                                <button
                                  type="button"
                                  onClick={() => setViewedClientId(lead._id || lead.id)}
                                  className="text-indigo-650 dark:text-indigo-400 font-mono hover:underline cursor-pointer focus:outline-hidden"
                                >
                                  [{lead.clientId}]
                                </button>
                              )}
                              {lead.clientName}

                              {(() => {
  const payStatus = lead.paymentStatus || (
    Number(lead.planAmount || 0) > 0 && Number(lead.advanceAmount || 0) >= Number(lead.planAmount || 0)
      ? 'Paid'
      : Number(lead.advanceAmount || 0) > 0
        ? 'Partial'
        : 'Unpaid'
  );
  if (payStatus === 'Paid') {
    return (
      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 ml-2">
        Full Payment Done
      </span>
    );
  }
  if (payStatus === 'Partial') {
    return (
      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-2">
        Partial Payment Done
      </span>
    );
  }
  return (
    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 ml-2">
      Payment Unpaid
    </span>
  );
})()}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {lead.companyName || 'No Company'} • {lead.businessCategory || 'No Category'}
                            </p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                              Created By: <span className="text-gray-700 dark:text-gray-300 font-semibold">{lead.salespersonName || '—'}</span>
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                  
                            {(() => {
                              const perTeam = getPerTeamStatusBadges(lead);
                              if (!perTeam || perTeam.length === 0) return null;
                              const statusColor = (s) => s === 'Completed'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15'
                                : s === 'In Progress'
                                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/15'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15';
                              return (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {perTeam.map((t, i) => (
                                    <span key={i} className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${statusColor(t.status)}`}>
                                      {t.label}: {t.status}
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Details Sections Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
                          {/* Profile Details & Contacts */}
                          <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-150/40 dark:border-slate-800/40 space-y-2.5">
                            <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider">Contact & Registration</h4>
                            <div className="text-xs space-y-2 text-gray-700 dark:text-gray-300 font-medium">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span>Registered: <strong>{new Date(lead.createdAt || lead.timestamp).toLocaleDateString()}</strong></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="truncate">Email: <strong>{lead.email || '—'}</strong></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span>Business Number: <strong>{lead.mobileNumber}</strong></span>
                              </div>
                              {lead.websiteUrl && (
                                <div className="flex items-center gap-2">
                                  <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span className="truncate">Website: <a href={lead.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{lead.websiteUrl}</a></span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Payment Details */}
                          <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-150/40 dark:border-slate-800/40 space-y-2.5">
                            <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider">Payment Details</h4>
                            <div className="text-xs space-y-2 text-gray-700 dark:text-gray-300 font-medium">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Plan Amount:</span>
                                <strong className="text-gray-900 dark:text-white">₹{lead.planAmount || 0}</strong>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Advance Paid:</span>
                                <strong className="text-gray-900 dark:text-white">₹{lead.advanceAmount || 0}</strong>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Pending Balance:</span>
                                <strong className="text-amber-600 dark:text-amber-400">₹{lead.pendingAmount || 0}</strong>
                              </div>
                              <div className="flex justify-between items-center pt-1.5 border-t border-gray-100 dark:border-slate-800/40">
                                <span className="text-gray-400">Payment Status:</span>
                                {(() => {
                                  const badge = getPaymentStatus(lead);
                                  return (
                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${badge.color}`}>
                                      {badge.label}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Social Credentials */}
                          <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-150/40 dark:border-slate-800/40 space-y-2.5">
                            <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider">Credentials</h4>
                            <div className="text-xs space-y-2.5">
                              {lead.facebookId ? (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-gray-400">FB ID: <strong className="text-gray-800 dark:text-gray-200">{lead.facebookId}</strong></span>
                                    {lead.facebookPassword && (
                                      <button 
                                        type="button" 
                                        onClick={() => setShowFbPass(!showFbPass)}
                                        className="text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5 cursor-pointer"
                                      >
                                        {showFbPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        <span className="text-[9px]">{showFbPass ? 'Hide' : 'Show'}</span>
                                      </button>
                                    )}
                                  </div>
                                  {lead.facebookPassword && showFbPass && (
                                    <div className="p-1 px-2 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-mono text-[11px] rounded-lg select-all">
                                      {lead.facebookPassword}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[11px] text-gray-400 italic">No Facebook credentials provided</div>
                              )}

                              {lead.instagramId ? (
                                <div className="space-y-1 border-t border-gray-100 dark:border-slate-800/40 pt-2">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-gray-400">IG ID: <strong className="text-gray-800 dark:text-gray-200">{lead.instagramId}</strong></span>
                                    {lead.instagramPassword && (
                                      <button 
                                        type="button" 
                                        onClick={() => setShowIgPass(!showIgPass)}
                                        className="text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5 cursor-pointer"
                                      >
                                        {showIgPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        <span className="text-[9px]">{showIgPass ? 'Hide' : 'Show'}</span>
                                      </button>
                                    )}
                                  </div>
                                  {lead.instagramPassword && showIgPass && (
                                    <div className="p-1 px-2 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-mono text-[11px] rounded-lg select-all">
                                      {lead.instagramPassword}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[11px] text-gray-400 italic border-t border-gray-100 dark:border-slate-800/40 pt-2">No Instagram credentials provided</div>
                              )}
                            </div>
                          </div>

                          {/* Requirements & Assets */}
                          <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-150/40 dark:border-slate-800/40 space-y-3 md:col-span-2">
                            <div className="flex justify-between items-center">
                              <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider">Requested Assets & Milestones</h4>
                              <span className="text-[10px] text-gray-400 font-semibold">Overall: {completedReq}/{totalReq} done</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {Number(lead.postersRequired) > 0 && (
                                <div className="flex flex-col gap-1 p-2 bg-gray-50/50 dark:bg-slate-950/20 rounded-lg border border-gray-200/30">
                                  <div className="flex justify-between items-center text-[11px]">
                                    <span className="font-bold text-gray-700 dark:text-gray-300">Posters</span>
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-gray-500">{lead.postersStatus || 'Pending'}</span>
                                  </div>
                                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                    <span>Total: <strong>{lead.postersRequired}</strong></span>
                                    <span>Completed: <strong className="text-emerald-500">{Number(lead.postersRequired) - postersPending}</strong></span>
                                  </div>
                                </div>
                              )}
                              {Number(lead.videosRequired) > 0 && (
                                <div className="flex flex-col gap-1 p-2 bg-gray-50/50 dark:bg-slate-950/20 rounded-lg border border-gray-200/30">
                                  <div className="flex justify-between items-center text-[11px]">
                                    <span className="font-bold text-gray-700 dark:text-gray-300">Videos</span>
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-gray-500">{lead.videosStatus || 'Pending'}</span>
                                  </div>
                                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                    <span>Total: <strong>{lead.videosRequired}</strong></span>
                                    <span>Completed: <strong className="text-emerald-500">{Number(lead.videosRequired) - videosPending}</strong></span>
                                  </div>
                                </div>
                              )}
                             {Number(lead.adsRequired) > 0 && (
  <div className="flex flex-col gap-1 p-2 bg-gray-50/50 dark:bg-slate-950/20 rounded-lg border border-gray-200/30">
    <div className="flex flex-col gap-1 text-[11px]">
      <div className="flex justify-between items-center">
        <span className="font-bold text-gray-700 dark:text-gray-300">Ads Campaigns</span>
        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-gray-500">{lead.adsStatus || 'Pending'}</span>
      </div>
      {lead.platforms && lead.platforms.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {lead.platforms.map((p, idx) => (
            <span key={idx} className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/10">
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
      <span>Total: <strong>{lead.adsRequired}</strong></span>
      <span>Completed: <strong className="text-emerald-500">{Number(lead.adsRequired) - adsPending}</strong></span>
    </div>
  </div>
)}
                              {lead.websiteRequired && (
                                <div className="flex flex-col gap-1 p-2 bg-gray-50/50 dark:bg-slate-950/20 rounded-lg border border-gray-200/30 col-span-1 sm:col-span-2">
                                  <div className="flex justify-between items-center text-[11px]">
                                    <span className="font-bold text-gray-700 dark:text-gray-300">Website ({lead.websiteType || 'Dev'})</span>
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-gray-500">{lead.websiteStatus || 'Pending'}</span>
                                  </div>
                                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                    <span>Total: <strong>1</strong></span>
                                    <span>Completed: <strong className="text-emerald-500">{lead.websiteStatus === 'Completed' ? 1 : 0}</strong></span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Creative Specs & Planning */}
<div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-150/40 dark:border-slate-800/40 space-y-2.5 md:col-span-2">
  <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider">Project Specifications</h4>
  <div className="grid grid-cols-2 gap-4 text-xs">

    {/* Left Column */}
    <div className="space-y-2">
      <div>
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider block mb-0.5">Brand Colors</span>
        <div className="flex items-center gap-1.5">
          <strong>{lead.brandColors || '—'}</strong>
          {lead.brandColors && (
            <span className="w-3.5 h-3.5 rounded-full border border-gray-205 shrink-0" style={{ backgroundColor: lead.brandColors }} />
          )}
        </div>
      </div>
      <div>
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider block mb-0.5">Competitors</span>
        <strong>{lead.competitors || '—'}</strong>
      </div>
      <div>
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider block mb-0.5">Start Date</span>
        <strong>{lead.startDate || '—'}</strong>
      </div>
      <div>
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider block mb-0.5">Deadline</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <strong>{lead.deliveryDeadline || '—'}</strong>
          {(() => {
            const deadlineAlert = checkDeadlineAlert(lead.deliveryDeadline, lead.workflowStatus);
            if (deadlineAlert) {
              return (
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${deadlineAlert.color}`}>
                  {deadlineAlert.label}
                </span>
              );
            }
            return null;
          })()}
        </div>
      </div>
    </div>

    {/* Right Column */}
    <div className="space-y-2 border-l border-gray-200/50 dark:border-slate-800/40 pl-4">
      {lead.targetAudience && (
        <div>
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider block mb-0.5">Target Audience</span>
          <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-500/5 p-2 rounded-lg">{lead.targetAudience}</p>
        </div>
      )}
      {lead.platforms && lead.platforms.length > 0 && (
        <div>
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider block mb-1">Platforms</span>
          <div className="flex flex-wrap gap-1">
            {lead.platforms.map((p, idx) => (
              <span key={idx} className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-indigo-500/5">{p}</span>
            ))}
          </div>
        </div>
      )}
    </div>

  </div>
</div>

                          {/* Notes and Remarks */}
                          {(lead.notes || lead.remarks) && (
                            <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-150/40 dark:border-slate-800/40 space-y-3.5 md:col-span-2">
                              {lead.notes && (
                                <div className="text-xs space-y-1">
                                  <h5 className="font-bold text-gray-405 text-[10px] uppercase tracking-wider">Salesperson Instructions</h5>
                                  <p className="p-2.5 bg-yellow-500/5 dark:bg-yellow-500/2 border border-yellow-500/10 text-yellow-800 dark:text-yellow-300 rounded-lg font-medium leading-relaxed">{lead.notes}</p>
                                </div>
                              )}
                              {lead.remarks && (
                                <div className="text-xs space-y-1">
                                  <h5 className="font-bold text-gray-405 text-[10px] uppercase tracking-wider">Technical Remarks & Progress Updates</h5>
                                  <p className="p-2.5 bg-indigo-500/5 dark:bg-indigo-500/2 border border-indigo-500/10 text-indigo-800 dark:text-indigo-300 rounded-lg font-medium leading-relaxed">{lead.remarks}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Assignee Information */}
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-750 dark:text-gray-300 bg-indigo-500/5 dark:bg-indigo-500/2 p-3 rounded-xl border border-indigo-500/10">
                          <User className="w-4 h-4 text-indigo-500 animate-pulse" />
                          <span>Assignee: {lead.assignedToName ? <strong className="text-indigo-650 dark:text-indigo-400">{lead.assignedToName}</strong> : <span className="italic text-gray-400 font-normal">Unclaimed ({getTeamDisplayLabel(lead.assignedTeam)})</span>}</span>
                        </div>

                        {/* Client Chat panel inside details view */}
                        <div className="border-t border-gray-200/50 dark:border-slate-800/40 pt-4">
                          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider mb-2">Collaboration Chat</h4>
                          <ClientChat leadId={leadId} />
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="flex items-center justify-end border-t border-gray-200/50 dark:border-slate-800/40 pt-4 mt-2 gap-3">
                        <div className="flex items-center">
                          <TeamMultiSelectDropdown
                            assignedTeam={lead.assignedTeam}
                            onChange={(newTeam) => handleQuickTeamChange(leadId, newTeam)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </Card>
      </div>

               {/* Metrics List Modal */}
      <AnimatePresence>
        {activeMetricsModal && (() => {
          const { title, list } = getMetricsModalTitleAndList();
          return (
            <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-4 z-150 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-850 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800/80">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Showing {list.length} matching client briefs</p>
                  </div>
                  <button 
                    onClick={() => setActiveMetricsModal(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-650 dark:hover:text-gray-250 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content - Table */}
                <div className="p-6 overflow-y-auto flex-1">
                  {list.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                      No client records match this category.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-gray-100 dark:border-slate-800/60 rounded-xl">
                      <table className="w-full text-left text-sm border-collapse table-fixed">
                        <colgroup>
                          <col className="w-[10%]" />
                          <col className="w-[19%]" />
                          <col className="w-[12%]" />
                          <col className="w-[19%]" />
                          <col className="w-[24%]" />
                          <col className="w-[16%]" />
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
                            <tr key={client._id || client.id} className="hover:bg-indigo-500/3 dark:hover:bg-indigo-500/1 transition-colors align-top">
                              <td className="p-3 truncate">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMetricsModal(null);
                                    setViewedClientId(client._id || client.id);
                                  }}
                                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer truncate block"
                                  title={client.clientId}
                                >
                                  {client.clientId || 'N/A'}
                                </button>
                              </td>
                               <td className="p-3 text-gray-900 dark:text-white font-bold overflow-hidden">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="truncate" title={client.clientName}>{client.clientName}</span>
                                  {(() => {
                                    const badge = getPaymentStatus(client);
                                    return (
                                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${badge.color}`}>
                                        {badge.label}
                                      </span>
                                    );
                                  })()}
                                </div>
                                {client.companyName && (
                                  <div className="text-xs text-gray-400 dark:text-gray-500 font-normal mt-0.5 truncate" title={client.companyName}>
                                    {client.companyName}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 font-mono truncate">{client.mobileNumber}</td>
                              <td className="p-3">
                                {(() => {
                                  const perTeam = getPerTeamStatusBadges(client);
                                  if (perTeam && perTeam.length > 0 && (client.workflowStatus === 'In Progress' || client.workflowStatus === 'Completed' || client.workflowStatus === 'Allocated')) {
                                    const statusColor = (s) => s === 'Completed'
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                      : s === 'In Progress'
                                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
                                    return (
                                      <div className="flex flex-col gap-1">
                                        {perTeam.map((t, i) => (
                                          <span key={i} className={`px-2 py-0.5 rounded-md text-[10px] font-bold truncate ${statusColor(t.status)}`} title={`${t.label}: ${t.status}`}>
                                            {t.label}: {t.status}
                                          </span>
                                        ))}
                                      </div>
                                    );
                                  }
                                  return (
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${
                                      client.workflowStatus === 'Completed'
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : client.workflowStatus === 'In Progress'
                                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    }`}>
                                      {getStatusLabel(client.workflowStatus)}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="p-3 text-xs overflow-hidden">
                                {(() => {
                                  const teams = client.assignedTeam;
                                  const teamList = !teams ? [] : Array.isArray(teams) ? teams : teams === 'all' ? ['design', 'developer', 'ads'] : [teams];
                                  const assignees = [];
                                  if (teamList.includes('ads') || teamList.includes('all')) assignees.push({ team: 'Ads', name: client.assignedAdSpecialistName || null, color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' });
                                  if (teamList.includes('design') || teamList.includes('all')) assignees.push({ team: 'Design', name: client.assignedDesignerName || null, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' });
                                  if (teamList.includes('developer') || teamList.includes('all')) assignees.push({ team: 'Dev', name: client.assignedDeveloperName || null, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' });
                                  if (assignees.length === 0) {
                                    return (
                                      <span className="text-slate-700 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full font-bold inline-block">
                                        {getTeamDisplayLabel(client.assignedTeam)}
                                      </span>
                                    );
                                  }
                                  return (
                                    <div className="flex flex-col gap-1">
                                      {assignees.map((a, i) => (
                                        <span key={i} className={`px-2 py-0.5 rounded-md text-[10px] font-bold truncate ${a.color}`} title={`${a.team}: ${a.name || 'Unclaimed'}`}>
                                          {a.team}: {a.name || <span className="opacity-50 italic">Unclaimed</span>}
                                        </span>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="p-3 text-indigo-650 dark:text-indigo-400 font-semibold truncate">
                                {client.salespersonName}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
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
      {/* Detailed Client Profile View Modal (Read-Only) */}
      {viewedClientId && (() => {
        const client = leads.find(l => (l._id || l.id) === viewedClientId);
        if (!client) return null;

        return (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-150 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Client Profile Dossier
                    </h3>
                    <span className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                      ID: {client.clientId || 'N/A'}
                    </span>
                    {(() => {
                      const badge = getPaymentStatus(client);
                      return (
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${badge.color}`}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-555 mt-1">
                    Created by salesperson <strong className="text-indigo-650 dark:text-indigo-405">{client.salespersonName}</strong> on {new Date(client.createdAt || client.timestamp).toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => setViewedClientId(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-gray-700 dark:text-gray-300">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Client Details Forms (2/3 width) */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Contact Info Card */}
                    <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        1. Contact Information
                      </h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 block uppercase">Client Name</span>
                          <strong className="text-gray-900 dark:text-white">{client.clientName}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-555 block uppercase">Company Name</span>
                          <span className="text-gray-900 dark:text-white font-semibold">{client.companyName || '—'}</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-[10px] font-bold text-gray-400 block uppercase">Business Number</span>
                          <span className="font-mono text-gray-900 dark:text-white font-bold">{client.mobileNumber}</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-[10px] font-bold text-gray-400 block uppercase">Email Address</span>
                          <span className="text-gray-900 dark:text-white font-medium">{client.email || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Social Media Access Card */}
                    <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        2. Social Channels Credentials
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800/50">
                          <span className="text-[10px] font-bold text-gray-450 block mb-1">Facebook ID</span>
                          <span className="font-mono text-xs text-gray-900 dark:text-white font-semibold">{client.facebookId || '—'}</span>
                          {client.facebookPassword && (
                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800/40">
                              <span className="text-[10px] font-bold text-gray-455 block mb-0.5">Password</span>
                              <span className="font-mono text-xs text-rose-500 select-all font-bold">{client.facebookPassword}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800/50">
                          <span className="text-[10px] font-bold text-gray-455 block mb-1">Instagram ID</span>
                          <span className="font-mono text-xs text-gray-900 dark:text-white font-semibold">{client.instagramId || '—'}</span>
                          {client.instagramPassword && (
                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800/40">
                              <span className="text-[10px] font-bold text-gray-455 block mb-0.5">Password</span>
                              <span className="font-mono text-xs text-rose-500 select-all font-bold">{client.instagramPassword}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>


                    {/* Deliverables Card */}
                    <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        3. Deliverables Tracking & Milestones
                      </h4>
                      
                      {/* Posters */}
                      {Number(client.postersRequired || 0) > 0 && (
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800/40 pb-2.5">
                          <div>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">Graphic Posters</span>
                            <span className="text-[10px] text-gray-455 font-medium">
                              Required: {client.postersRequired} • Pending: {client.postersPending ?? (client.postersStatus === 'Completed' ? 0 : client.postersRequired)}
                            </span>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            client.postersStatus === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : client.postersStatus === 'In Progress'
                                ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {client.postersStatus || 'Pending'}
                          </span>
                        </div>
                      )}

                      {/* Videos */}
                      {Number(client.videosRequired || 0) > 0 && (
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800/40 pb-2.5">
                          <div>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">Reels & Videos</span>
                            <span className="text-[10px] text-gray-455 font-medium">
                              Required: {client.videosRequired} • Pending: {client.videosPending ?? (client.videosStatus === 'Completed' ? 0 : client.videosRequired)}
                            </span>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            client.videosStatus === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : client.videosStatus === 'In Progress'
                                ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {client.videosStatus || 'Pending'}
                          </span>
                        </div>
                      )}

                      {/* Ads */}
                      {Number(client.adsRequired || 0) > 0 && (
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800/40 pb-2.5">
                          <div>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">Ads Campaigns</span>
                            <span className="text-[10px] text-gray-455 font-medium">
                              Required: {client.adsRequired} • Pending: {client.adsPending ?? (client.adsStatus === 'Completed' ? 0 : client.adsRequired)}
                            </span>
                            {/* ADD THIS BELOW ↓ */}
      {client.platforms && client.platforms.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {client.platforms.map((p, idx) => (
            <span key={idx} className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/10">
              {p}
            </span>
          ))}
        </div>
      )}
                          </div>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            client.adsStatus === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : client.adsStatus === 'In Progress'
                                ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {client.adsStatus || 'Pending'}
                          </span>
                        </div>
                      )}

                      {/* Website */}
                      {client.websiteRequired && (
                        <div className="flex justify-between items-center pb-1">
                          <div>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">Website Development ({client.websiteType || 'General'})</span>
                            <span className="text-[10px] text-gray-455 font-medium">
                              Pending Tasks: {client.websitePending || 0}
                            </span>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            client.websiteStatus === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : client.websiteStatus === 'In Progress'
                                ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {client.websiteStatus || 'Pending'}
                          </span>
                        </div>
                      )}

                      {/* Other Tools */}
                      {client.otherTools && client.otherTools.length > 0 && (
                        <div className="flex justify-between items-center pb-1 border-t border-gray-100 dark:border-slate-800/40 pt-2 mt-2">
                          <div>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">Other Required Tools</span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {(Array.isArray(client.otherTools) ? client.otherTools : [client.otherTools]).join(', ')}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                            Required
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Specifications Card */}
                    <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        4. Campaign Specifications
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 block uppercase">Business Category</span>
                          <span className="text-gray-905 dark:text-white font-semibold">{client.businessCategory || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 block uppercase">Website Link</span>
                          {client.websiteUrl ? (
                            <a href={client.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline break-all font-semibold block">
                              {client.websiteUrl}
                            </a>
                          ) : (
                            <span className="text-gray-450 block">—</span>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 block uppercase">Start Date</span>
                          <span className="text-gray-905 dark:text-white font-bold">{client.startDate || '—'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400 block uppercase">Delivery Deadline</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-rose-600 dark:text-rose-400 font-bold">{client.deliveryDeadline || '—'}</span>
                             {(() => {
                               const deadlineAlert = checkDeadlineAlert(client.deliveryDeadline, client.workflowStatus);
                               if (deadlineAlert) {
                                 return (
                                   <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md ${deadlineAlert.color}`}>
                                     {deadlineAlert.label}
                                   </span>
                                 );
                               }
                               return null;
                             })()}
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Brand Colors</span>
                        <div className="flex gap-2 items-center">
                          <span 
                            style={{ backgroundColor: client.brandColors }}
                            className="w-4 h-4 rounded border border-gray-250/60 block" 
                          />
                          <span className="text-xs font-mono text-gray-905 dark:text-white font-semibold">{client.brandColors || '—'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">Target Audience</span>
                        <span className="text-gray-900 dark:text-white font-medium block mt-0.5">{client.targetAudience || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">Key Competitors</span>
                        <span className="text-gray-900 dark:text-white font-medium block mt-0.5">{client.competitors || '—'}</span>
                      </div>
                    </div>

                    {/* Comments & Remarks Card */}
                    <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        5. Notes & Internal Remarks
                      </h4>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 block uppercase">Salesperson Onboarding Notes</span>
                        <p className="text-xs text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-line leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800/60">
                          {client.notes || 'No notes provided.'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 block uppercase">Internal Production Remarks</span>
                        <p className="text-xs text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-line leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-gray-100 dark:border-slate-805 font-medium">
                          {client.remarks || 'No internal remarks.'}
                        </p>
                      </div>
                    </div>
                  </div>

                {/* Right Column: Shared Communication Chat (1/3 width) */}
                <div className="space-y-6 lg:col-span-1 flex flex-col justify-between">
                    <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 flex-1 flex flex-col">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                        6. Shared Communication Chat
                      </h4>
                      <ClientChat leadId={client._id || client.id} layout="stack" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end p-5 border-t border-gray-100 dark:border-slate-800/80">
                <Button
                  onClick={() => setViewedClientId(null)}
                  variant="outline"
                  size="sm"
                >
                  Close Dossier
                </Button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}