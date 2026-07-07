import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await authAPI.login({ username, password });
    const { token, role, fullName } = res.data.data;
    localStorage.setItem('token', token);
    const u = { username, role, fullName };
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => { localStorage.clear(); setUser(null); };

  // Simple permission helper
  const can = action => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'ANALYST' && ['upload','reconcile','view'].includes(action)) return true;
    if (user.role === 'VIEWER'  && action === 'view') return true;
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, can, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
