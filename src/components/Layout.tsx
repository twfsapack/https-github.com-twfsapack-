import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LayoutDashboard, UserCircle, Briefcase, Wand2, Share2, LogOut } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Layout: React.FC = () => {
  const { logout, user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { name: t('nav.home'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.profile'), path: '/profile', icon: UserCircle },
    { name: t('nav.experience'), path: '/experience', icon: Briefcase },
    { name: t('nav.studio'), path: '/studio', icon: Wand2 },
    { name: t('nav.share'), path: '/share', icon: Share2 },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-colors duration-300">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2 transition-colors">
            <Wand2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
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
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" 
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 transition-colors">
          <div className="flex items-center gap-3 px-3 py-2 mb-4">
            <img 
              src={user?.photoURL || 'https://ui-avatars.com/api/?name=User'} 
              alt="User avatar" 
              className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate transition-colors">
                {user?.displayName || 'Usuario'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <LogOut className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
        <Outlet />
      </main>
    </div>
  );
};
