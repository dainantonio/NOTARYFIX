export const normalizeServiceType = (serviceType = '') => {
  const raw = String(serviceType || '').trim();
  if (!raw) return 'General Notary Work (GNW)';
  const lower = raw.toLowerCase();

  if (lower.includes('loan')) return 'Loan Signing';
  if (lower.includes('i-9') || lower.includes('i9')) return 'I-9 Verification';
  if (lower.includes('apostille')) return 'Apostille';
  if (lower.includes('remote online') || lower.includes('ron')) return 'Remote Online Notary (RON)';
  if (lower.includes('general notary') || lower.includes('(gnw)') || lower === 'general notary') return 'General Notary Work (GNW)';

  return raw;
};

export const mapServiceTypeToJournalActType = (serviceType = '') => {
  const normalized = normalizeServiceType(serviceType);

  switch (normalized) {
    case 'Loan Signing':
      return 'Acknowledgment';
    case 'General Notary Work (GNW)':
      return 'Acknowledgment';
    case 'Apostille':
      return 'Copy Certification';
    case 'I-9 Verification':
      return 'Signature Witnessing';
    case 'Remote Online Notary (RON)':
      return 'Remote Online Notary (RON)';
    default:
      return 'Acknowledgment';
  }
};
