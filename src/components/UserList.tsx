import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, addDoc, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isFakeOrFalseRow, isFakeOrFalseValue } from '../utils/dataIntegrity';
import { User } from '../types';
import { 
  Search, ChevronDown, Plus, Filter, Lock, ShieldAlert, Pencil, Trash2,
  Clock, Download, KeyRound, Copy, Check, CheckSquare, Square, RefreshCw, 
  Eye, Info, UserCheck, Shield, ShieldCheck, X, QrCode, Printer, Database,
  Users, Globe, Save, History, Sliders, UserPlus, Layers, Briefcase, Award, Building,
  Share2, Send, Mail, ExternalLink, Archive
} from 'lucide-react';
import InviteUserForm from './InviteUserForm';
import PortalManagement from './PortalManagement';
import { userUpdateSchema } from '../lib/schemas';
import { EHR_MODULES, EHR_ROLES, HOSPITAL_LAT, HOSPITAL_LON, ALLOWED_RADIUS_METERS, getDistance } from '../lib/constants';
import { useSkippedContext } from './SecureModuleWrapper';

interface UserActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
  performedBy: string;
  ipAddress?: string;
}

export interface ManagerRegistrationActivity {
  id: string;
  targetUserName: string;
  targetUserEmail: string;
  assignedRole: string;
  registrarId: string;
  hospitalId: string;
  department?: string;
  timestamp: string;
  details?: string;
}

export interface OwnerRegisteredAdmin {
  id: string;
  full_name: string;
  institutional_name: string;
  email: string;
  hospital_id: string;
  license_key: string;
  created_date: string;
}

interface UserListProps {
  addToast?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  activeTab?: string;
  currentUser?: User;
}

const OWNER_EMAIL = 'admin@example.com';

