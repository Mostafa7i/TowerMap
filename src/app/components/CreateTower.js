"use client";
import React, { useState } from "react";
import { MapPin, Radio, Loader2, Info, CheckCircle2, Crosshair } from "lucide-react";
import API from "../services/api";
import { useRouter } from "next/navigation";
import { NotifiyErorr, NotifiySuccess } from "./Notify";

// ─── IP Validator ──────────────────────────────────────────────────────────────
function isValidIP(ip) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
    ip.split(".").every((n) => parseInt(n) >= 0 && parseInt(n) <= 255);
}

// ─── Field wrapper with float label ───────────────────────────────────────────
function FloatField({ label, children, icon, hint, error, success }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 2, display: "flex", alignItems: "center", gap: 6 }}>
          {icon && <span style={{ opacity: 0.7 }}>{icon}</span>}
          {label}
        </label>
        {success && <span style={{ fontSize: 10, color: "#22c55e", fontFamily: "monospace" }}>✓ صحيح</span>}
        {error && <span style={{ fontSize: 10, color: "#ef4444", fontFamily: "monospace" }}>{error}</span>}
      </div>
      {children}
      {hint && <p style={{ fontSize: 11, color: "#334155", fontFamily: "monospace", margin: 0 }}>{hint}</p>}
    </div>
  );
}

// ─── Stepper ───────────────────────────────────────────────────────────────────
function Stepper({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: i < current ? "#22c55e" : i === current ? "linear-gradient(135deg,#0ea5e9,#6366f1)" : "#1e293b",
              border: i === current ? "2px solid #38bdf8" : "2px solid #1e293b",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: i < current ? 16 : 13, fontFamily: "monospace", fontWeight: 700,
              color: i < current ? "#fff" : i === current ? "#fff" : "#334155",
              transition: "all 0.4s",
              boxShadow: i === current ? "0 0 20px rgba(14,165,233,0.4)" : "none"
            }}>
              {i < current ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 10, color: i === current ? "#38bdf8" : i < current ? "#22c55e" : "#334155", fontFamily: "monospace", textAlign: "center", letterSpacing: 1 }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 2, height: 2, background: i < current ? "#22c55e40" : "#1e293b", marginBottom: 22, transition: "background 0.4s" }}>
              <div style={{ height: "100%", width: i < current ? "100%" : "0%", background: "#22c55e", transition: "width 0.6s ease" }} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Ping Preview ──────────────────────────────────────────────────────────────
