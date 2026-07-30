import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, onSnapshot, query, addDoc, deleteDoc, doc, getDocs, updateDoc, where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { filterFakeOrFalseRows, isFakeOrFalseRow } from '../utils/dataIntegrity';
import PatientDetailsModal from './PatientDetailsModal';
import { 
  Activity, Users, Pill, Calendar, FileText, Settings2, CreditCard, 
  Bell, TrendingUp, DollarSign, Heart, Package, Home, Shield, Globe, 
  Search, Plus, Trash2, Database, DatabaseZap, Info, X, ChevronRight, ChevronLeft, Check, ArrowLeft,
  Edit, SlidersHorizontal, MoreHorizontal, Upload, Download, History, Camera,
  QrCode, Printer, Bed, Thermometer, ShieldAlert, AlertTriangle, LogIn, Link2,
  Syringe, Scissors, ClipboardList, UserCheck, Users2, AlertCircle, Sparkles, Zap, CheckCircle2,
  Folder, FolderOpen, HeartPulse, Clock, ClipboardCheck, Scan, Mic, CheckSquare, Loader2
} from 'lucide-react';

import Module3HealthService from './Module3HealthService';
import PatientDashboard from './PatientDashboard';
import AssessmentAuditTool from './AssessmentAuditTool';
import FinanceHub from './FinanceHub';
import AdminCEOHub from './AdminCEOHub';
import DivisionShortcuts from './DivisionShortcuts';
import QRBanger from './QRBanger';
import PatientsOverview from './PatientsOverview';
import { Html5QrcodeScanner } from "html5-qrcode";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { validateOutpatientPrescription } from '../utils/prescriptionValidation';

const BillingPendingBadge = ({ mrn }: { mrn: string }) => {
  const [isPending, setIsPending] = useState(false);
  useEffect(() => {
    if (!mrn) {
      setIsPending(false);
      return;
    }
    const q = query(collection(db, 'financial_ledger'), where('patient_mrn', '==', mrn), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIsPending(!snapshot.empty);
    });
    return unsubscribe;
  }, [mrn]);
  if (!isPending) return null;
  return <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded uppercase">Billing Pending</span>;
};

import { ENTITIES_CONFIG, ENTITIES_ORDER, EntityConfig } from '../data/schema';
import { patientSchema } from '../lib/schemas';
import { saveEHRRecord, updateEHRRecord, deleteEHRRecord, updateFolderNotes } from '../lib/ehr_storage';



interface DataExplorerProps {
  isSidebarCollapsed?: boolean;
  setIsSidebarCollapsed?: (collapsed: boolean) => void;
}

const SPECIAL_VIEWS = [
  { id: 'DivisionShortcuts', name: 'DIVISION SHORTCUTS', subtitle: 'Easy access to schema tables, services, and forms', icon: Zap },
  { id: 'PatientsOverview', name: 'Patients Overview', subtitle: 'Unified Electronic Health Record Registry', icon: Users },
  { id: 'QRBanger', name: 'QR Banger Studio', subtitle: 'Patient MRN and Billing QR Suite', icon: QrCode },
];

