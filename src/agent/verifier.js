// src/agent/verifier.js
// Verifier: post-execution compliance check with grounded citations.
// Reads from admin-published feeSchedules, stateRules, idRequirements.
// Pure logic — no React, no side effects.

/**
 * Build citations array for a given stateCode + actType from admin-published data.
 * Citations link every AI decision back to the policy record that grounds it.
 */
export function buildCitations(stateCode, actType, data = {}) {
  const citations = [];
  const { feeSchedules = [], stateRules = [], idRequirements = [] } = data;

  // ── Fee schedule citation ───────────────────────────────────────────────────
  const feeSchedule = feeSchedules.find(
    (f) => f.stateCode === stateCode && f.actType === actType && f.status !== 'archived'
  );
  if (feeSchedule) {
    citations.push({
      policyId:         feeSchedule.id,
      label:            feeSchedule.name || `${stateCode} Fee Schedule`,
      value:            feeSchedule.maxFee != null ? `Max $${feeSchedule.maxFee}` : 'See schedule',
      source:           'fee_schedule',
      lastUpdated:      feeSchedule.publishedAt || feeSchedule.updatedAt || null,
      officialSourceUrl: feeSchedule.officialSourceUrl || null,
    });
  }

  // ── State rule citations ────────────────────────────────────────────────────
  const stateRule = stateRules.find(
    (r) => r.stateCode === stateCode && (r.actType === actType || !r.actType) && r.status === 'active'
  );
  if (stateRule) {
    if (stateRule.ronPermitted != null) {
      citations.push({
        policyId:         stateRule.id,
        label:            `${stateCode} RON Policy`,
        value:            stateRule.ronPermitted ? 'RON Permitted' : 'RON Not Permitted',
        source:           'state_rule',
        lastUpdated:      stateRule.publishedAt || stateRule.updatedAt || null,
        officialSourceUrl: stateRule.officialSourceUrl || null,
      });
    }
    if (stateRule.journalRequired != null) {
      citations.push({
        policyId:         `${stateRule.id}-jr`,
        label:            'Journal Requirement',
        value:            stateRule.journalRequired ? 'Journal required' : 'Journal not required',
        source:           'state_rule',
        lastUpdated:      stateRule.publishedAt || stateRule.updatedAt || null,
        officialSourceUrl: stateRule.officialSourceUrl || null,
      });
    }
  }

  // ── ID requirement citation ─────────────────────────────────────────────────
  const idReq = idRequirements.find(
    (r) => r.stateCode === stateCode && r.status === 'active'
  );
  if (idReq) {
    citations.push({
      policyId:         idReq.id,
      label:            'ID Requirements',
      value:            idReq.summary || idReq.acceptedIds?.join(', ') || 'See policy',
      source:           'id_requirement',
      lastUpdated:      idReq.publishedAt || idReq.updatedAt || null,
      officialSourceUrl: idReq.officialSourceUrl || null,
    });
  }

  return citations;
}

/**
 * Verify a suggestion after execution.
 * Returns { ok, issues[], citations[], adjustedScore }
 * Attaches grounded fee-cap checks — shows "fee capped because [policy]" messaging.
 */
export function verifySuggestion(suggestion, data = {}) {
  const stateCode = suggestion.stateCode || data.settings?.currentStateCode || 'WA';
  const actType   = suggestion.draftJournal?.actType || '';
  const citations = buildCitations(stateCode, actType, data);

  const issues        = [...(suggestion.complianceIssues || [])];
  let   scoreAdjust   = 0;

  // Fee cap check — adds a grounded warning with citation
  const feeSchedule = (data.feeSchedules || []).find(
    (f) => f.stateCode === stateCode && f.actType === actType && f.status !== 'archived'
  );
  if (feeSchedule?.maxFee != null) {
    const draftFee = suggestion.draftJournal?.fee ?? suggestion.draftInvoice?.amount;
    if (draftFee != null && Number(draftFee) > Number(feeSchedule.maxFee)) {
      issues.push({
        field:      'fee',
        severity:   'warning',
        message:    `Fee $${draftFee} exceeds state cap of $${feeSchedule.maxFee}`,
        fix:        `Reduce to $${feeSchedule.maxFee} per "${feeSchedule.name || stateCode + ' schedule'}"`,
        citationId: feeSchedule.id,
      });
      scoreAdjust -= 10;
    }
  }

  // RON check — warn if RON used but not permitted
  const stateRule = (data.stateRules || []).find(
    (r) => r.stateCode === stateCode && r.status === 'active'
  );
  if (stateRule?.ronPermitted === false && suggestion.draftJournal?.isRON) {
    issues.push({
      field:      'isRON',
      severity:   'error',
      message:    `RON not permitted in ${stateCode}`,
      fix:        `Change to in-person notarization per "${stateRule.name || stateCode + ' RON Policy'}"`,
      citationId: stateRule.id,
    });
    scoreAdjust -= 25;
  }

  return {
    ok:             !issues.some((i) => i.severity === 'error'),
    issues,
    citations,
    adjustedScore:  Math.max(0, Math.min(100, (suggestion.confidenceScore ?? 65) + scoreAdjust)),
  };
}
