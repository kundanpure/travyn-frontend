"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, Loader2, MapPin, Calendar, Users,
  Mountain, Crown, Car, Landmark, Compass, Monitor, PartyPopper,
  Shield, Heart, Zap, Eye, AlertTriangle, IndianRupee, ImagePlus, Lightbulb, ArrowUp
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import ImageUploadModal from "@/app/dashboard/components/ImageUploadModal";
import LocationAutocomplete from "@/app/dashboard/components/LocationAutocomplete";

interface ValidationError {
  field: string;
  message: string;
}

const tripTypes = [
  { value: "BACKPACKING", label: "Backpacking", icon: Mountain, color: "#2dd4a8" },
  { value: "LUXURY", label: "Luxury", icon: Crown, color: "#f0a030" },
  { value: "ROAD_TRIP", label: "Road Trip", icon: Car, color: "#60a5fa" },
  { value: "CULTURAL", label: "Cultural", icon: Landmark, color: "#a78bfa" },
  { value: "ADVENTURE", label: "Adventure", icon: Compass, color: "#f472b6" },
  { value: "WEEKEND", label: "Weekend", icon: PartyPopper, color: "#34d399" },
  { value: "REMOTE_WORK", label: "Remote Work", icon: Monitor, color: "#fbbf24" },
];

const steps = ["Basics", "Settings", "Review"];

