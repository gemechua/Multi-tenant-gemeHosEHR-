import { useState, useEffect } from 'react';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import SystemInformation from './components/SystemInformation';
import GlobalTimeBanner from './components/GlobalTimeBanner';
import Overview from './components/Overview';
import HospitalModules from './components/HospitalModules';
import UserList from './components/UserList';
import DynamicModuleView from './components/DynamicModuleView';
import AdminDashboard from './components/AdminDashboard';
import SettingsTab from './components/SettingsTab';
import FinanceDashboard from './components/FinanceDashboard';
import Sidebar from './components/Sidebar';
import { logSecurityEvent } from './lib/auditLogger';
import DataExplorer from './components/DataExplorer';
import SeoGeo from './components/SeoGeo';
import SocialContent from './components/SocialContent';
import AnalyticsTab from './components/AnalyticsTab';
import DomainsTab from './components/DomainsTab';
import IntegrationsTab from './components/IntegrationsTab';
import SecurityTab from './components/SecurityTab';
import CodeTab from './components/CodeTab';
import AgentsTab from './components/AgentsTab';
import AutomationsTab from './components/AutomationsTab';
import LogsTab from './components/LogsTab';
import ApiTab from './components/ApiTab';
import PolicyTab from './components/PolicyTab';
import DataAccessTab from './components/DataAccessTab';
import PrivacyLock from './components/PrivacyLock';
import { ToastContainer, ToastItem } from './components/Toast';
import LicenseManager, { PRE_SEEDED_TENANTS } from './components/LicenseManager';
import HospitalPortalGateway from './components/HospitalPortalGateway';
import SecureModuleWrapper from './components/SecureModuleWrapper';
import RegisterLogbook from './components/RegisterLogbook';
import { AnimatePresence, motion } from 'framer-motion';
import { SyncHistory } from './components/SyncHistory';
import BackupsTab from './components/BackupsTab';
import { LANGUAGES, Language, translate } from './lib/translations';
import GlobalSearch from './components/GlobalSearch';
import QRScanner from './components/QRScanner';

