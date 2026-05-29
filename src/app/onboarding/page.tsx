"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, User, Wallet, Moon, ChevronRight, Check, Loader2, Sparkles } from "lucide-react";
import api from "@/lib/api";

type Step = "BIO" | "TRAVEL_STYLE" | "BUDGET" | "SLEEP";

const TRAVEL_STYLES = [
  { id: "BACKPACKER", label: "Backpacker", icon: "🎒" },
  { id: "LUXURY", label: "Luxury", icon: "✨" },
  { id: "ADVENTURE", label: "Adventure", icon: "🏔️" },
  { id: "CULTURAL", label: "Cultural", icon: "🏛️" },
  { id: "RELAXATION", label: "Relaxation", icon: "🏖️" },
  { id: "PARTY", label: "Party", icon: "🎉" },
  { id: "NATURE", label: "Nature", icon: "🌲" },
  { id: "PHOTOGRAPHY", label: "Photography", icon: "📸" }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("BIO");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    bio: "",
    travelStyles: [] as string[],
    budgetMin: 500,
    budgetMax: 5000,
    sleepSchedule: "NIGHT_OWL",
  });

  const toggleStyle = (id: string) => {
    setForm(prev => {
      const isSelected = prev.travelStyles.includes(id);
      if (isSelected) {
        return { ...prev, travelStyles: prev.travelStyles.filter(s => s !== id) };
      }
      if (prev.travelStyles.length >= 3) return prev; // max 3
      return { ...prev, travelStyles: [...prev.travelStyles, id] };
    });
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await api.put("/users/me/profile", form);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      // Even if it fails, go to dashboard
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--color-bg-deep)" }}>
      <div className="w-full max-w-lg">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <div style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))" }}>
              <Compass size={18} color="#06080c" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--color-txt-white)" }}>
            Let's build your profile
          </h1>
          <p className="text-base" style={{ color: "var(--color-txt-secondary)" }}>
            A better profile means better travel companions.
          </p>
        </div>

        <div className="rounded-3xl p-8 transition-all" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}>
          
          {step === "BIO" && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--color-txt-white)" }}>Write a short bio</h2>
                  <p className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>Introduce yourself to the community</p>
                </div>
              </div>
              
              <textarea 
                className="t-input w-full h-32 resize-none"
                placeholder="Hi, I'm passionate about exploring hidden gems and trying local street food..."
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                maxLength={500}
              />
              <div className="text-right text-xs mt-2" style={{ color: "var(--color-txt-muted)" }}>
                {form.bio.length}/500
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep("TRAVEL_STYLE")} className="flex-1 p-3 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors" style={{ color: "var(--color-txt-secondary)" }}>
                  Skip
                </button>
                <button onClick={() => setStep("TRAVEL_STYLE")} className="flex-2 t-btn-primary w-2/3 p-3 flex items-center justify-center gap-2">
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === "TRAVEL_STYLE" && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--color-txt-white)" }}>Your Travel Style</h2>
                  <p className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>Select up to 3</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {TRAVEL_STYLES.map(s => {
                  const isSelected = form.travelStyles.includes(s.id);
                  return (
                    <button 
                      key={s.id}
                      onClick={() => toggleStyle(s.id)}
                      className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all"
                      style={{
                        background: isSelected ? "rgba(45,212,168,0.1)" : "var(--color-bg-deep)",
                        border: `2px solid ${isSelected ? "var(--color-primary)" : "var(--color-line)"}`,
                        color: isSelected ? "var(--color-primary-bright)" : "var(--color-txt-secondary)"
                      }}
                    >
                      <span className="text-2xl">{s.icon}</span>
                      <span className="font-bold text-sm">{s.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep("BIO")} className="p-3 px-5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors" style={{ color: "var(--color-txt-secondary)" }}>
                  Back
                </button>
                <button onClick={() => setStep("BUDGET")} className="flex-1 t-btn-primary p-3 flex items-center justify-center gap-2">
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === "BUDGET" && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                  <Wallet size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--color-txt-white)" }}>Typical Budget</h2>
                  <p className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>Per week, per person (USD)</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-txt-muted)" }}>Min Budget</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold" style={{ color: "var(--color-txt-secondary)" }}>$</span>
                    <input type="number" className="t-input w-full pl-8" value={form.budgetMin} onChange={e => setForm({...form, budgetMin: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-txt-muted)" }}>Max Budget</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold" style={{ color: "var(--color-txt-secondary)" }}>$</span>
                    <input type="number" className="t-input w-full pl-8" value={form.budgetMax} onChange={e => setForm({...form, budgetMax: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-10">
                <button onClick={() => setStep("TRAVEL_STYLE")} className="p-3 px-5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors" style={{ color: "var(--color-txt-secondary)" }}>
                  Back
                </button>
                <button onClick={() => setStep("SLEEP")} className="flex-1 t-btn-primary p-3 flex items-center justify-center gap-2">
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === "SLEEP" && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Moon size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--color-txt-white)" }}>Sleep Schedule</h2>
                  <p className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>When do you usually wake up?</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { id: "EARLY_BIRD", label: "Early Bird", desc: "Before 7 AM" },
                  { id: "FLEXIBLE", label: "Flexible", desc: "Whenever" },
                  { id: "NIGHT_OWL", label: "Night Owl", desc: "After 10 AM" }
                ].map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setForm({...form, sleepSchedule: s.id})}
                    className="w-full p-4 rounded-xl flex items-center justify-between transition-all"
                    style={{
                      background: form.sleepSchedule === s.id ? "rgba(45,212,168,0.1)" : "var(--color-bg-deep)",
                      border: `2px solid ${form.sleepSchedule === s.id ? "var(--color-primary)" : "var(--color-line)"}`,
                    }}
                  >
                    <div>
                      <div className="font-bold text-left mb-1" style={{ color: form.sleepSchedule === s.id ? "var(--color-primary-bright)" : "var(--color-txt-white)" }}>{s.label}</div>
                      <div className="text-xs text-left" style={{ color: "var(--color-txt-muted)" }}>{s.desc}</div>
                    </div>
                    {form.sleepSchedule === s.id && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check size={14} color="#000" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-10">
                <button onClick={() => setStep("BUDGET")} className="p-3 px-5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors" style={{ color: "var(--color-txt-secondary)" }}>
                  Back
                </button>
                <button onClick={handleComplete} disabled={loading} className="flex-1 t-btn-primary p-3 flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <>Complete Profile <Check size={18} /></>}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
