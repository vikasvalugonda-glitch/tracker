'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Utensils, Car, Receipt, Film, Sparkles, CreditCard, Banknote, Smartphone, Zap } from 'lucide-react';
import { Expense, ExpenseCategory, PaymentMethod, User, BudgetSummary } from '@/lib/types';
import { toast } from 'sonner';

interface EditExpenseModalProps {
  expense: Expense | null;
  user: User;
  onClose: () => void;
  onExpenseUpdated: (updated: Expense, summary: BudgetSummary) => void;
}

const CATEGORIES: { id: ExpenseCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'Food', label: 'Food & Dining', icon: <Utensils className="h-4 w-4" /> },
  { id: 'Commute', label: 'Commute & Travel', icon: <Car className="h-4 w-4" /> },
  { id: 'Bills', label: 'Bills & Utilities', icon: <Receipt className="h-4 w-4" /> },
  { id: 'Entertainment', label: 'Entertainment', icon: <Film className="h-4 w-4" /> },
  { id: 'Misc', label: 'Miscellaneous', icon: <Sparkles className="h-4 w-4" /> },
];

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: 'Card', label: 'Card', icon: <CreditCard className="h-3.5 w-3.5" /> },
  { id: 'Cash', label: 'Cash', icon: <Banknote className="h-3.5 w-3.5" /> },
  { id: 'UPI/Online', label: 'UPI/Online', icon: <Smartphone className="h-3.5 w-3.5" /> },
];

export function EditExpenseModal({
  expense,
  user,
  onClose,
  onExpenseUpdated,
}: EditExpenseModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Card');
  const [note, setNote] = useState<string>('');
  const [spentAt, setSpentAt] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toFixed(2));
      setCategory((expense.category as ExpenseCategory) || 'Food');
      setPaymentMethod((expense.payment_method as PaymentMethod) || 'Card');
      setNote(expense.note || '');
      try {
        const d = new Date(expense.spent_at);
        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setSpentAt(localIso);
      } catch {
        setSpentAt('');
      }
    }
  }, [expense]);

  if (!expense) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          category,
          payment_method: paymentMethod,
          note: note.trim() || null,
          spent_at: spentAt ? new Date(spentAt).toISOString() : expense.spent_at,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update expense');
      }

      toast.success('Expense updated');
      onExpenseUpdated(data.expense, data.summary);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating expense';
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
          <div>
            <h3 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
              Edit Expense
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Modify transaction details and adjust budget calculations
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-2">
              Amount ({user.currency})
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl dark:bg-black bg-slate-50 border dark:border-white/15 border-slate-200 text-2xl font-bold dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium ${
                    category === cat.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold'
                      : 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.icon}
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium ${
                    paymentMethod === pm.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-semibold'
                      : 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {pm.icon}
                  <span>{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold dark:text-slate-300 text-slate-700 uppercase tracking-wider">
                Date & Time
              </label>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const pad = (n: number) => n.toString().padStart(2, '0');
                  const localStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                  setSpentAt(localStr);
                  toast.success('Fetched present date & time', { duration: 1500 });
                }}
                className="text-[10px] text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 font-bold flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 transition-colors"
                title="Update entry to current moment"
              >
                <Zap className="h-2.5 w-2.5" />
                Fetch Present Time
              </button>
            </div>
            <input
              type="datetime-local"
              value={spentAt}
              onChange={(e) => setSpentAt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl dark:bg-black/60 bg-slate-50 border dark:border-white/10 border-slate-200 text-xs dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
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
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <Check className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
