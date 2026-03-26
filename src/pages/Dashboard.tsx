import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Eye, MousePointerClick, Share2, ArrowRight, Moon, Sun, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  const stats = [
    { name: t('dash.visits'), value: '12', icon: Eye, change: '+2.5%', changeType: 'positive' },
    { name: t('dash.clicks'), value: '4', icon: MousePointerClick, change: '+1.2%', changeType: 'positive' },
    { name: t('dash.shares'), value: '8', icon: Share2, change: '+4.1%', changeType: 'positive' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto dark:bg-zinc-950 min-h-full transition-colors duration-300">
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white transition-colors">
            {t('dash.greeting', { name: user?.displayName?.split(' ')[0] || 'Usuario' })}
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400 transition-colors">
            {t('dash.subtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Selector de Idioma */}
          <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 shadow-sm transition-colors">
            <Globe className="w-4 h-4 text-zinc-500 ml-2" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent border-none text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:ring-0 cursor-pointer py-1 pr-8 pl-2 outline-none"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
              <option value="fr">Français</option>
            </select>
          </div>

          {/* Selector de Tema */}
          <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-1 shadow-sm transition-colors">
            <button
              onClick={() => toggleTheme('light')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                theme === 'light' 
                  ? 'bg-zinc-100 text-zinc-900 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Sun className="w-4 h-4" />
              {t('dash.light')}
            </button>
            <button
              onClick={() => toggleTheme('dark')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                theme === 'dark' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Moon className="w-4 h-4" />
              {t('dash.dark')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="bg-white dark:bg-zinc-900 overflow-hidden rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 transition-colors">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 truncate transition-colors">{item.name}</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-zinc-900 dark:text-white transition-colors">{item.value}</div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-emerald-600 dark:text-emerald-400 transition-colors">
                          {item.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-900/50 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
        <div>
          <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 transition-colors">{t('dash.ready')}</h2>
          <p className="mt-2 text-indigo-700 dark:text-indigo-400/80 max-w-xl transition-colors">
            {t('dash.readyDesc')}
          </p>
        </div>
        <Link 
          to="/studio"
          className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors whitespace-nowrap"
        >
          {t('dash.goStudio')}
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
};
