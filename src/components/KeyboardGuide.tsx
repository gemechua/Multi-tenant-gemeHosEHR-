import React, { useState, useEffect } from 'react';
import { Keyboard, X, Command, Move, MousePointer2, Type, Search, Sparkles, Zap, Layers, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KeyboardGuideProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
}

interface ShortcutItem {
  key: string;
  action: string;
  category?: 'navigation' | 'actions' | 'data' | 'system';
  description?: string;
}

const PAGE_SHORTCUTS: Record<string, ShortcutItem[]> = {
  'Data & Explorer': [
    { key: 'Ctrl + N', action: 'Create New Record', category: 'data', description: 'Opens the Add Record modal' },
    { key: 'Alt + Q', action: 'Generate QR Code', category: 'data', description: 'Displays mobile patient scanner QR' },
    { key: 'Alt + E', action: 'Open Schema Editor', category: 'actions', description: 'Customizes table fields and schema' },
    { key: 'Alt + B', action: 'Back to Main View', category: 'navigation', description: 'Dismisses open panels and returns to table' },
    { key: 'Shift + F', action: 'Focus Filter & Search', category: 'data', description: 'Jumps to table search query input' },
    { key: 'Alt + X', action: 'Export Table Data', category: 'actions', description: 'Downloads CSV or printable record' }
  ],
  'Module3HealthService': [
    { key: 'Ctrl + S', action: 'Save Health Service Log', category: 'actions', description: 'Submits current clinical consultation' },
    { key: 'Alt + B', action: 'Back to Data & Explorer', category: 'navigation', description: 'Returns directly to the main table' },
    { key: 'Alt + R', action: 'Refresh Clinical Entries', category: 'data', description: 'Reloads health service logs' }
  ],
  'AssessmentAuditTool': [
    { key: 'Ctrl + S', action: 'Submit Hospital Audit', category: 'actions', description: 'Finalizes service assessment scores' },
    { key: 'Alt + B', action: 'Back to Data & Explorer', category: 'navigation', description: 'Dismisses audit tool and returns' },
    { key: 'Alt + C', action: 'Calculate Total Score', category: 'data', description: 'Re-evaluates compliance percentage' }
  ],
  'FinanceHub': [
    { key: 'Alt + F', action: 'Filter Financial Quarter', category: 'data', description: 'Changes reporting time period' },
    { key: 'Alt + B', action: 'Back to Data & Explorer', category: 'navigation', description: 'Navigates back to main data view' },
    { key: 'Ctrl + E', action: 'Export Revenue Ledger', category: 'actions', description: 'Exports transaction history' }
  ],
  'AdminCEOHub': [
    { key: 'Alt + S', action: 'System Performance Audit', category: 'system', description: 'Views real-time CPU & DB metrics' },
    { key: 'Alt + L', action: 'Security Audit Trail', category: 'system', description: 'Inspects active user logs' },
    { key: 'Alt + B', action: 'Back to Data & Explorer', category: 'navigation', description: 'Returns to central data table' }
  ],
  'Inpatient': [
    { key: 'Alt + I', action: 'Assign Inpatient Bed', category: 'actions', description: 'Opens bed assignment dialog' },
    { key: 'Alt + Q', action: 'Inpatient QR Verification', category: 'data', description: 'Shows ward admission QR' }
  ],
  'Settings': [
    { key: 'Alt + P', action: 'Lock Privacy Session', category: 'system', description: 'Triggers Privacy Lock Screen' },
    { key: 'Alt + S', action: 'Save System Preferences', category: 'actions', description: 'Persists active settings' }
  ],
  'Users': [
    { key: 'Alt + U', action: 'Manage Role Permissions', category: 'system', description: 'Edits staff access levels' },
    { key: 'Ctrl + A', action: 'Approve Pending User', category: 'actions', description: 'Authorizes clinical user account' }
  ]
};

const GLOBAL_SHORTCUTS: ShortcutItem[] = [
  { key: 'Alt + K', action: 'Toggle Keyboard Guide', category: 'system', description: 'Shows or hides this shortcut visual guide' },
  { key: 'Alt + 1', action: 'Navigate to Home Dashboard', category: 'navigation', description: 'Switches to central home view' },
  { key: 'Alt + 2', action: 'Navigate to Overview', category: 'navigation', description: 'Opens clinical stats overview' },
  { key: 'Ctrl + K', action: 'Omni Command Palette', category: 'navigation', description: 'Opens universal EHR search' },
  { key: 'Esc', action: 'Close Modal / Dismiss Form', category: 'navigation', description: 'Dismisses active overlays instantly' },
  { key: 'Ctrl + Enter', action: 'Submit Current Modal Form', category: 'actions', description: 'Executes primary form action' }
];

