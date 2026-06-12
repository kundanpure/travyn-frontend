"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass, Plus, Search, MapPin, Calendar, Users, Filter, Loader2,
  Heart, ArrowRight, X
} from "lucide-react";
import api from "@/lib/api";

const tripTypes = [
  { value: "", label: "All Types" },
  { value: "BACKPACKING", label: "Backpacking" },
  { value: "LUXURY", label: "Luxury" },
  { value: "ROAD_TRIP", label: "Road Trip" },
  { value: "CULTURAL", label: "Cultural" },
  { value: "ADVENTURE", label: "Adventure" },
  { value: "WEEKEND", label: "Weekend" },
  { value: "REMOTE_WORK", label: "Remote Work" },
];

const typeColors: Record<string, string> = {
  BACKPACKING: "#2dd4a8", LUXURY: "#f0a030", ROAD_TRIP: "#60a5fa",
  CULTURAL: "#a78bfa", ADVENTURE: "#f472b6", WEEKEND: "#34d399", REMOTE_WORK: "#fbbf24",
};

interface TripCard {
  id: string;
  title: string;
  destination: string;
  coverImageUrl: string;
  startDate: string;
  endDate: string;
  tripType: string;
  spotsLeft: number;
  maxSize: number;
  memberCount: number;
  creatorName: string;
  womenOnly: boolean;
  tags: string;
}

export default function DiscoverPage() {
  const [trips, setTrips] = useState<TripCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState("");
  const [tripType, setTripType] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchTrips = async (reset = true) => {
    setLoading(true);
    try {
      const p = reset ? 0 : page;
      const params = new URLSearchParams({ page: String(p), size: "12" });
      if (destination) params.set("destination", destination);
      if (tripType) params.set("type", tripType);
      if (statusFilter) params.set("statusFilter", statusFilter);

      const res = await api.get(`/trips?${params}`);
      const data = res.data.content || res.data || [];
      if (reset) {
        setTrips(data);
        setPage(1);
      } else {
        setTrips((prev) => [...prev, ...data]);
        setPage(p + 1);
      }
      setHasMore(data.length === 12);
    } catch {
      if (reset) setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTrips(true);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-txt-white)" }}>
            Discover Trips
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-txt-secondary)" }}>
            Find your next adventure with verified travelers
          </p>
        </div>
        <Link
          href="/dashboard/trips/create"
          className="t-btn-primary flex items-center gap-2"
          style={{ padding: "12px 20px", textDecoration: "none" }}
        >
          <Plus size={18} /> Create Trip
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
      >
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-txt-muted)" }} />
            <input
              type="text"
              className="t-input w-full"
              style={{ paddingLeft: 36 }}
              placeholder="Search by destination..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <select
            className="t-input w-full md:w-[160px]"
            value={tripType}
            onChange={(e) => setTripType(e.target.value)}
          >
            {tripTypes.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            className="t-input w-full md:w-[160px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Trips</option>
            <option value="OPEN">Open Trips</option>
            <option value="UPCOMING">Upcoming Trips</option>
            <option value="ONGOING">Ongoing Trips</option>
            <option value="COMPLETED">Completed Trips</option>
            <option value="CLOSED">Closed Trips</option>
          </select>
          <button
            onClick={handleSearch}
            className="t-btn-primary flex items-center justify-center gap-2 w-full md:w-auto"
            style={{ padding: "10px 20px" }}
          >
            <Search size={16} /> Search
          </button>
        </div>
      </div>

      {/* Trip Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden animate-pulse"
              style={{ background: "var(--color-bg-surface)", height: 360 }}
            >
              <div className="h-40" style={{ background: "var(--color-bg-deep)" }} />
              <div className="p-5 space-y-3">
                <div className="h-4 rounded" style={{ background: "var(--color-bg-deep)", width: "70%" }} />
                <div className="h-3 rounded" style={{ background: "var(--color-bg-deep)", width: "50%" }} />
                <div className="h-3 rounded" style={{ background: "var(--color-bg-deep)", width: "40%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
        >
          <Compass size={48} className="mx-auto mb-4" style={{ color: "var(--color-txt-muted)" }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-txt-white)" }}>
            No Trips Found
          </h3>
          <p className="text-sm mb-6" style={{ color: "var(--color-txt-secondary)" }}>
            Be the first to create an adventure!
          </p>
          <Link
            href="/dashboard/trips/create"
            className="t-btn-primary inline-flex items-center gap-2"
            style={{ padding: "12px 24px", textDecoration: "none" }}
          >
            <Plus size={16} /> Create a Trip
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/dashboard/trips/${trip.id}`}
                className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-line)",
                  textDecoration: "none",
                }}
              >
                {/* Cover */}
                <div
                  className="h-40 relative overflow-hidden"
                  style={{
                    background: trip.coverImageUrl
                      ? `url(${trip.coverImageUrl}) center/cover`
                      : `linear-gradient(135deg, ${typeColors[trip.tripType] || "#2dd4a8"}30, ${typeColors[trip.tripType] || "#2dd4a8"}10)`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {/* Type Badge */}
                  <span
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    style={{
                      background: `${typeColors[trip.tripType] || "#2dd4a8"}20`,
                      color: typeColors[trip.tripType] || "#2dd4a8",
                      backdropFilter: "blur(8px)",
                      border: `1px solid ${typeColors[trip.tripType] || "#2dd4a8"}30`,
                    }}
                  >
                    {trip.tripType?.replace("_", " ")}
                  </span>
                  {trip.womenOnly && (
                    <span
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: "rgba(244,114,182,0.2)", color: "#f472b6", backdropFilter: "blur(8px)" }}
                    >
                      <Heart size={10} className="inline mr-1" /> Women Only
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3
                    className="text-base font-bold mb-1 group-hover:translate-x-0.5 transition-transform"
                    style={{ color: "var(--color-txt-white)" }}
                  >
                    {trip.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mb-3">
                    <MapPin size={13} style={{ color: "var(--color-primary)" }} />
                    <span className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>{trip.destination}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} style={{ color: "var(--color-txt-muted)" }} />
                      <span className="text-xs" style={{ color: "var(--color-txt-muted)" }}>
                        {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={13} style={{ color: "var(--color-txt-muted)" }} />
                      <span className="text-xs" style={{ color: trip.spotsLeft <= 2 ? "var(--color-danger)" : "var(--color-txt-muted)" }}>
                        {trip.spotsLeft}/{trip.maxSize} spots
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {trip.tags && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {trip.tags.split(",").slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ background: "var(--color-bg-deep)", color: "var(--color-txt-muted)" }}
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--color-line)" }}>
                    <span className="text-xs" style={{ color: "var(--color-txt-muted)" }}>
                      by {trip.creatorName}
                    </span>
                    <span
                      className="text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
                      style={{ color: "var(--color-primary-bright)" }}
                    >
                      View <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => fetchTrips(false)}
                className="t-btn-outline"
                style={{ padding: "12px 32px" }}
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
