"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, MessageCircle, Send, Loader2, Users, Wifi, WifiOff
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

interface ChatMessage {
  id: string;
  tripId: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  content: string;
  messageType: "TEXT" | "SYSTEM";
  createdAt: string;
}

// Simple STOMP client that uses native WebSocket (no SockJS dep needed for basic WS)
// For production, install @stomp/stompjs and sockjs-client
class SimpleStompClient {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, (msg: ChatMessage) => void> = new Map();
  private connected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private onConnectChange: (connected: boolean) => void;
  private url: string;
  private token: string;

  constructor(url: string, token: string, onConnectChange: (connected: boolean) => void) {
    this.url = url;
    this.token = token;
    this.onConnectChange = onConnectChange;
  }

  connect() {
    try {
      // Use SockJS-compatible URL for regular WebSocket
      const wsUrl = this.url.replace("http://", "ws://").replace("https://", "wss://");
      this.ws = new WebSocket(wsUrl + "/websocket");

      this.ws.onopen = () => {
        // Send STOMP CONNECT frame
        const connectFrame = `CONNECT\nAuthorization:Bearer ${this.token}\naccept-version:1.2\nheart-beat:10000,10000\n\n\0`;
        this.ws?.send(connectFrame);
      };

      this.ws.onmessage = (event) => {
        const data = event.data as string;
        if (data.startsWith("CONNECTED")) {
          this.connected = true;
          this.reconnectDelay = 1000;
          this.onConnectChange(true);
          // Resubscribe
          this.subscriptions.forEach((_, dest) => {
            this.sendSubscribe(dest);
          });
        } else if (data.startsWith("MESSAGE")) {
          // Parse STOMP MESSAGE frame
          const bodyStart = data.indexOf("\n\n");
          if (bodyStart !== -1) {
            const body = data.substring(bodyStart + 2).replace(/\0$/, "");
            try {
              const msg = JSON.parse(body) as ChatMessage;
              // Find matching subscription
              this.subscriptions.forEach((callback, dest) => {
                if (data.includes(`destination:${dest}`)) {
                  callback(msg);
                }
              });
            } catch {}
          }
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.onConnectChange(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.connected = false;
        this.onConnectChange(false);
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.connect();
    }, this.reconnectDelay);
  }

  private sendSubscribe(destination: string) {
    if (this.ws && this.connected) {
      const id = `sub-${destination.replace(/\//g, "-")}`;
      const frame = `SUBSCRIBE\nid:${id}\ndestination:${destination}\n\n\0`;
      this.ws.send(frame);
    }
  }

  subscribe(destination: string, callback: (msg: ChatMessage) => void) {
    this.subscriptions.set(destination, callback);
    if (this.connected) {
      this.sendSubscribe(destination);
    }
  }

  sendMessage(destination: string, body: object) {
    if (this.ws && this.connected) {
      const json = JSON.stringify(body);
      const frame = `SEND\ndestination:${destination}\ncontent-type:application/json\n\n${json}\0`;
      this.ws.send(frame);
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      try {
        if (this.connected) {
          this.ws.send("DISCONNECT\n\n\0");
        }
        this.ws.close();
      } catch {}
    }
    this.connected = false;
    this.subscriptions.clear();
  }

  isConnected() {
    return this.connected;
  }
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const tripId = params.id as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stompRef = useRef<SimpleStompClient | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  // Load history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get(`/trips/${tripId}/chat/messages?page=0&size=50`);
        setMessages(res.data || []);
        scrollToBottom();
      } catch {}
      setLoading(false);
    };
    loadHistory();
  }, [tripId, scrollToBottom]);

  // WebSocket connection
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

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const wsBaseUrl = apiUrl.replace("/api/v1", "/ws");

    const client = new SimpleStompClient(wsBaseUrl, token, setConnected);
    stompRef.current = client;

    client.connect();
    client.subscribe(`/topic/chat/${tripId}`, (msg) => {
      setMessages((prev) => {
        // Deduplicate by id
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      scrollToBottom();
    });

    return () => {
      client.disconnect();
    };
  }, [tripId, scrollToBottom]);

  const handleSend = async () => {
    const content = message.trim();
    if (!content || sending) return;

    setSending(true);
    setMessage("");

    if (stompRef.current?.isConnected()) {
      // Send via WebSocket
      stompRef.current.sendMessage(`/app/chat/${tripId}`, { content });
      setSending(false);
    } else {
      // Fallback to REST
      try {
        const res = await api.post(`/trips/${tripId}/chat/messages`, { content });
        setMessages((prev) => [...prev, res.data]);
        scrollToBottom();
      } catch {
        setMessage(content); // Restore on failure
      }
      setSending(false);
    }

    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  messages.forEach((msg) => {
    const dateStr = new Date(msg.createdAt).toDateString();
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dateStr) {
      last.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateStr, messages: [msg] });
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: "var(--color-bg-surface)", borderBottom: "1px solid var(--color-line)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard/trips/${tripId}`)}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <ArrowLeft size={18} style={{ color: "var(--color-txt-muted)" }} />
          </button>
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--color-txt-white)" }}>
              <MessageCircle size={16} style={{ color: "var(--color-primary)" }} />
              Trip Chat
            </h2>
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-txt-muted)" }}>
              {connected ? (
                <>
                  <Wifi size={10} style={{ color: "#2dd4a8" }} />
                  <span style={{ color: "#2dd4a8" }}>Connected</span>
                </>
              ) : (
                <>
                  <WifiOff size={10} style={{ color: "#f87171" }} />
                  <span style={{ color: "#f87171" }}>Reconnecting...</span>
                </>
              )}
              {" • "}{messages.length} messages
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{ background: "var(--color-bg-deep)" }}
      >
        {messages.length === 0 && (
          <div className="text-center py-16">
            <MessageCircle size={48} className="mx-auto mb-4" style={{ color: "var(--color-txt-dim)" }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-txt-white)" }}>
              Start the Conversation
            </h3>
            <p className="text-sm" style={{ color: "var(--color-txt-muted)" }}>
              Send a message to get the trip chat going!
            </p>
          </div>
        )}

        {groupedMessages.map((group) => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 py-4">
              <div className="flex-1 h-px" style={{ background: "var(--color-line)" }} />
              <span className="text-xs font-medium px-2" style={{ color: "var(--color-txt-dim)" }}>
                {formatDate(group.messages[0].createdAt)}
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--color-line)" }} />
            </div>

            {group.messages.map((msg) => {
              const isOwn = msg.senderId === user?.id;
              const isSystem = msg.messageType === "SYSTEM";

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center py-2">
                    <span
                      className="text-xs px-3 py-1 rounded-full"
                      style={{ background: "var(--color-bg-surface)", color: "var(--color-txt-muted)" }}
                    >
                      {msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 mb-3 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  {!isOwn && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1"
                      style={{ background: "var(--color-bg-elevated)", color: "var(--color-txt-secondary)" }}
                    >
                      {msg.senderInitials}
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                    {!isOwn && (
                      <div className="text-xs mb-0.5 ml-1" style={{ color: "var(--color-txt-muted)" }}>
                        {msg.senderName}
                      </div>
                    )}
                    <div
                      className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
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
                      {msg.content}
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${isOwn ? "text-right mr-1" : "ml-1"}`}
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
        className="flex-shrink-0 px-4 py-3 flex gap-3"
        style={{ background: "var(--color-bg-surface)", borderTop: "1px solid var(--color-line)" }}
      >
        <input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="t-input flex-1"
          style={{ padding: "12px 16px", borderRadius: "9999px" }}
          maxLength={2000}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || sending}
          className="t-btn-primary"
          style={{
            padding: "12px 16px",
            borderRadius: "9999px",
            opacity: message.trim() ? 1 : 0.5,
          }}
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
