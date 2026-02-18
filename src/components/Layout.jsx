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
        <div onClick={() => onNavigate('landing')} className="cursor-pointer">
          <Logo />
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          {[
            { id: 'features', label: 'Features' },
            { id: 'how', label: 'How it Works' },
            { id: 'pricing', label: 'Pricing' },
            { id: 'faq', label: 'FAQ' }
          ].map(item => (
            <a 
                key={item.id}
                href={`#${item.id}`} 
                className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
            >
                {item.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => onNavigate('login')}>Log In</Button>
          <Button size="sm" onClick={() => onNavigate('signup')}>Start Free Trial</Button>
        </div>

        <button className="md:hidden text-slate-600 p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl p-6 flex flex-col gap-4 animate-fade-in z-50">
            <a href="#features" className="text-base font-medium text-slate-700 py-2 border-b border-slate-100">Features</a>
            <a href="#how" className="text-base font-medium text-slate-700 py-2 border-b border-slate-100">How it Works</a>
            <a href="#pricing" className="text-base font-medium text-slate-700 py-2 border-b border-slate-100">Pricing</a>
            <div className="pt-4 flex flex-col gap-3">
                <Button variant="secondary" className="w-full" onClick={() => onNavigate('login')}>Log In</Button>
                <Button className="w-full" onClick={() => onNavigate('signup')}>Start Free Trial</Button>
            </div>
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
            <a key={i} href="#" className="w-10 h-10 bg-slate-900 rounded-full hover:bg-brand-600 hover:text-white transition-all duration-300 flex items-center justify-center border border-slate-800">
                <Icon className="w-4 h-4" />
            </a>
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
          <li className="flex items-center gap-2 text-emerald-500 cursor-default font-medium">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            System Operational
          </li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
      <p>© 2026 NotaryPro Inc. SOC 2 Type II Compliant.</p>
      <div className="flex gap-6 mt-4 md:mt-0">
        <span>San Francisco, CA</span>
      </div>
    </div>
  </footer>
);