export default function DataExplorer({ isSidebarCollapsed, setIsSidebarCollapsed }: DataExplorerProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string>('DivisionShortcuts');

  const isValidPatientRecord = (rec: any) => {
    const mrn = rec.patient_mrn || rec.mrn || rec.Patient_MRN || rec.patient_MRN;
    const name = rec.patient_name || rec.name || rec.full_name;
    return !(mrn === '123456' || name === 'Unknown Patient' || name === 'Zulfadli said');
  };

  
  // Handle programmatical special view entity selection
  useEffect(() => {
    const handleEntityChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setSelectedEntityId(customEvent.detail);
      }
    };
    window.addEventListener('changeDataExplorerEntity', handleEntityChange);
    return () => {
      window.removeEventListener('changeDataExplorerEntity', handleEntityChange);
    };
  }, []);

  const [records, setRecords] = useState<Record<string, any>[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const folderSearchFiltered = records.filter(folder =>
    (folder.patient_name || folder.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (folder.patient_mrn || folder.mrn || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (folder.clinical_notes || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const [tableSearchQuery, setTableSearchQuery] = useState('');

  // Bulk Operation States for batch updates & mass deletions
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'update_status' | 'delete' | 'export_json'>('update_status');
  const [bulkStatusValue, setBulkStatusValue] = useState<string>('completed');
  const [isBulkExecuting, setIsBulkExecuting] = useState<boolean>(false);

  const handleExecuteBulkOperation = async () => {
    if (selectedRecordIds.length === 0) return;
    
    if (bulkAction === 'delete') {
      if (!window.confirm(`Are you sure you want to mass delete ${selectedRecordIds.length} selected record(s)?`)) return;
    }

    setIsBulkExecuting(true);
    try {
      const activeEntityConfig = (ENTITIES_CONFIG as any)?.[selectedEntityId];
      const collectionName = activeEntityConfig?.collectionName || selectedEntityId.toLowerCase();

      if (bulkAction === 'export_json') {
        const selectedRecordsData = records.filter(r => selectedRecordIds.includes(r.id));
        const blob = new Blob([JSON.stringify(selectedRecordsData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulk_records_${selectedEntityId}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (bulkAction === 'delete') {
        for (const id of selectedRecordIds) {
          await deleteEHRRecord(collectionName, id);
        }
        setRecords(prev => prev.filter(r => !selectedRecordIds.includes(r.id)));
        setSelectedRecordIds([]);
      } else if (bulkAction === 'update_status') {
        for (const id of selectedRecordIds) {
          await updateEHRRecord(collectionName, id, { status: bulkStatusValue, updatedAt: new Date().toISOString() });
        }
        setRecords(prev => prev.map(r => selectedRecordIds.includes(r.id) ? { ...r, status: bulkStatusValue } : r));
        setSelectedRecordIds([]);
      }
    } catch (err: any) {
      console.error("Bulk operation error:", err);
      alert("Error performing bulk operation: " + (err?.message || "Unknown error"));
    } finally {
      setIsBulkExecuting(false);
    }
  };

  // Column Selector and custom dynamic field state management
  const [customSchemaFields, setCustomSchemaFields] = useState<Record<string, { key: string; label: string; type: 'string' | 'number' | 'select' | 'date' | 'date-time' | 'items' | 'textarea' | 'checkbox' | 'array' | 'camera'; placeholder?: string; options?: string[]; required?: boolean; defaultValue?: string; }[]>>({});
  const [userColumns, setUserColumns] = useState<Record<string, string[]>>({});
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  
  // Custom Dynamic Field adding form states
  const [newColKey, setNewColKey] = useState('');
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState<'string' | 'number' | 'select' | 'date' | 'date-time' | 'checkbox' | 'textarea'>('string');
  const [newColOptions, setNewColOptions] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEntitiesSidebarCollapsed, setIsEntitiesSidebarCollapsed] = useState(false);

  // Patient Universal Clinical Folder Hub (Form 1.1.1.2) States
  const [hubSelectedMrn, setHubSelectedMrn] = useState<string>('');
  const [hubActiveFormId, setHubActiveFormId] = useState<string>('Form_1_1_1_a');
  const [hubSubFormRecords, setHubSubFormRecords] = useState<any[]>([]);
  const [hubSubFormLoading, setHubSubFormLoading] = useState<boolean>(false);
  const [hubSearchQuery, setHubSearchQuery] = useState<string>('');
  const [isHubAddFormOpen, setIsHubAddFormOpen] = useState<boolean>(false);
  const [hubFormData, setHubFormData] = useState<Record<string, any>>({});
  const [hubFormError, setHubFormError] = useState<string>('');
  const [hubEditingRecordId, setHubEditingRecordId] = useState<string | null>(null);
  const [folderNotes, setFolderNotes] = useState<string>('');
  const [subFormQuery, setSubFormQuery] = useState<string>('');

  // Enhanced Clinical Folder Features States
  const [folderActiveTab, setFolderActiveTab] = useState<'ehr' | 'labs' | 'vitals' | 'export'>('ehr');
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const speechRef = useRef<any>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string>('');
  const [hasRestorableDraft, setHasRestorableDraft] = useState<boolean>(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Lab Results Dashboard States
  const [newLabMetric, setNewLabMetric] = useState<string>('Glucose');
  const [newLabValue, setNewLabValue] = useState<string>('');
  const [newLabUnit, setNewLabUnit] = useState<string>('mg/dL');
  const [newLabRef, setNewLabRef] = useState<string>('70-100');
  const [newLabDate, setNewLabDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [labMetricsList, setLabMetricsList] = useState<any[]>([]);

  // Vital Signs Monitor States
  const [newVitalPulse, setNewVitalPulse] = useState<string>('');
  const [newVitalTemp, setNewVitalTemp] = useState<string>('');
  const [newVitalBP, setNewVitalBP] = useState<string>('');
  const [newVitalRR, setNewVitalRR] = useState<string>('');
  const [newVitalDate, setNewVitalDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);

  // Referral Export custom state inputs
  const [refInstitution, setRefInstitution] = useState<string>('');
  const [refReason, setRefReason] = useState<string>('');
  const [refDoctor, setRefDoctor] = useState<string>('');

  const wasSidebarCollapsedRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (searchQuery.length >= 8 && searchQuery.includes('MRN-')) {
      const match = patients.find(p => p.mrn === searchQuery);
      if (match) {
        setHubSelectedMrn(match.mrn);
        setSelectedEntityId('Form_1_1_1_2');
      }
    }
  }, [searchQuery, patients]);

  // Monitor when a schema form enters full-screen mode, and minimize the workspace navigation console
  useEffect(() => {
    const initialEntity = sessionStorage.getItem('explorer_initial_entity');
    if (initialEntity) {
      setSelectedEntityId(initialEntity);
      sessionStorage.removeItem('explorer_initial_entity');
    }
    const initialSubEntity = sessionStorage.getItem('explorer_initial_sub_entity');
    if (initialSubEntity) {
      setHubActiveFormId(initialSubEntity);
      sessionStorage.removeItem('explorer_initial_sub_entity');
    }
  }, []);

  // Automatically minimize sidebars when Universal Patient Clinical Folder is opened
  useEffect(() => {
    if (selectedEntityId === 'Form_1_1_1_2') {
      setIsSidebarCollapsed?.(true);
      setIsEntitiesSidebarCollapsed(true);
    }
  }, [selectedEntityId, setIsSidebarCollapsed]);

  useEffect(() => {
    if (isFormOpen) {
      if (wasSidebarCollapsedRef.current === null && isSidebarCollapsed !== undefined) {
        wasSidebarCollapsedRef.current = isSidebarCollapsed;
      }
      setIsSidebarCollapsed?.(true);
    } else {
      if (wasSidebarCollapsedRef.current !== null) {
        setIsSidebarCollapsed?.(wasSidebarCollapsedRef.current);
        wasSidebarCollapsedRef.current = null;
      }
    }

    return () => {
      // Cleanup effect: restores the sidebar to its previous state (expanded or collapsed) when the user closes/leaves full-screen form view
      if (wasSidebarCollapsedRef.current !== null) {
        setIsSidebarCollapsed?.(wasSidebarCollapsedRef.current);
      }
    };
  }, [isFormOpen, setIsSidebarCollapsed]);

  // Automatically collapse Entities Sidebar when form is opened to allow full-screen layout
  useEffect(() => {
    if (isFormOpen) {
      setIsEntitiesSidebarCollapsed(true);
    } else {
      setIsEntitiesSidebarCollapsed(false);
    }
  }, [isFormOpen]);

  const handleShortcutSelect = (id: string) => {
    // Normalize shortcut ID to Form ID (e.g. 1.1.1.0 -> Form_1_1_1_0)
    let entityId = id;
    if (id.match(/^\d+\.\d+/)) {
      entityId = `Form_${id.replace(/\./g, '_')}`;
    }

    // Try exact match, case-insensitive match, or prefix match in ENTITIES_CONFIG
    let targetKey = ENTITIES_CONFIG[entityId] ? entityId : (ENTITIES_CONFIG[id] ? id : '');
    
    if (!targetKey) {
      const lowerEntityId = entityId.toLowerCase();
      const keys = Object.keys(ENTITIES_CONFIG);
      const exactCi = keys.find(k => k.toLowerCase() === lowerEntityId || k.toLowerCase() === id.toLowerCase());
      if (exactCi) {
        targetKey = exactCi;
      } else {
        const prefixCi = keys.find(k => k.toLowerCase().startsWith(lowerEntityId + '_') || k.toLowerCase().startsWith(id.toLowerCase() + '_'));
        if (prefixCi) {
          targetKey = prefixCi;
        }
      }
    }

    if (targetKey && ENTITIES_CONFIG[targetKey]) {
      setSelectedEntityId(targetKey);
      
      // Initialize form with hospital ID and defaults
      const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
      const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
      const hospitalId = activeHospital?.hospital_unique_number || 'demo-global';
      
      const initialData: Record<string, any> = {};
      const config = ENTITIES_CONFIG[targetKey];
      
      config.fields.forEach(f => {
        if (f.key === 'hospital_id') initialData[f.key] = hospitalId;
        else if (f.defaultValue) initialData[f.key] = f.defaultValue;
        else if (f.type === 'date') initialData[f.key] = new Date().toISOString().split('T')[0];
        else if (f.type === 'date-time') initialData[f.key] = new Date().toISOString();
      });
      
      setFormData(initialData);
      setEditingRecordId(null);
      setFormError('');
      setIsFormOpen(true);
    }
  };
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formError, setFormError] = useState<string>('');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [seedingLoading, setSeedingLoading] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isGlobalSchemaOpen, setIsGlobalSchemaOpen] = useState(false);
  const [schemaSearchQuery, setSchemaSearchQuery] = useState('');
  const [customFieldsDb, setCustomFieldsDb] = useState<Record<string, any[]>>({});
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = useState(false);
  const [editingCustomField, setEditingCustomField] = useState<any>(null);
  const [customFieldFormError, setCustomFieldFormError] = useState('');

  // Patient Details Modal States
  const [selectedPatientForModal, setSelectedPatientForModal] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPatientMrn, setSelectedPatientMrn] = useState<string | null>(null);

  // Patient Admission QR States
  const [selectedPatientQr, setSelectedPatientQr] = useState<any | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scannerSelectedPatientId, setScannerSelectedPatientId] = useState('');
  const [scannerSuccessMsg, setScannerSuccessMsg] = useState('');

  // Real-time camera streaming states for clinical QR overlay
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string>('');
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Multi-purpose QR and Scanner States
  const [qrType, setQrType] = useState<'patient' | 'staff' | 'user' | 'inpatient' | 'outpatient' | 'record'>('patient');
  const [qrPurpose, setQrPurpose] = useState<string>('Universal Clinical Registration');
  const [scannerMode, setScannerMode] = useState<'patient' | 'staff' | 'user' | 'inpatient' | 'outpatient'>('patient');
  const [scannerSelectedItemId, setScannerSelectedItemId] = useState('');
  const [scannerStaffList, setScannerStaffList] = useState<any[]>([]);
  const [scannerUserList, setScannerUserList] = useState<any[]>([]);
  const [scannerInpatientList, setScannerInpatientList] = useState<any[]>([]);
  const [scannerOutpatientList, setScannerOutpatientList] = useState<any[]>([]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startCamera = async (deviceId?: string) => {
      try {
        setCameraError('');
        if (activeStream) {
          activeStream.getTracks().forEach(track => track.stop());
        }

        if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API (getUserMedia) is not supported or is blocked in this browser context (possibly due to insecure connection or iframe sandbox limitations).");
        }

        const constraints: MediaStreamConstraints = {
          video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: "environment" } }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = stream;
        setCameraPermissionGranted(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Try to enumerate devices after stream start (to get labels)
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          setCameraDevices(videoDevices);
          if (!deviceId && videoDevices.length > 0) {
            setSelectedCameraId(videoDevices[0].deviceId);
          }
        } catch (e) {
          console.warn("Failed to enumerate devices", e);
        }
      } catch (err: any) {
        console.warn("Camera getUserMedia gracefully caught failed state:", err);
        setCameraPermissionGranted(false);
        const errorMsg = err?.message || err?.name || "Access Denied";
        if (errorMsg.includes("NotAllowedError") || errorMsg.includes("permission")) {
          setCameraError("Camera permission denied. Please grant camera access in your browser or use the secure hardware emulator below to test.");
        } else {
          setCameraError(`Camera initialization paused: ${errorMsg}. You can use the high-fidelity emulator below to test.`);
        }
      }
    };

    if (isScannerModalOpen) {
      startCamera(selectedCameraId || undefined);
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScannerModalOpen, selectedCameraId]);


  // Synchronize dropdown lists when scanner modal is opened
  useEffect(() => {
    if (isScannerModalOpen) {
      getDocs(collection(db, 'staff')).then(snap => {
        setScannerStaffList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }).catch(err => {
        if (err?.code === 'unavailable' || !navigator.onLine) {
          console.log("Offline: Using cached staff data if available");
        } else {
          console.warn("Error fetching scanner staff:", err);
        }
      });

      getDocs(collection(db, 'users')).then(snap => {
        setScannerUserList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }).catch(err => {
        if (err?.code === 'unavailable' || !navigator.onLine) {
          console.log("Offline: Using cached user data if available");
        } else {
          console.warn("Error fetching scanner users:", err);
        }
      });

      getDocs(collection(db, 'admissions')).then(snap => {
        setScannerInpatientList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }).catch(err => {
        if (err?.code === 'unavailable' || !navigator.onLine) {
          console.log("Offline: Using cached admissions data if available");
        } else {
          console.warn("Error fetching scanner admissions:", err);
        }
      });

      getDocs(collection(db, 'clinical_encounters')).then(snap => {
        setScannerOutpatientList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }).catch(err => {
        if (err?.code === 'unavailable' || !navigator.onLine) {
          console.log("Offline: Using cached encounters data if available");
        } else {
          console.warn("Error fetching scanner clinical encounters:", err);
        }
      });
    }
  }, [isScannerModalOpen]);

  // Handler to present a tailored QR code badge based on the active EHR Schema table
  const handlePresentQrCode = (record: any, entityId: string) => {
    if (entityId === 'Patient') {
      setSelectedPatientQr(record);
      setQrType('patient');
      setQrPurpose('Universal Clinical Registration');
      setIsQrModalOpen(true);
    } else if (entityId === 'Staff') {
      setSelectedPatientQr(record);
      setQrType('staff');
      setQrPurpose('Clinical Staff Shift & Duty Verification');
      setIsQrModalOpen(true);
    } else if (entityId === 'User') {
      setSelectedPatientQr(record);
      setQrType('user');
      setQrPurpose('Secure EHR Workspace Authorization');
      setIsQrModalOpen(true);
    } else if (entityId === 'Admission' || entityId === 'Bed') {
      // Inpatient tables (Admission or Bed occupancy)
      const patientMrn = record.patient_mrn || record.mrn || '';
      const matchedPat = patients.find(p => p.mrn === patientMrn || p.id === record.patient_id);
      setSelectedPatientQr(matchedPat || {
        full_name: record.patient_name || 'Inpatient Resident',
        gender: record.gender || 'Unknown',
        blood_group: record.blood_group || 'N/A',
        date_of_birth: record.dob || 'N/A',
        mrn: patientMrn || `MRN-${record.id.slice(0, 4).toUpperCase()}`,
        phone: record.phone || 'N/A',
        id: record.patient_id || record.id
      });
      setQrType('inpatient');
      setQrPurpose(`Inpatient Ward Admission (Ward: ${record.ward || 'General Ward'}, Bed: ${record.bed_number || record.id || 'N/A'})`);
      setIsQrModalOpen(true);
    } else if (entityId === 'ClinicalEncounter' || entityId === 'Form_1_1_1_a_1') {
      // Outpatient tables (Clinical Encounter or Appointment visit)
      const patientMrn = record.patient_mrn || record.mrn || '';
      const matchedPat = patients.find(p => p.mrn === patientMrn || p.id === record.patient_id);
      setSelectedPatientQr(matchedPat || {
        full_name: record.patient_name || 'Outpatient Patient',
        gender: record.gender || 'Unknown',
        blood_group: 'N/A',
        date_of_birth: 'N/A',
        mrn: patientMrn || `MRN-${record.id.slice(0, 4).toUpperCase()}`,
        phone: 'N/A',
        id: record.patient_id || record.id
      });
      setQrType('outpatient');
      setQrPurpose(`Outpatient Consultation (Clinic: ${record.clinic || 'General OPD'})`);
      setIsQrModalOpen(true);
    } else {
      // General record tracing or patient-specific QR
      const patientMrn = record.patient_mrn || '';
      const matchedPat = patientMrn ? patients.find(p => p.mrn === patientMrn) : null;
      if (matchedPat) {
        setSelectedPatientQr(matchedPat);
        setQrType('patient');
        setQrPurpose(`Associated Patient Record Tracking (${entityId})`);
      } else {
        setSelectedPatientQr(record);
        setQrType('record');
        setQrPurpose(`EHR ${entityId} Ledger Cryptographic Verification`);
      }
      setIsQrModalOpen(true);
    }
  };

  const handleSimulateScan = () => {
    let matchedItem: any = null;
    let successMessage = '';

    if (scannerMode === 'patient') {
      matchedItem = patients.find(p => p.id === scannerSelectedItemId);
      if (matchedItem) {
        successMessage = `Verifying Patient Registration QR: ${matchedItem.full_name || matchedItem.name}...`;
        setScannerSuccessMsg(`Verified Patient: ${matchedItem.full_name || matchedItem.name}`);
        setTimeout(() => {
          setIsScannerModalOpen(false);
          setScannerSuccessMsg('');
          setScannerSelectedItemId('');
          setSelectedEntityId('Patient');
          const searchVal = matchedItem.mrn || `MRN-${matchedItem.id.slice(0, 4).toUpperCase()}`;
          setSearchQuery(searchVal);
          setSelectedPatientQr(matchedItem);
          setQrType('patient');
          setQrPurpose('Universal Clinical Registration');
          
          // Automatically load patient record immediately for emergency staff
          if (matchedItem.mrn) {
            setSelectedPatientMrn(matchedItem.mrn);
          }
          setIsQrModalOpen(true);
        }, 1500);
      }
    } else if (scannerMode === 'staff') {
      matchedItem = scannerStaffList.find(s => s.id === scannerSelectedItemId);
      if (matchedItem) {
        successMessage = `Clocking clinical staff shift via Secure Badge: ${matchedItem.full_name}...`;
        setScannerSuccessMsg(`Verified Staff: ${matchedItem.full_name}`);
        setTimeout(() => {
          setIsScannerModalOpen(false);
          setScannerSuccessMsg('');
          setScannerSelectedItemId('');
          setSelectedEntityId('Staff');
          setSearchQuery(matchedItem.full_name || matchedItem.staff_id || '');
          setSelectedPatientQr(matchedItem);
          setQrType('staff');
          setQrPurpose('Clinical Staff Shift & Duty Verification');
          setIsQrModalOpen(true);
          
          alert(`SHIFT CLOCK-IN VERIFIED\nStaff: ${matchedItem.full_name}\nRole: ${matchedItem.role}\nDepartment: ${matchedItem.department.toUpperCase()}\nStatus: Clock-In event synchronized successfully.`);
        }, 1500);
      }
    } else if (scannerMode === 'user') {
      matchedItem = scannerUserList.find(u => u.id === scannerSelectedItemId);
      if (matchedItem) {
        successMessage = `Verifying EHR User Credentials: ${matchedItem.full_name || matchedItem.email}...`;
        setScannerSuccessMsg(`Verified User: ${matchedItem.full_name || matchedItem.email}`);
        setTimeout(() => {
          setIsScannerModalOpen(false);
          setScannerSuccessMsg('');
          setScannerSelectedItemId('');
          setSelectedEntityId('User');
          setSearchQuery(matchedItem.email || matchedItem.full_name || '');
          setSelectedPatientQr(matchedItem);
          setQrType('user');
          setQrPurpose('Secure EHR Workspace Authorization');
          setIsQrModalOpen(true);
        }, 1500);
      }
    } else if (scannerMode === 'inpatient') {
      matchedItem = scannerInpatientList.find(a => a.id === scannerSelectedItemId);
      if (matchedItem) {
        successMessage = `Locating Inpatient Ward Assignment: ${matchedItem.patient_name || matchedItem.patient_mrn}...`;
        setScannerSuccessMsg(`Verified Inpatient: ${matchedItem.patient_name || matchedItem.patient_mrn}`);
        setTimeout(() => {
          setIsScannerModalOpen(false);
          setScannerSuccessMsg('');
          setScannerSelectedItemId('');
          setSelectedEntityId('Admission');
          setSearchQuery(matchedItem.patient_mrn || matchedItem.admission_id || '');
          
          const pat = patients.find(p => p.mrn === matchedItem.patient_mrn);
          setSelectedPatientQr(pat || {
            full_name: matchedItem.patient_name || 'Inpatient Resident',
            mrn: matchedItem.patient_mrn || 'N/A',
            gender: 'Unknown',
            blood_group: 'N/A',
            date_of_birth: 'N/A',
            phone: 'N/A',
            id: matchedItem.id
          });
          setQrType('inpatient');
          setQrPurpose(`Inpatient Ward Admission (Ward: ${matchedItem.ward || 'General Ward'}, Bed: ${matchedItem.bed_number || 'N/A'})`);
          
          // Automatically load patient record immediately for emergency staff
          if (matchedItem.patient_mrn) {
            setSelectedPatientMrn(matchedItem.patient_mrn);
          }
          setIsQrModalOpen(true);
        }, 1500);
      }
    } else if (scannerMode === 'outpatient') {
      matchedItem = scannerOutpatientList.find(e => e.id === scannerSelectedItemId);
      if (matchedItem) {
        successMessage = `Loading Outpatient Consultation Encounter: ${matchedItem.patient_name || matchedItem.patient_mrn}...`;
        setScannerSuccessMsg(`Verified Outpatient: ${matchedItem.patient_name || matchedItem.patient_mrn}`);
        setTimeout(() => {
          setIsScannerModalOpen(false);
          setScannerSuccessMsg('');
          setScannerSelectedItemId('');
          setSelectedEntityId('ClinicalEncounter');
          setSearchQuery(matchedItem.patient_mrn || matchedItem.visit_id || '');
          
          const pat = patients.find(p => p.mrn === matchedItem.patient_mrn);
          setSelectedPatientQr(pat || {
            full_name: matchedItem.patient_name || 'Outpatient Patient',
            mrn: matchedItem.patient_mrn || 'N/A',
            gender: 'Unknown',
            blood_group: 'N/A',
            date_of_birth: 'N/A',
            phone: 'N/A',
            id: matchedItem.id
          });
          setQrType('outpatient');
          setQrPurpose(`Outpatient Consultation (Clinic: ${matchedItem.clinic || 'General OPD'}, Visit ID: ${matchedItem.visit_id || 'N/A'})`);
          
          // Automatically load patient record immediately for emergency staff
          if (matchedItem.patient_mrn) {
            setSelectedPatientMrn(matchedItem.patient_mrn);
          }
          setIsQrModalOpen(true);
        }, 1500);
      }
    }

    if (!matchedItem) {
      alert('Please select an item to simulate scanning.');
    }
  };
  
  // Prescription items inline builder states
  const [itemDrug, setItemDrug] = useState('');
  const [itemDose, setItemDose] = useState('');
  const [itemFreq, setItemFreq] = useState('');
  const [itemDur, setItemDur] = useState('');

  // InsuranceClaim services inline builder states
  const [serviceType, setServiceType] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceAmount, setServiceAmount] = useState('');

  // LabResult result_entries inline builder states
  const [entryParam, setEntryParam] = useState('');
  const [entryVal, setEntryVal] = useState('');
  const [entryUnit, setEntryUnit] = useState('');
  const [entryRef, setEntryRef] = useState('');
  const [entryFlag, setEntryFlag] = useState('normal');

  // Simple tag builder states
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newTargetRole, setNewTargetRole] = useState('');
  
  // Interactive filters for ClinicalEncounter and Staff
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState({
    encounter_type: '',
    clinic: '',
    vitals_pulse_min: '',
    vitals_pulse_max: '',
    vitals_temp_min: '',
    vitals_temp_max: '',
    vitals_spo2_min: '',
    vitals_spo2_max: '',
    vitals_respiratory_rate_min: '',
    vitals_respiratory_rate_max: '',
    vitals_weight_min: '',
    vitals_weight_max: '',
    encounter_date_from: '',
    encounter_date_to: '',
    status: '',
    priority: '',
    // Staff filters
    staff_id: '',
    full_name: '',
    department: '',
    role: '',
    // Prescription filters
    prescribed_at_from: '',
    prescribed_at_to: '',
    prescription_items_query: '',
    prescription_status: '',
    dispensed_at_from: '',
    dispensed_at_to: '',
    prescription_payer_method: '',
    // Diagnostic filters
    diagnostic_category: '',
    diagnostic_ordered_at_from: '',
    diagnostic_ordered_at_to: '',
    diagnostic_is_critical: '',
    diagnostic_status: '',
    diagnostic_turnaround_min: '',
    diagnostic_turnaround_max: '',
    // Bed filters
    bed_ward: '',
    bed_status: '',
    bed_admission_date_from: '',
    bed_admission_date_to: '',
    bed_expected_discharge_from: '',
    bed_expected_discharge_to: '',
    // VitalSign filters
    vital_sign_taken_at_from: '',
    vital_sign_taken_at_to: '',
    vital_sign_hr_min: '',
    vital_sign_hr_max: '',
    vital_sign_temp_min: '',
    vital_sign_temp_max: '',
    vital_sign_spo2_min: '',
    vital_sign_spo2_max: '',
    vital_sign_bp_sys_min: '',
    vital_sign_bp_sys_max: '',
    // Patient filters
    patient_mrn: '',
    patient_gender: '',
    patient_blood_group: '',
    patient_cbhi_status: '',
    patient_region: '',
    patient_woreda: '',
    patient_status: '',
    patient_registration_date_from: '',
    patient_registration_date_to: '',
    // LabResult filters
    lab_result_panel: '',
    lab_result_status: '',
    lab_result_test_type: '',
    lab_result_is_critical: '',
    lab_result_resulted_at_from: '',
    lab_result_resulted_at_to: '',
    // Admission filters
    admission_ward: '',
    admission_type: '',
    admission_status: '',
    admission_date_from: '',
    admission_date_to: '',
    // LiaisonOffice filters
    liaison_referral_type: '',
    liaison_status: '',
    liaison_source_facility: '',
    liaison_destination_facility: '',
    liaison_date_from: '',
    liaison_date_to: '',
    // Immunization filters
    immunization_vaccine_name: '',
    immunization_administered_at_from: '',
    immunization_administered_at_to: '',
    // OperativeRecord filters
    operative_procedure_name: '',
    operative_outcome: '',
    operative_start_time_from: '',
    operative_start_time_to: '',
    // SupplyItem filters
    supply_category: '',
    supply_location: '',
    supply_status: '',
    // FinancialLedger filters
    financial_service_type: '',
    financial_payer_method: '',
    financial_status: '',
    financial_tx_date_from: '',
    financial_tx_date_to: '',
    // InsuranceClaim filters
    claim_insurer: '',
    claim_status: '',
    claim_date_from: '',
    claim_date_to: '',
    // User filters
    user_role: '',
    user_hospital_id: '',
    user_created_date_from: '',
    user_created_date_to: '',
    // PatientJourneyEvent filters
    journey_stage: '',
    journey_status: '',
    journey_event_time_from: '',
    journey_event_time_to: '',
    // Notification filters
    notification_type: '',
    notification_severity: '',
    notification_is_read: '',
    notification_event_time_from: '',
    notification_event_time_to: '',
    // NotificationPreference filters
    pref_role: '',
    pref_alert_type: '',
    pref_min_severity: '',
    pref_enabled: '',
  });

  // Dynamic access control permissions
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isRecentlyDeletedOpen, setIsRecentlyDeletedOpen] = useState(false);
  const [recentlyDeletedRecords, setRecentlyDeletedRecords] = useState<Record<string, any>[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImportingInProgress, setIsImportingInProgress] = useState(false);
  const [permissions, setPermissions] = useState([
    {
      id: 'creator_only',
      type: 'Creator Only',
      rule: 'Users can only access records they created',
      create: false,
      read: true,
      update: true,
      delete: false,
    },
    {
      id: 'field_comparison',
      type: 'Entity-User Field Comparison',
      rule: 'attending_clinician = user.email',
      create: true,
      read: true,
      update: true,
      delete: false,
    },
    {
      id: 'role_admin',
      type: 'User Property Check',
      rule: 'role = admin',
      create: true,
      read: true,
      update: true,
      delete: true,
    },
    {
      id: 'role_physician',
      type: 'User Property Check',
      rule: 'role = physician',
      create: true,
      read: true,
      update: true,
      delete: false,
    },
    {
      id: 'role_nurse',
      type: 'User Property Check',
      rule: 'role = nurse',
      create: true,
      read: true,
      update: true,
      delete: false,
    },
    {
      id: 'role_receptionist',
      type: 'User Property Check',
      rule: 'role = receptionist',
      create: true,
      read: true,
      update: false,
      delete: false,
    },
  ]);

  useEffect(() => {
    if (selectedEntityId === 'Bed') {
      setPermissions([
        {
          id: 'field_comparison_bed',
          type: 'Entity-User Field Comparison',
          rule: 'attending_physician = user.email',
          create: true,
          read: true,
          update: true,
          delete: true,
        },
        {
          id: 'role_admin_bed',
          type: 'User Property Check',
          rule: 'role = admin',
          create: true,
          read: true,
          update: true,
          delete: true,
        },
        {
          id: 'role_ward_manager_bed',
          type: 'User Property Check',
          rule: 'role = ward_manager',
          create: true,
          read: true,
          update: true,
          delete: true,
        },
        {
          id: 'role_nurse_bed',
          type: 'User Property Check',
          rule: 'role = nurse',
          create: true,
          read: true,
          update: true,
          delete: true,
        },
        {
          id: 'role_physician_bed',
          type: 'User Property Check',
          rule: 'role = physician',
          create: true,
          read: true,
          update: true,
          delete: true,
        }
      ]);
    } else if (selectedEntityId === 'Staff') {
      setPermissions([
        {
          id: 'field_comparison_staff',
          type: 'Entity-User Field Comparison',
          rule: 'email = user.email',
          create: true,
          read: true,
          update: true,
          delete: false,
        },
        {
          id: 'role_admin_staff',
          type: 'User Property Check',
          rule: 'role = admin',
          create: true,
          read: true,
          update: true,
          delete: true,
        }
      ]);
    } else {
      setPermissions([
        {
          id: 'creator_only',
          type: 'Creator Only',
          rule: 'Users can only access records they created',
          create: false,
          read: true,
          update: true,
          delete: false,
        },
        {
          id: 'field_comparison',
          type: 'Entity-User Field Comparison',
          rule: 'attending_clinician = user.email',
          create: true,
          read: true,
          update: true,
          delete: false,
        },
        {
          id: 'role_admin',
          type: 'User Property Check',
          rule: 'role = admin',
          create: true,
          read: true,
          update: true,
          delete: true,
        },
        {
          id: 'role_physician',
          type: 'User Property Check',
          rule: 'role = physician',
          create: true,
          read: true,
          update: true,
          delete: false,
        },
        {
          id: 'role_nurse',
          type: 'User Property Check',
          rule: 'role = nurse',
          create: true,
          read: true,
          update: true,
          delete: false,
        },
        {
          id: 'role_receptionist',
          type: 'User Property Check',
          rule: 'role = receptionist',
          create: true,
          read: true,
          update: false,
          delete: false,
        },
      ]);
    }
  }, [selectedEntityId]);

  const selectedEntity = React.useMemo(() => {
    let base = ENTITIES_CONFIG[selectedEntityId];
    if (!base) {
      const keys = Object.keys(ENTITIES_CONFIG);
      const matchedKey = keys.find(k => k.toLowerCase() === selectedEntityId.toLowerCase() || k.toLowerCase().startsWith(selectedEntityId.toLowerCase() + '_'));
      if (matchedKey) {
        base = ENTITIES_CONFIG[matchedKey];
      }
    }
    if (!base) {
      base = ENTITIES_CONFIG['MonthlyReportHub'] || ENTITIES_CONFIG[Object.keys(ENTITIES_CONFIG)[0]];
    }
    const extra = (customSchemaFields[selectedEntityId] || []).concat(customFieldsDb[selectedEntityId] || []);
    return {
      ...base,
      fields: [...(base.fields || []), ...extra]
    };
  }, [selectedEntityId, customSchemaFields, customFieldsDb]);

  // Dynamic keys found in database records (columns that are NOT in the schema)
  const dynamicKeys = React.useMemo(() => {
    const keys = new Set<string>();
    records.forEach(rec => {
      Object.keys(rec).forEach(k => {
        if (!['id', 'created_at', 'updated_at', 'hospital_id'].includes(k)) {
          keys.add(k);
        }
      });
    });
    return Array.from(keys);
  }, [records]);

  // All columns that can possibly be displayed for the selected entity (schema fields + dynamic keys)
  const allAvailableColumns = React.useMemo(() => {
    const schemaKeys = selectedEntity.fields.map(f => f.key);
    const combined = [...schemaKeys];
    dynamicKeys.forEach(k => {
      if (!combined.includes(k)) {
        combined.push(k);
      }
    });
    return combined.map(key => {
      const field = selectedEntity.fields.find(f => f.key === key);
      return {
        key,
        label: field ? field.label : key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' (Dynamic)',
        isSchema: !!field,
        type: field ? field.type : 'string' as const
      };
    });
  }, [selectedEntity.fields, dynamicKeys]);

  // Active columns to render in the table
  const activeColumns = React.useMemo(() => {
    const customKeys = userColumns[selectedEntityId];
    if (customKeys && customKeys.length > 0) {
      return customKeys.map(key => {
        const field = selectedEntity.fields.find(f => f.key === key);
        if (field) return field;
        return {
          key,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' (Dynamic)',
          type: 'string' as const
        };
      });
    }

    // Default to showing all fields for Form 1.1.1 series
    if (selectedEntityId.startsWith('Form_1_1_1') || selectedEntityId.startsWith('Form_')) {
      return selectedEntity.fields;
    }

    // Otherwise, use default filtering for other collections
    const fieldsToKeep = selectedEntity.fields.filter(f => {
      const id = selectedEntity.id;
      if (id === 'User') return ['full_name', 'email', 'role', 'hospital_id', 'created_date'].includes(f.key);
      if (id === 'Staff') return ['staff_id', 'full_name', 'department', 'role', 'status'].includes(f.key);
      if (id === 'Patient') return ['mrn', 'full_name', 'gender', 'phone', 'status'].includes(f.key);
      if (id === 'Immunization') return ['imm_id', 'patient_name', 'vaccine_name', 'dose_number', 'administered_at'].includes(f.key);
      if (id === 'ClinicalEncounter') return ['visit_id', 'patient_name', 'encounter_type', 'status', 'priority'].includes(f.key);
      if (id === 'OperativeRecord') return ['op_id', 'patient_name', 'procedure_name', 'surgeon', 'outcome', 'start_time'].includes(f.key);
      if (id === 'Admission') return ['admission_id', 'patient_name', 'ward', 'bed_number', 'admission_date', 'status'].includes(f.key);
      if (id === 'LiaisonOffice') return ['referral_id', 'patient_name', 'destination_facility', 'referral_type', 'status', 'referral_date'].includes(f.key);
      if (id === 'Form_1_1_1_a_1') return ['appointment_id', 'patient_name', 'clinic', 'appointment_type', 'scheduled_at', 'status'].includes(f.key);
      if (id === 'Bed') return ['bed_number', 'ward', 'status', 'patient_name', 'admission_date'].includes(f.key);
      if (id === 'Prescription') return ['rx_id', 'patient_name', 'prescribed_at', 'items', 'status'].includes(f.key);
      if (id === 'Diagnostic') return ['test_id', 'patient_name', 'category', 'test_type', 'status', 'ordered_at'].includes(f.key);
      if (id === 'LabResult') return ['result_id', 'patient_name', 'test_type', 'panel', 'status', 'resulted_at'].includes(f.key);
      if (id === 'InsuranceClaim') return ['claim_id', 'patient_name', 'insurer', 'total_amount', 'status', 'claim_date'].includes(f.key);
      if (id === 'FinancialLedger') return ['tx_id', 'patient_name', 'service_type', 'amount', 'status', 'tx_date'].includes(f.key);
      if (id === 'SupplyItem') return ['item_code', 'name', 'category', 'qty_on_hand', 'status', 'location'].includes(f.key);
      if (id === 'Notification') return ['title', 'type', 'severity', 'patient_name', 'is_read', 'event_time'].includes(f.key);
      if (id === 'PatientJourneyEvent') return ['patient_name', 'stage', 'stage_label', 'location', 'handled_by', 'event_time'].includes(f.key);
      if (id === 'NotificationPreference') return ['role', 'alert_type', 'in_app', 'sms', 'email', 'enabled'].includes(f.key);
      
      // Default to showing first 5 fields
      return selectedEntity.fields.slice(0, 5).map(x => x.key).includes(f.key);
    });

    return fieldsToKeep;
  }, [selectedEntity, selectedEntityId, userColumns]);

  // Fetch custom fields configuration
  useEffect(() => {
    const q = query(collection(db, 'custom_fields'));
    return onSnapshot(q, (snap) => {
      const dbFields: Record<string, any[]> = {};
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.entityId) {
          if (!dbFields[data.entityId]) dbFields[data.entityId] = [];
          dbFields[data.entityId].push({ id: doc.id, ...data });
        }
      });
      setCustomFieldsDb(dbFields);
    }, (error) => {
      console.error("Error fetching custom fields:", error);
    });
  }, []);

  // Fetch count stats for all 15 collections on mount and when changes occur
  useEffect(() => {
    const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
    const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;

    const unsubscribes = Object.keys(ENTITIES_CONFIG).map((entityId) => {
      const config = ENTITIES_CONFIG[entityId];
      const q = query(collection(db, config.collectionName));
      console.log(`Fetching from collection: ${config.collectionName} for entity: ${entityId}`);
      return onSnapshot(q, (snapshot) => {
        // Filter snapshot docs according to tenant boundaries
        const filteredDocs = snapshot.docs.filter(doc => {
          if (!activeHospital) return true;
          const data = doc.data();
          // Shared demo records have no hospital_id; allow all tenants to view them to avoid empty dashboards
          if (!data.hospital_id || data.hospital_id === 'demo-global') return true;
          return data.hospital_id === activeHospital.hospital_unique_number;
        }).filter(doc => !isFakeOrFalseRow(doc.data()));

        setStats(prev => ({
          ...prev,
          [entityId]: filteredDocs.length
        }));

        // If the snapshot belongs to the currently active entity, update active records
        if (entityId === selectedEntityId) {
          const list = filteredDocs.map(doc => {
            const data = doc.data();
            if (entityId === 'Patient') {
              return {
                id: doc.id,
                ...data,
                full_name: data.full_name || data.name || '',
                date_of_birth: data.date_of_birth || data.dob || '',
                phone: data.phone || '',
                mrn: data.mrn || `MRN-${doc.id.slice(0, 4).toUpperCase()}`,
                status: data.status || 'active'
              };
            }
            return {
              id: doc.id,
              ...data
            };
          });
          setRecords(list);
        }
      }, (error) => {
        console.warn(`Firestore subscription error for ${entityId}:`, error);
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [selectedEntityId]);

  // Listen to recently deleted records in real-time
  useEffect(() => {
    const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
    const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
    const hospital_id = activeHospital?.hospital_unique_number;

    const q = query(collection(db, 'recently_deleted'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((item: any) => {
          if (!hospital_id) return true;
          if (!item.hospital_id || item.hospital_id === 'demo-global') return true;
          return item.hospital_id === hospital_id;
        });
      setRecentlyDeletedRecords(list);
    }, (error) => {
      console.warn("Firestore subscription error for recently_deleted:", error);
    });
  }, []);

  // Listen to patients in real-time for bed assignment selection
  useEffect(() => {
    const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
    const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
    const hospital_id = activeHospital?.hospital_unique_number;

    const q = query(collection(db, 'patients'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          full_name: data.full_name || data.name || '',
          mrn: data.mrn || `MRN-${doc.id.slice(0, 4).toUpperCase()}`
        };
      }).filter((p: any) => {
        if (!hospital_id) return true;
        if (!p.hospital_id || p.hospital_id === 'demo-global') return true;
        return p.hospital_id === hospital_id;
      });
      setPatients(list);
    }, (error) => {
      console.warn("Firestore subscription error for patients in DataExplorer:", error);
    });
  }, []);

  // Listen to sub-form records within the active patient's folder (Form 1.1.1.2)
  useEffect(() => {
    if (selectedEntityId !== 'Form_1_1_1_2' || !hubSelectedMrn || !hubActiveFormId) {
      setHubSubFormRecords([]);
      return;
    }

    const config = ENTITIES_CONFIG[hubActiveFormId];
    if (!config) {
      setHubSubFormRecords([]);
      return;
    }

    setHubSubFormLoading(true);
    const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
    const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
    const hospital_id = activeHospital?.hospital_unique_number;

    const q = query(collection(db, config.collectionName));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter((rec: any) => {
        // Match patient MRN or ID
        const matchesMrn = (
          (rec.patient_mrn && rec.patient_mrn.toLowerCase() === hubSelectedMrn.toLowerCase()) || 
          (rec.patient_id && rec.patient_id.toLowerCase() === hubSelectedMrn.toLowerCase()) || 
          (rec.mrn && rec.mrn.toLowerCase() === hubSelectedMrn.toLowerCase())
        );
        
        // Tenant check
        if (hospital_id && rec.hospital_id && rec.hospital_id !== 'demo-global') {
          return matchesMrn && rec.hospital_id === hospital_id;
        }
        return matchesMrn;
      });

      // Sort by creation date descending
      list.sort((a: any, b: any) => {
        const da = a.created_at || a.date || '';
        const db_ = b.created_at || b.date || '';
        return db_.localeCompare(da);
      });

      setHubSubFormRecords(list);
      setHubSubFormLoading(false);
    }, (error) => {
      console.warn(`Error subscribing to sub-form collection ${config.collectionName}:`, error);
      setHubSubFormLoading(false);
    });

    return unsubscribe;
  }, [selectedEntityId, hubSelectedMrn, hubActiveFormId]);

  // Sync the active folder's overall clinical notes to folderNotes state when the folder is loaded
  useEffect(() => {
    if (selectedEntityId === 'Form_1_1_1_2' && hubSelectedMrn) {
      const folderRecord = records.find(r => r.patient_mrn === hubSelectedMrn || r.mrn === hubSelectedMrn);
      setFolderNotes(folderRecord?.clinical_notes || '');
    }
  }, [selectedEntityId, hubSelectedMrn, records]);

  // Listen to lab metrics for active patient
  useEffect(() => {
    if (!hubSelectedMrn || selectedEntityId !== 'Form_1_1_1_2') {
      setLabMetricsList([]);
      return;
    }
    
    const q = query(
      collection(db, 'patient_lab_metrics'),
      where('patient_mrn', '==', hubSelectedMrn)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(isValidPatientRecord);
      list.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setLabMetricsList(list);
    }, (err) => {
      console.warn("Error listening to lab metrics:", err);
    });
    
    return () => unsub();
  }, [hubSelectedMrn, selectedEntityId]);

  // Listen to vitals (Form_1_1_1_b) for active patient
  useEffect(() => {
    if (!hubSelectedMrn || selectedEntityId !== 'Form_1_1_1_2') {
      setVitalsHistory([]);
      return;
    }
    
    const q = query(
      collection(db, 'form_1_1_1_b'),
      where('patient_mrn', '==', hubSelectedMrn)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(isValidPatientRecord);
      list.sort((a: any, b: any) => new Date(a.created_at || a.date).getTime() - new Date(b.created_at || b.date).getTime());
      setVitalsHistory(list);
    }, (err) => {
      console.warn("Error listening to vitals:", err);
    });
    
    return () => unsub();
  }, [hubSelectedMrn, selectedEntityId]);

  // Draft Recovery Auto-Saver: every 30 seconds
  useEffect(() => {
    if (!hubSelectedMrn || selectedEntityId !== 'Form_1_1_1_2' || !folderNotes) return;
    
    const interval = setInterval(() => {
      localStorage.setItem(`draft_notes_${hubSelectedMrn}`, folderNotes);
      const now = new Date().toLocaleTimeString();
      setDraftSavedAt(now);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [hubSelectedMrn, folderNotes, selectedEntityId]);

  // Check if there is a restorable draft on patient switch
  useEffect(() => {
    if (selectedEntityId === 'Form_1_1_1_2' && hubSelectedMrn) {
      const saved = localStorage.getItem(`draft_notes_${hubSelectedMrn}`);
      const folderRecord = records.find(r => r.patient_mrn === hubSelectedMrn || r.mrn === hubSelectedMrn);
      const currentNotes = folderRecord?.clinical_notes || '';
      
      if (saved && saved.trim() !== currentNotes.trim()) {
        setHasRestorableDraft(true);
      } else {
        setHasRestorableDraft(false);
      }
    } else {
      setHasRestorableDraft(false);
    }
  }, [hubSelectedMrn, selectedEntityId, records]);

  // Speech to Text Dictation Controllers
  const startVoiceDictation = () => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Voice-to-text dictation is not supported in this browser. Please use Google Chrome, Edge, or Safari.");
      return;
    }
    
    try {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';
      
      rec.onstart = () => {
        setIsDictating(true);
      };
      
      rec.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setFolderNotes(prev => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
        });
      };
      
      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please grant permission to use voice dictation.");
        }
        setIsDictating(false);
      };
      
      rec.onend = () => {
        setIsDictating(false);
      };
      
      speechRef.current = rec;
      rec.start();
    } catch (err) {
      console.error("Speech recognition init failed:", err);
      setIsDictating(false);
    }
  };

  const stopVoiceDictation = () => {
    if (speechRef.current) {
      speechRef.current.stop();
      setIsDictating(false);
    }
  };

  // Handle adding or updating a clinical sub-form record from within the universal folder (Form 1.1.1.2)
  const handleHubAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setHubFormError('');
    try {
      const config = ENTITIES_CONFIG[hubActiveFormId];
      if (!config) return;

      const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
      const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
      const hospital_id = activeHospital?.hospital_unique_number || 'HSP-DEMO';

      // Prepopulate and build subPayload
      const recordPayload: Record<string, any> = {
        ...hubFormData,
        hospital_id: hospital_id,
        patient_mrn: hubSelectedMrn,
        mrn: hubSelectedMrn,
        patient_id: hubSelectedMrn
      };

      // Set default patient name if not provided (find from patients or current record)
      const folderRecord = records.find(r => r.patient_mrn === hubSelectedMrn || r.mrn === hubSelectedMrn);
      const patientName = folderRecord?.patient_name || folderRecord?.full_name || patients.find(p => p.mrn === hubSelectedMrn)?.full_name || 'Unknown Patient';
      recordPayload.patient_name = patientName;
      recordPayload.full_name = patientName;

      // Handle custom or standard fields
      config.fields.forEach((field) => {
        const val = recordPayload[field.key];
        if (field.type === 'array') {
          if (Array.isArray(val)) {
            recordPayload[field.key] = val;
          } else if (typeof val === 'string' && val.trim()) {
            recordPayload[field.key] = val.split(',').map((x: string) => x.trim()).filter(Boolean);
          } else {
            recordPayload[field.key] = [];
          }
        } else if (field.key === 'items') {
          recordPayload[field.key] = Array.isArray(val) ? val : [];
        } else if (field.type === 'number') {
          recordPayload[field.key] = Number(val || 0);
        } else if (field.type === 'checkbox') {
          recordPayload[field.key] = !!val;
        }
      });

      // Validate Form 1.1.1.m Outpatient Prescription schema
      if (hubActiveFormId === 'Form_1_1_1_m') {
        const rxValidation = validateOutpatientPrescription(recordPayload);
        if (!rxValidation.isValid) {
          const errList = Object.values(rxValidation.errors).map(err => `• ${err}`).join('\n');
          setHubFormError(`Prescription Validation Error:\n${errList}`);
          return;
        }
      }

      if (hubEditingRecordId) {
        // Update record
        await updateEHRRecord(config.collectionName, hubEditingRecordId, {
          ...recordPayload,
          updated_at: new Date().toISOString()
        });
      } else {
        // Create new record
        const duplicate = records.find(r => (r.patient_mrn === hubSelectedMrn || r.mrn === hubSelectedMrn) && r.form_id === hubActiveFormId);
        if (duplicate) {
          setHubFormError('A record for this form already exists for this patient. Please edit the existing record instead.');
          return;
        }
        await saveEHRRecord(config.collectionName, recordPayload, hubActiveFormId, config, hospital_id);
      }

      // Automatically save patient registration info to localStorage for carryover
      if (['Form_1_1_1', 'Form_1_1_1_0', 'Form_1_1_1_1', 'Form_1_1_1_a'].includes(hubActiveFormId)) {
        const hspId = recordPayload.hospital_id || hospital_id;
        const mrn = recordPayload.patient_mrn || '';
        const name = recordPayload.patient_name || '';
        if (hspId) localStorage.setItem('saved_hospital_id', hspId);
        if (mrn) localStorage.setItem('saved_patient_mrn', mrn);
        if (name) localStorage.setItem('saved_patient_name', name);
        
        // Specifically save the full record if it's Form_1_1_1_a
        if (hubActiveFormId === 'Form_1_1_1_a') {
            localStorage.setItem('saved_form_a_data', JSON.stringify(recordPayload));
        }
      }

      setHubEditingRecordId(null);
      setHubFormError('');

      // Auto-next form logic for Clinical Repository Hub
      const fullSequence = [
        'Form_1_1_1', 'Form_1_1_1_0', 'Form_1_1_1_1', 
        'Form_1_1_1_a', 'Form_1_1_1_b', 'Form_1_1_1_c', 'Form_1_1_1_d', 'Form_1_1_1_e', 'Form_1_1_1_f',
        'Form_1_1_1_g', 'Form_1_1_1_g_1', 'Form_1_1_1_h', 'Form_1_1_1_i', 'Form_1_1_1_i_1', 'Form_1_1_1_j',
        'Form_1_1_1_k', 'Form_1_1_1_l', 'Form_1_1_1_m', 'Form_1_1_1_n', 'Form_1_1_1_n_1', 'Form_1_1_1_o',
        'Form_1_1_1_p', 'Form_1_1_1_p_1', 'Form_1_1_1_q', 'Form_1_1_1_r', 'Form_1_1_1_r_1', 'Form_1_1_1_r_2',
        'Form_1_1_1_s', 'Form_1_1_1_t', 'Form_1_1_1_t_1', 'Form_1_1_1_t_2', 'Form_1_1_1_u', 'Form_1_1_1_u_1',
        'Form_1_1_1_v', 'Form_1_1_1_v_1', 'Form_1_1_1_v_2', 'Form_1_1_1_v_3', 'Form_1_1_1_v_4', 'Form_1_1_1_v_5',
        'Form_1_1_1_v_6', 'Form_1_1_1_v_7', 'Form_1_1_1_v_8', 'Form_1_1_1_w', 'Form_1_1_1_x', 'Form_1_1_1_y',
        'Form_1_1_1_z', 'Form_1_1_1_z_1', 'Form_1_1_1_z_2', 'Form_1_1_1_z_3', 'Form_1_1_1_z_4', 'Form_1_1_1_z_a_b', 'Form_1_1_1_z_a_c'
      ];

      const currentIndex = fullSequence.indexOf(hubActiveFormId);
      if (currentIndex !== -1 && currentIndex < fullSequence.length - 1) {
        const nextFormId = fullSequence[currentIndex + 1];
        if (ENTITIES_CONFIG[nextFormId]) {
          const nextConfig = ENTITIES_CONFIG[nextFormId];
          const initial: Record<string, any> = {
            patient_mrn: localStorage.getItem('saved_patient_mrn') || hubSelectedMrn,
            mrn: localStorage.getItem('saved_patient_mrn') || hubSelectedMrn,
            patient_id: localStorage.getItem('saved_patient_mrn') || hubSelectedMrn,
            patient_name: localStorage.getItem('saved_patient_name') || patientName,
            full_name: localStorage.getItem('saved_patient_name') || patientName,
            hospital_id: localStorage.getItem('saved_hospital_id') || hospital_id
          };
          
          // Prepopulate with saved Form_1_1_1_a data if moving to b
          if (nextFormId === 'Form_1_1_1_b') {
            const savedAData = localStorage.getItem('saved_form_a_data');
            if (savedAData) {
                const parsedAData = JSON.parse(savedAData);
                if (parsedAData.blood_pressure) initial.blood_pressure = parsedAData.blood_pressure;
                if (parsedAData.temperature) initial.temperature = parsedAData.temperature;
                if (parsedAData.pulse) initial.pulse = parsedAData.pulse;
            }
          }

          nextConfig.fields.forEach(f => {
            if (f.key === 'items') initial[f.key] = [];
            else if (f.defaultValue) initial[f.key] = f.defaultValue;
          });
          setHubFormData(initial);
          setHubActiveFormId(nextFormId);
          setIsHubAddFormOpen(true);
        } else {
          setHubFormData({});
          setIsHubAddFormOpen(false);
        }
      } else {
        setHubFormData({});
        setIsHubAddFormOpen(false);
      }
    } catch (err: any) {
      console.error("Error saving record to clinical sub-collection:", err);
      setHubFormError(err.message || 'An error occurred while saving the clinical record.');
    }
  };

  const handleHubDeleteRecord = async (recordId: string) => {
    if (!window.confirm('Are you sure you want to delete this clinical record from the patient folder?')) return;
    try {
      const config = ENTITIES_CONFIG[hubActiveFormId];
      if (!config) return;
      
      await deleteEHRRecord(config.collectionName, recordId);
    } catch (err) {
      console.error("Error deleting clinical record from folder:", err);
    }
  };

  // Handle adding or updating a record dynamically
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      // Clean up fields to store proper types
      const recordPayload: Record<string, any> = {};
      selectedEntity.fields.forEach((field) => {
        const val = formData[field.key];
        if (field.key === 'items') {
          recordPayload[field.key] = Array.isArray(val) ? val : [];
        } else if (field.type === 'array') {
          if (Array.isArray(val)) {
            recordPayload[field.key] = val;
          } else if (typeof val === 'string' && val.trim()) {
            const trimmed = val.trim();
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
              try {
                recordPayload[field.key] = JSON.parse(trimmed);
              } catch (e) {
                recordPayload[field.key] = trimmed.split(',').map(item => item.trim()).filter(Boolean);
              }
            } else {
              recordPayload[field.key] = trimmed.split(',').map(item => item.trim()).filter(Boolean);
            }
          } else {
            recordPayload[field.key] = [];
          }
        } else if (field.type === 'checkbox') {
          recordPayload[field.key] = val === true || String(val) === 'true';
        } else if (field.type === 'number') {
          recordPayload[field.key] = val !== '' && val !== undefined && val !== null ? Number(val) : '';
        } else {
          recordPayload[field.key] = val !== undefined && val !== null ? val : '';
        }
      });

      // Maintain backward compatibility for patient files (AddPatientForm/PatientList fields mapping)
      if (selectedEntity.id === 'Patient') {
        // Run Zod validation before saving
        const validationResult = patientSchema.safeParse({
          name: (recordPayload.full_name || '').trim(),
          dob: recordPayload.dob || '',
          gender: recordPayload.gender || 'Male',
          mrn: (recordPayload.mrn || `MRN-${Math.floor(1000 + Math.random() * 9000)}`).trim(),
          age: recordPayload.age !== undefined && recordPayload.age !== '' ? Number(recordPayload.age) : 30,
          address: recordPayload.address || 'Local',
          phone: (recordPayload.phone || '').trim()
        });

        if (!validationResult.success) {
          const errors = validationResult.error.issues.map(err => err.message).join(' ');
          setFormError(errors);
          return;
        }

        // Apply back mappings
        recordPayload.name = recordPayload.full_name;
        recordPayload.dob = recordPayload.dob;
        if (!recordPayload.mrn || !recordPayload.mrn.trim()) {
          recordPayload.mrn = `MRN-${Math.floor(1000 + Math.random() * 9000)}`;
        }
      }

      if (editingRecordId) {
        // Edit/Adjust mode
        const docRef = doc(db, selectedEntity.collectionName, editingRecordId);
        const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
        const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
        const hospitalId = activeHospital?.hospital_unique_number || 'demo-global';
        await updateDoc(docRef, {
          ...recordPayload,
          hospital_id: hospitalId
        });

        // Automatically save patient registration info to localStorage for carryover
        if (['Form_1_1_1', 'Form_1_1_1_0', 'Form_1_1_1_1'].includes(selectedEntity.id)) {
          const hspId = recordPayload.hospital_id || hospitalId;
          const mrn = recordPayload.patient_mrn || '';
          const name = recordPayload.patient_name || '';
          if (hspId) localStorage.setItem('saved_hospital_id', hspId);
          if (mrn) localStorage.setItem('saved_patient_mrn', mrn);
          if (name) localStorage.setItem('saved_patient_name', name);
        }
      } else {
        // Add new mode
        const collRef = collection(db, selectedEntity.collectionName);
        const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
        const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
        
        const hospitalId = activeHospital?.hospital_unique_number || 'demo-global';
        await addDoc(collRef, {
          ...recordPayload,
          hospital_id: hospitalId,
          created_at: new Date().toISOString()
        });

        // Automatically save patient registration info to localStorage for carryover
        if (['Form_1_1_1', 'Form_1_1_1_0', 'Form_1_1_1_1'].includes(selectedEntity.id)) {
          const hspId = recordPayload.hospital_id || hospitalId;
          const mrn = recordPayload.patient_mrn || '';
          const name = recordPayload.patient_name || '';
          if (hspId) localStorage.setItem('saved_hospital_id', hspId);
          if (mrn) localStorage.setItem('saved_patient_mrn', mrn);
          if (name) localStorage.setItem('saved_patient_name', name);
        }

        // Automatically generate a Patient Records folder for registration forms
        if (['Form_1_1_1', 'Form_1_1_1_0', 'Form_1_1_1_1'].includes(selectedEntity.id)) {
          const patientsCollRef = collection(db, 'patients');
          const mrn = recordPayload.patient_mrn || `MRN-${Math.floor(1000 + Math.random() * 9000)}`;
          const patientName = recordPayload.patient_name || 'Unknown Patient';
          const folderName = `${mrn}_${patientName.replace(/\s+/g, '_')}`;
          
          await addDoc(patientsCollRef, {
            hospital_id: hospitalId,
            mrn: mrn,
            full_name: patientName,
            name: patientName,
            folder_name: folderName,
            created_at: new Date().toISOString(),
            dob: '',
            phone: '',
            address: ''
          });

          // If this is any of the primary registration/payment forms completed, auto-fill all other 1.1.1.x sub-forms
          if (['Form_1_1_1', 'Form_1_1_1_0', 'Form_1_1_1_1'].includes(selectedEntity.id)) {
            const currentDate = new Date().toISOString().split('T')[0];
            const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
            const nowIso = new Date().toISOString();

            const currentSubId = selectedEntity.id.replace('Form_', '').replace(/_/g, '.');
            const subIds = [
              '1.1.1', '1.1.1.0', '1.1.1.1', '1.1.1.2',
              '1.1.1.a', '1.1.1.b', '1.1.1.c', '1.1.1.d', '1.1.1.e', '1.1.1.f',
              '1.1.1.g', '1.1.1.g.1', '1.1.1.h', '1.1.1.i', '1.1.1.i.1', '1.1.1.j',
              '1.1.1.k', '1.1.1.l', '1.1.1.m', '1.1.1.n', '1.1.1.n.1', '1.1.1.o',
              '1.1.1.p', '1.1.1.p.1', '1.1.1.q', '1.1.1.r', '1.1.1.r.1', '1.1.1.r.2',
              '1.1.1.s', '1.1.1.t', '1.1.1.t.1', '1.1.1.t.2', '1.1.1.u', '1.1.1.u.1',
              '1.1.1.v', '1.1.1.v.1', '1.1.1.v.2', '1.1.1.v.3', '1.1.1.v.4', '1.1.1.v.5',
              '1.1.1.v.6', '1.1.1.v.7', '1.1.1.v.8', '1.1.1.w', '1.1.1.x', '1.1.1.y',
              '1.1.1.z', '1.1.1.z.1', '1.1.1.z.2', '1.1.1.z.3', '1.1.1.z.4', '1.1.1.z.a.b', '1.1.1.z.a.c'
            ].filter(id => id !== currentSubId);

            const getSubName = (id: string) => {
              const formKey = `Form_${id.replace(/\./g, '_')}`;
              return ENTITIES_CONFIG[formKey]?.name || id;
            };

            for (const subId of subIds) {
              const subPayload = {
                hospital_id: hospitalId,
                module_id: 'Module-1',
                subsection_id: subId,
                subsection_name: getSubName(subId),
                submitted_at: nowIso,
                data: {
                  ...recordPayload, // Propagate all source form information to sub-forms
                  patient_mrn: mrn,
                  patient_id: mrn,
                  patient_name: patientName,
                  full_name: patientName,
                  date: currentDate,
                  time: currentTime,
                  created_at: nowIso,
                  hospital_id: hospitalId
                }
              };

              // 1. Save to submissions collection
              await addDoc(collection(db, 'hospital_modules_submissions'), subPayload);

              // 2. Save to EHR Schema table automatically if config exists
              const schemaKey = 'Form_' + subId.replace(/\./g, '_');
              if (ENTITIES_CONFIG[schemaKey]) {
                const schema = ENTITIES_CONFIG[schemaKey];
                await addDoc(collection(db, schema.collectionName), {
                  ...subPayload.data,
                  hospital_id: hospitalId,
                  created_at: nowIso
                });
              }
            }
          }
        }
      }

      setEditingRecordId(null);
      setFormError('');
      
      // Auto-play next form logic
      const fullSequence = [
        'Form_1_1_1', 'Form_1_1_1_0', 'Form_1_1_1_1', 
        'Form_1_1_1_a', 'Form_1_1_1_b', 'Form_1_1_1_c', 'Form_1_1_1_d', 'Form_1_1_1_e', 'Form_1_1_1_f',
        'Form_1_1_1_g', 'Form_1_1_1_g_1', 'Form_1_1_1_h', 'Form_1_1_1_i', 'Form_1_1_1_i_1', 'Form_1_1_1_j',
        'Form_1_1_1_k', 'Form_1_1_1_l', 'Form_1_1_1_m', 'Form_1_1_1_n', 'Form_1_1_1_n_1', 'Form_1_1_1_o',
        'Form_1_1_1_p', 'Form_1_1_1_p_1', 'Form_1_1_1_q', 'Form_1_1_1_r', 'Form_1_1_1_r_1', 'Form_1_1_1_r_2',
        'Form_1_1_1_s', 'Form_1_1_1_t', 'Form_1_1_1_t_1', 'Form_1_1_1_t_2', 'Form_1_1_1_u', 'Form_1_1_1_u_1',
        'Form_1_1_1_v', 'Form_1_1_1_v_1', 'Form_1_1_1_v_2', 'Form_1_1_1_v_3', 'Form_1_1_1_v_4', 'Form_1_1_1_v_5',
        'Form_1_1_1_v_6', 'Form_1_1_1_v_7', 'Form_1_1_1_v_8', 'Form_1_1_1_w', 'Form_1_1_1_x', 'Form_1_1_1_y',
        'Form_1_1_1_z', 'Form_1_1_1_z_1', 'Form_1_1_1_z_2', 'Form_1_1_1_z_3', 'Form_1_1_1_z_4', 'Form_1_1_1_z_a_b', 'Form_1_1_1_z_a_c'
      ];
      
      const currentIndex = fullSequence.indexOf(selectedEntity.id);
      if (currentIndex !== -1 && currentIndex < fullSequence.length - 1) {
        const nextEntityId = fullSequence[currentIndex + 1];
        if (ENTITIES_CONFIG[nextEntityId]) {
          const nextEntity = ENTITIES_CONFIG[nextEntityId];
          const initialData: Record<string, any> = {};
          const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
          const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
          const hospitalId = activeHospital?.hospital_unique_number || 'demo-global';

          nextEntity.fields.forEach(f => {
            if (f.key === 'items') {
              initialData[f.key] = [];
            } else if (f.key === 'hospital_id') {
              initialData[f.key] = hospitalId;
            } else if (f.defaultValue) {
              initialData[f.key] = f.defaultValue;
            }
          });

          // Pre-populate with saved registration info from Form_1_1_1 if available
          const savedHspId = localStorage.getItem('saved_hospital_id');
          const savedMrn = localStorage.getItem('saved_patient_mrn');
          const savedName = localStorage.getItem('saved_patient_name');
          if (savedHspId) {
            initialData.hospital_id = savedHspId;
          }
          if (savedMrn) {
            if (nextEntity.fields.some(f => f.key === 'patient_mrn')) {
              initialData.patient_mrn = savedMrn;
            }
            if (nextEntity.fields.some(f => f.key === 'mrn')) {
              initialData.mrn = savedMrn;
            }
          }
          if (savedName) {
            if (nextEntity.fields.some(f => f.key === 'patient_name')) {
              initialData.patient_name = savedName;
            }
            if (nextEntity.fields.some(f => f.key === 'full_name')) {
              initialData.full_name = savedName;
            }
            if (nextEntity.fields.some(f => f.key === 'name')) {
              initialData.name = savedName;
            }
          }

          setFormData(initialData);
          setSelectedEntityId(nextEntityId);
          setIsFormOpen(true);
        } else {
          setFormData({});
          setIsFormOpen(false);
        }
      } else {
        setFormData({});
        setIsFormOpen(false);
      }
    } catch (error: any) {
      console.error('Error saving record:', error);
      setFormError(error.message || 'Error saving record to database. Check connection or credentials.');
    }
  };

  // Handle deleting a record
  const handleDeleteRecord = async (id: string) => {
    if (confirm('Are you sure you want to delete this record? It will be moved to Recently Deleted.')) {
      try {
        const recordData = records.find(r => r.id === id);
        if (recordData) {
          // Deep clean any undefined fields to prevent Firestore serialization errors
          const cleanedData = JSON.parse(JSON.stringify(recordData, (key, value) => {
            return value === undefined ? null : value;
          }));

          await addDoc(collection(db, 'recently_deleted'), {
            collectionName: selectedEntity.collectionName,
            entityId: selectedEntityId,
            data: cleanedData,
            deletedAt: new Date().toISOString(),
            originalId: id,
            hospital_id: cleanedData.hospital_id || 'demo-global'
          });
        }
        await deleteDoc(doc(db, selectedEntity.collectionName, id));
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Error removing record from database');
      }
    }
  };

  const handleDeleteAllRecords = async () => {
    if (records.length === 0) {
      alert("No records to delete.");
      return;
    }
    if (confirm(`Are you sure you want to delete all ${records.length} records from ${selectedEntity.name}? They will be moved to Recently Deleted.`)) {
      try {
        for (const record of records) {
          // Deep clean any undefined fields to prevent Firestore serialization errors
          const cleanedData = JSON.parse(JSON.stringify(record, (key, value) => {
            return value === undefined ? null : value;
          }));

          await addDoc(collection(db, 'recently_deleted'), {
            collectionName: selectedEntity.collectionName,
            entityId: selectedEntityId,
            data: cleanedData,
            deletedAt: new Date().toISOString(),
            originalId: record.id,
            hospital_id: cleanedData.hospital_id || 'demo-global'
          });
          await deleteDoc(doc(db, selectedEntity.collectionName, record.id));
        }
      } catch (error) {
        console.error('Error deleting all records:', error);
        alert('Error clearing the collection');
      }
    }
  };

  const handleRestoreRecord = async (deletedItem: any) => {
    try {
      const { collectionName, data } = deletedItem;
      const restoredPayload = { ...data };
      delete restoredPayload.id;
      
      await addDoc(collection(db, collectionName), restoredPayload);
      await deleteDoc(doc(db, 'recently_deleted', deletedItem.id));
    } catch (error) {
      console.error('Error restoring record:', error);
      alert('Error restoring record');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'recently_deleted', id));
      } catch (error) {
        console.error('Error permanently deleting record:', error);
        alert('Error deleting record');
      }
    }
  };

  const handleClearRecentlyDeleted = async () => {
    const currentDeleted = recentlyDeletedRecords.filter(r => r.collectionName === selectedEntity.collectionName);
    if (currentDeleted.length === 0) return;
    
    if (confirm(`Are you sure you want to permanently empty the trash/recently deleted for ${selectedEntity.name}? This action cannot be undone.`)) {
      try {
        for (const item of currentDeleted) {
          await deleteDoc(doc(db, 'recently_deleted', item.id));
        }
      } catch (error) {
        console.error('Error clearing trash:', error);
        alert('Error emptying trash');
      }
    }
  };

  const handleExportJSON = () => {
    if (records.length === 0) {
      alert("No records to export.");
      return;
    }
    const dataStr = JSON.stringify(filteredRecords, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedEntity.id}_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readImportFile(file);
  };

  const readImportFile = (file: File) => {
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          setImportError("Invalid format: The exported file must contain a JSON array of objects.");
          setImportPreview([]);
          return;
        }
        setImportPreview(parsed);
      } catch (err) {
        setImportError("Error parsing JSON file. Please ensure it is a valid JSON file.");
        setImportPreview([]);
      }
    };
    reader.onerror = () => {
      setImportError("Failed to read the file.");
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (importPreview.length === 0) return;
    setIsImportingInProgress(true);
    try {
      const collRef = collection(db, selectedEntity.collectionName);
      const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
      const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
      const hospitalId = activeHospital?.hospital_unique_number || 'demo-global';
      
      for (const item of importPreview) {
        const payload: Record<string, any> = {};
        selectedEntity.fields.forEach(field => {
          if (item[field.key] !== undefined) {
            payload[field.key] = item[field.key];
          } else if (field.defaultValue !== undefined) {
            payload[field.key] = field.defaultValue;
          }
        });
        payload.created_at = item.created_at || new Date().toISOString();
        payload.hospital_id = item.hospital_id || hospitalId;
        await addDoc(collRef, payload);
      }
      setIsImportOpen(false);
      setImportPreview([]);
      setImportError(null);
      alert(`Successfully imported ${importPreview.length} records into ${selectedEntity.name}.`);
    } catch (err) {
      console.error(err);
      setImportError("Failed to write imported records to database.");
    } finally {
      setIsImportingInProgress(false);
    }
  };

  // Seed default data for the selected entity
  const handleSeedDefaults = async (entityId: string) => {
    setSeedingLoading(entityId);
    const config = ENTITIES_CONFIG[entityId];
    try {
      const collRef = collection(db, config.collectionName);
      const snapshot = await getDocs(collRef);
      
      const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
      const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
      const hospitalId = activeHospital?.hospital_unique_number || 'demo-global';
      
      // Only seed if currently empty
      if (snapshot.empty) {
        for (const record of config.defaultSeed) {
          await addDoc(collRef, {
            ...record,
            hospital_id: record.hospital_id || hospitalId,
            created_at: new Date().toISOString()
          });
        }
      } else {
        alert(`${config.name} already contains data. Clear records before re-seeding if desired.`);
      }
    } catch (error) {
      console.error(`Error seeding ${entityId}:`, error);
    } finally {
      setSeedingLoading(null);
    }
  };

  // Seed all 15 empty collections at once
  const handleSeedAllCollections = async () => {
    if (confirm("Would you like to auto-seed all empty clinical tables with beautiful, realistic EHR demo records?")) {
      setSeedingLoading('ALL_SYSTEM');
      try {
        const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
        const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
        const hospitalId = activeHospital?.hospital_unique_number || 'demo-global';

        for (const entityId of Object.keys(ENTITIES_CONFIG)) {
          const config = ENTITIES_CONFIG[entityId];
          const collRef = collection(db, config.collectionName);
          const snapshot = await getDocs(collRef);
          if (snapshot.empty) {
            for (const record of config.defaultSeed) {
              await addDoc(collRef, {
                ...record,
                hospital_id: record.hospital_id || hospitalId,
                created_at: new Date().toISOString()
              });
            }
          }
        }
        alert("All empty EHR tables have been successfully seeded with realistic clinical data!");
      } catch (error) {
        console.error("Error seeding all tables:", error);
      } finally {
        setSeedingLoading(null);
      }
    }
  };

  // Filter records based on search and selected filter criteria
  const filteredRecords = records.filter(record => {
    // 1. Search Query Filter
    if (searchQuery) {
      const queryStr = searchQuery.toLowerCase();
      let matchesSearch = false;

      // Recursive helper for deep matching of nested objects and arrays
      const deepIncludes = (val: any, query: string): boolean => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          return String(val).toLowerCase().includes(query);
        }
        if (Array.isArray(val)) {
          return val.some(item => deepIncludes(item, query));
        }
        if (typeof val === 'object') {
          return Object.values(val).some(item => deepIncludes(item, query));
        }
        return false;
      };

      if (selectedEntity.id === 'ClinicalEncounter') {
        const searchFields = [
          'visit_id', 'patient_mrn', 'patient_name', 'chief_complaint',
          'soap_subjective', 'soap_objective', 'soap_assessment', 'soap_plan',
          'vitals_bp', 'diagnosis_icd10', 'diagnosis_text', 'attending_clinician'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'Staff') {
        const searchFields = [
          'staff_id', 'full_name', 'role', 'credential', 'phone', 'email'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'Prescription') {
        const searchFields = [
          'rx_id', 'visit_id', 'patient_mrn', 'patient_name', 'prescribed_by', 'diagnosis_text', 'notes'
        ];
        const fieldMatches = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
        const itemsMatches = Array.isArray(record.items) && record.items.some((item: any) => {
          return deepIncludes(item, queryStr);
        });
        matchesSearch = fieldMatches || itemsMatches;
      } else if (selectedEntity.id === 'Form_1_1_1_a_1') {
        const searchFields = [
          'appointment_id', 'patient_mrn', 'patient_name', 'visit_id', 'attending_clinician', 'reason', 'notes'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'Bed') {
        const searchFields = [
          'bed_number', 'patient_mrn', 'patient_name', 'attending_physician', 'notes', 'ward'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'Diagnostic') {
        const searchFields = [
          'test_id', 'visit_id', 'patient_mrn', 'patient_name', 'test_type', 'ordered_by', 'result', 'result_value', 'reference_range', 'image_link'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'LabResult') {
        const searchFields = [
          'result_id', 'diagnostic_id', 'visit_id', 'patient_mrn', 'patient_name', 'test_type', 'panel', 'summary_text', 'resulted_by', 'verified_by'
        ];
        const fieldMatches = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
        const entriesMatches = Array.isArray(record.result_entries) && record.result_entries.some((entry: any) => {
          return deepIncludes(entry, queryStr);
        });
        matchesSearch = fieldMatches || entriesMatches;
      } else if (selectedEntity.id === 'InsuranceClaim') {
        const searchFields = [
          'claim_id', 'patient_mrn', 'patient_name', 'visit_id', 'cbhi_id', 'insurer', 'rejection_reason', 'submitted_by'
        ];
        const fieldMatches = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
        const servicesMatches = Array.isArray(record.services) && record.services.some((service: any) => {
          return deepIncludes(service, queryStr);
        });
        matchesSearch = fieldMatches || servicesMatches;
      } else if (selectedEntity.id === 'Patient') {
        const searchFields = [
          'uid', 'mrn', 'full_name', 'phone', 'region', 'woreda', 'kebele', 'cbhi_id', 'cbhi_status', 'blood_group', 'emergency_contact_name', 'emergency_contact_phone'
        ];
        const fieldMatches = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
        const allergiesMatches = Array.isArray(record.allergies) && record.allergies.some((a: any) => {
          return String(a).toLowerCase().includes(queryStr);
        });
        const conditionsMatches = Array.isArray(record.chronic_conditions) && record.chronic_conditions.some((c: any) => {
          return String(c).toLowerCase().includes(queryStr);
        });
        matchesSearch = fieldMatches || allergiesMatches || conditionsMatches;
      } else if (selectedEntity.id === 'Admission') {
        const searchFields = [
          'admission_id', 'patient_mrn', 'patient_name', 'ward', 'bed_number', 'attending_physician', 'status', 'discharge_summary'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'LiaisonOffice') {
        const searchFields = [
          'referral_id', 'patient_mrn', 'patient_name', 'source_facility', 'destination_facility', 'coordinator', 'reason'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'Immunization') {
        const searchFields = [
          'imm_id', 'patient_mrn', 'patient_name', 'vaccine_name', 'dose_number', 'administered_by', 'notes'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'OperativeRecord') {
        const searchFields = [
          'op_id', 'visit_id', 'patient_mrn', 'patient_name', 'procedure_name', 'surgeon', 'anesthesiologist', 'outcome', 'findings', 'notes'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'SupplyItem') {
        const searchFields = [
          'item_code', 'name', 'category', 'location', 'batch_no', 'supplier', 'status'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'FinancialLedger') {
        const searchFields = [
          'tx_id', 'patient_mrn', 'patient_name', 'service_type', 'description', 'payer_method', 'cbhi_claim_status', 'cashier', 'status'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'InsuranceClaim') {
        const searchFields = [
          'claim_id', 'patient_mrn', 'patient_name', 'visit_id', 'cbhi_id', 'insurer', 'rejection_reason', 'status'
        ];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'User') {
        const searchFields = ['full_name', 'email', 'role', 'created_by_id', 'hospital_id'];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'PatientJourneyEvent') {
        const searchFields = ['patient_mrn', 'patient_name', 'visit_id', 'stage', 'stage_label', 'location', 'handled_by', 'notes', 'status'];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'Notification') {
        const searchFields = ['type', 'severity', 'title', 'message', 'patient_mrn', 'patient_name', 'visit_id', 'journey_stage', 'ward', 'triggered_by'];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else if (selectedEntity.id === 'NotificationPreference') {
        const searchFields = ['role', 'alert_type', 'min_severity'];
        matchesSearch = searchFields.some(key => {
          return record[key] && String(record[key]).toLowerCase().includes(queryStr);
        });
      } else {
        matchesSearch = deepIncludes(record, queryStr);
      }
      if (!matchesSearch) return false;
    }

    // 2. Schema-specific filters (ClinicalEncounter)
    if (selectedEntity.id === 'ClinicalEncounter') {
      // Encounter Type
      if (filters.encounter_type && record.encounter_type !== filters.encounter_type) {
        return false;
      }
      // Clinic
      if (filters.clinic && record.clinic !== filters.clinic) {
        return false;
      }
      // Status
      if (filters.status && record.status !== filters.status) {
        return false;
      }
      // Priority
      if (filters.priority && record.priority !== filters.priority) {
        return false;
      }

      // Vitals Pulse Min/Max
      if (filters.vitals_pulse_min) {
        const pulse = Number(record.vitals_pulse);
        if (isNaN(pulse) || pulse < Number(filters.vitals_pulse_min)) return false;
      }
      if (filters.vitals_pulse_max) {
        const pulse = Number(record.vitals_pulse);
        if (isNaN(pulse) || pulse > Number(filters.vitals_pulse_max)) return false;
      }

      // Vitals Temp Min/Max
      if (filters.vitals_temp_min) {
        const temp = Number(record.vitals_temp);
        if (isNaN(temp) || temp < Number(filters.vitals_temp_min)) return false;
      }
      if (filters.vitals_temp_max) {
        const temp = Number(record.vitals_temp);
        if (isNaN(temp) || temp > Number(filters.vitals_temp_max)) return false;
      }

      // Vitals Spo2 Min/Max
      if (filters.vitals_spo2_min) {
        const spo2 = Number(record.vitals_spo2);
        if (isNaN(spo2) || spo2 < Number(filters.vitals_spo2_min)) return false;
      }
      if (filters.vitals_spo2_max) {
        const spo2 = Number(record.vitals_spo2);
        if (isNaN(spo2) || spo2 > Number(filters.vitals_spo2_max)) return false;
      }

      // Vitals Respiratory Rate Min/Max
      if (filters.vitals_respiratory_rate_min) {
        const rr = Number(record.vitals_respiratory_rate);
        if (isNaN(rr) || rr < Number(filters.vitals_respiratory_rate_min)) return false;
      }
      if (filters.vitals_respiratory_rate_max) {
        const rr = Number(record.vitals_respiratory_rate);
        if (isNaN(rr) || rr > Number(filters.vitals_respiratory_rate_max)) return false;
      }

      // Vitals Weight Min/Max
      if (filters.vitals_weight_min) {
        const weight = Number(record.vitals_weight);
        if (isNaN(weight) || weight < Number(filters.vitals_weight_min)) return false;
      }
      if (filters.vitals_weight_max) {
        const weight = Number(record.vitals_weight);
        if (isNaN(weight) || weight > Number(filters.vitals_weight_max)) return false;
      }

      // Encounter Date From/To
      if (filters.encounter_date_from || filters.encounter_date_to) {
        const encDateStr = record.encounter_date;
        if (!encDateStr) return false;
        
        const encTime = new Date(encDateStr).getTime();
        if (isNaN(encTime)) return false;

        if (filters.encounter_date_from) {
          const fromTime = new Date(filters.encounter_date_from).getTime();
          if (!isNaN(fromTime) && encTime < fromTime) return false;
        }
        if (filters.encounter_date_to) {
          const toTime = new Date(filters.encounter_date_to).getTime();
          if (!isNaN(toTime) && encTime > toTime) return false;
        }
      }
    }

    // 3. Schema-specific filters (Staff)
    if (selectedEntity.id === 'Staff') {
      if (filters.staff_id && !String(record.staff_id || '').toLowerCase().includes(filters.staff_id.toLowerCase())) {
        return false;
      }
      if (filters.full_name && !String(record.full_name || '').toLowerCase().includes(filters.full_name.toLowerCase())) {
        return false;
      }
      if (filters.department && record.department !== filters.department) {
        return false;
      }
      if (filters.role && !String(record.role || '').toLowerCase().includes(filters.role.toLowerCase())) {
        return false;
      }
    }

    if (selectedEntity.id === 'Patient') {
      if (filters.patient_mrn && !String(record.mrn || '').toLowerCase().includes(filters.patient_mrn.toLowerCase())) {
        return false;
      }
      if (filters.patient_gender && record.gender !== filters.patient_gender) {
        return false;
      }
      if (filters.patient_blood_group && record.blood_group !== filters.patient_blood_group) {
        return false;
      }
      if (filters.patient_cbhi_status && record.cbhi_status !== filters.patient_cbhi_status) {
        return false;
      }
      if (filters.patient_status && record.status !== filters.patient_status) {
        return false;
      }
      if (filters.patient_region && !String(record.region || '').toLowerCase().includes(filters.patient_region.toLowerCase())) {
        return false;
      }
      if (filters.patient_woreda && !String(record.woreda || '').toLowerCase().includes(filters.patient_woreda.toLowerCase())) {
        return false;
      }
      if (record.registration_date) {
        const regTime = new Date(record.registration_date).getTime();
        if (!isNaN(regTime)) {
          if (filters.patient_registration_date_from) {
            const fromTime = new Date(filters.patient_registration_date_from).getTime();
            if (!isNaN(fromTime) && regTime < fromTime) return false;
          }
          if (filters.patient_registration_date_to) {
            const toTime = new Date(filters.patient_registration_date_to).getTime();
            if (!isNaN(toTime) && regTime > toTime) return false;
          }
        }
      } else if (filters.patient_registration_date_from || filters.patient_registration_date_to) {
        return false;
      }
    }

    // 4. Schema-specific filters (Prescription)
    if (selectedEntity.id === 'Prescription') {
      // Prescribed At Date range
      if (record.prescribed_at) {
        const prescribedTime = new Date(record.prescribed_at).getTime();
        if (!isNaN(prescribedTime)) {
          if (filters.prescribed_at_from) {
            const fromTime = new Date(filters.prescribed_at_from).getTime();
            if (!isNaN(fromTime) && prescribedTime < fromTime) return false;
          }
          if (filters.prescribed_at_to) {
            const toTime = new Date(filters.prescribed_at_to).getTime();
            if (!isNaN(toTime) && prescribedTime > toTime) return false;
          }
        }
      } else if (filters.prescribed_at_from || filters.prescribed_at_to) {
        return false;
      }

      // Dispensed At Date range
      if (record.dispensed_at) {
        const dispensedTime = new Date(record.dispensed_at).getTime();
        if (!isNaN(dispensedTime)) {
          if (filters.dispensed_at_from) {
            const fromTime = new Date(filters.dispensed_at_from).getTime();
            if (!isNaN(fromTime) && dispensedTime < fromTime) return false;
          }
          if (filters.dispensed_at_to) {
            const toTime = new Date(filters.dispensed_at_to).getTime();
            if (!isNaN(toTime) && dispensedTime > toTime) return false;
          }
        }
      } else if (filters.dispensed_at_from || filters.dispensed_at_to) {
        return false;
      }

      // Status
      if (filters.prescription_status && record.status !== filters.prescription_status) {
        return false;
      }

      // Payer method
      if (filters.prescription_payer_method && record.payer_method !== filters.prescription_payer_method) {
        return false;
      }

      // Items search query
      if (filters.prescription_items_query) {
        const itemQuery = filters.prescription_items_query.toLowerCase();
        const itemsList = Array.isArray(record.items) ? record.items : [];
        const matchesItems = itemsList.some((item: any) => {
          return (
            String(item.drug || '').toLowerCase().includes(itemQuery) ||
            String(item.dose || '').toLowerCase().includes(itemQuery) ||
            String(item.frequency || '').toLowerCase().includes(itemQuery) ||
            String(item.duration || '').toLowerCase().includes(itemQuery)
          );
        });
        if (!matchesItems) return false;
      }
    }

    // 5. Schema-specific filters (LabResult)
    if (selectedEntity.id === 'LabResult') {
      if (filters.lab_result_panel && record.panel !== filters.lab_result_panel) {
        return false;
      }
      if (filters.lab_result_status && record.status !== filters.lab_result_status) {
        return false;
      }
      if (filters.lab_result_test_type && !String(record.test_type || '').toLowerCase().includes(filters.lab_result_test_type.toLowerCase())) {
        return false;
      }
      if (filters.lab_result_is_critical && String(record.is_critical) !== filters.lab_result_is_critical) {
        return false;
      }
      if (record.resulted_at) {
        const resTime = new Date(record.resulted_at).getTime();
        if (!isNaN(resTime)) {
          if (filters.lab_result_resulted_at_from) {
            const fromTime = new Date(filters.lab_result_resulted_at_from).getTime();
            if (!isNaN(fromTime) && resTime < fromTime) return false;
          }
          if (filters.lab_result_resulted_at_to) {
            const toTime = new Date(filters.lab_result_resulted_at_to).getTime();
            if (!isNaN(toTime) && resTime > toTime) return false;
          }
        }
      } else if (filters.lab_result_resulted_at_from || filters.lab_result_resulted_at_to) {
        return false;
      }
    }

    // 6. Schema-specific filters (Diagnostic)
    if (selectedEntity.id === 'Diagnostic') {
      // Category
      if (filters.diagnostic_category && record.category !== filters.diagnostic_category) {
        return false;
      }

      // Ordered At Date range
      if (record.ordered_at) {
        const orderedTime = new Date(record.ordered_at).getTime();
        if (!isNaN(orderedTime)) {
          if (filters.diagnostic_ordered_at_from) {
            const fromTime = new Date(filters.diagnostic_ordered_at_from).getTime();
            if (!isNaN(fromTime) && orderedTime < fromTime) return false;
          }
          if (filters.diagnostic_ordered_at_to) {
            const toTime = new Date(filters.diagnostic_ordered_at_to).getTime();
            if (!isNaN(toTime) && orderedTime > toTime) return false;
          }
        }
      } else if (filters.diagnostic_ordered_at_from || filters.diagnostic_ordered_at_to) {
        return false;
      }

      // Is critical
      if (filters.diagnostic_is_critical) {
        const isCriticalVal = record.is_critical === true || String(record.is_critical) === 'true';
        if (filters.diagnostic_is_critical === 'yes' && !isCriticalVal) return false;
        if (filters.diagnostic_is_critical === 'no' && isCriticalVal) return false;
      }

      // Status
      if (filters.diagnostic_status && record.status !== filters.diagnostic_status) {
        return false;
      }

      // Turnaround minutes range
      if (record.turnaround_minutes !== undefined && record.turnaround_minutes !== '') {
        const turnaround = Number(record.turnaround_minutes);
        if (filters.diagnostic_turnaround_min && turnaround < Number(filters.diagnostic_turnaround_min)) {
          return false;
        }
        if (filters.diagnostic_turnaround_max && turnaround > Number(filters.diagnostic_turnaround_max)) {
          return false;
        }
      } else if (filters.diagnostic_turnaround_min || filters.diagnostic_turnaround_max) {
        return false;
      }
    }

    // 7. Schema-specific filters (Bed)
    if (selectedEntity.id === 'Bed') {
      // Ward
      if (filters.bed_ward && record.ward !== filters.bed_ward) {
        return false;
      }

      // Status
      if (filters.bed_status && record.status !== filters.bed_status) {
        return false;
      }

      // Admission Date range
      if (record.admission_date) {
        const admissionTime = new Date(record.admission_date).getTime();
        if (!isNaN(admissionTime)) {
          if (filters.bed_admission_date_from) {
            const fromTime = new Date(filters.bed_admission_date_from).getTime();
            if (!isNaN(fromTime) && admissionTime < fromTime) return false;
          }
          if (filters.bed_admission_date_to) {
            const toTime = new Date(filters.bed_admission_date_to).getTime();
            if (!isNaN(toTime) && admissionTime > toTime) return false;
          }
        }
      } else if (filters.bed_admission_date_from || filters.bed_admission_date_to) {
        return false;
      }

      // Expected Discharge Date range
      if (record.expected_discharge) {
        const dischargeTime = new Date(record.expected_discharge).getTime();
        if (!isNaN(dischargeTime)) {
          if (filters.bed_expected_discharge_from) {
            const fromTime = new Date(filters.bed_expected_discharge_from).getTime();
            if (!isNaN(fromTime) && dischargeTime < fromTime) return false;
          }
          if (filters.bed_expected_discharge_to) {
            const toTime = new Date(filters.bed_expected_discharge_to).getTime();
            if (!isNaN(toTime) && dischargeTime > toTime) return false;
          }
        }
      } else if (filters.bed_expected_discharge_from || filters.bed_expected_discharge_to) {
        return false;
      }
    }

    // 7. VitalSign filters
    if (selectedEntity.id === 'VitalSign') {
      if (filters.vital_sign_taken_at_from && new Date(record.taken_at) < new Date(filters.vital_sign_taken_at_from)) return false;
      if (filters.vital_sign_taken_at_to && new Date(record.taken_at) > new Date(filters.vital_sign_taken_at_to)) return false;
      if (filters.vital_sign_hr_min && Number(record.heart_rate) < Number(filters.vital_sign_hr_min)) return false;
      if (filters.vital_sign_hr_max && Number(record.heart_rate) > Number(filters.vital_sign_hr_max)) return false;
      if (filters.vital_sign_temp_min && Number(record.temp_c) < Number(filters.vital_sign_temp_min)) return false;
      if (filters.vital_sign_temp_max && Number(record.temp_c) > Number(filters.vital_sign_temp_max)) return false;
      if (filters.vital_sign_spo2_min && Number(record.spo2) < Number(filters.vital_sign_spo2_min)) return false;
      if (filters.vital_sign_spo2_max && Number(record.spo2) > Number(filters.vital_sign_spo2_max)) return false;
      if (filters.vital_sign_bp_sys_min && Number(record.bp_systolic) < Number(filters.vital_sign_bp_sys_min)) return false;
      if (filters.vital_sign_bp_sys_max && Number(record.bp_systolic) > Number(filters.vital_sign_bp_sys_max)) return false;
    }

    if (selectedEntity.id === 'Admission') {
      if (filters.admission_ward && !String(record.ward || '').toLowerCase().includes(filters.admission_ward.toLowerCase())) return false;
      if (filters.admission_type && record.admission_type !== filters.admission_type) return false;
      if (filters.admission_status && record.status !== filters.admission_status) return false;
      if (filters.admission_date_from && new Date(record.admission_date) < new Date(filters.admission_date_from)) return false;
      if (filters.admission_date_to && new Date(record.admission_date) > new Date(filters.admission_date_to)) return false;
    }

    if (selectedEntity.id === 'LiaisonOffice') {
      if (filters.liaison_referral_type && record.referral_type !== filters.liaison_referral_type) return false;
      if (filters.liaison_status && record.status !== filters.liaison_status) return false;
      if (filters.liaison_source_facility && !String(record.source_facility || '').toLowerCase().includes(filters.liaison_source_facility.toLowerCase())) return false;
      if (filters.liaison_destination_facility && !String(record.destination_facility || '').toLowerCase().includes(filters.liaison_destination_facility.toLowerCase())) return false;
      if (filters.liaison_date_from && new Date(record.referral_date) < new Date(filters.liaison_date_from)) return false;
      if (filters.liaison_date_to && new Date(record.referral_date) > new Date(filters.liaison_date_to)) return false;
    }

    if (selectedEntity.id === 'Immunization') {
      if (filters.immunization_vaccine_name && !String(record.vaccine_name || '').toLowerCase().includes(filters.immunization_vaccine_name.toLowerCase())) return false;
      if (filters.immunization_administered_at_from && new Date(record.administered_at) < new Date(filters.immunization_administered_at_from)) return false;
      if (filters.immunization_administered_at_to && new Date(record.administered_at) > new Date(filters.immunization_administered_at_to)) return false;
    }

    if (selectedEntity.id === 'OperativeRecord') {
      if (filters.operative_procedure_name && !String(record.procedure_name || '').toLowerCase().includes(filters.operative_procedure_name.toLowerCase())) return false;
      if (filters.operative_outcome && record.outcome !== filters.operative_outcome) return false;
      if (filters.operative_start_time_from && new Date(record.start_time) < new Date(filters.operative_start_time_from)) return false;
      if (filters.operative_start_time_to && new Date(record.start_time) > new Date(filters.operative_start_time_to)) return false;
    }

    if (selectedEntity.id === 'SupplyItem') {
      if (filters.supply_category && record.category !== filters.supply_category) return false;
      if (filters.supply_location && record.location !== filters.supply_location) return false;
      if (filters.supply_status && record.status !== filters.supply_status) return false;
    }

    if (selectedEntity.id === 'FinancialLedger') {
      if (filters.financial_service_type && record.service_type !== filters.financial_service_type) return false;
      if (filters.financial_payer_method && record.payer_method !== filters.financial_payer_method) return false;
      if (filters.financial_status && record.status !== filters.financial_status) return false;
      if (filters.financial_tx_date_from && new Date(record.tx_date) < new Date(filters.financial_tx_date_from)) return false;
      if (filters.financial_tx_date_to && new Date(record.tx_date) > new Date(filters.financial_tx_date_to)) return false;
    }

    if (selectedEntity.id === 'InsuranceClaim') {
      if (filters.claim_insurer && record.insurer !== filters.claim_insurer) return false;
      if (filters.claim_status && record.status !== filters.claim_status) return false;
      if (filters.claim_date_from && new Date(record.claim_date) < new Date(filters.claim_date_from)) return false;
      if (filters.claim_date_to && new Date(record.claim_date) > new Date(filters.claim_date_to)) return false;
    }

    if (selectedEntity.id === 'User') {
      if (filters.user_role && record.role !== filters.user_role) return false;
      if (filters.user_hospital_id && !String(record.hospital_id || '').toLowerCase().includes(filters.user_hospital_id.toLowerCase())) return false;
      if (filters.user_created_date_from && new Date(record.created_date) < new Date(filters.user_created_date_from)) return false;
      if (filters.user_created_date_to && new Date(record.created_date) > new Date(filters.user_created_date_to)) return false;
    }

    if (selectedEntity.id === 'PatientJourneyEvent') {
      if (filters.journey_stage && record.stage !== filters.journey_stage) return false;
      if (filters.journey_status && record.status !== filters.journey_status) return false;
      if (filters.journey_event_time_from && new Date(record.event_time) < new Date(filters.journey_event_time_from)) return false;
      if (filters.journey_event_time_to && new Date(record.event_time) > new Date(filters.journey_event_time_to)) return false;
    }

    if (selectedEntity.id === 'Notification') {
      if (filters.notification_type && record.type !== filters.notification_type) return false;
      if (filters.notification_severity && record.severity !== filters.notification_severity) return false;
      if (filters.notification_is_read && String(record.is_read) !== filters.notification_is_read) return false;
      if (filters.notification_event_time_from && new Date(record.event_time) < new Date(filters.notification_event_time_from)) return false;
      if (filters.notification_event_time_to && new Date(record.event_time) > new Date(filters.notification_event_time_to)) return false;
    }

    if (selectedEntity.id === 'NotificationPreference') {
      if (filters.pref_role && record.role !== filters.pref_role) return false;
      if (filters.pref_alert_type && record.alert_type !== filters.pref_alert_type) return false;
      if (filters.pref_min_severity && record.min_severity !== filters.pref_min_severity) return false;
      if (filters.pref_enabled && String(record.enabled) !== filters.pref_enabled) return false;
    }

    return true;
  });

  const activeFiltersCount = (() => {
    if (selectedEntity.id === 'ClinicalEncounter') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'encounter_type', 'clinic', 'vitals_pulse_min', 'vitals_pulse_max',
        'vitals_temp_min', 'vitals_temp_max', 'vitals_spo2_min', 'vitals_spo2_max',
        'vitals_respiratory_rate_min', 'vitals_respiratory_rate_max',
        'vitals_weight_min', 'vitals_weight_max', 'encounter_date_from',
        'encounter_date_to', 'status', 'priority'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Staff') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'staff_id', 'full_name', 'department', 'role'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Patient') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'patient_mrn', 'patient_gender', 'patient_blood_group', 'patient_cbhi_status',
        'patient_status', 'patient_region', 'patient_woreda', 'patient_registration_date_from',
        'patient_registration_date_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'LabResult') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'lab_result_panel', 'lab_result_status', 'lab_result_test_type',
        'lab_result_is_critical', 'lab_result_resulted_at_from', 'lab_result_resulted_at_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Prescription') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'prescribed_at_from', 'prescribed_at_to', 'prescription_items_query',
        'prescription_status', 'dispensed_at_from', 'dispensed_at_to',
        'prescription_payer_method'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Form_1_1_1_a_1') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'appointment_clinic', 'appointment_type', 'scheduled_at_from', 'scheduled_at_to',
        'appointment_duration_min', 'appointment_duration_max', 'appointment_status',
        'appointment_reminder_sent'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Diagnostic') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'diagnostic_category', 'diagnostic_ordered_at_from', 'diagnostic_ordered_at_to',
        'diagnostic_is_critical', 'diagnostic_status', 'diagnostic_turnaround_min', 'diagnostic_turnaround_max'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Bed') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'bed_ward', 'bed_status', 'bed_admission_date_from', 'bed_admission_date_to',
        'bed_expected_discharge_from', 'bed_expected_discharge_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'VitalSign') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'vital_sign_taken_at_from', 'vital_sign_taken_at_to',
        'vital_sign_hr_min', 'vital_sign_hr_max',
        'vital_sign_temp_min', 'vital_sign_temp_max',
        'vital_sign_spo2_min', 'vital_sign_spo2_max',
        'vital_sign_bp_sys_min', 'vital_sign_bp_sys_max'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Admission') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'admission_ward', 'admission_type', 'admission_status',
        'admission_date_from', 'admission_date_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'LiaisonOffice') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'liaison_referral_type', 'liaison_status', 'liaison_source_facility',
        'liaison_destination_facility', 'liaison_date_from', 'liaison_date_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Immunization') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'immunization_vaccine_name', 'immunization_administered_at_from', 'immunization_administered_at_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'OperativeRecord') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'operative_procedure_name', 'operative_outcome',
        'operative_start_time_from', 'operative_start_time_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'SupplyItem') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'supply_category', 'supply_location', 'supply_status'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'FinancialLedger') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'financial_service_type', 'financial_payer_method', 'financial_status',
        'financial_tx_date_from', 'financial_tx_date_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'InsuranceClaim') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'claim_insurer', 'claim_status', 'claim_date_from', 'claim_date_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'User') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'user_role', 'user_hospital_id', 'user_created_date_from', 'user_created_date_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'PatientJourneyEvent') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'journey_stage', 'journey_status', 'journey_event_time_from', 'journey_event_time_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'Notification') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'notification_type', 'notification_severity', 'notification_is_read', 'notification_event_time_from', 'notification_event_time_to'
      ].includes(key)).length;
    }
    if (selectedEntity.id === 'NotificationPreference') {
      return Object.entries(filters).filter(([key, val]) => val !== '' && [
        'pref_role', 'pref_alert_type', 'pref_min_severity', 'pref_enabled'
      ].includes(key)).length;
    }
    return 0;
  })();

  return (
    <div className="space-y-6 w-full">
      {/* Global Location & Time Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 shadow-xs">
            <Globe size={22} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800/40">
                AUTO LOCATION DETECTED
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                ACTIVE
              </span>
            </div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ')}</span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                ({new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop() || 'UTC'})
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
          {/* Live Global Clock */}
          <div className="space-y-0.5">
            <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Clock size={11} className="text-indigo-500" /> Live Global Time
            </div>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums tracking-tight">
              {now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }).toUpperCase()}
            </div>
          </div>

          <div className="h-9 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

          {/* System Date */}
          <div className="space-y-0.5">
            <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Calendar size={11} className="text-indigo-500" /> Current Date
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>

          <div className="h-9 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

          {/* Current Year */}
          <div className="space-y-0.5">
            <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Year
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              {now.getFullYear()}
            </div>
          </div>
        </div>
      </div>

      {/* Central Module Workflow Station Dashboard Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white rounded-2xl p-6 shadow-md border border-indigo-500/30 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-500/80 text-white text-[10px] font-extrabold tracking-wider uppercase rounded-md border border-indigo-400/30">
                Station Central
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">
                Data & Explorer Workspace
              </h2>
            </div>
            <h3 className="text-sm font-bold text-indigo-100">
              The Central of All Module Workflow Stations
            </h3>
            <p className="text-xs text-indigo-100/90 max-w-3xl font-medium leading-relaxed">
              Coordinate patient registrations (1.1.1, 1.1.1.0, 1.1.1.1-1.1.1.z), manage clinical flows, triage, prescriptions, billing ledger events, and map full-cycle departmental tasks.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/10 shrink-0 self-start md:self-center">
            <div className="flex items-center gap-2 px-2">
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
              <div className="text-xs font-bold text-white tracking-wide">
                Live
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[640px]">
      
      {/* Entities Sidebar Navigation */}
      <div className={`border-r border-gray-100 flex-col bg-gray-50/50 transition-all duration-300 ${isEntitiesSidebarCollapsed ? 'hidden lg:flex lg:w-16 overflow-hidden' : 'flex w-full lg:w-80'}`}>
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between gap-2">
            {!isEntitiesSidebarCollapsed ? (
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Database size={16} className="text-gray-500" />
                  <span>EHR Schema Editor Add Item Tables</span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5 font-medium text-indigo-600/80">(1.1.1 to 1.1.1.z) add items forms</p>
              </div>
            ) : (
              <div className="flex flex-col items-center mx-auto py-1">
                <Database size={18} className="text-gray-500 animate-pulse" title="EHR Schema Editor Add Item Tables (Minimized)" />
              </div>
            )}
            
            {!isEntitiesSidebarCollapsed && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsGlobalSchemaOpen(true)}
                  className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                  title="View EHR Data Dictionary & Schema"
                >
                  <Database size={15} className="text-gray-600" />
                  <span>Dictionary</span>
                </button>
                <button
                  onClick={handleSeedAllCollections}
                  disabled={seedingLoading === 'ALL_SYSTEM'}
                  className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
                  title="Seed All Empty Tables"
                >
                  <DatabaseZap size={15} className="text-purple-600" />
                  <span>Seed All</span>
                </button>
              </div>
            )}
          </div>
          {!isEntitiesSidebarCollapsed && (
            <div className="mt-4 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tables..."
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50"
              />
            </div>
          )}
        </div>



        {/* List of 15 Tables */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100/60 max-h-[580px]">
          {(() => {
            const filteredEntities = ENTITIES_ORDER.filter((entityId) => {
              const entity = ENTITIES_CONFIG[entityId];
              if (!entity) return false;
              const q = (tableSearchQuery || '').trim().toLowerCase();
              if (!q) return true;
              return (
                (entity.name && String(entity.name).toLowerCase().includes(q)) ||
                (entity.id && String(entity.id).toLowerCase().includes(q)) ||
                (entity.subtitle && String(entity.subtitle).toLowerCase().includes(q)) ||
                (entity.description && String(entity.description).toLowerCase().includes(q))
              );
            });

            const filteredSpecial = SPECIAL_VIEWS.filter(view => {
              const q = (tableSearchQuery || '').trim().toLowerCase();
              if (!q) return true;
              return (
                (view.name || '').toLowerCase().includes(q) ||
                (view.subtitle || '').toLowerCase().includes(q)
              );
            });

            if (filteredEntities.length === 0 && filteredSpecial.length === 0) {
              return (
                <div className="p-8 text-center text-gray-400">
                  <Database size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold">No tables match your search</p>
                  <p className="text-[10px] mt-1 text-gray-400">Try a different query</p>
                </div>
              );
            }

            const itemsToRender = [
              ...filteredSpecial.map(v => ({ ...v, isSpecial: true })),
              ...filteredEntities.map(id => ({ ...ENTITIES_CONFIG[id], isSpecial: false }))
            ];

            return itemsToRender.map((item) => {
              const Icon = item.icon;
              const isActive = selectedEntityId === item.id;
              const count = !item.isSpecial ? (stats[item.id] || 0) : 0;

              if (isEntitiesSidebarCollapsed) {
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedEntityId(item.id);
                      setSearchQuery('');
                      setIsEntitiesSidebarCollapsed(true);
                      setIsSidebarCollapsed?.(true);
                    }}
                    title={`${item.name} ${!item.isSpecial ? `(${count} records)` : ''} - ${item.subtitle}`}
                    className={`w-full flex flex-col items-center justify-center p-3.5 transition-all relative group ${
                      isActive 
                        ? 'bg-white border-l-4 border-gray-900 shadow-sm' 
                        : 'hover:bg-gray-50/70 border-l-4 border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Icon size={16} />
                    </div>
                    {!item.isSpecial && count > 0 && (
                      <span className="absolute top-1.5 right-1.5 text-[8px] bg-emerald-500 text-white px-1 rounded-full font-bold leading-none">
                        {count}
                      </span>
                    )}
                    
                    {/* Floating Tooltip */}
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 z-50 bg-gray-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md border border-gray-800">
                      <p className="font-bold">{item.name}</p>
                      <p className="text-[9px] text-gray-300">{item.subtitle}</p>
                      {!item.isSpecial && <p className="text-[9px] text-emerald-400 mt-0.5">{count} records</p>}
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedEntityId(item.id);
                    setSearchQuery('');
                    setIsEntitiesSidebarCollapsed(true);
                    setIsSidebarCollapsed?.(true);
                  }}
                  className={`w-full text-left p-3.5 flex items-start gap-3 transition-all ${
                    isActive 
                      ? 'bg-white border-l-4 border-gray-900 shadow-sm pl-2.5' 
                      : 'hover:bg-gray-50/70 border-l-4 border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Icon size={16} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-xs font-bold truncate ${isActive ? 'text-gray-950 font-extrabold' : 'text-gray-700'}`}>
                          {item.name}
                        </span>
                        {!item.isSpecial && item.id.startsWith('Form_1_1_1') && (
                          <span className="flex items-center gap-0.5 px-1 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded border border-indigo-100/50 shrink-0 shadow-3xs" title="Verified for real-time indexing">
                            <Check size={8} strokeWidth={3} />
                            Validated
                          </span>
                        )}
                        {item.isSpecial && (
                          <span className="flex items-center gap-0.5 px-1 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase rounded border border-amber-100/50 shrink-0 shadow-3xs">
                            <Sparkles size={8} strokeWidth={3} />
                            HUB
                          </span>
                        )}
                      </div>
                      {!item.isSpecial && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border shrink-0 ${
                          count > 0 
                            ? isActive 
                              ? 'bg-gray-950 text-white border-gray-800'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:bg-emerald-100/50'
                            : 'bg-gray-50 text-gray-400 border-gray-100/50'
                        }`}>
                          {count}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] mt-0.5 font-medium truncate ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            });
          })()}
        </div>

        {/* Sidebar Collapse Toggle Footer */}
        <div className="p-2 border-t border-gray-100 bg-white flex items-center justify-center">
          <button
            onClick={() => setIsEntitiesSidebarCollapsed(!isEntitiesSidebarCollapsed)}
            className="w-full py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
            title={isEntitiesSidebarCollapsed ? "Expand EHR Tables Sidebar" : "Collapse EHR Tables Sidebar"}
          >
            {isEntitiesSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            {!isEntitiesSidebarCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </div>

      {/* Database Explorer Grid Details Pane */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedEntityId !== 'DivisionShortcuts' && (
          <div className="px-6 py-2 border-b border-gray-100 bg-white flex items-center gap-2 shrink-0 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button 
              onClick={() => setSelectedEntityId('DivisionShortcuts')}
              className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase hover:bg-blue-50 px-2 py-1 rounded-lg transition-all border border-blue-100 hover:border-blue-200 shadow-3xs"
            >
              <Zap size={12} />
              <span>Division Shortcuts Hub</span>
            </button>
            <ChevronRight size={10} className="text-gray-300 flex-shrink-0" />
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-gray-100 text-gray-500 rounded">
                {React.createElement(selectedEntity.icon, { size: 10 })}
              </div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{selectedEntity.name}</span>
            </div>
          </div>
        )}
        {isEntitiesSidebarCollapsed && (
          <div className="lg:hidden p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-2 shrink-0">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Schema Table:</span>
            <select
              value={selectedEntityId}
              onChange={(e) => {
                setSelectedEntityId(e.target.value);
                setSearchQuery('');
              }}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-3xs cursor-pointer"
            >
              {ENTITIES_ORDER.map((entityId) => {
                const entity = ENTITIES_CONFIG[entityId];
                if (!entity) return null;
                return (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                );
              })}
            </select>
          </div>
        )}
        {selectedEntityId === 'FinanceHub' ? (
          <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center gap-4 shrink-0">
              <button
                onClick={() => setSelectedEntityId(ENTITIES_ORDER[0] || 'Form_1_1_1_a')}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors flex items-center gap-2 font-bold text-xs"
                title="Back to Data & Explorer"
              >
                <ArrowLeft size={18} />
                <span>Back to Data & Explorer</span>
              </button>
              <div className="h-4 w-px bg-gray-200" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Finance Hub</span>
            </div>
             <FinanceHub onBack={() => setSelectedEntityId(ENTITIES_ORDER[0] || 'Form_1_1_1_a')} />
          </div>
        ) : selectedEntityId === 'AdminCEOHub' ? (
          <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center gap-4 shrink-0">
              <button
                onClick={() => setSelectedEntityId(ENTITIES_ORDER[0] || 'Form_1_1_1_a')}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors flex items-center gap-2 font-bold text-xs"
                title="Back to Data & Explorer"
              >
                <ArrowLeft size={18} />
                <span>Back to Data & Explorer</span>
              </button>
              <div className="h-4 w-px bg-gray-200" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Admin CEO Hub</span>
            </div>
             <AdminCEOHub onBack={() => setSelectedEntityId(ENTITIES_ORDER[0] || 'Form_1_1_1_a')} />
          </div>
        ) : selectedEntityId === 'PatientsOverview' ? (
          <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center gap-4 shrink-0">
              <button
                onClick={() => setSelectedEntityId(ENTITIES_ORDER[0] || 'Form_1_1_1_a')}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors flex items-center gap-2 font-bold text-xs"
                title="Back to Data & Explorer"
              >
                <ArrowLeft size={18} />
                <span>Back to Data & Explorer</span>
              </button>
              <div className="h-4 w-px bg-gray-200" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Patients Overview</span>
            </div>
             <PatientsOverview 
               addToast={(type, msg) => {
                 console.log(`[${type}] ${msg}`);
                 if (type === 'error') alert(msg);
               }}
               hospital_id={(() => {
                 const saved = localStorage.getItem('active_hospital_tenant');
                 return saved ? JSON.parse(saved)?.hospital_unique_number || 'DEFAULT' : 'DEFAULT';
               })()}
             />
          </div>
        ) : selectedEntityId === 'QRBanger' ? (
          <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center gap-4 shrink-0">
              <button
                onClick={() => setSelectedEntityId(ENTITIES_ORDER[0] || 'Form_1_1_1_a')}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors flex items-center gap-2 font-bold text-xs"
                title="Back to Data & Explorer"
              >
                <ArrowLeft size={18} />
                <span>Back to Data & Explorer</span>
              </button>
              <div className="h-4 w-px bg-gray-200" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">QR Banger Studio</span>
            </div>
             <QRBanger 
               addToast={(type, msg) => {
                 console.log(`[${type}] ${msg}`);
                 if (type === 'error') alert(msg);
               }}
             />
          </div>
        ) : selectedEntityId === 'DivisionShortcuts' ? (
          <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center gap-4 shrink-0">
              <button
                onClick={() => setSelectedEntityId(ENTITIES_ORDER[0] || 'Form_1_1_1_a')}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors flex items-center gap-2 font-bold text-xs"
                title="Back to Data & Explorer"
              >
                <ArrowLeft size={18} />
                <span>Back to Data & Explorer</span>
              </button>
              <div className="h-4 w-px bg-gray-200" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Division Shortcuts</span>
            </div>
             <DivisionShortcuts onSelect={handleShortcutSelect} onBack={() => setSelectedEntityId(ENTITIES_ORDER[0] || 'Form_1_1_1_a')} />
          </div>
        ) : selectedEntityId === 'Form_1_1_1_2' ? (
          /* Custom EHR Patient Clinical Folder Hub (Open Hub) Custom UI */
          <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
            {!hubSelectedMrn ? (
              /* State 1: Folders Directory / Dashboard */
              <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="p-6 border-b border-gray-100 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                          <FolderOpen size={16} />
                        </div>
                        <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
                          1.1.1.2 EHR Patient Clinical Folder Hub (Open Hub)
                        </h2>
                      </div>
                      <p className="text-xs text-gray-500 max-w-xl">
                        EHR Clinical Hub Folder Repository. When a patient is registered, the system automatically creates their universal clinical folder containing all records from 1.1.1.a through 1.1.1.z.4.
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        const initialData: Record<string, any> = {};
                        const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
                        const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
                        const hospitalId = activeHospital?.hospital_unique_number || 'demo-global';
                        
                        ENTITIES_CONFIG.Form_1_1_1_2.fields.forEach(f => {
                          if (f.key === 'hospital_id') initialData[f.key] = hospitalId;
                          else if (f.defaultValue) initialData[f.key] = f.defaultValue;
                        });
                        setFormData(initialData);
                        setEditingRecordId(null);
                        setIsFormOpen(true);
                      }}
                      className="flex items-center gap-1.5 bg-indigo-600 text-white px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm self-start sm:self-center shrink-0"
                    >
                      <Plus size={14} />
                      <span>Open New Folder</span>
                    </button>
                  </div>

                  {/* Directory Search & Statistics Bar */}
                  <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-50">
                    <div className="relative w-full sm:max-w-md">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search patient folders by MRN, Name, or Intake Summary..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50 focus:bg-white transition-all text-gray-700"
                      />
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      Total Active Folders: <span className="font-bold text-indigo-600">{records.length}</span>
                    </div>
                  </div>
                </div>

                {/* Folders Grid */}
                <div className="p-6 flex-1">
                  {folderSearchFiltered.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center max-w-lg mx-auto mt-8 shadow-xs">
                      <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 mb-4 text-indigo-500">
                        <FolderOpen size={20} />
                      </div>
                      <h3 className="font-bold text-sm text-gray-800">No Patient Folders Found</h3>
                      <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                        {searchQuery 
                          ? `No matching patient folders found for "${searchQuery}". Check the patient MRN or name and try again.` 
                          : "No clinical folders exist yet. When patient's MRN and name are recorded in primary admission/payment forms, the folder is automatically generated by the system."}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={() => {
                            const initialData: Record<string, any> = {};
                            const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
                            const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
                            const hospitalId = activeHospital?.hospital_unique_number || 'demo-global';
                            
                            ENTITIES_CONFIG.Form_1_1_1_2.fields.forEach(f => {
                              if (f.key === 'hospital_id') initialData[f.key] = hospitalId;
                              else if (f.defaultValue) initialData[f.key] = f.defaultValue;
                            });
                            setFormData(initialData);
                            setEditingRecordId(null);
                            setIsFormOpen(true);
                          }}
                          className="mt-4 inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-all px-3 py-1.5 rounded-lg text-xs font-bold"
                        >
                          <Plus size={12} />
                          <span>Create Folder Manually</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {folderSearchFiltered.map((folder: any) => {
                        const notesPreview = folder.clinical_notes 
                          ? (folder.clinical_notes.length > 120 ? `${folder.clinical_notes.slice(0, 120)}...` : folder.clinical_notes)
                          : '';

                        const statusColors: Record<string, string> = {
                          'Active Folder': 'bg-emerald-50 text-emerald-700 border-emerald-100',
                          'Archived': 'bg-gray-100 text-gray-500 border-gray-200',
                          'Transferred': 'bg-amber-50 text-amber-700 border-amber-100'
                        };

                        return (
                          <div 
                            key={folder.id} 
                            className="bg-white border border-gray-100 rounded-2xl shadow-xs p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-between group border-t-4 border-t-indigo-500"
                          >
                            <div>
                              {/* Card Header */}
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <FolderOpen size={16} />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                      {folder.patient_name || folder.full_name || 'Unknown Patient'}
                                    </h4>
                                    <span className="text-[10px] font-mono text-gray-400">
                                      MRN: {folder.patient_mrn || folder.mrn || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border ${statusColors[folder.hub_status] || 'bg-slate-50 text-slate-600 border-slate-150'}`}>
                                  {folder.hub_status || 'Active Folder'}
                                </span>
                              </div>

                              {/* Clinical Intake Notes Block */}
                              <div className="bg-gray-50 rounded-lg p-3 min-h-[70px] mb-4">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                  Clinical Intake Summary Notes
                                </p>
                                <p className="text-[11px] text-gray-600 italic leading-relaxed">
                                  {notesPreview ? `"${notesPreview}"` : 'No clinical summary notes entered for this clinical folder.'}
                                </p>
                              </div>

                              {/* Time & Tenant Info */}
                              <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono mb-4 pb-3 border-b border-gray-50">
                                <div className="flex items-center gap-1">
                                  <Clock size={11} />
                                  <span>{folder.date ? new Date(folder.date).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <span>Hospital: {folder.hospital_id || 'demo-global'}</span>
                              </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setFormData(folder);
                                    setEditingRecordId(folder.id);
                                    setIsFormOpen(true);
                                  }}
                                  className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Folder Metadata"
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteRecord(folder.id)}
                                  className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 border border-gray-100 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Folder"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>

                              <button
                                onClick={() => {
                                  setHubSelectedMrn(folder.patient_mrn || folder.mrn);
                                  setHubActiveFormId('Form_1_1_1_a');
                                }}
                                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                              >
                                <span>Open Universal Folder</span>
                                <ChevronRight size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* State 2: Patient Individual Clinical Folder Workspace */
              (() => {
                const currentFolder = records.find(r => (r.patient_mrn || r.mrn) === hubSelectedMrn);
                const activePatientName = currentFolder?.patient_name || currentFolder?.full_name || patients.find(p => p.mrn === hubSelectedMrn)?.full_name || 'Unknown Patient';
                
                // Get list of clinical subforms
                const subForms = Object.keys(ENTITIES_CONFIG)
                  .filter(key => key.startsWith('Form_1_1_1') && key !== 'Form_1_1_1_2')
                  .filter(key => {
                    if (!subFormQuery) return true;
                    const cfg = ENTITIES_CONFIG[key];
                    const qLower = subFormQuery.toLowerCase();
                    const subId = key.replace('Form_', '').replace(/_/g, '.');
                    return cfg.name.toLowerCase().includes(qLower) || subId.includes(qLower);
                  })
                  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

                const baseSubFormConfig = ENTITIES_CONFIG[hubActiveFormId] || ENTITIES_CONFIG.Form_1_1_1_a;
                const activeSubFormConfig = {
                  ...baseSubFormConfig,
                  fields: [
                    ...baseSubFormConfig.fields,
                    ...(customFieldsDb[hubActiveFormId] || []),
                  ],
                };

                // Filter active sub-form records
                const filteredSubRecords = hubSubFormRecords.filter((rec: any) => {
                  if (!hubSearchQuery) return true;
                  const q = hubSearchQuery.toLowerCase();
                  return Object.values(rec).some(val => 
                    typeof val === 'string' && val.toLowerCase().includes(q)
                  );
                });

                return (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Folder Header Banner */}
                    <div className="bg-white border-b border-gray-100 p-5 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setHubSelectedMrn('')}
                          className="p-1.5 border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center shrink-0"
                          title="Back to Folders Directory"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                          <FolderOpen size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight">
                              Universal Patient Clinical Folder
                            </h2>
                            <span className="text-[10px] font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-black">
                              MRN: {hubSelectedMrn}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 font-semibold flex items-center gap-1">
                            Patient: <span className="text-gray-800 font-extrabold">{activePatientName}</span>
                          </p>
                        </div>
                      </div>

                      {/* Folder Metadata Sync (Live Controls) */}
                      <div className="flex items-center gap-3 self-start md:self-center shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Folder Status:
                          </span>
                          <select
                            value={currentFolder?.hub_status || 'Active Folder'}
                            onChange={async (e) => {
                              if (currentFolder) {
                                try {
                                  const docRef = doc(db, 'form_1_1_1_2', currentFolder.id);
                                  await updateDoc(docRef, { hub_status: e.target.value });
                                } catch (err) {
                                  console.error("Error updating folder status:", err);
                                }
                              }
                            }}
                            className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white font-bold text-slate-700 cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <option value="Active Folder">Active Folder</option>
                            <option value="Archived">Archived</option>
                            <option value="Transferred">Transferred</option>
                          </select>
                        </div>
                        
                        <div className="h-6 w-px bg-gray-100" />
                        
                        <button
                          onClick={() => setHubSelectedMrn('')}
                          className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
                        >
                          Close Folder
                        </button>
                      </div>
                    </div>

                    {/* Master Clinical Intake Summary (Inline Editable Notes Block) */}
                    <div className="bg-white border-b border-gray-100 p-4 shrink-0 px-6">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                              Overall Clinical Summary & Hub Intake Notes (Stored Globally in Folder Master Directory)
                            </label>
                            <div className="flex items-center gap-2">
                              {draftSavedAt && (
                                <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                                  Draft saved auto at {draftSavedAt}
                                </span>
                              )}
                              {hasRestorableDraft && (
                                <button
                                  onClick={() => {
                                    const saved = localStorage.getItem(`draft_notes_${hubSelectedMrn}`);
                                    if (saved) {
                                      setFolderNotes(saved);
                                      setHasRestorableDraft(false);
                                    }
                                  }}
                                  className="text-[9px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded font-bold cursor-pointer transition-all"
                                >
                                  ⚠️ Restore Unsaved Draft
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-end gap-3">
                            <textarea
                              rows={2}
                              value={folderNotes}
                              onChange={(e) => {
                                setFolderNotes(e.target.value);
                                // Save instant backup on input change
                                localStorage.setItem(`draft_notes_${hubSelectedMrn}`, e.target.value);
                              }}
                              placeholder="Type overall diagnosis summaries, active allergies, medication reviews, or clinical intake notes for this patient session..."
                              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white transition-all text-gray-700"
                            />
                            
                            {/* Speech Recognition Mic Button */}
                            <button
                              type="button"
                              onClick={isDictating ? stopVoiceDictation : startVoiceDictation}
                              className={`px-3.5 py-2.5 border rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer h-fit shadow-xs flex items-center gap-1.5 ${
                                isDictating 
                                  ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' 
                                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                              }`}
                              title={isDictating ? "Stop Recording" : "Dictate Notes (Voice-to-Text)"}
                            >
                              <Mic size={14} className={isDictating ? 'text-rose-600 animate-bounce' : 'text-gray-500'} />
                              <span>{isDictating ? 'Listening...' : 'Dictate'}</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (currentFolder) {
                                  try {
                                    await updateFolderNotes(currentFolder.id, folderNotes);
                                    // Remove backup since successfully saved
                                    localStorage.removeItem(`draft_notes_${hubSelectedMrn}`);
                                    setHasRestorableDraft(false);
                                    alert('Overall clinical notes updated successfully!');
                                  } catch (err) {
                                    console.error("Error updating clinical notes:", err);
                                    alert("Error updating clinical notes: " + err);
                                  }
                                } else {
                                  alert("Clinical Folder record does not exist yet. Ensure the patient folder is completed.");
                                }
                              }}
                              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer h-fit shadow-xs"
                            >
                              Save Summary
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Clinical Folder Sub-navigation Tabs */}
                    <div className="bg-slate-50 border-b border-gray-100 flex items-center justify-between px-6 shrink-0 h-11">
                      <div className="flex gap-2 h-full items-end">
                        <button
                          onClick={() => setFolderActiveTab('ehr')}
                          className={`px-4 py-2 text-xs font-extrabold transition-all h-full flex items-center gap-1.5 border-b-2 cursor-pointer ${
                            folderActiveTab === 'ehr'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          <Folder size={13} />
                          <span>EHR File Cabinet</span>
                        </button>
                        <button
                          onClick={() => setFolderActiveTab('labs')}
                          className={`px-4 py-2 text-xs font-extrabold transition-all h-full flex items-center gap-1.5 border-b-2 cursor-pointer ${
                            folderActiveTab === 'labs'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          <Activity size={13} />
                          <span>Lab Results Dashboard</span>
                        </button>
                        <button
                          onClick={() => setFolderActiveTab('vitals')}
                          className={`px-4 py-2 text-xs font-extrabold transition-all h-full flex items-center gap-1.5 border-b-2 cursor-pointer ${
                            folderActiveTab === 'vitals'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          <HeartPulse size={13} />
                          <span>Vital Signs Monitor</span>
                        </button>
                        <button
                          onClick={() => setFolderActiveTab('export')}
                          className={`px-4 py-2 text-xs font-extrabold transition-all h-full flex items-center gap-1.5 border-b-2 cursor-pointer ${
                            folderActiveTab === 'export'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          <Printer size={13} />
                          <span>Referral & Export (PDF)</span>
                        </button>
                      </div>
                    </div>

                    {/* EHR File Cabinet Tab Content */}
                    {folderActiveTab === 'ehr' && (
                      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                      {/* Left Column: Sub-form Directory Sidebar */}
                      <div className="w-full lg:w-80 border-r border-gray-100 bg-slate-50/50 flex flex-col shrink-0 overflow-hidden h-64 lg:h-full">
                        <div className="p-4 border-b border-gray-100 bg-white">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                            EHR Clinical Subsections
                          </label>
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Filter subsections (e.g. Triage)..."
                              value={subFormQuery}
                              onChange={(e) => setSubFormQuery(e.target.value)}
                              className="w-full pl-8 pr-4 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-all text-gray-700 font-medium"
                            />
                          </div>
                        </div>

                        {/* Subsections List */}
                        <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
                          {subForms.map((key) => {
                            const config = ENTITIES_CONFIG[key];
                            const isSelected = hubActiveFormId === key;
                            const subId = key.replace('Form_', '').replace(/_/g, '.');

                            return (
                              <button
                                key={key}
                                onClick={() => setHubActiveFormId(key)}
                                className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                                  isSelected 
                                    ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                                    : 'hover:bg-gray-100/70 text-gray-600 hover:text-gray-900 bg-white border border-gray-100/50 shadow-3xs'
                                }`}
                              >
                                <div className={`p-1.5 rounded-lg shrink-0 ${
                                  isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-gray-600'
                                }`}>
                                  {React.createElement(config.icon || FileText, { size: 14 })}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className={`text-[9px] font-mono block ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                                    Subsection {subId}
                                  </span>
                                  <span className="text-[11px] font-bold block truncate leading-tight mt-0.5">
                                    {config.name.replace(`${subId} `, '')}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Column: Subsection Workspace Table */}
                      <div className="flex-1 bg-white flex flex-col overflow-hidden h-full">
                        {/* Subsection Title Block */}
                        <div className="p-5 border-b border-gray-100 bg-gray-50/20 shrink-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h3 className="text-sm font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                                <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-[10px]">
                                  {hubActiveFormId.replace('Form_', '').replace(/_/g, '.')}
                                </span>
                                <span>{activeSubFormConfig.name}</span>
                              </h3>
                              <p className="text-[11px] text-gray-500 mt-0.5 max-w-xl">
                                {activeSubFormConfig.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                              <button
                                onClick={() => setIsCustomFieldsOpen(true)}
                                className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                              >
                                <Settings2 size={14} />
                                <span>Configure Fields</span>
                              </button>
                              <button
                                onClick={() => {
                                  // Reset form values to initial subform
                                  const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
                                  const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
                                  const hospitalId = activeHospital?.hospital_unique_number || 'demo-global';

                                  const savedHspId = localStorage.getItem('saved_hospital_id') || hospitalId;
                                  const savedMrn = localStorage.getItem('saved_patient_mrn') || hubSelectedMrn;
                                  const savedName = localStorage.getItem('saved_patient_name') || activePatientName;

                                  const initial: Record<string, any> = {
                                    patient_mrn: savedMrn,
                                    mrn: savedMrn,
                                    patient_id: savedMrn,
                                    patient_name: savedName,
                                    full_name: savedName,
                                    hospital_id: savedHspId
                                  };
                                  
                                  activeSubFormConfig.fields.forEach(f => {
                                    if (f.key === 'items') initial[f.key] = [];
                                    else if (f.defaultValue) initial[f.key] = f.defaultValue;
                                  });
                                  
                                  setHubFormData(initial);
                                  setHubEditingRecordId(null);
                                  setHubFormError('');
                                  setIsHubAddFormOpen(true);
                                }}
                                className="flex items-center gap-1.5 bg-gray-950 text-white px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
                              >
                                <Plus size={14} />
                                <span>Add Entry</span>
                              </button>
                            </div>
                          </div>

                          {/* Sub-table Search filter */}
                          <div className="mt-4 flex items-center gap-2 max-w-md">
                            <div className="relative flex-1">
                              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                              <input
                                type="text"
                                placeholder={`Search records in ${activeSubFormConfig.name}...`}
                                value={hubSearchQuery}
                                onChange={(e) => setHubSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-4 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700 font-medium"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Subsection Records Data Table */}
                        <div className="flex-1 overflow-auto p-5">
                          {hubSubFormLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                              <div className="w-8 h-8 rounded-full border-2 border-indigo-100 border-t-indigo-600 animate-spin" />
                              <span className="text-xs text-gray-400 mt-2 font-medium">Loading clinical records...</span>
                            </div>
                          ) : filteredSubRecords.length === 0 ? (
                            <div className="border border-dashed border-gray-200 rounded-2xl p-16 text-center max-w-md mx-auto mt-6">
                              <div className="mx-auto w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-gray-100 mb-3 text-gray-400">
                                <Database size={16} />
                              </div>
                              <h4 className="font-bold text-xs text-gray-700">No Subsection Records Found</h4>
                              <p className="text-[10px] text-gray-400 mt-1 max-w-xs mx-auto leading-normal">
                                No records of this clinical subsection exist in this patient folder. Click "Add Entry" to create one.
                              </p>
                            </div>
                          ) : (
                            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-3xs bg-white min-w-[600px]">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-100">
                                    {/* Render first 4 fields */}
                                    {activeSubFormConfig.fields.slice(0, 4).map((f) => (
                                      <th key={f.key} className="px-4 py-2.5 font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                                        {f.label}
                                      </th>
                                    ))}
                                    <th className="px-4 py-2.5 font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                                      Record Date
                                    </th>
                                    <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider text-[10px] w-20">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {filteredSubRecords.map((rec: any) => (
                                    <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                                      {activeSubFormConfig.fields.slice(0, 4).map((f) => {
                                        const rawVal = rec[f.key];
                                        return (
                                          <td key={f.key} className="px-4 py-3 text-xs text-gray-700 font-medium">
                                            {f.key === 'items' || f.key === 'services' || f.key === 'result_entries' ? (
                                              <div className="flex flex-col gap-1 max-w-[200px]">
                                                {(Array.isArray(rawVal) ? rawVal : []).map((item: any, idx: number) => (
                                                  <span key={idx} className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded leading-tight font-bold">
                                                    {f.key === 'items' ? `${item.drug} - ${item.dose}` : f.key === 'services' ? item.service_type : item.parameter}
                                                  </span>
                                                ))}
                                              </div>
                                            ) : f.type === 'array' ? (
                                              <div className="flex flex-wrap gap-1">
                                                {(Array.isArray(rawVal) ? rawVal : []).map((x, idx) => (
                                                  <span key={idx} className="bg-slate-100 text-slate-700 border border-slate-200 text-[9px] px-1.5 py-0.5 rounded">
                                                    {String(x)}
                                                  </span>
                                                ))}
                                              </div>
                                            ) : f.type === 'checkbox' ? (
                                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${rawVal ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-gray-50 text-gray-400'}`}>
                                                {rawVal ? 'Yes' : 'No'}
                                              </span>
                                            ) : (
                                              <span className="truncate max-w-[120px] inline-block" title={String(rawVal || '')}>
                                                {rawVal !== undefined && rawVal !== null ? String(rawVal) : '—'}
                                              </span>
                                            )}
                                          </td>
                                        );
                                      })}
                                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                                        {rec.created_at || rec.date ? new Date(rec.created_at || rec.date).toLocaleDateString() : 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 text-right whitespace-nowrap">
                                        <div className="inline-flex items-center gap-1.5">
                                          <button
                                            onClick={() => {
                                              setHubFormData(rec);
                                              setHubEditingRecordId(rec.id);
                                              setHubFormError('');
                                              setIsHubAddFormOpen(true);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-800 p-1 border border-indigo-100 hover:bg-indigo-50 rounded cursor-pointer"
                                            title="Edit Subsection Record"
                                          >
                                            <Edit size={11} />
                                          </button>
                                          <button
                                            onClick={() => handleHubDeleteRecord(rec.id)}
                                            className="text-rose-600 hover:text-rose-800 p-1 border border-rose-100 hover:bg-rose-50 rounded cursor-pointer"
                                            title="Delete Subsection Record"
                                          >
                                            <Trash2 size={11} />
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
                      </div>
                    </div>
                    )}

                    {/* Lab Results Dashboard Tab */}
                    {folderActiveTab === 'labs' && (
                      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-50/50 text-left">
                        {/* Left Panel: Log New Measurement & Parameters Info */}
                        <div className="w-full lg:w-96 border-r border-gray-100 bg-white p-5 flex flex-col shrink-0 overflow-y-auto text-left">
                          <div className="mb-6">
                            <h4 className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider mb-1">
                              Log Structured Measurement
                            </h4>
                            <p className="text-[11px] text-gray-400 font-medium">
                              Record lab metric parameters directly to compile the patient's chronological laboratory record.
                            </p>
                          </div>

                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!newLabValue) {
                              alert("Please enter a numeric value.");
                              return;
                            }
                            const val = Number(newLabValue);
                            if (isNaN(val)) {
                              alert("Please enter a valid numeric value.");
                              return;
                            }
                            try {
                              const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
                              const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
                              const hspId = activeHospital?.hospital_unique_number || 'HSP-DEMO';

                              await addDoc(collection(db, 'patient_lab_metrics'), {
                                patient_mrn: hubSelectedMrn,
                                metric: newLabMetric,
                                value: val,
                                unit: newLabUnit,
                                reference_range: newLabRef,
                                date: newLabDate,
                                hospital_id: hspId
                              });
                              setNewLabValue('');
                              alert(`${newLabMetric} measurement added successfully!`);
                            } catch (err) {
                              console.error("Error saving lab metric:", err);
                              alert("Error saving lab metric: " + err);
                            }
                          }} className="space-y-4 text-left">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                Lab Parameter / Test Type
                              </label>
                              <select
                                value={newLabMetric}
                                onChange={(e) => setNewLabMetric(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-bold text-gray-700 cursor-pointer text-left"
                              >
                                <option value="Glucose">Blood Glucose (Fasting)</option>
                                <option value="Hemoglobin">Hemoglobin (Hb)</option>
                                <option value="WBC">White Blood Cells (WBC)</option>
                                <option value="Platelets">Platelets Count</option>
                                <option value="Creatinine">Serum Creatinine</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-left">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                  Observed Value
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={newLabValue}
                                  onChange={(e) => setNewLabValue(e.target.value)}
                                  placeholder="e.g. 95"
                                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-700 font-bold text-left"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                  Standard Unit
                                </label>
                                <input
                                  type="text"
                                  disabled
                                  value={newLabUnit}
                                  className="w-full px-3 py-2 text-xs border border-gray-100 bg-slate-50 text-gray-400 font-bold rounded-lg focus:outline-none text-left"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-left">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                  Ref Range
                                </label>
                                <input
                                  type="text"
                                  disabled
                                  value={newLabRef}
                                  className="w-full px-3 py-2 text-xs border border-gray-100 bg-slate-50 text-gray-400 font-bold rounded-lg focus:outline-none text-left"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                  Test Date
                                </label>
                                <input
                                  type="date"
                                  required
                                  value={newLabDate}
                                  onChange={(e) => setNewLabDate(e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none text-gray-700 font-bold text-left"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <Plus size={13} />
                              <span>Save Measurement</span>
                            </button>
                          </form>

                          <div className="mt-8 pt-6 border-t border-gray-100 text-left">
                            <h5 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2.5">
                              Physiological Threshold Guideline
                            </h5>
                            <div className="space-y-2 text-[11px] text-gray-500">
                              <div className="flex justify-between border-b border-dashed border-gray-50 pb-1">
                                <span className="font-semibold text-gray-700">Fasting Glucose:</span>
                                <span className="font-mono text-gray-500">70 - 100 mg/dL</span>
                              </div>
                              <div className="flex justify-between border-b border-dashed border-gray-50 pb-1">
                                <span className="font-semibold text-gray-700">Hemoglobin (Hb):</span>
                                <span className="font-mono text-gray-500">12 - 16 g/dL</span>
                              </div>
                              <div className="flex justify-between border-b border-dashed border-gray-50 pb-1">
                                <span className="font-semibold text-gray-700">White Blood Cells (WBC):</span>
                                <span className="font-mono text-gray-500">4.5 - 11.0 k/µL</span>
                              </div>
                              <div className="flex justify-between border-b border-dashed border-gray-50 pb-1">
                                <span className="font-semibold text-gray-700">Platelets Count:</span>
                                <span className="font-mono text-gray-500">150 - 450 k/µL</span>
                              </div>
                              <div className="flex justify-between border-b border-dashed border-gray-50 pb-1">
                                <span className="font-semibold text-gray-700">Serum Creatinine:</span>
                                <span className="font-mono text-gray-500">0.6 - 1.2 mg/dL</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Panel: Chart Trends & Tabular History */}
                        <div className="flex-1 flex flex-col overflow-y-auto p-5 space-y-6 text-left">
                          {/* Trend Chart Box */}
                          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-3xs text-left">
                            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                              <div>
                                <h4 className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                                  <TrendingUp size={14} className="text-indigo-600" />
                                  <span>Historical {newLabMetric} Trend Chart</span>
                                </h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  Visual chronological monitoring of {newLabMetric} biomarkers.
                                </p>
                              </div>
                              
                              <div className="flex gap-1 flex-wrap">
                                {['Glucose', 'Hemoglobin', 'WBC', 'Platelets', 'Creatinine'].map(m => (
                                  <button
                                    key={m}
                                    onClick={() => setNewLabMetric(m)}
                                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                      newLabMetric === m
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-3xs'
                                        : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900'
                                    }`}
                                  >
                                    {m}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Alert Banner for Baseline data */}
                            {labMetricsList.filter((m: any) => m.metric === newLabMetric).length === 0 && (
                              <div className="mb-4 bg-amber-50 border border-amber-100/70 rounded-xl p-3 flex items-start gap-2.5 text-amber-800">
                                <Info size={14} className="shrink-0 mt-0.5" />
                                <div className="text-[10px] leading-relaxed font-semibold">
                                  No direct clinical entries logged for <span className="font-extrabold">{newLabMetric}</span>. Displaying physiological reference trend baseline. Log measurements in the left panel to map real-time patient trends.
                                </div>
                              </div>
                            )}

                            <div className="h-64 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={
                                    labMetricsList.filter((m: any) => m.metric === newLabMetric).length > 0
                                      ? labMetricsList.filter((m: any) => m.metric === newLabMetric)
                                      : [
                                          { date: '2026-07-10', value: newLabMetric === 'Glucose' ? 88 : newLabMetric === 'Hemoglobin' ? 13.5 : newLabMetric === 'WBC' ? 6.1 : newLabMetric === 'Platelets' ? 210 : 0.8 },
                                          { date: '2026-07-12', value: newLabMetric === 'Glucose' ? 95 : newLabMetric === 'Hemoglobin' ? 14.1 : newLabMetric === 'WBC' ? 7.4 : newLabMetric === 'Platelets' ? 245 : 0.9 },
                                          { date: '2026-07-14', value: newLabMetric === 'Glucose' ? 108 : newLabMetric === 'Hemoglobin' ? 12.8 : newLabMetric === 'WBC' ? 11.2 : newLabMetric === 'Platelets' ? 215 : 1.3 },
                                          { date: '2026-07-16', value: newLabMetric === 'Glucose' ? 92 : newLabMetric === 'Hemoglobin' ? 13.9 : newLabMetric === 'WBC' ? 7.8 : newLabMetric === 'Platelets' ? 238 : 0.9 },
                                        ]
                                  }
                                  margin={{ top: 10, right: 30, left: -20, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                  <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                  <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                  <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                                  <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2.5} activeDot={{ r: 6 }} name={`${newLabMetric} (${newLabUnit})`} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Chronological Laboratory Audit Log */}
                          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-3xs text-left">
                            <h4 className="text-xs font-extrabold text-gray-900 mb-4 flex items-center gap-1.5">
                              <DatabaseZap size={14} className="text-indigo-600" />
                              <span>Structured Lab Metric Entries Registry</span>
                            </h4>

                            {labMetricsList.length === 0 ? (
                              <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-left">
                                <Info size={16} className="mx-auto mb-2 text-gray-300" />
                                <p className="text-xs font-medium">No custom lab metrics added for this folder yet.</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Use the left builder panel to log new parameters.</p>
                              </div>
                            ) : (
                              <div className="overflow-hidden border border-gray-100 rounded-xl text-left">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                                      <th className="px-4 py-2.5">Date</th>
                                      <th className="px-4 py-2.5">Metric Type</th>
                                      <th className="px-4 py-2.5">Observed Value</th>
                                      <th className="px-4 py-2.5">Reference Range</th>
                                      <th className="px-4 py-2.5">Biological Flag</th>
                                      <th className="px-4 py-2.5 text-right w-16">Clear</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 font-medium text-left">
                                    {labMetricsList.map((m: any) => {
                                      // Calculate normal / high / low flag
                                      let flag = 'Normal';
                                      let flagColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                                      const val = m.value;
                                      if (m.metric === 'Glucose') {
                                        if (val > 100) { flag = 'High'; flagColor = 'bg-rose-50 text-rose-700 border-rose-100'; }
                                        else if (val < 70) { flag = 'Low'; flagColor = 'bg-sky-50 text-sky-700 border-sky-100'; }
                                      } else if (m.metric === 'Hemoglobin') {
                                        if (val > 16) { flag = 'High'; flagColor = 'bg-rose-50 text-rose-700 border-rose-100'; }
                                        else if (val < 12) { flag = 'Low'; flagColor = 'bg-sky-50 text-sky-700 border-sky-100'; }
                                      } else if (m.metric === 'WBC') {
                                        if (val > 11) { flag = 'High'; flagColor = 'bg-rose-50 text-rose-700 border-rose-100'; }
                                        else if (val < 4.5) { flag = 'Low'; flagColor = 'bg-sky-50 text-sky-700 border-sky-100'; }
                                      } else if (m.metric === 'Platelets') {
                                        if (val > 450) { flag = 'High'; flagColor = 'bg-rose-50 text-rose-700 border-rose-100'; }
                                        else if (val < 150) { flag = 'Low'; flagColor = 'bg-sky-50 text-sky-700 border-sky-100'; }
                                      } else if (m.metric === 'Creatinine') {
                                        if (val > 1.2) { flag = 'High'; flagColor = 'bg-rose-50 text-rose-700 border-rose-100'; }
                                        else if (val < 0.6) { flag = 'Low'; flagColor = 'bg-sky-50 text-sky-700 border-sky-100'; }
                                      }

                                      return (
                                        <tr key={m.id} className="hover:bg-slate-50/40 text-gray-700">
                                          <td className="px-4 py-3 font-mono text-[10px] text-gray-500">{m.date}</td>
                                          <td className="px-4 py-3 font-bold">{m.metric}</td>
                                          <td className="px-4 py-3 font-extrabold text-indigo-700">{m.value} <span className="text-[10px] font-bold text-gray-400">{m.unit}</span></td>
                                          <td className="px-4 py-3 font-mono text-[11px] text-gray-400">{m.reference_range} {m.unit}</td>
                                          <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black ${flagColor}`}>
                                              {flag}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 text-right">
                                            <button
                                              onClick={async () => {
                                                if (confirm("Delete this lab metric entry?")) {
                                                  try {
                                                    await deleteDoc(doc(db, 'patient_lab_metrics', m.id));
                                                  } catch (err) {
                                                    console.error("Error deleting lab metric:", err);
                                                  }
                                                }
                                              }}
                                              className="p-1 border border-rose-100 hover:bg-rose-50 text-rose-600 rounded cursor-pointer transition-all"
                                            >
                                              <Trash2 size={11} />
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Vital Signs Monitor Tab */}
                    {folderActiveTab === 'vitals' && (
                      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-50/50 text-left">
                        {/* Left Panel: Record Vitals Form & Physiological Thresholds */}
                        <div className="w-full lg:w-96 border-r border-gray-100 bg-white p-5 flex flex-col shrink-0 overflow-y-auto text-left">
                          <div className="mb-6">
                            <h4 className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider mb-1">
                              Record Real-time Vitals
                            </h4>
                            <p className="text-[11px] text-gray-400 font-medium">
                              Log live vital metrics. This writes directly to the Subsection 1.1.1.b Triage ledger.
                            </p>
                          </div>

                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!newVitalPulse || !newVitalTemp || !newVitalBP || !newVitalRR) {
                              alert("Please enter all required vital parameters.");
                              return;
                            }
                            try {
                              const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
                              const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
                              const hspId = activeHospital?.hospital_unique_number || 'HSP-DEMO';

                              const pulse = Number(newVitalPulse);
                              const temp = Number(newVitalTemp);
                              const rr = Number(newVitalRR);

                              await addDoc(collection(db, 'form_1_1_1_b'), {
                                patient_mrn: hubSelectedMrn,
                                mrn: hubSelectedMrn,
                                vital_bp: newVitalBP,
                                vital_pulse: pulse,
                                vital_temp: temp,
                                vital_rr: rr,
                                triage_priority: pulse > 100 || temp > 38 || temp < 35 ? 'Yellow (Urgent)' : 'Green (Routine)',
                                summary: 'Direct Vitals recorded from Folder Vital Signs Monitor.',
                                hospital_id: hspId,
                                date: new Date(newVitalDate).toISOString()
                              });

                              setNewVitalPulse('');
                              setNewVitalTemp('');
                              setNewVitalBP('');
                              setNewVitalRR('');
                              alert("Vital signs logged successfully in EHR Triage subsection!");
                            } catch (err) {
                              console.error("Error logging vitals:", err);
                              alert("Error logging vitals: " + err);
                            }
                          }} className="space-y-4 text-left">
                            <div className="grid grid-cols-2 gap-3 text-left">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                  Pulse Rate (bpm)
                                </label>
                                <input
                                  type="number"
                                  required
                                  value={newVitalPulse}
                                  onChange={(e) => setNewVitalPulse(e.target.value)}
                                  placeholder="e.g. 72"
                                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-gray-700 text-left"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                  Temperature (°C)
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={newVitalTemp}
                                  onChange={(e) => setNewVitalTemp(e.target.value)}
                                  placeholder="e.g. 36.8"
                                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-gray-700 text-left"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-left">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                  Blood Pressure
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={newVitalBP}
                                  onChange={(e) => setNewVitalBP(e.target.value)}
                                  placeholder="e.g. 120/80"
                                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-gray-700 text-left"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                  Resp Rate (bpm)
                                </label>
                                <input
                                  type="number"
                                  required
                                  value={newVitalRR}
                                  onChange={(e) => setNewVitalRR(e.target.value)}
                                  placeholder="e.g. 16"
                                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-gray-700 text-left"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                Observation Date
                              </label>
                              <input
                                  type="date"
                                  required
                                  value={newVitalDate}
                                  onChange={(e) => setNewVitalDate(e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none text-gray-700 font-bold text-left"
                                />
                            </div>

                            <button
                              type="submit"
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <Plus size={13} />
                              <span>Record Vitals</span>
                            </button>
                          </form>

                          <div className="mt-8 pt-6 border-t border-gray-100 text-left">
                            <h5 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2.5">
                              Physiological Alert Thresholds
                            </h5>
                            <div className="space-y-3 text-[11px] text-gray-500">
                              <div className="border-l-2 border-indigo-500 pl-2.5">
                                <span className="font-bold text-gray-800 block">Pulse Rate</span>
                                <span>Bradycardia: &lt; 60 bpm | Tachycardia: &gt; 100 bpm</span>
                              </div>
                              <div className="border-l-2 border-amber-500 pl-2.5">
                                <span className="font-bold text-gray-800 block">Temperature</span>
                                <span>Hypothermia: &lt; 35.0 °C | Fever/Pyrexia: &gt; 38.0 °C</span>
                              </div>
                              <div className="border-l-2 border-rose-500 pl-2.5">
                                <span className="font-bold text-gray-800 block">Respiratory Rate</span>
                                <span>Bradypnea: &lt; 12 bpm | Tachypnea: &gt; 20 bpm</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Panel: Vitals Widgets & Trend Plots */}
                        <div className="flex-1 flex flex-col overflow-y-auto p-5 space-y-6 text-left">
                          {/* Vital Signs Live Monitors */}
                          <div className="text-left">
                            <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">
                              Real-time Physiological Live Status
                            </h4>
                            
                            {(() => {
                              const latest = vitalsHistory.length > 0 
                                ? vitalsHistory[vitalsHistory.length - 1] 
                                : { vital_pulse: 72, vital_temp: 36.8, vital_rr: 16, vital_bp: '120/80', summary: 'EHR baseline reference values.' };

                              const p = Number(latest.vital_pulse);
                              const t = Number(latest.vital_temp);
                              const r = Number(latest.vital_rr);
                              const bpStr = String(latest.vital_bp || '');

                              // Assess alerts
                              const activeAlerts: string[] = [];
                              if (p > 100) activeAlerts.push(`Tachycardia Detected (Pulse: ${p} bpm is > 100 bpm)`);
                              if (p < 60) activeAlerts.push(`Bradycardia Detected (Pulse: ${p} bpm is < 60 bpm)`);
                              if (t > 38.0) activeAlerts.push(`Fever Detected (Temp: ${t} °C is > 38.0 °C)`);
                              if (t < 35.0) activeAlerts.push(`Hypothermia Detected (Temp: ${t} °C is < 35.0 °C)`);
                              if (r > 20) activeAlerts.push(`Tachypnea Detected (Respiratory: ${r} bpm is > 20 bpm)`);
                              if (r < 12) activeAlerts.push(`Bradypnea Detected (Respiratory: ${r} bpm is < 12 bpm)`);

                              const bpSps = bpStr.split('/');
                              if (bpSps.length === 2) {
                                const sys = Number(bpSps[0]);
                                const dia = Number(bpSps[1]);
                                if (sys > 140 || dia > 90) activeAlerts.push(`Stage 2 Hypertension Detected (Blood Pressure: ${bpStr})`);
                              }

                              return (
                                <div className="space-y-4 text-left">
                                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                                    {/* Pulse Card */}
                                    <div className={`border p-4 rounded-2xl bg-white shadow-3xs flex items-center gap-3.5 ${p > 100 || p < 60 ? 'border-rose-200 bg-rose-50/20' : 'border-gray-100'}`}>
                                      <div className={`p-2.5 rounded-xl ${p > 100 || p < 60 ? 'bg-rose-500 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <HeartPulse size={18} className={p > 100 ? 'animate-pulse' : ''} />
                                      </div>
                                      <div>
                                        <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Heart Rate</span>
                                        <span className="text-sm font-extrabold text-gray-800">{p || '—'} <span className="text-[10px] text-gray-400">bpm</span></span>
                                      </div>
                                    </div>

                                    {/* Temp Card */}
                                    <div className={`border p-4 rounded-2xl bg-white shadow-3xs flex items-center gap-3.5 ${t > 38 || t < 35 ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100'}`}>
                                      <div className={`p-2.5 rounded-xl ${t > 38 || t < 35 ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600'}`}>
                                        <Thermometer size={18} />
                                      </div>
                                      <div>
                                        <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Temperature</span>
                                        <span className="text-sm font-extrabold text-gray-800">{t || '—'} <span className="text-[10px] text-gray-400">°C</span></span>
                                      </div>
                                    </div>

                                    {/* BP Card */}
                                    <div className="border border-gray-100 p-4 rounded-2xl bg-white shadow-3xs flex items-center gap-3.5">
                                      <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
                                        <Activity size={18} />
                                      </div>
                                      <div>
                                        <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Blood Pressure</span>
                                        <span className="text-sm font-extrabold text-gray-800">{bpStr || '—'} <span className="text-[10px] text-gray-400">mmHg</span></span>
                                      </div>
                                    </div>

                                    {/* Resp Rate Card */}
                                    <div className={`border p-4 rounded-2xl bg-white shadow-3xs flex items-center gap-3.5 ${r > 20 || r < 12 ? 'border-rose-200 bg-rose-50/20' : 'border-gray-100'}`}>
                                      <div className={`p-2.5 rounded-xl ${r > 20 || r < 12 ? 'bg-rose-500 text-white' : 'bg-slate-50 text-gray-600'}`}>
                                        <TrendingUp size={18} />
                                      </div>
                                      <div>
                                        <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Resp Rate</span>
                                        <span className="text-sm font-extrabold text-gray-800">{r || '—'} <span className="text-[10px] text-gray-400">bpm</span></span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Warnings list */}
                                  <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-3xs text-left">
                                    <h5 className="text-[11px] font-extrabold text-gray-900 mb-2.5 flex items-center gap-1.5">
                                      <ShieldAlert size={14} className="text-indigo-600" />
                                      <span>Active Threshold Alerts & Diagnostics</span>
                                    </h5>
                                    
                                    {activeAlerts.length > 0 ? (
                                      <div className="space-y-2 text-left">
                                        {activeAlerts.map((alertText, idx) => (
                                          <div key={idx} className="bg-rose-50 border border-rose-100 text-rose-800 rounded-lg p-2.5 flex items-start gap-2 text-[11px] font-bold text-left">
                                            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-600" />
                                            <span>{alertText}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg p-2.5 flex items-start gap-2 text-[11px] font-semibold text-left">
                                        <Check size={14} className="shrink-0 mt-0.5 text-emerald-600" />
                                        <span>All measured vital signs are currently within normal physiological ranges. Patient condition is stable.</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Vitals Trends Chart Plot */}
                          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-3xs text-left">
                            <h4 className="text-xs font-extrabold text-gray-900 mb-3.5 flex items-center gap-1.5">
                              <TrendingUp size={14} className="text-indigo-600" />
                              <span>Physiological Vitals Historical Trends</span>
                            </h4>

                            {vitalsHistory.length === 0 && (
                              <div className="mb-4 bg-amber-50 border border-amber-100/70 rounded-xl p-3 flex items-start gap-2.5 text-amber-800">
                                <Info size={14} className="shrink-0 mt-0.5" />
                                <div className="text-[10px] leading-relaxed font-semibold">
                                  No custom vital entries logged yet. Displaying historical baseline. Log vitals in the left panel to display real patient tracks.
                                </div>
                              </div>
                            )}

                            <div className="h-64 w-full text-left">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={
                                    vitalsHistory.length > 0
                                      ? vitalsHistory
                                      : [
                                          { date: '08:00 AM', vital_pulse: 70, vital_temp: 36.5, vital_rr: 16 },
                                          { date: '12:00 PM', vital_pulse: 82, vital_temp: 36.9, vital_rr: 18 },
                                          { date: '04:00 PM', vital_pulse: 98, vital_temp: 37.8, vital_rr: 19 },
                                          { date: '08:00 PM', vital_pulse: 75, vital_temp: 36.6, vital_rr: 15 },
                                        ]
                                  }
                                  margin={{ top: 10, right: 30, left: -20, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                  <XAxis dataKey="date" tickFormatter={(v) => v ? new Date(v).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                  <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                  <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                                  <Line type="monotone" dataKey="vital_pulse" stroke="#ef4444" strokeWidth={2} name="Pulse (bpm)" />
                                  <Line type="monotone" dataKey="vital_temp" stroke="#f59e0b" strokeWidth={2} name="Temp (°C)" />
                                  <Line type="monotone" dataKey="vital_rr" stroke="#10b981" strokeWidth={2} name="Resp Rate (bpm)" />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Referral & Export (PDF) Tab */}
                    {folderActiveTab === 'export' && (
                      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100/50 text-left">
                        {/* Left Panel: Letter Configuration */}
                        <div className="w-full lg:w-96 border-r border-gray-100 bg-white p-5 flex flex-col shrink-0 overflow-y-auto text-left">
                          <div className="mb-6">
                            <h4 className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider mb-1">
                              Customize Referral Details
                            </h4>
                            <p className="text-[11px] text-gray-400 font-medium">
                              Provide specific directives to customize the formatted export document in real-time.
                            </p>
                          </div>

                          <div className="space-y-4 text-left">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                Referral Destination Institution
                              </label>
                              <input
                                type="text"
                                value={refInstitution}
                                onChange={(e) => setRefInstitution(e.target.value)}
                                placeholder="e.g. General Hospital"
                                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-gray-700 text-left"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                Clinical Reason for Referral
                              </label>
                              <textarea
                                rows={3}
                                value={refReason}
                                onChange={(e) => setRefReason(e.target.value)}
                                placeholder="e.g. Requires sub-specialist diagnostics and therapeutic management."
                                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-gray-700 text-left"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                Attending Clinician (Signature Name)
                              </label>
                              <input
                                type="text"
                                value={refDoctor}
                                onChange={(e) => setRefDoctor(e.target.value)}
                                placeholder="e.g. Dr. Jane Doe, MD"
                                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-gray-700 text-left"
                              />
                            </div>

                            <button
                              onClick={() => {
                                // Call isolated window printer
                                const printContent = document.getElementById('printable-patient-record')?.innerHTML;
                                if (!printContent) return;
                                
                                const printWindow = window.open('', '_blank');
                                if (printWindow) {
                                  printWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>Medical Referral & Record - MRN ${hubSelectedMrn}</title>
                                        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                                        <style>
                                          @media print {
                                            body { padding: 30px; font-family: sans-serif; -webkit-print-color-adjust: exact; }
                                            .no-print { display: none; }
                                            .page-break { page-break-before: always; }
                                          }
                                        </style>
                                      </head>
                                      <body class="p-8 bg-white text-gray-800">
                                        ${printContent}
                                        <script>
                                          window.onload = function() {
                                            window.print();
                                            setTimeout(function() { window.close(); }, 500);
                                          };
                                        </script>
                                      </body>
                                    </html>
                                  `);
                                  printWindow.document.close();
                                }
                              }}
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5 mt-4"
                            >
                              <Printer size={14} />
                              <span>Print & Export PDF Summary</span>
                            </button>
                          </div>
                        </div>

                        {/* Right Panel: Pre-formatted Referral Preview Container */}
                        <div className="flex-1 overflow-y-auto p-6 flex justify-center text-left">
                          {/* Standard 8.5x11 Paper Preview */}
                          <div className="w-full max-w-2xl bg-white border border-gray-200 shadow-md p-8 text-left text-gray-800" id="printable-patient-record text-left">
                            {/* Clinical Header */}
                            <div className="border-b-4 border-indigo-700 pb-5 mb-6 flex justify-between items-start text-left">
                              <div className="text-left">
                                <h1 className="text-xl font-black text-gray-900 tracking-tight text-left">HEALTHFLOW EHR CLINICAL HUBS</h1>
                                <p className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest mt-0.5 text-left">Official Referral & Consolidated Patient Folder Transcript</p>
                                <p className="text-[9px] text-gray-400 font-mono mt-1 text-left">GENERATED SECURELY VIA HEALTHFLOW EHR PLATFORM</p>
                              </div>
                              <div className="text-right text-[10px] font-mono text-gray-400 leading-normal">
                                <div>Date: {new Date().toLocaleDateString()}</div>
                                <div>MRN: <span className="font-bold text-gray-800">{hubSelectedMrn}</span></div>
                              </div>
                            </div>

                            {/* Patient Demographics block */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 text-left">
                              <h3 className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider mb-2 text-left">I. Patient Identification</h3>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-left">
                                <div>
                                  <span className="text-[10px] text-gray-400 block font-bold">FULL NAME</span>
                                  <span className="font-extrabold text-gray-800">{activePatientName}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-400 block font-bold">PATIENT MRN</span>
                                  <span className="font-mono font-bold text-gray-800">{hubSelectedMrn}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-400 block font-bold">STATUS</span>
                                  <span className="font-bold text-gray-800">{currentFolder?.hub_status || 'Active Folder'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-400 block font-bold">DOCUMENT TYPE</span>
                                  <span className="font-extrabold text-emerald-600">Referral Summary</span>
                                </div>
                              </div>
                            </div>

                            {/* Referral Directives */}
                            <div className="mb-6 text-left">
                              <h3 className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider mb-2.5 text-left">II. Transfer & Referral Directives</h3>
                              <div className="border border-indigo-100 rounded-xl p-4 space-y-2 text-xs text-left">
                                <div>
                                  <span className="font-extrabold text-gray-400 block text-[10px]">REFERRED TO INSTITUTION:</span>
                                  <span className="font-extrabold text-gray-800">{refInstitution}</span>
                                </div>
                                <div>
                                  <span className="font-extrabold text-gray-400 block text-[10px]">REASON FOR REFERRAL:</span>
                                  <span className="font-medium text-gray-700 block mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">{refReason}</span>
                                </div>
                              </div>
                            </div>

                            {/* Clinical Intake Notes */}
                            <div className="mb-6 text-left">
                              <h3 className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider mb-2.5 text-left">III. Master Clinical Intake Notes & Summaries</h3>
                              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 text-left">
                                <p className="text-xs text-gray-700 leading-relaxed italic whitespace-pre-line font-medium text-left">
                                  {folderNotes ? folderNotes : "No overall clinical summary notes logged for this folder session yet."}
                                </p>
                              </div>
                            </div>

                            {/* Latest Vitals */}
                            <div className="mb-6 text-left">
                              <h3 className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider mb-2.5 text-left">IV. Most Recent Vital Signs Track</h3>
                              {vitalsHistory.length === 0 ? (
                                <p className="text-[11px] text-gray-400 italic font-medium">No vital signs captured inside the EHR yet. Reference values are stable.</p>
                              ) : (
                                <div className="overflow-hidden border border-gray-100 rounded-xl text-xs text-left">
                                  <table className="w-full text-left">
                                    <thead>
                                      <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase">
                                        <th className="px-4 py-2">Record Date</th>
                                        <th className="px-4 py-2">Pulse Rate</th>
                                        <th className="px-4 py-2">Temperature</th>
                                        <th className="px-4 py-2">Blood Pressure</th>
                                        <th className="px-4 py-2">Resp Rate</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {vitalsHistory.slice(-3).map((v: any, idx) => (
                                        <tr key={idx} className="border-b border-gray-50 font-medium text-gray-700">
                                          <td className="px-4 py-2 font-mono text-[10px]">{v.date ? new Date(v.date).toLocaleDateString() : 'N/A'}</td>
                                          <td className="px-4 py-2">{v.vital_pulse} bpm</td>
                                          <td className="px-4 py-2">{v.vital_temp} °C</td>
                                          <td className="px-4 py-2">{v.vital_bp} mmHg</td>
                                          <td className="px-4 py-2">{v.vital_rr} bpm</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>

                            {/* Structured Lab Metrics */}
                            <div className="mb-6 text-left">
                              <h3 className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider mb-2.5 text-left">V. Structured Laboratory Investigation Trends</h3>
                              {labMetricsList.length === 0 ? (
                                <p className="text-[11px] text-gray-400 italic font-medium">No custom structured lab parameters recorded in the active clinical record yet.</p>
                              ) : (
                                <div className="overflow-hidden border border-gray-100 rounded-xl text-xs text-left">
                                  <table className="w-full text-left font-medium">
                                    <thead>
                                      <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase">
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2">Biomarker Metric</th>
                                        <th className="px-4 py-2">Observed Value</th>
                                        <th className="px-4 py-2">Reference Band</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {labMetricsList.slice(-5).map((l: any, idx) => (
                                        <tr key={idx} className="border-b border-gray-50 text-gray-700">
                                          <td className="px-4 py-2 font-mono text-[10px]">{l.date}</td>
                                          <td className="px-4 py-2 font-bold">{l.metric}</td>
                                          <td className="px-4 py-2 font-extrabold text-indigo-600">{l.value} {l.unit}</td>
                                          <td className="px-4 py-2 font-mono text-[11px] text-gray-400">{l.reference_range} {l.unit}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>

                            {/* Registered Clinical Subsection Folder Contents */}
                            <div className="mb-8 page-break text-left">
                              <h3 className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider mb-2.5 text-left">VI. EHR Clinical Folder Subsections Logs</h3>
                              {hubSubFormRecords.length === 0 ? (
                                <p className="text-[11px] text-gray-400 italic font-medium">No primary sub-forms filled for this specific folder workspace session.</p>
                              ) : (
                                <div className="space-y-3.5 text-xs text-gray-700 font-medium text-left">
                                  {hubSubFormRecords.slice(0, 10).map((r: any, idx) => (
                                    <div key={idx} className="border-l-4 border-indigo-600 pl-3 py-1 bg-slate-50/50 p-2.5 rounded-r-lg text-left">
                                      <div className="flex justify-between font-extrabold text-[11px] text-gray-900 text-left">
                                        <span>Subsection Record Entry #{idx + 1}</span>
                                        <span className="font-mono text-gray-400 text-[10px]">{r.created_at || r.date ? new Date(r.created_at || r.date).toLocaleDateString() : ''}</span>
                                      </div>
                                      <div className="text-[11px] text-gray-500 mt-1 max-w-lg leading-relaxed text-left">
                                        {r.summary || r.lab_findings || r.diagnosis_notes || r.findings || r.notes || "Findings logged successfully inside patient file index."}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Official Signatures */}
                            <div className="border-t border-gray-200 pt-8 flex justify-between items-center text-xs mt-12 text-left">
                              <div className="text-left leading-normal text-gray-400">
                                <div>Authorized EHR Record Document</div>
                                <div>HealthFlow EHR Clinic Group</div>
                              </div>
                              <div className="text-right">
                                <div className="font-black text-gray-800">{refDoctor}</div>
                                <div className="text-gray-400 text-[10px] mt-0.5">Attending Clinician (Digital Stamp)</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Clinical Subform Popup Dialog Editor Modal */}
                    {isHubAddFormOpen && (
                      <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-fadeIn">
                        <div className="flex-1 flex flex-col overflow-hidden text-left">
                          <div className="p-5 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
                            <div>
                              <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                                <Database size={15} className="text-indigo-600" />
                                <span>
                                  {hubEditingRecordId ? 'Adjust' : 'Record'} Subsection {hubActiveFormId.replace('Form_', '').replace(/_/g, '.')} Entry
                                </span>
                              </h3>
                              <p className="text-[10px] text-gray-400 font-medium">
                                Secure patient records filing environment for {activePatientName} (MRN: {hubSelectedMrn})
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {['Form_1_1_1', 'Form_1_1_1_0', 'Form_1_1_1_1'].includes(hubActiveFormId) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Fill in N/A or defaults for missing required fields to allow "fast" save
                                    const updated = { ...hubFormData };
                                    activeSubFormConfig.fields.forEach(f => {
                                      if (f.required && (updated[f.key] === undefined || updated[f.key] === null || updated[f.key] === '')) {
                                        if (f.type === 'number') updated[f.key] = 0;
                                        else if (f.type === 'select' && f.options) updated[f.key] = f.options[0];
                                        else updated[f.key] = 'N/A';
                                      }
                                    });
                                    setHubFormData(updated);
                                    setTimeout(() => {
                                      const form = document.querySelector('form[data-hub-form="true"]') as HTMLFormElement;
                                      if (form) form.requestSubmit();
                                    }, 100);
                                  }}
                                  className="flex items-center gap-1.5 text-xs font-black px-3.5 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all shadow-3xs cursor-pointer"
                                  title="Auto-fill missing required fields and save"
                                >
                                  <Sparkles size={14} />
                                  <span>Fast Save & Next</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsHubAddFormOpen(false);
                                  setHubFormData({});
                                  setHubEditingRecordId(null);
                                  setHubFormError('');
                                }}
                                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 bg-white border border-gray-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-3xs"
                              >
                                <X size={14} />
                                <span>Cancel</span>
                              </button>
                              {(() => {
                                const reqFields = activeSubFormConfig.fields.filter(f => f.required);
                                const filledReq = reqFields.filter(f => {
                                  const val = hubFormData[f.key];
                                  return val !== undefined && val !== null && val !== '';
                                });
                                const canSubmit = reqFields.length === filledReq.length;
                                return (
                                  <button
                                    type="button"
                                    disabled={!canSubmit}
                                    onClick={() => {
                                      const form = document.querySelector('form[data-hub-form="true"]') as HTMLFormElement;
                                      if (form) form.requestSubmit();
                                    }}
                                    className={`flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer ${
                                      canSubmit ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-100'
                                    }`}
                                  >
                                    <Check size={14} />
                                    <span>Save Entry</span>
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                          <form data-hub-form="true" onSubmit={handleHubAddRecord} className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-5 bg-slate-50 border-b border-gray-100">
                              {(() => {
                                const reqFields = activeSubFormConfig.fields.filter(f => f.required);
                                const filledReq = reqFields.filter(f => {
                                  const val = hubFormData[f.key];
                                  return val !== undefined && val !== null && val !== '';
                                });
                                const pct = reqFields.length === 0 ? 100 : Math.round((filledReq.length / reqFields.length) * 100);
                                return (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                                      <span>Form Completion</span>
                                      <span className={pct === 100 ? 'text-emerald-600' : 'text-indigo-600'}>{pct}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                        style={{ width: `${pct}%` }} 
                                      />
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {hubFormError && (
                              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 text-rose-700 font-semibold text-xs leading-relaxed animate-shake">
                                <AlertCircle size={14} className="shrink-0 text-rose-500" />
                                <p>{hubFormError}</p>
                              </div>
                            )}

                            {activeSubFormConfig.fields.map((f) => {
                              const isReadOnlyField = ['patient_mrn', 'mrn', 'patient_id', 'patient_name', 'full_name'].includes(f.key);
                              const val = hubFormData[f.key] !== undefined && hubFormData[f.key] !== null ? hubFormData[f.key] : '';

                              return (
                                <div key={f.key} className="space-y-1">
                                  <label className="block text-[11px] font-bold text-gray-700 flex items-center gap-0.5">
                                    <span>{f.label}</span>
                                    {f.required && <span className="text-rose-500">*</span>}
                                  </label>

                                  {isReadOnlyField ? (
                                    <input
                                      type="text"
                                      disabled
                                      value={isReadOnlyField && ['patient_mrn', 'mrn', 'patient_id'].includes(f.key) ? hubSelectedMrn : activePatientName}
                                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-gray-200 text-gray-500 font-bold rounded-lg cursor-not-allowed border-dashed"
                                    />
                                  ) : f.type === 'select' ? (
                                    <select
                                      required={f.required}
                                      value={val}
                                      onChange={(e) => setHubFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                      <option value="">Select option...</option>
                                      {(f.options || []).map((o, idx) => (
                                        <option key={idx} value={o}>{o}</option>
                                      ))}
                                    </select>
                                  ) : f.type === 'textarea' ? (
                                    <textarea
                                      required={f.required}
                                      placeholder={f.placeholder || `Enter ${(f.label || '').toLowerCase()} details...`}
                                      rows={3}
                                      value={val}
                                      onChange={(e) => setHubFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                  ) : f.type === 'checkbox' ? (
                                    <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                                      <input
                                        type="checkbox"
                                        checked={!!val}
                                        onChange={(e) => setHubFormData(prev => ({ ...prev, [f.key]: e.target.checked }))}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                      />
                                      <span className="text-xs text-gray-600 font-medium">Toggle choice</span>
                                    </label>
                                  ) : (f.type === 'camera' || f.key === 'referral_image' || f.key === 'referral_paper') ? (
                                    <div className="space-y-2 bg-gray-50/50 border border-gray-150 p-2.5 rounded-lg">
                                      {/* Selector/Box for "if patient have" and "if no add no selected box" */}
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setHubFormData(prev => ({ ...prev, [f.key]: 'No' }));
                                          }}
                                          className={`flex-1 py-1.5 px-2.5 rounded-md border text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                            val === 'No' || !val
                                              ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-3xs'
                                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                          }`}
                                        >
                                          No Referral Paper
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (val === 'No' || !val) {
                                              setHubFormData(prev => ({ ...prev, [f.key]: '' }));
                                            }
                                          }}
                                          className={`flex-1 py-1.5 px-2.5 rounded-md border text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                            val && val !== 'No'
                                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-3xs'
                                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                          }`}
                                        >
                                          Yes, Capture / Upload
                                        </button>
                                      </div>

                                      {/* When Yes is selected */}
                                      {val !== 'No' && (
                                        <div className="space-y-2 pt-2 border-t border-gray-100">
                                          <div className="flex gap-1.5">
                                            {/* Camera button */}
                                            <label className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-950 rounded-lg transition-all text-[11px] font-bold cursor-pointer">
                                              <Camera size={12} className="text-indigo-500" />
                                              <span>Capture</span>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                className="hidden"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
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
                                                          setHubFormData(prev => ({ ...prev, [f.key]: dataUrl }));
                                                        } else {
                                                          setHubFormData(prev => ({ ...prev, [f.key]: reader.result as string }));
                                                        }
                                                      };
                                                    };
                                                    reader.readAsDataURL(file);
                                                  }
                                                }}
                                              />
                                            </label>

                                            {/* Upload button */}
                                            <label className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-950 rounded-lg transition-all text-[11px] font-bold cursor-pointer">
                                              <Upload size={12} className="text-purple-500" />
                                              <span>Upload</span>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
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
                                                          setHubFormData(prev => ({ ...prev, [f.key]: dataUrl }));
                                                        } else {
                                                          setHubFormData(prev => ({ ...prev, [f.key]: reader.result as string }));
                                                        }
                                                      };
                                                    };
                                                    reader.readAsDataURL(file);
                                                  }
                                                }}
                                              />
                                            </label>
                                          </div>

                                          {/* Preview */}
                                          {val && val !== 'No' ? (
                                            <div className="relative border border-dashed border-gray-200 rounded-lg p-2 bg-white flex flex-col items-center gap-1.5">
                                              <img
                                                src={val}
                                                alt="Referral Paper"
                                                className="max-h-32 object-contain rounded-md"
                                              />
                                              <div className="flex items-center justify-between w-full px-1">
                                                <span className="text-[9px] font-bold text-emerald-600">Attached</span>
                                                <button
                                                  type="button"
                                                  onClick={() => setHubFormData(prev => ({ ...prev, [f.key]: '' }))}
                                                  className="text-[9px] font-bold text-rose-500 hover:text-rose-700"
                                                >
                                                  Clear
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="border border-dashed border-gray-150 rounded-lg py-3 px-2 bg-white text-center">
                                              <p className="text-[10px] text-gray-400">No referral paper attached yet.</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <input
                                      required={f.required}
                                      type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'date-time' ? 'datetime-local' : 'text'}
                                      placeholder={f.placeholder || `Enter ${(f.label || '').toLowerCase()}...`}
                                      value={val}
                                      onChange={(e) => setHubFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                  )}
                                </div>
                              );
                            })}
                            </div>

                            <div className="pt-4 border-t border-gray-150 flex items-center justify-end gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsHubAddFormOpen(false);
                                  setHubFormData({});
                                  setHubEditingRecordId(null);
                                  setHubFormError('');
                                }}
                                className="px-3.5 py-2 text-xs border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-lg transition-colors cursor-pointer shadow-3xs bg-white"
                              >
                                Cancel
                              </button>
                              {(() => {
                                const reqFields = activeSubFormConfig.fields.filter(f => f.required);
                                const filledReq = reqFields.filter(f => {
                                  const val = hubFormData[f.key];
                                  return val !== undefined && val !== null && val !== '';
                                });
                                const canSubmit = reqFields.length === filledReq.length;
                                return (
                                  <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors shadow-xs ${canSubmit ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'}`}
                                  >
                                    {hubEditingRecordId ? 'Save Changes' : 'Record Entry'}
                                  </button>
                                );
                              })()}
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        ) : (
          <>
            {/* Table Description Block */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 text-gray-700 rounded">
                  {React.createElement(selectedEntity.icon, { size: 16 })}
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  {selectedEntity.name} <span className="text-xs font-normal text-gray-400 font-mono">({selectedEntity.collectionName})</span>
                </h2>
              </div>
              <p className="text-xs text-gray-600 max-w-xl leading-relaxed">{selectedEntity.description}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  const initialData: Record<string, any> = {};
                  const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
                  const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
                  const hospitalId = activeHospital?.hospital_unique_number || 'demo-global';

                  selectedEntity.fields.forEach(f => {
                    if (f.key === 'items') {
                      initialData[f.key] = [];
                    } else if (f.key === 'hospital_id') {
                      initialData[f.key] = hospitalId;
                    } else if (f.defaultValue) {
                      initialData[f.key] = f.defaultValue;
                    }
                  });

                  // Pre-populate with saved registration info from Form_1_1_1 if available
                  const savedHspId = localStorage.getItem('saved_hospital_id');
                  const savedMrn = localStorage.getItem('saved_patient_mrn');
                  const savedName = localStorage.getItem('saved_patient_name');
                  if (savedHspId) {
                    initialData.hospital_id = savedHspId;
                  }
                  if (savedMrn) {
                    if (selectedEntity.fields.some(f => f.key === 'patient_mrn')) {
                      initialData.patient_mrn = savedMrn;
                    }
                    if (selectedEntity.fields.some(f => f.key === 'mrn')) {
                      initialData.mrn = savedMrn;
                    }
                  }
                  if (savedName) {
                    if (selectedEntity.fields.some(f => f.key === 'patient_name')) {
                      initialData.patient_name = savedName;
                    }
                    if (selectedEntity.fields.some(f => f.key === 'full_name')) {
                      initialData.full_name = savedName;
                    }
                    if (selectedEntity.fields.some(f => f.key === 'name')) {
                      initialData.name = savedName;
                    }
                  }

                  setFormData(initialData);
                  setEditingRecordId(null);
                  setIsFormOpen(true);
                }}
                className="flex items-center gap-1.5 bg-gray-950 text-white px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm"
              >
                <Plus size={14} />
                <span>Add Item</span>
              </button>

              {records.length === 0 && (
                <button
                  onClick={() => handleSeedDefaults(selectedEntityId)}
                  disabled={seedingLoading !== null}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 transition-colors px-3 py-2 rounded-lg"
                >
                  <DatabaseZap size={14} />
                  <span>{seedingLoading === selectedEntityId ? 'Seeding...' : 'Seed Table'}</span>
                </button>
              )}

              <button
                onClick={() => setIsSchemaOpen(true)}
                className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <Settings2 size={14} />
                <span>Schema Editor</span>
              </button>

              <button
                onClick={() => setIsPermissionsOpen(true)}
                className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <Shield size={14} />
                <span>Permissions</span>
              </button>

              <button
                onClick={() => setIsImportOpen(true)}
                className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                title="Import records from JSON file"
              >
                <Upload size={14} />
                <span>Import</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                title="Export current table records to JSON file"
              >
                <Download size={14} />
                <span>Export</span>
              </button>

              <button
                onClick={() => setIsRecentlyDeletedOpen(true)}
                className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                title="View recently deleted records (Recycle Bin)"
              >
                <History size={14} />
                <span>Recently Deleted</span>
              </button>

              <button
                onClick={handleDeleteAllRecords}
                className="flex items-center gap-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                title="Move all current table records to Recycle Bin"
              >
                <Trash2 size={14} />
                <span>Delete All</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className="flex items-center justify-center border border-gray-200 hover:bg-gray-100 text-gray-700 p-2.5 rounded-lg text-xs transition-colors"
                  aria-label="More actions"
                >
                  <MoreHorizontal size={14} />
                </button>
                {isMoreMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsMoreMenuOpen(false)} 
                    />
                    <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1.5 z-20 animate-in fade-in slide-in-from-top-1 duration-100">
                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setIsImportOpen(true);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <Upload size={14} className="text-gray-400" />
                        <span>Import</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          handleExportJSON();
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <Download size={14} className="text-gray-400" />
                        <span>Export</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setIsSchemaOpen(true);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <Settings2 size={14} className="text-gray-400" />
                        <span>Schema</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setIsRecentlyDeletedOpen(true);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <History size={14} className="text-gray-400" />
                        <span>Recently Deleted</span>
                      </button>

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          handleDeleteAllRecords();
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 size={14} className="text-rose-400" />
                        <span>Delete All</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    )}

  {/* Live Search and Stats Info Bar */}
  <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={selectedEntity.searchPlaceholder || `Search within ${selectedEntity.name} fields...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow"
                />
              </div>
              <button
                onClick={() => setIsScannerModalOpen(true)}
                className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 shadow-xs cursor-pointer select-none"
                title="Scan Patient Admission QR Code"
              >
                <QrCode size={14} className="text-indigo-600 animate-pulse" />
                <span>Scan QR</span>
              </button>
            </div>
            {(selectedEntityId === 'ClinicalEncounter' || selectedEntityId === 'Staff' || selectedEntityId === 'Patient' || selectedEntityId === 'LabResult' || selectedEntityId === 'Prescription' || selectedEntityId === 'Form_1_1_1_a_1' || selectedEntityId === 'Diagnostic' || selectedEntityId === 'Bed' || selectedEntityId === 'VitalSign' || selectedEntityId === 'Admission' || selectedEntityId === 'LiaisonOffice' || selectedEntityId === 'Immunization' || selectedEntityId === 'OperativeRecord' || selectedEntityId === 'SupplyItem' || selectedEntityId === 'FinancialLedger' || selectedEntityId === 'InsuranceClaim' || selectedEntityId === 'User' || selectedEntityId === 'PatientJourneyEvent' || selectedEntityId === 'Notification' || selectedEntityId === 'NotificationPreference') && (
              <button
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isFilterPanelOpen || activeFiltersCount > 0
                    ? 'border-gray-900 bg-gray-50 text-gray-900'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-gray-900 text-white font-bold px-1.5 py-0.5 rounded-full text-[10px]">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            )}

            {/* Column Options Manager Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}
                className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer select-none ${
                  isColumnSelectorOpen || (userColumns[selectedEntityId] && userColumns[selectedEntityId].length > 0)
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
                title="Manage visible table columns & add dynamic attributes"
              >
                <SlidersHorizontal size={14} className="text-indigo-600 animate-pulse" />
                <span>Columns & View Options</span>
                {userColumns[selectedEntityId] && userColumns[selectedEntityId].length > 0 && (
                  <span className="bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded-full text-[10px]">
                    {userColumns[selectedEntityId].length}
                  </span>
                )}
              </button>

              {isColumnSelectorOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setIsColumnSelectorOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                      <span className="font-bold text-gray-800 text-xs">Table Columns & View Options</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            const allKeys = allAvailableColumns.map(c => c.key);
                            const currentKeys = userColumns[selectedEntityId] || activeColumns.map(c => c.key);
                            if (currentKeys.length === allKeys.length) {
                              setUserColumns(prev => ({ ...prev, [selectedEntityId]: [] }));
                            } else {
                              setUserColumns(prev => ({ ...prev, [selectedEntityId]: allKeys }));
                            }
                          }}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors cursor-pointer"
                        >
                          Toggle All
                        </button>
                        <button
                          onClick={() => {
                            setUserColumns(prev => {
                              const updated = { ...prev };
                              delete updated[selectedEntityId];
                              return updated;
                            });
                          }}
                          className="text-[10px] font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Columns Checkbox List */}
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border-b border-gray-100 pb-3 mb-3">
                      {allAvailableColumns.map((col) => {
                        const currentKeys = userColumns[selectedEntityId] || activeColumns.map(c => c.key);
                        const isChecked = currentKeys.includes(col.key);
                        return (
                          <label key={col.key} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors text-[11px] font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                let newKeys = [...currentKeys];
                                if (isChecked) {
                                  newKeys = newKeys.filter(k => k !== col.key);
                                } else {
                                  newKeys.push(col.key);
                                }
                                setUserColumns(prev => ({
                                  ...prev,
                                  [selectedEntityId]: newKeys
                                }));
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-semibold text-gray-800">{col.label}</p>
                              {!col.isSchema && (
                                <p className="text-[9px] text-indigo-500 font-mono">Dynamic Record Field</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {/* Add Dynamic Column Form */}
                    <div className="bg-slate-50 border border-gray-100 p-2.5 rounded-xl space-y-2">
                      <p className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                        <Plus size={12} className="text-indigo-600" />
                        <span>Add Dynamic Attribute / Option</span>
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          placeholder="field_key (e.g. eye_color)"
                          value={newColKey}
                          onChange={(e) => setNewColKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          className="px-2 py-1 text-[10px] border border-gray-200 rounded focus:outline-none bg-white font-mono"
                        />
                        <input
                          type="text"
                          placeholder="Label (e.g. Eye Color)"
                          value={newColLabel}
                          onChange={(e) => setNewColLabel(e.target.value)}
                          className="px-2 py-1 text-[10px] border border-gray-200 rounded focus:outline-none bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 items-center">
                        <select
                          value={newColType}
                          onChange={(e: any) => setNewColType(e.target.value)}
                          className="px-2 py-1 text-[10px] border border-gray-200 rounded bg-white text-gray-700"
                        >
                          <option value="string">Text Field</option>
                          <option value="number">Number</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="date">Date</option>
                          <option value="textarea">Textarea</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newColKey || !newColLabel) return;
                            const newField = {
                              key: newColKey,
                              label: newColLabel,
                              type: newColType,
                              placeholder: `Enter ${newColLabel}...`,
                              required: false
                            };
                            setCustomSchemaFields(prev => {
                              const existing = prev[selectedEntityId] || [];
                              if (existing.some(f => f.key === newColKey)) return prev;
                              return {
                                ...prev,
                                [selectedEntityId]: [...existing, newField]
                              };
                            });
                            const currentKeys = userColumns[selectedEntityId] || activeColumns.map(c => c.key);
                            if (!currentKeys.includes(newColKey)) {
                              setUserColumns(prev => ({
                                ...prev,
                                [selectedEntityId]: [...currentKeys, newColKey]
                              }));
                            }
                            setNewColKey('');
                            setNewColLabel('');
                          }}
                          className="bg-indigo-600 text-white font-bold py-1 px-2.5 rounded text-[10px] hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus size={10} />
                          <span>Add Field</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Info size={14} className="text-gray-400" />
            <span>Showing {filteredRecords.length} of {records.length} database rows</span>
          </div>
        </div>

        {/* Dynamic Summary Stats Row */}
        <div className="px-6 py-3 border-b border-gray-100 bg-white flex flex-wrap gap-4">
          {selectedEntity.id === 'Bed' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Occupancy:</span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100">
                  {records.filter(r => r.status === 'occupied').length} Occupied
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                  {records.filter(r => r.status === 'available').length} Available
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100">
                  {records.filter(r => r.status === 'reserved').length} Reserved
                </span>
                <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full text-[10px] font-bold border border-gray-100">
                  {records.filter(r => r.status === 'cleaning' || r.status === 'maintenance').length} Servicing
                </span>
              </div>
              <div className="h-4 w-px bg-gray-200 self-center hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Wards:</span>
                {Array.from(new Set(records.map(r => r.ward).filter(Boolean))).slice(0, 4).map(ward => (
                  <span key={ward} className="text-[10px] font-semibold text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                    {ward}: {records.filter(r => r.ward === ward).length}
                  </span>
                ))}
              </div>
            </>
          )}
          {selectedEntity.id === 'ClinicalEncounter' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status:</span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100">
                  {records.filter(r => r.status === 'open' || r.status === 'in_progress').length} Active
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                  {records.filter(r => r.status === 'discharged' || r.status === 'closed').length} Completed
                </span>
              </div>
              <div className="h-4 w-px bg-gray-200 self-center hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Priority:</span>
                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold border border-rose-100">
                  {records.filter(r => r.priority === 'urgent' || r.priority === 'critical' || r.priority === 'trauma').length} Emergency
                </span>
                <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-full text-[10px] font-bold border border-slate-100">
                  {records.filter(r => r.priority === 'routine').length} Routine
                </span>
              </div>
            </>
          )}
          {selectedEntity.id === 'Prescription' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fulfillment:</span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100">
                  {records.filter(r => r.status === 'pending' || r.status === 'active').length} Pending
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                  {records.filter(r => r.status === 'completed' || r.status === 'dispensed').length} Dispensed
                </span>
              </div>
            </>
          )}
          {selectedEntity.id === 'Form_1_1_1_a_1' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Schedule:</span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100">
                  {records.filter(r => r.status === 'scheduled').length} Scheduled
                </span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100">
                  {records.filter(r => r.status === 'checked_in' || r.status === 'in_progress').length} In Progress
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                  {records.filter(r => r.status === 'completed').length} Completed
                </span>
              </div>
            </>
          )}
          {selectedEntity.id === 'Allergy' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Safety:</span>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold border border-rose-100 animate-pulse">
                {records.filter(r => r.severity === 'Severe' || r.severity === 'Lethal').length} High Risk
              </span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100">
                {records.filter(r => r.severity === 'Moderate').length} Moderate
              </span>
            </div>
          )}
          {selectedEntity.id === 'VitalSign' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Metrics:</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100">
                {records.length} Readings
              </span>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold border border-rose-100">
                {records.filter(r => r.temp_c > 38 || r.bp_systolic > 140).length} Abnormal
              </span>
            </div>
          )}
          {selectedEntity.id === 'Admission' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inpatient:</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100">
                {records.filter(r => r.status === 'Active').length} Active
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                {records.filter(r => r.status === 'Discharged').length} Discharged
              </span>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold border border-rose-100">
                {records.filter(r => r.admission_type === 'Emergency').length} Emergencies
              </span>
            </div>
          )}
          {selectedEntity.id === 'LiaisonOffice' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Liaison:</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100">
                {records.filter(r => r.referral_type === 'Outbound').length} Outbound
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                {records.filter(r => r.status === 'Approved').length} Approved
              </span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100">
                {records.filter(r => r.status === 'Pending').length} Pending
              </span>
            </div>
          )}
          {['Bed', 'ClinicalEncounter', 'Prescription', 'Form_1_1_1_a_1', 'Allergy', 'VitalSign', 'Admission', 'LiaisonOffice'].includes(selectedEntity.id) === false && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quick Metrics:</span>
              <span className="text-[10px] font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                Total Records: {records.length}
              </span>
              <span className="text-[10px] font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                Today's Entries: {records.filter(r => {
                  const date = r.tx_date || r.encounter_date || r.created_at || r.registration_date || r.ordered_at || r.prescribed_at || r.scheduled_at;
                  if (!date) return false;
                  return new Date(date).toDateString() === new Date().toDateString();
                }).length}
              </span>
            </div>
          )}
        </div>

        {/* Collapsible Filter Criteria Dashboard (ClinicalEncounter specific) */}
        {selectedEntityId === 'ClinicalEncounter' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>ClinicalEncounter Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    encounter_type: '',
                    clinic: '',
                    vitals_pulse_min: '',
                    vitals_pulse_max: '',
                    vitals_temp_min: '',
                    vitals_temp_max: '',
                    vitals_spo2_min: '',
                    vitals_spo2_max: '',
                    vitals_respiratory_rate_min: '',
                    vitals_respiratory_rate_max: '',
                    vitals_weight_min: '',
                    vitals_weight_max: '',
                    encounter_date_from: '',
                    encounter_date_to: '',
                    status: '',
                    priority: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Encounter type */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Encounter type</label>
                <select
                  value={filters.encounter_type}
                  onChange={(e) => setFilters(prev => ({ ...prev, encounter_type: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Encounter Types</option>
                  <option value="opd">opd</option>
                  <option value="ipd">ipd</option>
                  <option value="emergency">emergency</option>
                  <option value="referral">referral</option>
                  <option value="follow_up">follow_up</option>
                </select>
              </div>

              {/* Clinic */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Clinic</label>
                <select
                  value={filters.clinic}
                  onChange={(e) => setFilters(prev => ({ ...prev, clinic: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white font-sans"
                >
                  <option value="">All Clinics</option>
                  <option value="general_opd">general_opd</option>
                  <option value="art_hiv">art_hiv</option>
                  <option value="tb_clinic">tb_clinic</option>
                  <option value="diabetes_hypertension">diabetes_hypertension</option>
                  <option value="family_planning">family_planning</option>
                  <option value="epi_immunization">epi_immunization</option>
                  <option value="dental">dental</option>
                  <option value="ophthalmology">ophthalmology</option>
                  <option value="psychiatric">psychiatric</option>
                  <option value="antenatal">antenatal</option>
                  <option value="labor_delivery">labor_delivery</option>
                  <option value="neonatal_nicu">neonatal_nicu</option>
                  <option value="pediatric">pediatric</option>
                  <option value="medical_ward">medical_ward</option>
                  <option value="surgical_ward">surgical_ward</option>
                  <option value="gynecology">gynecology</option>
                  <option value="icu">icu</option>
                  <option value="operating_room">operating_room</option>
                  <option value="referral_clinic">referral_clinic</option>
                  <option value="triage_emergency">triage_emergency</option>
                </select>
              </div>

              {/* Vitals pulse */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Vitals pulse (Min - Max)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.vitals_pulse_min}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_pulse_min: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.vitals_pulse_max}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_pulse_max: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Vitals temp */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Vitals temp (Min - Max)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Min"
                    value={filters.vitals_temp_min}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_temp_min: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Max"
                    value={filters.vitals_temp_max}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_temp_max: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Vitals spo2 */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Vitals spo2 (Min - Max)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.vitals_spo2_min}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_spo2_min: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.vitals_spo2_max}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_spo2_max: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Vitals respiratory rate */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Vitals respiratory rate (Min - Max)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.vitals_respiratory_rate_min}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_respiratory_rate_min: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.vitals_respiratory_rate_max}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_respiratory_rate_max: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Vitals weight */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Vitals weight (Min - Max)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.vitals_weight_min}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_weight_min: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.vitals_weight_max}
                    onChange={(e) => setFilters(prev => ({ ...prev, vitals_weight_max: e.target.value }))}
                    className="w-1/2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Encounter date range */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Encounter date (From - To)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={filters.encounter_date_from}
                    onChange={(e) => setFilters(prev => ({ ...prev, encounter_date_from: e.target.value }))}
                    className="w-1/2 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="date"
                    value={filters.encounter_date_to}
                    onChange={(e) => setFilters(prev => ({ ...prev, encounter_date_to: e.target.value }))}
                    className="w-1/2 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="open">open</option>
                  <option value="in_progress">in_progress</option>
                  <option value="awaiting_results">awaiting_results</option>
                  <option value="discharged">discharged</option>
                  <option value="closed">closed</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Priorities</option>
                  <option value="routine">routine</option>
                  <option value="urgent">urgent</option>
                  <option value="critical">critical</option>
                  <option value="trauma">trauma</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (Staff specific) */}
        {selectedEntityId === 'Staff' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Staff Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    encounter_type: '',
                    clinic: '',
                    vitals_pulse_min: '',
                    vitals_pulse_max: '',
                    vitals_temp_min: '',
                    vitals_temp_max: '',
                    vitals_spo2_min: '',
                    vitals_spo2_max: '',
                    vitals_respiratory_rate_min: '',
                    vitals_respiratory_rate_max: '',
                    vitals_weight_min: '',
                    vitals_weight_max: '',
                    encounter_date_from: '',
                    encounter_date_to: '',
                    status: '',
                    priority: '',
                    staff_id: '',
                    full_name: '',
                    department: '',
                    role: '',
                    prescribed_at_from: '',
                    prescribed_at_to: '',
                    prescription_items_query: '',
                    prescription_status: '',
                    dispensed_at_from: '',
                    dispensed_at_to: '',
                    prescription_payer_method: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* staff_id */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">staff_id</label>
                <input
                  type="text"
                  placeholder="Filter by staff_id..."
                  value={filters.staff_id || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, staff_id: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              {/* full_name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">full_name</label>
                <input
                  type="text"
                  placeholder="Filter by full_name..."
                  value={filters.full_name || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              {/* department */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">department</label>
                <select
                  value={filters.department || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Departments</option>
                  <option value="medical">medical</option>
                  <option value="nursing">nursing</option>
                  <option value="pharmacy">pharmacy</option>
                  <option value="laboratory">laboratory</option>
                  <option value="administration">administration</option>
                </select>
              </div>

              {/* role */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">role</label>
                <input
                  type="text"
                  placeholder="Filter by role..."
                  value={filters.role || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (Patient specific) */}
        {selectedEntityId === 'Patient' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Patient Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    patient_mrn: '',
                    patient_gender: '',
                    patient_blood_group: '',
                    patient_cbhi_status: '',
                    patient_region: '',
                    patient_woreda: '',
                    patient_status: '',
                    patient_registration_date_from: '',
                    patient_registration_date_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">MRN</label>
                <input
                  type="text"
                  placeholder="Filter by mrn..."
                  value={filters.patient_mrn || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_mrn: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Gender</label>
                <select
                  value={filters.patient_gender || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_gender: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Blood Group</label>
                <select
                  value={filters.patient_blood_group || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_blood_group: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Types</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">CBHI Status</label>
                <select
                  value={filters.patient_cbhi_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_cbhi_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">Any Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="none">None</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.patient_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">Any Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="deceased">Deceased</option>
                  <option value="transferred">Transferred</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Region</label>
                <input
                  type="text"
                  placeholder="Filter region..."
                  value={filters.patient_region || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_region: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Woreda</label>
                <input
                  type="text"
                  placeholder="Filter woreda..."
                  value={filters.patient_woreda || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_woreda: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Reg. Date From</label>
                <input
                  type="date"
                  value={filters.patient_registration_date_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_registration_date_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Reg. Date To</label>
                <input
                  type="date"
                  value={filters.patient_registration_date_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, patient_registration_date_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (LabResult specific) */}
        {selectedEntityId === 'LabResult' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>LabResult Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    lab_result_panel: '',
                    lab_result_status: '',
                    lab_result_test_type: '',
                    lab_result_is_critical: '',
                    lab_result_resulted_at_from: '',
                    lab_result_resulted_at_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Panel</label>
                <select
                  value={filters.lab_result_panel || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, lab_result_panel: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Panels</option>
                  <option value="hematology">Hematology</option>
                  <option value="biochemistry">Biochemistry</option>
                  <option value="microbiology">Microbiology</option>
                  <option value="immunology">Immunology</option>
                  <option value="urinalysis">Urinalysis</option>
                  <option value="cd4_vl">CD4/VL</option>
                  <option value="coagulation">Coagulation</option>
                  <option value="hormones">Hormones</option>
                  <option value="radiology_report">Radiology Report</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.lab_result_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, lab_result_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">Any Status</option>
                  <option value="preliminary">Preliminary</option>
                  <option value="final">Final</option>
                  <option value="amended">Amended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1 lg:col-span-2">
                <label className="block text-[11px] font-bold text-gray-600">Test Type Contains</label>
                <input
                  type="text"
                  placeholder="e.g. blood count..."
                  value={filters.lab_result_test_type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, lab_result_test_type: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Is Critical?</label>
                <select
                  value={filters.lab_result_is_critical || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, lab_result_is_critical: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Resulted Date From</label>
                <input
                  type="date"
                  value={filters.lab_result_resulted_at_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, lab_result_resulted_at_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Resulted Date To</label>
                <input
                  type="date"
                  value={filters.lab_result_resulted_at_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, lab_result_resulted_at_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (Prescription specific) */}
        {selectedEntityId === 'Prescription' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Prescription Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    encounter_type: '',
                    clinic: '',
                    vitals_pulse_min: '',
                    vitals_pulse_max: '',
                    vitals_temp_min: '',
                    vitals_temp_max: '',
                    vitals_spo2_min: '',
                    vitals_spo2_max: '',
                    vitals_respiratory_rate_min: '',
                    vitals_respiratory_rate_max: '',
                    vitals_weight_min: '',
                    vitals_weight_max: '',
                    encounter_date_from: '',
                    encounter_date_to: '',
                    status: '',
                    priority: '',
                    staff_id: '',
                    full_name: '',
                    department: '',
                    role: '',
                    prescribed_at_from: '',
                    prescribed_at_to: '',
                    prescription_items_query: '',
                    prescription_status: '',
                    dispensed_at_from: '',
                    dispensed_at_to: '',
                    prescription_payer_method: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Prescribed at from */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Prescribed At (From)</label>
                <input
                  type="date"
                  value={filters.prescribed_at_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, prescribed_at_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Prescribed at to */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Prescribed At (To)</label>
                <input
                  type="date"
                  value={filters.prescribed_at_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, prescribed_at_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Items search */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Items (Medication Details)</label>
                <input
                  type="text"
                  placeholder="Search drug, dose, frequency..."
                  value={filters.prescription_items_query || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, prescription_items_query: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.prescription_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, prescription_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">pending</option>
                  <option value="dispensed">dispensed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>

              {/* Dispensed at from */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Dispensed At (From)</label>
                <input
                  type="date"
                  value={filters.dispensed_at_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, dispensed_at_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Dispensed at to */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Dispensed At (To)</label>
                <input
                  type="date"
                  value={filters.dispensed_at_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, dispensed_at_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Payer Method */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Payer Method</label>
                <select
                  value={filters.prescription_payer_method || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, prescription_payer_method: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Methods</option>
                  <option value="cash">cash</option>
                  <option value="insurance">insurance</option>
                  <option value="credit">credit</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (Diagnostic specific) */}
        {selectedEntityId === 'Diagnostic' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Diagnostic Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    diagnostic_category: '',
                    diagnostic_ordered_at_from: '',
                    diagnostic_ordered_at_to: '',
                    diagnostic_is_critical: '',
                    diagnostic_status: '',
                    diagnostic_turnaround_min: '',
                    diagnostic_turnaround_max: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Category */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Category</label>
                <select
                  value={filters.diagnostic_category || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, diagnostic_category: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Categories</option>
                  <option value="laboratory">laboratory</option>
                  <option value="radiology">radiology</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.diagnostic_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, diagnostic_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="ordered">ordered</option>
                  <option value="sample_collected">sample_collected</option>
                  <option value="in_progress">in_progress</option>
                  <option value="resulted">resulted</option>
                  <option value="verified">verified</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>

              {/* Is Critical */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Is Critical</label>
                <select
                  value={filters.diagnostic_is_critical || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, diagnostic_is_critical: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All</option>
                  <option value="yes">Yes (Critical)</option>
                  <option value="no">No</option>
                </select>
              </div>

              {/* Ordered At From */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Ordered At (From)</label>
                <input
                  type="date"
                  value={filters.diagnostic_ordered_at_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, diagnostic_ordered_at_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Ordered At To */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Ordered At (To)</label>
                <input
                  type="date"
                  value={filters.diagnostic_ordered_at_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, diagnostic_ordered_at_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Turnaround Minutes Min */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Turnaround Min (Minutes)</label>
                <input
                  type="number"
                  placeholder="e.g. 15"
                  value={filters.diagnostic_turnaround_min || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, diagnostic_turnaround_min: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>

              {/* Turnaround Minutes Max */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Turnaround Max (Minutes)</label>
                <input
                  type="number"
                  placeholder="e.g. 120"
                  value={filters.diagnostic_turnaround_max || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, diagnostic_turnaround_max: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (Bed specific) */}
        {selectedEntityId === 'Bed' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Bed Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    bed_ward: '',
                    bed_status: '',
                    bed_admission_date_from: '',
                    bed_admission_date_to: '',
                    bed_expected_discharge_from: '',
                    bed_expected_discharge_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Ward */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Ward</label>
                <select
                  value={filters.bed_ward || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, bed_ward: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Wards</option>
                  <option value="labor">Labor</option>
                  <option value="neonatal_nicu">NICU</option>
                  <option value="pediatric">Pediatric Ward</option>
                  <option value="medical">Medical Ward</option>
                  <option value="surgical">Surgical Ward</option>
                  <option value="gynecology">Gynecology</option>
                  <option value="icu">ICU</option>
                  <option value="post_op_recovery">Post-Op Recovery</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.bed_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, bed_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              {/* Admission Date From */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Admission Date (From)</label>
                <input
                  type="datetime-local"
                  value={filters.bed_admission_date_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, bed_admission_date_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Admission Date To */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Admission Date (To)</label>
                <input
                  type="datetime-local"
                  value={filters.bed_admission_date_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, bed_admission_date_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Expected Discharge From */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Expected Discharge (From)</label>
                <input
                  type="date"
                  value={filters.bed_expected_discharge_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, bed_expected_discharge_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Expected Discharge To */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Expected Discharge (To)</label>
                <input
                  type="date"
                  value={filters.bed_expected_discharge_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, bed_expected_discharge_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (VitalSign specific) */}
        {selectedEntityId === 'VitalSign' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>VitalSign Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    vital_sign_taken_at_from: '',
                    vital_sign_taken_at_to: '',
                    vital_sign_hr_min: '',
                    vital_sign_hr_max: '',
                    vital_sign_temp_min: '',
                    vital_sign_temp_max: '',
                    vital_sign_spo2_min: '',
                    vital_sign_spo2_max: '',
                    vital_sign_bp_sys_min: '',
                    vital_sign_bp_sys_max: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {/* Taken At From */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Date From</label>
                <input
                  type="datetime-local"
                  value={filters.vital_sign_taken_at_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, vital_sign_taken_at_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Taken At To */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Date To</label>
                <input
                  type="datetime-local"
                  value={filters.vital_sign_taken_at_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, vital_sign_taken_at_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* Temp Min */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Temp Min (°C)</label>
                <input
                  type="number"
                  placeholder="e.g. 38.0"
                  value={filters.vital_sign_temp_min || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, vital_sign_temp_min: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* HR Min */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Heart Rate Min</label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={filters.vital_sign_hr_min || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, vital_sign_hr_min: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              {/* SpO2 Min */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">SpO2 Min (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 94"
                  value={filters.vital_sign_spo2_min || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, vital_sign_spo2_min: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (Admission specific) */}
        {selectedEntityId === 'Admission' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Admission Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    admission_ward: '',
                    admission_type: '',
                    admission_status: '',
                    admission_date_from: '',
                    admission_date_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Ward contains</label>
                <input
                  type="text"
                  placeholder="e.g. Medical..."
                  value={filters.admission_ward || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, admission_ward: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Type</label>
                <select
                  value={filters.admission_type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, admission_type: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any Type</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Elective">Elective</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Newborn">Newborn</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.admission_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, admission_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any Status</option>
                  <option value="Active">Active</option>
                  <option value="Discharged">Discharged</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Admission Date From</label>
                <input
                  type="date"
                  value={filters.admission_date_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, admission_date_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Admission Date To</label>
                <input
                  type="date"
                  value={filters.admission_date_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, admission_date_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (LiaisonOffice specific) */}
        {selectedEntityId === 'LiaisonOffice' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>LiaisonOffice Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    liaison_referral_type: '',
                    liaison_status: '',
                    liaison_source_facility: '',
                    liaison_destination_facility: '',
                    liaison_date_from: '',
                    liaison_date_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Type</label>
                <select
                  value={filters.liaison_referral_type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, liaison_referral_type: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="Inbound">Inbound</option>
                  <option value="Outbound">Outbound</option>
                  <option value="Emergency Transfer">Emergency Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.liaison_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, liaison_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Received">Received</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Source contains</label>
                <input
                  type="text"
                  placeholder="e.g. Hospital..."
                  value={filters.liaison_source_facility || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, liaison_source_facility: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Dest. contains</label>
                <input
                  type="text"
                  placeholder="e.g. TASH..."
                  value={filters.liaison_destination_facility || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, liaison_destination_facility: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Referral Date From</label>
                <input
                  type="date"
                  value={filters.liaison_date_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, liaison_date_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Referral Date To</label>
                <input
                  type="date"
                  value={filters.liaison_date_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, liaison_date_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (Immunization specific) */}
        {selectedEntityId === 'Immunization' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Immunization Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    immunization_vaccine_name: '',
                    immunization_administered_at_from: '',
                    immunization_administered_at_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Vaccine contains</label>
                <input
                  type="text"
                  placeholder="e.g. Polio..."
                  value={filters.immunization_vaccine_name || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, immunization_vaccine_name: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Administered From</label>
                <input
                  type="date"
                  value={filters.immunization_administered_at_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, immunization_administered_at_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Administered To</label>
                <input
                  type="date"
                  value={filters.immunization_administered_at_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, immunization_administered_at_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (OperativeRecord specific) */}
        {selectedEntityId === 'OperativeRecord' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>OperativeRecord Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    operative_procedure_name: '',
                    operative_outcome: '',
                    operative_start_time_from: '',
                    operative_start_time_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Procedure contains</label>
                <input
                  type="text"
                  placeholder="e.g. Appendectomy..."
                  value={filters.operative_procedure_name || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, operative_procedure_name: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Outcome</label>
                <select
                  value={filters.operative_outcome || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, operative_outcome: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="Successful">Successful</option>
                  <option value="Complicated">Complicated</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Start Time From</label>
                <input
                  type="date"
                  value={filters.operative_start_time_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, operative_start_time_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Start Time To</label>
                <input
                  type="date"
                  value={filters.operative_start_time_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, operative_start_time_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (SupplyItem specific) */}
        {selectedEntityId === 'SupplyItem' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>SupplyItem Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    supply_category: '',
                    supply_location: '',
                    supply_status: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Category</label>
                <select
                  value={filters.supply_category || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, supply_category: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any Category</option>
                  <option value="drug">Drug</option>
                  <option value="consumable">Consumable</option>
                  <option value="equipment">Equipment</option>
                  <option value="furniture">Furniture</option>
                  <option value="linen">Linen</option>
                  <option value="reagent">Reagent</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Location</label>
                <select
                  value={filters.supply_location || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, supply_location: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any Location</option>
                  <option value="drug_store_bulk">Drug Store Bulk</option>
                  <option value="central_store">Central Store</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="ward_stock">Ward Stock</option>
                  <option value="lab_stock">Lab Stock</option>
                  <option value="or_stock">OR Stock</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.supply_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, supply_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="expired">Expired</option>
                  <option value="recalled">Recalled</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (FinancialLedger specific) */}
        {selectedEntityId === 'FinancialLedger' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>FinancialLedger Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    financial_service_type: '',
                    financial_payer_method: '',
                    financial_status: '',
                    financial_tx_date_from: '',
                    financial_tx_date_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Service Type</label>
                <select
                  value={filters.financial_service_type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, financial_service_type: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="consultation">Consultation</option>
                  <option value="laboratory">Laboratory</option>
                  <option value="radiology">Radiology</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="ward_stay">Ward Stay</option>
                  <option value="surgery">Surgery</option>
                  <option value="procedure">Procedure</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Payer Method</label>
                <select
                  value={filters.financial_payer_method || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, financial_payer_method: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="cash">Cash</option>
                  <option value="telebirr">Telebirr</option>
                  <option value="cbe_birr">CBE Birr</option>
                  <option value="cbhi_insurance">CBHI</option>
                  <option value="waiver">Waiver</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.financial_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, financial_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Tx Date From</label>
                <input
                  type="date"
                  value={filters.financial_tx_date_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, financial_tx_date_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Tx Date To</label>
                <input
                  type="date"
                  value={filters.financial_tx_date_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, financial_tx_date_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (InsuranceClaim specific) */}
        {selectedEntityId === 'InsuranceClaim' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>InsuranceClaim Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    claim_insurer: '',
                    claim_status: '',
                    claim_date_from: '',
                    claim_date_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Insurer</label>
                <select
                  value={filters.claim_insurer || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, claim_insurer: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="cbhi">CBHI</option>
                  <option value="private">Private</option>
                  <option value="ngo">NGO</option>
                  <option value="government">Government</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.claim_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, claim_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Paid">Paid</option>
                  <option value="Appealed">Appealed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Claim Date From</label>
                <input
                  type="date"
                  value={filters.claim_date_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, claim_date_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Claim Date To</label>
                <input
                  type="date"
                  value={filters.claim_date_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, claim_date_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (User specific) */}
        {selectedEntityId === 'User' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>User Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    user_role: '',
                    user_hospital_id: '',
                    user_created_date_from: '',
                    user_created_date_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Role</label>
                <select
                  value={filters.user_role || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, user_role: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Hospital ID contains</label>
                <input
                  type="text"
                  placeholder="e.g. TENANT-ID..."
                  value={filters.user_hospital_id || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, user_hospital_id: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Created Date From</label>
                <input
                  type="date"
                  value={filters.user_created_date_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, user_created_date_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Created Date To</label>
                <input
                  type="date"
                  value={filters.user_created_date_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, user_created_date_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (PatientJourneyEvent specific) */}
        {selectedEntityId === 'PatientJourneyEvent' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Journey Event Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    journey_stage: '',
                    journey_status: '',
                    journey_event_time_from: '',
                    journey_event_time_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Stage</label>
                <select
                  value={filters.journey_stage || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, journey_stage: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="referral">Referral</option>
                  <option value="registration">Registration</option>
                  <option value="triage">Triage</option>
                  <option value="consultation">Consultation</option>
                  <option value="laboratory">Laboratory</option>
                  <option value="radiology">Radiology</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="operating_room">Operating Room</option>
                  <option value="ward_admission">Ward Admission</option>
                  <option value="ward_transfer">Ward Transfer</option>
                  <option value="discharge">Discharge</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Status</label>
                <select
                  value={filters.journey_status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, journey_status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Event Time From</label>
                <input
                  type="date"
                  value={filters.journey_event_time_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, journey_event_time_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Event Time To</label>
                <input
                  type="date"
                  value={filters.journey_event_time_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, journey_event_time_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (Notification specific) */}
        {selectedEntityId === 'Notification' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Notification Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    notification_type: '',
                    notification_severity: '',
                    notification_is_read: '',
                    notification_event_time_from: '',
                    notification_event_time_to: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Type</label>
                <select
                  value={filters.notification_type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, notification_type: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="critical_lab">Critical Lab</option>
                  <option value="critical_vital">Critical Vital</option>
                  <option value="critical_imaging">Critical Imaging</option>
                  <option value="medication_alert">Medication Alert</option>
                  <option value="patient_deterioration">Patient Deterioration</option>
                  <option value="or_schedule">OR Schedule</option>
                  <option value="trauma_incoming">Trauma Incoming</option>
                  <option value="cbhi_alert">CBHI Alert</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Severity</label>
                <select
                  value={filters.notification_severity || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, notification_severity: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Is Read</label>
                <select
                  value={filters.notification_is_read || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, notification_is_read: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Event Time From</label>
                <input
                  type="date"
                  value={filters.notification_event_time_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, notification_event_time_from: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Event Time To</label>
                <input
                  type="date"
                  value={filters.notification_event_time_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, notification_event_time_to: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Filter Criteria Dashboard (NotificationPreference specific) */}
        {selectedEntityId === 'NotificationPreference' && isFilterPanelOpen && (
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-gray-500" />
                <span>Preference Filter Criteria</span>
              </h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    pref_role: '',
                    pref_alert_type: '',
                    pref_min_severity: '',
                    pref_enabled: '',
                  }))}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Role</label>
                <select
                  value={filters.pref_role || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, pref_role: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="physician">Physician</option>
                  <option value="nurse">Nurse</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="lab_tech">Lab Tech</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Alert Type</label>
                <select
                  value={filters.pref_alert_type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, pref_alert_type: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="critical_lab">Critical Lab</option>
                  <option value="critical_vital">Critical Vital</option>
                  <option value="critical_imaging">Critical Imaging</option>
                  <option value="medication_alert">Medication Alert</option>
                  <option value="patient_deterioration">Patient Deterioration</option>
                  <option value="or_schedule">OR Schedule</option>
                  <option value="trauma_incoming">Trauma Incoming</option>
                  <option value="cbhi_alert">CBHI Alert</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Min Severity</label>
                <select
                  value={filters.pref_min_severity || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, pref_min_severity: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600">Enabled</label>
                <select
                  value={filters.pref_enabled || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, pref_enabled: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Live Table Renderer */}
        {selectedPatientMrn ? (
          <div className="flex-1 p-6">
            <PatientDashboard patientMrn={selectedPatientMrn} onClose={() => setSelectedPatientMrn(null)} />
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto p-6">
            {/* Bulk Operation Action Interface Bar */}
            <div className="mb-4 p-4 bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 dark:text-indigo-100">
                <CheckSquare className="text-indigo-600 dark:text-indigo-400" size={18} />
                <span>
                  Bulk Operation Interface: {selectedRecordIds.length > 0 ? (
                    <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{selectedRecordIds.length} Record(s) Selected</strong>
                  ) : (
                    <span className="text-slate-500 font-medium">Select checkboxes below to batch update or mass delete records</span>
                  )}
                </span>
              </div>

              {selectedRecordIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={bulkAction}
                    onChange={(e: any) => setBulkAction(e.target.value)}
                    className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                  >
                    <option value="update_status">Batch Status Update</option>
                    <option value="delete">Mass Transactional Delete</option>
                    <option value="export_json">Export Selected to JSON</option>
                  </select>

                  {bulkAction === 'update_status' && (
                    <select
                      value={bulkStatusValue}
                      onChange={(e) => setBulkStatusValue(e.target.value)}
                      className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                    >
                      <option value="completed">Completed / Final</option>
                      <option value="verified">Verified / Paid</option>
                      <option value="active">Active / In Progress</option>
                      <option value="pending">Pending Review</option>
                      <option value="cancelled">Cancelled / Void</option>
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={handleExecuteBulkOperation}
                    disabled={isBulkExecuting}
                    className={`px-4 py-1.5 text-xs font-extrabold text-white rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                      bulkAction === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isBulkExecuting ? <Loader2 size={14} className="animate-spin" /> : bulkAction === 'delete' ? <Trash2 size={14} /> : <CheckCircle2 size={14} />}
                    <span>Submit ({selectedRecordIds.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRecordIds([])}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white min-w-[700px]">
              <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredRecords.length > 0 && selectedRecordIds.length === filteredRecords.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRecordIds(filteredRecords.map(r => r.id));
                        } else {
                          setSelectedRecordIds([]);
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  {activeColumns.map((field) => (
                    <th key={field.key} className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right font-semibold text-gray-500 uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => {
                    const isRecent = (() => {
                      if (selectedEntityId !== 'Patient' || !record.created_at) return false;
                      try {
                        const diffMs = Date.now() - new Date(record.created_at).getTime();
                        return diffMs > 0 && diffMs < 45000; // highlighted for 45 seconds
                      } catch (e) {
                        return false;
                      }
                    })();

                    return (
                      <tr 
                        key={record.id} 
                        className={`transition-all duration-1000 ${
                          isRecent 
                            ? 'bg-emerald-50/75 hover:bg-emerald-100/70 border-l-4 border-l-emerald-500 font-medium shadow-xs animate-pulse' 
                            : selectedRecordIds.includes(record.id)
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/20'
                            : 'hover:bg-gray-50/50'
                        }`}
                      >
                        <td className="px-3 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedRecordIds.includes(record.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRecordIds(prev => [...prev, record.id]);
                              } else {
                                setSelectedRecordIds(prev => prev.filter(id => id !== record.id));
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        {activeColumns.map((field) => (
                          <td key={field.key} className="px-5 py-3.5 text-xs">
                              {field.key === 'full_name' && selectedEntityId === 'Patient' ? (
                                <div className="flex items-center gap-2">
                                  <span>{record[field.key]}</span>
                                  {/* Auto-check billing status for patient */}
                                  <BillingPendingBadge mrn={record.mrn} />
                                </div>
                              ) : field.key === 'vitals_summary' ? (
                                <div className="flex flex-wrap gap-1 max-w-[180px]">
                                  {record.vitals_bp && (
                                    <span className="text-[9px] bg-slate-50 text-slate-600 px-1 py-0.5 rounded border border-gray-100 font-mono" title="BP">
                                      {record.vitals_bp}
                                    </span>
                                  )}
                                  {record.vitals_temp && (
                                    <span className="text-[9px] bg-amber-50 text-amber-700 px-1 py-0.5 rounded border border-amber-100 font-mono" title="Temp">
                                      {record.vitals_temp}°C
                                    </span>
                                  )}
                                  {record.vitals_pulse && (
                                    <span className="text-[9px] bg-rose-50 text-rose-700 px-1 py-0.5 rounded border border-rose-100 font-mono" title="Pulse">
                                      {record.vitals_pulse} bpm
                                    </span>
                                  )}
                                  {record.vitals_spo2 && (
                                    <span className="text-[9px] bg-blue-50 text-blue-700 px-1 py-0.5 rounded border border-blue-100 font-mono" title="SpO2">
                                      {record.vitals_spo2}%
                                    </span>
                                  )}
                                  {!record.vitals_bp && !record.vitals_temp && !record.vitals_pulse && <span className="text-gray-300 font-mono">—</span>}
                                </div>
                              ) : field.key === 'items' || field.key === 'services' || field.key === 'result_entries' ? (
                                <div className="flex flex-col gap-1 max-w-[240px]">
                                  {(Array.isArray(record[field.key]) ? record[field.key] : []).map((item: any, idx: number) => (
                                    <div key={idx} className={`${field.key === 'result_entries' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'} text-[10px] px-2 py-0.5 rounded border font-medium leading-tight`}>
                                      {field.key === 'items' ? (
                                        <><span className="font-semibold">{item.drug || 'Drug'}</span> ({item.dose || 'Dose'} - {item.frequency || 'Freq'})</>
                                      ) : field.key === 'services' ? (
                                        <><span className="font-semibold">{item.service_type || 'Service'}</span> - {item.amount ? `${item.amount} ETB` : 'No cost'}</>
                                      ) : (
                                        <><span className="font-semibold">{item.parameter || 'Test'}</span>: {item.value || 'N/A'} {item.unit || ''} ({item.flag || 'Normal'})</>
                                      )}
                                    </div>
                                  ))}
                                  {(!record[field.key] || record[field.key].length === 0) && <span className="text-gray-400 font-mono">—</span>}
                                </div>
                              ) : field.key === 'reminder_sent' || field.key === 'is_read' || field.key === 'is_active' || field.type === 'checkbox' ? (
                                <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                  record[field.key] === true || String(record[field.key]) === 'true'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                    : 'bg-gray-50 text-gray-400 border border-gray-100'
                                  }`}>
                                  {record[field.key] === true || String(record[field.key]) === 'true' ? 'Yes' : 'No'}
                                </span>
                              ) : field.type === 'array' ? (
                                <div className="flex flex-wrap gap-1 max-w-[220px]">
                                  {Array.isArray(record[field.key]) && record[field.key].length > 0 ? (
                                    record[field.key].map((item: any, idx: number) => (
                                      <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded border border-slate-200 font-mono leading-normal max-w-full truncate" title={typeof item === 'object' ? JSON.stringify(item) : String(item)}>
                                        {typeof item === 'object' ? (item.parameter || item.service_type || JSON.stringify(item)) : String(item)}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-gray-400 font-mono">—</span>
                                  )}
                                </div>
                              ) : field.key === 'status' || field.key === 'type' || field.key === 'priority' || field.key === 'severity' || field.key === 'cbhi_status' ? (
                                <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                  ['active', 'approved', 'completed', 'income', 'available', 'admin', 'open', 'routine', 'final', 'verified', 'paid', 'reimbursed', 'in_stock'].includes(String(record[field.key] || '').toLowerCase())
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    : ['pending', 'scheduled', 'in progress', 'in_progress', 'user', 'urgent', 'occupied', 'reserved', 'cleaning', 'preliminary', 'draft', 'submitted', 'under_review', 'low_stock'].includes(String(record[field.key] || '').toLowerCase())
                                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                      : String(record[field.key] || '').toLowerCase() === 'critical' || String(record[field.key] || '').toLowerCase() === 'emergency' || String(record[field.key] || '').toLowerCase() === 'out_of_stock' || String(record[field.key] || '').toLowerCase() === 'expired'
                                        ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse'
                                        : 'bg-gray-50 text-gray-500 border border-gray-100'
                                  }`}>
                                  {record[field.key] || 'None'}
                                </span>
                              ) : field.key === 'bp_systolic' ? (
                                <span className="font-mono font-bold text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100" title="Blood Pressure">
                                  {record.bp_systolic && record.bp_diastolic ? `${record.bp_systolic}/${record.bp_diastolic}` : record[field.key] || '—'}
                                </span>
                              ) : field.key === 'temp_c' ? (
                                <span className={`font-mono font-bold px-1.5 py-0.5 rounded border ${Number(record[field.key]) > 38 ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`} title="Temperature">
                                  {record[field.key] ? `${record[field.key]}°C` : '—'}
                                </span>
                              ) : field.key === 'heart_rate' ? (
                                <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100" title="Heart Rate">
                                  {record[field.key] ? `${record[field.key]} bpm` : '—'}
                                </span>
                              ) : field.key === 'spo2' ? (
                                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100" title="SpO2">
                                  {record[field.key] ? `${record[field.key]}%` : '—'}
                                </span>
                              ) : field.key === 'amount' || field.key === 'total_amount' || field.key === 'approved_amount' || field.key === 'unit_cost' ? (
                                <span className="font-mono font-bold text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                  {record[field.key] ? `${Number(record[field.key]).toLocaleString()} ETB` : '0 ETB'}
                                </span>
                              ) : field.type === 'date' || field.type === 'date-time' ? (
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-700">
                                    {record[field.key] ? new Date(record[field.key]).toLocaleDateString() : '—'}
                                  </span>
                                  {field.type === 'date-time' && record[field.key] && (
                                    <span className="text-[9px] text-gray-400 font-mono">
                                      {new Date(record[field.key]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                              ) : field.key === 'referral_paper' ? (
                                record[field.key] ? (
                                  <img src={record[field.key]} alt="Referral" className="w-8 h-8 object-cover rounded-lg border border-gray-200" />
                                ) : (
                                  <span className="text-gray-400 font-mono">—</span>
                                )
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-700 font-medium truncate max-w-[150px] inline-block" title={typeof record[field.key] === 'object' ? JSON.stringify(record[field.key]) : String(record[field.key] || '')}>
                                    {typeof record[field.key] === 'object' ? JSON.stringify(record[field.key]) : (record[field.key] || '—')}
                                  </span>
                                  {field.key === 'full_name' && isRecent && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 animate-bounce">
                                      <Sparkles size={8} className="animate-spin text-emerald-600" />
                                      <span>New Folder</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          ))}
                      
                      {/* Adjust and Delete Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {selectedEntity.id === 'Bed' && (record.status === 'available' || record.status === 'cleaning' || record.status === 'maintenance') && (
                            <button
                              onClick={() => {
                                // Pre-populate formData with the record details, and change status to 'occupied'
                                const recordData: Record<string, any> = {};
                                selectedEntity.fields.forEach((field) => {
                                  if (field.key === 'status') {
                                    recordData[field.key] = 'occupied';
                                  } else {
                                    recordData[field.key] = record[field.key] !== undefined && record[field.key] !== null ? String(record[field.key]) : '';
                                  }
                                });
                                // Set default admission date to current local date-time
                                const now = new Date();
                                const tzoffset = now.getTimezoneOffset() * 60000;
                                const localISOTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
                                recordData.admission_date = localISOTime;

                                setFormData(recordData);
                                setEditingRecordId(record.id);
                                setIsFormOpen(true);
                              }}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded text-[10px] font-bold transition-all inline-flex items-center gap-1 border border-emerald-100 mr-1 cursor-pointer"
                              title="Admit Patient to Bed"
                            >
                              <Check size={11} className="stroke-[3px]" />
                              <span>Admit</span>
                            </button>
                          )}
                          
                          {/* Dedicated Clinical Chart Button specifically for Patient entity */}
                          {selectedEntity.id === 'Patient' && (
                            <button
                              onClick={() => {
                                setSelectedPatientMrn(record.mrn);
                              }}
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded text-[10px] font-bold transition-all inline-flex items-center gap-1 border border-indigo-100 mr-1 cursor-pointer font-sans"
                              title="Open Patient Clinical Chart & Medications"
                            >
                              <ClipboardList size={11} />
                              <span>Clinical Chart</span>
                            </button>
                          )}

                          {/* Dedicated QR Button for ALL Schema Tables */}
                          <button
                            onClick={() => handlePresentQrCode(record, selectedEntity.id)}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded text-[10px] font-bold transition-all inline-flex items-center gap-1 border border-indigo-100 mr-1 cursor-pointer"
                            title={`Generate & View purpose-specific QR Badge for this ${selectedEntity.name} record`}
                          >
                            <QrCode size={11} />
                            <span>View QR</span>
                          </button>
                          
                          {/* Main Edit Button */}
                          <button
                            onClick={() => {
                              // Pre-populate formData with the record details
                              const recordData: Record<string, any> = {};
                              selectedEntity.fields.forEach((field) => {
                                if (field.type === 'array' || field.key === 'items' || field.key === 'services' || field.key === 'result_entries') {
                                  if (Array.isArray(record[field.key])) {
                                    recordData[field.key] = record[field.key];
                                  } else if (typeof record[field.key] === 'string' && record[field.key].trim()) {
                                    const str = record[field.key].trim();
                                    if (str.startsWith('[') && str.endsWith(']')) {
                                      try {
                                        recordData[field.key] = JSON.parse(str);
                                      } catch (e) {
                                        recordData[field.key] = str.split(',').map((x: any) => String(x).trim()).filter(Boolean);
                                      }
                                    } else {
                                      recordData[field.key] = str.split(',').map((x: any) => String(x).trim()).filter(Boolean);
                                    }
                                  } else {
                                    recordData[field.key] = [];
                                  }
                                } else if (field.type === 'checkbox') {
                                  recordData[field.key] = record[field.key] === true || String(record[field.key]) === 'true';
                                } else {
                                  recordData[field.key] = record[field.key] !== undefined && record[field.key] !== null ? String(record[field.key]) : '';
                                }
                              });
                              setFormData(recordData);
                              setEditingRecordId(record.id);
                              setIsFormOpen(true);
                            }}
                            className={`${
                              selectedEntity.id === 'Bed' 
                                ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100' 
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-100'
                            } px-2 py-1 rounded text-[10px] font-bold transition-all inline-flex items-center gap-1 border mr-1 cursor-pointer`}
                            title={`Edit ${selectedEntity.name} Details`}
                          >
                            <Edit size={11} />
                            <span>Edit</span>
                          </button>

                          {/* Main Delete Button */}
                          <button
                            onClick={() => handleDeleteRecord(record.id)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded text-[10px] font-bold transition-all inline-flex items-center gap-1 border border-rose-100 cursor-pointer"
                            title={`Delete ${selectedEntity.name} permanently`}
                          >
                            <Trash2 size={11} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                  <tr>
                    <td 
                      colSpan={
                        selectedEntity.id === 'ClinicalEncounter' 
                          ? 6 
                          : selectedEntity.id === 'Staff' 
                            ? 6 
                            : selectedEntity.id === 'Prescription' 
                              ? 7 
                              : selectedEntity.id === 'Form_1_1_1_a_1'
                                ? 10
                                : selectedEntity.fields.slice(0, 5).length + 1
                      } 
                      className="px-5 py-16 text-center text-gray-400"
                    >
                      <div className="mx-auto w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 mb-3 text-gray-400">
                        <Database size={18} />
                      </div>
                      <p className="font-semibold text-sm text-gray-700">No records found</p>
                      <p className="text-[11px] text-gray-400 max-w-sm mx-auto mt-1">
                        {selectedEntity.id === 'ClinicalEncounter' 
                          ? 'Get started by adding your first record.' 
                          : 'Use the "Add Record" button or click "Seed Table" to automatically generate realistic hospital records.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

      </div>

      {/* Interactive Ward QR Scanner Simulator Modal */}
      {isScannerModalOpen && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-md w-full overflow-hidden text-left animate-fadeIn">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-900/50 text-indigo-400 rounded-xl border border-indigo-800/40">
                  <QrCode size={18} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">Clinical QR Scanner Portal</h3>
                  <p className="text-[10px] text-slate-400">Verifies and processes QR codes across all EHR departments.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsScannerModalOpen(false);
                  setScannerSuccessMsg('');
                  setScannerSelectedItemId('');
                }}
                className="text-slate-400 hover:text-white bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/30 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Purpose Selector Tabs */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Select Scanner Purpose Mode:</span>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/50 text-[10px]">
                  <button
                    onClick={() => { setScannerMode('patient'); setScannerSelectedItemId(''); }}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${scannerMode === 'patient' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Patient ID
                  </button>
                  <button
                    onClick={() => { setScannerMode('staff'); setScannerSelectedItemId(''); }}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${scannerMode === 'staff' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Staff Badge
                  </button>
                  <button
                    onClick={() => { setScannerMode('user'); setScannerSelectedItemId(''); }}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${scannerMode === 'user' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    User Pass
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/50 text-[10px]">
                  <button
                    onClick={() => { setScannerMode('inpatient'); setScannerSelectedItemId(''); }}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${scannerMode === 'inpatient' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Inpatient Care QR
                  </button>
                  <button
                    onClick={() => { setScannerMode('outpatient'); setScannerSelectedItemId(''); }}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${scannerMode === 'outpatient' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Outpatient Care QR
                  </button>
                </div>
              </div>

              {/* Simulator/Real Camera Viewfinder */}
              <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center shadow-inner group">
                {/* Live Camera Feed */}
                {cameraPermissionGranted && !scannerSuccessMsg && (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  />
                )}

                {/* Secure Overlay HUD Target Frame */}
                {!scannerSuccessMsg && (
                  <div className="absolute inset-0 border-[3px] border-emerald-500/10 pointer-events-none z-10">
                    {/* Top-left corner bracket */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400"></div>
                    {/* Top-right corner bracket */}
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400"></div>
                    {/* Bottom-left corner bracket */}
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400"></div>
                    {/* Bottom-right corner bracket */}
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400"></div>

                    {/* Scanning guide target in the center */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-dashed border-emerald-400/40 rounded-xl flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
                    </div>
                  </div>
                )}
                
                {/* Laser scan line overlay (only if not success) */}
                {!scannerSuccessMsg && (
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-[bounce_2.5s_infinite] pointer-events-none z-10"></div>
                )}
                
                {scannerSuccessMsg ? (
                  <div className="text-center space-y-3 z-10 px-4 bg-slate-950/80 p-6 rounded-2xl border border-emerald-500/20 max-w-[85%]">
                    <div className="inline-flex h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 items-center justify-center border border-emerald-500/30 animate-pulse mx-auto">
                      <Check size={24} />
                    </div>
                    <p className="text-xs font-mono font-bold text-emerald-400 tracking-wide">{scannerSuccessMsg}</p>
                    <p className="text-[10px] text-slate-400">Record unlocked and automatically loaded into context.</p>
                  </div>
                ) : (
                  <div className="text-center space-y-2.5 z-10 bg-slate-950/70 p-4 rounded-xl border border-slate-900/60 max-w-[90%] select-none">
                    <QrCode size={32} className="mx-auto text-emerald-400 animate-pulse" />
                    <div>
                      <p className="text-[10px] font-mono text-slate-200 font-bold tracking-wider uppercase">
                        {scannerMode === 'patient' && "Align Unified Patient QR Code"}
                        {scannerMode === 'staff' && "Align Staff Clinical Badge QR"}
                        {scannerMode === 'user' && "Align Workspace User Access QR"}
                        {scannerMode === 'inpatient' && "Align Unified Patient QR (Inpatient)"}
                        {scannerMode === 'outpatient' && "Align Unified Patient QR (Outpatient)"}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {cameraPermissionGranted ? "Live Device Camera Active" : "Grabbing sandbox video channel..."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Lens / Device Info Tag */}
                <div className="absolute bottom-2.5 right-2.5 bg-slate-950/90 border border-slate-800/80 px-2 py-1 rounded-md text-[9px] font-mono font-bold text-slate-400 z-10 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${cameraPermissionGranted ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                  {cameraPermissionGranted ? 'LENS ACTIVE (60FPS)' : 'CAMERA SANDBOX'}
                </div>
              </div>

              {/* Real Camera controls and warning indicators */}
              {cameraError && (
                <div className="bg-amber-950/40 border border-amber-900/40 text-amber-300 p-3 rounded-xl text-[10px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Iframe Restriction Sandbox Notice
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Browser security policies may limit direct camera access inside nested applet previews. 
                    Emergency staff can use the secure physical emulator below to test any patient identity seamlessly.
                  </p>
                </div>
              )}

              {cameraDevices.length > 0 && (
                <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 text-[10px]">
                  <span className="text-slate-400 font-semibold">Select Input Device:</span>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 font-mono text-[9px] focus:outline-none focus:border-indigo-500"
                  >
                    {cameraDevices.map((device, idx) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dropdown selectors for mock scanning */}
              <div className="space-y-3.5 bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                    Simulate QR Scan:
                  </label>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {scannerMode === 'patient' && "Choose a registered Patient profile to scan their Universal QR."}
                    {scannerMode === 'staff' && "Choose a clinical Staff member to scan their shift badge."}
                    {scannerMode === 'user' && "Choose a registered User account to scan their workstation pass."}
                    {scannerMode === 'inpatient' && "Choose an active Admission record. Note: scans Patient's unified QR!"}
                    {scannerMode === 'outpatient' && "Choose an active Clinical Encounter. Note: scans Patient's unified QR!"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <select
                    value={scannerSelectedItemId}
                    onChange={(e) => setScannerSelectedItemId(e.target.value)}
                    disabled={!!scannerSuccessMsg}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">
                      -- Choose {scannerMode === 'patient' ? 'Patient' : scannerMode === 'staff' ? 'Staff Badge' : scannerMode === 'user' ? 'User Workstation' : scannerMode === 'inpatient' ? 'Inpatient Ward Record' : 'Outpatient Encounter'} --
                    </option>

                    {scannerMode === 'patient' && patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name || p.name} ({p.mrn})
                      </option>
                    ))}

                    {scannerMode === 'staff' && scannerStaffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.staff_id || 'STF-ID'}) - {s.role}
                      </option>
                    ))}

                    {scannerMode === 'user' && scannerUserList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email} ({u.role})
                      </option>
                    ))}

                    {scannerMode === 'inpatient' && scannerInpatientList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.patient_name || 'Patient'} ({a.patient_mrn}) - Ward: {a.ward || 'N/A'}
                      </option>
                    ))}

                    {scannerMode === 'outpatient' && scannerOutpatientList.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.patient_name || 'Patient'} ({e.patient_mrn}) - Clinic: {e.clinic || 'General OPD'}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleSimulateScan}
                    disabled={!scannerSelectedItemId || !!scannerSuccessMsg}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl border border-emerald-500 transition-colors select-none cursor-pointer"
                  >
                    Scan Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Clinical Details Modal */}
      {isDetailsModalOpen && selectedPatientForModal && (
        <PatientDetailsModal
          patient={selectedPatientForModal}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedPatientForModal(null);
          }}
        />
      )}

      {/* Patient Admission ID Card & QR Modal */}
      {isQrModalOpen && selectedPatientQr && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full overflow-hidden text-left animate-fadeIn">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg text-white ${
                  qrType === 'staff' ? 'bg-emerald-600' :
                  qrType === 'user' ? 'bg-slate-800' :
                  qrType === 'inpatient' ? 'bg-amber-600' :
                  qrType === 'outpatient' ? 'bg-sky-600' :
                  qrType === 'record' ? 'bg-purple-600' : 'bg-indigo-600'
                }`}>
                  <QrCode size={16} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-gray-950">
                    {qrType === 'staff' && 'Clinical Staff Identity Badge'}
                    {qrType === 'user' && 'User Access Workspace Pass'}
                    {qrType === 'inpatient' && 'Inpatient Care QR Badge'}
                    {qrType === 'outpatient' && 'Outpatient Care QR Badge'}
                    {qrType === 'record' && 'Database Ledger Audit Record'}
                    {qrType === 'patient' && 'Patient Admission ID Card'}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Purpose: {qrPurpose}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsQrModalOpen(false);
                  setSelectedPatientQr(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* ID Card Box layout */}
              <div className={`border rounded-2xl p-5 bg-gradient-to-br shadow-sm relative overflow-hidden ${
                qrType === 'staff' ? 'border-emerald-300 from-slate-50 via-white to-emerald-50/10' :
                qrType === 'user' ? 'border-slate-300 from-slate-50 via-white to-slate-100/30' :
                qrType === 'inpatient' ? 'border-amber-300 from-slate-50 via-white to-amber-50/10' :
                qrType === 'outpatient' ? 'border-sky-300 from-slate-50 via-white to-sky-50/10' :
                qrType === 'record' ? 'border-purple-300 from-slate-50 via-white to-purple-50/10' :
                'border-slate-300 from-slate-50 via-white to-indigo-50/10'
              }`}>
                {/* Decorative clinic stripe */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${
                  qrType === 'staff' ? 'bg-emerald-600' :
                  qrType === 'user' ? 'bg-slate-800' :
                  qrType === 'inpatient' ? 'bg-amber-600' :
                  qrType === 'outpatient' ? 'bg-sky-600' :
                  qrType === 'record' ? 'bg-purple-600' : 'bg-indigo-600'
                }`}></div>

                <div className="flex justify-between items-start gap-4 pt-1.5">
                  <div className="space-y-3 flex-1">
                    <div>
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest block leading-none ${
                        qrType === 'staff' ? 'text-emerald-600' :
                        qrType === 'user' ? 'text-slate-600' :
                        qrType === 'inpatient' ? 'text-amber-600' :
                        qrType === 'outpatient' ? 'text-sky-600' :
                        qrType === 'record' ? 'text-purple-600' : 'text-indigo-600'
                      }`}>
                        {qrType === 'staff' ? 'Hospital' :
                         qrType === 'user' ? 'EHR Workspace Access' :
                         qrType === 'inpatient' ? 'EHR Inpatient Ward' :
                         qrType === 'outpatient' ? 'EHR Outpatient Clinic' :
                         qrType === 'record' ? 'EHR Data Ledger' : 'Hospital EHR Node'}
                      </span>
                      <h4 className="text-sm font-extrabold text-gray-900 tracking-tight mt-0.5 truncate max-w-[180px]">
                        {selectedPatientQr.full_name || selectedPatientQr.name || selectedPatientQr.email || 'Registration Record'}
                      </h4>
                    </div>

                    {/* Conditional layouts based on qrType */}
                    {qrType === 'staff' ? (
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">Department:</span>
                          <span className="font-semibold text-gray-800 uppercase">{selectedPatientQr.department || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">Credential:</span>
                          <span className="font-semibold text-gray-800 uppercase">{selectedPatientQr.credential || 'MD'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">Role:</span>
                          <span className="font-semibold text-gray-800 capitalize">{selectedPatientQr.role || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">Shift Shift:</span>
                          <span className="font-semibold text-gray-800 capitalize">{selectedPatientQr.shift || 'on_call'}</span>
                        </div>
                      </div>
                    ) : qrType === 'user' ? (
                      <div className="grid grid-cols-1 gap-y-2 text-[10px]">
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">E-mail address:</span>
                          <span className="font-mono font-semibold text-gray-800">{selectedPatientQr.email || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">Security Role:</span>
                          <span className="font-semibold text-gray-800 capitalize bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded inline-block mt-0.5">{selectedPatientQr.role || 'user'}</span>
                        </div>
                      </div>
                    ) : qrType === 'record' ? (
                      <div className="grid grid-cols-1 gap-y-2 text-[10px]">
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">Record ID / Hash:</span>
                          <span className="font-mono font-semibold text-gray-800 break-all">{selectedPatientQr.id || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">System Timestamp:</span>
                          <span className="font-semibold text-gray-800 font-mono">{new Date().toLocaleString()}</span>
                        </div>
                      </div>
                    ) : (
                      /* Patient, Inpatient, Outpatient Layouts (Shared single QR data representation) */
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">Gender:</span>
                          <span className="font-semibold text-gray-800 capitalize">{selectedPatientQr.gender || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">Blood Group:</span>
                          <span className="font-semibold text-gray-800 uppercase">{selectedPatientQr.blood_group || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">DOB:</span>
                          <span className="font-semibold text-gray-800">{selectedPatientQr.date_of_birth || selectedPatientQr.dob || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px]">CBHI Status:</span>
                          <span className={`inline-flex items-center text-[8px] font-extrabold px-1.5 rounded-md border capitalize leading-tight ${
                            selectedPatientQr.cbhi_status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                              : 'bg-gray-50 text-gray-400 border-gray-100'
                          }`}>
                            {selectedPatientQr.cbhi_status || 'none'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Bottom identity tag */}
                    {qrType !== 'user' && qrType !== 'record' && (
                      <div className="pt-1.5">
                        <span className="text-gray-400 block uppercase font-bold tracking-wider text-[8px] leading-none mb-1">
                          {qrType === 'staff' ? 'Authorized Staff Code:' : 'Universal Patient ID / MRN:'}
                        </span>
                        <div className="flex gap-1.5 items-center">
                          <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded border ${
                            qrType === 'staff' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                          }`}>
                            {selectedPatientQr.staff_id || selectedPatientQr.mrn || `MRN-${selectedPatientQr.id?.slice(0, 4).toUpperCase() || 'EHR'}`}
                          </span>
                          <span className="font-mono text-[9px] font-semibold text-gray-500">
                            {selectedPatientQr.staff_id || selectedPatientQr.mrn || '—'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* QR Image Frame */}
                  <div className="flex flex-col items-center gap-1 shrink-0 bg-white p-2 border border-slate-200 rounded-xl shadow-xs">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${
                        qrType === 'staff' ? (selectedPatientQr.staff_id || selectedPatientQr.id) :
                        qrType === 'user' ? (selectedPatientQr.email || selectedPatientQr.id) :
                        qrType === 'record' ? selectedPatientQr.id :
                        (selectedPatientQr.mrn || selectedPatientQr.id)
                      }`} 
                      alt="EHR QR Badge" 
                      className="w-[110px] h-[110px]"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[8px] font-mono font-extrabold text-gray-400 uppercase text-center w-[110px] tracking-tight">
                      {qrType === 'staff' && 'clinical staff'}
                      {qrType === 'user' && 'secure terminal'}
                      {qrType === 'inpatient' && 'ward admission'}
                      {qrType === 'outpatient' && 'opd consult'}
                      {qrType === 'record' && 'audit verify'}
                      {qrType === 'patient' && 'scan to admit'}
                    </span>
                  </div>
                </div>

                {/* Secure clinical watermark tag */}
                <div className="border-t border-slate-150 mt-4 pt-3 flex justify-between items-center text-[9px]">
                  <div className="text-slate-400 flex items-center gap-1 font-medium">
                    <Check size={10} className="text-emerald-500" />
                    <span>Authorized EHR Seal</span>
                  </div>
                  <span className="text-slate-500 font-mono font-semibold">{selectedPatientQr.phone || selectedPatientQr.email || 'Verified Badge'}</span>
                </div>
              </div>

              {/* Integration alert feedback */}
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[11px] text-slate-700 leading-relaxed text-left flex gap-2">
                <Info size={16} className="shrink-0 text-slate-400 mt-0.5" />
                <span>
                  {qrType === 'staff' && 'This credential badge allows medical staff members to check in for duty shifts at Clinical Terminals securely.'}
                  {qrType === 'user' && 'This workspace workstation pass secures EHR database entry audits under authorized credentials.'}
                  {qrType === 'inpatient' && 'This unified patient QR is being checked for inpatient hospitalizations. Staff can manage bed assignments instantly.'}
                  {qrType === 'outpatient' && 'This unified patient QR code is used for ambulatory follow-ups and diagnostic order routing.'}
                  {qrType === 'record' && 'This database row QR carries cryptographic ledger tokens to assert clinical data integrity.'}
                  {qrType === 'patient' && 'This QR identity card is persistent in the EHR database. Administrative and nursing staff can read this card using any standard device camera.'}
                </span>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2.5">
              <button 
                onClick={() => alert(`ID Badge queued for printing: ${selectedPatientQr.full_name || selectedPatientQr.name || selectedPatientQr.email || 'EHR Document'}.`)}
                className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-100 text-gray-700 bg-white transition-colors py-2 px-4 rounded-xl text-xs font-bold shadow-xs select-none cursor-pointer"
              >
                <Printer size={13} />
                <span>Print ID Card</span>
              </button>
              <button 
                onClick={() => {
                  setIsQrModalOpen(false);
                  setSelectedPatientQr(null);
                }}
                className={`text-white transition-colors py-2 px-4 rounded-xl text-xs font-bold shadow-xs select-none cursor-pointer ${
                  qrType === 'staff' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  qrType === 'user' ? 'bg-slate-800 hover:bg-slate-900' :
                  qrType === 'inpatient' ? 'bg-amber-600 hover:bg-amber-700' :
                  qrType === 'outpatient' ? 'bg-sky-600 hover:bg-sky-700' :
                  'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Modal Form for Adding Database Records */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setFormData({});
                    setEditingRecordId(null);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:text-gray-950 bg-gray-100 hover:bg-gray-200 border border-gray-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-3xs"
                  title="Back to Data & Explorer"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Data & Explorer</span>
                </button>
                <div className="h-5 w-px bg-gray-200" />
                <div className="p-1.5 bg-gray-950 text-white rounded shadow-sm">
                  {React.createElement(selectedEntity.icon, { size: 16 })}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                    {editingRecordId ? `Edit ${selectedEntity.name}` : `Add New ${selectedEntity.name}`}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-medium font-mono uppercase tracking-widest">{selectedEntityId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {['Form_1_1_1', 'Form_1_1_1_0', 'Form_1_1_1_1'].includes(selectedEntity.id) && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...formData };
                      selectedEntity.fields.forEach(f => {
                        if (f.required && (updated[f.key] === undefined || updated[f.key] === null || updated[f.key] === '')) {
                          if (f.type === 'number') updated[f.key] = 0;
                          else if (f.type === 'select' && f.options) updated[f.key] = f.options[0];
                          else updated[f.key] = 'N/A';
                        }
                      });
                      setFormData(updated);
                      setTimeout(() => {
                        const form = document.querySelector('form[data-main-form="true"]') as HTMLFormElement;
                        if (form) form.requestSubmit();
                      }, 100);
                    }}
                    className="flex items-center gap-1.5 text-xs font-black px-3.5 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all shadow-3xs cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>Fast Save & Next</span>
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setFormData({});
                    setEditingRecordId(null);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 bg-white border border-gray-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-3xs"
                >
                  <X size={14} />
                  <span>Cancel</span>
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const form = document.querySelector('form[data-main-form="true"]') as HTMLFormElement;
                    if (form) form.requestSubmit();
                  }}
                  className="flex items-center gap-1.5 text-xs font-black bg-gray-950 text-white hover:bg-gray-800 px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Check size={14} />
                  <span>Submit Data</span>
                </button>
              </div>
            </div>
            
            <form data-main-form="true" onSubmit={handleAddRecord} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed font-semibold whitespace-pre-wrap">{formError}</div>
                  </div>
                )}
                {selectedEntity.fields.map((field) => {
                  // Hide patient-related fields if status is not 'occupied' for Bed entity
                  if (selectedEntity.id === 'Bed' && 
                      ['patient_mrn', 'patient_name', 'admission_date', 'expected_discharge', 'attending_physician'].includes(field.key) && 
                      formData.status !== 'occupied') {
                    return null;
                  }

                  if (selectedEntity.id === 'Admission' && 
                      ['actual_discharge', 'discharge_summary'].includes(field.key) && 
                      formData.status !== 'Discharged') {
                    return null;
                  }

                  return (
                    <div key={field.key} className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-500">
                        {field.label}
                      </label>
                      
                      {field.type === 'select' && field.options ? (
                        <select
                          value={formData[field.key] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                              const updated = { ...prev, [field.key]: val };
                              // Handle patient details and default date on status change for Bed
                              if (selectedEntity.id === 'Bed' && field.key === 'status') {
                                if (val !== 'occupied') {
                                  delete updated['patient_mrn'];
                                  delete updated['patient_name'];
                                  delete updated['admission_date'];
                                  delete updated['expected_discharge'];
                                  delete updated['attending_physician'];
                                } else {
                                  // Set default admission date to current local date-time (YYYY-MM-DDTHH:MM)
                                  const now = new Date();
                                  const tzoffset = now.getTimezoneOffset() * 60000;
                                  const localISOTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
                                  updated['admission_date'] = localISOTime;
                                }
                              }

                              if (selectedEntity.id === 'Admission' && field.key === 'status') {
                                if (val !== 'Discharged') {
                                  delete updated['actual_discharge'];
                                  delete updated['discharge_summary'];
                                } else {
                                  const now = new Date();
                                  const tzoffset = now.getTimezoneOffset() * 60000;
                                  const localISOTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
                                  updated['actual_discharge'] = localISOTime;
                                }
                              }
                              return updated;
                            });
                          }}
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-shadow"
                          required={field.required}
                        >
                          <option value=""></option>
                          {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'date' ? (
                      <div className="relative">
                        <input
                          type="date"
                          placeholder={field.placeholder || "Pick a date"}
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-shadow bg-white text-left"
                          required={field.required}
                        />
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    ) : field.type === 'date-time' ? (
                      <div className="relative">
                        <input
                          type="datetime-local"
                          placeholder={field.placeholder || "Pick a date and time"}
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-shadow bg-white text-left"
                          required={field.required}
                        />
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    ) : field.type === 'number' ? (
                      <input
                        type="number"
                        step="any"
                        placeholder={field.placeholder}
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-shadow"
                        required={field.required}
                      />
                    ) : field.type === 'items' ? (
                      <div className="border border-gray-150 rounded-lg p-3 space-y-3 bg-gray-50/40">
                        {/* Current list of items */}
                        <div className="space-y-1.5">
                          {((Array.isArray(formData[field.key]) ? formData[field.key] : []) as any[]).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded-lg shadow-sm">
                              <div className="text-[11px] text-gray-700 leading-normal">
                                <span className="font-semibold text-purple-700">{item.drug}</span> - {item.dose} ({item.frequency}, {item.duration})
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                  setFormData(prev => ({
                                    ...prev,
                                    [field.key]: current.filter((_, i) => i !== idx)
                                  }));
                                }}
                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-colors text-[10px] font-bold"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          {(!formData[field.key] || formData[field.key].length === 0) && (
                            <p className="text-[10px] text-gray-400 italic">No medication items added yet.</p>
                          )}
                        </div>

                        {/* Sub-inputs form */}
                        <div className="border-t border-gray-150 pt-3 space-y-2.5">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Add Medication Item</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Drug Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Ibuprofen"
                                value={itemDrug}
                                onChange={(e) => setItemDrug(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Dose</label>
                              <input
                                type="text"
                                placeholder="e.g. 400mg"
                                value={itemDose}
                                onChange={(e) => setItemDose(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Frequency</label>
                              <input
                                type="text"
                                placeholder="e.g. Every 8 hours"
                                value={itemFreq}
                                onChange={(e) => setItemFreq(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Duration</label>
                              <input
                                type="text"
                                placeholder="e.g. 5 days"
                                value={itemDur}
                                onChange={(e) => setItemDur(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={!itemDrug}
                            onClick={() => {
                              if (!itemDrug) return;
                              const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                              setFormData(prev => ({
                                ...prev,
                                [field.key]: [...current, { drug: itemDrug, dose: itemDose, frequency: itemFreq, duration: itemDur }]
                              }));
                              setItemDrug('');
                              setItemDose('');
                              setItemFreq('');
                              setItemDur('');
                            }}
                            className="w-full py-1.5 bg-gray-150 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            + Add Item
                          </button>
                        </div>
                      </div>
                    ) : field.type === 'array' ? (
                      field.key === 'services' ? (
                        <div className="border border-gray-150 rounded-lg p-3 space-y-3 bg-gray-50/40">
                          {/* Current list of services */}
                          <div className="space-y-1.5">
                            {((Array.isArray(formData[field.key]) ? formData[field.key] : []) as any[]).map((service, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded-lg shadow-sm">
                                <div className="text-[11px] text-gray-700 leading-normal">
                                  <span className="font-semibold text-emerald-700">[{service.service_type || 'service'}]</span> {service.description} ({service.amount || 0} ETB)
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                    setFormData(prev => ({
                                      ...prev,
                                      [field.key]: current.filter((_, i) => i !== idx)
                                    }));
                                  }}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-colors text-[10px] font-bold"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            {(!formData[field.key] || formData[field.key].length === 0) && (
                              <p className="text-[10px] text-gray-400 italic">No services added yet.</p>
                            )}
                          </div>

                          {/* Sub-inputs form */}
                          <div className="border-t border-gray-150 pt-3 space-y-2.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Add Claim Service</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Service Type</label>
                                <select
                                  value={serviceType}
                                  onChange={(e) => setServiceType(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                                >
                                  <option value="">Select...</option>
                                  <option value="consultation">Consultation</option>
                                  <option value="laboratory">Laboratory</option>
                                  <option value="pharmacy">Pharmacy</option>
                                  <option value="radiology">Radiology</option>
                                  <option value="ward_admission">Ward Admission</option>
                                  <option value="procedure">Procedure</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Description</label>
                                <input
                                  type="text"
                                  placeholder="e.g. OPD visit"
                                  value={serviceDesc}
                                  onChange={(e) => setServiceDesc(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Amount (ETB)</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 100"
                                  value={serviceAmount}
                                  onChange={(e) => setServiceAmount(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={!serviceType || !serviceAmount}
                              onClick={() => {
                                if (!serviceType || !serviceAmount) return;
                                const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                setFormData(prev => ({
                                  ...prev,
                                  [field.key]: [...current, { service_type: serviceType, description: serviceDesc, amount: Number(serviceAmount) }]
                                }));
                                setServiceType('');
                                setServiceDesc('');
                                setServiceAmount('');
                              }}
                              className="w-full py-1.5 bg-gray-150 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              + Add Item
                            </button>
                          </div>
                        </div>
                      ) : field.key === 'result_entries' ? (
                        <div className="border border-gray-150 rounded-lg p-3 space-y-3 bg-gray-50/40">
                          {/* Current list of entries */}
                          <div className="space-y-1.5">
                            {((Array.isArray(formData[field.key]) ? formData[field.key] : []) as any[]).map((entry, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded-lg shadow-sm">
                                <div className="text-[11px] text-gray-700 leading-normal">
                                  <span className="font-semibold text-blue-700">{entry.parameter}</span>: {entry.value} {entry.unit} <span className="text-gray-400">({entry.reference_range})</span> {entry.flag && <span className={`text-[10px] font-semibold px-1 rounded ml-1 ${entry.flag === 'normal' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{entry.flag}</span>}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                    setFormData(prev => ({
                                      ...prev,
                                      [field.key]: current.filter((_, i) => i !== idx)
                                    }));
                                  }}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-colors text-[10px] font-bold"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            {(!formData[field.key] || formData[field.key].length === 0) && (
                              <p className="text-[10px] text-gray-400 italic">No result entries added yet.</p>
                            )}
                          </div>

                          {/* Sub-inputs form */}
                          <div className="border-t border-gray-150 pt-3 space-y-2.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Add Lab Result Entry</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Parameter</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Hb"
                                  value={entryParam}
                                  onChange={(e) => setEntryParam(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Value</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 13.5"
                                  value={entryVal}
                                  onChange={(e) => setEntryVal(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Unit</label>
                                <input
                                  type="text"
                                  placeholder="e.g. g/dL"
                                  value={entryUnit}
                                  onChange={(e) => setEntryUnit(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Reference Range</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 12.0-16.0"
                                  value={entryRef}
                                  onChange={(e) => setEntryRef(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Flag</label>
                                <select
                                  value={entryFlag}
                                  onChange={(e) => setEntryFlag(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
                                >
                                  <option value="normal">Normal</option>
                                  <option value="high">High</option>
                                  <option value="low">Low</option>
                                  <option value="critical">Critical</option>
                                </select>
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={!entryParam || !entryVal}
                              onClick={() => {
                                if (!entryParam || !entryVal) return;
                                const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                setFormData(prev => ({
                                  ...prev,
                                  [field.key]: [...current, { parameter: entryParam, value: entryVal, unit: entryUnit, reference_range: entryRef, flag: entryFlag }]
                                }));
                                setEntryParam('');
                                setEntryVal('');
                                setEntryUnit('');
                                setEntryRef('');
                                setEntryFlag('normal');
                              }}
                              className="w-full py-1.5 bg-gray-150 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              + Add Item
                            </button>
                          </div>
                        </div>
                      ) : field.key === 'channels_sent' ? (
                        <div className="space-y-2 border border-gray-150 rounded-lg p-3 bg-gray-50/40">
                          <div className="flex flex-wrap gap-1.5">
                            {['in_app', 'sms', 'email'].map((ch) => {
                              const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                              const active = current.includes(ch);
                              return (
                                <button
                                  key={ch}
                                  type="button"
                                  onClick={() => {
                                    const updated = active ? current.filter((x: string) => x !== ch) : [...current, ch];
                                    setFormData(prev => ({ ...prev, [field.key]: updated }));
                                  }}
                                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all border flex items-center gap-1.5 ${
                                    active 
                                      ? 'bg-purple-900 text-white border-purple-950 font-bold shadow-sm' 
                                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                                  }`}
                                >
                                  <span>{active ? '✓' : '+'}</span>
                                  <span>{ch}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : field.key === 'target_roles' ? (
                        <div className="border border-gray-150 rounded-lg p-3 space-y-2.5 bg-gray-50/40">
                          <div className="flex flex-wrap gap-1">
                            {((Array.isArray(formData[field.key]) ? formData[field.key] : []) as any[]).map((role, idx) => (
                              <span key={idx} className="bg-white border border-gray-200 text-gray-700 text-[11px] px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-sm">
                                <span>{role}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                    setFormData(prev => ({
                                      ...prev,
                                      [field.key]: current.filter((_, i) => i !== idx)
                                    }));
                                  }}
                                  className="text-gray-400 hover:text-rose-500 font-bold ml-1"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            {(!formData[field.key] || formData[field.key].length === 0) && (
                              <span className="text-[10px] text-gray-400 italic">No target roles specified yet.</span>
                            )}
                          </div>

                          <div className="flex gap-1.5 pt-1.5 border-t border-gray-150">
                            <input
                              type="text"
                              placeholder="e.g. physician"
                              value={newTargetRole}
                              onChange={(e) => setNewTargetRole(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (!newTargetRole.trim()) return;
                                  const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                  if (!current.includes(newTargetRole.trim())) {
                                    setFormData(prev => ({ ...prev, [field.key]: [...current, newTargetRole.trim()] }));
                                  }
                                  setNewTargetRole('');
                                }
                              }}
                              className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:border-gray-400"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!newTargetRole.trim()) return;
                                const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                if (!current.includes(newTargetRole.trim())) {
                                  setFormData(prev => ({ ...prev, [field.key]: [...current, newTargetRole.trim()] }));
                                }
                                setNewTargetRole('');
                              }}
                              className="bg-gray-900 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-800 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[9px] font-bold text-gray-400 self-center uppercase tracking-wider">Suggested:</span>
                            {['physician', 'nurse', 'pharmacist', 'lab_tech', 'admin'].map(r => {
                              const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                              if (current.includes(r)) return null;
                              return (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, [field.key]: [...current, r] }));
                                  }}
                                  className="text-[10px] bg-white border border-gray-200 text-gray-500 hover:border-gray-400 px-2 py-0.5 rounded transition-colors"
                                >
                                  + {r}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : field.key === 'allergies' ? (
                        <div className="border border-gray-150 rounded-lg p-3 space-y-2.5 bg-gray-50/40">
                          <div className="flex flex-wrap gap-1">
                            {((Array.isArray(formData[field.key]) ? formData[field.key] : []) as any[]).map((allergy, idx) => (
                              <span key={idx} className="bg-rose-50 border border-rose-100 text-rose-700 text-[11px] px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-sm">
                                <span>{allergy}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                    setFormData(prev => ({
                                      ...prev,
                                      [field.key]: current.filter((_, i) => i !== idx)
                                    }));
                                  }}
                                  className="text-rose-400 hover:text-rose-600 font-bold ml-1"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            {(!formData[field.key] || formData[field.key].length === 0) && (
                              <span className="text-[10px] text-gray-400 italic">No allergies recorded.</span>
                            )}
                          </div>

                          <div className="flex gap-1.5 pt-1.5 border-t border-gray-150">
                            <input
                              type="text"
                              placeholder="e.g. penicillin"
                              value={newAllergy}
                              onChange={(e) => setNewAllergy(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (!newAllergy.trim()) return;
                                  const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                  if (!current.includes(newAllergy.trim())) {
                                    setFormData(prev => ({ ...prev, [field.key]: [...current, newAllergy.trim()] }));
                                  }
                                  setNewAllergy('');
                                }
                              }}
                              className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:border-gray-400"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!newAllergy.trim()) return;
                                const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                if (!current.includes(newAllergy.trim())) {
                                  setFormData(prev => ({ ...prev, [field.key]: [...current, newAllergy.trim()] }));
                                }
                                setNewAllergy('');
                              }}
                              className="bg-gray-900 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-800 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[9px] font-bold text-gray-400 self-center uppercase tracking-wider">Suggested:</span>
                            {['penicillin', 'peanuts', 'sulfa_drugs', 'aspirin', 'latex', 'shellfish'].map(a => {
                              const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                              if (current.includes(a)) return null;
                              return (
                                <button
                                  key={a}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, [field.key]: [...current, a] }));
                                  }}
                                  className="text-[10px] bg-white border border-gray-200 text-gray-500 hover:border-gray-400 px-2 py-0.5 rounded transition-colors"
                                >
                                  + {a}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : field.key === 'chronic_conditions' ? (
                        <div className="border border-gray-150 rounded-lg p-3 space-y-2.5 bg-gray-50/40">
                          <div className="flex flex-wrap gap-1">
                            {((Array.isArray(formData[field.key]) ? formData[field.key] : []) as any[]).map((cond, idx) => (
                              <span key={idx} className="bg-amber-50 border border-amber-100 text-amber-700 text-[11px] px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-sm">
                                <span>{cond}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                    setFormData(prev => ({
                                      ...prev,
                                      [field.key]: current.filter((_, i) => i !== idx)
                                    }));
                                  }}
                                  className="text-amber-400 hover:text-amber-600 font-bold ml-1"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            {(!formData[field.key] || formData[field.key].length === 0) && (
                              <span className="text-[10px] text-gray-400 italic">No chronic conditions recorded.</span>
                            )}
                          </div>

                          <div className="flex gap-1.5 pt-1.5 border-t border-gray-150">
                            <input
                              type="text"
                              placeholder="e.g. diabetes"
                              value={newCondition}
                              onChange={(e) => setNewCondition(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (!newCondition.trim()) return;
                                  const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                  if (!current.includes(newCondition.trim())) {
                                    setFormData(prev => ({ ...prev, [field.key]: [...current, newCondition.trim()] }));
                                  }
                                  setNewCondition('');
                                }
                              }}
                              className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:border-gray-400"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!newCondition.trim()) return;
                                const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                                if (!current.includes(newCondition.trim())) {
                                  setFormData(prev => ({ ...prev, [field.key]: [...current, newCondition.trim()] }));
                                }
                                setNewCondition('');
                              }}
                              className="bg-gray-950 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-800 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[9px] font-bold text-gray-400 self-center uppercase tracking-wider">Suggested:</span>
                            {['diabetes', 'hypertension', 'asthma', 'copd', 'hiv_aids', 'chronic_kidney_disease'].map(c => {
                              const current = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                              if (current.includes(c)) return null;
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, [field.key]: [...current, c] }));
                                  }}
                                  className="text-[10px] bg-white border border-gray-200 text-gray-500 hover:border-gray-400 px-2 py-0.5 rounded transition-colors"
                                >
                                  + {c}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <textarea
                          placeholder={field.placeholder || 'e.g. ["value1", "value2"]'}
                          value={typeof formData[field.key] === 'string' ? formData[field.key] : JSON.stringify(formData[field.key] || [])}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-shadow bg-white text-gray-700"
                          rows={3}
                          required={field.required}
                        />
                      )
                    ) : (field.type === 'camera' || field.key === 'referral_image' || field.key === 'referral_paper') ? (
                      <div className="space-y-3 bg-gray-50/50 border border-gray-150 p-3 rounded-xl">
                        {/* Selector/Box for "if patient have" and "if no add no selected box" */}
                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, [field.key]: 'No' }));
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              formData[field.key] === 'No' || !formData[field.key]
                                ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-3xs'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            No Referral Paper
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              // Only change if current state is 'No' or empty
                              if (formData[field.key] === 'No' || !formData[field.key]) {
                                setFormData(prev => ({ ...prev, [field.key]: '' }));
                              }
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              formData[field.key] && formData[field.key] !== 'No'
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-3xs'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            Yes, Capture / Upload
                          </button>
                        </div>

                        {/* When "Yes" is selected */}
                        {formData[field.key] !== 'No' && (
                          <div className="space-y-2.5 pt-2.5 border-t border-gray-100">
                            <div className="flex flex-col sm:flex-row gap-2">
                              {/* Capture from Camera button */}
                              <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-950 rounded-xl transition-all shadow-3xs text-xs font-black cursor-pointer">
                                <Camera size={14} className="text-indigo-500" />
                                <span>Capture Camera</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
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
                                            setFormData(prev => ({ ...prev, [field.key]: dataUrl }));
                                          } else {
                                            setFormData(prev => ({ ...prev, [field.key]: reader.result as string }));
                                          }
                                        };
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>

                              {/* Upload File button */}
                              <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-950 rounded-xl transition-all shadow-3xs text-xs font-black cursor-pointer">
                                <Upload size={14} className="text-purple-500" />
                                <span>Upload Attached File</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
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
                                            setFormData(prev => ({ ...prev, [field.key]: dataUrl }));
                                          } else {
                                            setFormData(prev => ({ ...prev, [field.key]: reader.result as string }));
                                          }
                                        };
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            </div>

                            {/* Image Preview & Status */}
                            {formData[field.key] && formData[field.key] !== 'No' ? (
                              <div className="relative border border-dashed border-gray-200 rounded-lg p-2 bg-white flex flex-col items-center gap-2">
                                <img
                                  src={formData[field.key]}
                                  alt="Referral Paper"
                                  className="max-h-40 object-contain rounded-md shadow-xs"
                                />
                                <div className="flex items-center gap-2 w-full justify-between px-1">
                                  <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                                    <Check size={12} />
                                    Referral Paper Attached
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, [field.key]: '' }))}
                                    className="text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors"
                                  >
                                    Clear Image
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="border border-dashed border-gray-200 rounded-lg py-5 px-3 bg-white text-center">
                                <p className="text-[11px] text-gray-400 font-medium">No referral file attached yet.</p>
                                <p className="text-[10px] text-gray-400">Capture with camera or upload above.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        placeholder={field.placeholder}
                        value={typeof formData[field.key] === 'object' ? JSON.stringify(formData[field.key]) : formData[field.key] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-shadow bg-white text-gray-700"
                        rows={3}
                        required={field.required}
                      />
                    ) : field.type === 'checkbox' ? (
                      <div className="flex items-center gap-2.5 py-1">
                        <input
                          id={`checkbox-${field.key}`}
                          type="checkbox"
                          checked={formData[field.key] === true || formData[field.key] === 'true'}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.checked }))}
                          className="h-4.5 w-4.5 rounded border-gray-300 text-gray-900 focus:ring-gray-950 cursor-pointer"
                        />
                        <span className="text-[11px] text-gray-400 font-mono italic">(Check to activate)</span>
                      </div>
                    ) : (
                      selectedEntity.id === 'Bed' && field.key === 'patient_mrn' ? (
                        <select
                          value={formData.patient_mrn || ''}
                          onChange={(e) => {
                            const selectedMrn = e.target.value;
                            const matchedPatient = patients.find(p => p.mrn === selectedMrn);
                            setFormData(prev => ({
                              ...prev,
                              patient_mrn: selectedMrn,
                              patient_name: matchedPatient ? matchedPatient.full_name : ''
                            }));
                          }}
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-shadow"
                          required={field.required}
                        >
                          <option value="">-- Select Patient --</option>
                          {patients.map(p => (
                            <option key={p.id} value={p.mrn}>
                              {p.full_name} ({p.mrn})
                            </option>
                          ))}
                        </select>
                      ) : selectedEntity.id === 'Bed' && field.key === 'patient_name' ? (
                        <input
                          type="text"
                          placeholder="Select patient above to populate"
                          value={formData.patient_name || ''}
                          disabled
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder={field.placeholder}
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-shadow bg-white"
                          required={field.required}
                        />
                      )
                    )}
                  </div>
                )})}
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setFormData({});
                    setEditingRecordId(null);
                  }}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schema Editor Slide-over Panel */}
      {isSchemaOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-gray-100 animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSchemaOpen(false)}
                  className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-all"
                  title="Back to Data & Explorer"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <div className="h-4 w-px bg-gray-200 mx-1" />
                <Settings2 size={18} className="text-gray-700" />
                <h3 className="text-base font-extrabold text-gray-900">Schema Editor</h3>
              </div>
              <button 
                onClick={() => setIsSchemaOpen(false)}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all"
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <p className="text-xs text-gray-500">
                Current data model schema definition for <strong className="text-gray-900">{selectedEntity.name}</strong>.
              </p>
              
              <div className="space-y-4">
                {selectedEntity.fields.map((field) => (
                  <div key={field.key} className="p-3 bg-gray-50 border border-gray-100 rounded-lg space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-xs font-bold text-gray-900">{field.key}</span>
                      <span className="text-[10px] text-gray-500 font-semibold bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                        ({field.type === 'number' ? 'number' : field.type === 'date-time' ? 'date-time' : field.type === 'checkbox' ? 'boolean' : 'text'}
                        {field.required ? ', required' : ''})
                      </span>
                    </div>
                    
                    {field.placeholder && (
                      <div className="text-[11px] text-gray-500 leading-relaxed font-sans mt-0.5">
                        {field.placeholder}
                      </div>
                    )}
                    
                    {field.defaultValue !== undefined && (
                      <div className="text-[10px] text-gray-500 font-medium">
                        Default: <span className="font-mono text-gray-800">{field.type === 'checkbox' ? String(field.defaultValue) : `"${field.defaultValue}"`}</span>
                      </div>
                    )}

                    {field.options && field.options.length > 0 && (
                      <div className="text-[10px] text-gray-500 font-medium leading-relaxed">
                        Options: <span className="font-mono text-gray-800">{field.options.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Schema / Data Dictionary Modal */}
      {isGlobalSchemaOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[60] overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gray-950 text-white rounded-xl shadow-md">
                  <Database size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">EHR Data Dictionary</h3>
                  <p className="text-[11px] text-gray-500 font-bold">Enterprise Health Record System Schema Overview • 160 Total Collections</p>
                </div>
              </div>
              <button 
                onClick={() => setIsGlobalSchemaOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar space-y-6">
              {/* Search and Quick Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <div className="relative w-full sm:w-80">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search 160 collections, fields, or keys..."
                    value={schemaSearchQuery}
                    onChange={(e) => setSchemaSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white text-xs font-bold text-gray-800 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  {schemaSearchQuery && (
                    <button onClick={() => setSchemaSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600">✕</button>
                  )}
                </div>

                <div className="text-xs text-gray-500 font-medium self-end sm:self-center">
                  Showing <span className="font-mono font-bold text-gray-900">
                    {[...ENTITIES_ORDER].filter(id => {
                      const entity = ENTITIES_CONFIG[id];
                      if (!entity) return false;
                      if (!schemaSearchQuery.trim()) return true;
                      const q = schemaSearchQuery.toLowerCase();
                      return entity.name.toLowerCase().includes(q) || 
                             entity.collectionName.toLowerCase().includes(q) || 
                             entity.description.toLowerCase().includes(q) ||
                             entity.fields.some(f => f.key.toLowerCase().includes(q));
                    }).length}
                  </span> of 160 collections
                </div>
              </div>

              {/* Collections Table */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entity & Collection ID</th>
                      <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                      <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fields Overview</th>
                      <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Required Keys</th>
                      <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Live Records</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {[...ENTITIES_ORDER]
                      .filter(id => {
                        const entity = ENTITIES_CONFIG[id];
                        if (!entity) return false;
                        if (!schemaSearchQuery.trim()) return true;
                        const q = schemaSearchQuery.toLowerCase();
                        return entity.name.toLowerCase().includes(q) || 
                               entity.collectionName.toLowerCase().includes(q) || 
                               entity.description.toLowerCase().includes(q) ||
                               entity.fields.some(f => f.key.toLowerCase().includes(q));
                      })
                      .sort((a, b) => {
                        const nameA = ENTITIES_CONFIG[a]?.name || '';
                        const nameB = ENTITIES_CONFIG[b]?.name || '';
                        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
                      })
                      .map((id) => {
                        const entity = ENTITIES_CONFIG[id];
                        if (!entity) return null;
                        const Icon = entity.icon;
                        const count = stats[id] || 0;
                        return (
                          <tr key={id} className="hover:bg-gray-50/80 transition-colors group">
                            <td className="px-5 py-4 align-top">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 text-gray-600 rounded-xl group-hover:bg-gray-950 group-hover:text-white transition-all">
                                  <Icon size={16} />
                                </div>
                                <div>
                                  <button
                                    onClick={() => {
                                      setSelectedEntityId(id);
                                      setIsGlobalSchemaOpen(false);
                                    }}
                                    className="text-xs font-bold text-gray-900 hover:text-indigo-600 text-left block"
                                  >
                                    {entity.name}
                                  </button>
                                  <div className="text-[10px] font-mono text-gray-400">{entity.collectionName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <p className="text-[11px] text-gray-600 leading-relaxed max-w-xs">{entity.description}</p>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {entity.fields.slice(0, 8).map(f => (
                                  <span key={f.key} className="text-[9px] bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                                    {f.key}
                                  </span>
                                ))}
                                {entity.fields.length > 8 && (
                                  <span className="text-[9px] text-gray-400 font-medium px-1.5 py-0.5">+{entity.fields.length - 8} more</span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="flex flex-col gap-1">
                                {entity.fields.filter(f => f.required).map(f => (
                                  <div key={f.key} className="flex items-center gap-1.5 text-[10px] text-rose-600 font-bold">
                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                                    <span className="font-mono">{f.key}</span>
                                  </div>
                                ))}
                                {entity.fields.filter(f => f.required).length === 0 && (
                                  <span className="text-[10px] text-gray-400 italic">None specified</span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 align-top text-right">
                              <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg font-mono ${count > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                {count.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-[10px] text-gray-500 font-medium">
                All 160 collections are automatically synchronized and managed with standard Firebase Firestore indexing.
              </span>
              <button
                onClick={() => setIsGlobalSchemaOpen(false)}
                className="px-6 py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
              >
                Close Data Dictionary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Dialog */}
      {isPermissionsOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-gray-900" />
                <h3 className="text-base font-extrabold text-gray-900">
                  {selectedEntityId === 'ClinicalEncounter' ? 'ClinicalEncounter Permissions' : `${selectedEntity.name} Permissions`}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsPermissionsOpen(false);
                  setIsEditingPermissions(false);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-gray-900">Permissions</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Create rules to control who can read and write records. Multiple rules are combined with OR logic.
                </p>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                <div className="p-4 bg-gray-50/75 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">Current permissions</span>
                  {!isEditingPermissions ? (
                    <button
                      onClick={() => setIsEditingPermissions(true)}
                      className="px-3 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1"
                    >
                      <Edit size={12} />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsEditingPermissions(false)}
                        className="px-2.5 py-1 text-gray-500 hover:text-gray-800 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingPermissions(false);
                          alert("Database access rules updated successfully. Your new Firestore security guidelines are active.");
                        }}
                        className="px-3 py-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                      >
                        Save Rules
                      </button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="px-4 py-3 min-w-[200px]">Rule</th>
                        <th className="px-3 py-3 text-center w-16">Create</th>
                        <th className="px-3 py-3 text-center w-16">Read</th>
                        <th className="px-3 py-3 text-center w-16">Update</th>
                        <th className="px-3 py-3 text-center w-16">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {permissions.map((perm, pIdx) => (
                        <tr key={perm.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-4 py-3.5 space-y-1">
                            <div className="font-bold text-gray-900 text-[11px] uppercase tracking-wide text-gray-500/90">
                              {perm.type}
                            </div>
                            {perm.id === 'creator_only' ? (
                              <div className="text-xs text-gray-600 font-medium">
                                {perm.rule}
                              </div>
                            ) : (
                              <div className="font-mono text-[11px] text-gray-800 font-semibold bg-gray-50 border border-gray-100 px-2 py-0.5 rounded inline-block">
                                {perm.rule}
                              </div>
                            )}
                          </td>
                          {['create', 'read', 'update', 'delete'].map((action) => {
                            const val = perm[action as 'create' | 'read' | 'update' | 'delete'];
                            return (
                              <td key={action} className="px-3 py-3.5 text-center">
                                {isEditingPermissions ? (
                                  <input
                                    type="checkbox"
                                    checked={val}
                                    onChange={(e) => {
                                      const updated = [...permissions];
                                      updated[pIdx] = {
                                        ...updated[pIdx],
                                        [action]: e.target.checked
                                      };
                                      setPermissions(updated);
                                    }}
                                    className="h-4.5 w-4.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center">
                                    {val ? (
                                      <span className="h-5 w-5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center justify-center">
                                        <Check size={12} className="stroke-[3]" />
                                      </span>
                                    ) : (
                                      <span className="h-2 w-2 rounded-full bg-gray-200"></span>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsPermissionsOpen(false);
                  setIsEditingPermissions(false);
                }}
                className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Upload size={18} className="text-gray-900" />
                <h3 className="text-base font-extrabold text-gray-900">
                  Import Records into {selectedEntity.name}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsImportOpen(false);
                  setImportPreview([]);
                  setImportError(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Upload a JSON file containing a list of records to import into <strong className="text-gray-800">{selectedEntity.name}</strong>.
              </p>

              {/* Drag and Drop Container */}
              <div 
                className="border-2 border-dashed border-gray-200 hover:border-gray-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-gray-50/20"
                onClick={() => document.getElementById('import-file-input')?.click()}
              >
                <Upload size={28} className="mx-auto text-gray-400 mb-2" />
                <span className="text-xs font-semibold text-gray-700 block">Click to select file or drag it here</span>
                <span className="text-[10px] text-gray-400 block mt-1">Accepts .json files exported from ClinicalEncounter or other matching schemas</span>
                <input
                  id="import-file-input"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-medium">
                  {importError}
                </div>
              )}

              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Preview ({importPreview.length} items detected)</span>
                    <button
                      onClick={() => setImportPreview([])}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="border border-gray-100 rounded-lg bg-gray-50 max-h-40 overflow-y-auto p-3 space-y-2.5 font-mono text-[10px]">
                    {importPreview.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="border-b border-gray-200/60 last:border-0 pb-1.5 last:pb-0">
                        <div className="font-bold text-gray-700 mb-1">Item #{idx + 1}</div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-gray-500">
                          {selectedEntity.fields.slice(0, 4).map(f => (
                            <div key={f.key} className="truncate">
                              <span className="text-gray-400">{f.key}:</span> {item[f.key] !== undefined ? String(item[f.key]) : <span className="italic text-gray-300">none</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {importPreview.length > 5 && (
                      <div className="text-center text-gray-400 italic pt-1.5">
                        And {importPreview.length - 5} more items...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsImportOpen(false);
                  setImportPreview([]);
                  setImportError(null);
                }}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
                disabled={isImportingInProgress}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                disabled={importPreview.length === 0 || isImportingInProgress}
              >
                {isImportingInProgress ? "Importing..." : `Import ${importPreview.length} records`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recently Deleted Dialog */}
      {isRecentlyDeletedOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <History size={18} className="text-gray-900" />
                <h3 className="text-base font-extrabold text-gray-900">
                  {selectedEntity.name} Recycle Bin
                </h3>
              </div>
              <button 
                onClick={() => setIsRecentlyDeletedOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Recently Deleted</h4>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                    View, restore, or permanently delete items from <strong className="text-gray-800">{selectedEntity.name}</strong>.
                  </p>
                </div>
                {recentlyDeletedRecords.filter(r => r.collectionName === selectedEntity.collectionName).length > 0 && (
                  <button
                    onClick={handleClearRecentlyDeleted}
                    className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors shadow-sm border border-rose-100"
                  >
                    Empty Trash
                  </button>
                )}
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto max-h-[300px]">
                  {recentlyDeletedRecords.filter(r => r.collectionName === selectedEntity.collectionName).length === 0 ? (
                    <div className="p-12 text-center text-xs text-gray-400">
                      <History size={32} className="mx-auto text-gray-200 mb-2" />
                      No recently deleted records for {selectedEntity.name}.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="px-4 py-3">Record Details</th>
                          <th className="px-4 py-3">Deleted At</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {recentlyDeletedRecords
                          .filter(r => r.collectionName === selectedEntity.collectionName)
                          .map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                              <td className="px-4 py-3 space-y-1">
                                <div className="font-bold text-gray-900 text-[11px] font-mono">
                                  {item.data.appointment_id || item.data.visit_id || item.data.id || item.originalId || 'N/A'}
                                </div>
                                <div className="text-[10px] text-gray-500 line-clamp-2 max-w-sm">
                                  {selectedEntity.fields.map((f: any) => {
                                    const val = item.data[f.key];
                                    if (val) return `${f.key}: ${val}`;
                                    return null;
                                  }).filter(Boolean).slice(0, 3).join(' | ')}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-400 font-mono text-[10px] whitespace-nowrap">
                                {item.deletedAt ? new Date(item.deletedAt).toLocaleString() : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => handleRestoreRecord(item)}
                                  className="px-2.5 py-1 text-emerald-700 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-[11px] font-semibold rounded-lg transition-colors"
                                >
                                  Restore
                                </button>
                                <button
                                  onClick={() => handlePermanentDelete(item.id)}
                                  className="px-2.5 py-1 text-rose-600 hover:text-rose-900 hover:bg-rose-50 text-[11px] font-semibold rounded-lg transition-colors"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsRecentlyDeletedOpen(false)}
                className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
            </div>
          </div>
        )}
        {/* Custom Fields Configuration Modal for Active Subform */}
        {isCustomFieldsOpen && (
          <div className="fixed inset-0 bg-gray-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fadeIn">
            <div className="bg-white rounded-2xl border border-gray-150 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-left">
              <div className="p-5 border-b border-gray-100 bg-slate-50 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                    <Settings2 size={16} className="text-indigo-600" />
                    <span>Configure Schema Extensions: {hubActiveFormId.replace('Form_', '').replace(/_/g, '.')}</span>
                  </h3>
                  <p className="text-[10px] text-gray-500 font-medium mt-1 max-w-lg leading-relaxed">
                    Dynamically add new columns and options (e.g., 'Other Observations', 'Secondary Diagnosis') to this clinical table without modifying code. Changes are saved to the custom_fields collection and immediately available.
                  </p>
                </div>
                <button
                  onClick={() => setIsCustomFieldsOpen(false)}
                  className="p-1.5 border border-gray-200 text-gray-400 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* List of existing custom fields */}
                <div>
                  <h4 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider">Existing Custom Fields</h4>
                  <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-3xs">
                    {(customFieldsDb[hubActiveFormId] || []).length === 0 ? (
                      <div className="p-8 text-center text-xs text-gray-400 bg-gray-50/50">
                        No custom fields have been added to this subsection yet.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-gray-100">
                            <th className="px-4 py-2 font-bold text-gray-600 uppercase">Field Key</th>
                            <th className="px-4 py-2 font-bold text-gray-600 uppercase">Label</th>
                            <th className="px-4 py-2 font-bold text-gray-600 uppercase">Type</th>
                            <th className="px-4 py-2 text-right font-bold text-gray-600 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(customFieldsDb[hubActiveFormId] || []).map((field) => (
                            <tr key={field.id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2 font-mono text-gray-500 text-[10px]">{field.key}</td>
                              <td className="px-4 py-2 font-bold text-gray-800">{field.label}</td>
                              <td className="px-4 py-2">
                                <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[9px] px-2 py-0.5 rounded font-bold">
                                  {field.type}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <button
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to remove this custom field?')) {
                                      try {
                                        await deleteDoc(doc(db, 'custom_fields', field.id));
                                      } catch (err) {
                                        alert("Error deleting custom field");
                                      }
                                    }
                                  }}
                                  className="text-rose-600 hover:text-rose-800 p-1 border border-rose-100 hover:bg-rose-50 rounded cursor-pointer"
                                  title="Delete Field"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Form to add a new custom field */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5">
                  <h4 className="text-xs font-bold text-indigo-900 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus size={14} className="text-indigo-600" />
                    Add New Custom Field
                  </h4>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setCustomFieldFormError('');
                      if (!editingCustomField?.key || !editingCustomField?.label || !editingCustomField?.type) {
                        setCustomFieldFormError('Please fill out all required fields.');
                        return;
                      }
                      try {
                        await addDoc(collection(db, 'custom_fields'), {
                          entityId: hubActiveFormId,
                          key: (editingCustomField.key || '').toLowerCase().replace(/\s+/g, '_'),
                          label: editingCustomField.label,
                          type: editingCustomField.type,
                          placeholder: editingCustomField.placeholder || '',
                          required: editingCustomField.required || false,
                          options: editingCustomField.type === 'select' ? (editingCustomField.options || '').split(',').map((s: string) => s.trim()) : [],
                          createdAt: new Date().toISOString()
                        });
                        setEditingCustomField(null);
                        setCustomFieldFormError('');
                      } catch (err) {
                        console.error(err);
                        setCustomFieldFormError('Error saving custom field.');
                      }
                    }}
                    className="space-y-4"
                  >
                    {customFieldFormError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-2">
                        <AlertCircle size={14} />
                        {customFieldFormError}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1">Field Label (e.g. Other Symptoms)</label>
                        <input
                          type="text"
                          value={editingCustomField?.label || ''}
                          onChange={e => setEditingCustomField({ ...editingCustomField, label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                          placeholder="Label"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1">Field Key (Auto-generated)</label>
                        <input
                          type="text"
                          disabled
                          value={editingCustomField?.key || ''}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-gray-200 text-gray-500 rounded-lg border-dashed font-mono"
                          placeholder="field_key"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1">Input Type</label>
                        <select
                          value={editingCustomField?.type || 'text'}
                          onChange={e => setEditingCustomField({ ...editingCustomField, type: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                        >
                          <option value="text">Text (Short String)</option>
                          <option value="textarea">Textarea (Long Paragraph)</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="select">Dropdown (Select)</option>
                          <option value="checkbox">Checkbox (Yes/No)</option>
                        </select>
                      </div>
                      {editingCustomField?.type === 'select' && (
                        <div>
                          <label className="block text-[10px] font-bold text-gray-700 mb-1">Options (Comma separated)</label>
                          <input
                            type="text"
                            value={editingCustomField?.options || ''}
                            onChange={e => setEditingCustomField({ ...editingCustomField, options: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                            placeholder="Option 1, Option 2, Option 3"
                          />
                        </div>
                      )}
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-gray-700 mb-1">Placeholder (Optional)</label>
                        <input
                          type="text"
                          value={editingCustomField?.placeholder || ''}
                          onChange={e => setEditingCustomField({ ...editingCustomField, placeholder: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                          placeholder="e.g. Enter other observations here..."
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm"
                      >
                        Add Field to Schema
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
