"use client";
import { motion } from "framer-motion";
import { Radio } from "lucide-react";

/**
 * SplashScreen — شاشة تحميل موحّدة
 * Props:
 *   message  {string}  — النص الكبير (اختياري)
 *   sub      {string}  — النص الصغير بالإنجليزية (اختياري)
 *   progress {number}  — نسبة (0-100) لعرض شريط تقدم (اختياري)
 */
export default function SplashScreen({
  message = "جاري تجهيز لوحة التحكم...",
  sub = "LOADING DASHBOARD",
  progress = null,
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#060913] text-white overflow-hidden"
    >
      {/* --- خلفية Blob متحركة --- */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-violet-600/20 rounded-full filter blur-[100px] animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-600/20 rounded-full filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-[400px] h-[400px] bg-indigo-600/20 rounded-full filter blur-[100px] animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* --- الأيقونة مع موجة نبض --- */}
        <div className="relative flex items-center justify-center">
          {/* حلقات نبض */}
          {[1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="absolute rounded-full border border-indigo-400/40"
              initial={{ width: 80, height: 80, opacity: 0.6 }}
              animate={{ width: 80 + i * 50, height: 80 + i * 50, opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeOut",
              }}
            />
          ))}

          {/* الأيقونة المركزية */}
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.5)]"
          >
            <Radio size={40} className="text-white" />
          </motion.div>
        </div>

        {/* --- اسم النظام --- */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-center"
        >
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-300 via-purple-400 to-cyan-300 bg-clip-text text-transparent tracking-tight">
            Tower Monitor
          </h1>
          <p className="text-slate-400 text-xs font-mono mt-1 tracking-widest">
            NETWORK MONITORING SYSTEM
          </p>
        </motion.div>

        {/* --- الرسالة --- */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center space-y-1"
        >
          <p className="text-white font-semibold text-lg">{message}</p>
          <p className="text-slate-500 font-mono text-xs tracking-widest">{sub}</p>
        </motion.div>

        {/* --- شريط التقدم (اختياري) أو 3 نقاط متحركة --- */}
        {progress !== null ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-56"
          >
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <p className="text-slate-500 text-xs text-center mt-2 font-mono">
              {Math.round(progress)}%
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
