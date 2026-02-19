import React, { useState } from 'react';
import { Button, Logo, Input } from '../components/UI';
import { Check, User, Briefcase, MapPin, ShieldCheck, FileText, Upload, ChevronRight, Loader2 } from 'lucide-react';

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
      role: '',
      firstName: '',
      lastName: '',
      photo: null,
      commissionNumber: '',
      commissionState: '',
      commissionExp: '',
      zipCode: '',
      radius: 25,
      services: []
  });

  const steps = [
      { id: 1, title: 'Your Role', icon: User, desc: 'Define your business type' },
      { id: 2, title: 'Identity', icon: ShieldCheck, desc: 'Personal details' },
      { id: 3, title: 'Compliance', icon: FileText, desc: 'Verify commission' },
      { id: 4, title: 'Service Area', icon: MapPin, desc: 'Where you work' },
      { id: 5, title: 'Services', icon: Briefcase, desc: 'What you offer' }
  ];

  const handleNext = () => {
      if (step < steps.length) {
          setStep(step + 1);
      } else {
          finishOnboarding();
      }
  };

  const finishOnboarding = () => {
      setIsSubmitting(true);
      setTimeout(() => {
          setIsSubmitting(false);
          onComplete();
      }, 2500);
  };

  const toggleService = (service) => {
      setFormData(prev => ({
          ...prev,
          services: prev.services.includes(service)
              ? prev.services.filter(s => s !== service)
              : [...prev.services, service]
      }));
  };

  if (isSubmitting) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
              <div className="text-center animate-fade-in">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-6">
                      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Setting up your workspace...</h2>
                  <p className="text-slate-500">Configuring compliance rules for {formData.commissionState || 'your state'}.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
        <div className="bg-white w-full max-w-6xl rounded-[32px] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col md:flex-row min-h-[650px]">
            {/* Sidebar */}
            <div className="bg-slate-950 p-8 md:p-12 md:w-[320px] flex flex-col justify-between text-white relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-900/20 to-transparent pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="mb-12"><Logo className="[&>span]:text-white" /></div>
                    <div className="space-y-0 relative">
                        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-800" />
                        {steps.map((s, i) => {
                            const isActive = step === s.id;
                            const isCompleted = step > s.id;
                            return (
                                <div key={s.id} className="relative flex items-center gap-4 py-3 group">
                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 z-10 ${isActive ? 'bg-brand-600 border-brand-600 text-white scale-110 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-500'}`}>
                                         {isCompleted ? <Check className="w-4 h-4" /> : s.id}
                                     </div>
                                     <div className={`transition-all duration-300 ${isActive ? 'opacity-100 translate-x-1' : isCompleted ? 'opacity-70' : 'opacity-40'}`}>
                                         <span className="block font-semibold text-sm tracking-wide">{s.title}</span>
                                         {isActive && <span className="block text-xs text-slate-400 mt-0.5">{s.desc}</span>}
                                     </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="relative z-10 text-xs text-slate-500 pt-8 border-t border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="font-medium text-slate-400">System Operational</span>
                    </div>
                    Need help? <a href="#" className="text-brand-400 hover:text-brand-300 hover:underline">Contact Support</a>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 md:p-16 flex flex-col relative bg-white">
                <div className="mb-10 max-w-lg">
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-3">{steps[step-1].title}</h2>
                    <p className="text-slate-500 text-lg">Let's get your NotaryOS account configured for success.</p>
                </div>

                <div className="flex-1 max-w-xl animate-fade-in">
                    
                    {step === 1 && (
                        <div className="grid gap-4">
                            {['Individual Notary', 'Signing Agency'].map(role => {
                                const isSelected = formData.role === role;
                                return (
                                    <div key={role} onClick={() => setFormData({...formData, role})} className={`group p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-5 ${isSelected ? 'border-brand-600 bg-brand-50/50 shadow-sm' : 'border-slate-100 hover:border-brand-200 hover:bg-slate-50'}`}>
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-brand-600'}`}>
                                            {role === 'Individual Notary' ? <User className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-bold text-lg mb-1 ${isSelected ? 'text-brand-900' : 'text-slate-900'}`}>{role}</h3>
                                            <p className="text-sm text-slate-500">{role === 'Individual Notary' ? 'I work for myself as a mobile notary or LSA.' : 'I manage a team of notaries and dispatch jobs.'}</p>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200'}`}>
                                            {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8">
                            <div className="flex items-center gap-6 p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                                <div className="w-20 h-20 rounded-full bg-white border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0"><User className="w-8 h-8" /></div>
                                <div><h4 className="font-bold text-slate-900 text-sm mb-1">Profile Photo</h4><p className="text-xs text-slate-500 mb-3">Upload a professional headshot for your public profile.</p><Button variant="secondary" size="sm" className="h-8 text-xs"><Upload className="w-3 h-3 mr-2" /> Upload</Button></div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-5">
                                <Input label="First Name" placeholder="Jane" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                                <Input label="Last Name" placeholder="Doe" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                            </div>
                            <Input label="Email Address" placeholder="jane@example.com" type="email" />
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                             <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 mb-6"><ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" /><p className="text-sm text-blue-800">We verify commission details against state databases to enable digital seal features.</p></div>
                             <Input label="Commission Number" placeholder="123456789" value={formData.commissionNumber} onChange={e => setFormData({...formData, commissionNumber: e.target.value})} />
                             <div className="grid md:grid-cols-2 gap-5">
                                <div><label className="block text-sm font-bold text-slate-700 mb-2">Commission State</label><div className="relative"><select className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 appearance-none font-medium text-slate-900" value={formData.commissionState} onChange={e => setFormData({...formData, commissionState: e.target.value})}><option value="" disabled>Select State</option><option value="CA">California</option><option value="TX">Texas</option><option value="FL">Florida</option><option value="NY">New York</option><option value="AZ">Arizona</option></select><ChevronRight className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" /></div></div>
                                <Input label="Expiration Date" type="date" value={formData.commissionExp} onChange={e => setFormData({...formData, commissionExp: e.target.value})} />
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-8">
                            <Input label="Base Zip Code" placeholder="90210" value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} />
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="flex justify-between items-end mb-6"><label className="block text-sm font-bold text-slate-700">Service Radius</label><span className="text-2xl font-bold text-brand-600">{formData.radius} <span className="text-sm font-normal text-slate-500">miles</span></span></div>
                                <input type="range" min="5" max="100" value={formData.radius} onChange={(e) => setFormData({...formData, radius: parseInt(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600" />
                                <div className="flex justify-between text-xs text-slate-400 mt-3 font-medium uppercase tracking-wider"><span>5 mi</span><span>100 mi</span></div>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-4">
                             <p className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Select all that apply</p>
                             <div className="grid grid-cols-1 gap-3">
                                 {[
                                     { id: 'lsa', label: 'Loan Signing Agent', icon: FileText },
                                     { id: 'gnw', label: 'General Notary Work', icon: User },
                                     { id: 'ron', label: 'Remote Online Notary (RON)', icon: MapPin },
                                     { id: 'finger', label: 'Fingerprinting', icon: ShieldCheck },
                                     { id: 'permit', label: 'Permit Running', icon: Briefcase }
                                 ].map((s) => {
                                     const isSelected = formData.services.includes(s.id);
                                     return (
                                         <div key={s.id} onClick={() => toggleService(s.id)} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${isSelected ? 'bg-brand-50 border-brand-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                             <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}><s.icon className="w-5 h-5" /></div>
                                             <span className={`font-bold flex-1 ${isSelected ? 'text-brand-900' : 'text-slate-700'}`}>{s.label}</span>
                                             {isSelected && <Check className="w-5 h-5 text-brand-600" />}
                                         </div>
                                     )
                                 })}
                             </div>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-10 flex items-center justify-between border-t border-slate-100">
                    <button onClick={() => step > 1 && setStep(step - 1)} className={`text-slate-500 hover:text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${step === 1 ? 'invisible' : ''}`}>Back</button>
                    <Button size="lg" onClick={handleNext} className="shadow-xl shadow-brand-500/20">{step === steps.length ? 'Launch Dashboard' : 'Continue'} <ChevronRight className="w-4 h-4 ml-1" /></Button>
                </div>
            </div>
        </div>
    </div>
  );
}
