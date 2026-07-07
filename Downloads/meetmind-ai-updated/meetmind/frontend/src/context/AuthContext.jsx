import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../api/endpoints";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("meetmind_token");
    const cachedUser = localStorage.getItem("meetmind_user");

    if (!token) {
      setLoading(false);
      return;
    }

    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch {
        // ignore
      }
    }

    authApi
      .me()
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("meetmind_user", JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem("meetmind_token");
        localStorage.removeItem("meetmind_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signin = useCallback(async (email, password) => {
    const res = await authApi.signin({ email, password });
    localStorage.setItem("meetmind_token", res.data.token);
    localStorage.setItem("meetmind_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const googleSignin = useCallback(async (credential) => {
    const res = await authApi.google(credential);
    localStorage.setItem("meetmind_token", res.data.token);
    localStorage.setItem("meetmind_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const signup = useCallback(async (name, email, password, confirmPassword) => {
    const res = await authApi.signup({
      name,
      email,
      password,
      confirm_password: confirmPassword,
    });
    localStorage.setItem("meetmind_token", res.data.token);
    localStorage.setItem("meetmind_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("meetmind_token");
    localStorage.removeItem("meetmind_user");
    setUser(null);
    authApi.logout().catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signin, signup, googleSignin, logout }}>   {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
