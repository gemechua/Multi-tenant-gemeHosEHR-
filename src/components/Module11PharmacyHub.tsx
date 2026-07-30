
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { isFakeOrFalseRow } from '../utils/dataIntegrity';
import { runGlobalCleanup } from '../utils/cleanupService';
import { 
  Pill, Activity, ShoppingCart, Search, 
  AlertCircle, CheckCircle2, History,
  TrendingUp, BarChart3, Database, Package, AlertTriangle, FileText, Camera, Mic,
  Printer, X, Eye, Trash2, ShieldCheck, ShieldAlert
} from 'lucide-react';
import PharmacyDashboard from './PharmacyDashboard';
import PharmacyOverview from './PharmacyOverview';
import ConsumptionChart from './ConsumptionChart';
import InventoryBatchImport from './InventoryBatchImport';
import PharmacyAuditLog from './PharmacyAuditLog';
import PatientQueue from './PatientQueue';
import DrugRecallWizard from './DrugRecallWizard';
import PharmacyShiftHandoff from './PharmacyShiftHandoff';
import PharmacyAlertCenter from './PharmacyAlertCenter';
import DispensaryQuickActionModal from './DispensaryQuickActionModal';
import VitalsModal from './VitalsModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Module11Props {
  activeHospital: any;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

import DispensaryStockAudit from './DispensaryStockAudit';