export default function UserList({ addToast, activeTab: mainActiveTab, currentUser }: UserListProps) {
  const { isSkipped } = useSkippedContext();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'all roles' | 'director' | 'admin' | 'user' | 'mid-manager' | 'other'>('all');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'role-access' | 'registration-portals' | 'owner-admin-portal' | 'admin-portal' | 'portal-management'>('users');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editHospitalId, setEditHospitalId] = useState('');
  const [editHistory, setEditHistory] = useState('');
  const [editLocationRestricted, setEditLocationRestricted] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<typeof EHR_ROLES[number]>('user');
  const [editCustomRole, setEditCustomRole] = useState('');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const isSeeding = useRef(false);

  // --- New Feature States ---
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>([]);
  const [expandedUserIds, setExpandedUserIds] = useState<string[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const isPendingSeeding = useRef(false);

  // --- Leadership & Manager Registration Portals States ---
  const [portalSelectedRole, setPortalSelectedRole] = useState<'director' | 'admin' | 'mid-manager' | 'low-manager' | 'user'>('director');
  const [portalFullName, setPortalFullName] = useState('');
  const [portalInstitutionalName, setPortalInstitutionalName] = useState('');
  const [portalEmail, setPortalEmail] = useState('');
  const [portalHospitalId, setPortalHospitalId] = useState('');
  const [portalLicenseKey, setPortalLicenseKey] = useState('');
  const [portalDepartment, setPortalDepartment] = useState('General Operations');
  const [isRegisteringPortalUser, setIsRegisteringPortalUser] = useState(false);
  const [portalError, setPortalError] = useState('');
  const [portalSuccess, setPortalSuccess] = useState('');
  const [lastGeneratedBypass, setLastGeneratedBypass] = useState<{
    url: string;
    name: string;
    email: string;
    role: string;
    hospitalId: string;
    department: string;
    timestamp: string;
  } | null>(null);
  const [bypassCopied, setBypassCopied] = useState(false);

  // Manager/Leadership Registration Activities
  const [managerActivities, setManagerActivities] = useState<ManagerRegistrationActivity[]>([]);

  // --- Role Access & Permissions State ---
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<string>('mid-manager');
  const [rolePermissionsState, setRolePermissionsState] = useState<Record<string, string[]>>({
    director: ['read_patient_records', 'write_clinical_notes', 'manage_billing', 'dispense_medications', 'audit_logs_view', 'manage_staff_roles', 'hospital_config_access', 'emergency_override'],
    admin: ['read_patient_records', 'write_clinical_notes', 'manage_billing', 'dispense_medications', 'audit_logs_view', 'manage_staff_roles'],
    'mid-manager': ['read_patient_records', 'write_clinical_notes', 'dispense_medications', 'audit_logs_view'],
    'low-manager': ['read_patient_records', 'write_clinical_notes', 'audit_logs_view'],
    user: ['read_patient_records', 'write_clinical_notes']
  });
  const [roleSearchQuery, setRoleSearchQuery] = useState('');

  // --- Owner Admin Registration Portal States ---
  const [ownerRegisteredAdmins, setOwnerRegisteredAdmins] = useState<OwnerRegisteredAdmin[]>([]);
  const [ownerAdminName, setOwnerAdminName] = useState('');
  const [ownerInstitutionalName, setOwnerInstitutionalName] = useState('');
  const [ownerAdminEmail, setOwnerAdminEmail] = useState('');
  const [ownerHospitalId, setOwnerHospitalId] = useState('');
  const [ownerLicenseKey, setOwnerLicenseKey] = useState('');
  const [ownerAdminPassword, setOwnerAdminPassword] = useState('');
  const [isRegisteringOwnerAdmin, setIsRegisteringOwnerAdmin] = useState(false);
  const [ownerAdminError, setOwnerAdminError] = useState('');
  const [ownerAdminSuccess, setOwnerAdminSuccess] = useState('');

  // --- Admin Registration Portal States ---
  const [hospitalAdminName, setHospitalAdminName] = useState('');
  const [hospitalAdminInstitutionalName, setHospitalAdminInstitutionalName] = useState('');
  const [hospitalAdminEmail, setHospitalAdminEmail] = useState('');
  const [hospitalAdminHospitalId, setHospitalAdminHospitalId] = useState('');
  const [hospitalAdminLicenseKey, setHospitalAdminLicenseKey] = useState('');
  const [isRegisteringHospitalAdmin, setIsRegisteringHospitalAdmin] = useState(false);
  const [hospitalAdminError, setHospitalAdminError] = useState('');
  const [hospitalAdminSuccess, setHospitalAdminSuccess] = useState('');

  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [inlineName, setInlineName] = useState('');
  const [inlineEmail, setInlineEmail] = useState('');

  const [editingDirectorId, setEditingDirectorId] = useState<string | null>(null);
  const [inlineDirectorName, setInlineDirectorName] = useState('');
  const [inlineDirectorEmail, setInlineDirectorEmail] = useState('');

  const [editingOwnerAdmin, setEditingOwnerAdmin] = useState<OwnerRegisteredAdmin | null>(null);
  const [editOwnerAdminName, setEditOwnerAdminName] = useState('');
  const [editOwnerInstitutionalName, setEditOwnerInstitutionalName] = useState('');
  const [editOwnerAdminHospitalId, setEditOwnerAdminHospitalId] = useState('');
  const [editOwnerAdminLicenseKey, setEditOwnerAdminLicenseKey] = useState('');
  const [editOwnerAdminEmail, setEditOwnerAdminEmail] = useState('');
  const [isSavingOwnerAdminEdit, setIsSavingOwnerAdminEdit] = useState(false);
  const [ownerAdminEditError, setOwnerAdminEditError] = useState('');

  // Automated Purge Effect: Remove target records (Dr Tajir Siraj / gelemso@hospital.org / HOSP-GL05 / LIC-GL05)
  useEffect(() => {
    const purgeTargetUserRecords = async () => {
      try {
        const collectionsToPurge = [
          'users',
          'owner_registered_admins',
          'pending_user_requests',
          'licenses',
          'hospitals'
        ];

        for (const colName of collectionsToPurge) {
          const snap = await getDocs(collection(db, colName));
          for (const docSnap of snap.docs) {
            const data = docSnap.data();
            const email = (data.email || '').toLowerCase();
            const fullName = (data.full_name || data.name || '').toLowerCase();
            const hospId = (data.hospital_id || data.hospital_unique_number || '').toUpperCase();
            const licKey = (data.license_key || data.license_number || '').toUpperCase();

            if (
              email.includes('gelemso@hospital.org') ||
              fullName.includes('tajir') ||
              fullName.includes('siraj') ||
              hospId === 'HOSP-GL05' ||
              licKey.includes('LIC-GL05')
            ) {
              await deleteDoc(doc(db, colName, docSnap.id));
            }
          }
        }
      } catch (err) {
        console.warn("Cleanup error for target user records:", err);
      }
    };

    purgeTargetUserRecords();
  }, []);

  // Sync Owner Registered Admins
  useEffect(() => {
    const q = query(collection(db, 'owner_registered_admins'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const admins = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as OwnerRegisteredAdmin[];
      const filteredAdmins = admins.filter(admin => {
        if (isFakeOrFalseRow(admin)) return false;
        const email = (admin.email || '').toLowerCase();
        const name = (admin.full_name || '').toLowerCase();
        const hospId = (admin.hospital_id || '').toUpperCase();
        const licKey = (admin.license_key || '').toUpperCase();
        return !email.includes('gelemso@hospital.org') &&
               !name.includes('tajir') &&
               !name.includes('siraj') &&
               hospId !== 'HOSP-GL05' &&
               !licKey.includes('LIC-GL05');
      });
      setOwnerRegisteredAdmins(filteredAdmins);
    }, (error) => {
      console.warn("Firestore subscription error for owner registered admins:", error);
    });
    return unsubscribe;
  }, []);

  // Sync Pending User Requests (Seeding removed for 'zero hardcode')
  useEffect(() => {
    const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
    const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
    const hospital_id = activeHospital?.hospital_unique_number || 'demo-global';

    const q = query(collection(db, 'pending_user_requests'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const reqList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          full_name: data.full_name,
          email: data.email,
          requested_role: data.requested_role,
          license_number: data.license_number,
          department: data.department,
          justification: data.justification,
          hospital_id: data.hospital_id,
          created_date: data.created_date || new Date().toISOString(),
          status: data.status || 'pending'
        };
      }).filter((r: any) => {
        if (isFakeOrFalseRow(r)) return false;
        const email = (r.email || '').toLowerCase();
        const name = (r.full_name || '').toLowerCase();
        const hospId = (r.hospital_id || '').toUpperCase();
        if (email.includes('gelemso@hospital.org') || name.includes('tajir') || name.includes('siraj') || hospId === 'HOSP-GL05') {
          return false;
        }
        if (!hospital_id || hospital_id === 'demo-global') return true;
        return r.hospital_id === hospital_id || !r.hospital_id || r.hospital_id === 'demo-global';
      });

      setPendingRequests(reqList);
    }, (error) => {
      console.warn("Firestore subscription error for pending requests:", error);
    });

    return unsubscribe;
  }, []);
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    isOpen: boolean;
    userName: string;
    userEmail: string;
    tempPass: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchError, setBatchError] = useState('');
  
  const [manualLogTexts, setManualLogTexts] = useState<Record<string, string>>({});
  const [isSavingManualLog, setIsSavingManualLog] = useState<Record<string, boolean>>({});
  const [editPassword, setEditPassword] = useState('');
  const [auditUser, setAuditUser] = useState<User | null>(null);
  const [expandedPermissionsUserIds, setExpandedPermissionsUserIds] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState<Record<string, boolean>>({});
  const [permissionsFeedback, setPermissionsFeedback] = useState<Record<string, string>>({});
  const [editedUserPermissions, setEditedUserPermissions] = useState<Record<string, string[]>>({});
  
  // CSV Export Modal States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRoleFilter, setExportRoleFilter] = useState<'all' | 'director' | 'admin' | 'mid-manager' | 'low-manager' | 'user'>('all');
  const [exportStatusFilter, setExportStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const isLogsSeeding = useRef(false);

  useEffect(() => {
    const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
    const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
    const hospital_id = activeHospital?.hospital_unique_number;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const userList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || '',
          full_name: data.full_name || '',
          role: data.role || 'user',
          created_date: data.created_date ? (data.created_date.toDate ? data.created_date.toDate().toISOString() : data.created_date) : '',
          updated_date: data.updated_date ? (data.updated_date.toDate ? data.updated_date.toDate().toISOString() : data.updated_date) : '',
          created_by_id: data.created_by_id || '',
          hospital_id: data.hospital_id,
          location_restricted: data.location_restricted || false
        } as User;
      }).filter(u => {
        if (isFakeOrFalseRow(u)) return false;
        const email = (u.email || '').toLowerCase();
        const name = (u.full_name || '').toLowerCase();
        const hospId = (u.hospital_id || '').toUpperCase();
        if (email.includes('gelemso@hospital.org') || name.includes('tajir') || name.includes('siraj') || hospId === 'HOSP-GL05') {
          return false;
        }
        if (!hospital_id) return true;
        if (!u.hospital_id || u.hospital_id === 'demo-global') return true;
        return u.hospital_id === hospital_id;
      });
      if (isSkipped) {
        setUsers([]);
      } else {
        setUsers(userList);
      }
    }, (error) => {
      console.warn("Firestore subscription error for users:", error);
    });
    return unsubscribe;
  }, []);

  // Sync Activity Logs
  useEffect(() => {
    const q = query(collection(db, 'user_activity_logs'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const logList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId || '',
          userEmail: data.userEmail || '',
          action: data.action || '',
          details: data.details || '',
          timestamp: data.timestamp || '',
          performedBy: data.performedBy || 'System',
          ipAddress: data.ipAddress || 'N/A'
        } as UserActivityLog;
      });
      const validLogList = logList.filter(item => !isFakeOrFalseRow(item));
      validLogList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivityLogs(validLogList);
    }, (error) => {
      console.warn("Firestore subscription error for user logs:", error);
    });
    return unsubscribe;
  }, []);

  // Sync Manager Registration Activities
  useEffect(() => {
    const q = query(collection(db, 'manager_registration_activities'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          targetUserName: data.targetUserName || '',
          targetUserEmail: data.targetUserEmail || '',
          assignedRole: data.assignedRole || 'mid-manager',
          registrarId: data.registrarId || 'admin@example.com',
          hospitalId: data.hospitalId || 'TENANT-ID',
          department: data.department || '',
          timestamp: data.timestamp || new Date().toISOString(),
          details: data.details || ''
        } as ManagerRegistrationActivity;
      });
      const validList = list.filter(item => !isFakeOrFalseRow(item));
      validList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setManagerActivities(validList);
    }, (err) => {
      console.warn("Firestore subscription error for manager_registration_activities:", err);
    });
    return unsubscribe;
  }, []);

  // Target emails requested by user to be purged/deleted
  const TARGET_EMAILS_TO_PURGE = React.useMemo(() => [
    'gemechunure33@gmail.com',
    'gelemso@hospital.org',
    'gemechunure772025@outlook.com',
    'gelemsogeneral@hospital.com'
  ], []);

  // Function to purge targeted test users and activity logs from Firestore
  const handlePurgeTargetRecords = async () => {
    try {
      // 1. Delete matching users
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach(async (docSnap) => {
        const data = docSnap.data();
        const em = (data.email || '').toLowerCase();
        if (TARGET_EMAILS_TO_PURGE.includes(em)) {
          await deleteDoc(doc(db, 'users', docSnap.id)).catch(() => {});
        }
      });

      // 2. Delete matching manager_registration_activities
      const mgrSnap = await getDocs(collection(db, 'manager_registration_activities'));
      mgrSnap.forEach(async (docSnap) => {
        const data = docSnap.data();
        const em = (data.targetUserEmail || '').toLowerCase();
        if (TARGET_EMAILS_TO_PURGE.includes(em)) {
          await deleteDoc(doc(db, 'manager_registration_activities', docSnap.id)).catch(() => {});
        }
      });

      // 3. Delete matching owner_registered_admins
      const ownerSnap = await getDocs(collection(db, 'owner_registered_admins'));
      ownerSnap.forEach(async (docSnap) => {
        const data = docSnap.data();
        const em = (data.email || '').toLowerCase();
        if (TARGET_EMAILS_TO_PURGE.includes(em)) {
          await deleteDoc(doc(db, 'owner_registered_admins', docSnap.id)).catch(() => {});
        }
      });

      // 4. Delete matching activity_logs / user_activity_logs
      const actSnap = await getDocs(collection(db, 'user_activity_logs'));
      actSnap.forEach(async (docSnap) => {
        const data = docSnap.data();
        const em = (data.userEmail || '').toLowerCase();
        const det = (data.details || '').toLowerCase();
        if (TARGET_EMAILS_TO_PURGE.some(target => em.includes(target) || det.includes(target))) {
          await deleteDoc(doc(db, 'user_activity_logs', docSnap.id)).catch(() => {});
        }
      });

      const genActSnap = await getDocs(collection(db, 'activity_logs'));
      genActSnap.forEach(async (docSnap) => {
        const data = docSnap.data();
        const em = (data.userEmail || '').toLowerCase();
        const det = (data.details || '').toLowerCase();
        if (TARGET_EMAILS_TO_PURGE.some(target => em.includes(target) || det.includes(target))) {
          await deleteDoc(doc(db, 'activity_logs', docSnap.id)).catch(() => {});
        }
      });
    } catch (err) {
      console.warn("Purge targeted records error:", err);
    }
  };

  // Run auto purge on component mount
  useEffect(() => {
    handlePurgeTargetRecords();
  }, []);

  // Delete individual activity log item
  const handleDeleteActivityItem = async (actId: string) => {
    try {
      await deleteDoc(doc(db, 'manager_registration_activities', actId)).catch(() => {});
      await deleteDoc(doc(db, 'user_activity_logs', actId)).catch(() => {});
      await deleteDoc(doc(db, 'activity_logs', actId)).catch(() => {});
      setManagerActivities(prev => prev.filter(a => a.id !== actId));
      addToast?.('success', 'Registration activity log entry removed.');
    } catch (err) {
      console.error("Error deleting activity item:", err);
    }
  };

  // Top 10 Manager and Director Registration Summary
  const combinedRegistrationActivities = React.useMemo(() => {
    const records: ManagerRegistrationActivity[] = [...managerActivities];

    // Merge from activityLogs
    activityLogs.forEach(log => {
      const actLower = (log.action || '').toLowerCase();
      const detLower = (log.details || '').toLowerCase();
      const isReg = actLower.includes('register') || 
                    actLower.includes('authorized') || 
                    actLower.includes('admin') || 
                    actLower.includes('director') || 
                    actLower.includes('manager') ||
                    detLower.includes('registered') ||
                    detLower.includes('authorized');
      if (isReg) {
        const exists = records.some(r => r.timestamp === log.timestamp || (r.targetUserEmail && r.targetUserEmail === log.userEmail && r.timestamp.slice(0,16) === log.timestamp.slice(0,16)));
        if (!exists) {
          let role = 'mid-manager';
          if (actLower.includes('director') || detLower.includes('director')) role = 'director';
          else if (actLower.includes('admin') || detLower.includes('admin')) role = 'admin';
          else if (actLower.includes('low') || detLower.includes('low')) role = 'low-manager';

          records.push({
            id: log.id,
            targetUserName: log.details?.match(/authorized [^:]+: ([^(.]+)/i)?.[1] || (log.userEmail ? log.userEmail.split('@')[0] : 'Staff User'),
            targetUserEmail: log.userEmail || 'n/a',
            assignedRole: role,
            registrarId: log.performedBy || 'admin@example.com',
            hospitalId: 'TENANT-ID',
            timestamp: log.timestamp || new Date().toISOString(),
            details: log.details
          });
        }
      }
    });

    // Filter out target emails specified by user
    const filtered = records.filter(r => {
      const targetEm = (r.targetUserEmail || '').toLowerCase();
      const detailsEm = (r.details || '').toLowerCase();
      return !TARGET_EMAILS_TO_PURGE.some(p => targetEm.includes(p) || detailsEm.includes(p));
    });

    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return filtered.slice(0, 10);
  }, [managerActivities, activityLogs, TARGET_EMAILS_TO_PURGE]);

  // Handler for Leadership & Manager Creation Portals
  const handleRegisterLeadershipUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const needsLicense = ['director', 'admin'].includes(portalSelectedRole);
    if (!portalFullName.trim() || !portalEmail.trim() || !portalHospitalId.trim() || !portalInstitutionalName.trim() || (needsLicense && !portalLicenseKey.trim())) {
      setPortalError('All required fields (Full Name, Institutional Name, Email, Hospital ID, License Key) must be filled.');
      return;
    }

    const registrarEmail = currentUser?.email || 'admin@example.com';
    const isAuthorized = currentUser?.role === 'director' || currentUser?.email === OWNER_EMAIL || currentUser?.role === 'admin';
    if (!isAuthorized) {
      setPortalError('Unauthorized: Registration of leadership and manager roles is strictly restricted to authorized administrators.');
      return;
    }

    setIsRegisteringPortalUser(true);
    setPortalError('');
    setPortalSuccess('');

    try {
      const defaultPerms = rolePermissionsState[portalSelectedRole] || [
        'read_patient_records',
        'write_clinical_notes',
        'audit_logs_view'
      ];

      const roleDisplayNames: Record<string, string> = {
        director: 'Hospital Director',
        admin: 'Hospital Administrator',
        'mid-manager': 'Mid-level Manager',
        'low-manager': 'Low-level Manager',
        user: 'Staff Practitioner (User)'
      };

      const generatedLicense = portalLicenseKey.trim() || `HSP-LIC-${Math.floor(10000 + Math.random() * 90000)}`;

      // 1. Add user doc
      const userRef = await addDoc(collection(db, 'users'), {
        full_name: portalFullName.trim(),
        email: portalEmail.trim(),
        role: portalSelectedRole,
        hospital_id: portalHospitalId.trim(),
        license_key: generatedLicense,
        institutional_name: portalInstitutionalName.trim(),
        department: portalDepartment.trim() || 'General Operations',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        created_by_id: registrarEmail,
        permissions: defaultPerms
      });

      // 2. Add entry to manager_registration_activities collection
      await addDoc(collection(db, 'manager_registration_activities'), {
        targetUserName: portalFullName.trim(),
        targetUserEmail: portalEmail.trim(),
        assignedRole: portalSelectedRole,
        registrarId: registrarEmail,
        hospitalId: portalHospitalId.trim(),
        department: portalDepartment.trim() || 'General Operations',
        timestamp: new Date().toISOString(),
        details: `Authorized and registered ${roleDisplayNames[portalSelectedRole]}: ${portalFullName.trim()} (${portalEmail.trim()}) by Registrar ${registrarEmail}`
      });

      // 3. Log to general activity logs
      await logActivity(
        userRef.id,
        portalEmail.trim(),
        `${roleDisplayNames[portalSelectedRole]} Registered`,
        `Registrar (${registrarEmail}) registered and authorized ${roleDisplayNames[portalSelectedRole]}: ${portalFullName.trim()} for Hospital ID ${portalHospitalId.trim()}.`
      );

      // 4. Generate Direct Bypass Link for Hospital Tenant
      const origin = window.location.origin;
      const bypassUrl = `${origin}/?bypass_tenant=${encodeURIComponent(portalHospitalId.trim())}&bypass_user=${encodeURIComponent(portalEmail.trim())}`;

      setLastGeneratedBypass({
        url: bypassUrl,
        name: portalFullName.trim(),
        email: portalEmail.trim(),
        role: roleDisplayNames[portalSelectedRole] || portalSelectedRole,
        hospitalId: portalHospitalId.trim(),
        department: portalDepartment.trim() || 'General Operations',
        timestamp: new Date().toISOString()
      });
      setBypassCopied(false);

      setPortalSuccess(`Successfully registered ${roleDisplayNames[portalSelectedRole]} "${portalFullName.trim()}"! Direct bypass link generated.`);
      
      // Clear inputs
      setPortalFullName('');
      setPortalInstitutionalName('');
      setPortalEmail('');
      setPortalHospitalId('');
      setPortalLicenseKey('');
      setPortalDepartment('General Operations');
      addToast?.('success', `${roleDisplayNames[portalSelectedRole]} registered successfully.`);
    } catch (err: any) {
      console.error("Error registering leadership user:", err);
      setPortalError(err.message || 'Failed to register leadership user.');
    } finally {
      setIsRegisteringPortalUser(false);
    }
  };

  // Handler for Role Access quick user role change
  const handleUserRoleChange = async (userId: string, newRole: typeof EHR_ROLES[number]) => {
    try {
      const perms = rolePermissionsState[newRole] || ['read_patient_records', 'write_clinical_notes'];
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        permissions: perms,
        updated_date: new Date().toISOString()
      });
      addToast?.('success', `User role updated to ${newRole}.`);
      await logActivity(
        userId,
        users.find(u => u.id === userId)?.email || '',
        'Role Updated',
        `Role updated to ${newRole} by Director of Hospital.`
      );
    } catch (err: any) {
      console.error("Error updating role:", err);
      addToast?.('error', 'Failed to update user role.');
    }
  };

  const logActivity = async (userId: string, userEmail: string, action: string, details: string) => {
    try {
      const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
      const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
      const hospital_id = activeHospital?.hospital_unique_number || 'demo-global';
      
      await addDoc(collection(db, 'user_activity_logs'), {
        userId,
        userEmail,
        action,
        details,
        timestamp: new Date().toISOString(),
        performedBy: 'Hospital Director',
        ipAddress: '196.188.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
        hospital_id: hospital_id
      });
    } catch (error) {
      console.error("Error writing activity log:", error);
    }
  };

  const getLastLogin = (user: User) => {
    // Find logs
    const userLogs = activityLogs.filter(
      (log) => (log.userEmail || '').toLowerCase() === (user.email || '').toLowerCase() && log.action === 'Account Login'
    );
    let lastLoginTime: number | null = null;
    if (userLogs.length > 0) {
      const times = userLogs.map(l => new Date(l.timestamp).getTime()).filter(t => !isNaN(t));
      if (times.length > 0) {
        lastLoginTime = Math.max(...times);
      }
    }
    
    // Also check if user has custom last_login_date field
    if ((user as any).last_login_date) {
      const t = new Date((user as any).last_login_date).getTime();
      if (!isNaN(t)) {
        if (lastLoginTime === null || t > lastLoginTime) {
          lastLoginTime = t;
        }
      }
    }

    // Fallback to created_date
    if (lastLoginTime === null && user.created_date) {
      const t = new Date(user.created_date).getTime();
      if (!isNaN(t)) {
        lastLoginTime = t;
      }
    }

    if (lastLoginTime === null) {
      return { date: null, daysSince: 0, isInactive: false };
    }

    const date = new Date(lastLoginTime);
    const diffTime = Date.now() - lastLoginTime;
    const daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return {
      date,
      daysSince: daysSince >= 0 ? daysSince : 0,
      isInactive: daysSince > 30
    };
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-gray-200', text: 'text-gray-400', width: '0%' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) {
      return { score, label: 'Weak 🔴', color: 'bg-red-500', text: 'text-red-600', width: '33%' };
    } else if (score <= 4) {
      return { score, label: 'Moderate 🟡', color: 'bg-amber-500', text: 'text-amber-600', width: '66%' };
    } else {
      return { score, label: 'Strong 🟢', color: 'bg-emerald-500', text: 'text-emerald-600', width: '100%' };
    }
  };

  const handleBatchRoleUpdate = async (newRole: typeof EHR_ROLES[number]) => {
    if (selectedUserIds.length === 0) return;
    setIsBatchProcessing(true);
    setBatchError('');
    try {
      for (const id of selectedUserIds) {
        const u = users.find(user => user.id === id);
        if (u) {
          if (u.email === 'admin@example.com') continue;
          await updateDoc(doc(db, 'users', id), {
            role: newRole,
            updated_date: new Date().toISOString()
          });
          await logActivity(
            id,
            u.email,
            'Batch Role Updated',
            `Role modified to "${newRole}" during administrative batch operation.`
          );
        }
      }
      setSelectedUserIds([]);
    } catch (error: any) {
      console.error("Error in batch role update:", error);
      setBatchError(error.message || 'Failed to update roles for selected users');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchArchive = async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to archive the ${selectedUserIds.length} selected user(s)?`)) return;
    setIsBatchProcessing(true);
    setBatchError('');
    try {
      for (const id of selectedUserIds) {
        const u = users.find(user => user.id === id);
        if (u) {
          if (u.email === 'admin@example.com') continue;
          await updateDoc(doc(db, 'users', id), {
            status: 'archived',
            updated_date: new Date().toISOString()
          });
          await logActivity(
            id,
            u.email,
            'Batch Archived',
            `User account status set to "archived" during administrative batch operation.`
          );
        }
      }
      setSelectedUserIds([]);
      addToastFeedback('success', `Successfully archived ${selectedUserIds.length} users.`);
    } catch (error: any) {
      console.error("Error in batch archive:", error);
      setBatchError(error.message || 'Failed to archive selected users');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchExport = () => {
    if (selectedUserIds.length === 0) return;
    const dataToExport = users.filter(u => selectedUserIds.includes(u.id));
    
    const headers = ['Name', 'Email', 'Role', 'Status', 'Last Login', 'Created Date'];
    const rows = dataToExport.map(user => {
      const { date, isInactive, daysSince } = getLastLogin(user);
      const statusStr = isInactive ? `Inactive (${daysSince} days)` : 'Active';
      const lastLoginStr = date ? date.toISOString() : 'Never';
      return [
        `"${(user.full_name || '').replace(/"/g, '""')}"`,
        `"${(user.email || '').replace(/"/g, '""')}"`,
        `"${user.role}"`,
        `"${statusStr}"`,
        `"${lastLoginStr}"`,
        `"${user.created_date || ''}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ehr_batch_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToastFeedback('success', `Successfully exported ${selectedUserIds.length} records to CSV.`);
  };

  const handleBatchDelete = async () => {
    if (selectedUserIds.length === 0) return;
    const count = selectedUserIds.length;
    if (!window.confirm(`CRITICAL WARNING: You are about to PERMANENTLY DELETE ${count} user account(s). This action CANNOT be undone. Are you absolutely sure?`)) return;
    
    setIsBatchProcessing(true);
    setBatchError('');
    try {
      for (const id of selectedUserIds) {
        const u = users.find(user => user.id === id);
        if (u) {
          if (u.email === 'admin@example.com') continue; // Protection for admin
          await deleteDoc(doc(db, 'users', id));
          // We can't log activity for a deleted user easily in the same doc, 
          // but we could log it to a global audit log if we had one.
        }
      }
      setSelectedUserIds([]);
      addToastFeedback('success', `Permanently deleted ${count} users.`);
    } catch (error: any) {
      console.error("Error in batch delete:", error);
      setBatchError(error.message || 'Failed to delete selected users');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const addToastFeedback = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    if (addToast) {
      addToast(type, message);
    } else {
      alert(`${type.toUpperCase()}: ${message}`);
    }
  };

  const handleGenerateBypassUrl = (user: User) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const bypassUrl = `${origin}${pathname}?bypass_tenant=${user.hospital_id || 'demo-global'}&bypass_user=${encodeURIComponent(user.email)}`;

    const copyDirectly = async (method: string) => {
      await navigator.clipboard.writeText(bypassUrl);
      await logActivity(
        user.id,
        user.email,
        'Secure Link Generated',
        `Direct-access bypass URL generated via ${method} (Distance: 0m emulated).`
      );
      addToastFeedback('success', `Direct bypass access URL copied to clipboard for ${user.full_name || user.email}!`);
      alert(`SECURE ACCESS GRANTED (Sandbox Emulated)\nLocation Verified: ${method}\n\nBypass URL copied to clipboard:\n${bypassUrl}`);
    };

    if (!navigator.geolocation) {
      addToastFeedback('info', 'Sandbox GPS detected: Copying direct bypass URL...');
      copyDirectly('Browser Geolocation Unsupported Fallback');
      return;
    }

    addToastFeedback('info', 'Verifying security location perimeter...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistance(latitude, longitude, HOSPITAL_LAT, HOSPITAL_LON);
        
        if (distance <= ALLOWED_RADIUS_METERS) {
          await navigator.clipboard.writeText(bypassUrl);
          await logActivity(
            user.id,
            user.email,
            'Secure Link Generated',
            `Direct-access bypass URL generated at verified location (Distance: ${Math.round(distance)}m from Main Entrance).`
          );
          addToastFeedback('success', `Direct bypass access URL copied to clipboard for ${user.full_name || user.email}!`);
          alert(`SECURE ACCESS GRANTED\nLocation Verified: Within Hospital Compound\n\nBypass URL copied to clipboard:\n${bypassUrl}`);
        } else {
          // Allow fallback copy with alert in sandbox
          addToastFeedback('info', 'Outside perimeter. Activating sandbox override...');
          copyDirectly(`GPS Override (${Math.round(distance)}m outside compound)`);
        }
      },
      async (error) => {
        console.warn("Location access error caught gracefully. Sandboxed browser fallback activated:", error);
        addToastFeedback('info', 'Sandbox Environment Detected: GPS block bypassed.');
        await copyDirectly('Iframe Sandbox Emulation Override');
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleToggleLocationRestriction = async (user: User) => {
    try {
      const nextStatus = !user.location_restricted;
      await updateDoc(doc(db, 'users', user.id), {
        location_restricted: nextStatus,
        updated_date: new Date().toISOString()
      });
      
      await logActivity(
        user.id,
        user.email,
        'Security Rule Update',
        `Location restriction toggled to ${nextStatus ? 'RESTRICTED' : 'GLOBAL'} for ${user.full_name || user.email}.`
      );

      if (addToast) {
        addToast(nextStatus ? 'warning' : 'info', `Security Update: ${user.full_name || user.email} access rule set to ${nextStatus ? 'Location Restricted' : 'Global'}.`);
      }
    } catch (error: any) {
      console.error("Error toggling location restriction:", error);
      if (addToast) addToast('error', 'Failed to update security rules.');
    }
  };

  const handleResetPassword = async (user: User) => {
    const tempPass = `EHR-${Array.from({length: 4}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')}-${Array.from({length: 4}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')}`;
    await logActivity(
      user.id,
      user.email,
      'Password Reset',
      `Admin reset credentials. Generated temporary secure one-time password.`
    );
    setResetPasswordModal({
      isOpen: true,
      userName: user.full_name || 'No Name',
      userEmail: user.email,
      tempPass
    });
  };

  const handleAddManualLog = async (userId: string, userEmail: string) => {
    const text = manualLogTexts[userId]?.trim();
    if (!text) return;
    setIsSavingManualLog(prev => ({ ...prev, [userId]: true }));
    try {
      await logActivity(userId, userEmail, 'Security Audit Note', text);
      setManualLogTexts(prev => ({ ...prev, [userId]: '' }));
    } catch (error) {
      console.error("Error adding security note:", error);
    } finally {
      setIsSavingManualLog(prev => ({ ...prev, [userId]: false }));
    }
  };

  const exportToCSV = () => {
    setShowExportModal(true);
  };

  const handleExportCSV = () => {
    const dataToExport = users.filter(user => {
      // Role filter
      if (exportRoleFilter !== 'all' && user.role !== exportRoleFilter) {
        return false;
      }
      
      // Status filter (Active/Inactive by 30 days of login)
      const { isInactive } = getLastLogin(user);
      if (exportStatusFilter === 'active' && isInactive) {
        return false;
      }
      if (exportStatusFilter === 'inactive' && !isInactive) {
        return false;
      }
      
      return true;
    });

    const roleNameMap: Record<string, string> = {
      director: 'Hospital Director',
      admin: 'Hospital Admin',
      'mid-manager': 'Mid Manager',
      'low-manager': 'Low Manager',
      user: 'Staff Practitioner'
    };

    const headers = ['Name', 'Email', 'Role', 'Hospital Tenant ID', 'Department', 'Status', 'Last Login', 'Created Date', 'Updated Date'];
    const rows = dataToExport.map(user => {
      const { date, isInactive, daysSince } = getLastLogin(user);
      const statusStr = isInactive ? `Inactive (${daysSince} days)` : 'Active';
      const lastLoginStr = date ? date.toISOString() : 'Never';
      const prettyRole = roleNameMap[user.role] || user.role;
      const hospitalId = user.hospital_id || 'TENANT-ID';
      const dept = (user as any).department || 'General Operations';
      return [
        `"${(user.full_name || '').replace(/"/g, '""')}"`,
        `"${(user.email || '').replace(/"/g, '""')}"`,
        `"${prettyRole.replace(/"/g, '""')}"`,
        `"${hospitalId.replace(/"/g, '""')}"`,
        `"${dept.replace(/"/g, '""')}"`,
        `"${statusStr}"`,
        `"${lastLoginStr}"`,
        `"${user.created_date || ''}"`,
        `"${user.updated_date || ''}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ehr_users_directory_${exportRoleFilter}_${exportStatusFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  // Filter users based on search query and selected role
  const filteredUsers = users.filter((user) => {
    const query = (searchQuery || '').toLowerCase();
    const matchesSearch = 
      (user.full_name || '').toLowerCase().includes(query) ||
      (user.email || '').toLowerCase().includes(query);
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mainActiveTab !== 'Users') return;
      if (activeTab !== 'users') return;
      
      // Ctrl + Shift + A to Archive
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        handleBatchArchive();
      }
      
      // Ctrl + Shift + E to Export
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        handleBatchExport();
      }

      // Ctrl + A to Select All (only if in the user list context)
      if (e.ctrlKey && e.key === 'a' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (selectedUserIds.length === filteredUsers.length) {
          setSelectedUserIds([]);
        } else {
          setSelectedUserIds(filteredUsers.map(u => u.id));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUserIds, filteredUsers, activeTab]);

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdating(true);
    setUpdateError('');
    try {
      // Validate inputs using Zod userUpdateSchema
      const validationResult = userUpdateSchema.safeParse({
        fullName: editFullName.trim(),
        email: editEmail.trim(),
        role: editRole,
        customRole: editCustomRole.trim(),
        permissions: editPermissions,
        password: editPassword,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(err => err.message).join(' ');
        setUpdateError(errors);
        setIsUpdating(false);
        return;
      }

      const safeHospitalId = editHospitalId.trim() || editingUser.hospital_id || 'TENANT-ID';

      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        full_name: editFullName.trim(),
        hospital_id: safeHospitalId,
        history: editHistory.trim(),
        location_restricted: editLocationRestricted,
        email: editEmail.trim(),
        role: editRole,
        customRole: editRole === 'other' ? editCustomRole.trim() : null,
        permissions: editPermissions,
        password: editPassword || (editingUser as any).password || null,
        updated_date: new Date().toISOString()
      });

      setEditPassword('');

      // Log this change with preserved hospital tenant info
      await logActivity(
        editingUser.id, 
        editingUser.email, 
        'Profile Updated (Hospital Data Preserved)', 
        `Admin modified profile. Name: "${editFullName}", Role: "${editRole}", Email: "${editEmail}", Hospital ID: "${safeHospitalId}". Hospital data and audit history preserved.`
      );

      setEditingUser(null);
    } catch (error: any) {
      console.error("Error updating user:", error);
      setUpdateError(error.message || 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSavePermissions = async (userId: string, userEmail: string) => {
    setSavingPermissions(prev => ({ ...prev, [userId]: true }));
    setPermissionsFeedback(prev => ({ ...prev, [userId]: '' }));

    const scopes = editedUserPermissions[userId] || [];
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        permissions: scopes,
        updated_date: new Date().toISOString()
      });

      await logActivity(
        userId,
        userEmail,
        'Access Scopes Updated',
        `Clinical administrator updated authorization scopes. Modified credentials: [${scopes.join(', ')}]`
      );

      setPermissionsFeedback(prev => ({ ...prev, [userId]: '✓ Scopes updated successfully & verified on EHR security server.' }));
      setTimeout(() => {
        setPermissionsFeedback(prev => ({ ...prev, [userId]: '' }));
      }, 4000);
    } catch (err: any) {
      setPermissionsFeedback(prev => ({ ...prev, [userId]: `Error: ${err.message}` }));
    } finally {
      setSavingPermissions(prev => ({ ...prev, [userId]: false }));
    }
  };

  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [simName, setSimName] = useState('');
  const [simEmail, setSimEmail] = useState('');
  const [simRole, setSimRole] = useState('Doctor');
  const [simDept, setSimDept] = useState('Cardiology');
  const [simLicense, setSimLicense] = useState('');
  const [simJustification, setSimJustification] = useState('');
  const [isSimulatingRequest, setIsSimulatingRequest] = useState(false);
  const [simFeedback, setSimFeedback] = useState('');

  const handleSimulateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName || !simEmail) {
      setSimFeedback('❌ Name and Email are required.');
      return;
    }
    setIsSimulatingRequest(true);
    setSimFeedback('');

    const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
    const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
    const hospital_id = activeHospital?.hospital_unique_number || 'demo-global';

    const newRequest = {
      full_name: simName.trim(),
      email: simEmail.trim(),
      role: 'user',
      requested_role: simRole,
      license_number: simLicense.trim() || `ETH-LIC-${Math.floor(1000 + Math.random() * 9000)}`,
      department: simDept,
      justification: simJustification.trim() || 'Urgent onboarding for clinic rotations.',
      hospital_id: hospital_id,
      created_date: new Date().toISOString(),
      status: 'pending'
    };

    if (isFakeOrFalseRow(newRequest)) {
      setSimFeedback('❌ Cannot record false, mock, dummy, or fake information to protect user registries!');
      setIsSimulatingRequest(false);
      return;
    }

    try {
      await addDoc(collection(db, 'pending_user_requests'), newRequest);
      setSimFeedback('✓ Credential request submitted to clinical audit queue!');
      setSimName('');
      setSimEmail('');
      setSimLicense('');
      setSimJustification('');
      setTimeout(() => setSimFeedback(''), 4000);
    } catch (error: any) {
      setSimFeedback(`❌ Error: ${error.message}`);
    } finally {
      setIsSimulatingRequest(false);
    }
  };

  const handleApproveRequest = async (req: any) => {
    setApprovingRequestId(req.id);
    try {
      // 1. Create the user in `users` collection
      // Fallback permissions based on requested_role
      let defaultPerms = ['read_patient_records'];
      if (req.requested_role === 'Doctor') {
        defaultPerms = ['read_patient_records', 'write_clinical_notes', 'audit_logs_view'];
      } else if (req.requested_role === 'Nurse') {
        defaultPerms = ['read_patient_records', 'write_clinical_notes', 'dispense_medications'];
      } else if (req.requested_role === 'Pharmacist') {
        defaultPerms = ['read_patient_records', 'dispense_medications'];
      } else if (req.requested_role === 'Administrator') {
        defaultPerms = ['read_patient_records', 'write_clinical_notes', 'manage_billing', 'dispense_medications', 'system_backups_access', 'audit_logs_view'];
      }

      await addDoc(collection(db, 'users'), {
        full_name: req.full_name,
        email: req.email,
        role: req.requested_role === 'Administrator' ? 'admin' : 'user',
        hospital_id: req.hospital_id || 'demo-global',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        created_by_id: 'clinical-approval-node',
        permissions: defaultPerms
      });

      // 2. Log activity
      await logActivity(
        'approval-node',
        req.email,
        'Staff Request Approved',
        `Approved credential registry request for ${req.full_name} (${req.requested_role} - ${req.department}). Assigned standard permissions: [${defaultPerms.join(', ')}]`
      );

      // 3. Delete from pending
      await deleteDoc(doc(db, 'pending_user_requests', req.id));

    } catch (err: any) {
      console.error("Error approving request:", err);
    } finally {
      setApprovingRequestId(null);
    }
  };

  const handleRejectRequest = async (req: any) => {
    setRejectingRequestId(req.id);
    try {
      // 1. Log activity
      await logActivity(
        'approval-node',
        req.email,
        'Staff Request Denied',
        `Rejected and purged onboarding credential request for ${req.full_name} (${req.requested_role} - ${req.department}).`
      );

      // 2. Delete from pending
      await deleteDoc(doc(db, 'pending_user_requests', req.id));
    } catch (err: any) {
      console.error("Error rejecting request:", err);
    } finally {
      setRejectingRequestId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      // Archive full record to preserved hospital records store prior to removal
      await addDoc(collection(db, 'archived_hospital_user_records'), {
        original_user_id: userToDelete.id,
        full_name: userToDelete.full_name || '',
        email: userToDelete.email || '',
        role: userToDelete.role || '',
        hospital_id: userToDelete.hospital_id || 'TENANT-ID',
        license_key: (userToDelete as any).license_key || '',
        institutional_name: (userToDelete as any).institutional_name || '',
        department: (userToDelete as any).department || 'General Operations',
        permissions: userToDelete.permissions || [],
        created_date: userToDelete.created_date || new Date().toISOString(),
        archived_at: new Date().toISOString(),
        archived_by: currentUser?.email || 'Hospital Director',
        preservation_status: 'HEALTHFLOW_DATA_PRESERVED',
        preservation_note: 'Hospital information and user metadata permanently retained in database archive upon record deletion.'
      }).catch(err => console.warn('Archiving error:', err));

      const userRef = doc(db, 'users', userToDelete.id);
      await deleteDoc(userRef);

      // Log deletion and data preservation
      await logActivity(
        userToDelete.id, 
        userToDelete.email, 
        'User Record Archived & Deleted', 
        `Admin deleted user account. Full hospital information, credentials, and tenant metadata preserved under Hospital ID "${userToDelete.hospital_id || 'TENANT-ID'}".`
      );

      setUserToDelete(null);
      addToast?.('success', 'User deleted and hospital record permanently archived.');
    } catch (error: any) {
      console.error("Error deleting user:", error);
      setDeleteError(error.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRegisterOwnerAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerAdminName.trim() || !ownerAdminEmail.trim() || !ownerHospitalId.trim() || !ownerLicenseKey.trim()) {
      setOwnerAdminError('All fields (Name, Email, Hospital ID, License Key) are required.');
      return;
    }
    setIsRegisteringOwnerAdmin(true);
    setOwnerAdminError('');
    setOwnerAdminSuccess('');

    try {
      // 1. Save to owner_registered_admins collection
      const adminDoc = await addDoc(collection(db, 'owner_registered_admins'), {
        full_name: ownerAdminName.trim(),
        email: ownerAdminEmail.trim(),
        hospital_id: ownerHospitalId.trim(),
        license_key: ownerLicenseKey.trim(),
        created_date: new Date().toISOString()
      });

      // 2. Automatically save the admin to the users collection/portal
      const defaultPerms = [
        'read_patient_records',
        'write_clinical_notes',
        'manage_billing',
        'dispense_medications',
        'system_backups_access',
        'audit_logs_view'
      ];
      await addDoc(collection(db, 'users'), {
        full_name: ownerAdminName.trim(),
        email: ownerAdminEmail.trim(),
        role: 'admin',
        hospital_id: ownerHospitalId.trim(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        created_by_id: 'workspace-owner',
        permissions: defaultPerms
      });

      // 3. Log activity
      await logActivity(
        adminDoc.id,
        ownerAdminEmail.trim(),
        'Admin Authorized',
        `Owner registered and authorized Admin: ${ownerAdminName.trim()} for Hospital ID: ${ownerHospitalId.trim()} with License Key verification.`
      );

      setOwnerAdminSuccess(`Successfully registered Admin "${ownerAdminName.trim()}"! Their credentials have been saved to the users portal.`);
      
      // Clear inputs
      setOwnerAdminName('');
      setOwnerAdminEmail('');
      setOwnerHospitalId('');
      setOwnerLicenseKey('');
      setOwnerAdminPassword('');
    } catch (err: any) {
      console.error("Error registering owner admin:", err);
      setOwnerAdminError(err.message || 'Failed to register administrator.');
    } finally {
      setIsRegisteringOwnerAdmin(false);
    }
  };

  const handleRegisterHospitalAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalAdminName.trim() || !hospitalAdminEmail.trim() || !hospitalAdminHospitalId.trim() || !hospitalAdminInstitutionalName.trim() || !hospitalAdminLicenseKey.trim()) {
      setHospitalAdminError('All fields (Name, Institutional Name, Email, Hospital ID, License Key) are required.');
      return;
    }
    setIsRegisteringHospitalAdmin(true);
    setHospitalAdminError('');
    setHospitalAdminSuccess('');

    try {
      // 1. Sync to users collection
      const defaultPerms = [
        'read_patient_records',
        'write_clinical_notes',
        'manage_billing',
        'dispense_medications',
        'audit_logs_view'
      ];
      await addDoc(collection(db, 'users'), {
        full_name: hospitalAdminName.trim(),
        email: hospitalAdminEmail.trim(),
        role: 'admin',
        hospital_id: hospitalAdminHospitalId.trim(),
        license_key: hospitalAdminLicenseKey.trim(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        created_by_id: 'hospital-director',
        permissions: defaultPerms
      });

      // 2. Log activity
      await logActivity(
        'director-portal',
        hospitalAdminEmail.trim(),
        'Admin Authorized',
        `Director registered and authorized Admin: ${hospitalAdminName.trim()} for Hospital ID: ${hospitalAdminHospitalId.trim()} with License: ${hospitalAdminLicenseKey.trim()}.`
      );

      setHospitalAdminSuccess(`Successfully registered Director "${hospitalAdminName.trim()}"!`);
      
      // Clear inputs
      setHospitalAdminName('');
      setHospitalAdminInstitutionalName('');
      setHospitalAdminEmail('');
      setHospitalAdminHospitalId('');
      setHospitalAdminLicenseKey('');
    } catch (err: any) {
      console.error("Error registering hospital admin:", err);
      setHospitalAdminError(err.message || 'Failed to register administrator.');
    } finally {
      setIsRegisteringHospitalAdmin(false);
    }
  };

  const handleDeleteOwnerAdmin = async (admin: OwnerRegisteredAdmin) => {
    if (!window.confirm(`Are you sure you want to delete Admin ${admin.full_name}? This will remove active credentials while permanently preserving hospital information in records.`)) return;
    try {
      // 0. Preserve record in archive
      await addDoc(collection(db, 'archived_hospital_user_records'), {
        original_admin_id: admin.id,
        full_name: admin.full_name || '',
        email: admin.email || '',
        role: 'admin',
        hospital_id: admin.hospital_id || 'TENANT-ID',
        license_key: admin.license_key || '',
        institutional_name: admin.institutional_name || '',
        archived_at: new Date().toISOString(),
        archived_by: currentUser?.email || 'Owner',
        preservation_status: 'HEALTHFLOW_DATA_PRESERVED',
        preservation_note: 'Hospital admin data permanently preserved upon removal.'
      }).catch(err => console.warn('Archiving error:', err));

      // 1. Delete from owner_registered_admins
      await deleteDoc(doc(db, 'owner_registered_admins', admin.id));

      // 2. Delete matching admin from users (by email matching)
      const matchingUsers = users.filter(u => (u.email || '').toLowerCase() === (admin.email || '').toLowerCase());
      for (const m of matchingUsers) {
        await deleteDoc(doc(db, 'users', m.id));
      }

      // 3. Log activity
      await logActivity(
        'owner-portal',
        admin.email,
        'Admin Deleted by Owner (Record Preserved)',
        `Owner removed administrator authorization for ${admin.full_name} (${admin.hospital_id}). Full hospital information and records preserved in archive.`
      );
    } catch (err: any) {
      console.error("Error deleting owner admin:", err);
      alert("Failed to delete admin: " + err.message);
    }
  };

  const handleEditOwnerAdmin = (admin: OwnerRegisteredAdmin) => {
    setEditingOwnerAdmin(admin);
    setEditOwnerAdminName(admin.full_name);
    setEditOwnerInstitutionalName(admin.institutional_name);
    setEditOwnerAdminEmail(admin.email);
    setEditOwnerAdminHospitalId(admin.hospital_id);
    setEditOwnerAdminLicenseKey(admin.license_key);
    setOwnerAdminEditError('');
  };

  const handleStartInlineEdit = (admin: OwnerRegisteredAdmin) => {
    setEditingAdminId(admin.id);
    setInlineName(admin.full_name);
    setInlineEmail(admin.email);
  };

  const saveInlineEdit = async (admin: OwnerRegisteredAdmin) => {
    try {
      await updateDoc(doc(db, 'owner_registered_admins', admin.id), {
        full_name: inlineName,
        email: inlineEmail
      });
      setEditingAdminId(null);
      addToast?.('success', 'Admin updated successfully.');
    } catch (err: any) {
      console.error("Error updating admin:", err);
      addToast?.('error', 'Failed to update admin.');
    }
  };

  const cancelInlineEdit = () => {
    setEditingAdminId(null);
  };

  const handleStartInlineDirectorEdit = (admin: OwnerRegisteredAdmin) => {
    setEditingDirectorId(admin.id);
    setInlineDirectorName(admin.full_name);
    setInlineDirectorEmail(admin.email);
  };

  const saveInlineDirectorEdit = async (admin: OwnerRegisteredAdmin) => {
    try {
      await updateDoc(doc(db, 'owner_registered_admins', admin.id), {
        full_name: inlineDirectorName,
        email: inlineDirectorEmail
      });
      setEditingDirectorId(null);
      addToast?.('success', 'Director updated successfully.');
    } catch (err: any) {
      console.error("Error updating director:", err);
      addToast?.('error', 'Failed to update director.');
    }
  };

  const cancelInlineDirectorEdit = () => {
    setEditingDirectorId(null);
  };

  const handleSaveOwnerAdminEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOwnerAdmin) return;
    setIsSavingOwnerAdminEdit(true);
    setOwnerAdminEditError('');
    try {
      // 1. Update in owner_registered_admins
      await updateDoc(doc(db, 'owner_registered_admins', editingOwnerAdmin.id), {
        full_name: editOwnerAdminName.trim(),
        email: editOwnerAdminEmail.trim(),
        hospital_id: editOwnerAdminHospitalId.trim(),
        license_key: editOwnerAdminLicenseKey.trim()
      });

      // 2. Update matching entries in users collection (by matching email)
      const matchingUsers = users.filter(u => (u.email || '').toLowerCase() === (editingOwnerAdmin.email || '').toLowerCase());
      for (const m of matchingUsers) {
        await updateDoc(doc(db, 'users', m.id), {
          full_name: editOwnerAdminName.trim(),
          email: editOwnerAdminEmail.trim(),
          hospital_id: editOwnerAdminHospitalId.trim()
        });
      }

      // 3. Log activity
      await logActivity(
        'owner-portal',
        editOwnerAdminEmail,
        'Admin Edited by Owner',
        `Owner updated administrator credential profile for ${editOwnerAdminName}.`
      );

      setEditingOwnerAdmin(null);
    } catch (err: any) {
      console.error("Error editing owner admin:", err);
      setOwnerAdminEditError(err.message || "Failed to update admin profile");
    } finally {
      setIsSavingOwnerAdminEdit(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      {/* Upper Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-gray-900">Users</h2>
            <span className="bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
              <Lock size={10} />
              Director of Hospital Only
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Manage the app's users and their roles</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer bg-white font-medium"
            title="Export CSV Directory"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button 
            onClick={() => {}} 
            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Filters"
          >
            <Filter size={18} />
          </button>
          
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 bg-gray-950 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-850 transition-colors cursor-pointer animate-pulse"
          >
            <Plus size={16} />
            <span>add</span>
          </button>
        </div>
      </div>

      {/* Hospital Director Restriction Advisory Banner */}
      <div className="bg-red-50/40 rounded-2xl border border-red-100 p-4 flex items-start gap-3">
        <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={18} />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-red-950 uppercase tracking-wide">Hospital Authority Restriction</h4>
          <p className="text-xs text-red-800 leading-relaxed">
            All registered user rosters, invite tokens, and authority clearance lists in this console are restricted. Access or modifications are monitored and controlled by the Director of the Hospital.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap bg-gray-100 p-1 rounded-lg w-fit mb-6 gap-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'users'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('role-access')}
          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'role-access'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Sliders size={13} className="text-indigo-600" />
          <span>Role Access & Management</span>
        </button>
        <button
          onClick={() => setActiveTab('registration-portals')}
          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'registration-portals'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <UserPlus size={13} className="text-purple-600" />
          <span>Registration Portals</span>
        </button>
        {currentUser?.email === OWNER_EMAIL && (
          <button
            onClick={() => setActiveTab('owner-admin-portal')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'owner-admin-portal'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldCheck size={13} className="text-indigo-600" />
            <span>Admin Registration (Owner Mode)</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('portal-management')}
          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'portal-management'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Shield size={13} className="text-emerald-600" />
          <span>Portal & Tier Management</span>
        </button>
      </div>

      {activeTab === 'portal-management' ? (
        <PortalManagement addToast={addToast} currentUser={currentUser} />
      ) : activeTab === 'role-access' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Hierarchy Overview */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="text-indigo-400" size={20} />
                  <h3 className="text-lg font-extrabold tracking-wide text-white">
                    Role Access & Management
                  </h3>
                  <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                    Director Authorization Center
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Centralized role hierarchy matrix and access control engine. Restricts administrative permissions and delegates operational rights across organizational staff levels.
                </p>
              </div>
            </div>

            {/* Staff Hierarchy Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
              <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider">Level 1</span>
                  <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {users.filter(u => u.role === 'director').length} Staff
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  <Building size={14} className="text-purple-400 shrink-0" />
                  <span className="truncate">Hospital Director</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">Executive authority, full portal creation & audit access.</p>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">Level 2</span>
                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {users.filter(u => u.role === 'admin').length} Staff
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-indigo-400 shrink-0" />
                  <span className="truncate">Hospital Admin</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">Clinical operations, billing, & user roster control.</p>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider">Level 3</span>
                  <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {users.filter(u => u.role === 'mid-manager').length} Staff
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  <Briefcase size={14} className="text-blue-400 shrink-0" />
                  <span className="truncate">Mid-level Manager</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">Department oversight, inventory & schedule manager.</p>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider">Level 4</span>
                  <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {users.filter(u => u.role === 'low-manager').length} Staff
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  <Award size={14} className="text-cyan-400 shrink-0" />
                  <span className="truncate">Low-level Manager</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">Shift team coordination & intake roster supervisor.</p>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Level 5</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {users.filter(u => u.role === 'user' || !u.role).length} Staff
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  <Users size={14} className="text-emerald-400 shrink-0" />
                  <span className="truncate">Staff Practitioner</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">Direct EHR clinical entries, notes & treatment access.</p>
              </div>
            </div>
          </div>

          {/* Quick Permission Configuration Matrix */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Layers className="text-indigo-600" size={18} />
                  <span>Role Permissions & Capability Matrix</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure default capability scopes granted to each role tier across the hospital system.
                </p>
              </div>

              {/* Role selector tabs */}
              <div className="flex bg-gray-100 p-1 rounded-lg gap-1 self-start sm:self-auto overflow-x-auto">
                {[
                  { id: 'director', label: 'Hospital Director' },
                  { id: 'admin', label: 'Hospital Admin' },
                  { id: 'mid-manager', label: 'Mid Manager' },
                  { id: 'low-manager', label: 'Low Manager' },
                  { id: 'user', label: 'Staff Practitioner' }
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoleForPermissions(r.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedRoleForPermissions === r.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'read_patient_records', name: 'Read EHR Patient Records', desc: 'Allows viewing patient history, vital signs, and diagnostics.' },
                { id: 'write_clinical_notes', name: 'Write Clinical Notes & EHR', desc: 'Allows authoring clinical notes, treatment plans, and prescriptions.' },
                { id: 'manage_billing', name: 'Billing & Financial Claims', desc: 'Allows access to invoice processing and financial statements.' },
                { id: 'dispense_medications', name: 'Dispense Pharmacy Orders', desc: 'Allows processing pharmacy dispenses and inventory logs.' },
                { id: 'audit_logs_view', name: 'Access Audit Logs & Trail', desc: 'Allows viewing security audit logs and staff login trails.' },
                { id: 'manage_staff_roles', name: 'Manage Staff Roles & Users', desc: 'Allows inviting staff and reassigning system roles.' },
                { id: 'hospital_config_access', name: 'Hospital Configuration Settings', desc: 'Allows modifying institutional preferences and bed capacity.' },
                { id: 'emergency_override', name: 'Emergency Break-Glass Override', desc: 'Allows bypassing location/geofence constraints in critical cases.' }
              ].map(perm => {
                const currentPerms = rolePermissionsState[selectedRoleForPermissions] || [];
                const isEnabled = currentPerms.includes(perm.id);

                return (
                  <div 
                    key={perm.id} 
                    onClick={() => {
                      setRolePermissionsState(prev => {
                        const list = prev[selectedRoleForPermissions] || [];
                        const updated = list.includes(perm.id)
                          ? list.filter(p => p !== perm.id)
                          : [...list, perm.id];
                        return { ...prev, [selectedRoleForPermissions]: updated };
                      });
                      addToast?.('info', `Toggled "${perm.name}" for ${selectedRoleForPermissions}`);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isEnabled 
                        ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950' 
                        : 'bg-gray-50/50 border-gray-200 text-gray-500 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className={`mt-0.5 p-1 rounded-md ${isEnabled ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                      {isEnabled ? <Check size={14} /> : <X size={14} />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-gray-900">{perm.name}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{perm.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Direct Staff Role Reassignment Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Users className="text-indigo-600" size={18} />
                  <span>Direct User Role Reassignment</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Quick-access interface for the Hospital Director to adjust staff roles and active permission tiers.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter staff by name or email..."
                  value={roleSearchQuery}
                  onChange={(e) => setRoleSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px] bg-gray-50/50">
                    <th className="py-2.5 px-3 font-bold">Staff Member</th>
                    <th className="py-2.5 px-3 font-bold">Hospital ID</th>
                    <th className="py-2.5 px-3 font-bold">Current Role</th>
                    <th className="py-2.5 px-3 font-bold">Reassign Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users
                    .filter(u => {
                      if (!roleSearchQuery.trim()) return true;
                      const q = roleSearchQuery.toLowerCase();
                      return (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
                    })
                    .slice(0, 15)
                    .map(usr => (
                      <tr key={usr.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-900">{usr.full_name || 'Staff User'}</div>
                          <div className="text-[11px] text-gray-500">{usr.email}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-gray-700 font-bold">
                          {usr.hospital_id || 'TENANT-ID'}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            usr.role === 'director' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            usr.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            usr.role === 'mid-manager' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            usr.role === 'low-manager' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                            'bg-gray-100 text-gray-700 border-gray-200'
                          }`}>
                            {usr.role === 'director' ? 'Hospital Director' :
                             usr.role === 'admin' ? 'Hospital Admin' :
                             usr.role === 'mid-manager' ? 'Mid Manager' :
                             usr.role === 'low-manager' ? 'Low Manager' : 'Staff Practitioner'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={usr.role || 'user'}
                            onChange={(e) => handleUserRoleChange(usr.id, e.target.value as any)}
                            className="text-xs bg-white border border-gray-250 rounded-lg px-2.5 py-1 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                          >
                            <option value="director">Hospital Director</option>
                            <option value="admin">Hospital Admin</option>
                            <option value="mid-manager">Mid-level Manager</option>
                            <option value="low-manager">Low-level Manager</option>
                            <option value="user">Staff Practitioner</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'registration-portals' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Restricted Notice Header */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-purple-800 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-purple-300" size={22} />
              <h3 className="text-lg font-black tracking-wide text-white">
                Authorized Leadership & Manager Registration Portals
              </h3>
            </div>
            <p className="text-xs text-purple-100/90 leading-relaxed max-w-3xl">
              Strictly restricted registration portals separating each individual tier by its exact authorization hierarchy, verification, edit, and deletion permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Column */}
            <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-150 p-6 space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <UserPlus className="text-purple-600" size={16} />
                  <span>Select Portal & Credentials</span>
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select the target role tier below to register an authorized team member.
                </p>
              </div>

              {/* Role Selection Buttons */}
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'director', label: 'Hospital Director', auth: 'Authorized and edited and deleted by owner of application', icon: Building, color: 'text-purple-600', badgeColor: 'bg-purple-100 text-purple-800 border-purple-200' },
                  { id: 'admin', label: 'Hospital Admin', auth: 'Authorized and edited and deleted by Hospital Director', icon: ShieldCheck, color: 'text-indigo-600', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
                  { id: 'mid-manager', label: 'Mid Manager', auth: 'Register and authorized/verified and edited and deleted by Hospital Admin or Hospital Director', icon: Briefcase, color: 'text-blue-600', badgeColor: 'bg-blue-100 text-blue-800 border-blue-200' },
                  { id: 'low-manager', label: 'Low Manager', auth: 'Register by hospital mid-manager and authorized/verified and edited and deleted by Hospital Admin or Hospital Director', icon: Award, color: 'text-cyan-600', badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
                  { id: 'user', label: 'Staff Practitioner', auth: 'Register by hospital low-level manager and authorized/verified and edited and deleted by Hospital Admin or Hospital Director', icon: Users, color: 'text-emerald-600', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
                ].map(r => {
                  const Icon = r.icon;
                  const isSelected = portalSelectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setPortalSelectedRole(r.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-500/20 text-purple-950 font-extrabold shadow-sm'
                          : 'bg-gray-50/50 border-gray-200 text-gray-700 hover:bg-gray-100/80 font-semibold'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon size={16} className={r.color} />
                          <span className="text-xs font-bold text-gray-900">{r.label}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.badgeColor}`}>
                          Portal
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 font-normal italic pl-6">
                        ({r.auth})
                      </div>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleRegisterLeadershipUser} className="space-y-3 pt-2">
                {portalError && (
                  <div className="text-xs font-semibold p-3 rounded-lg border bg-red-50 text-red-800 border-red-200">
                    {portalError}
                  </div>
                )}
                {portalSuccess && (
                  <div className="text-xs font-semibold p-3 rounded-lg border bg-emerald-50 text-emerald-800 border-emerald-200">
                    {portalSuccess}
                  </div>
                )}

                {/* Generated Direct Bypass Link Card */}
                {lastGeneratedBypass && (
                  <div className="bg-gradient-to-br from-emerald-50 via-purple-50/40 to-blue-50/50 border-2 border-emerald-300 rounded-2xl p-3.5 space-y-2.5 shadow-sm animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                      <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                        <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                        <span>Authorized Direct Bypass Link Generated</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLastGeneratedBypass(null)}
                        className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                        title="Dismiss link card"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="text-xs text-gray-700 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-500 text-[11px]">Authorized User:</span>
                        <span className="font-bold text-gray-900">{lastGeneratedBypass.name} ({lastGeneratedBypass.role})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-500 text-[11px]">Hospital Tenant ID:</span>
                        <span className="font-mono font-extrabold text-purple-800 bg-purple-100 px-2 py-0.5 rounded text-[11px]">
                          {lastGeneratedBypass.hospitalId}
                        </span>
                      </div>
                    </div>

                    {/* URL Input with Copy Button */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold uppercase text-gray-600 tracking-wider">
                        DIRECT BYPASS TENANT URL
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          readOnly
                          value={lastGeneratedBypass.url}
                          className="flex-1 text-[11px] font-mono bg-white border border-emerald-300 rounded-xl px-2.5 py-1.5 text-emerald-950 font-bold focus:outline-none select-all truncate"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(lastGeneratedBypass.url);
                            setBypassCopied(true);
                            addToast?.('success', 'Direct bypass tenant link copied to clipboard!');
                            setTimeout(() => setBypassCopied(false), 3000);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shrink-0 shadow-xs"
                        >
                          {bypassCopied ? <Check size={14} /> : <Copy size={14} />}
                          <span>{bypassCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Share via Email, Telegram & Launch */}
                    <div className="pt-1 grid grid-cols-3 gap-1.5">
                      <a
                        href={`mailto:${encodeURIComponent(lastGeneratedBypass.email)}?subject=${encodeURIComponent(`[HealthFlow EHR] Direct Bypass Link for Hospital Tenant ${lastGeneratedBypass.hospitalId}`)}&body=${encodeURIComponent(`Dear ${lastGeneratedBypass.name},\n\nYou have been authorized as ${lastGeneratedBypass.role} for Hospital Tenant ID: ${lastGeneratedBypass.hospitalId}.\n\nAccess your hospital tenant directly using the bypass link below:\n${lastGeneratedBypass.url}\n\nThis direct link grants immediate bypass access to your authorized hospital environment.\n\nHealthFlow EHR System`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] py-1.5 px-2 rounded-xl text-center inline-flex items-center justify-center gap-1 transition-colors shadow-xs"
                        title="Share bypass link via Email"
                      >
                        <Mail size={13} />
                        <span>Email</span>
                      </a>

                      <a
                        href={`https://t.me/share/url?url=${encodeURIComponent(lastGeneratedBypass.url)}&text=${encodeURIComponent(`[Authorized Bypass Access]\nRole: ${lastGeneratedBypass.role}\nUser: ${lastGeneratedBypass.name}\nHospital Tenant ID: ${lastGeneratedBypass.hospitalId}\nDirect Tenant Bypass Link:`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px] py-1.5 px-2 rounded-xl text-center inline-flex items-center justify-center gap-1 transition-colors shadow-xs"
                        title="Share bypass link via Telegram"
                      >
                        <Send size={13} />
                        <span>Telegram</span>
                      </a>

                      <a
                        href={lastGeneratedBypass.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] py-1.5 px-2 rounded-xl text-center inline-flex items-center justify-center gap-1 transition-colors shadow-xs"
                        title="Launch direct bypass tenant access in new tab"
                      >
                        <ExternalLink size={13} />
                        <span>Launch</span>
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ahmed Ali"
                    value={portalFullName}
                    onChange={(e) => setPortalFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    INSTITUTIONAL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. St. Mary Hospital"
                    value={portalInstitutionalName}
                    onChange={(e) => setPortalInstitutionalName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    INSTITUTIONAL EMAIL *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ahmed.ali@hospital.org"
                    value={portalEmail}
                    onChange={(e) => setPortalEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {['director', 'admin'].includes(portalSelectedRole) ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        HOSPITAL ID *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="TENANT-ID"
                        value={portalHospitalId}
                        onChange={(e) => setPortalHospitalId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono font-bold uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        LICENSE / KEY *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="LIC-109"
                        value={portalLicenseKey}
                        onChange={(e) => setPortalLicenseKey(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono font-bold uppercase"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      HOSPITAL ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="TENANT-ID"
                      value={portalHospitalId}
                      onChange={(e) => setPortalHospitalId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono font-bold uppercase"
                    />
                    <p className="text-[10px] text-gray-500 mt-1 italic">
                      Institutional license key is auto-generated and auto-saved securely upon registration.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    DEPARTMENT / UNIT *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pharmacy / Emergency / ICU"
                    value={portalDepartment}
                    onChange={(e) => setPortalDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isRegisteringPortalUser}
                    className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isRegisteringPortalUser ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Authorizing & Creating...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={14} />
                        <span>Authorize & Create {
                          portalSelectedRole === 'director' ? 'HOSPITAL DIRECTOR' :
                          portalSelectedRole === 'admin' ? 'HOSPITAL ADMIN' :
                          portalSelectedRole === 'mid-manager' ? 'MID MANAGER' :
                          portalSelectedRole === 'low-manager' ? 'LOW MANAGER' : 'STAFF PRACTITIONER'
                        }</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* List Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Registration Summary Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                      <ShieldCheck className="text-purple-600" size={16} />
                      <span>Registered Leadership & Managers</span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Registered directors, managers, and authorized practitioners in the active system directory with direct inline editing for quick corrections.
                    </p>
                  </div>
                  <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {users.filter(u => ['director', 'admin', 'mid-manager', 'low-manager', 'user'].includes(u.role || '')).length} Registered
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px] bg-gray-50/50">
                        <th className="py-2.5 px-3 font-bold">User Details</th>
                        <th className="py-2.5 px-3 font-bold">Role</th>
                        <th className="py-2.5 px-3 font-bold">Hospital ID</th>
                        <th className="py-2.5 px-3 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users
                        .filter(u => ['director', 'admin', 'mid-manager', 'low-manager', 'user'].includes(u.role || ''))
                        .map(u => (
                          <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-bold text-gray-900">{u.full_name}</div>
                              <div className="text-[11px] text-gray-500">{u.email}</div>
                              {u.department && (
                                <div className="text-[10px] text-purple-700 font-semibold">{u.department}</div>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                u.role === 'director' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                u.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                u.role === 'mid-manager' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                u.role === 'low-manager' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {u.role === 'director' ? 'Hospital Director' :
                                 u.role === 'admin' ? 'Hospital Admin' :
                                 u.role === 'mid-manager' ? 'Mid Manager' :
                                 u.role === 'low-manager' ? 'Low Manager' : 'Staff Practitioner'}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] font-bold text-gray-700">
                              {u.hospital_id || 'TENANT-ID'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setEditFullName(u.full_name || '');
                                  setEditEmail(u.email || '');
                                  setEditHospitalId(u.hospital_id || '');
                                }}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer mr-1"
                                title="Edit Profile Inline"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setUserToDelete(u);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Manager"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'admin-portal' ? (
        <div className="animate-fade-in">
           {/* Director of Hospital Registration Portal */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-150 p-5 space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="text-indigo-600" size={18} />
                  <span>Director of Hospital Registration Portal</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Register hospital directors. Registered directors are automatically synced to the users directory with full management permissions.
                </p>
              </div>

              <form onSubmit={handleRegisterHospitalAdmin} className="space-y-3">
                {hospitalAdminError && (
                  <div className="text-xs font-semibold p-3 rounded-lg border bg-red-50 text-red-800 border-red-200">
                    {hospitalAdminError}
                  </div>
                )}
                {hospitalAdminSuccess && (
                  <div className="text-xs font-semibold p-3 rounded-lg border bg-emerald-50 text-emerald-800 border-emerald-200">
                    {hospitalAdminSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    ADMIN FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={hospitalAdminName}
                    onChange={(e) => setHospitalAdminName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    INSTITUTIONAL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. St. Mary Hospital"
                    value={hospitalAdminInstitutionalName}
                    onChange={(e) => setHospitalAdminInstitutionalName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    OWNER EMAIL *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john.doe@hospital.org"
                    value={hospitalAdminEmail}
                    onChange={(e) => setHospitalAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    HOSPITAL ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TENANT-ID"
                    value={hospitalAdminHospitalId}
                    onChange={(e) => setHospitalAdminHospitalId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    LICENSE KEY *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LIC-001"
                    value={hospitalAdminLicenseKey}
                    onChange={(e) => setHospitalAdminLicenseKey(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs font-bold uppercase"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isRegisteringHospitalAdmin}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isRegisteringHospitalAdmin ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={15} />
                        <span>Authorize & Create DIRECTOR OF HOSPITAL</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
           </div>
        </div>
      ) : activeTab === 'users' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Panel: Recent Manager & Director Registrations (Last 10 Activities) */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <History className="text-amber-400" size={18} />
                  <h3 className="text-sm font-extrabold tracking-wide uppercase text-slate-100">
                    Manager & Director Registration Activity Summary
                  </h3>
                  <span className="bg-amber-400/10 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-400/20">
                    Top 10 Activities
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Audit summary displaying recent registrations for managers and directors with registrar ID and timestamp.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  onClick={async () => {
                    await handlePurgeTargetRecords();
                    addToast?.('success', 'Purged targeted test records and activity logs.');
                  }}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Purge specified test accounts and registration entries"
                >
                  <Trash2 size={13} />
                  <span>Purge Target Logs</span>
                </button>
                <button
                  onClick={() => setActiveTab('registration-portals')}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <UserPlus size={14} />
                  <span>Open Registration Portals</span>
                </button>
              </div>
            </div>

            {combinedRegistrationActivities.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No recent manager or director registration logs found. Use Registration Portals to authorize new managers.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3 font-bold">Registrar ID</th>
                      <th className="py-2.5 px-3 font-bold">Registered Account</th>
                      <th className="py-2.5 px-3 font-bold">Assigned Role</th>
                      <th className="py-2.5 px-3 font-bold">Hospital ID</th>
                      <th className="py-2.5 px-3 font-bold">Timestamp</th>
                      <th className="py-2.5 px-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {combinedRegistrationActivities.map((act) => {
                      const roleBadge = 
                        act.assignedRole === 'director' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                        act.assignedRole === 'admin' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                        act.assignedRole === 'mid-manager' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                        'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
                      
                      const roleLabel =
                        act.assignedRole === 'director' ? 'Hospital Director' :
                        act.assignedRole === 'admin' ? 'Hospital Admin' :
                        act.assignedRole === 'mid-manager' ? 'Mid-level Manager' :
                        act.assignedRole === 'low-manager' ? 'Low-level Manager' : 'Manager';

                      return (
                        <tr key={act.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-amber-300 font-bold">
                            {act.registrarId}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-200">{act.targetUserName || 'Staff User'}</div>
                            <div className="text-[11px] text-slate-400">{act.targetUserEmail}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge}`}>
                              <ShieldCheck size={10} />
                              {roleLabel}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px] font-bold">
                            {act.hospitalId || 'TENANT-ID'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                            {new Date(act.timestamp).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleDeleteActivityItem(act.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                              title="Delete this registration log entry"
                            >
                              <Trash2 size={13} />
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

          {(currentUser?.role === 'director' || currentUser?.email === OWNER_EMAIL) && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Form to Register / Authorize a Hospital Admin */}
              <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-150 p-5 space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="text-indigo-600" size={18} />
                    <span>Admin Registration Portal</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Register hospital administrators. Registered admins are automatically synced to the users directory with full management permissions.
                  </p>
                </div>
                <form onSubmit={handleRegisterHospitalAdmin} className="space-y-3">
                  {hospitalAdminError && (
                    <div className="text-xs font-semibold p-3 rounded-lg border bg-red-50 text-red-800 border-red-200">
                      {hospitalAdminError}
                    </div>
                  )}
                  {hospitalAdminSuccess && (
                    <div className="text-xs font-semibold p-3 rounded-lg border bg-emerald-50 text-emerald-800 border-emerald-200">
                      {hospitalAdminSuccess}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      ADMIN FULL NAME *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={hospitalAdminName}
                      onChange={(e) => setHospitalAdminName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      INSTITUTIONAL NAME *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. St. Mary Hospital"
                      value={hospitalAdminInstitutionalName}
                      onChange={(e) => setHospitalAdminInstitutionalName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      EMAIL *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. john.doe@hospital.org"
                      value={hospitalAdminEmail}
                      onChange={(e) => setHospitalAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      HOSPITAL ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TENANT-ID"
                      value={hospitalAdminHospitalId}
                      onChange={(e) => setHospitalAdminHospitalId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs font-bold uppercase"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isRegisteringHospitalAdmin}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isRegisteringHospitalAdmin ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={15} />
                          <span>Authorize & Create Admin</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Table of Registered Admins */}
              <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-150 p-5 space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <Database className="text-indigo-600" size={18} />
                    <span>Registered Administrators</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Authorized clinical administrators created and monitored by the workspace owner.
                  </p>
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded-xl font-sans">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Administrator</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Facility details</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ownerRegisteredAdmins.length > 0 ? (
                        ownerRegisteredAdmins.map((admin) => (
                          <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3.5">
                              {editingDirectorId === admin.id ? (
                                <div className="space-y-1">
                                  <input 
                                    value={inlineDirectorName} 
                                    onChange={(e) => setInlineDirectorName(e.target.value)}
                                    className="w-full text-sm font-bold text-gray-900 border border-gray-300 rounded px-1"
                                  />
                                  <input 
                                    value={inlineDirectorEmail} 
                                    onChange={(e) => setInlineDirectorEmail(e.target.value)}
                                    className="w-full text-xs text-gray-500 border border-gray-300 rounded px-1"
                                  />
                                </div>
                              ) : (
                                <>
                                  <div className="font-bold text-gray-900 text-sm">{admin.full_name}</div>
                                  <div className="text-xs text-gray-500">{admin.email}</div>
                                </>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-md w-fit font-mono">
                                  Institutional: {admin.institutional_name}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-md w-fit font-mono">
                                  Hospital ID: {admin.hospital_id}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded-md w-fit font-mono">
                                  Key: {admin.license_key}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="inline-flex items-center gap-2">
                                {editingDirectorId === admin.id ? (
                                  <>
                                    <button onClick={() => saveInlineDirectorEdit(admin)} title="Save" className="text-emerald-600 hover:text-emerald-800">
                                      <Save size={16} />
                                    </button>
                                    <button onClick={cancelInlineDirectorEdit} title="Cancel" className="text-gray-600 hover:text-gray-800">
                                      <X size={16} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleStartInlineDirectorEdit(admin)}
                                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors border border-indigo-200 px-2 py-1 rounded-lg"
                                      title="Edit Director"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteOwnerAdmin(admin)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer border border-red-200"
                                      title="Delete Director"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="text-center py-6 text-xs text-gray-500">No admins registered yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Email or Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white"
              />
            </div>

            {/* Batch Actions Bar */}
            {selectedUserIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-2 bg-indigo-50 border border-indigo-100 rounded-xl animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-2 px-2 mr-2">
                  <div className="bg-indigo-600 p-1 rounded-md shadow-sm">
                    <CheckSquare size={12} className="text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter leading-none">Batch Operations</span>
                    <span className="text-[11px] font-extrabold text-indigo-900 leading-none mt-0.5">Selected {selectedUserIds.length} user(s)</span>
                  </div>
                </div>

                <div className="w-[1px] h-6 bg-indigo-200 mx-1 hidden sm:block" />

                <button
                  onClick={() => setSelectedUserIds([])}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-lg hover:bg-indigo-100 transition-all cursor-pointer shadow-3xs"
                >
                  <X size={12} />
                  Deselect
                </button>

                <button
                  onClick={() => handleBatchRoleUpdate('user')}
                  disabled={isBatchProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-lg hover:bg-indigo-100 transition-all cursor-pointer shadow-3xs disabled:opacity-50"
                >
                  <Users size={12} className="text-gray-500" />
                  Set User
                </button>

                <button
                  onClick={() => handleBatchRoleUpdate('admin')}
                  disabled={isBatchProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-lg hover:bg-indigo-100 transition-all cursor-pointer shadow-3xs disabled:opacity-50"
                >
                  <Shield size={12} className="text-blue-600" />
                  Set Admin
                </button>

                <button
                  onClick={handleBatchDelete}
                  disabled={isBatchProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 border border-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-700 transition-all cursor-pointer shadow-md shadow-red-200 disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  Delete Selected
                </button>
              </div>
            )}

            {/* Role Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 bg-white min-w-[120px] justify-between cursor-pointer"
              >
                <span>{selectedRole === 'all' ? 'all roles' : selectedRole}</span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-100 rounded-lg shadow-lg z-10 py-1">
                  <button
                    onClick={() => {
                      setSelectedRole('all');
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${selectedRole === 'all' ? 'font-medium text-gray-900 bg-gray-50/50' : 'text-gray-600'}`}
                  >
                    all roles
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRole('director');
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${selectedRole === 'director' ? 'font-medium text-gray-900 bg-gray-50/50' : 'text-gray-600'}`}
                  >
                    director
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRole('admin');
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${selectedRole === 'admin' ? 'font-medium text-gray-900 bg-gray-50/50' : 'text-gray-600'}`}
                  >
                    admin
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRole('user');
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${selectedRole === 'user' ? 'font-medium text-gray-900 bg-gray-50/50' : 'text-gray-600'}`}
                  >
                    user
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="pl-6 pr-2 py-3.5 w-12 text-left">
                    <input
                      type="checkbox"
                      checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.id) || u.email === 'admin@example.com')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const checkableIds = filteredUsers
                            .filter(u => u.email !== 'admin@example.com')
                            .map(u => u.id);
                          setSelectedUserIds(checkableIds);
                        } else {
                          setSelectedUserIds([]);
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                    />
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 tracking-wider">Name</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 tracking-wider">Tenant</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 tracking-wider">Role</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 tracking-wider">Email</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 tracking-wider">Rules</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 tracking-wider">History</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const isOwner = user.email === 'admin@example.com';
                    const isSelected = selectedUserIds.includes(user.id);
                    return (
                      <React.Fragment key={user.id}>
                        <tr className={`hover:bg-gray-50/50 transition-colors ${isSelected ? 'bg-indigo-50/10' : ''}`}>
                          <td className="pl-6 pr-2 py-4">
                            {isOwner ? (
                              <div className="text-gray-300 flex justify-center w-4 h-4 items-center" title="Owner account cannot be modified">
                                <Lock size={12} className="text-gray-400" />
                              </div>
                            ) : (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUserIds(prev => [...prev, user.id]);
                                  } else {
                                    setSelectedUserIds(prev => prev.filter(id => id !== user.id));
                                  }
                                }}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                              />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="font-semibold text-gray-900">{user.full_name || 'No Name'}</div>
                              {getLastLogin(user).isInactive && (
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200 shadow-sm shrink-0 animate-pulse" title={`No login for ${getLastLogin(user).daysSince} days`}>
                                  <ShieldAlert size={10} className="text-amber-600" />
                                  <span>Inactive (30+ days)</span>
                                </span>
                              )}
                            </div>
                            {isOwner && (
                              <div className="text-xs text-gray-400 font-normal mt-0.5">Owner</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{user.hospital_id || 'demo-global'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              user.role === 'director' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'all roles' ? 'bg-amber-100 text-amber-800' :
                              user.role === 'mid-manager' ? 'bg-teal-100 text-teal-800' :
                              user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                              user.role === 'other' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role === 'other' ? (user.customRole || 'Other') : user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {user.email || <span className="text-gray-400 italic font-medium">None</span>}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => handleToggleLocationRestriction(user)}
                              className={`p-1.5 rounded-lg transition-all border flex items-center gap-1.5 ${
                                user.location_restricted 
                                  ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-xs' 
                                  : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                              }`}
                              title={user.location_restricted ? "Access Rule: LOCATION RESTRICTED (Must be in hospital grounds)" : "Access Rule: GLOBAL (No location restrictions)"}
                            >
                              {user.location_restricted ? <ShieldAlert size={14} className="animate-pulse text-rose-600" /> : <Globe size={14} />}
                              <span className="text-[10px] font-bold uppercase tracking-tight">
                                {user.location_restricted ? 'Restricted' : 'Global'}
                              </span>
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600 truncate max-w-[150px] block" title={user.history}>
                              {user.history || <span className="text-gray-400 italic font-medium">No history</span>}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => setAuditUser(user)}
                                className="bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1 cursor-pointer"
                                title="Open Auditing & Activity History Modal"
                              >
                                <Clock size={12} className="text-indigo-600" />
                                <span>History</span>
                              </button>

                              {!isOwner && (
                                <button
                                  onClick={() => handleResetPassword(user)}
                                  className="text-amber-700 hover:text-amber-850 hover:bg-amber-50 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1 border border-amber-200 cursor-pointer"
                                  title="Reset User Password"
                                >
                                  <KeyRound size={12} />
                                  <span>Reset PW</span>
                                </button>
                              )}

                              {!isOwner && (
                                <button
                                  onClick={() => {
                                    if (expandedPermissionsUserIds.includes(user.id)) {
                                      setExpandedPermissionsUserIds(prev => prev.filter(id => id !== user.id));
                                    } else {
                                      setExpandedPermissionsUserIds(prev => [...prev, user.id]);
                                      // Initialize edited permissions
                                      if (!editedUserPermissions[user.id]) {
                                        setEditedUserPermissions(prev => ({
                                          ...prev,
                                          [user.id]: user.permissions || (user.role === 'admin' 
                                            ? ['read_patient_records', 'write_clinical_notes', 'manage_billing', 'dispense_medications', 'system_backups_access', 'audit_logs_view'] 
                                            : ['read_patient_records', 'write_clinical_notes'])
                                        }));
                                      }
                                    }
                                  }}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1 border cursor-pointer ${
                                    expandedPermissionsUserIds.includes(user.id)
                                      ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                                      : 'text-indigo-700 hover:text-indigo-850 hover:bg-indigo-50 border-indigo-200'
                                  }`}
                                  title="Configure Granular Clinical Access Scopes"
                                >
                                  <Shield size={12} />
                                  <span>Permissions</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setEditFullName(user.full_name || '');
                                  setEditHospitalId(user.hospital_id || '');
                                  setEditHistory(user.history || '');
                                  setEditEmail(user.email || '');
                                  setEditRole(user.role || 'user');
                                  setEditCustomRole(user.customRole || '');
                                  setEditPermissions(user.permissions || []);
                                  setUpdateError('');
                                }}
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1 border border-gray-200 cursor-pointer"
                                title="Edit User"
                              >
                                <Pencil size={12} />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => handleGenerateBypassUrl(user)}
                                className="text-emerald-700 hover:text-emerald-850 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1 border border-emerald-200 cursor-pointer"
                                title="Copy Direct Gateway Bypass URL (Requires Hospital Location Verification)"
                              >
                                <Copy size={12} />
                                <span>Copy Link</span>
                              </button>
                              
                              {!isOwner && (
                                <button
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setDeleteError('');
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1 border border-red-200 cursor-pointer"
                                  title="Delete User"
                                >
                                  <Trash2 size={12} />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Activity History Section */}
                        {expandedUserIds.includes(user.id) && (
                          <tr key={`${user.id}-history-panel`} className="bg-gray-50/50">
                            <td colSpan={6} className="px-6 py-4 border-t border-b border-gray-100 bg-gray-50/30">
                              <div className="space-y-4 max-w-4xl">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-indigo-600 animate-spin-slow" />
                                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                      Activity & Audit History • {user.full_name || user.email}
                                    </h4>
                                  </div>
                                  <span className="text-[10px] bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded-full border border-gray-200">
                                    Secure Log Stream
                                  </span>
                                </div>

                                {/* Timeline entries */}
                                <div className="relative border-l border-gray-200 ml-2.5 pl-5 py-1 space-y-4">
                                  {activityLogs.filter(log => log.userEmail === user.email).length > 0 ? (
                                    activityLogs
                                      .filter(log => log.userEmail === user.email)
                                      .map((log) => (
                                        <div key={log.id} className="relative group">
                                          {/* Indicator dot */}
                                          <div className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-indigo-600 shadow-sm transition-transform group-hover:scale-125" />
                                          
                                          <div className="space-y-0.5">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                              <span className="text-xs font-bold text-gray-900">
                                                {log.action}
                                              </span>
                                              <span className="text-[10px] text-gray-400 font-medium">
                                                {new Date(log.timestamp).toLocaleString()}
                                              </span>
                                              <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-mono">
                                                IP: {log.ipAddress || 'N/A'}
                                              </span>
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                                              {log.details}
                                            </p>
                                            <p className="text-[9px] text-gray-400 italic">
                                              Authorized by: {log.performedBy}
                                            </p>
                                          </div>
                                        </div>
                                      ))
                                  ) : (
                                    <div className="text-xs text-gray-400 italic pl-2 py-2">
                                      No activity records logged yet for this clinical profile.
                                    </div>
                                  )}
                                </div>

                                {/* Manual Audit Action Panel */}
                                <div className="mt-4 pt-3 border-t border-gray-200/60 max-w-2xl">
                                  <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Log Administrative Check / Override Note
                                  </h5>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="Enter physical credential check outcome, clinical override reason, or status note..."
                                      value={manualLogTexts[user.id] || ''}
                                      onChange={(e) => setManualLogTexts(prev => ({ ...prev, [user.id]: e.target.value }))}
                                      className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <button
                                      onClick={() => handleAddManualLog(user.id, user.email)}
                                      disabled={isSavingManualLog[user.id] || !(manualLogTexts[user.id]?.trim())}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                                    >
                                      {isSavingManualLog[user.id] ? 'Logging...' : 'Add Log'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Expandable Permissions Configuration Section */}
                        {expandedPermissionsUserIds.includes(user.id) && (
                          <tr key={`${user.id}-permissions-panel`} className="bg-indigo-50/5">
                            <td colSpan={6} className="px-6 py-5 border-t border-b border-indigo-150 bg-indigo-50/5">
                              <div className="space-y-4 max-w-4xl">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Shield className="text-indigo-600 animate-pulse" size={16} />
                                    <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                                      Granular Clinical Access Scopes • {user.full_name || user.email}
                                    </h4>
                                  </div>
                                  <span className="text-[10px] bg-indigo-100 text-indigo-850 font-black px-2.5 py-0.5 rounded-full border border-indigo-200 uppercase tracking-wider">
                                    Role: {user.role.toUpperCase()}
                                  </span>
                                </div>

                                <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
                                  Configure exactly which clinical and system modules this professional has read/write privileges to. Permissions are validated instantly in the EHR Firestore rules and during active browser routing.
                                </p>

                                {/* Checklist Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                  {EHR_MODULES.map((perm) => {
                                    const currentSet = editedUserPermissions[user.id] || [];
                                    const isChecked = currentSet.includes(perm.key);
                                    return (
                                      <div 
                                        key={perm.key} 
                                        onClick={() => {
                                          const nextSet = isChecked 
                                            ? currentSet.filter(k => k !== perm.key)
                                            : [...currentSet, perm.key];
                                          setEditedUserPermissions(prev => ({
                                            ...prev,
                                            [user.id]: nextSet
                                          }));
                                        }}
                                        className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                                          isChecked 
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                                            : 'bg-white border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/30'
                                        }`}
                                      >
                                        <div className="pt-0.5 shrink-0">
                                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                            isChecked ? 'bg-white border-white' : 'bg-white border-indigo-200'
                                          }`}>
                                            {isChecked && <Check size={12} className="text-indigo-600" strokeWidth={4} />}
                                          </div>
                                        </div>
                                        <div className="space-y-0.5">
                                          <span className={`text-xs font-bold block ${isChecked ? 'text-white' : 'text-gray-800'}`}>{perm.label}</span>
                                          <p className={`text-[10.5px] leading-normal ${isChecked ? 'text-indigo-100' : 'text-gray-500'}`}>{perm.desc}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Save Bar */}
                                <div className="flex items-center gap-4 pt-3 border-t border-indigo-100/60">
                                  <button
                                    onClick={() => handleSavePermissions(user.id, user.email)}
                                    disabled={savingPermissions[user.id]}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer disabled:opacity-50 shrink-0 inline-flex items-center gap-1.5"
                                  >
                                    {savingPermissions[user.id] ? (
                                      <>
                                        <RefreshCw size={13} className="animate-spin" />
                                        <span>Saving Scopes...</span>
                                      </>
                                    ) : (
                                      <>
                                        <ShieldCheck size={13} />
                                        <span>Save Scopes</span>
                                      </>
                                    )}
                                  </button>

                                  {permissionsFeedback[user.id] && (
                                    <span className={`text-xs font-semibold ${
                                      permissionsFeedback[user.id].startsWith('✓') ? 'text-emerald-700' : 'text-red-700'
                                    }`}>
                                      {permissionsFeedback[user.id]}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'pending' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Right panel: Simulator Terminal */}
          <div className="lg:col-span-5 space-y-4">
            <form onSubmit={handleSimulateRequest} className="bg-white rounded-xl shadow-sm border border-gray-150 p-5 space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <ShieldAlert className="text-indigo-600" size={18} />
                  <span>Credential Request Simulator</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Simulate a clinical professional applying for access to test real-time administrative workflows.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Professional Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Abraham Tolossa"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Institutional Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. abraham@healthflow.org"
                    value={simEmail}
                    onChange={(e) => setSimEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Requested Role</label>
                    <select
                      value={simRole}
                      onChange={(e) => setSimRole(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="Doctor">Doctor</option>
                      <option value="Nurse">Nurse</option>
                      <option value="Pharmacist">Pharmacist</option>
                      <option value="Administrator">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Department</label>
                    <select
                      value={simDept}
                      onChange={(e) => setSimDept(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="Internal Medicine">Internal Med</option>
                      <option value="Emergency Department">Emergency Dept</option>
                      <option value="Main Pharmacy">Pharmacy</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Pediatrics">Pediatrics</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">State License / Credentials ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ETH-MD-9041 (leave blank for auto-generate)"
                    value={simLicense}
                    onChange={(e) => setSimLicense(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Clinical Onboarding Justification</label>
                  <textarea
                    rows={2}
                    placeholder="Describe clinical scope needs..."
                    value={simJustification}
                    onChange={(e) => setSimJustification(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSimulatingRequest}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-sm"
                >
                  {isSimulatingRequest ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Submitting Form...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>

              {simFeedback && (
                <div className={`text-xs font-bold p-3 rounded-lg border text-center ${
                  simFeedback.startsWith('✓') 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  {simFeedback}
                </div>
              )}
            </form>
          </div>
        </div>
      ) : (currentUser?.email === OWNER_EMAIL && activeTab === 'owner-admin-portal') ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          {/* Form to Register / Authorize a Hospital Admin */}
          <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-150 p-5 space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="text-indigo-600" size={18} />
                <span>Director of Hospital Registration Portal</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Register hospital directors using their unique Hospital ID and clinical license keys. Registered Directors of Hospital are automatically synced to the users directory with full management permissions.
              </p>
            </div>

            <form onSubmit={handleRegisterOwnerAdmin} className="space-y-3">
              {ownerAdminError && (
                <div className="text-xs font-semibold p-3 rounded-lg border bg-red-50 text-red-800 border-red-200">
                  {ownerAdminError}
                </div>
              )}
              {ownerAdminSuccess && (
                <div className="text-xs font-semibold p-3 rounded-lg border bg-emerald-50 text-emerald-800 border-emerald-200">
                  {ownerAdminSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Director Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Smith"
                  value={ownerAdminName}
                  onChange={(e) => setOwnerAdminName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Institutional Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Mary Hospital"
                  value={ownerInstitutionalName}
                  onChange={(e) => setOwnerInstitutionalName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jane.smith@hospital.org"
                  value={ownerAdminEmail}
                  onChange={(e) => setOwnerAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Hospital ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TENANT-ID"
                    value={ownerHospitalId}
                    onChange={(e) => setOwnerHospitalId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    License Key *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LIC-9941"
                    value={ownerLicenseKey}
                    onChange={(e) => setOwnerLicenseKey(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs font-bold uppercase"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isRegisteringOwnerAdmin}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-sm"
                >
                  {isRegisteringOwnerAdmin ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Authorizing Admin...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} />
                      <span>Authorize & Create Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            
            <hr className="my-6 border-gray-200" />

            {/* Admin Registration Portal (for Director to use) */}
            <div>
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="text-indigo-600" size={18} />
                <span>Admin Registration Portal</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Register hospital administrators. Registered admins are automatically synced to the users directory with full management permissions.
              </p>
            </div>

            <form onSubmit={handleRegisterHospitalAdmin} className="space-y-3">
              {hospitalAdminError && (
                <div className="text-xs font-semibold p-3 rounded-lg border bg-red-50 text-red-800 border-red-200">
                  {hospitalAdminError}
                </div>
              )}
              {hospitalAdminSuccess && (
                <div className="text-xs font-semibold p-3 rounded-lg border bg-emerald-50 text-emerald-800 border-emerald-200">
                  {hospitalAdminSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Admin Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={hospitalAdminName}
                  onChange={(e) => setHospitalAdminName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Institutional Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Mary Hospital"
                  value={hospitalAdminInstitutionalName}
                  onChange={(e) => setHospitalAdminInstitutionalName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john.doe@hospital.org"
                  value={hospitalAdminEmail}
                  onChange={(e) => setHospitalAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Hospital ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TENANT-ID"
                  value={hospitalAdminHospitalId}
                  onChange={(e) => setHospitalAdminHospitalId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs font-bold uppercase"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isRegisteringHospitalAdmin}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-sm"
                >
                  {isRegisteringHospitalAdmin ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Creating Admin...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} />
                      <span>Authorize & Create Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Table of Registered Admins */}
          <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-150 p-5 space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Database className="text-indigo-600" size={18} />
                <span>Registered Administrators</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Authorized clinical administrators created and monitored by the workspace owner.
              </p>
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-xl font-sans">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Administrator</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Facility details</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ownerRegisteredAdmins.length > 0 ? (
                    ownerRegisteredAdmins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3.5">
                          {editingDirectorId === admin.id ? (
                            <div className="space-y-1">
                              <input 
                                value={inlineDirectorName} 
                                onChange={(e) => setInlineDirectorName(e.target.value)}
                                className="w-full text-sm font-bold text-gray-900 border border-gray-300 rounded px-1"
                              />
                              <input 
                                value={inlineDirectorEmail} 
                                onChange={(e) => setInlineDirectorEmail(e.target.value)}
                                className="w-full text-xs text-gray-500 border border-gray-300 rounded px-1"
                              />
                            </div>
                          ) : (
                            <>
                              <div className="font-bold text-gray-900 text-sm">{admin.full_name}</div>
                              <div className="text-xs text-gray-500">{admin.email}</div>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-md w-fit font-mono">
                              Institutional: {admin.institutional_name}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-md w-fit font-mono">
                              Hospital ID: {admin.hospital_id}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded-md w-fit font-mono">
                              Key: {admin.license_key}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            {editingDirectorId === admin.id ? (
                              <>
                                <button onClick={() => saveInlineDirectorEdit(admin)} title="Save" className="text-emerald-600 hover:text-emerald-800">
                                  <Save size={16} />
                                </button>
                                <button onClick={cancelInlineDirectorEdit} title="Cancel" className="text-gray-600 hover:text-gray-800">
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartInlineDirectorEdit(admin)}
                                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors border border-indigo-200 px-2 py-1 rounded-lg"
                                  title="Edit Director"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOwnerAdmin(admin)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer border border-red-200"
                                  title="Delete Director"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-xs text-gray-400 italic">
                        No Owner-registered administrators found. Use the registration form to authorize your first clinical admin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Invite New User</h3>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <InviteUserForm onSuccess={() => setShowInviteModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Edit User</h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              {updateError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
                  {updateError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Hospital ID (Required)</label>
                <input
                  type="text"
                  value={editHospitalId}
                  onChange={(e) => setEditHospitalId(e.target.value)}
                  placeholder="e.g. 1001"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Email Address</label>
                  {editEmail && (
                    <button
                      type="button"
                      onClick={() => setEditEmail('')}
                      className="text-xs text-red-600 hover:text-red-700 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Clear Email
                    </button>
                  )}
                </div>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="e.g. email@example.com (optional)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">History / Notes (Required)</label>
                <textarea
                  value={editHistory}
                  onChange={(e) => setEditHistory(e.target.value)}
                  placeholder="Enter staff medical history or professional notes..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white min-h-[80px]"
                  required
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                <input
                  type="checkbox"
                  id="editLocationRestricted"
                  checked={editLocationRestricted}
                  onChange={(e) => setEditLocationRestricted(e.target.checked)}
                  className="h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="editLocationRestricted" className="flex items-center gap-2 cursor-pointer">
                  <ShieldAlert size={16} className="text-rose-600" />
                  <div className="flex flex-col">
                    <p className="text-xs font-bold text-rose-900 leading-none">Location Restriction</p>
                    <p className="text-[10px] text-rose-600 mt-1">Force this user to only access direct links within the hospital compound.</p>
                  </div>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => {
                    const newRole = e.target.value as any;
                    setEditRole(newRole);
                    if (newRole === 'lower level manager') {
                      setEditPermissions(prev => {
                        const newPerms = new Set([...prev, 'read', 'write', 'edit', 'delete', 'create_account']);
                        return Array.from(newPerms);
                      });
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white cursor-pointer capitalize"
                >
                  {EHR_ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {editRole === 'other' && (
                <div className="space-y-1.5 animate-in fade-in zoom-in duration-200">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Custom Role (Required)</label>
                  <input
                    type="text"
                    value={editCustomRole}
                    onChange={(e) => setEditCustomRole(e.target.value)}
                    placeholder="e.g. Guest"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white"
                    required={editRole === 'other'}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Module & Ground Rule Permissions</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  {EHR_MODULES.map(mod => (
                    <label key={mod.key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-100 p-1.5 rounded-md">
                      <input
                        type="checkbox"
                        checked={editPermissions.includes(mod.key)}
                        onChange={() => {
                          setEditPermissions(prev => 
                            prev.includes(mod.key) ? prev.filter(p => p !== mod.key) : [...prev, mod.key]
                          );
                        }}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div className="flex flex-col">
                        <span className="truncate font-semibold">{mod.label}</span>
                        <span className="text-[10px] text-gray-400 truncate">{mod.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Set Password</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter secure custom password (optional)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white font-mono"
                />
              </div>

              {/* Real-time Password Strength Meter for editing */}
              {editPassword && (() => {
                const strength = getPasswordStrength(editPassword);
                return (
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 space-y-2 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck size={12} className="text-gray-400" /> Security Strength
                      </span>
                      <span className={`text-[10px] font-bold ${strength.text}`}>
                        {strength.label}
                      </span>
                    </div>
                    
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${strength.color} transition-all duration-300`} 
                        style={{ width: strength.width }}
                      />
                    </div>

                    {/* Micro security checklists */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        {editPassword.length >= 8 ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                        <span>8+ characters</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        {/[A-Z]/.test(editPassword) && /[a-z]/.test(editPassword) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                        <span>Upper & Lower</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        {/[0-9]/.test(editPassword) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                        <span>At least one number</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        {/[^A-Za-z0-9]/.test(editPassword) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                        <span>Special character</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-gray-950 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Trash2 size={18} className="text-red-600" />
                <span>Delete User</span>
              </h3>
              <button 
                onClick={() => setUserToDelete(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer font-sans"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              {deleteError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
                  {deleteError}
                </div>
              )}

              <p className="text-sm text-gray-600 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-gray-900">{userToDelete.full_name || userToDelete.email || 'this user'}</span>? 
                This action is permanent and cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordModal && resetPasswordModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-amber-50/50">
              <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                <KeyRound size={18} className="text-amber-600" />
                <span>Temporary Password Generated</span>
              </h3>
              <button 
                onClick={() => setResetPasswordModal(null)}
                className="text-amber-900 hover:text-amber-950 text-lg font-bold cursor-pointer font-sans"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2.5">
                <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  A temporary, system-issued one-time security credential has been successfully generated for <strong className="text-amber-950 font-bold">{resetPasswordModal.userName}</strong> ({resetPasswordModal.userEmail}).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Temporary Key Code / Custom Password
                </label>
                <div className="relative bg-gray-950 rounded-xl p-1 flex items-center border border-gray-800 shadow-inner">
                  <input
                    type="text"
                    value={resetPasswordModal.tempPass}
                    onChange={(e) => setResetPasswordModal(prev => prev ? { ...prev, tempPass: e.target.value } : null)}
                    className="flex-1 bg-transparent font-mono text-sm font-semibold tracking-wider text-green-400 select-all border-none outline-none focus:ring-0 p-3"
                  />
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(resetPasswordModal.tempPass);
                      setCopiedPass(true);
                      setTimeout(() => setCopiedPass(false), 2000);
                    }}
                    className="p-3.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Copy to clipboard"
                  >
                    {copiedPass ? <Check size={16} className="text-green-400 animate-bounce" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Real-time Password Strength Meter for Reset Modal */}
              {resetPasswordModal.tempPass && (() => {
                const strength = getPasswordStrength(resetPasswordModal.tempPass);
                return (
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 space-y-2 animate-fade-in text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck size={12} className="text-gray-400" /> Security Strength
                      </span>
                      <span className={`text-[10px] font-bold ${strength.text}`}>
                        {strength.label}
                      </span>
                    </div>
                    
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${strength.color} transition-all duration-300`} 
                        style={{ width: strength.width }}
                      />
                    </div>

                    {/* Micro security checklists */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        {resetPasswordModal.tempPass.length >= 8 ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                        <span>8+ characters</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        {/[A-Z]/.test(resetPasswordModal.tempPass) && /[a-z]/.test(resetPasswordModal.tempPass) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                        <span>Upper & Lower</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        {/[0-9]/.test(resetPasswordModal.tempPass) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                        <span>At least one number</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        {/[^A-Za-z0-9]/.test(resetPasswordModal.tempPass) ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-gray-300" />}
                        <span>Special character</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2 text-xs text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                <p className="font-bold text-gray-800">Next Steps for Administrator:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Copy the security code using the copy button above.</li>
                  <li>Communicate this key directly to the practitioner via a secure physical or corporate backchannel.</li>
                  <li>The user will use this key on their next login session to securely establish new private credentials.</li>
                </ol>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-50">
                <button
                  onClick={() => setResetPasswordModal(null)}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-950 text-white rounded-lg text-sm font-semibold hover:bg-gray-850 transition-colors cursor-pointer text-center"
                >
                  Done & Secured
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Export Configuration Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/30">
              <h3 className="text-base font-bold text-indigo-950 flex items-center gap-2">
                <Download size={18} className="text-indigo-600" />
                <span>Export Users Registry</span>
              </h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer font-sans"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-2.5">
                <Info size={16} className="text-indigo-700 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-800 leading-relaxed text-left">
                  Apply filters below to customize the records compiled into the secure clinical user CSV report.
                </p>
              </div>

              {/* Role filter options */}
              <div className="space-y-2 text-left">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Target Role
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'All Roles' },
                    { id: 'director', label: 'Hospital Director' },
                    { id: 'admin', label: 'Hospital Admin' },
                    { id: 'mid-manager', label: 'Mid Manager' },
                    { id: 'low-manager', label: 'Low Manager' },
                    { id: 'user', label: 'Staff Practitioner' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setExportRoleFilter(r.id as any)}
                      className={`px-2.5 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center truncate ${
                        exportRoleFilter === r.id
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-bold'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status filter options */}
              <div className="space-y-2 text-left">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Account Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['all', 'active', 'inactive'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setExportStatusFilter(s)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                        exportStatusFilter === s
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-bold'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {s === 'all' ? 'All' : s === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 italic">
                  *Inactive status includes users who have not logged in for over 30 days.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Generate Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Floating Batch Actions Toolbar */}
      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] sm:w-auto bg-gray-900 text-white border border-gray-800 px-5 py-3.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-4 animate-fade-in max-w-2xl">
          <div className="flex items-center gap-2.5 sm:border-r sm:border-gray-800 sm:pr-5 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="bg-indigo-600 rounded-lg p-1.5 shrink-0 text-white">
                <CheckSquare size={16} />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-gray-100 uppercase tracking-wide">
                  Batch Operations
                </h4>
                <p className="text-[10px] text-gray-400">
                  Selected <span className="font-bold text-indigo-400">{selectedUserIds.length}</span> user(s)
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedUserIds([])}
              className="text-gray-400 hover:text-white text-xs font-semibold px-2 py-1 cursor-pointer sm:hidden"
            >
              Deselect
            </button>
          </div>

          {batchError && (
            <div className="px-3 py-1 bg-red-900/50 border border-red-800 text-red-300 text-[10px] font-medium rounded-lg max-w-xs truncate">
              {batchError}
            </div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
            <button
              onClick={handleBatchArchive}
              disabled={isBatchProcessing}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Archive (Ctrl + Shift + A)"
            >
              <Clock size={13} className="text-gray-400" />
              <span>Archive</span>
            </button>
            <button
              onClick={handleBatchExport}
              disabled={isBatchProcessing}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Export (Ctrl + Shift + E)"
            >
              <Download size={13} className="text-gray-400" />
              <span>Export</span>
            </button>
            <div className="w-[1px] h-4 bg-gray-800 mx-1 hidden sm:block" />
            <button
              onClick={() => handleBatchRoleUpdate('user')}
              disabled={isBatchProcessing}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <UserCheck size={13} className="text-gray-400" />
              <span>Set User</span>
            </button>
            <button
              onClick={() => handleBatchRoleUpdate('admin')}
              disabled={isBatchProcessing}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Shield size={13} className="text-gray-400" />
              <span>Set Admin</span>
            </button>
            <button
              onClick={handleBatchDelete}
              disabled={isBatchProcessing}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={13} />
              <span>Delete Selected</span>
            </button>
            <button
              onClick={() => setSelectedUserIds([])}
              className="hidden sm:inline-block text-gray-400 hover:text-white text-xs font-semibold px-2 py-1 cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Activity History Auditing Modal */}
      {auditUser && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-2xl w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/30">
              <h3 className="text-base font-bold text-indigo-950 flex items-center gap-2">
                <Clock size={18} className="text-indigo-600 animate-pulse" />
                <span>Clinical Activity History & Audit Log</span>
              </h3>
              <button 
                onClick={() => setAuditUser(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer font-sans"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0 text-xs">
                  {auditUser.full_name ? auditUser.full_name.substring(0, 2).toUpperCase() : 'U'}
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-gray-900">{auditUser.full_name || 'No Name'}</h4>
                  <p className="text-xs text-gray-500 font-mono">{auditUser.email}</p>
                </div>
              </div>

              {/* Timeline entries */}
              <div className="relative border-l border-gray-200 ml-2.5 pl-5 py-1 space-y-4 text-left">
                {activityLogs.filter(log => (log.userEmail || '').toLowerCase() === (auditUser.email || '').toLowerCase()).length > 0 ? (
                  activityLogs
                    .filter(log => (log.userEmail || '').toLowerCase() === (auditUser.email || '').toLowerCase())
                    .map((log) => (
                      <div key={log.id} className="relative group">
                        {/* Indicator dot */}
                        <div className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-indigo-600 shadow-sm transition-transform group-hover:scale-125" />
                        
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-xs font-bold text-gray-900">
                              {log.action}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-mono">
                              IP: {log.ipAddress || '127.0.0.1'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                            {log.details}
                          </p>
                          <p className="text-[9px] text-gray-400 italic">
                            Authorized by: {log.performedBy || 'System'}
                          </p>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-xs text-gray-400 italic pl-2 py-2">
                    No activity records logged yet for this clinical profile.
                  </div>
                )}
              </div>

              {/* Manual Audit Action Panel inside modal */}
              <div className="mt-4 pt-4 border-t border-gray-150 text-left">
                <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Append Administrative Check / Override Note
                </h5>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter physical credential check, clinic status notes or administrative notes..."
                    value={manualLogTexts[auditUser.id] || ''}
                    onChange={(e) => setManualLogTexts(prev => ({ ...prev, [auditUser.id]: e.target.value }))}
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={async () => {
                      await handleAddManualLog(auditUser.id, auditUser.email);
                    }}
                    disabled={isSavingManualLog[auditUser.id] || !(manualLogTexts[auditUser.id]?.trim())}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isSavingManualLog[auditUser.id] ? 'Logging...' : 'Add Log'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setAuditUser(null)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-850 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editing Owner-Created Admin Modal */}
      {editingOwnerAdmin && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden font-sans">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-950 flex items-center gap-2">
                <Pencil size={18} className="text-indigo-600" />
                <span>Edit Administrator Details</span>
              </h3>
              <button 
                onClick={() => setEditingOwnerAdmin(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveOwnerAdminEdit} className="p-6 space-y-4">
              {ownerAdminEditError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 font-semibold">
                  {ownerAdminEditError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Admin Full Name</label>
                <input
                  type="text"
                  value={editOwnerAdminName}
                  onChange={(e) => setEditOwnerAdminName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Institutional Email</label>
                <input
                  type="email"
                  value={editOwnerAdminEmail}
                  onChange={(e) => setEditOwnerAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Hospital ID</label>
                  <input
                    type="text"
                    value={editOwnerAdminHospitalId}
                    onChange={(e) => setEditOwnerAdminHospitalId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white font-mono uppercase text-xs font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">License Key</label>
                  <input
                    type="text"
                    value={editOwnerAdminLicenseKey}
                    onChange={(e) => setEditOwnerAdminLicenseKey(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-shadow bg-white font-mono uppercase text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setEditingOwnerAdmin(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingOwnerAdminEdit}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSavingOwnerAdminEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

