import { DataSource } from 'typeorm';
export declare class CloseManifestService {
    private readonly dataSource;
    private readonly logger;
    constructor(dataSource: DataSource);
    /**
     * Ejecuta el proceso real de cierre de manifiesto version final
     * Implementa toda la lógica de consolidación de guías, actualización de estados y workflow
     */
    closeManifest(documentoId: number): Promise<void>;
}
