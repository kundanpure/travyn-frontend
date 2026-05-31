"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type ServerStatus = "unknown" | "up" | "down";

interface ServerStatusContextValue {
  status: ServerStatus;
}

const ServerStatusContext = createContext<ServerStatusContextValue>({
  status: "unknown",
});

export function ServerStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<ServerStatus>("unknown");
  // Use a ref so the poll loop always reads the latest status without
  // causing the effect to restart.
  const statusRef = useRef<ServerStatus>("unknown");

  useEffect(() => {
    let cancelled = false;

    const ping = async (): Promise<void> => {
      if (cancelled) return;

      try {
        const res = await fetch("/api/health", {
          method: "GET",
          cache: "no-store",
          // 7-second timeout: Vercel→Render cold start can take a while
          signal: AbortSignal.timeout(7000),
        });

        if (cancelled) return;

        if (res.ok) {
          const data: { status: string } = await res.json();
          if (data.status === "UP") {
            statusRef.current = "up";
            setStatus("up");
            return; // ✅ Server is up — stop polling
          }
        }

        // Got a response but server is not up yet
        statusRef.current = "down";
        setStatus("down");
      } catch {
        // Timeout or network error — server still waking
        if (!cancelled) {
          statusRef.current = "down";
          setStatus("down");
        }
      }

      // Try again in 4 seconds if still not up
      if (!cancelled && statusRef.current !== "up") {
        setTimeout(() => ping(), 4000);
      }
    };

    // Start pinging immediately when the app loads
    ping();

    return () => {
      cancelled = true;
    };
  }, []); // ← empty deps: runs exactly once on mount, never restarts

  return (
    <ServerStatusContext.Provider value={{ status }}>
      {children}
    </ServerStatusContext.Provider>
  );
}

export function useServerStatus(): ServerStatusContextValue {
  return useContext(ServerStatusContext);
}
