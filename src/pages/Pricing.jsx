import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    monthly: 0,
    annual: 0,
    subtitle: 'For occasional signings and solo workflows.',
    cta: 'Get Started',
    features: {
      'Appointments/month': '5',
      'AI Compliance Coach': false,
      'Cloud Sync': false,
      'Team Members': '1',
      'Mileage Tracking': true,
      'Advanced Reporting': false,
      'White-label Portal': false,
      'Priority Support': false,
    },
  },
  {
    name: 'Pro',
    monthly: 19,
    annual: 15,
    subtitle: 'For full-time notaries who need automation.',
    cta: 'Start Free Trial',
    popular: true,
    features: {
      'Appointments/month': 'Unlimited',
      'AI Compliance Coach': true,
      'Cloud Sync': true,
      'Team Members': '1',
      'Mileage Tracking': true,
      'Advanced Reporting': true,
      'White-label Portal': false,
      'Priority Support': true,
    },
  },
  {
    name: 'Agency',
    monthly: 49,
    annual: 39,
    subtitle: 'For teams coordinating mobile notaries at scale.',
    cta: 'Start Agency Trial',
    features: {
      'Appointments/month': 'Unlimited',
      'AI Compliance Coach': true,
      'Cloud Sync': true,
      'Team Members': 'Up to 10',
      'Mileage Tracking': true,
      'Advanced Reporting': true,
      'White-label Portal': true,
      'Priority Support': true,
    },
  },
  {
    name: 'Fortune 500',
    monthly: null,
    annual: null,
    subtitle: 'Enterprise controls, SSO, custom security and procurement.',
    cta: 'Contact Sales',
    enterprise: true,
    features: {
      'Appointments/month': 'Custom volume',
      'AI Compliance Coach': true,
      'Cloud Sync': true,
      'Team Members': 'Unlimited',
      'Mileage Tracking': true,
      'Advanced Reporting': true,
      'White-label Portal': true,
      'Priority Support': 'Dedicated CSM',
    },
  },
];

const featureRows = Object.keys(plans[0].features);

const Pricing = () => {
  const [billing, setBilling] = useState('monthly');
  const [showModal, setShowModal] = useState(false);
  const [salesForm, setSalesForm] = useState({
    name: '',
    company: '',
    email: '',
    teamSize: '',
    notes: '',
  });

  const annualSavings = useMemo(() => (19 - 15) * 12, []);

  const salesMailto = useMemo(() => {
    const subject = encodeURIComponent(`Enterprise pricing inquiry - ${salesForm.company || 'NotaryOS'}`);
    const body = encodeURIComponent([
      'Hi NotaryOS Sales,',
      '',
      `Name: ${salesForm.name}`,
      `Company: ${salesForm.company}`,
      `Email: ${salesForm.email}`,
      `Team size: ${salesForm.teamSize}`,
      `Notes: ${salesForm.notes}`,
      '',
      'I am interested in the Fortune 500 plan and would like a custom quote.',
    ].join('\n'));
    return `mailto:sales@notaryos.com?subject=${subject}&body=${body}`;
  }, [salesForm]);

  const updateField = (field, value) => setSalesForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-[#08152f] text-white">
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Pricing</p>
            <h1 className="mt-2 text-4xl font-black md:text-6xl">Choose the plan that scales with you.</h1>
            <p className="mt-3 max-w-2xl text-slate-300">Transparent pricing for solo notaries, growing agencies, and enterprise teams.</p>
          </div>
          <Link to="/" className="rounded-md border border-slate-500 px-4 py-2 text-sm text-slate-100">Back to Landing</Link>
        </div>

        <div className="mt-8 inline-flex rounded-xl border border-slate-500 p-1">
          <button onClick={() => setBilling('monthly')} className={`rounded-lg px-5 py-2 text-sm ${billing === 'monthly' ? 'bg-slate-600' : ''}`}>Monthly</button>
          <button onClick={() => setBilling('annual')} className={`rounded-lg px-5 py-2 text-sm ${billing === 'annual' ? 'bg-slate-600' : ''}`}>Annual</button>
        </div>
        <p className="mt-3 text-sm text-emerald-300">Annual billing saves up to ${annualSavings}/year on Pro.</p>

        <div className="mt-8 grid gap-5 lg:grid-cols-4">
          {plans.map((plan) => {
            const price = billing === 'monthly' ? plan.monthly : plan.annual;
            return (
              <div key={plan.name} className={`rounded-2xl border p-6 ${plan.popular ? 'border-cyan-300 bg-[#041432]' : 'border-slate-600 bg-[#102142]'}`}>
                {plan.popular && <p className="mb-3 inline-flex rounded-full bg-cyan-400/20 px-2 py-1 text-xs font-semibold text-cyan-300">Most Popular</p>}
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="mt-2 min-h-[48px] text-sm text-slate-300">{plan.subtitle}</p>
                <p className="mt-5 text-4xl font-black">
                  {price === null ? 'Custom' : `$${price}`}
                  {price !== null && <span className="ml-1 text-sm font-normal text-slate-300">/mo</span>}
                </p>
                <button
                  onClick={() => (plan.enterprise ? setShowModal(true) : null)}
                  className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-bold ${plan.popular ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-[#03152d]' : 'border border-slate-300 text-slate-100'}`}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-12 overflow-x-auto rounded-xl border border-slate-500 bg-[#0d1d3c]">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-700 text-slate-200">
              <tr>
                <th className="px-4 py-3">Features</th>
                {plans.map((p) => <th key={p.name} className="px-4 py-3">{p.name}</th>)}
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {featureRows.map((feature) => (
                <tr key={feature} className="border-b border-slate-800 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-slate-200">{feature}</td>
                  {plans.map((p) => {
                    const value = p.features[feature];
                    return (
                      <td key={`${p.name}-${feature}`} className="px-4 py-3">
                        {value === true ? <Check className="h-4 w-4 text-emerald-300" /> : value === false ? <X className="h-4 w-4 text-rose-300" /> : value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-600 bg-[#0d1f41] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Contact Sales</h2>
              <button onClick={() => setShowModal(false)} className="rounded border border-slate-500 px-2 py-1 text-xs">Close</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="rounded bg-[#12274b] px-3 py-2 text-sm" placeholder="Name" value={salesForm.name} onChange={(e) => updateField('name', e.target.value)} />
              <input className="rounded bg-[#12274b] px-3 py-2 text-sm" placeholder="Company" value={salesForm.company} onChange={(e) => updateField('company', e.target.value)} />
              <input className="rounded bg-[#12274b] px-3 py-2 text-sm" placeholder="Work email" value={salesForm.email} onChange={(e) => updateField('email', e.target.value)} />
              <input className="rounded bg-[#12274b] px-3 py-2 text-sm" placeholder="Team size" value={salesForm.teamSize} onChange={(e) => updateField('teamSize', e.target.value)} />
              <textarea className="sm:col-span-2 rounded bg-[#12274b] px-3 py-2 text-sm" placeholder="Anything we should know?" value={salesForm.notes} onChange={(e) => updateField('notes', e.target.value)} />
            </div>
            <a href={salesMailto} className="mt-5 inline-flex rounded-lg bg-gradient-to-r from-teal-400 to-cyan-500 px-5 py-2.5 text-sm font-bold text-[#03152d]">
              Generate Email to Sales
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;
