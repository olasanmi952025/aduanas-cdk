# Dockerfile para Lambda Docker de consume_soap
# Basado en la imagen oficial de AWS Lambda para Node.js 20
FROM public.ecr.aws/lambda/nodejs:20

# Volver al directorio de trabajo de Lambda
WORKDIR ${LAMBDA_TASK_ROOT}

# Copiar package.json e instalar dependencias Node.js
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código fuente TypeScript
COPY tsconfig.json tsconfig.json
COPY src/ src/

# Instalar TypeScript globalmente para compilar
RUN npm install -g typescript && \
    tsc && \
    npm uninstall -g typescript

# El handler está en dist/index.js con export llamado "handler"
CMD ["dist/index.handler"]

