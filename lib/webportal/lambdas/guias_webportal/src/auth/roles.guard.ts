import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const path = request.url;
    const method = request.method;
    
    this.logger.log(`[${method}] ${path} - Checking role authorization`);

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      this.logger.log(`[${method}] ${path} - No roles required, access granted`);
      return true; // No roles required
    }

    this.logger.log(`[${method}] ${path} - Required roles: ${JSON.stringify(requiredRoles)}`);

    const user = request.user;
    this.logger.log(`[${method}] ${path} - User object: ${user ? 'Present' : 'Missing'}`);

    if (!user) {
      this.logger.warn(`[${method}] ${path} - User not authenticated`);
      throw new ForbiddenException('User not authenticated');
    }

    // Extract roles from JWT payload
    const userRoles = user.roles || [];
    this.logger.log(`[${method}] ${path} - User roles: ${JSON.stringify(userRoles)}`);
    
    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    this.logger.log(`[${method}] ${path} - Has required role: ${hasRole}`);
    
    if (!hasRole) {
      this.logger.warn(`[${method}] ${path} - Access denied. User: ${user.username}, Roles: ${JSON.stringify(userRoles)}, Required: ${JSON.stringify(requiredRoles)}`);
      throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    this.logger.log(`[${method}] ${path} - Role authorization successful`);
    return true;
  }
}
