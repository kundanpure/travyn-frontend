"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin, Calendar, Users, Shield, Loader2, AlertTriangle,
  Compass, UserCheck, Clock, ExternalLink
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

interface InvitePreview {
  tripId: string;
  tripTitle: string;
  destination: string;
  description: string;
  startDate: string;
  endDate: string;
  tripType: string;
  creatorName: string;
  creatorProfilePhoto: string | null;
  creatorVerified: boolean;
  memberCount: number;
  maxSize: number;
  coverImageUrl: string | null;
  womenOnly: boolean;
  isFull: boolean;
  isExpired: boolean;
  invitedByName: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { user, accessToken } = useAuthStore();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinResult, setJoinResult] = useState<"success" | "error" | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const isLoggedIn = !!accessToken && !!user;

  useEffect(() => {
    fetchPreview();
  }, [token]);

  const fetchPreview = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
      const res = await fetch(`${apiUrl}/public/invite/${token}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Invalid invite link");
      setPreview(json);
    } catch (e: any) {
      setError(e.message || "This invite link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!isLoggedIn) {
      // Save token and redirect to login
      sessionStorage.setItem("pendingInviteToken", token);
      router.push("/login");
      return;
    }

    setJoining(true);
    setJoinError(null);
    try {
      await api.post(`/trips/invite/${token}/accept`);
      setJoinResult("success");
      setTimeout(() => {
        router.push(`/dashboard/trips/${preview?.tripId}`);
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to join trip";
      setJoinError(msg);
      setJoinResult("error");
    } finally {
      setJoining(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    });
  };

  const getTripTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ADVENTURE: "Adventure", CULTURAL: "Cultural", BEACH: "Beach",
      MOUNTAIN: "Mountain", ROADTRIP: "Road Trip", BACKPACKING: "Backpacking",
      SPIRITUAL: "Spiritual", WILDLIFE: "Wildlife", FOOD: "Food & Culinary",
      RELAXATION: "Relaxation", OTHER: "Other"
    };
    return labels[type] || type;
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg-app)" }}>
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: "var(--color-primary)" }} />
          <p style={{ color: "var(--color-text-secondary)" }}>Loading invite...</p>
        </div>
      </div>
    );
  }

  // ── Error / Invalid ──
  if (error || !preview) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--color-bg-app)" }}>
        <div className="text-center max-w-md" style={{
          background: "var(--color-bg-surface)", borderRadius: "16px",
          border: "1px solid var(--color-line)", padding: "2.5rem"
        }}>
          <AlertTriangle size={48} className="mx-auto mb-4" style={{ color: "#ef4444" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
            Invalid Invite Link
          </h2>
          <p className="mb-6" style={{ color: "var(--color-text-secondary)" }}>
            {error || "This invite link doesn't exist or has expired."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-xl font-semibold transition-all"
            style={{
              background: "var(--color-primary)", color: "#fff",
              border: "none", cursor: "pointer"
            }}
          >
            Go to Travyn
          </button>
        </div>
      </div>
    );
  }

  const spotsLeft = preview.maxSize - preview.memberCount;

  // ── Invite Preview ──
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--color-bg-app)" }}>
      {/* Background accent */}
      <div style={{
        position: "fixed", top: "-20%", right: "-10%", width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(246, 167, 58, 0.06), transparent 70%)",
        pointerEvents: "none"
      }} />

      <div className="w-full max-w-lg" style={{ position: "relative", zIndex: 1 }}>
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div style={{
            width: "32px", height: "32px", borderRadius: "10px",
            background: "linear-gradient(135deg, rgba(246, 167, 58, 0.15), rgba(246, 167, 58, 0.05))",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Compass size={18} color="#f6a73a" />
          </div>
          <span className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>Travyn</span>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--color-bg-surface)",
          borderRadius: "20px",
          border: "1px solid var(--color-line)",
          overflow: "hidden"
        }}>
          {/* Cover image */}
          {preview.coverImageUrl && (
            <div style={{
              height: "180px", width: "100%",
              background: `url(${preview.coverImageUrl}) center/cover no-repeat`,
              position: "relative"
            }}>
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "60px",
                background: "linear-gradient(transparent, var(--color-bg-surface))"
              }} />
            </div>
          )}

          <div style={{ padding: "1.5rem 1.75rem 2rem" }}>
            {/* Invited by banner */}
            <div className="flex items-center gap-2 mb-4" style={{
              background: "rgba(246, 167, 58, 0.08)", padding: "10px 14px",
              borderRadius: "12px", border: "1px solid rgba(246, 167, 58, 0.15)"
            }}>
              <UserCheck size={16} style={{ color: "var(--color-primary)" }} />
              <span className="text-sm" style={{ color: "var(--color-primary)" }}>
                <b>{preview.invitedByName}</b> invited you to join this trip
              </span>
            </div>

            {/* Trip title */}
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
              {preview.tripTitle}
            </h1>

            {/* Destination + type */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-1">
                <MapPin size={15} style={{ color: "var(--color-primary)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  {preview.destination}
                </span>
              </div>
              <span style={{
                fontSize: "11px", padding: "3px 10px", borderRadius: "20px",
                background: "rgba(246, 167, 58, 0.12)", color: "var(--color-primary)",
                fontWeight: 600
              }}>
                {getTripTypeLabel(preview.tripType)}
              </span>
              {preview.womenOnly && (
                <span style={{
                  fontSize: "11px", padding: "3px 10px", borderRadius: "20px",
                  background: "rgba(236, 72, 153, 0.12)", color: "#ec4899",
                  fontWeight: 600
                }}>
                  Women Only
                </span>
              )}
            </div>

            {/* Description */}
            {preview.description && (
              <p className="text-sm mb-5" style={{
                color: "var(--color-text-secondary)", lineHeight: 1.6,
                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden"
              }}>
                {preview.description}
              </p>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div style={{
                background: "var(--color-bg-app)", padding: "12px",
                borderRadius: "12px", textAlign: "center"
              }}>
                <Calendar size={16} className="mx-auto mb-1" style={{ color: "var(--color-text-secondary)" }} />
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Dates</p>
                <p className="text-xs font-semibold mt-1" style={{ color: "var(--color-text-primary)" }}>
                  {formatDate(preview.startDate)} — {formatDate(preview.endDate)}
                </p>
              </div>
              <div style={{
                background: "var(--color-bg-app)", padding: "12px",
                borderRadius: "12px", textAlign: "center"
              }}>
                <Users size={16} className="mx-auto mb-1" style={{ color: "var(--color-text-secondary)" }} />
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Spots</p>
                <p className="text-xs font-semibold mt-1" style={{ color: spotsLeft <= 2 ? "#ef4444" : "var(--color-text-primary)" }}>
                  {spotsLeft > 0 ? `${spotsLeft} of ${preview.maxSize} left` : "Full"}
                </p>
              </div>
              <div style={{
                background: "var(--color-bg-app)", padding: "12px",
                borderRadius: "12px", textAlign: "center"
              }}>
                <Shield size={16} className="mx-auto mb-1" style={{ color: "var(--color-text-secondary)" }} />
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Creator</p>
                <p className="text-xs font-semibold mt-1" style={{ color: "var(--color-text-primary)" }}>
                  {preview.creatorName.split(" ")[0]}
                  {preview.creatorVerified && " ✓"}
                </p>
              </div>
            </div>

            {/* Status messages */}
            {preview.isExpired && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{
                background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)"
              }}>
                <Clock size={16} style={{ color: "#ef4444" }} />
                <span className="text-sm" style={{ color: "#ef4444" }}>This invite link has expired</span>
              </div>
            )}

            {preview.isFull && !preview.isExpired && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{
                background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)"
              }}>
                <AlertTriangle size={16} style={{ color: "#f59e0b" }} />
                <span className="text-sm" style={{ color: "#f59e0b" }}>This trip is currently full</span>
              </div>
            )}

            {/* Join result */}
            {joinResult === "success" && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{
                background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)"
              }}>
                <UserCheck size={16} style={{ color: "#22c55e" }} />
                <span className="text-sm" style={{ color: "#22c55e" }}>
                  You've joined the trip! Redirecting...
                </span>
              </div>
            )}

            {joinResult === "error" && joinError && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{
                background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)"
              }}>
                <AlertTriangle size={16} style={{ color: "#ef4444" }} />
                <span className="text-sm" style={{ color: "#ef4444" }}>{joinError}</span>
              </div>
            )}

            {/* CTA Button */}
            {!preview.isExpired && !preview.isFull && joinResult !== "success" && (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full py-3.5 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2"
                style={{
                  background: joining ? "rgba(246, 167, 58, 0.5)" : "var(--color-primary)",
                  color: "#fff", border: "none", cursor: joining ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 15px rgba(246, 167, 58, 0.25)"
                }}
              >
                {joining ? (
                  <><Loader2 size={18} className="animate-spin" /> Joining...</>
                ) : isLoggedIn ? (
                  <><Users size={18} /> Join This Trip</>
                ) : (
                  <><ExternalLink size={18} /> Sign in to Join</>
                )}
              </button>
            )}

            {/* Already have account hint */}
            {!isLoggedIn && !preview.isExpired && !preview.isFull && (
              <p className="text-center text-xs mt-3" style={{ color: "var(--color-text-secondary)" }}>
                Don't have an account?{" "}
                <span
                  onClick={() => {
                    sessionStorage.setItem("pendingInviteToken", token);
                    router.push("/login");
                  }}
                  style={{ color: "var(--color-primary)", cursor: "pointer", fontWeight: 600 }}
                >
                  Sign up here
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-4" style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}>
          Travyn — Travel safer together
        </p>
      </div>
    </div>
  );
}
