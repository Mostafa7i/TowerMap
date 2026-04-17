import React, { useState, useEffect, useRef, useCallback } from "react";
import API from "../services/api";

// ─── Icons (inline SVG to avoid dependency issues) ────────────────────────────
const Icon = {
  Zap:      (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Power:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>,
  Save:     (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Refresh:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Warning:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Check:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Reset:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
  Activity: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Skull:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a9 9 0 0 1 9 9c0 3.18-1.65 5.97-4.13 7.56L16 21H8l-.87-2.44A9 9 0 0 1 3 11a9 9 0 0 1 9-9z"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M10 17h4"/></svg>,
  Flame:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  Shield:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Terminal: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  Globe:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
};

// ─── Presets ───────────────────────────────────────────────────────────────────
const PRESETS = [
  { id: "normal",   label: "طبيعي",     icon: "🟢", values: { latency: 20,  throughput: 100, packetLoss: 0,   jitter: 2   }, color: "#10b981" },
  { id: "degraded", label: "متدهور",    icon: "🟡", values: { latency: 80,  throughput: 40,  packetLoss: 5,   jitter: 15  }, color: "#f59e0b" },
  { id: "dead",     label: "إيقاف",     icon: "🔴", values: { latency: 999, throughput: 0,   packetLoss: 100, jitter: 500 }, color: "#ef4444" },
];

const METRICS = [
  { key: "latency",    label: "Latency",    unit: "ms",   info: "زمن الاستجابة — الأقل أفضل", min: 0, max: 1000, warn: 100, crit: 300, color: "#38bdf8" },
  { key: "throughput", label: "Throughput", unit: "Mbps", info: "سرعة النقل — الأعلى أفضل",   min: 0, max: 1000, warn: 30,  crit: 10,  color: "#34d399", inverse: true },
  { key: "packetLoss", label: "Pkt Loss",   unit: "%",    info: "فقدان الحزم — الأقل أفضل",   min: 0, max: 100,  warn: 5,   crit: 20,  color: "#f87171" },
  { key: "jitter",     label: "Jitter",     unit: "ms",   info: "تذبذب الإشارة — الأقل أفضل", min: 0, max: 500,  warn: 20,  crit: 100, color: "#a78bfa" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getMetricStatus(key, value, inverse = false) {
  const m = METRICS.find(x => x.key === key);
  if (!m) return "ok";
  if (inverse) {
    if (value <= m.crit) return "crit";
    if (value <= m.warn) return "warn";
    return "ok";
  }
  if (value >= m.crit) return "crit";
  if (value >= m.warn) return "warn";
  return "ok";
}

function getTowerHealth(data) {
  if (!data) return 100;
  const statuses = METRICS.map(m => getMetricStatus(m.key, Number(data[m.key]), m.inverse));
  const crits = statuses.filter(s => s === "crit").length;
  const warns = statuses.filter(s => s === "warn").length;
  return Math.max(0, 100 - crits * 30 - warns * 10);
}

// ─── MiniSparkline ─────────────────────────────────────────────────────────────
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const W = 80, H = 24;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── MetricSlider ──────────────────────────────────────────────────────────────
function MetricSlider({ metric, value, onChange }) {
  const numVal = Number(value) || 0;
  const status = getMetricStatus(metric.key, numVal, metric.inverse);
  const pct = Math.min((numVal - metric.min) / (metric.max - metric.min), 1) * 100;

  const statusColor = status === "crit" ? "#ef4444" : status === "warn" ? "#f59e0b" : metric.color;
  const statusLabel = status === "crit" ? "حرج" : status === "warn" ? "تحذير" : "طبيعي";

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
          <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: "#64748b" }}>{metric.label}</span>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
          style={{ color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}25` }}>
          {statusLabel}
        </span>
      </div>

      {/* Value display + input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            value={value}
            min={metric.min}
            max={metric.max}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-[#0a1628] border rounded-lg px-3 py-2 text-sm font-mono font-bold outline-none transition-all pr-10"
            style={{
              color: statusColor,
              borderColor: `${statusColor}40`,
              boxShadow: status !== "ok" ? `0 0 12px ${statusColor}15` : "none",
            }}
          />
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-mono" style={{ color: "#334155" }}>
            {metric.unit}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full" style={{ background: "#1e293b" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: statusColor, boxShadow: `0 0 6px ${statusColor}50` }} />
      </div>

      {/* Hint */}
      <p className="text-[9px] font-mono" style={{ color: "#334155" }}>{metric.info}</p>
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-mono shadow-xl transition-all"
          style={{
            background: t.type === "success" ? "rgba(16,185,129,0.1)" : t.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(14,165,233,0.1)",
            borderColor: t.type === "success" ? "#10b98140" : t.type === "error" ? "#ef444440" : "#0ea5e940",
            color: t.type === "success" ? "#34d399" : t.type === "error" ? "#f87171" : "#38bdf8",
            animation: "slideIn 0.3s ease",
          }}>
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✗" : "ℹ"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── TowerCard ─────────────────────────────────────────────────────────────────
function TowerCard({ tower, data, onChange, onApply, onKill, onReset, onPreset, loading, log }) {
  const [collapsed, setCollapsed] = useState(false);
  const [confirmKill, setConfirmKill] = useState(false);
  const health = getTowerHealth(data);
  const healthColor = health === 100 ? "#10b981" : health >= 80 ? "#f59e0b" : "#ef4444";
  const isDead = data?.latency >= 999 || data?.packetLoss >= 99;

  return (
    <div className="rounded-2xl border overflow-hidden transition-all duration-300"
      style={{
        background: "linear-gradient(135deg, #0a1628 0%, #0d1b34 100%)",
        borderColor: isDead ? "#ef444430" : health < 50 ? "#f59e0b30" : "#1e293b",
        boxShadow: isDead ? "0 0 32px rgba(239,68,68,0.08)" : "none",
      }}>

      {/* ── Top accent bar ── */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${healthColor}, transparent)` }} />

      {/* ── Card Header ── */}
      <div className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none"
        onClick={() => setCollapsed(c => !c)}>

        {/* Status dot + name */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${healthColor}12`, border: `1px solid ${healthColor}30` }}>
            <Icon.Globe className="w-5 h-5" style={{ color: healthColor }} />
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a1628]"
            style={{ background: healthColor, boxShadow: `0 0 8px ${healthColor}` }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-100 font-mono tracking-wide truncate">{tower.TowerName}</h3>
            {isDead && (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">OFFLINE</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] font-mono text-slate-600">{tower.ip_address}</span>
            {tower.vendor && <span className="text-[9px] font-mono text-slate-700 uppercase">{tower.vendor}</span>}
          </div>
        </div>

        {/* Health gauge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">Health</p>
            <p className="text-lg font-black font-mono" style={{ color: healthColor }}>{health}%</p>
          </div>
          {/* Mini radial */}
          <svg width="36" height="36" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="3" />
            <circle cx="18" cy="18" r="14" fill="none" stroke={healthColor} strokeWidth="3"
              strokeDasharray={`${(health / 100) * 88} 88`} strokeLinecap="round"
              transform="rotate(-90 18 18)"
              style={{ filter: `drop-shadow(0 0 4px ${healthColor})`, transition: "stroke-dasharray 0.8s ease" }} />
          </svg>

          {/* Collapse arrow */}
          <span className="text-slate-700 text-xs transition-transform duration-300" style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>▾</span>
        </div>
      </div>

      {/* ── Collapsed: sparkline row ── */}
      {collapsed && (
        <div className="px-5 pb-4 flex items-center gap-6">
          {METRICS.map(m => (
            <div key={m.key} className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-slate-700">{m.label}</span>
              <span className="text-xs font-mono font-bold" style={{ color: m.color }}>
                {Number(data?.[m.key] || 0).toFixed(1)} {m.unit}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Expanded body ── */}
      {!collapsed && (
        <div className="px-5 pb-5 space-y-5">

          {/* Presets row */}
          <div>
            <p className="text-[9px] font-mono text-slate-700 uppercase tracking-widest mb-2">⚡ سيناريوهات سريعة</p>
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map(p => (
                <button key={p.id} onClick={() => onPreset(tower.ip_address, p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all hover:scale-105 active:scale-95"
                  style={{ background: `${p.color}12`, border: `1px solid ${p.color}30`, color: p.color }}>
                  <span>{p.icon}</span> {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {METRICS.map(m => (
              <MetricSlider
                key={m.key}
                metric={m}
                value={data?.[m.key] ?? 0}
                onChange={val => onChange(tower.ip_address, m.key, val)}
              />
            ))}
          </div>

          {/* Log */}
          {log?.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-[#060f1e] overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800">
                <Icon.Terminal className="w-3 h-3 text-slate-600" />
                <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">Activity Log</span>
              </div>
              <div className="p-3 space-y-1 max-h-24 overflow-y-auto">
                {log.slice(-5).reverse().map((entry, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-slate-700">{entry.time}</span>
                    <span style={{ color: entry.type === "kill" ? "#ef4444" : entry.type === "preset" ? "#a78bfa" : "#34d399" }}>
                      {entry.msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            {/* Apply */}
            <button onClick={() => onApply(tower.ip_address)} disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "white", boxShadow: "0 4px 20px rgba(14,165,233,0.3)" }}>
              {loading ? <Icon.Refresh className="w-4 h-4 animate-spin" /> : <Icon.Save className="w-4 h-4" />}
              تطبيق
            </button>

            {/* Reset */}
            <button onClick={() => onReset(tower.ip_address)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: "#1e293b", border: "1px solid #334155", color: "#64748b" }}>
              <Icon.Reset className="w-4 h-4" /> إعادة تعيين
            </button>

            {/* Kill */}
            {!confirmKill ? (
              <button onClick={() => setConfirmKill(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 mr-auto"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                <Icon.Skull className="w-4 h-4" /> إيقاف كامل
              </button>
            ) : (
              <div className="flex items-center gap-2 mr-auto">
                <span className="text-[11px] font-mono text-red-400 animate-pulse">تأكيد؟</span>
                <button onClick={() => { onKill(tower.ip_address); setConfirmKill(false); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-black bg-red-500 text-white hover:bg-red-600 transition-all">
                  نعم، أوقف
                </button>
                <button onClick={() => setConfirmKill(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:bg-slate-700 transition-all">
                  لا
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SimulatorPage() {
  const [towers, setTowers]     = useState([]);
  const [editData, setEditData] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [toasts, setToasts]     = useState([]);
  const [logs, setLogs]         = useState({});      // per-tower activity log
  const [globalLoading, setGlobalLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState("all"); // all | warning | critical
  const intervalRef = useRef(null);

  // ── Toast helper ──
  const toast = useCallback((msg, type = "success", duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  }, []);

  // ── Log helper ──
  const addLog = useCallback((ip, msg, type = "action") => {
    const time = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(prev => ({
      ...prev,
      [ip]: [...(prev[ip] || []), { time, msg, type }].slice(-20),
    }));
  }, []);

  // ── Fetch towers ──
  const fetchTowers = useCallback(() => {
    API.get("/towerMap/getTower").then((res) => {
      if (res.data.success) {
        setTowers(res.data.data);
        setLastRefresh(new Date());
        setEditData(prev => {
          const fresh = {};
          res.data.data.forEach((tw) => {
            fresh[tw.ip_address] = {
              latency:    tw.lastMeasurement?.latency    ?? 0,
              throughput: tw.lastMeasurement?.throughput ?? 0,
              packetLoss: tw.lastMeasurement?.packetLoss ?? 0,
              jitter:     tw.lastMeasurement?.jitter     ?? 0,
            };
          });
          // keep user edits if they exist
          return { ...fresh, ...prev };
        });
      }
    }).catch(() => toast("فشل تحميل بيانات الأبراج", "error"));
  }, [toast]);

  useEffect(() => {
    fetchTowers();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchTowers, 5000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, fetchTowers]);

  // ── Change handler ──
  const handleChange = useCallback((ip, key, val) => {
    setEditData(prev => ({
      ...prev,
      [ip]: { ...prev[ip], [key]: val },
    }));
  }, []);

  // ── Apply ──
  const handleApply = useCallback(async (ip) => {
    const d = editData[ip];
    if (!d) return;
    setLoadingMap(p => ({ ...p, [ip]: true }));
    try {
      await API.post("/towerMap/updateByIP", {
        ip_address: ip,
        latency:    Number(d.latency),
        throughput: Number(d.throughput),
        packetLoss: Number(d.packetLoss),
        jitter:     Number(d.jitter),
      });
      toast(`✓ تم تطبيق الإعدادات على ${ip}`, "success");
      addLog(ip, `تم تطبيق الإعدادات — Lat:${d.latency} PL:${d.packetLoss}`, "action");
    } catch {
      toast("فشل الاتصال بالخادم", "error");
      addLog(ip, "خطأ في التطبيق", "error");
    } finally {
      setLoadingMap(p => ({ ...p, [ip]: false }));
    }
  }, [editData, toast, addLog]);

  // ── Kill ──
  const handleKill = useCallback(async (ip) => {
    const kill = { latency: 999, throughput: 0, packetLoss: 100, jitter: 500 };
    setEditData(prev => ({ ...prev, [ip]: kill }));
    setLoadingMap(p => ({ ...p, [ip]: true }));
    try {
      await API.post("/towerMap/updateByIP", { ip_address: ip, ...kill });
      toast(`⚠ تم إيقاف البرج ${ip}`, "error");
      addLog(ip, "تم إيقاف البرج (KILL)", "kill");
    } catch {
      toast("فشل إيقاف البرج", "error");
    } finally {
      setLoadingMap(p => ({ ...p, [ip]: false }));
    }
  }, [toast, addLog]);

  // ── Reset ──
  const handleReset = useCallback((ip) => {
    const normal = { latency: 20, throughput: 100, packetLoss: 0, jitter: 2 };
    setEditData(prev => ({ ...prev, [ip]: normal }));
    toast("تمت إعادة التعيين للقيم الافتراضية", "info");
    addLog(ip, "إعادة تعيين للقيم الطبيعية", "reset");
  }, [toast, addLog]);

  // ── Preset ──
  const handlePreset = useCallback((ip, preset) => {
    setEditData(prev => ({ ...prev, [ip]: { ...preset.values } }));
    toast(`تم تطبيق سيناريو: ${preset.label}`, "info");
    addLog(ip, `سيناريو: ${preset.label}`, "preset");
  }, [toast, addLog]);

  // ── Apply ALL ──
  const applyAll = useCallback(async () => {
    setGlobalLoading(true);
    await Promise.all(towers.map(tw => handleApply(tw.ip_address)));
    setGlobalLoading(false);
    toast("تم تطبيق الإعدادات على جميع الأبراج", "success");
  }, [towers, handleApply, toast]);

  // ── Kill ALL ──
  const killAll = useCallback(async () => {
    if (!window.confirm("هل أنت متأكد من إيقاف جميع الأبراج؟")) return;
    await Promise.all(towers.map(tw => handleKill(tw.ip_address)));
    toast("تم إيقاف جميع الأبراج", "error");
  }, [towers, handleKill, toast]);

  // ── Filter towers ──
  const filteredTowers = towers.filter(tw => {
    if (filter === "all") return true;
    const h = getTowerHealth(editData[tw.ip_address]);
    if (filter === "warning") return h < 100 && h >= 80;
    if (filter === "critical") return h < 80;
    return true;
  });

  // ── Stats ──
  const stats = {
    total:    towers.length,
    healthy:  towers.filter(tw => getTowerHealth(editData[tw.ip_address]) === 100).length,
    warning:  towers.filter(tw => { const h = getTowerHealth(editData[tw.ip_address]); return h < 100 && h >= 80; }).length,
    critical: towers.filter(tw => getTowerHealth(editData[tw.ip_address]) < 80).length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
        .sim-root * { font-family: 'Tajawal', sans-serif; }
        .sim-root .font-mono { font-family: 'JetBrains Mono', monospace !important; }
        @keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanline { 0%{top:-10%} 100%{top:110%} }
        .sim-card-enter { animation: fadeUp 0.35s ease forwards; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
      `}</style>

      <Toast toasts={toasts} />

      <div className="sim-root min-h-screen bg-[#020c1b] p-4 md:p-6" dir="rtl">

        {/* ── Scanline overlay ── */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.025]">
          <div className="absolute w-full h-1 bg-cyan-400" style={{ animation: "scanline 4s linear infinite" }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">

          {/* ── HEADER ── */}
          <header className="mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Icon.Terminal className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-100 tracking-wide font-mono uppercase">
                      Network Controller
                    </h1>
                    <p className="text-[10px] font-mono text-slate-700 tracking-[0.3em] uppercase">Simulation & Stress Testing Tool v2</p>
                  </div>
                </div>
              </div>

              {/* Last refresh + auto-refresh toggle */}
              <div className="flex items-center gap-3 flex-wrap">
                {lastRefresh && (
                  <span className="text-[10px] font-mono text-slate-700">
                    آخر تحديث: {lastRefresh.toLocaleTimeString("ar-EG")}
                  </span>
                )}
                <button onClick={() => setAutoRefresh(a => !a)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all"
                  style={{
                    background: autoRefresh ? "rgba(16,185,129,0.1)" : "rgba(100,116,139,0.1)",
                    border: `1px solid ${autoRefresh ? "#10b98140" : "#33415540"}`,
                    color: autoRefresh ? "#34d399" : "#64748b",
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: autoRefresh ? "#34d399" : "#475569", animation: autoRefresh ? "pulse 2s infinite" : "none" }} />
                  {autoRefresh ? "تحديث تلقائي" : "إيقاف التحديث"}
                </button>
                <button onClick={fetchTowers}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-all">
                  <Icon.Refresh className="w-3.5 h-3.5" /> تحديث
                </button>
              </div>
            </div>

            {/* Warning banner */}
            <div className="mt-4 flex items-center gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-2.5">
              <Icon.Warning className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs font-mono text-amber-500/70">
                تحذير: أوقف المحاكي التلقائي (Terminal) قبل التحكم اليدوي لتجنب تضارب الأوامر
              </p>
            </div>
          </header>

          {/* ── STATS ROW ── */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "إجمالي الأبراج", value: stats.total,    color: "#38bdf8" },
              { label: "تعمل بكفاءة",    value: stats.healthy,  color: "#10b981" },
              { label: "تحتاج مراقبة",   value: stats.warning,  color: "#f59e0b" },
              { label: "حالة حرجة",      value: stats.critical, color: "#ef4444" },
            ].map((s, i) => (
              <div key={i} className="bg-[#0a1628] border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-[9px] font-mono text-slate-700 uppercase tracking-widest mb-1">{s.label}</p>
                <p className="text-2xl font-black font-mono" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── GLOBAL ACTIONS + FILTER ── */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-[#0a1628] border border-slate-800 rounded-xl p-1">
              {[
                { id: "all",      label: "الكل" },
                { id: "warning",  label: "تحذير" },
                { id: "critical", label: "حرج" },
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all"
                  style={{
                    background: filter === f.id ? "#1e293b" : "transparent",
                    color: filter === f.id ? "#e2e8f0" : "#475569",
                    border: filter === f.id ? "1px solid #334155" : "1px solid transparent",
                  }}>
                  {f.label} {f.id !== "all" && <span>({f.id === "warning" ? stats.warning : stats.critical})</span>}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* Global apply */}
            <button onClick={applyAll} disabled={globalLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all hover:scale-105 disabled:opacity-40"
              style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.3)", color: "#38bdf8" }}>
              <Icon.Activity className="w-4 h-4" />
              {globalLoading ? "يتم التطبيق..." : "تطبيق الكل"}
            </button>

            {/* Global kill */}
            <button onClick={killAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all hover:scale-105"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              <Icon.Skull className="w-4 h-4" /> إيقاف الكل
            </button>
          </div>

          {/* ── TOWER CARDS ── */}
          {filteredTowers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-center">
                <Icon.Globe className="w-8 h-8 text-slate-700" />
              </div>
              <p className="text-slate-600 font-mono text-sm">لا توجد أبراج في هذا التصفية</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTowers.map((tw, i) => (
                <div key={tw._id} className="sim-card-enter" style={{ animationDelay: `${i * 60}ms` }}>
                  <TowerCard
                    tower={tw}
                    data={editData[tw.ip_address]}
                    onChange={handleChange}
                    onApply={handleApply}
                    onKill={handleKill}
                    onReset={handleReset}
                    onPreset={handlePreset}
                    loading={loadingMap[tw.ip_address]}
                    log={logs[tw.ip_address]}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── FOOTER ── */}
          <footer className="mt-10 pt-4 border-t border-slate-800/50 flex items-center justify-between flex-wrap gap-2">
            <span className="text-[9px] font-mono text-slate-800 uppercase tracking-widest">
              SMART NETWORK MONITORING — SIMULATION MODULE
            </span>
            <span className="text-[9px] font-mono text-slate-800">
              {towers.length} towers registered
            </span>
          </footer>
        </div>
      </div>
    </>
  );
}