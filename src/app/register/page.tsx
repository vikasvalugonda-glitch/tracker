'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Wallet, 
  Lock, 
  Mail, 
  ArrowRight, 
  Check, 
  X, 
  Layers, 
  DollarSign 
} from 'lucide-react';
import { toast } from 'sonner';

const CURRENCIES = ['$', '€', '£', '₹', '¥', '₩', 'C$'];

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dailyLimit, setDailyLimit] = useState('50.00');
  const [currency, setCurrency] = useState('$');
  const [rolloverUnused, setRolloverUnused] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasNumber && hasSymbol;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required');
      return;
    }
    if (!isPasswordValid) {
      toast.error('Please fulfill all password security requirements');
      return;
    }

    const limitNum = parseFloat(dailyLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      toast.error('Please enter a valid daily budget');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          daily_limit: limitNum,
          currency,
          rollover_unused: rolloverUnused,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      toast.success('Account created successfully!');
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090d16] relative overflow-hidden py-12">
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl glass-panel p-8 sm:p-10 border border-white/10 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-500 p-0.5 shadow-lg shadow-emerald-500/20 mb-3">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Wallet className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Create SpendPulse Account
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Setup your daily spending limit and secure your finances
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Live Password Complexity Checklist */}
            <div className="mt-2.5 p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1 text-xs">
              <div className="flex items-center gap-2">
                {hasMinLength ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <X className="h-3.5 w-3.5 text-slate-500" />
                )}
                <span className={hasMinLength ? 'text-emerald-300' : 'text-slate-400'}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasNumber ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <X className="h-3.5 w-3.5 text-slate-500" />
                )}
                <span className={hasNumber ? 'text-emerald-300' : 'text-slate-400'}>
                  At least one number (0-9)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasSymbol ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <X className="h-3.5 w-3.5 text-slate-500" />
                )}
                <span className={hasSymbol ? 'text-emerald-300' : 'text-slate-400'}>
                  At least one special symbol (!@#$%^&*)
                </span>
              </div>
            </div>
          </div>

          {/* Initial Budget Setup */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Daily Limit
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rollover Toggle */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Rollover unspent daily budget</span>
            </div>
            <input
              type="checkbox"
              checked={rolloverUnused}
              onChange={(e) => setRolloverUnused(e.target.checked)}
              className="h-4 w-4 rounded bg-slate-800 border-white/20 text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid}
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Creating Account...' : 'Get Started Free'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
