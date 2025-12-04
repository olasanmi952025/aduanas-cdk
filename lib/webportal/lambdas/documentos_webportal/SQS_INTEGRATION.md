# SQS Integration y Dependencies Layer

## 🚀 **Nuevas Funcionalidades Implementadas**

### 1. **Interfaz SQS Opcional**
- **Procesamiento asíncrono** de mensajes
- **Dead Letter Queue (DLQ)** para mensajes fallidos
- **Retry automático** con configuración personalizable
- **Routing de mensajes** por tipo

### 2. **Dependencies Layer**
- **Optimización de Lambda** - Reduce tamaño del deployment
- **Reutilización de dependencias** - Mejor rendimiento
- **Compatibilidad híbrida** - Funciona con Docker y Kubernetes

### 3. **Arquitectura Híbrida**
- **Un solo código base** para múltiples plataformas
- **Configuración condicional** por parámetros
- **Build scripts adaptativos**

## 📋 **Tipos de Mensajes SQS Soportados**

### **sample.create**
```json
{
  "id": "unique-id",
  "type": "sample.create",
  "payload": {
    "name": "Sample Name",
    "description": "Sample Description",
    "isActive": true
  },
  "timestamp": "2025-10-16T12:30:00.000Z",
  "source": "api-gateway"
}
```

### **sample.update**
```json
{
  "id": "unique-id",
  "type": "sample.update",
  "payload": {
    "id": "sample-id",
    "name": "Updated Name",
    "description": "Updated Description"
  },
  "timestamp": "2025-10-16T12:30:00.000Z",
  "source": "api-gateway"
}
```

### **sample.delete**
```json
{
  "id": "unique-id",
  "type": "sample.delete",
  "payload": {
    "id": "sample-id"
  },
  "timestamp": "2025-10-16T12:30:00.000Z",
  "source": "api-gateway"
}
```

### **notification.send**
```json
{
  "id": "unique-id",
  "type": "notification.send",
  "payload": {
    "recipient": "user@example.com",
    "subject": "Notification Subject",
    "message": "Notification message content"
  },
  "timestamp": "2025-10-16T12:30:00.000Z",
  "source": "api-gateway"
}
```

## 🛠️ **Configuración**

### **Habilitar SQS**
```bash
# En parameters.json
{
  "ParameterKey": "EnableSQS",
  "ParameterValue": "true"
}
```

### **Configurar Deployment Target**
```bash
# Para Lambda (con layer)
{
  "ParameterKey": "DeploymentTarget",
  "ParameterValue": "lambda"
}

# Para Docker
{
  "ParameterKey": "DeploymentTarget",
  "ParameterValue": "docker"
}

# Para Kubernetes
{
  "ParameterKey": "DeploymentTarget",
  "ParameterValue": "kubernetes"
}
```

## 🚀 **Comandos de Build**

### **Lambda con Layer**
```bash
npm run build:lambda
```

### **Docker**
```bash
npm run build:docker
```

### **Solo Layer**
```bash
npm run build:layer
```

## 🧪 **Testing**

### **Enviar Mensaje de Prueba**
```bash
# Mensaje básico
npm run test:sqs

# Mensaje específico
npm run test:sqs sample.create

# Con cola específica
npm run test:sqs sample.update aduanas-service-sandbox6-processing-queue
```

### **Verificar Logs**
```bash
# CloudWatch Logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/aduanas-service"

# Logs locales
sam logs -n AduanasServiceFunction --stack-name aduanas-service-sandbox6
```

## 📊 **Monitoreo**

### **Métricas SQS**
- **Messages Sent** - Mensajes enviados a la cola
- **Messages Received** - Mensajes procesados exitosamente
- **Messages in DLQ** - Mensajes fallidos
- **Processing Time** - Tiempo de procesamiento

### **Métricas Lambda**
- **Invocations** - Número de invocaciones
- **Duration** - Tiempo de ejecución
- **Errors** - Errores de procesamiento
- **Throttles** - Limitaciones de concurrencia

## 🔧 **Troubleshooting**

### **Mensajes en DLQ**
1. Verificar logs de Lambda
2. Revisar formato del mensaje
3. Validar permisos de SQS
4. Comprobar configuración de retry

### **Layer no funciona**
1. Verificar que `DeploymentTarget` sea `lambda`
2. Comprobar que el layer se construyó correctamente
3. Validar permisos de IAM para layers

### **SQS no procesa mensajes**
1. Verificar que `EnableSQS` sea `true`
2. Comprobar configuración de la cola
3. Validar permisos de Lambda para SQS

## 🎯 **Próximos Pasos**

1. **Desplegar a AWS** con SQS habilitado
2. **Configurar alertas** para DLQ
3. **Implementar más tipos** de mensajes
4. **Agregar métricas** personalizadas
5. **Optimizar rendimiento** del layer
