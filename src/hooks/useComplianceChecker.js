// src/hooks/useComplianceChecker.js
// Phase 1 — State-by-state compliance rules + missing field detection
// Each rule has: required fields, conditional rules, fee caps, fix instructions

export const STATE_RULES = {
  AL: {
    name: 'Alabama',
    requiredJournalFields: ['signerName', 'idType', 'actType', 'date'],
    conditionalRules: [],
    feeCap: 5,
    notes: 'Alabama caps notary fees at $5 per notarization.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name as shown on their ID.',
      idType: 'Select the type of ID presented (Driver\'s License, Passport, etc.).',
      actType: 'Select the act type performed (Acknowledgment, Jurat, etc.).',
    },
  },
  AK: {
    name: 'Alaska',
    requiredJournalFields: ['signerName', 'idType', 'actType', 'date'],
    conditionalRules: [],
    feeCap: 15,
    notes: 'Alaska allows up to $15 per notarial act.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name.',
      idType: 'Record the ID type presented by the signer.',
    },
  },
  AZ: {
    name: 'Arizona',
    requiredJournalFields: ['signerName', 'signerAddress', 'idType', 'idIssuingState', 'actType', 'date'],
    conditionalRules: [
      { field: 'thumbprintTaken', condition: 'actType === "Deed" || actType === "Power of Attorney"', message: 'Thumbprint required for deeds and powers of attorney in Arizona.' },
    ],
    feeCap: 10,
    notes: 'Arizona requires signer address in the journal for all acts.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name as shown on their ID.',
      signerAddress: 'Enter the signer\'s residential address (street, city, state, zip).',
      idType: 'Select the type of ID presented.',
      idIssuingState: 'Select the state or country that issued the ID.',
    },
  },
  CA: {
    name: 'California',
    requiredJournalFields: ['signerName', 'signerAddress', 'idType', 'idIssuingState', 'idExpiration', 'actType', 'date', 'fee'],
    conditionalRules: [
      { field: 'thumbprintTaken', condition: 'isRealPropertyDoc || actType === "Power of Attorney"', message: 'California law REQUIRES thumbprint for deeds, deeds of trust, and powers of attorney (Civil Code §1185).' },
      { field: 'witnessRequired', condition: 'actType === "Jurat"', message: 'Jurats in California require the signer to swear or affirm — note this in your journal.' },
    ],
    feeCap: 15,
    notes: 'California requires complete signer ID information including expiration date. Thumbprint is legally required for real-property related documents.',
    fieldFixes: {
      signerName: 'Enter full legal name exactly as it appears on the presented ID.',
      signerAddress: 'Required by CA law — enter the signer\'s residential address.',
      idType: 'California requires the specific ID type. Select from the dropdown.',
      idIssuingState: 'Record the state or country that issued the ID.',
      idExpiration: 'California requires the ID expiration date. Check the signer\'s ID.',
      thumbprintTaken: 'For real-property docs and POAs, CA law requires you to take a thumbprint. Mark this field.',
    },
  },
  CO: {
    name: 'Colorado',
    requiredJournalFields: ['signerName', 'idType', 'actType', 'date'],
    conditionalRules: [],
    feeCap: 10,
    notes: 'Colorado allows electronic journal entries. Fee cap is $10 per act.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name.',
      idType: 'Record the ID type used for identification.',
    },
  },
  CT: {
    name: 'Connecticut',
    requiredJournalFields: ['signerName', 'idType', 'actType', 'date'],
    conditionalRules: [],
    feeCap: 5,
    notes: 'Connecticut caps fees at $5 per notarization.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name.',
    },
  },
  FL: {
    name: 'Florida',
    requiredJournalFields: ['signerName', 'signerAddress', 'idType', 'actType', 'date'],
    conditionalRules: [
      { field: 'idIssuingState', condition: 'idType === "Foreign Passport"', message: 'For foreign passports, record the issuing country.' },
    ],
    feeCap: 10,
    notes: 'Florida requires signer address. Electronic notarization (RON) is permitted.',
    fieldFixes: {
      signerName: 'Enter signer\'s full legal name.',
      signerAddress: 'Florida law requires the signer\'s address in the journal.',
      idType: 'Specify the type of ID the signer presented.',
    },
  },
  GA: {
    name: 'Georgia',
    requiredJournalFields: ['signerName', 'idType', 'actType', 'date'],
    conditionalRules: [],
    feeCap: 2,
    notes: 'Georgia has a very low fee cap of $2 per notarial act.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name.',
      idType: 'Record the form of ID presented.',
    },
  },
  IL: {
    name: 'Illinois',
    requiredJournalFields: ['signerName', 'signerAddress', 'idType', 'idIssuingState', 'actType', 'date'],
    conditionalRules: [],
    feeCap: 1,
    notes: 'Illinois has a $1 per signature fee cap — very strict. Journal must include signer address.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name.',
      signerAddress: 'Illinois requires the signer\'s address in the notary record.',
      idType: 'Record the form of identification used.',
      idIssuingState: 'Note which state or country issued the ID.',
    },
  },
  MD: {
    name: 'Maryland',
    requiredJournalFields: ['signerName', 'idType', 'actType', 'date'],
    conditionalRules: [],
    feeCap: 4,
    notes: 'Maryland caps fees at $4 per notarial act.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name.',
    },
  },
  MI: {
    name: 'Michigan',
    requiredJournalFields: ['signerName', 'idType', 'actType', 'date'],
    conditionalRules: [],
    feeCap: 10,
    notes: 'Michigan notaries should keep a journal even though not legally required — best practice.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full name.',
    },
  },
  MN: {
    name: 'Minnesota',
    requiredJournalFields: ['signerName', 'signerAddress', 'idType', 'actType', 'date'],
    conditionalRules: [],
    feeCap: 5,
    notes: 'Minnesota requires signer address in the journal.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name.',
      signerAddress: 'Enter the signer\'s home address.',
    },
  },
  NJ: {
    name: 'New Jersey',
    requiredJournalFields: ['signerName', 'idType', 'actType', 'date'],
    conditionalRules: [],
    feeCap: 2.50,
    notes: 'New Jersey caps fees at $2.50 per notarial act.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name.',
    },
  },
  NV: {
    name: 'Nevada',
    requiredJournalFields: ['signerName', 'signerAddress', 'idType', 'idIssuingState', 'idExpiration', 'idLast4', 'actType', 'date', 'fee'],
    conditionalRules: [
      { field: 'thumbprintTaken', condition: 'true', message: 'Nevada requires a thumbprint for every notarial act in the journal.' },
    ],
    feeCap: 15,
    notes: 'Nevada has strict requirements: thumbprint for every act, full ID details required.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name.',
      signerAddress: 'Nevada law requires the signer\'s address.',
      idType: 'Record the exact ID type.',
      idIssuingState: 'Record issuing state or country.',
      idExpiration: 'Nevada requires the ID expiration date.',
      idLast4: 'Record the last 4 digits of the ID number.',
      thumbprintTaken: 'Nevada REQUIRES a thumbprint for every notarial act.',
    },
  },
  NY: {
    name: 'New York',
    requiredJournalFields: ['signerName', 'actType', 'date'],
    conditionalRules: [],
    feeCap: 2,
    notes: 'New York does not legally require a journal but best practice is to keep one. Fee cap is $2.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name.',
    },
  },
  NC: {
    name: 'North Carolina',
    requiredJournalFields: ['signerName', 'signerAddress', 'idType', 'actType', 'date'],
    conditionalRules: [],
    feeCap: 10,
    notes: 'North Carolina requires the signer\'s address in the notary journal.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name.',
      signerAddress: 'NC law requires the signer address in the journal.',
      idType: 'Record the type of ID presented.',
    },
  },
  OH: {
    name: 'Ohio',
    requiredJournalFields: ['signerName', 'signerAddress', 'idType', 'idIssuingState', 'actType', 'date'],
    conditionalRules: [
      { field: 'witnessRequired', condition: 'actType === "Jurat"', message: 'Ohio jurats require the signer to take an oath — document this.' },
    ],
    feeCap: null,
    notes: 'Ohio requires the signer\'s full address in the journal. No statutory fee cap for notaries.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name as it appears on their ID.',
      signerAddress: 'Ohio requires the signer\'s full street address (e.g., 1020 County Road 3, Chesapeake, OH 45619).',
      idType: 'Select the type of ID the signer presented.',
      idIssuingState: 'Select the state that issued the ID (typically OH for Ohio residents).',
    },
  },
  PA: {
    name: 'Pennsylvania',
    requiredJournalFields: ['signerName', 'idType', 'actType', 'date'],
    conditionalRules: [],
    feeCap: 5,
    notes: 'Pennsylvania caps fees at $5 per notarial act.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name.',
      idType: 'Record the form of identification.',
    },
  },
  TX: {
    name: 'Texas',
    requiredJournalFields: ['signerName', 'idType', 'actType', 'date'],
    conditionalRules: [],
    feeCap: 6,
    notes: 'Texas caps fees at $6 per notarized signature. Journal is not legally required but strongly recommended.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name.',
      idType: 'Record the type of ID used for identification.',
    },
  },
  VA: {
    name: 'Virginia',
    requiredJournalFields: ['signerName', 'idType', 'actType', 'date'],
    conditionalRules: [],
    feeCap: 5,
    notes: 'Virginia caps fees at $5 per notarial act.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name.',
    },
  },
  WA: {
    name: 'Washington',
    requiredJournalFields: ['signerName', 'idType', 'actType', 'date'],
    conditionalRules: [],
    feeCap: 10,
    notes: 'Washington permits Remote Online Notarization (RON). Must use an approved platform and retain AV records for 10 years.',
    fieldFixes: {
      signerName: 'Enter the signer\'s full legal name.',
      idType: 'Record the type of identification presented.',
    },
  },
};

