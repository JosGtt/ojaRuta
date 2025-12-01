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
import EditarIcon from '../assets/editar';

interface HojaRutaDetalleViewProps {
  hoja: any;
  onBack: () => void;
}

const HojaRutaDetalleView: React.FC<HojaRutaDetalleViewProps> = ({ hoja, onBack }) => {
  const { token, canEdit, canCreate, user } = useAuth();
  const [hojaCompleta, setHojaCompleta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUbicacionModal, setShowUbicacionModal] = useState(false);
  const [showEditCompleteModal, setShowEditCompleteModal] = useState(false);
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
      color: 'bg-slate-600 hover:bg-slate-700 border border-slate-400', 
      colorDark: 'bg-slate-700 border-2 border-slate-400',
      textColor: 'text-slate-600',
      icon: CirculoOffIcon,
      descripcion: 'Documento recibido, esperando procesamiento'
    },
    { 
      valor: 'enviada', 
      nombre: 'Enviada', 
      color: 'bg-slate-700 hover:bg-slate-800 border border-slate-500', 
      colorDark: 'bg-slate-800 border-2 border-slate-500',
      textColor: 'text-slate-700',
      icon: SendIcon,
      descripcion: 'Documento enviado al área correspondiente (puede haber sido actualizado automáticamente desde envíos)'
    },
    { 
      valor: 'en_proceso', 
      nombre: 'En Proceso', 
      color: 'bg-indigo-600 hover:bg-indigo-700 border border-indigo-400', 
      colorDark: 'bg-indigo-700 border-2 border-indigo-400',
      textColor: 'text-indigo-600',
      icon: CirculoOnIcon,
      descripcion: 'Documento en proceso de trabajo'
    },
    { 
      valor: 'finalizada', 
      nombre: 'Finalizada', 
      color: 'bg-emerald-600 hover:bg-emerald-700 border border-emerald-400', 
      colorDark: 'bg-emerald-700 border-2 border-emerald-400',
      textColor: 'text-emerald-600',
      icon: CheckIcon,
      descripcion: 'Proceso completado exitosamente'
    },
    { 
      valor: 'archivada', 
      nombre: 'Archivada', 
      color: 'bg-stone-600 hover:bg-stone-700 border border-stone-400', 
      colorDark: 'bg-stone-700 border-2 border-stone-400',
      textColor: 'text-stone-600',
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

  // Función para actualizar la hoja de ruta completa
  const guardarEdicionCompleta = async (formData: any) => {
    if (!hojaCompleta) return;
    
    try {
      setActualizandoEstado(true);
      console.log('📝 Datos completos a guardar:', formData);
      
      // Enviar actualización al backend
      const response = await axios.put(`http://localhost:3001/api/hojas-ruta/${hojaCompleta.id}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Respuesta del backend:', response.data);
      
      if (response.data.success) {
        // Actualizar estado local con todos los nuevos datos
        const updatedHoja = { ...hojaCompleta, ...formData };
        setHojaCompleta(updatedHoja);
        setShowEditCompleteModal(false);
        toast.success('Hoja de ruta actualizada correctamente');
        
        // Refrescar los datos desde el servidor para asegurar consistencia
        await fetchHojaCompleta();
      } else {
        throw new Error(response.data.message || 'Error al actualizar');
      }
      
    } catch (error: any) {
      console.error('❌ Error al actualizar hoja completa:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al actualizar la hoja de ruta';
      toast.error(errorMessage);
    } finally {
      setActualizandoEstado(false);
    }
  };

  // Componente Modal de Edición Completa
  const ModalEdicionCompleta = () => {
    const [formData, setFormData] = useState({
      numero_hr: '',
      nombre_solicitante: '',
      telefono_celular: '',
      referencia: '',
      procedencia: '',
      fecha_limite: '',
      fecha_ingreso: '',
      cite: '',
      numero_fojas: '',
      prioridad: 'rutinario',
      estado: 'pendiente',
      observaciones: ''
    });
    
    // Estado para controlar qué campos están siendo editados
    const [camposEditando, setCamposEditando] = useState<{[key: string]: boolean}>({});
    const [datosLoaded, setDatosLoaded] = useState(false);

    // Cargar datos iniciales cuando se abre el modal o cuando cambian los datos
    React.useEffect(() => {
      if (hojaCompleta) {
        console.log('🔄 Cargando datos de hoja completa en modal:', hojaCompleta);
        
        const newFormData = {
          numero_hr: hojaCompleta.numero_hr || '',
          nombre_solicitante: hojaCompleta.nombre_solicitante || '',
          telefono_celular: hojaCompleta.telefono_celular || '',
          referencia: hojaCompleta.referencia || '',
          procedencia: hojaCompleta.procedencia || '',
          fecha_limite: hojaCompleta.fecha_limite ? hojaCompleta.fecha_limite.split('T')[0] : '',
          fecha_ingreso: hojaCompleta.fecha_ingreso ? hojaCompleta.fecha_ingreso.split('T')[0] : '',
          cite: hojaCompleta.cite || '',
          numero_fojas: hojaCompleta.numero_fojas?.toString() || '',
          prioridad: hojaCompleta.prioridad || 'rutinario',
          estado: hojaCompleta.estado || 'pendiente',
          observaciones: hojaCompleta.observaciones || ''
        };
        
        console.log('📝 Datos formateados para el formulario:', newFormData);
        setFormData(newFormData);
        setDatosLoaded(true);
      }
    }, [hojaCompleta]);

    // Función para alternar modo edición de un campo
    const toggleEditField = (fieldName: string) => {
      setCamposEditando(prev => ({
        ...prev,
        [fieldName]: !prev[fieldName]
      }));
    };

    // Función para editar todos los campos
    const toggleEditAllFields = () => {
      const allFields = [
        'numero_hr', 'nombre_solicitante', 'telefono_celular', 'referencia', 
        'procedencia', 'fecha_limite', 'fecha_ingreso', 'cite', 'numero_fojas', 
        'prioridad', 'estado', 'observaciones'
      ];
      const allEditing = allFields.every(field => camposEditando[field]);
      
      const newState: {[key: string]: boolean} = {};
      allFields.forEach(field => {
        newState[field] = !allEditing;
      });
      setCamposEditando(newState);
    };

    // Componente para campo editable
    const EditableField = ({ 
      label, 
      fieldName, 
      value, 
      type = 'text', 
      required = false, 
      isTextarea = false,
      selectOptions = null 
    }: {
      label: string;
      fieldName: string;
      value: string;
      type?: string;
      required?: boolean;
      isTextarea?: boolean;
      selectOptions?: {value: string, label: string}[] | null;
    }) => {
      const isEditing = camposEditando[fieldName];
      
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            {canEdit() && (
              <button
                onClick={() => toggleEditField(fieldName)}
                className={`p-1 rounded-md transition-colors ${
                  isEditing 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                title={isEditing ? 'Guardar campo' : 'Editar campo'}
              >
              {isEditing ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <EditarIcon width={14} height={14} fill="currentColor" />
              )}
              </button>
            )}
          </div>
          
          {(isEditing && canEdit()) ? (
            // Modo edición
            <>
              {selectOptions ? (
                <select
                  value={value}
                  onChange={(e) => setFormData(prev => ({ ...prev, [fieldName]: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50"
                >
                  {selectOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : isTextarea ? (
                <textarea
                  value={value}
                  onChange={(e) => setFormData(prev => ({ ...prev, [fieldName]: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50"
                  placeholder={`Ingrese ${label.toLowerCase()}...`}
                />
              ) : (
                <input
                  type={type}
                  value={value}
                  onChange={(e) => setFormData(prev => ({ ...prev, [fieldName]: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50"
                  placeholder={`Ingrese ${label.toLowerCase()}...`}
                />
              )}
            </>
          ) : (
            // Modo solo lectura
            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg min-h-[42px] flex items-center">
              <span className={`${value ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                {value || `Sin ${label.toLowerCase()}`}
              </span>
            </div>
          )}
        </div>
      );
    };

    const handleSave = () => {
      console.log('💾 Guardando datos del formulario:', formData);
      console.log('📋 Datos originales de la hoja:', hojaCompleta);
      
      // Validaciones básicas
      if (!formData.numero_hr.trim()) {
        toast.error('El número de H.R. es requerido');
        return;
      }
      if (!formData.referencia.trim()) {
        toast.error('La referencia es requerida');
        return;
      }
      if (!formData.procedencia.trim()) {
        toast.error('La procedencia es requerida');
        return;
      }

      // Convertir numero_fojas a número si tiene valor, sino null
      const dataToSave = {
        ...formData,
        numero_fojas: formData.numero_fojas ? parseInt(formData.numero_fojas) : null
      };

      console.log('📤 Datos finales a enviar:', dataToSave);
      guardarEdicionCompleta(dataToSave);
    };

    return createPortal(
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <EditarIcon width={24} height={24} fill="#2563eb" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Editar Hoja de Ruta</h2>
                  <p className="text-gray-600 text-sm">
                    Modifica los datos principales del documento: {hojaCompleta?.numero_hr}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditCompleteModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Indicador de datos cargados */}
            {hojaCompleta && datosLoaded ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium">
                      Editando hoja: <span className="font-bold">{hojaCompleta.numero_hr}</span>
                      {hojaCompleta.referencia && (
                        <span className="text-blue-600 ml-2">
                          - {hojaCompleta.referencia.substring(0, 50)}
                          {hojaCompleta.referencia.length > 50 ? '...' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={toggleEditAllFields}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <EditarIcon width={12} height={12} fill="white" />
                    Editar Todo
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-medium">Cargando datos de la hoja de ruta...</p>
                </div>
              </div>
            )}

            {/* Formulario con campos editables */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!datosLoaded ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  📋 Información Básica
                </h3>
                
                <EditableField
                  label="Número H.R."
                  fieldName="numero_hr"
                  value={formData.numero_hr}
                  required={true}
                />

                <EditableField
                  label="Nombre del Solicitante"
                  fieldName="nombre_solicitante"
                  value={formData.nombre_solicitante}
                  required={true}
                />

                <EditableField
                  label="Teléfono Celular"
                  fieldName="telefono_celular"
                  value={formData.telefono_celular}
                  type="tel"
                />

                <EditableField
                  label="Procedencia"
                  fieldName="procedencia"
                  value={formData.procedencia}
                  required={true}
                />

                <div className="grid grid-cols-2 gap-3">
                  <EditableField
                    label="Prioridad"
                    fieldName="prioridad"
                    value={formData.prioridad}
                    selectOptions={[
                      { value: 'urgente', label: 'Urgente' },
                      { value: 'prioritario', label: 'Prioritario' },
                      { value: 'rutinario', label: 'Rutinario' },
                      { value: 'otros', label: 'Otros' }
                    ]}
                  />
                  
                  <EditableField
                    label="Estado"
                    fieldName="estado"
                    value={formData.estado}
                    selectOptions={[
                      { value: 'pendiente', label: 'Pendiente' },
                      { value: 'enviada', label: 'Enviada' },
                      { value: 'en_proceso', label: 'En Proceso' },
                      { value: 'finalizada', label: 'Finalizada' },
                      { value: 'archivada', label: 'Archivada' }
                    ]}
                  />
                </div>
              </div>

              {/* Detalles del Documento */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  📄 Detalles del Documento
                </h3>
                
                <EditableField
                  label="Cite"
                  fieldName="cite"
                  value={formData.cite}
                />

                <EditableField
                  label="Número de Fojas"
                  fieldName="numero_fojas"
                  value={formData.numero_fojas}
                  type="number"
                />

                <div className="grid grid-cols-2 gap-3">
                  <EditableField
                    label="Fecha de Ingreso"
                    fieldName="fecha_ingreso"
                    value={formData.fecha_ingreso}
                    type="date"
                  />
                  
                  <EditableField
                    label="Fecha Límite"
                    fieldName="fecha_limite"
                    value={formData.fecha_limite}
                    type="date"
                  />
                </div>

                <EditableField
                  label="Observaciones"
                  fieldName="observaciones"
                  value={formData.observaciones}
                  isTextarea={true}
                />
              </div>

              {/* Referencia - Campo amplio */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                  📝 Contenido del Documento
                </h3>
                
                <EditableField
                  label="Referencia"
                  fieldName="referencia"
                  value={formData.referencia}
                  required={true}
                  isTextarea={true}
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowEditCompleteModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={actualizandoEstado || !datosLoaded}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actualizandoEstado ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <EditarIcon width={16} height={16} fill="white" />
                    Guardar Cambios ({hojaCompleta?.numero_hr})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
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

    // TEMPORAL: Mostrar todos los destinos sin filtrar para debug
    const destinosParaSeleccion = destinos; // destinos.filter(d => {
    //   if (editingSection === 0) {
    //     // Para envío principal, incluir centros, direcciones y otros
    //     return ['centro_acogida', 'direccion', 'otro'].includes(d.tipo);
    //   } else {
    //     // Para recepciones, solo centros de acogida
    //     return d.tipo === 'centro_acogida';
    //   }
    // });

    console.log('🔍 Filtrado destinos:', {
      totalDestinos: destinos.length,
      editingSection,
      destinosFiltrados: destinosParaSeleccion.length,
      tiposDisponibles: destinos.map(d => d.tipo).filter((v, i, a) => a.indexOf(v) === i),
      destinosParaSeleccion: destinosParaSeleccion.slice(0, 3)
    });

    console.log('🏗️ Renderizando opciones:', destinosParaSeleccion.length, 'destinos');

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
                  {destinosParaSeleccion.length === 0 && <option disabled>⚠️ No hay destinos disponibles</option>}
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
      
      console.log('🏢 CAMBIANDO UBICACIÓN:', {
        ubicacionActual: hojaCompleta.ubicacion_actual,
        nuevaUbicacion: nuevaUbicacion,
        responsable: responsable,
        hojaId: hojaCompleta.id
      });
      
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
      
      console.log('✅ RESPUESTA DEL BACKEND:', response.data);
      
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
        
        <div className="flex items-center gap-4">
          {/* Editar Hoja Completa - Solo para usuarios con permisos de edición */}
          {canEdit() && (
            <button 
              onClick={() => setShowEditCompleteModal(true)}
              className="bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition-all duration-200"
            >
              <EditarIcon width={18} height={18} fill="white" />
              <span className="font-medium text-sm">Editar Hoja</span>
            </button>
          )}
          
          {/* Mensaje informativo para usuarios sin permisos */}
          {!canEdit() && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-sm">
                Solo lectura - Usuario: {user?.rol || 'Desconocido'}
              </span>
            </div>
          )}
          
          {/* Descargar PDF */}
          <button 
            onClick={handleDescargarPDF}
            className="bg-slate-600 hover:bg-slate-700 border border-slate-500 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition-all duration-200"
          >
            <DescargarIcon width={18} height={18} fill="white" />
            <span className="font-medium text-sm">Descargar PDF</span>
          </button>
          
          {/* Enviar Documento */}
          <button 
            onClick={() => {
              console.log('🚀 Navegando a enviar documento');
              window.dispatchEvent(new CustomEvent('navigate', { detail: { to: 'enviar' } }));
            }}
            className="bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition-all duration-200"
          >
            <SendIcon width={18} height={18} fill="white" />
            <span className="font-medium text-sm">Enviar Documento</span>
          </button>
        </div>
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
                    disabled={actualizandoEstado}
                  >
                    <LupayIcon width={12} height={12} fill="currentColor" />
                    {actualizandoEstado ? 'Actualizando...' : 'Cambiar'}
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
                      {hojaCompleta?.ubicacion_actual || 'Sin ubicación definida'}
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

          {/* Historial y cambio de estado fijo */}
          <div className="flex flex-col items-end gap-4 text-white/70">
            <div className="flex items-center gap-2">
              <HistorialIcon width={20} height={20} fill="currentColor" />
              <span className="text-sm">
                Actualizado {hojaCompleta?.fecha_modificacion ? new Date(hojaCompleta.fecha_modificacion).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            
            {/* Menú desplegable para cambio de estado - FIJO */}
            <div className="bg-slate-800/80 border border-slate-600 rounded-lg p-4 backdrop-blur-sm min-w-[200px]">
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Cambiar Estado
              </label>
              <select
                value={hojaCompleta?.estado || 'pendiente'}
                onChange={(e) => {
                  if (e.target.value !== hojaCompleta?.estado) {
                    cambiarEstado(e.target.value);
                  }
                }}
                disabled={actualizandoEstado}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-md text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                {estadosDisponibles.map((estado) => (
                  <option key={estado.valor} value={estado.valor} className="bg-slate-700 text-white">
                    {estado.nombre}
                  </option>
                ))}
              </select>
              
              {actualizandoEstado && (
                <div className="flex items-center gap-2 mt-2 text-xs text-blue-400">
                  <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  Actualizando estado...
                </div>
              )}
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

      {/* Modal de Cambio de Ubicación - Diseño Mejorado */}
      {showUbicacionModal && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 transform transition-all duration-300 scale-100">
            {/* Header del Modal */}
            <div className="bg-linear-to-r from-slate-700 to-slate-800 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <LupayIcon width={24} height={24} fill="white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Cambiar Ubicación del Documento</h2>
                    <p className="text-slate-200 text-sm">Actualizar la ubicación actual y responsable</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUbicacionModal(false)}
                  className="text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              {/* Información Actual */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                  Ubicación Actual
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Ubicación:</span>
                    <p className="font-medium text-slate-800">{hojaCompleta?.ubicacion_actual || 'No definida'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Responsable:</span>
                    <p className="font-medium text-slate-800">{hojaCompleta?.responsable_actual || 'No asignado'}</p>
                  </div>
                </div>
              </div>

              {/* Formulario de Nueva Ubicación */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    📍 Nueva Ubicación
                  </label>
                  <select
                    id="nuevaUbicacion"
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-white text-slate-800 font-medium"
                    defaultValue=""
                  >
                    <option value="" className="text-slate-500">-- Seleccionar nueva ubicación --</option>
                    <optgroup label="🏢 Ubicaciones Principales" className="font-medium">
                      <option value="SEDEGES - Sede Central" className="text-slate-800">SEDEGES - Sede Central</option>
                      <option value="ARCHIVO GENERAL" className="text-slate-800">Archivo General</option>
                      <option value="ENTIDAD EXTERNA" className="text-slate-800">Entidad Externa</option>
                    </optgroup>
                    <optgroup label="🏠 Centros de Acogida" className="font-medium">
                      {destinos.filter(d => d.tipo === 'centro_acogida').map((destino) => (
                        <option key={destino.id} value={destino.nombre} className="text-slate-800">
                          {destino.nombre}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🏛️ Direcciones Administrativas" className="font-medium">
                      {destinos.filter(d => d.tipo === 'direccion').map((destino) => (
                        <option key={destino.id} value={destino.nombre} className="text-slate-800">
                          {destino.nombre}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    👤 Responsable
                  </label>
                  <input
                    type="text"
                    id="responsable"
                    placeholder="Nombre del nuevo responsable"
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-white text-slate-800 font-medium"
                  />
                  <p className="text-xs text-slate-500 mt-1">Ingresa el nombre completo del responsable</p>
                </div>
              </div>
              
              {/* Botones de Acción */}
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
                <button
                  onClick={() => setShowUbicacionModal(false)}
                  className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const selectElement = document.getElementById('nuevaUbicacion') as HTMLSelectElement;
                    const responsableElement = document.getElementById('responsable') as HTMLInputElement;
                    
                    if (selectElement?.value && responsableElement?.value) {
                      cambiarUbicacion(selectElement.value, responsableElement.value);
                      setShowUbicacionModal(false);
                    } else {
                      toast.error('Por favor seleccione una ubicación y responsable');
                    }
                  }}
                  disabled={actualizandoEstado}
                  className="px-6 py-3 bg-linear-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {actualizandoEstado ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <LupayIcon width={16} height={16} fill="white" />
                      Confirmar Cambio
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Edición */}
      {showEditModal && <ModalEdicionSeccion />}
      
      {/* Modal de Edición Completa */}
      {showEditCompleteModal && <ModalEdicionCompleta />}
    </div>
  );
};

export default HojaRutaDetalleView;
