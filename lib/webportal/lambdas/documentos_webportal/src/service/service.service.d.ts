import { DataSource } from 'typeorm';
export declare class ServiceService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    findAll(): Promise<any>;
    create(name: string): Promise<{
        id: any;
        name: string;
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, name: string): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
