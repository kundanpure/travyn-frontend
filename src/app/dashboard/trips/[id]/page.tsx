"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Calendar, Users, Hash, Shield, Heart, Clock,
  Loader2, CheckCircle2, XCircle, UserPlus, Crown, Copy, Check,
  Map, DollarSign, MessageCircle, Pencil, X, Save, IndianRupee,
  Mountain, Car, Landmark, Compass, Monitor, PartyPopper, ImagePlus, Star,
  Hourglass, Eye, Navigation, Lightbulb, ArrowUp
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";
import ImageUploadModal from "@/app/dashboard/components/ImageUploadModal";
import { ReviewModal } from "@/app/dashboard/components/ReviewModal";
import { TripReviewModal } from "@/app/dashboard/components/TripReviewModal";
import LocationAutocomplete from "@/app/dashboard/components/LocationAutocomplete";
import VerifiedBadge from "@/app/dashboard/components/VerifiedBadge";
import UnverifiedBadge from "@/app/dashboard/components/UnverifiedBadge";

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
  role: "CREATOR" | "MEMBER";
  status: "APPROVED" | "PENDING" | "REJECTED";
  joinedAt: string;
  profilePhotoUrl?: string;
  verified?: boolean;
}

interface JoinRequest {
  memberId: string;
  userId: string;
  firstName: string;
  lastName: string;
  status: string;
  requestedAt: string;
  verified?: boolean;
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

interface PeerReviewStatus {
  peerId: string;
  peerName: string;
  profilePhotoUrl: string | null;
  iReviewedThem: boolean;
  theyReviewedMe: boolean;
  published: boolean;
}

interface ReviewWindow {
  windowOpens: string;
  windowCloses: string;
  windowOpen: boolean;
  peers: PeerReviewStatus[];
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
  const [locationSharingActive, setLocationSharingActive] = useState(false);

  const [reviewMember, setReviewMember] = useState<{ id: string, name: string } | null>(null);
  const [reviewingTrip, setReviewingTrip] = useState(false);
  const [tripReviews, setTripReviews] = useState<TripReview[]>([]);
  const [peerReviews, setPeerReviews] = useState<any[]>([]);
  const [selectedRevieweeId, setSelectedRevieweeId] = useState<string>("");
  const [reviewWindow, setReviewWindow] = useState<ReviewWindow | null>(null);

  // Insights State
  const [destinationInsights, setDestinationInsights] = useState<any[]>([]);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [insightForm, setInsightForm] = useState({ category: "ALERT", content: "" });
  const [insightLoading, setInsightLoading] = useState(false);

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
      // Auto-refresh review window when a review notification arrives
      if (
        !latest.read &&
        latest.referenceId === tripId &&
        (latest.type === "REVIEW_RECEIVED" || latest.type === "REVIEWS_PUBLISHED" || latest.type === "REVIEW_AUTO_PUBLISHED")
      ) {
        fetchReviewWindow();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, tripId]);

