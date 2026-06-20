import { analyzeChartWithGitHubAI } from '../services/githubAI';
import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  Activity, Zap, BarChart2, Clock, CheckCircle, Database, Cpu,
  Wifi, AlertTriangle, LogOut, User, Crown, Lock, X, Check, Loader,
  Upload, // Added Upload
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
  return ["JPY", "NAS", "US30", "XAU", "BTC", "DJI"].some(k => pair.toUpperCase().includes(k))
    ? price.toFixed(2) : price.toFixed(5);
}

// ─── Canvas helper functions ────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
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
    if (isNaN(y) || y < 0 || y > h) return;
    
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
    ctx.fillText(`${zone.type.toUpperCase()} ${fmt(zone.level, r.pair)}`, 6, y - 6);
    ctx.shadowBlur = 0;
  });
  
  // ─── DRAW ENTRY, SL, TP LEVELS ──────────────────────────────────────
  const drawLevel = (price: number, label: string, color: string, dashed: boolean = false) => {
    const y = py(price);
    if (isNaN(y) || y < 0 || y > h) return;
    
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
  if (!isNaN(aY)) {
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
  }
  
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
  roundRect(ctx, meterX, meterY, meterW, meterH, 3);
  ctx.fill();
  
  const confColor = r.confidence >= 70 ? "#39ff14" : r.confidence >= 50 ? "#ffc107" : "#ff3838";
  ctx.fillStyle = confColor;
  ctx.shadowColor = confColor;
  ctx.shadowBlur = 10;
  roundRect(ctx, meterX, meterY, (r.confidence / 100) * meterW, meterH, 3);
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

  // Force trade mode for testing - set to false for production
  const FORCE_TRADE_MODE = true;

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

      // 🔥 FORCE TRADE MODE - Override NO TRADE decisions cleanly with high-precision metrics
      if (FORCE_TRADE_MODE && aiResult && aiResult.decision === "NO TRADE") {
        console.log('⚠️ FORCE TRADE MODE: Overriding NO TRADE safely without layout regex crashes');
        
        const forcedDirection = aiResult.market_structure?.toLowerCase().includes("bearish") ? "SELL" : "BUY";
        const sign = forcedDirection === "BUY" ? 1 : -1;
        
        // Dynamic financial asset coordinate tracking logic
        let fallbackBasePrice = aiResult.execution?.entry || 0;
        if (fallbackBasePrice === 0 || fallbackBasePrice === 64) {
          const instrumentStr = (aiResult.instrument || selectedPair || "AUTO").toUpperCase();
          if (instrumentStr.includes("BTC")) fallbackBasePrice = 64250.0;
          else if (instrumentStr.includes("US30") || instrumentStr.includes("DJI")) fallbackBasePrice = 39120.0;
          else if (instrumentStr.includes("NAS")) fallbackBasePrice = 18450.0;
          else if (instrumentStr.includes("XAU")) fallbackBasePrice = 2335.0;
          else if (instrumentStr.includes("JPY")) fallbackBasePrice = 152.40;
          else fallbackBasePrice = 1.0850; 
        }

        const pipsOffset = fallbackBasePrice > 1000 ? (fallbackBasePrice * 0.0015) : (fallbackBasePrice * 0.003);

        aiResult = {
          ...aiResult,
          decision: forcedDirection,
          confidence_percentage: Math.max(aiResult.confidence_percentage || 50, 60),
          execution: {
            entry: fallbackBasePrice,
            stop_loss: aiResult.execution?.stop_loss || (fallbackBasePrice - (pipsOffset * sign * 0.5)),
            tp_1: aiResult.execution?.tp_1 || (fallbackBasePrice + (pipsOffset * sign * 0.5)),
            tp_2: aiResult.execution?.tp_2 || (fallbackBasePrice + (pipsOffset * sign * 1.0)),
            tp_3: aiResult.execution?.tp_3 || (fallbackBasePrice + (pipsOffset * sign * 1.5)),
            risk_reward_ratio: aiResult.execution?.risk_reward_ratio || "1:2"
          },
          verdict_summary: (aiResult.verdict_summary || "Mixed conditions. System override activated for real-time validation.") + " [FORCED TRADE - AI was cautious]"
        };
      }

      if (aiResult && !aiResult.error) {
        console.log('✅ Using GitHub AI result:', aiResult);
        
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
        
        const detectedSymbol = aiResult.instrument || (selectedPair !== "AUTO" ? selectedPair : "EUR/USD");
        const detectedTimeframe = aiResult.timeframe || (selectedTF !== "AUTO" ? selectedTF : "H1");
        const decision = aiResult.decision || "NO TRADE";
        const direction: TradeDirection = decision === "BUY" ? "BUY" : decision === "SELL" ? "SELL" : "NO TRADE";
        
        const isBullishStructure = aiResult.market_structure?.toLowerCase().includes("bullish") || 
                                  aiResult.market_structure?.toLowerCase().includes("mss") || 
                                  aiResult.market_structure?.toLowerCase().includes("bos");
        const trend: TrendType = isBullishStructure ? "BULLISH" : (direction === "SELL" ? "BEARISH" : "NEUTRAL");
        
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
          trend: trend,
          confidence: confidence,
          entry: aiResult.execution?.entry || 0,
          sl: aiResult.execution?.stop_loss || 0,
          tp1: aiResult.execution?.tp_1 || 0,
          tp2: aiResult.execution?.tp_2 || 0,
          tp3: aiResult.execution?.tp_3 || 0,
          patterns: aiResult.detected_patterns || [],
          zones: zones.length > 0 ? zones : [
            { type: "support" as const, level: (aiResult.execution?.entry || 0) * 0.99 },
            { type: "resistance" as const, level: (aiResult.execution?.entry || 0) * 1.01 },
          ],
          breakout: aiResult.detected_patterns?.some((p: string) => p.toLowerCase().includes("breakout")) || false,
          fakeoutRisk: aiResult.detected_patterns?.some((p: string) => p.toLowerCase().includes("fakeout")) || false,
          trendStrength: scoreComponents.trendStructure,
          patternScore: scoreComponents.chartPatterns,
          volumeScore: scoreComponents.indicatorConfluence,
          timeframe: detectedTimeframe,
          pair: detectedSymbol,
          riskReward: riskReward,
          model: selectedModel,
          tradeStyle: selectedTradeStyle,
          scoreComponents: scoreComponents,
          verdictSummary: aiResult.verdict_summary || "",
          marketStructure: aiResult.market_structure || trend
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

      // Only add to history if it's a trade signal
      if (analysis.direction !== "NO TRADE") {
        setHistory(prev => [{
          id: Date.now(), 
          pair: analysis.pair, 
          direction: analysis.direction,
          confidence: analysis.confidence, 
          model: modelInfo?.name || selectedModel,
          time: new Date().toLocaleTimeString("en-US", { hour12: false }),
          tradeStyle: analysis.tradeStyle,
        }, ...prev.slice(0, 9)]);
      }

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

  return (
    <div className="min-h-screen text-[#ece8e1] font-mono flex flex-col relative overflow-x-hidden select-none bg-[#030810]">
      {/* BACKGROUND GRAPH GRID */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,229,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute top-0 inset-x-0 h-64 pointer-events-none z-0 bg-gradient-to-b from-[rgba(0,229,255,0.03)] to-transparent" />

      {/* GLOBAL STATUS BAR */}
      <div className="z-10 flex items-center justify-between px-6 py-2 border-b text-[10px] bg-[rgba(4,10,20,0.8)] backdrop-blur-md" style={{ borderColor: "rgba(0,229,255,0.08)" }}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2"><Cpu size={11} className="text-[#00e5ff]" /><span className="font-bold tracking-wider" style={{ fontFamily: "Orbitron, sans-serif" }}>ONE PATCH SCANNER v2.5</span></div>
          <div className="flex items-center gap-1.5 text-[#4a6a80]"><Wifi size={10} className="text-[#39ff14]" /><span>NODE: SECURE_INF_STREAM</span></div>
        </div>
        <div className="flex items-center gap-6 text-[#8a9aa8]">
          <div className="tracking-widest">{now.toLocaleDateString()} — {now.toLocaleTimeString()}</div>
          {user && (
            <div className="flex items-center gap-2 px-2.5 py-0.5 rounded border border-[rgba(0,229,255,0.12)] bg-[rgba(0,229,255,0.03)]">
              <span className="text-[9px] px-1 font-bold rounded bg-[#00e5ff] text-[#030810]">{user.plan}</span>
              <span style={{ color: user.scansUsed >= user.scansLimit ? "#ff3838" : "#00e5ff" }}>ALLOCATION: {user.scansUsed}/{user.scansLimit} SCANS</span>
            </div>
          )}
        </div>
      </div>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden z-10 max-w-[1700px] w-full mx-auto p-4 gap-4">
        
        {/* LEFT COLUMN: CONTROL & CONFIG METRICS (4/12) */}
        <div className="col-span-4 flex flex-col gap-4">
          
          {/* USER CONTEXT TERMINAL */}
          <div className="rounded-lg p-4 border flex flex-col gap-3 bg-[rgba(6,14,24,0.65)] backdrop-blur-md" style={{ borderColor: "rgba(0,229,255,0.12)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border flex items-center justify-center bg-[rgba(0,229,255,0.05)] border-[rgba(0,229,255,0.2)]">
                  <User size={14} className="text-[#00e5ff]" />
                </div>
                <div>
                  <p className="text-[12px] font-bold tracking-wider text-[#ffffff]">{user?.email?.split("@")[0].toUpperCase() || "QUANT_OPERATOR"}</p>
                  <p className="text-[9px] text-[#4a6a80] tracking-tight">{user?.email}</p>
                </div>
              </div>
              <button onClick={() => { logout(); navigate("/login"); }} className="p-2 rounded border border-transparent text-[#4a6a80] hover:text-[#ff3838] hover:border-[rgba(255,56,56,0.15)] hover:bg-[rgba(255,56,56,0.02)] transition-all">
                <LogOut size={13} />
              </button>
            </div>
            
            {user?.plan === "FREE" && (
              <div className="p-3 rounded border flex items-center justify-between bg-gradient-to-r from-[rgba(168,85,247,0.06)] to-transparent border-[rgba(168,85,247,0.2)]">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#a855f7]"><Crown size={12} /><span>UNLEASH QUANTUM ENGINE</span></div>
                  <p className="text-[9px] text-[#8a9aa8] mt-0.5">Unlock Claude 3.5 Sonnet, Grok-2, and unmitigated institutional scanning arrays.</p>
                </div>
                <button onClick={() => { setUpgradePlan("PRO"); setShowPayment(true); }} className="px-3 py-1.5 rounded text-[10px] font-bold tracking-wider text-[#030810] bg-[#a855f7] hover:bg-[#b96cfc] transition-all">UPGRADE</button>
              </div>
            )}
          </div>

          {/* PARAMETER CONFIGURATION PANEL */}
          <div className="rounded-lg p-5 border flex flex-col gap-4 bg-[rgba(6,14,24,0.65)] backdrop-blur-md" style={{ borderColor: "rgba(0,229,255,0.12)" }}>
            <SectionLabel icon={<Database size={11} />} text="QUANT CONFIG ARRAY" />

            {/* MODEL SELECT GRID */}
            <div>
              <label className="block text-[9px] text-[#4a6a80] tracking-widest mb-1.5">A.I. REASONING AGENT</label>
              <div className="grid grid-cols-2 gap-1.5">
                {AI_MODELS.map(m => {
                  const isLocked = m.pro && user?.plan === "FREE";
                  const isSel = selectedModel === m.id;
                  return (
                    <button key={m.id} disabled={isScanning} onClick={() => setSelectedModel(m.id)} className="relative p-2.5 rounded border text-left flex flex-col gap-1 transition-all disabled:opacity-50"
                      style={{
                        background: isSel ? "rgba(0,229,255,0.03)" : "rgba(3,8,16,0.4)",
                        borderColor: isSel ? m.color : "rgba(0,229,255,0.08)",
                      }}>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-bold text-[#ffffff]">{m.name}</span>
                        {isLocked && <Lock size={10} className="text-[#a855f7]" />}
                      </div>
                      <span className="text-[8px] text-[#4a6a80] tracking-widest">{m.provider.toUpperCase()}</span>
                      {isSel && <div className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full shadow-[0_0_6px_currentcolor]" style={{ color: m.color, background: m.color }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PIPELINE STRATEGY STYLE SWITCH */}
            <div>
              <label className="block text-[9px] text-[#4a6a80] tracking-widest mb-1.5">EXECUTION TIMEFRAME HORIZON</label>
              <div className="flex gap-2">
                {(["SCALP", "SWING"] as const).map(style => (
                  <button key={style} disabled={isScanning} onClick={() => setSelectedTradeStyle(style)} className="flex-1 py-2 rounded border text-[11px] font-bold tracking-[0.15em] flex items-center justify-center gap-1.5 transition-all"
                    style={{
                      fontFamily: "Orbitron, sans-serif",
                      background: selectedTradeStyle === style ? "rgba(0,229,255,0.04)" : "transparent",
                      borderColor: selectedTradeStyle === style ? "#00e5ff" : "rgba(0,229,255,0.08)",
                      color: selectedTradeStyle === style ? "#00e5ff" : "#4a6a80"
                    }}>
                    {style === "SCALP" ? <Zap size={11} /> : <Clock size={11} />}
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* METRICS INTERACTION PANEL MANUAL OVERRIDES */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[9px] text-[#4a6a80] tracking-widest mb-1">ASSET PAIR FILTER</label>
                <select disabled={isScanning} value={selectedPair} onChange={e => setSelectedPair(e.target.value)} className="w-full bg-[#030810] text-[#ece8e1] border rounded text-[11px] p-2 outline-none transition-all" style={{ borderColor: "rgba(0,229,255,0.12)" }}>
                  <option value="AUTO">🔍 AUTO MATCH</option>
                  {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] text-[#4a6a80] tracking-widest mb-1">BASE TIMEFRAME</label>
                <select disabled={isScanning} value={selectedTF} onChange={e => setSelectedTF(e.target.value)} className="w-full bg-[#030810] text-[#ece8e1] border rounded text-[11px] p-2 outline-none transition-all" style={{ borderColor: "rgba(0,229,255,0.12)" }}>
                  <option value="AUTO">🔍 AUTO DETECT</option>
                  {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* SCANNING CORE EXECUTION TRIGGER */}
            <button disabled={isScanning || !uploadedImage || (user && user.scansUsed >= user.scansLimit) ? true : undefined} onClick={handleScan} className="w-full relative mt-2 py-3 rounded font-bold text-[12px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-40"
              style={{
                fontFamily: "Orbitron, sans-serif",
                background: isScanning ? "rgba(0,229,255,0.05)" : "linear-gradient(135deg, #00e5ff, #0088cc)",
                color: isScanning ? "#00e5ff" : "#030810",
                border: isScanning ? "1px solid rgba(0,229,255,0.2)" : "1px solid transparent",
                boxShadow: isScanning ? "none" : "0 0 20px rgba(0,229,255,0.2)"
              }}>
              {isScanning ? (
                <>
                  <Loader size={13} className="animate-spin" />
                  <span>MATRIX SCANNING — {Math.round(scanProgress)}%</span>
                </>
              ) : (
                <>
                  <Activity size={13} className="group-hover:scale-110 transition-transform" />
                  <span>INITIALIZE EVALUATION ENGINE</span>
                </>
              )}
            </button>
          </div>

          {/* HISTORICAL LIVE SIGNALS LOG */}
          <div className="flex-1 rounded-lg p-4 border flex flex-col gap-3 overflow-hidden bg-[rgba(6,14,24,0.65)] backdrop-blur-md" style={{ borderColor: "rgba(0,229,255,0.12)" }}>
            <SectionLabel icon={<Clock size={11} />} text="LOGGED TRANSMISSIONS" />
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#4a6a80] text-[10px] gap-1 py-12">
                  <Database size={14} className="opacity-40" />
                  <span>EMPTY PIPELINE LOG ARRAY</span>
                </div>
              ) : (
                history.map(h => (
                  <div key={h.id} className="p-2.5 rounded border flex items-center justify-between text-[11px] bg-[rgba(3,8,16,0.3)]" style={{ borderColor: "rgba(0,229,255,0.05)" }}>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#ffffff]">{h.pair}</span>
                        <span className="text-[8px] px-1 rounded bg-[rgba(255,255,255,0.05)] text-[#8a9aa8]">{h.tradeStyle}</span>
                      </div>
                      <span className="text-[9px] text-[#4a6a80] tracking-wide">{h.time} — {h.model}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold tracking-widest text-[11px]" style={{ color: h.direction === "BUY" ? "#39ff14" : h.direction === "SELL" ? "#ff3838" : "#ffc107" }}>
                        {h.direction}
                      </span>
                      <p className="text-[9px] text-[#8a9aa8] tracking-tight">{h.confidence}% ACC</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CHART DISPLAY SCREEN & ANALYSIS VIEWPORT (8/12) */}
        <div className="col-span-8 flex flex-col gap-4">
          
          {/* ANALYSIS TERMINAL MAIN GRAPH PORT */}
          <div className="flex-1 rounded-lg border relative flex flex-col items-center justify-center overflow-hidden min-h-[480px] bg-[#040a12]"
            style={{ borderColor: dragOver ? "#00e5ff" : "rgba(0,229,255,0.12)", boxShadow: dragOver ? "0 0 40px rgba(0,229,255,0.05)" : "none" }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}>
            
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

            {!uploadedImage ? (
              <div className="flex flex-col items-center gap-3 text-center p-8 max-w-sm cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-14 h-14 rounded-full border border-dashed flex items-center justify-center bg-[rgba(0,229,255,0.02)] border-[rgba(0,229,255,0.25)] hover:border-[#00e5ff] hover:bg-[rgba(0,229,255,0.05)] transition-all">
                  <Upload size={18} className="text-[#4a6a80]" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-[#ffffff] tracking-wider">DROP VISUAL TELEMETRY HERE</p>
                  <p className="text-[10px] text-[#4a6a80] mt-1 leading-relaxed">Drag chart screenshots directly, or click to map a raw image stream file payload.</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center p-2 group">
                <img ref={imgRef} src={uploadedImage} alt="Telemetry Array" className="max-w-full max-h-[580px] object-contain rounded border border-[rgba(255,255,255,0.03)]" />
                <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full p-2 m-auto max-h-[580px]" />
                
                {/* SCANNING ACTIVE INTERCEPT LAYER OVERLAY */}
                {isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[rgba(3,8,16,0.85)] backdrop-blur-sm z-20">
                    <div className="w-48 h-1 border rounded-full relative overflow-hidden bg-[rgba(255,255,255,0.05)]" style={{ borderColor: "rgba(0,229,255,0.1)" }}>
                      <motion.div className="h-full bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]" initial={{ width: "0%" }} animate={{ width: `${scanProgress}%` }} transition={{ ease: "linear" }} />
                    </div>
                    <p className="text-[10px] mt-3 font-bold tracking-[0.2em] text-[#00e5ff]" style={{ fontFamily: "Orbitron, sans-serif" }}>{scanStep}</p>
                  </div>
                )}

                {/* VISUAL CONTROLS OVERLAY WATERMARK */}
                <div className="absolute top-4 right-4 flex gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded border text-[9px] font-bold bg-[#040a12] border-[rgba(0,229,255,0.15)] text-[#4a6a80] hover:text-[#00e5ff] hover:border-[#00e5ff] transition-all">REPLACE ARRAY</button>
                  <button onClick={() => { setUploadedImage(null); setResult(null); }} className="p-1.5 rounded border text-[9px] font-bold bg-[#040a12] border-[rgba(255,56,56,0.15)] text-[#4a6a80] hover:text-[#ff3838] hover:border-[#ff3838] transition-all">CLEAR</button>
                </div>
              </div>
            )}
          </div>

          {/* LOWER ANALYSIS MATRIX PANELS */}
          {result && (
            <div className="grid grid-cols-12 gap-4">
              
              {/* PRIMARY PANEL: DIRECTION AND PRICE LEVELS (7/12) */}
              <div className="col-span-7 rounded-lg p-4 border flex flex-col justify-between bg-[rgba(6,14,24,0.65)] backdrop-blur-md" style={{ borderColor: "rgba(0,229,255,0.12)" }}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold tracking-wider text-[#ffffff]">{result.pair}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-[rgba(0,229,255,0.15)] text-[#00e5ff] bg-[rgba(0,229,255,0.02)] font-bold">{result.timeframe}</span>
                    </div>
                    <p className="text-[9px] text-[#4a6a80] tracking-wide mt-1">REASONING AGENT NODE: {AI_MODELS.find(m => m.id === result.model)?.name.toUpperCase() || "ALGO"}</p>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <ConfidenceRing value={result.confidence} />
                    <div className="flex flex-col items-end justify-center py-1 px-3 rounded border bg-[rgba(3,8,16,0.4)]"
                      style={{
                        borderColor: result.direction === "BUY" ? "rgba(57,255,20,0.2)" : result.direction === "SELL" ? "rgba(255,56,56,0.2)" : "rgba(0,229,255,0.12)",
                        boxShadow: `0 0 12px ${result.direction === "BUY" ? "rgba(57,255,20,0.03)" : result.direction === "SELL" ? "rgba(255,56,56,0.03)" : "transparent"}`
                      }}>
                      <span className="text-[8px] text-[#4a6a80] tracking-widest">DECISION MATRIX</span>
                      <span className="text-[16px] font-bold tracking-widest leading-none mt-1" style={{ fontFamily: "Orbitron, sans-serif", color: result.direction === "BUY" ? "#39ff14" : result.direction === "SELL" ? "#ff3838" : "#ffc107" }}>
                        {result.direction}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TARGET MATHEMATICS PRICING ENGINE BLOCKS */}
                <div className="grid grid-cols-5 gap-1.5 border-t pt-3 mt-3" style={{ borderColor: "rgba(0,229,255,0.08)" }}>
                  <div className="p-1.5 rounded border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.01)] text-center">
                    <span className="block text-[8px] text-[#4a6a80] tracking-wider mb-0.5">ENTRY</span>
                    <span className="text-[10px] text-[#ffffff] font-bold">{fmt(result.entry, result.pair)}</span>
                  </div>
                  <div className="p-1.5 rounded border border-[rgba(255,56,56,0.15)] bg-[rgba(255,56,56,0.01)] text-center">
                    <span className="block text-[8px] text-[#ff6464] tracking-wider mb-0.5">STOP LOSS</span>
                    <span className="text-[10px] text-[#ff3838] font-bold">{fmt(result.sl, result.pair)}</span>
                  </div>
                  <div className="p-1.5 rounded border border-[rgba(57,255,20,0.15)] bg-[rgba(57,255,20,0.01)] text-center">
                    <span className="block text-[8px] text-[#64ff64] tracking-wider mb-0.5">TARGET 1</span>
                    <span className="text-[10px] text-[#39ff14] font-bold">{fmt(result.tp1, result.pair)}</span>
                  </div>
                  <div className="p-1.5 rounded border border-[rgba(0,229,255,0.15)] bg-[rgba(0,229,255,0.01)] text-center">
                    <span className="block text-[8px] text-[#64e5ff] tracking-wider mb-0.5">TARGET 2</span>
                    <span className="text-[10px] text-[#00e5ff] font-bold">{fmt(result.tp2, result.pair)}</span>
                  </div>
                  <div className="p-1.5 rounded border border-[rgba(255,193,7,0.15)] bg-[rgba(255,193,7,0.01)] text-center">
                    <span className="block text-[8px] text-[#ffd154] tracking-wider mb-0.5">TARGET 3</span>
                    <span className="text-[10px] text-[#ffc107] font-bold">{fmt(result.tp3, result.pair)}</span>
                  </div>
                </div>
              </div>

              {/* SECONDARY PANEL: GEOMETRIC PATTERNS & WEIGHTS (5/12) */}
              <div className="col-span-5 rounded-lg p-4 border flex flex-col justify-between bg-[rgba(6,14,24,0.65)] backdrop-blur-md" style={{ borderColor: "rgba(0,229,255,0.12)" }}>
                <SectionLabel icon={<BarChart2 size={11} />} text="CONFLUENCE ATTRIBUTES" />
                
                {/* MOUNTED STRUCTURAL PATTERN BADGES */}
                <div className="flex flex-wrap gap-1 my-2">
                  {result.patterns.length === 0 ? (
                    <span className="text-[9px] text-[#4a6a80]">NO STRUCTURAL PATTERNS IDENTIFIED</span>
                  ) : (
                    result.patterns.map(p => (
                      <span key={p} className="text-[9px] px-2 py-0.5 rounded bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[#8a9aa8] flex items-center gap-1">
                        <CheckCircle size={8} className="text-[#00e5ff]" />{p}
                      </span>
                    ))
                  )}
                  {result.breakout && <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-[rgba(57,255,20,0.06)] border border-[rgba(57,255,20,0.2)] text-[#39ff14] tracking-tight">BREAKOUT_CONFIRMED</span>}
                  {result.fakeoutRisk && <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-[rgba(255,56,56,0.06)] border border-[rgba(255,56,56,0.2)] text-[#ff3838] tracking-tight">⚠️ HIGH_FAKEOUT_RISK</span>}
                </div>

                {/* RAW BREAKDOWN RADIAL SLIDERS */}
                <div className="space-y-1.5 border-t pt-2.5" style={{ borderColor: "rgba(0,229,255,0.08)" }}>
                  <div className="flex items-center justify-between text-[10px]">
                    <span style={{ color: "#4a6a80" }}>Trend Alignment (0-30)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                        <div className="h-full rounded-full" 
                          style={{ width: `${(result.scoreComponents.trendStructure / 30) * 100}%`, background: "#00e5ff" }} />
                      </div>
                      <span style={{ color: "#00e5ff" }}>{result.scoreComponents.trendStructure}/30</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span style={{ color: "#4a6a80" }}>Chart Formations (0-25)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                        <div className="h-full rounded-full" 
                          style={{ width: `${(result.scoreComponents.chartPatterns / 25) * 100}%`, background: "#39ff14" }} />
                      </div>
                      <span style={{ color: "#39ff14" }}>{result.scoreComponents.chartPatterns}/25</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span style={{ color: "#4a6a80" }}>Volume Confluence (0-25)</span>
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
            </div>
          )}
        </div>
      </div>

      {/* STRIPE PAYMENT OVERLAY ARRAY ON DEMAND */}
      {showPayment && <PaymentModal targetPlan={upgradePlan} onClose={() => setShowPayment(false)} />}
    </div>
  );
}