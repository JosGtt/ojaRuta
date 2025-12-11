# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Instalar http-server globalmente
RUN npm install -g http-server

# Copiar archivos build desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD http-server dist -p ${PORT:-3000} -a 0.0.0.0 --proxy http://localhost:${PORT:-3000}?
