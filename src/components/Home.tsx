import React, { useState, useEffect } from 'react';
import { 
  Activity, Users, Calendar, Home as BedIcon, AlertTriangle, 
  Clock, ArrowUpRight, Plus, CheckCircle2, Package, ShieldCheck, 
  Users2, ClipboardList, Stethoscope, ChevronRight, FileText,
  DollarSign, AlertCircle, TrendingUp, UserCheck, Bell, Heart,
  RotateCcw, Camera, CreditCard, Layers, FlaskConical, Pill, Scissors, Search
} from 'lucide-react';
import { 
  collection, onSnapshot, query, limit, orderBy, doc, updateDoc,
  getDoc, getDocs, where
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import PatientDetailsModal from './PatientDetailsModal';
import { Language, translate } from '../lib/translations';
import { isOffline } from '../lib/offlineSync';

// Required for the firebase-integration skill error handlers
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import { formatDateByCalendar } from '../lib/calendarUtils';
import CurrentStaffOnDuty from './CurrentStaffOnDuty';

interface HomeProps {
  setActiveTab: (tab: string) => void;
  currentLanguage?: Language;
}

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ComponentType<any>;
  colorClass: string;
  onClick?: () => void;
}

function StatCard({ title, value, subtitle, icon: Icon, colorClass, onClick }: StatCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-xs hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group relative overflow-hidden`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-extrabold text-gray-950 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
            {value}
          </h3>
          <p className="text-xs text-gray-400 font-medium">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClass} transition-transform group-hover:scale-110`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="absolute bottom-2 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] font-bold text-gray-500">View Division</span>
        <ArrowUpRight size={10} className="text-gray-400" />
      </div>
    </div>
  );
}

interface ShortcutItem {
  name: string;
  description: string;
  entityId: string;
  subEntityId?: string;
  icon: React.ComponentType<any>;
}

interface DivisionGroup {
  name: string;
  icon: React.ComponentType<any>;
  shortcuts: ShortcutItem[];
}

