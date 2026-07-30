import React, { useState } from 'react';
import { X } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logSecurityEvent } from '../lib/auditLogger';

interface PlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'yearly' | 'monthly' | 'weekly' | 'daily';
  onSave: () => void;
}

export default function PlanningModal({ isOpen, onClose, type, onSave }: PlanningModalProps) {
  const [activity, setActivity] = useState('');
  const [target, setTarget] = useState(0);
  const [dueDate, setDueDate] = useState('');

  if (!isOpen) return null;

  const savePlan = async () => {
    try {
      await addDoc(collection(db, 'planning_records'), {
        type,
        activity,
        target,
        due_date: dueDate,
        achieved: 0,
        created_at: serverTimestamp(),
      });
      await logSecurityEvent('CREATE_PLANNING_RECORD', 'planning_records', `Type: ${type}, Activity: ${activity}`);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-md">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-bold">New {type} Action Plan</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <input
          type="text"
          placeholder="Activity"
          className="w-full mb-4 p-2 border rounded"
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
        />
        <input
          type="number"
          placeholder="Target"
          className="w-full mb-4 p-2 border rounded"
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
        />
        <input
          type="date"
          className="w-full mb-4 p-2 border rounded"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button onClick={savePlan} className="w-full bg-indigo-600 text-white p-2 rounded">Save</button>
      </div>
    </div>
  );
}
