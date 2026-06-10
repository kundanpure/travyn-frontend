"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

interface Props {
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  credential: string;
  onClose: () => void;
}

export default function GoogleCompleteProfileModal({
  email,
  firstName: initialFirstName,
  lastName: initialLastName,
  profilePictureUrl,
  credential,
  onClose,
}: Props) {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: initialFirstName || "",
    lastName: initialLastName || "",
    username: "",
    gender: "",
    dateOfBirth: "",
  });

  const [usernameStatus, setUsernameStatus] = useState<"IDLE" | "CHECKING" | "AVAILABLE" | "TAKEN" | "ERROR">("IDLE");

  // Debounced username validation
  useEffect(() => {
    const timer = setTimeout(async () => {
      const username = form.username.trim();
      if (!username) {
        setUsernameStatus("IDLE");
        return;
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/google/register", {
        credential,
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
      });
      const data = res.data;
      setAuth(data.user, data.access_token, data.refresh_token);
      router.push("/dashboard");
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.details?.length) {
        setError(data.details.map((d: any) => d.message).join('. '));
      } else {
        setError(data?.message || data?.error || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl p-6 relative"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-line)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-2 text-white">Complete Your Profile</h2>
        <p className="text-sm text-gray-400 mb-6">
          You're signing up with <b>{email}</b>. Just a few more details to set up your account!
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-400">First Name</label>
              <input
                type="text"
                className="t-input w-full"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-400">Last Name</label>
              <input
                type="text"
                className="t-input w-full"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-400">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <input
                type="text"
                className="t-input w-full pl-8 pr-10"
                placeholder="e.g. travel_buddy99"
                value={form.username}
                onChange={(e) => {
                  const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '');
                  setForm({ ...form, username: sanitized });
                }}
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "CHECKING" && <Loader2 size={16} className="animate-spin text-gray-400" />}
                {usernameStatus === "AVAILABLE" && <CheckCircle size={16} className="text-emerald-400" />}
                {usernameStatus === "TAKEN" && <X size={16} className="text-red-400" />}
                {usernameStatus === "ERROR" && <AlertCircle size={16} className="text-red-400" />}
              </div>
            </div>
            {usernameStatus === "TAKEN" && <p className="text-xs text-red-400 mt-1">This username is already taken.</p>}
            {usernameStatus === "ERROR" && form.username.length > 0 && (
              <p className="text-xs text-red-400 mt-1">Must be 3–30 chars: lowercase letters, numbers, _ or . only.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-400">Gender</label>
              <select
                className="t-input w-full"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                required
              >
                <option value="">Select...</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="NON_BINARY">Non-binary</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-400">Date of Birth</label>
              <input
                type="date"
                className="t-input w-full"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || usernameStatus !== "AVAILABLE"}
            className="t-btn-primary w-full mt-6"
            style={{ padding: "12px", opacity: usernameStatus !== "AVAILABLE" ? 0.5 : 1 }}
          >
            {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
