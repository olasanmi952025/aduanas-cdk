import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { OracleDatabaseService } from './service/oracle-database.service';

async function testOracleConnection() {
    console.log('🚀 Iniciando prueba de conexión Oracle...');

    try {
        const app = await NestFactory.createApplicationContext(AppModule);
        const oracleService = app.get(OracleDatabaseService);

        console.log('📡 Probando conexión a Oracle...');
        const isConnected = await oracleService.testConnection();

        if (isConnected) {
            console.log('✅ Conexión exitosa a Oracle!');

            console.log('📊 Obteniendo información de la base de datos...');
            const dbInfo = await oracleService.getDatabaseInfo();
            console.log('Información de la base de datos:', dbInfo);

            console.log('🔍 Ejecutando consulta de prueba...');
            const result = await oracleService.executeQuery('SELECT SYSDATE as current_date, USER as current_user FROM DUAL');
            console.log('Resultado de la consulta:', result.rows);

        } else {
            console.log('❌ Error: No se pudo conectar a Oracle');
        }

        await app.close();
        console.log('🏁 Prueba completada');

    } catch (error) {
        console.error('💥 Error durante la prueba:', error);
        process.exit(1);
    }
}

testOracleConnection();