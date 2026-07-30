
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isFakeOrFalseRow } from '../utils/dataIntegrity';
import { runGlobalCleanup } from '../utils/cleanupService';
import { 
  Shield, Calendar, Clock, AlertTriangle, 
  MapPin, Users, ClipboardList, CheckCircle2,
  Activity, LayoutDashboard, FileText, Map, ShieldAlert
} from 'lucide-react';
import SecurityCommandHub from './security/SecurityCommandHub';
import DutyRoster from './security/DutyRoster';
import IncidentLog from './security/IncidentLog';
import PatrolReport from './security/PatrolReport';

interface Module12Props {
  activeHospital: any;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function Module12SecurityHub({ activeHospital, addToast }: Module12Props) {
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Roster' | 'Operations' | 'Patrol'>('Dashboard');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [rosters, setRosters] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [patrols, setPatrols] = useState<any[]>([]);
  const [handovers, setHandovers] = useState<any[]>([]);

  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';

  const handleGlobalCleanup = async () => {
    if (!window.confirm('WARNING: Security Data Guard. This will purge ALL fake/mock security, duty, and hospital records. Proceed?')) return;
    try {
      const deleted = await runGlobalCleanup(hospital_id);
      addToast('success', `Security Integrity: Purged ${deleted} falsified records.`);
      fetchSecurityData();
    } catch (err) {
      console.error(err);
      addToast('error', 'Security cleanup failed.');
    }
  };

  useEffect(() => {
    if (hospital_id) {
      fetchSecurityData();
    }
  }, [hospital_id]);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const qRosters = query(collection(db, 'security_duty_rosters'), where('hospital_id', '==', hospital_id), orderBy('effectiveDate', 'desc'));
      const qReports = query(collection(db, 'security_daily_reports'), where('hospital_id', '==', hospital_id), orderBy('timestamp', 'desc'));
      const qIncidents = query(collection(db, 'security_incidents'), where('hospital_id', '==', hospital_id), orderBy('timestamp', 'desc'));
      const qPatrols = query(collection(db, 'security_patrols'), where('hospital_id', '==', hospital_id), orderBy('timestamp', 'desc'));
      const qHandovers = query(collection(db, 'security_handovers'), where('hospital_id', '==', hospital_id));

      const [sRosters, sReports, sIncidents, sPatrols, sHandovers] = await Promise.all([
        getDocs(qRosters),
        getDocs(qReports),
        getDocs(qIncidents),
        getDocs(qPatrols),
        getDocs(qHandovers)
      ]);

      setRosters(sRosters.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !isFakeOrFalseRow(item)));
      setReports(sReports.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !isFakeOrFalseRow(item)));
      setIncidents(sIncidents.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !isFakeOrFalseRow(item)));
      setPatrols(sPatrols.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !isFakeOrFalseRow(item)));
      setHandovers(sHandovers.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => !isFakeOrFalseRow(item)));
    } catch (error) {
      console.error("Error fetching security data:", error);
      addToast('error', 'Failed to synchronize security registry');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (colName: string, data: any) => {
    if (isFakeOrFalseRow(data)) {
      addToast('error', '⚠️ Cannot record false, mock, dummy, or fake information to protect security records!');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, colName), {
        ...data,
        hospital_id,
        hospitalName: activeHospital?.name || '',
        departmentName: activeHospital?.department || '',
        hospitalId: Number(activeHospital?.hospital_unique_number || 0),
        createdAt: serverTimestamp()
      });

      // Special Logic for Daily Reports -> Create Handover
      if (colName === 'security_daily_reports' && data.handoverNotes) {
        await addDoc(collection(db, 'security_handovers'), {
          hospital_id,
          reportId: docRef.id,
          guardName: data.guardName || 'Officer',
          handoverNotes: data.handoverNotes,
          timestamp: new Date().toISOString(),
          status: 'Pending'
        });
      }

      addToast('success', 'Entry synchronized with Security Command');
      fetchSecurityData();
    } catch (error) {
      console.error("Error saving security entry:", error);
      addToast('error', 'Critical failure during synchronization');
    }
  };

  const handleAcknowledgeHandover = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'security_handovers', id));
      addToast('success', 'Handover acknowledged. Shift status: ACTIVE');
      fetchSecurityData();
    } catch (error) {
      addToast('error', 'Failed to acknowledge handover');
    }
  };

  const handleDelete = async (colName: string, id: string) => {
    try {
      await deleteDoc(doc(db, colName, id));
      addToast('info', 'Record removed from registry');
      fetchSecurityData();
    } catch (error) {
      addToast('error', 'Failed to delete record');
    }
  };

  // Derive dashboard stats
  const activeShifts = rosters.filter(r => r.effectiveDate === new Date().toISOString().split('T')[0]);
  const pendingIncidents = incidents.filter(i => i.resolutionStatus === 'Open');
  const criticalAlerts = incidents.filter(i => i.severity === 'Critical' || i.severity === 'High').map(i => ({
    title: i.type,
    time: new Date(i.timestamp).toLocaleTimeString(),
    location: 'Hospital Grounds'
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 rounded-xl shadow-lg shadow-slate-200">
              <Shield className="text-white" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Security Command Hub</h3>
              <p className="text-slate-500 text-sm font-medium mt-0.5">Operational visibility & facility protection</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleGlobalCleanup}
              className="flex items-center gap-2 px-3 py-2 border border-rose-100 rounded-xl bg-rose-50/50 hover:bg-rose-100 transition-all text-[10px] font-black text-rose-600 uppercase tracking-tighter"
              title="Security Data Integrity Purge"
            >
              <ShieldAlert size={14} />
              Guard
            </button>
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200 overflow-x-auto no-scrollbar">
              {[
              { id: 'Dashboard', label: 'Command Hub', icon: LayoutDashboard },
              { id: 'Roster', label: 'Duty Management', icon: Calendar },
              { id: 'Operations', label: 'Daily Ops & Incident', icon: FileText },
              { id: 'Patrol', label: 'Patrol Reports', icon: Map }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'Dashboard' && (
            <SecurityCommandHub 
              activeShifts={activeShifts}
              pendingIncidents={pendingIncidents}
              patrolStatus={Math.min(100, Math.round((patrols.length / 10) * 100))}
              criticalAlerts={criticalAlerts}
              handovers={handovers}
              onAcknowledgeHandover={handleAcknowledgeHandover}
            />
          )}
          
          {activeTab === 'Roster' && (
            <DutyRoster 
              rosters={rosters}
              onAddRoster={(data) => handleSave('security_duty_rosters', data)}
              onDeleteRoster={(id) => handleDelete('security_duty_rosters', id)}
              loading={loading}
            />
          )}

          {activeTab === 'Operations' && (
            <IncidentLog 
              incidents={incidents}
              reports={reports}
              onAddIncident={(data) => handleSave('security_incidents', data)}
              onAddReport={(data) => handleSave('security_daily_reports', data)}
              loading={loading}
            />
          )}

          {activeTab === 'Patrol' && (
            <PatrolReport 
              patrols={patrols}
              onAddPatrol={(data) => handleSave('security_patrols', data)}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}


