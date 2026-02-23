import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

// MVP Mock Data for Grounded Knowledge Base
const initialKnowledgeBase = {
  CA: {
    name: 'California',
    feeLimits: '$15 per signature acknowledged or jurat.',
    acceptableIDs: 'CA Driver License, US Passport, Inmate ID (if in custody), any state DL if issued within 5 years.',
    witnessRequirements: 'Two credible witnesses if signer lacks ID. Signature by mark requires two witnesses.',
    caveats: 'No certifying copies of vital records. Thumbprint required in journal for deeds, quitclaim deeds, and deeds of trust.',
    lastUpdated: new Date().toISOString().split('T')[0],
    version: '1.0'
  },
  TX: {
    name: 'Texas',
    feeLimits: '$6 for first signature, $1 for each additional signature.',
    acceptableIDs: 'Valid state-issued ID, US Passport, Military ID, or ID issued by foreign gov (must have photo and signature).',
    witnessRequirements: 'One credible witness personally known to the notary, or two credible witnesses not known to the notary but with valid ID.',
    caveats: 'Notaries may not record biometric data (thumbprints) unless explicitly required for a specific real estate transaction.',
    lastUpdated: new Date().toISOString().split('T')[0],
    version: '1.1'
  },
  NY: {
    name: 'New York',
    feeLimits: '$2 per signature.',
    acceptableIDs: 'Satisfactory evidence of identity (Driver\'s License, Passport, non-driver ID card).',
    witnessRequirements: 'Witness must have no financial interest in the transaction.',
    caveats: 'Electronic notarization allowed but requires separate registration and specific technology platforms approved by the state.',
    lastUpdated: '2023-11-15',
    version: '2.0'
  }
};

export function DataProvider({ children }) {
  // Existing state (mocked for context completeness)
  const [sessions, setSessions] = useState([]);
  const [clients, setClients] = useState([]);
  
  // New: AI Knowledge Base Pipeline State
  const [knowledgeBase, setKnowledgeBase] = useState(() => {
    const saved = localStorage.getItem('notary_kb');
    return saved ? JSON.parse(saved) : initialKnowledgeBase;
  });

  // Persist KB changes
  useEffect(() => {
    localStorage.setItem('notary_kb', JSON.stringify(knowledgeBase));
  }, [knowledgeBase]);

  const updateKnowledgeBase = (stateCode, newData) => {
    setKnowledgeBase(prev => {
      const existing = prev[stateCode] || {};
      const newVersion = existing.version ? (parseFloat(existing.version) + 0.1).toFixed(1) : '1.0';
      
      return {
        ...prev,
        [stateCode]: {
          ...newData,
          name: newData.name || stateCode,
          lastUpdated: new Date().toISOString().split('T')[0],
          version: newVersion
        }
      };
    });
  };

  return (
    <DataContext.Provider value={{ 
      sessions, setSessions, 
      clients, setClients,
      knowledgeBase, updateKnowledgeBase 
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
