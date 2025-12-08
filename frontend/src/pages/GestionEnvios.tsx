import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import SendIcon from '../assets/send';
import CheckIcon from '../assets/Check';
import CirculoOnIcon from '../assets/circuloOn';
import CirculoOffIcon from '../assets/circuloOFF';
import HistorialIcon from '../assets/historial';

interface Envio {
  id: number;
  hoja_id?: number;
  destinatario_nombre: string;
  destinatario_correo?: string;
  destinatario_numero?: string;
  destino_id?: number;
  destino_nombre?: string;
  comentarios?: string;
  estado: string;
  fecha_envio?: string;
  fecha_entrega?: string;
  created_at: string;
  numero_hr?: string;
  referencia?: string;
  usuario_nombre?: string;
}

const GestionEnvios: React.FC = () => {
  const { token } = useAuth();
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');

  const estadosDisponibles = [
    { valor: 'registrado', nombre: 'Registrado', color: 'bg-slate-500', icon: CirculoOffIcon },
    { valor: 'enviado', nombre: 'Enviado', color: 'bg-blue-600', icon: SendIcon },
    { valor: 'entregado', nombre: 'Entregado', color: 'bg-green-600', icon: CheckIcon },
    { valor: 'cancelado', nombre: 'Cancelado', color: 'bg-red-600', icon: CirculoOnIcon }
  ];

  // Cargar envíos
  useEffect(() => {
    const fetchEnvios = async () => {
      if (!token) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/enviar`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEnvios(response.data.envios || []);
      } catch (err) {
        console.error('Error al cargar envíos:', err);
        setMessage('Error al cargar la lista de envíos');
      } finally {
        setLoading(false);
      }
    };

    fetchEnvios();
  }, [token]);

  // Actualizar estado de envío
  const actualizarEstado = async (envioId: number, nuevoEstado: string) => {
    if (!token) {
      setMessage('Error: No hay token de autenticación. Inicia sesión nuevamente.');
      return;
    }

    console.log('🔑 Token disponible:', token ? 'Sí' : 'No');
    console.log('📤 Actualizando envío:', envioId, 'a estado:', nuevoEstado);

    setUpdating(envioId);
    try {
      const payload: any = { estado: nuevoEstado };
      
      // Si se marca como entregado, agregar fecha de entrega
      if (nuevoEstado === 'entregado') {
        payload.fecha_entrega = new Date().toISOString();
      }

      console.log('📦 Payload a enviar:', payload);
      console.log('🌐 URL:', `${API_BASE_URL}/api/enviar/${envioId}/estado`);

      const response = await axios.put(
        `${API_BASE_URL}/api/enviar/${envioId}/estado`, 
        payload,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('✅ Respuesta del servidor:', response.data);

      if (response.data.success) {
        setMessage(`Envío marcado como ${nuevoEstado}`);
        
        // Actualizar la lista local
        setEnvios(prev => prev.map(envio => 
          envio.id === envioId 
            ? { ...envio, estado: nuevoEstado, fecha_entrega: payload.fecha_entrega }
            : envio
        ));
      }
    } catch (err: any) {
      console.error('❌ Error completo:', err);
      console.error('❌ Respuesta del servidor:', err.response?.data);
      console.error('❌ Status:', err.response?.status);
      setMessage(err.response?.data?.error || 'Error al actualizar estado del envío');
    } finally {
      setUpdating(null);
    }
  };

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoInfo = (estado: string) => {
    return estadosDisponibles.find(e => e.valor === estado) || estadosDisponibles[0];
  };

  const enviosFiltrados = filtroEstado 
    ? envios.filter(e => e.estado === filtroEstado)
    : envios;

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
            <h1 className="text-2xl font-bold text-white">Gestión de Envíos</h1>
            <p className="text-white/70">Administra y actualiza el estado de los envíos registrados</p>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-sm border ${
          message.includes('Error') 
            ? 'bg-red-600/20 text-red-100 border-red-500/30' 
            : 'bg-green-600/20 text-green-100 border-green-500/30'
        }`}>
          <span className="font-medium">{message}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="mb-6 flex items-center gap-4 p-4 rounded-xl" style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        <label className="text-white/90 font-medium">Filtrar por estado:</label>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="p-2 border rounded-xl text-white"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderColor: 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <option value="">Todos los estados</option>
          {estadosDisponibles.map(estado => (
            <option key={estado.valor} value={estado.valor} className="bg-gray-800">
              {estado.nombre}
            </option>
          ))}
        </select>
        <div className="text-white/60">
          {enviosFiltrados.length} envío{enviosFiltrados.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-white/70">Cargando envíos...</div>
        </div>
      )}

      {/* Lista de Envíos */}
      {!loading && (
        <div className="space-y-4">
          {enviosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              {filtroEstado ? `No hay envíos con estado "${getEstadoInfo(filtroEstado).nombre}"` : 'No hay envíos registrados'}
            </div>
          ) : (
            enviosFiltrados.map((envio) => {
              const estadoInfo = getEstadoInfo(envio.estado);
              const IconComponent = estadoInfo.icon;
              
              return (
                <div key={envio.id} className="rounded-2xl p-6" style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}>
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* Información del Destinatario */}
                    <div>
                      <h4 className="font-medium text-white/90 mb-2">Destinatario</h4>
                      <div className="text-white/80 font-medium">{envio.destinatario_nombre}</div>
                      {envio.destinatario_correo && (
                        <div className="text-sm text-white/60">{envio.destinatario_correo}</div>
                      )}
                      {envio.destinatario_numero && (
                        <div className="text-sm text-white/60">{envio.destinatario_numero}</div>
                      )}
                    </div>

                    {/* Información del Envío */}
                    <div>
                      <h4 className="font-medium text-white/90 mb-2">Detalles del Envío</h4>
                      {envio.destino_nombre && (
                        <div className="text-sm text-white/70 mb-1">
                          <strong>Destino:</strong> {envio.destino_nombre}
                        </div>
                      )}
                      {envio.numero_hr && (
                        <div className="text-sm text-white/70 mb-1">
                          <strong>H.R.:</strong> {envio.numero_hr}
                          {envio.referencia && ` - ${envio.referencia}`}
                        </div>
                      )}
                      <div className="text-sm text-white/60">
                        <strong>Creado:</strong> {formatearFecha(envio.created_at)}
                      </div>
                    </div>

                    {/* Estado Actual */}
                    <div>
                      <h4 className="font-medium text-white/90 mb-2">Estado</h4>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-sm ${estadoInfo.color} text-white`}>
                        <IconComponent width={16} height={16} fill="white" />
                        {estadoInfo.nombre}
                      </div>
                      {envio.fecha_envio && (
                        <div className="text-sm text-white/60 mt-1">
                          Enviado: {formatearFecha(envio.fecha_envio)}
                        </div>
                      )}
                      {envio.fecha_entrega && (
                        <div className="text-sm text-white/60 mt-1">
                          Entregado: {formatearFecha(envio.fecha_entrega)}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div>
                      <h4 className="font-medium text-white/90 mb-2">Acciones</h4>
                      <div className="space-y-2">
                        {estadosDisponibles
                          .filter(estado => estado.valor !== envio.estado)
                          .map(estado => {
                            const IconComp = estado.icon;
                            return (
                              <button
                                key={estado.valor}
                                onClick={() => actualizarEstado(envio.id, estado.valor)}
                                disabled={updating === envio.id}
                                className={`w-full p-2 rounded-sm ${estado.color} text-white text-sm hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2 justify-center`}
                              >
                                <IconComp width={14} height={14} fill="white" />
                                {updating === envio.id ? 'Actualizando...' : `Marcar como ${estado.nombre}`}
                              </button>
                            );
                          })
                        }
                      </div>
                    </div>
                  </div>

                  {/* Comentarios */}
                  {envio.comentarios && (
                    <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                      <h5 className="font-medium text-white/90 mb-2">Comentarios</h5>
                      <div className="text-white/70 text-sm">{envio.comentarios}</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default GestionEnvios;