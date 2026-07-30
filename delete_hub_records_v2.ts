import { getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase';

async function deleteHubRecords() {
  const colName = 'form_1_1_1_2';
  try {
    const colRef = collection(db, colName);
    const snapshot = await getDocs(colRef);
    console.log(`Checking ${colName}: found ${snapshot.size} records.`);
    
    let deletedCount = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const name = data.patient_name || data.name || data.full_name;
      const mrn = data.patient_mrn || data.mrn;
      
      if (name === 'Zulfadli said' || mrn === '123456') {
        await deleteDoc(doc.ref);
        deletedCount++;
        console.log(`Deleted record from ${colName}: ${doc.id} (Name: ${name}, MRN: ${mrn})`);
      }
    }
    console.log(`Finished ${colName}. Deleted ${deletedCount} records.`);
  } catch (error) {
    console.error(`Error cleaning ${colName}:`, error);
  }
}

deleteHubRecords();
