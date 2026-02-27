"use client";
import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";
import { NotifiyErorr, NotifiyInfo } from "../components/Notify";
import { useRouter } from "next/navigation";

export const AuthProvider = createContext();
export const AuthContext = ({ children }) => {
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter()
  
  const getMe = async () => {
    try {
      setLoading(true);
      const res = await API.get("/auth/checkMe");
      setUser(res.data.user);
      setLoggedIn(true)
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getMe();
  }, []);


const logOut = async () =>{
  try {
    await API.post("/auth/logout")
    NotifiyInfo("LogOut successfully!")
    setLoggedIn(false)
    router.push("/Login")
  } catch (error) {
      NotifiyErorr(error)
  }finally{
    setUser(null)
  }
}
  return (
    <AuthProvider.Provider
      value={{ user, setUser, loading, logOut, getMe, isLoggedIn, setLoggedIn }}
    >
      {children}
    </AuthProvider.Provider>
  );
};

export const useAuth = () => useContext(AuthProvider);
