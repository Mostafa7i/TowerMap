//dashboard
"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User2, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import Sidebar from "@/app/components/Sidebar";
import Reports from "@/app/components/Reports";
import Settings from "@/app/components/Settings";
import Overview from "@/app/components/Overview";
import CreateTower from "@/app/components/CreateTower";
import AdminUsers from "@/app/components/AdminUsers";
import UserDashboard from "@/app/components/UserDashboard";
import PendingVerification from "@/app/components/PendingVerification";
import SplashScreen from "@/app/components/SplashScreen";
import API from "../services/api";
import SimulatorPage from "../components/Simulator";
import TowerIssueHistory from "../components/TowerIssueHistory";
import ComplaintsManager from "../components/ComplaintsManager";

const NORMAL_USER_SECTION = "مستخدم عادي";

function DashboardInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [towers, setTowers] = useState([]);
  const [activeView, setActiveView] = useState("overview");
  const [complaintPrefill, setComplaintPrefill] = useState(null);

  // tower pre-selected from notification click
  const analyzeTowerId = searchParams?.get("analyzeTower") || null;
  const targetView = searchParams?.get("view") || null;
  const targetTowerId = searchParams?.get("towerId") || null;
  const urlTimestamp = searchParams?.get("t") || null;

  // إذا تم اختيار برج للتحليل أو عرض التقارير
  useEffect(() => {
    if (analyzeTowerId) {
      setActiveView("overview");
    } else if (targetView === "reports") {
      setActiveView("reports");
    }
  }, [analyzeTowerId, targetView, urlTimestamp]);

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
    }
  };

  useEffect(() => {
    // فقط المستخدمين غير العاديين يحتاجون بيانات الأبراج
    if (user && user.section !== NORMAL_USER_SECTION) {
      fetchTowers();
      const interval = setInterval(fetchTowers, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/Login");
      // Fallback to clear any stuck navigation states
      const timer = setTimeout(() => {
        window.location.href = "/Login";
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, user, router]);

  // ── شاشة التحميل الموحدة ──
  if (loading || !user) {
    return (
      <SplashScreen
        message={loading ? "جاري تحميل بياناتك..." : "يتم تحويلك لتسجيل الدخول..."}
        sub={loading ? "LOADING YOUR DATA" : "REDIRECTING TO LOGIN"}
      />
    );
  }

  // ── مستخدم عادي → لوحة الشكاوى مباشرة ──
  if (user.section === NORMAL_USER_SECTION) {
    return <UserDashboard />;
  }

  // ── دور غير عادي لم يتم التحقق منه أو تم رفضه → شاشة الانتظار / الرفض ──
  if (!user.isAdmin && user.verificationStatus !== "approved") {
    return <PendingVerification />;
  }

  // ─── لوحة تحكم عادية (مهندسون + أدمن) ───
  const handleOpenTicketFromComplaint = (complaint) => {
    // Map complaint fields → issue prefill
    setComplaintPrefill({
      complaintTitle: complaint.title,
      title: `[شكوى] ${complaint.title}`,
      description: [
        complaint.description,
        complaint.problemType ? `\n\nنوع المشكلة: ${complaint.problemType}` : "",
        complaint.towerName ? `\nاسم البرج: ${complaint.towerName}` : "",
        (complaint.userLocation?.address || complaint.userLocation?.lat)
          ? `\nموقع المستخدم: ${complaint.userLocation.address || `${complaint.userLocation.lat}, ${complaint.userLocation.lng}`}`
          : "",
        `\n\nمقدم الشكوى: ${complaint.userName}`,
      ].join(""),
      issueType: "warning",
      priority: "high",
      towerId: "",
    });
    setActiveView("issues");
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "createTower":
        return <CreateTower towers={towers} />;
      case "reports":
        return <Reports towers={towers} initialTowerId={targetTowerId} />;
      case "simulator":
        return <SimulatorPage towers={towers} />;
      case "settings":
        return <Settings towers={towers} />;
      case "adminUsers":
        return <AdminUsers />;
      case "complaints":
        return <ComplaintsManager onOpenTicket={handleOpenTicketFromComplaint} />;
      case "issues":
        return (
          <TowerIssueHistory
            user={user}
            prefillData={complaintPrefill}
            onPrefillConsumed={() => setComplaintPrefill(null)}
          />
        );
      case "overview":
      default:
        return <Overview user={user} towers={towers} stats={stats} analyzeTowerId={analyzeTowerId} />;
    }
  };

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
        isAdmin={user?.isAdmin}
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
                {user?.isAdmin ? "مسؤول النظام" : user?.section || "بدون تخصص"}
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
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {renderActiveView()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<SplashScreen message="جاري تحميل لوحة التحكم..." sub="LOADING DASHBOARD" />}>
      <DashboardInner />
    </Suspense>
  );
}
