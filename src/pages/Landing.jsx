import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Sparkles,
  BadgeCheck,
  Bot,
  Clock3,
  AlertTriangle,
  XCircle,
  Wallet,
  CalendarCheck,
  FileCheck2,
  Car,
  Building2,
  Users,
  ArrowRight,
  Check,
  ChevronDown,
} from 'lucide-react';

const topLinks = ['Features', 'How it works', 'Pricing', 'FAQ'];

const painPoints = [
  {
    title: 'Lost Invoices',
    description: 'Tracking payments in Excel or paper logs leads to missed revenue.',
    icon: XCircle,
  },
  {
    title: 'Compliance Risks',
    description: 'Guessing fees or ID rules can cost you your commission.',
    icon: AlertTriangle,
  },
  {
    title: 'Admin Overload',
    description: 'Spending hours manually entering journal data after every signing.',
    icon: Clock3,
  },
];

const steps = [
  {
    step: 'STEP 1',
    title: 'Book the Job',
    description: 'Capture client info quickly with Smart Fill and appointment templates.',
    icon: CalendarCheck,
  },
  {
    step: 'STEP 2',
    title: 'Do the Signing',
    description: 'Use Mobile Journal flow for ID capture, proof, and compliant on-site execution.',
    icon: FileCheck2,
  },
  {
    step: 'STEP 3',
    title: 'Get Paid',
    description: 'Auto-generate invoices, track payment status, and close the loop instantly.',
    icon: Wallet,
  },
];

const businessModels = [
  {
    title: 'Mobile Notaries',
    description: 'Run route-based signings, capture compliant entries on-site, and complete admin later from desktop.',
    icon: Car,
  },
  {
    title: 'Loan Signing Agents',
    description: 'Manage high-volume closings with reliable documentation, invoicing, and audit-ready workflows.',
    icon: Building2,
  },
  {
    title: 'Signing Agencies',
    description: 'Coordinate team dispatch, centralize records, and scale with standardized processes.',
    icon: Users,
  },
];

const pricingTiers = [
  {
    name: 'Starter',
    price: '$29',
    subtitle: 'Best for solo notaries getting organized',
    features: ['Up to 30 appointments/month', 'Basic invoicing + payment tracking', 'Mileage and expense logs'],
    cta: 'Start Starter',
  },
  {
    name: 'Pro',
    price: '$79',
    subtitle: 'For high-volume LSAs and growing operators',
    features: ['Unlimited appointments', 'AI compliance coach + workflow tools', 'Advanced revenue dashboard + exports'],
    cta: 'Start Pro',
    highlighted: true,
  },
  {
    name: 'Agency',
    price: '$199',
    subtitle: 'For teams, dispatching, and shared operations',
    features: ['Multi-user team workspace', 'Centralized records and controls', 'Priority support + onboarding'],
    cta: 'Contact Sales',
  },
];

const faqItems = [
  {
    question: 'Can I switch plans later?',
    answer: 'Yes. You can upgrade or downgrade anytime and your data stays intact.',
  },
  {
    question: 'Does NotaryOS support all 50 states?',
    answer: 'Yes. Compliance prompts and guardrails are designed for 50-state notary workflows.',
  },
  {
    question: 'Do you offer a free trial?',
    answer: 'Yes. Every plan starts with a free trial so you can test your full workflow before committing.',
  },
  {
    question: 'Can agencies manage multiple notaries?',
    answer: 'Yes. The Agency plan includes multi-user access, shared records, and dispatch-friendly operations.',
  },
];

