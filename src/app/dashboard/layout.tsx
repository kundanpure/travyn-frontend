"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Compass,
  LayoutDashboard,
  Map,
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
  UserPlus,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Plus,
  PartyPopper,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";
import { useWebPush } from "@/hooks/useWebPush";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import SafetyCheckModal from "./components/SafetyCheckModal";
import ThemeToggle from "./components/ThemeToggle";

/* ── Nav definitions ── */
const sidebarNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/discover", icon: Compass, label: "Discover" },
  { href: "/dashboard/my-trips", icon: Map, label: "My Trips" },
  { href: "/dashboard/messages", icon: MessageCircle, label: "Messages" },
  { href: "/dashboard/matches", icon: Users, label: "Matches" },
  { href: "/dashboard/safety", icon: Shield, label: "Safety" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const mobileNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/discover", icon: Compass, label: "Discover" },
  { href: "/dashboard/trips/create", icon: Plus, label: "Create", isCreate: true },
  { href: "/dashboard/messages", icon: MessageCircle, label: "Messages" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
];

/* ── Helpers ── */
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

function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("destination") || searchParams?.get("q") || "");

  useEffect(() => {
    setSearchQuery(searchParams?.get("destination") || searchParams?.get("q") || "");
  }, [searchParams]);

  return (
    <div className="relative flex-1 max-w-md">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2"
        style={{ color: "var(--text-muted)" }}
      />
      <input
        type="text"
        placeholder="Search destinations..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (searchQuery.trim()) {
              router.push(`/dashboard/discover?destination=${encodeURIComponent(searchQuery.trim())}`);
            } else {
              router.push(`/dashboard/discover`);
            }
          }
        }}
        className="t-input"
        style={{
          paddingLeft: "38px",
          padding: "9px 14px 9px 38px",
          fontSize: "0.875rem",
          borderRadius: "var(--radius-full)",
        }}
      />
    </div>
  );
}

