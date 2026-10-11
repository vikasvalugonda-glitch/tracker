'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Wallet, 
  Mail, 
  Lock, 
  ArrowLeft, 
  ArrowRight, 
  KeyRound, 
  Check, 
  X, 
  Sparkles 
} from 'lucide-react';
import { toast } from 'sonner';

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [token, setToken] = useState(urlToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [simulatedToken, setSimulatedToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(Boolean(urlToken));

  useEffect(() => {
    if (urlToken) {
      setToken(urlToken);
      setIsResetMode(true);
    }
  }, [urlToken]);

  // Validation
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^a-zA-Z0-9]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasNumber && hasSymbol;

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request reset');
      }

      toast.success('Reset link issued!');
      if (data.simulatedToken) {
        setSimulatedToken(data.simulatedToken);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating token';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Reset token is required');
      return;
    }
    if (!isPasswordValid) {
      toast.error('Password does not fulfill security criteria');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      toast.success('Password updated! You can now log in.');
      router.push('/login');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl glass-panel p-8 sm:p-10 border border-white/10 shadow-2xl relative z-10">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-500 p-0.5 shadow-lg shadow-emerald-500/20 mb-3">
          <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <KeyRound className="h-6 w-6 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          {isResetMode ? 'Set New Password' : 'Reset Password'}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {isResetMode
            ? 'Enter your new secure password below'
            : 'Enter your registered email to receive a password reset token'}
        </p>
      </div>

      {!isResetMode ? (
        <form onSubmit={handleRequestToken} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Issuing...' : 'Generate Reset Token'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          {simulatedToken && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Sparkles className="h-4 w-4" />
                <span>Simulation Token Issued (Local Testing)</span>
              </div>
              <p className="text-xs text-slate-300 break-all font-mono bg-slate-950 p-2 rounded-lg">
                {simulatedToken}
              </p>
              <button
                type="button"
                onClick={() => {
                  setToken(simulatedToken);
                  setIsResetMode(true);
                }}
                className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Proceed to Set New Password Now
              </button>
            </div>
          )}
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Reset Token
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

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

          <button
            type="submit"
            disabled={loading || !isPasswordValid}
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
            <Check className="h-4 w-4" />
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to login</span>
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090d16] relative overflow-hidden py-12">
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <Suspense fallback={<div className="text-white text-xs">Loading...</div>}>
        <ForgotPasswordContent />
      </Suspense>
    </div>
  );
}
