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
    <div className="min-h-screen flex bg-white animate-fade-in">
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10">
             <button onClick={onBack} className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2 font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
            <div className="mx-auto w-full max-w-sm lg:w-96">
                <Logo className="mb-8" />
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    {mode === 'login' ? 'Welcome back' : 'Start free trial'}
                </h2>
                <p className="text-slate-500 mb-8">
                    {mode === 'login' ? 'Secure login to your workspace.' : 'No credit card required.'}
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    {mode === 'signup' && <Input placeholder="Full Name" required />}
                    <Input type="email" placeholder="Email Address" required />
                    <Input type="password" placeholder="Password" required />
                    
                    <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </Button>
                </form>
                
                <div className="mt-6 text-center text-sm text-slate-500">
                    {mode === 'login' ? "New here? " : "Have an account? "}
                    <button onClick={onSwitchMode} className="font-bold text-brand-600 hover:text-brand-700">
                        {mode === 'login' ? 'Sign up' : 'Log in'}
                    </button>
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Lock className="w-3 h-3 text-green-500" /> 256-bit Secure Connection
                </div>
            </div>
        </div>
        
        <div className="hidden lg:flex flex-1 bg-slate-950 items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-900 opacity-20 mix-blend-multiply"></div>
            <div className="relative z-10 text-center px-12 text-white max-w-lg">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-8 h-8 text-brand-300" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Bank-Grade Security Standard</h3>
                <p className="text-brand-100 leading-relaxed">
                    Your client data is encrypted and protected by SOC 2 Type II compliant infrastructure. Trusted by major lenders and title companies.
                </p>
            </div>
        </div>
    </div>
  );
}
