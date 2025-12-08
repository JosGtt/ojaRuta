import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image';
import GuardarIcon from '../assets/guardaron';
import VolverIcon from '../assets/Flecha down';
import OjoIcon from '../assets/ojo';
import PdfIcon from '../assets/pdf';
import SedegesLogo from './SedegesLogo';

interface FormData {
  numero_hr: string;
  nombre_solicitante: string;
  telefono_celular: string;
  referencia: string;
  prioridad: 'urgente' | 'prioritario' | 'rutinario' | 'otros' | '';
  estado: 'pendiente' | 'enviada' | 'en_proceso' | 'finalizada' | 'archivada' | '';
  procedencia: string;
  fecha_limite: string;
  fecha_ingreso: string;
  cite: string;
  numero_fojas: string;
  destino_principal: string;
  destinos: string[];
  instrucciones_adicionales: string;
  // Campos adicionales del documento físico
  fecha_recepcion_1: string;
  destino_1: string;
  destinos_1: string[];
  instrucciones_adicionales_1: string;
  fecha_recepcion_2: string;
  destino_2: string;
  destinos_2: string[];
  instrucciones_adicionales_2: string;
  fecha_recepcion_3: string;
  destino_3: string;
  destinos_3: string[];
  instrucciones_adicionales_3: string;
}

const destinosOptions = [
  'Para su conocimiento',
  'Analizar y emitir opinión',
  'Dar curso si legalmente es procedente',
  'Proceder de acuerdo a normas',
  'Preparar respuesta o informe',
  'Elaborar Resolución',
  'Elaborar Contrato',
  'Concertar reunión',
  'Asistir a reunión, invitación en mi representación',
  'Archivar'
];

const destinosSeccionesAdicionalesOptions = [
  'Para su conocimiento',
  'Preparar respuesta o informe',
  'Analizar y emitir opinión',
  'Procesar de acuerdo a normas',
  'Dar curso si legalmente es procedente',
  'Elaborar Resolución',
  'Elaborar Contrato',
  'Archivar'
];

