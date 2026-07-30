import { getDocs, collection, query, where, deleteDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase';

async function deleteSpecificJunk() {
  try {
    // Attempting both cases just in case, though usually Firestore is case-sensitive
    const collections = ['Form_1_1_1', 'form_1_1_1'];
    
    for (const colName of collections) {
      console.log(`Checking collection: ${colName}`);
      const q = query(collection(db, colName), where('patient_mrn', '==', '123456'));
      const querySnapshot = await getDocs(q);
      
      console.log(`Found ${querySnapshot.size} records in ${colName} with MRN 123456.`);
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        // Check for specific names too
        if (data.patient_name === 'Zulfadli said' || data.patient_name === 'Unknown Patient') {
            await deleteDoc(doc.ref);
            console.log(`Deleted ${doc.id} with name ${data.patient_name}`);
        }
      }
    }
    console.log('Finished deleting.');
  } catch (error) {
    console.error('Error deleting records:', error);
  }
}
deleteSpecificJunk();
