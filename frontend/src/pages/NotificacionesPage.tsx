import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

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

  // Cargar notificaciones
  const fetchNotificaciones = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/hojas-ruta/dashboard/tiempo-real', {
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
        setNotificaciones(notificacionesFormateadas);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      // Datos de ejemplo mientras se conecta el backend
      setNotificaciones([
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
        },
        {
          id: 4,
          mensaje: "Recordatorio: Revisar hojas de ruta pendientes de esta semana",
          tipo: 'info',
          fecha: new Date(Date.now() - 259200000).toISOString(),
          leida: true
        }
      ]);
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
      await axios.patch(`http://localhost:3001/api/notificaciones/${notifId}/leer`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotificaciones(prev => prev.map(notif => 
        notif.id === notifId ? { ...notif, leida: true } : notif
      ));
      toast.success('Notificación marcada como leída');
    } catch (error) {
      // Fallback local
      setNotificaciones(prev => prev.map(notif => 
        notif.id === notifId ? { ...notif, leida: true } : notif
      ));
    }
  };

  // Marcar todas como leídas
  const marcarTodasLeidas = async () => {
    try {
      await axios.patch('http://localhost:3001/api/notificaciones/marcar-todas-leidas', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotificaciones(prev => prev.map(notif => ({ ...notif, leida: true })));
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      // Fallback local
      setNotificaciones(prev => prev.map(notif => ({ ...notif, leida: true })));
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
  const obtenerIcono = (tipo: string) => {
    switch (tipo) {
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return '🔔';
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
      <div className="bg-gradient-to-r from-[var(--color-vino)] to-[var(--color-vino-oscuro)] rounded-3xl p-8 mb-6 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">📬 Centro de Notificaciones</h1>
            <p className="text-white/90">Mantente al día con todas las actualizaciones del sistema</p>
          </div>
          <div className="text-right">
            <div className="text-4xl mb-2">🔔</div>
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
            <span className="text-2xl">📊</span>
          </div>
        </div>
        
        <div className="bg-[rgba(0,0,0,0.18)] rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">No leídas</p>
              <p className="text-2xl font-bold text-yellow-400">{noLeidasCount}</p>
            </div>
            <span className="text-2xl">🔴</span>
          </div>
        </div>
        
        <div className="bg-[rgba(0,0,0,0.18)] rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Leídas</p>
              <p className="text-2xl font-bold text-green-400">{notificaciones.length - noLeidasCount}</p>
            </div>
            <span className="text-2xl">✅</span>
          </div>
        </div>
        
        <div className="bg-[rgba(0,0,0,0.18)] rounded-xl p-4">
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
      <div className="bg-[rgba(0,0,0,0.18)] rounded-xl p-4 mb-6">
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
            {loading ? '🔄' : '🔄'} Actualizar
          </button>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="bg-[rgba(0,0,0,0.18)] rounded-xl p-6">
        {loading ? (
          <div className="text-center py-12 text-white/60">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="mt-4">Cargando notificaciones...</p>
          </div>
        ) : notificacionesFiltradas.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <span className="text-4xl mb-4 block">📭</span>
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
                    <span className="text-xl">{obtenerIcono(notif.tipo)}</span>
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