/**
 * Check a journal entry against state compliance rules.
 * Returns: { errors, warnings, missingRequired, conditionalFlags, feeCap, stateNotes, score }
 */
export function checkCompliance(journalEntry = {}, stateCode = 'WA') {
  const rules = STATE_RULES[stateCode] || STATE_RULES['WA'];
  const errors = [];
  const warnings = [];
  const missingRequired = [];
  const conditionalFlags = [];

  // Check required fields
  for (const field of rules.requiredJournalFields) {
    const val = journalEntry[field];
    const isEmpty = val === undefined || val === null || val === '' || val === false;
    if (isEmpty) {
      missingRequired.push({
        field,
        message: rules.fieldFixes?.[field] || `${field} is required in ${rules.name}.`,
        fix: rules.fieldFixes?.[field] || `Please provide the ${field}.`,
        severity: 'error',
      });
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check conditional rules
  for (const rule of rules.conditionalRules || []) {
    try {
      // Safe evaluation of condition with journal context
      const isRealPropertyDoc = /deed|trust|mortgage|power of attorney/i.test(journalEntry.documentDescription || '');
      const actType = journalEntry.actType || '';
      const idType = journalEntry.idType || '';
      // eslint-disable-next-line no-new-func
      const condMet = new Function('actType', 'isRealPropertyDoc', 'idType', `return !!(${rule.condition})`)(actType, isRealPropertyDoc, idType);
      if (condMet) {
        const fieldVal = journalEntry[rule.field];
        const isEmpty = fieldVal === undefined || fieldVal === null || fieldVal === '' || fieldVal === false;
        if (isEmpty) {
          conditionalFlags.push({ field: rule.field, message: rule.message, severity: 'warning' });
          warnings.push(rule.message);
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  // Fee cap check
  if (rules.feeCap !== null && rules.feeCap !== undefined) {
    const fee = parseFloat(journalEntry.fee) || 0;
    if (fee > rules.feeCap) {
      warnings.push(`Fee $${fee} exceeds ${rules.name} cap of $${rules.feeCap}.`);
    }
  }

  // Confidence score: 100 - (15 per missing required field) - (5 per warning)
  const score = Math.max(10, 100 - missingRequired.length * 15 - warnings.length * 5);

  return {
    stateCode,
    stateName: rules.name,
    errors,
    warnings,
    missingRequired,
    conditionalFlags,
    feeCap: rules.feeCap,
    stateNotes: rules.notes,
    score,
    isCompliant: errors.length === 0,
    allIssues: [
      ...missingRequired.map((m) => ({ ...m, severity: 'error' })),
      ...conditionalFlags.map((c) => ({ ...c, severity: 'warning' })),
    ],
  };
}

/**
 * React hook — returns a compliance check function bound to the current state setting.
 */
export function useComplianceChecker(stateCode = 'WA') {
  const check = (journalEntry) => checkCompliance(journalEntry, stateCode);
  const rules = STATE_RULES[stateCode] || STATE_RULES['WA'];
  return { check, rules, stateCode };
}

export default useComplianceChecker;
