import { Repository } from "typeorm";
import { DocDocumentoBase } from "./entities";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable, Inject } from "@nestjs/common";
import { DateUtil } from "../../shared/utils/date.util";
import { GuideFiltersDto } from "./dto/guide-filters.dto";
import { ResponseUtil } from "../../shared/utils/response.util";
import { ICacheService, CACHE_SERVICE } from "../../shared/cache";

@Injectable()
export class DocumentsService {
  // TTL del cache en milisegundos (5 minutos)
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor(
    @Inject(CACHE_SERVICE)
    private readonly cacheService: ICacheService,
    @InjectRepository(DocDocumentoBase)
    private readonly documentoBaseRepository: Repository<DocDocumentoBase>,
  ) {}

  /**
   * Obtiene la columna de ordenamiento para la consulta
   * @param sort 
   * @returns 
   */
  private getSortColumn(sort: string): string {
    const sortColumnMap: Record<string, string> = {
      'fechaCreacion': 'FECHACREACION',
      'fechaEmision': 'FECHAEMISION',
      'numeroExterno': 'NUMEROEXTERNO',
      'numeroAceptacion': 'NUMEROACEPTACION',
      'estado': 'ESTADO',
      'consignatario': 'CONSIGNATARIO',
      'totalPeso': 'TOTALPESO',
      'cantTotal': 'CANTTOTAL',
      'motivoMarca': 'MOTIVOMARCA',
      'falta': 'FALTA',
      'sobra': 'SOBRA',
      'nroDIPS': 'NRODIPS',
      'fechaDIPS': 'FECHADIPS',
      'tieneDIN': 'TIENEDIN',
      'id': 'ID',
    };
    return sortColumnMap[sort] || 'FECHACREACION';
  }


  private generateCacheKey(filters: GuideFiltersDto, hasStatusFilter: boolean): string {
    const cacheFilters: Record<string, any> = {};
    // Agregar filtros relevantes (sin paginación ni ordenamiento)
    if (filters?.guideNumber) cacheFilters.guideNumber = String(filters.guideNumber).trim();
    if (filters?.manifestNumber) cacheFilters.manifestNumber = String(filters.manifestNumber).trim();
    if (filters?.from) cacheFilters.from = DateUtil.createUTCDate(filters.from).toISOString();
    if (filters?.to) cacheFilters.to = DateUtil.createUTCDate(filters.to).toISOString();
    if (filters?.dateType) cacheFilters.dateType = String(filters.dateType);
    if (filters?.status) cacheFilters.status = String(filters.status);
    if (filters?.locationType) cacheFilters.locationType = String(filters.locationType);
    if (filters?.location) cacheFilters.location = String(filters.location).trim();
    if (filters?.participantType) cacheFilters.participantType = String(filters.participantType);
    if (filters?.participant) cacheFilters.participant = String(filters.participant).trim();
    if (filters?.operationType) cacheFilters.operationType = String(filters.operationType).trim();
    if (filters?.isSimplified !== undefined) cacheFilters.isSimplified = filters.isSimplified;
    if (filters?.marcas) cacheFilters.marcas = String(filters.marcas).trim();
    if (filters?.faltanteSobrante) cacheFilters.faltanteSobrante = String(filters.faltanteSobrante).trim();
    if (filters?.userId) cacheFilters.userId = Number(filters.userId);

    return this.cacheService.generateKey(cacheFilters);
  }

  /**
   * Construye los parámetros base para la consulta
   * @param offset 
   * @param limit 
   * @returns 
   */
  private buildBaseParams(offset: number, limit: number): Record<string, any> {
    return {
      tipoDocumento: 'GTIME',
      activo: 'S',
      tipoDocumentoEstado: 'GTIME',
      activaEstado: 'S',
      offsetLimit: offset + limit,
      offset: offset,
    };
  }