function PingSimulator({ ip }) {
  const [status, setStatus] = useState("idle"); // idle | pinging | success | fail
  const simulate = () => {
    if (!ip || !isValidIP(ip)) return;
    setStatus("pinging");
    setTimeout(() => setStatus(Math.random() > 0.3 ? "success" : "fail"), 2000);
  };
  const colors = { idle: "#334155", pinging: "#0ea5e9", success: "#22c55e", fail: "#ef4444" };
  const labels = { idle: "اختبار الاتصال", pinging: "جاري الـ Ping...", success: "الاتصال ناجح ✓", fail: "لا يوجد استجابة ✗" };
  return (
    <button type="button" onClick={simulate} disabled={status === "pinging" || !ip || !isValidIP(ip)} style={{
      background: `${colors[status]}15`, border: `1px solid ${colors[status]}40`,
      borderRadius: 8, padding: "6px 14px", cursor: status === "pinging" || !isValidIP(ip || "") ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", gap: 8, transition: "all 0.3s",
      opacity: !ip || !isValidIP(ip) ? 0.4 : 1
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[status], display: "inline-block", animation: status === "pinging" ? "pulse 0.8s infinite" : "none", boxShadow: `0 0 8px ${colors[status]}` }} />
      <span style={{ fontSize: 11, color: colors[status], fontFamily: "monospace" }}>{labels[status]}</span>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CreateTower() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ TowerName: "", ip_address: "", lat: "", lng: "", vendor: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ipError, setIpError] = useState("");
  const [isCheckingIp, setIsCheckingIp] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "ip_address") {
      if (value && !isValidIP(value)) setIpError("صيغة IP غير صحيحة");
      else setIpError("");
    }
  };

  // Auto-detect location (bonus feature)
  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setFormData((prev) => ({
        ...prev,
        lat: pos.coords.latitude.toFixed(6),
        lng: pos.coords.longitude.toFixed(6),
      }));
    });
  };

  const canNext = [
    formData.TowerName && formData.vendor,
    formData.ip_address && !ipError && !isCheckingIp,
    formData.lat && formData.lng,
  ];

  const handleNext = async () => {
    if (step === 1) {
      if (!isValidIP(formData.ip_address)) {
        setIpError("صيغة IP غير صحيحة");
        return;
      }
      setIsCheckingIp(true);
      try {
        const res = await API.post("/towerMap/checkIp", { ip_address: formData.ip_address });
        if (res.data.exists) {
          setIpError("هذا الـ IP مسجل بالفعل لبرج آخر!");
          setIsCheckingIp(false);
          return;
        }
      } catch (error) {
        let msg = "تعذر التحقق من الـ IP بالسيرفر";
        if (error?.response) msg = error.response.data?.message || msg;
        else if (error?.message) msg = error.message;
        NotifiyErorr(msg);
        setIsCheckingIp(false);
        return; // Don't proceed if there's a server error
      }
      setIsCheckingIp(false);
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/towerMap/addTowers", {
        TowerName: formData.TowerName,
        ip_address: formData.ip_address,
        location: { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) },
        vendor: formData.vendor,
      });
      setSubmitted(true);
      NotifiySuccess("تم إضافة البرج بنجاح!");
      setTimeout(() => router.push("/dashboard"), 3000);
    } catch (error) {
      let msg = "تعذر الاتصال بالسيرفر";
      if (error?.response) msg = error.response.data?.message || "حدث خطأ من السيرفر";
      else if (error?.message) msg = error.message;
      NotifiyErorr(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <>
        <Style />
        <div className="ct-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
          <div className="ct-card fade-in" style={{ padding: 60, textAlign: "center", maxWidth: 480 }}>
            <div style={{ fontSize: 72, marginBottom: 20, animation: "bounceIn 0.6s ease" }}>🎉</div>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "2px solid #22c55e40", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 0 40px rgba(34,197,94,0.2)" }}>
              <CheckCircle2 size={40} color="#22c55e" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: "0 0 10px", fontFamily: "'Tajawal', sans-serif" }}>تمت الإضافة بنجاح!</h2>
            <p style={{ fontSize: 13, color: "#64748b", fontFamily: "monospace", margin: "0 0 8px" }}>{formData.TowerName} — {formData.vendor}</p>
            <p style={{ fontSize: 11, color: "#334155", fontFamily: "monospace", direction: "ltr" }}>{formData.ip_address}</p>
            <div style={{ marginTop: 24, height: 2, background: "#1e293b", borderRadius: 1, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg,#0ea5e9,#22c55e)", animation: "fillBar 3s linear forwards" }} />
            </div>
            <p style={{ fontSize: 11, color: "#334155", fontFamily: "monospace", marginTop: 8 }}>جاري التوجيه للوحة التحكم...</p>
          </div>
        </div>
      </>
    );
  }

  const VENDORS = [
    { value: "Huawei", logo: "🔶", color: "#e2231a" },
    { value: "Nokia", logo: "🔷", color: "#005aff" },
    { value: "ZTE", logo: "🔴", color: "#d0021b" },
    { value: "Cisco", logo: "🌉", color: "#1ba0d7" },
    { value: "Ericsson", logo: "🔵", color: "#0082f0" },
    { value: "Samsung", logo: "⬜", color: "#1428a0" },
  ];

  const TOWERS = [
    { value: "Cairo Tower", label: "برج القاهرة", icon: "🗼", lat: "30.0444", lng: "31.2357" },
    { value: "Mansoura Tower", label: "برج المنصورة", icon: "📡", lat: "31.0409", lng: "31.3785" },
    { value: "Tanta Tower", label: "برج طنطا", icon: "📶", lat: "30.7865", lng: "31.0004" },
    { value: "Alexandria Tower", label: "برج الإسكندرية", icon: "🏛", lat: "31.2001", lng: "29.9187" },
    { value: "Aswan Tower", label: "برج أسوان", icon: "☀️", lat: "24.0889", lng: "32.8998" },
  ];

  return (
    <>
      <Style />
      <div className="ct-root" dir="rtl">

        {/* ── Animated BG particles ── */}
        <div className="ct-particles">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="ct-particle" style={{ "--i": i }} />
          ))}
        </div>

        <div className="ct-card fade-in" style={{ maxWidth: 680, margin: "0 auto", position: "relative", zIndex: 1 }}>

          {/* ── Top banner ── */}
          <div className="ct-banner">
            <div className="ct-banner-glow" />
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
                <Radio size={32} color="white" />
              </div>
              <div style={{ textAlign: "center" }}>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: "white", margin: 0, letterSpacing: 1, fontFamily: "'Tajawal', sans-serif" }}>
                  تسجيل برج مراقبة جديد
                </h2>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, margin: "6px 0 0", fontFamily: "monospace", letterSpacing: 2 }}>
                  TOWER REGISTRATION SYSTEM v2.0
                </p>
              </div>
            </div>
          </div>

          {/* ── Form body ── */}
          <div style={{ padding: 32 }}>

            <Stepper steps={["معلومات البرج", "الشبكة", "الموقع"]} current={step} />

            <form onSubmit={handleSubmit}>

              {/* ── STEP 0: Tower Info ── */}
              {step === 0 && (
                <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                  <FloatField label="اسم البرج" icon="🗼">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {TOWERS.map((t) => (
                        <button key={t.value} type="button"
                          onClick={() => {
                            setFormData((p) => ({ ...p, TowerName: t.value, lat: t.lat, lng: t.lng, isCustomTower: false }));
                          }}
                          className="ct-option-btn"
                          style={{
                            background: formData.TowerName === t.value && !formData.isCustomTower ? "rgba(14,165,233,0.15)" : "#0a1628",
                            border: `1px solid ${formData.TowerName === t.value && !formData.isCustomTower ? "#0ea5e9" : "#1e293b"}`,
                            boxShadow: formData.TowerName === t.value && !formData.isCustomTower ? "0 0 16px rgba(14,165,233,0.2)" : "none"
                          }}>
                          <span style={{ fontSize: 18 }}>{t.icon}</span>
                          <span style={{ fontSize: 12, color: formData.TowerName === t.value && !formData.isCustomTower ? "#38bdf8" : "#64748b", fontFamily: "monospace" }}>{t.label}</span>
                          {formData.TowerName === t.value && !formData.isCustomTower && <span style={{ marginRight: "auto", color: "#0ea5e9", fontSize: 14 }}>✓</span>}
                        </button>
                      ))}
                      <button type="button"
                          onClick={() => {
                            setFormData((p) => ({ ...p, TowerName: "", lat: "", lng: "", isCustomTower: true }));
                          }}
                          className="ct-option-btn"
                          style={{
                            background: formData.isCustomTower ? "rgba(14,165,233,0.15)" : "#0a1628",
                            border: `1px solid ${formData.isCustomTower ? "#0ea5e9" : "#1e293b"}`,
                            boxShadow: formData.isCustomTower ? "0 0 16px rgba(14,165,233,0.2)" : "none"
                          }}>
                          <span style={{ fontSize: 18 }}>✏️</span>
                          <span style={{ fontSize: 12, color: formData.isCustomTower ? "#38bdf8" : "#64748b", fontFamily: "monospace" }}>إدخال اسم غير موجود</span>
                          {formData.isCustomTower && <span style={{ marginRight: "auto", color: "#0ea5e9", fontSize: 14 }}>✓</span>}
                      </button>
                    </div>
                    {formData.isCustomTower && (
                      <div className="fade-in" style={{ marginTop: 12 }}>
                        <input
                          type="text"
                          placeholder="اكتب اسم البرج هنا..."
                          className="ct-input"
                          value={formData.TowerName}
                          onChange={(e) => setFormData(p => ({ ...p, TowerName: e.target.value }))}
                          autoFocus
                        />
                      </div>
                    )}
                  </FloatField>

                  <FloatField label="الشركة المصنعة" icon="🏭">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                      {VENDORS.map((v) => (
                        <button key={v.value} type="button"
                          onClick={() => setFormData((p) => ({ ...p, vendor: v.value }))}
                          className="ct-option-btn"
                          style={{
                            flexDirection: "column", gap: 8, padding: "14px 10px",
                            background: formData.vendor === v.value ? `${v.color}15` : "#0a1628",
                            border: `1px solid ${formData.vendor === v.value ? v.color : "#1e293b"}`,
                            boxShadow: formData.vendor === v.value ? `0 0 16px ${v.color}30` : "none"
                          }}>
                          <span style={{ fontSize: 24 }}>{v.logo}</span>
                          <span style={{ fontSize: 11, color: formData.vendor === v.value ? v.color : "#475569", fontFamily: "monospace", fontWeight: 700 }}>{v.value}</span>
                        </button>
                      ))}
                    </div>
                  </FloatField>
                </div>
              )}

              {/* ── STEP 1: Network ── */}
              {step === 1 && (
                <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                  <FloatField label="عنوان IP" icon="🌐"
                    hint="مثال: 192.168.1.100"
                    error={ipError}
                    success={formData.ip_address && !ipError && isValidIP(formData.ip_address)}>
                    <div style={{ position: "relative" }}>
                      <input
                        name="ip_address"
                        value={formData.ip_address}
                        onChange={handleChange}
                        placeholder="000.000.000.000"
                        className="ct-input"
                        style={{
                          direction: "ltr", letterSpacing: 3, fontSize: 18, fontFamily: "monospace", fontWeight: 700,
                          borderColor: ipError ? "#ef4444" : formData.ip_address && !ipError ? "#22c55e" : undefined
                        }}
                        required
                      />
                      {formData.ip_address && !ipError && (
                        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#22c55e", fontSize: 18 }}>✓</span>
                      )}
                    </div>
                  </FloatField>

                  {/* IP octets visual */}
                  {formData.ip_address && !ipError && (
                    <div className="fade-in" style={{ background: "#0a1628", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 16px" }}>
                      <p style={{ fontSize: 10, color: "#334155", fontFamily: "monospace", margin: "0 0 10px", letterSpacing: 2 }}>IP BREAKDOWN</p>
                      <div style={{ display: "flex", gap: 8, direction: "ltr" }}>
                        {formData.ip_address.split(".").map((oct, i) => (
                          <div key={i} style={{ flex: 1, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
                            <p style={{ fontSize: 9, color: "#334155", fontFamily: "monospace", margin: "0 0 4px" }}>{["Network", "Subnet", "Host", "Node"][i]}</p>
                            <p style={{ fontSize: 16, fontWeight: 800, color: "#38bdf8", fontFamily: "monospace", margin: 0 }}>{oct}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ping test */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <p style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", letterSpacing: 2, margin: 0 }}>اختبار الاتصال المسبق (اختياري)</p>
                    <PingSimulator ip={formData.ip_address} />
                  </div>

                  {/* Info note */}
                  <div style={{ background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10 }}>
                    <Info size={15} color="#38bdf8" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 12, color: "#64748b", fontFamily: "'Tajawal', sans-serif", margin: 0, lineHeight: 1.8 }}>
                      سيتم تنفيذ Ping تلقائي فور إضافة البرج. تأكد أن الـ IP قابل للوصول من الشبكة.
                    </p>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Location ── */}
              {step === 2 && (
                <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                  {/* Auto-detect button */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button type="button" onClick={detectLocation}
                      style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 10, padding: "12px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#a78bfa", fontFamily: "monospace", fontSize: 13, fontWeight: "bold", transition: "all 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.2)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.1)"}>
                      <Crosshair size={16} />
                      تحديد موقعي الحالي تلقائياً
                      <span style={{ fontSize: 10, color: "#6366f140", border: "1px solid #6366f140", borderRadius: 4, padding: "2px 6px", marginLeft: "auto" }}>GPS</span>
                    </button>
                    {formData.lat && formData.lng && (
                      <p style={{ fontSize: 11, color: "#fbbf24", fontFamily: "'Tajawal', sans-serif", margin: 0, textAlign: "justify", lineHeight: 1.6 }}>
                        ⚠️ <strong style={{ fontWeight: 800 }}>تنبيه:</strong> لقد تم تجهيز الإحداثيات الموضحة بالأسفل <strong style={{ color: "#38bdf8" }}>تلقائياً</strong> لتطابق الموقع الجغرافي للبرج الذي اخترته (مثال: أسوان). لا تضغط على الزر أعلاه إلا إذا كنت تقف فعلياً بجوار البرج الآن لتجنب تسجيل الخريطة بشكل خاطئ.
                      </p>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <FloatField label="خط العرض" icon="📍" hint="Latitude (-90 → 90)">
                      <input name="lat" value={formData.lat} onChange={handleChange}
                        type="number" step="any" placeholder="30.0444"
                        className="ct-input" style={{ direction: "ltr", fontFamily: "monospace", fontWeight: 700 }} required />
                    </FloatField>
                    <FloatField label="خط الطول" icon="📍" hint="Longitude (-180 → 180)">
                      <input name="lng" value={formData.lng} onChange={handleChange}
                        type="number" step="any" placeholder="31.2357"
                        className="ct-input" style={{ direction: "ltr", fontFamily: "monospace", fontWeight: 700 }} required />
                    </FloatField>
                  </div>

                  {/* Coordinates preview */}
                  {formData.lat && formData.lng && (
                    <div className="fade-in" style={{ background: "#0a1628", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}>
                        <MapPin size={18} color="#38bdf8" />
                        <div>
                          <p style={{ fontSize: 10, color: "#334155", fontFamily: "monospace", margin: 0, letterSpacing: 2 }}>COORDINATES PREVIEW</p>
                          <p style={{ fontSize: 14, color: "#e2e8f0", fontFamily: "monospace", margin: "4px 0 0", direction: "ltr" }}>
                            {parseFloat(formData.lat).toFixed(4)}° N, {parseFloat(formData.lng).toFixed(4)}° E
                          </p>
                        </div>
                      </div>
                      {/* Fake mini-map visual */}
                      <div style={{ height: 100, background: "repeating-linear-gradient(0deg, transparent, transparent 19px, #1e293b 19px, #1e293b 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #1e293b 19px, #1e293b 20px), #0f172a", position: "relative" }}>
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#0ea5e9", boxShadow: "0 0 0 8px rgba(14,165,233,0.2), 0 0 0 16px rgba(14,165,233,0.1)", animation: "ping 2s infinite" }} />
                        </div>
                        <div style={{ position: "absolute", bottom: 8, left: 8, fontSize: 9, color: "#334155", fontFamily: "monospace", direction: "ltr" }}>
                          LAT {formData.lat} · LNG {formData.lng}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary before submit */}
                  <div style={{ background: "#0a1628", border: "1px solid #1e293b", borderRadius: 12, padding: "16px 18px" }}>
                    <p style={{ fontSize: 10, color: "#38bdf8", fontFamily: "monospace", letterSpacing: 2, margin: "0 0 12px" }}>◈ ملخص البيانات قبل الإرسال</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { k: "البرج", v: TOWERS.find(t => t.value === formData.TowerName)?.label || formData.TowerName },
                        { k: "الشركة", v: formData.vendor },
                        { k: "الـ IP", v: formData.ip_address },
                        { k: "الإحداثيات", v: formData.lat && formData.lng ? `${formData.lat}, ${formData.lng}` : "—" },
                      ].map((item) => (
                        <div key={item.k} style={{ background: "#0f172a", borderRadius: 8, padding: "8px 12px" }}>
                          <p style={{ fontSize: 9, color: "#334155", fontFamily: "monospace", margin: 0, letterSpacing: 1 }}>{item.k}</p>
                          <p style={{ fontSize: 12, color: item.v ? "#e2e8f0" : "#334155", fontFamily: "monospace", margin: "4px 0 0", direction: "ltr" }}>{item.v || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Navigation ── */}
              <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                {step > 0 && (
                  <button type="button" onClick={() => setStep(s => s - 1)}
                    style={{ flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 12, color: "#64748b", fontFamily: "'Tajawal', sans-serif", fontWeight: 700, fontSize: 14, padding: 14, cursor: "pointer", transition: "all 0.2s" }}>
                    ← السابق
                  </button>
                )}

                {step < 2 ? (
                  <button type="button" onClick={handleNext}
                    disabled={!canNext[step] || isCheckingIp}
                    className="ct-submit-btn"
                    style={{ flex: 2, opacity: !canNext[step] || isCheckingIp ? 0.3 : 1, cursor: !canNext[step] || isCheckingIp ? "not-allowed" : "pointer" }}>
                    {isCheckingIp ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                        <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} />
                        جاري التحقق...
                      </span>
                    ) : (
                      "التالي →"
                    )}
                  </button>
                ) : (
                  <button type="submit" disabled={loading || !canNext[2]}
                    className="ct-submit-btn"
                    style={{ flex: 2, opacity: loading || !canNext[2] ? 0.4 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                    {loading ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                        <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} />
                        جاري تسجيل البرج...
                      </span>
                    ) : (
                      "⬡  إضافة البرج للمراقبة"
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function Style() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Space+Mono:wght@400;700&display=swap');

      .ct-root {
        font-family: 'Tajawal', sans-serif;
    
        min-height: 100vh;
        padding: 32px 20px;
        position: relative;
        overflow: hidden;
      }
      .ct-particles { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
      .ct-particle {
        position: absolute;
        width: 2px; height: 2px;
        background: #0ea5e9;
        border-radius: 50%;
        opacity: 0.3;
        animation: drift calc(8s + var(--i) * 3s) infinite linear;
        top: calc(var(--i) * 15% + 5%);
        left: calc(var(--i) * 16% + 5%);
      }
      @keyframes drift { 0%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.5)} 66%{transform:translate(-30px,60px) scale(0.8)} 100%{transform:translate(0,0) scale(1)} }

      .ct-card {
        background: #0a1628;
        border: 1px solid #1e293b;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03);
      }
      .ct-banner {
        background: linear-gradient(135deg, #0f2744 0%, #0d1b34 40%, #111827 100%);
        padding: 36px 32px;
        position: relative;
        border-bottom: 1px solid #1e293b;
        overflow: hidden;
      }
      .ct-banner::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse 60% 80% at 50% 120%, rgba(14,165,233,0.12), transparent);
      }
      .ct-banner-glow {
        position: absolute;
        top: -40px; left: 50%;
        transform: translateX(-50%);
        width: 300px; height: 300px;
        background: radial-gradient(circle, rgba(14,165,233,0.08), transparent 70%);
        pointer-events: none;
      }

      .ct-input {
        width: 100%;
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 10px;
        padding: 13px 16px;
        color: #e2e8f0;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
        box-sizing: border-box;
      }
      .ct-input:focus { border-color: #0ea5e9; box-shadow: 0 0 0 3px rgba(14,165,233,0.1); }
      .ct-input::placeholder { color: #334155; }

      .ct-option-btn {
        display: flex; align-items: center; gap: 10;
        padding: 12px 14px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: 'Tajawal', sans-serif;
        text-align: right;
      }
      .ct-option-btn:hover { transform: translateY(-2px); }

      .ct-submit-btn {
        background: linear-gradient(135deg, #0ea5e9, #6366f1);
        border: none;
        border-radius: 12px;
        color: white;
        font-family: 'Tajawal', sans-serif;
        font-weight: 800;
        font-size: 15px;
        padding: 14px;
        transition: all 0.3s;
        letter-spacing: 0.5px;
      }
      .ct-submit-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(14,165,233,0.4);
      }

      .fade-in { animation: fadeIn 0.35s ease forwards; }
      @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      @keyframes spin { to{transform:rotate(360deg)} }
      @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      @keyframes ping { 0%{box-shadow:0 0 0 0 rgba(14,165,233,0.4)} 100%{box-shadow:0 0 0 20px rgba(14,165,233,0)} }
      @keyframes bounceIn { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
      @keyframes fillBar { from{width:0} to{width:100%} }

      input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: #0a1628; }
      ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
    `}</style>
  );
}