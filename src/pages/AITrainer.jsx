import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, MapPin, Send, ShieldAlert } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Progress, Select } from '../components/UI';
import { useData } from '../context/DataContext';

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'Washington DC' },
];

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const maxIso = (isos) => {
  const valid = (isos || []).filter(Boolean).map((x) => new Date(x)).filter((d) => !Number.isNaN(d.getTime()));
  if (valid.length === 0) return null;
  valid.sort((a, b) => b.getTime() - a.getTime());
  return valid[0].toISOString();
};

const getStateName = (code) => US_STATES.find((s) => s.code === code)?.name || code;

const getPublishedPolicy = (stateRules, stateCode) => {
  const candidates = (stateRules || [])
    .filter((r) => r.stateCode === stateCode && r.publishedAt && r.status !== 'archived');
  candidates.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return candidates[0] || null;
};

const computeConfidence = ({ policy, feeEntries, idReq }) => {
  if (!policy) return { score: 0, label: 'None' };

  let score = 0.95;
  if (!Array.isArray(feeEntries) || feeEntries.length === 0) score -= 0.2;
  if (!idReq) score -= 0.2;
  if (!policy.witnessRequirements) score -= 0.15;
  if (!(policy.specialActCaveats || policy.notes)) score -= 0.1;

  const lastUpdated = maxIso([
    policy.updatedAt,
    ...(feeEntries || []).map((f) => f.updatedAt),
    idReq?.updatedAt,
  ]);

  if (lastUpdated) {
    const days = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 86400000);
    if (days > 365 && days <= 730) score -= 0.1;
    if (days > 730) score -= 0.2;
  }

  score = Math.max(0, Math.min(1, score));
  const label = score >= 0.85 ? 'High' : score >= 0.65 ? 'Medium' : 'Low';
  return { score, label, lastUpdated };
};

const buildGroundedAnswer = ({ question, stateCode, data }) => {
  const policy = getPublishedPolicy(data.stateRules || [], stateCode);
  if (!policy) {
    return {
      kind: 'missing',
      stateCode,
      stateName: getStateName(stateCode),
      question,
      disclaimer: 'No answer generated. AI Trainer is grounded-only and requires a published state policy record.',
      source: {
        statePolicy: null,
        lastUpdated: null,
      },
      confidence: { score: 0, label: 'None', lastUpdated: null },
    };
  }

  const feeEntries = (data.feeSchedules || []).filter((f) => f.stateCode === stateCode)
    .slice()
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

  const idReq = (data.idRequirements || [])
    .filter((r) => r.stateCode === stateCode)
    .slice()
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0] || null;

  const confidence = computeConfidence({ policy, feeEntries, idReq });

  return {
    kind: 'answer',
    stateCode,
    stateName: getStateName(stateCode),
    question,
    policy,
    feeEntries,
    idReq,
    witnessRequirements: policy.witnessRequirements || null,
    specialActCaveats: policy.specialActCaveats || policy.notes || null,
    officialSourceUrl: policy.officialSourceUrl || null,
    source: {
      statePolicy: { id: policy.id, version: policy.version, publishedAt: policy.publishedAt, updatedAt: policy.updatedAt, effectiveDate: policy.effectiveDate },
      feeSchedule: feeEntries.map((f) => ({ id: f.id, actType: f.actType, updatedAt: f.updatedAt, effectiveDate: f.effectiveDate })),
      idRequirements: idReq ? { id: idReq.id, updatedAt: idReq.updatedAt } : null,
      lastUpdated: confidence.lastUpdated,
    },
    confidence,
    disclaimer: 'Verify with the official state source before acting. This tool summarizes only the published Admin dataset.',
  };
};

const Section = ({ title, children }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/20 p-4">
    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</div>
    <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">{children}</div>
  </div>
);