const NuevaHojaRuta: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    numero_hr: '',
    nombre_solicitante: '',
    telefono_celular: '',
    referencia: '',
    prioridad: '',
    estado: '',
    procedencia: '',
    fecha_limite: '',
    fecha_ingreso: '',
    cite: '',
    numero_fojas: '',
    destino_principal: '',
    destinos: [],
    instrucciones_adicionales: '',
    fecha_recepcion_1: '',
    destino_1: '',
    destinos_1: [],
    instrucciones_adicionales_1: '',
    fecha_recepcion_2: '',
    destino_2: '',
    destinos_2: [],
    instrucciones_adicionales_2: '',
    fecha_recepcion_3: '',
    destino_3: '',
    destinos_3: [],
    instrucciones_adicionales_3: ''
  });

  const [destinosDisponibles, setDestinosDisponibles] = useState<any[]>([]);
  const [loadingDestinos, setLoadingDestinos] = useState(true);
  const [mostrarDestinoPrincipalPersonalizado, setMostrarDestinoPrincipalPersonalizado] = useState(false);
  const [destinoPrincipalPersonalizado, setDestinoPrincipalPersonalizado] = useState('');
  const [destinoPersonalizado1, setDestinoPersonalizado1] = useState('');
  const [destinoPersonalizado2, setDestinoPersonalizado2] = useState('');
  const [destinoPersonalizado3, setDestinoPersonalizado3] = useState('');
  const [mostrarDestinoPersonalizado1, setMostrarDestinoPersonalizado1] = useState(false);
  const [mostrarDestinoPersonalizado2, setMostrarDestinoPersonalizado2] = useState(false);
  const [mostrarDestinoPersonalizado3, setMostrarDestinoPersonalizado3] = useState(false);

  // Cargar destinos disponibles
  useEffect(() => {
    const cargarDestinos = async () => {
      try {
        console.log('🔄 Cargando destinos disponibles...');
        const response = await axios.get(`${API_BASE_URL}/api/destinos`);
        console.log('📥 Respuesta de destinos:', response.data);
        if (response.data.success) {
          // Aplanar las categorías en un solo array y agregar tipos
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
          setDestinosDisponibles(destinosAplanados);
          console.log('✅ Destinos cargados:', destinosAplanados.length, 'destinos');
          console.log('📋 Primeros 3 destinos con tipos:', destinosAplanados.slice(0, 3));
        } else {
          console.error('❌ Error en respuesta:', response.data.message);
        }
      } catch (error) {
        console.error('❌ Error al cargar destinos:', error);
        toast.error('Error al cargar destinos');
      } finally {
        setLoadingDestinos(false);
      }
    };
    
    cargarDestinos();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDestinoChange = (destino: string) => {
    setFormData(prev => ({
      ...prev,
      destinos: prev.destinos.includes(destino)
        ? prev.destinos.filter(d => d !== destino)
        : [...prev.destinos, destino]
    }));
  };

  const handleDestinoSectionChange = (destino: string, section: 1 | 2 | 3) => {
    const fieldName = `destinos_${section}` as keyof FormData;
    setFormData(prev => {
      const currentDestinos = prev[fieldName] as string[];
      return {
        ...prev,
        [fieldName]: currentDestinos.includes(destino)
          ? currentDestinos.filter(d => d !== destino)
          : [...currentDestinos, destino]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) {
      toast.error('No hay sesión activa. Inicie sesión nuevamente.');
      navigate('/login');
      return;
    }
    try {
      // Enviar todos los campos del formulario para que se guarden en detalles (JSONB)
      const payload = {
        ...formData,
        estado: formData.estado || 'pendiente', // Usar el estado seleccionado o 'pendiente' por defecto
        observaciones: formData.instrucciones_adicionales,
        usuario_creador_id: user.id,
        ubicacion_actual: formData.destino_principal || 'SEDEGES - Sede Central', // Usar destino principal como ubicación inicial
        responsable_actual: formData.destino_principal ? `Responsable de ${formData.destino_principal}` : 'Sistema SEDEGES'
      };
      await axios.post(`${API_BASE_URL}/api/hojas-ruta`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Hoja de ruta guardada exitosamente');
      // Limpiar el formulario después de guardar exitosamente
      setFormData({
        numero_hr: '',
        nombre_solicitante: '',
        telefono_celular: '',
        referencia: '',
        prioridad: '',
        estado: '',
        procedencia: '',
        fecha_limite: '',
        fecha_ingreso: '',
        cite: '',
        numero_fojas: '',
        destino_principal: '',
        destinos: [],
        instrucciones_adicionales: '',
        fecha_recepcion_1: '',
        destino_1: '',
        destinos_1: [],
        instrucciones_adicionales_1: '',
        fecha_recepcion_2: '',
        destino_2: '',
        destinos_2: [],
        instrucciones_adicionales_2: '',
        fecha_recepcion_3: '',
        destino_3: '',
        destinos_3: [],
        instrucciones_adicionales_3: ''
      });
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar la hoja de ruta');
    }
  };

  const convertOklchToRgb = (element: HTMLElement) => {
    const styles = window.getComputedStyle(element);
    const properties = ['background-color', 'color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'];
    
    properties.forEach(prop => {
      const value = styles.getPropertyValue(prop);
      if (value) {
        element.style.setProperty(prop, value, 'important');
      }
    });
  };

  const handlePrint = async () => {
    if (!printRef.current) return;
    try {
      if (!showPreview) {
        setShowPreview(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
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
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `hoja-ruta-${formData.numero_hr || timestamp}.pdf`;
        pdf.save(filename);
        toast.success('PDF generado exitosamente');
      };
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF: ' + error);
    }
  };

  return (
  <div className="min-h-screen p-6 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl shadow-lg p-6 mb-6" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/dashboard')} className="flex items-center px-4 py-2 text-white/80 hover:text-white hover:bg-[rgba(255,255,255,0.08)] rounded-lg transition-all" style={{
              background: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}>
              <VolverIcon width={20} height={20} className="mr-2" fill="currentColor" />
              Volver al Dashboard
            </button>
            <div className="flex items-center space-x-4">
              {showPreview && (
                <button onClick={handlePrint} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white border border-slate-500 hover:border-slate-400 rounded-lg transition-all duration-200 font-medium">
                  Descargar PDF
                </button>
              )}
              <button onClick={() => setShowPreview(!showPreview)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-all duration-200 font-medium">
                {showPreview ? 'Editar' : 'Vista Previa'}
              </button>
            </div>
          </div>
        </div>

        {!showPreview ? (
          <div className="rounded-2xl shadow-lg p-6" style={{
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <h1 className="text-2xl font-bold mb-6">Nueva Hoja de Ruta</h1>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Número H.R. *</label>
                  <input type="text" name="numero_hr" value={formData.numero_hr} onChange={handleInputChange} required className="w-full px-3 py-2 border border-white/20 text-white placeholder-white/50 rounded-lg focus:border-white/40 transition-all" style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                  }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre del Solicitante *</label>
                  <input type="text" name="nombre_solicitante" value={formData.nombre_solicitante} onChange={handleInputChange} required className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:border-white/40 focus:bg-white/15 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Teléfono Celular *</label>
                  <input type="tel" name="telefono_celular" value={formData.telefono_celular} onChange={handleInputChange} required className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:border-white/40 focus:bg-white/15 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Prioridad *</label>
                  <select name="prioridad" value={formData.prioridad} onChange={handleInputChange} required className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white rounded-lg focus:border-white/40 focus:bg-white/15 transition-all [&>option]:bg-slate-800 [&>option]:text-white">
                    <option value="" className="text-white/70">Seleccionar</option>
                    <option value="urgente">Urgente</option>
                    <option value="prioritario">Prioritario</option>
                    <option value="rutinario">Rutinario</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Estado Inicial *</label>
                  <select name="estado" value={formData.estado} onChange={handleInputChange} required className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white rounded-lg focus:border-white/40 focus:bg-white/15 transition-all [&>option]:bg-slate-800 [&>option]:text-white">
                    <option value="" className="text-white/70">Seleccionar</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="enviada">Enviada</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="finalizada">Finalizada</option>
                    <option value="archivada">Archivada</option>
                  </select>
                  <p className="text-xs text-white/60 mt-1">Estado en que se registra inicialmente la hoja de ruta</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Referencia *</label>
                  <textarea name="referencia" value={formData.referencia} onChange={handleInputChange} required rows={3} className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:border-white/40 focus:bg-white/15 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Procedencia *</label>
                  <input type="text" name="procedencia" value={formData.procedencia} onChange={handleInputChange} required className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:border-white/40 focus:bg-white/15 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha Límite *</label>
                  <input type="date" name="fecha_limite" value={formData.fecha_limite} onChange={handleInputChange} required className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white rounded-lg focus:border-white/40 focus:bg-white/15 transition-all [&::-webkit-calendar-picker-indicator]:filter-invert" />
                  <p className="text-xs text-white/60 mt-1">Fecha máxima para dar cumplimiento a esta hoja de ruta</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha Ingreso *</label>
                  <input type="date" name="fecha_ingreso" value={formData.fecha_ingreso} onChange={handleInputChange} required className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white rounded-lg focus:border-white/40 focus:bg-white/15 transition-all [&::-webkit-calendar-picker-indicator]:filter-invert" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cite</label>
                  <input type="text" name="cite" value={formData.cite} onChange={handleInputChange} className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:border-white/40 focus:bg-white/15 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Número Fojas</label>
                  <input type="number" name="numero_fojas" value={formData.numero_fojas} onChange={handleInputChange} className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:border-white/40 focus:bg-white/15 transition-all" />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Destino</label>
                <div className="space-y-2">
                  <select 
                    value={formData.destino_principal === 'otro' ? 'otro' : formData.destino_principal} 
                    onChange={(e) => {
                      if (e.target.value === 'otro') {
                        setFormData(prev => ({ ...prev, destino_principal: 'otro' }));
                        setMostrarDestinoPrincipalPersonalizado(true);
                      } else {
                        setFormData(prev => ({ ...prev, destino_principal: e.target.value }));
                        setMostrarDestinoPrincipalPersonalizado(false);
                      }
                    }}
                    className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white rounded-lg focus:border-white/40 focus:bg-white/15 transition-all"
                  >
                    <option value="">Seleccionar destino...</option>
                    {destinosDisponibles
                      .filter(destino => destino.tipo === 'centro_acogida')
                      .map(destino => (
                        <option key={destino.id} value={destino.nombre} className="bg-gray-800 text-white">
                          {destino.nombre}
                        </option>
                      ))}
                    {destinosDisponibles
                      .filter(destino => destino.tipo === 'direccion')
                      .map(destino => (
                        <option key={destino.id} value={destino.nombre} className="bg-gray-800 text-white">
                          {destino.nombre}
                        </option>
                      ))}
                    <option value="otro" className="bg-blue-800 text-white">✏️ Escribir otro destino</option>
                  </select>
                  
                  {mostrarDestinoPrincipalPersonalizado && (
                    <textarea 
                      value={destinoPrincipalPersonalizado}
                      onChange={(e) => {
                        setDestinoPrincipalPersonalizado(e.target.value);
                        setFormData(prev => ({ ...prev, destino_principal: e.target.value }));
                      }}
                      rows={2}
                      className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:border-white/40 focus:bg-white/15 transition-all"
                      placeholder="Escriba el destino personalizado..."
                    />
                  )}
                </div>
              </div>

              {/* Sección principal de opciones de destino e instrucciones */}
              <div className="mt-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Columna izquierda: Opciones de destino principales */}
                    <div className="border-r border-gray-300 pr-4">
                      <div className="space-y-2">
                        {destinosOptions.map((destino) => (
                          <label key={destino} className="flex items-center">
                            <input type="checkbox" checked={formData.destinos.includes(destino)} onChange={() => handleDestinoChange(destino)} className="mr-2" />
                            <span className="text-sm">{destino}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Columna derecha: Instrucciones adicionales principales */}
                    <div className="pl-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Instrucciones Adicionales</label>
                        <textarea name="instrucciones_adicionales" value={formData.instrucciones_adicionales} onChange={handleInputChange} rows={8} className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:border-white/40 focus:bg-white/15 transition-all" placeholder="Escriba las instrucciones adicionales..." />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secciones adicionales con opciones de destino */}
              <div className="mt-6 space-y-6">
                <h3 className="text-lg font-medium">Secciones Adicionales</h3>
                
                {/* Primera sección adicional */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Columna izquierda: Opciones de destino 1 */}
                    <div className="border-r border-gray-300 pr-4">
                      <div className="space-y-2">
                        {destinosSeccionesAdicionalesOptions.map((destino) => (
                          <label key={`destino1_${destino}`} className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={formData.destinos_1.includes(destino)}
                              onChange={() => handleDestinoSectionChange(destino, 1)}
                              className="mr-2" 
                            />
                            <span className="text-sm">{destino}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Columna derecha: Campos de la sección 1 */}
                    <div className="pl-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Fecha de Recepción 1</label>
                          <input type="date" name="fecha_recepcion_1" value={formData.fecha_recepcion_1} onChange={handleInputChange} className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white rounded-lg focus:border-white/40 focus:bg-white/15 transition-all [&::-webkit-calendar-picker-indicator]:filter-invert" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Destino 1</label>
                          <select 
                            name="destino_1" 
                            value={mostrarDestinoPersonalizado1 ? 'otro' : formData.destino_1} 
                            onChange={(e) => {
                              if (e.target.value === 'otro') {
                                setMostrarDestinoPersonalizado1(true);
                                setFormData(prev => ({ ...prev, destino_1: '' }));
                              } else {
                                setMostrarDestinoPersonalizado1(false);
                                setDestinoPersonalizado1('');
                                setFormData(prev => ({ ...prev, destino_1: e.target.value }));
                              }
                            }}
                            className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white rounded-lg focus:border-white/40 focus:bg-white/15 transition-all"
                          >
                            <option value="" className="text-gray-800">Seleccionar destino...</option>
                            {destinosDisponibles.map(destino => (
                              <option key={destino.id} value={destino.nombre} className="text-gray-800">
                                {destino.nombre}
                              </option>
                            ))}
                            <option value="otro" className="text-gray-800">✏️ Escribir otro destino</option>
                          </select>
                          
                          {mostrarDestinoPersonalizado1 && (
                            <input
                              type="text"
                              value={destinoPersonalizado1}
                              onChange={(e) => {
                                setDestinoPersonalizado1(e.target.value);
                                setFormData(prev => ({ ...prev, destino_1: e.target.value }));
                              }}
                              placeholder="Escribir destino personalizado..."
                              className="w-full mt-2 px-3 py-2 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:border-white/40 focus:bg-white/15 transition-all"
                              autoFocus
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Instrucciones Adicionales 1</label>
                        <textarea name="instrucciones_adicionales_1" value={formData.instrucciones_adicionales_1} onChange={handleInputChange} rows={5} className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:border-white/40 focus:bg-white/15 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Segunda sección adicional */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Columna izquierda: Opciones de destino 2 */}
                    <div className="border-r border-gray-300 pr-4">
                      <div className="space-y-2">
                        {destinosSeccionesAdicionalesOptions.map((destino) => (
                          <label key={`destino2_${destino}`} className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={formData.destinos_2.includes(destino)}
                              onChange={() => handleDestinoSectionChange(destino, 2)}
                              className="mr-2" 
                            />
                            <span className="text-sm">{destino}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Columna derecha: Campos de la sección 2 */}
                    <div className="pl-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Fecha de Recepción 2</label>
                          <input type="date" name="fecha_recepcion_2" value={formData.fecha_recepcion_2} onChange={handleInputChange} className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white rounded-lg focus:border-white/40 focus:bg-white/15 transition-all [&::-webkit-calendar-picker-indicator]:filter-invert" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Destino 2</label>
                          <select 
                            name="destino_2" 
                            value={mostrarDestinoPersonalizado2 ? 'otro' : formData.destino_2} 
                            onChange={(e) => {
                              if (e.target.value === 'otro') {
                                setMostrarDestinoPersonalizado2(true);
                                setFormData(prev => ({ ...prev, destino_2: '' }));
                              } else {
                                setMostrarDestinoPersonalizado2(false);
                                setDestinoPersonalizado2('');
                                setFormData(prev => ({ ...prev, destino_2: e.target.value }));
                              }
                            }}
                            className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white rounded-lg focus:border-white/40 focus:bg-white/15 transition-all"
                          >
                            <option value="" className="text-gray-800">Seleccionar destino...</option>
                            {destinosDisponibles.map(destino => (
                              <option key={destino.id} value={destino.nombre} className="text-gray-800">
                                {destino.nombre}
                              </option>
                            ))}
                            <option value="otro" className="text-gray-800">✏️ Escribir otro destino</option>
                          </select>
                          
                          {mostrarDestinoPersonalizado2 && (
                            <input
                              type="text"
                              value={destinoPersonalizado2}
                              onChange={(e) => {
                                setDestinoPersonalizado2(e.target.value);
                                setFormData(prev => ({ ...prev, destino_2: e.target.value }));
                              }}
                              placeholder="Escribir destino personalizado..."
                              className="w-full mt-2 px-3 py-2 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:border-white/40 focus:bg-white/15 transition-all"
                              autoFocus
                            />
                          )}
                        </div>
                      </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Instrucciones Adicionales 2</label>
                        <textarea name="instrucciones_adicionales_2" value={formData.instrucciones_adicionales_2} onChange={handleInputChange} rows={5} className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:border-white/40 focus:bg-white/15 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tercera sección adicional */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Columna izquierda: Opciones de destino 3 */}
                    <div className="border-r border-gray-300 pr-4">
                      <div className="space-y-2">
                        {destinosSeccionesAdicionalesOptions.map((destino) => (
                          <label key={`destino3_${destino}`} className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={formData.destinos_3.includes(destino)}
                              onChange={() => handleDestinoSectionChange(destino, 3)}
                              className="mr-2" 
                            />
                            <span className="text-sm">{destino}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Columna derecha: Campos de la sección 3 */}
                    <div className="pl-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Fecha de Recepción 3</label>
                          <input type="date" name="fecha_recepcion_3" value={formData.fecha_recepcion_3} onChange={handleInputChange} className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white rounded-lg focus:border-white/40 focus:bg-white/15 transition-all [&::-webkit-calendar-picker-indicator]:filter-invert" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Destino 3</label>
                          <select 
                            name="destino_3" 
                            value={mostrarDestinoPersonalizado3 ? 'otro' : formData.destino_3} 
                            onChange={(e) => {
                              if (e.target.value === 'otro') {
                                setMostrarDestinoPersonalizado3(true);
                                setFormData(prev => ({ ...prev, destino_3: '' }));
                              } else {
                                setMostrarDestinoPersonalizado3(false);
                                setDestinoPersonalizado3('');
                                setFormData(prev => ({ ...prev, destino_3: e.target.value }));
                              }
                            }}
                            className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white rounded-lg focus:border-white/40 focus:bg-white/15 transition-all"
                          >
                            <option value="" className="text-gray-800">Seleccionar destino...</option>
                            {destinosDisponibles.map(destino => (
                              <option key={destino.id} value={destino.nombre} className="text-gray-800">
                                {destino.nombre}
                              </option>
                            ))}
                            <option value="otro" className="text-gray-800">✏️ Escribir otro destino</option>
                          </select>
                          
                          {mostrarDestinoPersonalizado3 && (
                            <input
                              type="text"
                              value={destinoPersonalizado3}
                              onChange={(e) => {
                                setDestinoPersonalizado3(e.target.value);
                                setFormData(prev => ({ ...prev, destino_3: e.target.value }));
                              }}
                              placeholder="Escribir destino personalizado..."
                              className="w-full mt-2 px-3 py-2 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:border-white/40 focus:bg-white/15 transition-all"
                              autoFocus
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Instrucciones Adicionales 3</label>
                        <textarea name="instrucciones_adicionales_3" value={formData.instrucciones_adicionales_3} onChange={handleInputChange} rows={5} className="w-full px-3 py-2 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:border-white/40 focus:bg-white/15 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-3 border border-white/40 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white rounded-lg transition-all duration-200 font-medium">Cancelar</button>
                <button type="button" onClick={() => setShowPreview(true)} className="flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-all duration-200 font-medium shadow-sm">
                  <OjoIcon width={16} height={16} fill="white" className="mr-2" />
                  Vista Previa
                </button>
                <button type="button" onClick={handlePrint} className="flex items-center px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white border border-slate-500 hover:border-slate-400 rounded-lg transition-all duration-200 font-medium shadow-sm">
                  <PdfIcon width={16} height={16} fill="white" className="mr-2" />
                  Descargar PDF
                </button>
                <button type="submit" className="flex items-center px-6 py-3 bg-[var(--color-esmeralda)] hover:bg-[var(--color-esmeralda)]/90 text-white border border-[var(--color-esmeralda)] hover:border-[var(--color-esmeralda)]/80 rounded-lg transition-all duration-200 font-medium shadow-sm">
                  <GuardarIcon width={16} height={16} fill="white" className="mr-2" />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div
            className="bg-white shadow-lg"
            ref={printRef}
            style={{ background: '#fff', color: '#222' }}
          >
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="flex items-start justify-between mb-2">
                  <SedegesLogo width={80} height={80} className="mt-2" />
                  <div className="flex-1 text-center">
                    <h2 className="text-lg font-bold">SERVICIO DEPARTAMENTAL DE GESTIÓN SOCIAL</h2>
                    <h3 className="text-xl font-bold">HOJA DE RUTA</h3>
                  </div>
                  <div className="text-right">
                    <div className="border border-black p-1 min-w-[120px]">
                      <p className="text-xs font-bold text-center">NÚMERO H.R.</p>
                      <p className="text-center text-sm">{formData.numero_hr || '........................'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla principal */}
              <table className="w-full border-collapse border border-black text-xs">
                {/* Primera fila: REFERENCIA | URGENTE/PRIORITARIO/RUTINARIO/OTROS */}
                <tr>
                  <td className="border border-black bg-gray-100 p-1 font-bold w-20">REFERENCIA</td>
                  <td className="border border-black p-1 w-96">{formData.referencia}</td>
                  <td className="border border-black bg-gray-100 p-1 w-20 text-center">
                    <div className="space-y-1">
                      <div>
                        <input type="checkbox" checked={formData.prioridad === 'urgente'} readOnly className="mr-1" />
                        URGENTE
                      </div>
                      <div>
                        <input type="checkbox" checked={formData.prioridad === 'prioritario'} readOnly className="mr-1" />
                        PRIORITARIO
                      </div>
                      <div>
                        <input type="checkbox" checked={formData.prioridad === 'rutinario'} readOnly className="mr-1" />
                        RUTINARIO
                      </div>
                      <div>
                        <input type="checkbox" checked={formData.prioridad === 'otros'} readOnly className="mr-1" />
                        OTROS
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Segunda fila: PROCEDENCIA */}
                <tr>
                  <td className="border border-black bg-gray-100 p-1 font-bold">PROCEDENCIA</td>
                  <td className="border border-black p-1" colSpan={2}>{formData.procedencia}</td>
                </tr>

                {/* Nueva fila: NOMBRE DEL SOLICITANTE Y TELÉFONO CELULAR */}
                <tr>
                  <td className="border border-black bg-gray-100 p-1 font-bold">NOMBRE SOLICITANTE</td>
                  <td className="border border-black p-1">{formData.nombre_solicitante}</td>
                  <td className="border border-black p-1">
                    <div className="flex">
                      <span className="bg-gray-100 font-bold pr-2">TEL:</span>
                      <span>{formData.telefono_celular}</span>
                    </div>
                  </td>
                </tr>

                {/* Tercera fila: FECHA DE DOCUMENTO | FECHA DE INGRESO */}
                <tr>
                  <td className="border border-black bg-gray-100 p-1 font-bold">FECHA DE DOCUMENTO</td>
                  <td className="border border-black p-1">{formData.fecha_limite}</td>
                  <td className="border border-black p-1"></td>
                </tr>

                {/* Cuarta fila: FECHA DE INGRESO */}
                <tr>
                  <td className="border border-black bg-gray-100 p-1 font-bold">FECHA DE INGRESO</td>
                  <td className="border border-black p-1">{formData.fecha_ingreso}</td>
                  <td className="border border-black p-1"></td>
                </tr>

                {/* Quinta fila: CITE | No. FOJAS */}
                <tr>
                  <td className="border border-black bg-gray-100 p-1 font-bold">CITE:</td>
                  <td className="border border-black p-1">{formData.cite}</td>
                  <td className="border border-black p-1">
                    <span className="font-bold">No. FOJAS:</span> {formData.numero_fojas}
                  </td>
                </tr>
              </table>

              {/* Sección IMPORTANTE */}
              <div className="border border-black border-t-0">
                <div className="bg-gray-100 p-2">
                  <span className="text-sm font-bold">IMPORTANTE</span>
                </div>
                <div className="p-2">
                  <ul className="list-disc ml-4 text-xs space-y-1">
                    <li>La Hoja de Ruta debe encabezar todos los documentos en cualquier tipo de trámites.</li>
                    <li>A través de la hoja de ruta se podrá determinar dónde está la obstaculización, retraso u otras anomalías</li>
                    <li>Todo trámite debe ser atendido en plazos mínimos establecidos</li>
                  </ul>
                </div>
              </div>

              {/* Primera sección DESTINO */}
              <div className="border border-black border-t-0">
                <div className="bg-gray-100 p-1">
                  <span className="text-sm font-bold">DESTINO</span>
                </div>
                
                {/* Campo de texto para el destino principal */}
                <div className="border-b border-black p-1">
                  <div className="border border-gray-400 p-2 min-h-[40px] text-xs">
                    {formData.destino_principal || '...........................................................................'}
                  </div>
                </div>

                <div className="grid grid-cols-2">
                  {/* Primera columna de opciones de destino */}
                  <div className="border-r border-black p-1">
                    <div className="space-y-1 text-xs">
                      <div><input type="checkbox" checked={formData.destinos.includes('Para su conocimiento')} readOnly className="mr-1" />Para su conocimiento</div>
                      <div><input type="checkbox" checked={formData.destinos.includes('Analizar y emitir opinión')} readOnly className="mr-1" />Analizar y emitir opinión</div>
                      <div><input type="checkbox" checked={formData.destinos.includes('Dar curso si legalmente es procedente')} readOnly className="mr-1" />Dar curso si legalmente es procedente</div>
                      <div><input type="checkbox" checked={formData.destinos.includes('Proceder de acuerdo a normas')} readOnly className="mr-1" />Proceder de acuerdo a normas</div>
                      <div><input type="checkbox" checked={formData.destinos.includes('Preparar respuesta o informe')} readOnly className="mr-1" />Preparar respuesta o informe</div>
                      <div><input type="checkbox" checked={formData.destinos.includes('Elaborar Resolución')} readOnly className="mr-1" />Elaborar Resolución</div>
                      <div><input type="checkbox" checked={formData.destinos.includes('Elaborar Contrato')} readOnly className="mr-1" />Elaborar Contrato</div>
                      <div><input type="checkbox" checked={formData.destinos.includes('Concertar reunión')} readOnly className="mr-1" />Concertar reunión</div>
                      <div><input type="checkbox" checked={formData.destinos.includes('Asistir a reunión, invitación en mi representación')} readOnly className="mr-1" />Asistir a reunión, invitación en mi representación</div>
                      <div><input type="checkbox" checked={formData.destinos.includes('Archivar')} readOnly className="mr-1" />Archivar</div>
                    </div>
                  </div>
                  
                  {/* Segunda columna - INSTRUCCIONES ADICIONALES */}
                  <div className="p-1">
                    <div className="text-center mb-1">
                      <span className="text-sm font-bold">INSTRUCCIONES ADICIONALES:</span>
                    </div>
                    <div className="text-xs min-h-[100px] p-1">
                      {formData.instrucciones_adicionales}
                    </div>
                    <div className="mt-2 text-center text-xs">
                      <div>Lic. Beatriz Churata Mamani</div>
                      <div className="font-bold">Directora Técnica</div>
                      <div className="font-bold">SEDEGES</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FECHA DE RECEPCIÓN y DESTINO (repetido 3 veces como en el documento) */}
              {[
                { fecha: formData.fecha_recepcion_1, destino: formData.destino_1, instrucciones: formData.instrucciones_adicionales_1, destinos: formData.destinos_1 },
                { fecha: formData.fecha_recepcion_2, destino: formData.destino_2, instrucciones: formData.instrucciones_adicionales_2, destinos: formData.destinos_2 },
                { fecha: formData.fecha_recepcion_3, destino: formData.destino_3, instrucciones: formData.instrucciones_adicionales_3, destinos: formData.destinos_3 }
              ].map((seccion, index) => (
                <div key={index + 1}>
                  <div className="border border-black border-t-0 p-1">
                    <span className="text-xs font-bold">FECHA DE RECEPCIÓN: {seccion.fecha || '___________________________'}</span>
                  </div>
                  <div className="border border-black border-t-0 p-1">
                    <span className="text-xs font-bold">DESTINO: {seccion.destino || '......................................................................'}</span>
                  </div>
                  
                  <div className="border border-black border-t-0">
                    <div className="grid grid-cols-2">
                      <div className="border-r border-black p-1">
                        <div className="space-y-1 text-xs">
                          <div><input type="checkbox" checked={seccion.destinos.includes('Para su conocimiento')} readOnly className="mr-1" />Para su conocimiento</div>
                          <div><input type="checkbox" checked={seccion.destinos.includes('Preparar respuesta o informe')} readOnly className="mr-1" />Preparar respuesta o informe</div>
                          <div><input type="checkbox" checked={seccion.destinos.includes('Analizar y emitir opinión')} readOnly className="mr-1" />Analizar y emitir opinión</div>
                          <div><input type="checkbox" checked={seccion.destinos.includes('Procesar de acuerdo a normas')} readOnly className="mr-1" />Procesar de acuerdo a normas</div>
                          <div><input type="checkbox" checked={seccion.destinos.includes('Dar curso si legalmente es procedente')} readOnly className="mr-1" />Dar curso si legalmente es procedente</div>
                          <div><input type="checkbox" checked={seccion.destinos.includes('Elaborar Resolución')} readOnly className="mr-1" />Elaborar Resolución</div>
                          <div><input type="checkbox" checked={seccion.destinos.includes('Elaborar Contrato')} readOnly className="mr-1" />Elaborar Contrato</div>
                          <div><input type="checkbox" checked={seccion.destinos.includes('Archivar')} readOnly className="mr-1" />Archivar</div>
                        </div>
                      </div>
                      
                      <div className="p-1">
                        <div className="text-xs">
                          <div className="font-bold mb-1">Instrucciones Adicionales:</div>
                          <div className="min-h-[80px]">
                            {seccion.instrucciones ? (
                              <div className="whitespace-pre-wrap">{seccion.instrucciones}</div>
                            ) : (
                              <div>
                                <div>...................................................................</div>
                                <div>...................................................................</div>
                                <div>...................................................................</div>
                                <div>...................................................................</div>
                                <div>...................................................................</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NuevaHojaRuta;