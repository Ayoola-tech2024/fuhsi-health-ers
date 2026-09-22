import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — blocks access to routes based on auth state and optional role.
 *
 * Props:
 *   children  — the page component to render if access is granted
 *   roles     — optional array of allowed user roles e.g. ['responder', 'admin']
 *               if omitted, any authenticated user is allowed
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user } = useAuth();

  // While auth is being resolved (e.g. token verification on load), show a spinner.
  // This prevents a flash-redirect to /login for users who ARE logged in.
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D2040] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
          <p className="text-slate-400 text-xs font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role → show access denied screen
  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    return (
      <div className="min-h-screen bg-[#0D2040] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-none stroke-current stroke-2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>
        <h1 className="text-lg font-bold mb-2">Access Restricted</h1>
        <p className="text-xs text-slate-400 max-w-xs mb-6">
          Your account role <span className="text-white font-semibold">({user?.role || 'unknown'})</span> does not have permission to view this page.
        </p>
        <a
          href="/"
          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors border border-white/20"
        >
          Return to Home
        </a>
      </div>
    );
  }

  // All checks passed — render the page
  return children;
}
