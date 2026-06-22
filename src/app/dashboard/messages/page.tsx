"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Search, Inbox } from "lucide-react";
import VerifiedBadge from "../components/VerifiedBadge";
import UnverifiedBadge from "../components/UnverifiedBadge";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import DirectMessageWindow from "./DirectMessageWindow";

export interface DMInboxItem {
  partnerId: string;
  partnerName: string;
  partnerInitials: string;
  latestMessageContent: string;
  latestMessageType: "TEXT" | "SYSTEM" | "IMAGE";
  latestMessageAt: string | null;
  unreadCount: number;
  partnerProfilePhotoUrl?: string;
  partnerVerified?: boolean;
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [inbox, setInbox] = useState<DMInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchInbox = useCallback(async () => {
    try {
      const res = await api.get("/dm/inbox");
      setInbox(res.data);
    } catch (err) {
      console.error("Failed to fetch inbox:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const pid = urlParams.get("partnerId");
      if (pid) {
        setSelectedPartnerId(pid);
        window.history.replaceState({}, '', '/dashboard/messages');
      }
    }
  }, []);

  const handleMessageRead = useCallback(() => {
    setInbox(prev => prev.map(i => i.partnerId === selectedPartnerId ? { ...i, unreadCount: 0 } : i));
  }, [selectedPartnerId]);

  const filteredInbox = inbox.filter((item) =>
    item.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="flex overflow-hidden rounded-xl"
      style={{
        height: "calc(100vh - 100px)",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Left Sidebar (Inbox) */}
      <div
        className={`w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col ${
          selectedPartnerId ? "hidden md:flex" : "flex"
        }`}
        style={{ borderRight: "1px solid var(--border)" }}
      >
        <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h1
            className="text-lg font-bold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Messages
          </h1>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2"
              size={16}
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="t-input w-full"
              style={{ paddingLeft: 36, fontSize: "0.875rem" }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Loading messages...
            </div>
          ) : filteredInbox.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center h-full">
              <Inbox size={40} className="mb-3" style={{ color: "var(--text-muted)", opacity: 0.5 }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No messages yet.</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Match with travelers to start chatting!</p>
            </div>
          ) : (
            filteredInbox.map((item) => (
              <button
                key={item.partnerId}
                onClick={() => setSelectedPartnerId(item.partnerId)}
                className="w-full text-left p-4 transition-colors"
                style={{
                  background: selectedPartnerId === item.partnerId ? "var(--brand-light)" : "transparent",
                  borderTopWidth: 0,
                  borderRightWidth: 0,
                  borderBottomWidth: 1,
                  borderBottomStyle: "solid",
                  borderBottomColor: "var(--border)",
                  borderLeftWidth: 2,
                  borderLeftStyle: "solid",
                  borderLeftColor: selectedPartnerId === item.partnerId ? "var(--brand)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0 relative overflow-hidden text-sm"
                    style={{
                      background: item.partnerProfilePhotoUrl ? "transparent" : "var(--brand-light)",
                      color: "var(--brand)",
                    }}
                  >
                    {item.partnerProfilePhotoUrl ? (
                      <img src={item.partnerProfilePhotoUrl} alt={item.partnerName} className="w-full h-full object-cover" />
                    ) : (
                      item.partnerInitials
                    )}
                    {item.unreadCount > 0 && (
                      <div
                        className="absolute -top-0.5 -right-0.5 text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-bold"
                        style={{ background: "var(--danger)", color: "white", minWidth: 16, height: 16 }}
                      >
                        {item.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3
                        className="font-semibold text-sm truncate pr-2 flex items-center gap-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.partnerName}
                        {item.partnerVerified ? <VerifiedBadge size={14} /> : <UnverifiedBadge size={14} />}
                      </h3>
                      {item.latestMessageAt && (
                        <span className="text-[10px] whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                          {new Date(item.latestMessageAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-sm truncate"
                      style={{
                        color: item.unreadCount > 0 ? "var(--text-primary)" : "var(--text-muted)",
                        fontWeight: item.unreadCount > 0 ? 500 : 400,
                      }}
                    >
                      {item.latestMessageType === "IMAGE" ? "📷 Photo" : item.latestMessageContent || "Start a conversation!"}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Content Area (Chat Window) */}
      <div
        className={`flex-1 flex flex-col ${
          !selectedPartnerId ? "hidden md:flex" : "flex"
        }`}
        style={{ background: "var(--bg-primary)" }}
      >
        {selectedPartnerId ? (
          <DirectMessageWindow
            partnerId={selectedPartnerId}
            partnerName={inbox.find((i) => i.partnerId === selectedPartnerId)?.partnerName || "Chat"}
            partnerProfilePhotoUrl={inbox.find((i) => i.partnerId === selectedPartnerId)?.partnerProfilePhotoUrl}
            partnerVerified={inbox.find((i) => i.partnerId === selectedPartnerId)?.partnerVerified}
            onBack={() => setSelectedPartnerId(null)}
            onMessageRead={handleMessageRead}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
              style={{ background: "var(--bg-tertiary)" }}
            >
              <MessageCircle size={36} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
            </div>
            <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Your Messages
            </h2>
            <p className="text-sm max-w-sm" style={{ color: "var(--text-muted)" }}>
              Select a conversation to start chatting with your matches.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
