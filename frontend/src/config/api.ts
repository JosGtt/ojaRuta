// Configuración de API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// URL completa para las rutas de API
export const API_ENDPOINTS = {
  AUTH: `${API_BASE_URL}/api/auth`,
  HOJAS_RUTA: `${API_BASE_URL}/api/hojas-ruta`,
  DESTINOS: `${API_BASE_URL}/api/destinos`,
  ENVIAR: `${API_BASE_URL}/api/enviar`,
  NOTIFICACIONES: `${API_BASE_URL}/api/notificaciones`,
  HISTORIAL: `${API_BASE_URL}/api/historial`
};

console.log('🌐 API configurada para:', API_BASE_URL);