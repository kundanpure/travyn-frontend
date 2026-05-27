"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  LayoutDashboard,
  Map,
  MapPin,
  MessageCircle,
  Users,
  Shield,
  User,
  Settings,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Check,
  CheckCheck,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/discover", icon: Compass, label: "Discover Trips" },
  { href: "/dashboard/my-trips", icon: Map, label: "My Trips" },
  { href: "/dashboard/messages", icon: MessageCircle, label: "Messages" },
  { href: "/dashboard/matches", icon: Users, label: "Matches" },
  { href: "/dashboard/safety", icon: Shield, label: "Safety" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const stompRef = useRef<Client | null>(null);

  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
  } = useNotificationStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // WebSocket subscription for real-time notifications
  useEffect(() => {
    if (!user?.id) return;

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
        client.subscribe(`/topic/user.${user.id}.notifications`, (frame) => {
          try {
            const notification = JSON.parse(frame.body);
            addNotification(notification);
          } catch {
            // ignore parse errors
          }
        });
      },
    });

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
      stompRef.current = null;
    };
  }, [user?.id, addNotification]);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleNotifClick = (notif: { id: string; read: boolean; referenceId: string | null }) => {
    if (!notif.read) markAsRead(notif.id);
    setNotifOpen(false);
    if (notif.referenceId) {
      router.push(`/dashboard/trips/${notif.referenceId}/chat`);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-bg-deep)" }}>
      {/* Sidebar — Desktop */}
      <aside
        className="hidden lg:flex flex-col w-64 fixed top-0 left-0 h-full z-40"
        style={{
          background: "var(--color-bg-surface)",
          borderRight: "1px solid var(--color-line)",
        }}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-2">
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))",
            }}
          >
            <Compass size={16} color="#06080c" />
          </div>
          <span className="t-gradient-text" style={{ fontSize: "1.2rem", fontFamily: "var(--font-family-display)", fontWeight: 700 }}>Travyn</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: active ? "rgba(45, 212, 168, 0.1)" : "transparent",
                  color: active ? "var(--color-primary-bright)" : "var(--color-txt-secondary)",
                  borderLeft: active ? "3px solid var(--color-primary)" : "3px solid transparent",
                }}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-4" style={{ borderTop: "1px solid var(--color-line)" }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-colors"
            style={{ color: "var(--color-txt-muted)", background: "none", border: "none", cursor: "pointer" }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside
            className="absolute left-0 top-0 h-full w-72 flex flex-col"
            style={{
              background: "var(--color-bg-surface)",
              borderRight: "1px solid var(--color-line)",
            }}
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))",
                  }}
                >
                  <Compass size={16} color="#06080c" />
                </div>
                <span className="t-gradient-text" style={{ fontSize: "1.2rem", fontFamily: "var(--font-family-display)", fontWeight: 700 }}>Travyn</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} style={{ color: "var(--color-txt-muted)" }} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-2 space-y-1">
              {navItems.map(({ href, icon: Icon, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: active ? "rgba(45, 212, 168, 0.1)" : "transparent",
                      color: active ? "var(--color-primary-bright)" : "var(--color-txt-secondary)",
                    }}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4" style={{ borderTop: "1px solid var(--color-line)" }}>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full"
                style={{ color: "var(--color-txt-muted)", background: "none", border: "none", cursor: "pointer" }}
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header
          className="sticky top-0 z-30 t-glass-strong"
          style={{ borderBottom: "1px solid var(--color-line)" }}
        >
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <div className="flex items-center gap-3">
              <button className="lg:hidden" onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Menu size={22} style={{ color: "var(--color-txt-primary)" }} />
              </button>
              <div className="relative hidden sm:block">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--color-txt-muted)" }}
                />
                <input
                  type="text"
                  placeholder="Search trips, travelers..."
                  className="t-input"
                  style={{
                    paddingLeft: "36px",
                    width: "280px",
                    padding: "8px 12px 8px 36px",
                    fontSize: "0.85rem",
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  className="relative p-2 rounded-lg transition-colors"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    setUserMenuOpen(false);
                  }}
                >
                  <Bell size={20} style={{ color: "var(--color-txt-secondary)" }} />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ background: "var(--color-danger)", color: "white" }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notifOpen && (
                  <div
                    className="absolute right-0 top-12 w-80 rounded-xl shadow-2xl overflow-hidden"
                    style={{
                      background: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-line)",
                      maxHeight: "400px",
                    }}
                  >
                    {/* Header */}
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{ borderBottom: "1px solid var(--color-line)" }}
                    >
                      <span className="text-sm font-semibold" style={{ color: "var(--color-txt-white)" }}>
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAllAsRead();
                          }}
                          className="flex items-center gap-1 text-xs"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)" }}
                        >
                          <CheckCheck size={14} />
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div style={{ maxHeight: "340px", overflowY: "auto" }}>
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell size={28} className="mx-auto mb-2" style={{ color: "var(--color-txt-dim)" }} />
                          <p className="text-sm" style={{ color: "var(--color-txt-muted)" }}>
                            No notifications yet
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                            style={{
                              background: notif.read ? "transparent" : "rgba(45, 212, 168, 0.05)",
                              border: "none",
                              borderBottom: "1px solid var(--color-line)",
                              cursor: "pointer",
                            }}
                          >
                            <div
                              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                              style={{
                                background: notif.read
                                  ? "var(--color-bg-surface)"
                                  : "rgba(45, 212, 168, 0.15)",
                              }}
                            >
                              <MessageCircle
                                size={14}
                                style={{
                                  color: notif.read ? "var(--color-txt-muted)" : "var(--color-primary)",
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm leading-snug"
                                style={{
                                  color: notif.read
                                    ? "var(--color-txt-muted)"
                                    : "var(--color-txt-primary)",
                                  fontWeight: notif.read ? 400 : 500,
                                }}
                              >
                                {notif.message}
                              </p>
                              <span className="text-xs" style={{ color: "var(--color-txt-dim)" }}>
                                {timeAgo(notif.createdAt)}
                              </span>
                            </div>
                            {!notif.read && (
                              <div
                                className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                                style={{ background: "var(--color-primary)" }}
                              />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 p-1.5 rounded-lg transition-colors"
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setNotifOpen(false);
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                      color: "#06080c",
                    }}
                  >
                    {user?.firstName?.[0] || "U"}
                  </div>
                  <span className="hidden sm:block text-sm font-medium" style={{ color: "var(--color-txt-primary)" }}>
                    {user?.firstName || "User"}
                  </span>
                  <ChevronDown size={14} style={{ color: "var(--color-txt-muted)" }} />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-12 w-48 rounded-xl py-2 shadow-2xl"
                    style={{
                      background: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-line)",
                    }}
                  >
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm"
                      style={{ color: "var(--color-txt-secondary)" }}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User size={16} /> Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm"
                      style={{ color: "var(--color-txt-secondary)" }}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings size={16} /> Settings
                    </Link>
                    <hr style={{ borderColor: "var(--color-line)", margin: "4px 0" }} />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm w-full"
                      style={{ color: "var(--color-danger)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