  /**
   * Construye las condiciones WHERE para la consulta
   * @param filters 
   * @param params 
   * @param joins 
   * @returns objeto con where y si usa fecha zarpe CTE
   */
  private buildWhereConditions(
    filters: GuideFiltersDto,
    params: Record<string, any>,
    joins: string[]
  ): { where: string[]; hasFechaZarpeCTE: boolean } {
    const where: string[] = [];
    let hasFechaZarpeCTE = false;
    
    if (filters?.guideNumber) {
      where.push('dd.NUMEROEXTERNO = :guideNumber');
      params.guideNumber = String(filters.guideNumber).trim();
      where.push('dd.TIPODOCUMENTO = :tipoDocumento');
      where.push("dd.ACTIVO = 'S'");
      if (filters?.userId) {
        where.push('dd.IDEMISOR = :userId');
        params.userId = Number(filters.userId);
      }
      return { where, hasFechaZarpeCTE };
    }

    // Filtros base siempre presentes
    where.push('dd.TIPODOCUMENTO = :tipoDocumento');
    where.push("dd.ACTIVO = 'S'");

    // Filtro de userId temprano para mejor rendimiento
    if (filters?.userId) {
      where.push('dd.IDEMISOR = :userId');
      params.userId = Number(filters.userId);
    }

    if (filters?.manifestNumber) {
      where.push('dd.NUMEROACEPTACION = :manifestNumber');
      params.manifestNumber = String(filters.manifestNumber).trim();

      // Si hay manifestNumber y está en modo simplificado, permitir filtrar por fecha
      if (filters?.isSimplified === true) {
        hasFechaZarpeCTE = this.applyDateFilters(filters, where, joins, params);
      }
    }
    
    if (!filters?.manifestNumber) {
      hasFechaZarpeCTE = this.applyDateFilters(filters, where, joins, params);
    }

    this.applyLocationFilters(filters, where, joins, params);

    this.applyParticipantFilters(filters, where, joins, params);

    this.applyOperationTypeFilters(filters, where, joins, params);

    this.applyMarcaFilters(filters, where, joins, params);

    this.applyFaltanteSobranteFilters(filters, where, joins, params);

    return { where, hasFechaZarpeCTE };
  }

  /**
   * Aplica los filtros de fecha a la consulta
   * @param filters
   * @param where 
   * @param joins 
   * @param params 
   * @returns true si es filtro de fecha zarpe (se manejará con CTE separado)
   */
  private applyDateFilters(
    filters: GuideFiltersDto,
    where: string[],
    joins: string[],
    params: Record<string, any>
  ): boolean {
    if (!filters?.dateType && !filters?.from && !filters?.to) return false;

    let columnaFecha = 'dd.FECHAEMISION';
    let dateType = filters?.dateType;
    if (!dateType && (filters?.from || filters?.to)) {
      dateType = 'FEM';
    }
    
    let isFechaZarpe = false;
    
    if (dateType) {
      const dateTypeUpper = String(dateType).toUpperCase();
      if (dateTypeUpper === 'FECREACION' || dateTypeUpper === 'FECACEPTA') {
        columnaFecha = 'dd.FECHACREACION';
      } else if (dateTypeUpper === 'FEM') {
        columnaFecha = 'dd.FECHAEMISION';
      } else {
        // Es fecha de zarpe - se manejará con CTE separado para máxima eficiencia
        // NO agregar filtros aquí, el CTE previo ya habrá filtrado los documentos
        isFechaZarpe = true;
        if (filters?.from && filters?.to) {
          const fromDate = DateUtil.createUTCDate(filters.from);
          const fromDateStr = DateUtil.formatDateForOracle(fromDate);
          const toDate = DateUtil.createUTCDate(filters.to);
          const toDateStr = DateUtil.formatDateForOracle(toDate);
          params.fechaFrom = `${fromDateStr} 00:00:00`;
          params.fechaTo = `${toDateStr} 23:59:59`;
          return true; // Indicar que es fecha zarpe para usar CTE
        }
      }
    }

    // Para fechas que NO son zarpe, aplicar filtros normalmente
    if (!isFechaZarpe && filters?.from && filters?.to) {
      const fromDate = DateUtil.createUTCDate(filters.from);
      const fromDateStr = DateUtil.formatDateForOracle(fromDate);
      where.push(`${columnaFecha} >= TO_DATE(:fechaFrom, 'DD/MM/YYYY HH24:MI:SS')`);
      params.fechaFrom = `${fromDateStr} 00:00:00`;

      const toDate = DateUtil.createUTCDate(filters.to);
      const toDateStr = DateUtil.formatDateForOracle(toDate);
      where.push(`${columnaFecha} <= TO_DATE(:fechaTo, 'DD/MM/YYYY HH24:MI:SS')`);
      params.fechaTo = `${toDateStr} 23:59:59`;
    }

    return isFechaZarpe;
  }

  /**
   * Aplica los filtros de locación a la consulta
   * @param filters 
   * @param where 
   * @param joins 
   * @param params 
   */
  private applyLocationFilters(
    filters: GuideFiltersDto,
    where: string[],
    joins: string[],
    params: Record<string, any>
  ): void {
    if (filters?.locationType || filters?.location) {
      const hasLocationJoin = joins.some(join => join.includes('DOCLOCACIONDOCUMENTO'));
      
      if (!hasLocationJoin) {
        joins.push('JOIN DOCUMENTOS.DOCLOCACIONDOCUMENTO dld ON dld.DOCUMENTO = dd.ID');
      }

      if (filters?.locationType) {
        where.push('dld.TIPOLOCACION = :tipoLocacion');
        params.tipoLocacion = String(filters.locationType);
      }

      if (filters?.location) {
        where.push('dld.IDLOCACION = :idLocacion');
        params.idLocacion = Number(filters.location);
      }
    }
  }

