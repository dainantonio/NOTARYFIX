import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '../components/UI';
import { useData } from '../context/DataContext';
import { getGateState } from '../utils/gates';

const Admin = () => {
  const { data } = useData();
  const currentRole = data.settings?.userRole || 'owner';
  const [state, setState] = useState('California');
  const [ackFee, setAckFee] = useState('15.00');

  const isAdmin = useMemo(() => getGateState('admin', { role: currentRole, planTier: data.settings?.planTier }).allowed, [currentRole, data.settings?.planTier]);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Your current role does not have access to the Admin control center.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
        <CardContent className="p-6">
          <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-slate-200">Manage legal data, curriculum, and system-wide compliance content.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Control Center</CardTitle>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">Role: {currentRole}</span>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Select State</Label>
              <select value={state} onChange={(e) => setState(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                <option>California</option>
                <option>Texas</option>
                <option>Florida</option>
                <option>New York</option>
                <option>Washington DC</option>
              </select>
            </div>
            <div>
              <Label>Acknowledgment Fee</Label>
              <Input value={ackFee} onChange={(e) => setAckFee(e.target.value)} />
            </div>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
