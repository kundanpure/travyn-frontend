"use client";

import { useState, useEffect } from "react";
import {
  X, Loader2, Copy, Check, Link2, Trash2, Users, Clock, Shield,
  QrCode, Share2
} from "lucide-react";
import api from "@/lib/api";

interface InviteLink {
  id: string;
  token: string;
  link: string;
  maxUses: number;
  usedCount: number;
  autoApprove: boolean;
  active: boolean;
  expiresAt: string;
  createdAt: string;
}

interface Props {
  tripId: string;
  tripTitle: string;
  onClose: () => void;
}

export default function InviteFriendsModal({ tripId, tripTitle, onClose }: Props) {
  const [links, setLinks] = useState<InviteLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Options for new link
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [maxUses, setMaxUses] = useState(0);
  const [autoApprove, setAutoApprove] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const res = await api.get(`/trips/${tripId}/invite-links`);
      setLinks(res.data);
    } catch {
      setError("Failed to load invite links");
    } finally {
      setLoading(false);
    }
  };

  const generateLink = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await api.post(`/trips/${tripId}/invite`, {
        expiresInDays,
        maxUses,
        autoApprove,
      });
      setLinks([res.data, ...links]);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate invite link");
    } finally {
      setGenerating(false);
    }
  };

  const revokeLink = async (inviteId: string) => {
    try {
      await api.delete(`/trips/${tripId}/invite-links/${inviteId}`);
      setLinks(links.filter((l) => l.id !== inviteId));
    } catch {
      setError("Failed to revoke invite link");
    }
  };

  const copyLink = (link: string, token: string) => {
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const shareWhatsApp = (link: string) => {
    const text = `Hey! Join my trip "${tripTitle}" on Travyn:\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    });

  const isExpired = (expiresAt: string) => new Date() > new Date(expiresAt);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl relative"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-line)",
          maxHeight: "85vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3" style={{ borderBottom: "1px solid var(--color-line)" }}>
          <div className="flex items-center gap-2">
            <Link2 size={18} style={{ color: "var(--color-primary)" }} />
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
              Invite Friends
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* Generate section */}
          <div className="mb-5 p-4 rounded-xl" style={{
            background: "var(--color-bg-app)", border: "1px solid var(--color-line)"
          }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
              Create New Invite Link
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Expiry */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
                  Expires in
                </label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "var(--color-bg-surface)",
                    border: "1px solid var(--color-line)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>

              {/* Max uses */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
                  Max uses
                </label>
                <select
                  value={maxUses}
                  onChange={(e) => setMaxUses(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "var(--color-bg-surface)",
                    border: "1px solid var(--color-line)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <option value={0}>Unlimited</option>
                  <option value={1}>1 person</option>
                  <option value={3}>3 people</option>
                  <option value={5}>5 people</option>
                  <option value={10}>10 people</option>
                </select>
              </div>
            </div>

            {/* Auto approve toggle */}
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                style={{ accentColor: "var(--color-primary)" }}
              />
              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Auto-approve (skip manual approval)
              </span>
            </label>

            <button
              onClick={generateLink}
              disabled={generating}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              style={{
                background: generating ? "rgba(246, 167, 58, 0.5)" : "var(--color-primary)",
                color: "#fff", border: "none",
                cursor: generating ? "not-allowed" : "pointer",
              }}
            >
              {generating ? (
                <><Loader2 size={16} className="animate-spin" /> Generating...</>
              ) : (
                <><Link2 size={16} /> Generate Invite Link</>
              )}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-400 mb-3">{error}</p>
          )}

          {/* Active links */}
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
            Active Links ({links.length})
          </h3>

          {loading ? (
            <div className="text-center py-6">
              <Loader2 size={24} className="animate-spin mx-auto" style={{ color: "var(--color-primary)" }} />
            </div>
          ) : links.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "var(--color-text-secondary)" }}>
              No active invite links. Create one above!
            </p>
          ) : (
            <div className="space-y-3">
              {links.map((link) => {
                const expired = isExpired(link.expiresAt);
                return (
                  <div
                    key={link.id}
                    className="p-3 rounded-xl"
                    style={{
                      background: "var(--color-bg-app)",
                      border: `1px solid ${expired ? "rgba(239, 68, 68, 0.3)" : "var(--color-line)"}`,
                      opacity: expired ? 0.6 : 1,
                    }}
                  >
                    {/* Link URL */}
                    <div
                      className="flex items-center gap-2 mb-2 p-2 rounded-lg text-xs font-mono"
                      style={{
                        background: "var(--color-bg-surface)",
                        color: "var(--color-text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Link2 size={12} style={{ flexShrink: 0, color: "var(--color-primary)" }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{link.link}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 mb-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {link.usedCount}{link.maxUses > 0 ? `/${link.maxUses}` : ""} used
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {expired ? "Expired" : `Expires ${formatDate(link.expiresAt)}`}
                      </span>
                      {link.autoApprove && (
                        <span className="flex items-center gap-1">
                          <Shield size={11} style={{ color: "#22c55e" }} />
                          Auto
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyLink(link.link, link.token)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all"
                        style={{
                          background: copiedToken === link.token ? "rgba(34, 197, 94, 0.1)" : "rgba(246, 167, 58, 0.1)",
                          color: copiedToken === link.token ? "#22c55e" : "var(--color-primary)",
                          border: "none", cursor: "pointer",
                        }}
                      >
                        {copiedToken === link.token ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                      </button>
                      <button
                        onClick={() => shareWhatsApp(link.link)}
                        className="py-1.5 px-3 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                        style={{
                          background: "rgba(37, 211, 102, 0.1)", color: "#25d366",
                          border: "none", cursor: "pointer",
                        }}
                      >
                        <Share2 size={12} /> Share
                      </button>
                      <button
                        onClick={() => revokeLink(link.id)}
                        className="py-1.5 px-3 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                        style={{
                          background: "rgba(239, 68, 68, 0.1)", color: "#ef4444",
                          border: "none", cursor: "pointer",
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
