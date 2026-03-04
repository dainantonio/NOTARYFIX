import React from 'react';
import { useLocation } from 'react-router-dom';
import FeaturePaywall from './FeaturePaywall';

const NavFeaturePaywall = () => {
  const { state } = useLocation();

  return (
    <FeaturePaywall
      badge={state?.badge || 'PRO FEATURE'}
      title={state?.title || 'Premium Feature'}
      description={state?.description || 'Upgrade your plan to unlock this feature.'}
      featureKey={state?.featureKey || 'aiTrainer'}
    />
  );
};

export default NavFeaturePaywall;
