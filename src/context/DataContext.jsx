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
  mileageLogs: [
    { id: 1, date: '2025-10-24', destination: 'Downtown Title Office', purpose: 'Loan Signing - Sarah Johnson', miles: 14.5 },
    { id: 2, date: '2025-10-22', destination: 'TechCorp HQ', purpose: 'I-9 Verifications', miles: 8.2 },
  ],
  settings: {
    name: 'Dain Antonio',
    businessName: 'Antonio Mobile Notary',
    costPerMile: 0.67,
    taxRate: 15,
    monthlyGoal: 15000,
  },
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notaryfix_data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            ...defaultData,
            ...parsed,
            appointments: Array.isArray(parsed.appointments) ? parsed.appointments : defaultData.appointments,
            clients: Array.isArray(parsed.clients) ? parsed.clients : defaultData.clients,
            invoices: Array.isArray(parsed.invoices) ? parsed.invoices : defaultData.invoices,
            mileageLogs: Array.isArray(parsed.mileageLogs) ? parsed.mileageLogs : defaultData.mileageLogs,
            settings: { ...defaultData.settings, ...(parsed.settings || {}) },
          };
        } catch {
          return defaultData;
        }
      }
    }
    return defaultData;
  });

  useEffect(() => {
    localStorage.setItem('notaryfix_data', JSON.stringify(data));
  }, [data]);

  const addAppointment = (appointment) => {
    setData((prev) => ({
      ...prev,
      appointments: [appointment, ...prev.appointments],
    }));
  };

  const updateAppointment = (appointmentId, updates) => {
    setData((prev) => ({
      ...prev,
      appointments: prev.appointments.map((apt) => (apt.id === appointmentId ? { ...apt, ...updates } : apt)),
    }));
  };

  const deleteAppointment = (appointmentId) => {
    setData((prev) => ({
      ...prev,
      appointments: prev.appointments.filter((apt) => apt.id !== appointmentId),
    }));
  };

  const updateSettings = (newSettings) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  };

  const addClient = (client) => {
    setData((prev) => ({
      ...prev,
      clients: [client, ...(prev.clients || [])],
    }));
  };

  const addInvoice = (invoice) => {
    setData((prev) => ({
      ...prev,
      invoices: [invoice, ...(prev.invoices || [])],
    }));
  };

  const updateInvoice = (invoiceId, updates) => {
    setData((prev) => ({
      ...prev,
      invoices: (prev.invoices || []).map((invoice) => (invoice.id === invoiceId ? { ...invoice, ...updates } : invoice)),
    }));
  };

  const deleteInvoice = (invoiceId) => {
    setData((prev) => ({
      ...prev,
      invoices: (prev.invoices || []).filter((invoice) => invoice.id !== invoiceId),
    }));
  };

  const addMileageLog = (log) => {
    setData((prev) => ({
      ...prev,
      mileageLogs: [log, ...(prev.mileageLogs || [])],
    }));
  };

  const updateMileageLog = (logId, updates) => {
    setData((prev) => ({
      ...prev,
      mileageLogs: (prev.mileageLogs || []).map((log) => (log.id === logId ? { ...log, ...updates } : log)),
    }));
  };

  const deleteMileageLog = (logId) => {
    setData((prev) => ({
      ...prev,
      mileageLogs: (prev.mileageLogs || []).filter((log) => log.id !== logId),
    }));
  };

  return (
    <DataContext.Provider
      value={{
        data,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        updateSettings,
        addClient,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addMileageLog,
        updateMileageLog,
        deleteMileageLog,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
