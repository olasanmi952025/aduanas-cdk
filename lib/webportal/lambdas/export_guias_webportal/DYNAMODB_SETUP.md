# Configuración de DynamoDB para Estado de Exportaciones

## Crear la Tabla DynamoDB

### Opción 1: Usando AWS CLI

```bash
aws dynamodb create-table \
  --table-name export-status \
  --attribute-definitions \
    AttributeName=requestId,AttributeType=S \
  --key-schema \
    AttributeName=requestId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --time-to-live-specification \
    Enabled=true,AttributeName=ttl
```

### Opción 2: Usando AWS Console

1. Ve a la consola de AWS DynamoDB
2. Haz clic en "Create table"
3. Configura la tabla:
   - **Table name**: `export-status`
   - **Partition key**: `requestId` (tipo String)
   - **Table settings**: Usar configuración predeterminada
   - **Capacity settings**: On-demand (pago por uso)

4. Después de crear la tabla, configura TTL:
   - Ve a la pestaña "Additional settings"
   - En "Time to live (TTL)", habilita TTL
   - **TTL attribute**: `ttl`

### Opción 3: Usando CloudFormation/Terraform

#### CloudFormation Template

```yaml
Resources:
  ExportStatusTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: export-status
      AttributeDefinitions:
        - AttributeName: requestId
          AttributeType: S
      KeySchema:
        - AttributeName: requestId
          KeyType: HASH
      BillingMode: PAY_PER_REQUEST
      TimeToLiveSpecification:
        Enabled: true
        AttributeName: ttl
```

#### Terraform

```hcl
resource "aws_dynamodb_table" "export_status" {
  name           = "export-status"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "requestId"

  attribute {
    name = "requestId"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}
```

## Estructura de la Tabla

### Clave Primaria
- **requestId** (String): ID único de la solicitud de exportación

### Atributos
- **status** (String): Estado de la exportación
  - Valores posibles: `pending`, `processing`, `completed`, `failed`
- **createdAt** (String): Fecha de creación en formato ISO 8601
- **updatedAt** (String): Fecha de última actualización en formato ISO 8601
- **ttl** (Number): Timestamp Unix en segundos para expiración automática (15 minutos)
- **signedUrl** (String, opcional): URL firmada del archivo en S3 (solo cuando status = completed)
- **fileName** (String, opcional): Nombre del archivo generado
- **error** (String, opcional): Mensaje de error (solo cuando status = failed)

## Configuración de Variables de Entorno

Agrega en tu archivo `.env`:

```env
DYNAMODB_EXPORT_STATUS_TABLE=export-status
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
```

## Permisos IAM Requeridos

El rol o usuario IAM necesita los siguientes permisos:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/export-status"
    }
  ]
}
```

## Verificación

Para verificar que la tabla se creó correctamente:

```bash
aws dynamodb describe-table --table-name export-status
```

## Notas Importantes

1. **TTL**: Los registros se eliminan automáticamente después de 15 minutos desde su creación
2. **Billing**: Se recomienda usar `PAY_PER_REQUEST` para evitar costos innecesarios
3. **Región**: Asegúrate de crear la tabla en la misma región que tus otros servicios AWS
4. **Seguridad**: Configura políticas IAM apropiadas para limitar el acceso a la tabla

