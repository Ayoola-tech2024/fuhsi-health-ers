import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('fuhsi_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getMe();
        if (data && data.user) {
          setUser(data.user);
          localStorage.setItem('fuhsi_user_data', JSON.stringify(data.user));
        } else {
          // Token is invalid/expired
          localStorage.removeItem('fuhsi_token');
          localStorage.removeItem('fuhsi_user_data');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem('fuhsi_token');
          localStorage.removeItem('fuhsi_user_data');
          setToken(null);
          setUser(null);
        } else {
          // Network glitch or cold start: restore cached user temporarily
          const savedUser = localStorage.getItem('fuhsi_user_data');
          if (savedUser) {
            try { setUser(JSON.parse(savedUser)); } catch (e) {}
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    if (!data.token || !data.user) {
      throw new Error(data.message || 'Login failed');
    }
    localStorage.setItem('fuhsi_token', data.token);
    localStorage.setItem('fuhsi_user_data', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const loginAsDemo = async (role = 'student') => {
    // Attempt real login against seeded database demo accounts
    const credentials = {
      student: { email: 'student@fuhsi.edu.ng', password: 'password123' },
      clinician: { email: 'doctor@fuhsi.edu.ng', password: 'password123' },
      responder: { email: 'responder@fuhsi.edu.ng', password: 'password123' },
    };
    const cred = credentials[role] || credentials.student;
    return await login(cred.email, cred.password);
  };

  const register = async (payload) => {
    const data = await api.register(payload);
    if (!data.token || !data.user) {
      throw new Error(data.message || 'Registration failed');
    }
    localStorage.setItem('fuhsi_token', data.token);
    localStorage.setItem('fuhsi_user_data', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('fuhsi_token');
    localStorage.removeItem('fuhsi_user_data');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        role: user?.role || null,
        isAuthenticated: !!user,
        login,
        loginAsDemo,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
