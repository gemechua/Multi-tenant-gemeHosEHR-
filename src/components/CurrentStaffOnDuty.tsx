import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Clock, MapPin, Search } from 'lucide-react';

export default function CurrentStaffOnDuty() {
  const [staff, setStaff] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch all staff
    const fetchStaff = async () => {
      try {
        const snap = await getDocs(collection(db, 'hr_staff_registry'));
        const staffData: any[] = [];
        snap.forEach(doc => {
          staffData.push({ id: doc.id, ...doc.data() });
        });
        setStaff(staffData);
      } catch (err) {
        console.error('Error fetching staff:', err);
      }
    };
    fetchStaff();

    // Listen to today's attendance logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, 'hr_attendance_registry'),
      // In a real app we'd filter by timestamp >= today, but Firestore needs an index.
      // We'll just fetch recent ones or fetch all and filter in memory for simplicity in this demo.
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const logs: any[] = [];
      snap.forEach(doc => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      setAttendance(logs);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  // Compute who is on duty
  // Group logs by employeeId, find latest action
  const latestStatus = new Map<string, any>();
  
  const sortedLogs = [...attendance].sort((a, b) => {
    const timeA = a.timestamp?.seconds || 0;
    const timeB = b.timestamp?.seconds || 0;
    return timeA - timeB; // Ascending, so last one overrides
  });

  sortedLogs.forEach(log => {
    // Only consider logs from today
    const logDate = log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000) : new Date();
    const today = new Date();
    if (logDate.getDate() === today.getDate() && logDate.getMonth() === today.getMonth() && logDate.getFullYear() === today.getFullYear()) {
       latestStatus.set(log.employeeId, log);
    }
  });

  const activeStaff = Array.from(latestStatus.values())
    .filter(log => log.action === 'clock-in' || log.action === 'break-end')
    .map(log => {
      const staffMember = staff.find(s => s.employeeId === log.employeeId);
      return {
        ...log,
        department: staffMember?.department || 'General',
        jobTitle: staffMember?.jobTitle || 'Staff',
      };
    });

  const filteredStaff = activeStaff.filter(s => 
    s.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedByDept = filteredStaff.reduce((acc: any, curr) => {
    if (!acc[curr.department]) acc[curr.department] = [];
    acc[curr.department].push(curr);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Users size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-gray-900 tracking-tight">Active Staff On-Duty</h3>
            <p className="text-xs text-gray-400 font-medium">Real-time scanner terminal logs</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold border border-emerald-100 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {activeStaff.length} Active
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search staff or department..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {isLoading ? (
          <div className="text-center py-8 text-xs text-gray-400 animate-pulse">Syncing terminal data...</div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            {searchQuery ? 'No active staff match search.' : 'No staff currently clocked in.'}
          </div>
        ) : (
          Object.entries(groupedByDept).map(([dept, members]: [string, any]) => (
            <div key={dept} className="space-y-2">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                {dept}
                <span className="h-px flex-1 bg-gray-100"></span>
                <span className="text-emerald-500">{members.length}</span>
              </h4>
              <div className="grid gap-2">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-emerald-100 bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {member.photo ? (
                         <img src={member.photo} alt={member.employeeName} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs uppercase">
                          {member.employeeName?.substring(0,2)}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-gray-900">{member.employeeName}</p>
                        <p className="text-[10px] text-gray-500">{member.jobTitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-gray-500 flex items-center gap-1 justify-end">
                        <Clock size={10} />
                        {member.timestamp?.seconds ? new Date(member.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                      </div>
                      <div className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">
                        On Duty
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
