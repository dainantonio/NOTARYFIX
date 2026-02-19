#!/bin/bash

# 1. Create Directory Structure
mkdir -p src/components
mkdir -p src/pages
mkdir -p .github/workflows

# 2. Create Configuration Files

# .gitignore
cat << 'EOF' > .gitignore
node_modules
dist
.DS_Store
.env
.env.local
EOF

# GitHub Actions Workflow
cat << 'EOF' > .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main", "master"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
EOF

# package.json
cat << 'EOF' > package.json
{
  "name": "notary-pro-enterprise",
  "private": true,
  "version": "5.4.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.263.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.2"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.27",
    "tailwindcss": "^3.3.3",
    "vite": "^4.4.5"
  }
}
EOF

# vite.config.js
cat << 'EOF' > vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', 
})
EOF

# tailwind.config.js
cat << 'EOF' > tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: { 
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0ff',
          300: '#7cc2ff',
          400: '#369eff',
          500: '#0077ff', 
          600: '#005be6',
          700: '#0047cc',
          800: '#003db3',
          900: '#00358f',
          950: '#002159',
        },
        slate: {
          850: '#151e2e',
          900: '#0f172a',
          950: '#020617',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 8s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(30px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-15px)' } },
        scan: { '0%': { top: '0%' }, '100%': { top: '100%' } }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glow': '0 0 50px -10px rgba(0, 119, 255, 0.4)',
      }
    },
  },
  plugins: [],
}
EOF

# postcss.config.js
cat << 'EOF' > postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# index.html (Root Entry)
cat << 'EOF' > index.html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NotaryPro | The OS for Modern Notaries</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# 3. Create Source Files

# src/index.css
cat << 'EOF' > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply antialiased text-slate-900 bg-white selection:bg-brand-500 selection:text-white;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
  html {
    scroll-behavior: smooth;
  }
}