const ConfidencePill = ({ label, score }) => {
  const Icon = score >= 0.85 ? CheckCircle2 : score >= 0.65 ? Info : AlertTriangle;
  const tone = score >= 0.85 ? 'text-emerald-600 dark:text-emerald-400' : score >= 0.65 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${tone}`} />
      <span className={`text-xs font-semibold ${tone}`}>Confidence: {label}</span>
      <div className="w-28">
        <Progress value={Math.round(score * 100)} />
      </div>
    </div>
  );
};

const AITrainer = () => {
  const { data, updateSettings } = useData();

  const currentStateCode = data.settings?.currentStateCode || '';
  const [stateCode, setStateCode] = useState(currentStateCode || 'WA');
  const [input, setInput] = useState('');

  const [messages, setMessages] = useState(() => ([
    {
      id: 'welcome',
      role: 'assistant',
      createdAt: new Date().toISOString(),
      model: {
        kind: 'info',
        text: 'Ask a state-specific notary question. Answers are grounded-only: the Trainer will respond only from published Admin records.',
      },
    },
  ]));

  useEffect(() => {
    if (!currentStateCode) return;
    setStateCode((prev) => prev || currentStateCode);
  }, [currentStateCode]);

  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const stateOptions = useMemo(
    () => [{ value: '', label: '— Select State —' }, ...US_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }))],
    []
  );

  const handleAsk = () => {
    const q = input.trim();
    if (!q) return;

    const userMsg = { id: `${Date.now()}-u`, role: 'user', createdAt: new Date().toISOString(), text: q };
    const model = buildGroundedAnswer({ question: q, stateCode, data });
    const assistantMsg = { id: `${Date.now()}-a`, role: 'assistant', createdAt: new Date().toISOString(), model };

    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput('');
  };

  const applyToCurrentState = () => {
    if (!stateCode) return;
    updateSettings({ currentStateCode: stateCode });
  };

  const useCurrentState = () => {
    if (!currentStateCode) return;
    setStateCode(currentStateCode);
  };

  return (
    <div className="space-y-6 pb-10">
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
        <CardContent className="p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Knowledge Copilot</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">AI Trainer</h1>
          <p className="mt-1 text-sm text-slate-200">On-the-fly, state-specific guidance for notaries — grounded only from the published Admin dataset.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ask a question</CardTitle>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <Badge variant="default" className="text-[11px]">
                <MapPin className="mr-1.5 h-3.5 w-3.5" />
                Current: {currentStateCode || '—'}
              </Badge>
              <Button variant="secondary" size="sm" onClick={useCurrentState} disabled={!currentStateCode}>
                Use current
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div className="w-full md:max-w-md">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">State</div>
                <Select value={stateCode} onChange={(e) => setStateCode(e.target.value)} options={stateOptions} />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={applyToCurrentState} disabled={!stateCode || stateCode === currentStateCode}>
                  Apply to current state
                </Button>
              </div>
            </div>

            <div ref={scrollRef} className="h-[440px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-4 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  {m.role === 'user' ? (
                    <div className="max-w-[85%] rounded-2xl bg-blue-600 text-white px-4 py-2 text-sm shadow-sm">
                      {m.text}
                    </div>
                  ) : (
                    <div className="max-w-[92%] w-full rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm">
                      {m.model?.kind === 'info' ? (
                        <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                          <ShieldAlert className="h-4 w-4 text-blue-500 mt-0.5" />
                          <div>
                            <div className="font-semibold">Grounded-only mode</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{m.model.text}</div>
                          </div>
                        </div>
                      ) : m.model?.kind === 'missing' ? (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">No published dataset</div>
                              <div className="mt-0.5 text-base font-bold text-slate-800 dark:text-slate-100">{m.model.stateName} ({m.model.stateCode})</div>
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Publish a state policy in <span className="font-semibold">Admin → State Policy Records</span> to enable answers.
                              </div>
                            </div>
                            <ConfidencePill label={m.model.confidence.label} score={m.model.confidence.score} />
                          </div>
                          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-3 text-sm text-amber-800 dark:text-amber-200 flex gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5" />
                            <div>{m.model.disclaimer}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Notary guidance</div>
                              <div className="mt-0.5 text-base font-bold text-slate-800 dark:text-slate-100">
                                {m.model.stateName} ({m.model.stateCode})
                              </div>
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Policy {m.model.policy?.version || '—'} • Effective {fmtDate(m.model.policy?.effectiveDate)} • Published {fmtDate(m.model.policy?.publishedAt)}
                              </div>
                            </div>
                            <ConfidencePill label={m.model.confidence.label} score={m.model.confidence.score} />
                          </div>

                          <Section title="Fee limits">
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="text-xs text-slate-500 dark:text-slate-400">Max fee per act:</span>
                              <Badge variant="success" className="text-[11px]">
                                ${Number(m.model.policy?.maxFeePerAct ?? 0).toFixed(2)}
                              </Badge>
                            </div>

                            <div className="mt-3">
                              {Array.isArray(m.model.feeEntries) && m.model.feeEntries.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead className="text-slate-500 dark:text-slate-400">
                                      <tr>
                                        <th className="text-left py-1">Act</th>
                                        <th className="text-left py-1">Max</th>
                                        <th className="text-left py-1">Effective</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                      {m.model.feeEntries.slice(0, 12).map((f) => (
                                        <tr key={f.id}>
                                          <td className="py-1 pr-3">{f.actType}</td>
                                          <td className="py-1 pr-3 font-semibold">${Number(f.maxFee ?? 0).toFixed(2)}</td>
                                          <td className="py-1">{fmtDate(f.effectiveDate)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {m.model.feeEntries.length > 12 && (
                                    <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Showing 12 of {m.model.feeEntries.length} entries.</div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs text-slate-500 dark:text-slate-400">No fee schedule entries found in the published dataset.</div>
                              )}
                            </div>
                          </Section>

                          <Section title="Acceptable IDs">
                            {m.model.idReq ? (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                                  <Badge variant="blue" className="text-[11px]">Expiration required: {m.model.idReq.expirationRequired ? 'Yes' : 'No'}</Badge>
                                  <Badge variant="default" className="text-[11px]">Two forms allowed: {m.model.idReq.twoFormAllowed ? 'Yes' : 'No'}</Badge>
                                  <Badge variant="default" className="text-[11px]">Credible witness: {m.model.idReq.credibleWitnessAllowed ? 'Yes' : 'No'}</Badge>
                                </div>
                                <ul className="list-disc pl-5 text-sm">
                                  {(m.model.idReq.acceptedIdTypes || []).map((t) => <li key={t} className="text-sm">{t}</li>)}
                                </ul>
                                {m.model.idReq.notes ? <div className="text-xs text-slate-500 dark:text-slate-400">{m.model.idReq.notes}</div> : null}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500 dark:text-slate-400">No ID requirements record found in the published dataset.</div>
                            )}
                          </Section>

                          <Section title="Witness requirements">
                            {m.model.witnessRequirements ? (
                              <div className="whitespace-pre-wrap">{m.model.witnessRequirements}</div>
                            ) : (
                              <div className="text-xs text-slate-500 dark:text-slate-400">Not provided in the published dataset.</div>
                            )}
                          </Section>

                          <Section title="Special act caveats">
                            {m.model.specialActCaveats ? (
                              <div className="whitespace-pre-wrap">{m.model.specialActCaveats}</div>
                            ) : (
                              <div className="text-xs text-slate-500 dark:text-slate-400">Not provided in the published dataset.</div>
                            )}
                          </Section>

                          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 p-4 space-y-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Source + last updated</div>
                            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                              <div>
                                <span className="font-semibold">State policy:</span> record #{m.model.source.statePolicy?.id} • {m.model.source.statePolicy?.version} • updated {fmtDate(m.model.source.statePolicy?.updatedAt)} • published {fmtDate(m.model.source.statePolicy?.publishedAt)}
                              </div>
                              <div>
                                <span className="font-semibold">Fee schedule:</span> {m.model.source.feeSchedule?.length || 0} record(s) • latest update {fmtDate(maxIso((m.model.source.feeSchedule || []).map((x) => x.updatedAt)))}
                              </div>
                              <div>
                                <span className="font-semibold">ID requirements:</span> {m.model.source.idRequirements ? `record #${m.model.source.idRequirements.id} • updated ${fmtDate(m.model.source.idRequirements.updatedAt)}` : '—'}
                              </div>
                              {m.model.officialSourceUrl ? (
                                <div className="truncate">
                                  <span className="font-semibold">Official source:</span>{' '}
                                  <a href={m.model.officialSourceUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">
                                    {m.model.officialSourceUrl}
                                  </a>
                                </div>
                              ) : null}
                              <div>
                                <span className="font-semibold">Last updated:</span> {fmtDate(m.model.source.lastUpdated)}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-3 text-xs text-amber-800 dark:text-amber-200 flex gap-2">
                            <Info className="h-4 w-4 mt-0.5" />
                            <div>{m.model.disclaimer}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about fees, IDs, witnesses, RON caveats..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
              />
              <Button onClick={handleAsk} disabled={!stateCode}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {!stateCode ? (
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Select a state to enable grounded responses.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dataset status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Selected state</div>
              <div className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">{getStateName(stateCode)} ({stateCode || '—'})</div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                AI Trainer will answer only if there is a <span className="font-semibold">published state policy</span> for the selected state.
              </div>
            </div>

            {stateCode ? (
              (() => {
                const policy = getPublishedPolicy(data.stateRules || [], stateCode);
                const hasPolicy = Boolean(policy);
                const feeCount = (data.feeSchedules || []).filter((f) => f.stateCode === stateCode).length;
                const hasId = (data.idRequirements || []).some((r) => r.stateCode === stateCode);

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Published policy</span>
                      {hasPolicy ? <Badge variant="success" className="text-[11px]">Yes</Badge> : <Badge variant="danger" className="text-[11px]">No</Badge>}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {hasPolicy ? (
                        <>
                          Version <span className="font-mono">{policy.version}</span> • published {fmtDate(policy.publishedAt)} • updated {fmtDate(policy.updatedAt)}
                        </>
                      ) : (
                        <>Publish a policy in Admin to enable answers for this state.</>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Fee schedule records</span>
                      <Badge variant="default" className="text-[11px]">{feeCount}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">ID requirements record</span>
                      {hasId ? <Badge variant="default" className="text-[11px]">Present</Badge> : <Badge variant="warning" className="text-[11px]">Missing</Badge>}
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-xs text-slate-600 dark:text-slate-300">
                      <div className="font-semibold mb-1">Grounding guarantee</div>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>No published policy ⇒ no answer (no hallucinations).</li>
                        <li>Sections with missing records are marked as “not provided in dataset”.</li>
                        <li>Every answer includes a source + last updated block.</li>
                      </ul>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400">Select a state to see dataset status.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AITrainer;
