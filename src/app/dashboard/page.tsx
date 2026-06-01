"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  MapPin, Plus, Users, User, Calendar, Loader2, Crown, Mountain, Heart, X, Check, Coffee, Landmark, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { VibeCheckModal } from "@/app/dashboard/components/VibeCheckModal";

interface TripCard {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  tripType: string;
  coverImageUrl?: string;
  creatorName: string;
  availableSpots: number;
  womenOnly: boolean;
  minBudget: number | null;
  maxBudget: number | null;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [trips, setTrips] = useState<TripCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [vibeChecked, setVibeChecked] = useState(true); // Default true to prevent flash
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Check if they've done the vibe check this session
    const hasChecked = sessionStorage.getItem("travyn_vibe_check");
    if (!hasChecked) {
      setVibeChecked(false);
    }
    fetchDiscoveryTrips();
  }, []);

  const fetchDiscoveryTrips = async () => {
    try {
      // Fetch open, upcoming trips that the user hasn't created
      // For the demo, we fetch page 0 of open trips
      const res = await api.get("/trips?status=OPEN&page=0&size=20");
      
      // Filter out trips the user created (if not already handled by backend)
      const availableTrips = res.data.content.filter((t: any) => t.creatorId !== user?.id);
      
      // Shuffle them for a more random discovery feel
      const shuffled = availableTrips.sort(() => 0.5 - Math.random());
      setTrips(shuffled);
    } catch (e) {
      console.error("Failed to fetch trips", e);
    } finally {
      setLoading(false);
    }
  };

  const handleVibeSelect = (vibe: string) => {
    sessionStorage.setItem("travyn_vibe_check", vibe);
    setVibeChecked(true);
    // Optional: We could re-fetch trips filtered by the vibe here
  };

  const currentTrip = trips[currentIndex];

  const handlePass = () => {
    // Just move to the next card
    setCurrentIndex(prev => prev + 1);
  };

  const handleJoin = async () => {
    if (!currentTrip) return;
    setActionLoading(true);
    try {
      await api.post(`/trips/${currentTrip.id}/join`);
      alert(`Request sent to join ${currentTrip.title}!`);
      setCurrentIndex(prev => prev + 1);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to send request. You might have already requested.");
      setCurrentIndex(prev => prev + 1); // Skip it anyway if it fails
    } finally {
      setActionLoading(false);
    }
  };

  if (!vibeChecked) {
    return <VibeCheckModal onSelect={handleVibeSelect} />;
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      
      {/* Left Column: The Discovery Stack */}
      <div className="flex-1 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="text-emerald-400" /> Discover Adventures
          </h2>
          <span className="text-sm font-medium text-gray-500">
            {currentIndex + 1} / {trips.length || 1}
          </span>
        </div>

        {loading ? (
          <div className="flex-1 rounded-3xl flex flex-col items-center justify-center bg-gray-900/30 border border-gray-800">
            <Loader2 size={40} className="animate-spin text-emerald-500 mb-4" />
            <p className="text-gray-400">Finding perfect matches...</p>
          </div>
        ) : !currentTrip ? (
          <div className="flex-1 rounded-3xl flex flex-col items-center justify-center bg-gradient-to-b from-gray-900/50 to-transparent border border-gray-800/50 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <Check size={32} className="text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">You're all caught up!</h3>
            <p className="text-gray-400 max-w-sm mb-8">
              You've seen all the upcoming trips. Why not create your own adventure and let others join you?
            </p>
            <Link href="/dashboard/trips/create" className="t-btn-primary px-8 py-3 rounded-full font-bold shadow-lg shadow-emerald-500/20">
              <Plus size={20} className="inline mr-2" /> Create a Trip
            </Link>
          </div>
        ) : (
          <div className="flex-1 relative rounded-3xl overflow-hidden group bg-gray-900 border border-gray-800 shadow-2xl flex flex-col">
            {/* Image Section */}
            <div className="relative flex-1 bg-gray-950 min-h-[50%]">
              {currentTrip.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentTrip.coverImageUrl} alt={currentTrip.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-slate-900 flex items-center justify-center">
                  <Mountain size={64} className="text-white/10" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-black/50 backdrop-blur-md text-emerald-400 border border-white/10 shadow-sm">
                  {currentTrip.tripType.replace("_", " ")}
                </span>
                {currentTrip.womenOnly && (
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-pink-500/20 backdrop-blur-md text-pink-400 border border-pink-500/20">
                    <Heart size={12} className="inline mr-1" /> Women Only
                  </span>
                )}
              </div>

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 pt-20">
                <div className="flex items-center gap-2 mb-2 text-gray-300 font-medium text-sm">
                  <MapPin size={16} className="text-emerald-400" />
                  {currentTrip.destination}
                </div>
                <h3 className="text-3xl font-extrabold text-white mb-4 drop-shadow-md leading-tight">
                  {currentTrip.title}
                </h3>
                
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/5">
                    <Calendar size={18} className="text-blue-400" />
                    <div className="text-sm">
                      <div className="text-gray-400 text-xs">Dates</div>
                      <div className="text-white font-medium">{new Date(currentTrip.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/5">
                    <Users size={18} className="text-orange-400" />
                    <div className="text-sm">
                      <div className="text-gray-400 text-xs">Available</div>
                      <div className="text-white font-medium">{currentTrip.availableSpots} Spots Left</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 bg-gray-950 border-t border-gray-800 flex justify-center gap-6">
              <button
                onClick={handlePass}
                disabled={actionLoading}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-900 border border-gray-800 text-gray-400 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/30 transition-all shadow-lg active:scale-95"
              >
                <X size={28} />
              </button>
              
              <Link
                href={`/dashboard/trips/${currentTrip.id}`}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-900 border border-gray-800 text-gray-400 hover:text-blue-400 hover:border-blue-900/50 hover:bg-blue-950/30 transition-all shadow-lg active:scale-95"
              >
                <ChevronRight size={28} />
              </Link>

              <button
                onClick={handleJoin}
                disabled={actionLoading}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-900/30 active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 size={28} className="animate-spin" /> : <Heart size={28} className="fill-black" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Mini Profile & Links (Hidden on small screens) */}
      <div className="hidden md:flex flex-col w-80 shrink-0 gap-4">
        {/* User Mini Profile */}
        <Link href="/dashboard/profile" className="block p-5 rounded-3xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-black font-bold text-xl shadow-inner">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{user?.firstName} {user?.lastName}</h3>
              <p className="text-xs text-gray-500">View Profile</p>
            </div>
          </div>
        </Link>

        {/* Quick Links */}
        <div className="p-5 rounded-3xl bg-gray-900 border border-gray-800 space-y-2">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Navigation</h4>
          <Link href="/dashboard/my-trips" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
            <MapPin size={18} className="text-blue-400" /> My Trips
          </Link>
          <Link href="/dashboard/matches" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
            <Users size={18} className="text-pink-400" /> Matches
          </Link>
          <Link href="/dashboard/trips/create" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
            <Plus size={18} className="text-emerald-400" /> Create Trip
          </Link>
        </div>

        {/* Tip Box */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-900/20 to-transparent border border-emerald-900/30 mt-auto">
          <div className="flex items-center gap-2 mb-2">
            <Crown size={16} className="text-emerald-400" />
            <h4 className="font-bold text-white text-sm">Pro Tip</h4>
          </div>
          <p className="text-xs text-emerald-200/70 leading-relaxed">
            Swipe right (Heart) to request to join a trip. Swipe left (X) to pass. Click the arrow to view full details!
          </p>
        </div>
      </div>

    </div>
  );
}
