"use client";
import { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import {
  AlertTriangle, CheckCircle2, Clock, Plus, MessageSquare,
  ChevronDown, ChevronUp, Trash2, RefreshCw, Activity,
  AlertCircle, Zap, FileText, User, Calendar, Tag,
  BookOpen, Lock, Unlock, ArrowRight, MessageSquareWarning
} from "lucide-react";

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  open: {
    label: "مفتوحة", bg: "bg-red-500/10", border: "border-red-500/30",
    color: "text-red-400", dot: "bg-red-400", icon: AlertCircle,
  },
  in_progress: {
    label: "جارٍ العمل", bg: "bg-orange-500/10", border: "border-orange-500/30",
    color: "text-orange-400", dot: "bg-orange-400", icon: Activity,
  },
  resolved: {
    label: "تم الحل", bg: "bg-emerald-500/10", border: "border-emerald-500/30",
    color: "text-emerald-400", dot: "bg-emerald-400", icon: CheckCircle2,
  },
  closed: {
    label: "مغلقة", bg: "bg-slate-500/10", border: "border-slate-500/30",
    color: "text-slate-400", dot: "bg-slate-500", icon: Lock,
  },
};

const PRIORITY_CFG = {
  low: { label: "منخفضة", color: "text-slate-400", bg: "bg-slate-500/10" },
  medium: { label: "متوسطة", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  high: { label: "عالية", color: "text-orange-400", bg: "bg-orange-500/10" },
  critical: { label: "حرجة", color: "text-red-400", bg: "bg-red-500/10" },
};

const ISSUE_TYPE_CFG = {
  critical: { label: "⚠️ حرج", color: "text-orange-400" },
  danger: { label: "🚨 خطر", color: "text-red-400" },
  warning: { label: "⚡ تحذير", color: "text-yellow-400" },
  maintenance: { label: "🔧 صيانة", color: "text-blue-400" },
  other: { label: "📌 أخرى", color: "text-slate-400" },
};

function timeAgo(dateStr) {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `منذ ${diff} ث`;
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

// ─── Create Issue Modal ────────────────────────────────────────────────────────
function CreateIssueModal({ towers, onClose, onCreated, prefillData }) {
  const [form, setForm] = useState({
    towerId: prefillData?.towerId || "",
    issueType: prefillData?.issueType || "warning",
    title: prefillData?.title || "",
    description: prefillData?.description || "",
    priority: prefillData?.priority || "medium",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.towerId || !form.title) {
      setError("يرجى اختيار البرج وكتابة عنوان المشكلة");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/towerIssues/create", form);
      if (res.data.success) {
        onCreated(res.data.data);
        onClose();
      }
    } catch (err) {
      setError("فشل في إنشاء التذكرة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${prefillData ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-indigo-500/20 border border-indigo-500/30'}`}>
            {prefillData ? <MessageSquareWarning className="text-purple-400" size={20} /> : <Plus className="text-indigo-400" size={20} />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">فتح تذكرة جديدة</h2>
            {prefillData ? (
              <p className="text-xs text-purple-400 font-mono">مستوردة من شكوى مستخدم</p>
            ) : (
              <p className="text-xs text-slate-400 font-mono">NEW MAINTENANCE TICKET</p>
            )}
          </div>
        </div>

        {prefillData && (
          <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <p className="text-xs text-purple-300 font-semibold flex items-center gap-1.5">
              <MessageSquareWarning size={13} /> تم استيراد البيانات من شكوى: <span className="text-white">{prefillData.complaintTitle}</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">يمكنك تعديل أي حقل قبل فتح التذكرة</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-cyan-400 font-mono uppercase tracking-widest mb-1.5 block">◈ البرج</label>
            <select
              value={form.towerId}
              onChange={e => setForm(f => ({ ...f, towerId: e.target.value }))}
              className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            >
              <option value="">-- اختر البرج --</option>
              {towers.map(t => <option key={t._id} value={t._id}>{t.TowerName}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-cyan-400 font-mono uppercase tracking-widest mb-1.5 block">نوع المشكلة</label>
              <select
                value={form.issueType}
                onChange={e => setForm(f => ({ ...f, issueType: e.target.value }))}
                className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-all"
              >
                <option value="warning">⚡ تحذير</option>
                <option value="critical">⚠️ حرج</option>
                <option value="danger">🚨 خطر</option>
                <option value="maintenance">🔧 صيانة</option>
                <option value="other">📌 أخرى</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-cyan-400 font-mono uppercase tracking-widest mb-1.5 block">الأولوية</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-all"
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="critical">حرجة</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-cyan-400 font-mono uppercase tracking-widest mb-1.5 block">عنوان المشكلة</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="اكتب عنواناً وصفياً للمشكلة..."
              className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-cyan-400 font-mono uppercase tracking-widest mb-1.5 block">الوصف (اختياري)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="تفاصيل إضافية، الأعراض، الإجراءات المتخذة..."
              rows={3}
              className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all text-sm font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              فتح التذكرة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Engineer Note Add Form ────────────────────────────────────────────────────
function AddNoteForm({ issueId, onNoteAdded }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setLoading(true);
    try {
      const res = await API.post(`/towerIssues/${issueId}/note`, { note });
      if (res.data.success) {
        onNoteAdded(res.data.data);
        setNote("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
      <input
        type="text"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="أكتب ملاحظة للمهندس المختص..."
        className="flex-1 bg-slate-900/60 border border-slate-700/60 text-slate-200 rounded-lg px-3 py-2 text-xs placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all"
      />
      <button
        type="submit"
        disabled={loading || !note.trim()}
        className="px-3 py-2 bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-bold hover:bg-cyan-500/30 transition-all disabled:opacity-40 flex items-center gap-1.5"
      >
        {loading ? <RefreshCw size={10} className="animate-spin" /> : <MessageSquare size={12} />}
        إرسال
      </button>
    </form>
  );
}

// ─── Issue Card ───────────────────────────────────────────────────────────────
function IssueCard({ issue, onUpdate, onDelete, isAdmin }) {
  const [expanded, setExpanded] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const s = STATUS_CFG[issue.status] || STATUS_CFG.open;
  const p = PRIORITY_CFG[issue.priority] || PRIORITY_CFG.medium;
  const issueType = ISSUE_TYPE_CFG[issue.issueType] || ISSUE_TYPE_CFG.other;
  const StatusIcon = s.icon;

  const STATUS_TRANSITIONS = {
    open: [{ value: "in_progress", label: "بدء العمل عليها", icon: Activity }],
    in_progress: [
      { value: "resolved", label: "تم الحل ✓", icon: CheckCircle2 },
      { value: "open", label: "إعادة فتح", icon: Unlock },
    ],
    resolved: [
      { value: "closed", label: "إغلاق نهائي", icon: Lock },
      { value: "in_progress", label: "إعادة فتح", icon: Unlock },
    ],
    closed: [{ value: "open", label: "إعادة فتح", icon: Unlock }],
  };

  const transitions = STATUS_TRANSITIONS[issue.status] || [];

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await API.patch(`/towerIssues/${issue._id}/status`, { status: newStatus });
      if (res.data.success) onUpdate(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className={`rounded-2xl border ${s.border} ${s.bg} backdrop-blur-sm transition-all duration-200`}>
      {/* Card Header */}
      <div
        className="flex items-start justify-between gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Status dot */}
          <div className="relative shrink-0 mt-1">
            <span className={`block w-2.5 h-2.5 rounded-full ${s.dot} ${issue.status === 'open' ? 'animate-pulse' : ''}`} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-100 text-sm truncate">{issue.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${s.border} ${s.bg} ${s.color}`}>
                {s.label}
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${p.bg} ${p.color}`}>
                {p.label}
              </span>
              <span className={`text-[9px] font-mono ${issueType.color}`}>{issueType.label}</span>
              <span className="text-[9px] text-slate-500 font-mono flex items-center gap-0.5">
                <Clock size={8} />{timeAgo(issue.createdAt)}
              </span>
            </div>
            {/* Measurements snapshot */}
            {issue.measurements && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {[
                  { k: "Lat", v: issue.measurements.latency, u: "ms", c: "text-cyan-400" },
                  { k: "Loss", v: issue.measurements.packetLoss, u: "%", c: "text-red-400" },
                  { k: "Jitter", v: issue.measurements.jitter, u: "ms", c: "text-purple-400" },
                  { k: "Thr", v: issue.measurements.throughput, u: "Mb", c: "text-emerald-400" },
                ].map(m => (
                  <span key={m.k} className="text-[9px] font-mono bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-700/50">
                    <span className="text-slate-500">{m.k}: </span>
                    <span className={m.c}>{m.v ?? "—"}{m.u}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {issue.engineerNotes?.length > 0 && (
            <span className="text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono">
              {issue.engineerNotes.length} ملاحظة
            </span>
          )}
          {expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700/30 pt-3 space-y-4">
          {/* Description */}
          {issue.description && (
            <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-700/40">
              <p className="text-[9px] text-cyan-400 font-mono uppercase tracking-widest mb-1.5">الوصف</p>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{issue.description}</p>
            </div>
          )}

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-400">
              <User size={10} className="text-slate-500" />
              <span className="text-slate-500">فتح بواسطة:</span>
              <span>{issue.createdByName || "النظام"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar size={10} className="text-slate-500" />
              <span className="text-slate-500">التاريخ:</span>
              <span>{new Date(issue.createdAt).toLocaleDateString("ar-EG")}</span>
            </div>
            {issue.resolvedAt && (
              <div className="flex items-center gap-1.5 text-emerald-400 col-span-2">
                <CheckCircle2 size={10} />
                <span>تم الحل: {new Date(issue.resolvedAt).toLocaleString("ar-EG")} — بواسطة {issue.resolvedBy}</span>
              </div>
            )}
          </div>

          {/* AI Result */}
          {issue.aiResult && (
            <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-700/40">
              <p className="text-[9px] text-cyan-400 font-mono uppercase tracking-widest mb-2">نتيجة الذكاء الاصطناعي</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-xs font-mono font-bold ${issue.aiResult.isAnomaly ? "text-red-400" : "text-emerald-400"}`}>
                  {issue.aiResult.isAnomaly ? "⚠️ شذوذ مكتشف" : "✅ طبيعي"}
                </span>
                {issue.aiResult.probability != null && (
                  <span className="text-xs font-mono text-slate-400">
                    احتمال الخطر: <span className="text-orange-400 font-bold">{parseFloat(issue.aiResult.probability).toFixed(1)}%</span>
                  </span>
                )}
                {issue.aiResult.riskLevel && (
                  <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">{issue.aiResult.riskLevel}</span>
                )}
              </div>
            </div>
          )}

          {/* Engineer Notes */}
          <div>
            <p className="text-[9px] text-cyan-400 font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <MessageSquare size={10} /> ملاحظات المهندسين ({issue.engineerNotes?.length || 0})
            </p>
            <div className="space-y-2">
              {(issue.engineerNotes || []).map((n, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-700/40 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono text-indigo-400 font-bold">{n.addedBy || "مهندس"}</span>
                    <span className="text-[8px] text-slate-600 font-mono">{timeAgo(n.addedAt)}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.note}</p>
                </div>
              ))}
              {(issue.engineerNotes || []).length === 0 && (
                <p className="text-[10px] text-slate-600 font-mono italic text-center py-2">لا توجد ملاحظات بعد</p>
              )}
            </div>
            <AddNoteForm issueId={issue._id} onNoteAdded={onUpdate} />
          </div>

          {/* Status Actions */}
          {transitions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-700/30">
              <span className="text-[9px] text-slate-500 font-mono">تغيير الحالة:</span>
              {transitions.map(t => {
                const TIcon = t.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => handleStatusChange(t.value)}
                    disabled={updatingStatus}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-50 ${t.value === 'resolved' || t.value === 'closed'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        : t.value === 'in_progress'
                          ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                          : 'bg-slate-700/30 border-slate-600/50 text-slate-400 hover:bg-slate-700/50'
                      }`}
                  >
                    {updatingStatus ? <RefreshCw size={11} className="animate-spin" /> : <TIcon size={11} />}
                    {t.label}
                  </button>
                );
              })}
              {isAdmin && (
                <button
                  onClick={() => onDelete(issue._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all mr-auto"
                >
                  <Trash2 size={11} /> حذف
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar({ stats }) {
  const items = [
    { key: "open", label: "مفتوحة", color: "text-red-400", bg: "bg-red-500" },
    { key: "in_progress", label: "جارية", color: "text-orange-400", bg: "bg-orange-500" },
    { key: "resolved", label: "محلولة", color: "text-emerald-400", bg: "bg-emerald-500" },
    { key: "closed", label: "مغلقة", color: "text-slate-400", bg: "bg-slate-500" },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map(it => (
        <div key={it.key} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
          <p className={`text-2xl font-bold font-mono ${it.color}`}>{stats[it.key] || 0}</p>
          <p className="text-[9px] text-slate-500 font-mono mt-0.5">{it.label}</p>
          <div className="h-0.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${it.bg} rounded-full transition-all duration-700`}
              style={{ width: stats.total ? `${((stats[it.key] || 0) / stats.total) * 100}%` : "0%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function TowerIssueHistory({ user, prefillData, onPrefillConsumed }) {
  const [issues, setIssues] = useState([]);
  const [towers, setTowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(!!prefillData);
  const [activePrefill, setActivePrefill] = useState(prefillData || null);
  const [stats, setStats] = useState({ open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 });

  // When prefillData changes from parent (new complaint opened)
  useEffect(() => {
    if (prefillData) {
      setActivePrefill(prefillData);
      setShowCreateModal(true);
    }
  }, [prefillData]);

  // Filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTower, setFilterTower] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const isAdmin = user?.isAdmin;

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterTower !== "all") params.append("towerId", filterTower);
      if (filterPriority !== "all") params.append("priority", filterPriority);

      const res = await API.get(`/towerIssues/all?${params}`);
      if (res.data.success) {
        setIssues(res.data.data);

        // Compute stats from returned issues
        const s = { open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 };
        res.data.data.forEach(i => { s[i.status] = (s[i.status] || 0) + 1; s.total++; });
        setStats(s);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterTower, filterPriority]);

  useEffect(() => {
    API.get("/towerMap/getTower")
      .then(res => { if (res.data.success) setTowers(res.data.data); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleUpdate = useCallback((updatedIssue) => {
    setIssues(prev => prev.map(i => i._id === updatedIssue._id ? updatedIssue : i));
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذه التذكرة؟")) return;
    try {
      await API.delete(`/towerIssues/${id}`);
      setIssues(prev => prev.filter(i => i._id !== id));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleCreated = useCallback((newIssue) => {
    setIssues(prev => [newIssue, ...prev]);
    setStats(s => ({ ...s, open: s.open + 1, total: s.total + 1 }));
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowCreateModal(false);
    setActivePrefill(null);
    if (onPrefillConsumed) onPrefillConsumed();
  }, [onPrefillConsumed]);

  return (
    <div className="min-h-screen text-slate-100 space-y-6" dir="rtl">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .anim-fade { animation: fadeIn 0.35s ease forwards; }
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/30">
            🎫
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">سجل المشاكل والتذاكر</h1>
            <p className="text-xs text-slate-400 font-mono mt-1 tracking-widest">TOWER ISSUE & TICKET MANAGEMENT SYSTEM</p>
          </div>
        </div>
        <button
          onClick={() => { setActivePrefill(null); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
        >
          <Plus size={16} /> فتح تذكرة جديدة
        </button>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Filters */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">تصفية:</span>

          {/* Status Filter */}
          <div className="flex gap-1.5 flex-wrap">
            {[
              { v: "all", l: "الكل" },
              { v: "open", l: "مفتوحة" },
              { v: "in_progress", l: "جارية" },
              { v: "resolved", l: "محلولة" },
              { v: "closed", l: "مغلقة" },
            ].map(f => (
              <button
                key={f.v}
                onClick={() => setFilterStatus(f.v)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border ${filterStatus === f.v
                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                    : "bg-slate-700/30 border-slate-700/30 text-slate-500 hover:text-slate-300"
                  }`}
              >
                {f.l}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Tower Filter */}
          <select
            value={filterTower}
            onChange={e => setFilterTower(e.target.value)}
            className="bg-slate-800/60 border border-slate-700/50 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500 transition-all"
          >
            <option value="all">كل الأبراج</option>
            {towers.map(t => <option key={t._id} value={t._id}>{t.TowerName}</option>)}
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="bg-slate-800/60 border border-slate-700/50 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500 transition-all"
          >
            <option value="all">كل الأولويات</option>
            <option value="critical">حرجة</option>
            <option value="high">عالية</option>
            <option value="medium">متوسطة</option>
            <option value="low">منخفضة</option>
          </select>

          <button
            onClick={fetchIssues}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-700/30 border border-slate-600/50 text-slate-400 hover:text-slate-200 transition-all mr-auto"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> تحديث
          </button>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {loading && issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <RefreshCw size={32} className="animate-spin opacity-30" />
            <p className="font-mono text-sm">جاري تحميل التذاكر...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20">
            <BookOpen size={40} className="opacity-20" />
            <p className="text-slate-500 font-mono text-sm">لا توجد تذاكر مطابقة للفلترة</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 transition-all"
            >
              <Plus size={12} /> فتح أول تذكرة
            </button>
          </div>
        ) : (
          <div className="space-y-3 anim-fade">
            {issues.map(issue => (
              <IssueCard
                key={issue._id}
                issue={issue}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateIssueModal
          towers={towers}
          onClose={handleCloseModal}
          onCreated={handleCreated}
          prefillData={activePrefill}
        />
      )}
    </div>
  );
}
