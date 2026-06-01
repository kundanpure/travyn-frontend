"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Send, Loader2, Wifi, WifiOff, MessageCircle } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import ChatAttachmentMenu from "../components/ChatAttachmentMenu";

interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  senderInitials: string;
  content: string;
  messageType: "TEXT" | "SYSTEM" | "IMAGE";
  isRead: boolean;
  createdAt: any;
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

function formatTime(d: string | number | null | undefined): string {
  const date = parseDate(d);
  if (!date) return "";
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

interface DirectMessageWindowProps {
  partnerId: string;
  partnerName: string;
  onBack: () => void;
  onMessageRead: () => void;
}

export default function DirectMessageWindow({ partnerId, partnerName, onBack, onMessageRead }: DirectMessageWindowProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [stompConnected, setStompConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("NONE");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<Client | null>(null);

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
      // Load connection status
      const statusRes = await api.get(`/dm/${partnerId}/status`);
      setConnectionStatus(statusRes.data.status);

      // Load messages
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
        
        // Subscribe to incoming messages for this user
        client.subscribe(`/topic/user.${user?.id}.dm.messages`, (msg) => {
          const newMsg: DirectMessage = JSON.parse(msg.body);
          
          // Only append if it belongs to this conversation
          if (newMsg.senderId === partnerId || newMsg.receiverId === partnerId) {
            setMessages((prev) => {
              if (prev.some((p) => p.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setTimeout(scrollToBottom, 100);

            // If it's from partner, mark it as read immediately if window is focused
            if (newMsg.senderId === partnerId) {
               if (document.visibilityState === "visible") {
                  markAsRead();
               }
            }
          }
        });

        // Subscribe to read receipts
        client.subscribe(`/topic/user.${user?.id}.dm.read-receipts`, (msg) => {
          const readerId = msg.body;
          if (readerId === partnerId) {
            // Partner read our messages, update local state to show double ticks
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

    // Mark as read when tab becomes visible
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
    const stomp = stompClientRef.current;
    
    // We can use STOMP or REST to send. Let's use REST for simplicity to ensure DB save first
    try {
      const res = await api.post(`/dm/${partnerId}/messages`, {
        content: message.trim(),
        messageType: "TEXT"
      });
      setMessage("");
      // Message will be pushed back via WebSocket, but we can also append optimistically
      // Actually, our own backend logic sends it to OUR queue as well, so we don't need to append manually
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error("Failed to send message", err);
      scrollToBottom();
      
      // If this was our first message, update status to PENDING_SENT
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
      onBack(); // close chat on reject
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
      <div className="flex-1 flex flex-col items-center justify-center text-white/50">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/10 bg-zinc-900/50 flex flex-col backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 md:hidden hover:bg-white/10 rounded-full transition-colors text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="font-bold text-white text-lg">{partnerName}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {stompConnected ? (
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-zinc-950/50 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/40">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <MessageCircle size={32} className="opacity-50" />
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
                  <span className="text-xs bg-white/5 text-white/60 px-3 py-1 rounded-full">
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
                      isMe 
                        ? "bg-emerald-600 text-white rounded-br-sm" 
                        : "bg-zinc-800 text-zinc-100 border border-white/5 rounded-bl-sm"
                    }`}
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
      <div className="p-4 bg-zinc-900 border-t border-white/10 shrink-0">
        {connectionStatus === "PENDING_RECEIVED" ? (
          <div className="bg-zinc-800 rounded-2xl p-4 text-center border border-white/10 shadow-lg">
            <p className="text-zinc-300 text-sm mb-4">
              <strong className="text-white">{partnerName}</strong> wants to connect and chat with you.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={handleReject}
                className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Reject
              </button>
              <button 
                onClick={handleAccept}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20"
              >
                Accept
              </button>
            </div>
          </div>
        ) : connectionStatus === "PENDING_SENT" ? (
          <div className="bg-zinc-800/50 rounded-2xl p-4 text-center border border-white/5">
            <p className="text-zinc-400 text-sm">
              Request sent. You can send more messages once they accept.
            </p>
          </div>
        ) : connectionStatus === "REJECTED" ? (
          <div className="bg-zinc-800/50 rounded-2xl p-4 text-center border border-white/5">
            <p className="text-zinc-400 text-sm">
              You can no longer message this user.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendText} className="flex gap-2 items-end max-w-4xl mx-auto">
            {/* Chat Attachment Menu (Photos/Media) */}
            <ChatAttachmentMenu userId={user?.id || ""} onImageUploaded={handleImageUploaded} />
            
            <div className="flex-1 bg-zinc-800 rounded-2xl border border-white/10 overflow-hidden focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendText(e);
                  }
                }}
                placeholder="Message..."
                className="w-full bg-transparent text-white px-4 py-3 max-h-32 min-h-[44px] resize-none outline-none text-[15px]"
                rows={1}
                style={{
                  height: "auto",
                  minHeight: "44px",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!message.trim() || sending}
              className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 flex-shrink-0"
            >
              {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
            </button>
          </form>
        )}
        <div className="text-center mt-2">
           <span className="text-[10px] text-white/30 font-medium">Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
