"use client";

import { useAuthStore } from "@/stores/auth-store";
import {
  MapPin,
  Plus,
  Users,
  User,
  Shield,
  TrendingUp,
  Compass,
  ArrowRight,
  Star,
} from "lucide-react";
import Link from "next/link";

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  accent = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="t-card group flex items-start gap-4 cursor-pointer"
      style={{ padding: 20 }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: accent
            ? "linear-gradient(135deg, var(--color-accent), var(--color-accent-dim))"
            : "linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))",
          color: "#06080c",
        }}
      >
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm mb-0.5" style={{ color: "var(--color-txt-white)" }}>
          {title}
        </h3>
        <p className="text-xs" style={{ color: "var(--color-txt-muted)" }}>
          {description}
        </p>
      </div>
      <ArrowRight
        size={16}
        className="opacity-0 group-hover:opacity-100 transition-opacity mt-1"
        style={{ color: "var(--color-txt-muted)" }}
      />
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div
        className="rounded-2xl p-6 md:p-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(45, 212, 168, 0.12), rgba(240, 160, 48, 0.08))",
          border: "1px solid rgba(45, 212, 168, 0.15)",
        }}
      >
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--color-txt-white)" }}>
            Welcome back, {user?.firstName || "Traveler"}! 👋
          </h1>
          <p style={{ color: "var(--color-txt-secondary)" }}>
            Ready for your next adventure? Let&apos;s find your perfect travel companion.
          </p>
        </div>
        <Compass
          size={120}
          className="absolute -right-4 -bottom-4 opacity-[0.06]"
          style={{ color: "var(--color-primary)" }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Shield, label: "TrustScore", value: "45", sub: "/100", color: "var(--color-primary)" },
          { icon: MapPin, label: "Trips", value: "0", sub: "completed", color: "var(--color-accent)" },
          { icon: Users, label: "Matches", value: "0", sub: "pending", color: "var(--color-primary-bright)" },
          { icon: Star, label: "Rating", value: "—", sub: "no reviews", color: "var(--color-accent-bright)" },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="t-card" style={{ padding: 20 }}>
            <div className="flex items-center gap-3 mb-3">
              <Icon size={18} style={{ color }} />
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-txt-muted)" }}>
                {label}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold" style={{ color: "var(--color-txt-white)" }}>{value}</span>
              <span className="text-sm" style={{ color: "var(--color-txt-muted)" }}>{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Trips */}
        <div className="t-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: "var(--color-txt-white)" }}>Upcoming Trips</h2>
            <Link
              href="/dashboard/my-trips"
              className="text-xs font-medium"
              style={{ color: "var(--color-primary-bright)" }}
            >
              View All
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <MapPin size={40} className="mb-3" style={{ color: "var(--color-line)" }} />
            <p className="font-medium mb-1" style={{ color: "var(--color-txt-secondary)" }}>
              No upcoming trips yet
            </p>
            <p className="text-sm mb-4" style={{ color: "var(--color-txt-muted)" }}>
              Create your first trip or browse curated adventures
            </p>
            <Link href="/dashboard/discover" className="t-btn-primary" style={{ padding: "8px 20px", fontSize: "0.85rem" }}>
              <Plus size={16} /> Create a Trip
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="font-semibold mb-1" style={{ color: "var(--color-txt-white)" }}>Quick Actions</h2>
          <QuickActionCard
            icon={Plus}
            title="Create a Trip"
            description="Plan a new adventure and invite companions"
            href="/dashboard/my-trips"
          />
          <QuickActionCard
            icon={Compass}
            title="Discover Trips"
            description="Browse curated trips from verified creators"
            href="/dashboard/discover"
            accent
          />
          <QuickActionCard
            icon={User}
            title="Complete Your Profile"
            description="Add travel preferences to unlock matching"
            href="/dashboard/profile"
          />
          <QuickActionCard
            icon={TrendingUp}
            title="Boost TrustScore"
            description="Verify your identity and add emergency contacts"
            href="/dashboard/settings"
            accent
          />
        </div>
      </div>
    </div>
  );
}
