// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './pages/Login';
import { Owner } from './pages/Owner';
import { Client } from './pages/Client';
import { Developer } from './pages/Developer'; // Import do Developer
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { LoadingSpinner as Loading } from './components/common/LoadingSpinner';
import styles from './App.module.css';

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loading />
      </div>
    );
  }

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route 
        path="/login" 
        element={
          user ? <Navigate to="/" replace /> : <Login />
        } 
      />
      
      <Route 
        path="/esqueci-senha" 
        element={
          user ? <Navigate to="/" replace /> : <ForgotPasswordPage />
        } 
      />
      
      <Route 
        path="/resetar-senha" 
        element={
          user ? <Navigate to="/" replace /> : <ResetPasswordPage />
        } 
      />
      
      {/* Rota protegida principal */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            {user?.userType === 'DEVELOPER' && <Developer />}
            {user?.userType === 'OWNER' && <Owner />}
            {user?.userType === 'CLIENT' && <Client />}
            {!['DEVELOPER', 'OWNER', 'CLIENT'].includes(user?.userType) && <Navigate to="/login" />}
          </ProtectedRoute>
        } 
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className={styles.app}>
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;