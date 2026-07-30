import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function HRTemplateEditor() {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  const saveDraft = async () => {
    await setDoc(doc(db, 'hr_templates', Date.now().toString()), { name, content, createdAt: new Date().toISOString() });
    alert('Draft Saved');
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200">
      <h3 className="font-black text-slate-800 mb-6">WYSIWYG Template Editor</h3>
      <input 
        value={name} 
        onChange={(e) => setName(e.target.value)}
        placeholder="Template Name"
        className="w-full p-3 border rounded-xl mb-4"
      />
      <textarea 
        value={content} 
        onChange={(e) => setContent(e.target.value)}
        placeholder="Template Content (use {{token}} for fields)"
        className="w-full p-3 border rounded-xl h-60 mb-4"
      />
      <button onClick={saveDraft} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">Save Draft</button>
    </div>
  );
}
