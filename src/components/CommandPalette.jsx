import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  Users, 
  FileText, 
  Settings, 
  Moon, 
  Sun, 
  Plus,
  ArrowRight,
  Command
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Define commands
  const commands = [
    { 
      category: 'Navigation',
      items: [
        { icon: Calendar, label: 'Go to Schedule', action: () => navigate('/schedule') },
        { icon: Users, label: 'Go to Clients', action: () => navigate('/clients') },
        { icon: FileText, label: 'Go to Invoices', action: () => navigate('/invoices') },
        { icon: Settings, label: 'Go to Settings', action: () => navigate('/settings') },
      ]
    },
    {
      category: 'Actions',
      items: [
        { icon: Plus, label: 'New Appointment', action: () => { /* Trigger Modal logic via context later */ console.log('New Appointment') } },
        { icon: Plus, label: 'Create Invoice', action: () => navigate('/invoices') },
        { icon: theme === 'dark' ? Sun : Moon, label: 'Toggle Theme', action: () => toggleTheme() },
      ]
    }
  ];

  // Filter commands based on query
  const filteredCommands = commands.map(group => ({
    ...group,
    items: group.items.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
  })).filter(group => group.items.length > 0);

  // Flatten for keyboard navigation index calculation
  const flatItems = filteredCommands.flatMap(group => group.items);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % flatItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + flatItems.length) % flatItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          flatItems[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, flatItems, onClose]);

  // Reset selection when query changes
  useEffect(() => setSelectedIndex(0), [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Palette Window */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in flex flex-col max-h-[60vh]">
        
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 text-base h-6"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">Esc</span>
          </div>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 scrollbar-hide">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              No results found.
            </div>
          ) : (
            filteredCommands.map((group, groupIndex) => (
              <div key={group.category} className="mb-2 last:mb-0">
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {group.category}
                </div>
                {group.items.map((item, itemIndex) => {
                  // Calculate absolute index for highlighting
                  const absoluteIndex = filteredCommands
                    .slice(0, groupIndex)
                    .reduce((acc, g) => acc + g.items.length, 0) + itemIndex;
                  
                  const isSelected = absoluteIndex === selectedIndex;

                  return (
                    <button
                      key={item.label}
                      onClick={() => { item.action(); onClose(); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isSelected 
                          ? 'bg-blue-600 text-white' 
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isSelected && <ArrowRight className="w-4 h-4 text-white/70" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400">
          <span>NotaryFix OS 1.0</span>
          <div className="flex gap-3">
            <span className="flex items-center gap-1">
              <span className="bg-slate-200 dark:bg-slate-700 px-1 rounded">↑</span>
              <span className="bg-slate-200 dark:bg-slate-700 px-1 rounded">↓</span>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <span className="bg-slate-200 dark:bg-slate-700 px-1 rounded">↵</span>
              to select
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
