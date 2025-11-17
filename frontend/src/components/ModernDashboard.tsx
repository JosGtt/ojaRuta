import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
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

  const fetchDashboardData = async () => {
    if (!token) {
      console.log('❌ No hay token, no se puede cargar el dashboard');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 INICIO fetchDashboardData - Conectando al dashboard en tiempo real...');
      console.log('🔑 Token disponible:', token ? 'SÍ' : 'NO');
      
      // Obtener hojas de ruta básicas
      const response = await axios.get('http://localhost:3001/api/hojas-ruta', {
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
        completadas: todasLasHojas.filter((h: any) => h.estado_cumplimiento === 'completado').length,
        vencidas: todasLasHojas.filter((h: any) => h.dias_para_vencimiento < 0).length
      };
      
      setEstadisticas(stats);
      setHojasRecientes(todasLasHojas.slice(0, 5));
      
      // Notificaciones de ejemplo
      setNotificaciones([
        {
          id: 1,
          mensaje: `📊 Dashboard actualizado. ${todasLasHojas.length} hojas de ruta en el sistema.`,
          fecha: new Date().toISOString(),
          leida: false
        },
        {
          id: 2,
          mensaje: '✅ Sistema funcionando correctamente',
          fecha: new Date().toISOString(),
          leida: true
        }
      ]);
      
    } catch (error) {
      console.error('❌ Error en fetchDashboardData:', error);
      
      // Datos vacíos si hay error
      setEstadisticas({ total: 0, pendientes: 0, en_proceso: 0, completadas: 0, vencidas: 0 });
      setNotificaciones([{
        id: 1,
        mensaje: '❌ Error de conexión. Revisa que el backend esté funcionando.',
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

  // Actualización automática cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Actualizando dashboard automáticamente...');
      fetchDashboardData();
    }, 30000);
    
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
    <div style={{ background: 'var(--color-vino-oscuro)' }} className="min-h-screen text-white p-6">
      {/* Header Ejecutivo */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Panel Ejecutivo</h1>
            <p className="text-white/70 text-lg">Sistema de Gestión Documental - SEDEGES La Paz</p>
          </div>
          <div className="text-right">
            <div className="text-white/60 text-sm">Actualizado el</div>
            <div className="text-white font-medium">{new Date().toLocaleDateString('es-BO', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
          </div>
        </div>
      </div>

      {/* Indicadores Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total de Documentos */}
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-sm p-6">
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
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-sm p-6">
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
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-sm p-6">
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
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-sm p-6">
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
        <div className="xl:col-span-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-sm">
          <div className="p-6 border-b border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Documentos Recientes</h2>
                <p className="text-white/60 text-sm">Últimas hojas de ruta procesadas</p>
              </div>
              <button 
                onClick={() => onNavigate?.('registros')}
                className="px-4 py-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] rounded-sm text-white/90 text-sm font-medium transition-all"
              >
                Ver Todos
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {hojasRecientes.length > 0 ? (
              <div className="space-y-3">
                {hojasRecientes.slice(0, 5).map((hoja) => (
                  <div key={hoja.id} className="flex items-center justify-between p-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-sm hover:bg-[rgba(255,255,255,0.05)] transition-all">
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
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Acciones Rápidas</h3>
                <p className="text-white/60 text-sm">Operaciones frecuentes</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => onNavigate?.('nueva-hoja')}
                className="w-full flex items-center justify-center gap-3 p-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-sm text-white font-medium transition-all"
              >
                <AñadirIcon width={18} height={18} fill="white" />
                Nueva Hoja de Ruta
              </button>
              
              <button 
                onClick={() => onNavigate?.('registros')}
                className="w-full flex items-center justify-center gap-3 p-3 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] rounded-sm text-white font-medium transition-all"
              >
                <RegistrosIcon width={18} height={18} fill="white" />
                Ver Registros
              </button>
              
              <button 
                onClick={() => onNavigate?.('enviar')}
                className="w-full flex items-center justify-center gap-3 p-3 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] rounded-sm text-white font-medium transition-all"
              >
                <ArchivoIcon width={18} height={18} fill="white" />
                Gestionar Envíos
              </button>
              
              <button 
                onClick={() => onNavigate?.('historial')}
                className="w-full flex items-center justify-center gap-3 p-3 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] rounded-sm text-white font-medium transition-all"
              >
                <HistorialIcon width={18} height={18} fill="white" />
                Ver Historial
              </button>
            </div>
          </div>

          {/* Notificaciones */}
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-sm p-6">
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
                  className={`p-3 rounded-sm border ${
                    notif.leida 
                      ? 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)]' 
                      : 'bg-blue-500/10 border-blue-500/20'
                  }`}
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
              className="w-full mt-4 p-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] rounded-sm text-white/90 text-sm font-medium transition-all"
            >
              Ver Todas las Notificaciones
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas Adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Productividad */}
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-sm p-6">
          <div className="text-center">
            <div className="text-white/70 text-sm font-medium mb-2">PRODUCTIVIDAD</div>
            <div className="text-2xl font-bold text-blue-400 mb-1">87%</div>
            <div className="text-white/50 text-xs">Eficiencia promedio</div>
          </div>
        </div>

        {/* Tiempo Promedio */}
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-sm p-6">
          <div className="text-center">
            <div className="text-white/70 text-sm font-medium mb-2">TIEMPO PROMEDIO</div>
            <div className="text-2xl font-bold text-purple-400 mb-1">3.2</div>
            <div className="text-white/50 text-xs">Días por documento</div>
          </div>
        </div>

        {/* Documentos Hoy */}
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-sm p-6">
          <div className="text-center">
            <div className="text-white/70 text-sm font-medium mb-2">HOY</div>
            <div className="text-2xl font-bold text-green-400 mb-1">{estadisticas.pendientes}</div>
            <div className="text-white/50 text-xs">Documentos procesados</div>
          </div>
        </div>

        {/* Meta Mensual */}
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-sm p-6">
          <div className="text-center">
            <div className="text-white/70 text-sm font-medium mb-2">META MENSUAL</div>
            <div className="text-2xl font-bold text-orange-400 mb-1">74%</div>
            <div className="text-white/50 text-xs">Progreso actual</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;