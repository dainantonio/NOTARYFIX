import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, CheckCircle2, Clock, MapPin, Download, Upload, Link, AlertTriangle, Activity, Bell, Mail, MessageSquare, CalendarPlus, LayoutList, CalendarDays } from 'lucide-react';
import { Card, CardContent, Button } from '../components/UI';
import AppointmentModal from '../components/AppointmentModal';
import { useData } from '../context/DataContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLinker } from '../hooks/useLinker';

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toMinutes = (timeString = '') => {
  const text = String(timeString || '').trim();
  const match = text.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return 10 * 60;
  let hour = Number(match[1]);
  const minute = Number(match[2]) || 0;
  const meridiem = match[3]?.toUpperCase();
  if (meridiem) {
    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
  }
  return (hour * 60) + minute;
};

const fromMinutes = (totalMinutes) => {
  const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
  const hour24 = Math.floor(safeMinutes / 60);
  const minute = safeMinutes % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = ((hour24 + 11) % 12) + 1;
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
};

const defaultDurationForType = (type = '') => {
  if (/loan/i.test(type)) return 90;
  if (/apostille/i.test(type)) return 75;
  if (/i-?9/i.test(type)) return 45;
  return 60;
};

const parseDurationMinutes = (input = '', type = '') => {
  const text = String(input || '');
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*h(?:ours?)?/i);
  const minuteMatch = text.match(/(\d{2,3})\s*m(?:in(?:ute)?s?)?/i);
  if (hourMatch) return Math.max(15, Math.round(Number(hourMatch[1]) * 60));
  if (minuteMatch) return Math.max(15, Number(minuteMatch[1]));
  return defaultDurationForType(type);
};

const getAppointmentWindow = (appointment) => {
  const start = toMinutes(appointment?.time);
  const duration = parseDurationMinutes(appointment?.notes || '', appointment?.type);
  return { start, end: start + duration, duration };
};

