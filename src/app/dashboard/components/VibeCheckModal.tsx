"use client";

import { useState } from "react";
import { Mountain, Crown, Landmark, Compass, Coffee } from "lucide-react";

interface VibeCheckModalProps {
  onSelect: (vibe: string) => void;
}

const vibes = [
  { id: "ADVENTURE", label: "Adventure Seeker", icon: Mountain, color: "#f472b6", gradient: "from-pink-500/20 to-rose-500/5", desc: "Hiking, adrenaline, and exploring the wild." },
  { id: "LUXURY", label: "Luxury Lounger", icon: Crown, color: "#f0a030", gradient: "from-amber-500/20 to-orange-500/5", desc: "Resorts, fine dining, and absolute comfort." },
  { id: "CULTURE", label: "Culture Explorer", icon: Landmark, color: "#a78bfa", gradient: "from-purple-500/20 to-indigo-500/5", desc: "History, museums, and local traditions." },
  { id: "CHILL", label: "Chill & Coffee", icon: Coffee, color: "#2dd4a8", gradient: "from-teal-500/20 to-emerald-500/5", desc: "Cafes, slow travel, and good vibes." },
];

export function VibeCheckModal({ onSelect }: VibeCheckModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => onSelect(id), 500); // Wait for fade out animation
    }, 600); // Wait for the shatter/glow effect to complete
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ${isClosing ? 'opacity-0 scale-110 blur-md' : 'opacity-100'}`}
      style={{ background: "rgba(6, 8, 12, 0.95)", backdropFilter: "blur(16px)" }}
    >
      <div className="max-w-3xl w-full mx-auto text-center space-y-8 animate-in slide-in-from-bottom-8 duration-700">
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 bg-white/5 border border-white/10">
            <Compass size={32} className="text-white animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            What's your travel vibe?
          </h1>
          <p className="text-lg text-gray-400 max-w-lg mx-auto">
            Choose your style to instantly unlock perfect matches and tailored adventures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vibes.map(({ id, label, icon: Icon, color, gradient, desc }) => {
            const isSelected = selected === id;
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                disabled={selected !== null}
                className={`group relative overflow-hidden p-6 rounded-3xl text-left transition-all duration-500 ${
                  isSelected 
                    ? "scale-[1.02] ring-2 ring-white/50 shadow-2xl" 
                    : selected !== null 
                      ? "opacity-30 scale-95 blur-sm" 
                      : "hover:-translate-y-2 hover:shadow-xl"
                }`}
                style={{ 
                  background: isSelected ? `rgba(255,255,255,0.1)` : "var(--color-bg-deep)",
                  border: `1px solid ${isSelected ? color : "var(--color-line)"}`,
                  boxShadow: isSelected ? `0 0 40px ${color}40` : "none"
                }}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isSelected ? 'opacity-100' : ''}`} />
                
                {/* Content */}
                <div className="relative z-10 flex items-start gap-4">
                  <div 
                    className="p-4 rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                    style={{ background: `${color}15`, color: color }}
                  >
                    <Icon size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{label}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                  </div>
                </div>

                {/* Selection Ripple Effect */}
                {isSelected && (
                  <div 
                    className="absolute inset-0 rounded-3xl pointer-events-none animate-ping"
                    style={{ border: `2px solid ${color}`, opacity: 0.5, animationDuration: '1s' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
