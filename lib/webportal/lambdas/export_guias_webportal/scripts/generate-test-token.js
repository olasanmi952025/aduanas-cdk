const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generar par de claves RSA para testing
function generateKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
}

// Generar token JWT para testing
function generateTestToken(roles = ['user'], expiresIn = '1h') {
  const { privateKey } = generateKeyPair();
  
  const payload = {
    sub: 'test-user-123',
    email: 'test@example.com',
    roles: roles,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (expiresIn === '1h' ? 3600 : 86400)
  };

  return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
}

// Generar token Cognito simulado
function generateCognitoToken(roles = ['user'], expiresIn = '1h') {
  const { privateKey } = generateKeyPair();
  
  const payload = {
    sub: '12345678-1234-1234-1234-123456789012',
    'cognito:groups': roles,
    'cognito:username': 'testuser',
    email: 'test@example.com',
    token_use: 'access',
    client_id: '4unqen0rhebdg89p8cdjquqh8h',
    iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_nJrsAxdlE',
    aud: '4unqen0rhebdg89p8cdjquqh8h',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (expiresIn === '1h' ? 3600 : 86400)
  };

  return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const role = args[0] || 'user';
  const type = args[1] || 'custom';
  const expiresIn = args[2] || '1h';

  const roles = role.split(',');

  let token;
  if (type === 'cognito') {
    token = generateCognitoToken(roles, expiresIn);
    console.log('🔐 Cognito Token Generated:');
  } else {
    token = generateTestToken(roles, expiresIn);
    console.log('🔐 Custom JWT Token Generated:');
  }

  console.log(`\n📋 Roles: ${roles.join(', ')}`);
  console.log(`⏰ Expires: ${expiresIn}`);
  console.log(`\n🎫 Token:\n${token}`);
  
  console.log('\n📝 Test Commands:');
  console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/samples`);
  console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/samples/public`);
}

module.exports = { generateTestToken, generateCognitoToken, generateKeyPair };
