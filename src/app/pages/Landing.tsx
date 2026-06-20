import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Cpu, Zap, TrendingUp, Shield, BarChart2, Globe, ChevronRight,
  CheckCircle, Star, ArrowRight, Activity, Lock,
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Instant AI Scan",
    desc: "Upload any chart screenshot — TradingView, MT4, MT5 — and get a full trade analysis in under 4 seconds.",
  },
  {
    icon: TrendingUp,
    title: "Trend & Structure",
    desc: "Automatically detects market bias, BOS, CHoCH, and higher-timeframe trend alignment.",
  },
  {
    icon: BarChart2,
    title: "Smart Levels",
    desc: "Entry, Stop Loss, and three Take Profit levels calculated from key support, resistance, and liquidity zones.",
  },
  {
    icon: Shield,
    title: "Risk Assessment",
    desc: "Confluence scoring across trend strength, pattern quality, and momentum. Fakeout risk detection included.",
  },
  {
    icon: Activity,
    title: "Candlestick AI",
    desc: "Recognizes 14+ candlestick formations including Engulfing, Pin Bars, Morning Stars, and Flags.",
  },
  {
    icon: Globe,
    title: "All Major Pairs",
    desc: "Works on Forex majors, gold, indices, crypto, and any market with a visible chart.",
  },
];

const PLANS = [
  {
    name: "FREE",
    price: "$0",
    period: "",
    desc: "Get started with AI chart analysis.",
    scans: "5 scans / month",
    features: ["Chart upload & scan", "Basic pattern detection", "Entry / SL / TP levels", "Confidence score"],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "PRO",
    price: "$29",
    period: "/ mo",
    desc: "For serious retail traders.",
    scans: "200 scans / month",
    features: ["Everything in Free", "Advanced confluence scoring", "Fakeout & liquidity detection", "Scan history & export", "Priority processing"],
    cta: "Start Pro Trial",
    highlight: true,
  },
  {
    name: "ELITE",
    price: "$79",
    period: "/ mo",
    desc: "For prop firm traders & professionals.",
    scans: "Unlimited scans",
    features: ["Everything in Pro", "Multi-timeframe confirmation", "Custom pair watchlists", "API access", "Dedicated support"],
    cta: "Go Elite",
    highlight: false,
  },
];

const STEPS = [
  { n: "01", title: "Upload Your Chart", desc: "Drop any screenshot of a Forex chart — any broker, any platform." },
  { n: "02", title: "AI Scans Instantly", desc: "The ROBOCOP engine analyses structure, patterns, and key levels in seconds." },
  { n: "03", title: "Get Your Signal", desc: "Receive a Buy / Sell / No Trade signal with precise TP, SL, and a confidence score." },
];

