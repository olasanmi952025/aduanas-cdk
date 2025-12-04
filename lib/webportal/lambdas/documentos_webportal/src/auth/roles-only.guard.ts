import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class RolesOnlyGuard implements CanActivate {
  private readonly logger = new Logger(RolesOnlyGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const path = request.url;
    const method = request.method;
    
    this.logger.log(`[${method}] ${path} - Checking authorization`);

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      this.logger.log(`[${method}] ${path} - Public endpoint, skipping authorization`);
      return true;
    }

    const authHeader: string | undefined = request.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn(`[${method}] ${path} - Missing Bearer token`);
      throw new UnauthorizedException('Missing Bearer token');
    }
    
    const token = authHeader.slice('Bearer '.length);
    
    try {
      // Decode token without verification (API Gateway already validated it)
      const decoded = jwt.decode(token) as any;
      decoded['groups'] = ['couriers']; // validar y quitar.

      console.log('decoded', decoded);
      if (!decoded) {
        this.logger.warn(`[${method}] ${path} - Invalid token format`);
        throw new UnauthorizedException('Invalid token');
      }

      // Additional security validations
      if (!decoded.sub) {
        this.logger.warn(`[${method}] ${path} - Missing subject in token`);
        throw new UnauthorizedException('Invalid token: missing subject');
      }
      
      if (decoded.token_type !== 'access') {
        this.logger.warn(`[${method}] ${path} - Invalid token use: ${decoded.token_use}`);
        throw new UnauthorizedException('Invalid token: not an access token');
      }

      // Extract roles from Cognito token - try multiple possible fields
      const roles = decoded['cognito:groups'] || decoded['groups'] || decoded['roles'] || decoded['cognito:roles'] || [];
      const username = decoded['cognito:username'] || decoded.sub;
      
      this.logger.log(`[${method}] ${path} - User: ${username}, Roles: [${roles.join(', ')}]`);
      
      // Attach user info to request for use in controllers
      request.user = {
        sub: decoded.sub,
        username: username,
        roles: roles,
        email: decoded.email,
        tokenUse: decoded.token_use,
        clientId: decoded.client_id,
        aud: decoded.aud,
        iss: decoded.iss
      };

      return true;
      
    } catch (error: any) {
      this.logger.error(`[${method}] ${path} - Token processing failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
