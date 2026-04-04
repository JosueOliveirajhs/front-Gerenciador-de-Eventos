import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login/Login';
import { Owner } from './pages/Owner/Owner';
import { Client } from './pages/Client/Client';
import { Developer } from './pages/Developer/Developer';
import { ForgotPasswordPage } from './pages/Password/Forgot/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/Password/Reset/ResetPasswordPage';
import { LoadingSpinner as Loading } from './components/common/Loading/LoadingSpinner';

// Componente de rota protegida
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

// Componente que redireciona baseado no tipo de usuário
const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  // Se a role não existir (null/undefined), assumimos que é um CLIENT
  const role = user.role;

  // 1. Verificação prioritária: Se não tem role, é Cliente.
  if (!role) {
    return <Navigate to="/client/dashboard" replace />;
  }

  // 2. Switch para os demais casos que possuem Role
  switch (role) {
    case 'ADMIN':
    case 'OWNER':
    case 'DIRECTOR':
    case 'MANAGER':
    case 'ANALYST':
      return <Navigate to="/owner/dashboard" replace />;
      
    case 'DEVELOPER':
      return <Navigate to="/developer/organizations" replace />;
      
      
    default:
      console.error("❌ Role não reconhecida:", role);
      // Fallback para cliente em caso de qualquer dúvida
      return <Navigate to="/client/dashboard" replace />;
  }
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      {/* Rotas públicas - só acessíveis se não estiver logado */}
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
      
      {/* Rotas protegidas */}
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
      
      {/* Rota raiz */}
      <Route path="/" element={<RootRedirect />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;