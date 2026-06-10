"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Shield, UserPlus, Phone, Mail, MapPin, SwitchCamera, Link as LinkIcon, 
  Trash2, Loader2, AlertTriangle, Navigation, Clock, CheckCircle2 
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import LocationAutocomplete from "@/app/dashboard/components/LocationAutocomplete";

export default function SafetyPage() {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Contact State
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", email: "", phoneNumber: "", relationship: "" });

  // Location Sharing State per Trip
  const [sharingStatus, setSharingStatus] = useState<Record<string, any>>({});
  const [generatedLinks, setGeneratedLinks] = useState<Record<string, any[]>>({});
  const sharingStatusRef = useRef<Record<string, any>>({});
  
  // Keep ref in sync with state
  useEffect(() => {
    sharingStatusRef.current = sharingStatus;
  }, [sharingStatus]);

  // Geolocation interval ref
  const geoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchData();
    return () => {
      if (geoIntervalRef.current) clearInterval(geoIntervalRef.current);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contactsRes, tripsRes] = await Promise.all([
        api.get("/emergency-contacts"),
        api.get("/trips/my-trips")
      ]);
      setContacts(contactsRes.data || []);
      
      const today = new Date().toISOString().split("T")[0];
      const activeTrips = (tripsRes.data || []).filter((t: any) => 
        t.startDate <= today && t.endDate >= today &&
        (t.status === "OPEN" || t.status === "IN_PROGRESS" || t.status === "FULL") && 
        (t.memberRole === "CREATOR" || t.memberStatus === "APPROVED")
      );
      setTrips(activeTrips);

      const statusMap: Record<string, any> = {};
      for (const trip of activeTrips) {
        try {
          const statusRes = await api.get(`/trips/${trip.id}/location/status`);
          // Jackson backend might serialize boolean 'isActive' as 'active'
          const isActive = statusRes.data.isActive ?? statusRes.data.active ?? false;
          statusMap[trip.id] = { ...statusRes.data, isActive };
        } catch (e) {
          statusMap[trip.id] = { isActive: false };
        }
      }
      setSharingStatus(statusMap);

      // Check if any trip has active sharing, if so start geolocation
      const anyActive = Object.values(statusMap).some((s) => s.isActive);
      if (anyActive) {
        startGeolocationTracking();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startGeolocationTracking = () => {
    if (geoIntervalRef.current) clearInterval(geoIntervalRef.current);
    
    // Initial fetch
    sendLocationUpdate();
    
    // Then every 5 mins
    geoIntervalRef.current = setInterval(() => {
      sendLocationUpdate();
    }, 300000);
  };

  const stopGeolocationTracking = () => {
    if (geoIntervalRef.current) {
      clearInterval(geoIntervalRef.current);
      geoIntervalRef.current = null;
    }
  };

  const sendLocationUpdate = () => {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        console.log("GPS Location acquired! Accuracy:", pos.coords.accuracy);
        if (pos.coords.accuracy > 20000) {
          console.warn("Location too inaccurate to share:", pos.coords.accuracy);
          return; // Too inaccurate (e.g. > 20km)
        }
        
        const currentStatus = sharingStatusRef.current;
        const activeTripIds = Object.keys(currentStatus).filter(id => currentStatus[id].isActive);
        for (const tripId of activeTripIds) {
          try {
            await api.post("/location", {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              tripId
            });
          } catch (e) {
            console.error("Failed to update location for trip", tripId);
          }
        }
      },
      (err) => {
        console.error("Geolocation error:", err.message || err);
        if (err.code === 1) {
          alert("Location permission denied. Please allow location access in your browser or device settings to use live tracking.");
        } else if (err.code === 2) {
          alert("Location unavailable. Please make sure your device GPS/Location is turned ON.");
        } else {
          alert("Location error: " + (err.message || "Unable to retrieve location"));
        }
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 60000 }
    );
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/emergency-contacts", newContact);
      setContacts([...contacts, res.data]);
      setShowAddContact(false);
      setNewContact({ name: "", email: "", phoneNumber: "", relationship: "" });
    } catch (e) {
      alert("Failed to add contact.");
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await api.delete(`/emergency-contacts/${id}`);
      setContacts(contacts.filter(c => c.id !== id));
    } catch (e) {
      alert("Failed to delete contact.");
    }
  };

  // Panic Button State
  const [panicProgress, setPanicProgress] = useState(0);
  const panicTimerRef = useRef<NodeJS.Timeout | null>(null);
  const panicIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [sosTriggered, setSosTriggered] = useState(false);

  const startPanic = () => {
    if (sosTriggered) return;
    setPanicProgress(0);
    
    // Update progress bar every 30ms for 3 seconds
    panicIntervalRef.current = setInterval(() => {
      setPanicProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 1; // 1% per 30ms = 3000ms total
      });
    }, 30);

    panicTimerRef.current = setTimeout(() => {
      triggerSOS();
    }, 3000);
  };

  const cancelPanic = () => {
    if (panicTimerRef.current) clearTimeout(panicTimerRef.current);
    if (panicIntervalRef.current) clearInterval(panicIntervalRef.current);
    if (!sosTriggered) setPanicProgress(0);
  };

  const triggerSOS = async () => {
    if (panicTimerRef.current) clearTimeout(panicTimerRef.current);
    if (panicIntervalRef.current) clearInterval(panicIntervalRef.current);
    setPanicProgress(100);
    
    try {
      await api.post("/safety/panic");
      setSosTriggered(true);
      alert("🚨 EMERGENCY SOS TRIGGERED! Your emergency contacts have been notified.");
    } catch (e) {
      alert("Failed to trigger SOS. Check connection.");
      setPanicProgress(0);
    }
  };

  const handleToggleSharing = async (tripId: string, currentActive: boolean) => {
    const newState = !currentActive;
    try {
      await api.post(`/trips/${tripId}/location/toggle`, { isActive: newState });
      setSharingStatus(prev => {
        const next = { ...prev, [tripId]: { ...prev[tripId], isActive: newState } };
        
        // Adjust tracking
        const anyActive = Object.values(next).some((s) => s.isActive);
        if (anyActive) startGeolocationTracking();
        else stopGeolocationTracking();
        
        return next;
      });
    } catch (e) {
      alert("Failed to toggle location sharing.");
    }
  };

  const handleSetAccommodation = async (tripId: string, lat: number, lng: number, label: string) => {
    try {
      await api.put(`/trips/${tripId}/location/accommodation`, { latitude: lat, longitude: lng, label });
      setSharingStatus(prev => ({
        ...prev, 
        [tripId]: { ...prev[tripId], accommodationLat: lat, accommodationLng: lng, accommodationLabel: label }
      }));
      alert("Accommodation pinned successfully!");
    } catch (e) {
      alert("Failed to set accommodation.");
    }
  };

  const handleShareLinks = async (tripId: string) => {
    if (contacts.length === 0) {
      alert("Please add at least one emergency contact first.");
      return;
    }
    try {
      const res = await api.post(`/trips/${tripId}/location/share`);
      
      // Update local state to active since the backend activates it
      setSharingStatus(prev => {
        const next = { ...prev, [tripId]: { ...prev[tripId], isActive: true } };
        // Trigger tracking if any trip is active
        const anyActive = Object.values(next).some((s) => s.isActive);
        if (anyActive) startGeolocationTracking();
        return next;
      });

      setGeneratedLinks(prev => ({ ...prev, [tripId]: res.data }));
      
    } catch (e) {
      alert("Failed to generate links.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
          <Shield size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Safety Centre</h1>
          <p className="text-sm text-gray-400">Manage emergency contacts and live location sharing</p>
        </div>
      </div>

      {/* Panic Button Section */}
      <div className="bg-deep rounded-2xl border border-red-500/30 p-8 text-center relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white mb-2">Emergency SOS</h2>
          <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto">
            Press and hold the button for 3 seconds to instantly notify all your emergency contacts with your live location.
          </p>

          <button
            onPointerDown={startPanic}
            onPointerUp={cancelPanic}
            onPointerLeave={cancelPanic}
            disabled={sosTriggered}
            className={`
              relative w-48 h-48 rounded-full flex flex-col items-center justify-center mx-auto transition-all duration-300
              ${sosTriggered 
                ? 'bg-red-600 cursor-not-allowed scale-95 shadow-[0_0_50px_rgba(220,38,38,0.5)]' 
                : 'bg-red-500 hover:bg-red-600 active:scale-95 shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_50px_rgba(239,68,68,0.5)]'
              }
            `}
            style={{ touchAction: 'none' }}
          >
            {/* Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
              <circle
                cx="96" cy="96" r="90"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="12"
              />
              <circle
                cx="96" cy="96" r="90"
                fill="none"
                stroke="white"
                strokeWidth="12"
                strokeDasharray={565.48}
                strokeDashoffset={565.48 - (565.48 * panicProgress) / 100}
                className="transition-all duration-75 ease-linear"
              />
            </svg>

            <AlertTriangle size={48} className="text-white mb-2" />
            <span className="text-white font-bold text-xl tracking-wider">
              {sosTriggered ? "SOS SENT" : "HOLD SOS"}
            </span>
          </button>
        </div>

        {/* Pulsing red background effect when triggered */}
        {sosTriggered && (
          <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Emergency Contacts Section */}
      <div className="bg-surface rounded-2xl border border-line p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white">Emergency Contacts</h2>
          {contacts.length < 5 && (
            <button 
              onClick={() => setShowAddContact(!showAddContact)}
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              <UserPlus size={16} /> Add Contact
            </button>
          )}
        </div>

        {showAddContact && (
          <form onSubmit={handleAddContact} className="bg-deep p-4 rounded-xl border border-line mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                <input required type="text" className="t-input w-full" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                <input required type="email" className="t-input w-full" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
                <input type="text" className="t-input w-full" value={newContact.phoneNumber} onChange={e => setNewContact({...newContact, phoneNumber: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Relationship</label>
                <input type="text" className="t-input w-full" placeholder="e.g. Parent, Friend" value={newContact.relationship} onChange={e => setNewContact({...newContact, relationship: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddContact(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button type="submit" className="t-btn-primary px-4 py-2">Save Contact</button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {contacts.map((c) => (
            <div key={c.id} className="flex justify-between items-center p-3 rounded-xl bg-deep border border-line">
              <div>
                <p className="font-medium text-white">{c.name} <span className="text-xs text-gray-500 ml-2">{c.relationship}</span></p>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                  <span className="flex items-center gap-1"><Mail size={12}/> {c.email}</span>
                  {c.phoneNumber && <span className="flex items-center gap-1"><Phone size={12}/> {c.phoneNumber}</span>}
                </div>
                <div className="mt-2 text-xs">
                  {c.telegramConnected ? (
                    <span className="text-green-400 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> Telegram Connected
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500 flex items-center gap-1">
                        <AlertTriangle size={12} /> Telegram Not Connected
                      </span>
                      <button
                        onClick={() => {
                          const botUser = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "TravynSOSBot";
                          const link = `https://t.me/${botUser}?start=${c.id}`;
                          navigator.clipboard.writeText(link);
                          alert("Setup link copied! Send this to your contact.");
                        }}
                        className="text-primary hover:underline ml-2"
                      >
                        Copy Setup Link
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => handleDeleteContact(c.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {contacts.length === 0 && !showAddContact && (
            <p className="text-center text-gray-500 text-sm py-4">No emergency contacts added yet.</p>
          )}
        </div>
      </div>

      {/* Active Trips Location Sharing */}
      <div className="bg-surface rounded-2xl border border-line p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Navigation size={18} className="text-primary"/> Live Location Sharing
        </h2>
        
        <div className="space-y-4">
          {trips.map(trip => {
            const status = sharingStatus[trip.id] || {};
            const isActive = status.isActive || false;

            return (
              <div key={trip.id} className="p-4 rounded-xl border border-line bg-deep">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-white">{trip.title}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin size={12}/> {trip.destination}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => handleShareLinks(trip.id)}
                      className="t-btn-primary flex items-center gap-2 text-sm flex-1 sm:flex-none justify-center"
                    >
                      <LinkIcon size={14}/> Generate Tracker Links
                    </button>
                    
                    <button 
                      onClick={() => handleToggleSharing(trip.id, isActive)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-gray-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                {isActive && (
                  <div className="mt-4 pt-4 border-t border-line space-y-4">
                    <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 p-2 rounded-lg border border-primary/20">
                      <Navigation size={14} className="animate-pulse" />
                      Live tracking is active. Location updates every 5 mins.
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2 flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400"/> Accommodation Pin (Geofence)
                      </label>
                      <p className="text-xs text-gray-400 mb-3">
                        If you are stationary for {'>'}2 hours away from your accommodation, we will trigger a safety check-in.
                      </p>
                      
                      <div className="max-w-md">
                        <LocationAutocomplete
                          onSelect={(name: string, lat: number, lng: number) => handleSetAccommodation(trip.id, lat, lng, name)}
                          placeholder="Search for your hotel/hostel..."
                        />
                      </div>
                      
                      {status.accommodationLabel && (
                        <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                          <CheckCircle2 size={14}/> Pinned: {status.accommodationLabel}
                        </div>
                      )}
                    </div>

                    {generatedLinks[trip.id] && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold text-white mb-2">Generated Tracker Links</h4>
                        <div className="space-y-3">
                          {generatedLinks[trip.id].map((link: any, idx: number) => (
                            <div key={idx} className="bg-surface p-3 rounded-lg border border-line flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                              <div>
                                <p className="text-sm font-medium text-white">{link.contactName}</p>
                                <p className="text-xs text-gray-400">Expires: {new Date(link.expiresAt).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <input type="text" readOnly value={link.shareUrl} className="t-input text-xs w-full sm:w-64" />
                                <button onClick={() => copyToClipboard(link.shareUrl)} className="p-2 rounded bg-primary/20 text-primary hover:bg-primary/30">
                                  Copy
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {trips.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-4">You have no active trips to share location for.</p>
          )}
        </div>
      </div>
    </div>
  );
}
