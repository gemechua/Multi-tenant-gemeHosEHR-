import { getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase';

async function deleteJunk() {
  const collectionsToClean = [
    'form_1_1_1_w',
    'form_1_1_1_x',
    'form_1_1_1_y',
    'patient_or_procedure_payments',
    'cashier_or_procedure_payment_verifications',
    'form_1_1_1_z_2',
    'form_1_1_1_z_3',
    'patient_liaison_discharge_payments',
    'form_1_1_1_z_a_b',
    'form_1_1_1_z_a_c'
  ];

  for (const colName of collectionsToClean) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      console.log(`Checking ${colName}: found ${snapshot.size} records.`);
      
      let deletedCount = 0;
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.patient_mrn === '123456' || data.mrn === '123456' || data.patient_name === 'Zulfadli said' || data.name === 'Zulfadli said' || data.patient_name === 'Unknown Patient' || data.name === 'Unknown Patient') {
          await deleteDoc(doc.ref);
          deletedCount++;
          console.log(`Deleted record from ${colName}: ${doc.id}`);
        }
      }
      console.log(`Finished checking ${colName}. Deleted ${deletedCount} records.`);
    } catch (error) {
      console.error(`Error checking collection ${colName}:`, error);
    }
  }
}

deleteJunk();
