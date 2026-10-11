'use client';

import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  PieChart, 
  CreditCard, 
  Calendar,
  Award,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { AnalyticsData, User } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface AnalyticsViewProps {
  user: User;
}

export function AnalyticsView({ user }: AnalyticsViewProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/analytics?days=30', { cache: 'no-store' });
        const json = await res.json();
        if (json.analytics) {
          setData(json.analytics);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs">Computing spending analytics & compliance...</span>
      </div>
    );
  }

  if (!data) return null;

  const { weeklyTrend, categoryBreakdown, paymentBreakdown, compliance, metrics } = data;

  // Max spent for bar chart scaling
  const maxWeeklySpent = Math.max(
    ...weeklyTrend.map((d) => d.spent),
    user.daily_limit * 1.2,
    10
  );

  return (
    <div className="space-y-6">
      {/* 1. Hero Compliance & Metric Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Compliance Score Gauge Card (5 cols) */}
        <div className="md:col-span-5 rounded-3xl glass-panel p-6 sm:p-8 flex flex-col justify-between border dark:border-white/10 border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Discipline Rating
              </span>
              <h3 className="text-xl font-bold dark:text-white text-slate-900 mt-0.5">
                Daily Budget Compliance
              </h3>
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Award className="h-6 w-6" />
            </div>
          </div>

          <div className="my-6 flex items-center gap-6">
            <div className="text-5xl sm:text-6xl font-black dark:text-white text-slate-900 tracking-tight">
              {compliance.complianceScore}%
            </div>
            <div className="text-xs text-slate-400 leading-relaxed">
              <span className="text-emerald-400 font-bold block text-sm">
                Kept under budget {compliance.compliantDays} of {compliance.totalDays} days
              </span>
              Based on your configured {user.currency}{user.daily_limit.toFixed(2)}/day threshold over the last 30 days.
            </div>
          </div>

          <div>
            <div className="h-2.5 w-full rounded-full dark:bg-zinc-900 bg-slate-200 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
                style={{ width: `${compliance.complianceScore}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-2">
              <span>0% Overbudget</span>
              <span>100% Target Met</span>
            </div>
          </div>
        </div>

        {/* Key Numerical Metrics (7 cols) */}
        <div className="md:col-span-7 grid grid-cols-2 gap-4">
          <div className="rounded-3xl glass-panel p-5 border dark:border-white/10 border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Average Daily Spend
            </span>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-black dark:text-white text-slate-900">
                {formatCurrency(metrics.avgDailySpend, user.currency)}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                vs {formatCurrency(user.daily_limit, user.currency)} daily limit
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">
              {metrics.avgDailySpend <= user.daily_limit ? '✓ Sustainable pace' : '⚠ Trending above limit'}
            </span>
          </div>

          <div className="rounded-3xl glass-panel p-5 border dark:border-white/10 border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Highest Single Day
            </span>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-black text-rose-500">
                {formatCurrency(metrics.highestDaySpend, user.currency)}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Peak 30-day expenditure
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Outlier tracking
            </span>
          </div>

          <div className="rounded-3xl glass-panel p-5 border dark:border-white/10 border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Largest Single Expense
            </span>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-500">
                {formatCurrency(metrics.highestExpenseAmount, user.currency)}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Single transaction peak
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              High-ticket log
            </span>
          </div>

          <div className="rounded-3xl glass-panel p-5 border dark:border-white/10 border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Total 30-Day Outflow
            </span>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-black text-indigo-400">
                {formatCurrency(metrics.totalPeriodSpend, user.currency)}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Combined all categories
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Cumulative spending
            </span>
          </div>
        </div>
      </div>

      {/* 2. 7-Day Trend Chart & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Daily Bar Chart (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl glass-panel p-6 sm:p-7 border dark:border-white/10 border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold dark:text-white text-slate-900 tracking-tight">
                7-Day Daily Spending Trend
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Bar height shows daily spend against your limit line
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span>Under Limit</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span>Exceeded</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b dark:border-white/10 border-slate-200 relative">
            {/* Reference Line for Daily Limit */}
            <div 
              className="absolute left-0 right-0 border-t border-dashed border-indigo-400/50 flex items-center justify-end pr-2 text-[10px] text-indigo-400 pointer-events-none"
              style={{
                bottom: `${(user.daily_limit / maxWeeklySpent) * 100}%`,
              }}
            >
              <span className="dark:bg-black bg-white px-1.5 py-0.5 rounded border dark:border-white/10 border-slate-200 font-semibold shadow-sm">
                Limit: {formatCurrency(user.daily_limit, user.currency)}
              </span>
            </div>

            {weeklyTrend.map((day) => {
              const heightPct = Math.min((day.spent / maxWeeklySpent) * 100, 100);
              const barColor = day.isOverBudget 
                ? 'from-rose-500 to-red-600' 
                : 'from-emerald-500 to-teal-500';

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[10px] font-semibold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatCurrency(day.spent, user.currency)}
                  </span>
                  <div
                    className={`w-full max-w-[42px] rounded-t-xl bg-gradient-to-t ${barColor} transition-all duration-500 group-hover:brightness-125 shadow-lg`}
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  />
                  <span className="text-xs font-medium text-slate-400">
                    {day.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl glass-panel p-6 sm:p-7 border dark:border-white/10 border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold dark:text-white text-slate-900 tracking-tight">
                Category Distribution
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Spending split by expense classification
              </p>
            </div>
            <PieChart className="h-5 w-5 text-indigo-400" />
          </div>

          <div className="space-y-4 my-auto">
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No category data recorded yet.
              </p>
            ) : (
              categoryBreakdown.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold dark:text-slate-200 text-slate-800">
                      {cat.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">
                        {cat.count} txns
                      </span>
                      <span className="font-bold dark:text-white text-slate-900">
                        {formatCurrency(cat.total, user.currency)} ({cat.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full dark:bg-zinc-900 bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
