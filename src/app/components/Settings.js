"use client";
import React, { useState } from "react";
import {
  User,
  Lock,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Mail,
  Building2,
  KeyRound,
  BellRing,
  BellOff,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import API from "@/app/services/api";

// ─── Reusable ─────────────────────────────────────────────────────────────────
function SectionCard({ icon: Icon, title, subtitle, children, color = "indigo" }) {
  const colors = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  };
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colors[color]}`}>
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InputField({ label, id, type = "text", value, onChange, placeholder, icon: Icon, disabled }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <input
          id={id}
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-slate-900/70 border border-slate-700/60 rounded-xl py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${Icon ? "pr-10" : "px-4"} ${isPassword ? "pl-10" : "pl-4"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBanner({ type, message, onClose }) {
  if (!message) return null;
  const isSuccess = type === "success";
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm mb-6 ${isSuccess ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
      {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      <span className="flex-1">{message}</span>
    </div>
  );
}

function ToggleSwitch({ enabled, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-700/30 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 ${enabled ? "bg-indigo-600" : "bg-slate-700"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${enabled ? "right-0.5" : "left-0.5"}`} />
      </button>
    </div>
  );
}

// ─── Main Settings ─────────────────────────────────────────────────────────────
export default function Settings() {
  const { user, setUser } = useAuth();

  // Profile form
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    section: user?.section || "",
  });
  const [profileStatus, setProfileStatus] = useState({ type: "", message: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStatus, setPasswordStatus] = useState({ type: "", message: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    criticalAlerts: true,
    weeklyReport: false,
    maintenanceAlerts: true,
  });

  const handleProfileSave = async () => {
    if (!profileData.fullName.trim()) {
      setProfileStatus({ type: "error", message: "الاسم الكامل مطلوب" });
      return;
    }
    setSavingProfile(true);
    try {
      const res = await API.patch("/auth/updateMe", {
        fullName: profileData.fullName,
        section: profileData.section,
      });
      if (res.data?.user) setUser(res.data.user);
      setProfileStatus({ type: "success", message: "تم تحديث بيانات الملف الشخصي بنجاح ✓" });
    } catch {
      setProfileStatus({ type: "error", message: "فشل تحديث البيانات، حاول مرة أخرى" });
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileStatus({ type: "", message: "" }), 4000);
    }
  };

  const handlePasswordSave = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setPasswordStatus({ type: "error", message: "يرجى ملء جميع الحقول" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordStatus({ type: "error", message: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus({ type: "error", message: "كلمة المرور الجديدة وتأكيدها غير متطابقتين" });
      return;
    }
    setSavingPassword(true);
    try {
      await API.patch("/auth/changePassword", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordStatus({ type: "success", message: "تم تغيير كلمة المرور بنجاح ✓" });
    } catch {
      setPasswordStatus({ type: "error", message: "كلمة المرور الحالية غير صحيحة" });
    } finally {
      setSavingPassword(false);
      setTimeout(() => setPasswordStatus({ type: "", message: "" }), 4000);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 p-4 md:p-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">الإعدادات</h1>
        <p className="text-sm text-slate-500 font-mono mt-1.5">ACCOUNT SETTINGS & PREFERENCES</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Profile ── */}
        <SectionCard icon={User} title="الملف الشخصي" subtitle="تعديل بيانات حسابك" color="indigo">
          <StatusBanner {...profileStatus} />
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="الاسم الكامل"
                id="fullName"
                icon={User}
                value={profileData.fullName}
                onChange={(e) => setProfileData((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="أدخل اسمك الكامل"
              />
              <InputField
                label="البريد الإلكتروني"
                id="email"
                type="email"
                icon={Mail}
                value={profileData.email}
                disabled
                placeholder="البريد الإلكتروني"
              />
            </div>
            <InputField
              label="القسم / التخصص"
              id="section"
              icon={Building2}
              value={profileData.section}
              onChange={(e) => setProfileData((p) => ({ ...p, section: e.target.value }))}
              placeholder="مثال: شبكات، صيانة، IT"
            />

            {/* Role badge */}
            <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-700/40 rounded-xl px-4 py-3">
              <Shield size={16} className="text-indigo-400" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">الصلاحية</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user?.role === "admin" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-slate-700 text-slate-300"}`}>
                  {user?.role === "admin" ? "🔑 مدير النظام" : "👤 مستخدم"}
                </span>
              </div>
            </div>

            <button
              onClick={handleProfileSave}
              disabled={savingProfile}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
            >
              {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {savingProfile ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        </SectionCard>

        {/* ── Password ── */}
        <SectionCard icon={Lock} title="تغيير كلمة المرور" subtitle="تأكد من استخدام كلمة مرور قوية" color="rose">
          <StatusBanner {...passwordStatus} />
          <div className="space-y-4">
            <InputField
              label="كلمة المرور الحالية"
              id="currentPassword"
              type="password"
              icon={KeyRound}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))}
              placeholder="••••••••"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="كلمة المرور الجديدة"
                id="newPassword"
                type="password"
                icon={KeyRound}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="6 أحرف على الأقل"
              />
              <InputField
                label="تأكيد كلمة المرور"
                id="confirmPassword"
                type="password"
                icon={KeyRound}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="أعد كتابة كلمة المرور"
              />
            </div>

            {/* Password strength indicator */}
            {passwordData.newPassword && (
              <div>
                <p className="text-[10px] text-slate-500 mb-1.5 font-mono uppercase">قوة كلمة المرور</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => {
                    const strength = passwordData.newPassword.length >= 12 ? 4 : passwordData.newPassword.length >= 8 ? 3 : passwordData.newPassword.length >= 6 ? 2 : 1;
                    return (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? (strength === 4 ? "bg-emerald-500" : strength === 3 ? "bg-yellow-500" : strength === 2 ? "bg-orange-500" : "bg-red-500") : "bg-slate-700"}`} />
                    );
                  })}
                </div>
                <p className="text-[10px] mt-1 text-slate-600">
                  {passwordData.newPassword.length >= 12 ? "ممتازة" : passwordData.newPassword.length >= 8 ? "جيدة" : passwordData.newPassword.length >= 6 ? "متوسطة" : "ضعيفة"}
                </p>
              </div>
            )}

            <button
              onClick={handlePasswordSave}
              disabled={savingPassword}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
            >
              {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              {savingPassword ? "جاري الحفظ..." : "تغيير كلمة المرور"}
            </button>
          </div>
        </SectionCard>

        {/* ── Notifications ── */}
        <SectionCard icon={Bell} title="إعدادات الإشعارات" subtitle="تحكم في التنبيهات التي تستقبلها" color="emerald">
          <div>
            <ToggleSwitch
              enabled={notifications.criticalAlerts}
              onChange={(v) => setNotifications((p) => ({ ...p, criticalAlerts: v }))}
              label="تنبيهات الأعطال الحرجة"
              description="إشعار فوري عند اكتشاف برج في حالة خطر"
            />
            <ToggleSwitch
              enabled={notifications.emailAlerts}
              onChange={(v) => setNotifications((p) => ({ ...p, emailAlerts: v }))}
              label="إشعارات البريد الإلكتروني"
              description="استقبال التقارير والتنبيهات عبر البريد"
            />
            <ToggleSwitch
              enabled={notifications.maintenanceAlerts}
              onChange={(v) => setNotifications((p) => ({ ...p, maintenanceAlerts: v }))}
              label="تنبيهات الصيانة"
              description="إشعارات مواعيد الصيانة الدورية"
            />
            <ToggleSwitch
              enabled={notifications.weeklyReport}
              onChange={(v) => setNotifications((p) => ({ ...p, weeklyReport: v }))}
              label="التقرير الأسبوعي"
              description="ملخص أسبوعي لأداء جميع الأبراج"
            />
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-900/50 border border-slate-700/40 rounded-xl px-4 py-3">
            {notifications.criticalAlerts ? (
              <BellRing size={14} className="text-emerald-400 shrink-0" />
            ) : (
              <BellOff size={14} className="text-slate-600 shrink-0" />
            )}
            <span>
              {notifications.criticalAlerts
                ? "الإشعارات الحرجة مفعّلة — ستستقبل تنبيهاً فورياً عند وجود خطر"
                : "الإشعارات الحرجة معطّلة — لن تستقبل تنبيهات الأعطال"}
            </span>
          </div>
        </SectionCard>

        {/* ── System Info ── */}
        <SectionCard icon={Shield} title="معلومات النظام" subtitle="بيانات الجلسة الحالية" color="sky">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "اسم المستخدم", value: user?.fullName || "—" },
              { label: "البريد الإلكتروني", value: user?.email || "—" },
              { label: "القسم", value: user?.section || "—" },
              { label: "الصلاحية", value: user?.role || "—" },
              { label: "حالة الجلسة", value: "نشطة ✓" },
              { label: "بروتوكول الأمان", value: "JWT + HTTPS" },
            ].map((item, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-700/40 rounded-xl px-4 py-3">
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-xs font-semibold text-slate-300 truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </SectionCard>

      </div>
    </div>
  );
}
