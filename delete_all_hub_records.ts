import { getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase';

async function deleteEverythingInHub() {
  const colName = 'form_1_1_1_2';
  try {
    const colRef = collection(db, colName);
    const snapshot = await getDocs(colRef);
    console.log(`Checking ${colName}: found ${snapshot.size} records to delete.`);
    
    let deletedCount = 0;
    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref);
      deletedCount++;
      console.log(`Deleted record from ${colName}: ${doc.id}`);
    }
    console.log(`Finished ${colName}. Deleted ${deletedCount} records.`);
  } catch (error) {
    console.error(`Error cleaning ${colName}:`, error);
  }
}

deleteEverythingInHub();
