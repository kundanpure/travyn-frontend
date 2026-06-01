"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Calendar, Users, Hash, Shield, Heart, Clock,
  Loader2, CheckCircle2, XCircle, UserPlus, Crown, Copy, Check,
  Map, DollarSign, MessageCircle, Pencil, X, Save, IndianRupee,
  Mountain, Car, Landmark, Compass, Monitor, PartyPopper, ImagePlus, Star
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";
import ImageUploadModal from "@/app/dashboard/components/ImageUploadModal";
import { ReviewModal } from "@/app/dashboard/components/ReviewModal";
import { TripReviewModal } from "@/app/dashboard/components/TripReviewModal";

const typeColors: Record<string, string> = {
  BACKPACKING: "#2dd4a8", LUXURY: "#f0a030", ROAD_TRIP: "#60a5fa",
  CULTURAL: "#a78bfa", ADVENTURE: "#f472b6", WEEKEND: "#34d399", REMOTE_WORK: "#fbbf24",
};

const tripTypes = [
  { value: "BACKPACKING", label: "Backpacking", icon: Mountain, color: "#2dd4a8" },
  { value: "LUXURY", label: "Luxury", icon: Crown, color: "#f0a030" },
  { value: "ROAD_TRIP", label: "Road Trip", icon: Car, color: "#60a5fa" },
  { value: "CULTURAL", label: "Cultural", icon: Landmark, color: "#a78bfa" },
  { value: "ADVENTURE", label: "Adventure", icon: Compass, color: "#f472b6" },
  { value: "WEEKEND", label: "Weekend", icon: PartyPopper, color: "#34d399" },
  { value: "REMOTE_WORK", label: "Remote Work", icon: Monitor, color: "#fbbf24" },
];

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
  minBudget: number | null;
  maxBudget: number | null;
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

