"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, ShieldCheck, ArrowRight, Upload, X, Loader2, AlertCircle, CheckCircle } from "lucide-react";
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
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Registration failed. Please try again.");
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--color-bg-deep)" }}>
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8 relative">
          {mode !== "SELECTION" && (
            <button 
              onClick={() => {
                setMode("SELECTION");
                setError("");
                setAadhaarData(null);
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: "var(--color-txt-secondary)" }}
            >
              <X size={20} />
            </button>
          )}
          <Link href="/" className="inline-flex items-center gap-2">
            <div style={{
              width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))",
            }}>
              <Compass size={18} color="#06080c" />
            </div>
            <span className="t-gradient-text font-bold" style={{ fontSize: "1.4rem", fontFamily: "var(--font-family-display)" }}>Travyn</span>
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2" style={{
            background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.2)", color: "var(--color-danger)"
          }}>
            <X size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ==================== MODE: SELECTION ==================== */}
        {mode === "SELECTION" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h1 className="text-2xl font-bold text-center mb-2" style={{ color: "var(--color-txt-white)" }}>Create your account</h1>
            <p className="text-center mb-8 text-sm" style={{ color: "var(--color-txt-secondary)" }}>
              Choose how you&apos;d like to join the community
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

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: "var(--color-line)" }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2" style={{ background: "var(--color-bg-deep)", color: "var(--color-txt-muted)" }}>
                  Or use another method
                </span>
              </div>
            </div>

            <button 
              onClick={() => setMode("AADHAAR_SCAN")}
              className="w-full text-left p-5 rounded-2xl transition-all hover:bg-white/5 group"
              style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl group-hover:bg-emerald-500/20 transition-colors" style={{ background: "rgba(255,255,255,0.05)", color: "var(--color-txt-white)" }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="font-bold mb-1" style={{ color: "var(--color-txt-white)" }}>Instant Aadhaar Verification</h3>
                  <p className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>
                    Scan your Aadhaar QR to instantly verify your identity and unlock all features.
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ==================== MODE: AADHAAR SCAN ==================== */}
        {mode === "AADHAAR_SCAN" && (
          <div className="rounded-2xl p-8 animate-in fade-in slide-in-from-right-4" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}>
            <h1 className="text-xl font-bold mb-2 text-center" style={{ color: "var(--color-txt-white)" }}>Scan Aadhaar QR</h1>
            <p className="text-center mb-8 text-sm" style={{ color: "var(--color-txt-secondary)" }}>
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
                    className="text-sm text-emerald-400 hover:text-emerald-300 underline"
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
                  <div className="border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all"
                       style={{ borderColor: "var(--color-primary-dim)", background: "rgba(45, 212, 168, 0.05)" }}>
                    {loading ? (
                      <Loader2 size={40} className="animate-spin text-emerald-400 mb-4" />
                    ) : (
                      <Upload size={40} className="text-emerald-400 mb-4 group-hover:-translate-y-1 transition-transform" />
                    )}
                    <span className="font-medium text-emerald-400">
                      {loading ? "Analyzing QR code..." : "Tap to browse files"}
                    </span>
                    <span className="text-xs text-emerald-400/60 mt-2">JPEG, PNG, WEBP (Max 5MB)</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={loading} />
                </label>
                <div className="mt-6 text-center">
                  <button 
                    onClick={() => setScanMethod("CAMERA")}
                    className="text-sm text-emerald-400 hover:text-emerald-300 underline"
                  >
                    Switch to Camera Scan
                  </button>
                  <span className="text-zinc-500 mx-3">|</span>
                  <button 
                    onClick={() => setShowUploadHelp(true)}
                    className="text-sm text-emerald-400 hover:text-emerald-300 underline"
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
          <div className="rounded-2xl p-8 animate-in fade-in slide-in-from-right-4" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
            </div>
            
            <h1 className="text-xl font-bold mb-2 text-center" style={{ color: "var(--color-txt-white)" }}>QR Verified</h1>
            <p className="text-center mb-8 text-sm" style={{ color: "var(--color-txt-secondary)" }}>
              We successfully read your Aadhaar details. Please confirm they are correct.
            </p>

            <div className="space-y-4 mb-8">
              <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: "var(--color-bg-deep)" }}>
                <span className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>Full Name</span>
                <span className="font-bold" style={{ color: "var(--color-txt-white)" }}>{aadhaarData.extractedName}</span>
              </div>
              <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: "var(--color-bg-deep)" }}>
                <span className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>Gender</span>
                <span className="font-bold" style={{ color: "var(--color-txt-white)" }}>{aadhaarData.gender}</span>
              </div>
              <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: "var(--color-bg-deep)" }}>
                <span className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>Date of Birth</span>
                <span className="font-bold" style={{ color: "var(--color-txt-white)" }}>{aadhaarData.dob}</span>
              </div>
              <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: "var(--color-bg-deep)" }}>
                <span className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>Aadhaar Last 4</span>
                <span className="font-bold tracking-widest text-emerald-400">•••• {aadhaarData.aadhaarLast4}</span>
              </div>
            </div>

            <button 
              onClick={() => setMode("AADHAAR_ACCOUNT")}
              className="t-btn-primary w-full p-4 text-base font-bold"
            >
              Confirm & Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ==================== MODE: AADHAAR ACCOUNT SETUP ==================== */}
        {mode === "AADHAAR_ACCOUNT" && aadhaarData && (
          <div className="rounded-2xl p-8 animate-in fade-in slide-in-from-right-4" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}>
            <h1 className="text-xl font-bold mb-2 text-center" style={{ color: "var(--color-txt-white)" }}>Setup Login</h1>
            <p className="text-center mb-6 text-sm" style={{ color: "var(--color-txt-secondary)" }}>
              Hey {aadhaarData.firstName}, just pick a username and link your Google account to secure your profile.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-txt-secondary)" }}>Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input type="text" className="t-input pl-8" placeholder="your_username" required
                    value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase() })} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === "CHECKING" && <Loader2 size={16} className="animate-spin text-gray-400" />}
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
                <span className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>
                  I agree to the <a href="#" className="text-emerald-400">Terms of Service</a> and <a href="#" className="text-emerald-400">Privacy Policy</a>
                </span>
              </label>

              {/* Show Google button only if username is available and terms agreed */}
              {usernameStatus === "AVAILABLE" && form.agreeTerms ? (
                <div className="flex justify-center mt-6">
                  {loading ? (
                    <Loader2 size={24} className="animate-spin text-emerald-500" />
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
                <button className="t-btn-primary w-full p-4 mt-6 opacity-50 cursor-not-allowed" disabled>
                  Complete Setup
                </button>
              )}
            </div>
          </div>
        )}

        <p className="text-center mt-6 text-sm" style={{ color: "var(--color-txt-muted)" }}>
          Already have an account? <Link href="/login" style={{ color: "var(--color-primary-bright)", fontWeight: 600 }}>Sign in</Link>
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
