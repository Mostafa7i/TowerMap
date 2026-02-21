"use client";

import { Building, Key, Mail, PhoneCall, UserPen } from "lucide-react";
import Link from "next/link";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { motion } from "framer-motion";
import API from "../services/api";
import { NotifiyErorr, NotifiySuccess } from "../components/Notify";
import { useRouter } from "next/navigation";

const registerSchema = Yup.object({
  fullName: Yup.string()
    .min(3, "الاسم قصير جدًا")
    .max(100, "الاسم طويل جدًا")
    .required("الاسم الكامل مطلوب"),

  email: Yup.string()
    .email("البريد الإلكتروني غير صحيح")
    .required("البريد الإلكتروني مطلوب"),

  phone: Yup.string()
    .matches(/^01[0125][0-9]{8}$/, "رقم الموبايل غير صحيح (11 رقم يبدأ بـ 01)")
    .required("رقم الهاتف مطلوب"),

  section: Yup.string().required("يرجى اختيار التخصص"),

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

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter()
  const handleSubmit = async (values, formikHelpers) => {
    const { setSubmitting, setFieldError } = formikHelpers;

    try {
      await API.post("/auth/register" , values)
      NotifiySuccess("Account Created!")
      setTimeout(() =>{
        router.push("/Login")
      } , 2000)
    } catch (error) {
      console.log(error)
      const data = error.response?.data;
      if(data?.details){
        data?.details.forEach(msg =>{
          const field = msg.split('"')[1]
          setFieldError(field , msg)
        })
        return ;
      }
      NotifiyErorr(data?.message || "حدث خطأ")
    }finally{
      setSubmitting(false)
    }

  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <motion.div
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full max-w-md overflow-hidden rounded-3xl shadow-2xl"
      >
        {/* Header */}
        <div className="bg-linear-to-r from-green-600 to-indigo-600 p-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-lime-500 to-indigo-500 md:text-2xl font-bold text-white animate-pulse shadow-lg">
            Tower
          </div>
          <h1 className="md:text-2xl font-bold text-white">إنشاء حساب جديد</h1>
          <p className="mt-2 text-indigo-100">انضم إلينا الآن وابدأ تجربتك</p>
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
          validationSchema={registerSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, touched }) => (
            <Form className="bg-white px-8 pb-10 pt-6 space-y-5" dir="rtl">
              {/* الاسم الكامل */}
              <div className="relative">
                <label
                  htmlFor="fullName"
                  className="block text-lg font-medium text-gray-700"
                >
                  الاسم الكامل
                </label>
                <div className="relative mt-1">
                  <Field
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="ادخل الاسم ثلاثي"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                  <UserPen className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                </div>
                <ErrorMessage
                  name="fullName"
                  component="div"
                  className="mt-1 text-sm text-red-600"
                />
              </div>

              {/* الإيميل */}
              <div className="relative">
                <label
                  htmlFor="email"
                  className="block text-lg font-medium text-gray-700"
                >
                  البريد الإلكتروني
                </label>
                <div className="relative mt-1">
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@gmail.com"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                  <Mail className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                </div>
                <ErrorMessage
                  name="email"
                  component="div"
                  className="mt-1 text-sm text-red-600"
                />
              </div>

              {/* رقم الهاتف */}
              <div className="relative">
                <label
                  htmlFor="phone"
                  className="block text-lg font-medium text-gray-700"
                >
                  رقم الهاتف
                </label>
                <div className="relative mt-1">
                  <Field
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    placeholder="01xxxxxxxxx"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11 text-right outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                  <PhoneCall className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                </div>
                <ErrorMessage
                  name="phone"
                  component="div"
                  className="mt-1 text-sm text-red-600"
                />
              </div>

              {/* التخصص */}
              <div className="relative">
                <label
                  htmlFor="section"
                  className="block text-lg font-medium text-gray-700"
                >
                  التخصص / النوع
                </label>
                <div className="relative mt-1">
                  <Field
                    as="select"
                    id="section"
                    name="section"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11 text-right outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="" disabled hidden>
                      اختر نوع الحساب
                    </option>
                    <option value="مستخدم عادي">مستخدم عادي</option>
                    <option value="مهندس سوفت وير">مهندس سوفت وير</option>
                    <option value="مهندس شبكات">مهندس شبكات</option>
                  </Field>
                  <Building className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                </div>
                <ErrorMessage
                  name="section"
                  component="div"
                  className="mt-1 text-sm text-red-600"
                />
              </div>

              {/* كلمة المرور */}
              <div className="relative">
                <label
                  htmlFor="password"
                  className="block text-lg font-medium text-gray-700"
                >
                  كلمة المرور
                </label>
                <div className="relative mt-1">
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                  <Key className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                </div>
                <ErrorMessage
                  name="password"
                  component="div"
                  className="mt-1 text-sm text-red-600"
                />
              </div>

              {/* تأكيد كلمة المرور */}
              <div className="relative">
                <label
                  htmlFor="confirmPassword"
                  className="block text-lg font-medium text-gray-700"
                >
                  تأكيد كلمة المرور
                </label>
                <div className="relative mt-1">
                  <Field
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                  <Key className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
                <ErrorMessage
                  name="confirmPassword"
                  component="div"
                  className="mt-1 text-sm text-red-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className={`
                  w-full rounded-xl bg-linear-to-r from-green-600 to-indigo-600 
                  px-6 py-3.5 text-xl font-bold text-white shadow-lg
                  hover:from-green-700 hover:to-indigo-700 
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
                  transition-all duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed
                `}
              >
                {isSubmitting || isLoading
                  ? "جاري إنشاء الحساب..."
                  : "إنشاء الحساب"}
              </button>

              <p className="text-center text-gray-600">
                لديك حساب بالفعل؟{" "}
                <Link
                  href="/Login"
                  className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
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
