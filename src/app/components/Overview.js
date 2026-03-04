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
} from "lucide-react";
import React, { useState, useMemo } from "react";
// import dynamic from "next/dynamic";
import Analyze from "./Analyze";
import { motion } from "framer-motion";
import TowerMap from "./TowerMap";
import { getRecommendations } from "./GetRecommendations";


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

function getTowerStatus(tw, aiResult) {
  if (aiResult) {
    return aiResult.isAnomaly ? "critical" : "normal";
  }
  const s = (tw?.status || "").toLowerCase();
  if (s.includes("danger") || s.includes("critical") || s.includes("خطر") || s.includes("عطل"))
    return "critical";
  if (s.includes("warn") || s.includes("تحذير")) return "warning";
  if (s.includes("normal") || s.includes("ok") || s.includes("طبيعي")) return "normal";
  return "unknown";
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, bg, color, border, trend }) {
  return (
    <div
      className={`group relative overflow-hidden ${bg} border ${border} rounded-2xl p-6 flex flex-col items-center gap-3 transition-all duration-300 hover:border-opacity-100 hover:shadow-lg hover:shadow-slate-900/50 cursor-pointer`}
    >
      {/* Background linear effect */}
      <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div
        className={`w-14 h-14 rounded-xl ${color.replace("text-", "bg-").replace("400", "500/20")} border ${border} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 relative z-10`}
      >
        <Icon className={`${color}`} size={24} />
      </div>

      <p className="text-slate-400 text-sm font-medium relative z-10">{label}</p>

      <div className="flex items-end gap-2 relative z-10">
        <p className={`text-4xl font-bold ${color}`}>{value || 0}</p>
        {trend && (
          <div className="flex items-center gap-0.5 text-emerald-400 text-xs font-semibold">
            <TrendingUp size={12} />
            {trend}%
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tower Card ───────────────────────────────────────────────────────────────
function TowerCard({ tw, user, onDelete, aiResult }) {
  const status = getTowerStatus(tw, aiResult);
  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  // حساب نسبة الصحة
  const healthPercentage = Math.max(0, Math.min(100, 100 - (tw.lastMeasurement?.packetLoss || 0) * 10));

  return (
    <div
      className={`group relative overflow-hidden bg-linear-to-br from-slate-800/50 to-slate-900/50 border ${cfg.border} rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:border-opacity-100 hover:shadow-2xl hover:shadow-slate-900/50 hover:-translate-y-1`}
    >
      {/* Animated background linear */}
      <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 relative z-10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${cfg.dot} animate-pulse shadow-lg shadow-current`}
            />
            <span className={`absolute inset-0 w-3 h-3 rounded-full ${cfg.dot} animate-ping opacity-75`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white truncate text-base">{tw.TowerName}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
              <User size={12} />
              <span className="truncate">{tw.owner?.fullName || "مشرف"}</span>
            </p>
          </div>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={() => onDelete(tw._id)}
            className="shrink-0 text-slate-600 hover:text-red-400 transition-all duration-200 p-2 rounded-lg hover:bg-red-500/20 hover:scale-110 relative z-10"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Vendor / IP - Enhanced */}
      <div className="bg-slate-800/80 rounded-xl px-4 py-2.5 backdrop-blur-sm border border-slate-700/50 relative z-10">
        <p className="text-xs text-slate-500 font-mono flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-600" />
          {tw.vendor || "—"} · {tw.ip_address || "—"}
        </p>
      </div>

      {/* Metrics - Displaying Latency and Throughput */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-linear-to-br from-slate-700/40 to-slate-800/40 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm hover:border-slate-600/50 transition-all duration-200">
          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5 font-semibold">
            <Clock size={12} className="text-cyan-400" /> Latency
          </p>
          <p className="font-bold text-slate-100 text-lg">
            {tw.lastMeasurement?.latency ?? "N/A"}
            <span className="text-xs text-slate-500 font-normal"> ms</span>
          </p>
          <div className="mt-2 h-1 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-cyan-500 to-blue-500 rounded-full"
              style={{
                width: `${Math.min(100, (tw.lastMeasurement?.latency || 0) / 2)}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-linear-to-br from-slate-700/40 to-slate-800/40 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm hover:border-slate-600/50 transition-all duration-200">
          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5 font-semibold">
            <Activity size={12} className="text-emerald-400" /> Speed
          </p>
          <p className="font-bold text-slate-100 text-lg">
            {tw.lastMeasurement?.throughput ?? "N/A"}
            <span className="text-xs text-slate-500 font-normal"> Mbps</span>
          </p>
          <div className="mt-2 h-1 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full"
              style={{
                width: `${Math.min(100, (tw.lastMeasurement?.throughput || 0))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Health Score */}
      <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-400 font-semibold">حالة الصحة</p>
          <p className={`text-sm font-bold ${healthPercentage > 70 ? "text-emerald-400" : healthPercentage > 40 ? "text-yellow-400" : "text-red-400"}`}>
            {healthPercentage.toFixed(0)}%
          </p>
        </div>
        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              healthPercentage > 70
                ? "bg-linear-to-r from-emerald-500 to-emerald-400"
                : healthPercentage > 40
                ? "bg-linear-to-r from-yellow-500 to-yellow-400"
                : "bg-linear-to-r from-red-500 to-red-400"
            }`}
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
      </div>

      {/* Status + time - Enhanced */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className={`text-xs font-semibold px-3 py-2 rounded-lg ${cfg.bg} ${cfg.color} border ${cfg.border} flex items-center gap-1.5 backdrop-blur-sm`}>
          <StatusIcon size={14} />
          {aiResult ? (aiResult.isAnomaly ? "خطر (AI)" : "آمن (AI)") : tw?.status || "غير معروف"}
        </div>
        <p className="text-xs text-slate-500 flex items-center gap-1 font-mono bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-700/50">
          <Clock size={12} />
          {tw.updatedAt ? new Date(tw.updatedAt).toLocaleTimeString("ar-EG") : "N/A"}
        </p>
      </div>
    </div>
  );
}

// ─── Search and Filter Bar ────────────────────────────────────────────────────
function SearchFilterBar({ searchTerm, setSearchTerm, filterStatus, setFilterStatus, statuses }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-linear-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-sm">
      {/* Search */}
      <div className="flex-1 relative w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="ابحث عن برج..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-600/50 transition-all duration-200"
        />
      </div>

      {/* Filter */}
      <div className="flex gap-2 items-center flex-wrap justify-end w-full sm:w-auto">
        <Filter size={18} className="text-slate-500 shrink-0" />
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() =>
              setFilterStatus(filterStatus.includes(status) ? filterStatus.filter((s) => s !== status) : [...filterStatus, status])
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
              filterStatus.includes(status)
                ? `${statusConfig[status].bg} ${statusConfig[status].color} ${statusConfig[status].border}`
                : "bg-slate-700/30 text-slate-400 border-slate-700/30 hover:border-slate-600/50"
            }`}
          >
            {statusConfig[status].label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
export default function Overview({ user, towers, onDelete }) {
  const [towerAiResults, setTowerAiResults] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(["critical", "warning", "normal"]);

const currentStats = useMemo(() => {
  const stats = { critical: 0, warning: 0, normal: 0, unknown: 0 };
  
  towers.forEach((tw) => {
    const status = getTowerStatus(tw, towerAiResults[tw._id]);
    if (stats[status] !== undefined) {
      stats[status]++;
    } else {
      stats.unknown++;
    }
  });
  
  return stats;
}, [towers, towerAiResults]); 

  // Filtered towers
  const filteredTowers = useMemo(() => {
    return towers.filter((tower) => {
      const matchesSearch =
        tower.TowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tower.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tower.vendor?.toLowerCase().includes(searchTerm.toLowerCase());

      const status = getTowerStatus(tower, towerAiResults[tower._id]);
      const matchesFilter = filterStatus.includes(status);

      return matchesSearch && matchesFilter;
    });
  }, [towers, searchTerm, filterStatus, towerAiResults]);

  const totalTowers = towers.length;
  const uptime = totalTowers > 0 ? ((currentStats.normal / totalTowers) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6 md:p-8 space-y-8" dir="rtl">
      {/* ── Background Elements ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* ── Page Header ── */}
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">لوحة المراقبة</h1>
            <p className="text-sm text-slate-400 font-mono mt-2">NETWORK MONITORING DASHBOARD</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400 font-mono">نظام حي</span>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <motion.div
      
         whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.7 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        <StatCard
          icon={AlertTriangle}
          label="عطل خطير"
          value={currentStats.critical}
          color="text-red-400"
          bg="bg-red-500/10"
          border="border-red-500/30"
        />
        <StatCard
          icon={AlertTriangle}
          label="تحذير"
          value={currentStats.warning}
          color="text-yellow-400"
          bg="bg-yellow-500/10"
          border="border-yellow-500/30"
        />
        <StatCard
          icon={Activity}
          label="طبيعي"
          value={currentStats.normal}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
          border="border-emerald-500/30"
          trend={uptime}
        />
        <StatCard
          icon={RadioIcon}
          label="جميع الأبراج"
          value={totalTowers}
          color="text-cyan-400"
          bg="bg-cyan-500/10"
          border="border-cyan-500/30"
        />
      </motion.div>

      {/* ── Analyze ── */}
      <div className="relative z-10">
        <Analyze setTowerAiResults={setTowerAiResults} />
      </div>

      {/* ── Search and Filter ── */}
      <div className="relative z-10">
        <SearchFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          statuses={["critical", "warning", "normal"]}
        />
      </div>
     
      {/* ── Towers Grid ── */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-white">الأبراج المراقبة</h2>
          <div className="flex-1 h-px bg-linear-to-l from-transparent via-slate-700 to-transparent" />
          <span className="text-xs font-mono text-slate-400 shrink-0 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
            {filteredTowers.length} / {totalTowers} برج
          </span>
        </div>

        {filteredTowers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500 border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20 backdrop-blur-sm">
            <RadioIcon size={48} className="opacity-30" />
            <p className="font-mono text-base">
              {towers.length === 0 ? "لا يوجد أبراج لعرضها" : "لا توجد نتائج مطابقة للبحث"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTowers.map((tw) => (
              <TowerCard
                key={tw._id}
                tw={tw}
                user={user}
                onDelete={onDelete}
                aiResult={towerAiResults[tw._id]}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Map ── */}
      <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm relative z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-5">
          <MapPin size={22} className="text-indigo-400" />
          خريطة الأبراج
        </h2>
        <div className="h-96 rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-slate-900/50">
          <TowerMap towers={filteredTowers} towerAiResults={towerAiResults}/>
        </div>
      </div>
    </div>
  );
}
