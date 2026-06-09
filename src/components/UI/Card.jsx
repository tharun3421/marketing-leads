import React from 'react';

export default function Card({ children, className = '', title, subtitle, icon: Icon, ...props }) {
  return (
    <div className={`glass-panel rounded-2xl p-6 md:p-8 shadow-xl ${className}`} {...props}>
      {(title || Icon) && (
        <div className="flex items-center gap-3 border-b border-gray-200/50 dark:border-slate-800/50 pb-4 mb-6">
          {Icon && (
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-none">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
