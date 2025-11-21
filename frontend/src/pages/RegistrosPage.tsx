import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useSearch } from '../contexts/SearchContext';

interface HojaRuta {
  id: number;
  numero_hr: string;
  nombre_solicitante?: string;
  telefono_celular?: string;
  referencia: string;
  procedencia: string;
  fecha_documento?: string;
  fecha_ingreso: string;
  cite?: string;
  numero_fojas?: number;
  prioridad: string;
  estado: string;
  ubicacion_actual?: string;
  responsable_actual?: string;
}

interface RegistrosPageProps {
  onHojaSelected?: (hoja: HojaRuta) => void;
}

const RegistrosPage: React.FC<RegistrosPageProps> = ({ onHojaSelected }) => {
  const { token } = useAuth();
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
                    <th className="p-3 text-left text-sm font-semibold text-white/80">Nombre</th>
                    <th className="p-3 text-left text-sm font-semibold text-white/80">Teléfono</th>
                    <th className="p-3 text-left text-sm font-semibold text-white/80">Referencia</th>
                    <th className="p-3 text-left text-sm font-semibold text-white/80">Procedencia</th>
                    <th className="p-3 text-left text-sm font-semibold text-white/80">Prioridad</th>
                    <th className="p-3 text-left text-sm font-semibold text-slate-300">Ubicación Actual</th>
                    <th className="p-3 text-left text-sm font-semibold text-white/80">Estado</th>
                    <th className="p-3 text-left text-sm font-semibold text-white/80">Fecha Ingreso</th>
                    <th className="p-3 text-left text-sm font-semibold text-white/80">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {hojas.map(hr => (
                    <tr key={hr.id} className="transition hover:bg-[rgba(255,255,255,0.02)] cursor-pointer">
                      <td className="p-3 border-b border-white/6 font-mono text-white">{hr.numero_hr}</td>
                      <td className="p-3 border-b border-white/6 text-white">{hr.nombre_solicitante || '-'}</td>
                      <td className="p-3 border-b border-white/6 text-white">{hr.telefono_celular || '-'}</td>
                      <td className="p-3 border-b border-white/6 text-white">{hr.referencia}</td>
                      <td className="p-3 border-b border-white/6 text-white">{hr.procedencia}</td>
                      <td className="p-3 border-b border-white/6 text-white capitalize">{hr.prioridad}</td>
                      <td className="p-3 border-b border-white/6">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                            hr.ubicacion_actual 
                              ? (hr.ubicacion_actual.toLowerCase().includes('sedeges') 
                                 ? 'bg-slate-700 text-slate-200' 
                                 : 'bg-blue-800 text-blue-200')
                              : 'bg-red-800 text-red-200'
                          }`}>
                            {hr.ubicacion_actual ? (
                              hr.ubicacion_actual.toLowerCase().includes('sedeges') ? 'SEDEGES' : hr.ubicacion_actual.toUpperCase()
                            ) : 'Sin definir'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 border-b border-white/6 text-white capitalize">{hr.estado}</td>
                      <td className="p-3 border-b border-white/6 text-white">{hr.fecha_ingreso?.slice(0,10)}</td>
                      <td className="p-3 border-b border-white/6">
                        <button
                          onClick={() => onHojaSelected ? onHojaSelected(hr) : console.log('No handler provided')}
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

export default RegistrosPage;
        setHojas(res.data);
      } catch (err) {
        setError('Error al cargar hojas de ruta');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      // fetch initial and whenever the shared header query changes
      fetchHojas(query);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-6">
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
                <table className="w-full text-sm bg-white rounded-md overflow-hidden">
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
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  export default RegistrosPage;
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      );

    };

    export default RegistrosPage;