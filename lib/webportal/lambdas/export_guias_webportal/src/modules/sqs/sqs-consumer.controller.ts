import { Controller, Post, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SQSConsumerService } from './sqs-consumer.service';

@ApiTags('SQS Consumer')
@Controller('sqs/consumer')
export class SQSConsumerController {
  constructor(
    private readonly sqsConsumer: SQSConsumerService,
  ) {}

  @Post('consume')
  @ApiOperation({ summary: 'Consume un mensaje único de la cola SQS' })
  @ApiResponse({ status: 200, description: 'Mensaje consumido exitosamente o no hay mensajes disponibles' })
  async consumeMessage() {
    try {
      const hasMessage = await this.sqsConsumer.consumeAndProcessMessage(0);
      return {
        success: true,
        message: hasMessage ? 'Message processed successfully' : 'No messages in queue',
        hasMessage,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('listen')
  @ApiOperation({ summary: 'Inicia el listener continuo para mensajes SQS' })
  @ApiResponse({ status: 200, description: 'Listener iniciado' })
  async startListener() {
    this.sqsConsumer.listen().catch((error) => {
      console.error('Error starting listener:', error);
    });
    return {
      success: true,
      message: 'Listener started',
    };
  }

  @Post('stop')
  @ApiOperation({ summary: 'Detiene el listener SQS' })
  @ApiResponse({ status: 200, description: 'Listener detenido' })
  stopListener() {
    this.sqsConsumer.stop();
    return {
      success: true,
      message: 'Listener stopped',
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Obtiene el estado del consumidor' })
  @ApiResponse({ status: 200, description: 'Estado del consumidor' })
  getStatus() {
    return {
      success: true,
      ...this.sqsConsumer.getStatus(),
    };
  }
}

