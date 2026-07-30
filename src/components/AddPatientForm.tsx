import { useState, FormEvent } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorUtils';
import { patientSchema } from '../lib/schemas';
import { AlertCircle, Check } from 'lucide-react';

export default function AddPatientForm() {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [mrn, setMrn] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const parsedAge = Number(age);

      // Zod Front-end validation
      const validationResult = patientSchema.safeParse({
        name: name.trim(),
        dob,
        gender,
        mrn: mrn.trim(),
        age: isNaN(parsedAge) ? age : parsedAge,
        address: address.trim(),
        phone: phone.trim()
      });

      if (!validationResult.success) {
        const errorMsg = validationResult.error.issues.map(err => err.message).join(' ');
        setErrorMessage(errorMsg);
        setIsSubmitting(false);
        return;
      }



      const activeHospitalStr = localStorage.getItem('active_hospital_tenant');
      const activeHospital = activeHospitalStr ? JSON.parse(activeHospitalStr) : null;
      const hospital_id = activeHospital?.hospital_unique_number || 'demo-global';

      await addDoc(collection(db, 'patients'), {
        name: name.trim(),
        dob,
        gender,
        mrn: mrn.trim(),
        age: parsedAge,
        address: address.trim(),
        phone: phone.trim(),
        hospital_id: hospital_id
      });

      setName('');
      setDob('');
      setMrn('');
      setAge('');
      setAddress('');
      setPhone('');
      setSuccessMessage('Patient successfully registered into EHR database!');
    } catch (error) {
      console.error('Error adding patient:', error);
      try {
        handleFirestoreError(error, OperationType.CREATE, 'patients');
      } catch (firestoreErr: any) {
        setErrorMessage(firestoreErr.message || 'Failed to add patient to database.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Add New Patient</h2>
        <p className="text-xs text-gray-400 mt-0.5">Register a new patient into the active clinical session</p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-semibold">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
          <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-bold">{successMessage}</div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Patient Full Name*</label>
          <input
            type="text"
            placeholder="e.g. GEMECHU AHMED"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-shadow bg-white"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Date of Birth*</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-shadow bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Gender*</label>
            <select 
              value={gender} 
              onChange={(e) => setGender(e.target.value)} 
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-shadow bg-white cursor-pointer"
            >
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">MRN*</label>
            <input
              type="text"
              placeholder="e.g. MRN-2026-9912"
              value={mrn}
              onChange={(e) => setMrn(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-shadow bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Age*</label>
            <input
              type="number"
              placeholder="e.g. 30"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-shadow bg-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Home Address*</label>
          <input
            type="text"
            placeholder="e.g. Addis Ababa"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-shadow bg-white"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Phone Number*</label>
          <input
            type="tel"
            placeholder="e.g. +251911234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-shadow bg-white font-mono"
            required
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full py-2.5 bg-gray-950 text-white rounded-xl text-sm font-bold hover:bg-gray-850 transition-colors cursor-pointer disabled:opacity-50"
      >
        {isSubmitting ? 'Registering Patient...' : 'Register Patient'}
      </button>
    </form>
  );
}
