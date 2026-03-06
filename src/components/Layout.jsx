// src/components/Layout.jsx
import React, { useState, useEffect } from 'react';
import PWAInstallBanner from './PWAInstallBanner';
import { Link, useLocation, BrowserRouter, useInRouterContext, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Settings, LogOut, FileText, Menu,
  Sun, Moon, Search, Command, MapPin, X, Lock,
  UserCheck, ScrollText, Wallet, BadgeCheck, Truck, Brain, Wrench, Scale,
  Sparkles, Maximize2, Minimize2, MoreHorizontal, Inbox} from 'lucide-react';
import { useData } from '../context/DataContext';
import { getGateState } from '../utils/gates';
import { ToastStack, PromptModal } from './GlobalOverlays';
import { useTheme } from '../context/ThemeContext';

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
    updateSettings({ planTier: 'free', userRole: 'owner' });
    navigate('/auth');
  };

  const sidebarGroups = [
    {
      title: 'WORK',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Calendar, label: 'Schedule', path: '/schedule' },
        { icon: Users, label: 'Clients', path: '/clients' },
        { icon: ScrollText, label: 'Journal', path: '/journal' },
        { icon: Wallet, label: 'Invoices', path: '/invoices' },
        { icon: MapPin, label: 'Mileage', path: '/mileage' },
        { icon: Inbox, label: 'Job Inbox', path: '/job-inbox' },
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { icon: Sparkles, label: 'Command Center', path: '/agent', badge: 'PRO', locked: planTier === 'free', featureKey: 'aiTrainer', paywallTitle: 'Command Center', pendingCount: planTier !== 'free' ? pendingAgentCount : 0 },
        { icon: Scale, label: 'Act Library', path: '/form-guide', badge: 'PRO', locked: planTier === 'free', featureKey: 'aiTrainer', paywallTitle: 'Act Library' },
      ]
    },
    {
      title: 'BUSINESS',
      items: [
        { icon: Settings, label: 'Settings', path: '/settings' },
        { icon: ScrollText, label: 'Audit Log', path: '/audit' },
        { icon: Truck, label: 'Team Dispatch', path: '/team-dispatch', badge: 'AGENCY', agencyOnly: true },
        { icon: Wrench, label: 'Admin', path: '/admin', agencyOnly: true },
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
    { Icon: Inbox, label: 'Job Inbox', path: '/job-inbox' },
    { Icon: Settings, label: 'Settings', path: '/settings' },
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

        {/* Sidebar footer */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 overflow-hidden">
              {businessLogo ? <img src={businessLogo} alt="Logo" className="w-full h-full object-cover rounded-2xl" /> : initials}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{userName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{userRole}</div>
              </div>
            )}
          </div>

          <div className={`flex items-center gap-2 ${isSidebarCollapsed ? 'flex-col' : ''}`}>
            <Button
              variant="secondary"
              size={isSidebarCollapsed ? 'icon' : 'default'}
              onClick={toggleTheme}
              className={`${isSidebarCollapsed ? 'w-10 h-10' : 'flex-1'} justify-center`}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {!isSidebarCollapsed && <span className="ml-2">Theme</span>}
            </Button>

            <Button
              variant="secondary"
              size={isSidebarCollapsed ? 'icon' : 'default'}
              onClick={toggleFullscreen}
              className={`${isSidebarCollapsed ? 'w-10 h-10' : 'flex-1'} justify-center`}
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              {!isSidebarCollapsed && <span className="ml-2">Fullscreen</span>}
            </Button>

            <Button
              variant="ghost"
              size={isSidebarCollapsed ? 'icon' : 'default'}
              onClick={handleSignOut}
              className={`${isSidebarCollapsed ? 'w-10 h-10' : 'flex-1'} justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20`}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              {!isSidebarCollapsed && <span className="ml-2">Sign out</span>}
            </Button>
          </div>
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
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={toggleTheme}
                  title="Toggle theme"
                  className="flex-1 justify-center"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => { setIsCommandPaletteOpen(true); setIsMobileMenuOpen(false); }}
                  title="Search"
                  className="flex-1 justify-center"
                >
                  <Search className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="flex-1 justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
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
        <LayoutInner>{children}</LayoutInner>
      </BrowserRouter>
    );
  }
  return <LayoutInner>{children}</LayoutInner>;
}
