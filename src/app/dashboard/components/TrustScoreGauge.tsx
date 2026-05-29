'use client'

import React from 'react'

interface TrustScoreGaugeProps {
  score: number;
}

export function TrustScoreGauge({ score }: TrustScoreGaugeProps) {
  // Map score 0-100 to an SVG circle stroke dasharray
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = "text-emerald-500";
  if (score < 40) color = "text-red-500";
  else if (score < 70) color = "text-yellow-500";

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-900/50 rounded-xl border border-gray-800 shadow-xl backdrop-blur-md">
      <div className="relative flex items-center justify-center">
        {/* Background Circle */}
        <svg className="w-28 h-28 transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-800"
          />
          {/* Progress Circle */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${color} transition-all duration-1000 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{score}</span>
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Score</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <h3 className="text-sm font-semibold text-gray-200">Nomadly TrustScore</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-[150px]">
          Based on verified ID and community reviews.
        </p>
      </div>
    </div>
  )
}
