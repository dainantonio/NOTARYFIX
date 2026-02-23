// src/utils/gates.js
export const PLAN_TIERS = ['free', 'pro', 'agency'];
export const ROLES = ['owner', 'admin', 'dispatcher', 'notary'];

// ─── FEATURE RULES ────────────────────────────────────────────────────────────
// requiredPlan: minimum plan tier to access this feature
// allowedRoles: if set, only these roles can access (plan still applies)
// adminBypass:  true = admin role always gets access regardless of plan
const FEATURE_RULES = {
  // ── Plan-gated features ───────────────────────────────────────────────────
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
    description: 'Coordinate multi-notary operations with dispatch controls, team routing, and SLA oversight.',
  },
  aiTrainer: {
    requiredPlan: 'pro',
    badge: 'PRO FEATURE',
    title: 'AI Trainer',
    description: 'Get on-demand compliance guidance, fee lookups, and state-by-state notary rules grounded in real statutes.',
  },

  // ── Role-gated features ───────────────────────────────────────────────────
  admin: {
    allowedRoles: ['owner', 'admin'],
    adminBypass: true,
    badge: 'ADMIN ONLY',
    title: 'Admin Control Center',
    description: 'Manage state policies, fee tables, AI content, and governance. Requires Owner or Admin role.',
  },

  // ── Combined plan + role ──────────────────────────────────────────────────
  teamControls: {
    requiredPlan: 'agency',
    allowedRoles: ['owner', 'admin', 'dispatcher'],
    badge: 'AGENCY FEATURE',
    title: 'Team Controls',
    description: 'Manage and assign team members. Requires Agency plan with a management role.',
  },

  // ── Soft limits (informational gates, non-blocking) ───────────────────────
  journalFull: {
    requiredPlan: 'pro', // Free tier is capped at 10/month in business logic
    badge: 'PRO FEATURE',
    title: 'Unlimited Journal Entries',
    description: 'Free accounts are limited to 10 journal entries per month. Upgrade to Pro for unlimited entries.',
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export const normalizePlanTier = (value) =>
  PLAN_TIERS.includes(value) ? value : 'free';

export const normalizeRole = (value) =>
  ROLES.includes(value) ? value : 'owner';

const isPlanAllowed = (currentPlan, requiredPlan) => {
  if (!requiredPlan) return true;
  return PLAN_TIERS.indexOf(normalizePlanTier(currentPlan)) >= PLAN_TIERS.indexOf(requiredPlan);
};

export const getGateState = (featureKey, { planTier, role } = {}) => {
  const rule = FEATURE_RULES[featureKey] || {};
  const safePlan = normalizePlanTier(planTier);
  const safeRole = normalizeRole(role);

  // Admin bypass: admin/owner roles always get access to admin-bypass features
  if (rule.adminBypass && (safeRole === 'admin' || safeRole === 'owner')) {
    return {
      allowed: true, roleAllowed: true, planAllowed: true,
      requiredPlan: rule.requiredPlan, allowedRoles: rule.allowedRoles || [],
      badge: rule.badge, title: rule.title, description: rule.description,
    };
  }

  const roleAllowed = !rule.allowedRoles || rule.allowedRoles.includes(safeRole);
  const planAllowed = isPlanAllowed(safePlan, rule.requiredPlan);
  const allowed = roleAllowed && planAllowed;

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

// ─── JOURNAL SOFT LIMIT ───────────────────────────────────────────────────────
// Returns true if adding another entry would exceed the free tier monthly limit
export const isJournalAtLimit = (entries, planTier) => {
  if (normalizePlanTier(planTier) !== 'free') return false;
  const now = new Date();
  const thisMonth = entries.filter((e) => {
    const d = new Date(e.createdAt || e.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  return thisMonth.length >= 10;
};
