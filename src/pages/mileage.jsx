import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Download, Wand2, ScanLine, Pencil, Trash2, Play, Square, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '../components/UI';
import { useData } from '../context/DataContext';

const Mileage = () => {
  const { data, addMileageLog, updateMileageLog, deleteMileageLog } = useData();
  const logs = data.mileageLogs || [];
  const costPerMile = data.settings?.costPerMile || 0.67;

  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], destination: '', purpose: '', miles: '' });
  const [smartInput, setSmartInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [gpsMiles, setGpsMiles] = useState(0);
  const [gpsError, setGpsError] = useState('');
  const watchIdRef = useRef(null);
  const lastPositionRef = useRef(null);

  const totalMiles = useMemo(() => logs.reduce((sum, log) => sum + (parseFloat(log.miles) || 0), 0), [logs]);
  const totalDeduction = totalMiles * costPerMile;

  useEffect(() => () => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
  }, []);

  const calculateDistanceMiles = (prevPoint, nextPoint) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const earthRadiusMiles = 3958.8;

    const dLat = toRad(nextPoint.latitude - prevPoint.latitude);
    const dLon = toRad(nextPoint.longitude - prevPoint.longitude);
    const lat1 = toRad(prevPoint.latitude);
    const lat2 = toRad(nextPoint.latitude);

    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMiles * c;
  };

  const applySmartFill = (text) => {
    const source = text.trim();
    if (!source) return;
    const date = source.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] || formData.date;
    const miles = source.match(/(\d+(?:\.\d+)?)\s?(?:mi|miles)/i)?.[1] || '';
    const destination = source.match(/(?:to|destination)\s*[:\-]?\s*([A-Za-z0-9 .,'-]+)/i)?.[1]?.trim() || formData.destination;
    const purpose = source.match(/(?:purpose|for)\s*[:\-]?\s*([A-Za-z0-9 .,'-]+)/i)?.[1]?.trim() || formData.purpose;
    setFormData((prev) => ({ ...prev, date, miles: prev.miles || miles, destination: prev.destination || destination, purpose: prev.purpose || purpose }));
  };

  const handleScan = (file) => {
    if (!file) return;
    applySmartFill(file.name.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, ''));
  };

  const applySmartFill = (text) => {
    const source = text.trim();
    if (!source) return;
    const date = source.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] || formData.date;
    const miles = source.match(/(\d+(?:\.\d+)?)\s?(?:mi|miles)/i)?.[1] || '';
    const destination = source.match(/(?:to|destination)\s*[:\-]?\s*([A-Za-z0-9 .,'-]+)/i)?.[1]?.trim() || formData.destination;
    const purpose = source.match(/(?:purpose|for)\s*[:\-]?\s*([A-Za-z0-9 .,'-]+)/i)?.[1]?.trim() || formData.purpose;
    setFormData((prev) => ({ ...prev, date, miles: prev.miles || miles, destination: prev.destination || destination, purpose: prev.purpose || purpose }));
  };

  const handleScan = (file) => {
    if (!file) return;
    applySmartFill(file.name.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, ''));
  };

  const handleSaveLog = (e) => {
    e.preventDefault();
    if (isTracking) stopGpsTracking();
    const payload = { date: formData.date, destination: formData.destination, purpose: formData.purpose, miles: parseFloat(formData.miles) || 0 };
    if (editingId) {
      updateMileageLog(editingId, payload);
      setEditingId(null);
    } else {
      addMileageLog({ id: Date.now(), ...payload });
    }
    setFormData({ date: new Date().toISOString().split('T')[0], destination: '', purpose: '', miles: '' });
    setSmartInput('');
  };

  const startGpsTracking = () => {
    if (editingId) {
      setGpsError('Finish editing the current trip before starting GPS tracking.');
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported on this device/browser.');
      return;
    }

    setGpsError('');
    setGpsMiles(0);
    lastPositionRef.current = null;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const currentPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        if (lastPositionRef.current) {
          const increment = calculateDistanceMiles(lastPositionRef.current, currentPoint);
          if (increment > 0) {
            setGpsMiles((prev) => {
              const next = prev + increment;
              setFormData((currentForm) => ({ ...currentForm, miles: next.toFixed(2) }));
              return next;
            });
          }
        }

        lastPositionRef.current = currentPoint;
      },
      (error) => {
        setGpsError(`GPS error: ${error.message}`);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
    setIsTracking(true);
  };

  const stopGpsTracking = () => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    lastPositionRef.current = null;
  };

  const startEdit = (log) => {
    if (isTracking) stopGpsTracking();
    setEditingId(log.id);
    setFormData({ date: log.date, destination: log.destination, purpose: log.purpose, miles: String(log.miles) });
  };

  return (
    <div className="space-y-6 pb-10">
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Route Operations</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Mileage Log</h1>
            <p className="mt-1 text-sm text-slate-200">Enterprise-grade mileage tracking for compliance and deductions.</p>
          </div>
          <Button variant="secondary"><Download className="mr-2 h-4 w-4" /> Export Log</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">YTD Tax Deduction</p><p className="text-2xl font-bold text-emerald-600">${totalDeduction.toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Total Miles</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{totalMiles.toFixed(1)} mi</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Current Mileage Rate</p><p className="text-2xl font-bold text-blue-600">${costPerMile}/mi</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader><CardTitle>{editingId ? 'Edit Trip' : 'Log a Trip'}</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Wand2 className="h-3.5 w-3.5" /> Smart Fill</div>
                <textarea value={smartInput} onChange={(e) => setSmartInput(e.target.value)} className="min-h-[72px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Paste trip details, destination, purpose, miles" />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => applySmartFill(smartInput)}><Wand2 className="mr-1 h-3.5 w-3.5" /> Apply Smart Fill</Button>
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300">
                    <ScanLine className="h-3.5 w-3.5" /> Scan image
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleScan(e.target.files?.[0])} />
                  </label>
                </div>
              </div>

              <form onSubmit={handleSaveLog} className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Navigation className="h-3.5 w-3.5" /> Auto-calculate Miles (GPS)</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!isTracking ? (
                      <Button type="button" size="sm" onClick={startGpsTracking}><Play className="mr-1 h-3.5 w-3.5" /> Start GPS</Button>
                    ) : (
                      <Button type="button" size="sm" variant="danger" onClick={stopGpsTracking}><Square className="mr-1 h-3.5 w-3.5" /> Stop GPS</Button>
                    )}
                    <span className="text-xs text-slate-600 dark:text-slate-300">Tracked: <strong>{gpsMiles.toFixed(2)} mi</strong></span>
                  </div>
                  {gpsError ? <p className="mt-2 text-xs text-red-500">{gpsError}</p> : null}
                </div>

                <div><Label>Date</Label><Input required type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
                <div><Label>Destination / Address</Label><Input required placeholder="123 Main St" value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} /></div>
                <div><Label>Business Purpose</Label><Input required placeholder="Loan Signing for Smith" value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} /></div>
                <div><Label>Round-trip Miles</Label><Input required type="number" step="0.1" placeholder="0.0" value={formData.miles} onChange={(e) => setFormData({ ...formData, miles: e.target.value })} /></div>
                <div className="flex gap-2">
                  {editingId && <Button type="button" variant="secondary" className="flex-1" onClick={() => { setEditingId(null); setFormData({ date: new Date().toISOString().split('T')[0], destination: '', purpose: '', miles: '' }); }}>Cancel</Button>}
                  <Button type="submit" className="flex-1"><Plus className="mr-2 h-4 w-4" /> {editingId ? 'Save Trip' : 'Add Trip'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Trip History</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Destination & Purpose</th><th className="px-6 py-4 text-right">Miles</th><th className="px-6 py-4 text-right">Deduction</th><th className="px-6 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {logs.length === 0 ? (
                    <tr><td colSpan="5" className="py-12 text-center text-slate-500">No miles logged yet.</td></tr>
                  ) : logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 text-slate-500">{log.date}</td>
                      <td className="px-6 py-4"><p className="font-medium text-slate-900 dark:text-white">{log.destination}</p><p className="text-xs text-slate-500">{log.purpose}</p></td>
                      <td className="px-6 py-4 text-right font-bold">{Number(log.miles).toFixed(1)}</td>
                      <td className="px-6 py-4 text-right font-medium text-emerald-600">${(Number(log.miles) * costPerMile).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(log)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="sm" variant="danger" onClick={() => deleteMileageLog(log.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Mileage;
