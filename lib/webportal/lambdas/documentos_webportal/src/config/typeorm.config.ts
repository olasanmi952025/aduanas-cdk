import * as oracledb from 'oracledb';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const logger = new Logger('TypeOrmConfig');

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const clientLibDir = configService.get<string>('ORACLE_CLIENT_LIB_DIR');
  if (clientLibDir) {
    try {
      oracledb.initOracleClient({ 
        libDir: clientLibDir,
        configDir: undefined,
        errorUrl: undefined
      });
      logger.log('Oracle Client inicializado en modo Thick para TypeORM');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn('Oracle Client ya inicializado o error en inicialización:', errorMessage);
    }
  } else {
    logger.warn('ORACLE_CLIENT_LIB_DIR no configurado. Usando modo Thin (puede no ser compatible con Oracle 11)');
  }

  const host = configService.get<string>('ORACLE_HOST') || '';
  const port = configService.get<number>('ORACLE_PORT') || 1522;
  const username = configService.get<string>('ORACLE_USERNAME') || '';
  const password = configService.get<string>('ORACLE_PASSWORD') || '';
  const sid = configService.get<string>('ORACLE_SID') || 'aries';
  const database = configService.get<string>('ORACLE_DATABASE') || configService.get<string>('DB_DATABASE') || sid;

  console.log('host', host);
  console.log('port', port);
  console.log('username', username);
  console.log('password', password);
  console.log('sid', sid);
  console.log('database', database);

  return {
    type: 'oracle',
    host,
    port,
    username,
    password,
    serviceName: sid,
    database,
    entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
    synchronize: false, // Nunca usar synchronize en producción con Oracle
    logging: configService.get<string>('NODE_ENV') === 'development',
    retryAttempts: 3,
    retryDelay: 3000,
    // Configuraciones específicas para Oracle
    extra: {
      // Configuración adicional para Oracle
      connectTimeout: 60000,
      requestTimeout: 60000,
      useUTC: false,
    },
  };
};
