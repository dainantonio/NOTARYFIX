// src/components/Layout.jsx
import React, { useState, useEffect } from 'react';
import PWAInstallBanner from './PWAInstallBanner';
import { Link, useLocation, BrowserRouter, useInRouterContext, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Settings, LogOut, FileText, Menu,
  Sun, Moon, Search, Command, MapPin, X, Lock,
  UserCheck, ScrollText, Wallet, BadgeCheck, Truck, Brain, Wrench, Scale,
  Sparkles, Maximize2, Minimize2, MoreHorizontal, Inbox,
  DollarSign, TrendingUp, Satellite, Navigation, Square, HelpCircle} from 'lucide-react';
import { useData } from '../context/DataContext';
import { getGateState } from '../utils/gates';
import { ToastStack, PromptModal } from './GlobalOverlays';
import { useTheme } from '../context/ThemeContext';
import { ActiveTripProvider, useActiveTrip } from '../context/ActiveTripContext';

// --- INLINED COMPONENTS FOR STABILITY ---
const Button = ({ children, variant = 'primary', size = 'default', className = '', ...props }) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    default: "h-10 px-4 py-2 text-sm",
    icon: "h-10 w-10 p-2 flex items-center justify-center"
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 ${variants[variant] || variants.primary} ${sizes[size] || sizes.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const CommandPalette = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center pt-[20vh]" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Type a command or search..." className="flex-1 bg-transparent outline-none dark:text-white" autoFocus />
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Quick Actions</div>
          <div className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">Create new invoice</div>
          <div className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">Add new client</div>
        </div>
      </div>
    </div>
  );
};

