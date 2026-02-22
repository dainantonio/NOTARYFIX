import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components/UI';

const TeamDispatch = () => (
  <div className="space-y-6 pb-10">
    <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
      <CardContent className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Agency Operations</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Team Dispatch</h1>
        <p className="mt-1 text-sm text-slate-200">Manage dispatch queues, assignments, and coverage across notary teams.</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Dispatch Board</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">Phase 1 unlocked scaffold. Next pass will include assignment SLA, queue columns, and region routing.</p>
        <Button>Create Dispatch Job</Button>
      </CardContent>
    </Card>
  </div>
);

export default TeamDispatch;