import { collection, getDocs, query, where, getDocFromServer, doc, onSnapshot, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './lib/firebase';

import { 
  Database, BarChart3, Globe, Plug, Shield, Code, Bot, 
  Zap, FileText, Braces, Settings, CheckCircle2, Lock,
  Wifi, WifiOff, RefreshCw, X
} from 'lucide-react';
import { isOffline, getOfflineQueue, syncOfflineQueue, getLastSyncTime } from './lib/offlineSync';
import KeyboardGuide from './components/KeyboardGuide';
import { useMediaDevices } from './hooks/useMediaDevices';
import { Camera, Mic, Keyboard } from 'lucide-react';

import { useAudioNotification } from './hooks/useAudioNotification';
import UserAuthGateway from './components/UserAuthGateway';
import { HOSPITAL_LAT, HOSPITAL_LON, ALLOWED_RADIUS_METERS, getDistance } from './lib/constants';

const PRIVACY_TABS = [
  'System Information',
  'Policy',
  'Data Access',
  'Backups',
  'Analytics',
  'SEO & GEO',
  'Social content',
  'Domains',
  'Integrations',
  'Security',
  'Code',
  'Agents',
  'Automations',
  'Logs',
  'API',
  'License Manager'
];

import Module8Finance from './components/Module8Finance';
import CEOCommandHub from './components/CEOCommandHub';
import Module7HumanResources from './components/Module7HumanResources';
import PlanningModule from './components/PlanningModule';

export default function App() {
  const [activeTab, setActiveTab] = useState('Data & Explorer');
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'en';
  });
  const [activeHospital, setActiveHospital] = useState<{
    id: string;
    name: string;
    hospital_unique_number: string;
    license_key: string;
  } | null>(() => {
    const saved = localStorage.getItem('active_hospital_tenant');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('active_user_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [bypassAuthData, setBypassAuthData] = useState<{ tenant: string; user: string } | null>(null);
  const [isBypassedToOwner, setIsBypassedToOwner] = useState(false);
  const [isPrivacyUnlocked, setIsPrivacyUnlocked] = useState(false);
  const [isUsersUnlocked, setIsUsersUnlocked] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');
  const [isKeyboardGuideOpen, setIsKeyboardGuideOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [lastSyncTime, setLastSyncTimeState] = useState<string | null>(getLastSyncTime());
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>(() => {
    return (localStorage.getItem('app_font_size') as 'sm' | 'base' | 'lg') || 'base';
  });

  const { camera, microphone, status: deviceStatus } = useMediaDevices();

  // Font size effect
  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === 'sm') {
      root.style.fontSize = '14px';
    } else if (fontSize === 'lg') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }
  }, [fontSize]);

  // Filter languages based on search
  const filteredLanguages = LANGUAGES.filter(lang => {
    const q = (languageSearch || '').toLowerCase();
    return (lang.name && String(lang.name).toLowerCase().includes(q)) || 
           (lang.nativeName && String(lang.nativeName).toLowerCase().includes(q)) ||
           (lang.code && String(lang.code).toLowerCase().includes(q));
  });

  const regionalLanguages = filteredLanguages.filter(l => l.region === 'Regional');
  const internationalLanguages = filteredLanguages.filter(l => l.region === 'International');

  // Offline Sync Management States
  const [isSystemOffline, setIsSystemOffline] = useState(isOffline());
  const [offlineQueueCount, setOfflineQueueCount] = useState(getOfflineQueue().length);
  const [isSyncing, setIsSyncing] = useState(false);

  const [showSyncHistory, setShowSyncHistory] = useState(false);
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);
  const { playSound } = useAudioNotification();

  const handleSync = async () => {
    const count = getOfflineQueue().length;
    if (count === 0) return;

    setIsSyncing(true);
    addToast('info', `Initiating live database synchronization for ${count} clinical updates...`);
    try {
      const tenant = activeHospital?.hospital_unique_number || 'TENANT-ID';
      const synced = await syncOfflineQueue(tenant);
      if (synced > 0) {
        addToast('success', `✓ Live Database Sync Complete: Synchronized ${synced} clinical updates successfully.`);
      }
    } catch (err: any) {
      console.error(err);
      addToast('error', `Sync failed: ${err.message || 'unable to connect to database'}`);
    } finally {
      setIsSyncing(false);
      setOfflineQueueCount(getOfflineQueue().length);
    }
  };

  const toggleSimulatedOffline = () => {
    const currentSimulated = localStorage.getItem('ehr_simulated_offline') === 'true';
    const nextSimulated = !currentSimulated;
    localStorage.setItem('ehr_simulated_offline', String(nextSimulated));
    if (nextSimulated) {
      localStorage.setItem('ehr_simulated_offline_manual', 'true');
    } else {
      localStorage.removeItem('ehr_simulated_offline_manual');
    }
    setIsSystemOffline(nextSimulated || !navigator.onLine);
    addToast('info', nextSimulated ? '⚠️ Network Offline: Simulation mode is active' : '✓ Network Online: Live synchronization is restored');
    if (!nextSimulated && navigator.onLine) {
      handleSync();
    }
  };

  // Global Data Integrity Purge (Automatic Background Task)
  useEffect(() => {
    if (activeHospital?.hospital_unique_number) {
      const tenantId = activeHospital.hospital_unique_number;
      const lastPurge = localStorage.getItem(`last_global_purge_${tenantId}`);
      const now = Date.now();
      
      // Auto-run every 24 hours
      if (!lastPurge || (now - parseInt(lastPurge)) > 86400000) {
        import('./utils/cleanupService').then(({ runGlobalCleanup }) => {
          runGlobalCleanup(tenantId).then((deleted) => {
            if (deleted > 0) {
              console.log(`[DATA INTEGRITY GUARD] Automatically purged ${deleted} mock/fake records from organization ${tenantId}.`);
            }
            localStorage.setItem(`last_global_purge_${tenantId}`, now.toString());
          });
        });
      }
    }
  }, [activeHospital?.hospital_unique_number]);

  useEffect(() => {
    const handleQueueChange = (e: any) => {
      setOfflineQueueCount(e.detail?.count ?? getOfflineQueue().length);
    };

    const handleConnectionChange = () => {
      const isNowOnline = typeof navigator !== 'undefined' && navigator.onLine;
      const manualSimulated = localStorage.getItem('ehr_simulated_offline_manual') === 'true';

      if (isNowOnline) {
        if (!manualSimulated) {
          localStorage.removeItem('ehr_simulated_offline');
          setIsSystemOffline(false);
        }
        addToast('success', '✓ Network Connected: Device is online. Synchronizing data...');
        playSound('online');
        handleSync();
      } else {
        setIsSystemOffline(true);
        addToast('info', '⚠️ Network Disconnected: Device is in offline mode.');
        playSound('offline');
      }
      runHeartbeat();
    };

    const handleLastSyncChange = (e: any) => {
      setLastSyncTimeState(e.detail?.time);
    };

    const runHeartbeat = async () => {
      const simulated = localStorage.getItem('ehr_simulated_offline') === 'true';
      const lastDiagStr = localStorage.getItem('ehr_network_diagnostics');
      let logs = [];
      try {
        if (lastDiagStr) {
          const parsed = JSON.parse(lastDiagStr);
          if (Array.isArray(parsed.logs)) {
            logs = parsed.logs;
          }
        }
      } catch (_) {}

      const startTime = Date.now();
      
      if (simulated) {
        const diag = {
          status: 'simulated',
          latency: 0,
          lastChecked: new Date().toISOString(),
          rawResponseCode: 'OFFLINE_SIMULATED',
          error: 'Offline simulation mode is active',
          logs: [{ timestamp: new Date().toISOString(), status: 'simulated', latency: 0, code: 'OFFLINE_SIMULATED' }, ...logs].slice(0, 10)
        };
        localStorage.setItem('ehr_network_diagnostics', JSON.stringify(diag));
        window.dispatchEvent(new CustomEvent('ehr-diagnostics-changed'));
        setIsSystemOffline(true);
        return;
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const diag = {
          status: 'no_network',
          latency: 0,
          lastChecked: new Date().toISOString(),
          rawResponseCode: 'ERR_INTERNET_DISCONNECTED',
          error: 'Local clinical client device has no active internet network connection',
          logs: [{ timestamp: new Date().toISOString(), status: 'no_network', latency: 0, code: 'ERR_INTERNET_DISCONNECTED' }, ...logs].slice(0, 10)
        };
        localStorage.setItem('ehr_network_diagnostics', JSON.stringify(diag));
        window.dispatchEvent(new CustomEvent('ehr-diagnostics-changed'));
        setIsSystemOffline(true);
        return;
      }

      try {
        await getDocFromServer(doc(db, 'hospitals', 'ping-test'));
        const latency = Date.now() - startTime;
        const diag = {
          status: 'online',
          latency,
          lastChecked: new Date().toISOString(),
          rawResponseCode: '200_OK',
          error: '',
          logs: [{ timestamp: new Date().toISOString(), status: 'online', latency, code: '200_OK' }, ...logs].slice(0, 10)
        };
        localStorage.setItem('ehr_network_diagnostics', JSON.stringify(diag));
        window.dispatchEvent(new CustomEvent('ehr-diagnostics-changed'));
        
        const manualSimulated = localStorage.getItem('ehr_simulated_offline_manual') === 'true';
        if (!manualSimulated) {
          localStorage.removeItem('ehr_simulated_offline');
          setIsSystemOffline(false);
        }
      } catch (err: any) {
        const latency = Date.now() - startTime;
        const isOfflineErr = err?.code === 'unavailable' || 
                             err?.message?.includes('Could not reach Cloud Firestore backend') ||
                             err?.message?.includes('failed-precondition') ||
                             err?.message?.includes('client is offline');
                             
        let status = 'online';
        let rawResponseCode = err?.code || 'ERROR';
        let errorMsg = err?.message || 'Unknown error';

        if (isOfflineErr) {
          status = 'server_unreachable';
          setIsSystemOffline(true);
          rawResponseCode = 'SERVER_UNREACHABLE';
        } else {
          status = 'online';
          rawResponseCode = err?.code || 'PERMISSION_DENIED';
          const manualSimulated = localStorage.getItem('ehr_simulated_offline_manual') === 'true';
          if (!manualSimulated) {
            localStorage.removeItem('ehr_simulated_offline');
            setIsSystemOffline(false);
          }
        }

        const diag = {
          status,
          latency,
          lastChecked: new Date().toISOString(),
          rawResponseCode,
          error: errorMsg,
          logs: [{ timestamp: new Date().toISOString(), status, latency, code: rawResponseCode }, ...logs].slice(0, 10)
        };
        localStorage.setItem('ehr_network_diagnostics', JSON.stringify(diag));
        window.dispatchEvent(new CustomEvent('ehr-diagnostics-changed'));
      }
    };

    const handleTriggerHeartbeat = () => {
      runHeartbeat();
    };

    const handleBatchAutoSave = (e: any) => {
      addToast('info', 'Autosaving... Changes successfully committed to background sync queue');
      playSound('success');
    };

    window.addEventListener('ehr-offline-queue-changed', handleQueueChange);
    window.addEventListener('ehr-last-sync-changed', handleLastSyncChange);
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    window.addEventListener('ehr-trigger-heartbeat', handleTriggerHeartbeat);
    window.addEventListener('healthflow-batch-auto-save', handleBatchAutoSave);

    // Initial run
    runHeartbeat();

    // Setup periodic 15s interval for live diagnostic telemetry
    const heartbeatInterval = setInterval(runHeartbeat, 15000);

    if (!isOffline() && getOfflineQueue().length > 0) {
      handleSync();
    }

    return () => {
      window.removeEventListener('ehr-offline-queue-changed', handleQueueChange);
      window.removeEventListener('ehr-last-sync-changed', handleLastSyncChange);
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
      window.removeEventListener('ehr-trigger-heartbeat', handleTriggerHeartbeat);
      window.removeEventListener('healthflow-batch-auto-save', handleBatchAutoSave);
      clearInterval(heartbeatInterval);
    };
  }, [activeHospital?.hospital_unique_number, isSyncing]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Handle programmatical tab navigation
  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('changeTab', handleTabChange);
    return () => {
      window.removeEventListener('changeTab', handleTabChange);
    };
  }, []);

  // Sync theme and settings across tabs and active sessions instantly in real-time via Firestore
  useEffect(() => {
    const userId = currentUser?.id || currentUser?.email || auth.currentUser?.uid;
    if (!userId) return;

    const userSettingsRef = doc(db, 'user_settings', userId);

    // Initial fetch on mount / session load
    getDoc(userSettingsRef).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.theme) {
          localStorage.setItem('theme', data.theme);
          if (data.theme === 'dark' || (data.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      } else {
        // Initialize Firestore with current localStorage theme
        const currentTheme = localStorage.getItem('theme') || 'light';
        setDoc(userSettingsRef, {
          theme: currentTheme,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(err => console.error('Failed to initialize user theme in Firestore:', err));
      }
    }).catch(err => console.error('Error fetching initial theme:', err));

    // Real-time listener across all active sessions
    const unsubscribe = onSnapshot(userSettingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.theme) {
          localStorage.setItem('theme', data.theme);
          if (data.theme === 'dark' || (data.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        if (data.language) {
          localStorage.setItem('app_language', data.language);
          setCurrentLanguage(data.language);
        }
        if (data.calendarSystem) {
          localStorage.setItem('calendar_system', data.calendarSystem);
        }
        if (data.autoSave !== undefined) {
          localStorage.setItem('batch_auto_save', JSON.stringify(data.autoSave));
        }
      }
    }, (err) => {
      console.error('User settings snapshot sync error:', err);
    });

    return () => unsubscribe();
  }, [currentUser?.id, currentUser?.email]);

  useEffect(() => {
    const handleLangChange = (e: any) => {
      if (e.detail?.language) {
        setCurrentLanguage(e.detail.language);
      }
    };
    window.addEventListener('app_language_changed', handleLangChange);
    return () => window.removeEventListener('app_language_changed', handleLangChange);
  }, []);

  // Automatically collapse sidebar when opening the 'Data & Explorer' tab and ensure it remains collapsed during sub-form transitions
  useEffect(() => {
    if (activeTab === 'Data & Explorer' && !isSidebarCollapsed) {
      setIsSidebarCollapsed(true);
    }
  }, [activeTab, isSidebarCollapsed]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleFontSizeChange = (size: 'sm' | 'base' | 'lg') => {
    setFontSize(size);
    localStorage.setItem('app_font_size', size);
    addToast('info', `Display font size set to ${size === 'sm' ? 'Small' : size === 'lg' ? 'Large' : 'Standard'}`);
  };

  // Batch Auto-Save Global Logic: Emits periodic event for open modules to trigger background sync
  useEffect(() => {
    const interval = setInterval(() => {
      const isEnabled = localStorage.getItem('ehr_autosave_heartbeat_enabled') !== 'false';
      if (isEnabled) {
        window.dispatchEvent(new CustomEvent('healthflow-batch-auto-save'));
      }
    }, 5 * 60 * 1000); // Trigger every 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkBypass = async () => {
      const params = new URLSearchParams(window.location.search);
      const bypassTenant = params.get('bypass_tenant');
      const bypassUser = params.get('bypass_user');
      
      if (bypassTenant && bypassUser) {
        setBypassAuthData({ tenant: bypassTenant, user: bypassUser });
      }
    };

    checkBypass();
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Keyboard Guide: Alt + K
      if (e.altKey && e.key?.toLowerCase() === 'k') {
        e.preventDefault();
        setIsKeyboardGuideOpen(prev => !prev);
      }

      // Navigation: Alt + Number
      if (e.altKey) {
        const key = e.key;
        if (key === '1' || key === '2' || key === '4') setActiveTab('Data & Explorer');
        if (key === '5') setActiveTab('Admin Dashboard');
        if (key === '6') setActiveTab('Users');
      }

      // Action: Esc to close modals/forms
      if (e.key === 'Escape') {
        setIsKeyboardGuideOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  const renderContent = () => {
    // Intercept with password lock screen if accessing a restricted privacy module
    if (PRIVACY_TABS.includes(activeTab) && !isPrivacyUnlocked) {
      const ownerPasscode = import.meta.env.VITE_OWNER_PASSCODE || 'fussilat9';
      return (
        <PrivacyLock 
          expectedPasscodes={[ownerPasscode]}
          title="Owner-Restricted Console"
          description="This configuration area containing settings, policies, and keys is restricted and controlled by the workspace owner only."
          ownerOnly={true}
          onUnlockSuccess={() => {
            setIsPrivacyUnlocked(true);
            addToast('success', 'Access granted! Privacy modules successfully unlocked.');
          }}
          onUnlockFailure={(enteredPass) => {
            addToast('error', `Access Denied: Incorrect passcode "${enteredPass}". Please try again.`);
          }}
        />
      );
    }

    // Intercept with passcode 'umer' if accessing the locked users division
    if (activeTab === 'Users' && !isUsersUnlocked) {
      const directorPasscode = import.meta.env.VITE_DIRECTOR_PASSCODE || 'umer';
      return (
        <PrivacyLock 
          expectedPasscodes={[directorPasscode]}
          title="Director of Hospital Console"
          description="The users list and authorization records are restricted and controlled by the Director of the Hospital only."
          badgeLabel="Director Only"
          onUnlockSuccess={() => {
            setIsUsersUnlocked(true);
            addToast('success', 'Access granted! Users division successfully unlocked.');
          }}
          onUnlockFailure={(enteredPass) => {
            addToast('error', `Access Denied: Incorrect passcode "${enteredPass}". Please try again.`);
          }}
        />
      );
    }

    switch (activeTab) {
      case 'Dashboard':
        return (
          <Dashboard 
            activeHospital={activeHospital} 
            addToast={addToast} 
            onSelectPatient={(p) => {
              setActiveTab('Data & Explorer');
              addToast('info', `Navigated to patient file for ${p.full_name || p.name || 'Patient'}`);
            }}
            onSelectModule={(m) => setActiveTab(m)}
          />
        );
      case 'System Information':
        return <SystemInformation />;
      case 'Home':
        return (
          <Home setActiveTab={setActiveTab} currentLanguage={currentLanguage} />
        );

      case 'Overview':
        return (
          <Overview />
        );

      case 'Hospital modules':
        return (
          <div className="space-y-8">
            <HospitalModules 
              activeHospital={activeHospital} 
              isSidebarCollapsed={isSidebarCollapsed}
              setIsSidebarCollapsed={setIsSidebarCollapsed}
              addToast={addToast}
            />
          </div>
        );
      
      case 'Users':
        return (
          <SecureModuleWrapper moduleName="Users" addToast={addToast} onCancel={() => setActiveTab('Dashboard')}>
            <div className="space-y-8">
              <UserList addToast={addToast} activeTab={activeTab} currentUser={currentUser} />
            </div>
          </SecureModuleWrapper>
        );

      case 'Admin Dashboard':
        return (
          <SecureModuleWrapper moduleName="Admin Dashboard" addToast={addToast} onCancel={() => setActiveTab('Dashboard')}>
            <div className="space-y-8">
              <AdminDashboard activeHospital={activeHospital} />
            </div>
          </SecureModuleWrapper>
        );

      case 'Finance Department':
        return (
          <SecureModuleWrapper moduleName="Finance Department" addToast={addToast} onCancel={() => setActiveTab('Dashboard')}>
            <div className="space-y-8">
              <FinanceDashboard 
                activeHospital={activeHospital} 
                addToast={addToast} 
              />
            </div>
          </SecureModuleWrapper>
        );

      case 'Advanced Hospital Administration & CEO Command Hub':
        return (
          <div className="space-y-8">
            <CEOCommandHub />
          </div>
        );

      case 'Advanced Hospital Finance Hub':
        return (
          <div className="space-y-8">
            <Module8Finance
              activeHospital={activeHospital}
              addToast={addToast}
            />
          </div>
        );

      case 'Data & Explorer':
        return (
          <div className="space-y-8">
            <DataExplorer 
              isSidebarCollapsed={isSidebarCollapsed} 
              setIsSidebarCollapsed={setIsSidebarCollapsed} 
            />
          </div>
        );

      case 'Register Logbook':
      case 'Register Logbook Register Table (Editable Format)':
      case 'Register Logbook Register Table (Editable PDF Format)':
      case 'HOSPITAL SERVICE ASSESSMENT AUDIT (CHAPTERS 1-23)':
      case 'Departmental Report Hub':
      case 'Hospital Service Assessment Audit (Chapters 1-23)':
        return (
          <div className="space-y-8">
            <RegisterLogbook 
              activeHospital={activeHospital} 
              currentUser={currentUser} 
              addToast={addToast}
              initialSubTab={activeTab}
            />
          </div>
        );

      case 'Settings':
        return (
          <div className="space-y-8">
            <SettingsTab addToast={addToast} activeHospital={activeHospital} currentUser={currentUser} />
          </div>
        );

      case 'Analytics':
        return (
          <AnalyticsTab />
        );

      case 'SEO & GEO':
        return (
          <SeoGeo />
        );

      case 'Social content':
        return (
          <SocialContent />
        );

      case 'Domains':
        return (
          <DomainsTab />
        );

      case 'Integrations':
        return (
          <IntegrationsTab />
        );

      case 'Security':
        return (
          <SecurityTab />
        );

      case 'Code':
        return (
          <CodeTab />
        );

      case 'Agents':
        return (
          <AgentsTab />
        );

      case 'Automations':
        return (
          <AutomationsTab />
        );

      case 'Logs':
        return (
          <LogsTab />
        );

      case 'API':
        return (
          <ApiTab />
        );

      case 'Policy':
        return (
          <PolicyTab />
        );

      case 'Data Access':
        return (
          <DataAccessTab />
        );

      case 'Backups':
        return (
          <BackupsTab />
        );

      case 'License Manager':
        return (
          <LicenseManager />
        );

      case 'Planning Module (Strategic & Operational)':
        return (
          <SecureModuleWrapper moduleName="Planning Module (Strategic & Operational)" addToast={addToast} onCancel={() => setActiveTab('Dashboard')}>
            <div className="space-y-8">
              <PlanningModule
                activeHospital={activeHospital}
                addToast={addToast}
              />
            </div>
          </SecureModuleWrapper>
        );

      case 'Module 7: Human Resource Management':
        return (
          <SecureModuleWrapper moduleName="Module 7: Human Resource Management" addToast={addToast} onCancel={() => setActiveTab('Dashboard')}>
            <div className="space-y-8">
              <Module7HumanResources
                activeHospital={activeHospital}
                addToast={addToast}
                currentLanguage={currentLanguage}
              />
            </div>
          </SecureModuleWrapper>
        );

      case 'Module 3: Health Service IS':
      case 'Module 4: Quality Improvement':
      case 'Module 5: Environmental Health':
      case 'Module 9: Facility Equipment':
      case 'Module 10: Bio Medical':
      case 'Module 11: Pharmacy':
      case 'Module 12: Security Guard':
        return (
          <div className="space-y-8">
            <DynamicModuleView 
              activeTab={activeTab} 
              activeHospital={activeHospital}
              addToast={addToast}
              setActiveTab={setActiveTab}
              currentLanguage={currentLanguage}
            />
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm max-w-4xl">
            <div className="mx-auto w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 text-gray-400 mb-4">
              <Database size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{activeTab} Section</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              The {activeTab} service is fully modeled in our schema blueprint. Live production integrations can be deployed on-demand.
            </p>
            <button 
              onClick={() => {
                setActiveTab('Data & Explorer');
              }}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Return to Data Explorer
            </button>
          </div>
        );
    }
  };

  const handleLogoutHospital = () => {
    localStorage.removeItem('active_hospital_tenant');
    localStorage.removeItem('active_user_session');
    setActiveHospital(null);
    setCurrentUser(null);
    setIsBypassedToOwner(false);
    setActiveTab('Data & Explorer');
    addToast('info', 'Institutional tenant session terminated securely.');
  };

  if (bypassAuthData) {
    return (
      <div className="min-h-screen bg-slate-950">
        <UserAuthGateway 
          bypassTenant={bypassAuthData.tenant}
          bypassUserIdentifier={bypassAuthData.user}
          addToast={addToast}
          onCancel={() => {
            setBypassAuthData(null);
            const url = new URL(window.location.href);
            url.searchParams.delete('bypass_tenant');
            url.searchParams.delete('bypass_user');
            window.history.replaceState({}, '', url.toString());
          }}
          onAuthSuccess={async (user) => {
            try {
              // Fetch/Store user theme preference in Firestore and synchronize instantly on login
              const userId = user.id || user.email;
              if (userId) {
                const userSettingsRef = doc(db, 'user_settings', userId);
                const docSnap = await getDoc(userSettingsRef);
                if (docSnap.exists() && docSnap.data().theme) {
                  const t = docSnap.data().theme;
                  localStorage.setItem('theme', t);
                  if (t === 'dark') document.documentElement.classList.add('dark');
                  else document.documentElement.classList.remove('dark');
                } else {
                  const currentTheme = localStorage.getItem('theme') || 'light';
                  await setDoc(userSettingsRef, {
                    theme: currentTheme,
                    updatedAt: serverTimestamp()
                  }, { merge: true });
                }
              }

              // 1. Query license details for this hospital_id
              const licensesRef = collection(db, 'licenses');
              const qLic = query(licensesRef, where('hospital_id', '==', bypassAuthData.tenant));
              const licSnap = await getDocs(qLic);
              
              let validLicense: any = null;
              if (!licSnap.empty) {
                validLicense = { id: licSnap.docs[0].id, ...licSnap.docs[0].data() };
              } else {
                const localMatch = PRE_SEEDED_TENANTS.find(t => t.hospital_unique_number === bypassAuthData.tenant);
                if (localMatch) validLicense = localMatch;
              }

              if (!validLicense || validLicense.is_active === false) {
                addToast('error', 'Bypass Failed: The organization license is inactive or expired.');
                return;
              }

              // 2. Resolve hospital name
              let hospitalName = `Hospital tenant ${bypassAuthData.tenant}`;
              const hospitalsRef = collection(db, 'hospitals');
              const hospQ = query(hospitalsRef, where('hospital_unique_number', '==', bypassAuthData.tenant));
              const hospSnapshot = await getDocs(hospQ);
              if (!hospSnapshot.empty) {
                hospitalName = hospSnapshot.docs[0].data().name;
              } else {
                const localMatch = PRE_SEEDED_TENANTS.find(t => t.hospital_unique_number === bypassAuthData.tenant);
                if (localMatch) hospitalName = localMatch.name;
              }

              const sessionObj = {
                id: validLicense.id || bypassAuthData.tenant,
                name: hospitalName,
                hospital_unique_number: bypassAuthData.tenant,
                license_key: validLicense.license_key || ''
              };

              localStorage.setItem('active_hospital_tenant', JSON.stringify(sessionObj));
              localStorage.setItem('active_user_session', JSON.stringify(user));
              
              setActiveHospital(sessionObj);
              setCurrentUser(user);
              setActiveTab('Home');

              if (user.role === 'admin' || user.role === 'director') setIsPrivacyUnlocked(true);
              if (user.role === 'director') setIsUsersUnlocked(true);

              setBypassAuthData(null);
              const url = new URL(window.location.href);
              url.searchParams.delete('bypass_tenant');
              url.searchParams.delete('bypass_user');
              window.history.replaceState({}, '', url.toString());

            } catch (err: any) {
              addToast('error', `Bypass error: ${err.message}`);
            }
          }}
        />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  if (!activeHospital && !isBypassedToOwner) {
    return (
      <div className="min-h-screen bg-slate-950">
        <HospitalPortalGateway 
          onLoginSuccess={(hosp) => {
            setActiveHospital(hosp);
            setActiveTab('Data & Explorer');
            addToast('success', `Welcome back to ${hosp.name}. Active licensed session initialized.`);
          }}
          onBypassToOwner={() => {
            setIsBypassedToOwner(true);
            setActiveTab('License Manager');
            addToast('info', 'Platform Owner console unlocked. Authenticating control authority.');
          }}
        />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen bg-gray-50 dark:bg-slate-950 transition-all duration-200 ${
      fontSize === 'sm' ? 'text-[13px]' : fontSize === 'lg' ? 'text-[18px]' : 'text-[15px]'
    }`}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        activeHospital={activeHospital}
        onLogoutHospital={handleLogoutHospital}
        userRole={isBypassedToOwner ? 'owner' : 'user'}
        currentLanguage={currentLanguage}
      />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{translate(activeTab, currentLanguage)}</h1>

              <div className="h-8 w-px bg-gray-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

              {/* Sync History Modal Trigger */}
              <button
                onClick={() => setShowSyncHistory(true)}
                className="p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-850 transition-all shadow-3xs cursor-pointer text-gray-500 hover:text-indigo-600"
                title="View Synchronization History"
              >
                <Database size={16} />
              </button>

              {/* Global Search Bar with Fuzzy Match & Quick Scanner */}
              <div className="w-full md:w-auto">
                <GlobalSearch 
                  activeHospital={activeHospital}
                  onSelectPatient={(p) => {
                    setActiveTab('Data & Explorer');
                    addToast('info', `Navigated to patient record: ${p.full_name || p.name || 'Patient'}`);
                  }}
                  onSelectModule={(m) => {
                    setActiveTab(m);
                    addToast('info', `Opened module: ${m}`);
                  }}
                  onOpenQRScanner={() => setShowQRScannerModal(true)}
                />
              </div>

              {/* Sync History Modal */}
              <AnimatePresence>
                {showSyncHistory && (
                  <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
                    >
                      <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <RefreshCw size={20} />
                          </div>
                          <div>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight">Live Sync History</h2>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Audit Trail & Transaction Logs</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setShowSyncHistory(false)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-400 transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-slate-950/20">
                        <SyncHistory />
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex justify-center">
                        <button
                          onClick={() => setShowSyncHistory(false)}
                          className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-wider rounded-xl hover:scale-105 transition-all"
                        >
                          Close History
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Active Device Indicators */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-3xs">
                <div className={`flex items-center gap-1.5 text-[10px] font-bold ${camera ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <Camera size={12} />
                  <span>{camera ? 'CAM' : 'OFF'}</span>
                </div>
                <div className="w-[1px] h-3 bg-gray-200 dark:bg-slate-800" />
                <div className={`flex items-center gap-1.5 text-[10px] font-bold ${microphone ? 'text-indigo-600' : 'text-gray-400'}`}>
                  <Mic size={12} />
                  <span>{microphone ? 'MIC' : 'OFF'}</span>
                </div>
              </div>

              {/* Keyboard Guide Toggle */}
              <button
                onClick={() => setIsKeyboardGuideOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold border border-indigo-100 dark:border-indigo-900/40 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-all shadow-3xs cursor-pointer"
                title="Keyboard Guide (Alt + K)"
              >
                <Keyboard size={14} />
                <span className="hidden sm:inline">Shortcuts</span>
              </button>
              
              {/* Language Picker Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-850 text-gray-700 dark:text-gray-200 text-xs font-bold border border-gray-200 dark:border-slate-800 rounded-xl transition-all shadow-3xs cursor-pointer"
                >
                  <span className="text-sm">{LANGUAGES.find(l => l.code === currentLanguage)?.flag}</span>
                  <span className="ml-0.5">{LANGUAGES.find(l => l.code === currentLanguage)?.nativeName}</span>
                  <span className="text-gray-400 font-normal ml-1">▼</span>
                </button>

                {showLanguageDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowLanguageDropdown(false)}
                    />
                    <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 text-left animate-fade-in flex flex-col max-h-[500px]">
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800 mb-2">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400">Select Language / ቋንቋ ይምረጡ</span>
                        <div className="mt-2 relative">
                          <input
                            type="text"
                            placeholder="Search language..."
                            value={languageSearch}
                            onChange={(e) => setLanguageSearch(e.target.value)}
                            className="w-full px-8 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                            autoFocus
                          />
                          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                            <Globe size={12} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-1">
                        {/* Regional Group */}
                        {regionalLanguages.length > 0 && (
                          <div className="mb-2">
                            <div className="px-3 py-1 text-[9px] uppercase font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50/50 dark:bg-indigo-950/20 rounded-md mb-1">
                              Regional Languages
                            </div>
                            {regionalLanguages.map(lang => (
                              <button
                                key={lang.code}
                                onClick={() => {
                                  setCurrentLanguage(lang.code);
                                  localStorage.setItem('app_language', lang.code);
                                  setShowLanguageDropdown(false);
                                  setLanguageSearch('');
                                  addToast('success', `Language changed to ${lang.name} (${lang.nativeName})`);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                                  currentLanguage === lang.code
                                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span className="text-base">{lang.flag}</span>
                                  <span>{lang.nativeName}</span>
                                  <span className="text-gray-400 dark:text-gray-500 text-[10px] font-normal">({lang.name})</span>
                                </span>
                                {currentLanguage === lang.code && <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* International Group */}
                        {internationalLanguages.length > 0 && (
                          <div>
                            <div className="px-3 py-1 text-[9px] uppercase font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50/50 dark:bg-emerald-950/20 rounded-md mb-1">
                              International Languages
                            </div>
                            {internationalLanguages.map(lang => (
                              <button
                                key={lang.code}
                                onClick={() => {
                                  setCurrentLanguage(lang.code);
                                  localStorage.setItem('app_language', lang.code);
                                  setShowLanguageDropdown(false);
                                  setLanguageSearch('');
                                  addToast('success', `Language changed to ${lang.name} (${lang.nativeName})`);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                                  currentLanguage === lang.code
                                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span className="text-base">{lang.flag}</span>
                                  <span>{lang.nativeName}</span>
                                  <span className="text-gray-400 dark:text-gray-500 text-[10px] font-normal">({lang.name})</span>
                                </span>
                                {currentLanguage === lang.code && <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>}
                              </button>
                            ))}
                          </div>
                        )}

                        {filteredLanguages.length === 0 && (
                          <div className="px-3 py-8 text-center">
                            <Globe size={24} className="mx-auto mb-2 text-gray-300 animate-pulse" />
                            <p className="text-[10px] text-gray-500 font-mono">No matching languages found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Font Size Selector */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-1 shadow-3xs">
                <button 
                  onClick={() => handleFontSizeChange('sm')}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all ${fontSize === 'sm' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                  title="Small Font Size"
                >
                  A
                </button>
                <button 
                  onClick={() => handleFontSizeChange('base')}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${fontSize === 'base' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                  title="Standard Font Size"
                >
                  A
                </button>
                <button 
                  onClick={() => handleFontSizeChange('lg')}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${fontSize === 'lg' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                  title="Large Font Size"
                >
                  A
                </button>
              </div>
            </div>

            {/* Offline Sync and Connection Alert Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <button
                  onClick={toggleSimulatedOffline}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    isSystemOffline 
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400' 
                      : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  }`}
                  title={isSystemOffline ? "Simulating offline mode. Click to restore online sync." : "Live connection active. Click to simulate offline mode."}
                >
                  {isSystemOffline ? (
                    <>
                      <WifiOff size={14} className="text-amber-500 animate-pulse" />
                      <span>Offline Mode</span>
                    </>
                  ) : (
                    <>
                      <Wifi size={14} className="text-emerald-500 animate-pulse" />
                      <span>Cloud Connected</span>
                    </>
                  )}
                </button>
                {lastSyncTime && (
                  <span className="text-[9px] text-gray-400 font-mono mt-0.5 px-1">
                    Last Sync: {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>

              {offlineQueueCount > 0 && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing || isSystemOffline}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border animate-pulse transition-all shadow-sm ${
                    isSystemOffline
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 cursor-not-allowed'
                      : 'bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700 cursor-pointer'
                  }`}
                  title={isSystemOffline ? "Internet required to sync clinical record updates." : "Click to push clinical updates to live cloud database."}
                >
                  <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                  <span>{offlineQueueCount} Sync Pending</span>
                </button>
              )}
            </div>

            {activeHospital && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                  Tenant: {activeHospital.name} ({activeHospital.hospital_unique_number})
                </span>
              </div>
            )}
            {PRIVACY_TABS.includes(activeTab) && isPrivacyUnlocked && (
              <button
                onClick={() => {
                  setIsPrivacyUnlocked(false);
                  setActiveTab('Data & Explorer');
                  addToast('info', 'Secure privacy session cleared and locked.');
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-100 hover:border-gray-200 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Lock size={12} />
                Lock Privacy Session
              </button>
            )}
            {activeTab === 'Users' && isUsersUnlocked && (
              <button
                onClick={() => {
                  setIsUsersUnlocked(false);
                  setActiveTab('Data & Explorer');
                  addToast('info', 'Secure users session cleared and locked.');
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-100 hover:border-gray-200 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Lock size={12} />
                Lock Users Session
              </button>
            )}
          </header>

          <GlobalTimeBanner />

          {renderContent()}
        </div>
      </main>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Global Clinical QR & Barcode Scanner Portal Modal */}
      {showQRScannerModal && (
        <div className="fixed inset-0 z-[170] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <QRScanner 
            onScan={(scannedData) => {
              addToast('success', '✓ QR Code Scanned & Auto-Filled Successfully!');
            }}
            onClose={() => setShowQRScannerModal(false)}
          />
        </div>
      )}

      <KeyboardGuide 
        isOpen={isKeyboardGuideOpen} 
        onClose={() => setIsKeyboardGuideOpen(false)} 
        activeTab={activeTab}
      />
    </div>
  );
}
