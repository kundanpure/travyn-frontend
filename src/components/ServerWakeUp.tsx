"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * ServerWakeUp — A fun, interactive loading overlay shown when the
 * backend is cold-starting on Render's free tier (~30 seconds).
 *
 * Features:
 * - Detects cold start by pinging /actuator/health
 * - Shows a fun "Catch the Backpack" mini-game while waiting
 * - Auto-dismisses when the server responds
 * - Includes a playful "developer runs on free tier" message
 */

interface BackpackPosition {
  x: number;
  y: number;
}

export default function ServerWakeUp({
  onServerReady,
}: {
  onServerReady: () => void;
}) {
  const [isWaking, setIsWaking] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false); // only show after 2s delay
  const [score, setScore] = useState(0);
  const [backpack, setBackpack] = useState<BackpackPosition>({ x: 50, y: 50 });
  const [dots, setDots] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [funFact, setFunFact] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const funFacts = [
    "🌍 25% of all leisure trips globally are taken solo",
    "🎒 Solo travel is growing at 7% annually",
    "☕ Our developer runs on caffeine and free-tier services",
    "🔒 Your identity is verified with military-grade encryption",
    "🤝 Every Travyn user has a verified TrustScore",
    "📍 Live location sharing keeps you safe on every trip",
    "💬 Trip chat is end-to-end encrypted",
    "⚡ The server is stretching... almost ready!",
  ];

  // Ping via the Next.js server-side proxy to avoid CORS issues.
  // The browser calls /api/health (same origin), which internally
  // pings the Render backend from the server where CORS doesn't apply.
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health", {
        method: "GET",
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "UP") {
          setIsWaking(false);
          onServerReady();
          return true;
        }
      }
    } catch {
      // Server still waking up — keep polling
    }
    return false;
  }, [onServerReady]);

  // Start polling on mount
  useEffect(() => {
    let cancelled = false;

    // Show the overlay only if the first response takes more than 2 seconds
    const overlayTimer = setTimeout(() => {
      if (!cancelled) setShowOverlay(true);
    }, 2000);

    const poll = async () => {
      const ready = await checkHealth();
      if (!ready && !cancelled) {
        setTimeout(poll, 3000);
      } else if (ready) {
        clearTimeout(overlayTimer);
      }
    };
    poll();

    return () => {
      cancelled = true;
      clearTimeout(overlayTimer);
    };
  }, [checkHealth]);

  // Animated dots
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Rotate fun facts every 4 seconds
  useEffect(() => {
    const factInterval = setInterval(() => {
      setFunFact((f) => (f + 1) % funFacts.length);
    }, 4000);
    return () => clearInterval(factInterval);
  }, [funFacts.length]);

  // Move backpack to random position
  const moveBackpack = useCallback(() => {
    setBackpack({
      x: 10 + Math.random() * 70,
      y: 20 + Math.random() * 50,
    });
  }, []);

  // Auto-move backpack every 1.5 seconds
  useEffect(() => {
    const moveInterval = setInterval(moveBackpack, 1500);
    return () => clearInterval(moveInterval);
  }, [moveBackpack]);

  const catchBackpack = () => {
    setScore((s) => s + 1);
    moveBackpack();
  };

  if (!isWaking || !showOverlay) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #06080c 0%, #0a1628 50%, #0f1f3d 100%)",
        color: "#e2e8f0",
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Animated background particles */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 0.15 }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#2dd4a8",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div style={{ textAlign: "center", zIndex: 1, maxWidth: 500, padding: "0 24px" }}>
        {/* Logo / Title */}
        <div style={{ fontSize: 48, marginBottom: 8 }}>🌏</div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            background: "linear-gradient(135deg, #2dd4a8, #34eabd)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 8,
          }}
        >
          Travyn
        </h1>

        {/* Status message */}
        <p style={{ fontSize: 16, color: "#94a3b8", marginBottom: 4 }}>
          Waking up the server{dots}
        </p>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
          {elapsedSeconds}s elapsed • Free tier cold start
        </p>

        {/* Progress bar */}
        <div
          style={{
            width: "100%",
            height: 4,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 4,
            overflow: "hidden",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min((elapsedSeconds / 35) * 100, 95)}%`,
              background: "linear-gradient(90deg, #2dd4a8, #34eabd)",
              borderRadius: 4,
              transition: "width 1s linear",
            }}
          />
        </div>

        {/* Mini game area */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 200,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: 20,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 12,
              fontSize: 11,
              color: "#64748b",
            }}
          >
            🎮 Tap the backpack! Score: <span style={{ color: "#2dd4a8", fontWeight: 700 }}>{score}</span>
          </div>

          {/* The backpack to catch */}
          <button
            onClick={catchBackpack}
            style={{
              position: "absolute",
              left: `${backpack.x}%`,
              top: `${backpack.y}%`,
              transform: "translate(-50%, -50%)",
              fontSize: 36,
              background: "none",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              filter: "drop-shadow(0 0 12px rgba(45, 212, 168, 0.4))",
              userSelect: "none",
            }}
            aria-label="Catch the backpack"
          >
            🎒
          </button>
        </div>

        {/* Rotating fun facts */}
        <p
          style={{
            fontSize: 13,
            color: "#94a3b8",
            minHeight: 20,
            transition: "opacity 0.5s",
            marginBottom: 24,
          }}
        >
          {funFacts[funFact]}
        </p>

        {/* Developer message */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 13,
            color: "#64748b",
          }}
        >
          <span>🍜 Developer runs on instant noodles & free tier</span>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
