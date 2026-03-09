import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin,    setAdmin]    = useState(null);
  const [loading,  setLoading]  = useState(true);  // checking token on startup

  // ── On app load: verify saved token ────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("ag_token");
    if (!token) { setLoading(false); return; }

    authAPI.me()
      .then((res) => setAdmin(res.data.admin))
      .catch(()   => {
        localStorage.removeItem("ag_token");
        localStorage.removeItem("ag_admin");
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Login: save token + admin ───────────────────────────────────────────────
  const loginSuccess = (token, adminData) => {
    localStorage.setItem("ag_token", token);
    localStorage.setItem("ag_admin", JSON.stringify(adminData));
    setAdmin(adminData);
  };

  // ── Logout: clear everything ────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("ag_token");
    localStorage.removeItem("ag_admin");
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, loginSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
