import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import HojaRutaPreview from './HojaRutaPreview';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image';
import { toast } from 'react-toastify';

// Importar iconos SVG personalizados
import SendIcon from '../assets/send';
import CheckIcon from '../assets/Check';
import CirculoOnIcon from '../assets/circuloOn';
import CirculoOffIcon from '../assets/circuloOFF';
import GuardarOnIcon from '../assets/guardaron';
import HistorialIcon from '../assets/historial';

interface HojaRutaDetalleViewProps {
  hoja: any;
  onBack: () => void;
}

const HojaRutaDetalleView: React.FC<HojaRutaDetalleViewProps> = ({ hoja, onBack }) => {
  const { token } = useAuth();
  const [hojaCompleta, setHojaCompleta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Estados disponibles - Flujo: Pendiente → Enviada → En Proceso → Finalizada → Archivada
  const estadosDisponibles = [
    { 
      valor: 'pendiente', 
      nombre: 'Pendiente', 
      color: 'bg-amber-500 hover:bg-amber-600', 
      colorDark: 'bg-amber-600',
      textColor: 'text-amber-600',
      icon: CirculoOffIcon,
      descripcion: 'Documento recibido, esperando procesamiento'
    },
    { 
      valor: 'enviada', 
      nombre: 'Enviada', 
      color: 'bg-purple-500 hover:bg-purple-600', 
      colorDark: 'bg-purple-600',
      textColor: 'text-purple-600',
      icon: SendIcon,
      descripcion: 'Documento enviado al área correspondiente'
    },
    { 
      valor: 'en_proceso', 
      nombre: 'En Proceso', 
      color: 'bg-blue-500 hover:bg-blue-600', 
      colorDark: 'bg-blue-600',
      textColor: 'text-blue-600',
      icon: CirculoOnIcon,
      descripcion: 'Documento en proceso de trabajo'
    },
    { 
      valor: 'finalizada', 
      nombre: 'Finalizada', 
      color: 'bg-green-500 hover:bg-green-600', 
      colorDark: 'bg-green-600',
      textColor: 'text-green-600',
      icon: CheckIcon,
      descripcion: 'Trabajo finalizado exitosamente'
    },
    { 
      valor: 'archivada', 
      nombre: 'Archivada', 
      color: 'bg-gray-500 hover:bg-gray-600', 
      colorDark: 'bg-gray-600',
      textColor: 'text-gray-600',
      icon: HistorialIcon,
      descripcion: 'Documento archivado para consulta histórica'
    }
  ];

  // Función para actualizar estado
  const actualizarEstado = async (nuevoEstado: string) => {
    if (!hojaCompleta) return;
    
    setActualizandoEstado(true);
    try {
      const response = await axios.put(
        `http://localhost:3001/api/hojas-ruta/${hojaCompleta.id}/estado`,
        { estado: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setHojaCompleta({ ...hojaCompleta, estado: nuevoEstado });
      toast.success(`Estado actualizado a: ${estadosDisponibles.find(e => e.valor === nuevoEstado)?.nombre}`);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast.error('Error al actualizar el estado');
    } finally {
      setActualizandoEstado(false);
    }
  };

  // Función para obtener el estado actual
  const obtenerEstadoActual = () => {
    const estadoActual = hojaCompleta?.estado || 'pendiente';
    return estadosDisponibles.find(e => e.valor === estadoActual) || estadosDisponibles[0];
  };

  // Función para obtener los detalles completos de la hoja de ruta
  const fetchHojaCompleta = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/hojas-ruta/${hoja.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHojaCompleta(response.data);
      setError('');
    } catch (err) {
      console.error('Error al cargar detalles de hoja:', err);
      setError('Error al cargar los detalles de la hoja de ruta');
      setHojaCompleta(hoja);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHojaCompleta();
  }, [hoja.id, token]);

  // Función para descargar PDF
  const handleDescargarPDF = async () => {
    if (!printRef.current) return;
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const element = printRef.current;
      const dataUrl = await domtoimage.toPng(element);
      const img = new window.Image();
      img.src = dataUrl;
      img.onload = () => {
        const imgWidth = 216; // Oficio width in mm (21.6 cm)
        const pageHeight = 330; // Oficio height in mm (33 cm)
        const imgHeight = (img.height * imgWidth) / img.width;
        let heightLeft = imgHeight;
        const pdf = new jsPDF('p', 'mm', [216, 330]); // Tamaño oficio boliviano
        let position = 0;
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        const filename = `hoja-ruta-${hojaCompleta?.numero_hr || 'documento'}.pdf`;
        pdf.save(filename);
        toast.success('PDF descargado exitosamente');
      };
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="bg-[var(--color-vino)] hover:bg-[var(--color-vino-oscuro)] text-white px-4 py-2 rounded-lg">
            ← Volver a Registros
          </button>
          <h1 className="text-2xl font-bold text-white">Cargando detalles...</h1>
        </div>
        <div className="bg-[rgba(0,0,0,0.18)] rounded-2xl p-8 text-center">
          <div className="text-white/60">🔍 Cargando información de la hoja de ruta...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="bg-[var(--color-vino)] hover:bg-[var(--color-vino-oscuro)] text-white px-4 py-2 rounded-lg">
            ← Volver a Registros
          </button>
          <h1 className="text-2xl font-bold text-white">Error al cargar</h1>
        </div>
        <div className="bg-[rgba(0,0,0,0.18)] rounded-2xl p-8 text-center">
          <div className="text-red-400">{error}</div>
          <button onClick={fetchHojaCompleta} className="mt-4 bg-[var(--color-vino)] text-white px-4 py-2 rounded-lg">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="bg-[var(--color-vino)] hover:bg-[var(--color-vino-oscuro)] text-white px-4 py-2 rounded-lg shadow-lg">
            ← Volver a Registros
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Detalle de Hoja de Ruta</h1>
            <p className="text-white/80 text-sm">{hojaCompleta?.numero_hr} - {hojaCompleta?.referencia || 'Sin referencia'}</p>
          </div>
        </div>
        
        <button onClick={handleDescargarPDF} className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <span className="text-lg">📥</span>
          <div className="flex flex-col items-start">
            <span className="font-semibold text-sm">Descargar PDF</span>
            <span className="text-xs opacity-90">Generar archivo</span>
          </div>
        </button>
      </div>

      {/* SECCIÓN DE SEGUIMIENTO PROFESIONAL */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl">
        {/* Header del Estado Actual */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div className={`p-4 rounded-2xl ${obtenerEstadoActual().colorDark} shadow-lg`}>
              {React.createElement(obtenerEstadoActual().icon, { width: 40, height: 40, fill: "white" })}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">Estado Actual:</h2>
                <span className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${obtenerEstadoActual().colorDark} shadow-md`}>
                  {obtenerEstadoActual().nombre}
                </span>
              </div>
              <p className="text-white/80 text-sm mb-1">{obtenerEstadoActual().descripcion}</p>
              <div className="flex items-center gap-4 text-xs text-white/60">
                {/* Información contextual según el estado */}
                {obtenerEstadoActual().valor === 'pendiente' && (
                  <span>⏳ <strong className="text-white/90">Esperando ser enviada</strong></span>
                )}
                {obtenerEstadoActual().valor === 'enviada' && (
                  <span>� <strong className="text-white/90">Enviada a: {hojaCompleta?.procedencia || 'Destino no especificado'}</strong></span>
                )}
                {obtenerEstadoActual().valor === 'en_proceso' && (
                  <span>🔄 <strong className="text-white/90">En proceso en: {hojaCompleta?.procedencia || 'Ubicación no especificada'}</strong></span>
                )}
                {obtenerEstadoActual().valor === 'finalizada' && (
                  <span>✅ <strong className="text-white/90">Trabajo completado exitosamente</strong></span>
                )}
                {obtenerEstadoActual().valor === 'archivada' && (
                  <span>📁 <strong className="text-white/90">Documento archivado para consulta</strong></span>
                )}
                <span>⏱️ <strong className="text-white/90">
                  {hojaCompleta?.updated_at ? new Date(hojaCompleta.updated_at).toLocaleString() : 'No disponible'}
                </strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Selector de Estado Dropdown */}
        <div className="mb-8">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <CirculoOnIcon width={20} height={20} fill="white" />
            Cambiar Estado
          </h3>
          <div className="relative inline-block w-full max-w-md">
            <select
              value={obtenerEstadoActual().valor}
              onChange={(e) => {
                if (e.target.value !== obtenerEstadoActual().valor) {
                  actualizarEstado(e.target.value);
                }
              }}
              disabled={actualizandoEstado}
              className="w-full bg-black/30 border border-white/20 text-white px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 appearance-none cursor-pointer"
            >
              {estadosDisponibles.map(estado => (
                <option 
                  key={estado.valor} 
                  value={estado.valor}
                  className="bg-gray-800 text-white"
                  disabled={estado.valor === obtenerEstadoActual().valor}
                >
                  {estado.nombre} - {estado.descripcion}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Timeline Visual Profesional */}
        <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
            <HistorialIcon width={20} height={20} fill="white" />
            Flujo de Trabajo Completo
          </h3>
          <div className="flex items-center justify-between">
            {estadosDisponibles.map((estado, index) => {
              const esActual = estado.valor === obtenerEstadoActual().valor;
              const yaCompletado = estadosDisponibles.findIndex(e => e.valor === obtenerEstadoActual().valor) > index;
              
              return (
                <React.Fragment key={estado.valor}>
                  <div className="flex flex-col items-center gap-2">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${
                      esActual ? estado.colorDark + ' shadow-lg ring-2 ring-white/30' : 
                      yaCompletado || (estado.valor === 'archivada' && (estadosDisponibles.findIndex(e => e.valor === obtenerEstadoActual().valor) >= 4)) ? 'bg-green-600 shadow-md' : 
                      'bg-gray-600/50'
                    }`}>
                      {yaCompletado || (estado.valor === 'archivada' && (estadosDisponibles.findIndex(e => e.valor === obtenerEstadoActual().valor) >= 4)) ? (
                        <CheckIcon width={24} height={24} fill="white" />
                      ) : (
                        React.createElement(estado.icon, { width: 24, height: 24, fill: "white" })
                      )}
                    </div>
                    <div className={`text-center transition-all ${
                      esActual ? 'text-white font-bold' : 
                      yaCompletado || (estado.valor === 'archivada' && (estadosDisponibles.findIndex(e => e.valor === obtenerEstadoActual().valor) >= 4)) ? 'text-green-400 font-medium' : 
                      'text-gray-400'
                    }`}>
                      <div className="text-xs font-semibold">{estado.nombre}</div>
                      {esActual && (
                        <div className="text-xs text-white/70 mt-1">Actual</div>
                      )}
                    </div>
                  </div>
                  {index < estadosDisponibles.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-500 ${
                      yaCompletado ? 'bg-green-500' : 'bg-gray-600/50'
                    }`}></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tarjetas de información */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[rgba(0,0,0,0.18)] rounded-xl p-4">
          <h3 className="text-white font-semibold mb-2">Estado General</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/80 text-sm">Estado:</span>
              <span className="text-green-400 text-sm font-medium">{hojaCompleta?.estado || 'No definido'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/80 text-sm">Prioridad:</span>
              <span className="text-yellow-400 text-sm font-medium">{hojaCompleta?.prioridad || 'No definida'}</span>
            </div>
          </div>
        </div>

        <div className="bg-[rgba(0,0,0,0.18)] rounded-xl p-4">
          <h3 className="text-white font-semibold mb-2">Solicitante</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/80 text-sm">Nombre:</span>
              <span className="text-white text-sm">{hojaCompleta?.nombre_solicitante || 'No especificado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/80 text-sm">Teléfono:</span>
              <span className="text-white text-sm font-mono">{hojaCompleta?.telefono_celular || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-[rgba(0,0,0,0.18)] rounded-xl p-4">
          <h3 className="text-white font-semibold mb-2">Fechas</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/80 text-sm">Ingreso:</span>
              <span className="text-white text-sm">{hojaCompleta?.fecha_ingreso ? new Date(hojaCompleta.fecha_ingreso).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/80 text-sm">Límite:</span>
              <span className="text-white text-sm">{hojaCompleta?.fecha_limite ? new Date(hojaCompleta.fecha_limite).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-[rgba(0,0,0,0.18)] rounded-xl p-4">
          <h3 className="text-white font-semibold mb-2">Documento</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/80 text-sm">CITE:</span>
              <span className="text-white text-sm font-mono">{hojaCompleta?.cite || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/80 text-sm">N° Fojas:</span>
              <span className="text-white text-sm">{hojaCompleta?.numero_fojas || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vista previa para PDF */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" ref={printRef}>
        <div className="p-0">
          {hojaCompleta && <HojaRutaPreview data={hojaCompleta} />}
        </div>
      </div>
    </div>
  );
};

export default HojaRutaDetalleView;