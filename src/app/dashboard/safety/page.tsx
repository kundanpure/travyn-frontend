"use client";
import { Shield } from "lucide-react";
export default function SafetyPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
        <Shield size={36} style={{ color: "#f87171" }} />
      </div>
      <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--color-txt-white)" }}>Safety Centre</h1>
      <p className="text-sm max-w-sm" style={{ color: "var(--color-txt-secondary)" }}>
        Emergency contacts, SOS button, live location sharing, and incident reporting are coming soon.
        Your safety is our top priority.
      </p>
    </div>
  );
}
