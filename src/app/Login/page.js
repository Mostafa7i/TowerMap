"use client";
import { Key, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import {
  NotifiyErorr,
  NotifiyInfo,
  NotifiySuccess,
} from "../components/Notify"; // تأكد إن الاسم صحيح (NotifyInfo غالباً)
import { motion } from "framer-motion";
import API from "../services/api";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState("");
  const { setUser, getMe, setLoggedIn } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // إزالة الخطأ لما المستخدم يبدأ يكتب
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // تصفير الرسائل القديمة
    setError("");

    // التحقق من الحقول
    if (!formData.email.trim()) {
      setError("الإيميل مطلوب");
      NotifiyInfo("الإيميل مطلوب");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError("الرجاء إدخال بريد إلكتروني صحيح");
      return;
    }
    if (!formData.password.trim()) {
      setError("كلمة المرور مطلوبة");
      NotifiyInfo("كلمة المرور مطلوبة");
      return;
    }
    setIsLoading(true);
    try {
      const res = await API.post("/auth/login", formData);
      setUser(res.data.user);
      await getMe();
      setLoggedIn(true);
      NotifiySuccess(res.data.message);
      setIsRedirecting(true);

      console.log("تسجيل دخول:", formData);

      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
    } catch (error) {
      console.error(error);
      const details = error.response?.data?.details;
      if (Array.isArray(details)) {
        details.forEach((err) => NotifiyErorr(err));
        console.log(error.response?.data?.message);
      }
      setError("حدث خطأ أثناء تسجيل الدخول");
      NotifiyInfo("حدث خطأ، حاول مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex bgTower2 min-h-screen items-center justify-center px-3 py-7">
      <motion.div
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full max-w-md overflow-hidden rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]   backdrop-blur-2xl border border-white/40"
      >
        {/* الهيدر */}
        <div className="bg-linear-to-r bgTower from-green-600/30 to-indigo-600/60 p-3 md:p-5 text-center">
          <motion.div
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-lime-500/50 to-indigo-500 text-xl font-bold text-white animate-pulse"
          >
            Tower
          </motion.div>
          <motion.h2
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 1 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-xl font-bold text-white"
          >
            سجل دخولك الآن
          </motion.h2>
        </div>

        {/* الفورم */}
        <form
          onSubmit={handleSubmit}
          className="p-7 space-y-5 text-white"
          dir="rtl"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg  bg-red-50 p-4 text-center text-red-700 border border-red-200"
            >
              {error}
            </motion.div>
          )}

          {/* حقل الإيميل */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <label
              htmlFor="email"
              className="mb-1 block text-lg font-medium text-white"
            >
              الإيميل
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                name="email"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11 text-right outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
                disabled={isLoading}
                autoComplete="email"
              />
              <Mail className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            </div>
          </motion.div>

          {/* حقل كلمة المرور */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <label
              htmlFor="password"
              className="mb-1 block text-lg font-medium text-white"
            >
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
                className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11 text-right outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <Key className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            </div>
          </motion.div>

          {/* زر الإرسال */}
          <motion.button
           whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            type="submit"
            disabled={isLoading}
            className={`
              cursor-pointer
              w-full rounded-2xl px-6 py-3.5 text-xl font-bold text-white 
              bg-linear-to-r from-green-500 to-indigo-600 
              hover:from-green-600 hover:to-indigo-700 
              focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
              transition-all duration-200
              disabled:opacity-60 disabled:cursor-not-allowed
              shadow-lg hover:shadow-xl active:scale-[0.98]
            `}
          >
            {isLoading ? "جاري التحميل..." : "تسجيل الدخول"}
          </motion.button>

          {/* رابط التسجيل */}
          <p className="text-center text-gray-600">
            ليس لديك حساب؟{" "}
            <Link
              href="/Register"
              className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              إنشاء حساب جديد
            </Link>
          </p>
        </form>
      </motion.div>
      
      {/* ── Redirecting Loader Overlay ── */}
      {isRedirecting && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-900/95 text-white backdrop-blur-md">
          <Loader2 className="h-16 w-16 animate-spin text-indigo-500 mb-6" />
          <h2 className="text-2xl font-bold bg-linear-to-r from-green-400 to-indigo-400 bg-clip-text text-transparent">
            جاري تجهيز لوحة التحكم...
          </h2>
          <p className="text-slate-400 mt-2 font-mono text-sm">LOADING DASHBOARD</p>
        </div>
      )}
    </div>
  );
}
