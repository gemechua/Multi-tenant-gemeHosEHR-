import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  FileText, AlertTriangle, CheckCircle2, Clock, Plus, Search, Filter, 
  Trash2, RefreshCw, ShieldCheck, Download, Eye, Info, X, Calendar, User, Activity, Flame
} from 'lucide-react';

// Unified 1.1.1.k Schema Interface
export interface EDRadiologyReportData {
  id?: string;
  hospital_id: string; // text, required
  patient_MRN: string; // text, required
  opd_or_ward_name: string; // text, required
  modality: 'CT' | 'XR' | 'US' | 'MR' | 'other specific' | string; // text, required
  study_description: string; // text, required
  urgency_level: 'STAT' | 'Urgent' | 'Routine'; // text, required
  report_status: 'Preliminary' | 'Final' | 'Corrected' | 'Addendum'; // text, required
  clinical_indication?: string; // text
  findings: string; // text, required
  impression: string; // text, required
  critical_finding: boolean; // boolean
  critical_notified_to?: string; // text
  critical_notified_at?: string; // date-time
  ordering_physician_id: string; // text, required
  radiologist_id: string; // text, required
  order_time: string; // date-time, required
  acquisition_time: string; // date-time, required
  preliminary_time?: string; // date-time
  final_time?: string; // date-time
  created_at?: string;
  updated_at?: string;
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

export default function EDRadiologyResultsReport() {
  const [reports, setReports] = useState<EDRadiologyReportData[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter & View States
  const [searchQuery, setSearchQuery] = useState('');
  const [modalityFilter, setModalityFilter] = useState<string>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [criticalFilter, setCriticalFilter] = useState<string>('ALL');
  const [selectedReport, setSelectedReport] = useState<EDRadiologyReportData | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCriticalNotifyModal, setShowCriticalNotifyModal] = useState<EDRadiologyReportData | null>(null);

  // Critical Notification Form State
  const [notifiedTo, setNotifiedTo] = useState('');
  const [notificationTime, setNotificationTime] = useState(new Date().toISOString().substring(0, 16));

  // Custom modality input
  const [customModality, setCustomModality] = useState('');

  // New Record Form State
  const initialFormState: Omit<EDRadiologyReportData, 'id'> = {
    hospital_id: 'HOSP-77012',
    patient_MRN: '',
    opd_or_ward_name: 'Emergency Ward A',
    modality: 'CT',
    study_description: 'CT Head w/o Contrast',
    urgency_level: 'STAT',
    report_status: 'Preliminary',
    clinical_indication: 'Acute onset left-sided weakness and aphasia.',
    findings: 'No acute intracranial hemorrhage or large territorial infarction identified on current non-contrast head CT scan. Mild chronic microvascular ischemic changes.',
    impression: 'No acute intracranial pathology. Consider CT Angiogram / Perfusion if symptoms persist.',
    critical_finding: false,
    critical_notified_to: '',
    critical_notified_at: '',
    ordering_physician_id: 'DR-YOHANNES',
    radiologist_id: 'RAD-SOLOMON',
    order_time: new Date().toISOString().substring(0, 16),
    acquisition_time: new Date(Date.now() - 10 * 60000).toISOString().substring(0, 16),
    preliminary_time: new Date().toISOString().substring(0, 16),
    final_time: ''
  };

  const [newReport, setNewReport] = useState<Omit<EDRadiologyReportData, 'id'>>(initialFormState);

  // Sync with Firestore
  useEffect(() => {
    setLoading(true);
    const collectionPath = 'form_1_1_1_k';
    const unsub = onSnapshot(collection(db, collectionPath), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EDRadiologyReportData));
      setReports(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Seeding high-fidelity radiology logs
  const seedDemoReports = async () => {
    const collectionPath = 'form_1_1_1_k';
    try {
      const demoData: Omit<EDRadiologyReportData, 'id'>[] = [
        {
          hospital_id: 'HOSP-77012',
          patient_MRN: 'MRN-2026-9081',
          opd_or_ward_name: 'ED Trauma Bay 2',
          modality: 'CT',
          study_description: 'CT Head w/o Contrast',
          urgency_level: 'STAT',
          report_status: 'Preliminary',
          clinical_indication: 'Trauma: Fall from height, GCS 11. Clear fluid rhinorrhea.',
          findings: 'Extensive acute subdural hematoma along the right frontoparietal convexity measuring up to 1.2 cm in maximal thickness. Associated 8mm midline shift to the left. Mild compression of the right lateral ventricle and partial effacement of the basilar cisterns. Acute fractures of the squamous portion of the right temporal bone.',
          impression: 'Acute right frontoparietal subdural hematoma with significant midline shift and early signs of mass effect. Recommend urgent neurosurgical evaluation.',
          critical_finding: true,
          critical_notified_to: 'DR-YOHANNES (ED Trauma Team)',
          critical_notified_at: new Date(Date.now() - 15 * 60000).toISOString(),
          ordering_physician_id: 'DR-YOHANNES',
          radiologist_id: 'RAD-SOLOMON',
          order_time: new Date(Date.now() - 45 * 60000).toISOString(),
          acquisition_time: new Date(Date.now() - 35 * 60000).toISOString(),
          preliminary_time: new Date(Date.now() - 18 * 60000).toISOString(),
          final_time: '',
          created_at: new Date().toISOString()
        },
        {
          hospital_id: 'HOSP-77012',
          patient_MRN: 'MRN-2026-3392',
          opd_or_ward_name: 'Medical Ward B',
          modality: 'XR',
          study_description: 'Chest PA & Lateral',
          urgency_level: 'Urgent',
          report_status: 'Final',
          clinical_indication: 'Shortness of breath, productive cough, fever 39C.',
          findings: 'Patchy alveolar airspace consolidation seen in the left lower lung zone, consistent with acute lobar pneumonia. Heart size is within normal limits. Trachea is midline. No pleural effusion or pneumothorax identified.',
          impression: 'Left lower lobe pneumonia. Correlate clinically with inflammatory markers.',
          critical_finding: false,
          ordering_physician_id: 'DR-ASTATKE',
          radiologist_id: 'RAD-FELEKE',
          order_time: new Date(Date.now() - 120 * 60000).toISOString(),
          acquisition_time: new Date(Date.now() - 100 * 60000).toISOString(),
          preliminary_time: new Date(Date.now() - 80 * 60000).toISOString(),
          final_time: new Date(Date.now() - 30 * 60000).toISOString(),
          created_at: new Date().toISOString()
        },
        {
          hospital_id: 'HOSP-77012',
          patient_MRN: 'MRN-2026-5561',
          opd_or_ward_name: 'ED Resuscitation Room',
          modality: 'US',
          study_description: 'US FAST (Abdomen Trauma)',
          urgency_level: 'STAT',
          report_status: 'Preliminary',
          clinical_indication: 'Blunt force abdominal trauma from motor vehicle collision. Tachycardic.',
          findings: 'Focused ultrasound examination shows clear, anechoic free fluid in the splenorenal recess (Morison\'s pouch is negative). No fluid seen in pericardial space or pelvic views. Spleen is structurally intact but surrounded by fluid collection.',
          impression: 'Positive FAST exam with free intraperitoneal fluid in the left upper quadrant. Highly suspicious for splenic injury or hematoma.',
          critical_finding: true,
          critical_notified_to: 'DR-BEKELE (Chief Trauma Surgeon)',
          critical_notified_at: new Date(Date.now() - 8 * 60000).toISOString(),
          ordering_physician_id: 'DR-BEKELE',
          radiologist_id: 'RAD-SOLOMON',
          order_time: new Date(Date.now() - 25 * 60000).toISOString(),
          acquisition_time: new Date(Date.now() - 18 * 60000).toISOString(),
          preliminary_time: new Date(Date.now() - 10 * 60000).toISOString(),
          final_time: '',
          created_at: new Date().toISOString()
        },
        {
          hospital_id: 'HOSP-77012',
          patient_MRN: 'MRN-2026-0044',
          opd_or_ward_name: 'OPD Neurology Clinic',
          modality: 'MR',
          study_description: 'MRI Spine Cervical w/o Contrast',
          urgency_level: 'Routine',
          report_status: 'Final',
          clinical_indication: 'Chronic neck pain with radiculopathy to left arm.',
          findings: 'C5-C6 level shows a moderate left paracentral disk protrusion causing mild indentation of the ventral cervical cord and moderate narrowing of the left neural foramina. No severe cord compression or abnormal cord signal.',
          impression: 'C5-C6 disc herniation causing foraminal stenosis. No cord signal changes.',
          critical_finding: false,
          ordering_physician_id: 'DR-MULUGETA',
          radiologist_id: 'RAD-FELEKE',
          order_time: new Date(Date.now() - 480 * 60000).toISOString(),
          acquisition_time: new Date(Date.now() - 360 * 60000).toISOString(),
          preliminary_time: '',
          final_time: new Date(Date.now() - 240 * 60000).toISOString(),
          created_at: new Date().toISOString()
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
    if (!newReport.hospital_id || !newReport.patient_MRN || !newReport.opd_or_ward_name || !newReport.findings || !newReport.impression) {
      alert("Please fill in all the required fields.");
      return;
    }

    const collectionPath = 'form_1_1_1_k';
    try {
      const payload: Omit<EDRadiologyReportData, 'id'> = {
        ...newReport,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await addDoc(collection(db, collectionPath), payload);
      setShowAddModal(false);
      setNewReport(initialFormState);
      setCustomModality('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, collectionPath);
    }
  };

  // Delete a report
  const handleDeleteReport = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this emergency radiology report from PACS registry?")) return;
    const collectionPath = 'form_1_1_1_k';
    try {
      await deleteDoc(doc(db, collectionPath, id));
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, collectionPath);
    }
  };

  // Log Critical Finding verbal notification
  const handleNotifyCritical = async () => {
    if (!showCriticalNotifyModal || !showCriticalNotifyModal.id) return;
    if (!notifiedTo) {
      alert("Please enter the name of the ED clinician notified.");
      return;
    }

    const collectionPath = 'form_1_1_1_k';
    try {
      const docRef = doc(db, collectionPath, showCriticalNotifyModal.id);
      await updateDoc(docRef, {
        critical_notified_to: notifiedTo,
        critical_notified_at: new Date(notificationTime).toISOString(),
        updated_at: new Date().toISOString()
      });

      // Update selected view state if it is the current one
      if (selectedReport?.id === showCriticalNotifyModal.id) {
        setSelectedReport(prev => prev ? {
          ...prev,
          critical_notified_to: notifiedTo,
          critical_notified_at: new Date(notificationTime).toISOString()
        } : null);
      }

      setShowCriticalNotifyModal(null);
      setNotifiedTo('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, collectionPath);
    }
  };

  // Filtered reports
  const getFilteredReports = () => {
    return reports.filter(r => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (r.patient_MRN && r.patient_MRN.toLowerCase().includes(searchLower)) ||
        (r.hospital_id && r.hospital_id.toLowerCase().includes(searchLower)) ||
        (r.opd_or_ward_name && r.opd_or_ward_name.toLowerCase().includes(searchLower)) ||
        (r.study_description && r.study_description.toLowerCase().includes(searchLower)) ||
        (r.clinical_indication && r.clinical_indication.toLowerCase().includes(searchLower)) ||
        (r.findings && r.findings.toLowerCase().includes(searchLower)) ||
        (r.impression && r.impression.toLowerCase().includes(searchLower));

      const matchesModality = modalityFilter === 'ALL' || r.modality === modalityFilter;
      const matchesUrgency = urgencyFilter === 'ALL' || r.urgency_level === urgencyFilter;
      
      let matchesCritical = true;
      if (criticalFilter === 'CRITICAL') {
        matchesCritical = r.critical_finding === true;
      } else if (criticalFilter === 'NORMAL') {
        matchesCritical = !r.critical_finding;
      } else if (criticalFilter === 'PENDING_NOTIFY') {
        matchesCritical = r.critical_finding && !r.critical_notified_to;
      }

      return matchesSearch && matchesModality && matchesUrgency && matchesCritical;
    });
  };

  // Turnaround metrics helper
  const getTurnaroundTimeMinutes = (order: string, pre: string | undefined) => {
    if (!pre) return null;
    const diffMs = new Date(pre).getTime() - new Date(order).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  // Calculators
  const totalReports = reports.length;
  const statReports = reports.filter(r => r.urgency_level === 'STAT').length;
  const criticalFindings = reports.filter(r => r.critical_finding).length;
  const pendingNotification = reports.filter(r => r.critical_finding && !r.critical_notified_to).length;

  // Export to CSV
  const exportToCSV = () => {
    const filtered = getFilteredReports();
    if (filtered.length === 0) return;
    
    const headers = [
      'hospital_id', 'patient_MRN', 'opd_or_ward_name', 'modality',
      'study_description', 'urgency_level', 'report_status', 'clinical_indication',
      'findings', 'impression', 'critical_finding', 'critical_notified_to',
      'critical_notified_at', 'ordering_physician_id', 'radiologist_id',
      'order_time', 'acquisition_time', 'preliminary_time', 'final_time'
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
    a.setAttribute('download', `ed_radiology_reports_1.1.1.k_${new Date().toISOString().slice(0, 10)}.csv`);
    a.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6" id="ed-radiology-dashboard">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            Form 1.1.1.k Schema Implementation
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-1">
            <FileText className="text-indigo-600" size={26} />
            Emergency Radiology Results Report
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 max-w-2xl">
            Integrated Radiology Information System (RIS/PACS) for monitoring imaging findings, modality performance, critical findings, and statutory escalation turnaround times.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {reports.length === 0 && (
            <button
              onClick={seedDemoReports}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={14} className="animate-spin-slow" /> Seed Demo Reports
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} /> Log Radiology Study
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3.5 shadow-3xs hover:shadow-2xs transition-shadow">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Imaging Orders</p>
            <p className="text-xl font-extrabold text-slate-900">{totalReports}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3.5 shadow-3xs hover:shadow-2xs transition-shadow">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Flame size={20} className="animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">STAT Turnarounds</p>
            <p className="text-xl font-extrabold text-slate-900">{statReports}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3.5 shadow-3xs hover:shadow-2xs transition-shadow">
          <div className="p-3 rounded-xl bg-red-50 text-red-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Critical Findings</p>
            <p className="text-xl font-extrabold text-slate-900">{criticalFindings}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3.5 shadow-3xs hover:shadow-2xs transition-shadow">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pending Notifications</p>
            <p className="text-xl font-extrabold text-slate-900 text-purple-700">{pendingNotification}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-3xs">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search MRN, study description, findings or diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          {/* Modality Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
            <Filter size={12} className="text-slate-400" />
            <select
              value={modalityFilter}
              onChange={(e) => setModalityFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-[11px] font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Modality: All</option>
              <option value="CT">CT Scan</option>
              <option value="XR">X-Ray</option>
              <option value="US">Ultrasound</option>
              <option value="MR">MRI</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
            <Clock size={12} className="text-slate-400" />
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-[11px] font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Urgency: All</option>
              <option value="STAT">STAT</option>
              <option value="Urgent">Urgent</option>
              <option value="Routine">Routine</option>
            </select>
          </div>

          {/* Critical Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
            <AlertTriangle size={12} className="text-slate-400" />
            <select
              value={criticalFilter}
              onChange={(e) => setCriticalFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-[11px] font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Criticality: All</option>
              <option value="CRITICAL">Critical Findings</option>
              <option value="PENDING_NOTIFY">Critical (Unnotified)</option>
              <option value="NORMAL">Non-Critical Only</option>
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
        
        {/* LEFT/MID: PACS/RIS Reports Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block animate-pulse"></span>
              Emergency PACS Radiology Registry ({getFilteredReports().length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="p-3">Patient MRN / Hosp</th>
                  <th className="p-3">Modality & Study</th>
                  <th className="p-3">Urgency & Status</th>
                  <th className="p-3">Clinical Findings Summary</th>
                  <th className="p-3 text-center">Turnaround (ED)</th>
                  <th className="p-3">Critical Contact</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <RefreshCw size={24} className="animate-spin text-indigo-500" />
                        <span className="text-xs font-semibold">Fetching PACS/RIS Imaging Database...</span>
                      </div>
                    </td>
                  </tr>
                ) : getFilteredReports().length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      No matching emergency radiology reports found. Log a new study or seed the test data above.
                    </td>
                  </tr>
                ) : (
                  getFilteredReports().map((r) => {
                    const isCritical = r.critical_finding;
                    const isNotified = !!r.critical_notified_to;
                    const tat = getTurnaroundTimeMinutes(r.order_time, r.preliminary_time);

                    return (
                      <tr 
                        key={r.id} 
                        onClick={() => setSelectedReport(r)}
                        className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${selectedReport?.id === r.id ? 'bg-indigo-50/30' : ''}`}
                      >
                        {/* Patient & Hospital */}
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{r.patient_MRN}</div>
                          <div className="text-[10px] text-slate-500 font-medium">Hosp: {r.hospital_id}</div>
                        </td>

                        {/* Modality & Study */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                              r.modality === 'CT' ? 'bg-red-100 text-red-800' :
                              r.modality === 'XR' ? 'bg-blue-100 text-blue-800' :
                              r.modality === 'US' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {r.modality}
                            </span>
                            <span className="font-bold text-slate-800 text-[11px] truncate max-w-[130px]" title={r.study_description}>
                              {r.study_description}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium truncate max-w-[180px] mt-0.5">Ward: {r.opd_or_ward_name}</div>
                        </td>

                        {/* Urgency & Status */}
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                              r.urgency_level === 'STAT' ? 'bg-red-100 text-red-800' :
                              r.urgency_level === 'Urgent' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {r.urgency_level}
                            </span>
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded">
                              {r.report_status}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                            {new Date(r.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Findings Summary */}
                        <td className="p-3">
                          <div className="text-slate-800 text-[11px] font-medium line-clamp-2 max-w-[200px]" title={r.impression}>
                            {r.impression}
                          </div>
                        </td>

                        {/* Turnaround Time */}
                        <td className="p-3 text-center">
                          {tat !== null ? (
                            <div>
                              <span className={`font-bold text-[12px] ${tat <= 30 ? 'text-emerald-600' : tat <= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                {tat}m
                              </span>
                              <p className="text-[9px] text-slate-400">Order → Prelim</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No Prelim Read</span>
                          )}
                        </td>

                        {/* Critical Contact */}
                        <td className="p-3">
                          {isCritical ? (
                            <div className="space-y-1">
                              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md flex items-center gap-1 w-fit ${
                                isNotified ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200 animate-pulse'
                              }`}>
                                <AlertTriangle size={10} />
                                {isNotified ? 'Notified' : 'CRITICAL ALERT'}
                              </span>
                              {isNotified ? (
                                <div className="text-[9px] text-slate-500 leading-tight truncate max-w-[120px]" title={r.critical_notified_to}>
                                  To: {r.critical_notified_to}
                                </div>
                              ) : (
                                <span className="text-[9px] text-red-600 font-extrabold block">Call required!</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-semibold italic">N/A</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedReport(r)}
                              title="Open Detailed PACS Report"
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50"
                            >
                              <Eye size={14} />
                            </button>

                            {isCritical && !isNotified && (
                              <button
                                onClick={() => setShowCriticalNotifyModal(r)}
                                title="Log Critical Notification"
                                className="px-2 py-0.5 bg-red-100 text-red-800 hover:bg-red-200 text-[9px] font-black rounded-md flex items-center gap-0.5"
                              >
                                <ShieldCheck size={11} /> Call
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteReport(r.id!)}
                              title="Delete Report"
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

        {/* RIGHT: Detailed PACS Report Preview Panel */}
        <div className="space-y-4">
          
          {selectedReport ? (
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden" id="pacs-report-viewer">
              {/* Clinical Report Header Decoration */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500"></div>
              
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
                <div>
                  <h4 className="text-[10px] font-black tracking-widest text-rose-400 uppercase">PACS RADIOLOGY SIGN-OFF SHEET</h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Hospital ID: {selectedReport.hospital_id}</p>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Patient Core Identifiers */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-500 block">Patient MRN</span>
                  <span className="font-mono font-black text-slate-200">{selectedReport.patient_MRN}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-500 block">OPD / Ward Name</span>
                  <span className="font-mono font-bold text-slate-200">{selectedReport.opd_or_ward_name}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-500 block">Modality / Type</span>
                  <span className="font-semibold text-slate-300">{selectedReport.modality} Study</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-500 block">Urgency Priority</span>
                  <span className={`font-bold ${selectedReport.urgency_level === 'STAT' ? 'text-red-400' : 'text-slate-300'}`}>
                    {selectedReport.urgency_level}
                  </span>
                </div>
              </div>

              {/* Study Info & Indications */}
              <div className="space-y-3 text-[11px] mb-4">
                <div>
                  <span className="text-slate-500 font-bold block mb-0.5">Exam Description</span>
                  <span className="text-slate-200 font-black text-xs block">{selectedReport.study_description}</span>
                </div>
                {selectedReport.clinical_indication && (
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/40 text-slate-300">
                    <span className="font-black block text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Clinical Indication:</span>
                    {selectedReport.clinical_indication}
                  </div>
                )}
              </div>

              {/* Detailed Observations findings & Impression */}
              <div className="space-y-3.5 mb-4 border-t border-b border-slate-800 py-3.5">
                <div>
                  <span className="text-rose-400 font-black text-[10px] tracking-wider block mb-1">RAD FINDINGS</span>
                  <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap bg-slate-950 p-3 rounded-xl border border-slate-850">
                    {selectedReport.findings}
                  </p>
                </div>

                <div>
                  <span className="text-emerald-400 font-black text-[10px] tracking-wider block mb-1">RAD IMPRESSION (DIAGNOSTIC CONCLUSION)</span>
                  <p className="text-slate-100 text-xs font-bold leading-relaxed whitespace-pre-wrap bg-slate-950 p-3 rounded-xl border border-emerald-950">
                    {selectedReport.impression}
                  </p>
                </div>
              </div>

              {/* Turnaround-Time Metrics */}
              <div className="space-y-1.5 text-[11px] mb-4">
                <div className="flex justify-between text-slate-400">
                  <span>Order Placed</span>
                  <span className="font-mono text-slate-300">{new Date(selectedReport.order_time).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Images Acquired</span>
                  <span className="font-mono text-slate-300">{new Date(selectedReport.acquisition_time).toLocaleString()}</span>
                </div>
                {selectedReport.preliminary_time && (
                  <div className="flex justify-between text-slate-400">
                    <span>Preliminary Read Sign-off</span>
                    <span className="font-mono text-slate-300">{new Date(selectedReport.preliminary_time).toLocaleString()}</span>
                  </div>
                )}
                {selectedReport.final_time && (
                  <div className="flex justify-between text-slate-400">
                    <span>Final Report Sign-off</span>
                    <span className="font-mono text-slate-300">{new Date(selectedReport.final_time).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Radiologist and physician identities */}
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-3 border-t border-slate-800 text-slate-400">
                <div>
                  <span className="block text-slate-500">Ordering Physician</span>
                  <span className="font-bold text-slate-300">{selectedReport.ordering_physician_id}</span>
                </div>
                <div>
                  <span className="block text-slate-500">Interpreting Radiologist</span>
                  <span className="font-bold text-slate-300">{selectedReport.radiologist_id}</span>
                </div>
              </div>

              {/* Critical Findings Escalation Contact log */}
              {selectedReport.critical_finding && (
                <div className="bg-red-950/40 border border-red-900/40 p-3 rounded-xl space-y-2 mt-4">
                  <span className="text-[9px] font-black uppercase text-red-400 tracking-wider flex items-center gap-1">
                    <AlertTriangle size={11} className="text-red-400" /> CRITICAL ESCALATION LOGS
                  </span>
                  
                  {selectedReport.critical_notified_to ? (
                    <div className="grid grid-cols-1 gap-1.5 text-[10px] text-slate-300">
                      <div>
                        <span className="text-slate-500">ED Provider Notified:</span>
                        <p className="font-bold text-slate-200">{selectedReport.critical_notified_to}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Communication Timestamp:</span>
                        <p className="font-mono text-slate-200">{new Date(selectedReport.critical_notified_at!).toLocaleString()}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] text-red-300">
                        This report contains life-threatening or urgent findings. Radiologist must verbally notify the clinical team immediately.
                      </p>
                      <button
                        onClick={() => setShowCriticalNotifyModal(selectedReport)}
                        className="w-full bg-red-800 hover:bg-red-700 text-white font-black py-1.5 px-3 rounded-lg text-[10px] transition-all flex items-center justify-center gap-1"
                      >
                        <ShieldCheck size={12} /> Log Communication
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-slate-400 shadow-3xs">
              <FileText size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Select any radiology record from the list to view anatomical findings, diagnostic impression, turnaround-times, and verbal communication records.</p>
            </div>
          )}

          {/* Turnaround metrics guidelines card */}
          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5">
              <Info size={14} className="text-amber-600" />
              ED Radiology Turnaround Standards
            </h4>
            <p className="leading-relaxed text-amber-950 text-[11px]">
              For all <strong>STAT</strong> modality orders, the preliminary report turnaround time (Order placed → Preliminary read) should not exceed 30 minutes. Critical findings must be communicated verbally to the ordering physician within 15 minutes of completion.
            </p>
          </div>

        </div>

      </div>

      {/* MODAL: LOG NEW IMAGING WORKUP */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-1.5">
                  <FileText className="text-indigo-600" size={18} />
                  Log Emergency Radiology Workup / Report
                </h3>
                <p className="text-slate-500 text-[10px]">Conforms to 1.1.1.k PACS/RIS Schema Definition</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hospital ID */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
                    Hospital ID*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., HOSP-77012"
                    value={newReport.hospital_id}
                    onChange={(e) => setNewReport(prev => ({ ...prev, hospital_id: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Patient MRN */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
                    Patient MRN*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., MRN-2026-9081"
                    value={newReport.patient_MRN}
                    onChange={(e) => setNewReport(prev => ({ ...prev, patient_MRN: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* OPD or Ward name */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
                    OPD or Ward name*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Emergency Ward A"
                    value={newReport.opd_or_ward_name}
                    onChange={(e) => setNewReport(prev => ({ ...prev, opd_or_ward_name: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Modality */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
                      Imaging Modality*
                    </label>
                    <select
                      value={newReport.modality === 'CT' || newReport.modality === 'XR' || newReport.modality === 'US' || newReport.modality === 'MR' ? newReport.modality : 'other specific'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewReport(prev => ({ ...prev, modality: val === 'other specific' ? customModality || 'other specific' : val }));
                      }}
                      className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    >
                      <option value="CT">CT (Computed Tomography)</option>
                      <option value="XR">XR (Plain Radiography/X-ray)</option>
                      <option value="US">US (Ultrasound / FAST)</option>
                      <option value="MR">MR (Magnetic Resonance Imaging)</option>
                      <option value="other specific">Other Specific</option>
                    </select>
                  </div>

                  {(newReport.modality === 'other specific' || (!['CT', 'XR', 'US', 'MR'].includes(newReport.modality) && newReport.modality)) && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                        Specify Other Modality*
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., PET, Mammography, etc."
                        value={customModality}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomModality(val);
                          setNewReport(prev => ({ ...prev, modality: val }));
                        }}
                        className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* Study Description */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
                    Exam / Study Name*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., CT Head w/o Contrast"
                    value={newReport.study_description}
                    onChange={(e) => setNewReport(prev => ({ ...prev, study_description: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Urgency Level */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
                    Order Urgency Priority*
                  </label>
                  <select
                    value={newReport.urgency_level}
                    onChange={(e) => setNewReport(prev => ({ ...prev, urgency_level: e.target.value as any }))}
                    className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="STAT">STAT</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Routine">Routine</option>
                  </select>
                </div>

                {/* Report Status */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
                    Lifecycle Report Status*
                  </label>
                  <select
                    value={newReport.report_status}
                    onChange={(e) => setNewReport(prev => ({ ...prev, report_status: e.target.value as any }))}
                    className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Preliminary">Preliminary</option>
                    <option value="Final">Final</option>
                    <option value="Corrected">Corrected</option>
                    <option value="Addendum">Addendum</option>
                  </select>
                </div>

                {/* Ordering Physician */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
                    Ordering Physician ID*
                  </label>
                  <input
                    type="text"
                    required
                    value={newReport.ordering_physician_id}
                    onChange={(e) => setNewReport(prev => ({ ...prev, ordering_physician_id: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Radiologist ID */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
                    Interpreting Radiologist ID*
                  </label>
                  <input
                    type="text"
                    required
                    value={newReport.radiologist_id}
                    onChange={(e) => setNewReport(prev => ({ ...prev, radiologist_id: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Clinical Indication */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
                  Symptoms & Clinical Indication
                </label>
                <textarea
                  rows={2}
                  value={newReport.clinical_indication}
                  onChange={(e) => setNewReport(prev => ({ ...prev, clinical_indication: e.target.value }))}
                  className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                ></textarea>
              </div>

              {/* Detailed Findings */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
                  Radiology findings (Anatomical Observations)*
                </label>
                <textarea
                  rows={3}
                  required
                  value={newReport.findings}
                  onChange={(e) => setNewReport(prev => ({ ...prev, findings: e.target.value }))}
                  className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
                ></textarea>
              </div>

              {/* Diagnostic Conclusion / Impression */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
                  Radiology Impression (Diagnostic Conclusion)*
                </label>
                <textarea
                  rows={2}
                  required
                  value={newReport.impression}
                  onChange={(e) => setNewReport(prev => ({ ...prev, impression: e.target.value }))}
                  className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
                ></textarea>
              </div>

              {/* Critical Finding Toggle */}
              <div className="bg-slate-50 p-3 rounded-xl border flex items-center justify-between">
                <div>
                  <label className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-rose-500" />
                    Flag as Critical / Panic Value finding?
                  </label>
                  <p className="text-[10px] text-slate-500">Requires immediate phone notification to clinical care team.</p>
                </div>
                <input
                  type="checkbox"
                  checked={newReport.critical_finding}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setNewReport(prev => ({ 
                      ...prev, 
                      critical_finding: isChecked,
                      critical_notified_to: isChecked ? prev.critical_notified_to || 'DR-YOHANNES' : '',
                      critical_notified_at: isChecked ? prev.critical_notified_at || new Date().toISOString().substring(0, 16) : ''
                    }));
                  }}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 focus:outline-none cursor-pointer"
                />
              </div>

              {/* Critical Notification Live Communication Logging Fields */}
              {newReport.critical_finding && (
                <div className="bg-rose-50/50 border border-rose-200/60 p-4 rounded-xl space-y-3.5 animate-fadeIn">
                  <div className="flex items-center gap-1.5 text-rose-700 font-extrabold text-xs">
                    <AlertTriangle size={14} />
                    <span>Immediate Clinical Communication Logging</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    To comply with patient safety policies, please log the immediate verbal/telephone notification of this critical finding to the ED team.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-black text-rose-950 uppercase mb-1">
                        Notified Physician / Nurse ID*
                      </label>
                      <input
                        type="text"
                        required={newReport.critical_finding}
                        placeholder="e.g., DR-YOHANNES (ED Staff)"
                        value={newReport.critical_notified_to}
                        onChange={(e) => setNewReport(prev => ({ ...prev, critical_notified_to: e.target.value }))}
                        className="w-full text-xs px-3 py-2 border border-rose-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-rose-950 uppercase mb-1">
                        Verbal Notification Time*
                      </label>
                      <input
                        type="datetime-local"
                        required={newReport.critical_finding}
                        value={newReport.critical_notified_at}
                        onChange={(e) => setNewReport(prev => ({ ...prev, critical_notified_at: e.target.value }))}
                        className="w-full text-xs px-3 py-2 border border-rose-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-3 rounded-xl border border-dashed">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                    Order Time*
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newReport.order_time}
                    onChange={(e) => setNewReport(prev => ({ ...prev, order_time: e.target.value }))}
                    className="w-full text-xs px-2 py-1.5 border rounded-lg focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                    Acquisition Time*
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newReport.acquisition_time}
                    onChange={(e) => setNewReport(prev => ({ ...prev, acquisition_time: e.target.value }))}
                    className="w-full text-xs px-2 py-1.5 border rounded-lg focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                    Preliminary Sign-off Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newReport.preliminary_time}
                    onChange={(e) => setNewReport(prev => ({ ...prev, preliminary_time: e.target.value }))}
                    className="w-full text-xs px-2 py-1.5 border rounded-lg focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Save PACS Report
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: LOG CRITICAL COMMUNICATION CALL */}
      {showCriticalNotifyModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5">
            
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <AlertTriangle className="text-red-500" size={16} />
                Log Critical Findings Verbal Notification
              </h3>
              <button 
                onClick={() => setShowCriticalNotifyModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-red-50 text-red-900 text-xs p-3 rounded-xl border border-red-200">
                <span className="font-black uppercase block text-[10px] tracking-wide text-red-700 mb-0.5">PACS IMPRESSION</span>
                {showCriticalNotifyModal.impression}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wide mb-1">
                  Name / ID of Notified ED Physician*
                </label>
                <input
                  type="text"
                  placeholder="e.g., DR-YOHANNES (Trauma Staff)"
                  value={notifiedTo}
                  onChange={(e) => setNotifiedTo(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wide mb-1">
                  Exact Communication Time*
                </label>
                <input
                  type="datetime-local"
                  value={notificationTime}
                  onChange={(e) => setNotificationTime(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCriticalNotifyModal(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleNotifyCritical}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-colors cursor-pointer"
                >
                  Log Call Record
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
