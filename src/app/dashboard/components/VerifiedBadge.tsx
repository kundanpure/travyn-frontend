"use client";

import { CheckCircle } from "lucide-react";
import React from "react";

interface VerifiedBadgeProps {
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export default function VerifiedBadge({ size = 18, showLabel = false, className = "" }: VerifiedBadgeProps) {
  return (
    <div 
      className={`inline-flex items-center gap-1.5 ${className}`}
      title="Verified Traveler"
    >
      <div 
        className="inline-flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
        style={{ width: size + 4, height: size + 4 }}
      >
        <CheckCircle size={size} className="fill-emerald-500/20" />
      </div>
      {showLabel && (
        <span 
          className="text-xs font-medium"
          style={{ color: "#2dd4a8" }}
        >
          Verified
        </span>
      )}
    </div>
  );
}
