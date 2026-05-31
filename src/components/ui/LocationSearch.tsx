import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";

interface LocationSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchProps {
  onLocationSelect: (location: { latitude: number; longitude: number; name: string }) => void;
  defaultLocationName?: string;
}

export function LocationSearch({ onLocationSelect, defaultLocationName = "" }: LocationSearchProps) {
  const [query, setQuery] = useState(defaultLocationName);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      searchLocation(query);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const searchLocation = async (searchQuery: string) => {
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&addressdetails=1`);
      const data = await res.json();
      setSuggestions(data);
      setOpen(true);
    } catch (error) {
      console.error("Failed to fetch location", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (suggestion: LocationSuggestion) => {
    // Simplify name (e.g. "Bengaluru, Karnataka, India")
    const parts = suggestion.display_name.split(",");
    const shortName = parts.length >= 3 ? `${parts[0]}, ${parts[parts.length - 1]}` : suggestion.display_name;
    
    setQuery(shortName);
    setOpen(false);
    
    onLocationSelect({
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      name: shortName.trim(),
    });
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          placeholder="Where do you live? (e.g. Bengaluru)"
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500/50"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" size={16} />}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[#1C1C1E] border border-white/10 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 flex items-start gap-3 transition-colors"
            >
              <MapPin className="text-emerald-500 mt-0.5 flex-shrink-0" size={16} />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{suggestion.display_name.split(",")[0]}</div>
                <div className="text-xs text-white/40 truncate">{suggestion.display_name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
