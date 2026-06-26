import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  Film, 
  Globe, 
  Sliders, 
  Clock, 
  CheckCircle, 
  Edit2, 
  Save, 
  LogOut, 
  X, 
  Search, 
  User,
  Users,
  AlertCircle,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { Input } from '../UI/Input';
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
    return { type: 'approaching', label: 'Due Date Reminder', color: 'bg-amber-500/10 text-amber-655 dark:text-amber-400 border border-amber-500/20 font-bold' };
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
  if (advance > 0 && advance < plan) return { label: 'Partially Paid', color: 'bg-amber-500/10 text-amber-650 border border-amber-550/25 font-bold border-amber-500/20' };
  return { label: 'Unpaid', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20' };
};

export default function TechnicalPortal({
  notifications = [],
  setNotifications,
  onAddToast,
  onAddNotification
}) {
  const { user, authFetch, logout } = useAuth();
  const userId = user?.id || user?._id;
  const [leads, setLeads] = useState([]);
  const [filterWorkflowStatus, setFilterWorkflowStatus] = useState('All');
  const [filterAssignedTeam, setFilterAssignedTeam] = useState('All');
  
  // Central Clients Management filter states
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState('All');
  const [clientTeamFilter, setClientTeamFilter] = useState('All');
  const [clientStartDateFilter, setClientStartDateFilter] = useState('');
  const [clientEndDateFilter, setClientEndDateFilter] = useState('');

  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [postersStatus, setPostersStatus] = useState('Pending');
  const [postersPending, setPostersPending] = useState(0);
  const [videosStatus, setVideosStatus] = useState('Pending');
  const [videosPending, setVideosPending] = useState(0);
  const [adsStatus, setAdsStatus] = useState('Pending');
  const [adsPending, setAdsPending] = useState(0);
  const [websiteStatus, setWebsiteStatus] = useState('Pending');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewedClientId, setViewedClientId] = useState(null);
  const [showFbPass, setShowFbPass] = useState(false);
  const [showIgPass, setShowIgPass] = useState(false);
  const [activeMetricsModal, setActiveMetricsModal] = useState(null);
  const [editWorkflowStatus, setEditWorkflowStatus] = useState('Allocated');
  const [showNotifications, setShowNotifications] = useState(false);

  const isFirstLoadRef = React.useRef(true);

  const fetchAssignedLeads = async () => {
    const isFirst = isFirstLoadRef.current;
    if (isFirst) {
      setIsLoading(true);
    }
    try {
      const res = await authFetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      } else {
        onAddToast('Fetch Error', 'Failed to retrieve assigned tasks.', 'error');
      }
    } catch (error) {
      console.error('Fetch leads error:', error);
      onAddToast('Fetch Error', 'Network or server error loading tasks.', 'error');
    } finally {
      if (isFirst) {
        setIsLoading(false);
        isFirstLoadRef.current = false;
      }
    }
  };

  useEffect(() => {
    fetchAssignedLeads();
    const interval = setInterval(fetchAssignedLeads, 5000);
    return () => clearInterval(interval);
  }, []);

  const selectedLead = leads.find(l => (l._id || l.id) === selectedLeadId);

  const teamAssignee = user?.team === 'developer'
    ? selectedLead?.assignedDeveloper
    : user?.team === 'design'
      ? selectedLead?.assignedDesigner
      : user?.team === 'ads'
        ? selectedLead?.assignedAdSpecialist
        : selectedLead?.assignedTo;
  const teamAssigneeId = (teamAssignee?._id || teamAssignee || '').toString();

  useEffect(() => {
    if (selectedLead) {
      setPostersStatus(selectedLead.postersStatus || 'Pending');
      setPostersPending(Number(selectedLead.postersPending ?? selectedLead.postersRequired ?? 0));
      setVideosStatus(selectedLead.videosStatus || 'Pending');
      setVideosPending(Number(selectedLead.videosPending ?? selectedLead.videosRequired ?? 0));
      setAdsStatus(selectedLead.adsStatus || 'Pending');
      setAdsPending(Number(selectedLead.adsPending ?? selectedLead.adsRequired ?? 0));
      setWebsiteStatus(selectedLead.websiteStatus || 'Pending');
      setEditWorkflowStatus(selectedLead.workflowStatus || 'Allocated');
    } else {
      setPostersStatus('Pending');
      setPostersPending(0);
      setVideosStatus('Pending');
      setVideosPending(0);
      setAdsStatus('Pending');
      setAdsPending(0);
      setWebsiteStatus('Pending');
      setEditWorkflowStatus('Allocated');
    }
  }, [selectedLeadId, teamAssigneeId]);

  const handleSelectLead = (leadId) => {
    setSelectedLeadId(leadId);
    if (window.innerWidth < 1280) {
      setTimeout(() => {
        const panel = document.getElementById('update-milestone-panel');
        if (panel) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 120);
    }
  };

  const handleCancelEdit = () => {
    if (selectedLead) {
      setPostersStatus(selectedLead.postersStatus || 'Pending');
      setPostersPending(Number(selectedLead.postersPending ?? selectedLead.postersRequired ?? 0));
      setVideosStatus(selectedLead.videosStatus || 'Pending');
      setVideosPending(Number(selectedLead.videosPending ?? selectedLead.videosRequired ?? 0));
      setAdsStatus(selectedLead.adsStatus || 'Pending');
      setAdsPending(Number(selectedLead.adsPending ?? selectedLead.adsRequired ?? 0));
      setWebsiteStatus(selectedLead.websiteStatus || 'Pending');
      setEditWorkflowStatus(selectedLead.workflowStatus || 'Allocated');
      onAddToast('Reset Updates', 'Updates draft reset to current database values.', 'info');
    }
  };

  const handleSaveUpdates = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedLead) return;

    setIsSubmitting(true);
    try {
      const updatePayload = {};

      if (selectedLead.postersRequired !== undefined) {
        const postersPendingCount = postersStatus === 'Completed' ? 0 : (postersStatus === 'Pending' ? Number(selectedLead.postersRequired || 0) : Number(postersPending));
        updatePayload.postersStatus = postersStatus;
        updatePayload.postersPending = postersPendingCount;
      }

      if (selectedLead.videosRequired !== undefined) {
        const videosPendingCount = videosStatus === 'Completed' ? 0 : (videosStatus === 'Pending' ? Number(selectedLead.videosRequired || 0) : Number(videosPending));
        updatePayload.videosStatus = videosStatus;
        updatePayload.videosPending = videosPendingCount;
      }

      if (selectedLead.adsRequired !== undefined) {
        const adsPendingCount = adsStatus === 'Completed' ? 0 : (adsStatus === 'Pending' ? Number(selectedLead.adsRequired || 0) : Number(adsPending));
        updatePayload.adsStatus = adsStatus;
        updatePayload.adsPending = adsPendingCount;
      }

      if (selectedLead.websiteRequired !== undefined) {
        const websitePendingCount = selectedLead.websiteRequired ? (websiteStatus === 'Completed' ? 0 : 1) : 0;
        updatePayload.websiteStatus = websiteStatus;
        updatePayload.websitePending = websitePendingCount;
      }

      if (editWorkflowStatus !== selectedLead.workflowStatus) {
        updatePayload.workflowStatus = editWorkflowStatus;
      }

      const res = await authFetch(`/api/leads/${selectedLead._id || selectedLead.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatePayload)
      });

      if (res.ok) {
        onAddToast('Lead Updated', `Successfully updated deliverables status for ${selectedLead.clientName}.`, 'success');
        // if (onAddNotification) {
        //   onAddNotification(`Technical member "${user?.name || ''}" updated campaign specs for client "${selectedLead.clientName}".`, 'info');
        // }
        await fetchAssignedLeads();
      } else {
        const errData = await res.json();
        onAddToast('Update Failed', errData.message || 'Error saving changes.', 'error');
      }
    } catch (error) {
      console.error('Update lead error:', error);
      onAddToast('Update Failed', 'Network or server error during update.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptClick = async (lead) => {
    setIsLoading(true);
    try {
      const res = await authFetch(`/api/leads/${lead._id || lead.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          assignedTo: userId,
          assignedToName: user?.name,
          workflowStatus: 'In Progress'
        })
      });

      if (res.ok) {
        onAddToast('Client Accepted', `Successfully accepted folder for ${lead.clientName}.`, 'success');
        // if (onAddNotification) {
        //   onAddNotification(`Technical member "${user?.name || ''}" accepted client campaign folder for "${lead.clientName}".`, 'info');
        // }
        await fetchAssignedLeads();
      } else {
        const errData = await res.json();
        onAddToast('Accept Failed', errData.message || 'Error accepting client.', 'error');
      }
    } catch (error) {
      console.error('Accept lead error:', error);
      onAddToast('Accept Failed', 'Network or server error during accept.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCentralStatusChange = async (leadId, newStatus) => {
    try {
      const res = await authFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ workflowStatus: newStatus })
      });
      if (res.ok) {
        fetchAssignedLeads();
        onAddToast('Status Updated', `Updated workflow status to ${newStatus}.`, 'success');
        // if (onAddNotification) {
        //   onAddNotification(`Technical member "${user?.name || ''}" updated workflow status of client to ${newStatus}.`, 'update');
        // }
      }
    } catch (err) {
      console.error(err);
      onAddToast('Error', 'Failed to update client status.', 'error');
    }
  };

  // Define teamLeads scoped to technician's department only
  const teamLeads = useMemo(() => {
    if (!user?.team || user?.team === 'all') return leads;
    return leads.filter(l => hasTeamVal(l.assignedTeam, user.team));
  }, [leads, user?.team]);

  // Metric aggregates based on claimed clients only (within technician's department)
  const myLeads = useMemo(() => {
    return teamLeads.filter(l => {
      const teamAssignee = user?.team === 'developer'
        ? l.assignedDeveloper
        : user?.team === 'design'
          ? l.assignedDesigner
          : user?.team === 'ads'
            ? l.assignedAdSpecialist
            : l.assignedTo;
      const teamAssigneeId = teamAssignee?._id || teamAssignee;
      return teamAssigneeId && teamAssigneeId === userId;
    });
  }, [teamLeads, user?.team, userId]);

  const totalPosters = useMemo(() => myLeads.reduce((acc, l) => acc + Number(l.postersRequired || 0), 0), [myLeads]);
  const pendingPosters = useMemo(() => myLeads.reduce((acc, l) => acc + (Number(l.postersRequired) > 0 ? Number(l.postersPending ?? l.postersRequired) : 0), 0), [myLeads]);
  const completedPosters = useMemo(() => totalPosters - pendingPosters, [totalPosters, pendingPosters]);

  const totalVideos = useMemo(() => myLeads.reduce((acc, l) => acc + Number(l.videosRequired || 0), 0), [myLeads]);
  const pendingVideos = useMemo(() => myLeads.reduce((acc, l) => acc + (Number(l.videosRequired) > 0 ? Number(l.videosPending ?? l.videosRequired) : 0), 0), [myLeads]);
  const completedVideos = useMemo(() => totalVideos - pendingVideos, [totalVideos, pendingVideos]);

  const totalWebsites = useMemo(() => myLeads.filter(l => l.websiteRequired).length, [myLeads]);
  const completedWebsites = useMemo(() => myLeads.filter(l => l.websiteRequired && l.websiteStatus === 'Completed').length, [myLeads]);
  const pendingWebsites = useMemo(() => totalWebsites - completedWebsites, [totalWebsites, completedWebsites]);

  const totalCampaigns = useMemo(() => myLeads.reduce((acc, l) => acc + Number(l.adsRequired || 0), 0), [myLeads]);
  const pendingCampaigns = useMemo(() => myLeads.reduce((acc, l) => acc + (Number(l.adsRequired) > 0 ? Number(l.adsPending ?? l.adsRequired) : 0), 0), [myLeads]);
  const completedCampaigns = useMemo(() => totalCampaigns - pendingCampaigns, [totalCampaigns, pendingCampaigns]);

  // Scope the top metrics grid counts to department tasks only via teamLeads
  const totalClientsCount = useMemo(() => teamLeads.length, [teamLeads]);
  const claimedClientsCount = useMemo(() => {
    return teamLeads.filter(l => {
      const teamAssignee = user?.team === 'developer'
        ? l.assignedDeveloper
        : user?.team === 'design'
          ? l.assignedDesigner
          : user?.team === 'ads'
            ? l.assignedAdSpecialist
            : l.assignedTo;
      return !!teamAssignee;
    }).length;
  }, [teamLeads, user?.team]);

  const unclaimedClientsCount = useMemo(() => {
    return teamLeads.filter(l => {
      const teamAssignee = user?.team === 'developer'
        ? l.assignedDeveloper
        : user?.team === 'design'
          ? l.assignedDesigner
          : user?.team === 'ads'
            ? l.assignedAdSpecialist
            : l.assignedTo;
      return !teamAssignee;
    }).length;
  }, [teamLeads, user?.team]);

  const inProgressClientsCount = useMemo(() => teamLeads.filter(l => l.workflowStatus === 'In Progress').length, [teamLeads]);
  const pendingClientsCount = useMemo(() => teamLeads.filter(l => l.workflowStatus === 'Allocated').length, [teamLeads]);
  const completedClientsCount = useMemo(() => teamLeads.filter(l => l.workflowStatus === 'Completed').length, [teamLeads]);

  const getMetricsModalTitleAndList = () => {
    switch (activeMetricsModal) {
      case 'total':
        return { title: 'Total Department Clients', list: teamLeads };
      case 'claimed':
        return { 
          title: 'Claimed Department Clients', 
          list: teamLeads.filter(l => {
            const teamAssignee = user?.team === 'developer'
              ? l.assignedDeveloper
              : user?.team === 'design'
                ? l.assignedDesigner
                : user?.team === 'ads'
                  ? l.assignedAdSpecialist
                  : l.assignedTo;
            return !!teamAssignee;
          }) 
        };
      case 'unclaimed':
        return { 
          title: 'Unclaimed Department Clients', 
          list: teamLeads.filter(l => {
            const teamAssignee = user?.team === 'developer'
              ? l.assignedDeveloper
              : user?.team === 'design'
                ? l.assignedDesigner
                : user?.team === 'ads'
                  ? l.assignedAdSpecialist
                  : l.assignedTo;
            return !teamAssignee;
          }) 
        };
      case 'in-progress':
        return { 
          title: 'In-Progress Campaigns', 
          list: teamLeads.filter(l => l.workflowStatus === 'In Progress') 
        };
      case 'pending':
        return { 
          title: 'Pending Campaigns', 
          list: teamLeads.filter(l => l.workflowStatus === 'Allocated') 
        };
      case 'completed':
        return { 
          title: 'Completed Campaigns', 
          list: teamLeads.filter(l => l.workflowStatus === 'Completed') 
        };
      default:
        return { title: '', list: [] };
    }
  };

  const [isLoading, setIsLoading] = useState(true);

  // Main checklist filters wrapped in useMemo, ensuring filteredLeads filters out any leads that do not belong to the technician's department
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // 0. Filter out any leads that do not belong to the technician's department
      if (user?.team && user?.team !== 'all') {
        if (!hasTeamVal(lead.assignedTeam, user.team)) {
          return false;
        }
      }

      // Only show unclaimed tasks or tasks assigned to me in the main checklist
      const teamAssignee = user?.team === 'developer'
        ? lead.assignedDeveloper
        : user?.team === 'design'
          ? lead.assignedDesigner
          : user?.team === 'ads'
            ? lead.assignedAdSpecialist
            : lead.assignedTo;
      const teamAssigneeId = teamAssignee?._id || teamAssignee;
      if (teamAssigneeId && teamAssigneeId !== userId) {
        return false;
      }

      // 1. Text Search Query
      if (listSearchQuery) {
        const q = listSearchQuery.toLowerCase();
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
      if (filterWorkflowStatus !== 'All' && (lead.workflowStatus || 'Non-Allocated') !== filterWorkflowStatus) {
        return false;
      }

      // 3. Assigned Team filter
      if (filterAssignedTeam !== 'All') {
        if (!hasTeamVal(lead.assignedTeam, filterAssignedTeam)) {
          return false;
        }
      }

      return true;
    });
  }, [leads, user?.team, userId, listSearchQuery, filterWorkflowStatus, filterAssignedTeam]);

  const unclaimedLeads = useMemo(() => {
    return filteredLeads.filter(lead => {
      const teamAssignee = user?.team === 'developer'
        ? lead.assignedDeveloper
        : user?.team === 'design'
          ? lead.assignedDesigner
          : user?.team === 'ads'
            ? lead.assignedAdSpecialist
            : lead.assignedTo;
      return !teamAssignee;
    });
  }, [filteredLeads, user?.team]);

  const claimedLeads = useMemo(() => {
    return filteredLeads.filter(lead => {
      const teamAssignee = user?.team === 'developer'
        ? lead.assignedDeveloper
        : user?.team === 'design'
          ? lead.assignedDesigner
          : user?.team === 'ads'
            ? lead.assignedAdSpecialist
            : lead.assignedTo;
      const teamAssigneeId = teamAssignee?._id || teamAssignee;
      return teamAssigneeId && teamAssigneeId === userId;
    });
  }, [filteredLeads, user?.team, userId]);

  useEffect(() => {
    if (filteredLeads.length > 0) {
      const exists = filteredLeads.some(l => (l._id || l.id) === selectedLeadId);
      if (!exists) {
        // Prioritize claimed leads for default selection, fallback to unclaimed
        const defaultLead = claimedLeads[0] || unclaimedLeads[0] || filteredLeads[0];
        setSelectedLeadId(defaultLead._id || defaultLead.id);
      }
    } else {
      setSelectedLeadId(null);
    }
  }, [filteredLeads, claimedLeads, unclaimedLeads, selectedLeadId]);

  // Central Clients Management filter logic (view all clients in the system) wrapped in useMemo
  const filteredCentralClients = useMemo(() => {
    return leads.filter(lead => {
      if (clientSearchQuery) {
        const q = clientSearchQuery.toLowerCase();
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
  }, [leads, clientSearchQuery, clientStatusFilter, clientTeamFilter, clientStartDateFilter, clientEndDateFilter]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-900 dark:text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Loading assigned work checklist...</span>
        </div>
      </div>
    );
  }

  const renderLeadCard = (lead, isClaimed) => {
    const leadId = lead._id || lead.id;
    const isSelected = leadId === selectedLeadId;
    return (
      <div
        key={leadId}
        onClick={() => handleSelectLead(leadId)}
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
              {!isClaimed ? (
                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider shrink-0 border border-amber-500/10 animate-pulse">
                  Unclaimed
                </span>
              ) : (
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                  lead.workflowStatus === 'Completed'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : lead.workflowStatus === 'In Progress'
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : lead.workflowStatus === 'Allocated'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  {lead.workflowStatus === 'Allocated' ? 'Pending' : (lead.workflowStatus || 'Non-Allocated')}
                </span>
              )}
            </div>
          </div>
          <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5 flex-wrap truncate">
            <span>{lead.clientName}</span>
            {(() => {
              const badge = getPaymentStatus(lead);
              return (
                <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${badge.color}`}>
                  {badge.label}
                </span>
              );
            })()}
          </h4>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
            {lead.companyName || 'No Company'} • {lead.businessCategory || 'No Category'}
          </p>
          <p className="text-[9px] text-gray-405 dark:text-gray-550 mt-1 font-semibold">
            Created By: {lead.salespersonName}
          </p>
        </div>
      </div>
    );
  };

  const getGridColsClass = () => {
    const team = user?.team;
    if (team === 'design') return 'grid grid-cols-1 sm:grid-cols-2 gap-4';
    if (team === 'developer' || team === 'ads') return 'grid grid-cols-1 gap-4';
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
  };

  return (
    <div className="space-y-6">
      
      {/* Portal Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 glass-card rounded-2xl gap-4 border border-indigo-500/5 relative z-30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-md">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-950 dark:text-white">Technical Team Work Portal</h2>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Logged in as: <strong className="text-gray-900 dark:text-white font-bold">{user?.name}</strong> ({user?.username})</p>
          </div>
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
              className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white/50 hover:bg-white/80 dark:bg-slate-950/30 dark:hover:bg-slate-950/60 text-gray-550 hover:text-indigo-650 dark:text-gray-400 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-sm relative"
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
                <div className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-855 rounded-2xl shadow-xl z-50 p-4 max-h-[420px] overflow-y-auto animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800/40 pb-2 mb-3">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">System Operations Log</h3>
                    <span className="text-[10px] text-gray-400 font-semibold">{notifications.filter(n => n.unread).length} Unread</span>
                  </div>

                  <div className="space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-550 text-center py-4">No logged operations yet.</p>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <div key={notif.id} className="p-2.5 rounded-xl bg-gray-50/50 dark:bg-slate-950/15 border border-gray-100/50 dark:border-slate-800/20 text-xs">
                          <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-gray-400 block mt-1.5 font-normal">
                            {new Date(notif.timestamp).toLocaleString()}
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
              onAddToast('Sign Out Success', 'Technical session terminated.', 'info');
            }}
            icon={LogOut}
          >
            Sign Out Portal
          </Button>
        </div>
      </div>

      {/* Service Metrics Grid (Department Specific) */}
      <div className={getGridColsClass()}>
        {/* Posters Card */}
        {(user?.team === 'design' || user?.team === 'all') && (
          <div className="glass-card p-5 rounded-xl border border-indigo-500/5 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800/40 pb-2.5 mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Posters</span>
              <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="grid grid-cols-3 text-center text-xs font-semibold">
              <div>
                <span className="block text-gray-900 dark:text-white text-base font-extrabold">{totalPosters}</span>
                Total
              </div>
              <div>
                <span className="block text-emerald-500 text-base font-extrabold">{completedPosters}</span>
                Done
              </div>
              <div>
                <span className="block text-amber-500 text-base font-extrabold">{pendingPosters}</span>
                Pending
              </div>
            </div>
          </div>
        )}

        {/* Videos Card */}
        {(user?.team === 'design' || user?.team === 'all') && (
          <div className="glass-card p-5 rounded-xl border border-blue-500/5 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800/40 pb-2.5 mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Videos</span>
              <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                <Film className="w-4 h-4" />
              </div>
            </div>
            <div className="grid grid-cols-3 text-center text-xs font-semibold">
              <div>
                <span className="block text-gray-900 dark:text-white text-base font-extrabold">{totalVideos}</span>
                Total
              </div>
              <div>
                <span className="block text-emerald-500 text-base font-extrabold">{completedVideos}</span>
                Done
              </div>
              <div>
                <span className="block text-amber-500 text-base font-extrabold">{pendingVideos}</span>
                Pending
              </div>
            </div>
          </div>
        )}

        {/* Websites Card */}
        {(user?.team === 'developer' || user?.team === 'all') && (
          <div className="glass-card p-5 rounded-xl border border-purple-500/5 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800/40 pb-2.5 mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Websites</span>
              <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                <Globe className="w-4 h-4" />
              </div>
            </div>
            <div className="grid grid-cols-3 text-center text-xs font-semibold">
              <div>
                <span className="block text-gray-900 dark:text-white text-base font-extrabold">{totalWebsites}</span>
                Total
              </div>
              <div>
                <span className="block text-emerald-500 text-base font-extrabold">{completedWebsites}</span>
                Done
              </div>
              <div>
                <span className="block text-amber-500 text-base font-extrabold">{pendingWebsites}</span>
                Pending
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Card */}
        {(user?.team === 'ads' || user?.team === 'all') && (
          <div className="glass-card p-5 rounded-xl border border-pink-500/5 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800/40 pb-2.5 mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Campaigns</span>
              <div className="p-2 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-lg">
                <Sliders className="w-4 h-4" />
              </div>
            </div>
            <div className="grid grid-cols-3 text-center text-xs font-semibold">
              <div>
                <span className="block text-gray-900 dark:text-white text-base font-extrabold">{totalCampaigns}</span>
                Total
              </div>
              <div>
                <span className="block text-emerald-500 text-base font-extrabold">{completedCampaigns}</span>
                Done
              </div>
              <div>
                <span className="block text-amber-500 text-base font-extrabold">{pendingCampaigns}</span>
                Pending
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Workflow Status Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
        {/* Total Clients Card */}
        <div 
          onClick={() => setActiveMetricsModal('total')}
          className="glass-card p-4 rounded-xl flex items-center gap-3 border border-indigo-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all"
        >
          <div className="p-2.5 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-405 uppercase tracking-wider">Assigned Clients</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{totalClientsCount}</p>
          </div>
        </div>

        {/* Claimed Clients Card */}
        <div 
          onClick={() => setActiveMetricsModal('claimed')}
          className="glass-card p-4 rounded-xl flex items-center gap-3 border border-blue-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all"
        >
          <div className="p-2.5 bg-blue-500/10 text-blue-650 dark:text-blue-400 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-405 uppercase tracking-wider">Claimed Clients</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{claimedClientsCount}</p>
          </div>
        </div>

        {/* Unclaimed Clients Card */}
        <div 
          onClick={() => setActiveMetricsModal('unclaimed')}
          className="glass-card p-4 rounded-xl flex items-center gap-3 border border-amber-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all"
        >
          <div className="p-2.5 bg-amber-500/10 text-amber-655 dark:text-amber-400 rounded-xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-555 dark:text-gray-400 uppercase tracking-wider">Unclaimed</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{unclaimedClientsCount}</p>
          </div>
        </div>

        {/* In Progress Card */}
        <div 
          onClick={() => setActiveMetricsModal('in-progress')}
          className="glass-card p-4 rounded-xl flex items-center gap-3 border border-purple-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all"
        >
          <div className="p-2.5 bg-purple-500/10 text-purple-650 dark:text-purple-405 rounded-xl">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">In Progress</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{inProgressClientsCount}</p>
          </div>
        </div>

        {/* Pending Card */}
        <div 
          onClick={() => setActiveMetricsModal('pending')}
          className="glass-card p-4 rounded-xl flex items-center gap-3 border border-rose-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all"
        >
          <div className="p-2.5 bg-rose-500/10 text-rose-650 dark:text-rose-455 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">Pending</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{pendingClientsCount}</p>
          </div>
        </div>

        {/* Completed Card */}
        <div 
          onClick={() => setActiveMetricsModal('completed')}
          className="glass-card p-4 rounded-xl flex items-center gap-3 border border-emerald-500/5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all"
        >
          <div className="p-2.5 bg-emerald-500/10 text-emerald-655 dark:text-emerald-400 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-555 dark:text-gray-400 uppercase tracking-wider">Completed</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{completedClientsCount}</p>
          </div>
        </div>
      </div>

       {/* Central Clients Section */}
      <div className="mt-8">
        <Card title="Client Work flow" subtitle="Central client management roster synchronized in real-time across portals">
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
                        <td className="p-3 text-indigo-650 dark:text-indigo-400 font-semibold">
                          {client.salespersonName || '—'}
                        </td>
                        <td className="p-3 text-gray-900 dark:text-white font-bold">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{client.clientName}</span>
                            {/* {(() => {
                              const badge = getPaymentStatus(client);
                              return (
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${badge.color}`}>
                                  {badge.label}
                                </span>
                              );
                            })()}
                            {(() => {
                              const deadlineAlert = checkDeadlineAlert(client.deliveryDeadline);
                              if (deadlineAlert) {
                                return (
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${deadlineAlert.color}`}>
                                    {deadlineAlert.label}
                                  </span>
                                );
                              }
                              return null;
                            })()} */}
                          </div>
                        </td>
                        <td className="p-3 text-gray-900 dark:text-white font-bold">
                          {client.companyName || '—'}
                        </td>
                        <td className="p-3 font-mono">{client.mobileNumber}</td>
                        <td className="p-3">
                          {client.assignedToName ? (
                            <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-max">
                               {client.assignedToName}
                            </span>
                          ) : (
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold">
                              {getTeamDisplayLabel(client.assignedTeam)}
                            </span>
                          )}
                        </td>
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
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Main Roster & Update Workflow */}
      <div className="w-full">
        <Card title="Assigned Client Campaigns" subtitle="Inspect briefs and update service milestones assigned to you">
          <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
            {/* Left Column - Client List Panel (35%) */}
            <div className="w-full lg:w-[35%] flex flex-col border-r border-gray-150/60 dark:border-slate-800/40 pr-0 lg:pr-6 gap-4">
              {/* Search & Filters */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search technical tasks..."
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
                    <option value="Non-Allocated">Non-Allocated</option>
                    <option value="Allocated">Allocated</option>
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

              {/* Tasks Checklist Lists Container */}
              <div className="flex-1 overflow-y-auto max-h-[600px] space-y-4 pr-1.5 scrollbar-thin">
                {/* Section 1: Unclaimed Pool */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-150/40 dark:border-slate-800/40 pb-1.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Unclaimed Tasks ({unclaimedLeads.length})
                    </span>
                  </div>
                  {unclaimedLeads.length === 0 ? (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center py-2">No unclaimed tasks in queue.</p>
                  ) : (
                    <div className="space-y-2">
                      {unclaimedLeads.map((lead) => renderLeadCard(lead, false))}
                    </div>
                  )}
                </div>

                {/* Section 2: Active Claimed Checklist */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-150/40 dark:border-slate-800/40 pb-1.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Claimed Tasks ({claimedLeads.length})
                    </span>
                  </div>
                  {claimedLeads.length === 0 ? (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center py-2">No claimed tasks yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {claimedLeads.map((lead) => renderLeadCard(lead, true))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Client Details Panel (65%) */}
            <div className="w-full lg:w-[65%] flex flex-col gap-4 bg-gray-50/50 dark:bg-slate-955/10 p-5 rounded-2xl border border-gray-150/40 dark:border-slate-800/40" id="update-milestone-panel">
              {(() => {
                const lead = selectedLead;
                if (!lead) {
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                      <AlertCircle className="w-12 h-12 text-gray-300 dark:text-slate-750 mb-3" />
                      <p className="text-sm font-semibold text-gray-400 dark:text-slate-500">
                        Select a campaign card from the list to view specifications.
                      </p>
                    </div>
                  );
                }

                const leadId = lead._id || lead.id;
                const teamAssignee = user?.team === 'developer'
                  ? lead.assignedDeveloper
                  : user?.team === 'design'
                    ? lead.assignedDesigner
                    : user?.team === 'ads'
                      ? lead.assignedAdSpecialist
                      : lead.assignedTo;
                const isClaimed = !!teamAssignee;
                
                // Details calculations
                const totalReq = Number(lead.postersRequired || 0) + Number(lead.videosRequired || 0) + Number(lead.adsRequired || 0) + (lead.websiteRequired ? 1 : 0);
                const currentPostersPending = Number(lead.postersPending ?? (lead.postersStatus === 'Completed' ? 0 : lead.postersRequired || 0));
                const currentVideosPending = Number(lead.videosPending ?? (lead.videosStatus === 'Completed' ? 0 : lead.videosRequired || 0));
                const currentAdsPending = Number(lead.adsPending ?? (lead.adsStatus === 'Completed' ? 0 : lead.adsRequired || 0));
                const currentWebsitePending = lead.websiteRequired ? (lead.websiteStatus === 'Completed' ? 0 : 1) : 0;
                const pendingReq = currentPostersPending + currentVideosPending + currentAdsPending + currentWebsitePending;
                const completedReq = totalReq - pendingReq;

                return (
                  <div className="space-y-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-5">
                      {/* Header Details */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-200/50 dark:border-slate-800/40 pb-4">
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                            {lead.clientId && (
                              <button
                                type="button"
                                onClick={() => setViewedClientId(lead._id || lead.id)}
                                className="text-indigo-650 dark:text-indigo-400 font-mono font-bold hover:underline cursor-pointer focus:outline-hidden"
                              >
                                [{lead.clientId}]
                              </button>
                            )}
                            {lead.clientName}
                            {(() => {
                              const payStatus = lead.paymentStatus || (Number(lead.planAmount || 0) > 0 && Number(lead.advanceAmount || 0) >= Number(lead.planAmount || 0) ? 'Paid' : (Number(lead.advanceAmount || 0) > 0 ? 'Partial' : 'Unpaid'));
                              if (payStatus === 'Partial') {
                                return (
                                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 ml-2">
                                    Partial Payment Done
                                  </span>
                                );
                              }
                              if (payStatus === 'Paid') {
                                return (
                                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 ml-2">
                                    Full Payment Done
                                  </span>
                                );
                              }
                              return null;
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
                          {!isClaimed ? (
                            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                              Unclaimed Task
                            </span>
                          ) : (
                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                              lead.workflowStatus === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-500/15 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : lead.workflowStatus === 'In Progress'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-500/15 dark:bg-indigo-950/40 dark:text-indigo-300'
                                  : 'bg-blue-50 text-blue-700 border-blue-500/15 dark:bg-blue-955/40 dark:text-blue-300'
                            }`}>
                              {getStatusLabel(lead.workflowStatus, lead.assignedTeam)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details Sections Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
                        {/* Profile Details & Contacts */}
                        <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-150/40 dark:border-slate-800/40 space-y-2.5">
                          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider">Contact & Registration</h4>
                          <div className="text-xs space-y-2 text-gray-750 dark:text-gray-300 font-medium">
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
                              <span>Business Number: 
                                <a 
                                  href={`https://wa.me/${lead.mobileNumber.replace(/[^0-9]/g, '')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-indigo-650 dark:text-indigo-400 hover:underline font-bold ml-1"
                                >
                                  {lead.mobileNumber}
                                </a>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span>Salesperson: <strong>{lead.salespersonName}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Specs and Deliverable Info */}
                        <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-150/40 dark:border-slate-800/40 space-y-2.5">
                          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider">Project Specifications</h4>
                          <div className="text-xs space-y-2 text-gray-750 dark:text-gray-300 font-medium">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 shrink-0">Brand Colors:</span>
                              <strong>{lead.brandColors || '—'}</strong>
                              {lead.brandColors && (
                                <span className="w-3.5 h-3.5 rounded-full border border-gray-205 shrink-0" style={{ backgroundColor: lead.brandColors }} />
                              )}
                            </div>
                            <div>
                              <span className="text-gray-400">Target Audience:</span> <strong>{lead.targetAudience || '—'}</strong>
                            </div>
                            <div>
                              <span className="text-gray-400">Competitors:</span> <strong>{lead.competitors || '—'}</strong>
                            </div>
                            {user?.team !== 'ads' && (
                              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-gray-100 dark:border-slate-805/40">
                                <span>Start: <strong>{lead.startDate || '—'}</strong></span>
                                <span className="flex items-center gap-1.5">
                                  Deadline: <strong className="text-rose-500 font-bold">{lead.deliveryDeadline || '—'}</strong>
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
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Deliverables Overview Checklist */}
                        <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-150/40 dark:border-slate-800/40 space-y-2.5 md:col-span-2">
                          <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider">Campaign Deliverables Checklist</h4>
                            <span className="text-[10px] text-gray-405 font-bold">Overall progress: {completedReq}/{totalReq} completed</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {Number(lead.postersRequired) > 0 && (
                              <div className="flex items-center justify-between p-2 bg-indigo-500/3 dark:bg-indigo-500/1 border border-indigo-500/5 rounded-lg">
                                <span className="text-gray-700 dark:text-gray-300">Posters: <strong>{lead.postersRequired} required</strong></span>
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-gray-500 font-bold">
                                  {lead.postersStatus} ({Number(lead.postersRequired) - currentPostersPending} Done)
                                </span>
                              </div>
                            )}
                            {Number(lead.videosRequired) > 0 && (
                              <div className="flex items-center justify-between p-2 bg-blue-500/3 dark:bg-blue-500/1 border border-blue-500/5 rounded-lg">
                                <span className="text-gray-700 dark:text-gray-300">Videos: <strong>{lead.videosRequired} required</strong></span>
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-gray-500 font-bold">
                                  {lead.videosStatus} ({Number(lead.videosRequired) - currentVideosPending} Done)
                                </span>
                              </div>
                            )}
                            {Number(lead.adsRequired) > 0 && (
                              <div className="flex items-center justify-between p-2 bg-pink-500/3 dark:bg-pink-500/1 border border-pink-500/5 rounded-lg">
                                <span className="text-gray-700 dark:text-gray-300">Ads/Campaigns: <strong>{lead.adsRequired} required</strong></span>
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-gray-500 font-bold">
                                  {lead.adsStatus} ({Number(lead.adsRequired) - currentAdsPending} Done)
                                </span>
                              </div>
                            )}
                            {lead.websiteRequired && (
                              <div className="flex items-center justify-between p-2 bg-purple-500/3 dark:bg-purple-500/1 border border-purple-500/5 rounded-lg sm:col-span-2">
                                <span className="text-gray-700 dark:text-gray-300">Website: <strong>{lead.websiteType || 'General'} Dev</strong></span>
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-gray-500 font-bold">
                                  {lead.websiteStatus} ({lead.websiteStatus === 'Completed' ? '1' : '0'}/1 Done)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Notes and Instructions */}
                        {lead.notes && (
                          <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-150/40 dark:border-slate-800/40 space-y-3 md:col-span-2">
                            <div className="text-xs space-y-1">
                              <h5 className="font-bold text-gray-405 text-[10px] uppercase tracking-wider">Salesperson Instructions</h5>
                              <p className="p-2.5 bg-yellow-500/5 dark:bg-yellow-550/2 border border-yellow-500/10 text-yellow-800 dark:text-yellow-300 rounded-lg leading-relaxed font-semibold">{lead.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Conditional Action area based on claimed status */}
                    <div className="border-t border-gray-200/50 dark:border-slate-800/40 pt-4 mt-2">
                      {!isClaimed ? (
                        <div className="p-4 bg-amber-500/5 border border-dashed border-amber-500/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="text-left">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white">This project is unclaimed</h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-405 mt-0.5 leading-normal">
                              Accept the client campaign to start tracking task milestones and saving progress updates.
                            </p>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAcceptClick(lead)}
                            icon={CheckCircle}
                            className="shrink-0 w-full sm:w-auto cursor-pointer shadow-sm"
                          >
                            Accept Client
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={handleSaveUpdates} className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-1">
                            {/* Workflow Status manual selector */}
                            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-2">
                              <label className="text-xs font-bold text-gray-900 dark:text-white block">Workflow Status</label>
                              <select
                                value={editWorkflowStatus}
                                onChange={(e) => setEditWorkflowStatus(e.target.value)}
                                className="w-full rounded-lg border border-gray-250 dark:border-slate-800 py-1.5 px-2 bg-white dark:bg-slate-900/60 text-gray-955 dark:text-white cursor-pointer text-xs"
                              >
                                <option value="Allocated">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </div>
                            {/* Posters update */}
                            {Number(lead.postersRequired) > 0 && (
                              <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-gray-900 dark:text-white">Posters Progress</span>
                                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Total: {lead.postersRequired} required</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-gray-405 font-bold">Status</label>
                                    <select
                                      value={postersStatus}
                                      onChange={(e) => setPostersStatus(e.target.value)}
                                      className="rounded-lg border border-gray-250 dark:border-slate-800 py-1.5 px-2 bg-white dark:bg-slate-900/60 text-gray-955 dark:text-white cursor-pointer"
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="In Progress">In Progress</option>
                                      <option value="Completed">Completed</option>
                                    </select>
                                  </div>
                                  {postersStatus !== 'Completed' && postersStatus !== 'Pending' && (
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[10px] text-gray-455 font-bold">Pending Count</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max={lead.postersRequired}
                                        value={postersPending}
                                        onChange={(e) => setPostersPending(Math.min(Number(lead.postersRequired), Math.max(0, Number(e.target.value))))}
                                        className="rounded-lg border border-gray-250 dark:border-slate-800 py-1 px-2 bg-white dark:bg-slate-900/60 text-gray-955 dark:text-white"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Videos update */}
                            {Number(lead.videosRequired) > 0 && (
                              <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-gray-900 dark:text-white">Videos Progress</span>
                                  <span className="text-[10px] text-blue-650 dark:text-blue-400">Total: {lead.videosRequired} required</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-gray-405 font-bold">Status</label>
                                    <select
                                      value={videosStatus}
                                      onChange={(e) => setVideosStatus(e.target.value)}
                                      className="rounded-lg border border-gray-250 dark:border-slate-800 py-1.5 px-2 bg-white dark:bg-slate-900/60 text-gray-955 dark:text-white cursor-pointer"
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="In Progress">In Progress</option>
                                      <option value="Completed">Completed</option>
                                    </select>
                                  </div>
                                  {videosStatus !== 'Completed' && videosStatus !== 'Pending' && (
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[10px] text-gray-455 font-bold">Pending Count</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max={lead.videosRequired}
                                        value={videosPending}
                                        onChange={(e) => setVideosPending(Math.min(Number(lead.videosRequired), Math.max(0, Number(e.target.value))))}
                                        className="rounded-lg border border-gray-250 dark:border-slate-800 py-1 px-2 bg-white dark:bg-slate-900/60 text-gray-955 dark:text-white"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Ads update */}
                            {Number(lead.adsRequired) > 0 && (
                              <div className="p-3 bg-pink-500/5 border border-pink-500/10 rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-gray-900 dark:text-white">Ads Progress</span>
                                  <span className="text-[10px] text-pink-650 dark:text-pink-400">Total: {lead.adsRequired} required</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-gray-405 font-bold">Status</label>
                                    <select
                                      value={adsStatus}
                                      onChange={(e) => setAdsStatus(e.target.value)}
                                      className="rounded-lg border border-gray-250 dark:border-slate-800 py-1.5 px-2 bg-white dark:bg-slate-900/60 text-gray-955 dark:text-white cursor-pointer"
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="In Progress">In Progress</option>
                                      <option value="Completed">Completed</option>
                                    </select>
                                  </div>
                                  {adsStatus !== 'Completed' && adsStatus !== 'Pending' && (
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[10px] text-gray-455 font-bold">Pending Count</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max={lead.adsRequired}
                                        value={adsPending}
                                        onChange={(e) => setAdsPending(Math.min(Number(lead.adsRequired), Math.max(0, Number(e.target.value))))}
                                        className="rounded-lg border border-gray-250 dark:border-slate-800 py-1 px-2 bg-white dark:bg-slate-900/60 text-gray-955 dark:text-white"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Website update */}
                            {lead.websiteRequired && (
                              <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-gray-900 dark:text-white">Website Dev</span>
                                  <span className="text-[10px] text-purple-650 dark:text-purple-400">{lead.websiteType || 'General'} website</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] text-gray-405 font-bold">Website Status</label>
                                  <select
                                    value={websiteStatus}
                                    onChange={(e) => setWebsiteStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-250 dark:border-slate-800 py-1.5 px-2 bg-white dark:bg-slate-900/60 text-gray-955 dark:text-white cursor-pointer"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Submit actions */}
                          <div className="flex items-center justify-between gap-3 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-1/2"
                              onClick={handleCancelEdit}
                            >
                              Reset
                            </Button>
                            <Button
                              type="submit"
                              variant="primary"
                              className="w-1/2"
                              isLoading={isSubmitting}
                              icon={Save}
                            >
                              Save Changes
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                    {/* Client Chat panel inside details view */}
                    <div className="border-t border-gray-200/50 dark:border-slate-800/40 pt-4">
                      <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider mb-2">Collaboration Chat</h4>
                      <ClientChat leadId={leadId} />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </Card>
      </div>

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
                    Created by salesperson <strong className="text-indigo-655 dark:text-indigo-400">{client.salespersonName}</strong> on {new Date(client.createdAt || client.timestamp).toLocaleString()}
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
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase block">Client Name</span>
                          <strong className="text-gray-900 dark:text-white">{client.clientName}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase block">Company Name</span>
                          <span className="text-gray-900 dark:text-white font-semibold">{client.companyName || '—'}</span>
                        </div>
                        <div className="mt-2">
                           <span className="text-[10px] font-bold text-gray-400 dark:text-gray-555 block uppercase">Business Number</span>
                          <span className="font-mono text-gray-900 dark:text-white font-bold">{client.mobileNumber}</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-555 block uppercase">Email Address</span>
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
                          <span className="font-mono text-xs text-gray-905 dark:text-white font-semibold">{client.facebookId || '—'}</span>
                          {client.facebookPassword && (
                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800/40 flex items-center justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-gray-450 block mb-0.5">Password</span>
                                <span className="font-mono text-xs text-rose-500 select-all font-bold">
                                  {showFbPass ? client.facebookPassword : '••••••••'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowFbPass(!showFbPass)}
                                className="text-gray-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors p-1"
                              >
                                {showFbPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800/50">
                          <span className="text-[10px] font-bold text-gray-455 block mb-1">Instagram ID</span>
                          <span className="font-mono text-xs text-gray-905 dark:text-white font-semibold">{client.instagramId || '—'}</span>
                          {client.instagramPassword && (
                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800/40 flex items-center justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-gray-455 block mb-0.5">Password</span>
                                <span className="font-mono text-xs text-rose-500 select-all font-bold">
                                  {showIgPass ? client.instagramPassword : '••••••••'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowIgPass(!showIgPass)}
                                className="text-gray-400 hover:text-indigo-655 dark:hover:text-indigo-400 transition-colors p-1"
                              >
                                {showIgPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Financials Card - Ads Team Only (Since Technical role cannot see payments) */}
                    {(user?.team === 'ads' || user?.team === 'all') && (
                      <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          3. Financial Overview
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800/50">
                            {user?.team === 'ads' ? (
                              <>
                                <span className="text-[10px] font-bold text-gray-455 block uppercase">Daily Ads Budget</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  {client.adBudgetPerDay > 0 ? `₹${client.adBudgetPerDay.toLocaleString()}/day` : '—'}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-[10px] font-bold text-gray-455 block uppercase">Ad Campaign Budget</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  ₹{(client.adBudget || 0).toLocaleString()}
                                  {client.adBudgetPerDay > 0 && ` (₹${client.adBudgetPerDay.toLocaleString()}/day)`}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}


                    {/* Deliverables Card */}
                    <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        4. Deliverables Tracking & Milestones
                      </h4>
                      
                      {/* Posters */}
                      {Number(client.postersRequired || 0) > 0 && (
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800/40 pb-2.5">
                          <div>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">Graphic Posters</span>
                            <span className="text-[10px] text-gray-450 font-medium">
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
                            <span className="text-[10px] text-gray-450 font-medium">
                              Required: {client.adsRequired} • Pending: {client.adsPending ?? (client.adsStatus === 'Completed' ? 0 : client.adsRequired)}
                            </span>
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
                            <span className="text-[10px] text-gray-450 font-medium">
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
                          <span className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                            Required
                          </span>
                        </div>
                      )}

                    </div>

                    {/* Specifications Card */}
                    <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        5. Campaign Specifications
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 block uppercase">Business Category</span>
                          <span className="text-gray-905 dark:text-white font-semibold">{client.businessCategory || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-555 block uppercase">Website Link</span>
                          {client.websiteUrl ? (
                            <a href={client.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline break-all font-semibold block">
                              {client.websiteUrl}
                            </a>
                          ) : (
                            <span className="text-gray-450 block">—</span>
                          )}
                        </div>
                        {user?.team !== 'ads' && (
                          <>
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-555 block uppercase">Start Date</span>
                              <span className="text-gray-905 dark:text-white font-bold">{client.startDate || '—'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-555 block uppercase">Delivery Deadline</span>
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
                          </>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-555 block uppercase mb-1">Brand Colors</span>
                        <div className="flex gap-2 items-center">
                          <span 
                            style={{ backgroundColor: client.brandColors }}
                            className="w-4 h-4 rounded border border-gray-250/60 block" 
                          />
                          <span className="text-xs font-mono text-gray-905 dark:text-white font-semibold">{client.brandColors || '—'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-555 block uppercase">Target Audience</span>
                        <span className="text-gray-900 dark:text-white font-medium block mt-0.5">{client.targetAudience || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-555 block uppercase">Key Competitors</span>
                        <span className="text-gray-900 dark:text-white font-medium block mt-0.5">{client.competitors || '—'}</span>
                      </div>
                    </div>

                    {/* Comments & Remarks Card */}
                    <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 space-y-3">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        6. Notes & Internal Remarks
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
                  <div className="space-y-6 lg:col-span-1 flex flex-col justify-between ">
                    <div className="bg-gray-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 flex-1 flex flex-col ">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                        6. Shared Communication Chat
                      </h4>
                      <ClientChat leadId={client._id || client.id} layout="stack" />
                    </div>
                  </div>

                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-slate-800/80">
                {!(user?.team === 'developer'
                  ? client.assignedDeveloper
                  : user?.team === 'design'
                    ? client.assignedDesigner
                    : user?.team === 'ads'
                      ? client.assignedAdSpecialist
                      : client.assignedTo) && (
                  <Button
                    onClick={async () => {
                      await handleAcceptClick(client);
                    }}
                    variant="primary"
                    size="sm"
                  >
                    Self Claim
                  </Button>
                )}
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
                    <p className="text-xs text-gray-400 dark:text-gray-555 mt-0.5">Showing {list.length} matching client briefs</p>
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
                    <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                      No client records match this category.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-gray-100 dark:border-slate-800/60 rounded-xl">
                      <table className="w-full text-left text-sm border-collapse">
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
                            <tr key={client._id || client.id} className="hover:bg-indigo-500/3 dark:hover:bg-indigo-500/1 transition-colors">
                              <td className="p-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMetricsModal(null);
                                    setViewedClientId(client._id || client.id);
                                  }}
                                  className="font-bold text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer"
                                >
                                  {client.clientId || 'N/A'}
                                </button>
                              </td>
                              <td className="p-3 text-gray-900 dark:text-white font-bold">
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
                                </div>
                                {client.companyName && (
                                  <div className="text-xs text-gray-405 dark:text-gray-550 font-normal mt-0.5">
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
                                  {client.workflowStatus === 'Allocated' ? 'Pending' : (client.workflowStatus || 'Non-Allocated')}
                                </span>
                              </td>
                              <td className="p-3">
                                {client.assignedToName ? (
                                  <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-max">
                                    👤 {client.assignedToName}
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold">
                                    Unclaimed ({getTeamDisplayLabel(client.assignedTeam)})
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-xs text-gray-500 font-semibold">{client.salespersonName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end p-5 border-t border-gray-100 dark:border-slate-800/80">
                  <Button
                    onClick={() => setActiveMetricsModal(null)}
                    variant="outline"
                    size="sm"
                  >
                    Close
                  </Button>
                </div>

              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