  /**
   * Aplica los filtros de marcas a la consulta
   * @param filters 
   * @param where 
   * @param joins 
   * @param params 
   */
  private applyMarcaFilters(
    filters: GuideFiltersDto,
    where: string[],
    joins: string[],
    params: Record<string, any>
  ): void {
    if (filters?.marcas && filters.marcas.trim() !== '' && filters.marcas.toUpperCase() !== 'TODOS') {
      const hasMarcaJoin = joins.some(join => join.includes('OpFiscMarca'));
      
      if (!hasMarcaJoin) {
        // Filtrar por código específico de motivo de selección
        joins.push('JOIN FISCALIZACIONES.OPFISCMARCA ofm ON ofm.IdDocumento = dd.ID AND ofm.Activa = \'S\' AND ofm.CodigoOpFiscMotivoMarca = :codigoMarca');
        params.codigoMarca = filters.marcas.toUpperCase();
      }
    }
  }

  /**
   * Aplica los filtros de faltante/sobrante a la consulta
   * @param filters 
   * @param where 
   * @param joins 
   * @param params 
   */
  private applyFaltanteSobranteFilters(
    filters: GuideFiltersDto,
    where: string[],
    joins: string[],
    params: Record<string, any>
  ): void {
    if (filters?.faltanteSobrante && filters.faltanteSobrante.trim() !== '' && filters.faltanteSobrante.toUpperCase() !== 'TODAS') {
      const tipoFiltro = filters.faltanteSobrante.toUpperCase().trim();
      
      if (tipoFiltro === 'FALTA') {
        where.push(`EXISTS (
          SELECT 1 
          FROM DOCUMENTOS.DOCOBSERVACION obs_filtro 
          WHERE obs_filtro.DOCUMENTO = dd.ID 
            AND UPPER(obs_filtro.OBSERVACION) LIKE '%FALTA%'
        )`);
      } else if (tipoFiltro === 'SOBRA') {
        where.push(`EXISTS (
          SELECT 1 
          FROM DOCUMENTOS.DOCOBSERVACION obs_filtro 
          WHERE obs_filtro.DOCUMENTO = dd.ID 
            AND UPPER(obs_filtro.OBSERVACION) LIKE '%SOBRA%'
        )`);
      }
    }
  }

  /**
   * Aplica los filtros de participante a la consulta
   * @param filters 
   * @param where 
   * @param joins 
   * @param params 
   */
  private applyParticipantFilters(
    filters: GuideFiltersDto,
    where: string[],
    joins: string[],
    params: Record<string, any>
  ): void {
    // Si hay filtro de participante, necesitamos hacer JOIN con la tabla de participantes
    if (filters?.participant || filters?.participantType) {
      const hasParticipantJoin = joins.some(join => join.includes('DOCPARTICIPACION'));
      
      if (!hasParticipantJoin) {
        joins.push('JOIN DOCUMENTOS.DOCPARTICIPACION dp ON dp.DOCUMENTO = dd.ID');
      }

      if (filters?.participantType) {
        where.push('dp.ROL = :tipoParticipante');
        params.tipoParticipante = String(filters.participantType).toUpperCase();
      }

      if (filters?.participant) {
        const participantValue = String(filters.participant).trim();
        where.push('UPPER(dp.NOMBREPARTICIPANTE) LIKE UPPER(:participante)');
        params.participante = `%${participantValue}%`;
      }
    }
  }

  /**
   * Aplica los filtros de tipo de operación a la consulta
   * @param filters 
   * @param where 
   * @param joins 
   * @param params 
   */
  private applyOperationTypeFilters(
    filters: GuideFiltersDto,
    where: string[],
    joins: string[],
    params: Record<string, any>
  ): void {
    if (filters?.operationType && filters.operationType.trim() !== '' && filters.operationType.toUpperCase() !== 'TODOS') {
      const hasTransporteJoin = joins.some(join => join.includes('DOCTRANDOCTRANSPORTE'));
      
      if (!hasTransporteJoin) {
        joins.push('JOIN DOCTRANSPORTE.DOCTRANDOCTRANSPORTE dtt ON dtt.ID = dd.ID');
      }

      where.push('dtt.SENTIDO = :tipoOperacion');
      params.tipoOperacion = String(filters.operationType).toUpperCase();
    }
  }

