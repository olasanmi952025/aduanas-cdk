/**
 * Entidad para mapear documentoId -> jobId del polling_process
 * Permite consultar el estado de un proceso por documentoId
 */
export declare class ManifestJobMapping {
    documentoId: number;
    jobId: string;
    processType: string;
    createdAt: Date;
    status?: string;
}
