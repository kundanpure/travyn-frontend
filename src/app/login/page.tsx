"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Loader2, MapPin, Route } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { useServerStatus } from "@/context/ServerStatusContext";
import ServerWakeUp from "@/components/ServerWakeUp";
import { GoogleLogin } from "@react-oauth/google";
import GoogleCompleteProfileModal from "@/components/GoogleCompleteProfileModal";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { status } = useServerStatus();
  const [showGame, setShowGame] = useState(false);
  const pendingActionRef = React.useRef<(() => void) | null>(null);

  // When server becomes ready AND user was waiting → hide game and retry action
  React.useEffect(() => {
    if (status === "up" && showGame && pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      setShowGame(false);
      setTimeout(() => action(), 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  
  // Google Auth states
  const [googleProfileData, setGoogleProfileData] = useState<any>(null);
  const [googleCredential, setGoogleCredential] = useState("");

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (status !== "up") {
      pendingActionRef.current = () => handleGoogleSuccess(credentialResponse);
      setShowGame(true);
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/google/login", {
        credential: credentialResponse.credential,
      });

      if (res.status === 202 && res.data.error === "PROFILE_COMPLETION_REQUIRED") {
        setGoogleProfileData(res.data);
        setGoogleCredential(credentialResponse.credential);
      } else {
        const data = res.data;
        setAuth(data.user, data.access_token, data.refresh_token);
        // Check for pending invite link
        const pendingInvite = sessionStorage.getItem("pendingInviteToken");
        if (pendingInvite) {
          sessionStorage.removeItem("pendingInviteToken");
          router.push(`/invite/${pendingInvite}`);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setError("Google Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {showGame && <ServerWakeUp />}
    <div className="auth-shell">
      {/* Ambient glow */}
      <div className="auth-accent-glow" style={{ top: "-15%", right: "10%" }} />
      <div className="auth-accent-glow" style={{ bottom: "-10%", left: "5%", background: "radial-gradient(circle, rgba(37, 109, 133, 0.08), transparent 70%)" }} />

      {/* Floating decorative travel icons */}
      <div className="auth-floating-icon" style={{ top: "12%", left: "8%" }}>
        <Compass size={64} />
      </div>
      <div className="auth-floating-icon" style={{ bottom: "18%", right: "10%" }}>
        <MapPin size={48} />
      </div>
      <div className="auth-floating-icon" style={{ top: "55%", left: "75%" }}>
        <Route size={40} />
      </div>

      <div className="w-full max-w-md" style={{ position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="auth-brand-icon">
            <Compass size={20} color="#f6a73a" />
          </div>
          <span className="auth-brand-text">Travyn</span>
        </Link>

        {/* Card */}
        <div className="auth-card">
          <h1 className="auth-heading text-2xl mb-2 text-center">Welcome back, traveler</h1>
          <p className="auth-subheading text-center mb-6">
            Continue planning safer journeys with verified companions
          </p>

          {/* Error */}
          {error && (
            <div className="auth-error mb-4 animate-in fade-in slide-in-from-top-2">
              <span>{error}</span>
            </div>
          )}

          <div className="mb-6 flex justify-center">
            {loading ? (
               <Loader2 size={24} className="animate-spin" style={{ color: "#f6a73a" }} />
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Login failed.")}
                theme="filled_black"
                shape="rectangular"
                text="continue_with"
              />
            )}
          </div>

          <p className="text-center mt-6 text-sm" style={{ color: "#64748b" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="auth-link">
              Join Travyn
            </Link>
          </p>
        </div>
      </div>
    </div>

    {googleProfileData && (
      <GoogleCompleteProfileModal
        email={googleProfileData.email}
        firstName={googleProfileData.firstName}
        lastName={googleProfileData.lastName}
        profilePictureUrl={googleProfileData.profilePictureUrl}
        credential={googleCredential}
        onClose={() => setGoogleProfileData(null)}
      />
    )}
    </>
  );
}
