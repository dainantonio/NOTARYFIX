#!/bin/bash

echo "🛠️ Fixing Dashboard Wiring..."

# 1. REVERT APP.JSX TO SAFE MODE
# -----------------------------------------------------------------------------
# This version REMOVES imports for Landing/Auth/Legal to prevent crashes.
# It directs everything to the Dashboard.
echo "Rewriting src/App.jsx..."
cat << 'EOF' > src/App.jsx
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
EOF

# 2. ENSURE MAIN ENTRY IS CORRECT
# -----------------------------------------------------------------------------
echo "Ensuring src/main.jsx is valid..."
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

# 3. ENSURE INTERACTIVE DASHBOARD IS PRESENT
# -----------------------------------------------------------------------------
# Just in case the previous revert lost the interactive logic, we write it again.
echo "Ensuring Dashboard.jsx has interactive logic..."
cat << 'EOF' > src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { 
  Users, 
  FileSignature, 
  DollarSign, 
  MapPin, 
  Plus, 
  Calendar as CalendarIcon, 
  ChevronRight, 
  Clock,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../components/UI';
import AppointmentModal from '../components/AppointmentModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const revenueData = [
  { name: 'Jan', amount: 2400 },
  { name: 'Feb', amount: 1398 },
  { name: 'Mar', amount: 9800 },
  { name: 'Apr', amount: 3908 },
  { name: 'May', amount: 4800 },
  { name: 'Jun', amount: 3800 },
];

const StatsCard = ({ title, value, change, icon: Icon, trend }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-500 text-sm font-medium">{title}</span>
        <div className="p-2 bg-slate-50 rounded-lg">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      </div>
      <p className={`text-xs mt-1 font-medium ${
        trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
      }`}>
        {change}
      </p>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [appointments, setAppointments] = useState([
    { id: 1, client: 'Sarah Johnson', type: 'Loan Signing', date: 'Today', time: '2:00 PM', status: 'upcoming', amount: 150 },
    { id: 2, client: 'TechCorp Inc', type: 'I-9 Verification', date: 'Today', time: '4:30 PM', status: 'upcoming', amount: 45 },
    { id: 3, client: 'Michael Smith', type: 'Power of Attorney', date: 'Yesterday', time: '10:00 AM', status: 'completed', amount: 75 },
  ]);

  const totalRevenue = 12450 + appointments.reduce((sum, apt) => sum + (typeof apt.amount === 'number' ? apt.amount : 0), 0);
  const completedSignings = 48 + appointments.filter(a => a.status === 'completed').length;
  const upcomingCount = appointments.filter(a => a.status === 'upcoming').length;

  const handleSaveAppointment = (data) => {
    const newApt = {
      id: Date.now(),
      client: data.client,
      type: data.type,
      date: 'Upcoming', 
      time: data.time,
      status: 'upcoming',
      amount: parseFloat(data.fee) || 0
    };
    setAppointments([newApt, ...appointments]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveAppointment}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            You have <span className="font-semibold text-blue-600">{upcomingCount} upcoming appointments</span> today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="default">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Schedule
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} change="+12.5%" icon={DollarSign} trend="up" />
        <StatsCard title="Signings Completed" value={completedSignings} change="+4 this week" icon={FileSignature} trend="up" />
        <StatsCard title="Miles Drove" value="842" change="Tax Ded: $564" icon={MapPin} trend="neutral" />
        <StatsCard title="Active Clients" value="124" change="+8 this month" icon={Users} trend="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" className="text-blue-600">View Calendar</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <div key={apt.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        apt.status === 'upcoming' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' : 'bg-green-50 text-green-600 group-hover:bg-green-100'
                      }`}>
                        {apt.status === 'upcoming' ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{apt.client}</p>
                        <p className="text-sm text-slate-500">{apt.type} • {apt.date} at {apt.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">${apt.amount}</p>
                      <Badge variant={apt.status === 'upcoming' ? 'blue' : 'success'}>
                        {apt.status === 'upcoming' ? 'Scheduled' : 'Completed'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Revenue Overview</CardTitle>
              <select className="text-sm border-slate-200 rounded-md text-slate-600 focus:ring-blue-500">
                <option>Last 6 Months</option>
              </select>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-slate-900 text-white border-slate-800">
            <CardHeader className="border-slate-800"><CardTitle className="text-white">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <button onClick={() => setIsModalOpen(true)} className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors group">
                <span className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-md group-hover:bg-blue-400 transition-colors"><Plus className="w-4 h-4" /></div>
                  <span className="font-medium">New Appointment</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors group">
                <span className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-md group-hover:bg-purple-400 transition-colors"><Users className="w-4 h-4" /></div>
                  <span className="font-medium">Add New Client</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors group">
                <span className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-md group-hover:bg-emerald-400 transition-colors"><MapPin className="w-4 h-4" /></div>
                  <span className="font-medium">Log Mileage</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Tasks & Reminders</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { text: 'Confirm appointment with Sarah', done: false },
                  { text: 'Send invoice to TechCorp', done: true },
                  { text: 'Update notary journal logs', done: false },
                  { text: 'Order new stamp ink', done: false },
                ].map((task, i) => (
                  <label key={i} className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" defaultChecked={task.done} className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className={`text-sm ${task.done ? 'text-slate-400 line-through' : 'text-slate-600 group-hover:text-slate-900'}`}>{task.text}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
EOF

echo "✅ Dashboard restored! The blank page issue should be resolved."