const Landing = () => {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="min-h-screen bg-[#08152f] text-white">
      <div className="border-b border-white/10 bg-[#050e20]">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-blue-500 font-bold text-[#041026]">
              N
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">NotaryOS</p>
              <p className="text-[11px] text-slate-300">Notary AI Agent</p>
            </div>
          </div>

          <div className="hidden items-center gap-6 text-sm text-slate-200 md:flex">
            {topLinks.map((item) => (
              <a
                key={item}
                href={item === 'Pricing' ? '#pricing' : item === 'FAQ' ? '#faq' : '#'}
                className="transition hover:text-white"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-md border border-slate-400/70 px-3 py-1.5 text-sm font-medium text-slate-100 hover:border-white">
              Take a tour
            </button>
            <Link
              to="/dashboard"
              className="rounded-md bg-gradient-to-r from-teal-400 to-cyan-500 px-3.5 py-1.5 text-sm font-semibold text-[#021128] shadow-lg shadow-cyan-500/20"
            >
              Get started
            </Link>
          </div>
        </nav>
      </div>

      <section className="mx-auto max-w-6xl px-6 pb-14 pt-8">
        <div className="mb-16 flex justify-end">
          <Link to="/auth" className="rounded-md border border-slate-500 px-4 py-1.5 text-sm text-slate-100">
            Log In
          </Link>
        </div>

        <div className="text-center">
          <h1 className="text-5xl font-black leading-tight md:text-7xl">
            Drowning in paperwork?
            <br />
            <span className="bg-gradient-to-r from-teal-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Chasing payments?
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-200 md:text-lg">
            Stop worrying about state compliance. NotaryOS handles it all—so you can focus on signings, not spreadsheets.
          </p>
          <button className="mt-8 rounded-lg bg-gradient-to-r from-teal-400 to-cyan-500 px-8 py-4 text-base font-bold text-[#041026] shadow-xl shadow-cyan-400/25">
            Start Free Trial
          </button>
        </div>

        <div className="mt-14 grid gap-4 rounded-xl border border-slate-300/70 px-4 py-3 text-sm md:grid-cols-3 md:px-8">
          <div className="flex items-center justify-center gap-2 text-slate-100">
            <ShieldCheck className="h-4 w-4 text-teal-300" /> 100% Local Privacy
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-100">
            <Sparkles className="h-4 w-4 text-blue-300" /> Powered by Advanced AI
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-100">
            <BadgeCheck className="h-4 w-4 text-emerald-300" /> 50-State Compliant
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0c1c3a] py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-2">
          <div>
            <span className="rounded-full border border-cyan-300/40 px-3 py-1 text-xs font-semibold text-cyan-300">
              NEW: AI COMPLIANCE COACH
            </span>
            <h2 className="mt-5 text-4xl font-extrabold leading-tight">
              Your personal compliance expert, <span className="text-cyan-400">available 24/7.</span>
            </h2>
            <p className="mt-4 max-w-xl text-slate-300">
              Not just software—it&apos;s a mentor. Get instant answers to state-specific questions, fee limits, and ID
              rules without searching through a 100-page handbook.
            </p>

            <div className="mt-7 flex items-center gap-2 rounded-lg border border-slate-500 bg-[#11254a] p-2">
              <input
                className="w-full bg-transparent px-3 text-sm text-slate-200 outline-none"
                value="e.g. What's the fee for a jurat in California?"
                readOnly
              />
              <button className="rounded-md bg-gradient-to-r from-teal-400 to-cyan-500 px-4 py-2 text-xs font-bold text-[#03152d]">
                Ask AI
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-400/70 bg-[#10203f] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-400/20">
                <Bot className="h-5 w-5 text-teal-300" />
              </div>
              <div>
                <p className="font-semibold">NotaryOS AI</p>
                <p className="text-xs text-emerald-300">● Online Now</p>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <div className="max-w-xs rounded-xl bg-blue-600 px-4 py-2 text-sm">What&apos;s the fee for a jurat in California?</div>
            </div>
            <div className="mt-4 max-w-sm rounded-xl border border-slate-400 bg-white/10 px-4 py-3 text-sm text-slate-100">
              That depends on your state laws. For California, the maximum fee for a jurat is $15 per signature,
              including the oath or affirmation.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-2">
        <div>
          <h3 className="text-4xl font-extrabold">Before &amp; After</h3>
          <div className="mt-4 inline-flex rounded-lg border border-slate-500 p-1 text-sm">
            <span className="rounded-md bg-rose-500/20 px-4 py-1 text-rose-300">The Old Way</span>
            <span className="px-4 py-1 text-slate-300">With NotaryOS</span>
          </div>

          <div className="mt-6 space-y-3">
            {painPoints.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-xl border border-slate-500 bg-[#102142] p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-rose-500/20 p-2">
                    <Icon className="h-4 w-4 text-rose-300" />
                  </div>
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="text-sm text-slate-300">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-400/70 bg-[#0b1a37] p-6">
          <h4 className="text-center text-2xl font-bold">Calculate Your Lost Time</h4>
          <div className="mt-8 space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                <span>WEEKLY APPOINTMENTS</span>
                <span className="text-cyan-300">5</span>
              </div>
              <div className="h-1.5 rounded bg-slate-700">
                <div className="h-1.5 w-1/4 rounded bg-cyan-400" />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                <span>ADMIN MINS PER APPT</span>
                <span className="text-cyan-300">20 min</span>
              </div>
              <div className="h-1.5 rounded bg-slate-700">
                <div className="h-1.5 w-1/3 rounded bg-cyan-400" />
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-300">You could save</p>
            <p className="text-5xl font-black text-white">
              87 Hours<span className="text-lg text-slate-300">/yr</span>
            </p>
            <p className="mx-auto mt-3 inline-flex rounded-full border border-emerald-400/60 px-3 py-1 text-xs text-emerald-300">
              That&apos;s $4,350 in billable time!
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#091630] py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
          <div className="relative flex min-h-[320px] items-center justify-center">
            <div className="absolute left-10 top-3 h-72 w-44 -rotate-12 rounded-[30px] border-2 border-slate-700 bg-slate-100 p-4 text-slate-900 shadow-2xl">
              <p className="mb-3 text-sm font-bold">Today&apos;s Route</p>
              <div className="space-y-2 text-xs">
                <div className="rounded-lg border border-slate-300 p-2">
                  <p className="font-semibold">Sarah Johnson</p>
                  <p className="text-slate-500">123 Maple St, Seattle</p>
                </div>
                <div className="rounded-lg border border-slate-300 p-2">
                  <p className="font-semibold">Mike Chen</p>
                  <p className="text-slate-500">987 Oak Ave</p>
                </div>
              </div>
            </div>
            <div className="absolute right-8 top-0 h-72 w-44 rotate-12 rounded-[30px] border-2 border-slate-700 bg-slate-100 p-4 text-slate-900 shadow-2xl">
              <p className="mb-3 text-sm font-bold">Payments</p>
              <p className="text-3xl font-black">$3,420</p>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-lg border border-slate-300 p-2">
                  <span>Invoice #2948</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Paid</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-300 p-2">
                  <span>Invoice #2951</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">Pending</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-5xl font-extrabold leading-tight">Run your business from your pocket.</h3>
            <p className="mt-4 max-w-xl text-slate-300">
              From booking to signature capture to final payout, NotaryOS mirrors how real mobile appointments happen.
              Start with your daily schedule, complete ID/journal checks at the table, then send and track payment
              before you drive to the next stop.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-200">
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">1</span>
                Confirm today&apos;s route and appointment details
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">2</span>
                Capture signer details and journal proof on site
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">3</span>
                Send invoice and track paid/pending status instantly
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h2 className="text-5xl font-extrabold">How NotaryOS works</h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          A streamlined workflow from booking to payout—designed for mobile-first notaries.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map(({ step, title, description, icon: Icon }) => (
            <div key={title} className="rounded-xl border border-slate-600 bg-[#122444] p-6 text-left">
              <p className="text-xs font-bold tracking-wide text-teal-300">{step}</p>
              <div className="mt-3 flex items-center gap-3">
                <Icon className="h-5 w-5 text-cyan-300" />
                <p className="text-2xl font-bold">{title}</p>
              </div>
              <p className="mt-3 text-sm text-slate-300">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#050d22] py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-5xl font-extrabold leading-tight">Built for every modern notary business model</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {businessModels.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-xl border border-slate-700 bg-[#0f1b36] p-6 text-left">
                <div className="inline-flex rounded-lg bg-cyan-500/20 p-2">
                  <Icon className="h-5 w-5 text-cyan-300" />
                </div>
                <p className="mt-4 text-2xl font-bold">{title}</p>
                <p className="mt-2 text-sm text-slate-300">{description}</p>
              </div>
            ))}
          </div>
          <Link
            to="/dashboard"
            className="mx-auto mt-12 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-400 to-cyan-500 px-6 py-3 font-bold text-[#03152d]"
          >
            Start Free Trial <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section id="pricing" className="border-y border-white/10 bg-[#07122a] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-5xl font-extrabold">Simple pricing that scales with you</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-300">
            Pick the plan that matches your stage now, then upgrade as your notary business grows.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border p-6 text-left ${
                  tier.highlighted
                    ? 'border-cyan-300 bg-[#10284f] shadow-lg shadow-cyan-500/20'
                    : 'border-slate-700 bg-[#0d1d3c]'
                }`}
              >
                <p className="text-2xl font-bold">{tier.name}</p>
                <p className="mt-2 text-5xl font-black">
                  {tier.price}
                  <span className="text-base font-medium text-slate-300">/mo</span>
                </p>
                <p className="mt-3 text-sm text-slate-300">{tier.subtitle}</p>

                <ul className="mt-6 space-y-3 text-sm">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-slate-200">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`mt-8 w-full rounded-lg px-4 py-3 text-sm font-bold ${
                    tier.highlighted
                      ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-[#03152d]'
                      : 'border border-slate-500 text-slate-100 hover:border-slate-300'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-center text-5xl font-extrabold">FAQ</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-300">
          Quick answers to common questions before you start your trial.
        </p>

        <div className="mt-10 space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={item.question} className="rounded-xl border border-slate-600 bg-[#0d1d3c]">
                <button
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold">{item.question}</span>
                  <ChevronDown className={`h-5 w-5 text-slate-300 transition ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && <div className="px-5 pb-5 text-sm text-slate-300">{item.answer}</div>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Landing;
