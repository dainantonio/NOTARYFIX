// src/components/GlobalOverlays.jsx
// Renders toast stack + action prompt modal — mounted once in Layout
import React, { useEffect, useState } from 'react';
import { CheckCircle2, Info, AlertCircle, X, ArrowRight, BookOpen, DollarSign, FileText } from 'lucide-react';
import { toast, promptBus } from '../hooks/useLinker';

// ─── TOAST ────────────────────────────────────────────────────────────────────
const TOAST_META = {
  success: { icon: CheckCircle2, ring: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-600', text: 'text-emerald-800 dark:text-emerald-200', icon_cls: 'text-emerald-500' },
  info:    { icon: Info,          ring: 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-600',           text: 'text-blue-800 dark:text-blue-200',    icon_cls: 'text-blue-500'    },
  error:   { icon: AlertCircle,   ring: 'border-red-400 bg-red-50 dark:bg-red-900/30 dark:border-red-600',              text: 'text-red-800 dark:text-red-200',      icon_cls: 'text-red-500'     },
};

const PROMPT_META = {
  journalPrompt: { icon: BookOpen,    color: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600 dark:text-indigo-400' },
  invoicePrompt: { icon: DollarSign,  color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  default:       { icon: FileText,    color: 'bg-slate-100 dark:bg-slate-700', iconColor: 'text-slate-600 dark:text-slate-300' },
};

export const ToastStack = () => {
  const [items, setItems] = useState([]);
  useEffect(() => toast.subscribe(setItems), []);

  if (!items.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {items.map((t) => {
        const meta = TOAST_META[t.type] || TOAST_META.info;
        const Icon = meta.icon;
        return (
          <div key={t.id}
            className={`pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-sm rounded-xl border px-4 py-3 shadow-xl backdrop-blur ${meta.ring} animate-in slide-in-from-bottom-2 fade-in duration-200`}>
            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${meta.icon_cls}`} />
            <p className={`flex-1 text-sm font-medium ${meta.text}`}>{t.msg}</p>
            <button onClick={() => toast.dismiss(t.id)} className="opacity-50 hover:opacity-100 transition-opacity"><X className="h-4 w-4 text-slate-500" /></button>
          </div>
        );
      })}
    </div>
  );
};

export const PromptModal = () => {
  const [prompt, setPrompt] = useState(null);
  useEffect(() => promptBus.subscribe(setPrompt), []);

  if (!prompt) return null;

  const meta = PROMPT_META[prompt.type] || PROMPT_META.default;
  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => { prompt.onDismiss?.(); }}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${meta.color}`}>
            <Icon className={`h-5 w-5 ${meta.iconColor}`} />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{prompt.title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{prompt.body}</p>
        </div>
        <div className="flex gap-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-6 py-4">
          <button onClick={() => prompt.onDismiss?.()}
            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
            {prompt.cancelLabel || 'Skip'}
          </button>
          <button onClick={() => prompt.onConfirm?.()}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:hover:bg-blue-500 transition-colors">
            {prompt.confirmLabel || 'Continue'}<ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
