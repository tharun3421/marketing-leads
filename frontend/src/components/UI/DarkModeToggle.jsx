import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function DarkModeToggle({ theme, toggleTheme }) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white/50 hover:bg-white/80 dark:bg-slate-950/30 dark:hover:bg-slate-950/60 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all cursor-pointer shadow-sm relative group overflow-hidden"
      aria-label="Toggle dark mode"
    >
      <div className="relative z-10">
        {theme === 'dark' ? (
          <Sun className="w-4.5 h-4.5 text-amber-400 transition-transform duration-500 rotate-180" />
        ) : (
          <Moon className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 transition-transform duration-500 rotate-0" />
        )}
      </div>
    </button>
  );
}
