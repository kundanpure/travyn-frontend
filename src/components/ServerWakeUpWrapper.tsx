"use client";

import { useState } from "react";
import ServerWakeUp from "./ServerWakeUp";

/**
 * Mounts on every page load and immediately pings the backend.
 * If the backend is sleeping, shows the mini-game overlay automatically.
 * Once the backend responds, dismisses itself silently.
 */
export default function ServerWakeUpWrapper() {
  const [serverReady, setServerReady] = useState(false);

  if (serverReady) return null;

  return <ServerWakeUp onServerReady={() => setServerReady(true)} />;
}
