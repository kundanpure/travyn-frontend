"use client";

import { useAuthStore } from "@/stores/auth-store";
import { Suspense, useState, useEffect } from "react";
import api from "@/lib/api";
import {
  MapPin, Plus, Users, Calendar, Loader2, Mountain,
  Compass, ArrowRight, Navigation, Crown, User,
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
  creatorAvatar?: string;
  memberCount: number;
  maxSize: number;
  tags: string[];
  status: string;
  memberStatus?: string;
  memberRole?: string;
  availableSpots: number;
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

const typeColors: Record<string, string> = {
  BACKPACKING: "#16A34A",
  LUXURY: "#F59E0B",
  ROAD_TRIP: "#3B82F6",
  CULTURAL: "#8B5CF6",
  ADVENTURE: "#EC4899",
  WEEKEND: "#14B8A6",
  REMOTE_WORK: "#F59E0B",
};

const tripTypeLabels = [
  { value: "", label: "All" },
  { value: "BACKPACKING", label: "🎒 Backpacking" },
  { value: "ADVENTURE", label: "⛰️ Adventure" },
  { value: "CULTURAL", label: "🏛️ Cultural" },
  { value: "ROAD_TRIP", label: "🚗 Road Trip" },
  { value: "LUXURY", label: "✨ Luxury" },
  { value: "WEEKEND", label: "🌅 Weekend" },
  { value: "REMOTE_WORK", label: "💻 Remote" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function DashboardContent() {
  const { user } = useAuthStore();

  const [discoveryTrips, setDiscoveryTrips] = useState<TripCard[]>([]);
  const [myTrips, setMyTrips] = useState<MyTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("");

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const discoveryPromise = api.get(`/trips?statusFilter=OPEN&page=0&size=20`).catch(e => {
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

      const filtered = availableTrips.filter((t: TripCard) =>
        t.creatorId !== user?.id &&
        !myTripsData?.some((myT: MyTrip) => myT.id === t.id)
      );

      setDiscoveryTrips(filtered.sort(() => 0.5 - Math.random()));
      setMyTrips(myTripsData);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const ongoingTrips = myTrips
    .filter(t => {
      if (t.memberStatus !== "APPROVED") return false;
      if (t.status === "IN_PROGRESS") return true;
      if (t.startDate && t.endDate) {
        const start = new Date(t.startDate);
        const end = new Date(t.endDate);
        end.setHours(23, 59, 59, 999);
        return start <= now && now <= end;
      }
      return false;
    })
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

  const upcomingTrips = myTrips
    .filter(t => {
      if (t.memberStatus !== "APPROVED") return false;
      if (t.status === "COMPLETED" || t.status === "CANCELLED") return false;
      return !ongoingTrips.some(ot => ot.id === t.id);
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const filteredTrips = selectedType
    ? discoveryTrips.filter(t => t.tripType === selectedType)
    : discoveryTrips;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 h-full">
        <Loader2 size={32} className="animate-spin mb-4" style={{ color: "var(--brand)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Loading your trips...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-8 overflow-hidden">

      {/* ─── GREETING ─── */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-family-display)" }}
        >
          {getGreeting()}, {user?.firstName || "Traveler"} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Find your next adventure
        </p>
      </div>

      {/* ─── ONGOING TRIP BANNER ─── */}
      {ongoingTrips.length > 0 && (
        <div className="space-y-3">
          {ongoingTrips.map(trip => (
            <Link
              key={trip.id}
              href={`/dashboard/trips/${trip.id}`}
              className="flex items-center gap-4 p-4 rounded-xl group transition-all"
              style={{
                background: "var(--brand-light)",
                border: "1px solid var(--brand)",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--brand)", color: "white" }}
              >
                <Navigation size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: "var(--brand)" }}
                  >
                    Ongoing Trip
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    · Ends {formatDate(trip.endDate)}
                  </span>
                </div>
                <h3
                  className="font-semibold truncate"
                  style={{ color: "var(--text-primary)", fontSize: "0.95rem" }}
                >
                  {trip.title}
                </h3>
                <p className="text-xs flex items-center gap-1 mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                  <MapPin size={11} className="flex-shrink-0" /> {trip.destination}
                </p>
              </div>
              <ArrowRight
                size={18}
                className="flex-shrink-0 group-hover:translate-x-1 transition-transform"
                style={{ color: "var(--brand)" }}
              />
            </Link>
          ))}
        </div>
      )}

      {/* ─── ONGOING & UPCOMING TRIPS (Horizontal scroll) ─── */}
      {(ongoingTrips.length > 0 || upcomingTrips.length > 0) && (
        <div>
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            {ongoingTrips.length > 0 ? "Your Active & Upcoming Trips" : "Your Upcoming Trips"}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {/* Ongoing Trips Cards */}
            {ongoingTrips.map(trip => (
              <Link
                key={trip.id}
                href={`/dashboard/trips/${trip.id}`}
                className="snap-start shrink-0 w-56 rounded-xl overflow-hidden group transition-all"
                style={{
                  background: "var(--bg-card)",
                  border: "1.5px solid var(--brand)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div className="h-24 w-full relative overflow-hidden">
                  {trip.coverImageUrl ? (
                    <img
                      src={trip.coverImageUrl}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: "var(--brand-light)" }}
                    >
                      <Mountain size={28} style={{ color: "var(--brand)", opacity: 0.8 }} />
                    </div>
                  )}
                  <div
                    className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"
                    style={{
                      background: "var(--brand)",
                      color: "white",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    ONGOING
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    {trip.memberRole === "CREATOR" ? (
                      <Crown size={12} style={{ color: "var(--accent)" }} />
                    ) : (
                      <User size={12} style={{ color: "var(--brand)" }} />
                    )}
                    <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                      {trip.memberRole === "CREATOR" ? "Creator" : "Member"}
                    </span>
                  </div>
                  <h3
                    className="font-semibold text-sm truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {trip.title}
                  </h3>
                  <p className="text-xs truncate flex items-center gap-1 mt-0.5" style={{ color: "var(--text-muted)" }}>
                    <MapPin size={10} /> {trip.destination}
                  </p>
                </div>
              </Link>
            ))}

            {/* Upcoming Trips Cards */}
            {upcomingTrips.map(trip => (
              <Link
                key={trip.id}
                href={`/dashboard/trips/${trip.id}`}
                className="snap-start shrink-0 w-56 rounded-xl overflow-hidden group transition-all"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div className="h-24 w-full relative overflow-hidden">
                  {trip.coverImageUrl ? (
                    <img
                      src={trip.coverImageUrl}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: "var(--bg-tertiary)" }}
                    >
                      <Mountain size={28} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                    </div>
                  )}
                  <div
                    className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold"
                    style={{
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {formatDate(trip.startDate)}
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    {trip.memberRole === "CREATOR" ? (
                      <Crown size={12} style={{ color: "var(--accent)" }} />
                    ) : (
                      <User size={12} style={{ color: "var(--brand)" }} />
                    )}
                    <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                      {trip.memberRole === "CREATOR" ? "Creator" : "Member"}
                    </span>
                  </div>
                  <h3
                    className="font-semibold text-sm truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {trip.title}
                  </h3>
                  <p className="text-xs truncate flex items-center gap-1 mt-0.5" style={{ color: "var(--text-muted)" }}>
                    <MapPin size={10} /> {trip.destination}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}


      {/* ─── DISCOVER SECTION ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-family-display)" }}
          >
            <Compass size={20} style={{ color: "var(--brand)" }} />
            {"Discover Trips"}
          </h2>
          <Link
            href="/dashboard/trips/create"
            className="t-btn-primary"
            style={{ padding: "8px 16px", fontSize: "0.8rem" }}
          >
            <Plus size={16} /> New Trip
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 hide-scrollbar mb-4">
          {tripTypeLabels.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSelectedType(value)}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: selectedType === value ? "var(--brand)" : "var(--bg-tertiary)",
                color: selectedType === value ? "white" : "var(--text-secondary)",
                border: `1px solid ${selectedType === value ? "var(--brand)" : "var(--border)"}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Trip Grid */}
        {filteredTrips.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center flex flex-col items-center"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: "var(--brand-light)" }}
            >
              <Mountain size={28} style={{ color: "var(--brand)" }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              No trips found
            </h3>
            <p className="text-sm max-w-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              {selectedType
                ? "No trips match this filter. Try another category or create your own!"
                : "Be the first to create an adventure and let others join!"}
            </p>
            <Link href="/dashboard/trips/create" className="t-btn-primary">
              <Plus size={18} /> Create Trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTrips.map(trip => (
              <Link
                key={trip.id}
                href={`/dashboard/trips/${trip.id}`}
                className="group rounded-xl overflow-hidden transition-all"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                  textDecoration: "none",
                }}
              >
                {/* Cover Image */}
                <div className="h-40 relative overflow-hidden">
                  {trip.coverImageUrl ? (
                    <img
                      src={trip.coverImageUrl}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${typeColors[trip.tripType] || "var(--brand)"}15, ${typeColors[trip.tripType] || "var(--brand)"}05)`,
                      }}
                    >
                      <Mountain size={40} style={{ color: "var(--text-muted)", opacity: 0.3 }} />
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                  {/* Type badge */}
                  <span
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold"
                    style={{
                      background: "var(--bg-card)",
                      color: typeColors[trip.tripType] || "var(--brand)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {trip.tripType?.replace("_", " ")}
                  </span>

                  {/* Women only badge */}
                  {trip.womenOnly && (
                    <span
                      className="absolute top-3 right-3 px-2 py-1 rounded-md text-[10px] font-bold"
                      style={{ background: "var(--bg-card)", color: "#EC4899", boxShadow: "var(--shadow-sm)" }}
                    >
                      Women Only
                    </span>
                  )}

                  {/* Spots left — bottom right */}
                  <div
                    className="absolute bottom-3 right-3 px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1"
                    style={{
                      background: "var(--bg-card)",
                      color: trip.availableSpots <= 2 ? "var(--danger)" : "var(--text-secondary)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <Users size={12} />
                    {trip.availableSpots}/{trip.maxSize}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3
                    className="font-semibold text-base mb-1 group-hover:text-[var(--brand)] transition-colors"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {trip.title}
                  </h3>

                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin size={13} style={{ color: "var(--brand)" }} />
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {trip.destination}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-3">
                    <Calendar size={13} style={{ color: "var(--text-muted)" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                    </span>
                  </div>

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between pt-3"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      by {trip.creatorName}
                    </span>
                    <span
                      className="text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
                      style={{ color: "var(--brand)" }}
                    >
                      View Details <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="animate-spin" size={32} style={{ color: "var(--brand)" }} />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
