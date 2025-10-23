import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import GuardarIcon from '../assets/guardaron';
import VolverIcon from '../assets/Flecha down';
import OjoIcon from '../assets/ojo';
import PdfIcon from '../assets/pdf';
import SedegesLogo from './SedegesLogo';

interface FormData {
  numero_hr: string;
  referencia: string;
  prioridad: 'urgente' | 'prioritario' | 'rutinario' | 'otros' | '';
  procedencia: string;
  fecha_documento: string;
  fecha_ingreso: string;
  cite: string;
  numero_fojas: string;
  destino_principal: string;
  destinos: string[];
  instrucciones_adicionales: string;
  // Campos adicionales del documento físico
  fecha_recepcion_1: string;
  destino_1: string;
  instrucciones_adicionales_1: string;
  fecha_recepcion_2: string;
  destino_2: string;
  instrucciones_adicionales_2: string;
  fecha_recepcion_3: string;
  destino_3: string;
  instrucciones_adicionales_3: string;
}

const destinosOptions = [
  'Para su conocimiento',
  'Preparar respuesta o informe',
  'Analizar y emitir opinión',
  'Procesar de acuerdo a normas',
  'Dar curso si legalmente es procedente',
  'Elaborar Resolución',
  'Elaborar Contrato',
  'Concertar reunión',
  'Asistir a reunión, invitación en mi representación',
  'Archivar'
];

