# Multi-stage build para optimización
FROM node:20-alpine AS builder

# Instalar dependencias del sistema
RUN apk add --no-cache python3 make g++

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY .npmrc ./

# Instalar dependencias (incluye dev para compilar)
RUN npm ci && npm cache clean --force

# Copiar código fuente
COPY . .

# Compilar aplicación
RUN npm run build

# Etapa de producción
FROM node:20-alpine AS production

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache dumb-init

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y lock, e instalar solo dependencias de producción
COPY --chown=nestjs:nodejs package*.json ./
COPY --chown=nestjs:nodejs .npmrc ./
RUN npm ci --omit=dev && npm cache clean --force

# Copiar artefactos compilados
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Crear directorio para logs
RUN mkdir -p /app/logs && chown nestjs:nodejs /app/logs

# Cambiar a usuario no-root
USER nestjs

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Script de inicio adaptativo
COPY --chown=nestjs:nodejs scripts/start.sh ./
RUN chmod +x start.sh

# Usar dumb-init para manejo correcto de señales
ENTRYPOINT ["dumb-init", "--"]

# Comando por defecto
CMD ["./start.sh"]
