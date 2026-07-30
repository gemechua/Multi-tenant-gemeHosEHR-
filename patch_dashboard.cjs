const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

const importsToAdd = `import { SyncHistoryModal, SyncQueueItem } from './SyncHistoryModal';
import { BookOpen, Database as DatabaseIcon, History } from 'lucide-react';
`;

content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\n" + importsToAdd);

const stateToAdd = `
  const [syncHistoryOpen, setSyncHistoryOpen] = useState(false);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([
    { id: '1', tableName: 'patients', status: 'synced', timestamp: new Date(Date.now() - 50000).toISOString(), dataSummary: 'Added John Doe' },
    { id: '2', tableName: 'vitals', status: 'pending', timestamp: new Date(Date.now() - 10000).toISOString(), dataSummary: 'Updated HR' }
  ]);
`;

content = content.replace("export default function Dashboard({ activeHospital: propHospital, addToast, onSelectPatient, onSelectModule }: DashboardProps) {", "export default function Dashboard({ activeHospital: propHospital, addToast, onSelectPatient, onSelectModule }: DashboardProps) {\n" + stateToAdd);

const quickActionsJSX = `
      {/* High-Action Modules (Prioritized on Mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 block sm:hidden mb-6">
        <button 
          onClick={() => onSelectModule && onSelectModule('Register Logbook')}
          className="bg-indigo-600 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95"
        >
          <BookOpen size={24} />
          <span className="text-xs font-bold text-center">Register Logbook</span>
        </button>
        <button 
          onClick={() => onSelectModule && onSelectModule('Data & Explorer')}
          className="bg-indigo-600 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95"
        >
          <DatabaseIcon size={24} />
          <span className="text-xs font-bold text-center">Data Explorer</span>
        </button>
        <button 
          onClick={() => setSyncHistoryOpen(true)}
          className="bg-slate-800 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95 col-span-2 sm:col-span-1"
        >
          <History size={24} />
          <span className="text-xs font-bold text-center">Sync History</span>
        </button>
      </div>
      
      {/* High-Action Modules (Desktop) */}
      <div className="hidden sm:grid grid-cols-3 gap-6">
        <button 
          onClick={() => onSelectModule && onSelectModule('Register Logbook')}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center justify-start gap-4 shadow-sm cursor-pointer transition-colors"
        >
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl"><BookOpen size={24} /></div>
          <div className="text-left">
            <span className="text-sm font-black text-gray-900 block">Register Logbook</span>
            <span className="text-xs text-gray-500 font-medium">Editable offline registries</span>
          </div>
        </button>
        <button 
          onClick={() => onSelectModule && onSelectModule('Data & Explorer')}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center justify-start gap-4 shadow-sm cursor-pointer transition-colors"
        >
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl"><DatabaseIcon size={24} /></div>
          <div className="text-left">
            <span className="text-sm font-black text-gray-900 block">Data & Explorer</span>
            <span className="text-xs text-gray-500 font-medium">Browse data tables</span>
          </div>
        </button>
        <button 
          onClick={() => setSyncHistoryOpen(true)}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center justify-start gap-4 shadow-sm cursor-pointer transition-colors"
        >
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl"><History size={24} /></div>
          <div className="text-left">
            <span className="text-sm font-black text-gray-900 block">Sync History</span>
            <span className="text-xs text-gray-500 font-medium">View offline queue</span>
          </div>
        </button>
      </div>
`;

content = content.replace("{/* DYNAMIC METRICS FOR SPECIFIC ROLES */}", quickActionsJSX + "\n      {/* DYNAMIC METRICS FOR SPECIFIC ROLES */}");

const modalToAdd = `
      <SyncHistoryModal 
        isOpen={syncHistoryOpen} 
        onClose={() => setSyncHistoryOpen(false)} 
        queue={syncQueue} 
      />
    </div>
  );
}
`;

content = content.replace("    </div>\n  );\n}", modalToAdd);

fs.writeFileSync('src/components/Dashboard.tsx', content);
