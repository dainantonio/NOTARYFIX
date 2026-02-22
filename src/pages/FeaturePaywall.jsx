import React from 'react';
import { Check, Lock } from 'lucide-react';
import { Card, CardContent, Button } from '../components/UI';

const FeaturePaywall = ({ badge = 'PRO FEATURE', title, description, cta = 'Upgrade for $19/mo' }) => {
  return (
    <div className="space-y-6 pb-10">
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
        <CardContent className="p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Paywall</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1>
        </CardContent>
      </Card>

      <Card className="mx-auto max-w-3xl border-slate-200">
        <CardContent className="space-y-6 p-10 text-center">
          <div className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{badge}</div>
          <h2 className="text-5xl font-semibold tracking-tight text-slate-900 dark:text-white">Unlock {title}</h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">{description}</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {['Premium workflows', 'Secure cloud sync', 'Priority support'].map((item) => (
              <div key={item} className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Check className="h-4 w-4 text-emerald-500" /> {item}
              </div>
            ))}
          </div>
          <Button className="mx-auto" size="lg"><Lock className="mr-2 h-4 w-4" /> {cta}</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeaturePaywall;