  /**
   * Construye un CTE previo para filtrar por fecha de zarpe eficientemente
   * @param filters 
   * @param params 
   * @returns 
   */
  private buildFechaZarpeCTE(filters: GuideFiltersDto, params: Record<string, any>): string {
    if (!filters?.dateType || String(filters.dateType).toUpperCase() === 'FEM' || 
        String(filters.dateType).toUpperCase() === 'FECREACION' || 
        String(filters.dateType).toUpperCase() === 'FECACEPTA') {
      return '';
    }

    if (!filters?.from || !filters?.to) {
      return '';
    }

    // CTE que filtra documentos por fecha de zarpe ANTES de otros JOINs
    // Esto reduce dramáticamente el dataset para operaciones posteriores
    return `docs_con_fecha_zarpe AS (
          SELECT /*+ INDEX(dfd IDX_DOCFECHADOC_DOC_TIPO) */ DISTINCT
            dfd.DOCUMENTO as ID
          FROM DOCUMENTOS.DOCFECHADOCUMENTO dfd
          WHERE dfd.TIPOFECHA = 'FZARPE'
            AND dfd.FECHA >= TO_DATE(:fechaFrom, 'DD/MM/YYYY HH24:MI:SS')
            AND dfd.FECHA <= TO_DATE(:fechaTo, 'DD/MM/YYYY HH24:MI:SS')
        ),
        `;
  }

  /**
   * Construye el CTE para la consulta de documentos filtrados
   * @param where 
   * @param joins 
   * @param hasFechaZarpeCTE Indica si existe el CTE previo de fecha zarpe
   * @returns 
   */
  private buildDocumentosFiltradosCTE(
    where: string[], 
    joins: string[], 
    hasFechaZarpeCTE: boolean
  ): string {
    let cte = `documentos_filtrados AS (SELECT /*+ FIRST_ROWS(20) INDEX(dd) */ dd.ID,dd.NUMEROEXTERNO,dd.FECHAEMISION,dd.FECHACREACION,dd.NUMEROACEPTACION,e.TPO_DOCTO,e.FECACEP,e.NUMIDENTIF,e.num_conoc AS NUM_CONOC FROM DOCUMENTOS.DOCDOCUMENTOBASE dd`;
    if (hasFechaZarpeCTE) {
      cte += ' INNER JOIN docs_con_fecha_zarpe dfz ON dd.ID=dfz.ID';
    }
    cte += ' LEFT JOIN din.enca_din e ON dd.NUMEROEXTERNO=e.num_conoc AND dd.NUMEROACEPTACION=e.num_manif AND e.aceptadorechazado=\'A\' AND e.via_tran=11';
    if (joins.length) {
      cte += ' ' + joins.join(' ');
    }
    if (where.length) {
      cte += ' WHERE ' + where.join(' AND ');
    }
    cte += ' GROUP BY dd.ID,dd.NUMEROEXTERNO,dd.FECHAEMISION,dd.FECHACREACION,dd.NUMEROACEPTACION,e.TPO_DOCTO,e.FECACEP,e.NUMIDENTIF,e.num_conoc)';
    return cte;
  }

