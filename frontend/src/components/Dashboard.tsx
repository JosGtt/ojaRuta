
import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [hojas, setHojas] = useState<HojaRuta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
    <DashboardLayout user={user} onLogout={handleLogout}>
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-gradient-to-br from-[#e8f5e9] via-[#fff] to-[#ffeaea] py-8 px-2">
        <div className="w-full max-w-7xl bg-white/90 rounded-3xl shadow-2xl p-14 flex flex-col items-center border-4 border-black/20">
          <div className="flex items-center mb-6">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#006837]/20 mr-7 shadow-2xl">
              <HistorialIcon width={44} height={44} className="text-[#006837]" />
            </span>
            <h1 className="text-5xl font-black text-[#006837] tracking-tight drop-shadow-xl">Registros de Hojas de Ruta</h1>
          </div>
          <form onSubmit={handleSearch} className="flex w-full max-w-xl items-center gap-2 mb-8">
            <input
              type="text"
              placeholder="Buscar por número o referencia..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 px-8 py-5 border-2 border-[#006837] rounded-2xl bg-[#f9f9f9] focus:outline-none focus:ring-2 focus:ring-[#b71c1c] text-2xl shadow-lg font-semibold"
            />
            <button type="submit" className="bg-[#b71c1c] hover:bg-black text-white px-12 py-5 rounded-2xl flex items-center font-black shadow-xl text-2xl transition-all">
              <LupayIcon width={28} height={28} className="mr-3" /> Buscar
            </button>
          </form>
          <div className="w-full">
            {loading ? (
              <div className="text-gray-500 text-center py-8 text-lg">Cargando...</div>
            ) : error ? (
              <div className="text-red-500 text-center py-8 text-lg">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-2xl border-separate border-spacing-0 rounded-3xl overflow-hidden shadow-2xl">
                  <thead>
                    <tr className="bg-[#006837] text-white">
                      <th className="p-6 border-b-4 font-black tracking-wide">N° H.R.</th>
                      <th className="p-6 border-b-4 font-black tracking-wide">Referencia</th>
                      <th className="p-6 border-b-4 font-black tracking-wide">Procedencia</th>
                      <th className="p-6 border-b-4 font-black tracking-wide">Prioridad</th>
                      <th className="p-6 border-b-4 font-black tracking-wide">Estado</th>
                      <th className="p-6 border-b-4 font-black tracking-wide">Fecha Ingreso</th>
                      <th className="p-6 border-b-4 font-black tracking-wide">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hojas.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-gray-500 text-center py-16 text-2xl">No se encontraron hojas de ruta.</td>
                      </tr>
                    ) : (
                      hojas.map(hr => (
                        <tr key={hr.id} className="hover:bg-[#b71c1c]/10 transition cursor-pointer">
                          <td className="p-6 border-b font-mono text-center">{hr.numero_hr}</td>
                          <td className="p-6 border-b text-center">{hr.referencia}</td>
                          <td className="p-6 border-b text-center">{hr.procedencia}</td>
                          <td className="p-6 border-b text-center capitalize">
                            <span className={`px-6 py-3 rounded-full text-xl font-black ${hr.prioridad === 'Urgente' ? 'bg-[#b71c1c]/10 text-[#b71c1c]' : 'bg-[#006837]/10 text-[#006837]'}`}>{hr.prioridad}</span>
                          </td>
                          <td className="p-6 border-b text-center capitalize">
                            <span className={`px-6 py-3 rounded-full text-xl font-black ${hr.estado === 'Pendiente' ? 'bg-black/10 text-black' : 'bg-[#006837]/10 text-[#006837]'}`}>{hr.estado}</span>
                          </td>
                          <td className="p-6 border-b text-center">{hr.fecha_ingreso?.slice(0,10)}</td>
                          <td className="p-6 border-b text-center">
                            <button
                              onClick={() => navigate(`/hoja/${hr.id}`)}
                              className="bg-[#006837] hover:bg-[#b71c1c] text-white px-8 py-4 rounded-xl text-xl font-black shadow-xl transition-all"
                            >
                              Ver Detalle
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;