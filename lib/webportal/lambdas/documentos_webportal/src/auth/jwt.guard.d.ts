import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare const IS_PUBLIC_KEY = "isPublic";
export declare class JwtAuthGuard implements CanActivate {
    private readonly reflector;
    private readonly logger;
    private jwksClient;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean | Promise<boolean>;
    private validateToken;
    private getSigningKey;
    private extractRolesFromCognitoToken;
    private validateCustomJWT;
}
