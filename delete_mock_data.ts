import { getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase';
import { isFakeOrFalseRow } from './src/utils/dataIntegrity';

async function deleteMockData() {
  const collectionsToClean = [
    'patients', 
    'Form_1_1_1', 
    'Form_1_1_1_Q', 
    'Form_1_1_1_1', 
    'Form_1_1_1_F', 
    'Form_1_1_1_H', 
    'Form_1_1_1_M'
  ];

  for (const colName of collectionsToClean) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      console.log(`Checking ${colName}: found ${snapshot.size} records.`);
      
      let deletedCount = 0;
      for (const doc of snapshot.docs) {
        if (isFakeOrFalseRow(doc.data())) {
          await deleteDoc(doc.ref);
          deletedCount++;
          console.log(`Deleted fake record from ${colName}: ${doc.id}`);
        }
      }
      console.log(`Finished checking ${colName}. Deleted ${deletedCount} fake records.`);
    } catch (error) {
      console.error(`Error checking collection ${colName}:`, error);
    }
  }
}

deleteMockData();
