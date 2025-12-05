# Instrucciones para Probar la Lambda de Exportar PDF desde la Consola de AWS

## Opción 1: Usar la Consola de AWS Lambda (Recomendado)

### Paso 1: Acceder a la Lambda
1. Ve a la consola de AWS Lambda: https://console.aws.amazon.com/lambda/
2. Busca la función lambda con el nombre que contiene `export_guias_webportal`
3. Haz clic en la función para abrirla

### Paso 2: Crear un Evento de Prueba
1. En la pestaña "Test" (o "Probar" en español), haz clic en "Create new test event" (Crear nuevo evento de prueba)
2. Selecciona "Create new test event" (si es la primera vez) o "Edit test event" (si ya existe uno)
3. Copia el contenido del archivo `test-event-export-pdf.json` que está en la raíz del proyecto
4. Pega el contenido en el editor
5. Dale un nombre al evento (ej: "test-export-pdf")
6. Guarda el evento

### Paso 3: Configurar los Parámetros del Test
Antes de ejecutar, asegúrate de modificar los siguientes valores en el JSON del evento:

- **`guideIds`**: Reemplaza `[12345]` con los IDs reales de las guías que quieres exportar
  - Ejemplo: `[100, 101, 102]` para exportar 3 guías
  - Puedes usar un solo ID: `[100]`
  
- **`requestId`**: Puedes dejarlo como está o cambiarlo por un ID único
  - Ejemplo: `"request-test-$(date +%s)"` o simplemente `"test-request-001"`

- **`fileName`**: (Opcional) Nombre del archivo PDF resultante
  - Si no lo especificas, se generará automáticamente
  - Ejemplo: `"mis_guias.pdf"` o `null`

- **`userId`**: ID del usuario que realiza la exportación
  - Ejemplo: `142` (valor por defecto) o el ID real del usuario

### Paso 4: Ejecutar la Prueba
1. Haz clic en el botón "Test" (Probar)
2. Espera a que la lambda termine de ejecutarse (puede tardar varios minutos)
3. Revisa los logs en CloudWatch para ver el progreso

### Paso 5: Verificar los Resultados
1. Revisa los logs de ejecución en la pestaña "Monitor" → "View CloudWatch logs"
2. Busca mensajes como:
   - `"Procesando exportación PDF. RequestId: ..."`
   - `"Exportación PDF completada exitosamente. RequestId: ..."`
3. El PDF se guardará en S3 y se generará una URL firmada
4. Puedes verificar el estado en DynamoDB usando el `requestId`

## Opción 2: Usar AWS CLI

Si prefieres usar la línea de comandos, puedes usar el siguiente comando:

```bash
aws lambda invoke \
  --function-name <NOMBRE_DE_TU_LAMBDA> \
  --payload file://test-event-export-pdf.json \
  --region us-east-1 \
  response.json
```

Reemplaza `<NOMBRE_DE_TU_LAMBDA>` con el nombre real de tu función lambda.

## Estructura del Evento de Prueba

El evento simula un mensaje SQS con el siguiente formato:

```json
{
  "Records": [
    {
      "messageId": "test-message-id-12345",
      "receiptHandle": "test-receipt-handle-12345",
      "body": "{\"type\":\"pdf.export\",\"payload\":{...}}",
      ...
    }
  ]
}
```

El `body` contiene el mensaje real con:
- **type**: `"pdf.export"` (tipo de mensaje)
- **payload**: Contiene los datos de la exportación
  - `guideIds`: Array de IDs de guías a exportar
  - `requestId`: ID único de la solicitud
  - `fileName`: (Opcional) Nombre del archivo
  - `userId`: (Opcional) ID del usuario

## Notas Importantes

1. **Timeout**: La lambda tiene un timeout de 15 minutos, así que las pruebas pueden tardar
2. **Permisos**: Asegúrate de que la lambda tenga permisos para:
   - Acceder a S3 (para guardar el PDF)
   - Acceder a DynamoDB (para actualizar el estado)
   - Acceder a la base de datos Oracle (para obtener datos de las guías)
   - Acceder al servicio SOAP (para generar el PDF)
3. **VPC**: La lambda está en una VPC, asegúrate de que tenga acceso a los recursos necesarios
4. **Logs**: Revisa siempre los logs de CloudWatch para ver errores o información de depuración

## Ejemplo de Evento para Múltiples Guías

Si quieres exportar múltiples guías en un ZIP:

```json
{
  "Records": [
    {
      "messageId": "test-message-id-12345",
      "receiptHandle": "test-receipt-handle-12345",
      "body": "{\"id\":\"test-request-002\",\"type\":\"pdf.export\",\"payload\":{\"guideIds\":[100,101,102,103],\"requestId\":\"test-request-002\",\"fileName\":\"guias_multiple.zip\",\"userId\":142},\"timestamp\":\"2024-01-15T10:00:00.000Z\",\"source\":\"test\"}",
      "attributes": {
        "ApproximateReceiveCount": "1",
        "SentTimestamp": "1609459200000",
        "SenderId": "AIDAIT2UOQQY3AUEKVGXU",
        "ApproximateFirstReceiveTimestamp": "1609459200000"
      },
      "messageAttributes": {},
      "md5OfBody": "test-md5-hash",
      "eventSource": "aws:sqs",
      "eventSourceARN": "arn:aws:sqs:us-east-1:123456789012:test-queue",
      "awsRegion": "us-east-1"
    }
  ]
}
```

## Verificar el Estado de la Exportación

Después de ejecutar la lambda, puedes verificar el estado usando el `requestId`:

1. Ve a DynamoDB en la consola de AWS
2. Busca la tabla de exportaciones (debe tener un nombre como `export-status` o similar)
3. Busca el item con el `requestId` que usaste en la prueba
4. Verifica el campo `status` (debe ser `completed` si todo salió bien)
5. El campo `signedUrl` contendrá la URL para descargar el PDF

