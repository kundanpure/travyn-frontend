"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Loader2 } from "lucide-react";
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
        router.push("/dashboard");
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
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "var(--color-bg-deep)" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))",
            }}
          >
            <Compass size={18} color="#06080c" />
          </div>
          <span className="t-gradient-text" style={{ fontSize: "1.4rem", fontFamily: "var(--font-family-display)", fontWeight: 700 }}>Travyn</span>
        </Link>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-line)",
          }}
        >
          <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "var(--color-txt-white)" }}>Welcome Back</h1>
          <p
            className="text-center mb-6 text-sm"
            style={{ color: "var(--color-txt-secondary)" }}
          >
            Sign in to continue your adventure
          </p>

          {/* Error */}
          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{
                background: "rgba(248, 113, 113, 0.1)",
                border: "1px solid rgba(248, 113, 113, 0.3)",
                color: "var(--color-danger)",
              }}
            >
              {error}
            </div>
          )}

          <div className="mb-6 flex justify-center">
            {loading ? (
               <Loader2 size={24} className="animate-spin text-emerald-500" />
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

          <p className="text-center mt-6 text-sm" style={{ color: "var(--color-txt-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ color: "var(--color-primary-bright)", fontWeight: 600 }}>
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
