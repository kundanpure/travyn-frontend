"use client";

import { CheckCircle } from "lucide-react";
import React from "react";

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
}

export default function VerifiedBadge({ size = 18, className = "" }: VerifiedBadgeProps) {
  return (
    <div 
      className={`inline-flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ${className}`}
      title="Verified Traveler"
      style={{ width: size + 4, height: size + 4 }}
    >
      <CheckCircle size={size} className="fill-emerald-500/20" />
    </div>
  );
}
