"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";

export default function ThemeToggle({ size = 20 }: { size?: number }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      style={{
        background: "none",
        border: `1.5px solid var(--border)`,
        cursor: "pointer",
        padding: 8,
        borderRadius: "var(--radius)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-secondary)",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--brand)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
      }}
    >
      {theme === "light" ? <Moon size={size} /> : <Sun size={size} />}
    </button>
  );
}
