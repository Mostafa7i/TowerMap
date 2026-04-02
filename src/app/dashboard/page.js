//dashboard
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User2, LayoutDashboard, Loader2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import Sidebar from "@/app/components/Sidebar";
import Reports from "@/app/components/Reports";
import Settings from "@/app/components/Settings";
import Overview from "@/app/components/Overview";
import CreateTower from "@/app/components/CreateTower";
import API from "../services/api";
import SimulatorPage from "../components/Simulator";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();
  const [towers, setTowers] = useState([]);
  const [activeView, setActiveView] = useState("overview");


  const [stats, setStats] = useState({ critical: 0, warning: 0, normal: 0 });
  const fetchTowers = async () => {
    try {
      const response = await API.get("/towerMap/getTower");
      const data = response.data.data;
      setTowers(data);

      const statusLower = (s) => (s || '').toLowerCase();
      const stats = {
        critical: data.filter(t => ['critical', 'danger'].includes(statusLower(t.status))).length,
        warning: data.filter(t => statusLower(t.status) === 'warning').length,
        normal: data.filter(t => statusLower(t.status) === 'safe').length,
      };
      setStats(stats);

    } catch (error) {
      console.error("Error fetching towers:", error);
      console.log(error.message)
    }
  };
  useEffect(() => {
    fetchTowers(); // أول مرة
    const interval = setInterval(fetchTowers, 10000);
    return () => clearInterval(interval);
  }, []);
  // تحسين أداء التنقل بين الصفحات
  const renderActiveView = () => {
    switch (activeView) {
      case "createTower":
        return <CreateTower towers={towers} />;
      case "reports":
        return <Reports towers={towers} />;
      case "simulator":
        return <SimulatorPage towers={towers} />;
      case "settings":
        return <Settings towers={towers} />;
      case "overview":
      default:
        return <Overview user={user} towers={towers} stats={stats} />;
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/Login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="mr-3 text-lg font-medium text-gray-600">
          {loading ? "جاري تحميل البيانات..." : "يتم تحويلك لصفحة تسجيل الدخول..."}
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]" dir="rtl">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        toggle={(val) => setSidebarOpen(typeof val === 'boolean' ? val : !sidebarOpen)}
        activeView={activeView}
        closeSidebar={() => setSidebarOpen(false)}
        setActiveView={setActiveView}
        towers={towers}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
        <header className="h-20 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-lg">
              <LayoutDashboard className="text-indigo-400 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-100">لوحة التحكم</h1>
              <p className="text-xs text-gray-400">
                مراقبة أبراج الاتصالات - تحديث حي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-r pr-4">
            <div className="text-left ml-3">
              <p className="text-sm font-bold text-gray-200 leading-none mb-1">
                {user?.fullName || "مستخدم"}
              </p>
              <p className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                {user?.section || "بدون تخصص"}
              </p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-blue-100 flex items-center justify-center bg-gray-50 overflow-hidden shadow-inner">
                <User2 className="text-gray-400 w-7 h-7" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-7xl mx-auto">
            {/* Dynamic View Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {renderActiveView()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
