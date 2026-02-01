"use client";
import { createContext, useContext, useEffect, useState } from "react";

export const AuthProvider = createContext();
export const AuthContext = ({ children }) => {
  const [isLoggedIn, setLoggerdIn] = useState(false);

//   useEffect(() => {
//     if (true) {
//       setLoggerdIn(true);
//     }
//   }, [isLoggedIn]);
  return (
    <AuthProvider.Provider value={{ isLoggedIn, setLoggerdIn }}>
      {children}
    </AuthProvider.Provider>
  );
};

export const useAuth = () => useContext(AuthProvider);
