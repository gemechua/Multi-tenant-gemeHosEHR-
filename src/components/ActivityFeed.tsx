import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Activity } from 'lucide-react';

export default function ActivityFeed() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const eventsQuery = query(collection(db, 'patient_journey_events'), orderBy('event_time', 'desc'), limit(10));
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-xs">
      <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Activity size={18} className="text-blue-600" />
        Live Activity Feed
      </h3>
      <div className="space-y-4">
        {events.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500">No recent events.</p>}
        {events.map(event => (
          <div key={event.id} className="text-xs text-gray-600 dark:text-gray-300 border-l-2 border-gray-100 dark:border-slate-800 pl-3">
            <p className="font-semibold text-gray-900 dark:text-gray-100">{event.stage_label || 'Event'}</p>
            <p>{event.notes}</p>
            <p className="text-gray-400 dark:text-gray-500 text-[10px]">{event.event_time ? new Date(event.event_time).toLocaleString() : 'N/A'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
