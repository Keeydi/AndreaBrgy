import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Report from './pages/Report';
import MyReports from './pages/MyReports';
import Chatbot from './pages/Chatbot';
import ManageReports from './pages/ManageReports';
import CreateAlert from './pages/CreateAlert';
import UserManagement from './pages/UserManagement';
import SystemLogs from './pages/SystemLogs';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}

// Public Route Component (redirect if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected Routes - All Users */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/alerts" 
        element={
          <ProtectedRoute>
            <Alerts />
          </ProtectedRoute>
        } 
      />

      {/* Resident Routes */}
      <Route 
        path="/report" 
        element={
          <ProtectedRoute>
            <Report />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-reports" 
        element={
          <ProtectedRoute>
            <MyReports />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chatbot" 
        element={
          <ProtectedRoute>
            <Chatbot />
          </ProtectedRoute>
        } 
      />

      {/* Official & Admin Routes */}
      <Route 
        path="/manage-reports" 
        element={
          <ProtectedRoute allowedRoles={['official', 'admin']}>
            <ManageReports />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/create-alert" 
        element={
          <ProtectedRoute allowedRoles={['official', 'admin']}>
            <CreateAlert />
          </ProtectedRoute>
        } 
      />

      {/* Admin Only Routes */}
      <Route 
        path="/users" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/logs" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SystemLogs />
          </ProtectedRoute>
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster 
            position="top-center" 
            richColors 
            closeButton
            toastOptions={{
              className: 'font-sans',
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
