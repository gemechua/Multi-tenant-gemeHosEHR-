import React, { useState, useEffect } from 'react';
import { 
  collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, getDocs, updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Camera, Upload, Check, X, Search, Plus, Trash2, Cpu, 
  Activity, FileText, Database, Layers, Sparkles, Clock, 
  CheckCircle2, AlertCircle, AlertTriangle, RefreshCw, Eye,
  DollarSign, Bell, ArrowRight, ShieldCheck, HelpCircle, FileSpreadsheet, Building
} from 'lucide-react';
import { PatientClinicalFolderViewer } from './PatientClinicalFolderViewer';
import { RadiologyDashboard } from './RadiologyDashboard';

interface RadiologyTabProps {
  activeHospital: {
    id: string;
    name: string;
    hospital_unique_number: string;
    license_key: string;
  } | null;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  setActiveTab?: (tab: string) => void;
}

interface RadiologyRequest {
  id: string;
  patient_mrn: string;
  radiology_modality: string;
  clinical_notes: string;
  hospital_id: string;
  created_at?: string;
  date?: string;
}

interface RadiologyReport {
  id: string;
  patient_mrn: string;
  device_ref: string;
  radiology_findings: string;
  radiology_image?: string;
  submitted_by?: string;
  hospital_id: string;
  date?: string;
}

interface Patient {
  id: string;
  patient_mrn: string;
  patient_name: string;
  patient_age?: string | number;
  patient_sex?: string;
}

interface ClinicalSubmission {
  id: string;
  hospital_id: string;
  module_id: string;
  subsection_id: string;
  subsection_name: string;
  submitted_at: string;
  status?: string;
  data: any;
}

interface PaymentRequest {
  id: string;
  patient_mrn: string;
  radiology_bill_amount: number | string;
  date: string;
  hospital_id: string;
  type: 'Outpatient' | 'Inpatient';
}

interface CashierVerification {
  id: string;
  patient_mrn: string;
  invoice_no: string;
  payment_verified: string;
  date: string;
  hospital_id: string;
  type: 'Outpatient' | 'Inpatient';
}

