"use client";

import { useState, useEffect } from "react";
import { Plane, Users, User, CheckCircle, Ticket, X, MessageSquare, Compass, Loader2, MapPin, AlertTriangle } from "lucide-react";
import VerifiedBadge from "../components/VerifiedBadge";
import UnverifiedBadge from "../components/UnverifiedBadge";
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
        setTimeout(() => fetchData(), 1000);
      }
    } catch (err) {
      console.error(`Failed to ${action}`, err);
    }
  };

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 size={32} className="animate-spin" style={{ color: "var(--brand)" }} /></div>;
  }

  if (!hasPrefs) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ background: "var(--brand-light)", border: "1px solid var(--border)" }}>
          <Compass size={36} style={{ color: "var(--brand)" }} />
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Complete Your Profile</h1>
        <p className="text-sm max-w-sm mb-6" style={{ color: "var(--text-secondary)" }}>
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
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Travel Matches</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Find your perfect companion</p>
        </div>
        
        <div className="flex p-1 rounded-xl" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
          <button 
            onClick={() => setTab("DISCOVER")}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              background: tab === "DISCOVER" ? "var(--brand-light)" : "transparent",
              color: tab === "DISCOVER" ? "var(--brand)" : "var(--text-muted)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <div className="flex items-center gap-2">
              <Ticket size={16} /> Discover
            </div>
          </button>
          <button 
            onClick={() => setTab("MUTUAL")}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              background: tab === "MUTUAL" ? "var(--brand-light)" : "transparent",
              color: tab === "MUTUAL" ? "var(--brand)" : "var(--text-muted)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <div className="flex items-center gap-2">
              <Users size={16} /> Mutual
              {mutuals.length > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "var(--brand)", color: "white" }}>{mutuals.length}</span>}
            </div>
          </button>
        </div>
      </div>

      {tab === "DISCOVER" && (
        <div className="space-y-6">
          {matches.length === 0 ? (
            <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>No more matches found right now. Check back later!</div>
          ) : (
            matches.map(m => (
              <div key={m.userId} className="relative overflow-hidden rounded-2xl transition-all" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                {/* Boarding Pass Header */}
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-tertiary)" }}>
                  <div className="flex items-center gap-2 font-bold text-sm tracking-widest uppercase" style={{ color: "var(--brand)" }}>
                    <Plane size={16} /> Travyn Boarding Pass
                  </div>
                  <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>ID: {m.userId.split('-')[0].toUpperCase()}</div>
                </div>

                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                  {/* Left Column - Passenger */}
                  <div className="flex-1">
                    <div className="text-xs font-bold mb-2 tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Passenger</div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full flex-shrink-0 overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                        {m.profilePhotoUrl ? (
                           <img src={m.profilePhotoUrl} alt={m.firstName} className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--text-muted)" }}><User size={24}/></div>
                        )}
                      </div>
                      <div>
                        <div className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                          {m.firstName} {m.lastName}
                          {m.age && <span className="text-lg ml-1" style={{ color: "var(--text-muted)" }}>, {m.age}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                          {m.verified ? (
                            <VerifiedBadge size={13} />
                          ) : (
                            <AlertTriangle size={13} style={{ color: "#fbbf24" }} />
                          )}
                          <span style={{ color: m.verified ? "var(--brand)" : "#fbbf24" }}>
                            {m.verified ? "Verified" : "Identity Pending"}
                          </span>
                          <span style={{ color: "var(--text-muted)" }}>•</span>
                          Trust Score: {m.trustScore}
                        </div>
                        {m.locationName && (
                          <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: "var(--brand)" }}>
                            <MapPin size={14} /> 
                            {m.locationName} 
                            {m.distanceInKm !== undefined && m.distanceInKm !== null && ` • ${Math.round(m.distanceInKm)} km away`}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="text-[10px] font-bold mb-1 tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Travel Style</div>
                        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{m.travelStyles?.join(', ') || 'Flexible'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold mb-1 tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Personality</div>
                        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{m.personalityLabel}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Compatibility */}
                  <div className="md:w-64 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-8 border-dashed" style={{ borderColor: "var(--border)" }}>
                    <div className="text-xs font-bold mb-4 tracking-widest uppercase text-center" style={{ color: "var(--text-muted)" }}>Compatibility</div>
                    <div className="relative flex items-center justify-center mb-6">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="var(--bg-tertiary)" strokeWidth="8" fill="none" />
                        <circle cx="48" cy="48" r="40" stroke="var(--brand)" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * m.compatibilityScore) / 100} className="transition-all duration-1000 ease-out" />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{m.compatibilityScore}%</span>
                      </div>
                    </div>
                    
                    <div className="w-full space-y-2">
                      <button onClick={() => handleAction(m.userId, "connect")} className="w-full t-btn-primary p-3 flex items-center justify-center gap-2 rounded-xl text-sm font-bold">
                        <Ticket size={16} /> Stamp Passport
                      </button>
                      <button
                        onClick={() => handleAction(m.userId, "pass")}
                        className="w-full p-2 text-xs font-bold transition-colors"
                        style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                      >
                        Pass
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Expand Toggle */}
                <div 
                  className="w-full p-3 text-center text-xs font-bold transition-all cursor-pointer" 
                  style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}
                  onClick={() => setExpandedId(expandedId === m.userId ? null : m.userId)}
                >
                  {expandedId === m.userId ? "Hide Breakdown" : "View Full Breakdown"}
                </div>
                
                {/* Expanded Details */}
                {expandedId === m.userId && (
                  <div className="p-6 md:p-8" style={{ background: "var(--bg-tertiary)", borderTop: "1px solid var(--border)" }}>
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
                            <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                            <span style={{ color: "var(--text-muted)" }}>{score as number}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-primary)" }}>
                            <div className="h-full rounded-full" style={{ width: `${score}%`, background: "var(--brand)" }} />
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
            <div className="col-span-2 text-center py-20" style={{ color: "var(--text-muted)" }}>You don&apos;t have any mutual matches yet.</div>
          ) : (
            mutuals.map(m => (
              <div key={m.userId} className="p-4 rounded-2xl flex items-center gap-4 transition-all" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                  {m.profilePhotoUrl ? (
                     <img src={m.profilePhotoUrl} alt={m.firstName} className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--text-muted)" }}><User size={24}/></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    {m.firstName} {m.lastName}
                    {m.verified ? <VerifiedBadge size={14} /> : <UnverifiedBadge size={14} />}
                  </div>
                  <div className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--brand)" }}>
                    <CheckCircle size={12} /> Mutual Match
                  </div>
                </div>
                <a
                  href={`/dashboard/messages?partnerId=${m.userId}`}
                  className="p-3 rounded-xl transition-colors"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                >
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
