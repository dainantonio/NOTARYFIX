import React, { useState } from 'react';
import { Button, Logo, Input } from '../components/UI';
import { Lock, Shield, ArrowLeft } from 'lucide-react';

export default function AuthScreen({ mode = 'login', onComplete, onSwitchMode, onBack }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => { 
        setIsLoading(false); 
        onComplete(); 
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white animate-fade-in">
        {/* Left: Form */}
        <div className="flex-1 flex flex-col justify-center px-6 lg:px-20 xl:px-24 relative z-10 py-12 lg:py-0">
             <button onClick={onBack} className="absolute top-8 left-8 text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
            <div className="mx-auto w-full max-w-sm">
                <div className="mb-10">
                    <Logo className="mb-8" />
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">
                        {mode === 'login' ? 'Welcome back' : 'Start your free trial'}
                    </h2>
                    <p className="text-slate-500">
                        {mode === 'login' ? 'Access your dashboard and manage appointments.' : 'No credit card required for the 14-day trial.'}
                    </p>
                </div>

                <div className="space-y-4 mb-8">
                    <button className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-3 rounded-lg font-medium transition-colors shadow-sm">
                        {/* Google SVG */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.49-1.93-6.36-4.52H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.64 14.11c-.23-.69-.36-1.41-.36-2.11 0-.7.13-1.42.36-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.46-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.46 2.84c.87-2.6 3.49-4.51 6.36-4.51z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>
                     <button className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-3 rounded-lg font-medium transition-colors shadow-sm">
                        {/* Apple SVG */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05 1.08-3.08.35-1.09-.75-2.58-.75-3.58 0-.96.72-2.06.66-3.08-.31-2.14-2.1-3.64-7.53-1.44-9.54 1.1-.98 2.86-.98 3.66.02.69.86 1.76.86 2.62-.05.9-.98 2.92-.98 3.66-.02 2.16 2.85 2.87 5.75.52 7.08-.47 1.14-1.04 1.95-1.45 2.47zM12 3.98c.55-.95 1.69-1.61 2.68-1.58.46 2.45-2.66 3.9-4.32 3.14-.15-1.05.28-2.12 1.64-1.56z" />
                        </svg>
                        Continue with Apple
                    </button>
                </div>

                <div className="relative mb-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wider text-slate-400 font-bold bg-white px-3">Or continue with email</div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    {mode === 'signup' && <Input placeholder="Full Name" required />}
                    <Input type="email" placeholder="Email Address" required />
                    <div>
                         <Input type="password" placeholder="Password" required />
                         {mode === 'login' && (
                             <div className="flex justify-between items-center mt-2">
                                <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
                                    <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" /> Remember me
                                </label>
                                <button type="button" className="text-sm font-medium text-brand-600 hover:text-brand-700">Forgot password?</button>
                             </div>
                         )}
                    </div>
                    
                    <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </Button>
                </form>
                
                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-500">
                        {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={onSwitchMode} className="font-bold text-brand-600 hover:text-brand-700">
                            {mode === 'login' ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                </div>

                <div className="mt-12 border-t border-slate-100 pt-6">
                     <p className="text-xs text-center text-slate-400 mb-4">Join 10,000+ notaries trusting us</p>
                     <div className="flex justify-center -space-x-2">
                        {[1,2,3,4].map(i => (
                            <img key={i} className="w-8 h-8 rounded-full border-2 border-white" src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">+2k</div>
                     </div>
                </div>
            </div>
        </div>
        
        {/* Right: Feature/Trust Panel */}
        <div className="hidden lg:flex flex-1 bg-slate-950 items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-900 opacity-20 mix-blend-multiply"></div>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500 rounded-full blur-[150px] opacity-20 translate-x-1/3 -translate-y-1/3"></div>
            
            <div className="relative z-10 max-w-md">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Bank-Grade Security</h3>
                            <p className="text-brand-100 text-sm">SOC 2 Type II Certified</p>
                        </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-sm mb-6">
                        "NotaryOS is the only platform I trust with my client's sensitive loan documents. The biometric lock and encryption standards are exactly what title companies demand."
                    </p>
                    <div className="flex items-center gap-3">
                         <img src="https://i.pravatar.cc/100?img=33" alt="Reviewer" className="w-10 h-10 rounded-full border border-white/20" />
                         <div>
                             <p className="text-white font-bold text-sm">Elena Rodriguez</p>
                             <p className="text-slate-400 text-xs">Signing Agent, Florida</p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
