"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Calendar, Users, Hash, Shield, Heart, Clock,
  Loader2, CheckCircle2, XCircle, UserPlus, Crown, User, Copy, Check,
  Map, DollarSign, MessageCircle
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const typeColors: Record<string, string> = {
  BACKPACKING: "#2dd4a8", LUXURY: "#f0a030", ROAD_TRIP: "#60a5fa",
  CULTURAL: "#a78bfa", ADVENTURE: "#f472b6", WEEKEND: "#34d399", REMOTE_WORK: "#fbbf24",
};

interface TripDetail {
  id: string;
  title: string;
  destination: string;
  description: string;
  startDate: string;
  endDate: string;
  tripType: string;
  status: string;
  maxSize: number;
  memberCount: number;
  availableSpots: number;
  tripCode: string;
  womenOnly: boolean;
  approvalMode: string;
  tags: string;
  coverImageUrl: string;
  creatorId: string;
  creatorName: string;
}

interface TripMember {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  joinedAt: string;
}

interface JoinRequest {
  memberId: string;
  userId: string;
  firstName: string;
  lastName: string;
  status: string;
  requestedAt: string;
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isCreator = user?.id === trip?.creatorId;
  const myMembership = members.find((m) => m.userId === user?.id);

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  const fetchTrip = async () => {
    setLoading(true);
    try {
      const [tripRes, membersRes] = await Promise.all([
        api.get(`/trips/${tripId}`),
        api.get(`/trips/${tripId}/members`),
      ]);
      setTrip(tripRes.data);
      setMembers(membersRes.data || []);

      // Fetch pending requests if creator
      if (tripRes.data.creatorId === user?.id) {
        try {
          const reqRes = await api.get(`/trips/${tripId}/requests`);
          setRequests(reqRes.data || []);
        } catch {}
      }
    } catch {
      // Trip not found
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.post(`/trips/${tripId}/join`);
      await fetchTrip();
    } catch {}
    setJoining(false);
  };

  const handleRequest = async (memberId: string, status: string) => {
    setActionLoading(memberId);
    try {
      await api.put(`/trips/${tripId}/requests/${memberId}`, { status });
      await fetchTrip();
    } catch {}
    setActionLoading(null);
  };

