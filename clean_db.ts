import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase';

const collections = [
  'financial_ledger',
  'patients',
  'clinical_encounters',
  'laboratory_orders',
  'radiology_orders',
  'prescriptions',
  'inventory',
  'admissions',
  'appointments',
  'users'
];

async function run() {
  for (const col of collections) {
    const snapshot = await getDocs(collection(db, col));
    console.log(`Found ${snapshot.size} in ${col}`);
    for (const doc of snapshot.docs) {
      if (col === 'users') {
          // keep gemechuahmed0@gmail.com ?
          if (doc.data().email === 'gemechuahmed0@gmail.com') {
              console.log("Keeping admin user.");
              continue;
          }
      }
      await deleteDoc(doc.ref);
    }
  }
  process.exit(0);
}
run();
