import React, { useState, useEffect } from 'react';
import { 
  BookOpen, FileText, CheckCircle2, Clock, User, ShieldCheck, 
  Lock, KeyRound, LogIn, LogOut, UserPlus, ArrowLeft, Phone, Mail,
  Copy, Sparkles, Clipboard, Trash2, Loader2, ChevronRight, Database, Settings,
  Search, X, Check, LayoutTemplate, ClipboardCheck, AlertTriangle, Activity,
  Bell, RefreshCw, Zap, Layers, ArrowRight, ExternalLink, Filter, Users
} from 'lucide-react';
import { collection, addDoc, getDocs, doc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logSecurityEvent } from '../lib/auditLogger';
import StandardPdfRegisterSuite, { STANDARD_PDF_TEMPLATES } from './StandardPdfRegisterSuite';
import Module3HealthService from './Module3HealthService';
import AssessmentAuditTool from './AssessmentAuditTool';
import AllSchemaTablesViewer from './AllSchemaTablesViewer';

export interface LogbookUserAccount {
  id?: string;
  name: string;
  phone_number: string;
  email: string;
  passcode: string;
  hospital_id: string;
  hospital_name?: string;
  department_name?: string;
  created_at?: string;
}

export interface SchemaWorkflowStation {
  formId: string;
  name: string;
  category: string;
  targetTemplateId: string;
}

