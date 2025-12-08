import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image';
import VolverIcon from '../assets/Flecha down';
import PdfIcon from '../assets/pdf';
import HojaRutaPreview from './HojaRutaPreview';
// import duplicado eliminado
import DosLineas from '../assets/dosLineas';
import XLogo from '../assets/X';

const DashboardHojaRuta: React.FC = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [hoja, setHoja] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHoja = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_BASE_URL}/api/hojas-ruta/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHoja(res.data);
      } catch (err) {
        setError('No se pudo cargar la hoja de ruta.');
      } finally {
        setLoading(false);
      }
    };
    fetchHoja();
  }, [id, token]);

  const handlePrint = async () => {
    if (!printRef.current) return;
    try {
      const element = printRef.current;
      const dataUrl = await domtoimage.toPng(element);
      const img = new window.Image();
      img.src = dataUrl;
      img.onload = () => {
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
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
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `hoja-ruta-${hoja.numero_hr || timestamp}.pdf`;
        pdf.save(filename);
      };
    } catch (error) {
      alert('Error al generar el PDF');
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!hoja) return null;

  const [menuOpen, setMenuOpen] = useState(false);
  return (
  <div className="min-h-screen flex flex-col bg-white">
      <div className="flex flex-1">
        {/* Menú lateral */}
        <aside
          className={`relative transition-all duration-300 bg-white shadow-lg border-r border-esmeralda-100 ${menuOpen ? 'w-56' : 'w-16'} flex flex-col`}
        >
          <button
            className="absolute top-4 left-4 z-10 p-2 rounded-lg bg-esmeralda-50 hover:bg-esmeralda-100 transition-all"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <span className="block">
              {menuOpen ? <XLogo width={28} height={28} fill="var(--color-punzo-600)" /> : <DosLineas width={28} height={28} fill="var(--color-punzo-600)" />}
            </span>
          </button>
          <div className={`mt-20 flex-1 flex flex-col items-center ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
            <span className="mb-6 font-bold text-esmeralda-700">Menú</span>
            <button className="mb-4 px-4 py-2 rounded-lg text-esmeralda-700 font-semibold hover:bg-esmeralda-50 w-full text-left transition-all">Inicio</button>
            <button className="mb-4 px-4 py-2 rounded-lg text-esmeralda-700 font-semibold hover:bg-esmeralda-50 w-full text-left transition-all">Soporte</button>
          </div>
        </aside>
        {/* Main content */}
  <main className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <header className="h-20 flex items-center justify-end px-8 bg-white border-b border-esmeralda-100 shadow-sm">
            <div className="flex items-center gap-6 text-sm text-esmeralda-700 font-semibold">
              <span>Hora: 12:00</span>
              <span>Fecha: 27/10/2025</span>
              <span>Usuario: jose</span>
              <button className="px-3 py-1 rounded bg-punzo-600 text-white font-bold hover:bg-punzo-700 transition-all">Cerrar sesión</button>
            </div>
          </header>
          {/* Tablas/contenido principal */}
          <section className="flex-1 flex flex-col items-center justify-center bg-white">
            <div className="w-full flex flex-col items-center">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => navigate('/registros')} className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900">
                  <VolverIcon width={20} height={20} className="mr-2" />
                  Volver a Registros
                </button>
                <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg">
                  <PdfIcon width={18} height={18} className="mr-2" />
                  Descargar PDF
                </button>
              </div>
              {/* Vista previa profesional para impresión y PDF */}
              <div ref={printRef} className="mb-6 w-full flex justify-center">
                <HojaRutaPreview data={hoja.detalles || hoja} />
              </div>
            </div>
          </section>
          {/* Notificaciones/alertas */}
          <section className="h-32 flex items-center justify-center bg-white border-t border-esmeralda-100">
            <span className="text-punzo-700 font-semibold">Notificaciones / alertas</span>
          </section>
          {/* Footer */}
          <footer className="h-12 flex items-center justify-center bg-white border-t border-esmeralda-100 text-xs text-esmeralda-700 font-semibold">
            Sistema SEDEGES La Paz &copy; 2025
          </footer>
        </main>
      </div>
    </div>
  );
};

export default DashboardHojaRuta;
