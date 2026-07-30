import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

export async function logSecurityEvent(action: string, path: string, details: string = '') {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, 'security_logs'), {
      userId: user?.uid || 'anonymous',
      userEmail: user?.email || 'anonymous',
      action,
      path,
      details,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
    });
  } catch (error) {
    console.error('Audit Log Failure:', error);
  }
}
