import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { ENTITIES_CONFIG } from '../data/schema';
import { queueForSync } from './offlineSync';

export interface SubmissionPayload {
  hospital_id: string;
  moduleId: string;
  subsectionId: string;
  subsectionName: string;
  data: Record<string, any>;
  submittedAt: string;
}

export interface UniversalFolderPayload {
  hospital_id: string;
  patientMrn: string;
  patientName: string;
  department: string;
  activityType: string;
  notes: string;
  status: string;
  submittedAt: string;
  additionalData?: Record<string, any>;
}

import { logSecurityEvent } from './auditLogger';

export async function submitToUniversalClinicalFolder(payload: UniversalFolderPayload) {
  try {
    const batch = writeBatch(db);
    const folderRef = doc(collection(db, 'universal_clinical_folder'));
    batch.set(folderRef, {
      hospital_id: payload.hospital_id,
      patient_mrn: payload.patientMrn,
      patient_name: payload.patientName,
      department: payload.department,
      activity_type: payload.activityType,
      notes: payload.notes,
      status: payload.status,
      created_at: payload.submittedAt,
      ...payload.additionalData
    });
    await batch.commit();

    // Log the data mutation
    await logSecurityEvent(
      'UNIVERSAL_FOLDER_MUTATION', 
      'universal_clinical_folder', 
      `Patient: ${payload.patientMrn}, Dept: ${payload.department}, Type: ${payload.activityType}`
    );

    return { success: true };
  } catch (err) {
    console.error('Failed to submit to universal folder:', err);
    // Queue for sync offline fallback
    queueForSync({
      hospital_id: payload.hospital_id,
      moduleId: 'Universal',
      subsectionId: payload.department,
      subsectionName: payload.activityType,
      submittedAt: payload.submittedAt,
      data: {
        patient_mrn: payload.patientMrn,
        patient_name: payload.patientName,
        notes: payload.notes,
        status: payload.status,
        ...payload.additionalData
      }
    });
    return { success: false, queued: true, error: err };
  }
}

export async function submitClinicalSubmission(payload: SubmissionPayload) {
  try {
    const batch = writeBatch(db);

    // 1. Save to submissions collection
    const submissionRef = doc(collection(db, 'hospital_modules_submissions'));
    batch.set(submissionRef, {
      hospital_id: payload.hospital_id,
      module_id: payload.moduleId,
      subsection_id: payload.subsectionId,
      subsection_name: payload.subsectionName,
      submitted_at: payload.submittedAt,
      data: payload.data
    });

    // 2. Save to EHR Schema table automatically
    const schemaKey = 'Form_' + payload.subsectionId.replace(/\./g, '_');
    if (ENTITIES_CONFIG[schemaKey]) {
      const schema = ENTITIES_CONFIG[schemaKey];
      const schemaRef = doc(collection(db, schema.collectionName));
      batch.set(schemaRef, {
        ...payload.data,
        hospital_id: payload.hospital_id,
        created_at: payload.submittedAt
      });
    }

    // 3. Handle patients registering/payment folder updates
    if (['1.1.1', '1.1.1.0', '1.1.1.1'].includes(payload.subsectionId)) {
      const patientsCollRef = collection(db, 'patients');
      const mrn = (payload.data.patient_mrn || payload.data.patient_id || '').trim();
      if (mrn) {
        const patientRef = doc(patientsCollRef);
        batch.set(patientRef, {
          hospital_id: payload.hospital_id,
          mrn: mrn,
          full_name: payload.data.patient_name || payload.data.full_name || 'Unknown Patient',
          name: payload.data.patient_name || payload.data.full_name || 'Unknown Patient',
          created_at: payload.submittedAt,
          dob: payload.data.dob || '',
          phone: payload.data.phone || '',
          address: payload.data.address || '',
          status: payload.subsectionId === '1.1.1.1' ? 'verified' : (payload.subsectionId === '1.1.1.0' ? 'payment_requested' : 'registered')
        });
      }
    }

    // 4. Automatic Financial Ledger Posting for Payment Requests
    const paymentFields = ['amount', 'lab_bill_amount', 'radiology_bill_amount', 'payment_amount'];
    const hasPayment = paymentFields.some(field => payload.data[field] !== undefined);
    
    if (hasPayment) {
      const amount = paymentFields.reduce((acc, field) => acc + (Number(payload.data[field]) || 0), 0);
      if (amount > 0) {
        const mrn = payload.data.patient_mrn || payload.data.patient_id || 'UNKNOWN';
        const patientName = payload.data.patient_name || 'Unknown Patient';

        const ledgerRef = doc(collection(db, 'financial_ledger'));
        batch.set(ledgerRef, {
          hospital_id: payload.hospital_id,
          patient_mrn: mrn,
          patient_name: patientName,
          date: payload.submittedAt,
          tx_id: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          amount: Number(amount),
          category: 'revenue',
          status: 'pending'
        });
      }
    }

    await batch.commit();

    // Log the data mutation
    await logSecurityEvent(
      'CLINICAL_DATA_MUTATION', 
      payload.subsectionId, 
      `Module: ${payload.moduleId}, Subsection: ${payload.subsectionName}`
    );

    return { success: true };

  } catch (err) {
    console.error('Batch submission failed, queueing for offline sync:', err);
    
    // Fallback to offline queue
    queueForSync({
      hospital_id: payload.hospital_id,
      moduleId: payload.moduleId,
      subsectionId: payload.subsectionId,
      subsectionName: payload.subsectionName,
      submittedAt: payload.submittedAt,
      data: payload.data
    });
    
    return { success: false, queued: true, error: err };
  }
}