export default function Module11PharmacyHub({ activeHospital, addToast }: Module11Props) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Dashboard' | 'Inventory' | 'Dispensing' | 'StockOut' | 'Audit' | 'Queue' | 'Recall' | 'Handoff' | 'AuditStation'>('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Print Label Config States
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [includePrice, setIncludePrice] = useState(true);
  const [includeBin, setIncludeBin] = useState(true);
  const [includeManufacturer, setIncludeManufacturer] = useState(true);
  const [labelSize, setLabelSize] = useState<'standard' | 'compact'>('standard');

  // Dispensary Dynamic Form States
  const [selectedFormType, setSelectedFormType] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  // Quick Action Modal States
  const [selectedQuickActionRx, setSelectedQuickActionRx] = useState<any | null>(null);
  const [isQuickActionModalOpen, setIsQuickActionModalOpen] = useState(false);

  // Vitals Modal States
  const [vitalsPatientId, setVitalsPatientId] = useState<string | null>(null);
  const [vitalsPatientName, setVitalsPatientName] = useState<string | null>(null);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);

  // Initial form states
  const initialPrescribingState = {
    patientId: '',
    prescriberId: '',
    medicationName: '',
    dosage: '',
    routeOfAdmin: 'Oral',
    totalQuantity: '',
    duration: '',
    allergiesCheck: 'No',
  };

  const initialMonitoringState = {
    storageArea: 'Main Fridge',
    temperature: '',
    humidity: '',
    integrityCheck: 'Pass',
    correctiveAction: '',
  };

  const initialInventoryState = {
    drugName: '',
    supplier: '',
    batchNumber: '',
    expiryDate: '',
    quantityReceived: '',
    unitCost: '',
    storageLocation: '',
  };

  const initialDrugStockOutState = {
    drugName: '',
    currentStock: '',
    minThreshold: '',
    status: 'Low',
    reasonForOut: 'Supply chain',
    actionTaken: 'Reordered',
  };

  const initialPurchasedStockOutState = {
    itemName: '',
    purchaseOrder: '',
    vendorName: '',
    expectedArrival: '',
    delayReason: 'Backorder',
    impactAssessment: 'Med',
    vendorComms: '',
  };

  const initialAuditoryStockOutState = {
    itemScanned: '',
    systemBalance: '',
    actualCount: '',
    auditNotes: '',
    resolutionStatus: 'Pending',
  };

  const initialBinCardState = {
    itemName: '',
    batchNumber: '',
    balanceBf: '',
    quantityReceived: '',
    quantityIssued: '',
    balanceInStock: '',
    remarks: '',
  };

  const initialInventoryAddItemsState = {
    itemName: '',
    category: '',
    dosageForm: '',
    strength: '',
    unitOfIssue: '',
    reorderLevel: '',
    maxLevel: '',
  };

  const [prescribingForm, setPrescribingForm] = useState(initialPrescribingState);
  const [monitoringForm, setMonitoringForm] = useState(initialMonitoringState);
  const [inventoryForm, setInventoryForm] = useState(initialInventoryState);
  const [drugStockOutForm, setDrugStockOutForm] = useState(initialDrugStockOutState);
  const [purchasedStockOutForm, setPurchasedStockOutForm] = useState(initialPurchasedStockOutState);
  const [auditoryStockOutForm, setAuditoryStockOutForm] = useState(initialAuditoryStockOutState);
  const [binCardForm, setBinCardForm] = useState(initialBinCardState);
  const [inventoryAddItemsForm, setInventoryAddItemsForm] = useState(initialInventoryAddItemsState);

  // Dynamic state arrays for fetched logs
  const [prescribingLogs, setPrescribingLogs] = useState<any[]>([]);
  const [monitoringLogs, setMonitoringLogs] = useState<any[]>([]);
  const [inventoryStockLogs, setInventoryStockLogs] = useState<any[]>([]);
  const [drugStockOutLogs, setDrugStockOutLogs] = useState<any[]>([]);
  const [purchasedStockOutLogs, setPurchasedStockOutLogs] = useState<any[]>([]);
  const [auditoryStockOutLogs, setAuditoryStockOutLogs] = useState<any[]>([]);
  const [binCardLogs, setBinCardLogs] = useState<any[]>([]);
  const [inventoryAddItemsLogs, setInventoryAddItemsLogs] = useState<any[]>([]);


  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';


  const fetchLogs = async () => {
    try {
      const collections = [
        { path: 'dispensary_prescribing', setter: setPrescribingLogs },
        { path: 'dispensary_monitoring', setter: setMonitoringLogs },
        { path: 'inventory_stock_entries', setter: setInventoryStockLogs },
        { path: 'drug_stock_out', setter: setDrugStockOutLogs },
        { path: 'purchased_drug_stock_out', setter: setPurchasedStockOutLogs },
        { path: 'auditory_drug_stock_out', setter: setAuditoryStockOutLogs },
        { path: 'bin_card', setter: setBinCardLogs },
        { path: 'inventory_add_items', setter: setInventoryAddItemsLogs },
      ];

      for (const col of collections) {
        const q = query(collection(db, col.path), where('hospital_id', '==', hospital_id));
        const snapshot = await getDocs(q);
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(r => !isFakeOrFalseRow(r));
        
        // client side sorting by createdAt desc
        data.sort((a: any, b: any) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        col.setter(data);
      }
    } catch (e) {
      console.error("Error fetching logs: ", e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [hospital_id]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let colPath = '';
      let payload: any = {};
      const staffEmail = auth.currentUser?.email || 'admin@example.com';

      if (selectedFormType === 'Prescribing') {
        colPath = 'dispensary_prescribing';
        if (!prescribingForm.patientId || !prescribingForm.prescriberId || !prescribingForm.medicationName) {
          addToast('error', 'Please fill out all required fields.');
          return;
        }
        payload = {
          ...prescribingForm,
          dispensedBy: staffEmail,
        };
      } else if (selectedFormType === 'Monitoring') {
        colPath = 'dispensary_monitoring';
        const tempVal = parseFloat(monitoringForm.temperature);
        const humVal = parseFloat(monitoringForm.humidity);
        if (isNaN(tempVal) || isNaN(humVal)) {
          addToast('error', 'Temperature and Humidity must be valid numbers.');
          return;
        }
        const needsCorrective = (tempVal < 2 || tempVal > 8) || (humVal < 30 || humVal > 60) || monitoringForm.integrityCheck === 'Fail';
        if (needsCorrective && !monitoringForm.correctiveAction.trim()) {
          addToast('error', 'Corrective Action is required when parameters are out of range (Normal Temp: 2-8°C, Humidity: 30-60%) or Integrity Check fails.');
          return;
        }
        payload = {
          ...monitoringForm,
          temperature: tempVal,
          humidity: humVal,
          staffInitials: staffEmail.substring(0, 3).toUpperCase(),
          monitorDateTime: new Date().toISOString(),
        };
      } else if (selectedFormType === 'Inventory') {
        colPath = 'inventory_stock_entries';
        if (!inventoryForm.drugName || !inventoryForm.batchNumber || !inventoryForm.quantityReceived) {
          addToast('error', 'Medication Name, Batch Number, and Quantity are required.');
          return;
        }
        if (!inventoryForm.batchNumber.trim()) {
          addToast('error', 'Batch/Lot Number is required for drug recall tracking.');
          return;
        }
        payload = {
          ...inventoryForm,
          quantityReceived: parseInt(inventoryForm.quantityReceived) || 0,
          unitCost: parseFloat(inventoryForm.unitCost) || 0,
          receivedBy: staffEmail,
          dateReceived: new Date().toISOString().split('T')[0],
        };
      } else if (selectedFormType === 'Drug Stock-out Monitor') {
        colPath = 'drug_stock_out';
        if (!drugStockOutForm.drugName || !drugStockOutForm.minThreshold) {
          addToast('error', 'Medication Name and Minimum Threshold are required.');
          return;
        }
        const currentStock = parseInt(drugStockOutForm.currentStock) || 0;
        const minThreshold = parseInt(drugStockOutForm.minThreshold) || 0;
        
        // Threshold alert trigger
        if (currentStock <= minThreshold) {
          addToast('error', `ALERT Triggered: ${drugStockOutForm.drugName} is at or below the minimum safety threshold!`);
        }

        payload = {
          ...drugStockOutForm,
          currentStock,
          minThreshold,
          monitoringDate: new Date().toISOString().split('T')[0],
        };
      } else if (selectedFormType === 'Purchased Drug Stock-out Monitor') {
        colPath = 'purchased_drug_stock_out';
        if (!purchasedStockOutForm.itemName || !purchasedStockOutForm.vendorName) {
          addToast('error', 'Item Name and Vendor Name are required.');
          return;
        }
        payload = {
          ...purchasedStockOutForm,
        };
      } else if (selectedFormType === 'Auditory Drug Stock-out Monitor') {
        colPath = 'auditory_drug_stock_out';
        if (!auditoryStockOutForm.itemScanned) {
          addToast('error', 'Item Scanned is required.');
          return;
        }
        const sysBal = parseInt(auditoryStockOutForm.systemBalance) || 0;
        const actCnt = parseInt(auditoryStockOutForm.actualCount) || 0;
        const discrepancy = sysBal - actCnt;
        
        payload = {
          ...auditoryStockOutForm,
          systemBalance: sysBal,
          actualCount: actCnt,
          discrepancy,
          auditorName: staffEmail,
          auditDate: new Date().toISOString().split('T')[0],
        };
      } else if (selectedFormType === 'Bin Card') {
        colPath = 'bin_card';
        if (!binCardForm.itemName) {
          addToast('error', 'Item Name is required.');
          return;
        }
        payload = {
          ...binCardForm,
        };
      } else if (selectedFormType === 'Inventory Add Items') {
        colPath = 'inventory_add_items';
        if (!inventoryAddItemsForm.itemName) {
          addToast('error', 'Item Name is required.');
          return;
        }
        payload = {
          ...inventoryAddItemsForm,
        };
      }

      payload.createdAt = serverTimestamp();
      payload.hospital_id = hospital_id;
      payload.hospitalName = activeHospital?.name || '';
      payload.departmentName = activeHospital?.department || '';
      payload.hospitalId = Number(activeHospital?.hospital_unique_number || 0);

      if (isFakeOrFalseRow(payload)) {
        addToast('error', '⚠️ Cannot record false, mock, dummy, or fake information to protect pharmacy records!');
        return;
      }

      await addDoc(collection(db, colPath), payload);
      addToast('success', `${selectedFormType} record logged and saved to the secure database.`);
      
      // Reset forms
      if (selectedFormType === 'Prescribing') setPrescribingForm(initialPrescribingState);
      else if (selectedFormType === 'Monitoring') setMonitoringForm(initialMonitoringState);
      else if (selectedFormType === 'Inventory') setInventoryForm(initialInventoryState);
      else if (selectedFormType === 'Drug Stock-out Monitor') setDrugStockOutForm(initialDrugStockOutState);
      else if (selectedFormType === 'Purchased Drug Stock-out Monitor') setPurchasedStockOutForm(initialPurchasedStockOutState);
      else if (selectedFormType === 'Auditory Drug Stock-out Monitor') setAuditoryStockOutForm(initialAuditoryStockOutState);
      else if (selectedFormType === 'Bin Card') setBinCardForm(initialBinCardState);
      else if (selectedFormType === 'Inventory Add Items') setInventoryAddItemsForm(initialInventoryAddItemsState);

      setShowFormModal(false);
      setSelectedFormType(null);
      
      // Fetch fresh data
      fetchLogs();
    } catch (error) {
      console.error("Error submitting form: ", error);
      addToast('error', 'Failed to save record to Firestore database.');
    }
  };

  const inventory = inventoryStockLogs.map(log => ({
    name: log.drugName || log.itemName || 'Unknown Drug',
    manufacturer: log.supplier || log.manufacturer || 'N/A',
    cat: log.cat || log.category || 'General',
    stock: log.quantityReceived || log.stock || 0,
    price: log.unitCost ? `$${Number(log.unitCost).toFixed(2)}` : '$0.00',
    bin: log.storageLocation || log.bin || 'A-01',
    status: (log.quantityReceived || 0) < 10 ? 'Low' : 'Optimal'
  }));

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.bin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBatchImport = (data: any[]) => {
    data.forEach(item => {
      if (item.status === 'Critical') {
        addToast('error', `Alert: Medication ${item.name} is at critical stock level!`);
      }
    });
    addToast('success', `Imported ${data.length} items`);
    console.log(data);
  };

  const handleClearLogs = async (e: React.MouseEvent, collectionPath: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete all records for this log?')) return;
    try {
      const q = query(collection(db, collectionPath), where('hospital_id', '==', activeHospital?.hospital_unique_number || 'HOSP-01'));
      const snap = await getDocs(q);
      const batchPromises = snap.docs.map(d => deleteDoc(doc(db, collectionPath, d.id)));
      await Promise.all(batchPromises);
      addToast('success', 'All records cleared successfully.');
      fetchLogs();
    } catch (e) {
      console.error(e);
      addToast('error', 'Failed to clear records.');
    }
  };

  const exportInventoryPDF = () => {
    const doc = new jsPDF();
    doc.text("Inventory Audit Report", 14, 15);
    autoTable(doc, {
      head: [['Medicine Name', 'Category', 'Stock', 'Unit Price', 'Status']],
      body: inventory.map(item => [item.name, item.cat, item.stock, item.price, item.status]),
    });
    doc.save('inventory_report.pdf');
    addToast('success', 'PDF report generated');
  };

  const handleVoiceDictation = () => {
     addToast('info', 'Voice dictation started (Placeholder)');
  };

  const handleBarcodeScan = () => {
     addToast('info', 'Opening barcode scanner...');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-200">
              <Pill className="text-white" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Pharmacy Operations Center</h3>
              <p className="text-slate-500 text-sm font-medium mt-0.5">Inventory, dispensing & stock-out monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button 
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
              onClick={() => window.location.href = '/'} 
            >
              Return to EHR
            </button>
            {[
              { id: 'Overview', label: 'Pharmacy Overview', icon: Pill },
              { id: 'Dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'Inventory', label: 'Inventory', icon: Database },
              { id: 'Recall', label: 'Drug Recall Wizard', icon: AlertTriangle },
              { id: 'Dispensing', label: 'Dispensing', icon: Pill },
              { id: 'Queue', label: 'Patient Queue', icon: ShoppingCart },
              { id: 'Handoff', label: 'Shift Handoff', icon: FileText },
              { id: 'StockOut', label: 'Stock-out Monitor', icon: AlertCircle },
              { id: 'Audit', label: 'Pharmacy Audit', icon: History },
              { id: 'AuditStation', label: 'Dispensation Audit Station', icon: ShieldCheck }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === tab.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-6xl mx-auto">
          <PharmacyAlertCenter hospital_id={hospital_id} addToast={addToast} />
        </div>

        {activeTab === 'Overview' && (
          <div className="max-w-6xl mx-auto">
            <PharmacyOverview activeHospital={activeHospital} addToast={addToast} hospital_id={hospital_id} />
          </div>
        )}

        {activeTab === 'Recall' && (
          <div className="max-w-6xl mx-auto">
            <DrugRecallWizard 
              inventoryStockLogs={inventoryStockLogs} 
              addToast={addToast} 
              hospital_id={hospital_id} 
            />
          </div>
        )}
        {activeTab === 'Handoff' && (
          <div className="max-w-6xl mx-auto">
            <PharmacyShiftHandoff 
              patientQueue={prescribingLogs} 
              pendingStockAdjustments={auditoryStockOutLogs} 
              addToast={addToast} 
              hospital_id={hospital_id} 
            />
          </div>
        )}
        {activeTab === 'Audit' && (
          <div className="max-w-5xl mx-auto">
            <PharmacyAuditLog 
              prescribingLogs={prescribingLogs}
              monitoringLogs={monitoringLogs}
              inventoryStockLogs={inventoryStockLogs}
              drugStockOutLogs={drugStockOutLogs}
              purchasedStockOutLogs={purchasedStockOutLogs}
              auditoryStockOutLogs={auditoryStockOutLogs}
            />
          </div>
        )}
        {activeTab === 'Queue' && (
          <div className="max-w-4xl mx-auto">
            <PatientQueue 
              prescriptions={prescribingLogs} 
              onViewVitals={(id, name) => {
                setVitalsPatientId(id);
                setVitalsPatientName(name);
                setIsVitalsModalOpen(true);
              }}
              onQuickAction={(rx) => {
                setSelectedQuickActionRx(rx);
                setIsQuickActionModalOpen(true);
              }}
            />
          </div>
        )}
        {activeTab === 'AuditStation' && (
          <div className="max-w-6xl mx-auto">
            <DispensaryStockAudit hospital_id={hospital_id} addToast={addToast} />
          </div>
        )}
        {activeTab === 'Dashboard' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <PharmacyDashboard activeHospital={activeHospital} />
          </div>
        )}        {activeTab === 'Dispensing' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <h4 className="text-lg font-bold text-slate-900 mb-6">Pharmacy Intake & Activity Forms</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Prescribing', count: prescribingLogs.length, desc: 'Manage prescribing records', path: 'dispensary_prescribing' },
                    { label: 'Monitoring', count: monitoringLogs.length, desc: 'Manage monitoring records', path: 'dispensary_monitoring' },
                    { label: 'Inventory', count: inventoryStockLogs.length, desc: 'Manage inventory records', path: 'inventory_stock_entries' },
                    { label: 'Drug Stock-out Monitor', count: drugStockOutLogs.length, desc: 'Manage drug stock-out monitor records', path: 'drug_stock_out' },
                    { label: 'Purchased Drug Stock-out Monitor', count: purchasedStockOutLogs.length, desc: 'Manage purchased drug stock-out monitor records', path: 'purchased_drug_stock_out' },
                    { label: 'Auditory Drug Stock-out Monitor', count: auditoryStockOutLogs.length, desc: 'Manage auditory drug stock-out monitor records', path: 'auditory_drug_stock_out' },
                    { label: 'Bin Card', count: binCardLogs.length, desc: 'Manage bin card records', path: 'bin_card' },
                    { label: 'Inventory Add Items', count: inventoryAddItemsLogs.length, desc: 'Manage inventory add items records', path: 'inventory_add_items' }
                  ].map((form) => (
                    <button 
                      key={form.label}
                      onClick={() => {
                        setSelectedFormType(form.label);
                        setShowFormModal(true);
                      }}
                      className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 transition-all text-left group cursor-pointer relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-white flex flex-col items-center justify-center shadow-sm border border-slate-100 group-hover:border-emerald-200 relative">
                              <span className="text-lg font-black text-emerald-600 leading-none">{form.count}</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">Logs</span>
                           </div>
                           <div>
                              <p className="font-bold text-slate-900 group-hover:text-emerald-900">Add {form.label}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{form.desc}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {form.count > 0 && (
                            <div
                              title="Delete all records"
                              onClick={(e) => handleClearLogs(e, form.path)}
                              className="text-slate-400 p-2 hover:bg-rose-50 hover:text-rose-600 rounded-full cursor-pointer transition-colors"
                            >
                              <Trash2 size={16} />
                            </div>
                          )}
                          {form.label === 'Prescribing' && (
                            <div 
                              title="Voice dictate"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVoiceDictation();
                              }} 
                              className="text-emerald-600 p-2 hover:bg-emerald-100 rounded-full cursor-pointer transition-colors"
                            >
                              <Mic size={18}/>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
            </div>
          </div>
        )}
        {activeTab === 'Inventory' && (
          <div className="max-w-6xl mx-auto space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Items', val: '0', trend: 'Baseline', color: 'slate' },
                  { label: 'Low Stock', val: '0', trend: 'Optimal', color: 'emerald' },
                  { label: 'Out of Stock', val: '0', trend: 'None', color: 'slate' },
                  { label: 'Expiring Soon', val: '0', trend: 'None', color: 'slate' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-black text-slate-900">{stat.val}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-${stat.color}-50 text-${stat.color}-600`}>{stat.trend}</span>
                    </div>
                  </div>
                ))}
             </div>

             <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                   <h4 className="font-bold text-slate-900">Critical Medication Inventory</h4>
                   <div className="flex gap-2">
                       <InventoryBatchImport onImport={handleBatchImport} />
                        <button 
                           onClick={() => {
                              if (selectedItems.length === 0) {
                                 addToast('error', 'Please select at least one item from the table below to print labels.');
                              } else {
                                 setIsPrintModalOpen(true);
                              }
                           }}
                           className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedItems.length > 0 
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm' 
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                           }`}
                        >
                           <Printer size={16} /> Print Labels {selectedItems.length > 0 && `(${selectedItems.length})`}
                        </button>
                       <button onClick={exportInventoryPDF} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200">
                          <FileText size={16} /> Export PDF
                       </button>
                       <button onClick={handleBarcodeScan} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                          <Camera size={16} /> Scan
                       </button>
                       <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input 
                            type="text" 
                            placeholder="Search by name, manufacturer, or bin..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 w-64"
                          />
                       </div>
                   </div>
                </div>
                
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b border-slate-100">
                            <th className="pb-3 w-10 text-center">
                               <input 
                                 type="checkbox" 
                                 checked={filteredInventory.length > 0 && selectedItems.length === filteredInventory.length}
                                 onChange={(e) => {
                                    if (e.target.checked) {
                                       setSelectedItems(filteredInventory.map(item => item.name));
                                    } else {
                                       setSelectedItems([]);
                                    }
                                 }}
                                 className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                               />
                            </th>
                            <th className="pb-3 text-[10px] font-black text-slate-400 uppercase">Medicine Name</th>
                            <th className="pb-3 text-[10px] font-black text-slate-400 uppercase">Category</th>
                            <th className="pb-3 text-[10px] font-black text-slate-400 uppercase text-right">Current Stock</th>
                            <th className="pb-3 text-[10px] font-black text-slate-400 uppercase text-right">Unit Price</th>
                            <th className="pb-3 text-[10px] font-black text-slate-400 uppercase text-right">Bin Location</th>
                             <th className="pb-3 text-[10px] font-black text-slate-400 uppercase text-center">Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredInventory.map((item, i) => (
                          <tr key={i} className={`group hover:bg-slate-50 transition-colors ${item.status !== 'Optimal' ? 'bg-amber-50/50' : ''}`}>
                             <td className="py-3 w-10 text-center">
                                <input 
                                  type="checkbox" 
                                  checked={selectedItems.includes(item.name)}
                                  onChange={(e) => {
                                     if (e.target.checked) {
                                        setSelectedItems(prev => [...prev, item.name]);
                                     } else {
                                        setSelectedItems(prev => prev.filter(name => name !== item.name));
                                     }
                                  }}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                                />
                             </td>
                             <td className="py-3 text-sm font-bold text-slate-900">
                                {item.name}
                                {item.status !== 'Optimal' && <AlertTriangle className="inline ml-2 text-amber-500" size={12} />}
                             </td>
                             <td className="py-3 text-[11px] font-medium text-slate-500">{item.cat}</td>
                             <td className="py-3 text-sm font-black text-slate-900 text-right">{item.stock}</td>
                             <td className="py-3 text-xs font-medium text-slate-500 text-right">{item.price}</td>
                             <td className="py-3 text-sm font-bold text-slate-700 text-right">{item.bin}</td>
                             <td className="py-3 text-center">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  item.status === 'Optimal' ? 'bg-emerald-50 text-emerald-600' :
                                  item.status === 'Low' ? 'bg-amber-50 text-amber-600' :
                                  'bg-rose-50 text-rose-600'
                                }`}>
                                   {item.status}
                                </span>
                             </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'StockOut' && (
          <div className="max-w-4xl mx-auto space-y-6">
             <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                   <div>
                      <h4 className="text-lg font-bold text-slate-900 text-rose-600">Stock-out Monitor</h4>
                      <p className="text-sm text-slate-500">Real-time alerts for essential medicines unavailable in pharmacy</p>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                      <span className="text-[10px] font-black text-rose-600 uppercase">Critical Alert</span>
                   </div>
                </div>

                <div className="space-y-4">
                   {/* Static standard alerts - Cleared for baseline */}
                   {[
                   ].map((alert, i) => (
                     <div key={`static-${i}`} className="p-5 bg-rose-50/30 rounded-2xl border border-rose-100 flex items-start justify-between group hover:bg-rose-50 transition-all">
                        <div className="flex items-start gap-4">
                           <div className="p-3 bg-white rounded-xl border border-rose-100 text-rose-500 shadow-sm">
                              <Package size={20} />
                           </div>
                           <div>
                              <h6 className="font-bold text-slate-900">{alert.item}</h6>
                              <p className="text-xs text-rose-700 font-medium">Critical Stock-out since {alert.since}</p>
                              <div className="mt-3 flex items-center gap-3">
                                 <span className="text-[10px] font-black text-slate-400 uppercase">Impact: {alert.impact}</span>
                                 <span className="text-[10px] font-black text-emerald-600 uppercase bg-white px-2 py-0.5 rounded border border-emerald-100">Subs: {alert.replacement}</span>
                              </div>
                           </div>
                        </div>
                        <button className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-700 transition-all cursor-pointer">
                           Order Now
                        </button>
                     </div>
                   ))}

                   {/* Dynamic Drug Stock-out Logs from database */}
                   {drugStockOutLogs.map((log) => (
                     <div key={log.id} className="p-5 bg-rose-50/10 rounded-2xl border border-rose-100 flex items-start justify-between group hover:bg-rose-50/40 transition-all">
                        <div className="flex items-start gap-4">
                           <div className="p-3 bg-white rounded-xl border border-rose-200 text-rose-500 shadow-sm">
                              <AlertTriangle size={20} />
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                <h6 className="font-bold text-slate-900">{log.drugName}</h6>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  log.status === 'Critical' ? 'bg-red-100 text-red-800' :
                                  log.status === 'Depleted' ? 'bg-amber-100 text-amber-800' :
                                  'bg-orange-100 text-orange-800'
                                }`}>
                                   {log.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Logged on {log.monitoringDate} — Current Stock: <strong className="text-rose-600">{log.currentStock}</strong> (Safety limit: {log.minThreshold})
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-3">
                                 <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">Reason: {log.reasonForOut}</span>
                                 <span className="text-[10px] font-black text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Action: {log.actionTaken}</span>
                              </div>
                           </div>
                        </div>
                        <button className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-700 transition-all cursor-pointer">
                           Order Now
                        </button>
                     </div>
                   ))}

                   {/* Dynamic Purchased Delay Logs from database */}
                   {purchasedStockOutLogs.map((log) => (
                     <div key={log.id} className="p-5 bg-amber-50/10 rounded-2xl border border-amber-200 flex items-start justify-between group hover:bg-amber-50/30 transition-all">
                        <div className="flex items-start gap-4">
                           <div className="p-3 bg-white rounded-xl border border-amber-200 text-amber-500 shadow-sm">
                              <ShoppingCart size={20} />
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                <h6 className="font-bold text-slate-900">{log.itemName}</h6>
                                <span className="text-[9px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                                   PO: {log.purchaseOrder}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Expected Arrival: <strong>{log.expectedArrival || 'TBD'}</strong> (Vendor: {log.vendorName})
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-3">
                                 <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">Delay Reason: {log.delayReason}</span>
                                 <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                   log.impactAssessment === 'High' ? 'bg-red-50 text-red-700 border border-red-100' :
                                   log.impactAssessment === 'Med' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                   'bg-slate-50 text-slate-700 border border-slate-100'
                                 }`}>
                                   Impact: {log.impactAssessment}
                                 </span>
                                 {log.vendorComms && (
                                   <span className="text-[10px] font-medium text-blue-700 italic">Comms: "{log.vendorComms}"</span>
                                 )}
                              </div>
                           </div>
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                           Procurement Delayed
                        </span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}
      </div>
      {/* Bulk Print Labels Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Printer className="text-emerald-600" size={20} />
                <h3 className="text-base font-bold text-slate-900">Bulk Print QR Medication Labels</h3>
              </div>
              <button 
                onClick={() => setIsPrintModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left Column: Configuration (1/3) */}
              <div className="w-full md:w-80 bg-slate-50 p-6 border-r border-slate-100 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Label Size Preset</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setLabelSize('standard')}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                          labelSize === 'standard' 
                          ? 'bg-white border-emerald-500 text-emerald-700 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Standard (2" x 1")
                      </button>
                      <button 
                        onClick={() => setLabelSize('compact')}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                          labelSize === 'compact' 
                          ? 'bg-white border-emerald-500 text-emerald-700 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Compact (1.5" x 1")
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Include Attributes</span>
                    <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={includeManufacturer} 
                          onChange={(e) => setIncludeManufacturer(e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Manufacturer</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={includeBin} 
                          onChange={(e) => setIncludeBin(e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Bin Location Code</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={includePrice} 
                          onChange={(e) => setIncludePrice(e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Unit Price</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
                    <h5 className="text-xs font-bold text-emerald-800 mb-1">Bulk Print Summary</h5>
                    <p className="text-[11px] text-emerald-700">Ready to render <strong className="font-black">{selectedItems.length} labels</strong> onto thermal paper. Ensure your label sheet layout corresponds to the configuration selected.</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200/60 mt-6 space-y-2">
                  <button 
                    onClick={() => {
                      setTimeout(() => {
                        window.print();
                      }, 100);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all"
                  >
                    <Printer size={14} /> Trigger System Dialog
                  </button>
                  <button 
                    onClick={() => setIsPrintModalOpen(false)}
                    className="w-full py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                  >
                    Close Preview
                  </button>
                </div>
              </div>

              {/* Right Column: Live Sheet Preview (2/3) */}
              <div className="flex-1 bg-slate-100 p-6 overflow-y-auto flex flex-col items-center">
                <div className="flex items-center justify-between w-full max-w-md mb-4">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Eye size={12} /> Interactive Preview Sheet
                  </span>
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-black px-2 py-0.5 rounded-full uppercase">
                    Paper Feed
                  </span>
                </div>

                <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-md min-h-[400px] flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4">
                    {inventory.filter(item => selectedItems.includes(item.name)).map((item, i) => (
                      <div 
                        key={i} 
                        className={`border-2 border-dashed border-slate-300 p-4 rounded-xl bg-white relative overflow-hidden transition-all duration-150 ${
                          labelSize === 'compact' ? 'max-w-[280px] mx-auto' : 'w-full'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded">
                              MED-QR
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-1 leading-tight">{item.name}</h4>
                            {includeManufacturer && (
                              <p className="text-[10px] text-slate-500 font-medium">Mfg: {item.manufacturer}</p>
                            )}
                            <p className="text-[9px] text-slate-400 font-semibold">{item.cat}</p>
                          </div>
                          
                          <div className="p-1 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(JSON.stringify({ name: item.name, bin: item.bin, price: item.price }))}`} 
                              alt="QR code" 
                              className="w-16 h-16 object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-dashed border-slate-100 flex items-center justify-between">
                          {includePrice ? (
                            <span className="text-xs font-black text-slate-900">{item.price}</span>
                          ) : <span />}
                          {includeBin ? (
                            <span className="text-[10px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded">
                              BIN: {item.bin}
                            </span>
                          ) : <span />}
                        </div>

                        {/* Scissors Cut Icon representation */}
                        <div className="absolute top-1/2 -right-3 -translate-y-1/2 p-1 bg-slate-100 rounded-full border border-slate-200 text-slate-400">
                          <span className="text-[8px] font-black block">✂</span>
                        </div>
                      </div>
                    ))}
                    {selectedItems.length === 0 && (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        No medications selected. Click "Close Preview" and select some items first!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden System Printing Container */}
      <div id="pharmacy-print-section" className="hidden print:block bg-white p-4">
        <div className="grid grid-cols-2 gap-4">
          {inventory.filter(item => selectedItems.includes(item.name)).map((item, i) => (
            <div 
              key={i} 
              className={`border-2 border-dashed border-slate-400 p-4 rounded bg-white flex flex-col justify-between break-inside-avoid ${
                labelSize === 'compact' ? 'w-[230px] h-[150px]' : 'w-[290px] h-[180px]'
              }`}
              style={{ pageBreakInside: 'avoid' }}
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h4 className="text-xs font-bold text-black leading-tight m-0">{item.name}</h4>
                  {includeManufacturer && (
                    <p className="text-[10px] text-slate-700 m-0 mt-1 font-semibold">Mfg: {item.manufacturer}</p>
                  )}
                  <p className="text-[9px] text-slate-500 m-0 uppercase font-bold">{item.cat}</p>
                </div>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(JSON.stringify({ name: item.name, bin: item.bin, price: item.price }))}`} 
                  alt="QR Code" 
                  className="w-16 h-16 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex justify-between items-end border-t border-slate-200 pt-2 mt-auto">
                {includePrice ? (
                  <span className="text-xs font-black text-black">{item.price}</span>
                ) : <span />}
                {includeBin ? (
                  <span className="text-[10px] font-mono bg-slate-100 border border-slate-300 text-black px-2 py-0.5 rounded font-black">
                    BIN: {item.bin}
                  </span>
                ) : <span />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Global Printing Stylesheet Injector */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #pharmacy-print-section, #pharmacy-print-section * {
            visibility: visible !important;
          }
          #pharmacy-print-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            display: block !important;
            z-index: 9999999 !important;
          }
        }
      `}} />

      {/* Dispensary Activity Form Modal */}
      {showFormModal && selectedFormType && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden transition-all flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-600 tracking-wider uppercase">Dispensary SOP Log</span>
                <h3 className="text-lg font-black text-slate-900">Add {selectedFormType}</h3>
              </div>
              <button 
                onClick={() => {
                  setShowFormModal(false);
                  setSelectedFormType(null);
                }}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedFormType === 'Prescribing' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Patient Identifier *</label>
                    <input 
                      type="text"
                      value={prescribingForm.patientId}
                      onChange={(e) => setPrescribingForm({...prescribingForm, patientId: e.target.value})}
                      placeholder="e.g. PT-29402"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Unique Patient ID (HIPAA/GDPR compliant)</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Prescriber ID *</label>
                    <input 
                      type="text"
                      value={prescribingForm.prescriberId}
                      onChange={(e) => setPrescribingForm({...prescribingForm, prescriberId: e.target.value})}
                      placeholder="Name or License Number of physician"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Medication Name & Strength *</label>
                    <input 
                      type="text"
                      value={prescribingForm.medicationName}
                      onChange={(e) => setPrescribingForm({...prescribingForm, medicationName: e.target.value})}
                      placeholder="e.g. Amoxicillin 500mg"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dosage/Frequency</label>
                      <input 
                        type="text"
                        value={prescribingForm.dosage}
                        onChange={(e) => setPrescribingForm({...prescribingForm, dosage: e.target.value})}
                        placeholder="e.g. twice daily"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Route of Admin</label>
                      <select 
                        value={prescribingForm.routeOfAdmin}
                        onChange={(e) => setPrescribingForm({...prescribingForm, routeOfAdmin: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Oral">Oral</option>
                        <option value="IV">IV</option>
                        <option value="Topical">Topical</option>
                        <option value="IM">IM</option>
                        <option value="Subcutaneous">Subcutaneous</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Quantity</label>
                      <input 
                        type="number"
                        value={prescribingForm.totalQuantity}
                        onChange={(e) => setPrescribingForm({...prescribingForm, totalQuantity: e.target.value})}
                        placeholder="e.g. 30"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Duration (Days)</label>
                      <input 
                        type="number"
                        value={prescribingForm.duration}
                        onChange={(e) => setPrescribingForm({...prescribingForm, duration: e.target.value})}
                        placeholder="e.g. 7"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Allergies Check</label>
                      <select 
                        value={prescribingForm.allergiesCheck}
                        onChange={(e) => setPrescribingForm({...prescribingForm, allergiesCheck: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Yes">Yes (Verified against chart)</option>
                        <option value="No">No / Not Verified</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Dispensed By</label>
                      <input 
                        type="text"
                        value="gemechuahmed0@gmail.com"
                        disabled
                        className="w-full px-3 py-2 border border-slate-100 bg-slate-50 text-slate-500 rounded-xl text-sm cursor-not-allowed font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedFormType === 'Monitoring' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Storage Area</label>
                      <select 
                        value={monitoringForm.storageArea}
                        onChange={(e) => setMonitoringForm({...monitoringForm, storageArea: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Main Fridge">Main Fridge (2-8°C)</option>
                        <option value="Room A">Room A (15-25°C)</option>
                        <option value="Narcotics Cabinet">Narcotics Cabinet</option>
                        <option value="Freezer">Freezer (&lt; -15°C)</option>
                        <option value="Dispensary Shelf">Dispensary Shelf</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Monitor Date/Time</label>
                      <input 
                        type="text"
                        value={new Date().toLocaleString()}
                        disabled
                        className="w-full px-3 py-2 border border-slate-100 bg-slate-50 text-slate-500 rounded-xl text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Temperature (°C) *</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={monitoringForm.temperature}
                        onChange={(e) => setMonitoringForm({...monitoringForm, temperature: e.target.value})}
                        placeholder="e.g. 4.2"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Humidity (%) *</label>
                      <input 
                        type="number"
                        step="1"
                        value={monitoringForm.humidity}
                        onChange={(e) => setMonitoringForm({...monitoringForm, humidity: e.target.value})}
                        placeholder="e.g. 45"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Integrity Check</label>
                      <select 
                        value={monitoringForm.integrityCheck}
                        onChange={(e) => setMonitoringForm({...monitoringForm, integrityCheck: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Staff Initials</label>
                      <input 
                        type="text"
                        value="GEM"
                        disabled
                        className="w-full px-3 py-2 border border-slate-100 bg-slate-50 text-slate-500 rounded-xl text-sm cursor-not-allowed font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1 font-semibold text-rose-600">Corrective Action</label>
                    <textarea 
                      value={monitoringForm.correctiveAction}
                      onChange={(e) => setMonitoringForm({...monitoringForm, correctiveAction: e.target.value})}
                      placeholder="Required if parameters are out of range or integrity fails (Fridge Normal: 2-8°C, Humidity: 30-60%)"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Note: Under SOP, corrective action must be documented immediately if temp/humidity are outside safety limits or integrity check fails.
                    </p>
                  </div>
                </div>
              )}

              {selectedFormType === 'Inventory' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Drug/Item Name *</label>
                    <input 
                      type="text"
                      value={inventoryForm.drugName}
                      onChange={(e) => setInventoryForm({...inventoryForm, drugName: e.target.value})}
                      placeholder="e.g. Insulin Human 100 IU/ml"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Supplier/Vendor</label>
                      <input 
                        type="text"
                        value={inventoryForm.supplier}
                        onChange={(e) => setInventoryForm({...inventoryForm, supplier: e.target.value})}
                        placeholder="e.g. Pfizer Dist."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Batch/Lot Number *</label>
                      <input 
                        type="text"
                        value={inventoryForm.batchNumber}
                        onChange={(e) => setInventoryForm({...inventoryForm, batchNumber: e.target.value})}
                        placeholder="e.g. LOT-49204A"
                        className="w-full px-3 py-2 border border-emerald-300 focus:border-emerald-500 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-emerald-950 bg-emerald-50/50"
                        required
                      />
                      <p className="text-[9px] text-emerald-600 font-bold mt-0.5">Required for drug recall tracking.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expiry Date *</label>
                      <input 
                        type="date"
                        value={inventoryForm.expiryDate}
                        onChange={(e) => setInventoryForm({...inventoryForm, expiryDate: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quantity Received *</label>
                      <input 
                        type="number"
                        value={inventoryForm.quantityReceived}
                        onChange={(e) => setInventoryForm({...inventoryForm, quantityReceived: e.target.value})}
                        placeholder="e.g. 500"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unit Cost ($)</label>
                      <input 
                        type="number"
                        step="0.01"
                        value={inventoryForm.unitCost}
                        onChange={(e) => setInventoryForm({...inventoryForm, unitCost: e.target.value})}
                        placeholder="e.g. 0.15"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Storage Location (Bin)</label>
                      <input 
                        type="text"
                        value={inventoryForm.storageLocation}
                        onChange={(e) => setInventoryForm({...inventoryForm, storageLocation: e.target.value})}
                        placeholder="e.g. Bin B-04"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Received By</label>
                    <input 
                      type="text"
                      value="gemechuahmed0@gmail.com"
                      disabled
                      className="w-full px-3 py-2 border border-slate-100 bg-slate-50 text-slate-500 rounded-xl text-sm cursor-not-allowed font-semibold"
                    />
                  </div>
                </div>
              )}

              {selectedFormType === 'Drug Stock-out Monitor' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Drug Name *</label>
                    <input 
                      type="text"
                      value={drugStockOutForm.drugName}
                      onChange={(e) => setDrugStockOutForm({...drugStockOutForm, drugName: e.target.value})}
                      placeholder="e.g. Ceftriaxone 1g Inj"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Stock *</label>
                      <input 
                        type="number"
                        value={drugStockOutForm.currentStock}
                        onChange={(e) => setDrugStockOutForm({...drugStockOutForm, currentStock: e.target.value})}
                        placeholder="e.g. 5"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Min. Threshold *</label>
                      <input 
                        type="number"
                        value={drugStockOutForm.minThreshold}
                        onChange={(e) => setDrugStockOutForm({...drugStockOutForm, minThreshold: e.target.value})}
                        placeholder="e.g. 50"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                      <select 
                        value={drugStockOutForm.status}
                        onChange={(e) => setDrugStockOutForm({...drugStockOutForm, status: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Critical">Critical</option>
                        <option value="Depleted">Depleted</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason for Out</label>
                      <select 
                        value={drugStockOutForm.reasonForOut}
                        onChange={(e) => setDrugStockOutForm({...drugStockOutForm, reasonForOut: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Supply chain delay">Supply chain delay</option>
                        <option value="High demand">High demand</option>
                        <option value="Manufacturing shortage">Manufacturing shortage</option>
                        <option value="Expired stock">Expired stock</option>
                        <option value="Theft">Theft</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Action Taken</label>
                    <select 
                      value={drugStockOutForm.actionTaken}
                      onChange={(e) => setDrugStockOutForm({...drugStockOutForm, actionTaken: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Reordered">Reordered</option>
                      <option value="Transferred from main warehouse">Transferred from main warehouse</option>
                      <option value="Alternative drug recommended">Alternative drug recommended</option>
                      <option value="Escalated to clinical manager">Escalated to clinical manager</option>
                      <option value="Pending vendor update">Pending vendor update</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedFormType === 'Purchased Drug Stock-out Monitor' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Item Name *</label>
                    <input 
                      type="text"
                      value={purchasedStockOutForm.itemName}
                      onChange={(e) => setPurchasedStockOutForm({...purchasedStockOutForm, itemName: e.target.value})}
                      placeholder="e.g. Paracetamol 500mg"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Purchase Order (PO) *</label>
                      <input 
                        type="text"
                        value={purchasedStockOutForm.purchaseOrder}
                        onChange={(e) => setPurchasedStockOutForm({...purchasedStockOutForm, purchaseOrder: e.target.value})}
                        placeholder="e.g. PO-948293"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vendor Name *</label>
                      <input 
                        type="text"
                        value={purchasedStockOutForm.vendorName}
                        onChange={(e) => setPurchasedStockOutForm({...purchasedStockOutForm, vendorName: e.target.value})}
                        placeholder="e.g. GSK Pharma"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expected Arrival</label>
                      <input 
                        type="date"
                        value={purchasedStockOutForm.expectedArrival}
                        onChange={(e) => setPurchasedStockOutForm({...purchasedStockOutForm, expectedArrival: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Delay Reason</label>
                      <select 
                        value={purchasedStockOutForm.delayReason}
                        onChange={(e) => setPurchasedStockOutForm({...purchasedStockOutForm, delayReason: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Backorder">Backorder</option>
                        <option value="Customs delay">Customs delay</option>
                        <option value="Shipping/Logistics failure">Shipping/Logistics failure</option>
                        <option value="Vendor out of stock">Vendor out of stock</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Impact Assessment</label>
                      <select 
                        value={purchasedStockOutForm.impactAssessment}
                        onChange={(e) => setPurchasedStockOutForm({...purchasedStockOutForm, impactAssessment: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="High">High (Immediate critical shortage)</option>
                        <option value="Med">Med (Adequate alternative exists)</option>
                        <option value="Low">Low (Excess stock still present)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vendor Comms / Action</label>
                      <input 
                        type="text"
                        value={purchasedStockOutForm.vendorComms}
                        onChange={(e) => setPurchasedStockOutForm({...purchasedStockOutForm, vendorComms: e.target.value})}
                        placeholder="e.g. Called rep to expedite"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedFormType === 'Auditory Drug Stock-out Monitor' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Item Scanned *</label>
                    <input 
                      type="text"
                      value={auditoryStockOutForm.itemScanned}
                      onChange={(e) => setAuditoryStockOutForm({...auditoryStockOutForm, itemScanned: e.target.value})}
                      placeholder="e.g. Insulin Human (Scan or Type)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">System Balance *</label>
                      <input 
                        type="number"
                        value={auditoryStockOutForm.systemBalance}
                        onChange={(e) => setAuditoryStockOutForm({...auditoryStockOutForm, systemBalance: e.target.value})}
                        placeholder="e.g. 12"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Actual Physical Count *</label>
                      <input 
                        type="number"
                        value={auditoryStockOutForm.actualCount}
                        onChange={(e) => setAuditoryStockOutForm({...auditoryStockOutForm, actualCount: e.target.value})}
                        placeholder="e.g. 10"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Calculated Discrepancy</label>
                      <input 
                        type="text"
                        value={(parseInt(auditoryStockOutForm.systemBalance) || 0) - (parseInt(auditoryStockOutForm.actualCount) || 0)}
                        disabled
                        className="w-full px-3 py-2 border border-slate-100 bg-slate-50 text-rose-600 font-bold rounded-xl text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Resolution Status</label>
                      <select 
                        value={auditoryStockOutForm.resolutionStatus}
                        onChange={(e) => setAuditoryStockOutForm({...auditoryStockOutForm, resolutionStatus: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Pending">Pending Review</option>
                        <option value="Resolved">Resolved (Adjusted balance)</option>
                        <option value="Escalated">Escalated (Investigation required)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Audit Notes / Explanations</label>
                    <textarea 
                      value={auditoryStockOutForm.auditNotes}
                      onChange={(e) => setAuditoryStockOutForm({...auditoryStockOutForm, auditNotes: e.target.value})}
                      placeholder="e.g. Found 2 expired boxes in back corner"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Auditor Name</label>
                      <input 
                        type="text"
                        value="gemechuahmed0@gmail.com"
                        disabled
                        className="w-full px-3 py-2 border border-slate-100 bg-slate-50 text-slate-500 rounded-xl text-sm cursor-not-allowed font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Audit Date</label>
                      <input 
                        type="text"
                        value={new Date().toLocaleDateString()}
                        disabled
                        className="w-full px-3 py-2 border border-slate-100 bg-slate-50 text-slate-500 rounded-xl text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedFormType === 'Bin Card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Item Name *</label>
                    <input 
                      type="text"
                      value={binCardForm.itemName}
                      onChange={(e) => setBinCardForm({...binCardForm, itemName: e.target.value})}
                      placeholder="e.g. Paracetamol 500mg"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Batch Number</label>
                      <input 
                        type="text"
                        value={binCardForm.batchNumber}
                        onChange={(e) => setBinCardForm({...binCardForm, batchNumber: e.target.value})}
                        placeholder="e.g. B-2023-01"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Balance B/F</label>
                      <input 
                        type="number"
                        value={binCardForm.balanceBf}
                        onChange={(e) => setBinCardForm({...binCardForm, balanceBf: e.target.value})}
                        placeholder="e.g. 100"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quantity Received</label>
                      <input 
                        type="number"
                        value={binCardForm.quantityReceived}
                        onChange={(e) => setBinCardForm({...binCardForm, quantityReceived: e.target.value})}
                        placeholder="e.g. 50"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quantity Issued</label>
                      <input 
                        type="number"
                        value={binCardForm.quantityIssued}
                        onChange={(e) => setBinCardForm({...binCardForm, quantityIssued: e.target.value})}
                        placeholder="e.g. 20"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Balance In Stock</label>
                      <input 
                        type="number"
                        value={binCardForm.balanceInStock}
                        onChange={(e) => setBinCardForm({...binCardForm, balanceInStock: e.target.value})}
                        placeholder="e.g. 130"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Remarks</label>
                      <input 
                        type="text"
                        value={binCardForm.remarks}
                        onChange={(e) => setBinCardForm({...binCardForm, remarks: e.target.value})}
                        placeholder="e.g. Verified by Dr. Smith"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedFormType === 'Inventory Add Items' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Item Name *</label>
                    <input 
                      type="text"
                      value={inventoryAddItemsForm.itemName}
                      onChange={(e) => setInventoryAddItemsForm({...inventoryAddItemsForm, itemName: e.target.value})}
                      placeholder="e.g. Amoxicillin"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                      <input 
                        type="text"
                        value={inventoryAddItemsForm.category}
                        onChange={(e) => setInventoryAddItemsForm({...inventoryAddItemsForm, category: e.target.value})}
                        placeholder="e.g. Antibiotics"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dosage Form</label>
                      <input 
                        type="text"
                        value={inventoryAddItemsForm.dosageForm}
                        onChange={(e) => setInventoryAddItemsForm({...inventoryAddItemsForm, dosageForm: e.target.value})}
                        placeholder="e.g. Capsule"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Strength</label>
                      <input 
                        type="text"
                        value={inventoryAddItemsForm.strength}
                        onChange={(e) => setInventoryAddItemsForm({...inventoryAddItemsForm, strength: e.target.value})}
                        placeholder="e.g. 500mg"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unit of Issue</label>
                      <input 
                        type="text"
                        value={inventoryAddItemsForm.unitOfIssue}
                        onChange={(e) => setInventoryAddItemsForm({...inventoryAddItemsForm, unitOfIssue: e.target.value})}
                        placeholder="e.g. Box of 100"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reorder Level</label>
                      <input 
                        type="number"
                        value={inventoryAddItemsForm.reorderLevel}
                        onChange={(e) => setInventoryAddItemsForm({...inventoryAddItemsForm, reorderLevel: e.target.value})}
                        placeholder="e.g. 50"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Max Level</label>
                      <input 
                        type="number"
                        value={inventoryAddItemsForm.maxLevel}
                        onChange={(e) => setInventoryAddItemsForm({...inventoryAddItemsForm, maxLevel: e.target.value})}
                        placeholder="e.g. 500"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => {
                    setShowFormModal(false);
                    setSelectedFormType(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Database size={14} />
                  <span>Log to Secure Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modals */}
      {isQuickActionModalOpen && selectedQuickActionRx && (
        <DispensaryQuickActionModal 
          prescription={selectedQuickActionRx}
          isOpen={isQuickActionModalOpen}
          onClose={() => {
            setIsQuickActionModalOpen(false);
            setSelectedQuickActionRx(null);
          }}
          addToast={addToast}
          hospital_id={hospital_id}
          onSuccess={fetchLogs}
        />
      )}

      {isVitalsModalOpen && vitalsPatientId && (
        <VitalsModal 
          patientMrn={vitalsPatientId}
          patientName={vitalsPatientName || 'Patient'}
          isOpen={isVitalsModalOpen}
          onClose={() => {
            setIsVitalsModalOpen(false);
            setVitalsPatientId(null);
            setVitalsPatientName(null);
          }}
        />
      )}
    </div>
  );
}
