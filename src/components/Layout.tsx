import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, UserCircle, Briefcase, Wand2, Share2, LogOut } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Layout: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Inicio', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Mi Perfil', path: '/profile', icon: UserCircle },
    { name: 'Trayectoria', path: '/experience', icon: Briefcase },
    { name: 'Estudio Mágico', path: '/studio', icon: Wand2 },
    { name: 'Compartir', path: '/share', icon: Share2 },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col">
        <div className="p-6 border-b border-zinc-200">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-indigo-600" />
            Digital Card Pro
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-zinc-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200">
          <div className="flex items-center gap-3 px-3 py-2 mb-4">
            <img 
              src={user?.photoURL || 'https://ui-avatars.com/api/?name=User'} 
              alt="User avatar" 
              className="w-8 h-8 rounded-full bg-zinc-200"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">
                {user?.displayName || 'Usuario'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          >
            <LogOut className="w-5 h-5 text-zinc-400" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
