"use client";

import { useState } from "react";
import Link from "next/link";
import { Compass, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/password-reset/request", { email });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <span
            className="t-gradient-text"
            style={{ fontSize: "1.4rem", fontFamily: "var(--font-family-display)", fontWeight: 700 }}
          >
            Travyn
          </span>
        </Link>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-line)",
          }}
        >
          {sent ? (
            /* ── Success State ── */
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
                Check Your Email
              </h1>
              <p className="mb-6 text-sm" style={{ color: "var(--color-txt-secondary)" }}>
                If an account exists for <strong style={{ color: "var(--color-txt-white)" }}>{email}</strong>,
                we&apos;ve sent a password reset link. Check your inbox and spam folder.
              </p>
              <div
                className="p-4 rounded-lg mb-6"
                style={{
                  background: "rgba(240, 160, 48, 0.08)",
                  border: "1px solid rgba(240, 160, 48, 0.2)",
                }}
              >
                <p className="text-sm" style={{ color: "var(--color-accent)" }}>
                  💡 The link will expire in 1 hour.
                </p>
              </div>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="t-btn-outline w-full mb-4"
                style={{ padding: "12px" }}
              >
                Try a Different Email
              </button>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm"
                style={{ color: "var(--color-txt-muted)" }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "var(--color-txt-white)" }}>
                Forgot Password?
              </h1>
              <p
                className="text-center mb-6 text-sm"
                style={{ color: "var(--color-txt-secondary)" }}
              >
                No worries — enter your email and we&apos;ll send you a reset link.
              </p>

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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--color-txt-secondary)" }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="t-input"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="t-btn-primary w-full"
                  style={{ padding: "14px" }}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>Send Reset Link <ArrowRight size={18} /></>
                  )}
                </button>
              </form>

              <p className="text-center mt-6 text-sm" style={{ color: "var(--color-txt-muted)" }}>
                Remember your password?{" "}
                <Link href="/login" style={{ color: "var(--color-primary-bright)", fontWeight: 600 }}>
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
