"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RolesGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const roles_decorator_1 = require("./roles.decorator");
let RolesGuard = RolesGuard_1 = class RolesGuard {
    constructor(reflector) {
        this.reflector = reflector;
        this.logger = new common_1.Logger(RolesGuard_1.name);
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const path = request.url;
        const method = request.method;
        this.logger.log(`[${method}] ${path} - Checking role authorization`);
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [
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
            throw new common_1.ForbiddenException('User not authenticated');
        }
        // Extract roles from JWT payload
        const userRoles = user.roles || [];
        this.logger.log(`[${method}] ${path} - User roles: ${JSON.stringify(userRoles)}`);
        // Check if user has any of the required roles
        const hasRole = requiredRoles.some((role) => userRoles.includes(role));
        this.logger.log(`[${method}] ${path} - Has required role: ${hasRole}`);
        if (!hasRole) {
            this.logger.warn(`[${method}] ${path} - Access denied. User: ${user.username}, Roles: ${JSON.stringify(userRoles)}, Required: ${JSON.stringify(requiredRoles)}`);
            throw new common_1.ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
        }
        this.logger.log(`[${method}] ${path} - Role authorization successful`);
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = RolesGuard_1 = __decorate([
    (0, common_1.Injectable)()
], RolesGuard);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sZXMuZ3VhcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyb2xlcy5ndWFyZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsMkNBQXVHO0FBRXZHLHVEQUE4QztBQUd2QyxJQUFNLFVBQVUsa0JBQWhCLE1BQU0sVUFBVTtJQUdyQixZQUFvQixTQUFvQjtRQUFwQixjQUFTLEdBQVQsU0FBUyxDQUFXO1FBRnZCLFdBQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxZQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFWCxDQUFDO0lBRTVDLFdBQVcsQ0FBQyxPQUF5QjtRQUNuQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDcEQsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUN6QixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBRTlCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksTUFBTSxLQUFLLElBQUksZ0NBQWdDLENBQUMsQ0FBQztRQUVyRSxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFXLDJCQUFTLEVBQUU7WUFDMUUsT0FBTyxDQUFDLFVBQVUsRUFBRTtZQUNwQixPQUFPLENBQUMsUUFBUSxFQUFFO1NBQ25CLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNuQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLE1BQU0sS0FBSyxJQUFJLHNDQUFzQyxDQUFDLENBQUM7WUFDM0UsT0FBTyxJQUFJLENBQUMsQ0FBQyxvQkFBb0I7UUFDbkMsQ0FBQztRQUVELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksTUFBTSxLQUFLLElBQUksc0JBQXNCLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRTFGLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDMUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxNQUFNLEtBQUssSUFBSSxtQkFBbUIsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFFdEYsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxNQUFNLEtBQUssSUFBSSwyQkFBMkIsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sSUFBSSwyQkFBa0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFFRCxpQ0FBaUM7UUFDakMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7UUFDbkMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxNQUFNLEtBQUssSUFBSSxrQkFBa0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFbEYsOENBQThDO1FBQzlDLE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN2RSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLE1BQU0sS0FBSyxJQUFJLHlCQUF5QixPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBRXZFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNiLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxLQUFLLElBQUksMkJBQTJCLElBQUksQ0FBQyxRQUFRLFlBQVksSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsZUFBZSxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNqSyxNQUFNLElBQUksMkJBQWtCLENBQUMsa0NBQWtDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzdGLENBQUM7UUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLE1BQU0sS0FBSyxJQUFJLGtDQUFrQyxDQUFDLENBQUM7UUFDdkUsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQ0YsQ0FBQTtBQWhEWSxnQ0FBVTtxQkFBVixVQUFVO0lBRHRCLElBQUEsbUJBQVUsR0FBRTtHQUNBLFVBQVUsQ0FnRHRCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgQ2FuQWN0aXZhdGUsIEV4ZWN1dGlvbkNvbnRleHQsIEZvcmJpZGRlbkV4Y2VwdGlvbiwgTG9nZ2VyIH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xyXG5pbXBvcnQgeyBSZWZsZWN0b3IgfSBmcm9tICdAbmVzdGpzL2NvcmUnO1xyXG5pbXBvcnQgeyBST0xFU19LRVkgfSBmcm9tICcuL3JvbGVzLmRlY29yYXRvcic7XHJcblxyXG5ASW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBSb2xlc0d1YXJkIGltcGxlbWVudHMgQ2FuQWN0aXZhdGUge1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgbG9nZ2VyID0gbmV3IExvZ2dlcihSb2xlc0d1YXJkLm5hbWUpO1xyXG4gIFxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmbGVjdG9yOiBSZWZsZWN0b3IpIHt9XHJcblxyXG4gIGNhbkFjdGl2YXRlKGNvbnRleHQ6IEV4ZWN1dGlvbkNvbnRleHQpOiBib29sZWFuIHtcclxuICAgIGNvbnN0IHJlcXVlc3QgPSBjb250ZXh0LnN3aXRjaFRvSHR0cCgpLmdldFJlcXVlc3QoKTtcclxuICAgIGNvbnN0IHBhdGggPSByZXF1ZXN0LnVybDtcclxuICAgIGNvbnN0IG1ldGhvZCA9IHJlcXVlc3QubWV0aG9kO1xyXG4gICAgXHJcbiAgICB0aGlzLmxvZ2dlci5sb2coYFske21ldGhvZH1dICR7cGF0aH0gLSBDaGVja2luZyByb2xlIGF1dGhvcml6YXRpb25gKTtcclxuXHJcbiAgICBjb25zdCByZXF1aXJlZFJvbGVzID0gdGhpcy5yZWZsZWN0b3IuZ2V0QWxsQW5kT3ZlcnJpZGU8c3RyaW5nW10+KFJPTEVTX0tFWSwgW1xyXG4gICAgICBjb250ZXh0LmdldEhhbmRsZXIoKSxcclxuICAgICAgY29udGV4dC5nZXRDbGFzcygpLFxyXG4gICAgXSk7XHJcblxyXG4gICAgaWYgKCFyZXF1aXJlZFJvbGVzKSB7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgWyR7bWV0aG9kfV0gJHtwYXRofSAtIE5vIHJvbGVzIHJlcXVpcmVkLCBhY2Nlc3MgZ3JhbnRlZGApO1xyXG4gICAgICByZXR1cm4gdHJ1ZTsgLy8gTm8gcm9sZXMgcmVxdWlyZWRcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmxvZ2dlci5sb2coYFske21ldGhvZH1dICR7cGF0aH0gLSBSZXF1aXJlZCByb2xlczogJHtKU09OLnN0cmluZ2lmeShyZXF1aXJlZFJvbGVzKX1gKTtcclxuXHJcbiAgICBjb25zdCB1c2VyID0gcmVxdWVzdC51c2VyO1xyXG4gICAgdGhpcy5sb2dnZXIubG9nKGBbJHttZXRob2R9XSAke3BhdGh9IC0gVXNlciBvYmplY3Q6ICR7dXNlciA/ICdQcmVzZW50JyA6ICdNaXNzaW5nJ31gKTtcclxuXHJcbiAgICBpZiAoIXVzZXIpIHtcclxuICAgICAgdGhpcy5sb2dnZXIud2FybihgWyR7bWV0aG9kfV0gJHtwYXRofSAtIFVzZXIgbm90IGF1dGhlbnRpY2F0ZWRgKTtcclxuICAgICAgdGhyb3cgbmV3IEZvcmJpZGRlbkV4Y2VwdGlvbignVXNlciBub3QgYXV0aGVudGljYXRlZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEV4dHJhY3Qgcm9sZXMgZnJvbSBKV1QgcGF5bG9hZFxyXG4gICAgY29uc3QgdXNlclJvbGVzID0gdXNlci5yb2xlcyB8fCBbXTtcclxuICAgIHRoaXMubG9nZ2VyLmxvZyhgWyR7bWV0aG9kfV0gJHtwYXRofSAtIFVzZXIgcm9sZXM6ICR7SlNPTi5zdHJpbmdpZnkodXNlclJvbGVzKX1gKTtcclxuICAgIFxyXG4gICAgLy8gQ2hlY2sgaWYgdXNlciBoYXMgYW55IG9mIHRoZSByZXF1aXJlZCByb2xlc1xyXG4gICAgY29uc3QgaGFzUm9sZSA9IHJlcXVpcmVkUm9sZXMuc29tZSgocm9sZSkgPT4gdXNlclJvbGVzLmluY2x1ZGVzKHJvbGUpKTtcclxuICAgIHRoaXMubG9nZ2VyLmxvZyhgWyR7bWV0aG9kfV0gJHtwYXRofSAtIEhhcyByZXF1aXJlZCByb2xlOiAke2hhc1JvbGV9YCk7XHJcbiAgICBcclxuICAgIGlmICghaGFzUm9sZSkge1xyXG4gICAgICB0aGlzLmxvZ2dlci53YXJuKGBbJHttZXRob2R9XSAke3BhdGh9IC0gQWNjZXNzIGRlbmllZC4gVXNlcjogJHt1c2VyLnVzZXJuYW1lfSwgUm9sZXM6ICR7SlNPTi5zdHJpbmdpZnkodXNlclJvbGVzKX0sIFJlcXVpcmVkOiAke0pTT04uc3RyaW5naWZ5KHJlcXVpcmVkUm9sZXMpfWApO1xyXG4gICAgICB0aHJvdyBuZXcgRm9yYmlkZGVuRXhjZXB0aW9uKGBBY2Nlc3MgZGVuaWVkLiBSZXF1aXJlZCByb2xlczogJHtyZXF1aXJlZFJvbGVzLmpvaW4oJywgJyl9YCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5sb2dnZXIubG9nKGBbJHttZXRob2R9XSAke3BhdGh9IC0gUm9sZSBhdXRob3JpemF0aW9uIHN1Y2Nlc3NmdWxgKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxufVxyXG4iXX0=