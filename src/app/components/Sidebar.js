//sidBar
"use client";
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  ChevronUp,
  FileBarChart2,
  LayoutDashboard,
  Menu,
  PlusCircle,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";

const NavLink = ({ icon, children, onClick, isActive }) => (
  <a
    className={`flex items-center p-3 my-1 rounded-lg transition-colors ${
      isActive
        ? "bg-indigo-600 text-white"
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`}
    href="#"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
  >
    {icon}
    <span className="mx-4 font-medium">{children}</span>
  </a>
);
export default function Sidebar({ activeView, setActiveView, toggle, isOpen ,closeSidebar }) {
  const [alertsVisible, setAlertsVisible] = useState(true);
  
const handleNavigation = (view) => {
  // بيقفل السايد بار أوتوماتيك
    setActiveView(view); 
    closeSidebar();      
  };
  return (
    <div className="bg-green-400">
      {!isOpen && (
        <button
          onClick={() => toggle(true)}
          className="md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-50 
               bg-blue-600/60 cursor-pointer text-white px-1 py-2 rounded-l-xl shadow-lg 
               flex flex-col items-center justify-center gap-2
               hover:bg-blue-700 transition-all duration-300"
        >
          <LayoutDashboard className="w-5 h-5 rotate-90" />{" "}
          {/* تدوير الأيقونة لتناسب الوضع العمودي */}
          <span className="text-xs font-bold tracking-widest">القائمة</span>
        </button>
      )}

      <aside
        className={`fixed lg:static top-20 z-40 right-0 h-full bg-linear-to-r from-gray-700  to-gray-950  text-white transition-transform duration-300 ease-in-out w-72  flex-col
                   ${isOpen ? "translate-x-0" : "translate-x-full"}
                   lg:translate-x-0`}
      >
        {/* header */}
        <div className="border-b flex justify-between items-center px-5 border-gray-700">
          <h2 className="text-2xl  py-5 font-bold text-white flex items-center gap-3">
            <Bell />
            <span>مراقبة الابراج</span>
          </h2>

          <button onClick={() => toggle(true)} className="cursor-pointer md:hidden hover:text-red-500 hover:rotate-90 transition">
            <X  />{" "}
          </button>
        </div>
        {/* body */}
        <nav className="flex-1 p-4">
          <NavLink
            icon={<LayoutDashboard />}
            onClick={() => handleNavigation("overview")}
            isActive={activeView === "overview"}
          >
            نظرة عامة
          </NavLink>
          <NavLink
            icon={<PlusCircle />}
            onClick={() => handleNavigation("createTwoer")}
            isActive={activeView === "createTwoer"}
          >
            اضافة برج جديد
          </NavLink>
          <NavLink
            icon={<FileBarChart2 />}
            onClick={() => handleNavigation("reports")}
            isActive={activeView === "reports"}
          >
            التقارير
          </NavLink>
          <NavLink
            icon={<Settings />}
            onClick={() => handleNavigation("settings")}
            isActive={activeView === "settings"}
          >
            الاعدادات
          </NavLink>
        </nav>

        <div className="p-3 border-t border-gray-500">
          <button
            onClick={() => setAlertsVisible(!alertsVisible)}
            className="w-full flex justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-500" />
              <span>اخر التنبيهات</span>
            </div>
            {alertsVisible ? <ChevronUp /> : <ChevronDown />}
          </button>
          {alertsVisible && (
            <div className="space-y-2 max-h-64 overflow-auto">
              {/* {recentAlerts.length} */}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
