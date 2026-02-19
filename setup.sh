#!/bin/bash

echo "🚀 Implementing Full SaaS Modules..."
echo "📅 Building Schedule, Clients, and Invoices pages..."

# 1. CREATE SCHEDULE PAGE (Calendar View)
# -----------------------------------------------------------------------------
echo "📅 Creating src/pages/Schedule.jsx..."
cat << 'EOF' > src/pages/Schedule.jsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../components/UI';
import AppointmentModal from '../components/AppointmentModal';

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock days generation
  const daysInMonth = new Array(31).fill(null).map((_, i) => i + 1);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Mock appointments scattered across the month
  const appointments = [
    { day: 5, title: 'Loan Signing', time: '2:00 PM', client: 'Sarah Johnson' },
    { day: 12, title: 'I-9 Verify', time: '10:00 AM', client: 'TechCorp' },
    { day: 12, title: 'Refinance', time: '1:00 PM', client: 'Estate Realty' },
    { day: 24, title: 'General Notary', time: '4:30 PM', client: 'Michael Smith' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <AppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={() => {}} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Schedule</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your upcoming appointments and availability.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 mr-2">
             <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" /></button>
             <span className="px-4 font-medium text-slate-900 dark:text-white">October 2025</span>
             <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" /></button>
           </div>
           <Button onClick={() => setIsModalOpen(true)}>
             <Plus className="w-4 h-4 mr-2" /> New Event
           </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Calendar Grid Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
            {weekDays.map(day => (
              <div key={day} className="py-3 text-center text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid Body */}
          <div className="grid grid-cols-7 auto-rows-[120px] divide-x divide-slate-200 dark:divide-slate-700 border-b border-slate-200 dark:border-slate-700 last:border-0">
             {/* Offset for start of month (mock) */}
             <div className="bg-slate-50/50 dark:bg-slate-800/50"></div>
             <div className="bg-slate-50/50 dark:bg-slate-800/50"></div>

             {daysInMonth.map(day => {
               const dayApts = appointments.filter(a => a.day === day);
               return (
                 <div key={day} className="p-2 relative hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group border-b border-slate-200 dark:border-slate-700">
                   <span className={`text-sm font-medium ${day === 24 ? 'bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-full' : 'text-slate-700 dark:text-slate-300'}`}>
                     {day}
                   </span>
                   <div className="mt-2 space-y-1">
                     {dayApts.map((apt, i) => (
                       <div key={i} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-1.5 rounded border-l-2 border-blue-500 truncate cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                         {apt.time} - {apt.title}
                       </div>
                     ))}
                   </div>
                   {/* Add Button on Hover */}
                   <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-slate-500 transition-all">
                     <Plus className="w-4 h-4" />
                   </button>
                 </div>
               );
             })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Schedule;
EOF

# 2. CREATE CLIENTS PAGE (CRM Table)
# -----------------------------------------------------------------------------
echo "👥 Creating src/pages/Clients.jsx..."
cat << 'EOF' > src/pages/Clients.jsx
import React from 'react';
import { Search, MoreHorizontal, Mail, Phone, Plus, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../components/UI';

const Clients = () => {
  const clients = [
    { id: 1, name: 'TechCorp Inc', contact: 'Sarah Smith', email: 'sarah@techcorp.com', phone: '(555) 123-4567', type: 'Corporate', status: 'Active', lastActive: '2 days ago' },
    { id: 2, name: 'Estate Realty', contact: 'Mike Johnson', email: 'mike@estate.com', phone: '(555) 987-6543', type: 'Title Company', status: 'Active', lastActive: '5 days ago' },
    { id: 3, name: 'John Doe', contact: 'John Doe', email: 'john.doe@gmail.com', phone: '(555) 456-7890', type: 'Individual', status: 'Inactive', lastActive: '1 month ago' },
    { id: 4, name: 'Legal Partners LLP', contact: 'Jane Doe', email: 'jane@legalpartners.com', phone: '(555) 111-2222', type: 'Law Firm', status: 'Active', lastActive: '1 week ago' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Clients</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your relationships and contact details.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Add Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search clients..." 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
             </div>
             <Button variant="secondary" size="icon"><Filter className="w-4 h-4" /></Button>
             <Button variant="secondary" size="icon"><Download className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Client Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{client.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{client.contact}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{client.type}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs">
                        <Mail className="w-3 h-3" /> {client.email}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs">
                        <Phone className="w-3 h-3" /> {client.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={client.status === 'Active' ? 'success' : 'default'}>{client.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{client.lastActive}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Clients;
EOF

# 3. CREATE INVOICES PAGE (Financial Hub)
# -----------------------------------------------------------------------------
echo "💸 Creating src/pages/Invoices.jsx..."
cat << 'EOF' > src/pages/Invoices.jsx
import React from 'react';
import { Plus, Download, Filter, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../components/UI';

const Invoices = () => {
  const invoices = [
    { id: 'INV-1024', client: 'Estate Realty', amount: 150.00, date: 'Oct 24, 2025', status: 'Paid', due: 'Oct 24, 2025' },
    { id: 'INV-1023', client: 'TechCorp Inc', amount: 450.00, date: 'Oct 22, 2025', status: 'Pending', due: 'Nov 01, 2025' },
    { id: 'INV-1022', client: 'Sarah Johnson', amount: 75.00, date: 'Oct 20, 2025', status: 'Overdue', due: 'Oct 21, 2025' },
    { id: 'INV-1021', client: 'Legal Partners LLP', amount: 200.00, date: 'Oct 15, 2025', status: 'Paid', due: 'Oct 15, 2025' },
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Paid': return <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Paid</Badge>;
      case 'Pending': return <Badge variant="warning" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'Overdue': return <Badge variant="danger" className="gap-1"><AlertCircle className="w-3 h-3" /> Overdue</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Invoices</h1>
          <p className="text-slate-500 dark:text-slate-400">Track payments and manage billing.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-none text-white">
          <CardContent className="p-6 text-white">
            <p className="text-blue-100 font-medium mb-1">Total Revenue (This Month)</p>
            <h3 className="text-3xl font-bold">$4,250.00</h3>
          </CardContent>
        </Card>
        <Card>
           <CardContent className="p-6">
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Pending</p>
            <h3 className="text-3xl font-bold text-amber-500">$850.00</h3>
          </CardContent>
        </Card>
        <Card>
           <CardContent className="p-6">
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Overdue</p>
            <h3 className="text-3xl font-bold text-red-500">$75.00</h3>
          </CardContent>
        </Card>
      </div>

      <Card>
         <CardHeader>
           <div className="flex items-center gap-4">
             <CardTitle>Recent Invoices</CardTitle>
             <div className="flex gap-2">
               <Badge variant="default" className="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600">All</Badge>
               <Badge variant="default" className="bg-transparent border-transparent text-slate-500 hover:text-slate-700 cursor-pointer">Paid</Badge>
               <Badge variant="default" className="bg-transparent border-transparent text-slate-500 hover:text-slate-700 cursor-pointer">Pending</Badge>
             </div>
           </div>
         </CardHeader>
         <CardContent className="p-0">
           <table className="w-full text-left text-sm">
             <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
               <tr>
                 <th className="px-6 py-4">Invoice ID</th>
                 <th className="px-6 py-4">Client</th>
                 <th className="px-6 py-4">Date Issued</th>
                 <th className="px-6 py-4">Due Date</th>
                 <th className="px-6 py-4">Amount</th>
                 <th className="px-6 py-4">Status</th>
                 <th className="px-6 py-4 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
               {invoices.map((inv) => (
                 <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                   <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400">{inv.id}</td>
                   <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{inv.client}</td>
                   <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{inv.date}</td>
                   <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{inv.due}</td>
                   <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">${inv.amount.toFixed(2)}</td>
                   <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                   <td className="px-6 py-4 text-right">
                     <Button variant="ghost" size="sm">
                       <Download className="w-4 h-4" />
                     </Button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;
EOF

# 4. UPDATE APP ROUTING
# -----------------------------------------------------------------------------
echo "🔗 Wiring new pages into src/App.jsx..."
cat << 'EOF' > src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
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

// Placeholder components for routes not yet built
const Placeholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[50vh] text-center">
    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{title}</h2>
    <p className="text-slate-500 dark:text-slate-400">This module is coming in the next update.</p>
  </div>
);

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
          <Route path="/settings" element={<Placeholder title="Settings" />} />
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
EOF

echo "✅ All Modules Implemented! You can now navigate to Schedule, Clients, and Invoices."
