import React from "react";
import CirculoOn from "../assets/circuloOn";
import CirculoOff from "../assets/circuloOFF";
import sedegesLogo from "../assets/sedeges.png";
// navigation via dashboard selection (no react-router NavLink used here)
import UserIcon from "../assets/usario";
import AñadirIcon from "../assets/añadir";
import HistorialIcon from "../assets/historial";
import NotificacionIcon from "../assets/notification";
import RegistrosIcon from "../assets/registros";
// Removed use of raster sedeges.png to keep header/background uniform.

const menuItems = [
  { id: 'inicio', icon: <UserIcon width={24} height={24} />, label: "Inicio" },
  { id: 'nueva-hoja', icon: <AñadirIcon width={24} height={24} />, label: "Añadir" },
  { id: 'registros', icon: <RegistrosIcon width={24} height={24} />, label: "Registros" },
  { id: 'historial', icon: <HistorialIcon width={24} height={24} />, label: "Historial" },
  { id: 'notificaciones', icon: <NotificacionIcon width={24} height={24} />, label: "Notificaciones" },
];

const Sidebar = ({ expanded, onEnter, onLeave, fixed, onFixToggle, onSelectSection, activeSection }: {
  expanded: boolean;
  onEnter: () => void;
  onLeave: () => void;
  fixed: boolean;
  onFixToggle: () => void;
  onSelectSection?: (id: string) => void;
  activeSection?: string;
}) => {
  return (
    <aside
      className={`fixed left-0 top-0 h-screen flex flex-col bg-[var(--color-vino)] transition-all duration-300 z-40 ${
        expanded ? "w-64" : "w-28"
      } ${fixed ? "" : "hover:w-64"}`}
      onMouseEnter={!fixed ? onEnter : undefined}
      onMouseLeave={!fixed ? onLeave : undefined}
    >
      {/* inner wrapper gives a rounded border around the whole menu in both states */}
      <div className={`h-full ${expanded ? 'p-3' : 'py-4 px-3'}`}>
  <div className={`h-full rounded-2xl border p-3 flex flex-col transition-all duration-200 bg-[var(--color-vino-oscuro)] border-[rgba(255,255,255,0.04)]`}>
          <div className="flex items-center justify-center py-3 relative flex-col">
            {/* Show raster logo at the top to match requested design */}
            <img
              src={sedegesLogo}
              alt="SEDEGES"
              className={`rounded-full bg-transparent object-contain transition-all duration-200 ${expanded ? 'w-28 h-28' : 'w-28 h-28 mx-auto'}`}
            />
            {/* When the menu is expanded by hover, show the pin control here. Clicking toggles fixed state. */}
            {expanded && (
              <button
                onClick={onFixToggle}
                className="absolute right-3 top-3 p-1 focus:outline-none"
                aria-label={fixed ? "Unpin menu" : "Pin menu"}
              >
                {fixed ? <CirculoOn width={20} height={20} /> : <CirculoOff width={20} height={20} />}
              </button>
            )}
            {/* divider under logo */}
            <div className="w-full mt-4">
              <hr className="border-t border-[rgba(255,255,255,0.04)]" />
            </div>
          </div>
          <nav className="flex-1 flex flex-col gap-3 mt-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectSection && onSelectSection(item.id)}
                className="relative w-full text-left transition-colors duration-200"
              >
                {/* inner box: when active show a filled rounded rect similar to mockup */}
                <div className={`flex items-center gap-4 px-4 ${expanded ? 'py-3' : 'py-3'} rounded-xl ${activeSection === item.id ? 'bg-[var(--color-vino)]/90' : 'hover:bg-[var(--color-vino)]/80'} text-lg font-semibold text-[var(--color-blanco)]`}>
                  <span className={`${activeSection === item.id ? 'w-12 h-12' : 'w-8 h-8'} bg-[var(--color-vino-claro)]/15 rounded-lg flex items-center justify-center ${activeSection === item.id ? 'border border-[rgba(255,255,255,0.06)]' : ''}`}>
                    {item.icon}
                  </span>
                  {expanded && <span>{item.label}</span>}
                </div>

                {/* underline when active: long when expanded, short when collapsed; placed as sibling so it doesn't overlap */}
                {activeSection === item.id && (
                  <div className="w-full flex items-center justify-center mt-2">
                    {expanded ? (
                      <div className="w-20 h-1 bg-[var(--color-blanco)] rounded-full" />
                    ) : (
                      <div className="w-6 h-1 bg-[var(--color-blanco)] rounded-full" />
                    )}
                  </div>
                )}
              </button>
            ))}
          </nav>
      {/* bottom control removed per design — pin control moves to top when expanded */}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
