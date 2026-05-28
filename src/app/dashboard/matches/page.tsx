"use client";
import { Users } from "lucide-react";
export default function MatchesPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)" }}>
        <Users size={36} style={{ color: "#a78bfa" }} />
      </div>
      <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--color-txt-white)" }}>Travel Matches</h1>
      <p className="text-sm max-w-sm" style={{ color: "var(--color-txt-secondary)" }}>
        Compatibility matching based on your travel style, budget, and personality is coming soon.
        Complete your profile to get matched with ideal travel companions.
      </p>
    </div>
  );
}
