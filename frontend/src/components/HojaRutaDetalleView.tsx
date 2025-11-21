import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
import DescargarIcon from '../assets/descargar';
import RelojIcon from '../assets/reloj';
import CronometroIcon from '../assets/cronometro';
import ArchivoIcon from '../assets/archivo';
import LupayIcon from '../assets/lupay';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUbicacionModal, setShowUbicacionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<number>(0);
  const [destinos, setDestinos] = useState<any[]>([]);
  const [loadingDestinos, setLoadingDestinos] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const tiposInstruccion = [
    'Para su conocimiento',
    'Preparar respuesta o informe', 
    'Analizar y emitir opinión',
    'Procesar de acuerdo a normas',
    'Dar curso si legalmente es procedente',
    'Elaborar Resolución',
    'Elaborar Contrato',
    'Archivar'
  ];

  const estadosDisponibles = [
    { 
      valor: 'pendiente', 
      nombre: 'Pendiente', 
      color: 'bg-slate-500 hover:bg-slate-600', 
      colorDark: 'bg-slate-600',
      textColor: 'text-slate-600',
      icon: CirculoOffIcon,
      descripcion: 'Documento recibido, esperando procesamiento'
    },
    { 
      valor: 'enviada', 
      nombre: 'Enviada', 
      color: 'bg-slate-700 hover:bg-slate-800', 
      colorDark: 'bg-slate-800',
      textColor: 'text-slate-700',
      icon: SendIcon,
      descripcion: 'Documento enviado al área correspondiente'
    },
    { 
      valor: 'en_proceso', 
      nombre: 'En Proceso', 
      color: 'bg-blue-700 hover:bg-blue-800', 
      colorDark: 'bg-blue-800',
      textColor: 'text-blue-700',
      icon: CirculoOnIcon,
      descripcion: 'Documento en proceso de trabajo'
    },
    { 
      valor: 'finalizada', 
      nombre: 'Finalizada', 
      color: 'bg-emerald-700 hover:bg-emerald-800', 
      colorDark: 'bg-emerald-800',
      textColor: 'text-emerald-700',
      icon: CheckIcon,
      descripcion: 'Proceso completado exitosamente'
    },
    { 
      valor: 'archivada', 
      nombre: 'Archivada', 
      color: 'bg-slate-600 hover:bg-slate-700', 
      colorDark: 'bg-slate-700',
      textColor: 'text-slate-600',
      icon: ArchivoIcon,
      descripcion: 'Documento archivado permanentemente'
    }
  ];

  useEffect(() => {
    fetchHojaCompleta();
    fetchDestinos();
  }, [hoja?.id]);

  // Cargar destinos desde la base de datos
  const fetchDestinos = async () => {
    try {
      setLoadingDestinos(true);
      const response = await axios.get('http://localhost:3001/api/destinos');
      
      console.log('📦 Respuesta de destinos:', response.data);
      
      if (response.data.success) {
        // Aplanar las categorías en un solo array
        const destinosAplanados: any[] = [];
        Object.keys(response.data.destinos).forEach(categoria => {
          response.data.destinos[categoria].forEach((destino: any) => {
            // Añadir el tipo basado en la categoría
            const tipo = categoria === 'Centros de Acogida' ? 'centro_acogida' :
                        categoria === 'Direcciones Administrativas' ? 'direccion' : 'otro';
            destinosAplanados.push({
              ...destino,
              tipo: tipo
            });
          });
        });
        setDestinos(destinosAplanados);
        console.log('✅ Destinos cargados:', destinosAplanados.length, 'destinos');
        console.log('📋 Destinos con tipos:', destinosAplanados.slice(0, 5));
      }
    } catch (error) {
      console.error('❌ Error al cargar destinos:', error);
      toast.error('Error al cargar lista de destinos');
    } finally {
      setLoadingDestinos(false);
    }
  };

  // Funciones para manejar la edición de secciones
  const abrirModalEdicion = (seccion: number) => {
    setEditingSection(seccion);
    setShowEditModal(true);
  };

  const guardarEdicionSeccion = async (seccionData: any) => {
    if (!hojaCompleta) return;
    
    try {
      setActualizandoEstado(true);
      console.log('📝 Datos de la sección a guardar:', seccionData);
      
      // Preparar datos para actualización
      const updateData: any = {};
      
      if (editingSection === 0) {
        // Sección principal
        if (seccionData.destino) updateData.destino = seccionData.destino;
        if (seccionData.instrucciones && Array.isArray(seccionData.instrucciones)) {
          updateData.destinos = seccionData.instrucciones;
        }
        if (seccionData.instruccionesAdicionales) {
          updateData.instrucciones_adicionales = seccionData.instruccionesAdicionales;
        }
      } else {
        // Secciones adicionales (1, 2, 3)
        if (seccionData.fechaRecepcion) {
          updateData[`fecha_recepcion_${editingSection}`] = seccionData.fechaRecepcion;
        }
        if (seccionData.destino) {
          updateData[`destino_${editingSection}`] = seccionData.destino;
        }
        if (seccionData.instrucciones && Array.isArray(seccionData.instrucciones)) {
          updateData[`destinos_${editingSection}`] = seccionData.instrucciones;
        }
        if (seccionData.instruccionesAdicionales) {
          updateData[`instrucciones_adicionales_${editingSection}`] = seccionData.instruccionesAdicionales;
        }
      }
      
      console.log('🔄 Enviando al backend:', updateData);
      
      // Enviar actualización al backend
      const response = await axios.put(`http://localhost:3001/api/hojas-ruta/${hojaCompleta.id}`, updateData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Respuesta del backend:', response.data);
      
      if (response.data.success) {
        // Actualizar estado local combinando los datos existentes con los nuevos
        const updatedHoja = { ...hojaCompleta, ...updateData };
        setHojaCompleta(updatedHoja);
        setShowEditModal(false);
        toast.success(`Sección ${editingSection === 0 ? 'principal' : editingSection} actualizada correctamente`);
      } else {
        throw new Error(response.data.message || 'Error al actualizar');
      }
      
    } catch (error: any) {
      console.error('❌ Error al actualizar sección:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al actualizar la sección';
      toast.error(errorMessage);
    } finally {
      setActualizandoEstado(false);
    }
  };

  // Componente Modal de Edición
  const ModalEdicionSeccion = () => {
    const [formData, setFormData] = useState({
      fechaRecepcion: '',
      destino: '',
      destinoPersonalizado: '',
      instrucciones: [] as string[],
      instruccionesAdicionales: ''
    });

    const [mostrarDestinoPersonalizado, setMostrarDestinoPersonalizado] = useState(false);

    console.log('🔧 ModalEdicionSeccion renderizado:', {
      editingSection,
      totalDestinos: destinos.length,
      loadingDestinos,
      destinosArray: destinos.slice(0, 2)
    });

    // Filtrar destinos según el contexto
    const destinosParaSeleccion = destinos.filter(d => 
      editingSection === 0 ? 
        ['centro_acogida', 'direccion', 'departamento'].includes(d.tipo) : // Para envío principal
        ['centro_acogida'].includes(d.tipo) // Para recepciones, solo centros
    );

    console.log('🔍 Filtrado destinos:', {
      totalDestinos: destinos.length,
      editingSection,
      destinosFiltrados: destinosParaSeleccion.length,
      tiposDisponibles: destinos.map(d => d.tipo).filter((v, i, a) => a.indexOf(v) === i),
      destinosParaSeleccion: destinosParaSeleccion.slice(0, 3)
    });

    const handleInstruccionToggle = (instruccion: string) => {
      setFormData(prev => ({
        ...prev,
        instrucciones: prev.instrucciones.includes(instruccion)
          ? prev.instrucciones.filter(i => i !== instruccion)
          : [...prev.instrucciones, instruccion]
      }));
    };

    return createPortal(
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Editar {editingSection === 0 ? 'Envío Principal' : `Recepción ${editingSection}`}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Fecha de Recepción (solo para secciones 1, 2, 3) */}
              {editingSection > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Recepción
                  </label>
                  <input
                    type="date"
                    value={formData.fechaRecepcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, fechaRecepcion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Destino */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destino
                </label>
                <select
                  value={formData.destino}
                  onChange={(e) => {
                    const valor = e.target.value;
                    console.log('📝 Cambio de destino:', valor);
                    setFormData(prev => ({ ...prev, destino: valor }));
                    setMostrarDestinoPersonalizado(valor === 'personalizado');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loadingDestinos}
                >
                  <option value="">Seleccionar destino...</option>
                  {console.log('🏗️ Renderizando opciones:', destinosParaSeleccion.length, 'destinos')}
                  {destinosParaSeleccion.map(destino => (
                    <option key={destino.id} value={destino.nombre}>
                      {destino.nombre}
                    </option>
                  ))}
                  <option value="personalizado">🖊️ Escribir otro destino...</option>
                </select>
                
                {/* Campo para destino personalizado */}
                {mostrarDestinoPersonalizado && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destino Personalizado
                    </label>
                    <input
                      type="text"
                      value={formData.destinoPersonalizado}
                      onChange={(e) => setFormData(prev => ({ ...prev, destinoPersonalizado: e.target.value }))}
                      placeholder="Escribir destino personalizado..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {/* Instrucciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Instrucciones
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {tiposInstruccion.map((instruccion: string) => (
                    <label key={instruccion} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={formData.instrucciones.includes(instruccion)}
                        onChange={() => handleInstruccionToggle(instruccion)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{instruccion}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Instrucciones Adicionales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instrucciones Adicionales
                </label>
                <textarea
                  value={formData.instruccionesAdicionales}
                  onChange={(e) => setFormData(prev => ({ ...prev, instruccionesAdicionales: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Instrucciones adicionales..."
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const destinoFinal = mostrarDestinoPersonalizado ? formData.destinoPersonalizado : formData.destino;
                  const datosParaGuardar = {
                    ...formData,
                    destino: destinoFinal
                  };
                  guardarEdicionSeccion(datosParaGuardar);
                }}
                disabled={actualizandoEstado}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actualizandoEstado ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const fetchHojaCompleta = async () => {
    if (!hoja?.id) {
      setError('No se proporcionó un ID válido de hoja de ruta');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Obteniendo detalles de hoja de ruta:', {
        hojaId: hoja.id,
        url: `http://localhost:3001/api/hojas-ruta/${hoja.id}`,
        hasToken: !!token
      });
      
      const response = await axios.get(`http://localhost:3001/api/hojas-ruta/${hoja.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📋 Respuesta del servidor:', {
        status: response.status,
        success: response.data.success,
        hasHoja: !!response.data.hoja,
        data: response.data
      });

      if (response.data.success) {
        setHojaCompleta(response.data.hoja);
      } else {
        setError(`Error del servidor: ${response.data.message || 'Error al obtener los datos de la hoja de ruta'}`);
      }
    } catch (error: any) {
      console.error('❌ Error al obtener hoja completa:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      
      const mensajeError = error.response?.data?.message || error.message || 'Error desconocido';
      setError(`Error al cargar los datos: ${mensajeError}`);
    } finally {
      setLoading(false);
    }
  };

  const obtenerEstadoActual = () => {
    const estadoActual = hojaCompleta?.estado || 'pendiente';
    return estadosDisponibles.find(estado => estado.valor === estadoActual) || estadosDisponibles[0];
  };

  const cambiarEstado = async (nuevoEstado: string) => {
    if (!hojaCompleta) return;
    
    try {
      console.log('🚀 === INICIO FRONTEND ===');
      console.log('📋 Estado inicial:', {
        hojaId: hojaCompleta.id,
        estadoActual: hojaCompleta.estado,
        nuevoEstado: nuevoEstado
      });

      setActualizandoEstado(true);
      
      // Mapear estados del frontend a estados válidos del backend
      const mapaEstadoBackend: { [key: string]: string } = {
        'pendiente': 'pendiente',
        'enviada': 'en_proceso',
        'en_proceso': 'en_proceso', 
        'finalizada': 'completado',
        'archivada': 'completado'
      };
      
      const estadoBackend = mapaEstadoBackend[nuevoEstado] || 'pendiente';

      console.log('🔄 Preparando solicitud:', {
        endpoint: `http://localhost:3001/api/hojas-ruta/${hojaCompleta.id}/estado`,
        nuevoEstado_frontend: nuevoEstado,
        estadoBackend_mapeado: estadoBackend,
        payload: { estado_cumplimiento: estadoBackend, estado: nuevoEstado },
        headers: { Authorization: `Bearer ${token?.substring(0, 20)}...` }
      });

      const response = await axios.patch(
        `http://localhost:3001/api/hojas-ruta/${hojaCompleta.id}/estado`,
        { 
          estado_cumplimiento: estadoBackend,
          estado: nuevoEstado
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      console.log('✅ Respuesta exitosa del servidor:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      setHojaCompleta({ ...hojaCompleta, estado: nuevoEstado, estado_cumplimiento: estadoBackend });
      toast.success(`Estado actualizado a: ${estadosDisponibles.find(e => e.valor === nuevoEstado)?.nombre}`);
      
      window.dispatchEvent(new CustomEvent('estadoActualizado', { 
        detail: { hojaId: hojaCompleta.id, nuevoEstado: estadoBackend } 
      }));
      
      console.log('🎯 === FIN FRONTEND EXITOSO ===');
      
    } catch (error: any) {
      console.error('❌ === ERROR EN FRONTEND ===');
      console.error('🔍 Detalles del error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      const mensajeError = error.response?.data?.message || error.message || 'Error desconocido';
      toast.error(`Error al actualizar el estado: ${mensajeError}`);
    } finally {
      setActualizandoEstado(false);
    }
  };

  // Cambiar ubicación del documento
  const cambiarUbicacion = async (nuevaUbicacion: string, responsable: string) => {
    if (!hojaCompleta) return;
    
    try {
      setActualizandoEstado(true);
      
      const response = await axios.patch(
        `http://localhost:3001/api/hojas-ruta/${hojaCompleta.id}/ubicacion`,
        { 
          ubicacion_actual: nuevaUbicacion,
          responsable_actual: responsable
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      setHojaCompleta({ 
        ...hojaCompleta, 
        ubicacion_actual: nuevaUbicacion, 
        responsable_actual: responsable 
      });
      
      toast.success(`Ubicación actualizada a: ${nuevaUbicacion}`);
      
    } catch (error: any) {
      console.error('❌ Error al cambiar ubicación:', error);
      const mensajeError = error.response?.data?.message || error.message || 'Error desconocido';
      toast.error(`Error al cambiar ubicación: ${mensajeError}`);
    } finally {
      setActualizandoEstado(false);
    }
  };

  const handleDescargarPDF = async () => {
    if (!printRef.current) return;
    
    try {
      toast.info('Generando PDF...');
      const element = printRef.current;
      const dataUrl = await domtoimage.toPng(element, {
        quality: 0.95,
        width: element.scrollWidth,
        height: element.scrollHeight,
        bgcolor: '#ffffff'
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (element.scrollHeight * imgWidth) / element.scrollWidth;
      let heightLeft = imgHeight;

      if (imgHeight <= pageHeight) {
        pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        let position = 0;
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }
      
      const filename = `hoja-ruta-${hojaCompleta?.numero_hr || 'documento'}.pdf`;
      pdf.save(filename);
      toast.success('PDF descargado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="bg-vino hover:bg-vino-oscuro text-white px-4 py-2 rounded-lg">
            ← Volver a Registros
          </button>
          <h1 className="text-2xl font-bold text-white">Cargando detalles...</h1>
        </div>
        <div className="bg-[rgba(0,0,0,0.18)] rounded-2xl p-8 text-center">
          <div className="flex items-center gap-2 text-white/60">
            <LupayIcon width={16} height={16} fill="currentColor" />
            <span>Cargando información de la hoja de ruta...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="bg-vino hover:bg-vino-oscuro text-white px-4 py-2 rounded-lg">
            ← Volver a Registros
          </button>
          <h1 className="text-2xl font-bold text-white">Error al cargar</h1>
        </div>
        <div className="bg-[rgba(0,0,0,0.18)] rounded-2xl p-8 text-center">
          <div className="text-red-400">{error}</div>
          <button onClick={fetchHojaCompleta} className="mt-4 bg-vino text-white px-4 py-2 rounded-lg">
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
          <button onClick={onBack} className="bg-vino hover:bg-vino-oscuro text-white px-4 py-2 rounded-lg shadow-lg">
            ← Volver a Registros
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Detalle de Hoja de Ruta</h1>
            <p className="text-white/80 text-sm">{hojaCompleta?.numero_hr} - {hojaCompleta?.referencia || 'Sin referencia'}</p>
          </div>
        </div>
        
        <button onClick={handleDescargarPDF} className="bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <DescargarIcon width={20} height={20} fill="white" />
          <div className="flex flex-col items-start">
            <span className="font-semibold text-sm">Descargar PDF</span>
            <span className="text-xs opacity-90">Generar archivo</span>
          </div>
        </button>
      </div>

      {/* SECCIÓN DE SEGUIMIENTO PROFESIONAL */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl">
        {/* Header del Estado Actual - Más Destacado */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div className={`p-6 rounded-3xl ${obtenerEstadoActual().colorDark} shadow-2xl border-4 border-white/20`}>
              {React.createElement(obtenerEstadoActual().icon, { width: 48, height: 48, fill: "white" })}
            </div>
            <div>
              <div className="flex items-center gap-4 mb-3">
                <h2 className="text-3xl font-bold text-white">Estado Actual:</h2>
                <span className={`px-6 py-3 rounded-2xl text-lg font-bold text-white ${obtenerEstadoActual().colorDark} shadow-lg border-2 border-white/30 animate-pulse`}>
                  {obtenerEstadoActual().nombre}
                </span>
              </div>
              
              {/* UBICACIÓN ACTUAL - DISEÑO PROFESIONAL */}
              <div className="bg-slate-800/80 border border-slate-600 rounded-lg p-5 mb-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-700 p-2 rounded-md">
                      <LupayIcon width={18} height={18} fill="#cbd5e1" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-200">Ubicación Actual</h3>
                  </div>
                  <button
                    onClick={() => setShowUbicacionModal(true)}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-md transition-colors duration-200 flex items-center gap-1"
                  >
                    <LupayIcon width={12} height={12} fill="currentColor" />
                    Cambiar
                  </button>
                </div>
                <div className="ml-11">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      hojaCompleta?.ubicacion_actual 
                        ? (hojaCompleta.ubicacion_actual.toLowerCase().includes('sedeges') 
                           ? 'bg-green-500' 
                           : 'bg-blue-500')
                        : 'bg-red-500'
                    }`}></div>
                    <p className="text-lg font-medium text-white">
                      {hojaCompleta?.ubicacion_actual ? (
                        hojaCompleta.ubicacion_actual.toLowerCase().includes('sedeges') ? 
                          'SEDEGES - Sede Central' : 
                          hojaCompleta.ubicacion_actual
                      ) : 'Sin ubicación definida'}
                    </p>
                  </div>
                  {hojaCompleta?.responsable_actual && (
                    <p className="text-slate-400 text-sm mt-1 ml-5">
                      Responsable: {hojaCompleta.responsable_actual}
                    </p>
                  )}
                </div>
              </div>
              
              <p className="text-white/90 text-base mb-2">{obtenerEstadoActual().descripcion}</p>
              <div className="flex items-center gap-4 text-sm text-white/70">
                {obtenerEstadoActual().valor === 'pendiente' && (
                  <span className="flex items-center gap-2">
                    <RelojIcon width={16} height={16} fill="currentColor" />
                    Esperando atención
                  </span>
                )}
                {obtenerEstadoActual().valor === 'enviada' && (
                  <span className="flex items-center gap-2">
                    <SendIcon width={16} height={16} fill="currentColor" />
                    Documento enviado
                  </span>
                )}
                {obtenerEstadoActual().valor === 'en_proceso' && (
                  <span className="flex items-center gap-2">
                    <CronometroIcon width={16} height={16} fill="currentColor" />
                    En desarrollo
                  </span>
                )}
                {(obtenerEstadoActual().valor === 'finalizada' || obtenerEstadoActual().valor === 'archivada') && (
                  <span className="flex items-center gap-2">
                    <GuardarOnIcon width={16} height={16} fill="currentColor" />
                    Proceso completado
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Historial y cambio rápido de estado */}
          <div className="flex flex-col items-end gap-3 text-white/70">
            <div className="flex items-center gap-2">
              <HistorialIcon width={20} height={20} fill="currentColor" />
              <span className="text-sm">
                Actualizado {hojaCompleta?.fecha_modificacion ? new Date(hojaCompleta.fecha_modificacion).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            
            {/* Botones de cambio rápido */}
            <div className="flex gap-2 flex-wrap justify-end">
              {estadosDisponibles
                .filter(estado => estado.valor !== hojaCompleta?.estado)
                .slice(0, 3)
                .map((estado) => (
                <button
                  key={estado.valor}
                  onClick={() => cambiarEstado(estado.valor)}
                  disabled={actualizandoEstado}
                  className={`
                    ${estado.color} disabled:opacity-50 disabled:cursor-not-allowed
                    text-white font-medium px-3 py-1.5 rounded-lg text-xs
                    transition-all duration-300 hover:scale-105 hover:shadow-lg
                    flex items-center gap-1
                  `}
                  title={`Cambiar a: ${estado.descripcion}`}
                >
                  {React.createElement(estado.icon, { width: 14, height: 14, fill: "white" })}
                  {estado.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Información adicional del documento */}
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <ArchivoIcon width={18} height={18} fill="currentColor" />
            Información del Documento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-white/70">Número HR:</span>
              <p className="text-white font-medium">{hojaCompleta?.numero_hr}</p>
            </div>
            <div>
              <span className="text-white/70">Referencia:</span>
              <p className="text-white">{hojaCompleta?.referencia || 'Sin referencia'}</p>
            </div>
            <div>
              <span className="text-white/70">Fecha Límite:</span>
              <p className="text-white">{hojaCompleta?.fecha_limite ? new Date(hojaCompleta.fecha_limite).toLocaleDateString() : 'No especificada'}</p>
            </div>
            <div>
              <span className="text-white/70">Prioridad:</span>
              <p className="text-white capitalize">{hojaCompleta?.prioridad || 'Normal'}</p>
            </div>
          </div>
        </div>

        {/* Secciones Editables de Envío y Recepción */}
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4 mt-6">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <SendIcon width={18} height={18} fill="currentColor" />
            Gestión de Envíos y Recepciones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sección Principal */}
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium text-sm">Envío Principal</h4>
                <button
                  onClick={() => abrirModalEdicion(0)}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  title="Editar envío principal"
                >
                  <LupayIcon width={16} height={16} />
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-white/70">Fecha:</span>
                  <p className="text-white">{hojaCompleta?.fecha_creacion ? new Date(hojaCompleta.fecha_creacion).toLocaleDateString() : 'No registrada'}</p>
                </div>
                <div>
                  <span className="text-white/70">Destino:</span>
                  <p className="text-white">{hojaCompleta?.destino || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-white/70">Instrucciones:</span>
                  <p className="text-white">{hojaCompleta?.destinos?.join(', ') || 'Ninguna'}</p>
                </div>
              </div>
            </div>

            {/* Secciones Adicionales 1, 2, 3 */}
            {[1, 2, 3].map(seccion => (
              <div key={seccion} className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium text-sm">Recepción {seccion}</h4>
                  <button
                    onClick={() => abrirModalEdicion(seccion)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title={`Editar recepción ${seccion}`}
                  >
                    <LupayIcon width={16} height={16} />
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-white/70">Fecha:</span>
                    <p className="text-white">{hojaCompleta?.[`fecha_recepcion_${seccion}`] || 'No registrada'}</p>
                  </div>
                  <div>
                    <span className="text-white/70">Destino:</span>
                    <p className="text-white">{hojaCompleta?.[`destino_${seccion}`] || 'No especificado'}</p>
                  </div>
                  <div>
                    <span className="text-white/70">Instrucciones:</span>
                    <p className="text-white">{hojaCompleta?.[`destinos_${seccion}`]?.join(', ') || 'Ninguna'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vista previa para PDF */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" ref={printRef}>
        <div className="p-0">
          {hojaCompleta && <HojaRutaPreview data={hojaCompleta} />}
        </div>
      </div>

      {/* Modal de Cambio de Ubicación */}
      {showUbicacionModal && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded-lg">
                    <LupayIcon width={20} height={20} fill="#475569" />
                  </div>
                  Cambiar Ubicación del Documento
                </h2>
                <button
                  onClick={() => setShowUbicacionModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Seleccionar Nueva Ubicación
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const responsable = e.target.value === 'SEDEGES' ? 'Sistema SEDEGES' : `Responsable de ${e.target.value}`;
                        cambiarUbicacion(e.target.value, responsable);
                        setShowUbicacionModal(false);
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white text-gray-800"
                    defaultValue=""
                  >
                    <option value="">-- Seleccionar ubicación --</option>
                    <option value="SEDEGES">SEDEGES - Sede Central</option>
                    {destinos.map((destino) => (
                      <option key={destino.id} value={destino.nombre}>
                        {destino.nombre}
                      </option>
                    ))}
                    <option value="ARCHIVO GENERAL">Archivo General</option>
                    <option value="ENTIDAD EXTERNA">Entidad Externa</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    El documento será transferido a la ubicación seleccionada y se actualizará su estado de seguimiento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Edición */}
      {showEditModal && <ModalEdicionSeccion />}
    </div>
  );
};

export default HojaRutaDetalleView;