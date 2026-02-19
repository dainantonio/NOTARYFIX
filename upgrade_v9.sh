#!/bin/bash

echo "🔗 Initiating V9 Upgrade: Wiring the Nervous System..."
echo "⚡ Connecting Schedule, Clients, Invoices, and Settings to Global Data..."

# 1. UPGRADE SCHEDULE TO USE GLOBAL DATA
# -----------------------------------------------------------------------------
echo "📅 Updating src/pages/Schedule.jsx..."
cat << 'EOF' > src/pages/Schedule.jsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Card, CardContent, Button } from '../components/UI';
import AppointmentModal from '../components/AppointmentModal';
import { useData } from '../context/DataContext';

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, addAppointment } = useData();

  // Mock days generation for the current view
  const daysInMonth = new Array(31).fill(null).map((_, i) => i + 1);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleSaveAppointment = (formData) => {
    const newApt = {
      id: Date.now(),
      client: formData.client,
      type: formData.type,
      date: formData.date || new Date().toISOString().split('T')[0], 
      time: formData.time,
      status: 'upcoming',
      amount: parseFloat(formData.fee) || 0,
      location: formData.location || 'TBD'
    };
    addAppointment(newApt);
  };

  // Helper to safely extract day from YYYY-MM-DD
  const getDayFromDate = (dateString) => {
    if (!dateString || dateString === 'Upcoming' || dateString === 'Today' || dateString === 'Yesterday') return 15; // fallback for old mock data
    const parts = dateString.split('-');
    return parts.length === 3 ? parseInt(parts[2], 10) : 15;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <AppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveAppointment} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Schedule</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your upcoming appointments and availability.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 mr-2">
             <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" /></button>
             <span className="px-4 font-medium text-slate-900 dark:text-white">
               {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
             </span>
             <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" /></button>
           </div>
           <Button onClick={() => setIsModalOpen(true)}>
             <Plus className="w-4 h-4 mr-2" /> New Event
           </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
            {weekDays.map(day => (
              <div key={day} className="py-3 text-center text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 auto-rows-[120px] divide-x divide-slate-200 dark:divide-slate-700 border-b border-slate-200 dark:border-slate-700 last:border-0">
             {/* Offset for start of month (mock) */}
             <div className="bg-slate-50/50 dark:bg-slate-800/50"></div>
             <div className="bg-slate-50/50 dark:bg-slate-800/50"></div>

             {daysInMonth.map(day => {
               // Filter global appointments for this day
               const dayApts = data.appointments.filter(a => getDayFromDate(a.date) === day);
               const isToday = day === new Date().getDate();

               return (
                 <div key={day} className="p-2 relative hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group border-b border-slate-200 dark:border-slate-700">
                   <span className={`text-sm font-medium ${isToday ? 'bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-full' : 'text-slate-700 dark:text-slate-300'}`}>
                     {day}
                   </span>
                   <div className="mt-2 space-y-1 overflow-y-auto max-h-[70px] scrollbar-hide">
                     {dayApts.map((apt, i) => (
                       <div key={i} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-1.5 rounded border-l-2 border-blue-500 truncate cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors" title={`${apt.time} - ${apt.client}`}>
                         {apt.time} - {apt.client}
                       </div>
                     ))}
                   </div>
                   <button onClick={() => setIsModalOpen(true)} className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-slate-500 transition-all">
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

# 2. UPGRADE CLIENTS TO USE GLOBAL DATA
# -----------------------------------------------------------------------------
echo "👥 Updating src/pages/Clients.jsx..."
cat << 'EOF' > src/pages/Clients.jsx
import React from 'react';
import { Search, MoreHorizontal, Mail, Phone, Plus, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, Button, Badge } from '../components/UI';
import { useData } from '../context/DataContext';

const Clients = () => {
  const { data } = useData();
  const clients = data.clients || [];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
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

# 3. UPGRADE INVOICES TO USE GLOBAL DATA
# -----------------------------------------------------------------------------
echo "💸 Updating src/pages/Invoices.jsx..."
cat << 'EOF' > src/pages/Invoices.jsx
import React, { useState } from 'react';
import { Plus, Download, CheckCircle2, Clock, AlertCircle, LayoutGrid, List as ListIcon, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../components/UI';
import { useData } from '../context/DataContext';

const Invoices = () => {
  const [viewMode, setViewMode] = useState('board');
  const { data } = useData();
  const invoices = data.invoices || [];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Paid': return <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Paid</Badge>;
      case 'Pending': return <Badge variant="warning" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'Overdue': return <Badge variant="danger" className="gap-1"><AlertCircle className="w-3 h-3" /> Overdue</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const columns = {
    'Draft': invoices.filter(i => i.status === 'Draft'),
    'Pending': invoices.filter(i => i.status === 'Pending'),
    'Overdue': invoices.filter(i => i.status === 'Overdue'),
    'Paid': invoices.filter(i => i.status === 'Paid'),
  };

  const totalCollected = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const totalOutstanding = invoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'Overdue').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Invoices</h1>
          <p className="text-slate-500 dark:text-slate-400">Track payments and manage billing pipeline.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}><ListIcon className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('board')} className={`p-2 rounded-md transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}><LayoutGrid className="w-4 h-4" /></button>
          </div>
          <Button variant="secondary" className="hidden sm:flex"><Download className="w-4 h-4 mr-2" /> Export</Button>
          <Button><Plus className="w-4 h-4 mr-2" /> Create Invoice</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-none text-white shadow-lg shadow-blue-500/20">
          <CardContent className="p-6 text-white">
            <p className="text-blue-100 font-medium mb-1 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Collected</p>
            <h3 className="text-3xl font-bold">${totalCollected.toFixed(2)}</h3>
          </CardContent>
        </Card>
        <Card>
           <CardContent className="p-6">
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-2"><Clock className="w-4 h-4" /> Outstanding</p>
            <h3 className="text-3xl font-bold text-amber-500">${totalOutstanding.toFixed(2)}</h3>
          </CardContent>
        </Card>
        <Card>
           <CardContent className="p-6">
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Overdue</p>
            <h3 className="text-3xl font-bold text-red-500">${totalOverdue.toFixed(2)}</h3>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'list' ? (
        <Card>
           <CardHeader><CardTitle>All Invoices</CardTitle></CardHeader>
           <CardContent className="p-0 overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                 <tr>
                   <th className="px-6 py-4">Invoice ID</th>
                   <th className="px-6 py-4">Client</th>
                   <th className="px-6 py-4">Date</th>
                   <th className="px-6 py-4">Amount</th>
                   <th className="px-6 py-4">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                 {invoices.map((inv) => (
                   <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                     <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400">{inv.id}</td>
                     <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{inv.client}</td>
                     <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{inv.date}</td>
                     <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">${inv.amount.toFixed(2)}</td>
                     <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(columns).map(([title, items]) => (
            <div key={title} className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400">{items.length}</span>
              </div>
              <div className="flex flex-col gap-3 min-h-[200px]">
                {items.length === 0 ? (
                  <div className="h-24 rounded-lg border-2 border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400">No invoices</div>
                ) : (
                  items.map(inv => (
                    <Card key={inv.id} className="p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-slate-400">{inv.id}</span>
                        {getStatusBadge(inv.status)}
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1">{inv.client}</h4>
                      <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">${inv.amount.toFixed(2)}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3" /> Due {inv.due}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Invoices;
EOF

# 4. UPGRADE SETTINGS TO WRITE TO GLOBAL DATA
# -----------------------------------------------------------------------------
echo "⚙️  Updating src/pages/Settings.jsx..."
cat << 'EOF' > src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { User, Building, Bell, Save, LogOut, Moon, Sun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '../components/UI';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { theme, toggleTheme } = useTheme();
  const { data, updateSettings } = useData();
  
  const [formData, setFormData] = useState(data.settings);

  // Sync if global data updates elsewhere
  useEffect(() => {
    setFormData(data.settings);
  }, [data.settings]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'preferences', label: 'Preferences', icon: Bell },
  ];

  const handleSave = () => {
    updateSettings(formData);
    // Real app would show a Toast here
    alert('Settings Saved Successfully!');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your account and business preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
            <div className="my-2 border-t border-slate-200 dark:border-slate-700 hidden md:block"></div>
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors w-full text-left">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </nav>
        </div>

        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader><CardTitle>Public Profile</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-500 dark:text-slate-400">
                    {formData.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-2">
                    <Button variant="secondary" size="sm">Upload New Picture</Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'business' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Financial & Metrics</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Business Legal Name</Label>
                    <Input value={formData.businessName} onChange={(e) => setFormData({...formData, businessName: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <Label>Mileage Rate ($)</Label>
                       <Input type="number" step="0.01" value={formData.costPerMile} onChange={(e) => setFormData({...formData, costPerMile: parseFloat(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                       <Label>Est. Tax Rate (%)</Label>
                       <Input type="number" value={formData.taxRate} onChange={(e) => setFormData({...formData, taxRate: parseInt(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                       <Label>Monthly Goal ($)</Label>
                       <Input type="number" value={formData.monthlyGoal} onChange={(e) => setFormData({...formData, monthlyGoal: parseInt(e.target.value)})} />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Update Business</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'preferences' && (
             <Card>
               <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
               <CardContent className="space-y-6">
                 <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Theme</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Customize how NotaryFix looks.</p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => theme === 'dark' && toggleTheme()} className={`p-3 rounded-lg border flex flex-col items-center gap-2 w-24 ${theme === 'light' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                         <Sun className="w-5 h-5" /> <span className="text-xs font-medium">Light</span>
                       </button>
                       <button onClick={() => theme === 'light' && toggleTheme()} className={`p-3 rounded-lg border flex flex-col items-center gap-2 w-24 ${theme === 'dark' ? 'border-blue-500 bg-blue-900/20 text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                         <Moon className="w-5 h-5" /> <span className="text-xs font-medium">Dark</span>
                       </button>
                    </div>
                 </div>
               </CardContent>
             </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
EOF

echo "✅ V9 Upgrade Complete! All modules are now reading and writing to the central Data Engine."