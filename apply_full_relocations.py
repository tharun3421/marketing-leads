import re
import os

file_path = r"C:\Users\user\.gemini\antigravity\scratch\marketing-lead-collector\frontend\src\components\Portals\AdminPortal.jsx"
backup_path = r"C:\Users\user\.gemini\antigravity\scratch\marketing-lead-collector\frontend\src\components\Portals\AdminPortal.jsx.backup"

# Restore from backup first to start clean
with open(backup_path, "r", encoding="utf-8") as f:
    code = f.read()

print("Restored clean copy of AdminPortal.jsx from backup in memory.")

# 1. State Variables Injection
current_view_state = "  const [currentView, setCurrentView] = useState('dashboard');"
replacement_states = """  const [currentView, setCurrentView] = useState('dashboard');

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
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);"""

if current_view_state in code:
    code = code.replace(current_view_state, replacement_states)
    print("Injected state variables.")
else:
    print("Error: Could not find currentView state variable.")

# 2. Helper Functions Injection
step5535_path = r"C:\Users\user\.gemini\antigravity\brain\534b6b90-366a-4ae3-acc3-9364e5d8c2b4\scratch\step5535_replacement.txt"
step5645_path = r"C:\Users\user\.gemini\antigravity\brain\534b6b90-366a-4ae3-acc3-9364e5d8c2b4\scratch\step5645_replacement.txt"
step5741_path = r"C:\Users\user\.gemini\antigravity\brain\534b6b90-366a-4ae3-acc3-9364e5d8c2b4\scratch\step5741_replacement.txt"

with open(step5535_path, "r", encoding="utf-8") as f:
    step5535 = f.read()

handleEditEmployeeConfirm_match = re.search(r"const handleEditEmployeeConfirm = async [\s\S]+?\n  \};", step5535)
handleEditEmployeeConfirm_code = handleEditEmployeeConfirm_match.group(0) if handleEditEmployeeConfirm_match else ""

with open(step5645_path, "r", encoding="utf-8") as f:
    step5645 = f.read()

getMetricsModalTitleAndList_match = re.search(r"const getMetricsModalTitleAndList = [\s\S]+?\n  \};", step5645)
getMetricsModalTitleAndList_code = getMetricsModalTitleAndList_match.group(0) if getMetricsModalTitleAndList_match else ""

handleSaveClientDetails_match = re.search(r"const handleSaveClientDetails = async [\s\S]+?\n  \};", step5645)
handleSaveClientDetails_code = handleSaveClientDetails_match.group(0) if handleSaveClientDetails_match else ""

handleClientFieldChange_match = re.search(r"const handleClientFieldChange = [\s\S]+?\n  \};", step5645)
handleClientFieldChange_code = handleClientFieldChange_match.group(0) if handleClientFieldChange_match else ""

helpers_code = "\n\n".join([
    handleEditEmployeeConfirm_code,
    getMetricsModalTitleAndList_code,
    handleSaveClientDetails_code,
    handleClientFieldChange_code
])

assign_tasks_start = "if (currentView === 'assign-tasks' && false) {"
assign_tasks_start_idx = code.find(assign_tasks_start)

if assign_tasks_start_idx != -1:
    # Find the main return statement of the component
    main_return_marker = "return (\n    <div className=\"space-y-6\">"
    main_return_idx = code.find(main_return_marker)
    if main_return_idx == -1:
        main_return_marker = "return (\r\n    <div className=\"space-y-6\">"
        main_return_idx = code.find(main_return_marker)
        
    if main_return_idx != -1:
        assign_tasks_end_idx = code.rfind("}", assign_tasks_start_idx, main_return_idx) + 1
        code = code[:assign_tasks_start_idx] + helpers_code + code[assign_tasks_end_idx:]
        print("Removed Assign Tasks block and injected helpers cleanly.")
    else:
        print("Error: Could not find main return statement.")
else:
    print("Error: Could not find assign-tasks block.")

# 3. Header Relocation (Buttons & Sign Out)
header_div_start = "        <div className=\"flex items-center gap-2.5\">"
header_div_start_idx = code.find(header_div_start)

if header_div_start_idx != -1:
    bell_comment_idx = code.find("{/* Notification Bell */}", header_div_start_idx)
    sign_out_btn_end_idx = code.find("</Button>", bell_comment_idx)
    header_div_end_idx = code.find("</div>", sign_out_btn_end_idx) + 6
    
    new_header_code = """        <div className="flex items-center gap-2.5">
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
        </div>"""
    code = code[:header_div_start_idx] + new_header_code + code[header_div_end_idx:]
    print("Injected new header buttons & Sign Out button successfully.")
else:
    print("Error: Could not locate top header div.")

# 4. Replace 6-Card Metrics Row
metrics_marker = "{/* 6-Card Metrics Row */}"
metrics_idx = code.find(metrics_marker)
if metrics_idx != -1:
    grid_start_idx = code.find("<div className=", metrics_idx)
    open_divs = 0
    i = grid_start_idx
    while i < len(code):
        if code[i:i+4] == "<div":
            open_divs += 1
            i += 4
        elif code[i:i+5] == "</div":
            open_divs -= 1
            i += 5
            if open_divs == 0:
                grid_end_idx = i + 1
                break
        else:
            i += 1
            
    clickable_metrics_code = """{/* 6-Card Metrics Row */}
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
      </div>"""
    code = code[:metrics_idx] + clickable_metrics_code + code[grid_end_idx:]
    print("Replaced 6-Card Metrics row.")
