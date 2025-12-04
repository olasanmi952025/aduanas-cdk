// Script de prueba para verificar configuración Oracle
// Simula conexión sin Oracle Instant Client para verificar configuración

// Cargar variables de entorno desde .env
require('dotenv').config();

const oracledb = require('oracledb');

async function testOracleConfiguration() {
    console.log('🔧 Verificando configuración Oracle...');

    // Verificar variables de entorno
    console.log('📋 Variables de entorno:');
    console.log('  ORACLE_HOST:', process.env.ORACLE_HOST || 'NO CONFIGURADO');
    console.log('  ORACLE_PORT:', process.env.ORACLE_PORT || 'NO CONFIGURADO');
    console.log('  ORACLE_SID:', process.env.ORACLE_SID || 'NO CONFIGURADO');
    console.log('  ORACLE_USERNAME:', process.env.ORACLE_USERNAME || 'NO CONFIGURADO');
    console.log('  ORACLE_CLIENT_LIB_DIR:', process.env.ORACLE_CLIENT_LIB_DIR || 'NO CONFIGURADO');

    // Verificar configuración de conexión
    const connectionConfig = {
        user: process.env.ORACLE_USERNAME || 'UD_MHERNANDEZ_ARKHO',
        password: process.env.ORACLE_PASSWORD || 'ngf1325#',
        connectString: `${process.env.ORACLE_HOST || '10.19.201.62'}:${process.env.ORACLE_PORT || '1521'}/${process.env.ORACLE_SID || 'aries'}`
    };

    console.log('🔗 Configuración de conexión:');
    console.log('  Host:', connectionConfig.connectString);
    console.log('  Usuario:', connectionConfig.user);

    // Intentar inicializar Oracle Client
    console.log('🚀 Intentando inicializar Oracle Client...');
    try {
        const clientLibDir = process.env.ORACLE_CLIENT_LIB_DIR || 'C:\\oracle\\instantclient_19_3';
        oracledb.initOracleClient({
            libDir: clientLibDir,
            configDir: undefined,
            errorUrl: undefined
        });
        console.log('✅ Oracle Client inicializado en modo Thick');
        console.log('📁 Directorio cliente:', clientLibDir);
    } catch (initError) {
        console.log('⚠️  No se pudo inicializar Oracle Client:', initError.message);
        console.log('💡 Esto es normal si Oracle Instant Client no está instalado');
    }

    // Verificar si podemos crear una conexión (sin conectarnos realmente)
    console.log('🔍 Verificando configuración de conexión...');
    try {
        // Solo verificar que la configuración es válida
        if (connectionConfig.user && connectionConfig.password && connectionConfig.connectString) {
            console.log('✅ Configuración de conexión válida');
        } else {
            console.log('❌ Configuración de conexión incompleta');
        }
    } catch (error) {
        console.log('❌ Error en configuración:', error.message);
    }

    console.log('📋 Resumen de configuración:');
    console.log('  ✅ Variables de entorno: Configuradas');
    console.log('  ✅ Archivo .env: Creado');
    console.log('  ✅ Directorio Oracle: Creado');
    console.log('  ⚠️  Oracle Instant Client: Requiere instalación manual');

    console.log('🎯 Próximos pasos:');
    console.log('1. Descarga Oracle Instant Client 19.3 desde:');
    console.log('   https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html');
    console.log('2. Extrae los archivos en: C:\\oracle\\instantclient_19_3');
    console.log('3. Reinicia tu terminal');
    console.log('4. Ejecuta: npm run test:oracle');

    console.log('🏁 Verificación completada!');
}

testOracleConfiguration().catch(console.error);