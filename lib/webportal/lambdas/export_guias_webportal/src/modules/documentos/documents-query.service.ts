import { Repository } from "typeorm";
import { DocDocumentoBase } from "./entities";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable, Logger } from "@nestjs/common";
import { DateUtil } from "../../shared/utils/date.util";
import { GuideFiltersDto } from "./dto/guide-filters.dto";

@Injectable()
export class DocumentsQueryService {
  private readonly logger = new Logger(DocumentsQueryService.name);

  constructor(
    @InjectRepository(DocDocumentoBase)
    private readonly documentoBaseRepository: Repository<DocDocumentoBase>,
  ) {}

  private getSortColumn(sort: string): string {
    const sortColumnMap: Record<string, string> = {
      'fechaCreacion': 'FECHACREACION',
      'fechaEmision': 'FECHAEMISION',
      'numeroExterno': 'NUMEROEXTERNO',
      'id': 'ID',
    };
    return sortColumnMap[sort] || 'FECHACREACION';
  }

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
        where.push('UPPER(dld.LOCACION) LIKE UPPER(:idLocacion)');
        params.idLocacion = `%${String(filters.location).trim()}%`;
      }
    }
  }

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

  private applyParticipantFilters(
    filters: GuideFiltersDto,
    where: string[],
    joins: string[],
    params: Record<string, any>
  ): void {
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
   * Construye un CTE previo para filtrar por fecha de zarpe eficientemente
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

  private buildCommonCTEs(): string {
    return `,
        manifiestos_relacionados AS (
          SELECT 
            df.ID AS guia_id,
            dm.ID AS manifiesto_id
          FROM documentos_filtrados df
          JOIN DOCUMENTOS.DOCDOCUMENTOBASE dm ON dm.NUMEROEXTERNO = df.NUMEROACEPTACION
          WHERE dm.TIPODOCUMENTO = 'MFTOC'
            AND dm.ACTIVO = 'S'
        ),
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
        ),
        motivos_seleccion AS (
          SELECT 
            df.ID AS documento_id,
            LISTAGG(OpFiscMarca.CodigoOpFiscMotivoMarca || '-' || Motivo.Descripcion, ' / ') 
              WITHIN GROUP (ORDER BY OpFiscMarca.CodigoOpFiscMotivoMarca) AS motivoSeleccion
          FROM documentos_filtrados df
          JOIN OpFiscMarca ON OpFiscMarca.IdDocumento = df.ID AND OpFiscMarca.Activa = 'S'
          JOIN OpFiscMotivoMarca Motivo ON Motivo.Codigo = OpFiscMarca.CodigoOpFiscMotivoMarca
          GROUP BY df.ID
        ),
        resultados_seleccion AS (
          SELECT 
            df.ID AS documento_id,
            LISTAGG(RES.codigoopfiscresultado || ' / ' || RES.observacion, ' / ') 
              WITHIN GROUP (ORDER BY RES.codigoopfiscresultado || ' / ' || RES.observacion ASC) AS resultadoSeleccion
          FROM documentos_filtrados df
          INNER JOIN fiscalizaciones.OpFiscMarca FIS ON FIS.IdDocumento = df.ID AND FIS.Activa = 'S'
          INNER JOIN OpFiscRegistroFiscalizaci REG ON REG.IdOpFiscAccionFiscalizaci = FIS.IDOPFISCACCIONFISCALIZACI AND REG.activo = 'S'
          INNER JOIN OPFISCRESULTADOACCION RES ON REG.IdOpFiscAccionFiscalizaci = RES.IdOpFiscAccionFiscalizaci 
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

  private buildMainQuery(
    fechaZarpeCTE: string,
    documentosFiltradosCTE: string,
    sortColumn: string,
    order: string,
    hasStatusFilter: boolean
  ): string {
    const commonCTEs = this.buildCommonCTEs();
    
    const estadoJoin = hasStatusFilter 
      ? 'INNER JOIN estados_ordenados eo ON df.ID = eo.DOCUMENTO AND eo.rn = 1 AND eo.TIPOESTADO = :estado'
      : 'LEFT JOIN estados_ordenados eo ON df.ID = eo.DOCUMENTO AND eo.rn = 1';
    
    // Incluir CTE de fecha zarpe si existe
    const withClause = fechaZarpeCTE ? `WITH ${fechaZarpeCTE}` : 'WITH ';
    
    return `${withClause}${documentosFiltradosCTE}${commonCTEs}
        SELECT DISTINCT
          df.ID as id,
          df.NUMEROEXTERNO as numeroExterno,
          df.FECHAEMISION as fechaEmision,
          df.NUMEROACEPTACION as numeroAceptacion,
          eo.NOMBRE as estado,
          far.fechaArribo,
          df.FECHACREACION as fechaAceptacion,
          fc.fechaConformacion,
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
        ${estadoJoin}
        LEFT JOIN fechas_arribo far ON df.ID = far.guia_id
        LEFT JOIN fechas_conformacion fc ON df.ID = fc.guia_id
        LEFT JOIN motivos_seleccion ms ON df.ID = ms.documento_id
        LEFT JOIN resultados_seleccion rs ON df.ID = rs.documento_id
        LEFT JOIN observaciones_falta_sobra obs_fs ON df.ID = obs_fs.documento_id
        LEFT JOIN consignatario cons ON df.ID = cons.documento_id
        LEFT JOIN transporte trans ON df.ID = trans.documento_id
        LEFT JOIN dips_courier dips ON df.ID = dips.documento_id
        LEFT JOIN es_din ed ON df.ID = ed.documento_id
        ORDER BY df.${sortColumn} ${order}`;
  }

  private async executeMainQuery(
    driver: any,
    mainQuery: string,
    params: Record<string, any>,
    offset: number,
    limit: number
  ): Promise<any[]> {
    const paginatedSql = `
      SELECT * FROM (
        SELECT q.*, ROWNUM rn FROM (
          ${mainQuery}
        ) q WHERE ROWNUM <= :offsetLimit
      ) WHERE rn > :offset`;

    const [query, queryParams] = driver.escapeQueryWithParameters(paginatedSql, params, {});
    return await this.documentoBaseRepository.query(query, queryParams);
  }

  async listGuides(filters: GuideFiltersDto, userId?: number): Promise<any[]> {
    if (userId) {
      filters.userId = userId;
    }
    if (!filters?.manifestNumber) {
      filters.isSimplified = false;
    }

    const page = Number(filters?.page || 1);
    const limit = Number(filters?.limit || 10000);
    const sort = filters?.sort || 'fechaCreacion';
    const order = (filters?.order === 'asc' || filters?.order === 'desc') 
      ? filters.order.toUpperCase() as 'ASC' | 'DESC'
      : 'DESC';
    const sortColumn = this.getSortColumn(sort);
    const offset = (page - 1) * limit;

    const params = this.buildBaseParams(offset, limit);
    const joins: string[] = [];
    const { where, hasFechaZarpeCTE } = this.buildWhereConditions(filters, params, joins);

    // Configurar filtro de estado si existe
    const hasStatusFilter = !!filters?.status;
    if (hasStatusFilter) {
      params.estado = String(filters.status).toUpperCase();
    }

    // Construir CTE de fecha zarpe si es necesario (para máxima optimización)
    const fechaZarpeCTE = hasFechaZarpeCTE ? this.buildFechaZarpeCTE(filters, params) : '';

    // Construir CTE base de documentos filtrados
    const documentosFiltradosCTE = this.buildDocumentosFiltradosCTE(where, joins, hasFechaZarpeCTE);

    // Construir query principal
    const mainQuery = this.buildMainQuery(fechaZarpeCTE, documentosFiltradosCTE, sortColumn, order, hasStatusFilter);

    const connection = this.documentoBaseRepository.manager.connection;
    const driver = connection.driver;

    const results = await this.executeMainQuery(driver, mainQuery, params, offset, limit);
    console.log(`Total de resultados obtenidos de BD: ${results.length}`);
    
    return results;
  }

  /**
   * Obtiene los números externos de DOCDOCUMENTOBASE para los IDs de guías proporcionados
   * Busca en lote (1 a 20 IDs máximo)
   * @param guideIds - Array de IDs de documentos base (máximo 20)
   * @returns Map con el ID como clave y el número externo como valor
   */
  async getExternalNumbersByIds(guideIds: number[]): Promise<Map<number, string>> {
    if (!guideIds || guideIds.length === 0) {
      return new Map();
    }

    if (guideIds.length > 20) {
      throw new Error('No se pueden buscar más de 20 números externos por solicitud. Máximo permitido: 20.');
    }

    this.logger.log(`Buscando números externos para ${guideIds.length} guías`);

    try {
      // Buscar todos los documentos en una sola consulta usando IN
      const documents = await this.documentoBaseRepository
        .createQueryBuilder('dd')
        .select(['dd.ID', 'dd.NUMEROEXTERNO'])
        .where('dd.ID IN (:...ids)', { ids: guideIds })
        .andWhere('dd.TIPODOCUMENTO = :tipoDocumento', { tipoDocumento: 'GTIME' })
        .andWhere('dd.ACTIVO = :activo', { activo: 'S' })
        .getRawMany();

      // Crear un Map con los resultados
      const resultMap = new Map<number, string>();
      documents.forEach((doc) => {
        resultMap.set(doc.ID, doc.NUMEROEXTERNO);
      });

      this.logger.log(`Se encontraron ${resultMap.size} números externos de ${guideIds.length} IDs solicitados`);

      return resultMap;
    } catch (error: any) {
      this.logger.error(`Error obteniendo números externos: ${error.message}`, error.stack);
      throw error;
    }
  }
}

