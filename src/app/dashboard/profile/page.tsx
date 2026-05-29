"use client";

import { useState, useEffect } from "react";
import VerifiedBadge from "../components/VerifiedBadge";
import {
  User, Edit3, Save, X, Mountain, Landmark, Palette, PartyPopper, Wallet,
  Sun, Moon, Clock, Loader2, CheckCircle2, CheckCircle, AlertCircle, Laptop, Globe, UtensilsCrossed,
  ChevronRight, Camera, Check, Plus, Shield, AlertTriangle
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import ImageUploadModal from "../components/ImageUploadModal";
import { BUCKETS } from "@/lib/supabase";

type Gender = "MALE" | "FEMALE" | "NON_BINARY" | "PREFER_NOT_TO_SAY";

const genderOptions: { value: Gender; label: string; emoji: string }[] = [
  { value: "MALE", label: "Male", emoji: "♂️" },
  { value: "FEMALE", label: "Female", emoji: "♀️" },
  { value: "NON_BINARY", label: "Non-binary", emoji: "⚧️" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say", emoji: "🔒" },
];

const travelStyles = [
  { value: "ADVENTURE", label: "Adventure", icon: Mountain, color: "#2dd4a8" },
  { value: "CULTURAL", label: "Cultural", icon: Landmark, color: "#f0a030" },
  { value: "RELAXATION", label: "Relaxation", icon: Sun, color: "#60a5fa" },
  { value: "PARTY", label: "Party", icon: PartyPopper, color: "#f472b6" },
  { value: "BUDGET", label: "Budget", icon: Wallet, color: "#a78bfa" },
  { value: "LUXURY", label: "Luxury", icon: Palette, color: "#fbbf24" },
];

const foodOptions = [
  { value: "VEG", label: "Vegetarian" },
  { value: "NON_VEG", label: "Non-Vegetarian" },
  { value: "VEGAN", label: "Vegan" },
  { value: "HALAL", label: "Halal" },
  { value: "KOSHER", label: "Kosher" },
  { value: "NO_PREFERENCE", label: "No Preference" },
];

const sleepOptions = [
  { value: "EARLY_BIRD", label: "Early Bird", icon: Sun, desc: "Up with the sunrise" },
  { value: "NIGHT_OWL", label: "Night Owl", icon: Moon, desc: "Late nights, late mornings" },
  { value: "FLEXIBLE", label: "Flexible", icon: Clock, desc: "I adapt to the group" },
];

const languageOptions = [
  "English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil", "Urdu", "Gujarati",
  "Kannada", "Malayalam", "Punjabi", "Spanish", "French", "German", "Japanese",
  "Korean", "Mandarin", "Arabic", "Portuguese", "Russian", "Italian", "Thai",
];

interface ProfileData {
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
  travelStyles: string[];
  budgetMin: number;
  budgetMax: number;
  sleepSchedule: string;
  personalityScale: number;
  foodPreference: string;
  languages: string;
  remoteWorker: boolean;
  profilePhotoUrl: string;
  coverPhotoUrl: string;
  profileCompleteness: number;
}

const emptyProfile: ProfileData = {
  username: "", firstName: "", lastName: "", bio: "", travelStyles: [], budgetMin: 0, budgetMax: 0,
  sleepSchedule: "", personalityScale: 5, foodPreference: "",
  languages: "", remoteWorker: false, profilePhotoUrl: "",
  coverPhotoUrl: "", profileCompleteness: 0,
};

export default function ProfilePage() {
  const { user, setAuth } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [form, setForm] = useState<ProfileData>(emptyProfile);
  const [selectedGender, setSelectedGender] = useState<Gender | "">(user?.gender || "");
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [showCoverUpload, setShowCoverUpload] = useState(false);
  const [coverHover, setCoverHover] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [genderChangesRemaining, setGenderChangesRemaining] = useState<number>(user?.genderChangesRemaining ?? 2);
  const [usernameStatus, setUsernameStatus] = useState<"IDLE" | "CHECKING" | "AVAILABLE" | "TAKEN" | "ERROR">("IDLE");

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (editing) {
      const username = form.username?.trim().toLowerCase();
      if (!username || username === user?.username) {
        setUsernameStatus("IDLE");
        return;
      }
      
      if (username.length < 3 || username.length > 30 || !/^[a-z0-9_.]+$/.test(username)) {
        setUsernameStatus("ERROR");
        return;
      }

      setUsernameStatus("CHECKING");
      const timer = setTimeout(async () => {
        try {
          const res = await api.get(`/auth/check-username?username=${username}`);
          setUsernameStatus(res.data.available ? "AVAILABLE" : "TAKEN");
        } catch (err) {
          setUsernameStatus("ERROR");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [form.username, editing, user?.username]);

  useEffect(() => {
    if (user) {
      setSelectedGender(user.gender || "");
      setGenderChangesRemaining(user.genderChangesRemaining ?? 2);
    }
  }, [user]);

  const sanitize = (data: Partial<ProfileData>): ProfileData => ({
    username: data.username ?? "",
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    bio: data.bio ?? "",
    travelStyles: Array.isArray(data.travelStyles) ? data.travelStyles : [],
    budgetMin: data.budgetMin ?? 0,
    budgetMax: data.budgetMax ?? 0,
    sleepSchedule: data.sleepSchedule ?? "",
    personalityScale: data.personalityScale ?? 5,
    foodPreference: data.foodPreference ?? "",
    languages: data.languages ?? "",
    remoteWorker: data.remoteWorker ?? false,
    profilePhotoUrl: data.profilePhotoUrl ?? "",
    coverPhotoUrl: data.coverPhotoUrl ?? "",
    profileCompleteness: data.profileCompleteness ?? 0,
  });

  const fetchProfile = async () => {
    try {
      const res = await api.get("/users/me/profile");
      const safe = sanitize(res.data);
      setProfile(safe);
      setForm(safe);
    } catch {
      // Profile doesn't exist yet — keep empty
    } finally {
      setLoading(false);
    }
  };

  const profileBudgetError = form.budgetMin > 0 && form.budgetMax > 0 && form.budgetMin > form.budgetMax;

  const buildPayload = (overrides?: Partial<ProfileData>): Record<string, unknown> => {
    const data = { ...form, ...overrides };
    const payload: Record<string, unknown> = { ...data };

    // Strip empty strings for enums to prevent backend Jackson parsing errors
    if (payload.sleepSchedule === "") delete payload.sleepSchedule;
    if (payload.foodPreference === "") delete payload.foodPreference;

    // Only include gender in payload if it explicitly changed
    const currentGenderOnServer = user?.gender || "";
    if (selectedGender && selectedGender !== currentGenderOnServer) {
      payload.gender = selectedGender;
    } else {
      delete payload.gender;
    }

    return payload;
  };

  const handleSave = async () => {
    if (usernameStatus === "TAKEN" || usernameStatus === "ERROR") {
      alert("Please resolve the username error before saving.");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();

      const res = await api.put("/users/me/profile", payload);
      const safe = sanitize(res.data);
      setProfile(safe);
      setForm(safe);

      // Update gender changes remaining from response if gender changed
      if (payload.gender && res.data.genderChangesRemaining !== undefined) {
        setGenderChangesRemaining(res.data.genderChangesRemaining);
      }

      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || "Failed to save profile.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (url: string) => {
    setShowAvatarUpload(false);
    setUploadingPhoto(true);
    try {
      const payload = buildPayload({ profilePhotoUrl: url });
      const res = await api.put("/users/me/profile", payload);
      const safe = sanitize(res.data);
      setProfile(safe);
      setForm(safe);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to update profile photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle cover upload
  const handleCoverUpload = async (url: string) => {
    setShowCoverUpload(false);
    setUploadingPhoto(true);
    try {
      const payload = buildPayload({ coverPhotoUrl: url });
      const res = await api.put("/users/me/profile", payload);
      const safe = sanitize(res.data);
      setProfile(safe);
      setForm(safe);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to update cover photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Travel style multi-select toggle
  const toggleTravelStyle = (value: string) => {
    const current = form.travelStyles || [];
    if (current.includes(value)) {
      setForm({ ...form, travelStyles: current.filter(s => s !== value) });
    } else {
      setForm({ ...form, travelStyles: [...current, value] });
    }
  };

  // Language helpers
  const selectedLanguages = form.languages ? form.languages.split(",").map(l => l.trim()).filter(Boolean) : [];
  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      setForm({ ...form, languages: selectedLanguages.filter(l => l !== lang).join(", ") });
    } else {
      setForm({ ...form, languages: [...selectedLanguages, lang].join(", ") });
    }
  };

  const currentGenderLabel = genderOptions.find(g => g.value === (selectedGender || user?.gender))?.label || "Not set";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Toast */}
      {saved && (
        <div
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl"
          style={{
            background: "var(--color-bg-elevated)",
            border: "1px solid rgba(45, 212, 168, 0.3)",
            color: "var(--color-primary-bright)",
          }}
        >
          <CheckCircle2 size={18} /> Profile saved successfully
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-txt-white)" }}>
            My Profile
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-txt-secondary)" }}>
            Complete your travel profile to get matched with compatible companions
          </p>
        </div>
        <button
          onClick={() => { if (editing) { setForm(profile); } setEditing(!editing); }}
          className="t-btn-outline flex items-center gap-2"
          style={{ padding: "10px 20px" }}
        >
          {editing ? <><X size={16} /> Cancel</> : <><Edit3 size={16} /> Edit Profile</>}
        </button>
      </div>

      {/* Completeness Bar */}
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: "var(--color-txt-secondary)" }}>
            Profile Completeness
          </span>
          <span className="text-sm font-bold" style={{ color: "var(--color-primary-bright)" }}>
            {profile.profileCompleteness || 0}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ background: "var(--color-bg-deep)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${profile.profileCompleteness || 0}%`,
              background: "linear-gradient(90deg, var(--color-primary), var(--color-primary-bright))",
            }}
          />
        </div>
      </div>

      {/* Profile Card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
      >
        {/* Cover + Avatar */}
        <div
          className="h-40 relative cursor-pointer group"
          style={{
            backgroundImage: profile.coverPhotoUrl
              ? `url(${profile.coverPhotoUrl})`
              : "linear-gradient(135deg, rgba(45,212,168,0.3), rgba(240,160,48,0.2))",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
          onMouseEnter={() => setCoverHover(true)}
          onMouseLeave={() => setCoverHover(false)}
          onClick={() => setShowCoverUpload(true)}
        >
          {/* Cover hover overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
            style={{
              background: "rgba(0, 0, 0, 0.5)",
              opacity: coverHover ? 1 : 0,
            }}
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}>
              <Camera size={16} style={{ color: "#fff" }} />
              <span className="text-xs font-semibold" style={{ color: "#fff" }}>
                {profile.coverPhotoUrl ? "Change Cover" : "Add Cover Photo"}
              </span>
            </div>
          </div>

          {/* Avatar */}
          <div
            className="absolute -bottom-12 left-6 w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xl cursor-pointer overflow-hidden"
            style={{
              backgroundImage: profile.profilePhotoUrl
                ? `url(${profile.profilePhotoUrl})`
                : "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              backgroundSize: "cover",
              backgroundPosition: "center",
              color: "#06080c",
              border: "3px solid var(--color-bg-surface)",
            }}
            onMouseEnter={(e) => { e.stopPropagation(); setAvatarHover(true); }}
            onMouseLeave={(e) => { e.stopPropagation(); setAvatarHover(false); }}
            onClick={(e) => { e.stopPropagation(); setShowAvatarUpload(true); }}
          >
            {/* Show initials only if no photo */}
            {!profile.profilePhotoUrl && (
              <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
            )}

            {/* Avatar hover overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center rounded-2xl transition-opacity duration-200"
              style={{
                background: "rgba(0, 0, 0, 0.55)",
                opacity: avatarHover ? 1 : 0,
              }}
            >
              <Camera size={20} style={{ color: "#fff" }} />
            </div>

            {/* Uploading spinner */}
            {uploadingPhoto && (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-2xl"
                style={{ background: "rgba(0, 0, 0, 0.6)" }}
              >
                <Loader2 size={20} className="animate-spin" style={{ color: "var(--color-primary-bright)" }} />
              </div>
            )}
          </div>
        </div>

        <div className="pt-16 px-6 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--color-txt-white)" }}>
              {profile.firstName || user?.firstName} {profile.lastName || user?.lastName}
              {user?.status === "KYC_VERIFIED" && <VerifiedBadge size={18} />}
            </h2>
            {user?.age && (
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-800 text-gray-300">
                {user.age} yrs
              </span>
            )}
            {user?.dob && (
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-800/50 text-gray-400 border border-gray-700/50">
                DOB: {user.dob}
              </span>
            )}
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--color-primary-bright)" }}>
            @{profile.username || user?.username}
          </p>
          <p className="text-sm" style={{ color: "var(--color-txt-muted)" }}>{user?.email}</p>

          {/* Gender badge */}
          <div className="mt-2 flex items-center gap-2">
            <Shield size={14} style={{ color: "var(--color-txt-muted)" }} />
            <span className="text-xs" style={{ color: "var(--color-txt-muted)" }}>
              Gender: <span style={{ color: "var(--color-txt-secondary)" }}>{currentGenderLabel}</span>
              {genderChangesRemaining > 0 ? (
                <span className="ml-2" style={{ color: "var(--color-txt-dim)" }}>
                  ({genderChangesRemaining} change{genderChangesRemaining !== 1 ? "s" : ""} remaining)
                </span>
              ) : (
                <span className="ml-2" style={{ color: "#f87171" }}>(No changes remaining)</span>
              )}
            </span>
          </div>

          {!editing && profile.bio && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-txt-secondary)" }}>
              {profile.bio}
            </p>
          )}

          {/* View Mode Badges */}
          {!editing && (
            <div className="mt-4 flex flex-wrap gap-2">
              {(profile.travelStyles || []).map(style => (
                <Badge key={style} label={style.replace(/_/g, " ")} color="var(--color-primary)" />
              ))}
              {profile.sleepSchedule && (
                <Badge label={profile.sleepSchedule.replace(/_/g, " ")} color="var(--color-accent)" />
              )}
              {profile.foodPreference && profile.foodPreference !== "NO_PREFERENCE" && (
                <Badge label={profile.foodPreference.replace(/_/g, " ")} color="#f472b6" />
              )}
              {profile.remoteWorker && <Badge label="Remote Worker" color="#60a5fa" />}
              {profile.languages && profile.languages.split(",").map((l, i) => (
                <Badge key={i} label={l.trim()} color="#a78bfa" />
              ))}
            </div>
          )}

          {/* View Mode Stats */}
          {!editing && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {profile.budgetMin > 0 && (
                <StatCard icon={Wallet} label="Budget" value={`₹${profile.budgetMin} – ₹${profile.budgetMax}/day`} />
              )}
              {profile.personalityScale > 0 && (
                <StatCard
                  icon={User}
                  label="Personality"
                  value={profile.personalityScale <= 3 ? "Introvert" : profile.personalityScale >= 8 ? "Extrovert" : "Ambivert"}
                />
              )}
              {(profile.travelStyles || []).length > 0 && (
                <StatCard icon={Mountain} label="Styles" value={(profile.travelStyles || []).map(s => s.replace(/_/g, " ")).join(", ")} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="space-y-6">
          {/* Personal Info */}
          <FormSection title="Personal Info" icon={User}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--color-txt-secondary)" }}>First Name</label>
                {user?.status === "KYC_VERIFIED" ? (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-dashed" style={{ borderColor: "var(--color-line)", background: "rgba(255,255,255,0.02)" }}>
                    <span className="font-medium text-sm" style={{ color: "var(--color-txt-white)" }}>{user.firstName}</span>
                    <span title="Name locked by Aadhaar KYC">
                      <Shield size={16} className="text-emerald-400" />
                    </span>
                  </div>
                ) : (
                  <input 
                    type="text" className="t-input w-full" value={form.firstName} 
                    onChange={e => setForm({...form, firstName: e.target.value})} 
                  />
                )}
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--color-txt-secondary)" }}>Last Name</label>
                {user?.status === "KYC_VERIFIED" ? (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-dashed" style={{ borderColor: "var(--color-line)", background: "rgba(255,255,255,0.02)" }}>
                    <span className="font-medium text-sm" style={{ color: "var(--color-txt-white)" }}>{user.lastName}</span>
                    <span title="Name locked by Aadhaar KYC">
                      <Shield size={16} className="text-emerald-400" />
                    </span>
                  </div>
                ) : (
                  <input 
                    type="text" className="t-input w-full" value={form.lastName} 
                    onChange={e => setForm({...form, lastName: e.target.value})} 
                  />
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs mb-1" style={{ color: "var(--color-txt-secondary)" }}>Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                <input 
                  type="text" className="t-input w-full pl-8" value={form.username || ""} 
                  onChange={e => setForm({...form, username: e.target.value})} 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === "CHECKING" && <Loader2 size={16} className="animate-spin text-gray-400" />}
                  {usernameStatus === "AVAILABLE" && <CheckCircle size={16} className="text-emerald-400" />}
                  {usernameStatus === "TAKEN" && <X size={16} className="text-red-400" />}
                  {usernameStatus === "ERROR" && <AlertCircle size={16} className="text-red-400" />}
                </div>
              </div>
              {usernameStatus === "TAKEN" && <p className="text-xs text-red-400 mt-1">This username is already taken.</p>}
              {usernameStatus === "ERROR" && form.username?.length > 0 && form.username !== user?.username && <p className="text-xs text-red-400 mt-1">Must be 3-30 chars, lowercase, numbers, _, .</p>}
            </div>
          </FormSection>

          {/* Bio */}
          <FormSection title="About You" icon={User}>
            <div className="relative">
              <textarea
                className="t-input w-full"
                style={{ minHeight: 100, resize: "vertical" }}
                placeholder="Tell other travelers about yourself..."
                maxLength={500}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
              <span className="absolute bottom-2 right-3 text-xs" style={{ color: "var(--color-txt-muted)" }}>
                {form.bio?.length || 0}/500
              </span>
            </div>
          </FormSection>

          {/* Gender Change */}
          <FormSection title="Gender" icon={Shield}>
            {genderChangesRemaining === 0 ? (
              <div
                className="flex items-center gap-2 p-3 rounded-lg text-sm"
                style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171" }}
              >
                <AlertTriangle size={16} />
                You have used all {2} gender changes. This cannot be changed further.
              </div>
            ) : (
              <>
                <div
                  className="flex items-center gap-2 mb-3 p-2.5 rounded-lg text-xs"
                  style={{ background: "rgba(240,160,48,0.08)", border: "1px solid rgba(240,160,48,0.2)", color: "#f0a030" }}
                >
                  <AlertTriangle size={14} />
                  You have <strong className="mx-1">{genderChangesRemaining}</strong> gender change{genderChangesRemaining !== 1 ? "s" : ""} remaining. Choose carefully.
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {genderOptions.map(({ value, label, emoji }) => {
                    const isSelected = selectedGender === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedGender(value)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: isSelected ? "rgba(45,212,168,0.12)" : "var(--color-bg-deep)",
                          border: `2px solid ${isSelected ? "var(--color-primary)" : "var(--color-line)"}`,
                          color: isSelected ? "var(--color-primary-bright)" : "var(--color-txt-secondary)",
                          cursor: "pointer",
                        }}
                      >
                        <span>{emoji}</span>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </FormSection>

          {/* Travel Style — multi-select */}
          <FormSection title="Travel Style (select all that apply)" icon={Mountain}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {travelStyles.map(({ value, label, icon: Icon, color }) => {
                const isSelected = (form.travelStyles || []).includes(value);
                return (
                  <button
                    key={value}
                    onClick={() => toggleTravelStyle(value)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all relative"
                    style={{
                      background: isSelected ? `${color}15` : "var(--color-bg-deep)",
                      border: `2px solid ${isSelected ? color : "var(--color-line)"}`,
                      cursor: "pointer",
                    }}
                  >
                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: color }}
                      >
                        <Check size={12} color="#fff" />
                      </div>
                    )}
                    <Icon size={24} style={{ color: isSelected ? color : "var(--color-txt-muted)" }} />
                    <span className="text-xs font-medium" style={{ color: isSelected ? color : "var(--color-txt-secondary)" }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
            {(form.travelStyles || []).length > 0 && (
              <div className="mt-2 text-xs" style={{ color: "var(--color-txt-muted)" }}>
                Selected: {(form.travelStyles || []).join(", ")}
              </div>
            )}
          </FormSection>

          {/* Budget */}
          <FormSection title="Daily Budget (₹)" icon={Wallet}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--color-txt-muted)" }}>Minimum</label>
                <input
                  type="number"
                  className="t-input w-full"
                  placeholder="500"
                  value={form.budgetMin || ""}
                  onChange={(e) => setForm({ ...form, budgetMin: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--color-txt-muted)" }}>Maximum</label>
                <input
                  type="number"
                  className="t-input w-full"
                  placeholder="5000"
                  value={form.budgetMax || ""}
                  onChange={(e) => setForm({ ...form, budgetMax: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            {profileBudgetError && (
              <span className="text-xs mt-1 block" style={{ color: "#f87171" }}>
                ⚠ Minimum budget must be less than maximum budget
              </span>
            )}
          </FormSection>

          {/* Sleep Schedule */}
          <FormSection title="Sleep Schedule" icon={Moon}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {sleepOptions.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  onClick={() => setForm({ ...form, sleepSchedule: value })}
                  className="flex items-center gap-3 p-4 rounded-xl transition-all text-left"
                  style={{
                    background: form.sleepSchedule === value ? "rgba(45,212,168,0.1)" : "var(--color-bg-deep)",
                    border: `2px solid ${form.sleepSchedule === value ? "var(--color-primary)" : "var(--color-line)"}`,
                    cursor: "pointer",
                  }}
                >
                  <Icon size={20} style={{ color: form.sleepSchedule === value ? "var(--color-primary-bright)" : "var(--color-txt-muted)" }} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: form.sleepSchedule === value ? "var(--color-primary-bright)" : "var(--color-txt-primary)" }}>
                      {label}
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-txt-muted)" }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </FormSection>

          {/* Personality Scale */}
          <FormSection title="Personality Scale" icon={User}>
            <div>
              <div className="flex justify-between text-xs mb-2" style={{ color: "var(--color-txt-muted)" }}>
                <span>Introvert</span>
                <span>Extrovert</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={form.personalityScale}
                onChange={(e) => setForm({ ...form, personalityScale: parseInt(e.target.value) })}
                className="w-full"
                style={{ accentColor: "var(--color-primary)" }}
              />
              <div className="text-center mt-1 text-sm font-medium" style={{ color: "var(--color-primary-bright)" }}>
                {form.personalityScale}/10
              </div>
            </div>
          </FormSection>

          {/* Food + Languages + Remote */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormSection title="Food Preference" icon={UtensilsCrossed}>
              <select
                className="t-input w-full"
                value={form.foodPreference}
                onChange={(e) => setForm({ ...form, foodPreference: e.target.value })}
              >
                <option value="">Select preference</option>
                {foodOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </FormSection>

            <FormSection title="Languages Spoken" icon={Globe}>
              <div className="flex flex-wrap gap-2">
                {languageOptions.map((lang) => {
                  const isSelected = selectedLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: isSelected ? "rgba(167,139,250,0.15)" : "var(--color-bg-deep)",
                        color: isSelected ? "#a78bfa" : "var(--color-txt-muted)",
                        border: `1px solid ${isSelected ? "rgba(167,139,250,0.4)" : "var(--color-line)"}`,
                        cursor: "pointer",
                      }}
                    >
                      {isSelected ? <Check size={12} /> : <Plus size={12} />}
                      {lang}
                    </button>
                  );
                })}
              </div>
              {selectedLanguages.length > 0 && (
                <div className="mt-2 text-xs" style={{ color: "var(--color-txt-muted)" }}>
                  Selected: {selectedLanguages.join(", ")}
                </div>
              )}
            </FormSection>
          </div>

          {/* Remote Worker Toggle */}
          <FormSection title="Remote Worker" icon={Laptop}>
            <button
              onClick={() => setForm({ ...form, remoteWorker: !form.remoteWorker })}
              className="flex items-center gap-3"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <div
                className="w-12 h-6 rounded-full relative transition-colors"
                style={{ background: form.remoteWorker ? "var(--color-primary)" : "var(--color-bg-deep)" }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full transition-transform"
                  style={{
                    background: "white",
                    transform: form.remoteWorker ? "translateX(26px)" : "translateX(2px)",
                  }}
                />
              </div>
              <span className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>
                {form.remoteWorker ? "Yes, I work remotely" : "No, I don't work remotely"}
              </span>
            </button>
          </FormSection>

          {/* Photo Upload CTA */}
          <FormSection title="Profile & Cover Photos" icon={Camera}>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowAvatarUpload(true)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                style={{
                  background: "var(--color-bg-deep)",
                  border: "2px dashed var(--color-line-hover)",
                  cursor: "pointer",
                }}
              >
                {profile.profilePhotoUrl ? (
                  <div
                    className="w-14 h-14 rounded-full"
                    style={{
                      background: `url(${profile.profilePhotoUrl}) center/cover`,
                      border: "2px solid var(--color-primary)",
                    }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(45, 212, 168, 0.1)",
                      border: "1px solid rgba(45, 212, 168, 0.2)",
                    }}
                  >
                    <Camera size={20} style={{ color: "var(--color-primary)" }} />
                  </div>
                )}
                <span className="text-xs font-medium" style={{ color: "var(--color-txt-secondary)" }}>
                  {profile.profilePhotoUrl ? "Change Avatar" : "Upload Avatar"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowCoverUpload(true)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                style={{
                  background: "var(--color-bg-deep)",
                  border: "2px dashed var(--color-line-hover)",
                  cursor: "pointer",
                }}
              >
                {profile.coverPhotoUrl ? (
                  <div
                    className="w-14 h-10 rounded-lg"
                    style={{
                      background: `url(${profile.coverPhotoUrl}) center/cover`,
                      border: "2px solid var(--color-accent)",
                    }}
                  />
                ) : (
                  <div
                    className="w-14 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: "rgba(240, 160, 48, 0.1)",
                      border: "1px solid rgba(240, 160, 48, 0.2)",
                    }}
                  >
                    <Camera size={16} style={{ color: "var(--color-accent)" }} />
                  </div>
                )}
                <span className="text-xs font-medium" style={{ color: "var(--color-txt-secondary)" }}>
                  {profile.coverPhotoUrl ? "Change Cover" : "Upload Cover"}
                </span>
              </button>
            </div>
          </FormSection>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || profileBudgetError}
            className="t-btn-primary w-full flex items-center justify-center gap-2"
            style={{ padding: "14px" }}
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <><Save size={18} /> Save Profile</>}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!editing && !profile.bio && (profile.travelStyles || []).length === 0 && (
        <div
          className="text-center py-12 rounded-2xl"
          style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
        >
          <User size={40} className="mx-auto mb-4" style={{ color: "var(--color-txt-muted)" }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-txt-white)" }}>
            Complete Your Travel Profile
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--color-txt-secondary)" }}>
            Help us find your perfect travel companions by sharing your preferences
          </p>
          <button
            onClick={() => setEditing(true)}
            className="t-btn-primary"
            style={{ padding: "12px 24px" }}
          >
            <Edit3 size={16} /> Get Started <ChevronRight size={16} />
          </button>
        </div>
      )}
      {/* Avatar Upload Modal */}
      {showAvatarUpload && user && (
        <ImageUploadModal
          bucket={BUCKETS.AVATARS}
          userId={user.id}
          cropShape="round"
          aspect={1}
          title="Upload Profile Photo"
          onUploadComplete={handleAvatarUpload}
          onClose={() => setShowAvatarUpload(false)}
        />
      )}

      {/* Cover Upload Modal */}
      {showCoverUpload && user && (
        <ImageUploadModal
          bucket={BUCKETS.COVERS}
          userId={user.id}
          cropShape="rect"
          aspect={16 / 5}
          title="Upload Cover Photo"
          onUploadComplete={handleCoverUpload}
          onClose={() => setShowCoverUpload(false)}
        />
      )}
    </div>
  );
}

// --- Helper Components ---

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-medium capitalize"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      {label.toLowerCase()}
    </span>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-line)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} style={{ color: "var(--color-txt-muted)" }} />
        <span className="text-xs" style={{ color: "var(--color-txt-muted)" }}>{label}</span>
      </div>
      <span className="text-sm font-medium capitalize" style={{ color: "var(--color-txt-primary)" }}>{value.toLowerCase()}</span>
    </div>
  );
}

function FormSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} style={{ color: "var(--color-primary-bright)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-txt-white)" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}
