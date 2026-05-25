"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Eye, EyeOff, ArrowRight, Loader2, Mail } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailNotVerified(false);
    setResendSuccess(false);
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);
      const data = res.data;
      setAuth(data.user, data.access_token, data.refresh_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
      const msg = axiosErr.response?.data?.message || "";
      const status = axiosErr.response?.status;

      // Detect "email not verified" error
      if (status === 403 && msg.toLowerCase().includes("verify")) {
        setEmailNotVerified(true);
        setError(msg);
      } else {
        setError(msg || "Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setResendSuccess(false);
    try {
      await api.post("/auth/resend-verification", { email: form.email });
      setResendSuccess(true);
    } catch {
      setError("Failed to resend verification email. Please try again.");
    } finally {
      setResending(false);
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
          {error && !emailNotVerified && (
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

          {/* Email Not Verified Banner */}
          {emailNotVerified && (
            <div
              className="mb-4 p-4 rounded-lg"
              style={{
                background: "rgba(240, 160, 48, 0.08)",
                border: "1px solid rgba(240, 160, 48, 0.2)",
              }}
            >
              <div className="flex items-start gap-3">
                <Mail size={20} style={{ color: "var(--color-accent)", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--color-accent)" }}>
                    Email not verified
                  </p>
                  <p className="text-xs mb-3" style={{ color: "var(--color-txt-secondary)" }}>
                    Please check your inbox for the verification link. Can&apos;t find it?
                  </p>

                  {resendSuccess ? (
                    <p className="text-xs font-medium" style={{ color: "var(--color-primary-bright)" }}>
                      ✓ Verification email sent! Check your inbox.
                    </p>
                  ) : (
                    <button
                      onClick={handleResendVerification}
                      disabled={resending}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: "rgba(240, 160, 48, 0.15)",
                        color: "var(--color-accent)",
                        border: "1px solid rgba(240, 160, 48, 0.25)",
                        cursor: resending ? "wait" : "pointer",
                      }}
                    >
                      {resending ? "Sending…" : "Resend Verification Email"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-txt-secondary)" }}>
                Email
              </label>
              <input
                type="email"
                className="t-input"
                placeholder="you@example.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--color-txt-secondary)" }}>
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs"
                  style={{ color: "var(--color-primary-bright)" }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="t-input"
                  style={{ paddingRight: "44px" }}
                  placeholder="Enter your password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--color-txt-muted)", background: "none", border: "none", cursor: "pointer" }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: "var(--color-txt-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ color: "var(--color-primary-bright)", fontWeight: 600 }}>
              Join Travyn
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
