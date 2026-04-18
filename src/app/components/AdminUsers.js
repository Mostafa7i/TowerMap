"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ShieldCheck,
  ShieldX,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  MessageSquare,
  Search,
  Filter,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Building2,
  CalendarDays,
  Trash2,
} from "lucide-react";
import API from "@/app/services/api";
import { NotifiySuccess, NotifiyErorr } from "@/app/components/Notify";

const SECTION_COLORS = {
  "مهندس سوفت وير": "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "مهندس شبكات": "text-purple-400 bg-purple-500/10 border-purple-500/20",
  "مستخدم عادي": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

function UserCard({ u, onVerify, onDelete, loading }) {
  const sectionClass =
    SECTION_COLORS[u.section] || "text-slate-400 bg-slate-500/10 border-slate-500/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {u.fullName?.[0] || "م"}
          </div>
          <div>
            <p className="text-white font-bold text-sm">{u.fullName}</p>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border inline-block mt-1 ${sectionClass}`}
            >
              {u.section}
            </span>
          </div>
        </div>

        {/* Status Badge & Delete */}
        <div className="shrink-0 flex items-center gap-2">
          {u.section === "مستخدم عادي" ? (
            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              مفعّل
            </span>
          ) : u.verificationStatus === "approved" ? (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              معتمد
            </span>
          ) : u.verificationStatus === "rejected" ? (
            <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full font-semibold">
              <XCircle className="w-3.5 h-3.5" />
              مرفوض
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full font-semibold">
              <Clock className="w-3.5 h-3.5" />
              قيد الانتظار
            </span>
          )}

          <button
            onClick={() => onDelete(u._id)}
            disabled={loading === u._id}
            className="p-1.5 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="حذف المستخدم"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <Mail className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{u.email}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <span>{u.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
          <span>
            انضمام: {new Date(u.createdAt).toLocaleDateString("ar-EG", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        {u.lastActive && (
          <div className="flex items-center gap-2 text-slate-400 text-xs" title="آخر ظهور / نشاط">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="text-indigo-400/80">
              نشط: {new Date(u.lastActive).toLocaleString("ar-EG", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </div>
        )}
      </div>

      {/* Actions - لا تظهر لـ مستخدم عادي */}
      {u.section !== "مستخدم عادي" && (
        u.verificationStatus === "approved" ? (
          <button
            onClick={() => onVerify(u._id, "revoke")}
            disabled={loading === u._id}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <ShieldX className="w-3.5 h-3.5" />
            سحب الاعتماد
          </button>
        ) : u.verificationStatus === "rejected" ? (
          <div className="flex gap-2">
            <button
              onClick={() => onVerify(u._id, "approve")}
              disabled={loading === u._id}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 text-green-400 text-sm font-semibold transition-all disabled:opacity-50"
            >
              {loading === u._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              قبول
            </button>
            <button
              onClick={() => onVerify(u._id, "revoke")}
              disabled={loading === u._id}
              className="px-4 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-400 text-sm font-semibold transition-all disabled:opacity-50"
            >
              إعادة انتظار
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => onVerify(u._id, "approve")}
              disabled={loading === u._id}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 text-green-400 text-sm font-semibold transition-all disabled:opacity-50"
            >
              {loading === u._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              موافقة
            </button>
            <button
              onClick={() => onVerify(u._id, "reject")}
              disabled={loading === u._id}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 text-sm font-semibold transition-all disabled:opacity-50"
            >
              <UserX className="w-4 h-4" />
              رفض
            </button>
          </div>
        )
      )}
    </motion.div>
  );
}

export default function AdminUsers() {
  const [tab, setTab] = useState("pending"); // "pending" | "all" | "complaints"
  const [complaintFilter, setComplaintFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [allcomplaints, setAllComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState("");

  const unreadCount = allcomplaints.filter((c) => !c.isReadByAdmin).length;

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await API.get("/auth/admin/pending");
      setUsers(res.data.users || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await API.get("/auth/admin/users");
      setUsers(res.data.users || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await API.get("/complaints/all");
      setAllComplaints(res.data.complaints || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // نجلب الشكاوى في الخلفية دائمًا لمعرفة عدد الغير مقروء،
    // حتى لو التاب مش مفتوح
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (tab === "pending") fetchPending();
    else if (tab === "all") fetchAll();
    else if (tab === "complaints") {
      fetchComplaints();
      if (unreadCount > 0) {
        API.patch('/complaints/all/read')
          .then(() => {
            setAllComplaints(prev => prev.map(c => ({...c, isReadByAdmin: true})));
          })
          .catch(console.error);
      }
    }
  }, [tab, unreadCount]);

  const handleDeleteUser = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المستخدم نهائياً؟")) return;
    setActionLoading(id);
    try {
      await API.delete(`/auth/admin/users/${id}`);
      NotifiySuccess("تم حذف المستخدم بنجاح");
      if (tab === "pending") fetchPending();
      else fetchAll();
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async (id, action) => {
    setActionLoading(id);
    try {
      await API.patch(`/auth/admin/verify/${id}`, { action });
      const msgs = { approve: "تم قبول المستخدم بنجاح ✓", reject: "تم رفض المستخدم", revoke: "تم سحب الاعتماد" };
      NotifiySuccess(msgs[action] || "تم التحديث");
      if (tab === "pending") fetchPending();
      else fetchAll();
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplaintStatus = async (id, status) => {
    try {
      await API.patch(`/complaints/${id}/status`, { status });
      NotifiySuccess("تم تحديث حالة الشكوى");
      fetchComplaints();
    } catch {}
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.section?.includes(search)
  );

  const filteredComplaints = allcomplaints.filter((c) => {
    if (complaintFilter === "all") return true;
    return c.status === complaintFilter;
  });

  const STATUS_LABEL = {
    pending: "قيد الانتظار",
    in_progress: "جارٍ المعالجة",
    resolved: "تم الحل",
    rejected: "مرفوضة",
  };
  const STATUS_COLOR = {
    pending: "text-amber-400",
    in_progress: "text-blue-400",
    resolved: "text-green-400",
    rejected: "text-red-400",
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-400" />
            إدارة المستخدمين
          </h2>
          <p className="text-slate-400 text-sm mt-1">قبول أو رفض طلبات الانضمام ومراجعة الشكاوى</p>
        </div>
        <button
          onClick={() => {
            if (tab === "pending") fetchPending();
            else if (tab === "all") fetchAll();
            else fetchComplaints();
          }}
          disabled={loading}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 text-sm transition-colors border border-slate-700 hover:border-indigo-500/50 px-3 py-2 rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50">
        {[
          { id: "pending", label: "طلبات الانتظار", icon: Clock },
          { id: "all", label: "كل المستخدمين", icon: Users },
          { id: "complaints", label: "الشكاوى", icon: MessageSquare, badge: unreadCount },
        ].map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex relative items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {badge > 0 && (
              <span className="absolute top-1 left-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters & Search */}
      {tab !== "complaints" ? (
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو الإيميل أو التخصص..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: "all", label: "الكل" },
            { id: "pending", label: "قيد الانتظار" },
            { id: "in_progress", label: "جارٍ المعالجة" },
            { id: "resolved", label: "تم الحل" },
            { id: "rejected", label: "مرفوضة" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setComplaintFilter(f.id)}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors border ${
                complaintFilter === f.id
                  ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                  : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* طلبات الانتظار */}
        {tab === "pending" && (
          <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin ml-3" />جاري التحميل...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-20">
                <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-green-500/30" />
                <p className="text-slate-500 text-lg font-medium">لا توجد طلبات معلقة</p>
                <p className="text-slate-600 text-sm mt-1">جميع الحسابات تمت مراجعتها</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map((u) => (
                  <UserCard key={u._id} u={u} onVerify={handleVerify} onDelete={handleDeleteUser} loading={actionLoading} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* كل المستخدمين */}
        {tab === "all" && (
          <motion.div key="all" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin ml-3" />جاري التحميل...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map((u) => (
                  <UserCard key={u._id} u={u} onVerify={handleVerify} onDelete={handleDeleteUser} loading={actionLoading} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* الشكاوى */}
        {tab === "complaints" && (
          <motion.div key="complaints" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin ml-3" />جاري التحميل...
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="text-center py-20">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-600/30" />
                <p className="text-slate-500 text-lg font-medium">لا توجد شكاوى مطابقة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredComplaints.map((c) => (
                  <motion.div
                    key={c._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`bg-slate-800/50 border rounded-2xl p-5 ${
                      !c.isReadByAdmin ? "border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.1)]" : "border-slate-700/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold text-sm">{c.title}</p>
                          {!c.isReadByAdmin && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">
                          بواسطة: {c.userName} •{" "}
                          {new Date(c.createdAt).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                      <span className={`text-xs font-bold ${STATUS_COLOR[c.status]} bg-slate-700/50 px-2 py-1 rounded-lg`}>
                        {STATUS_LABEL[c.status]}
                      </span>
                    </div>

                    <p className="text-slate-400 text-xs mb-3 leading-relaxed">{c.description}</p>

                    {c.towerName && (
                      <p className="text-xs text-purple-400 mb-3">
                        🗼 البرج: {c.towerName}
                      </p>
                    )}

                    {/* أزرار تغيير الحالة */}
                    <div className="flex flex-wrap gap-2">
                      {["pending", "in_progress", "resolved", "rejected"].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleComplaintStatus(c._id, s)}
                          disabled={c.status === s}
                          className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                            c.status === s
                              ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300 cursor-default"
                              : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                          }`}
                        >
                          {STATUS_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
