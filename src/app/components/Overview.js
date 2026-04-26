"use client";
import {
  Activity,
  AlertTriangle,
  RadioIcon,
  Trash2,
  Clock,
  User,
  Search,
  Filter,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Zap,
  MapPin,
  Wifi,
} from "lucide-react";
import React, { useState, useMemo, useCallback } from "react";
import Analyze from "./Analyze";
import { motion, AnimatePresence } from "framer-motion";
import TowerMap from "./TowerMap";

// ─── Status helpers ───────────────────────────────────────────────────────────
const statusConfig = {
  critical: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    dot: "bg-red-400",
    label: "⚠️ خطر",
    icon: AlertCircle,
  },
  warning: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    dot: "bg-yellow-400",
    label: "⚡ تحذير",
    icon: Zap,
  },
  normal: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
    label: "✅ آمن",
    icon: CheckCircle2,
  },
  unknown: {
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    dot: "bg-slate-400",
    label: "❓ غير معروف",
    icon: RadioIcon,
  },
};

// ─── FIX: Robust status detection ────────────────────────────────────────────
// Normalizes Arabic & English status strings, handles AI results & thresholds
function getTowerStatus(tw, aiResult) {
  // 1. AI result analysis (Priority)
  if (aiResult) {
    const prob = parseFloat(aiResult.probability) || 0;
    // If AI explicitly finds an anomaly or probability is extremely high -> Critical
    if (aiResult.isAnomaly || prob >= 75) return "critical";
    // If AI risk is Medium/High (>= 25%) -> Warning
    if (prob >= 25) return "warning";
    
    // NOTE: If AI says it's "Low Risk", we don't return "normal" yet.
    // We fall through to check thresholds as a safety net.
  }

  // 2. Threshold-based detection from measurements (Safety net)
  const m = tw?.lastMeasurement;
  if (m) {
    const lat = m.latency ?? 0;
    const pl  = m.packetLoss ?? 0;
    const jit = m.jitter ?? 0;
    const thr = m.throughput ?? 0;

    // Critical thresholds
    if (lat > 200 || pl > 10 || jit > 50 || (thr > 0 && thr < 10)) return "critical";
    // Warning thresholds
    if (lat > 100 || pl > 3 || jit > 20 || (thr > 0 && thr < 30)) return "warning";
    // If we have measurement data → normal
    if (lat > 0 || pl > 0 || jit > 0 || thr > 0) return "normal";
  }

  // 3. String-based fallback (handles Arabic & English, case-insensitive)
  const s = (tw?.status || "").toLowerCase().trim();
  if (!s) return "unknown";

  const CRITICAL_KEYWORDS = ["danger", "critical", "خطر", "عطل", "fault", "down", "error", "خطأ", "فشل", "offline"];
  const WARNING_KEYWORDS  = ["warn", "warning", "تحذير", "caution", "degraded", "بطيء", "slow"];
  const NORMAL_KEYWORDS   = ["normal", "ok", "good", "up", "online", "طبيعي", "يعمل", "active", "healthy"];

  if (CRITICAL_KEYWORDS.some((kw) => s.includes(kw))) return "critical";
  if (WARNING_KEYWORDS.some((kw) => s.includes(kw)))  return "warning";
  if (NORMAL_KEYWORDS.some((kw) => s.includes(kw)))   return "normal";

  return "unknown";
}

