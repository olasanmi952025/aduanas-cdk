import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AWSConfigService } from './aws-config.service';

@Module({
  imports: [ConfigModule],
  providers: [AWSConfigService],
  exports: [AWSConfigService],
})
export class AWSModule {}

