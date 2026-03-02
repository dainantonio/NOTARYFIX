import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    
    // Don't show if dismissed in this session
    if (sessionStorage.getItem('pwa-banner-dismissed')) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
    if (outcome === 'accepted') {
      sessionStorage.setItem('pwa-banner-dismissed', '1');
    }
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-center gap-3 rounded-2xl border border-blue-500/30 bg-slate-900 p-4 shadow-2xl shadow-black/50">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Install NotaryFix</p>
          <p className="text-xs text-slate-400">Add to home screen for quick access</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
