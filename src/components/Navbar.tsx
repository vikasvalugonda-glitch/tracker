'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Settings, 
  Volume2, 
  VolumeX, 
  BarChart3, 
  Plus, 
  Sparkles,
  Clock,
  Sun,
  Moon
} from 'lucide-react';
import { User, BudgetSummary } from '@/lib/types';
import { sounds } from '@/lib/sounds';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

interface NavbarProps {
  user: User;
  summary: BudgetSummary | null;
  activeTab: 'dashboard' | 'analytics';
  setActiveTab: (tab: 'dashboard' | 'analytics') => void;
  onOpenQuickAdd: () => void;
  onOpenSettings: () => void;
  onUserUpdate: (updated: User) => void;
  is12Hour: boolean;
  onToggleClockFormat: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function Navbar({
  user,
  summary,
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
  onOpenSettings,
  is12Hour,
  onToggleClockFormat,
  theme,
  onToggleTheme,
}: NavbarProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    setIsMuted(sounds.getMuted());
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { 
          hour: is12Hour ? 'numeric' : '2-digit', 
          minute: '2-digit',
          hour12: is12Hour,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [is12Hour]);

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    toast.info(muted ? 'Sound feedback muted' : 'Sound feedback enabled', {
      duration: 1500,
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 dark:border-white/10 dark:bg-black/85 bg-white/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="h-full w-full bg-black rounded-[10px] flex items-center justify-center">
                <Wallet className="h-4 w-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-indigo-400 to-teal-400 bg-clip-text text-transparent">
                SpendPulse
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                Live
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 dark:bg-zinc-950/80 bg-slate-100 p-1 rounded-xl border dark:border-white/5 border-slate-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Today&apos;s Tracker
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Insights & Compliance
            </button>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Interactive Live Clock with 12h/24h toggle */}
          <button
            onClick={onToggleClockFormat}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl dark:bg-zinc-900/90 bg-slate-100 hover:bg-slate-200 dark:hover:bg-zinc-800 border dark:border-white/10 border-slate-200 text-slate-700 dark:text-slate-300 font-mono transition-all group"
            title={`Switch to ${is12Hour ? '24-hour' : '12-hour'} format`}
          >
            <Clock className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 group-hover:rotate-45 transition-transform" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{currentTime || '...'}</span>
            <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold ml-0.5">
              {is12Hour ? '12H' : '24H'}
            </span>
          </button>

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl dark:bg-zinc-900/90 bg-slate-100 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border dark:border-white/10 border-slate-200 transition-all shadow-sm"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-600" />
            )}
          </button>

          {/* Quick Add Button */}
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            title="Log Expense"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-xl dark:bg-zinc-900/90 bg-slate-100 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border dark:border-white/10 border-slate-200 transition-colors"
            title={isMuted ? 'Unmute Audio Cues' : 'Mute Audio Cues'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-slate-400" />
            ) : (
              <Volume2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            )}
          </button>

          {/* Budget Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl dark:bg-zinc-900/90 bg-slate-100 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border dark:border-white/10 border-slate-200 transition-colors"
            title="Budget Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* User Email & Limit Pill */}
          <div className="flex items-center gap-2 pl-2 border-l dark:border-white/10 border-slate-200">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                {user.email.split('@')[0]}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {user.budget_mode === 'monthly' && user.monthly_budget
                  ? `M: ${formatCurrency(user.monthly_budget, user.currency)}`
                  : `D: ${formatCurrency(user.daily_limit, user.currency)}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
