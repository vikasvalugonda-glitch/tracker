'use client';

import React from 'react';
import { 
  ShieldCheck, 
  Layers, 
  Receipt, 
  Zap, 
  Clock,
  Calendar,
  Sparkles
} from 'lucide-react';
import { BudgetSummary } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface HeroMetricCardProps {
  summary: BudgetSummary;
}

export function HeroMetricCard({ summary }: HeroMetricCardProps) {
  const {
    todaySpent,
    dailyLimit,
    monthlyBudget,
    monthSpent,
    monthRemaining,
    budgetMode,
    effectiveLimit,
    remainingLimit,
    percentageConsumed,
    urgency,
    transactionCount,
    rolloverBonus,
    currency,
  } = summary;

  // Base daily balance remaining
  const baseDailyRemaining = Math.round((dailyLimit - todaySpent) * 100) / 100;
  const isOverDailyLimit = todaySpent > dailyLimit;

  // Month progress
  const monthPercentage = monthlyBudget > 0 
    ? Math.round((monthSpent / monthlyBudget) * 1000) / 10 
    : 0;
  const isOverMonthlyLimit = monthSpent > monthlyBudget;

  // Days left in current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysLeftInMonth = Math.max(0, daysInMonth - now.getDate());

  // Gauge 1: Daily Circle Calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dailyProgressPercent = dailyLimit > 0 ? (todaySpent / dailyLimit) * 100 : 100;
  const dailyDashoffset = circumference - (Math.min(dailyProgressPercent, 100) / 100) * circumference;

  let dailyGaugeColor = '#10b981'; // emerald
  let dailyGlow = 'rgba(16, 185, 129, 0.35)';
  let urgencyText = 'Within Budget';
  let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  if (urgency === 'over_budget' || isOverDailyLimit) {
    dailyGaugeColor = '#f43f5e'; // rose
    dailyGlow = 'rgba(244, 63, 94, 0.45)';
    urgencyText = isOverDailyLimit && remainingLimit > 0 ? 'Daily Limit Exceeded (Cushioned)' : 'Daily Exceeded';
    badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (urgency === 'warning') {
    dailyGaugeColor = '#f59e0b'; // amber
    dailyGlow = 'rgba(245, 158, 11, 0.35)';
    urgencyText = 'Approaching Limit (80%+)';
    badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }

  // Gauge 2: Monthly Circle Calculations
  const monthlyProgressPercent = monthlyBudget > 0 ? (monthSpent / monthlyBudget) * 100 : 0;
  const monthlyDashoffset = circumference - (Math.min(monthlyProgressPercent, 100) / 100) * circumference;

  let monthlyGaugeColor = '#6366f1'; // indigo
  let monthlyGlow = 'rgba(99, 102, 241, 0.35)';
  if (isOverMonthlyLimit) {
    monthlyGaugeColor = '#f43f5e';
    monthlyGlow = 'rgba(244, 63, 94, 0.45)';
  } else if (monthPercentage >= 80) {
    monthlyGaugeColor = '#f59e0b';
    monthlyGlow = 'rgba(245, 158, 11, 0.35)';
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Main Hero Gauge Card with Side-by-Side Twin Circles (7 cols on lg) */}
      <div className="lg:col-span-7 rounded-3xl glass-panel p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden transition-colors">
        {/* Ambient Glow */}
        <div 
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700"
          style={{ background: dailyGlow }}
        />
        <div 
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700"
          style={{ background: monthlyGlow }}
        />

        {/* Card Header */}
        <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
                {budgetMode === 'monthly' ? "Active Budget Tracker" : "Today's Budget Tracker"}
              </span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                {urgencyText}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black dark:text-white text-slate-900 tracking-tight mt-1">
              {formatCurrency(todaySpent, currency)}
              <span className="text-sm sm:text-base font-normal text-slate-400 ml-2">
                / {formatCurrency(dailyLimit, currency)}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Daily target: {formatCurrency(dailyLimit, currency)} • Monthly budget: {formatCurrency(monthlyBudget, currency)}
            </p>
          </div>

          {rolloverBonus > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs shrink-0">
              <Layers className="h-3.5 w-3.5" />
              <span>+{formatCurrency(rolloverBonus, currency)} Rollover</span>
            </div>
          )}
        </div>

        {/* Center: Side-by-Side Twin Circles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2 relative z-10 items-center justify-center">
          {/* Circle 1: Daily Tracker Circle */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl dark:bg-black/60 bg-white/80 border dark:border-white/5 border-slate-200/90 shadow-sm dark:shadow-none transition-colors">
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 130 130">
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  className="dark:stroke-zinc-800 stroke-slate-200"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke={dailyGaugeColor}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={dailyDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{
                    transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease',
                    filter: `drop-shadow(0 0 6px ${dailyGlow})`,
                  }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black dark:text-white text-slate-900 tracking-tight">
                  {percentageConsumed}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                  Daily Limit
                </span>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="text-xs font-bold dark:text-slate-200 text-slate-800">
                {formatCurrency(todaySpent, currency)}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400"> of {formatCurrency(dailyLimit, currency)}</span>
              <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                Today&apos;s Active Pace
              </span>
            </div>
          </div>

          {/* Circle 2: Monthly Limit Tracker Circle (Beside Daily) */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl dark:bg-black/60 bg-white/80 border dark:border-white/5 border-slate-200/90 shadow-sm dark:shadow-none transition-colors">
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 130 130">
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  className="dark:stroke-zinc-800 stroke-slate-200"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke={monthlyGaugeColor}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={monthlyDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{
                    transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease',
                    filter: `drop-shadow(0 0 6px ${monthlyGlow})`,
                  }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black dark:text-white text-slate-900 tracking-tight">
                  {monthPercentage}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                  Monthly Limit
                </span>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="text-xs font-bold dark:text-slate-200 text-slate-800">
                {formatCurrency(monthSpent, currency)}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400"> of {formatCurrency(monthlyBudget, currency)}</span>
              <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                {daysLeftInMonth} days left this month
              </span>
            </div>
          </div>
        </div>

        {/* Linear progress bar underneath */}
        <div className="mt-3 relative z-10">
          <div className="h-2 w-full rounded-full dark:bg-zinc-900 bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(dailyProgressPercent, 100)}%`,
                backgroundColor: dailyGaugeColor,
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
            <span>0%</span>
            <span>80% Warning ({formatCurrency(dailyLimit * 0.8, currency)})</span>
            <span>100% Daily Limit ({formatCurrency(dailyLimit, currency)})</span>
          </div>
        </div>
      </div>

      {/* 2. Remaining Balance Card (5 cols on lg) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="flex-1 rounded-3xl glass-panel p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
              Remaining Spending Capacity
            </span>
            <div className="p-2 rounded-xl dark:bg-zinc-900 bg-slate-100 border dark:border-white/10 border-slate-200 text-slate-400">
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span 
                className="text-4xl sm:text-5xl font-black tracking-tight"
                style={{
                  color: baseDailyRemaining < 0 
                    ? (remainingLimit > 0 ? '#f59e0b' : '#f43f5e') 
                    : '#34d399'
                }}
              >
                {formatCurrency(baseDailyRemaining, currency)}
              </span>
            </div>

            <div className="text-xs text-slate-400 mt-2 space-y-2">
              {baseDailyRemaining >= 0 ? (
                <p>
                  You have <span className="text-emerald-400 font-semibold">{formatCurrency(baseDailyRemaining, currency)}</span> safe to spend today of your {formatCurrency(dailyLimit, currency)} allowance.
                </p>
              ) : (
                <p>
                  <span className="text-rose-400 font-semibold">
                    Daily budget exceeded by {formatCurrency(Math.abs(baseDailyRemaining), currency)}.
                  </span>
                  {rolloverBonus > 0 && remainingLimit > 0 && (
                    <span className="block text-indigo-300 mt-1">
                      Cushioned by rollover: {formatCurrency(remainingLimit, currency)} total remaining before absolute cap.
                    </span>
                  )}
                </p>
              )}

              {/* Monthly Overview Pill */}
              <div className="p-3 rounded-2xl dark:bg-zinc-900/90 bg-slate-100 border dark:border-white/5 border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Monthly Target Remaining</span>
                  <span className={`text-base font-extrabold ${monthRemaining >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                    {formatCurrency(monthRemaining, currency)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">Month Budget</span>
                  <span className="text-xs font-bold dark:text-slate-200 text-slate-800">
                    {formatCurrency(monthlyBudget, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl dark:bg-zinc-900/80 bg-slate-100 border dark:border-white/5 border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <span>Pacing Summary:</span>
            </div>
            <span className="font-semibold dark:text-slate-200 text-slate-800">
              {formatCurrency(dailyLimit, currency)}/day • {daysLeftInMonth} days left
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
