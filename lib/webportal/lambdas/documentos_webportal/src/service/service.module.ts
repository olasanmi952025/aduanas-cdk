import { Module } from '@nestjs/common';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { HealthController } from './health.controller';

@Module({
  imports: [],
  controllers: [ServiceController, HealthController],
  providers: [ServiceService],
  exports: [ServiceService], // Exportar servicios para uso en otros módulos
})
export class ServiceModule {}


