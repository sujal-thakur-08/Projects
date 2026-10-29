import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userName, setUserName] = useState(() => {
    try {
      return localStorage.getItem("userName") || "";
    } catch (e) {
      return "";
    }
  });

  const [loginCount, setLoginCount] = useState(() => {
    try {
      const raw = localStorage.getItem("loginCount");
      const n = raw ? parseInt(raw, 10) : 0;
      return Number.isNaN(n) ? 0 : n;
    } catch (e) {
      return 0;
    }
  });

  // persist userName and loginCount to localStorage
  useEffect(() => {
    try {
      if (userName) localStorage.setItem("userName", userName);
      else localStorage.removeItem("userName");
    } catch (e) {
      // ignore storage errors
    }
  }, [userName]);

  useEffect(() => {
    try {
      localStorage.setItem("loginCount", String(loginCount));
    } catch (e) {
      // ignore
    }
  }, [loginCount]);

  // listen for changes from other tabs to keep counts and user in sync
  useEffect(() => {
    function onStorage(e) {
      if (!e) return;
      if (e.key === "loginCount") {
        try {
          const n = e.newValue ? parseInt(e.newValue, 10) : 0;
          if (!Number.isNaN(n)) setLoginCount(n);
        } catch (err) {}
      }
      if (e.key === "userName") {
        setUserName(e.newValue || "");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = (name) => {
    if (!name) return;
    setUserName((_) => {
      const trimmed = name.trim();
      // increment login count when a login is performed
      setLoginCount((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem("loginCount", String(next));
        } catch (e) {}
        return next;
      });
      try {
        localStorage.setItem("userName", trimmed);
      } catch (e) {}
      return trimmed;
    });
  };

  const logout = () => setUserName("");

  return (
    <AuthContext.Provider value={{ userName, login, logout, loginCount }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
