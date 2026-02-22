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
import Legal from './pages/Legal';
import Pricing from './pages/Pricing';
import SignerPortal from './pages/SignerPortal';
import Journal from './pages/Journal';
import TeamDispatch from './pages/TeamDispatch';
import AITrainer from './pages/AITrainer';
import Admin from './pages/Admin';
import GatedRoute from './components/GatedRoute';

// A wrapper to intelligently hide the Dashboard Layout when on Landing/Auth pages
const AppLayout = ({ children }) => {
  const location = useLocation();
  const publicRoutes = ['/', '/auth', '/legal', '/pricing'];
  
  if (publicRoutes.includes(location.pathname)) {
    return children;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/compliance" element={<Legal />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/signer-portal" element={<GatedRoute featureKey="signerPortal"><SignerPortal /></GatedRoute>} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/team-dispatch" element={<GatedRoute featureKey="teamDispatch"><TeamDispatch /></GatedRoute>} />
          <Route path="/ai-trainer" element={<GatedRoute featureKey="aiTrainer"><AITrainer /></GatedRoute>} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/mileage" element={<Mileage />} />
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
