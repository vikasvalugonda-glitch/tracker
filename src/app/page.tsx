'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { UrgencyBanner } from '@/components/UrgencyBanner';
import { HeroMetricCard } from '@/components/HeroMetricCard';
import { TransactionFeed } from '@/components/TransactionFeed';
import { QuickAddExpenseModal } from '@/components/QuickAddExpenseModal';
import { InstantFeedbackModal } from '@/components/InstantFeedbackModal';
import { EditExpenseModal } from '@/components/EditExpenseModal';
import { SettingsModal } from '@/components/SettingsModal';
import { AnalyticsView } from '@/components/AnalyticsView';
import { User, Expense, BudgetSummary, InstantFeedbackData } from '@/lib/types';
import { Plus, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics'>('dashboard');
  const [activeFilterRange, setActiveFilterRange] = useState<'today' | '7days' | 'month'>('today');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 12-Hour vs 24-Hour Clock preference
  const [is12Hour, setIs12Hour] = useState(true);

  // Dark vs Light Mode
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Modals
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [instantFeedback, setInstantFeedback] = useState<InstantFeedbackData | null>(null);

  // Theme helper to update HTML and body classes and attributes
  const applyTheme = (t: 'dark' | 'light') => {
    if (typeof window === 'undefined') return;
    const isDark = t === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    document.body.classList.toggle('dark', isDark);
    document.body.classList.toggle('light', !isDark);
    document.documentElement.setAttribute('data-theme', t);
  };

  // Initialize theme and clock format from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('tracker_theme') as 'dark' | 'light') || 'dark';
      setTheme(savedTheme);
      applyTheme(savedTheme);

      const savedClock = localStorage.getItem('tracker_clock_12h');
      if (savedClock !== null) {
        setIs12Hour(savedClock === 'true');
      }
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tracker_theme', nextTheme);
      applyTheme(nextTheme);
    }
    toast.info(`Switched to ${nextTheme === 'dark' ? 'Pure Black Dark Mode' : 'Clean Light Mode'}`);
  };

  const handleToggleClockFormat = () => {
    const next = !is12Hour;
    setIs12Hour(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tracker_clock_12h', String(next));
    }
    toast.info(`Clock format changed to ${next ? '12-Hour (AM/PM)' : '24-Hour'}`);
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to sign out and exit?')) return;
    try {
      setLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Signed out safely');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Failed to logout');
      setLoggingOut(false);
    }
  };

  // Load initial session and expenses
  const loadData = useCallback(async (range = activeFilterRange, category = selectedCategory, search = searchQuery) => {
    try {
      const userRes = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);

      const params = new URLSearchParams({
        range,
        category: category || 'All',
        search: search || '',
        _t: Date.now().toString(),
      });
      const expRes = await fetch(`/api/expenses?${params.toString()}`, { cache: 'no-store' });
      if (expRes.ok) {
        const expData = await expRes.json();
        setExpenses(expData.expenses || []);
        setSummary(expData.summary || null);
      }
    } catch (err) {
      console.error('Failed to load tracker state:', err);
      toast.error('Unable to fetch budget status');
    } finally {
      setLoading(false);
    }
  }, [activeFilterRange, selectedCategory, searchQuery, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRangeChange = (newRange: 'today' | '7days' | 'month') => {
    setActiveFilterRange(newRange);
    loadData(newRange, selectedCategory, searchQuery);
  };

  const handleCategoryChange = (newCat: string) => {
    setSelectedCategory(newCat);
    loadData(activeFilterRange, newCat, searchQuery);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearchQuery(newSearch);
    loadData(activeFilterRange, selectedCategory, newSearch);
  };

  const handleExpenseAdded = (data: {
    expense: unknown;
    summary: BudgetSummary;
    feedback: InstantFeedbackData;
  }) => {
    setSummary(data.summary);
    setInstantFeedback(data.feedback);
    loadData(activeFilterRange, selectedCategory, searchQuery);
  };

  const handleExpenseUpdated = (updated: Expense, updatedSummary: BudgetSummary) => {
    setSummary(updatedSummary);
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleExpenseDeleted = (deletedId: string, updatedSummary: BudgetSummary) => {
    setSummary(updatedSummary);
    setExpenses((prev) => prev.filter((e) => e.id !== deletedId));
  };

  const handleSettingsUpdated = (updatedUser: User, updatedSummary: BudgetSummary) => {
    setUser(updatedUser);
    setSummary(updatedSummary);
    loadData(activeFilterRange, selectedCategory, searchQuery);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen dark:bg-black bg-slate-50 flex flex-col items-center justify-center text-slate-400">
        <div className="h-10 w-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-semibold tracking-wide dark:text-slate-300 text-slate-700">
          Loading SpendPulse Real-Time Engine...
        </span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col selection:bg-indigo-500/30 selection:text-indigo-300 transition-colors duration-200 ${
      theme === 'dark' ? 'dark bg-black text-slate-100' : 'light bg-slate-50 text-slate-900'
    }`}>
      {/* Navigation Header */}
      <Navbar
        user={user}
        summary={summary}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onUserUpdate={setUser}
        is12Hour={is12Hour}
        onToggleClockFormat={handleToggleClockFormat}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Dynamic Urgency Alert Banner */}
        {summary && (
          <UrgencyBanner 
            summary={summary} 
            onOpenQuickAdd={() => setIsQuickAddOpen(true)} 
          />
        )}

        {/* Dashboard View */}
        {activeTab === 'dashboard' ? (
          <>
            {/* Hero Metric Section */}
            {summary && <HeroMetricCard summary={summary} />}

            {/* Transaction Feed */}
            <TransactionFeed
              expenses={expenses}
              user={user}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              onOpenEdit={(exp) => setEditingExpense(exp)}
              onExpenseDeleted={handleExpenseDeleted}
              activeFilterRange={activeFilterRange}
              setActiveFilterRange={handleRangeChange}
              selectedCategory={selectedCategory}
              setSelectedCategory={handleCategoryChange}
              searchQuery={searchQuery}
              setSearchQuery={handleSearchChange}
              is12Hour={is12Hour}
            />
          </>
        ) : (
          /* Analytics & Compliance View */
          <AnalyticsView user={user} />
        )}
      </main>

      {/* Fixed Bottom-Right Action Floating Dock (Exit & Quick Add) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 p-1.5 rounded-2xl dark:bg-zinc-950/90 bg-white/95 backdrop-blur-xl border dark:border-white/10 border-slate-300/80 shadow-2xl shadow-black/30 transition-all">
        {/* Relocated Exit Button placed in bottom right corner */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/10 text-xs font-semibold transition-all active:scale-95 group"
          title="Sign out / Exit"
        >
          <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 text-slate-400 group-hover:text-rose-400" />
          <span className="whitespace-nowrap font-medium">Exit</span>
        </button>

        <div className="h-4 w-px dark:bg-white/10 bg-slate-200 shrink-0" />

        {/* Quick Add Floating Button */}
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-500/25 active:scale-95 transition-all whitespace-nowrap"
          title="Quick Log Expense"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span className="whitespace-nowrap">Add Expense</span>
        </button>
      </div>

      {/* Modals & Popups */}
      <QuickAddExpenseModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        user={user}
        onExpenseAdded={handleExpenseAdded}
      />

      <InstantFeedbackModal
        feedback={instantFeedback}
        onClose={() => setInstantFeedback(null)}
      />

      <EditExpenseModal
        expense={editingExpense}
        user={user}
        onClose={() => setEditingExpense(null)}
        onExpenseUpdated={handleExpenseUpdated}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onSettingsUpdated={handleSettingsUpdated}
        is12Hour={is12Hour}
        onToggleClockFormat={handleToggleClockFormat}
      />
    </div>
  );
}
