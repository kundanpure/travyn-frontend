"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import {
  Shield,
  Users,
  MapPin,
  Star,
  Heart,
  Compass,
  ChevronRight,
  CheckCircle2,
  Menu,
  X,
  Zap,
  Globe,
  Lock,
  ArrowRight,
  Sparkles,
  Eye,
  MessageCircle,
  TrendingUp,
  Map,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Scroll-Reveal Wrapper
   ═══════════════════════════════════════════════════════════════ */
function Reveal({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right" | "scale";
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(el);
          }
        },
        { threshold: 0.05, rootMargin: "50px" }
      );
      observer.observe(el);
      
      const fallbackTimer = setTimeout(() => setVisible(true), 1500);
      return () => {
        observer.disconnect();
        clearTimeout(fallbackTimer);
      };
    } catch {
      setTimeout(() => setVisible(true), 0);
    }
  }, []);

  const transforms: Record<string, string> = {
    up: "translateY(50px)",
    left: "translateX(-40px)",
    right: "translateX(40px)",
    scale: "scale(0.92)",
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : transforms[direction],
        transition: `all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Animated Counter
   ═══════════════════════════════════════════════════════════════ */
function AnimatedCounter({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const duration = 2000;
            const startTime = performance.now();
            const animate = (now: number) => {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - (1 - progress) * (1 - progress);
              setCount(Math.round(eased * target));
              if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
          }
        },
        { threshold: 0.1, rootMargin: "50px" }
      );
      observer.observe(el);

      const fallbackTimer = setTimeout(() => {
        if (!started.current) {
          started.current = true;
          setCount(target);
        }
      }, 2000);

      return () => {
        observer.disconnect();
        clearTimeout(fallbackTimer);
      };
    } catch {
      setTimeout(() => setCount(target), 0);
    }
  }, [target]);

  return (
    <span ref={ref} style={{ fontFamily: "var(--font-family-display)", fontWeight: 800 }}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */
const FEATURES = [
  {
    icon: Shield,
    title: "Verified Identity",
    desc: "Multi-layer trust verification — Government ID, social proof, and peer reviews build a comprehensive trust score.",
    accent: false,
  },
  {
    icon: Zap,
    title: "Smart Matching",
    desc: "AI-powered compatibility engine matches you with travelers who share your style, budget, and vibe.",
    accent: true,
  },
  {
    icon: Lock,
    title: "Safety Toolkit",
    desc: "Live location sharing, one-tap SOS alerts, and 24/7 emergency support — safety is non-negotiable.",
    accent: false,
  },
  {
    icon: Users,
    title: "Group Adventures",
    desc: "Create or join curated trips with 2–12 verified companions. Collaborate on plans, split costs effortlessly.",
    accent: true,
  },
  {
    icon: Star,
    title: "Reputation System",
    desc: "Mutual reviews after every trip. Build a verified travel reputation that opens doors worldwide.",
    accent: false,
  },
  {
    icon: Heart,
    title: "Women-Safe Spaces",
    desc: "Verified women-only trips and communities with enhanced trust requirements for maximum comfort.",
    accent: true,
  },
];

const STEPS = [
  {
    icon: Eye,
    title: "Create & Verify",
    desc: "Sign up, verify your identity, and build your travel profile with preferences, personality, and past adventures.",
  },
  {
    icon: Compass,
    title: "Discover & Match",
    desc: "Browse curated trips or let our AI find compatible companions perfectly matched to your travel style.",
  },
  {
    icon: Map,
    title: "Travel & Grow",
    desc: "Journey together with live safety features. Rate your experience and build your trusted traveler reputation.",
  },
];

const TESTIMONIALS = [
  {
    name: "Become a Founding Member",
    location: "Your next destination",
    text: "We are currently in private beta! Join today, verify your profile with Aadhaar, and be the first to share your solo travel story right here.",
    initials: "T1",
    gradient: "linear-gradient(135deg, #2dd4a8, #1fae8a)",
  },
  {
    name: "Share Your Journey",
    location: "Anywhere in the world",
    text: "The best travel stories haven't been written yet. Match with verified companions and tell us how your trip went. Your review could be here.",
    initials: "T2",
    gradient: "linear-gradient(135deg, #f0a030, #d08c28)",
  },
  {
    name: "Help Us Build",
    location: "Community Driven",
    text: "Travyn is built by travelers, for travelers. Give us feedback on the matchmaking experience and help shape the future of safe solo travel.",
    initials: "T3",
    gradient: "linear-gradient(135deg, #818cf8, #6366f1)",
  },
];

const SAFETY_ITEMS = [
  "Government ID with liveness check",
  "Dynamic TrustScore™ system",
  "Real-time live location sharing",
  "One-tap SOS emergency alerts",
  "Mutual peer review system",
  "Women-only verified spaces",
  "AI fraud & fake profile detection",
  "24/7 Trust & Safety team",
];

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div style={{ background: "var(--color-bg-deep)", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ════════════════════ NAVBAR ════════════════════ */}
      <nav
        className={scrolled ? "t-glass-strong" : ""}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: scrolled ? "12px 0" : "20px 0",
          transition: "all 0.4s ease",
        }}
      >
        <div className="t-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))",
                boxShadow: "0 0 20px rgba(45, 212, 168, 0.25)",
              }}
            >
              <Compass size={20} color="#06080c" />
            </div>
            <span style={{ fontFamily: "var(--font-family-display)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-txt-white)" }}>
              Travyn
            </span>
          </Link>

          {/* Desktop links */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }} className="hidden md:flex">
            {["Features", "Safety", "How It Works", "Stories"].map((label) => (
              <a key={label} href={`#${label.toLowerCase().replace(/\s+/g, "-")}`} className="t-nav-link">
                {label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }} className="hidden md:flex">
            <Link href="/login" className="t-btn-ghost">Sign In</Link>
            <Link href="/register" className="t-btn-primary" style={{ padding: "10px 24px", fontSize: "0.85rem" }}>
              Get Started <ArrowRight size={15} />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ padding: 8, background: "none", border: "none", cursor: "pointer", color: "var(--color-txt-secondary)" }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="md:hidden t-glass-strong"
            style={{
              margin: "12px 16px 0",
              borderRadius: 16,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              animation: "fade-in-up 0.3s ease",
            }}
          >
            {["Features", "Safety", "How It Works", "Stories"].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  color: "var(--color-txt-secondary)",
                  textDecoration: "none",
                }}
              >
                {label}
              </a>
            ))}
            <div style={{ borderTop: "1px solid var(--color-line)", marginTop: 8, paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/login" className="t-btn-ghost" style={{ justifyContent: "center", width: "100%" }} onClick={() => setMenuOpen(false)}>
                Sign In
              </Link>
              <Link href="/register" className="t-btn-primary" style={{ width: "100%" }} onClick={() => setMenuOpen(false)}>
                Get Started <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ════════════════════ HERO ════════════════════ */}
      <section className="t-hero-mesh" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        {/* Orbs */}
        <div className="t-orb t-orb-primary" style={{ width: 500, height: 500, top: "-10%", left: "-5%" }} />
        <div className="t-orb t-orb-accent" style={{ width: 400, height: 400, bottom: "5%", right: "-5%" }} />
        <div className="t-orb t-orb-primary" style={{ width: 300, height: 300, top: "50%", right: "20%", opacity: 0.3 }} />

        {/* Grid overlay */}
        <div className="t-grid-pattern" style={{ position: "absolute", inset: 0, opacity: 0.4 }} />

        {/* Spinning rings — uses .t-spin-ring class for proper mobile handling */}
        <div
          className="t-spin-ring"
          style={{
            width: 600,
            height: 600,
            border: "1px solid rgba(45, 212, 168, 0.06)",
          }}
        />
        <div
          className="t-spin-ring"
          style={{
            width: 800,
            height: 800,
            border: "1px dashed rgba(240, 160, 48, 0.04)",
            animationDuration: "35s",
            animationDirection: "reverse",
          }}
        />

        {/* Content */}
        <div className="t-container" style={{ position: "relative", zIndex: 10, textAlign: "center", paddingTop: "clamp(80px, 15vw, 112px)", paddingBottom: "clamp(48px, 10vw, 80px)" }}>
          <Reveal delay={100}>
            <div className="t-badge t-badge-primary" style={{ marginBottom: 32 }}>
              <Sparkles size={14} />
              <span>The Trusted Solo Travel Network</span>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <h1
              className="t-gradient-text-hero"
              style={{
                fontFamily: "var(--font-family-display)",
                fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
                fontWeight: 900,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                marginBottom: 24,
              }}
            >
              Travel Together.
              <br />
              Trust Verified.
            </h1>
          </Reveal>

          <Reveal delay={350}>
            <p style={{ maxWidth: 540, margin: "0 auto 40px", color: "var(--color-txt-secondary)", fontSize: "1.15rem", lineHeight: 1.7 }}>
              Find verified companions. Share unforgettable adventures.
              Stay safe with multi-layer identity verification and AI-powered matching.
            </p>
          </Reveal>

          <Reveal delay={500}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <Link href="/register" className="t-btn-primary" style={{ padding: "16px 36px", fontSize: "1.05rem" }}>
                Start Your Journey <ChevronRight size={20} />
              </Link>
              <a href="#how-it-works" className="t-btn-outline" style={{ padding: "16px 36px", fontSize: "1.05rem" }}>
                See How It Works
              </a>
            </div>
          </Reveal>

          {/* Social proof */}
          <Reveal delay={650}>
            <div style={{ marginTop: 56, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 24, color: "var(--color-txt-muted)", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex" }}>
                  {["#2dd4a8", "#f0a030", "#818cf8", "#f472b6"].map((bg, i) => (
                    <div
                      key={i}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        background: bg,
                        color: "#0a0f18",
                        border: "2px solid var(--color-bg-deep)",
                        marginLeft: i > 0 ? -8 : 0,
                      }}
                    >
                      {["S", "A", "M", "K"][i]}
                    </div>
                  ))}
                </div>
                <span>Join our early beta testers</span>
              </div>
              <span style={{ color: "var(--color-line-hover)" }} className="hidden sm:inline">|</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="#f0a030" color="#f0a030" />
                ))}
                <span style={{ marginLeft: 4 }}>100% Aadhaar Verified</span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Bottom gradient fade */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, background: "linear-gradient(transparent, var(--color-bg-deep))", pointerEvents: "none" }} />
      </section>

      {/* ════════════════════ STATS ════════════════════ */}
      <section style={{ padding: "80px 0", background: "var(--color-bg-deep)" }}>
        <div className="t-container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }} className="md:!grid-cols-4">
            {[
              { target: 50, suffix: "+", label: "Destinations to Explore", Icon: MapPin },
              { target: 1, suffix: "-Tap", label: "SOS Alerts", Icon: Shield },
              { target: 100, suffix: "%", label: "Aadhaar Verified Travelers", Icon: Users },
              { target: 0, suffix: " Tolerance", label: "For Fake Profiles", Icon: Lock },
            ].map(({ target, suffix, label, Icon }, i) => (
              <Reveal key={label} delay={i * 100}>
                <div className="t-stat-card">
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                      background: i % 2 === 0 ? "rgba(45, 212, 168, 0.08)" : "rgba(240, 160, 48, 0.06)",
                      color: i % 2 === 0 ? "var(--color-primary)" : "var(--color-accent)",
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", color: "var(--color-txt-white)" }}>
                    <AnimatedCounter target={target} suffix={suffix} />
                  </div>
                  <p style={{ marginTop: 8, fontSize: "0.85rem", color: "var(--color-txt-muted)" }}>{label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="t-divider" />

      {/* ════════════════════ FEATURES ════════════════════ */}
      <section id="features" style={{ padding: "96px 0", background: "var(--color-bg-deep)" }}>
        <div className="t-container">
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div className="t-badge t-badge-primary" style={{ marginBottom: 20 }}>
                <Zap size={13} />
                <span>Platform Features</span>
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-family-display)",
                  fontSize: "clamp(2rem, 4.5vw, 3rem)",
                  fontWeight: 800,
                  color: "var(--color-txt-white)",
                  letterSpacing: "-0.02em",
                  marginBottom: 16,
                }}
              >
                Everything You Need to Travel{" "}
                <span className="t-gradient-text">Safely</span>
              </h2>
              <p style={{ maxWidth: 480, margin: "0 auto", color: "var(--color-txt-secondary)", fontSize: "1.05rem" }}>
                Built from the ground up with trust, safety, and real human connection at its core.
              </p>
            </div>
          </Reveal>

          <div
            style={{ display: "grid", gap: 20 }}
            className="md:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="t-card" style={{ height: "100%", cursor: "default" }}>
                  <div className={f.accent ? "t-icon-box t-icon-box-accent" : "t-icon-box t-icon-box-primary"} style={{ marginBottom: 20 }}>
                    <f.icon size={24} />
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-family-display)",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "var(--color-txt-white)",
                      marginBottom: 8,
                    }}
                  >
                    {f.title}
                  </h3>
                  <p style={{ color: "var(--color-txt-secondary)", fontSize: "0.9rem", lineHeight: 1.7 }}>
                    {f.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ HOW IT WORKS ════════════════════ */}
      <section id="how-it-works" style={{ padding: "96px 0", background: "var(--color-bg-base)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, var(--color-line-hover), transparent)" }} />

        <div className="t-container" style={{ position: "relative", zIndex: 10 }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div className="t-badge t-badge-accent" style={{ marginBottom: 20 }}>
                <TrendingUp size={13} />
                <span>How It Works</span>
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-family-display)",
                  fontSize: "clamp(2rem, 4.5vw, 3rem)",
                  fontWeight: 800,
                  color: "var(--color-txt-white)",
                  letterSpacing: "-0.02em",
                }}
              >
                Three Steps to Your Next{" "}
                <span className="t-gradient-text">Adventure</span>
              </h2>
            </div>
          </Reveal>

          <div style={{ display: "grid", gap: 32, position: "relative" }} className="md:grid-cols-3">
            {/* Connecting line */}
            <div
              className="hidden md:block"
              style={{
                position: "absolute",
                top: 52,
                left: "20%",
                right: "20%",
                height: 1,
                background: "linear-gradient(90deg, var(--color-primary), var(--color-accent), var(--color-primary))",
                opacity: 0.3,
              }}
            />

            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 150}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  {/* Circle */}
                  <div style={{ position: "relative", width: 104, height: 104, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, background: "var(--color-bg-surface)", border: "2px solid var(--color-line)" }}>
                    <div className="animate-pulse-glow" style={{ position: "absolute", inset: -3, borderRadius: "50%", border: "1px solid transparent" }} />
                    <div style={{ width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))", boxShadow: "0 0 30px rgba(45, 212, 168, 0.25)" }}>
                      <step.icon size={28} color="#06080c" />
                    </div>
                    <div style={{ position: "absolute", top: -4, right: -4, width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, background: "var(--color-accent)", color: "#06080c", boxShadow: "0 0 15px rgba(240, 160, 48, 0.3)" }}>
                      {i + 1}
                    </div>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-family-display)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-txt-white)", marginBottom: 12 }}>
                    {step.title}
                  </h3>
                  <p style={{ maxWidth: 280, margin: "0 auto", color: "var(--color-txt-secondary)", fontSize: "0.9rem", lineHeight: 1.7 }}>
                    {step.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ SAFETY ════════════════════ */}
      <section id="safety" style={{ padding: "96px 0", background: "var(--color-bg-deep)" }}>
        <div className="t-container">
          <div style={{ display: "grid", gap: 48, alignItems: "center" }} className="lg:grid-cols-2">
            {/* Left — Copy */}
            <Reveal direction="left">
              <div>
                <div className="t-badge t-badge-primary" style={{ marginBottom: 20 }}>
                  <Shield size={13} />
                  <span>Safety First</span>
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-family-display)",
                    fontSize: "clamp(2rem, 4vw, 2.8rem)",
                    fontWeight: 800,
                    color: "var(--color-txt-white)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.15,
                    marginBottom: 20,
                  }}
                >
                  Your Safety Is Our{" "}
                  <span className="t-gradient-text">Foundation</span>
                </h2>
                <p style={{ color: "var(--color-txt-secondary)", fontSize: "1.05rem", lineHeight: 1.7, marginBottom: 32 }}>
                  Every feature we build starts with one question:{" "}
                  <em>does this make our travelers safer?</em> From ID verification to live
                  tracking, safety runs through our DNA.
                </p>
                <Link href="/register" className="t-btn-primary" style={{ padding: "14px 30px" }}>
                  Join the Safe Network <ArrowRight size={16} />
                </Link>
              </div>
            </Reveal>

            {/* Right — Checklist */}
            <Reveal direction="right" delay={150}>
              <div
                style={{
                  borderRadius: 20,
                  padding: 32,
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-line)",
                  boxShadow: "0 0 80px rgba(45, 212, 168, 0.05)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {SAFETY_ITEMS.map((text, i) => (
                    <div key={i} className="t-check-row" style={{ background: i % 2 === 0 ? "rgba(45, 212, 168, 0.04)" : "transparent" }}>
                      <CheckCircle2 size={20} color="#2dd4a8" style={{ flexShrink: 0 }} />
                      <span style={{ color: "var(--color-txt-primary)", fontSize: "0.92rem", fontWeight: 500 }}>
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="t-divider" />

      {/* ════════════════════ TESTIMONIALS ════════════════════ */}
      <section id="stories" style={{ padding: "96px 0", background: "var(--color-bg-deep)" }}>
        <div className="t-container">
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div className="t-badge t-badge-accent" style={{ marginBottom: 20 }}>
                <MessageCircle size={13} />
                <span>Traveler Stories</span>
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-family-display)",
                  fontSize: "clamp(2rem, 4.5vw, 3rem)",
                  fontWeight: 800,
                  color: "var(--color-txt-white)",
                  letterSpacing: "-0.02em",
                }}
              >
                Trusted by Travelers{" "}
                <span className="t-gradient-text">Worldwide</span>
              </h2>
            </div>
          </Reveal>

          <div style={{ display: "grid", gap: 24 }} className="md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 120}>
                <div className="t-card" style={{ height: "100%", display: "flex", flexDirection: "column", padding: 32 }}>
                  {/* Stars */}
                  <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={16} fill="#f0a030" color="#f0a030" />
                    ))}
                  </div>
                  {/* Quote */}
                  <p style={{ flex: 1, color: "var(--color-txt-secondary)", fontSize: "0.95rem", lineHeight: 1.8, fontStyle: "italic", marginBottom: 24 }}>
                    &ldquo;{t.text}&rdquo;
                  </p>
                  {/* Author */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 20, borderTop: "1px solid var(--color-line)" }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        background: t.gradient,
                        color: "#06080c",
                      }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-txt-white)" }}>{t.name}</p>
                      <p style={{ fontSize: "0.78rem", color: "var(--color-txt-muted)" }}>{t.location}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ CTA ════════════════════ */}
      <section style={{ padding: "112px 0", position: "relative", overflow: "hidden" }}>
        <div className="t-orb t-orb-primary" style={{ width: 500, height: 500, top: "-30%", left: "10%" }} />
        <div className="t-orb t-orb-accent" style={{ width: 400, height: 400, bottom: "-20%", right: "10%" }} />
        <div className="t-grid-pattern" style={{ position: "absolute", inset: 0, opacity: 0.3 }} />

        <div className="t-container" style={{ position: "relative", zIndex: 10 }}>
          <Reveal direction="scale">
            <div
              style={{
                borderRadius: 24,
                padding: "clamp(40px, 6vw, 64px)",
                textAlign: "center",
                background: "linear-gradient(135deg, var(--color-bg-surface), var(--color-bg-elevated))",
                border: "1px solid var(--color-line-hover)",
                boxShadow: "0 0 100px rgba(45, 212, 168, 0.06), 0 40px 80px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div className="t-badge t-badge-primary" style={{ marginBottom: 24 }}>
                <Globe size={13} />
                <span>Start Free Today</span>
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-family-display)",
                  fontSize: "clamp(2rem, 5vw, 3.2rem)",
                  fontWeight: 800,
                  color: "var(--color-txt-white)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                  marginBottom: 20,
                }}
              >
                Ready to Find Your Travel{" "}
                <span className="t-gradient-text">Tribe</span>?
              </h2>
              <p style={{ maxWidth: 480, margin: "0 auto 40px", color: "var(--color-txt-secondary)", fontSize: "1.1rem", lineHeight: 1.7 }}>
                Join thousands of verified solo travelers already exploring the world together, safely and confidently.
              </p>
              <Link href="/register" className="t-btn-primary" style={{ padding: "16px clamp(24px, 5vw, 42px)", fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)" }}>
                Start Your Journey — Free <ArrowRight size={20} />
              </Link>
              <p style={{ marginTop: 24, fontSize: "0.85rem", color: "var(--color-txt-dim)" }}>
                No credit card required · Free identity verification · Cancel anytime
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer style={{ padding: "64px 0", background: "var(--color-bg-base)", borderTop: "1px solid var(--color-line)" }}>
        <div className="t-container">
          <div style={{ display: "grid", gap: 40, marginBottom: 48 }} className="md:grid-cols-5">
            {/* Brand */}
            <div className="md:col-span-2">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))" }}>
                  <Compass size={17} color="#06080c" />
                </div>
                <span style={{ fontFamily: "var(--font-family-display)", fontSize: "1.1rem", fontWeight: 700, color: "var(--color-txt-white)" }}>
                  Travyn
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", maxWidth: 280, color: "var(--color-txt-muted)", lineHeight: 1.7, marginBottom: 20 }}>
                The world&apos;s most trusted platform for solo travelers to connect,
                plan, and explore together — safely.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {["T", "I", "L"].map((letter) => (
                  <a key={letter} href="#" className="t-social-btn">{letter}</a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              { heading: "Product", items: ["Features", "Safety", "Pricing", "FAQ"] },
              { heading: "Company", items: ["About", "Blog", "Careers", "Contact"] },
              { heading: "Legal", items: ["Privacy", "Terms", "Cookies"] },
            ].map(({ heading, items }) => (
              <div key={heading}>
                <h4 style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-txt-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
                  {heading}
                </h4>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                  {items.map((item) => (
                    <li key={item}>
                      <a href="#" style={{ fontSize: "0.9rem", color: "var(--color-txt-secondary)", textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-txt-white)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-txt-secondary)")}
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom */}
          <div style={{ paddingTop: 32, borderTop: "1px solid var(--color-line)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <p style={{ fontSize: "0.85rem", color: "var(--color-txt-dim)" }}>
              &copy; {new Date().getFullYear()} Travyn. All rights reserved.
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--color-txt-dim)", display: "flex", alignItems: "center", gap: 4 }}>
              Made with <Heart size={12} color="#f87171" /> for solo travelers worldwide
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
