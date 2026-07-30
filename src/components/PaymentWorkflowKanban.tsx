import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

type Status = 'Pending Review' | 'In Processing' | 'Verified Paid';

interface PaymentTask {
  id: string;
  description: string;
  status: Status;
  category: 'Patient' | 'Staff';
}

const statusColors = {
  'Pending Review': 'bg-amber-100 text-amber-800',
  'In Processing': 'bg-blue-100 text-blue-800',
  'Verified Paid': 'bg-emerald-100 text-emerald-800',
};

export default function PaymentWorkflowKanban({ selectedLanguages }: { selectedLanguages: string[] }) {
  const [tasks, setTasks] = useState<PaymentTask[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'payments'), (snapshot) => {
      const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentTask));
      setTasks(p);
    }, (error) => {
      console.error('Error fetching payments:', error);
    });

    return () => unsub();
  }, []);

  const columns: Status[] = ['Pending Review', 'In Processing', 'Verified Paid'];

  const moveTask = async (taskId: string, newStatus: Status) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    // Update in Firestore
    try {
      const taskRef = doc(db, 'payments', taskId);
      await updateDoc(taskRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {columns.map(col => (
        <div key={col} className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg">
          <h4 className="text-xs font-bold text-slate-500 mb-4">{col}</h4>
          <div className="space-y-2">
            {tasks.filter(t => t.status === col).map(t => (
              <div key={t.id} className="bg-white dark:bg-slate-800 p-3 rounded shadow-sm text-xs space-y-2">
                <div className="flex justify-between items-center">
                    <div>
                        <span className="font-bold block">{t.description}</span>
                        <span className="text-[10px] text-slate-500">{t.category}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${statusColors[t.status] || 'bg-gray-100'}`}>{t.status}</span>
                </div>
                <div className="flex gap-1">
                  {columns.filter(c => c !== col).map(c => (
                    <button key={c} onClick={() => moveTask(t.id, c)} className="text-[10px] text-indigo-600 underline">
                      Move to {c.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
