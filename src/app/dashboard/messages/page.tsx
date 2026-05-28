"use client";

import { MessageCircle, Search, Users } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: "rgba(45,212,168,0.1)", border: "1px solid rgba(45,212,168,0.2)" }}
      >
        <MessageCircle size={36} style={{ color: "var(--color-primary)" }} />
      </div>
      <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--color-txt-white)" }}>
        Direct Messages
      </h1>
      <p className="text-sm mb-8 max-w-sm" style={{ color: "var(--color-txt-secondary)" }}>
        Chat privately with fellow travelers. Join or create a trip to start messaging your group.
      </p>
      <div
        className="w-full max-w-sm p-5 rounded-2xl text-left"
        style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Search size={14} style={{ color: "var(--color-txt-muted)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--color-txt-muted)" }}>
            COMING SOON
          </span>
        </div>
        <div className="space-y-3">
          {["Direct messaging between trip members", "Message request approval", "Media sharing"].map(
            (feat) => (
              <div key={feat} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-primary)" }} />
                <span className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>{feat}</span>
              </div>
            )
          )}
        </div>
      </div>
      <p className="mt-6 text-xs" style={{ color: "var(--color-txt-dim)" }}>
        Use <strong>Trip Chat</strong> inside a trip for group conversations.
      </p>
    </div>
  );
}