const NuevaHojaRuta: React.FC = () => {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    numero_hr: '',
    referencia: '',
    prioridad: '',
    procedencia: '',
    fecha_documento: '',
    fecha_ingreso: '',
    cite: '',
    numero_fojas: '',
    destino_principal: '',
    destinos: [],
    instrucciones_adicionales: '',
    fecha_recepcion_1: '',
    destino_1: '',
    instrucciones_adicionales_1: '',
    fecha_recepcion_2: '',
    destino_2: '',
    instrucciones_adicionales_2: '',
    fecha_recepcion_3: '',
    destino_3: '',
    instrucciones_adicionales_3: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Datos del formulario:', formData);
      toast.success('Hoja de ruta guardada exitosamente');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar la hoja de ruta');
    }
  };

  const handlePrint = async () => {
    if (!printRef.current) return;
    try {
      setShowPreview(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
      const pdf = new jsPDF('p', 'mm', [215.9, 355.6]);
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 215.9;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `hoja-ruta-${formData.numero_hr || timestamp}.pdf`;
      pdf.save(filename);
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/dashboard')} className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900">
              <VolverIcon width={20} height={20} className="mr-2" />
              Volver al Dashboard
            </button>
            <div className="flex items-center space-x-4">
              {showPreview && (
                <button onClick={handlePrint} className="px-4 py-2 bg-red-600 text-white rounded-lg">
                  Descargar PDF
                </button>
              )}
              <button onClick={() => setShowPreview(!showPreview)} className="px-4 py-2 bg-green-600 text-white rounded-lg">
                {showPreview ? 'Editar' : 'Vista Previa'}
              </button>
            </div>
          </div>
        </div>

        {!showPreview ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold mb-6">Nueva Hoja de Ruta</h1>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Número H.R. *</label>
                  <input type="text" name="numero_hr" value={formData.numero_hr} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Prioridad *</label>
                  <select name="prioridad" value={formData.prioridad} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Seleccionar</option>
                    <option value="urgente">Urgente</option>
                    <option value="prioritario">Prioritario</option>
                    <option value="rutinario">Rutinario</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Referencia *</label>
                  <textarea name="referencia" value={formData.referencia} onChange={handleInputChange} required rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Procedencia *</label>
                  <input type="text" name="procedencia" value={formData.procedencia} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha Documento *</label>
                  <input type="date" name="fecha_documento" value={formData.fecha_documento} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha Ingreso *</label>
                  <input type="date" name="fecha_ingreso" value={formData.fecha_ingreso} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cite</label>
                  <input type="text" name="cite" value={formData.cite} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Número Fojas</label>
                  <input type="number" name="numero_fojas" value={formData.numero_fojas} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Destino</label>
                <textarea name="destino_principal" value={formData.destino_principal} onChange={handleInputChange} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Escriba el destino principal..." />
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
                        {destinosOptions.map((destino) => (
                          <label key={`destino1_${destino}`} className="flex items-center">
                            <input type="checkbox" name={`destino1_${destino}`} className="mr-2" />
                            <span className="text-sm">{destino}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Columna derecha: Instrucciones Adicionales 1 */}
                    <div className="pl-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Instrucciones Adicionales 1</label>
                        <textarea name="instrucciones_adicionales_1" value={formData.instrucciones_adicionales_1} onChange={handleInputChange} rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
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
                        {destinosOptions.map((destino) => (
                          <label key={`destino2_${destino}`} className="flex items-center">
                            <input type="checkbox" name={`destino2_${destino}`} className="mr-2" />
                            <span className="text-sm">{destino}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Columna derecha: Instrucciones Adicionales 2 */}
                    <div className="pl-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Instrucciones Adicionales 2</label>
                        <textarea name="instrucciones_adicionales_2" value={formData.instrucciones_adicionales_2} onChange={handleInputChange} rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
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
                        {destinosOptions.map((destino) => (
                          <label key={`destino3_${destino}`} className="flex items-center">
                            <input type="checkbox" name={`destino3_${destino}`} className="mr-2" />
                            <span className="text-sm">{destino}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Columna derecha: Instrucciones Adicionales 3 */}
                    <div className="pl-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Instrucciones Adicionales 3</label>
                        <textarea name="instrucciones_adicionales_3" value={formData.instrucciones_adicionales_3} onChange={handleInputChange} rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-2 border border-gray-300 rounded-lg">Cancelar</button>
                <button type="button" onClick={() => setShowPreview(true)} className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg">
                  <OjoIcon width={16} height={16} fill="white" className="mr-2" />
                  Vista Previa
                </button>
                <button type="button" onClick={handlePrint} className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg">
                  <PdfIcon width={16} height={16} fill="white" className="mr-2" />
                  Descargar PDF
                </button>
                <button type="submit" className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg">
                  <GuardarIcon width={16} height={16} fill="white" className="mr-2" />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white shadow-lg" ref={printRef}>
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

                {/* Segunda fila: PROCEDENCIA | FECHA DE DOCUMENTO */}
                <tr>
                  <td className="border border-black bg-gray-100 p-1 font-bold">PROCEDENCIA</td>
                  <td className="border border-black p-1" colSpan={2}>{formData.procedencia}</td>
                </tr>

                {/* Tercera fila: FECHA DE DOCUMENTO | FECHA DE INGRESO */}
                <tr>
                  <td className="border border-black bg-gray-100 p-1 font-bold">FECHA DE DOCUMENTO</td>
                  <td className="border border-black p-1">{formData.fecha_documento}</td>
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
                      <div><input type="checkbox" checked={formData.destinos.includes('Preparar respuesta o informe')} readOnly className="mr-1" />Preparar respuesta o informe</div>
                      <div><input type="checkbox" checked={formData.destinos.includes('Analizar y emitir opinión')} readOnly className="mr-1" />Analizar y emitir opinión</div>
                      <div><input type="checkbox" checked={formData.destinos.includes('Procesar de acuerdo a normas')} readOnly className="mr-1" />Procesar de acuerdo a normas</div>
                      <div><input type="checkbox" checked={formData.destinos.includes('Dar curso si legalmente es procedente')} readOnly className="mr-1" />Dar curso si legalmente es procedente</div>
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
                { fecha: formData.fecha_recepcion_1, destino: formData.destino_1, instrucciones: formData.instrucciones_adicionales_1 },
                { fecha: formData.fecha_recepcion_2, destino: formData.destino_2, instrucciones: formData.instrucciones_adicionales_2 },
                { fecha: formData.fecha_recepcion_3, destino: formData.destino_3, instrucciones: formData.instrucciones_adicionales_3 }
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
                          <div><input type="checkbox" readOnly className="mr-1" />Para su conocimiento</div>
                          <div><input type="checkbox" readOnly className="mr-1" />Analizar y emitir opinión</div>
                          <div><input type="checkbox" readOnly className="mr-1" />Dar curso se legalmente es procedente</div>
                          <div><input type="checkbox" readOnly className="mr-1" />Proceder de acuerdo a normas</div>
                          <div><input type="checkbox" readOnly className="mr-1" />Preparar respuesta o informe</div>
                          <div><input type="checkbox" readOnly className="mr-1" />Elaborar Resolución</div>
                          <div><input type="checkbox" readOnly className="mr-1" />Elaborar Contrato</div>
                          <div><input type="checkbox" readOnly className="mr-1" />Archivar</div>
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