import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
//import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('api/health')
export class HealthController {
  constructor(
    //private readonly dataSource: DataSource
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check del servicio' })
  @ApiResponse({ status: 200, description: 'Servicio funcionando correctamente' })
  async getHealth() {
    try {
      // const oracleStatus = await this.testConnection();
      // const dbInfo = await this.getDatabaseInfo();

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        //database: {
        //  oracle: {
        //    connected: oracleStatus,
        //    info: dbInfo,
        //  },
        //},
        environment: process.env.NODE_ENV || 'development',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        //database: {
        //  oracle: {
        //    connected: false,
        //    error: error instanceof Error ? error.message : String(error),
        //  },
        //},
        environment: process.env.NODE_ENV || 'development',
      };
    }
  }
}
