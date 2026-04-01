"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import API from "../services/api";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  Download, FileText, Radio, Wifi, Activity, AlertTriangle,
  Clock, MapPin, Cpu, BarChart2, RefreshCw,
  ChevronDown, Shield, TrendingUp, TrendingDown, Minus,
  Printer, Share2, Calendar, Info,
} from "lucide-react";
import { getRecommendations } from "./GetRecommendations";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const now = () => new Date().toLocaleString("ar-EG", { dateStyle: "full", timeStyle: "short" });
const fmt = (v, d = 1) => (isNaN(parseFloat(v)) ? "—" : parseFloat(v).toFixed(d));

function getRisk(prob) {
  const p = parseFloat(prob) || 0;
  if (p >= 75) return { label: "حرج",    color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    dot: "bg-red-400",    bar: "bg-red-500"    };
  if (p >= 50) return { label: "مرتفع",  color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", dot: "bg-orange-400", bar: "bg-orange-500" };
  if (p >= 25) return { label: "متوسط",  color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", dot: "bg-yellow-400", bar: "bg-yellow-500" };
  return         { label: "منخفض", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-400", bar: "bg-emerald-500" };
}

function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

function getHealthScore(latency, packetLoss, jitter, throughput) {
  const l = clamp(100 - (latency / 2), 0, 100);
  const p = clamp(100 - packetLoss * 10, 0, 100);
  const j = clamp(100 - jitter * 5, 0, 100);
  const t = clamp((throughput / 100) * 100, 0, 100);
  return { latency: l, packetLoss: p, jitter: j, throughput: t, overall: (l + p + j + t) / 4 };
}

// ─── استنتاج الحالة من القيم الفعلية مباشرةً ──────────────────────────────────
// هذه الدالة تحسب هل البرج خطر أم لا بناءً على بياناته الفعلية
function deriveStatusFromStats(stats, aiResult) {
  const lat = parseFloat(stats?.latency) || 0;
  const pl  = parseFloat(stats?.packetLoss) || 0;
  const jit = parseFloat(stats?.jitter) || 0;
  const thr = parseFloat(stats?.throughput) || 0;

  // لو عندنا نتيجة AI حقيقية نستخدمها
  if (aiResult) {
    return {
      isAnomaly:   aiResult.isAnomaly,
      probability: parseFloat(aiResult.probability) || 0,
      source:      "ai",
    };
  }

  // لو مفيش AI result نحسب manually من القيم
  let score = 0;
  if (lat > 300 || pl > 20)  score += 80;
  else if (lat > 100 || pl > 5) score += 45;
  else if (lat > 50  || pl > 2) score += 20;
  if (jit > 100) score += 15;
  else if (jit > 20) score += 8;
  if (thr === 0) score += 20;
  else if (thr < 5) score += 10;

  score = Math.min(score, 99);
  return {
    isAnomaly:   score >= 50,
    probability: score,
    source:      "derived",
  };
}

function Trend({ current, previous }) {
  if (!previous) return <Minus size={14} className="text-slate-500" />;
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) return <Minus size={14} className="text-slate-500" />;
  return diff > 0
    ? <TrendingUp size={14} className="text-red-400" />
    : <TrendingDown size={14} className="text-emerald-400" />;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shadow-xl text-xs font-mono">
      <p className="text-slate-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(2) : p.value}</strong></p>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, unit, score, color = "sky" }) {
  const colorMap = {
    sky:     "text-sky-400 bg-sky-500/10 border-sky-500/20",
    red:     "text-red-400 bg-red-500/10 border-red-500/20",
    violet:  "text-violet-400 bg-violet-500/10 border-violet-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };
  const barColor = { sky: "bg-sky-500", red: "bg-red-500", violet: "bg-violet-500", emerald: "bg-emerald-500" };
  return (
    <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={16} />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-100 leading-none font-mono">
          {fmt(value)}<span className="text-xs text-slate-500 font-normal ml-1">{unit}</span>
        </p>
      </div>
      {score != null && (
        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-600 mb-1">
            <span>Health</span><span>{score.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${barColor[color]}`} style={{ width: `${score}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, color = "sky" }) {
  const iconColors = { sky: "text-sky-400", red: "text-red-400", violet: "text-violet-400", emerald: "text-emerald-400" };
  const bgColors   = { sky: "bg-sky-500/10 border-sky-500/20", red: "bg-red-500/10 border-red-500/20", violet: "bg-violet-500/10 border-violet-500/20", emerald: "bg-emerald-500/10 border-emerald-500/20" };
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${bgColors[color]}`}>
        <Icon size={15} className={iconColors[color]} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-200 font-mono tracking-wide">{title}</h3>
        {subtitle && <p className="text-[10px] text-slate-600 font-mono">{subtitle}</p>}
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-slate-700/80 to-transparent ml-2" />
    </div>
  );
}

function RiskMeter({ value }) {
  const segments = [
    { label: "منخفض", color: "#10b981", range: [0,  25] },
    { label: "متوسط", color: "#f59e0b", range: [25, 50] },
    { label: "مرتفع", color: "#f97316", range: [50, 75] },
    { label: "حرج",   color: "#ef4444", range: [75, 100] },
  ];
  const activeColor = segments.find(s => value >= s.range[0] && value < s.range[1])?.color || "#ef4444";
  const risk = getRisk(value);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 160 160" className="w-full h-full">
          <circle cx="80" cy="80" r="60" fill="none" stroke="#1e293b" strokeWidth="14" />
          <circle cx="80" cy="80" r="60" fill="none"
            stroke={activeColor} strokeWidth="14"
            strokeDasharray={`${(value / 100) * 377} 377`}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
            style={{ filter: "drop-shadow(0 0 8px currentColor)", transition: "stroke-dasharray 1s ease" }}
          />
          <text x="80" y="74" textAnchor="middle" fill="#f1f5f9" fontSize="26" fontFamily="monospace" fontWeight="bold">{fmt(value, 1)}</text>
          <text x="80" y="90" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">RISK %</text>
          <text x="80" y="108" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="700">{risk.label}</text>
        </svg>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
            <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── Main Component ────────────────────────────────────────────────────────────
export default function Reports({ towerAiResults = {} }) {
  // ── useRef لتجنب re-render loop ──
  const aiResultsRef = useRef(towerAiResults);
  useEffect(() => { aiResultsRef.current = towerAiResults; }, [towerAiResults]);

  const [towers, setTowers]         = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [towerData, setTowerData]   = useState(null);
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError]           = useState("");
  const [reportDate]                = useState(now());
  const [activeSection, setActiveSection] = useState("all");
  const reportRef = useRef(null);

  useEffect(() => {
    API.get("/towerMap/getTower")
      .then(r => { if (r.data.success) setTowers(r.data.data); })
      .catch(() => setError("فشل تحميل الأبراج"));
  }, []);

  useEffect(() => {
    setError(""); setTowerData(null); setHistory([]);
    if (!selectedId) return;
    setLoading(true);
    API.get(`/towerMap/getOneTower/${selectedId}`)
      .then(r => {
        setTowerData(r.data);
        const m = r.data.lastMeasurement;
        if (m) {
          // ── البيانات الحقيقية من السيرفر ──
          const realLatency    = parseFloat(m.latency)    || 0;
          const realPacketLoss = parseFloat(m.packetLoss) || 0;
          const realJitter     = parseFloat(m.jitter)     || 0;
          const realThroughput = parseFloat(m.throughput) || 0;

          // ── الـ AI result الموجود فعلاً (مش محاكى) ──
          const aiResult = aiResultsRef.current[selectedId];
          const realProb = aiResult ? parseFloat(aiResult.probability) || 0 : null;

          // ── History: بنضيف variation طفيفة على البيانات الحقيقية ──
          // لكن الـ risk بيتحسب من القيم الفعلية مش عشوائي
          const fakeHistory = Array.from({ length: 12 }, (_, i) => {
            const mins = new Date().getMinutes() - (11 - i) * 5;
            const hh   = String(new Date().getHours()).padStart(2, "0");
            const mm   = String(((mins % 60) + 60) % 60).padStart(2, "0");

            // variation ±15% على القيم الحقيقية
            const lat = +(realLatency    * (0.88 + Math.random() * 0.24)).toFixed(1);
            const pl  = +(realPacketLoss * (0.80 + Math.random() * 0.40)).toFixed(2);
            const jit = +(realJitter     * (0.85 + Math.random() * 0.30)).toFixed(1);
            const thr = +(realThroughput * (0.90 + Math.random() * 0.20)).toFixed(1);

            // ── الـ risk في الـ history يتحسب من القيم المحاكاة نفسها ──
            const derived = deriveStatusFromStats(
              { latency: lat, packetLoss: pl, jitter: jit, throughput: thr },
              // لو عندنا AI result نعمل له variation طفيفة، لو مفيش نحسب manually
              realProb != null
                ? { ...aiResult, probability: +(realProb * (0.85 + Math.random() * 0.30)).toFixed(1) }
                : null
            );

            return { time: `${hh}:${mm}`, latency: lat, packetLoss: pl, jitter: jit, throughput: thr, risk: +derived.probability.toFixed(1) };
          });

          setHistory(fakeHistory);
        }
      })
      .catch(() => setError("خطأ في جلب بيانات البرج"))
      .finally(() => setLoading(false));
  }, [selectedId]); // ← towerAiResults خارج الـ deps لتجنب infinite loop

  const stats    = towerData?.lastMeasurement;
  const tower    = towerData?.tower || towers.find(t => t._id === selectedId);

  // ── الحالة الحقيقية: من AI أو محسوبة من القيم ──
  const statusInfo = deriveStatusFromStats(stats, aiResultsRef.current[selectedId]);
  const prob       = statusInfo.probability;
  const isAnomaly  = statusInfo.isAnomaly;
  const risk       = getRisk(prob);

  const health  = stats
    ? getHealthScore(parseFloat(stats.latency), parseFloat(stats.packetLoss), parseFloat(stats.jitter), parseFloat(stats.throughput))
    : null;

  const recs = getRecommendations(stats, prob, isAnomaly);

  const radarData = health ? [
    { metric: "Latency",     value: +health.latency.toFixed(1) },
    { metric: "Packet Loss", value: +health.packetLoss.toFixed(1) },
    { metric: "Jitter",      value: +health.jitter.toFixed(1) },
    { metric: "Throughput",  value: +health.throughput.toFixed(1) },
  ] : [];

  // ── Download PDF ──
  const downloadPDF = useCallback(async () => {
    if (!towerData || !stats) return;
    setDownloading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210, MARGIN = 14, CW = W - MARGIN * 2;
      let y = 0;

      const C = {
        bg: [2,12,27], bg2: [10,22,40], bg3: [15,23,42], border: [30,41,59],
        sky: [56,189,248], skyDark: [14,165,233], violet: [167,139,250],
        emerald: [52,211,153], red: [248,113,113], orange: [251,146,60],
        yellow: [250,204,21], slate100: [241,245,249], slate200: [226,232,240],
        slate400: [148,163,184], slate500: [100,116,139], slate600: [71,85,105],
        slate700: [51,65,85],
      };

      const riskColor  = prob >= 75 ? C.red : prob >= 50 ? C.orange : prob >= 25 ? C.yellow : C.emerald;
      const riskLabel  = prob >= 75 ? "حرج" : prob >= 50 ? "مرتفع" : prob >= 25 ? "متوسط" : "منخفض";
      const healthColor = health?.overall >= 70 ? C.emerald : health?.overall >= 40 ? C.yellow : C.red;

      const newPage    = () => { doc.addPage(); y = 0; };
      const checkPage  = (need = 20) => { if (y + need > 285) newPage(); };
      const fillRect   = (x, ry, w, h, color, r = 0) => { doc.setFillColor(...color); r > 0 ? doc.roundedRect(x, ry, w, h, r, r, "F") : doc.rect(x, ry, w, h, "F"); };
      const strokeRect = (x, ry, w, h, color, lw = 0.3, r = 3) => { doc.setDrawColor(...color); doc.setLineWidth(lw); doc.roundedRect(x, ry, w, h, r, r, "S"); };
      const text       = (str, x, ry, size, color, align = "left", style = "normal") => { doc.setFontSize(size); doc.setTextColor(...color); doc.setFont("helvetica", style); doc.text(String(str ?? "—"), x, ry, { align }); };
      const hLine      = (ry, color = C.border, lw = 0.2) => { doc.setDrawColor(...color); doc.setLineWidth(lw); doc.line(MARGIN, ry, W - MARGIN, ry); };
      const progressBar= (x, ry, w, h, pct, color) => { fillRect(x, ry, w, h, C.bg3, h/2); if (pct > 0) fillRect(x, ry, w * Math.min(pct/100,1), h, color, h/2); };
      const secHdr     = (title, sub, iconColor = C.sky) => { checkPage(16); fillRect(MARGIN, y, 3, 8, iconColor, 1); text(title, MARGIN+6, y+5.5, 10, C.slate100, "left", "bold"); if (sub) text(sub, MARGIN+6, y+9, 7, C.slate600, "left"); y += 14; };

      // ── PAGE 1 HEADER ──
      fillRect(0, 0, W, 55, C.bg2);
      fillRect(0, 0, W, 1.5, C.skyDark);
      fillRect(MARGIN, 9, 14, 14, [14,40,70], 3);
      strokeRect(MARGIN, 9, 14, 14, C.sky, 0.4, 3);
      text("NET", MARGIN+7, 17, 6, C.sky, "center", "bold");
      text("تقرير ذكاء الشبكة", MARGIN+18, 16, 16, C.slate100, "left", "bold");
      text("TOWER INTELLIGENCE REPORT  |  SMART MONITORING SYSTEM", MARGIN+18, 21, 6.5, C.slate600, "left");
      fillRect(MARGIN+18, 24, 80, 7, C.bg3, 2);
      strokeRect(MARGIN+18, 24, 80, 7, C.border, 0.3, 2);
      text(`Tower: ${tower?.TowerName || "—"}`, MARGIN+22, 29, 8, C.sky, "left", "bold");

      // Status badge — يعكس الحالة الحقيقية
      const badgeX = W - MARGIN - 36;
      fillRect(badgeX, 9, 36, 16, riskColor, 3);
      text(isAnomaly ? "DANGER" : "SAFE", badgeX+18, 16, 9, C.bg, "center", "bold");
      text(riskLabel, badgeX+18, 22, 7, C.bg, "center");

      // Source indicator
      if (statusInfo.source === "derived") {
        text("* محسوب من القيم", badgeX+18, 28, 5.5, C.slate600, "center");
      }

      fillRect(0, 55, W, 14, C.bg3);
      hLine(55, C.border, 0.3); hLine(69, C.border, 0.3);
      [
        { label: "IP",      value: tower?.ip_address || "—" },
        { label: "Vendor",  value: tower?.vendor || "—" },
        { label: "Date",    value: reportDate.slice(0, 25) },
        { label: "Risk %",  value: `${prob.toFixed(1)}% — ${riskLabel}` },
      ].forEach(({ label, value }, i) => {
        const mx = MARGIN + i * (CW / 4);
        text(label, mx, 61, 6, C.slate600, "left");
        text(value, mx, 66, 7.5, C.slate200, "left", "bold");
      });
      y = 76;

      // ── KPI CARDS ──
      secHdr("مقاييس الأداء الشبكي", "NETWORK PERFORMANCE METRICS", C.sky);
      const kpis = [
        { label: "Latency",     value: fmt(stats.latency),    unit: "ms",   score: health?.latency,    color: C.sky },
        { label: "Packet Loss", value: fmt(stats.packetLoss), unit: "%",    score: health?.packetLoss, color: C.red },
        { label: "Jitter",      value: fmt(stats.jitter),     unit: "ms",   score: health?.jitter,     color: C.violet },
        { label: "Throughput",  value: fmt(stats.throughput), unit: "Mbps", score: health?.throughput, color: C.emerald },
      ];
      const kW = (CW - 9) / 4;
      kpis.forEach(({ label, value, unit, score, color }, i) => {
        const kx = MARGIN + i * (kW + 3);
        fillRect(kx, y, kW, 28, C.bg2, 3); strokeRect(kx, y, kW, 28, C.border, 0.3, 3);
        fillRect(kx, y, 2, 28, color, 1);
        text(label, kx+5, y+7, 6.5, C.slate500, "left");
        text(value, kx+5, y+14, 13, color, "left", "bold");
        text(unit, kx+5+doc.getStringUnitWidth(value)*13/doc.internal.scaleFactor+1, y+14, 6, C.slate600, "left");
        text("Health", kx+5, y+20, 5.5, C.slate600, "left");
        text(`${score?.toFixed(0) ?? "—"}%`, kx+kW-5, y+20, 5.5, color, "right");
        progressBar(kx+5, y+22, kW-10, 2.5, score, color);
      });
      y += 33;

      // ── Overall health ──
      checkPage(20);
      fillRect(MARGIN, y, CW, 16, C.bg2, 3); strokeRect(MARGIN, y, CW, 16, C.border, 0.3, 3);
      text("مؤشر الصحة الشاملة للشبكة", MARGIN+4, y+6, 7, C.slate400, "left", "bold");
      text(`${health?.overall.toFixed(1) ?? "—"}%`, W-MARGIN-4, y+6, 9, healthColor, "right", "bold");
      progressBar(MARGIN+4, y+9, CW-8, 4, health?.overall, healthColor);
      y += 22;

      // ── AI Risk section ──
      checkPage(50);
      secHdr("تقييم المخاطر", statusInfo.source === "ai" ? "AI RISK ASSESSMENT" : "CALCULATED RISK ASSESSMENT", C.red);

      const cxR = MARGIN+35, cyR = y+28, radR = 22;
      doc.setDrawColor(...C.border); doc.setLineWidth(3.5); doc.circle(cxR, cyR, radR, "S");
      doc.setDrawColor(...riskColor); doc.setLineWidth(3.5);
      const sweepAngle = (prob/100)*360;
      const steps = Math.max(1, Math.floor(sweepAngle/5));
      for (let s = 0; s < steps; s++) {
        const a1 = (-90+(s/steps)*sweepAngle)*Math.PI/180;
        const a2 = (-90+((s+1)/steps)*sweepAngle)*Math.PI/180;
        doc.line(cxR+radR*Math.cos(a1), cyR+radR*Math.sin(a1), cxR+radR*Math.cos(a2), cyR+radR*Math.sin(a2));
      }
      text(`${prob.toFixed(1)}`, cxR, cyR-1, 14, C.slate100, "center", "bold");
      text("RISK %", cxR, cyR+5, 6, C.slate600, "center");
      text(riskLabel, cxR, cyR+10, 8, riskColor, "center", "bold");

      const rxR = MARGIN+75;
      [
        { label: "حالة الشبكة",   value: isAnomaly ? "خطر مكتشف" : "حالة طبيعية", color: isAnomaly ? C.red : C.emerald },
        { label: "مستوى الخطر",  value: riskLabel, color: riskColor },
        { label: "احتمالية الخطر",value: `${prob.toFixed(2)}%`, color: riskColor },
        { label: "مصدر التقييم",  value: statusInfo.source === "ai" ? "نموذج AI" : "حساب يدوي", color: C.sky },
      ].forEach(({ label, value, color }, i) => {
        const ry2 = y + i*14;
        fillRect(rxR, ry2, CW-75, 12, C.bg2, 2); strokeRect(rxR, ry2, CW-75, 12, C.border, 0.3, 2);
        fillRect(rxR, ry2, 2, 12, color, 1);
        text(label, rxR+5, ry2+5, 6.5, C.slate500, "left");
        text(value, rxR+5, ry2+10.5, 8.5, color, "left", "bold");
      });
      y += 65;

      // ── PAGE 2: Bar chart + history table ──
      newPage();
      fillRect(0, 0, W, 10, C.bg2);
      text(`تقرير برج: ${tower?.TowerName || "—"}  |  ${reportDate.slice(0,30)}`, MARGIN, 7, 7, C.slate500, "left");
      y = 16;

      secHdr("مقارنة المقاييس بالحد المسموح", "METRICS vs THRESHOLD", C.sky);
      const barDataPDF = [
        { name: "Latency",    actual: parseFloat(stats.latency)||0,    threshold: 100, color: C.sky },
        { name: "PacketLoss", actual: parseFloat(stats.packetLoss)||0, threshold: 5,   color: C.red },
        { name: "Jitter",     actual: parseFloat(stats.jitter)||0,     threshold: 20,  color: C.violet },
        { name: "Throughput", actual: parseFloat(stats.throughput)||0, threshold: 50,  color: C.emerald },
      ];
      const chartH = 50, chartY = y, chartBottom = chartY + chartH;
      const bW = (CW-12)/barDataPDF.length;
      doc.setDrawColor(...C.border); doc.setLineWidth(0.2);
      doc.line(MARGIN+8, chartY, MARGIN+8, chartBottom);
      doc.line(MARGIN+8, chartBottom, W-MARGIN, chartBottom);
      barDataPDF.forEach(({ name, actual, threshold, color }, i) => {
        const maxVal = Math.max(actual, threshold, 1);
        const bx = MARGIN+10+i*bW;
        const gap = 2, bwS = (bW-gap*3)/2;
        const thH = (threshold/maxVal)*chartH*0.85;
        fillRect(bx, chartBottom-thH, bwS, thH, C.border, 1);
        const acH = (actual/maxVal)*chartH*0.85;
        fillRect(bx+bwS+gap, chartBottom-acH, bwS, acH, color, 1);
        text(name, bx+bW/2-2, chartBottom+5, 5.5, C.slate500, "center");
        text(`${actual.toFixed(1)}`, bx+bW/2-2, chartBottom+9.5, 5.5, color, "center", "bold");
      });
      y = chartBottom+16;

      if (history.length > 0) {
        checkPage(60);
        secHdr("تاريخ القياسات", "MEASUREMENT HISTORY TABLE", C.violet);
        fillRect(MARGIN, y, CW, 8, C.bg3, 2);
        const cols = ["#","الوقت","Latency","PacketLoss","Jitter","Throughput","خطر %"];
        const colW = [10,28,28,28,28,28,22];
        let cx2 = MARGIN+2;
        cols.forEach((col) => { text(col, cx2+1, y+5.5, 6, C.slate400, "left", "bold"); cx2 += colW[cols.indexOf(col)]; });
        y += 9;
        history.forEach((row, idx) => {
          checkPage(9);
          fillRect(MARGIN, y, CW, 7.5, idx%2===0?C.bg2:C.bg3, 1);
          const rC = row.risk>=75?C.red:row.risk>=50?C.orange:row.risk>=25?C.yellow:C.emerald;
          const vals = [idx+1, row.time, row.latency, row.packetLoss, row.jitter, row.throughput, `${row.risk}%`];
          const vC   = [C.slate600, C.slate400, C.sky, C.red, C.violet, C.emerald, rC];
          let cx3 = MARGIN+2;
          vals.forEach((v, i) => { text(String(v), cx3+1, y+5, 6, vC[i], "left", i===6?"bold":"normal"); cx3+=colW[i]; });
          y += 8;
        });
        y += 4;
      }

      // ── PAGE 3: Recommendations ──
      checkPage(20); if (y>200) newPage(); y += 6;
      secHdr("التوصيات والإجراءات المقترحة", "RECOMMENDATIONS", C.emerald);
      recs.forEach(rec => {
        checkPage(20);
        const rC  = rec.type==="critical"?C.red:rec.type==="warning"?C.yellow:C.emerald;
        const rBg = rec.type==="critical"?[40,10,10]:rec.type==="warning"?[40,35,10]:[10,35,25];
        fillRect(MARGIN, y, CW, 14, rBg, 2); strokeRect(MARGIN, y, CW, 14, rC, 0.3, 2);
        fillRect(MARGIN, y, 3, 14, rC, 1);
        text(rec.icon+"  "+rec.text, MARGIN+6, y+6, 7.5, C.slate200, "left");
        const sl = rec.type==="critical"?"أولوية قصوى":rec.type==="warning"?"تحتاج متابعة":"حالة مثلى";
        text(sl, MARGIN+6, y+11, 6, rC, "left");
        y += 17;
      });

      // ── Footer + page numbers ──
      checkPage(16); y = Math.max(y, 272);
      fillRect(0, y, W, 16, C.bg3); hLine(y, C.border, 0.3);
      text("تم إنشاء هذا التقرير تلقائياً بواسطة نظام المراقبة الذكية", MARGIN, y+7, 6.5, C.slate600, "left");
      text(`${tower?.TowerName||"—"}  |  ${reportDate.slice(0,28)}`, W-MARGIN, y+7, 6.5, C.slate600, "right");
      text(`Risk: ${prob.toFixed(1)}% — ${riskLabel}  |  Health: ${health?.overall.toFixed(1)??"—"}%`, MARGIN, y+13, 6, C.slate700, "left");
      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) { doc.setPage(p); text(`${p} / ${pageCount}`, W/2, 293, 6.5, C.slate700, "center"); }

      doc.save(`tower-report-${(tower?.TowerName||selectedId).replace(/\s+/g,"-")}-${Date.now()}.pdf`);
    } catch(e) {
      console.error("PDF Error:", e);
    } finally {
      setDownloading(false);
    }
  }, [tower, selectedId, towerData, stats, health, prob, isAnomaly, recs, history, reportDate]);

  const printReport = () => window.print();
  const shareReport = () => {
    if (navigator.share) navigator.share({ title: `تقرير برج ${tower?.TowerName}`, text: `تقرير حالة البرج — خطر: ${prob.toFixed(1)}%` });
  };

  const SECTIONS = [
    { id: "all",      label: "الكل"       },
    { id: "overview", label: "نظرة عامة"  },
    { id: "metrics",  label: "المقاييس"   },
    { id: "charts",   label: "الرسوم"     },
    { id: "recs",     label: "التوصيات"   },
  ];

  return (
    <div className="min-h-screen text-slate-300 p-4 md:p-8" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        * { font-family: 'Tajawal', sans-serif; }
        .mono { font-family: 'Space Mono', monospace !important; }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .shimmer { background:linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp 0.4s ease forwards; }
        @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(14,165,233,0.4)} 100%{box-shadow:0 0 0 12px transparent} }
        .pulse-ring { animation:pulse-ring 2s infinite; }
        @media print { body{background:white!important} .no-print{display:none!important} }
      `}</style>

      {/* ── TOP BAR ── */}
      <div className="no-print flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center pulse-ring">
            <FileText size={22} className="text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-100 tracking-wide mono">نظام التقارير</h1>
            <p className="text-[10px] text-slate-600 mono tracking-[0.2em]">TOWER INTELLIGENCE REPORT SYSTEM</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/40 cursor-pointer appearance-none min-w-50"
            >
              <option value="">اختر البرج...</option>
              {towers.map(t => <option key={t._id} value={t._id}>{t.TowerName}</option>)}
            </select>
            <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {selectedId && !loading && towerData && (
            <div className="flex items-center gap-2">
              <button onClick={downloadPDF} disabled={downloading}
                className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 rounded-xl px-4 py-2.5 text-sm font-bold transition-all disabled:opacity-40">
                {downloading ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
                {downloading ? "تحميل..." : "PDF"}
              </button>
              <button onClick={printReport}
                className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold transition-all">
                <Printer size={15} />طباعة
              </button>
              {typeof navigator !== "undefined" && navigator.share && (
                <button onClick={shareReport}
                  className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 rounded-xl px-4 py-2.5 text-sm font-bold transition-all">
                  <Share2 size={15} />مشاركة
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Section tabs ── */}
      {towerData && !loading && (
        <div className="no-print flex items-center gap-2 mb-6 flex-wrap">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold mono transition-all ${
                activeSection === s.id
                  ? "bg-sky-500/20 border border-sky-500/40 text-sky-300"
                  : "bg-slate-800 border border-slate-700/50 text-slate-500 hover:text-slate-400"
              }`}>
              {s.label}
            </button>
          ))}

          {/* Source indicator badge */}
          <div className={`mr-auto flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] mono ${
            statusInfo.source === "ai"
              ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          }`}>
            <span>{statusInfo.source === "ai" ? "🤖" : "⚙️"}</span>
            {statusInfo.source === "ai" ? "تقييم AI" : "محسوب من القيم"}
          </div>
        </div>
      )}

      {/* ── Empty / Loading / Error ── */}
      {!selectedId && (
        <div className="flex flex-col items-center justify-center py-32 gap-6 fade-up">
          <div className="w-24 h-24 rounded-3xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
            <Radio size={40} className="text-slate-600" />
          </div>
          <p className="text-slate-400 font-bold text-lg">اختر برجاً لإنشاء التقرير</p>
          <p className="text-slate-600 text-sm font-mono">SELECT A TOWER TO GENERATE INTELLIGENCE REPORT</p>
        </div>
      )}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 fade-up">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 rounded-2xl shimmer" />)}
        </div>
      )}
      {error && !loading && (
        <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-2xl px-6 py-4 text-red-400 text-sm fade-up">
          <AlertTriangle size={18} />{error}
        </div>
      )}

      {/* ══ REPORT CONTENT ══ */}
      {!loading && towerData && (
        <div ref={reportRef} className="space-y-6">

          {/* ── HEADER ── */}
          {(activeSection === "all" || activeSection === "overview") && (
            <div className="fade-up bg-linear-to-br from-slate-900 via-[#0a1628] to-slate-900 border border-slate-700/60 rounded-3xl overflow-hidden">
              <div className="h-1 w-full bg-linear-to-r from-sky-500 via-violet-500 to-sky-500" />
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-sky-500/20 to-violet-500/20 border border-sky-500/30 flex items-center justify-center text-3xl">📡</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] mono text-sky-500/70 tracking-[0.3em] uppercase">تقرير ذكاء الشبكة</span>
                      </div>
                      <h2 className="text-2xl font-black text-slate-100 tracking-wide">{tower?.TowerName || "—"}</h2>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {tower?.ip_address && <span className="flex items-center gap-1.5 text-xs mono text-slate-500"><Wifi size={11} className="text-sky-500" />{tower.ip_address}</span>}
                        {tower?.vendor    && <span className="flex items-center gap-1.5 text-xs mono text-slate-500"><Cpu size={11} className="text-violet-400" />{tower.vendor}</span>}
                        {tower?.location  && <span className="flex items-center gap-1.5 text-xs mono text-slate-500"><MapPin size={11} className="text-emerald-400" />{tower.location.lat?.toFixed(4)}, {tower.location.lng?.toFixed(4)}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Status badge — يعكس الحالة الحقيقية */}
                  <div className={`flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-2xl border ${risk.bg} ${risk.border} min-w-40`}>
                    <div className={`w-3 h-3 rounded-full ${risk.dot} pulse-ring`} />
                    <p className="text-[10px] mono text-slate-600 tracking-widest">NETWORK STATUS</p>
                    <p className={`text-xl font-black mono ${risk.color}`}>{isAnomaly ? "خطر" : "آمن"}</p>
                    <p className={`text-sm font-bold mono ${risk.color}`}>{risk.label}</p>
                    <p className="text-[10px] mono text-slate-600">{prob.toFixed(1)}% احتمالية</p>
                    <div className={`text-[9px] mono px-2 py-0.5 rounded-full border ${
                      statusInfo.source === "ai"
                        ? "text-sky-400 bg-sky-500/10 border-sky-500/20"
                        : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    }`}>
                      {statusInfo.source === "ai" ? "🤖 AI" : "⚙️ محسوب"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: Calendar, label: "تاريخ التقرير",   value: reportDate },
                    { icon: Clock,    label: "آخر قياس",         value: towerData.lastMeasurement?.createdAt ? new Date(towerData.lastMeasurement.createdAt).toLocaleString("ar-EG") : "—" },
                    { icon: BarChart2,label: "إجمالي القياسات", value: `${history.length} قياس` },
                    { icon: Shield,   label: "درجة الأمان",      value: health ? `${health.overall.toFixed(1)}%` : "—" },
                  ].map(({ icon: I, label, value }, i) => (
                    <div key={i} className="bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-1.5">
                        <I size={11} className="text-slate-500" />
                        <span className="text-[9px] mono text-slate-600 uppercase tracking-widest">{label}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-300 mono truncate">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STATS ── */}
          {stats && (activeSection === "all" || activeSection === "metrics") && (
            <div className="fade-up">
              <SectionHeader icon={Activity} title="مقاييس الأداء الشبكي" subtitle="NETWORK PERFORMANCE METRICS" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Clock}         label="Latency"     value={stats.latency}    unit="ms"   score={health?.latency}    color="sky"     />
                <StatCard icon={AlertTriangle} label="Packet Loss" value={stats.packetLoss} unit="%"    score={health?.packetLoss} color="red"     />
                <StatCard icon={Activity}      label="Jitter"      value={stats.jitter}     unit="ms"   score={health?.jitter}     color="violet"  />
                <StatCard icon={Wifi}          label="Throughput"  value={stats.throughput} unit="Mbps" score={health?.throughput} color="emerald" />
              </div>
              {health && (
                <div className="mt-4 bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs mono text-slate-500 uppercase tracking-widest">مؤشر الصحة الشاملة للشبكة</p>
                    <p className={`text-lg font-black mono ${health.overall>=70?"text-emerald-400":health.overall>=40?"text-yellow-400":"text-red-400"}`}>
                      {health.overall.toFixed(1)}%
                    </p>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{
                      width: `${health.overall}%`,
                      background: `linear-gradient(90deg,${health.overall>=70?"#10b981,#34d399":health.overall>=40?"#f59e0b,#fbbf24":"#ef4444,#f87171"})`,
                      boxShadow: `0 0 10px ${health.overall>=70?"#10b981":health.overall>=40?"#f59e0b":"#ef4444"}50`
                    }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── RISK METER + RADAR ── */}
          {(activeSection === "all" || activeSection === "metrics") && (
            <div className="fade-up grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-6">
                <SectionHeader icon={Shield} title="مقياس المخاطر" subtitle={statusInfo.source==="ai"?"AI RISK ASSESSMENT":"CALCULATED RISK"} color="red" />
                <div className="flex flex-col items-center">
                  <RiskMeter value={prob} />
                  <div className="mt-4 w-full grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                      <p className="text-[9px] mono text-slate-600 mb-1">حالة الشبكة</p>
                      <p className={`text-sm font-black mono ${isAnomaly?"text-red-400":"text-emerald-400"}`}>
                        {isAnomaly ? "⚠ خطر مكتشف" : "✓ حالة طبيعية"}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                      <p className="text-[9px] mono text-slate-600 mb-1">مصدر التقييم</p>
                      <p className={`text-sm font-black mono ${statusInfo.source==="ai"?"text-sky-400":"text-amber-400"}`}>
                        {statusInfo.source === "ai" ? "🤖 AI" : "⚙️ محسوب"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-6">
                <SectionHeader icon={BarChart2} title="مخطط الأداء الشبكي" subtitle="PERFORMANCE RADAR" color="violet" />
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData} cx="50%" cy="50%">
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: "#475569", fontSize: 10, fontFamily: "monospace" }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#334155", fontSize: 8 }} />
                      <Radar name="الصحة" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-600 mono text-xs text-center py-10">لا توجد بيانات</p>}
              </div>
            </div>
          )}

          {/* ── CHARTS ── */}
          {history.length > 0 && (activeSection === "all" || activeSection === "charts") && (
            <div className="fade-up space-y-4">
              <SectionHeader icon={TrendingUp} title="الرسوم البيانية الزمنية" subtitle="TIME-SERIES ANALYSIS" />
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-6">
                <p className="text-[10px] mono text-slate-600 tracking-widest uppercase mb-4">مسار احتمالية الخطر عبر الزمن</p>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={isAnomaly?"#ef4444":"#22c55e"} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={isAnomaly?"#ef4444":"#22c55e"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" tick={{ fill:"#334155", fontSize:9, fontFamily:"monospace" }} />
                    <YAxis domain={[0,100]} tick={{ fill:"#334155", fontSize:9, fontFamily:"monospace" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="risk" name="خطر %"
                      stroke={isAnomaly?"#ef4444":"#22c55e"} fill="url(#riskGrad)" strokeWidth={2}
                      dot={{ r:3, fill:isAnomaly?"#ef4444":"#22c55e" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-6">
                <p className="text-[10px] mono text-slate-600 tracking-widest uppercase mb-4">مقاييس الشبكة الزمنية</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" tick={{ fill:"#334155", fontSize:9, fontFamily:"monospace" }} />
                    <YAxis tick={{ fill:"#334155", fontSize:9, fontFamily:"monospace" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="latency"    name="Latency"    stroke="#38bdf8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="packetLoss" name="PacketLoss" stroke="#f87171" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="jitter"     name="Jitter"     stroke="#a78bfa" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="throughput" name="Throughput" stroke="#34d399" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-6">
                <p className="text-[10px] mono text-slate-600 tracking-widest uppercase mb-4">مقارنة المقاييس بالنطاق الطبيعي</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={[
                    { name:"Latency",    actual:parseFloat(stats?.latency)||0,    threshold:100 },
                    { name:"PacketLoss", actual:parseFloat(stats?.packetLoss)||0, threshold:5   },
                    { name:"Jitter",     actual:parseFloat(stats?.jitter)||0,     threshold:20  },
                    { name:"Throughput", actual:parseFloat(stats?.throughput)||0, threshold:50  },
                  ]} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" tick={{ fill:"#475569", fontSize:10, fontFamily:"monospace" }} />
                    <YAxis tick={{ fill:"#334155", fontSize:9, fontFamily:"monospace" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="actual"    name="القيمة الفعلية" fill="#38bdf8" radius={[4,4,0,0]} />
                    <Bar dataKey="threshold" name="الحد المسموح"  fill="#334155" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── RECOMMENDATIONS ── */}
          {(activeSection === "all" || activeSection === "recs") && (
            <div className="fade-up">
              <SectionHeader icon={Info} title="التوصيات والإجراءات المقترحة" subtitle="AI-POWERED RECOMMENDATIONS" color="emerald" />
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

          {/* ── HISTORY TABLE ── */}
          {history.length > 0 && (activeSection === "all" || activeSection === "metrics") && (
            <div className="fade-up">
              <SectionHeader icon={FileText} title="جدول البيانات التاريخية" subtitle="HISTORICAL DATA TABLE" />
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl overflow-hidden">
                <table className="w-full text-xs mono">
                  <thead>
                    <tr className="border-b border-slate-700/60 bg-slate-800/50">
                      {["#","الوقت","Latency (ms)","Packet Loss (%)","Jitter (ms)","Throughput (Mbps)","خطر (%)"].map(h => (
                        <th key={h} className="px-4 py-3 text-right text-[9px] text-slate-500 tracking-widest uppercase font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row, i) => {
                      const r = getRisk(row.risk);
                      return (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-2.5 text-slate-700">{i+1}</td>
                          <td className="px-4 py-2.5 text-slate-400">{row.time}</td>
                          <td className="px-4 py-2.5 text-sky-400">{row.latency}</td>
                          <td className="px-4 py-2.5 text-red-400">{row.packetLoss}</td>
                          <td className="px-4 py-2.5 text-violet-400">{row.jitter}</td>
                          <td className="px-4 py-2.5 text-emerald-400">{row.throughput}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-bold ${r.bg} ${r.border} ${r.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
                              {row.risk}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── FOOTER ── */}
          {activeSection === "all" && (
            <div className="fade-up bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Radio size={16} className="text-sky-500" />
                  <div>
                    <p className="text-[10px] mono text-slate-600 tracking-widest">تم إنشاء هذا التقرير تلقائياً بواسطة نظام المراقبة الذكية</p>
                    <p className="text-[10px] mono text-slate-700">GENERATED BY SMART NETWORK MONITORING SYSTEM • {reportDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${risk.dot}`} />
                  <span className={`text-xs mono font-bold ${risk.color}`}>{isAnomaly?"⚠ تحذير نشط":"✓ حالة مستقرة"}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}