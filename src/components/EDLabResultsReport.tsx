import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  FlaskConical, AlertTriangle, CheckCircle2, Clock, Plus, Search, Filter, 
  Trash2, RefreshCw, ShieldCheck, Download, Eye, Info, X, Edit, Calendar, User, Building, Heart
} from 'lucide-react';

// Unified 1.1.1.j Schema Interface
export interface EDLabResultsReportData {
  id?: string;
  hospital_id: string; // text, required
  patient_MRN: string; // text, required
  opd_or_ward_name: string; // text, required ("OPD or Ward name")
  first_last_name: string; // text, required ("first_ last_name")
  gender: 'Male' | 'Female' | 'Other' | 'Unknown'; // text, required
  ed_location: string; // text, required
  triage_acuity: number; // number, required. 1 = Resuscitation, 5 = Non-urgent
  admit_timestamp: string; // date-time, required
  ordering_provider_id: string; // text, required
  order_priority: 'STAT' | 'ASAP' | 'Timed' | 'Routine'; // text, required
  panel_code: string; // text, required
  specimen_type: string; // text, required
  collection_timestamp: string; // date-time, required
  receipt_timestamp?: string; // date-time
  specimen_status: 'Collected' | 'In-Transit' | 'Received' | 'Processing' | 'Completed' | 'Rejected'; // text, required
  rejection_reason?: string; // text
  test_code: string; // text, required
  test_name: string; // text, required
  numeric_value?: number; // number
  text_value?: string; // text
  unit_of_measure?: string; // text
  reference_range_low?: number; // number
  reference_range_high?: number; // number
  abnormal_flag: 'Normal' | 'High' | 'Low' | 'Critical High' | 'Critical Low'; // text, required
  result_timestamp: string; // date-time, required
  technician_name: string; // text, required
  alert_trigger_time?: string; // date-time
  notification_status?: 'N/A' | 'Pending Acknowledgment' | 'Acknowledged' | 'Escalated'; // text
  notified_provider_id?: string; // text
  acknowledgment_time?: string; // date-time
  read_back_verified?: boolean; // boolean
}

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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'anonymous'
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export default function EDLabResultsReport() {
  const [reports, setReports] = useState<EDLabResultsReportData[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter & View States
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [abnormalFilter, setAbnormalFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedReport, setSelectedReport] = useState<EDLabResultsReportData | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState<EDLabResultsReportData | null>(null);

  // Verification / Acknowledgment Input Form state
  const [notifiedProvider, setNotifiedProvider] = useState('');
  const [readBackVerified, setReadBackVerified] = useState(false);

  // New Record Form State (Verbatim mappings matching 1.1.1.j schema definition)
  const initialFormState: Omit<EDLabResultsReportData, 'id'> = {
    hospital_id: 'HOSP-BLACK-LION',
    patient_MRN: '',
    opd_or_ward_name: 'Emergency Department',
    first_last_name: '',
    gender: 'Male',
    ed_location: 'Trauma Bay 1',
    triage_acuity: 1,
    admit_timestamp: new Date().toISOString().substring(0, 16),
    ordering_provider_id: 'DR-ASTATKE',
    order_priority: 'STAT',
    panel_code: 'BMP',
    specimen_type: 'Whole Blood',
    collection_timestamp: new Date().toISOString().substring(0, 16),
    receipt_timestamp: new Date().toISOString().substring(0, 16),
    specimen_status: 'Completed',
    rejection_reason: '',
    test_code: '2823-3',
    test_name: 'Potassium',
    numeric_value: 6.2,
    text_value: '',
    unit_of_measure: 'mmol/L',
    reference_range_low: 3.5,
    reference_range_high: 5.1,
    abnormal_flag: 'Critical High',
    result_timestamp: new Date().toISOString().substring(0, 16),
    technician_name: 'Tech Hanna Sileshi',
    alert_trigger_time: new Date().toISOString().substring(0, 16),
    notification_status: 'Pending Acknowledgment',
    notified_provider_id: '',
    acknowledgment_time: '',
    read_back_verified: false
  };

  const [newReport, setNewReport] = useState<Omit<EDLabResultsReportData, 'id'>>(initialFormState);

  // Preset Helpers to speed up data entry
  const PANEL_PRESETS = ['BMP', 'CBC', 'ABG', 'TROP', 'CMP', 'WBC'];
  const SPECIMEN_PRESETS = ['Whole Blood', 'Serum', 'Plasma', 'CSF', 'Urine'];
  const STATUS_PRESETS = ['Collected', 'In-Transit', 'Received', 'Processing', 'Completed', 'Rejected'];
  const ABNORMAL_FLAGS = ['Normal', 'High', 'Low', 'Critical High', 'Critical Low'];

  // Sync with Firestore
  useEffect(() => {
    setLoading(true);
    const collectionPath = 'form_1_1_1_j';
    const unsub = onSnapshot(collection(db, collectionPath), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EDLabResultsReportData));
      setReports(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Seeding high-fidelity emergency department lab reports (including critical value alerts)
  const seedDemoReports = async () => {
    const collectionPath = 'form_1_1_1_j';
    try {
      const demoData: Omit<EDLabResultsReportData, 'id'>[] = [
        {
          hospital_id: 'HOSP-BLACK-LION',
          patient_MRN: 'MRN-2026-9081',
          opd_or_ward_name: 'ED Red Zone',
          first_last_name: 'Almaz Kassa',
          gender: 'Female',
          ed_location: 'Resuscitation Bay A',
          triage_acuity: 1,
          admit_timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
          ordering_provider_id: 'DR-YOHANNES',
          order_priority: 'STAT',
          panel_code: 'BMP',
          specimen_type: 'Serum',
          collection_timestamp: new Date(Date.now() - 50 * 60000).toISOString(),
          receipt_timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
          specimen_status: 'Completed',
          test_code: '2823-3',
          test_name: 'Potassium',
          numeric_value: 6.8,
          unit_of_measure: 'mmol/L',
          reference_range_low: 3.5,
          reference_range_high: 5.1,
          abnormal_flag: 'Critical High',
          result_timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          technician_name: 'Tech Hanna Sileshi',
          alert_trigger_time: new Date(Date.now() - 14 * 60000).toISOString(),
          notification_status: 'Pending Acknowledgment',
          notified_provider_id: '',
          read_back_verified: false
        },
        {
          hospital_id: 'HOSP-BLACK-LION',
          patient_MRN: 'MRN-2026-3392',
          opd_or_ward_name: 'Chest Pain Clinic',
          first_last_name: 'Dawit Amare',
          gender: 'Male',
          ed_location: 'Bed 12 (Yellow Zone)',
          triage_acuity: 2,
          admit_timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
          ordering_provider_id: 'DR-BEKELE',
          order_priority: 'STAT',
          panel_code: 'TROP',
          specimen_type: 'Whole Blood',
          collection_timestamp: new Date(Date.now() - 100 * 60000).toISOString(),
          receipt_timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
          specimen_status: 'Completed',
          test_code: '42603-1',
          test_name: 'Troponin T.hs',
          numeric_value: 120,
          unit_of_measure: 'ng/L',
          reference_range_low: 0,
          reference_range_high: 14,
          abnormal_flag: 'Critical High',
          result_timestamp: new Date(Date.now() - 65 * 60000).toISOString(),
          technician_name: 'Tech Hanna Sileshi',
          alert_trigger_time: new Date(Date.now() - 60 * 60000).toISOString(),
          notification_status: 'Acknowledged',
          notified_provider_id: 'DR-BEKELE',
          acknowledgment_time: new Date(Date.now() - 55 * 60000).toISOString(),
          read_back_verified: true
        },
        {
          hospital_id: 'HOSP-BLACK-LION',
          patient_MRN: 'MRN-2026-0044',
          opd_or_ward_name: 'Pediatric ED',
          first_last_name: 'Lula Tewodros',
          gender: 'Female',
          ed_location: 'Peds Bed 3',
          triage_acuity: 3,
          admit_timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
          ordering_provider_id: 'DR-MULUGETA',
          order_priority: 'Routine',
          panel_code: 'CBC',
          specimen_type: 'Whole Blood',
          collection_timestamp: new Date(Date.now() - 150 * 60000).toISOString(),
          receipt_timestamp: new Date(Date.now() - 130 * 60000).toISOString(),
          specimen_status: 'Completed',
          test_code: '6690-2',
          test_name: 'White Blood Cell (WBC)',
          numeric_value: 18.4,
          unit_of_measure: '10^3/uL',
          reference_range_low: 4.5,
          reference_range_high: 11.0,
          abnormal_flag: 'High',
          result_timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
          technician_name: 'Tech Samuel Girma',
          notification_status: 'N/A'
        },
        {
          hospital_id: 'HOSP-BLACK-LION',
          patient_MRN: 'MRN-2026-5561',
          opd_or_ward_name: 'ED Trauma Bay',
          first_last_name: 'Ephrem Hailu',
          gender: 'Male',
          ed_location: 'Trauma Bed 2',
          triage_acuity: 1,
          admit_timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
          ordering_provider_id: 'DR-YOHANNES',
          order_priority: 'STAT',
          panel_code: 'ABG',
          specimen_type: 'Whole Blood',
          collection_timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
          receipt_timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          specimen_status: 'Completed',
          test_code: '2703-7',
          test_name: 'pH, Arterial Blood',
          numeric_value: 7.15,
          unit_of_measure: 'pH units',
          reference_range_low: 7.35,
          reference_range_high: 7.45,
          abnormal_flag: 'Critical Low',
          result_timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
          technician_name: 'Tech Samuel Girma',
          alert_trigger_time: new Date(Date.now() - 18 * 60000).toISOString(),
          notification_status: 'Pending Acknowledgment',
          notified_provider_id: '',
          read_back_verified: false
        },
        {
          hospital_id: 'HOSP-BLACK-LION',
          patient_MRN: 'MRN-2026-1120',
          opd_or_ward_name: 'ED Observation',
          first_last_name: 'Marta Tesfaye',
          gender: 'Female',
          ed_location: 'Bed 20',
          triage_acuity: 4,
          admit_timestamp: new Date(Date.now() - 300 * 60000).toISOString(),
          ordering_provider_id: 'DR-BEKELE',
          order_priority: 'ASAP',
          panel_code: 'CMP',
          specimen_type: 'Serum',
          collection_timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
          specimen_status: 'Rejected',
          rejection_reason: 'Specimen severely hemolyzed. Please redraw.',
          test_code: '14912-1',
          test_name: 'Calcium, Serum',
          abnormal_flag: 'Normal',
          result_timestamp: new Date(Date.now() - 220 * 60000).toISOString(),
          technician_name: 'Tech Samuel Girma',
          notification_status: 'N/A'
        }
      ];

      for (const item of demoData) {
        await addDoc(collection(db, collectionPath), item);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, collectionPath);
    }
  };

  // Submit new report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.patient_MRN || !newReport.first_last_name || !newReport.test_name) {
      alert("Please fill in the required fields (Patient MRN, name, and test name).");
      return;
    }
    const collectionPath = 'form_1_1_1_j';
    try {
      await addDoc(collection(db, collectionPath), newReport);
      setShowAddModal(false);
      setNewReport(initialFormState);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, collectionPath);
    }
  };

  // Delete a report
  const handleDeleteReport = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this lab report from LIS logs?")) return;
    const collectionPath = 'form_1_1_1_j';
    try {
      await deleteDoc(doc(db, collectionPath, id));
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, collectionPath);
    }
  };

  // Sign off / Acknowledge Critical Value
  const handleAcknowledgeCritical = async () => {
    if (!showAcknowledgeModal || !showAcknowledgeModal.id) return;
    if (!notifiedProvider) {
      alert("Please provide the ID of the notified physician.");
      return;
    }

    const collectionPath = 'form_1_1_1_j';
    try {
      const docRef = doc(db, collectionPath, showAcknowledgeModal.id);
      await updateDoc(docRef, {
        notification_status: 'Acknowledged',
        notified_provider_id: notifiedProvider,
        acknowledgment_time: new Date().toISOString(),
        read_back_verified: readBackVerified
      });

      // Update local state views if needed
      if (selectedReport?.id === showAcknowledgeModal.id) {
        setSelectedReport(prev => prev ? {
          ...prev,
          notification_status: 'Acknowledged',
          notified_provider_id: notifiedProvider,
          acknowledgment_time: new Date().toISOString(),
          read_back_verified: readBackVerified
        } : null);
      }

      setShowAcknowledgeModal(null);
      setNotifiedProvider('');
      setReadBackVerified(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, collectionPath);
    }
  };

  // Filtered reports
  const getFilteredReports = () => {
    return reports.filter(r => {
      // Search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        r.patient_MRN.toLowerCase().includes(searchLower) ||
        r.first_last_name.toLowerCase().includes(searchLower) ||
        r.test_name.toLowerCase().includes(searchLower) ||
        r.ed_location.toLowerCase().includes(searchLower) ||
        r.opd_or_ward_name.toLowerCase().includes(searchLower);

      // Priority
      const matchesPriority = priorityFilter === 'ALL' || r.order_priority === priorityFilter;

      // Abnormal
      const matchesAbnormal = abnormalFilter === 'ALL' || r.abnormal_flag === abnormalFilter;

      // Status
      const matchesStatus = statusFilter === 'ALL' || r.specimen_status === statusFilter;

      return matchesSearch && matchesPriority && matchesAbnormal && matchesStatus;
    });
  };

  // Calculations
  const statsTotal = reports.length;
  const statsStat = reports.filter(r => r.order_priority === 'STAT').length;
  const statsCritical = reports.filter(r => r.abnormal_flag.includes('Critical')).length;
  const statsPendingAck = reports.filter(r => r.notification_status === 'Pending Acknowledgment').length;

  // Export to CSV
  const exportToCSV = () => {
    const filtered = getFilteredReports();
    if (filtered.length === 0) return;
    
    const headers = [
      'hospital_id', 'patient_MRN', 'opd_or_ward_name', 'first_last_name', 'gender',
      'ed_location', 'triage_acuity', 'admit_timestamp', 'ordering_provider_id',
      'order_priority', 'panel_code', 'specimen_type', 'collection_timestamp',
      'receipt_timestamp', 'specimen_status', 'rejection_reason', 'test_code',
      'test_name', 'numeric_value', 'text_value', 'unit_of_measure',
      'reference_range_low', 'reference_range_high', 'abnormal_flag',
      'result_timestamp', 'technician_name', 'alert_trigger_time',
      'notification_status', 'notified_provider_id', 'acknowledgment_time',
      'read_back_verified'
    ];

    const csvRows = [headers.join(',')];
    
    for (const r of filtered) {
      const values = headers.map(header => {
        const val = (r as any)[header];
        const cleaned = val === undefined || val === null ? '' : String(val).replace(/"/g, '""');
        return `"${cleaned}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ed_lab_results_1.1.1.j_${new Date().toISOString().slice(0, 10)}.csv`);
    a.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6" id="ed-lab-results-dashboard">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            Form 1.1.1.j Schema Implementation
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-1">
            <FlaskConical className="text-indigo-600" size={26} />
            Emergency Department Laboratory Report
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 max-w-2xl">
            Real-time Laboratory Information System (LIS) logs for critical panic value escalation, verbal read-backs, and urgent STAT order status tracking.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {reports.length === 0 && (
            <button
              onClick={seedDemoReports}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={14} className="animate-spin-slow" /> Seeder Demo Reports
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} /> Log Laboratory Report
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3.5 shadow-3xs hover:shadow-2xs transition-shadow">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <FlaskConical size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Lab Logs</p>
            <p className="text-xl font-extrabold text-slate-900">{statsTotal}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3.5 shadow-3xs hover:shadow-2xs transition-shadow">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">STAT Urgencies</p>
            <p className="text-xl font-extrabold text-slate-900">{statsStat}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3.5 shadow-3xs hover:shadow-2xs transition-shadow">
          <div className="p-3 rounded-xl bg-red-50 text-red-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Critical Values</p>
            <p className="text-xl font-extrabold text-slate-900">{statsCritical}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3.5 shadow-3xs hover:shadow-2xs transition-shadow">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pending Sign-off</p>
            <p className="text-xl font-extrabold text-slate-900">{statsPendingAck}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-3xs">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search MRN, name, test analyte, ward..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          {/* Priority filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
            <Filter size={12} className="text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-[11px] font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Priority: All</option>
              <option value="STAT">STAT</option>
              <option value="ASAP">ASAP</option>
              <option value="Timed">Timed</option>
              <option value="Routine">Routine</option>
            </select>
          </div>

          {/* Abnormal filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
            <AlertTriangle size={12} className="text-slate-400" />
            <select
              value={abnormalFilter}
              onChange={(e) => setAbnormalFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-[11px] font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Result: All</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Low">Low</option>
              <option value="Critical High">Critical High</option>
              <option value="Critical Low">Critical Low</option>
            </select>
          </div>

          {/* Specimen Status filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
            <Info size={12} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-[11px] font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Status: All</option>
              <option value="Collected">Collected</option>
              <option value="In-Transit">In-Transit</option>
              <option value="Received">Received</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            disabled={getFilteredReports().length === 0}
            className="ml-auto md:ml-0 px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT/MID: Lab Report Logs Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Emergency LIS Registry logs ({getFilteredReports().length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="p-3">Patient MRN / Name</th>
                  <th className="p-3">ED Location & Ward</th>
                  <th className="p-3">Analyte / Test</th>
                  <th className="p-3 text-center">Value</th>
                  <th className="p-3">Acuity / Priority</th>
                  <th className="p-3">Alert Notification</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <RefreshCw size={24} className="animate-spin text-indigo-500" />
                        <span className="text-xs font-semibold">Synchronizing LIS Database...</span>
                      </div>
                    </td>
                  </tr>
                ) : getFilteredReports().length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      No matching Emergency Lab results found. Register a new lab log or load the mock seeder above.
                    </td>
                  </tr>
                ) : (
                  getFilteredReports().map((r) => {
                    const isCritical = r.abnormal_flag.includes('Critical');
                    const isAck = r.notification_status === 'Acknowledged';

                    return (
                      <tr 
                        key={r.id} 
                        onClick={() => setSelectedReport(r)}
                        className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${selectedReport?.id === r.id ? 'bg-indigo-50/30' : ''}`}
                      >
                        {/* Patient */}
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{r.first_last_name}</div>
                          <div className="font-mono text-[10px] text-slate-500 font-medium">{r.patient_MRN}</div>
                        </td>

                        {/* Location */}
                        <td className="p-3">
                          <div className="font-semibold text-slate-800 text-[11px]">{r.ed_location}</div>
                          <div className="text-[10px] text-slate-500">{r.opd_or_ward_name}</div>
                        </td>

                        {/* Analyte */}
                        <td className="p-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            {r.test_name}
                            <span className="text-[9px] bg-slate-100 px-1 py-0.2 rounded font-mono text-slate-500 font-normal">{r.panel_code}</span>
                          </div>
                          <div className="text-[9px] font-mono text-slate-500">LOINC: {r.test_code}</div>
                        </td>

                        {/* Value & Flag */}
                        <td className="p-3 text-center">
                          {r.specimen_status === 'Rejected' ? (
                            <span className="bg-red-50 text-red-700 text-[10px] px-2 py-0.5 rounded font-black border border-red-200">
                              REJECTED
                            </span>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className={`text-[12px] font-extrabold ${
                                r.abnormal_flag.includes('Critical') ? 'text-red-600 underline decoration-double font-black' :
                                r.abnormal_flag === 'High' ? 'text-orange-600' :
                                r.abnormal_flag === 'Low' ? 'text-indigo-600' : 'text-slate-800'
                              }`}>
                                {r.numeric_value !== undefined ? r.numeric_value : r.text_value || 'N/A'} {r.unit_of_measure}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.1 rounded font-black uppercase tracking-wider mt-0.5 ${
                                r.abnormal_flag === 'Critical High' ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse' :
                                r.abnormal_flag === 'Critical Low' ? 'bg-purple-100 text-purple-800 border border-purple-200 animate-pulse' :
                                r.abnormal_flag === 'High' ? 'bg-orange-100 text-orange-800' :
                                r.abnormal_flag === 'Low' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {r.abnormal_flag}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Acuity / Priority */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              r.order_priority === 'STAT' ? 'bg-red-100 text-red-800' :
                              r.order_priority === 'ASAP' ? 'bg-amber-100 text-amber-800' :
                              r.order_priority === 'Timed' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {r.order_priority}
                            </span>
                            <span className="text-slate-400 text-[10px]">ESI {r.triage_acuity}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {new Date(r.collection_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Alert notification status */}
                        <td className="p-3">
                          {isCritical ? (
                            <div className="space-y-1">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 w-fit ${
                                isAck ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200 animate-pulse'
                              }`}>
                                <AlertTriangle size={10} />
                                {r.notification_status}
                              </span>
                              {isAck && r.acknowledgment_time && (
                                <div className="text-[9px] text-slate-500 leading-tight">
                                  Signed by {r.notified_provider_id} <br/>
                                  at {new Date(r.acknowledgment_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-semibold italic">N/A</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedReport(r)}
                              title="View Detailed Lab Sheet"
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50"
                            >
                              <Eye size={14} />
                            </button>

                            {isCritical && !isAck && (
                              <button
                                onClick={() => setShowAcknowledgeModal(r)}
                                title="Acknowledge Critical Alert"
                                className="px-2 py-0.5 bg-red-100 text-red-800 hover:bg-red-200 text-[10px] font-black rounded-md flex items-center gap-0.5"
                              >
                                <ShieldCheck size={11} /> Sign
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteReport(r.id!)}
                              title="Delete LIS Log"
                              className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Detailed Lab Sheet View & Documentation */}
        <div className="space-y-4">
          
          {selectedReport ? (
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden" id="lab-sheet-viewer">
              {/* Clinical Report Header Decoration */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500"></div>
              
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
                <div>
                  <h4 className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">OFFICIAL CLINICAL LAB SHEET</h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Hosp: {selectedReport.hospital_id}</p>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Patient Profile */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-500 block">Patient Name</span>
                  <span className="font-extrabold text-slate-200">{selectedReport.first_last_name}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-500 block">Patient MRN</span>
                  <span className="font-mono font-bold text-slate-200">{selectedReport.patient_MRN}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-500 block">Gender</span>
                  <span className="font-semibold text-slate-300">{selectedReport.gender}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-500 block">ED Location</span>
                  <span className="font-semibold text-slate-300">{selectedReport.ed_location}</span>
                </div>
                <div className="col-span-2 border-t border-slate-800 pt-1.5 mt-0.5">
                  <span className="text-[9px] font-bold uppercase text-slate-500 block">OPD or Ward Name</span>
                  <span className="font-semibold text-slate-300">{selectedReport.opd_or_ward_name}</span>
                </div>
              </div>

              {/* Order & Specimen Details */}
              <div className="space-y-2 text-[11px] mb-4">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-500">Ordering Provider</span>
                  <span className="font-mono text-slate-300 font-bold">{selectedReport.ordering_provider_id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-500">Order Priority</span>
                  <span className={`font-bold uppercase ${selectedReport.order_priority === 'STAT' ? 'text-red-400' : 'text-slate-300'}`}>
                    {selectedReport.order_priority}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-500">Triage Acuity</span>
                  <span className="text-slate-300 font-bold">ESI {selectedReport.triage_acuity}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-500">Test Panel Code</span>
                  <span className="font-mono text-slate-300 font-bold">{selectedReport.panel_code}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-500">Specimen Type</span>
                  <span className="text-slate-300">{selectedReport.specimen_type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-500">Collection Time</span>
                  <span className="font-mono text-slate-300">{new Date(selectedReport.collection_timestamp).toLocaleString()}</span>
                </div>
                {selectedReport.receipt_timestamp && (
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-500">LIS Receipt Time</span>
                    <span className="font-mono text-slate-300">{new Date(selectedReport.receipt_timestamp).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-500">Specimen Status</span>
                  <span className={`font-bold ${selectedReport.specimen_status === 'Rejected' ? 'text-red-400' : 'text-slate-300'}`}>
                    {selectedReport.specimen_status}
                  </span>
                </div>
                {selectedReport.rejection_reason && (
                  <div className="bg-red-950/40 p-2.5 rounded-xl border border-red-900/30 text-red-300 text-[11px] mt-1">
                    <span className="font-black block text-[9px] uppercase tracking-wider text-red-400 mb-0.5">Rejection Reason:</span>
                    {selectedReport.rejection_reason}
                  </div>
                )}
              </div>

              {/* Lab Result Analyte Highlight */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">ANALYTE LOGGED RESULT</span>
                <p className="text-sm font-black text-slate-200">{selectedReport.test_name} ({selectedReport.test_code})</p>
                
                {selectedReport.specimen_status === 'Rejected' ? (
                  <div className="text-red-400 text-xs font-bold uppercase mt-2">SPECIMEN REJECTED BY LABORATORY</div>
                ) : (
                  <div className="mt-2 space-y-1">
                    <div className="text-3xl font-black text-white tracking-tight">
                      {selectedReport.numeric_value !== undefined ? selectedReport.numeric_value : selectedReport.text_value || 'N/A'}
                      <span className="text-xs font-semibold text-slate-400 ml-1.5">{selectedReport.unit_of_measure}</span>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        selectedReport.abnormal_flag.includes('Critical') ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse' :
                        selectedReport.abnormal_flag === 'High' ? 'bg-orange-950 text-orange-400 border border-orange-900' :
                        selectedReport.abnormal_flag === 'Low' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {selectedReport.abnormal_flag} Flag
                      </span>
                    </div>

                    {(selectedReport.reference_range_low !== undefined || selectedReport.reference_range_high !== undefined) && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        Normal Reference Range: {selectedReport.reference_range_low} - {selectedReport.reference_range_high} {selectedReport.unit_of_measure}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Finalization Metadata & Sign-offs */}
              <div className="space-y-2 text-[11px] pt-3 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Technician Signature</span>
                  <span className="text-slate-300 font-bold italic">{selectedReport.technician_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Result Finalized Time</span>
                  <span className="font-mono text-slate-300">{new Date(selectedReport.result_timestamp).toLocaleString()}</span>
                </div>

                {/* Critical Panic Value Protocol fields */}
                {selectedReport.abnormal_flag.includes('Critical') && (
                  <div className="bg-red-950/30 border border-red-900/40 p-3 rounded-xl space-y-2 mt-2">
                    <span className="text-[9px] font-black uppercase text-red-400 tracking-wider flex items-center gap-1">
                      <AlertTriangle size={11} /> PANIC ALERT PROTOCOL LOGS
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                      <div>
                        <span className="text-slate-500 block">Alert Triggered</span>
                        <span className="font-mono">{selectedReport.alert_trigger_time ? new Date(selectedReport.alert_trigger_time).toLocaleTimeString() : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Notification Status</span>
                        <span className={`font-bold ${selectedReport.notification_status === 'Acknowledged' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {selectedReport.notification_status}
                        </span>
                      </div>
                      <div className="col-span-2 border-t border-slate-800/50 pt-1.5 mt-0.5">
                        <span className="text-slate-500 block">Notified ED Clinician</span>
                        <span className="font-semibold text-slate-200">{selectedReport.notified_provider_id || 'PENDING IMMEDIATE CALL'}</span>
                      </div>
                      {selectedReport.acknowledgment_time && (
                        <div>
                          <span className="text-slate-500 block">Acknowledged Time</span>
                          <span className="font-mono">{new Date(selectedReport.acknowledgment_time).toLocaleTimeString()}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 block">Verbal Readback Verified</span>
                        <span className="font-semibold">{selectedReport.read_back_verified ? '✅ Verified' : '❌ Pending Verification'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-slate-400 shadow-3xs">
              <FlaskConical size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Select any laboratory report from the logs to view its official high-contrast diagnostic sheet, reference range analytics, and communication sign-offs.</p>
            </div>
          )}

          {/* Guidelines info card */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-900 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5">
              <Info size={14} className="text-indigo-600" />
              LIS Panic Value Policy
            </h4>
            <p className="leading-relaxed text-indigo-950 text-[11px]">
              All tests triggering <strong>Critical High</strong> or <strong>Critical Low</strong> abnormal flags require immediate phone call notification to the ordering physician. The notification must include verbal <strong>read-back verification</strong> and should be logged within 15 minutes of result finalization.
            </p>
          </div>

        </div>

      </div>

      {/* FORM MODAL: CREATE NEW REPORT */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-1.5">
                  <FlaskConical className="text-indigo-600" size={18} />
                  Register Emergency Department Laboratory Report
                </h3>
                <p className="text-slate-500 text-[10px]">Conforms to 1.1.1.j Schema Definition</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              
              {/* SECTION A: PATIENT DEMOGRAPHICS & ED ADMISSION */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-indigo-600 tracking-wider uppercase block border-b pb-1">A. Patient Demographics &amp; Location</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Patient MRN*</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MRN-2026-9081"
                      value={newReport.patient_MRN}
                      onChange={(e) => setNewReport(prev => ({ ...prev, patient_MRN: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">first_ last_name*</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Almaz Kassa"
                      value={newReport.first_last_name}
                      onChange={(e) => setNewReport(prev => ({ ...prev, first_last_name: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Gender*</label>
                    <select
                      value={newReport.gender}
                      onChange={(e) => setNewReport(prev => ({ ...prev, gender: e.target.value as any }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700 bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">OPD or Ward name*</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ED Red Zone"
                      value={newReport.opd_or_ward_name}
                      onChange={(e) => setNewReport(prev => ({ ...prev, opd_or_ward_name: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">ed_location*</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Resuscitation Bay A"
                      value={newReport.ed_location}
                      onChange={(e) => setNewReport(prev => ({ ...prev, ed_location: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Hospital ID*</label>
                    <input
                      type="text"
                      required
                      value={newReport.hospital_id}
                      onChange={(e) => setNewReport(prev => ({ ...prev, hospital_id: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Triage Acuity (1-5)*</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={5}
                      placeholder="1 = Resuscitation, 5 = Non-urgent"
                      value={newReport.triage_acuity}
                      onChange={(e) => setNewReport(prev => ({ ...prev, triage_acuity: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Admit Timestamp*</label>
                    <input
                      type="datetime-local"
                      required
                      value={newReport.admit_timestamp}
                      onChange={(e) => setNewReport(prev => ({ ...prev, admit_timestamp: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: CLINICAL LAB ORDER & SPECIMEN */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-indigo-600 tracking-wider uppercase block border-b pb-1">B. Laboratory Order &amp; Specimen</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Ordering Provider ID*</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DR-YOHANNES"
                      value={newReport.ordering_provider_id}
                      onChange={(e) => setNewReport(prev => ({ ...prev, ordering_provider_id: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">order_priority*</label>
                    <select
                      value={newReport.order_priority}
                      onChange={(e) => setNewReport(prev => ({ ...prev, order_priority: e.target.value as any }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700 bg-white"
                    >
                      <option value="STAT">STAT (Emergency)</option>
                      <option value="ASAP">ASAP</option>
                      <option value="Timed">Timed</option>
                      <option value="Routine">Routine</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Collection Timestamp*</label>
                    <input
                      type="datetime-local"
                      required
                      value={newReport.collection_timestamp}
                      onChange={(e) => setNewReport(prev => ({ ...prev, collection_timestamp: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">panel_code* (BMP, CBC, ABG, other specific)</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        value={newReport.panel_code}
                        onChange={(e) => setNewReport(prev => ({ ...prev, panel_code: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700"
                      />
                    </div>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {PANEL_PRESETS.map(p => (
                        <button
                          type="button" key={p}
                          onClick={() => setNewReport(prev => ({ ...prev, panel_code: p }))}
                          className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${newReport.panel_code === p ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">specimen_type* (Serum, Urine, other specific)</label>
                    <input
                      type="text"
                      required
                      value={newReport.specimen_type}
                      onChange={(e) => setNewReport(prev => ({ ...prev, specimen_type: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700"
                    />
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {SPECIMEN_PRESETS.map(s => (
                        <button
                          type="button" key={s}
                          onClick={() => setNewReport(prev => ({ ...prev, specimen_type: s }))}
                          className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${newReport.specimen_type === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">specimen_status*</label>
                    <select
                      value={newReport.specimen_status}
                      onChange={(e) => setNewReport(prev => ({ ...prev, specimen_status: e.target.value as any }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700 bg-white"
                    >
                      {STATUS_PRESETS.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Receipt Timestamp</label>
                    <input
                      type="datetime-local"
                      value={newReport.receipt_timestamp || ''}
                      onChange={(e) => setNewReport(prev => ({ ...prev, receipt_timestamp: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-600"
                    />
                  </div>
                </div>

                {newReport.specimen_status === 'Rejected' && (
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Rejection Reason</label>
                    <textarea
                      value={newReport.rejection_reason || ''}
                      placeholder="Specify why specimen was rejected..."
                      onChange={(e) => setNewReport(prev => ({ ...prev, rejection_reason: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700 h-16"
                    />
                  </div>
                )}
              </div>

              {/* SECTION C: LABORATORY RESULTS & CODES */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-indigo-600 tracking-wider uppercase block border-b pb-1">C. Analyte Result &amp; Flag details</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Test Code (LOINC)*</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2823-3"
                      value={newReport.test_code}
                      onChange={(e) => setNewReport(prev => ({ ...prev, test_code: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Test Name (Analyte)*</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Potassium"
                      value={newReport.test_name}
                      onChange={(e) => setNewReport(prev => ({ ...prev, test_name: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">unit_of_measure</label>
                    <input
                      type="text"
                      placeholder="e.g. mmol/L"
                      value={newReport.unit_of_measure || ''}
                      onChange={(e) => setNewReport(prev => ({ ...prev, unit_of_measure: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">numeric_value</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Quantitative value"
                      value={newReport.numeric_value === undefined ? '' : newReport.numeric_value}
                      onChange={(e) => setNewReport(prev => ({ ...prev, numeric_value: e.target.value === '' ? undefined : parseFloat(e.target.value) }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">text_value</label>
                    <input
                      type="text"
                      placeholder="Qualitative, e.g. Positive"
                      value={newReport.text_value || ''}
                      onChange={(e) => setNewReport(prev => ({ ...prev, text_value: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">abnormal_flag*</label>
                    <select
                      value={newReport.abnormal_flag}
                      onChange={(e) => setNewReport(prev => ({ ...prev, abnormal_flag: e.target.value as any }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700 bg-white"
                    >
                      {ABNORMAL_FLAGS.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Reference Range Low</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newReport.reference_range_low === undefined ? '' : newReport.reference_range_low}
                      onChange={(e) => setNewReport(prev => ({ ...prev, reference_range_low: e.target.value === '' ? undefined : parseFloat(e.target.value) }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Reference Range High</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newReport.reference_range_high === undefined ? '' : newReport.reference_range_high}
                      onChange={(e) => setNewReport(prev => ({ ...prev, reference_range_high: e.target.value === '' ? undefined : parseFloat(e.target.value) }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Result Timestamp*</label>
                    <input
                      type="datetime-local"
                      required
                      value={newReport.result_timestamp}
                      onChange={(e) => setNewReport(prev => ({ ...prev, result_timestamp: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">technician_name*</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tech Hanna Sileshi"
                      value={newReport.technician_name}
                      onChange={(e) => setNewReport(prev => ({ ...prev, technician_name: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION D: CRITICAL alert protocol */}
              {newReport.abnormal_flag.includes('Critical') && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                  <span className="text-[10px] font-black text-red-700 tracking-wider uppercase block">
                    ⚡ Panic Critical Protocol Fields
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Alert Trigger Time</label>
                      <input
                        type="datetime-local"
                        value={newReport.alert_trigger_time || ''}
                        onChange={(e) => setNewReport(prev => ({ ...prev, alert_trigger_time: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">notification_status</label>
                      <select
                        value={newReport.notification_status}
                        onChange={(e) => setNewReport(prev => ({ ...prev, notification_status: e.target.value as any }))}
                        className="w-full px-3 py-1.5 text-xs border rounded-xl text-slate-700 bg-white"
                      >
                        <option value="Pending Acknowledgment">Pending Acknowledgment</option>
                        <option value="Acknowledged">Acknowledged</option>
                        <option value="Escalated">Escalated</option>
                        <option value="N/A">N/A</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
                >
                  Save Lab Report
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* FORM MODAL: ACKNOWLEDGE / SIGN PANIC VALUE */}
      {showAcknowledgeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center gap-2 border-b pb-3 text-red-600">
              <ShieldCheck size={20} />
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                Verbal Read-Back Sign-off
              </h4>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              You are logging critical telephonic notification of lab panic values for patient <strong>{showAcknowledgeModal.first_last_name}</strong> ({showAcknowledgeModal.patient_MRN}).
            </p>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-700">
              <div><strong>Analyte:</strong> {showAcknowledgeModal.test_name}</div>
              <div><strong>Value:</strong> <span className="text-red-600 font-bold">{showAcknowledgeModal.numeric_value} {showAcknowledgeModal.unit_of_measure}</span> ({showAcknowledgeModal.abnormal_flag})</div>
              <div><strong>ED Ward Location:</strong> {showAcknowledgeModal.ed_location}</div>
            </div>

            <div className="space-y-3.5 pt-2">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Notified Provider ID (Physician)*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DR-BEKELE"
                  value={notifiedProvider}
                  onChange={(e) => setNotifiedProvider(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl text-slate-700"
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="verbal-readback"
                  checked={readBackVerified}
                  onChange={(e) => setReadBackVerified(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="verbal-readback" className="text-xs text-slate-600 leading-normal cursor-pointer select-none">
                  <strong>Verbal Read-Back Verified</strong>: I confirm that the receiving clinician read back the patient name, MRN, and laboratory panic results verbatim to ensure transmission integrity.
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button 
                type="button" 
                onClick={() => {
                  setShowAcknowledgeModal(null);
                  setNotifiedProvider('');
                  setReadBackVerified(false);
                }} 
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleAcknowledgeCritical}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm"
              >
                Verify &amp; Sign Protocol
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