else:
    print("Error: Could not find 6-Card Metrics Row.")

# 5. Central Clients Table headers
central_clients_thead_old = """            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800/60">
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client ID</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client Name</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">WhatsApp Number</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Assigned To</th>
              </tr>
            </thead>"""

central_clients_thead_new = """            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800/60">
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client ID</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client Name</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">WhatsApp Number</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Assigned To</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Created By</th>
              </tr>
            </thead>"""

if central_clients_thead_old in code:
    code = code.replace(central_clients_thead_old, central_clients_thead_new)
    print("Replaced Central Clients Table header columns.")
else:
    central_clients_thead_old_r = central_clients_thead_old.replace("\n", "\r\n")
    central_clients_thead_new_r = central_clients_thead_new.replace("\n", "\r\n")
    if central_clients_thead_old_r in code:
        code = code.replace(central_clients_thead_old_r, central_clients_thead_new_r)
        print("Replaced Central Clients Table header columns (CRLF).")

# 6. Central Clients Table tbody replacement
tbody_marker = '<tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-750 dark:text-gray-355 font-medium">'
tbody_start = code.find(tbody_marker)
if tbody_start != -1:
    tbody_end = code.find("</tbody>", tbody_start) + 8
    
    new_tbody = """<tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-750 dark:text-gray-355 font-medium">
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
            </tbody>"""
            
    code = code[:tbody_start] + new_tbody + code[tbody_end:]
    print("Replaced Central Clients Table body.")
else:
    print("Error: Could not find Central Clients Table tbody.")

# 7. Inspected Leads table header column
portfolio_thead_old = """                  <tr className="bg-gray-50/50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800/60">
                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client Contact</th>"""
portfolio_thead_new = """                  <tr className="bg-gray-50/50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800/60">
                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client ID</th>
                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Client Contact</th>"""

if portfolio_thead_old in code:
    code = code.replace(portfolio_thead_old, portfolio_thead_new)
    print("Injected Client ID column into Inspected Leads table headers.")
else:
    portfolio_thead_old_r = portfolio_thead_old.replace("\n", "\r\n")
    portfolio_thead_new_r = portfolio_thead_new.replace("\n", "\r\n")
    if portfolio_thead_old_r in code:
        code = code.replace(portfolio_thead_old_r, portfolio_thead_new_r)
        print("Injected Client ID column into Inspected Leads table headers (CRLF).")

# Inspected Leads table row cell
portfolio_row_old = """                  {filteredInspectedLeads.map((lead, idx) => (
                    <tr key={idx} className="hover:bg-indigo-500/5 dark:hover:bg-indigo-500/2 transition-colors">
                      <td className="p-3 font-medium text-gray-900 dark:text-white">"""
portfolio_row_new = """                  {filteredInspectedLeads.map((lead, idx) => (
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
                      <td className="p-3 font-medium text-gray-900 dark:text-white">"""

if portfolio_row_old in code:
    code = code.replace(portfolio_row_old, portfolio_row_new)
    print("Injected Client ID cell into Inspected Leads table rows.")
else:
    portfolio_row_old_r = portfolio_row_old.replace("\n", "\r\n")
    portfolio_row_new_r = portfolio_row_new.replace("\n", "\r\n")
    if portfolio_row_old_r in code:
        code = code.replace(portfolio_row_old_r, portfolio_row_new_r)
        print("Injected Client ID cell into Inspected Leads table rows (CRLF).")

# 8. Main Roster Grid (Sales & Tech Directories side-by-side)
grid_marker = "{/* Main Roster Grid */}"
grid_start_idx = code.find(grid_marker)
if grid_start_idx != -1:
    apps_script_guide_idx = code.find("<AppsScriptGuide", grid_start_idx)
    grid_end_idx = code.rfind("</div>", grid_start_idx, apps_script_guide_idx)
    grid_end_idx = code.find("</div>", grid_end_idx) + 6
    
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
      </div>"""
    code = code[:grid_start_idx] + side_by_side_directories_code + code[grid_end_idx:]
    print("Replaced Main Roster Grid.")
else:
    print("Error: Could not find {/* Main Roster Grid */} comment.")

# 9. Load and prepare all modals from step5741_replacement.txt
with open(step5741_path, "r", encoding="utf-8") as f:
    step5741 = f.read()

metrics_modal_start = step5741.find("{/* Metrics List Modal */}")
last_close_idx = step5741.rfind("      })()}")
modals_extracted = step5741[metrics_modal_start:last_close_idx + 11]

# 10. Prepare all other modal codes
edit_employee_modal = """
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
"""

register_staff_modal = """
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
"""

sheets_config_modal = """
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
"""

# Append ALL modals (Metrics modal, Client Profile modal, Edit Employee modal, Register Staff modal, Sheets Config modal)
# directly after the Reset Password modal which is at the end of the return JSX structure
reset_modal_end = code.rfind("setRepToResetPassword")
if reset_modal_end != -1:
    close_idx = code.find(")}", reset_modal_end) + 2
    all_modals_combined = "\n\n" + modals_extracted + "\n" + edit_employee_modal + "\n" + register_staff_modal + "\n" + sheets_config_modal + "\n"
    code = code[:close_idx] + all_modals_combined + code[close_idx:]
    print("Successfully injected all modals (metrics, profile, edit employee, register staff, sheets config) at the end of the return statement.")
else:
    print("Error: Could not find reset representative password modal to append custom modals.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Updates finished successfully!")