const TESTIMONIALS = [
  { name: "James R.", role: "Prop Firm Trader", text: "I passed my FTMO challenge using ROBOCOP signals as confirmation. The confidence score is genuinely useful.", stars: 5 },
  { name: "Amara K.", role: "Full-Time Forex Trader", text: "Saves me 30 minutes of analysis per chart. The fakeout detection alone has saved me from so many bad trades.", stars: 5 },
  { name: "Marcus T.", role: "Retail Trader", text: "The pattern recognition is scary accurate. Way better than any indicator I've used.", stars: 4 },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-background text-foreground overflow-x-hidden"
      style={{ fontFamily: "JetBrains Mono, monospace" }}
    >
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-14"
        style={{ background: "rgba(3,8,16,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,229,255,0.08)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-sm flex items-center justify-center" style={{ background: "#00e5ff", boxShadow: "0 0 12px rgba(0,229,255,0.5)" }}>
            <Cpu size={13} color="#030810" />
          </div>
          <span className="text-[12px] font-bold tracking-[0.25em]" style={{ fontFamily: "Orbitron, monospace", color: "#00e5ff" }}>
            ROBOCOP
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[11px] tracking-widest" style={{ color: "#4a6a80" }}>
          <a href="#features" className="hover:text-foreground transition-colors">FEATURES</a>
          <a href="#how" className="hover:text-foreground transition-colors">HOW IT WORKS</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">PRICING</a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="text-[11px] tracking-widest px-4 py-1.5 rounded transition-all"
            style={{ color: "#4a6a80", border: "1px solid rgba(0,229,255,0.12)" }}
          >
            SIGN IN
          </button>
          <button
            onClick={() => navigate("/register")}
            className="text-[11px] tracking-widest px-4 py-1.5 rounded transition-all font-bold"
            style={{ background: "rgba(0,229,255,0.1)", border: "1px solid #00e5ff", color: "#00e5ff" }}
          >
            GET STARTED
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-14 overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }} />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-[10px] tracking-widest"
              style={{ border: "1px solid rgba(0,229,255,0.2)", background: "rgba(0,229,255,0.05)", color: "#00e5ff" }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#39ff14" }} />
              AI CHART SCANNER · NOW LIVE
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6"
              style={{ fontFamily: "Orbitron, monospace", color: "#ece8e1", letterSpacing: "0.05em" }}>
              TRADE SMARTER.<br />
              <span style={{ color: "#00e5ff", textShadow: "0 0 30px rgba(0,229,255,0.4)" }}>SCAN FASTER.</span>
            </h1>

            <p className="text-[14px] leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: "#6b7f8a" }}>
              ROBOCOP SYSTEM uses AI to analyse Forex chart screenshots and deliver institutional-grade trade signals — direction, entries, stop losses, and take profits — in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate("/register")}
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded font-bold text-[12px] tracking-[0.2em] transition-all"
                style={{ background: "linear-gradient(135deg, #00e5ff, #0099cc)", color: "#030810", fontFamily: "Orbitron, monospace" }}
              >
                START FOR FREE <ArrowRight size={14} />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded font-bold text-[12px] tracking-[0.2em] transition-all"
                style={{ border: "1px solid rgba(0,229,255,0.25)", color: "#00e5ff", background: "rgba(0,229,255,0.04)" }}
              >
                SIGN IN
              </button>
            </div>

            <p className="mt-4 text-[10px] tracking-widest" style={{ color: "#4a6a80" }}>
              FREE PLAN · NO CREDIT CARD REQUIRED
            </p>
          </motion.div>
        </div>

        {/* Floating stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-10 mt-16 grid grid-cols-3 gap-6 max-w-lg w-full"
        >
          {[
            { val: "94%", label: "Pattern Accuracy" },
            { val: "<4s", label: "Scan Time" },
            { val: "14+", label: "Pattern Types" },
          ].map(({ val, label }) => (
            <div key={label} className="text-center py-4 rounded" style={{ border: "1px solid rgba(0,229,255,0.1)", background: "rgba(0,229,255,0.03)" }}>
              <div className="text-2xl font-bold mb-1" style={{ fontFamily: "Orbitron, monospace", color: "#00e5ff" }}>{val}</div>
              <div className="text-[9px] tracking-widest" style={{ color: "#4a6a80" }}>{label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[10px] tracking-[0.3em] mb-3" style={{ color: "#00e5ff" }}>CAPABILITIES</p>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "Orbitron, monospace", color: "#ece8e1" }}>
              What ROBOCOP Analyses
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="p-5 rounded"
                style={{ background: "rgba(7,15,26,0.8)", border: "1px solid rgba(0,229,255,0.08)" }}
              >
                <div className="w-9 h-9 rounded flex items-center justify-center mb-4" style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.15)" }}>
                  <Icon size={16} style={{ color: "#00e5ff" }} />
                </div>
                <h3 className="text-[12px] font-bold mb-2 tracking-wide" style={{ color: "#ece8e1" }}>{title}</h3>
                <p className="text-[11px] leading-relaxed" style={{ color: "#4a6a80" }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="py-20 px-6" style={{ borderTop: "1px solid rgba(0,229,255,0.06)", borderBottom: "1px solid rgba(0,229,255,0.06)", background: "rgba(4,8,14,0.6)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[10px] tracking-[0.3em] mb-3" style={{ color: "#00e5ff" }}>WORKFLOW</p>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "Orbitron, monospace", color: "#ece8e1" }}>
              Three Steps to Your Signal
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ n, title, desc }, i) => (
              <div key={n} className="relative text-center">
                {i < 2 && (
                  <div className="hidden md:block absolute top-6 left-[calc(50%+40px)] right-0 h-px" style={{ background: "linear-gradient(90deg,rgba(0,229,255,0.3),transparent)" }} />
                )}
                <div className="text-[32px] font-black mb-4" style={{ fontFamily: "Orbitron, monospace", color: "rgba(0,229,255,0.15)" }}>{n}</div>
                <h3 className="text-[13px] font-bold mb-2" style={{ color: "#ece8e1" }}>{title}</h3>
                <p className="text-[11px] leading-relaxed" style={{ color: "#4a6a80" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[10px] tracking-[0.3em] mb-3" style={{ color: "#00e5ff" }}>PLANS</p>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "Orbitron, monospace", color: "#ece8e1" }}>
              Choose Your Access Level
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map(({ name, price, period, desc, scans, features, cta, highlight }) => (
              <div
                key={name}
                className="relative p-6 rounded flex flex-col"
                style={{
                  background: highlight ? "rgba(0,229,255,0.05)" : "rgba(7,15,26,0.8)",
                  border: `1px solid ${highlight ? "#00e5ff" : "rgba(0,229,255,0.1)"}`,
                  boxShadow: highlight ? "0 0 40px rgba(0,229,255,0.08)" : undefined,
                }}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[9px] font-bold tracking-widest rounded-full"
                    style={{ background: "#00e5ff", color: "#030810", fontFamily: "Orbitron, monospace" }}>
                    MOST POPULAR
                  </div>
                )}
                <div className="mb-5">
                  <p className="text-[10px] tracking-widest mb-2" style={{ color: "#4a6a80" }}>{name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold" style={{ fontFamily: "Orbitron, monospace", color: highlight ? "#00e5ff" : "#ece8e1" }}>{price}</span>
                    <span className="text-[11px]" style={{ color: "#4a6a80" }}>{period}</span>
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: "#4a6a80" }}>{desc}</p>
                </div>

                <div className="px-3 py-2 rounded mb-5 text-[10px] tracking-widest text-center"
                  style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.12)", color: "#00e5ff" }}>
                  {scans}
                </div>

                <ul className="space-y-2.5 mb-7 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-[11px]" style={{ color: "#8a9aa8" }}>
                      <CheckCircle size={11} style={{ color: "#39ff14", flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate("/register")}
                  className="w-full py-2.5 rounded text-[11px] font-bold tracking-[0.15em] transition-all"
                  style={{
                    fontFamily: "Orbitron, monospace",
                    background: highlight ? "linear-gradient(135deg,#00e5ff,#0099cc)" : "rgba(0,229,255,0.07)",
                    border: highlight ? "none" : "1px solid rgba(0,229,255,0.2)",
                    color: highlight ? "#030810" : "#00e5ff",
                  }}
                >
                  {cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "rgba(4,8,14,0.6)", borderTop: "1px solid rgba(0,229,255,0.06)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.3em] mb-3" style={{ color: "#00e5ff" }}>TRADERS TALK</p>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "Orbitron, monospace", color: "#ece8e1" }}>
              What Our Users Say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, role, text, stars }) => (
              <div key={name} className="p-5 rounded" style={{ background: "rgba(7,15,26,0.9)", border: "1px solid rgba(0,229,255,0.08)" }}>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} size={11} fill="#ffc107" style={{ color: "#ffc107" }} />
                  ))}
                </div>
                <p className="text-[11px] leading-relaxed mb-4" style={{ color: "#8a9aa8" }}>"{text}"</p>
                <p className="text-[11px] font-bold" style={{ color: "#ece8e1" }}>{name}</p>
                <p className="text-[10px]" style={{ color: "#4a6a80" }}>{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(0,229,255,0.05) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "Orbitron, monospace", color: "#ece8e1" }}>
            READY TO SCAN?
          </h2>
          <p className="text-[13px] mb-8" style={{ color: "#4a6a80" }}>
            Join thousands of traders using AI-powered chart analysis to find high-probability setups.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="inline-flex items-center gap-2 px-8 py-4 rounded font-bold text-[13px] tracking-[0.2em]"
            style={{ background: "linear-gradient(135deg,#00e5ff,#0099cc)", color: "#030810", fontFamily: "Orbitron, monospace" }}
          >
            CREATE FREE ACCOUNT <ChevronRight size={16} />
          </button>
          <p className="mt-3 text-[10px] tracking-widest" style={{ color: "#2a4055" }}>
            <Lock size={9} className="inline mr-1" />
            SECURE · NO SPAM · FREE TO START
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-8 px-8 flex items-center justify-between" style={{ borderTop: "1px solid rgba(0,229,255,0.08)" }}>
        <div className="flex items-center gap-2">
          <Cpu size={12} style={{ color: "#00e5ff" }} />
          <span className="text-[10px] tracking-[0.2em]" style={{ fontFamily: "Orbitron, monospace", color: "#00e5ff" }}>ROBOCOP SYSTEM</span>
        </div>
        <p className="text-[10px]" style={{ color: "#2a4055" }}>
          © 2025 · AI Forex Scanner · For educational purposes only
        </p>
      </footer>
    </div>
  );
}
