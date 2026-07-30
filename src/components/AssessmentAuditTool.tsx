
import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { AUDIT_SCHEMA, AuditChapter } from '../data/auditSchema';
import { 
  ClipboardCheck, ChevronRight, Save, 
  AlertCircle, CheckCircle2, Search,
  BarChart3, FileText, History, ArrowLeft,
  Share2, Send, Mail, Download, ExternalLink, FileSpreadsheet
} from 'lucide-react';

interface AssessmentAuditToolProps {
  activeHospital: any;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  defaultChapter?: number;
  onBack?: () => void;
}

export default function AssessmentAuditTool({ activeHospital, addToast, defaultChapter, onBack }: AssessmentAuditToolProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<number>(defaultChapter || 1);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);

  const chapter = AUDIT_SCHEMA.find(c => c.id === selectedChapterId) || AUDIT_SCHEMA[0];
  const hospital_id = activeHospital?.hospital_unique_number || 'TENANT-ID';

  useEffect(() => {
    if (showHistory) {
      fetchAuditHistory();
    }
  }, [showHistory, selectedChapterId, hospital_id]);

  const fetchAuditHistory = async () => {
    try {
      const q = query(
        collection(db, 'hospital_audits'),
        where('hospital_id', '==', hospital_id),
        where('chapterId', '==', selectedChapterId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setAuditHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleScoreChange = (criterionId: string, value: number) => {
    setScores(prev => ({ ...prev, [criterionId]: value }));
  };

  const calculateResults = () => {
    let totalWeight = 0;
    let totalScore = 0;

    chapter.standards.forEach(std => {
      std.criteria.forEach(crit => {
        totalWeight += crit.weight;
        totalScore += scores[crit.id] || 0;
      });
    });

    const percentage = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    return { totalScore, totalWeight, percentage };
  };

  const saveAudit = async () => {
    if (Object.keys(scores).length === 0) {
      addToast('error', 'Please enter at least one score');
      return;
    }

    try {
      setLoading(true);
      const { totalScore, totalWeight, percentage } = calculateResults();
      const auditPayload = {
        hospital_id,
        hospitalName: activeHospital?.name || '',
        departmentName: activeHospital?.department || '',
        hospitalId: Number(activeHospital?.hospital_unique_number || 0),
        chapterId: selectedChapterId,
        chapterTitle: chapter.title,
        scores,
        totalScore,
        totalWeight,
        percentage,
        createdAt: serverTimestamp(),
        performedBy: auth.currentUser?.email || auth.currentUser?.displayName || 'Current User'
      };

      await addDoc(collection(db, 'hospital_audits'), auditPayload);

      // Save and automatically send to Module 3: Health Service IS (monthly_reports_v2)
      await addDoc(collection(db, 'monthly_reports_v2'), {
        ...auditPayload,
        formatTitle: `Hospital Assessment Audit: Ch ${chapter.id} - ${chapter.title}`,
        updatedBy: {
          email: auth.currentUser?.email || 'user@hospital.gov',
          displayName: auth.currentUser?.displayName || 'Logged User'
        },
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        type: 'Assessment Audit'
      });

      // Dispatch custom event so Module 3 Health Service IS updates real-time
      window.dispatchEvent(new CustomEvent('savedRegisterUpdate'));

      addToast('success', `Audit for ${chapter.title} saved & automatically sent to Module 3: Health Service IS! Score: ${percentage.toFixed(1)}%`);
      setScores({});
      if (showHistory) fetchAuditHistory();
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to save audit');
    } finally {
      setLoading(false);
    }
  };

  const { percentage } = calculateResults();

  const getShareContent = (customScores?: Record<string, number>, customPercentage?: number, customTotalScore?: number, customTotalWeight?: number) => {
    const { totalScore, totalWeight, percentage } = calculateResults();
    const sc = customScores || scores;
    const pct = customPercentage !== undefined ? customPercentage : percentage;
    const ts = customTotalScore !== undefined ? customTotalScore : totalScore;
    const tw = customTotalWeight !== undefined ? customTotalWeight : totalWeight;

    const title = `Hospital Assessment Audit Report - Chapter ${chapter.id}: ${chapter.title}`;
    const hospital = activeHospital?.name || 'Hospital Quality Audit';
    const hospitalId = activeHospital?.hospital_unique_number || 'N/A';
    const dateStr = new Date().toLocaleDateString();

    const body = `🏥 *${hospital}* (ID: ${hospitalId})\n📋 *${title}*\n📅 *Date:* ${dateStr}\n📊 *Overall Score:* ${pct.toFixed(1)}% (${ts}/${tw} Points)\n\nAudit conducted via Hospital Information System.`;

    return { title, body, pct, ts, tw, hospital, hospitalId, dateStr };
  };

  const handleShareWhatsApp = () => {
    const { body } = getShareContent();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
    addToast('info', 'Opening WhatsApp to share audit report...');
  };

  const handleShareTelegram = () => {
    const { body } = getShareContent();
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
    addToast('info', 'Opening Telegram to share audit report...');
  };

  const handleShareEmail = () => {
    const { title, body } = getShareContent();
    const url = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body.replace(/\*/g, ''))}`;
    window.location.href = url;
    addToast('info', 'Opening Email client...');
  };

  const handleExportCSV = () => {
    const { pct, ts, tw, hospital, hospitalId, dateStr } = getShareContent();
    let csv = `Hospital Name,Hospital ID,Chapter ID,Chapter Title,Date,Total Score,Total Weight,Percentage\n`;
    csv += `"${hospital}","${hospitalId}",${chapter.id},"${chapter.title}","${dateStr}",${ts},${tw},${pct.toFixed(1)}%\n\n`;
    csv += `Standard ID,Standard,Criterion ID,Criterion,Weight,Score Obtained\n`;

    chapter.standards.forEach(std => {
      std.criteria.forEach(crit => {
        const score = scores[crit.id] || 0;
        csv += `"${std.id}","${std.standard.replace(/"/g, '""')}","${crit.id}","${crit.criterion.replace(/"/g, '""')}",${crit.weight},${score}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Hospital_Audit_Ch${chapter.id}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Audit report exported successfully as CSV!');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      {/* Sub-Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer border border-slate-200 flex items-center gap-2 font-bold text-xs shadow-3xs"
                title="Back to Data & Explorer"
              >
                <ArrowLeft size={16} />
                <span>Back to Data & Explorer</span>
              </button>
            )}
            <div className="p-2 bg-indigo-600 rounded-lg shadow-md shadow-indigo-100">
              <ClipboardCheck className="text-white" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Hospital Service Assessment</h4>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Chapter {chapter.id}: {chapter.title}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {AUDIT_SCHEMA.map(c => (
                <option key={c.id} value={c.id}>Ch {c.id}: {c.title.substring(0, 30)}...</option>
              ))}
            </select>

            {/* Share & Export Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={handleShareWhatsApp}
                className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold shadow-3xs"
                title="Share via WhatsApp"
              >
                <Send size={13} />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              <button
                onClick={handleShareTelegram}
                className="p-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold shadow-3xs"
                title="Share via Telegram"
              >
                <Send size={13} />
                <span className="hidden sm:inline">Telegram</span>
              </button>

              <button
                onClick={handleShareEmail}
                className="p-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold shadow-3xs"
                title="Share via Email"
              >
                <Mail size={13} />
                <span className="hidden sm:inline">Email</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold shadow-3xs"
                title="Export as CSV Report"
              >
                <Download size={13} />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>

            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg border transition-all ${showHistory ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`}
              title="Audit History"
            >
              <History size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <div className="max-w-5xl mx-auto">
          {showHistory ? (
            <div className="space-y-4">
               <h5 className="font-bold text-slate-900 flex items-center gap-2 mb-6">
                  <BarChart3 size={18} className="text-indigo-600" />
                  Audit Performance History
               </h5>
               {auditHistory.length === 0 ? (
                 <div className="p-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <FileText className="mx-auto text-slate-300 mb-4" size={40} />
                    <p className="text-slate-500 font-medium">No previous audits found for this chapter.</p>
                 </div>
               ) : (
                 auditHistory.map((audit) => (
                   <div key={audit.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm ${
                           audit.percentage >= 85 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                           audit.percentage >= 50 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                           'bg-rose-50 text-rose-600 border border-rose-100'
                         }`}>
                            {Math.round(audit.percentage)}%
                         </div>
                         <div>
                            <p className="text-xs font-black text-slate-900">Audit on {new Date(audit.createdAt?.toDate()).toLocaleDateString()}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Performed by: {audit.performedBy}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-bold text-slate-600">{audit.totalScore} / {audit.totalWeight} Points</p>
                         <button className="text-[10px] font-black text-indigo-600 uppercase underline opacity-0 group-hover:opacity-100 transition-opacity">
                            View Details
                         </button>
                      </div>
                   </div>
                 ))
               )}
            </div>
          ) : (
            <div className="space-y-8 pb-32">
              {chapter.standards.map((std) => (
                <div key={std.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-black text-indigo-600 bg-white w-6 h-6 rounded flex items-center justify-center border border-indigo-100 shrink-0">
                        {std.id}
                      </span>
                      <h5 className="font-bold text-slate-900 text-sm leading-tight pt-0.5">{std.standard}</h5>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {std.criteria.map((crit) => (
                      <div key={crit.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex-1">
                          <p className="text-sm text-slate-700 font-medium leading-relaxed">{crit.criterion}</p>
                          <div className="flex items-center gap-2 mt-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Weight: {crit.weight}</span>
                             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{crit.id}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {crit.weight <= 5 ? (
                            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                              {Array.from({ length: crit.weight + 1 }).map((_, val) => (
                                <button
                                  key={val}
                                  onClick={() => handleScoreChange(crit.id, val)}
                                  className={`w-10 h-8 flex items-center justify-center text-xs font-black rounded-lg transition-all ${
                                    (scores[crit.id] === val) 
                                      ? 'bg-white text-indigo-600 shadow-sm' 
                                      : 'text-slate-400 hover:text-slate-600'
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input 
                                type="range"
                                min="0"
                                max={crit.weight}
                                value={scores[crit.id] || 0}
                                onChange={(e) => handleScoreChange(crit.id, parseInt(e.target.value))}
                                className="w-32 accent-indigo-600"
                              />
                              <input 
                                type="number"
                                min="0"
                                max={crit.weight}
                                value={scores[crit.id] || 0}
                                onChange={(e) => handleScoreChange(crit.id, Math.min(crit.weight, Math.max(0, parseInt(e.target.value) || 0)))}
                                className="w-12 h-8 bg-white border border-slate-200 rounded-lg text-center text-xs font-black focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>
                          )}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                            (scores[crit.id] || 0) > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-300'
                          }`}>
                            {(scores[crit.id] || 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!showHistory && (
        <div className="bg-white border-t border-slate-200 p-6 shadow-2xl shadow-slate-900/20">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Progress</span>
                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-500" 
                    style={{ width: `${(Object.keys(scores).length / chapter.standards.reduce((acc, s) => acc + s.criteria.length, 0)) * 100}%` }}
                  />
                </div>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Live Performance Score</span>
                <span className={`text-2xl font-black ${percentage >= 85 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-600' : 'text-slate-900'}`}>
                   {percentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <button 
              onClick={saveAudit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Complete Assessment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
