import React, { useState, useEffect } from 'react';
import { 
  collection, getDocs, addDoc, query, orderBy, limit, doc, updateDoc, serverTimestamp, deleteDoc, where 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Pill, Filter, Search, Plus, CheckCircle2, Clock, AlertTriangle, 
  FileText, User, Calendar, ShieldCheck, RefreshCw, BarChart3, PieChart as PieIcon,
  X, Eye, Tag, History, Trash2, Download, Activity, Check, XCircle, Printer
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, 
  PieChart, Pie, Cell 
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { validateOutpatientPrescription, validatePrescriptionSchema, VALID_DOSES, VALID_ROUTES, VALID_FREQUENCIES } from '../lib/prescriptionValidation';
import PrescriptionAuditLogs, { logPrescriptionAuditEvent } from './PrescriptionAuditLogs';

interface PharmacyOverviewProps {
  activeHospital?: any;
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  hospital_id?: string;
}

interface MedicationItem {
  prescribed_drugs: string;
  dose: string;
  dose_other_specific?: string;
  route: string;
  route_other_specific?: string;
  frequency: string;
  frequency_other_specific?: string;
}

interface InventoryItem {
  drug: string;
  category: string;
  totalStock: number;
  dispensedCount: number;
  reorderThreshold: number;
  unit: string;
}

const INITIAL_INVENTORY: InventoryItem[] = [];

const ROUTE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const CHRONIC_COLORS = ['#059669', '#3b82f6'];
const DRUG_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];



