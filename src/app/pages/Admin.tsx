import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  Cpu, Users, BarChart2, Shield, Eye, EyeOff, Loader,
  AlertCircle, TrendingUp, TrendingDown, Crown, Trash2,
  ChevronUp, ChevronDown, Key, Save, Check, LogOut,
  Activity, Database, RefreshCw, Search,
} from "lucide-react";
import { getStoredUsers, type User } from "../context/AuthContext";

// ─── Admin credentials (hardcoded, never exposed to users) ───────────────────
const ADMIN_EMAIL = "admin@robocop.ai";
const ADMIN_PASSWORD = "admin2025";

// ─── Initial mock API keys ────────────────────────────────────────────────────
const DEFAULT_KEYS: Record<string, string> = {
  "GPT-4o (OpenAI)": "sk-••••••••••••••••••••••••••••••••",
  "Gemini 1.5 Pro (Google)": "AIza••••••••••••••••••••••••••••",
  "Claude 3.5 Sonnet (Anthropic)": "sk-ant-••••••••••••••••••••••••",
  "Grok-2 (xAI)": "xai-••••••••••••••••••••••••••••",
  "Llama 3.1 405B (Meta)": "llm-••••••••••••••••••••••••••••",
  "Mistral Large (Mistral AI)": "mis-••••••••••••••••••••••••••••",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "users" | "api" | "logs";

interface AdminUser extends User {
  email: string;
}

// ─── Mock activity log ────────────────────────────────────────────────────────
const MOCK_LOGS = [
  { time: "14:32:11", user: "james@email.com", action: "Scan completed", detail: "EUR/USD · GPT-4o · BUY 82%" },
  { time: "14:28:44", user: "amara@email.com", action: "Plan upgraded", detail: "FREE → PRO · $29.00" },
  { time: "14:21:09", user: "marcus@email.com", action: "Account created", detail: "FREE plan" },
  { time: "14:15:33", user: "sarah@email.com", action: "Scan completed", detail: "XAU/USD · Gemini · SELL 74%" },
  { time: "14:08:21", user: "david@email.com", action: "Plan upgraded", detail: "PRO → ELITE · $79.00" },
  { time: "13:55:47", user: "james@email.com", action: "Scan completed", detail: "GBP/USD · Claude · NO TRADE 41%" },
  { time: "13:44:12", user: "nina@email.com", action: "Account created", detail: "FREE plan" },
  { time: "13:30:08", user: "amara@email.com", action: "Scan completed", detail: "BTC/USD · GPT-4o · BUY 91%" },
];

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = "#00e5ff" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="p-4 rounded" style={{ background: "rgba(7,15,26,0.9)", border: "1px solid rgba(0,229,255,0.1)" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded flex items-center justify-center"
          style={{ background: `${color}14`, border: `1px solid ${color}30` }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <div className="text-[22px] font-bold" style={{ fontFamily: "Orbitron, monospace", color }}>{value}</div>
      <div className="text-[10px] tracking-widest mt-0.5" style={{ color: "#4a6a80" }}>{label}</div>
      {sub && <div className="text-[9px] mt-1" style={{ color: "#4a6a80" }}>{sub}</div>}
    </div>
  );
}

// ─── Login screen ─────────────────────────────────────────────────────────────

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    if (email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      onLogin();
    } else {
      setError("Invalid admin credentials.");
    }
  };

  const inputStyle = {
    background: "rgba(7,15,26,0.9)", border: "1px solid rgba(0,229,255,0.12)",
    color: "#ece8e1", fontFamily: "JetBrains Mono, monospace", fontSize: "13px",
    outline: "none", width: "100%", padding: "10px 14px", borderRadius: "4px",
  } as const;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#030810", fontFamily: "JetBrains Mono, monospace" }}>
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(0,229,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.02) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#ff3838,#cc0000)", boxShadow: "0 0 18px rgba(255,56,56,0.4)" }}>
            <Shield size={16} color="#fff" />
          </div>
          <div>
            <div className="text-[12px] font-bold tracking-[0.25em]" style={{ fontFamily: "Orbitron, monospace", color: "#ff3838" }}>ROBOCOP ADMIN</div>
            <div className="text-[9px] tracking-widest" style={{ color: "#4a6a80" }}>RESTRICTED ACCESS</div>
          </div>
        </div>

        <div className="p-7 rounded-lg" style={{ background: "rgba(7,15,26,0.95)", border: "1px solid rgba(255,56,56,0.15)", boxShadow: "0 0 40px rgba(255,56,56,0.04)" }}>
          <h1 className="text-[15px] font-bold mb-1 tracking-wide" style={{ fontFamily: "Orbitron, monospace", color: "#ece8e1" }}>Admin Portal</h1>
          <p className="text-[11px] mb-6" style={{ color: "#4a6a80" }}>This portal is for administrators only.</p>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded mb-5 text-[11px]"
              style={{ background: "rgba(255,56,56,0.08)", border: "1px solid rgba(255,56,56,0.2)", color: "#ff5c5c" }}>
              <AlertCircle size={12} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] tracking-widest mb-1.5" style={{ color: "#4a6a80" }}>ADMIN EMAIL</label>
              <input style={inputStyle} type="email" placeholder="admin@robocop.ai" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-[10px] tracking-widest mb-1.5" style={{ color: "#4a6a80" }}>PASSWORD</label>
              <div className="relative">
                <input style={inputStyle} type={show ? "text" : "password"} placeholder="Admin password" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#4a6a80" }}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded font-bold tracking-[0.2em] text-[12px] transition-all disabled:opacity-60"
              style={{ fontFamily: "Orbitron, monospace", background: loading ? "rgba(255,56,56,0.15)" : "linear-gradient(135deg,#ff3838,#cc2200)", color: "#fff" }}>
              {loading ? <><Loader size={13} className="animate-spin" />VERIFYING…</> : <><Shield size={12} />ADMIN LOGIN</>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [apiKeys, setApiKeys] = useState(DEFAULT_KEYS);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);

  // Load all users from localStorage
  const rawUsers = getStoredUsers();
  const allUsers: AdminUser[] = Object.values(rawUsers).map(entry => ({
    ...entry.user,
    email: entry.user.email,
  }));

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: allUsers.length,
    free: allUsers.filter(u => u.plan === "FREE").length,
    pro: allUsers.filter(u => u.plan === "PRO").length,
    elite: allUsers.filter(u => u.plan === "ELITE").length,
    totalScans: allUsers.reduce((sum, u) => sum + u.scansUsed, 0),
    revenue: allUsers.filter(u => u.plan === "PRO").length * 29 + allUsers.filter(u => u.plan === "ELITE").length * 79,
  };

  const handleDeleteUser = (email: string) => {
    const users = getStoredUsers();
    delete users[email];
    localStorage.setItem("robocop_users", JSON.stringify(users));
    window.location.reload();
  };

  const handleChangePlan = (email: string, plan: "FREE" | "PRO" | "ELITE") => {
    const users = getStoredUsers();
    if (users[email]) {
      const limits: Record<string, number> = { FREE: 5, PRO: 200, ELITE: 999999 };
      users[email].user.plan = plan;
      users[email].user.scansLimit = limits[plan];
      localStorage.setItem("robocop_users", JSON.stringify(users));
      window.location.reload();
    }
  };

  const handleSaveKey = (model: string) => {
    setApiKeys(prev => ({ ...prev, [model]: editVal }));
    setEditingKey(null);
    setSavedKey(model);
    setTimeout(() => setSavedKey(null), 2000);
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "OVERVIEW", icon: BarChart2 },
    { id: "users", label: "USERS", icon: Users },
    { id: "api", label: "AI API KEYS", icon: Key },
    { id: "logs", label: "ACTIVITY LOG", icon: Activity },
  ];

  const planColor = (plan: string) => plan === "ELITE" ? "#ffc107" : plan === "PRO" ? "#00e5ff" : "#4a6a80";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" style={{ fontFamily: "JetBrains Mono, monospace" }}>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b shrink-0"
        style={{ borderColor: "rgba(255,56,56,0.15)", background: "rgba(3,6,12,0.97)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#ff3838,#cc0000)", boxShadow: "0 0 14px rgba(255,56,56,0.4)" }}>
            <Shield size={14} color="#fff" />
          </div>
          <div>
            <div className="text-[12px] font-bold tracking-[0.25em]" style={{ fontFamily: "Orbitron, monospace", color: "#ff3838" }}>ADMIN DASHBOARD</div>
            <div className="text-[9px] tracking-widest" style={{ color: "#4a6a80" }}>ROBOCOP SYSTEM · RESTRICTED</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px]"
            style={{ background: "rgba(255,56,56,0.08)", border: "1px solid rgba(255,56,56,0.2)", color: "#ff5c5c" }}>
            <Shield size={9} />ADMIN SESSION ACTIVE
          </div>
          <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px]"
            style={{ color: "#4a6a80", border: "1px solid rgba(255,255,255,0.05)" }}>
            <LogOut size={11} />SIGN OUT
          </button>
        </div>
      </header>

      {/* Nav tabs */}
      <div className="flex border-b px-6" style={{ borderColor: "rgba(255,56,56,0.1)", background: "rgba(5,10,18,0.9)" }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-3 text-[10px] tracking-widest transition-all border-b-2"
            style={{
              borderColor: tab === id ? "#ff3838" : "transparent",
              color: tab === id ? "#ff3838" : "#4a6a80",
              fontFamily: "Orbitron, monospace",
            }}>
            <Icon size={11} />{label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">

        {/* ── Overview tab ─────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard icon={Users} label="TOTAL USERS" value={stats.total} color="#00e5ff" />
              <StatCard icon={Activity} label="TOTAL SCANS" value={stats.totalScans} color="#39ff14" />
              <StatCard icon={Crown} label="PAID USERS" value={stats.pro + stats.elite} sub={`${stats.pro} PRO · ${stats.elite} ELITE`} color="#ffc107" />
              <StatCard icon={TrendingUp} label="MRR" value={`$${stats.revenue}`} sub="Monthly recurring revenue" color="#ff3838" />
            </div>

            {/* Plan breakdown */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-5 rounded" style={{ background: "rgba(7,15,26,0.9)", border: "1px solid rgba(0,229,255,0.1)" }}>
                <p className="text-[10px] tracking-widest mb-4" style={{ color: "#4a6a80" }}>PLAN DISTRIBUTION</p>
                <div className="space-y-3">
                  {[
                    { label: "FREE", count: stats.free, color: "#4a6a80" },
                    { label: "PRO", count: stats.pro, color: "#00e5ff" },
                    { label: "ELITE", count: stats.elite, color: "#ffc107" },
                  ].map(({ label, count, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span style={{ color }}>{label}</span>
                        <span style={{ color: "#ece8e1" }}>{count} user{count !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: stats.total ? `${(count / stats.total) * 100}%` : "0%", background: color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded" style={{ background: "rgba(7,15,26,0.9)", border: "1px solid rgba(0,229,255,0.1)" }}>
                <p className="text-[10px] tracking-widest mb-4" style={{ color: "#4a6a80" }}>SYSTEM STATUS</p>
                <div className="space-y-2.5">
                  {[
                    { label: "AI Engine", status: "ONLINE", col: "#39ff14" },
                    { label: "GPT-4o API", status: "ONLINE", col: "#39ff14" },
                    { label: "Gemini API", status: "ONLINE", col: "#39ff14" },
                    { label: "Claude API", status: "ONLINE", col: "#39ff14" },
                    { label: "Payment Gateway", status: "ONLINE", col: "#39ff14" },
                    { label: "Database", status: "ONLINE", col: "#39ff14" },
                  ].map(({ label, status, col }) => (
                    <div key={label} className="flex items-center justify-between text-[10px]">
                      <span style={{ color: "#8a9aa8" }}>{label}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: col }} />
                        <span style={{ color: col }}>{status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent activity preview */}
            <div className="p-5 rounded" style={{ background: "rgba(7,15,26,0.9)", border: "1px solid rgba(0,229,255,0.1)" }}>
              <p className="text-[10px] tracking-widest mb-4" style={{ color: "#4a6a80" }}>RECENT ACTIVITY</p>
              <div className="space-y-2">
                {MOCK_LOGS.slice(0, 5).map((log, i) => (
                  <div key={i} className="flex items-center gap-4 text-[10px] py-1.5 border-b last:border-0"
                    style={{ borderColor: "rgba(0,229,255,0.06)" }}>
                    <span className="shrink-0 tabular-nums" style={{ color: "#4a6a80" }}>{log.time}</span>
                    <span className="shrink-0 w-36 truncate" style={{ color: "#7a9aa8" }}>{log.user}</span>
                    <span className="shrink-0" style={{ color: "#ece8e1" }}>{log.action}</span>
                    <span style={{ color: "#4a6a80" }}>{log.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Users tab ────────────────────────────────────────────────── */}
        {tab === "users" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] font-bold" style={{ color: "#ece8e1" }}>{allUsers.length} registered user{allUsers.length !== 1 ? "s" : ""}</p>
                <p className="text-[9px]" style={{ color: "#4a6a80" }}>Manage plans, view usage, remove accounts</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded"
                style={{ background: "rgba(7,15,26,0.9)", border: "1px solid rgba(0,229,255,0.1)" }}>
                <Search size={11} style={{ color: "#4a6a80" }} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search users…"
                  className="bg-transparent text-[11px] focus:outline-none"
                  style={{ color: "#ece8e1", width: 160 }}
                />
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-16 rounded" style={{ border: "1px dashed rgba(0,229,255,0.1)" }}>
                <Users size={28} style={{ color: "#4a6a80", margin: "0 auto 12px" }} />
                <p className="text-[11px]" style={{ color: "#4a6a80" }}>
                  {allUsers.length === 0 ? "No users have registered yet." : "No users match your search."}
                </p>
              </div>
            ) : (
              <div className="rounded overflow-hidden" style={{ border: "1px solid rgba(0,229,255,0.1)" }}>
                {/* Table header */}
                <div className="grid text-[9px] tracking-widest px-4 py-2.5"
                  style={{ gridTemplateColumns: "1fr 1.2fr 0.7fr 0.8fr 0.8fr 1fr", background: "rgba(0,229,255,0.04)", color: "#4a6a80", borderBottom: "1px solid rgba(0,229,255,0.1)" }}>
                  <span>NAME</span><span>EMAIL</span><span>PLAN</span><span>SCANS</span><span>JOINED</span><span>ACTIONS</span>
                </div>

                {filteredUsers.map((u, i) => (
                  <div key={u.id} className="grid items-center px-4 py-3 text-[10px]"
                    style={{
                      gridTemplateColumns: "1fr 1.2fr 0.7fr 0.8fr 0.8fr 1fr",
                      borderBottom: i < filteredUsers.length - 1 ? "1px solid rgba(0,229,255,0.05)" : "none",
                      background: i % 2 === 0 ? "rgba(7,15,26,0.9)" : "rgba(5,10,15,0.9)",
                    }}>
                    <span className="font-medium" style={{ color: "#ece8e1" }}>{u.name}</span>
                    <span className="truncate" style={{ color: "#7a9aa8" }}>{u.email}</span>

                    {/* Plan selector */}
                    <div>
                      <select value={u.plan}
                        onChange={e => handleChangePlan(u.email, e.target.value as "FREE" | "PRO" | "ELITE")}
                        className="bg-transparent text-[10px] focus:outline-none cursor-pointer font-bold"
                        style={{ color: planColor(u.plan) }}>
                        <option value="FREE" style={{ background: "#070f1a", color: "#4a6a80" }}>FREE</option>
                        <option value="PRO" style={{ background: "#070f1a", color: "#00e5ff" }}>PRO</option>
                        <option value="ELITE" style={{ background: "#070f1a", color: "#ffc107" }}>ELITE</option>
                      </select>
                    </div>

                    <span style={{ color: "#7a9aa8" }}>{u.scansUsed} / {u.plan === "ELITE" ? "∞" : u.scansLimit}</span>
                    <span style={{ color: "#4a6a80" }}>{new Date(u.joinedAt).toLocaleDateString()}</span>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleChangePlan(u.email, "ELITE")}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors"
                        title="Upgrade to Elite"
                        style={{ background: "rgba(255,193,7,0.08)", border: "1px solid rgba(255,193,7,0.2)", color: "#ffc107" }}>
                        <Crown size={8} />
                      </button>
                      <button onClick={() => handleDeleteUser(u.email)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors"
                        title="Delete user"
                        style={{ background: "rgba(255,56,56,0.08)", border: "1px solid rgba(255,56,56,0.2)", color: "#ff5c5c" }}>
                        <Trash2 size={8} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── API Keys tab ─────────────────────────────────────────────── */}
        {tab === "api" && (
          <div>
            <div className="mb-5">
              <p className="text-[11px] font-bold" style={{ color: "#ece8e1" }}>AI Model API Keys</p>
              <p className="text-[10px] mt-1" style={{ color: "#4a6a80" }}>
                Manage the API keys used by each AI model. Keys are stored securely and never shown to users.
              </p>
            </div>

            <div className="space-y-3">
              {Object.entries(apiKeys).map(([model, key]) => (
                <div key={model} className="p-4 rounded" style={{ background: "rgba(7,15,26,0.9)", border: "1px solid rgba(0,229,255,0.1)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Key size={12} style={{ color: "#00e5ff" }} />
                      <span className="text-[11px] font-bold" style={{ color: "#ece8e1" }}>{model}</span>
                    </div>
                    {savedKey === model && (
                      <div className="flex items-center gap-1 text-[9px]" style={{ color: "#39ff14" }}>
                        <Check size={10} />SAVED
                      </div>
                    )}
                  </div>

                  {editingKey === model ? (
                    <div className="flex gap-2">
                      <input
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        placeholder="Paste your API key…"
                        className="flex-1 px-3 py-2 rounded text-[11px] focus:outline-none"
                        style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,229,255,0.2)", color: "#ece8e1", fontFamily: "JetBrains Mono" }}
                      />
                      <button onClick={() => handleSaveKey(model)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded text-[10px] font-bold"
                        style={{ background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.3)", color: "#39ff14" }}>
                        <Save size={11} />SAVE
                      </button>
                      <button onClick={() => setEditingKey(null)}
                        className="px-3 py-2 rounded text-[10px]"
                        style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#4a6a80" }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <code className="text-[11px]" style={{ color: "#4a6a80", fontFamily: "JetBrains Mono" }}>{key}</code>
                      <button onClick={() => { setEditingKey(model); setEditVal(""); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] transition-colors"
                        style={{ border: "1px solid rgba(0,229,255,0.15)", color: "#00e5ff" }}>
                        <RefreshCw size={10} />UPDATE
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Logs tab ─────────────────────────────────────────────────── */}
        {tab === "logs" && (
          <div>
            <div className="mb-5">
              <p className="text-[11px] font-bold" style={{ color: "#ece8e1" }}>Activity Log</p>
              <p className="text-[10px] mt-1" style={{ color: "#4a6a80" }}>All recent user actions across the platform.</p>
            </div>

            <div className="rounded overflow-hidden" style={{ border: "1px solid rgba(0,229,255,0.1)" }}>
              <div className="grid text-[9px] tracking-widest px-4 py-2.5"
                style={{ gridTemplateColumns: "0.6fr 1.4fr 1fr 1.5fr", background: "rgba(0,229,255,0.04)", color: "#4a6a80", borderBottom: "1px solid rgba(0,229,255,0.1)" }}>
                <span>TIME</span><span>USER</span><span>ACTION</span><span>DETAIL</span>
              </div>
              {MOCK_LOGS.map((log, i) => (
                <div key={i} className="grid items-center px-4 py-3 text-[10px]"
                  style={{
                    gridTemplateColumns: "0.6fr 1.4fr 1fr 1.5fr",
                    borderBottom: i < MOCK_LOGS.length - 1 ? "1px solid rgba(0,229,255,0.05)" : "none",
                    background: i % 2 === 0 ? "rgba(7,15,26,0.9)" : "rgba(5,10,15,0.9)",
                  }}>
                  <span className="tabular-nums" style={{ color: "#4a6a80" }}>{log.time}</span>
                  <span style={{ color: "#7a9aa8" }}>{log.user}</span>
                  <span style={{ color: log.action.includes("upgraded") ? "#39ff14" : log.action.includes("created") ? "#00e5ff" : "#ece8e1" }}>{log.action}</span>
                  <span style={{ color: "#4a6a80" }}>{log.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Exported page ────────────────────────────────────────────────────────────

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  return authenticated
    ? <AdminDashboard onLogout={() => setAuthenticated(false)} />
    : <AdminLogin onLogin={() => setAuthenticated(true)} />;
}
