import type { Metadata } from "next";
import "./globals.css";
import { ServerStatusProvider } from "@/context/ServerStatusContext";
import GoogleProvider from "@/context/GoogleProvider";

export const metadata: Metadata = {
  title: "Travyn — Trusted Solo Travel Network",
  description:
    "The world's first trusted network for solo travelers. Find verified companions, share adventures, and stay safe with multi-layer identity verification and AI-powered matching.",
  keywords: [
    "solo travel",
    "travel companions",
    "trusted travel",
    "verified travelers",
    "travel safety",
    "group trips",
  ],
  openGraph: {
    title: "Travyn — Travel Together. Trust Verified.",
    description:
      "Find verified travel companions. Share safe adventures. Build lasting connections.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        {/* ServerStatusProvider silently pings the backend on app load
            so Render wakes up before the user even clicks anything.
            Login + Register pages read from this context to show
            the mini-game if the user tries to submit before server is ready. */}
        <GoogleProvider>
          <ServerStatusProvider>{children}</ServerStatusProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}
