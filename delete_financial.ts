import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase';

async function run() {
  const snapshot = await getDocs(collection(db, 'financial_ledger'));
  console.log(`Found ${snapshot.size} records.`);
  
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
  }
  
  console.log("Deleted all financial_ledger records.");
  process.exit(0);
}
run();
