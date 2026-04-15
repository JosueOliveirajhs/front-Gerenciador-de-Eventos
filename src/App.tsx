// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Login } from './pages/Login/Login';
import { Owner } from './pages/Owner/Owner';
import { Client } from './pages/Client/Client';
import { Developer } from './pages/Developer/Developer';
import { ForgotPasswordPage } from './pages/Password/Forgot/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/Password/Reset/ResetPasswordPage';
import { LoadingSpinner as Loading } from './components/common/Loading/LoadingSpinner';
import './index.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  switch (user.userType) {
    case 'OWNER':
      return <Navigate to="/owner/dashboard" replace />;
    case 'DEVELOPER':
      return <Navigate to="/developer/organizations" replace />;
    case 'CLIENT':
      return <Navigate to="/client/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route 
        path="/esqueci-senha" 
        element={user ? <Navigate to="/" replace /> : <ForgotPasswordPage />}
      />
      <Route 
        path="/resetar-senha" 
        element={user ? <Navigate to="/" replace /> : <ResetPasswordPage />}
      />
      
      <Route 
        path="/owner/*" 
        element={
          <ProtectedRoute>
            <Owner />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/developer/*" 
        element={
          <ProtectedRoute>
            <Developer />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/client/*" 
        element={
          <ProtectedRoute>
            <Client />
          </ProtectedRoute>
        } 
      />
      
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;