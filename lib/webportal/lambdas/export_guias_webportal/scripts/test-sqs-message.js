#!/usr/bin/env node

const AWS = require('aws-sdk');

// Configurar AWS SDK
AWS.config.update({ region: 'us-east-1' });
const sqs = new AWS.SQS();

// Función para enviar mensaje de prueba a SQS
async function sendTestMessage(queueUrl, messageType = 'sample.create') {
  const message = {
    id: `test-${Date.now()}`,
    type: messageType,
    payload: {
      name: 'Test Sample',
      description: 'This is a test message from the SQS test script',
      isActive: true
    },
    timestamp: new Date().toISOString(),
    source: 'test-script'
  };

  const params = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
    MessageAttributes: {
      'messageType': {
        DataType: 'String',
        StringValue: messageType
      },
      'source': {
        DataType: 'String',
        StringValue: 'test-script'
      }
    }
  };

  try {
    const result = await sqs.sendMessage(params).promise();
    console.log('✅ Message sent successfully!');
    console.log('📨 Message ID:', result.MessageId);
    console.log('📋 Message:', JSON.stringify(message, null, 2));
    return result;
  } catch (error) {
    console.error('❌ Error sending message:', error.message);
    throw error;
  }
}

// Función para obtener URL de la cola
async function getQueueUrl(queueName) {
  try {
    const params = {
      QueueName: queueName
    };
    
    const result = await sqs.getQueueUrl(params).promise();
    return result.QueueUrl;
  } catch (error) {
    console.error('❌ Error getting queue URL:', error.message);
    throw error;
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const messageType = args[0] || 'sample.create';
  const queueName = args[1] || 'aduanas-service-sandbox6-processing-queue';

  console.log('🚀 SQS Test Script');
  console.log('📋 Message Type:', messageType);
  console.log('📦 Queue Name:', queueName);
  console.log('');

  try {
    // Obtener URL de la cola
    console.log('🔍 Getting queue URL...');
    const queueUrl = await getQueueUrl(queueName);
    console.log('✅ Queue URL:', queueUrl);
    console.log('');

    // Enviar mensaje de prueba
    console.log('📤 Sending test message...');
    await sendTestMessage(queueUrl, messageType);
    
    console.log('');
    console.log('🎉 Test completed successfully!');
    console.log('💡 Check CloudWatch logs to see the message processing.');
    
  } catch (error) {
    console.error('');
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { sendTestMessage, getQueueUrl };