export default function CreateTripPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ValidationError[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [destinationInsights, setDestinationInsights] = useState<any[]>([]);
  const { user } = useAuthStore();
  
  const [myTrips, setMyTrips] = useState<any[]>([]);
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    api.get("/trips/my-trips").then(res => setMyTrips(res.data)).catch(() => {});
  }, []);

  const [form, setForm] = useState({
    title: "",
    destination: "",
    startDate: "",
    endDate: "",
    tripType: "ADVENTURE",
    maxSize: 6,
    approvalMode: "MANUAL",
    womenOnly: false,
    description: "",
    tags: "",
    coverImageUrl: "",
    minBudget: "",
    maxBudget: "",
  });

  const budgetError = form.minBudget && form.maxBudget && Number(form.minBudget) > Number(form.maxBudget);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.destination && form.destination.length >= 2) {
        api.get(`/destinations/${encodeURIComponent(form.destination)}/insights`)
          .then(res => setDestinationInsights(res.data.slice(0, 3))) // show top 3 insights
          .catch(err => console.error("Failed to fetch insights", err));
      } else {
        setDestinationInsights([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.destination]);

  useEffect(() => {
    if (form.startDate && form.endDate && myTrips.length > 0) {
      const s1 = new Date(form.startDate);
      const e1 = new Date(form.endDate);
      
      const overlap = myTrips.some(t => {
        if (t.status === "CANCELLED" || t.status === "COMPLETED") return false;
        const s2 = new Date(t.startDate);
        const e2 = new Date(t.endDate);
        return s1 <= e2 && s2 <= e1;
      });

      if (overlap) {
        setDateError("You already have an approved trip scheduled during these dates");
      } else {
        setDateError("");
      }
    } else {
      setDateError("");
    }
  }, [form.startDate, form.endDate, myTrips]);

  const canNext = () => {
    if (step === 0) return form.title && form.destination && form.startDate && form.endDate && form.tripType && !budgetError && !dateError;
    if (step === 1) return form.maxSize >= 2 && form.maxSize <= 12;
    return true;
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    setFieldErrors([]);
    try {
      const payload = {
        ...form,
        minBudget: form.minBudget ? Number(form.minBudget) : null,
        maxBudget: form.maxBudget ? Number(form.maxBudget) : null,
      };
      const res = await api.post("/trips", payload);
      const id = res.data?.id || res.data;
      router.push(`/dashboard/trips/${id}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; details?: ValidationError[] } } };
      const data = err?.response?.data;
      if (data?.details && data.details.length > 0) {
        setFieldErrors(data.details);
        setError("");
      } else {
        setError(data?.message || "Failed to create trip");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm mb-3"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-txt-muted)" }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-txt-white)" }}>Create a Trip</h1>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2 flex-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                style={{
                  background: i <= step ? "var(--color-primary)" : "var(--color-bg-deep)",
                  color: i <= step ? "#06080c" : "var(--color-txt-muted)",
                  border: i <= step ? "none" : "1px solid var(--color-line)",
                }}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span
                className="text-xs font-medium hidden sm:block"
                style={{ color: i <= step ? "var(--color-primary-bright)" : "var(--color-txt-muted)" }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-0.5 flex-1 rounded"
                style={{ background: i < step ? "var(--color-primary)" : "var(--color-line)" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
      >
        {/* STEP 1: Basics */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-txt-white)" }}>
              Trip Basics
            </h2>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--color-txt-secondary)" }}>
                Trip Title *
              </label>
              <input
                className="t-input w-full"
                placeholder="e.g., Weekend Hike in Munnar"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--color-txt-secondary)" }}>
                Destination *
              </label>
              <LocationAutocomplete
                value={form.destination}
                onChange={(val) => setForm({ ...form, destination: val })}
              />

              {/* Pre-trip Briefing */}
              {form.destination && destinationInsights.length > 0 && (
                <div className="rounded-xl border border-emerald-900/30 bg-emerald-900/10 p-4 mt-4">
                  <h3 className="text-xs font-bold text-emerald-400 mb-3 flex items-center gap-2">
                    <Lightbulb size={14} />
                    Pre-Trip Briefing for {form.destination}
                  </h3>
                  <div className="space-y-2">
                    {destinationInsights.map(insight => (
                      <div key={insight.id} className="p-2.5 rounded-lg flex items-start gap-2.5 bg-black/20">
                        <div className="text-sm shrink-0">
                          {insight.category === "ALERT" ? "🚨" : insight.category === "PRO_TIP" ? "💡" : "⭐"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-300 mb-1 leading-snug">{insight.content}</p>
                          <div className="text-[9px] text-gray-500 flex items-center gap-2">
                            <span className="font-semibold text-emerald-500/80">{insight.authorName}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5"><ArrowUp size={8}/> {insight.upvotes}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--color-txt-secondary)" }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  className="t-input w-full"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--color-txt-secondary)" }}>
                  End Date *
                </label>
                <input
                  type="date"
                  className="t-input w-full"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            {dateError && (
              <div className="text-xs mt-1 block font-medium p-2 rounded-lg" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                ⚠ {dateError}
              </div>
            )}

            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: "var(--color-txt-secondary)" }}>
                Trip Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {tripTypes.map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    onClick={() => setForm({ ...form, tripType: value })}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
                    style={{
                      background: form.tripType === value ? `${color}15` : "var(--color-bg-deep)",
                      border: `2px solid ${form.tripType === value ? color : "var(--color-line)"}`,
                      cursor: "pointer",
                    }}
                  >
                    <Icon size={20} style={{ color: form.tripType === value ? color : "var(--color-txt-muted)" }} />
                    <span className="text-xs font-medium" style={{ color: form.tripType === value ? color : "var(--color-txt-secondary)" }}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Range */}
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--color-txt-secondary)" }}>
                Budget Range (per person)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-txt-muted)" }} />
                  <input
                    type="number"
                    className="t-input w-full"
                    style={{ paddingLeft: 32 }}
                    placeholder="Min budget"
                    min={0}
                    value={form.minBudget}
                    onChange={(e) => setForm({ ...form, minBudget: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-txt-muted)" }} />
                  <input
                    type="number"
                    className="t-input w-full"
                    style={{ paddingLeft: 32 }}
                    placeholder="Max budget"
                    min={0}
                    value={form.maxBudget}
                    onChange={(e) => setForm({ ...form, maxBudget: e.target.value })}
                  />
                </div>
              </div>
              <span className="text-xs mt-1 block" style={{ color: "var(--color-txt-muted)" }}>Optional — helps travelers plan ahead</span>
              {budgetError && (
                <span className="text-xs mt-1 block" style={{ color: "#f87171" }}>
                  ⚠ Minimum budget must be less than maximum budget
                </span>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Settings */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-txt-white)" }}>
              Trip Settings
            </h2>

            {/* Max Size */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: "var(--color-txt-secondary)" }}>
                Max Group Size
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm({ ...form, maxSize: Math.max(2, form.maxSize - 1) })}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-line)", color: "var(--color-txt-primary)", cursor: "pointer" }}
                >
                  −
                </button>
                <div
                  className="w-14 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-primary)", color: "var(--color-primary-bright)" }}
                >
                  {form.maxSize}
                </div>
                <button
                  onClick={() => setForm({ ...form, maxSize: Math.min(12, form.maxSize + 1) })}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-line)", color: "var(--color-txt-primary)", cursor: "pointer" }}
                >
                  +
                </button>
                <span className="text-xs" style={{ color: "var(--color-txt-muted)" }}>travelers (2–12)</span>
              </div>
            </div>

            {/* Approval Mode */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: "var(--color-txt-secondary)" }}>
                Join Approval
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "MANUAL", label: "Manual Approval", desc: "Review each request", icon: Shield },
                  { value: "AUTO", label: "Auto Approve", desc: "Anyone can join", icon: Zap },
                ].map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setForm({ ...form, approvalMode: value })}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{
                      background: form.approvalMode === value ? "rgba(45,212,168,0.1)" : "var(--color-bg-deep)",
                      border: `2px solid ${form.approvalMode === value ? "var(--color-primary)" : "var(--color-line)"}`,
                      cursor: "pointer",
                    }}
                  >
                    <Icon size={18} style={{ color: form.approvalMode === value ? "var(--color-primary-bright)" : "var(--color-txt-muted)" }} className="mb-2" />
                    <div className="text-sm font-medium" style={{ color: form.approvalMode === value ? "var(--color-primary-bright)" : "var(--color-txt-primary)" }}>
                      {label}
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-txt-muted)" }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Women Only */}
            {user?.gender === "FEMALE" && (
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-line)", opacity: user.status === "KYC_VERIFIED" ? 1 : 0.6 }}>
                <div className="flex items-center gap-3">
                  <Heart size={18} style={{ color: "#f472b6" }} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--color-txt-primary)" }}>Women Only</div>
                    <div className="text-xs" style={{ color: "var(--color-txt-muted)" }}>
                      {user.status === "KYC_VERIFIED" ? "Restrict to verified women members" : "Verify your identity to create women-only trips"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (user.status === "KYC_VERIFIED") {
                      setForm({ ...form, womenOnly: !form.womenOnly })
                    }
                  }}
                  disabled={user.status !== "KYC_VERIFIED"}
                  style={{ background: "none", border: "none", cursor: user.status === "KYC_VERIFIED" ? "pointer" : "not-allowed" }}
                >
                  <div
                    className="w-12 h-6 rounded-full relative transition-colors"
                    style={{ background: form.womenOnly ? "#f472b6" : "var(--color-bg-surface)" }}
                  >
                    <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                      style={{ transform: form.womenOnly ? "translateX(26px)" : "translateX(2px)" }} />
                  </div>
                </button>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--color-txt-secondary)" }}>
                Description
              </label>
              <div className="relative">
                <textarea
                  className="t-input w-full"
                  style={{ minHeight: 120, resize: "vertical" }}
                  placeholder="Describe your trip, what you'll do, what to bring..."
                  maxLength={2000}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <span className="absolute bottom-2 right-3 text-xs" style={{ color: "var(--color-txt-muted)" }}>
                  {form.description.length}/2000
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--color-txt-white)" }}>
              <Eye size={20} /> Review Your Trip
            </h2>

            {/* Summary Card */}
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-line)" }}>
              <div
                className="h-24"
                style={{
                  background: form.coverImageUrl
                    ? `url(${form.coverImageUrl}) center/cover`
                    : `linear-gradient(135deg, ${tripTypes.find(t => t.value === form.tripType)?.color || "#2dd4a8"}30, rgba(0,0,0,0.2))`,
                }}
              />
              <div className="p-4 space-y-3" style={{ background: "var(--color-bg-deep)" }}>
                <h3 className="text-lg font-bold" style={{ color: "var(--color-txt-white)" }}>{form.title}</h3>
                <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--color-txt-muted)" }}>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {form.destination}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {form.startDate} → {form.endDate}</span>
                  <span className="flex items-center gap-1"><Users size={12} /> Up to {form.maxSize}</span>
                  {(form.minBudget || form.maxBudget) && (
                    <span className="flex items-center gap-1">
                      <IndianRupee size={12} />
                      {form.minBudget && form.maxBudget
                        ? `₹${Number(form.minBudget).toLocaleString()} – ₹${Number(form.maxBudget).toLocaleString()}`
                        : form.minBudget
                          ? `From ₹${Number(form.minBudget).toLocaleString()}`
                          : `Up to ₹${Number(form.maxBudget).toLocaleString()}`
                      }
                    </span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(45,212,168,0.1)", color: "#2dd4a8" }}>
                    {form.tripType.replace("_", " ")}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs" style={{ background: "var(--color-bg-surface)", color: "var(--color-txt-secondary)" }}>
                    {form.approvalMode === "MANUAL" ? "Manual Approval" : "Auto Approve"}
                  </span>
                  {form.womenOnly && (
                    <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(244,114,182,0.1)", color: "#f472b6" }}>
                      Women Only
                    </span>
                  )}
                </div>
                {form.description && (
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-txt-secondary)" }}>
                    {form.description}
                  </p>
                )}
              </div>
            </div>

            {/* Cover Image Upload */}
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--color-txt-secondary)" }}>
                Cover Image (optional)
              </label>
              <div className="flex items-center gap-4">
                {form.coverImageUrl && (
                  <div
                    className="w-24 h-14 rounded-lg"
                    style={{ 
                      background: `url(${form.coverImageUrl}) center/cover`, 
                      border: "1px solid var(--color-line)" 
                    }}
                  />
                )}
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: "rgba(45,212,168,0.05)",
                    border: "1px dashed var(--color-primary)",
                    color: "var(--color-primary-bright)",
                    cursor: "pointer",
                  }}
                >
                  <ImagePlus size={16} />
                  {form.coverImageUrl ? "Change Cover" : "Upload Cover"}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--color-txt-secondary)" }}>
                Tags (comma-separated, optional)
              </label>
              <input
                className="t-input w-full"
                placeholder="hiking, beach, sunset"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>

            {/* Validation Errors */}
            {fieldErrors.length > 0 && (
              <div
                className="rounded-xl p-4 space-y-2"
                style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={16} style={{ color: "#f87171" }} />
                  <span className="text-sm font-semibold" style={{ color: "#f87171" }}>Please fix the following:</span>
                </div>
                {fieldErrors.map((fe, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--color-txt-secondary)" }}>
                    <span
                      className="px-1.5 py-0.5 rounded text-xs font-mono flex-shrink-0"
                      style={{ background: "rgba(248,113,113,0.15)", color: "#fca5a5" }}
                    >
                      {fe.field}
                    </span>
                    <span>{fe.message}</span>
                  </div>
                ))}
              </div>
            )}

            {error && !fieldErrors.length && (
              <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        {step > 0 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="t-btn-outline flex items-center gap-2"
            style={{ padding: "12px 24px" }}
          >
            <ArrowLeft size={16} /> Back
          </button>
        ) : <div />}

        {step < 2 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="t-btn-primary flex items-center gap-2"
            style={{ padding: "12px 24px", opacity: canNext() ? 1 : 0.5 }}
          >
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="t-btn-primary flex items-center gap-2"
            style={{ padding: "12px 24px" }}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> Create Trip</>}
          </button>
        )}
      </div>

      {showUpload && user && (
        <ImageUploadModal
          bucket="covers"
          userId={user.id}
          cropShape="rect"
          aspect={16 / 9}
          title="Upload Trip Cover"
          onUploadComplete={(url) => {
            setForm({ ...form, coverImageUrl: url });
            setShowUpload(false);
          }}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
