import React, { useState } from 'react';
import { Button, Logo, Input } from '../components/UI';
import { Check } from 'lucide-react';

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 animate-fade-in">
        <div className="bg-white w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[550px]">
            <div className="bg-slate-950 p-10 md:w-80 flex flex-col justify-between text-white relative">
                <div className="relative z-10">
                    <Logo className="text-white mb-12 [&>span]:text-white" />
                    <div className="space-y-8">
                        {['Business Details', 'Compliance', 'Services'].map((label, i) => {
                            const stepNum = i + 1;
                            const isActive = step === stepNum;
                            const isCompleted = step > stepNum;
                            
                            return (
                                <div key={stepNum} className={`flex items-center gap-4 transition-all duration-300 ${isActive ? 'opacity-100 translate-x-2' : 'opacity-50'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${isCompleted || isActive ? 'bg-brand-600 border-brand-600' : 'border-white/30'}`}>
                                        {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                                    </div>
                                    <span className="font-medium tracking-wide text-sm uppercase">{label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex-1 p-10 md:p-14 flex flex-col">
                <div className="flex-1 max-w-lg">
                    {step === 1 && (
                        <div className="animate-fade-in">
                            <h2 className="text-3xl font-bold text-slate-900 mb-3">Setup your profile</h2>
                            <p className="text-slate-500 mb-8">We'll customize your dashboard based on your setup.</p>
                            <div className="space-y-6">
                                <Input label="Business Name" placeholder="e.g. Elite Notary Services" />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Zip Code" placeholder="90210" />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                                        <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                                            <option>California</option>
                                            <option>Texas</option>
                                            <option>Florida</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="animate-fade-in">
                            <h2 className="text-3xl font-bold text-slate-900 mb-3">Compliance Check</h2>
                            <p className="text-slate-500 mb-8">Verify your commission to unlock the digital journal.</p>
                            <div className="space-y-6">
                                <Input label="Commission Number" placeholder="1234567" />
                                <Input label="Expiration Date" type="date" />
                            </div>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="animate-fade-in">
                            <h2 className="text-3xl font-bold text-slate-900 mb-3">Services</h2>
                            <p className="text-slate-500 mb-8">What do you specialize in?</p>
                            <div className="space-y-3">
                                {['Loan Signing', 'General Notary', 'RON (Remote Online)'].map(s => (
                                    <label key={s} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-all">
                                        <input type="checkbox" className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500" defaultChecked />
                                        <span className="font-medium text-slate-700">{s}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100">
                    <button 
                        onClick={() => step > 1 && setStep(step - 1)} 
                        className={`text-slate-500 hover:text-slate-900 font-medium ${step === 1 ? 'invisible' : ''}`}
                    >
                        Back
                    </button>
                    <Button onClick={() => step < 3 ? setStep(step + 1) : onComplete()}>
                        {step === 3 ? 'Launch Dashboard' : 'Continue'}
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
}
