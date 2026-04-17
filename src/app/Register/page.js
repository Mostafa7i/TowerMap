"use client";

import { Building, Key, Mail, PhoneCall, UserPen } from "lucide-react";
import Link from "next/link";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../services/api";
import { NotifiyErorr, NotifiySuccess } from "../components/Notify";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import SplashScreen from "../components/SplashScreen"; // افترضنا وجوده
import Logo from "../components/Logo";

// 1. تقسيم الـ Schema لخطوات
const stepOneSchema = Yup.object({
  fullName: Yup.string()
    .min(3, "الاسم قصير جدًا")
    .max(100, "الاسم طويل جدًا")
    .required("الاسم الكامل مطلوب"),
  phone: Yup.string()
    .matches(/^01[0125][0-9]{8}$/, "رقم الموبايل غير صحيح (11 رقم يبدأ بـ 01)")
    .required("رقم الهاتف مطلوب"),
  section: Yup.string().required("يرجى اختيار التخصص"),
});

const stepTwoSchema = Yup.object({
  email: Yup.string()
    .email("البريد الإلكتروني غير صحيح")
    .required("البريد الإلكتروني مطلوب"),
  password: Yup.string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .matches(/[a-z]/, "يجب أن تحتوي على حرف صغير واحد على الأقل")
    .matches(/[A-Z]/, "يجب أن تحتوي على حرف كبير واحد على الأقل")
    .matches(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل")
    .required("كلمة المرور مطلوبة"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "كلمتا المرور غير متطابقتين")
    .required("تأكيد كلمة المرور مطلوب"),
});

// دالة لتحديد الـ Schema الحالية بناءً على الخطوة
const getValidationSchema = (step) => {
  if (step === 0) return stepOneSchema;
  return stepTwoSchema;
};

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [step, setStep] = useState(0); // الخطوة الحالية
  const { setUser, getMe, setLoggedIn } = useAuth();
  const router = useRouter();

  const totalSteps = 2;

  const handleSubmit = async (values, formikHelpers) => {
    const { setSubmitting, setFieldError } = formikHelpers;

    // إذا لم نصل للخطوة الأخيرة، ننتقل للخطوة التالية فقط
    if (step < totalSteps - 1) {
      setStep(step + 1);
      setSubmitting(false);
      return;
    }

    // --- الخطوة الأخيرة: إرسال البيانات للـ API ---
    setIsLoading(true);
    try {
      const res = await API.post("/auth/register", values);
      NotifiySuccess("تم إنشاء الحساب بنجاح!");
      setIsNavigating(true); // إظهار SplashScreen

      setUser(res.data.user);
      await getMe();
      setLoggedIn(true);

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      console.error(error);
      const data = error.response?.data;
      if (data?.details) {
        data?.details.forEach((msg) => {
          const field = msg.split('"')[1];
          setFieldError(field, msg);
        });
      } else {
        NotifiyErorr(data?.message || "حدث خطأ");
      }
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  // لو بننقل للداشبورد، أظهر الـ Splash
  if (isNavigating) return <SplashScreen />;

  return (
    <div className="relative flex min-h-screen items-center justify-center px-2 py-6 overflow-hidden bg-[#060913]">
      {/* Background Graphic */}
      <div className="absolute inset-0 transition-all duration-1000 mix-blend-screen pointer-events-none" style={{ 
        backgroundImage: "url('/pic/auth_bg.png')", 
        backgroundSize: "cover", 
        backgroundPosition: "center",
        opacity: 0.25
      }}></div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-[#060913]/30 via-[#060913]/60 to-slate-950 pointer-events-none"></div>

      {/* Glowing Animated Blobs */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-600/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-[500px] h-[500px] bg-indigo-600/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md overflow-hidden rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-3xl border border-white/10 relative z-10 bg-transparent"
      >
        {/* Header - تحسين اللون */}
        <div className="bg-linear-to-r from-violet-600/30 to-cyan-600/30 border-b border-white/5 p-3 md:p-6 text-center flex flex-col items-center">
          <div className="mb-5 flex justify-center scale-110 mt-2">
            <Logo animated={true} iconSize={40} />
          </div>
          <h1 className="text-2xl font-bold text-white drop-shadow-md">إنشاء حساب جديد</h1>
          <p className="text-indigo-100 mt-1">
            الخطوة {step + 1} من {totalSteps}
          </p>

          {/* مؤشر الخطوات (Progress Bar) */}
          <div className="flex justify-center mt-4 gap-2">
            {[...Array(totalSteps)].map((_, i) => (
              <div
                key={i}
                className={`h-2 w-12 rounded-full ${i <= step ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>
        </div>

        <Formik
          initialValues={{
            fullName: "",
            email: "",
            phone: "",
            section: "",
            password: "",
            confirmPassword: "",
          }}
          validationSchema={getValidationSchema(step)}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values, setFieldTouched }) => (
            <Form className="p-4 md:p-8 text-white space-y-2" dir="rtl">
              {/* انميشن الانتقال بين الخطوات */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* --- الخطوة الأولى --- */}
                  {step === 0 && (
                    <div className="space-y-4">
                      {/* الاسم الكامل */}
                      <div>
                        <label
                          htmlFor="fullName"
                          className="block text-sm font-medium text-white"
                        >
                          الاسم الكامل
                        </label>
                        <div className="relative mt-1">
                          <Field
                            name="fullName"
                            type="text"
                            placeholder="محمد أحمد"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11"
                          />
                          <UserPen className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        </div>
                        <ErrorMessage
                          name="fullName"
                          component="div"
                          className="text-sm text-red-600"
                        />
                      </div>

                      {/* رقم الهاتف */}
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-white"
                        >
                          رقم الهاتف
                        </label>
                        <div className="relative mt-1">
                          <Field
                            name="phone"
                            type="tel"
                            maxLength={11}
                            placeholder="01xxxxxxxxx"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11"
                          />
                          <PhoneCall className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        </div>
                        <ErrorMessage
                          name="phone"
                          component="div"
                          className="text-sm text-red-600"
                        />
                      </div>

                      {/* التخصص */}
                      <div>
                        <label
                          htmlFor="section"
                          className="block text-sm font-medium text-white"
                        >
                          التخصص
                        </label>
                        <div className="relative mt-1">
                          <Field
                            as="select"
                            name="section"
                            className="w-full text-black rounded-xl border border-gray-300 px-4 py-3 pr-11 bg-white"
                          >
                            <option className="text-black" value="" hidden>اختر التخصص</option>
                            <option className="text-black" value="مستخدم عادي">مستخدم عادي</option>
                            <option className="text-black" value="مهندس شبكات">مهندس شبكات</option>
                          </Field>
                          <Building className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        </div>
                        <ErrorMessage
                          name="section"
                          component="div"
                          className="text-sm text-red-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* --- الخطوة الثانية --- */}
                  {step === 1 && (
                    <div className="space-y-4">
                      {/* الإيميل */}
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-white"
                        >
                          البريد الإلكتروني
                        </label>
                        <div className="relative mt-1">
                          <Field
                            name="email"
                            type="email"
                            placeholder="example@gmail.com"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11"
                          />
                          <Mail className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        </div>
                        <ErrorMessage
                          name="email"
                          component="div"
                          className="text-sm text-red-600"
                        />
                      </div>

                      {/* كلمة المرور */}
                      <div>
                        <label
                          htmlFor="password"
                          className="block text-sm font-medium text-white"
                        >
                          كلمة المرور
                        </label>
                        <div className="relative mt-1">
                          <Field
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11"
                          />
                          <Key className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        </div>
                        <ErrorMessage
                          name="password"
                          component="div"
                          className="text-sm text-red-600"
                        />
                      </div>

                      {/* تأكيد كلمة المرور */}
                      <div>
                        <label
                          htmlFor="confirmPassword"
                          className="block text-sm font-medium text-white"
                        >
                          تأكيد كلمة المرور
                        </label>
                        <div className="relative mt-1">
                          <Field
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11"
                          />
                          <Key className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        </div>
                        <ErrorMessage
                          name="confirmPassword"
                          component="div"
                          className="text-sm text-red-600"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* أزرار التحكم */}
              <div className="flex gap-4 pt-4">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="w-full rounded-xl bg-gray-100 px-6 py-3 text-lg font-bold text-gray-600 hover:bg-gray-200 transition-all"
                  >
                    السابق
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 px-6 py-3 text-lg font-bold text-white hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-60"
                >
                  {isLoading
                    ? "جاري الإنشاء..."
                    : step === totalSteps - 1
                      ? "إنشاء الحساب"
                      : "التالي"}
                </button>
              </div>

              <p className="text-center text-sm text-gray-600">
                لديك حساب بالفعل؟{" "}
                <Link
                  href="/Login"
                  className="font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  تسجيل الدخول
                </Link>
              </p>
            </Form>
          )}
        </Formik>
      </motion.div>
    </div>
  );
}
