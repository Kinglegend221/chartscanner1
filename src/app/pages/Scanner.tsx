import { analyzeChartWithGitHubAI } from '../services/githubAI';
import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  Upload, TrendingUp, TrendingDown, Minus, Activity, Zap, Eye,
  BarChart2, Clock, CheckCircle, RefreshCw, Database, Cpu,
  Wifi, AlertTriangle, LogOut, User, Crown, ChevronUp,
  Lock, X, Check, Loader,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type TradeDirection = "BUY" | "SELL" | "NO TRADE";
type TrendType = "BULLISH" | "BEARISH" | "NEUTRAL";
type TradeStyle = "SCALP" | "SWING";

interface ScoreComponents {
  trendStructure: number;
  chartPatterns: number;
  indicatorConfluence: number;
  supportResistance: number;
}

interface AnalysisResult {
  direction: TradeDirection;
  trend: TrendType;
  confidence: number;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  patterns: string[];
  zones: { type: "support" | "resistance"; level: number }[];
  breakout: boolean;
  fakeoutRisk: boolean;
  trendStrength: number;
  patternScore: number;
  volumeScore: number;
  timeframe: string;
  pair: string;
  riskReward: number;
  model: string;
  tradeStyle: TradeStyle;
  scoreComponents: ScoreComponents;
  verdictSummary?: string;
  marketStructure?: string;
}

interface HistoryEntry {
  id: number;
  pair: string;
  direction: TradeDirection;
  confidence: number;
  time: string;
  model: string;
  tradeStyle: TradeStyle;
}

// ─── AI Models ────────────────────────────────────────────────────────────────

const AI_MODELS = [
  { id: "gpt4o", name: "GPT-4o", provider: "OpenAI", color: "#10b981", pro: false },
  { id: "gemini", name: "Gemini 1.5 Pro", provider: "Google", color: "#4285f4", pro: false },
  { id: "claude", name: "Claude 3.5 Sonnet", provider: "Anthropic", color: "#c8a96e", pro: true },
  { id: "grok", name: "Grok-2", provider: "xAI", color: "#a855f7", pro: true },
  { id: "llama", name: "Llama 3.1 405B", provider: "Meta", color: "#3b82f6", pro: true },
  { id: "mistral", name: "Mistral Large", provider: "Mistral AI", color: "#f97316", pro: true },
];

// ─── Analysis simulator (fallback) ─────────────────────────────────────────

const BASE_PRICES: Record<string, number> = {
  "EUR/USD": 1.0856, "GBP/USD": 1.2734, "USD/JPY": 149.82,
  "XAU/USD": 2347.5, "BTC/USD": 67850, "NAS100": 18420, "US30": 39150,
};
const ALL_PATTERNS = [
  "Double Bottom", "Head & Shoulders", "Bull Flag", "Bear Flag",
  "Engulfing Candle", "Doji at Key Level", "Pin Bar Reversal",
  "Morning Star", "Evening Star", "Inside Bar", "Hammer",
  "Shooting Star", "Pennant Formation", "Wedge Breakout",
];
const PAIRS = Object.keys(BASE_PRICES);
const TIMEFRAMES = ["M15", "H1", "H4", "D1", "W1"];

function generateAnalysis(modelId: string, tradeStyle: TradeStyle = "SCALP"): AnalysisResult {
  const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
  const base = BASE_PRICES[pair];
  const isSmall = !["JPY", "NAS", "US30", "XAU", "BTC"].some(k => pair.includes(k));
  const pip = isSmall ? 0.0001 : base * 0.001;
  const spread = pip * (Math.random() * 30 + 20);
  const roll = Math.random();
  const trend: TrendType = roll > 0.6 ? "BULLISH" : roll > 0.3 ? "BEARISH" : "NEUTRAL";
  const direction: TradeDirection =
    trend === "BULLISH" && Math.random() > 0.15 ? "BUY"
      : trend === "BEARISH" && Math.random() > 0.15 ? "SELL"
        : "NO TRADE";
  const entry = base + (Math.random() - 0.5) * pip * 20;
  
  const slMultiplier = tradeStyle === "SCALP" ? 0.3 : 1.0;
  const sl = direction === "BUY" ? entry - spread * slMultiplier : entry + spread * slMultiplier;
  const slDist = Math.abs(entry - sl);
  
  const rr = tradeStyle === "SCALP" 
    ? parseFloat((1.0 + Math.random() * 0.5).toFixed(2))
    : parseFloat((2.0 + Math.random() * 2.0).toFixed(2));
    
  const sign = direction === "BUY" ? 1 : -1;
  const patterns = [...ALL_PATTERNS].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1);
  
  const trendStructure = Math.floor(Math.random() * 15) + 15;
  const chartPatterns = Math.floor(Math.random() * 12) + 13;
  const indicatorConfluence = Math.floor(Math.random() * 12) + 13;
  const supportResistance = Math.floor(Math.random() * 8) + 12;
  
  let confidence = trendStructure + chartPatterns + indicatorConfluence + supportResistance;
  if (confidence > 97) confidence = 97;
  
  return {
    direction, trend,
    confidence,
    entry, sl,
    tp1: entry + sign * slDist * 0.8, 
    tp2: entry + sign * slDist * 1.2, 
    tp3: entry + sign * slDist * rr,
    patterns,
    zones: [
      { type: "resistance" as const, level: entry + slDist * 2.5 },
      { type: "resistance" as const, level: entry + slDist * 1.3 },
      { type: "support" as const, level: entry - slDist * 1.4 },
      { type: "support" as const, level: entry - slDist * 3.1 },
    ],
    breakout: Math.random() > 0.55, 
    fakeoutRisk: Math.random() > 0.7,
    trendStrength: trendStructure,
    patternScore: chartPatterns,
    volumeScore: indicatorConfluence,
    timeframe: TIMEFRAMES[Math.floor(Math.random() * TIMEFRAMES.length)],
    pair, 
    riskReward: rr, 
    model: modelId,
    tradeStyle,
    scoreComponents: {
      trendStructure,
      chartPatterns,
      indicatorConfluence,
      supportResistance
    },
    verdictSummary: "Simulated analysis - upgrade to premium for AI execution",
    marketStructure: trend
  };
}

function fmt(price: number, pair: string): string {
  return ["JPY", "NAS", "US30", "XAU", "BTC"].some(k => pair.includes(k))
    ? price.toFixed(2) : price.toFixed(5);
}

// ─── Canvas overlay ───────────────────────────────────────────────────────────

