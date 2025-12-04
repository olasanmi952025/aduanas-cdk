import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RolesOnlyGuard } from './roles-only.guard';
import { RolesGuard } from './roles.guard';

@Module({
  providers: [
    { provide: APP_GUARD, useClass: RolesOnlyGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class JwtAuthModule {}


