const HistorialPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Historial y Seguimiento</h1>
      <p className="text-gray-600 mt-2">Seguimiento detallado de documentos</p>
      
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Próximamente:</h2>
        <ul className="space-y-2 text-gray-600">
          <li>• Timeline de movimientos por hoja de ruta</li>
          <li>• Estado actual de cada documento</li>
          <li>• Tiempo promedio por proceso</li>
          <li>• Alertas de documentos rezagados</li>
        </ul>
      </div>
    </div>
  );
};

export default HistorialPage;