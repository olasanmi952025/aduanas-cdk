import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import jwksRsa, { JwksClient } from 'jwks-rsa';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private jwksClient: JwksClient;

  constructor(private readonly reflector: Reflector) {
    // Initialize JWKS client for Cognito
    this.jwksClient = jwksRsa({
      jwksUri: process.env.COGNITO_JWKS_URI || 'https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json',
      cache: true,
      cacheMaxAge: 600000, // 10 minutes
      rateLimit: true,
      jwksRequestsPerMinute: 5,
    });
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;
    const method = request.method;
    
    this.logger.log(`[${method}] ${path} - Checking authentication`);

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      this.logger.log(`[${method}] ${path} - Public endpoint, skipping authentication`);
      return true;
    }

    const authHeader: string | undefined = request.headers['authorization'];
    this.logger.log(`[${method}] ${path} - Authorization header: ${authHeader ? 'Present' : 'Missing'}`);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn(`[${method}] ${path} - Missing or invalid Bearer token`);
      throw new UnauthorizedException('Missing Bearer token');
    }
    
    const token = authHeader.slice('Bearer '.length);
    this.logger.log(`[${method}] ${path} - Token length: ${token.length} characters`);

    return this.validateToken(token, request, method, path);
  }

  private async validateToken(token: string, request: any, method: string, path: string): Promise<boolean> {
    this.logger.log(`[${method}] ${path} - Starting token validation`);
    
    try {
      // Decode token header to get kid (key ID)
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || !decoded.header.kid) {
        this.logger.warn(`[${method}] ${path} - Invalid token format: missing kid`);
        throw new UnauthorizedException('Invalid token format');
      }

      this.logger.log(`[${method}] ${path} - Token kid: ${decoded.header.kid}`);

      // Get signing key from JWKS
      const key = await this.getSigningKey(decoded.header.kid);
      this.logger.log(`[${method}] ${path} - Successfully retrieved signing key`);
      
      // Verify token with the key
      const payload = jwt.verify(token, key, {
        algorithms: ['RS256'],
        issuer: process.env.COGNITO_ISSUER,
        audience: process.env.COGNITO_CLIENT_ID,
      }) as any;

      this.logger.log(`[${method}] ${path} - Token verified successfully with Cognito`);

      // Extract Cognito groups as roles
      const roles = this.extractRolesFromCognitoToken(payload);
      this.logger.log(`[${method}] ${path} - User roles: ${JSON.stringify(roles)}`);
      
      // Attach user payload with roles to request
      request.user = {
        ...payload,
        roles: roles,
      };

      this.logger.log(`[${method}] ${path} - Authentication successful`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`[${method}] ${path} - Cognito validation failed: ${errorMessage}`);
      this.logger.log(`[${method}] ${path} - Falling back to custom JWT validation`);
      // Fallback to custom JWT validation if Cognito validation fails
      return this.validateCustomJWT(token, request, method, path);
    }
  }

  private async getSigningKey(kid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.jwksClient.getSigningKey(kid, (err, key) => {
        if (err) {
          reject(err);
        } else if (!key) {
          reject(new Error('Signing key not found'));
        } else {
          resolve(key.getPublicKey());
        }
      });
    });
  }

  private extractRolesFromCognitoToken(payload: any): string[] {
    // Extract roles from Cognito token
    // Option 1: From 'cognito:groups' claim
    if (payload['cognito:groups']) {
      return payload['cognito:groups'];
    }

    // Option 2: From custom 'roles' claim
    if (payload.roles) {
      return Array.isArray(payload.roles) ? payload.roles : [payload.roles];
    }

    // Option 3: From 'custom:roles' claim
    if (payload['custom:roles']) {
      const roles = payload['custom:roles'];
      return Array.isArray(roles) ? roles : roles.split(',');
    }

    // Default role if no roles found
    return ['user'];
  }

  private validateCustomJWT(token: string, request: any, method: string, path: string): boolean {
    try {
      this.logger.log(`[${method}] ${path} - Attempting custom JWT validation`);
      
      // Fallback to custom JWT validation
      const publicKey = process.env.JWT_PUBLIC_KEY as string;
      this.logger.log(`[${method}] ${path} - Using JWT_PUBLIC_KEY: ${publicKey ? 'Present' : 'Missing'}`);
      
      // If no JWT_PUBLIC_KEY is configured, skip custom validation
      if (!publicKey || publicKey.trim() === '') {
        this.logger.warn(`[${method}] ${path} - No JWT_PUBLIC_KEY configured, skipping custom JWT validation`);
        throw new UnauthorizedException('No custom JWT validation configured');
      }
      
      const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256', 'HS256'] }) as any;
      this.logger.log(`[${method}] ${path} - Custom JWT verified successfully`);
      
      // Extract roles from custom JWT
      const roles = decoded.roles || ['user'];
      this.logger.log(`[${method}] ${path} - Custom JWT roles: ${JSON.stringify(roles)}`);
      
      request.user = {
        ...decoded,
        roles: roles,
      };

      this.logger.log(`[${method}] ${path} - Custom JWT authentication successful`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${method}] ${path} - Custom JWT validation failed: ${errorMessage}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}


