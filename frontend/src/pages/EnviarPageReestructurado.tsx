import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import SendIcon from '../assets/send';
import ArchivoIcon from '../assets/archivo';
import DocumentosIcon from '../assets/documentos';
import EnviarIcon from '../assets/enviar';

interface Hoja {
  id: number;
  numero_hr: string;
  referencia?: string;
  procedencia?: string;
}

interface Destino {
  id: number;
  nombre: string;
  descripcion?: string;
}

const EnviarPageReestructurado: React.FC = () => {
  const { token } = useAuth();
  const [hojas, setHojas] = useState<Hoja[]>([]);
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState('');
  
  // Campos del formulario
  const [destinatarioNombre, setDestinatarioNombre] = useState('');
  const [destinatarioCorreo, setDestinatarioCorreo] = useState('');
  const [destinatarioNumero, setDestinatarioNumero] = useState('');
  const [destinoId, setDestinoId] = useState<number | ''>('');
  const [hojaId, setHojaId] = useState<number | ''>('');
  
  // UI states
  const [hojaSearch, setHojaSearch] = useState('');
  const [showHojaDropdown, setShowHojaDropdown] = useState(false);
  const [comentarios, setComentarios] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  // Cargar hojas y destinos disponibles
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      
      setLoadingData(true);
      try {
        // Cargar hojas de ruta
        const hojasResponse = await axios.get('http://localhost:3001/api/hojas-ruta', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHojas(hojasResponse.data || []);

        // Cargar destinos
        const destinosResponse = await axios.get('http://localhost:3001/api/enviar/destinos', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDestinos(destinosResponse.data.destinos || []);
        
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setMessage('Error al cargar datos iniciales');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!destinatarioNombre.trim()) {
      setMessage('El nombre del destinatario es obligatorio');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const archivos = files ? Array.from(files).map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        lastModified: f.lastModified
      })) : [];

      const payload = {
        hoja_id: hojaId || null,
        destinatario_nombre: destinatarioNombre.trim(),
        destinatario_correo: destinatarioCorreo.trim() || null,
        destinatario_numero: destinatarioNumero.trim() || null,
        destino_id: destinoId || null,
        comentarios: comentarios.trim() || null,
        archivos
      };

      const response = await axios.post('http://localhost:3001/api/enviar', payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 201) {
        setMessage('Envío registrado exitosamente');
        // Limpiar formulario
        setDestinatarioNombre('');
        setDestinatarioCorreo('');
        setDestinatarioNumero('');
        setDestinoId('');
        setHojaId('');
        setHojaSearch('');
        setShowHojaDropdown(false);
        setComentarios('');
        setFiles(null);
      }
    } catch (err: any) {
      console.error('Error al enviar:', err);
      const errorData = err?.response?.data;
      setMessage(errorData?.error || 'Error al procesar el envío');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setDestinatarioNombre('');
    setDestinatarioCorreo('');
    setDestinatarioNumero('');
    setDestinoId('');
    setHojaId('');
    setHojaSearch('');
    setShowHojaDropdown(false);
    setComentarios('');
    setFiles(null);
    setMessage('');
  };

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
            <EnviarIcon width={24} height={24} fill="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Gestión de Envíos - Nueva Estructura</h1>
            <p className="text-white/70">Registra envíos con destinatario completo y destino institucional</p>
          </div>
        </div>
      </div>

      {/* Loading Initial Data */}
      {loadingData && (
        <div className="mb-6 p-4 rounded-xl border bg-blue-600/20 text-blue-100 border-blue-500/30" style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}>
          <span className="font-medium">Cargando datos...</span>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl border ${
          message.includes('Error') 
            ? 'bg-red-600/20 text-red-100 border-red-500/30' 
            : 'bg-green-600/20 text-green-100 border-green-500/30'
        }`} style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}>
          <span className="font-medium">{message}</span>
        </div>
      )}

      {/* Form Section */}
      <div className="rounded-2xl p-6" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Información del Destinatario */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white/90 border-b border-white/20 pb-2">
              Información del Destinatario
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Nombre del destinatario */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-white/90">
                  <SendIcon width={16} height={16} fill="currentColor" />
                  Nombre Completo *
                </label>
                <input 
                  type="text"
                  value={destinatarioNombre}
                  onChange={(e) => setDestinatarioNombre(e.target.value)}
                  placeholder="Nombre completo del destinatario"
                  required
                  className="w-full p-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-sm text-white placeholder-white/50"
                />
              </div>

              {/* Correo electrónico */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">
                  Correo Electrónico
                </label>
                <input 
                  type="email"
                  value={destinatarioCorreo}
                  onChange={(e) => setDestinatarioCorreo(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full p-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-sm text-white placeholder-white/50"
                />
              </div>

              {/* Número de teléfono */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">
                  Número de Teléfono
                </label>
                <input 
                  type="tel"
                  value={destinatarioNumero}
                  onChange={(e) => setDestinatarioNumero(e.target.value)}
                  placeholder="70123456 o 22123456"
                  className="w-full p-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-sm text-white placeholder-white/50"
                />
              </div>
            </div>
          </div>

          {/* Información del Envío */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white/90 border-b border-white/20 pb-2">
              Información del Envío
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Destino Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">
                  Destino Institucional
                </label>
                <select
                  value={destinoId}
                  onChange={(e) => setDestinoId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-sm text-white"
                >
                  <option value="">-- Seleccionar destino --</option>
                  {destinos.map(destino => (
                    <option key={destino.id} value={destino.id} className="bg-gray-800">
                      {destino.nombre}
                    </option>
                  ))}
                </select>
                {destinoId && (
                  <div className="text-sm text-green-400">
                    ✓ Destino seleccionado: {destinos.find(d => d.id === destinoId)?.nombre}
                  </div>
                )}
              </div>

              {/* Hoja de Ruta Search */}
              <div className="space-y-2 relative">
                <label className="flex items-center gap-2 text-sm font-medium text-white/90">
                  <DocumentosIcon width={16} height={16} fill="currentColor" />
                  Hoja de Ruta (Opcional)
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    value={hojaSearch}
                    onChange={(e) => {
                      setHojaSearch(e.target.value);
                      setShowHojaDropdown(true);
                      if (!e.target.value) setHojaId('');
                    }}
                    onFocus={() => setShowHojaDropdown(true)}
                    placeholder="Buscar H.R. por número, referencia..."
                    className="w-full p-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-sm text-white placeholder-white/50"
                  />
                  {showHojaDropdown && (
                    <div className="absolute top-full left-0 right-0 bg-[rgba(0,0,0,0.9)] border border-[rgba(255,255,255,0.1)] rounded-sm mt-1 max-h-48 overflow-y-auto z-10">
                      <div 
                        onClick={() => {
                          setHojaId('');
                          setHojaSearch('');
                          setShowHojaDropdown(false);
                        }}
                        className="p-3 hover:bg-[rgba(255,255,255,0.05)] cursor-pointer text-white/70"
                      >
                        -- Sin vincular --
                      </div>
                      {hojas
                        .filter(h => 
                          hojaSearch === '' || 
                          h.numero_hr.toLowerCase().includes(hojaSearch.toLowerCase()) ||
                          (h.referencia && h.referencia.toLowerCase().includes(hojaSearch.toLowerCase())) ||
                          (h.procedencia && h.procedencia.toLowerCase().includes(hojaSearch.toLowerCase()))
                        )
                        .map(h => (
                          <div 
                            key={h.id}
                            onClick={() => {
                              setHojaId(h.id);
                              setHojaSearch(`H.R. ${h.numero_hr} — ${h.referencia || h.procedencia || 'Sin referencia'}`);
                              setShowHojaDropdown(false);
                            }}
                            className="p-3 hover:bg-[rgba(255,255,255,0.05)] cursor-pointer text-white"
                          >
                            <div className="font-medium">H.R. {h.numero_hr}</div>
                            <div className="text-sm text-white/60">{h.referencia || h.procedencia || 'Sin referencia'}</div>
                          </div>
                        ))
                      }
                      {hojas.filter(h => 
                        hojaSearch === '' || 
                        h.numero_hr.toLowerCase().includes(hojaSearch.toLowerCase()) ||
                        (h.referencia && h.referencia.toLowerCase().includes(hojaSearch.toLowerCase())) ||
                        (h.procedencia && h.procedencia.toLowerCase().includes(hojaSearch.toLowerCase()))
                      ).length === 0 && hojaSearch && (
                        <div className="p-3 text-white/50">No se encontraron hojas de ruta</div>
                      )}
                    </div>
                  )}
                </div>
                {hojaId && (
                  <div className="text-sm text-green-400">
                    ✓ H.R. seleccionada: {hojas.find(h => h.id === hojaId)?.numero_hr}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-white/90">
              <ArchivoIcon width={16} height={16} fill="currentColor" />
              Archivos Adjuntos
            </label>
            <input 
              type="file" 
              multiple 
              onChange={(e) => setFiles(e.target.files)}
              className="w-full p-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-medium file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            />
            {files && files.length > 0 && (
              <div className="text-sm text-green-400">
                ✓ {files.length} archivo{files.length > 1 ? 's' : ''} seleccionado{files.length > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">
              Comentarios Adicionales
            </label>
            <textarea 
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Información adicional sobre el envío..."
              rows={4}
              className="w-full p-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-sm text-white placeholder-white/50 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.08)]">
            <div className="text-sm text-white/60">
              * Campos obligatorios
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={limpiarFormulario}
                disabled={loading}
                className="px-4 py-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-sm text-white/90 hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-50"
              >
                Limpiar
              </button>
              <button 
                disabled={loading || !destinatarioNombre.trim()} 
                type="submit" 
                style={{ background: loading ? 'rgba(0,0,0,0.3)' : 'var(--color-esmeralda)' }}
                className="px-6 py-2 rounded-sm text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <SendIcon width={16} height={16} fill="white" />
                {loading ? 'Procesando...' : 'Registrar Envío'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Información adicional */}
      <div className="mt-6 p-4 rounded-2xl" style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        <h4 className="font-medium text-white/90 mb-2">Funcionalidades Agregadas:</h4>
        <ul className="text-sm text-white/70 space-y-1">
          <li>• <strong>Destinatario completo:</strong> Nombre, correo y teléfono</li>
          <li>• <strong>Destino institucional:</strong> Vinculado a la tabla de destinos</li>
          <li>• <strong>Actualización automática:</strong> Cuando se marque como enviado, actualizará el estado de la hoja de ruta</li>
          <li>• <strong>Seguimiento mejorado:</strong> Registro automático en el historial de seguimiento</li>
        </ul>
      </div>
    </div>
  );
};

export default EnviarPageReestructurado;