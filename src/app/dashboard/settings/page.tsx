"use client";
import { Settings } from "lucide-react";
export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)" }}>
        <Settings size={36} style={{ color: "#60a5fa" }} />
      </div>
      <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--color-txt-white)" }}>Settings</h1>
      <p className="text-sm max-w-sm" style={{ color: "var(--color-txt-secondary)" }}>
        Account settings, notification preferences, privacy controls, and subscription management coming soon.
      </p>
    </div>
  );
}
