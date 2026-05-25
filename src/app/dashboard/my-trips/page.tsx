"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Map, Plus, Loader2, MapPin, Calendar, Users, Settings, ArrowRight,
  CheckCircle2, Clock, UserCheck
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const tabs = [
  { key: "created", label: "Created", icon: Settings },
  { key: "joined", label: "Joined", icon: UserCheck },
  { key: "pending", label: "Pending", icon: Clock },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: "rgba(45,212,168,0.1)", text: "#2dd4a8" },
  FULL: { bg: "rgba(251,191,36,0.1)", text: "#fbbf24" },
  IN_PROGRESS: { bg: "rgba(96,165,250,0.1)", text: "#60a5fa" },
  COMPLETED: { bg: "rgba(167,139,250,0.1)", text: "#a78bfa" },
  CANCELLED: { bg: "rgba(248,113,113,0.1)", text: "#f87171" },
  DRAFT: { bg: "rgba(156,163,175,0.1)", text: "#9ca3af" },
};

interface MyTrip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  tripType: string;
  status: string;
  maxSize: number;
  memberCount: number;
  spotsLeft: number;
  memberRole: string;
  memberStatus: string;
}

export default function MyTripsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("created");
  const [trips, setTrips] = useState<MyTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTrips();
  }, []);

  const fetchMyTrips = async () => {
    setLoading(true);
    try {
      const res = await api.get("/trips/my-trips");
      setTrips(res.data || []);
    } catch {
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = trips.filter((t) => {
    if (activeTab === "created") return t.memberRole === "CREATOR";
    if (activeTab === "joined") return t.memberRole === "MEMBER" && t.memberStatus === "APPROVED";
    if (activeTab === "pending") return t.memberStatus === "PENDING";
    return true;
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-txt-white)" }}>My Trips</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-txt-secondary)" }}>
            Manage your trips and join requests
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

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
      >
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === key ? "rgba(45,212,168,0.1)" : "transparent",
              color: activeTab === key ? "var(--color-primary-bright)" : "var(--color-txt-muted)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Icon size={16} />
            {label}
            {activeTab === key && (
              <span
                className="px-1.5 py-0.5 rounded text-xs"
                style={{ background: "var(--color-primary)", color: "#06080c" }}
              >
                {filtered.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-primary)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
        >
          <Map size={48} className="mx-auto mb-4" style={{ color: "var(--color-txt-muted)" }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-txt-white)" }}>
            {activeTab === "created"
              ? "No trips created yet"
              : activeTab === "joined"
              ? "You haven't joined any trips"
              : "No pending requests"}
          </h3>
          <p className="text-sm mb-6" style={{ color: "var(--color-txt-secondary)" }}>
            {activeTab === "created"
              ? "Create your first trip and invite travelers"
              : "Browse the discover page to find trips"}
          </p>
          <Link
            href={activeTab === "created" ? "/dashboard/trips/create" : "/dashboard/discover"}
            className="t-btn-primary inline-flex items-center gap-2"
            style={{ padding: "12px 24px", textDecoration: "none" }}
          >
            {activeTab === "created" ? <><Plus size={16} /> Create Trip</> : <>Browse Trips</>}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((trip) => {
            const sc = statusColors[trip.status] || statusColors.DRAFT;
            return (
              <Link
                key={trip.id}
                href={`/dashboard/trips/${trip.id}`}
                className="flex items-center gap-4 p-4 rounded-xl group transition-all hover:-translate-y-0.5"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-line)",
                  textDecoration: "none",
                }}
              >
                {/* Left Color Bar */}
                <div
                  className="w-1 h-14 rounded-full flex-shrink-0"
                  style={{ background: sc.text }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--color-txt-white)" }}
                    >
                      {trip.title}
                    </h3>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium flex-shrink-0"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {trip.status?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-txt-muted)" }}>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {trip.destination}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {formatDate(trip.startDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {trip.memberCount}/{trip.maxSize}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {activeTab === "created" && (
                    <span className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--color-bg-deep)", color: "var(--color-txt-secondary)" }}>
                      Manage
                    </span>
                  )}
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                    style={{ color: "var(--color-txt-muted)" }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
