import { getDocs, collection, query, where, deleteDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase';

async function deleteJunk() {
  try {
    const q = query(collection(db, 'form_1_1_1'), where('patient_mrn', '==', '123456'));
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} records in form_1_1_1.`);
    for (const doc of querySnapshot.docs) {
      await deleteDoc(doc.ref);
      console.log(`Deleted ${doc.id}`);
    }
    console.log('Finished deleting.');
  } catch (error) {
    console.error('Error deleting records:', error);
  }
}
deleteJunk();
