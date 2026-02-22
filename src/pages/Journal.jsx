import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components/UI';

const Journal = () => {
  return (
    <div className="space-y-6 pb-10">
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Records & Audit</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Journal</h1>
            <p className="mt-1 text-sm text-slate-200">Maintain compliant notary journal entries with searchable activity history.</p>
          </div>
          <Button><Plus className="mr-2 h-4 w-4" /> New Entry</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-blue-500" /> Journal Workspace</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-300">Phase 1 scaffold: this section is ready for journal entry CRUD, filters, and export in the next implementation pass.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Journal;
