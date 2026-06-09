import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/30 dark:border-emerald-500/10 text-emerald-800 dark:text-emerald-400',
  error: 'bg-rose-500/10 dark:bg-rose-500/5 border-rose-500/30 dark:border-rose-500/10 text-rose-800 dark:text-rose-400',
  warning: 'bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/30 dark:border-amber-500/10 text-amber-800 dark:text-amber-400',
  info: 'bg-sky-500/10 dark:bg-sky-500/5 border-sky-500/30 dark:border-sky-500/10 text-sky-800 dark:text-sky-400',
};

export default function ToastContainer({ toasts = [], removeToast }) {
  return (
    <div className="fixed top-5 right-5 z-100 flex flex-col gap-3 max-w-sm w-[calc(100%-2.5rem)] md:w-96 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type || 'info'];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              layout
              className={`
                pointer-events-auto flex items-start gap-3 p-4 rounded-xl border glass-panel shadow-lg
                ${styles[toast.type || 'info']}
              `}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <h4 className="text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs mt-1 text-gray-600 dark:text-gray-400 leading-normal break-words">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-lg p-0.5 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
