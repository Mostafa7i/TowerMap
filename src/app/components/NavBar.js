"use client";
import Link from "next/link";
import React, {useState } from "react";
import {
  LogOut,
  Radio,
  Home,
  Bell,
  Menu,
  X,
  AlertTriangle,
  LayoutDashboardIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logOut , loading  } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState(false);
  const [towers, setTowers] = useState([]); 

  const alertsCount = towers.filter(
    (t) => t.status === "warning" || t.status === "critical"
  ).length;

console.log(user)
  const navItems = [
    { name: "الرئيسية", path: "/", icon: Home },
    { name: "لوحة التحكم", path: "/dashboard", icon: LayoutDashboardIcon },
  ];

  const isLoggedIn = !!user;

  if(loading) return <nav className="bg-linear-to-r from-gray-800 to-gray-500 animate-pulse  shadow-xl border-b h-20 border-gray-200 sticky top-0 z-50"></nav>
  return (
    <nav className="bg-linear-to-r from-gray-700 to-gray-950  shadow-xl border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-8xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link
            href={isLoggedIn ? "/Dashboard" : "/"}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 bg-linear-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Radio className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold bg-linear-to-r from-indigo-300 to-purple-500 bg-clip-text text-transparent">
              TowerMonitor
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {isLoggedIn ? (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.path}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-white hover:bg-indigo-50 hover:text-indigo-600 font-medium transition-all duration-200"
                  >
                    <item.icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                ))}

                {/* أيقونة التنبيهات مع Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setAlertsDropdownOpen(!alertsDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-white hover:bg-indigo-50 hover:text-indigo-600 font-medium transition-all duration-200 relative"
                  >
                    <Bell size={20} />
                    <span>التنبيهات</span>
                    {alertsCount >= 0 && (
                      <span className="absolute -top-1 left-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {alertsCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown التنبيهات الحقيقية */}
                  {alertsDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-bold text-black text-md">آخر التنبيهات</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {recentAlerts.length === 0 ? (
                          <p className="p-4 text-center text-green-600 font-medium">لا توجد تنبيهات حاليًا 🎉</p>
                        ) : (
                          recentAlerts.map((alert) => (
                            <div
                              key={alert.id}
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                                alert.type === "critical" ? "bg-red-50" : "bg-yellow-50"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <AlertTriangle
                                  size={20}
                                  className={alert.type === "critical" ? "text-red-600" : "text-yellow-600"}
                                />
                                <div className="flex-1 text-right">
                                  <p className="font-semibold">{alert.tower}</p>
                                  <p className="text-sm text-gray-600">{alert.detail}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-3 bg-gray-50 text-center">
                        <Link
                          href="/dashboard/alerts"
                          className="text-indigo-600 font-medium hover:underline"
                          onClick={() => setAlertsDropdownOpen(false)}
                        >
                          عرض كل التنبيهات →
                        </Link>
                      </div>
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
                  className="px-7 py-3 border-2 border-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all hover:shadow-lg"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/Register"
                  className="px-7 py-3 bg-linear-to-r from-indigo-600 to-purple-700 text-white rounded-xl font-bold hover:shadow-xl transform hover:scale-105 transition-all"
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
        <div className="md:hidden  border-t border-gray-200">
          <div className="px-4 py-6 space-y-3">
            {isLoggedIn ? (
              <>
                {/* نفس المنيو */}
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-indigo-50 text-white font-medium"
                  >
                    <item.icon size={22} />
                    <span>{item.name}</span>
                  </Link>
                ))}

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
                        <p className="text-center text-gray-500">لا توجد تنبيهات</p>
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

