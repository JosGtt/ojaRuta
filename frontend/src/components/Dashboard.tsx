import React from 'react';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Importar los SVG
import DashboardIcon from '../assets/dashboard';
import CerrarIcon from '../assets/cerrar';
import UsuarioIcon from '../assets/usario';
import HistorialIcon from '../assets/historial';
import RegistrosIcon from '../assets/registros';
import NotificationIcon from '../assets/notification';
import AñadirIcon from '../assets/añadir';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('Sesión cerrada correctamente');
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Nueva Hoja de Ruta',
      description: 'Crear una nueva hoja de ruta',
      icon: AñadirIcon,
      color: 'from-green-500 to-green-600',
      path: '/nueva-hoja'
    },
    {
      title: 'Registros',
      description: 'Ver todas las hojas de ruta',
      icon: RegistrosIcon,
      color: 'from-blue-500 to-blue-600',
      path: '/registros'
    },
    {
      title: 'Historial',
      description: 'Seguimiento de documentos',
      icon: HistorialIcon,
      color: 'from-purple-500 to-purple-600',
      path: '/historial'
    },
    {
      title: 'Notificaciones',
      description: 'Alertas del sistema',
      icon: NotificationIcon,
      color: 'from-yellow-500 to-yellow-600',
      path: '/notificaciones'
    }
  ];

  const stats = [
    { title: 'Hojas de Ruta Activas', value: '24', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Pendientes de Revisión', value: '8', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { title: 'Finalizadas Hoy', value: '12', color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'En Proceso', value: '16', color: 'text-purple-600', bg: 'bg-purple-50' }
  ];

  return (
    <DashboardLayout user={user} onLogout={handleLogout}>
      <div className="w-full max-w-7xl px-4 py-6 sm:px-0 mx-auto">
        {/* Bienvenida */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenido, {user?.nombre_completo}
          </h2>
          <p className="text-gray-600">
            Sistema de Control y Seguimiento de Hojas de Ruta - SEDEGES La Paz
          </p>
        </div>
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className={`${stat.bg} rounded-lg p-6 border`}>
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Menú principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 border hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-linear-to-r ${item.color} mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon width={24} height={24} fill="white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </button>
          ))}
        </div>
        {/* Sección de información institucional */}
        <div className="mt-8 bg-linear-to-r from-blue-600 to-green-600 rounded-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Servicio Departamental de Gestión Social
              </h3>
              <p className="text-blue-100 mb-4">
                Promoviendo el desarrollo social integral en el departamento de La Paz
              </p>
              <div className="flex items-center text-sm text-blue-100">
                <DashboardIcon width={16} height={16} fill="currentColor" className="mr-2" />
                Sistema en línea - Versión 1.0
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold">SEDEGES</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;