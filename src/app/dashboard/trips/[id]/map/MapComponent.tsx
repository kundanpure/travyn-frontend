"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Navigation } from "lucide-react";

// Fix standard leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Waypoint {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  creatorName: string;
  creatorId: string;
}

interface LocationUpdate {
  userId: string;
  userName: string;
  initials: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

function AddWaypointListener({ onAdd }: { onAdd: (lat: number, lng: number) => void }) {
  useMapEvents({
    contextmenu(e) {
      onAdd(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapComponent({ tripId }: { tripId: string }) {
  const { user } = useAuthStore();
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [locations, setLocations] = useState<Record<string, LocationUpdate>>({});
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const stompClientRef = useRef<Client | null>(null);
  const geoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api.get(`/trips/${tripId}/map/waypoints`).then((res) => {
      setWaypoints(res.data || []);
      if (res.data?.length > 0) {
        setMapCenter([res.data[0].latitude, res.data[0].longitude]);
      }
    }).catch(console.error);
  }, [tripId]);

  useEffect(() => {
    const stored = localStorage.getItem("travyn-auth");
    if (!stored) return;
    let token = "";
    try {
      token = JSON.parse(stored)?.state?.accessToken || "";
    } catch { return; }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const wsBaseUrl = apiUrl.replace("/api/v1", "");

    const client = new Client({
      webSocketFactory: () => new SockJS(`${wsBaseUrl}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/map/${tripId.toLowerCase()}/waypoints`, (frame) => {
          const wp = JSON.parse(frame.body);
          setWaypoints((prev) => [...prev, wp]);
        });
        
        client.subscribe(`/topic/map/${tripId.toLowerCase()}/waypoints/delete`, (frame) => {
          const id = frame.body;
          setWaypoints((prev) => prev.filter(w => w.id !== id));
        });

        client.subscribe(`/topic/map/${tripId.toLowerCase()}/locations`, (frame) => {
          const loc = JSON.parse(frame.body) as LocationUpdate;
          setLocations((prev) => ({ ...prev, [loc.userId]: loc }));
        });

        startBroadcasting();
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (geoIntervalRef.current) clearInterval(geoIntervalRef.current);
      client.deactivate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const startBroadcasting = () => {
    const broadcast = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const stomp = stompClientRef.current;
          if (stomp?.connected) {
            stomp.publish({
              destination: `/app/map/${tripId.toLowerCase()}/location`,
              body: JSON.stringify({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
              })
            });
            if (user) {
              setLocations(prev => ({
                ...prev,
                [user.id]: {
                  userId: user.id,
                  userName: "You",
                  initials: (user.firstName[0] + user.lastName[0]).toUpperCase(),
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  timestamp: new Date().toISOString()
                }
              }));
            }
          }
        },
        () => {}, 
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    };

    broadcast();
    geoIntervalRef.current = setInterval(broadcast, 10000);
  };

  const handleAddWaypoint = async (lat: number, lng: number) => {
    const label = window.prompt("Enter a label for this pinned location:");
    if (!label) return;
    try {
      await api.post(`/trips/${tripId}/map/waypoints`, { latitude: lat, longitude: lng, label });
    } catch {
      alert("Failed to drop pin.");
    }
  };

  const handleDeleteWaypoint = async (id: string) => {
    if (!confirm("Remove this pin?")) return;
    try {
      await api.delete(`/trips/${tripId}/map/waypoints/${id}`);
    } catch {
      alert("Failed to remove pin.");
    }
  };

  const createAvatarIcon = (initials: string, isSelf: boolean) => {
    const color = isSelf ? "var(--color-primary)" : "#a78bfa";
    return L.divIcon({
      html: `<div style="
        background: ${color}; 
        color: #fff; 
        width: 32px; 
        height: 32px; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-weight: bold; 
        font-size: 12px;
        border: 2px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      ">${initials}</div>`,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const customPinIcon = L.divIcon({
    html: `<div style="color: #f472b6; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
    </div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  return (
    <div style={{ height: "calc(100vh - 150px)", width: "100%", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--color-line)", zIndex: 0 }}>
      <MapContainer center={mapCenter} zoom={5} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <AddWaypointListener onAdd={handleAddWaypoint} />

        {waypoints.map(wp => (
          <Marker key={wp.id} position={[wp.latitude, wp.longitude]} icon={customPinIcon}>
            <Popup>
              <div className="text-center font-sans">
                <div className="font-bold text-sm mb-1">{wp.label}</div>
                <div className="text-xs text-gray-500 mb-2">Pinned by {wp.creatorName}</div>
                <div className="flex gap-2 justify-center">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${wp.latitude},${wp.longitude}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded text-xs no-underline"
                  >
                    <Navigation size={12} /> Directions
                  </a>
                  {(user?.id === wp.creatorId) && (
                    <button 
                      onClick={() => handleDeleteWaypoint(wp.id)}
                      className="text-red-500 text-xs border border-red-500 px-2 py-1 rounded"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {Object.values(locations).map(loc => {
          const isSelf = loc.userId === user?.id;
          return (
            <Marker 
              key={loc.userId} 
              position={[loc.latitude, loc.longitude]} 
              icon={createAvatarIcon(loc.initials, isSelf)}
              zIndexOffset={isSelf ? 1000 : 0}
            >
              <Popup>
                <div className="text-center font-sans">
                  <div className="font-bold text-sm">{loc.userName}</div>
                  <div className="text-xs text-gray-500">
                    Updated {new Date(loc.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
