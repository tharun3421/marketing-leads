import re

file_path = r"C:\Users\user\.gemini\antigravity\scratch\marketing-lead-collector\frontend\src\components\Portals\AdminPortal.jsx"
step5741_path = r"C:\Users\user\.gemini\antigravity\brain\534b6b90-366a-4ae3-acc3-9364e5d8c2b4\scratch\step5741_replacement.txt"

with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. State Hooks Injection
state_target = "  const [editedClientFields, setEditedClientFields] = useState({});"
state_replacement = """  const [editedClientFields, setEditedClientFields] = useState({});
  
  // Relocated header config modals states
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);"""

if state_target in code:
    code = code.replace(state_target, state_replacement)
    print("Injected modal state hooks.")
else:
    print("Error: Could not find state hooks target.")

# 2. Header Buttons Relocation
header_target = """        <div className="flex items-center gap-2.5">
          {/* Notification Bell */}
          <div className="relative">"""

header_replacement = """        <div className="flex items-center gap-2.5">
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
          <div className="relative">"""

if header_target in code:
    code = code.replace(header_target, header_replacement)
    print("Injected Register Staff and Sheets Config buttons to header.")
else:
    header_target_crlf = header_target.replace("\\n", "\\r\\n")
    header_replacement_crlf = header_replacement.replace("\\n", "\\r\\n")
    if header_target_crlf in code:
        code = code.replace(header_target_crlf, header_replacement_crlf)
        print("Injected Register Staff and Sheets Config buttons to header (CRLF).")
    else:
        # Try direct search
        bell_idx = code.find("{/* Notification Bell */}")
        if bell_idx != -1:
            div_start = code.rfind("<div className=\"flex items-center gap-2.5\">", 0, bell_idx)
            if div_start != -1:
                bell_btn_start = code.find("<div className=\"relative\">", div_start)
                if bell_btn_start != -1:
                    code = code[:bell_btn_start] + """{/* Register Staff Button */}
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

          """ + code[bell_btn_start:]
                    print("Injected Register Staff and Sheets Config buttons via fallback index matching.")
                else:
                    print("Error: Could not find bell relative div.")
            else:
                print("Error: Could not find gap-2.5 header div.")
        else:
            print("Error: Could not find Bell comment.")

# 3. Logout Button Relocation to Header
logout_btn_code = """          {/* Sign Out Button */}
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
"""
# We find where showNotifications ends and the header outer div closes
notif_end_idx = code.find("showNotifications")
if notif_end_idx != -1:
    notif_close_idx = code.find(")}", notif_end_idx)
    if notif_close_idx != -1:
        # Find next closing div tags
        outer_div_close_idx = code.find("</div>", notif_close_idx)
        if outer_div_close_idx != -1:
            # We want to insert the logout button right before the outer header div's closing tag
            header_end_idx = code.find("</div>", outer_div_close_idx + 6)
            if header_end_idx != -1:
                # Find the closing tag of the flex container (which contains the Bell, etc.)
                flex_end_idx = code.rfind("</div>", 0, header_end_idx)
                code = code[:flex_end_idx] + logout_btn_code + code[flex_end_idx:]
                print("Injected Logout button to header.")
            else:
                print("Error: Could not find header end idx.")
        else:
            print("Error: Could not find outer div close idx.")
else:
    print("Error: Could not find showNotifications index.")

# 4. Modify Main Roster Grid to remove sidebar and set directories side-by-side
grid_marker = "{/* Main Roster Grid */}"
grid_start_idx = code.find(grid_marker)

if grid_start_idx != -1:
    apps_script_guide_idx = code.find("<AppsScriptGuide", grid_start_idx)
    # The end of the main roster grid is the closing div of the grid row
    grid_end_idx = code.rfind("</div>", grid_start_idx, apps_script_guide_idx)
    grid_end_idx = code.find("</div>", grid_end_idx) + 6
    
    # We want to keep ONLY the directories side by side:
    side_by_side_directories_code = """{/* Main Roster Grid */}
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
                            <span className="text-[10px] text-gray-455 dark:text-gray-550 font-semibold">
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
                          <span className="block text-indigo-500 text-xs font-bold">{inProgress}</span>
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
      </div>"""
    
    code = code[:grid_start_idx] + side_by_side_directories_code + code[grid_end_idx:]
    print("Replaced Main Roster Grid with side-by-side view (sidebar removed).")
else:
    print("Error: Could not find {/* Main Roster Grid */} comment.")

# 5. Extract Modals from step5741_replacement.txt and replace metrics modal + inject viewedClientId modal
with open(step5741_path, "r", encoding="utf-8") as f:
    step5741 = f.read()

metrics_modal_start = step5741.find("{/* Metrics List Modal */}")
last_close_idx = step5741.rfind("      })()}")
modals_extracted = step5741[metrics_modal_start:last_close_idx + 11]

# In AdminPortal.jsx, replace the existing metrics modal
admin_metrics_start = code.find("{/* Metrics List Modal */}")
admin_metrics_end = code.find("      })()}", admin_metrics_start) + len("      })()}")

if admin_metrics_start != -1 and admin_metrics_end != -1:
    code = code[:admin_metrics_start] + modals_extracted + code[admin_metrics_end:]
    print("Successfully replaced metrics list modal and injected Detailed Client Profile Editor Modal.")
else:
    print("Error: Could not locate admin metrics modal bounds.")

# 6. Inject Register Staff and Sheets Integration Overlay Modals
overlay_modals_code = """
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
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
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
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
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
"""

# Let's find where to append these modals - e.g. before "Edit Employee Modal"
edit_emp_modal_idx = code.find("{/* Edit Employee Modal */}")
if edit_emp_modal_idx != -1:
    code = code[:edit_emp_modal_idx] + overlay_modals_code + code[edit_emp_modal_idx:]
    print("Injected Register Staff & Sheets Config overlay modals.")
else:
    print("Error: Could not locate Edit Employee Modal index.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Updates finished successfully!")
