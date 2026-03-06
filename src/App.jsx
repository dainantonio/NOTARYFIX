import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import GatedRoute from './components/GatedRoute';
import { useData } from './context/DataContext';
import AppErrorBoundary from './components/AppErrorBoundary';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
// Public
const Landing        = lazy(() => import('./pages/Landing'));
const Auth           = lazy(() => import('./pages/Auth'));
const Onboarding     = lazy(() => import('./pages/Onboarding'));
const Compliance     = lazy(() => import('./pages/Legal'));
const Credentials    = lazy(() => import('./pages/Credentials'));
const Pricing        = lazy(() => import('./pages/Pricing'));
const NavFeaturePaywall = lazy(() => import('./pages/NavFeaturePaywall'));
const PublicSignerView  = lazy(() => import('./pages/PublicSignerView'));

// Core app
const Dashboard      = lazy(() => import('./pages/Dashboard'));
const Schedule       = lazy(() => import('./pages/Schedule'));
const Clients        = lazy(() => import('./pages/Clients'));
const Invoices       = lazy(() => import('./pages/Invoices'));
const Journal        = lazy(() => import('./pages/Journal'));
const ArriveMode     = lazy(() => import('./pages/ArriveMode'));
const Settings       = lazy(() => import('./pages/Settings'));
const Mileage        = lazy(() => import('./pages/mileage'));
const FormGuide      = lazy(() => import('./pages/FormGuide'));

// FIX 3: Public payment page for /pay/:invoiceId links
const PayInvoicePage = lazy(() => import('./pages/PayInvoicePage'));

// Gated / admin
const SignerPortal   = lazy(() => import('./pages/SignerPortal'));
const TeamDispatch   = lazy(() => import('./pages/TeamDispatch'));
const AITrainer      = lazy(() => import('./pages/AITrainer'));
const Admin          = lazy(() => import('./pages/Admin'));
const AgentPage      = lazy(() => import('./pages/AgentPage'));
const AuditPage      = lazy(() => import('./pages/AuditPage'));
const ReviewQueuePage = lazy(() => import('./pages/ReviewQueuePage'));
const FAQPage         = lazy(() => import('./pages/FAQPage'));
const JobInboxPage = lazy(() => import('./pages/JobInboxPage'));

// ─── Loading fallback ─────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-950">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-gray-400 font-medium">Loading…</span>
    </div>
  </div>
);

// ─── Public routes — no Layout wrapper, no auth check ────────────────────────
const PUBLIC_ROUTES = ['/', '/auth', '/onboarding', '/legal', '/pricing', '/feature-paywall'];

// ─── Guard: redirect new users to onboarding, protect app routes ──────────────
const RouteGuard = ({ children }) => {
  const location = useLocation();
  const { data } = useData();
  const isPublic =
    PUBLIC_ROUTES.includes(location.pathname) ||
    location.pathname.startsWith('/portal') ||
    location.pathname.startsWith('/pay/'); // FIX 3: payment pages are public
  const onboarded = data.settings?.onboardingComplete;

  if (!isPublic && !onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  if (onboarded && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ─── Layout wrapper — hide sidebar shell on public pages ─────────────────────
const AppLayout = ({ children }) => {
  const location = useLocation();
  if (
    PUBLIC_ROUTES.includes(location.pathname) ||
    location.pathname.startsWith('/portal') ||
    location.pathname.startsWith('/pay/') // FIX 3: payment page has no sidebar
  ) return children;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AppErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public signer portal — no auth, no layout */}
            <Route path="/portal/:id" element={<PublicSignerView />} />

            {/* FIX 3: Public payment page — no auth, no layout */}
            <Route path="/pay/:invoiceId" element={<PayInvoicePage />} />

            {/* All other routes */}
            <Route path="/*" element={
              <RouteGuard>
                <AppLayout>
                  <Routes>
                    {/* Public */}
                    <Route path="/"                element={<Landing />} />
                    <Route path="/auth"            element={<Auth />} />
                    <Route path="/onboarding"      element={<Onboarding />} />
                    <Route path="/legal"           element={<Compliance />} />
                    <Route path="/compliance"      element={<Credentials />} />
                    <Route path="/credentials"     element={<Credentials />} />
                    <Route path="/pricing"         element={<Pricing />} />
                    <Route path="/feature-paywall" element={<NavFeaturePaywall />} />

                    {/* Core app */}
                    <Route path="/dashboard"       element={<Dashboard />} />
                    <Route path="/schedule"        element={<Schedule />} />
                    <Route path="/clients"         element={<Clients />} />
                    <Route path="/invoices"        element={<Invoices />} />
                    <Route path="/journal"         element={<Journal />} />
                    <Route path="/arrive/:id"      element={<ArriveMode />} />
                    <Route path="/settings"        element={<Settings />} />
                    <Route path="/mileage"         element={<Mileage />} />
                    <Route path="/job-inbox"       element={<JobInboxPage />} />

                    {/* FIX 5: /form-guide is PRO — gate it */}
                    <Route path="/form-guide"      element={<GatedRoute featureKey="formGuide"><FormGuide /></GatedRoute>} />

                    {/* Gated */}
                    <Route path="/signer-portal"   element={<GatedRoute featureKey="signerPortal"><SignerPortal /></GatedRoute>} />
                    <Route path="/team-dispatch"   element={<GatedRoute featureKey="teamDispatch"><TeamDispatch /></GatedRoute>} />
                    <Route path="/ai-trainer"      element={<GatedRoute featureKey="aiTrainer"><AITrainer /></GatedRoute>} />

                    {/* FIX 5: /admin, /agent, /review are gated — wrap with GatedRoute */}
                    <Route path="/admin"           element={<GatedRoute featureKey="admin"><Admin /></GatedRoute>} />
                    <Route path="/agent"           element={<GatedRoute featureKey="agent"><AgentPage /></GatedRoute>} />
                    <Route path="/audit"           element={<GatedRoute featureKey="agent"><AuditPage /></GatedRoute>} />
                    <Route path="/review"          element={<GatedRoute featureKey="agent"><ReviewQueuePage /></GatedRoute>} />

                    {/* Catch-all */}
                    <Route path="/faq"  element={<FAQPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              </RouteGuard>
            } />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    </Router>
  );
}

export default App;