// ─── Live GPS Trip Banner ─────────────────────────────────────────────────────
// Fixed floating pill visible on all app pages while a trip is being tracked.
// Mobile: sits above the bottom nav bar. Desktop: floats bottom-right.
function LiveTripBanner() {
  const { liveTrip, gpsStatus, liveMiles, stopAndGetMiles } = useActiveTrip();
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState('0:00');

  useEffect(() => {
    if (!liveTrip?.startedAt) { setElapsed('0:00'); return; }
    const tick = () => {
      const secs = Math.floor((Date.now() - liveTrip.startedAt) / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      setElapsed(`${m}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [liveTrip?.startedAt]);

  if (!liveTrip) return null;

  const isActive = gpsStatus === 'active';
  const isAcquiring = gpsStatus === 'acquiring';

  return (
    <div
      className="fixed z-40 left-0 right-0 md:left-auto md:right-5 md:max-w-sm"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 66px)' }}
    >
      <div
        className="mx-3 md:mx-0 rounded-2xl bg-slate-900 dark:bg-slate-800 border border-cyan-500/40 shadow-2xl shadow-black/40 overflow-hidden cursor-pointer"
        onClick={() => navigate('/mileage')}
      >
        {/* Top accent bar */}
        <div className={`h-0.5 w-full ${isActive ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-pulse' : 'bg-slate-600'}`} />

        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* GPS status indicator */}
          <div className="relative shrink-0">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${isActive ? 'bg-cyan-500/20' : 'bg-slate-700'}`}>
              <Navigation className={`h-4 w-4 ${isActive ? 'text-cyan-400' : isAcquiring ? 'text-amber-400' : 'text-slate-400'} ${isActive ? 'animate-pulse' : ''}`} />
            </div>
            {isActive && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
              </span>
            )}
          </div>

          {/* Trip info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-cyan-400' : isAcquiring ? 'text-amber-400' : 'text-slate-400'}`}>
                {isActive ? 'GPS tracking' : isAcquiring ? 'Acquiring GPS…' : 'Tracking'}
              </span>
              <span className="text-[10px] text-slate-500">· {elapsed}</span>
            </div>
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {liveTrip.destination || 'Destination not set'}
            </p>
          </div>

          {/* Live miles */}
          <div className="shrink-0 text-right mr-1">
            <p className={`text-base font-black font-mono leading-tight ${isActive ? 'text-cyan-300' : 'text-slate-400'}`}>
              {isActive ? liveMiles.toFixed(1) : isAcquiring ? '…' : '—'}
            </p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">mi</p>
          </div>

          {/* Stop button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/mileage', { state: { triggerStop: true } });
            }}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30 transition-colors"
            title="Stop tracking"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Tier badge colors
const TIER_STYLES = {
  free: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', label: 'Free' },
  pro: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', label: 'Pro' },
  agency: { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', label: 'Agency' },
};

const LayoutInner = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { data, updateSettings, checkAutoScanAR } = useData();

  const planTier = data.settings?.planTier || 'free';
  const userRole = data.settings?.userRole || 'owner';
  const userName = data.settings?.name || 'User';
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'NF';
  const businessLogo = data.settings?.businessLogo || '';

  const tierStyle = TIER_STYLES[planTier] || TIER_STYLES.free;

  const gateContext = { planTier, role: userRole };
  const signerPortalGate = getGateState('signerPortal', gateContext);
  const teamDispatchGate = getGateState('teamDispatch', gateContext);
  const aiTrainerGate = getGateState('aiTrainer', gateContext);
  const adminGate = getGateState('admin', gateContext);

  // FIX 12: live badge count for Command Center nav item
  const pendingAgentCount = (data.agentSuggestions || []).filter(s => s.status === 'pending').length;

  // Fullscreen state sync
  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    onFs();
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // FIX 6: Run auto AR scan once on app mount when setting is enabled
  useEffect(() => {
    checkAutoScanAR?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) { }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignOut = () => {
    // Clear localStorage first so a hard refresh doesn't re-hydrate the session
    try { localStorage.removeItem('notaryfix_data'); } catch (_) {}
    // Reset auth flag in state so RouteGuard redirects to /auth
    updateSettings({ onboardingComplete: false, planTier: 'free', userRole: 'owner' });
    navigate('/auth');
  };

  const sidebarGroups = [
    {
      title: 'CORE',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard',  path: '/dashboard' },
        { icon: Calendar,        label: 'Schedule',   path: '/schedule'  },
        { icon: Inbox,           label: 'Job Inbox',  path: '/job-inbox' },
        { icon: Wallet,          label: 'Invoices',   path: '/invoices'  },
        { icon: ScrollText,      label: 'Journal',    path: '/journal'   },
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { icon: Sparkles,    label: 'Command Center',   path: '/agent',       badge: 'PRO',    locked: planTier === 'free', featureKey: 'aiTrainer', paywallTitle: 'Command Center', pendingCount: planTier !== 'free' ? pendingAgentCount : 0 },
        { icon: Scale,       label: 'Act Library',      path: '/form-guide',  badge: 'PRO',    locked: planTier === 'free', featureKey: 'aiTrainer', paywallTitle: 'Act Library' },
        { icon: TrendingUp,  label: 'Market Insights',  path: '/market-insights' },
        { icon: DollarSign,  label: 'Tax Center',       path: '/tax-center'  },
      ]
    },
    {
      title: 'MANAGE',
      items: [
        { icon: Users,      label: 'Clients',       path: '/clients'        },
        { icon: MapPin,     label: 'Mileage',       path: '/mileage'        },
        { icon: Settings,   label: 'Settings',      path: '/settings'       },
        { icon: HelpCircle, label: 'Guide',         path: '/guide'          },
        { icon: Truck,      label: 'Team Dispatch', path: '/team-dispatch',  badge: 'AGENCY', agencyOnly: true },
        { icon: Wrench,     label: 'Admin',         path: '/admin',          agencyOnly: true },
      ]
    }
  ];

  const mobileBottomItems = [
    { Icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { Icon: Calendar, label: 'Schedule', path: '/schedule' },
    { Icon: ScrollText, label: 'Journal', path: '/journal' },
    { Icon: Users, label: 'Clients', path: '/clients' },
  ];

  const moreItems = [
    { Icon: Wallet, label: 'Invoices', path: '/invoices' },
    { Icon: Sparkles, label: 'Command Center', path: '/agent', locked: planTier === 'free', badge: 'PRO', featureKey: 'aiTrainer', paywallTitle: 'Command Center', pendingCount: planTier !== 'free' ? pendingAgentCount : 0 },
    { Icon: Scale, label: 'Act Library', path: '/form-guide', locked: planTier === 'free', badge: 'PRO', featureKey: 'aiTrainer', paywallTitle: 'Act Library' },
    { Icon: MapPin, label: 'Mileage', path: '/mileage' },
    { Icon: Inbox,       label: 'Job Inbox',       path: '/job-inbox' },
    { Icon: DollarSign, label: 'Tax Center',      path: '/tax-center' },
    { Icon: TrendingUp, label: 'Market Insights', path: '/market-insights' },
    { Icon: Settings, label: 'Settings', path: '/settings' },
    { Icon: HelpCircle, label: 'Guide', path: '/guide' },
  ];

  const isActivePath = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const isMoreActive = moreItems.some((item) => isActivePath(item.path));
  const getItemTarget = (item) => (item.locked ? '/feature-paywall' : item.path);
  const getItemState = (item) => (item.locked
    ? {
      badge: item.badge || 'PRO FEATURE',
      title: item.paywallTitle || item.label || 'Premium Feature',
      description: `Upgrade to access ${item.paywallTitle || item.label}.`,
      featureKey: item.featureKey || 'aiTrainer',
    }
    : undefined);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 flex transition-colors duration-300">
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />

      {/* ── Desktop Sidebar ───────────────────────────────────────────────── */}
      <aside
        onMouseEnter={() => setIsSidebarCollapsed(false)}
        onMouseLeave={() => setIsSidebarCollapsed(true)}
        className={`hidden md:flex flex-col h-screen sticky top-0 z-40 bg-white/80 dark:bg-slate-950/50 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-[72px]' : 'w-72'} shadow-lg`}
      >
        {/* Brand */}
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 dark:text-white tracking-tight">NotaryFix</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Operations Suite</span>
                </div>
              )}
            </Link>
            {!isSidebarCollapsed && (
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${tierStyle.bg} ${tierStyle.text}`}>
                {tierStyle.label.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Nav groups */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {sidebarGroups.map((group) => (
            <div key={group.title}>
              {!isSidebarCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                if (item.agencyOnly && planTier !== 'agency') return null;
                const active = isActivePath(item.path);
                return (
                  <Link
                    key={item.path}
                    to={getItemTarget(item)}
                    state={getItemState(item)}
                    title={isSidebarCollapsed ? item.label : item.locked ? `${item.label} — Upgrade required` : ''}
                    className={`group relative flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${item.locked ? 'opacity-60' : ''} ${active ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  >
                    <item.icon className={`w-5 h-5 transition-colors ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                    {!isSidebarCollapsed && (
                      <>
                        <span className="animate-fade-in flex-1">{item.label}</span>
                        {item.pendingCount > 0 && !item.locked ? (
                          <span className="rounded-full bg-blue-600 text-white px-2 py-0.5 text-[10px] font-bold min-w-[1.25rem] text-center">{item.pendingCount}</span>
                        ) : null}
                        {item.locked ? (
                          <span className="flex items-center gap-1 rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                            <Lock className="h-2.5 w-2.5" />
                            {item.badge || 'LOCKED'}
                          </span>
                        ) : null}
                      </>
                    )}
                    {isSidebarCollapsed && (
                      <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
                        {item.label}
                        {item.badge && !item.locked && <span className="ml-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded">{item.badge}</span>}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar footer — profile panel */}
        <div className="shrink-0 border-t border-slate-800/60 dark:border-slate-800/60 bg-slate-950/40 dark:bg-black/20">

          {/* Collapsed: icon column */}
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-1 py-3 px-2">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center font-bold text-[11px] text-slate-200 overflow-hidden ring-1 ring-white/10 mb-1">
                {businessLogo ? <img src={businessLogo} alt="Logo" className="w-full h-full object-cover" /> : initials}
              </div>
              {/* Theme */}
              <button onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all">
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
              {/* Fullscreen */}
              <button onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all">
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              {/* Sign out */}
              <button onClick={handleSignOut} title="Sign out"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {/* Profile card */}
              <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06]">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center font-bold text-sm text-slate-200 overflow-hidden ring-1 ring-white/10">
                    {businessLogo ? <img src={businessLogo} alt="Logo" className="w-full h-full object-cover" /> : initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-950" />
                </div>
                {/* Name + role + tier */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px] text-slate-100 truncate leading-tight">{userName}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-500 capitalize truncate">{userRole}</span>
                    <span className="text-slate-700">·</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      planTier === 'agency' ? 'text-violet-400' :
                      planTier === 'pro'    ? 'text-blue-400' :
                                             'text-slate-500'
                    }`}>{planTier}</span>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center gap-1 px-1">
                {/* Theme toggle */}
                <button onClick={toggleTheme}
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all text-[11px] font-medium group">
                  {theme === 'dark'
                    ? <><Sun className="w-3.5 h-3.5 group-hover:text-amber-400 transition-colors" /><span className="hidden lg:inline">Light</span></>
                    : <><Moon className="w-3.5 h-3.5 group-hover:text-blue-400 transition-colors" /><span className="hidden lg:inline">Dark</span></>
                  }
                </button>

                {/* Divider */}
                <div className="w-px h-4 bg-white/[0.06]" />

                {/* Fullscreen */}
                <button onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all text-[11px] font-medium group">
                  {isFullscreen
                    ? <><Minimize2 className="w-3.5 h-3.5" /><span className="hidden lg:inline">Exit</span></>
                    : <><Maximize2 className="w-3.5 h-3.5" /><span className="hidden lg:inline">Full</span></>
                  }
                </button>

                {/* Divider */}
                <div className="w-px h-4 bg-white/[0.06]" />

                {/* Sign out */}
                <button onClick={handleSignOut} title="Sign out"
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all text-[11px] font-medium group">
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top header */}
        <header className="md:hidden bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            {businessLogo
              ? <img src={businessLogo} alt="Business logo" className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
              : <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">N</div>
            }
            <span className="font-bold text-slate-900 dark:text-white">NotaryFix</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsCommandPaletteOpen(true)}>
              <Search className="w-5 h-5 dark:text-white" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="w-6 h-6 dark:text-white" />
            </Button>
          </div>
        </header>

        {/* Mobile slide-in drawer */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-slate-800/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 w-4/5 max-w-xs h-full p-5 shadow-xl border-r border-slate-200 dark:border-slate-700 overflow-y-auto flex flex-col"
              onClick={e => e.stopPropagation()}
              style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
            >
              {/* Drawer brand */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">N</div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">NotaryFix</span>
              </div>

              {/* Drawer nav */}
              <nav className="space-y-6 flex-1">
                {sidebarGroups.map(group => (
                  <div key={group.title} className="space-y-1">
                    <div className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      {group.title}
                    </div>
                    {group.items.map((item) => {
                      if (item.agencyOnly && planTier !== 'agency') return null;
                      const active = isActivePath(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={getItemTarget(item)}
                          state={getItemState(item)}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'} ${item.locked ? 'opacity-60' : ''}`}
                        >
                          <item.icon className={`w-5 h-5 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                          {item.label}
                          {item.locked && (
                            <span className="ml-auto flex items-center gap-1 rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                              <Lock className="h-2.5 w-2.5" />
                              {item.badge || 'LOCKED'}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>

              {/* Drawer footer utilities */}
              <div className="mt-6 pt-4 border-t border-slate-800/60 space-y-3">
                {/* Profile card */}
                <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06]">
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center font-bold text-sm text-slate-200 overflow-hidden ring-1 ring-white/10">
                      {businessLogo ? <img src={businessLogo} alt="Logo" className="w-full h-full object-cover" /> : initials}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-950" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13px] text-slate-100 truncate leading-tight">{userName}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-500 capitalize">{userRole}</span>
                      <span className="text-slate-700">·</span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                        planTier === 'agency' ? 'text-violet-400' :
                        planTier === 'pro'    ? 'text-blue-400'   :
                                               'text-slate-500'
                      }`}>{planTier}</span>
                    </div>
                  </div>
                </div>
                {/* Action row */}
                <div className="flex items-center gap-1">
                  <button onClick={toggleTheme}
                    title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-xs font-medium transition-all ring-1 ring-white/[0.06]">
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    {theme === 'dark' ? 'Light' : 'Dark'}
                  </button>
                  <button onClick={() => { setIsCommandPaletteOpen(true); setIsMobileMenuOpen(false); }}
                    title="Search"
                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-xs font-medium transition-all ring-1 ring-white/[0.06]">
                    <Search className="w-3.5 h-3.5" /> Search
                  </button>
                  <button onClick={handleSignOut}
                    title="Sign out"
                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-red-500/5 hover:bg-red-500/15 text-slate-600 hover:text-red-400 text-xs font-medium transition-all ring-1 ring-red-500/10">
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 px-4 md:px-8 py-6 pb-24 md:pb-6">
          {children}
        </main>

        {/* ── Mobile Bottom Nav Bar ─────────────────────────────────────── */}
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 flex items-center justify-around px-1"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
        >
          {mobileBottomItems.map(item => {
            const active = isActivePath(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl transition-colors min-w-[52px] ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
              >
                <item.Icon className="h-[22px] w-[22px]" />
                <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setIsMoreDrawerOpen(true)}
            className={`flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl min-w-[52px] ${isMoreActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <MoreHorizontal className="h-[22px] w-[22px]" />
            <span className="text-[10px] font-semibold tracking-wide">More</span>
          </button>
        </nav>

        {/* More Drawer - Mobile */}
        {isMoreDrawerOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setIsMoreDrawerOpen(false)}
          >
            <div
              className="absolute bottom-0 inset-x-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300"
              onClick={e => e.stopPropagation()}
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto my-3" />
              <div className="px-6 py-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Access</h3>
                <div className="grid grid-cols-4 gap-4">
                  {moreItems.map(item => {
                    const active = isActivePath(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={getItemTarget(item)}
                        state={getItemState(item)}
                        onClick={() => setIsMoreDrawerOpen(false)}
                        className="flex flex-col items-center gap-2 group"
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-active:scale-95 transition-transform ${active ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                          <item.Icon className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-medium text-center leading-tight ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                          {item.label}
                        </span>
                        {item.locked ? (
                          <span className="flex items-center gap-1 rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                            <Lock className="h-2.5 w-2.5" />
                            {item.badge || 'LOCKED'}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live GPS trip banner — floats above mobile bottom nav */}
        <LiveTripBanner />

        {/* Global cross-module overlays */}
        <ToastStack />
        <PromptModal />
        <PWAInstallBanner />
      </div>
    </div>
  );
};

export default function Layout({ children }) {
  const inRouter = useInRouterContext();
  if (!inRouter) {
    return (
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ActiveTripProvider>
          <LayoutInner>{children}</LayoutInner>
        </ActiveTripProvider>
      </BrowserRouter>
    );
  }
  return (
    <ActiveTripProvider>
      <LayoutInner>{children}</LayoutInner>
    </ActiveTripProvider>
  );
}
