import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface HojaRutaReciente {
  id: number;
  numero_hr: string;
  referencia: string;
  procedencia: string;
  fecha_ingreso: string;
  fecha_limite: string;
  prioridad: string;
  estado: string;
  estado_cumplimiento: string;
  dias_para_vencimiento: number;
  alerta_vencimiento: string;
  ubicacion_actual?: string;
  responsable_actual?: string;
}

interface Estadisticas {
  total: number;
  pendientes: number;
  en_proceso: number;
  completadas: number;
  vencidas: number;
}

interface Tarea {
  id: number;
  titulo: string;
  tipo: 'urgente' | 'prioritario' | 'rutinario';
  fecha_vencimiento: string;
}

interface Notificacion {
  id: number;
  mensaje: string;
  fecha: string;
  leida: boolean;
}

const ModernDashboard: React.FC = () => {
  const { token } = useAuth();
  const [hojasRecientes, setHojasRecientes] = useState<HojaRutaReciente[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    total: 0,
    pendientes: 0,
    en_proceso: 0,
    completadas: 0,
    vencidas: 0
  });
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  // Función para marcar hoja como completada
  const marcarComoCompletada = async (hojaId: number) => {
    if (!token) return;
    
    try {
      await axios.patch(`http://localhost:3001/api/hojas-ruta/${hojaId}/completar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refrescar los datos
      fetchDashboardData();
      
      // Notificación de éxito
      console.log('Hoja marcada como completada');
    } catch (error) {
      console.error('Error al marcar como completada:', error);
    }
  };

  // Función para marcar notificación como leída
  const marcarNotificacionLeida = async (notifId: number) => {
    if (!token) return;
    
    try {
      await axios.patch(`http://localhost:3001/api/notificaciones/${notifId}/leer`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Actualizar el estado local
      setNotificaciones(prev => prev.map(notif => 
        notif.id === notifId ? { ...notif, leida: true } : notif
      ));
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  const fetchDashboardData = async () => {
    if (!token) {
      console.error('No hay token');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 Iniciando fetch de datos...');
      console.log('🔑 Token:', token?.substring(0, 20) + '...');
      
      // Fetch básico sin parámetros
      const response = await axios.get('http://localhost:3001/api/hojas-ruta', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📊 Respuesta del backend:', response);
      console.log('📋 Datos recibidos:', response.data);
      console.log('📈 Cantidad de hojas:', response.data?.length);
      
      const todasLasHojas = response.data || [];
      
      // Calcular estadísticas básicas
      const stats = {
        total: todasLasHojas.length,
        pendientes: todasLasHojas.filter((h: any) => h.estado_cumplimiento === 'pendiente').length,
        en_proceso: todasLasHojas.filter((h: any) => h.estado_cumplimiento === 'en_proceso').length,
        completadas: todasLasHojas.filter((h: any) => h.estado_cumplimiento === 'completado').length,
        vencidas: todasLasHojas.filter((h: any) => h.dias_para_vencimiento < 0).length
      };
      
      console.log('📊 Estadísticas calculadas:', stats);
      setEstadisticas(stats);
      
      // Mostrar primeras 5 hojas
      setHojasRecientes(todasLasHojas.slice(0, 5));
      
      // Notificaciones básicas
      const notificacionesBasicas = [
        { 
          id: 1, 
          mensaje: `✅ Sistema conectado. ${todasLasHojas.length} hojas cargadas.`, 
          fecha: new Date().toISOString(), 
          leida: false 
        }
      ];
      
      if (todasLasHojas.length > 0) {
        const hojasVencidas = todasLasHojas.filter((h: any) => h.dias_para_vencimiento < 0);
        if (hojasVencidas.length > 0) {
          notificacionesBasicas.push({
            id: 2,
            mensaje: `⚠️ ${hojasVencidas.length} hoja(s) vencida(s) requieren atención`,
            fecha: new Date().toISOString(),
            leida: false
          });
        }
      }
      
      setNotificaciones(notificacionesBasicas);
      
      // Tareas básicas
      const tareasBasicas = todasLasHojas
        .filter((h: any) => h.estado_cumplimiento !== 'completado')
        .slice(0, 6)
        .map((h: any) => ({
          id: h.id,
          titulo: `${h.numero_hr} - ${(h.procedencia || 'Sin procedencia').substring(0, 20)}`,
          tipo: h.dias_para_vencimiento <= 3 ? 'urgente' : 'prioritario',
          fecha_vencimiento: h.fecha_limite || new Date().toISOString()
        }));
        
      setTareas(tareasBasicas);
      
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error message:', error.message);
      
      // Datos de prueba si hay error
      setEstadisticas({
        total: 0,
        pendientes: 0,
        en_proceso: 0,
        completadas: 0,
        vencidas: 0
      });
      
      setNotificaciones([{
        id: 1,
        mensaje: '❌ Error de conexión con el servidor',
        fecha: new Date().toISOString(),
        leida: false
      }]);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const getTareaColor = (tipo: string) => {
    switch (tipo) {
      case 'urgente': return 'from-[var(--color-punzo)] to-[var(--color-punzo-700)]';
      case 'prioritario': return 'from-[var(--color-esmeralda)] to-[var(--color-esmeralda-700)]';
      case 'rutinario': return 'from-[var(--color-vino)] to-[var(--color-vino-oscuro)]';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getTareaIcon = (tipo: string) => {
    switch (tipo) {
      case 'urgente': return '🚨';
      case 'prioritario': return '⚡';
      case 'rutinario': return '📋';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-white text-lg">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primera fila - Hojas de Ruta Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel principal - Hojas de Ruta Recientes */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[var(--color-vino)] via-[var(--color-vino-oscuro)] to-[var(--color-esmeralda)] rounded-3xl p-6 text-white shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Hojas de Ruta Recientes</h2>
              <p className="text-white/80 opacity-90">Últimas 5 agregadas al sistema</p>
            </div>
            <div className="w-20 h-20 bg-gradient-to-r from-white/20 to-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <div className="w-12 h-12 bg-gradient-to-r from-[var(--color-esmeralda)] to-[var(--color-vino)] rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-3">
            {hojasRecientes.map((hoja) => (
              <div key={hoja.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="grid grid-cols-6 gap-4 items-center">
                  <div className="font-bold text-sm">#{hoja.numero_hr}</div>
                  <div className="text-sm truncate">{hoja.referencia}</div>
                  <div className="text-sm truncate">{hoja.procedencia}</div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    hoja.prioridad === 'urgente' ? 'bg-[var(--color-punzo)]/80' : 
                    hoja.prioridad === 'prioritario' ? 'bg-[var(--color-esmeralda)]/80' : 'bg-[var(--color-vino)]/80'
                  }`}>
                    {hoja.prioridad}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    hoja.alerta_vencimiento === 'Vencida' ? 'bg-red-600/90' :
                    hoja.alerta_vencimiento === 'Crítica' ? 'bg-[var(--color-punzo)]/80' :
                    hoja.alerta_vencimiento === 'Próxima a vencer' ? 'bg-yellow-500/80' : 'bg-[var(--color-esmeralda)]/80'
                  }`}>
                    {hoja.dias_para_vencimiento === null || hoja.dias_para_vencimiento === undefined ? 'Sin fecha límite' :
                     hoja.dias_para_vencimiento < 0 ? `${Math.abs(hoja.dias_para_vencimiento)}d vencida` : 
                     hoja.dias_para_vencimiento === 0 ? 'Hoy' : `${hoja.dias_para_vencimiento}d`}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs opacity-80">
                      {hoja.fecha_limite ? new Date(hoja.fecha_limite).toLocaleDateString() : 'Sin fecha límite'}
                    </div>
                    <button
                      onClick={() => marcarComoCompletada(hoja.id)}
                      className="text-xs bg-[var(--color-esmeralda)] hover:bg-[var(--color-esmeralda)]/80 px-2 py-1 rounded-full transition-colors"
                      title="Marcar como completada"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Segunda fila - Tareas, Notificaciones y Enviar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Tareas */}
        <div className="bg-gradient-to-br from-[var(--color-vino)] to-[var(--color-vino-oscuro)] rounded-3xl p-6 text-white shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold">Gestión de Tareas</h3>
              <p className="text-white/80 text-sm">Organiza tu trabajo por prioridad</p>
            </div>
            <div className="text-2xl">📊</div>
          </div>

          <div className="space-y-3">
            {['urgente', 'prioritario', 'rutinario'].map((tipo) => {
              const tareasDelTipo = tareas.filter(t => t.tipo === tipo);
              return (
                <div key={tipo} className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{getTareaIcon(tipo)}</span>
                    <h4 className="font-semibold capitalize text-sm">{tipo}s</h4>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {tareasDelTipo.length}
                    </span>
                  </div>
                  {tareasDelTipo.slice(0, 2).map((tarea) => (
                    <div key={tarea.id} className={`bg-gradient-to-r ${getTareaColor(tarea.tipo)} p-2 rounded-lg`}>
                      <div className="font-medium text-xs">
                        {tarea.titulo.length > 35 ? `${tarea.titulo.substring(0, 35)}...` : tarea.titulo}
                      </div>
                      <div className="text-xs opacity-80 mt-1">
                        {new Date(tarea.fecha_vencimiento).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                  {tareasDelTipo.length > 2 && (
                    <div className="text-xs text-white/60 px-2">
                      +{tareasDelTipo.length - 2} más...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel de Enviar - DESHABILITADO */}
        <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-3xl p-6 text-white shadow-2xl opacity-60">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold">Enviar Documentos</h3>
              <p className="text-white/80 text-sm">Función temporalmente deshabilitada</p>
            </div>
            <div className="relative">
              <span className="text-2xl">📤</span>
              <span className="absolute -top-1 -right-1 bg-gray-600 text-xs w-5 h-5 rounded-full flex items-center justify-center">
                -
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white/10 p-4 rounded-xl border-l-4 border-white/40">
              <div className="font-medium text-sm">Función no disponible</div>
              <div className="text-xs text-white/80 mt-1">En desarrollo...</div>
            </div>
          </div>

          <button 
            disabled
            className="w-full mt-4 bg-gray-500 cursor-not-allowed rounded-xl py-3 text-sm font-medium"
          >
            No Disponible
          </button>
        </div>

        {/* Panel de Notificaciones */}
        <div className="bg-gradient-to-br from-[var(--color-vino)] to-[var(--color-vino-oscuro)] rounded-3xl p-6 text-white shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold">Notificaciones</h3>
              <p className="text-white/80 text-sm">Mantente al día con las actualizaciones</p>
            </div>
            <div className="relative">
              <span className="text-2xl">🔔</span>
              {notificaciones.filter(n => !n.leida).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {notificaciones.filter(n => !n.leida).length}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {notificaciones.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 rounded-xl cursor-pointer transition-all hover:bg-white/15 ${
                  notif.leida ? 'bg-white/10' : 'bg-white/20 border-l-4 border-[var(--color-esmeralda)]'
                }`}
                onClick={() => marcarNotificacionLeida(notif.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notif.mensaje}</p>
                    <p className="text-xs text-white/80 mt-1">
                      {new Date(notif.fecha).toLocaleDateString()}
                    </p>
                  </div>
                  {!notif.leida && (
                    <div className="w-2 h-2 bg-[var(--color-esmeralda)] rounded-full ml-2 mt-1"></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => window.alert('Función de ver todas las notificaciones en desarrollo')}
            className="w-full mt-4 bg-white/10 hover:bg-white/20 transition-colors rounded-xl py-3 text-sm font-medium"
          >
            Ver todas las notificaciones
          </button>
        </div>
      </div>

      {/* Tercera fila - Estadísticas reales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[var(--color-esmeralda)] to-[var(--color-esmeralda-700)] rounded-3xl p-6 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Total Hojas</p>
              <p className="text-3xl font-bold">{estadisticas.total}</p>
              <p className="text-white/80 text-xs">
                {estadisticas.completadas} completadas
              </p>
            </div>
            <div className="text-4xl opacity-80">📈</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[var(--color-vino)] to-[var(--color-vino-oscuro)] rounded-3xl p-6 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">En Proceso</p>
              <p className="text-3xl font-bold">{estadisticas.en_proceso}</p>
              <p className="text-white/80 text-xs">
                {estadisticas.pendientes} pendientes
              </p>
            </div>
            <div className="text-4xl opacity-80">⚡</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[var(--color-punzo)] to-[var(--color-punzo)]/80 rounded-3xl p-6 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Urgentes</p>
              <p className="text-3xl font-bold">{estadisticas.vencidas}</p>
              <p className="text-white/80 text-xs">
                {tareas.filter(t => t.tipo === 'urgente').length} críticas
              </p>
            </div>
            <div className="text-4xl opacity-80">⏰</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;