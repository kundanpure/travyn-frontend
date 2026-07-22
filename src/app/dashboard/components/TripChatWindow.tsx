"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle, Send, Loader2, Wifi, WifiOff, Image as ImageIcon, ArrowLeft
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import ChatAttachmentMenu from "./ChatAttachmentMenu";

interface ChatMessage {
  id: string;
  tripId: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  content: string;
  messageType: "TEXT" | "SYSTEM" | "IMAGE";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDate(d: any): Date | null {
  if (d == null) return null;
  if (Array.isArray(d)) {
    const [sec, nano] = d as number[];
    if (typeof sec === "number") {
      return new Date(sec * 1000 + Math.floor((nano || 0) / 1_000_000));
    }
    return null;
  }
  if (typeof d === "object") {
    const obj = d as { epochSecond?: number; nano?: number };
    if (typeof obj.epochSecond === "number") {
      return new Date(obj.epochSecond * 1000 + Math.floor((obj.nano || 0) / 1_000_000));
    }
    return null;
  }
  if (typeof d === "number") {
    const ms = d < 1e10 ? d * 1000 : d;
    const date = new Date(ms);
    return isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(d as string);
  return isNaN(date.getTime()) ? null : date;
}

function formatTime(d: string | number | null | undefined): string {
  const date = parseDate(d);
  if (!date) return "";
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(d: string | number | null | undefined): string {
  const date = parseDate(d);
  if (!date) return "Unknown date";

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

interface TripChatWindowProps {
  tripId: string;
  tripTitle?: string;
  onBack?: () => void;
  height?: string;
}

export default function TripChatWindow({ tripId, tripTitle, onBack, height = "100%" }: TripChatWindowProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const [chatFilter, setChatFilter] = useState<"CHAT" | "PAYMENTS">("CHAT");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<Client | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get(`/trips/${tripId}/chat/messages?page=0&size=50`);
        setMessages(res.data || []);
        scrollToBottom();
      } catch {
        // ignore
      }
      setLoading(false);
    };
    loadHistory();
  }, [tripId, scrollToBottom]);