// ─── Health score calculation ─────────────────────────────────────────────────
function calcHealth(m) {
  if (!m) return null;
  const lat = m.latency ?? 0;
  const pl  = m.packetLoss ?? 0;
  const jit = m.jitter ?? 0;
  const thr = m.throughput ?? 0;
  return Math.max(0, Math.min(100, (
    Math.max(0, 100 - lat / 2) +
    Math.max(0, 100 - pl * 10) +
    Math.max(0, 100 - jit * 5) +
    Math.min(100, (thr / 100) * 100)
  ) / 4));
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, bg, color, border, trend }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`group relative overflow-hidden ${bg} border ${border} rounded-2xl p-6 flex flex-col items-center gap-3 cursor-pointer shadow-lg`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className={`w-14 h-14 rounded-xl bg-slate-900/50 border ${border} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 relative z-10`}>
        <Icon className={color} size={24} />
      </div>
      <p className="text-slate-400 text-sm font-medium relative z-10">{label}</p>
      <div className="flex items-end gap-2 relative z-10">
        <motion.p
          key={value}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-4xl font-bold ${color}`}
        >
          {value || 0}
        </motion.p>
        {trend && (
          <div className="flex items-center gap-0.5 text-emerald-400 text-xs font-semibold mb-1">
            <TrendingUp size={12} />
            {trend}%
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Metric Cell ─────────────────────────────────────────────────────────────
function MetricCell({ label, val, unit, color }) {
  return (
    <div className="flex flex-col items-center justify-center py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 group-hover:bg-slate-800/80 transition-colors">
      <span className={`text-xs font-bold font-mono ${color}`}>
        {val}<span className="text-[8px] opacity-60 ml-0.5">{unit}</span>
      </span>
      <span className="text-[8px] font-mono text-slate-500 mt-0.5">{label}</span>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ pct, thresholds = [40, 70], colors = ["bg-red-500", "bg-yellow-500", "bg-emerald-500"], glows = ["shadow-[0_0_8px_#ef4444]", "shadow-[0_0_8px_#eab308]", "shadow-[0_0_8px_#10b981]"] }) {
  const idx = pct == null ? -1 : pct >= thresholds[1] ? 2 : pct >= thresholds[0] ? 1 : 0;
  return (
    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
      {pct != null ? (
        <div
          className={`h-full transition-all duration-700 rounded-full ${colors[idx]} ${glows[idx]}`}
          style={{ width: `${pct}%` }}
        />
      ) : (
        <div className="h-full bg-slate-700 w-full opacity-30" />
      )}
    </div>
  );
}

// ─── Tower Card ───────────────────────────────────────────────────────────────
function TowerCard({ tw, user, onDelete, aiResult }) {
  const status = getTowerStatus(tw, aiResult);
  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  const m   = tw.lastMeasurement;
  const lat = m?.latency ?? 0;
  const pl  = m?.packetLoss ?? 0;
  const jit = m?.jitter ?? 0;
  const thr = m?.throughput ?? 0;

  const health = calcHealth(m);
  const prob   = aiResult ? parseFloat(aiResult.probability) : null;

  const handleDelete = useCallback(() => onDelete(tw._id), [tw._id, onDelete]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`group relative overflow-hidden bg-slate-800/60 border ${cfg.border} rounded-2xl p-5 flex flex-col gap-4 ${status === "critical" ? "shadow-red-500/10" : ""}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      {status === "critical" && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 relative z-10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <span className={`block w-3 h-3 rounded-full ${cfg.dot} shadow-lg shadow-current ${status === "critical" ? "animate-pulse" : ""}`} />
            {status === "critical" && (
              <span className={`absolute inset-0 w-3 h-3 rounded-full ${cfg.dot} animate-ping opacity-75`} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-100 truncate text-base">{tw.TowerName}</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
              <User size={10} />
              <span className="truncate">{tw.owner?.fullName || "المشرف العام"}</span>
            </p>
          </div>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={handleDelete}
            aria-label="حذف البرج"
            className="shrink-0 text-slate-600 hover:text-red-400 transition-all duration-200 p-1.5 rounded-lg hover:bg-red-500/20 relative z-10"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Vendor / IP */}
      <div className="bg-slate-900/60 rounded-xl px-3 py-2 border border-slate-700/50 relative z-10 flex justify-between items-center">
        <span className="text-[10px] text-indigo-400 font-mono tracking-wide">{tw.vendor || "—"}</span>
        <span className="text-[10px] text-slate-500 font-mono tracking-widest">{tw.ip_address || "—"}</span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2 relative z-10">
        <MetricCell label="LATENCY" val={lat} unit="ms" color="text-cyan-400" />
        <MetricCell label="LOSS"    val={pl}  unit="%" color="text-red-400" />
        <MetricCell label="JITTER"  val={jit} unit="ms" color="text-purple-400" />
        <MetricCell label="SPEED"   val={thr} unit="Mb" color="text-emerald-400" />
      </div>

      {/* Health & AI Risk */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        {/* Health */}
        <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-700/50">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] text-slate-500 font-mono">NETWORK HEALTH</span>
            {health != null ? (
              <span className={`text-[10px] font-bold font-mono ${health >= 70 ? "text-emerald-400" : health >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                {health.toFixed(0)}%
              </span>
            ) : (
              <span className="text-[9px] font-mono text-slate-600">N/A</span>
            )}
          </div>
          <ProgressBar pct={health} />
        </div>

        {/* AI Risk */}
        <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-700/50">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] text-slate-500 font-mono">AI RISK PROB.</span>
            {prob != null ? (
              <span className={`text-[10px] font-bold font-mono ${prob >= 75 ? "text-red-400" : prob >= 40 ? "text-orange-400" : "text-emerald-400"}`}>
                {prob.toFixed(0)}%
              </span>
            ) : (
              <span className="text-[9px] font-mono text-slate-600">N/A</span>
            )}
          </div>
          <ProgressBar
            pct={prob}
            thresholds={[40, 75]}
            colors={["bg-emerald-500", "bg-orange-500", "bg-red-500"]}
            glows={["shadow-[0_0_8px_#10b981]", "shadow-[0_0_8px_#f97316]", "shadow-[0_0_8px_#ef4444]"]}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-1 relative z-10">
        <div className={`text-[10px] font-bold px-2 py-1.5 rounded-lg ${cfg.bg} ${cfg.color} border ${cfg.border} flex items-center gap-1.5`}>
          <StatusIcon size={12} />
          {aiResult ? (aiResult.isAnomaly ? "مكتشف (AI)" : "آمن (AI)") : cfg.label}
        </div>

        {status === "critical" ? (
          <button className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg font-mono font-bold hover:bg-red-500/40 transition-all flex items-center gap-1.5 active:scale-95 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <Zap size={10} className="animate-pulse" /> RESTART NODE
          </button>
        ) : (
          <p className="text-[9px] text-slate-500 font-mono bg-slate-900/60 px-2 py-1.5 rounded-lg border border-slate-700/50">
            {tw.updatedAt
              ? new Date(tw.updatedAt).toLocaleTimeString("en-US", { hour12: false })
              : "—"}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Search and Filter Bar ────────────────────────────────────────────────────
const ALL_STATUSES = ["critical", "warning", "normal", "unknown"];

function SearchFilterBar({ searchTerm, setSearchTerm, filterStatus, setFilterStatus }) {
  const toggleStatus = useCallback(
    (s) =>
      setFilterStatus((prev) =>
        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
      ),
    [setFilterStatus]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-sm">
      <div className="flex-1 relative w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="ابحث باسم البرج أو IP أو الموفر..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
        />
      </div>

      <div className="flex gap-2 items-center flex-wrap justify-end w-full sm:w-auto">
        <Filter size={16} className="text-slate-500 shrink-0" />
        {ALL_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => toggleStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
              filterStatus.includes(status)
                ? `${statusConfig[status].bg} ${statusConfig[status].color} ${statusConfig[status].border}`
                : "bg-slate-700/30 text-slate-500 border-slate-700/30 hover:border-slate-600/50 hover:text-slate-400"
            }`}
          >
            {statusConfig[status].label}
          </button>
        ))}
        {/* Select All / Clear */}
        <button
          onClick={() =>
            setFilterStatus(filterStatus.length === ALL_STATUSES.length ? [] : [...ALL_STATUSES])
          }
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-600/50 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all duration-200 bg-slate-700/20"
        >
          {filterStatus.length === ALL_STATUSES.length ? "إلغاء الكل" : "تحديد الكل"}
        </button>
      </div>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
export default function Overview({ user, towers, onDelete, analyzeTowerId }) {
  const [towerAiResults, setTowerAiResults] = useState({});
  const [searchTerm, setSearchTerm]         = useState("");
  const [filterStatus, setFilterStatus]     = useState([...ALL_STATUSES]);

  // Compute stats — now counts all 4 statuses correctly
  const currentStats = useMemo(() => {
    const stats = { critical: 0, warning: 0, normal: 0, unknown: 0 };
    towers.forEach((tw) => {
      const s = getTowerStatus(tw, towerAiResults[tw._id]);
      stats[s] = (stats[s] || 0) + 1;
    });
    return stats;
  }, [towers, towerAiResults]);

  const totalTowers = towers.length;
  const uptime      = totalTowers > 0 ? ((currentStats.normal / totalTowers) * 100).toFixed(1) : 0;

  const filteredTowers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return towers.filter((tw) => {
      const matchesSearch =
        tw.TowerName?.toLowerCase().includes(q) ||
        tw.ip_address?.toLowerCase().includes(q) ||
        tw.vendor?.toLowerCase().includes(q);

      const status = getTowerStatus(tw, towerAiResults[tw._id]);
      return matchesSearch && filterStatus.includes(status);
    });
  }, [towers, searchTerm, filterStatus, towerAiResults]);

  return (
    <div className="min-h-screen text-slate-100 space-y-8" dir="rtl">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">لوحة المراقبة</h1>
          <p className="text-sm text-slate-400 font-mono mt-2">NETWORK MONITORING DASHBOARD</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400 font-mono">نظام حي</span>
        </div>
      </div>

      {/* Stat Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10"
      >
        <StatCard icon={AlertCircle}   label="عطل خطير"     value={currentStats.critical} color="text-red-400"     bg="bg-red-500/10"     border="border-red-500/30" />
        <StatCard icon={Zap}           label="تحذير"         value={currentStats.warning}  color="text-yellow-400"  bg="bg-yellow-500/10"  border="border-yellow-500/30" />
        <StatCard icon={CheckCircle2}  label="طبيعي"         value={currentStats.normal}   color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/30" trend={uptime} />
        <StatCard icon={RadioIcon}     label="جميع الأبراج" value={totalTowers}            color="text-cyan-400"    bg="bg-cyan-500/10"    border="border-cyan-500/30" />
      </motion.div>

      {/* Analyze */}
      <div className="relative z-10">
        <Analyze setTowerAiResults={setTowerAiResults} initialTowerId={analyzeTowerId} />
      </div>

      {/* Search & Filter */}
      <div className="relative z-10">
        <SearchFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />
      </div>

      {/* Towers Grid */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-white">الأبراج المراقبة</h2>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-700 to-transparent" />
          <span className="text-xs font-mono text-slate-400 shrink-0 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
            {filteredTowers.length} / {totalTowers} برج
          </span>
        </div>

        {filteredTowers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500 border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20 backdrop-blur-sm"
          >
            <RadioIcon size={48} className="opacity-30" />
            <p className="font-mono text-base">
              {towers.length === 0 ? "لا يوجد أبراج لعرضها" : "لا توجد نتائج مطابقة للبحث"}
            </p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredTowers.map((tw) => (
                <TowerCard
                  key={tw._id}
                  tw={tw}
                  user={user}
                  onDelete={onDelete}
                  aiResult={towerAiResults[tw._id]}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Map */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-2 backdrop-blur-sm relative z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-5">
          <MapPin size={22} className="text-indigo-400" />
          خريطة الأبراج
        </h2>
        <div className="h-[500px] rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-slate-900/50">
          <TowerMap towers={filteredTowers} towerAiResults={towerAiResults} />
        </div>
      </div>
    </div>
  );
}