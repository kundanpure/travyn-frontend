"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

interface SafetyCheck {
  id: string;
  tripId: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export default function SafetyCheckModal() {
  const { user } = useAuthStore();
  const [activeCheck, setActiveCheck] = useState<SafetyCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!user) return;

    const fetchChecks = async () => {
      try {
        const res = await api.get("/safety-checks/active");
        if (res.data && res.data.length > 0) {
          // Sort by nearest expiration
          const checks = res.data as SafetyCheck[];
          checks.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
          setActiveCheck(checks[0]);
        } else {
          setActiveCheck(null);
        }
      } catch (e) {
        console.error("Failed to fetch safety checks", e);
      }
    };

    fetchChecks();
    const interval = setInterval(fetchChecks, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!activeCheck) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiresAt = new Date(activeCheck.expiresAt).getTime();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft("EXPIRED - ESCALATING");
        // Re-fetch to clear it if the backend marked it escalated
        setTimeout(() => {
            api.get("/safety-checks/active").then(res => {
                if (!res.data || res.data.length === 0) setActiveCheck(null);
            });
        }, 5000);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [activeCheck]);

  const handleResolve = async () => {
    if (!activeCheck) return;
    setLoading(true);
    try {
      await api.post(`/safety-checks/${activeCheck.id}/resolve`);
      setActiveCheck(null);
    } catch (e) {
      alert("Failed to confirm safety. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  if (!activeCheck) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border-2 border-red-500 rounded-2xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" />
        </div>
        
        <h2 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Safety Check</h2>
        <p className="text-gray-300 mb-6 text-lg">
          You haven't moved in over 2 hours and are away from your Safe Zones. Are you okay?
        </p>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 w-full mb-8">
          <p className="text-red-400 text-sm font-semibold mb-1">Time until automatic SOS escalation:</p>
          <p className="text-4xl font-mono font-bold text-red-500">{timeLeft}</p>
        </div>

        <button
          onClick={handleResolve}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? "Confirming..." : (
            <>
              <CheckCircle2 className="w-6 h-6" />
              I'm Safe
            </>
          )}
        </button>
        <p className="text-xs text-gray-500 mt-4">
          If you do not respond, your emergency contacts will be notified automatically with your last known location.
        </p>
      </div>
    </div>
  );
}
