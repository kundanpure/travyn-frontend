"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Send, Loader2, Wifi, WifiOff, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import ChatAttachmentMenu from "../components/ChatAttachmentMenu";
import VerifiedBadge from "../components/VerifiedBadge";
import UnverifiedBadge from "../components/UnverifiedBadge";

interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  senderInitials: string;
  content: string;
  messageType: "TEXT" | "SYSTEM" | "IMAGE";
  isRead: boolean;
  createdAt: string | number | number[] | { epochSecond?: number; nano?: number };
}

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

function formatTime(d: string | number | number[] | { epochSecond?: number; nano?: number } | null | undefined): string {
  const date = parseDate(d);
  if (!date) return "";
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

interface DirectMessageWindowProps {
  partnerId: string;
  partnerName: string;
  partnerProfilePhotoUrl?: string;
  partnerVerified?: boolean;
  onBack: () => void;
  onMessageRead: () => void;
}

export default function DirectMessageWindow({ partnerId, partnerName, partnerProfilePhotoUrl, partnerVerified, onBack, onMessageRead }: DirectMessageWindowProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [stompConnected, setStompConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("NONE");
  const [errorMsg, setErrorMsg] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<Client | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const markAsRead = useCallback(async () => {
    try {
      await api.post(`/dm/${partnerId}/read`);
      onMessageRead();
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  }, [partnerId, onMessageRead]);

  const loadMessages = useCallback(async () => {
    try {
      const statusRes = await api.get(`/dm/${partnerId}/status`);
      setConnectionStatus(statusRes.data.status);
      const res = await api.get(`/dm/${partnerId}/messages?page=0&size=50`);
      setMessages(res.data);
      scrollToBottom();
      markAsRead();
    } catch (err: any) {
      if (err.response?.status !== 403) {
        console.error("Failed to load DMs", err);
      }
    } finally {
      setLoading(false);
    }
  }, [partnerId, markAsRead]);

  useEffect(() => {
    setLoading(true);
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const stored = localStorage.getItem("travyn-auth");
    let token = "";
    if (stored) {
      try {
        const { state } = JSON.parse(stored);
        token = state?.accessToken || "";
      } catch {}
    }

    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "/ws") || "http://localhost:8080/ws";
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => console.log("[STOMP DM]", str),
      onConnect: () => {
        setStompConnected(true);
        client.subscribe(`/topic/user.${user?.id}.dm.messages`, (msg) => {
          const newMsg: DirectMessage = JSON.parse(msg.body);
          if (newMsg.senderId === partnerId || newMsg.receiverId === partnerId) {
            setMessages((prev) => {
              if (prev.some((p) => p.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setTimeout(scrollToBottom, 100);
            if (newMsg.senderId === partnerId) {
               if (document.visibilityState === "visible") {
                  markAsRead();
               }
            }
          }
        });
        client.subscribe(`/topic/user.${user?.id}.dm.read-receipts`, (msg) => {
          const readerId = msg.body;
          if (readerId === partnerId) {
            setMessages(prev => prev.map(m => (!m.isRead && m.senderId === user?.id) ? { ...m, isRead: true } : m));
          }
        });
      },
      onDisconnect: () => {
        setStompConnected(false);
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame);
      },
    });

    client.activate();
    stompClientRef.current = client;

    const handleVisibilityChange = () => {
       if (document.visibilityState === "visible") {
          markAsRead();
       }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      client.deactivate();
      stompClientRef.current = null;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [partnerId, markAsRead, user?.id]);

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const res = await api.post(`/dm/${partnerId}/messages`, {
        content: message.trim(),
        messageType: "TEXT"
      });
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error("Failed to send message", err);
      setErrorMsg("Failed to send message. Please try again.");
      setTimeout(() => setErrorMsg(""), 3000);
      scrollToBottom();
      if (connectionStatus === "CO_TRAVELER") {
        setConnectionStatus("PENDING_SENT");
      }
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async () => {
    try {
      await api.post(`/matches/${partnerId}/connect`);
      setConnectionStatus("MUTUAL");
    } catch (err) {
      console.error("Failed to accept", err);
    }
  };

  const handleReject = async () => {
    try {
      await api.post(`/matches/${partnerId}/pass`);
      onBack();
    } catch (err) {
      console.error("Failed to reject", err);
    }
  };

  const handleImageUploaded = async (imageUrl: string) => {
    try {
      await api.post(`/dm/${partnerId}/messages`, {
        content: imageUrl,
        messageType: "IMAGE"
      });
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error("Failed to send image message", err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center" style={{ color: "var(--text-muted)" }}>
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        className="p-4 flex flex-col backdrop-blur-md sticky top-0 z-10 shrink-0"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 md:hidden rounded-full transition-colors"
              style={{ color: "var(--text-primary)", background: "none", border: "none", cursor: "pointer" }}
            >
              <ArrowLeft size={20} />
            </button>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 overflow-hidden text-sm"
              style={{
                background: partnerProfilePhotoUrl ? "transparent" : "var(--brand-light)",
                color: "var(--brand)",
              }}
            >
              {partnerProfilePhotoUrl ? (
                <img src={partnerProfilePhotoUrl} alt={partnerName} className="w-full h-full object-cover" />
              ) : (
                partnerName.substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="font-bold text-base flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                {partnerName}
                {partnerVerified ? <VerifiedBadge size={14} /> : <UnverifiedBadge size={14} />}
              </h2>
              {partnerVerified === false && (
                <div className="text-[10px] font-medium" style={{ color: "#f59e0b" }}>This traveler has not verified their identity</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {stompConnected ? (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ color: "var(--brand)", background: "var(--brand-light)" }}>
                <Wifi size={12} /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-400 bg-red-400/10 px-2 py-1 rounded-full">
                <WifiOff size={12} /> Reconnecting...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0" style={{ background: "var(--bg-primary)" }}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center" style={{ color: "var(--text-muted)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--bg-tertiary)" }}>
              <MessageCircle size={32} style={{ opacity: 0.5 }} />
            </div>
            <p className="text-sm">Say hi to {partnerName}!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === user?.id;
            const isSystem = msg.messageType === "SYSTEM";

            if (isSystem) {
              return (
                <div key={msg.id || index} className="flex justify-center my-4">
                  <span
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                  >
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.id || index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 shadow-sm relative group ${
                      isMe ? "rounded-br-sm" : "rounded-bl-sm"
                    }`}
                    style={{
                      background: isMe ? "var(--brand)" : "var(--bg-card)",
                      color: isMe ? "white" : "var(--text-primary)",
                      border: isMe ? "none" : "1px solid var(--border)",
                    }}
                  >
                    {msg.messageType === "IMAGE" ? (
                      <div className="mt-1 -mx-2 -mb-2 rounded-xl overflow-hidden cursor-pointer" onClick={() => window.open(msg.content, '_blank')}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={msg.content} alt="Attachment" className="max-w-xs w-full object-cover max-h-64 hover:opacity-90 transition-opacity" />
                      </div>
                    ) : (
                      <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    )}
                    <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                      <span className="text-[10px] opacity-60">
                        {formatTime(msg.createdAt)}
                      </span>
                      {isMe && (
                         <span className="text-[10px] opacity-80 font-bold ml-1">
                           {msg.isRead ? "✓✓" : "✓"}
                         </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input Area / Status Banners */}
      <div className="p-4 shrink-0 relative" style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)" }}>
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm shadow-lg font-medium whitespace-nowrap"
              style={{ background: "var(--danger)", color: "white", border: "1px solid rgba(239,68,68,0.5)" }}
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>
        {connectionStatus === "PENDING_RECEIVED" ? (
          <div className="rounded-2xl p-4 text-center shadow-lg" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>{partnerName}</strong> wants to connect and chat with you.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={handleReject}
                className="px-6 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)", cursor: "pointer" }}
              >
                Reject
              </button>
              <button 
                onClick={handleAccept}
                className="t-btn-primary px-6 py-2 rounded-xl text-sm font-medium"
              >
                Accept
              </button>
            </div>
          </div>
        ) : connectionStatus === "PENDING_SENT" ? (
          <div className="rounded-2xl p-4 text-center" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Request sent. You can send more messages once they accept.
            </p>
          </div>
        ) : connectionStatus === "REJECTED" ? (
          <div className="rounded-2xl p-4 text-center" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              You can no longer message this user.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendText} className="flex gap-2 items-end max-w-4xl mx-auto">
            <ChatAttachmentMenu userId={user?.id || ""} onImageUploaded={handleImageUploaded} />
            
            <div
              className="flex-1 rounded-xl overflow-hidden transition-all"
              style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}
            >
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                  if (e.key === "Enter" && !e.shiftKey && !isMobile) {
                    e.preventDefault();
                    handleSendText(e);
                  }
                }}
                placeholder="Message..."
                className="w-full px-4 py-3 max-h-32 min-h-[44px] resize-none outline-none text-[15px]"
                rows={1}
                style={{
                  height: "auto",
                  minHeight: "44px",
                  background: "transparent",
                  color: "var(--text-primary)",
                  border: "none",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!message.trim() || sending}
              className="t-btn-primary p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
            </button>
          </form>
        )}
        <div className="text-center mt-2 hidden md:block">
           <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