export default function PharmacyOverview({ activeHospital, addToast, hospital_id = 'DEFAULT' }: PharmacyOverviewProps) {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-navigation view state
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'INVENTORY' | 'AUDIT_LOGS'>('OVERVIEW');

  // Inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);

  // Filters
  const [mrnFilter, setMrnFilter] = useState('');
  const [chronicFilter, setChronicFilter] = useState<'all' | 'chronic' | 'acute'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Compliance Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // Selected Rx detail modal
  const [selectedRx, setSelectedRx] = useState<any | null>(null);

  // Patient History View Modal State (1.1.1.m, 1.1.1.t, 1.1.1.z.2)
  const [historyModalMrn, setHistoryModalMrn] = useState<string | null>(null);
  const [patientHistoryList, setPatientHistoryList] = useState<any[]>([]);
  const [loadingPatientHistory, setLoadingPatientHistory] = useState(false);

  // Status Badge Helper
  const getStatusBadge = (status?: string) => {
    const s = status || 'Pending Dispense';
    switch (s) {
      case 'Pending Approval':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10px] flex items-center gap-1 w-fit">
            <Clock size={11} /> Pending Approval
          </span>
        );
      case 'Pending Dispense':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-bold text-[10px] flex items-center gap-1 w-fit">
            <Clock size={11} /> Pending Dispense
          </span>
        );
      case 'Dispensed':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] flex items-center gap-1 w-fit">
            <CheckCircle2 size={11} /> Dispensed
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[10px] flex items-center gap-1 w-fit">
            <AlertTriangle size={11} /> Rejected
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300 font-bold text-[10px] flex items-center gap-1 w-fit">
            <X size={11} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200 font-bold text-[10px]">
            {s}
          </span>
        );
    }
  };

  // Status Transition Handler
  const handleStatusChange = async (rxId: string, newStatus: string, reason?: string) => {
    try {
      const rx = prescriptions.find(p => p.id === rxId);
      if (!rx) return;

      const oldStatus = rx.status || 'Pending Dispense';
      const updated = { ...rx, status: newStatus };

      setPrescriptions(prev => prev.map(p => p.id === rxId ? updated : p));
      if (selectedRx && selectedRx.id === rxId) {
        setSelectedRx(updated);
      }

      // Try updating Firestore document if valid
      if (rx.id && !rx.id.startsWith('rx-')) {
        try {
          const docRef = doc(db, 'form_1_1_1_m', rx.id);
          await updateDoc(docRef, { status: newStatus });
        } catch (e) {
          console.warn('Firestore doc status update skipped:', e);
        }
      }

      // Log to Audit Logger
      let actionType: 'STATUS_CHANGE' | 'DISPENSED' | 'REJECTED' | 'CANCELLATION' = 'STATUS_CHANGE';
      if (newStatus === 'Dispensed') actionType = 'DISPENSED';
      else if (newStatus === 'Rejected') actionType = 'REJECTED';
      else if (newStatus === 'Cancelled') actionType = 'CANCELLATION';

      await logPrescriptionAuditEvent({
        action: actionType,
        prescription_id: rx.id,
        patient_mrn: rx.patient_mrn || rx.patient_id || 'N/A',
        medication_name: rx.prescribed_drugs || 'Unspecified',
        details: reason ? `Status changed from '${oldStatus}' to '${newStatus}': ${reason}` : `Status transitioned from '${oldStatus}' to '${newStatus}'`,
        previous_state: { status: oldStatus },
        new_state: { status: newStatus, reason },
        hospital_id: rx.hospital_id || activeHospital?.hospital_unique_number || 'HOSP-01'
      });

      addToast?.('success', `Prescription ${rx.id} workflow updated to '${newStatus}'.`);
    } catch (err) {
      console.error('Error changing prescription status:', err);
      addToast?.('error', 'Failed to update workflow status.');
    }
  };

  // CSV Clinical Compliance Report Generator
  const downloadComplianceReport = () => {
    let dataset = [...prescriptions];

    if (reportStartDate) {
      const startMs = new Date(reportStartDate).getTime();
      dataset = dataset.filter(r => new Date(r.date || 0).getTime() >= startMs);
    }
    if (reportEndDate) {
      const endMs = new Date(reportEndDate + 'T23:59:59').getTime();
      dataset = dataset.filter(r => new Date(r.date || 0).getTime() <= endMs);
    }

    if (dataset.length === 0) {
      addToast?.('info', 'No prescription records found for the selected date range.');
      return;
    }

    const headers = [
      'Prescription ID',
      'Hospital ID',
      'Date & Time',
      'Patient MRN',
      'Treatment / Diagnosis',
      'Prescribed Drugs',
      'Dose',
      'Route',
      'Frequency',
      'Is Chronic Therapy',
      'Supply Days',
      'Workflow Status',
      'Prescribed By',
      'Approved By'
    ];

    const rows = dataset.map(p => [
      p.id,
      p.hospital_id || 'HOSP-01',
      p.date ? new Date(p.date).toISOString() : 'N/A',
      p.patient_mrn || p.patient_id || 'N/A',
      `"${(p.management_or_treatment_for || p.diagnosed || '').replace(/"/g, '""')}"`,
      `"${(p.prescribed_drugs || '').replace(/"/g, '""')}"`,
      p.dose || 'N/A',
      p.route || 'PO',
      p.frequency || 'BID',
      p.is_chronic ? 'Yes' : 'No',
      p.supply_days || 0,
      p.status || 'Pending Dispense',
      `"${(p.prescribed_by || 'Staff Clinician').replace(/"/g, '""')}"`,
      `"${(p.approved_by || 'Staff Pharmacist').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Clinical_Prescription_Report_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowReportModal(false);
    addToast?.('success', `Exported clinical compliance report containing ${dataset.length} prescriptions.`);
  };

  // Low Stock Items Calculation
  const lowStockItems = inventory.filter(item => (item.totalStock - item.dispensedCount) <= item.reorderThreshold);

  // New Prescription Form Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newRx, setNewRx] = useState({
    hospital_id: activeHospital?.hospital_unique_number || 'HOSP-01',
    patient_mrn: '',
    ward_name: 'Main Ward',
    management_or_treatment_for: '',
    is_chronic: false,
    supply_days: 7,
    prescribed_by: '',
    approved_by: '',
    date: new Date().toISOString()
  });

  // Multi-medication dynamic row list state
  const [medicationList, setMedicationList] = useState<MedicationItem[]>([
    {
      prescribed_drugs: '',
      dose: '500mg',
      dose_other_specific: '',
      route: 'PO',
      route_other_specific: '',
      frequency: 'BID',
      frequency_other_specific: ''
    }
  ]);

  const addMedicationRow = () => {
    setMedicationList(prev => [
      ...prev,
      {
        prescribed_drugs: '',
        dose: '500mg',
        dose_other_specific: '',
        route: 'PO',
        route_other_specific: '',
        frequency: 'BID',
        frequency_other_specific: ''
      }
    ]);
  };

  const removeMedicationRow = (index: number) => {
    if (medicationList.length <= 1) return;
    setMedicationList(prev => prev.filter((_, i) => i !== index));
  };

  const updateMedicationRow = (index: number, field: keyof MedicationItem, value: string) => {
    setMedicationList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  useEffect(() => {
    fetchOutpatientPrescriptions();
  }, [hospital_id]);

  // Auto-save form state to local storage
  useEffect(() => {
    const savedRx = localStorage.getItem('pharmacy_new_rx');
    const savedMeds = localStorage.getItem('pharmacy_medication_list');
    if (savedRx) {
      try {
        const parsed = JSON.parse(savedRx);
        setNewRx(prev => ({ ...prev, ...parsed, hospital_id: activeHospital?.hospital_unique_number || 'HOSP-01' }));
      } catch (e) {
        console.error('Failed to load saved prescription form:', e);
      }
    }
    if (savedMeds) {
      try {
        setMedicationList(JSON.parse(savedMeds));
      } catch (e) {
        console.error('Failed to load saved medication list:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      localStorage.setItem('pharmacy_new_rx', JSON.stringify(newRx));
      localStorage.setItem('pharmacy_medication_list', JSON.stringify(medicationList));
    }
  }, [newRx, medicationList, showCreateModal]);

  const fetchOutpatientPrescriptions = async () => {
    setLoading(true);
    try {
      const q1 = query(collection(db, 'form_1_1_1_z_9'), where('hospital_id', '==', activeHospital?.hospital_unique_number || 'HOSP-01'), limit(200));
      const q2 = query(collection(db, 'form_1_1_1_m'), where('hospital_id', '==', activeHospital?.hospital_unique_number || 'HOSP-01'), limit(200));
      const [snap1, snap2] = await Promise.all([
        getDocs(q1).catch(() => ({ forEach: () => {} })),
        getDocs(q2).catch(() => ({ forEach: () => {} }))
      ]);
      const list: any[] = [];
      const seenIds = new Set<string>();

      snap1.forEach((docSnap: any) => {
        seenIds.add(docSnap.id);
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      snap2.forEach((docSnap: any) => {
        if (!seenIds.has(docSnap.id)) {
          seenIds.add(docSnap.id);
          list.push({ id: docSnap.id, ...docSnap.data() });
        }
      });

      if (list.length === 0) {
        setPrescriptions([]);
      } else {
        // Sort by date descending
        list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        setPrescriptions(list);
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch chronological prescription history across 1.1.1.z.9, 1.1.1.m, 1.1.1.t, and 1.1.1.z.2 for a specific patient MRN
  const fetchChronologicalPatientRxHistory = async (mrnToFetch: string) => {
    if (!mrnToFetch.trim()) return;
    setLoadingPatientHistory(true);
    setHistoryModalMrn(mrnToFetch);
    const cleanMrn = mrnToFetch.trim().toLowerCase();

    try {
      const collections = [
        { col: 'form_1_1_1_z_9', name: '1.1.1.z.9 Prescription Module' },
        { col: 'form_1_1_1_m', name: '1.1.1.m Outpatient Rx' },
        { col: 'form_1_1_1_t', name: '1.1.1.t Inpatient Ward Rx' },
        { col: 'form_1_1_1_z_2', name: '1.1.1.z.2 Discharge Rx Summary' }
      ];

      const results: any[] = [];

      for (const item of collections) {
        try {
          const snap = await getDocs(query(collection(db, item.col), where('hospital_id', '==', activeHospital?.hospital_unique_number || 'HOSP-01'), limit(100)));
          snap.forEach(docSnap => {
            const d = docSnap.data();
            const docMrn = (d.patient_mrn || d.mrn || d.patient_id || '').trim().toLowerCase();
            if (docMrn === cleanMrn) {
              results.push({
                id: docSnap.id,
                source_schema: item.name,
                collection_id: item.col,
                ...d
              });
            }
          });
        } catch (err) {
          console.warn(`Error querying ${item.col}:`, err);
        }
      }

      // Sort strictly by date descending (chronological history)
      results.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

      setPatientHistoryList(results);
    } catch (err) {
      console.error('Error fetching patient prescription history:', err);
    } finally {
      setLoadingPatientHistory(false);
    }
  };

  // Filtered list
  const filteredPrescriptions = prescriptions.filter(rx => {
    // MRN filter
    if (mrnFilter.trim()) {
      const targetMrn = mrnFilter.trim().toLowerCase();
      const rxMrn = (rx.patient_mrn || rx.patient_id || rx.mrn || '').toLowerCase();
      if (!rxMrn.includes(targetMrn)) return false;
    }

    // Chronic filter
    if (chronicFilter === 'chronic' && !rx.is_chronic) return false;
    if (chronicFilter === 'acute' && rx.is_chronic) return false;

    // Status filter
    if (statusFilter !== 'ALL') {
      const rxStatus = rx.status || 'Pending Dispense';
      if (rxStatus !== statusFilter) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const drug = (rx.prescribed_drugs || '').toLowerCase();
      const diag = (rx.management_or_treatment_for || rx.diagnosed || '').toLowerCase();
      const prescriber = (rx.prescribed_by || '').toLowerCase();
      const mrn = (rx.patient_mrn || '').toLowerCase();
      if (!drug.includes(q) && !diag.includes(q) && !prescriber.includes(q) && !mrn.includes(q)) {
        return false;
      }
    }

    return true;
  });

  // Recharts aggregation data: Routes Distribution
  const routeCounts: Record<string, number> = {};
  prescriptions.forEach(rx => {
    const r = rx.route || 'Other';
    routeCounts[r] = (routeCounts[r] || 0) + 1;
  });

  const routeChartData = Object.keys(routeCounts).map(r => ({
    route: r,
    count: routeCounts[r]
  }));

  // Recharts aggregation data: Top Medications
  const drugCounts: Record<string, number> = {};
  prescriptions.forEach(rx => {
    const d = rx.prescribed_drugs || 'Unspecified';
    drugCounts[d] = (drugCounts[d] || 0) + 1;
  });

  const drugChartData = Object.keys(drugCounts)
    .map(d => ({ drug: d, count: drugCounts[d] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Chronic vs Acute
  const chronicCount = prescriptions.filter(r => r.is_chronic).length;
  const acuteCount = prescriptions.length - chronicCount;
  const chronicChartData = [
    { name: 'Chronic', value: chronicCount },
    { name: 'Acute', value: acuteCount }
  ];

  // Submit new prescription with schema validation
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // 1. Verify Patient MRN against existing patient record database
    try {
      const patientsRef = collection(db, 'patients');
      const patientQuery = query(
        patientsRef, 
        where('hospital_id', '==', newRx.hospital_id),
        where('mrn', '==', newRx.patient_mrn)
      );
      const patientSnap = await getDocs(patientQuery);
      
      if (patientSnap.empty) {
        setFormErrors(prev => ({ ...prev, patient_mrn: 'Patient MRN not found in database. Please verify and try again.' }));
        addToast?.('error', 'Invalid Patient MRN. Patient record not found in registered patients database.');
        return;
      }
    } catch (err) {
      console.error('Error verifying patient MRN:', err);
      addToast?.('error', 'System error during MRN verification. Please check network.');
      return;
    }

    // 2. Detect and warn if an identical medication is already prescribed within last 24 hours
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const rxRef = collection(db, 'form_1_1_1_m');
      const recentRxQuery = query(
        rxRef,
        where('hospital_id', '==', newRx.hospital_id),
        where('patient_mrn', '==', newRx.patient_mrn),
        where('date', '>=', yesterday)
      );
      const recentRxSnap = await getDocs(recentRxQuery);
      
      let foundDuplicate = false;
      let duplicateMedName = '';

      recentRxSnap.forEach(docSnap => {
        const data = docSnap.data();
        const existingMeds = (data.prescribed_drugs || '').split(',').map((s: string) => s.trim().toLowerCase());
        
        for (const med of medicationList) {
          if (existingMeds.includes(med.prescribed_drugs.trim().toLowerCase())) {
            foundDuplicate = true;
            duplicateMedName = med.prescribed_drugs;
            break;
          }
        }
      });

      if (foundDuplicate) {
        const proceed = window.confirm(`Warning: "${duplicateMedName}" was already prescribed for this patient in the last 24 hours. Do you want to proceed with a duplicate prescription?`);
        if (!proceed) return;
      }
    } catch (err) {
      console.error('Error checking for duplicate prescriptions:', err);
    }

    const primaryMed = medicationList[0] || {};
    const combinedDrugNames = medicationList
      .map(m => m.prescribed_drugs.trim())
      .filter(Boolean)
      .join(', ');

    const payload = {
      ...newRx,
      prescribed_drugs: combinedDrugNames || primaryMed.prescribed_drugs || '',
      dose: primaryMed.dose || '500mg',
      dose_other_specific: primaryMed.dose_other_specific || '',
      route: primaryMed.route || 'PO',
      route_other_specific: primaryMed.route_other_specific || '',
      frequency: primaryMed.frequency || 'BID',
      frequency_other_specific: primaryMed.frequency_other_specific || '',
      medications: medicationList,
      date: new Date().toISOString(),
      schema_id: '1.1.1.z.9'
    };

    const validation = validatePrescriptionSchema(payload, '1.1.1.z.9');
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      addToast?.('error', 'Prescription validation failed. Please review error fields.');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'form_1_1_1_z_9'), payload);
      await addDoc(collection(db, 'form_1_1_1_m'), payload).catch(() => {});
      const newEntry = { id: docRef.id, ...payload, status: 'Pending Dispense' };

      setPrescriptions(prev => [newEntry, ...prev]);
      setShowCreateModal(false);
      addToast?.('success', `Prescription for MRN ${newRx.patient_mrn} submitted successfully!`);

      // Clear auto-saved form
      localStorage.removeItem('pharmacy_new_rx');
      localStorage.removeItem('pharmacy_medication_list');

      // Reset form
      setNewRx({
        hospital_id: activeHospital?.hospital_unique_number || 'HOSP-01',
        patient_mrn: '',
        ward_name: 'Main Ward',
        management_or_treatment_for: '',
        is_chronic: false,
        supply_days: 7,
        prescribed_by: '',
        approved_by: '',
        date: new Date().toISOString()
      });
      setMedicationList([{
        prescribed_drugs: '',
        dose: '500mg',
        dose_other_specific: '',
        route: 'PO',
        route_other_specific: '',
        frequency: 'BID',
        frequency_other_specific: ''
      }]);
    } catch (err) {
      console.error('Error adding prescription:', err);
      addToast?.('error', 'Failed to save prescription to database.');
    }
  };

  const handlePrintPrescription = (rx: any) => {
    const doc = new jsPDF();
    const hospitalName = activeHospital?.hospital_name || 'Healthcare Facility';
    const hospitalId = rx.hospital_id || activeHospital?.hospital_unique_number || 'N/A';
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text(hospitalName, 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Hospital ID: ${hospitalId}`, 105, 27, { align: 'center' });
    
    doc.setDrawColor(200);
    doc.line(20, 32, 190, 32);
    
    // Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('OUTPATIENT PRESCRIPTION', 105, 42, { align: 'center' });
    
    // Patient Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Information', 20, 55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`MRN: ${rx.patient_mrn || rx.mrn || 'N/A'}`, 20, 62);
    doc.text(`Ward: ${rx.ward_name || 'Outpatient'}`, 20, 68);
    doc.text(`Date: ${rx.date ? new Date(rx.date).toLocaleString() : 'N/A'}`, 130, 62);
    doc.text(`Prescription ID: ${rx.id}`, 130, 68);
    
    // Clinical Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Clinical Context', 20, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Management/Treatment for: ${rx.management_or_treatment_for || rx.diagnosed || 'N/A'}`, 20, 87);
    doc.text(`Therapy Type: ${rx.is_chronic ? 'Chronic' : 'Acute'}`, 130, 87);
    
    // Medications Table
    const meds = Array.isArray(rx.medications) ? rx.medications : [{
      prescribed_drugs: rx.prescribed_drugs,
      dose: rx.dose,
      dose_other_specific: rx.dose_other_specific,
      route: rx.route,
      route_other_specific: rx.route_other_specific,
      frequency: rx.frequency,
      frequency_other_specific: rx.frequency_other_specific
    }];
    
    const tableData = meds.map((m: any) => [
      m.prescribed_drugs,
      m.dose === 'other specific' ? m.dose_other_specific : m.dose,
      m.route === 'other specific' ? m.route_other_specific : m.route,
      m.frequency === 'other specific' ? m.frequency_other_specific : m.frequency
    ]);
    
    (doc as any).autoTable({
      startY: 95,
      head: [['Medication', 'Dose', 'Route', 'Frequency']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }, // emerald-600
      styles: { fontSize: 9 }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    // Footer / Signatures
    doc.setFontSize(10);
    doc.text(`Supply Days: ${rx.supply_days || 'N/A'}`, 20, finalY + 15);
    
    doc.text('Prescribed By:', 20, finalY + 30);
    doc.setFont('helvetica', 'bold');
    doc.text(rx.prescribed_by || '____________________', 20, finalY + 37);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Approved By:', 130, finalY + 30);
    doc.setFont('helvetica', 'bold');
    doc.text(rx.approved_by || '____________________', 130, finalY + 37);
    
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Generated by Hospital Information System', 105, 285, { align: 'center' });
    
    doc.save(`Prescription_${rx.patient_mrn || rx.mrn}_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Sub-Navigation Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('OVERVIEW')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'OVERVIEW'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Pill size={15} />
            <span>Overview & Prescriptions</span>
          </button>

          <button
            onClick={() => setActiveSubTab('INVENTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
              activeSubTab === 'INVENTORY'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle size={15} className={lowStockItems.length > 0 ? 'text-amber-400 animate-pulse' : ''} />
            <span>Low Stock Inventory</span>
            {lowStockItems.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-mono font-bold">
                {lowStockItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('AUDIT_LOGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'AUDIT_LOGS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck size={15} />
            <span>Prescription Audit Trail</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download size={14} className="text-emerald-600" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Main View Router */}
      {activeSubTab === 'AUDIT_LOGS' ? (
        <PrescriptionAuditLogs
          hospital_id={hospital_id}
          addToast={addToast}
          onClose={() => setActiveSubTab('OVERVIEW')}
        />
      ) : activeSubTab === 'INVENTORY' ? (
        <div className="space-y-6">
          {/* Low Stock Threshold Alert Banner */}
          {lowStockItems.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-2xl flex items-start gap-3 shadow-xs">
              <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={20} />
              <div className="flex-1 text-xs">
                <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                  Low Stock Threshold Alert ({lowStockItems.length} Medications)
                </h4>
                <p className="text-amber-800 dark:text-amber-300 mt-0.5">
                  The following medications have dropped below the safety reorder threshold based on cumulative prescriptions vs inventory logs:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {lowStockItems.map(item => (
                    <span key={item.drug} className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 rounded-lg font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 text-[11px]">
                      <Pill size={12} className="text-amber-500" />
                      {item.drug}: <strong className="text-rose-600">{item.totalStock - item.dispensedCount} {item.unit} left</strong> (Min: {item.reorderThreshold})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Full Inventory Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Medication Inventory & Low Stock Monitor
                </h3>
                <p className="text-xs text-slate-500">
                  Calculates remaining inventory levels against reorder thresholds based on cumulative dispensed prescriptions
                </p>
              </div>

              <span className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 rounded-full font-bold border border-emerald-200 dark:border-emerald-800">
                {inventory.length} Stocked Drugs
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Medication Drug</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Initial Stock</th>
                    <th className="py-3 px-4">Dispensed</th>
                    <th className="py-3 px-4">Remaining</th>
                    <th className="py-3 px-4">Reorder Threshold</th>
                    <th className="py-3 px-4">Stock Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                  {inventory.map((item, idx) => {
                    const remaining = item.totalStock - item.dispensedCount;
                    const isLow = remaining <= item.reorderThreshold;
                    const isCritical = remaining <= item.reorderThreshold / 2;
                    const percent = Math.max(0, Math.min(100, Math.round((remaining / item.totalStock) * 100)));

                    return (
                      <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${isLow ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}`}>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Pill size={14} className={isLow ? 'text-amber-500' : 'text-emerald-500'} />
                          {item.drug}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          {item.category}
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          {item.totalStock} {item.unit}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          {item.dispensedCount} {item.unit}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span className={isCritical ? 'text-rose-600 font-black' : isLow ? 'text-amber-600 font-bold' : 'text-emerald-600'}>
                            {remaining} {item.unit}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          {item.reorderThreshold} {item.unit}
                        </td>

                        <td className="py-3.5 px-4">
                          {isCritical ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 font-bold text-[10px] flex items-center gap-1 w-fit">
                              <AlertTriangle size={11} /> Critical Shortage
                            </span>
                          ) : isLow ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 font-bold text-[10px] flex items-center gap-1 w-fit">
                              <AlertTriangle size={11} /> Low Stock Alert
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 font-bold text-[10px] flex items-center gap-1 w-fit">
                              <CheckCircle2 size={11} /> Normal Stock ({percent}%)
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setInventory(prev => prev.map(inv => inv.drug === item.drug ? { ...inv, totalStock: inv.totalStock + 100 } : inv));
                              addToast?.('success', `Restocked +100 ${item.unit} for ${item.drug}`);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            + Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-emerald-800/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full w-fit text-xs font-semibold text-emerald-300 border border-emerald-400/30 mb-2">
                  <Pill size={14} className="text-emerald-400" />
                  1.1.1.m Outpatient Prescription Registry & Overview
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Pharmacy Prescription Overview</h2>
                <p className="text-slate-300 text-xs mt-1 max-w-xl">
                  Track outpatient prescriptions, workflow status transitions, low stock threshold alerts, and compliance report downloads.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all border border-white/10 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <Download size={14} className="text-emerald-400" />
                  Report CSV
                </button>
                <button
                  onClick={fetchOutpatientPrescriptions}
                  className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all border border-white/10 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                  title="Refresh Prescriptions"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  Sync
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} />
                  New Prescription
                </button>
              </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-slate-400 block font-medium">Total Prescriptions</span>
                <span className="text-xl font-black text-white mt-0.5 block">{prescriptions.length}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-slate-400 block font-medium">Low Stock Items</span>
                <span className={`text-xl font-black mt-0.5 block ${lowStockItems.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {lowStockItems.length}
                </span>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-slate-400 block font-medium">Chronic Therapy</span>
                <span className="text-xl font-black text-emerald-400 mt-0.5 block">{chronicCount}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-slate-400 block font-medium">Pending Dispense</span>
                <span className="text-xl font-black text-amber-300 mt-0.5 block">
                  {prescriptions.filter(p => (p.status || 'Pending Dispense') === 'Pending Dispense').length}
                </span>
              </div>
            </div>
          </div>

          {/* Analytics Visualizers using Recharts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Chart 1: Administration Routes */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800">Routes Distribution</h3>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">PO / IV / IM</span>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={routeChartData}>
                    <XAxis dataKey="route" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Common Medications Dispensed */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Pill size={16} className="text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-800">Most Common Medications</h3>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Dispensed Share</span>
              </div>
              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={drugChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="drug"
                      label={({ drug, percent }) => `${(drug || '').slice(0, 10)} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {drugChartData.map((entry, index) => (
                        <Cell key={`drug-cell-${index}`} fill={DRUG_COLORS[index % DRUG_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      formatter={(value: any, name: any) => [`${value} dispensed`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Chronic vs Acute Breakdown */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PieIcon size={16} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800">Therapy Classification</h3>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Chronic / Acute</span>
              </div>
              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chronicChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {chronicChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHRONIC_COLORS[index % CHRONIC_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Filtering Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filters:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full md:w-auto flex-1">
                {/* Filter by Patient MRN */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={mrnFilter}
                    onChange={e => setMrnFilter(e.target.value)}
                    placeholder="Filter by Patient MRN..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Filter by Workflow Status */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  >
                    <option value="ALL">All Workflow States</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Pending Dispense">Pending Dispense</option>
                    <option value="Dispensed">Dispensed</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Filter by Chronic Status */}
                <div>
                  <select
                    value={chronicFilter}
                    onChange={e => setChronicFilter(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  >
                    <option value="all">All Therapy Types</option>
                    <option value="chronic">Chronic Therapy Only</option>
                    <option value="acute">Acute Therapy Only</option>
                  </select>
                </div>

                {/* Search drug / treatment */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search drug, treatment, doctor..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {(mrnFilter || chronicFilter !== 'all' || statusFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setMrnFilter('');
                    setChronicFilter('all');
                    setStatusFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Main Prescriptions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-600" />
                <h3 className="text-sm font-bold text-slate-800">Submitted Outpatient Prescriptions</h3>
                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  {filteredPrescriptions.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-medium">Schema Form 1.1.1.m</span>
                {prescriptions.length > 0 && (
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete all prescription records?')) {
                        try {
                          const hospitalId = activeHospital?.hospital_unique_number || 'HOSP-01';
                          const q1 = query(collection(db, 'form_1_1_1_m'), where('hospital_id', '==', hospitalId));
                          const q2 = query(collection(db, 'form_1_1_1_z_9'), where('hospital_id', '==', hospitalId));
                          
                          const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
                          
                          const batchPromises = [
                            ...snap1.docs.map(d => deleteDoc(doc(db, 'form_1_1_1_m', d.id))),
                            ...snap2.docs.map(d => deleteDoc(doc(db, 'form_1_1_1_z_9', d.id)))
                          ];

                          await Promise.all(batchPromises);
                          setPrescriptions([]);
                          addToast?.('success', 'All prescription records deleted successfully from database.');
                        } catch (err) {
                          console.error(err);
                          addToast?.('error', 'Failed to delete records.');
                        }
                      }
                    }}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="Delete all prescription records"
                  >
                    <Trash2 size={13} />
                    <span>Delete All</span>
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
                Loading submitted outpatient prescriptions...
              </div>
            ) : filteredPrescriptions.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Pill size={32} className="mx-auto text-slate-300" />
                <p className="text-slate-600 text-xs font-semibold">No matching outpatient prescriptions found</p>
                <p className="text-slate-400 text-[11px]">Try adjusting your search query, MRN, or status selection.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date & Hosp ID</th>
                      <th className="py-3 px-4">Patient MRN</th>
                      <th className="py-3 px-4">Workflow Status</th>
                      <th className="py-3 px-4">Treatment For</th>
                      <th className="py-3 px-4">Medication & Dose</th>
                      <th className="py-3 px-4">Route & Frequency</th>
                      <th className="py-3 px-4">Type & Days</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPrescriptions.map(rx => (
                      <tr key={rx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {rx.date ? new Date(rx.date).toLocaleDateString() : '—'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{rx.hospital_id || 'HOSP-01'}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                          {rx.patient_mrn || rx.patient_id || rx.mrn}
                        </td>

                        <td className="py-3.5 px-4">
                          {getStatusBadge(rx.status)}
                        </td>

                        <td className="py-3.5 px-4 max-w-[180px]">
                          <div className="font-medium text-slate-900 truncate" title={rx.management_or_treatment_for || rx.diagnosed}>
                            {rx.management_or_treatment_for || rx.diagnosed || '—'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Pill size={13} className="text-emerald-600" />
                            {rx.prescribed_drugs}
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            Dose: <span className="text-slate-800">{rx.dose || 'Unspecified'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 font-bold text-[10px] mr-1">
                            {rx.route || 'PO'}
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]">
                            {rx.frequency || 'BID'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {rx.is_chronic ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              <ShieldCheck size={10} /> Chronic
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
                              Acute
                            </span>
                          )}
                          {rx.supply_days && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {rx.supply_days} days supply
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Workflow Quick Action Buttons */}
                            {(rx.status === 'Pending Dispense' || !rx.status) && (
                              <button
                                onClick={() => handleStatusChange(rx.id, 'Dispensed')}
                                className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                                title="Mark as Dispensed"
                              >
                                <Check size={11} /> Dispense
                              </button>
                            )}

                            {rx.status === 'Pending Approval' && (
                              <button
                                onClick={() => handleStatusChange(rx.id, 'Pending Dispense')}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                                title="Approve Prescription"
                              >
                                <Check size={11} /> Approve
                              </button>
                            )}

                            <button
                              onClick={() => fetchChronologicalPatientRxHistory(rx.patient_mrn || rx.patient_id || rx.mrn)}
                              className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-semibold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                              title="View Chronological History"
                            >
                              <History size={12} />
                            </button>

                            <button
                              onClick={() => setSelectedRx(rx)}
                              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={12} />
                            </button>

                            <button
                              onClick={() => handlePrintPrescription(rx)}
                              className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                              title="Print Prescription PDF"
                            >
                              <Printer size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal: Clinical Compliance CSV Report Generator */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Download className="text-emerald-600" size={20} />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Download Clinical Report</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Generate a formatted CSV export of submitted outpatient prescriptions adhering to clinical compliance standards.
              </p>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Start Date Filter (Optional)</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={e => setReportStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">End Date Filter (Optional)</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={e => setReportEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={downloadComplianceReport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Download size={14} />
                <span>Export CSV Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Patient Chronological Prescription History (1.1.1.m, 1.1.1.t, 1.1.1.z.2) */}
      {historyModalMrn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <History className="text-emerald-600" size={20} />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Patient Prescription History</h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    MRN: <span className="font-bold text-emerald-700">{historyModalMrn}</span> • Forms 1.1.1.m, 1.1.1.t, 1.1.1.z.2
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalMrn(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                <X size={16} />
              </button>
            </div>

            {loadingPatientHistory ? (
              <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
                Fetching chronological prescription history for MRN {historyModalMrn}...
              </div>
            ) : patientHistoryList.length === 0 ? (
              <div className="p-8 text-center space-y-1">
                <p className="text-slate-600 text-xs font-semibold">No historical prescription submissions found</p>
                <p className="text-slate-400 text-[11px]">No 1.1.1.m, 1.1.1.t, or 1.1.1.z.2 records matching this MRN.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {patientHistoryList.map((rec, idx) => (
                  <div key={rec.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                        {rec.source_schema || rec.form_code || 'Prescription Submission'}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {rec.date ? new Date(rec.date).toLocaleString() : 'N/A'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Management / Treatment For:</span>
                        <span className="font-bold text-slate-900">{rec.management_or_treatment_for || rec.diagnosed || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Hospital / Dispensary:</span>
                        <span className="font-medium text-slate-800">{rec.hospital_id || rec.ward_name || rec.dispensary_identifier || 'HOSP-01'}</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Medication Details:</div>
                      {Array.isArray(rec.medications) && rec.medications.length > 0 ? (
                        <div className="space-y-1 pt-1">
                          {rec.medications.map((m: any, mIdx: number) => (
                            <div key={mIdx} className="flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded-lg">
                              <span className="font-bold text-slate-800">{m.prescribed_drugs}</span>
                              <span className="text-slate-500 font-mono">
                                Dose: {m.dose === 'other specific' ? m.dose_other_specific : m.dose} | Route: {m.route === 'other specific' ? m.route_other_specific : m.route} | Freq: {m.frequency === 'other specific' ? m.frequency_other_specific : m.frequency}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="font-bold text-slate-800">{rec.prescribed_drugs || '—'}</span>
                          <span className="text-slate-500 font-mono">
                            Dose: {rec.dose === 'other specific' ? rec.dose_other_specific : rec.dose || '—'} | Route: {rec.route === 'other specific' ? rec.route_other_specific : rec.route || '—'} | Freq: {rec.frequency === 'other specific' ? rec.frequency_other_specific : rec.frequency || '—'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Prescribed By: <strong className="text-slate-700">{rec.prescribed_by || 'Staff Doctor'}</strong></span>
                      <span>Approved By: <strong className="text-slate-700">{rec.approved_by || 'Staff Pharmacist'}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end border-t border-slate-200">
              <button
                onClick={() => setHistoryModalMrn(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Prescription Details */}
      {selectedRx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Pill className="text-emerald-600" size={20} />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Outpatient Prescription Detail</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Form 1.1.1.m • ID: {selectedRx.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRx(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px]">HOSPITAL ID</span>
                  <span className="font-mono font-bold text-slate-800">{selectedRx.hospital_id || 'HOSP-01'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px]">PATIENT MRN</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedRx.patient_mrn || selectedRx.mrn}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block font-semibold text-[10px]">MANAGEMENT OR TREATMENT FOR</span>
                  <span className="font-bold text-slate-900">{selectedRx.management_or_treatment_for || selectedRx.diagnosed}</span>
                </div>
              </div>

              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-900 font-bold text-sm">{selectedRx.prescribed_drugs}</span>
                  {selectedRx.is_chronic && (
                    <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-bold">
                      Chronic Therapy
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Dose</span>
                    <span className="font-bold text-slate-900">{selectedRx.dose === 'other specific' ? selectedRx.dose_other_specific : selectedRx.dose}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Route</span>
                    <span className="font-bold text-slate-900">{selectedRx.route === 'other specific' ? selectedRx.route_other_specific : selectedRx.route}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Frequency</span>
                    <span className="font-bold text-slate-900">{selectedRx.frequency === 'other specific' ? selectedRx.frequency_other_specific : selectedRx.frequency}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Prescribed By</span>
                  <span className="font-semibold text-slate-800">{selectedRx.prescribed_by || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Approved By</span>
                  <span className="font-semibold text-slate-800">{selectedRx.approved_by || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Supply Duration</span>
                  <span className="font-semibold text-slate-800">{selectedRx.supply_days ? `${selectedRx.supply_days} Days` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date Submitted</span>
                  <span className="font-semibold text-slate-800">
                    {selectedRx.date ? new Date(selectedRx.date).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRx(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Prescription with Schema Validation */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">New Prescription (1.1.1.z.9)</h3>
                <p className="text-[11px] text-slate-500">Schema 1.1.1.z.9 Prescription Module • Required Ward & Clinical Fields</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormErrors({});
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Hospital ID*</label>
                  <input
                    type="text"
                    readOnly
                    value={newRx.hospital_id}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-xs text-slate-500 cursor-not-allowed"
                  />
                  {formErrors.hospital_id && <span className="text-rose-600 text-[10px] mt-0.5 block">{formErrors.hospital_id}</span>}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Patient MRN*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MRN-1001"
                    value={newRx.patient_mrn}
                    onChange={e => setNewRx({ ...newRx, patient_mrn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {formErrors.patient_mrn && <span className="text-rose-600 text-[10px] mt-0.5 block">{formErrors.patient_mrn}</span>}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Ward Name*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Surgical Ward A / Outpatient Clinic"
                  value={newRx.ward_name}
                  onChange={e => setNewRx({ ...newRx, ward_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
                {formErrors.ward_name && <span className="text-rose-600 text-[10px] mt-0.5 block">{formErrors.ward_name}</span>}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Management or treatment For*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Community Acquired Pneumonia"
                  value={newRx.management_or_treatment_for}
                  onChange={e => setNewRx({ ...newRx, management_or_treatment_for: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
                {formErrors.management_or_treatment_for && <span className="text-rose-600 text-[10px] mt-0.5 block">{formErrors.management_or_treatment_for}</span>}
              </div>

              {/* Dynamic List of Medication Objects */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-bold">
                    Prescribed Drugs - Name of Medication ({medicationList.length})*
                  </label>
                  <button
                    type="button"
                    onClick={addMedicationRow}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
                  >
                    <Plus size={12} /> Add Row
                  </button>
                </div>

                {medicationList.map((med, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 relative">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Medication Row #{idx + 1}</span>
                      {medicationList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedicationRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove Medication Row"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-600 text-[11px] font-semibold mb-1">Name of Medication*</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter name of medication..."
                        value={med.prescribed_drugs}
                        onChange={e => updateMedicationRow(idx, 'prescribed_drugs', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      {formErrors[`medication_${idx}_name`] && (
                        <span className="text-rose-600 text-[10px] mt-0.5 block">{formErrors[`medication_${idx}_name`]}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-slate-600 text-[11px] font-semibold mb-1">Dose*</label>
                        <select
                          value={med.dose}
                          onChange={e => updateMedicationRow(idx, 'dose', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          {VALID_DOSES.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 text-[11px] font-semibold mb-1">Route*</label>
                        <select
                          value={med.route}
                          onChange={e => updateMedicationRow(idx, 'route', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          {VALID_ROUTES.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 text-[11px] font-semibold mb-1">Frequency*</label>
                        <select
                          value={med.frequency}
                          onChange={e => updateMedicationRow(idx, 'frequency', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          {VALID_FREQUENCIES.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Conditional Other Specific inputs */}
                    {(med.dose === 'other specific' || med.route === 'other specific' || med.frequency === 'other specific') && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                        {med.dose === 'other specific' ? (
                          <div>
                            <label className="block text-slate-600 text-[10px] font-semibold mb-1">Other Specific Dose*</label>
                            <input
                              type="text"
                              required
                              placeholder="Enter dose..."
                              value={med.dose_other_specific || ''}
                              onChange={e => updateMedicationRow(idx, 'dose_other_specific', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs"
                            />
                          </div>
                        ) : <div />}

                        {med.route === 'other specific' ? (
                          <div>
                            <label className="block text-slate-600 text-[10px] font-semibold mb-1">Other Specific Route*</label>
                            <input
                              type="text"
                              required
                              placeholder="Enter route..."
                              value={med.route_other_specific || ''}
                              onChange={e => updateMedicationRow(idx, 'route_other_specific', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs"
                            />
                          </div>
                        ) : <div />}

                        {med.frequency === 'other specific' ? (
                          <div>
                            <label className="block text-slate-600 text-[10px] font-semibold mb-1">Other Specific Freq*</label>
                            <input
                              type="text"
                              required
                              placeholder="Enter frequency..."
                              value={med.frequency_other_specific || ''}
                              onChange={e => updateMedicationRow(idx, 'frequency_other_specific', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs"
                            />
                          </div>
                        ) : <div />}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addMedicationRow}
                  className="w-full py-2 px-3 border border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Plus size={14} />
                  <span>Add Medication Row</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 pt-3">
                  <input
                    type="checkbox"
                    id="is_chronic_check"
                    checked={newRx.is_chronic}
                    onChange={e => setNewRx({ ...newRx, is_chronic: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded-md border-slate-300"
                  />
                  <label htmlFor="is_chronic_check" className="text-slate-800 font-bold">
                    Is Chronic Therapy?
                  </label>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Supply Days</label>
                  <input
                    type="number"
                    placeholder="e.g., 30"
                    value={newRx.supply_days}
                    onChange={e => setNewRx({ ...newRx, supply_days: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Prescribed By*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Solomon"
                    value={newRx.prescribed_by}
                    onChange={e => setNewRx({ ...newRx, prescribed_by: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  {formErrors.prescribed_by && <span className="text-rose-600 text-[10px] mt-0.5 block">{formErrors.prescribed_by}</span>}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Approved By*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pharm. Hanna"
                    value={newRx.approved_by}
                    onChange={e => setNewRx({ ...newRx, approved_by: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  {formErrors.approved_by && <span className="text-rose-600 text-[10px] mt-0.5 block">{formErrors.approved_by}</span>}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                >
                  Save Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
