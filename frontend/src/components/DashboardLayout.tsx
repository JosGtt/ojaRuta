import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import UsuarioIcon from '../assets/usario';
import NotificationIcon from '../assets/notification';
import LupayIcon from '../assets/lupay';
import CerrarLogo from '../assets/cerrar';
import NuevaHojaRuta from './NuevaHojaRuta';
import RegistrosPage from '../pages/RegistrosPageClean';
import HistorialPage from '../pages/HistorialPage';
import NotificacionesPage from '../pages/NotificacionesPage';
import ModernDashboard from './ModernDashboard';
import HojaRutaDetalleView from './HojaRutaDetalleView';
import EnviarPageReestructurado from '../pages/EnviarPageReestructurado';
import GestionEnvios from '../pages/GestionEnvios';
import { useSearch } from '../contexts/SearchContext';
import { useAuth } from '../contexts/AuthContext';

const DashboardLayout: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarFixed, setSidebarFixed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('inicio');
  const [selectedHoja, setSelectedHoja] = useState<any>(null); // Estado para hoja seleccionada
  const { query, setQuery } = useSearch();
  const { logout } = useAuth();

  const expanded = menuOpen || sidebarFixed;

  // sidebar widths in pixels for tailwind w-64 (256) and w-28 (112)
  const sidebarWidth = expanded ? 256 : 112;

  // Listener para navegación desde HojaRutaDetalle
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      const { to } = event.detail;
      console.log('🎯 Evento de navegación recibido:', to);
      if (to === 'enviar') {
        setActiveSection('enviar');
        setSelectedHoja(null); // Limpiar hoja seleccionada
        console.log('✅ Navegado a sección enviar');
      }
    };

    window.addEventListener('navigate', handleNavigate as EventListener);
    
    return () => {
      window.removeEventListener('navigate', handleNavigate as EventListener);
    };
  }, []);

  // Función para cerrar sesión
  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  // Función para manejar cuando se selecciona una hoja desde registros
  const handleHojaSelected = (hoja: any) => {
    setSelectedHoja(hoja);
    setActiveSection('hoja-detalle');
  };

  // Función para volver a registros
  const handleBackToRegistros = () => {
    setSelectedHoja(null);
    setActiveSection('registros');
  };

  return (
  <div className="min-h-screen flex">
      {/* Menú lateral elegante (componente separado) */}
      <Sidebar
        expanded={menuOpen || sidebarFixed}
        onEnter={() => setMenuOpen(true)}
        onLeave={() => setMenuOpen(false)}
        fixed={sidebarFixed}
        onFixToggle={() => setSidebarFixed(v => !v)}
        onSelectSection={(id: string) => setActiveSection(id)}
        activeSection={activeSection}
      />
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: sidebarWidth }}>
  {/* Header */}
  <header className="h-28 shadow-none animate-fade-in-down" style={{
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
  }}>
    {/* central container matches main content width so header elements align with page content */}
    <div className="w-full max-w-6xl mx-auto px-4 h-full flex items-center">
    {/* left spacer removed — rely on normal layout so header and main content share the same centered container */}

      {/* Search bar centered */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full">
          <div className="relative">
            <div className="flex items-center rounded-2xl px-4 py-3 shadow-inner" style={{
              background: 'rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.18)'
            }}>
              <span className="text-white opacity-80 mr-3 flex items-center">
                <LupayIcon width={20} height={20} />
              </span>

              <input
                type="text"
                placeholder="Buscar por H.R., referencia, ubicación, nombre, teléfono..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    // show registros in the central pane instead of navigating
                    setActiveSection('registros');
                  }
                }}
                className="flex-1 bg-transparent text-white placeholder:text-[var(--color-gris-medio)] focus:outline-none text-sm"
              />

              <div className="flex items-center gap-3 ml-4">
                <button className="p-2 rounded-md text-white hover:bg-transparent focus:outline-none">
                  <NotificationIcon width={20} height={20} />
                </button>

                <div className="relative">
                  <button onClick={() => setUserMenuOpen(v => !v)} className="p-1 rounded-full bg-transparent border border-[rgba(255,255,255,0.06)] focus:outline-none">
                    <UsuarioIcon width={28} height={28} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 rounded-lg shadow-lg z-50" style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.18)'
                    }}>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-[rgba(255,255,255,0.08)] text-white flex items-center gap-2 rounded-lg">
                        <CerrarLogo width={16} height={16} fill="currentColor" />
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
        {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
        {/* Zona central (contenido) */}
        <main className="flex-1 flex flex-col min-h-screen bg-transparent animate-fade-in-up">
          <div className="w-full max-w-6xl mx-auto mt-0 px-4 py-4 transform -translate-y-4">
            {/* Render central content based on selected section (no route change) */}
            {activeSection === 'nueva-hoja' && <NuevaHojaRuta />}
            {activeSection === 'registros' && <RegistrosPage onHojaSelected={handleHojaSelected} />}
            {activeSection === 'hoja-detalle' && selectedHoja && (
              <HojaRutaDetalleView 
                hoja={selectedHoja} 
                onBack={handleBackToRegistros}
              />
            )}
            {activeSection === 'historial' && <HistorialPage />}
            {activeSection === 'notificaciones' && <NotificacionesPage />}
            {activeSection === 'enviar' && <EnviarPageReestructurado />}
            {activeSection === 'gestion-envios' && <GestionEnvios />}
            {activeSection === 'inicio' && <ModernDashboard onNavigate={setActiveSection} />}
          </div>
        </main>
        {/* Footer institucional (use same vino background) */}
        <footer className="h-14 flex items-center justify-center text-base text-white font-extrabold animate-fade-in-up tracking-wider" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          Sistema SEDEGES La Paz &copy; 2025
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
