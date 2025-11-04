import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../contexts/SearchContext';

interface HojaRuta {
  id: number;
  numero_hr: string;
  referencia: string;
  procedencia: string;
  fecha_documento?: string;
  fecha_ingreso: string;
  cite?: string;
  numero_fojas?: number;
  prioridad: string;
  estado: string;
}

const RegistrosPageClean: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { query } = useSearch();
  const [hojas, setHojas] = useState<HojaRuta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHojas = async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:3001/api/hojas-ruta', {
        params: search ? { query: search } : {},
        headers: { Authorization: `Bearer ${token}` }
      });
      setHojas(res.data);
    } catch (err) {
      setError('Error al cargar hojas de ruta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHojas(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
  <div className="w-full">
      {loading ? (
        <div className="text-gray-300">Cargando...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <div className="bg-[rgba(0,0,0,0.18)] rounded-2xl p-4">
          {hojas.length === 0 ? (
            <div className="text-gray-300">No se encontraron hojas de ruta.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm bg-transparent rounded-md overflow-hidden text-white">
                <thead>
                  <tr className="bg-[rgba(255,255,255,0.04)]">
                    <th className="p-3 text-left text-sm font-semibold text-white/80">N° H.R.</th>
                    <th className="p-3 text-left text-sm font-semibold text-white/80">Referencia</th>
                    <th className="p-3 text-left text-sm font-semibold text-white/80">Procedencia</th>
                    <th className="p-3 text-left text-sm font-semibold text-white/80">Prioridad</th>
                    <th className="p-3 text-left text-sm font-semibold text-white/80">Estado</th>
                    <th className="p-3 text-left text-sm font-semibold text-white/80">Fecha Ingreso</th>
                    <th className="p-3 text-left text-sm font-semibold text-white/80">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {hojas.map(hr => (
                    <tr key={hr.id} className="transition hover:bg-[rgba(255,255,255,0.02)] cursor-pointer">
                      <td className="p-3 border-b border-white/6 font-mono text-white">{hr.numero_hr}</td>
                      <td className="p-3 border-b border-white/6 text-white">{hr.referencia}</td>
                      <td className="p-3 border-b border-white/6 text-white">{hr.procedencia}</td>
                      <td className="p-3 border-b border-white/6 text-white capitalize">{hr.prioridad}</td>
                      <td className="p-3 border-b border-white/6 text-white capitalize">{hr.estado}</td>
                      <td className="p-3 border-b border-white/6 text-white">{hr.fecha_ingreso?.slice(0,10)}</td>
                      <td className="p-3 border-b border-white/6">
                        <button
                          onClick={() => navigate(`/hoja/${hr.id}`)}
                          className="bg-[var(--color-vino-oscuro)] hover:bg-[var(--color-vino)] text-white px-3 py-1 rounded-md text-sm shadow-sm"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegistrosPageClean;
