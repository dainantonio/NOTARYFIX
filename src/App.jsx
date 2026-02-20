import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Legal from './pages/Legal';

// A wrapper to intelligently hide the Dashboard Layout when on Landing/Auth pages
const AppLayout = ({ children }) => {
  const location = useLocation();
  const publicRoutes = ['/', '/auth', '/legal'];
  
  if (publicRoutes.includes(location.pathname)) {
    return <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">{children}</div>;
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

          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
