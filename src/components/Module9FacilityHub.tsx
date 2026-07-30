
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isFakeOrFalseRow } from '../utils/dataIntegrity';
import { runGlobalCleanup } from '../utils/cleanupService';
import { 
  Settings, AlertOctagon, CheckCircle2, 
  Search, Plus, Hammer, Zap, HeartPulse, 
  Activity, ClipboardList, PenTool, Wrench, ShieldAlert
} from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  category: string;
  status: 'Functional' | 'Non-Functional' | 'Under Maintenance' | 'Decommissioned';
  serialNumber: string;
  location: string;
  lastMaintenance: string;
  nextMaintenance: string;
}

interface Module9Props {
  activeHospital: any;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  type: 'Facility' | 'Biomedical';
}

export default function Module9FacilityHub({ activeHospital, addToast, type }: Module9Props) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [newAsset, setNewAsset] = useState({
    name: '',
    category: 'General Equipment',
    serialNumber: '',
    location: 'Main Ward',
    status: 'Functional' as const,
    nextMaintenance: '2026-12-31',
    hospitalName: activeHospital?.name || '',
    departmentName: activeHospital?.department || '',
    hospitalId: Number(activeHospital?.hospital_unique_number || 0)
  });

  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';

  useEffect(() => {
    setNewAsset(prev => ({
      ...prev,
      hospitalName: activeHospital?.name || '',
      departmentName: activeHospital?.department || '',
      hospitalId: Number(activeHospital?.hospital_unique_number || 0)
    }));
  }, [activeHospital]);

  useEffect(() => {
    fetchAssets();
  }, [hospital_id, type, filterStatus]);

  const handleGlobalCleanup = async () => {
    if (!window.confirm('WARNING: Facility Data Guard. This will purge ALL fake/mock assets, biomedical equipment, and hospital records. Proceed?')) return;
    try {
      const deleted = await runGlobalCleanup(hospital_id);
      addToast('success', `Facility Integrity: Purged ${deleted} falsified records.`);
      fetchAssets();
    } catch (err) {
      console.error(err);
      addToast('error', 'Facility cleanup failed.');
    }
  };

  const fetchAssets = async () => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'hospital_assets'),
        where('hospital_id', '==', hospital_id),
        where('assetType', '==', type)
      );

      const snap = await getDocs(q);
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Asset[];
      list = list.filter(a => !isFakeOrFalseRow(a));
      
      if (filterStatus !== 'All') {
        list = list.filter(a => a.status === filterStatus);
      }
      setAssets(list);
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.name.trim() || !newAsset.serialNumber.trim()) {
      addToast('error', 'Please fill in all required asset fields.');
      return;
    }
    if (isFakeOrFalseRow(newAsset)) {
      addToast('error', '⚠️ Cannot record false, mock, dummy, or fake assets to protect facility equipment records!');
      return;
    }
    try {
      await addDoc(collection(db, 'hospital_assets'), {
        hospital_id,
        hospitalName: newAsset.hospitalName,
        departmentName: newAsset.departmentName,
        hospitalId: newAsset.hospitalId,
        assetType: type,
        ...newAsset,
        lastMaintenance: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });
      addToast('success', 'Asset registered successfully');
      setNewAsset({
        name: '',
        category: 'General Equipment',
        serialNumber: '',
        location: 'Main Ward',
        status: 'Functional',
        nextMaintenance: '2026-12-31'
      });
      setShowAddModal(false);
      fetchAssets();
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to register asset');
    }
  };

  const updateAssetStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'hospital_assets', id), { 
        status,
        updatedAt: serverTimestamp()
      });
      addToast('success', `Asset updated to ${status}`);
      fetchAssets();
    } catch (err) {
      addToast('error', 'Update failed');
    }
  };

  const totalAssetsCount = assets.length;
  const functionalCount = assets.filter(a => a.status === 'Functional').length;
  const functionalRate = totalAssetsCount > 0 ? Math.round((functionalCount / totalAssetsCount) * 100) : 0;
  const criticalFailures = assets.filter(a => a.status === 'Non-Functional').length;
  const maintainedCount = assets.filter(a => a.status === 'Functional' || a.status === 'Under Maintenance').length;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl shadow-lg ${type === 'Facility' ? 'bg-slate-700 shadow-slate-200' : 'bg-rose-600 shadow-rose-200'}`}>
              {type === 'Facility' ? <Settings className="text-white" size={28} /> : <HeartPulse className="text-white" size={28} />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{type} Asset Management</h3>
              <p className="text-slate-500 text-sm font-medium mt-0.5">Inventory, maintenance & technical status tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGlobalCleanup}
              className="flex items-center gap-2 px-3 py-2 border border-rose-100 rounded-xl bg-rose-50/50 hover:bg-rose-100 transition-all text-[10px] font-black text-rose-600 uppercase tracking-tighter"
              title="Facility Data Integrity Purge"
            >
              <ShieldAlert size={14} />
              Guard
            </button>
            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
              {['All', 'Functional', 'Non-Functional'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    filterStatus === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg shadow-md transition-all font-bold text-xs hover:bg-slate-800"
            >
              <Plus size={16} />
              Register Asset
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Summary Column */}
          <div className="space-y-4">
             {[
               { label: 'Functional Rate', val: `${functionalRate}%`, icon: CheckCircle2, color: 'emerald' },
               { label: 'Critical Failures', val: criticalFailures, icon: AlertOctagon, color: 'rose' },
               { label: 'Maintained (Active)', val: maintainedCount, icon: Hammer, color: 'blue' }
             ].map((stat, i) => (
               <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                   <span className="text-2xl font-black text-slate-900">{stat.val}</span>
                 </div>
                 <div className={`p-3 bg-${stat.color}-50 rounded-xl text-${stat.color}-600`}>
                    <stat.icon size={20} />
                 </div>
               </div>
             ))}

             <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Technical Log</h4>
                <div className="space-y-4">
                   {assets.slice(0, 5).map((asset, i) => (
                     <div key={i} className="flex items-start gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${asset.status === 'Functional' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div>
                           <p className="text-[11px] font-bold text-slate-200">{asset.name}: {asset.status}</p>
                           <span className="text-[9px] text-slate-500">Last updated recently</span>
                        </div>
                     </div>
                   ))}
                   {assets.length === 0 && (
                     <p className="text-[10px] text-slate-500 italic">No technical logs available</p>
                   )}
                </div>
             </div>
          </div>

          {/* Asset Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
               {assets.length === 0 ? (
                 <div className="col-span-full p-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <Activity className="mx-auto text-slate-300 mb-4" size={48} />
                    <h5 className="text-slate-900 font-bold">No Assets Registered</h5>
                    <p className="text-slate-500 text-sm mt-1">Start by cataloging your {type.toLowerCase()} inventory.</p>
                 </div>
               ) : (
                 assets.map((asset) => (
                   <div key={asset.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                      <div className="p-5">
                         <div className="flex items-center justify-between mb-4">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              asset.status === 'Functional' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              asset.status === 'Non-Functional' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                               {asset.status}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold font-mono">{asset.serialNumber}</span>
                         </div>
                         <h5 className="font-bold text-slate-900 mb-1 line-clamp-1">{asset.name}</h5>
                         <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <ClipboardList size={12} />
                            {asset.category} • {asset.location}
                         </p>
                      </div>
                      <div className="bg-slate-50/50 px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                         <div className="text-right">
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Next Service</p>
                            <p className="text-[11px] font-black text-slate-700">{asset.nextMaintenance}</p>
                         </div>
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => updateAssetStatus(asset.id, 'Under Maintenance')}
                              className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:text-amber-600 hover:border-amber-200 transition-all"
                              title="Set Maintenance"
                            >
                               <PenTool size={14} />
                            </button>
                            <button 
                              onClick={() => updateAssetStatus(asset.id, 'Functional')}
                              className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:text-emerald-600 hover:border-emerald-200 transition-all"
                              title="Set Functional"
                            >
                               <CheckCircle2 size={14} />
                            </button>
                         </div>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Register Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-slate-900">Register New {type} Asset</h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleRegisterAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Hospital Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City General Hospital"
                  value={newAsset.hospitalName}
                  onChange={(e) => setNewAsset({ ...newAsset, hospitalName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Intensive Care Unit"
                  value={newAsset.departmentName}
                  onChange={(e) => setNewAsset({ ...newAsset, departmentName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Hospital ID</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1001"
                  value={newAsset.hospitalId}
                  onChange={(e) => setNewAsset({ ...newAsset, hospitalId: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ICU Ventilator A-1"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Category</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Life Support, Imaging, Generator"
                  value={newAsset.category}
                  onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Serial Number / Asset Tag</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SN-99823-BM"
                  value={newAsset.serialNumber}
                  onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Location / Department</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Intensive Care Unit"
                  value={newAsset.location}
                  onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Initial Status</label>
                <select
                  value={newAsset.status}
                  onChange={(e) => setNewAsset({ ...newAsset, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                >
                  <option value="Functional">Functional</option>
                  <option value="Non-Functional">Non-Functional</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-sm"
                >
                  {loading ? 'Saving...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
