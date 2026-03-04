import React, { useState, useEffect } from 'react';
import PWAInstallBanner from './PWAInstallBanner';
import { Link, useLocation, BrowserRouter, useInRouterContext, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Settings, LogOut, FileText, Menu,
  Sun, Moon, Search, Command, MapPin, X, Lock,
  UserCheck, ScrollText, Wallet, BadgeCheck, Truck, Brain, Wrench, Scale,
  Sparkles, Maximize2, Minimize2, MoreHorizontal} from 'lucide-react';
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
  free:   { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', label: 'Free' },
  pro:    { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', label: 'Pro' },
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
  const { data, updateSettings } = useData();

  const planTier = data.settings?.planTier || 'free';
  const userRole = data.settings?.userRole || 'owner';
  const userName = data.settings?.name || 'User';
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DA';
  const businessLogo = data.settings?.businessLogo || '';

  const tierStyle = TIER_STYLES[planTier] || TIER_STYLES.free;

  const gateContext = { planTier, role: userRole };
  const signerPortalGate = getGateState('signerPortal', gateContext);
  const teamDispatchGate = getGateState('teamDispatch', gateContext);
  const aiTrainerGate = getGateState('aiTrainer', gateContext);
  const adminGate = getGateState('admin', gateContext);


  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    onFs();
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {}
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
    // Reset to free tier so auth page shows clean state
    updateSettings({ planTier: 'free', userRole: 'owner' });
    navigate('/auth');
  };


  const sidebarGroups = [
    {
      title: 'WORK',
      items: [
        { icon: Calendar, label: 'Schedule', path: '/schedule' },
        { icon: Users, label: 'Clients', path: '/clients' },
        { icon: ScrollText, label: 'Journal', path: '/journal' },
        { icon: Wallet, label: 'Invoices', path: '/invoices' },
        { icon: MapPin, label: 'Mileage', path: '/mileage' },
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { icon: Sparkles, label: 'Command Center', path: '/agent', badge: 'PRO', locked: planTier === 'free' },
        { icon: Scale, label: 'Act Library', path: '/form-guide', badge: 'PRO', locked: planTier === 'free' },
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
    { Icon: Calendar,   label: 'Schedule', path: '/schedule' },
    { Icon: ScrollText, label: 'Journal',  path: '/journal'  },
    { Icon: Users,      label: 'Clients',  path: '/clients'  },
    { Icon: Wallet,     label: 'Invoices', path: '/invoices' },
  ];

  const moreItems = [
    { Icon: Sparkles, label: 'Compliance Panel', path: '/agent' },
    { Icon: Scale, label: 'Forms Guide', path: '/form-guide' },
    { Icon: MapPin, label: 'Mileage', path: '/mileage' },
    { Icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-900 flex transition-colors duration-300">
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />

      {/* Sidebar - Desktop */}
      <aside
        onMouseEnter={() => setIsSidebarCollapsed(false)}
        onMouseLeave={() => setIsSidebarCollapsed(true)}
        className={`hidden md:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed h-full z-20 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">N</div>
          {!isSidebarCollapsed && <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">NotaryOS</span>}
        </div>

        {!isSidebarCollapsed && (
          <div className="px-4 mb-2">
            <button onClick={() => setIsCommandPaletteOpen(true)} className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:border-blue-400 transition-colors group">
              <div className="flex items-center gap-2"><Search className="w-3.5 h-3.5" /><span>Search...</span></div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-[10px] font-medium"><Command className="w-3 h-3" /><span>K</span></div>
            </button>
          </div>
        )}

        <nav className="flex-1 px-3 space-y-6 mt-2 overflow-y-auto">
          {sidebarGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                if (item.agencyOnly && planTier !== 'agency') return null;
                const active = location.pathname === item.path;
                
                return (
                  <Link 
                    key={item.path} 
                    to={item.locked ? '/pricing' : item.path} 
                    title={isSidebarCollapsed ? item.label : item.locked ? `${item.label} — Upgrade required` : ''}
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all group ${item.locked ? 'opacity-60' : ''} ${active ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  >
                    <item.icon className={`w-5 h-5 transition-colors ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                    {!isSidebarCollapsed && (
                      <>
                        <span className="animate-fade-in flex-1">{item.label}</span>
                        {item.pendingCount > 0 && !item.locked ? <span className="rounded-full bg-blue-600 text-white px-2 py-0.5 text-[10px] font-bold min-w-[1.25rem] text-center">{item.pendingCount}</span> : null}
                        {item.locked ? (
                          <span className="flex items-center gap-1 rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                            <Lock className="h-2.5 w-2.5" />
                            {item.badge || 'LOCKED'}
                          </span>
                        ) : null}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-3 relative">
          <button onClick={toggleTheme} title="Toggle theme" className={`w-full flex items-center p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              {!isSidebarCollapsed && <span className="text-sm font-medium">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>}
            </div>
          </button>

          <button onClick={toggleFullscreen} title="Toggle fullscreen" className={`w-full flex items-center p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3">
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              {!isSidebarCollapsed && <span className="text-sm font-medium">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>}
            </div>
          </button>

          {!isSidebarCollapsed ? (
            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {businessLogo ? <img src={businessLogo} alt="Business logo" className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-600" /> : <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">{initials}</div>}
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{userName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{userRole}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierStyle.bg} ${tierStyle.text}`}>
                  {tierStyle.label}
                </span>
              </div>

              <div className="mb-3 rounded-lg border border-dashed border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">Dev: Switch Tier</p>
                <div className="flex gap-1">
                  {['free','pro','agency'].map(tier => (
                    <button
                      key={tier}
                      onClick={() => updateSettings({ planTier: tier })}
                      className={`flex-1 text-[9px] font-bold rounded px-1 py-1 capitalize transition-all ${planTier === tier ? 'bg-amber-400 text-amber-900' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-100'}`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-0 pl-1">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {businessLogo ? <img src={businessLogo} alt="Business logo" className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-600 cursor-pointer hover:ring-2 hover:ring-offset-2 ring-blue-500 transition-all" /> : <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:ring-2 hover:ring-offset-2 ring-blue-500 transition-all">{initials}</div>}
              <button onClick={handleSignOut} title="Sign Out" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Wrapper */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} min-w-0`}>
        <header className="md:hidden bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
             {businessLogo ? <img src={businessLogo} alt="Business logo" className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700" /> : <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">N</div>}
             <span className="font-bold text-slate-900 dark:text-white">NotaryOS</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsCommandPaletteOpen(true)}><Search className="w-5 h-5 dark:text-white" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu className="w-6 h-6 dark:text-white" /></Button>
          </div>
        </header>

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-slate-800/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="bg-white dark:bg-slate-900 w-4/5 max-w-xs h-full p-5 shadow-xl border-r border-slate-200 dark:border-slate-700 overflow-y-auto" onClick={e => e.stopPropagation()} style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">N</div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">NotaryOS</span>
              </div>
              
              <nav className="space-y-6">
                {sidebarGroups.map(group => (
                  <div key={group.title} className="space-y-1">
                    <div className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{group.title}</div>
                    {group.items.map((item) => {
                      if (item.agencyOnly && planTier !== 'agency') return null;
                      const active = location.pathname === item.path;
                      return (
                        <Link key={item.path} to={item.locked ? '/pricing' : item.path} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'} ${item.locked ? 'opacity-60' : ''}`}>
                          <item.icon className={`w-5 h-5 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />{item.label}
                          {item.locked && <span className="ml-auto flex items-center gap-1 rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[9px] font-bold text-slate-500"><Lock className="h-2.5 w-2.5" />{item.badge || 'LOCKED'}</span>}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </button>
                <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 min-h-screen bg-slate-50 dark:bg-slate-900 px-3 sm:px-4 md:px-0 pb-24 md:pb-0 w-full max-w-[1400px] mx-auto">
          {children}
        </main>

        {/* ── Mobile Bottom Nav Bar ─────────────────────────────────────── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 flex items-center justify-around px-1"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
          {mobileBottomItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl transition-colors min-w-[52px] ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                <item.Icon className="h-[22px] w-[22px]" />
                <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
              </Link>
            );
          })}
          <button 
            onClick={() => setIsMoreDrawerOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl text-slate-400 dark:text-slate-500 min-w-[52px]"
          >
            <MoreHorizontal className="h-[22px] w-[22px]" />
            <span className="text-[10px] font-semibold tracking-wide">More</span>
          </button>
        </nav>

        {/* More Drawer - Mobile */}
        {isMoreDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setIsMoreDrawerOpen(false)}>
            <div 
              className="absolute bottom-0 inset-x-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300" 
              onClick={e => e.stopPropagation()}
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto my-3" />
              <div className="px-6 py-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Access</h3>
                <div className="grid grid-cols-4 gap-4">
                  {moreItems.map(item => (
                    <Link 
                      key={item.path} 
                      to={item.path} 
                      onClick={() => setIsMoreDrawerOpen(false)}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-active:scale-95 transition-transform">
                        <item.Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 text-center leading-tight">{item.label}</span>
                    </Link>
                  ))}
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
      <BrowserRouter>
        <LayoutInner>{children}</LayoutInner>
      </BrowserRouter>
    );
  }
  return <LayoutInner>{children}</LayoutInner>;
}
