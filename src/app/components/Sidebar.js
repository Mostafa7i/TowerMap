//sidBar
"use client";
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  ChevronUp,
  FileBarChart2,
  LayoutDashboard,
  PlusCircle,
  Settings,
  X,
  Activity,
  Radio,
  LogOut,
  Clock,
  Users,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";

const NavLink = ({ icon, children, onClick, isActive }) => (
  <a
    className={`flex items-center p-3 my-1 rounded-lg transition-all duration-200 ${isActive
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
        : "text-gray-300 hover:bg-gray-700/60 hover:text-white"
      }`}
    href="#"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
  >
    <span className={`${isActive ? "text-white" : "text-gray-400"}`}>{icon}</span>
    <span className="mx-4 font-medium">{children}</span>
  </a>
);

export default function Sidebar({ activeView, setActiveView, toggle, isOpen, closeSidebar, towers = [], isAdmin = false }) {
  const [alertsVisible, setAlertsVisible] = useState(true);
  const { logOut, user } = useAuth();

  const handleNavigation = (view) => {
    setActiveView(view);
    closeSidebar();
  };

  // استخراج الأبراج الخطرة كـ تنبيهات
  const recentAlerts = useMemo(() => {
    return towers
      .filter((t) => {
        const status = (t?.status || "").toLowerCase();
        const latency    = t.lastMeasurement?.latency    || 0;
        const packetLoss = t.lastMeasurement?.packetLoss || 0;

        const isBadStatus    = ["danger", "critical", "warning"].includes(status);
        const isLatencyBad   = latency    >= 80;   // نفس منطق الـ Navbar
        const isPacketBad    = packetLoss >= 5;

        return isBadStatus || isLatencyBad || isPacketBad;
      })
      .slice(0, 5)
      .map((t) => {
        const status = (t?.status || "").toLowerCase();
        const latency    = t.lastMeasurement?.latency    || 0;
        const packetLoss = t.lastMeasurement?.packetLoss || 0;

        let alertType = "warning";
        if (status === "danger" || latency >= 300 || packetLoss >= 15) {
          alertType = "danger";
        } else if (status === "critical" || latency >= 150 || packetLoss >= 10) {
          alertType = "critical";
        }

        return {
          id:     t._id,
          name:   t.TowerName,
          ip:     t.ip_address,
          status: alertType,
          time:   t.updatedAt
            ? new Date(t.updatedAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
            : "—",
        };
      });
  }, [towers]);


  return (
    <div className="relative">
      {/* Mobile toggle button */}
      {!isOpen && (
        <button
          onClick={() => toggle(true)}
          className="md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-50 
               bg-indigo-600/80 cursor-pointer text-white px-1 py-3 rounded-l-xl shadow-lg 
               flex flex-col items-center justify-center gap-2
               hover:bg-indigo-700 transition-all duration-300"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-widest">القائمة</span>
        </button>
      )}

      <aside
        className={`fixed lg:static top-0 z-40 right-0 h-screen bg-linear-to-b from-gray-900 to-gray-950 border-l border-gray-700/50 text-white transition-transform duration-300 ease-in-out w-72 flex flex-col
                   ${isOpen ? "translate-x-0" : "translate-x-full"}
                   lg:translate-x-0`}
      >
        {/* Header */}
        <div className="border-b border-gray-700/50 flex justify-between items-center px-5 py-4 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-indigo-400" />
            </div>
            <span>مراقبة الأبراج</span>
          </h2>
          <button
            onClick={() => toggle(false)}
            className="cursor-pointer md:hidden hover:text-red-400 hover:rotate-90 transition-all duration-200 p-1 rounded-lg hover:bg-red-500/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <NavLink
            icon={<LayoutDashboard className="w-5 h-5" />}
            onClick={() => handleNavigation("overview")}
            isActive={activeView === "overview"}
          >
            نظرة عامة
          </NavLink>
          <NavLink
            icon={<PlusCircle className="w-5 h-5" />}
            onClick={() => handleNavigation("createTower")}
            isActive={activeView === "createTower"}
          >
            إضافة برج جديد
          </NavLink>
          <NavLink
            icon={<Activity className="w-5 h-5" />}
            onClick={() => handleNavigation("simulator")}
            isActive={activeView === "simulator"}
          >
            محاكي الشبكة
          </NavLink>
          <NavLink
            icon={<FileBarChart2 className="w-5 h-5" />}
            onClick={() => handleNavigation("reports")}
            isActive={activeView === "reports"}
          >
            التقارير
          </NavLink>
          <NavLink
            icon={<Settings className="w-5 h-5" />}
            onClick={() => handleNavigation("settings")}
            isActive={activeView === "settings"}
          >
            الإعدادات
          </NavLink>
          {/* Admin only */}
          {isAdmin && (
            <NavLink
              icon={<Users className="w-5 h-5" />}
              onClick={() => handleNavigation("adminUsers")}
              isActive={activeView === "adminUsers"}
            >
              إدارة المستخدمين
            </NavLink>
          )}
        </nav>

        {/* Recent Alerts */}
        <div className="p-3 border-t border-gray-700/50 shrink-0">
          <button
            onClick={() => setAlertsVisible(!alertsVisible)}
            className="w-full flex justify-between items-center px-2 py-2 rounded-lg hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-400 w-4 h-4" />
              <span className="text-sm font-semibold text-gray-200">آخر التنبيهات</span>
              {recentAlerts.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {recentAlerts.length}
                </span>
              )}
            </div>
            {alertsVisible ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>

          {alertsVisible && (
            <div className="space-y-1.5 max-h-48 overflow-auto mt-2 pr-1">
              {recentAlerts.length === 0 ? (
                <div className="flex items-center gap-2 text-gray-600 text-xs font-mono py-3 justify-center">
                  <Radio className="w-4 h-4" />
                  <span>لا توجد تنبيهات حالية</span>
                </div>
              ) : (
                recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-2 rounded-lg px-3 py-2 border ${
                      alert.status === "danger"
                        ? "bg-red-500/5 border-red-500/20"
                        : alert.status === "critical"
                        ? "bg-orange-500/5 border-orange-500/20"
                        : "bg-yellow-500/5 border-yellow-500/20"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 animate-pulse ${
                        alert.status === "danger" 
                          ? "bg-red-400" 
                          : alert.status === "critical" 
                          ? "bg-orange-400" 
                          : "bg-yellow-400"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-semibold truncate ${
                          alert.status === "danger" 
                            ? "text-red-300" 
                            : alert.status === "critical" 
                            ? "text-orange-300" 
                            : "text-yellow-300"
                        }`}>{alert.name}</p>
                        <span className={`text-[9px] font-bold px-1 py-0.5 rounded shrink-0 ${
                          alert.status === "danger"
                            ? "bg-red-500/20 text-red-400"
                            : alert.status === "critical"
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {alert.status === "danger" ? "خطر" : alert.status === "critical" ? "حرج" : "تحذير"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-2.5 h-2.5 text-gray-600" />
                        <span className="text-[10px] text-gray-600 font-mono">{alert.time}</span>
                        <span className="text-[10px] text-gray-700">·</span>
                        <span className="text-[10px] text-gray-600 font-mono truncate">{alert.ip}</span>
                      </div>
                    </div>
                  </div>
                ))

              )}
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-700/50 shrink-0">
          <button
            onClick={logOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 text-sm font-medium border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
