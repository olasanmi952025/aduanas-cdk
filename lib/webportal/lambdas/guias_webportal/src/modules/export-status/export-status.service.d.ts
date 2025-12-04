import { ConfigService } from "@nestjs/config";
import { AWSConfigService } from "../aws";
import { ExportStatusRecord } from "./interfaces/export.status";
export declare class ExportStatusService {
    private readonly configService;
    private readonly awsConfigService;
    private readonly logger;
    private readonly dynamoDB;
    private readonly tableName;
    constructor(configService: ConfigService, awsConfigService: AWSConfigService);
    /**
     * Obtiene el estado de una exportación por su requestId
     */
    getStatus(requestId: string): Promise<ExportStatusRecord | null>;
}
