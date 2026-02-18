import React, { useState, useMemo } from 'react';
import { Button, PhoneFrame, PageControl } from '../components/UI';
import { Navbar, Footer } from '../components/Layout';
import { 
    ShieldCheck, Lock, CheckCircle2, XCircle, CalendarClock, Map, 
    FileSignature, Smartphone, Fingerprint, WifiOff, 
    ChevronDown, ArrowRight, PlayCircle, Bot, CloudLightning, 
    Building2, Users2, Briefcase, FileText, Check, Shield, Star, 
    Zap, Globe, Award, Inbox, Bell, Navigation, ArrowLeft
} from 'lucide-react';

/* --- SECTIONS --- */

const Hero = ({ onNavigate }) => {
  return (
    <section className="relative pt-32 pb-32 lg:pt-48 lg:pb-40 overflow-hidden bg-slate-50">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-200/50 rounded-full blur-[120px] opacity-60 -translate-y-1/2 translate-x-1/4 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-200/50 rounded-full blur-[120px] opacity-60 translate-y-1/3 -translate-x-1/4 -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-24 items-center">
                <div className="max-w-2xl animate-fade-in relative z-10">
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-brand-100 text-brand-700 text-xs font-bold uppercase tracking-wide mb-8 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span>
                        New: Enterprise API & Smart Import 2.0
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.05] mb-8 tracking-tight">
                        The Enterprise OS for <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Modern Notaries</span>
                    </h1>
                    <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg font-normal">
                        Eliminate manual workflows. Automate scheduling, invoicing, and compliance in one secure, SOC-2 compliant platform built for scale.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 mb-10">
                        <Button size="lg" onClick={() => onNavigate('signup')}>Start Free Trial <ArrowRight className="ml-2 w-5 h-5" /></Button>
                        <Button size="lg" variant="secondary"><PlayCircle className="mr-2 w-5 h-5 text-brand-600" /> Watch Demo</Button>
                    </div>
                    <div className="flex items-center gap-8 text-sm font-semibold text-slate-500">
                        <span className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" /> SOC 2 Type II</span>
                        <span className="flex items-center gap-2"><Globe className="w-5 h-5 text-brand-500" /> 50-State Compliant</span>
                    </div>
                </div>

                <div className="relative animate-slide-up h-[700px] w-full hidden lg:block">
                    {/* Back Phone (Dashboard) */}
                    <div className="absolute top-10 left-10 z-10 transform -rotate-6 scale-95 transition-transform duration-700 hover:rotate-0 hover:scale-100 origin-bottom-right">
                        <PhoneFrame className="shadow-2xl shadow-brand-900/20">
                            <div className="w-full h-full bg-slate-50 pt-16 px-4 relative flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <div><h3 className="text-lg font-bold text-slate-900">Dashboard</h3><p className="text-xs text-slate-500 font-medium">Overview</p></div>
                                    <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200"></div>
                                </div>
                                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
                                    <div className="flex justify-between items-end">
                                        <div><p className="text-xs text-slate-400 font-bold uppercase">Revenue</p><p className="text-2xl font-bold text-slate-900">$8,450</p></div>
                                        <div className="h-8 w-16 bg-brand-50 rounded flex items-center justify-center text-xs text-brand-600 font-bold">+12%</div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex gap-3 items-center">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">24</div>
                                        <div><p className="text-sm font-bold text-slate-900">Loan Signing</p><p className="text-xs text-slate-500">2:00 PM • Austin</p></div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex gap-3 items-center">
                                        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold">25</div>
                                        <div><p className="text-sm font-bold text-slate-900">General Notary</p><p className="text-xs text-slate-500">10:00 AM • Round Rock</p></div>
                                    </div>
                                </div>
                            </div>
                        </PhoneFrame>
                    </div>

                    {/* Front Phone (Inbox/Activity) */}
                    <div className="absolute top-0 right-10 z-20 transform rotate-6 transition-transform duration-700 hover:rotate-0 hover:scale-105 origin-bottom-left">
                         <PhoneFrame className="shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] border-slate-800">
                            <div className="w-full h-full bg-white pt-16 px-4 relative flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold text-slate-900">Inbox</h3>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Bell className="w-4 h-4" /></div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex gap-4 p-4 rounded-2xl bg-brand-50 border border-brand-100">
                                        <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
                                        <div><h4 className="text-sm font-bold text-slate-900">Invoice Paid</h4><p className="text-xs text-slate-500 mt-1">Payment of $150.00 received.</p></div>
                                    </div>
                                    <div className="flex gap-4 p-4 border-b border-slate-50">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><Bot className="w-5 h-5" /></div>
                                        <div><h4 className="text-sm font-bold text-slate-900">AI Coach</h4><p className="text-xs text-slate-500 mt-1">New compliance updates available.</p></div>
                                    </div>
                                    <div className="flex gap-4 p-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><CalendarClock className="w-5 h-5" /></div>
                                        <div><h4 className="text-sm font-bold text-slate-900">New Appointment</h4><p className="text-xs text-slate-500 mt-1">Smart fill detected a request.</p></div>
                                    </div>
                                </div>
                            </div>
                         </PhoneFrame>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
}

