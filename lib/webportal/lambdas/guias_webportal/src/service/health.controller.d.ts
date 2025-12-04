export declare class HealthController {
    constructor();
    getHealth(): Promise<{
        status: string;
        timestamp: string;
        environment: string;
    }>;
}
