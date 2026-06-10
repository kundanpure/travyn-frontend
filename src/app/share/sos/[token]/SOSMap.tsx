"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a red circular icon for the SOS marker
const sosIcon = L.divIcon({
  className: "custom-sos-icon",
  html: `<div style="width: 20px; height: 20px; background-color: #ef4444; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface SOSMapProps {
  lat: number;
  lng: number;
}

// Component to recenter map when location changes
function MapRecenter({ lat, lng }: SOSMapProps) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function SOSMap({ lat, lng }: SOSMapProps) {
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
      <MapRecenter lat={lat} lng={lng} />
      <Marker position={[lat, lng]} icon={sosIcon} />
    </MapContainer>
  );
}
