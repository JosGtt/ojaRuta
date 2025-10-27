
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LupayIcon from '../assets/lupay';
import HistorialIcon from '../assets/historial';

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

const RegistrosPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
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
    fetchHojas();
    // eslint-disable-next-line
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHojas(query);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
        <HistorialIcon width={28} height={28} className="mr-2" />
        Registros de Hojas de Ruta
      </h1>
      <form onSubmit={handleSearch} className="flex items-center gap-2 mb-6">
        <input
          type="text"
          placeholder="Buscar por número o referencia..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg w-full max-w-md"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
          <LupayIcon width={18} height={18} className="mr-1" /> Buscar
        </button>
      </form>
      {loading ? (
        <div className="text-gray-500">Cargando...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-4">
          {hojas.length === 0 ? (
            <div className="text-gray-500">No se encontraron hojas de ruta.</div>
          ) : (
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">N° H.R.</th>
                  <th className="p-2 border">Referencia</th>
                  <th className="p-2 border">Procedencia</th>
                  <th className="p-2 border">Prioridad</th>
                  <th className="p-2 border">Estado</th>
                  <th className="p-2 border">Fecha Ingreso</th>
                  <th className="p-2 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {hojas.map(hr => (
                  <tr key={hr.id} className="hover:bg-blue-50 transition cursor-pointer">
                    <td className="p-2 border font-mono">{hr.numero_hr}</td>
                    <td className="p-2 border">{hr.referencia}</td>
                    <td className="p-2 border">{hr.procedencia}</td>
                    <td className="p-2 border capitalize">{hr.prioridad}</td>
                    <td className="p-2 border capitalize">{hr.estado}</td>
                    <td className="p-2 border">{hr.fecha_ingreso?.slice(0,10)}</td>
                    <td className="p-2 border">
                      <button
                        onClick={() => navigate(`/hoja/${hr.id}`)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default RegistrosPage;