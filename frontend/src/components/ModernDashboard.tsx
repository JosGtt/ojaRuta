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

  // Función para marcar hoja como completada (ACTUALIZADA)
  const marcarComoCompletada = async (hojaId: number) => {
    if (!token) return;
    
    try {
      console.log('🔄 Marcando hoja como completada:', hojaId);
      
      // NUEVO: Usar el endpoint de cambio de estado completo
      await axios.patch(`http://localhost:3001/api/hojas-ruta/${hojaId}/estado-completo`, {
        estado_cumplimiento: 'completado',
        estado_detalle: 'Marcada como completada desde el dashboard'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Estado cambiado exitosamente');
      
      // Refrescar los datos del dashboard
      fetchDashboardData();
      
      // Mostrar notificación de éxito
      console.log('🎉 Hoja marcada como completada - se generará notificación automática');
    } catch (error) {
      console.error('❌ Error al marcar como completada:', error);
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
      console.error('❌ No hay token - no se puede hacer fetch');
      return;
    }
    
    try {
      setLoading(true);
      console.log('� INICIO fetchDashboardData - Conectando al dashboard en tiempo real...');
      console.log('🔑 Token disponible:', token ? 'SÍ' : 'NO');
      
      // NUEVO: Usar el endpoint de dashboard en tiempo real
      const response = await axios.get('http://localhost:3001/api/hojas-ruta/dashboard/tiempo-real', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📊 RESPUESTA COMPLETA del backend:', response.data);
      
      const dashboardData = response.data;
      
      // Establecer datos directamente desde la respuesta del backend
      if (dashboardData.hojas_recientes) {
        setHojasRecientes(dashboardData.hojas_recientes.slice(0, 8)); // Mostrar 8 hojas recientes
        console.log('📋 Hojas recientes cargadas:', dashboardData.hojas_recientes.length);
      }
      
      if (dashboardData.estadisticas) {
        setEstadisticas({
          total: parseInt(dashboardData.estadisticas.total) || 0,
          pendientes: parseInt(dashboardData.estadisticas.pendientes) || 0,
          en_proceso: parseInt(dashboardData.estadisticas.en_proceso) || 0,
          completadas: parseInt(dashboardData.estadisticas.completadas) || 0,
          vencidas: parseInt(dashboardData.estadisticas.vencidas) || 0
        });
        console.log('📊 Estadísticas actualizadas:', dashboardData.estadisticas);
      }
      
      if (dashboardData.notificaciones) {
        // Formatear notificaciones para el frontend
        const notificacionesFormateadas = dashboardData.notificaciones.map((notif: any) => ({
          id: notif.id,
          mensaje: notif.mensaje,
          fecha: notif.fecha_creacion || notif.created_at,
          leida: notif.leida,
          tipo: notif.tipo
        }));
        setNotificaciones(notificacionesFormateadas.slice(0, 5)); // Limitar a 5 notificaciones máximo
        console.log('🔔 Notificaciones cargadas:', notificacionesFormateadas.length);
      }
      
      if (dashboardData.tareas_pendientes) {
        console.log('🔍 Tareas recibidas del backend:', dashboardData.tareas_pendientes);
        
        // Formatear tareas pendientes con mejor lógica de clasificación
        const tareasFormateadas = dashboardData.tareas_pendientes.map((tarea: any) => {
          let tipoTarea = 'rutinario';
          
          // Lógica mejorada para clasificar tareas
          if (tarea.dias_para_vencimiento !== null && tarea.dias_para_vencimiento !== undefined) {
            if (tarea.dias_para_vencimiento <= 0) {
              tipoTarea = 'urgente'; // Vencidas
            } else if (tarea.dias_para_vencimiento <= 3) {
              tipoTarea = 'urgente'; // Próximas a vencer
            } else if (tarea.dias_para_vencimiento <= 7) {
              tipoTarea = 'prioritario'; // Una semana
            } else {
              tipoTarea = 'rutinario'; // Más de una semana
            }
          }
          
          // También considerar prioridad original si existe
          if (tarea.prioridad === 'urgente' || tarea.prioridad === 'alta') {
            // Solo override si no es vencida
            if (tarea.dias_para_vencimiento > 0) {
              tipoTarea = 'urgente';
            }
          } else if (tarea.prioridad === 'rutinario' || tarea.prioridad === 'baja') {
            // Si la prioridad original es rutinario, mantenerlo
            tipoTarea = 'rutinario';
          }
          
          return {
            id: tarea.id,
            titulo: `${tarea.numero_hr} - ${(tarea.referencia || tarea.procedencia || 'Sin título').substring(0, 25)}...`, 
            tipo: tipoTarea,
            fecha_vencimiento: tarea.fecha_limite || new Date().toISOString(),
            estado_cumplimiento: tarea.estado_cumplimiento,
            dias_para_vencimiento: tarea.dias_para_vencimiento,
            alerta_vencimiento: tarea.alerta_vencimiento,
            prioridad_original: tarea.prioridad
          };
        });
        
        // Separar por tipos para mostrar balance
        const urgentes = tareasFormateadas.filter(t => t.tipo === 'urgente');
        const prioritarios = tareasFormateadas.filter(t => t.tipo === 'prioritario');  
        const rutinarios = tareasFormateadas.filter(t => t.tipo === 'rutinario');
        
        console.log('📊 Tareas clasificadas:', { 
          urgentes: urgentes.length, 
          prioritarios: prioritarios.length, 
          rutinarios: rutinarios.length 
        });
        
        console.log('📋 Detalle rutinarios:', rutinarios.map(r => `${r.titulo} (${r.dias_para_vencimiento} días, prioridad: ${r.prioridad_original})`));
        
        // Mostrar un balance: máximo 3 de cada tipo para tener más variedad
        const tareasBalanceadas = [
          ...urgentes.slice(0, 3),
          ...prioritarios.slice(0, 3), 
          ...rutinarios.slice(0, 3)
        ];
        
        setTareas(tareasBalanceadas);
        console.log('⏰ Tareas balanceadas cargadas:', tareasBalanceadas.length);
        console.log('📊 Balance final:', {
          urgentes: tareasBalanceadas.filter(t => t.tipo === 'urgente').length,
          prioritarios: tareasBalanceadas.filter(t => t.tipo === 'prioritario').length, 
          rutinarios: tareasBalanceadas.filter(t => t.tipo === 'rutinario').length
        });
        console.log('📋 Detalle tareas final:', tareasBalanceadas.map(t => `${t.titulo} (${t.tipo})`));
      } else {
        console.log('❌ No se recibieron tareas_pendientes del backend');
        setTareas([]);
      }
      
      console.log('✅ Dashboard tiempo real cargado exitosamente');
      
    } catch (error) {
      console.error('❌ Error al cargar dashboard tiempo real:', error);
      
      // Fallback: intentar cargar datos básicos
      try {
        console.log('🔄 Intentando fallback con endpoint básico...');
        const fallbackResponse = await axios.get('http://localhost:3001/api/hojas-ruta', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const todasLasHojas = fallbackResponse.data || [];
        console.log('📋 Fallback: Hojas cargadas:', todasLasHojas.length);
        
        // Calcular estadísticas básicas
        const stats = {
          total: todasLasHojas.length,
          pendientes: todasLasHojas.filter((h: any) => h.estado_cumplimiento === 'pendiente' || !h.estado_cumplimiento).length,
          en_proceso: todasLasHojas.filter((h: any) => h.estado_cumplimiento === 'en_proceso').length,
          completadas: todasLasHojas.filter((h: any) => h.estado_cumplimiento === 'completado').length,
          vencidas: todasLasHojas.filter((h: any) => h.dias_para_vencimiento < 0).length
        };
        
        setEstadisticas(stats);
        setHojasRecientes(todasLasHojas.slice(0, 5));
        
        // Notificación de fallback
        setNotificaciones([{
          id: 1,
          mensaje: `📊 Datos básicos cargados. ${todasLasHojas.length} hojas encontradas.`,
          fecha: new Date().toISOString(),
          leida: false
        }]);
        
      } catch (fallbackError) {
        console.error('❌ Error en fallback:', fallbackError);
        
        // Datos vacíos si todo falla
        setEstadisticas({ total: 0, pendientes: 0, en_proceso: 0, completadas: 0, vencidas: 0 });
        setNotificaciones([{
          id: 1,
          mensaje: '❌ Error de conexión. Revisa que el backend esté funcionando.',
          fecha: new Date().toISOString(),
          leida: false
        }]);
      }
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  // NUEVO: Actualización automática cada 30 segundos
  useEffect(() => {
    if (!token) return;
    
    console.log('⏰ Configurando actualización automática cada 30 segundos');
    
    const interval = setInterval(() => {
      console.log('🔄 Actualizando dashboard automáticamente...');
      fetchDashboardData();
    }, 30000); // 30 segundos
    
    // Cleanup function para limpiar el interval
    return () => {
      console.log('🛑 Limpiando timer de actualización automática');
      clearInterval(interval);
    };
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
            {/* DEBUG: Mostrar información de depuración */}
            {tareas.length === 0 && (
              <div className="text-xs text-white/60 bg-white/10 p-3 rounded-lg">
                🔍 Debug: No hay tareas cargadas. 
                <br />Estado: {loading ? 'Cargando...' : 'Carga completada'}
                <br />Total tareas en estado: {tareas.length}
              </div>
            )}
            
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

          <div className="space-y-2"> {/* Reducido de space-y-3 a space-y-2 */}
            {notificaciones.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-white/15 ${
                  notif.leida ? 'bg-white/10' : 'bg-white/20 border-l-3 border-[var(--color-esmeralda)]'
                }`} // Reducido padding de p-4 a p-3 y rounded-xl a rounded-lg
                onClick={() => marcarNotificacionLeida(notif.id)}
              >
                <div className="flex items-center justify-between"> {/* Cambiado items-start a items-center */}
                  <div className="flex-1 min-w-0"> {/* Añadido min-w-0 para truncar */}
                    <p className="text-xs font-medium leading-tight truncate"> {/* Reducido a text-xs y añadido truncate */}
                      {/* Acortar mensajes largos */}
                      {notif.mensaje.length > 50 ? notif.mensaje.substring(0, 47) + '...' : notif.mensaje}
                    </p>
                    <p className="text-[10px] text-white/70 mt-0.5"> {/* Más pequeño */}
                      {new Date(notif.fecha).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: '2-digit' 
                      })}
                    </p>
                  </div>
                  {!notif.leida && (
                    <div className="w-1.5 h-1.5 bg-[var(--color-esmeralda)] rounded-full ml-2 flex-shrink-0"></div>
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