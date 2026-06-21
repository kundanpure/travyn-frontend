"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { Upload, ShieldCheck, AlertTriangle, Loader2, ShieldAlert, ArrowLeft, Camera } from "lucide-react";
import Link from "next/link";
import { QrScanner, QrHelpGuide } from "@/components/ui/QrScanner";

export default function KycVerificationPage() {
  const { user, fetchUser } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadHelp, setShowUploadHelp] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState<string | null>(null);
  const [scanMethod, setScanMethod] = useState<"CAMERA" | "FILE">("CAMERA");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.kycLockoutUntil) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const lockout = new Date(user.kycLockoutUntil!).getTime();
        const diff = lockout - now;

        if (diff <= 0) {
          setLockoutTimeLeft(null);
          // Refresh user to clear lockout state if expired
          fetchUser();
        } else {
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setLockoutTimeLeft(`${hours}h ${minutes}m`);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);
      
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      await api.post("/kyc/aadhaar/qr", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
      await fetchUser(); // Refresh user state to show verified
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const errMsg = axiosErr.response?.data?.error || "Verification failed. Please ensure the QR code is clear and valid.";
      setError(errMsg);
      await fetchUser(); // Refresh user state to catch potential lockout updates
    } finally {
      setLoading(false);
    }
  };

  const handleQrScanSuccess = async (decodedText: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/kyc/aadhaar/qr/raw", { qrData: decodedText });
      setSuccess(true);
      await fetchUser(); // Refresh user state to show verified
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const errMsg = axiosErr.response?.data?.error || "Verification failed. Please ensure the QR code is clear and valid.";
      setError(errMsg);
      setScanMethod("FILE"); // switch to file to show error explicitly, or they can try again
      await fetchUser(); // Refresh user state to catch potential lockout updates
    } finally {
      setLoading(false);
    }
  };

  if (user?.status === "KYC_VERIFIED" || success) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="t-card text-center p-10" style={{ background: "var(--color-bg-deep)" }}>
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Identity Verified</h2>
          <p style={{ color: "var(--text-muted)" }} className="mb-6">
            Your identity has been successfully verified via Aadhaar Secure QR. Your TrustScore has increased!
          </p>
          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-4 inline-block text-left">
            <p className="text-sm text-emerald-200"><strong>Note:</strong> In compliance with the Aadhaar Act, your uploaded image was processed in-memory and immediately discarded. It was never saved to our servers.</p>
          </div>
        </div>
      </div>
    );
  }

  if (user?.kycLockoutUntil && lockoutTimeLeft) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
         <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="t-card text-center p-10" style={{ background: "var(--color-bg-deep)" }}>
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Verification Locked</h2>
          <p style={{ color: "var(--text-muted)" }} className="mb-6">
            You have exceeded the maximum number of failed verification attempts. For security reasons, identity verification is temporarily locked.
          </p>
          <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-6 inline-block">
            <p className="text-sm text-red-200 mb-2">Please try again in:</p>
            <p className="text-3xl font-mono font-bold text-red-400">{lockoutTimeLeft}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mb-4 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Identity Verification</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Upload the back of your Aadhaar card to scan the Secure QR Code.</p>
      </div>

      <div className="bg-blue-950/20 border border-blue-900/30 rounded-2xl p-5 flex items-start gap-4">
        <ShieldCheck size={24} className="text-blue-400 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>Zero-Retention Policy</h4>
          <p className="text-xs text-blue-200/70">
            Your privacy is our priority. Your image is processed entirely in-memory to extract the cryptographic signature and demographic data. It is never saved to our disks or databases.
          </p>
        </div>
      </div>

      <div className="t-card" style={{ background: "var(--color-bg-deep)", padding: "32px" }}>
        
        {scanMethod === "CAMERA" ? (
          <div className="space-y-6">
            <QrScanner 
              onScanSuccess={handleQrScanSuccess} 
              onScanFailure={() => {}} 
            />
            {error && (
              <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-200">{error}</p>
                  <p className="text-xs text-red-300/70 mt-1">
                    Failed attempts: {user?.kycFailedAttempts || 0}/3
                  </p>
                </div>
              </div>
            )}
            <div className="text-center">
              <button 
                onClick={() => setScanMethod("FILE")}
                className="text-sm text-blue-400 hover:text-blue-300 underline"
              >
                Or upload an image instead
              </button>
            </div>
          </div>
        ) : !preview ? (
          <div className="relative">
            {showUploadHelp && (
              <div className="absolute inset-0 z-30">
                <QrHelpGuide onClose={() => setShowUploadHelp(false)} />
              </div>
            )}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors group"
              style={{ borderColor: "var(--border)" }}
            >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors" style={{ background: "var(--bg-tertiary)" }}>
              <Upload size={28} style={{ color: "var(--text-muted)" }} />
            </div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Upload Aadhaar QR</h3>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Click or drag an image of the back of your Aadhaar card</p>
            <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>Make sure the QR code is clearly visible and well-lit.</p>
            <div className="mt-6 text-center">
              <button 
                onClick={(e) => { e.stopPropagation(); setScanMethod("CAMERA"); }}
                className="text-sm text-blue-400 hover:text-blue-300 underline"
              >
                Switch to Camera Scan
              </button>
              <span className="text-zinc-500 mx-3">|</span>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowUploadHelp(true); }}
                className="text-sm text-blue-400 hover:text-blue-300 underline"
              >
                View Scanning Tips
              </button>
            </div>
          </div>
        </div>
        ) : (
          <div className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden h-64 flex items-center justify-center" style={{ border: "1px solid var(--border)", background: "var(--bg-tertiary)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="QR Preview" className="max-h-full max-w-full object-contain" />
              {loading && (
                <div className="absolute inset-0 backdrop-blur-sm flex flex-col items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                  <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
                  <p className="text-sm font-medium animate-pulse" style={{ color: "white" }}>Verifying Cryptographic Signature...</p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-200">{error}</p>
                  <p className="text-xs text-red-300/70 mt-1">
                    Failed attempts: {user?.kycFailedAttempts || 0}/3
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setError(null);
                  setScanMethod("CAMERA");
                }}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
                style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "var(--bg-tertiary)", cursor: "pointer" }}
              >
                Try Another Image
              </button>
              <button 
                onClick={handleUpload}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl font-medium text-sm bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                Verify Now
              </button>
            </div>
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>
    </div>
  );
}
