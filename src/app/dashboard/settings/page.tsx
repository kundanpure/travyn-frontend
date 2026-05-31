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
        <Link href="/onboarding" className="block rounded-3xl p-6 transition-all hover:bg-white/5" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/20 text-emerald-400">
                <SlidersHorizontal size={24} />
              </div>
              <div>
                <h2 className="font-bold text-white mb-1">Match Preferences</h2>
                <p className="text-sm text-white/50">Update your travel style, budget, and compatibility answers.</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-white/30" />
          </div>
        </Link>

        {/* General Placeholder */}
        <div className="rounded-3xl p-6" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}>
          <div className="flex items-center gap-4 opacity-50">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-500/20 text-blue-400">
              <Settings size={24} />
            </div>
            <div>
              <h2 className="font-bold text-white mb-1">General Settings</h2>
              <p className="text-sm text-white/50">Account details, privacy controls, and notifications coming soon.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
