import React, { useState } from 'react';
import dosLineas from '../assets/dosLineas';
import XLogo from '../assets/X';
import UsuarioIcon from '../assets/usario';
import AñadirIcon from '../assets/añadir';
import RegistrosIcon from '../assets/registros';
import HistorialIcon from '../assets/historial';
import NotificationIcon from '../assets/notification';

const menuOptions = [
  { label: 'Nueva Hoja de Ruta', icon: AñadirIcon, path: '/nueva-hoja' },
  { label: 'Registros', icon: RegistrosIcon, path: '/registros' },
  { label: 'Historial', icon: HistorialIcon, path: '/historial' },
  { label: 'Tareas', icon: NotificationIcon, path: '/tareas' },
  { label: 'Notificaciones', icon: NotificationIcon, path: '/notificaciones' },
];

const DashboardLayout: React.FC<{ user: any; onLogout: () => void; children?: React.ReactNode }> = ({ user, onLogout, children }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-white">
      {/* Menú lateral animado */}
      <aside className={`relative transition-all duration-300 bg-white border-r border-esmeralda-100 ${menuOpen ? 'w-56' : 'w-16'} flex flex-col z-20`}>
        {/* Opciones de menú grandes */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          {menuOptions.map(opt => (
            <a key={opt.label} href={opt.path} className="flex flex-col items-center group">
              <opt.icon width={38} height={38} fill="var(--color-esmeralda-600)" className="transition-transform group-hover:scale-110" />
              {menuOpen && <span className="mt-2 text-esmeralda-700 font-bold text-base whitespace-nowrap">{opt.label}</span>}
            </a>
          ))}
        </div>
        {/* Botón hamburguesa/X alineado a la derecha del menú */}
        <button
          className="absolute top-4 right-4 z-30 flex flex-col justify-center items-center w-8 h-8 group"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <span className={`block w-7 h-1 rounded transition-all duration-300 bg-punzo-600 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block w-7 h-1 rounded mt-1 transition-all duration-300 bg-punzo-600 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </aside>
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-esmeralda-100 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-esmeralda-700">SEDEGES La Paz</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-esmeralda-700 font-semibold">
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span>{new Date().toLocaleDateString()}</span>
            <span className="flex items-center gap-2"><UsuarioIcon width={20} height={20} fill="var(--color-esmeralda-600)" /> {user?.nombre_completo || 'Usuario'}</span>
            <button className="px-3 py-1 rounded bg-punzo-600 text-white font-bold hover:bg-punzo-700 transition-all" onClick={onLogout}>Cerrar sesión</button>
          </div>
        </header>
        {/* Zona central (contenido) */}
        <main className="flex-1 flex flex-col bg-esmeralda-50 min-h-screen">
          <div className="flex-1 flex flex-col items-center justify-start w-full max-w-6xl mx-auto py-8">
            {children}
          </div>
        </main>
        {/* Notificaciones/alertas */}
        <section className="h-24 flex items-center justify-center bg-esmeralda-50 border-t border-esmeralda-100">
          <span className="text-punzo-700 font-semibold">Notificaciones / alertas</span>
        </section>
        {/* Footer */}
        <footer className="h-12 flex items-center justify-center bg-white border-t border-esmeralda-100 text-xs text-esmeralda-700 font-semibold">
          Sistema SEDEGES La Paz &copy; 2025
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