export default function KeyboardGuide({ isOpen, onClose, activeTab }: KeyboardGuideProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<string>(activeTab || 'Data & Explorer');
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  // Sync with prop change when modal opens
  useEffect(() => {
    if (activeTab) {
      setSelectedTab(activeTab);
    }
  }, [activeTab, isOpen]);

  // Handle global keyboard listener inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Highlight key pressed visually
      const keyName = e.key ? e.key.toUpperCase() : '';
      if (keyName) {
        setPressedKey(keyName);
        setTimeout(() => setPressedKey(null), 800);
      }

      if (e.altKey && e.key?.toLowerCase() === 'k') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Resolve current page's specific shortcuts
  const currentPageShortcuts = PAGE_SHORTCUTS[selectedTab] || PAGE_SHORTCUTS['Data & Explorer'] || [];

  // Filter shortcuts based on user query
  const filterList = (items: ShortcutItem[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      item =>
        item.action.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  };

  const filteredPageShortcuts = filterList(currentPageShortcuts);
  const filteredGlobalShortcuts = filterList(GLOBAL_SHORTCUTS);

  // Keyboard visual key badges map
  const activeKeys = ['ALT', 'CTRL', 'SHIFT', 'ESC', 'ENTER', 'K', '1', '2', 'N', 'Q', 'E', 'B', 'S'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="bg-slate-900 text-slate-100 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Top Header */}
          <div className="bg-slate-950 p-6 border-b border-slate-800/80 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Keyboard size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xl text-white tracking-tight">EHR Interactive Keyboard Guide</h3>
                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-widest flex items-center gap-1">
                    <Zap size={10} /> Active Overlay
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Dynamic visual shortcuts & hotkeys map for rapid clinical navigation
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2.5 hover:bg-slate-800 rounded-2xl transition-colors text-slate-400 hover:text-white"
              title="Close Guide (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Active Context Bar & Visual Key Map Overlay */}
          <div className="p-5 bg-slate-950/60 border-b border-slate-800 space-y-4">
            {/* Context Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Layers size={12} className="text-indigo-400" /> View Page:
              </span>
              {[
                { id: 'Data & Explorer', label: 'Data & Explorer' },
                { id: 'Module3HealthService', label: 'Consolidated Health Service' },
                { id: 'AssessmentAuditTool', label: 'Hospital Assessment Audit' },
                { id: 'FinanceHub', label: 'Finance Hub' },
                { id: 'AdminCEOHub', label: 'Admin & CEO' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                    selectedTab === tab.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700/60'
                  }`}
                >
                  {tab.label}
                  {tab.id === activeTab && (
                    <span className="ml-1.5 px-1 py-0.2 bg-emerald-400/20 text-emerald-300 text-[9px] font-extrabold rounded">LIVE</span>
                  )}
                </button>
              ))}
            </div>

            {/* Virtual Key Badges Visual Grid */}
            <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mr-1">Hotkeys:</span>
                {activeKeys.map((k) => {
                  const isPressed = pressedKey === k;
                  return (
                    <span
                      key={k}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-extrabold transition-all border ${
                        isPressed
                          ? 'bg-emerald-500 text-white border-emerald-400 scale-110 shadow-lg shadow-emerald-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700/80'
                      }`}
                    >
                      {k}
                    </span>
                  );
                })}
              </div>
              <div className="text-[10px] text-indigo-400 font-mono shrink-0 hidden sm:block">
                Press any key to test highlight
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search shortcut command or key combination..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Shortcut Cards Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Active Page / Tab Specific Shortcuts */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={14} /> Active Shortcuts: <span className="text-white">{selectedTab}</span>
                </h4>
                <span className="text-[10px] font-bold text-slate-500">
                  {filteredPageShortcuts.length} command{filteredPageShortcuts.length !== 1 ? 's' : ''}
                </span>
              </div>

              {filteredPageShortcuts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {filteredPageShortcuts.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-all flex flex-col justify-between gap-2 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-slate-100 group-hover:text-indigo-300 transition-colors">
                          {s.action}
                        </span>
                        <kbd className="px-2.5 py-1 bg-indigo-950/80 border border-indigo-500/40 rounded-lg text-[11px] font-extrabold text-indigo-300 shadow-sm font-mono shrink-0">
                          {s.key}
                        </kbd>
                      </div>
                      {s.description && (
                        <p className="text-[11px] text-slate-400 leading-tight">
                          {s.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 text-center text-xs text-slate-500">
                  No page-specific shortcuts matching "{searchQuery}"
                </div>
              )}
            </section>

            {/* Global Shortcuts */}
            <section className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Command size={14} className="text-slate-400" /> Universal System Navigation Shortcuts
                </h4>
                <span className="text-[10px] font-bold text-slate-500">
                  {filteredGlobalShortcuts.length} command{filteredGlobalShortcuts.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredGlobalShortcuts.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="block text-xs font-bold text-slate-200">{s.action}</span>
                      <span className="text-[10px] text-slate-500">{s.description}</span>
                    </div>
                    <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-bold text-slate-300 shadow-sm font-mono shrink-0">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer Bar */}
          <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span className="text-[11px] font-medium">Shortcuts dynamically synchronized with active module</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
              <Type size={12} /> Press <span className="text-slate-300 font-bold">Alt + K</span> or <span className="text-slate-300 font-bold">Esc</span> to dismiss
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

