//createTower

"use client";
import React, { useState } from "react";
import { Building2, MapPin, Radio, Loader2, Info } from "lucide-react";
import API from "../services/api";
import { useRouter } from "next/navigation";
import { NotifiyErorr, NotifiySuccess } from "./Notify";

export default function CreateTower() {
  const [formData, setFormData] = useState({
    TowerName: "",
    ip_address: "",
    lat: "",
    lng: "",
    vendor: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post("/tower/addTower", {
        TowerName: formData.TowerName,
        ip_address: formData.ip_address,
        location: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
        },
        vendor: formData.vendor,
      });

      NotifiySuccess("تم إضافة البرج بنجاح! جاري التوجيه...");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (error) {
      NotifiyErorr(error.response?.data?.message || "حدث خطأ في إضافة البرج");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex justify-center items-start py-8 animate-in fade-in duration-700">
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 max-w-2xl w-full">
        {/* Header Section */}
        <div className="p-8 text-white flex flex-col gap-3 items-center bg-linear-to-br from-indigo-600 to-purple-700 relative overflow-hidden">
          {/* خلفية جمالية خفيفة */}
          <Radio size={80} className="absolute -right-5 -top-5 opacity-20 rotate-12" />
          
          <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
            <Radio size={40} className="text-white" />
          </div>
          
          <div className="text-center">
            <h2 className="font-bold text-3xl tracking-tight">إضافة برج جديد</h2>
            <p className="text-indigo-100 text-sm mt-2 max-w-xs mx-auto">
              أدخل بيانات البرج بدقة لضمان تفعيل المراقبة الفورية في النظام.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white" dir="rtl">
          
          {/* Tower Name & IP Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 mr-1">اسم البرج</label>
              <select
                name="TowerName"
                onChange={handleChange}
                value={formData.TowerName}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-gray-700"
                required
              >
                <option value="" hidden>اختر البرج...</option>
                <option value="Cairo Tower">برج القاهرة</option>
                <option value="Geza Tower">برج الجيزة</option>
                <option value="Mansoura Tower">برج المنصورة</option>
                <option value="Tanta Tower">برج طنطا</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 mr-1">عنوان الـ IP</label>
              <input
                name="ip_address"
                onChange={handleChange}
                value={formData.ip_address}
                type="text"
                placeholder="192.168.1.1"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all dir-ltr"
                required
              />
            </div>
          </div>

          {/* Coordinates Fieldset */}
          <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={18} className="text-indigo-600" />
              <span className="text-sm font-bold text-gray-800">إحداثيات الموقع</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  name="lat"
                  onChange={handleChange}
                  value={formData.lat}
                  type="number"
                  step="any"
                  placeholder="خط العرض (Latitude)"
                  className="w-full pr-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white outline-none"
                  required
                />
                <MapPin className="absolute right-3 top-3.5 text-gray-400" size={18} />
              </div>
              <div className="relative">
                <input
                  name="lng"
                  onChange={handleChange}
                  value={formData.lng}
                  type="number"
                  step="any"
                  placeholder="خط الطول (Longitude)"
                  className="w-full pr-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white outline-none"
                  required
                />
                <MapPin className="absolute right-3 top-3.5 text-gray-400" size={18} />
              </div>
            </div>
          </div>

          {/* Company/Vendor */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 mr-1">الشركة المصنعة</label>
            <div className="relative">
              <select
                name="vendor"
                value={formData.vendor}
                onChange={handleChange}
                className="w-full pr-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all appearance-none"
                required
              >
                <option value="" hidden>اختر الشركة...</option>
                <option value="Huawei">Huawei</option>
                <option value="Nokia">Nokia</option>
                <option value="ZTE">ZTE</option>
                <option value="Cisco">Cisco</option>
              </select>
              <Building2 className="absolute right-3 top-3.5 text-gray-400" size={18} />
            </div>
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <Info size={16} className="text-blue-600 mt-0.5" />
            <p className="text-[12px] text-blue-700">
              تأكد من صحة الـ IP والإحداثيات، حيث سيتم عمل Ping تلقائي فور الإضافة.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                جاري المعالجة...
              </>
            ) : (
              "إضافة البرج للمراقبة"
            )}
          </button>
        </form>
      </div>
    </section>
  );
}