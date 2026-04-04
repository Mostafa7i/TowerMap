"use client";
import { motion } from "framer-motion";
import { Clock, ShieldCheck, Mail, LogOut, XCircle, ShieldX } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

export default function PendingVerification() {
  const { user, logOut } = useAuth();

  const isRejected = user?.verificationStatus === "rejected";

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4"
      dir="rtl"
    >
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full border ${
              isRejected
                ? "bg-red-500/5 border-red-500/10"
                : "bg-indigo-500/5 border-indigo-500/10"
            }`}
            style={{
              width: `${100 + i * 60}px`,
              height: `${100 + i * 60}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-10 shadow-2xl text-center">
          {/* أيقونة */}
          <motion.div
            animate={isRejected ? { scale: [1, 1.05, 1] } : { rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
            className={`mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center ${
              isRejected
                ? "bg-red-500/10 border-2 border-red-500/30"
                : "bg-amber-500/10 border-2 border-amber-500/30"
            }`}
          >
            {isRejected ? (
              <XCircle className="w-12 h-12 text-red-400" />
            ) : (
              <Clock className="w-12 h-12 text-amber-400" />
            )}
          </motion.div>

          {/* النص */}
          <h1 className="text-2xl font-bold text-white mb-3">
            {isRejected ? "تم رفض طلبك" : "في انتظار موافقة الإدارة"}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-2">
            مرحباً،{" "}
            <span className="text-indigo-400 font-semibold">{user?.fullName}</span>
          </p>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            {isRejected ? (
              <>
                للأسف، تم رفض طلب انضمامك كـ{" "}
                <span className="text-red-400 font-semibold bg-red-500/10 px-2 py-0.5 rounded-full">
                  {user?.section}
                </span>
                . يمكنك التواصل مع الإدارة لمعرفة السبب أو إعادة التقديم بحساب آخر.
              </>
            ) : (
              <>
                تم إنشاء حسابك بنجاح كـ{" "}
                <span className="text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full">
                  {user?.section}
                </span>
                . حسابك قيد المراجعة من قِبل الإدارة وسيتم تفعيله قريباً.
              </>
            )}
          </p>

          {/* خطوات */}
          {!isRejected && (
            <div className="space-y-3 mb-8 text-right">
              {[
                { icon: ShieldCheck, text: "تم إنشاء حسابك بنجاح", done: true },
                { icon: Clock, text: "مراجعة الطلب من قِبل الإدارة", done: false },
                { icon: Mail, text: "الوصول إلى لوحة التحكم", done: false },
              ].map(({ icon: Icon, text, done }, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                    done
                      ? "bg-green-500/10 border-green-500/20 text-green-400"
                      : "bg-slate-700/30 border-slate-700/50 text-slate-500"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{text}</span>
                  {done && (
                    <span className="mr-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">
                      ✓ مكتمل
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* رسالة مرفوض */}
          {isRejected && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-right">
              <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-1">
                <ShieldX className="w-4 h-4" />
                سبب الرفض
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                لم توافق الإدارة على طلبك في الوقت الحالي. يمكنك التواصل معهم مباشرةً لمزيد من التفاصيل.
              </p>
            </div>
          )}

          {/* زر تسجيل خروج */}
          <button
            onClick={logOut}
            className="flex items-center gap-2 mx-auto text-red-400 hover:text-red-300 text-sm font-medium transition-colors hover:underline"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </motion.div>
    </div>
  );
}
