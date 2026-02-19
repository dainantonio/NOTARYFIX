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
