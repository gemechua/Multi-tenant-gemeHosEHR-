import { getDocs, collection } from 'firebase/firestore';
import { db } from './src/lib/firebase';
import { ENTITIES_CONFIG } from './src/data/schema';
import { PATIENT_MODULE_ENTITIES } from './src/data/ehr_schema/module1';

async function searchZulfadli() {
  // Combine all known collections
  const allCollections = new Set([
    ...Object.values(ENTITIES_CONFIG).map(e => e.collectionName),
    ...Object.values(PATIENT_MODULE_ENTITIES).map(e => e.collectionName)
  ]);
  
  console.log(`Checking ${allCollections.size} unique collections...`);
  
  for (const colName of Array.from(allCollections)) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const strData = JSON.stringify(data);
        if (strData.includes('Zulfadli') || data.patient_mrn === '123456' || data.mrn === '123456') {
          console.log(`FOUND in ${colName}: DocID=${doc.id}, Name=${data.patient_name || data.name || data.full_name}, MRN=${data.patient_mrn || data.mrn}`);
        }
      });
    } catch (e) {
      // Ignore errors for collections
    }
  }
}

searchZulfadli();
