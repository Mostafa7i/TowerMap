"use client";
import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import {
  LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  Cell, PieChart, Pie
} from "recharts";
import {
  AlertCircle, TrendingUp, Zap, Activity, Clock, Info
} from "lucide-react";
import { getRecommendations } from "./GetRecommendations";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

function getRiskLevel(prob) {
  if (prob >= 75) return { label: "حرج",   color: "#ef4444", bg: "bg-red-500/10",    border: "border-red-500/30",    glow: "#ef4444" };
  if (prob >= 50) return { label: "مرتفع", color: "#f97316", bg: "bg-orange-500/10", border: "border-orange-500/30", glow: "#f97316" };
  if (prob >= 25) return { label: "متوسط", color: "#eab308", bg: "bg-yellow-500/10", border: "border-yellow-500/30", glow: "#eab308" };
  return               { label: "منخفض", color: "#22c55e", bg: "bg-emerald-500/10", border: "border-emerald-500/30", glow: "#22c55e" };
}

function getMetricScore(latency, packetLoss, jitter, throughput) {
  return {
    latencyScore:    clamp(100 - (latency / 2),      0, 100),
    lossScore:       clamp(100 - packetLoss * 10,     0, 100),
    jitterScore:     clamp(100 - jitter * 5,          0, 100),
    throughputScore: clamp((throughput / 100) * 100,  0, 100),
  };
}

// ─── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, decimals = 1, duration = 1000 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const from  = display;
    const to    = parseFloat(value) || 0;
    const animate = (now) => {
      const t    = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * ease);
      if (t < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);
  return <>{display.toFixed(decimals)}</>;
}

// ─── Gauge ─────────────────────────────────────────────────────────────────────
function GaugeChart({ value = 0, size = 180 }) {
  const risk    = getRiskLevel(value);
  const radius  = size / 2 - 20;
  const cx      = size / 2;
  const cy      = size / 2 + 10;
  const vAngle  = Math.PI + (value / 100) * Math.PI;
  const arcPath = (r, sa, ea) => {
    const x1 = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea), y2 = cy + r * Math.sin(ea);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${ea - sa > Math.PI ? 1 : 0} 1 ${x2} ${y2}`;
  };
  const nx = cx + (radius - 10) * Math.cos(vAngle);
  const ny = cy + (radius - 10) * Math.sin(vAngle);
  return (
    <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#22c55e" />
          <stop offset="40%"  stopColor="#eab308" />
          <stop offset="70%"  stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path d={arcPath(radius, Math.PI, 2 * Math.PI)} fill="none" stroke="#1e293b"         strokeWidth="14" />
      <path d={arcPath(radius, Math.PI, vAngle)}       fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round" filter="url(#glow)" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={risk.color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill={risk.color} />
      <text x={cx + radius * Math.cos(Math.PI) - 4} y={cy + radius * Math.sin(Math.PI) + 4} fill="#475569" fontSize="9" fontFamily="monospace">0</text>
      <text x={cx + radius * Math.cos(2*Math.PI) + 2} y={cy + radius * Math.sin(2*Math.PI) + 4} fill="#475569" fontSize="9" fontFamily="monospace">100</text>
    </svg>
  );
}

// ─── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, unit, icon: Icon, score, contribution }) {
  const scoreColor = score >= 70 ? "text-emerald-400" : score >= 40 ? "text-yellow-400" : "text-red-400";
  const scoreBg    = score >= 70 ? "bg-emerald-500"   : score >= 40 ? "bg-yellow-500"   : "bg-red-500";
  const scoreHex   = score >= 70 ? "#22c55e"          : score >= 40 ? "#eab308"          : "#ef4444";
  return (
    <div className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-2 hover:border-slate-600/50 transition-all duration-200 backdrop-blur-sm">
      <div className="flex justify-between items-start gap-2 mb-3">
        <div>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-1">{label}</p>
          <p className="text-md font-bold text-slate-100 font-mono">
            {value != null ? <AnimatedNumber value={value} /> : "—"}
            <span className="text-xs text-slate-500 ml-1">{unit}</span>
          </p>
        </div>
        {Icon && <Icon className="text-slate-400 group-hover:text-slate-300 transition-colors" size={20} />}
      </div>
      <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
        <div className={`h-full ${scoreBg} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${score || 0}%`, boxShadow: `0 0 8px ${scoreHex}` }} />
      </div>
      <div className="flex justify-between items-center mt-2">
        <p className="text-[9px] text-slate-500 font-mono">HEALTH SCORE</p>
        <p className={`text-xs font-mono font-bold ${scoreColor}`}>{score?.toFixed(0)}%</p>
      </div>
      {/* AI contribution — يظهر بس لو عندنا نتيجة */}
      {contribution != null && (
        <div className="flex justify-between items-center mt-1 border-t border-slate-700/30 pt-1">
          <p className="text-[8px] text-slate-600 font-mono">AI WEIGHT</p>
          <p className="text-[9px] font-mono font-bold" style={{ color: contribution > 30 ? "#f87171" : "#475569" }}>
            {contribution}pt
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-950 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-400 text-xs font-mono mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-mono" style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(2) : p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ─── Risk Badge ────────────────────────────────────────────────────────────────
function RiskBadge({ prob, hardOverride }) {
  const risk = getRiskLevel(prob);
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${risk.bg} border ${risk.border} backdrop-blur-sm`}>
      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: risk.color, boxShadow: `0 0 10px ${risk.glow}` }} />
      <span className="text-xs font-mono font-bold" style={{ color: risk.color }}>{risk.label}</span>
      {hardOverride && (
        <span className="text-[8px] font-mono text-slate-500 border border-slate-700 px-1 rounded">HARD RULE</span>
      )}
    </div>
  );
}