  /**
   * Construye los CTE comunes para la consulta
   * @param needsManifiestos Indica si se necesitan los manifiestos relacionados
   * @param hasStatusFilter Indica si hay filtro de estado
   * @returns 
   */
  private buildCommonCTEs(needsManifiestos: boolean = true, hasStatusFilter: boolean = false): string {
    const manifiestosCTE = needsManifiestos ? `,
        manifiestos_relacionados AS (
          SELECT 
            df.ID AS guia_id,
            dm.ID AS manifiesto_id
          FROM documentos_filtrados df
          JOIN DOCUMENTOS.DOCDOCUMENTOBASE dm ON dm.NUMEROEXTERNO = df.NUMEROACEPTACION
          WHERE dm.TIPODOCUMENTO = 'MFTOC'
            AND dm.ACTIVO = 'S'
        ),
        fechas_arribo AS (
          SELECT 
            mr.guia_id,
            MAX(dfd.FECHA) AS fechaArribo
          FROM manifiestos_relacionados mr
          JOIN DOCUMENTOS.DOCFECHADOCUMENTO dfd ON mr.manifiesto_id = dfd.DOCUMENTO AND dfd.TIPOFECHA = 'FARRIBO'
          GROUP BY mr.guia_id
        ),
        fechas_conformacion AS (
          SELECT 
            mr.guia_id,
            MAX(det.FECHA) AS fechaConformacion
          FROM manifiestos_relacionados mr
          JOIN DOCUMENTOS.DOCESTADOS det ON mr.manifiesto_id = det.DOCUMENTO AND det.TIPOESTADO = 'CMP'
          GROUP BY mr.guia_id
        )` : '';

    return `${manifiestosCTE},
        fecha_max_estados AS (
          SELECT 
            det.DOCUMENTO,
            MAX(det.FECHAACTIVA) AS max_fechaactiva
          FROM documentos_filtrados df
          JOIN DOCUMENTOS.DOCESTADOS det ON det.DOCUMENTO = df.ID
          WHERE det.ACTIVA = :activaEstado
            AND det.TIPOESTADO NOT IN ('FPLAZO','CON MARCA','VIS','REC')
            AND det.TIPOESTADO IN ('ACP','ANU','CMP','ACL','MOD','CMPFP', 'ACLP')
          GROUP BY det.DOCUMENTO
        ),
        estado_max_tipo AS (
          SELECT 
            det.DOCUMENTO,
            MAX(det.TIPOESTADO) AS max_tipoestado,
            det.FECHAACTIVA AS fechaactiva
          FROM documentos_filtrados df
          JOIN DOCUMENTOS.DOCESTADOS det ON det.DOCUMENTO = df.ID
          JOIN fecha_max_estados fme ON fme.DOCUMENTO = det.DOCUMENTO 
            AND fme.max_fechaactiva = det.FECHAACTIVA
          WHERE det.ACTIVA = :activaEstado
            AND det.TIPOESTADO IN ('ACP','ANU','CMP','ACL','MOD','CMPFP', 'ACLP')
            AND det.TIPODOCUMENTO = :tipoDocumentoEstado
          GROUP BY det.DOCUMENTO, det.FECHAACTIVA
        ),
        estados_ordenados AS (
          SELECT 
            emt.DOCUMENTO,
            emt.max_tipoestado AS TIPOESTADO,
            dte.NOMBRE,
            emt.fechaactiva AS FECHA,
            1 AS rn
          FROM estado_max_tipo emt
          JOIN DOCUMENTOS.DOCTIPOESTADO dte ON emt.max_tipoestado = dte.CODIGO
          WHERE dte.TIPODOCUMENTO = :tipoDocumentoEstado
        )`;
  }

