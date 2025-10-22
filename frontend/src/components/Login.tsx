import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Importar los SVG personalizados
import IconLogo from '../assets/usario';
import ContraLogo from '../assets/contraseña';
import OjoLogo from '../assets/ojo';
import OjoCerradoLogo from '../assets/ojoCerrado';

const Login = () => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usuario || !password) {
      toast.error('Por favor ingrese usuario y contraseña');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(usuario, password);
      
      if (success) {
        toast.success('¡Bienvenido al Sistema SEDEGES!');
        navigate('/dashboard');
      } else {
        toast.error('Usuario o contraseña incorrectos');
      }
    } catch (error) {
      toast.error('Error de conexión. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-green-700 flex items-center justify-center p-4">
      {/* Fondo con patrón boliviano */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full bg-[radial-gradient(circle_at_25%_25%,white_2px,transparent_2px)] bg-[length:24px_24px]"></div>
      </div>
      
      <div className="relative w-full max-w-md">
        {/* Tarjeta principal */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm border border-white/20">
          
          {/* Header gubernamental */}
          <div className="text-center mb-8">
            {/* Logo del Estado Plurinacional */}
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-red-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-900">S</span>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-2">SEDEGES</h1>
            <p className="text-sm text-gray-600 mb-1">Servicio Departamental de Gestión Social</p>
            <p className="text-xs text-gray-500">Gobernación Autónoma de La Paz</p>
            <div className="w-16 h-0.5 bg-gradient-to-r from-blue-600 to-green-600 mx-auto mt-3"></div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Usuario */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconLogo width={20} height={20} fill="#6B7280" />
                </div>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Ingrese su usuario"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ContraLogo width={20} height={20} fill="#6B7280" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese su contraseña"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <OjoCerradoLogo width={20} height={20} fill="#6B7280" />
                  ) : (
                    <OjoLogo width={20} height={20} fill="#6B7280" />
                  )}
                </button>
              </div>
            </div>

            {/* Botón de login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Accediendo...
                </div>
              ) : (
                'Ingresar al Sistema'
              )}
            </button>
          </form>

          {/* Información adicional */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>Sistema de Control y Seguimiento</p>
              <p>de Hojas de Ruta - SEDEGES La Paz</p>
              <p className="text-blue-600 font-medium">© 2025 Estado Plurinacional de Bolivia</p>
            </div>
          </div>

          {/* Datos de prueba (solo para desarrollo) */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 text-center">
              <span className="font-medium">Datos de prueba:</span><br/>
              Usuario: jose | Contraseña: jose
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;