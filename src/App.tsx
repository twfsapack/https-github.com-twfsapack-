import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Studio } from './pages/Studio';
import { Profile } from './pages/Profile';
import { Experience } from './pages/Experience';
import { PublicCV } from './pages/PublicCV';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="experience" element={<Experience />} />
            <Route path="studio" element={<Studio />} />
            <Route path="share" element={<div className="p-8">Compartir (En construcción)</div>} />
          </Route>
          
          {/* Public Route for CV */}
          <Route path="/cv/:userId" element={<PublicCV />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
