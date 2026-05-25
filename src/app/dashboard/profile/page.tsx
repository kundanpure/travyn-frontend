"use client";

import { useState, useEffect } from "react";
import {
  User, Edit3, Save, X, Mountain, Landmark, Palette, PartyPopper, Wallet,
  Sun, Moon, Clock, Loader2, CheckCircle2, Laptop, Globe, UtensilsCrossed,
  ChevronRight, Camera, Check, Plus
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";

const travelStyles = [
  { value: "ADVENTURE", label: "Adventure", icon: Mountain, color: "#2dd4a8" },
  { value: "CULTURAL", label: "Cultural", icon: Landmark, color: "#f0a030" },
  { value: "RELAXATION", label: "Relaxation", icon: Sun, color: "#60a5fa" },
  { value: "PARTY", label: "Party", icon: PartyPopper, color: "#f472b6" },
  { value: "BUDGET", label: "Budget", icon: Wallet, color: "#a78bfa" },
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
  bio: string;
  travelStyle: string;
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
  bio: "", travelStyle: "", budgetMin: 0, budgetMax: 0,
  sleepSchedule: "", personalityScale: 5, foodPreference: "",
  languages: "", remoteWorker: false, profilePhotoUrl: "",
  coverPhotoUrl: "", profileCompleteness: 0,
};

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [form, setForm] = useState<ProfileData>(emptyProfile);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Sanitize API response to ensure no null/undefined values for controlled inputs
  const sanitize = (data: Partial<ProfileData>): ProfileData => ({
    bio: data.bio ?? "",
    travelStyle: data.travelStyle ?? "",
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/users/me/profile", form);
      const safe = sanitize(res.data);
      setProfile(safe);
      setForm(safe);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // handle error
    } finally {
      setSaving(false);
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
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl animate-pulse"
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
          className="h-32 relative"
          style={{
            background: profile.coverPhotoUrl
              ? `url(${profile.coverPhotoUrl}) center/cover`
              : "linear-gradient(135deg, rgba(45,212,168,0.3), rgba(240,160,48,0.2))",
          }}
        >
          <div
            className="absolute -bottom-10 left-6 w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xl"
            style={{
              background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              color: "#06080c",
              border: "3px solid var(--color-bg-surface)",
            }}
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </div>

        <div className="pt-14 px-6 pb-6">
          <h2 className="text-xl font-bold" style={{ color: "var(--color-txt-white)" }}>
            {user?.firstName} {user?.lastName}
          </h2>
          <p className="text-sm" style={{ color: "var(--color-txt-muted)" }}>{user?.email}</p>

          {!editing && profile.bio && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-txt-secondary)" }}>
              {profile.bio}
            </p>
          )}

          {/* View Mode Badges */}
          {!editing && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.travelStyle && (
                <Badge label={profile.travelStyle.replace("_", " ")} color="var(--color-primary)" />
              )}
              {profile.sleepSchedule && (
                <Badge label={profile.sleepSchedule.replace("_", " ")} color="var(--color-accent)" />
              )}
              {profile.foodPreference && profile.foodPreference !== "NO_PREFERENCE" && (
                <Badge label={profile.foodPreference.replace("_", " ")} color="#f472b6" />
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
              {profile.travelStyle && (
                <StatCard icon={Mountain} label="Style" value={profile.travelStyle.replace("_", " ")} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="space-y-6">
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

          {/* Travel Style */}
          <FormSection title="Travel Style" icon={Mountain}>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {travelStyles.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setForm({ ...form, travelStyle: value })}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                  style={{
                    background: form.travelStyle === value ? `${color}15` : "var(--color-bg-deep)",
                    border: `2px solid ${form.travelStyle === value ? color : "var(--color-line)"}`,
                    cursor: "pointer",
                  }}
                >
                  <Icon size={24} style={{ color: form.travelStyle === value ? color : "var(--color-txt-muted)" }} />
                  <span className="text-xs font-medium" style={{ color: form.travelStyle === value ? color : "var(--color-txt-secondary)" }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
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
                className="w-full accent-emerald-400"
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

          {/* Photo URL */}
          <FormSection title="Profile Photo" icon={Camera}>
            <input
              type="url"
              className="t-input w-full"
              placeholder="https://example.com/your-photo.jpg"
              value={form.profilePhotoUrl}
              onChange={(e) => setForm({ ...form, profilePhotoUrl: e.target.value })}
            />
          </FormSection>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="t-btn-primary w-full flex items-center justify-center gap-2"
            style={{ padding: "14px" }}
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <><Save size={18} /> Save Profile</>}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!editing && !profile.bio && !profile.travelStyle && (
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
