import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("gullak_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("gullak_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) localStorage.setItem("gullak_token", token);
    else localStorage.removeItem("gullak_token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("gullak_user", JSON.stringify(user));
    else localStorage.removeItem("gullak_user");
  }, [user]);

  async function completeAuth(action, payload) {
    setLoading(true);
    try {
      const data = action === "login" ? await authApi.login(payload) : await authApi.register(payload);
      setToken(data.access_token);
      setUser({ user_id: data.user_id, name: data.name, username: data.username });
      return data;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      login: (payload) => completeAuth("login", payload),
      register: (payload) => completeAuth("register", payload),
      logout
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
