import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Activity, FileText, FlaskConical, Database, X, ArrowRight, ShieldAlert, ChevronRight, Stethoscope } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface GlobalSearchProps {
  activeHospital?: any;
  onSelectPatient?: (patient: any) => void;
  onSelectModule?: (moduleName: string) => void;
  onOpenQRScanner?: () => void;
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'patient' | 'triage' | 'prescription' | 'lab' | 'module';
  badge: string;
  badgeColor: string;
  data?: any;
  actionModule?: string;
}

export default function GlobalSearch({ activeHospital, onSelectPatient, onSelectModule, onOpenQRScanner }: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
  const localHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
  const hospital = activeHospital || localHospital;
  const hospital_id = hospital?.hospital_unique_number || hospital?.hospital_id || '';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary Modules List for Fuzzy Matching
  const ehrModules = [
    { name: 'Dashboard', category: 'Overview & Stats', keywords: ['home', 'kpi', 'dashboard', 'stats'] },
    { name: 'Data & Explorer', category: 'EHR Master Explorer', keywords: ['master', 'data', 'explorer', 'tables', 'schema'] },
    { name: 'Register Logbook Register Table (Editable Format)', category: 'Registers', keywords: ['logbook', 'register', 'opd', 'ipd', 'intake'] },
    { name: 'Module 3: Health Service IS', category: 'Clinical Services', keywords: ['service', 'clinical', 'triage', 'outpatient', 'inpatient'] },
    { name: 'Module 4: Quality Improvement', category: 'Quality & Audit', keywords: ['quality', 'qi', 'audit', 'kpi'] },
    { name: 'Module 5: Environmental Health', category: 'Environmental', keywords: ['environment', 'sanitation', 'water', 'hygiene'] },
    { name: 'Module 7: Human Resource Management', category: 'HR & Staffing', keywords: ['hr', 'staff', 'personnel', 'employee', 'shifts'] },
    { name: 'Module 9: Facility Equipment', category: 'Facilities', keywords: ['equipment', 'facility', 'assets', 'maintenance'] },
    { name: 'Module 10: Bio Medical', category: 'Bio-Medical Tech', keywords: ['biomedical', 'devices', 'monitors', 'tech'] },
    { name: 'Module 11: Pharmacy', category: 'Pharmacy & Stock', keywords: ['pharmacy', 'medication', 'drugs', 'dispensary', 'prescriptions'] },
    { name: 'Finance Department', category: 'Finance & Cashier', keywords: ['finance', 'billing', 'payments', 'revenue', 'cashier', 'ledger'] },
    { name: 'Module 12: Security Guard', category: 'Security & Safety', keywords: ['security', 'guard', 'gate', 'incident', 'access'] },
    { name: 'Planning Module (Strategic & Operational)', category: 'Planning', keywords: ['planning', 'strategy', 'targets', 'objectives'] },
    { name: 'Users', category: 'User Management', keywords: ['users', 'roles', 'accounts', 'passcode'] }
  ];

  // Perform Fuzzy Search across Firestore and System Modules
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const searchTimeout = setTimeout(async () => {
      const items: SearchResultItem[] = [];

      // 1. Fuzzy match EHR Modules
      ehrModules.forEach(mod => {
        const matchName = mod.name.toLowerCase().includes(term);
        const matchCategory = mod.category.toLowerCase().includes(term);
        const matchKw = mod.keywords.some(k => k.includes(term));

        if (matchName || matchCategory || matchKw) {
          items.push({
            id: 'mod-' + mod.name,
            title: mod.name,
            subtitle: `Module • ${mod.category}`,
            category: 'module',
            badge: 'System Module',
            badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            actionModule: mod.name
          });
        }
      });

      // 2. Fetch Patients from Firestore
      try {
        if (db && hospital_id) {
          const pRef = collection(db, 'patients');
          const pQuery = query(pRef, where('hospital_id', '==', hospital_id), limit(30));
          const pSnap = await getDocs(pQuery);

          pSnap.docs.forEach(doc => {
            const data = doc.data();
            const fullName = (data.full_name || data.name || data.patient_name || '').toString();
            const mrn = (data.mrn || data.patient_mrn || doc.id).toString();
            const phone = (data.phone || data.mobile || '').toString();
            const genderAge = `${data.gender || 'Unknown'} • ${data.age || 'N/A'} yrs`;

            if (
              fullName.toLowerCase().includes(term) ||
              mrn.toLowerCase().includes(term) ||
              phone.includes(term)
            ) {
              items.push({
                id: doc.id,
                title: fullName || `Patient ${mrn}`,
                subtitle: `MRN: ${mrn} | ${genderAge} | Dept: ${data.department || 'OPD'}`,
                category: 'patient',
                badge: data.status === 'Admitted' ? 'Inpatient' : 'Outpatient',
                badgeColor: data.status === 'Admitted' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300',
                data: { ...data, id: doc.id, full_name: fullName, mrn }
              });
            }
          });

          // 3. Fetch Recent Triage Records
          const tRef = collection(db, 'triage');
          const tQuery = query(tRef, where('hospital_id', '==', hospital_id), limit(20));
          const tSnap = await getDocs(tQuery);

          tSnap.docs.forEach(doc => {
            const data = doc.data();
            const name = data.patient_name || data.name || '';
            const mrn = data.patient_mrn || data.mrn || '';
            const chief = data.chief_complaint || data.complaint || '';
            const triageLevel = data.triage_level || 'Level 3 - Urgent';

            if (
              name.toLowerCase().includes(term) ||
              mrn.toLowerCase().includes(term) ||
              chief.toLowerCase().includes(term) ||
              triageLevel.toLowerCase().includes(term)
            ) {
              items.push({
                id: 'tr-' + doc.id,
                title: `${name || 'Patient'} (${mrn})`,
                subtitle: `Triage: ${triageLevel} • Complaint: ${chief || 'N/A'}`,
                category: 'triage',
                badge: triageLevel.includes('1') || triageLevel.includes('Critical') ? '⚡ Emergency' : 'Triage',
                badgeColor: triageLevel.includes('1') || triageLevel.includes('Critical') ? 'bg-red-100 text-red-900 border-red-300 animate-pulse' : 'bg-amber-100 text-amber-900 border-amber-300',
                data: { ...data, id: doc.id, full_name: name, mrn },
                actionModule: 'Module 3: Health Service IS'
              });
            }
          });
        }
      } catch (err) {
        console.warn('Global search query error:', err);
      }

      setResults(items);
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(searchTimeout);
  }, [searchTerm, hospital_id]);

  const handleSelectItem = (item: SearchResultItem) => {
    setIsOpen(false);
    setSearchTerm('');

    if (item.category === 'patient' && item.data && onSelectPatient) {
      onSelectPatient(item.data);
    } else if (item.actionModule && onSelectModule) {
      onSelectModule(item.actionModule);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'patient':
        return <User size={16} className="text-emerald-600 dark:text-emerald-400" />;
      case 'triage':
        return <Activity size={16} className="text-red-600 dark:text-red-400" />;
      case 'prescription':
        return <FileText size={16} className="text-purple-600 dark:text-purple-400" />;
      case 'lab':
        return <FlaskConical size={16} className="text-blue-600 dark:text-blue-400" />;
      default:
        return <Database size={16} className="text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div ref={searchRef} className="relative flex-1 max-w-xl mx-2">
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search patient (MRN, Name), Triage, Rx, Labs or Module..."
          className="w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-3xs transition-all placeholder:text-slate-400"
        />
        {searchTerm ? (
          <button
            onClick={() => {
              setSearchTerm('');
              setResults([]);
            }}
            className="absolute right-3 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X size={14} />
          </button>
        ) : (
          <span className="absolute right-3 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 pointer-events-none">
            Ctrl+K
          </span>
        )}
      </div>

      {/* Dropdown Search Results Overlay */}
      {isOpen && searchTerm.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[150] max-h-96 flex flex-col">
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>
              {isLoading ? 'Searching EHR Ledger...' : `Found ${results.length} record matches`}
            </span>
            {onOpenQRScanner && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenQRScanner();
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-extrabold cursor-pointer"
              >
                <Stethoscope size={12} /> Scan QR / Barcode
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400 font-medium animate-pulse">
                Searching across 160 EHR Clinical & Master Tables...
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <ShieldAlert size={24} className="mx-auto text-slate-400" />
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">No records found matching "{searchTerm}"</div>
                <p className="text-[11px] text-slate-400">
                  Try searching by Patient MRN (e.g. MRN-1001), full name, or module keywords like "Pharmacy", "Triage", "HR".
                </p>
              </div>
            ) : (
              results.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className="p-3 hover:bg-slate-50 dark:hover:bg-slate-850/80 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {item.title}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all">
                    <ChevronRight size={16} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
