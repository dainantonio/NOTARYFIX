import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components/UI';

const AITrainer = () => (
  <div className="space-y-6 pb-10">
    <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
      <CardContent className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Knowledge Copilot</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">AI Trainer</h1>
        <p className="mt-1 text-sm text-slate-200">Get on-the-fly guidance for fees, accepted IDs, and state-specific notary rules.</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Trainer Console</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">Phase 1 unlocked scaffold. Next pass will include state selector, grounded citations, and confidence signals.</p>
        <Button>Start Training Session</Button>
      </CardContent>
    </Card>
  </div>
);

export default AITrainer;