export const SCHEMA_WORKFLOW_STATIONS: SchemaWorkflowStation[] = [
  { formId: 'Form_1_1_1', name: '1.1.1 Patient Registration & Background Info', category: 'Outpatient & Emergency', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_0', name: '1.1.1.0 Registration Payment Request', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_1', name: '1.1.1.1 Cashier Payment Verification', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_2', name: '1.1.1.2 EHR Clinical Hub Folder', category: 'Outpatient & Emergency', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_a', name: '1.1.1.a Pre-Triage Screen Intake', category: 'Outpatient & Emergency', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_b', name: '1.1.1.b Triage & Vitals Signs Summary', category: 'Outpatient & Emergency', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_c', name: '1.1.1.c Patient Clinical History Taken', category: 'Outpatient & Emergency', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_d', name: '1.1.1.d Patient Clinical Assessment Summary', category: 'Outpatient & Emergency', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_e', name: '1.1.1.e Patient Clinical Diagnosis Summary', category: 'Outpatient & Emergency', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_f', name: '1.1.1.f Patient Laboratory Investigation Request', category: 'Laboratory & Diagnostics', targetTemplateId: 'lab_logbook' },
  { formId: 'Form_1_1_1_g', name: '1.1.1.g Patient Laboratory Payment Request', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_g_1', name: '1.1.1.g.1 Cashier Laboratory Payment Verification', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_h', name: '1.1.1.h Patient Radiology Investigation Request', category: 'Laboratory & Diagnostics', targetTemplateId: 'radiology_log' },
  { formId: 'Form_1_1_1_i', name: '1.1.1.i Patient Radiology Payment Request', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_i_1', name: '1.1.1.i.1 Cashier Radiology Payment Verification', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_j', name: '1.1.1.j Emergency Department Laboratory Report', category: 'Outpatient & Emergency', targetTemplateId: 'lab_logbook' },
  { formId: 'Form_1_1_1_k', name: '1.1.1.k Emergency Radiology Reports', category: 'Outpatient & Emergency', targetTemplateId: 'radiology_log' },
  { formId: 'Form_1_1_1_l', name: '1.1.1.l Patient Older Add Items Form', category: 'Outpatient & Emergency', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_m', name: '1.1.1.m Outpatient Prescription Submitted', category: 'Pharmacy & Dispensary', targetTemplateId: 'pharmacy_dispensing' },
  { formId: 'Form_1_1_1_m_1', name: '1.1.1.m.1 Dispensary Stock Out Transfer Request', category: 'Pharmacy & Dispensary', targetTemplateId: 'pharmacy_dispensing' },
  { formId: 'Form_1_1_1_m_2', name: '1.1.1.m.2 Dispensary Stock Out Medication Request', category: 'Pharmacy & Dispensary', targetTemplateId: 'pharmacy_dispensing' },
  { formId: 'Form_1_1_1_n', name: '1.1.1.n Patient Prescription Payment Request', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_n_1', name: '1.1.1.n.1 Cashier Prescription Payment Verification', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_o', name: '1.1.1.o Patient Procedure Submitted Intake', category: 'Surgical & Procedures', targetTemplateId: 'ipd_register' },
  { formId: 'Form_1_1_1_p', name: '1.1.1.p Outpatient Procedure Payment Request', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_p_1', name: '1.1.1.p.1 Cashier Procedure Payment Verification', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_q', name: '1.1.1.q Patient Ward Admission Form', category: 'Inpatient & Critical Care', targetTemplateId: 'ipd_register' },
  { formId: 'Form_1_1_1_r', name: '1.1.1.r Liaison Office Inpatient Intake & Referral', category: 'Inpatient & Critical Care', targetTemplateId: 'ipd_register' },
  { formId: 'Form_1_1_1_r_1', name: '1.1.1.r.1 Liaison Inpatient Payment Request Form', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_r_2', name: '1.1.1.r.2 Cashier Liaison Inpatient Deposit Verification', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_r_a', name: '1.1.1.r.a Ward Bed Management', category: 'Inpatient & Critical Care', targetTemplateId: 'ipd_register' },
  { formId: 'Form_1_1_1_s', name: '1.1.1.s Admitted Inpatient Vital Signs & Pain Score', category: 'Inpatient & Critical Care', targetTemplateId: 'ipd_register' },
  { formId: 'Form_1_1_1_t', name: '1.1.1.t Admitted Patient Prescription Request', category: 'Pharmacy & Dispensary', targetTemplateId: 'pharmacy_dispensing' },
  { formId: 'Form_1_1_1_t_1', name: '1.1.1.t.1 Admitted Patient Prescription Payment', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_t_2', name: '1.1.1.t.2 Cashier Admitted Patient Prescription Verification', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_u', name: '1.1.1.u Inter-Department Consultation Ward Physician', category: 'Inpatient & Critical Care', targetTemplateId: 'ipd_register' },
  { formId: 'Form_1_1_1_u_1', name: '1.1.1.u.1 Admitted Patients Medication Given Records', category: 'Inpatient & Critical Care', targetTemplateId: 'ipd_register' },
  { formId: 'Form_1_1_1_v', name: '1.1.1.v Inpatient Laboratory Investigation Request', category: 'Laboratory & Diagnostics', targetTemplateId: 'lab_logbook' },
  { formId: 'Form_1_1_1_v_1', name: '1.1.1.v.1 Inpatient Lab Payment Request Form', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_v_2', name: '1.1.1.v.2 Admitted Patient Lab Cash / CBHI Payment Form', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_v_3', name: '1.1.1.v.3 Cashier Inpatient Lab Payment Paid Verification', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_v_4', name: '1.1.1.v.4 Outpatient & Inpatient Laboratory Results', category: 'Laboratory & Diagnostics', targetTemplateId: 'lab_logbook' },
  { formId: 'Form_1_1_1_v_5', name: '1.1.1.v.5 Inpatient Radiology Investigation Request', category: 'Laboratory & Diagnostics', targetTemplateId: 'radiology_log' },
  { formId: 'Form_1_1_1_v_6', name: '1.1.1.v.6 Inpatient Radiology Payment Request Form', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_v_7', name: '1.1.1.v.7 Cashier Inpatient Radiology Paid Verification', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_v_8', name: '1.1.1.v.8 Outpatient & Inpatient Radiology Report & Results', category: 'Laboratory & Diagnostics', targetTemplateId: 'radiology_log' },
  { formId: 'Form_1_1_1_w', name: '1.1.1.w Inpatient Nursing Care Plan, Prognosis & Discharge', category: 'Inpatient & Critical Care', targetTemplateId: 'ipd_register' },
  { formId: 'Form_1_1_1_x', name: '1.1.1.x Inpatient Surgery Safety Checklist & Anesthesia Intake', category: 'Surgical & Procedures', targetTemplateId: 'ipd_register' },
  { formId: 'Form_1_1_1_y', name: '1.1.1.y Maternity Care Services (ANC, Labor, Postnatal)', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_1', name: '1.1.1.y.1 Antenatal Episode Registration', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_2', name: '1.1.1.y.2 ANC Visit Record', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_3', name: '1.1.1.y.3 ANC Visit Record (3-Visit Protocol)', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_4', name: '1.1.1.y.4 ANC Visit Record (4-Visit Protocol)', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_5', name: '1.1.1.y.5 ANC Visit Record (5-Visit Protocol)', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_6', name: '1.1.1.y.6 ANC Visit Record (6-Visit Protocol)', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_7', name: '1.1.1.y.7 ANC Visit Record (7-Visit Protocol)', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_8', name: '1.1.1.y.8 ANC Visit Record (8-Visit Protocol)', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_9', name: '1.1.1.y.9 Latent Phase Assessment & Labor Admission', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_10', name: '1.1.1.y.10 Active Phase Assessment', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_11', name: '1.1.1.y.11 Second Stage Monitoring & Delivery Outcome', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_12', name: '1.1.1.y.12 Third Stage (Placental) Assessment', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_13', name: '1.1.1.y.13 Postpartum Care Services', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_14', name: '1.1.1.y.14 Cesarean Section Details', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_15', name: '1.1.1.y.15 Post-Op Recovery Monitoring (PACU)', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_16', name: '1.1.1.y.16 Post-Op Ward Transfer Record', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_17', name: '1.1.1.y.17 Master Birth Summary View', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_18', name: '1.1.1.y.18 Vaccine Master Registry, Immunizations & AEFI', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_19', name: '1.1.1.y.19 Newborn Registry, Neonatal Care, NICU & KMC', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_20', name: '1.1.1.y.20 Abortion/PAC Episodes & Contraceptive Counseling', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_21', name: '1.1.1.y.21 FP Method Registry, Provision & Removal', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_y_22', name: '1.1.1.y.22 Gyn Encounters, Surgeries & Investigations', category: 'Maternal & Child Health', targetTemplateId: 'anc_register' },
  { formId: 'Form_1_1_1_z', name: '1.1.1.z Payment Request for Operating Room Procedure', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_z_1', name: '1.1.1.z.1 Cashier OR Procedure Paid Verification Summary', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_z_2', name: '1.1.1.z.2 Admitted Inpatient Prescription Request Form (Discharge)', category: 'Pharmacy & Dispensary', targetTemplateId: 'pharmacy_dispensing' },
  { formId: 'Form_1_1_1_z_3', name: '1.1.1.z.3 Cashier Inpatient Discharge Prescription Verification', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_z_4', name: '1.1.1.z.4 Liaison Discharge Inpatient Payment Request Form', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_z_5', name: '1.1.1.z.5 Cashier Liaison Inpatient Deposit Verification', category: 'Finance & Billing', targetTemplateId: 'cashier_receipt_log' },
  { formId: 'Form_1_1_1_z_6', name: '1.1.1.z.6 Surgical Master Registry, Bookings & Theatre Time Logs', category: 'Surgical & Procedures', targetTemplateId: 'ipd_register' },
  { formId: 'Form_1_1_1_z_7', name: '1.1.1.z.7 Pediatric Growth Monitoring, Screening & Boosters', category: 'Specialized Clinics', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_z_8', name: '1.1.1.z.8 ICU Admission, Vitals, Ventilators & Systems Assessment', category: 'Inpatient & Critical Care', targetTemplateId: 'ipd_register' },
  { formId: 'Form_1_1_1_z_9', name: '1.1.1.z.9 Prescription Module, IM SOAP, Chronic & Lab Results', category: 'Specialized Clinics', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_z_10', name: '1.1.1.z.10 Vital Signs Monitoring, Fluid Balance & Alerts', category: 'Inpatient & Critical Care', targetTemplateId: 'ipd_register' },
  { formId: 'Form_1_1_1_z_11', name: '1.1.1.z.11 Oxygen Prescription, Titration Log & Catalog', category: 'Specialized Clinics', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_z_12', name: '1.1.1.z.12 Dental Encounter, Tooth Charting & Treatment Plans', category: 'Specialized Clinics', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_z_13', name: '1.1.1.z.13 Ophthalmology Encounter, Vitals & Procedures', category: 'Specialized Clinics', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_z_14', name: '1.1.1.z.14 Physiatry Encounter, Functional Assessment & Rehab', category: 'Specialized Clinics', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_z_15', name: '1.1.1.z.15 ART Enrollment, Regimen Logs & Follow-up Visits', category: 'Specialized Clinics', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_z_16', name: '1.1.1.z.16 TB Case Enrollment, Diagnostics & Treatment Outcomes', category: 'Specialized Clinics', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_z_17', name: '1.1.1.z.17 Chronic Disease Registry, OPD & Medication Refills', category: 'Specialized Clinics', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_z_18', name: '1.1.1.z.18 Cervical Cancer Screening, Pathology & Surveillance', category: 'Specialized Clinics', targetTemplateId: 'opd_abstract' },
  { formId: 'Form_1_1_1_z_19', name: '1.1.1.z.19 Surgical Consent, Safety Checklist, PACU & Discharge', category: 'Surgical & Procedures', targetTemplateId: 'ipd_register' },
  { formId: 'Form_1_1_1_z_a_b', name: '1.1.1.z.a.b Inventory Management', category: 'Supply Chain & Inventory', targetTemplateId: 'pharmacy_dispensing' },
  { formId: 'Form_1_1_1_z_a_c', name: '1.1.1.z.a.c Medical Supply Management', category: 'Supply Chain & Inventory', targetTemplateId: 'pharmacy_dispensing' },
];

interface RegisterLogbookProps {
  activeHospital?: any;
  currentUser?: any;
  addToast?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  initialSubTab?: string;
}

export default function RegisterLogbook({ activeHospital, currentUser, addToast, initialSubTab }: RegisterLogbookProps) {
  // Navigation SubTab state: 'registers' | 'audit' | 'departmental' | 'queue' | 'all'
  const [activeSubTab, setActiveSubTab] = useState<'registers' | 'audit' | 'departmental' | 'queue' | 'all'>(() => {
    if (initialSubTab?.includes('ASSESSMENT') || initialSubTab?.includes('Audit')) return 'audit';
    if (initialSubTab?.includes('Departmental') || initialSubTab?.includes('Report Hub')) return 'departmental';
    if (initialSubTab?.includes('Queue') || initialSubTab?.includes('Waiting')) return 'queue';
    return 'registers';
  });

  useEffect(() => {
    if (initialSubTab?.includes('ASSESSMENT') || initialSubTab?.includes('Audit')) {
      setActiveSubTab('audit');
      setIsAssessmentAuditMinimized(false);
    } else if (initialSubTab?.includes('Departmental') || initialSubTab?.includes('Report Hub')) {
      setActiveSubTab('departmental');
      setIsReportHubMinimized(false);
    } else if (initialSubTab?.includes('Queue') || initialSubTab?.includes('Waiting')) {
      setActiveSubTab('queue');
    }
  }, [initialSubTab]);

  const handleSignOut = () => {
    localStorage.removeItem('register_logbook_session');
    setAuthenticatedUser(null);
    addToast?.('info', 'Signed out of Officer session.');
  };
  // Template selection controlled from Logbook with localStorage persistence
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    try {
      return localStorage.getItem('register_logbook_active_template') || 'opd_abstract';
    } catch {
      return 'opd_abstract';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('register_logbook_active_template', selectedTemplateId);
    } catch {}
  }, [selectedTemplateId]);

  // Auth State
  const [authView, setAuthView] = useState<'none' | 'signin' | 'signup' | 'forgot'>('none');
  const [authenticatedUser, setAuthenticatedUser] = useState<LogbookUserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('register_logbook_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // User Saved Records State
  const [savedRecords, setSavedRecords] = useState<any[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [suiteView, setSuiteView] = useState<'standard' | 'saved'>('standard');

  // Auto-select checkboxes state & 45 templates modal
  const [autoSelectLogbook, setAutoSelectLogbook] = useState(true);
  const [autoSelectConsolidatedHub, setAutoSelectConsolidatedHub] = useState(false);
  const [isReportHubMinimized, setIsReportHubMinimized] = useState(false);
  const [isAssessmentAuditMinimized, setIsAssessmentAuditMinimized] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Fetch saved records belonging to authenticatedUser
  const fetchUserSavedRecords = async () => {
    if (!authenticatedUser?.id) return;
    setIsLoadingSaved(true);
    try {
      const colRef = collection(db, 'pdf_standard_registers');
      const snap = await getDocs(colRef);
      const list: any[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId === authenticatedUser.id || docSnap.id.includes(`_${authenticatedUser.id}_`)) {
          list.push({
            id: docSnap.id,
            templateId: data.templateId || 'opd_abstract',
            templateName: data.templateName || 'Standard Register',
            updatedAt: data.updatedAt?.seconds ? new Date(data.updatedAt.seconds * 1000).toLocaleString() : data.updatedAt || 'Recently',
            rowsCount: Array.isArray(data.rows) ? data.rows.length : 0
          });
        }
      });
      setSavedRecords(list);
    } catch (err) {
      console.warn('Could not load active user saved registers:', err);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const [stationCounts, setStationCounts] = useState<Record<string, number>>({});
  const [totalWorkflowRecords, setTotalWorkflowRecords] = useState<number>(0);

  React.useEffect(() => {
    fetchUserSavedRecords();
    
    // Listen to savedRegisterUpdate custom event to reload list
    const handleUpdate = () => {
      fetchUserSavedRecords();
    };
    window.addEventListener('savedRegisterUpdate', handleUpdate);
    return () => {
      window.removeEventListener('savedRegisterUpdate', handleUpdate);
    };
  }, [authenticatedUser]);

  React.useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    SCHEMA_WORKFLOW_STATIONS.forEach((station) => {
      try {
        const unsub = onSnapshot(collection(db, station.formId), (snap) => {
          setStationCounts(prev => {
            const updated = { ...prev, [station.formId]: snap.size };
            const sum = Object.values(updated).reduce((acc: number, curr: number) => acc + (Number(curr) || 0), 0);
            setTotalWorkflowRecords(sum);
            return updated;
          });
        }, () => {
          setStationCounts(prev => ({ ...prev, [station.formId]: 0 }));
        });
        unsubscribes.push(unsub);
      } catch (e) {
        // ignore invalid collections if any
      }
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  const handleDeleteSavedRecord = async (docId: string, templateName: string) => {
    if (!window.confirm(`Are you sure you want to delete your saved "${templateName}" record?`)) return;
    try {
      await deleteDoc(doc(db, 'pdf_standard_registers', docId));
      addToast?.('success', 'Saved register deleted successfully.');
      fetchUserSavedRecords();
    } catch (err) {
      console.error('Failed to delete saved register:', err);
      addToast?.('error', 'Failed to delete saved register.');
    }
  };

  const handleToggleConsolidatedHub = (checked: boolean) => {
    setAutoSelectConsolidatedHub(checked);
    if (checked) {
      addToast?.('success', 'Auto-routing to Consolidated 33-Format Hub...');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('changeTab', { detail: 'Data & Explorer' }));
        window.dispatchEvent(new CustomEvent('changeDataExplorerEntity', { detail: 'MonthlyReportHub' }));
      }, 800);
    }
  };

  const handleToggleLogbook = (checked: boolean) => {
    setAutoSelectLogbook(checked);
    if (checked) {
      addToast?.('info', 'Auto-select enabled: Main Register Logbook Table remains active.');
      window.dispatchEvent(new CustomEvent('changeTab', { detail: 'Register Logbook Register Table (Editable Format)' }));
    }
  };

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPasscode, setSignUpPasscode] = useState('');
  const [signUpConfirmPasscode, setSignUpConfirmPasscode] = useState('');

  // Sign In Form State
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPasscode, setSignInPasscode] = useState('');

  // Forgot Passcode Form State
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotNewPasscode, setForgotNewPasscode] = useState('');
  const [forgotConfirmPasscode, setForgotConfirmPasscode] = useState('');

  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  const hospital_id = activeHospital?.hospital_unique_number || activeHospital?.id || 'HOSP-DEFAULT';
  const staffName = authenticatedUser?.name || currentUser?.full_name || currentUser?.name || 'Authorized Officer';

  // Handle Sign Up
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim() || !signUpPhone.trim() || !signUpEmail.trim() || !signUpPasscode.trim() || !signUpConfirmPasscode.trim()) {
      addToast?.('error', 'Please fill in all required sign up fields.');
      return;
    }

    if (signUpPasscode.trim() !== signUpConfirmPasscode.trim()) {
      addToast?.('error', 'Passcodes do not match. Please enter matching passcodes.');
      return;
    }

    setIsAuthSubmitting(true);
    try {
      const phoneVal = signUpPhone.trim();
      const emailVal = signUpEmail.trim().toLowerCase();
      const usersRef = collection(db, 'register_logbook_users');
      const snapUsers = await getDocs(usersRef);

      let exists = false;
      snapUsers.forEach((docSnap) => {
        const data = docSnap.data() as LogbookUserAccount;
        if (
          (data.phone_number?.trim().toLowerCase() === phoneVal.toLowerCase()) ||
          (data.email?.trim().toLowerCase() === emailVal)
        ) {
          exists = true;
        }
      });

      if (exists) {
        addToast?.('error', 'An account with this phone number or email already exists.');
        setIsAuthSubmitting(false);
        return;
      }

      const newAccount: LogbookUserAccount = {
        name: signUpName.trim(),
        phone_number: phoneVal,
        email: emailVal,
        passcode: signUpPasscode.trim(),
        hospital_id: hospital_id,
        hospital_name: activeHospital?.name || 'Default Hospital',
        department_name: 'Register Logbook',
        created_at: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'register_logbook_users'), newAccount);
      const userWithId = { id: docRef.id, ...newAccount };

      setAuthenticatedUser(userWithId);
      localStorage.setItem('register_logbook_session', JSON.stringify(userWithId));

      const tenantSession = {
        id: String(hospital_id),
        name: activeHospital?.name || 'Default Hospital',
        department: 'Register Logbook',
        hospital_unique_number: String(hospital_id)
      };
      localStorage.setItem('active_hospital_tenant', JSON.stringify(tenantSession));
      window.dispatchEvent(new CustomEvent('active_hospital_updated', { detail: tenantSession }));

      await logSecurityEvent('REGISTER_LOGBOOK_SIGNUP', '/register-logbook', `Officer account created in register_logbook_users: ${signUpName} (${phoneVal}/${emailVal})`);

      addToast?.('success', `Account created successfully! Officer ${signUpName} is now automatically signed in.`);

      setSignUpName('');
      setSignUpPhone('');
      setSignUpEmail('');
      setSignUpPasscode('');
      setSignUpConfirmPasscode('');
      setAuthView('none');
    } catch (err: any) {
      console.error('Sign up error:', err);
      addToast?.('error', err?.message || 'Failed to create account.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Handle Sign In
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInIdentifier.trim() || !signInPasscode.trim()) {
      addToast?.('error', 'Please enter your phone/email and passcode.');
      return;
    }

    setIsAuthSubmitting(true);
    try {
      const idVal = signInIdentifier.trim().toLowerCase();
      const passcodeVal = signInPasscode.trim();

      const usersRef = collection(db, 'register_logbook_users');
      const snapUsers = await getDocs(usersRef);

      let matchedUser: LogbookUserAccount | null = null;
      snapUsers.forEach((docSnap) => {
        const data = docSnap.data() as any;
        if (
          (data.phone_number?.trim().toLowerCase() === idVal ||
            data.email?.trim().toLowerCase() === idVal ||
            (data as any).phone_or_email?.trim().toLowerCase() === idVal) &&
          data.passcode?.trim() === passcodeVal
        ) {
          matchedUser = { id: docSnap.id, ...data } as LogbookUserAccount;
        }
      });

      if (!matchedUser) {
        addToast?.('error', 'Invalid phone/email or passcode. Please check your credentials or register a new account.');
        setIsAuthSubmitting(false);
        return;
      }

      setAuthenticatedUser(matchedUser);
      localStorage.setItem('register_logbook_session', JSON.stringify(matchedUser));

      const matchedHospitalId = (matchedUser as any).hospital_id || hospital_id;
      const matchedHospitalName = (matchedUser as any).hospital_name || 'Default Hospital';

      const tenantSession = {
        id: String(matchedHospitalId),
        name: matchedHospitalName,
        department: (matchedUser as any).department_name || '',
        hospital_unique_number: String(matchedHospitalId)
      };
      localStorage.setItem('active_hospital_tenant', JSON.stringify(tenantSession));
      window.dispatchEvent(new CustomEvent('active_hospital_updated', { detail: tenantSession }));

      await logSecurityEvent('REGISTER_LOGBOOK_SIGNIN', '/register-logbook', `Officer signed in: ${(matchedUser as LogbookUserAccount).name}`);

      addToast?.('success', `Welcome back, Officer ${(matchedUser as LogbookUserAccount).name}! Session authenticated.`);

      setSignInIdentifier('');
      setSignInPasscode('');
      setAuthView('none');
    } catch (err: any) {
      console.error('Sign in error:', err);
      addToast?.('error', err?.message || 'Failed to sign in.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Handle Forgot Passcode
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim() || !forgotNewPasscode.trim() || !forgotConfirmPasscode.trim()) {
      addToast?.('error', 'Please fill in all required fields to reset passcode.');
      return;
    }

    if (forgotNewPasscode.trim() !== forgotConfirmPasscode.trim()) {
      addToast?.('error', 'New passcodes do not match. Please enter matching passcodes.');
      return;
    }

    setIsAuthSubmitting(true);
    try {
      const idVal = forgotIdentifier.trim().toLowerCase();
      const newPasscode = forgotNewPasscode.trim();

      const usersRef = collection(db, 'register_logbook_users');
      const snapUsers = await getDocs(usersRef);

      let targetDocId: string | null = null;
      let targetUserData: LogbookUserAccount | null = null;

      snapUsers.forEach((docSnap) => {
        const data = docSnap.data() as LogbookUserAccount;
        if (
          data.phone_number?.trim().toLowerCase() === idVal ||
          data.email?.trim().toLowerCase() === idVal ||
          (data as any).phone_or_email?.trim().toLowerCase() === idVal
        ) {
          targetDocId = docSnap.id;
          targetUserData = data;
        }
      });

      if (!targetDocId || !targetUserData) {
        addToast?.('error', 'No officer account found with this phone number or email.');
        setIsAuthSubmitting(false);
        return;
      }

      const updatedUser = {
        ...targetUserData,
        passcode: newPasscode
      };

      setAuthenticatedUser({ id: targetDocId, ...updatedUser });
      localStorage.setItem('register_logbook_session', JSON.stringify({ id: targetDocId, ...updatedUser }));

      await logSecurityEvent('REGISTER_LOGBOOK_RESET_PASSCODE', '/register-logbook', `Passcode reset for officer: ${(targetUserData as LogbookUserAccount).name}`);

      addToast?.('success', `Passcode updated successfully! Officer ${(targetUserData as LogbookUserAccount).name} is now signed in.`);

      setForgotIdentifier('');
      setForgotNewPasscode('');
      setForgotConfirmPasscode('');
      setAuthView('none');
    } catch (err: any) {
      console.error('Forgot passcode error:', err);
      addToast?.('error', err?.message || 'Failed to reset passcode.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    setAuthenticatedUser(null);
    localStorage.removeItem('register_logbook_session');
    addToast?.('info', 'Logged out of Officer Session.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-4 print:py-0 print:px-0">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400 border border-indigo-500/30 shadow-inner">
              <BookOpen size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-indigo-400/30 tracking-wider">
                  Editable Format Register Suite
                </span>
                <span className="text-slate-400 text-xs font-mono">Org: {hospital_id}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Register Logbook Register Table (Editable Format)
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
                Official hospital register catalog & tables in standardized interactive editable format.
              </p>
            </div>
          </div>

          {/* Session controls */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-700">
              <ShieldCheck size={16} className="text-indigo-400" />
              {authenticatedUser ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    {authenticatedUser.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="ml-2 px-2.5 py-1 bg-rose-600/90 hover:bg-rose-600 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-300 flex items-center gap-1 font-medium">
                    <Clock size={12} />
                    Guest Officer
                  </span>
                  <button
                    type="button"
                    onClick={() => setAuthView('signin')}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthView('signup')}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Gateway Modal */}
      {authView !== 'none' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Lock size={20} />
                </div>
                <div>
                  <h2 className="font-extrabold text-xs text-indigo-400 uppercase tracking-wider">
                    Secure Passcode Gateway & Account Verification
                  </h2>
                  <p className="text-white text-sm font-black mt-0.5">
                    {authView === 'signup' && 'Sign Up'}
                    {authView === 'signin' && 'Sign In'}
                    {authView === 'forgot' && 'Forgot Passcode?'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAuthView('none')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            </div>

            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1.5 gap-1">
              <button
                type="button"
                onClick={() => setAuthView('signin')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  authView === 'signin'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LogIn size={13} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthView('signup')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  authView === 'signup'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <UserPlus size={13} />
                <span>Sign Up</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthView('forgot')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  authView === 'forgot'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <KeyRound size={13} />
                <span>Forgot Passcode</span>
              </button>
            </div>

            <div className="p-6">
              {authView === 'signup' && (
                <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      NAME (REQUIRED)
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Enter full officer name"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      PHONE NUMBER (REQUIRED)
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Enter phone number"
                        value={signUpPhone}
                        onChange={(e) => setSignUpPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      OR EMAIL ADDRESS (REQUIRED)
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="Enter email address"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      CREATE NEW PASSCODE (REQUIRED)
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Create secret passcode"
                        value={signUpPasscode}
                        onChange={(e) => setSignUpPasscode(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      REPEAT NEW PASSCODE (REQUIRED)
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Re-enter passcode to confirm"
                        value={signUpConfirmPasscode}
                        onChange={(e) => setSignUpConfirmPasscode(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isAuthSubmitting}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <UserPlus size={16} />
                      <span>{isAuthSubmitting ? 'Creating Account...' : 'Sign Up Submit'}</span>
                    </button>
                  </div>
                </form>
              )}

              {authView === 'signin' && (
                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      SIGN IN (EMAIL OR PHONE / USERNAME)
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Enter registered phone or email"
                        value={signInIdentifier}
                        onChange={(e) => setSignInIdentifier(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        PASSCODE (REQUIRED)
                      </label>
                      <button
                        type="button"
                        onClick={() => setAuthView('forgot')}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                      >
                        Forgot passcode?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Enter secret passcode"
                        value={signInPasscode}
                        onChange={(e) => setSignInPasscode(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isAuthSubmitting}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <LogIn size={16} />
                      <span>{isAuthSubmitting ? 'Authenticating...' : 'Sign In Submit'}</span>
                    </button>
                  </div>
                </form>
              )}

              {authView === 'forgot' && (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Registered Phone or Email *
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Enter account phone or email"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      New Passcode *
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Enter new passcode"
                        value={forgotNewPasscode}
                        onChange={(e) => setForgotNewPasscode(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Confirm New Passcode *
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Confirm new passcode"
                        value={forgotConfirmPasscode}
                        onChange={(e) => setForgotConfirmPasscode(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isAuthSubmitting}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <KeyRound size={16} />
                      <span>{isAuthSubmitting ? 'Resetting Passcode...' : 'Reset Passcode'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {authenticatedUser ? (
        <div className="w-full space-y-6">
          {/* Main Content Pane */}
          <div className="w-full space-y-6">
            {(activeSubTab === 'registers' || activeSubTab === 'all') && (
              <>


                {/* Active Account Control Hub */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
                  {/* Auto-Select Configurations (Small boxes) */}
                  <div 
                    onClick={() => {
                      setSuiteView('standard');
                      addToast?.('info', 'Viewing standard register templates.');
                    }}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group ${
                      suiteView === 'standard' 
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500/50 shadow-md ring-2 ring-indigo-500/10' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Settings size={18} className={suiteView === 'standard' ? 'text-indigo-600' : 'text-indigo-500'} />
                          <h3 className={`text-sm font-black uppercase tracking-wider ${suiteView === 'standard' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-100'}`}>
                            Auto-Select Formats
                          </h3>
                        </div>
                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-extrabold">
                          {STANDARD_PDF_TEMPLATES.length} Templates Available
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-3">
                        Configure default layout and template routing for your active session:
                      </p>

                      {/* Active Routed Template Quick Preview */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTemplatesModal(true);
                        }}
                        className="mb-4 p-3 bg-indigo-600/5 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between hover:bg-indigo-600/10 transition-all cursor-pointer group/card"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="block text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            Active Routed Template ({STANDARD_PDF_TEMPLATES.find(t => t.id === selectedTemplateId)?.code || 'REG'})
                          </span>
                          <span className="block text-xs font-black text-slate-800 dark:text-slate-100 truncate mt-0.5">
                            {STANDARD_PDF_TEMPLATES.find(t => t.id === selectedTemplateId)?.name || 'Select Template'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold group-hover/card:bg-indigo-500 transition-all shadow-sm shrink-0">
                          <LayoutTemplate size={12} />
                          <span>Change All 45</span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {/* Register Logbook Table box */}
                        <label className="flex items-start gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-all cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoSelectLogbook}
                            onChange={(e) => handleToggleLogbook(e.target.checked)}
                            className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                          />
                          <div className="text-xs">
                            <span className="block font-bold text-slate-800 dark:text-slate-200">
                              Register Logbook Register Table
                            </span>
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              Focus active workspace table
                            </span>
                          </div>
                        </label>

                        {/* Consolidated 33-Format Hub box */}
                        <label className="flex items-start gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-all cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoSelectConsolidatedHub}
                            onChange={(e) => handleToggleConsolidatedHub(e.target.checked)}
                            className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                          />
                          <div className="text-xs">
                            <span className="block font-bold text-slate-800 dark:text-slate-200">
                              Consolidated 33-Format Hub
                            </span>
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              Auto-routing monthly reports
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {autoSelectConsolidatedHub && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('changeTab', { detail: 'Data & Explorer' }));
                            window.dispatchEvent(new CustomEvent('changeDataExplorerEntity', { detail: 'MonthlyReportHub' }));
                          }}
                          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Go to Consolidated Hub</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Saved Register Records List */}
                  <div 
                    onClick={() => {
                      setSuiteView('saved');
                      addToast?.('info', 'Viewing your saved registers collection.');
                    }}
                    className={`p-5 rounded-2xl border transition-all lg:col-span-2 flex flex-col justify-between cursor-pointer group ${
                      suiteView === 'saved' 
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/50 shadow-md ring-2 ring-emerald-500/10' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Database size={18} className={suiteView === 'saved' ? 'text-emerald-600' : 'text-emerald-500'} />
                          <h3 className={`text-sm font-black uppercase tracking-wider ${suiteView === 'saved' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>
                            Saved Registers under Active Account
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {suiteView === 'saved' && (
                            <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                              ACTIVE VIEW
                            </span>
                          )}
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
                            {savedRecords.length} Saved
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-4">
                        Access clinical records saved specifically under your authorized session ({authenticatedUser.name}):
                      </p>

                      {isLoadingSaved ? (
                        <div className="flex items-center justify-center py-6 gap-2">
                          <Loader2 size={16} className="text-indigo-600 animate-spin" />
                          <span className="text-xs text-slate-400 font-medium">Synchronizing active account data...</span>
                        </div>
                      ) : savedRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
                          <Sparkles size={24} className="text-slate-300 dark:text-slate-700 mb-1.5" />
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            No Saved Register Records Yet
                          </p>
                          <p className="text-[10px] text-slate-400 max-w-sm mt-0.5">
                            Open a template below, fill clinical rows, and click 'Save Register' to link it here.
                          </p>
                        </div>
                      ) : (
                        <div className="max-h-40 overflow-y-auto border border-slate-150 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/20 dark:bg-slate-900/20">
                          {savedRecords.map((record) => (
                            <div key={record.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                              <div className="min-w-0 pr-3">
                                <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                                  {record.templateName}
                                </span>
                                <span className="block text-[10px] text-slate-400 font-medium">
                                  Rows: <strong className="text-indigo-600 dark:text-indigo-400">{record.rowsCount}</strong> | Saved: {record.updatedAt}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTemplateId(record.templateId);
                                    setSuiteView('standard');
                                    addToast?.('success', `Loaded saved ${record.templateName} successfully!`);
                                  }}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                                >
                                  Load
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSavedRecord(record.id, record.templateName);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all cursor-pointer"
                                  title="Delete Saved Record"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* All Schema Tables Live Feed / All Modules Stacked */}
                {activeSubTab === 'all' && (
                  <AllSchemaTablesViewer
                    db={db}
                    hospital_id={hospital_id}
                    addToast={addToast}
                  />
                )}

                {/* Main Standard PDF Clinical Registers Suite */}
                <StandardPdfRegisterSuite
                  hospital_id={hospital_id}
                  staffName={staffName}
                  addToast={addToast}
                  selectedTemplateId={selectedTemplateId}
                  onSelectTemplate={setSelectedTemplateId}
                  authenticatedUser={authenticatedUser}
                  activeView={suiteView}
                  onViewChange={setSuiteView}
                />
              </>
            )}

            {(activeSubTab === 'audit' || activeSubTab === 'all') && (
              /* Hospital Service Assessment Audit */
              <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm my-4">
                <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-4 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <ClipboardCheck size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider block">
                        Hospital Service Assessment Audit (Chapters 1-23)
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                        Official Quality & Compliance Audit Tool
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsAssessmentAuditMinimized(!isAssessmentAuditMinimized)}
                    className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    {isAssessmentAuditMinimized ? 'Expand Audit' : 'Minimize Audit'}
                  </button>
                </div>
                {!isAssessmentAuditMinimized && (
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-950/30">
                    <AssessmentAuditTool 
                      activeHospital={activeHospital}
                      addToast={addToast}
                      onBack={() => setIsAssessmentAuditMinimized(true)}
                    />
                  </div>
                )}
              </div>
            )}

            {(activeSubTab === 'departmental' || activeSubTab === 'all') && (
              /* Consolidated 33-Format Hub */
              <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="px-6 py-3 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4 shrink-0">
                  <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Departmental Report Hub (Consolidated 33-Format)</span>
                  <button 
                    onClick={() => setIsReportHubMinimized(!isReportHubMinimized)}
                    className="ml-auto p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold"
                  >
                    {isReportHubMinimized ? 'Expand Hub' : 'Minimize Hub'}
                  </button>
                </div>
                {!isReportHubMinimized && (
                  <Module3HealthService 
                    activeHospital={activeHospital}
                    addToast={addToast}
                    onBack={() => setSuiteView('standard')}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Sign-in Gate View */
        <div className="max-w-xl mx-auto py-12 px-4 text-center print:hidden">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/30 shadow-inner">
              <Lock size={30} />
            </div>

            <div className="space-y-2">
              <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-900/30 tracking-wider">
                Access Restricted
              </span>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">
                Officer Authentication Required
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-sm mx-auto font-medium">
                Please sign in or register an active officer account to view, edit, and save Standardized Clinical Registers (Editable Suite). Saved records will be securely linked to your profile database.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setAuthView('signin')}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn size={14} />
                <span>Sign In to Officer Account</span>
              </button>
              <button
                onClick={() => setAuthView('signup')}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <UserPlus size={14} />
                <span>Create New Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 45 Templates Selection & Routing Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600/10 text-indigo-600 rounded-2xl flex items-center justify-center font-black">
                  <LayoutTemplate size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Active Session Template Routing (All 45 Official Registers)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure and auto-route your active session layout to any of the 45 national clinical formats.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search across all 45 templates by name, code, or description..."
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['All', ...Array.from(new Set(STANDARD_PDF_TEMPLATES.map(t => t.category)))].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategoryFilter === cat
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates List Grid */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50/30 dark:bg-slate-950/20">
              {STANDARD_PDF_TEMPLATES
                .filter(t => {
                  const matchesCat = selectedCategoryFilter === 'All' || t.category === selectedCategoryFilter;
                  const matchesQuery = !templateSearchQuery || 
                    t.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                    t.code.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                    t.description.toLowerCase().includes(templateSearchQuery.toLowerCase());
                  return matchesCat && matchesQuery;
                })
                .map((template) => {
                  const isSelected = selectedTemplateId === template.id;
                  return (
                    <div
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplateId(template.id);
                        setSuiteView('standard');
                        setShowTemplatesModal(false);
                        addToast?.('success', `Active session successfully routed to ${template.name} (${template.code})!`);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-900/30">
                            {template.code}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                            {template.category}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors mb-1">
                          {template.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 font-medium">
                          {template.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400">
                          {template.columns?.length || 0} Columns Configured
                        </span>
                        <button
                          className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1 ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check size={12} />
                              <span>Active Session</span>
                            </>
                          ) : (
                            <span>Route Template</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center text-xs text-slate-500">
              <span>Showing all 45 standardized official health register templates</span>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
