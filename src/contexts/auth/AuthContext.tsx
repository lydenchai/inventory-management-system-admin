// @ts-nocheck
import React, { useState, useEffect } from "react";
import { AuthContextBase } from "./AuthContextBase";
import { logout as logoutApi } from "../../api/auth-services";
import { getProfile } from "../../api";

export const AuthProvider = ({ children }) => {
  // Initialize user state from localStorage
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("_u");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem("_u");
      return null;
    }
  });

  // Fetch profile from backend and update user state
  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      if (res.data && res.data.success && res.data.data) {
        setUser(res.data.data);
        localStorage.setItem("_u", JSON.stringify(res.data.data));
      }
    } catch (err) {
      // Logout if error is 401 Unauthorized or 403 Forbidden
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setUser(null);
        localStorage.removeItem("_u");
        localStorage.removeItem("_t");
        localStorage.removeItem("_r");
        sessionStorage.clear();
      } else {
        // Optionally, you can log the error or show a notification
        console.error("Profile fetch error", err);
      }
    }
  };

  // Accepts optional callback to run after user is set
  const login = (userObj, cb) => {
    setUser(userObj);
    if (cb) cb();
    // Always fetch latest profile after login
    fetchProfile();
  };

  // Logout function
  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error("Logout API error", err);
    }

    // Clear all local/session storage for auth
    setUser(null);
    localStorage.removeItem("_t");
    localStorage.removeItem("_r");
    localStorage.removeItem("_u");
    sessionStorage.clear();
  };

  useEffect(() => {
    const token = localStorage.getItem("_t");
    if (token) {
      Promise.resolve().then(() => {
        fetchProfile();
      });
    }
  }, []);

  return (
    <AuthContextBase.Provider
      value={{ user, login, logout, refreshProfile: fetchProfile }}
    >
      {children}
    </AuthContextBase.Provider>
  );
};

