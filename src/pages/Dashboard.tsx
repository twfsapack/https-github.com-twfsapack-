import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, MousePointerClick, Share2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    { name: 'Visitas al Perfil', value: '12', icon: Eye, change: '+2.5%', changeType: 'positive' },
    { name: 'Clics en Contacto', value: '4', icon: MousePointerClick, change: '+1.2%', changeType: 'positive' },
    { name: 'Veces Compartido', value: '8', icon: Share2, change: '+4.1%', changeType: 'positive' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Hola, {user?.displayName?.split(' ')[0] || 'Usuario'} 👋
        </h1>
        <p className="mt-2 text-zinc-600">
          Aquí tienes un resumen del impacto de tu tarjeta digital.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="bg-white overflow-hidden rounded-2xl shadow-sm border border-zinc-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-zinc-400" aria-hidden="true" />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-zinc-500 truncate">{item.name}</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-zinc-900">{item.value}</div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-emerald-600">
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

      <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-indigo-900">¿Listo para destacar?</h2>
          <p className="mt-2 text-indigo-700 max-w-xl">
            Usa Nano Banana en el Estudio Mágico para generar un diseño único para tu tarjeta de presentación en segundos.
          </p>
        </div>
        <Link 
          to="/studio"
          className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          Ir al Estudio Mágico
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
};