  const copyCode = () => {
    if (trip?.tripCode) {
      navigator.clipboard.writeText(trip.tripCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-txt-white)" }}>Trip Not Found</h2>
        <button onClick={() => router.back()} className="t-btn-outline mt-4" style={{ padding: "10px 20px" }}>
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  const color = typeColors[trip.tripType] || "#2dd4a8";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-txt-muted)" }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Hero */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-line)" }}>
        <div
          className="h-48 relative"
          style={{
            background: trip.coverImageUrl
              ? `url(${trip.coverImageUrl}) center/cover`
              : `linear-gradient(135deg, ${color}30, rgba(0,0,0,0.3))`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ background: `${color}20`, color, backdropFilter: "blur(8px)" }}
              >
                {trip.tripType?.replace("_", " ")}
              </span>
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{
                  background: trip.status === "OPEN" ? "rgba(45,212,168,0.2)" : "rgba(156,163,175,0.2)",
                  color: trip.status === "OPEN" ? "#2dd4a8" : "#9ca3af",
                }}
              >
                {trip.status}
              </span>
              {trip.womenOnly && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: "rgba(244,114,182,0.2)", color: "#f472b6" }}>
                  <Heart size={10} className="inline mr-1" /> Women Only
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "white" }}>{trip.title}</h1>
          </div>
        </div>

        {/* Info Cards */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x"
          style={{ background: "var(--color-bg-surface)", borderTop: "1px solid var(--color-line)" }}
        >
          {[
            { icon: MapPin, label: "Destination", value: trip.destination },
            { icon: Calendar, label: "Dates", value: `${formatDate(trip.startDate).split(",")[0]} – ${formatDate(trip.endDate).split(",")[0]}` },
            { icon: Users, label: "Spots", value: `${trip.availableSpots}/${trip.maxSize} left` },
            { icon: Hash, label: "Trip Code", value: trip.tripCode },
          ].map(({ icon: Icon, label, value }, i) => (
            <div
              key={label}
              className="p-4 text-center"
              style={{ borderColor: "var(--color-line)" }}
            >
              <Icon size={16} className="mx-auto mb-1" style={{ color: "var(--color-primary)" }} />
              <div className="text-xs" style={{ color: "var(--color-txt-muted)" }}>{label}</div>
              <div
                className="text-sm font-semibold mt-0.5 flex items-center justify-center gap-1"
                style={{ color: "var(--color-txt-white)" }}
              >
                {value}
                {label === "Trip Code" && (
                  <button
                    onClick={copyCode}
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    {copied ? <Check size={12} style={{ color: "var(--color-primary)" }} /> : <Copy size={12} style={{ color: "var(--color-txt-muted)" }} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experience Features (Members Only) */}
      {(isCreator || myMembership?.status === "APPROVED") && (
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => router.push(`/dashboard/trips/${tripId}/itinerary`)}
            className="flex flex-col items-center justify-center p-4 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
          >
            <Map size={24} className="mb-2" style={{ color: "var(--color-primary)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--color-txt-white)" }}>Itinerary</span>
          </button>
          <button
            onClick={() => router.push(`/dashboard/trips/${tripId}/expenses`)}
            className="flex flex-col items-center justify-center p-4 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
          >
            <DollarSign size={24} className="mb-2" style={{ color: "var(--color-accent)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--color-txt-white)" }}>Expenses</span>
          </button>
          <button
            onClick={() => router.push(`/dashboard/trips/${tripId}/chat`)}
            className="flex flex-col items-center justify-center p-4 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
          >
            <MessageCircle size={24} className="mb-2" style={{ color: "#60a5fa" }} />
            <span className="text-sm font-medium" style={{ color: "var(--color-txt-white)" }}>Chat</span>
          </button>
        </div>
      )}

      {/* Description */}
      {trip.description && (
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
        >
          <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--color-txt-white)" }}>About this Trip</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-txt-secondary)" }}>
            {trip.description}
          </p>
        </div>
      )}

      {/* Tags */}
      {trip.tags && (
        <div className="flex flex-wrap gap-2">
          {trip.tags.split(",").map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full text-xs"
              style={{ background: "var(--color-bg-surface)", color: "var(--color-txt-secondary)", border: "1px solid var(--color-line)" }}
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Join Action */}
      {!isCreator && !myMembership && trip.status === "OPEN" && (
        <button
          onClick={handleJoin}
          disabled={joining}
          className="t-btn-primary w-full flex items-center justify-center gap-2"
          style={{ padding: "14px" }}
        >
          {joining ? <Loader2 size={18} className="animate-spin" /> : <><UserPlus size={18} /> Request to Join</>}
        </button>
      )}
      {myMembership?.status === "PENDING" && (
        <div
          className="w-full text-center py-3 rounded-xl text-sm font-medium"
          style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}
        >
          <Clock size={16} className="inline mr-2" /> Your join request is pending approval
        </div>
      )}
      {myMembership?.status === "APPROVED" && !isCreator && (
        <div
          className="w-full text-center py-3 rounded-xl text-sm font-medium"
          style={{ background: "rgba(45,212,168,0.1)", color: "#2dd4a8", border: "1px solid rgba(45,212,168,0.2)" }}
        >
          <CheckCircle2 size={16} className="inline mr-2" /> You&apos;re a member of this trip!
        </div>
      )}

      {/* Members */}
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--color-txt-white)" }}>
          Members ({members.filter(m => m.status === "APPROVED").length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {members.filter(m => m.status === "APPROVED").map((m) => (
            <div
              key={m.userId}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-line)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  background: m.role === "CREATOR"
                    ? "linear-gradient(135deg, var(--color-primary), var(--color-accent))"
                    : "var(--color-bg-surface)",
                  color: m.role === "CREATOR" ? "#06080c" : "var(--color-txt-secondary)",
                }}
              >
                {m.firstName[0]}{m.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: "var(--color-txt-white)" }}>
                  {m.firstName} {m.lastName}
                </div>
                <div className="text-xs flex items-center gap-1" style={{ color: "var(--color-txt-muted)" }}>
                  {m.role === "CREATOR" && <Crown size={10} style={{ color: "var(--color-accent)" }} />}
                  {m.role === "CREATOR" ? "Creator" : "Member"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Creator Admin Panel */}
      {isCreator && requests.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(251,191,36,0.3)" }}
        >
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "#fbbf24" }}>
            <Shield size={16} /> Pending Join Requests ({requests.length})
          </h3>
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.memberId}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-line)" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "var(--color-bg-surface)", color: "var(--color-txt-secondary)" }}
                >
                  {req.firstName[0]}{req.lastName[0]}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: "var(--color-txt-white)" }}>
                    {req.firstName} {req.lastName}
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-txt-muted)" }}>
                    Requested {new Date(req.requestedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRequest(req.memberId, "APPROVED")}
                    disabled={actionLoading === req.memberId}
                    className="p-2 rounded-lg transition-colors"
                    style={{ background: "rgba(45,212,168,0.1)", border: "1px solid rgba(45,212,168,0.3)", cursor: "pointer" }}
                  >
                    {actionLoading === req.memberId ? (
                      <Loader2 size={16} className="animate-spin" style={{ color: "#2dd4a8" }} />
                    ) : (
                      <CheckCircle2 size={16} style={{ color: "#2dd4a8" }} />
                    )}
                  </button>
                  <button
                    onClick={() => handleRequest(req.memberId, "REJECTED")}
                    disabled={actionLoading === req.memberId}
                    className="p-2 rounded-lg transition-colors"
                    style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", cursor: "pointer" }}
                  >
                    <XCircle size={16} style={{ color: "#f87171" }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Creator badge */}
      {isCreator && (
        <div
          className="text-center py-2 text-xs rounded-lg"
          style={{ background: "rgba(45,212,168,0.05)", color: "var(--color-primary)", border: "1px solid rgba(45,212,168,0.15)" }}
        >
          <Crown size={12} className="inline mr-1" /> You are the creator of this trip
        </div>
      )}
    </div>
  );
}
