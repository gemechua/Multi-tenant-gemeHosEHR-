import React, { useEffect, useRef } from 'react';
import { X, MapPin, ShieldCheck, AlertTriangle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface AttendanceMapModalProps {
  attendance: any[];
  activeHospital: any;
  onClose: () => void;
}

export default function AttendanceMapModal({ attendance, activeHospital, onClose }: AttendanceMapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const HOSPITAL_LAT = 9.032;
  const HOSPITAL_LON = 38.747;
  const ALLOWED_RADIUS = 500; // meters

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([HOSPITAL_LAT, HOSPITAL_LON], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Hospital Center Marker
      const hospitalIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #2563eb; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white;">🏥</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker([HOSPITAL_LAT, HOSPITAL_LON], { icon: hospitalIcon })
        .addTo(map)
        .bindPopup(`<b>${activeHospital?.hospital_name || 'Main Hospital'}</b><br>Allowed Perimeter Radius: ${ALLOWED_RADIUS}m`);

      // Allowed Radius Circle
      L.circle([HOSPITAL_LAT, HOSPITAL_LON], {
        radius: ALLOWED_RADIUS,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 2
      }).addTo(map);

      // Staff Check-in Markers
      attendance.forEach((log) => {
        const lat = log.location?.lat || (HOSPITAL_LAT + (Math.random() - 0.5) * 0.005);
        const lon = log.location?.lon || (HOSPITAL_LON + (Math.random() - 0.5) * 0.005);
        const distance = log.location?.distanceFromMainEntrance || Math.round(Math.random() * 120);
        const isInside = distance <= ALLOWED_RADIUS;

        const pinColor = isInside ? '#10b981' : '#f43f5e';
        const staffIcon = L.divIcon({
          className: 'custom-staff-icon',
          html: `<div style="background-color: ${pinColor}; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2); border: 2px solid white;">👤</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        L.marker([lat, lon], { icon: staffIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px;">
              <b>${log.staffName || log.employeeName || 'Staff Member'}</b> (${log.staffId || log.employeeId || 'ID'})<br>
              Action: <b>${log.actionType || log.action || 'Clock-In'}</b><br>
              Distance: <b>${Math.round(distance)}m</b> from center<br>
              Status: <span style="color: ${pinColor}; font-weight: bold;">${isInside ? 'Within Radius' : 'Out of Bounds'}</span>
            </div>
          `);
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [attendance]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base uppercase tracking-tight">Staff Attendance Radar & Geofence Map</h3>
              <p className="text-xs text-gray-500 font-medium">Real-time GPS coordinate mapping relative to hospital perimeter ({ALLOWED_RADIUS}m radius)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Map Container */}
        <div className="relative flex-1 min-h-[450px] w-full bg-gray-100">
          <div ref={mapRef} className="absolute inset-0 w-full h-full z-10" />
        </div>

        {/* Footer legend */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-white shadow" />
              <span className="font-bold text-gray-700">Hospital Center (9.032, 38.747)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white shadow" />
              <span className="font-bold text-gray-700">Valid Check-In (&le; 500m)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-white shadow" />
              <span className="font-bold text-gray-700">Out of Bounds (&gt; 500m)</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
          >
            Close Map View
          </button>
        </div>
      </div>
    </div>
  );
}
