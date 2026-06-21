import type { Metadata } from "next";
import "./globals.css";
import { ServerStatusProvider } from "@/context/ServerStatusContext";
import { ThemeProvider } from "@/context/ThemeProvider";
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
      <head>
        {/* Prevent flash of wrong theme (FOWT) — runs before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('travyn-theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <GoogleProvider>
          <ThemeProvider>
            <ServerStatusProvider>{children}</ServerStatusProvider>
          </ThemeProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}
