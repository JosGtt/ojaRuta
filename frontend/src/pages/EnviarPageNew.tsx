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

const EnviarPage: React.FC = () => {
  const { token } = useAuth();
  const [hojas, setHojas] = useState<Hoja[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [destinatario, setDestinatario] = useState('');
  const [hojaId, setHojaId] = useState<number | ''>('');
  const [hojaSearch, setHojaSearch] = useState('');
  const [showHojaDropdown, setShowHojaDropdown] = useState(false);
  const [comentarios, setComentarios] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  // Cargar hojas disponibles
  useEffect(() => {
    const fetchHojas = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/hojas-ruta', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHojas(response.data || []);
      } catch (err) {
        console.error('Error al cargar hojas:', err);
        setMessage('Error al cargar las hojas de ruta disponibles');
      }
    };

    if (token) {
      fetchHojas();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!destinatario.trim()) {
      setMessage('El destinatario es obligatorio');
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
        destinatario: destinatario.trim(),
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
        setDestinatario('');
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

  return (
    <div style={{ background: 'var(--color-vino-oscuro)' }} className="p-6 text-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 flex items-center justify-center rounded-sm" style={{ background: 'var(--color-esmeralda)' }}>
            <EnviarIcon width={24} height={24} fill="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Gestión de Envíos</h1>
            <p className="text-white/70">Registra envíos de documentos institucionales</p>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className="mb-6 p-4 rounded-sm border bg-blue-600/20 text-blue-100 border-blue-500/30">
          <span className="font-medium">{message}</span>
        </div>
      )}

      {/* Form Section */}
      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <div className="text-sm text-green-400">✓ H.R. seleccionada: {hojas.find(h => h.id === hojaId)?.numero_hr}</div>
              )}
            </div>

            {/* Destinatario */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-white/90">
                <SendIcon width={16} height={16} fill="currentColor" />
                Destinatario *
              </label>
              <input 
                type="text"
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                placeholder="Nombre completo, email o institución"
                required
                className="w-full p-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-sm text-white placeholder-white/50"
              />
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
              className="w-full p-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-sm text-white"
            />
            {files && files.length > 0 && (
              <div className="text-sm text-white/60">
                {files.length} archivo{files.length > 1 ? 's' : ''} seleccionado{files.length > 1 ? 's' : ''}
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
                onClick={() => {
                  setDestinatario('');
                  setHojaId('');
                  setHojaSearch('');
                  setShowHojaDropdown(false);
                  setComentarios('');
                  setFiles(null);
                  setMessage('');
                }}
                disabled={loading}
                className="px-4 py-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-sm text-white/90 hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-50"
              >
                Limpiar
              </button>
              <button 
                disabled={loading || !destinatario.trim()} 
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

      {/* Historial de Actividades Recientes */}
      <div className="mt-8 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 flex items-center justify-center rounded-sm" style={{ background: 'var(--color-esmeralda)' }}>
            <span className="text-white text-sm">📋</span>
          </div>
          <h2 className="text-xl font-semibold text-white">Historial de Actividades</h2>
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Últimos Añadidos */}
            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-sm p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-green-400 mb-3">
                <span>✅</span> Últimos Añadidos
              </h3>
              <div className="space-y-2 text-sm">
                <div className="text-white/80">
                  <div className="font-medium">H.R. 2024-001</div>
                  <div className="text-white/60">Hace 2 horas</div>
                </div>
                <div className="text-white/80">
                  <div className="font-medium">H.R. 2024-002</div>
                  <div className="text-white/60">Hace 5 horas</div>
                </div>
                <div className="text-white/80">
                  <div className="font-medium">H.R. 2024-003</div>
                  <div className="text-white/60">Ayer</div>
                </div>
              </div>
            </div>

            {/* Últimos Editados */}
            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-sm p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-yellow-400 mb-3">
                <span>📝</span> Últimos Editados
              </h3>
              <div className="space-y-2 text-sm">
                <div className="text-white/80">
                  <div className="font-medium">H.R. 2023-195</div>
                  <div className="text-white/60">Hace 1 hora</div>
                </div>
                <div className="text-white/80">
                  <div className="font-medium">H.R. 2023-194</div>
                  <div className="text-white/60">Hace 3 horas</div>
                </div>
                <div className="text-white/80">
                  <div className="font-medium">H.R. 2023-193</div>
                  <div className="text-white/60">Hace 6 horas</div>
                </div>
              </div>
            </div>

            {/* Últimos Enviados */}
            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-sm p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-blue-400 mb-3">
                <span>📤</span> Últimos Enviados
              </h3>
              <div className="space-y-2 text-sm">
                <div className="text-white/80">
                  <div className="font-medium">Ministerio de Salud</div>
                  <div className="text-white/60">H.R. 2024-001 - Hace 30 min</div>
                </div>
                <div className="text-white/80">
                  <div className="font-medium">Alcaldía Municipal</div>
                  <div className="text-white/60">H.R. 2023-198 - Hace 2 horas</div>
                </div>
                <div className="text-white/80">
                  <div className="font-medium">Gobernación</div>
                  <div className="text-white/60">H.R. 2023-197 - Hace 4 horas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnviarPage;