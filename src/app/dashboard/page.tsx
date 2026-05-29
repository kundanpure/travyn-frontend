"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  MapPin, Plus, Users, User, Shield, TrendingUp,
  Compass, ArrowRight, Star, Calendar, Loader2, Info, Lock
} from "lucide-react";
import Link from "next/link";

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

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  accent = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col p-5 rounded-2xl transition-all hover:-translate-y-1 relative overflow-hidden"
      style={{
        background: "var(--color-bg-deep)",
        border: "1px solid var(--color-line)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
      }}
    >
      <div className="absolute -right-6 -top-6 opacity-5 transition-transform group-hover:scale-150 group-hover:opacity-10 duration-500">
        <Icon size={100} style={{ color: accent ? "var(--color-accent)" : "var(--color-primary)" }} />
      </div>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative z-10"
        style={{
          background: accent
            ? "linear-gradient(135deg, rgba(240, 160, 48, 0.2), rgba(240, 160, 48, 0.05))"
            : "linear-gradient(135deg, rgba(45, 212, 168, 0.2), rgba(45, 212, 168, 0.05))",
          color: accent ? "var(--color-accent)" : "var(--color-primary)",
          border: `1px solid ${accent ? 'rgba(240, 160, 48, 0.3)' : 'rgba(45, 212, 168, 0.3)'}`
        }}
      >
        <Icon size={24} />
      </div>
      <h3 className="font-semibold text-sm mb-1 relative z-10 transition-colors group-hover:text-white" style={{ color: "var(--color-txt-primary)" }}>
        {title}
      </h3>
      <p className="text-xs relative z-10" style={{ color: "var(--color-txt-muted)" }}>
        {description}
      </p>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [trips, setTrips] = useState<MyTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await api.get("/trips/my-trips");
      setTrips(res.data || []);
    } catch (e) {
      console.error("Failed to fetch trips", e);
    } finally {
      setLoading(false);
    }
  };

  const completedTrips = trips.filter(t => t.status === "COMPLETED").length;
  const activeTripsCount = trips.filter(t => t.memberStatus === "APPROVED").length;

  const upcomingTrips = trips
    .filter(t => t.memberStatus === "APPROVED" && new Date(t.startDate) > new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Glassmorphic Welcome Header */}
      <div
        className="rounded-3xl p-8 relative overflow-hidden group"
        style={{
          background: "linear-gradient(135deg, rgba(45, 212, 168, 0.1), rgba(240, 160, 48, 0.05))",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(45, 212, 168, 0.2)",
          boxShadow: "inset 0 0 40px rgba(45, 212, 168, 0.05)"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold tracking-wider uppercase px-2 py-1 rounded-full" style={{ background: "rgba(240,160,48,0.2)", color: "var(--color-accent)" }}>
                Level 1 Explorer
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight text-white drop-shadow-md">
              {getGreeting()}, {user?.firstName || "Traveler"} 👋
            </h1>
            <p className="text-sm md:text-base max-w-lg" style={{ color: "var(--color-txt-secondary)" }}>
              Ready for your next adventure? Complete your profile to boost your TrustScore and unlock better matches.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link href="/dashboard/profile" className="t-btn-primary group relative overflow-hidden" style={{ padding: "12px 24px" }}>
              <span className="relative z-10 flex items-center gap-2">
                <User size={18} /> Edit Profile
              </span>
            </Link>
          </div>
        </div>

        <Compass
          size={180}
          className="absolute -right-10 -bottom-10 opacity-10 transition-transform duration-[10s] group-hover:rotate-45 ease-linear"
          style={{ color: "var(--color-primary)" }}
        />
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* TrustScore (Placeholder with Glow) */}
        <div className="t-card relative overflow-hidden group" style={{ padding: 24, background: "var(--color-bg-deep)" }}>
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
            <Lock size={14} style={{ color: "var(--color-txt-muted)" }} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ background: "rgba(45,212,168,0.1)" }}>
              <Shield size={18} style={{ color: "var(--color-primary)" }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white">
              TrustScore
            </span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
              45
            </span>
            <span className="text-sm pb-1 font-medium" style={{ color: "var(--color-txt-muted)" }}>/100</span>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--color-txt-dim)" }}>Verify ID to boost score (Coming Soon)</p>
        </div>

        {/* Dynamic Trips Count */}
        <div className="t-card" style={{ padding: 24, background: "var(--color-bg-deep)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ background: "rgba(240,160,48,0.1)" }}>
              <MapPin size={18} style={{ color: "var(--color-accent)" }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white">
              Active Trips
            </span>
          </div>
          <div className="flex items-end gap-2">
            {loading ? (
              <Loader2 size={24} className="animate-spin text-gray-500" />
            ) : (
              <>
                <span className="text-3xl font-bold text-white">{activeTripsCount}</span>
                <span className="text-sm pb-1 font-medium" style={{ color: "var(--color-txt-muted)" }}>joined</span>
              </>
            )}
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--color-txt-dim)" }}>{completedTrips} completed total</p>
        </div>

        {/* Matches (Placeholder) */}
        <div className="t-card relative" style={{ padding: 24, background: "var(--color-bg-deep)", opacity: 0.8 }}>
          <div className="absolute top-0 right-0 p-3">
            <Lock size={14} style={{ color: "var(--color-txt-muted)" }} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ background: "rgba(244,114,182,0.1)" }}>
              <Users size={18} style={{ color: "#f472b6" }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white">
              Matches
            </span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">0</span>
            <span className="text-sm pb-1 font-medium" style={{ color: "var(--color-txt-muted)" }}>pending</span>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--color-txt-dim)" }}>AI Engine unlocking soon</p>
        </div>

        {/* Rating (Placeholder) */}
        <div className="t-card relative" style={{ padding: 24, background: "var(--color-bg-deep)", opacity: 0.8 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ background: "rgba(251,191,36,0.1)" }}>
              <Star size={18} style={{ color: "#fbbf24" }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white">
              Rating
            </span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">—</span>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--color-txt-dim)" }}>Complete a trip to unlock reviews</p>
        </div>
      </div>

      {/* Main Two Column Layout */}
      <div className="grid lg:grid-cols-12 gap-8">

        {/* Upcoming Trips Feed (Spans 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar size={20} style={{ color: "var(--color-primary)" }} /> Upcoming Adventures
            </h2>
            <Link
              href="/dashboard/my-trips"
              className="text-xs font-medium hover:underline"
              style={{ color: "var(--color-accent)" }}
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl" style={{ background: "var(--color-bg-deep)", border: "1px dashed var(--color-line)" }}>
              <Loader2 size={32} className="animate-spin mb-4" style={{ color: "var(--color-primary)" }} />
              <p className="text-sm" style={{ color: "var(--color-txt-muted)" }}>Loading your itinerary...</p>
            </div>
          ) : upcomingTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-3xl text-center px-4"
              style={{ background: "linear-gradient(180deg, var(--color-bg-deep) 0%, rgba(10,12,16,0) 100%)", border: "1px solid var(--color-line)" }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: "rgba(45,212,168,0.1)" }}>
                <MapPin size={32} style={{ color: "var(--color-primary)" }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No upcoming trips</h3>
              <p className="text-sm max-w-sm mb-8" style={{ color: "var(--color-txt-secondary)" }}>
                The world is waiting! Join a curated group trip or start planning your own solo adventure today.
              </p>
              <div className="flex gap-4">
                <Link href="/dashboard/trips/create" className="t-btn-primary" style={{ padding: "10px 24px" }}>
                  <Plus size={16} className="mr-2" /> Create Trip
                </Link>
                <Link href="/dashboard/discover" className="t-btn-outline" style={{ padding: "10px 24px", color: "white", borderColor: "var(--color-line)" }}>
                  Discover
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingTrips.map(trip => (
                <Link
                  key={trip.id}
                  href={`/dashboard/trips/${trip.id}`}
                  className="group block relative overflow-hidden rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-900/20"
                  style={{ border: "1px solid var(--color-line)", background: "var(--color-bg-deep)" }}
                >
                  {/* Banner Image or Gradient Fallback */}
                  <div className="h-24 w-full relative">
                    {trip.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={trip.coverImageUrl} alt={trip.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-emerald-900/40 to-slate-900" />
                    )}
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md"
                        style={{ background: "rgba(0,0,0,0.6)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {new Date(trip.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 relative z-10 bg-gradient-to-t from-gray-950 via-gray-900 to-transparent -mt-10 pt-12">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{trip.title}</h3>
                    <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--color-txt-secondary)" }}>
                      <MapPin size={14} /> {trip.destination}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Grid (Spans 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp size={20} style={{ color: "var(--color-accent)" }} /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <QuickActionCard
              icon={Plus}
              title="Plan Trip"
              description="Start a new adventure"
              href="/dashboard/trips/create"
            />
            <QuickActionCard
              icon={Compass}
              title="Discover"
              description="Browse curated trips"
              href="/dashboard/discover"
              accent
            />
            <QuickActionCard
              icon={User}
              title="Profile"
              description="Add your travel style"
              href="/dashboard/profile"
            />
            <QuickActionCard
              icon={Shield}
              title="Safety Hub"
              description="Manage emergency contacts"
              href="/dashboard/safety"
              accent
            />
          </div>

          {/* Trust Banner */}
          <div className="mt-6 p-5 rounded-2xl flex items-start gap-4" style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.1)" }}>
            <Info size={24} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Verify Your Identity</h4>
              <p className="text-xs text-blue-200/70 mb-3">
                Nomadly requires identity verification to unlock matching features and increase trust across the network.
              </p>
              <Link href="/dashboard/settings/kyc" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors inline-block mt-1">
                Start Verification →
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