@layer components {
  .glass-panel {
    @apply bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl;
  }
  .glass-dark {
    @apply bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl;
  }
  .visual-card {
    @apply bg-white border border-slate-100 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-brand-200;
  }
  .animate-fade-in {
    animation: fadeIn 0.6s ease-out forwards;
  }
  input[type=range] {
    @apply appearance-none bg-transparent cursor-pointer;
  }
  input[type=range]::-webkit-slider-runnable-track {
    @apply w-full h-2 bg-slate-200 rounded-full;
  }
  input[type=range]::-webkit-slider-thumb {
    @apply appearance-none h-6 w-6 rounded-full bg-brand-600 -mt-2 shadow-lg ring-4 ring-white transition-transform hover:scale-110;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
EOF

# src/main.jsx
cat << 'EOF' > src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# src/components/UI.jsx
cat << 'EOF' > src/components/UI.jsx
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

export const PageControl = () => {
    const scrollTo = (direction) => {
        const height = window.innerHeight;
        window.scrollBy({ top: direction === 'up' ? -height : height, behavior: 'smooth' });
    };

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2">
            <button onClick={() => scrollTo('up')} className="w-10 h-10 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full flex items-center justify-center shadow-lg hover:bg-white text-slate-600 transition-all hover:-translate-y-0.5 active:scale-95" title="Page Up">
                <ChevronUp className="w-5 h-5" />
            </button>
            <button onClick={() => scrollTo('down')} className="w-10 h-10 bg-brand-600 backdrop-blur-md border border-brand-500 rounded-full flex items-center justify-center shadow-lg hover:bg-brand-700 text-white transition-all hover:translate-y-0.5 active:scale-95" title="Page Down">
                <ChevronDown className="w-5 h-5" />
            </button>
        </div>
    );
};
EOF

# src/components/Layout.jsx
cat << 'EOF' > src/components/Layout.jsx
import React, { useState, useEffect } from 'react';
import { Logo, Button } from './UI';
import { Menu, X, Twitter, Linkedin, Instagram } from 'lucide-react';

export const Navbar = ({ onNavigate, onOpenLegal }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navClass = scrolled 
    ? 'bg-white/95 backdrop-blur-lg border-b border-slate-200 py-3 shadow-sm' 
    : 'bg-transparent py-5';

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${navClass}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center">
        <div onClick={() => onNavigate('landing')} className="cursor-pointer"><Logo /></div>
        <div className="hidden md:flex items-center space-x-8">
          {[{ id: 'features', label: 'Features' }, { id: 'how', label: 'How it Works' }, { id: 'pricing', label: 'Pricing' }, { id: 'faq', label: 'FAQ' }].map(item => (
            <a key={item.id} href={`#${item.id}`} className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">{item.label}</a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => onNavigate('login')}>Log In</Button>
          <Button size="sm" onClick={() => onNavigate('signup')}>Start Free Trial</Button>
        </div>
        <button className="md:hidden text-slate-600 p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X /> : <Menu />}</button>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl p-6 flex flex-col gap-4 animate-fade-in z-50">
            <a href="#features" className="text-base font-medium text-slate-700 py-2 border-b border-slate-100">Features</a>
            <a href="#how" className="text-base font-medium text-slate-700 py-2 border-b border-slate-100">How it Works</a>
            <a href="#pricing" className="text-base font-medium text-slate-700 py-2 border-b border-slate-100">Pricing</a>
            <div className="pt-4 flex flex-col gap-3"><Button variant="secondary" className="w-full" onClick={() => onNavigate('login')}>Log In</Button><Button className="w-full" onClick={() => onNavigate('signup')}>Start Free Trial</Button></div>
        </div>
      )}
    </nav>
  );
};

export const Footer = ({ onOpenLegal }) => (
  <footer className="bg-slate-950 text-slate-400 py-20 text-sm border-t border-slate-900">
    <div className="max-w-7xl mx-auto px-6 lg:px-8 grid md:grid-cols-4 gap-12 mb-16">
      <div className="col-span-1">
        <Logo className="mb-6 [&>span]:text-white" />
        <p className="mb-6 leading-relaxed text-slate-400">The enterprise operating system for modern notary agencies and professionals.</p>
        <div className="flex gap-4">
          {[Twitter, Linkedin, Instagram].map((Icon, i) => (
            <a key={i} href="#" className="w-10 h-10 bg-slate-900 rounded-full hover:bg-brand-600 hover:text-white transition-all duration-300 flex items-center justify-center border border-slate-800"><Icon className="w-4 h-4" /></a>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-white font-bold mb-6 text-base">Product</h4>
        <ul className="space-y-4">
          <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
          <li><a href="#security" className="hover:text-white transition-colors">Bank-Grade Security</a></li>
          <li><a href="#pricing" className="hover:text-white transition-colors">Pricing & Plans</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-bold mb-6 text-base">Legal & Compliance</h4>
        <ul className="space-y-4">
          <li><button onClick={() => onOpenLegal('terms')} className="hover:text-white transition-colors text-left">Terms of Service</button></li>
          <li><button onClick={() => onOpenLegal('privacy')} className="hover:text-white transition-colors text-left">Privacy Policy</button></li>
          <li><button onClick={() => onOpenLegal('security')} className="hover:text-white transition-colors text-left">Security Overview</button></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-bold mb-6 text-base">Support</h4>
        <ul className="space-y-4">
          <li className="hover:text-white cursor-pointer transition-colors">Help Center</li>
          <li className="hover:text-white cursor-pointer transition-colors">Contact Sales</li>
          <li className="flex items-center gap-2 text-emerald-500 cursor-default font-medium"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> System Operational</li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
      <p>© 2026 NotaryPro Inc. SOC 2 Type II Compliant.</p>
      <div className="flex gap-6 mt-4 md:mt-0"><span>San Francisco, CA</span></div>
    </div>
  </footer>
);
EOF

# src/pages/Landing.jsx
cat << 'EOF' > src/pages/Landing.jsx
import React, { useState, useMemo } from 'react';
import { Button, PhoneFrame } from '../components/UI';
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

                {/* Right: Dual Phone Stack Visual - VISIBLE ON MOBILE */}
                {/* Applied MB-[-250px] on mobile to close the whitespace gap */}
                <div className="relative animate-slide-up h-[600px] lg:h-[700px] w-full flex justify-center lg:block mt-12 lg:mt-0 mb-[-250px] lg:mb-0 scale-[0.6] sm:scale-[0.75] lg:scale-100 origin-top">
                    {/* Back Phone (Dashboard) */}
                    <div className="absolute top-10 left-auto lg:left-10 z-10 transform -rotate-6 scale-95 transition-transform duration-700 hover:rotate-0 hover:scale-100 origin-bottom-right">
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
                    <div className="absolute top-0 right-auto lg:right-10 z-20 transform rotate-6 transition-transform duration-700 hover:rotate-0 hover:scale-105 origin-bottom-left ml-20 lg:ml-0">
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
            <div className="flex flex-wrap justify-center items-center gap-x-12 lg:gap-x-20 gap-y-10">
                <span className="flex items-center gap-3 text-2xl font-bold text-slate-900"><div className="w-8 h-8 bg-slate-900 rounded-full"></div> Fidelity</span>
                <span className="flex items-center gap-3 text-2xl font-bold text-slate-900"><div className="w-8 h-8 bg-blue-700 rounded-md"></div> First American</span>
                <span className="flex items-center gap-3 text-2xl font-bold text-slate-900"><div className="w-8 h-8 bg-orange-600 rounded-full"></div> Old Republic</span>
                <span className="flex items-center gap-3 text-2xl font-bold text-slate-900"><div className="w-8 h-8 bg-indigo-700 rounded-sm"></div> Stewart</span>
            </div>
        </div>
    </div>
);

const BeforeAfter = () => {
    const [view, setView] = useState('new');
    
    const items = [
        { 
            icon: FileText, 
            title: "One-Click Invoicing", 
            desc: "Generate professional PDF invoices instantly.",
            oldTitle: "Manual Invoicing",
            oldDesc: "Typing invoices in Word, saving as PDF, emailing manually."
        },
        { 
            icon: Shield, 
            title: "Compliance Coach", 
            desc: "AI answers state law questions 24/7.",
            oldTitle: "Guesswork",
            oldDesc: "Frantically searching Google or calling mentors."
        },
        { 
            icon: Map, 
            title: "Auto-Mileage", 
            desc: "GPS tracks every mile automatically.",
            oldTitle: "Lost Deductions",
            oldDesc: "Reconstructing logs from calendar at tax time."
        },
        { 
            icon: CalendarClock, 
            title: "Smart Scheduling", 
            desc: "Intelligent routing calculates drive times.",
            oldTitle: "Double Booking",
            oldDesc: "Juggling Calendar and emails, stuck in traffic."
        }
    ];

    return (
        <section className="py-32 bg-white border-t border-slate-100">
             <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">Why switch?</h2>
                    
                    <div className="inline-flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                        <button 
                            onClick={() => setView('old')} 
                            className={`px-8 py-3 rounded-lg text-sm font-bold transition-all ${view === 'old' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            The Old Way
                        </button>
                        <button 
                            onClick={() => setView('new')} 
                            className={`px-8 py-3 rounded-lg text-sm font-bold transition-all ${view === 'new' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            With NotaryOS
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {items.map((item, i) => (
                        <div key={i} className={`p-8 rounded-3xl border transition-all duration-300 flex gap-6 items-start ${view === 'new' ? 'bg-brand-50/30 border-brand-100 hover:border-brand-300 hover:shadow-md' : 'bg-slate-50 border-slate-200 opacity-60 grayscale'}`}>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${view === 'new' ? 'bg-brand-100 text-brand-600' : 'bg-slate-200 text-slate-400'}`}>
                                <item.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className={`text-xl font-bold mb-2 ${view === 'new' ? 'text-slate-900' : 'text-slate-500'}`}>
                                    {view === 'new' ? item.title : item.oldTitle}
                                </h4>
                                <p className={`text-sm leading-relaxed ${view === 'new' ? 'text-slate-600' : 'text-slate-400'}`}>
                                    {view === 'new' ? item.desc : item.oldDesc}
                                </p>
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
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-400/30 text-brand-400 text-xs font-bold uppercase tracking-wider mb-8">
                            <Zap className="w-3 h-3" /> NEW: AI COMPLIANCE COACH
                        </div>
                        <h2 className="text-4xl md:text-6xl font-extrabold mb-8 leading-tight">
                            Your compliance expert, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">available 24/7.</span>
                        </h2>
                        <p className="text-xl text-slate-400 mb-12 leading-relaxed font-light">
                            Not just software—it's a mentor. Get instant answers to state-specific questions, fee limits, and ID rules without searching through a 100-page handbook.
                        </p>
                        
                        <div className="relative max-w-lg group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                            <div className="relative bg-slate-900 rounded-xl flex items-center p-2">
                                <input 
                                    type="text" 
                                    placeholder="e.g. What's the fee for a jurat in California?" 
                                    className="w-full bg-transparent border-none text-slate-200 placeholder-slate-500 px-4 focus:ring-0 text-base"
                                    readOnly
                                />
                                <button className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm shadow-lg">
                                    Ask AI
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative">
                        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl relative z-10">
                            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                                    <Bot className="w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-lg">NotaryOS AI</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                                        <span className="text-xs font-medium text-slate-400">Online Now</span>
                                    </div>
                                </div>
                            </div>
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
    
    // Updated with Realistic Mockups
    const tabs = [
        { id: 'routing', icon: Map, title: 'Intelligent Routing', desc: 'Navigate to your next signing with one tap.', 
          screen: (
            <div className="h-full bg-slate-900 flex flex-col text-white relative rounded-[48px] overflow-hidden">
                 {/* Map Background Simulation */}
                 <div className="absolute inset-0 bg-slate-800/50 z-0"><svg className="w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M20,100 L20,60 L50,40 L80,20" stroke="white" strokeWidth="2" fill="none"/><path d="M0,50 L100,50" stroke="white" strokeWidth="1" fill="none"/></svg></div>
                 
                 {/* Navigation UI Overlay */}
                 <div className="relative z-10 pt-16 px-4 h-full flex flex-col">
                     {/* Top Direction Banner */}
                     <div className="bg-green-600 rounded-xl p-4 shadow-lg mb-4 flex gap-4 items-center">
                        <ArrowLeft className="w-8 h-8 text-white" />
                        <div>
                            <p className="text-xs font-bold uppercase opacity-80">Turn Left</p>
                            <h3 className="text-xl font-bold">Main St.</h3>
                        </div>
                     </div>
                     
                     {/* Route Line on Map */}
                     <div className="flex-1 relative">
                        <div className="absolute top-10 left-1/2 w-2 h-32 bg-blue-500 -translate-x-1/2 rounded-full"></div>
                        <div className="absolute top-40 left-1/2 w-6 h-6 bg-blue-500 border-4 border-white rounded-full -translate-x-1/2 z-20 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse"></div>
                     </div>

                     {/* Bottom Trip Info */}
                     <div className="bg-white rounded-2xl p-4 shadow-2xl mb-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-slate-900 font-bold text-lg">14 min <span className="text-slate-400 font-normal text-sm">(5.2 mi)</span></h4>
                                <p className="text-xs text-green-600 font-bold">Fastest route</p>
                            </div>
                            <button className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">End</button>
                        </div>
                     </div>
                 </div>
            </div>
          ) 
        },
        { id: 'biometric', icon: Fingerprint, title: 'Biometric Security', desc: 'FaceID/TouchID protection for client data.',
          screen: (
            <div className="h-full bg-slate-950 flex flex-col items-center justify-center text-center p-8 relative">
                 <div className="w-24 h-24 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-8 relative overflow-hidden">
                     <Fingerprint className="w-12 h-12 text-brand-500 z-10" />
                     {/* Scanning Animation */}
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
                <div className="p-6 space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-amber-500 flex justify-between items-center">
                         <div>
                             <p className="font-bold text-slate-800 text-sm">Entry #1024</p>
                             <p className="text-xs text-slate-500">Waiting for network...</p>
                         </div>
                         <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 opacity-60">
                         <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
                         <div className="h-3 w-16 bg-slate-100 rounded"></div>
                    </div>
                </div>
            </div>
          )
        }
    ];

    return (
        <section id="mobile-workflow" className="py-32 bg-white overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    {/* Left: Phone */}
                    <div className="relative mx-auto lg:mr-0 flex items-center justify-center order-2 lg:order-1">
                         <PhoneFrame className="shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]">
                            {tabs.find(t => t.id === activeTab).screen}
                         </PhoneFrame>
                    </div>

                    {/* Right: Content */}
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
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">How NotaryOS works</h2>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto">A streamlined workflow designed to take you from booking to payout in record time.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* Step Cards with pronounced icons */}
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
                        <div className="mb-8">
                            <p className="text-brand-100 font-medium mb-2">You could reclaim</p>
                            <div className="text-6xl font-extrabold text-white mb-2">{hoursSaved} <span className="text-2xl text-brand-200 font-normal">hours/yr</span></div>
                            <p className="text-sm text-brand-200">of personal time</p>
                        </div>
                        <div className="pt-8 border-t border-brand-500">
                            <p className="text-brand-100 font-medium mb-2">Potential Extra Revenue</p>
                            <div className="text-5xl font-bold text-white">${moneySaved}</div>
                            <p className="text-xs text-brand-200 mt-2">Based on $50/hr billable rate</p>
                        </div>
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
                <div className="text-center mb-20">
                    <h3 className="text-3xl md:text-4xl font-extrabold mb-6 text-slate-900">Built for every business model</h3>
                    <p className="text-slate-500 text-lg">Whether you are solo or scaling an agency, we have you covered.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 hover:bg-white hover:shadow-xl transition-all group">
                        <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-600 mb-8 group-hover:scale-110 transition-transform"><Map className="w-8 h-8" /></div>
                        <h4 className="text-2xl font-bold mb-4 text-slate-900">Mobile Notaries</h4>
                        <p className="text-slate-500 leading-relaxed">Run route-based signings, capture compliant entries on-site, and complete admin later from desktop.</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 hover:bg-white hover:shadow-xl transition-all group">
                        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-8 group-hover:scale-110 transition-transform"><Briefcase className="w-8 h-8" /></div>
                        <h4 className="text-2xl font-bold mb-4 text-slate-900">Loan Signing Agents</h4>
                        <p className="text-slate-500 leading-relaxed">Manage high-volume closings with reliable documentation, invoicing, and audit-ready workflows.</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 hover:bg-white hover:shadow-xl transition-all group">
                        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-8 group-hover:scale-110 transition-transform"><Users2 className="w-8 h-8" /></div>
                        <h4 className="text-2xl font-bold mb-4 text-slate-900">Signing Agencies</h4>
                        <p className="text-slate-500 leading-relaxed">Coordinate team dispatch, centralize records, and scale operations with standardized processes.</p>
                    </div>
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
    </>
  );
}
EOF

# src/pages/Legal.jsx
cat << 'EOF' > src/pages/Legal.jsx
import React from 'react';

export const LegalContent = ({ type }) => {
    const titles = { privacy: "Privacy Policy", terms: "Terms of Service", security: "Security Overview" };
    return (
        <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
            <p className="text-sm text-slate-400">Last Updated: October 24, 2026</p>
            <p>Welcome to NotaryPro. This document outlines the {titles[type]?.toLowerCase()} for our platform.</p>
            
            <h3 className="text-xl font-bold text-slate-800 mt-8">1. Overview</h3>
            <p>We take your data and compliance seriously. By using NotaryPro, you agree to adhere to all local state laws regarding notarization.</p>
            
            <h3 className="text-xl font-bold text-slate-800 mt-8">2. Data Protection</h3>
            <p>All data is encrypted using AES-256 standards. We do not sell your data to third parties. We utilize SOC 2 Type II compliant infrastructure to ensure the highest level of security for your client's PII.</p>
            
            <h3 className="text-xl font-bold text-slate-800 mt-8">3. User Responsibilities</h3>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must ensure that your digital journal entries comply with your specific state's Secretary of State regulations.</p>
            
            <h3 className="text-xl font-bold text-slate-800 mt-8">4. Service Availability</h3>
            <p>While we strive for 99.9% uptime, we are not liable for business interruptions caused by server outages or third-party service failures.</p>
        </div>
    );
};
EOF

# src/pages/Auth.jsx
cat << 'EOF' > src/pages/Auth.jsx
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
EOF

# src/pages/Onboarding.jsx
cat << 'EOF' > src/pages/Onboarding.jsx
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
EOF

# src/App.jsx
cat << 'EOF' > src/App.jsx
import React, { useState, useEffect } from 'react';
import LandingPage from './pages/Landing';
import AuthScreen from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import { Modal, PageControl } from './components/UI';
import { LegalContent } from './pages/Legal';

export default function App() {
  const [view, setView] = useState('landing'); 
  const [legalModal, setLegalModal] = useState(null); // 'terms' | 'privacy' | 'security' | null

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  return (
    <>
        {/* Global Legal Modal */}
        <Modal 
            isOpen={!!legalModal} 
            onClose={() => setLegalModal(null)} 
            title={legalModal === 'terms' ? 'Terms of Service' : legalModal === 'privacy' ? 'Privacy Policy' : 'Security Overview'}
        >
            {legalModal && <LegalContent type={legalModal} />}
        </Modal>

        {view === 'login' && (
            <AuthScreen 
                mode="login" 
                onComplete={() => setView('dashboard')} 
                onSwitchMode={() => setView('signup')} 
                onBack={() => setView('landing')} 
            />
        )}

        {view === 'signup' && (
            <AuthScreen 
                mode="signup" 
                onComplete={() => setView('onboarding')} 
                onSwitchMode={() => setView('login')} 
                onBack={() => setView('landing')} 
            />
        )}

        {view === 'onboarding' && (
            <Onboarding onComplete={() => setView('dashboard')} />
        )}

        {view === 'dashboard' && (
            <Dashboard onLogout={() => setView('landing')} />
        )}

        {view === 'landing' && (
            <>
                <LandingPage 
                    onNavigate={setView} 
                    onOpenLegal={setLegalModal} 
                />
                <PageControl />
            </>
        )}
    </>
  );
}
EOF

echo "Project setup complete! Run 'npm install' then 'npm run dev'."