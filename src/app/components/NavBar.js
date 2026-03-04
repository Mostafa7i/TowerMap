"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  LogOut,
  Radio,
  Home,
  Bell,
  Menu,
  X,
  AlertTriangle,
  LayoutDashboardIcon,
  Clock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePathname } from "next/navigation";
import SplashScreen from "./SplashScreen";
import API from "../services/api";

export default function Navbar() {
  const { user, logOut, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState(false);
  const [towers, setTowers] = useState([]);
  const pathname = usePathname();


useEffect(() => {
  const fetchAlerts = async () => {
    if (typeof API === 'undefined') {
        console.warn("API is still undefined, retrying...");
        return;
    }

    try {
      const res = await API.get("/towerMap/getTower");
      if (res.data && res.data.success) {
        setTowers(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    }
  };

  // تأكد من وجود مستخدم قبل بدء الـ Polling
  if (user) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 10000);
      return () => clearInterval(interval);
  }
}, [user]);
const recentAlerts = towers
  .filter((t) => {
    const latency = t.lastMeasurement?.latency || 0;
    const loss = t.lastMeasurement?.packetLoss || 0;

    // 2. شروط العطل (عدل الأرقام دي حسب ما تحب)
    const isLatencyBad = latency > 150; // لو البنج عالي
    const isLossBad = loss > 5;        // لو فيه فقد بيانات
    const isDangerStatus = t.status?.toLowerCase() === "danger";

    // لو أي شرط من دول تحقق، البرج يظهر في التنبيهات فوراً
    return isLatencyBad || isLossBad || isDangerStatus;
  })
  .map(t => {
    // تحديد لون الأيقونة بناءً على خطورة الرقم
    const isCritical = (t.lastMeasurement?.latency > 300 || t.lastMeasurement?.packetLoss > 15);
    
    return {
      id: t._id,
      tower: t.TowerName,
      type: isCritical ? "critical" : "warning",
      detail: `Latency: ${t.lastMeasurement?.latency}ms | Loss: ${t.lastMeasurement?.packetLoss}%`,
      time: t.updatedAt
    };
  });

  const alertsCount = recentAlerts.length;

  const navItems = [
    { name: "الرئيسية", path: "/", icon: Home },
    { name: "لوحة التحكم", path: "/dashboard", icon: LayoutDashboardIcon },
  ];

  const isLoggedIn = !!user;

  if (loading) return <SplashScreen />;
  return (
    <nav className="bg-linear-to-r from-gray-700 to-gray-950  shadow-xl border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-8xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 bg-linear-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Radio className="text-white" size={24} />
            </div>
            <h1
              className={`${
                pathname === "/"
                  ? "text-2xl font-bold bg-linear-to-r from-lime-600 to-purple-500 drop-shadow-2xl  bg-clip-text text-transparent scale-105 " // الشكل لما يكون نشط
                  : "text-2xl font-bold bg-linear-to-r from-indigo-300 to-purple-500 bg-clip-text text-transparent"
              }`}
            >
              TowerMonitor
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {isLoggedIn ? (
              <>
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      className={`${
                        isActive
                          ? "flex items-center gap-2 px-2 py-3 rounded-xl text-indigo-600  bg-indigo-50 font-medium transition-all duration-200"
                          : "text-gray-500 flex items-center gap-2 px-2 py-3 rounded-xl"
                      } hover:text-indigo-500 transition-colors`}
                    >
                      <item.icon size={20} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                {/* أيقونة التنبيهات مع Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setAlertsDropdownOpen(!alertsDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-white hover:bg-indigo-50 hover:text-indigo-600 font-medium transition-all duration-200 relative"
                  >
                    <Bell size={20} />
                    <span>التنبيهات</span>
                    {alertsCount > 0 && (
                      <span className="absolute -top-1 left-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {alertsCount}
                      </span>
                    )}
                  </button>

                 {alertsDropdownOpen && (
                    <div className="absolute top-full left-0 mt-3 w-85 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="p-4 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
                        <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                          <Bell size={16} className="text-indigo-400" /> آخر التنبيهات النشطة
                        </h3>
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-md">حالة حرجة</span>
                      </div>

                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {recentAlerts.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                              <X className="text-emerald-500" size={24} />
                            </div>
                            <p className="text-slate-400 text-sm font-medium">لا توجد أعطال حالياً.. النظام مستقر</p>
                          </div>
                        ) : (
                          recentAlerts.map((alert) => (
                            <div key={alert.id} className={`p-4 border-b border-slate-800 hover:bg-slate-800/40 transition-colors cursor-pointer group`}>
                              <div className="flex items-start gap-3 text-right" dir="rtl">
                                <div className={`mt-1 p-2 rounded-lg ${alert.type === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                  <AlertTriangle size={18} />
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-slate-100 text-sm group-hover:text-indigo-400 transition-colors">{alert.tower}</p>
                                  <p className="text-xs text-slate-400 mt-1 font-mono">{alert.detail}</p>
                                  <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500">
                                    <Clock size={10} />
                                    {new Date(alert.time).toLocaleTimeString("ar-EG")}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      <Link href="/dashboard" 
                        onClick={() => setAlertsDropdownOpen(false)}
                        className="block p-3 text-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors">
                        الانتقال للوحة التحكم ومتابعة الأعطال
                      </Link>
                    </div>
                  )}
              
                </div>

                <div className="w-px h-10 bg-gray-300 mx-4" />

                {/* User Info */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      {user?.fullName.toUpperCase() || "م"}
                    </p>
                    <p className="text-xs text-gray-500">{user?.section}</p>
                  </div>
                  <div className="w-11 h-11 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {user?.fullName?.charAt(0).toUpperCase() || "Uk"}
                  </div>

                  <button
                    onClick={logOut}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl  transition-all hover:shadow-lg hover:scale-105"
                  >
                    <LogOut size={20} />
                    LogOut
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/Login"
                  className={`px-7 py-3 rounded-xl font-bold transform hover:scale-105 transition-all ${
                    pathname === "/Login"
                      ? "bg-lime-600 shadow-xl scale-105 text-white"
                      : "bg-linear-to-r from-indigo-500 to-purple-600 text-white hover:shadow-xl"
                  }`}
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/Register"
                  className={`px-7 py-3 rounded-xl font-bold transform hover:scale-105 transition-all ${
                    pathname === "/Register"
                      ? "bg-lime-600  shadow-xl scale-105 text-white" 
                      : "bg-linear-to-r from-indigo-600 to-purple-700 text-white hover:shadow-xl"
                  }`}
                >
                  إنشاء حساب
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden bg-indigo-500 p-2 rounded-lg hover:bg-indigo-400 text-white transition"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Content */}
      {mobileMenuOpen && (
        <div className="md:hidden  border-t z-50 border-gray-200">
          <div className="px-4 py-6 space-y-3">
            {isLoggedIn ? (
              <>
                {navItems.map((item) => {
                  const isActive = pathname === item.path;

                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`${
                        isActive
                          ? "flex items-center gap-2 px-2 py-3 rounded-xl text-indigo-600  bg-indigo-50 font-medium transition-all duration-200"
                          : "text-gray-500 flex items-center gap-2 px-2 py-3 rounded-xl"
                      } hover:text-indigo-500 transition-colors`}
                    >
                      <item.icon size={22} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                {/* التنبيهات في الموبايل */}
                <div>
                  <button
                    onClick={() => setAlertsDropdownOpen(!alertsDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-indigo-50 text-white font-medium relative"
                  >
                    <div className="flex items-center gap-3">
                      <Bell size={22} />
                      <span>التنبيهات</span>
                    </div>
                    {alertsCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {alertsCount}
                      </span>
                    )}
                  </button>

                  {alertsDropdownOpen && (
                    <div className="mt-2 bg-gray-50 rounded-lg p-4 space-y-3">
                      {recentAlerts.length === 0 ? (
                        <p className="text-center text-gray-500">
                          لا توجد تنبيهات
                        </p>
                      ) : (
                        recentAlerts.map((alert) => (
                          <div key={alert.id} className="text-sm">
                            <p className="font-semibold">{alert.tower}</p>
                            <p className="text-gray-600">{alert.detail}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={logOut}
                  className="w-full bg-red-500 text-white py-3 rounded-lg font-bold"
                >
                  LogOut
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/Login"
                  className="block w-full py-3 text-center border-2 border-indigo-600 text-indigo-100 rounded-lg font-bold"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/Register"
                  className="block w-full py-3 text-center bg-indigo-600 text-white rounded-lg font-bold"
                >
                  إنشاء حساب
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
