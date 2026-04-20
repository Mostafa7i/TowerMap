"use client";
import { Key, Mail, Loader2, AlertCircle, CheckCircle2, LogIn } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { NotifiySuccess } from "../components/Notify";
import { motion, AnimatePresence } from "framer-motion";
import API from "../services/api";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import SplashScreen from "../components/SplashScreen";

// خريطة رسائل الخطأ من الـ Backend لرسائل عربية واضحة
const ERROR_MAP = {
  "Invalid email or password": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  "User not found": "لا يوجد حساب بهذا البريد الإلكتروني",
  "Account is not verified": "حسابك قيد المراجعة، يرجى انتظار موافقة الإدارة",
  "Account has been rejected": "تم رفض حسابك من قِبل الإدارة",
  "Too many requests": "محاولات كثيرة جداً، يرجى الانتظار قليلاً",
  "Network Error": "لا يوجد اتصال بالإنترنت، تحقق من شبكتك",
};

function mapError(raw) {
  if (!raw) return "حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى";
  for (const [key, val] of Object.entries(ERROR_MAP)) {
    if (raw.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return raw;
}

// ─── مؤشر قوة كلمة المرور بسيط داخل الزر (Progress Line) ─────────────
const STEPS = [
  { key: "connecting", label: "جاري الاتصال...", pct: 20 },
  { key: "auth",       label: "جاري التحقق...", pct: 55 },
  { key: "loading",    label: "تجهيز بياناتك...", pct: 80 },
  { key: "done",       label: "تم بنجاح! ✓",    pct: 100 },
];

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  const router = useRouter();
  const { setUser, getMe, setLoggedIn } = useAuth();
  const redirectingRef = useRef(false); // ref لأن finally بيشتغل مع الـ closure القديم

  // تقدم الزر خطوة خطوة
  useEffect(() => {
    if (!isLoading) return;
    setStepIdx(0);
    setProgress(STEPS[0].pct);
  }, [isLoading]);

  const advanceStep = (idx) => {
    if (idx >= STEPS.length) return;
    setStepIdx(idx);
    setProgress(STEPS[idx].pct);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (serverError) setServerError("");
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: "" }));
  };

  // تحقق من الحقول
  const validate = () => {
    const errs = { email: "", password: "" };
    if (!formData.email.trim()) {
      errs.email = "البريد الإلكتروني مطلوب";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "صيغة البريد الإلكتروني غير صحيحة";
    }
    if (!formData.password) {
      errs.password = "كلمة المرور مطلوبة";
    }
    setFieldErrors(errs);
    return !errs.email && !errs.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setIsLoading(true);
    advanceStep(0); // connecting…

    try {
      // محاكاة الـ connecting step قبل الطلب الفعلي
      await new Promise((r) => setTimeout(r, 400));
      advanceStep(1); // auth…

      const res = await API.post("/auth/login", formData);

      advanceStep(2); // loading…
      setUser(res.data.user);
      await getMe();
      setLoggedIn(true);

      advanceStep(3); // done ✓
      NotifiySuccess(res.data.message || "تم تسجيل الدخول بنجاح!");

      // تفعيل SplashScreen فوراً ثم الانتقال — بدون تأخير إضافي
      redirectingRef.current = true;
      setIsRedirecting(true);
      router.replace("/dashboard");
    } catch (err) {
      const raw =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "";
      setServerError(mapError(raw));

      // بحث أيضاً في details الصفيف لو موجود
      const details = err.response?.data?.details;
      if (Array.isArray(details) && details.length) {
        setServerError(mapError(details[0]));
      }
    } finally {
      // لو بنحوّل للداشبورد، لا تُلغِ حالة التحميل (SplashScreen تفضل ظاهرة)
      if (!redirectingRef.current) {
        setIsLoading(false);
        setStepIdx(0);
        setProgress(0);
      }
    }
  };

  if (isRedirecting)
    return (
      <SplashScreen
        message="جاري تجهيز لوحة التحكم..."
        sub="LOADING DASHBOARD"
      />
    );

  const currentStep = STEPS[stepIdx];

  return (
    <div className="relative flex min-h-screen items-center justify-center px-3 py-7 overflow-hidden bg-[#060913]">
      {/* Background Graphic */}
      <div
        className="absolute inset-0 mix-blend-screen pointer-events-none"
        style={{
          backgroundImage: "url('/pic/auth_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.25,
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060913]/30 via-[#060913]/60 to-slate-950 pointer-events-none" />

      {/* Glowing Blobs */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-600/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-[500px] h-[500px] bg-indigo-600/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-md overflow-hidden rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl border border-white/10 relative z-10 bg-slate-900/40"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600/20 to-cyan-600/20 border-b border-white/5 p-4 md:p-6 text-center flex flex-col items-center gap-3">
          <div className="flex justify-center scale-110 mt-1">
            <Logo animated={true} iconSize={44} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">مرحباً بعودتك</h1>
            <p className="text-slate-400 text-sm mt-0.5">سجّل دخولك للمتابعة</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-white" dir="rtl" noValidate>

          {/* ── رسالة خطأ Server ── */}
          <AnimatePresence mode="wait">
            {serverError && (
              <motion.div
                key="server-err"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-3 rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm font-medium leading-snug">{serverError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* حقل الإيميل */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-200">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                name="email"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="email"
                className={`w-full rounded-xl border px-4 py-3 pr-11 text-right outline-none transition-all duration-200
                  bg-slate-800/60 text-white placeholder-slate-500
                  ${fieldErrors.email
                    ? "border-red-500/60 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                    : "border-slate-700/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  } disabled:opacity-50`}
              />
              <Mail className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <AnimatePresence>
              {fieldErrors.email && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-red-400 flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* حقل كلمة المرور */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-slate-200">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="current-password"
                className={`w-full rounded-xl border px-4 py-3 pr-11 text-right outline-none transition-all duration-200
                  bg-slate-800/60 text-white placeholder-slate-500
                  ${fieldErrors.password
                    ? "border-red-500/60 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                    : "border-slate-700/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  } disabled:opacity-50`}
              />
              <Key className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <AnimatePresence>
              {fieldErrors.password && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-red-400 flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.password}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* ── زر تسجيل الدخول الاحترافي ── */}
          <div className="pt-1">
            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={isLoading ? {} : { scale: 0.97 }}
              className="relative w-full overflow-hidden rounded-2xl px-6 py-3.5 text-base font-bold text-white
                bg-gradient-to-r from-indigo-600 to-purple-600
                hover:from-indigo-500 hover:to-purple-500
                focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-2 focus:ring-offset-slate-900
                transition-all duration-200
                disabled:cursor-not-allowed disabled:opacity-80
                shadow-lg shadow-indigo-500/25"
            >
              {/* شريط التقدم داخل الزر */}
              <AnimatePresence>
                {isLoading && (
                  <motion.span
                    key="progress-bar"
                    className="absolute bottom-0 left-0 h-0.5 bg-white/50 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                )}
              </AnimatePresence>

              {/* المحتوى */}
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{currentStep?.label ?? "جاري..."}</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>تسجيل الدخول</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* رابط التسجيل */}
          <p className="text-center text-slate-400 text-sm pt-1">
            ليس لديك حساب؟{" "}
            <Link
              href="/Register"
              className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
            >
              إنشاء حساب جديد
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
