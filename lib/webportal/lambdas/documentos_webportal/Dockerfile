# Dockerfile específico para Lambda Docker de documentos_webportal
# Basado en la imagen oficial de AWS Lambda para Node.js 20
FROM public.ecr.aws/lambda/nodejs:20

# Instalar dependencias del sistema necesarias para Oracle Instant Client
# Node 20 usa Amazon Linux 2023 que usa dnf en lugar de yum
RUN dnf update -y && \
    dnf install -y wget unzip libaio libnsl glibc python3 make g++ && \
    dnf clean all

# Crear directorio para Oracle Instant Client
RUN mkdir -p /opt/oracle

# Descargar e instalar Oracle Instant Client para Linux x64
WORKDIR /opt/oracle

# Descargar Oracle Instant Client Basic y SDK (versión 19.3 compatible con Oracle 11g y superiores)
RUN wget https://download.oracle.com/otn_software/linux/instantclient/193000/instantclient-basic-linux.x64-19.3.0.0.0dbru.zip && \
    wget https://download.oracle.com/otn_software/linux/instantclient/193000/instantclient-sdk-linux.x64-19.3.0.0.0dbru.zip

# Descomprimir archivos
RUN unzip instantclient-basic-linux.x64-19.3.0.0.0dbru.zip && \
    unzip instantclient-sdk-linux.x64-19.3.0.0.0dbru.zip && \
    rm *.zip

# Configurar Oracle Instant Client
WORKDIR /opt/oracle/instantclient_19_3

# Crear enlaces simbólicos necesarios para Oracle Client
RUN ln -sf libclntsh.so.19.1 libclntsh.so && \
    ln -sf libocci.so.19.1 libocci.so && \
    chmod +x * && \
    ls -la

# Configurar variables de entorno para Oracle
ENV ORACLE_CLIENT_LIB_DIR=/opt/oracle/instantclient_19_3
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_19_3:$LD_LIBRARY_PATH
ENV TNS_ADMIN=/opt/oracle/instantclient_19_3
ENV OCI_LIB_DIR=/opt/oracle/instantclient_19_3
ENV ORACLE_INSTANT_CLIENT_PATH=/opt/oracle/instantclient_19_3
ENV ORACLE_HOME=/opt/oracle/instantclient_19_3

# Volver al directorio de trabajo de Lambda
WORKDIR ${LAMBDA_TASK_ROOT}

# Copiar package.json e instalar dependencias Node.js
COPY package*.json ./
COPY .npmrc ./

# Instalar todas las dependencias (incluyendo devDependencies para compilar)
RUN npm ci && \
    npm cache clean --force

# Copiar código fuente TypeScript (verificar que existan)
COPY tsconfig.json tsconfig.json
COPY tsconfig.build.json tsconfig.build.json
COPY src/ src/

# Compilar TypeScript a JavaScript
RUN npm run build

# Limpiar devDependencies después de la compilación
RUN npm prune --production

# El handler está en dist/lambda.js con export llamado "handler"
CMD ["dist/lambda.handler"]

