import { ServiceService } from './service.service';
export declare class ServiceController {
    private readonly service;
    constructor(service: ServiceService);
    publicEndpoint(): {
        message: string;
    };
    findAll(): Promise<any>;
    create(body: {
        name: string;
    }): Promise<{
        id: any;
        name: string;
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, body: {
        name: string;
    }): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
