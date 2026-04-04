"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquarePlus,
  MapPin,
  Radio,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  RefreshCw,
  FileText,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import API from "@/app/services/api";
import { NotifiySuccess, NotifiyErorr } from "@/app/components/Notify";

const PROBLEM_TYPES = [
  "انقطاع الإشارة",
  "ضعف الإشارة",
  "تداخل في الشبكة",
  "مشكلة اتصال",
  "أخرى",
];

const STATUS_MAP = {
  pending: {
    label: "قيد الانتظار",
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  in_progress: {
    label: "جارٍ المعالجة",
    icon: AlertCircle,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  resolved: {
    label: "تم الحل",
    icon: CheckCircle2,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
  rejected: {
    label: "مرفوضة",
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
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

// مكون الخريطة المدمج (بدون مكتبة ثقيلة - استخدام Leaflet أو Mapbox يُفضّل لاحقاً)
function LocationPicker({ value, onChange, label }) {
  const [loading, setLoading] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      NotifiyErorr("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        });
        setLoading(false);
      },
      () => {
        NotifiyErorr("تعذّر تحديد الموقع، يرجى إدخاله يدوياً");
        setLoading(false);
      }
    );
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-300">{label}</label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">خط العرض (Lat)</label>
          <input
            type="number"
            step="any"
            placeholder="مثال: 30.0444"
            value={value?.lat ?? ""}
            onChange={(e) => onChange({ ...value, lat: parseFloat(e.target.value) || "" })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">خط الطول (Lng)</label>
          <input
            type="number"
            step="any"
            placeholder="مثال: 31.2357"
            value={value?.lng ?? ""}
            onChange={(e) => onChange({ ...value, lng: parseFloat(e.target.value) || "" })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">العنوان (اختياري)</label>
        <input
          type="text"
          placeholder="مثال: شارع التحرير، القاهرة"
          value={value?.address ?? ""}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
        />
      </div>
      <button
        type="button"
        onClick={detectLocation}
        disabled={loading}
        className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <MapPin className="w-3.5 h-3.5" />
        )}
        {loading ? "جاري التحديد..." : "تحديد موقعي تلقائياً"}
      </button>
    </div>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("new"); // "new" | "my"
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    problemType: "",
    userLocation: { lat: "", lng: "", address: "" },
    towerName: "",
    towerLocation: { lat: "", lng: "", address: "" },
  });

  const fetchMyComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const res = await API.get("/complaints/my");
      setComplaints(res.data.complaints || []);
    } catch {
      // silent
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    if (activeTab === "my") fetchMyComplaints();
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.problemType) {
      NotifiyErorr("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/complaints", form);
      NotifiySuccess("تم رفع الشكوى بنجاح! ستتم مراجعتها من قِبل الإدارة.");
      setForm({
        title: "",
        description: "",
        problemType: "",
        userLocation: { lat: "", lng: "", address: "" },
        towerName: "",
        towerLocation: { lat: "", lng: "", address: "" },
      });
      setActiveTab("my");
    } catch {
      // error handled by API interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" dir="rtl">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Radio className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">مركز الشكاوى</h1>
            <p className="text-xs text-slate-500">أبراج الاتصالات</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-200 leading-none">{user?.fullName}</p>
            <p className="text-xs text-indigo-400 mt-0.5">مستخدم عادي</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.fullName?.[0] || "م"}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50">
          {[
            { id: "new", label: "رفع شكوى جديدة", icon: MessageSquarePlus },
            { id: "my", label: "شكاواي", icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* --- نموذج شكوى جديدة --- */}
          {activeTab === "new" && (
            <motion.div
              key="new"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* معلومات الشكوى */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-5">
                  <h2 className="text-white font-bold text-base flex items-center gap-2">
                    <MessageSquarePlus className="w-5 h-5 text-indigo-400" />
                    تفاصيل الشكوى
                  </h2>

                  {/* عنوان الشكوى */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      عنوان الشكوى <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="مثال: انقطاع الإشارة في منطقة..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>

                  {/* نوع المشكلة */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      نوع المشكلة <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={form.problemType}
                        onChange={(e) => setForm({ ...form, problemType: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                      >
                        <option value="">اختر نوع المشكلة</option>
                        {PROBLEM_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* وصف المشكلة */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      وصف المشكلة <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={4}
                      placeholder="اشرح المشكلة بالتفصيل..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* موقع المستخدم */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                  <h2 className="text-white font-bold text-base flex items-center gap-2 mb-5">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    موقعك الحالي
                  </h2>
                  <LocationPicker
                    label="إحداثيات موقعك"
                    value={form.userLocation}
                    onChange={(v) => setForm({ ...form, userLocation: v })}
                  />
                </div>

                {/* معلومات البرج */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-5">
                  <h2 className="text-white font-bold text-base flex items-center gap-2">
                    <Radio className="w-5 h-5 text-purple-400" />
                    معلومات البرج
                  </h2>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      اسم البرج
                    </label>
                    <input
                      type="text"
                      value={form.towerName}
                      onChange={(e) => setForm({ ...form, towerName: e.target.value })}
                      placeholder="مثال: برج الزقازيق الرئيسي"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>

                  <LocationPicker
                    label="موقع البرج"
                    value={form.towerLocation}
                    onChange={(v) => setForm({ ...form, towerLocation: v })}
                  />
                </div>

                {/* زر الإرسال */}
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      رفع الشكوى للإدارة
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* --- قائمة شكاواي --- */}
          {activeTab === "my" && (
            <motion.div
              key="my"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-bold">
                  شكاواي ({complaints.length})
                </h2>
                <button
                  onClick={fetchMyComplaints}
                  disabled={loadingComplaints}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 text-sm transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingComplaints ? "animate-spin" : ""}`} />
                  تحديث
                </button>
              </div>

              {loadingComplaints ? (
                <div className="flex items-center justify-center py-20 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin ml-3" />
                  جاري التحميل...
                </div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-20 text-slate-600">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium text-slate-500">لا توجد شكاوى مسجلة</p>
                  <p className="text-sm mt-1">أضف أول شكوى من التبويب السابق</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.map((c) => (
                    <motion.div
                      key={c._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/70 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-white font-bold text-sm leading-snug flex-1">
                          {c.title}
                        </h3>
                        <StatusBadge status={c.status} />
                      </div>

                      <p className="text-slate-400 text-xs leading-relaxed mb-3">
                        {c.description}
                      </p>

                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        {c.problemType && (
                          <span className="bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg border border-indigo-500/20">
                            {c.problemType}
                          </span>
                        )}
                        {c.towerName && (
                          <span className="flex items-center gap-1">
                            <Radio className="w-3 h-3" />
                            {c.towerName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(c.createdAt).toLocaleDateString("ar-EG", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      {c.adminNote && (
                        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
                          <span className="font-bold">ملاحظة الإدارة: </span>
                          {c.adminNote}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
