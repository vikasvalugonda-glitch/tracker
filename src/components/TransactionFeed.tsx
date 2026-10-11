'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  Trash2, 
  Edit3, 
  Utensils, 
  Car, 
  Receipt, 
  Film, 
  Sparkles,
  CreditCard,
  Banknote,
  Smartphone,
  Plus
} from 'lucide-react';
import { Expense, User, BudgetSummary } from '@/lib/types';
import { formatCurrency, formatTimeLabel, formatDateLabel } from '@/lib/format';
import { toast } from 'sonner';

interface TransactionFeedProps {
  expenses: Expense[];
  user: User;
  onOpenQuickAdd: () => void;
  onOpenEdit: (expense: Expense) => void;
  onExpenseDeleted: (id: string, summary: BudgetSummary) => void;
  activeFilterRange: 'today' | '7days' | 'month';
  setActiveFilterRange: (range: 'today' | '7days' | 'month') => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  is12Hour?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Food: <Utensils className="h-4 w-4 text-amber-400" />,
  Commute: <Car className="h-4 w-4 text-cyan-400" />,
  Bills: <Receipt className="h-4 w-4 text-rose-400" />,
  Entertainment: <Film className="h-4 w-4 text-purple-400" />,
  Misc: <Sparkles className="h-4 w-4 text-emerald-400" />,
};

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  Card: <CreditCard className="h-3 w-3" />,
  Cash: <Banknote className="h-3 w-3" />,
  'UPI/Online': <Smartphone className="h-3 w-3" />,
};

export function TransactionFeed({
  expenses,
  user,
  onOpenQuickAdd,
  onOpenEdit,
  onExpenseDeleted,
  activeFilterRange,
  setActiveFilterRange,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  is12Hour = true,
}: TransactionFeedProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this expense entry?')) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete expense');
      }

      toast.success('Expense removed');
      onExpenseDeleted(id, data.summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting expense';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    window.open('/api/expenses/export', '_blank');
  };

  const categories = ['All', 'Food', 'Commute', 'Bills', 'Entertainment', 'Misc'];

  return (
    <div className="rounded-3xl glass-panel p-5 sm:p-7 flex flex-col gap-5">
      {/* Feed Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold dark:text-white text-slate-900 tracking-tight">
              Transaction Feed
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full dark:bg-zinc-800 bg-slate-200 dark:text-slate-300 text-slate-700 border dark:border-white/5 border-slate-300">
              {expenses.length} logs
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time itemized record of your spending activity
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Range Filter */}
          <div className="flex items-center dark:bg-zinc-900 bg-slate-100 p-1 rounded-xl border dark:border-white/10 border-slate-200 text-xs">
            <button
              onClick={() => setActiveFilterRange('today')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeFilterRange === 'today'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white dark:hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveFilterRange('7days')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeFilterRange === '7days'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white dark:hover:text-white'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setActiveFilterRange('month')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeFilterRange === 'month'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white dark:hover:text-white'
              }`}
            >
              30 Days
            </button>
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExport}
            className="p-2 rounded-xl dark:bg-zinc-900 bg-slate-100 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-white dark:text-slate-300 border dark:border-white/10 border-slate-200 text-xs flex items-center gap-1.5 transition-colors"
            title="Export CSV"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span className="hidden md:inline font-semibold">Export</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'dark:bg-zinc-900 bg-slate-100 text-slate-400 hover:text-white dark:hover:bg-zinc-800 border dark:border-white/5 border-slate-200'
              }`}
            >
              {cat !== 'All' && CATEGORY_ICONS[cat]}
              <span>{cat}</span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl dark:bg-zinc-900 bg-slate-100 border dark:border-white/10 border-slate-200 text-xs dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2 mt-1">
        {expenses.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl dark:bg-zinc-950/60 bg-slate-50 border dark:border-white/5 border-slate-200 flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-2xl dark:bg-zinc-900 bg-slate-200 flex items-center justify-center text-slate-400 mb-3 border dark:border-white/5 border-slate-300">
              <Sparkles className="h-6 w-6 text-emerald-400" />
            </div>
            <h4 className="text-sm font-semibold dark:text-slate-200 text-slate-800">
              No expenses found
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              {activeFilterRange === 'today'
                ? "You haven't logged any expenses today yet. Your spending is at zero!"
                : 'No transactions match your current search or category filter.'}
            </p>
            <button
              onClick={onOpenQuickAdd}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Log Your First Expense
            </button>
          </div>
        ) : (
          expenses.map((expense) => {
            const isDeleting = deletingId === expense.id;
            return (
              <div
                key={expense.id}
                className="group p-3.5 sm:p-4 rounded-2xl dark:bg-zinc-950/80 bg-slate-50 hover:bg-slate-100 dark:hover:bg-zinc-900/90 border dark:border-white/5 border-slate-200 transition-all flex items-center justify-between gap-4"
              >
                {/* Left: Category Icon + Title + Meta */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-10 w-10 rounded-xl dark:bg-zinc-900 bg-slate-200 border dark:border-white/10 border-slate-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {CATEGORY_ICONS[expense.category] || <Sparkles className="h-4 w-4 text-emerald-400" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold dark:text-white text-slate-900 truncate">
                        {expense.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full dark:bg-zinc-900 bg-slate-200 dark:text-slate-300 text-slate-700 border dark:border-white/5 border-slate-300">
                        {PAYMENT_ICONS[expense.payment_method]}
                        <span>{expense.payment_method}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      {expense.note && (
                        <span className="dark:text-slate-300 text-slate-700 truncate max-w-[150px] sm:max-w-xs font-medium">
                          {expense.note}
                        </span>
                      )}
                      {expense.note && <span className="text-slate-500">•</span>}
                      <span>{formatDateLabel(expense.spent_at)}</span>
                      <span>{formatTimeLabel(expense.spent_at, is12Hour)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount + Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-base sm:text-lg font-black text-rose-500 tracking-tight">
                    -{formatCurrency(expense.amount, user.currency)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenEdit(expense)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      title="Edit Transaction"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
                      title="Delete Transaction"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
