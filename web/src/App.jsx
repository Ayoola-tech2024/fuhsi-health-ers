import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import InstallPrompt from './components/InstallPrompt';
import ProtectedRoute from './components/ProtectedRoute';

import SOSPage from './pages/SOSPage';
import StudentProfilePage from './pages/StudentProfilePage';
import ResponderDashboardPage from './pages/ResponderDashboardPage';
import ClinicianPortalPage from './pages/ClinicianPortalPage';
import FacilitiesPage from './pages/FacilitiesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-red-600 selection:text-white">
      <Navbar />

      <main className="flex-1">
        <Routes>
          {/* Public routes — accessible to everyone */}
          <Route path="/" element={<SOSPage />} />
          <Route path="/facilities" element={<FacilitiesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected: any logged-in user */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <StudentProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Protected: responder or admin role only */}
          <Route
            path="/responder"
            element={
              <ProtectedRoute roles={['responder', 'admin']}>
                <ResponderDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Protected: clinician or admin role only */}
          <Route
            path="/clinician"
            element={
              <ProtectedRoute roles={['clinician', 'admin']}>
                <ClinicianPortalPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <InstallPrompt />
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
