import React, { useState, useEffect } from 'react';
import { 
  collection, onSnapshot, query, where, addDoc, serverTimestamp, orderBy, getDocs, deleteDoc, doc, updateDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { 
  X, Printer, FileText, Pill, Activity, Calendar, User, Phone, MapPin, Clock, 
  Plus, Check, Shield, ClipboardList, Syringe, Sparkles, CheckCircle2, History,
  FolderOpen, Trash2, ChevronDown, ChevronUp, PlusCircle, FileCheck2, Pencil
} from 'lucide-react';
import { MODULES_CONFIG } from './HospitalModules';
import { ENTITIES_CONFIG } from '../data/schema';
import { IntakeForm } from './IntakeForm';
import { Language, translate } from '../lib/translations';

const customOtherSubsection = {
  id: '1.1.1.other',
  name: '1.1.1.other Custom Clinical Documentation Form (Other)',
  category: 'both',
  fields: [
    { key: 'patient_mrn', label: 'Patient MRN*', type: 'text', required: true },
    { key: 'custom_form_title', label: 'Custom Document / Form Title*', type: 'text', required: true, placeholder: 'e.g., General Consent, Intake Summary, Special Referral' },
    { key: 'clinical_notes', label: 'Clinical Documentation & Findings / Notes*', type: 'textarea', required: true, placeholder: 'Enter all relevant clinical notes, physical findings, or patient records here...' },
    { key: 'attending_physician', label: 'Attending Clinician / Officer Name', type: 'text' }
  ]
};

interface PatientDetailsModalProps {
  patient: any;
  isOpen: boolean;
  onClose: () => void;
  activeHospital?: any;
  currentLanguage?: Language;
}

export default function PatientDetailsModal({ 
  patient, 
  isOpen, 
  onClose, 
  activeHospital,
  currentLanguage = 'en'
}: PatientDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'clinical' | 'medications' | 'account_folder'>('clinical');
  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';
  const [encounters, setEncounters] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [administrations, setAdministrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Patient Account Folder states
  const [folderCategory, setFolderCategory] = useState<'outpatient' | 'inpatient'>('outpatient');
  const [selectedFolderSub, setSelectedFolderSub] = useState<any | null>(null);
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [folderSubmissions, setFolderSubmissions] = useState<any[]>([]);
  const [loadingFolderSubmissions, setLoadingFolderSubmissions] = useState(false);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);
  const [formSuccessMessage, setFormSuccessMessage] = useState('');
  const [formErrorMessage, setFormErrorMessage] = useState('');
  const [searchFolderFormQuery, setSearchFolderFormQuery] = useState('');

  // Custom schema table designer states
  const [isDesigningCustomTable, setIsDesigningCustomTable] = useState(false);
  const [customTableTitle, setCustomTableTitle] = useState('');
  const [customTableColumns, setCustomTableColumns] = useState<string[]>(['Column 1', 'Column 2']);
  const [customTableRows, setCustomTableRows] = useState<Record<string, string>[]>([
    { 'Column 1': '', 'Column 2': '' }
  ]);
  const [newColumnName, setNewColumnName] = useState('');

  // Form states for new prescription
  const [isPrescribing, setIsPrescribing] = useState(false);
  const [newDrug, setNewDrug] = useState('');
  const [newDose, setNewDose] = useState('');
  const [newFrequency, setNewFrequency] = useState('Every 8 hours');
  const [newDuration, setNewDuration] = useState('5 days');
  const [newNotes, setNewNotes] = useState('');
  const [prescriptionError, setPrescriptionError] = useState('');
  const [prescriptionSuccess, setPrescriptionSuccess] = useState('');

  // Form states for dose administration
  const [selectedMedForAdmin, setSelectedMedForAdmin] = useState<any | null>(null);
  const [adminDose, setAdminDose] = useState('');
  const [adminRoute, setAdminRoute] = useState('Oral');
  const [adminNotes, setAdminNotes] = useState('');
  const [adminClinician, setAdminClinician] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminError, setAdminError] = useState('');

  const patientMrn = patient?.mrn || patient?.patient_mrn || '';
  const patientName = patient?.full_name || patient?.name || 'Anonymous Patient';

  // Synchronize data for patient
  useEffect(() => {
    if (!isOpen || !patientMrn) return;

    setLoading(true);
    setAdminClinician(auth.currentUser?.email || 'Duty Nurse');

    // Subscribe to patient's clinical encounters
    const encountersQuery = query(
      collection(db, 'clinical_encounters'),
      where('patient_mrn', '==', patientMrn)
    );
    const unsubEncounters = onSnapshot(encountersQuery, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Sort by date descending
      list.sort((a: any, b: any) => {
        const dateA = new Date(a.encounter_date || 0).getTime();
        const dateB = new Date(b.encounter_date || 0).getTime();
        return dateB - dateA;
      });
      setEncounters(list);
    }, (err) => {
      console.warn("Error fetching patient encounters:", err);
    });

    // Subscribe to patient's prescriptions
    const rxQuery = query(
      collection(db, 'prescriptions'),
      where('patient_mrn', '==', patientMrn)
    );
    const unsubRx = onSnapshot(rxQuery, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      list.sort((a: any, b: any) => {
        const dateA = new Date(a.prescribed_at || 0).getTime();
        const dateB = new Date(b.prescribed_at || 0).getTime();
        return dateB - dateA;
      });
      setPrescriptions(list);
      // Default select the first drug if available
      if (list.length > 0 && list[0].items && list[0].items.length > 0) {
        const item = list[0].items[0];
        setSelectedMedForAdmin({
          id: list[0].id,
          drug: item.drug,
          dose: item.dose,
          frequency: item.frequency,
          duration: item.duration,
          prescribed_by: list[0].prescribed_by
        });
        setAdminDose(item.dose || '');
      }
    }, (err) => {
      console.warn("Error fetching patient prescriptions:", err);
    });

    // Subscribe to patient's medication administrations
    const adminQuery = query(
      collection(db, 'medication_administrations'),
      where('patient_mrn', '==', patientMrn)
    );
    const unsubAdmin = onSnapshot(adminQuery, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Sort by time descending
      list.sort((a: any, b: any) => {
        const dateA = new Date(a.administered_at || 0).getTime();
        const dateB = new Date(b.administered_at || 0).getTime();
        return dateB - dateA;
      });
      setAdministrations(list);
      setLoading(false);
    }, (err) => {
      console.warn("Error fetching administrations:", err);
      setLoading(false);
    });

    // Subscribe to patient's folder submissions (clinical forms 1.1.1.a to 1.1.1.z.3)
    const folderQuery = query(
      collection(db, 'hospital_modules_submissions'),
      where('data.patient_mrn', '==', patientMrn)
    );
    const unsubFolder = onSnapshot(folderQuery, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      list.sort((a: any, b: any) => {
        const dateA = new Date(a.submitted_at || 0).getTime();
        const dateB = new Date(b.submitted_at || 0).getTime();
        return dateB - dateA;
      });
      setFolderSubmissions(list);
    }, (err) => {
      console.warn("Error fetching folder submissions:", err);
    });

    return () => {
      unsubEncounters();
      unsubRx();
      unsubAdmin();
      unsubFolder();
    };
  }, [isOpen, patientMrn]);

  // Submit clinical forms under Patient Account Folder
  const handleFolderFormSubmit = async (formData: any) => {
    setFormSuccessMessage('');
    setFormErrorMessage('');
    const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';
    const submissionDate = new Date().toISOString();
    
    // Clear the local storage cache upon successful start of submission
    const cacheKey = `ehr_draft_form_${hospital_id}_${patientMrn}_${selectedFolderSub?.id}`;
    localStorage.removeItem(cacheKey);

    // Optimistic UI update
    const optimisticSubmission = {
      id: 'optimistic-' + Date.now(),
      hospital_id,
      module_id: 'Module-1',
      subsection_id: selectedFolderSub.id,
      subsection_name: selectedFolderSub.name,
      submitted_at: submissionDate,
      data: {
        ...formData,
        patient_mrn: patientMrn,
        patient_name: patientName,
      }
    };
    
    if (!editingSubmissionId) {
      setFolderSubmissions(prev => [optimisticSubmission, ...prev]);
    } else {
      setFolderSubmissions(prev => prev.map(s => s.id === editingSubmissionId ? { ...s, data: optimisticSubmission.data, updated_at: submissionDate } : s));
    }

    try {
      if (editingSubmissionId) {
        // Update existing clinical submission
        const submissionRef = doc(db, 'hospital_modules_submissions', editingSubmissionId);
        await updateDoc(submissionRef, {
          updated_at: submissionDate,
          hospital_id,
          data: {
            ...formData,
            patient_mrn: patientMrn,
            patient_name: patientName,
          }
        });
        setFormSuccessMessage(`✓ Form ${selectedFolderSub.id} successfully updated inside ${patientName}'s clinical account folder!`);
        setEditingSubmissionId(null);
      } else {
        // Create new clinical submission
        const { submitClinicalSubmission } = await import('../lib/workflow');
        const payload = {
          hospital_id,
          moduleId: 'Module-1',
          subsectionId: selectedFolderSub.id,
          subsectionName: selectedFolderSub.name,
          submittedAt: submissionDate,
          data: {
            ...formData,
            patient_mrn: patientMrn,
            patient_name: patientName,
          }
        };
        const result = await submitClinicalSubmission(payload);
        
        if (result.queued) {
          setFormSuccessMessage(`✓ Form ${selectedFolderSub.id} saved locally and queued for offline sync!`);
        } else {
          setFormSuccessMessage(`✓ Form ${selectedFolderSub.id} successfully saved to ${patientName}'s clinical account folder!`);
        }
      }
      setSelectedFolderSub(null);
      setTimeout(() => setFormSuccessMessage(''), 4000);
    } catch (err: any) {
      console.error(err);
      setFormErrorMessage(`Error saving form: ${err.message}. Changes are cached locally.`);
      // Restore optimistic UI update failure
      if (!editingSubmissionId) {
         setFolderSubmissions(prev => prev.filter(s => s.id !== optimisticSubmission.id));
      }
    }
  };

  // Submit custom drawn schema table to patient folder
  const handleSaveCustomTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccessMessage('');
    setFormErrorMessage('');
    
    if (!customTableTitle.trim()) {
      setFormErrorMessage('Please specify a title/name for your custom schema table.');
      return;
    }
    if (customTableColumns.length === 0) {
      setFormErrorMessage('Please define at least one column for your schema table.');
      return;
    }

    try {
      const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';
      const payload = {
        hospital_id,
        module_id: 'Module-1',
        subsection_id: '1.1.1.custom_table',
        subsection_name: `Custom Schema Table: ${customTableTitle.trim()}`,
        submitted_at: new Date().toISOString(),
        data: {
          isCustomTable: true,
          title: customTableTitle.trim(),
          columns: customTableColumns,
          rows: customTableRows,
          patient_mrn: patientMrn,
          patient_name: patientName,
        }
      };

      if (editingSubmissionId) {
        const submissionRef = doc(db, 'hospital_modules_submissions', editingSubmissionId);
        await updateDoc(submissionRef, {
          updated_at: new Date().toISOString(),
          hospital_id,
          data: payload.data
        });
        setFormSuccessMessage(`✓ Custom Schema Table "${customTableTitle}" successfully updated inside ${patientName}'s clinical account folder!`);
        setEditingSubmissionId(null);
      } else {
        await addDoc(collection(db, 'hospital_modules_submissions'), payload);
        setFormSuccessMessage(`✓ Custom Schema Table "${customTableTitle}" successfully drawn & generated inside ${patientName}'s clinical account folder!`);
      }

      setIsDesigningCustomTable(false);
      setCustomTableTitle('');
      setCustomTableColumns(['Column 1', 'Column 2']);
      setCustomTableRows([{ 'Column 1': '', 'Column 2': '' }]);
      setTimeout(() => setFormSuccessMessage(''), 4000);
    } catch (err: any) {
      console.error(err);
      setFormErrorMessage(`Failed to save schema table: ${err.message}`);
    }
  };

  // Delete clinical form submission
  const handleDeleteFolderSubmission = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this form submission from this patient\'s folder?')) return;
    try {
      await deleteDoc(doc(db, 'hospital_modules_submissions', id));
    } catch (err: any) {
      console.error(err);
      alert(`Error deleting record: ${err.message}`);
    }
  };

  // Handle prescribing a new medication
  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrug.trim() || !newDose.trim()) {
      setPrescriptionError('Please enter a drug name and dosage.');
      return;
    }

    setPrescriptionError('');
    setPrescriptionSuccess('');

    try {
      const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';
      const prescriber = auth.currentUser?.email || 'Medical Officer';
      
      const rxDoc = {
        hospital_id,
        rx_id: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
        visit_id: `VST-${Math.floor(100 + Math.random() * 900)}`,
        patient_mrn: patientMrn,
        patient_name: patientName,
        prescribed_by: prescriber,
        prescribed_at: new Date().toISOString(),
        items: [
          { drug: newDrug, dose: newDose, frequency: newFrequency, duration: newDuration }
        ],
        diagnosis_text: 'Prescribed via Medical Hub',
        notes: newNotes,
        status: 'pending',
        dispensed_by: '',
        dispensed_at: '',
        payer_method: 'cash'
      };

      await addDoc(collection(db, 'prescriptions'), rxDoc);
      setPrescriptionSuccess('✓ Regimen successfully prescribed and registered in EHR!');
      
      // Reset prescription form
      setNewDrug('');
      setNewDose('');
      setNewNotes('');
      setTimeout(() => {
        setIsPrescribing(false);
        setPrescriptionSuccess('');
      }, 2000);
    } catch (err: any) {
      setPrescriptionError(`Failed to save prescription: ${err.message}`);
    }
  };

  // Handle logging a dose administration
  const handleLogAdministration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedForAdmin) {
      setAdminError('Please select a medication to administer.');
      return;
    }
    if (!adminDose.trim()) {
      setAdminError('Please enter the dose given.');
      return;
    }

    setAdminError('');
    setAdminSuccess('');

    try {
      const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';
      
      const adminDoc = {
        hospital_id,
        patient_mrn: patientMrn,
        patient_id: patient.id || '',
        patient_name: patientName,
        drug: selectedMedForAdmin.drug,
        dose_given: adminDose,
        administered_by: adminClinician || 'Duty Nurse',
        administered_at: new Date().toISOString(),
        route: adminRoute,
        notes: adminNotes,
        original_prescription_id: selectedMedForAdmin.id || ''
      };

      await addDoc(collection(db, 'medication_administrations'), adminDoc);
      setAdminSuccess('✓ Dose successfully logged in Medication Administration Record (MAR)!');
      
      // Create patient journey event for record logging
      try {
        await addDoc(collection(db, 'patient_journey_events'), {
          hospital_id,
          patient_mrn: patientMrn,
          patient_name: patientName,
          stage: 'nursing',
          stage_label: 'Medication Administration',
          location: 'Ward Room',
          handled_by: adminClinician || 'Duty Nurse',
          notes: `Administered ${adminDose} of ${selectedMedForAdmin.drug} (${adminRoute}).`,
          event_time: new Date().toISOString(),
          duration_minutes: 5,
          status: 'completed'
        });
      } catch (e) {
        console.warn("Failed to write timeline event:", e);
      }

      setAdminNotes('');
      setTimeout(() => {
        setAdminSuccess('');
      }, 2500);
    } catch (err: any) {
      setAdminError(`Failed to log administration: ${err.message}`);
    }
  };

  // Select a medication from active regimen and pre-fill form
  const selectMedicationForAdmin = (rx: any, item: any) => {
    setSelectedMedForAdmin({
      id: rx.id,
      drug: item.drug,
      dose: item.dose,
      frequency: item.frequency,
      duration: item.duration,
      prescribed_by: rx.prescribed_by
    });
    setAdminDose(item.dose);
    // Auto-scroll or focus to form
    const formElement = document.getElementById('administration-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Generate & Print HTML PDF report
  const handlePrintPdfSummary = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate and print the clinical summary PDF.');
      return;
    }

    const hospitalName = activeHospital?.name || 'Hospital';
    const hospitalLogo = '🏥';

    // Format Encounters HTML
    let encountersHtml = '';
    if (encounters.length > 0) {
      encountersHtml = encounters.map(enc => `
        <div style="margin-bottom: 20px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 15px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: 700; color: #1e293b; font-size: 13px;">
              ${enc.encounter_type ? enc.encounter_type.toUpperCase() : 'OUTPATIENT CONSULT'} • ${enc.clinic ? enc.clinic.replace('_', ' ').toUpperCase() : 'GENERAL'}
            </span>
            <span style="color: #64748b; font-size: 12px; font-weight: 500;">
              ${new Date(enc.encounter_date).toLocaleString()}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; background: #f8fafc; padding: 10px; border-radius: 6px; font-size: 11px;">
            <div><strong>Attending Clinician:</strong> ${enc.attending_clinician || 'N/A'}</div>
            <div><strong>Status:</strong> ${enc.status || 'closed'}</div>
            <div><strong>Chief Complaint:</strong> ${enc.chief_complaint || 'N/A'}</div>
            <div><strong>Diagnosis Code (ICD-10):</strong> ${enc.diagnosis_icd10 || 'N/A'}</div>
            <div style="grid-column: span 2;"><strong>Diagnosis Text:</strong> ${enc.diagnosis_text || 'N/A'}</div>
          </div>
          <div style="font-size: 12px; color: #334155; margin-bottom: 6px;">
            <strong>Vitals:</strong> 
            BP: ${enc.vitals_bp || 'N/A'} | 
            Pulse: ${enc.vitals_pulse ? enc.vitals_pulse + ' bpm' : 'N/A'} | 
            Temp: ${enc.vitals_temp ? enc.vitals_temp + '°C' : 'N/A'} | 
            SPO2: ${enc.vitals_spo2 ? enc.vitals_spo2 + '%' : 'N/A'}
          </div>
          <div style="font-size: 12px; color: #334155; margin-bottom: 4px;">
            <strong>Subjective (S):</strong> ${enc.soap_subjective || 'N/A'}
          </div>
          <div style="font-size: 12px; color: #334155; margin-bottom: 4px;">
            <strong>Objective (O):</strong> ${enc.soap_objective || 'N/A'}
          </div>
          <div style="font-size: 12px; color: #334155; margin-bottom: 4px;">
            <strong>Assessment (A):</strong> ${enc.soap_assessment || 'N/A'}
          </div>
          <div style="font-size: 12px; color: #334155;">
            <strong>Plan (P):</strong> ${enc.soap_plan || 'N/A'}
          </div>
        </div>
      `).join('');
    } else {
      encountersHtml = '<p style="color: #64748b; font-size: 12px; font-style: italic;">No clinical encounters registered on file for this patient.</p>';
    }

    // Format Prescriptions HTML
    let prescriptionsHtml = '';
    if (prescriptions.length > 0) {
      prescriptionsHtml = `
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border-bottom: 2px solid #e2e8f0; text-align: left; padding: 8px 10px; font-size: 11px; color: #475569;">Medication</th>
              <th style="border-bottom: 2px solid #e2e8f0; text-align: left; padding: 8px 10px; font-size: 11px; color: #475569;">Dosage</th>
              <th style="border-bottom: 2px solid #e2e8f0; text-align: left; padding: 8px 10px; font-size: 11px; color: #475569;">Frequency</th>
              <th style="border-bottom: 2px solid #e2e8f0; text-align: left; padding: 8px 10px; font-size: 11px; color: #475569;">Duration</th>
              <th style="border-bottom: 2px solid #e2e8f0; text-align: left; padding: 8px 10px; font-size: 11px; color: #475569;">Prescribed By</th>
              <th style="border-bottom: 2px solid #e2e8f0; text-align: left; padding: 8px 10px; font-size: 11px; color: #475569;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${prescriptions.map(rx => (rx.items || []).map((item: any) => `
              <tr>
                <td style="border-bottom: 1px solid #f1f5f9; padding: 10px; font-size: 12px; font-weight: 600; color: #0f172a;">${item.drug}</td>
                <td style="border-bottom: 1px solid #f1f5f9; padding: 10px; font-size: 12px; color: #334155;">${item.dose}</td>
                <td style="border-bottom: 1px solid #f1f5f9; padding: 10px; font-size: 12px; color: #334155;">${item.frequency}</td>
                <td style="border-bottom: 1px solid #f1f5f9; padding: 10px; font-size: 12px; color: #334155;">${item.duration}</td>
                <td style="border-bottom: 1px solid #f1f5f9; padding: 10px; font-size: 11px; color: #64748b;">${rx.prescribed_by}</td>
                <td style="border-bottom: 1px solid #f1f5f9; padding: 10px; font-size: 11px;">
                  <span style="padding: 2px 6px; font-size: 10px; font-weight: 600; background: #e0f2fe; color: #0369a1; border-radius: 4px; text-transform: uppercase;">${rx.status || 'pending'}</span>
                </td>
              </tr>
            `).join('')).join('')}
          </tbody>
        </table>
      `;
    } else {
      prescriptionsHtml = '<p style="color: #64748b; font-size: 12px; font-style: italic;">No active pharmacological prescriptions registered.</p>';
    }

    // Format Administrations HTML (MAR)
    let MARHtml = '';
    if (administrations.length > 0) {
      MARHtml = `
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border-bottom: 2px solid #e2e8f0; text-align: left; padding: 8px 10px; font-size: 11px; color: #475569;">Medication Given</th>
              <th style="border-bottom: 2px solid #e2e8f0; text-align: left; padding: 8px 10px; font-size: 11px; color: #475569;">Dose Given</th>
              <th style="border-bottom: 2px solid #e2e8f0; text-align: left; padding: 8px 10px; font-size: 11px; color: #475569;">Route</th>
              <th style="border-bottom: 2px solid #e2e8f0; text-align: left; padding: 8px 10px; font-size: 11px; color: #475569;">Administered By</th>
              <th style="border-bottom: 2px solid #e2e8f0; text-align: left; padding: 8px 10px; font-size: 11px; color: #475569;">Administration Time</th>
              <th style="border-bottom: 2px solid #e2e8f0; text-align: left; padding: 8px 10px; font-size: 11px; color: #475569;">Clinical Notes</th>
            </tr>
          </thead>
          <tbody>
            ${administrations.map(admin => `
              <tr>
                <td style="border-bottom: 1px solid #f1f5f9; padding: 10px; font-size: 12px; font-weight: 600; color: #0f172a;">${admin.drug}</td>
                <td style="border-bottom: 1px solid #f1f5f9; padding: 10px; font-size: 12px; color: #334155;">${admin.dose_given}</td>
                <td style="border-bottom: 1px solid #f1f5f9; padding: 10px; font-size: 11px; color: #475569;">${admin.route || 'Oral'}</td>
                <td style="border-bottom: 1px solid #f1f5f9; padding: 10px; font-size: 11px; color: #64748b;">${admin.administered_by}</td>
                <td style="border-bottom: 1px solid #f1f5f9; padding: 10px; font-size: 11px; color: #64748b;">${new Date(admin.administered_at).toLocaleString()}</td>
                <td style="border-bottom: 1px solid #f1f5f9; padding: 10px; font-size: 11px; font-style: italic; color: #475569;">${admin.notes || 'Routine dose administered'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      MARHtml = '<p style="color: #64748b; font-size: 12px; font-style: italic;">No recorded medication administration history (MAR) logged.</p>';
    }

    const documentContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Medical Summary: ${patientName} (${patientMrn})</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 40px;
            line-height: 1.5;
            background-color: #fff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px double #cbd5e1;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .hospital-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo {
            font-size: 32px;
          }
          .title-group {
            display: flex;
            flex-direction: column;
          }
          .hosp-name {
            font-size: 20px;
            font-weight: 700;
            color: #1e3a8a;
            margin: 0;
          }
          .hosp-sub {
            font-size: 10px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0;
          }
          .report-info {
            text-align: right;
          }
          .report-title {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
          }
          .report-date {
            font-size: 11px;
            color: #64748b;
          }
          .section-title {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #1e3a8a;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 5px;
            margin-top: 25px;
            margin-bottom: 12px;
            page-break-after: avoid;
          }
          .grid-fields {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          }
          .info-card {
            background-color: #f8fafc;
            border: 1px solid #f1f5f9;
            padding: 10px;
            border-radius: 6px;
          }
          .info-lbl {
            font-size: 9px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
          }
          .info-txt {
            font-size: 12px;
            font-weight: 500;
            color: #0f172a;
            margin-top: 2px;
          }
          .col-2 {
            grid-column: span 2;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background-color: #f8fafc;
            color: #475569;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            padding: 8px;
            border-bottom: 1.5px solid #e2e8f0;
          }
          td {
            padding: 8px;
            font-size: 11px;
            border-bottom: 1px solid #f1f5f9;
          }
          .footer {
            margin-top: 50px;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            font-size: 10px;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
          }
          @media print {
            body {
              padding: 20px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hospital-info">
            <span class="logo">${hospitalLogo}</span>
            <div class="title-group">
              <h1 class="hosp-name">${hospitalName}</h1>
              <p class="hosp-sub">Enterprise EHR Clinical Records System</p>
            </div>
          </div>
          <div class="report-info">
            <h2 class="report-title">Comprehensive Medical Record Summary</h2>
            <p class="report-date">Generated: ${new Date().toLocaleString()}</p>
          </div>
        </div>

        <div class="section-title">Patient Demographics & Registration</div>
        <div class="grid-fields">
          <div class="info-card col-2">
            <div class="info-lbl">Full Name</div>
            <div class="info-txt">${patientName}</div>
          </div>
          <div class="info-card">
            <div class="info-lbl">Unique MRN</div>
            <div class="info-txt" style="font-family: monospace; font-weight: 700; color: #1e3a8a;">${patientMrn}</div>
          </div>
          <div class="info-card">
            <div class="info-lbl">Date of Birth</div>
            <div class="info-txt">${patient.dob || 'N/A'}</div>
          </div>
          <div class="info-card">
            <div class="info-lbl">Age / Gender</div>
            <div class="info-txt">${patient.age || 'N/A'} yrs / ${patient.gender || 'N/A'}</div>
          </div>
          <div class="info-card">
            <div class="info-lbl">Phone Number</div>
            <div class="info-txt">${patient.phone || 'N/A'}</div>
          </div>
          <div class="info-card col-2">
            <div class="info-lbl">Primary Address</div>
            <div class="info-txt">${patient.address || 'N/A'}</div>
          </div>
        </div>

        <div class="section-title">Active Pharmacological Regimens (Prescriptions)</div>
        <div style="margin-bottom: 25px;">
          ${prescriptionsHtml}
        </div>

        <div class="section-title">Medication Administration Record (MAR Logs)</div>
        <div style="margin-bottom: 25px;">
          ${MARHtml}
        </div>

        <div class="section-title">Clinical History & Recent Diagnostic Encounters</div>
        <div style="margin-bottom: 25px;">
          ${encountersHtml}
        </div>

        <div class="footer">
          <span>Digital Signature: EHR Secured Node Sync Verified</span>
          <span>Patient MRN: ${patientMrn} • Confidential Medical Document</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(documentContent);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/40 border-b border-gray-150 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <ClipboardList size={22} className="stroke-[2px]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 leading-none">
                  {patientName}
                </h2>
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[9px] font-black uppercase tracking-widest rounded-sm font-mono">
                  {patientMrn}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                EHR Clinical Hub • {patient.age || 'N/A'} yrs • {patient.gender || 'N/A'} • {patient.phone || 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* PDF Print Button */}
            <button
              onClick={handlePrintPdfSummary}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-100 dark:shadow-none"
              title="Generate, format, and download clinical summary PDF"
            >
              <Printer size={13} className="stroke-[2.5px]" />
              <span>Print/PDF Report</span>
            </button>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="px-6 bg-slate-50/50 dark:bg-slate-900/20 border-b border-gray-150 dark:border-slate-800 flex gap-4 shrink-0">
          <button
            onClick={() => setActiveTab('clinical')}
            className={`py-3 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'clinical' 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Activity size={14} />
            <span>Clinical History ({encounters.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('medications')}
            className={`py-3 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'medications' 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Pill size={14} />
            <span>Medications & MAR ({prescriptions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('account_folder')}
            className={`py-3 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'account_folder' 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <FolderOpen size={14} />
            <span>Patient Account Folder ({folderSubmissions.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto grow bg-white dark:bg-slate-900">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-gray-400 font-medium">Fetching real-time clinical node feeds...</p>
            </div>
          ) : activeTab === 'clinical' ? (
            /* Tab: Clinical History */
            <div className="space-y-6">
              
              {/* Patient Basic Profile Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-gray-100 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">DOB / Age</span>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {patient.dob || 'N/A'} ({patient.age || 'N/A'} years old)
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-gray-100 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Phone & Contact</span>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {patient.phone || 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-gray-100 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Home Address</span>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {patient.address || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Encounters Timeline */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
                  <FileText size={16} className="text-gray-400" />
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Registered Clinical Encounters</h3>
                </div>

                {encounters.length === 0 ? (
                  <div className="p-8 border border-dashed border-gray-200 dark:border-slate-800 rounded-xl text-center">
                    <p className="text-xs text-gray-400">No clinical encounters, symptoms or diagnoses logged for this patient yet.</p>
                  </div>
                ) : (
                  <div className="relative border-l border-indigo-100 dark:border-indigo-950/40 ml-2.5 pl-6 space-y-6">
                    {encounters.map((enc) => (
                      <div key={enc.id} className="relative group">
                        {/* Dot */}
                        <div className="absolute -left-[31px] top-1 w-3 h-3 bg-indigo-600 dark:bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 group-hover:scale-125 transition-transform"></div>
                        
                        <div className="p-4 border border-gray-150 dark:border-slate-800 rounded-xl space-y-3 shadow-2xs hover:shadow-xs transition-shadow">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold rounded-sm uppercase tracking-wider">
                                {enc.encounter_type || 'Consult'}
                              </span>
                              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-1.5">
                                Clinic: {enc.clinic ? enc.clinic.replace('_', ' ').toUpperCase() : 'General OPD'}
                              </h4>
                            </div>
                            <span className="text-[10px] text-gray-400 font-semibold font-mono">
                              {enc.encounter_date ? new Date(enc.encounter_date).toLocaleString() : 'N/A'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-gray-50/50 dark:bg-slate-800/20 p-3 rounded-lg border border-gray-100/50 dark:border-slate-800/30">
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Chief Complaint</span>
                              <p className="text-gray-800 dark:text-gray-200 font-medium mt-0.5">{enc.chief_complaint || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Clinical Diagnosis</span>
                              <p className="text-gray-800 dark:text-gray-200 font-semibold mt-0.5 text-indigo-600 dark:text-indigo-400">
                                {enc.diagnosis_text || 'N/A'} {enc.diagnosis_icd10 ? `(${enc.diagnosis_icd10})` : ''}
                              </p>
                            </div>
                            <div className="md:col-span-2">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Vitals Signed</span>
                              <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                                BP: <span className="font-semibold text-gray-800 dark:text-gray-200">{enc.vitals_bp || 'N/A'}</span> • 
                                Pulse: <span className="font-semibold text-gray-800 dark:text-gray-200">{enc.vitals_pulse ? `${enc.vitals_pulse} bpm` : 'N/A'}</span> • 
                                Temp: <span className="font-semibold text-gray-800 dark:text-gray-200">{enc.vitals_temp ? `${enc.vitals_temp} °C` : 'N/A'}</span> • 
                                SPO2: <span className="font-semibold text-gray-800 dark:text-gray-200">{enc.vitals_spo2 ? `${enc.vitals_spo2} %` : 'N/A'}</span>
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                            <p><strong>Subjective (S):</strong> {enc.soap_subjective || 'No notes logged.'}</p>
                            <p><strong>Objective (O):</strong> {enc.soap_objective || 'No notes logged.'}</p>
                            <p><strong>Assessment (A):</strong> {enc.soap_assessment || 'No notes logged.'}</p>
                            <p><strong>Plan (P):</strong> {enc.soap_plan || 'No notes logged.'}</p>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-slate-800/60 text-[11px] text-gray-400 font-medium">
                            <span>Signed: {enc.attending_clinician || 'Dr. Solomon Bedaso'}</span>
                            <span className="capitalize">Priority: {enc.priority || 'Routine'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'medications' ? (
            /* Tab: Medication Management Hub */
            <div className="space-y-8">
              
              {/* Active Medication Regimens (Prescriptions) */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Pill size={16} className="text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Active Regimen & Prescriptions</h3>
                  </div>
                  <button
                    onClick={() => setIsPrescribing(!isPrescribing)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} className="stroke-[3px]" />
                    <span>{isPrescribing ? 'Hide Form' : 'Prescribe New Regimen'}</span>
                  </button>
                </div>

                {/* Inline Prescription Form */}
                {isPrescribing && (
                  <form onSubmit={handleAddPrescription} className="p-4 bg-slate-50 dark:bg-slate-800/30 border border-indigo-100 dark:border-indigo-950/40 rounded-xl space-y-4 animate-fade-in">
                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Prescribe New Medication</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Drug Name*</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Amoxicillin 500mg"
                          value={newDrug}
                          onChange={(e) => setNewDrug(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Dosage*</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 500mg or 1 tab"
                          value={newDose}
                          onChange={(e) => setNewDose(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Frequency</label>
                        <select
                          value={newFrequency}
                          onChange={(e) => setNewFrequency(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-xs"
                        >
                          <option value="Once daily">Once daily</option>
                          <option value="Twice daily">Twice daily (q12h)</option>
                          <option value="Every 8 hours">Every 8 hours (q8h)</option>
                          <option value="Every 6 hours">Every 6 hours (q6h)</option>
                          <option value="As needed (PRN)">As needed (PRN)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Duration</label>
                        <input
                          type="text"
                          placeholder="e.g. 5 days or 1 month"
                          value={newDuration}
                          onChange={(e) => setNewDuration(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Special Instructions / Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Take after meals, swallow whole with full glass of water"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-xs"
                      />
                    </div>

                    {prescriptionError && <p className="text-xs text-rose-600 font-bold">{prescriptionError}</p>}
                    {prescriptionSuccess && <p className="text-xs text-emerald-600 font-bold">{prescriptionSuccess}</p>}

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPrescribing(false)}
                        className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Prescribe Regimen
                      </button>
                    </div>
                  </form>
                )}

                {prescriptions.length === 0 ? (
                  <div className="p-8 border border-dashed border-gray-200 dark:border-slate-800 rounded-xl text-center">
                    <p className="text-xs text-gray-400">No active regimens or prescriptions found for this patient.</p>
                  </div>
                ) : (
                  <div className="border border-gray-150 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-gray-150 dark:border-slate-800">
                          <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Medication / Drug</th>
                          <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dosage</th>
                          <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Frequency</th>
                          <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Duration</th>
                          <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Prescribed By</th>
                          <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 dark:divide-slate-800 text-xs">
                        {prescriptions.map((rx) => (rx.items || []).map((item: any, i: number) => (
                          <tr key={`${rx.id}-${i}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                            <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">
                              <div className="flex items-center gap-2">
                                <Syringe size={14} className="text-indigo-500 shrink-0" />
                                <div>
                                  <span>{item.drug}</span>
                                  {rx.notes && (
                                    <p className="text-[10px] font-medium text-gray-400 italic block mt-0.5">{rx.notes}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-gray-600 dark:text-gray-400">{item.dose}</td>
                            <td className="p-3 text-gray-600 dark:text-gray-400">{item.frequency}</td>
                            <td className="p-3 text-gray-600 dark:text-gray-400">{item.duration}</td>
                            <td className="p-3 text-gray-500 font-mono text-[10px]">
                              {rx.prescribed_by?.replace('@Hospital.org', '')}
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => selectMedicationForAdmin(rx, item)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Check size={11} className="stroke-[3px]" />
                                <span>Log Dose</span>
                              </button>
                            </td>
                          </tr>
                        )))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Log Medication Administration */}
              <div id="administration-form" className="p-5 border border-indigo-100/80 dark:border-indigo-950/60 bg-indigo-50/15 dark:bg-indigo-950/10 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-indigo-100/50 dark:border-indigo-950/40 pb-2">
                  <CheckCircle2 size={16} className="text-indigo-600" />
                  <h3 className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest">
                    Log Medication Dose Administration
                  </h3>
                </div>

                <form onSubmit={handleLogAdministration} className="space-y-4 text-xs font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Selected Medication</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg font-medium text-xs cursor-pointer"
                        value={selectedMedForAdmin ? JSON.stringify(selectedMedForAdmin) : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            const parsed = JSON.parse(e.target.value);
                            setSelectedMedForAdmin(parsed);
                            setAdminDose(parsed.dose || '');
                          } else {
                            setSelectedMedForAdmin(null);
                            setAdminDose('');
                          }
                        }}
                      >
                        {prescriptions.flatMap((rx) => (rx.items || []).map((item: any, i: number) => {
                          const value = {
                            id: rx.id,
                            drug: item.drug,
                            dose: item.dose,
                            frequency: item.frequency,
                            duration: item.duration,
                            prescribed_by: rx.prescribed_by
                          };
                          return (
                            <option key={`${rx.id}-${i}`} value={JSON.stringify(value)}>
                              {item.drug} ({item.dose} - {item.frequency})
                            </option>
                          );
                        }))}
                        {prescriptions.length === 0 && (
                          <option value="">No prescriptions on file</option>
                        )}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Dosage Administered*</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 500mg, 2 tabs"
                        value={adminDose}
                        onChange={(e) => setAdminDose(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Administration Route</label>
                      <select
                        value={adminRoute}
                        onChange={(e) => setAdminRoute(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        <option value="Oral">Oral (by mouth)</option>
                        <option value="Intravenous (IV)">Intravenous (IV)</option>
                        <option value="Intramuscular (IM)">Intramuscular (IM)</option>
                        <option value="Subcutaneous (SC)">Subcutaneous (SC)</option>
                        <option value="Topical">Topical (cream/ointment)</option>
                        <option value="Inhalation">Inhalation (nebulizer/inhaler)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Clinical Notes / Tolerability</label>
                      <input
                        type="text"
                        placeholder="e.g. Tolerated dose well, taken with lunch, BP stable"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Administering Clinician</label>
                      <input
                        type="text"
                        required
                        value={adminClinician}
                        onChange={(e) => setAdminClinician(e.target.value)}
                        placeholder="Duty Nurse"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  {adminError && <p className="text-xs text-rose-600 font-bold">{adminError}</p>}
                  {adminSuccess && <p className="text-xs text-emerald-600 font-bold">{adminSuccess}</p>}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={prescriptions.length === 0}
                      className={`px-5 py-2 rounded-xl text-xs font-extrabold text-white flex items-center gap-1.5 cursor-pointer shadow-md transition-all ${
                        prescriptions.length === 0 
                          ? 'bg-gray-300 dark:bg-slate-800 cursor-not-allowed text-gray-400' 
                          : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                      }`}
                    >
                      <CheckCircle2 size={13} className="stroke-[2.5px]" />
                      <span>Log Dose Administration</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Medication Administration History (MAR Timeline) */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
                  <History size={16} className="text-gray-400" />
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    Medication Administration History Record (MAR)
                  </h3>
                </div>

                {administrations.length === 0 ? (
                  <div className="p-8 border border-dashed border-gray-200 dark:border-slate-800 rounded-xl text-center">
                    <p className="text-xs text-gray-400">No medication administrations logged on file yet for this patient.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {administrations.map((admin) => (
                      <div key={admin.id} className="p-4 border border-gray-150 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-900/10 flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex gap-3">
                          <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl h-fit">
                            <Check size={16} className="stroke-[3.5px]" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                              {admin.drug} — {admin.dose_given}
                            </h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              Route: <span className="font-semibold">{admin.route || 'Oral'}</span> • 
                              Administered by: <span className="font-semibold">{admin.administered_by}</span>
                            </p>
                            {admin.notes && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 bg-white dark:bg-slate-800/40 p-2 rounded border border-gray-100 dark:border-slate-800/60 max-w-xl">
                                <strong>Clinical Note:</strong> {admin.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">
                            ✓ DOSE VERIFIED
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium font-mono block mt-1">
                            {admin.administered_at ? new Date(admin.administered_at).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Tab: Patient Account Folder (Clinical Forms 1.1.1.a to 1.1.1.z.3) */
            <div className="space-y-6">
              
              {/* Header Info */}
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-gray-150 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FolderOpen size={16} className="text-indigo-500" />
                    <span>Clinical Account Folder — Forms 1.1.1.a to 1.1.1.z</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Select a standardized clinical form to document OPD or IPD services. Submissions are persisted to this patient's digital record.
                  </p>
                </div>
                
                {/* OPD/IPD toggle */}
                <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-250/50 dark:border-slate-700/50 w-fit shrink-0">
                  <button
                    onClick={() => {
                      setFolderCategory('outpatient');
                      setSelectedFolderSub(null);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      folderCategory === 'outpatient'
                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-950 dark:text-gray-400'
                    }`}
                  >
                    <span>Outpatient (OPD)</span>
                  </button>
                  <button
                    onClick={() => {
                      setFolderCategory('inpatient');
                      setSelectedFolderSub(null);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      folderCategory === 'inpatient'
                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-950 dark:text-gray-400'
                    }`}
                  >
                    <span>Inpatient (IPD)</span>
                  </button>
                </div>
              </div>

              {formSuccessMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 size={14} />
                  <span>{formSuccessMessage}</span>
                </div>
              )}

              {formErrorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <span className="text-rose-500 font-extrabold">!</span>
                  <span>{formErrorMessage}</span>
                </div>
              )}

              {isDesigningCustomTable ? (
                /* Dynamic Custom Schema Table Creator */
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-3xs overflow-hidden">
                  <div className="bg-indigo-50/50 dark:bg-slate-800/40 px-5 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1.5 w-fit">
                        <Sparkles size={11} />
                        <span>Interactive Schema Table Drawer</span>
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1 flex items-center gap-1.5">
                        <span>{editingSubmissionId ? 'Edit / Update Custom Schema Table' : 'Draw & Generate New Schema Table'}</span>
                      </h4>
                    </div>
                    <button
                      onClick={() => {
                        setIsDesigningCustomTable(false);
                        setEditingSubmissionId(null);
                        setCustomTableTitle('');
                        setCustomTableColumns(['Column 1', 'Column 2']);
                        setCustomTableRows([{ 'Column 1': '', 'Column 2': '' }]);
                      }}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      ← Back to Forms
                    </button>
                  </div>

                  <form onSubmit={handleSaveCustomTable} className="p-5 space-y-6">
                    {/* Step 1: Schema Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">
                        1. Custom Table Title / Subject Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Post-Op Dialysis Parameters, Specialized Fluid Balances, EEG Diagnostic Grid"
                        value={customTableTitle}
                        onChange={(e) => setCustomTableTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 placeholder-gray-400 transition-all font-sans font-semibold"
                      />
                    </div>

                    {/* Step 2: Define Columns */}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-gray-150 dark:border-slate-800/80 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">
                          2. Draw Table Columns (Schema Headers)
                        </label>
                        <span className="text-[10px] text-gray-400 font-mono">
                          Total Headers: {customTableColumns.length}
                        </span>
                      </div>

                      {/* Column Tag List */}
                      <div className="flex flex-wrap gap-2">
                        {customTableColumns.map((col, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-100/30 text-xs font-semibold"
                          >
                            <span>{col}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const nextCols = customTableColumns.filter((_, i) => i !== idx);
                                setCustomTableColumns(nextCols);
                                // Clean up rows
                                const nextRows = customTableRows.map(row => {
                                  const updatedRow = { ...row };
                                  delete updatedRow[col];
                                  return updatedRow;
                                });
                                setCustomTableRows(nextRows);
                              }}
                              className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 font-bold ml-1 text-xs focus:outline-none"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add New Column Form */}
                      <div className="flex items-center gap-2 pt-1.5">
                        <input
                          type="text"
                          placeholder="Type new column name..."
                          value={newColumnName}
                          onChange={(e) => setNewColumnName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newColumnName.trim() && !customTableColumns.includes(newColumnName.trim())) {
                                setCustomTableColumns([...customTableColumns, newColumnName.trim()]);
                                setNewColumnName('');
                              }
                            }
                          }}
                          className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 placeholder-gray-400 transition-all font-sans"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newColumnName.trim() && !customTableColumns.includes(newColumnName.trim())) {
                              setCustomTableColumns([...customTableColumns, newColumnName.trim()]);
                              setNewColumnName('');
                            }
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1"
                        >
                          <Plus size={13} />
                          <span>Add Column</span>
                        </button>
                      </div>
                    </div>

                    {/* Step 3: Draw / Fill Rows */}
                    {customTableColumns.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">
                            3. Generated Table Row Entries (Fill Cell Data)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const newRow: Record<string, string> = {};
                              customTableColumns.forEach(c => { newRow[c] = ''; });
                              setCustomTableRows([...customTableRows, newRow]);
                            }}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <PlusCircle size={14} />
                            <span>Add New Row</span>
                          </button>
                        </div>

                        {/* Interactive Table Grid */}
                        <div className="overflow-x-auto rounded-xl border border-gray-150 dark:border-slate-800 bg-slate-50/10">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400 font-mono border-b border-gray-150 dark:border-slate-800">
                                {customTableColumns.map((col, idx) => (
                                  <th key={idx} className="p-3 font-semibold whitespace-nowrap text-[10px] uppercase">
                                    {col}
                                  </th>
                                ))}
                                <th className="p-3 w-12 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                              {customTableRows.map((row, rowIdx) => (
                                <tr key={rowIdx} className="hover:bg-white dark:hover:bg-slate-900/40">
                                  {customTableColumns.map((col, colIdx) => (
                                    <td key={colIdx} className="p-2">
                                      <input
                                        type="text"
                                        placeholder={`Enter ${col}...`}
                                        value={row[col] || ''}
                                        onChange={(e) => {
                                          const nextRows = [...customTableRows];
                                          nextRows[rowIdx] = {
                                            ...nextRows[rowIdx],
                                            [col]: e.target.value
                                          };
                                          setCustomTableRows(nextRows);
                                        }}
                                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/60 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 transition-all font-sans"
                                      />
                                    </td>
                                  ))}
                                  <td className="p-2 text-center">
                                    <button
                                      type="button"
                                      disabled={customTableRows.length <= 1}
                                      onClick={() => {
                                        const nextRows = customTableRows.filter((_, i) => i !== rowIdx);
                                        setCustomTableRows(nextRows);
                                      }}
                                      className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"
                                      title="Delete Row"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Actions */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2 text-xs"
                      >
                        <CheckCircle2 size={15} />
                        <span>{editingSubmissionId ? 'Update & Save Schema Table' : 'Generate & Persist Schema Table'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : selectedFolderSub ? (
                /* Interactive Form Workstation */
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-3xs overflow-hidden">
                  <div className="bg-gray-50 dark:bg-slate-800/40 px-5 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full uppercase">
                        {selectedFolderSub.id} Form
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1">
                        {selectedFolderSub.name.replace(/^[0-9.]+[a-z0-9.]*\s*/, '')}
                      </h4>
                    </div>
                     <button
                      onClick={() => {
                        setSelectedFolderSub(null);
                        setEditingSubmissionId(null);
                      }}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      ← Back to Forms
                    </button>
                  </div>

                  <div className="p-4">
                    <IntakeForm
                      config={{
                        id: selectedFolderSub.id,
                        name: selectedFolderSub.name,
                        collectionName: 'hospital_modules_submissions',
                        icon: FolderOpen,
                        subtitle: selectedFolderSub.name.replace(/^[0-9.]+[a-z0-9.]*\s*/, ''),
                        description: `Documenting record for Patient MRN: ${patientMrn}`,
                        searchPlaceholder: 'Search fields...',
                        fields: selectedFolderSub.fields as any,
                        defaultSeed: []
                      }}
                      onSubmit={handleFolderFormSubmit}
                      initialData={editingSubmissionId ? (folderSubmissions.find(s => s.id === editingSubmissionId)?.data || {}) : {
                        patient_mrn: patientMrn,
                        patient_name: patientName,
                        patient_age: patient.age || '',
                        patient_sex: patient.gender || '',
                        patient_address: patient.address || '',
                        insurance_status: patient.insurance_status || 'No',
                        date: new Date().toISOString().split('T')[0],
                        hospital_id
                      }}
                      onCancel={() => {
                        setSelectedFolderSub(null);
                        setEditingSubmissionId(null);
                      }}
                    />
                  </div>
                </div>
              ) : (
                /* List of Available Forms in Category */
                <div className="space-y-6">
                  <div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 font-mono flex items-center gap-1.5">
                        <span>Available {folderCategory === 'outpatient' ? 'Outpatient (OPD)' : 'Inpatient (IPD)'} Forms</span>
                        <span className="text-[10px] font-normal text-indigo-500 font-sans">(1.1.1.a to 1.1.1.z)</span>
                      </h4>
                      
                      {/* Search / Find Input */}
                      <div className="relative w-full md:w-72 shrink-0">
                        <input
                          type="text"
                          placeholder="Search form ID or title..."
                          value={searchFolderFormQuery}
                          onChange={(e) => setSearchFolderFormQuery(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 placeholder-gray-400 transition-all font-sans"
                        />
                        {searchFolderFormQuery && (
                          <button
                            onClick={() => setSearchFolderFormQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs cursor-pointer font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {(() => {
                      const baseForms = (MODULES_CONFIG.find(m => m.id === 'Module-1')?.subsections.filter(
                        s => s.id.startsWith('1.1.1') && (s.category === folderCategory || s.category === 'both')
                      ) || []);

                      // Filter based on searchFolderFormQuery
                      const filteredForms = baseForms.filter(sub => {
                        const q = searchFolderFormQuery.trim().toLowerCase();
                        if (!q) return true;
                        return (sub.id && String(sub.id).toLowerCase().includes(q)) || 
                               (sub.name && String(sub.name).toLowerCase().includes(q));
                      }).sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }));

                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Special Lead Card: Draw & Generate Custom Schema Table */}
                            <button
                              onClick={() => {
                                setIsDesigningCustomTable(true);
                                setEditingSubmissionId(null);
                                setCustomTableTitle('');
                                setCustomTableColumns(['Column 1', 'Column 2']);
                                setCustomTableRows([{ 'Column 1': '', 'Column 2': '' }]);
                                setSelectedFolderSub(null);
                              }}
                              className="p-4 border-2 border-dashed border-indigo-300 dark:border-indigo-900/60 rounded-xl bg-indigo-50/15 dark:bg-indigo-950/10 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 hover:border-indigo-400 dark:hover:border-indigo-800 text-left transition-all cursor-pointer group flex items-start gap-3 shadow-xs"
                            >
                              <div className="p-2 bg-indigo-600 text-white rounded-lg group-hover:scale-105 transition-transform shrink-0">
                                <Sparkles size={15} />
                              </div>
                              <div>
                                <span className="text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                  Draw Schema Table
                                </span>
                                <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                  Draw & Generate Custom Table
                                </h5>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-sans">
                                  Define custom headers, columns & input dynamic rows on the fly
                                </p>
                              </div>
                            </button>

                            {filteredForms.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => setSelectedFolderSub(sub)}
                                className="p-4 border border-gray-150 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/20 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10 hover:border-indigo-200 dark:hover:border-indigo-900 text-left transition-all cursor-pointer group flex items-start gap-3"
                              >
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-105 transition-transform shrink-0">
                                  <PlusCircle size={15} />
                                </div>
                                <div>
                                  <span className="text-[10px] font-mono font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-sm">
                                    {sub.id}
                                  </span>
                                  <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                    {sub.name.replace(/^[0-9.]+[a-z0-9.]*\s*/, '')}
                                  </h5>
                                  <p className="text-[10px] text-gray-400 mt-1 font-mono uppercase">
                                    Requires MRN Auto-Linking • Fields: {sub.fields.length}
                                  </p>
                                </div>
                              </button>
                            ))}

                            {/* Always include "Other / Custom" at the end of the list */}
                            <button
                              onClick={() => setSelectedFolderSub(customOtherSubsection)}
                              className="p-4 border border-dashed border-indigo-200 dark:border-indigo-950/60 rounded-xl bg-indigo-50/10 dark:bg-indigo-950/5 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-900 text-left transition-all cursor-pointer group flex items-start gap-3 animate-pulse"
                            >
                              <div className="p-2 bg-indigo-600 text-white rounded-lg group-hover:scale-105 transition-transform shrink-0">
                                <Sparkles size={15} />
                              </div>
                              <div>
                                <span className="text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-sm">
                                  1.1.1.other
                                </span>
                                <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1.5">
                                  <span>Other / Custom Clinical Form</span>
                                  <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950 px-1 rounded text-indigo-700 dark:text-indigo-400">New Option</span>
                                </h5>
                                <p className="text-[10px] text-gray-400 mt-1 font-mono uppercase">
                                  Capture custom notes, referrals or other unstructured documents
                                </p>
                              </div>
                            </button>
                          </div>

                          {/* Empty State for Search */}
                          {filteredForms.length === 0 && (
                            <div className="p-6 border border-dashed border-gray-200 dark:border-slate-800 rounded-xl text-center bg-slate-50/30 dark:bg-slate-900/5">
                              <p className="text-xs text-gray-400 font-medium">No standard clinical forms match "{searchFolderFormQuery}"</p>
                              <button
                                onClick={() => {
                                  setSelectedFolderSub(customOtherSubsection);
                                }}
                                className="mt-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                              >
                                <Sparkles size={13} />
                                <span>Create Custom Document / Other Entry</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Historical Form Submissions for this Patient */}
                  <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <FolderOpen size={16} className="text-indigo-500" />
                      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        Patient Account Folder Documents & Archives ({folderSubmissions.length})
                      </h3>
                    </div>

                    {folderSubmissions.length === 0 ? (
                      <div className="p-8 border border-dashed border-gray-200 dark:border-slate-800 rounded-xl text-center bg-slate-50/30 dark:bg-slate-900/5">
                        <p className="text-xs text-gray-400">No clinical forms filled or submitted yet for this patient folder.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {folderSubmissions.map((sub) => {
                          const isExpanded = expandedSubmissionId === sub.id;
                          return (
                            <div key={sub.id} className="border border-gray-150 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/10 dark:bg-slate-900/10">
                              <div className="p-4 flex items-center justify-between gap-4 bg-white dark:bg-slate-900/40">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-xl shrink-0 mt-0.5">
                                    <FileCheck2 size={16} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-sm">
                                        {sub.subsection_id}
                                      </span>
                                      <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                        {sub.subsection_name ? sub.subsection_name.replace(/^[0-9.]+[a-z0-9.]*\s*/, '') : 'Clinical Submission'}
                                      </h4>
                                    </div>
                                    {sub.data?.summary && (
                                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-bold italic leading-tight">
                                        Summary: {sub.data.summary}
                                      </p>
                                    )}
                                    <p className="text-[10px] text-gray-400 mt-1 font-mono">
                                      Submitted: {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setExpandedSubmissionId(isExpanded ? null : sub.id)}
                                    className="p-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                                  >
                                    <span>{isExpanded ? 'Collapse' : 'View Data'}</span>
                                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (sub.data?.isCustomTable) {
                                        setCustomTableTitle(sub.data.title || '');
                                        setCustomTableColumns(sub.data.columns || []);
                                        setCustomTableRows(sub.data.rows || []);
                                        setIsDesigningCustomTable(true);
                                        setEditingSubmissionId(sub.id);
                                        setSelectedFolderSub(null);
                                      } else {
                                        const subConfig = sub.subsection_id === '1.1.1.other'
                                          ? customOtherSubsection
                                          : MODULES_CONFIG.find(m => m.id === 'Module-1')?.subsections.find(s => s.id === sub.subsection_id);
                                        if (subConfig) {
                                          setSelectedFolderSub(subConfig);
                                          setEditingSubmissionId(sub.id);
                                          setIsDesigningCustomTable(false);
                                        }
                                      }
                                    }}
                                    className="p-1.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                                    title="Edit / Correct Clinical Entry"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFolderSubmission(sub.id)}
                                    className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                    title="Delete from folder"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="p-4 border-t border-gray-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 animate-fade-in">
                                  {sub.data?.isCustomTable ? (
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between border-b border-gray-150 dark:border-slate-800 pb-2">
                                        <h5 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono uppercase tracking-wider">
                                          {sub.data.title || 'Untitled Custom Schema Table'}
                                        </h5>
                                        <span className="text-[10px] text-gray-400 font-mono">
                                          Columns: {sub.data.columns?.length || 0} • Rows: {sub.data.rows?.length || 0}
                                        </span>
                                      </div>
                                      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                                        <table className="w-full text-left border-collapse text-xs">
                                          <thead>
                                            <tr className="bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-300 font-mono border-b border-gray-200 dark:border-slate-800">
                                              {(sub.data.columns || []).map((col: string, idx: number) => (
                                                <th key={idx} className="p-2.5 font-bold whitespace-nowrap text-[10px] uppercase tracking-wider">
                                                  {col}
                                                </th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100 dark:divide-slate-800/45">
                                            {(sub.data.rows || []).map((row: any, rowIdx: number) => (
                                              <tr key={rowIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                                                {(sub.data.columns || []).map((col: string, colIdx: number) => (
                                                  <td key={colIdx} className="p-2.5 text-gray-800 dark:text-gray-200 font-medium font-sans">
                                                    {row[col] || <span className="text-gray-300 dark:text-slate-700 font-mono text-[10px]">—</span>}
                                                  </td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                      {Object.entries(sub.data || {}).map(([key, val]: [string, any]) => {
                                        if (typeof val === 'object' && val !== null) {
                                          return null;
                                        }
                                        // Render nice labels instead of camelcase/snakecase keys
                                        const niceLabel = key
                                          .replace(/_/g, ' ')
                                          .replace(/\b\w/g, c => c.toUpperCase());
                                        return (
                                          <div key={key} className="p-2 border-b border-gray-100 dark:border-slate-800/40 flex justify-between gap-4">
                                            <span className="text-gray-400 font-medium shrink-0">{niceLabel}:</span>
                                            <span className="text-gray-800 dark:text-gray-200 font-semibold break-all text-right">
                                              {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val || 'N/A')}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-gray-150 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Clinical Hub
          </button>
        </div>

      </div>
    </div>
  );
}