interface TripReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatarUrl: string;
  rating: number;
  textReview: string;
  createdAt: string;
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { notifications } = useNotificationStore();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [reviewMember, setReviewMember] = useState<{ id: string, name: string } | null>(null);
  const [reviewingTrip, setReviewingTrip] = useState(false);
  const [tripReviews, setTripReviews] = useState<TripReview[]>([]);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    destination: "",
    description: "",
    startDate: "",
    endDate: "",
    tripType: "",
    maxSize: 6,
    approvalMode: "MANUAL",
    womenOnly: false,
    tags: "",
    coverImageUrl: "",
    minBudget: "",
    maxBudget: "",
  });

  const isCreator = user?.id === trip?.creatorId;
  const myMembership = members.find((m) => m.userId === user?.id);

  useEffect(() => {
    fetchTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  // Refetch trip if a relevant notification arrives
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (
        !latest.read && 
        latest.referenceId === tripId && 
        (latest.type === "JOIN_APPROVED" || latest.type === "JOIN_REJECTED" || latest.type === "JOIN_REQUEST")
      ) {
        fetchTrip();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, tripId]);

  async function fetchTrip() {
    setLoading(true);
    try {
      const [tripRes, membersRes, reviewsRes] = await Promise.all([
        api.get(`/trips/${tripId}`),
        api.get(`/trips/${tripId}/members`),
        api.get(`/trips/${tripId}/reviews`),
      ]);
      setTrip(tripRes.data);
      setMembers(membersRes.data || []);
      setTripReviews(reviewsRes.data || []);

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
  }

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

  const openEditModal = () => {
    if (!trip) return;
    setEditForm({
      title: trip.title || "",
      destination: trip.destination || "",
      description: trip.description || "",
      startDate: trip.startDate || "",
      endDate: trip.endDate || "",
      tripType: trip.tripType || "ADVENTURE",
      maxSize: trip.maxSize || 6,
      approvalMode: trip.approvalMode || "MANUAL",
      womenOnly: trip.womenOnly || false,
      tags: trip.tags || "",
      coverImageUrl: trip.coverImageUrl || "",
      minBudget: trip.minBudget != null ? String(trip.minBudget) : "",
      maxBudget: trip.maxBudget != null ? String(trip.maxBudget) : "",
    });
    setEditError("");
    setEditing(true);
  };

  const editBudgetError =
    editForm.minBudget && editForm.maxBudget && Number(editForm.minBudget) > Number(editForm.maxBudget);

  const handleEditSave = async () => {
    if (editBudgetError) return;
    setEditSaving(true);
    setEditError("");
    try {
      const payload: Record<string, unknown> = {
        title: editForm.title,
        destination: editForm.destination,
        description: editForm.description,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        tripType: editForm.tripType,
        maxSize: editForm.maxSize,
        approvalMode: editForm.approvalMode,
        tags: editForm.tags || null,
        coverImageUrl: editForm.coverImageUrl || null,
      };
      if (editForm.minBudget) payload.minBudget = Number(editForm.minBudget);
      if (editForm.maxBudget) payload.maxBudget = Number(editForm.maxBudget);

      await api.put(`/trips/${tripId}`, payload);
      setEditing(false);
      await fetchTrip();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setEditError(axiosErr?.response?.data?.message || "Failed to update trip");
    } finally {
      setEditSaving(false);
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
                  background: trip.status === "OPEN" ? "rgba(45,212,168,0.2)"
                    : trip.status === "COMPLETED" ? "rgba(96,165,250,0.2)"
                    : trip.status === "CANCELLED" ? "rgba(248,113,113,0.2)"
                    : "rgba(156,163,175,0.2)",
                  color: trip.status === "OPEN" ? "#2dd4a8"
                    : trip.status === "COMPLETED" ? "#60a5fa"
                    : trip.status === "CANCELLED" ? "#f87171"
                    : "#9ca3af",
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
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold" style={{ color: "white" }}>{trip.title}</h1>
              {isCreator && trip.status !== "COMPLETED" && trip.status !== "CANCELLED" && (
                <button
                  onClick={openEditModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: "rgba(45, 212, 168, 0.15)",
                    color: "#2dd4a8",
                    border: "1px solid rgba(45, 212, 168, 0.3)",
                    backdropFilter: "blur(8px)",
                    cursor: "pointer",
                  }}
                >
                  <Pencil size={12} /> Edit Trip
                </button>
              )}
              {(myMembership?.status === "APPROVED" || isCreator) && trip.status === "COMPLETED" && !tripReviews.some(r => r.reviewerId === user?.id) && (
                <button
                  onClick={() => setReviewingTrip(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: "rgba(240, 160, 48, 0.15)",
                    color: "#f0a030",
                    border: "1px solid rgba(240, 160, 48, 0.3)",
                    backdropFilter: "blur(8px)",
                    cursor: "pointer",
                  }}
                >
                  <Star size={12} /> Review Trip
                </button>
              )}
            </div>
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
          ].map(({ icon: Icon, label, value }) => (
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

      {/* Budget Display */}
      {(trip.minBudget != null || trip.maxBudget != null) && (
        <div
          className="flex items-center gap-3 rounded-xl px-5 py-3"
          style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
        >
          <IndianRupee size={16} style={{ color: "var(--color-accent)" }} />
          <div>
            <div className="text-xs" style={{ color: "var(--color-txt-muted)" }}>Budget Range</div>
            <div className="text-sm font-semibold" style={{ color: "var(--color-txt-white)" }}>
              {trip.minBudget != null ? `₹${Number(trip.minBudget).toLocaleString()}` : "Any"} – {trip.maxBudget != null ? `₹${Number(trip.maxBudget).toLocaleString()}` : "Any"}
            </div>
          </div>
        </div>
      )}

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
      {!isCreator && !myMembership && trip.status === "OPEN" && new Date(trip.startDate) > new Date() && (
        <button
          onClick={handleJoin}
          disabled={joining}
          className="t-btn-primary w-full flex items-center justify-center gap-2"
          style={{ padding: "14px" }}
        >
          {joining ? <Loader2 size={18} className="animate-spin" /> : <><UserPlus size={18} /> Request to Join</>}
        </button>
      )}
      {!isCreator && !myMembership && trip.status === "OPEN" && new Date(trip.startDate) <= new Date() && (
        <div
          className="w-full text-center py-3 rounded-xl text-sm font-medium"
          style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}
        >
          <Clock size={16} className="inline mr-2" /> This trip has already started and is no longer accepting new members
        </div>
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
              
              <div className="flex items-center gap-2">
                {/* Message Button - Only if it's an active trip and not myself */}
                {m.userId !== user?.id && myMembership?.status === "APPROVED" && (
                  <a
                    href={`/dashboard/messages?partnerId=${m.userId}`}
                    className="p-2 rounded-lg transition-colors flex items-center justify-center hover:scale-105"
                    style={{ background: "rgba(45, 212, 168, 0.1)", border: "1px solid rgba(45, 212, 168, 0.3)", color: "#2dd4a8" }}
                    title="Send Message"
                  >
                    <MessageCircle size={16} />
                  </a>
                )}
                
                {/* Review Button — only visible after trip is COMPLETED */}
              {m.userId !== user?.id && trip.status === "COMPLETED" && (isCreator || myMembership?.status === "APPROVED") && (
                <button
                  onClick={() => setReviewMember({ id: m.userId, name: `${m.firstName} ${m.lastName}` })}
                  className="p-2 rounded-lg transition-colors flex items-center justify-center hover:scale-105"
                  style={{ background: "rgba(240, 160, 48, 0.1)", border: "1px solid rgba(240, 160, 48, 0.3)", color: "#f0a030" }}
                  title="Leave a Review"
                >
                  <Star size={16} />
                </button>
              )}
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

      {/* Trip Reviews Section */}
      {tripReviews.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <Star size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Trip Reviews</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tripReviews.map(review => (
              <div key={review.id} className="p-5 rounded-2xl bg-gray-900/50 border border-gray-800/80 hover:border-gray-700 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {review.reviewerAvatarUrl ? (
                      <img src={review.reviewerAvatarUrl} alt={review.reviewerName} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                        {review.reviewerName.charAt(0)}
                      </div>
                    )}
                    <span className="font-semibold text-white">{review.reviewerName}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={14} fill={star <= review.rating ? "#f0a030" : "transparent"} color={star <= review.rating ? "#f0a030" : "#4b5563"} />
                    ))}
                  </div>
                </div>
                {review.textReview && (
                  <p className="text-sm text-gray-300 leading-relaxed italic border-l-2 border-gray-700 pl-3">&quot;{review.textReview}&quot;</p>
                )}
                <div className="text-xs text-gray-500 mt-4 text-right">
                  {new Date(review.createdAt).toLocaleDateString()}
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

      {/* ─────────── EDIT TRIP MODAL ─────────── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditing(false)} />
          <div
            className="relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-line)",
              maxHeight: "85vh",
            }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
              style={{ background: "var(--color-bg-surface)", borderBottom: "1px solid var(--color-line)" }}
            >
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--color-txt-white)" }}>
                <Pencil size={18} style={{ color: "var(--color-primary)" }} /> Edit Trip
              </h2>
              <button
                onClick={() => setEditing(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} style={{ color: "var(--color-txt-muted)" }} />
              </button>
            </div>

            {/* Modal Body — scrollable */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto" style={{ maxHeight: "calc(85vh - 140px)" }}>
              {editError && (
                <div className="text-sm px-4 py-2 rounded-lg" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
                  {editError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--color-txt-secondary)" }}>Trip Title *</label>
                <input
                  type="text"
                  className="t-input w-full"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="e.g. Himalayan Trek 2026"
                />
              </div>

              {/* Destination */}
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--color-txt-secondary)" }}>Destination *</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-txt-muted)" }} />
                  <input
                    type="text"
                    className="t-input w-full"
                    style={{ paddingLeft: 32 }}
                    value={editForm.destination}
                    onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--color-txt-secondary)" }}>Start Date *</label>
                  <input
                    type="date"
                    className="t-input w-full"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--color-txt-secondary)" }}>End Date *</label>
                  <input
                    type="date"
                    className="t-input w-full"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Trip Type */}
              <div>
                <label className="text-xs font-semibold block mb-2" style={{ color: "var(--color-txt-secondary)" }}>Trip Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {tripTypes.map(({ value, label, icon: Icon, color: c }) => (
                    <button
                      key={value}
                      onClick={() => setEditForm({ ...editForm, tripType: value })}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: editForm.tripType === value ? `${c}15` : "var(--color-bg-deep)",
                        border: editForm.tripType === value ? `2px solid ${c}` : "1px solid var(--color-line)",
                        color: editForm.tripType === value ? c : "var(--color-txt-muted)",
                        cursor: "pointer",
                      }}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--color-txt-secondary)" }}>Description</label>
                <textarea
                  className="t-input w-full"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="What's this trip about?"
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Max Size */}
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--color-txt-secondary)" }}>
                  Max Group Size: {editForm.maxSize}
                </label>
                <input
                  type="range"
                  min={2}
                  max={12}
                  value={editForm.maxSize}
                  onChange={(e) => setEditForm({ ...editForm, maxSize: Number(e.target.value) })}
                  className="w-full"
                  style={{ accentColor: "var(--color-primary)" }}
                />
                <div className="flex justify-between text-xs" style={{ color: "var(--color-txt-dim)" }}>
                  <span>2</span><span>12</span>
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--color-txt-secondary)" }}>Budget Range (₹)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-txt-muted)" }} />
                    <input
                      type="number"
                      className="t-input w-full"
                      style={{ paddingLeft: 32 }}
                      placeholder="Min"
                      min={0}
                      value={editForm.minBudget}
                      onChange={(e) => setEditForm({ ...editForm, minBudget: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-txt-muted)" }} />
                    <input
                      type="number"
                      className="t-input w-full"
                      style={{ paddingLeft: 32 }}
                      placeholder="Max"
                      min={0}
                      value={editForm.maxBudget}
                      onChange={(e) => setEditForm({ ...editForm, maxBudget: e.target.value })}
                    />
                  </div>
                </div>
                {editBudgetError && (
                  <span className="text-xs mt-1 block" style={{ color: "#f87171" }}>
                    ⚠ Minimum budget must be less than maximum budget
                  </span>
                )}
              </div>

              {/* Approval Mode */}
              <div>
                <label className="text-xs font-semibold block mb-2" style={{ color: "var(--color-txt-secondary)" }}>Approval Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "MANUAL", label: "Manual Approval", desc: "Review each request" },
                    { value: "AUTO", label: "Auto Approve", desc: "Anyone can join" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setEditForm({ ...editForm, approvalMode: opt.value })}
                      className="p-3 rounded-xl text-left transition-all"
                      style={{
                        background: editForm.approvalMode === opt.value ? "rgba(45,212,168,0.1)" : "var(--color-bg-deep)",
                        border: editForm.approvalMode === opt.value ? "2px solid var(--color-primary)" : "1px solid var(--color-line)",
                        cursor: "pointer",
                      }}
                    >
                      <div className="text-sm font-medium" style={{ color: editForm.approvalMode === opt.value ? "var(--color-primary)" : "var(--color-txt-secondary)" }}>
                        {opt.label}
                      </div>
                      <div className="text-xs" style={{ color: "var(--color-txt-dim)" }}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Women Only — display-only in edit mode (set at creation time only) */}
              {trip.womenOnly && (
                <div className="flex items-center justify-between" style={{ opacity: 0.6 }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--color-txt-secondary)" }}>Women Only</div>
                    <div className="text-xs" style={{ color: "var(--color-txt-dim)" }}>
                      This setting was locked at trip creation and cannot be changed.
                    </div>
                  </div>
                  <div
                    className="w-12 h-6 rounded-full relative"
                    style={{
                      background: "var(--color-primary)",
                      border: "1px solid var(--color-line)",
                      cursor: "not-allowed",
                      opacity: 0.7,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full absolute top-0.5 transition-all"
                      style={{
                        background: "white",
                        left: "24px",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--color-txt-secondary)" }}>Tags</label>
                <input
                  type="text"
                  className="t-input w-full"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  placeholder="e.g. trekking, photography, food"
                />
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--color-txt-secondary)" }}>Cover Image (optional)</label>
                <div className="flex items-center gap-4">
                  {editForm.coverImageUrl && (
                    <div
                      className="w-24 h-14 rounded-lg"
                      style={{
                        background: `url(${editForm.coverImageUrl}) center/cover`,
                        border: "1px solid var(--color-line)"
                      }}
                    />
                  )}
                  <button
                    onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: "rgba(45,212,168,0.05)",
                      border: "1px dashed var(--color-primary)",
                      color: "var(--color-primary-bright)",
                      cursor: "pointer",
                    }}
                  >
                    <ImagePlus size={16} />
                    {editForm.coverImageUrl ? "Change Cover" : "Upload Cover"}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="px-6 py-4 flex gap-3 sticky bottom-0"
              style={{ background: "var(--color-bg-surface)", borderTop: "1px solid var(--color-line)" }}
            >
              <button
                onClick={() => setEditing(false)}
                className="t-btn-outline flex-1 flex items-center justify-center gap-2"
                style={{ padding: "12px" }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving || !editForm.title || !editForm.destination || !editForm.startDate || !editForm.endDate || !!editBudgetError}
                className="t-btn-primary flex-1 flex items-center justify-center gap-2"
                style={{ padding: "12px" }}
              >
                {editSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpload && user && (
        <ImageUploadModal
          bucket="covers"
          userId={user.id}
          cropShape="rect"
          aspect={16 / 9}
          title="Upload Trip Cover"
          onUploadComplete={(url) => {
            setEditForm({ ...editForm, coverImageUrl: url });
            setShowUpload(false);
          }}
          onClose={() => setShowUpload(false)}
        />
      )}

      {reviewMember && (
        <ReviewModal
          tripId={tripId}
          revieweeId={reviewMember.id}
          revieweeName={reviewMember.name}
          onClose={() => setReviewMember(null)}
          onSuccess={() => {
            setReviewMember(null);
            alert("Review submitted successfully! It will be published once they review you too.");
          }}
        />
      )}

      {reviewingTrip && (
        <TripReviewModal
          tripId={trip.id}
          tripTitle={trip.title}
          onClose={() => setReviewingTrip(false)}
          onSuccess={() => {
            setReviewingTrip(false);
            fetchTrip();
          }}
        />
      )}
    </div>
  );
}
