const RegistrosPage: React.FC = () => null;

export default RegistrosPage;
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

  const RegistrosPage: React.FC = () => {
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