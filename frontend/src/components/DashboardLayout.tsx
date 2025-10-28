import React, { useState } from 'react';
import UsuarioIcon from '../assets/usario';
import AñadirLogo from '../assets/añadir';
import RegistrosLogo from '../assets/registros';
import HistorialLogo from '../assets/historial';
import NotificationLogo from '../assets/notification';
import SedegesLogo from './SedegesLogo';
import CerrarLogo from '../assets/cerrar';

const menuOptions = [
  { label: 'Nueva Hoja de Ruta', icon: AñadirLogo, path: '/nueva-hoja' },
  { label: 'Registros', icon: RegistrosLogo, path: '/registros' },
  { label: 'Historial', icon: HistorialLogo, path: '/historial' },
  { label: 'Tareas', icon: NotificationLogo, path: '/tareas' },
  { label: 'Notificaciones', icon: NotificationLogo, path: '/notificaciones' },
];

const DashboardLayout: React.FC<{ user: any; onLogout: () => void; children?: React.ReactNode }> = ({ user, onLogout, children }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
  <div className="min-h-screen flex bg-linear-to-br from-black via-[#006837] to-[#b71c1c]" style={{background: 'linear-gradient(135deg, #000 0%, #006837 40%, #b71c1c 100%)'}}>
      {/* Menú lateral elegante */}
      <aside className={`relative transition-all duration-500 bg-white/30 backdrop-blur-xl border-r border-black/20 shadow-2xl ${menuOpen ? 'w-64' : 'w-20'} flex flex-col z-20 py-6 px-2`}
        style={{ minWidth: menuOpen ? 256 : 80, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
        {/* Botón hamburguesa/X alineado arriba */}
        <button
          className="absolute top-4 right-3 z-30 flex flex-col justify-center items-center w-10 h-10 group"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <span className={`block w-8 h-1.5 rounded transition-all duration-300 bg-punzo-600 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block w-8 h-1.5 rounded mt-2 transition-all duration-300 bg-punzo-600 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
        {/* Opciones de menú alineadas arriba, iconos outline sobrios */}
        <nav className="flex-1 flex flex-col items-center gap-8 mt-14 animate-fade-in">
          {menuOptions.map(opt => (
            <a key={opt.label} href={opt.path} className="flex flex-col items-center group transition-all">
              <opt.icon width={44} height={44} fill="#fff" className="transition-transform group-hover:scale-110 drop-shadow-lg" />
              {menuOpen && <span className="mt-3 text-black font-bold text-lg whitespace-nowrap transition-all group-hover:text-[#b71c1c] drop-shadow">{opt.label}</span>}
            </a>
          ))}
        </nav>
      </aside>
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-28 flex items-center justify-between px-10 bg-linear-to-r from-black via-[#006837] to-[#b71c1c] border-b border-black/20 shadow-2xl animate-fade-in-down">
          {/* Logo y La Paz */}
          <div className="flex flex-col items-center gap-1">
            <SedegesLogo width={80} height={80} />
            <span className="text-lg font-extrabold text-white drop-shadow">La Paz</span>
          </div>
          {/* Fecha, usuario y cerrar */}
          <div className="flex items-center gap-12">
            <span className="text-2xl text-white font-extrabold drop-shadow">{new Date().toLocaleDateString()}</span>
            <div className="flex flex-col items-center">
              <UsuarioIcon width={32} height={32} fill="#1976d2" />
              <span className="text-lg font-extrabold text-white mt-1 drop-shadow">{user?.nombre_completo || 'Usuario'}</span>
              <span className="text-sm text-gray-200">{user?.rol || 'Rol'}</span>
            </div>
            <button className="ml-4 p-3 rounded-full bg-[#b71c1c] hover:bg-black transition-all flex items-center justify-center shadow-xl" onClick={onLogout} title="Cerrar sesión">
              <CerrarLogo width={32} height={32} fill="#fff" />
            </button>
          </div>
        </header>
        {/* Zona central (contenido) */}
        <main className="flex-1 flex flex-col min-h-screen bg-transparent animate-fade-in-up">
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto py-2">
            {children}
          </div>
        </main>
        {/* Footer institucional */}
        <footer className="h-14 flex items-center justify-center bg-black/95 border-t border-black/20 text-base text-white font-extrabold shadow-inner animate-fade-in-up tracking-wider">
          Sistema SEDEGES La Paz &copy; 2025
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
