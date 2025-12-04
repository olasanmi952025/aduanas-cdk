# Integración con AWS Cognito y API Gateway Authorizer

## Arquitectura de Seguridad

El microservicio implementa una **arquitectura de seguridad de dos capas**:

1. **API Gateway Authorizer** - Valida tokens JWT de Cognito a nivel de infraestructura
2. **Application-level Authorization** - Valida roles y permisos a nivel de aplicación

### Variables de Entorno

```bash
# Cognito Configuration (Requerido)
COGNITO_JWKS_URI=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_nJrsAxdlE/.well-known/jwks.json
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_nJrsAxdlE
COGNITO_CLIENT_ID=4unqen0rhebdg89p8cdjquqh8h

# JWT (Opcional, para desarrollo local)
JWT_PUBLIC_KEY=
```

## API Gateway Authorizer

### Configuración en template.yaml

```yaml
AduanasServiceApi:
  Type: AWS::Serverless::Api
  Properties:
    Auth:
      Authorizers:
        CognitoAuthorizer:
          UserPoolArn: !Sub "arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/${CognitoUserPoolId}"
          Identity:
            Header: Authorization
            ValidationExpression: "^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$"
          CacheTtlInSeconds: 300
      DefaultAuthorizer: CognitoAuthorizer
    EndpointConfiguration:
      Types:
        - REGIONAL
```

### Características de Seguridad

- **Validación de tokens** a nivel de infraestructura
- **Caché de autorizador** (300 segundos) para mejor rendimiento
- **Validación estricta** de formato JWT
- **Endpoint regional** para menor latencia
- **Respuestas personalizadas** para errores de autorización

## Extracción de Roles

El sistema extrae roles del token Cognito en este orden de prioridad:

### 1. **cognito:groups** (Recomendado)
```json
{
  "cognito:groups": ["admin", "user"]
}
```

### 2. **groups** (Alternativo)
```json
{
  "groups": ["admin", "user"]
}
```

### 3. **roles** (Custom claim)
```json
{
  "roles": ["admin", "user"]
}
```

### 4. **cognito:roles** (Custom attribute)
```json
{
  "cognito:roles": ["admin", "user"]
}
```

### 5. **Default**
Si no se encuentran roles, se asigna `[]` (sin permisos).

## Configuración en Cognito

### 1. Crear User Pool Groups

```bash
# Crear grupos en Cognito
aws cognito-idp create-group \
  --group-name admin \
  --user-pool-id us-east-1_ABC123DEF \
  --description "Administrators"

aws cognito-idp create-group \
  --group-name user \
  --user-pool-id us-east-1_ABC123DEF \
  --description "Regular users"

aws cognito-idp create-group \
  --group-name viewer \
  --user-pool-id us-east-1_ABC123DEF \
  --description "Read-only users"
```

### 2. Configurar App Client para Incluir Grupos

**IMPORTANTE**: Para que los grupos aparezcan en los tokens, debes configurar el App Client:

```bash
# Actualizar App Client para incluir grupos en tokens
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_nJrsAxdlE \
  --client-id 4unqen0rhebdg89p8cdjquqh8h \
  --generate-secret \
  --explicit-auth-flows ADMIN_NO_SRP_AUTH ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --supported-identity-providers COGNITO \
  --token-validity-units AccessToken=hours IdToken=hours RefreshToken=days \
  --access-token-validity 1 \
  --id-token-validity 1 \
  --refresh-token-validity 30 \
  --read-attributes email_verified email \
  --write-attributes email
```

**Configuración en la Consola AWS**:
1. Ve a **Cognito User Pools** → Tu User Pool
2. Ve a **App integration** → **App clients and analytics**
3. Selecciona tu App Client
4. En **Hosted authentication UI**, configura:
   - **Identity providers**: Cognito User Pool
   - **OAuth 2.0 grant types**: Authorization code grant
   - **OpenID Connect scopes**: openid, email, profile
5. En **Token expiration**, configura:
   - **Access token**: 1 hour
   - **ID token**: 1 hour
   - **Refresh token**: 30 days

### 3. Asignar Usuarios a Grupos

```bash
# Asignar usuario a grupo
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_nJrsAxdlE \
  --username john.doe \
  --group-name admin
```

### 4. Configurar Custom Attributes (Opcional)

Si prefieres usar custom attributes en lugar de groups:

```bash
# Crear custom attribute
aws cognito-idp update-user-pool \
  --user-pool-id us-east-1_ABC123DEF \
  --schema Name=custom:roles,AttributeDataType=String,Mutable=true
```

## Ejemplos de Tokens

