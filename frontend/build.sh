#!/bin/bash

# Eliminar archivos backup que causan problemas de compilación
echo "🧹 Limpiando archivos backup..."

# Eliminar archivos backup si existen
if [ -f "src/components/HojaRutaDetalleView_backup.tsx" ]; then
    rm "src/components/HojaRutaDetalleView_backup.tsx"
    echo "✅ Eliminado HojaRutaDetalleView_backup.tsx"
fi

if [ -f "src/pages/EnviarPageNew.tsx" ]; then
    rm "src/pages/EnviarPageNew.tsx"
    echo "✅ Eliminado EnviarPageNew.tsx"
fi

if [ -f "src/pages/RegistrosPage_backup.tsx" ]; then
    rm "src/pages/RegistrosPage_backup.tsx"
    echo "✅ Eliminado RegistrosPage_backup.tsx"
fi

# Instalar dependencias y compilar
echo "📦 Instalando dependencias..."
npm install

echo "🏗️ Compilando aplicación..."
npm run build

echo "🎉 Build completado exitosamente!"