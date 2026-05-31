"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Search, Inbox } from "lucide-react";
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

  const filteredInbox = inbox.filter((item) =>
    item.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      {/* Left Sidebar (Inbox) */}
      <div
        className={`w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col border-r border-white/10 ${
          selectedPartnerId ? "hidden md:flex" : "flex"
        }`}
        style={{ background: "var(--color-bg-base)" }}
      >
        <div className="p-4 border-b border-white/10">
          <h1 className="text-xl font-bold text-white mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-white/50">Loading messages...</div>
          ) : filteredInbox.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center h-full text-white/50">
              <Inbox size={48} className="mb-4 opacity-50" />
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs mt-1">Match with travelers to start chatting!</p>
            </div>
          ) : (
            filteredInbox.map((item) => (
              <button
                key={item.partnerId}
                onClick={() => setSelectedPartnerId(item.partnerId)}
                className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                  selectedPartnerId === item.partnerId ? "bg-white/10 border-l-2 border-l-emerald-500" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0 relative">
                    {item.partnerInitials}
                    {item.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                        {item.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-semibold text-white truncate pr-2">{item.partnerName}</h3>
                      {item.latestMessageAt && (
                        <span className="text-[10px] text-white/40 whitespace-nowrap">
                          {new Date(item.latestMessageAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${item.unreadCount > 0 ? "text-white font-medium" : "text-white/50"}`}>
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
        className={`flex-1 flex flex-col bg-zinc-950 ${
          !selectedPartnerId ? "hidden md:flex" : "flex"
        }`}
      >
        {selectedPartnerId ? (
          <DirectMessageWindow
            partnerId={selectedPartnerId}
            partnerName={inbox.find((i) => i.partnerId === selectedPartnerId)?.partnerName || "Chat"}
            onBack={() => setSelectedPartnerId(null)}
            onMessageRead={() => {
              // Mark as read in inbox state locally to remove badge
              setInbox(prev => prev.map(i => i.partnerId === selectedPartnerId ? { ...i, unreadCount: 0 } : i));
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-white/40">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <MessageCircle size={48} className="opacity-50" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2">Your Messages</h2>
            <p className="text-sm max-w-sm">
              Select a conversation from the left to start chatting privately with your matches.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
