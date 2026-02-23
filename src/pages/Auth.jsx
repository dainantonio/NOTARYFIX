import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
  Eye, EyeOff, ArrowRight, Shield, Zap, Building2,
  ChevronDown, ChevronUp, Wrench, FileSignature,
} from 'lucide-react';

// ─── DEV PROFILES ─────────────────────────────────────────────────────────────
const DEV_PROFILES = [
  { label: 'Free',   icon: '🆓', desc: 'Starter · owner',       settings: { planTier: 'free',   userRole: 'owner' } },
  { label: 'Pro',    icon: '⚡', desc: 'Pro · owner',            settings: { planTier: 'pro',    userRole: 'owner' } },
  { label: 'Agency', icon: '🏢', desc: 'Agency · owner',         settings: { planTier: 'agency', userRole: 'owner' } },
  { label: 'Admin',  icon: '🔐', desc: 'Agency · admin role',    settings: { planTier: 'agency', userRole: 'admin' } },
];

// ─── FEATURE HIGHLIGHTS (left panel) ─────────────────────────────────────────
const FEATURES = [
  { Icon: FileSignature, label: 'Compliant journal & signing workflow' },
  { Icon: Shield,        label: 'State-aware compliance engine'        },
  { Icon: Zap,           label: 'Auto invoicing & payment tracking'    },
  { Icon: Building2,     label: 'Team dispatch & signer portal'        },
];

export default function Auth() {
  const navigate = useNavigate();
  const { updateSettings } = useData();

  const [mode,        setMode]        = useState('login'); // 'login' | 'signup'
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [name,        setName]        = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [devOpen,     setDevOpen]     = useState(false);
  const [loading,     setLoading]     = useState(false);

  // ── submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (mode === 'signup') {
        updateSettings({ name, onboardingComplete: false });
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    }, 900);
  };

  // ── dev bypass ──────────────────────────────────────────────────────────────
  const signInAs = (profile) => {
    updateSettings({ ...profile.settings, onboardingComplete: true });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0a0e1a]">

      {/* ══ LEFT PANEL ══════════════════════════════════════════════════════ */}
      <div className="hidden md:flex md:w-[46%] lg:w-[52%] flex-col justify-between p-10 lg:p-14 relative overflow-hidden">
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0">
          {/* Deep gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d1528] via-[#0a0e1a] to-[#0d1528]" />
          {/* Radial glow */}
          <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-indigo-600/8 blur-[120px]" />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.035]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-600/30">
              N
            </div>
            <span className="text-lg font-bold tracking-tight text-white">NotaryOS</span>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400">
              Enterprise Notary Platform
            </p>
            <h2 className="text-4xl font-bold leading-tight tracking-tight text-white lg:text-5xl">
              Run your entire<br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                notary business
              </span><br />
              from one place.
            </h2>
          </div>

          <div className="space-y-4">
            {FEATURES.map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-sm text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust line */}
        <div className="relative z-10">
          <p className="text-xs text-slate-500">
            Trusted by notaries across 12 states · SOC 2 compliant · Data never sold
          </p>
        </div>
      </div>

      {/* ══ RIGHT PANEL — FORM ══════════════════════════════════════════════ */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 md:px-10 lg:px-16">

        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 md:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
            N
          </div>
          <span className="text-lg font-bold tracking-tight text-white">NotaryOS</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              {mode === 'login'
                ? 'Sign in to your NotaryOS account'
                : 'Start your free account — no credit card required'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="mb-6 flex rounded-xl border border-white/10 bg-white/5 p-1">
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Dain Antonio"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === 'login' && (
                <div className="mt-2 text-right">
                  <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 hover:shadow-blue-500/30 disabled:opacity-60 active:scale-[.98]"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-500">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Google SSO placeholder */}
          <button
            onClick={() => { updateSettings({ onboardingComplete: true }); navigate('/dashboard'); }}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 active:scale-[.98]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Footer links */}
          <p className="mt-6 text-center text-xs text-slate-500">
            By continuing, you agree to our{' '}
            <Link to="/legal" className="text-slate-400 hover:text-white transition-colors">Terms</Link>
            {' '}and{' '}
            <Link to="/legal" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
          </p>
        </div>

        {/* ── DEV BYPASS (collapsed drawer) ─────────────────────────────────── */}
        <div className="mt-10 w-full max-w-sm">
          <button onClick={() => setDevOpen(p => !p)}
            className="flex w-full items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-400 transition-colors hover:bg-amber-500/10">
            <span className="flex items-center gap-2">
              <Wrench className="h-3.5 w-3.5" /> Dev Testing
            </span>
            {devOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {devOpen && (
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-amber-500/10 bg-amber-500/5 p-3">
              {DEV_PROFILES.map(p => (
                <button key={p.label} onClick={() => signInAs(p)}
                  className="flex items-center gap-2 rounded-lg border border-amber-500/15 bg-black/20 px-3 py-2.5 text-left transition-colors hover:border-amber-500/30 hover:bg-amber-500/10">
                  <span className="text-base">{p.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-amber-300">{p.label}</p>
                    <p className="text-[10px] text-amber-500/70">{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
