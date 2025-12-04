import { Repository } from "typeorm";
import { DocDocumentoBase } from "./entities";
import { GuideFiltersDto } from "./dto/guide-filters.dto";
import { ICacheService } from "../../shared/cache";
export declare class DocumentsService {
    private readonly cacheService;
    private readonly documentoBaseRepository;
    private readonly CACHE_TTL;
    constructor(cacheService: ICacheService, documentoBaseRepository: Repository<DocDocumentoBase>);
    /**
     * Obtiene la columna de ordenamiento para la consulta
     * @param sort
     * @returns
     */
    private getSortColumn;
    private generateCacheKey;
    /**
     * Construye los parámetros base para la consulta
     * @param offset
     * @param limit
     * @returns
     */
    private buildBaseParams;
    /**
     * Construye las condiciones WHERE para la consulta
     * @param filters
     * @param params
     * @param joins
     * @returns objeto con where y si usa fecha zarpe CTE
     */
    private buildWhereConditions;
    /**
     * Aplica los filtros de fecha a la consulta
     * @param filters
     * @param where
     * @param joins
     * @param params
     * @returns true si es filtro de fecha zarpe (se manejará con CTE separado)
     */
    private applyDateFilters;
    /**
     * Aplica los filtros de locación a la consulta
     * @param filters
     * @param where
     * @param joins
     * @param params
     */
    private applyLocationFilters;
    /**
     * Aplica los filtros de marcas a la consulta
     * @param filters
     * @param where
     * @param joins
     * @param params
     */
    private applyMarcaFilters;
    /**
     * Aplica los filtros de faltante/sobrante a la consulta
     * @param filters
     * @param where
     * @param joins
     * @param params
     */
    private applyFaltanteSobranteFilters;
    /**
     * Aplica los filtros de participante a la consulta
     * @param filters
     * @param where
     * @param joins
     * @param params
     */
    private applyParticipantFilters;
    /**
     * Aplica los filtros de tipo de operación a la consulta
     * @param filters
     * @param where
     * @param joins
     * @param params
     */
    private applyOperationTypeFilters;
    /**
     * Construye un CTE previo para filtrar por fecha de zarpe eficientemente
     * @param filters
     * @param params
     * @returns
     */
    private buildFechaZarpeCTE;
    /**
     * Construye el CTE para la consulta de documentos filtrados
     * @param where
     * @param joins
     * @param hasFechaZarpeCTE Indica si existe el CTE previo de fecha zarpe
     * @returns
     */
    private buildDocumentosFiltradosCTE;
    /**
     * Construye los CTE comunes para la consulta
     * @param needsManifiestos Indica si se necesitan los manifiestos relacionados
     * @param hasStatusFilter Indica si hay filtro de estado
     * @returns
     */
    private buildCommonCTEs;
    /**
     * Construye CTEs opcionales para datos adicionales (solo cuando se necesitan)
     * @returns
     */
    private buildOptionalCTEs;
    /**
     * Construye la consulta principal para la consulta de documentos filtrados
     * @param fechaZarpeCTE CTE previo para filtrar por fecha zarpe (puede estar vacío)
     * @param documentosFiltradosCTE
     * @param sortColumn
     * @param order
     * @param hasStatusFilter
     * @param needsManifiestos
     * @returns
     */
    private buildMainQuery;
    /**
     * Construye la consulta para contar los documentos filtrados
     * @param fechaZarpeCTE CTE previo para filtrar por fecha zarpe (puede estar vacío)
     * @param documentosFiltradosCTE
     * @param hasStatusFilter
     * @returns
     */
    private buildCountQuery;
    /**
     * Ejecuta las consultas principales y de conteo
     * @param mainQuery
     * @param countQuery
     * @param params
     * @param offset
     * @param limit
     * @param cacheKey
     * @returns
     */
    private executeQueries;
    /**
     * Ejecuta la consulta para contar los documentos filtrados
     * @param driver
     * @param countQuery
     * @param params
     * @returns
     */
    private executeCountQuery;
    private executeMainQuery;
    /**
     * Obtiene las guías filtradas
     * @param filters
     * @param userId
     * @returns
     */
    listGuides(filters: GuideFiltersDto, userId?: number): Promise<import("../../shared").ApiResponseDto<{
        guides: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>>;
}