// ─── Ensemble Bar (جديد) ───────────────────────────────────────────────────────
function EnsembleBar({ scores = [] }) {
  const names   = ["Model A", "Model B", "Model C"];
  const weights = ["40%",     "30%",     "30%"];
  const colors  = ["#38bdf8", "#a78bfa", "#34d399"];
  return (
    <div className="space-y-2.5">
      {scores.map((s, i) => {
        const pct = (s * 100).toFixed(1);
        return (
          <div key={i}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-mono text-slate-500">
                {names[i]} <span className="text-slate-700">({weights[i]})</span>
              </span>
              <span className="text-[10px] font-mono font-bold" style={{ color: colors[i] }}>{pct}%</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: colors[i], boxShadow: `0 0 6px ${colors[i]}60` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function Analyze({ setTowerAiResults}) {
  const [towers, setTowers]               = useState([]);
  const [selectedTowerId, setSelectedTowerId] = useState("");
  const [networkStats, setNetworkStats]   = useState(null);
  const [result, setResult]               = useState(null);
  const [loading, setLoading]             = useState(false);
  const [history, setHistory]             = useState([]);
  const [error, setError]                 = useState("");
  const [activeTab, setActiveTab]         = useState("overview");
  const hasAnalyzed = useRef(false);
  // ── Load towers ──
  useEffect(() => {
    API.get("/towerMap/getTower")
      .then(res => { if (res.data.success) setTowers(res.data.data); })
      .catch(() => setError("فشل في تحميل قائمة الأبراج."));
  }, []);

  // ── Poll selected tower ──
  useEffect(() => {
    if (!selectedTowerId) { hasAnalyzed.current = false; return; }
    hasAnalyzed.current = false;

    const fetchTowerData = async () => {
      try {
        const res = await API.get(`/towerMap/getOneTower/${selectedTowerId}?t=${Date.now()}`);
        if (res.data?.lastMeasurement) {
          const { latency, packetLoss, jitter, throughput } = res.data.lastMeasurement;
          const stats = {
            latency:    parseFloat(latency),
            packetLoss: parseFloat(packetLoss),  // % مباشرة — متوافق مع aiModel v4
            jitter:     parseFloat(jitter),
            throughput: parseFloat(throughput),
          };
          setNetworkStats(stats);
          if (!hasAnalyzed.current) {
            hasAnalyzed.current = true;
            triggerAnalysis([stats.latency, stats.packetLoss, stats.jitter, stats.throughput]);
          }
        }
      } catch (e) { console.error("Polling error:", e); }
    };

    fetchTowerData();
    const iv = setInterval(fetchTowerData, 5000);
    return () => clearInterval(iv);
  }, [selectedTowerId]);

  // ── Analysis ──
  const triggerAnalysis = async (statsArray) => {
    setLoading(true);
    try {
      const res = await API.post("/ai/analyze", { stats: statsArray });
      if (res.data.success) {
        const data = res.data.data;
        setResult(data);

        // timestamp مع seconds
        const ts = new Date().toLocaleTimeString("ar-EG", {
          hour: "2-digit", minute: "2-digit", second: "2-digit"
        });

        setHistory(prev => [...prev, {
          time:      ts,
          prob:      parseFloat(data.probability),
          riskLevel: data.riskLevel,           // من النموذج مباشرة
          latency:   statsArray[0],
          packetLoss:statsArray[1],
          jitter:    statsArray[2],
          throughput:statsArray[3],
        }].slice(-30));

        setTowerAiResults(prev => ({ ...prev, [selectedTowerId]: data }));
      }
    } catch (e) {
      console.error("Analysis failed:", e);
      setError("فشل في تحليل بيانات البرج.");
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ──
  const prob          = result ? parseFloat(result.probability) || 0 : 0;
  const isAnomaly     = result?.isAnomaly ?? false;
  const risk          = getRiskLevel(prob);
  const contrib       = result?.contributions ?? null;
  const scores        = networkStats
    ? getMetricScore(networkStats.latency, networkStats.packetLoss, networkStats.jitter, networkStats.throughput)
    : null;
  const overallHealth = scores
    ? ((scores.latencyScore + scores.lossScore + scores.jitterScore + scores.throughputScore) / 4).toFixed(1)
    : null;
  const radarData     = scores ? [
    { metric: "Latency",     value: scores.latencyScore    },
    { metric: "Packet Loss", value: scores.lossScore       },
    { metric: "Jitter",      value: scores.jitterScore     },
    { metric: "Throughput",  value: scores.throughputScore },
  ] : [];
  const pieData       = result ? [
    { name: "خطر", value: prob,       color: risk.color },
    { name: "آمن", value: 100 - prob, color: "#1e293b"  },
  ] : [];
  const avgProb       = history.length
    ? (history.reduce((s, h) => s + h.prob, 0) / history.length).toFixed(1)
    : "—";

  const TABS = [
    { id: "overview", label: "نظرة عامة",   icon: "⬡" },
    { id: "ai",       label: "تفاصيل AI",   icon: "🤖" },
    { id: "charts",   label: "الرسوم",       icon: "◈" },
    { id: "radar",    label: "تحليل الأداء", icon: "◎" },
    { id: "history",  label: "السجل",        icon: "◷" },
  ];

const recs = getRecommendations(networkStats, prob, isAnomaly);
  return (
    <div className="min-h-screen text-slate-100 relative" dir="rtl">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .animate-fadeIn { animation: fadeIn 0.4s ease forwards; }
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#0a1628}
        ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
      `}</style>

      {/* BG blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">

        {/* ── HEADER ── */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/30">
              📡
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">لوحة تحليل المخاطر</h1>
              <p className="text-xs text-slate-400 font-mono mt-1 tracking-widest">SMART NETWORK RISK INTELLIGENCE — AI v4.0</p>
            </div>
          </div>

          {result && (
            <div className="flex items-center gap-4 animate-fadeIn">
              <RiskBadge prob={prob} hardOverride={result.hardOverride} />
              <div className="text-right">
                <p className="text-xs text-slate-500 font-mono">RISK PROBABILITY</p>
                <p className="text-2xl font-bold font-mono" style={{ color: risk.color }}>
                  <AnimatedNumber value={prob} />%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1  lg:grid-cols-4 gap-4">
 
          {/* ── LEFT PANEL ── */}
          <div className="lg:col-span-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-sm space-y-5">

            {/* Tower selector */}
  <div>
  <p className="text-xs text-cyan-400 font-mono uppercase tracking-widest mb-3">◈ اختيار البرج</p>
  
  <div className="flex flex-col gap-3">
    {/* القائمة المنسدلة */}
    <select
      value={selectedTowerId}
      onChange={e => { 
        setSelectedTowerId(e.target.value); 
        setResult(null); 
        setHistory([]); 
        setError(""); 
      }}
      className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-100 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
    >
      <option value="">اختر برجاً للفحص...</option>
      {towers.map(t => <option key={t._id} value={t._id}>{t.TowerName}</option>)}
    </select>

    {/* زر الفحص - يظهر في الموبايل فقط */}
    <button 
      onClick={() => {
        if (!selectedTowerId) {
            setError("يرجى اختيار برج أولاً");
            return;
        }
     
        triggerAnalysis([networkStats.latency, networkStats.packetLoss, networkStats.jitter, networkStats.throughput]);
      }}
      className="md:hidden w-full py-3 px-4 bg-linear-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
    >
      <Zap size={16} />
      بدء فحص البرج الآن
    </button>
  </div>
</div>
            {/* Loading bar */}
            {loading && (
              <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-linear-to-r from-cyan-500 to-indigo-500 rounded-full animate-pulse" />
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-3 items-start">
                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                <span className="text-xs text-red-300">{error}</span>
              </div>
            )}

            {/* Metric cards */}
            {networkStats && scores && (
              <>
                <div>
                  <p className="text-xs text-cyan-400 font-mono uppercase tracking-widest mb-3">◈ قياسات البرج</p>
                  <div className="grid grid-cols-2 gap-2">
                    <MetricCard label="Latency"     value={networkStats.latency}    unit="ms"   icon={Clock}      score={scores.latencyScore}    contribution={contrib?.latency}    />
                    <MetricCard label="Packet Loss" value={networkStats.packetLoss} unit="%"    icon={Activity}   score={scores.lossScore}       contribution={contrib?.packetLoss} />
                    <MetricCard label="Jitter"      value={networkStats.jitter}     unit="ms"   icon={TrendingUp} score={scores.jitterScore}     contribution={contrib?.jitter}     />
                    <MetricCard label="Throughput"  value={networkStats.throughput} unit="Mbps" icon={Zap}        score={scores.throughputScore}  contribution={contrib?.throughput} />
                  </div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] text-slate-400 font-mono">OVERALL HEALTH</span>
                    <span className="text-sm font-bold font-mono" style={{ color: overallHealth >= 70 ? "#22c55e" : overallHealth >= 40 ? "#eab308" : "#ef4444" }}>
                      {overallHealth}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${overallHealth}%`,
                        background: overallHealth >= 70 ? "#22c55e" : overallHealth >= 40 ? "#eab308" : "#ef4444",
                        boxShadow: `0 0 8px ${overallHealth >= 70 ? "#22c55e" : overallHealth >= 40 ? "#eab308" : "#ef4444"}60`,
                      }} />
                  </div>
                </div>
              </>
            )}

            {/* Result card */}
            {result && (
              <div className={`rounded-xl p-5 border backdrop-blur-sm animate-fadeIn ${isAnomaly ? "bg-red-500/10 border-red-500/30" : "bg-emerald-500/10 border-emerald-500/30"}`}>
                <div className="flex gap-3 items-center mb-3">
                  <span className="text-3xl">{isAnomaly ? "⚠️" : "✅"}</span>
                  <div>
                    <p className="text-[9px] text-slate-400 font-mono">NETWORK STATUS</p>
                    <p className={`text-base font-bold ${isAnomaly ? "text-red-400" : "text-emerald-400"}`}>
                      {isAnomaly ? "خطر مكتشف" : "الشبكة آمنة"}
                    </p>
                  </div>
                </div>
                <div className="flex justify-center my-3">
                  <GaugeChart value={prob} size={190} />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-[9px] text-slate-400 font-mono">احتمالية الخطر</p>
                  <p className="text-3xl font-bold font-mono" style={{ color: risk.color }}>
                    <AnimatedNumber value={prob} />%
                  </p>
                  <RiskBadge prob={prob} hardOverride={result.hardOverride} />
                </div>

                {/* Confidence */}
                {result.confidence != null && (
                  <div className="mt-3 border-t border-slate-700/30 pt-3">
                    <div className="flex justify-between text-[8px] font-mono text-slate-600 mb-1">
                      <span>MODEL CONFIDENCE</span>
                      <span>{(result.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-0.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full transition-all duration-700"
                        style={{ width: `${result.confidence * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="lg:col-span-3  space-y-4">

            {/* Tabs */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-1.5 backdrop-blur-sm flex gap-1 flex-wrap">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "bg-slate-700/50 text-cyan-400 border border-slate-600/50"
                      : "text-slate-400 hover:text-slate-300 hover:bg-slate-700/20"
                  }`}>
                  <span>{tab.icon}</span>{tab.label}
                </button>
              ))}
            </div>

            {/* ══ OVERVIEW ══ */}
            {activeTab === "overview" && (
              <div className="space-y-4 animate-fadeIn">
                {!result ? (
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-20 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                    <div className="text-6xl opacity-10">📡</div>
                    <p className="text-slate-400 font-mono text-sm">اختر برجاً لبدء التحليل</p>
                  </div>
                ) : (
                  <>
                    {/* KPI row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "درجة الخطر",   value: prob.toFixed(1),  unit: "%",  color: risk.color },
                        { label: "صحة الشبكة",   value: overallHealth,    unit: "%",  color: overallHealth >= 70 ? "#22c55e" : "#eab308" },
                        { label: "عمليات الفحص", value: history.length,   unit: "",   color: "#38bdf8" },
                        { label: "متوسط الخطر",  value: avgProb,          unit: "%",  color: "#a78bfa" },
                      ].map((kpi, i) => (
                        <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center backdrop-blur-sm">
                          <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest mb-2">{kpi.label}</p>
                          <p className="text-2xl font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</p>
                          <p className="text-[9px] text-slate-600 font-mono mt-1">{kpi.unit}</p>
                        </div>
                      ))}
                    </div>

                    {/* Pie + bar */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm flex flex-col items-center">
                        <p className="text-[9px] text-cyan-400 font-mono uppercase tracking-widest mb-3">توزيع المخاطر</p>
                        <PieChart width={170} height={170}>
                          <Pie data={pieData} cx={85} cy={85} innerRadius={52} outerRadius={75} paddingAngle={3} dataKey="value">
                            {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                        </PieChart>
                        <div className="flex gap-4 mt-2">
                          {pieData.map((d, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                              <span className="text-[9px] text-slate-400 font-mono">{d.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm">
                        <p className="text-[9px] text-cyan-400 font-mono uppercase tracking-widest mb-3">مؤشرات الجودة</p>
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={radarData} barSize={24}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="metric" tick={{ fill: "#475569", fontSize: 10, fontFamily: "monospace" }} />
                            <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 10, fontFamily: "monospace" }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="الصحة" radius={[4, 4, 0, 0]}>
                              {radarData.map((e, i) => (
                                <Cell key={i} fill={e.value >= 70 ? "#22c55e" : e.value >= 40 ? "#eab308" : "#ef4444"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
  
            {/* ══ AI DETAILS TAB*/}
            {activeTab === "ai" && (
              <div className="space-y-4 animate-fadeIn">
                {!result ? (
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-20 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                    <div className="text-5xl opacity-10">🤖</div>
                    <p className="text-slate-400 font-mono text-sm">نفّذ تحليلاً لعرض تفاصيل النموذج</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Ensemble scores */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm">
                      <p className="text-[9px] text-cyan-400 font-mono uppercase tracking-widest mb-4">🤖 نتائج الـ Ensemble</p>
                      {result.subModelScores?.length ? (
                        <EnsembleBar scores={result.subModelScores} />
                      ) : (
                        <div className="flex items-center gap-2 text-slate-600 text-xs font-mono">
                          <Info size={12}/> غير متوفر
                        </div>
                      )}

                      <div className="mt-4 border-t border-slate-700/50 pt-4 space-y-2.5">
                        {[
                          { label: "Raw Score (Weighted)",  value: result.rawScore,    color: "#94a3b8" },
                          { label: "Calibrated Score",       value: result.calibrated,  color: "#94a3b8" },
                          { label: "Decision Threshold",     value: result.threshold,   color: "#38bdf8" },
                          { label: "Model Confidence",
                            value: result.confidence != null ? `${(result.confidence*100).toFixed(0)}%` : "—",
                            color: "#a78bfa" },
                          { label: "Hard Override",
                            value: result.hardOverride ? "✓ نعم" : "لا",
                            color: result.hardOverride ? "#f87171" : "#475569" },
                          { label: "Model Version",          value: `v${result.modelVersion ?? "—"}`, color: "#64748b" },
                          { label: "Feature Dimensions",     value: `${result.featureDim ?? "—"} features`, color: "#64748b" },
                          { label: "Ensemble Size",          value: `${result.ensembleSize ?? "—"} models`, color: "#64748b" },
                        ].map((row, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span className="text-[9px] font-mono text-slate-500">{row.label}</span>
                            <span className="text-[10px] font-mono font-bold" style={{ color: row.color }}>{row.value ?? "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Feature contributions */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm">
                      <p className="text-[9px] text-cyan-400 font-mono uppercase tracking-widest mb-4">📊 تأثير كل مقياس على قرار النموذج</p>
                      {contrib ? (
                        <div className="space-y-4">
                          {[
                            { name: "Latency",     value: contrib.latency,    color: "#38bdf8", icon: "⏱" },
                            { name: "Packet Loss", value: contrib.packetLoss, color: "#f87171", icon: "📦" },
                            { name: "Jitter",      value: contrib.jitter,     color: "#a78bfa", icon: "〰" },
                            { name: "Throughput",  value: contrib.throughput, color: "#34d399", icon: "⚡" },
                          ].map(m => (
                            <div key={m.name}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-mono text-slate-400">{m.icon} {m.name}</span>
                                <span className="text-[10px] font-mono font-bold" style={{ color: m.color }}>{m.value}pt</span>
                              </div>
                              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${Math.min(m.value, 100)}%`,
                                    background: m.color,
                                    boxShadow: `0 0 6px ${m.color}60`,
                                  }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-600 text-xs font-mono mt-2">
                          <Info size={12}/> غير متوفر في هذه النسخة
                        </div>
                      )}

                      {/* Risk classification from model */}
                      <div className="mt-5 border-t border-slate-700/50 pt-4">
                        <p className="text-[9px] font-mono text-slate-500 mb-2">RISK CLASSIFICATION (from model)</p>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${risk.bg} ${risk.border}`}>
                          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: risk.color }} />
                          <span className="text-xs font-mono font-bold" style={{ color: risk.color }}>
                            {result.riskLevel} — {risk.label}
                          </span>
                        </div>
                        {result.hardOverride && (
                          <p className="text-[9px] font-mono text-red-400 mt-2">
                            ⚠️ القيم تجاوزت الحد الأقصى — تم تفعيل الـ Hard Rule Override
                          </p>
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}
  
        {/* ══ CHARTS TAB ══ */}
{activeTab === "charts" && (
  <div className="space-y-4 animate-fadeIn">
    {/* Header with Refresh Button */}
    <div className="flex justify-between items-center bg-slate-800/50 border border-slate-700/50 rounded-2xl px-5 py-3 backdrop-blur-sm">
      <div>
        <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
          <TrendingUp size={16} className="text-cyan-400" /> تحليل الاتجاهات (Real-time)
        </h3>
        <p className="text-[10px] text-slate-500 font-mono mt-0.5">مراقبة حية لمقاييس الأداء خلال آخر 30 فحص</p>
      </div>
      
      <button 
        onClick={() => {
          if (networkStats) {
            triggerAnalysis([networkStats.latency, networkStats.packetLoss, networkStats.jitter, networkStats.throughput]);
          }
        }}
        disabled={loading || !selectedTowerId}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all
          ${loading 
            ? "bg-slate-700 text-slate-500 cursor-not-allowed" 
            : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 active:scale-95 shadow-lg shadow-cyan-500/10"
          }`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          "🔄 تحديث الفحص"
        )}
      </button>
    </div>

    {/* Probability Chart */}
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm">
      <p className="text-[9px] text-cyan-400 font-mono uppercase tracking-widest mb-6">تطور احتمالية الخطر (%)</p>
      <div className="h-62.5 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <defs>
              <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="time" tick={{fill: '#475569', fontSize: 10, fontFamily: 'monospace'}} />
            <YAxis domain={[0, 100]} tick={{fill: '#475569', fontSize: 10, fontFamily: 'monospace'}} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="prob" name="Risk %" stroke="#ef4444" fillOpacity={1} fill="url(#colorProb)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Latency History */}
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm">
      <p className="text-[9px] text-cyan-400 font-mono uppercase tracking-widest mb-6">تاريخ زمن الاستجابة (Latency ms)</p>
      <div className="h-62.5 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="time" tick={{fill: '#475569', fontSize: 10, fontFamily: 'monospace'}} />
            <YAxis tick={{fill: '#475569', fontSize: 10, fontFamily: 'monospace'}} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="stepAfter" dataKey="latency" name="Latency" stroke="#38bdf8" strokeWidth={2} dot={false} />
            <ReferenceLine y={150} label={{ value: 'CRITICAL', fill: '#ef4444', fontSize: 9 }} stroke="#ef4444" strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
)}

            {/* ══ RADAR ══ */}
            {activeTab === "radar" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fadeIn">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm">
                  <p className="text-[9px] text-cyan-400 font-mono uppercase tracking-widest mb-4">◎ مخطط الأداء الشبكي</p>
                  {radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "monospace" }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#334155", fontSize: 9 }} />
                        <Radar name="الصحة" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.15} strokeWidth={2} />
                        <Legend wrapperStyle={{ color: "#64748b", fontSize: 11, fontFamily: "monospace" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-500 font-mono text-sm">نفّذ فحصاً لعرض البيانات</div>
                  )}
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm">
                  <p className="text-[9px] text-cyan-400 font-mono uppercase tracking-widest mb-4">◎ تقرير الصحة التفصيلي</p>
                  {scores ? (
                    <div className="space-y-4">
                      {[
                        { name: "Latency",     score: scores.latencyScore,    raw: networkStats.latency,    unit: "ms",   icon: "⏱" },
                        { name: "Packet Loss", score: scores.lossScore,       raw: networkStats.packetLoss, unit: "%",    icon: "📦" },
                        { name: "Jitter",      score: scores.jitterScore,     raw: networkStats.jitter,     unit: "ms",   icon: "〰" },
                        { name: "Throughput",  score: scores.throughputScore, raw: networkStats.throughput, unit: "Mbps", icon: "⚡" },
                      ].map(m => {
                        const c = m.score >= 70 ? "#22c55e" : m.score >= 40 ? "#eab308" : "#ef4444";
                        return (
                          <div key={m.name}>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-sm text-slate-300 font-mono flex gap-2 items-center">{m.icon} {m.name}</span>
                              <div className="flex gap-3 items-center">
                                <span className="text-[10px] text-slate-500 font-mono">{m.raw}{m.unit}</span>
                                <span className="text-sm font-bold font-mono" style={{ color: c }}>{m.score.toFixed(0)}%</span>
                              </div>
                            </div>
                            <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-1000"
                                style={{ width: `${m.score}%`, background: c, boxShadow: `0 0 6px ${c}` }} />
                            </div>
                          </div>
                        );
                      })}
                      <div className="border-t border-slate-700/50 pt-4 flex justify-between items-center">
                        <span className="text-[9px] text-slate-400 font-mono">OVERALL HEALTH</span>
                        <span className="text-lg font-bold font-mono" style={{ color: overallHealth >= 70 ? "#22c55e" : "#eab308" }}>
                          {overallHealth}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 font-mono text-sm">اختر برجاً لعرض التقرير</p>
                  )}
                </div>
              </div>
            )}

            {/* ══ HISTORY ══ */}
            {activeTab === "history" && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm animate-fadeIn">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[9px] text-cyan-400 font-mono uppercase tracking-widest">◷ سجل عمليات الفحص</p>
                  {history.length > 0 && (
                    <button onClick={() => setHistory([])}
                      className="text-[9px] font-mono text-slate-600 hover:text-red-400 transition-colors border border-slate-700 hover:border-red-500/30 px-2 py-1 rounded-lg">
                      مسح
                    </button>
                  )}
                </div>
                {history.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-mono text-sm">لا توجد بيانات سجل بعد</div>
                ) : (
                  <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
                    {[...history].reverse().map((h, i) => {
                      const r = getRiskLevel(h.prob);
                      return (
                        <div key={i} className="grid grid-cols-7 gap-2 items-center bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2 text-[10px] font-mono hover:border-slate-600/50 transition-colors">
                          <span className="text-slate-700">#{history.length - i}</span>
                          <span className="text-slate-500 text-[9px]">{h.time}</span>
                          <span className="text-sky-400">L:{h.latency}ms</span>
                          <span className="text-red-400">PL:{h.packetLoss}%</span>
                          <span className="text-violet-400">J:{h.jitter}ms</span>
                          <span className="text-emerald-400">T:{h.throughput}M</span>
                          <div className={`px-1.5 py-0.5 rounded text-center font-bold text-[9px] ${r.bg} border ${r.border}`}
                            style={{ color: r.color }}>
                            {h.prob.toFixed(1)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {result && (


      <div className="fade-up">
         <div className="flex items-center gap-3 my-6">
          <h2 className="font-bold text-white">توصيات الذكاء الاصطناعي 🤖</h2>
          <div className="flex-1 h-px bg-linear-to-l from-transparent via-slate-700 to-transparent" />
          
        </div>

              <div className="space-y-3">
                {recs.map((r, i) => (
                  <div key={i} className={`flex items-start gap-4 rounded-2xl border px-5 py-4 ${
                    r.type==="critical"?"bg-red-500/5 border-red-500/20":r.type==="warning"?"bg-yellow-500/5 border-yellow-500/20":"bg-emerald-500/5 border-emerald-500/20"
                  }`}>
                    <span className="text-2xl shrink-0 mt-0.5">{r.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-200">{r.text}</p>
                      <p className={`text-[10px] mono mt-1 ${r.type==="critical"?"text-red-500":r.type==="warning"?"text-yellow-500":"text-emerald-500"}`}>
                        {r.type==="critical"?"🔴 أولوية قصوى":r.type==="warning"?"🟡 تحتاج متابعة":"🟢 حالة مثلى"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}