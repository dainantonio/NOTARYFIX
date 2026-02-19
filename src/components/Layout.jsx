import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  FileText, 
  Menu,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from './UI';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children }) => {
  // Collapsible Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('sidebarCollapsed') === 'true';
    return false;
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Schedule', path: '/schedule' },
    { icon: Users, label: 'Clients', path: '/clients' },
    { icon: FileText, label: 'Invoices', path: '/invoices' },
    { icon: ShieldCheck, label: 'Compliance', path: '/legal' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-300">
      
      {/* Sidebar Navigation - Desktop */}
      <aside 
        className={`hidden md:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed h-full z-20 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo Section */}
        <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
            N
          </div>
          {!isSidebarCollapsed && (
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight animate-fade-in">NotaryFix</span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              title={isSidebarCollapsed ? item.label : ''}
              className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all group ${
                location.pathname === item.path
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${
                location.pathname === item.path ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
              }`} />
              
              {!isSidebarCollapsed && (
                <span className="animate-fade-in">{item.label}</span>
              )}

              {/* Tooltip for collapsed state */}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className={`w-full flex items-center p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              {!isSidebarCollapsed && <span className="text-sm font-medium">Theme</span>}
            </div>
            {!isSidebarCollapsed && (
               <span className="text-xs text-slate-400 uppercase">{theme}</span>
            )}
          </button>

          {/* User Profile / Pro Plan */}
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
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
             <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:ring-2 hover:ring-offset-2 ring-blue-500 transition-all">DA</div>
             </div>
          )}
          
          {/* Collapse Toggle */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-20 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full p-1 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>

        </div>
      </aside>

      {/* Mobile Header & Content Wrapper */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">N</div>
             <span className="font-bold text-slate-900 dark:text-white">NotaryFix</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="w-6 h-6 dark:text-white" />
            </Button>
          </div>
        </header>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-slate-800/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="bg-white dark:bg-slate-900 w-3/4 h-full p-4 shadow-xl border-r border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
               <nav className="space-y-2 mt-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <item.icon className="w-5 h-5 text-slate-400" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 lg:p-10 w-full max-w-[1920px] mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
