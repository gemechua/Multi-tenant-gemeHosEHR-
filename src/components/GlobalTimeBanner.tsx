import React, { useState, useEffect } from 'react';
import { Clock, Globe, Calendar, MapPin, Compass } from 'lucide-react';

export const GlobalTimeBanner: React.FC = () => {
  const [now, setNow] = useState<Date>(new Date());
  const [timeZone, setTimeZone] = useState<string>('');
  const [timeZoneOffset, setTimeZoneOffset] = useState<string>('');

  useEffect(() => {
    // Detect system timezone automatically based on user's location/browser
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    setTimeZone(tz);

    // Calculate timezone offset format (e.g., GMT+03:00)
    const offsetMinutes = -now.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0');
    const mins = String(Math.abs(offsetMinutes) % 60).padStart(2, '0');
    setTimeZoneOffset(`GMT${sign}${hours}:${mins}`);

    // Update live clock every second
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const year = now.getFullYear();

  return (
    <div className="mb-6 w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-indigo-900/40 relative overflow-hidden">
      {/* Background Subtle Accent Effect */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -top-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Global Location & Timezone Indicator */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-300 flex items-center justify-center shrink-0">
            <Globe size={20} className="animate-spin-slow text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                Live Location Detected
              </span>
              <span className="text-[11px] font-mono text-indigo-200/80 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 font-semibold">
                {timeZoneOffset}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-sm font-black tracking-wide text-white">
              <MapPin size={14} className="text-indigo-400 shrink-0" />
              <span className="uppercase tracking-widest text-xs font-mono text-indigo-100">
                TIMEZONE: {timeZone || 'DETECTING...'}
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Live Clock & Full Date & Year */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
          {/* Live Digital Clock */}
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
            <Clock size={18} className="text-amber-400 animate-pulse shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-mono font-bold text-amber-300/80 tracking-widest leading-none">
                Local Time
              </span>
              <span className="font-mono text-lg font-black tracking-wider text-white leading-tight">
                {timeString}
              </span>
            </div>
          </div>

          {/* Date & Year Card */}
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
            <Calendar size={18} className="text-blue-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-mono font-bold text-blue-300/80 tracking-widest leading-none">
                Date & Year
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100 leading-tight mt-0.5">
                <span>{dayOfWeek},</span>
                <span>{monthDay}</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-blue-500/30 text-blue-200 rounded font-black font-mono">
                  {year}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalTimeBanner;
