import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  clearToken,
  getCurrentUser,
  getStoredToken,
  loginUser,
  logoutUser,
  registerUser,
  storeToken,
} from '@/lib/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());

  useEffect(() => {
    const savedToken = getStoredToken();
    if (!savedToken) {
      setUser(false);
      return;
    }
    getCurrentUser()
      .then(data => {
        setUser(data);
        setToken(savedToken);
      })
      .catch(() => {
        setUser(false);
        setToken(null);
        clearToken();
      });
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await loginUser({ email, password });
    const newToken = data.token;
    storeToken(newToken);
    setToken(newToken);
    setUser({ id: data.id, email: data.email, name: data.name });
    return data;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const data = await registerUser({ email, password, name });
    const newToken = data.token;
    storeToken(newToken);
    setToken(newToken);
    setUser({ id: data.id, email: data.email, name: data.name });
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await logoutUser();
      }
    } catch {}
    clearToken();
    setToken(null);
    setUser(false);
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
