// src/pages/FeaturePaywall.jsx
import React from 'react';
import { Check, Lock, Zap, Building2, Star, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/UI';

// ─── PLAN MATRIX ──────────────────────────────────────────────────────────────
const PLANS = [
  {
    tier: 'free',
    name: 'Free',
    price: '0',
    icon: Star,
    color: 'border-slate-200 dark:border-slate-700',
    headerBg: 'bg-slate-50 dark:bg-slate-800',
    iconBg: 'bg-slate-100 dark:bg-slate-700',
    iconColor: 'text-slate-600 dark:text-slate-300',
    badgeBg: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    btnClass: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-default',
    btnLabel: 'Current Plan',
    features: [
      { label: 'Appointments & Calendar', included: true },
      { label: 'Client CRM', included: true },
      { label: 'Journal (10 entries/mo)', included: true },
      { label: 'Basic Invoice Generation', included: true },
      { label: 'Mileage Log', included: true },
      { label: 'Compliance Tracker', included: true },
      { label: 'Signer Portal', included: false },
      { label: 'AI Trainer', included: false },
      { label: 'Team Dispatch', included: false },
      { label: 'Admin Control Center', included: false },
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: '29',
    icon: Zap,
    color: 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/30',
    headerBg: 'bg-gradient-to-br from-blue-600 to-indigo-700',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/30',
    btnLabel: 'Upgrade to Pro',
    badge: 'Most Popular',
    features: [
      { label: 'Everything in Free', included: true },
      { label: 'Unlimited Journal Entries', included: true },
      { label: 'Signer Portal', included: true },
      { label: 'AI Trainer (State Copilot)', included: true },
      { label: 'Invoice Automation', included: true },
      { label: 'Cross-module Linking', included: true },
      { label: 'Priority Email Support', included: true },
      { label: 'Team Dispatch', included: false },
      { label: 'Multi-notary Management', included: false },
      { label: 'Admin Control Center', included: false },
    ],
  },
  {
    tier: 'agency',
    name: 'Agency',
    price: '79',
    icon: Building2,
    color: 'border-purple-400 dark:border-purple-500',
    headerBg: 'bg-gradient-to-br from-purple-700 to-fuchsia-800',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    btnClass: 'bg-purple-700 hover:bg-purple-600 text-white shadow-md shadow-purple-500/30',
    btnLabel: 'Upgrade to Agency',
    features: [
      { label: 'Everything in Pro', included: true },
      { label: 'Team Dispatch & Routing', included: true },
      { label: 'Multi-notary Management', included: true },
      { label: 'SLA Tracking & Dispatch Queue', included: true },
      { label: 'Region/ZIP Coverage Controls', included: true },
      { label: 'Admin Control Center', included: true },
      { label: 'State Policy Database', included: true },
      { label: 'AI Knowledge Publishing', included: true },
      { label: 'Audit Log & Governance', included: true },
      { label: 'Dedicated Account Manager', included: true },
    ],
  },
];

// Feature-specific teaser content
const FEATURE_TEASERS = {
  signerPortal: {
    headline: 'Give signers a premium experience',
    bullets: ['Secure document portal', 'Real-time task checklists', 'Messaging thread', 'Auto-status visibility'],
    requiredTier: 'pro',
  },
  aiTrainer: {
    headline: 'Know every state rule cold',
    bullets: ['State-by-state compliance Q&A', 'Fee schedule lookup', 'ID requirement guidance', 'Grounded citations'],
    requiredTier: 'pro',
  },
  teamDispatch: {
    headline: 'Run a full notary operation',
    bullets: ['Multi-notary Kanban board', 'ZIP-based routing', 'SLA countdown timers', 'Internal notes per job'],
    requiredTier: 'agency',
  },
};

const FeaturePaywall = ({ badge = 'PRO FEATURE', title = 'Premium Feature', description, featureKey }) => {
  const navigate = useNavigate();
  const teaser = featureKey ? FEATURE_TEASERS[featureKey] : null;
  const requiredTier = teaser?.requiredTier || (badge.toLowerCase().includes('agency') ? 'agency' : 'pro');

  return (
    <div className="space-y-8 pb-10">
      {/* Hero */}
      <Card className="app-hero-card">
        <CardContent className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold text-slate-200 mb-3">
              <Lock className="h-3 w-3" /> {badge}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {description && <p className="mt-2 text-slate-300 text-sm max-w-lg">{description}</p>}
          </div>
          {teaser && (
            <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm min-w-[200px]">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">{teaser.headline}</p>
              <ul className="space-y-2">
                {teaser.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-slate-200">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />{b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan grid */}
      <div className="mx-auto max-w-5xl">
        <p className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Unlock <strong className="text-slate-700 dark:text-slate-200">{title}</strong> and more by upgrading your plan.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const PlanIcon = plan.icon;
            const isRequired = plan.tier === requiredTier || (requiredTier === 'pro' && plan.tier === 'agency');
            return (
              <div key={plan.tier}
                className={`rounded-2xl border-2 overflow-hidden shadow-lg transition-transform hover:-translate-y-0.5 ${plan.color} ${isRequired ? 'shadow-xl' : ''}`}>
                {/* Plan header */}
                <div className={`px-6 pt-6 pb-5 ${plan.headerBg}`}>
                  {plan.badge && (
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">
                      <Star className="h-3 w-3" /> {plan.badge}
                    </div>
                  )}
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${plan.iconBg}`}>
                    <PlanIcon className={`h-5 w-5 ${plan.iconColor}`} />
                  </div>
                  <h3 className={`text-xl font-bold ${plan.tier === 'free' ? 'text-slate-900 dark:text-white' : 'text-white'}`}>{plan.name}</h3>
                  <div className={`mt-1 flex items-baseline gap-1 ${plan.tier === 'free' ? 'text-slate-700 dark:text-slate-300' : 'text-white'}`}>
                    <span className="text-3xl font-extrabold">${plan.price}</span>
                    <span className="text-sm opacity-75">/mo</span>
                  </div>
                </div>

                {/* Features */}
                <div className="p-5 bg-white dark:bg-slate-800 space-y-2.5">
                  {plan.features.map((feat) => (
                    <div key={feat.label} className="flex items-center gap-2.5">
                      {feat.included
                        ? <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        : <X className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />}
                      <span className={`text-sm ${feat.included ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500 line-through'}`}>
                        {feat.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="px-5 pb-5 bg-white dark:bg-slate-800">
                  <button
                    onClick={() => plan.tier !== 'free' && navigate('/settings')}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${plan.btnClass}`}
                  >
                    {plan.tier !== 'free' && <ArrowRight className="h-4 w-4" />}
                    {plan.btnLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeaturePaywall;
