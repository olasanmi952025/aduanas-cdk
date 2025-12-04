import { DataSource } from 'typeorm';
export declare class HealthController {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    getHealth(): Promise<{
        status: string;
        timestamp: string;
        database: {
            oracle: {
                connected: boolean;
                info: any;
                error?: undefined;
            };
        };
        environment: string;
    } | {
        status: string;
        timestamp: string;
        database: {
            oracle: {
                connected: boolean;
                error: string;
                info?: undefined;
            };
        };
        environment: string;
    }>;
    getDatabaseHealth(): Promise<{
        connected: boolean;
        database: any;
        timestamp: string;
        error?: undefined;
    } | {
        connected: boolean;
        error: string;
        timestamp: string;
        database?: undefined;
    }>;
    private testConnection;
    private getDatabaseInfo;
}
