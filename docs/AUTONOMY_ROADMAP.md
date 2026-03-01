# Autonomous Notary Roadmap (Plan + Implementation)

## North Star
Move NOTARYFIX from a human-operated dashboard to an autonomous operations system that can execute repeatable notary workflows with policy guardrails, auditability, and human override.

---

## Differentiation Strategy
1. **Compliance-aware autonomy** (state rules + fee schedules + ID requirements as hard constraints).
2. **Actionable agents, not chat-only AI** (journal/invoice/reminders executed end-to-end).
3. **Trust layer** (audit logs, confidence, explicit autonomy mode).

---

## 4-Phase Roadmap

### Phase 1 — Assistive Foundation (Now)
**Goal:** Build deterministic tools + action logs.

- [x] Smart parsing in schedule/clients/invoices
- [x] Closeout agent draft flow (journal + invoice)
- [x] Audit trail for generated outputs
- [x] Agent run persistence (`agentRuns`)

**KPIs**
- Draft generation success rate
- Journal/invoice creation latency after appointment completion

### Phase 2 — Supervised Autonomy (Next)
**Goal:** Agent executes with human approval checkpoints.

- [x] Add autonomy settings (`assistive`, `supervised`, `autonomous`)
- [x] Add feature flags for automatic closeout and reminder stubs
- [ ] Add review queue UI for pending agent actions
- [ ] Add confidence thresholds per action type

**KPIs**
- Approval rate of agent drafts
- Manual edit rate per action

### Phase 3 — Autonomous Operations (Expansion)
**Goal:** Fully autonomous low-risk actions.

- [ ] Auto-send invoice reminders on policy-safe paths
- [ ] Auto-schedule follow-up for overdue invoices
- [ ] Multi-step orchestration (closeout + reminder + reconciliation)
- [ ] Escalation routing for exceptions

**KPIs**
- DSO reduction
- Time saved per completed appointment

### Phase 4 — Learning + Defensibility (Moat)
**Goal:** Continuous optimization + vertical intelligence.

- [ ] Feedback loop from user edits into extraction heuristics
- [ ] State-specific playbooks + outcome analytics
- [ ] Agent performance benchmarking by state/service type
- [ ] Enterprise controls (tenant policy packs, audit exports)

**KPIs**
- Agent precision/recall by workflow
- Compliance exception rate

---

## Implementation Backlog (Immediate)
1. Add autonomy settings to `settings` and hydrate safely.
2. Gate closeout agent behavior by autonomy mode/feature flag.
3. Add roadmap state object for in-app tracking.
4. Build review queue page (next PR) to approve/reject agent actions.

---

## Guardrails
- Never bypass state fee caps for generated invoices.
- Never auto-finalize compliance-critical journal fields without confidence/approval.
- Every autonomous action must append an audit entry.
- Human override must be available in all modes.
