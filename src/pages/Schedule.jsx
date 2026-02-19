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
