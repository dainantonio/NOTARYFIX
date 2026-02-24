import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import Mileage from './pages/mileage';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Legal from './pages/Legal';
import Pricing from './pages/Pricing';
import SignerPortal from './pages/SignerPortal';
import Journal from './pages/Journal';
import ArriveMode from './pages/ArriveMode';
import TeamDispatch from './pages/TeamDispatch';
import AITrainer from './pages/AITrainer';
import Admin from './pages/Admin';
import GatedRoute from './components/GatedRoute';
import { useData } from './context/DataContext';
import FormGuide from './pages/FormGuide';
// in routes:
<Route path="/form-guide" element={<FormGuide />} />

// ─── Public routes — no Layout wrapper, no auth check ────────────────────────
const PUBLIC_ROUTES = ['/', '/auth', '/onboarding', '/legal', '/pricing'];

// ─── Guard: redirect new users to onboarding, protect app routes ──────────────
const RouteGuard = ({ children }) => {
  const location = useLocation();
  const { data } = useData();
  const isPublic = PUBLIC_ROUTES.includes(location.pathname);
  const onboarded = data.settings?.onboardingComplete;

  // On a protected route but onboarding not done → send to onboarding
  if (!isPublic && !onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

// ─── Layout wrapper — hide sidebar shell on public pages ─────────────────────
const AppLayout = ({ children }) => {
  const location = useLocation();
  if (PUBLIC_ROUTES.includes(location.pathname)) return children;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <RouteGuard>
        <AppLayout>
          <Routes>
            {/* Public */}
            <Route path="/"            element={<Landing />} />
            <Route path="/auth"        element={<Auth />} />
            <Route path="/onboarding"  element={<Onboarding />} />
            <Route path="/legal"       element={<Legal />} />
            <Route path="/compliance"  element={<Legal />} />
            <Route path="/pricing"     element={<Pricing />} />

            {/* App */}
            <Route path="/dashboard"   element={<Dashboard />} />
            <Route path="/schedule"    element={<Schedule />} />
            <Route path="/clients"     element={<Clients />} />
            <Route path="/invoices"    element={<Invoices />} />
            <Route path="/journal"     element={<Journal />} />
            <Route path="/arrive/:id"   element={<ArriveMode />} />
            <Route path="/settings"    element={<Settings />} />
            <Route path="/mileage"     element={<Mileage />} />

            {/* Gated */}
            <Route path="/signer-portal"  element={<GatedRoute featureKey="signerPortal"><SignerPortal /></GatedRoute>} />
            <Route path="/team-dispatch"  element={<GatedRoute featureKey="teamDispatch"><TeamDispatch /></GatedRoute>} />
            <Route path="/ai-trainer"     element={<GatedRoute featureKey="aiTrainer"><AITrainer /></GatedRoute>} />
            <Route path="/admin"          element={<Admin />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </RouteGuard>
    </Router>
  );
}

export default App;
