"use client";

import { useState, useEffect } from "react";
import { Plane, Users, User, CheckCircle, Ticket, X, MessageSquare, Compass, Loader2, MapPin } from "lucide-react";
import api from "@/lib/api";

type MatchTab = "DISCOVER" | "MUTUAL";

export default function MatchesPage() {
  const [tab, setTab] = useState<MatchTab>("DISCOVER");
  const [matches, setMatches] = useState<any[]>([]);
  const [mutuals, setMutuals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPrefs, setHasPrefs] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const prefsRes = await api.get("/matches/preferences");
      if (prefsRes.status === 204 || !prefsRes.data) {
        setHasPrefs(false);
        setLoading(false);
        return;
      }
      setHasPrefs(true);
      
      const matchesRes = await api.get("/matches");
      setMatches(matchesRes.data);
      
      const mutualsRes = await api.get("/matches/mutual");
      setMutuals(mutualsRes.data);
    } catch (err) {
      console.error("Failed to load matches", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (targetId: string, action: "connect" | "pass") => {
    try {
      await api.post(`/matches/${targetId}/${action}`);
      setMatches(prev => prev.filter(m => m.userId !== targetId));
      
      if (action === "connect") {
        // Optimistically check if it became mutual (backend would normally push this, but we'll re-fetch for safety)
        setTimeout(() => fetchData(), 1000);
      }
    } catch (err) {
      console.error(`Failed to ${action}`, err);
    }
  };

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 size={32} className="animate-spin text-emerald-500" /></div>;
  }

  if (!hasPrefs) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ background: "rgba(45,212,168,0.1)", border: "1px solid rgba(45,212,168,0.2)" }}>
          <Compass size={36} className="text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--color-txt-white)" }}>Complete Your Profile</h1>
        <p className="text-sm max-w-sm mb-6" style={{ color: "var(--color-txt-secondary)" }}>
          You need to complete the travel compatibility quiz in onboarding to see your matches.
        </p>
        <a href="/onboarding" className="t-btn-primary px-6 py-3 rounded-xl flex items-center gap-2">
          Take the Quiz <Plane size={18} />
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-txt-white)" }}>Travel Matches</h1>
          <p className="text-sm" style={{ color: "var(--color-txt-secondary)" }}>Find your perfect companion</p>
        </div>
        
        <div className="flex p-1 rounded-xl" style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-line)" }}>
          <button 
            onClick={() => setTab("DISCOVER")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === "DISCOVER" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
          >
            <div className="flex items-center gap-2">
              <Ticket size={16} /> Discover
            </div>
          </button>
          <button 
            onClick={() => setTab("MUTUAL")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === "MUTUAL" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
          >
            <div className="flex items-center gap-2">
              <Users size={16} /> Mutual
              {mutuals.length > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500 text-black">{mutuals.length}</span>}
            </div>
          </button>
        </div>
      </div>

      {tab === "DISCOVER" && (
        <div className="space-y-6">
          {matches.length === 0 ? (
            <div className="text-center py-20 text-white/40">No more matches found right now. Check back later!</div>
          ) : (
            matches.map(m => (
              <div key={m.userId} className="relative overflow-hidden rounded-3xl transition-all" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}>
                {/* Boarding Pass Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "var(--color-line)", background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm tracking-widest uppercase">
                    <Plane size={16} /> Travyn Boarding Pass
                  </div>
                  <div className="text-xs font-mono text-white/30">ID: {m.userId.split('-')[0].toUpperCase()}</div>
                </div>

                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                  {/* Left Column - Passenger */}
                  <div className="flex-1">
                    <div className="text-xs text-white/40 font-bold mb-2 tracking-widest uppercase">Passenger</div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-white/10 flex-shrink-0 overflow-hidden">
                        {m.profilePhotoUrl ? (
                           <img src={m.profilePhotoUrl} alt={m.firstName} className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-white/20"><User size={24}/></div>
                        )}
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white mb-1">{m.firstName} {m.lastName} {m.age && <span className="text-white/40 text-lg">, {m.age}</span>}</div>
                        <div className="flex items-center gap-1.5 text-xs text-white/60">
                          <CheckCircle size={14} className="text-emerald-500" /> Trust Score: {m.trustScore}
                        </div>
                        {m.locationName && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1">
                            <MapPin size={14} /> 
                            {m.locationName} 
                            {m.distanceInKm !== undefined && m.distanceInKm !== null && ` • ${Math.round(m.distanceInKm)} km away`}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="text-[10px] text-white/40 font-bold mb-1 tracking-widest uppercase">Travel Style</div>
                        <div className="text-sm text-white/80">{m.travelStyles?.join(', ') || 'Flexible'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-white/40 font-bold mb-1 tracking-widest uppercase">Personality</div>
                        <div className="text-sm text-white/80">{m.personalityLabel}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Compatibility */}
                  <div className="md:w-64 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-8 border-dashed" style={{ borderColor: "var(--color-line)" }}>
                    <div className="text-xs text-white/40 font-bold mb-4 tracking-widest uppercase text-center">Compatibility</div>
                    <div className="relative flex items-center justify-center mb-6">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                        <circle cx="48" cy="48" r="40" stroke="var(--color-primary)" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * m.compatibilityScore) / 100} className="transition-all duration-1000 ease-out" />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-white">{m.compatibilityScore}%</span>
                      </div>
                    </div>
                    
                    <div className="w-full space-y-2">
                      <button onClick={() => handleAction(m.userId, "connect")} className="w-full t-btn-primary p-3 flex items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(45,212,168,0.3)]">
                        <Ticket size={16} /> Stamp Passport
                      </button>
                      <button onClick={() => handleAction(m.userId, "pass")} className="w-full p-2 text-xs font-bold text-white/30 hover:text-white/60 transition-colors">
                        Pass
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Expand Toggle */}
                <div 
                  className="w-full p-3 text-center text-xs font-bold text-white/40 hover:text-white/70 hover:bg-white/5 transition-all cursor-pointer border-t" 
                  style={{ borderColor: "var(--color-line)" }}
                  onClick={() => setExpandedId(expandedId === m.userId ? null : m.userId)}
                >
                  {expandedId === m.userId ? "Hide Breakdown" : "View Full Breakdown"}
                </div>
                
                {/* Expanded Details */}
                {expandedId === m.userId && (
                  <div className="p-6 md:p-8 bg-black/20 border-t" style={{ borderColor: "var(--color-line)" }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      {Object.entries({
                        "Travel Style": m.breakdown.travelStyleScore,
                        "Budget": m.breakdown.budgetScore,
                        "Trip Pace": m.breakdown.tripPaceScore,
                        "Motivation": m.breakdown.travelMotivationScore,
                        "Smoking & Drinking": m.breakdown.smokingDrinkingScore,
                        "Accommodation": m.breakdown.accommodationScore,
                        "Planning Style": m.breakdown.planningScore,
                        "Travel Meaning": m.breakdown.travelMeaningScore,
                      }).map(([label, score]) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/60">{label}</span>
                            <span className="text-white/40">{score as number}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${score}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "MUTUAL" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mutuals.length === 0 ? (
            <div className="col-span-2 text-center py-20 text-white/40">You don't have any mutual matches yet.</div>
          ) : (
            mutuals.map(m => (
              <div key={m.userId} className="p-4 rounded-2xl flex items-center gap-4 transition-all" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}>
                <div className="w-14 h-14 rounded-full bg-white/10 flex-shrink-0 overflow-hidden">
                  {m.profilePhotoUrl ? (
                     <img src={m.profilePhotoUrl} alt={m.firstName} className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-white/20"><User size={24}/></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white text-lg">{m.firstName} {m.lastName}</div>
                  <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle size={12} /> Mutual Match
                  </div>
                </div>
                <a href={`/dashboard/messages?user=${m.userId}`} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white">
                  <MessageSquare size={20} />
                </a>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
