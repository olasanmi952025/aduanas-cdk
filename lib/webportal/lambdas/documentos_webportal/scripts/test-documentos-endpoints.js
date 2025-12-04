const axios = require('axios');

async function testDocumentosEndpoints() {
    const baseUrl = 'http://localhost:3000';

    console.log('🧪 Probando endpoints de documentos...\n');

    try {
        // Probar búsqueda de documentos (requiere autenticación)
        console.log('\n🔍 Probando GET /documentos/buscar');
        try {
            const response = await axios.get(`${baseUrl}/documentos/buscar`, {
                params: { page: 1, limit: 5 }
            });
            console.log('✅ Búsqueda de documentos:', response.data.documentos.length || 0, 'documentos');
            console.log('   Total:', response.data.total || 0);
        } catch (error) {
            console.log('❌ Error:', error.response.data.message || error.message);
        }

        // Probar datos maestros
        console.log('\n📊 Probando datos maestros...');

        const endpoints = [
            '/documentos/maestros/tipos-locacion',
            '/documentos/maestros/roles',
            '/documentos/maestros/usuarios-creadores',
            '/documentos/maestros/locaciones',
            '/documentos/maestros/roles-participacion'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(`${baseUrl}${endpoint}`);
                const data = response.data;
                const count = Array.isArray(data) ? data.length : (data.total || 0);
                console.log(`✅ ${endpoint}: ${count} registros`);
            } catch (error) {
                console.log(`❌ ${endpoint}:`, error.response.data.message || error.message);
            }
        }

        // Probar exportación a XML
        console.log('\n📄 Probando POST /documentos/exportar/xml');
        try {
            const response = await axios.post(`${baseUrl}/documentos/exportar/xml`, {
                soloActivos: true
            });
            console.log('✅ Exportación XML completada');
            console.log('   Tamaño:', response.data.length || 0, 'caracteres');
            console.log('   Primeros 500 caracteres:');
            console.log(response.data.substring(0, 500) || 'Sin datos');
        } catch (error) {
            console.log('❌ Error:', error.response.data.message || error.message);
        }

        console.log('\n🏁 Pruebas completadas!');
        console.log('\n💡 Nota: Los endpoints protegidos requieren autenticación JWT válida.');
        console.log('   Los endpoints públicos deberían funcionar sin autenticación.');

    } catch (error) {
        console.error('💥 Error general:', error.message);
    }
}

testDocumentosEndpoints();