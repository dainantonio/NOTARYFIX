import React, { useState, useEffect } from 'react';
import { Link, useLocation, BrowserRouter, useInRouterContext } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Settings, LogOut, FileText, Menu,
  Shield, ChevronLeft, ChevronRight, Sun, Moon, Search, Command, MapPin, X
} from 'lucide-react';

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

const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('theme') || 'light';
    return 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  };

  return { theme, toggleTheme };
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
// ----------------------------------------

const LayoutInner = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('sidebarCollapsed') === 'true';
    return false;
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  // Command+K Listener
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

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Schedule', path: '/schedule' },
    { icon: Users, label: 'Clients', path: '/clients' },
    { icon: FileText, label: 'Invoices', path: '/invoices' },
    { icon: MapPin, label: 'Mileage', path: '/mileage' },
    { icon: Shield, label: 'Compliance', path: '/legal' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-300">
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />

      {/* Sidebar Navigation - Desktop */}
      <aside className={`hidden md:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed h-full z-20 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">N</div>
          {!isSidebarCollapsed && <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight animate-fade-in">NotaryFix</span>}
        </div>

        {!isSidebarCollapsed && (
          <div className="px-4 mb-2">
            <button onClick={() => setIsCommandPaletteOpen(true)} className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:border-blue-400 transition-colors group">
              <div className="flex items-center gap-2"><Search className="w-3.5 h-3.5" /><span>Search...</span></div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-[10px] font-medium"><Command className="w-3 h-3" /><span>K</span></div>
            </button>
          </div>
        )}

        <nav className="flex-1 px-3 space-y-1 mt-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} title={isSidebarCollapsed ? item.label : ''} className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all group ${location.pathname === item.path ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'} ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <item.icon className={`w-5 h-5 transition-colors ${location.pathname === item.path ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
              {!isSidebarCollapsed && <span className="animate-fade-in">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-4 relative">
          <button onClick={toggleTheme} className={`w-full flex items-center p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              {!isSidebarCollapsed && <span className="text-sm font-medium">Theme</span>}
            </div>
          </button>

          {!isSidebarCollapsed ? (
            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">DA</div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">Dain Antonio</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pro Plan</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-0 pl-1">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:ring-2 hover:ring-offset-2 ring-blue-500 transition-all">DA</div>
            </div>
          )}

          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute -right-3 top-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full p-1 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 z-30">
            {isSidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </div>
      </aside>

      {/* Mobile Wrapper */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <header className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">N</div>
             <span className="font-bold text-slate-900 dark:text-white">NotaryFix</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsCommandPaletteOpen(true)}><Search className="w-5 h-5 dark:text-white" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu className="w-6 h-6 dark:text-white" /></Button>
          </div>
        </header>

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-slate-800/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="bg-white dark:bg-slate-900 w-3/4 h-full p-4 shadow-xl border-r border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
               <nav className="space-y-2 mt-4">
                {navItems.map((item) => (
                  <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <item.icon className="w-5 h-5 text-slate-400" />{item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 p-6 md:p-8 lg:p-10 w-full max-w-[1920px] mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function Layout({ children }) {
  // Gracefully handles standalone preview mode by providing a Router wrapper if missing.
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