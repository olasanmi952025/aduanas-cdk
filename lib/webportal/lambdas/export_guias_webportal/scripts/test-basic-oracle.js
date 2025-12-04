const oracledb = require('oracledb');

async function testBasicOracleConnection() {
    console.log('🚀 Iniciando prueba básica de conexión Oracle...');

    try {
        // Intentar inicializar Oracle Client en modo Thick para Oracle 11
        try {
            // En Windows, ajustar la ruta según tu instalación
            const clientLibDir = process.env.ORACLE_CLIENT_LIB_DIR || 'C:\\oracle\\instantclient_19_3';
            oracledb.initOracleClient({
                libDir: clientLibDir,
                configDir: undefined,
                errorUrl: undefined
            });
            console.log('✅ Oracle Client inicializado en modo Thick');
        } catch (initError) {
            console.warn('⚠️  No se pudo inicializar Oracle Client:', initError.message);
            console.log('💡 Intentando conexión en modo Thin...');
        }

        // Configuración de conexión
        const connectionConfig = {
            user: 'UD_MHERNANDEZ_ARKHO',
            password: 'ngf1325#',
            connectString: '10.19.201.62:1521/aries'
        };

        console.log('📡 Intentando conectar a Oracle...');
        console.log('Host:', '10.19.201.62');
        console.log('Puerto:', '1521');
        console.log('SID:', 'aries');
        console.log('Usuario:', 'UD_MHERNANDEZ_ARKHO');

        const connection = await oracledb.getConnection(connectionConfig);
        console.log('✅ Conexión exitosa!');

        // Ejecutar consulta de prueba
        console.log('🔍 Ejecutando consulta de prueba...');
        const result = await connection.execute(
            'SELECT SYSDATE as current_date, USER as current_user FROM DUAL', [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        console.log('📊 Resultado de la consulta:');
        console.log(JSON.stringify(result.rows, null, 2));

        // Obtener información de la base de datos
        console.log('📋 Obteniendo información de la base de datos...');
        const dbInfo = await connection.execute(
            `SELECT 
        SYS_CONTEXT('USERENV', 'DB_NAME') as database_name,
        SYS_CONTEXT('USERENV', 'SERVER_HOST') as server_host,
        SYS_CONTEXT('USERENV', 'IP_ADDRESS') as ip_address,
        SYS_CONTEXT('USERENV', 'SESSION_USER') as session_user,
        SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') as current_schema
      FROM DUAL`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        console.log('📊 Información de la base de datos:');
        console.log(JSON.stringify(dbInfo.rows[0], null, 2));

        await connection.close();
        console.log('🏁 Prueba completada exitosamente!');

    } catch (error) {
        console.error('💥 Error durante la prueba:', error.message);
        console.error('Detalles:', error);
        process.exit(1);
    }
}

testBasicOracleConnection();