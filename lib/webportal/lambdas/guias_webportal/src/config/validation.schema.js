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
    // Oracle Database configuration
    ORACLE_HOST: Joi.string().required(),
    ORACLE_PORT: Joi.number().default(1521),
    ORACLE_DATABASE: Joi.string().required(),
    ORACLE_SID: Joi.string().required(),
    ORACLE_USERNAME: Joi.string().required(),
    ORACLE_PASSWORD: Joi.string().required(),
    ORACLE_CLIENT_LIB_DIR: Joi.string().optional(),
    LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
    API_PORT: Joi.number().default(3000),
    API_HOST: Joi.string().default('0.0.0.0'),
    JWT_PUBLIC_KEY: Joi.string().allow('').optional(), // Public key for custom JWT validation
    CORS_ORIGIN: Joi.string().default('*'),
    // Cognito configuration
    COGNITO_JWKS_URI: Joi.string().optional(),
    COGNITO_ISSUER: Joi.string().optional(),
    COGNITO_CLIENT_ID: Joi.string().optional(),
    // AWS configuration
    AWS_REGION: Joi.string().default('us-east-1'),
    AWS_ACCESS_KEY_ID: Joi.string().optional(),
    AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
    // SQS configuration
    SQS_QUEUE_URL: Joi.string().optional(),
    // S3 configuration
    S3_BUCKET_NAME: Joi.string().default('pweb-ms-guias-exports'),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbi5zY2hlbWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ2YWxpZGF0aW9uLnNjaGVtYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx5Q0FBMkI7QUFFZCxRQUFBLGdCQUFnQixHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7SUFDekMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO0lBQ3hGLElBQUksRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztJQUNoQyxnQ0FBZ0M7SUFDaEMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDcEMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0lBQ3ZDLGVBQWUsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3hDLFVBQVUsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ25DLGVBQWUsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3hDLGVBQWUsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3hDLHFCQUFxQixFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDOUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztJQUMvRSxRQUFRLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7SUFDcEMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO0lBQ3pDLGNBQWMsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLHVDQUF1QztJQUMxRixXQUFXLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7SUFDdEMsd0JBQXdCO0lBQ3hCLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDekMsY0FBYyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDdkMsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUMxQyxvQkFBb0I7SUFDcEIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDO0lBQzdDLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDMUMscUJBQXFCLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUM5QyxvQkFBb0I7SUFDcEIsYUFBYSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDdEMsbUJBQW1CO0lBQ25CLGNBQWMsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLHVCQUF1QixDQUFDO0NBQzlELENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIEpvaSBmcm9tICdqb2knO1xyXG5cclxuZXhwb3J0IGNvbnN0IHZhbGlkYXRpb25TY2hlbWEgPSBKb2kub2JqZWN0KHtcclxuICBOT0RFX0VOVjogSm9pLnN0cmluZygpLnZhbGlkKCdkZXZlbG9wbWVudCcsICdwcm9kdWN0aW9uJywgJ3Rlc3QnKS5kZWZhdWx0KCdkZXZlbG9wbWVudCcpLFxyXG4gIFBPUlQ6IEpvaS5udW1iZXIoKS5kZWZhdWx0KDMwMDApLFxyXG4gIC8vIE9yYWNsZSBEYXRhYmFzZSBjb25maWd1cmF0aW9uXHJcbiAgT1JBQ0xFX0hPU1Q6IEpvaS5zdHJpbmcoKS5yZXF1aXJlZCgpLFxyXG4gIE9SQUNMRV9QT1JUOiBKb2kubnVtYmVyKCkuZGVmYXVsdCgxNTIxKSxcclxuICBPUkFDTEVfREFUQUJBU0U6IEpvaS5zdHJpbmcoKS5yZXF1aXJlZCgpLFxyXG4gIE9SQUNMRV9TSUQ6IEpvaS5zdHJpbmcoKS5yZXF1aXJlZCgpLFxyXG4gIE9SQUNMRV9VU0VSTkFNRTogSm9pLnN0cmluZygpLnJlcXVpcmVkKCksXHJcbiAgT1JBQ0xFX1BBU1NXT1JEOiBKb2kuc3RyaW5nKCkucmVxdWlyZWQoKSxcclxuICBPUkFDTEVfQ0xJRU5UX0xJQl9ESVI6IEpvaS5zdHJpbmcoKS5vcHRpb25hbCgpLFxyXG4gIExPR19MRVZFTDogSm9pLnN0cmluZygpLnZhbGlkKCdkZWJ1ZycsICdpbmZvJywgJ3dhcm4nLCAnZXJyb3InKS5kZWZhdWx0KCdpbmZvJyksXHJcbiAgQVBJX1BPUlQ6IEpvaS5udW1iZXIoKS5kZWZhdWx0KDMwMDApLFxyXG4gIEFQSV9IT1NUOiBKb2kuc3RyaW5nKCkuZGVmYXVsdCgnMC4wLjAuMCcpLFxyXG4gIEpXVF9QVUJMSUNfS0VZOiBKb2kuc3RyaW5nKCkuYWxsb3coJycpLm9wdGlvbmFsKCksIC8vIFB1YmxpYyBrZXkgZm9yIGN1c3RvbSBKV1QgdmFsaWRhdGlvblxyXG4gIENPUlNfT1JJR0lOOiBKb2kuc3RyaW5nKCkuZGVmYXVsdCgnKicpLFxyXG4gIC8vIENvZ25pdG8gY29uZmlndXJhdGlvblxyXG4gIENPR05JVE9fSldLU19VUkk6IEpvaS5zdHJpbmcoKS5vcHRpb25hbCgpLFxyXG4gIENPR05JVE9fSVNTVUVSOiBKb2kuc3RyaW5nKCkub3B0aW9uYWwoKSxcclxuICBDT0dOSVRPX0NMSUVOVF9JRDogSm9pLnN0cmluZygpLm9wdGlvbmFsKCksXHJcbiAgLy8gQVdTIGNvbmZpZ3VyYXRpb25cclxuICBBV1NfUkVHSU9OOiBKb2kuc3RyaW5nKCkuZGVmYXVsdCgndXMtZWFzdC0xJyksXHJcbiAgQVdTX0FDQ0VTU19LRVlfSUQ6IEpvaS5zdHJpbmcoKS5vcHRpb25hbCgpLFxyXG4gIEFXU19TRUNSRVRfQUNDRVNTX0tFWTogSm9pLnN0cmluZygpLm9wdGlvbmFsKCksXHJcbiAgLy8gU1FTIGNvbmZpZ3VyYXRpb25cclxuICBTUVNfUVVFVUVfVVJMOiBKb2kuc3RyaW5nKCkub3B0aW9uYWwoKSxcclxuICAvLyBTMyBjb25maWd1cmF0aW9uXHJcbiAgUzNfQlVDS0VUX05BTUU6IEpvaS5zdHJpbmcoKS5kZWZhdWx0KCdwd2ViLW1zLWd1aWFzLWV4cG9ydHMnKSxcclxufSk7XHJcblxyXG5cclxuIl19