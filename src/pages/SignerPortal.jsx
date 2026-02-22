import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components/UI';

const SignerPortal = () => (
  <div className="space-y-6 pb-10">
    <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
      <CardContent className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Client Experience</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Signer Portal</h1>
        <p className="mt-1 text-sm text-slate-200">Centralize document requests, signer updates, and secure status visibility.</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Portal Workspace</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">Phase 1 unlocked scaffold. Next pass will include signer session tracking, secure messages, and required-document checklists.</p>
        <Button>Invite Signer</Button>
      </CardContent>
    </Card>
  </div>
);

export default SignerPortal;
