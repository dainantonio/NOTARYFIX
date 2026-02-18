import React, { useEffect } from 'react';
import { Loader2, X, Battery, Wifi, Signal, ChevronUp, ChevronDown } from 'lucide-react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading = false,
  disabled,
  ...props 
}) => {
  const base = "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]";
  
  const sizes = { 
    sm: "px-4 py-2.5 text-sm", 
    md: "px-6 py-3 text-sm", 
    lg: "px-8 py-4 text-base" 
  };
  
  const variants = {
    primary: "bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-600/30 focus:ring-brand-500/20",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-brand-200 focus:ring-slate-100",
    ghost: "text-slate-600 hover:text-brand-600 hover:bg-brand-50/50",
    outline: "border-2 border-slate-200 text-slate-600 hover:border-brand-600 hover:text-brand-600"
  };

  return (
    <button 
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} 
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export const Logo = ({ className = "" }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-600/30">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <span className="font-bold text-xl tracking-tight text-slate-900 font-display">
      NotaryPro
    </span>
  </div>
);

export const Input = ({ label, error, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
    <input 
      className={`w-full px-4 py-3 rounded-lg border ${error ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'} bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all duration-200 ${className}`}
      {...props} 
    />
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

// High-Fidelity iPhone 15 Pro Max Mockup
export const PhoneFrame = ({ children, className = "", darkMode = false }) => (
  <div className={`relative w-[300px] h-[600px] bg-slate-950 rounded-[55px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-[6px] border-slate-800 overflow-hidden ${className}`}>
    <div className="absolute inset-0 rounded-[48px] ring-1 ring-white/10 pointer-events-none z-50"></div>
    <div className="absolute top-3 left-1/2 -translate-x-1/2 h-[28px] w-[90px] bg-black rounded-full z-40 flex items-center justify-center">
       <div className="w-16 h-3 bg-black rounded-full"></div>
    </div>
    <div className="absolute top-28 -left-[8px] w-[2px] h-8 bg-slate-700 rounded-l-md"></div>
    <div className="absolute top-44 -left-[8px] w-[2px] h-14 bg-slate-700 rounded-l-md"></div>
    <div className="absolute top-36 -right-[8px] w-[2px] h-20 bg-slate-700 rounded-r-md"></div>
    <div className={`w-full h-full ${darkMode ? 'bg-slate-900' : 'bg-white'} overflow-hidden flex flex-col relative rounded-[48px]`}>
        <div className={`h-12 w-full flex justify-between items-center px-7 pt-3 z-30 absolute top-0 text-[10px] font-bold tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <span>9:41</span>
            <div className="flex gap-1.5 items-center">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-4 h-4" />
            </div>
        </div>
        {children}
    </div>
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/20 rounded-full z-30 backdrop-blur-sm"></div>
  </div>
);

export const Modal = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        if(isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; }
    }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl transform transition-all animate-fade-in flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-8 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

// New Page Control Component
export const PageControl = () => {
    const scrollTo = (direction) => {
        const height = window.innerHeight;
        window.scrollBy({ top: direction === 'up' ? -height : height, behavior: 'smooth' });
    };

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2">
            <button 
                onClick={() => scrollTo('up')}
                className="w-10 h-10 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full flex items-center justify-center shadow-lg hover:bg-white text-slate-600 transition-all hover:-translate-y-0.5 active:scale-95"
                title="Page Up"
            >
                <ChevronUp className="w-5 h-5" />
            </button>
            <button 
                onClick={() => scrollTo('down')}
                className="w-10 h-10 bg-brand-600 backdrop-blur-md border border-brand-500 rounded-full flex items-center justify-center shadow-lg hover:bg-brand-700 text-white transition-all hover:translate-y-0.5 active:scale-95"
                title="Page Down"
            >
                <ChevronDown className="w-5 h-5" />
            </button>
        </div>
    );
};
