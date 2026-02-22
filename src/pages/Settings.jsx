import React, { useState, useEffect, useMemo } from 'react';
import { User, Building, Bell, Save, LogOut, Moon, Sun, Wand2, ScanLine, RotateCcw, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '../components/UI';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [smartBusinessInput, setSmartBusinessInput] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { data, updateSettings } = useData();

  const [formData, setFormData] = useState(data.settings);

  useEffect(() => {
    setFormData(data.settings);
  }, [data.settings]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
    { id: 'preferences', label: 'Preferences', icon: Bell },
  ];

  const settingsHealth = useMemo(() => {
    const checks = [formData.name, formData.businessName, formData.costPerMile, formData.taxRate, formData.monthlyGoal, formData.eAndOExpiresOn, formData.complianceReviewDay];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  }, [formData]);

  const handleSave = () => {
    updateSettings(formData);
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

  return (
    <div className="max-w-6xl space-y-6 pb-20">
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Configuration Center</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Settings</h1>
            <p className="mt-1 text-sm text-slate-200">Manage profile, business defaults, and visual preferences.</p>
          </div>
          <Button onClick={handleSave} className="border-0 bg-blue-500 text-white hover:bg-blue-600"><Save className="mr-2 h-4 w-4" /> Save All</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Settings Completion</p><p className="text-2xl font-bold text-blue-600">{settingsHealth}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Mileage Rate</p><p className="text-2xl font-bold text-slate-900 dark:text-white">${Number(formData.costPerMile || 0).toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Monthly Goal</p><p className="text-2xl font-bold text-emerald-600">${Number(formData.monthlyGoal || 0).toLocaleString()}</p></CardContent></Card>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        <div className="w-full flex-shrink-0 md:w-64">
          <nav className="flex flex-row gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
            <div className="my-2 hidden border-t border-slate-200 dark:border-slate-700 md:block" />
            <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/10"><LogOut className="h-4 w-4" /> Sign Out</button>
          </nav>
        </div>

        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader><CardTitle>Public Profile</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-2xl font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">{String(formData.name || 'NA').substring(0, 2).toUpperCase()}</div>
                  <Button variant="secondary" size="sm">Upload New Picture</Button>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div><Label>Full Name</Label><Input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                </div>
                <div className="flex justify-end"><Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Changes</Button></div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'business' && (
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
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => applySmartBusinessFill((e.target.files?.[0]?.name || '').replace(/[_-]/g, ' ').replace(/\.[^.]+$/, ''))} />
                    </label>
                  </div>
                </div>

                <div><Label>Business Legal Name</Label><Input value={formData.businessName || ''} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} /></div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div><Label>Mileage Rate ($)</Label><Input type="number" step="0.01" value={formData.costPerMile ?? ''} onChange={(e) => setFormData({ ...formData, costPerMile: parseFloat(e.target.value) || 0 })} /></div>
                  <div><Label>Est. Tax Rate (%)</Label><Input type="number" value={formData.taxRate ?? ''} onChange={(e) => setFormData({ ...formData, taxRate: parseInt(e.target.value, 10) || 0 })} /></div>
                  <div><Label>Monthly Goal ($)</Label><Input type="number" value={formData.monthlyGoal ?? ''} onChange={(e) => setFormData({ ...formData, monthlyGoal: parseInt(e.target.value, 10) || 0 })} /></div>
                </div>
                <div><Label>Commission Rate (%)</Label><Input type="number" value={formData.commissionRate ?? ''} onChange={(e) => setFormData({ ...formData, commissionRate: parseInt(e.target.value, 10) || 0 })} /></div>

                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setFormData(data.settings)}><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button>
                  <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Update Business</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'compliance' && (
            <Card>
              <CardHeader><CardTitle>Compliance Defaults</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label>E&O Insurance Expiration</Label>
                    <Input type="date" value={formData.eAndOExpiresOn || ''} onChange={(e) => setFormData({ ...formData, eAndOExpiresOn: e.target.value })} />
                  </div>
                  <div>
                    <Label>Weekly Compliance Review Day</Label>
                    <Input placeholder="Monday" value={formData.complianceReviewDay || ''} onChange={(e) => setFormData({ ...formData, complianceReviewDay: e.target.value })} />
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Operations Guardrail</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">These values are used to keep mileage deductions, revenue targets, and compliance reminders aligned across the dashboard.</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setFormData(data.settings)}><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button>
                  <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Compliance</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <Card>
              <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-700">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Theme</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Customize how NotaryFix looks.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => theme === 'dark' && toggleTheme()} className={`flex w-24 flex-col items-center gap-2 rounded-lg border p-3 ${theme === 'light' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 dark:border-slate-700'}`}><Sun className="h-5 w-5" /><span className="text-xs font-medium">Light</span></button>
                    <button onClick={() => theme === 'light' && toggleTheme()} className={`flex w-24 flex-col items-center gap-2 rounded-lg border p-3 ${theme === 'dark' ? 'border-blue-500 bg-blue-900/20 text-blue-400' : 'border-slate-200 text-slate-500 dark:border-slate-700'}`}><Moon className="h-5 w-5" /><span className="text-xs font-medium">Dark</span></button>
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
