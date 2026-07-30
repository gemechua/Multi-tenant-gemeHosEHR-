import { getDocs, collection } from 'firebase/firestore';
import { db } from './src/lib/firebase';

async function listRecords() {
    try {
      const colRef = collection(db, 'form_1_1_1_2');
      const snapshot = await getDocs(colRef);
      console.log(`Checking form_1_1_1_2: found ${snapshot.size} records.`);
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`Doc ID: ${doc.id}, Name: ${data.patient_name || data.name}, MRN: ${data.patient_mrn || data.mrn}`);
      });
      
    } catch (error) {
      console.error(`Error checking form_1_1_1_2:`, error);
    }
}
listRecords();
