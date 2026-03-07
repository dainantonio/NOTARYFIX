// src/utils/gates.js
export const PLAN_TIERS = ['free', 'pro', 'agency'];

// Canonical role list — includes operational roles used in Admin.jsx permission checks.
// IMPORTANT: normalizeRole falls back to 'notary' (minimum privilege) for unrecognized values.
// Do NOT fall back to 'owner' — that would silently grant maximum access.
export const ROLES = [
  'owner',            // Full access — account holder
  'admin',            // Full admin access, limited billing
  'compliance_manager', // Can publish/approve state rules and knowledge articles
  'agency_admin',     // Can submit for review and edit records, cannot publish directly
  'dispatcher',       // Operational scheduling only
  'notary',           // Field-level read + own record access
];

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
    allowedRoles: ['owner', 'admin', 'compliance_manager', 'agency_admin'],
    adminBypass: true,
    badge: 'ADMIN ONLY',
    title: 'Admin Control Center',
    description: 'Manage state policies, fee tables, AI content, and governance. Requires Owner, Admin, Compliance Manager, or Agency Admin role.',
  },

  // ── Combined plan + role ──────────────────────────────────────────────────
  teamControls: {
    requiredPlan: 'agency',
    allowedRoles: ['owner', 'admin', 'agency_admin', 'dispatcher'],
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
  appointmentFull: {
    requiredPlan: 'pro', // Free tier is capped at 14 signings per week in business logic
    badge: 'PRO FEATURE',
    title: 'Unlimited Appointments',
    description: 'Free accounts are limited to 14 signings per week. Upgrade to Pro for unlimited appointments.',
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export const normalizePlanTier = (value) =>
  PLAN_TIERS.includes(value) ? value : 'free';

// Falls back to 'notary' (minimum privilege) — NOT 'owner' — for unrecognized roles.
// This prevents silent privilege escalation when an unknown role string is passed.
export const normalizeRole = (value) =>
  ROLES.includes(value) ? value : 'notary';

const isPlanAllowed = (currentPlan, requiredPlan) => {
  if (!requiredPlan) return true;
  return PLAN_TIERS.indexOf(normalizePlanTier(currentPlan)) >= PLAN_TIERS.indexOf(requiredPlan);
};

export const getGateState = (featureKey, { planTier, role } = {}) => {
  const rule = FEATURE_RULES[featureKey] || {};
  const safePlan = normalizePlanTier(planTier);
  const safeRole = normalizeRole(role);

  // Admin bypass: owner/admin/compliance_manager roles always get access to admin-bypass features
  if (rule.adminBypass && (safeRole === 'admin' || safeRole === 'owner' || safeRole === 'compliance_manager')) {
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

// ─── APPOINTMENT WEEKLY SOFT LIMIT ────────────────────────────────────────────
// Returns true if adding another appointment would exceed the free tier weekly limit (14/week)
export const isAppointmentAtWeeklyLimit = (appointments, planTier) => {
  if (normalizePlanTier(planTier) !== 'free') return false;
  const now = new Date();
  // ISO week: Monday = start of week
  const dayOfWeek = (now.getDay() + 6) % 7; // 0=Mon … 6=Sun
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const thisWeek = (appointments || []).filter((a) => {
    const d = new Date(a.createdAt || a.date);
    return d >= weekStart && d < weekEnd;
  });
  return thisWeek.length >= 14;
};
