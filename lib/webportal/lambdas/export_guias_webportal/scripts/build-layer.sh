#!/bin/bash

# Script para construir el layer de dependencias
set -e

echo "🔨 Building dependencies layer..."

# Limpiar directorio del layer
rm -rf layers/dependencies/nodejs/node_modules

# Crear directorio si no existe
mkdir -p layers/dependencies/nodejs

# Copiar package.json al directorio del layer
cp layers/dependencies/package.json layers/dependencies/nodejs/

# Instalar dependencias en el directorio del layer
cd layers/dependencies/nodejs
npm install --omit=dev --silent

# Limpiar archivos innecesarios
rm -rf node_modules/.cache
rm -rf node_modules/*/test
rm -rf node_modules/*/tests
rm -rf node_modules/*/docs
rm -rf node_modules/*/examples
rm -rf node_modules/*/example

# Volver al directorio raíz
cd ../../..

echo "✅ Dependencies layer built successfully!"
echo "📦 Layer size: $(du -sh layers/dependencies/nodejs/node_modules | cut -f1)"
