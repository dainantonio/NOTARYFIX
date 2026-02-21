import React, { useState, useEffect } from 'react';
import { User, Building, Bell, Save, LogOut, Moon, Sun, Wand2, ScanLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '../components/UI';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [smartBusinessInput, setSmartBusinessInput] = useState('');
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

  const applySmartBusinessFill = (text) => {
    const source = text.trim();
    if (!source) return;
    const businessName = source.match(/(?:business|company)\s*[:\-]\s*([^,\n]+)/i)?.[1]?.trim() || '';
    const mileage = source.match(/(?:mileage|mile\s*rate)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i)?.[1] || '';
    const tax = source.match(/(?:tax|tax\s*rate)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i)?.[1] || '';
    const goal = source.match(/(?:goal|monthly\s*goal)\s*[:\-]?\s*(\d+)/i)?.[1] || '';

    setFormData((prev) => ({
      ...prev,
      businessName: prev.businessName || businessName,
      costPerMile: prev.costPerMile || (mileage ? parseFloat(mileage) : prev.costPerMile),
      taxRate: prev.taxRate || (tax ? parseFloat(tax) : prev.taxRate),
      monthlyGoal: prev.monthlyGoal || (goal ? parseInt(goal, 10) : prev.monthlyGoal),
    }));
  };

  const handleScanBusinessCard = (file) => {
    if (!file) return;
    const pseudoExtract = file.name.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, '');
    applySmartBusinessFill(pseudoExtract);
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
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Wand2 className="h-3.5 w-3.5" /> Smart Fill</div>
                    <textarea value={smartBusinessInput} onChange={(e) => setSmartBusinessInput(e.target.value)} className="min-h-[72px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Paste business details (mileage, tax rate, monthly goal)" />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => applySmartBusinessFill(smartBusinessInput)}><Wand2 className="mr-1 h-3.5 w-3.5" /> Apply Smart Fill</Button>
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300">
                        <ScanLine className="h-3.5 w-3.5" /> Scan card
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleScanBusinessCard(e.target.files?.[0])} />
                      </label>
                    </div>
                  </div>
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
