"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var JwtAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
const jwt = __importStar(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
exports.IS_PUBLIC_KEY = 'isPublic';
let JwtAuthGuard = JwtAuthGuard_1 = class JwtAuthGuard {
    constructor(reflector) {
        this.reflector = reflector;
        this.logger = new common_1.Logger(JwtAuthGuard_1.name);
        // Initialize JWKS client for Cognito
        this.jwksClient = (0, jwks_rsa_1.default)({
            jwksUri: process.env.COGNITO_JWKS_URI || 'https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json',
            cache: true,
            cacheMaxAge: 600000, // 10 minutes
            rateLimit: true,
            jwksRequestsPerMinute: 5,
        });
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const path = request.url;
        const method = request.method;
        this.logger.log(`[${method}] ${path} - Checking authentication`);
        const isPublic = this.reflector.getAllAndOverride(exports.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            this.logger.log(`[${method}] ${path} - Public endpoint, skipping authentication`);
            return true;
        }
        const authHeader = request.headers['authorization'];
        this.logger.log(`[${method}] ${path} - Authorization header: ${authHeader ? 'Present' : 'Missing'}`);
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            this.logger.warn(`[${method}] ${path} - Missing or invalid Bearer token`);
            throw new common_1.UnauthorizedException('Missing Bearer token');
        }
        const token = authHeader.slice('Bearer '.length);
        this.logger.log(`[${method}] ${path} - Token length: ${token.length} characters`);
        return this.validateToken(token, request, method, path);
    }
    async validateToken(token, request, method, path) {
        this.logger.log(`[${method}] ${path} - Starting token validation`);
        try {
            // Decode token header to get kid (key ID)
            const decoded = jwt.decode(token, { complete: true });
            if (!decoded || !decoded.header.kid) {
                this.logger.warn(`[${method}] ${path} - Invalid token format: missing kid`);
                throw new common_1.UnauthorizedException('Invalid token format');
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
            });
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`[${method}] ${path} - Cognito validation failed: ${errorMessage}`);
            this.logger.log(`[${method}] ${path} - Falling back to custom JWT validation`);
            // Fallback to custom JWT validation if Cognito validation fails
            return this.validateCustomJWT(token, request, method, path);
        }
    }
    async getSigningKey(kid) {
        return new Promise((resolve, reject) => {
            this.jwksClient.getSigningKey(kid, (err, key) => {
                if (err) {
                    reject(err);
                }
                else if (!key) {
                    reject(new Error('Signing key not found'));
                }
                else {
                    resolve(key.getPublicKey());
                }
            });
        });
    }
    extractRolesFromCognitoToken(payload) {
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
    validateCustomJWT(token, request, method, path) {
        try {
            this.logger.log(`[${method}] ${path} - Attempting custom JWT validation`);
            // Fallback to custom JWT validation
            const publicKey = process.env.JWT_PUBLIC_KEY;
            this.logger.log(`[${method}] ${path} - Using JWT_PUBLIC_KEY: ${publicKey ? 'Present' : 'Missing'}`);
            // If no JWT_PUBLIC_KEY is configured, skip custom validation
            if (!publicKey || publicKey.trim() === '') {
                this.logger.warn(`[${method}] ${path} - No JWT_PUBLIC_KEY configured, skipping custom JWT validation`);
                throw new common_1.UnauthorizedException('No custom JWT validation configured');
            }
            const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256', 'HS256'] });
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`[${method}] ${path} - Custom JWT validation failed: ${errorMessage}`);
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = JwtAuthGuard_1 = __decorate([
    (0, common_1.Injectable)()
], JwtAuthGuard);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiand0Lmd1YXJkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiand0Lmd1YXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBMEc7QUFFMUcsa0RBQW9DO0FBQ3BDLHdEQUErQztBQUVsQyxRQUFBLGFBQWEsR0FBRyxVQUFVLENBQUM7QUFHakMsSUFBTSxZQUFZLG9CQUFsQixNQUFNLFlBQVk7SUFJdkIsWUFBNkIsU0FBb0I7UUFBcEIsY0FBUyxHQUFULFNBQVMsQ0FBVztRQUhoQyxXQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsY0FBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBSXRELHFDQUFxQztRQUNyQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUEsa0JBQU8sRUFBQztZQUN4QixPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsSUFBSSwrRUFBK0U7WUFDeEgsS0FBSyxFQUFFLElBQUk7WUFDWCxXQUFXLEVBQUUsTUFBTSxFQUFFLGFBQWE7WUFDbEMsU0FBUyxFQUFFLElBQUk7WUFDZixxQkFBcUIsRUFBRSxDQUFDO1NBQ3pCLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxXQUFXLENBQUMsT0FBeUI7UUFDbkMsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3BELE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDekIsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUU5QixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLE1BQU0sS0FBSyxJQUFJLDRCQUE0QixDQUFDLENBQUM7UUFFakUsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBVSxxQkFBYSxFQUFFO1lBQ3hFLE9BQU8sQ0FBQyxVQUFV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QUFFLENBQUMsQ0FBQztZQUVwRixPQUFPLENBQUMsSUFBSSxHQUFHO2dCQUNiLEdBQUcsT0FBTztnQkFDVixLQUFLLEVBQUUsS0FBSzthQUNiLENBQUM7WUFFRixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLE1BQU0sS0FBSyxJQUFJLHlDQUF5QyxDQUFDLENBQUM7WUFDOUUsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE1BQU0sWUFBWSxHQUFHLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1RSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLE1BQU0sS0FBSyxJQUFJLG9DQUFvQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQ3pGLE1BQU0sSUFBSSw4QkFBcUIsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQzlELENBQUM7SUFDSCxDQUFDO0NBQ0YsQ0FBQTtBQW5LWSxvQ0FBWTt1QkFBWixZQUFZO0lBRHhCLElBQUEsbUJBQVUsR0FBRTtHQUNBLFlBQVksQ0FtS3hCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2FuQWN0aXZhdGUsIEV4ZWN1dGlvbkNvbnRleHQsIEluamVjdGFibGUsIFVuYXV0aG9yaXplZEV4Y2VwdGlvbiwgTG9nZ2VyIH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xyXG5pbXBvcnQgeyBSZWZsZWN0b3IgfSBmcm9tICdAbmVzdGpzL2NvcmUnO1xyXG5pbXBvcnQgKiBhcyBqd3QgZnJvbSAnanNvbndlYnRva2VuJztcclxuaW1wb3J0IGp3a3NSc2EsIHsgSndrc0NsaWVudCB9IGZyb20gJ2p3a3MtcnNhJztcclxuXHJcbmV4cG9ydCBjb25zdCBJU19QVUJMSUNfS0VZID0gJ2lzUHVibGljJztcclxuXHJcbkBJbmplY3RhYmxlKClcclxuZXhwb3J0IGNsYXNzIEp3dEF1dGhHdWFyZCBpbXBsZW1lbnRzIENhbkFjdGl2YXRlIHtcclxuICBwcml2YXRlIHJlYWRvbmx5IGxvZ2dlciA9IG5ldyBMb2dnZXIoSnd0QXV0aEd1YXJkLm5hbWUpO1xyXG4gIHByaXZhdGUgandrc0NsaWVudDogSndrc0NsaWVudDtcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSByZWZsZWN0b3I6IFJlZmxlY3Rvcikge1xyXG4gICAgLy8gSW5pdGlhbGl6ZSBKV0tTIGNsaWVudCBmb3IgQ29nbml0b1xyXG4gICAgdGhpcy5qd2tzQ2xpZW50ID0gandrc1JzYSh7XHJcbiAgICAgIGp3a3NVcmk6IHByb2Nlc3MuZW52LkNPR05JVE9fSldLU19VUkkgfHwgJ2h0dHBzOi8vY29nbml0by1pZHAue3JlZ2lvbn0uYW1hem9uYXdzLmNvbS97dXNlclBvb2xJZH0vLndlbGwta25vd24vandrcy5qc29uJyxcclxuICAgICAgY2FjaGU6IHRydWUsXHJcbiAgICAgIGNhY2hlTWF4QWdlOiA2MDAwMDAsIC8vIDEwIG1pbnV0ZXNcclxuICAgICAgcmF0ZUxpbWl0OiB0cnVlLFxyXG4gICAgICBqd2tzUmVxdWVzdHNQZXJNaW51dGU6IDUsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGNhbkFjdGl2YXRlKGNvbnRleHQ6IEV4ZWN1dGlvbkNvbnRleHQpOiBib29sZWFuIHwgUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICBjb25zdCByZXF1ZXN0ID0gY29udGV4dC5zd2l0Y2hUb0h0dHAoKS5nZXRSZXF1ZXN0KCk7XHJcbiAgICBjb25zdCBwYXRoID0gcmVxdWVzdC51cmw7XHJcbiAgICBjb25zdCBtZXRob2QgPSByZXF1ZXN0Lm1ldGhvZDtcclxuICAgIFxyXG4gICAgdGhpcy5sb2dnZXIubG9nKGBbJHttZXRob2R9XSAke3BhdGh9IC0gQ2hlY2tpbmcgYXV0aGVudGljYXRpb25gKTtcclxuXHJcbiAgICBjb25zdCBpc1B1YmxpYyA9IHRoaXMucmVmbGVjdG9yLmdldEFsbEFuZE92ZXJyaWRlPGJvb2xlYW4+KElTX1BVQkxJQ19LRVksIFtcclxuICAgICAgY29udGV4dC5nZXRIYW5kbGVyKCksXHJcbiAgICAgIGNvbnRleHQuZ2V0Q2xhc3MoKSxcclxuICAgIF0pO1xyXG4gICAgXHJcbiAgICBpZiAoaXNQdWJsaWMpIHtcclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBbJHttZXRob2R9XSAke3BhdGh9IC0gUHVibGljIGVuZHBvaW50LCBza2lwcGluZyBhdXRoZW50aWNhdGlvbmApO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhdXRoSGVhZGVyOiBzdHJpbmcgfCB1bmRlZmluZWQgPSByZXF1ZXN0LmhlYWRlcnNbJ2F1dGhvcml6YXRpb24nXTtcclxuICAgIHRoaXMubG9nZ2VyLmxvZyhgWyR7bWV0aG9kfV0gJHtwYXRofSAtIEF1dGhvcml6YXRpb24gaGVhZGVyOiAke2F1dGhIZWFkZXIgPyAnUHJlc2VudCcgOiAnTWlzc2luZyd9YCk7XHJcbiAgICBcclxuICAgIGlmICghYXV0aEhlYWRlciB8fCAhYXV0aEhlYWRlci5zdGFydHNXaXRoKCdCZWFyZXIgJykpIHtcclxuICAgICAgdGhpcy5sb2dnZXIud2FybihgWyR7bWV0aG9kfV0gJHtwYXRofSAtIE1pc3Npbmcgb3IgaW52YWxpZCBCZWFyZXIgdG9rZW5gKTtcclxuICAgICAgdGhyb3cgbmV3IFVuYXV0aG9yaXplZEV4Y2VwdGlvbignTWlzc2luZyBCZWFyZXIgdG9rZW4nKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgY29uc3QgdG9rZW4gPSBhdXRoSGVhZGVyLnNsaWNlKCdCZWFyZXIgJy5sZW5ndGgpO1xyXG4gICAgdGhpcy5sb2dnZXIubG9nKGBbJHttZXRob2R9XSAke3BhdGh9IC0gVG9rZW4gbGVuZ3RoOiAke3Rva2VuLmxlbmd0aH0gY2hhcmFjdGVyc2ApO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnZhbGlkYXRlVG9rZW4odG9rZW4sIHJlcXVlc3QsIG1ldGhvZCwgcGF0aCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIHZhbGlkYXRlVG9rZW4odG9rZW46IHN0cmluZywgcmVxdWVzdDogYW55LCBtZXRob2Q6IHN0cmluZywgcGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICB0aGlzLmxvZ2dlci5sb2coYFske21ldGhvZH1dICR7cGF0aH0gLSBTdGFydGluZyB0b2tlbiB2YWxpZGF0aW9uYCk7XHJcbiAgICBcclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIERlY29kZSB0b2tlbiBoZWFkZXIgdG8gZ2V0IGtpZCAoa2V5IElEKVxyXG4gICAgICBjb25zdCBkZWNvZGVkID0gand0LmRlY29kZSh0b2tlbiwgeyBjb21wbGV0ZTogdHJ1ZSB9KTtcclxuICAgICAgaWYgKCFkZWNvZGVkIHx8ICFkZWNvZGVkLmhlYWRlci5raWQpIHtcclxuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBbJHttZXRob2R9XSAke3BhdGh9IC0gSW52YWxpZCB0b2tlbiBmb3JtYXQ6IG1pc3Npbmcga2lkYCk7XHJcbiAgICAgICAgdGhyb3cgbmV3IFVuYXV0aG9yaXplZEV4Y2VwdGlvbignSW52YWxpZCB0b2tlbiBmb3JtYXQnKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBbJHttZXRob2R9XSAke3BhdGh9IC0gVG9rZW4ga2lkOiAke2RlY29kZWQuaGVhZGVyLmtpZH1gKTtcclxuXHJcbiAgICAgIC8vIEdldCBzaWduaW5nIGtleSBmcm9tIEpXS1NcclxuICAgICAgY29uc3Qga2V5ID0gYXdhaXQgdGhpcy5nZXRTaWduaW5nS2V5KGRlY29kZWQuaGVhZGVyLmtpZCk7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgWyR7bWV0aG9kfV0gJHtwYXRofSAtIFN1Y2Nlc3NmdWxseSByZXRyaWV2ZWQgc2lnbmluZyBrZXlgKTtcclxuICAgICAgXHJcbiAgICAgIC8vIFZlcmlmeSB0b2tlbiB3aXRoIHRoZSBrZXlcclxuICAgICAgY29uc3QgcGF5bG9hZCA9IGp3dC52ZXJpZnkodG9rZW4sIGtleSwge1xyXG4gICAgICAgIGFsZ29yaXRobXM6IFsnUlMyNTYnXSxcclxuICAgICAgICBpc3N1ZXI6IHByb2Nlc3MuZW52LkNPR05JVE9fSVNTVUVSLFxyXG4gICAgICAgIGF1ZGllbmNlOiBwcm9jZXNzLmVudi5DT0dOSVRPX0NMSUVOVF9JRCxcclxuICAgICAgfSkgYXMgYW55O1xyXG5cclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBbJHttZXRob2R9XSAke3BhdGh9IC0gVG9rZW4gdmVyaWZpZWQgc3VjY2Vzc2Z1bGx5IHdpdGggQ29nbml0b2ApO1xyXG5cclxuICAgICAgLy8gRXh0cmFjdCBDb2duaXRvIGdyb3VwcyBhcyByb2xlc1xyXG4gICAgICBjb25zdCByb2xlcyA9IHRoaXMuZXh0cmFjdFJvbGVzRnJvbUNvZ25pdG9Ub2tlbihwYXlsb2FkKTtcclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBbJHttZXRob2R9XSAke3BhdGh9IC0gVXNlciByb2xlczogJHtKU09OLnN0cmluZ2lmeShyb2xlcyl9YCk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBBdHRhY2ggdXNlciBwYXlsb2FkIHdpdGggcm9sZXMgdG8gcmVxdWVzdFxyXG4gICAgICByZXF1ZXN0LnVzZXIgPSB7XHJcbiAgICAgICAgLi4ucGF5bG9hZCxcclxuICAgICAgICByb2xlczogcm9sZXMsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coYFske21ldGhvZH1dICR7cGF0aH0gLSBBdXRoZW50aWNhdGlvbiBzdWNjZXNzZnVsYCk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xyXG4gICAgICB0aGlzLmxvZ2dlci53YXJuKGBbJHttZXRob2R9XSAke3BhdGh9IC0gQ29nbml0byB2YWxpZGF0aW9uIGZhaWxlZDogJHtlcnJvck1lc3NhZ2V9YCk7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgWyR7bWV0aG9kfV0gJHtwYXRofSAtIEZhbGxpbmcgYmFjayB0byBjdXN0b20gSldUIHZhbGlkYXRpb25gKTtcclxuICAgICAgLy8gRmFsbGJhY2sgdG8gY3VzdG9tIEpXVCB2YWxpZGF0aW9uIGlmIENvZ25pdG8gdmFsaWRhdGlvbiBmYWlsc1xyXG4gICAgICByZXR1cm4gdGhpcy52YWxpZGF0ZUN1c3RvbUpXVCh0b2tlbiwgcmVxdWVzdCwgbWV0aG9kLCBwYXRoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgZ2V0U2lnbmluZ0tleShraWQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmp3a3NDbGllbnQuZ2V0U2lnbmluZ0tleShraWQsIChlcnIsIGtleSkgPT4ge1xyXG4gICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIWtleSkge1xyXG4gICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignU2lnbmluZyBrZXkgbm90IGZvdW5kJykpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXNvbHZlKGtleS5nZXRQdWJsaWNLZXkoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBleHRyYWN0Um9sZXNGcm9tQ29nbml0b1Rva2VuKHBheWxvYWQ6IGFueSk6IHN0cmluZ1tdIHtcclxuICAgIC8vIEV4dHJhY3Qgcm9sZXMgZnJvbSBDb2duaXRvIHRva2VuXHJcbiAgICAvLyBPcHRpb24gMTogRnJvbSAnY29nbml0bzpncm91cHMnIGNsYWltXHJcbiAgICBpZiAocGF5bG9hZFsnY29nbml0bzpncm91cHMnXSkge1xyXG4gICAgICByZXR1cm4gcGF5bG9hZFsnY29nbml0bzpncm91cHMnXTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBPcHRpb24gMjogRnJvbSBjdXN0b20gJ3JvbGVzJyBjbGFpbVxyXG4gICAgaWYgKHBheWxvYWQucm9sZXMpIHtcclxuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkocGF5bG9hZC5yb2xlcykgPyBwYXlsb2FkLnJvbGVzIDogW3BheWxvYWQucm9sZXNdO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE9wdGlvbiAzOiBGcm9tICdjdXN0b206cm9sZXMnIGNsYWltXHJcbiAgICBpZiAocGF5bG9hZFsnY3VzdG9tOnJvbGVzJ10pIHtcclxuICAgICAgY29uc3Qgcm9sZXMgPSBwYXlsb2FkWydjdXN0b206cm9sZXMnXTtcclxuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkocm9sZXMpID8gcm9sZXMgOiByb2xlcy5zcGxpdCgnLCcpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERlZmF1bHQgcm9sZSBpZiBubyByb2xlcyBmb3VuZFxyXG4gICAgcmV0dXJuIFsndXNlciddO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSB2YWxpZGF0ZUN1c3RvbUpXVCh0b2tlbjogc3RyaW5nLCByZXF1ZXN0OiBhbnksIG1ldGhvZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgWyR7bWV0aG9kfV0gJHtwYXRofSAtIEF0dGVtcHRpbmcgY3VzdG9tIEpXVCB2YWxpZGF0aW9uYCk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBGYWxsYmFjayB0byBjdXN0b20gSldUIHZhbGlkYXRpb25cclxuICAgICAgY29uc3QgcHVibGljS2V5ID0gcHJvY2Vzcy5lbnYuSldUX1BVQkxJQ19LRVkgYXMgc3RyaW5nO1xyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coYFske21ldGhvZH1dICR7cGF0aH0gLSBVc2luZyBKV1RfUFVCTElDX0tFWTogJHtwdWJsaWNLZXkgPyAnUHJlc2VudCcgOiAnTWlzc2luZyd9YCk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBJZiBubyBKV1RfUFVCTElDX0tFWSBpcyBjb25maWd1cmVkLCBza2lwIGN1c3RvbSB2YWxpZGF0aW9uXHJcbiAgICAgIGlmICghcHVibGljS2V5IHx8IHB1YmxpY0tleS50cmltKCkgPT09ICcnKSB7XHJcbiAgICAgICAgdGhpcy5sb2dnZXIud2FybihgWyR7bWV0aG9kfV0gJHtwYXRofSAtIE5vIEpXVF9QVUJMSUNfS0VZIGNvbmZpZ3VyZWQsIHNraXBwaW5nIGN1c3RvbSBKV1QgdmFsaWRhdGlvbmApO1xyXG4gICAgICAgIHRocm93IG5ldyBVbmF1dGhvcml6ZWRFeGNlcHRpb24oJ05vIGN1c3RvbSBKV1QgdmFsaWRhdGlvbiBjb25maWd1cmVkJyk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGNvbnN0IGRlY29kZWQgPSBqd3QudmVyaWZ5KHRva2VuLCBwdWJsaWNLZXksIHsgYWxnb3JpdGhtczogWydSUzI1NicsICdIUzI1NiddIH0pIGFzIGFueTtcclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBbJHttZXRob2R9XSAke3BhdGh9IC0gQ3VzdG9tIEpXVCB2ZXJpZmllZCBzdWNjZXNzZnVsbHlgKTtcclxuICAgICAgXHJcbiAgICAgIC8vIEV4dHJhY3Qgcm9sZXMgZnJvbSBjdXN0b20gSldUXHJcbiAgICAgIGNvbnN0IHJvbGVzID0gZGVjb2RlZC5yb2xlcyB8fCBbJ3VzZXInXTtcclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBbJHttZXRob2R9XSAke3BhdGh9IC0gQ3VzdG9tIEpXVCByb2xlczogJHtKU09OLnN0cmluZ2lmeShyb2xlcyl9YCk7XHJcbiAgICAgIFxyXG4gICAgICByZXF1ZXN0LnVzZXIgPSB7XHJcbiAgICAgICAgLi4uZGVjb2RlZCxcclxuICAgICAgICByb2xlczogcm9sZXMsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coYFske21ldGhvZH1dICR7cGF0aH0gLSBDdXN0b20gSldUIGF1dGhlbnRpY2F0aW9uIHN1Y2Nlc3NmdWxgKTtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBbJHttZXRob2R9XSAke3BhdGh9IC0gQ3VzdG9tIEpXVCB2YWxpZGF0aW9uIGZhaWxlZDogJHtlcnJvck1lc3NhZ2V9YCk7XHJcbiAgICAgIHRocm93IG5ldyBVbmF1dGhvcml6ZWRFeGNlcHRpb24oJ0ludmFsaWQgb3IgZXhwaXJlZCB0b2tlbicpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuXHJcbiJdfQ==