import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  FileText,
  Image as ImageIcon,
  Mic
} from 'lucide-react';
import { EntityConfig } from '../data/schema';

interface IntakeFormProps {
  config: EntityConfig;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  onCancel?: () => void;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({ 
  config, 
  onSubmit, 
  initialData = {}, 
  onCancel 
}) => {
  const [formData, setFormData] = useState(initialData);

  // Sync formData with initialData when it changes
  React.useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async (fieldKey: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          handleInputChange(fieldKey, base64);
          setAudioUrl(URL.createObjectURL(audioBlob));
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Microphone access denied or not supported.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribe = async (fieldKey: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      setIsTranscribing(fieldKey);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          try {
            const response = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioData: base64 }),
            });
            const data = await response.json();
            if (data.text) {
              const currentVal = formData[fieldKey] || '';
              handleInputChange(fieldKey, currentVal + (currentVal ? ' ' : '') + data.text);
            }
          } catch (err) {
            console.error('Transcription failed:', err);
            setError('Transcription failed. Please try again.');
          } finally {
            setIsTranscribing(null);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      
      // Auto-stop after 10 seconds or user click
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 10000);

    } catch (err) {
      setError('Microphone access denied.');
      setIsTranscribing(null);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev, [key]: value };
      
      // Auto-fill logic for ICD-10 codes in Module 1.1.1.e and 1.1.1.q
      if (key === 'diagnosis_notes' || key === 'admission_diagnosis') {
        const mapping: Record<string, string> = {
          'Malaria': 'B54',
          'Pneumonia': 'J18.9',
          'Typhoid Fever': 'A01.0',
          'Acute Diarrhea': 'A09.9',
          'Hypertension': 'I10',
          'Diabetes Mellitus': 'E11.9',
          'UTI': 'N39.0',
          'URTI': 'J06.9'
        };
        const targetKey = key === 'diagnosis_notes' ? 'icd10_code' : 'admission_icd10';
        
        if (mapping[value]) {
          newData[targetKey] = mapping[value];
        } else if (value === 'Other' || value === 'Other write' || value === 'Other specifics' || value === 'Other specific' || value === 'other specific') {
          newData[targetKey] = '';
        }
      }
      
      return newData;
    });
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        // If there's a field for image path or similar, we can update it
        // Or we might handle the file separately on submit
        handleInputChange('documentImage', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      // Auto-generate Date/Time if missing
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const dateTimeStr = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
      
      const enrichedData = { ...formData };
      
      config.fields.forEach(field => {
        if (!enrichedData[field.key]) {
          if (field.type === 'date') {
            enrichedData[field.key] = dateStr;
          } else if (field.type === 'date-time' || field.key.includes('time') || field.key.includes('date')) {
            // Priority list for auto-filling specific common keys
            const autoFillKeys = ['registration_date', 'date', 'time', 'administered_time', 'collection_date', 'result_date'];
            if (autoFillKeys.includes(field.key) || field.type === 'date-time') {
              enrichedData[field.key] = field.type === 'date-time' ? dateTimeStr : (field.key.includes('time') ? timeStr : dateStr);
            }
          }
        }
      });

      // Basic validation for required fields
      const missingFields = config.fields
        .filter(f => f.required && !enrichedData[f.key])
        .map(f => f.label);

      if (missingFields.length > 0) {
        throw new Error(`Please fill in required fields: ${missingFields.join(', ')}`);
      }

      await onSubmit({
        ...enrichedData,
        timestamp: new Date().toISOString(),
        status: enrichedData.status || 'submitted', // Default status tracking
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.key] || '';
    
    // Logic for Read-Only / Auto-filled fields
    const isReadOnly = (
      (field.key === 'patient_mrn' || field.key === 'patient_name' || field.key === 'mrn' || field.key === 'name') && 
      initialData[field.key]
    );

    // Hide system fields from user input but keep in payload
    if (field.key === 'tenant_id') {
      return null;
    }

    // Special handler for Prescribed Drugs - Name of Medication to support multi-row input with "Add Row" button
    if (field.key === 'prescribed_drugs') {
      const rawVal = formData[field.key] || '';
      let rows: string[] = [];
      if (Array.isArray(formData.prescribed_drugs_rows)) {
        rows = formData.prescribed_drugs_rows;
      } else if (typeof rawVal === 'string' && rawVal.trim()) {
        rows = rawVal.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (rows.length === 0) {
        rows = [''];
      }

      const updateRows = (newRows: string[]) => {
        const joined = newRows.filter(r => r.trim()).join(', ');
        setFormData((prev: any) => ({
          ...prev,
          prescribed_drugs_rows: newRows,
          [field.key]: joined || newRows[0] || ''
        }));
      };

      const handleRowChange = (index: number, val: string) => {
        const next = [...rows];
        next[index] = val;
        updateRows(next);
      };

      const addRow = () => {
        updateRows([...rows, '']);
      };

      const removeRow = (index: number) => {
        if (rows.length <= 1) {
          updateRows(['']);
          return;
        }
        const next = rows.filter((_, i) => i !== index);
        updateRows(next);
      };

      return (
        <div key={field.key} className="space-y-2 col-span-full">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>{field.label} {field.required && <span className="text-red-500">*</span>}</span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              {rows.filter(r => r.trim()).length} Medication{rows.filter(r => r.trim()).length === 1 ? '' : 's'}
            </span>
          </label>

          <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            {rows.map((rowVal, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={rowVal}
                    onChange={(e) => handleRowChange(idx, e.target.value)}
                    placeholder={idx === 0 ? (field.placeholder || "Enter name of medication") : `Enter name of medication #${idx + 1}...`}
                    required={field.required && idx === 0}
                    readOnly={isReadOnly}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                    title="Remove Medication Row"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addRow}
              className="w-full mt-2 py-2 px-3 border border-dashed border-indigo-300 dark:border-indigo-700/60 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs"
            >
              <span className="text-base font-extrabold leading-none">+</span>
              <span>Add Prescribed Drugs - Name of Medication Row</span>
            </button>
          </div>
        </div>
      );
    }

    switch (field.type) {
      case 'camera':
      case 'file': {
        const fileVal = formData[field.key];
        const isNoPaper = fileVal === 'No referral paper' || fileVal === 'No paper / report';

        return (
          <div key={field.key} className="space-y-2 col-span-full">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{field.label} {field.required && <span className="text-red-500">*</span>}</span>
            </label>
            
            <div className="w-full border border-slate-300 dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-900 space-y-3.5 shadow-xs">
              {/* Toggle Pills */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange(field.key, 'No referral paper')}
                  className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${
                    isNoPaper
                      ? 'bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${isNoPaper ? 'bg-slate-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  <span>No Referral Paper</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isNoPaper) {
                      handleInputChange(field.key, null);
                    }
                  }}
                  className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${
                    !isNoPaper
                      ? 'bg-white border-indigo-500 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-500 dark:text-indigo-400 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${!isNoPaper ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  <span>Yes, Capture / Upload</span>
                </button>
              </div>

              {/* Action buttons & Attachment Box if not 'No referral paper' */}
              {!isNoPaper && (
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.capture = 'environment';
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => handleInputChange(field.key, reader.result);
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold flex items-center justify-center space-x-2 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Capture Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*,application/pdf,.pdf';
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => handleInputChange(field.key, reader.result);
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold flex items-center justify-center space-x-2 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Upload Attached File</span>
                  </button>

                  {/* Attachment Status / Preview Box */}
                  <div className="pt-1">
                    {fileVal && typeof fileVal === 'string' && fileVal.startsWith('data:') ? (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-indigo-100 dark:border-indigo-900 group">
                        <img src={fileVal} alt="Captured / uploaded document" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                          <button
                            type="button"
                            onClick={() => handleInputChange(field.key, null)}
                            className="p-2 bg-white text-red-600 rounded-full hover:scale-110 transition-transform shadow-md"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full py-5 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/50 p-4">
                        <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                          No referral file attached yet.
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          Capture with camera or upload above.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status if 'No referral paper' selected */}
              {isNoPaper && (
                <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Marked as No Referral Paper attached
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'audio':
        return (
          <div key={field.key} className="space-y-3 col-span-full">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
              <Mic className="w-4 h-4 text-rose-500" />
              <span>{field.label} {field.required && <span className="text-red-500">*</span>}</span>
            </label>

            <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              {formData[field.key] ? (
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-full">
                      <Mic className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Voice snippet recorded</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange(field.key, null)}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onMouseDown={() => startRecording(field.key)}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={() => startRecording(field.key)}
                  onTouchEnd={stopRecording}
                  className={`w-full py-4 rounded-xl flex flex-col items-center justify-center space-y-2 transition-all ${
                    isRecording 
                      ? 'bg-rose-100 dark:bg-rose-900/40 border-2 border-rose-500 scale-[0.98]' 
                      : 'bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-rose-400'
                  }`}
                >
                  <div className={`p-3 rounded-full transition-colors ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-gray-50 dark:bg-gray-700 group-hover:bg-rose-50'}`}>
                    <Mic className={`w-6 h-6 ${isRecording ? 'text-white' : 'text-gray-400 group-hover:text-rose-500'}`} />
                  </div>
                  <span className={`text-sm font-medium ${isRecording ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'}`}>
                    {isRecording ? 'Recording... Release to Stop' : 'Hold to Record Voice Verification'}
                  </span>
                </button>
              )}
            </div>
          </div>
        );

      case 'select': {
        const showOtherSpecific = value === 'other specific';
        const otherKey = `${field.key}_other_specific`;
        const otherVal = formData[otherKey] || '';

        return (
          <div key={field.key} className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              required={field.required}
              disabled={isReadOnly}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${
                isReadOnly 
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700'
              }`}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            {showOtherSpecific && (
              <div className="mt-2 animate-fade-in">
                <label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
                  Specify Other {field.label}*
                </label>
                <input
                  type="text"
                  value={otherVal}
                  onChange={(e) => handleInputChange(otherKey, e.target.value)}
                  placeholder={`Enter specific ${field.label.toLowerCase()}...`}
                  required={field.required}
                  readOnly={isReadOnly}
                  className="w-full px-3 py-1.5 text-xs bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
        );
      }

      case 'textarea':
        return (
          <div key={field.key} className="space-y-1.5 relative">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between items-center">
              <span>{field.label} {field.required && <span className="text-red-500">*</span>}</span>
              <button
                type="button"
                onClick={() => isTranscribing === field.key ? null : handleTranscribe(field.key)}
                className={`p-1 rounded-md transition-colors ${
                  isTranscribing === field.key 
                    ? 'bg-rose-500 text-white animate-pulse' 
                    : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                }`}
                title="Dictate clinical notes"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </label>
            <textarea
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={isTranscribing === field.key ? 'Listening and transcribing...' : field.placeholder}
              required={field.required}
              readOnly={isReadOnly || isTranscribing === field.key}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none ${
                isReadOnly 
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700'
              } ${isTranscribing === field.key ? 'border-rose-300 dark:border-rose-900/50' : ''}`}
            />
            {isTranscribing === field.key && (
              <div className="absolute right-3 bottom-3 flex items-center gap-2 pointer-events-none">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">AI Transcribing</span>
                <Loader2 className="w-3 h-3 text-rose-500 animate-spin" />
              </div>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.key} className="flex items-center space-x-2 py-2">
            <input
              type="checkbox"
              id={field.key}
              checked={!!formData[field.key]}
              onChange={(e) => handleInputChange(field.key, e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor={field.key} className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              {field.label}
            </label>
          </div>
        );

      case 'items':
      case 'array':
        return (
          <div key={field.key} className="space-y-1.5 col-span-full">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
              <textarea
                value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleInputChange(field.key, parsed);
                  } catch {
                    handleInputChange(field.key, e.target.value);
                  }
                }}
                placeholder={field.placeholder || 'Enter JSON array or list...'}
                className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none"
                rows={3}
              />
              <p className="text-[10px] text-gray-500 uppercase font-bold">Raw JSON Array Support</p>
            </div>
          </div>
        );

      default:
        return (
          <div key={field.key} className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'date-time' ? 'datetime-local' : 'text'}
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              readOnly={isReadOnly}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${
                isReadOnly 
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700'
              }`}
            />
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
    >
      {/* Form Header */}
      <div className="px-6 py-4 bg-indigo-600 dark:bg-indigo-700 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            {config.icon && <config.icon className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">{config.name || config.subtitle}</h2>
            <p className="text-indigo-100 text-xs">{config.description}</p>
          </div>
        </div>
        {onCancel && (
          <button 
            onClick={onCancel}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Dynamic Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.fields.map(field => renderField(field))}
        </div>

        {/* Status Tracking Fields (Optional but explicit in UI if requested) */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Status:</span>
            </div>
            <select
              value={formData.status || 'pending'}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-transparent border-none focus:ring-0 cursor-pointer"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="reviewed">Reviewed</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Error Handling */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Submit Add Items Form</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};
