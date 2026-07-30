import React, { useState, useEffect } from 'react';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDoc, setDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { isFakeOrFalseRow } from '../utils/dataIntegrity';
import { runGlobalCleanup } from '../utils/cleanupService';
import { 
  Users, Plus, Search, Trash2, Edit2, Check, X, 
  Briefcase, TrendingUp, DollarSign, Clock, UserCheck, 
  GraduationCap, RefreshCw, Target, Award, BookOpen, Calendar, UserPlus, FolderPlus,
  ClipboardList, ShieldAlert, Sparkles, Activity, FileText, ShieldCheck, AlertTriangle, Info,
  Globe, ChevronDown, Settings, Upload, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Language, translate, LANGUAGES } from '../lib/translations';
import { logSecurityEvent } from '../lib/auditLogger';

// --- NEW MODULAR COMPONENT IMPORTS ---
import HRActionPlans from './HRActionPlans';
import HROnboardingTimeline from './HROnboardingTimeline';
import HRTemplateEditor from './HRTemplateEditor';
import HRNotificationSettings from './HRNotificationSettings';
import HRManualUpload from './HRManualUpload';
import HRPerformance from './HRPerformance';
import HRCapacityBuilding from './HRCapacityBuilding';
import HRRecruitment from './HRRecruitment';
import HRTrainingAttendance from './HRTrainingAttendance';
import HRFolderManager from './HRFolderManager';
import HRClearance from './HRClearance';
import HRLeave from './HRLeave';
import HRMotivation from './HRMotivation';
import HRSickLeave from './HRSickLeave';
import HRReportFolder from './HRReportFolder';
import HRActiveStaffFolder from './HRActiveStaffFolder';
import { useSkippedContext } from './SecureModuleWrapper';

// Workforce Management Components
import MasterDutyRoster from './hr/MasterDutyRoster';
import AttendanceLog from './hr/AttendanceLog';
import StaffHandover from './hr/StaffHandover';
import ShiftComplianceReport from './hr/ShiftComplianceReport';

// --- DATA STRUCTURES & INTERFACES ---
interface StaffMember {
  id: string; employeeId: string; fullName: string; department: string; jobTitle: string;
  employmentType: string; status: 'Active' | 'On Leave' | 'Suspended'; salary: number;
  joinedDate: string; skills: string; attendanceRate: number;
  gender: 'Male' | 'Female' | 'Other';
}
interface HrActivityLog {
  id: string;
  timestamp: string;
  userEmail: string;
  action: 'Created' | 'Updated' | 'Deleted';
  tableName: string;
  recordId: string;
  details: string;
  hospital_id: string;
}
interface ActionPlan {
  id: string; title: string; department: string; objective: string;
  assignedTo: string; targetDate: string; priority: 'High' | 'Medium' | 'Low';
  status: 'Planned' | 'In Progress' | 'Completed'; progress: number;
}
interface PerformanceEval {
  id: string; employeeId: string; employeeName: string; department: string;
  evaluator: string; period: string; qualityScore: number; efficiencyScore: number; // For "ifisunce or evaluation"
  teamworkScore: number; overallGrade: 'A' | 'B' | 'C' | 'D' | 'F'; remarks: string;
}
interface CapacityProgram {
  id: string; programName: string; topic: string; instructor: string;
  startDate: string; endDate: string; participantsCount: number; budget: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
}
interface AttendanceRecord {
  id: string; employeeId: string; employeeName: string; date: string;
  status: 'Present' | 'Absent' | 'Sick Leave' | 'Annual Leave';
  checkInTime: string; checkOutTime: string; overtimeHrs: number;
}
interface LearningUpgrade {
  id: string; employeeId: string; employeeName: string; currentQualification: string;
  targetQualification: string; program: string; institution: string; sponsor: string;
  expectedGradDate: string; status: 'Approved' | 'Enrolled' | 'Completed';
}
interface NewEmployment {
  id: string; candidateName: string; department: string; roleApplied: string;
  yearsOfExperience: number; interviewDate: string;
  stage: 'Applied' | 'Phone Screen' | 'Practical Exam' | 'Interview' | 'Offer' | 'Hired';
  score: number; interviewer: string;
}
interface ProfessionalDocument {
  id?: string;
  employeeId: string;
  documentType: 'License' | 'Degree/Diploma' | 'Specialty Certification' | 'Contract' | 'ID/Background' | 'Other';
  documentName: string;
  documentNumber: string;
  issuingBody: string;
  issueDate: string;
  expiryDate?: string;
  status: 'Verified' | 'Pending Review' | 'Expired' | 'Flagged';
  notes?: string;
  hospital_id?: string;
}

// --- SEED SAMPLES ---
const SEED_DEPARTMENTS = [
  'Clinical Services',
  'Nursing Care',
  'Midwifery',
  'Pharmacy',
  'Laboratory',
  'Radiology',
  'Administration',
  'Support Services',
  'Doctor General Practitioner',
  'Doctor Specialist',
  'Master',
  'Other'
];
const SEED_DOCUMENTS: any[] = [];
const SEED_STAFF: any[] = [];
const SEED_ACTION_PLANS: any[] = [];
const SEED_PERFORMANCE: any[] = [];
const SEED_CAPACITY: any[] = [];
const SEED_ATTENDANCE: any[] = [];
const SEED_LEARNING: any[] = [];
const SEED_NEW_EMPLOYMENT: any[] = [];

interface Module7Props {
  activeHospital: any;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  currentLanguage: Language;
}