const DIVISIONS_DATA: DivisionGroup[] = [
  {
    name: 'Billing & Cashier Hub',
    icon: CreditCard,
    shortcuts: [
      { name: 'Payment Req', description: 'Generate new service invoice', entityId: 'Form_1_1_1_0', icon: Plus },
      { name: 'Verification', description: 'Verify payment status', entityId: 'Form_1_1_1_1', icon: CheckCircle2 },
      { name: 'Insurance', description: 'Submit and track claims', entityId: 'InsuranceClaim', icon: ShieldCheck }
    ]
  },
  {
    name: 'Clinical Services Hub',
    icon: Stethoscope,
    shortcuts: [
      { name: 'SOAP Note', description: 'Standard clinical documentation', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_d', icon: FileText },
      { name: 'Prescription', description: 'Electronic medication orders', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_m', icon: Pill },
      { name: 'Lab Hub', description: 'View and enter lab findings', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_j', icon: FlaskConical },
      { name: 'Vital Signs', description: 'Track patient physiological data', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_b', icon: Activity }
    ]
  },
  {
    name: 'Inpatient & Ward Management',
    icon: BedIcon,
    shortcuts: [
      { name: 'Discharge', description: 'Finalize inpatient exit flow', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_w', icon: CheckCircle2 },
      { name: 'Bed Tracker', description: 'Monitor ward bed occupancy', entityId: 'Bed', icon: BedIcon },
      { name: 'Surgery Log', description: 'Record operation details', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_x', icon: Scissors }
    ]
  },
  {
    name: 'Reception Hub',
    icon: Calendar,
    shortcuts: [
      { name: 'Liaison', description: 'Coordinate inter-dept data', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_r', icon: Users2 }
    ]
  },
  {
    name: 'Laboratory Services Hub',
    icon: FlaskConical,
    shortcuts: [
      { name: 'Lab Request', description: 'Order laboratory investigations', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_f', icon: Plus },
      { name: 'Lab Results', description: 'Enter and view lab findings', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_j', icon: FileText },
      { name: 'Lab Payment', description: 'Generate lab service bills', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_g', icon: DollarSign },
      { name: 'Inpatient Lab', description: 'Ward laboratory results', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_v_4', icon: ClipboardList }
    ]
  },
  {
    name: 'Radiology & Imaging Hub',
    icon: Camera,
    shortcuts: [
      { name: 'Rad Request', description: 'Order radiology imaging', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_h', icon: Plus },
      { name: 'Rad Results', description: 'Enter radiology findings', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_k', icon: Camera },
      { name: 'Rad Payment', description: 'Generate radiology bills', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_i', icon: DollarSign },
      { name: 'Interpretation', description: 'Clinical imaging reports', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_k', icon: FileText }
    ]
  },
  {
    name: 'Pharmacy & Medication Hub',
    icon: Pill,
    shortcuts: [
      { name: 'Prescription', description: 'Order patient medications', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_m', icon: Plus },
      { name: 'OPD Pharmacy', description: 'Outpatient medicine supply', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_m_1', icon: Package },
      { name: 'IPD Pharmacy', description: 'Inpatient medicine orders', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_t', icon: Pill },
      { name: 'Rx Payment', description: 'Pharmacy billing requests', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_n', icon: DollarSign }
    ]
  },
  {
    name: 'Triage & Vital Signs Hub',
    icon: Activity,
    shortcuts: [
      { name: 'Triage Form', description: 'Initial patient screening', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_a', icon: ClipboardList },
      { name: 'Vital Signs', description: 'Track physiological data', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_b', icon: Activity },
      { name: 'Ward Vitals', description: 'Inpatient vital monitoring', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_s', icon: Heart },
      { name: 'Encounter', description: 'Clinical SOAP assessment', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_d', icon: Stethoscope }
    ]
  },
  {
    name: 'Operating Theater & Surgery',
    icon: Scissors,
    shortcuts: [
      { name: 'Surgery Log', description: 'Record operation details', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_x', icon: Scissors },
      { name: 'OT Schedule', description: 'Manage theater bookings', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_z_6_b', icon: Calendar },
      { name: 'Pre-Op', description: 'Pre-operative assessment', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_x', icon: ClipboardList },
      { name: 'Post-Op', description: 'Post-operative recovery notes', entityId: 'Form_1_1_1_2', subEntityId: 'Form_1_1_1_y_15', icon: Activity }
    ]
  },
  {
    name: 'Inventory & Medical Supply',
    icon: Package,
    shortcuts: [
      { name: 'Stock List', description: 'Manage hospital inventory', entityId: 'supply_items', icon: Package },
      { name: 'Requisition', description: 'Order new medical supplies', entityId: 'supply_items', icon: ClipboardList },
      { name: 'Blood Bank', description: 'Monitor blood bag inventory', entityId: 'supply_items', icon: Heart },
      { name: 'Asset Tracker', description: 'Hospital equipment registry', entityId: 'supply_items', icon: Layers }
    ]
  }
];

export default function Home({ setActiveTab, currentLanguage = 'en' }: HomeProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showScanner, setShowScanner] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scannedPatient, setScannedPatient] = useState<any | null>(null);
  const [selectedPatientForModal, setSelectedPatientForModal] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [scanError, setScanError] = useState('');
  const [manualId, setManualId] = useState('');
  const [hubSearchQuery, setHubSearchQuery] = useState('');

  const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
  const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
  const hospital_id = activeHospital?.hospital_unique_number;

  // Handle shortcut click to transition dynamically to Data & Explorer
  const handleShortcutClick = (shortcut: ShortcutItem) => {
    sessionStorage.setItem('explorer_initial_entity', shortcut.entityId);
    if (shortcut.subEntityId) {
      sessionStorage.setItem('explorer_initial_sub_entity', shortcut.subEntityId);
    }
    setActiveTab('Data & Explorer');
  };

  // Filter divisions and shortcuts based on search
  const filteredDivisions = DIVISIONS_DATA.map(division => {
    const matchedShortcuts = division.shortcuts.filter(shortcut => {
      const q = hubSearchQuery.toLowerCase();
      return (
        shortcut.name.toLowerCase().includes(q) ||
        shortcut.description.toLowerCase().includes(q) ||
        division.name.toLowerCase().includes(q)
      );
    });
    return {
      ...division,
      shortcuts: matchedShortcuts
    };
  }).filter(division => division.shortcuts.length > 0);

  const handleScanResult = async (scannedText: string) => {
    if (!scannedText.trim()) return;
    setScanLoading(true);
    setScannedPatient(null);
    setScanError('');
    try {
      const text = scannedText.trim();
      
      // Helper to handle search with offline awareness
      const findPatient = async () => {
        // 1. Try finding by document ID first
        const docRef = doc(db, 'patients', text);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const belongs = !hospital_id || !data.hospital_id || data.hospital_id === 'demo-global' || data.hospital_id === hospital_id;
            if (belongs) return { id: docSnap.id, ...data };
          }
        } catch (e: any) {
          if (e.code === 'unavailable' || e.message?.includes('offline')) {
            console.log('Fetching patient by ID from cache failed or offline');
          } else {
            throw e;
          }
        }

        // 2. Try finding by MRN
        try {
          const q = query(collection(db, 'patients'), where('mrn', '==', text));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            const found = querySnap.docs.find(d => {
              const data = d.data();
              return !hospital_id || !data.hospital_id || data.hospital_id === 'demo-global' || data.hospital_id === hospital_id;
            });
            if (found) return { id: found.id, ...found.data() };
          }
        } catch (e: any) {
          if (e.code === 'unavailable' || e.message?.includes('offline')) {
            console.log('Fetching patient by MRN from cache failed or offline');
          } else {
            throw e;
          }
        }

        // 3. Fallback: search by name
        try {
          const qName = query(collection(db, 'patients'), where('name', '==', text));
          const querySnapName = await getDocs(qName);
          if (!querySnapName.empty) {
            const found = querySnapName.docs.find(d => {
              const data = d.data();
              return !hospital_id || !data.hospital_id || data.hospital_id === 'demo-global' || data.hospital_id === hospital_id;
            });
            if (found) return { id: found.id, ...found.data() };
          }
        } catch (e: any) {
          if (e.code === 'unavailable' || e.message?.includes('offline')) {
            console.log('Fetching patient by Name from cache failed or offline');
          } else {
            throw e;
          }
        }

        return null;
      };

      const patient = await findPatient();
      if (patient) {
        setScannedPatient(patient);
        setScanLoading(false);
      } else {
        const offlineMsg = isOffline() ? " (Database is currently offline and record is not in local cache)" : "";
        setScanError(`No patient chart found matching: "${text}"${offlineMsg}`);
      }
    } catch (err: any) {
      console.error("Scan processing error:", err);
      if (err.message?.includes('offline') || err.code === 'unavailable') {
        setScanError(`Offline Error: This patient record is not stored in your local cache. Please connect to the internet to perform a full database search.`);
      } else {
        setScanError(`Scan Error: ${err.message || err}`);
      }
    } finally {
      setScanLoading(false);
    }
  };
  
  // Real-time counts (Hardcoded to 0 for baseline initialization per request)
  const [counts, setCounts] = useState({
    patients: 0,
    encounters: 0,
    occupiedBeds: 0,
    totalBeds: 0,
    lowStockSupplies: 0,
    pendingMrns: 0
  });

  // KPI Lists and states
  const [admittedPatients, setAdmittedPatients] = useState<any[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // Set loading to false as we are showing baseline 0
  
  // Loading state tracking for individual alerts being acknowledged
  const [acknowledgingIds, setAcknowledgingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Clock tick
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Listeners disabled to maintain 0-count baseline per request
    /*
    const unsubscribes: (() => void)[] = [];
    ...
    */
    return () => {};
  }, []);

  // Action: Acknowledge live alert
  const handleAcknowledgeAlert = async (alertId: string) => {
    if (!alertId) return;
    setAcknowledgingIds(prev => ({ ...prev, [alertId]: true }));
    
    const docPath = `notifications/${alertId}`;
    try {
      const alertRef = doc(db, 'notifications', alertId);
      await updateDoc(alertRef, {
        is_acknowledged: true,
        acknowledged_by: auth.currentUser?.email || 'Admin Clinical Supervisor',
        acknowledged_at: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    } finally {
      setAcknowledgingIds(prev => ({ ...prev, [alertId]: false }));
    }
  };

  // Calculate sum of pending invoices
  const pendingInvoicesSum = pendingInvoices.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const formattedDate = formatDateByCalendar(currentTime, undefined, currentLanguage);

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Welcoming Interactive Hero Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden p-6 sm:p-8">
        {/* Subtle decorative design elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600"></div>
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Central Clinical Station
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-gray-100 tracking-tight leading-tight">
              Hospital Electronic Health Record
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl font-medium">
              Welcome back to the clinical supervisor dashboard. Real-time patient charts, secure clearances, and resource allocations are active and synchronized.
            </p>
            <div className="flex flex-wrap gap-3 items-center mt-3">
              <button 
                onClick={() => setShowScanner(!showScanner)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors cursor-pointer"
              >
                <Camera size={16} />
                {showScanner ? 'Close Scanner' : 'Scan Patient QR'}
              </button>
              
              {/* Fallback Manual Entry */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={translate('Search', currentLanguage)}
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => {
                    if (manualId.trim()) {
                      handleScanResult(manualId);
                    }
                  }}
                  className="px-3 py-1.5 bg-gray-150 dark:bg-slate-800 hover:bg-gray-250 dark:hover:bg-slate-750 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold transition-all cursor-pointer border border-transparent dark:border-slate-700"
                >
                  {translate('Search', currentLanguage).replace('...', '')}
                </button>
              </div>
            </div>

            {scanLoading && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 animate-pulse font-semibold">Searching Patient records...</p>
            )}

            {scanError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-semibold bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 rounded-lg inline-block">{scanError}</p>
            )}

            {showScanner && (
              <div className="w-full max-w-xs mt-4 p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xs">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2">
                  QR scanner is currently disabled. Please use manual entry.
                </p>
              </div>
            )}

            {/* Scanned Patient Details Modal */}
            <AnimatePresence>
              {scannedPatient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-1">
                          Scanned Patient Record Found
                        </span>
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 font-sans">
                          {scannedPatient.name}
                        </h3>
                      </div>
                      <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider rounded-md font-mono">
                        MRN: {scannedPatient.mrn}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                      <div className="p-3 bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 rounded-xl">
                        <span className="text-gray-400 dark:text-gray-500 block">Age / Gender</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {scannedPatient.age || 'N/A'} yrs / {scannedPatient.gender || 'N/A'}
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 rounded-xl">
                        <span className="text-gray-400 dark:text-gray-500 block">DOB</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {scannedPatient.dob || 'N/A'}
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 rounded-xl col-span-2">
                        <span className="text-gray-400 dark:text-gray-500 block">Phone</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {scannedPatient.phone || 'N/A'}
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 rounded-xl col-span-2">
                        <span className="text-gray-400 dark:text-gray-500 block">Address</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200 animate-pulse">
                          {scannedPatient.address || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        onClick={() => {
                          setScannedPatient(null);
                          setManualId('');
                        }}
                        className="px-4 py-2 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPatientForModal({
                            ...scannedPatient,
                            full_name: scannedPatient.name || scannedPatient.full_name
                          });
                          setIsDetailsModalOpen(true);
                          setScannedPatient(null);
                          setManualId('');
                        }}
                        className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        View Full Chart
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Detailed Clinical Hub & Medication Modal */}
            {isDetailsModalOpen && selectedPatientForModal && (
              <PatientDetailsModal
                patient={selectedPatientForModal}
                isOpen={isDetailsModalOpen}
                onClose={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedPatientForModal(null);
                }}
                activeHospital={activeHospital}
                currentLanguage={currentLanguage}
              />
            )}
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 shrink-0 w-full md:w-auto text-center md:text-right shadow-2xs">
            <div className="flex items-center justify-center md:justify-end gap-2 text-blue-600 font-bold text-sm mb-1">
              <Clock size={16} />
              <span className="font-mono tracking-tight">{formattedTime}</span>
            </div>
            <p className="text-xs font-semibold text-gray-800">{formattedDate}</p>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">Timezone: Africa/Addis_Ababa</p>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Hub Layout */}
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Left Sidebar: Departmental Operations Hub */}
        <div className="w-full xl:w-80 shrink-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col h-[750px] shadow-sm sticky top-6">
          <div className="space-y-1 mb-4">
            <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight font-sans">
              Departmental Operations Hub
            </h2>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider font-mono">
              Access Clinical & Departmental Forms
            </p>
          </div>

          {/* Hub Search Input */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Find form or shortcut..."
              value={hubSearchQuery}
              onChange={(e) => setHubSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-gray-400"
            />
          </div>

          {/* Scrollable Divisions & Shortcuts List */}
          <div className="flex-1 overflow-y-auto space-y-5 pr-1 font-sans">
            {filteredDivisions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-400 space-y-2">
                <Search size={24} className="text-gray-300 animate-pulse" />
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No shortcuts found</p>
                <p className="text-[10px] text-gray-400 max-w-[180px]">Try searching for "prescription", "lab", or "payment".</p>
              </div>
            ) : (
              filteredDivisions.map((division) => (
                <div key={division.name} className="space-y-2">
                  <div className="flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50/50 dark:bg-indigo-950/20 py-1 rounded-md">
                    {React.createElement(division.icon, { size: 12 })}
                    <span>{division.name}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 pl-1">
                    {division.shortcuts.map((shortcut) => (
                      <button
                        key={shortcut.name}
                        onClick={() => handleShortcutClick(shortcut)}
                        className="w-full text-left p-2 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:bg-indigo-50/5 dark:hover:bg-indigo-950/10 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0">
                            {React.createElement(shortcut.icon, { size: 12 })}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {shortcut.name}
                            </h4>
                            <p className="text-[9px] text-gray-400 dark:text-gray-500 truncate leading-tight font-medium">
                              {shortcut.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={12} className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Content Column: Stats, KPI and clinical controls */}
        <div className="flex-1 w-full space-y-8">
          {/* 2. Real-Time Interactive Stat Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Total Registered" 
          value={counts.patients} 
          subtitle="Unique Medical Charts" 
          icon={Users} 
          colorClass="bg-blue-50 text-blue-600"
          onClick={() => setActiveTab('Data')}
        />
        <StatCard 
          title="Active Encounters" 
          value={counts.encounters} 
          subtitle="Completed / Live Triages" 
          icon={Activity} 
          colorClass="bg-indigo-50 text-indigo-600"
          onClick={() => setActiveTab('Data')}
        />
        <StatCard 
          title="Bed Occupancy" 
          value={counts.totalBeds > 0 ? `${counts.occupiedBeds} / ${counts.totalBeds}` : '0 / 0'} 
          subtitle={`${counts.totalBeds - counts.occupiedBeds} Wards Vacant`} 
          icon={BedIcon} 
          colorClass="bg-emerald-50 text-emerald-600"
          onClick={() => setActiveTab('Data')}
        />
        <StatCard 
          title="Stock Alerts" 
          value={counts.lowStockSupplies} 
          subtitle="Items Below Threshold" 
          icon={Package} 
          colorClass="bg-rose-50 text-rose-600"
          onClick={() => setActiveTab('Data')}
        />
      </div>

      {/* 3. Real-Time Key Performance Indicators (KPI) & Care Command Center */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-xl shadow-xs">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-gray-950 tracking-tight">Real-Time EHR Command Center</h2>
              <p className="text-xs text-gray-500 font-medium">Synchronized metrics streaming live from clinic operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg self-start sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Stream Connected</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KPI Card 1: Admitted Patients */}
          <div className="border border-gray-100 rounded-2xl p-5 bg-gradient-to-b from-gray-50/50 to-white hover:border-emerald-200 transition-all flex flex-col justify-between h-[360px] relative">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Admitted Patients</h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-gray-900 leading-none">{admittedPatients.length}</span>
                    <span className="text-xs text-gray-400 font-semibold">on ward beds</span>
                  </div>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <BedIcon size={18} />
                </div>
              </div>

              {/* Scrollable Patient List */}
              <div className="space-y-2 h-[220px] overflow-y-auto pr-1">
                {admittedPatients.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-1.5">
                    <UserCheck size={28} className="text-gray-300" />
                    <p className="text-xs font-bold text-gray-800">No Inpatient Admissions</p>
                    <p className="text-[10px] text-gray-400 max-w-[180px]">All beds are currently available in the clinical wards.</p>
                  </div>
                ) : (
                  admittedPatients.map((bed, idx) => (
                    <div 
                      key={bed.id || idx}
                      className="p-3 bg-white border border-gray-100 rounded-xl hover:border-emerald-200 transition-all text-xs flex justify-between items-center group shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-gray-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">
                          {bed.patient_name || 'Anonymous Patient'}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium font-mono uppercase">
                          MRN: {bed.patient_uid || 'N/A'} • Bed {bed.bed_number}
                        </p>
                        <p className="text-[9px] text-gray-400 font-semibold">
                          Ward: <strong className="text-gray-600">{bed.ward}</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                          Admitted
                        </span>
                        <p className="text-[9px] text-gray-400 mt-0.5 font-medium">
                          {bed.admission_date ? new Date(bed.admission_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : 'Recently'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="text-[10px] text-gray-400 font-medium mt-2 border-t border-gray-50 pt-2 flex justify-between">
              <span>Bed Occupancy: {counts.totalBeds > 0 ? Math.round((counts.occupiedBeds / counts.totalBeds) * 100) : 0}%</span>
              <button onClick={() => setActiveTab('Data')} className="hover:text-emerald-600 font-bold flex items-center gap-0.5">
                Manage Beds <ChevronRight size={10} />
              </button>
            </div>
          </div>

          {/* KPI Card 2: Pending Invoices */}
          <div className="border border-gray-100 rounded-2xl p-5 bg-gradient-to-b from-gray-50/50 to-white hover:border-amber-200 transition-all flex flex-col justify-between h-[360px] relative">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Pending Invoices</h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-gray-900 leading-none">
                      {pendingInvoicesSum.toLocaleString('en-US', { style: 'currency', currency: 'ETB', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-xs text-amber-600 font-extrabold uppercase tracking-wider bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                      {pendingInvoices.length} Bills
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <DollarSign size={18} />
                </div>
              </div>

              {/* Scrollable Financial Ledger */}
              <div className="space-y-2 h-[220px] overflow-y-auto pr-1">
                {pendingInvoices.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-1.5">
                    <CheckCircle2 size={28} className="text-gray-300 animate-pulse" />
                    <p className="text-xs font-bold text-gray-800">Financial Ledger Cleared</p>
                    <p className="text-[10px] text-gray-400 max-w-[180px]">No pending payments or unbilled transactions exist currently.</p>
                  </div>
                ) : (
                  pendingInvoices.map((invoice, idx) => (
                    <div 
                      key={invoice.id || idx}
                      className="p-3 bg-white border border-gray-100 rounded-xl hover:border-amber-200 transition-all text-xs flex justify-between items-center group shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-gray-900 uppercase tracking-tight">
                          {invoice.patient_name || 'Anonymous Patient'}
                        </p>
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wide">
                          {invoice.service_type || 'Service'} Fee
                        </p>
                        <p className="text-[9px] text-gray-400 font-medium leading-tight">
                          {invoice.description || 'Outpatient service billing'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-gray-950 font-mono">
                          {Number(invoice.amount).toLocaleString('en-US', { style: 'currency', currency: 'ETB', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        <p className="text-[9px] text-gray-400 font-medium">
                          {invoice.tx_date ? new Date(invoice.tx_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : 'Today'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="text-[10px] text-gray-400 font-medium mt-2 border-t border-gray-50 pt-2 flex justify-between">
              <span>Total outstanding ledger value</span>
              <button onClick={() => setActiveTab('Data')} className="hover:text-amber-600 font-bold flex items-center gap-0.5">
                Cashier Panel <ChevronRight size={10} />
              </button>
            </div>
          </div>

          {/* KPI Card 3: Active Alerts & Remediation */}
          <div className="border border-gray-100 rounded-2xl p-5 bg-gradient-to-b from-gray-50/50 to-white hover:border-rose-200 transition-all flex flex-col justify-between h-[360px] relative">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Active Alerts</h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-gray-900 leading-none">{activeAlerts.length}</span>
                    <span className="text-xs text-rose-600 font-extrabold uppercase tracking-wider bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                      Unresolved
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl relative">
                  <Bell size={18} className={activeAlerts.length > 0 ? 'animate-bounce' : ''} />
                  {activeAlerts.length > 0 && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </div>
              </div>

              {/* Scrollable Active Alerts List */}
              <div className="space-y-2 h-[220px] overflow-y-auto pr-1">
                {activeAlerts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-1.5">
                    <ShieldCheck size={28} className="text-gray-300" />
                    <p className="text-xs font-bold text-gray-800">Clear Clinical Grid</p>
                    <p className="text-[10px] text-gray-400 max-w-[180px]">No active critical alerts or patient alerts are pending response.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {activeAlerts.map((alert, idx) => {
                      const isCritical = alert.severity === 'critical';
                      const isWarning = alert.severity === 'warning';
                      const badgeColor = isCritical 
                        ? 'bg-rose-50 text-rose-700 border-rose-100' 
                        : isWarning 
                        ? 'bg-amber-50 text-amber-700 border-amber-100' 
                        : 'bg-blue-50 text-blue-700 border-blue-100';

                      return (
                        <motion.div 
                          key={alert.id || idx}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`p-3 bg-white border border-gray-100 rounded-xl hover:border-rose-100 transition-all text-xs flex gap-2 justify-between items-start shadow-2xs`}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}>
                                {alert.severity || 'alert'}
                              </span>
                              <span className="font-extrabold text-gray-900 truncate uppercase tracking-tight">
                                {alert.title}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                              {alert.message}
                            </p>
                            {alert.patient_name && (
                              <p className="text-[9px] text-gray-400 font-semibold font-mono uppercase">
                                Patient: {alert.patient_name} • MRN: {alert.patient_uid || 'N/A'}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            disabled={acknowledgingIds[alert.id]}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all shrink-0 cursor-pointer border border-transparent hover:border-emerald-100 disabled:opacity-50"
                            title="Acknowledge & Resolve Alert"
                          >
                            {acknowledgingIds[alert.id] ? (
                              <RotateCcw size={14} className="animate-spin text-emerald-600" />
                            ) : (
                              <CheckCircle2 size={14} className="hover:scale-110 transition-transform" />
                            )}
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
            <div className="text-[10px] text-gray-400 font-medium mt-2 border-t border-gray-50 pt-2 flex justify-between">
              <span>Resolutions trigger real-time SMS status reports</span>
              <button onClick={() => setActiveTab('Data')} className="hover:text-rose-600 font-bold flex items-center gap-0.5">
                All Alerts <ChevronRight size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Clinical Division Quick Controls & Notice Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Commands panel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Stethoscope size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900 tracking-tight">Clinical Operations Shortcuts</h3>
                <p className="text-xs text-gray-400 font-medium">Instantly access specific clinical registries and forms</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => setActiveTab('Data')}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 bg-gray-50/50 hover:bg-blue-50/10 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform shadow-3xs">
                    <Plus size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Add New Patient</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Assign unique MRN & chart</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => setActiveTab('Data')}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-200 bg-gray-50/50 hover:bg-indigo-50/10 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform shadow-3xs">
                    <Activity size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Record Triage/Encounter</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Log active patient vitals</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => setActiveTab('Data')}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-purple-200 bg-gray-50/50 hover:bg-purple-50/10 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform shadow-3xs">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Write Prescription</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Generate digital drug sheet</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => setActiveTab('Data')}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-emerald-200 bg-gray-50/50 hover:bg-emerald-50/10 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform shadow-3xs">
                    <BedIcon size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Manage Ward Beds</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Review occupied and available beds</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="border-t border-gray-50 mt-6 pt-4 flex items-center justify-between text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
            <span>EHR System Authorization Level: Full Access Admin</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <ShieldCheck size={12} className="inline" /> Security: SEC-A256
            </span>
          </div>
        </div>
        
        {/* Current Staff On-Duty Panel */}
        <div className="lg:col-span-1 h-full">
          <CurrentStaffOnDuty />
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
