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
                else if (key) {
                    resolve(key.getPublicKey());
                }
                else {
                    reject(new Error('Signing key not found'));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiand0Lmd1YXJkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiand0Lmd1YXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBMEc7QUFFMUcsa0RBQW9DO0FBQ3BDLHdEQUFrQztBQUVyQixRQUFBLGFBQWEsR0FBRyxVQUFVLENBQUM7QUFHakMsSUFBTSxZQUFZLG9CQUFsQixNQUFNLFlBQVk7SUFJdkIsWUFBNkIsU0FBb0I7UUFBcEIsY0FBUyxHQUFULFNBQVMsQ0FBVztRQUhoQyxXQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsY0FBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBSXRELHFDQUFxQztRQUNyQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUEsa0JBQVUsRUFBQztZQUMzQixPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsSUFBSSwrRUFBK0U7WUFDeEgsS0FBSyxFQUFFLElBQUk7WUFDWCxXQUFXLEVBQUUsTUFBTSxFQUFFLGFBQWE7WUFDbEMsU0FBUyxFQUFFLElBQUk7WUFDZixxQkFBcUIsRUFBRSxDQUFDO1NBQ3pCLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxXQUFXLENBQUMsT0FBeUI7UUFDbkMsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3BELE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDekIsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUU5QixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLE1BQU0sS0FBSyxJQUFJLDRCQUE0QixDQUFDLENBQUM7UUFFakUsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBVSxxQkFBYSxFQUFFO1lBQ3hFLE9BQU8sQ0FBQyxVQUFV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Q0FBQyxDQUFDO1lBRXBGLE9BQU8sQ0FBQyxJQUFJLEdBQUc7Z0JBQ2IsR0FBRyxPQUFPO2dCQUNWLEtBQUssRUFBRSxLQUFLO2FBQ2IsQ0FBQztZQUVGLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksTUFBTSxLQUFLLElBQUkseUNBQXlDLENBQUMsQ0FBQztZQUM5RSxPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2YsTUFBTSxZQUFZLEdBQUcsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVFLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksTUFBTSxLQUFLLElBQUksb0NBQW9DLFlBQVksRUFBRSxDQUFDLENBQUM7WUFDekYsTUFBTSxJQUFJLDhCQUFxQixDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDOUQsQ0FBQztJQUNILENBQUM7Q0FDRixDQUFBO0FBbktZLG9DQUFZO3VCQUFaLFlBQVk7SUFEeEIsSUFBQSxtQkFBVSxHQUFFO0dBQ0EsWUFBWSxDQW1LeEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDYW5BY3RpdmF0ZSwgRXhlY3V0aW9uQ29udGV4dCwgSW5qZWN0YWJsZSwgVW5hdXRob3JpemVkRXhjZXB0aW9uLCBMb2dnZXIgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IFJlZmxlY3RvciB9IGZyb20gJ0BuZXN0anMvY29yZSc7XHJcbmltcG9ydCAqIGFzIGp3dCBmcm9tICdqc29ud2VidG9rZW4nO1xyXG5pbXBvcnQgandrc0NsaWVudCBmcm9tICdqd2tzLXJzYSc7XHJcblxyXG5leHBvcnQgY29uc3QgSVNfUFVCTElDX0tFWSA9ICdpc1B1YmxpYyc7XHJcblxyXG5ASW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBKd3RBdXRoR3VhcmQgaW1wbGVtZW50cyBDYW5BY3RpdmF0ZSB7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBsb2dnZXIgPSBuZXcgTG9nZ2VyKEp3dEF1dGhHdWFyZC5uYW1lKTtcclxuICBwcml2YXRlIGp3a3NDbGllbnQ6IFJldHVyblR5cGU8dHlwZW9mIGp3a3NDbGllbnQ+O1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHJlZmxlY3RvcjogUmVmbGVjdG9yKSB7XHJcbiAgICAvLyBJbml0aWFsaXplIEpXS1MgY2xpZW50IGZvciBDb2duaXRvXHJcbiAgICB0aGlzLmp3a3NDbGllbnQgPSBqd2tzQ2xpZW50KHtcclxuICAgICAgandrc1VyaTogcHJvY2Vzcy5lbnYuQ09HTklUT19KV0tTX1VSSSB8fCAnaHR0cHM6Ly9jb2duaXRvLWlkcC57cmVnaW9ufS5hbWF6b25hd3MuY29tL3t1c2VyUG9vbElkfS8ud2VsbC1rbm93bi9qd2tzLmpzb24nLFxyXG4gICAgICBjYWNoZTogdHJ1ZSxcclxuICAgICAgY2FjaGVNYXhBZ2U6IDYwMDAwMCwgLy8gMTAgbWludXRlc1xyXG4gICAgICByYXRlTGltaXQ6IHRydWUsXHJcbiAgICAgIGp3a3NSZXF1ZXN0c1Blck1pbnV0ZTogNSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgY2FuQWN0aXZhdGUoY29udGV4dDogRXhlY3V0aW9uQ29udGV4dCk6IGJvb2xlYW4gfCBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgIGNvbnN0IHJlcXVlc3QgPSBjb250ZXh0LnN3aXRjaFRvSHR0cCgpLmdldFJlcXVlc3QoKTtcclxuICAgIGNvbnN0IHBhdGggPSByZXF1ZXN0LnVybDtcclxuICAgIGNvbnN0IG1ldGhvZCA9IHJlcXVlc3QubWV0aG9kO1xyXG4gICAgXHJcbiAgICB0aGlzLmxvZ2dlci5sb2coYFske21ldGhvZH1dICR7cGF0aH0gLSBDaGVja2luZyBhdXRoZW50aWNhdGlvbmApO1xyXG5cclxuICAgIGNvbnN0IGlzUHVibGljID0gdGhpcy5yZWZsZWN0b3IuZ2V0QWxsQW5kT3ZlcnJpZGU8Ym9vbGVhbj4oSVNfUFVCTElDX0tFWSwgW1xyXG4gICAgICBjb250ZXh0LmdldEhhbmRsZXIoKSxcclxuICAgICAgY29udGV4dC5nZXRDbGFzcygpLFxyXG4gICAgXSk7XHJcbiAgICBcclxuICAgIGlmIChpc1B1YmxpYykge1xyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coYFske21ldGhvZH1dICR7cGF0aH0gLSBQdWJsaWMgZW5kcG9pbnQsIHNraXBwaW5nIGF1dGhlbnRpY2F0aW9uYCk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGF1dGhIZWFkZXI6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHJlcXVlc3QuaGVhZGVyc1snYXV0aG9yaXphdGlvbiddO1xyXG4gICAgdGhpcy5sb2dnZXIubG9nKGBbJHttZXRob2R9XSAke3BhdGh9IC0gQXV0aG9yaXphdGlvbiBoZWFkZXI6ICR7YXV0aEhlYWRlciA/ICdQcmVzZW50JyA6ICdNaXNzaW5nJ31gKTtcclxuICAgIFxyXG4gICAgaWYgKCFhdXRoSGVhZGVyIHx8ICFhdXRoSGVhZGVyLnN0YXJ0c1dpdGgoJ0JlYXJlciAnKSkge1xyXG4gICAgICB0aGlzLmxvZ2dlci53YXJuKGBbJHttZXRob2R9XSAke3BhdGh9IC0gTWlzc2luZyBvciBpbnZhbGlkIEJlYXJlciB0b2tlbmApO1xyXG4gICAgICB0aHJvdyBuZXcgVW5hdXRob3JpemVkRXhjZXB0aW9uKCdNaXNzaW5nIEJlYXJlciB0b2tlbicpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjb25zdCB0b2tlbiA9IGF1dGhIZWFkZXIuc2xpY2UoJ0JlYXJlciAnLmxlbmd0aCk7XHJcbiAgICB0aGlzLmxvZ2dlci5sb2coYFske21ldGhvZH1dICR7cGF0aH0gLSBUb2tlbiBsZW5ndGg6ICR7dG9rZW4ubGVuZ3RofSBjaGFyYWN0ZXJzYCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMudmFsaWRhdGVUb2tlbih0b2tlbiwgcmVxdWVzdCwgbWV0aG9kLCBwYXRoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgdmFsaWRhdGVUb2tlbih0b2tlbjogc3RyaW5nLCByZXF1ZXN0OiBhbnksIG1ldGhvZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgIHRoaXMubG9nZ2VyLmxvZyhgWyR7bWV0aG9kfV0gJHtwYXRofSAtIFN0YXJ0aW5nIHRva2VuIHZhbGlkYXRpb25gKTtcclxuICAgIFxyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gRGVjb2RlIHRva2VuIGhlYWRlciB0byBnZXQga2lkIChrZXkgSUQpXHJcbiAgICAgIGNvbnN0IGRlY29kZWQgPSBqd3QuZGVjb2RlKHRva2VuLCB7IGNvbXBsZXRlOiB0cnVlIH0pO1xyXG4gICAgICBpZiAoIWRlY29kZWQgfHwgIWRlY29kZWQuaGVhZGVyLmtpZCkge1xyXG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYFske21ldGhvZH1dICR7cGF0aH0gLSBJbnZhbGlkIHRva2VuIGZvcm1hdDogbWlzc2luZyBraWRgKTtcclxuICAgICAgICB0aHJvdyBuZXcgVW5hdXRob3JpemVkRXhjZXB0aW9uKCdJbnZhbGlkIHRva2VuIGZvcm1hdCcpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coYFske21ldGhvZH1dICR7cGF0aH0gLSBUb2tlbiBraWQ6ICR7ZGVjb2RlZC5oZWFkZXIua2lkfWApO1xyXG5cclxuICAgICAgLy8gR2V0IHNpZ25pbmcga2V5IGZyb20gSldLU1xyXG4gICAgICBjb25zdCBrZXkgPSBhd2FpdCB0aGlzLmdldFNpZ25pbmdLZXkoZGVjb2RlZC5oZWFkZXIua2lkKTtcclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBbJHttZXRob2R9XSAke3BhdGh9IC0gU3VjY2Vzc2Z1bGx5IHJldHJpZXZlZCBzaWduaW5nIGtleWApO1xyXG4gICAgICBcclxuICAgICAgLy8gVmVyaWZ5IHRva2VuIHdpdGggdGhlIGtleVxyXG4gICAgICBjb25zdCBwYXlsb2FkID0gand0LnZlcmlmeSh0b2tlbiwga2V5LCB7XHJcbiAgICAgICAgYWxnb3JpdGhtczogWydSUzI1NiddLFxyXG4gICAgICAgIGlzc3VlcjogcHJvY2Vzcy5lbnYuQ09HTklUT19JU1NVRVIsXHJcbiAgICAgICAgYXVkaWVuY2U6IHByb2Nlc3MuZW52LkNPR05JVE9fQ0xJRU5UX0lELFxyXG4gICAgICB9KSBhcyBhbnk7XHJcblxyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coYFske21ldGhvZH1dICR7cGF0aH0gLSBUb2tlbiB2ZXJpZmllZCBzdWNjZXNzZnVsbHkgd2l0aCBDb2duaXRvYCk7XHJcblxyXG4gICAgICAvLyBFeHRyYWN0IENvZ25pdG8gZ3JvdXBzIGFzIHJvbGVzXHJcbiAgICAgIGNvbnN0IHJvbGVzID0gdGhpcy5leHRyYWN0Um9sZXNGcm9tQ29nbml0b1Rva2VuKHBheWxvYWQpO1xyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coYFske21ldGhvZH1dICR7cGF0aH0gLSBVc2VyIHJvbGVzOiAke0pTT04uc3RyaW5naWZ5KHJvbGVzKX1gKTtcclxuICAgICAgXHJcbiAgICAgIC8vIEF0dGFjaCB1c2VyIHBheWxvYWQgd2l0aCByb2xlcyB0byByZXF1ZXN0XHJcbiAgICAgIHJlcXVlc3QudXNlciA9IHtcclxuICAgICAgICAuLi5wYXlsb2FkLFxyXG4gICAgICAgIHJvbGVzOiByb2xlcyxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgWyR7bWV0aG9kfV0gJHtwYXRofSAtIEF1dGhlbnRpY2F0aW9uIHN1Y2Nlc3NmdWxgKTtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XHJcbiAgICAgIHRoaXMubG9nZ2VyLndhcm4oYFske21ldGhvZH1dICR7cGF0aH0gLSBDb2duaXRvIHZhbGlkYXRpb24gZmFpbGVkOiAke2Vycm9yTWVzc2FnZX1gKTtcclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBbJHttZXRob2R9XSAke3BhdGh9IC0gRmFsbGluZyBiYWNrIHRvIGN1c3RvbSBKV1QgdmFsaWRhdGlvbmApO1xyXG4gICAgICAvLyBGYWxsYmFjayB0byBjdXN0b20gSldUIHZhbGlkYXRpb24gaWYgQ29nbml0byB2YWxpZGF0aW9uIGZhaWxzXHJcbiAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRlQ3VzdG9tSldUKHRva2VuLCByZXF1ZXN0LCBtZXRob2QsIHBhdGgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBnZXRTaWduaW5nS2V5KGtpZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMuandrc0NsaWVudC5nZXRTaWduaW5nS2V5KGtpZCwgKGVycjogRXJyb3IgfCBudWxsLCBrZXk6IGp3a3NDbGllbnQuU2lnbmluZ0tleSB8IHVuZGVmaW5lZCkgPT4ge1xyXG4gICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoa2V5KSB7XHJcbiAgICAgICAgICByZXNvbHZlKGtleS5nZXRQdWJsaWNLZXkoKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1NpZ25pbmcga2V5IG5vdCBmb3VuZCcpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGV4dHJhY3RSb2xlc0Zyb21Db2duaXRvVG9rZW4ocGF5bG9hZDogYW55KTogc3RyaW5nW10ge1xyXG4gICAgLy8gRXh0cmFjdCByb2xlcyBmcm9tIENvZ25pdG8gdG9rZW5cclxuICAgIC8vIE9wdGlvbiAxOiBGcm9tICdjb2duaXRvOmdyb3VwcycgY2xhaW1cclxuICAgIGlmIChwYXlsb2FkWydjb2duaXRvOmdyb3VwcyddKSB7XHJcbiAgICAgIHJldHVybiBwYXlsb2FkWydjb2duaXRvOmdyb3VwcyddO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE9wdGlvbiAyOiBGcm9tIGN1c3RvbSAncm9sZXMnIGNsYWltXHJcbiAgICBpZiAocGF5bG9hZC5yb2xlcykge1xyXG4gICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShwYXlsb2FkLnJvbGVzKSA/IHBheWxvYWQucm9sZXMgOiBbcGF5bG9hZC5yb2xlc107XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT3B0aW9uIDM6IEZyb20gJ2N1c3RvbTpyb2xlcycgY2xhaW1cclxuICAgIGlmIChwYXlsb2FkWydjdXN0b206cm9sZXMnXSkge1xyXG4gICAgICBjb25zdCByb2xlcyA9IHBheWxvYWRbJ2N1c3RvbTpyb2xlcyddO1xyXG4gICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShyb2xlcykgPyByb2xlcyA6IHJvbGVzLnNwbGl0KCcsJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGVmYXVsdCByb2xlIGlmIG5vIHJvbGVzIGZvdW5kXHJcbiAgICByZXR1cm4gWyd1c2VyJ107XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHZhbGlkYXRlQ3VzdG9tSldUKHRva2VuOiBzdHJpbmcsIHJlcXVlc3Q6IGFueSwgbWV0aG9kOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBbJHttZXRob2R9XSAke3BhdGh9IC0gQXR0ZW1wdGluZyBjdXN0b20gSldUIHZhbGlkYXRpb25gKTtcclxuICAgICAgXHJcbiAgICAgIC8vIEZhbGxiYWNrIHRvIGN1c3RvbSBKV1QgdmFsaWRhdGlvblxyXG4gICAgICBjb25zdCBwdWJsaWNLZXkgPSBwcm9jZXNzLmVudi5KV1RfUFVCTElDX0tFWSBhcyBzdHJpbmc7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgWyR7bWV0aG9kfV0gJHtwYXRofSAtIFVzaW5nIEpXVF9QVUJMSUNfS0VZOiAke3B1YmxpY0tleSA/ICdQcmVzZW50JyA6ICdNaXNzaW5nJ31gKTtcclxuICAgICAgXHJcbiAgICAgIC8vIElmIG5vIEpXVF9QVUJMSUNfS0VZIGlzIGNvbmZpZ3VyZWQsIHNraXAgY3VzdG9tIHZhbGlkYXRpb25cclxuICAgICAgaWYgKCFwdWJsaWNLZXkgfHwgcHVibGljS2V5LnRyaW0oKSA9PT0gJycpIHtcclxuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBbJHttZXRob2R9XSAke3BhdGh9IC0gTm8gSldUX1BVQkxJQ19LRVkgY29uZmlndXJlZCwgc2tpcHBpbmcgY3VzdG9tIEpXVCB2YWxpZGF0aW9uYCk7XHJcbiAgICAgICAgdGhyb3cgbmV3IFVuYXV0aG9yaXplZEV4Y2VwdGlvbignTm8gY3VzdG9tIEpXVCB2YWxpZGF0aW9uIGNvbmZpZ3VyZWQnKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgY29uc3QgZGVjb2RlZCA9IGp3dC52ZXJpZnkodG9rZW4sIHB1YmxpY0tleSwgeyBhbGdvcml0aG1zOiBbJ1JTMjU2JywgJ0hTMjU2J10gfSkgYXMgYW55O1xyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coYFske21ldGhvZH1dICR7cGF0aH0gLSBDdXN0b20gSldUIHZlcmlmaWVkIHN1Y2Nlc3NmdWxseWApO1xyXG4gICAgICBcclxuICAgICAgLy8gRXh0cmFjdCByb2xlcyBmcm9tIGN1c3RvbSBKV1RcclxuICAgICAgY29uc3Qgcm9sZXMgPSBkZWNvZGVkLnJvbGVzIHx8IFsndXNlciddO1xyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coYFske21ldGhvZH1dICR7cGF0aH0gLSBDdXN0b20gSldUIHJvbGVzOiAke0pTT04uc3RyaW5naWZ5KHJvbGVzKX1gKTtcclxuICAgICAgXHJcbiAgICAgIHJlcXVlc3QudXNlciA9IHtcclxuICAgICAgICAuLi5kZWNvZGVkLFxyXG4gICAgICAgIHJvbGVzOiByb2xlcyxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgWyR7bWV0aG9kfV0gJHtwYXRofSAtIEN1c3RvbSBKV1QgYXV0aGVudGljYXRpb24gc3VjY2Vzc2Z1bGApO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcclxuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoYFske21ldGhvZH1dICR7cGF0aH0gLSBDdXN0b20gSldUIHZhbGlkYXRpb24gZmFpbGVkOiAke2Vycm9yTWVzc2FnZX1gKTtcclxuICAgICAgdGhyb3cgbmV3IFVuYXV0aG9yaXplZEV4Y2VwdGlvbignSW52YWxpZCBvciBleHBpcmVkIHRva2VuJyk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5cclxuIl19