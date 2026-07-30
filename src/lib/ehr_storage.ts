import { db } from './firebase';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  query, where, getDocs 
} from 'firebase/firestore';

export const saveEHRRecord = async (
  collectionName: string,
  recordPayload: any,
  hubActiveFormId: string,
  config: any,
  hospital_id: string
) => {
  const mainDocRef = await addDoc(collection(db, collectionName), {
    ...recordPayload,
    created_at: new Date().toISOString()
  });

  if (hubActiveFormId.startsWith('Form_1_1_1') && hubActiveFormId !== 'Form_1_1_1_2') {
    const uniqueFormId = `MS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await addDoc(collection(db, 'medical_services'), {
      ...recordPayload,
      unique_form_id: uniqueFormId,
      schema_type: hubActiveFormId,
      schema_name: config.name,
      original_doc_id: mainDocRef.id,
      created_at: new Date().toISOString()
    });
  }

  await addDoc(collection(db, 'hospital_modules_submissions'), {
    hospital_id: hospital_id,
    module_id: 'Module-1',
    subsection_id: hubActiveFormId.replace('Form_', '').replace(/_/g, '.'),
    subsection_name: config.name,
    submitted_at: new Date().toISOString(),
    data: recordPayload
  });

  return mainDocRef.id;
};

export const updateEHRRecord = async (collectionName: string, id: string, recordPayload: any) => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, { ...recordPayload });
};

export const deleteEHRRecord = async (collectionName: string, id: string) => {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
  
  // Clean up medical_services copy
  const q = query(collection(db, 'medical_services'), where('original_doc_id', '==', id));
  const snap = await getDocs(q);
  for (const doc of snap.docs) {
    await deleteDoc(doc.ref);
  }
};

export const updateFolderNotes = async (folderId: string, notes: string) => {
  const docRef = doc(db, 'form_1_1_1_2', folderId);
  await updateDoc(docRef, { clinical_notes: notes });
};