  /**
   * Construye CTEs opcionales para datos adicionales (solo cuando se necesitan)
   * @returns 
   */
  private buildOptionalCTEs(): string {
    return `,
        motivos_seleccion AS (
          SELECT /*+ USE_HASH(df OpFiscMarca Motivo) */
            df.ID AS documento_id,
            LISTAGG(Motivo.Descripcion, ' / ') 
              WITHIN GROUP (ORDER BY OpFiscMarca.CodigoOpFiscMotivoMarca) AS motivoSeleccion
          FROM documentos_filtrados df
          JOIN FISCALIZACIONES.OPFISCMARCA OpFiscMarca ON OpFiscMarca.IdDocumento = df.ID AND OpFiscMarca.Activa = 'S'
          JOIN FISCALIZACIONES.OPFISCMOTIVOMARCA Motivo ON Motivo.Codigo = OpFiscMarca.CodigoOpFiscMotivoMarca
          GROUP BY df.ID
        ),
        resultados_seleccion AS (
          SELECT /*+ USE_HASH(df FIS REG RES) */
            df.ID AS documento_id,
            LISTAGG(RES.codigoopfiscresultado || ' / ' || RES.observacion, ' / ') 
              WITHIN GROUP (ORDER BY RES.codigoopfiscresultado || ' / ' || RES.observacion ASC) AS resultadoSeleccion
          FROM documentos_filtrados df
          INNER JOIN FISCALIZACIONES.OPFISCMARCA FIS ON FIS.IdDocumento = df.ID AND FIS.Activa = 'S'
          INNER JOIN FISCALIZACIONES.OPFISCREGISTROFISCALIZACI REG ON REG.IdOpFiscAccionFiscalizaci = FIS.IDOPFISCACCIONFISCALIZACI AND REG.activo = 'S'
          INNER JOIN FISCALIZACIONES.OPFISCRESULTADOACCION RES ON REG.IdOpFiscAccionFiscalizaci = RES.IdOpFiscAccionFiscalizaci 
            AND REG.ID = RES.idopfiscregistrofiscaliza
          GROUP BY df.ID
        ),
        observaciones_falta_sobra AS (
          SELECT 
            df.ID AS documento_id,
            CASE WHEN EXISTS (SELECT 1 FROM DOCUMENTOS.DOCOBSERVACION obs WHERE obs.DOCUMENTO = df.ID AND UPPER(obs.OBSERVACION) LIKE '%FALTA%') THEN 'Si' ELSE 'No' END AS falta,
            CASE WHEN EXISTS (SELECT 1 FROM DOCUMENTOS.DOCOBSERVACION obs WHERE obs.DOCUMENTO = df.ID AND UPPER(obs.OBSERVACION) LIKE '%SOBRA%') THEN 'Si' ELSE 'No' END AS sobra
          FROM documentos_filtrados df
        ),
        consignatario AS (
          SELECT 
            df.ID AS documento_id,
            NVL(LISTAGG(dp.NOMBREPARTICIPANTE, ' / ') 
              WITHIN GROUP (ORDER BY dp.NOMBREPARTICIPANTE), '') AS nombreParticipante
          FROM documentos_filtrados df
          LEFT JOIN DOCUMENTOS.DOCPARTICIPACION dp ON dp.DOCUMENTO = df.ID AND dp.ROL = 'CONS'
          GROUP BY df.ID
        ),
        transporte AS (
          SELECT 
            df.ID AS documento_id,
            NVL(dt.TOTALPESO || ' ' || dt.UNIDADPESO, '') AS totalPesoConUnidad,
            NVL(dt.TOTALITEM, 0) AS totalItem
          FROM documentos_filtrados df
          LEFT JOIN DOCTRANSPORTE.DOCTRANDOCTRANSPORTE dt ON dt.ID = df.ID
        ),
        dips_courier AS (
          SELECT  
            df.ID AS documento_id,
            MAX(e.FECACEP) AS fechaDips,
            MAX(e.NUMIDENTIF) AS numeroDips
          FROM documentos_filtrados df
          LEFT JOIN DIN.ENCA_DIN e 
            ON df.NUMEROEXTERNO = e.NUM_CONOC
           AND e.ACEPTADORECHAZADO = 'A'
           AND e.VIA_TRAN = 11
           AND e.TPO_DOCTO IN (122, 123)
          GROUP BY df.ID
        ),
        es_din AS (
          SELECT 
            df.ID AS documento_id,
            CASE 
              WHEN MAX(e.NUM_CONOC) IS NOT NULL THEN 'Si'
              ELSE 'No'
            END AS esDin
          FROM documentos_filtrados df
          LEFT JOIN DIN.ENCA_DIN e 
            ON df.NUMEROEXTERNO = e.NUM_CONOC
           AND e.TPO_DOCTO NOT IN (122, 123)
          GROUP BY df.ID
        )`;
  }

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
  private buildMainQuery(
    fechaZarpeCTE: string,
    documentosFiltradosCTE: string,
    sortColumn: string,
    order: string,
    hasStatusFilter: boolean,
    needsManifiestos: boolean = true
  ): string {
    const commonCTEs = this.buildCommonCTEs(needsManifiestos, hasStatusFilter);
    const optionalCTEs = this.buildOptionalCTEs();
    
    const estadoJoin = hasStatusFilter 
      ? 'INNER JOIN estados_ordenados eo ON df.ID = eo.DOCUMENTO AND eo.rn = 1 AND eo.TIPOESTADO = :estado'
      : 'LEFT JOIN estados_ordenados eo ON df.ID = eo.DOCUMENTO AND eo.rn = 1';
    const joins = [estadoJoin];

    if (needsManifiestos) {
      joins.push('LEFT JOIN fechas_arribo far ON df.ID = far.guia_id');
      joins.push('LEFT JOIN fechas_conformacion fc ON df.ID = fc.guia_id');
    }

    joins.push('LEFT JOIN motivos_seleccion ms ON df.ID = ms.documento_id');
    joins.push('LEFT JOIN resultados_seleccion rs ON df.ID = rs.documento_id');
    joins.push('LEFT JOIN observaciones_falta_sobra obs_fs ON df.ID = obs_fs.documento_id');
    joins.push('LEFT JOIN consignatario cons ON df.ID = cons.documento_id');
    joins.push('LEFT JOIN transporte trans ON df.ID = trans.documento_id');
    joins.push('LEFT JOIN dips_courier dips ON df.ID = dips.documento_id');
    joins.push('LEFT JOIN es_din ed ON df.ID = ed.documento_id');
    
    // Incluir CTE de fecha zarpe si existe
    const withClause = fechaZarpeCTE ? `WITH ${fechaZarpeCTE}` : 'WITH ';
    
    // Determinar la columna de ordenamiento
    // Con SELECT DISTINCT, Oracle requiere usar los alias del SELECT o expresiones completas
    let orderByColumn: string;
    if (sortColumn === 'ESTADO') {
      // Usar el alias del SELECT
      orderByColumn = 'estado';
    } else if (sortColumn === 'CONSIGNATARIO') {
      // Usar el alias del SELECT (nombreParticipante)
      orderByColumn = 'nombreParticipante';
    } else if (sortColumn === 'TOTALPESO') {
      // Usar el alias del SELECT (totalPeso)
      orderByColumn = 'totalPeso';
    } else if (sortColumn === 'CANTTOTAL') {
      // Usar el alias del SELECT (totalItem)
      orderByColumn = 'totalItem';
    } else if (sortColumn === 'MOTIVOMARCA') {
      // Usar el alias del SELECT (motivoSeleccion)
      orderByColumn = 'motivoSeleccion';
    } else if (sortColumn === 'FALTA') {
      // Usar el alias del SELECT (falta)
      orderByColumn = 'falta';
    } else if (sortColumn === 'SOBRA') {
      // Usar el alias del SELECT (sobra)
      orderByColumn = 'sobra';
    } else if (sortColumn === 'NRODIPS') {
      // Usar el alias del SELECT (numeroDips)
      orderByColumn = 'numeroDips';
    } else if (sortColumn === 'FECHADIPS') {
      // Usar el alias del SELECT (fechaDips)
      orderByColumn = 'fechaDips';
    } else if (sortColumn === 'TIENEDIN') {
      // Usar el alias del SELECT (esDin)
      orderByColumn = 'esDin';
    } else {
      // Para campos de df, usar el alias del SELECT si existe, sino el nombre de la columna
      const dfColumnMap: Record<string, string> = {
        'FECHACREACION': 'fechaAceptacion',
        'FECHAEMISION': 'fechaEmision',
        'NUMEROEXTERNO': 'numeroExterno',
        'NUMEROACEPTACION': 'numeroAceptacion',
        'ID': 'id',
      };
      orderByColumn = dfColumnMap[sortColumn] || `df.${sortColumn}`;
    }
    
    return `${withClause}${documentosFiltradosCTE}${commonCTEs}${optionalCTEs}
        SELECT DISTINCT
          df.ID as id,
          df.NUMEROEXTERNO as numeroExterno,
          df.FECHAEMISION as fechaEmision,
          df.NUMEROACEPTACION as numeroAceptacion,
          eo.NOMBRE as estado,
          ${needsManifiestos ? 'far.fechaArribo,' : 'NULL AS fechaArribo,'}
          df.FECHACREACION as fechaAceptacion,
          ${needsManifiestos ? 'fc.fechaConformacion,' : 'NULL AS fechaConformacion,'}
          NVL(ms.motivoSeleccion, '') AS motivoSeleccion,
          NVL(rs.resultadoSeleccion, ' ') AS resultadoSeleccion,
          NVL(obs_fs.falta, 'No') AS falta,
          NVL(obs_fs.sobra, 'No') AS sobra,
          NVL(cons.nombreParticipante, '') AS nombreParticipante,
          NVL(trans.totalPesoConUnidad, '') AS totalPeso,
          NVL(trans.totalItem, 0) AS totalItem,
          dips.fechaDips,
          dips.numeroDips,
          NVL(ed.esDin, 'No') AS esDin
        FROM documentos_filtrados df
        ${joins.join('\n        ')}
        ORDER BY ${orderByColumn} ${order}`;
  }

