'use client';

import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2, Sparkles } from 'lucide-react';
import { BudgetSummary } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface UrgencyBannerProps {
  summary: BudgetSummary;
  onOpenQuickAdd: () => void;
}

export function UrgencyBanner({ summary, onOpenQuickAdd }: UrgencyBannerProps) {
  const { 
    urgency, 
    todaySpent, 
    dailyLimit,
    effectiveLimit, 
    remainingLimit, 
    percentageConsumed, 
    excessAmount, 
    rolloverBonus,
    currency 
  } = summary;

  const isOverDailyLimit = todaySpent > dailyLimit;
  const baseExcess = Math.max(0, Math.round((todaySpent - dailyLimit) * 100) / 100);

  if (urgency === 'over_budget' || isOverDailyLimit) {
    return (
      <div className="relative overflow-hidden rounded-2xl dark:bg-gradient-to-r dark:from-rose-950/80 dark:via-red-950/60 dark:to-rose-950/80 bg-gradient-to-r from-rose-50 via-red-50 to-rose-50 border dark:border-rose-500/40 border-rose-300 p-4 sm:p-5 shadow-xl dark:shadow-rose-950/40 shadow-rose-500/10 animate-ring-danger transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl dark:bg-rose-500/20 bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0 border dark:border-rose-500/30 border-rose-300">
              <AlertOctagon className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-rose-500 text-white">
                  {remainingLimit <= 0 ? 'High Priority Alert' : 'Daily Limit Exceeded'}
                </span>
                <span className="text-xs dark:text-rose-300 text-rose-700 font-semibold">
                  {percentageConsumed}% of {formatCurrency(dailyLimit, currency)} daily budget
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold dark:text-white text-slate-900 mt-1">
                {remainingLimit <= 0 
                  ? `Daily Budget Exceeded by ${formatCurrency(excessAmount || baseExcess, currency)}!`
                  : `Spent ${formatCurrency(todaySpent, currency)} (Exceeded ${formatCurrency(dailyLimit, currency)} Daily Limit)`
                }
              </h3>
              <p className="text-xs sm:text-sm dark:text-rose-200/90 text-rose-800 mt-0.5">
                {remainingLimit > 0 && rolloverBonus > 0 ? (
                  <>
                    You exceeded your configured {formatCurrency(dailyLimit, currency)} daily limit by {formatCurrency(baseExcess, currency)}. Rollover cushion remaining: <strong className="dark:text-white text-slate-900">{formatCurrency(remainingLimit, currency)}</strong>.
                  </>
                ) : (
                  <>
                    You have spent {formatCurrency(todaySpent, currency)} against your daily limit of {formatCurrency(dailyLimit, currency)}.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={onOpenQuickAdd}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-600/30 transition-all text-center"
            >
              Log Adjusted Expense
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (urgency === 'warning') {
    const remainingToDaily = Math.max(0, Math.round((dailyLimit - todaySpent) * 100) / 100);
    return (
      <div className="relative overflow-hidden rounded-2xl dark:bg-gradient-to-r dark:from-amber-950/70 dark:via-yellow-950/40 dark:to-amber-950/70 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border dark:border-amber-500/40 border-amber-300 p-4 sm:p-5 shadow-lg dark:shadow-amber-950/30 shadow-amber-500/10 animate-ring-warning transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl dark:bg-amber-500/20 bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 border dark:border-amber-500/30 border-amber-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 font-black">
                  Threshold Warning (80%+)
                </span>
                <span className="text-xs dark:text-amber-300 text-amber-800 font-semibold">
                  {percentageConsumed}% of {formatCurrency(dailyLimit, currency)} daily limit
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold dark:text-white text-slate-900 mt-1">
                Approaching Your Daily Spending Limit!
              </h3>
              <p className="text-xs sm:text-sm dark:text-amber-200/90 text-amber-900/90 mt-0.5">
                Spent {formatCurrency(todaySpent, currency)} of your {formatCurrency(dailyLimit, currency)} allowance ({formatCurrency(remainingToDaily, currency)} remaining).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <span className="text-xs font-semibold dark:text-amber-300/90 text-amber-800 hidden sm:inline-block">
              Keep upcoming expenses minimal
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Normal (< 80%)
  const remainingToDaily = Math.max(0, Math.round((dailyLimit - todaySpent) * 100) / 100);
  return (
    <div className="relative overflow-hidden rounded-2xl dark:bg-gradient-to-r dark:from-emerald-950/50 dark:via-zinc-950 dark:to-emerald-950/40 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border dark:border-emerald-500/20 border-emerald-300/70 p-4 sm:p-5 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl dark:bg-emerald-500/10 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 border dark:border-emerald-500/20 border-emerald-300">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider dark:bg-emerald-500/20 bg-emerald-100 dark:text-emerald-300 text-emerald-800 border dark:border-emerald-500/30 border-emerald-300">
                Budget On Track
              </span>
              <span className="text-xs dark:text-slate-400 text-slate-500">
                {percentageConsumed}% of {formatCurrency(dailyLimit, currency)} limit
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold dark:text-white text-slate-900 mt-1">
              Healthy Spending Today
            </h3>
            <p className="text-xs sm:text-sm dark:text-slate-300/90 text-slate-600 mt-0.5">
              You have {formatCurrency(remainingToDaily, currency)} safe to spend before reaching today&apos;s {formatCurrency(dailyLimit, currency)} target.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs dark:text-emerald-400 text-emerald-700 dark:bg-emerald-500/10 bg-emerald-100 px-3 py-1.5 rounded-xl border dark:border-emerald-500/20 border-emerald-300 font-semibold">
            <Sparkles className="h-3.5 w-3.5 dark:text-emerald-400 text-emerald-600" />
            <span>Pacing well</span>
          </div>
        </div>
      </div>
    </div>
  );
}
