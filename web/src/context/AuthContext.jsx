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
        setUser(data.user);
      } catch (err) {
        console.error('Failed to load session user', err);
        // If token invalid, clear
        logout();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('fuhsi_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const loginAsDemo = (role = 'student') => {
    const demoUsers = {
      student: {
        id: 'demo-student-001',
        full_name: 'Adewale Bakare',
        email: 'student@fuhsi.edu.ng',
        role: 'student',
        matric_number: 'FUHSI/2023/MBBS/0142',
        phone: '+234 803 123 4567',
      },
      clinician: {
        id: 'demo-doc-002',
        full_name: 'Dr. Fatima Olamide',
        email: 'doctor@fuhsi.edu.ng',
        role: 'clinician',
        staff_id: 'DOC-FUHSI-088',
        phone: '+234 802 987 6543',
      },
      responder: {
        id: 'demo-resp-003',
        full_name: 'Officer John Musa',
        email: 'responder@fuhsi.edu.ng',
        role: 'responder',
        staff_id: 'EMS-FUHSI-012',
        phone: '+234 814 555 0199',
      },
    };

    const demoUser = demoUsers[role] || demoUsers.student;
    const dummyToken = `demo_jwt_${role}_${Date.now()}`;
    localStorage.setItem('fuhsi_token', dummyToken);
    setToken(dummyToken);
    setUser(demoUser);
    return demoUser;
  };

  const register = async (payload) => {
    const data = await api.register(payload);
    localStorage.setItem('fuhsi_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('fuhsi_token');
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
