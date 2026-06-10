import React, { useState, useEffect } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import ToastContainer from './components/UI/Toast';
import DarkModeToggle from './components/UI/DarkModeToggle';
import Button from './components/UI/Button';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import Card from './components/UI/Card';

// Portals
import SalesPortal from './components/Portals/SalesPortal';
import AdminPortal from './components/Portals/AdminPortal';

export default function App() {
  const { user, logout, login, loading } = useAuth();
  const [theme, setTheme] = useLocalStorage('theme_v2', 'light');
  const [toasts, setToasts] = useState([]);
  
  // Real-time alert notifications state
  const [notifications, setNotifications] = useLocalStorage('crm_notifications', []);

  // Username/Password login form inputs
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  // Auto-prune notifications older than 12 hours
  useEffect(() => {
    const pruneNotifications = () => {
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;
      const cutoff = Date.now() - TWELVE_HOURS;
      setNotifications(prev => {
        if (!Array.isArray(prev)) return [];
        const filtered = prev.filter(n => {
          if (!n.timestamp) return false;
          return new Date(n.timestamp).getTime() > cutoff;
        });
        if (filtered.length !== prev.length) {
          return filtered;
        }
        return prev;
      });
    };

    pruneNotifications();
    const interval = setInterval(pruneNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [setNotifications]);

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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const cleanUsername = usernameInput.trim();
    if (!cleanUsername || !passwordInput) {
      addToast('Validation Error', 'Please enter your username and password.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const result = await login(cleanUsername, passwordInput);
    setIsSubmitting(false);

    if (result.success) {
      addToast('Access Granted', `Welcome back, ${result.user.name}!`, 'success');
      setUsernameInput('');
      setPasswordInput('');
    } else {
      addToast('Access Denied', result.error || 'Invalid username or password.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Loading portal session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 dark:text-slate-100 flex flex-col transition-colors duration-300 pb-12">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Top Banner Navigation */}
      <header className="w-full max-w-7xl mx-auto px-4 py-5 flex items-center justify-between border-b border-gray-200/50 dark:border-slate-800/50">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          {/* <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
            L
          </div> */}
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
          {user && (
            <button
              onClick={logout}
              className="text-xs font-bold text-gray-500 hover:text-gray-805 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer border border-gray-205 dark:border-slate-800 rounded-xl px-3.5 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              Sign Out
            </button>
          )}
          <DarkModeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </header>

      {/* Portals Render Target */}
      <main className="w-full max-w-7xl mx-auto px-4 mt-6 flex-1">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div
              key="login-gate"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto py-12 px-4"
            >
              <Card title="Livedigit CRM Authorization" subtitle="Log in with your administrator or representative credentials">
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div className="w-14 h-14 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
                    <Lock className="w-6 h-6" />
                  </div>

                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Username
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. admin or sales person"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      required
                      className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2.5 px-3.5 text-sm bg-white/60 dark:bg-slate-900/40 text-gray-900 dark:text-white transition-all outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        required
                        className="w-full rounded-xl border border-gray-200 dark:border-slate-800 py-2.5 pl-3.5 pr-10 text-sm bg-white/60 dark:bg-slate-900/40 text-gray-900 dark:text-white transition-all outline-hidden focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={isSubmitting}
                  >
                    Sign In to Portal
                  </Button>

                  {/* <div className="p-3.5 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-xs text-indigo-950 dark:text-indigo-400 space-y-1.5">
                    <strong className="font-semibold block mb-0.5">Testing Accounts:</strong>
                    <div>Admin: <code className="bg-indigo-500/10 dark:bg-indigo-500/20 px-1 py-0.5 rounded font-mono font-bold">admin</code> / <code className="bg-indigo-500/10 dark:bg-indigo-500/20 px-1 py-0.5 rounded font-mono font-bold">admin123</code></div>
                    <div>Sales: <code className="bg-indigo-500/10 dark:bg-indigo-500/20 px-1 py-0.5 rounded font-mono font-bold">tharun</code> / <code className="bg-indigo-500/10 dark:bg-indigo-500/20 px-1 py-0.5 rounded font-mono font-bold">sales123</code></div>
                  </div> */}
                </form>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key={user.role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {user.role === 'salesperson' ? (
                <SalesPortal 
                  notifications={notifications}
                  setNotifications={setNotifications}
                  onAddToast={addToast}
                  onAddNotification={addNotification}
                />
              ) : (
                <AdminPortal 
                  notifications={notifications}
                  setNotifications={setNotifications}
                  onAddToast={addToast}
                  onAddNotification={addNotification}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}
