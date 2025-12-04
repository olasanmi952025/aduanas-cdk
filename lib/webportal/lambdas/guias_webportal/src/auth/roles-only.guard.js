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
var RolesOnlyGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesOnlyGuard = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
const jwt = __importStar(require("jsonwebtoken"));
exports.IS_PUBLIC_KEY = 'isPublic';
let RolesOnlyGuard = RolesOnlyGuard_1 = class RolesOnlyGuard {
    constructor(reflector) {
        this.reflector = reflector;
        this.logger = new common_1.Logger(RolesOnlyGuard_1.name);
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const path = request.url;
        const method = request.method;
        this.logger.log(`[${method}] ${path} - Checking authorization`);
        const isPublic = this.reflector.getAllAndOverride(exports.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            this.logger.log(`[${method}] ${path} - Public endpoint, skipping authorization`);
            return true;
        }
        const authHeader = request.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            this.logger.warn(`[${method}] ${path} - Missing Bearer token`);
            throw new common_1.UnauthorizedException('Missing Bearer token');
        }
        const token = authHeader.slice('Bearer '.length);
        try {
            // Decode token without verification (API Gateway already validated it)
            const decoded = jwt.decode(token);
            decoded['groups'] = ['couriers']; // validar y quitar.
            if (!decoded) {
                this.logger.warn(`[${method}] ${path} - Invalid token format`);
                throw new common_1.UnauthorizedException('Invalid token');
            }
            // Additional security validations
            if (!decoded.sub) {
                this.logger.warn(`[${method}] ${path} - Missing subject in token`);
                throw new common_1.UnauthorizedException('Invalid token: missing subject');
            }
            if (decoded.token_type !== 'access') {
                this.logger.warn(`[${method}] ${path} - Invalid token use: ${decoded.token_use}`);
                throw new common_1.UnauthorizedException('Invalid token: not an access token');
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`[${method}] ${path} - Token processing failed: ${errorMessage}`);
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
};
exports.RolesOnlyGuard = RolesOnlyGuard;
exports.RolesOnlyGuard = RolesOnlyGuard = RolesOnlyGuard_1 = __decorate([
    (0, common_1.Injectable)()
], RolesOnlyGuard);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sZXMtb25seS5ndWFyZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJvbGVzLW9ubHkuZ3VhcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJDQUEwRztBQUUxRyxrREFBb0M7QUFFdkIsUUFBQSxhQUFhLEdBQUcsVUFBVSxDQUFDO0FBR2pDLElBQU0sY0FBYyxzQkFBcEIsTUFBTSxjQUFjO0lBR3pCLFlBQTZCLFNBQW9CO1FBQXBCLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFGaEMsV0FBTSxHQUFHLElBQUksZUFBTSxDQUFDLGdCQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFTixDQUFDO0lBRXJELFdBQVcsQ0FBQyxPQUF5QjtRQUNuQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDcEQsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUN6QixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBRTlCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksTUFBTSxLQUFLLElBQUksMkJBQTJCLENBQUMsQ0FBQztRQUVoRSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFVLHFCQUFhLEVBQUU7WUFDeEUsT0FBTyxDQUFDLFVBQVUsRUFBRTtZQUNwQixPQUFPLENBQUMsUUFBUSxFQUFFO1NBQ25CLENBQUMsQ0FBQztRQUVILElBQUksUUFBUSxFQUFFLENBQUM7WUFDYixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLE1BQU0sS0FBSyxJQUFJLDRDQUE0QyxDQUFDLENBQUM7WUFDakYsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBRUQsTUFBTSxVQUFVLEdBQXVCLE9BQU8sQ0FBQyxPQUFPLENBQUMsZUFB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QUFZLEVBQUUsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sSUFBSSw4QkFBcUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNuRCxDQUFDO0lBQ0gsQ0FBQztDQUNGLENBQUE7QUE5RVksd0NBQWM7eUJBQWQsY0FBYztJQUQxQixJQUFBLG1CQUFVLEdBQUU7R0FDQSxjQUFjLENBOEUxQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENhbkFjdGl2YXRlLCBFeGVjdXRpb25Db250ZXh0LCBJbmplY3RhYmxlLCBVbmF1dGhvcml6ZWRFeGNlcHRpb24sIExvZ2dlciB9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcclxuaW1wb3J0IHsgUmVmbGVjdG9yIH0gZnJvbSAnQG5lc3Rqcy9jb3JlJztcclxuaW1wb3J0ICogYXMgand0IGZyb20gJ2pzb253ZWJ0b2tlbic7XHJcblxyXG5leHBvcnQgY29uc3QgSVNfUFVCTElDX0tFWSA9ICdpc1B1YmxpYyc7XHJcblxyXG5ASW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBSb2xlc09ubHlHdWFyZCBpbXBsZW1lbnRzIENhbkFjdGl2YXRlIHtcclxuICBwcml2YXRlIHJlYWRvbmx5IGxvZ2dlciA9IG5ldyBMb2dnZXIoUm9sZXNPbmx5R3VhcmQubmFtZSk7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgcmVmbGVjdG9yOiBSZWZsZWN0b3IpIHt9XHJcblxyXG4gIGNhbkFjdGl2YXRlKGNvbnRleHQ6IEV4ZWN1dGlvbkNvbnRleHQpOiBib29sZWFuIHtcclxuICAgIGNvbnN0IHJlcXVlc3QgPSBjb250ZXh0LnN3aXRjaFRvSHR0cCgpLmdldFJlcXVlc3QoKTtcclxuICAgIGNvbnN0IHBhdGggPSByZXF1ZXN0LnVybDtcclxuICAgIGNvbnN0IG1ldGhvZCA9IHJlcXVlc3QubWV0aG9kO1xyXG4gICAgXHJcbiAgICB0aGlzLmxvZ2dlci5sb2coYFske21ldGhvZH1dICR7cGF0aH0gLSBDaGVja2luZyBhdXRob3JpemF0aW9uYCk7XHJcblxyXG4gICAgY29uc3QgaXNQdWJsaWMgPSB0aGlzLnJlZmxlY3Rvci5nZXRBbGxBbmRPdmVycmlkZTxib29sZWFuPihJU19QVUJMSUNfS0VZLCBbXHJcbiAgICAgIGNvbnRleHQuZ2V0SGFuZGxlcigpLFxyXG4gICAgICBjb250ZXh0LmdldENsYXNzKCksXHJcbiAgICBdKTtcclxuICAgIFxyXG4gICAgaWYgKGlzUHVibGljKSB7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgWyR7bWV0aG9kfV0gJHtwYXRofSAtIFB1YmxpYyBlbmRwb2ludCwgc2tpcHBpbmcgYXV0aG9yaXphdGlvbmApO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhdXRoSGVhZGVyOiBzdHJpbmcgfCB1bmRlZmluZWQgPSByZXF1ZXN0LmhlYWRlcnNbJ2F1dGhvcml6YXRpb24nXTtcclxuICAgIFxyXG4gICAgaWYgKCFhdXRoSGVhZGVyIHx8ICFhdXRoSGVhZGVyLnN0YXJ0c1dpdGgoJ0JlYXJlciAnKSkge1xyXG4gICAgICB0aGlzLmxvZ2dlci53YXJuKGBbJHttZXRob2R9XSAke3BhdGh9IC0gTWlzc2luZyBCZWFyZXIgdG9rZW5gKTtcclxuICAgICAgdGhyb3cgbmV3IFVuYXV0aG9yaXplZEV4Y2VwdGlvbignTWlzc2luZyBCZWFyZXIgdG9rZW4nKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgY29uc3QgdG9rZW4gPSBhdXRoSGVhZGVyLnNsaWNlKCdCZWFyZXIgJy5sZW5ndGgpO1xyXG4gICAgXHJcbiAgICB0cnkge1xyXG4gICAgICAvLyBEZWNvZGUgdG9rZW4gd2l0aG91dCB2ZXJpZmljYXRpb24gKEFQSSBHYXRld2F5IGFscmVhZHkgdmFsaWRhdGVkIGl0KVxyXG4gICAgICBjb25zdCBkZWNvZGVkID0gand0LmRlY29kZSh0b2tlbikgYXMgYW55O1xyXG4gICAgICBkZWNvZGVkWydncm91cHMnXSA9IFsnY291cmllcnMnXTsgLy8gdmFsaWRhciB5IHF1aXRhci5cclxuICAgICAgXHJcbiAgICAgIGlmICghZGVjb2RlZCkge1xyXG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYFske21ldGhvZH1dICR7cGF0aH0gLSBJbnZhbGlkIHRva2VuIGZvcm1hdGApO1xyXG4gICAgICAgIHRocm93IG5ldyBVbmF1dGhvcml6ZWRFeGNlcHRpb24oJ0ludmFsaWQgdG9rZW4nKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQWRkaXRpb25hbCBzZWN1cml0eSB2YWxpZGF0aW9uc1xyXG4gICAgICBpZiAoIWRlY29kZWQuc3ViKSB7XHJcbiAgICAgICAgdGhpcy5sb2dnZXIud2FybihgWyR7bWV0aG9kfV0gJHtwYXRofSAtIE1pc3Npbmcgc3ViamVjdCBpbiB0b2tlbmApO1xyXG4gICAgICAgIHRocm93IG5ldyBVbmF1dGhvcml6ZWRFeGNlcHRpb24oJ0ludmFsaWQgdG9rZW46IG1pc3Npbmcgc3ViamVjdCcpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICBpZiAoZGVjb2RlZC50b2tlbl90eXBlICE9PSAnYWNjZXNzJykge1xyXG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYFske21ldGhvZH1dICR7cGF0aH0gLSBJbnZhbGlkIHRva2VuIHVzZTogJHtkZWNvZGVkLnRva2VuX3VzZX1gKTtcclxuICAgICAgICB0aHJvdyBuZXcgVW5hdXRob3JpemVkRXhjZXB0aW9uKCdJbnZhbGlkIHRva2VuOiBub3QgYW4gYWNjZXNzIHRva2VuJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEV4dHJhY3Qgcm9sZXMgZnJvbSBDb2duaXRvIHRva2VuIC0gdHJ5IG11bHRpcGxlIHBvc3NpYmxlIGZpZWxkc1xyXG4gICAgICBjb25zdCByb2xlcyA9IGRlY29kZWRbJ2NvZ25pdG86Z3JvdXBzJ10gfHwgZGVjb2RlZFsnZ3JvdXBzJ10gfHwgZGVjb2RlZFsncm9sZXMnXSB8fCBkZWNvZGVkWydjb2duaXRvOnJvbGVzJ10gfHwgW107XHJcbiAgICAgIGNvbnN0IHVzZXJuYW1lID0gZGVjb2RlZFsnY29nbml0bzp1c2VybmFtZSddIHx8IGRlY29kZWQuc3ViO1xyXG4gICAgICBcclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBbJHttZXRob2R9XSAke3BhdGh9IC0gVXNlcjogJHt1c2VybmFtZX0sIFJvbGVzOiBbJHtyb2xlcy5qb2luKCcsICcpfV1gKTtcclxuICAgICAgXHJcbiAgICAgIC8vIEF0dGFjaCB1c2VyIGluZm8gdG8gcmVxdWVzdCBmb3IgdXNlIGluIGNvbnRyb2xsZXJzXHJcbiAgICAgIHJlcXVlc3QudXNlciA9IHtcclxuICAgICAgICBzdWI6IGRlY29kZWQuc3ViLFxyXG4gICAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcclxuICAgICAgICByb2xlczogcm9sZXMsXHJcbiAgICAgICAgZW1haWw6IGRlY29kZWQuZW1haWwsXHJcbiAgICAgICAgdG9rZW5Vc2U6IGRlY29kZWQudG9rZW5fdXNlLFxyXG4gICAgICAgIGNsaWVudElkOiBkZWNvZGVkLmNsaWVudF9pZCxcclxuICAgICAgICBhdWQ6IGRlY29kZWQuYXVkLFxyXG4gICAgICAgIGlzczogZGVjb2RlZC5pc3NcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICBcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcclxuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoYFske21ldGhvZH1dICR7cGF0aH0gLSBUb2tlbiBwcm9jZXNzaW5nIGZhaWxlZDogJHtlcnJvck1lc3NhZ2V9YCk7XHJcbiAgICAgIHRocm93IG5ldyBVbmF1dGhvcml6ZWRFeGNlcHRpb24oJ0ludmFsaWQgdG9rZW4nKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19