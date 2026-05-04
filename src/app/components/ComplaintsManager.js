"use client";
import { useState, useEffect, useCallback } from "react";
import {
    MessageSquareWarning,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    RefreshCw,
    MapPin,
    Radio,
    User,
    Ticket,
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff,
    Filter,
    FileText,
    ArrowLeftCircle,
} from "lucide-react";
import API from "@/app/services/api";
import { NotifiySuccess, NotifiyErorr } from "@/app/components/Notify";

// ─── Status Config ──────────────────────────────────────────────────────────
const STATUS_MAP = {
    pending: {
        label: "قيد الانتظار",
        icon: Clock,
        color: "text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/20",
        dot: "bg-amber-400",
    },
    in_progress: {
        label: "جارٍ المعالجة",
        icon: AlertCircle,
        color: "text-blue-400",
        bg: "bg-blue-500/10 border-blue-500/20",
        dot: "bg-blue-400",
    },
    resolved: {
        label: "تم الحل",
        icon: CheckCircle2,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/20",
        dot: "bg-emerald-400",
    },
    rejected: {
        label: "مرفوضة",
        icon: XCircle,
        color: "text-red-400",
        bg: "bg-red-500/10 border-red-500/20",
        dot: "bg-red-400",
    },
};

const PROBLEM_TYPE_COLORS = {
    "انقطاع الإشارة": "text-red-400 bg-red-500/10 border-red-500/20",
    "ضعف الإشارة": "text-orange-400 bg-orange-500/10 border-orange-500/20",
    "تداخل في الشبكة": "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    "مشكلة اتصال": "text-blue-400 bg-blue-500/10 border-blue-500/20",
    "أخرى": "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

function StatusBadge({ status }) {
    const s = STATUS_MAP[status] || STATUS_MAP.pending;
    const Icon = s.icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.color}`}
        >
            <Icon className="w-3.5 h-3.5" />
            {s.label}
        </span>
    );
}

function timeAgo(dateStr) {
    const now = Date.now();
    const d = new Date(dateStr).getTime();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return `منذ ${diff} ث`;
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
}

// ─── Complaint Card ─────────────────────────────────────────────────────────
function ComplaintCard({ complaint, onStatusChange, onOpenTicket, onMarkRead }) {
    const [expanded, setExpanded] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [note, setNote] = useState(complaint.adminNote || "");
    const s = STATUS_MAP[complaint.status] || STATUS_MAP.pending;
    const Icon = s.icon;
    const ptColor =
        PROBLEM_TYPE_COLORS[complaint.problemType] ||
        PROBLEM_TYPE_COLORS["أخرى"];

    const handleStatusUpdate = async (newStatus) => {
        setUpdating(true);
        try {
            const res = await API.patch(`/complaints/${complaint._id}/status`, {
                status: newStatus,
                adminNote: note,
            });
            onStatusChange(res.data.complaint);
            NotifiySuccess("تم تحديث حالة الشكوى");
        } catch {
            /* handled by API interceptor */
        } finally {
            setUpdating(false);
        }
    };

    const handleToggleRead = async () => {
        try {
            await API.patch(`/complaints/${complaint._id}/read`);
            onMarkRead(complaint._id, !complaint.isReadByAdmin);
        } catch {
            /* silent */
        }
    };

    return (
        <div
            className={`rounded-2xl border backdrop-blur-sm transition-all duration-200 ${!complaint.isReadByAdmin
                    ? "border-indigo-500/40 bg-indigo-500/5 shadow-lg shadow-indigo-500/5"
                    : "border-slate-700/50 bg-slate-800/30"
                }`}
        >
            {/* Card Header */}
            <div className="p-4 cursor-pointer" onClick={() => setExpanded((e) => !e)}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Unread dot */}
                        <span
                            className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!complaint.isReadByAdmin ? "bg-indigo-400 animate-pulse" : "bg-slate-600"
                                }`}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                {!complaint.isReadByAdmin && (
                                    <span className="text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                                        جديدة
                                    </span>
                                )}
                                <p className="font-bold text-slate-100 text-sm truncate">
                                    {complaint.title}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <StatusBadge status={complaint.status} />
                                {complaint.problemType && (
                                    <span
                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${ptColor}`}
                                    >
                                        {complaint.problemType}
                                    </span>
                                )}
                                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {timeAgo(complaint.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {expanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded */}
            {expanded && (
                <div className="px-4 pb-4 border-t border-slate-700/30 pt-4 space-y-4">
                    {/* Submitter info */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-semibold text-slate-200">
                            {complaint.userName}
                        </span>
                        {complaint.userId?.email && (
                            <span className="text-slate-500">({complaint.userId.email})</span>
                        )}
                        {complaint.userId?.section && (
                            <span className="bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded text-[10px]">
                                {complaint.userId.section}
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/40">
                        <p className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest mb-2">
                            تفاصيل الشكوى
                        </p>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                            {complaint.description}
                        </p>
                    </div>

                    {/* Locations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(complaint.userLocation?.lat || complaint.userLocation?.address) && (
                            <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-700/40">
                                <p className="text-[9px] text-emerald-400 font-mono uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> موقع المستخدم
                                </p>
                                {complaint.userLocation.address && (
                                    <p className="text-xs text-slate-300">{complaint.userLocation.address}</p>
                                )}
                                {complaint.userLocation.lat && (
                                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                                        {complaint.userLocation.lat?.toFixed(5)},{" "}
                                        {complaint.userLocation.lng?.toFixed(5)}
                                    </p>
                                )}
                            </div>
                        )}
                        {(complaint.towerName || complaint.towerLocation?.lat) && (
                            <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-700/40">
                                <p className="text-[9px] text-purple-400 font-mono uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <Radio className="w-3 h-3" /> معلومات البرج
                                </p>
                                {complaint.towerName && (
                                    <p className="text-xs text-slate-300 font-semibold">
                                        {complaint.towerName}
                                    </p>
                                )}
                                {complaint.towerLocation?.lat && (
                                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                                        {complaint.towerLocation.lat?.toFixed(5)},{" "}
                                        {complaint.towerLocation.lng?.toFixed(5)}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Admin note field */}
                    <div>
                        <label className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest mb-1.5 block">
                            ملاحظة للمستخدم (اختياري)
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                            placeholder="ملاحظة تظهر للمستخدم بعد التحديث..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-700/30">
                        {/* Status buttons */}
                        {complaint.status === "pending" && (
                            <>
                                <button
                                    onClick={() => handleStatusUpdate("in_progress")}
                                    disabled={updating}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-50"
                                >
                                    {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertCircle className="w-3 h-3" />}
                                    بدء المعالجة
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate("rejected")}
                                    disabled={updating}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                                >
                                    <XCircle className="w-3 h-3" /> رفض
                                </button>
                            </>
                        )}
                        {complaint.status === "in_progress" && (
                            <button
                                onClick={() => handleStatusUpdate("resolved")}
                                disabled={updating}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                            >
                                <CheckCircle2 className="w-3 h-3" /> تم الحل ✓
                            </button>
                        )}

                        {/* Mark read/unread */}
                        <button
                            onClick={handleToggleRead}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border bg-slate-700/30 border-slate-600/50 text-slate-400 hover:text-slate-200 transition-all"
                        >
                            {complaint.isReadByAdmin ? (
                                <>
                                    <EyeOff className="w-3 h-3" /> تحديد كغير مقروء
                                </>
                            ) : (
                                <>
                                    <Eye className="w-3 h-3" /> تحديد كمقروء
                                </>
                            )}
                        </button>

                        {/* Open ticket — main CTA */}
                        <button
                            onClick={() => onOpenTicket(complaint)}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95 mr-auto"
                        >
                            <Ticket className="w-3.5 h-3.5" />
                            فتح تذكرة
                            <ArrowLeftCircle className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Existing admin note display */}
                    {complaint.adminNote && complaint.adminNote !== note && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
                            <span className="font-bold">ملاحظة مسجلة: </span>
                            {complaint.adminNote}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Stats Row ──────────────────────────────────────────────────────────────
function StatsRow({ complaints }) {
    const counts = complaints.reduce(
        (acc, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            acc.unread += !c.isReadByAdmin ? 1 : 0;
            return acc;
        },
        { pending: 0, in_progress: 0, resolved: 0, rejected: 0, unread: 0 }
    );

    const items = [
        { key: "unread", label: "غير مقروءة", color: "text-indigo-400", bg: "bg-indigo-500", border: "border-indigo-500/30" },
        { key: "pending", label: "قيد الانتظار", color: "text-amber-400", bg: "bg-amber-500", border: "border-amber-500/30" },
        { key: "in_progress", label: "جارية", color: "text-blue-400", bg: "bg-blue-500", border: "border-blue-500/30" },
        { key: "resolved", label: "محلولة", color: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500/30" },
    ];

    return (
        <div className="grid grid-cols-4 gap-3">
            {items.map((it) => (
                <div
                    key={it.key}
                    className={`bg-slate-800/50 border ${it.border} rounded-xl p-3 text-center`}
                >
                    <p className={`text-2xl font-bold font-mono ${it.color}`}>
                        {counts[it.key] || 0}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">{it.label}</p>
                    <div className="h-0.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                        <div
                            className={`h-full ${it.bg} rounded-full transition-all duration-700`}
                            style={{
                                width:
                                    complaints.length
                                        ? `${((counts[it.key] || 0) / complaints.length) * 100}%`
                                        : "0%",
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function ComplaintsManager({ onOpenTicket }) {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterRead, setFilterRead] = useState("all"); // all | unread | read

    const fetchComplaints = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get("/complaints/all");
            setComplaints(res.data.complaints || []);
        } catch {
            /* handled by interceptor */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

    const handleStatusChange = useCallback((updated) => {
        setComplaints((prev) =>
            prev.map((c) => (c._id === updated._id ? updated : c))
        );
    }, []);

    const handleMarkRead = useCallback((id, newVal) => {
        setComplaints((prev) =>
            prev.map((c) => (c._id === id ? { ...c, isReadByAdmin: newVal } : c))
        );
    }, []);

    const markAllRead = async () => {
        try {
            await API.patch("/complaints/all/read");
            setComplaints((prev) => prev.map((c) => ({ ...c, isReadByAdmin: true })));
            NotifiySuccess("تم تحديد كل الشكاوى كمقروءة");
        } catch {
            /* silent */
        }
    };

    // Filtered list
    const filtered = complaints.filter((c) => {
        if (filterStatus !== "all" && c.status !== filterStatus) return false;
        if (filterRead === "unread" && c.isReadByAdmin) return false;
        if (filterRead === "read" && !c.isReadByAdmin) return false;
        return true;
    });

    const unreadCount = complaints.filter((c) => !c.isReadByAdmin).length;

    return (
        <div className="min-h-screen text-slate-100 space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30">
                        <MessageSquareWarning className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            إدارة الشكاوى
                        </h1>
                        <p className="text-xs text-slate-400 font-mono mt-1 tracking-widest">
                            USER COMPLAINTS MANAGEMENT
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs bg-slate-700/40 border border-slate-600/50 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            تحديد الكل كمقروء ({unreadCount})
                        </button>
                    )}
                    <button
                        onClick={fetchComplaints}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs bg-slate-700/40 border border-slate-600/50 text-slate-300 hover:text-white transition-all"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        تحديث
                    </button>
                </div>
            </div>

            {/* Stats */}
            <StatsRow complaints={complaints} />

            {/* Filters */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest flex items-center gap-1">
                        <Filter className="w-3 h-3" /> تصفية:
                    </span>

                    {/* Status Filter */}
                    <div className="flex gap-1.5 flex-wrap">
                        {[
                            { v: "all", l: "الكل" },
                            { v: "pending", l: "انتظار" },
                            { v: "in_progress", l: "جارية" },
                            { v: "resolved", l: "محلولة" },
                            { v: "rejected", l: "مرفوضة" },
                        ].map((f) => (
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

                    {/* Read/Unread Filter */}
                    <div className="flex gap-1.5">
                        {[
                            { v: "all", l: "الكل" },
                            { v: "unread", l: "غير مقروءة" },
                            { v: "read", l: "مقروءة" },
                        ].map((f) => (
                            <button
                                key={f.v}
                                onClick={() => setFilterRead(f.v)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border ${filterRead === f.v
                                        ? "bg-purple-500/20 border-purple-500/40 text-purple-400"
                                        : "bg-slate-700/30 border-slate-700/30 text-slate-500 hover:text-slate-300"
                                    }`}
                            >
                                {f.l}
                            </button>
                        ))}
                    </div>

                    <span className="mr-auto text-[10px] text-slate-500 font-mono">
                        {filtered.length} شكوى
                    </span>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {loading && complaints.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin opacity-40" />
                        <p className="font-mono text-sm">جاري تحميل الشكاوى...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20">
                        <FileText className="w-10 h-10 opacity-20" />
                        <p className="text-slate-500 font-mono text-sm">
                            لا توجد شكاوى مطابقة للفلترة
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((c) => (
                            <ComplaintCard
                                key={c._id}
                                complaint={c}
                                onStatusChange={handleStatusChange}
                                onOpenTicket={onOpenTicket}
                                onMarkRead={handleMarkRead}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
