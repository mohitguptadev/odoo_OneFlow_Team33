import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await api.get("/auth/me");
      if (response.data && response.data.user) {
        setUser(response.data.user);
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
        storage.setItem("user", JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // Don't logout immediately - let the user see the page
      // The 401 interceptor will handle redirect
    }
  }, []);

  useEffect(() => {
    // Check both localStorage (remember me) and sessionStorage
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Verify token is still valid in background (don't block rendering)
        checkAuth().catch(() => {
          // If auth check fails, user will be logged out
        });
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      }
    } else {
      // No token/user found, ensure loading is set to false
      setLoading(false);
    }
    
    // Set loading to false after a short delay to allow user data to load
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [checkAuth]);


  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await api.post("/auth/login", { email, password, remember_me: rememberMe });
      const { token, user } = response.data;

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("token", token);
      storage.setItem("user", JSON.stringify(user));
      setUser(user);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Registering user with data:', { ...userData, security_answer: '***' });
      const response = await api.post("/auth/register", userData);
      const { token, user } = response.data;

      // Use localStorage for new registrations (treat as remember me)
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const hasRole = (roles) => {
    if (!user) return false;
    return Array.isArray(roles)
      ? roles.includes(user.role)
      : user.role === roles;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    hasRole,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