const isTimeConflict = (a, b, travelBuffer = 30) => {
  if (!a?.date || !b?.date || a.date !== b.date) return false;
  const winA = getAppointmentWindow(a);
  const winB = getAppointmentWindow(b);
  return (winA.start < (winB.end + travelBuffer)) && (winB.start < (winA.end + travelBuffer));
};

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [prefillDate, setPrefillDate] = useState('');
  const [smartCalendarInput, setSmartCalendarInput] = useState('');
  const [alertPrefs, setAlertPrefs] = useState({ clientEmail: true, clientSms: false, notaryEmail: true, notarySms: true, leadHours: 24 });
  const [showOpsTools, setShowOpsTools] = useState(false);
  const [viewMode, setViewMode] = useState('agenda');
  const calendarFileInputRef = useRef(null);
  const { data, addAppointment, updateAppointment, deleteAppointment } = useData();
  const { completeAppointment } = useLinker();
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

  const reminderSummary = useMemo(() => {
    const channels = [];
    if (alertPrefs.clientEmail) channels.push('Client Email');
    if (alertPrefs.clientSms) channels.push('Client SMS');
    if (alertPrefs.notaryEmail) channels.push('Notary Email');
    if (alertPrefs.notarySms) channels.push('Notary SMS');
    return channels.length ? `${channels.join(', ')} @ ${alertPrefs.leadHours}h` : 'No reminders configured';
  }, [alertPrefs]);

  const handleSaveAppointment = (formData) => {
    if (editingAppointment) {
      updateAppointment(editingAppointment.id, {
        client: formData.client,
        type: formData.type,
        date: formData.date,
        time: formData.time,
        amount: parseFloat(formData.fee) || 0,
        location: formData.location || 'TBD',
        notes: `${formData.notes || ''}${formData.notes ? ' | ' : ''}Reminders: ${reminderSummary}`,
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
      notes: `${formData.notes || ''}${formData.notes ? ' | ' : ''}Reminders: ${reminderSummary}`,
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

  const parseSmartCalendarInput = (source = smartCalendarInput) => {
    const input = source.trim();
    if (!input) return null;

    const date = input.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] || new Date().toISOString().split('T')[0];
    const time = input.match(/\b\d{1,2}:\d{2}\s?(?:AM|PM)?\b/i)?.[0] || '10:00 AM';
    const amount = input.match(/\$\s?(\d+(?:\.\d{1,2})?)/)?.[1] || '0';
    const type = /i-?9/i.test(input) ? 'I-9 Verification' : /loan/i.test(input) ? 'Loan Signing' : /apostille/i.test(input) ? 'Apostille' : 'General Notary';
    const client = input.match(/(?:for|client)\s+([A-Za-z0-9 .'-]+)/i)?.[1]?.replace(/\s+on$/i, '').trim() || input.split(' on ')[0].slice(0, 40) || 'New Client';
    const parsedLocation = input.match(/(?:at|in)\s+([A-Za-z0-9 .,'#-]+)/i)?.[1]?.trim() || 'TBD';
    const durationMinutes = parseDurationMinutes(input, type);

    return { client, type, date, time, amount: parseFloat(amount) || 0, location: parsedLocation, durationMinutes, source: input };
  };

  const smartPreview = useMemo(() => parseSmartCalendarInput(smartCalendarInput), [smartCalendarInput]);

  const applySmartCalendar = () => {
    if (!smartPreview) return;
    addAppointment({
      id: Date.now(), client: smartPreview.client, type: smartPreview.type, date: smartPreview.date, time: smartPreview.time, status: 'upcoming',
      amount: smartPreview.amount, location: smartPreview.location || 'TBD', notes: `Smart calendar entry: ${smartPreview.source} (${smartPreview.durationMinutes}m) | Reminders: ${reminderSummary}`, receiptName: '', receiptImage: '',
    });
    setSmartCalendarInput('');
  };

  const exportCalendarIcs = () => {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NotaryOS//Schedule//EN'];
    (data.appointments || []).forEach((a) => {
      const dt = /^\d{4}-\d{2}-\d{2}$/.test(a.date || '') ? a.date : new Date().toISOString().split('T')[0];
      const iso = new Date(`${dt}T09:00:00`).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:notaryos-${a.id}@local`);
      lines.push(`DTSTAMP:${iso}`);
      lines.push(`DTSTART:${iso}`);
      lines.push(`SUMMARY:${(a.client || 'Appointment').replace(/[,;\n]/g, ' ')}`);
      lines.push(`DESCRIPTION:${(`${a.type || ''} | ${a.time || ''} | $${Number(a.amount || 0)}`).replace(/[,;\n]/g, ' ')}`);
      lines.push(`LOCATION:${(a.location || 'TBD').replace(/[,;\n]/g, ' ')}`);
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'notaryos-schedule.ics';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importCalendarIcs = async (file) => {
    if (!file) return;
    const text = await file.text();
    const blocks = text.split('BEGIN:VEVENT').slice(1).map((x) => x.split('END:VEVENT')[0] || '');
    blocks.forEach((b, i) => {
      const summary = (b.match(/SUMMARY:(.*)/) || [])[1]?.trim() || 'Imported Event';
      const location = (b.match(/LOCATION:(.*)/) || [])[1]?.trim() || 'TBD';
      const dt = (b.match(/DTSTART:(\d{8})/) || [])[1];
      const date = dt ? `${dt.slice(0,4)}-${dt.slice(4,6)}-${dt.slice(6,8)}` : new Date().toISOString().split('T')[0];
      addAppointment({
        id: Date.now() + i,
        client: summary,
        type: 'Imported Calendar Event',
        date,
        time: '10:00 AM',
        status: 'upcoming',
        amount: 0,
        location,
        notes: 'Imported from calendar file',
        receiptName: '',
        receiptImage: '',
      });
    });
  };

  const monthAppointments = useMemo(() => data.appointments.filter((a) => inCurrentMonth(a.date)), [data.appointments, currentDate]);
  const monthRevenue = monthAppointments.reduce((sum, a) => sum + Number(a.amount || 0), 0);

  const operationalStats = useMemo(() => {
    const upcoming = monthAppointments.filter((a) => a.status !== 'completed');
    const dailyLoad = upcoming.reduce((acc, apt) => {
      const key = apt.date || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const highLoadDays = Object.values(dailyLoad).filter((count) => count >= 4).length;
    let conflictWindows = 0;
    upcoming.forEach((apt, idx) => {
      upcoming.slice(idx + 1).forEach((other) => {
        if (isTimeConflict(apt, other, 45)) conflictWindows += 1;
      });
    });
    const workingDays = Math.max(1, Object.keys(dailyLoad).length);
    const avgPerDay = upcoming.length / workingDays;
    return { upcomingCount: upcoming.length, highLoadDays, conflictWindows, avgPerDay };
  }, [monthAppointments]);

  const smartOperationalHint = useMemo(() => {
    if (!smartPreview) return null;
    const sameDay = (data.appointments || []).filter((a) => a.date === smartPreview.date && a.status !== 'completed');
    const previewApt = { ...smartPreview, notes: `${smartPreview.durationMinutes}m` };
    const previewWindow = getAppointmentWindow(previewApt);
    const conflicts = sameDay.filter((a) => isTimeConflict(a, previewApt, 30));

    const openMinutes = 8 * 60;
    const closeMinutes = 19 * 60;
    const outsideBusinessHours = previewWindow.start < openMinutes || previewWindow.end > closeMinutes;

    let suggestedTime = null;
    const sameDayWindows = sameDay.map((a) => ({ ...a, ...getAppointmentWindow(a) }));
    let candidate = Math.max(openMinutes, previewWindow.start);
    while (candidate + smartPreview.durationMinutes <= closeMinutes) {
      const candidateApt = { ...previewApt, time: fromMinutes(candidate), notes: `${smartPreview.durationMinutes}m` };
      const hasCollision = sameDayWindows.some((slot) => isTimeConflict(slot, candidateApt, 30));
      if (!hasCollision) {
        suggestedTime = fromMinutes(candidate);
        break;
      }
      candidate += 15;
    }

    return {
      sameDayCount: sameDay.length,
      conflicts,
      suggestedTime,
      outsideBusinessHours,
      shouldBuffer: sameDay.length >= 3,
    };
  }, [data.appointments, smartPreview]);

  const sortedAppointments = useMemo(() => {
    const toStamp = (apt) => {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(apt?.date || '') ? apt.date : new Date().toISOString().split('T')[0];
      return new Date(`${date}T${String(toMinutes(apt.time) / 60 | 0).padStart(2, '0')}:${String(toMinutes(apt.time) % 60).padStart(2, '0')}:00`).getTime();
    };
    return [...(data.appointments || [])].sort((a, b) => toStamp(a) - toStamp(b));
  }, [data.appointments]);

  const todayIso = new Date().toISOString().split('T')[0];

  const agendaSections = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    const isFutureOrToday = (apt) => (apt.date || '') >= today;
    const isThisWeek = (apt) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(apt.date || '')) return false;
      const d = new Date(`${apt.date}T00:00:00`);
      return d >= new Date(`${today}T00:00:00`) && d <= weekEnd;
    };

    return {
      today: sortedAppointments.filter((a) => a.date === today),
      thisWeek: sortedAppointments.filter((a) => a.date !== today && isThisWeek(a)),
      upcoming: sortedAppointments.filter((a) => isFutureOrToday(a) && !isThisWeek(a)),
    };
  }, [sortedAppointments]);

  const toGoogleCalendarUrl = (eventData) => {
    if (!eventData) return '#';
    const startMinutes = toMinutes(eventData.time);
    const startHour = Math.floor(startMinutes / 60);
    const startMinute = startMinutes % 60;
    const start = new Date(`${eventData.date}T${String(startHour).padStart(2,'0')}:${String(startMinute).padStart(2,'0')}:00`);
    const end = new Date(start.getTime() + (eventData.durationMinutes || 60) * 60000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${eventData.type} - ${eventData.client}`,
      dates: `${fmt(start)}/${fmt(end)}`,
      details: `Smart entry from NotaryOS. ${reminderSummary}`,
      location: eventData.location || 'TBD',
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-5 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-7 mx-auto max-w-[1400px] pb-20">
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingAppointment(null); setPrefillDate(''); }}
        onSave={handleSaveAppointment}
        initialData={editingAppointment || (prefillDate ? { date: prefillDate } : null)}
        submitLabel={editingAppointment ? 'Update Appointment' : 'Save Appointment'}
      />

      <Card className="app-hero-card">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Scheduling Command</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">Schedule</h1>
            <p className="mt-1 text-sm text-slate-200">Enterprise calendar workflow with Smart Fill and inline edits.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button onClick={() => openNewModal()}><Plus className="mr-2 h-4 w-4" /> New Event</Button>
            <div className="rounded-lg border border-slate-300/40 bg-white/10 p-0.5 flex items-center gap-0.5">
              <button onClick={() => setViewMode('agenda')} className={`rounded px-2 py-1 text-xs ${viewMode === 'agenda' ? 'bg-white text-slate-900' : 'text-slate-100'}`}><LayoutList className="h-3.5 w-3.5" /></button>
              <button onClick={() => setViewMode('calendar')} className={`rounded px-2 py-1 text-xs ${viewMode === 'calendar' ? 'bg-white text-slate-900' : 'text-slate-100'}`}><CalendarDays className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'calendar' && (
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
            {weekDays.map((day) => <div key={day} className="py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{day.slice(0,1)}<span className="hidden sm:inline">{day.slice(1)}</span></div>)}
          </div>

          <div className="grid grid-cols-7 auto-rows-[96px] sm:auto-rows-[128px] border-b border-slate-200 dark:border-slate-700">
            {new Array(startOffset).fill(null).map((_, idx) => <div key={`offset-${idx}`} className="bg-slate-50/50 dark:bg-slate-800/50" />)}
            {daysInMonth.map((day) => {
              const dayApts = data.appointments.filter((a) => inCurrentMonth(a.date) && Number(a.date.split('-')[2]) === day);
              const now = new Date();
              const isToday = day === now.getDate() && currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear();
              const loadClass = dayApts.length >= 4 ? 'bg-rose-50 dark:bg-rose-900/15' : dayApts.length >= 2 ? 'bg-amber-50 dark:bg-amber-900/10' : '';
              return (
                <div key={day} className={`group relative border-b border-r border-slate-200 p-1 sm:p-2 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50 ${loadClass}`}>
                  <span className={`text-xs sm:text-sm font-medium ${isToday ? 'flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>{day}</span>
                  {dayApts.length >= 4 ? <span className="absolute top-1 right-1 rounded bg-rose-100 dark:bg-rose-900/40 px-1.5 py-0.5 text-[10px] text-rose-700 dark:text-rose-300">High load</span> : null}
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
      )}

      <Card>
        {/* ── Mobile agenda list ── */}
        {viewMode === 'agenda' && (
        <div className="space-y-4 p-3">
          {[
            ['Today', agendaSections.today],
            ['This Week', agendaSections.thisWeek],
            ['Upcoming', agendaSections.upcoming.slice(0, 12)],
          ].map(([label, items]) => (
            <div key={label}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                {label === 'Today' ? <button onClick={() => openNewModal()} className="text-xs text-blue-600 font-medium">+ Add</button> : null}
              </div>
              {items.length === 0 ? <p className="text-xs text-slate-400">No appointments</p> : null}
              <div className="space-y-2">
                {items.map((apt) => (
                  <div key={apt.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{apt.client}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{apt.type} · {apt.date} · {apt.time}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {apt.status !== 'completed' ? <button onClick={() => completeAppointment(apt)} className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"><CheckCircle2 className="h-4 w-4" /></button> : null}
                      {apt.status !== 'completed' ? <button onClick={() => navigate(`/arrive/${apt.id}`)} className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"><MapPin className="h-4 w-4" /></button> : null}
                      <button onClick={() => { setEditingAppointment(apt); setIsModalOpen(true); }} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"><Pencil className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        )}

        {/* ── Mobile card list when calendar mode ── */}
        {viewMode === 'calendar' && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 sm:hidden">
          {data.appointments.slice(0, 8).map((apt) => (
            <div key={apt.id} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{apt.client}</p>
                  {apt.status === 'completed' && <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Done</span>}
                  {apt.status === 'upcoming' && <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400">Upcoming</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{apt.type} &middot; {apt.date === todayIso ? 'Today' : apt.date} &middot; {apt.time}</p>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">${Number(apt.amount || 0).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {apt.status !== 'completed' ? (
                  <button onClick={() => completeAppointment(apt)} className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" title="Mark Complete"><CheckCircle2 className="h-4 w-4" /></button>
                ) : null}
                {apt.status !== 'completed' && (
                  <button onClick={() => navigate(`/arrive/${apt.id}`)} className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Arrive Mode"><MapPin className="h-4 w-4" /></button>
                )}
                <button onClick={() => { setEditingAppointment(apt); setIsModalOpen(true); }} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => deleteAppointment(apt.id)} className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
        )}
        {/* ── Desktop table (hidden on mobile) ── */}
        {viewMode === 'calendar' && (
        <CardContent className="p-0 hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Appointment</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.appointments.slice(0, 8).map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{apt.client}</p>
                      {apt.status === 'completed' && <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Done</span>}
                      {apt.status === 'upcoming' && <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400">Upcoming</span>}
                    </div>
                    <p className="text-xs text-slate-500">{apt.type} &middot; {apt.date === todayIso ? 'Today' : apt.date} &middot; {apt.time}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200">{apt.date}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">${Number(apt.amount || 0).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {apt.status !== 'completed' ? (
                        <Button size="sm" variant="ghost" title="Mark Complete" onClick={() => completeAppointment(apt)} className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"><CheckCircle2 className="h-4 w-4" /></Button>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 px-2"><CheckCircle2 className="h-3.5 w-3.5" /> Done</span>
                      )}
                      {apt.status !== 'completed' && (
                        <Button size="sm" variant="ghost" title="Arrive Mode" onClick={() => navigate(`/arrive/${apt.id}`)} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"><MapPin className="h-4 w-4" /></Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => { setEditingAppointment(apt); setIsModalOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="danger" onClick={() => deleteAppointment(apt.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">This Month</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{monthAppointments.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Upcoming</p><p className="text-2xl font-bold text-blue-600">{data.appointments.filter((a) => a.status === 'upcoming').length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500 truncate">Revenue</p><p className="text-2xl font-bold text-emerald-600">${monthRevenue.toLocaleString()}</p></CardContent></Card>
      </div>


      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Smart Calendar Add</p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={exportCalendarIcs}><Download className="mr-1.5 h-3.5 w-3.5" /> Export .ics</Button>
              <input ref={calendarFileInputRef} type="file" accept=".ics,text/calendar" className="hidden" onChange={(e) => importCalendarIcs(e.target.files?.[0])} />
              <Button variant="secondary" size="sm" onClick={() => calendarFileInputRef.current?.click()}><Upload className="mr-1.5 h-3.5 w-3.5" /> Import .ics</Button>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input value={smartCalendarInput} onChange={(e) => setSmartCalendarInput(e.target.value)} placeholder="Loan signing for Sarah 2026-02-22 2:30 PM $150" className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" style={{fontSize:16}} />
            <Button onClick={applySmartCalendar}>Smart Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Loan signing · tomorrow', value: `Loan signing for Client on ${new Date(Date.now() + 86400000).toISOString().split('T')[0]} 2:30 PM $150` },
              { label: 'I-9 · next week', value: `I-9 for Employer on ${new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]} 9:00 AM $45` },
              { label: 'Apostille · afternoon', value: `Apostille for Client on ${new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]} 1:00 PM $120` },
            ].map((preset) => (
              <button key={preset.label} onClick={() => setSmartCalendarInput(preset.value)} className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1 text-[11px] text-slate-600 dark:text-slate-300 hover:border-blue-400">
                {preset.label}
              </button>
            ))}
          </div>
          {smartPreview && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-xs text-slate-700 dark:text-slate-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-300"><Link className="h-3.5 w-3.5" /> Parsed Preview</div>
              <p>{smartPreview.client} · {smartPreview.type} · {smartPreview.date} {smartPreview.time} · ${smartPreview.amount.toFixed(2)}</p>
              <p className="text-slate-600 dark:text-slate-300">Duration: {smartPreview.durationMinutes} min · Location: {smartPreview.location}</p>
              {smartOperationalHint?.conflicts?.length > 0 ? (
                <p className="flex items-center gap-1 text-amber-700 dark:text-amber-300"><AlertTriangle className="h-3.5 w-3.5" /> Potential conflict with {smartOperationalHint.conflicts.length} existing slot(s){smartOperationalHint.suggestedTime ? ` — suggested: ${smartOperationalHint.suggestedTime}` : ''}.</p>
              ) : null}
              {smartOperationalHint?.outsideBusinessHours ? <p className="text-rose-700 dark:text-rose-300">Outside working hours (8:00 AM - 7:00 PM). Consider moving this slot.</p> : null}
              {smartOperationalHint?.shouldBuffer ? <p className="text-slate-600 dark:text-slate-300">Busy day detected: plan 15–30 minute travel/buffer windows.</p> : null}
            </div>
          )}
        </CardContent>
      </Card>


      <div className="flex justify-end">
        <button onClick={() => setShowOpsTools((v) => !v)} className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:border-blue-400">
          {showOpsTools ? 'Hide calendar connections & reminders' : 'Show calendar connections & reminders'}
        </button>
      </div>

      {showOpsTools && (
      <>
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Activity className="h-3.5 w-3.5" /> Operational Insights (Advanced)
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2">
              <p className="text-[11px] text-slate-500">Upcoming</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{operationalStats.upcomingCount}</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2">
              <p className="text-[11px] text-slate-500">High-load days</p>
              <p className="text-sm font-semibold text-amber-600">{operationalStats.highLoadDays}</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2">
              <p className="text-[11px] text-slate-500">Conflict windows</p>
              <p className="text-sm font-semibold text-rose-600">{operationalStats.conflictWindows}</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2">
              <p className="text-[11px] text-slate-500">Avg / active day</p>
              <p className="text-sm font-semibold text-blue-600">{operationalStats.avgPerDay.toFixed(1)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><CalendarPlus className="h-3.5 w-3.5" /> Calendar Connections</div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => window.open('https://calendar.google.com', '_blank', 'noopener,noreferrer')}>Connect Google</Button>
            <Button variant="secondary" size="sm" onClick={exportCalendarIcs}>Use Apple Calendar (.ics)</Button>
            {smartPreview ? <Button size="sm" onClick={() => window.open(toGoogleCalendarUrl(smartPreview), '_blank', 'noopener,noreferrer')}>Send Preview to Google</Button> : null}
          </div>
          <p className="text-xs text-slate-500">Use existing calendars via import/export .ics, or push a preview event directly to Google Calendar.</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Bell className="h-3.5 w-3.5" /> Reminder Automation</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[['clientEmail','Client Email',Mail],['clientSms','Client SMS',MessageSquare],['notaryEmail','Notary Email',Mail],['notarySms','Notary SMS',MessageSquare]].map(([key,label,Icon]) => (
              <label key={key} className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 p-2 cursor-pointer">
                <input type="checkbox" checked={alertPrefs[key]} onChange={(e) => setAlertPrefs((p) => ({...p, [key]: e.target.checked}))} />
                <Icon className="h-3.5 w-3.5 text-slate-500" />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Lead time</span>
            <select value={alertPrefs.leadHours} onChange={(e) => setAlertPrefs((p) => ({...p, leadHours: Number(e.target.value)}))} className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1">
              {[1,2,4,12,24,48].map((h) => <option key={h} value={h}>{h}h</option>)}
            </select>
            <span className="text-slate-500">before appointment</span>
          </div>
          <p className="text-xs text-slate-500">Current reminder plan: {reminderSummary}</p>
        </CardContent>
      </Card>
      </>

      )}

    </div>
  );
};

export default Schedule;
