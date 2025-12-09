# Dockerfile para Railway - Build desde raíz
FROM node:18-alpine

WORKDIR /app

# Copiar package.json del backend
COPY backend/package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente del backend
COPY backend ./

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 3001

# Comando de inicio
CMD ["npm", "start"]
