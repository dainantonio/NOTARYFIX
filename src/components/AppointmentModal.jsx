import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Calendar, Clock, DollarSign, User, FileText, MapPin, Mic, MicOff, ScanLine, CheckCircle2 } from 'lucide-react';
import { Button } from './UI';

const DEFAULT_FORM = {
  client: '',
  type: 'Loan Signing',
  date: '',
  time: '',
  fee: '',
  location: '',
  notes: '',
  receiptName: '',
  receiptImage: '',
};

const serviceTypes = ['Loan Signing', 'General Notary Work (GNW)', 'I-9 Verification', 'Apostille', 'Remote Online Notary (RON)'];

const normalizeTimeInput = (value) => {
  if (!value) return '';
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const match = value.match(/(\d{1,2}):(\d{2})\s?(AM|PM|am|pm)/);
  if (!match) return '';
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  const mer = match[3].toUpperCase();
  const hh = mer === 'PM' ? (hours % 12) + 12 : hours % 12;
  return `${String(hh).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const parseQuickEntry = (text) => {
  const lower = text.toLowerCase();
  const next = {};

  const feeMatch = text.match(/\$?\s?(\d+(?:\.\d{1,2})?)/);
  if (feeMatch) next.fee = feeMatch[1];

  const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) next.date = dateMatch[1];

  const timeMatch = text.match(/(\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)?)/);
  if (timeMatch) next.time = normalizeTimeInput(timeMatch[1]) || timeMatch[1];

  const zipMatch = text.match(/\b(\d{5})\b/);
  if (zipMatch) next.location = zipMatch[1];

  const nameMatch = text.match(/for\s+([A-Za-z][A-Za-z\s.'-]{2,})/i);
  if (nameMatch) next.client = nameMatch[1].trim();

  if (lower.includes('i-9')) next.type = 'I-9 Verification';
  else if (lower.includes('apostille')) next.type = 'Apostille';
  else if (lower.includes('ron') || lower.includes('remote online')) next.type = 'Remote Online Notary (RON)';
  else if (lower.includes('general') || lower.includes('gnw')) next.type = 'General Notary Work (GNW)';
  else if (lower.includes('loan')) next.type = 'Loan Signing';

  return next;
};

const AppointmentModal = ({ isOpen, onClose, onSave, initialData = null, submitLabel = 'Save Appointment' }) => {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [quickInput, setQuickInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported] = useState(() => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!initialData) {
      setFormData(DEFAULT_FORM);
      return;
    }
    setFormData({
      client: initialData.client || '',
      type: initialData.type || 'Loan Signing',
      date: initialData.date && /^\d{4}-\d{2}-\d{2}$/.test(initialData.date) ? initialData.date : '',
      time: normalizeTimeInput(initialData.time),
      fee: initialData.amount?.toString?.() || initialData.fee || '',
      location: initialData.location || '',
      notes: initialData.notes || '',
      receiptName: initialData.receiptName || '',
      receiptImage: initialData.receiptImage || '',
    });
  }, [isOpen, initialData]);

  const receiptSaved = useMemo(() => Boolean(formData.receiptName), [formData.receiptName]);

  if (!isOpen) return null;

  const applyQuickEntry = () => {
    if (!quickInput.trim()) return;
    const parsed = parseQuickEntry(quickInput);
    setFormData((prev) => ({ ...prev, ...parsed, notes: prev.notes || quickInput.trim() }));
  };

  const toggleVoice = () => {
    if (!voiceSupported) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join(' ').trim();
      setQuickInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleReceipt = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, receiptName: file.name, receiptImage: typeof reader.result === 'string' ? reader.result : '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
    setFormData(DEFAULT_FORM);
    setQuickInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-6 py-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">{initialData ? 'Edit Appointment' : 'New Appointment'}</h3>
          <button onClick={onClose} className="text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 p-6">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
            <label className="mb-2 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Quick Add (type or speak)</label>
            <textarea
              rows={2}
              placeholder="Example: Loan signing for Sarah Johnson on 2026-03-21 at 2:30 PM, $150, zip 98101"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="xs" onClick={applyQuickEntry}>Transcribe to Fields</Button>
              <Button type="button" size="xs" variant="secondary" onClick={toggleVoice} disabled={!voiceSupported}>
                {isListening ? <MicOff className="mr-1 h-3.5 w-3.5" /> : <Mic className="mr-1 h-3.5 w-3.5" />}
                {isListening ? 'Stop Listening' : 'Speak'}
              </Button>
              {!voiceSupported && <span className="text-xs text-slate-500">Voice entry not supported in this browser.</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Client Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input required type="text" className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Service Type</label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  {serviceTypes.map((option) => <option key={option}>{option}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input required type="date" className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input required type="time" className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Fee ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input required type="number" placeholder="0.00" className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.fee} onChange={(e) => setFormData({ ...formData, fee: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Zip Code</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="12345" className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Notes</label>
            <textarea rows={2} className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <label className="mb-2 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Scan Receipt</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ScanLine className="h-4 w-4" /> Upload / Scan Receipt
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleReceipt(e.target.files?.[0])} />
            </label>
            {receiptSaved && <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Saved: {formData.receiptName}</div>}
          </div>

          <div className="sticky bottom-0 bg-white dark:bg-slate-800 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">{submitLabel}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;
