# 🏛️ Sistema de Hojas de Ruta - SEDEGES La Paz

Sistema completo para la gestión de hojas de ruta del Servicio Departamental de Gestión Social (SEDEGES) del Gobierno Autónomo Departamental de La Paz, Bolivia.

## 📋 Descripción

Sistema web profesional que digitaliza el proceso de gestión de hojas de ruta institucionales, permitiendo crear, gestionar y generar PDFs oficiales que replican exactamente el formato físico utilizado por SEDEGES.

## ✨ Características

### 🎯 Funcionalidades Principales
- ✅ **Autenticación JWT** - Sistema seguro de login
- ✅ **Creación de Hojas de Ruta** - Formulario completo con todos los campos oficiales
- ✅ **Vista Previa en Tiempo Real** - Visualización exacta del documento oficial
- ✅ **Generación de PDF** - Descarga de documentos con colores y formato institucional
- ✅ **Diseño Responsive** - Compatible con dispositivos móviles y escritorio
- ✅ **Colores Institucionales** - Implementación de la paleta oficial SEDEGES

### 🎨 Diseño
- **Colores Oficiales**: Punzó (#D81E05) y Esmeralda (#007A3D)
- **Logo Institucional**: Imagen oficial de SEDEGES
- **Tipografía**: Diseño profesional y legible
- **UX/UI**: Interfaz intuitiva y moderna

## 🛠️ Tecnologías

### Frontend
- **React 18** con TypeScript
- **Vite** - Build tool moderno y rápido
- **TailwindCSS 4** - Styling utility-first
- **React Router DOM** - Navegación SPA
- **React Hook Form** - Gestión de formularios
- **Axios** - Cliente HTTP
- **jsPDF + html2canvas** - Generación de PDFs
- **React Toastify** - Notificaciones

### Backend
- **Node.js** con **Express.js**
- **TypeScript** - Tipado estático
- **PostgreSQL 9.6** - Base de datos
- **JWT** - Autenticación segura
- **bcryptjs** - Hashing de contraseñas
- **CORS** - Cross-Origin Resource Sharing

## 📦 Estructura del Proyecto

```
ojaRuta/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/          # Páginas principales
│   │   ├── routes/         # Configuración de rutas
│   │   ├── contexts/       # Contextos de React
│   │   └── assets/         # Íconos e imágenes
│   ├── public/             # Archivos estáticos
│   └── package.json
├── backend/                  # API Express.js
│   ├── src/
│   │   ├── controllers/    # Controladores
│   │   ├── middleware/     # Middlewares
│   │   ├── routes/         # Rutas de API
│   │   └── config/         # Configuraciones
│   └── package.json
└── database/                # Scripts y esquemas SQL
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (v16 o superior)
- PostgreSQL 9.6+
- Git

### 1. Clonar el Repositorio
```bash
git clone https://github.com/JosGtt/ojaRuta.git
cd ojaRuta
```

### 2. Configurar Base de Datos
```sql
-- Crear base de datos
CREATE DATABASE "sedegesOjaRuta";

-- Ejecutar el script SQL incluido en /database/schema.sql
```

### 3. Configurar Backend
```bash
cd backend
npm install

# Crear archivo .env
cp .env.example .env
# Configurar variables de entorno:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=sedegesOjaRuta
# DB_USER=postgres
# DB_PASSWORD=tu_password
# JWT_SECRET=tu_jwt_secret_muy_seguro
# PORT=3001
```

### 4. Configurar Frontend
```bash
cd ../frontend
npm install
```

### 5. Ejecutar el Proyecto

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Servidor corriendo en http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Aplicación corriendo en http://localhost:5173
```

## 🔐 Credenciales de Acceso

**Usuario de prueba:**
- **Usuario**: jose
- **Contraseña**: jose

## 📊 Base de Datos

### Tablas Principales
- **usuarios** - Gestión de usuarios del sistema
- **hojas_ruta** - Almacena las hojas de ruta creadas
- **destinos** - Catálogo de destinos disponibles
- **tipos_tramite** - Tipos de trámites
- **seguimiento** - Historial de seguimiento

## 🎯 Funcionalidades Implementadas

### ✅ Completadas
- Sistema de autenticación JWT
- Dashboard principal
- Formulario de nueva hoja de ruta
- Vista previa del documento
- Generación de PDF con colores oficiales
- Arquitectura de componentes limpia
- Responsive design

### 🔄 En Desarrollo
- CRUD completo de hojas de ruta
- Sistema de seguimiento
- Reportes y estadísticas
- Gestión de usuarios
- Notificaciones en tiempo real

## 📝 API Endpoints

```
POST /api/auth/login     # Autenticación
GET  /api/auth/profile   # Perfil del usuario
POST /api/hojas-ruta     # Crear hoja de ruta
GET  /api/hojas-ruta     # Listar hojas de ruta
GET  /api/hojas-ruta/:id # Obtener hoja de ruta específica
```

## 🎨 Guía de Colores

```css
/* Colores Oficiales SEDEGES */
--color-punzo: #D81E05;     /* Rojo institucional */
--color-esmeralda: #007A3D; /* Verde institucional */

/* Variaciones */
--color-punzo-50: #FEF2F2;
--color-punzo-700: #B91C1C;
--color-esmeralda-50: #F0FDF4;
--color-esmeralda-700: #15803D;
```

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama para nueva característica (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es de uso interno para SEDEGES La Paz.

## 👨‍💻 Desarrollador

Desarrollado para el Gobierno Autónomo Departamental de La Paz - SEDEGES

---

**🏛️ SEDEGES La Paz - Servicio Departamental de Gestión Social**