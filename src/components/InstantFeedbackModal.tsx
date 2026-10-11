'use client';

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  X, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { InstantFeedbackData } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface InstantFeedbackModalProps {
  feedback: InstantFeedbackData | null;
  onClose: () => void;
}

export function InstantFeedbackModal({ feedback, onClose }: InstantFeedbackModalProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!feedback) return;
    setProgress(100);

    const duration = 5000;
    const intervalTime = 50;
    const decrement = (intervalTime / duration) * 100;

    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - decrement));
    }, intervalTime);

    const closeTimeout = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(closeTimeout);
    };
  }, [feedback, onClose]);

  if (!feedback) return null;

  const {
    addedAmount,
    category,
    paymentMethod,
    todaySpent,
    remainingLimit,
    percentageConsumed,
    urgency,
    excessAmount,
    currency,
  } = feedback;

  let borderColor = 'border-emerald-500/40';
  let headerBg = 'bg-emerald-500/10 text-emerald-400';
  let Icon = CheckCircle2;
  let statusTitle = 'Expense Logged - Budget On Track';
  let badgeLabel = 'Safe Limit (<80%)';
  let badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  if (urgency === 'over_budget') {
    borderColor = 'border-rose-500/60';
    headerBg = 'bg-rose-500/20 text-rose-400';
    Icon = AlertOctagon;
    statusTitle = 'Daily Budget Exceeded!';
    badgeLabel = 'Over Budget (≥100%)';
    badgeBg = 'bg-rose-500 text-white font-bold';
  } else if (urgency === 'warning') {
    borderColor = 'border-amber-500/50';
    headerBg = 'bg-amber-500/20 text-amber-400';
    Icon = AlertTriangle;
    statusTitle = 'Approaching Daily Limit!';
    badgeLabel = 'Warning Threshold (80%+)';
    badgeBg = 'bg-amber-500 text-slate-950 font-bold';
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-1 animate-in slide-in-from-bottom-5 duration-300">
      <div className={`rounded-2xl glass-panel p-5 border ${borderColor} shadow-2xl relative overflow-hidden bg-slate-950/95`}>
        {/* Top Dismiss Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-center gap-3 pr-6">
          <div className={`p-2 rounded-xl shrink-0 ${headerBg}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeBg}`}>
                {badgeLabel}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">
              {statusTitle}
            </h4>
          </div>
        </div>

        {/* Highlight Card */}
        <div className="my-3.5 p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span>Added:</span>
              <span className="text-slate-200 font-semibold">{category} ({paymentMethod})</span>
            </span>
            <span className="font-bold text-base text-white">
              +{formatCurrency(addedAmount, currency)}
            </span>
          </div>

          <div className="h-px bg-white/5" />

          <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
            <div>
              <span className="text-[11px] text-slate-400 block">Today&apos;s Total Spent</span>
              <span className="font-bold text-sm text-slate-100">
                {formatCurrency(todaySpent, currency)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">
                {remainingLimit >= 0 ? 'Remaining Daily Limit' : 'Excess Spent'}
              </span>
              <span 
                className="font-bold text-sm"
                style={{ color: remainingLimit < 0 ? '#f43f5e' : '#34d399' }}
              >
                {remainingLimit >= 0 ? formatCurrency(remainingLimit, currency) : formatCurrency(excessAmount, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar of Daily Limit */}
        <div>
          <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
            <span>Daily Limit Consumed</span>
            <span className="font-bold text-slate-200">{percentageConsumed}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(percentageConsumed, 100)}%`,
                backgroundColor: urgency === 'over_budget' ? '#f43f5e' : urgency === 'warning' ? '#f59e0b' : '#10b981',
              }}
            />
          </div>
        </div>

        {/* Auto dismiss timer indicator */}
        <div className="mt-3 pt-2 flex items-center justify-between text-[10px] text-slate-500">
          <span>Auto-closing in a moment...</span>
          <button
            onClick={onClose}
            className="text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider"
          >
            Dismiss Now
          </button>
        </div>

        {/* Bottom edge progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
          <div 
            className="h-full bg-indigo-500/80 transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
