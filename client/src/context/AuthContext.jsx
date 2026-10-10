import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pulseguard_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('pulseguard_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('pulseguard_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('pulseguard_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session expired or invalid token');
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('pulseguard_token', receivedToken);
    localStorage.setItem('pulseguard_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const register = async (email, password, companyName) => {
    const res = await api.post('/auth/register', { email, password, companyName });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('pulseguard_token', receivedToken);
    localStorage.setItem('pulseguard_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  // Demo auto-login for testing without manual form filling
  const demoLogin = async () => {
    try {
      return await login('demo@pulseguard.io', 'DemoPass123!');
    } catch {
      // If demo user does not exist yet, register it automatically
      return await register('demo@pulseguard.io', 'DemoPass123!', 'Acme Corp');
    }
  };

  const logout = () => {
    localStorage.removeItem('pulseguard_token');
    localStorage.removeItem('pulseguard_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