export default function Module7HumanResources({ activeHospital, addToast, currentLanguage }: Module7Props) {
  const { isSkipped } = useSkippedContext();
  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';
  
  // --- PERMISSION SYSTEM ---
  const [userRole, setUserRole] = useState<'Read-only' | 'HR Manager' | 'HR Admin'>('Read-only');
  
  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'user_profiles', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().hrRole || 'Read-only');
        }
      }
    };
    fetchRole();
  }, []);

  const hasPermission = (requiredRole: 'Read-only' | 'HR Manager' | 'HR Admin') => {
    if (userRole === 'HR Admin') return true;
    if (userRole === 'HR Manager') return requiredRole !== 'HR Admin';
    return requiredRole === 'Read-only';
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('HR KPI Dashboard Report', 10, 10);
    const staffData = staff.map(s => [s.fullName, s.department, s.role]);
    autoTable(doc, {
      head: [['Name', 'Department', 'Role']],
      body: staffData
    });
    doc.save('HR_KPI_Report.pdf');
  };

  const handleGlobalCleanup = async () => {
    if (!window.confirm('This will purge all fake/test records from ALL HR and Hospital collections. Continue?')) return;
    try {
      const deleted = await runGlobalCleanup(hospital_id);
      addToast('success', `Data Guard: Purged ${deleted} fake records across all modules.`);
      logSecurityEvent('Data Cleanup', `Admin triggered global cleanup. Deleted ${deleted} fake rows.`, 'High');
    } catch (err) {
      console.error(err);
      addToast('error', 'Cleanup failed.');
    }
  };

  // --- SUB-TAB CONFIGURATION ---
  type TabId = 'dashboard' | 'directory' | 'active_staff' | 'documents' | 'reports' | 'activity' | 'action_plans' | 'performance' | 'capacity' | 'attendance' | 'learning' | 'new_employment' | 'analytics' | 'training_attendance' | 'clearance' | 'leave' | 'motivation' | 'sick_leave' | 'shifts' | 'handovers' | 'compliance' | 'checklist' | 'templates' | 'settings' | 'upload' | 'requests';
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // --- STATE FOR NEW HR MODULE COUNTS ---
  const [trainingCount, setTrainingCount] = useState(0);
  const [clearanceCount, setClearanceCount] = useState(0);
  const [leaveCount, setLeaveCount] = useState(0);
  const [motivationCount, setMotivationCount] = useState(0);
  const [sickLeaveCount, setSickLeaveCount] = useState(0);

  // --- STATE STORES ---
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [performanceEvals, setPerformanceEvals] = useState<PerformanceEval[]>([]);
  const [capacityPrograms, setCapacityPrograms] = useState<CapacityProgram[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [learningUpgrades, setLearningUpgrades] = useState<LearningUpgrade[]>([]);
  const [newEmployments, setNewEmployments] = useState<NewEmployment[]>([]);
  const [staffDocuments, setStaffDocuments] = useState<ProfessionalDocument[]>([]);
  const [activityLogs, setActivityLogs] = useState<HrActivityLog[]>([]);
  const [masterShifts, setMasterShifts] = useState<any[]>([]);
  const [handovers, setHandovers] = useState<any[]>([]);
  const [complianceReports, setComplianceReports] = useState<any[]>([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedStaffForFolder, setSelectedStaffForFolder] = useState<StaffMember | null>(null);
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState({
    documentType: 'License' as 'License' | 'Degree/Diploma' | 'Specialty Certification' | 'Contract' | 'ID/Background' | 'Other',
    documentName: '',
    documentNumber: '',
    issuingBody: '',
    issueDate: '',
    expiryDate: '',
    status: 'Pending Review' as 'Verified' | 'Pending Review' | 'Expired' | 'Flagged',
    notes: ''
  });
  const [depts, setDepts] = useState<string[]>(SEED_DEPARTMENTS);
  const [loading, setLoading] = useState(true);

  // Search, Add and Edit States
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [newDeptInput, setNewDeptInput] = useState('');

  // --- SINGLETON SEEDING / LISTENING HOOK ---
  useEffect(() => {
    if (isSkipped) {
      setStaff([]);
      setActionPlans([]);
      setPerformanceEvals([]);
      setCapacityPrograms([]);
      setAttendanceRecords([]);
      setLearningUpgrades([]);
      setNewEmployments([]);
      setStaffDocuments([]);
      setActivityLogs([]);
      setMasterShifts([]);
      setHandovers([]);
      setComplianceReports([]);
      setDepts(SEED_DEPARTMENTS);
      setTrainingCount(0);
      setClearanceCount(0);
      setLeaveCount(0);
      setMotivationCount(0);
      setSickLeaveCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    const syncCollection = (collName: string, setter: (data: any[]) => void, seedData: any[]) => {
      return onSnapshot(collection(db, collName), async (snap) => {
        let list: any[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        
        // Seeding logic if empty
        if (list.length === 0 && seedData.length > 0) {
          try {
            for (const item of seedData) {
              await addDoc(collection(db, collName), { ...item, hospital_id });
            }
          } catch (e) {
            console.error(`Seeding failed for ${collName}:`, e);
          }
        } else {
          setter(list.filter(x => x.hospital_id === hospital_id && !isFakeOrFalseRow(x)));
        }
      });
    };

    const unsubStaff = syncCollection('hr_staff_registry', setStaff, SEED_STAFF);
    const unsubPlans = syncCollection('hr_action_plans', setActionPlans, SEED_ACTION_PLANS);
    const unsubEvals = syncCollection('hr_performance_evaluations', setPerformanceEvals, SEED_PERFORMANCE);
    const unsubCap = syncCollection('hr_capacity_building', setCapacityPrograms, SEED_CAPACITY);
    const unsubAtt = onSnapshot(collection(db, 'hr_attendance_registry'), (snap) => {
      let list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setAttendanceRecords(list.filter(x => x.hospital_id === hospital_id));
    });
    const unsubLearn = syncCollection('hr_learning_upgrades', setLearningUpgrades, SEED_LEARNING);
    const unsubEmploy = syncCollection('hr_recruitment', setNewEmployments, SEED_NEW_EMPLOYMENT);
    const unsubDocs = syncCollection('hr_staff_documents', setStaffDocuments, SEED_DOCUMENTS);
    const unsubLogs = syncCollection('hr_activity_logs', setActivityLogs, []);
    const unsubMasterShifts = syncCollection('hr_master_shifts', setMasterShifts, []);
    const unsubHandovers = syncCollection('hr_handovers', setHandovers, []);
    const unsubCompliance = syncCollection('hr_compliance_reports', setComplianceReports, []);
    const unsubLogsSync = unsubLogs; // for naming consistency

    // Custom departments sync
    const unsubDepts = onSnapshot(collection(db, 'hr_departments'), async (snap) => {
      let dList: string[] = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.name) dList.push(data.name);
      });
      if (dList.length === 0) {
        try {
          for (const dName of SEED_DEPARTMENTS) {
            await addDoc(collection(db, 'hr_departments'), { name: dName, hospital_id });
          }
        } catch (e) {
          console.error('Seeding departments failed:', e);
        }
      } else {
        setDepts(Array.from(new Set([...SEED_DEPARTMENTS, ...dList])));
      }
      setLoading(false);
    });

    const unsubTrain = onSnapshot(collection(db, 'hr_training_attendance'), (snap) => {
      let cnt = 0;
      snap.forEach(d => { if (d.data().hospital_id === hospital_id) cnt++; });
      setTrainingCount(cnt);
    });
    const unsubClear = onSnapshot(collection(db, 'hr_clearances'), (snap) => {
      let cnt = 0;
      snap.forEach(d => { if (d.data().hospital_id === hospital_id) cnt++; });
      setClearanceCount(cnt);
    });
    const unsubLeave = onSnapshot(collection(db, 'hr_leaves'), (snap) => {
      let cnt = 0;
      snap.forEach(d => { if (d.data().hospital_id === hospital_id) cnt++; });
      setLeaveCount(cnt);
    });
    const unsubMotiv = onSnapshot(collection(db, 'hr_motivations'), (snap) => {
      let cnt = 0;
      snap.forEach(d => { if (d.data().hospital_id === hospital_id) cnt++; });
      setMotivationCount(cnt);
    });
    const unsubSick = onSnapshot(collection(db, 'hr_sick_leaves'), (snap) => {
      let cnt = 0;
      snap.forEach(d => { if (d.data().hospital_id === hospital_id) cnt++; });
      setSickLeaveCount(cnt);
    });

    return () => {
      unsubStaff(); unsubPlans(); unsubEvals(); unsubCap(); unsubAtt(); unsubLearn(); unsubEmploy(); unsubDocs(); unsubDepts();
      unsubTrain(); unsubClear(); unsubLeave(); unsubMotiv(); unsubSick(); unsubLogs();
      unsubMasterShifts(); unsubHandovers(); unsubCompliance();
    };
  }, [hospital_id]);

  // --- ACTIONS ---
  const handleAddCustomDept = async () => {
    if (!newDeptInput.trim()) return;
    const cleanName = newDeptInput.trim();
    if (depts.includes(cleanName)) {
      addToast('error', 'Department already exists.');
      return;
    }
    try {
      await addDoc(collection(db, 'hr_departments'), { name: cleanName, hospital_id });
      addToast('success', `✓ Custom Department "${cleanName}" registered.`);
      setNewDeptInput('');
    } catch (err) {
      addToast('error', 'Could not register custom department.');
    }
  };

  const logHrActivity = async (action: 'Created' | 'Updated' | 'Deleted', tableName: string, recordId: string, details: string) => {
    try {
      // Internal HR Logs
      await addDoc(collection(db, 'hr_activity_logs'), {
        timestamp: new Date().toISOString(),
        userEmail: auth.currentUser?.email || 'admin@hospital.com',
        action,
        tableName,
        recordId,
        details,
        hospital_id
      });

      // Unified Security Logs
      await logSecurityEvent(
        `HR_MODIFICATIONS: ${action}`,
        `HR Management / ${tableName}`,
        `Record: ${recordId} | ${details}`
      );
    } catch (err) {
      console.error('Failed to log HR activity:', err);
    }
  };

  const handleSave = async (collName: string, id: string, updatedData: any, reason: string = 'Administrative Update') => {
    try {
      const docRef = doc(db, collName, id);
      
      // Attempt to track changed fields for audit log
      let changedFieldsDesc = '';
      try {
        const snap = await getDoc(docRef);
        const oldData = snap.data();
        if (oldData) {
          const changed = Object.keys(updatedData).filter(k => 
            k !== 'id' && k !== 'hospital_id' && 
            JSON.stringify(oldData[k]) !== JSON.stringify(updatedData[k])
          );
          
          if (changed.length > 0) {
            changedFieldsDesc = `Modified: ${changed.join(', ')}`;
            
            // CRITICAL: Force row in Audit_Trail table
            await addDoc(collection(db, 'hr_audit_trail'), {
              timestamp: new Date().toISOString(),
              adminId: auth.currentUser?.email || 'admin@healthflow.app',
              tableName: collName,
              recordId: id,
              oldValues: oldData,
              newValues: updatedData,
              reason: reason,
              changedFields: changed,
              hospital_id
            });
          }
        }
      } catch (err) {
        console.warn('Could not fetch old doc for audit trail', err);
      }

      // Remove metadata
      const cleanData = { ...updatedData };
      delete cleanData.id;
      delete cleanData.hospital_id;

      // Handle conversions
      if (cleanData.salary) cleanData.salary = Number(cleanData.salary);
      if (cleanData.progress !== undefined) cleanData.progress = Number(cleanData.progress);
      if (cleanData.qualityScore !== undefined) cleanData.qualityScore = Number(cleanData.qualityScore);
      if (cleanData.efficiencyScore !== undefined) cleanData.efficiencyScore = Number(cleanData.efficiencyScore);
      if (cleanData.teamworkScore !== undefined) cleanData.teamworkScore = Number(cleanData.teamworkScore);
      if (cleanData.participantsCount !== undefined) cleanData.participantsCount = Number(cleanData.participantsCount);
      if (cleanData.budget !== undefined) cleanData.budget = Number(cleanData.budget);
      if (cleanData.overtimeHrs !== undefined) cleanData.overtimeHrs = Number(cleanData.overtimeHrs);

      await updateDoc(docRef, cleanData);
      addToast('success', '✓ Record successfully updated.');
      logHrActivity('Updated', collName, id, changedFieldsDesc || `Updated record in ${collName}`);
      setEditingId(null);
    } catch (e) {
      addToast('error', 'Failed to update record.');
    }
  };

  const handleDelete = async (collName: string, id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await deleteDoc(doc(db, collName, id));
      addToast('success', '✓ Record deleted successfully.');
      logHrActivity('Deleted', collName, id, `Deleted record from ${collName}`);
    } catch (e) {
      addToast('error', 'Failed to delete record.');
    }
  };

  const handleCreate = async (collName: string, rawData: any) => {
    if (isFakeOrFalseRow(rawData)) {
      addToast('error', '⚠️ Cannot record false, mock, dummy, or fake information to protect HR data integrity!');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, collName), { ...rawData, hospital_id, lastUpdated: new Date().toISOString() });
      addToast('success', '✓ New record successfully registered.');
      logHrActivity('Created', collName, docRef.id, `Created new record in ${collName}`);
      setIsAdding(false);
    } catch (e) {
      addToast('error', 'Failed to save new record.');
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForFolder) return;
    
    if (!docForm.documentName.trim()) {
      addToast('error', 'Document Name is required.');
      return;
    }
    if (!docForm.documentNumber.trim()) {
      addToast('error', 'Document/License Number is required.');
      return;
    }
    if (!docForm.issuingBody.trim()) {
      addToast('error', 'Issuing Body is required.');
      return;
    }
    if (!docForm.issueDate) {
      addToast('error', 'Issue Date is required.');
      return;
    }
    
    if (docForm.expiryDate && docForm.issueDate && new Date(docForm.expiryDate) < new Date(docForm.issueDate)) {
      addToast('error', 'Validation Error: Expiry Date cannot be earlier than Issue Date.');
      return;
    }

    if (isFakeOrFalseRow(docForm)) {
      addToast('error', '⚠️ Cannot record false, mock, dummy, or fake professional document details to protect system data integrity!');
      return;
    }

    try {
      const docPayload = {
        employeeId: selectedStaffForFolder.employeeId,
        documentType: docForm.documentType,
        documentName: docForm.documentName.trim(),
        documentNumber: docForm.documentNumber.trim(),
        issuingBody: docForm.issuingBody.trim(),
        issueDate: docForm.issueDate,
        expiryDate: docForm.expiryDate || '',
        status: docForm.status,
        notes: docForm.notes.trim(),
        hospital_id
      };
      
      const docRef = await addDoc(collection(db, 'hr_staff_documents'), docPayload);
      addToast('success', '✓ Professional Document registered successfully.');
      logHrActivity('Created', 'hr_staff_documents', docRef.id, `Added document: ${docPayload.documentName} for ${docPayload.employeeId}`);
      setIsAddingDoc(false);
      setDocForm({
        documentType: 'License',
        documentName: '',
        documentNumber: '',
        issuingBody: '',
        issueDate: '',
        expiryDate: '',
        status: 'Pending Review',
        notes: ''
      });
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to register Professional Document.');
    }
  };

  const handleUpdateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocId) return;

    if (!docForm.documentName.trim()) {
      addToast('error', 'Document Name is required.');
      return;
    }
    if (!docForm.documentNumber.trim()) {
      addToast('error', 'Document/License Number is required.');
      return;
    }
    if (!docForm.issuingBody.trim()) {
      addToast('error', 'Issuing Body is required.');
      return;
    }
    if (!docForm.issueDate) {
      addToast('error', 'Issue Date is required.');
      return;
    }
    
    if (docForm.expiryDate && docForm.issueDate && new Date(docForm.expiryDate) < new Date(docForm.issueDate)) {
      addToast('error', 'Validation Error: Expiry Date cannot be earlier than Issue Date.');
      return;
    }

    try {
      const docRef = doc(db, 'hr_staff_documents', editingDocId);
      const docPayload = {
        documentType: docForm.documentType,
        documentName: docForm.documentName.trim(),
        documentNumber: docForm.documentNumber.trim(),
        issuingBody: docForm.issuingBody.trim(),
        issueDate: docForm.issueDate,
        expiryDate: docForm.expiryDate || '',
        status: docForm.status,
        notes: docForm.notes.trim()
      };
      
      await updateDoc(docRef, docPayload);
      addToast('success', '✓ Professional Document updated successfully.');
      logHrActivity('Updated', 'hr_staff_documents', editingDocId, `Updated document: ${docForm.documentName}`);
      setEditingDocId(null);
      setDocForm({
        documentType: 'License',
        documentName: '',
        documentNumber: '',
        issuingBody: '',
        issueDate: '',
        expiryDate: '',
        status: 'Pending Review',
        notes: ''
      });
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to update Professional Document.');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this Professional Document from this Staff Folder?')) return;
    try {
      await deleteDoc(doc(db, 'hr_staff_documents', docId));
      addToast('success', '✓ Document deleted from Personal Folder.');
      logHrActivity('Deleted', 'hr_staff_documents', docId, 'Removed professional document from staff folder');
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to delete Document.');
    }
  };

  const handleToggleVerifyDocument = async (docId: string, currentStatus: string) => {
    try {
      const docRef = doc(db, 'hr_staff_documents', docId);
      const nextStatus = currentStatus === 'Verified' ? 'Pending Review' : 'Verified';
      await updateDoc(docRef, { status: nextStatus });
      addToast('success', `✓ Document status updated to ${nextStatus}.`);
      logHrActivity('Updated', 'hr_staff_documents', docId, `Updated verification status to ${nextStatus}`);
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to update verification status.');
    }
  };

  // Hire a candidate directly into staff registry
  const handleHireCandidate = async (candidate: NewEmployment) => {
    try {
      // Add to staff registry
      const newStaffObj = {
        employeeId: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        fullName: candidate.candidateName,
        department: candidate.department,
        jobTitle: candidate.roleApplied,
        employmentType: 'Full-time',
        status: 'Active' as const,
        salary: 22000,
        joinedDate: new Date().toISOString().split('T')[0],
        skills: 'Recruited from Pipeline',
        attendanceRate: 100
      };
      await addDoc(collection(db, 'hr_staff_registry'), { ...newStaffObj, hospital_id });
      
      // Update pipeline status to Hired
      await updateDoc(doc(db, 'hr_recruitment', candidate.id), { onboardingStage: 'Completed' });
      addToast('success', `✓ ${candidate.candidateName} officially hired and enrolled in Staff Registry!`);
    } catch (e) {
      addToast('error', 'Failed to transfer candidate to staff list.');
    }
  };

  // --- FORM STATE RE-INITIALISERS ---
  const [customDepartment, setCustomDepartment] = useState('');
  const [formStaff, setFormStaff] = useState({ employeeId: '', fullName: '', department: 'Midwifery', jobTitle: '', employmentType: 'Full-time', status: 'Active', salary: 25000, joinedDate: new Date().toISOString().split('T')[0], skills: '', attendanceRate: 100, gender: 'Female', hospitalName: activeHospital?.name || '', departmentName: activeHospital?.department || '', hospitalId: activeHospital?.hospital_unique_number || '' });
  const [formPlan, setFormPlan] = useState({ title: '', department: 'Midwifery', objective: '', assignedTo: '', targetDate: '', priority: 'Medium', status: 'Planned', progress: 0, hospitalName: activeHospital?.name || '', departmentName: activeHospital?.department || '', hospitalId: activeHospital?.hospital_unique_number || '' });
  const [formEval, setFormEval] = useState({ employeeId: '', employeeName: '', department: 'Midwifery', evaluator: '', period: 'Q1 2026', qualityScore: 85, efficiencyScore: 85, teamworkScore: 85, overallGrade: 'B', remarks: '', hospitalName: activeHospital?.name || '', departmentName: activeHospital?.department || '', hospitalId: activeHospital?.hospital_unique_number || '' });
  const [formCap, setFormCap] = useState({ programName: '', topic: '', instructor: '', startDate: '', endDate: '', participantsCount: 10, budget: 20000, status: 'Upcoming', hospitalName: activeHospital?.name || '', departmentName: activeHospital?.department || '', hospitalId: activeHospital?.hospital_unique_number || '' });
  const [formAtt, setFormAtt] = useState({ employeeId: '', employeeName: '', date: new Date().toISOString().split('T')[0], status: 'Present', checkInTime: '08:00', checkOutTime: '17:00', overtimeHrs: 0, hospitalName: activeHospital?.name || '', departmentName: activeHospital?.department || '', hospitalId: activeHospital?.hospital_unique_number || '' });
  const [formLearn, setFormLearn] = useState({ employeeId: '', employeeName: '', currentQualification: 'Diploma', targetQualification: 'BSc in Midwifery', program: '', institution: '', sponsor: 'Hospital Sponsored', expectedGradDate: '', status: 'Enrolled', hospitalName: activeHospital?.name || '', departmentName: activeHospital?.department || '', hospitalId: activeHospital?.hospital_unique_number || '' });
  const [formEmploy, setFormEmploy] = useState({ candidateName: '', department: 'Midwifery', roleApplied: '', yearsOfExperience: 3, interviewDate: '', stage: 'Applied', score: 80, interviewer: '', hospitalName: activeHospital?.name || '', departmentName: activeHospital?.department || '', hospitalId: activeHospital?.hospital_unique_number || '' });

  const handleLanguageChange = async (lang: Language) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'user_settings', user.uid), { language: lang }, { merge: true });
        addToast('success', `✓ Language updated to ${LANGUAGES.find(l => l.code === lang)?.name}`);
      } else {
        // Fallback to localStorage if no user
        localStorage.setItem('app_language', lang);
        window.location.reload(); // Hard reload to apply translations if no auth listener is active
      }
    } catch (err) {
      addToast('error', 'Failed to update language preference.');
    }
  };

  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // --- GRAPH STATS ---
  const getDeptData = () => {
    const counts: any = {};
    depts.forEach(d => { counts[d] = 0; });
    staff.forEach(s => { if (counts[s.department] !== undefined) counts[s.department]++; });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] })).filter(x => x.value > 0);
  };

  const getSchedules = () => {
    return [
      { name: 'Active Directory', count: staff.length, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
      { name: 'Action Plans', count: actionPlans.length, icon: Target, color: 'text-emerald-600 bg-emerald-50' },
      { name: 'Evaluations', count: performanceEvals.length, icon: Award, color: 'text-amber-600 bg-amber-50' },
      { name: 'Capacity Program', count: capacityPrograms.length, icon: BookOpen, color: 'text-violet-600 bg-violet-50' },
      { name: 'Daily Attendance', count: attendanceRecords.length, icon: Calendar, color: 'text-sky-600 bg-sky-50' },
      { name: 'Learning & Edu', count: learningUpgrades.length, icon: GraduationCap, color: 'text-rose-600 bg-rose-50' },
      { name: 'Recruits Pipeline', count: newEmployments.length, icon: UserPlus, color: 'text-teal-600 bg-teal-50' },
      { name: 'Training Log', count: trainingCount, icon: ClipboardList, color: 'text-indigo-600 bg-indigo-50' },
      { name: 'Clearance Log', count: clearanceCount, icon: ShieldAlert, color: 'text-rose-600 bg-rose-50' },
      { name: 'Leave Log', count: leaveCount, icon: Calendar, color: 'text-amber-600 bg-amber-50' },
      { name: 'Motivation Log', count: motivationCount, icon: Sparkles, color: 'text-violet-600 bg-violet-50' },
      { name: 'Sick Leaves', count: sickLeaveCount, icon: Activity, color: 'text-rose-600 bg-rose-50' }
    ];
  };

  const filterList = (arr: any[], searchKeys: string[]) => {
    const gsLower = (globalSearch || '').toLowerCase();
    const sqLower = (searchQuery || '').toLowerCase();
    return arr.filter(item => {
      const matchesGlobal = !globalSearch || 
        ['fullName', 'employeeId', 'department', 'jobTitle'].some(key => {
          const val = item[key];
          return val && val.toString().toLowerCase().includes(gsLower);
        });

      const matchesSearch = searchKeys.some(key => {
        const val = item[key];
        return val && val.toString().toLowerCase().includes(sqLower);
      });
      const matchesDept = deptFilter === 'All' || item.department === deptFilter;
      return matchesGlobal && matchesSearch && matchesDept;
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      {/* HEADER BANNER */}
      <div className="bg-white p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
              <Users className="text-white animate-pulse" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {translate('Module 7: Human Resource Management', currentLanguage)}
                <Sparkles size={18} className="text-amber-500 fill-amber-500" />
              </h3>
              <p className="text-slate-500 text-sm font-medium mt-0.5 max-w-2xl">
                Unified hospital registry with integrated workflows for all department medical, supportive staff and custom depts.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* LANGUAGE SELECTOR */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleGlobalCleanup}
                className="flex items-center gap-2 px-3 py-2 border border-rose-100 rounded-xl bg-rose-50/50 hover:bg-rose-100 transition-all text-[10px] font-black text-rose-600 uppercase tracking-tighter"
                title="Global Data Integrity Purge"
              >
                <ShieldAlert size={14} />
                Guard
              </button>

              <div className="relative">
              <button 
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl bg-white shadow-sm hover:bg-slate-50 transition-all text-xs font-bold text-slate-700"
              >
                <Globe size={14} className="text-indigo-600" />
                {LANGUAGES.find(l => l.code === currentLanguage)?.nativeName || 'Language'}
                <ChevronDown size={12} className={`transition-transform duration-200 ${showLangDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showLangDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1"
                  >
                    <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            handleLanguageChange(lang.code);
                            setShowLangDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs hover:bg-slate-50 transition-colors ${
                            currentLanguage === lang.code ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <div>
                              <p className="font-bold">{lang.nativeName}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{lang.name}</p>
                            </div>
                          </div>
                          {currentLanguage === lang.code && <Check size={14} className="text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

            {/* GLOBAL SEARCH HUB */}
            <div className="relative group min-w-[280px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Global Staff Search (Name, Role, Dept)..." 
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-bold transition-all shadow-inner"
              />
            </div>
            
            {/* DYNAMIC CUSTOM DEPARTMENT ADDER */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-gray-200">
            <FolderPlus size={16} className="text-indigo-600" />
            <input 
              type="text" 
              placeholder="Add Custom Dept..." 
              value={newDeptInput}
              onChange={(e) => setNewDeptInput(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded bg-white w-32 focus:ring-1 focus:ring-indigo-500"
            />
            <button 
              onClick={handleAddCustomDept}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-2.5 py-1 rounded transition-colors"
            >
              + Register
            </button>
          </div>
        </div>
      </div>

        {/* SUB NAVIGATION TAB BAR */}
        <div className="flex flex-wrap items-center gap-1.5 mt-6 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', label: translate('Overview', currentLanguage), icon: TrendingUp },
            { id: 'directory', label: translate('Staff Directory', currentLanguage), icon: Users },
            { id: 'active_staff', label: 'F-AS - Active Staff', icon: UserCheck },
            { id: 'documents', label: translate('Documents', currentLanguage), icon: FileText },
            { id: 'reports', label: 'F-RP - Report Folder', icon: ClipboardList },
            { id: 'upload', label: 'Upload', icon: Upload },
            { id: 'activity', label: translate('Audit Logs', currentLanguage), icon: ShieldCheck },
            { id: 'action_plans', label: translate('Action Plans', currentLanguage), icon: Target },
            { id: 'performance', label: translate('Performance', currentLanguage), icon: Award },
            { id: 'capacity', label: translate('Capacity', currentLanguage), icon: BookOpen },
            { id: 'attendance', label: 'Attendance Log', icon: Clock },
            { id: 'shifts', label: 'Duty Roster', icon: Calendar, permission: 'HR Manager' },
            { id: 'handovers', label: 'Shift Handover', icon: RefreshCw },
            { id: 'compliance', label: 'Compliance Report', icon: TrendingUp, permission: 'HR Manager' },
            { id: 'learning', label: translate('Learning', currentLanguage), icon: GraduationCap },
            { id: 'new_employment', label: translate('Recruitment', currentLanguage), icon: UserPlus },
            { id: 'training_attendance', label: translate('Training', currentLanguage), icon: ClipboardList },
            { id: 'clearance', label: translate('Clearance', currentLanguage), icon: ShieldAlert },
            { id: 'leave', label: translate('Leave', currentLanguage), icon: Calendar },
            { id: 'motivation', label: translate('Motivation', currentLanguage), icon: Sparkles },
            { id: 'sick_leave', label: translate('Sick Leave', currentLanguage), icon: Activity },
            { id: 'analytics', label: translate('Analytics', currentLanguage), icon: TrendingUp },
            { id: 'checklist', label: 'New Hire Checklist', icon: Check, permission: 'HR Manager' },
            { id: 'templates', label: 'Template Library', icon: FileText, permission: 'HR Admin' },
            { id: 'requests', label: 'Attendance Requests', icon: Bell, permission: 'HR Manager' },
            { id: 'settings', label: 'Settings', icon: Settings, permission: 'HR Admin' }
          ].filter(tab => !tab.permission || hasPermission(tab.permission as any)).map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as TabId); setIsAdding(false); setEditingId(null); }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* WORKSPACE AREA */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* STATS OVERVIEW PANEL */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-12 gap-3">
          {getSchedules().map((sc, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sc.name.split(' ')[0]}</span>
                <div className={`p-1.5 rounded-lg ${sc.color}`}>
                  <sc.icon size={14} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-xl font-black text-slate-900 block">{sc.count}</span>
                <span className="text-[9px] text-slate-400 font-medium">Synced Cloud Logs</span>
              </div>
            </div>
          ))}
        </div>

        {/* SEARCH AND ADD CONTROLS (Only for directory and attendance) */}
        {(activeTab === 'directory' || activeTab === 'attendance') && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 flex-col md:flex-row gap-3 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search current logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-gray-200 bg-slate-50/50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="font-bold text-slate-400 uppercase mr-1">Filter Dept:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="border border-gray-200 bg-slate-50 rounded-lg py-1 px-2 font-medium focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Departments</option>
                  {depts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
            >
              {isAdding ? <X size={14} /> : <Plus size={14} />}
              {isAdding ? 'Cancel Form' : 'Register New'}
            </button>
          </div>
        )}

        {/* --- DYNAMIC SECTIONS HANDLER --- */}
        <AnimatePresence mode="wait">
          {/* 0. DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* External Action Plan Upload */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1">
                <HRManualUpload />
              </div>

              {/* Advanced HR Folder Management */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1">
                <HRFolderManager hospital_id={hospital_id} />
              </div>
            </motion.div>
          )}

          {/* 1.5 PERSONNEL DOCUMENTS HUB */}
          {activeTab === 'documents' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filterList(staff, ['fullName', 'employeeId']).map(s => (
                <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      {s.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <button 
                      onClick={() => setSelectedStaffForFolder(s)}
                      className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <FolderPlus size={18} />
                    </button>
                  </div>
                  <h4 className="font-black text-slate-800 text-sm truncate">{s.fullName}</h4>
                  <p className="text-[10px] font-bold text-slate-400 font-mono">{s.employeeId}</p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold text-slate-400">{translate('Documents', currentLanguage)}</span>
                      <span className="font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                        {staffDocuments.filter(d => d.employeeId === s.employeeId).length} Filed
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold text-slate-400">{translate('Department', currentLanguage)}</span>
                      <span className="font-bold text-slate-600 truncate max-w-[100px]">{s.department}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedStaffForFolder(s)}
                    className="w-full mt-4 py-2 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <FileText size={12} />
                    {translate('Open Personal Folder', currentLanguage)}
                  </button>
                </div>
              ))}
            </motion.div>
          )}

          {/* 1.6 SYSTEM ACTIVITY LOGS */}
          {activeTab === 'activity' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-indigo-600" />
                    {translate('Audit Logs', currentLanguage)}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 italic">Tracking all sensitive record modifications for compliance</p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrator</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Table</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {activityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center text-slate-300">
                          <Info size={40} className="mx-auto mb-4 opacity-20" />
                          <p className="font-bold text-xs uppercase tracking-widest">No activity records found</p>
                        </td>
                      </tr>
                    ) : (
                      activityLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-[10px] font-bold text-slate-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">AD</div>
                              <span className="text-[10px] font-black text-slate-700">{log.userEmail}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              log.action === 'Created' ? 'bg-emerald-100 text-emerald-700' :
                              log.action === 'Updated' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-slate-400 font-mono">{log.tableName}</td>
                          <td className="px-6 py-4 text-[11px] text-slate-600 italic">{log.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* 1. DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Search staff..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  className="w-full p-3 border border-slate-200 rounded-xl"
                />
              </div>
              {isAdding && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Plus size={14} className="text-indigo-600" /> Enroll Clinical Personnel
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Employee ID*</label>
                      <input type="text" placeholder="e.g. EMP-120" value={formStaff.employeeId} onChange={e => setFormStaff({...formStaff, employeeId: e.target.value})} className="w-full p-2 border border-slate-200 rounded" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Full Name*</label>
                      <input type="text" placeholder="e.g. Sister Aster Demeke" value={formStaff.fullName} onChange={e => setFormStaff({...formStaff, fullName: e.target.value})} className="w-full p-2 border border-slate-200 rounded" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Department</label>
                      <select value={formStaff.department} onChange={e => setFormStaff({...formStaff, department: e.target.value})} className="w-full p-2 border border-slate-200 rounded">
                        {depts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    {formStaff.department === 'Other' && (
                      <div className="md:col-span-2">
                        <label className="block font-bold text-slate-500 mb-1">Other Specific Department (Required)*</label>
                        <input type="text" placeholder="Enter specific department or specialty" value={customDepartment} onChange={e => setCustomDepartment(e.target.value)} className="w-full p-2 border border-indigo-300 rounded bg-indigo-50/30" required />
                      </div>
                    )}
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Job Title*</label>
                      <input type="text" placeholder="e.g. Midwife Ward Lead" value={formStaff.jobTitle} onChange={e => setFormStaff({...formStaff, jobTitle: e.target.value})} className="w-full p-2 border border-slate-200 rounded" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Gender</label>
                      <select value={formStaff.gender} onChange={e => setFormStaff({...formStaff, gender: e.target.value as any})} className="w-full p-2 border border-slate-200 rounded">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Employment Type</label>
                      <select value={formStaff.employmentType} onChange={e => setFormStaff({...formStaff, employmentType: e.target.value})} className="w-full p-2 border border-slate-200 rounded">
                        <option>Full-time</option><option>Part-time</option><option>Contract</option><option>On-call</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Salary (ETB)</label>
                      <input type="number" value={formStaff.salary} onChange={e => setFormStaff({...formStaff, salary: Number(e.target.value)})} className="w-full p-2 border border-slate-200 rounded" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-bold text-slate-500 mb-1">Special Clinical Skills / Qualifications</label>
                      <input type="text" placeholder="e.g. EmONC Certified, Pediatric Care" value={formStaff.skills} onChange={e => setFormStaff({...formStaff, skills: e.target.value})} className="w-full p-2 border border-slate-200 rounded" />
                    </div>
                  </div>
                  <button onClick={() => {
                    const finalDept = formStaff.department === 'Other' ? customDepartment.trim() : formStaff.department;
                    if (formStaff.department === 'Other' && !finalDept) {
                      addToast('error', 'Please specify the other department (required).');
                      return;
                    }
                    handleCreate('hr_staff_registry', { ...formStaff, department: finalDept });
                  }} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded">
                    Enroll Active Staff Member
                  </button>
                </motion.div>
              )}

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase font-black tracking-wider">
                        <th className="py-3 px-4">Employee ID</th>
                        <th className="py-3 px-4">Full Name</th>
                        <th className="py-3 px-4">Gender</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Job Title</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Salary</th>
                        <th className="py-3 px-4">Att Rate</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filterList(staff, ['fullName', 'employeeId', 'jobTitle']).map(s => {
                        const isEditing = editingId === s.id;
                        const lastActivity = s.lastUpdated || s.joinedDate;
                        const isPendingAction = lastActivity ? (new Date().getTime() - new Date(lastActivity).getTime()) / (1000 * 3600 * 24) > 180 : false;
                        
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                              <div className="flex items-center gap-2">
                                {s.employeeId}
                                {isPendingAction && (
                                  <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" title="Pending Action: Over 180 days since last update"></span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-900 font-bold">
                              <div className="flex flex-col">
                                {isEditing ? <input type="text" value={editFormData.fullName || ''} onChange={e => setEditFormData({...editFormData, fullName: e.target.value})} className="border p-1 rounded" /> : s.fullName}
                                {isPendingAction && <span className="text-[9px] text-rose-500 font-black uppercase mt-0.5 animate-pulse">Pending Review</span>}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {isEditing ? (
                                <select value={editFormData.gender || ''} onChange={e => setEditFormData({...editFormData, gender: e.target.value as any})} className="border p-1 rounded">
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </select>
                              ) : <span className="text-slate-500">{s.gender}</span>}
                            </td>
                            <td className="py-3 px-4">
                              {isEditing ? (
                                <select value={editFormData.department || ''} onChange={e => setEditFormData({...editFormData, department: e.target.value})} className="border p-1 rounded">
                                  {depts.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                              ) : <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{s.department}</span>}
                            </td>
                            <td className="py-3 px-4">
                              {isEditing ? <input type="text" value={editFormData.jobTitle || ''} onChange={e => setEditFormData({...editFormData, jobTitle: e.target.value})} className="border p-1 rounded" /> : s.jobTitle}
                            </td>
                            <td className="py-3 px-4">{s.employmentType}</td>
                            <td className="py-3 px-4 font-mono font-bold">
                              {isEditing ? <input type="number" value={editFormData.salary || 0} onChange={e => setEditFormData({...editFormData, salary: Number(e.target.value)})} className="border p-1 rounded w-20" /> : hasPermission('HR Manager') ? `${s.salary?.toLocaleString()} ETB` : '**** ETB'}
                            </td>
                            <td className="py-3 px-4 font-mono text-emerald-600 font-bold">{s.attendanceRate}%</td>
                            <td className="py-3 px-4 text-right">
                              {isEditing ? (
                                <div className="flex justify-end gap-1">
                                  <button onClick={() => handleSave('hr_staff_registry', s.id, editFormData)} className="p-1 text-emerald-600"><Check size={14} /></button>
                                  <button onClick={() => setEditingId(null)} className="p-1 text-slate-400"><X size={14} /></button>
                                </div>
                              ) : (
                              <div className="flex justify-end gap-2 items-center">
                                <button 
                                  onClick={() => { setSelectedStaffForFolder(s); setIsAddingDoc(false); setEditingDocId(null); }} 
                                  className="p-1 px-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg flex items-center gap-1 transition-all font-bold text-[10px]"
                                  title="Staff Personal Folder"
                                >
                                  <FolderPlus size={13} />
                                  <span>Folder</span>
                                </button>
                                <button onClick={() => { setEditingId(s.id); setEditFormData(s); }} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit Staff"><Edit2 size={13} /></button>
                                {hasPermission('HR Admin') && <button onClick={() => handleDelete('hr_staff_registry', s.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg" title="Delete Staff"><Trash2 size={13} /></button>}
                              </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. ACTION PLANS */}
          {activeTab === 'action_plans' && (
            <HRActionPlans hospital_id={hospital_id} addToast={addToast} currentLanguage={currentLanguage} />
          )}

          {/* 3. PERFORMANCE & EVALUATION */}
          {activeTab === 'performance' && (
            <HRPerformance hospital_id={hospital_id} addToast={addToast} />
          )}

          {/* 4. CAPACITY BUILDING & WORKSHOPS */}
          {activeTab === 'capacity' && (
            <HRCapacityBuilding hospital_id={hospital_id} addToast={addToast} />
          )}

          {/* 5. ATTENDANCE LOG */}
          {activeTab === 'attendance' && (
            <AttendanceLog 
              attendance={attendanceRecords}
              staff={staff}
              shifts={masterShifts}
              handovers={handovers}
              onAddLog={(data) => handleCreate('hr_attendance_registry', data)}
              loading={loading}
              activeHospital={activeHospital}
              addToast={addToast}
              isHRManager={true}
            />
          )}

          {/* 13. MASTER DUTY ROSTER */}
          {activeTab === 'shifts' && (
            <MasterDutyRoster 
              shifts={masterShifts}
              staff={staff}
              onAddShift={(data) => handleCreate('hr_master_shifts', data)}
              onUpdateStatus={(id, status) => handleSave('hr_master_shifts', id, { status })}
              onDeleteShift={(id) => handleDelete('hr_master_shifts', id)}
              loading={loading}
            />
          )}

          {/* NEW: STAFF HANDOVER */}
          {activeTab === 'handovers' && (
            <StaffHandover 
              handovers={handovers}
              staff={staff}
              onAddHandover={(data) => handleCreate('hr_handovers', data)}
              loading={loading}
            />
          )}

          {/* NEW: COMPLIANCE REPORT */}
          {activeTab === 'compliance' && (
            <ShiftComplianceReport 
              reports={complianceReports}
              onAddReport={(data) => handleCreate('hr_compliance_reports', data)}
              loading={loading}
            />
          )}

          {/* 6. UPGRADE EDUCATION LOGS */}
          {activeTab === 'learning' && (
            <HRCapacityBuilding hospital_id={hospital_id} addToast={addToast} />
          )}

          {/* 7. NEW HIRING PIPELINE */}
          {activeTab === 'new_employment' && (
            <HRRecruitment hospital_id={hospital_id} addToast={addToast} />
          )}

          {/* 8. TRAINING ATTENDANCE */}
          {activeTab === 'training_attendance' && (
            <HRTrainingAttendance hospital_id={hospital_id} addToast={addToast} />
          )}

          {/* 9. EMPLOYEE CLEARANCE */}
          {activeTab === 'clearance' && (
            <HRClearance hospital_id={hospital_id} addToast={addToast} />
          )}

          {/* 10. LEAVE REGISTRY */}
          {activeTab === 'leave' && (
            <HRLeave hospital_id={hospital_id} addToast={addToast} />
          )}

          {/* 11. STAFF MOTIVATION & RECOGNITION */}
          {activeTab === 'motivation' && (
            <HRMotivation hospital_id={hospital_id} addToast={addToast} />
          )}

          {/* 12. VERIFIED SICK LEAVES */}
          {activeTab === 'sick_leave' && (
            <HRSickLeave hospital_id={hospital_id} addToast={addToast} />
          )}

          {/* 8. ANALYTICS CHARTING */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button onClick={generatePDF} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">
                  Generate PDF Report
                </button>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center py-12">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Analytics charts have been deleted as requested.</p>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* 13. MASTER DUTY ROSTER MOVED ABOVE */}

        {/* 14. NEW HIRE CHECKLIST */}
        {activeTab === 'checklist' && <HROnboardingTimeline staffId="TENANT-ID" />}

        {/* 15. TEMPLATE LIBRARY */}
        {activeTab === 'templates' && <HRTemplateEditor />}

        {/* 16. REQUESTS */}
        {activeTab === 'requests' && <HRNotificationSettings hospital_id={hospital_id} addToast={addToast} />}

        {/* 17. SETTINGS */}
        {activeTab === 'settings' && <HRNotificationSettings hospital_id={hospital_id} addToast={addToast} />}
        
        {/* 17. MANUAL UPLOAD */}
        {activeTab === 'upload' && <HRManualUpload />}

        {/* 18. REPORTS FOLDER */}
        {activeTab === 'reports' && <HRReportFolder />}

        {/* 19. ACTIVE STAFF FOLDER */}
        {activeTab === 'active_staff' && <HRActiveStaffFolder staff={staff} />}

        {/* --- STAFF PERSONAL FOLDER OVERLAY --- */}
        <AnimatePresence>
          {selectedStaffForFolder && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-6"
              onClick={() => setSelectedStaffForFolder(null)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Left Side: Employee Bio Banner */}
                <div className="md:w-1/3 bg-slate-50 border-r border-slate-200 p-6 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider mb-2">
                          Active Staff Folder
                        </span>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{selectedStaffForFolder.fullName}</h3>
                        <p className="text-xs font-bold text-slate-400 font-mono mt-0.5">{selectedStaffForFolder.employeeId}</p>
                      </div>
                      {/* Circle avatar */}
                      <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg shadow-inner border border-indigo-200 shrink-0">
                        {selectedStaffForFolder.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>

                    {/* Core details list */}
                    <div className="space-y-3.5 border-t border-b border-slate-200 py-5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Department</span>
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{selectedStaffForFolder.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Job Title</span>
                        <span className="font-bold text-slate-700">{selectedStaffForFolder.jobTitle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Employment Type</span>
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{selectedStaffForFolder.employmentType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Base Salary</span>
                        <span className="font-bold font-mono text-slate-700">{selectedStaffForFolder.salary?.toLocaleString()} ETB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Enrollment Date</span>
                        <span className="font-bold font-mono text-slate-600">{selectedStaffForFolder.joinedDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Attendance Rate</span>
                        <span className="font-bold text-emerald-600 font-mono">{selectedStaffForFolder.attendanceRate}%</span>
                      </div>
                    </div>

                    {/* Skills tags */}
                    <div>
                      <h5 className="font-black text-slate-400 text-[10px] uppercase tracking-wider mb-2">Core Competencies & Tags</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedStaffForFolder.skills.split(',').map((skill, idx) => (
                          <span key={idx} className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer notes */}
                  <div className="mt-8 pt-4 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed">
                    <p>Staff Personal Folder system manages credential audit and professional qualification tracking to meet regional hospital accreditation requirements.</p>
                  </div>
                </div>

                {/* Right Side: Professional Documents List & Form */}
                <div className="flex-1 flex flex-col h-full bg-white min-w-0">
                  {/* Right Side Header */}
                  <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                        <FileText size={18} className="text-emerald-600" />
                        Professional Documents Subset
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Manage diplomas, medical licenses, specialties, and service agreements
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isAddingDoc && !editingDocId && (
                        <button 
                          onClick={() => {
                            setIsAddingDoc(true);
                            setDocForm({
                              documentType: 'License',
                              documentName: '',
                              documentNumber: '',
                              issuingBody: '',
                              issueDate: '',
                              expiryDate: '',
                              status: 'Pending Review',
                              notes: ''
                            });
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-colors"
                        >
                          <Plus size={14} />
                          Add Qualification
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedStaffForFolder(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Right Side Scroll Content */}
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {/* DOCUMENT FORM: ADD OR EDIT */}
                    {(isAddingDoc || editingDocId) ? (
                      <motion.form 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={editingDocId ? handleUpdateDocument : handleAddDocument}
                        className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs max-w-2xl mx-auto"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                          <h5 className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            {editingDocId ? <Edit2 size={13} className="text-indigo-600" /> : <Plus size={13} className="text-emerald-600" />}
                            {editingDocId ? 'Modify Document Details' : 'Register Professional Document'}
                          </h5>
                          <button 
                            type="button"
                            onClick={() => {
                              setIsAddingDoc(false);
                              setEditingDocId(null);
                            }}
                            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                          >
                            Back to List
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block font-bold text-slate-500 mb-1">Document Type*</label>
                            <select 
                              value={docForm.documentType} 
                              onChange={e => setDocForm({...docForm, documentType: e.target.value as any})}
                              className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 bg-white"
                            >
                              <option value="License">Practice License</option>
                              <option value="Degree/Diploma">Academic Degree / Diploma</option>
                              <option value="Specialty Certification">Clinical Specialty Certification</option>
                              <option value="Contract">Employment Contract / NDA</option>
                              <option value="ID/Background">Identification & Background Checks</option>
                              <option value="Other">Other Qualifications</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-500 mb-1">Document Name / Title*</label>
                            <input 
                              type="text" 
                              placeholder="e.g. License of General Medicine" 
                              value={docForm.documentName} 
                              onChange={e => setDocForm({...docForm, documentName: e.target.value})}
                              className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-500 mb-1">Document / Serial Number*</label>
                            <input 
                              type="text" 
                              placeholder="e.g. AAU-MD-1024-2022" 
                              value={docForm.documentNumber} 
                              onChange={e => setDocForm({...docForm, documentNumber: e.target.value})}
                              className="w-full p-2 border border-slate-200 rounded font-mono focus:ring-1 focus:ring-emerald-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-500 mb-1">Issuing Board / University*</label>
                            <input 
                              type="text" 
                              placeholder="e.g. National Health Board, AAU" 
                              value={docForm.issuingBody} 
                              onChange={e => setDocForm({...docForm, issuingBody: e.target.value})}
                              className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-500 mb-1">Issue Date*</label>
                            <input 
                              type="date" 
                              value={docForm.issueDate} 
                              onChange={e => setDocForm({...docForm, issueDate: e.target.value})}
                              className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-500 mb-1">Expiry Date (If applicable)</label>
                            <input 
                              type="date" 
                              value={docForm.expiryDate} 
                              onChange={e => setDocForm({...docForm, expiryDate: e.target.value})}
                              className={`w-full p-2 border rounded focus:ring-1 focus:ring-emerald-500 ${
                                docForm.expiryDate && docForm.issueDate && new Date(docForm.expiryDate) < new Date(docForm.issueDate)
                                  ? 'border-rose-500 bg-rose-50'
                                  : 'border-slate-200'
                              }`}
                            />
                            {docForm.expiryDate && docForm.issueDate && new Date(docForm.expiryDate) < new Date(docForm.issueDate) && (
                              <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                                <AlertTriangle size={10} /> Expiry date cannot be earlier than issue date.
                              </p>
                            )}
                          </div>

                          <div className="md:col-span-2">
                            <label className="block font-bold text-slate-500 mb-1">Verification Status</label>
                            <select 
                              value={docForm.status} 
                              onChange={e => setDocForm({...docForm, status: e.target.value as any})}
                              className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 bg-white"
                            >
                              <option value="Pending Review">Pending Review / Unchecked</option>
                              <option value="Verified">Verified / Approved</option>
                              <option value="Expired">Expired</option>
                              <option value="Flagged">Flagged / Audit Defect</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block font-bold text-slate-500 mb-1">Audit Notes & Remarks</label>
                            <textarea 
                              rows={3}
                              placeholder="Add registry lookups, physical scan verification, or compliance checklist notes..." 
                              value={docForm.notes} 
                              onChange={e => setDocForm({...docForm, notes: e.target.value})}
                              className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button 
                            type="button" 
                            onClick={() => {
                              setIsAddingDoc(false);
                              setEditingDocId(null);
                            }}
                            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded font-bold text-slate-500"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-black flex items-center gap-1.5 transition-colors"
                          >
                            <Check size={14} />
                            {editingDocId ? 'Save Changes' : 'Register Document'}
                          </button>
                        </div>
                      </motion.form>
                    ) : (
                      /* LIST OF REGISTERED DOCUMENTS */
                      <div className="space-y-4">
                        {staffDocuments.filter(d => d.employeeId === selectedStaffForFolder.employeeId).length === 0 ? (
                          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 space-y-4 max-w-md mx-auto shadow-sm">
                            <FileText size={40} className="mx-auto text-slate-300" />
                            <div>
                              <h5 className="font-black text-slate-800 text-xs uppercase tracking-widest">Folder Empty</h5>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                There are currently no professional credentials or qualifications registered inside this personal folder.
                              </p>
                            </div>
                            <button 
                              onClick={() => {
                                setIsAddingDoc(true);
                                setDocForm({
                                  documentType: 'License',
                                  documentName: '',
                                  documentNumber: '',
                                  issuingBody: '',
                                  issueDate: '',
                                  expiryDate: '',
                                  status: 'Pending Review',
                                  notes: ''
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-[11px] font-black rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              <Plus size={12} />
                              Add First Qualification
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {staffDocuments
                              .filter(d => d.employeeId === selectedStaffForFolder.employeeId)
                              .map(docItem => {
                                // Type matching icon
                                const getDocIcon = (type: string) => {
                                  switch (type) {
                                    case 'License': return <UserCheck size={18} className="text-teal-600" />;
                                    case 'Degree/Diploma': return <Award size={18} className="text-amber-500" />;
                                    case 'Specialty Certification': return <BookOpen size={18} className="text-indigo-600" />;
                                    case 'Contract': return <ClipboardList size={18} className="text-blue-500" />;
                                    case 'ID/Background': return <ShieldCheck size={18} className="text-emerald-600" />;
                                    default: return <FileText size={18} className="text-slate-500" />;
                                  }
                                };

                                // Check if expired
                                const isDocExpired = docItem.expiryDate && new Date(docItem.expiryDate) < new Date();

                                return (
                                  <motion.div 
                                    layout
                                    key={docItem.id}
                                    className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between gap-4 ${
                                      isDocExpired || docItem.status === 'Expired' 
                                        ? 'border-l-4 border-l-rose-500 border-slate-200' 
                                        : docItem.status === 'Flagged'
                                        ? 'border-l-4 border-l-orange-500 border-slate-200'
                                        : 'border-l-4 border-l-emerald-500 border-slate-200'
                                    }`}
                                  >
                                    {/* Left: icon & summary details */}
                                    <div className="flex gap-3.5 flex-1 items-start min-w-0">
                                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg shrink-0 mt-0.5">
                                        {getDocIcon(docItem.documentType)}
                                      </div>
                                      <div className="space-y-1.5 min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                                            {docItem.documentType}
                                          </span>
                                          <h5 className="font-black text-slate-800 text-xs truncate max-w-[240px] md:max-w-[400px]">
                                            {docItem.documentName}
                                          </h5>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                                          <div className="flex items-center gap-1 text-slate-500">
                                            <span className="font-bold">Doc #:</span>
                                            <span className="font-mono font-bold text-slate-700">{docItem.documentNumber}</span>
                                          </div>
                                          <div className="flex items-center gap-1 text-slate-500">
                                            <span className="font-bold">Issuer:</span>
                                            <span className="font-semibold text-slate-700 truncate max-w-[180px]" title={docItem.issuingBody}>{docItem.issuingBody}</span>
                                          </div>
                                          <div className="flex items-center gap-1 text-slate-500">
                                            <span className="font-bold">Issue Date:</span>
                                            <span className="font-mono text-slate-600">{docItem.issueDate}</span>
                                          </div>
                                          {docItem.expiryDate && (
                                            <div className={`flex items-center gap-1 ${isDocExpired ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                                              <span className="font-bold">Expiry:</span>
                                              <span className="font-mono">{docItem.expiryDate}</span>
                                              {isDocExpired && <span className="text-[8px] bg-rose-50 text-rose-600 border border-rose-100 px-1 rounded uppercase tracking-wider ml-1">Expired</span>}
                                            </div>
                                          )}
                                        </div>

                                        {/* Notes section if exists */}
                                        {docItem.notes && (
                                          <div className="bg-slate-50 border border-slate-100 rounded p-2 text-[11px] text-slate-500 flex gap-1 items-start mt-2">
                                            <Info size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                            <p className="leading-relaxed italic">{docItem.notes}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Right: Status badge & actions */}
                                    <div className="flex flex-row md:flex-col justify-between items-end gap-3 shrink-0">
                                      {/* Verification Badge */}
                                      <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 ${
                                        docItem.status === 'Verified' 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                          : docItem.status === 'Pending Review' 
                                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                          : docItem.status === 'Expired' || isDocExpired
                                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                                          : 'bg-orange-50 text-orange-700 border-orange-200'
                                      }`}>
                                        {isDocExpired ? 'Expired' : docItem.status}
                                      </span>

                                      {/* Actions button block */}
                                      <div className="flex gap-1">
                                        <button 
                                          onClick={() => handleToggleVerifyDocument(docItem.id!, docItem.status)}
                                          className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border transition-colors ${
                                            docItem.status === 'Verified'
                                              ? 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200'
                                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                                          }`}
                                          title={docItem.status === 'Verified' ? "Revert to Pending" : "Mark as Verified"}
                                        >
                                          {docItem.status === 'Verified' ? 'Revoke' : 'Verify'}
                                        </button>
                                        <button 
                                          onClick={() => {
                                            setEditingDocId(docItem.id!);
                                            setDocForm({
                                              documentType: docItem.documentType,
                                              documentName: docItem.documentName,
                                              documentNumber: docItem.documentNumber,
                                              issuingBody: docItem.issuingBody,
                                              issueDate: docItem.issueDate,
                                              expiryDate: docItem.expiryDate || '',
                                              status: docItem.status,
                                              notes: docItem.notes || ''
                                            });
                                          }}
                                          className="p-1 text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded hover:border-indigo-200 transition-colors"
                                          title="Edit"
                                        >
                                          <Edit2 size={13} />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteDocument(docItem.id!)}
                                          className="p-1 text-rose-500 hover:bg-rose-50 border border-slate-200 rounded hover:border-rose-200 transition-colors"
                                          title="Delete"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