/* ── Main Layout ── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  useWebPush(user);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [kycBannerDismissed, setKycBannerDismissed] = useState(true);

  const isVerified = user?.isVerified ?? user?.status === "KYC_VERIFIED";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem("travyn-kyc-banner-dismissed");
      setKycBannerDismissed(!!dismissed);
    }
  }, []);

  const dismissKycBanner = () => {
    setKycBannerDismissed(true);
    sessionStorage.setItem("travyn-kyc-banner-dismissed", "true");
  };

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
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
    } catch { return; }
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const wsBaseUrl = apiUrl.replace("/api/v1", "");

    const client = new Client({
      webSocketFactory: () => new SockJS(`${wsBaseUrl}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        client.subscribe(`/topic/user.${user.id}.notifications`, (frame) => {
          try {
            const notification = JSON.parse(frame.body);
            if (notification.type === "DIRECT_MESSAGE" && typeof window !== "undefined") {
              const urlParams = new URLSearchParams(window.location.search);
              const isLookingAtChat = window.location.pathname === "/dashboard/messages" && urlParams.get("partnerId") === notification.referenceId;
              if (isLookingAtChat && document.visibilityState === "visible") {
                markAsRead(notification.id);
                return;
              }
            }
            addNotification(notification);
          } catch { /* ignore parse errors */ }
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleNotifClick = (notif: { id: string; read: boolean; referenceId: string | null; type: string }) => {
    if (!notif.read) markAsRead(notif.id);
    setNotifOpen(false);
    if (notif.referenceId) {
      if (notif.type === "JOIN_APPROVED" || notif.type === "JOIN_REJECTED" || notif.type === "JOIN_REQUEST" || notif.type === "NEW_MEMBER_JOINED" || notif.type === "MEMBER_LEFT" || notif.type.includes("REVIEW")) {
        router.push(`/dashboard/trips/${notif.referenceId}`);
      } else if (notif.type === "DIRECT_MESSAGE") {
        router.push(`/dashboard/messages?partnerId=${notif.referenceId}`);
      } else if (notif.type === "SAFETY_CHECK" || notif.type === "LOCATION_SHARED") {
        router.push("/dashboard/safety");
      } else {
        router.push(`/dashboard/trips/${notif.referenceId}/chat`);
      }
    } else if (notif.type === "SAFETY_CHECK" || notif.type === "LOCATION_SHARED") {
      router.push("/dashboard/safety");
    }
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>

      {/* ═══════════ DESKTOP SIDEBAR ═══════════ */}
      <aside
        className="hidden lg:flex flex-col w-[240px] fixed top-0 left-0 h-full z-40"
        style={{
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--brand)",
            }}
          >
            <Compass size={18} color="white" />
          </div>
          <span
            style={{
              fontSize: "1.25rem",
              fontFamily: "var(--font-family-display)",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Travyn
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {sidebarNav.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  background: active ? "var(--brand-light)" : "transparent",
                  color: active ? "var(--brand)" : "var(--text-secondary)",
                }}
              >
                <Icon size={18} style={{ opacity: active ? 1 : 0.7 }} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-3 py-4 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between px-3">
            <ThemeToggle size={16} />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-colors"
            style={{
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ═══════════ MOBILE SIDEBAR OVERLAY ═══════════ */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0"
            style={{ background: "var(--bg-overlay)" }}
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="absolute left-0 top-0 h-full w-72 flex flex-col"
            style={{
              background: "var(--bg-sidebar)",
              borderRight: "1px solid var(--border)",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <div className="px-5 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--brand)",
                  }}
                >
                  <Compass size={18} color="white" />
                </div>
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontFamily: "var(--font-family-display)",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Travyn
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-2 space-y-0.5">
              {sidebarNav.map(({ href, icon: Icon, label }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: active ? "var(--brand-light)" : "transparent",
                      color: active ? "var(--brand)" : "var(--text-secondary)",
                    }}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="px-3 py-4 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between px-3">
                <ThemeToggle size={16} />
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full"
                style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <div className="flex-1 lg:ml-[240px] flex flex-col min-h-screen pb-16 lg:pb-0">
        <SafetyCheckModal />

        {/* ─── TOP BAR ─── */}
        <header
          className="sticky top-0 z-30"
          style={{
            background: "var(--bg-primary)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between px-4 lg:px-5 py-3 gap-3">
            {/* Left: hamburger + search */}
            <div className="flex items-center gap-3 flex-1">
              <button
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <Menu size={22} style={{ color: "var(--text-primary)" }} />
              </button>

              {/* Mobile logo */}
              <span
                className="lg:hidden font-bold"
                style={{
                  fontFamily: "var(--font-family-display)",
                  color: "var(--text-primary)",
                  fontSize: "1.1rem",
                }}
              >
                Travyn
              </span>

              {/* Desktop search */}
              <div className="hidden sm:block flex-1">
                <Suspense fallback={<div className="w-64 h-9 rounded-full animate-pulse" style={{ background: "var(--bg-tertiary)" }} />}>
                  <SearchInput />
                </Suspense>
              </div>
            </div>

            {/* Right: theme + notifs + user */}
            <div className="flex items-center gap-1.5">
              {/* Theme toggle — mobile only (desktop has it in sidebar) */}
              <div className="lg:hidden">
                <ThemeToggle size={16} />
              </div>

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
                  <Bell size={20} style={{ color: "var(--text-secondary)" }} />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ background: "var(--danger)", color: "white", minWidth: 18, height: 18 }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notifOpen && (
                  <div
                    className="absolute right-0 top-12 w-80 rounded-xl overflow-hidden"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-xl)",
                      maxHeight: "420px",
                    }}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                          className="flex items-center gap-1 text-xs"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--brand)" }}
                        >
                          <CheckCheck size={14} />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell size={28} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
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
                              background: notif.read ? "transparent" : "var(--brand-light)",
                              border: "none",
                              borderBottom: "1px solid var(--border)",
                              cursor: "pointer",
                            }}
                          >
                            <div
                              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                              style={{
                                background: notif.read ? "var(--bg-tertiary)"
                                  : notif.type === "JOIN_APPROVED" || notif.type === "NEW_MEMBER_JOINED" ? "var(--brand-light)"
                                  : notif.type === "JOIN_REJECTED" || notif.type === "MEMBER_LEFT" ? "var(--danger-light)"
                                  : notif.type === "JOIN_REQUEST" ? "var(--accent-light)"
                                  : "var(--brand-light)",
                              }}
                            >
                              {notif.type === "JOIN_APPROVED" ? (
                                <UserPlus size={14} style={{ color: notif.read ? "var(--text-muted)" : "var(--brand)" }} />
                              ) : notif.type === "NEW_MEMBER_JOINED" ? (
                                <PartyPopper size={14} style={{ color: notif.read ? "var(--text-muted)" : "var(--brand)" }} />
                              ) : notif.type === "JOIN_REJECTED" ? (
                                <XCircle size={14} style={{ color: notif.read ? "var(--text-muted)" : "var(--danger)" }} />
                              ) : notif.type === "MEMBER_LEFT" ? (
                                <User size={14} style={{ color: notif.read ? "var(--text-muted)" : "var(--danger)" }} />
                              ) : notif.type === "JOIN_REQUEST" ? (
                                <UserPlus size={14} style={{ color: notif.read ? "var(--text-muted)" : "var(--accent)" }} />
                              ) : (
                                <MessageCircle size={14} style={{ color: notif.read ? "var(--text-muted)" : "var(--brand)" }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm leading-snug"
                                style={{
                                  color: notif.read ? "var(--text-muted)" : "var(--text-primary)",
                                  fontWeight: notif.read ? 400 : 500,
                                }}
                              >
                                {notif.message}
                              </p>
                              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                {timeAgo(notif.createdAt)}
                              </span>
                            </div>
                            {!notif.read && (
                              <div
                                className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                                style={{ background: "var(--brand)" }}
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
              <div className="relative" ref={userMenuRef}>
                <button
                  className="flex items-center gap-2 p-1.5 rounded-lg transition-colors"
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setNotifOpen(false);
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden"
                      style={{
                        background: user?.profilePhotoUrl ? "transparent" : "var(--brand)",
                        color: "white",
                      }}
                    >
                      {user?.profilePhotoUrl ? (
                        <img src={user.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        user?.firstName?.[0] || "U"
                      )}
                    </div>
                    {!isVerified && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black"
                        style={{ background: "var(--accent)", color: "#1a1a1a", boxShadow: `0 0 0 2px var(--bg-primary)` }}
                        title="Identity not verified"
                      >
                        !
                      </span>
                    )}
                  </div>
                  <span
                    className="hidden sm:block text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {user?.firstName || "User"}
                  </span>
                  <ChevronDown size={14} style={{ color: "var(--text-muted)" }} className="hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-12 w-48 rounded-xl py-1.5"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-lg)",
                    }}
                  >
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User size={16} /> Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings size={16} /> Settings
                    </Link>
                    <hr style={{ borderColor: "var(--border)", margin: "4px 0" }} />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm w-full"
                      style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ─── KYC NUDGE BANNER ─── */}
        {!isVerified && !kycBannerDismissed && (
          <div
            className="flex items-center justify-between gap-3 px-4 lg:px-5 py-2.5"
            style={{
              background: "var(--accent-light)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--accent-text)" }}>
              <AlertTriangle size={15} />
              <span>
                Your identity is not verified. Verified travelers get <strong>3× more trip invites</strong>.
              </span>
              <a
                href="/dashboard/settings/kyc"
                className="inline-flex items-center gap-1 font-semibold hover:underline ml-1"
                style={{ color: "var(--accent-text)" }}
              >
                Verify Now <ArrowRight size={13} />
              </a>
            </div>
            <button
              onClick={dismissKycBanner}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-text)", opacity: 0.6 }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ─── PAGE CONTENT ─── */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>

      {/* ═══════════ MOBILE BOTTOM NAV ═══════════ */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: "var(--bg-primary)",
          borderTop: "1px solid var(--border)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex items-center justify-around h-14">
          {mobileNav.map(({ href, icon: Icon, label, isCreate }) => {
            const active = isActive(href);

            if (isCreate) {
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center justify-center -mt-4"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      background: "var(--brand)",
                      boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
                    }}
                  >
                    <Icon size={22} color="white" strokeWidth={2.5} />
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-0.5 py-1 px-3"
              >
                <Icon
                  size={20}
                  style={{ color: active ? "var(--brand)" : "var(--text-muted)" }}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{ color: active ? "var(--brand)" : "var(--text-muted)" }}
                >
                  {label}
                </span>
                {/* Unread badge on Messages */}
                {href === "/dashboard/messages" && unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                    style={{ background: "var(--danger)", color: "white" }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
