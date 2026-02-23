export const PLAN_TIERS = ['free', 'pro', 'agency'];
export const ROLES = ['owner', 'admin', 'dispatcher', 'notary'];

const FEATURE_RULES = {
  signerPortal: {
    requiredPlan: 'pro',
    badge: 'PRO FEATURE',
    title: 'Signer Portal',
    description: 'Give clients a polished signing experience with secure document access, status visibility, and less back-and-forth.',
  },
  teamDispatch: {
    requiredPlan: 'agency',
    badge: 'AGENCY FEATURE',
    title: 'Team Dispatch',
    description: 'Coordinate multi-notary operations with dispatch controls, team routing, and centralized oversight.',
  },
  aiTrainer: {
    requiredPlan: 'pro',
    badge: 'PRO FEATURE',
    title: 'AI Trainer',
    description: 'Access premium compliance simulations and adaptive coaching to improve confidence before every appointment.',
  },
  admin: {
    allowedRoles: ['owner', 'admin'],
  },
};

export const normalizePlanTier = (value) => (PLAN_TIERS.includes(value) ? value : 'free');
export const normalizeRole = (value) => (ROLES.includes(value) ? value : 'admin'); // Default to admin for testing

const isPlanAllowed = (currentPlan, requiredPlan) => {
  if (!requiredPlan) return true;
  return PLAN_TIERS.indexOf(normalizePlanTier(currentPlan)) >= PLAN_TIERS.indexOf(requiredPlan);
};

export const getGateState = (featureKey, { planTier, role }) => {
  const rule = FEATURE_RULES[featureKey] || {};
  const safePlan = normalizePlanTier(planTier);
  const safeRole = normalizeRole(role);

  const roleAllowed = !rule.allowedRoles || rule.allowedRoles.includes(safeRole);
  const planAllowed = isPlanAllowed(safePlan, rule.requiredPlan);
  const allowed = role === 'admin' ? true : (roleAllowed && planAllowed); // Admin bypass

  return {
    allowed,
    roleAllowed,
    planAllowed,
    requiredPlan: rule.requiredPlan,
    allowedRoles: rule.allowedRoles || [],
    badge: rule.badge,
    title: rule.title,
    description: rule.description,
  };
};
