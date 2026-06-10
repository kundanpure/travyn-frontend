"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MapPin, Navigation, User, Phone, Clock, AlertTriangle, ShieldAlert } from "lucide-react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import axios from "axios";

// Using a basic axios call to bypass auth interceptors for public API
const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export default function PublicSOSPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [sosData, setSosData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const fetchData = async () => {
    try {
      const res = await publicApi.get(`/public/sos/${token}`);
      setSosData(res.data);
      setError("");
    } catch (e: any) {
      if (e.response?.status === 404) {
        setError("This SOS link is invalid or has expired.");
      } else {
        setError("Failed to load SOS tracking data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    
    fetchData();
    // Poll for live location every 15 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 15000);

    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-white font-medium animate-pulse">Establishing secure connection...</p>
      </div>
    );
  }

  if (error || !sosData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert size={64} className="text-gray-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Unavailable</h1>
        <p className="text-gray-400">{error || "Data not found"}</p>
      </div>
    );
  }

  const mapCenter = sosData.lastLat && sosData.lastLng 
    ? { lat: sosData.lastLat, lng: sosData.lastLng }
    : { lat: 20.5937, lng: 78.9629 }; // Default India

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Banner */}
      <div className="bg-red-600 px-6 py-4 flex items-center justify-between shadow-lg z-10 relative">
        <div className="flex items-center gap-3">
          <AlertTriangle size={32} className="text-white animate-pulse" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-wider">Active SOS Alert</h1>
            <p className="text-red-100 text-xs sm:text-sm">Travyn Emergency Tracking System</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Info Sidebar */}
        <div className="w-full lg:w-1/3 max-w-md bg-surface border-r border-line shadow-2xl z-10 overflow-y-auto">
          <div className="p-6 space-y-8">
            <div>
              <h2 className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-3">Traveler in Distress</h2>
              <div className="bg-deep p-4 rounded-xl border border-line flex items-start gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
                  <User size={24} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{sosData.userName}</h3>
                  {sosData.userPhone && (
                    <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                      <Phone size={14} /> {sosData.userPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-3">Trip Context</h2>
              <div className="bg-deep p-4 rounded-xl border border-line space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-primary mt-0.5" />
                  <div>
                    <span className="text-gray-400 block">Trip Name</span>
                    <span className="text-white font-medium">{sosData.tripName}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Navigation size={16} className="text-primary mt-0.5" />
                  <div>
                    <span className="text-gray-400 block">Destination</span>
                    <span className="text-white font-medium">{sosData.tripDestination}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-primary mt-0.5" />
                  <div>
                    <span className="text-gray-400 block">Triggered At</span>
                    <span className="text-white font-medium">
                      {new Date(sosData.sosTriggeredAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-3">Action Required</h2>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-200">
                <p className="mb-3">
                  {sosData.userName} has triggered a distress signal and listed you as an emergency contact.
                </p>
                <p>
                  If you cannot reach them, please share this live tracking page with local authorities immediately.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 h-[50vh] lg:h-auto relative bg-deep">
          {!isLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapCenter}
              zoom={15}
              options={{
                disableDefaultUI: false,
                mapTypeId: 'roadmap',
                styles: [
                  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                  // Add more dark mode styles as needed
                ]
              }}
            >
              {sosData.lastLat && sosData.lastLng && (
                <Marker
                  position={{ lat: sosData.lastLat, lng: sosData.lastLng }}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#ef4444",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                  }}
                />
              )}
            </GoogleMap>
          )}

          {sosData.lastLocationTime && (
            <div className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-line text-xs font-medium text-white flex items-center gap-2 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Location updated {new Date(sosData.lastLocationTime).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
