import { collection, query, where, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Patient {
    id: string;
    full_name: string;
    mrn: string;
    date_of_birth: string;
    gender: string;
    phone: string;
    [key: string]: any;
}

export const subscribeToPatientData = (
    patientMrn: string,
    onPatientUpdate: (patient: Patient | null) => void,
    onMedicationsUpdate: (meds: DocumentData[]) => void,
    onEncountersUpdate: (encs: DocumentData[]) => void,
    onLabResultsUpdate: (labs: DocumentData[]) => void
) => {
    if (!patientMrn) {
        onPatientUpdate(null);
        onMedicationsUpdate([]);
        onEncountersUpdate([]);
        onLabResultsUpdate([]);
        return () => {};
    }
    // Patient demographics
    const pQuery = query(collection(db, 'patients'), where('mrn', '==', patientMrn));
    const unsubP = onSnapshot(pQuery, (snap) => {
        if (!snap.empty) {
            onPatientUpdate({ id: snap.docs[0].id, ...snap.docs[0].data() } as Patient);
        } else {
            onPatientUpdate(null);
        }
    });

    // Medications
    const mQuery = query(collection(db, 'prescriptions'), where('patient_mrn', '==', patientMrn));
    const unsubM = onSnapshot(mQuery, (snap) => {
        onMedicationsUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Clinical history
    const eQuery = query(collection(db, 'clinical_encounters'), where('patient_mrn', '==', patientMrn));
    const unsubE = onSnapshot(eQuery, (snap) => {
        onEncountersUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Lab results
    const lQuery = query(collection(db, 'lab_results'), where('patient_mrn', '==', patientMrn));
    const unsubL = onSnapshot(lQuery, (snap) => {
        onLabResultsUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubP(); unsubM(); unsubE(); unsubL(); };
};