  async function fetchTrip() {
    setLoading(true);
    try {
      const tripRes = await api.get(`/trips/${tripId}`);
      setTrip(tripRes.data);

      try {
        const locRes = await api.get(`/trips/${tripId}/location/status`);
        setLocationSharingActive(locRes.data.isActive);
      } catch (err) {
        // Location sharing not configured
        setLocationSharingActive(false);
      }

      try {
        const membersRes = await api.get(`/trips/${tripId}/members`);
        setMembers(membersRes.data || []);
      } catch (err) {
        console.error("Failed to load members", err);
      }

      try {
        const reviewsRes = await api.get(`/trips/${tripId}/reviews`);
        setTripReviews(reviewsRes.data || []);
      } catch (err) {
        console.error("Failed to load reviews", err);
      }

      try {
        const peerReviewsRes = await api.get(`/trips/${tripId}/peer-reviews`);
        setPeerReviews(peerReviewsRes.data || []);
      } catch (err) {
        console.error("Failed to load peer reviews", err);
      }

      try {
        if (tripRes.data.destination) {
          const insightsRes = await api.get(`/destinations/${tripRes.data.destination}/insights`);
          setDestinationInsights(insightsRes.data || []);
        }
      } catch (err) {
        console.error("Failed to load insights", err);
      }

      // Fetch review window if completed
      if (tripRes.data.status === "COMPLETED") {
        fetchReviewWindow();
      }

      // Fetch pending requests if creator
      if (tripRes.data.creatorId === user?.id) {
        try {
          const reqRes = await api.get(`/trips/${tripId}/requests`);
          setRequests(reqRes.data || []);
        } catch (err) {
          console.error("Failed to load requests", err);
        }
      }
    } catch (err) {
      console.error("Failed to fetch trip", err);
      // Trip not found
      setTrip(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReviewWindow() {
    try {
      const res = await api.get(`/trips/${tripId}/review-window`);
      setReviewWindow(res.data);
    } catch (err) {
      console.error("Failed to load review window", err);
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

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to withdraw from this trip?")) return;
    setActionLoading("leave");
    try {
      await api.delete(`/trips/${tripId}/leave`);
      await fetchTrip();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to leave trip");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransferAdmin = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to transfer ownership of this trip to ${memberName}? You will become a regular member.`)) return;
    setActionLoading(`transfer-${memberId}`);
    try {
      await api.put(`/trips/${tripId}/transfer/${memberId}`);
      await fetchTrip();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to transfer ownership");
    } finally {
      setActionLoading(null);
    }
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

  async function handlePostInsight(e: React.FormEvent) {
    e.preventDefault();
    if (!insightForm.content.trim() || !trip?.destination) return;
    setInsightLoading(true);
    try {
      const res = await api.post(`/destinations/${trip.destination}/insights`, {
        category: insightForm.category,
        content: insightForm.content
      });
      setDestinationInsights([res.data, ...destinationInsights]);
      setShowInsightModal(false);
      setInsightForm({ category: "ALERT", content: "" });
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to post insight. Make sure you are an approved member of a trip to this destination.");
    } finally {
      setInsightLoading(false);
    }
  }

  async function handleUpvoteInsight(insightId: string) {
    try {
      await api.post(`/destinations/insights/${insightId}/upvote`);
      setDestinationInsights(prev => 
        prev.map(ins => ins.id === insightId ? { ...ins, upvotes: ins.upvotes + 1 } : ins)
      );
    } catch (err) {
      console.error("Failed to upvote", err);
    }
  }

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
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold" style={{ color: "white" }}>{trip.title}</h1>
                {locationSharingActive && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold animate-pulse" style={{ background: "rgba(45,212,168,0.2)", color: "#2dd4a8", border: "1px solid rgba(45,212,168,0.3)" }}>
                    <Navigation size={12} /> Live Location Shared
                  </span>
                )}
              </div>
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
              {(myMembership?.status === "APPROVED" || isCreator) && trip.status === "COMPLETED" && !tripReviews.some(r => r.reviewerId?.toLowerCase() === user?.id?.toLowerCase()) && (
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => router.push(`/dashboard/trips/${tripId}/map`)}
            className="flex flex-col items-center justify-center p-4 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
          >
            <Navigation size={24} className="mb-2" style={{ color: "#a78bfa" }} />
            <span className="text-sm font-medium" style={{ color: "var(--color-txt-white)" }}>Live Map</span>
          </button>
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

      {/* ─────────── DESTINATION INSIGHTS ─────────── */}
      <div className="rounded-xl p-5" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb size={20} style={{ color: "var(--color-primary)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-txt-white)" }}>Insights for {trip.destination}</h3>
          </div>
          <button 
            onClick={() => setShowInsightModal(true)}
            className="text-xs font-medium px-3 py-1 rounded-full transition-colors"
            style={{ color: "var(--color-primary)", border: "1px solid var(--color-primary)", background: "var(--brand-light)" }}
          >
            + Share Insight
          </button>
        </div>
        
        {destinationInsights.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: "var(--color-txt-muted)" }}>No insights for this destination yet. Be the first to share a tip!</p>
        ) : (
          <div className="space-y-3">
            {destinationInsights.map(insight => (
              <div key={insight.id} className="p-3 rounded-lg flex items-start gap-3 transition-colors" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-line)" }}>
                <div className="text-xl mt-1 shrink-0">
                  {insight.category === "ALERT" ? "🚨" : insight.category === "PRO_TIP" ? "💡" : "⭐"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {insight.authorAvatarUrl ? (
                      <img src={insight.authorAvatarUrl} alt={insight.authorName} className="w-4 h-4 rounded-full" />
                    ) : (
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: "var(--color-primary)", color: "#000" }}>
                        {insight.authorName.charAt(0)}
                      </div>
                    )}
                    <span className="text-xs font-semibold" style={{ color: "var(--color-txt-secondary)" }}>{insight.authorName}</span>
                    <span className="text-[10px]" style={{ color: "var(--color-txt-muted)" }}>• {new Date(insight.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-txt-white)" }}>{insight.content}</p>
                </div>
                <button 
                  onClick={() => handleUpvoteInsight(insight.id)}
                  className="flex flex-col items-center justify-center shrink-0 w-8 h-8 rounded-md transition-colors"
                  style={{ cursor: "pointer" }}
                >
                  <ArrowUp size={14} style={{ color: "var(--color-txt-muted)" }} className="mb-0.5" />
                  <span className="text-[10px] font-medium" style={{ color: "var(--color-txt-muted)" }}>{insight.upvotes}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Action */}
      {!isCreator && !myMembership && trip.status === "OPEN" && (() => {
        const cutoff = new Date(trip.startDate);
        cutoff.setDate(cutoff.getDate() - 1);
        return new Date() < cutoff;
      })() && (
        <button
          onClick={handleJoin}
          disabled={joining}
          className="t-btn-primary w-full flex items-center justify-center gap-2"
          style={{ padding: "14px" }}
        >
          {joining ? <Loader2 size={18} className="animate-spin" /> : <><UserPlus size={18} /> Request to Join</>}
        </button>
      )}
      {!isCreator && !myMembership && trip.status === "OPEN" && (() => {
        const cutoff = new Date(trip.startDate);
        cutoff.setDate(cutoff.getDate() - 1);
        return new Date() >= cutoff;
      })() && (
        <div
          className="w-full text-center py-3 rounded-xl text-sm font-medium"
          style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}
        >
          <Clock size={16} className="inline mr-2" /> Join requests close 1 day before the trip starts
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
      
      {myMembership && !isCreator && trip.status !== "CANCELLED" && trip.status !== "COMPLETED" && (() => {
        const cutoff = new Date(trip.startDate);
        cutoff.setDate(cutoff.getDate() - 1);
        return new Date() < cutoff;
      })() && (
        <div className="w-full flex flex-col items-center gap-2">
          <button
            onClick={handleLeave}
            disabled={actionLoading === "leave"}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-red-500/10"
            style={{ color: "#f87171", border: "1px dashed rgba(248,113,113,0.3)", background: "transparent", cursor: "pointer" }}
          >
            {actionLoading === "leave" ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} 
            {myMembership.status === "PENDING" ? "Withdraw Request" : "Leave Trip"}
          </button>
          <span className="text-xs text-center" style={{ color: "var(--color-txt-muted)" }}>
            You can request to join again later if spots are available.
          </span>
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
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden"
                style={{
                  background: m.profilePhotoUrl ? "transparent" : (m.role === "CREATOR"
                    ? "linear-gradient(135deg, var(--color-primary), var(--color-accent))"
                    : "var(--color-bg-surface)"),
                  color: m.role === "CREATOR" ? "#06080c" : "var(--color-txt-secondary)",
                }}
              >
                {m.profilePhotoUrl ? (
                  <img src={m.profilePhotoUrl} alt={m.firstName} className="w-full h-full object-cover" />
                ) : (
                  <>{m.firstName[0]}{m.lastName[0]}</>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate flex items-center gap-1.5" style={{ color: "var(--color-txt-white)" }}>
                  {m.firstName} {m.lastName}
                  {m.verified ? <VerifiedBadge size={14} /> : <UnverifiedBadge size={14} />}
                </div>
                <div className="text-xs flex items-center gap-1" style={{ color: "var(--color-txt-muted)" }}>
                  {m.role === "CREATOR" && <Crown size={10} style={{ color: "var(--color-accent)" }} />}
                  {m.role === "CREATOR" ? "Creator" : "Member"}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Transfer Admin Button - Only if I am the creator and the other is a member */}
                {isCreator && m.userId !== user?.id && trip.status !== "CANCELLED" && trip.status !== "COMPLETED" && (
                  <button
                    onClick={() => handleTransferAdmin(m.userId, m.firstName)}
                    disabled={actionLoading === `transfer-${m.userId}`}
                    className="p-2 rounded-lg transition-colors flex items-center justify-center hover:scale-105"
                    style={{ background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.3)", color: "#fbbf24" }}
                    title="Make Admin"
                  >
                    {actionLoading === `transfer-${m.userId}` ? (
                      <div className="w-4 h-4 border-2 border-[#fbbf24] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Crown size={16} />
                    )}
                  </button>
                )}

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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────── REVIEW WINDOW SECTION ─────────── */}
      {trip.status === "COMPLETED" && (isCreator || myMembership?.status === "APPROVED") && reviewWindow && (() => {
        const now = new Date();
        const opens = new Date(reviewWindow.windowOpens);
        const closes = new Date(reviewWindow.windowCloses);
        const isBeforeWindow = now < opens;
        const isWindowOpen = reviewWindow.windowOpen;
        const isWindowClosed = now > closes;

        // Format remaining time
        const formatTimeLeft = (target: Date) => {
          const diff = target.getTime() - now.getTime();
          if (diff <= 0) return "now";
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          if (days > 0) return `${days}d ${hours}h`;
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        };

        return (
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--color-bg-surface)", border: `1px solid ${isWindowOpen ? "rgba(240, 160, 48, 0.3)" : "var(--color-line)"}` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl" style={{ background: "rgba(240, 160, 48, 0.1)" }}>
                <Star size={20} style={{ color: "#f0a030" }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--color-txt-white)" }}>
                  Review Your Trip Mates
                </h3>
                {isBeforeWindow && (
                  <p className="text-xs" style={{ color: "var(--color-txt-muted)" }}>
                    <Hourglass size={10} className="inline mr-1" />
                    Review window opens in {formatTimeLeft(opens)}
                  </p>
                )}
                {isWindowOpen && (
                  <p className="text-xs" style={{ color: "#f0a030" }}>
                    <Clock size={10} className="inline mr-1" />
                    Window closes in {formatTimeLeft(closes)} — reviews auto-publish after that
                  </p>
                )}
                {isWindowClosed && (
                  <p className="text-xs" style={{ color: "var(--color-txt-muted)" }}>
                    Review window closed on {closes.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {reviewWindow.peers.map((peer) => (
                <div
                  key={peer.peerId}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-line)" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden"
                    style={{ background: peer.profilePhotoUrl ? "transparent" : "var(--color-bg-surface)", color: "var(--color-txt-secondary)" }}
                  >
                    {peer.profilePhotoUrl ? (
                      <img src={peer.profilePhotoUrl} alt={peer.peerName} className="w-full h-full object-cover" />
                    ) : (
                      peer.peerName.split(" ").map(n => n[0]).join("")
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--color-txt-white)" }}>
                      {peer.peerName}
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-txt-muted)" }}>
                      {peer.published ? (
                        <span style={{ color: "#2dd4a8" }}><CheckCircle2 size={10} className="inline mr-1" />Reviews published</span>
                      ) : peer.iReviewedThem && !peer.theyReviewedMe ? (
                        <span style={{ color: "#fbbf24" }}><Hourglass size={10} className="inline mr-1" />Waiting for their review</span>
                      ) : !peer.iReviewedThem && peer.theyReviewedMe ? (
                        <span style={{ color: "#f0a030" }}><Star size={10} className="inline mr-1" />They reviewed you — review them back!</span>
                      ) : peer.iReviewedThem && peer.theyReviewedMe ? (
                        <span style={{ color: "#2dd4a8" }}><CheckCircle2 size={10} className="inline mr-1" />Both reviewed</span>
                      ) : (
                        <span><Eye size={10} className="inline mr-1" />Waiting for your review</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isWindowOpen && !peer.iReviewedThem && !peer.published && (
                      <button
                        onClick={() => setReviewMember({ id: peer.peerId, name: peer.peerName })}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                        style={{
                          background: "rgba(240, 160, 48, 0.15)",
                          color: "#f0a030",
                          border: "1px solid rgba(240, 160, 48, 0.3)",
                          cursor: "pointer",
                        }}
                      >
                        <Star size={12} className="inline mr-1" />Review
                      </button>
                    )}
                    {peer.iReviewedThem && !peer.published && (
                      <span
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: "rgba(251, 191, 36, 0.1)", color: "#fbbf24", border: "1px solid rgba(251, 191, 36, 0.2)" }}
                      >
                        ✓ Submitted
                      </span>
                    )}
                    {peer.published && (
                      <span
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: "rgba(45, 212, 168, 0.1)", color: "#2dd4a8", border: "1px solid rgba(45, 212, 168, 0.2)" }}
                      >
                        ✓ Published
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

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
                  <div className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--color-txt-white)" }}>
                    {req.firstName} {req.lastName}
                    {req.verified ? <VerifiedBadge size={14} /> : <UnverifiedBadge size={14} />}
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

      {/* ─────────── PEER REVIEWS SECTION ─────────── */}
      {peerReviews.length > 0 && (() => {
        const revieweeIdsWithReviews = Array.from(new Set(peerReviews.map(r => r.revieweeId)));
        
        const activeRevieweeId = (selectedRevieweeId && revieweeIdsWithReviews.includes(selectedRevieweeId))
          ? selectedRevieweeId
          : (revieweeIdsWithReviews[0] as string);

        const filteredPeerReviews = peerReviews.filter(r => r.revieweeId === activeRevieweeId);

        return (
        <div className="mt-8 border-t border-white/10 pt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(45,212,168,0.15)", color: "var(--color-primary-bright)" }}>
              <Star size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Trip Member Reviews</h2>
              <p className="text-sm text-gray-400">Personal peer reviews written by members of this trip.</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {revieweeIdsWithReviews.map(id => {
              const reviewee = members.find(m => m.userId === id);
              if (!reviewee) return null;
              const isSelected = activeRevieweeId === id;
              return (
                <button
                  key={id as string}
                  onClick={() => setSelectedRevieweeId(id as string)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors"
                  style={{
                    background: isSelected ? "rgba(45,212,168,0.15)" : "var(--color-bg-deep)",
                    color: isSelected ? "var(--color-primary-bright)" : "var(--color-txt-secondary)",
                    border: `1px solid ${isSelected ? "var(--color-primary)" : "var(--color-line)"}`
                  }}
                >
                  {reviewee.profilePhotoUrl ? (
                    <img src={reviewee.profilePhotoUrl} alt={reviewee.firstName} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "var(--color-primary)", color: "#000" }}>
                      {reviewee.firstName.charAt(0)}
                    </div>
                  )}
                  {reviewee.firstName}
                </button>
              );
            })}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPeerReviews.map((r, idx) => {
              const reviewee = members.find(m => m.userId === r.revieweeId);
              const revieweeName = reviewee ? `${reviewee.firstName} ${reviewee.lastName}` : "Unknown Member";
              
              return (
                <div key={r.id || idx} className="p-5 rounded-2xl bg-gray-900/50 border border-gray-800/80 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">
                        {r.reviewerFirstName} {r.reviewerLastName} <span className="text-gray-500 font-normal text-sm mx-1">reviewed</span> {revieweeName}
                      </span>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                      </div>
                    </div>
                  </div>
                  {/* Stars */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-3 font-medium text-gray-400">
                    <div className="flex items-center gap-1">Punctuality: <span style={{ color: "#f0a030" }}>{r.punctualityRating}★</span></div>
                    <div className="flex items-center gap-1">Vibe: <span style={{ color: "#f0a030" }}>{r.vibeRating}★</span></div>
                    <div className="flex items-center gap-1">Communication: <span style={{ color: "#f0a030" }}>{r.communicationRating}★</span></div>
                  </div>
                  {r.textReview && (
                    <p className="text-sm text-gray-300 leading-relaxed italic border-l-2 border-gray-700 pl-3">
                      &quot;{r.textReview}&quot;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        );
      })()}

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
                <LocationAutocomplete
                  value={editForm.destination}
                  onChange={(val) => setEditForm({ ...editForm, destination: val })}
                />
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
            fetchReviewWindow();
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
      {/* ─────────── POST INSIGHT MODAL ─────────── */}
      {showInsightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInsightModal(false)} />
          <div
            className="relative w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden p-6"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: "var(--color-txt-white)" }}>Share Insight for {trip?.destination}</h3>
              <button onClick={() => setShowInsightModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePostInsight} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--color-txt-secondary)" }}>Category</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setInsightForm({...insightForm, category: "ALERT"})} className="p-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition-colors" style={{ borderColor: insightForm.category === "ALERT" ? "#ef4444" : "var(--color-line)", background: insightForm.category === "ALERT" ? "rgba(239,68,68,0.1)" : "transparent", color: insightForm.category === "ALERT" ? "#ef4444" : "var(--color-txt-secondary)" }}>
                    🚨 Alert
                  </button>
                  <button type="button" onClick={() => setInsightForm({...insightForm, category: "PRO_TIP"})} className="p-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition-colors" style={{ borderColor: insightForm.category === "PRO_TIP" ? "var(--color-primary)" : "var(--color-line)", background: insightForm.category === "PRO_TIP" ? "rgba(45,212,168,0.1)" : "transparent", color: insightForm.category === "PRO_TIP" ? "var(--color-primary-bright)" : "var(--color-txt-secondary)" }}>
                    💡 Pro Tip
                  </button>
                  <button type="button" onClick={() => setInsightForm({...insightForm, category: "RECOMMENDATION"})} className="p-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition-colors" style={{ borderColor: insightForm.category === "RECOMMENDATION" ? "#f472b6" : "var(--color-line)", background: insightForm.category === "RECOMMENDATION" ? "rgba(244,114,182,0.1)" : "transparent", color: insightForm.category === "RECOMMENDATION" ? "#f472b6" : "var(--color-txt-secondary)" }}>
                    ⭐ Recommed
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--color-txt-secondary)" }}>Insight</label>
                <textarea
                  className="t-input w-full min-h-[100px] resize-y text-sm"
                  placeholder="Share a tip or alert about this destination..."
                  value={insightForm.content}
                  onChange={e => setInsightForm({...insightForm, content: e.target.value})}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={insightLoading || !insightForm.content.trim()}
                className="t-btn-primary w-full"
              >
                {insightLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Post Insight"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
