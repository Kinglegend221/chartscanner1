import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { Cpu, Eye, EyeOff, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[^a-zA-Z0-9]/.test(password) ? 4
    : 3;
  const strengthLabel = ["", "Weak", "Fair", "Strong", "Very Strong"][strength];
  const strengthColor = ["", "#ff3838", "#ffc107", "#39ff14", "#00e5ff"][strength];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    const err = await register(name, email, password);
    setLoading(false);
    if (err) setError(err);
    else navigate("/app");
  };

  const inputStyle = {
    background: "rgba(7,15,26,0.8)",
    border: "1px solid rgba(0,229,255,0.12)",
    color: "#ece8e1",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: "13px",
    outline: "none",
    width: "100%",
    padding: "10px 14px",
    borderRadius: "4px",
  } as const;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#030810", fontFamily: "JetBrains Mono, monospace" }}
    >
      {/* Grid bg */}
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(0,229,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.025) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(0,229,255,0.04) 0%, transparent 70%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ background: "#00e5ff", boxShadow: "0 0 16px rgba(0,229,255,0.5)" }}>
            <Cpu size={14} color="#030810" />
          </div>
          <span className="text-[13px] font-bold tracking-[0.25em]" style={{ fontFamily: "Orbitron, monospace", color: "#00e5ff" }}>
            ROBOCOP SYSTEM
          </span>
        </div>

        {/* Card */}
        <div className="p-8 rounded-lg" style={{ background: "rgba(7,15,26,0.9)", border: "1px solid rgba(0,229,255,0.12)", boxShadow: "0 0 40px rgba(0,229,255,0.04)" }}>
          <h1 className="text-[16px] font-bold mb-1 tracking-wide" style={{ fontFamily: "Orbitron, monospace", color: "#ece8e1" }}>
            Create Account
          </h1>
          <p className="text-[11px] mb-7" style={{ color: "#4a6a80" }}>
            Start with 5 free AI chart scans — no card required.
          </p>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded mb-5 text-[11px]"
              style={{ background: "rgba(255,56,56,0.08)", border: "1px solid rgba(255,56,56,0.2)", color: "#ff5c5c" }}>
              <AlertCircle size={12} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] tracking-widest mb-1.5" style={{ color: "#4a6a80" }}>FULL NAME</label>
              <input style={inputStyle} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div>
              <label className="block text-[10px] tracking-widest mb-1.5" style={{ color: "#4a6a80" }}>EMAIL ADDRESS</label>
              <input style={inputStyle} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div>
              <label className="block text-[10px] tracking-widest mb-1.5" style={{ color: "#4a6a80" }}>PASSWORD</label>
              <div className="relative">
                <input
                  style={inputStyle}
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#4a6a80" }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-0.5 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength ? strengthColor : "rgba(255,255,255,0.08)" }} />
                    ))}
                  </div>
                  <span className="text-[9px]" style={{ color: strengthColor }}>{strengthLabel}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] tracking-widest mb-1.5" style={{ color: "#4a6a80" }}>CONFIRM PASSWORD</label>
              <div className="relative">
                <input
                  style={inputStyle}
                  type="password"
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
                {confirm && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {confirm === password
                      ? <CheckCircle size={14} style={{ color: "#39ff14" }} />
                      : <AlertCircle size={14} style={{ color: "#ff5c5c" }} />}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded font-bold tracking-[0.2em] text-[12px] transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background: loading ? "rgba(0,229,255,0.15)" : "linear-gradient(135deg,#00e5ff,#0099cc)",
                border: "none",
                color: "#030810",
                fontFamily: "Orbitron, monospace",
              }}
            >
              {loading ? (
                <><Loader size={13} className="animate-spin" /> CREATING ACCOUNT…</>
              ) : (
                "CREATE ACCOUNT"
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-[11px]" style={{ color: "#4a6a80" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-bold" style={{ color: "#00e5ff" }}>
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center mt-4 text-[10px]" style={{ color: "#2a4055" }}>
          <Link to="/" style={{ color: "#2a4055" }}>← Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
}
