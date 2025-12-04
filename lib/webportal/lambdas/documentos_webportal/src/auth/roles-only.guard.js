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
            console.log('decoded', decoded);
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
            this.logger.error(`[${method}] ${path} - Token processing failed: ${error.message}`);
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
};
exports.RolesOnlyGuard = RolesOnlyGuard;
exports.RolesOnlyGuard = RolesOnlyGuard = RolesOnlyGuard_1 = __decorate([
    (0, common_1.Injectable)()
], RolesOnlyGuard);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sZXMtb25seS5ndWFyZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJvbGVzLW9ubHkuZ3VhcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJDQUEwRztBQUUxRyxrREFBb0M7QUFFdkIsUUFBQSxhQUFhLEdBQUcsVUFBVSxDQUFDO0FBR2pDLElBQU0sY0FBYyxzQkFBcEIsTUFBTSxjQUFjO0lBR3pCLFlBQTZCLFNBQW9CO1FBQXBCLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFGaEMsV0FBTSxHQUFHLElBQUksZUFBTSxDQUFDLGdCQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFTixDQUFDO0lBRXJELFdBQVcsQ0FBQyxPQUF5QjtRQUNuQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDcEQsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUN6QixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBRTlCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksTUFBTSxLQUFLLElBQUksMkJBQTJCLENBQUMsQ0FBQztRQUVoRSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFVLHFCQUFhLEVBQUU7WUFDeEUsT0FBTyxDQUFDLFVBQVUsRUFBRTtZQUNwQixPQUFPLENBQUMsUUFBUSxFQUFFO1NBQ25CLENBQUMsQ0FBQztRQUVILElBQUksUUFBUSxFQUFFLENBQUM7WUFDYixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLE1BQU0sS0FBSyxJQUFJLDRDQUE0QyxDQUFDLENBQUM7WUFDakYsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBRUQsTUFBTSxVQUFVLEdBQXVCLE9BQU8sQ0FBQyxPQUFPLENBQUMsZUFB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QUMsZUFBZSxDQUFDLENBQUM7UUFDbkQsQ0FBQztJQUNILENBQUM7Q0FDRixDQUFBO0FBOUVZLHdDQUFjO3lCQUFkLGNBQWM7SUFEMUIsSUFBQSxtQkFBVSxHQUFFO0dBQ0EsY0FBYyxDQThFMUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDYW5BY3RpdmF0ZSwgRXhlY3V0aW9uQ29udGV4dCwgSW5qZWN0YWJsZSwgVW5hdXRob3JpemVkRXhjZXB0aW9uLCBMb2dnZXIgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IFJlZmxlY3RvciB9IGZyb20gJ0BuZXN0anMvY29yZSc7XHJcbmltcG9ydCAqIGFzIGp3dCBmcm9tICdqc29ud2VidG9rZW4nO1xyXG5cclxuZXhwb3J0IGNvbnN0IElTX1BVQkxJQ19LRVkgPSAnaXNQdWJsaWMnO1xyXG5cclxuQEluamVjdGFibGUoKVxyXG5leHBvcnQgY2xhc3MgUm9sZXNPbmx5R3VhcmQgaW1wbGVtZW50cyBDYW5BY3RpdmF0ZSB7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBsb2dnZXIgPSBuZXcgTG9nZ2VyKFJvbGVzT25seUd1YXJkLm5hbWUpO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHJlZmxlY3RvcjogUmVmbGVjdG9yKSB7fVxyXG5cclxuICBjYW5BY3RpdmF0ZShjb250ZXh0OiBFeGVjdXRpb25Db250ZXh0KTogYm9vbGVhbiB7XHJcbiAgICBjb25zdCByZXF1ZXN0ID0gY29udGV4dC5zd2l0Y2hUb0h0dHAoKS5nZXRSZXF1ZXN0KCk7XHJcbiAgICBjb25zdCBwYXRoID0gcmVxdWVzdC51cmw7XHJcbiAgICBjb25zdCBtZXRob2QgPSByZXF1ZXN0Lm1ldGhvZDtcclxuICAgIFxyXG4gICAgdGhpcy5sb2dnZXIubG9nKGBbJHttZXRob2R9XSAke3BhdGh9IC0gQ2hlY2tpbmcgYXV0aG9yaXphdGlvbmApO1xyXG5cclxuICAgIGNvbnN0IGlzUHVibGljID0gdGhpcy5yZWZsZWN0b3IuZ2V0QWxsQW5kT3ZlcnJpZGU8Ym9vbGVhbj4oSVNfUFVCTElDX0tFWSwgW1xyXG4gICAgICBjb250ZXh0LmdldEhhbmRsZXIoKSxcclxuICAgICAgY29udGV4dC5nZXRDbGFzcygpLFxyXG4gICAgXSk7XHJcbiAgICBcclxuICAgIGlmIChpc1B1YmxpYykge1xyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coYFske21ldGhvZH1dICR7cGF0aH0gLSBQdWJsaWMgZW5kcG9pbnQsIHNraXBwaW5nIGF1dGhvcml6YXRpb25gKTtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYXV0aEhlYWRlcjogc3RyaW5nIHwgdW5kZWZpbmVkID0gcmVxdWVzdC5oZWFkZXJzWydhdXRob3JpemF0aW9uJ107XHJcbiAgICBcclxuICAgIGlmICghYXV0aEhlYWRlciB8fCAhYXV0aEhlYWRlci5zdGFydHNXaXRoKCdCZWFyZXIgJykpIHtcclxuICAgICAgdGhpcy5sb2dnZXIud2FybihgWyR7bWV0aG9kfV0gJHtwYXRofSAtIE1pc3NpbmcgQmVhcmVyIHRva2VuYCk7XHJcbiAgICAgIHRocm93IG5ldyBVbmF1dGhvcml6ZWRFeGNlcHRpb24oJ01pc3NpbmcgQmVhcmVyIHRva2VuJyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNvbnN0IHRva2VuID0gYXV0aEhlYWRlci5zbGljZSgnQmVhcmVyICcubGVuZ3RoKTtcclxuICAgIFxyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gRGVjb2RlIHRva2VuIHdpdGhvdXQgdmVyaWZpY2F0aW9uIChBUEkgR2F0ZXdheSBhbHJlYWR5IHZhbGlkYXRlZCBpdClcclxuICAgICAgY29uc3QgZGVjb2RlZCA9IGp3dC5kZWNvZGUodG9rZW4pIGFzIGFueTtcclxuICAgICAgZGVjb2RlZFsnZ3JvdXBzJ10gPSBbJ2NvdXJpZXJzJ107IC8vIHZhbGlkYXIgeSBxdWl0YXIuXHJcblxyXG4gICAgICBjb25zb2xlLmxvZygnZGVjb2RlZCcsIGRlY29kZWQpO1xyXG4gICAgICBpZiAoIWRlY29kZWQpIHtcclxuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBbJHttZXRob2R9XSAke3BhdGh9IC0gSW52YWxpZCB0b2tlbiBmb3JtYXRgKTtcclxuICAgICAgICB0aHJvdyBuZXcgVW5hdXRob3JpemVkRXhjZXB0aW9uKCdJbnZhbGlkIHRva2VuJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEFkZGl0aW9uYWwgc2VjdXJpdHkgdmFsaWRhdGlvbnNcclxuICAgICAgaWYgKCFkZWNvZGVkLnN1Yikge1xyXG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYFske21ldGhvZH1dICR7cGF0aH0gLSBNaXNzaW5nIHN1YmplY3QgaW4gdG9rZW5gKTtcclxuICAgICAgICB0aHJvdyBuZXcgVW5hdXRob3JpemVkRXhjZXB0aW9uKCdJbnZhbGlkIHRva2VuOiBtaXNzaW5nIHN1YmplY3QnKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgaWYgKGRlY29kZWQudG9rZW5fdHlwZSAhPT0gJ2FjY2VzcycpIHtcclxuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBbJHttZXRob2R9XSAke3BhdGh9IC0gSW52YWxpZCB0b2tlbiB1c2U6ICR7ZGVjb2RlZC50b2tlbl91c2V9YCk7XHJcbiAgICAgICAgdGhyb3cgbmV3IFVuYXV0aG9yaXplZEV4Y2VwdGlvbignSW52YWxpZCB0b2tlbjogbm90IGFuIGFjY2VzcyB0b2tlbicpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBFeHRyYWN0IHJvbGVzIGZyb20gQ29nbml0byB0b2tlbiAtIHRyeSBtdWx0aXBsZSBwb3NzaWJsZSBmaWVsZHNcclxuICAgICAgY29uc3Qgcm9sZXMgPSBkZWNvZGVkWydjb2duaXRvOmdyb3VwcyddIHx8IGRlY29kZWRbJ2dyb3VwcyddIHx8IGRlY29kZWRbJ3JvbGVzJ10gfHwgZGVjb2RlZFsnY29nbml0bzpyb2xlcyddIHx8IFtdO1xyXG4gICAgICBjb25zdCB1c2VybmFtZSA9IGRlY29kZWRbJ2NvZ25pdG86dXNlcm5hbWUnXSB8fCBkZWNvZGVkLnN1YjtcclxuICAgICAgXHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgWyR7bWV0aG9kfV0gJHtwYXRofSAtIFVzZXI6ICR7dXNlcm5hbWV9LCBSb2xlczogWyR7cm9sZXMuam9pbignLCAnKX1dYCk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBBdHRhY2ggdXNlciBpbmZvIHRvIHJlcXVlc3QgZm9yIHVzZSBpbiBjb250cm9sbGVyc1xyXG4gICAgICByZXF1ZXN0LnVzZXIgPSB7XHJcbiAgICAgICAgc3ViOiBkZWNvZGVkLnN1YixcclxuICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXHJcbiAgICAgICAgcm9sZXM6IHJvbGVzLFxyXG4gICAgICAgIGVtYWlsOiBkZWNvZGVkLmVtYWlsLFxyXG4gICAgICAgIHRva2VuVXNlOiBkZWNvZGVkLnRva2VuX3VzZSxcclxuICAgICAgICBjbGllbnRJZDogZGVjb2RlZC5jbGllbnRfaWQsXHJcbiAgICAgICAgYXVkOiBkZWNvZGVkLmF1ZCxcclxuICAgICAgICBpc3M6IGRlY29kZWQuaXNzXHJcbiAgICAgIH07XHJcblxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgXHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBbJHttZXRob2R9XSAke3BhdGh9IC0gVG9rZW4gcHJvY2Vzc2luZyBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gKTtcclxuICAgICAgdGhyb3cgbmV3IFVuYXV0aG9yaXplZEV4Y2VwdGlvbignSW52YWxpZCB0b2tlbicpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=