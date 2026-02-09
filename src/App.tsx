import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './pages/Login';
import { Owner } from './pages/Owner';
import { Client } from './pages/Client';
import { Loading } from './components/common/Loading';
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
      <Route 
        path="/login" 
        element={
          user ? <Navigate to="/" replace /> : <Login />
        } 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            {user?.userType === 'OWNER' ? <Owner /> : <Client />}
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