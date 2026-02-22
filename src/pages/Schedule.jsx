import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil } from 'lucide-react';
import { Card, CardContent, Button } from '../components/UI';
import AppointmentModal from '../components/AppointmentModal';
import { useData } from '../context/DataContext';
import { useLocation, useNavigate } from 'react-router-dom';

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [prefillDate, setPrefillDate] = useState('');
  const [smartCalendarInput, setSmartCalendarInput] = useState('');
  const { data, addAppointment, updateAppointment, deleteAppointment } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return new Array(days).fill(null).map((_, i) => i + 1);
  }, [currentDate]);

  const startOffset = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(), [currentDate]);

  useEffect(() => {
    const editId = location.state?.editAppointmentId;
    if (!editId) return;
    const apt = data.appointments.find((a) => a.id === editId);
    if (apt) {
      setEditingAppointment(apt);
      setIsModalOpen(true);
    }
    navigate('/schedule', { replace: true, state: {} });
  }, [location.state, data.appointments, navigate]);

  const handleSaveAppointment = (formData) => {
    if (editingAppointment) {
      updateAppointment(editingAppointment.id, {
        client: formData.client,
        type: formData.type,
        date: formData.date,
        time: formData.time,
        amount: parseFloat(formData.fee) || 0,
        location: formData.location || 'TBD',
        notes: formData.notes || '',
        receiptName: formData.receiptName || '',
        receiptImage: formData.receiptImage || '',
      });
      setEditingAppointment(null);
      return;
    }

    addAppointment({
      id: Date.now(),
      client: formData.client,
      type: formData.type,
      date: formData.date || prefillDate || new Date().toISOString().split('T')[0],
      time: formData.time,
      status: 'upcoming',
      amount: parseFloat(formData.fee) || 0,
      location: formData.location || 'TBD',
      notes: formData.notes || '',
      receiptName: formData.receiptName || '',
      receiptImage: formData.receiptImage || '',
    });
  };

  const inCurrentMonth = (dateString) => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
    const d = new Date(`${dateString}T00:00:00`);
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
  };

  const openNewModal = (day = null) => {
    if (day) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      setPrefillDate(date.toISOString().split('T')[0]);
    } else setPrefillDate('');
    setEditingAppointment(null);
    setIsModalOpen(true);
  };

  const parseSmartCalendarInput = () => {
    const source = smartCalendarInput.trim();
    if (!source) return;

    const date = source.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] || new Date().toISOString().split('T')[0];
    const time = source.match(/\b\d{1,2}:\d{2}\s?(?:AM|PM)?\b/i)?.[0] || '10:00 AM';
    const amount = source.match(/\$\s?(\d+(?:\.\d{1,2})?)/)?.[1] || '0';
    const type = /i-?9/i.test(source) ? 'I-9 Verification' : /loan/i.test(source) ? 'Loan Signing' : /apostille/i.test(source) ? 'Apostille' : 'General Notary';
    const client = source.match(/(?:for|client)\s+([A-Za-z0-9 .'-]+)/i)?.[1]?.trim() || source.split(' on ')[0].slice(0, 40) || 'New Client';

    addAppointment({
      id: Date.now(), client, type, date, time, status: 'upcoming', amount: parseFloat(amount) || 0, location: 'TBD',
      notes: `Smart calendar entry: ${source}`, receiptName: '', receiptImage: '',
    });
    setSmartCalendarInput('');
  };

  const monthAppointments = useMemo(() => data.appointments.filter((a) => inCurrentMonth(a.date)), [data.appointments, currentDate]);
  const monthRevenue = monthAppointments.reduce((sum, a) => sum + Number(a.amount || 0), 0);

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingAppointment(null); setPrefillDate(''); }}
        onSave={handleSaveAppointment}
        initialData={editingAppointment || (prefillDate ? { date: prefillDate } : null)}
        submitLabel={editingAppointment ? 'Update Appointment' : 'Save Appointment'}
      />

      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Scheduling Command</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Schedule</h1>
            <p className="mt-1 text-sm text-slate-200">Enterprise calendar workflow with Smart Fill and inline edits.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button onClick={() => openNewModal()}><Plus className="mr-2 h-4 w-4" /> New Event</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">This Month</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{monthAppointments.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Upcoming</p><p className="text-2xl font-bold text-blue-600">{data.appointments.filter((a) => a.status === 'upcoming').length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Projected Revenue</p><p className="text-2xl font-bold text-emerald-600">${monthRevenue.toLocaleString()}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Smart Calendar Add</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input value={smartCalendarInput} onChange={(e) => setSmartCalendarInput(e.target.value)} placeholder="Type: Loan signing for Sarah Johnson on 2026-02-22 2:30 PM $150" className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <Button onClick={parseSmartCalendarInput}>Smart Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <div className="mr-2 flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" /></button>
              <span className="px-4 font-medium text-slate-900 dark:text-white">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
            {weekDays.map((day) => <div key={day} className="py-3 text-center text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{day}</div>)}
          </div>

          <div className="grid grid-cols-7 auto-rows-[128px] border-b border-slate-200 dark:border-slate-700">
            {new Array(startOffset).fill(null).map((_, idx) => <div key={`offset-${idx}`} className="bg-slate-50/50 dark:bg-slate-800/50" />)}
            {daysInMonth.map((day) => {
              const dayApts = data.appointments.filter((a) => inCurrentMonth(a.date) && Number(a.date.split('-')[2]) === day);
              const now = new Date();
              const isToday = day === now.getDate() && currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear();
              return (
                <div key={day} className="group relative border-b border-r border-slate-200 p-2 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                  <span className={`text-sm font-medium ${isToday ? 'flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>{day}</span>
                  <div className="mt-2 max-h-[78px] space-y-1 overflow-y-auto">
                    {dayApts.map((apt) => (
                      <button key={apt.id} onClick={() => { setEditingAppointment(apt); setIsModalOpen(true); }} className="w-full truncate rounded border-l-2 border-blue-500 bg-blue-50 p-1.5 text-left text-xs text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50">
                        {apt.time} - {apt.client}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => openNewModal(day)} className="absolute bottom-2 right-2 rounded-full p-1 text-slate-500 opacity-0 transition-all hover:bg-slate-200 group-hover:opacity-100 dark:hover:bg-slate-600"><Plus className="h-4 w-4" /></button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3">Appointment</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.appointments.slice(0, 8).map((apt) => (
                <tr key={apt.id}>
                  <td className="px-6 py-3"><p className="font-medium">{apt.client}</p><p className="text-xs text-slate-500">{apt.type} · {apt.time}</p></td>
                  <td className="px-6 py-3">{apt.date}</td>
                  <td className="px-6 py-3">${Number(apt.amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingAppointment(apt); setIsModalOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="danger" onClick={() => deleteAppointment(apt.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
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

export default Schedule;
