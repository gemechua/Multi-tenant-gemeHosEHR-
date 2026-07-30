import { getDocs, collection } from 'firebase/firestore';
import { db } from './src/lib/firebase';

async function inspectHub() {
  const colName = 'form_1_1_1_2';
  try {
    const colRef = collection(db, colName);
    const snapshot = await getDocs(colRef);
    console.log(`Checking ${colName}: found ${snapshot.size} records.`);
    
    snapshot.docs.forEach(doc => {
      console.log(`Doc ID: ${doc.id}, Data: ${JSON.stringify(doc.data())}`);
    });
  } catch (error) {
    console.error(`Error inspecting ${colName}:`, error);
  }
}

inspectHub();
