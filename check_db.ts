import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase';

async function run() {
  const patientSnapshot = await getDocs(collection(db, 'patients'));
  console.log(`Found ${patientSnapshot.size} patients.`);
  
  const clinicalSnapshot = await getDocs(collection(db, 'clinical_encounters'));
  console.log(`Found ${clinicalSnapshot.size} clinical_encounters.`);

  for (const doc of patientSnapshot.docs) {
    await deleteDoc(doc.ref);
  }
  for (const doc of clinicalSnapshot.docs) {
    await deleteDoc(doc.ref);
  }
  
  process.exit(0);
}
run();