const TrustBar = () => (
    <div className="border-b border-slate-100 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8">Trusted by signing agents who work with</p>
            <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-10">
                <span className="flex items-center gap-2 text-xl font-bold text-slate-800"><div className="w-6 h-6 bg-slate-900 rounded-full"></div> Fidelity</span>
                <span className="flex items-center gap-2 text-xl font-bold text-slate-800"><div className="w-6 h-6 bg-blue-700 rounded-md"></div> First American</span>
                <span className="flex items-center gap-2 text-xl font-bold text-slate-800"><div className="w-6 h-6 bg-orange-600 rounded-full"></div> Old Republic</span>
                <span className="flex items-center gap-2 text-xl font-bold text-slate-800"><div className="w-6 h-6 bg-indigo-700 rounded-sm"></div> Stewart</span>
            </div>
        </div>
    </div>
);

const BeforeAfter = () => {
    const [view, setView] = useState('new');
    const items = [
        { icon: FileText, title: "One-Click Invoicing", desc: "Generate professional PDF invoices instantly.", oldTitle: "Manual Invoicing", oldDesc: "Typing invoices in Word, saving as PDF." },
        { icon: Shield, title: "Compliance Coach", desc: "AI answers state law questions 24/7.", oldTitle: "Guesswork", oldDesc: "Frantically searching Google or calling mentors." },
        { icon: Map, title: "Auto-Mileage", desc: "GPS tracks every mile automatically.", oldTitle: "Lost Deductions", oldDesc: "Reconstructing logs from calendar at tax time." },
        { icon: CalendarClock, title: "Smart Scheduling", desc: "Intelligent routing calculates drive times.", oldTitle: "Double Booking", oldDesc: "Juggling Calendar and emails, stuck in traffic." }
    ];
    return (
        <section className="py-32 bg-white border-t border-slate-100">
             <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">Why switch?</h2>
                    <div className="inline-flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                        <button onClick={() => setView('old')} className={`px-8 py-3 rounded-lg text-sm font-bold transition-all ${view === 'old' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>The Old Way</button>
                        <button onClick={() => setView('new')} className={`px-8 py-3 rounded-lg text-sm font-bold transition-all ${view === 'new' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}>With NotaryOS</button>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {items.map((item, i) => (
                        <div key={i} className={`p-8 rounded-3xl border transition-all duration-300 flex gap-6 items-start ${view === 'new' ? 'bg-brand-50/30 border-brand-100 hover:border-brand-300 hover:shadow-md' : 'bg-slate-50 border-slate-200 opacity-60 grayscale'}`}>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${view === 'new' ? 'bg-brand-100 text-brand-600' : 'bg-slate-200 text-slate-400'}`}><item.icon className="w-7 h-7" /></div>
                            <div>
                                <h4 className={`text-xl font-bold mb-2 ${view === 'new' ? 'text-slate-900' : 'text-slate-500'}`}>{view === 'new' ? item.title : item.oldTitle}</h4>
                                <p className={`text-sm leading-relaxed ${view === 'new' ? 'text-slate-600' : 'text-slate-400'}`}>{view === 'new' ? item.desc : item.oldDesc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const AIHeroSection = () => {
    return (
        <section id="ai-coach" className="bg-slate-950 py-32 relative overflow-hidden text-white border-t border-slate-900">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-[150px] translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] -translate-x-1/2 translate-y-1/2"></div>
            <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-400/30 text-brand-400 text-xs font-bold uppercase tracking-wider mb-8"><Zap className="w-3 h-3" /> NEW: AI COMPLIANCE COACH</div>
                        <h2 className="text-4xl md:text-6xl font-extrabold mb-8 leading-tight">Your compliance expert, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">available 24/7.</span></h2>
                        <p className="text-xl text-slate-400 mb-12 leading-relaxed font-light">Not just software—it's a mentor. Get instant answers to state-specific questions, fee limits, and ID rules without searching through a 100-page handbook.</p>
                        <div className="relative max-w-lg group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                            <div className="relative bg-slate-900 rounded-xl flex items-center p-2"><input type="text" placeholder="e.g. What's the fee for a jurat in California?" className="w-full bg-transparent border-none text-slate-200 placeholder-slate-500 px-4 focus:ring-0 text-base" readOnly /><button className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm shadow-lg">Ask AI</button></div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl relative z-10">
                            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20"><Bot className="w-7 h-7" /></div><div><h4 className="font-bold text-white text-lg">NotaryOS AI</h4><div className="flex items-center gap-2 mt-1"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span><span className="text-xs font-medium text-slate-400">Online Now</span></div></div></div>
                            <div className="space-y-6">
                                <div className="flex justify-end"><div className="bg-brand-600 text-white px-6 py-4 rounded-2xl rounded-tr-sm text-sm max-w-[85%] shadow-md leading-relaxed">What's the maximum fee for a jurat in California?</div></div>
                                <div className="flex justify-start"><div className="bg-slate-800 text-slate-200 px-6 py-4 rounded-2xl rounded-tl-sm text-sm max-w-[90%] shadow-md border border-slate-700 leading-relaxed"><p className="font-semibold text-brand-400 mb-2">California Government Code § 8211</p>The maximum fee for a jurat is <span className="text-white font-bold">$15 per signature</span>, including the oath or affirmation.</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const MobileWorkflow = () => {
    const [activeTab, setActiveTab] = useState('routing');
    
    const tabs = [
        { id: 'routing', icon: Map, title: 'Intelligent Routing', desc: 'Navigate to your next signing with one tap.', 
          screen: (
            <div className="h-full bg-slate-900 flex flex-col text-white relative rounded-[48px] overflow-hidden">
                 {/* Map Background Simulation */}
                 <div className="absolute inset-0 bg-slate-800/50 z-0"><svg className="w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M20,100 L20,60 L50,40 L80,20" stroke="white" strokeWidth="2" fill="none"/><path d="M0,50 L100,50" stroke="white" strokeWidth="1" fill="none"/></svg></div>
                 <div className="relative z-10 pt-16 px-4 h-full flex flex-col">
                     <div className="bg-green-600 rounded-xl p-4 shadow-lg mb-4 flex gap-4 items-center"><ArrowLeft className="w-8 h-8 text-white" /><div><p className="text-xs font-bold uppercase opacity-80">Turn Left</p><h3 className="text-xl font-bold">Main St.</h3></div></div>
                     <div className="flex-1 relative"><div className="absolute top-10 left-1/2 w-2 h-32 bg-blue-500 -translate-x-1/2 rounded-full"></div><div className="absolute top-40 left-1/2 w-6 h-6 bg-blue-500 border-4 border-white rounded-full -translate-x-1/2 z-20"></div></div>
                     <div className="bg-white rounded-2xl p-4 shadow-2xl mb-8"><div className="flex justify-between items-center"><div><h4 className="text-slate-900 font-bold text-lg">14 min <span className="text-slate-400 font-normal text-sm">(5.2 mi)</span></h4><p className="text-xs text-green-600 font-bold">Fastest route</p></div><button className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">End</button></div></div>
                 </div>
            </div>
          ) 
        },
        { id: 'biometric', icon: Fingerprint, title: 'Biometric Security', desc: 'FaceID/TouchID protection for client data.',
          screen: (
            <div className="h-full bg-slate-950 flex flex-col items-center justify-center text-center p-8 relative">
                 <div className="w-24 h-24 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-8 relative overflow-hidden">
                     <Fingerprint className="w-12 h-12 text-brand-500 z-10" />
                     <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 shadow-[0_0_15px_rgba(43,115,255,0.8)] animate-scan"></div>
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">NotaryOS Locked</h3>
                 <p className="text-slate-500 text-sm">Face ID Required</p>
            </div>
          )
        },
        { id: 'offline', icon: WifiOff, title: 'Offline Mode', desc: 'Syncs automatically when you reconnect.',
          screen: (
            <div className="h-full bg-slate-50 pt-16 flex flex-col">
                <div className="bg-amber-500 text-white text-[10px] py-1.5 text-center font-bold tracking-widest uppercase shadow-sm z-20">Offline Mode Active</div>
                <div className="p-6 space-y-4"><div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-amber-500 flex justify-between items-center"><div><p className="font-bold text-slate-800 text-sm">Entry #1024</p><p className="text-xs text-slate-500">Waiting for network...</p></div><div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div></div><div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 opacity-60"><div className="h-4 w-24 bg-slate-200 rounded mb-2"></div><div className="h-3 w-16 bg-slate-100 rounded"></div></div></div>
            </div>
          )
        }
    ];

    return (
        <section id="mobile-workflow" className="py-32 bg-white overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div className="relative mx-auto lg:mr-0 flex items-center justify-center order-2 lg:order-1"><PhoneFrame className="shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]">{tabs.find(t => t.id === activeTab).screen}</PhoneFrame></div>
                    <div className="order-1 lg:order-2">
                        <div className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full mb-6 border border-slate-200">MOBILE FIRST</div>
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-8 text-slate-900 leading-tight">Run your business from your pocket.</h2>
                        <p className="text-xl text-slate-500 mb-12 leading-relaxed">Designed for the road. Whether you're in a car, a coffee shop, or a client's living room, you have full control.</p>
                        <div className="space-y-4">
                            {tabs.map(tab => (
                                <div key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex gap-5 p-6 rounded-2xl cursor-pointer transition-all border ${activeTab === tab.id ? 'bg-slate-50 border-brand-200 shadow-md scale-105' : 'border-transparent hover:bg-slate-50 opacity-60 hover:opacity-100'}`}>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${activeTab === tab.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'bg-slate-100 text-slate-400'}`}><tab.icon className="w-7 h-7" /></div>
                                    <div><h4 className={`text-xl font-bold mb-1 ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-600'}`}>{tab.title}</h4><p className="text-sm text-slate-500 leading-relaxed">{tab.desc}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

const HowItWorks = () => {
    return (
        <section id="how" className="bg-slate-50 py-32 w-full border-t border-slate-200">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-20"><h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">How NotaryOS works</h2><p className="text-xl text-slate-500 max-w-2xl mx-auto">A streamlined workflow designed to take you from booking to payout in record time.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="visual-card bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                        <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-brand-200"><CalendarClock className="w-8 h-8" /></div>
                        <div className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-4">Step 1</div>
                        <h4 className="text-2xl font-bold text-slate-900 mb-4">Book the Job</h4>
                        <p className="text-slate-500 leading-relaxed">Capture client info instantly. Forward confirmation emails to your agent address and let AI do the rest.</p>
                    </div>
                    <div className="visual-card bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                        <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-brand-200"><Smartphone className="w-8 h-8" /></div>
                        <div className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-4">Step 2</div>
                        <h4 className="text-2xl font-bold text-slate-900 mb-4">Do the Signing</h4>
                        <p className="text-slate-500 leading-relaxed">Use the Mobile Journal flow to capture ID images, signatures, and thumbprints securely offline.</p>
                    </div>
                    <div className="visual-card bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                        <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-brand-200"><FileSignature className="w-8 h-8" /></div>
                        <div className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-4">Step 3</div>
                        <h4 className="text-2xl font-bold text-slate-900 mb-4">Get Paid</h4>
                        <p className="text-slate-500 leading-relaxed">Auto-generate invoices, track payment status, and close the accounting loop instantly.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

const ROICalculator = () => {
    const [weeklyAppts, setWeeklyAppts] = useState(10);
    const [adminMins, setAdminMins] = useState(20);
    const hoursSaved = useMemo(() => Math.round((weeklyAppts * adminMins * 52) / 60), [weeklyAppts, adminMins]);
    const moneySaved = useMemo(() => (hoursSaved * 50).toLocaleString(), [hoursSaved]);

    return (
        <section id="roi" className="py-24 bg-slate-900 text-white border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-4xl font-bold text-white mb-6">Calculate your lost time</h2>
                        <p className="text-xl text-slate-400 mb-10">See how much billable time you're wasting on manual admin tasks like invoicing, scheduling, and journal entry.</p>
                        <div className="space-y-8">
                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                                <div className="flex justify-between mb-4"><label className="font-bold text-slate-200">Appointments per week</label><span className="text-brand-400 font-bold text-xl">{weeklyAppts}</span></div>
                                <input type="range" min="1" max="50" value={weeklyAppts} onChange={(e) => setWeeklyAppts(parseInt(e.target.value))} className="w-full" />
                            </div>
                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                                <div className="flex justify-between mb-4"><label className="font-bold text-slate-200">Admin minutes per job</label><span className="text-brand-400 font-bold text-xl">{adminMins} min</span></div>
                                <input type="range" min="5" max="60" value={adminMins} onChange={(e) => setAdminMins(parseInt(e.target.value))} className="w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-brand-600 rounded-[2.5rem] p-10 text-center border border-brand-500 relative shadow-xl transform transition-transform hover:scale-105 duration-300 text-white">
                        <div className="mb-8"><p className="text-brand-100 font-medium mb-2">You could reclaim</p><div className="text-6xl font-extrabold text-white mb-2">{hoursSaved} <span className="text-2xl text-brand-200 font-normal">hours/yr</span></div><p className="text-sm text-brand-200">of personal time</p></div>
                        <div className="pt-8 border-t border-brand-500"><p className="text-brand-100 font-medium mb-2">Potential Extra Revenue</p><div className="text-5xl font-bold text-white">${moneySaved}</div><p className="text-xs text-brand-200 mt-2">Based on $50/hr billable rate</p></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const BusinessModels = () => {
    return (
        <section className="bg-white py-32 w-full border-t border-slate-200 font-sans">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-20"><h3 className="text-3xl md:text-4xl font-extrabold mb-6 text-slate-900">Built for every business model</h3><p className="text-slate-500 text-lg">Whether you are solo or scaling an agency, we have you covered.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 hover:bg-white hover:shadow-xl transition-all group"><div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-600 mb-8 group-hover:scale-110 transition-transform"><Map className="w-8 h-8" /></div><h4 className="text-2xl font-bold mb-4 text-slate-900">Mobile Notaries</h4><p className="text-slate-500 leading-relaxed">Run route-based signings, capture compliant entries on-site, and complete admin later from desktop.</p></div>
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 hover:bg-white hover:shadow-xl transition-all group"><div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-8 group-hover:scale-110 transition-transform"><Briefcase className="w-8 h-8" /></div><h4 className="text-2xl font-bold mb-4 text-slate-900">Loan Signing Agents</h4><p className="text-slate-500 leading-relaxed">Manage high-volume closings with reliable documentation, invoicing, and audit-ready workflows.</p></div>
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 hover:bg-white hover:shadow-xl transition-all group"><div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-8 group-hover:scale-110 transition-transform"><Users2 className="w-8 h-8" /></div><h4 className="text-2xl font-bold mb-4 text-slate-900">Signing Agencies</h4><p className="text-slate-500 leading-relaxed">Coordinate team dispatch, centralize records, and scale operations with standardized processes.</p></div>
                </div>
            </div>
        </section>
    );
};

const Features = () => (
  <section id="features" className="py-32 bg-slate-50 border-t border-slate-200">
    <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center mb-20">
      <h2 className="text-brand-600 font-bold uppercase text-sm mb-3 tracking-widest">Enterprise Features</h2>
      <h3 className="text-4xl font-extrabold text-slate-900">Everything in one place</h3>
    </div>
    <div className="max-w-7xl mx-auto px-6 lg:px-8 grid md:grid-cols-3 gap-12">
        {[
            { title: 'Smart Scheduling', desc: 'Syncs with Google Calendar. Automatically calculates drive times.', icon: CalendarClock, color: 'bg-blue-500' },
            { title: 'Magic Import', desc: 'Forward emails to your custom agent address for instant job creation.', icon:  CloudLightning, color: 'bg-purple-500' },
            { title: 'Instant Invoicing', desc: 'Professional PDF invoices. Stripe integration for instant payments.', icon: FileSignature, color: 'bg-green-500' },
            { title: 'Digital Journal', desc: '50-state compliant electronic journal with biometric security.', icon: Lock, color: 'bg-orange-500' },
            { title: 'Mileage Tracking', desc: 'Automatic GPS tracking for every appointment. IRS-ready reports.', icon: Map, color: 'bg-red-500' },
            { title: 'Client Portal', desc: 'Secure document upload for signers before the appointment.', icon: ShieldCheck, color: 'bg-indigo-500' }
        ].map((f, i) => (
            <div key={i} className="group p-8 rounded-3xl bg-white border border-slate-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:rotate-6 transition-transform`}>
                    <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
        ))}
    </div>
  </section>
);

const Testimonials = () => (
    <section className="py-32 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-20">Trusted by the best in the business</h2>
            <div className="grid md:grid-cols-3 gap-10">
                {[
                    { q: "I've tried every journal app. NotaryOS is the only one that actually speeds up my closings instead of slowing them down.", a: "Sarah J.", r: "Loan Signing Agent, CA" },
                    { q: "The AI coach saved me during a tricky POA signing. It's like having a mentor in my pocket 24/7.", a: "Michael T.", r: "Mobile Notary, TX" },
                    { q: "Finally, software that feels like it was built by a tech company, not a notary from 1995. The UI is incredible.", a: "Jessica L.", r: "Signing Service Owner, FL" }
                ].map((t,i) => (
                    <div key={i} className="bg-slate-50 p-10 rounded-[32px] shadow-sm border border-slate-100 relative hover:shadow-lg transition-shadow">
                        <div className="flex gap-1 text-amber-400 mb-6"><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /></div>
                        <p className="text-slate-700 text-lg mb-8 leading-relaxed font-medium">"{t.q}"</p>
                        <div>
                            <p className="font-bold text-slate-900 text-base">{t.a}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">{t.r}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const Pricing = ({ onSelect }) => {
    const [billing, setBilling] = useState('monthly'); // 'monthly' | 'annual'

    const plans = [
        { 
            name: 'Starter', 
            monthly: '0', 
            annual: '0', 
            features: ['5 Appointments/mo', 'Basic Digital Journal', 'Local Data Storage'] 
        },
        { 
            name: 'Professional', 
            monthly: '29', 
            annual: '24', 
            features: ['Unlimited Appointments', 'AI Smart Import', 'Invoicing & Payments', 'Cloud Sync & Backup'], 
            popular: true 
        },
        { 
            name: 'Agency', 
            monthly: '99', 
            annual: '79', 
            features: ['Multi-user Access', 'Team Dispatching', 'Agency Reporting', 'API Access'] 
        }
    ];

    return (
        <section id="pricing" className="py-32 bg-white relative overflow-hidden border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-brand-600 font-bold tracking-wide uppercase text-sm mb-4">Transparent Pricing</h2>
                    <h3 className="text-4xl font-extrabold text-slate-900 mb-8">Choose the plan that fits your growth</h3>
                    
                    <div className="inline-flex items-center p-1.5 bg-slate-100 border border-slate-200 rounded-full shadow-inner">
                        <button 
                            onClick={() => setBilling('monthly')}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${billing === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            Monthly
                        </button>
                        <button 
                            onClick={() => setBilling('annual')}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${billing === 'annual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            Annual <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide">Save 20%</span>
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start mb-24">
                    {plans.map((p, i) => (
                        <div key={i} className={`relative p-10 rounded-[32px] transition-all duration-300 ${p.popular ? 'bg-slate-900 text-white shadow-2xl scale-105 border-2 border-brand-500 z-10' : 'bg-white border border-slate-200 shadow-lg hover:shadow-xl'}`}>
                            {p.popular && <div className="absolute top-0 right-0 left-0 bg-brand-500 text-white text-xs font-bold py-1.5 text-center uppercase tracking-widest rounded-t-[30px]">Most Popular</div>}
                            <h3 className={`text-xl font-bold mb-2 ${p.popular ? 'text-white mt-4' : 'text-slate-900'}`}>{p.name}</h3>
                            <div className="flex items-baseline mb-6">
                                <span className={`text-5xl font-extrabold tracking-tight ${p.popular ? 'text-white' : 'text-slate-900'}`}>${billing === 'monthly' ? p.monthly : p.annual}</span>
                                <span className={`ml-2 text-sm font-medium ${p.popular ? 'text-slate-400' : 'text-slate-500'}`}>/mo</span>
                            </div>
                            <p className={`text-xs mb-8 h-4 font-medium uppercase tracking-wide ${p.popular ? 'text-slate-400' : 'text-slate-400'}`}>
                                {billing === 'annual' && p.monthly !== '0' ? `Billed $${parseInt(p.annual) * 12} yearly` : 'Billed monthly'}
                            </p>
                            <ul className="space-y-5 mb-10">
                                {p.features.map((f, j) => (
                                    <li key={j} className={`flex items-start gap-3 text-sm font-medium ${p.popular ? 'text-slate-300' : 'text-slate-600'}`}>
                                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${p.popular ? 'text-brand-400' : 'text-brand-600'}`} />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <Button variant={p.popular ? 'primary' : 'outline'} className="w-full" onClick={onSelect}>
                                {p.monthly === '0' ? 'Get Started Free' : 'Start 14-Day Trial'}
                            </Button>
                        </div>
                    ))}
                </div>

                {/* COMPARISON TABLE (Dark Mode) */}
                <div className="max-w-5xl mx-auto mt-20">
                   <div className="overflow-hidden rounded-2xl border border-slate-800 shadow-2xl bg-slate-900">
                       <table className="w-full text-sm text-left">
                           <thead className="bg-slate-950 text-white uppercase font-bold text-xs tracking-wider">
                               <tr>
                                   <th className="px-6 py-5">Compare plans</th>
                                   <th className="px-6 py-5">Starter</th>
                                   <th className="px-6 py-5 text-brand-400">Pro</th>
                                   <th className="px-6 py-5">Agency</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-800 text-slate-300">
                               <tr className="hover:bg-slate-800/50 transition-colors">
                                   <td className="px-6 py-4 font-medium text-slate-100">Appointments per month</td>
                                   <td className="px-6 py-4">5</td>
                                   <td className="px-6 py-4 text-white font-semibold">Unlimited</td>
                                   <td className="px-6 py-4 text-white font-semibold">Unlimited + team routing</td>
                               </tr>
                               <tr className="hover:bg-slate-800/50 transition-colors">
                                   <td className="px-6 py-4 font-medium text-slate-100">Journal workflows</td>
                                   <td className="px-6 py-4 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Basic</td>
                                   <td className="px-6 py-4 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Advanced + templates</td>
                                   <td className="px-6 py-4 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Team oversight</td>
                               </tr>
                               <tr className="hover:bg-slate-800/50 transition-colors">
                                   <td className="px-6 py-4 font-medium text-slate-100">Storage & sync</td>
                                   <td className="px-6 py-4">Local only</td>
                                   <td className="px-6 py-4">Cloud sync + backups</td>
                                   <td className="px-6 py-4">Cloud sync + multi-user</td>
                               </tr>
                               <tr className="hover:bg-slate-800/50 transition-colors">
                                   <td className="px-6 py-4 font-medium text-slate-100">AI compliance coach</td>
                                   <td className="px-6 py-4 text-slate-600">—</td>
                                   <td className="px-6 py-4 flex items-center gap-2"><Check className="w-4 h-4 text-brand-400" /> Included</td>
                                   <td className="px-6 py-4 flex items-center gap-2"><Check className="w-4 h-4 text-brand-400" /> Included</td>
                               </tr>
                               <tr className="hover:bg-slate-800/50 transition-colors">
                                   <td className="px-6 py-4 font-medium text-slate-100">API access</td>
                                   <td className="px-6 py-4 text-slate-600">—</td>
                                   <td className="px-6 py-4 text-slate-600">—</td>
                                   <td className="px-6 py-4 flex items-center gap-2"><Check className="w-4 h-4 text-brand-400" /> Included</td>
                               </tr>
                               <tr className="bg-slate-950/30">
                                   <td className="px-6 py-4 font-medium text-slate-100">Best for</td>
                                   <td className="px-6 py-4">Getting started</td>
                                   <td className="px-6 py-4 text-brand-200">Full-time solo notary</td>
                                   <td className="px-6 py-4">Growing signing teams</td>
                               </tr>
                           </tbody>
                       </table>
                   </div>
               </div>
            </div>
        </section>
    );
};

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null);
    
    const items = [
        { q: "Is NotaryOS compliant with my state laws?", a: "Yes. NotaryOS includes a 50-state database of fees, ID requirements, and journal rules. Our digital journal captures all required fields including signer signatures and timestamps." },
        { q: "Is my client data secure?", a: "Absolutely. We use 256-bit AES encryption for all data. If you use the Local Storage mode (Starter plan), data never leaves your device. Cloud Sync (Pro plan) uses secure, SOC2 compliant infrastructure." },
        { q: "Can I use NotaryOS on my phone?", a: "Yes! NotaryOS is built 'Mobile First'. You can run your entire business from the field—capture IDs, log journal entries, and send invoices right from your phone browser." },
        { q: "How does the AI Coach work?", a: "The AI Coach uses advanced language models to answer your compliance questions instantly. You simply provide your own Gemini API key (free from Google) to enable this feature securely." },
        { q: "Can I export my data?", a: "Yes. You can export your mileage logs, expense reports, and journal history to CSV or PDF at any time for taxes or backups." }
    ];

    return (
        <section id="faq" className="py-32 bg-white border-t border-slate-200">
            <div className="max-w-3xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
                    <p className="text-slate-500 text-lg">Everything you need to know about the platform.</p>
                </div>
                
                <div className="space-y-4">
                    {items.map((item, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-200 hover:shadow-md">
                            <button 
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full flex items-center justify-between p-6 text-left"
                            >
                                <span className="font-bold text-slate-900 text-lg">{item.q}</span>
                                <span className={`text-slate-400 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}>
                                    <ChevronDown className="w-5 h-5" />
                                </span>
                            </button>
                            {openIndex === i && (
                                <div className="px-6 pb-8 text-slate-600 leading-relaxed animate-fade-in border-t border-slate-200/50 pt-4">
                                    {item.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* --- MAIN LANDING COMPONENT --- */

export default function LandingPage({ onNavigate, onOpenLegal }) {
  return (
    <>
      <Navbar onNavigate={onNavigate} onOpenLegal={onOpenLegal} />
      <Hero onNavigate={onNavigate} />
      <TrustBar />
      <BeforeAfter />
      <AIHeroSection />
      <MobileWorkflow />
      <HowItWorks />
      <ROICalculator />
      <BusinessModels />
      <Features />
      <Testimonials />
      <Pricing onSelect={() => onNavigate('signup')} />
      <FAQ />
      <Footer onNavigate={onNavigate} onOpenLegal={onOpenLegal} />
      <PageControl />
    </>
  );
}
