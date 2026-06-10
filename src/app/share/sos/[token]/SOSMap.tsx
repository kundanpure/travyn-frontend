"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create an Avatar icon for the SOS marker
const createAvatarIcon = (initials: string) => {
  return L.divIcon({
    html: `<div style="
      background: #ef4444; 
      color: #fff; 
      width: 40px; 
      height: 40px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-weight: bold; 
      font-size: 16px;
      border: 3px solid white;
      box-shadow: 0 0 15px rgba(239, 68, 68, 0.8);
      animation: pulse 2s infinite;
    ">${initials}</div>`,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

interface SOSMapProps {
  lat: number;
  lng: number;
  userName: string;
  initials: string;
  lastLocationTime: string;
}

// Component to recenter map when location changes
function MapRecenter({ lat, lng }: SOSMapProps) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function SOSMap({ lat, lng, userName, initials, lastLocationTime }: SOSMapProps) {
  return (
    <MapContainer 
      center={[lat, lng]} 
      zoom={15} 
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapRecenter lat={lat} lng={lng} userName="" initials="" lastLocationTime="" />
      <Marker position={[lat, lng]} icon={createAvatarIcon(initials)}>
        <Popup>
          <div className="text-center font-sans">
            <div className="font-bold text-sm text-gray-900">{userName}</div>
            <div className="text-xs text-gray-500 mt-1">
              Last known location at:<br/>
              {new Date(lastLocationTime).toLocaleTimeString()}
            </div>
            <div className="mt-2 inline-block bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold animate-pulse">
              SOS Active
            </div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
