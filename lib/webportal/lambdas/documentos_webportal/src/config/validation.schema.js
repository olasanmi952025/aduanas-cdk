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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationSchema = void 0;
const Joi = __importStar(require("joi"));
exports.validationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),
    ORACLE_HOST: Joi.string().optional(),
    ORACLE_PORT: Joi.number().default(1521),
    ORACLE_DATABASE: Joi.string().optional(),
    ORACLE_SID: Joi.string().optional(),
    ORACLE_USERNAME: Joi.string().optional(),
    ORACLE_PASSWORD: Joi.string().optional(),
    ORACLE_CLIENT_LIB_DIR: Joi.string().optional(),
    DB_HOST: Joi.string().optional(),
    DB_PORT: Joi.number().optional(),
    DB_DATABASE: Joi.string().optional(),
    DB_SID: Joi.string().optional(),
    DB_USERNAME: Joi.string().optional(),
    DB_PASSWORD: Joi.string().optional(),
    LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
    API_PORT: Joi.number().default(3000),
    API_HOST: Joi.string().default('0.0.0.0'),
    JWT_PUBLIC_KEY: Joi.string().allow('').optional(), // Public key for custom JWT validation
    CORS_ORIGIN: Joi.string().default('*'),
    // Cognito configuration
    COGNITO_JWKS_URI: Joi.string().optional(),
    COGNITO_ISSUER: Joi.string().optional(),
    COGNITO_CLIENT_ID: Joi.string().optional(),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbi5zY2hlbWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ2YWxpZGF0aW9uLnNjaGVtYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx5Q0FBMkI7QUFFZCxRQUFBLGdCQUFnQixHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7SUFDekMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO0lBQ3hGLElBQUksRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztJQUNoQyxXQUFXLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUNwQyxXQUFXLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7SUFDdkMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDeEMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDbkMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDeEMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDeEMscUJBQXFCLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUM5QyxPQUFPLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUNoQyxPQUFPLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUNoQyxXQUFXLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUNwQyxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUMvQixXQUFXLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUNwQyxXQUFXLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUNwQyxTQUFTLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO0lBQy9FLFFBQVEsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztJQUNwQyxRQUFRLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7SUFDekMsY0FBYyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsdUNBQXVDO0lBQzFGLFdBQVcsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztJQUN0Qyx3QkFBd0I7SUFDeEIsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUN6QyxjQUFjLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUN2QyxpQkFBaUIsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0NBQzNDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIEpvaSBmcm9tICdqb2knO1xyXG5cclxuZXhwb3J0IGNvbnN0IHZhbGlkYXRpb25TY2hlbWEgPSBKb2kub2JqZWN0KHtcclxuICBOT0RFX0VOVjogSm9pLnN0cmluZygpLnZhbGlkKCdkZXZlbG9wbWVudCcsICdwcm9kdWN0aW9uJywgJ3Rlc3QnKS5kZWZhdWx0KCdkZXZlbG9wbWVudCcpLFxyXG4gIFBPUlQ6IEpvaS5udW1iZXIoKS5kZWZhdWx0KDMwMDApLFxyXG4gIE9SQUNMRV9IT1NUOiBKb2kuc3RyaW5nKCkub3B0aW9uYWwoKSxcclxuICBPUkFDTEVfUE9SVDogSm9pLm51bWJlcigpLmRlZmF1bHQoMTUyMSksXHJcbiAgT1JBQ0xFX0RBVEFCQVNFOiBKb2kuc3RyaW5nKCkub3B0aW9uYWwoKSxcclxuICBPUkFDTEVfU0lEOiBKb2kuc3RyaW5nKCkub3B0aW9uYWwoKSxcclxuICBPUkFDTEVfVVNFUk5BTUU6IEpvaS5zdHJpbmcoKS5vcHRpb25hbCgpLFxyXG4gIE9SQUNMRV9QQVNTV09SRDogSm9pLnN0cmluZygpLm9wdGlvbmFsKCksXHJcbiAgT1JBQ0xFX0NMSUVOVF9MSUJfRElSOiBKb2kuc3RyaW5nKCkub3B0aW9uYWwoKSxcclxuICBEQl9IT1NUOiBKb2kuc3RyaW5nKCkub3B0aW9uYWwoKSxcclxuICBEQl9QT1JUOiBKb2kubnVtYmVyKCkub3B0aW9uYWwoKSxcclxuICBEQl9EQVRBQkFTRTogSm9pLnN0cmluZygpLm9wdGlvbmFsKCksXHJcbiAgREJfU0lEOiBKb2kuc3RyaW5nKCkub3B0aW9uYWwoKSxcclxuICBEQl9VU0VSTkFNRTogSm9pLnN0cmluZygpLm9wdGlvbmFsKCksXHJcbiAgREJfUEFTU1dPUkQ6IEpvaS5zdHJpbmcoKS5vcHRpb25hbCgpLFxyXG4gIExPR19MRVZFTDogSm9pLnN0cmluZygpLnZhbGlkKCdkZWJ1ZycsICdpbmZvJywgJ3dhcm4nLCAnZXJyb3InKS5kZWZhdWx0KCdpbmZvJyksXHJcbiAgQVBJX1BPUlQ6IEpvaS5udW1iZXIoKS5kZWZhdWx0KDMwMDApLFxyXG4gIEFQSV9IT1NUOiBKb2kuc3RyaW5nKCkuZGVmYXVsdCgnMC4wLjAuMCcpLFxyXG4gIEpXVF9QVUJMSUNfS0VZOiBKb2kuc3RyaW5nKCkuYWxsb3coJycpLm9wdGlvbmFsKCksIC8vIFB1YmxpYyBrZXkgZm9yIGN1c3RvbSBKV1QgdmFsaWRhdGlvblxyXG4gIENPUlNfT1JJR0lOOiBKb2kuc3RyaW5nKCkuZGVmYXVsdCgnKicpLFxyXG4gIC8vIENvZ25pdG8gY29uZmlndXJhdGlvblxyXG4gIENPR05JVE9fSldLU19VUkk6IEpvaS5zdHJpbmcoKS5vcHRpb25hbCgpLFxyXG4gIENPR05JVE9fSVNTVUVSOiBKb2kuc3RyaW5nKCkub3B0aW9uYWwoKSxcclxuICBDT0dOSVRPX0NMSUVOVF9JRDogSm9pLnN0cmluZygpLm9wdGlvbmFsKCksXHJcbn0pO1xyXG5cclxuXHJcbiJdfQ==