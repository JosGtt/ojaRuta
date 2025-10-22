import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../components/Login';
import Dashboard from '../components/Dashboard';
import NuevaHojaRuta from '../components/NuevaHojaRuta';
import ProtectedRoute from '../components/ProtectedRoute';
import RegistrosPage from '../pages/RegistrosPage';
import HistorialPage from '../pages/HistorialPage';
import NotificacionesPage from '../pages/NotificacionesPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Redirección desde la raíz al dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Ruta de login */}
      <Route path="/login" element={<Login />} />
      
      {/* Rutas protegidas */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/nueva-hoja" 
        element={
          <ProtectedRoute>
            <NuevaHojaRuta />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/registros" 
        element={
          <ProtectedRoute>
            <RegistrosPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/historial" 
        element={
          <ProtectedRoute>
            <HistorialPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/notificaciones" 
        element={
          <ProtectedRoute>
            <NotificacionesPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default AppRoutes;