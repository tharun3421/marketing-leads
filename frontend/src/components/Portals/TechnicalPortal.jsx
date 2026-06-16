import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Mail,
  Phone
} from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { Input } from '../UI/Input';
import { useAuth } from '../../context/AuthContext';

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
  const [remarks, setRemarks] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAssignedLeads = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedLeads();
  }, []);

  const selectedLead = leads.find(l => (l._id || l.id) === selectedLeadId);

  useEffect(() => {
    if (selectedLead) {
      setPostersStatus(selectedLead.postersStatus || 'Pending');
      setPostersPending(Number(selectedLead.postersPending ?? selectedLead.postersRequired ?? 0));
      setVideosStatus(selectedLead.videosStatus || 'Pending');
      setVideosPending(Number(selectedLead.videosPending ?? selectedLead.videosRequired ?? 0));
      setAdsStatus(selectedLead.adsStatus || 'Pending');
      setAdsPending(Number(selectedLead.adsPending ?? selectedLead.adsRequired ?? 0));
      setWebsiteStatus(selectedLead.websiteStatus || 'Pending');
      setRemarks(selectedLead.remarks || '');
    } else {
      setPostersStatus('Pending');
      setPostersPending(0);
      setVideosStatus('Pending');
      setVideosPending(0);
      setAdsStatus('Pending');
      setAdsPending(0);
      setWebsiteStatus('Pending');
      setRemarks('');
    }
  }, [selectedLeadId, leads]);

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
      setRemarks(selectedLead.remarks || '');
      onAddToast('Reset Updates', 'Updates draft reset to current database values.', 'info');
    }
  };

  const handleSaveUpdates = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;

    setIsSubmitting(true);
    try {
      const postersPendingCount = postersStatus === 'Completed' ? 0 : (postersStatus === 'Pending' ? Number(selectedLead.postersRequired || 0) : Number(postersPending));
      const videosPendingCount = videosStatus === 'Completed' ? 0 : (videosStatus === 'Pending' ? Number(selectedLead.videosRequired || 0) : Number(videosPending));
      const adsPendingCount = adsStatus === 'Completed' ? 0 : (adsStatus === 'Pending' ? Number(selectedLead.adsRequired || 0) : Number(adsPending));
      const websitePendingCount = selectedLead.websiteRequired ? (websiteStatus === 'Completed' ? 0 : 1) : 0;

      // Calculate workflow status automatically
      const activeStatuses = [];
      if (Number(selectedLead.postersRequired) > 0) activeStatuses.push(postersStatus);
      if (Number(selectedLead.videosRequired) > 0) activeStatuses.push(videosStatus);
      if (Number(selectedLead.adsRequired) > 0) activeStatuses.push(adsStatus);
      if (selectedLead.websiteRequired) activeStatuses.push(websiteStatus);

      let calculatedWorkflowStatus = 'In Progress';
      if (activeStatuses.length === 0 || activeStatuses.every(s => s === 'Completed')) {
        calculatedWorkflowStatus = 'Completed';
      } else if (activeStatuses.every(s => s === 'Pending')) {
        calculatedWorkflowStatus = 'Allocated';
      }

      const updatePayload = {
        postersStatus,
        postersPending: postersPendingCount,
        videosStatus,
        videosPending: videosPendingCount,
        adsStatus,
        adsPending: adsPendingCount,
        websiteStatus,
        websitePending: websitePendingCount,
        workflowStatus: calculatedWorkflowStatus,
        remarks
      };

      const res = await authFetch(`/api/leads/${selectedLead._id}`, {
        method: 'PUT',
        body: JSON.stringify(updatePayload)
      });

      if (res.ok) {
        onAddToast('Lead Updated', `Successfully updated deliverables status for ${selectedLead.clientName}.`, 'success');
        if (onAddNotification) {
          onAddNotification(`Technical member "${user?.name || ''}" updated campaign specs for client "${selectedLead.clientName}".`, 'info');
        }
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
      const res = await authFetch(`/api/leads/${lead._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          assignedTo: userId,
          assignedToName: user?.name,
          workflowStatus: 'Allocated'
        })
      });

      if (res.ok) {
        onAddToast('Client Accepted', `Successfully accepted folder for ${lead.clientName}.`, 'success');
        if (onAddNotification) {
          onAddNotification(`Technical member "${user?.name || ''}" accepted client campaign folder for "${lead.clientName}".`, 'info');
        }
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
        if (onAddNotification) {
          onAddNotification(`Technical member "${user?.name || ''}" updated workflow status of client to ${newStatus}.`, 'update');
        }
      }
    } catch (err) {
      console.error(err);
      onAddToast('Error', 'Failed to update client status.', 'error');
    }
  };

  // Metric aggregates based on claimed clients only
  const myLeads = leads.filter(l => l.assignedTo && (l.assignedTo?._id || l.assignedTo) === userId);

  const totalPosters = myLeads.reduce((acc, l) => acc + Number(l.postersRequired || 0), 0);
  const pendingPosters = myLeads.reduce((acc, l) => acc + (Number(l.postersRequired) > 0 ? Number(l.postersPending ?? l.postersRequired) : 0), 0);
  const completedPosters = totalPosters - pendingPosters;

  const totalVideos = myLeads.reduce((acc, l) => acc + Number(l.videosRequired || 0), 0);
  const pendingVideos = myLeads.reduce((acc, l) => acc + (Number(l.videosRequired) > 0 ? Number(l.videosPending ?? l.videosRequired) : 0), 0);
  const completedVideos = totalVideos - pendingVideos;

  const totalWebsites = myLeads.filter(l => l.websiteRequired).length;
  const completedWebsites = myLeads.filter(l => l.websiteRequired && l.websiteStatus === 'Completed').length;
  const pendingWebsites = totalWebsites - completedWebsites;

  const totalCampaigns = myLeads.reduce((acc, l) => acc + Number(l.adsRequired || 0), 0);
  const pendingCampaigns = myLeads.reduce((acc, l) => acc + (Number(l.adsRequired) > 0 ? Number(l.adsPending ?? l.adsRequired) : 0), 0);
  const completedCampaigns = totalCampaigns - pendingCampaigns;

  const completedProjectsCount = myLeads.filter(l => l.workflowStatus === 'Completed').length;
  const inProgressProjectsCount = myLeads.filter(l => l.workflowStatus === 'In Progress').length;
  const allocatedClientsCount = myLeads.filter(l => l.workflowStatus === 'Allocated').length;
  const claimedClientsCount = myLeads.length;

  const [isLoading, setIsLoading] = useState(true);

  const filteredLeads = leads.filter(lead => {
    // 0. Only show unclaimed tasks or tasks assigned to me in the main checklist
    const leadAssignedToId = lead.assignedTo?._id || lead.assignedTo;
    if (leadAssignedToId && leadAssignedToId !== userId) {
      return false;
    }

    // 1. Text Search Query
    if (listSearchQuery) {
      const q = listSearchQuery.toLowerCase();
      const nameMatch = (lead.clientName || '').toLowerCase().includes(q);
      const companyMatch = (lead.companyName || '').toLowerCase().includes(q);
      const idMatch = (lead.clientId || '').toLowerCase().includes(q);
      const phoneMatch = (lead.mobileNumber || '').toLowerCase().includes(q);
      if (!nameMatch && !companyMatch && !idMatch && !phoneMatch) return false;
    }

    // 2. Status filter
    if (filterWorkflowStatus !== 'All' && (lead.workflowStatus || 'Non-Allocated') !== filterWorkflowStatus) {
      return false;
    }

    // 3. Assigned Team filter
    if (filterAssignedTeam !== 'All') {
      if (lead.assignedTeam !== filterAssignedTeam && lead.assignedTeam !== 'all') {
        return false;
      }
    }

    return true;
  });

  const unclaimedLeads = filteredLeads.filter(lead => !lead.assignedTo);
  const claimedLeads = filteredLeads.filter(lead => {
    const leadAssignedToId = lead.assignedTo?._id || lead.assignedTo;
    return leadAssignedToId && leadAssignedToId === userId;
  });

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
  }, [filteredLeads, selectedLeadId]);

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
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              {lead.clientId || 'N/A'}
            </span>
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
                {lead.workflowStatus || 'Non-Allocated'}
              </span>
            )}
          </div>
          <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
            {lead.clientName}
          </h4>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
            {lead.companyName || 'No Company'} • {lead.businessCategory || 'No Category'}
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 glass-card rounded-2xl gap-4 border border-indigo-500/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-md">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-950 dark:text-white">Technical Team Work Portal</h2>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Logged in as: <strong className="text-gray-900 dark:text-white font-bold">{user?.name}</strong> ({user?.username})</p>
          </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-indigo-500/5">
          <div className="p-3 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-405 uppercase tracking-wider">Claimed Clients</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{claimedClientsCount}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-blue-500/5">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-555 dark:text-gray-400 uppercase tracking-wider">Allocated</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{allocatedClientsCount}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-purple-500/5">
          <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">In Progress</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{inProgressProjectsCount}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-emerald-500/5">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-555 dark:text-gray-400 uppercase tracking-wider">Completed</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{completedProjectsCount}</p>
          </div>
        </div>
      </div>

       {/* Central Clients Section */}
      <div className="mt-8">
        <Card title="Clients" subtitle="Central client management roster synchronized in real-time across portals">
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
                  <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client ID</th>
                  <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                  <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client Name</th>
                  <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">WhatsApp Number</th>
                  <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Assigned To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-750 dark:text-gray-355 font-medium">
                {filteredCentralClients.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-gray-400 dark:text-gray-500 font-normal">
                      No clients found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredCentralClients.map((client) => {
                    const teamLabels = {
                      'design': 'Design Team',
                      'developer': 'Development Team',
                      'ads': 'Ads Team',
                      'all': 'All Teams'
                    };
                    return (
                      <tr key={client._id} className="hover:bg-indigo-500/3 dark:hover:bg-indigo-500/1 transition-colors">
                        <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                          {client.clientId || 'N/A'}
                        </td>
                        <td className="p-3 font-bold text-gray-900 dark:text-white">
                          {new Date(client.createdAt || client.timestamp).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-gray-900 dark:text-white font-bold">
                          <div>{client.clientName}</div>
                          {client.companyName && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 font-normal mt-0.5">
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
                              {teamLabels[client.assignedTeam] || 'Not Assigned'}
                            </span>
                          )}
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
                    <option value="design">Design Team</option>
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
                const isClaimed = !!lead.assignedTo;
                
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
                              <span className="text-indigo-650 dark:text-indigo-400 font-mono font-bold">
                                [{lead.clientId}]
                              </span>
                            )}
                            {lead.clientName}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {lead.companyName || 'No Company'} • {lead.businessCategory || 'No Category'}
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
                              <span>WhatsApp: 
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
                            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-gray-100 dark:border-slate-805/40">
                              <span>Start: <strong>{lead.startDate || '—'}</strong></span>
                              <span>Deadline: <strong className="text-rose-500 font-bold">{lead.deliveryDeadline || '—'}</strong></span>
                            </div>
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

                        {/* Notes and Remarks */}
                        {(lead.notes || lead.remarks) && (
                          <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-150/40 dark:border-slate-800/40 space-y-3 md:col-span-2">
                            {lead.notes && (
                              <div className="text-xs space-y-1">
                                <h5 className="font-bold text-gray-405 text-[10px] uppercase tracking-wider">Salesperson Instructions</h5>
                                <p className="p-2.5 bg-yellow-500/5 dark:bg-yellow-550/2 border border-yellow-500/10 text-yellow-800 dark:text-yellow-300 rounded-lg leading-relaxed font-semibold">{lead.notes}</p>
                              </div>
                            )}
                            {lead.remarks && (
                              <div className="text-xs space-y-1">
                                <h5 className="font-bold text-gray-405 text-[10px] uppercase tracking-wider">Technical Remarks</h5>
                                <p className="p-2.5 bg-indigo-500/5 dark:bg-indigo-555/2 border border-indigo-500/10 text-indigo-800 dark:text-indigo-300 rounded-lg leading-relaxed font-semibold">{lead.remarks}</p>
                              </div>
                            )}
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

                            {/* Remarks update */}
                            <div className="flex flex-col gap-1.5 p-3 bg-gray-500/5 dark:bg-slate-955/20 border border-gray-150/40 dark:border-slate-800/40 rounded-xl">
                              <label className="text-[10px] font-bold text-gray-455 dark:text-gray-400 uppercase tracking-wider">
                                Progress Updates & Technical Remarks
                              </label>
                              <textarea
                                rows="2"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Enter details on technical progress here..."
                                className="w-full text-xs rounded-lg border border-gray-250 dark:border-slate-800 p-2 bg-white dark:bg-slate-900/60 text-gray-955 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-hidden leading-relaxed font-semibold"
                              />
                            </div>
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
                  </div>
                );
              })()}
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
