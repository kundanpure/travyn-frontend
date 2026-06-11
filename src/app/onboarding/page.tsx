"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, User, Wallet, Moon, ChevronRight, Check, Loader2, Sparkles, Beer, Zap, Home, ClipboardList, Heart, Globe, Map } from "lucide-react";
import api from "@/lib/api";
import { LocationSearch } from "@/components/ui/LocationSearch";

type Step = "BIO" | "TRAVEL_STYLE" | "BUDGET" | "SLEEP" | "HABITS" | "PACE" | "ACCOMMODATION" | "PLANNING" | "MOTIVATION" | "MEANING" | "EXPERIENCE";

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

const MOTIVATIONS = [
  { id: "ESCAPE", label: "Escape routine & recharge", icon: "🌅" },
  { id: "GROWTH", label: "Personal growth", icon: "🌱" },
  { id: "ADVENTURE", label: "Adventure & adrenaline", icon: "⚡" },
  { id: "CULTURE", label: "Culture & history", icon: "🏛️" },
  { id: "PEOPLE", label: "Meet new people", icon: "🤝" },
  { id: "MEMORIES", label: "Create memories", icon: "📸" },
  { id: "PEACE", label: "Inner peace", icon: "🧘" },
  { id: "FOOD", label: "Culinary experiences", icon: "🍜" }
];

