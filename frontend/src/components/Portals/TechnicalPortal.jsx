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

export default function TechnicalPortal({
  notifications = [],
  setNotifications,
  onAddToast,
  onAddNotification
}) {
  const { user, authFetch, logout } = useAuth();
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal / Editing State
  const [editingLead, setEditingLead] = useState(null);
  const [postersStatus, setPostersStatus] = useState('Pending');
  const [postersPending, setPostersPending] = useState(0);
  const [videosStatus, setVideosStatus] = useState('Pending');
  const [videosPending, setVideosPending] = useState(0);
  const [adsStatus, setAdsStatus] = useState('Pending');
  const [adsPending, setAdsPending] = useState(0);
  const [websiteStatus, setWebsiteStatus] = useState('Pending');
  
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
  };

  const handleSaveUpdates = async (e) => {
    e.preventDefault();
    if (!editingLead) return;

    setIsSubmitting(true);
    try {
      const updatePayload = {
        postersStatus,
        postersPending: postersStatus === 'Completed' ? 0 : (postersStatus === 'Pending' ? Number(editingLead.postersRequired || 0) : Number(postersPending)),
        videosStatus,
        videosPending: videosStatus === 'Completed' ? 0 : (videosStatus === 'Pending' ? Number(editingLead.videosRequired || 0) : Number(videosPending)),
        adsStatus,
        adsPending: adsStatus === 'Completed' ? 0 : (adsStatus === 'Pending' ? Number(editingLead.adsRequired || 0) : Number(adsPending)),
        websiteStatus,
        websitePending: editingLead.websiteRequired ? (websiteStatus === 'Completed' ? 0 : 1) : 0
      };

      const res = await authFetch(`/api/leads/${editingLead._id}`, {
        method: 'PUT',
        body: JSON.stringify(updatePayload)
      });

      if (res.ok) {
        onAddToast('Lead Updated', `Successfully updated deliverables status for ${editingLead.clientName}.`, 'success');
        if (onAddNotification) {
          onAddNotification(`Technical member "${user.name}" updated campaign specs for client "${editingLead.clientName}".`, 'info');
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

  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (lead.clientName || '').toLowerCase().includes(searchLower) ||
      (lead.companyName || '').toLowerCase().includes(searchLower) ||
      (lead.businessCategory || '').toLowerCase().includes(searchLower)
    );
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
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Logged in as: <strong className="text-gray-900 dark:text-white font-bold">{user.name}</strong> ({user.username})</p>
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

      {/* 4-Card Service Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Posters Card */}
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

        {/* Videos Card */}
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

        {/* Websites Card */}
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

        {/* Campaigns Card */}
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

      </div>

      {/* Main Roster & Update Workflow */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Roster list */}
        <div className="xl:col-span-2">
          <Card title="Assigned Client Campaigns" subtitle="Inspect briefs and update service milestones assigned to you">
            
            {/* Search filter bar */}
            <div className="relative mb-5">
              <Search className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by client name, company, or sector..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-805 bg-white/60 dark:bg-slate-900/40 text-gray-950 dark:text-white transition-all outline-hidden focus:border-indigo-500"
              />
            </div>

            {filteredLeads.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 dark:border-slate-805 rounded-xl bg-gray-50/20 dark:bg-slate-900/10">
                <AlertCircle className="w-10 h-10 text-gray-300 dark:text-slate-700 mx-auto mb-3 animate-pulse" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {leads.length === 0 ? "You have no assigned client campaign cards at the moment." : "No assigned campaigns match the search filter."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-100 dark:border-slate-800/60 rounded-xl">
                <table className="min-w-[800px] w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800/60">
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client Details</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Intake Source</th>
                      <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Deliverables Status</th>
                      <th className="p-3 font-semibold text-center text-gray-700 dark:text-gray-300">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40">
                    {filteredLeads.map((lead, idx) => (
                      <tr key={idx} className="hover:bg-indigo-500/5 dark:hover:bg-indigo-500/2 transition-colors">
                        <td className="p-3 font-medium text-gray-900 dark:text-white">
                          <div className="font-bold">{lead.clientName}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">{lead.companyName} | {lead.businessCategory}</div>
                        </td>
                        <td className="p-3 text-xs text-gray-500 dark:text-gray-400">
                          <div>Salesperson: <strong className="text-gray-750 dark:text-gray-250 font-semibold">{lead.salespersonName}</strong></div>
                          <div className="mt-0.5">{new Date(lead.createdAt || lead.timestamp).toLocaleDateString()}</div>
                        </td>
                        <td className="p-3 text-xs">
                          <div className="space-y-1">
                            {Number(lead.postersRequired) > 0 && (
                              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                <span className={`w-1.5 h-1.5 rounded-full ${lead.postersStatus === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span>Posters: <strong className="text-gray-800 dark:text-gray-200">{Number(lead.postersRequired) - Number(lead.postersPending ?? 0)}/{lead.postersRequired} Comp</strong> ({lead.postersStatus})</span>
                              </div>
                            )}
                            {Number(lead.videosRequired) > 0 && (
                              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                <span className={`w-1.5 h-1.5 rounded-full ${lead.videosStatus === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span>Videos: <strong className="text-gray-800 dark:text-gray-200">{Number(lead.videosRequired) - Number(lead.videosPending ?? 0)}/{lead.videosRequired} Comp</strong> ({lead.videosStatus})</span>
                              </div>
                            )}
                            {Number(lead.adsRequired) > 0 && (
                              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                <span className={`w-1.5 h-1.5 rounded-full ${lead.adsStatus === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span>Campaigns: <strong className="text-gray-800 dark:text-gray-200">{Number(lead.adsRequired) - Number(lead.adsPending ?? 0)}/{lead.adsRequired} Comp</strong> ({lead.adsStatus})</span>
                              </div>
                            )}
                            {lead.websiteRequired && (
                              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                <span className={`w-1.5 h-1.5 rounded-full ${lead.websiteStatus === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span>Website: <strong className="text-gray-800 dark:text-gray-200">{lead.websiteStatus === 'Completed' ? '1/1' : '0/1'} Comp</strong> ({lead.websiteStatus})</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleEditClick(lead)}
                            icon={Edit2}
                          >
                            Update Tasks
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Update Panel */}
        <div className="xl:col-span-1">
          {editingLead ? (
            <Card title="Update Deliverables" subtitle={`Modify progress spec parameters for ${editingLead.clientName}`}>
              <form onSubmit={handleSaveUpdates} className="space-y-4 text-xs font-semibold">
                
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
