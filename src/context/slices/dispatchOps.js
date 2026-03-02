// File: src/context/slices/dispatchOps.js
// Dispatch, team, and payout operations.
// No React imports — pure factory function that closes over setData.

// ── Internal audit helper ────────────────────────────────────────────────────
const _addDispatchAudit = (p, entry) => {
  const log = [...(p.dispatchAuditLog || []), { id: Date.now() + Math.random(), ts: new Date().toISOString(), ...entry }];
  return { ...p, dispatchAuditLog: log.slice(-200) };
};

// ── Factory ──────────────────────────────────────────────────────────────────

export function createDispatchOps(setData) {

  // ── Team Members ──────────────────────────────────────────────────────────
  const addTeamMember    = (m)     => setData((p) => ({ ...p, teamMembers: [m, ...(p.teamMembers || [])] }));
  const updateTeamMember = (id, u) => setData((p) => ({ ...p, teamMembers: (p.teamMembers || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteTeamMember = (id)    => setData((p) => ({ ...p, teamMembers: (p.teamMembers || []).filter((x) => x.id !== id) }));

  // ── Dispatch Jobs ─────────────────────────────────────────────────────────
  const addDispatchJob    = (j)     => setData((p) => ({ ...p, dispatchJobs: [j, ...(p.dispatchJobs || [])] }));
  const updateDispatchJob = (id, u) => setData((p) => ({ ...p, dispatchJobs: (p.dispatchJobs || []).map((x) => x.id === id ? { ...x, ...u, updatedAt: new Date().toISOString() } : x) }));
  const deleteDispatchJob = (id)    => setData((p) => ({ ...p, dispatchJobs: (p.dispatchJobs || []).filter((x) => x.id !== id) }));

  const assignDispatchJob = (id, memberId) => setData((p) => {
    const job = (p.dispatchJobs || []).find((j) => j.id === id);
    const member = (p.teamMembers || []).find((m) => m.id === memberId);
    const now = new Date().toISOString();
    const updated = (p.dispatchJobs || []).map((j) =>
      j.id === id ? { ...j, assignedMemberId: memberId, assignedAt: memberId ? now : null, status: memberId ? 'assigned' : 'unassigned', updatedAt: now } : j
    );
    const next = { ...p, dispatchJobs: updated };
    return _addDispatchAudit(next, {
      actor: 'Dispatcher', actorRole: p.settings?.userRole || 'owner',
      action: memberId ? 'assigned' : 'unassigned',
      jobId: id, jobNumber: job?.jobNumber,
      detail: memberId ? `Assigned to ${member?.name || memberId}` : 'Unassigned',
    });
  });

  const advanceDispatchJobStatus = (id, status) => setData((p) => {
    const job = (p.dispatchJobs || []).find((j) => j.id === id);
    const now = new Date().toISOString();
    const tsField = status === 'in_progress' ? 'startedAt' : status === 'completed' ? 'completedAt' : null;
    const extra = tsField ? { [tsField]: now } : {};
    const updated = (p.dispatchJobs || []).map((j) => j.id === id ? { ...j, status, ...extra, updatedAt: now } : j);
    const next = { ...p, dispatchJobs: updated };
    return _addDispatchAudit(next, {
      actor: 'Dispatcher', actorRole: p.settings?.userRole || 'owner',
      action: 'status_change', jobId: id, jobNumber: job?.jobNumber,
      detail: `Status changed to ${status}`,
    });
  });

  // ── Dispatch Notes ────────────────────────────────────────────────────────
  const addDispatchNote    = (n)     => setData((p) => ({ ...p, dispatchNotes: [n, ...(p.dispatchNotes || [])] }));
  const updateDispatchNote = (id, u) => setData((p) => ({ ...p, dispatchNotes: (p.dispatchNotes || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteDispatchNote = (id)    => setData((p) => ({ ...p, dispatchNotes: (p.dispatchNotes || []).filter((x) => x.id !== id) }));

  // ── Payouts ───────────────────────────────────────────────────────────────
  const addPayout    = (po) => setData((p) => ({ ...p, payouts: [{ id: Date.now(), createdAt: new Date().toISOString(), ...po }, ...(p.payouts || [])] }));
  const updatePayout = (id, u) => setData((p) => ({ ...p, payouts: (p.payouts || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deletePayout = (id)    => setData((p) => ({ ...p, payouts: (p.payouts || []).filter((x) => x.id !== id) }));

  const markJobPaid = (jobId, payoutData) => setData((p) => {
    const job = (p.dispatchJobs || []).find((j) => j.id === jobId);
    if (!job) return p;
    const now = new Date().toISOString();
    const po = { id: Date.now(), createdAt: now, jobId, jobNumber: job.jobNumber, jobTitle: job.title, memberId: job.assignedMemberId, totalFee: job.fee || 0, status: 'paid', paidAt: now, ...payoutData };
    const next = {
      ...p,
      payouts: [po, ...(p.payouts || [])],
      dispatchJobs: (p.dispatchJobs || []).map((j) => j.id === jobId ? { ...j, payoutStatus: 'paid', updatedAt: now } : j),
    };
    return _addDispatchAudit(next, { actor: payoutData.paidBy || 'Dispatcher', actorRole: 'owner', action: 'payout_marked_paid', jobId, jobNumber: job.jobNumber, detail: `Payout: $${po.totalFee}` });
  });

  // ── Doc QA + Handoff ──────────────────────────────────────────────────────
  const updateJobQA = (jobId, qa) => setData((p) => {
    const now = new Date().toISOString();
    const next = { ...p, dispatchJobs: (p.dispatchJobs || []).map((j) => j.id === jobId ? { ...j, qa, updatedAt: now } : j) };
    return _addDispatchAudit(next, { actor: 'Dispatcher', actorRole: p.settings?.userRole || 'owner', action: 'qa_updated', jobId, detail: 'QA checklist updated' });
  });

  const addHandoffNote = (jobId, note) => setData((p) => {
    const now = new Date().toISOString();
    const next = { ...p, dispatchJobs: (p.dispatchJobs || []).map((j) => j.id === jobId ? { ...j, handoffNotes: [...(j.handoffNotes || []), note], updatedAt: now } : j) };
    return _addDispatchAudit(next, { actor: note.author || 'Dispatcher', actorRole: 'owner', action: 'handoff_note', jobId, detail: (note.content || '').slice(0, 80) });
  });

  const addDispatchAuditEntry = (entry) => setData((p) => {
    const log = [...(p.dispatchAuditLog || []), { id: Date.now() + Math.random(), ts: new Date().toISOString(), ...entry }];
    return { ...p, dispatchAuditLog: log.slice(-200) };
  });

  return {
    addTeamMember, updateTeamMember, deleteTeamMember,
    addDispatchJob, updateDispatchJob, deleteDispatchJob,
    assignDispatchJob, advanceDispatchJobStatus,
    addDispatchNote, updateDispatchNote, deleteDispatchNote,
    addPayout, updatePayout, deletePayout, markJobPaid,
    updateJobQA, addHandoffNote, addDispatchAuditEntry,
  };
}
