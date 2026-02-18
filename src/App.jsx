import React, { useState, useEffect } from 'react';
import LandingPage from './pages/Landing';
import AuthScreen from './pages/Auth';
import Onboarding from './pages/Onboarding';
import { Modal } from './components/UI';
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
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Dashboard Placeholder</h1>
                    <p className="text-slate-500 mb-4">You are authenticated.</p>
                    <button 
                        onClick={() => setView('landing')} 
                        className="text-brand-600 hover:underline"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        )}

        {view === 'landing' && (
            <LandingPage 
                onNavigate={setView} 
                onOpenLegal={setLegalModal} 
            />
        )}
    </>
  );
}
