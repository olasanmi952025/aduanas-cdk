import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SQSService } from '../service/sqs.service';
import { TypedSQSMessage } from '../interfaces/sqs-message.interface';

@ApiTags('SQS')
@Controller('sqs')
export class SQSController {
  constructor(private readonly sqsService: SQSService) {}

  @Get('health')
  @ApiOperation({ summary: 'SQS Health Check' })
  @ApiResponse({ status: 200, description: 'SQS health status' })
  async getHealth() {
    return await this.sqsService.getHealthCheck();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'SQS Metrics' })
  @ApiResponse({ status: 200, description: 'SQS processing metrics' })
  getMetrics() {
    return this.sqsService.getMetrics();
  }

  @Post('test-message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test SQS Message Processing' })
  @ApiResponse({ status: 200, description: 'Message processed successfully' })
  async testMessage(@Body() message: TypedSQSMessage) {
    return await this.sqsService.processTypedMessage(message);
  }

  @Post('reset-metrics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset SQS Metrics' })
  @ApiResponse({ status: 200, description: 'Metrics reset successfully' })
  resetMetrics() {
    this.sqsService.resetMetrics();
    return { message: 'Metrics reset successfully' };
  }
}

