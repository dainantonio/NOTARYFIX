import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  DollarSign,
  Download,
  FileText,
  Fingerprint,
  Hash,
  Info,
  Link2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
  ZoomIn
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Input, Label, Select, Progress,
} from '../components/UI';
import { useData } from '../context/DataContext';
import { useLocation } from 'react-router-dom';
import { useLinker } from '../hooks/useLinker';
import { isJournalAtLimit } from '../utils/gates';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ACT_TYPES = [
  'Acknowledgment', 'Jurat', 'Oath / Affirmation', 'Copy Certification',
  'Signature Witnessing', 'I-9 Verification', 'Apostille', 'Protest',
  'Deed of Trust', 'Power of Attorney', 'Remote Online Notary (RON)', 'Other',
];

const ID_TYPES = [
  "Driver's License", 'Passport', 'Passport Card', 'State ID Card',
  'Military ID', 'Tribal ID', 'Permanent Resident Card', 'Foreign Passport', 'Other',
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV',
  'NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
  'TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

// State-aware requirements: required extra fields + act types that mandate thumbprint
const STATE_REQUIREMENTS = {
  AL: { extraRequired: [], thumbActTypes: [] },
  AK: { extraRequired: [], thumbActTypes: [] },
  AZ: { extraRequired: ['signerAddress'], thumbActTypes: [] },
  AR: { extraRequired: [], thumbActTypes: [] },
  CA: { extraRequired: ['signerAddress', 'idExpiration'], thumbActTypes: ['Deed of Trust', 'Power of Attorney', 'Grant Deed', 'Acknowledgment'] },
  CO: { extraRequired: ['signerAddress'], thumbActTypes: [] },
  CT: { extraRequired: ['signerAddress'], thumbActTypes: [] },
  DE: { extraRequired: [], thumbActTypes: [] },
  FL: { extraRequired: ['signerAddress', 'idLast4'], thumbActTypes: [] },
  GA: { extraRequired: ['signerAddress'], thumbActTypes: ['Deed of Trust'] },
  HI: { extraRequired: [], thumbActTypes: [] },
  ID: { extraRequired: [], thumbActTypes: [] },
  IL: { extraRequired: ['signerAddress'], thumbActTypes: [] },
  IN: { extraRequired: ['signerAddress'], thumbActTypes: [] },
  IA: { extraRequired: [], thumbActTypes: [] },
  KS: { extraRequired: [], thumbActTypes: [] },
  KY: { extraRequired: [], thumbActTypes: [] },
  LA: { extraRequired: ['signerAddress', 'idExpiration'], thumbActTypes: ['Deed of Trust', 'Acknowledgment'] },
  ME: { extraRequired: [], thumbActTypes: [] },
  MD: { extraRequired: ['signerAddress'], thumbActTypes: [] },
  MA: { extraRequired: ['signerAddress'], thumbActTypes: [] },
  MI: { extraRequired: [], thumbActTypes: [] },
  MN: { extraRequired: [], thumbActTypes: [] },
  MS: { extraRequired: [], thumbActTypes: [] },
  MO: { extraRequired: [], thumbActTypes: [] },
  MT: { extraRequired: [], thumbActTypes: [] },
  NE: { extraRequired: [], thumbActTypes: [] },
  NV: { extraRequired: ['signerAddress', 'idExpiration'], thumbActTypes: ['Deed of Trust', 'Power of Attorney'] },
  NH: { extraRequired: [], thumbActTypes: [] },
  NJ: { extraRequired: ['signerAddress'], thumbActTypes: [] },
  NM: { extraRequired: ['signerAddress'], thumbActTypes: [] },
  NY: { extraRequired: ['signerAddress', 'idType', 'idIssuingState'], thumbActTypes: [] },
  NC: { extraRequired: ['signerAddress'], thumbActTypes: [] },
  ND: { extraRequired: [], thumbActTypes: [] },
  OH: { extraRequired: ['signerAddress'], thumbActTypes: [] },
  OK: { extraRequired: [], thumbActTypes: [] },
  OR: { extraRequired: ['signerAddress', 'idLast4', 'idExpiration'], thumbActTypes: ['Deed of Trust', 'Power of Attorney', 'Acknowledgment', 'Jurat'] },
  PA: { extraRequired: ['signerAddress'], thumbActTypes: [] },
  RI: { extraRequired: [], thumbActTypes: [] },
  SC: { extraRequired: ['signerAddress'], thumbActTypes: [] },
  SD: { extraRequired: [], thumbActTypes: [] },
  TN: { extraRequired: ['signerAddress'], thumbActTypes: [] },
  TX: { extraRequired: ['signerAddress', 'idLast4'], thumbActTypes: [] },
  UT: { extraRequired: ['signerAddress', 'idExpiration'], thumbActTypes: ['Deed of Trust'] },
  VT: { extraRequired: [], thumbActTypes: [] },
  VA: { extraRequired: ['signerAddress', 'idLast4', 'idExpiration'], thumbActTypes: ['Deed of Trust', 'Power of Attorney'] },
  WA: { extraRequired: ['signerAddress', 'idLast4', 'idExpiration'], thumbActTypes: ['Deed of Trust', 'Power of Attorney', 'Acknowledgment'] },
  WV: { extraRequired: [], thumbActTypes: [] },
  WI: { extraRequired: ['signerAddress'], thumbActTypes: [] },
  WY: { extraRequired: [], thumbActTypes: [] },
  DC: { extraRequired: ['signerAddress', 'idLast4', 'idExpiration'], thumbActTypes: ['Deed of Trust'] },
};

const FIELD_LABELS = {
  signerAddress: 'Signer Address',
  idLast4: 'ID Last 4 Digits',
  idExpiration: 'ID Expiration',
  idIssuingState: 'ID Issuing State',
  idType: 'ID Type',
  documentDescription: 'Document Description',
  fee: 'Notary Fee',
  thumbprintTaken: 'Thumbprint Taken',
};

const BLANK_FORM = {
  date: new Date().toISOString().split('T')[0],
  time: (() => { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })(),
  actType: 'Acknowledgment',
  signerName: '',
  signerAddress: '',
  idType: "Driver's License",
  idIssuingState: '',
  idLast4: '',
  idExpiration: '',
  idScanCapture: null,   // base64 thumbnail stored with entry
  idScanConfirmed: false,
  fee: '',
  thumbprintTaken: false,
  witnessRequired: false,
  notes: '',
  documentDescription: '',
  linkedAppointmentId: null,
  linkedInvoiceId: null,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return iso; }
};
const fmtTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hh = parseInt(h, 10);
  return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
};
const scoreColor = (s) => {
  if (s >= 90) return { text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', ring: '#10b981' };
  if (s >= 65) return { text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500', ring: '#f59e0b' };
  return { text: 'text-red-600 dark:text-red-400', bar: 'bg-red-500', ring: '#ef4444' };
};

// djb2-style tamper-evident hash of core fields
const hashEntry = (e) => {
  const str = [e.signerName, e.idType, e.idLast4, e.idIssuingState, e.date, e.actType, String(e.fee)].join('|');
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0').toUpperCase();
};

const toTitleCase = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// Parse OCR text from a US driver's license / state ID / passport
const parseIDText = (rawText) => {
  const text = rawText || '';
  const up = text.toUpperCase();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // State abbrev - scan for known 2-letter codes
  const stateRx = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/g;
  const stateMatches = [...up.matchAll(stateRx)].map((m) => m[1]);
  const idIssuingState = stateMatches[0] || '';

  // Expiration
  const expRx = /(?:EXP(?:IRES?)?(?:RATION)?|EXPIRY)[:\s\.\-]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{2}[\/\-]\d{4})/i;
  const expMatch = text.match(expRx);
  let idExpiration = '';
  if (expMatch) {
    const raw = expMatch[1];
    const parts = raw.split(/[\/\-]/);
    if (parts.length === 3) {
      const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      idExpiration = `${year}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`;
    } else if (parts.length === 2) {
      idExpiration = `20${parts[1]}-${parts[0].padStart(2,'0')}-01`;
    }
  }

  // ID number last 4
  const idNumRx = /(?:DL|LIC(?:ENSE)?|ID(?:\s*NO?)?|NUM(?:BER)?)[:\s#\.]?\s*([A-Z0-9]{4,20})/i;
  const idMatch = up.match(idNumRx);
  const idLast4 = idMatch ? idMatch[1].replace(/[^A-Z0-9]/g, '').slice(-4) : '';

  // Name: look for "LAST, FIRST" or line labeled LN/FN
  let signerName = '';
  const commaNameRx = /\b([A-Z]{2,}),\s*([A-Z]{2,}(?:\s+[A-Z]+)?)/;
  const commaMatch = up.match(commaNameRx);
  if (commaMatch) {
    signerName = toTitleCase(`${commaMatch[2]} ${commaMatch[1]}`);
  } else {
    // Try LN / FN labels
    const lnMatch = up.match(/(?:^|[\n\r])LN\s+([A-Z ]+)/m);
    const fnMatch = up.match(/(?:^|[\n\r])FN\s+([A-Z ]+)/m);
    if (lnMatch && fnMatch) {
      signerName = toTitleCase(`${fnMatch[1].trim()} ${lnMatch[1].trim()}`);
    } else if (lnMatch) {
      signerName = toTitleCase(lnMatch[1].trim());
    }
  }

  // ID type heuristic
  let idType = "Driver's License";
  if (/PASSPORT/i.test(text)) idType = /CARD/i.test(text) ? 'Passport Card' : 'Passport';
  else if (/STATE\s*ID|IDENTIFICATION\s*CARD/i.test(text)) idType = 'State ID Card';
  else if (/MILITARY/i.test(text)) idType = 'Military ID';
  else if (/PERMANENT\s*RESIDENT|GREEN\s*CARD/i.test(text)) idType = 'Permanent Resident Card';

  return { signerName, idIssuingState, idExpiration, idLast4, idType };
};

// Validate form fields for pre-save warnings
const validateForm = (form, journalSettings) => {
  const warnings = [];
  const stateReqs = STATE_REQUIREMENTS[form.idIssuingState] || { extraRequired: [], thumbActTypes: [] };

  // Base required
  if (!form.signerName?.trim()) warnings.push({ field: 'signerName', label: 'Signer Name', severity: 'error' });
  if (!form.idType) warnings.push({ field: 'idType', label: 'ID Type', severity: 'error' });
  if (!form.idLast4?.trim()) warnings.push({ field: 'idLast4', label: 'ID Last 4 Digits', severity: 'warn' });

  // State-specific required
  stateReqs.extraRequired.forEach((f) => {
    if (!form[f]?.toString().trim()) {
      warnings.push({ field: f, label: FIELD_LABELS[f] || f, severity: 'warn', note: `Required in ${form.idIssuingState}` });
    }
  });

  // Thumbprint warnings — state-level
  const stateThumbRequired = stateReqs.thumbActTypes.includes(form.actType);
  // Settings-level
  const settingsThumbRequired = (journalSettings?.requireThumbprintForActTypes || []).includes(form.actType);
  if ((stateThumbRequired || settingsThumbRequired) && !form.thumbprintTaken) {
    const note = stateThumbRequired ? `Required for ${form.actType} in ${form.idIssuingState}` : `Required per your journal settings`;
    warnings.push({ field: 'thumbprintTaken', label: 'Thumbprint / Biometric', severity: 'warn', note });
  }

  // Expiration sanity — warn if expired
  if (form.idExpiration) {
    const exp = new Date(form.idExpiration);
    if (!isNaN(exp) && exp < new Date()) {
      warnings.push({ field: 'idExpiration', label: 'ID Expiration', severity: 'warn', note: 'This ID appears to be expired' });
    }
  }

  // Fee warn
  if (!form.fee || parseFloat(form.fee) < 0) {
    warnings.push({ field: 'fee', label: 'Notary Fee', severity: 'info', note: 'Consider recording $0 if no fee charged' });
  }

  return warnings;
};

const exportCSV = (entries) => {
  const cols = [
    'Entry #', 'Date', 'Time', 'Act Type', 'Signer Name', 'Signer Address',
    'ID Type', 'ID State', 'ID Last 4', 'ID Expiration', 'ID Scan Confirmed',
    'Fee ($)', 'Thumbprint Taken', 'Witness Required', 'Document Description',
    'Notes', 'Linked Appt ID', 'Linked Invoice ID', 'Completeness %', 'Content Hash',
  ];
  const rows = entries.map((e) => [
    e.entryNumber, e.date, e.time, e.actType, e.signerName, e.signerAddress,
    e.idType, e.idIssuingState, e.idLast4, e.idExpiration,
    e.idScanConfirmed ? 'Yes' : 'No',
    e.fee, e.thumbprintTaken ? 'Yes' : 'No', e.witnessRequired ? 'Yes' : 'No',
    e.documentDescription, e.notes,
    e.linkedAppointmentId || '', e.linkedInvoiceId || '',
    e.completenessScore ?? '—', e.contentHash || '',
  ]);
  const csv = [cols, ...rows]
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `notary-journal-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
};

// ─── SVG COMPLETENESS RING ────────────────────────────────────────────────────
const ScoreRing = ({ score, size = 44 }) => {
  const sw = 4, r = (size - sw) / 2, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const { ring } = scoreColor(score);
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} strokeWidth={sw} stroke="currentColor" fill="none" className="text-slate-200 dark:text-slate-700" />
        <circle cx={size/2} cy={size/2} r={r} strokeWidth={sw} stroke={ring} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <span className="absolute text-[10px] font-bold" style={{ color: ring }}>{score}</span>
    </div>
  );
};

// ─── TOGGLE SWITCH ────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, label, sublabel, highlight }) => (
  <label className="flex cursor-pointer items-center gap-3 select-none">
    <div
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
    </div>
    <div>
      <p className={`text-sm font-medium ${highlight ? 'text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-slate-200'}`}>{label}</p>
      {sublabel && <p className="text-xs text-slate-400 dark:text-slate-500">{sublabel}</p>}
    </div>
  </label>
);

// ─── PRE-SAVE WARNINGS ────────────────────────────────────────────────────────
const PreSaveWarnings = ({ warnings, onDismiss }) => {
  if (!warnings.length) return null;
  const errors = warnings.filter((w) => w.severity === 'error');
  const warns  = warnings.filter((w) => w.severity === 'warn');
  const infos  = warnings.filter((w) => w.severity === 'info');
  return (
    <div className="space-y-2">
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <X className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-xs font-semibold text-red-700 dark:text-red-300">Required fields missing — cannot save</p>
          </div>
          <ul className="ml-6 list-disc space-y-0.5">
            {errors.map((w) => (
              <li key={w.field} className="text-xs text-red-600 dark:text-red-400">{w.label}</li>
            ))}
          </ul>
        </div>
      )}
      {warns.length > 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Warnings — review before saving</p>
          </div>
          <ul className="ml-6 list-disc space-y-0.5">
            {warns.map((w) => (
              <li key={w.field} className="text-xs text-amber-700 dark:text-amber-300">
                <strong>{w.label}</strong>{w.note ? ` — ${w.note}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      {infos.length > 0 && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3">
          <ul className="space-y-0.5 ml-2">
            {infos.map((w) => (
              <li key={w.field} className="text-xs text-blue-600 dark:text-blue-300 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">ℹ</span>
                <span>{w.label}{w.note ? ` — ${w.note}` : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── AUDIT TRAIL BLOCK ────────────────────────────────────────────────────────
const AuditTrailBlock = ({ entry }) => {
  const editLog = entry.editLog || [];
  const hash = entry.contentHash || hashEntry(entry);
  const createdAt = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'Unknown';
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Audit Trail</p>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2 rounded-md bg-slate-100 dark:bg-slate-700/60 px-3 py-1.5">
          <Hash className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px] select-all">{hash}</span>
          <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-auto">content hash</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Clock className="h-3 w-3 shrink-0" />
          <span>Created {createdAt}</span>
          {entry.idScanConfirmed && (
            <Badge variant="blue" className="text-[9px] ml-auto">ID scan verified</Badge>
          )}
        </div>
        {editLog.length > 0 ? (
          <div className="mt-1 rounded-md border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {editLog.slice(-5).map((log, i) => (
              <div key={i} className="px-3 py-1.5 flex items-start gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="shrink-0">{new Date(log.ts).toLocaleString()}</span>
                <span className="shrink-0 font-medium text-slate-600 dark:text-slate-300">{FIELD_LABELS[log.field] || log.field}</span>
                <span className="text-slate-400 truncate">{String(log.old || '—')} → {String(log.newVal || '—')}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">No edits recorded.</p>
        )}
      </div>
    </div>
  );
};

// ─── ID SCAN MODAL ────────────────────────────────────────────────────────────
const IDScanModal = ({ isOpen, onClose, onConfirm }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [step, setStep] = useState('intro');   // intro | camera | processing | confirm | error | denied
  const [capturedImage, setCapturedImage] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extracted, setExtracted] = useState({});
  const [confirmed, setConfirmed] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // rear camera default

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('intro'); setCapturedImage(null); setOcrText('');
      setOcrProgress(0); setExtracted({}); setConfirmed({}); setErrorMsg('');
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStep('camera');
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setStep('denied');
      } else {
        setErrorMsg(`Camera error: ${err.message}`);
        setStep('error');
      }
    }
  };

  const flipCamera = async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: next, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch {}
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
    runOCR(dataUrl);
  };

  const runOCR = async (imageData) => {
    setStep('processing');
    setOcrProgress(0);
    try {
      // CDN load — only injected when user taps Scan ID, no npm dep needed
      const Tesseract = await new Promise((resolve, reject) => {
        if (window.Tesseract) return resolve(window.Tesseract);
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        s.onload = () => resolve(window.Tesseract);
        s.onerror = () => reject(new Error('Failed to load Tesseract from CDN'));
        document.head.appendChild(s);
      });
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') setOcrProgress(Math.round(m.progress * 100));
        },
      });
      const { data } = await worker.recognize(imageData);
      await worker.terminate();
      const rawText = data.text || '';
      setOcrText(rawText);
      const parsed = parseIDText(rawText);
      setExtracted(parsed);
      setConfirmed({ ...parsed });
      setStep('confirm');
    } catch (err) {
      console.error('OCR error:', err);
      // Fallback: show manual entry with blank fields
      setExtracted({});
      setConfirmed({ signerName: '', idIssuingState: '', idExpiration: '', idLast4: '', idType: "Driver's License" });
      setErrorMsg('OCR could not read the ID automatically. Please fill in the fields manually.');
      setStep('confirm');
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setStep('intro');
  };

  const handleConfirm = () => {
    onConfirm({ ...confirmed, idScanConfirmed: true, idScanCapture: capturedImage });
    onClose();
  };

  const setC = (k, v) => setConfirmed((c) => ({ ...c, [k]: v }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-700 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Camera className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Scan Signer ID</h3>
              <p className="text-[11px] text-slate-400">Camera → OCR → You confirm</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 p-5 space-y-4">

          {/* STEP: Intro */}
          {step === 'intro' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 p-4">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">How it works</p>
                <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal ml-4">
                  <li>Point camera at the signer's ID</li>
                  <li>OCR extracts name, expiration, state & ID number</li>
                  <li><strong>You review and confirm every field</strong> — nothing saves automatically</li>
                </ol>
              </div>
              <div className="rounded-xl border border-amber-100 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 p-3 flex gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Only the last 4 digits of the ID number will be stored. The captured image is stored locally on this device only.
                </p>
              </div>
              <Button className="w-full" onClick={startCamera}>
                <Camera className="mr-2 h-4 w-4" /> Open Camera
              </Button>
              <p className="text-center text-xs text-slate-400">or</p>
              <Button variant="secondary" className="w-full" onClick={() => {
                setConfirmed({ signerName: '', idIssuingState: '', idExpiration: '', idLast4: '', idType: "Driver's License" });
                setStep('confirm');
              }}>
                Enter Fields Manually
              </Button>
            </div>
          )}

          {/* STEP: Camera */}
          {step === 'camera' && (
            <div className="space-y-3">
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
                {/* ID guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white/70 rounded-lg w-4/5 h-3/5 shadow-lg" />
                </div>
                <div className="absolute bottom-2 left-0 right-0 text-center text-white text-xs opacity-70">
                  Align ID within the frame
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={flipCamera}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Flip
                </Button>
                <Button className="flex-1 bg-blue-600 text-white" onClick={captureFrame}>
                  <Camera className="mr-2 h-4 w-4" /> Capture
                </Button>
              </div>
            </div>
          )}

          {/* STEP: Processing */}
          {step === 'processing' && (
            <div className="space-y-4 text-center py-6">
              {capturedImage && (
                <img src={capturedImage} alt="Captured ID" className="rounded-lg mx-auto max-h-40 object-contain border border-slate-200 dark:border-slate-700" />
              )}
              <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="text-sm font-medium">Reading ID… {ocrProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">OCR is running locally on your device. No data leaves the app.</p>
            </div>
          )}

          {/* STEP: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              {capturedImage && (
                <div className="relative">
                  <img src={capturedImage} alt="Captured ID" className="rounded-xl w-full max-h-36 object-contain border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" />
                  <Badge variant="blue" className="absolute top-2 right-2 text-[10px]">Captured</Badge>
                </div>
              )}

              {errorMsg && (
                <div className="flex gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">{errorMsg}</p>
                </div>
              )}

              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/20 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Review &amp; correct every field — you confirm, not the OCR
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Signer Full Name</Label>
                  <Input
                    placeholder="As it appears on the ID"
                    value={confirmed.signerName || ''}
                    onChange={(e) => setC('signerName', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>ID Type</Label>
                    <Select
                      value={confirmed.idType || "Driver's License"}
                      onChange={(e) => setC('idType', e.target.value)}
                      options={ID_TYPES.map((t) => ({ value: t, label: t }))}
                    />
                  </div>
                  <div>
                    <Label>Issuing State</Label>
                    <Select
                      value={confirmed.idIssuingState || ''}
                      onChange={(e) => setC('idIssuingState', e.target.value)}
                      options={[{ value: '', label: '— N/A —' }, ...US_STATES.map((s) => ({ value: s, label: s }))]}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>ID Last 4 Digits</Label>
                    <Input
                      placeholder="e.g. 4821"
                      maxLength={4}
                      value={confirmed.idLast4 || ''}
                      onChange={(e) => setC('idLast4', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    />
                  </div>
                  <div>
                    <Label>ID Expiration</Label>
                    <Input
                      type="date"
                      value={confirmed.idExpiration || ''}
                      onChange={(e) => setC('idExpiration', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {ocrText && (
                <details className="group">
                  <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1.5">
                    <ZoomIn className="h-3.5 w-3.5" /> View raw OCR text
                  </summary>
                  <pre className="mt-2 rounded-lg bg-slate-100 dark:bg-slate-900 p-3 text-[10px] text-slate-500 dark:text-slate-400 overflow-auto max-h-28 whitespace-pre-wrap font-mono">
                    {ocrText}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={retake}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retake
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleConfirm}
                  disabled={!confirmed.signerName?.trim()}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Confirm & Apply
                </Button>
              </div>
            </div>
          )}

          {/* STEP: Camera Denied */}
          {step === 'denied' && (
            <div className="space-y-4 py-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/30 mx-auto">
                <Camera className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Camera access denied</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Allow camera access in your browser settings, then try again.
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="secondary" onClick={() => setStep('intro')}>← Back</Button>
                <Button onClick={startCamera}><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry</Button>
              </div>
            </div>
          )}

          {/* STEP: Error */}
          {step === 'error' && (
            <div className="space-y-4 py-4 text-center">
              <p className="font-semibold text-red-700 dark:text-red-400">Something went wrong</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{errorMsg}</p>
              <Button variant="secondary" onClick={() => setStep('intro')}>← Back</Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// ─── ENTRY MODAL ──────────────────────────────────────────────────────────────
const EntryModal = ({ isOpen, onClose, onSave, initial, appointments, invoices, journalSettings }) => {
  const [form, setForm] = useState(BLANK_FORM);
  const [section, setSection] = useState(0);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setForm({
        ...BLANK_FORM, ...initial,
        fee: initial.fee !== undefined ? String(initial.fee) : '',
        thumbprintTaken: !!initial.thumbprintTaken,
        witnessRequired: !!initial.witnessRequired,
      });
    } else {
      setForm({ ...BLANK_FORM });
    }
    setSection(0);
    setShowWarnings(false);
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const warnings = validateForm(form, journalSettings);
  const hasErrors = warnings.some((w) => w.severity === 'error');
  const stateReqs = STATE_REQUIREMENTS[form.idIssuingState] || { extraRequired: [], thumbActTypes: [] };
  const thumbRequired =
    stateReqs.thumbActTypes.includes(form.actType) ||
    (journalSettings?.requireThumbprintForActTypes || []).includes(form.actType);

  const apptOptions = [
    { value: '', label: '— None —' },
    ...(appointments || []).map((a) => ({ value: String(a.id), label: `${a.date} · ${a.client} · ${a.type}` })),
  ];
  const invOptions = [
    { value: '', label: '— None —' },
    ...(invoices || []).map((i) => ({ value: String(i.id), label: `${i.id} · ${i.client} · $${i.amount}` })),
  ];

  const sections = [
    { title: 'Notarial Act', icon: <FileText className="h-3.5 w-3.5" /> },
    { title: 'Signer', icon: <BookOpen className="h-3.5 w-3.5" /> },
    { title: 'ID Verify', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
    { title: 'Fee & Flags', icon: <DollarSign className="h-3.5 w-3.5" /> },
    { title: 'Link Records', icon: <Link2 className="h-3.5 w-3.5" /> },
  ];

  const handleScanConfirm = (scanned) => {
    setForm((f) => ({
      ...f,
      signerName: scanned.signerName || f.signerName,
      idType: scanned.idType || f.idType,
      idIssuingState: scanned.idIssuingState || f.idIssuingState,
      idLast4: scanned.idLast4 || f.idLast4,
      idExpiration: scanned.idExpiration || f.idExpiration,
      idScanConfirmed: true,
      idScanCapture: scanned.idScanCapture || null,
    }));
    // Jump to ID Verify tab to show what was filled
    setSection(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasErrors) { setShowWarnings(true); return; }
    const warns = warnings.filter((w) => w.severity !== 'info');
    if (warns.length && !showWarnings) { setShowWarnings(true); return; }
    onSave({ ...form, fee: parseFloat(form.fee) || 0 });
    onClose();
  };

  return (
    <>
      <IDScanModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        onConfirm={handleScanConfirm}
      />

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <div className="w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-700 flex flex-col">

          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  {initial ? 'Edit Journal Entry' : 'New Journal Entry'}
                </h3>
                {initial?.entryNumber && (
                  <p className="text-xs font-mono text-slate-400">{initial.entryNumber}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* ID Scan shortcut button in header */}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowScanModal(true)}
                className="hidden sm:flex items-center gap-1.5 text-xs"
              >
                <Camera className="h-3.5 w-3.5" />
                Scan ID
              </Button>
              <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ID Scan confirmed banner */}
          {form.idScanConfirmed && (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-900 px-6 py-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                ID scan confirmed — fields pre-filled and verified by you
              </p>
              {form.idScanCapture && (
                <img src={form.idScanCapture} alt="ID capture" className="ml-auto h-8 w-12 rounded object-cover border border-emerald-200 dark:border-emerald-800" />
              )}
            </div>
          )}

          {/* Step tabs */}
          <div className="flex overflow-x-auto border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4">
            {sections.map((s, i) => (
              <button
                key={i} type="button" onClick={() => setSection(i)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                  section === i
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {s.icon}{s.title}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="flex-1 p-6 space-y-4">

              {/* Section 0: Notarial Act */}
              {section === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div>
                      <Label>Date <span className="text-red-500">*</span></Label>
                      <Input required type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
                    </div>
                    <div>
                      <Label>Time <span className="text-red-500">*</span></Label>
                      <Input required type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label>Act Type <span className="text-red-500">*</span></Label>
                      <Select
                        value={form.actType}
                        onChange={(e) => set('actType', e.target.value)}
                        options={ACT_TYPES.map((t) => ({ value: t, label: t }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Document Description</Label>
                    <Input
                      placeholder="e.g. Deed of Trust, Affidavit of Residency"
                      value={form.documentDescription}
                      onChange={(e) => set('documentDescription', e.target.value)}
                    />
                  </div>
                  {thumbRequired && !form.thumbprintTaken && (
                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
                      <Fingerprint className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        <strong>Thumbprint required</strong> for <strong>{form.actType}</strong>
                        {stateReqs.thumbActTypes.includes(form.actType) && form.idIssuingState
                          ? ` in ${form.idIssuingState}`
                          : ' per your journal settings'
                        }. Mark it on the Fee &amp; Flags tab.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Section 1: Signer */}
              {section === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label>Signer Full Name <span className="text-red-500">*</span></Label>
                    <Input required placeholder="Legal name as it appears on ID" value={form.signerName} onChange={(e) => set('signerName', e.target.value)} />
                  </div>
                  <div>
                    <Label>
                      Signer Address
                      {stateReqs.extraRequired.includes('signerAddress') && form.idIssuingState && (
                        <span className="ml-2 text-amber-500 text-[10px] font-normal">Required in {form.idIssuingState}</span>
                      )}
                    </Label>
                    <Input placeholder="Street, City, State ZIP" value={form.signerAddress} onChange={(e) => set('signerAddress', e.target.value)} />
                  </div>
                </div>
              )}

              {/* Section 2: ID Verification */}
              {section === 2 && (
                <div className="space-y-4">
                  {/* Scan ID CTA */}
                  <button
                    type="button"
                    onClick={() => setShowScanModal(true)}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-medium transition-colors ${
                      form.idScanConfirmed
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                        : 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:border-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    }`}
                  >
                    {form.idScanConfirmed
                      ? <><CheckCircle2 className="h-4 w-4" /> ID Scan Confirmed — Retake</>
                      : <><Camera className="h-4 w-4" /> Scan ID with Camera (OCR auto-fill)</>
                    }
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ID Type <span className="text-red-500">*</span></Label>
                      <Select
                        value={form.idType}
                        onChange={(e) => set('idType', e.target.value)}
                        options={ID_TYPES.map((t) => ({ value: t, label: t }))}
                      />
                    </div>
                    <div>
                      <Label>
                        Issuing State
                        {stateReqs.extraRequired.includes('idIssuingState') && (
                          <span className="ml-1 text-amber-500 text-[10px]">Required</span>
                        )}
                      </Label>
                      <Select
                        value={form.idIssuingState}
                        onChange={(e) => set('idIssuingState', e.target.value)}
                        options={[{ value: '', label: '— N/A —' }, ...US_STATES.map((s) => ({ value: s, label: s }))]}
                      />
                    </div>
                  </div>

                  {/* ── Inline Compliance Advisor ─────────────────────── */}
                  {form.actType && form.idIssuingState && (
                    <ComplianceAdvisor
                      stateCode={form.idIssuingState}
                      actType={form.actType}
                      fee={form.fee}
                      context="journal"
                      className="mt-2"
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>
                        ID Last 4 Digits
                        {stateReqs.extraRequired.includes('idLast4') && (
                          <span className="ml-1 text-amber-500 text-[10px]">Required in {form.idIssuingState}</span>
                        )}
                      </Label>
                      <Input
                        placeholder="e.g. 4821"
                        maxLength={4}
                        value={form.idLast4}
                        onChange={(e) => set('idLast4', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      />
                      <p className="mt-1 text-xs text-slate-400">Never store full ID numbers.</p>
                    </div>
                    <div>
                      <Label>
                        ID Expiration Date
                        {stateReqs.extraRequired.includes('idExpiration') && (
                          <span className="ml-1 text-amber-500 text-[10px]">Required in {form.idIssuingState}</span>
                        )}
                      </Label>
                      <Input
                        type="date"
                        value={form.idExpiration}
                        onChange={(e) => set('idExpiration', e.target.value)}
                      />
                      {form.idExpiration && new Date(form.idExpiration) < new Date() && (
                        <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> This ID is expired
                        </p>
                      )}
                    </div>
                  </div>

                  {/* State requirement summary */}
                  {form.idIssuingState && (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                        {form.idIssuingState} Requirements
                      </p>
                      {stateReqs.extraRequired.length === 0 && stateReqs.thumbActTypes.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">No additional state-specific requirements found.</p>
                      ) : (
                        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5 list-disc ml-4">
                          {stateReqs.extraRequired.map((f) => (
                            <li key={f}>{FIELD_LABELS[f] || f} is required</li>
                          ))}
                          {stateReqs.thumbActTypes.map((t) => (
                            <li key={t}>Thumbprint required for <strong>{t}</strong></li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Section 3: Fee & Flags */}
              {section === 3 && (
                <div className="space-y-5">
                  <div>
                    <Label>Notary Fee ($) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.fee} onChange={(e) => set('fee', e.target.value)} className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <Toggle
                      checked={form.thumbprintTaken}
                      onChange={(v) => set('thumbprintTaken', v)}
                      label="Thumbprint / Biometric Taken"
                      sublabel={thumbRequired ? `⚠ Required for ${form.actType}` : 'Optional for this act type'}
                      highlight={thumbRequired && !form.thumbprintTaken}
                    />
                    <Toggle
                      checked={form.witnessRequired}
                      onChange={(v) => set('witnessRequired', v)}
                      label="Witness Was Required"
                      sublabel="Mark if the signing required a witness"
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <textarea
                      rows={4}
                      placeholder="Observations, circumstances, or any remarks for the record…"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      value={form.notes}
                      onChange={(e) => set('notes', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Section 4: Link Records */}
              {section === 4 && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Link this entry to an existing appointment or invoice for cross-reference and audit trail completeness.
                  </p>
                  <div>
                    <Label>Link to Appointment</Label>
                    <Select
                      value={form.linkedAppointmentId ? String(form.linkedAppointmentId) : ''}
                      onChange={(e) => set('linkedAppointmentId', e.target.value ? Number(e.target.value) : null)}
                      options={apptOptions}
                    />
                  </div>
                  <div>
                    <Label>Link to Invoice</Label>
                    <Select
                      value={form.linkedInvoiceId ? String(form.linkedInvoiceId) : ''}
                      onChange={(e) => set('linkedInvoiceId', e.target.value || null)}
                      options={invOptions}
                    />
                  </div>
                  {(form.linkedAppointmentId || form.linkedInvoiceId) && (
                    <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-3 py-2">
                      <Link2 className="h-4 w-4 text-blue-500 shrink-0" />
                      <p className="text-xs text-blue-600 dark:text-blue-300">Linked entries earn +10 pts on your report-ready score.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Pre-save warnings (shown after first submit attempt) */}
              {showWarnings && <PreSaveWarnings warnings={warnings} onDismiss={() => setShowWarnings(false)} />}

            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-4">
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setSection((s) => Math.max(0, s - 1))} disabled={section === 0}>← Prev</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSection((s) => Math.min(sections.length - 1, s + 1))} disabled={section === sections.length - 1}>Next →</Button>
              </div>
              <div className="flex gap-2 items-center">
                {warnings.length > 0 && !showWarnings && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> {warnings.length} warning{warnings.length > 1 ? 's' : ''}
                  </span>
                )}
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={hasErrors}>
                  {initial ? 'Save Changes' : 'Add Entry'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

// ─── DELETE CONFIRM ───────────────────────────────────────────────────────────
const DeleteConfirm = ({ entry, onConfirm, onCancel }) => {
  if (!entry) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Delete Journal Entry?</h3>
            <p className="text-xs text-slate-500">{entry.entryNumber} — {entry.signerName}</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          Notary records may be subject to state retention laws. Confirm you have authority to delete this entry.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={() => onConfirm(entry.id)}>Delete Entry</Button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

// ── ComplianceAdvisor (inlined) ────────────────────────────────────────
// ─── Static thumbprint act-type fallback ──────────────────────────────────────
const STATIC_THUMB_ACTS = {
  CA: ['Deed of Trust', 'Grant Deed', 'Quitclaim Deed', 'Trust Deed', 'Power of Attorney'],
  FL: ['Deed', 'Will', 'Trust', 'Mortgage'],
  TX: ['Real Property', 'Deed', 'Deed of Trust'],
  NY: ['Real Property Deed', 'Mortgage'],
  IL: ['Real Estate', 'Deed'],
  NV: ['Deed', 'Power of Attorney'],
  AZ: ['Deed', 'Trust Deed'],
  WA: ['Deed of Trust', 'Real Property'],
  CO: ['Deed of Trust', 'Real Property'],
  GA: ['Deed', 'Real Estate'],
};

// ─── Full state name lookup ────────────────────────────────────────────────────
const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'Washington D.C.',
};

// ─── Confidence scoring ────────────────────────────────────────────────────────
function computeConfidence(updatedAt, publishedAt) {
  const ref = updatedAt || publishedAt;
  if (!ref) return { score: 0.60, label: 'Medium', fromDataset: false };
  const daysSince = (Date.now() - new Date(ref).getTime()) / 86400000;
  const score = daysSince > 730 ? 0.60 : daysSince > 365 ? 0.75 : 0.90;
  const label = score >= 0.85 ? 'High' : score >= 0.60 ? 'Medium' : 'Low';
  return { score, label, fromDataset: true };
}

function staticConfidence() {
  return { score: 0.60, label: 'Medium', fromDataset: false };
}

// ─── Severity style map ────────────────────────────────────────────────────────
const SEVERITY_STYLES = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    Icon: AlertOctagon,
    label: 'Critical',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    Icon: AlertTriangle,
    label: 'Warning',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    Icon: Info,
    label: 'Info',
  },
};

// ─── Sub-components ────────────────────────────────────────────────────────────
function ConfidencePill({ score, label }) {
  const dot =
    score >= 0.85
      ? 'bg-emerald-400'
      : score >= 0.60
      ? 'bg-amber-400'
      : 'bg-red-400';
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function ConfidenceBar({ score }) {
  const pct = Math.round(score * 100);
  const fill =
    score >= 0.85
      ? 'bg-emerald-500'
      : score >= 0.60
      ? 'bg-amber-500'
      : 'bg-red-500';
  return (
    <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function RuleCard({ rule }) {
  const [expanded, setExpanded] = useState(false);
  const styles = SEVERITY_STYLES[rule.severity] || SEVERITY_STYLES.info;
  const { Icon } = styles;

  return (
    <div className={`rounded-lg border p-3 ${styles.bg} ${styles.border}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${styles.text}`} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-xs font-semibold uppercase tracking-wide ${styles.text}`}>
                {rule.title}
              </span>
              <span className={`rounded px-1 py-0.5 text-[10px] font-medium ${styles.badge}`}>
                {styles.label}
              </span>
            </div>
            <p className={`mt-1 text-xs leading-snug ${styles.text}`}>{rule.body}</p>
          </div>
        </div>
        {/* Confidence column */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <ConfidencePill score={rule.confidence.score} label={rule.confidence.label} />
          <ConfidenceBar score={rule.confidence.score} />
        </div>
      </div>

      {/* Source note */}
      {rule.sourceNote && (
        <p className="mt-1.5 pl-6 text-[10px] text-slate-400 dark:text-slate-500">
          📋 {rule.sourceNote}
        </p>
      )}

      {/* Expandable debug */}
      <div className="mt-2 pl-6">
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          {expanded
            ? <ChevronDown className="h-3 w-3" />
            : <ChevronRight className="h-3 w-3" />
          }
          Why this appeared
        </button>
        {expanded && (
          <div className="mt-1.5 rounded bg-white/60 dark:bg-slate-800/60 px-2 py-1.5 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
            <div>State: {rule.debug.stateCode} &middot; Act type: {rule.debug.actType}</div>
            <div>Triggered by: {rule.debug.trigger}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
/**
 * ComplianceAdvisor
 * @param {string}        stateCode  — two-letter state code, e.g. "CA"
 * @param {string}        actType    — notarial act type, e.g. "Acknowledgment"
 * @param {number|string} fee        — optional; enables fee-cap check
 * @param {"journal"|"arrive"} context — rendering context (default "journal")
 * @param {string}        className  — extra Tailwind classes for the wrapper
 */
const ComplianceAdvisor = ({
  stateCode,
  actType,
  fee,
  context = 'journal',
  className = '',
}) => {
  const { data } = useData();
  const [minimized, setMinimized] = useState(false);

  const rules = useMemo(() => {
    if (!stateCode || !actType) return [];

    const stateRules   = Array.isArray(data?.stateRules)   ? data.stateRules   : [];
    const feeSchedules = Array.isArray(data?.feeSchedules) ? data.feeSchedules : [];
    const idReqsList   = Array.isArray(data?.idRequirements) ? data.idRequirements : [];

    const policy = stateRules.find(
      r => r.stateCode === stateCode && r.status !== 'archived'
    ) || null;

    const idReq = idReqsList.find(r => r.stateCode === stateCode) || null;
    const stateName = STATE_NAMES[stateCode] || stateCode;
    const result = [];

    // ── Rule 1: Thumbprint Required ──────────────────────────────────────────
    const staticThumb = !!(STATIC_THUMB_ACTS[stateCode]?.includes(actType));
    const policyThumb = policy?.thumbprintRequired === true;
    if (policyThumb || staticThumb) {
      const conf = policy
        ? computeConfidence(policy.updatedAt, policy.publishedAt)
        : staticConfidence();
      const sourceNote = conf.fromDataset
        ? `Admin dataset · Updated ${new Date(policy.updatedAt || policy.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : 'Built-in rule — verify with your state authority';
      result.push({
        id: 'thumbprint',
        severity: 'critical',
        title: 'Thumbprint Required',
        body: `${stateName} requires a thumbprint for ${actType} acts. Obtain before completing.`,
        confidence: conf,
        sourceNote,
        debug: {
          stateCode,
          actType,
          trigger: policyThumb
            ? 'policy.thumbprintRequired = true'
            : `STATIC_THUMB_ACTS[${stateCode}] includes "${actType}"`,
        },
      });
    }

    // ── Rule 2: Fee Cap ──────────────────────────────────────────────────────
    const feeEntry =
      feeSchedules.find(f => f.stateCode === stateCode && f.actType === actType) ||
      feeSchedules.find(f => f.stateCode === stateCode) ||
      null;
    const cap = feeEntry != null ? feeEntry.maxFee : (policy?.maxFeePerAct ?? null);
    if (cap != null) {
      const feeNum = parseFloat(fee);
      const feeExceeds = !isNaN(feeNum) && feeNum > parseFloat(cap);
      const conf = feeEntry
        ? computeConfidence(feeEntry.updatedAt, feeEntry.effectiveDate)
        : policy
        ? computeConfidence(policy.updatedAt, policy.publishedAt)
        : staticConfidence();
      result.push({
        id: 'fee-cap',
        severity: feeExceeds ? 'critical' : 'info',
        title: 'Statutory Fee Cap',
        body: `Maximum for ${actType} in ${stateName}: $${cap}. ${
          feeExceeds
            ? 'Your entered fee EXCEEDS this limit.'
            : 'Your fee is within limits.'
        }`,
        confidence: conf,
        sourceNote: conf.fromDataset
          ? 'Admin dataset · Fee schedule'
          : 'Built-in rule — verify with your state authority',
        debug: {
          stateCode,
          actType,
          trigger: feeEntry
            ? `feeSchedules match stateCode=${stateCode} actType=${actType} maxFee=${cap}`
            : `policy.maxFeePerAct = ${cap}`,
        },
      });
    }

    // ── Rule 3: Witness Requirements ─────────────────────────────────────────
    if (policy?.witnessRequirements) {
      const raw = policy.witnessRequirements;
      const body = raw.length > 250 ? raw.slice(0, 250) + '\u2026' : raw;
      const conf = computeConfidence(policy.updatedAt, policy.publishedAt);
      result.push({
        id: 'witness',
        severity: 'warning',
        title: 'Witness Requirements',
        body,
        confidence: conf,
        sourceNote: conf.fromDataset
          ? `Admin dataset · Updated ${new Date(policy.updatedAt || policy.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          : 'Built-in rule — verify with your state authority',
        debug: {
          stateCode,
          actType,
          trigger: 'policy.witnessRequirements is non-empty',
        },
      });
    }

    // ── Rule 4: Accepted IDs ─────────────────────────────────────────────────
    if (idReq?.acceptedIdTypes?.length) {
      const conf = computeConfidence(idReq.updatedAt, null);
      const extras = [];
      if (idReq.expirationRequired)    extras.push('expiration required');
      if (idReq.credibleWitnessAllowed) extras.push('credible witness allowed');
      const extraStr = extras.length ? ` (${extras.join(', ')})` : '';
      result.push({
        id: 'accepted-ids',
        severity: 'info',
        title: 'Accepted ID Types',
        body: `${idReq.acceptedIdTypes.join(', ')}${extraStr}.`,
        confidence: conf,
        sourceNote: 'Admin dataset · ID requirements',
        debug: {
          stateCode,
          actType,
          trigger: `idRequirements record found for stateCode=${stateCode}`,
        },
      });
    }

    // ── Rule 5: Special Act Caveats ──────────────────────────────────────────
    const caveats = policy?.specialActCaveats || policy?.notes || '';
    if (caveats) {
      const body = caveats.length > 250 ? caveats.slice(0, 250) + '\u2026' : caveats;
      const conf = computeConfidence(policy.updatedAt, policy.publishedAt);
      result.push({
        id: 'caveats',
        severity: 'warning',
        title: 'Special Act Caveats',
        body,
        confidence: conf,
        sourceNote: `Admin dataset · Policy v${policy.version || '\u2014'}`,
        debug: {
          stateCode,
          actType,
          trigger: 'policy.specialActCaveats or policy.notes is non-empty',
        },
      });
    }

    // ── Rule 6: RON Status ───────────────────────────────────────────────────
    const isRemote = /remote|ron|electronic/i.test(actType);
    if (isRemote && policy) {
      const conf = computeConfidence(policy.updatedAt, policy.publishedAt);
      result.push({
        id: 'ron',
        severity: 'info',
        title: 'Remote Notarization Status',
        body: `RON is ${policy.ronPermitted ? 'permitted' : 'not permitted'} in ${stateName}. Statute: ${policy.ronStatute || '\u2014'}`,
        confidence: conf,
        sourceNote: conf.fromDataset
          ? `Admin dataset · Updated ${new Date(policy.updatedAt || policy.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          : 'Built-in rule — verify with your state authority',
        debug: {
          stateCode,
          actType,
          trigger: `actType matches /remote|ron|electronic/i · policy.ronPermitted = ${policy.ronPermitted}`,
        },
      });
    }

    return result;
  }, [stateCode, actType, fee, data]);

  // Return nothing when there is nothing to show
  if (!stateCode || !actType || rules.length === 0) return null;

  const stateName = STATE_NAMES[stateCode] || stateCode;

  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm ${className}`}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
            Compliance Check &middot; {stateName} &middot; {actType}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
            {rules.length} rule{rules.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMinimized(m => !m)}
          className="ml-2 shrink-0 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          {minimized ? 'Show' : 'Minimize'}
        </button>
      </div>

      {/* ── Rule cards ── */}
      {!minimized && (
        <div className="space-y-2">
          {rules.map(rule => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      )}
    </div>
  );
};


const Journal = () => {
  const {
    data,
    addJournalEntry, updateJournalEntry, deleteJournalEntry,
    createJournalDraftFromAppointment, scoreEntry,
  } = useData();
  const location = useLocation();
  const { afterJournalSave } = useLinker();
  const planTier = data.settings?.planTier || 'free';
  const atJournalLimit = isJournalAtLimit(data.journalEntries || [], planTier);

  const entries = data.journalEntries || [];
  const journalSettings = data.journalSettings || {};
  const appointments = data.appointments || [];
  const invoices = data.invoices || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [query, setQuery] = useState('');
  const [filterActType, setFilterActType] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  const scoredEntries = useMemo(
    () => entries.map((e) => ({ ...e, completenessScore: scoreEntry(e) })),
    [entries]
  );

  const currentMonth = new Date().toISOString().slice(0, 7);
  const kpis = useMemo(() => {
    const thisMonth = scoredEntries.filter((e) => e.date?.startsWith(currentMonth));
    const missingFields = scoredEntries.filter((e) => e.completenessScore < 80);
    const avgScore = scoredEntries.length
      ? Math.round(scoredEntries.reduce((s, e) => s + e.completenessScore, 0) / scoredEntries.length)
      : 0;
    const linked = scoredEntries.filter((e) => e.linkedAppointmentId || e.linkedInvoiceId).length;
    const scanned = scoredEntries.filter((e) => e.idScanConfirmed).length;
    const linkBonus = scoredEntries.length ? Math.round((linked / scoredEntries.length) * 10) : 0;
    const reportScore = scoredEntries.length ? Math.min(100, Math.round(avgScore * 0.9 + linkBonus)) : 0;
    return { thisMonth: thisMonth.length, missingFields: missingFields.length, avgScore, reportScore, linked, scanned, total: scoredEntries.length };
  }, [scoredEntries, currentMonth]);

  const monthOptions = useMemo(() => {
    const months = [...new Set(entries.map((e) => e.date?.slice(0, 7)).filter(Boolean))].sort().reverse();
    return months.map((m) => ({ value: m, label: new Date(m + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }));
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = scoredEntries.filter((e) => {
      const matchQ = !q || [e.signerName, e.actType, e.entryNumber, e.documentDescription, e.notes, e.signerAddress].join(' ').toLowerCase().includes(q);
      const matchAct = !filterActType || e.actType === filterActType;
      const matchMonth = !filterMonth || e.date?.startsWith(filterMonth);
      return matchQ && matchAct && matchMonth;
    });
    result.sort((a, b) => {
      const cmp = (a.date + a.time).localeCompare(b.date + b.time);
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [scoredEntries, query, filterActType, filterMonth, sortAsc]);

  const openNew = (prefill = null) => {
    setEditing(prefill);
    setModalOpen(true);
  };

  const openEdit = (entry) => {
    setEditing(entry);
    setModalOpen(true);
  };

  const handleSave = (form) => {
    const now = new Date().toISOString();
    if (editing?.id) {
      // Build edit log delta
      const delta = [];
      Object.keys(form).forEach((k) => {
        if (String(form[k]) !== String(editing[k] ?? '')) {
          delta.push({ ts: now, field: k, old: editing[k], newVal: form[k] });
        }
      });
      const editLog = [...(editing.editLog || []), ...delta];
      const updated = { ...form, editLog, contentHash: hashEntry(form) };
      updateJournalEntry(editing.id, updated);
    } else {
      const entry = { ...form, createdAt: now, editLog: [], contentHash: hashEntry(form) };
      addJournalEntry(entry);
      afterJournalSave(form);
    }
    setEditing(null);
  };

  const handleDelete = (id) => {
    deleteJournalEntry(id);
    setPendingDelete(null);
    if (expandedId === id) setExpandedId(null);
  };

  const handleQuickLink = (apt) => {
    const draft = createJournalDraftFromAppointment(apt);
    openNew(draft);
  };

  const linkedApptIds = useMemo(() => new Set(entries.map((e) => e.linkedAppointmentId).filter(Boolean)), [entries]);

  React.useEffect(() => {
    const aptId = location.state?.prefillFromAppointment;
    if (!aptId) return;
    const apt = appointments.find((a) => a.id === aptId || a.id === Number(aptId));
    if (apt) {
      const alreadyLogged = entries.some((e) => e.linkedAppointmentId === apt.id);
      if (!alreadyLogged) openNew(createJournalDraftFromAppointment(apt));
    }
    window.history.replaceState({}, '');
  }, [location.state]);

  return (
    <div className="space-y-6 pb-10">
      <EntryModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
        appointments={appointments}
        invoices={invoices}
        journalSettings={journalSettings}
      />
      <DeleteConfirm
        entry={pendingDelete}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {/* ── HERO HEADER ──────────────────────────────────────────────────────── */}
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Records & Audit</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">eJournal</h1>
            <p className="mt-1 text-sm text-slate-200">
              No more dual-app workflow — camera ID scan, OCR assist, and tamper-evident audit trail, all in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => exportCSV(filtered.length ? filtered : scoredEntries)}
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button className="border-0 bg-blue-500 text-white hover:bg-blue-600" onClick={() => openNew()}>
              <Plus className="mr-2 h-4 w-4" /> New Entry
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI ROW ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">This Month</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpis.thisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Missing Fields</p>
                <p className={`text-2xl font-bold ${kpis.missingFields > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {kpis.missingFields}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Report-Ready</p>
                <p className={`text-2xl font-bold ${scoreColor(kpis.reportScore).text}`}>{kpis.reportScore}%</p>
              </div>
            </div>
            <Progress value={kpis.reportScore} className="mt-3 h-1.5" indicatorClassName={scoreColor(kpis.reportScore).bar} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/30">
                <Camera className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">ID Scans</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {kpis.scanned}
                  <span className="ml-0.5 text-sm font-normal text-slate-400">/{kpis.total}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── RETENTION REMINDER ───────────────────────────────────────────────── */}
      {journalSettings.retentionReminderEnabled && (
        <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="flex items-start gap-3 p-4">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Retention Policy Reminder</p>
              <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-300">
                Your journal settings require a <strong>{journalSettings.retentionYears}-year</strong> retention period.
                Always confirm your state's notary statutes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── SEARCH & FILTERS ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search signer, act type, entry #, notes…"
                className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-9 pr-3 text-sm dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={filterActType}
                onChange={(e) => setFilterActType(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Act Types</option>
                {ACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Months</option>
                {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <button
                onClick={() => setSortAsc((v) => !v)}
                className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {sortAsc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} Date
              </button>
            </div>
          </div>
          {(query || filterActType || filterMonth) && (
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs text-slate-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
              <button onClick={() => { setQuery(''); setFilterActType(''); setFilterMonth(''); }} className="text-xs text-blue-600 hover:underline">Clear filters</button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── JOURNAL TABLE ────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700 mb-4">
                <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-500" />
              </div>
              <p className="font-semibold text-slate-600 dark:text-slate-300">No journal entries found.</p>
              <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Add your first entry to build an audit-ready record.</p>
              <Button className="mt-5" onClick={() => openNew()}>
                <Plus className="mr-2 h-4 w-4" /> Add First Entry
              </Button>
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[860px]">
              <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-10"></th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Entry #</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date / Time</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Act Type</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Signer</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">ID</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Fee</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Score</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filtered.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  const sc = entry.completenessScore;
                  const stateReqs = STATE_REQUIREMENTS[entry.idIssuingState] || { thumbActTypes: [] };
                  const thumbprintReqButMissing =
                    (stateReqs.thumbActTypes.includes(entry.actType) ||
                     (journalSettings?.requireThumbprintForActTypes || []).includes(entry.actType)) &&
                    !entry.thumbprintTaken;
                  const hasLinks = entry.linkedAppointmentId || entry.linkedInvoiceId;

                  return (
                    <React.Fragment key={entry.id}>
                      <tr className={`group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${isExpanded ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{entry.entryNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800 dark:text-slate-100 text-xs">{fmtDate(entry.date)}</p>
                          <p className="text-slate-400 text-[11px]">{fmtTime(entry.time)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="blue" className="text-[10px] whitespace-nowrap">{entry.actType}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800 dark:text-slate-100 text-xs leading-tight">{entry.signerName || '—'}</p>
                          {entry.signerAddress && (
                            <p className="text-slate-400 text-[11px] truncate max-w-[140px]">{entry.signerAddress}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-slate-600 dark:text-slate-300">{entry.idType || '—'}</p>
                            {entry.idScanConfirmed && (
                              <span title="ID scanned & confirmed">
                                <Camera className="h-3 w-3 text-blue-400" />
                              </span>
                            )}
                          </div>
                          {entry.idLast4 ? (
                            <p className="text-[11px] text-slate-400 font-mono">
                              ····{entry.idLast4}{entry.idIssuingState ? ` · ${entry.idIssuingState}` : ''}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-900 dark:text-white text-xs">${Number(entry.fee || 0).toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <ScoreRing score={sc} size={38} />
                            {thumbprintReqButMissing && (
                              <span title="Thumbprint required but not recorded">
                                <Fingerprint className="h-3.5 w-3.5 text-amber-500" />
                              </span>
                            )}
                            {hasLinks && (
                              <span title="Linked to appointment/invoice">
                                <Link2 className="h-3.5 w-3.5 text-blue-400" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(entry)} title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => setPendingDelete(entry)} title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* ── EXPANDED DETAIL ROW ─────────────────────────────── */}
                      {isExpanded && (
                        <tr className="bg-blue-50/30 dark:bg-blue-900/10">
                          <td colSpan={9} className="px-6 py-5">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                              {/* ID Block */}
                              <div>
                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">ID Details</p>
                                <dl className="space-y-1 text-xs">
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Type</dt><dd className="text-slate-700 dark:text-slate-200 flex items-center gap-1">{entry.idType || '—'}{entry.idScanConfirmed && <Badge variant="blue" className="text-[9px]">scanned</Badge>}</dd></div>
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">State</dt><dd className="text-slate-700 dark:text-slate-200">{entry.idIssuingState || '—'}</dd></div>
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Last 4</dt><dd className="text-slate-700 dark:text-slate-200 font-mono">{entry.idLast4 ? `····${entry.idLast4}` : '—'}</dd></div>
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Expires</dt>
                                    <dd className={`${entry.idExpiration && new Date(entry.idExpiration) < new Date() ? 'text-red-500 font-medium' : 'text-slate-700 dark:text-slate-200'}`}>
                                      {entry.idExpiration ? fmtDate(entry.idExpiration) : '—'}
                                      {entry.idExpiration && new Date(entry.idExpiration) < new Date() && ' ⚠'}
                                    </dd>
                                  </div>
                                </dl>
                                {entry.idScanCapture && (
                                  <img src={entry.idScanCapture} alt="ID capture" className="mt-2 rounded-md max-h-16 object-contain border border-slate-200 dark:border-slate-700" />
                                )}
                              </div>

                              {/* Act Block */}
                              <div>
                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Act Details</p>
                                <dl className="space-y-1 text-xs">
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Document</dt><dd className="text-slate-700 dark:text-slate-200">{entry.documentDescription || '—'}</dd></div>
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Thumbprint</dt><dd className={entry.thumbprintTaken ? 'text-emerald-600 dark:text-emerald-400' : thumbprintReqButMissing ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-slate-500'}>{entry.thumbprintTaken ? '✓ Taken' : thumbprintReqButMissing ? '⚠ Required' : '✗ Not taken'}</dd></div>
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Witness</dt><dd className="text-slate-700 dark:text-slate-200">{entry.witnessRequired ? 'Required' : 'Not required'}</dd></div>
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Fee</dt><dd className="font-semibold text-slate-700 dark:text-slate-200">${Number(entry.fee || 0).toFixed(2)}</dd></div>
                                </dl>
                              </div>

                              {/* Links & Notes Block */}
                              <div>
                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Links & Notes</p>
                                <dl className="space-y-1 text-xs">
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Appointment</dt><dd className="text-slate-700 dark:text-slate-200">{entry.linkedAppointmentId ? `#${entry.linkedAppointmentId}` : '—'}</dd></div>
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Invoice</dt><dd className="text-slate-700 dark:text-slate-200">{entry.linkedInvoiceId || '—'}</dd></div>
                                </dl>
                                {entry.notes && (
                                  <p className="mt-2 rounded-md bg-slate-100 dark:bg-slate-700/60 px-3 py-2 text-xs italic text-slate-500 dark:text-slate-400">
                                    "{entry.notes}"
                                  </p>
                                )}
                              </div>

                              {/* Audit Trail */}
                              <AuditTrailBlock entry={entry} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* ── QUICK-LINK FROM APPOINTMENTS ────────────────────────────────────── */}
      {appointments.filter((a) => !linkedApptIds.has(a.id)).length > 0 && (
        <Card className="border-dashed border-slate-300 dark:border-slate-600">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="h-4 w-4 text-slate-400" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Quick-Create from Appointments Without Journal Entries
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {appointments
                .filter((a) => !linkedApptIds.has(a.id))
                .slice(0, 6)
                .map((apt) => (
                  <button
                    key={apt.id}
                    onClick={() => handleQuickLink(apt)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <Plus className="h-3 w-3 text-blue-500" />
                    {apt.date} · {apt.client} · {apt.type}
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Journal;