  // Mark as read when opening chat
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await api.post(`/trips/${tripId}/chat/read`);
      } catch (err) {
        console.error("Failed to mark chat as read", err);
      }
    };
    markAsRead();
  }, [tripId]);

  useEffect(() => {
    const stored = localStorage.getItem("travyn-auth");
    if (!stored) return;

    let token = "";
    try {
      const { state } = JSON.parse(stored);
      token = state?.accessToken || "";
    } catch {
      return;
    }

    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const wsBaseUrl = apiUrl.replace("/api/v1", "");

    const client = new Client({
      webSocketFactory: () => new SockJS(`${wsBaseUrl}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        setConnected(true);

        client.subscribe(`/topic/chat/${tripId.toLowerCase()}`, (frame) => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const msg = JSON.parse(frame.body) as any;
            const parsedDate = parseDate(msg.createdAt);
            msg.createdAt = parsedDate
              ? parsedDate.toISOString()
              : new Date().toISOString(); 

            setMessages((prev) => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg as ChatMessage];
            });
            scrollToBottom();

            // Mark as read immediately if it's the active chat
            api.post(`/trips/${tripId}/chat/read`).catch(() => {});
          } catch {
            // ignore
          }
        });
      },

      onDisconnect: () => {
        setConnected(false);
      },

      onStompError: (frame) => {
        console.error("STOMP error:", frame);
        setConnected(false);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
      stompClientRef.current = null;
      setConnected(false);
    };
  }, [tripId, scrollToBottom]);

  const handleSend = async () => {
    const content = message.trim();
    if (!content || sending) return;

    setSending(true);
    setMessage("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    const stomp = stompClientRef.current;
    if (stomp?.connected) {
      stomp.publish({
        destination: `/app/chat/${tripId.toLowerCase()}`,
        body: JSON.stringify({ content }),
      });
      setSending(false);
    } else {
      try {
        const res = await api.post(`/trips/${tripId}/chat/messages`, { content });
        setMessages((prev) => [...prev, res.data]);
        scrollToBottom();
      } catch {
        setMessage(content); 
      }
      setSending(false);
    }

    inputRef.current?.focus();
  };

  const handleImageSend = async (imageUrl: string) => {
    const stomp = stompClientRef.current;
    if (stomp?.connected) {
      stomp.publish({
        destination: `/app/chat/${tripId.toLowerCase()}`,
        body: JSON.stringify({ content: imageUrl, messageType: "IMAGE" }),
      });
    } else {
      try {
        const res = await api.post(`/trips/${tripId}/chat/messages`, {
          content: imageUrl,
          messageType: "IMAGE",
        });
        setMessages((prev) => [...prev, res.data]);
        scrollToBottom();
      } catch {
        // ignore
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (e.key === "Enter" && !e.shiftKey && !isMobile) {
      e.preventDefault();
      handleSend();
    }
  };

  const isPaymentContent = (msg: ChatMessage) =>
    msg.messageType === "SYSTEM" || msg.content.includes("💸") || msg.content.includes("✅") || msg.content.includes("settled");

  const filteredMessages = messages.filter((msg) => {
    if (chatFilter === "PAYMENTS") return isPaymentContent(msg);
    return !isPaymentContent(msg);
  });

  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  filteredMessages.forEach((msg) => {
    const date = parseDate(msg.createdAt);
    const dateStr = date ? date.toDateString() : "unknown";
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dateStr) {
      last.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateStr, messages: [msg] });
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-surface" style={{ height }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--color-line)" }}
      >
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-2.5 py-1.5 rounded-lg transition-colors text-muted hover:text-white flex items-center gap-1.5 text-xs font-semibold"
              style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-line)" }}
            >
              <ArrowLeft size={15} />
              <span>Back to Trip</span>
            </button>
          )}
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(45, 212, 168, 0.1)" }}>
            <MessageCircle size={20} style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-txt-white)" }}>
              {tripTitle || "Trip Chat"}
            </h2>
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-txt-muted)" }}>
              {connected ? (
                <>
                  <Wifi size={10} style={{ color: "#2dd4a8" }} />
                  <span style={{ color: "#2dd4a8" }}>Live</span>
                </>
              ) : (
                <>
                  <WifiOff size={10} style={{ color: "#f87171" }} />
                  <span style={{ color: "#f87171" }}>Reconnecting...</span>
                </>
              )}
              {" • "}{filteredMessages.length} messages
            </div>
          </div>
        </div>

        {/* Chat Filter Tabs */}
        <div className="flex items-center p-1 rounded-lg gap-1" style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-line)" }}>
          <button
            onClick={() => setChatFilter("CHAT")}
            className="px-3 py-1 rounded-md text-xs font-bold transition-all"
            style={{
              background: chatFilter === "CHAT" ? "linear-gradient(135deg, var(--color-primary), var(--color-accent))" : "transparent",
              color: chatFilter === "CHAT" ? "#ffffff" : "var(--color-txt-secondary)",
              boxShadow: chatFilter === "CHAT" ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
            }}
          >
            Chat Messages
          </button>
          <button
            onClick={() => setChatFilter("PAYMENTS")}
            className="px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1"
            style={{
              background: chatFilter === "PAYMENTS" ? "linear-gradient(135deg, var(--color-primary), var(--color-accent))" : "transparent",
              color: chatFilter === "PAYMENTS" ? "#ffffff" : "var(--color-txt-secondary)",
              boxShadow: chatFilter === "PAYMENTS" ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
            }}
          >
            Payments
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{ background: "var(--color-bg-deep)" }}
      >
        {filteredMessages.length === 0 && (
          <div className="text-center py-16">
            <MessageCircle size={48} className="mx-auto mb-4" style={{ color: "var(--color-txt-dim)" }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-txt-white)" }}>
              {chatFilter === "PAYMENTS" ? "No Payment Updates Yet" : "Start the Conversation"}
            </h3>
            <p className="text-sm" style={{ color: "var(--color-txt-muted)" }}>
              {chatFilter === "PAYMENTS" ? "Recorded payment notifications will appear here." : "Say hello to the group!"}
            </p>
          </div>
        )}

        {groupedMessages.map((group) => (
          <div key={group.date}>
            <div className="flex items-center gap-3 py-4">
              <div className="flex-1 h-px" style={{ background: "var(--color-line)" }} />
              <span className="text-xs font-medium px-2" style={{ color: "var(--color-txt-dim)" }}>
                {formatDate(group.messages[0].createdAt)}
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--color-line)" }} />
            </div>

            {group.messages.map((msg) => {
              const isOwn = msg.senderId === user?.id;
              const isPayment = isPaymentContent(msg);

              if (isPayment) {
                return (
                  <div key={msg.id} className="flex justify-center my-3">
                    <div
                      className="text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 max-w-lg shadow-sm text-center"
                      style={{
                        background: "rgba(45, 212, 168, 0.08)",
                        border: "1px solid rgba(45, 212, 168, 0.25)",
                        color: "var(--color-txt-white)",
                      }}
                    >
                      <span className="text-sm">💸</span>
                      <span className="font-medium">{msg.content}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 mb-3 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  {!isOwn && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1"
                      style={{ background: "var(--color-bg-elevated)", color: "var(--color-txt-secondary)" }}
                    >
                      {msg.senderInitials}
                    </div>
                  )}

                  <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                    {!isOwn && (
                      <div className="text-xs mb-0.5 ml-1" style={{ color: "var(--color-txt-muted)" }}>
                        {msg.senderName}
                      </div>
                    )}

                    {msg.messageType === "IMAGE" ? (
                      <div
                        className="rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
                        style={{
                          borderBottomRightRadius: isOwn ? "6px" : "18px",
                          borderBottomLeftRadius: isOwn ? "18px" : "6px",
                          border: isOwn ? "2px solid var(--color-primary-dim)" : "1px solid var(--color-line)",
                          maxWidth: 280,
                        }}
                        onClick={() => setExpandedImage(msg.content)}
                      >
                        <img
                          src={msg.content}
                          alt="Shared photo"
                          loading="lazy"
                          className="w-full h-auto block"
                          style={{
                            maxHeight: 300,
                            objectFit: "cover",
                            background: "var(--color-bg-surface)",
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div
                          className="flex items-center gap-1.5 px-3 py-1.5"
                          style={{
                            background: isOwn
                              ? "linear-gradient(135deg, var(--color-primary-dim), var(--color-primary))"
                              : "var(--color-bg-surface)",
                          }}
                        >
                          <ImageIcon size={12} style={{ color: isOwn ? "var(--color-bg-deep)" : "var(--color-txt-muted)" }} />
                          <span className="text-[11px] font-medium" style={{ color: isOwn ? "var(--color-bg-deep)" : "var(--color-txt-muted)" }}>
                            Photo
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm"
                        style={{
                          background: isOwn
                            ? "linear-gradient(135deg, var(--color-primary-dim), var(--color-primary))"
                            : "var(--color-bg-surface)",
                          color: isOwn ? "var(--color-bg-deep)" : "var(--color-txt-primary)",
                          borderBottomRightRadius: isOwn ? "6px" : "18px",
                          borderBottomLeftRadius: isOwn ? "18px" : "6px",
                          border: isOwn ? "none" : "1px solid var(--color-line)",
                        }}
                      >
                        <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                      </div>
                    )}

                    <div
                      className={`text-[10px] font-medium mt-1 ${isOwn ? "text-right mr-1" : "ml-1"}`}
                      style={{ color: "var(--color-txt-dim)" }}
                    >
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        className="flex-shrink-0 px-4 py-3 flex items-center gap-2"
        style={{ background: "var(--color-bg-surface)", borderTop: "1px solid var(--color-line)" }}
      >
        {user && (
          <ChatAttachmentMenu
            userId={user.id}
            onImageUploaded={handleImageSend}
          />
        )}

        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={connected ? "Message..." : "Connecting..."}
          className="t-input flex-1"
          style={{ padding: "12px 16px", borderRadius: "24px", resize: "none", minHeight: "44px", maxHeight: "120px", lineHeight: "1.4" }}
          maxLength={2000}
          rows={1}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = Math.min(target.scrollHeight, 120) + "px";
          }}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || sending}
          className="t-btn-primary"
          style={{
            padding: "12px",
            borderRadius: "50%",
            opacity: message.trim() ? 1 : 0.5,
          }}
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>

      {/* Expanded Image Viewer */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer"
          style={{ background: "rgba(0, 0, 0, 0.9)" }}
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt="Full size photo"
            className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl"
            style={{ objectFit: "contain" }}
          />
          <div
            className="absolute top-6 right-6 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              backdropFilter: "blur(8px)",
            }}
          >
            Click anywhere to close
          </div>
        </div>
      )}
    </div>
  );
}