  /**
   * Construye la consulta para contar los documentos filtrados
   * @param fechaZarpeCTE CTE previo para filtrar por fecha zarpe (puede estar vacío)
   * @param documentosFiltradosCTE 
   * @param hasStatusFilter 
   * @returns 
   */
  private buildCountQuery(
    fechaZarpeCTE: string,
    documentosFiltradosCTE: string,
    hasStatusFilter: boolean
  ): string {
    // Incluir CTE de fecha zarpe si existe
    const withClause = fechaZarpeCTE ? `WITH ${fechaZarpeCTE}` : 'WITH ';
    
    // Si no hay filtro de estado, contar directamente los documentos filtrados (más rápido)
    if (!hasStatusFilter) {
      return `${withClause}${documentosFiltradosCTE}
        SELECT COUNT(1) AS TOTAL 
        FROM documentos_filtrados`;
    }

    const commonCTEs = this.buildCommonCTEs(false, hasStatusFilter);
    return `${withClause}${documentosFiltradosCTE}${commonCTEs}
        SELECT COUNT(DISTINCT df.ID) AS TOTAL 
        FROM documentos_filtrados df
        INNER JOIN estados_ordenados eo ON df.ID = eo.DOCUMENTO 
          AND eo.rn = 1 
          AND eo.TIPOESTADO = :estado`;
  }

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
  private async executeQueries(
    mainQuery: string,
    countQuery: string,
    params: Record<string, any>,
    offset: number,
    limit: number,
    cacheKey: string | null
  ): Promise<{ guides: any[]; total: number }> {
    const connection = this.documentoBaseRepository.manager.connection;
    const driver = connection.driver;

    // Intentar obtener el total del cache
    let countResult: number;
    if (cacheKey) {
      const cachedTotalResult = this.cacheService.get<number>(cacheKey, this.CACHE_TTL);
      const cachedTotal = await Promise.resolve(cachedTotalResult);
      if (cachedTotal !== null) {
        const guidesResult = await this.executeMainQuery(driver, mainQuery, params, offset, limit);
        return {
          guides: guidesResult,
          total: cachedTotal,
        };
      }
    }

    const [countResultFromDb, guidesResult] = await Promise.all([
      this.executeCountQuery(driver, countQuery, params),
      this.executeMainQuery(driver, mainQuery, params, offset, limit),
    ]);

    countResult = countResultFromDb;

    if (cacheKey) {
      const setResult = this.cacheService.set(cacheKey, countResult, this.CACHE_TTL);
      await Promise.resolve(setResult);
    }

    return {
      guides: guidesResult,
      total: countResult,
    };
  }

