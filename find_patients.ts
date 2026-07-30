import { getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase';

async function listCollections() {
  // We can't list collections directly in Firebase JS SDK in client-side, 
  // but we can try to query all collections I know about from the schemas.
  
  const potentialCollections = [
    'patients', 'form_1_1_1', 'Form_1_1_1', 'Form_1_1_1_Q', 'Form_1_1_1_1', 'Form_1_1_1_F', 'Form_1_1_1_H', 'Form_1_1_1_M'
  ];
  
  for (const colName of potentialCollections) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      console.log(`Checking ${colName}: found ${snapshot.size} records.`);
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.patient_mrn === '123456' || data.mrn === '123456') {
          console.log(`FOUND MRN 123456 in ${colName}: ${doc.id}, Name: ${data.patient_name || data.name}`);
          // DO NOT DELETE YET, JUST FINDING
        }
      }
    } catch (error) {
      // console.error(`Error checking ${colName}:`, error);
    }
  }
}
listCollections();
