import { getDocs, collection, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ENTITIES_CONFIG } from '../data/schema';
import { PATIENT_MODULE_ENTITIES } from '../data/ehr_schema/module1';

export const clearMockData = async (hospitalId: string) => {
  const allCollections = new Set([
    ...Object.values(ENTITIES_CONFIG).map(e => e.collectionName),
    ...Object.values(PATIENT_MODULE_ENTITIES).map(e => e.collectionName)
  ]);

  let totalDeleted = 0;

  for (const colName of Array.from(allCollections)) {
    try {
      const colRef = collection(db, colName);
      const q = query(colRef, where('hospital_id', '==', hospitalId));
      const snapshot = await getDocs(q);

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const mrn = data.patient_mrn || data.mrn || data.Patient_MRN || data.patient_MRN;
        const name = data.patient_name || data.name || data.full_name;

        // Mock criteria
        if (mrn === '123456' || name === 'Unknown Patient' || name === 'Zulfadli said') {
          await deleteDoc(doc.ref);
          totalDeleted++;
        }
      }
    } catch (e) {
      console.error(`Error clearing ${colName}:`, e);
    }
  }
  return totalDeleted;
};
