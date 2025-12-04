import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('api/health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check del servicio' })
  @ApiResponse({ status: 200, description: 'Servicio funcionando correctamente' })
  async getHealth() {
    try {
      const oracleStatus = await this.testConnection();
      const dbInfo = await this.getDatabaseInfo();

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          oracle: {
            connected: oracleStatus,
            info: dbInfo,
          },
        },
        environment: process.env.NODE_ENV || 'development',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          oracle: {
            connected: false,
            error: errorMessage,
          },
        },
        environment: process.env.NODE_ENV || 'development',
      };
    }
  }

  @Public()
  @Get('database')
  @ApiOperation({ summary: 'Estado de la conexión a Oracle' })
  @ApiResponse({ status: 200, description: 'Información de la base de datos' })
  async getDatabaseHealth() {
    try {
      const isConnected = await this.testConnection();
      const dbInfo = await this.getDatabaseInfo();

      return {
        connected: isConnected,
        database: dbInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        connected: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async testConnection(): Promise<boolean> {
    try {
      const result = await this.dataSource.query('SELECT 1 as test FROM DUAL');
      return result && result.length > 0;
    } catch (error) {
      console.error('Error al probar conexión:', error);
      return false;
    }
  }

  private async getDatabaseInfo(): Promise<any> {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          SYS_CONTEXT('USERENV', 'DB_NAME') as database_name,
          SYS_CONTEXT('USERENV', 'SERVER_HOST') as server_host,
          SYS_CONTEXT('USERENV', 'SESSION_USER') as session_user,
          SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') as current_schema
        FROM DUAL
      `);
      return result?.[0] || null;
    } catch (error) {
      console.error('Error al obtener información de la base de datos:', error);
      return null;
    }
  }
}