  /**
   * Ejecuta la consulta para contar los documentos filtrados
   * @param driver 
   * @param countQuery 
   * @param params 
   * @returns 
   */
  private async executeCountQuery(
    driver: any,
    countQuery: string,
    params: Record<string, any>
  ): Promise<number> {
    const [query, queryParams] = driver.escapeQueryWithParameters(countQuery, params, {});
    const result = await this.documentoBaseRepository.query(query, queryParams);
    return Number(result?.[0]?.TOTAL || 0);
  }

  private async executeMainQuery(
    driver: any,
    mainQuery: string,
    params: Record<string, any>,
    offset: number,
    limit: number
  ): Promise<any[]> {
    // Optimización: Usar FETCH FIRST para mejor rendimiento en Oracle 12c+
    // Si la versión de Oracle lo soporta, es más eficiente que ROWNUM
    // Por compatibilidad, mantenemos ROWNUM pero optimizamos la estructura
    const paginatedSql = `
      SELECT * FROM (
        SELECT q.*, ROWNUM rn FROM (
          ${mainQuery}
        ) q WHERE ROWNUM <= :offsetLimit
      ) WHERE rn > :offset`;

    const [query, queryParams] = driver.escapeQueryWithParameters(paginatedSql, params, {});
    return await this.documentoBaseRepository.query(query, queryParams);
  }

  /**
   * Obtiene las guías filtradas
   * @param filters 
   * @param userId 
   * @returns 
   */
  async listGuides(filters: GuideFiltersDto, userId?: number) {
    try {
      // Si no existe manifestNumber, establecer isSimplified en false
      if (!filters?.manifestNumber) {
        filters.isSimplified = false;
      }

      // Si userId viene como parámetro pero no está en filters, agregarlo
      if (userId && !filters?.userId) {
        filters.userId = userId;
      }

      // Normalizar parámetros de paginación y ordenamiento
      const page = Number(filters?.page || 1);
      const limit = Number(filters?.limit || 20);
      const sort = filters?.sort || 'fechaCreacion';
      const order = (filters?.order === 'asc' || filters?.order === 'desc') 
        ? filters.order.toUpperCase() as 'ASC' | 'DESC'
        : 'DESC';
      const sortColumn = this.getSortColumn(sort);
      const offset = (page - 1) * limit;

      // Construir parámetros base y condiciones de filtrado
      const params = this.buildBaseParams(offset, limit);
      const joins: string[] = [];
      const { where, hasFechaZarpeCTE } = this.buildWhereConditions(filters, params, joins);

      // Configurar filtro de estado si existe
      let hasStatusFilter = !!filters?.status;
      if (hasStatusFilter) {
        params.estado = String(filters.status).toUpperCase();
      }

      // Generar clave de cache basada en los filtros (sin paginación ni ordenamiento)
      const cacheKey = this.generateCacheKey(filters, hasStatusFilter);

      // Construir CTE de fecha zarpe si es necesario (para máxima optimización)
      const fechaZarpeCTE = hasFechaZarpeCTE ? this.buildFechaZarpeCTE(filters, params) : '';

      // Construir CTE base de documentos filtrados
      const documentosFiltradosCTE = this.buildDocumentosFiltradosCTE(where, joins, hasFechaZarpeCTE);

      // Determinar si necesitamos datos de manifiestos (solo si no hay filtro específico)
      const needsManifiestos = !filters?.guideNumber;

      // Construir queries
      const mainQuery = this.buildMainQuery(fechaZarpeCTE, documentosFiltradosCTE, sortColumn, order, hasStatusFilter, needsManifiestos);
      const countQuery = this.buildCountQuery(fechaZarpeCTE, documentosFiltradosCTE, hasStatusFilter);

      // Ejecutar queries (usando cache si está disponible)
      const { guides, total } = await this.executeQueries(mainQuery, countQuery, params, offset, limit, cacheKey);

      // Construir respuesta
      return ResponseUtil.success({
        guides,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }, "Guías obtenidas exitosamente");
    } catch (error: any) {
      throw ResponseUtil.internalError(error);
    }
  }
}
