import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

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
    monthlyGoal: 15000
  }
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('notaryfix_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...defaultData,
            ...parsed,
            appointments: parsed.appointments || defaultData.appointments,
            clients: parsed.clients || defaultData.clients,
            invoices: parsed.invoices || defaultData.invoices,
            mileageLogs: parsed.mileageLogs || defaultData.mileageLogs,
            settings: { ...defaultData.settings, ...(parsed.settings || {}) }
          };
        }
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
    return defaultData;
  });

  useEffect(() => {
    localStorage.setItem('notaryfix_data', JSON.stringify(data));
  }, [data]);

  // Safe array modifiers
  const addAppointment = (appointment) => setData(prev => ({ ...prev, appointments: [appointment, ...(prev.appointments || [])] }));
  const addClient = (client) => setData(prev => ({ ...prev, clients: [client, ...(prev.clients || [])] }));
  const addInvoice = (invoice) => setData(prev => ({ ...prev, invoices: [invoice, ...(prev.invoices || [])] }));
  const addMileageLog = (log) => setData(prev => ({ ...prev, mileageLogs: [log, ...(prev.mileageLogs || [])] }));
  const updateSettings = (newSettings) => setData(prev => ({ ...prev, settings: { ...prev.settings, ...newSettings } }));

  return (
    <DataContext.Provider value={{ data, addAppointment, updateSettings, addClient, addInvoice, addMileageLog }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);

export default function App() {
  return (
    <DataProvider>
      <div className="p-8 font-sans text-slate-800">
        <h1 className="text-2xl font-bold mb-4">DataContext Standalone Preview</h1>
        <p>The DataProvider is active. This file handles global state for NotaryFix OS and does not have visual UI components of its own. To test UI features, please preview a component like `Dashboard.jsx` or `App.jsx`.</p>
      </div>
    </DataProvider>
  )
}