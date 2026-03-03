import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Building, Bell, Save, LogOut, Moon, Sun, Wand2, ScanLine, RotateCcw, ShieldCheck, Bot, Palette, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '../components/UI';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '../hooks/useLinker';

const US_STATE_CODES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [smartBusinessInput, setSmartBusinessInput] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { data, updateSettings } = useData();
  const navigate = useNavigate();
  const saveTimerRef = useRef(null);

  const [formData, setFormData] = useState(data.settings);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setFormData({ ...data.settings, commissionedStates: Array.isArray(data.settings?.commissionedStates) && data.settings.commissionedStates.length ? data.settings.commissionedStates : [data.settings?.currentStateCode || 'WA'] });
  }, [data.settings]);

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'brand', label: 'Brand', icon: Palette },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
    { id: 'preferences', label: 'Preferences', icon: Bell },
    { id: 'agent', label: 'Agent', icon: Bot },
  ];

  const settingsHealth = useMemo(() => {
    const checks = [formData.name, formData.businessName, formData.costPerMile, formData.taxRate, formData.monthlyGoal, formData.eAndOExpiresOn, formData.complianceReviewDay, formData.brandColor, formData.businessAddress];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  }, [formData]);

  const handleSave = () => {
    updateSettings(formData);
    setSavedFlash(true);
    toast.success('Settings saved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSavedFlash(false), 2000);
  };

  const handleSignOut = () => {
    localStorage.removeItem('notaryfix_data');
    navigate('/');
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
    <div className="px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 mx-auto max-w-[1400px] space-y-6 pb-24">
      <Card className="app-hero-card">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Configuration Center</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
            <p className="mt-1 text-sm text-slate-200">Manage profile, business defaults, and visual preferences.</p>
          </div>
          <Button onClick={handleSave} className="border-0 bg-blue-500 text-white hover:bg-blue-600"><Save className="mr-2 h-4 w-4" /> {savedFlash ? 'Saved ✓' : 'Save All'}</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Settings Completion</p><p className="text-2xl font-bold text-blue-600">{settingsHealth}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Mileage Rate</p><p className="text-2xl font-bold text-slate-900 dark:text-white">${Number(formData.costPerMile || 0).toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Monthly Goal</p><p className="text-2xl font-bold text-emerald-600">${Number(formData.monthlyGoal || 0).toLocaleString()}</p></CardContent></Card>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <div className="w-full flex-shrink-0 md:w-56 lg:w-64">
          <nav className="flex flex-row gap-2 overflow-x-auto scrollbar-hide pb-2 md:flex-col md:overflow-visible md:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
            <div className="my-2 hidden border-t border-slate-200 dark:border-slate-700 md:block" />
            <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/10"><LogOut className="h-4 w-4" /> Sign Out</button>
          </nav>
        </div>

        <div className="flex-1 min-w-0 space-y-6">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader><CardTitle>Public Profile</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  {formData.businessLogo ? (
                    <img src={formData.businessLogo} alt="Business logo" className="h-20 w-20 rounded-2xl border border-slate-200 object-cover dark:border-slate-700" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-2xl font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">{String(formData.name || 'NA').substring(0, 2).toUpperCase()}</div>
                  )}
                  <div className="space-y-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
                      Upload Business Logo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setFormData({ ...formData, businessLogo: reader.result, businessLogoName: file.name });
                          }
                        };
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                    {formData.businessLogo && (
                      <button type="button" className="block text-xs text-rose-600 hover:underline dark:text-rose-400" onClick={() => setFormData({ ...formData, businessLogo: '', businessLogoName: '' })}>Remove logo</button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div><Label>Full Name</Label><Input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                </div>
                <div className="flex justify-end"><Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> {savedFlash ? 'Saved ✓' : 'Save Changes'}</Button></div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'brand' && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-purple-500" /> Brand Profile</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">Customize your brand appearance for invoices and email communications.</p>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label>Brand Color (Hex)</Label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={formData.brandColor || '#3b82f6'} onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })} className="h-10 w-16 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer" />
                      <Input type="text" placeholder="#3b82f6" value={formData.brandColor || ''} onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Business Address</Label>
                    <Input value={formData.businessAddress || ''} onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })} placeholder="123 Main St, City, ST 12345" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label>Notary License Number</Label>
                    <Input value={formData.licenseNumber || ''} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} placeholder="OH-2024-098765" />
                  </div>
                  <div>
                    <Label>Email Reply-To Address</Label>
                    <Input type="email" value={formData.emailReplyTo || ''} onChange={(e) => setFormData({ ...formData, emailReplyTo: e.target.value })} placeholder="billing@yourcompany.com" />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Brand Preview</p>
                  <div className="mt-3 rounded-lg border border-slate-300 p-4 dark:border-slate-600" style={{ borderTopColor: formData.brandColor || '#3b82f6', borderTopWidth: '4px' }}>
                    <div style={{ color: formData.brandColor || '#3b82f6' }} className="text-sm font-bold">Invoice from {formData.businessName || 'Your Business'}</div>
                    <p className="text-xs text-slate-500 mt-2">{formData.businessAddress || 'Business address'}</p>
                    <p className="text-xs text-slate-500">License: {formData.licenseNumber || 'License #'}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setFormData(data.settings)}><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button>
                  <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> {savedFlash ? 'Saved ✓' : 'Save Brand Profile'}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'business' && (
            <Card>
              <CardHeader><CardTitle>Financial & Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Wand2 className="h-3.5 w-3.5" /> Smart Fill</div>
                  <textarea value={smartBusinessInput} onChange={(e) => setSmartBusinessInput(e.target.value)} className="min-h-[72px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" placeholder="Paste business details (mileage, tax rate, monthly goal)" />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => applySmartBusinessFill(smartBusinessInput)}><Wand2 className="mr-1 h-3.5 w-3.5" /> Apply Smart Fill</Button>
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300">
                      <ScanLine className="h-3.5 w-3.5" /> Scan card
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => applySmartBusinessFill((e.target.files?.[0]?.name || '').replace(/[_-]/g, ' ').replace(/\.[^.]+$/, ''))} />
                    </label>
                  </div>
                </div>

                <div><Label>Business Legal Name</Label><Input value={formData.businessName || ''} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div><Label>Mileage Rate ($)</Label><Input type="number" step="0.01" value={formData.costPerMile ?? ''} onChange={(e) => setFormData({ ...formData, costPerMile: parseFloat(e.target.value) || 0 })} /></div>
                  <div><Label>Est. Tax Rate (%)</Label><Input type="number" value={formData.taxRate ?? ''} onChange={(e) => setFormData({ ...formData, taxRate: parseInt(e.target.value, 10) || 0 })} /></div>
                  <div><Label>Monthly Goal ($)</Label><Input type="number" value={formData.monthlyGoal ?? ''} onChange={(e) => setFormData({ ...formData, monthlyGoal: parseInt(e.target.value, 10) || 0 })} /></div>
                </div>
                <div><Label>Commission Rate (%)</Label><Input type="number" value={formData.commissionRate ?? ''} onChange={(e) => setFormData({ ...formData, commissionRate: parseInt(e.target.value, 10) || 0 })} /></div>

                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setFormData(data.settings)}><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button>
                  <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> {savedFlash ? 'Saved ✓' : 'Update Business'}</Button>
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
                  <div>
                    <Label>Notary License / Commission Number</Label>
                    <Input value={formData.licenseNumber || ''} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} placeholder="OH-2024-098765" />
                  </div>
                  <div>
                    <Label>Commission Expiry Date</Label>
                    <Input type="date" value={formData.commissionExpiryDate || ''} onChange={(e) => setFormData({ ...formData, commissionExpiryDate: e.target.value })} />
                  </div>
                  <div>
                    <Label>Notary Type</Label>
                    <select value={formData.notaryType || 'Traditional'} onChange={(e) => setFormData({ ...formData, notaryType: e.target.value })} className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Traditional</option>
                      <option>Electronic</option>
                      <option>RON (Remote Online)</option>
                    </select>
                  </div>
                  <div>
                    <Label>Primary operating state</Label>
                    <select value={formData.currentStateCode || ''} onChange={(e) => setFormData({ ...formData, currentStateCode: e.target.value })} className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select state</option>
                      {US_STATE_CODES.map((code) => <option key={code} value={code}>{code}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Commissioned states (multi-select)</Label>
                    <div className="mt-1 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                      <div className="mb-2 flex flex-wrap gap-2">
                        {(formData.commissionedStates || []).map((code) => (
                          <span key={code} className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{code}</span>
                        ))}
                      </div>
                      <div className="grid max-h-36 grid-cols-6 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-8">
                        {US_STATE_CODES.map((code) => {
                          const active = (formData.commissionedStates || []).includes(code);
                          return (
                            <button
                              key={code}
                              type="button"
                              onClick={() => {
                                const setStates = new Set(formData.commissionedStates || []);
                                if (active) setStates.delete(code); else setStates.add(code);
                                const next = Array.from(setStates);
                                setFormData({
                                  ...formData,
                                  commissionedStates: next,
                                  currentStateCode: next.includes(formData.currentStateCode) ? formData.currentStateCode : (next[0] || formData.currentStateCode),
                                });
                              }}
                              className={`rounded-md border px-2 py-1 text-xs font-semibold transition ${active ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                            >
                              {code}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Operations Guardrail</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">These values are used to keep mileage deductions, revenue targets, and compliance reminders aligned across the dashboard.</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setFormData(data.settings)}><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button>
                  <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> {savedFlash ? 'Saved ✓' : 'Save Compliance'}</Button>
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
                    <p className="text-sm text-slate-500 dark:text-slate-400">Choose your preferred theme. Both modes keep contrast-safe text and UI colors.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => theme !== 'light' && toggleTheme()} className={`flex w-24 flex-col items-center gap-2 rounded-lg border p-3 ${theme === 'light' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}><Sun className="h-5 w-5" /><span className="text-xs font-medium">Light</span></button>
                    <button type="button" onClick={() => theme !== 'dark' && toggleTheme()} className={`flex w-24 flex-col items-center gap-2 rounded-lg border p-3 ${theme === 'dark' ? 'border-blue-500 bg-blue-900/20 text-blue-400' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}><Moon className="h-5 w-5" /><span className="text-xs font-medium">Dark</span></button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'agent' && (
            <div className="space-y-6">
              {/* Autonomy Mode Picker */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-violet-500" /> Autonomy Mode</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Choose how much the agent is allowed to act on your behalf.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        value: 'assistive',
                        label: 'Suggest Only',
                        desc: 'Agent drafts everything, you approve each action before anything is saved.',
                        ring: 'ring-blue-400 border-blue-400 bg-blue-50 dark:bg-blue-900/20',
                        icon: '🤝',
                      },
                      {
                        value: 'supervised',
                        label: 'Supervised',
                        desc: 'Agent auto-approves high-confidence drafts (no compliance issues, above threshold). Everything else queues for review.',
                        ring: 'ring-amber-400 border-amber-400 bg-amber-50 dark:bg-amber-900/20',
                        icon: '👁',
                      },
                      {
                        value: 'autonomous',
                        label: 'Autonomous',
                        desc: 'Agent commits all actions immediately. Review via Audit Log.',
                        ring: 'ring-violet-400 border-violet-400 bg-violet-50 dark:bg-violet-900/20',
                        icon: '⚡',
                      },
                    ].map(({ value, label, desc, ring, icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, autonomyMode: value }))}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          formData.autonomyMode === value
                            ? `ring-2 ${ring}`
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <p className="text-lg mb-1">{icon}</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{desc}</p>
                      </button>
                    ))}
                  </div>

                  {/* Confidence threshold — only show in supervised mode */}
                  {formData.autonomyMode === 'supervised' && (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Auto-approve when confidence ≥ {formData.settings?.confidenceThreshold ?? formData.confidenceThreshold ?? 85}%</Label>
                        <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                          {formData.settings?.confidenceThreshold ?? formData.confidenceThreshold ?? 85}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={100}
                        step={5}
                        value={formData.confidenceThreshold ?? 85}
                        onChange={(e) => setFormData((prev) => ({ ...prev, confidenceThreshold: parseInt(e.target.value, 10) }))}
                        className="w-full accent-amber-500"
                      />
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>50% (lenient)</span>
                        <span>100% (strict)</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Agent Behavior Toggles */}
              <Card>
                <CardHeader><CardTitle>Agent Behavior</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">Require approval for compliance warnings</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">When off, supervised mode ignores compliance warnings for the auto-approve decision.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, requireApprovalForWarnings: !(prev.requireApprovalForWarnings ?? true) }))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        (formData.requireApprovalForWarnings ?? true) ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                        (formData.requireApprovalForWarnings ?? true) ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">Auto-scan AR on app open</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Automatically runs the aging AR check once per day when the app loads.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, autoScanAR: !(prev.autoScanAR ?? false) }))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        (formData.autoScanAR ?? false) ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                        (formData.autoScanAR ?? false) ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> {savedFlash ? 'Saved ✓' : 'Save Agent Settings'}</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
