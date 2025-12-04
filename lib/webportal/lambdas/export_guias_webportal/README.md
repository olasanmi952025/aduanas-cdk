# Aduanas Service - Microservicio NestJS

Microservicio basado en NestJS con TypeORM, JWT, roles y soporte para AWS Lambda.

## 🚀 Características

- **NestJS v10** - Framework Node.js moderno
- **TypeORM** - ORM para PostgreSQL
- **API Gateway Authorizer** - Autenticación segura con Cognito
- **Role-based Authorization** - Sistema de permisos por roles
- **Fastify Integration** - Mejor rendimiento que Express
- **Swagger Documentation** - API docs automáticas
- **AWS Lambda Ready** - Despliegue serverless
- **Docker Support** - Containerización
- **Health Checks** - Monitoreo de salud
- **Security Hardening** - Configuración de seguridad robusta

## 📋 Prerequisitos

- Node.js 20.x
- PostgreSQL 15+
- Docker (opcional)
- AWS CLI (para despliegue)
- SAM CLI (para Lambda)

## 🛠️ Setup Inicial

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Crear archivo `.env`:

```bash
# Database
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=nestjs_api

# JWT (para desarrollo)
JWT_PUBLIC_KEY=test-secret-key

# Cognito (para producción)
COGNITO_JWKS_URI=https://cognito-idp.region.amazonaws.com/userPoolId/.well-known/jwks.json
COGNITO_ISSUER=https://cognito-idp.region.amazonaws.com/userPoolId
COGNITO_CLIENT_ID=your-client-id

# App
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*
```

### 3. Base de Datos

#### Opción A: Docker
```bash
docker compose up -d postgres
```

#### Opción B: PostgreSQL Local
```bash
# Crear base de datos
createdb nestjs_api

# O usar psql
psql -U postgres -c "CREATE DATABASE nestjs_api;"
```

### 4. Ejecutar la Aplicación

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start
```

### 5. Verificar

```bash
# Health check
curl http://localhost:3000/api/health

# Swagger docs
open http://localhost:3000/api/docs
```

## 🔐 Sistema de Autenticación

### Arquitectura de Seguridad

La aplicación implementa una **arquitectura de seguridad de dos capas**:

1. **API Gateway Authorizer** - Valida tokens JWT de Cognito a nivel de infraestructura
2. **Application-level Authorization** - Valida roles y permisos a nivel de aplicación

### Roles Disponibles 

Estos pueden cambiar según se necesiten, es solo ejemplo

- **`admin`** - Acceso completo (GET, POST, PUT, DELETE)
- **`user`** - Lectura + escritura (GET, POST, PUT)
- **`viewer`** - Solo lectura (GET)

### Configuración de Cognito

Para que la autorización funcione correctamente:

1. **Crear grupos en Cognito User Pool**:
   - `admin` - Administradores
   - `user` - Usuarios con permisos de escritura
   - `viewer` - Usuarios de solo lectura

2. **Asignar usuarios a grupos** en la consola de AWS Cognito

3. **Configurar App Client** para incluir grupos en tokens

### Generar Tokens de Prueba

```bash
# Token admin (simulado)
node scripts/generate-test-token.js admin cognito

# Token con múltiples roles
node scripts/generate-test-token.js "admin,viewer" cognito

# Token user
node scripts/generate-test-token.js user cognito
```

### Probar Endpoints

```bash
# Endpoint público (sin autenticación)
curl http://localhost:3000/samples/public

# Endpoint protegido (requiere token válido)
curl -H "Authorization: Bearer YOUR_COGNITO_TOKEN" \
     http://localhost:3000/samples

# Probar diferentes roles
curl -H "Authorization: Bearer ADMIN_TOKEN" \
     -X DELETE http://localhost:3000/samples/123

curl -H "Authorization: Bearer VIEWER_TOKEN" \
     -X DELETE http://localhost:3000/samples/123
# Debería retornar 403 Forbidden
```

## 📁 Estructura del Proyecto

```
src/
├── auth/                    # Autenticación y autorización
│   ├── roles-only.guard.ts # Guard para procesar tokens de API Gateway
│   ├── roles.guard.ts      # Guard de roles y permisos
│   ├── roles.decorator.ts  # Decorador @Roles()
│   ├── public.decorator.ts # Decorador @Public()
│   └── jwt-auth.module.ts  # Módulo de auth
├── config/                 # Configuración
│   └── validation.schema.ts # Validación de env vars
├── service/                # Servicio de ejemplo
│   ├── service.controller.ts
│   ├── service.service.ts
│   ├── service.module.ts
│   └── sample.entity.ts
├── app.module.ts           # Módulo principal
├── main.ts                 # Punto de entrada
└── lambda.ts              # Wrapper para AWS Lambda con Fastify
```

## ➕ Agregar Nuevo Servicio

### 1. Crear Entidad

```typescript
// src/products/product.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal')
  price: number;
}
```

### 2. Crear DTOs

```typescript
// src/products/dto/create-product.dto.ts
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 999.99 })
  @IsNumber()
  @IsNotEmpty()
  price: number;
}
```

### 3. Crear Servicio

```typescript
// src/products/products.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productRepo.find();
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.productRepo.create(dto);
    return this.productRepo.save(product);
  }
}
```

### 4. Crear Controlador

```typescript
// src/products/products.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Roles('admin', 'user', 'viewer')
  @ApiOperation({ summary: 'Get all products' })
  findAll() {
    return this.productsService.findAll();
  }

  @Post()
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Create a new product' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }
}
```

### 5. Crear Módulo

```typescript
// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
```

### 6. Registrar en AppModule

```typescript
// src/app.module.ts
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    // ... otros imports
    ProductsModule,
  ],
})
export class AppModule {}
```

## 🛣️ Agregar Nueva Ruta

### 1. En el Controlador Existente

```typescript
@Get('search')
@Roles('admin', 'user', 'viewer')
@ApiOperation({ summary: 'Search products' })
search(@Query('q') query: string) {
  return this.productsService.search(query);
}
```

### 2. Ruta Pública

```typescript
import { Public } from '../auth/public.decorator';

