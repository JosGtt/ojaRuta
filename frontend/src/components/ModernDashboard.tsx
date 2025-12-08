import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

 // Project SVG icons 
import CheckIcon from '../assets/Check1';
import PrioridadIcon from '../assets/prioridad';
import RelojIcon from '../assets/reloj';
import ArchivoIcon from '../assets/archivo';
import RegistrosIcon from '../assets/registros';
import HistorialIcon from '../assets/historial';
import AñadirIcon from '../assets/añadir';

interface Props {
  onNavigate?: (section: string) => void;
}

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

interface Notificacion {
  id: number;
  mensaje: string;
  fecha: string;
  leida: boolean;
}

const ModernDashboard: React.FC<Props> = ({ onNavigate }) => {
  const { token } = useAuth();
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    total: 0,
    pendientes: 0,
    en_proceso: 0,
    completadas: 0,
    vencidas: 0
  });
  const [hojasRecientes, setHojasRecientes] = useState<HojaRutaReciente[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);

  const fetchDashboardData = async (isAutoUpdate = false) => {
    if (!token) {
      console.log('❌ No hay token, no se puede cargar el dashboard');
      return;
    }
    
    try {
      // Solo mostrar loading en carga inicial, no en auto-updates
      if (!isAutoUpdate) {
        setLoading(true);
      }
      
      console.log('🔄 INICIO fetchDashboardData - Conectando al dashboard en tiempo real...');
      console.log('🔑 Token disponible:', token ? 'SÍ' : 'NO');
      
      // Obtener hojas de ruta básicas
      const response = await axios.get(`${API_BASE_URL}/api/hojas-ruta`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📊 RESPUESTA del backend:', response.data);
      
      const todasLasHojas = response.data || [];
      console.log('📋 Hojas cargadas:', todasLasHojas.length);
      
      // Calcular estadísticas básicas
      const stats = {
        total: todasLasHojas.length,
        pendientes: todasLasHojas.filter((h: any) => h.estado_cumplimiento === 'pendiente' || !h.estado_cumplimiento).length,
        en_proceso: todasLasHojas.filter((h: any) => h.estado_cumplimiento === 'en_proceso').length,
        completadas: todasLasHojas.filter((h: any) => 
          h.estado_cumplimiento === 'completado' || 
          h.estado === 'archivada' || 
          h.estado === 'finalizada'
        ).length,
        vencidas: todasLasHojas.filter((h: any) => h.dias_para_vencimiento < 0).length
      };
      
      console.log('📊 Estadísticas calculadas:', stats);
      console.log('📋 Detalle hojas por estado_cumplimiento:');
      console.log('- Total hojas:', todasLasHojas.length);
      
      // Ver TODAS las hojas y sus estados
      todasLasHojas.forEach((hoja: any, index: number) => {
        console.log(`📄 Hoja ${index + 1}:`, {
          id: hoja.id,
          numero_hoja: hoja.numero_hoja,
          estado_cumplimiento: hoja.estado_cumplimiento,
          estado: hoja.estado,
          fecha_completado: hoja.fecha_completado
        });
      });
      
      console.log('- Pendientes:', todasLasHojas.filter((h: any) => h.estado_cumplimiento === 'pendiente' || !h.estado_cumplimiento));
      console.log('- En proceso:', todasLasHojas.filter((h: any) => h.estado_cumplimiento === 'en_proceso'));
      console.log('- Completadas:', todasLasHojas.filter((h: any) => 
        h.estado_cumplimiento === 'completado' || 
        h.estado === 'archivada' || 
        h.estado === 'finalizada'
      ));
      console.log('🎯 CONTADOR FINAL - Completadas encontradas:', stats.completadas);
      
      setEstadisticas(stats);
      
      // Para "hojas recientes" del dashboard, mostrar solo las activas (no completadas)
      const hojasActivas = todasLasHojas.filter((h: any) => 
        h.estado_cumplimiento !== 'completado' && 
        h.estado !== 'finalizada' && 
        h.estado !== 'archivada'
      );
      setHojasRecientes(hojasActivas.slice(0, 5));
      setUltimaActualizacion(new Date());
      
      // Solo actualizar notificaciones en carga inicial, no en auto-updates
      if (!isAutoUpdate) {
        setNotificaciones([
          {
            id: 1,
            mensaje: `Sistema SEDEGES conectado. ${todasLasHojas.length} hojas de ruta en el sistema.`,
            fecha: new Date().toISOString(),
            leida: false
          },
          {
            id: 2,
            mensaje: 'Sistema funcionando correctamente',
            fecha: new Date().toISOString(),
            leida: true
          }
        ]);
      }
      
    } catch (error) {
      console.error('❌ Error en fetchDashboardData:', error);
      
      // Solo mostrar errores en carga inicial
      if (!isAutoUpdate) {
        setEstadisticas({ total: 0, pendientes: 0, en_proceso: 0, completadas: 0, vencidas: 0 });
        setNotificaciones([{
          id: 1,
          mensaje: 'Error de conexión. Revisa que el backend esté funcionando.',
          fecha: new Date().toISOString(),
          leida: false
        }]);
      }
      
    } finally {
      if (!isAutoUpdate) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDashboardData(false); // Carga inicial con loading
  }, [token]);

  // Listener para actualizaciones de estado
  useEffect(() => {
    const handleEstadoActualizado = (event: any) => {
      console.log('🔔 Estado actualizado, refrescando dashboard inmediatamente...', event.detail);
      // Refresh inmediato sin delay
      setTimeout(() => {
        fetchDashboardData(true);
      }, 100); // Pequeño delay para que la BD se actualice
    };
    
    window.addEventListener('estadoActualizado', handleEstadoActualizado);
    
    return () => {
      window.removeEventListener('estadoActualizado', handleEstadoActualizado);
    };
  }, [token]); // Agregar token como dependencia

  // Actualización automática cada 2 minutos (menos agresiva)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Actualización automática silenciosa...');
      fetchDashboardData(true); // Update silencioso sin loading
    }, 120000); // 2 minutos en lugar de 30 segundos
    
    return () => {
      clearInterval(interval);
      console.log('🛑 Limpieza: interval del dashboard cancelado');
    };
  }, [token]);

  if (loading) {
    return (
      <div style={{ background: 'var(--color-vino-oscuro)' }} className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Cargando panel ejecutivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6">
      {/* Header Ejecutivo */}
      <div className="mb-8">
        <div className="rounded-2xl p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Panel Ejecutivo</h1>
              <p className="text-white/70 text-lg">Sistema de Gestión Documental - SEDEGES La Paz</p>
            </div>
            <div className="text-right">
              <div className="text-white/60 text-sm">
                {ultimaActualizacion ? 'Última actualización' : 'Actualizado el'}
              </div>
              <div className="text-white font-medium">
                {ultimaActualizacion 
                  ? ultimaActualizacion.toLocaleDateString('es-BO', { 
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short'
                    })
                  : new Date().toLocaleDateString('es-BO', { 
                      weekday: 'long', 
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric' 
                    })
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total de Documentos */}
        <div className="rounded-2xl p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/70 text-sm font-medium mb-2">TOTAL DOCUMENTOS</div>
              <div className="text-3xl font-bold text-white">{estadisticas.total}</div>
              <div className="text-white/60 text-xs mt-1">En el sistema</div>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-sm" style={{ background: 'var(--color-esmeralda)' }}>
              <ArchivoIcon width={24} height={24} fill="white" />
            </div>
          </div>
        </div>

        {/* En Proceso */}
        <div className="rounded-2xl p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/70 text-sm font-medium mb-2">EN PROCESO</div>
              <div className="text-3xl font-bold text-yellow-400">{estadisticas.en_proceso}</div>
              <div className="text-white/60 text-xs mt-1">Documentos activos</div>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-sm bg-yellow-500/20">
              <RelojIcon width={24} height={24} fill="#facc15" />
            </div>
          </div>
        </div>

        {/* Completados */}
        <div className="rounded-2xl p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/70 text-sm font-medium mb-2">COMPLETADOS</div>
              <div className="text-3xl font-bold text-green-400">{estadisticas.completadas}</div>
              <div className="text-white/60 text-xs mt-1">Finalizados</div>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-sm bg-green-500/20">
              <CheckIcon width={24} height={24} fill="#4ade80" />
            </div>
          </div>
        </div>

        {/* Críticos */}
        <div className="rounded-2xl p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/70 text-sm font-medium mb-2">CRÍTICOS</div>
              <div className="text-3xl font-bold text-red-400">{estadisticas.vencidas}</div>
              <div className="text-white/60 text-xs mt-1">Requieren atención</div>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-sm bg-red-500/20">
              <PrioridadIcon width={24} height={24} fill="#f87171" />
            </div>
          </div>
        </div>
      </div>

      {/* Panel Principal - Documentos Recientes */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Tabla de Documentos Recientes */}
        <div className="xl:col-span-2 rounded-2xl" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div className="p-6 border-b border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Documentos Recientes</h2>
                <p className="text-white/60 text-sm">Últimas hojas de ruta procesadas</p>
              </div>
              <button 
                onClick={() => onNavigate?.('registros')}
                className="px-4 py-2 hover:bg-[rgba(255,255,255,0.08)] rounded-lg text-white/90 text-sm font-medium transition-all"
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                Ver Todos
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {hojasRecientes.length > 0 ? (
              <div className="space-y-3">
                {hojasRecientes.slice(0, 5).map((hoja) => (
                  <div key={hoja.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-all" style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)'
                  }}>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 flex items-center justify-center rounded-sm" style={{ background: 'var(--color-esmeralda)' }}>
                        <span className="text-white font-bold text-sm">{hoja.numero_hr.slice(-2)}</span>
                      </div>
                      <div>
                        <div className="font-medium text-white">H.R. {hoja.numero_hr}</div>
                        <div className="text-sm text-white/70">{hoja.referencia || 'Sin referencia'}</div>
                        <div className="text-xs text-white/50">{hoja.procedencia}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex px-3 py-1 rounded-sm text-xs font-medium ${
                        hoja.prioridad === 'alta' ? 'bg-red-500/20 text-red-300' :
                        hoja.prioridad === 'media' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {hoja.prioridad}
                      </div>
                      <div className="text-white/50 text-xs mt-1">
                        {new Date(hoja.fecha_ingreso).toLocaleDateString('es-BO')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-white/40 text-sm">No hay documentos recientes</div>
              </div>
            )}
          </div>
        </div>

        {/* Panel de Acciones Rápidas */}
        <div className="space-y-6">
          {/* Crear Nueva H.R. */}
          <div className="rounded-2xl p-6" style={{
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Acciones Rápidas</h3>
                <p className="text-white/60 text-sm">Operaciones frecuentes</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => onNavigate?.('nueva-hoja')}
                className="w-full flex items-center justify-center gap-3 p-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl text-white font-medium transition-all"
              >
                <AñadirIcon width={18} height={18} fill="white" />
                Nueva Hoja de Ruta
              </button>
              
              <button 
                onClick={() => onNavigate?.('registros')}
                className="w-full flex items-center justify-center gap-3 p-3 hover:bg-[rgba(255,255,255,0.08)] rounded-xl text-white font-medium transition-all"
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <RegistrosIcon width={18} height={18} fill="white" />
                Ver Registros
              </button>
              
              <button 
                onClick={() => onNavigate?.('enviar')}
                className="w-full flex items-center justify-center gap-3 p-3 hover:bg-[rgba(255,255,255,0.08)] rounded-xl text-white font-medium transition-all"
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <ArchivoIcon width={18} height={18} fill="white" />
                Gestionar Envíos
              </button>
              
              <button 
                onClick={() => onNavigate?.('historial')}
                className="w-full flex items-center justify-center gap-3 p-3 hover:bg-[rgba(255,255,255,0.08)] rounded-xl text-white font-medium transition-all"
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <HistorialIcon width={18} height={18} fill="white" />
                Ver Historial
              </button>
            </div>
          </div>

          {/* Notificaciones */}
          <div className="rounded-2xl p-6" style={{
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Notificaciones</h3>
                <p className="text-white/60 text-sm">Alertas del sistema</p>
              </div>
              {notificaciones.filter(n => !n.leida).length > 0 && (
                <div className="w-6 h-6 flex items-center justify-center bg-red-500 rounded-full text-white text-xs font-bold">
                  {notificaciones.filter(n => !n.leida).length}
                </div>
              )}
            </div>
            
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {notificaciones.slice(0, 3).map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3 rounded-xl border ${
                    notif.leida 
                      ? 'border-[rgba(255,255,255,0.1)]' 
                      : 'bg-blue-500/10 border-blue-500/20'
                  }`}
                  style={notif.leida ? {
                    background: 'rgba(0, 0, 0, 0.2)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)'
                  } : {}}
                >
                  <div className="text-white text-sm">{notif.mensaje}</div>
                  <div className="text-white/50 text-xs mt-1">
                    {new Date(notif.fecha).toLocaleDateString('es-BO')}
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => onNavigate?.('notificaciones')}
              className="w-full mt-4 p-2 hover:bg-[rgba(255,255,255,0.08)] rounded-xl text-white/90 text-sm font-medium transition-all"
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              Ver Todas las Notificaciones
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;