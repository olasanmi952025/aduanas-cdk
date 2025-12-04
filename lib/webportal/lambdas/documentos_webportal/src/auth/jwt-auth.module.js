"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const roles_only_guard_1 = require("./roles-only.guard");
const roles_guard_1 = require("./roles.guard");
let JwtAuthModule = class JwtAuthModule {
};
exports.JwtAuthModule = JwtAuthModule;
exports.JwtAuthModule = JwtAuthModule = __decorate([
    (0, common_1.Module)({
        providers: [
            { provide: core_1.APP_GUARD, useClass: roles_only_guard_1.RolesOnlyGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
        ],
    })
], JwtAuthModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiand0LWF1dGgubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiand0LWF1dGgubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLDJDQUF3QztBQUN4Qyx1Q0FBeUM7QUFDekMseURBQW9EO0FBQ3BELCtDQUEyQztBQVFwQyxJQUFNLGFBQWEsR0FBbkIsTUFBTSxhQUFhO0NBQUcsQ0FBQTtBQUFoQixzQ0FBYTt3QkFBYixhQUFhO0lBTnpCLElBQUEsZUFBTSxFQUFDO1FBQ04sU0FBUyxFQUFFO1lBQ1QsRUFBRSxPQUFPLEVBQUUsZ0JBQVMsRUFBRSxRQUFRLEVBQUUsaUNBQWMsRUFBRTtZQUNoRCxFQUFFLE9BQU8sRUFBRSxnQkFBUyxFQUFFLFFBQVEsRUFBRSx3QkFBVSxFQUFFO1NBQzdDO0tBQ0YsQ0FBQztHQUNXLGFBQWEsQ0FBRyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZHVsZSB9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcclxuaW1wb3J0IHsgQVBQX0dVQVJEIH0gZnJvbSAnQG5lc3Rqcy9jb3JlJztcclxuaW1wb3J0IHsgUm9sZXNPbmx5R3VhcmQgfSBmcm9tICcuL3JvbGVzLW9ubHkuZ3VhcmQnO1xyXG5pbXBvcnQgeyBSb2xlc0d1YXJkIH0gZnJvbSAnLi9yb2xlcy5ndWFyZCc7XHJcblxyXG5ATW9kdWxlKHtcclxuICBwcm92aWRlcnM6IFtcclxuICAgIHsgcHJvdmlkZTogQVBQX0dVQVJELCB1c2VDbGFzczogUm9sZXNPbmx5R3VhcmQgfSxcclxuICAgIHsgcHJvdmlkZTogQVBQX0dVQVJELCB1c2VDbGFzczogUm9sZXNHdWFyZCB9LFxyXG4gIF0sXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBKd3RBdXRoTW9kdWxlIHt9XHJcblxyXG5cclxuIl19