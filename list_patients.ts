import { getDocs, collection } from 'firebase/firestore';
import { db } from './src/lib/firebase';
import { PATIENT_MODULE_ENTITIES } from './src/data/ehr_schema/module1';

async function listRecords() {
    try {
      const collectionNames = Object.values(PATIENT_MODULE_ENTITIES).map(e => e.collectionName);
      console.log(`Checking ${collectionNames.length} collections...`);
      
      for (const colName of collectionNames) {
        try {
            const colRef = collection(db, colName);
            const snapshot = await getDocs(colRef);
            
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.patient_mrn === '123456' || data.mrn === '123456' || data.patient_name === 'Zulfadli said' || data.name === 'Zulfadli said' || data.patient_name === 'Unknown Patient' || data.name === 'Unknown Patient') {
                    console.log(`FOUND Doc ID: ${doc.id} in collection ${colName}, MRN: ${data.patient_mrn || data.mrn}, Name: ${data.patient_name || data.name}`);
                }
            });
        } catch (e) {
            // skip errors
        }
      }
      
    } catch (error) {
      console.error(`Error:`, error);
    }
}
listRecords();
