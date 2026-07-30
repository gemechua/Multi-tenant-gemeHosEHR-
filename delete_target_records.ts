import { getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase';

async function deleteTargetRecords() {
  const collectionsToClean = [
    'cashier_admitted_patient_prescription_verifications',
    'form_1_1_1_u',
    'form_1_1_1_u_1',
    'form_1_1_1_v',
    'patient_inpatient_laboratory_payments',
    'form_1_1_1_v_2',
    'cashier_inpatient_laboratory_payment_verifications',
    'form_1_1_1_v_4',
    'form_1_1_1_v_5',
    'patient_inpatient_radiology_payments',
    'cashier_inpatient_radiology_payment_verifications',
    'form_1_1_1_v_8'
  ];

  for (const colName of collectionsToClean) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      console.log(`Checking ${colName}: found ${snapshot.size} records.`);
      
      let deletedCount = 0;
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const name = data.patient_name || data.name || data.full_name;
        if (name === 'Zulfadli said' || name === 'Unknown Patient') {
          await deleteDoc(doc.ref);
          deletedCount++;
          console.log(`Deleted record from ${colName}: ${doc.id} (Name: ${name})`);
        }
      }
      console.log(`Finished ${colName}. Deleted ${deletedCount} records.`);
    } catch (error) {
      console.error(`Error cleaning ${colName}:`, error);
    }
  }
}

deleteTargetRecords();
