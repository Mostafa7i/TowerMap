"use client"
import "./globals.css";
import NavBar from "./components/NavBar";
import { ToastContainer } from "react-toastify";
import { AuthContext } from "./context/AuthContext";
import { useEffect, useState } from "react";
import SplashScreen from "./components/SplashScreen";

export default function RootLayout({ children }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // خلي الشاشة تظهر لمدة ثانيتين مثلاً
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);
  return (
    <html lang="en">
      <body className={`bg-gray-300 antialiased`}>
        {showSplash ? (
          <SplashScreen />
        ) : (
          <AuthContext>
            <NavBar />
            <main className="">{children}</main>
            <ToastContainer />
          </AuthContext>
        )}
      </body>
    </html>
  );
}
