import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../src/lib/firebase';

/**
 * EHRS cleanup script
 * To be used in the browser console OR as a helper function.
 * This script will:
 * 1. Delete specific staff members requested.
 * 2. Delete specific payment records requested.
 * 3. Clear all patients/admissions if requested.
 */

export async function cleanupRecords() {
  console.log('Starting cleanup...');

  // 1. Delete "WAREE NURE" staff record
  const hrStaffRef = collection(db, 'hr_staff_registry');
  const staffQuery = query(hrStaffRef, where('full_name', '==', 'WAREE NURE'));
  const staffSnap = await getDocs(staffQuery);
  for (const docSnap of staffSnap.docs) {
    await deleteDoc(doc(db, 'hr_staff_registry', docSnap.id));
    console.log(`Deleted staff: WAREE NURE (${docSnap.id})`);
  }

  // 2. Delete specific payment records
  const targetPatients = [
    'AHMED ABDI', 
    'GEMECHU AHMED', 
    'ADAM ARABE', 
    'ADEM ARABE', 
    'monetumar22', 
    'Mirga jani'
  ];
  
  const ledgerRef = collection(db, 'financial_ledger');
  for (const name of targetPatients) {
    const q = query(ledgerRef, where('patient_name', '==', name));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(doc(db, 'financial_ledger', d.id));
      console.log(`Deleted payment record for: ${name} (${d.id})`);
    }
  }

  // 3. Clear all patients and admissions to reset stats to 0
  const collectionsToClear = ['patients', 'admissions', 'finance_records'];
  for (const colName of collectionsToClear) {
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    for (const d of snap.docs) {
      await deleteDoc(doc(db, colName, d.id));
    }
    console.log(`Cleared collection: ${colName}`);
  }

  console.log('Cleanup complete. All requested records removed and stats reset.');
}
