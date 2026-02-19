import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

// Simple placeholder for pages that aren't ready yet
const Placeholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[50vh] text-center">
    <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
    <p className="text-slate-500">This module is being built.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Redirect root to dashboard immediately */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* The Main Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Safe Placeholders for unwired pages */}
          <Route path="/auth" element={<Placeholder title="Login Page" />} />
          <Route path="/legal" element={<Placeholder title="Legal Page" />} />
          <Route path="/schedule" element={<Placeholder title="Schedule" />} />
          <Route path="/clients" element={<Placeholder title="Clients" />} />
          <Route path="/invoices" element={<Placeholder title="Invoices" />} />
          <Route path="/settings" element={<Placeholder title="Settings" />} />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
