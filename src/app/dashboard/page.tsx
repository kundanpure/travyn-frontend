"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  MapPin, Plus, Users, User, Calendar, Loader2, Crown, Mountain, Heart, Share2, Eye, Compass, Copy, Check,
  CheckCircle, AlertTriangle
} from "lucide-react";
import Link from "next/link";

interface TripCard {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  tripType: string;
  coverImageUrl?: string;
  creatorId: string;
  creatorName: string;
  availableSpots: number;
  maxSize: number;
  womenOnly: boolean;
  description: string;
  tripCode: string;
  createdAt: string;
  creatorVerified?: boolean;
}

interface MyTrip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
  coverImageUrl?: string;
  memberRole: string;
  memberStatus: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [discoveryTrips, setDiscoveryTrips] = useState<TripCard[]>([]);
  const [myTrips, setMyTrips] = useState<MyTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    // If user isn't loaded yet from the store, we can still fetch discovery trips,
    // but re-fetch once the user ID is available to ensure we get their personal trips.
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      // Fetch concurrently for speed, but handle errors individually
      const discoveryPromise = api.get("/trips?status=OPEN&page=0&size=20").catch(e => {
        console.error("Failed to fetch discovery trips", e);
        return { data: { content: [] } };
      });
      
      const myTripsPromise = api.get("/trips/my-trips").catch(e => {
        console.error("Failed to fetch my trips", e);
        return { data: [] };
      });

      const [discoveryRes, myTripsRes] = await Promise.all([discoveryPromise, myTripsPromise]);
      
      const availableTrips = discoveryRes.data?.content || [];
      const myTripsData = myTripsRes.data || [];
      
      // Filter out trips the user created or is already a member of
      const filtered = availableTrips.filter((t: TripCard) => 
        t.creatorId !== user?.id && 
        !myTripsData?.some((myT: MyTrip) => myT.id === t.id)
      );
      
      // Shuffle for discovery feed
      setDiscoveryTrips(filtered.sort(() => 0.5 - Math.random()));
      setMyTrips(myTripsData);
    } finally {
      setLoading(false);
    }
  };

  const upcomingTrips = myTrips
    .filter(t => t.memberStatus === "APPROVED" && new Date(t.startDate) > new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const handleJoin = async (tripId: string) => {
    setActionLoading(tripId);
    try {
      await api.post(`/trips/${tripId}/join`);
      alert("Join request sent successfully! The creator will review your request.");
      // Remove from feed
      setDiscoveryTrips(prev => prev.filter(t => t.id !== tripId));
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to send request. You might have already requested.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleShare = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getTimeAgo = (dateString: string) => {
    const days = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 3600 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "1d ago";
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 h-full">
        <Loader2 size={40} className="animate-spin text-emerald-500 mb-4" />
        <p className="text-gray-400 font-medium animate-pulse">Loading your feed...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 pb-10">
      
      {/* Main Feed Column */}
      <div className="flex-1 space-y-6 max-w-2xl mx-auto w-full">
        
        {/* My Upcoming Trips (Horizontal Stories Style) */}
        {upcomingTrips.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Your Upcoming Adventures</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar px-2">
              {upcomingTrips.map(trip => (
                <Link
                  key={trip.id}
                  href={`/dashboard/trips/${trip.id}`}
                  className="snap-start shrink-0 w-64 rounded-2xl overflow-hidden group border border-gray-800 bg-gray-900 relative transition-transform hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-900/20"
                >
                  <div className="h-28 w-full relative">
                    {trip.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={trip.coverImageUrl} alt={trip.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-slate-900" />
                    )}
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/10">
                      {new Date(trip.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <div className="p-4 relative">
                    <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-900 absolute -top-5 left-4 flex items-center justify-center shadow-lg">
                      {trip.memberRole === "CREATOR" ? <Crown size={16} className="text-emerald-400" /> : <User size={16} className="text-blue-400" />}
                    </div>
                    <h3 className="font-bold text-white text-sm truncate mt-3">{trip.title}</h3>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-1">
                      <MapPin size={10} /> {trip.destination}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Discovery Feed Header */}
        <div className="flex items-center justify-between px-2 mb-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Compass className="text-emerald-400" /> Discover Trips
          </h2>
        </div>

        {/* The Feed */}
        {discoveryTrips.length === 0 ? (
          <div className="rounded-3xl border border-gray-800 bg-gray-900/50 p-10 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <Mountain size={32} className="text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No new trips right now</h3>
            <p className="text-gray-400 text-sm max-w-sm mb-8">
              You've seen all the upcoming trips. Be the first to create an adventure and let others join you!
            </p>
            <Link href="/dashboard/trips/create" className="t-btn-primary px-6 py-2.5 rounded-full font-bold">
              <Plus size={18} className="inline mr-2" /> Create Trip
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {discoveryTrips.map(trip => (
              <div key={trip.id} className="rounded-3xl border border-gray-800 bg-gray-900 overflow-hidden shadow-xl">
                
                {/* Post Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-black font-bold text-sm shadow-inner relative">
                      {trip.creatorName.charAt(0)}
                      {trip.creatorVerified ? (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center" style={{ boxShadow: "0 0 0 2px #111827" }}>
                          <CheckCircle size={10} style={{ color: "#2dd4a8" }} />
                        </span>
                      ) : (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black" style={{ background: "#fbbf24", color: "#1a1a1a", boxShadow: "0 0 0 2px #111827" }}>
                          !
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm hover:underline cursor-pointer">{trip.creatorName}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        {getTimeAgo(trip.createdAt || new Date().toISOString())}
                        <span>•</span>
                        <span className="text-emerald-400/80">{trip.tripType.replace("_", " ")}</span>
                      </div>
                    </div>
                  </div>
                  {trip.womenOnly && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                      <Heart size={10} className="inline mr-1" /> Women Only
                    </span>
                  )}
                </div>

                {/* Post Image */}
                <Link href={`/dashboard/trips/${trip.id}`} className="block relative bg-gray-950 aspect-[4/3] w-full overflow-hidden group cursor-pointer">
                  {trip.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={trip.coverImageUrl} alt={trip.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-slate-900 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                      <Mountain size={64} className="text-white/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-extrabold text-white drop-shadow-md">{trip.title}</h3>
                  </div>
                </Link>

                {/* Action Bar */}
                <div className="px-4 py-3 border-b border-gray-800/50 flex items-center gap-4">
                  <button
                    onClick={() => handleJoin(trip.id)}
                    disabled={actionLoading === trip.id}
                    className="flex items-center gap-2 font-semibold text-sm transition-colors hover:text-pink-400 active:scale-95 disabled:opacity-50"
                    style={{ color: "white" }}
                  >
                    {actionLoading === trip.id ? <Loader2 size={24} className="animate-spin" /> : <Heart size={24} className="hover:fill-pink-400/20 transition-colors" />}
                    Join
                  </button>
                  <Link
                    href={`/dashboard/trips/${trip.id}`}
                    className="flex items-center gap-2 font-semibold text-sm text-white hover:text-blue-400 transition-colors active:scale-95"
                  >
                    <Eye size={24} /> View
                  </Link>
                  <button
                    onClick={() => handleShare(trip.tripCode)}
                    className="flex items-center gap-2 font-semibold text-sm text-white hover:text-emerald-400 transition-colors active:scale-95 ml-auto"
                  >
                    {copiedCode === trip.tripCode ? <Check size={20} className="text-emerald-400" /> : <Share2 size={20} />}
                  </button>
                </div>

                {/* Post Details */}
                <div className="p-4 pt-2 space-y-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center gap-1.5 font-medium text-gray-200">
                      <MapPin size={14} className="text-emerald-400" /> {trip.destination}
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-gray-200">
                      <Calendar size={14} className="text-blue-400" /> 
                      {new Date(trip.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(trip.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-gray-200">
                      <Users size={14} className="text-orange-400" /> {trip.availableSpots} / {trip.maxSize} spots left
                    </div>
                  </div>
                  
                  {trip.description && (
                    <div className="text-sm text-gray-400 leading-relaxed line-clamp-2">
                      <span className="font-bold text-gray-300 mr-2">{trip.creatorName}</span>
                      {trip.description}
                    </div>
                  )}
                  
                  <Link href={`/dashboard/trips/${trip.id}`} className="text-xs text-gray-500 hover:text-gray-300 transition-colors font-medium">
                    View full itinerary...
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: User Profile & Links (Sticky on Desktop) */}
      <div className="hidden lg:block w-80 shrink-0">
        <div className="sticky top-24 space-y-4">
          
          {/* User Mini Profile */}
          <Link href="/dashboard/profile" className="block p-5 rounded-3xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-black font-bold text-xl shadow-inner">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div>
                <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{user?.firstName} {user?.lastName}</h3>
                <p className="text-xs text-gray-500">View Profile</p>
              </div>
            </div>
          </Link>

          {/* Create Button */}
          <Link href="/dashboard/trips/create" className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
            <Plus size={20} /> Create New Trip
          </Link>

          {/* Quick Links */}
          <div className="p-5 rounded-3xl bg-gray-900 border border-gray-800 space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Navigation</h4>
            <Link href="/dashboard/my-trips" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
              <MapPin size={18} className="text-blue-400" /> Manage My Trips
            </Link>
            <Link href="/dashboard/matches" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
              <Users size={18} className="text-pink-400" /> Pending Matches
            </Link>
          </div>

          <div className="text-xs text-gray-600 text-center pt-4">
            © 2026 Travyn. All rights reserved.
          </div>
        </div>
      </div>

    </div>
  );
}
