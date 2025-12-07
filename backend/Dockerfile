# Dockerfile para Railway
FROM node:18-alpine

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 3001

# Comando de inicio
CMD ["npm", "start"]