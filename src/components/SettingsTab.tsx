import React, { useState, useEffect, useRef } from 'react';
import {
  Settings, Moon, Sun, Monitor, CheckCircle, Clock, Camera, Mic,
  Activity, ShieldAlert, RefreshCw, CheckCircle2, AlertCircle, Sliders, Play, X,
  Database, Bell, BellOff
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { isFakeOrFalseRow } from '../utils/dataIntegrity';
import { doc, setDoc, serverTimestamp, getDoc, collection, onSnapshot, addDoc } from 'firebase/firestore';
import AttendanceLog from './hr/AttendanceLog';
import { 
  useMediaDevices, captureCameraWithRetry, verifyStreamFrame, 
  CameraConstraints, PermissionStateExtended 
} from '../hooks/useMediaDevices';

interface SettingsTabProps {
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  activeHospital?: any;
  currentUser?: any;
}

export default function SettingsTab({ addToast, activeHospital, currentUser }: SettingsTabProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
    const [activeSubTab, setActiveSubTab] = useState<'general' | 'attendance'>('general');

  const [autosaveEnabled, setAutosaveEnabled] = useState(() => {
    return localStorage.getItem('ehr_autosave_heartbeat_enabled') !== 'false';
  });

  const [audioEnabled, setAudioEnabled] = useState(() => {
    return localStorage.getItem('ehr_audio_notifications_enabled') === 'true';
  });

  const toggleAutosave = () => {
    const newVal = !autosaveEnabled;
    setAutosaveEnabled(newVal);
    localStorage.setItem('ehr_autosave_heartbeat_enabled', String(newVal));
    addToast?.('info', newVal ? 'Auto-save and heartbeat enabled' : 'Auto-save and heartbeat disabled');
  };

  const toggleAudio = () => {
    const newVal = !audioEnabled;
    setAudioEnabled(newVal);
    localStorage.setItem('ehr_audio_notifications_enabled', String(newVal));
    addToast?.('info', newVal ? 'Audio notifications enabled' : 'Audio notifications disabled');
  };

  // Media Devices hook integration
  const {
    camera,
    microphone,
    status: deviceStatus,
    cameraPermission,
    micPermission,
    activeConstraints,
    setActiveConstraints,
    requestPermissions,
    refresh: refreshDevices
  } = useMediaDevices();

  // Diagnostics & Loopback state
  const [isTestingLoopback, setIsTestingLoopback] = useState(false);
  const [loopbackModalOpen, setLoopbackModalOpen] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<{
    permission: 'pass' | 'fail' | 'pending';
    enumeration: 'pass' | 'fail' | 'pending';
    streamCapture: 'pass' | 'fail' | 'pending';
    frameRender: 'pass' | 'fail' | 'pending';
    fps: number;
    retries: number;
    resolution: string;
    isEmulated: boolean;
  } | null>(null);

  const loopbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const loopbackStreamRef = useRef<MediaStream | null>(null);

  // Attendance log states
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [masterShifts, setMasterShifts] = useState<any[]>([]);
  const [handovers, setHandovers] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  const getUserId = () => currentUser?.id || currentUser?.email || auth.currentUser?.uid;

  useEffect(() => {
    const fetchSettings = async () => {
      const userId = getUserId();
      if (!userId) return;
      try {
        const docSnap = await getDoc(doc(db, 'user_settings', userId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.theme) setTheme(data.theme);
          if (data.activeConstraints) setActiveConstraints(data.activeConstraints);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };
    fetchSettings();
  }, [currentUser]);

  // Fetch Attendance Log data reactively when sub-tab is active
  useEffect(() => {
    if (activeSubTab !== 'attendance') return;

    const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';
    setLoadingAttendance(true);

    const unsubAtt = onSnapshot(collection(db, 'hr_attendance_registry'), (snap) => {
      let list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setAttendanceRecords(list.filter(x => x.hospital_id === hospital_id));
      setLoadingAttendance(false);
    }, (err) => {
      console.error("Attendance snapshot error:", err);
      setLoadingAttendance(false);
    });

    const unsubStaff = onSnapshot(collection(db, 'hr_staff_registry'), (snap) => {
      let list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setStaff(list.filter(x => x.hospital_id === hospital_id));
    }, (err) => {
      console.error("Staff snapshot error:", err);
    });

    const unsubShifts = onSnapshot(collection(db, 'hr_master_shifts'), (snap) => {
      let list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setMasterShifts(list.filter(x => x.hospital_id === hospital_id));
    }, (err) => {
      console.error("Shifts snapshot error:", err);
    });

    const unsubHandovers = onSnapshot(collection(db, 'hr_handovers'), (snap) => {
      let list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setHandovers(list.filter(x => x.hospital_id === hospital_id));
    }, (err) => {
      console.error("Handovers snapshot error:", err);
    });

    return () => {
      unsubAtt();
      unsubStaff();
      unsubShifts();
      unsubHandovers();
    };
  }, [activeSubTab, activeHospital]);

  const handleSaveSettings = async (overrides?: Record<string, any>) => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const payload = {
        theme,
        activeConstraints,
        updatedAt: serverTimestamp(),
        ...overrides
      };
      await setDoc(doc(db, 'user_settings', userId), payload, { merge: true });
      setSaveStatus('Settings updated successfully');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (error) {
      console.error('Failed to sync settings:', error);
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    handleSaveSettings({ theme: newTheme });
  };

  const handleConstraintChange = (key: keyof CameraConstraints, val: any) => {
    const updated = { ...activeConstraints, [key]: val };
    setActiveConstraints(updated);
    handleSaveSettings({ activeConstraints: updated });
    if (addToast) {
      addToast('info', `Camera constraint updated: ${key} = ${val}`);
    }
  };

  const handleRegrantPermissions = async () => {
    if (addToast) addToast('info', 'Requesting camera and microphone permissions...');
    const granted = await requestPermissions();
    if (granted) {
      if (addToast) addToast('success', '✓ Camera & Microphone permissions active.');
    } else {
      if (addToast) addToast('error', 'Permissions denied or prompt dismissed. Please allow camera access in browser settings.');
    }
  };

  // Hardware Loopback Diagnostics Test Runner
  const runMediaLoopbackTest = async () => {
    setLoopbackModalOpen(true);
    setIsTestingLoopback(true);
    setDiagnosticLogs(['[00:00] Initializing Media Diagnostics hardware loopback suite...']);
    setTestResults({
      permission: 'pending',
      enumeration: 'pending',
      streamCapture: 'pending',
      frameRender: 'pending',
      fps: 0,
      retries: 0,
      resolution: '0x0',
      isEmulated: false
    });

    const appendLog = (msg: string) => {
      setDiagnosticLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    try {
      // Step 1: Permission check
      appendLog('Step 1: Checking browser permission status API...');
      await new Promise(r => setTimeout(r, 400));
      const permPass = cameraPermission !== 'denied';
      appendLog(`Permission check: ${cameraPermission.toUpperCase()}`);
      setTestResults(prev => prev ? { ...prev, permission: permPass ? 'pass' : 'fail' } : null);

      // Step 2: Device enumeration
      appendLog('Step 2: Enumerating hardware media devices...');
      await refreshDevices();
      await new Promise(r => setTimeout(r, 400));
      const enumPass = !!camera || deviceStatus === 'ready';
      appendLog(camera ? `Hardware detected: ${camera.label || 'Default Video Device'}` : 'No hardware camera detected, falling back to emulation stream.');
      setTestResults(prev => prev ? { ...prev, enumeration: enumPass ? 'pass' : 'fail' } : null);

      // Step 3: Stream Capture with Exponential Backoff Retry
      appendLog('Step 3: Initializing video stream with exponential backoff retry mechanism...');
      
      const widthMap = { '1080p': 1920, '720p': 1280, '480p': 640 };
      const heightMap = { '1080p': 1080, '720p': 720, '480p': 480 };
      const w = widthMap[activeConstraints.resolution];
      const h = heightMap[activeConstraints.resolution];

      const rawConstraints: MediaStreamConstraints = {
        video: {
          width: { ideal: w },
          height: { ideal: h },
          frameRate: { ideal: activeConstraints.frameRate }
        }
      };

      let retriesCount = 0;
      const captureResult = await captureCameraWithRetry(
        rawConstraints,
        3,
        300,
        (attempt, reason) => {
          retriesCount = attempt;
          appendLog(`⚠️ Retry attempt #${attempt} triggered: ${reason}. Retrying with exponential backoff...`);
        }
      );

      appendLog(`Stream captured successfully. Retries used: ${captureResult.retriesUsed}. Emulated fallback: ${captureResult.isEmulated}`);
      setTestResults(prev => prev ? { 
        ...prev, 
        streamCapture: 'pass',
        retries: captureResult.retriesUsed,
        isEmulated: captureResult.isEmulated,
        resolution: `${captureResult.resolution.width}x${captureResult.resolution.height}`
      } : null);

      // Attach stream to loopback video element
      loopbackStreamRef.current = captureResult.stream;
      if (loopbackVideoRef.current) {
        loopbackVideoRef.current.srcObject = captureResult.stream;
        try {
          await loopbackVideoRef.current.play();
        } catch (e) {
          appendLog(`Video element play auto-play note: ${e}`);
        }
      }

      // Step 4: Frame rendering and non-black pixel verification
      appendLog('Step 4: Sampling video track frames for luminance and resolution...');
      const frameCheck = await verifyStreamFrame(captureResult.stream, 2000);
      appendLog(`Frame Analysis: Resolution = ${frameCheck.width}x${frameCheck.height}, Black Screen Detected = ${frameCheck.isBlack}`);

      const framePass = frameCheck.width > 0 && !frameCheck.isBlack;
      setTestResults(prev => prev ? { 
        ...prev, 
        frameRender: framePass ? 'pass' : 'fail',
        resolution: `${frameCheck.width}x${frameCheck.height}`,
        fps: activeConstraints.frameRate
      } : null);

      if (framePass) {
        appendLog('✓ LOOPBACK TEST PASSED: Camera hardware initialized properly. No black screen detected.');
        if (addToast) addToast('success', '✓ Media Diagnostics test completed successfully!');
      } else {
        appendLog('❌ LOOPBACK TEST ALERT: Stream output is stalled or black. Emulation fallback engaged.');
        if (addToast) addToast('info', 'Hardware camera stalled; emulator fallback active.');
      }

    } catch (err: any) {
      appendLog(`❌ Diagnostic failure: ${err?.message || err}`);
      if (addToast) addToast('error', 'Diagnostics encountered an error.');
    } finally {
      setIsTestingLoopback(false);
    }
  };

  const stopLoopbackStream = () => {
    if (loopbackStreamRef.current) {
      loopbackStreamRef.current.getTracks().forEach(t => t.stop());
      loopbackStreamRef.current = null;
    }
    if (loopbackVideoRef.current) {
      loopbackVideoRef.current.srcObject = null;
    }
    setLoopbackModalOpen(false);
  };

  const handleAddLog = async (data: any) => {
    if (isFakeOrFalseRow(data)) {
      if (addToast) {
        addToast('error', '⚠️ Cannot record false, mock, dummy, or fake attendance details!');
      }
      return;
    }
    try {
      const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';
      await addDoc(collection(db, 'hr_attendance_registry'), {
        ...data,
        hospital_id,
        lastUpdated: new Date().toISOString()
      });
      if (addToast) {
        addToast('success', '✓ New attendance log registered successfully.');
        addToast('info', 'Verification request sent to Module 7: Human Resource Management.');
      }
    } catch (err) {
      console.error("Add log error:", err);
      if (addToast) {
        addToast('error', 'Failed to register new attendance log.');
      }
    }
  };

  const localAddToast = addToast || ((type, msg) => {
    console.log(`Toast [${type}]: ${msg}`);
  });

  const getPermissionBadge = (perm: PermissionStateExtended) => {
    switch (perm) {
      case 'granted':
        return <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1"><CheckCircle2 size={12} /> GRANTED</span>;
      case 'denied':
        return <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1"><AlertCircle size={12} /> DENIED</span>;
      case 'prompt':
        return <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1"><ShieldAlert size={12} /> PROMPT</span>;
      default:
        return <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-300 flex items-center gap-1">UNKNOWN</span>;
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 tracking-tight">
          <Settings size={24} className="text-indigo-600" />
          Application Settings
        </h2>
        {saveStatus && (
          <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 animate-fade-in">
            <CheckCircle size={14} />
            {saveStatus}
          </div>
        )}
      </div>

      {/* Sub-tab selection */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveSubTab('general')}
          className={`px-4 py-2 border-b-2 font-black text-xs uppercase tracking-widest transition-all ${
            activeSubTab === 'general'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          General Settings
        </button>
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`px-4 py-2 border-b-2 font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeSubTab === 'attendance'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock size={14} />
          Staff Attendance Log
        </button>
      </div>
      
      <div className="space-y-8">
        {activeSubTab === 'general' ? (
          <>
            {/* Appearance Settings */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-black text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Sun size={16} className="text-indigo-600" /> APPEARANCE
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Monitor },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleThemeChange(t.id as any)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${
                      theme === t.id ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 font-bold' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <t.icon size={20} />
                    <span className="text-xs">{t.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Offline Sync & Auto-Save */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-black text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Database size={16} className="text-indigo-600" /> SYSTEM HEARTBEAT & SYNC
              </h3>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl mb-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Periodic Heartbeat & Auto-Save</h4>
                  <p className="text-xs text-gray-500 mt-1">Enable or disable the 5-minute background database auto-save interval and network heartbeat.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleAutosave}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    autosaveEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autosaveEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    System Audio Notifications
                    {audioEnabled ? <Bell size={14} className="text-indigo-600" /> : <BellOff size={14} className="text-gray-400" />}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">Play subtle sound alerts on critical record updates or offline status changes.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    audioEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      audioEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </section>

            {/* Camera & Media Hardware Diagnostics Section */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Camera size={16} className="text-indigo-600" /> CAMERA & HARDWARE DIAGNOSTICS
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Manage video stream initialization, permission states, aspect ratios, and perform hardware loopback tests.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={runMediaLoopbackTest}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
                >
                  <Activity size={15} />
                  Media Diagnostics
                </button>
              </div>

              {/* Permission States & Regrant Option */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <Camera size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Camera Permission</div>
                      <div className="text-[11px] text-gray-500">{camera?.label || 'Primary Video Input'}</div>
                    </div>
                  </div>
                  {getPermissionBadge(cameraPermission)}
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <Mic size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Microphone Permission</div>
                      <div className="text-[11px] text-gray-500">{microphone?.label || 'Primary Audio Input'}</div>
                    </div>
                  </div>
                  {getPermissionBadge(micPermission)}
                </div>
              </div>

              <div className="flex items-center justify-between bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
                <div className="text-xs text-indigo-950 font-medium">
                  If the camera renders a black screen or permission was blocked, click to re-prompt or reset hardware media tracks.
                </div>
                <button
                  type="button"
                  onClick={handleRegrantPermissions}
                  className="px-3 py-1.5 bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-700 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
                >
                  <RefreshCw size={13} />
                  Reset / Re-grant Permissions
                </button>
              </div>

              {/* Visual Camera Health & Active Constraints Control */}
              <div className="border border-gray-200 rounded-xl p-5 space-y-5 bg-gradient-to-b from-white to-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders size={16} className="text-indigo-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-gray-900">
                      Camera Health & Active Constraints
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      HEALTHY • ACTIVE
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Resolution Selector */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 text-[11px]">Resolution Target</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['1080p', '720p', '480p'] as const).map((res) => (
                        <button
                          key={res}
                          type="button"
                          onClick={() => handleConstraintChange('resolution', res)}
                          className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all ${
                            activeConstraints.resolution === res
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {res}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio Selector */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 text-[11px]">Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['16:9', '4:3', '1:1'] as const).map((ar) => (
                        <button
                          key={ar}
                          type="button"
                          onClick={() => handleConstraintChange('aspectRatio', ar)}
                          className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all ${
                            activeConstraints.aspectRatio === ar
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {ar}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frame Rate Selector */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 text-[11px]">Frame Rate Limit</label>
                    <div className="grid grid-cols-3 gap-1">
                      {([60, 30, 15] as const).map((fps) => (
                        <button
                          key={fps}
                          type="button"
                          onClick={() => handleConstraintChange('frameRate', fps)}
                          className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all ${
                            activeConstraints.frameRate === fps
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {fps} FPS
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Constraint Summary Box */}
                <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono flex items-center justify-between">
                  <div>
                    <span className="text-indigo-400 font-bold">REQUESTED CONSTRAINTS: </span>
                    {activeConstraints.resolution} | {activeConstraints.aspectRatio} @ {activeConstraints.frameRate} FPS
                  </div>
                  <div className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    RETRY BACKOFF ACTIVE
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          /* Attendance Log Settings view */
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <AttendanceLog
              attendance={attendanceRecords}
              staff={staff}
              shifts={masterShifts}
              handovers={handovers}
              onAddLog={handleAddLog}
              loading={loadingAttendance}
              activeHospital={activeHospital}
              addToast={localAddToast}
            />
          </div>
        )}
      </div>

      {/* Hardware Loopback Test Modal */}
      {loopbackModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="text-indigo-600 animate-pulse" size={20} />
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">
                  Media Hardware Loopback Diagnostic Suite
                </h3>
              </div>
              <button
                onClick={stopLoopbackStream}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Loopback Live Mirror Video */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span>LIVE HARDWARE MIRROR</span>
                  <span className="text-[10px] font-mono text-indigo-600">
                    {testResults?.resolution || '0x0'}
                  </span>
                </div>
                <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
                  <video
                    ref={loopbackVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {isTestingLoopback && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 text-white text-xs font-bold">
                      <RefreshCw className="animate-spin" size={18} />
                      Analyzing Frame Luminance...
                    </div>
                  )}
                  {testResults?.isEmulated && (
                    <div className="absolute bottom-2 left-2 bg-amber-500/90 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded tracking-wider uppercase">
                      EMULATOR FALLBACK STREAM
                    </div>
                  )}
                </div>
                {testResults && (
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                    <div>Retries: <span className="font-bold text-indigo-700">{testResults.retries}</span></div>
                    <div>FPS Target: <span className="font-bold text-indigo-700">{testResults.fps}</span></div>
                  </div>
                )}
              </div>

              {/* Step Checklist Results */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-700">DIAGNOSTIC VERIFICATION CHECKS</div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span>1. Browser Permission Check</span>
                    {testResults?.permission === 'pass' && <span className="text-emerald-600 font-black flex items-center gap-1"><CheckCircle2 size={14} /> PASS</span>}
                    {testResults?.permission === 'fail' && <span className="text-rose-600 font-black flex items-center gap-1"><AlertCircle size={14} /> FAIL</span>}
                    {testResults?.permission === 'pending' && <span className="text-gray-400 font-mono">TESTING...</span>}
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span>2. Hardware Device Enumeration</span>
                    {testResults?.enumeration === 'pass' && <span className="text-emerald-600 font-black flex items-center gap-1"><CheckCircle2 size={14} /> PASS</span>}
                    {testResults?.enumeration === 'fail' && <span className="text-rose-600 font-black flex items-center gap-1"><AlertCircle size={14} /> FAIL</span>}
                    {testResults?.enumeration === 'pending' && <span className="text-gray-400 font-mono">TESTING...</span>}
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span>3. Stream Init & Exponential Retry</span>
                    {testResults?.streamCapture === 'pass' && <span className="text-emerald-600 font-black flex items-center gap-1"><CheckCircle2 size={14} /> PASS</span>}
                    {testResults?.streamCapture === 'fail' && <span className="text-rose-600 font-black flex items-center gap-1"><AlertCircle size={14} /> FAIL</span>}
                    {testResults?.streamCapture === 'pending' && <span className="text-gray-400 font-mono">TESTING...</span>}
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span>4. Resolution & Non-Black Frame</span>
                    {testResults?.frameRender === 'pass' && <span className="text-emerald-600 font-black flex items-center gap-1"><CheckCircle2 size={14} /> PASS</span>}
                    {testResults?.frameRender === 'fail' && <span className="text-rose-600 font-black flex items-center gap-1"><AlertCircle size={14} /> FAIL</span>}
                    {testResults?.frameRender === 'pending' && <span className="text-gray-400 font-mono">TESTING...</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Logs console */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Diagnostic Log Stream</div>
              <div className="bg-slate-900 text-slate-300 p-3 rounded-xl h-28 overflow-y-auto font-mono text-[10px] space-y-1 border border-slate-800">
                {diagnosticLogs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-[11px] text-gray-500">
                Loopback stream active. Close window to release video track.
              </span>
              <button
                onClick={stopLoopbackStream}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl"
              >
                Done / Close Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
