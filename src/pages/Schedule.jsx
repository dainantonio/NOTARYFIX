import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Card, CardContent, Button } from '../components/UI';
import AppointmentModal from '../components/AppointmentModal';
import { useData } from '../context/DataContext';
import { useLocation, useNavigate } from 'react-router-dom';

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [prefillDate, setPrefillDate] = useState('');
  const { data, addAppointment, updateAppointment } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return new Array(days).fill(null).map((_, i) => i + 1);
  }, [currentDate]);

  const startOffset = useMemo(() => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    return firstDay.getDay();
  }, [currentDate]);

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

  const getDayFromDate = (dateString) => {
    if (!dateString || dateString === 'Upcoming' || dateString === 'Today' || dateString === 'Yesterday') return -1;
    const parts = dateString.split('-');
    return parts.length === 3 ? parseInt(parts[2], 10) : -1;
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
    } else {
      setPrefillDate('');
    }
    setEditingAppointment(null);
    setIsModalOpen(true);
  };

  const openEditModal = (apt) => {
    setEditingAppointment(apt);
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAppointment(null);
          setPrefillDate('');
        }}
        onSave={handleSaveAppointment}
        initialData={editingAppointment || (prefillDate ? { date: prefillDate } : null)}
        submitLabel={editingAppointment ? 'Update Appointment' : 'Save Appointment'}
      />

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Schedule</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your upcoming appointments and edit directly from the calendar.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="mr-2 flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" /></button>
            <span className="px-4 font-medium text-slate-900 dark:text-white">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300" /></button>
          </div>
          <Button onClick={() => openNewModal()}><Plus className="mr-2 h-4 w-4" /> New Event</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
            {weekDays.map((day) => (
              <div key={day} className="py-3 text-center text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-[128px] border-b border-slate-200 dark:border-slate-700">
            {new Array(startOffset).fill(null).map((_, idx) => (
              <div key={`offset-${idx}`} className="bg-slate-50/50 dark:bg-slate-800/50" />
            ))}

            {daysInMonth.map((day) => {
              const dayApts = data.appointments.filter((a) => inCurrentMonth(a.date) && getDayFromDate(a.date) === day);
              const now = new Date();
              const isToday = day === now.getDate() && currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear();

              return (
                <div key={day} className="group relative border-b border-r border-slate-200 p-2 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                  <span className={`text-sm font-medium ${isToday ? 'flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>{day}</span>

                  <div className="mt-2 max-h-[78px] space-y-1 overflow-y-auto">
                    {dayApts.map((apt) => (
                      <button
                        key={apt.id}
                        onClick={() => openEditModal(apt)}
                        className="w-full truncate rounded border-l-2 border-blue-500 bg-blue-50 p-1.5 text-left text-xs text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                        title={`Edit: ${apt.time} - ${apt.client}`}
                      >
                        {apt.time} - {apt.client}
                      </button>
                    ))}
                  </div>

                  <button onClick={() => openNewModal(day)} className="absolute bottom-2 right-2 rounded-full p-1 text-slate-500 opacity-0 transition-all hover:bg-slate-200 group-hover:opacity-100 dark:hover:bg-slate-600">
                    <Plus className="h-4 w-4" />
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