export default function RadiologyTab({ activeHospital, addToast, setActiveTab }: RadiologyTabProps) {
  const hospitalId = activeHospital?.hospital_unique_number || 'TENANT-ID';

  // State Lists
  const [requests, setRequests] = useState<RadiologyRequest[]>([]);
  const [reports, setReports] = useState<RadiologyReport[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinicalSubmissions, setClinicalSubmissions] = useState<ClinicalSubmission[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [cashierVerifications, setCashierVerifications] = useState<CashierVerification[]>([]);
  const [ledgerVerifications, setLedgerVerifications] = useState<any[]>([]);
  const [initiatingPaymentMrn, setInitiatingPaymentMrn] = useState<string | null>(null);
  const [recentCashierNotifications, setRecentCashierNotifications] = useState<any[]>([]);

  // Navigation / Filter States
  const [currentSubTab, setCurrentSubTab] = useState<'queue' | 'archive' | 'clinical_folder' | 'finance' | 'request' | 'report'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModalityFilter, setSelectedModalityFilter] = useState<string>('All');
  const [selectedClinicalCodeFilter, setSelectedClinicalCodeFilter] = useState<string>('All');
  const [selectedMrn, setSelectedMrn] = useState<string>('');

  // Request Form States
  const [reqMrn, setReqMrn] = useState('');
  const [reqModality, setReqModality] = useState('Chest X-Ray PA');
  const [reqNotes, setReqNotes] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [mrnSearchTerm, setMrnSearchTerm] = useState('');
  const [showMrnDropdown, setShowMrnDropdown] = useState(false);

  // Report Form States
  const [repMrn, setRepMrn] = useState('');
  const [repDevice, setRepDevice] = useState('Digital X-Ray Unit A');
  const [repFindings, setRepFindings] = useState('');
  const [repImage, setRepImage] = useState<string>('');
  const [repSubmittedBy, setRepSubmittedBy] = useState('');
  const [isSubmittingRep, setIsSubmittingRep] = useState(false);

  // Finance Integration Form States
  const [finMrn, setFinMrn] = useState('');
  const [finSearchTerm, setFinSearchTerm] = useState('');
  const [showFinDropdown, setShowFinDropdown] = useState(false);
  const [finAmount, setFinAmount] = useState('1500');
  const [finType, setFinType] = useState<'Outpatient' | 'Inpatient'>('Outpatient');
  const [isSubmittingFin, setIsSubmittingFin] = useState(false);

  // Interactive Diagnostics States
  const [calibratingDevice, setCalibratingDevice] = useState<string | null>(null);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [deviceStatus, setDeviceStatus] = useState<Record<string, { status: string; uptime: string; temp: string }>>({
    'Digital X-Ray Unit A': { status: 'Operational', uptime: '99.98%', temp: '36.4°C' },
    'CT Somatom 64': { status: 'Operational', uptime: '100.00%', temp: '18.2°C' },
    'MRI GE Signa 1.5T': { status: 'Operational', uptime: '99.91%', temp: '4.2 K (Helium)' },
    'Mindray Resona Sonography': { status: 'Operational', uptime: '100.00%', temp: '24.5°C' }
  });

  // Lightbox Modal for diagnostic film viewing
  const [selectedFilmImage, setSelectedFilmImage] = useState<string | null>(null);

  // Realtime Firestore Subscriptions
  useEffect(() => {
    // 1. Subscribe to Radiology Investigation Requests (form_1_1_1_h)
    const qRequests = query(
      collection(db, 'form_1_1_1_h'),
      where('hospital_id', '==', hospitalId)
    );
    const unsubRequests = onSnapshot(qRequests, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RadiologyRequest[];
      list.sort((a, b) => {
        const dateA = a.date || a.created_at || '';
        const dateB = b.date || b.created_at || '';
        return dateB.localeCompare(dateA);
      });
      setRequests(list);
      if (list.length > 0) {
        setSelectedMrn(prev => prev || list[0].patient_mrn);
      }
    }, (error) => {
      console.error("Firestore requests subscription error:", error);
    });

    // 2. Subscribe to Radiology Reports (form_1_1_1_k)
    const qReports = query(
      collection(db, 'form_1_1_1_k'),
      where('hospital_id', '==', hospitalId)
    );
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RadiologyReport[];
      list.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        return dateB.localeCompare(dateA);
      });
      setReports(list);
    }, (error) => {
      console.error("Firestore reports subscription error:", error);
    });

    // 3. Subscribe to Patients list to populate searchable dropdown
    const qPatients = query(collection(db, 'patients'));
    const unsubPatients = onSnapshot(qPatients, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        patient_mrn: doc.data().patient_mrn || '',
        patient_name: doc.data().patient_name || '',
        patient_age: doc.data().patient_age || '',
        patient_sex: doc.data().patient_sex || ''
      })) as Patient[];
      setPatients(list);
    }, (error) => {
      console.error("Firestore patients subscription error:", error);
    });

    // 4. Subscribe to hospital_modules_submissions for radiology clinical folder
    const qClinical = query(
      collection(db, 'hospital_modules_submissions'),
      where('hospital_id', '==', hospitalId)
    );
    const unsubClinical = onSnapshot(qClinical, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          hospital_id: data.hospital_id || data.hospital_id || '',
          module_id: data.module_id || '',
          subsection_id: data.subsection_id || '',
          subsection_name: data.subsection_name || '',
          submitted_at: data.submitted_at || data.date || '',
          status: data.status || '',
          data: data.data || {}
        };
      }) as ClinicalSubmission[];

      // Filter clinical submissions to those belonging to Radiology (1.1.1.h through 1.1.1.v.8)
      const radSubmissions = list.filter(sub => {
        const id = sub.subsection_id;
        return (
          id === '1.1.1.h' || 
          id === '1.1.1.i' || 
          id === '1.1.1.i.1' || 
          id === '1.1.1.k' || 
          id === '1.1.1.v.5' || 
          id === '1.1.1.v.6' || 
          id === '1.1.1.v.7' || 
          id === '1.1.1.v.8' ||
          (sub.subsection_name || '').toLowerCase().includes('radiology')
        );
      });

      radSubmissions.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
      setClinicalSubmissions(radSubmissions);
    }, (error) => {
      console.error("Firestore clinical subscription error:", error);
    });

    // 5. Subscribe to Outpatient Payment Requests (form_1_1_1_i)
    const qPayOut = query(
      collection(db, 'form_1_1_1_i'),
      where('hospital_id', '==', hospitalId)
    );
    const unsubPayOut = onSnapshot(qPayOut, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        patient_mrn: doc.data().patient_mrn || '',
        radiology_bill_amount: doc.data().radiology_bill_amount || 0,
        date: doc.data().date || '',
        hospital_id: doc.data().hospital_id || '',
        type: 'Outpatient' as const
      }));
      setPaymentRequests(prev => {
        const inpatients = prev.filter(p => p.type === 'Inpatient');
        const sorted = [...inpatients, ...list];
        sorted.sort((a, b) => b.date.localeCompare(a.date));
        return sorted;
      });
    });

    // 6. Subscribe to Inpatient Payment Requests (form_1_1_1_v_6)
    const qPayIn = query(
      collection(db, 'form_1_1_1_v_6'),
      where('hospital_id', '==', hospitalId)
    );
    const unsubPayIn = onSnapshot(qPayIn, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        patient_mrn: doc.data().patient_mrn || '',
        radiology_bill_amount: doc.data().inpatient_rad_bill || doc.data().radiology_bill_amount || 0,
        date: doc.data().date || doc.data().created_at || '',
        hospital_id: doc.data().hospital_id || '',
        type: 'Inpatient' as const
      }));
      setPaymentRequests(prev => {
        const outpatients = prev.filter(p => p.type === 'Outpatient');
        const sorted = [...outpatients, ...list];
        sorted.sort((a, b) => b.date.localeCompare(a.date));
        return sorted;
      });
    });

    // 7. Subscribe to Outpatient Cashier Verifications (form_1_1_1_i_1)
    const qVerOut = query(
      collection(db, 'form_1_1_1_i_1'),
      where('hospital_id', '==', hospitalId)
    );
    const unsubVerOut = onSnapshot(qVerOut, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        patient_mrn: doc.data().patient_mrn || '',
        invoice_no: doc.data().invoice_no || '',
        payment_verified: doc.data().payment_verified || '',
        date: doc.data().date || '',
        hospital_id: doc.data().hospital_id || '',
        type: 'Outpatient' as const
      }));
      setCashierVerifications(prev => {
        const inpatients = prev.filter(p => p.type === 'Inpatient');
        const sorted = [...inpatients, ...list];
        sorted.sort((a, b) => b.date.localeCompare(a.date));
        return sorted;
      });
    });

    // 8. Subscribe to Inpatient Cashier Verifications (form_1_1_1_v_7)
    const qVerIn = query(
      collection(db, 'form_1_1_1_v_7'),
      where('hospital_id', '==', hospitalId)
    );
    const unsubVerIn = onSnapshot(qVerIn, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        patient_mrn: doc.data().patient_mrn || '',
        invoice_no: doc.data().invoice_no || doc.data().inpatient_invoice_no || '',
        payment_verified: doc.data().payment_verified || doc.data().verified_paid || 'Paid',
        date: doc.data().date || doc.data().created_at || '',
        hospital_id: doc.data().hospital_id || '',
        type: 'Inpatient' as const
      }));
      setCashierVerifications(prev => {
        const outpatients = prev.filter(p => p.type === 'Outpatient');
        const sorted = [...outpatients, ...list];
        sorted.sort((a, b) => b.date.localeCompare(a.date));
        return sorted;
      });
    });

    // 9. Subscribe to financial_ledger (Finance collection) for real-time cashier payments
    const qLedger = query(
      collection(db, 'financial_ledger'),
      where('status', '==', 'verified')
    );
    const unsubLedger = onSnapshot(qLedger, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          patient_mrn: data.patientMrn || data.patient_mrn || '',
          invoice_no: data.invoiceNumber || data.invoice_no || '',
          payment_verified: 'Verified',
          date: data.verifiedAt ? (data.verifiedAt.toDate ? data.verifiedAt.toDate().toISOString() : new Date(data.verifiedAt).toISOString()) : new Date().toISOString(),
          hospital_id: data.hospital_id || hospitalId,
          type: 'Outpatient' as const
        };
      });
      setLedgerVerifications(list);
    }, (error) => {
      console.error("Firestore financial_ledger subscription error:", error);
    });

    return () => {
      unsubRequests();
      unsubReports();
      unsubPatients();
      unsubClinical();
      unsubPayOut();
      unsubPayIn();
      unsubVerOut();
      unsubVerIn();
      unsubLedger();
    };
  }, [hospitalId]);

  // Handle Cashier Verification Alert Notification System
  useEffect(() => {
    if (cashierVerifications.length > 0) {
      // Find verifications created in the last 15 seconds to trigger toast & visual alert
      const now = new Date().getTime();
      const newVerifications = cashierVerifications.filter(v => {
        if (!v.date) return false;
        const vTime = new Date(v.date).getTime();
        return (now - vTime) < 15000; // 15 seconds
      });

      newVerifications.forEach(v => {
        // Prevent duplicate alerts in state
        const exists = recentCashierNotifications.some(n => n.id === v.id);
        if (!exists) {
          const patName = getPatientName(v.patient_mrn);
          const notification = {
            id: v.id,
            patient_mrn: v.patient_mrn,
            patient_name: patName,
            invoice_no: v.invoice_no,
            status: v.payment_verified,
            date: v.date,
            type: v.type,
            amount: paymentRequests.find(pr => pr.patient_mrn === v.patient_mrn)?.radiology_bill_amount || '1500'
          };
          
          setRecentCashierNotifications(prev => [notification, ...prev].slice(0, 5));
          addToast('success', `🔔 CASHIER NOTIFICATION: Invoice #${v.invoice_no} for Patient MRN ${v.patient_mrn} has been VERIFIED & PAID!`);
        }
      });
    }
  }, [cashierVerifications, paymentRequests]);

  // Synchronize payment verification status to Radiology requests database records
  useEffect(() => {
    const syncPaidStatuses = async () => {
      for (const req of requests) {
        if (req.status === 'Pending' && req.patient_mrn && isPaymentPaid(req.patient_mrn)) {
          try {
            await updateDoc(doc(db, 'form_1_1_1_h', req.id), {
              status: 'Paid'
            });
            
            // Also update hospital_modules_submissions
            const matchingSubmissions = clinicalSubmissions.filter(s => 
              s.subsection_id === '1.1.1.h' && 
              ((s.patient_mrn && req.patient_mrn && s.patient_mrn.toLowerCase() === req.patient_mrn.toLowerCase()) || 
               (s.data && s.data.patient_mrn && req.patient_mrn && s.data.patient_mrn.toLowerCase() === req.patient_mrn.toLowerCase()))
            );
            for (const s of matchingSubmissions) {
              await updateDoc(doc(db, 'hospital_modules_submissions', s.id), {
                status: 'Paid'
              });
            }
          } catch (err) {
            console.error("Error updating status to Paid:", err);
          }
        }
      }
    };
    if (requests.length > 0 && (cashierVerifications.length > 0 || ledgerVerifications.length > 0)) {
      syncPaidStatuses();
    }
  }, [cashierVerifications, ledgerVerifications, requests, clinicalSubmissions]);

  // Handle Request Submission
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqMrn.trim()) {
      addToast('error', 'Please specify a Patient MRN.');
      return;
    }

    setIsSubmittingReq(true);
    try {
      const dateStr = new Date().toISOString();
      
      const formPayload = {
        hospital_id: hospitalId,
        patient_mrn: reqMrn,
        radiology_modality: reqModality,
        clinical_notes: reqNotes,
        date: dateStr,
        created_at: dateStr
      };

      // 1. Save to form_1_1_1_h (Outpatient)
      await addDoc(collection(db, 'form_1_1_1_h'), formPayload);

      // 2. Save to hospital_modules_submissions for unified clinical container
      await addDoc(collection(db, 'hospital_modules_submissions'), {
        hospital_id: hospitalId,
        module_id: 'Module-1',
        subsection_id: '1.1.1.h',
        subsection_name: '1.1.1.h Patient Radiology Investigation Request',
        submitted_at: dateStr,
        status: 'pending',
        data: {
          patient_mrn: reqMrn,
          patient_name: getPatientName(reqMrn),
          radiology_modality: reqModality,
          clinical_notes: reqNotes
        }
      });

      addToast('success', `✓ Radiology investigation ordered for MRN ${reqMrn} successfully.`);
      setReqMrn('');
      setMrnSearchTerm('');
      setReqNotes('');
      setCurrentSubTab('queue');
    } catch (err: any) {
      console.error(err);
      addToast('error', `Failed to submit request: ${err.message || 'unknown error'}`);
    } finally {
      setIsSubmittingReq(false);
    }
  };

  // Handle Report Submission
  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repMrn.trim()) {
      addToast('error', 'Please specify a Patient MRN.');
      return;
    }
    if (!repFindings.trim()) {
      addToast('error', 'Findings description is required.');
      return;
    }
    if (!repSubmittedBy.trim()) {
      addToast('error', 'Please specify who is submitting this report.');
      return;
    }

    setIsSubmittingRep(true);
    try {
      const dateStr = new Date().toISOString();
      
      const payload = {
        hospital_id: hospitalId,
        patient_mrn: repMrn,
        device_ref: repDevice,
        radiology_findings: repFindings,
        radiology_image: repImage || 'No',
        submitted_by: repSubmittedBy,
        date: dateStr,
        created_at: dateStr
      };

      // 1. Save to form_1_1_1_k
      await addDoc(collection(db, 'form_1_1_1_k'), payload);

      // 2. Save to hospital_modules_submissions for unified container
      await addDoc(collection(db, 'hospital_modules_submissions'), {
        hospital_id: hospitalId,
        module_id: 'Module-1',
        subsection_id: '1.1.1.k',
        subsection_name: '1.1.1.k Patient Radiology Report & Results',
        submitted_at: dateStr,
        status: 'completed',
        data: {
          patient_mrn: repMrn,
          patient_name: getPatientName(repMrn),
          device_ref: repDevice,
          radiology_findings: repFindings,
          radiology_image: repImage || 'No',
          submitted_by: repSubmittedBy
        }
      });

      addToast('success', `✓ Diagnostic imaging report saved for MRN ${repMrn}.`);
      setRepMrn('');
      setRepFindings('');
      setRepImage('');
      setRepSubmittedBy('');
      setCurrentSubTab('archive');
    } catch (err: any) {
      console.error(err);
      addToast('error', `Failed to save report: ${err.message || 'unknown error'}`);
    } finally {
      setIsSubmittingRep(false);
    }
  };

  // Handle Finance Payment Request Submission
  const handleCreatePaymentRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finMrn.trim()) {
      addToast('error', 'Please specify a Patient MRN.');
      return;
    }
    if (!finAmount || isNaN(Number(finAmount))) {
      addToast('error', 'Please specify a valid billing amount.');
      return;
    }

    setIsSubmittingFin(true);
    try {
      const dateStr = new Date().toISOString();
      
      if (finType === 'Outpatient') {
        const payload = {
          hospital_id: hospitalId,
          patient_mrn: finMrn,
          radiology_bill_amount: Number(finAmount),
          date: dateStr,
          created_at: dateStr
        };

        // 1. Create outpatient payment request Form 1.1.1.i
        await addDoc(collection(db, 'form_1_1_1_i'), payload);

        // 2. Save to clinical submission folder
        await addDoc(collection(db, 'hospital_modules_submissions'), {
          hospital_id: hospitalId,
          module_id: 'Module-1',
          subsection_id: '1.1.1.i',
          subsection_name: '1.1.1.i Patient Radiology Payment Request',
          submitted_at: dateStr,
          status: 'payment_requested',
          data: {
            patient_mrn: finMrn,
            patient_name: getPatientName(finMrn),
            radiology_bill_amount: Number(finAmount)
          }
        });

      } else {
        const payload = {
          hospital_id: hospitalId,
          patient_mrn: finMrn,
          inpatient_rad_bill: Number(finAmount),
          radiology_bill_amount: Number(finAmount),
          date: dateStr,
          created_at: dateStr
        };

        // 1. Create inpatient payment request Form 1.1.1.v.6
        await addDoc(collection(db, 'form_1_1_1_v_6'), payload);

        // 2. Save to clinical submission folder
        await addDoc(collection(db, 'hospital_modules_submissions'), {
          hospital_id: hospitalId,
          module_id: 'Module-1',
          subsection_id: '1.1.1.v.6',
          subsection_name: '1.1.1.v.6 Inpatient Radiology Payment Request Form',
          submitted_at: dateStr,
          status: 'payment_requested',
          data: {
            patient_mrn: finMrn,
            patient_name: getPatientName(finMrn),
            radiology_bill_amount: Number(finAmount)
          }
        });
      }

      // 3. Post also to target module notifications for Module 8 (Finance)
      await addDoc(collection(db, 'hospital_notifications'), {
        hospital_id: hospitalId,
        source_module: 'Radiology Imaging',
        target_module: 'Finance',
        type: 'RADIOLOGY_BILLING',
        message: `Billing Request sent: Patient MRN ${finMrn} has a pending Radiology fee of ETB ${finAmount}.`,
        created_at: dateStr,
        status: 'unread'
      });

      addToast('success', `✓ Payment request of ETB ${finAmount} successfully dispatched to Finance Department.`);
      setFinMrn('');
      setFinSearchTerm('');
    } catch (err: any) {
      console.error(err);
      addToast('error', `Failed to send payment request: ${err.message}`);
    } finally {
      setIsSubmittingFin(false);
    }
  };

  // Simulate Cashier payment completion
  const handleSimulateCashierPayment = async (pr: PaymentRequest) => {
    try {
      const dateStr = new Date().toISOString();
      const invoiceNum = `INV-${Math.floor(100000 + Math.random() * 900000)}`;

      if (pr.type === 'Outpatient') {
        const payload = {
          hospital_id: hospitalId,
          patient_mrn: pr.patient_mrn,
          invoice_no: invoiceNum,
          payment_verified: 'Paid',
          date: dateStr,
          created_at: dateStr
        };

        // Write to outpatient Cashier Verification (1.1.1.i.1)
        await addDoc(collection(db, 'form_1_1_1_i_1'), payload);

        // Log into clinical submissions
        await addDoc(collection(db, 'hospital_modules_submissions'), {
          hospital_id: hospitalId,
          module_id: 'Module-1',
          subsection_id: '1.1.1.i.1',
          subsection_name: '1.1.1.i.1 Cashier Radiology Payment Verification',
          submitted_at: dateStr,
          status: 'verified_paid',
          data: {
            patient_mrn: pr.patient_mrn,
            patient_name: getPatientName(pr.patient_mrn),
            invoice_no: invoiceNum,
            payment_verified: 'Paid'
          }
        });
      } else {
        const payload = {
          hospital_id: hospitalId,
          patient_mrn: pr.patient_mrn,
          invoice_no: invoiceNum,
          inpatient_invoice_no: invoiceNum,
          payment_verified: 'Yes',
          verified_paid: 'Yes',
          date: dateStr,
          created_at: dateStr
        };

        // Write to Inpatient Cashier Verification (1.1.1.v.7)
        await addDoc(collection(db, 'form_1_1_1_v_7'), payload);

        // Log into clinical submissions
        await addDoc(collection(db, 'hospital_modules_submissions'), {
          hospital_id: hospitalId,
          module_id: 'Module-1',
          subsection_id: '1.1.1.v.7',
          subsection_name: '1.1.1.v.7 Cashier Inpatient Radiology Paid Verification',
          submitted_at: dateStr,
          status: 'verified_paid',
          data: {
            patient_mrn: pr.patient_mrn,
            patient_name: getPatientName(pr.patient_mrn),
            invoice_no: invoiceNum,
            payment_verified: 'Yes'
          }
        });
      }

      addToast('success', `✓ Simulated payment completed by Cashier for MRN ${pr.patient_mrn}.`);
    } catch (err: any) {
      console.error(err);
      addToast('error', `Simulation failed: ${err.message}`);
    }
  };

  // Handle Deleting a Request
  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to dismiss this investigation request?')) return;
    try {
      await deleteDoc(doc(db, 'form_1_1_1_h', id));
      addToast('success', 'Investigation request dismissed successfully.');
    } catch (err: any) {
      console.error(err);
      addToast('error', `Dismiss failed: ${err.message}`);
    }
  };

  // Handle Deleting a Report
  const handleDeleteReport = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this radiology report?')) return;
    try {
      await deleteDoc(doc(db, 'form_1_1_1_k', id));
      addToast('success', 'Radiology diagnostic report deleted successfully.');
    } catch (err: any) {
      console.error(err);
      addToast('error', `Delete failed: ${err.message}`);
    }
  };

  // Interactive calibration simulation
  const handleCalibrateDevice = (deviceName: string) => {
    if (calibratingDevice) return;
    setCalibratingDevice(deviceName);
    setCalibrationProgress(0);
    addToast('info', `Initializing clinical diagnostic self-test on ${deviceName}...`);

    const interval = setInterval(() => {
      setCalibrationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setCalibratingDevice(null);
          setDeviceStatus(old => ({
            ...old,
            [deviceName]: {
              ...old[deviceName],
              uptime: '100.00%',
              temp: deviceName.includes('MRI') ? '4.1 K (Optimal)' : '24.1°C'
            }
          }));
          addToast('success', `✓ ${deviceName} has been calibrated successfully. All sensors active.`);
          return 100;
        }
        return prev + 10;
      });
    }, 250);
  };

  // Tiny Image Converter using HTML Canvas
  const processImageFile = (file: File, callback: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          callback(dataUrl);
        } else {
          callback(reader.result as string);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  // Helper to check if MRN has completed paid verification
  const isPaymentPaid = (mrn: string) => {
    if (!mrn) return false;
    const isPaidInCashier = cashierVerifications.some(v => v.patient_mrn && v.patient_mrn.toLowerCase() === mrn.toLowerCase() && (v.payment_verified === 'Paid' || v.payment_verified === 'Insurance Verified' || v.payment_verified === 'Exempted' || v.payment_verified === 'yes' || v.payment_verified === 'Yes'));
    const isPaidInLedger = ledgerVerifications.some(v => v.patient_mrn && v.patient_mrn.toLowerCase() === mrn.toLowerCase() && (v.payment_verified === 'Paid' || v.payment_verified === 'Verified' || v.payment_verified === 'verified'));
    return isPaidInCashier || isPaidInLedger;
  };

  // Helper to fetch matching paid verification record details
  const getPaidVerificationDetails = (mrn: string) => {
    if (!mrn) return undefined;
    const cashierDetail = cashierVerifications.find(v => v.patient_mrn && v.patient_mrn.toLowerCase() === mrn.toLowerCase());
    if (cashierDetail) return cashierDetail;
    return ledgerVerifications.find(v => v.patient_mrn && v.patient_mrn.toLowerCase() === mrn.toLowerCase());
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    if (!req.patient_mrn) return false;
    const matchesSearch = req.patient_mrn.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (req.clinical_notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModality = selectedModalityFilter === 'All' || 
                            (req.radiology_modality || '').toLowerCase().includes(selectedModalityFilter.toLowerCase());
    return matchesSearch && matchesModality;
  });

  // Filter reports
  const filteredReports = reports.filter(rep => {
    if (!rep.patient_mrn) return false;
    return rep.patient_mrn.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (rep.radiology_findings || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
           (rep.device_ref || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filter Clinical Submissions in Container (Codes 1.1.1.h to 1.1.1.v.8)
  const filteredClinicalSubmissions = clinicalSubmissions.filter(sub => {
    const matchesSearch = 
      (sub.patient_mrn || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.subsection_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.subsection_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(sub.data || {}).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCode = selectedClinicalCodeFilter === 'All' || sub.subsection_id === selectedClinicalCodeFilter;
    return matchesSearch && matchesCode;
  });

  // Helper to check if a request MRN has a completed report
  const isRequestResolved = (mrn: string) => {
    if (!mrn) return false;
    return reports.some(rep => rep.patient_mrn && rep.patient_mrn.toLowerCase() === mrn.toLowerCase());
  };

  // Get matching patient name
  const getPatientName = (mrn: string) => {
    if (!mrn) return 'Unknown Patient';
    const found = patients.find(p => p.patient_mrn && p.patient_mrn.toLowerCase() === mrn.toLowerCase());
    return found ? found.patient_name : 'Unknown Patient';
  };

  // Autocomplete patient dropdowns
  const filteredPatientsAutocomplete = patients.filter(p => {
    if (!p.patient_mrn || !p.patient_name) return false;
    const term = mrnSearchTerm.toLowerCase();
    return p.patient_mrn.toLowerCase().includes(term) || p.patient_name.toLowerCase().includes(term);
  });

  const filteredFinPatientsAutocomplete = patients.filter(p => {
    if (!p.patient_mrn || !p.patient_name) return false;
    const term = finSearchTerm.toLowerCase();
    return p.patient_mrn.toLowerCase().includes(term) || p.patient_name.toLowerCase().includes(term);
  });

  // One-click action to initiate billing/payment to Module 8 Finance for a completed report
  const handleInitiatePaymentForReport = async (patientMrn: string, isInpatient: boolean = false, amount: number = 1500) => {
    setInitiatingPaymentMrn(patientMrn);
    try {
      const dateStr = new Date().toISOString();
      const patientName = getPatientName(patientMrn);

      if (!isInpatient) {
        const payload = {
          hospital_id: hospitalId,
          patient_mrn: patientMrn,
          radiology_bill_amount: amount,
          date: dateStr,
          created_at: dateStr
        };

        // 1. Create outpatient payment request Form 1.1.1.i
        await addDoc(collection(db, 'form_1_1_1_i'), payload);

        // 2. Save to clinical submission folder
        await addDoc(collection(db, 'hospital_modules_submissions'), {
          hospital_id: hospitalId,
          module_id: 'Module-1',
          subsection_id: '1.1.1.i',
          subsection_name: '1.1.1.i Patient Radiology Payment Request',
          submitted_at: dateStr,
          status: 'payment_requested',
          data: {
            patient_mrn: patientMrn,
            patient_name: patientName,
            radiology_bill_amount: amount
          }
        });
      } else {
        const payload = {
          hospital_id: hospitalId,
          patient_mrn: patientMrn,
          inpatient_rad_bill: amount,
          radiology_bill_amount: amount,
          date: dateStr,
          created_at: dateStr
        };

        // 1. Create inpatient payment request Form 1.1.1.v.6
        await addDoc(collection(db, 'form_1_1_1_v_6'), payload);

        // 2. Save to clinical submission folder
        await addDoc(collection(db, 'hospital_modules_submissions'), {
          hospital_id: hospitalId,
          module_id: 'Module-1',
          subsection_id: '1.1.1.v.6',
          subsection_name: '1.1.1.v.6 Inpatient Radiology Payment Request Form',
          submitted_at: dateStr,
          status: 'payment_requested',
          data: {
            patient_mrn: patientMrn,
            patient_name: patientName,
            radiology_bill_amount: amount
          }
        });
      }

      // 3. Post also to target module notifications for Module 8 (Finance)
      await addDoc(collection(db, 'hospital_notifications'), {
        hospital_id: hospitalId,
        source_module: 'Radiology Imaging',
        target_module: 'Finance',
        type: 'RADIOLOGY_BILLING',
        message: `Billing Request sent: Patient MRN ${patientMrn} has a pending Radiology fee of ETB ${amount}.`,
        created_at: dateStr,
        status: 'unread'
      });

      // 4. Update corresponding Radiology record's status to 'Pending' until verified
      const matchingReqs = requests.filter(r => r.patient_mrn && patientMrn && r.patient_mrn.toLowerCase() === patientMrn.toLowerCase());
      for (const r of matchingReqs) {
        await updateDoc(doc(db, 'form_1_1_1_h', r.id), {
          status: 'Pending'
        });
      }

      const matchingSubmissions = clinicalSubmissions.filter(s => 
        s.subsection_id === '1.1.1.h' && 
        ((s.patient_mrn && patientMrn && s.patient_mrn.toLowerCase() === patientMrn.toLowerCase()) || 
         (s.data && s.data.patient_mrn && patientMrn && s.data.patient_mrn.toLowerCase() === patientMrn.toLowerCase()))
      );
      for (const s of matchingSubmissions) {
        await updateDoc(doc(db, 'hospital_modules_submissions', s.id), {
          status: 'Pending'
        });
      }

      addToast('success', `✓ Payment request of ETB ${amount} initiated to Finance Department for MRN ${patientMrn}.`);
    } catch (err: any) {
      console.error(err);
      addToast('error', `Failed to initiate payment: ${err.message}`);
    } finally {
      setInitiatingPaymentMrn(null);
    }
  };

  // Visual progress tracker component for a patient MRN
  const PatientProgressTracker = ({ mrn }: { mrn: string }) => {
    if (!mrn) return null;
    const hasRequest = requests.some(r => r.patient_mrn && r.patient_mrn.toLowerCase() === mrn.toLowerCase());
    const hasReport = reports.some(r => r.patient_mrn && r.patient_mrn.toLowerCase() === mrn.toLowerCase());
    const paymentReq = paymentRequests.find(p => p.patient_mrn && p.patient_mrn.toLowerCase() === mrn.toLowerCase());
    const isPaid = isPaymentPaid(mrn);

    let currentStep = 1; // 1: Request Received, 2: Imaging in Progress, 3: Report Generated, 4: Payment Pending / Verified
    if (hasRequest) {
      if (!hasReport) {
        currentStep = 2; // Imaging in Progress
      } else {
        if (!paymentReq) {
          currentStep = 3; // Report Generated
        } else if (!isPaid) {
          currentStep = 4; // Payment Pending
        } else {
          currentStep = 5; // Paid / Verified
        }
      }
    }

    const steps = [
      { label: 'Request Received', desc: 'Order entered', color: 'indigo' },
      { label: 'Imaging in Progress', desc: 'Scan active', color: 'blue' },
      { label: 'Report Generated', desc: 'Findings saved', color: 'purple' },
      { label: isPaid ? 'Paid / Verified' : 'Payment Pending', desc: isPaid ? 'Cashier confirmed' : (paymentReq ? 'Sent to Finance' : 'No Payment Yet'), color: isPaid ? 'emerald' : 'amber' }
    ];

    return (
      <div className="w-full bg-slate-50/75 border border-slate-150 p-4 rounded-xl mt-3.5 shadow-3xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <Activity size={12} className="text-indigo-500 animate-pulse" />
            Workflow Lifecycle Tracker
          </span>
          <span className="text-[9px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-full font-bold font-mono">
            {isPaid ? 'Verified Complete' : 'Active Track'}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            let status: 'completed' | 'active' | 'pending' = 'pending';

            if (idx === 3) {
              // Payment step
              if (isPaid) status = 'completed';
              else if (paymentReq) status = 'active';
              else status = 'pending';
            } else {
              if (currentStep > stepNum) {
                status = 'completed';
              } else if (currentStep === stepNum) {
                status = 'active';
              } else {
                status = 'pending';
              }
            }

            return (
              <div key={idx} className="flex items-center gap-2.5 relative">
                {/* Visual Step Marker */}
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 font-bold text-xs transition-all duration-300 ${
                  status === 'completed'
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : status === 'active'
                    ? idx === 3 && !isPaid
                      ? 'bg-amber-100 border-amber-500 text-amber-700 font-black scale-105 shadow-3xs animate-pulse'
                      : idx === 1
                      ? 'bg-blue-100 border-blue-500 text-blue-700 font-black scale-105 shadow-3xs animate-pulse'
                      : idx === 2
                      ? 'bg-purple-100 border-purple-500 text-purple-700 font-black scale-105 shadow-3xs animate-pulse'
                      : 'bg-indigo-100 border-indigo-500 text-indigo-700 font-black scale-105 shadow-3xs animate-pulse'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  {status === 'completed' ? (
                    <Check size={13} className="stroke-[3px]" />
                  ) : (
                    stepNum
                  )}
                </div>

                <div className="flex flex-col">
                  <span className={`text-[11px] font-black leading-none ${
                    status === 'completed'
                      ? 'text-emerald-700'
                      : status === 'active'
                      ? idx === 3 && !isPaid
                        ? 'text-amber-800'
                        : idx === 1
                        ? 'text-blue-800'
                        : idx === 2
                        ? 'text-purple-800'
                        : 'text-indigo-800'
                      : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold leading-none mt-1">
                    {step.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {setActiveTab && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-3 rounded-xl shadow-3xs">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Database size={14} className="text-gray-400" />
            <span>Currently viewing Radiology Section</span>
          </div>
          <button
            onClick={() => {
              sessionStorage.setItem('explorer_initial_entity', 'Form_1_1_1_2');
              setActiveTab('Data & Explorer');
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <ArrowRight size={14} className="rotate-180" />
            <span>Return to Data Explorer</span>
          </button>
        </div>
      )}

      {/* Page Title & Stats Banner */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-full h-1/2 bg-indigo-500/5 -skew-y-3 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-full border border-indigo-500/30">
                Imaging & Modality Center
              </span>
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Units Live
              </span>
              <span className="bg-purple-500/20 text-purple-300 text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-full border border-purple-500/30">
                clinical folder v1.1.1
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              <Cpu className="text-indigo-400 animate-pulse" size={28} />
              Radiology Department Hub
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Central clinical terminal to manage medical imaging scans, submit radiologist findings, calibrate MRI / CT scanners, and review high-resolution digital film printouts.
            </p>
          </div>
        </div>
      </div>

      <RadiologyDashboard 
        requests={requests} 
        reports={reports} 
        paymentRequests={paymentRequests} 
        cashierVerifications={cashierVerifications} 
        isPaymentPaid={isPaymentPaid} 
      />

      {/* Main Grid: Left is active view, Right is machine telemetry & cash notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Form & Lists Views (3/4 width) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Subsection Tabs */}
          <div className="flex bg-white border border-gray-200 p-1.5 rounded-xl gap-1 shadow-3xs overflow-x-auto">
            <button
              onClick={() => { setCurrentSubTab('queue'); setSearchQuery(''); }}
              className={`py-2 px-3 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                currentSubTab === 'queue'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Clock size={14} />
              Active Queue
              <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-bold ${currentSubTab === 'queue' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {requests.length}
              </span>
            </button>

            <button
              onClick={() => { setCurrentSubTab('archive'); setSearchQuery(''); }}
              className={`py-2 px-3 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                currentSubTab === 'archive'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Database size={14} />
              Completed Reports
              <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-bold ${currentSubTab === 'archive' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {reports.length}
              </span>
            </button>

            {/* Universal Clinical Folder Container */}
            <button
              onClick={() => { setCurrentSubTab('clinical_folder'); setSearchQuery(''); }}
              className={`py-2 px-3 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                currentSubTab === 'clinical_folder'
                  ? 'bg-indigo-900 text-white shadow-sm'
                  : 'text-indigo-600 hover:text-indigo-950 hover:bg-indigo-50/50'
              }`}
            >
              <Layers size={14} />
              Universal EHR Folder (1.1.1)
              <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-bold ${currentSubTab === 'clinical_folder' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                {clinicalSubmissions.length}
              </span>
            </button>

            {/* Finance Tab */}
            <button
              onClick={() => { setCurrentSubTab('finance'); setSearchQuery(''); }}
              className={`py-2 px-3 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                currentSubTab === 'finance'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-emerald-600 hover:text-emerald-950 hover:bg-emerald-50'
              }`}
            >
              <DollarSign size={14} />
              Finance & Payments
              <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-bold ${currentSubTab === 'finance' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                {paymentRequests.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentSubTab('request')}
              className={`py-2 px-3 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                currentSubTab === 'request'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Plus size={14} />
              Scan Request
            </button>

            <button
              onClick={() => setCurrentSubTab('report')}
              className={`py-2 px-3 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                currentSubTab === 'report'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Camera size={14} />
              Findings Report
            </button>
          </div>

          {/* SEARCH & FILTERS PANEL (for Queue, Archive, Clinical, Finance) */}
          {(currentSubTab === 'queue' || currentSubTab === 'archive' || currentSubTab === 'clinical_folder' || currentSubTab === 'finance') && (
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-3xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Patient MRN, findings, codes, data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 rounded-lg transition-all font-semibold"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 font-bold text-xs">&times;</button>
                )}
              </div>

              {currentSubTab === 'queue' && (
                <div className="flex gap-1.5 items-center w-full sm:w-auto">
                  <span className="text-[10px] font-black uppercase text-gray-400">Filter Modality:</span>
                  <select
                    value={selectedModalityFilter}
                    onChange={(e) => setSelectedModalityFilter(e.target.value)}
                    className="py-1.5 px-3 border border-gray-200 bg-white rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="All">All Modalities</option>
                    <option value="X-Ray">X-Ray Only</option>
                    <option value="Ultrasound">Ultrasound Only</option>
                    <option value="CT">CT Scan Only</option>
                    <option value="MRI">MRI Only</option>
                  </select>
                </div>
              )}

              {currentSubTab === 'clinical_folder' && (
                <div className="flex gap-1.5 items-center w-full sm:w-auto">
                  <span className="text-[10px] font-black uppercase text-indigo-400">EHR Subform Code:</span>
                  <select
                    value={selectedClinicalCodeFilter}
                    onChange={(e) => setSelectedClinicalCodeFilter(e.target.value)}
                    className="py-1.5 px-3 border border-gray-200 bg-white rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="All">All Form Codes (1.1.1.h-z.4)</option>
                    <option value="1.1.1.h">1.1.1.h Outpatient Scan Request</option>
                    <option value="1.1.1.i">1.1.1.i Outpatient Finance Request</option>
                    <option value="1.1.1.i.1">1.1.1.i.1 Outpatient Cashier Verification</option>
                    <option value="1.1.1.k">1.1.1.k Outpatient Diagnostic Report</option>
                    <option value="1.1.1.v.5">1.1.1.v.5 Inpatient Scan Request</option>
                    <option value="1.1.1.v.6">1.1.1.v.6 Inpatient Finance Request</option>
                    <option value="1.1.1.v.7">1.1.1.v.7 Inpatient Cashier Verification</option>
                    <option value="1.1.1.v.8">1.1.1.v.8 Inpatient Diagnostic Report</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* MAIN SUBTAB CONTENTS */}
          {currentSubTab === 'queue' && (
            <div className="space-y-3">
              {filteredRequests.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-3xs">
                  <Clock size={36} className="mx-auto text-gray-300 mb-2 animate-pulse" />
                  <p className="text-xs font-bold text-gray-500">No active scanning requests match your filter.</p>
                  <p className="text-[10px] text-gray-400 mt-1">Submit a new request or adjust search parameters.</p>
                </div>
              ) : (
                filteredRequests.map(req => {
                  const resolved = isRequestResolved(req.patient_mrn);
                  const patientName = getPatientName(req.patient_mrn);
                  const isPaid = isPaymentPaid(req.patient_mrn);
                  const paymentDetails = getPaidVerificationDetails(req.patient_mrn);

                  return (
                    <div 
                      key={req.id} 
                      onClick={() => setSelectedMrn(req.patient_mrn)}
                      className={`bg-white border hover:border-indigo-300 rounded-xl p-4 shadow-3xs transition-all relative flex flex-col gap-3 cursor-pointer ${selectedMrn === req.patient_mrn ? 'border-indigo-600 bg-indigo-50/10 ring-1 ring-indigo-600' : 'border-gray-200'}`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-black text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md shadow-3xs">
                              {req.patient_mrn}
                            </span>
                            <span className="font-bold text-gray-700 text-xs">{patientName}</span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                              resolved 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                                : 'bg-amber-50 text-amber-700 border-amber-150 animate-pulse'
                            }`}>
                              {resolved ? '✓ Diagnosis Complete' : '⏳ Scanning Pending'}
                            </span>

                            {/* Cashier Payment Badge Status */}
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              <DollarSign size={10} />
                              {isPaid ? `Paid (INV #${paymentDetails?.invoice_no})` : 'Unpaid at Cashier'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600 pt-1">
                            <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded font-mono">
                              {req.radiology_modality}
                            </span>
                            <span className="text-gray-400 flex items-center gap-1 font-normal font-mono">
                              <Clock size={11} />
                              {req.date ? new Date(req.date).toLocaleString() : 'N/A'}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 mt-2 italic">
                            " {req.clinical_notes || 'No clinical context specified.'} "
                          </p>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto self-end sm:self-center shrink-0">
                          {/* Only allow report writing once payment is completed, or show a warning */}
                          {!resolved && (
                            <button
                              onClick={() => {
                                if (!isPaid && !window.confirm(`⚠️ WARNING: Cashier payment verification is still pending for MRN ${req.patient_mrn}. Proceeding to report writing anyway?`)) {
                                  return;
                                }
                                setRepMrn(req.patient_mrn);
                                if (req.radiology_modality.includes('MRI')) setRepDevice('MRI GE Signa 1.5T');
                                else if (req.radiology_modality.includes('CT')) setRepDevice('CT Somatom 64');
                                else if (req.radiology_modality.includes('Ultrasound')) setRepDevice('Mindray Resona Sonography');
                                else setRepDevice('Digital X-Ray Unit A');
                                
                                setCurrentSubTab('report');
                              }}
                              className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-xs font-extrabold text-white transition-all shadow-3xs cursor-pointer flex items-center justify-center gap-1 ${
                                isPaid ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-700 hover:bg-slate-800'
                              }`}
                            >
                              <Camera size={13} />
                              Write Findings
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRequest(req.id)}
                            className="py-1.5 px-2 bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-150 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Dismiss Scan Request"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Render Visual Progress Tracker */}
                      <PatientProgressTracker mrn={req.patient_mrn} />
                    </div>
                  );
                })
              )}
            </div>
          )}

          {currentSubTab === 'archive' && (
            <div className="space-y-3">
              {filteredReports.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-3xs">
                  <Database size={36} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-xs font-bold text-gray-500">No completed radiology reports available.</p>
                  <p className="text-[10px] text-gray-400 mt-1">Submit a diagnostic report under the "Write Report" tab.</p>
                </div>
              ) : (
                filteredReports.map(rep => {
                  const patientName = getPatientName(rep.patient_mrn);
                  const hasImage = rep.radiology_image && rep.radiology_image !== 'No';
                  const paymentReq = paymentRequests.find(p => p.patient_mrn && rep.patient_mrn && p.patient_mrn.toLowerCase() === rep.patient_mrn.toLowerCase());
                  const isPaid = rep.patient_mrn ? isPaymentPaid(rep.patient_mrn) : false;
                  const isInpatient = paymentReq?.type === 'Inpatient' || (rep.patient_mrn ? clinicalSubmissions.some(sub => sub.patient_mrn && sub.patient_mrn.toLowerCase() === rep.patient_mrn.toLowerCase() && sub.subsection_id === '1.1.1.v.5') : false);

                  return (
                    <div 
                      key={rep.id} 
                      onClick={() => setSelectedMrn(rep.patient_mrn)}
                      className={`bg-white border hover:border-indigo-300 rounded-xl p-4 shadow-3xs transition-all relative flex flex-col gap-4 cursor-pointer ${selectedMrn === rep.patient_mrn ? 'border-indigo-600 bg-indigo-50/10 ring-1 ring-indigo-600' : 'border-gray-200'}`}
                    >
                      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                              {rep.patient_mrn}
                            </span>
                            <span className="font-bold text-gray-700 text-xs">{patientName}</span>
                            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 font-mono">
                              Device: {rep.device_ref}
                            </span>
                            {rep.submitted_by && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 font-mono">
                                • By: {rep.submitted_by}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-1 font-mono pt-0.5">
                            <CheckCircle2 size={12} />
                            <span>Radiology Report Completed</span>
                            {rep.date && (
                              <span className="text-gray-400 font-normal ml-2">
                                {new Date(rep.date).toLocaleString()}
                              </span>
                            )}
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-150 mt-3">
                            <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Radiologist Findings:</span>
                            <p className="text-xs text-gray-700 font-medium whitespace-pre-line leading-relaxed">
                              {rep.radiology_findings}
                            </p>
                          </div>
                        </div>

                        {/* Film Thumbnail and Actions */}
                        <div className="flex flex-col sm:flex-row md:flex-col items-center gap-3 shrink-0 self-stretch justify-between pt-1 md:pt-0">
                          {hasImage ? (
                            <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-slate-100 shadow-3xs w-28 h-28 flex items-center justify-center">
                              <img 
                                src={rep.radiology_image} 
                                alt="Film Capture" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <button
                                onClick={() => setSelectedFilmImage(rep.radiology_image || null)}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                              >
                                <Eye size={12} />
                                View Film
                              </button>
                            </div>
                          ) : (
                            <div className="border border-dashed border-gray-200 rounded-lg p-3 text-center bg-gray-50/50 w-28 h-28 flex flex-col justify-center items-center">
                              <Camera size={16} className="text-gray-300 mb-1" />
                              <span className="text-[9px] font-semibold text-gray-400 leading-none">No Film Printout</span>
                            </div>
                          )}

                          <button
                            onClick={() => handleDeleteReport(rep.id)}
                            className="w-full py-1.5 px-3 bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-150 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer text-[10px] font-extrabold flex items-center justify-center gap-1.5"
                          >
                            <Trash2 size={12} />
                            Delete Report
                          </button>
                        </div>
                      </div>

                      {/* Billing and Finance Action Section */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-slate-400">Billing Status:</span>
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-3xs">
                              <Check size={10} className="stroke-[3px]" />
                              Paid / Verified
                            </span>
                          ) : paymentReq ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full animate-pulse shadow-3xs">
                              <Clock size={10} />
                              Pending Cashier Confirmation
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-3xs">
                              No Billing Dispatched
                            </span>
                          )}
                        </div>

                        {!isPaid && !paymentReq && (
                          <button
                            onClick={() => handleInitiatePaymentForReport(rep.patient_mrn, isInpatient, 1500)}
                            disabled={initiatingPaymentMrn === rep.patient_mrn}
                            className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-extrabold transition-all shadow-3xs cursor-pointer flex items-center gap-1"
                          >
                            {initiatingPaymentMrn === rep.patient_mrn ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <DollarSign size={12} />
                            )}
                            <span>Initiate Payment Request</span>
                          </button>
                        )}
                      </div>

                      {/* Render Visual Progress Tracker */}
                      <PatientProgressTracker mrn={rep.patient_mrn} />
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* UNIVERSAL EHR CLINICAL FOLDER CONTAINER VIEW */}
          {currentSubTab === 'clinical_folder' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl flex items-start gap-3">
                <Layers className="text-indigo-600 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Universal Clinical EHR Folder Container (1.1.1.a - 1.1.1.z.4)</h4>
                  <p className="text-[11px] text-indigo-700 leading-relaxed mt-1">
                    This clinical drawer monitors and aggregates all radiological records, submissions, requests, and verified invoices entered under subforms 1.1.1.h, 1.1.1.i, 1.1.1.i.1, 1.1.1.k, and Inpatient equivalents.
                  </p>
                </div>
              </div>

              {filteredClinicalSubmissions.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-3xs">
                  <Layers size={36} className="mx-auto text-indigo-300 mb-2 animate-pulse" />
                  <p className="text-xs font-bold text-gray-500">No consolidated clinical directory submissions found.</p>
                  <p className="text-[10px] text-gray-400 mt-1">Form submissions in other parts of the clinic will sync here automatically.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredClinicalSubmissions.map(sub => {
                    return (
                      <div key={sub.id} className="bg-white border border-slate-200 hover:border-indigo-200 rounded-xl p-4 shadow-3xs transition-all">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-2 mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] font-black text-white bg-indigo-600 px-2.5 py-0.5 rounded-full shadow-3xs uppercase tracking-wide">
                              {sub.subsection_id}
                            </span>
                            <span className="text-xs font-black text-slate-800">
                              {sub.subsection_name}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1 font-semibold">
                            <Clock size={11} />
                            {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'N/A'}
                          </span>
                        </div>

                        {/* Submission Metadata Schema Display */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-400 font-semibold font-mono">Patient MRN:</span>
                              <strong className="text-slate-800 bg-slate-100 px-2 py-0.2 rounded font-mono font-black">{sub.data?.patient_mrn || 'N/A'}</strong>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-400 font-semibold">Patient Name:</span>
                              <strong className="text-slate-700 font-bold">{sub.data?.patient_name || getPatientName(sub.data?.patient_mrn || '')}</strong>
                            </div>
                            {sub.data?.radiology_modality && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-400 font-semibold">Scan Modality:</span>
                                <strong className="text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded font-black">{sub.data.radiology_modality}</strong>
                              </div>
                            )}
                            {sub.data?.radiology_bill_amount && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-400 font-semibold">Finance Charge:</span>
                                <strong className="text-emerald-700 font-mono font-black">ETB {sub.data.radiology_bill_amount}</strong>
                              </div>
                            )}
                          </div>

                          {/* Secondary detailed data block */}
                          <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-150 text-xs space-y-1">
                            {sub.data?.clinical_notes && (
                              <div>
                                <span className="text-[10px] font-black uppercase text-gray-400 block">Indications:</span>
                                <p className="text-gray-600 font-medium italic">" {sub.data.clinical_notes} "</p>
                              </div>
                            )}
                            {sub.data?.radiology_findings && (
                              <div>
                                <span className="text-[10px] font-black uppercase text-gray-400 block">Observations & Findings:</span>
                                <p className="text-gray-700 font-medium whitespace-pre-line leading-relaxed font-serif">{sub.data.radiology_findings}</p>
                              </div>
                            )}
                            {sub.data?.invoice_no && (
                              <div className="flex justify-between items-center text-[10px] pt-1">
                                <span className="text-gray-400 font-extrabold uppercase">Invoice Ref:</span>
                                <span className="font-mono font-black text-slate-800">{sub.data.invoice_no}</span>
                              </div>
                            )}
                            {sub.data?.payment_verified && (
                              <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-100 mt-1">
                                <span className="text-gray-400 font-extrabold uppercase">Cashier Status:</span>
                                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">{sub.data.payment_verified}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Image attachment if exists in EHR submissions */}
                        {sub.data?.radiology_image && sub.data.radiology_image !== 'No' && (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Scan Printout:</span>
                            <button
                              onClick={() => setSelectedFilmImage(sub.data.radiology_image)}
                              className="py-1 px-3 bg-slate-900 text-indigo-300 hover:text-white rounded-lg transition-colors text-[10px] font-black flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={12} />
                              Open DICOM Lightbox
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* FINANCE & PAYMENTS DASHBOARD - DIRECT MODULE 8 FINANCE INTEGRATION */}
          {currentSubTab === 'finance' && (
            <div className="space-y-6">
              
              {/* Informative alert box explaining how the direct integration works */}
              <div className="bg-emerald-50 border border-emerald-150 rounded-2xl p-4 flex gap-3.5 items-start">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0 shadow-3xs">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">Direct Finance & Cashier Integration Terminal</h4>
                  <p className="text-[11px] text-emerald-800 leading-relaxed mt-1">
                    Send radiology billing requests instantly to <strong>Finance Department</strong>. The Cashier department processes these claims. Once paid, the system receives a real-time completion webhook/transaction, changing the status badge instantly and notifying current staff.
                  </p>
                </div>
              </div>

              {/* Grid layout: Left is Dispatch Form, Right is Recent cashier verification alerts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Send Payment Request Dispatcher */}
                <div className="md:col-span-1 bg-white border border-gray-200 rounded-2xl p-5 shadow-3xs space-y-4">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Plus size={14} className="text-emerald-600" />
                      <span>Send Billing Invoice</span>
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Dispatches radiology fees directly to Cashier queue.</p>
                  </div>

                  <form onSubmit={handleCreatePaymentRequest} className="space-y-3.5">
                    
                    {/* MRN Lookup field */}
                    <div className="relative">
                      <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Patient MRN*</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search or enter MRN..."
                          value={finSearchTerm}
                          onChange={(e) => {
                            setFinSearchTerm(e.target.value);
                            setFinMrn(e.target.value);
                            setShowFinDropdown(true);
                          }}
                          onFocus={() => setShowFinDropdown(true)}
                          className="w-full py-2 pl-3 pr-10 text-xs border border-gray-200 rounded-lg font-semibold bg-gray-50/50 focus:bg-white focus:outline-none"
                          required
                        />
                        <div className="absolute right-3 top-2.5">
                          <Search size={14} className="text-gray-400" />
                        </div>
                      </div>

                      {/* Dropdown list */}
                      {showFinDropdown && finSearchTerm && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-40 overflow-y-auto divide-y divide-gray-50">
                          {filteredFinPatientsAutocomplete.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setFinMrn(p.patient_mrn);
                                setFinSearchTerm(`${p.patient_mrn} - ${p.patient_name}`);
                                setShowFinDropdown(false);
                              }}
                              className="w-full text-left p-2 text-xs hover:bg-slate-50 flex justify-between items-center cursor-pointer"
                            >
                              <div>
                                <span className="font-mono font-black text-slate-800 mr-2">{p.patient_mrn}</span>
                                <span className="font-bold text-gray-700">{p.patient_name}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Radiology Service Fee (ETB)*</label>
                      <select
                        value={finAmount}
                        onChange={(e) => setFinAmount(e.target.value)}
                        className="w-full py-2 px-3 border border-gray-200 rounded-lg text-xs font-bold bg-white focus:outline-none"
                      >
                        <option value="450">Standard X-Ray PA - 450 ETB</option>
                        <option value="950">Focused Sonography - 950 ETB</option>
                        <option value="1500">Brain CT Scan (Non-Contrast) - 1,500 ETB</option>
                        <option value="4500">Magnetic Resonance MRI - 4,500 ETB</option>
                        <option value="2500">Contrast Computed Tomography - 2,500 ETB</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Admissions Category*</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFinType('Outpatient')}
                          className={`py-2 px-3 text-xs font-extrabold rounded-lg border cursor-pointer transition-all ${
                            finType === 'Outpatient'
                              ? 'bg-slate-900 border-slate-900 text-white shadow-3xs'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Outpatient (1.1.1.i)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFinType('Inpatient')}
                          className={`py-2 px-3 text-xs font-extrabold rounded-lg border cursor-pointer transition-all ${
                            finType === 'Inpatient'
                              ? 'bg-slate-900 border-slate-900 text-white shadow-3xs'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Inpatient (1.1.1.v.6)
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingFin}
                      className="w-full py-2 px-4 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 transition-all shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                      {isSubmittingFin ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <ArrowRight size={13} />
                      )}
                      Dispatch to Cashier
                    </button>
                  </form>
                </div>

                {/* Real-time cashier notification drawer */}
                <div className="md:col-span-2 bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="font-extrabold text-xs uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                        <Bell className="animate-bounce" size={14} />
                        <span>Live Cashier Verification Alerts</span>
                      </h3>
                      <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-bold font-mono">
                        Webhook Status: Listening
                      </span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {recentCashierNotifications.length === 0 ? (
                        <div className="py-8 text-center space-y-1.5">
                          <ShieldCheck size={28} className="mx-auto text-slate-700" />
                          <p className="text-[11px] text-slate-400 font-bold">No active cashier payments verified recently.</p>
                          <p className="text-[9px] text-slate-500">Sent invoices awaiting patient processing at Cashier counter.</p>
                        </div>
                      ) : (
                        recentCashierNotifications.map(notif => (
                          <div key={notif.id} className="bg-slate-950 border border-emerald-500/20 rounded-xl p-3 flex justify-between items-center gap-4 transition-all animate-fadeIn">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 rounded-md font-extrabold font-mono">
                                  {notif.type} Verified
                                </span>
                                <span className="font-mono text-xs font-black text-white">{notif.patient_mrn}</span>
                              </div>
                              <p className="text-xs font-bold text-slate-200">
                                {notif.patient_name} Paid radiology fees of <strong className="text-emerald-400 font-mono">ETB {notif.amount}</strong>
                              </p>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-semibold">
                                <span>Invoice: #{notif.invoice_no}</span>
                                <span>•</span>
                                <span className="font-mono">{new Date(notif.date).toLocaleTimeString()}</span>
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                              <CheckCircle2 size={16} />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-400 leading-relaxed font-semibold">
                    💡 Verified payments automatically release the patient's queue card to "Proceed to Scanning Room" status.
                  </div>
                </div>

              </div>

              {/* LIST OF DISPATCHED BILLING INVOICES */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-gray-150 pb-2">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-500">
                    Dispatched Billing Records & Verification Queue
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold">Total Invoices: {paymentRequests.length}</span>
                </div>

                {paymentRequests.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-3xs">
                    <FileSpreadsheet size={28} className="mx-auto text-gray-300 mb-1.5" />
                    <p className="text-xs font-bold text-gray-500">No radiology payment records dispatched yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paymentRequests.map(pr => {
                      const isPaid = isPaymentPaid(pr.patient_mrn);
                      const paymentDetails = getPaidVerificationDetails(pr.patient_mrn);

                      return (
                        <div key={pr.id} className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-4 shadow-3xs transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-black text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                                {pr.patient_mrn}
                              </span>
                              <span className="font-bold text-gray-700 text-xs">{getPatientName(pr.patient_mrn)}</span>
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.2 rounded font-mono border ${
                                pr.type === 'Inpatient' 
                                  ? 'bg-purple-50 text-purple-700 border-purple-150' 
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-150'
                              }`}>
                                {pr.type} Subform {pr.type === 'Inpatient' ? '1.1.1.v.6' : '1.1.1.i'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 pt-1">
                              <span>Fee Amount: <strong className="text-emerald-700 font-mono font-black">ETB {pr.radiology_bill_amount}</strong></span>
                              <span>•</span>
                              <span className="font-mono text-gray-400">{new Date(pr.date).toLocaleString()}</span>
                            </div>

                            {/* Completed cashier verification details if verified */}
                            {isPaid && paymentDetails && (
                              <div className="bg-emerald-50/50 text-emerald-800 text-[11px] font-bold p-2 rounded-lg border border-emerald-150 mt-2 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 size={12} className="text-emerald-600" />
                                  <span>Cashier Invoice verified successfully</span>
                                </div>
                                <span className="font-mono font-black uppercase text-emerald-950 text-[10px]">
                                  INV: {paymentDetails.invoice_no} ({paymentDetails.payment_verified})
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="shrink-0">
                            {isPaid ? (
                              <div className="flex items-center gap-1.5 py-1.5 px-3 bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs rounded-lg shadow-3xs">
                                <Check size={14} />
                                <span>Paid Completed</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleSimulateCashierPayment(pr)}
                                className="py-1.5 px-3.5 bg-slate-900 hover:bg-emerald-850 text-slate-100 hover:text-white border border-slate-850 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-3xs hover:scale-[1.02]"
                              >
                                <RefreshCw size={12} className="animate-pulse" />
                                <span>Simulate Cashier Payment</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {currentSubTab === 'request' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-5">
                <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">Order Radiology Investigation</h3>
                  <p className="text-xs text-gray-400">Request a scanning modality for an inpatient or outpatient registration.</p>
                </div>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-4">
                {/* Searchable Patient MRN selection */}
                <div className="relative">
                  <label className="text-xs font-bold text-gray-700 block mb-1">Select Patient MRN*</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search MRN or Patient Name..."
                      value={mrnSearchTerm}
                      onChange={(e) => {
                        setMrnSearchTerm(e.target.value);
                        setReqMrn(e.target.value);
                        setShowMrnDropdown(true);
                      }}
                      onFocus={() => setShowMrnDropdown(true)}
                      className="w-full py-2 pl-3 pr-10 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                      required
                    />
                    <div className="absolute right-3 top-2.5 flex items-center gap-1">
                      {reqMrn && (
                        <button
                          type="button"
                          onClick={() => {
                            setReqMrn('');
                            setMrnSearchTerm('');
                          }}
                          className="text-gray-400 hover:text-gray-600 font-bold text-xs"
                        >
                          &times;
                        </button>
                      )}
                      <Search size={14} className="text-gray-400" />
                    </div>
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showMrnDropdown && mrnSearchTerm && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-gray-50">
                      {filteredPatientsAutocomplete.length === 0 ? (
                        <div className="p-3 text-center text-xs text-gray-400">
                          No matching patients found. Keep typing to create new entry.
                        </div>
                      ) : (
                        filteredPatientsAutocomplete.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setReqMrn(p.patient_mrn);
                              setMrnSearchTerm(`${p.patient_mrn} - ${p.patient_name}`);
                              setShowMrnDropdown(false);
                            }}
                            className="w-full text-left p-2.5 text-xs hover:bg-slate-50 transition-colors flex justify-between items-center cursor-pointer"
                          >
                            <div>
                              <span className="font-mono font-black text-slate-800 mr-2">{p.patient_mrn}</span>
                              <span className="font-bold text-gray-700">{p.patient_name}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded font-mono">
                              {p.patient_age} yrs, {p.patient_sex}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Modality Required*</label>
                  <select
                    value={reqModality}
                    onChange={(e) => setReqModality(e.target.value)}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="Chest X-Ray PA">Chest X-Ray PA</option>
                    <option value="Abdominal Ultrasound">Abdominal/Pelvic Ultrasound</option>
                    <option value="Pelvic Ultrasound">Pelvic Ultrasound Only</option>
                    <option value="Brain CT Scan">Brain CT Scan (Non-Contrast)</option>
                    <option value="MRI">Magnetic Resonance Imaging (MRI)</option>
                    <option value="Orthopedic Extremity X-Ray">Orthopedic Extremity X-Ray</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Clinical Context / Indication Notes</label>
                  <textarea
                    placeholder="Enter patient symptoms, relevant history, and clinical indications for this scan..."
                    value={reqNotes}
                    onChange={(e) => setReqNotes(e.target.value)}
                    rows={4}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentSubTab('queue')}
                    className="py-2 px-4 rounded-xl text-xs font-bold border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReq}
                    className="py-2 px-5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-3xs cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmittingReq && <RefreshCw size={13} className="animate-spin" />}
                    Submit Order
                  </button>
                </div>
              </form>
            </div>
          )}

          {currentSubTab === 'report' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-5">
                <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Camera size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">Write Diagnostic Report & Attach Film</h3>
                  <p className="text-xs text-gray-400">Log radiologist observations, clinical findings, and upload scanner visual film printouts.</p>
                </div>
              </div>

              <form onSubmit={handleCreateReport} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Patient MRN*</label>
                    <input
                      type="text"
                      placeholder="MRN-XXXX"
                      value={repMrn}
                      onChange={(e) => setRepMrn(e.target.value)}
                      className="w-full py-2 px-3 border border-gray-200 rounded-lg text-xs font-mono font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      required
                    />
                    <span className="text-[10px] text-gray-400 mt-0.5 block">{getPatientName(repMrn)}</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Diagnostic Modality Unit*</label>
                    <select
                      value={repDevice}
                      onChange={(e) => setRepDevice(e.target.value)}
                      className="w-full py-2 px-3 border border-gray-200 rounded-lg text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="Digital X-Ray Unit A">Digital X-Ray Unit A</option>
                      <option value="CT Somatom 64">CT Somatom 64</option>
                      <option value="MRI GE Signa 1.5T">MRI GE Signa 1.5T</option>
                      <option value="Mindray Resona Sonography">Mindray Resona Sonography</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Radiologist Findings Description*</label>
                  <textarea
                    placeholder="Enter detailed radiological findings description (bony structures, soft tissues, abnormalities, impressions)..."
                    value={repFindings}
                    onChange={(e) => setRepFindings(e.target.value)}
                    rows={5}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Submitted By (Radiologist Name)*</label>
                  <input
                    type="text"
                    required
                    value={repSubmittedBy}
                    onChange={(e) => setRepSubmittedBy(e.target.value)}
                    placeholder="e.g. Dr. Radiologist Name"
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                {/* Film Image Capture Component with Camera & Upload support */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Attach Radiology Film Capture*</label>
                  <div className="space-y-3 bg-gray-50/50 border border-gray-200 p-4 rounded-xl">
                    <div className="flex gap-3">
                      {/* Capture from device camera */}
                      <label className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-950 rounded-xl transition-all shadow-3xs text-xs font-black cursor-pointer">
                        <Camera size={14} className="text-indigo-500" />
                        <span>Take Picture</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              processImageFile(file, (dataUrl) => setRepImage(dataUrl));
                            }
                          }}
                        />
                      </label>

                      {/* Upload file directly */}
                      <label className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-950 rounded-xl transition-all shadow-3xs text-xs font-black cursor-pointer">
                        <Upload size={14} className="text-purple-500" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              processImageFile(file, (dataUrl) => setRepImage(dataUrl));
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Preview Area */}
                    {repImage ? (
                      <div className="relative border border-dashed border-gray-200 rounded-xl p-3 bg-white flex flex-col items-center gap-2">
                        <img
                          src={repImage}
                          alt="Diagnostic Film Preview"
                          className="max-h-48 object-contain rounded-lg shadow-3xs"
                        />
                        <div className="flex items-center justify-between w-full px-2">
                          <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            Film Attached successfully
                          </span>
                          <button
                            type="button"
                            onClick={() => setRepImage('')}
                            className="text-[10px] font-extrabold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                          >
                            Remove Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-200 rounded-xl py-6 px-4 bg-white text-center">
                        <Camera size={24} className="mx-auto text-gray-300 mb-1.5" />
                        <p className="text-[11px] text-gray-400 font-bold">No digital film file attached yet.</p>
                        <p className="text-[10px] text-gray-400">Capture using your device's camera or select an image file.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentSubTab('queue')}
                    className="py-2 px-4 rounded-xl text-xs font-bold border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRep}
                    className="py-2 px-5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-3xs cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmittingRep && <RefreshCw size={13} className="animate-spin" />}
                    Save Diagnostic Report
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Right Column: Imaging Modality Telemetry & Calibration (1/4 width) */}
        <div className="space-y-4">
          {selectedMrn && (
            <PatientClinicalFolderViewer 
              patientMrn={selectedMrn}
              patientName={getPatientName(selectedMrn) || 'Unknown'}
              sourceModule="Radiology"
              autoLogText={`Radiology clinical record review/update for patient MRN ${selectedMrn}.`}
              appendButtonLabel="Log Radiology Note"
            />
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-3xs space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Cpu size={14} className="text-indigo-500" />
                <span>Modality Instruments</span>
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Physical status and health calibration metrics.</p>
            </div>

            <div className="space-y-3">
              {(Object.entries(deviceStatus) as [string, any][]).map(([name, data]) => {
                const isCalibrating = calibratingDevice === name;
                return (
                  <div key={name} className="bg-gray-50/50 border border-gray-150 p-3 rounded-xl space-y-2">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[11px] font-extrabold text-gray-700 leading-tight">{name}</span>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.2 rounded font-black font-mono shrink-0">
                        {data.uptime}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-500">
                      <span>Status: <strong className="text-gray-800 font-bold">{data.status}</strong></span>
                      <span className="font-mono">{data.temp}</span>
                    </div>

                    {isCalibrating ? (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[9px] font-bold text-indigo-600">
                          <span>Calibrating...</span>
                          <span>{calibrationProgress}%</span>
                        </div>
                        <div className="h-1 w-full bg-indigo-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 transition-all duration-300" 
                            style={{ width: `${calibrationProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCalibrateDevice(name)}
                        disabled={!!calibratingDevice}
                        className="w-full mt-1.5 py-1 text-[9px] font-extrabold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 bg-white border border-gray-200 hover:border-indigo-100 rounded-lg transition-all text-center cursor-pointer uppercase tracking-wider disabled:opacity-50"
                      >
                        Run Modality Calibration
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clinical Code Guide Info Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-3xs space-y-3">
            <div className="border-b border-gray-100 pb-2">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <FileText size={13} className="text-indigo-500" />
                EHR Schema Codes (1.1.1)
              </h4>
            </div>
            <ul className="space-y-1.5 text-[10px] text-gray-600 font-medium">
              <li className="flex justify-between"><span className="font-bold text-indigo-600">1.1.1.h / v.5</span> <span>Investigation Order</span></li>
              <li className="flex justify-between"><span className="font-bold text-emerald-600">1.1.1.i / v.6</span> <span>Finance Billing Sent</span></li>
              <li className="flex justify-between"><span className="font-bold text-emerald-700">1.1.1.i.1 / v.7</span> <span>Cashier Paid Verify</span></li>
              <li className="flex justify-between"><span className="font-bold text-indigo-700">1.1.1.k / v.8</span> <span>Diagnostic Findings</span></li>
            </ul>
          </div>

          {/* Imaging Protocol Standards Info Card */}
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl p-4 border border-indigo-900/50 space-y-2.5 shadow-sm">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-1">
              <Sparkles size={12} />
              Imaging Safety Guidelines
            </h4>
            <p className="text-[10px] text-indigo-100/90 leading-relaxed font-medium">
              Ensure all patients are screened for ferromagnetic metal implants before entering the MRI Suite (Safety Zone IV). Maintain strict radiation safety (ALARA principle) for CT scan procedures.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[9px] text-indigo-300 font-mono">
              <AlertCircle size={10} />
              <span>HL7 DICOM Gateway: Active</span>
            </div>
          </div>
        </div>

      </div>

      {/* Lightbox Modal for high-res Film Diagnostic Viewing */}
      {selectedFilmImage && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
            <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Camera size={14} className="text-indigo-400" />
                Diagnostic Radiology Film Viewer
              </span>
              <button 
                onClick={() => setSelectedFilmImage(null)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 max-h-[70vh] p-4 bg-black flex items-center justify-center">
              <img 
                src={selectedFilmImage} 
                alt="Radiology Film Lightbox" 
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="p-3 border-t border-slate-800 bg-slate-950 text-center text-[10px] text-slate-400 font-medium">
              Standard clinical PACS representation. Keep patient credentials confidential.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
