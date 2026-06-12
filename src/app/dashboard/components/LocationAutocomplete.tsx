"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface LocationResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationAutocompleteProps {
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (name: string, lat: number, lng: number) => void;
  placeholder?: string;
}

export default function LocationAutocomplete({ value = "", onChange, onSelect, placeholder = "e.g., Goa, India" }: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // To prevent fetching when setting from props/selection
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal query state with external value if it changes externally
  useEffect(() => {
    if (!isTyping) {
      setQuery(value);
    }
  }, [value, isTyping]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    if (!isTyping || query.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`);
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Failed to fetch locations:", error);
      } finally {
        setIsLoading(false);
      }
    }, 600); // 600ms debounce to respect Nominatim API rate limits

    return () => clearTimeout(timer);
  }, [query, isTyping]);

  const handleSelect = (result: LocationResult) => {
    setIsTyping(false);
    setQuery(result.display_name);
    if (onChange) onChange(result.display_name);
    if (onSelect) onSelect(result.display_name, parseFloat(result.lat), parseFloat(result.lon));
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-txt-muted)" }} />
      <input
        className="t-input w-full"
        style={{ paddingLeft: 36, paddingRight: 36 }}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setIsTyping(true);
          setQuery(e.target.value);
          if (onChange) onChange(e.target.value);
        }}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
      />
      {isLoading && (
        <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: "var(--color-primary)" }} />
      )}

      {isOpen && results.length > 0 && (
        <div 
          className="absolute z-50 w-full mt-1 py-1 rounded-xl shadow-xl overflow-hidden"
          style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)", top: "100%" }}
        >
          {results.map((result) => (
            <button
              key={result.place_id}
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5 flex items-start gap-3"
              style={{ color: "var(--color-txt-primary)" }}
            >
              <MapPin size={14} className="mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
              <span className="line-clamp-2">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}
      {isOpen && results.length === 0 && !isLoading && query.length >= 3 && (
        <div 
          className="absolute z-50 w-full mt-1 p-3 rounded-xl shadow-xl text-sm text-center"
          style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)", color: "var(--color-txt-muted)", top: "100%" }}
        >
          No places found
        </div>
      )}
    </div>
  );
}
