"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, ShieldCheck, ArrowRight, Upload, X, Loader2, AlertCircle, CheckCircle, MapPin, Route } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { useServerStatus } from "@/context/ServerStatusContext";
import ServerWakeUp from "@/components/ServerWakeUp";
import { QrScanner, QrHelpGuide } from "@/components/ui/QrScanner";
import { GoogleLogin } from "@react-oauth/google";
import GoogleCompleteProfileModal from "@/components/GoogleCompleteProfileModal";

type RegisterMode = "SELECTION" | "AADHAAR_SCAN" | "AADHAAR_PREVIEW" | "AADHAAR_ACCOUNT";

interface AadhaarData {
  extractedName: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  aadhaarLast4: string;
  previewToken: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { status } = useServerStatus();
  const [mode, setMode] = useState<RegisterMode>("SELECTION");
  const [loading, setLoading] = useState(false);
  const [showUploadHelp, setShowUploadHelp] = useState(false);
  const [error, setError] = useState("");
  // Game overlay state
  const [showGame, setShowGame] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  // When server becomes ready AND user was waiting → hide game and retry action
  useEffect(() => {
    if (status === "up" && showGame && pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      setShowGame(false);
      setTimeout(() => action(), 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Aadhaar State
  const [aadhaarData, setAadhaarData] = useState<AadhaarData | null>(null);
  const [scanMethod, setScanMethod] = useState<"CAMERA" | "FILE">("CAMERA");

  // Form State
  const [form, setForm] = useState({
    username: "",
    agreeTerms: false,
  });

  // Google Auth states
  const [googleProfileData, setGoogleProfileData] = useState<any>(null);
  const [googleCredential, setGoogleCredential] = useState("");

  const [usernameStatus, setUsernameStatus] = useState<"IDLE" | "CHECKING" | "AVAILABLE" | "TAKEN" | "ERROR">("IDLE");

  useEffect(() => {
    const timer = setTimeout(async () => {
      const username = form.username.trim().toLowerCase();
      if (!username) {
        setUsernameStatus("IDLE");
        return;
      }
      
      // Client-side regex check before hitting API
      if (username.length < 3 || username.length > 30 || !/^[a-z0-9_.]+$/.test(username)) {
        setUsernameStatus("ERROR");
        return;
      }

      setUsernameStatus("CHECKING");
      try {
        const res = await api.get(`/auth/check-username?username=${username}`);
        setUsernameStatus(res.data.available ? "AVAILABLE" : "TAKEN");
      } catch {
        setUsernameStatus("ERROR");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.username]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image size must be less than 5MB"); return; }

    // If server isn't ready → show game and wait
    if (status !== "up") {
      pendingActionRef.current = () => {
        // Re-trigger the file upload after server wakes up
        const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFileUpload(fakeEvent);
      };
      setShowGame(true);
      return;
    }

    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await api.post("/auth/aadhaar-preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAadhaarData(res.data);
      setMode("AADHAAR_PREVIEW");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || "Failed to read Aadhaar QR. Please make sure the image is clear.");
    } finally {
      setLoading(false);
    }
  };

  const handleQrScanSuccess = async (decodedText: string) => {
    // If server isn't ready
    if (status !== "up") {
      pendingActionRef.current = () => handleQrScanSuccess(decodedText);
      setShowGame(true);
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/aadhaar-preview/raw", { qrData: decodedText });
      setAadhaarData(res.data);
      setMode("AADHAAR_PREVIEW");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || "Failed to process Aadhaar data.");
    } finally {
      setLoading(false);
    }
  };

  const handleAadhaarGoogleSuccess = async (credentialResponse: any) => {
    if (!aadhaarData) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/aadhaar/google-register", {
        username: form.username,
        previewToken: aadhaarData.previewToken,
        credential: credentialResponse.credential
      });
      const data = res.data;
      setAuth(data.user, data.access_token, data.refresh_token);
      router.push("/onboarding");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: string; details?: { field: string; message: string }[] } } };
      const data = axiosErr.response?.data;
      if (data?.details?.length) {
        setError(data.details.map(d => d.message).join('. '));
      } else {
        setError(data?.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
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
    <div className="auth-shell">
      {/* Ambient glow */}
      <div className="auth-accent-glow" style={{ top: "-12%", left: "15%" }} />
      <div className="auth-accent-glow" style={{ bottom: "-10%", right: "8%", background: "radial-gradient(circle, rgba(37, 109, 133, 0.08), transparent 70%)" }} />

      {/* Floating decorative travel icons */}
      <div className="auth-floating-icon" style={{ top: "8%", right: "12%" }}>
        <Compass size={56} />
      </div>
      <div className="auth-floating-icon" style={{ bottom: "15%", left: "6%" }}>
        <MapPin size={44} />
      </div>
      <div className="auth-floating-icon" style={{ top: "60%", right: "80%" }}>
        <Route size={36} />
      </div>

      <div className="w-full max-w-md" style={{ position: "relative", zIndex: 1 }}>
        
        {/* Header */}
        <div className="text-center mb-8 relative">
          {mode !== "SELECTION" && (
            <button 
              onClick={() => {
                setMode("SELECTION");
                setError("");
                setAadhaarData(null);
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors"
              style={{ color: "#94a3b8" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <X size={20} />
            </button>
          )}
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="auth-brand-icon">
              <Compass size={20} color="#f6a73a" />
            </div>
            <span className="auth-brand-text">Travyn</span>
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-error mb-6 animate-in fade-in slide-in-from-top-2">
            <X size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ==================== MODE: SELECTION ==================== */}
        {mode === "SELECTION" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h1 className="auth-heading text-2xl text-center mb-2">Join the journey</h1>
            <p className="auth-subheading text-center mb-8">
              Create your account to find verified travel companions
            </p>

            <div className="flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Login failed.")}
                theme="filled_black"
                shape="rectangular"
                text="continue_with"
              />
            </div>

            {/* Warm divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="auth-divider-line"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="auth-divider-text" style={{ background: "#0c1118" }}>
                  Or use another method
                </span>
              </div>
            </div>

            <button 
              onClick={() => setMode("AADHAAR_SCAN")}
              className="auth-action-card group"
            >
              <div className="flex items-start gap-4">
                <div className="auth-action-icon">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="auth-heading font-bold mb-1" style={{ fontSize: "1rem" }}>Verify with Aadhaar Secure QR</h3>
                  <p className="auth-subheading" style={{ fontSize: "0.85rem" }}>
                    Private, offline QR check. Your image is never stored.
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ==================== MODE: AADHAAR SCAN ==================== */}
        {mode === "AADHAAR_SCAN" && (
          <div className="auth-card animate-in fade-in slide-in-from-right-4">
            <h1 className="auth-heading text-xl mb-2 text-center">Scan Aadhaar QR</h1>
            <p className="auth-subheading text-center mb-8">
              Point your camera at the QR code on the back of your Aadhaar card.
            </p>

            {scanMethod === "CAMERA" ? (
              <div className="mb-6">
                <QrScanner 
                  onScanSuccess={handleQrScanSuccess} 
                  onScanFailure={() => {}} 
                />
                <div className="mt-6 text-center">
                  <button 
                    onClick={() => setScanMethod("FILE")}
                    className="auth-muted-link"
                  >
                    Or upload an image instead
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                {showUploadHelp && (
                  <div className="absolute inset-0 z-30">
                    <QrHelpGuide onClose={() => setShowUploadHelp(false)} />
                  </div>
                )}
                <label className="block w-full cursor-pointer group">
                  <div className="auth-upload-zone">
                    {loading ? (
                      <Loader2 size={40} className="animate-spin mb-4" style={{ color: "#f6a73a" }} />
                    ) : (
                      <Upload size={40} className="mb-4 group-hover:-translate-y-1 transition-transform" style={{ color: "#f6a73a" }} />
                    )}
                    <span className="font-medium" style={{ color: "#f6a73a" }}>
                      {loading ? "Analyzing QR code..." : "Tap to browse files"}
                    </span>
                    <span className="text-xs mt-2" style={{ color: "rgba(246, 167, 58, 0.55)" }}>JPEG, PNG, WEBP (Max 5MB)</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={loading} />
                </label>
                <div className="mt-6 text-center">
                  <button 
                    onClick={() => setScanMethod("CAMERA")}
                    className="auth-muted-link"
                  >
                    Switch to Camera Scan
                  </button>
                  <span className="mx-3" style={{ color: "#475569" }}>|</span>
                  <button 
                    onClick={() => setShowUploadHelp(true)}
                    className="auth-muted-link"
                  >
                    View Scanning Tips
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== MODE: AADHAAR PREVIEW ==================== */}
        {mode === "AADHAAR_PREVIEW" && aadhaarData && (
          <div className="auth-card animate-in fade-in slide-in-from-right-4">
            <div className="flex justify-center mb-6">
              <div className="auth-verified-icon">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
            </div>
            
            <h1 className="auth-heading text-xl mb-2 text-center">QR Verified</h1>
            <p className="auth-subheading text-center mb-8">
              We successfully read your Aadhaar details. Please confirm they are correct.
            </p>

            <div className="space-y-3 mb-8">
              <div className="auth-data-row">
                <span className="auth-data-label">Full Name</span>
                <span className="auth-data-value">{aadhaarData.extractedName}</span>
              </div>
              <div className="auth-data-row">
                <span className="auth-data-label">Gender</span>
                <span className="auth-data-value">{aadhaarData.gender}</span>
              </div>
              <div className="auth-data-row">
                <span className="auth-data-label">Date of Birth</span>
                <span className="auth-data-value">{aadhaarData.dob}</span>
              </div>
              <div className="auth-data-row">
                <span className="auth-data-label">Aadhaar Last 4</span>
                <span className="auth-data-value tracking-widest" style={{ color: "#2dd4a8" }}>•••• {aadhaarData.aadhaarLast4}</span>
              </div>
            </div>

            <button 
              onClick={() => setMode("AADHAAR_ACCOUNT")}
              className="auth-btn-primary w-full p-4 text-base"
            >
              Confirm & Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ==================== MODE: AADHAAR ACCOUNT SETUP ==================== */}
        {mode === "AADHAAR_ACCOUNT" && aadhaarData && (
          <div className="auth-card animate-in fade-in slide-in-from-right-4">
            <h1 className="auth-heading text-xl mb-2 text-center">Setup Login</h1>
            <p className="auth-subheading text-center mb-6">
              Hey {aadhaarData.firstName}, just pick a username and link your Google account to secure your profile.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#64748b" }}>@</span>
                  <input type="text" className="t-input pl-8" placeholder="your_username" required
                    value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase() })} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === "CHECKING" && <Loader2 size={16} className="animate-spin" style={{ color: "#64748b" }} />}
                    {usernameStatus === "AVAILABLE" && <CheckCircle size={16} className="text-emerald-400" />}
                    {usernameStatus === "TAKEN" && <X size={16} className="text-red-400" />}
                    {usernameStatus === "ERROR" && <AlertCircle size={16} className="text-red-400" />}
                  </div>
                </div>
                {usernameStatus === "TAKEN" && <p className="text-xs text-red-400 mt-1">This username is already taken.</p>}
                {usernameStatus === "ERROR" && form.username.length > 0 && <p className="text-xs text-red-400 mt-1">Must be 3-30 chars, lowercase, numbers, _, .</p>}
              </div>

              <label className="flex items-start gap-2 cursor-pointer mt-6 mb-6">
                <input type="checkbox" className="mt-1" checked={form.agreeTerms} onChange={e => setForm({ ...form, agreeTerms: e.target.checked })} />
                <span className="text-sm" style={{ color: "#94a3b8" }}>
                  I agree to the <a href="#" className="auth-link" style={{ fontWeight: 500 }}>Terms of Service</a> and <a href="#" className="auth-link" style={{ fontWeight: 500 }}>Privacy Policy</a>
                </span>
              </label>

              {/* Show Google button only if username is available and terms agreed */}
              {usernameStatus === "AVAILABLE" && form.agreeTerms ? (
                <div className="flex justify-center mt-6">
                  {loading ? (
                    <Loader2 size={24} className="animate-spin" style={{ color: "#f6a73a" }} />
                  ) : (
                    <GoogleLogin
                      onSuccess={handleAadhaarGoogleSuccess}
                      onError={() => setError("Google Login failed.")}
                      theme="filled_black"
                      shape="rectangular"
                      text="continue_with"
                    />
                  )}
                </div>
              ) : (
                <button className="auth-btn-primary w-full p-4 mt-6" disabled>
                  Complete Setup
                </button>
              )}
            </div>
          </div>
        )}

        <p className="text-center mt-6 text-sm" style={{ color: "#64748b" }}>
          Already have an account? <Link href="/login" className="auth-link">Sign in</Link>
        </p>
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
