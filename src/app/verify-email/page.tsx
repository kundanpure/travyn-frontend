"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Compass, Mail, CheckCircle2, XCircle, ArrowRight, Loader2 } from "lucide-react";
import api from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    token ? "verifying" : "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        await api.get(`/auth/verify-email?token=${token}`);
        setStatus("success");
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setErrorMsg(axiosErr.response?.data?.message || "Verification failed. The link may have expired.");
        setStatus("error");
      }
    };

    verify();
  }, [token]);

  /* ── Verifying ── */
  if (status === "verifying") {
    return (
      <div className="text-center">
        <Loader2 size={40} className="animate-spin mx-auto mb-6" style={{ color: "var(--color-primary)" }} />
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-txt-white)" }}>
          Verifying Your Email…
        </h1>
        <p className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>
          Please wait while we confirm your email address.
        </p>
      </div>
    );
  }

  /* ── Success ── */
  if (status === "success") {
    return (
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: "rgba(45, 212, 168, 0.1)",
            border: "1px solid rgba(45, 212, 168, 0.25)",
          }}
        >
          <CheckCircle2 size={28} style={{ color: "var(--color-primary-bright)" }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-txt-white)" }}>
          Email Verified!
        </h1>
        <p className="mb-6 text-sm" style={{ color: "var(--color-txt-secondary)" }}>
          Your email has been successfully verified. You can now sign in and access all features.
        </p>
        <Link href="/login" className="t-btn-primary w-full" style={{ padding: "14px" }}>
          Go to Sign In <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  /* ── Error ── */
  if (status === "error") {
    return (
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: "rgba(248, 113, 113, 0.1)",
            border: "1px solid rgba(248, 113, 113, 0.25)",
          }}
        >
          <XCircle size={28} style={{ color: "var(--color-danger)" }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-txt-white)" }}>
          Verification Failed
        </h1>
        <p className="mb-6 text-sm" style={{ color: "var(--color-txt-secondary)" }}>
          {errorMsg}
        </p>
        <Link href="/register" className="t-btn-primary w-full" style={{ padding: "14px" }}>
          Create New Account <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  /* ── Idle (no token — just registered, check inbox) ── */
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  const handleResend = async () => {
    if (!resendEmail) return;
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email: resendEmail });
      setResendDone(true);
    } catch { /* silently handle */ }
    setResending(false);
  };

  return (
    <div className="text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{
          background: "rgba(45, 212, 168, 0.1)",
          border: "1px solid rgba(45, 212, 168, 0.25)",
        }}
      >
        <Mail size={28} style={{ color: "var(--color-primary-bright)" }} />
      </div>

      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-txt-white)" }}>
        Check Your Email
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--color-txt-secondary)" }}>
        We&apos;ve sent a verification link to your email address. Click the link to verify your account
        and unlock all features.
      </p>

      <div
        className="p-4 rounded-lg mb-6"
        style={{
          background: "rgba(240, 160, 48, 0.08)",
          border: "1px solid rgba(240, 160, 48, 0.2)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--color-accent)" }}>
          💡 Can&apos;t find the email? Check your spam folder.
        </p>
      </div>

      {/* Resend section */}
      <div
        className="p-4 rounded-lg mb-6 text-left"
        style={{
          background: "var(--color-bg-deep)",
          border: "1px solid var(--color-line)",
        }}
      >
        <p className="text-xs font-medium mb-2" style={{ color: "var(--color-txt-secondary)" }}>
          Didn&apos;t receive the email? Resend it:
        </p>
        {resendDone ? (
          <p className="text-sm font-medium" style={{ color: "var(--color-primary-bright)" }}>
            ✓ Verification email sent! Check your inbox.
          </p>
        ) : (
          <div className="flex gap-2">
            <input
              type="email"
              className="t-input flex-1"
              placeholder="Your email address"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              style={{ fontSize: "13px", padding: "10px 12px" }}
            />
            <button
              onClick={handleResend}
              disabled={resending || !resendEmail}
              className="t-btn-primary shrink-0"
              style={{ padding: "10px 16px", fontSize: "13px" }}
            >
              {resending ? <Loader2 size={16} className="animate-spin" /> : "Resend"}
            </button>
          </div>
        )}
      </div>

      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm"
        style={{ color: "var(--color-txt-muted)" }}
      >
        Continue to Sign In <ArrowRight size={14} />
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "var(--color-bg-deep)" }}
    >
      <div className="w-full max-w-md">
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
          <span
            className="t-gradient-text"
            style={{ fontSize: "1.4rem", fontFamily: "var(--font-family-display)", fontWeight: 700 }}
          >
            Travyn
          </span>
        </Link>

        <div
          className="rounded-2xl p-8"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-line)",
          }}
        >
          <Suspense
            fallback={
              <div className="text-center py-8">
                <Loader2 size={24} className="animate-spin mx-auto" style={{ color: "var(--color-primary)" }} />
              </div>
            }
          >
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
