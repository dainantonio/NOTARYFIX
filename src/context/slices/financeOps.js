/**
 * financeOps.js — DataContext slice
 * Manages businessExpenses and taxDocuments arrays.
 * Follows the setData/getData pattern of other slices.
 */

import { nanoid } from 'nanoid';

export function createFinanceOps(setData, getData) {
  // ── Business Expenses ────────────────────────────────────────────────────
  const addBusinessExpense = (expense) => {
    const record = {
      id: nanoid(),
      createdAt: new Date().toISOString(),
      date: expense.date || new Date().toISOString().split('T')[0],
      category: expense.category || 'other',
      description: expense.description || '',
      vendor: expense.vendor || '',
      amount: Number(expense.amount) || 0,
      receiptUrl: expense.receiptUrl || null,
      notes: expense.notes || '',
    };
    setData(prev => ({
      ...prev,
      businessExpenses: [...(prev.businessExpenses || []), record],
    }));
    return record;
  };

  const updateBusinessExpense = (id, patch) => {
    setData(prev => ({
      ...prev,
      businessExpenses: (prev.businessExpenses || []).map(e =>
        e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e
      ),
    }));
  };

  const deleteBusinessExpense = (id) => {
    setData(prev => ({
      ...prev,
      businessExpenses: (prev.businessExpenses || []).filter(e => e.id !== id),
    }));
  };

  // ── Tax Documents ────────────────────────────────────────────────────────
  const addTaxDocument = (doc) => {
    const record = {
      id: nanoid(),
      createdAt: new Date().toISOString(),
      docType: doc.docType || '1099-NEC', // '1099-NEC' | 'W-9' | 'Receipt' | 'Invoice' | 'Other'
      taxYear: doc.taxYear || new Date().getFullYear(),
      payer: doc.payer || '',
      amount: doc.amount != null ? Number(doc.amount) : null,
      filename: doc.filename || '',
      notes: doc.notes || '',
      status: 'uploaded', // uploaded | verified | filed
      agentExtracted: doc.agentExtracted || false,
    };
    setData(prev => ({
      ...prev,
      taxDocuments: [...(prev.taxDocuments || []), record],
    }));
    return record;
  };

  const updateTaxDocument = (id, patch) => {
    setData(prev => ({
      ...prev,
      taxDocuments: (prev.taxDocuments || []).map(d =>
        d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d
      ),
    }));
  };

  const deleteTaxDocument = (id) => {
    setData(prev => ({
      ...prev,
      taxDocuments: (prev.taxDocuments || []).filter(d => d.id !== id),
    }));
  };

  return {
    addBusinessExpense,
    updateBusinessExpense,
    deleteBusinessExpense,
    addTaxDocument,
    updateTaxDocument,
    deleteTaxDocument,
  };
}
