import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import SedegesLogo from './SedegesLogo';
import CerrarIcon from '../assets/cerrar';
import GuardarIcon from '../assets/guardaron';
import PdfIcon from '../assets/pdf';

interface HojaRutaForm {
  numero_hr: string;
  referencia: string;
  procedencia: string;
  fecha_documento: string;
  fecha_ingreso: string;
  cite: string;
  numero_fojas: string;
  prioridad: 'urgente' | 'prioritario' | 'rutinario' | 'otros';
  destinos: string[];
  instrucciones_adicionales: string;
}

const NuevaHojaRuta = () => {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<HojaRutaForm>({
    numero_hr: '',
    referencia: '',
    procedencia: '',
    fecha_documento: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    cite: '',
    numero_fojas: '',
    prioridad: 'rutinario',
    destinos: [],
    instrucciones_adicionales: ''
  });

  const [showPreview, setShowPreview] = useState(false);

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

  const handleInputChange = (field: keyof HojaRutaForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDestinoChange = (destino: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      destinos: checked 
        ? [...prev.destinos, destino]
        : prev.destinos.filter(d => d !== destino)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.referencia || !formData.procedencia) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    try {
      // Aquí enviarás los datos al backend
      toast.success('Hoja de ruta creada exitosamente');
      // navigate('/registros');
    } catch (error) {
      toast.error('Error al crear la hoja de ruta');
    }
  };

  const handlePreview = () => {
    setShowPreview(!showPreview);
  };

  const handlePrint = async () => {
    if (!printRef.current) return;
    
    try {
      // Crear un canvas desde el elemento HTML
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // Mejor calidad
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: printRef.current.scrollWidth,
        height: printRef.current.scrollHeight
      });

      // Crear el PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calcular las dimensiones para ajustar al PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Agregar la imagen al PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Si la imagen es más alta que una página, agregar páginas adicionales
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generar el nombre del archivo con fecha y hora
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const fileName = `hoja-ruta-${formData.numero_hr || timestamp}.pdf`;

      // Descargar el PDF
      pdf.save(fileName);
      
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900"
              >
                <CerrarIcon width={20} height={20} fill="currentColor" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Nueva Hoja de Ruta</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handlePreview}
                className="flex items-center px-4 py-2 bg-[#007A3D] text-white rounded-lg hover:bg-[#15803D] transition-colors"
              >
                Vista Previa
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {!showPreview ? (
          /* FORMULARIO DE EDICIÓN */
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Número H.R. */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número H.R. *
                </label>
                <input
                  type="text"
                  value={formData.numero_hr}
                  onChange={(e) => handleInputChange('numero_hr', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: HR-001-2025"
                />
              </div>

              {/* Fecha de Ingreso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Ingreso
                </label>
                <input
                  type="date"
                  value={formData.fecha_ingreso}
                  onChange={(e) => handleInputChange('fecha_ingreso', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Referencia */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referencia *
                </label>
                <textarea
                  value={formData.referencia}
                  onChange={(e) => handleInputChange('referencia', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describa la referencia del documento..."
                />
              </div>

              {/* Procedencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Procedencia *
                </label>
                <input
                  type="text"
                  value={formData.procedencia}
                  onChange={(e) => handleInputChange('procedencia', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Origen del documento"
                />
              </div>

              {/* Fecha de Documento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Documento
                </label>
                <input
                  type="date"
                  value={formData.fecha_documento}
                  onChange={(e) => handleInputChange('fecha_documento', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Cite */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cite
                </label>
                <input
                  type="text"
                  value={formData.cite}
                  onChange={(e) => handleInputChange('cite', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Número de cite"
                />
              </div>

              {/* Número de Fojas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Fojas
                </label>
                <input
                  type="number"
                  value={formData.numero_fojas}
                  onChange={(e) => handleInputChange('numero_fojas', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Número de fojas"
                />
              </div>

              {/* Prioridad */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <div className="grid grid-cols-4 gap-4">
                  {(['urgente', 'prioritario', 'rutinario', 'otros'] as const).map((prioridad) => (
                    <label key={prioridad} className="flex items-center">
                      <input
                        type="radio"
                        name="prioridad"
                        value={prioridad}
                        checked={formData.prioridad === prioridad}
                        onChange={(e) => handleInputChange('prioridad', e.target.value)}
                        className="mr-2"
                      />
                      <span className="capitalize">{prioridad}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Destinos */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destino
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {destinosOptions.map((destino) => (
                    <label key={destino} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.destinos.includes(destino)}
                        onChange={(e) => handleDestinoChange(destino, e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">{destino}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Instrucciones Adicionales */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instrucciones Adicionales
                </label>
                <textarea
                  value={formData.instrucciones_adicionales}
                  onChange={(e) => handleInputChange('instrucciones_adicionales', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Instrucciones adicionales..."
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center px-6 py-2 bg-[#007A3D] text-white rounded-lg hover:bg-[#15803D] transition-colors"
              >
                <GuardarIcon width={16} height={16} fill="white" className="mr-2" />
                Guardar Hoja de Ruta
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center px-6 py-2 bg-[#D81E05] text-white rounded-lg hover:bg-[#B91C1C] transition-colors"
              >
                <PdfIcon width={16} height={16} fill="white" className="mr-2" />
                Descargar PDF
              </button>
            </div>
          </form>
        ) : (
          /* VISTA PREVIA - FORMATO OFICIAL */
          <div className="bg-white shadow-lg print:shadow-none" id="hoja-ruta-preview" ref={printRef}>
            <div className="p-8 max-w-4xl mx-auto">
              
              {/* Encabezado Oficial */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <SedegesLogo width={60} height={60} />
                  <div className="ml-4">
                    <p className="text-sm font-bold text-punzo">SEDEGES</p>
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <h1 className="text-lg font-bold text-punzo mb-1">
                    SERVICIO DEPARTAMENTAL DE GESTIÓN SOCIAL
                  </h1>
                  <h2 className="text-base font-bold text-punzo border-2 border-punzo pb-1 px-4 inline-block">
                    HOJA DE RUTA
                  </h2>
                </div>
                <div className="text-right">
                  <div className="border-2 border-punzo p-2 min-w-[120px] bg-esmeralda-50">
                    <p className="text-xs font-bold text-center text-punzo">NÚMERO H.R.</p>
                    <div className="border-t border-punzo mt-1 pt-1">
                      <p className="font-bold text-center text-punzo">{formData.numero_hr || '........................'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información Principal */}
              <div className="mb-4">
                {/* Primera fila: Referencia y Prioridad */}
                <div className="grid grid-cols-12 gap-0 mb-2">
                  {/* Referencia */}
                  <div className="col-span-8 border-2 border-gray-600">
                    <div className="bg-esmeralda-100 p-1 border-b border-gray-600">
                      <span className="text-xs font-bold text-gray-800">REFERENCIA</span>
                    </div>
                    <div className="p-2 min-h-[60px] bg-white">
                      <p className="text-xs text-gray-800">{formData.referencia}</p>
                    </div>
                  </div>

                  {/* Prioridad */}
                  <div className="col-span-4 border-2 border-gray-600 border-l-0">
                    <div className="grid grid-cols-2 text-xs">
                      <div className="bg-esmeralda-100 p-1 border-r border-gray-600 border-b border-gray-600 flex items-center">
                        <input type="checkbox" checked={formData.prioridad === 'urgente'} readOnly className="mr-1 scale-75" />
                        <span className="text-xs font-semibold text-gray-800">URGENTE</span>
                      </div>
                      <div className="bg-esmeralda-100 p-1 border-b border-gray-600 flex items-center">
                        <input type="checkbox" checked={formData.prioridad === 'prioritario'} readOnly className="mr-1 scale-75" />
                        <span className="text-xs font-semibold text-gray-800">PRIORITARIO</span>
                      </div>
                      <div className="bg-esmeralda-100 p-1 border-r border-gray-600 flex items-center">
                        <input type="checkbox" checked={formData.prioridad === 'rutinario'} readOnly className="mr-1 scale-75" />
                        <span className="text-xs font-semibold text-gray-800">RUTINARIO</span>
                      </div>
                      <div className="bg-esmeralda-100 p-1 flex items-center">
                        <input type="checkbox" checked={formData.prioridad === 'otros'} readOnly className="mr-1 scale-75" />
                        <span className="text-xs font-semibold text-gray-800">OTROS</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Segunda fila: Procedencia, Fecha Documento, Fecha Ingreso */}
                <div className="grid grid-cols-12 gap-0">
                  {/* Procedencia y Fecha de Documento */}
                  <div className="col-span-8 border-2 border-gray-400 border-t-0">
                    <div className="bg-gray-100 p-1 grid grid-cols-2 border-b border-gray-400">
                      <span className="text-xs font-bold border-r border-gray-400 pr-1">PROCEDENCIA:</span>
                      <span className="text-xs font-bold pl-1">FECHA DE DOCUMENTO</span>
                    </div>
                    <div className="p-2 grid grid-cols-2">
                      <span className="text-xs border-r border-gray-400 pr-2">{formData.procedencia}</span>
                      <span className="text-xs pl-2">{formData.fecha_documento}</span>
                    </div>
                  </div>

                  {/* Fecha de Ingreso */}
                  <div className="col-span-4 border-2 border-gray-400 border-l-0 border-t-0">
                    <div className="bg-gray-100 p-1 border-b border-gray-400">
                      <span className="text-xs font-bold">FECHA DE INGRESO</span>
                    </div>
                    <div className="p-2">
                      <span className="text-xs">{formData.fecha_ingreso}</span>
                    </div>
                  </div>
                </div>

                {/* Tercera fila: Cite y No. Fojas */}
                <div className="grid grid-cols-12 gap-0">
                  <div className="col-span-8"></div>
                  <div className="col-span-4 border-2 border-gray-400 border-t-0 border-l-0">
                    <div className="grid grid-cols-2">
                      <div className="bg-gray-100 p-1 border-r border-gray-400 border-b border-gray-400">
                        <span className="text-xs font-bold">CITE:</span>
                      </div>
                      <div className="bg-gray-100 p-1 border-b border-gray-400">
                        <span className="text-xs font-bold">No. FOJAS</span>
                      </div>
                      <div className="p-1 border-r border-gray-400">
                        <span className="text-xs">{formData.cite}</span>
                      </div>
                      <div className="p-1">
                        <span className="text-xs">{formData.numero_fojas}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información Importante */}
              <div className="border border-gray-400 mb-4">
                <div className="bg-gray-100 p-2">
                  <h3 className="font-bold">IMPORTANTE</h3>
                </div>
                <div className="p-3">
                  <ul className="text-xs space-y-1">
                    <li>• La Hoja de Ruta debe encabezar todos los documentos en cualquier tipo de trámites.</li>
                    <li>• A través de la hoja de ruta se podrá determinar dónde está la obstaculización, retraso u otras anomalías</li>
                    <li>• Todo trámite debe ser atendido en plazos mínimos establecidos</li>
                  </ul>
                </div>
              </div>

              {/* Destinos */}
              <div className="border border-gray-400 mb-4">
                <div className="bg-gray-100 p-2">
                  <h3 className="font-bold">DESTINO</h3>
                </div>
                <div className="p-3">
                  {destinosOptions.map((destino) => (
                    <div key={destino} className="flex items-center mb-1">
                      <input 
                        type="checkbox" 
                        checked={formData.destinos.includes(destino)}
                        readOnly
                        className="mr-2" 
                      />
                      <span className="text-sm">{destino}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instrucciones Adicionales */}
              {formData.instrucciones_adicionales && (
                <div className="border border-gray-400 mb-4">
                  <div className="bg-gray-100 p-2">
                    <h3 className="font-bold">INSTRUCCIONES ADICIONALES:</h3>
                  </div>
                  <div className="p-3">
                    <p className="text-sm">{formData.instrucciones_adicionales}</p>
                  </div>
                </div>
              )}


            </div>
          </div>
        )}
      </div>

      {/* CSS para impresión */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #hoja-ruta-preview, #hoja-ruta-preview * {
              visibility: visible;
            }
            #hoja-ruta-preview {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:shadow-none {
              box-shadow: none !important;
            }
          }
        `
      }} />
    </div>
  );
};

export default NuevaHojaRuta;