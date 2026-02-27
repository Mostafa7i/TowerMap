"use client";
import { AlertTriangle, ShieldCheck, Zap, ArrowLeft } from "lucide-react";
import TextEffect from "./components/TextEffect";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import TeamCard from "./components/TeamCard";
import { Counter } from "./components/Counter";
import { useAuth } from "./context/AuthContext";
import Link from "next/link";

export default function Home() {
  const { isLoggedIn } = useAuth();
  const teamMembers = [
    {
      name: "أحمد سليمان",
      role: "Backend & Leader",
      image:  "/pic/ahmed_seliman.jpeg"
    },
    {
      name: "أحمد محمد",
      role: "Front-End",
      image: "/pic/ahmed_mohamed.jpeg"
    },
    {
      name: "نسرين ابراهيم",
      role: "Front-End",
      image: "/pic/nesreen.jpeg"
        },
    {
      name: "نسرين ابراهيم",
      role: "Back-End",
      image: "/pic/rehab.jpeg"
        },

    {
      name: "يمني",
      role: "Back-End",
      image: "/pic/yomna.jpeg",
    },
    {
      name: "زينب احمد",
      role: "Front-End",
      image: "/pic/zinab.jpeg",
    },
    {
      name: "نجوي حماد",
      role: "Front-End",
      image: "/pic/nagwa.jpeg",
    },
    {
      name: "ايمان رضا",
      role: "Front-End",
      image: "/pic/eman.jpeg",
    },
    {
      name: "نور صلاح",
      role: "Front-End",
      image: "/pic/nour.jpeg",
    },
  ];
  return (
    <div className="relative overflow-hidden bg-slate-950" dir="rtl">
      {/* Hero Section */}
      <div className="relative min-h-svh flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-linear-to-br from-violet-950 via-slate-950 to-fuchsia-950">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
          </div>
        </div>
            <div className="inline-block -mt-20 md:-mt-32 mb-12">
              <span className="bg-violet-500/20 border border-violet-500/30 text-violet-200 px-6 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                نظام المراقبة الذكي الجديد 2025 ✨
              </span>
            </div>

        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 max-w-7xl mx-auto text-center"
        >
          <div>

            <h1
              dir="ltr"
              className="font-black text-2xl md:text-7xl text-white h-16 md:h-30 leading-tight"
            >
              <TextEffect />
            </h1>

            <motion.p
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.7 }}
              className="text-gray-300 text-lg md:text-2xl max-w-5xl mx-auto leading-relaxed mb-8 font-light"
            >
              راقب أداء الشبكة، اكتشف الأعطال قبل حدوثها، وتجنب انقطاع الخدمة
              باستخدام تقنية{" "}
              <bdi className="font-bold text-violet-400">SNMP</bdi> والذكاء
              الاصطناعي
            </motion.p>

            <div className="flex flex-wrap justify-center gap-4">
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 20px rgba(255,255,255,0.5)",
                }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.9 }}
                className="group relative px-6 py-5 bg-linear-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-bold text-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] hover:scale-105"
              >
                <Link href={isLoggedIn ? "/dashboard" : "/Login"}>
                  <span className="relative z-10 flex items-center gap-3">
                    {isLoggedIn ? "تجربة مجانية" : "سجل دخولك الان"}
                    <ArrowLeft className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-linear-to-r from-fuchsia-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Link>
              </motion.button>

              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 20px rgba(255,255,255,0.5)",
                }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.9 }}
                onClick={() => alert("تنبية: لازال قيد التطوير!")}
                className="px-8 py-5 cursor-pointer bg-white/10 backdrop-blur-md border-2 border-white/20 text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:scale-105"
              >
                عرض توضيحي
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="relative bg-linear-to-b from-slate-950 to-slate-900 py-15 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl sm:text-6xl font-black text-white mb-4">
              لماذا تختار نظامنا؟
            </h2>
            <motion.p
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.9, delay: 0.8 }}
              className="text-gray-400 text-lg"
            >
              مزايا لا مثيل لها في السوق
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative bg-linear-to-br from-emerald-500/10 to-emerald-600/5 backdrop-blur-sm border border-emerald-500/20 p-8 rounded-3xl transition-all duration-500 hover:scale-105 hover:border-emerald-400/40 hover:shadow-[0_0_50px_rgba(16,185,129,0.3)]"
            >
              <div className="absolute -top-6 -right-5 w-20 h-20 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/50 group-hover:rotate-12 transition-transform duration-500">
                <ShieldCheck size={48} color="white" strokeWidth={2.5} />
              </div>

              <div className="mt-12">
                <h3 className="text-3xl font-black text-white mb-4">
                  أمان عالي
                </h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  حماية متعددة الطبقات باستخدام تقنية{" "}
                  <span className="text-emerald-400 font-bold">JWT</span> وتشفير
                  من الدرجة العسكرية لضمان سلامة بياناتك
                </p>
              </div>

              <div className="absolute bottom-4 left-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck size={120} strokeWidth={1} />
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="group relative bg-linear-to-br from-rose-500/10 to-rose-600/5 backdrop-blur-sm border border-rose-500/20 p-8 rounded-3xl transition-all duration-500 hover:scale-105 hover:border-rose-400/40 hover:shadow-[0_0_50px_rgba(244,63,94,0.3)]"
            >
              <div className="absolute -top-6 -right-5 w-20 h-20 bg-linear-to-br from-rose-400 to-rose-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-rose-500/50 group-hover:rotate-12 transition-transform duration-500">
                <AlertTriangle size={48} color="white" strokeWidth={2.5} />
              </div>

              <div className="mt-12">
                <h3 className="text-3xl font-black text-white mb-4">
                  تنبيهات فورية
                </h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  اكتشاف تلقائي للمشاكل وإشعارات في الوقت الفعلي عبر البريد
                  الإلكتروني والرسائل النصية
                </p>
              </div>

              <div className="absolute bottom-4 left-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertTriangle size={120} strokeWidth={1} />
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="group relative bg-linear-to-br from-sky-500/10 to-sky-600/5 backdrop-blur-sm border border-sky-500/20 p-8 rounded-3xl transition-all duration-500 hover:scale-105 hover:border-sky-400/40 hover:shadow-[0_0_50px_rgba(14,165,233,0.3)]"
            >
              <div className="absolute -top-6 -right-5 w-20 h-20 bg-linear-to-br from-sky-400 to-sky-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-sky-500/50 group-hover:rotate-12 transition-transform duration-500">
                <Zap size={48} color="white" strokeWidth={2.5} />
              </div>

              <div className="mt-12">
                <h3 className="text-3xl font-black text-white mb-4">
                  أداء سريع
                </h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  معالجة فائقة السرعة للبيانات وتحليل فوري باستخدام خوارزميات
                  الذكاء الاصطناعي المتقدمة
                </p>
              </div>

              <div className="absolute bottom-4 left-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={120} strokeWidth={1} />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative bg-slate-900 py-10 px-4">
        <div className="absolute inset-0 bg-[radial-linear(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]"></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 ">
            <motion.div
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group text-center   p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/1 transition-all duration-300 hover:scale-105"
            >
              <div className="text-4xl md:text-6xl font-black bg-linear-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform">
                <Counter value={4} />
              </div>
              <p className="text-gray-400 text-lg font-medium">شركات اتصال</p>
            </motion.div>

            <motion.div
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="group text-center p-8 bg-white/5 place-content-center backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-105"
            >
              <div className="text-3xl  md:text-6xl font-black bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform">
                <Counter value={24} />/<Counter value={7} />
              </div>
              <p className="text-gray-400 text-lg font-medium">دعم فني</p>
            </motion.div>

            <motion.div
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="group text-center p-8 place-content-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-105"
            >
              <div className="text-3xl md:text-6xl font-black bg-linear-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform">
                <Counter value={99} />.<Counter value={9} />%
              </div>
              <p className="text-gray-400 text-lg font-medium">نسبة تشغيل</p>
            </motion.div>

            <motion.div
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="group text-center p-8 place-content-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-105"
            >
              <div className="text-3xl md:text-6xl font-black bg-linear-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform">
                <Counter value={500} />+
              </div>
              <p className="text-gray-400 text-lg font-medium">
                برج تحت المراقبة
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <motion.div
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="py-10"
      >
        <h2 className="text-white text-center mb-5 text-3xl font-bold">
          فريق العمل
        </h2>
        <div className="h-1 w-32 rounded-full mx-auto bg-indigo-400 -mt-1 mb-5"></div>
        <Swiper
          modules={[Autoplay]}
          // spaceBetween={10}
          slidesPerView={1.5} // جزء من الكارت الجاي يبان
          centeredSlides={true}
          loop={true} // ← ده اللي بيخلّيها مستمرة بدون توقف
          autoplay={{
            delay: 0, // بدون توقف بين الكروت
            disableOnInteraction: false,
          }}
          speed={6000}
          breakpoints={{
            640: { slidesPerView: 2.5 },
            1024: { slidesPerView: 3.5 },
            1280: { slidesPerView: 4.5 },
          }}
          className="py-10"
        >
          {teamMembers.map((member, idx) => (
            <SwiperSlide key={idx}>
              <div className="px-4">
                <TeamCard member={member} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </motion.div>
      {/* Footer */}
      <footer className="relative bg-slate-950 border-t border-white/10 py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            نظام مراقبة أبراج النظام الذكي
          </h2>
          <p className="text-gray-400 text-lg mb-8">مشروع تخرج 2025-2026</p>

          <div className="flex items-center justify-center gap-3 text-gray-500 text-sm">
            <span>صنع بـ</span>
            <span className="text-rose-400 animate-pulse">♥</span>
            <span>في مصر</span>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-violet-500 to-transparent opacity-50"></div>
      </footer>
      {/* Custom Animations */}
      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
