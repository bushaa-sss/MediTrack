// Auth context for managing doctor sessions.
import { createContext, useEffect, useMemo, useState } from 'react';
import { clearFcmToken, fetchMe, loginDoctor, registerDoctor } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [doctor, setDoctor] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchMe();
        setDoctor(data.doctor);
      } catch (err) {
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, [token]);

  const login = async (payload) => {
    const data = await loginDoctor(payload);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setDoctor(data.doctor);
    return data;
  };

  const register = async (payload) => {
    const data = await registerDoctor(payload);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setDoctor(data.doctor);
    return data;
  };

  const logout = async () => {
    if (localStorage.getItem('token')) {
      try {
        await clearFcmToken();
      } catch (err) {
        // Ignore logout cleanup errors.
      }
    }

    localStorage.removeItem('token');
    setToken(null);
    setDoctor(null);
  };

  const value = useMemo(
    () => ({ doctor, token, login, register, logout, loading }),
    [doctor, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
