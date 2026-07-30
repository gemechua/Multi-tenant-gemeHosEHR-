import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';

interface OnboardingStep {
  name: string;
  completed: boolean;
}

export default function HROnboardingTimeline({ staffId }: { staffId: string }) {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  
  useEffect(() => {
    const fetchSteps = async () => {
      const docRef = doc(db, 'staff_onboarding', staffId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSteps(docSnap.data().steps);
      }
    };
    fetchSteps();
  }, [staffId]);

  const toggleStep = async (index: number) => {
    const newSteps = [...steps];
    newSteps[index].completed = !newSteps[index].completed;
    setSteps(newSteps);
    await updateDoc(doc(db, 'staff_onboarding', staffId), { steps: newSteps });
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200">
      <h3 className="font-black text-slate-800 mb-6">Onboarding Timeline</h3>
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3 mb-4">
          <input 
            type="checkbox" 
            checked={step.completed} 
            onChange={() => toggleStep(i)}
            className="w-5 h-5 accent-indigo-600" 
          />
          <span className={`text-sm ${step.completed ? 'line-through text-slate-400' : 'font-bold text-slate-700'}`}>
            {step.name}
          </span>
        </div>
      ))}
    </div>
  );
}
