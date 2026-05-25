"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const passwordStrength = (() => {
    const p = form.password;
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

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 10) {
      setError("Password must be at least 10 characters");
      return;
    }
    if (!form.agreeTerms) {
      setError("You must agree to the Terms of Service");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      const data = res.data;
      setAuth(data.user, data.access_token, data.refresh_token);
      router.push("/verify-email");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Registration failed. Please try again.");
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
          <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "var(--color-txt-white)" }}>Join Travyn</h1>
          <p
            className="text-center mb-6 text-sm"
            style={{ color: "var(--color-txt-secondary)" }}
          >
            Create your account and start exploring with trusted companions
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
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-txt-secondary)" }}>
                  First Name
                </label>
                <input
                  type="text"
                  className="t-input"
                  placeholder="John"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-txt-secondary)" }}>
                  Last Name
                </label>
                <input
                  type="text"
                  className="t-input"
                  placeholder="Doe"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-txt-secondary)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="t-input"
                  style={{ paddingRight: "44px" }}
                  placeholder="Min. 10 characters"
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
              {/* Strength Bar */}
              {form.password && (
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-txt-secondary)" }}>
                Confirm Password
              </label>
              <input
                type="password"
                className="t-input"
                placeholder="Re-enter your password"
                required
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.agreeTerms}
                onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })}
              />
              <span className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>
                I agree to the{" "}
                <a href="#" style={{ color: "var(--color-primary-bright)" }}>Terms of Service</a> and{" "}
                <a href="#" style={{ color: "var(--color-primary-bright)" }}>Privacy Policy</a>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              className="t-btn-primary w-full"
              style={{ padding: "14px" }}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>Create Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: "var(--color-txt-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--color-primary-bright)", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
