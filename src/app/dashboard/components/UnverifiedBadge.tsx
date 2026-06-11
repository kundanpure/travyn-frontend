"use client";

import { AlertTriangle } from "lucide-react";
import React from "react";

interface UnverifiedBadgeProps {
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export default function UnverifiedBadge({ size = 18, showLabel = false, className = "" }: UnverifiedBadgeProps) {
  return (
    <div 
      className={`inline-flex items-center gap-1.5 ${className}`}
      title="Identity Pending"
    >
      <div 
        className="inline-flex items-center justify-center rounded-full"
        style={{ 
          width: size + 4, 
          height: size + 4, 
          background: "rgba(251, 191, 36, 0.15)",
        }}
      >
        <AlertTriangle size={size} style={{ color: "#fbbf24" }} />
      </div>
      {showLabel && (
        <span 
          className="text-xs font-medium"
          style={{ color: "#fbbf24" }}
        >
          Identity Pending
        </span>
      )}
    </div>
  );
}
