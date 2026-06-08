"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MapPin, Navigation, Shield, AlertTriangle, Loader2 } from "lucide-react";

export default function PublicLocationPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLocation();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchLocation, 300000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchLocation = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/public/location/${token}`);
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.message || "Invalid or expired tracking link");
      }
      
      if (json.expired) {
        setError(json.message);
      } else {
        setData(json);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06080c]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#06080c] p-6 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-red-500/10 border border-red-500/20 mb-4">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Tracking Unavailable</h1>
        <p className="text-gray-400 max-w-sm">{error}</p>
      </div>
    );
  }

  const { travelerName, latitude, longitude, lastUpdated, tripTitle, tripDestination } = data;

  // We use a simple iframe for OpenStreetMap if we have coords, 
  // or a placeholder if coords are missing (e.g., sharing is on but no GPS fix yet).
  const hasLocation = latitude != null && longitude != null;
  const timeStr = lastUpdated ? new Date(lastUpdated).toLocaleString() : "Unknown";

  return (
    <div className="min-h-screen bg-[#06080c] flex flex-col">
      {/* Header */}
      <div className="bg-surface border-b border-line p-4 sm:p-6 flex items-center gap-3 shadow-sm z-10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20 flex-shrink-0">
          <Shield size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            Travyn Safety <span className="text-xs bg-primary text-black px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">Live</span>
          </h1>
          <p className="text-xs text-gray-400 truncate">
            {travelerName}'s Trip to {tripDestination}
          </p>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-deep">
        {hasLocation ? (
          <iframe 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.05}%2C${latitude-0.05}%2C${longitude+0.05}%2C${latitude+0.05}&layer=mapnik&marker=${latitude}%2C${longitude}`}
            className="absolute inset-0"
            style={{ filter: "invert(90%) hue-rotate(180deg)" }} // pseudo dark mode map
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-6 text-center">
            <Navigation size={48} className="mb-4 opacity-50" />
            <p>Waiting for the traveler's device to send a GPS location update...</p>
          </div>
        )}
        
        {/* Info Overlay */}
        <div className="absolute bottom-6 left-6 right-6 sm:left-auto sm:w-80 bg-surface/90 backdrop-blur-md border border-line p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 mb-3 text-white font-semibold">
            <MapPin size={16} className="text-primary"/> Last Known Location
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Traveler:</span>
              <span className="text-white font-medium">{travelerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Trip:</span>
              <span className="text-white font-medium truncate max-w-[150px]">{tripTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Updated:</span>
              <span className="text-white font-medium">{timeStr}</span>
            </div>
            
            {hasLocation && (
              <div className="pt-3 mt-3 border-t border-line text-xs text-gray-500 flex items-center justify-between">
                <span>Lat: {latitude.toFixed(4)}</span>
                <span>Lng: {longitude.toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
