'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Utensils, 
  Car, 
  Receipt, 
  Film, 
  Sparkles, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Calendar, 
  FileText,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  RotateCcw
} from 'lucide-react';
import { ExpenseCategory, PaymentMethod, User, BudgetSummary, InstantFeedbackData } from '@/lib/types';
import { sounds } from '@/lib/sounds';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';

interface QuickAddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onExpenseAdded: (data: {
    expense: unknown;
    summary: BudgetSummary;
    feedback: InstantFeedbackData;
  }) => void;
}

const CATEGORIES: { id: ExpenseCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'Food', label: 'Food & Dining', icon: <Utensils className="h-4 w-4" />, color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/40' },
  { id: 'Commute', label: 'Commute & Travel', icon: <Car className="h-4 w-4" />, color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/40' },
  { id: 'Bills', label: 'Bills & Utilities', icon: <Receipt className="h-4 w-4" />, color: 'from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/40' },
  { id: 'Entertainment', label: 'Entertainment', icon: <Film className="h-4 w-4" />, color: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/40' },
  { id: 'Misc', label: 'Miscellaneous', icon: <Sparkles className="h-4 w-4" />, color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/40' },
];

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: 'Card', label: 'Card', icon: <CreditCard className="h-3.5 w-3.5" /> },
  { id: 'Cash', label: 'Cash', icon: <Banknote className="h-3.5 w-3.5" /> },
  { id: 'UPI/Online', label: 'UPI / Online', icon: <Smartphone className="h-3.5 w-3.5" /> },
];

const PRESETS = [5, 10, 20, 50];

// Format date into local input string: YYYY-MM-DDTHH:mm
const formatToLocalDateTimeString = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function QuickAddExpenseModal({
  isOpen,
  onClose,
  user,
  onExpenseAdded,
}: QuickAddExpenseModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Card');
  const [note, setNote] = useState<string>('');
  
  // Auto-fetch present date and time feature state
  const [isAutoTime, setIsAutoTime] = useState<boolean>(true);
  const [presentTime, setPresentTime] = useState<Date>(new Date());
  const [spentAt, setSpentAt] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Initialize and auto-fetch present date & time when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setCategory('Food');
      setPaymentMethod('Card');
      setNote('');
      setIsAutoTime(true);
      const now = new Date();
      setPresentTime(now);
      setSpentAt(formatToLocalDateTimeString(now));
    }
  }, [isOpen]);

  // Live real-time clock tick while auto-fetch is active
  useEffect(() => {
    if (!isOpen || !isAutoTime) return;
    const timer = setInterval(() => {
      const now = new Date();
      setPresentTime(now);
      setSpentAt(formatToLocalDateTimeString(now));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isAutoTime]);

  if (!isOpen) return null;

  const handlePresetAdd = (preset: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + preset).toFixed(2));
  };

  const handleFetchPresentTime = () => {
    const now = new Date();
    setPresentTime(now);
    setSpentAt(formatToLocalDateTimeString(now));
    setIsAutoTime(true);
    toast.success('Fetched present date & time', { duration: 1500 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid expense amount greater than 0');
      return;
    }

    // Automatically fetch present date & time at submission moment if in auto mode
    const finalSpentAt = isAutoTime 
      ? new Date().toISOString() 
      : (spentAt ? new Date(spentAt).toISOString() : new Date().toISOString());

    try {
      setLoading(true);
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          category,
          payment_method: paymentMethod,
          note: note.trim() || null,
          spent_at: finalSpentAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to log expense');
      }

      // Play audio cues based on urgency tier
      if (data.summary.urgency === 'over_budget') {
        sounds.playOverBudget();
      } else if (data.summary.urgency === 'warning') {
        sounds.playWarning();
      } else {
        sounds.playNormalAdd();
      }

      // Trigger immediate toast notification
      const addedFmt = formatCurrency(numAmount, user.currency);
      const totalFmt = formatCurrency(data.summary.todaySpent, user.currency);
      const remainingFmt = formatCurrency(Math.max(0, data.summary.remainingLimit), user.currency);
      const excessFmt = formatCurrency(data.summary.excessAmount, user.currency);

      if (data.summary.urgency === 'over_budget') {
        toast.error(`Daily budget exceeded by ${excessFmt}!`, {
          description: `Added ${addedFmt}. You've spent ${totalFmt} today (${data.summary.percentageConsumed}%).`,
          icon: <AlertOctagon className="h-5 w-5 text-rose-400" />,
          duration: 6000,
        });
      } else if (data.summary.urgency === 'warning') {
        toast.warning(`Approaching your daily limit!`, {
          description: `Added ${addedFmt}. You've spent ${totalFmt} today. Remaining limit: ${remainingFmt} (${data.summary.percentageConsumed}% consumed).`,
          icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
          duration: 5000,
        });
      } else {
        toast.success(`Expense Recorded`, {
          description: `Added ${addedFmt}. You've spent ${totalFmt} today. Remaining limit: ${remainingFmt}.`,
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
          duration: 4000,
        });
      }

      // Notify parent
      onExpenseAdded(data);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
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
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b dark:border-white/10 border-slate-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
              Immediate Tracking
            </span>
            <h3 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
              Log Daily Expense
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Amount ({user.currency})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                {user.currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl dark:bg-black bg-slate-50 border dark:border-white/15 border-slate-200 text-2xl sm:text-3xl font-black dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 mt-2.5">
              <span className="text-[11px] text-slate-500">Quick Add:</span>
              <div className="flex gap-1.5 flex-wrap">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetAdd(preset)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 transition-all"
                  >
                    +{user.currency}{preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? `bg-gradient-to-r ${cat.color} font-semibold ring-1 ring-white/20 shadow-sm`
                        : 'dark:bg-slate-900/50 bg-slate-50 dark:border-white/5 border-slate-200 dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {cat.icon}
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-semibold shadow-sm'
                        : 'dark:bg-slate-900/50 bg-slate-50 dark:border-white/5 border-slate-200 dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {pm.icon}
                    <span>{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Note & Present Date / Time Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Groceries, Coffee, Gas"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={100}
                className="w-full px-3.5 py-2.5 rounded-xl dark:bg-black/60 bg-slate-50 border dark:border-white/10 border-slate-200 text-xs dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold dark:text-slate-300 text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Date & Time
                </label>

                {/* Auto Present toggle button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isAutoTime) {
                      setIsAutoTime(false);
                    } else {
                      handleFetchPresentTime();
                    }
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all ${
                    isAutoTime
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/25'
                      : 'dark:bg-zinc-800 bg-slate-200 border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={isAutoTime ? 'Click to choose a custom date/time' : 'Click to auto-fetch current date and time'}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isAutoTime ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                  {isAutoTime ? 'Auto Present' : 'Custom'}
                </button>
              </div>

              {isAutoTime ? (
                /* Auto-Fetch Present Date & Time Box */
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 px-3 py-2 rounded-xl dark:bg-black/60 bg-emerald-50/50 border border-emerald-500/30 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="font-mono text-[11px] font-bold dark:text-slate-100 text-slate-800 truncate">
                        {presentTime.toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        })}
                      </span>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 shrink-0 ml-1">
                      Live Now
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleFetchPresentTime}
                    className="p-2 rounded-xl dark:bg-zinc-900 bg-slate-100 hover:bg-slate-200 dark:hover:bg-zinc-800 border dark:border-white/10 border-slate-200 text-slate-500 hover:text-emerald-500 transition-colors shrink-0"
                    title="Re-sync current moment"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
                  </button>
                </div>
              ) : (
                /* Manual Custom Date-Time Picker with Instant 'Set to Now' button */
                <div className="flex items-center gap-1.5">
                  <input
                    type="datetime-local"
                    value={spentAt}
                    onChange={(e) => {
                      setSpentAt(e.target.value);
                      setIsAutoTime(false);
                    }}
                    className="flex-1 px-3 py-2 rounded-xl dark:bg-black/60 bg-slate-50 border dark:border-white/10 border-slate-200 text-xs dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleFetchPresentTime}
                    className="px-2.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 shrink-0"
                    title="Reset to present date and time"
                  >
                    <Zap className="h-3 w-3" />
                    Now
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span>
                  {isAutoTime ? 'Auto-records exact moment of submission' : 'Manual timestamp override'}
                </span>
                {isAutoTime ? (
                  <button
                    type="button"
                    onClick={() => setIsAutoTime(false)}
                    className="text-indigo-500 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Pick custom date
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFetchPresentTime}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    Use live current time
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              {loading ? 'Recording...' : 'Add Expense & Check Limit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
