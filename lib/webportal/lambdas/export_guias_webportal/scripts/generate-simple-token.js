const jwt = require('jsonwebtoken');

// Clave secreta simple para testing
const SECRET = 'test-secret-key';

// Generar token JWT simple para testing
function generateSimpleToken(roles = ['user'], expiresIn = '1h') {
  const payload = {
    sub: 'test-user-123',
    email: 'test@example.com',
    roles: roles,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (expiresIn === '1h' ? 3600 : 86400)
  };

  return jwt.sign(payload, SECRET, { algorithm: 'HS256' });
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const role = args[0] || 'user';
  const expiresIn = args[1] || '1h';

  const roles = role.split(',');

  const token = generateSimpleToken(roles, expiresIn);

  console.log('🔐 Simple JWT Token Generated:');
  console.log(`\n📋 Roles: ${roles.join(', ')}`);
  console.log(`⏰ Expires: ${expiresIn}`);
  console.log(`\n🎫 Token:\n${token}`);
  
  console.log('\n📝 Test Commands:');
  console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/samples`);
  console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/samples/public`);
  
  console.log('\n🔑 Set this environment variable:');
  console.log('export JWT_PUBLIC_KEY=test-secret-key');
}

module.exports = { generateSimpleToken };
