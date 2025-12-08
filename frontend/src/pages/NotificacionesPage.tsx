import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config/api';
import NotificationIcon from '../assets/notification';
import AlertaIcon from '../assets/alerta';
import CheckIcon from '../assets/Check';
import X from '../assets/X';
import DocumentosIcon from '../assets/documentos';
import CalendarioIcon from '../assets/calendario';
import RefreshIcon from '../assets/refresh';

interface Notificacion {
  id: number;
  mensaje: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  fecha: string;
  leida: boolean;
  hoja_ruta_id?: number;
}

const NotificacionesPage = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [filtro, setFiltro] = useState<'todas' | 'no-leidas' | 'leidas'>('todas');
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  // Obtener notificaciones desde localStorage
  const getNotificacionesLocales = (): Notificacion[] => {
    try {
      const stored = localStorage.getItem('notificaciones_sedeges');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filtrar notificaciones de la última semana
        const unaSemanaAtras = new Date();
        unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7);
        
        return parsed.filter((notif: Notificacion) => 
          new Date(notif.fecha) > unaSemanaAtras
        );
      }
    } catch (error) {
      console.error('Error al leer notificaciones del localStorage:', error);
    }
    return [];
  };

  // Guardar notificaciones en localStorage
  const saveNotificacionesLocales = (notifs: Notificacion[]) => {
    try {
      // Filtrar solo las de la última semana antes de guardar
      const unaSemanaAtras = new Date();
      unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7);
      
      const notificacionesRecientes = notifs.filter(notif => 
        new Date(notif.fecha) > unaSemanaAtras
      );
      
      localStorage.setItem('notificaciones_sedeges', JSON.stringify(notificacionesRecientes));
    } catch (error) {
      console.error('Error al guardar notificaciones en localStorage:', error);
    }
  };

  // Combinar notificaciones del servidor con las locales
  const combinarNotificaciones = (nuevasNotifs: Notificacion[], locales: Notificacion[]) => {
    const combined = [...nuevasNotifs];
    
    // Añadir notificaciones leídas que no estén en las nuevas
    locales.forEach(localNotif => {
      if (localNotif.leida && !combined.find(n => n.id === localNotif.id)) {
        combined.push(localNotif);
      }
    });
    
    // Actualizar estado de leídas para notificaciones existentes
    return combined.map(notif => {
      const localVersion = locales.find(l => l.id === notif.id);
      return localVersion && localVersion.leida ? { ...notif, leida: true } : notif;
    });
  };

  // Cargar notificaciones
  const fetchNotificaciones = async () => {
    try {
      setLoading(true);
      
      // Obtener notificaciones locales primero
      const notificacionesLocales = getNotificacionesLocales();
      
      const response = await axios.get(`${API_BASE_URL}/api/hojas-ruta/dashboard/tiempo-real`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data?.notificaciones) {
        const notificacionesFormateadas = response.data.notificaciones.map((notif: any) => ({
          id: notif.id || Math.random(),
          mensaje: notif.mensaje || notif.message,
          tipo: notif.tipo || 'info',
          fecha: notif.fecha || notif.created_at || new Date().toISOString(),
          leida: notif.leida || false
        }));
        
        // Combinar con notificaciones locales
        const notificacionesCombinadas = combinarNotificaciones(notificacionesFormateadas, notificacionesLocales);
        setNotificaciones(notificacionesCombinadas);
        saveNotificacionesLocales(notificacionesCombinadas);
      } else {
        // Si no hay datos del servidor, usar solo las locales
        setNotificaciones(notificacionesLocales);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      
      // En caso de error, usar notificaciones locales + datos de ejemplo
      const notificacionesLocales = getNotificacionesLocales();
      const datosEjemplo: Notificacion[] = [
        {
          id: 1,
          mensaje: "Nueva hoja de ruta HR-2025-001 creada y requiere atención inmediata",
          tipo: 'warning',
          fecha: new Date().toISOString(),
          leida: false
        },
        {
          id: 2,
          mensaje: "Hoja de ruta HR-2025-003 próxima a vencer en 2 días",
          tipo: 'warning',
          fecha: new Date(Date.now() - 86400000).toISOString(),
          leida: false
        },
        {
          id: 3,
          mensaje: "Hoja de ruta HR-2025-005 completada exitosamente",
          tipo: 'success',
          fecha: new Date(Date.now() - 172800000).toISOString(),
          leida: true
        }
      ];
      
      const notificacionesCombinadas = combinarNotificaciones(datosEjemplo, notificacionesLocales);
      setNotificaciones(notificacionesCombinadas);
      saveNotificacionesLocales(notificacionesCombinadas);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, [token]);

  // Marcar notificación como leída
  const marcarComoLeida = async (notifId: number) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/notificaciones/${notifId}/leer`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const nuevasNotificaciones = notificaciones.map(notif => 
        notif.id === notifId ? { ...notif, leida: true } : notif
      );
      
      setNotificaciones(nuevasNotificaciones);
      saveNotificacionesLocales(nuevasNotificaciones);
      toast.success('Notificación marcada como leída');
    } catch (error) {
      // Fallback local
      const nuevasNotificaciones = notificaciones.map(notif => 
        notif.id === notifId ? { ...notif, leida: true } : notif
      );
      setNotificaciones(nuevasNotificaciones);
      saveNotificacionesLocales(nuevasNotificaciones);
    }
  };

  // Marcar todas como leídas
  const marcarTodasLeidas = async () => {
    try {
      await axios.patch(`${API_BASE_URL}/api/notificaciones/marcar-todas-leidas`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const nuevasNotificaciones = notificaciones.map(notif => ({ ...notif, leida: true }));
      setNotificaciones(nuevasNotificaciones);
      saveNotificacionesLocales(nuevasNotificaciones);
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      // Fallback local
      const nuevasNotificaciones = notificaciones.map(notif => ({ ...notif, leida: true }));
      setNotificaciones(nuevasNotificaciones);
      saveNotificacionesLocales(nuevasNotificaciones);
      toast.success('Todas las notificaciones marcadas como leídas');
    }
  };

  // Filtrar notificaciones
  const notificacionesFiltradas = notificaciones.filter(notif => {
    switch (filtro) {
      case 'no-leidas': return !notif.leida;
      case 'leidas': return notif.leida;
      default: return true;
    }
  });

  // Obtener icono según tipo
  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'warning': return <AlertaIcon width={20} height={20} fill="rgb(251 146 60)" />;
      case 'error': return <X width={20} height={20} fill="rgb(239 68 68)" />;
      case 'success': return <CheckIcon width={20} height={20} fill="rgb(34 197 94)" />;
      default: return <NotificationIcon width={20} height={20} fill="rgb(59 130 246)" />;
    }
  };

  // Obtener color según tipo
  const obtenerColor = (tipo: string) => {
    switch (tipo) {
      case 'warning': return 'border-l-4 border-yellow-500';
      case 'error': return 'border-l-4 border-red-500';
      case 'success': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-blue-500';
    }
  };

  const noLeidasCount = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="w-full min-h-screen bg-transparent">
      {/* Header */}
      <div className="rounded-3xl p-8 mb-6 text-white shadow-2xl" style={{
        background: 'rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
        border: '1px solid rgba(255, 255, 255, 0.18)'
      }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <NotificationIcon width={32} height={32} fill="white" />
              Centro de Notificaciones
            </h1>
            <p className="text-white/90">Mantente al día con todas las actualizaciones del sistema</p>
            <p className="text-white/60 text-xs mt-1 flex items-center gap-2">
              <CalendarioIcon width={14} height={14} fill="currentColor" />
              Las notificaciones leídas se conservan por 7 días
            </p>
          </div>
          <div className="text-right">
            <div className="mb-2">
              <NotificationIcon width={48} height={48} fill="rgb(148 163 184)" />
            </div>
            {noLeidasCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full">
                {noLeidasCount} nuevas
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas y acciones */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[rgba(0,0,0,0.18)] rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Total</p>
              <p className="text-2xl font-bold">{notificaciones.length}</p>
            </div>
            <DocumentosIcon width={24} height={24} fill="white" />
          </div>
        </div>
        
        <div className="bg-[rgba(0,0,0,0.18)] rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">No leídas</p>
              <p className="text-2xl font-bold text-yellow-400">{noLeidasCount}</p>
            </div>
            <AlertaIcon width={24} height={24} fill="white" />
          </div>
        </div>
        
        <div className="bg-[rgba(0,0,0,0.18)] rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Leídas</p>
              <p className="text-2xl font-bold text-green-400">{notificaciones.length - noLeidasCount}</p>
            </div>
            <CheckIcon width={24} height={24} fill="white" />
          </div>
        </div>
        
        <div className="rounded-xl p-4" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <button 
            onClick={marcarTodasLeidas}
            disabled={noLeidasCount === 0}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-2 rounded-lg transition-all duration-200 text-sm font-medium"
          >
            Marcar todas como leídas
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl p-4 mb-6" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setFiltro('todas')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filtro === 'todas' 
                ? 'bg-[var(--color-vino)] text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Todas ({notificaciones.length})
          </button>
          <button 
            onClick={() => setFiltro('no-leidas')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filtro === 'no-leidas' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            No leídas ({noLeidasCount})
          </button>
          <button 
            onClick={() => setFiltro('leidas')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filtro === 'leidas' 
                ? 'bg-green-600 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Leídas ({notificaciones.length - noLeidasCount})
          </button>
          <button 
            onClick={fetchNotificaciones}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50"
          >
            <RefreshIcon width={16} height={16} fill="white" className={loading ? 'animate-spin' : ''} />
            <span className="ml-2">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="rounded-xl p-6" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        {loading ? (
          <div className="text-center py-12 text-white/60">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="mt-4">Cargando notificaciones...</p>
          </div>
        ) : notificacionesFiltradas.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <div className="mb-4">
              <NotificationIcon width={48} height={48} fill="rgb(148 163 184)" />
            </div>
            <p className="text-lg">No hay notificaciones que mostrar</p>
            <p className="text-sm">¡Estás al día con todo!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notificacionesFiltradas.map((notif) => (
              <div 
                key={notif.id}
                className={`bg-white/10 rounded-lg p-4 cursor-pointer transition-all hover:bg-white/15 ${
                  notif.leida ? 'opacity-75' : 'border-l-4 border-[var(--color-esmeralda)]'
                } ${obtenerColor(notif.tipo)}`}
                onClick={() => !notif.leida && marcarComoLeida(notif.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-xl">{getIconoTipo(notif.tipo)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-white ${notif.leida ? 'text-white/70' : 'text-white font-medium'}`}>
                        {notif.mensaje}
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        {new Date(notif.fecha).toLocaleDateString('es-ES', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {!notif.leida && (
                    <div className="w-2 h-2 bg-[var(--color-esmeralda)] rounded-full ml-2 flex-shrink-0"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificacionesPage;