import React from 'react';
import { useData } from '../context/DataContext';
import FeaturePaywall from '../pages/FeaturePaywall';
import { getGateState } from '../utils/gates';

const GatedRoute = ({ featureKey, children }) => {
  const { data } = useData();
  const planTier = data.settings?.planTier;
  const role = data.settings?.userRole;
  const gate = getGateState(featureKey, { planTier, role });

  if (!gate.allowed) {
    return <FeaturePaywall badge={gate.badge} title={gate.title} description={gate.description} />;
  }

  return children;
};

export default GatedRoute;