const MEANINGS = [
  { id: "FREEDOM", label: "Freedom (no boundaries)", icon: "🕊️" },
  { id: "LEARNING", label: "Learning (understanding the world)", icon: "📚" },
  { id: "CONNECTION", label: "Connection (bonding)", icon: "💞" },
  { id: "PEACE", label: "Peace (calm away from chaos)", icon: "☮️" },
  { id: "CHALLENGE", label: "Challenge (pushing limits)", icon: "🔥" },
  { id: "INSPIRATION", label: "Inspiration (creative fuel)", icon: "🎨" }
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
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    locationName: undefined as string | undefined,
  });

  const [prefs, setPrefs] = useState({
    smokingHabit: "NEVER",
    drinkingHabit: "SOCIALLY",
    tripPace: "BALANCED",
    accommodationStyle: "HOSTEL_DORM",
    planningStyle: "ROUGH",
    cleanliness: "MODERATE",
    socialEnergy: "BALANCED",
    travelMotivations: [] as string[],
    travelMeanings: [] as string[],
    tripExperience: "FEW"
  });

  const toggleStyle = (id: string) => {
    setForm(prev => {
      const isSelected = prev.travelStyles.includes(id);
      if (isSelected) {
        return { ...prev, travelStyles: prev.travelStyles.filter(s => s !== id) };
      }
      if (prev.travelStyles.length >= 3) return prev;
      return { ...prev, travelStyles: [...prev.travelStyles, id] };
    });
  };

  const toggleMotivation = (id: string) => {
    setPrefs(prev => {
      const isSelected = prev.travelMotivations.includes(id);
      if (isSelected) return { ...prev, travelMotivations: prev.travelMotivations.filter(s => s !== id) };
      if (prev.travelMotivations.length >= 3) return prev;
      return { ...prev, travelMotivations: [...prev.travelMotivations, id] };
    });
  };

  const toggleMeaning = (id: string) => {
    setPrefs(prev => {
      const isSelected = prev.travelMeanings.includes(id);
      if (isSelected) return { ...prev, travelMeanings: prev.travelMeanings.filter(s => s !== id) };
      if (prev.travelMeanings.length >= 2) return prev;
      return { ...prev, travelMeanings: [...prev.travelMeanings, id] };
    });
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await api.put("/users/me/profile", form);
      try {
        await api.post("/matches/preferences", prefs);
      } catch (prefErr) {
        console.error("Failed to save match prefs, but continuing", prefErr);
      }
      router.push("/dashboard/matches");
    } catch (err) {
      console.error(err);
      router.push("/dashboard/matches");
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
            Travel Compatibility
          </h1>
          <p className="text-base" style={{ color: "var(--color-txt-secondary)" }}>
            Let&apos;s find your perfect travel companion.
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
                  <h2 className="text-xl font-bold" style={{ color: "var(--color-txt-white)" }}>Basic Info</h2>
                  <p className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>Introduce yourself to the community</p>
                </div>
              </div>
              
              <div className="mb-6">
                <LocationSearch 
                  onLocationSelect={(loc) => setForm(prev => ({ ...prev, latitude: loc.latitude, longitude: loc.longitude, locationName: loc.name }))}
                />
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
                <button onClick={() => setStep("TRAVEL_STYLE")} className="flex-1 p-3 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors" style={{ color: "var(--color-txt-secondary)" }}>Skip</button>
                <button onClick={() => setStep("TRAVEL_STYLE")} className="flex-2 t-btn-primary w-2/3 p-3 flex items-center justify-center gap-2">Next <ChevronRight size={18} /></button>
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
                <button onClick={() => setStep("BIO")} className="p-3 px-5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors" style={{ color: "var(--color-txt-secondary)" }}>Back</button>
                <button onClick={() => setStep("BUDGET")} className="flex-1 t-btn-primary p-3 flex items-center justify-center gap-2">Next <ChevronRight size={18} /></button>
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
                  <p className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>Per week, per person (INR)</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-txt-muted)" }}>Min Budget</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold" style={{ color: "var(--color-txt-secondary)" }}>₹</span>
                    <input type="number" className="t-input w-full pl-8" value={form.budgetMin} onChange={e => setForm({...form, budgetMin: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-txt-muted)" }}>Max Budget</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold" style={{ color: "var(--color-txt-secondary)" }}>₹</span>
                    <input type="number" className="t-input w-full pl-8" value={form.budgetMax} onChange={e => setForm({...form, budgetMax: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-10">
                <button onClick={() => setStep("TRAVEL_STYLE")} className="p-3 px-5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors" style={{ color: "var(--color-txt-secondary)" }}>Back</button>
                <button onClick={() => setStep("SLEEP")} className="flex-1 t-btn-primary p-3 flex items-center justify-center gap-2">Next <ChevronRight size={18} /></button>
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
                    {form.sleepSchedule === s.id && <Check size={18} color="var(--color-primary)" />}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-10">
                <button onClick={() => setStep("BUDGET")} className="p-3 px-5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors" style={{ color: "var(--color-txt-secondary)" }}>Back</button>
                <button onClick={() => setStep("HABITS")} className="flex-1 t-btn-primary p-3 flex items-center justify-center gap-2">Next <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {step === "HABITS" && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-orange-500/20 text-orange-400">
                  <Beer size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--color-txt-white)" }}>Smoking & Drinking</h2>
                  <p className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>What are your habits on trips?</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold mb-3 text-white">Smoking</label>
                <div className="flex gap-2">
                  {["NEVER", "SOCIALLY", "REGULARLY"].map(s => (
                    <button 
                      key={s}
                      onClick={() => setPrefs({...prefs, smokingHabit: s})}
                      className="flex-1 p-3 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: prefs.smokingHabit === s ? "rgba(45,212,168,0.1)" : "var(--color-bg-deep)",
                        border: `1px solid ${prefs.smokingHabit === s ? "var(--color-primary)" : "var(--color-line)"}`,
                        color: prefs.smokingHabit === s ? "var(--color-primary-bright)" : "var(--color-txt-secondary)"
                      }}
                    >
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-3 text-white">Drinking</label>
                <div className="flex gap-2">
                  {["NEVER", "SOCIALLY", "REGULARLY"].map(s => (
                    <button 
                      key={s}
                      onClick={() => setPrefs({...prefs, drinkingHabit: s})}
                      className="flex-1 p-3 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: prefs.drinkingHabit === s ? "rgba(45,212,168,0.1)" : "var(--color-bg-deep)",
                        border: `1px solid ${prefs.drinkingHabit === s ? "var(--color-primary)" : "var(--color-line)"}`,
                        color: prefs.drinkingHabit === s ? "var(--color-primary-bright)" : "var(--color-txt-secondary)"
                      }}
                    >
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-10">
                <button onClick={() => setStep("SLEEP")} className="p-3 px-5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors" style={{ color: "var(--color-txt-secondary)" }}>Back</button>
                <button onClick={() => setStep("PACE")} className="flex-1 t-btn-primary p-3 flex items-center justify-center gap-2">Next <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {step === "PACE" && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-yellow-500/20 text-yellow-400">
                  <Zap size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--color-txt-white)" }}>Trip Pace</h2>
                  <p className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>How do you like to explore?</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { id: "PACKED", label: "Packed Schedule", desc: "Wake early, see everything, maximize every day", icon: "🏃" },
                  { id: "BALANCED", label: "Balanced", desc: "Mix of planned activities and free time", icon: "⚖️" },
                  { id: "GO_WITH_FLOW", label: "Go With The Flow", desc: "No schedule, follow the vibe wherever it takes me", icon: "🌊" }
                ].map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setPrefs({...prefs, tripPace: s.id})}
                    className="w-full p-4 rounded-xl flex items-center justify-between transition-all"
                    style={{
                      background: prefs.tripPace === s.id ? "rgba(45,212,168,0.1)" : "var(--color-bg-deep)",
                      border: `2px solid ${prefs.tripPace === s.id ? "var(--color-primary)" : "var(--color-line)"}`,
                    }}
                  >
                    <div className="flex gap-3">
                      <span className="text-xl">{s.icon}</span>
                      <div>
                        <div className="font-bold text-left mb-1" style={{ color: prefs.tripPace === s.id ? "var(--color-primary-bright)" : "var(--color-txt-white)" }}>{s.label}</div>
                        <div className="text-xs text-left" style={{ color: "var(--color-txt-muted)" }}>{s.desc}</div>
                      </div>
                    </div>
                    {prefs.tripPace === s.id && <Check size={18} color="var(--color-primary)" />}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-10">
                <button onClick={() => setStep("HABITS")} className="p-3 px-5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors" style={{ color: "var(--color-txt-secondary)" }}>Back</button>
                <button onClick={() => setStep("ACCOMMODATION")} className="flex-1 t-btn-primary p-3 flex items-center justify-center gap-2">Next <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {step === "ACCOMMODATION" && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                  <Home size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--color-txt-white)" }}>Accommodation</h2>
                  <p className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>Where do you prefer to stay?</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { id: "HOSTEL_DORM", label: "Hostel Dorm", desc: "Social, budget-friendly", icon: "🛏️" },
                  { id: "PRIVATE_ROOM", label: "Private Room", desc: "Social vibe, personal space", icon: "🚪" },
                  { id: "HOTEL", label: "Hotel / Airbnb", desc: "Comfort and privacy first", icon: "🏨" },
                  { id: "ANYTHING_WORKS", label: "Anything Works", desc: "I'm totally flexible", icon: "🤷" }
                ].map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setPrefs({...prefs, accommodationStyle: s.id})}
                    className="w-full p-4 rounded-xl flex items-center justify-between transition-all"
                    style={{
                      background: prefs.accommodationStyle === s.id ? "rgba(45,212,168,0.1)" : "var(--color-bg-deep)",
                      border: `2px solid ${prefs.accommodationStyle === s.id ? "var(--color-primary)" : "var(--color-line)"}`,
                    }}
                  >
                    <div className="flex gap-3">
                      <span className="text-xl">{s.icon}</span>
                      <div>
                        <div className="font-bold text-left mb-1" style={{ color: prefs.accommodationStyle === s.id ? "var(--color-primary-bright)" : "var(--color-txt-white)" }}>{s.label}</div>
                        <div className="text-xs text-left" style={{ color: "var(--color-txt-muted)" }}>{s.desc}</div>
                      </div>
                    </div>
                    {prefs.accommodationStyle === s.id && <Check size={18} color="var(--color-primary)" />}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-10">
                <button onClick={() => setStep("PACE")} className="p-3 px-5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors" style={{ color: "var(--color-txt-secondary)" }}>Back</button>
                <button onClick={() => setStep("PLANNING")} className="flex-1 t-btn-primary p-3 flex items-center justify-center gap-2">Next <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {step === "PLANNING" && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-pink-500/20 text-pink-400">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--color-txt-white)" }}>Planning Style</h2>
                  <p className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>How do you plan trips?</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { id: "DETAILED", label: "Detailed Planner", desc: "Everything booked and researched weeks ahead", icon: "📊" },
                  { id: "ROUGH", label: "Rough Plan", desc: "Key things booked, rest spontaneous", icon: "📝" },
                  { id: "ZERO", label: "Zero Plan", desc: "Book the flight and figure it out", icon: "🎲" }
                ].map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setPrefs({...prefs, planningStyle: s.id})}
                    className="w-full p-4 rounded-xl flex items-center justify-between transition-all"
                    style={{
                      background: prefs.planningStyle === s.id ? "rgba(45,212,168,0.1)" : "var(--color-bg-deep)",
                      border: `2px solid ${prefs.planningStyle === s.id ? "var(--color-primary)" : "var(--color-line)"}`,
                    }}
                  >
                    <div className="flex gap-3">
                      <span className="text-xl">{s.icon}</span>
                      <div>
                        <div className="font-bold text-left mb-1" style={{ color: prefs.planningStyle === s.id ? "var(--color-primary-bright)" : "var(--color-txt-white)" }}>{s.label}</div>
                        <div className="text-xs text-left" style={{ color: "var(--color-txt-muted)" }}>{s.desc}</div>
                      </div>
                    </div>
                    {prefs.planningStyle === s.id && <Check size={18} color="var(--color-primary)" />}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-10">
                <button onClick={() => setStep("ACCOMMODATION")} className="p-3 px-5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors" style={{ color: "var(--color-txt-secondary)" }}>Back</button>
                <button onClick={() => setStep("MOTIVATION")} className="flex-1 t-btn-primary p-3 flex items-center justify-center gap-2">Next <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {step === "MOTIVATION" && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-red-500/20 text-red-400">
                  <Heart size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--color-txt-white)" }}>Why do you travel?</h2>
                  <p className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>Select up to 3</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {MOTIVATIONS.map(s => {
                  const isSelected = prefs.travelMotivations.includes(s.id);
                  return (
                    <button 
                      key={s.id}
                      onClick={() => toggleMotivation(s.id)}
                      className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all"
                      style={{
                        background: isSelected ? "rgba(45,212,168,0.1)" : "var(--color-bg-deep)",
                        border: `2px solid ${isSelected ? "var(--color-primary)" : "var(--color-line)"}`,
                        color: isSelected ? "var(--color-primary-bright)" : "var(--color-txt-secondary)"
                      }}
                    >
                      <span className="text-2xl">{s.icon}</span>
                      <span className="font-bold text-xs text-center">{s.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep("PLANNING")} className="p-3 px-5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors" style={{ color: "var(--color-txt-secondary)" }}>Back</button>
                <button onClick={() => setStep("MEANING")} className="flex-1 t-btn-primary p-3 flex items-center justify-center gap-2">Next <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {step === "MEANING" && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Globe size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--color-txt-white)" }}>What does travel give you?</h2>
                  <p className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>Select up to 2</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {MEANINGS.map(s => {
                  const isSelected = prefs.travelMeanings.includes(s.id);
                  return (
                    <button 
                      key={s.id}
                      onClick={() => toggleMeaning(s.id)}
                      className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all"
                      style={{
                        background: isSelected ? "rgba(45,212,168,0.1)" : "var(--color-bg-deep)",
                        border: `2px solid ${isSelected ? "var(--color-primary)" : "var(--color-line)"}`,
                        color: isSelected ? "var(--color-primary-bright)" : "var(--color-txt-secondary)"
                      }}
                    >
                      <span className="text-2xl">{s.icon}</span>
                      <span className="font-bold text-xs text-center">{s.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep("MOTIVATION")} className="p-3 px-5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors" style={{ color: "var(--color-txt-secondary)" }}>Back</button>
                <button onClick={() => setStep("EXPERIENCE")} className="flex-1 t-btn-primary p-3 flex items-center justify-center gap-2">Next <ChevronRight size={18} /></button>
              </div>
            </div>
          )}

          {step === "EXPERIENCE" && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Map size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--color-txt-white)" }}>Trip Experience</h2>
                  <p className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>How many trips have you been on?</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { id: "FIRST_TIMER", label: "First Timer", desc: "This will be my first!", icon: "🐣" },
                  { id: "FEW", label: "A few trips", desc: "1 to 5 trips", icon: "🎒" },
                  { id: "EXPERIENCED", label: "Experienced", desc: "6 to 15 trips", icon: "🌍" },
                  { id: "SEASONED", label: "Seasoned Explorer", desc: "15+ trips", icon: "🧭" }
                ].map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setPrefs({...prefs, tripExperience: s.id})}
                    className="w-full p-4 rounded-xl flex items-center justify-between transition-all"
                    style={{
                      background: prefs.tripExperience === s.id ? "rgba(45,212,168,0.1)" : "var(--color-bg-deep)",
                      border: `2px solid ${prefs.tripExperience === s.id ? "var(--color-primary)" : "var(--color-line)"}`,
                    }}
                  >
                    <div className="flex gap-3">
                      <span className="text-xl">{s.icon}</span>
                      <div>
                        <div className="font-bold text-left mb-1" style={{ color: prefs.tripExperience === s.id ? "var(--color-primary-bright)" : "var(--color-txt-white)" }}>{s.label}</div>
                        <div className="text-xs text-left" style={{ color: "var(--color-txt-muted)" }}>{s.desc}</div>
                      </div>
                    </div>
                    {prefs.tripExperience === s.id && <Check size={18} color="var(--color-primary)" />}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-10">
                <button onClick={() => setStep("MEANING")} className="p-3 px-5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors" style={{ color: "var(--color-txt-secondary)" }}>Back</button>
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
