import { Repository } from "typeorm";
import { DocDocumentoBase } from "./entities";
import { GuideFiltersDto } from "./dto/guide-filters.dto";
export declare class DocumentsQueryService {
    private readonly documentoBaseRepository;
    private readonly logger;
    constructor(documentoBaseRepository: Repository<DocDocumentoBase>);
    private getSortColumn;
    private buildBaseParams;
    private buildWhereConditions;
    private applyDateFilters;
    private applyLocationFilters;
    private applyMarcaFilters;
    private applyFaltanteSobranteFilters;
    private applyOperationTypeFilters;
    private applyParticipantFilters;
    /**
     * Construye un CTE previo para filtrar por fecha de zarpe eficientemente
     */
    private buildFechaZarpeCTE;
    private buildDocumentosFiltradosCTE;
    private buildCommonCTEs;
    private buildMainQuery;
    private executeMainQuery;
    listGuides(filters: GuideFiltersDto, userId?: number): Promise<any[]>;
    /**
     * Obtiene los números externos de DOCDOCUMENTOBASE para los IDs de guías proporcionados
     * Busca en lote (1 a 20 IDs máximo)
     * @param guideIds - Array de IDs de documentos base (máximo 20)
     * @returns Map con el ID como clave y el número externo como valor
     */
    getExternalNumbersByIds(guideIds: number[]): Promise<Map<number, string>>;
}
