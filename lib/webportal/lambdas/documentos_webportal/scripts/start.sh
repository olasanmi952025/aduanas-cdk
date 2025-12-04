#!/bin/sh

# Script de inicio adaptativo para Docker/K8s
# Detecta el entorno y ejecuta la aplicación apropiadamente

echo "🚀 Iniciando Aduanas Service..."
echo "📋 Entorno: ${NODE_ENV:-development}"
echo "🌐 Puerto: ${PORT:-3000}"

# Verificar si estamos en Lambda (no debería pasar en Docker)
if [ -n "$AWS_LAMBDA_FUNCTION_NAME" ]; then
  echo "⚠️  Detectado entorno Lambda en contenedor Docker - esto no debería pasar"
  echo "🔄 Ejecutando como aplicación HTTP estándar..."
fi

# Verificar si el directorio dist existe
if [ ! -d "dist" ]; then
  echo "❌ Directorio dist no encontrado. Compilando aplicación..."
  npm run build
fi

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
  echo "❌ node_modules no encontrado. Instalando dependencias..."
  npm install --only=production
fi

# Configurar variables de entorno para Docker/K8s
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}

# Log de configuración
echo "🔧 Configuración:"
echo "   - NODE_ENV: $NODE_ENV"
echo "   - PORT: $PORT"
echo "   - DB_HOST: ${DB_HOST:-localhost}"
echo "   - DB_PORT: ${DB_PORT:-5432}"
echo "   - DB_NAME: ${DB_NAME:-nestjs_api}"

# Verificar conectividad de base de datos (opcional)
if [ -n "$DB_HOST" ] && [ "$DB_HOST" != "localhost" ]; then
  echo "🔍 Verificando conectividad de base de datos..."
  # Aquí podrías agregar un ping o verificación de conectividad
fi

echo "✅ Iniciando aplicación NestJS..."

# Ejecutar aplicación
exec node dist/main.js

