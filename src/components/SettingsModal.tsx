'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Layers, 
  BellRing, 
  Sliders,
  Calendar,
  CalendarDays,
  Clock
} from 'lucide-react';
import { User, BudgetSummary } from '@/lib/types';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSettingsUpdated: (updatedUser: User, summary: BudgetSummary) => void;
  is12Hour: boolean;
  onToggleClockFormat: () => void;
}

const CURRENCIES = ['$', '€', '£', '₹', '¥', '₩', 'C$', 'A$'];

export function SettingsModal({
  isOpen,
  onClose,
  user,
  onSettingsUpdated,
  is12Hour,
  onToggleClockFormat,
}: SettingsModalProps) {
  const [budgetMode, setBudgetMode] = useState<'daily' | 'monthly'>(user.budget_mode || 'daily');
  const [dailyLimit, setDailyLimit] = useState(user.daily_limit.toString());
  const [monthlyBudget, setMonthlyBudget] = useState(
    user.monthly_budget ? user.monthly_budget.toString() : (user.daily_limit * 30).toString()
  );
  const [currency, setCurrency] = useState(user.currency || '$');
  const [rolloverUnused, setRolloverUnused] = useState(Boolean(user.rollover_unused));
  const [loading, setLoading] = useState(false);

  // Sync state whenever modal opens or user updates
  useEffect(() => {
    if (isOpen && user) {
      const mode = user.budget_mode || 'daily';
      setBudgetMode(mode);
      setDailyLimit(user.daily_limit.toString());
      setMonthlyBudget(
        user.monthly_budget ? user.monthly_budget.toString() : (user.daily_limit * 30).toString()
      );
      setCurrency(user.currency || '$');
      setRolloverUnused(Boolean(user.rollover_unused));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Handle changes when typing in Daily Limit
  const handleDailyChange = (val: string) => {
    setDailyLimit(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setMonthlyBudget((num * 30).toFixed(0));
    }
  };

  // Handle changes when typing in Monthly Budget
  const handleMonthlyChange = (val: string) => {
    setMonthlyBudget(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setDailyLimit((num / 30).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(dailyLimit);
    const monthNum = parseFloat(monthlyBudget);

    if (isNaN(limitNum) || limitNum <= 0) {
      toast.error('Please enter a valid daily budget greater than 0');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_limit: limitNum,
          monthly_budget: !isNaN(monthNum) && monthNum > 0 ? monthNum : limitNum * 30,
          budget_mode: budgetMode,
          currency,
          rollover_unused: rolloverUnused,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      const updatedUser: User = {
        ...user,
        daily_limit: limitNum,
        monthly_budget: !isNaN(monthNum) && monthNum > 0 ? monthNum : limitNum * 30,
        budget_mode: budgetMode,
        currency,
        rollover_unused: rolloverUnused,
      };

      toast.success(
        budgetMode === 'monthly'
          ? `Budget configured to ${currency}${monthNum.toFixed(2)}/month (~${currency}${limitNum.toFixed(2)}/day)`
          : `Daily budget updated to ${currency}${limitNum.toFixed(2)}/day`
      );
      onSettingsUpdated(updatedUser, data.summary);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating settings';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-3xl dark:bg-zinc-950 bg-white p-6 sm:p-8 border dark:border-white/10 border-slate-200 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b dark:border-white/10 border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
                Budget Configuration
              </h3>
              <p className="text-xs text-slate-400">
                Configure your monthly budget, daily allowance & preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white dark:hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          {/* Budget Setting Mode Selector (Daily vs Monthly) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-2">
              Budgeting Method
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl dark:bg-zinc-900 bg-slate-100 border dark:border-white/5 border-slate-200">
              <button
                type="button"
                onClick={() => setBudgetMode('daily')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  budgetMode === 'daily'
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span>By Daily Limit</span>
              </button>
              <button
                type="button"
                onClick={() => setBudgetMode('monthly')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  budgetMode === 'monthly'
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>By Monthly Budget</span>
              </button>
            </div>
          </div>

          {/* Dual Budget Inputs with Live Synchronized Calculation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily Limit Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-2">
                Daily Limit ({currency})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                  {currency}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={dailyLimit}
                  onChange={(e) => handleDailyChange(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-2xl dark:bg-black bg-slate-50 border text-xl font-bold dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500 ${
                    budgetMode === 'daily' ? 'border-indigo-500/60 ring-2 ring-indigo-500/20' : 'dark:border-white/10 border-slate-200'
                  }`}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {budgetMode === 'monthly' ? 'Auto-split: Monthly ÷ 30 days' : 'Active primary daily cap'}
              </span>
            </div>

            {/* Monthly Budget Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-2">
                Monthly Target ({currency})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                  {currency}
                </span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={monthlyBudget}
                  onChange={(e) => handleMonthlyChange(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-2xl dark:bg-black bg-slate-50 border text-xl font-bold dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500 ${
                    budgetMode === 'monthly' ? 'border-indigo-500/60 ring-2 ring-indigo-500/20' : 'dark:border-white/10 border-slate-200'
                  }`}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {budgetMode === 'daily' ? 'Auto-projected: Daily × 30 days' : 'Active primary monthly cap'}
              </span>
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-2">
              Preferred Currency
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {CURRENCIES.map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setCurrency(curr)}
                  className={`py-2 px-3 rounded-xl border text-sm font-bold transition-all ${
                    currency === curr
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm ring-1 ring-white/30'
                      : 'dark:bg-zinc-900 bg-slate-100 dark:border-white/5 border-slate-200 text-slate-400 hover:text-white dark:hover:bg-zinc-800'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* Clock Format Preference */}
          <div className="p-4 rounded-2xl dark:bg-zinc-900 bg-slate-100 border dark:border-white/10 border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-indigo-400" />
              <div>
                <span className="text-xs font-bold dark:text-white text-slate-900 block">
                  Clock Display Format
                </span>
                <span className="text-[11px] text-slate-400">
                  Choose between 12-hour (AM/PM) and 24-hour military format
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleClockFormat}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm active:scale-95 transition-all"
            >
              {is12Hour ? '12-Hour (AM/PM)' : '24-Hour'}
            </button>
          </div>

          {/* Rollover Toggle */}
          <div className="p-4 rounded-2xl dark:bg-zinc-900 bg-slate-100 border dark:border-white/10 border-slate-200 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-bold dark:text-white text-slate-900">
                  Rollover Unspent Funds
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {rolloverUnused ? (
                  <span className="text-indigo-400 font-medium">
                    Active: Unspent allowance from yesterday carries over into today as an extra safety cushion.
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Disabled: Daily budget resets cleanly to exactly {currency}{parseFloat(dailyLimit) || 0} at midnight with no carryover.
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRolloverUnused(!rolloverUnused)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                rolloverUnused ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  rolloverUnused ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center gap-2 active:scale-95 transition-transform"
            >
              <Check className="h-4 w-4" />
              {loading ? 'Saving...' : 'Apply Budget Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
