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
import { Portfolio } from './pages/Portfolio';
import { PublicCard } from './pages/PublicCard';
import { Share } from './pages/Share';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

export default function App() {
  React.useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

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
            <Route path="share" element={<Share />} />
          </Route>
          
          {/* Public Routes */}
          <Route path="/cv/:userId" element={<PublicCV />} />
          <Route path="/portfolio/:userId" element={<Portfolio />} />
          <Route path="/card/:userId" element={<PublicCard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
