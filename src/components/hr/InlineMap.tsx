import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RecenterAutomatically = ({ lat, lon }: { lat: number; lon: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], 15);
  }, [lat, lon, map]);
  return null;
}

export default function InlineMap({ attendance, hospitalLat, hospitalLon, radius }: { attendance: any[], hospitalLat: number, hospitalLon: number, radius: number }) {
  
  const hospitalIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #2563eb; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white;">🏥</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  return (
    <div style={{ height: '100%', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer center={[hospitalLat, hospitalLon]} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterAutomatically lat={hospitalLat} lon={hospitalLon} />
        
        {/* Hospital Center */}
        <Marker position={[hospitalLat, hospitalLon]} icon={hospitalIcon}>
          <Popup>
            <b>Main Hospital</b><br />
            Allowed Perimeter Radius: {radius}m
          </Popup>
        </Marker>

        {/* Perimeter Circle */}
        <Circle 
          center={[hospitalLat, hospitalLon]} 
          radius={radius} 
          pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 2 }} 
        />

        {/* Attendance Markers */}
        {attendance.slice(0, 50).map((log, index) => {
          if (!log.location) return null;
          
          const lat = log.location.lat || hospitalLat;
          const lon = log.location.lon || hospitalLon;
          const distance = log.location.distanceFromMainEntrance || 0;
          
          let pinColor = '#f43f5e'; // Red (Out of Bounds)
          let statusText = 'Out of Bounds';
          
          if (distance <= radius) {
            pinColor = '#10b981'; // Green (Within Radius)
            statusText = 'Within Radius';
          } else if (distance <= radius + 100) {
            pinColor = '#eab308'; // Yellow (Warning: <100m outside)
            statusText = 'Warning (<100m outside)';
          } else if (distance <= 100) {
            // Also explicitly check if distance <= 100 in case radius is very small
            pinColor = '#eab308'; 
            statusText = 'Warning (<100m)';
          }

          const staffIcon = L.divIcon({
            className: 'custom-staff-icon',
            html: `<div style="background-color: ${pinColor}; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2); border: 2px solid white;">👤</div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          });

          return (
            <Marker key={log.id || index} position={[lat, lon]} icon={staffIcon}>
              <Popup>
                <div style={{ fontFamily: 'sans-serif', fontSize: '12px' }}>
                  <b>{log.staffName || log.employeeName || 'Staff Member'}</b><br />
                  Distance: <b>{Math.round(distance)}m</b> from center<br />
                  Status: <span style={{ color: pinColor, fontWeight: 'bold' }}>{statusText}</span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
