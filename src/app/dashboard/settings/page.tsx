"use client";
import { Settings, SlidersHorizontal, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-txt-white)" }}>Settings</h1>
          <p className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>Manage your account and preferences</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Match Preferences Card */}
        <Link
          href="/onboarding"
          className="block rounded-xl p-5 transition-all"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", textDecoration: "none" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "var(--brand-light)", color: "var(--brand)" }}
              >
                <SlidersHorizontal size={22} />
              </div>
              <div>
                <h2 className="font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>Match Preferences</h2>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Update your travel style, budget, and compatibility answers.</p>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
          </div>
        </Link>

        {/* General Placeholder */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", opacity: 0.6 }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
            >
              <Settings size={22} />
            </div>
            <div>
              <h2 className="font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>General Settings</h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Account details, privacy controls, and notifications coming soon.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
