"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Compass, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });

  const passwordStrength = (() => {
    const p = form.newPassword;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthColors = ["#f87171", "#f0a030", "#f0a030", "#2dd4a8", "#2dd4a8"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.newPassword.length < 10) {
      setError("Password must be at least 10 characters");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/password-reset/confirm", {
        token,
        newPassword: form.newPassword,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--color-txt-white)" }}>
          Invalid Link
        </h1>
        <p className="mb-6 text-sm" style={{ color: "var(--color-txt-secondary)" }}>
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link href="/forgot-password" className="t-btn-primary" style={{ padding: "12px 28px" }}>
          Request New Link <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  if (success) {
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
          Password Reset!
        </h1>
        <p className="mb-6 text-sm" style={{ color: "var(--color-txt-secondary)" }}>
          Your password has been successfully changed. You can now sign in with your new password.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="t-btn-primary w-full"
          style={{ padding: "14px" }}
        >
          Go to Sign In <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "var(--color-txt-white)" }}>
        Set New Password
      </h1>
      <p
        className="text-center mb-6 text-sm"
        style={{ color: "var(--color-txt-secondary)" }}
      >
        Choose a strong password for your account.
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
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-txt-secondary)" }}>
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="t-input"
              style={{ paddingRight: "44px" }}
              placeholder="Min. 10 characters"
              required
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
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
          {form.newPassword && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{
                      background:
                        i <= passwordStrength
                          ? strengthColors[passwordStrength]
                          : "var(--color-line)",
                    }}
                  />
                ))}
              </div>
              <span className="text-xs" style={{ color: strengthColors[passwordStrength] }}>
                {strengthLabels[passwordStrength]}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-txt-secondary)" }}>
            Confirm New Password
          </label>
          <input
            type="password"
            className="t-input"
            placeholder="Re-enter your new password"
            required
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
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
            <>Reset Password <ArrowRight size={18} /></>
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
          <Suspense
            fallback={
              <div className="text-center py-8">
                <Loader2 size={24} className="animate-spin mx-auto" style={{ color: "var(--color-primary)" }} />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
