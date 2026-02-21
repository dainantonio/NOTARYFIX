import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

// Default seed data for a new user
const defaultData = {
  appointments: [
    { id: 1, client: 'Sarah Johnson', type: 'Loan Signing', date: new Date().toISOString().split('T')[0], time: '2:00 PM', status: 'upcoming', amount: 150, location: 'Downtown' },
    { id: 2, client: 'TechCorp Inc', type: 'I-9 Verification', date: new Date().toISOString().split('T')[0], time: '4:30 PM', status: 'upcoming', amount: 45, location: 'Remote' },
  ],
  clients: [
    { id: 1, name: 'TechCorp Inc', contact: 'Sarah Smith', email: 'sarah@techcorp.com', phone: '(555) 123-4567', type: 'Corporate', status: 'Active' },
    { id: 2, name: 'Sarah Johnson', contact: 'Sarah Johnson', email: 's.johnson@email.com', phone: '(555) 987-6543', type: 'Individual', status: 'Active' },
  ],
  invoices: [
    { id: 'INV-1024', client: 'Estate Realty', amount: 150.00, date: 'Oct 24, 2025', status: 'Paid', due: 'Oct 24, 2025' },
    { id: 'INV-1025', client: 'TechCorp Inc', amount: 45.00, date: 'Oct 25, 2025', status: 'Pending', due: 'Nov 01, 2025' },
  ],
  settings: {
    name: 'Dain Antonio',
    businessName: 'Antonio Mobile Notary',
    costPerMile: 0.67,
    taxRate: 15,
    monthlyGoal: 15000
  }
};

export const DataProvider = ({ children }) => {
  // Load from local storage or use defaults
  const [data, setData] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notaryfix_data');
      if (saved) return JSON.parse(saved);
    }
    return defaultData;
  });

  // Auto-save to local storage whenever data changes
  useEffect(() => {
    localStorage.setItem('notaryfix_data', JSON.stringify(data));
  }, [data]);

  // Actions to modify data globally
  const addAppointment = (appointment) => {
    setData(prev => ({
      ...prev,
      appointments: [appointment, ...prev.appointments]
    }));
  };

  const updateAppointment = (appointmentId, updates) => {
    setData(prev => ({
      ...prev,
      appointments: prev.appointments.map((apt) => apt.id === appointmentId ? { ...apt, ...updates } : apt)
    }));
  };

  const updateSettings = (newSettings) => {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  return (
    <DataContext.Provider value={{ data, addAppointment, updateAppointment, updateSettings }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
