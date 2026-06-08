"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Map as MapIcon, Info } from "lucide-react";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

export default function MapPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-txt-muted)" }}
        >
          <ArrowLeft size={16} /> Back to Trip
        </button>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--color-txt-white)" }}>
          <MapIcon size={24} style={{ color: "var(--color-primary)" }} />
          Live Trip Map
        </h1>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: "rgba(45,212,168,0.1)", color: "var(--color-primary)", border: "1px solid rgba(45,212,168,0.2)" }}>
        <Info size={16} className="flex-shrink-0" />
        <span>Your live location is broadcasted to the group while this map is open. Right-click or long-press the map to drop a shared "Meet Here" pin.</span>
      </div>

      {/* Map */}
      <MapComponent tripId={tripId} />
    </div>
  );
}