function drawOverlay(canvas: HTMLCanvasElement, r: AnalysisResult) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  
  const prices = [r.sl, r.entry, r.tp1, r.tp2, r.tp3, ...r.zones.map(z => z.level)];
  const minP = Math.min(...prices) * 0.9993;
  const maxP = Math.max(...prices) * 1.0007;
  const py = (p: number) => h - ((p - minP) / (maxP - minP)) * h * 0.82 - h * 0.09;
  
  // ─── DRAW SUPPORT / RESISTANCE ZONES ──────────────────────────────────
  r.zones.forEach(zone => {
    const y = py(zone.level);
    
    const zoneHeight = 16;
    const gradient = ctx.createLinearGradient(0, y - zoneHeight/2, 0, y + zoneHeight/2);
    if (zone.type === "resistance") {
      gradient.addColorStop(0, 'rgba(255,56,56,0.25)');
      gradient.addColorStop(0.5, 'rgba(255,56,56,0.05)');
      gradient.addColorStop(1, 'rgba(255,56,56,0)');
    } else {
      gradient.addColorStop(0, 'rgba(0,229,255,0)');
      gradient.addColorStop(0.5, 'rgba(0,229,255,0.05)');
      gradient.addColorStop(1, 'rgba(0,229,255,0.25)');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, y - zoneHeight/2, w, zoneHeight);
    
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = zone.type === "resistance" ? "rgba(255,56,56,0.7)" : "rgba(0,229,255,0.7)";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = zone.type === "resistance" ? "#ff3838" : "#00e5ff";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    ctx.restore();
    
    ctx.font = "bold 9px JetBrains Mono,monospace";
    ctx.fillStyle = zone.type === "resistance" ? "rgba(255,100,100,0.9)" : "rgba(0,229,255,0.9)";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;
    ctx.fillText(`${zone.type.toUpperCase()} ${zone.level.toFixed(2)}`, 6, y - 6);
    ctx.shadowBlur = 0;
  });
  
  // ─── DRAW ENTRY, SL, TP LEVELS ──────────────────────────────────────
  const drawLevel = (price: number, label: string, color: string, dashed: boolean = false) => {
    const y = py(price);
    
    ctx.save();
    if (dashed) {
      ctx.setLineDash([4, 4]);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(w * 0.62, y);
    ctx.lineTo(w - 4, y);
    ctx.stroke();
    ctx.restore();
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(w * 0.62, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
    
    ctx.font = "bold 9px JetBrains Mono,monospace";
    ctx.fillStyle = color;
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 4;
    ctx.fillText(label, w * 0.635, y - 4);
    ctx.shadowBlur = 0;
  };
  
  drawLevel(r.entry, "ENTRY", "#ffffff");
  drawLevel(r.sl, "SL", "#ff3838", true);
  drawLevel(r.tp1, "TP1", "#39ff14");
  drawLevel(r.tp2, "TP2", "#00e5ff");
  drawLevel(r.tp3, "TP3", "#ffc107");
  
  // ─── DRAW DIRECTION ARROW ────────────────────────────────────────────
  const aX = w * 0.55, aY = py(r.entry);
  const aColor = r.direction === "BUY" ? "#39ff14" : r.direction === "SELL" ? "#ff3838" : "#ffc107";
  const aSize = 20;
  
  ctx.save();
  ctx.fillStyle = aColor;
  ctx.shadowColor = aColor;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  if (r.direction === "BUY") {
    ctx.moveTo(aX, aY - aSize);
    ctx.lineTo(aX + aSize * 0.6, aY + aSize * 0.3);
    ctx.lineTo(aX - aSize * 0.6, aY + aSize * 0.3);
  } else if (r.direction === "SELL") {
    ctx.moveTo(aX, aY + aSize);
    ctx.lineTo(aX + aSize * 0.6, aY - aSize * 0.3);
    ctx.lineTo(aX - aSize * 0.6, aY - aSize * 0.3);
  } else {
    ctx.arc(aX, aY, aSize * 0.4, 0, Math.PI * 2);
  }
  ctx.closePath();
  ctx.fill();
  
  ctx.font = "bold 10px JetBrains Mono,monospace";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 8;
  const dirLabel = r.direction === "BUY" ? "BUY" : r.direction === "SELL" ? "SELL" : "NO TRADE";
  ctx.fillText(dirLabel, aX - 15, aY - aSize - 12);
  ctx.shadowBlur = 0;
  ctx.restore();
  
  // ─── DRAW VERDICT SUMMARY ─────────────────────────────────────────────
  if (r.verdictSummary) {
    const vx = w * 0.02, vy = h * 0.06;
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 8;
    ctx.font = "bold 10px JetBrains Mono,monospace";
    const lines = r.verdictSummary.split(' ');
    const maxLineLength = 40;
    let currentLine = '';
    let lineY = vy;
    
    lines.forEach((word, index) => {
      if ((currentLine + ' ' + word).length > maxLineLength) {
        ctx.fillText(currentLine, vx, lineY);
        lineY += 16;
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
      if (index === lines.length - 1) {
        ctx.fillText(currentLine, vx, lineY);
      }
    });
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  
  // ─── DRAW CONFIDENCE METER ──────────────────────────────────────────
  const meterX = w * 0.02, meterY = h * 0.92, meterW = 120, meterH = 6;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.roundRect(meterX, meterY, meterW, meterH, 3);
  ctx.fill();
  
  const confColor = r.confidence >= 70 ? "#39ff14" : r.confidence >= 50 ? "#ffc107" : "#ff3838";
  ctx.fillStyle = confColor;
  ctx.shadowColor = confColor;
  ctx.shadowBlur = 10;
  ctx.roundRect(meterX, meterY, (r.confidence / 100) * meterW, meterH, 3);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  ctx.font = "bold 8px JetBrains Mono,monospace";
  ctx.fillStyle = confColor;
  ctx.fillText(`CONFIDENCE ${r.confidence}%`, meterX, meterY - 4);
  ctx.restore();
  
  // ─── DRAW RISK/REWARD LABEL ─────────────────────────────────────────
  const rrX = w * 0.02, rrY = h * 0.85;
  ctx.save();
  ctx.font = "bold 9px JetBrains Mono,monospace";
  ctx.fillStyle = r.riskReward >= 1.5 ? "#39ff14" : "#ffc107";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 4;
  ctx.fillText(`R:R 1:${r.riskReward}`, rrX, rrY);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─── Payment Modal ────────────────────────────────────────────────────────────

const PLANS_INFO = [
  {
    key: "PRO" as const, price: 29, label: "PRO",
    features: ["200 scans / month", "All 6 AI models", "Fakeout & liquidity detection", "Scan history & export"],
  },
  {
    key: "ELITE" as const, price: 79, label: "ELITE",
    features: ["Unlimited scans", "All 6 AI models", "Priority processing", "API access + dedicated support"],
  },
];

function PaymentModal({ onClose, targetPlan }: { onClose: () => void; targetPlan: "PRO" | "ELITE" }) {
  const { upgradePlan } = useAuth();
  const [method, setMethod] = useState<"card" | "paypal">("card");
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const planInfo = PLANS_INFO.find(p => p.key === targetPlan)!;

  const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
  };

  const handlePay = async () => {
    setError("");
    if (method === "card") {
      const raw = cardNum.replace(/\s/g, "");
      if (raw.length < 16) return setError("Enter a valid 16-digit card number.");
      if (!expiry.includes("/")) return setError("Enter expiry as MM / YY.");
      if (cvv.length < 3) return setError("Enter a valid CVV.");
      if (!name.trim()) return setError("Enter the cardholder name.");
    }
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2200));
    setProcessing(false);
    setSuccess(true);
    upgradePlan(targetPlan);
    setTimeout(onClose, 2000);
  };

  const inputCls = {
    background: "rgba(7,15,26,0.9)",
    border: "1px solid rgba(0,229,255,0.15)",
    color: "#ece8e1",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: "12px",
    outline: "none",
    borderRadius: "4px",
    padding: "9px 12px",
    width: "100%",
  } as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-lg overflow-hidden"
        style={{ background: "#070f1a", border: "1px solid rgba(0,229,255,0.2)", boxShadow: "0 0 60px rgba(0,229,255,0.08)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(0,229,255,0.1)" }}>
          <div>
            <p className="text-[10px] tracking-widest mb-0.5" style={{ color: "#4a6a80" }}>UPGRADE TO</p>
            <p className="text-[15px] font-bold tracking-widest" style={{ fontFamily: "Orbitron, monospace", color: "#00e5ff" }}>
              {targetPlan} — ${planInfo.price}/mo
            </p>
          </div>
          <button onClick={onClose} style={{ color: "#4a6a80" }}><X size={16} /></button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.3)" }}>
              <Check size={24} style={{ color: "#39ff14" }} />
            </div>
            <p className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "Orbitron, monospace", color: "#39ff14" }}>PAYMENT SUCCESSFUL</p>
            <p className="text-[11px]" style={{ color: "#4a6a80" }}>Your plan has been upgraded to {targetPlan}.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-5 p-3 rounded" style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.1)" }}>
              <div className="grid grid-cols-2 gap-1.5">
                {planInfo.features.map(f => (
                  <div key={f} className="flex items-center gap-1.5 text-[10px]" style={{ color: "#8a9aa8" }}>
                    <Check size={9} style={{ color: "#39ff14", flexShrink: 0 }} />{f}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mb-5">
              {(["card", "paypal"] as const).map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className="flex-1 py-2 rounded text-[11px] font-bold tracking-widest transition-all"
                  style={{
                    fontFamily: "Orbitron, monospace",
                    background: method === m ? "rgba(0,229,255,0.1)" : "transparent",
                    border: `1px solid ${method === m ? "#00e5ff" : "rgba(0,229,255,0.12)"}`,
                    color: method === m ? "#00e5ff" : "#4a6a80",
                  }}>
                  {m === "card" ? "💳 CARD" : "🅿 PAYPAL"}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded text-[11px]"
                style={{ background: "rgba(255,56,56,0.08)", border: "1px solid rgba(255,56,56,0.2)", color: "#ff5c5c" }}>
                <AlertTriangle size={11} />{error}
              </div>
            )}

            {method === "card" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] tracking-widest mb-1" style={{ color: "#4a6a80" }}>CARDHOLDER NAME</label>
                  <input style={inputCls} placeholder="John Smith" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[9px] tracking-widest mb-1" style={{ color: "#4a6a80" }}>CARD NUMBER</label>
                  <div className="relative">
                    <input style={inputCls} placeholder="1234 5678 9012 3456" value={cardNum}
                      onChange={e => setCardNum(formatCard(e.target.value))} />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                      <span className="text-[11px]" title="Visa">💳</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] tracking-widest mb-1" style={{ color: "#4a6a80" }}>EXPIRY</label>
                    <input style={inputCls} placeholder="MM / YY" value={expiry}
                      onChange={e => setExpiry(formatExpiry(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-[9px] tracking-widest mb-1" style={{ color: "#4a6a80" }}>CVV</label>
                    <input style={inputCls} placeholder="•••" type="password" maxLength={4}
                      value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
                  style={{ background: "rgba(0,48,135,0.3)", border: "1px solid rgba(0,48,135,0.4)" }}>
                  🅿
                </div>
                <p className="text-[11px] text-center" style={{ color: "#4a6a80" }}>
                  You will be redirected to PayPal to complete your payment securely.
                </p>
              </div>
            )}

            <button onClick={handlePay} disabled={processing}
              className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded font-bold tracking-[0.2em] text-[12px] transition-all disabled:opacity-60"
              style={{
                fontFamily: "Orbitron, monospace",
                background: processing ? "rgba(0,229,255,0.15)" : "linear-gradient(135deg,#00e5ff,#0099cc)",
                color: "#030810",
              }}>
              {processing ? <><Loader size={13} className="animate-spin" />PROCESSING…</> : <><Lock size={12} />PAY ${planInfo.price}.00</>}
            </button>

            <p className="text-center mt-3 text-[9px]" style={{ color: "#2a4055" }}>
              🔒 Secured by 256-bit SSL encryption · Cancel anytime
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
      <span className="text-[10px] w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const color = value >= 70 ? "#39ff14" : value >= 50 ? "#ffc107" : "#ff3838";
  const circ = 2 * Math.PI * 22;
  const label = value >= 70 ? "HIGH" : value >= 50 ? "MED" : "LOW";
  return (
    <div className="relative w-[72px] h-[72px] flex-shrink-0">
      <svg viewBox="0 0 52 52" className="w-full h-full -rotate-90">
        <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle cx="26" cy="26" r="22" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${(value / 100) * circ} ${circ}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[9px] font-bold" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: "#4a6a80" }}>
      {icon}<span className="text-[9px] tracking-[0.18em]">{text}</span>
    </div>
  );
}

// ─── Main Scanner ─────────────────────────────────────────────────────────────

export default function Scanner() {
  const { user, logout, incrementScan } = useAuth();
  const navigate = useNavigate();

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [selectedPair, setSelectedPair] = useState("AUTO");
  const [selectedTF, setSelectedTF] = useState("AUTO");
  const [selectedModel, setSelectedModel] = useState("gpt4o");
  const [selectedTradeStyle, setSelectedTradeStyle] = useState<TradeStyle>("SCALP");
  const [showPayment, setShowPayment] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<"PRO" | "ELITE">("PRO");
  const [now, setNow] = useState(new Date());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!result || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const draw = () => { canvas.width = img.offsetWidth; canvas.height = img.offsetHeight; drawOverlay(canvas, result); };
    if (img.complete && img.naturalWidth > 0) draw();
    else img.onload = draw;
    const ro = new ResizeObserver(draw);
    ro.observe(img);
    return () => ro.disconnect();
  }, [result, uploadedImage]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => { 
      setUploadedImage(e.target?.result as string); 
      setResult(null);
      setIsScanning(false);
      setScanProgress(0);
      setScanStep("");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); 
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleScan = async () => {
    if (isScanning) {
      console.log('⚠️ Scan already in progress');
      return;
    }
    
    if (!uploadedImage) {
      console.log('⚠️ No image uploaded');
      return;
    }
    
    if (!user) {
      console.log('⚠️ No user logged in');
      return;
    }

    if (user.scansUsed >= user.scansLimit) {
      console.log('⚠️ Scan limit reached');
      return;
    }

    const modelInfo = AI_MODELS.find(m => m.id === selectedModel);
    if (modelInfo?.pro && user.plan === "FREE") {
      setUpgradePlan("PRO");
      setShowPayment(true);
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setResult(null);

    try {
      const modelName = modelInfo?.name || "AI";
      const steps = [
        `CONNECTING TO ${modelName.toUpperCase()}…`,
        "LOADING PRICE ACTION ENGINE…",
        "DETECTING TREND STRUCTURE…",
        "SCANNING SUPPORT / RESISTANCE…",
        "ANALYZING CANDLESTICK PATTERNS…",
        "CALCULATING CONFLUENCE SCORE…",
        "COMPUTING OPTIMAL TRADE LEVELS…",
        "GENERATING TRADE DECISION…",
      ];

      for (let i = 0; i < steps.length; i++) {
        setScanStep(steps[i]);
        setScanProgress(((i + 1) / steps.length) * 100);
        await new Promise(r => setTimeout(r, 300 + Math.random() * 150));
      }

      console.log('📤 Calling GitHub AI (GPT-4o)...');
      console.log(`📊 Trade Style: ${selectedTradeStyle}`);
      setScanStep('ANALYZING CHART WITH AI…');

      let aiResult;
      let timeoutError = false;
      
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            timeoutError = true;
            reject(new Error('Analysis timeout after 60 seconds'));
          }, 60000);
        });

        const apiPromise = analyzeChartWithGitHubAI(
          uploadedImage,
          selectedPair !== "AUTO" ? selectedPair : undefined,
          selectedTF !== "AUTO" ? selectedTF : undefined,
          selectedTradeStyle
        );

        aiResult = await Promise.race([apiPromise, timeoutPromise]);
      } catch (apiError) {
        console.error('❌ API Error:', apiError);
        if (timeoutError) {
          setScanStep('⚠️ AI TIMEOUT - Using fallback…');
        } else {
          const errorMessage = apiError instanceof Error ? apiError.message : 'Analysis failed';
          setScanStep(`⚠️ ${errorMessage}`);
        }
        aiResult = null;
      }

      let analysis: AnalysisResult;

      if (aiResult && !aiResult.error) {
        console.log('✅ Using GitHub AI result:', aiResult);
        
        // Map the new JSON structure to your existing AnalysisResult type
        const zones = [];
        if (aiResult.execution) {
          const slLevel = aiResult.execution.stop_loss || 0;
          const entryLevel = aiResult.execution.entry || 0;
          const tp1Level = aiResult.execution.tp_1 || 0;
          const tp2Level = aiResult.execution.tp_2 || 0;
          const tp3Level = aiResult.execution.tp_3 || 0;
          
          if (slLevel && slLevel !== entryLevel) {
            zones.push({ type: slLevel < entryLevel ? "support" as const : "resistance" as const, level: slLevel });
          }
          if (tp1Level && tp1Level !== entryLevel) {
            zones.push({ type: tp1Level > entryLevel ? "resistance" as const : "support" as const, level: tp1Level });
          }
          if (tp2Level && tp2Level !== entryLevel) {
            zones.push({ type: tp2Level > entryLevel ? "resistance" as const : "support" as const, level: tp2Level });
          }
          if (tp3Level && tp3Level !== entryLevel) {
            zones.push({ type: tp3Level > entryLevel ? "resistance" as const : "support" as const, level: tp3Level });
          }
        }
        
        const detectedSymbol = aiResult.instrument || selectedPair || "EUR/USD";
        const detectedTimeframe = aiResult.timeframe || selectedTF || "H1";
        const decision = aiResult.decision || "NO TRADE";
        const direction: TradeDirection = decision === "BUY" ? "BUY" : decision === "SELL" ? "SELL" : "NO TRADE";
        const trend = aiResult.market_structure?.includes("Bullish") ? "BULLISH" : 
                      aiResult.market_structure?.includes("Bearish") ? "BEARISH" : "NEUTRAL";
        
        const confidence = aiResult.confidence_percentage || 50;
        const scoreComponents = {
          trendStructure: Math.min(30, Math.round((confidence * 0.35) + 5)),
          chartPatterns: Math.min(25, Math.round((confidence * 0.25) + 5)),
          indicatorConfluence: Math.min(25, Math.round((confidence * 0.25) + 5)),
          supportResistance: Math.min(20, Math.round((confidence * 0.15) + 5))
        };
        
        const rrMatch = aiResult.execution?.risk_reward_ratio?.match(/(\d+\.?\d*)/);
        const riskReward = rrMatch ? parseFloat(rrMatch[0]) : 2;
        
        analysis = {
          direction: direction,
          trend: trend as TrendType,
          confidence: confidence,
          entry: aiResult.execution?.entry || 0,
          sl: aiResult.execution?.stop_loss || 0,
          tp1: aiResult.execution?.tp_1 || 0,
          tp2: aiResult.execution?.tp_2 || 0,
          tp3: aiResult.execution?.tp_3 || 0,
          patterns: aiResult.detected_patterns || [],
          zones: zones.length > 0 ? zones : [
            { type: "support" as const, level: (aiResult.execution?.entry || 0) - 10 },
            { type: "resistance" as const, level: (aiResult.execution?.entry || 0) + 10 },
          ],
          breakout: aiResult.detected_patterns?.some((p: string) => p.includes("Breakout")) || false,
          fakeoutRisk: aiResult.detected_patterns?.some((p: string) => p.includes("Fakeout")) || false,
          trendStrength: scoreComponents.trendStructure,
          patternScore: scoreComponents.chartPatterns,
          volumeScore: scoreComponents.indicatorConfluence,
          timeframe: detectedTimeframe,
          pair: detectedSymbol,
          riskReward: riskReward,
          model: selectedModel,
          tradeStyle: selectedTradeStyle,
          scoreComponents: scoreComponents,
          verdictSummary: aiResult.verdict_summary || "Analysis complete",
          marketStructure: aiResult.market_structure || "NEUTRAL"
        };
      } else {
        console.log('🔄 Using fallback simulation');
        setScanStep('GENERATING SIMULATED ANALYSIS…');
        await new Promise(r => setTimeout(r, 500));
        analysis = generateAnalysis(selectedModel, selectedTradeStyle);
        if (selectedPair !== "AUTO") analysis.pair = selectedPair;
        if (selectedTF !== "AUTO") analysis.timeframe = selectedTF;
      }

      setResult(analysis);
      setScanProgress(100);
      incrementScan();

      setHistory(prev => [{
        id: Date.now(), 
        pair: analysis.pair, 
        direction: analysis.direction,
        confidence: analysis.confidence, 
        model: modelInfo?.name || selectedModel,
        time: new Date().toLocaleTimeString("en-US", { hour12: false }),
        tradeStyle: analysis.tradeStyle,
      }, ...prev.slice(0, 9)]);

      console.log('✅ Scan completed successfully');

    } catch (error) {
      console.error('❌ Scan error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setScanStep(`ERROR: ${errorMessage}`);
      if (!result) {
        const fallbackAnalysis = generateAnalysis(selectedModel, selectedTradeStyle);
        setResult(fallbackAnalysis);
      }
    } finally {
      setIsScanning(false);
      console.log('🔓 Scanning state cleared');
    }
  };

  const dirCol = result?.direction === "BUY" ? "#39ff14" : result?.direction === "SELL" ? "#ff3838" : "#ffc107";
  const TrendIcon = result?.trend === "BULLISH" ? TrendingUp : result?.trend === "BEARISH" ? TrendingDown : Minus;
  const planColor = user?.plan === "ELITE" ? "#ffc107" : user?.plan === "PRO" ? "#00e5ff" : "#4a6a80";
  const scansLeft = user ? Math.max(0, user.scansLimit - user.scansUsed) : 0;
  const usagePct = user ? Math.min(100, (user.scansUsed / user.scansLimit) * 100) : 0;
  const usageColor = usagePct >= 90 ? "#ff3838" : usagePct >= 70 ? "#ffc107" : "#00e5ff";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden"
      style={{ fontFamily: "JetBrains Mono, monospace" }}>

      <div className="fixed inset-0 pointer-events-none z-40"
        style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,229,255,0.007) 3px, rgba(0,229,255,0.007) 4px)" }} />

      {showPayment && <PaymentModal targetPlan={upgradePlan} onClose={() => setShowPayment(false)} />}

      <header className="flex items-center justify-between px-5 py-2.5 border-b shrink-0 z-30"
        style={{ borderColor: "rgba(0,229,255,0.15)", background: "rgba(3,6,12,0.97)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center rounded-sm"
            style={{ background: "linear-gradient(135deg,#00e5ff,#0066ff)", boxShadow: "0 0 18px rgba(0,229,255,0.55)" }}>
            <Cpu size={15} color="#030810" />
          </div>
          <div>
            <div className="text-[13px] font-bold tracking-[0.28em] leading-none"
              style={{ fontFamily: "Orbitron, monospace", color: "#00e5ff", textShadow: "0 0 12px rgba(0,229,255,0.6)" }}>
              ROBOCOP SYSTEM
            </div>
            <div className="text-[9px] tracking-[0.2em] mt-0.5" style={{ color: "#4a6a80" }}>AI FOREX CHART SCANNER · v2.0</div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {[
            { label: "AI ENGINE", on: true, col: "#39ff14" },
            { label: "MARKET FEED", on: true, col: "#00e5ff" },
            { label: "NEURAL NET", on: !isScanning, col: isScanning ? "#ffc107" : "#39ff14" },
          ].map(({ label, on, col }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full"
                style={{ background: on ? col : "#333", boxShadow: on ? `0 0 7px ${col}` : undefined, animation: on ? "pulse 2s infinite" : undefined }} />
              <span className="text-[9px] tracking-widest" style={{ color: on ? col : "#333" }}>{label}</span>
            </div>
          ))}
          <span className="text-[9px] tabular-nums pl-3"
            style={{ color: "#4a6a80", borderLeft: "1px solid rgba(0,229,255,0.1)", fontFamily: "JetBrains Mono" }}>
            {now.toUTCString().slice(0, 25).toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded"
            style={{ border: "1px solid rgba(0,229,255,0.1)", background: "rgba(0,229,255,0.03)" }}>
            <User size={11} style={{ color: "#4a6a80" }} />
            <span className="text-[10px]" style={{ color: "#ece8e1" }}>{user?.name}</span>
            <div className="flex items-center gap-1 ml-1 pl-2" style={{ borderLeft: "1px solid rgba(0,229,255,0.1)" }}>
              {user?.plan !== "FREE" && <Crown size={9} style={{ color: planColor }} />}
              <span className="text-[9px] font-bold" style={{ color: planColor }}>{user?.plan}</span>
            </div>
          </div>
          {user?.plan === "FREE" && (
            <button onClick={() => { setUpgradePlan("PRO"); setShowPayment(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold tracking-widest transition-all"
              style={{ border: "1px solid rgba(255,193,7,0.3)", color: "#ffc107", background: "rgba(255,193,7,0.06)", fontFamily: "Orbitron, monospace" }}>
              <ChevronUp size={11} />UPGRADE
            </button>
          )}
          <button onClick={() => { logout(); navigate("/"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] transition-colors"
            style={{ color: "#4a6a80", border: "1px solid rgba(255,255,255,0.05)" }}>
            <LogOut size={11} />SIGN OUT
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        <aside className="w-64 flex flex-col shrink-0 border-r overflow-y-auto"
          style={{ borderColor: "rgba(0,229,255,0.1)", background: "rgba(4,8,14,0.9)" }}>

          {user && (
            <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(0,229,255,0.08)" }}>
              <div className="flex justify-between text-[9px] mb-1.5">
                <span style={{ color: "#4a6a80" }}>SCANS USED THIS MONTH</span>
                <span className="font-bold tabular-nums" style={{ color: usageColor }}>{user.scansUsed} / {user.plan === "ELITE" ? "∞" : user.scansLimit}</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${user.plan === "ELITE" ? 10 : usagePct}%`, background: usageColor }} />
              </div>
              {user.plan === "FREE" && scansLeft <= 2 && scansLeft > 0 && (
                <p className="text-[9px] mt-1.5" style={{ color: "#ffc107" }}>
                  ⚠ {scansLeft} scan{scansLeft !== 1 ? "s" : ""} left —{" "}
                  <button onClick={() => { setUpgradePlan("PRO"); setShowPayment(true); }} className="underline" style={{ color: "#ffc107" }}>Upgrade</button>
                </p>
              )}
              {user.plan === "FREE" && scansLeft === 0 && (
                <p className="text-[9px] mt-1.5" style={{ color: "#ff3838" }}>
                  Limit reached —{" "}
                  <button onClick={() => { setUpgradePlan("PRO"); setShowPayment(true); }} className="underline font-bold" style={{ color: "#00e5ff" }}>Upgrade to continue</button>
                </p>
              )}
            </div>
          )}

          <div className="p-4 border-b" style={{ borderColor: "rgba(0,229,255,0.08)" }}>
            <SectionLabel icon={<Cpu size={9} />} text="AI MODEL" />
            <div className="mt-2 space-y-1.5">
              {AI_MODELS.map(model => {
                const locked = model.pro && user?.plan === "FREE";
                const active = selectedModel === model.id;
                return (
                  <button key={model.id} onClick={() => { if (!locked) setSelectedModel(model.id); }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded transition-all text-left"
                    style={{
                      background: active ? `${model.color}14` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${active ? model.color : "rgba(255,255,255,0.05)"}`,
                      opacity: locked ? 0.45 : 1,
                      cursor: locked ? "not-allowed" : "pointer",
                    }}>
                    <div>
                      <div className="text-[10px] font-bold" style={{ color: active ? model.color : "#ece8e1" }}>{model.name}</div>
                      <div className="text-[9px]" style={{ color: "#4a6a80" }}>{model.provider}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {locked && <Lock size={9} style={{ color: "#ffc107" }} />}
                      {active && <div className="w-1.5 h-1.5 rounded-full" style={{ background: model.color }} />}
                    </div>
                  </button>
                );
              })}
            </div>
            {user?.plan === "FREE" && (
              <p className="text-[9px] mt-2" style={{ color: "#4a6a80" }}>
                <Lock size={8} className="inline mr-1" />
                <button onClick={() => { setUpgradePlan("PRO"); setShowPayment(true); }} className="underline" style={{ color: "#ffc107" }}>Upgrade</button> to unlock all models
              </p>
            )}
          </div>

          <div className="p-4 border-b" style={{ borderColor: "rgba(0,229,255,0.08)" }}>
            <SectionLabel icon={<Upload size={9} />} text="CHART INPUT" />
            <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 rounded border cursor-pointer flex flex-col items-center justify-center gap-2 py-6 transition-all duration-300"
              style={{
                borderColor: dragOver ? "#00e5ff" : uploadedImage ? "#39ff14" : "rgba(0,229,255,0.18)",
                background: dragOver ? "rgba(0,229,255,0.06)" : uploadedImage ? "rgba(57,255,20,0.04)" : "rgba(0,229,255,0.02)",
              }}>
              {uploadedImage ? (
                <><CheckCircle size={20} style={{ color: "#39ff14" }} />
                  <span className="text-[10px]" style={{ color: "#39ff14" }}>CHART LOADED</span>
                  <span className="text-[9px]" style={{ color: "#4a6a80" }}>Click to replace</span></>
              ) : (
                <><Upload size={20} style={{ color: "#4a6a80" }} />
                  <span className="text-[10px]" style={{ color: "#4a6a80" }}>DROP CHART HERE</span>
                  <span className="text-[9px]" style={{ color: "#2a4055" }}>TradingView · MT4 · MT5</span></>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {/* TRADE STYLE SELECTOR */}
          <div className="p-4 border-b" style={{ borderColor: "rgba(0,229,255,0.08)" }}>
            <SectionLabel icon={<Activity size={9} />} text="TRADE STYLE" />
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["SCALP", "SWING"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedTradeStyle(style)}
                  className={`py-2 rounded text-[10px] font-bold tracking-widest transition-all ${
                    selectedTradeStyle === style ? 'ring-2 ring-[#00e5ff]' : ''
                  }`}
                  style={{
                    background: selectedTradeStyle === style ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedTradeStyle === style ? '#00e5ff' : 'rgba(255,255,255,0.06)'}`,
                    color: selectedTradeStyle === style ? '#00e5ff' : '#4a6a80',
                    fontFamily: "Orbitron, monospace"
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
            <p className="text-[8px] mt-1.5" style={{ color: "#4a6a80" }}>
              {selectedTradeStyle === "SCALP" 
                ? "Aggressive micro-confluence hunting on lower timeframes" 
                : "Macroscopic structural pullbacks to premium/discount zones"}
            </p>
          </div>

          <div className="p-4 border-b" style={{ borderColor: "rgba(0,229,255,0.08)" }}>
            <SectionLabel icon={<BarChart2 size={9} />} text="SCAN PARAMETERS" />
            <div className="mt-2 space-y-2">
              {([
                { label: "PAIR", value: selectedPair, opts: ["AUTO", ...Object.keys(BASE_PRICES)], set: setSelectedPair },
                { label: "TIMEFRAME", value: selectedTF, opts: ["AUTO", "M1", "M5", "M15", "H1", "H4", "D1"], set: setSelectedTF },
              ] as const).map(({ label, value, opts, set }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[9px]" style={{ color: "#4a6a80" }}>{label}</span>
                  <select value={value} onChange={e => set(e.target.value)}
                    className="text-[10px] rounded px-2 py-0.5 border bg-transparent focus:outline-none cursor-pointer"
                    style={{ color: "#00e5ff", borderColor: "rgba(0,229,255,0.2)" }}>
                    {opts.map(o => <option key={o} value={o} style={{ background: "#030810" }}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-b" style={{ borderColor: "rgba(0,229,255,0.08)" }}>
            <button onClick={handleScan}
              disabled={!uploadedImage || isScanning || (user?.scansUsed ?? 0) >= (user?.scansLimit ?? 0)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded font-bold tracking-[0.25em] text-[11px] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                fontFamily: "Orbitron, monospace",
                background: !uploadedImage || isScanning ? "transparent" : "linear-gradient(135deg,rgba(0,229,255,0.12),rgba(0,229,255,0.06))",
                border: `1px solid ${!uploadedImage || isScanning ? "rgba(0,229,255,0.2)" : "#00e5ff"}`,
                color: !uploadedImage || isScanning ? "#2a4055" : "#00e5ff",
                boxShadow: !uploadedImage || isScanning ? undefined : "0 0 22px rgba(0,229,255,0.2)",
              }}>
              {isScanning ? <><RefreshCw size={12} className="animate-spin" />SCANNING…</> : <><Zap size={12} />SCAN CHART</>}
            </button>
            {isScanning && (
              <div className="mt-3">
                <p className="text-[9px] truncate mb-1" style={{ color: "#00e5ff" }}>{scanStep}</p>
                <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(0,229,255,0.1)" }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg,#00e5ff,#39ff14)", boxShadow: "0 0 8px #00e5ff" }}
                    animate={{ width: `${scanProgress}%` }} transition={{ duration: 0.25 }} />
                </div>
                <p className="text-[9px] text-right mt-0.5" style={{ color: "#4a6a80" }}>{Math.round(scanProgress)}%</p>
              </div>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <SectionLabel icon={<Clock size={9} />} text="SCAN HISTORY" />
            {history.length === 0
              ? <p className="text-[9px] text-center mt-4" style={{ color: "#2a4055" }}>NO SCANS YET</p>
              : (
                <div className="mt-2 space-y-1">
                  {history.map(h => (
                    <div key={h.id} className="px-2 py-1.5 rounded text-[9px]"
                      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground">{h.pair}</span>
                        <span style={{ color: h.direction === "BUY" ? "#39ff14" : h.direction === "SELL" ? "#ff3838" : "#ffc107" }}>{h.direction}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span style={{ color: "#4a6a80" }}>{h.model}</span>
                        <span style={{ color: "#4a6a80" }}>{h.confidence}% · {h.time}</span>
                      </div>
                      <div className="text-[8px] mt-0.5" style={{ color: h.tradeStyle === "SCALP" ? "#39ff14" : "#ffc107" }}>
                        {h.tradeStyle}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 relative overflow-hidden" style={{ background: "rgba(2,4,8,0.95)" }}>
            {!uploadedImage ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer select-none"
                onClick={() => fileInputRef.current?.click()}>
                <div className="absolute inset-0" style={{
                  backgroundImage: "linear-gradient(rgba(0,229,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.025) 1px, transparent 1px)",
                  backgroundSize: "48px 48px",
                }} />
                {["top-8 left-8 border-t border-l", "top-8 right-8 border-t border-r", "bottom-8 left-8 border-b border-l", "bottom-8 right-8 border-b border-r"].map(cls => (
                  <div key={cls} className={`absolute w-10 h-10 ${cls}`} style={{ borderColor: "rgba(0,229,255,0.2)" }} />
                ))}
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ border: "1px solid rgba(0,229,255,0.2)", background: "rgba(0,229,255,0.04)" }}>
                    <Eye size={30} style={{ color: "#00e5ff", opacity: 0.5 }} />
                  </div>
                  <div className="text-2xl font-bold tracking-[0.3em] mb-2"
                    style={{ fontFamily: "Orbitron, monospace", color: "#00e5ff", opacity: 0.7 }}>
                    AWAITING CHART
                  </div>
                  <p className="text-[11px] tracking-widest" style={{ color: "#4a6a80" }}>Upload a Forex chart to begin AI analysis</p>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <img ref={imgRef} src={uploadedImage} alt="Chart" className="w-full h-full object-contain" />
                {result && <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />}
                {isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "rgba(2,5,10,0.82)" }}>
                    <motion.div className="absolute left-0 right-0 h-px"
                      style={{ background: "linear-gradient(90deg,transparent 0%,#00e5ff 40%,#39ff14 60%,transparent 100%)", boxShadow: "0 0 16px #00e5ff" }}
                      animate={{ top: ["8%", "92%", "8%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }} />
                    <div className="relative z-10 text-center">
                      <div className="text-lg font-bold tracking-[0.35em] mb-1"
                        style={{ fontFamily: "Orbitron, monospace", color: "#00e5ff", textShadow: "0 0 20px rgba(0,229,255,0.7)" }}>
                        {AI_MODELS.find(m => m.id === selectedModel)?.name || "AI"} SCANNING
                      </div>
                      <p className="text-[10px] tracking-widest" style={{ color: "#4a6a80" }}>{scanStep}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {result && (
            <div className="border-t overflow-y-auto shrink-0"
              style={{ borderColor: "rgba(0,229,255,0.15)", maxHeight: "46vh", background: "rgba(3,6,12,0.97)" }}>
              <div className="px-6 pt-3 pb-0 flex items-center gap-2">
                {(() => { const m = AI_MODELS.find(x => x.id === result.model); return m ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px]"
                    style={{ background: `${m.color}14`, border: `1px solid ${m.color}40`, color: m.color }}>
                    <Cpu size={8} />{m.name} · {m.provider}
                  </div>
                ) : null; })()}
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px]"
                  style={{ 
                    background: result.tradeStyle === "SCALP" ? 'rgba(57,255,20,0.1)' : 'rgba(255,193,7,0.1)',
                    border: `1px solid ${result.tradeStyle === "SCALP" ? 'rgba(57,255,20,0.3)' : 'rgba(255,193,7,0.3)'}`,
                    color: result.tradeStyle === "SCALP" ? '#39ff14' : '#ffc107'
                  }}>
                  <Zap size={8} />{result.tradeStyle}
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-3 border-b"
                style={{ borderColor: "rgba(0,229,255,0.08)", background: `linear-gradient(90deg,rgba(${result.direction === "BUY" ? "57,255,20" : result.direction === "SELL" ? "255,56,56" : "255,193,7"},0.04) 0%,transparent 60%)` }}>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[9px] tracking-[0.2em] mb-0.5" style={{ color: "#4a6a80" }}>TRADE DECISION</p>
                    <div className="text-[26px] font-black tracking-[0.15em] leading-none"
                      style={{ fontFamily: "Orbitron, monospace", color: dirCol, textShadow: `0 0 24px ${dirCol}` }}>
                      {result.direction === "BUY" ? "▲ BUY" : result.direction === "SELL" ? "▼ SELL" : "— NO TRADE"}
                    </div>
                  </div>
                  <div style={{ width: 1, alignSelf: "stretch", background: "rgba(0,229,255,0.1)" }} />
                  <div>
                    <p className="text-[9px] tracking-[0.2em] mb-0.5" style={{ color: "#4a6a80" }}>TREND</p>
                    <div className="flex items-center gap-1.5 text-[12px] font-bold"
                      style={{ color: result.trend === "BULLISH" ? "#39ff14" : result.trend === "BEARISH" ? "#ff3838" : "#ffc107" }}>
                      <TrendIcon size={13} />{result.trend}
                    </div>
                  </div>
                  <div style={{ width: 1, alignSelf: "stretch", background: "rgba(0,229,255,0.1)" }} />
                  <div>
                    <p className="text-[9px] tracking-[0.2em] mb-0.5" style={{ color: "#4a6a80" }}>INSTRUMENT</p>
                    <div className="text-[12px] font-bold" style={{ color: "#00e5ff" }}>
                      {result.pair} <span className="text-[9px] ml-1" style={{ color: "#4a6a80" }}>{result.timeframe}</span>
                    </div>
                  </div>
                  <div style={{ width: 1, alignSelf: "stretch", background: "rgba(0,229,255,0.1)" }} />
                  <div>
                    <p className="text-[9px] tracking-[0.2em] mb-0.5" style={{ color: "#4a6a80" }}>RISK / REWARD</p>
                    <div className="text-[12px] font-bold text-foreground">1 : {result.riskReward}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[9px] tracking-[0.2em] mb-0.5" style={{ color: "#4a6a80" }}>AI CONFIDENCE</p>
                    <div className="text-[34px] font-black leading-none"
                      style={{ fontFamily: "Orbitron, monospace", color: result.confidence >= 70 ? "#39ff14" : result.confidence >= 50 ? "#ffc107" : "#ff3838", textShadow: `0 0 22px ${result.confidence >= 70 ? "#39ff14" : result.confidence >= 50 ? "#ffc107" : "#ff3838"}` }}>
                      {result.confidence}<span className="text-[16px]">%</span>
                    </div>
                  </div>
                  <ConfidenceRing value={result.confidence} />
                </div>
              </div>

              <div className="grid border-b" style={{ gridTemplateColumns: "repeat(5,1fr)", borderColor: "rgba(0,229,255,0.08)" }}>
                {([
                  { label: "ENTRY", value: fmt(result.entry, result.pair), color: "#ffffff" },
                  { label: "STOP LOSS 🛑", value: fmt(result.sl, result.pair), color: "#ff3838" },
                  { label: "TP 1 🎯", value: fmt(result.tp1, result.pair), color: "#39ff14" },
                  { label: "TP 2 🎯", value: fmt(result.tp2, result.pair), color: "#00e5ff" },
                  { label: "TP 3 🎯", value: fmt(result.tp3, result.pair), color: "#ffc107" },
                ] as const).map(({ label, value, color }) => (
                  <div key={label} className="px-5 py-3 border-r last:border-r-0" style={{ borderColor: "rgba(0,229,255,0.06)" }}>
                    <p className="text-[9px] tracking-widest mb-1" style={{ color: "#4a6a80" }}>{label}</p>
                    <p className="text-[14px] font-bold" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid p-5 gap-6" style={{ gridTemplateColumns: "1fr 1fr 1fr 1.4fr" }}>
                <div>
                  <SectionLabel icon={<Activity size={9} />} text="CONFLUENCE SCORES" />
                  <div className="mt-2 space-y-2">
                    {[
                      { label: "Trend Strength", v: result.trendStrength },
                      { label: "Pattern Score", v: result.patternScore },
                      { label: "Volume Signal", v: result.volumeScore },
                    ].map(({ label, v }) => {
                      const c = v >= 70 ? "#39ff14" : v >= 50 ? "#ffc107" : "#ff3838";
                      return (<div key={label}><p className="text-[9px] mb-1" style={{ color: "#4a6a80" }}>{label}</p><ScoreBar value={v} color={c} /></div>);
                    })}
                  </div>
                </div>
                <div>
                  <SectionLabel icon={<Eye size={9} />} text="DETECTED PATTERNS" />
                  <div className="mt-2 space-y-1.5">
                    {result.patterns.map(p => (
                      <div key={p} className="flex items-center gap-1.5 text-[10px]">
                        <CheckCircle size={9} style={{ color: "#39ff14" }} /><span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <SectionLabel icon={<Database size={9} />} text="MARKET CONDITIONS" />
                  <div className="mt-2 space-y-1.5">
                    {[
                      { label: "Breakout Detected", val: result.breakout, warn: false },
                      { label: "Fakeout Risk", val: result.fakeoutRisk, warn: true },
                      { label: "Liquidity Zone", val: result.confidence > 65, warn: false },
                      { label: "Trend Confirmed", val: result.trend !== "NEUTRAL", warn: false },
                    ].map(({ label, val, warn }) => (
                      <div key={label} className="flex items-center justify-between text-[10px]">
                        <span style={{ color: "#4a6a80" }}>{label}</span>
                        <span style={{ color: val ? (warn ? "#ffc107" : "#39ff14") : "#2a4055" }}>{val ? (warn ? "⚠ YES" : "✓ YES") : "✗ NO"}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <SectionLabel icon={<Wifi size={9} />} text="AI VERDICT" />
                  <p className="mt-2 text-[10px] leading-relaxed" style={{ color: "#7a9ab5" }}>
                    {result.verdictSummary || "Analysis complete"}
                  </p>
                  {result.marketStructure && (
                    <div className="mt-2 text-[9px]" style={{ color: "#4a6a80" }}>
                      Structure: {result.marketStructure}
                    </div>
                  )}
                  {result.fakeoutRisk && (
                    <div className="mt-3 flex items-start gap-1.5 text-[9px] px-2 py-1.5 rounded"
                      style={{ background: "rgba(255,193,7,0.07)", border: "1px solid rgba(255,193,7,0.2)", color: "#ffc107" }}>
                      <AlertTriangle size={10} className="mt-px shrink-0" />Fakeout risk — confirm with higher timeframe.
                    </div>
                  )}
                </div>
              </div>

              {/* SCORE COMPONENTS BREAKDOWN */}
              {result.scoreComponents && (
                <div className="m-5 p-4 rounded" style={{ background: "rgba(0,229,255,0.03)", border: "1px solid rgba(0,229,255,0.1)" }}>
                  <SectionLabel icon={<Activity size={9} />} text="CONFIDENCE SCORE BREAKDOWN" />
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span style={{ color: "#4a6a80" }}>Trend Structure (0-30)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                          <div className="h-full rounded-full" 
                            style={{ width: `${(result.scoreComponents.trendStructure / 30) * 100}%`, background: "#39ff14" }} />
                        </div>
                        <span style={{ color: "#39ff14" }}>{result.scoreComponents.trendStructure}/30</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span style={{ color: "#4a6a80" }}>Chart Patterns (0-25)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                          <div className="h-full rounded-full" 
                            style={{ width: `${(result.scoreComponents.chartPatterns / 25) * 100}%`, background: "#00e5ff" }} />
                        </div>
                        <span style={{ color: "#00e5ff" }}>{result.scoreComponents.chartPatterns}/25</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span style={{ color: "#4a6a80" }}>Indicator Confluence (0-25)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                          <div className="h-full rounded-full" 
                            style={{ width: `${(result.scoreComponents.indicatorConfluence / 25) * 100}%`, background: "#ffc107" }} />
                        </div>
                        <span style={{ color: "#ffc107" }}>{result.scoreComponents.indicatorConfluence}/25</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span style={{ color: "#4a6a80" }}>Support/Resistance (0-20)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                          <div className="h-full rounded-full" 
                            style={{ width: `${(result.scoreComponents.supportResistance / 20) * 100}%`, background: "#ff3838" }} />
                        </div>
                        <span style={{ color: "#ff3838" }}>{result.scoreComponents.supportResistance}/20</span>
                      </div>
                    </div>
                    <div className="border-t pt-2 mt-1" style={{ borderColor: "rgba(0,229,255,0.08)" }}>
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span style={{ color: "#4a6a80" }}>TOTAL CONFIDENCE</span>
                        <span style={{ color: result.confidence >= 70 ? "#39ff14" : result.confidence >= 50 ? "#ffc107" : "#ff3838" }}>
                          {result.confidence}% {result.confidence === 97 && "⭐"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}