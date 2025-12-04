#!/usr/bin/env node

/**
 * Script para probar mensajes SQS tipados
 * Uso: node scripts/test-typed-sqs-message.js [tipo] [cola]
 */

const AWS = require('aws-sdk');

// Configuración
const region = process.env.AWS_REGION || 'us-east-1';
const queueUrl = process.argv[3] || process.env.SQS_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/123456789012/aduanas-service-queue';

// Inicializar SQS
const sqs = new AWS.SQS({ region });

// Generadores de mensajes tipados
const messageGenerators = {
  'sample.create': () => ({
    id: `sample-create-${Date.now()}`,
    type: 'sample.create',
    payload: {
      name: `Sample ${Date.now()}`,
      description: 'Sample created via SQS',
      isActive: true,
      metadata: {
        source: 'test-script',
        version: '1.0.0'
      }
    },
    timestamp: new Date().toISOString(),
    source: 'test-script',
    correlationId: `corr-${Date.now()}`
  }),

  'sample.update': () => ({
    id: `sample-update-${Date.now()}`,
    type: 'sample.update',
    payload: {
      id: 'sample-123',
      name: `Updated Sample ${Date.now()}`,
      description: 'Sample updated via SQS',
      isActive: true,
      metadata: {
        source: 'test-script',
        updatedBy: 'test-user'
      }
    },
    timestamp: new Date().toISOString(),
    source: 'test-script',
    correlationId: `corr-${Date.now()}`
  }),

  'sample.delete': () => ({
    id: `sample-delete-${Date.now()}`,
    type: 'sample.delete',
    payload: {
      id: 'sample-123',
      reason: 'Test deletion',
      deletedBy: 'test-user'
    },
    timestamp: new Date().toISOString(),
    source: 'test-script',
    correlationId: `corr-${Date.now()}`
  }),

  'notification.send': () => ({
    id: `notification-${Date.now()}`,
    type: 'notification.send',
    payload: {
      recipient: 'test@example.com',
      subject: 'Test Notification',
      message: 'This is a test notification sent via SQS',
      type: 'email',
      priority: 'medium',
      templateId: 'test-template',
      variables: {
        userName: 'Test User',
        timestamp: new Date().toISOString()
      }
    },
    timestamp: new Date().toISOString(),
    source: 'test-script',
    correlationId: `corr-${Date.now()}`
  }),

  'audit.log': () => ({
    id: `audit-${Date.now()}`,
    type: 'audit.log',
    payload: {
      action: 'test.action',
      entityType: 'sample',
      entityId: 'sample-123',
      userId: 'test-user',
      changes: {
        field: 'name',
        oldValue: 'Old Name',
        newValue: 'New Name'
      },
      ipAddress: '127.0.0.1',
      userAgent: 'test-script/1.0.0'
    },
    timestamp: new Date().toISOString(),
    source: 'test-script',
    correlationId: `corr-${Date.now()}`
  })
};

async function sendMessage(messageType = 'sample.create') {
  try {
    console.log(`🚀 Enviando mensaje SQS de tipo: ${messageType}`);
    console.log(`📋 Cola: ${queueUrl}`);
    
    const generator = messageGenerators[messageType];
    if (!generator) {
      console.error(`❌ Tipo de mensaje no válido: ${messageType}`);
      console.log(`📝 Tipos disponibles: ${Object.keys(messageGenerators).join(', ')}`);
      process.exit(1);
    }

    const message = generator();
    
    console.log(`📦 Mensaje generado:`, JSON.stringify(message, null, 2));

    const params = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        'messageType': {
          DataType: 'String',
          StringValue: message.type
        },
        'correlationId': {
          DataType: 'String',
          StringValue: message.correlationId
        },
        'source': {
          DataType: 'String',
          StringValue: message.source
        }
      }
    };

    const result = await sqs.sendMessage(params).promise();
    
    console.log(`✅ Mensaje enviado exitosamente!`);
    console.log(`🆔 MessageId: ${result.MessageId}`);
    console.log(`📊 MD5OfBody: ${result.MD5OfBody}`);
    
    if (result.MessageAttributes) {
      console.log(`🏷️  MessageAttributes:`, result.MessageAttributes);
    }

  } catch (error) {
    console.error(`❌ Error enviando mensaje:`, error.message);
    
    if (error.code === 'AWS.SimpleQueueService.NonExistentQueue') {
      console.log(`💡 La cola no existe. Verifica la URL: ${queueUrl}`);
    } else if (error.code === 'AccessDenied') {
      console.log(`💡 Sin permisos para enviar mensajes a la cola. Verifica las credenciales AWS.`);
    }
    
    process.exit(1);
  }
}

// Función para listar tipos disponibles
function listMessageTypes() {
  console.log(`📝 Tipos de mensajes SQS disponibles:`);
  Object.keys(messageGenerators).forEach((type, index) => {
    console.log(`   ${index + 1}. ${type}`);
  });
  console.log(`\n💡 Uso: node scripts/test-typed-sqs-message.js [tipo] [cola]`);
  console.log(`💡 Ejemplo: node scripts/test-typed-sqs-message.js sample.create`);
}

// Main
const messageType = process.argv[2];

if (!messageType || messageType === '--help' || messageType === '-h') {
  listMessageTypes();
  process.exit(0);
}

sendMessage(messageType);

