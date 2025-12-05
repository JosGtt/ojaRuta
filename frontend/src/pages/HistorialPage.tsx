import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import HistorialIcon from '../assets/historial';
import CheckIcon from '../assets/Check1';
import EditarIcon from '../assets/editar';
import EnviarIcon from '../assets/enviar';
import DocumentosIcon from '../assets/documentos';

interface HistorialItem {
  id: number;
  tipo: 'añadido' | 'editado' | 'enviado';
  numero_hr?: string;
  referencia?: string;
  procedencia?: string;
  destinatario?: string;
  descripcion?: string;
  fecha_actividad: string;
  usuario_nombre?: string;
}

const HistorialPage = () => {
  const { token } = useAuth();
  const [historialData, setHistorialData] = useState<{
    añadidos: HistorialItem[];
    editados: HistorialItem[];
    enviados: HistorialItem[];
  }>({
    añadidos: [],
    editados: [],
    enviados: []
  });
  const [loading, setLoading] = useState(true);

  // Cargar datos reales del backend
  useEffect(() => {
    const loadHistorialData = async () => {
      try {
        setLoading(true);
        
        // Obtener historial por categorías
        const response = await axios.get('http://localhost:3001/api/historial/categorias', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setHistorialData(response.data.data);
        } else {
          console.error('Error en respuesta del historial:', response.data.error);
        }
      } catch (error) {
        console.error('Error loading historial:', error);
        // Fallback a datos de ejemplo si hay error
        const mockData = {
          añadidos: [
            { id: 1, tipo: 'añadido' as const, numero_hr: 'Sin datos', referencia: 'No hay conexión con el servidor', procedencia: '', fecha: new Date().toISOString(), usuario_nombre: 'Sistema' }
          ],
          editados: [
            { id: 2, tipo: 'editado' as const, numero_hr: 'Sin datos', referencia: 'No hay conexión con el servidor', procedencia: '', fecha: new Date().toISOString(), usuario_nombre: 'Sistema' }
          ],
          enviados: [
            { id: 3, tipo: 'enviado' as const, numero_hr: 'Sin datos', destinatario: 'No hay conexión con el servidor', fecha: new Date().toISOString(), usuario_nombre: 'Sistema' }
          ]
        };
        setHistorialData(mockData);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadHistorialData();
    }
  }, [token]);

  const formatFecha = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHoras < 1) return 'Hace menos de 1 hora';
    if (diffHoras < 24) return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    if (diffDias === 1) return 'Ayer';
    if (diffDias < 7) return `Hace ${diffDias} días`;
    return fecha.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6 rounded-2xl p-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div className="w-12 h-12 flex items-center justify-center rounded-sm" style={{ background: 'var(--color-esmeralda)' }}>
            <HistorialIcon width={24} height={24} fill="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Historial de Actividades</h1>
            <p className="text-white/70">Registro completo de movimientos y cambios del sistema</p>
          </div>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl p-4" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-400">{historialData.añadidos.length}</div>
              <div className="text-sm text-white/70">Documentos Añadidos</div>
            </div>
            <CheckIcon width={24} height={24} fill="#4ade80" />
          </div>
        </div>
        <div className="rounded-2xl p-4" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-400">{historialData.editados.length}</div>
              <div className="text-sm text-white/70">Documentos Editados</div>
            </div>
            <EditarIcon width={24} height={24} fill="#facc15" />
          </div>
        </div>
        <div className="rounded-2xl p-4" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-400">{historialData.enviados.length}</div>
              <div className="text-sm text-white/70">Documentos Enviados</div>
            </div>
            <EnviarIcon width={24} height={24} fill="#60a5fa" />
          </div>
        </div>
      </div>

      {/* Secciones del Historial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Últimos Añadidos */}
        <div className="rounded-2xl" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div className="p-4 border-b border-[rgba(255,255,255,0.15)]">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-green-400">
              <CheckIcon width={20} height={20} fill="#4ade80" />
              Últimos Añadidos
            </h2>
            <p className="text-sm text-white/60">Documentos recién ingresados al sistema</p>
          </div>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {historialData.añadidos.map((item) => (
              <div key={item.id} className="rounded-xl p-3" style={{
                background: 'rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <div className="font-medium text-white">H.R. {item.numero_hr}</div>
                <div className="text-sm text-white/80 mt-1">{item.referencia}</div>
                <div className="text-xs text-green-400 mt-1">De: {item.procedencia}</div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-white/50">{formatFecha(item.fecha_actividad)}</div>
                  <div className="text-xs text-white/60">{item.usuario_nombre || 'Sistema'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimos Editados */}
        <div className="rounded-2xl" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div className="p-4 border-b border-[rgba(255,255,255,0.15)]">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-yellow-400">
              <EditarIcon width={20} height={20} fill="#facc15" />
              Últimos Editados
            </h2>
            <p className="text-sm text-white/60">Documentos modificados recientemente</p>
          </div>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {historialData.editados.map((item) => (
              <div key={item.id} className="rounded-xl p-3" style={{
                background: 'rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <div className="font-medium text-white">H.R. {item.numero_hr}</div>
                <div className="text-sm text-white/80 mt-1">{item.referencia}</div>
                <div className="text-xs text-yellow-400 mt-1">De: {item.procedencia}</div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-white/50">{formatFecha(item.fecha_actividad)}</div>
                  <div className="text-xs text-white/60">{item.usuario_nombre || 'Sistema'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimos Enviados */}
        <div className="rounded-2xl" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div className="p-4 border-b border-[rgba(255,255,255,0.15)]">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-blue-400">
              <EnviarIcon width={20} height={20} fill="#60a5fa" />
              Últimos Enviados
            </h2>
            <p className="text-sm text-white/60">Documentos enviados a instituciones</p>
          </div>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {historialData.enviados.map((item) => (
              <div key={item.id} className="rounded-xl p-3" style={{
                background: 'rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <div className="font-medium text-white">H.R. {item.numero_hr}</div>
                <div className="text-sm text-white/80 mt-1">Para: {item.destinatario}</div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-white/50">{formatFecha(item.fecha_actividad)}</div>
                  <div className="text-xs text-white/60">{item.usuario_nombre || 'Sistema'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Botón de Ver Más */}
      <div className="mt-8 text-center">
        <button 
          style={{ background: 'var(--color-esmeralda)' }}
          className="px-8 py-3 rounded-sm text-white font-medium hover:opacity-90 transition-opacity"
        >
          <DocumentosIcon width={18} height={18} fill="white" className="mr-2" />
          Ver Historial Completo
        </button>
      </div>
    </div>
  );
};

export default HistorialPage;