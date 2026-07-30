import { getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase';
import { PATIENT_MODULE_ENTITIES } from './src/data/ehr_schema/module1';

async function cleanup() {
  const collections = Object.values(PATIENT_MODULE_ENTITIES).map(e => e.collectionName);
  
  for (const colName of collections) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const mrn = data.patient_mrn || data.mrn || data.Patient_MRN || data.patient_MRN;
        const name = data.patient_name || data.name || data.first_last_name || data.full_name;
        
        if (mrn === '123456' || name === 'Zulfadli said' || name === 'Unknown Patient') {
          console.log(`Found Zulfadli record in ${colName}: ${doc.id} (MRN: ${mrn}, Name: ${name})`);
          await deleteDoc(doc.ref);
          console.log(`Deleted from ${colName}: ${doc.id}`);
        }
      }
    } catch (error) {
      // console.error(`Error checking ${colName}:`, error);
    }
  }
}

cleanup();
