const NotificacionesPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Notificaciones del Sistema</h1>
      <p className="text-gray-600 mt-2">Centro de alertas y notificaciones</p>
      
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Próximamente:</h2>
        <ul className="space-y-2 text-gray-600">
          <li>• Notificaciones en tiempo real</li>
          <li>• Alertas de vencimientos</li>
          <li>• Recordatorios automáticos</li>
          <li>• Configuración de preferencias</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificacionesPage;