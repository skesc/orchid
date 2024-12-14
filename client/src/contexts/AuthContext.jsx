import * as React from "react";
import { apiFetch } from "../utils/fetchConfig";

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const checkAuth = React.useCallback(async () => {
    try {
      const data = await apiFetch("/api/auth/user");
      setUser(data.authenticated ? data.user : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = React.useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout");
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      loading,
      checkAuth,
      logout,
    }),
    [user, loading, checkAuth, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
