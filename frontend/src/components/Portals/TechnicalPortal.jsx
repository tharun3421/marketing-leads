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
  AlertCircle
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

  // Modal / Editing State
  const [editingLead, setEditingLead] = useState(null);
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

  const handleEditClick = (lead) => {
    setEditingLead(lead);
    setPostersStatus(lead.postersStatus || 'Pending');
    setPostersPending(Number(lead.postersPending ?? lead.postersRequired ?? 0));
    setVideosStatus(lead.videosStatus || 'Pending');
    setVideosPending(Number(lead.videosPending ?? lead.videosRequired ?? 0));
    setAdsStatus(lead.adsStatus || 'Pending');
    setAdsPending(Number(lead.adsPending ?? lead.adsRequired ?? 0));
    setWebsiteStatus(lead.websiteStatus || 'Pending');
    setRemarks(lead.remarks || '');
  };

  const handleSaveUpdates = async (e) => {
    e.preventDefault();
    if (!editingLead) return;

    setIsSubmitting(true);
    try {
      const postersPendingCount = postersStatus === 'Completed' ? 0 : (postersStatus === 'Pending' ? Number(editingLead.postersRequired || 0) : Number(postersPending));
      const videosPendingCount = videosStatus === 'Completed' ? 0 : (videosStatus === 'Pending' ? Number(editingLead.videosRequired || 0) : Number(videosPending));
      const adsPendingCount = adsStatus === 'Completed' ? 0 : (adsStatus === 'Pending' ? Number(editingLead.adsRequired || 0) : Number(adsPending));
      const websitePendingCount = editingLead.websiteRequired ? (websiteStatus === 'Completed' ? 0 : 1) : 0;

      // Calculate workflow status automatically
      const activeStatuses = [];
      if (Number(editingLead.postersRequired) > 0) activeStatuses.push(postersStatus);
      if (Number(editingLead.videosRequired) > 0) activeStatuses.push(videosStatus);
      if (Number(editingLead.adsRequired) > 0) activeStatuses.push(adsStatus);
      if (editingLead.websiteRequired) activeStatuses.push(websiteStatus);

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

      const res = await authFetch(`/api/leads/${editingLead._id}`, {
        method: 'PUT',
        body: JSON.stringify(updatePayload)
      });

      if (res.ok) {
        onAddToast('Lead Updated', `Successfully updated deliverables status for ${editingLead.clientName}.`, 'success');
        if (onAddNotification) {
          onAddNotification(`Technical member "${user?.name || ''}" updated campaign specs for client "${editingLead.clientName}".`, 'info');
        }
        setEditingLead(null);
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

  // Metric aggregates
  const totalPosters = leads.reduce((acc, l) => acc + Number(l.postersRequired || 0), 0);
  const pendingPosters = leads.reduce((acc, l) => acc + (Number(l.postersRequired) > 0 ? Number(l.postersPending ?? l.postersRequired) : 0), 0);
  const completedPosters = totalPosters - pendingPosters;

  const totalVideos = leads.reduce((acc, l) => acc + Number(l.videosRequired || 0), 0);
  const pendingVideos = leads.reduce((acc, l) => acc + (Number(l.videosRequired) > 0 ? Number(l.videosPending ?? l.videosRequired) : 0), 0);
  const completedVideos = totalVideos - pendingVideos;

  const totalWebsites = leads.filter(l => l.websiteRequired).length;
  const completedWebsites = leads.filter(l => l.websiteRequired && l.websiteStatus === 'Completed').length;
  const pendingWebsites = totalWebsites - completedWebsites;

  const totalCampaigns = leads.reduce((acc, l) => acc + Number(l.adsRequired || 0), 0);
  const pendingCampaigns = leads.reduce((acc, l) => acc + (Number(l.adsRequired) > 0 ? Number(l.adsPending ?? l.adsRequired) : 0), 0);
  const completedCampaigns = totalCampaigns - pendingCampaigns;

  const completedProjectsCount = leads.filter(l => l.workflowStatus === 'Completed').length;
  const inProgressProjectsCount = leads.filter(l => l.workflowStatus === 'In Progress').length;
  const allocatedClientsCount = leads.filter(l => l.workflowStatus === 'Allocated').length;
  const nonAllocatedClientsCount = leads.filter(l => (l.workflowStatus || 'Non-Allocated') === 'Non-Allocated').length;

  const [isLoading, setIsLoading] = useState(true);

  const filteredLeads = leads.filter(lead => {
    // 0. Only show unclaimed tasks or tasks assigned to me in the main checklist
    const leadAssignedToId = lead.assignedTo?._id || lead.assignedTo;
    if (leadAssignedToId && leadAssignedToId !== userId) {
      return false;
    }

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

  const unclaimedLeads = filteredLeads.filter(lead => !lead.assignedTo);
  const claimedLeads = filteredLeads.filter(lead => {
    const leadAssignedToId = lead.assignedTo?._id || lead.assignedTo;
    return leadAssignedToId && leadAssignedToId === userId;
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
    const isSelected = editingLead && editingLead._id === lead._id;
    const dateStr = new Date(lead.createdAt || lead.timestamp).toLocaleDateString();
    
    // Determine which deliverables to display based on user department
    const userTeam = user?.team || 'all';
    const showDeveloper = userTeam === 'developer' || userTeam === 'all';
    const showDesign = userTeam === 'design' || userTeam === 'all';
    const showAds = userTeam === 'ads' || userTeam === 'all';
    
    return (
      <div 
        key={lead._id}
        className={`glass-card hover:shadow-lg transition-all border rounded-2xl p-5 duration-300 flex flex-col justify-between ${
          isSelected 
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/2' 
            : 'border-indigo-500/10 hover:-translate-y-0.5'
        }`}
      >
        <div className="space-y-3">
          {/* Card Header */}
          <div className="flex justify-between items-start gap-2">
            <div>
              <h4 className="text-sm font-extrabold text-gray-950 dark:text-white leading-tight">
                {lead.clientName}
              </h4>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                {lead.companyName || 'No Company'} • {lead.businessCategory || 'No Category'}
              </p>
            </div>
            {!isClaimed && (
              <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 border border-amber-500/10 animate-pulse">
                Unclaimed
              </span>
            )}
          </div>

          {/* Contact Details & Date */}
          <div className="text-[11px] space-y-1 bg-slate-500/5 dark:bg-slate-900/30 p-2.5 rounded-xl border border-gray-200/50 dark:border-slate-800/40">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
              <span className="text-[10px] text-gray-400">Date:</span>
              <span className="text-gray-800 dark:text-gray-300 font-bold">{dateStr}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <span className="text-[10px] text-gray-400">Salesperson:</span>
              <span className="text-gray-800 dark:text-gray-300 font-semibold">{lead.salespersonName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400">WhatsApp:</span>
              <a 
                href={`https://wa.me/${lead.mobileNumber.replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 font-mono font-bold hover:underline flex items-center gap-1"
              >
                {lead.mobileNumber}
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1 py-0.2 rounded font-sans">Chat</span>
              </a>
            </div>
            {lead.email && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400">Email:</span>
                <a 
                  href={`mailto:${lead.email}`}
                  className="text-gray-700 dark:text-gray-300 truncate hover:underline"
                >
                  {lead.email}
                </a>
              </div>
            )}
          </div>

          {/* Milestones / Deliverables Checklist */}
          <div className="space-y-1.5 pt-1">
            <h5 className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider">
              Department Deliverables
            </h5>
            
            <div className="space-y-1">
              {/* Developer Deliverable */}
              {showDeveloper && lead.websiteRequired && (
                <div className="flex items-center justify-between text-xs bg-purple-500/3 dark:bg-purple-500/1 p-2 rounded-lg border border-purple-500/5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${lead.websiteStatus === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="font-semibold text-gray-750 dark:text-gray-300">Website:</span>
                    <span className="text-[10px] text-gray-400 font-normal">({lead.websiteType || 'General'})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    lead.websiteStatus === 'Completed' 
                      ? 'bg-emerald-500/10 text-emerald-600' 
                      : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {lead.websiteStatus || 'Pending'}
                  </span>
                </div>
              )}

              {/* Design Deliverables */}
              {showDesign && Number(lead.postersRequired) > 0 && (
                <div className="flex items-center justify-between text-xs bg-indigo-500/3 dark:bg-indigo-500/1 p-2 rounded-lg border border-indigo-500/5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${lead.postersStatus === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="font-semibold text-gray-750 dark:text-gray-300">Posters:</span>
                    <span className="text-[10px] text-gray-400 font-normal">({Number(lead.postersRequired) - Number(lead.postersPending ?? 0)}/{lead.postersRequired} Done)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    lead.postersStatus === 'Completed' 
                      ? 'bg-emerald-500/10 text-emerald-600' 
                      : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {lead.postersStatus || 'Pending'}
                  </span>
                </div>
              )}

              {showDesign && Number(lead.videosRequired) > 0 && (
                <div className="flex items-center justify-between text-xs bg-blue-500/3 dark:bg-blue-500/1 p-2 rounded-lg border border-blue-500/5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${lead.videosStatus === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="font-semibold text-gray-750 dark:text-gray-300">Videos:</span>
                    <span className="text-[10px] text-gray-400 font-normal">({Number(lead.videosRequired) - Number(lead.videosPending ?? 0)}/{lead.videosRequired} Done)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    lead.videosStatus === 'Completed' 
                      ? 'bg-emerald-500/10 text-emerald-600' 
                      : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {lead.videosStatus || 'Pending'}
                  </span>
                </div>
              )}

              {/* Ads Deliverables */}
              {showAds && Number(lead.adsRequired) > 0 && (
                <div className="flex items-center justify-between text-xs bg-pink-500/3 dark:bg-pink-500/1 p-2 rounded-lg border border-pink-500/5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${lead.adsStatus === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="font-semibold text-gray-750 dark:text-gray-300">Ads/Campaigns:</span>
                    <span className="text-[10px] text-gray-400 font-normal">({Number(lead.adsRequired) - Number(lead.adsPending ?? 0)}/{lead.adsRequired} Done)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    lead.adsStatus === 'Completed' 
                      ? 'bg-emerald-500/10 text-emerald-600' 
                      : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {lead.adsStatus || 'Pending'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Actions Footer */}
        <div className="pt-4 mt-2 border-t border-gray-150/40 dark:border-slate-800/40 flex justify-end">
          {isClaimed ? (
            <Button
              variant={isSelected ? "primary" : "outline"}
              size="xs"
              onClick={() => handleEditClick(lead)}
              icon={Edit2}
              className="w-full sm:w-auto"
            >
              Update Tasks
            </Button>
          ) : (
            <Button
              variant="primary"
              size="xs"
              onClick={() => handleAcceptClick(lead)}
              icon={CheckCircle}
              className="w-full sm:w-auto"
            >
              Accept Client
            </Button>
          )}
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
        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-rose-500/5">
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Non-Allocated</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{nonAllocatedClientsCount}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-blue-500/5">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-555 dark:text-gray-400 uppercase tracking-wider">Allocated</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{allocatedClientsCount}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4 border border-indigo-500/5">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
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
                    const teamLabels = {
                      'design': 'Design Team',
                      'developer': 'Development Team',
                      'ads': 'Ads Team',
                      'all': 'All Teams'
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Roster list */}
        <div className="xl:col-span-2">
          <Card title="Assigned Client Campaigns" subtitle="Inspect briefs and update service milestones assigned to you">
            
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
                    <option value="design">Design Team</option>
                    <option value="developer">Developer Team</option>
                    <option value="ads">Ads Team</option>
                  </select>
                </div>
              </div>

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
            </div>

            {filteredLeads.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 dark:border-slate-805 rounded-xl bg-gray-50/20 dark:bg-slate-900/10">
                <AlertCircle className="w-10 h-10 text-gray-300 dark:text-slate-700 mx-auto mb-3 animate-pulse" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {leads.length === 0 ? "You have no assigned client campaign cards at the moment." : "No assigned campaigns match the active filters."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Section 1: Unclaimed Pool */}
                <div className="p-4 rounded-2xl border border-amber-500/10 bg-amber-500/2 dark:bg-amber-500/1 space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-150/40 dark:border-slate-800/40 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Unclaimed Team Tasks Pool
                      </h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-405">Claim campaign briefs assigned to your department queue</p>
                    </div>
                    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      {unclaimedLeads.length} Available
                    </span>
                  </div>
                  
                  {unclaimedLeads.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-gray-200 dark:border-slate-800/60 rounded-xl bg-white/20 dark:bg-slate-900/10 text-gray-500 dark:text-gray-400">
                      <AlertCircle className="w-8 h-8 text-gray-300 dark:text-slate-700 mx-auto mb-2 animate-pulse" />
                      <p className="text-xs font-semibold">No unclaimed client folders in your queue.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {unclaimedLeads.map((lead) => renderLeadCard(lead, false))}
                    </div>
                  )}
                </div>

                {/* Section 2: Active Claimed Checklist */}
                <div className="p-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/2 dark:bg-emerald-500/1 space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-150/40 dark:border-slate-800/40 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        My Claimed Client Campaigns
                      </h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-405">Your active checklist of campaign folders and spec deliverables</p>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      {claimedLeads.length} Claimed
                    </span>
                  </div>

                  {claimedLeads.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-gray-200 dark:border-slate-800/60 rounded-xl bg-white/20 dark:bg-slate-900/10 text-gray-500 dark:text-gray-400">
                      <AlertCircle className="w-8 h-8 text-gray-300 dark:text-slate-700 mx-auto mb-2 animate-pulse" />
                      <p className="text-xs font-semibold">You haven't claimed any client campaigns yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {claimedLeads.map((lead) => renderLeadCard(lead, true))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Update Panel */}
        <div className="xl:col-span-1">
          {editingLead ? (
            <Card title="Update Deliverables" subtitle={`Modify progress spec parameters for ${editingLead.clientName}`}>
              <form onSubmit={handleSaveUpdates} className="space-y-4 text-xs font-semibold">
                
                {/* Client Details Section */}
                <div className="p-3.5 bg-slate-500/5 dark:bg-slate-950/20 border border-gray-150/40 dark:border-slate-800/40 rounded-xl space-y-2">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-650 dark:text-indigo-400">
                    Client Specifications Details
                  </h4>
                  <div className="grid grid-cols-1 gap-1.5 text-[11px] text-gray-650 dark:text-gray-300 font-semibold leading-normal">
                    <div><span className="text-gray-400">Date:</span> {new Date(editingLead.createdAt || editingLead.timestamp).toLocaleDateString()}</div>
                    <div><span className="text-gray-400">Client Name:</span> <strong className="text-gray-900 dark:text-white">{editingLead.clientName}</strong></div>
                    <div><span className="text-gray-400">Business Name:</span> {editingLead.companyName || '—'}</div>
                    <div><span className="text-gray-400">WhatsApp Number:</span> {editingLead.mobileNumber}</div>
                    <div><span className="text-gray-400">Service Type:</span> {[
                      editingLead.websiteRequired ? 'Website' : null,
                      Number(editingLead.postersRequired) > 0 ? 'Posters' : null,
                      Number(editingLead.videosRequired) > 0 ? 'Videos' : null,
                      Number(editingLead.adsRequired) > 0 ? 'Ads' : null
                    ].filter(Boolean).join(', ') || 'None'}</div>
                    <div><span className="text-gray-400">Project Status:</span> <span className="uppercase text-indigo-600 dark:text-indigo-400 font-bold">
                      {
                        // Calculate project status inline
                        (() => {
                          const activeStatuses = [];
                          if (Number(editingLead.postersRequired) > 0) activeStatuses.push(postersStatus);
                          if (Number(editingLead.videosRequired) > 0) activeStatuses.push(videosStatus);
                          if (Number(editingLead.adsRequired) > 0) activeStatuses.push(adsStatus);
                          if (editingLead.websiteRequired) activeStatuses.push(websiteStatus);
                          if (activeStatuses.length === 0 || activeStatuses.every(s => s === 'Completed')) return 'Completed';
                          if (activeStatuses.every(s => s === 'Pending')) return 'Pending';
                          return 'In Progress';
                        })()
                      }
                    </span></div>
                    <div><span className="text-gray-400">Assigned Team:</span> {editingLead.assignedTeam ? editingLead.assignedTeam.toUpperCase() : 'None'}</div>
                    <div><span className="text-gray-400">Assigned Specialist:</span> {editingLead.assignedToName || 'Unclaimed'}</div>
                    <div><span className="text-gray-400">Acceptance Status:</span> {editingLead.assignedTo ? 'Accepted' : 'Pending Acceptance'}</div>
                    <div><span className="text-gray-400">Last Updated Date:</span> {new Date(editingLead.updatedAt).toLocaleString()}</div>
                  </div>
                </div>

                {/* Posters Section */}
                {Number(editingLead.postersRequired) > 0 && (
                  <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 dark:text-white">Posters Milestone ({editingLead.postersRequired} Total)</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Total: {editingLead.postersRequired}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-400">Status</label>
                        <select
                          value={postersStatus}
                          onChange={(e) => setPostersStatus(e.target.value)}
                          className="rounded-lg border border-gray-250 dark:border-slate-800 py-1.5 px-2 bg-white dark:bg-slate-900/60 text-gray-950 dark:text-white"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      {postersStatus !== 'Completed' && postersStatus !== 'Pending' && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-400">Pending Count</label>
                          <input
                            type="number"
                            min="0"
                            max={editingLead.postersRequired}
                            value={postersPending}
                            onChange={(e) => setPostersPending(Math.min(Number(editingLead.postersRequired), Math.max(0, Number(e.target.value))))}
                            className="rounded-lg border border-gray-250 dark:border-slate-800 py-1.5 px-2 bg-white dark:bg-slate-900/60 text-gray-950 dark:text-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Videos Section */}
                {Number(editingLead.videosRequired) > 0 && (
                  <div className="p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 dark:text-white">Videos Milestone ({editingLead.videosRequired} Total)</span>
                      <span className="text-[10px] text-blue-650 dark:text-blue-400">Total: {editingLead.videosRequired}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-400">Status</label>
                        <select
                          value={videosStatus}
                          onChange={(e) => setVideosStatus(e.target.value)}
                          className="rounded-lg border border-gray-250 dark:border-slate-800 py-1.5 px-2 bg-white dark:bg-slate-900/60 text-gray-955 dark:text-white"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      {videosStatus !== 'Completed' && videosStatus !== 'Pending' && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-400">Pending Count</label>
                          <input
                            type="number"
                            min="0"
                            max={editingLead.videosRequired}
                            value={videosPending}
                            onChange={(e) => setVideosPending(Math.min(Number(editingLead.videosRequired), Math.max(0, Number(e.target.value))))}
                            className="rounded-lg border border-gray-250 dark:border-slate-800 py-1.5 px-2 bg-white dark:bg-slate-900/60 text-gray-955 dark:text-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Ads Section */}
                {Number(editingLead.adsRequired) > 0 && (
                  <div className="p-3.5 bg-pink-500/5 border border-pink-500/10 rounded-xl space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 dark:text-white">Campaign Ads Milestone ({editingLead.adsRequired} Total)</span>
                      <span className="text-[10px] text-pink-650 dark:text-pink-400">Total: {editingLead.adsRequired}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-400">Status</label>
                        <select
                          value={adsStatus}
                          onChange={(e) => setAdsStatus(e.target.value)}
                          className="rounded-lg border border-gray-250 dark:border-slate-800 py-1.5 px-2 bg-white dark:bg-slate-900/60 text-gray-955 dark:text-white"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      {adsStatus !== 'Completed' && adsStatus !== 'Pending' && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-400">Pending Count</label>
                          <input
                            type="number"
                            min="0"
                            max={editingLead.adsRequired}
                            value={adsPending}
                            onChange={(e) => setAdsPending(Math.min(Number(editingLead.adsRequired), Math.max(0, Number(e.target.value))))}
                            className="rounded-lg border border-gray-250 dark:border-slate-800 py-1.5 px-2 bg-white dark:bg-slate-900/60 text-gray-955 dark:text-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Website Section */}
                {editingLead.websiteRequired && (
                  <div className="p-3.5 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 dark:text-white">Website Deliverable</span>
                      <span className="text-[10px] text-purple-650 dark:text-purple-400">{editingLead.websiteType || 'General'} Website</span>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-gray-400">Website Status</label>
                      <select
                        value={websiteStatus}
                        onChange={(e) => setWebsiteStatus(e.target.value)}
                        className="w-full rounded-lg border border-gray-255 dark:border-slate-800 py-1.5 px-2 bg-white dark:bg-slate-900/60 text-gray-955 dark:text-white"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Remarks & Progress Updates */}
                <div className="flex flex-col gap-1.5 p-3.5 bg-gray-500/5 dark:bg-slate-955/20 border border-gray-150/40 dark:border-slate-800/40 rounded-xl">
                  <label className="text-[10px] font-bold text-gray-450 dark:text-gray-400 uppercase tracking-wider">
                    Progress Updates & Remarks
                  </label>
                  <textarea
                    rows="3"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter any progress updates or notes here..."
                    className="w-full text-xs rounded-lg border border-gray-250 dark:border-slate-800 p-2 bg-white dark:bg-slate-900/60 text-gray-950 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-hidden leading-relaxed"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-1/2"
                    onClick={() => setEditingLead(null)}
                  >
                    Cancel
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
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-6 border border-dashed border-gray-205 dark:border-slate-805 rounded-2xl bg-gray-50/20 dark:bg-slate-900/10 text-center min-h-[300px]">
              <div>
                <Sliders className="w-10 h-10 text-gray-300 dark:text-slate-750 mx-auto mb-3 animate-pulse" />
                <p className="text-sm font-semibold text-gray-400 dark:text-slate-500">Select a campaign card from your assigned tasks to edit its spec milestones.</p>
              </div>
            </div>
          )}
        </div>

      </div>

          

    </div>
  );
}
