import React, { useState, useEffect } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import ToastContainer from './components/UI/Toast';
import DarkModeToggle from './components/UI/DarkModeToggle';
import Button from './components/UI/Button';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Portals
import SalesPortal from './components/Portals/SalesPortal';
import AdminPortal from './components/Portals/AdminPortal';

const DEFAULT_SALESPERSONS = ['Tharun', 'Sarah', 'John', 'Emily'];

export default function App() {
  // Global Persistence States
  const [leads, setLeads] = useLocalStorage('marketing_leads_v2', []);
  const [salespersons, setSalespersons] = useLocalStorage('salesperson_directory', DEFAULT_SALESPERSONS);
  const [appsScriptUrl, setAppsScriptUrl] = useLocalStorage('apps_script_url_v2', '');
  const [theme, setTheme] = useLocalStorage('theme_v2', 'light');
  
  // Navigation Routing States
  const [activePortal, setActivePortal] = useState('Gateway'); // 'Gateway' | 'Sales' | 'Admin'
  const [toasts, setToasts] = useState([]);
  
  // Real-time alert notifications state
  const [notifications, setNotifications] = useLocalStorage('crm_notifications', []);

  // Theme application
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Toast System Actions
  const addToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Shared Data Modifiers
  const handleAddLead = (newLead) => {
    setLeads(prev => [newLead, ...prev]);
  };

  const handleUpdateLead = (updatedLead) => {
    setLeads(prev => prev.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
  };

  const handleDeleteLead = (id) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
  };

  const handleAddSalesperson = (name) => {
    setSalespersons(prev => [...prev, name]);
  };

  const addNotification = (message, type = 'info') => {
    const newNotif = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      message,
      type,
      timestamp: new Date().toISOString(),
      unread: true
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-slate-100 flex flex-col transition-colors duration-300 pb-12">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Top Banner Navigation */}
      <header className="w-full max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-gray-200/50 dark:border-slate-800/50">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent leading-none">
              Livedigit
            </h1>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 tracking-wider font-semibold uppercase mt-1">
              Digital Marketing Services
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-4">
          {activePortal !== 'Gateway' && (
            <button
              onClick={() => {
                setActivePortal('Gateway');
              }}
              className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer border border-gray-205 dark:border-slate-800 rounded-xl px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              Exit to Gateway
            </button>
          )}
          <DarkModeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </header>

      {/* Offline Alert if Sheets URL is blank */}
      {!appsScriptUrl && activePortal !== 'Gateway' && (
        <div className="w-full max-w-7xl mx-auto px-4 mt-4">
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
            <Sparkles className="w-4.5 h-4.5 text-amber-500 shrink-0 animate-bounce mt-0.5" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-normal">
                <strong>Offline/Mock Mode Enabled</strong>: Leads are currently saved locally. Deploy and configure your Apps Script Web App URL inside the Admin Portal to enable central Google Sheets synchronization.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Portals Render Target */}
      <main className="w-full max-w-7xl mx-auto px-4 mt-6 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePortal}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activePortal === 'Gateway' && (
              <div className="max-w-4xl mx-auto py-12 px-4 space-y-12 animate-in fade-in duration-350">
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold tracking-wider uppercase mb-2 border border-indigo-500/20"
                  >
                    Internal Management System
                  </motion.div>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
                    Welcome to{' '}
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                      Livedigit Portal
                    </span>
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
                    Access your secure workspace. Please select the appropriate portal and authenticate to manage marketing campaign briefs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto pt-6">
                  {/* Sales Portal Card */}
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="glass-card p-8 rounded-2xl border border-indigo-500/10 dark:border-slate-800/60 shadow-xl flex flex-col justify-between hover:border-indigo-500/30 dark:hover:border-indigo-500/20 transition-all duration-300 relative group overflow-hidden cursor-pointer"
                    onClick={() => setActivePortal('Sales')}
                  >
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/25 transition-all duration-350" />
                    
                    <div className="space-y-4 z-10 relative">
                      <div className="w-14 h-14 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-md">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      
                      <div className="space-y-1.5">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sales Representative Portal</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          Log in to register client information, configure deliverables, update project statuses, and sync folder details to Admin and Google Sheets.
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-100 dark:border-slate-800/40 flex items-center justify-between z-10 relative">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider group-hover:translate-x-1.5 transition-transform duration-300 flex items-center gap-1.5">
                        Enter Dashboard →
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold bg-gray-100 dark:bg-slate-900 px-2 py-0.5 rounded-md">
                        Passcode Required
                      </span>
                    </div>
                  </motion.div>

                  {/* Admin Portal Card */}
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="glass-card p-8 rounded-2xl border border-indigo-500/10 dark:border-slate-800/60 shadow-xl flex flex-col justify-between hover:border-indigo-500/30 dark:hover:border-indigo-500/20 transition-all duration-300 relative group overflow-hidden cursor-pointer"
                    onClick={() => setActivePortal('Admin')}
                  >
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/25 transition-all duration-350" />
                    
                    <div className="space-y-4 z-10 relative">
                      <div className="w-14 h-14 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-md">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      
                      <div className="space-y-1.5">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Executive Admin Console</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          Monitor macro analytics, inspect salesperson client lists, add new representative accounts, and manage central Google Apps Script URLs.
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-100 dark:border-slate-800/40 flex items-center justify-between z-10 relative">
                      <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider group-hover:translate-x-1.5 transition-transform duration-300 flex items-center gap-1.5">
                        Open Console →
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold bg-gray-100 dark:bg-slate-900 px-2 py-0.5 rounded-md">
                        Password Required
                      </span>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
            
            {activePortal === 'Sales' && (
              <SalesPortal 
                leads={leads}
                salespersonsList={salespersons}
                appsScriptUrl={appsScriptUrl}
                notifications={notifications}
                setNotifications={setNotifications}
                onAddLead={handleAddLead}
                onUpdateLead={handleUpdateLead}
                onDeleteLead={handleDeleteLead}
                onAddToast={addToast}
                onAddNotification={addNotification}
                onBackToGateway={() => setActivePortal('Gateway')}
              />
            )}
            
            {activePortal === 'Admin' && (
              <AdminPortal 
                leads={leads}
                salespersonsList={salespersons}
                appsScriptUrl={appsScriptUrl}
                setAppsScriptUrl={setAppsScriptUrl}
                notifications={notifications}
                setNotifications={setNotifications}
                onAddSalesperson={handleAddSalesperson}
                onAddToast={addToast}
                onAddNotification={addNotification}
                onDeleteLead={handleDeleteLead}
                onBackToGateway={() => setActivePortal('Gateway')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}
