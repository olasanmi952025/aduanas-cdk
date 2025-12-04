# Sistema de Roles y Permisos

## Roles Definidos

### 1. **admin**
- **Permisos**: Acceso completo a todas las operaciones
- **Operaciones**: GET, POST, PUT, DELETE
- **Uso**: Administradores del sistema

### 2. **user** 
- **Permisos**: Lectura, creación y modificación
- **Operaciones**: GET, POST, PUT
- **Uso**: Usuarios regulares con permisos de escritura

### 3. **viewer**
- **Permisos**: Solo lectura
- **Operaciones**: GET
- **Uso**: Usuarios con acceso de solo consulta

## Estructura del JWT

El JWT debe incluir el campo `roles` con un array de roles:

```json
{
  "sub": "user123",
  "email": "user@example.com",
  "roles": ["admin", "user"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Endpoints y Roles Requeridos

### Públicos (sin autenticación)
- `GET /samples/public` - Mensaje público

### Con Autenticación JWT

#### **viewer** (lectura)
- `GET /samples` - Listar todos los samples
- `GET /samples/:id` - Obtener sample por ID

#### **user** (lectura + escritura)
- `GET /samples` - Listar todos los samples
- `GET /samples/:id` - Obtener sample por ID
- `POST /samples` - Crear nuevo sample
- `PUT /samples/:id` - Actualizar sample

#### **admin** (acceso completo)
- `GET /samples` - Listar todos los samples
- `GET /samples/:id` - Obtener sample por ID
- `POST /samples` - Crear nuevo sample
- `PUT /samples/:id` - Actualizar sample
- `DELETE /samples/:id` - Eliminar sample

## Implementación

### 1. Decorador de Roles
```typescript
@Roles('admin', 'user', 'viewer')
@Get()
findAll() {
  return this.service.findAll();
}
```

### 2. Guard de Roles
El `RolesGuard` verifica que el usuario tenga al menos uno de los roles requeridos.

### 3. Configuración Global
Los guards están configurados globalmente en `JwtAuthModule`:
- `JwtAuthGuard`: Verifica autenticación JWT
- `RolesGuard`: Verifica permisos de roles

## Ejemplos de Uso

### Token con rol admin
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     -X DELETE http://localhost:3000/samples/123
# ✅ Permitido - admin puede eliminar
```

### Token con rol user
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     -X DELETE http://localhost:3000/samples/123
# ❌ Error 403 - user no puede eliminar
```

### Token con rol viewer
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     -X POST http://localhost:3000/samples \
     -d '{"name": "test"}'
# ❌ Error 403 - viewer no puede crear
```

## Personalización

### Agregar Nuevos Roles
1. Definir el rol en el JWT
2. Usar el decorador `@Roles()` en los endpoints
3. El guard automáticamente verificará los permisos

### Roles Jerárquicos
Los roles son independientes. Si necesitas jerarquía, modifica el `RolesGuard`:

```typescript
// Ejemplo de jerarquía: admin > user > viewer
const roleHierarchy = {
  admin: 3,
  user: 2,
  viewer: 1
};
```

### Múltiples Roles
Un usuario puede tener múltiples roles:
```json
{
  "roles": ["admin", "user", "viewer"]
}
```

El sistema verificará que tenga al menos uno de los roles requeridos.