@Public()
@Get('stats')
@ApiOperation({ summary: 'Get product statistics' })
getStats() {
  return this.productsService.getStats();
}
```

## 🔒 Definir Permisos

### 1. Usar Decorador @Roles()

```typescript
// Solo admin
@Delete(':id')
@Roles('admin')
@ApiOperation({ summary: 'Delete product (admin only)' })
remove(@Param('id') id: string) {
  return this.productsService.remove(id);
}

// Admin y user
@Put(':id')
@Roles('admin', 'user')
@ApiOperation({ summary: 'Update product' })
update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
  return this.productsService.update(id, dto);
}

// Todos los roles autenticados
@Get()
@Roles('admin', 'user', 'viewer')
@ApiOperation({ summary: 'Get all products' })
findAll() {
  return this.productsService.findAll();
}
```

### 2. Ruta Pública

```typescript
@Public()
@Get('public-info')
@ApiOperation({ summary: 'Public product information' })
getPublicInfo() {
  return this.productsService.getPublicInfo();
}
```

### 3. Agregar Nuevo Rol

1. **Actualizar RolesGuard** (opcional):
```typescript
// src/auth/roles.guard.ts
// El guard ya es genérico, no necesita cambios
```

2. **Usar en endpoints**:
```typescript
@Roles('admin', 'manager', 'user')
@Get('reports')
getReports() {
  // Solo admin, manager o user
}
```

## 🔧 Configuración de Seguridad

### 1. Variables de Entorno

```bash
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=nestjs_api

# Cognito (requerido para producción)
COGNITO_JWKS_URI=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_nJrsAxdlE/.well-known/jwks.json
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_nJrsAxdlE
COGNITO_CLIENT_ID=4unqen0rhebdg89p8cdjquqh8h

# JWT (opcional, para desarrollo local)
JWT_PUBLIC_KEY=

# CORS
CORS_ORIGIN=*

# App
NODE_ENV=development
```

### 2. API Gateway Authorizer

La aplicación está configurada para usar **API Gateway Authorizer** con Cognito:

- **Validación de tokens** a nivel de infraestructura
- **Extracción de roles** a nivel de aplicación
- **Caché de autorizador** para mejor rendimiento
- **Validación estricta** de formato de tokens

### 3. Configurar Cognito

Ver [COGNITO.md](./COGNITO.md) para configuración completa de:
- User Pool
- App Clients
- Grupos de usuarios
- Configuración de tokens

### 4. Validación de Entrada

```typescript
// DTOs con validación
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsNumber()
  @Min(0)
  @Max(999999)
  price: number;
}
```

### 5. Rate Limiting (Opcional)

```bash
npm install @nestjs/throttler
```

```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
})
export class AppModule {}
```

## 🚀 Despliegue

### AWS Lambda (SAM)

```bash
# Build
npm run sam:build

# Deploy
npm run sam:deploy

# Local testing
npm run sam:local
```

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para guía completa.

### Docker

```bash
# Build
docker build -t aduanas-service .

# Run
docker run -p 3000:3000 --env-file .env aduanas-service
```

### Docker Compose

```bash
# Desarrollo completo
docker compose up -d

# Solo base de datos
docker compose up -d postgres
```

## 📊 Monitoreo

### Health Checks

```bash
curl http://localhost:3000/api/health
```

### Logs

```bash
# Desarrollo
npm run start:dev

# Producción
npm run start:prod
```

### Swagger

- **Desarrollo**: http://localhost:3000/api/docs
- **Producción**: Deshabilitado por defecto

## 🧪 Testing

### Generar Tokens

```bash
# Token simple
node scripts/generate-simple-token.js admin

# Token Cognito
node scripts/generate-test-token.js admin cognito
```

### Probar Endpoints

```bash
# Health
curl http://localhost:3000/api/health

# Público
curl http://localhost:3000/samples/public

# Protegido
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3000/samples
```

## 📚 Documentación Adicional

- [ROLES.md](./ROLES.md) - Sistema de roles detallado
- [COGNITO.md](./COGNITO.md) - Integración con AWS Cognito
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía de despliegue SAM

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

- **Issues**: [GitHub Issues](https://github.com/tu-repo/issues)
- **Documentación**: [Wiki](https://github.com/tu-repo/wiki)
- **Email**: soporte@ejemplo.com