### Token Cognito con Groups
```json
{
  "sub": "12345678-1234-1234-1234-123456789012",
  "cognito:groups": ["admin", "user"],
  "email": "john.doe@example.com",
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ABC123DEF",
  "aud": "your-cognito-client-id",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Token Custom con Roles
```json
{
  "sub": "user123",
  "roles": ["admin", "user"],
  "email": "john.doe@example.com",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Validación

El sistema valida tokens en este orden:

1. **Cognito JWT**: Usa JWKS para verificar firma
2. **Custom JWT**: Fallback usando JWT_PUBLIC_KEY

### Verificación Cognito
- ✅ Firma del token (RS256)
- ✅ Issuer (COGNITO_ISSUER)
- ✅ Audience (COGNITO_CLIENT_ID)
- ✅ Expiración

### Verificación Custom
- ✅ Firma del token (RS256/HS256)
- ✅ Expiración

## Testing

### 1. Obtener Token de Cognito

```bash
# Usar AWS CLI para obtener token
aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_nJrsAxdlE \
  --client-id 4unqen0rhebdg89p8cdjquqh8h \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=john.doe,PASSWORD=password123
```

### 2. Generar Tokens de Prueba (Desarrollo Local)

```bash
# Token admin con grupos
node scripts/generate-test-token.js admin cognito

# Token con múltiples roles
node scripts/generate-test-token.js "admin,viewer" cognito

# Token user
node scripts/generate-test-token.js user cognito
```

### 3. Probar Endpoints

#### Desarrollo Local (SAM)
```bash
# Endpoint público
curl http://localhost:3000/samples/public

# Endpoint con autenticación
curl -H "Authorization: Bearer YOUR_COGNITO_TOKEN" \
     http://localhost:3000/samples

# Endpoint que requiere admin
curl -H "Authorization: Bearer YOUR_COGNITO_TOKEN" \
     -X DELETE http://localhost:3000/samples/123
```

#### Producción (API Gateway)
```bash
# Endpoint público
curl https://your-api-gateway-url/samples/public

# Endpoint con autenticación (API Gateway valida el token)
curl -H "Authorization: Bearer YOUR_COGNITO_TOKEN" \
     https://your-api-gateway-url/samples

# Endpoint que requiere admin
curl -H "Authorization: Bearer YOUR_COGNITO_TOKEN" \
     -X DELETE https://your-api-gateway-url/samples/123
```

### 4. Verificar Logs de Autorización

Los logs muestran el proceso de autorización:

```
[RolesOnlyGuard] [GET] /samples - Checking authorization
[RolesOnlyGuard] [GET] /samples - User: 047804f8-9061-7021-e18b-799376d6c72f, Roles: [admin, viewer]
[RolesGuard] [GET] /samples - Checking role authorization
[RolesGuard] [GET] /samples - Required roles: ["admin","user","viewer"]
[RolesGuard] [GET] /samples - User roles: ["admin","viewer"]
[RolesGuard] [GET] /samples - Has required role: true
[RolesGuard] [GET] /samples - Role authorization successful
```

## Troubleshooting

### Error: "Invalid token format"
- Verificar que el token tenga header con `kid`
- Token debe ser JWT válido
- **API Gateway**: Verificar que el token tenga el formato correcto según `ValidationExpression`

### Error: "Invalid issuer"
- Verificar COGNITO_ISSUER en variables de entorno
- Debe coincidir exactamente con el issuer del token
- **API Gateway**: Verificar que el User Pool ID sea correcto en `template.yaml`

### Error: "Invalid audience"
- Verificar COGNITO_CLIENT_ID
- Debe coincidir con el client_id usado para generar el token
- **API Gateway**: Verificar que el App Client ID sea correcto

### Error: "JWKS fetch failed"
- Verificar COGNITO_JWKS_URI
- Asegurar conectividad a internet desde Lambda
- Verificar que el User Pool existe
- **API Gateway**: Este error no debería ocurrir ya que API Gateway maneja la validación

### Error: "403 Forbidden" (Roles vacíos)
- Verificar que el usuario esté asignado a grupos en Cognito
- Verificar que el App Client esté configurado para incluir grupos en tokens
- Revisar logs para ver qué roles se están extrayendo del token

### Error: "401 Unauthorized" (API Gateway)
- Verificar que el token sea válido y no haya expirado
- Verificar que el User Pool ID sea correcto en `template.yaml`
- Verificar que el token tenga el formato correcto (Bearer + JWT)

### Error: "Cognito User Pool not found"
- Verificar que el User Pool existe en la región correcta
- Verificar que el User Pool ID sea correcto en `parameters.json`
- Verificar permisos de IAM para acceder al User Pool

### Roles no se extraen correctamente
- Verificar que el usuario esté en los grupos correctos
- Revisar la configuración de custom attributes
- Verificar el payload del token en jwt.io

## Configuración SAM

### parameters.json
```json
{
  "ParameterKey": "CognitoJwksUri",
  "ParameterValue": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ABC123DEF/.well-known/jwks.json"
},
{
  "ParameterKey": "CognitoIssuer", 
  "ParameterValue": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ABC123DEF"
},
{
  "ParameterKey": "CognitoClientId",
  "ParameterValue": "your-cognito-client-id"
}
```

### template.yaml
Las variables se configuran automáticamente en el Lambda function.
