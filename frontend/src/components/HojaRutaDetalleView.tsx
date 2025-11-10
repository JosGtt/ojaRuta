import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import HojaRutaPreview from './HojaRutaPreview';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image';
import { toast } from 'react-toastify';

interface HojaRutaDetalleViewProps {
  hoja: any;
  onBack: () => void;
}

const HojaRutaDetalleView: React.FC<HojaRutaDetalleViewProps> = ({ hoja, onBack }) => {
  const { token } = useAuth();
  const [hojaCompleta, setHojaCompleta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

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
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (img.height * imgWidth) / img.width;
        let heightLeft = imgHeight;
        const pdf = new jsPDF('p', 'mm', 'a4');
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

      {/* Tarjetas de información */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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