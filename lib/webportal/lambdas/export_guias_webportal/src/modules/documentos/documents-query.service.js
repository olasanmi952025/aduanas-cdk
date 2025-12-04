"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DocumentsQueryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsQueryService = void 0;
const entities_1 = require("./entities");
const typeorm_1 = require("@nestjs/typeorm");
const common_1 = require("@nestjs/common");
const date_util_1 = require("../../shared/utils/date.util");
let DocumentsQueryService = DocumentsQueryService_1 = class DocumentsQueryService {
    constructor(documentoBaseRepository) {
        this.documentoBaseRepository = documentoBaseRepository;
        this.logger = new common_1.Logger(DocumentsQueryService_1.name);
    }
    getSortColumn(sort) {
        const sortColumnMap = {
            'fechaCreacion': 'FECHACREACION',
            'fechaEmision': 'FECHAEMISION',
            'numeroExterno': 'NUMEROEXTERNO',
            'id': 'ID',
        };
        return sortColumnMap[sort] || 'FECHACREACION';
    }
    buildBaseParams(offset, limit) {
        return {
            tipoDocumento: 'GTIME',
            activo: 'S',
            tipoDocumentoEstado: 'GTIME',
            activaEstado: 'S',
            offsetLimit: offset + limit,
            offset: offset,
        };
    }
    buildWhereConditions(filters, params, joins) {
        const where = [];
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
    applyDateFilters(filters, where, joins, params) {
        if (!filters?.dateType && !filters?.from && !filters?.to)
            return false;
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
            }
            else if (dateTypeUpper === 'FEM') {
                columnaFecha = 'dd.FECHAEMISION';
            }
            else {
                // Es fecha de zarpe - se manejará con CTE separado para máxima eficiencia
                // NO agregar filtros aquí, el CTE previo ya habrá filtrado los documentos
                isFechaZarpe = true;
                if (filters?.from && filters?.to) {
                    const fromDate = date_util_1.DateUtil.createUTCDate(filters.from);
                    const fromDateStr = date_util_1.DateUtil.formatDateForOracle(fromDate);
                    const toDate = date_util_1.DateUtil.createUTCDate(filters.to);
                    const toDateStr = date_util_1.DateUtil.formatDateForOracle(toDate);
                    params.fechaFrom = `${fromDateStr} 00:00:00`;
                    params.fechaTo = `${toDateStr} 23:59:59`;
                    return true; // Indicar que es fecha zarpe para usar CTE
                }
            }
        }
        // Para fechas que NO son zarpe, aplicar filtros normalmente
        if (!isFechaZarpe && filters?.from && filters?.to) {
            const fromDate = date_util_1.DateUtil.createUTCDate(filters.from);
            const fromDateStr = date_util_1.DateUtil.formatDateForOracle(fromDate);
            where.push(`${columnaFecha} >= TO_DATE(:fechaFrom, 'DD/MM/YYYY HH24:MI:SS')`);
            params.fechaFrom = `${fromDateStr} 00:00:00`;
            const toDate = date_util_1.DateUtil.createUTCDate(filters.to);
            const toDateStr = date_util_1.DateUtil.formatDateForOracle(toDate);
            where.push(`${columnaFecha} <= TO_DATE(:fechaTo, 'DD/MM/YYYY HH24:MI:SS')`);
            params.fechaTo = `${toDateStr} 23:59:59`;
        }
        return isFechaZarpe;
    }
    applyLocationFilters(filters, where, joins, params) {
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
    applyMarcaFilters(filters, where, joins, params) {
        if (filters?.marcas && filters.marcas.trim() !== '' && filters.marcas.toUpperCase() !== 'TODOS') {
            const hasMarcaJoin = joins.some(join => join.includes('OpFiscMarca'));
            if (!hasMarcaJoin) {
                // Filtrar por código específico de motivo de selección
                joins.push('JOIN FISCALIZACIONES.OPFISCMARCA ofm ON ofm.IdDocumento = dd.ID AND ofm.Activa = \'S\' AND ofm.CodigoOpFiscMotivoMarca = :codigoMarca');
                params.codigoMarca = filters.marcas.toUpperCase();
            }
        }
    }
    applyFaltanteSobranteFilters(filters, where, joins, params) {
        if (filters?.faltanteSobrante && filters.faltanteSobrante.trim() !== '' && filters.faltanteSobrante.toUpperCase() !== 'TODAS') {
            const tipoFiltro = filters.faltanteSobrante.toUpperCase().trim();
            if (tipoFiltro === 'FALTA') {
                where.push(`EXISTS (
          SELECT 1 
          FROM DOCUMENTOS.DOCOBSERVACION obs_filtro 
          WHERE obs_filtro.DOCUMENTO = dd.ID 
            AND UPPER(obs_filtro.OBSERVACION) LIKE '%FALTA%'
        )`);
            }
            else if (tipoFiltro === 'SOBRA') {
                where.push(`EXISTS (
          SELECT 1 
          FROM DOCUMENTOS.DOCOBSERVACION obs_filtro 
          WHERE obs_filtro.DOCUMENTO = dd.ID 
            AND UPPER(obs_filtro.OBSERVACION) LIKE '%SOBRA%'
        )`);
            }
        }
    }
    applyOperationTypeFilters(filters, where, joins, params) {
        if (filters?.operationType && filters.operationType.trim() !== '' && filters.operationType.toUpperCase() !== 'TODOS') {
            const hasTransporteJoin = joins.some(join => join.includes('DOCTRANDOCTRANSPORTE'));
            if (!hasTransporteJoin) {
                joins.push('JOIN DOCTRANSPORTE.DOCTRANDOCTRANSPORTE dtt ON dtt.ID = dd.ID');
            }
            where.push('dtt.SENTIDO = :tipoOperacion');
            params.tipoOperacion = String(filters.operationType).toUpperCase();
        }
    }
    applyParticipantFilters(filters, where, joins, params) {
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
    buildFechaZarpeCTE(filters, params) {
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
    buildDocumentosFiltradosCTE(where, joins, hasFechaZarpeCTE) {
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
    buildCommonCTEs() {
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
    buildMainQuery(fechaZarpeCTE, documentosFiltradosCTE, sortColumn, order, hasStatusFilter) {
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
    async executeMainQuery(driver, mainQuery, params, offset, limit) {
        const paginatedSql = `
      SELECT * FROM (
        SELECT q.*, ROWNUM rn FROM (
          ${mainQuery}
        ) q WHERE ROWNUM <= :offsetLimit
      ) WHERE rn > :offset`;
        const [query, queryParams] = driver.escapeQueryWithParameters(paginatedSql, params, {});
        return await this.documentoBaseRepository.query(query, queryParams);
    }
    async listGuides(filters, userId) {
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
            ? filters.order.toUpperCase()
            : 'DESC';
        const sortColumn = this.getSortColumn(sort);
        const offset = (page - 1) * limit;
        const params = this.buildBaseParams(offset, limit);
        const joins = [];
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
    async getExternalNumbersByIds(guideIds) {
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
            const resultMap = new Map();
            documents.forEach((doc) => {
                resultMap.set(doc.ID, doc.NUMEROEXTERNO);
            });
            this.logger.log(`Se encontraron ${resultMap.size} números externos de ${guideIds.length} IDs solicitados`);
            return resultMap;
        }
        catch (error) {
            this.logger.error(`Error obteniendo números externos: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.DocumentsQueryService = DocumentsQueryService;
exports.DocumentsQueryService = DocumentsQueryService = DocumentsQueryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.DocDocumentoBase))
], DocumentsQueryService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRzLXF1ZXJ5LnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkb2N1bWVudHMtcXVlcnkuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQ0EseUNBQThDO0FBQzlDLDZDQUFtRDtBQUNuRCwyQ0FBb0Q7QUFDcEQsNERBQXdEO0FBSWpELElBQU0scUJBQXFCLDZCQUEzQixNQUFNLHFCQUFxQjtJQUdoQyxZQUVFLHVCQUFzRTtRQUFyRCw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQThCO1FBSnZELFdBQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyx1QkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUs5RCxDQUFDO0lBRUksYUFBYSxDQUFDLElBQVk7UUFDaEMsTUFBTSxhQUFhLEdBQTJCO1lBQzVDLGVBQWUsRUFBRSxlQUFlO1lBQ2hDLGNBQWMsRUFBRSxjQUFjO1lBQzlCLGVBQWUsRUFBRSxlQUFlO1lBQ2hDLElBQUksRUFBRSxJQUFJO1NBQ1gsQ0FBQztRQUNGLE9BQU8sYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLGVBQWUsQ0FBQztJQUNoRCxDQUFDO0lBRU8sZUFBZSxDQUFDLE1BQWMsRUFBRSxLQUFhO1FBQ25ELE9BQU87WUFDTCxhQUFhLEVBQUUsT0FBTztZQUN0QixNQUFNLEVBQUUsR0FBRztZQUNYLG1CQUFtQixFQUFFLE9BQU87WUFDNUIsWUFBWSxFQUFFLEdBQUc7WUFDakIsV0FBVyxFQUFFLE1BQU0sR0FBRyxLQUFLO1lBQzNCLE1BQU0sRUFBRSxNQUFNO1NBQ2YsQ0FBQztJQUNKLENBQUM7SUFFTyxvQkFBb0IsQ0FDMUIsT0FBd0IsRUFDeEIsTUFBMkIsRUFDM0IsS0FBZTtRQUVmLE1BQU0sS0FBSyxHQUFhLEVBQUUsQ0FBQztRQUMzQixJQUFJLGdCQUFnQixHQUFHLEtBQUssQ0FBQztRQUU3QixJQUFJLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQztZQUN6QixLQUFLLENBQUMs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QixDQTJrQmpDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUmVwb3NpdG9yeSB9IGZyb20gXCJ0eXBlb3JtXCI7XG5pbXBvcnQgeyBEb2NEb2N1bWVudG9CYXNlIH0gZnJvbSBcIi4vZW50aXRpZXNcIjtcbmltcG9ydCB7IEluamVjdFJlcG9zaXRvcnkgfSBmcm9tIFwiQG5lc3Rqcy90eXBlb3JtXCI7XG5pbXBvcnQgeyBJbmplY3RhYmxlLCBMb2dnZXIgfSBmcm9tIFwiQG5lc3Rqcy9jb21tb25cIjtcbmltcG9ydCB7IERhdGVVdGlsIH0gZnJvbSBcIi4uLy4uL3NoYXJlZC91dGlscy9kYXRlLnV0aWxcIjtcbmltcG9ydCB7IEd1aWRlRmlsdGVyc0R0byB9IGZyb20gXCIuL2R0by9ndWlkZS1maWx0ZXJzLmR0b1wiO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgRG9jdW1lbnRzUXVlcnlTZXJ2aWNlIHtcbiAgcHJpdmF0ZSByZWFkb25seSBsb2dnZXIgPSBuZXcgTG9nZ2VyKERvY3VtZW50c1F1ZXJ5U2VydmljZS5uYW1lKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBASW5qZWN0UmVwb3NpdG9yeShEb2NEb2N1bWVudG9CYXNlKVxuICAgIHByaXZhdGUgcmVhZG9ubHkgZG9jdW1lbnRvQmFzZVJlcG9zaXRvcnk6IFJlcG9zaXRvcnk8RG9jRG9jdW1lbnRvQmFzZT4sXG4gICkge31cblxuICBwcml2YXRlIGdldFNvcnRDb2x1bW4oc29ydDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBzb3J0Q29sdW1uTWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgJ2ZlY2hhQ3JlYWNpb24nOiAnRkVDSEFDUkVBQ0lPTicsXG4gICAgICAnZmVjaGFFbWlzaW9uJzogJ0ZFQ0hBRU1JU0lPTicsXG4gICAgICAnbnVtZXJvRXh0ZXJubyc6ICdOVU1FUk9FWFRFUk5PJyxcbiAgICAgICdpZCc6ICdJRCcsXG4gICAgfTtcbiAgICByZXR1cm4gc29ydENvbHVtbk1hcFtzb3J0XSB8fCAnRkVDSEFDUkVBQ0lPTic7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkQmFzZVBhcmFtcyhvZmZzZXQ6IG51bWJlciwgbGltaXQ6IG51bWJlcik6IFJlY29yZDxzdHJpbmcsIGFueT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0aXBvRG9jdW1lbnRvOiAnR1RJTUUnLFxuICAgICAgYWN0aXZvOiAnUycsXG4gICAgICB0aXBvRG9jdW1lbnRvRXN0YWRvOiAnR1RJTUUnLFxuICAgICAgYWN0aXZhRXN0YWRvOiAnUycsXG4gICAgICBvZmZzZXRMaW1pdDogb2Zmc2V0ICsgbGltaXQsXG4gICAgICBvZmZzZXQ6IG9mZnNldCxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZFdoZXJlQ29uZGl0aW9ucyhcbiAgICBmaWx0ZXJzOiBHdWlkZUZpbHRlcnNEdG8sXG4gICAgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LFxuICAgIGpvaW5zOiBzdHJpbmdbXVxuICApOiB7IHdoZXJlOiBzdHJpbmdbXTsgaGFzRmVjaGFaYXJwZUNURTogYm9vbGVhbiB9IHtcbiAgICBjb25zdCB3aGVyZTogc3RyaW5nW10gPSBbXTtcbiAgICBsZXQgaGFzRmVjaGFaYXJwZUNURSA9IGZhbHNlO1xuICAgIFxuICAgIGlmIChmaWx0ZXJzPy5ndWlkZU51bWJlcikge1xuICAgICAgd2hlcmUucHVzaCgnZGQuTlVNRVJPRVhURVJOTyA9IDpndWlkZU51bWJlcicpO1xuICAgICAgcGFyYW1zLmd1aWRlTnVtYmVyID0gU3RyaW5nKGZpbHRlcnMuZ3VpZGVOdW1iZXIpLnRyaW0oKTtcbiAgICAgIHdoZXJlLnB1c2goJ2RkLlRJUE9ET0NVTUVOVE8gPSA6dGlwb0RvY3VtZW50bycpO1xuICAgICAgd2hlcmUucHVzaChcImRkLkFDVElWTyA9ICdTJ1wiKTtcbiAgICAgIGlmIChmaWx0ZXJzPy51c2VySWQpIHtcbiAgICAgICAgd2hlcmUucHVzaCgnZGQuSURFTUlTT1IgPSA6dXNlcklkJyk7XG4gICAgICAgIHBhcmFtcy51c2VySWQgPSBOdW1iZXIoZmlsdGVycy51c2VySWQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHsgd2hlcmUsIGhhc0ZlY2hhWmFycGVDVEUgfTtcbiAgICB9XG5cbiAgICAvLyBGaWx0cm9zIGJhc2Ugc2llbXByZSBwcmVzZW50ZXNcbiAgICB3aGVyZS5wdXNoKCdkZC5USVBPRE9DVU1FTlRPID0gOnRpcG9Eb2N1bWVudG8nKTtcbiAgICB3aGVyZS5wdXNoKFwiZGQuQUNUSVZPID0gJ1MnXCIpO1xuXG4gICAgLy8gRmlsdHJvIGRlIHVzZXJJZCB0ZW1wcmFubyBwYXJhIG1lam9yIHJlbmRpbWllbnRvXG4gICAgaWYgKGZpbHRlcnM/LnVzZXJJZCkge1xuICAgICAgd2hlcmUucHVzaCgnZGQuSURFTUlTT1IgPSA6dXNlcklkJyk7XG4gICAgICBwYXJhbXMudXNlcklkID0gTnVtYmVyKGZpbHRlcnMudXNlcklkKTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVycz8ubWFuaWZlc3ROdW1iZXIpIHtcbiAgICAgIHdoZXJlLnB1c2goJ2RkLk5VTUVST0FDRVBUQUNJT04gPSA6bWFuaWZlc3ROdW1iZXInKTtcbiAgICAgIHBhcmFtcy5tYW5pZmVzdE51bWJlciA9IFN0cmluZyhmaWx0ZXJzLm1hbmlmZXN0TnVtYmVyKS50cmltKCk7XG5cbiAgICAgIC8vIFNpIGhheSBtYW5pZmVzdE51bWJlciB5IGVzdMOhIGVuIG1vZG8gc2ltcGxpZmljYWRvLCBwZXJtaXRpciBmaWx0cmFyIHBvciBmZWNoYVxuICAgICAgaWYgKGZpbHRlcnM/LmlzU2ltcGxpZmllZCA9PT0gdHJ1ZSkge1xuICAgICAgICBoYXNGZWNoYVphcnBlQ1RFID0gdGhpcy5hcHBseURhdGVGaWx0ZXJzKGZpbHRlcnMsIHdoZXJlLCBqb2lucywgcGFyYW1zKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYgKCFmaWx0ZXJzPy5tYW5pZmVzdE51bWJlcikge1xuICAgICAgaGFzRmVjaGFaYXJwZUNURSA9IHRoaXMuYXBwbHlEYXRlRmlsdGVycyhmaWx0ZXJzLCB3aGVyZSwgam9pbnMsIHBhcmFtcyk7XG4gICAgfVxuXG4gICAgdGhpcy5hcHBseUxvY2F0aW9uRmlsdGVycyhmaWx0ZXJzLCB3aGVyZSwgam9pbnMsIHBhcmFtcyk7XG4gICAgdGhpcy5hcHBseVBhcnRpY2lwYW50RmlsdGVycyhmaWx0ZXJzLCB3aGVyZSwgam9pbnMsIHBhcmFtcyk7XG4gICAgdGhpcy5hcHBseU9wZXJhdGlvblR5cGVGaWx0ZXJzKGZpbHRlcnMsIHdoZXJlLCBqb2lucywgcGFyYW1zKTtcbiAgICB0aGlzLmFwcGx5TWFyY2FGaWx0ZXJzKGZpbHRlcnMsIHdoZXJlLCBqb2lucywgcGFyYW1zKTtcbiAgICB0aGlzLmFwcGx5RmFsdGFudGVTb2JyYW50ZUZpbHRlcnMoZmlsdGVycywgd2hlcmUsIGpvaW5zLCBwYXJhbXMpO1xuXG4gICAgcmV0dXJuIHsgd2hlcmUsIGhhc0ZlY2hhWmFycGVDVEUgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlEYXRlRmlsdGVycyhcbiAgICBmaWx0ZXJzOiBHdWlkZUZpbHRlcnNEdG8sXG4gICAgd2hlcmU6IHN0cmluZ1tdLFxuICAgIGpvaW5zOiBzdHJpbmdbXSxcbiAgICBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIGFueT5cbiAgKTogYm9vbGVhbiB7XG4gICAgaWYgKCFmaWx0ZXJzPy5kYXRlVHlwZSAmJiAhZmlsdGVycz8uZnJvbSAmJiAhZmlsdGVycz8udG8pIHJldHVybiBmYWxzZTtcblxuICAgIGxldCBjb2x1bW5hRmVjaGEgPSAnZGQuRkVDSEFFTUlTSU9OJztcbiAgICBsZXQgZGF0ZVR5cGUgPSBmaWx0ZXJzPy5kYXRlVHlwZTtcbiAgICBpZiAoIWRhdGVUeXBlICYmIChmaWx0ZXJzPy5mcm9tIHx8IGZpbHRlcnM/LnRvKSkge1xuICAgICAgZGF0ZVR5cGUgPSAnRkVNJztcbiAgICB9XG4gICAgXG4gICAgbGV0IGlzRmVjaGFaYXJwZSA9IGZhbHNlO1xuICAgIFxuICAgIGlmIChkYXRlVHlwZSkge1xuICAgICAgY29uc3QgZGF0ZVR5cGVVcHBlciA9IFN0cmluZyhkYXRlVHlwZSkudG9VcHBlckNhc2UoKTtcbiAgICAgIGlmIChkYXRlVHlwZVVwcGVyID09PSAnRkVDUkVBQ0lPTicgfHwgZGF0ZVR5cGVVcHBlciA9PT0gJ0ZFQ0FDRVBUQScpIHtcbiAgICAgICAgY29sdW1uYUZlY2hhID0gJ2RkLkZFQ0hBQ1JFQUNJT04nO1xuICAgICAgfSBlbHNlIGlmIChkYXRlVHlwZVVwcGVyID09PSAnRkVNJykge1xuICAgICAgICBjb2x1bW5hRmVjaGEgPSAnZGQuRkVDSEFFTUlTSU9OJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEVzIGZlY2hhIGRlIHphcnBlIC0gc2UgbWFuZWphcsOhIGNvbiBDVEUgc2VwYXJhZG8gcGFyYSBtw6F4aW1hIGVmaWNpZW5jaWFcbiAgICAgICAgLy8gTk8gYWdyZWdhciBmaWx0cm9zIGFxdcOtLCBlbCBDVEUgcHJldmlvIHlhIGhhYnLDoSBmaWx0cmFkbyBsb3MgZG9jdW1lbnRvc1xuICAgICAgICBpc0ZlY2hhWmFycGUgPSB0cnVlO1xuICAgICAgICBpZiAoZmlsdGVycz8uZnJvbSAmJiBmaWx0ZXJzPy50bykge1xuICAgICAgICAgIGNvbnN0IGZyb21EYXRlID0gRGF0ZVV0aWwuY3JlYXRlVVRDRGF0ZShmaWx0ZXJzLmZyb20pO1xuICAgICAgICAgIGNvbnN0IGZyb21EYXRlU3RyID0gRGF0ZVV0aWwuZm9ybWF0RGF0ZUZvck9yYWNsZShmcm9tRGF0ZSk7XG4gICAgICAgICAgY29uc3QgdG9EYXRlID0gRGF0ZVV0aWwuY3JlYXRlVVRDRGF0ZShmaWx0ZXJzLnRvKTtcbiAgICAgICAgICBjb25zdCB0b0RhdGVTdHIgPSBEYXRlVXRpbC5mb3JtYXREYXRlRm9yT3JhY2xlKHRvRGF0ZSk7XG4gICAgICAgICAgcGFyYW1zLmZlY2hhRnJvbSA9IGAke2Zyb21EYXRlU3RyfSAwMDowMDowMGA7XG4gICAgICAgICAgcGFyYW1zLmZlY2hhVG8gPSBgJHt0b0RhdGVTdHJ9IDIzOjU5OjU5YDtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gSW5kaWNhciBxdWUgZXMgZmVjaGEgemFycGUgcGFyYSB1c2FyIENURVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUGFyYSBmZWNoYXMgcXVlIE5PIHNvbiB6YXJwZSwgYXBsaWNhciBmaWx0cm9zIG5vcm1hbG1lbnRlXG4gICAgaWYgKCFpc0ZlY2hhWmFycGUgJiYgZmlsdGVycz8uZnJvbSAmJiBmaWx0ZXJzPy50bykge1xuICAgICAgY29uc3QgZnJvbURhdGUgPSBEYXRlVXRpbC5jcmVhdGVVVENEYXRlKGZpbHRlcnMuZnJvbSk7XG4gICAgICBjb25zdCBmcm9tRGF0ZVN0ciA9IERhdGVVdGlsLmZvcm1hdERhdGVGb3JPcmFjbGUoZnJvbURhdGUpO1xuICAgICAgd2hlcmUucHVzaChgJHtjb2x1bW5hRmVjaGF9ID49IFRPX0RBVEUoOmZlY2hhRnJvbSwgJ0REL01NL1lZWVkgSEgyNDpNSTpTUycpYCk7XG4gICAgICBwYXJhbXMuZmVjaGFGcm9tID0gYCR7ZnJvbURhdGVTdHJ9IDAwOjAwOjAwYDtcblxuICAgICAgY29uc3QgdG9EYXRlID0gRGF0ZVV0aWwuY3JlYXRlVVRDRGF0ZShmaWx0ZXJzLnRvKTtcbiAgICAgIGNvbnN0IHRvRGF0ZVN0ciA9IERhdGVVdGlsLmZvcm1hdERhdGVGb3JPcmFjbGUodG9EYXRlKTtcbiAgICAgIHdoZXJlLnB1c2goYCR7Y29sdW1uYUZlY2hhfSA8PSBUT19EQVRFKDpmZWNoYVRvLCAnREQvTU0vWVlZWSBISDI0Ok1JOlNTJylgKTtcbiAgICAgIHBhcmFtcy5mZWNoYVRvID0gYCR7dG9EYXRlU3RyfSAyMzo1OTo1OWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlzRmVjaGFaYXJwZTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlMb2NhdGlvbkZpbHRlcnMoXG4gICAgZmlsdGVyczogR3VpZGVGaWx0ZXJzRHRvLFxuICAgIHdoZXJlOiBzdHJpbmdbXSxcbiAgICBqb2luczogc3RyaW5nW10sXG4gICAgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG4gICk6IHZvaWQge1xuICAgIGlmIChmaWx0ZXJzPy5sb2NhdGlvblR5cGUgfHwgZmlsdGVycz8ubG9jYXRpb24pIHtcbiAgICAgIGNvbnN0IGhhc0xvY2F0aW9uSm9pbiA9IGpvaW5zLnNvbWUoam9pbiA9PiBqb2luLmluY2x1ZGVzKCdET0NMT0NBQ0lPTkRPQ1VNRU5UTycpKTtcbiAgICAgIFxuICAgICAgaWYgKCFoYXNMb2NhdGlvbkpvaW4pIHtcbiAgICAgICAgam9pbnMucHVzaCgnSk9JTiBET0NVTUVOVE9TLkRPQ0xPQ0FDSU9ORE9DVU1FTlRPIGRsZCBPTiBkbGQuRE9DVU1FTlRPID0gZGQuSUQnKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGZpbHRlcnM/LmxvY2F0aW9uVHlwZSkge1xuICAgICAgICB3aGVyZS5wdXNoKCdkbGQuVElQT0xPQ0FDSU9OID0gOnRpcG9Mb2NhY2lvbicpO1xuICAgICAgICBwYXJhbXMudGlwb0xvY2FjaW9uID0gU3RyaW5nKGZpbHRlcnMubG9jYXRpb25UeXBlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGZpbHRlcnM/LmxvY2F0aW9uKSB7XG4gICAgICAgIHdoZXJlLnB1c2goJ1VQUEVSKGRsZC5MT0NBQ0lPTikgTElLRSBVUFBFUig6aWRMb2NhY2lvbiknKTtcbiAgICAgICAgcGFyYW1zLmlkTG9jYWNpb24gPSBgJSR7U3RyaW5nKGZpbHRlcnMubG9jYXRpb24pLnRyaW0oKX0lYDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFwcGx5TWFyY2FGaWx0ZXJzKFxuICAgIGZpbHRlcnM6IEd1aWRlRmlsdGVyc0R0byxcbiAgICB3aGVyZTogc3RyaW5nW10sXG4gICAgam9pbnM6IHN0cmluZ1tdLFxuICAgIHBhcmFtczogUmVjb3JkPHN0cmluZywgYW55PlxuICApOiB2b2lkIHtcbiAgICBpZiAoZmlsdGVycz8ubWFyY2FzICYmIGZpbHRlcnMubWFyY2FzLnRyaW0oKSAhPT0gJycgJiYgZmlsdGVycy5tYXJjYXMudG9VcHBlckNhc2UoKSAhPT0gJ1RPRE9TJykge1xuICAgICAgY29uc3QgaGFzTWFyY2FKb2luID0gam9pbnMuc29tZShqb2luID0+IGpvaW4uaW5jbHVkZXMoJ09wRmlzY01hcmNhJykpO1xuICAgICAgXG4gICAgICBpZiAoIWhhc01hcmNhSm9pbikge1xuICAgICAgICAvLyBGaWx0cmFyIHBvciBjw7NkaWdvIGVzcGVjw61maWNvIGRlIG1vdGl2byBkZSBzZWxlY2Npw7NuXG4gICAgICAgIGpvaW5zLnB1c2goJ0pPSU4gRklTQ0FMSVpBQ0lPTkVTLk9QRklTQ01BUkNBIG9mbSBPTiBvZm0uSWREb2N1bWVudG8gPSBkZC5JRCBBTkQgb2ZtLkFjdGl2YSA9IFxcJ1NcXCcgQU5EIG9mbS5Db2RpZ29PcEZpc2NNb3Rpdm9NYXJjYSA9IDpjb2RpZ29NYXJjYScpO1xuICAgICAgICBwYXJhbXMuY29kaWdvTWFyY2EgPSBmaWx0ZXJzLm1hcmNhcy50b1VwcGVyQ2FzZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlGYWx0YW50ZVNvYnJhbnRlRmlsdGVycyhcbiAgICBmaWx0ZXJzOiBHdWlkZUZpbHRlcnNEdG8sXG4gICAgd2hlcmU6IHN0cmluZ1tdLFxuICAgIGpvaW5zOiBzdHJpbmdbXSxcbiAgICBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIGFueT5cbiAgKTogdm9pZCB7XG4gICAgaWYgKGZpbHRlcnM/LmZhbHRhbnRlU29icmFudGUgJiYgZmlsdGVycy5mYWx0YW50ZVNvYnJhbnRlLnRyaW0oKSAhPT0gJycgJiYgZmlsdGVycy5mYWx0YW50ZVNvYnJhbnRlLnRvVXBwZXJDYXNlKCkgIT09ICdUT0RBUycpIHtcbiAgICAgIGNvbnN0IHRpcG9GaWx0cm8gPSBmaWx0ZXJzLmZhbHRhbnRlU29icmFudGUudG9VcHBlckNhc2UoKS50cmltKCk7XG4gICAgICBcbiAgICAgIGlmICh0aXBvRmlsdHJvID09PSAnRkFMVEEnKSB7XG4gICAgICAgIHdoZXJlLnB1c2goYEVYSVNUUyAoXG4gICAgICAgICAgU0VMRUNUIDEgXG4gICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRPQ09CU0VSVkFDSU9OIG9ic19maWx0cm8gXG4gICAgICAgICAgV0hFUkUgb2JzX2ZpbHRyby5ET0NVTUVOVE8gPSBkZC5JRCBcbiAgICAgICAgICAgIEFORCBVUFBFUihvYnNfZmlsdHJvLk9CU0VSVkFDSU9OKSBMSUtFICclRkFMVEElJ1xuICAgICAgICApYCk7XG4gICAgICB9IGVsc2UgaWYgKHRpcG9GaWx0cm8gPT09ICdTT0JSQScpIHtcbiAgICAgICAgd2hlcmUucHVzaChgRVhJU1RTIChcbiAgICAgICAgICBTRUxFQ1QgMSBcbiAgICAgICAgICBGUk9NIERPQ1VNRU5UT1MuRE9DT0JTRVJWQUNJT04gb2JzX2ZpbHRybyBcbiAgICAgICAgICBXSEVSRSBvYnNfZmlsdHJvLkRPQ1VNRU5UTyA9IGRkLklEIFxuICAgICAgICAgICAgQU5EIFVQUEVSKG9ic19maWx0cm8uT0JTRVJWQUNJT04pIExJS0UgJyVTT0JSQSUnXG4gICAgICAgIClgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFwcGx5T3BlcmF0aW9uVHlwZUZpbHRlcnMoXG4gICAgZmlsdGVyczogR3VpZGVGaWx0ZXJzRHRvLFxuICAgIHdoZXJlOiBzdHJpbmdbXSxcbiAgICBqb2luczogc3RyaW5nW10sXG4gICAgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG4gICk6IHZvaWQge1xuICAgIGlmIChmaWx0ZXJzPy5vcGVyYXRpb25UeXBlICYmIGZpbHRlcnMub3BlcmF0aW9uVHlwZS50cmltKCkgIT09ICcnICYmIGZpbHRlcnMub3BlcmF0aW9uVHlwZS50b1VwcGVyQ2FzZSgpICE9PSAnVE9ET1MnKSB7XG4gICAgICBjb25zdCBoYXNUcmFuc3BvcnRlSm9pbiA9IGpvaW5zLnNvbWUoam9pbiA9PiBqb2luLmluY2x1ZGVzKCdET0NUUkFORE9DVFJBTlNQT1JURScpKTtcbiAgICAgIFxuICAgICAgaWYgKCFoYXNUcmFuc3BvcnRlSm9pbikge1xuICAgICAgICBqb2lucy5wdXNoKCdKT0lOIERPQ1RSQU5TUE9SVEUuRE9DVFJBTkRPQ1RSQU5TUE9SVEUgZHR0IE9OIGR0dC5JRCA9IGRkLklEJyk7XG4gICAgICB9XG5cbiAgICAgIHdoZXJlLnB1c2goJ2R0dC5TRU5USURPID0gOnRpcG9PcGVyYWNpb24nKTtcbiAgICAgIHBhcmFtcy50aXBvT3BlcmFjaW9uID0gU3RyaW5nKGZpbHRlcnMub3BlcmF0aW9uVHlwZSkudG9VcHBlckNhc2UoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFwcGx5UGFydGljaXBhbnRGaWx0ZXJzKFxuICAgIGZpbHRlcnM6IEd1aWRlRmlsdGVyc0R0byxcbiAgICB3aGVyZTogc3RyaW5nW10sXG4gICAgam9pbnM6IHN0cmluZ1tdLFxuICAgIHBhcmFtczogUmVjb3JkPHN0cmluZywgYW55PlxuICApOiB2b2lkIHtcbiAgICBpZiAoZmlsdGVycz8ucGFydGljaXBhbnQgfHwgZmlsdGVycz8ucGFydGljaXBhbnRUeXBlKSB7XG4gICAgICBjb25zdCBoYXNQYXJ0aWNpcGFudEpvaW4gPSBqb2lucy5zb21lKGpvaW4gPT4gam9pbi5pbmNsdWRlcygnRE9DUEFSVElDSVBBQ0lPTicpKTtcbiAgICAgIFxuICAgICAgaWYgKCFoYXNQYXJ0aWNpcGFudEpvaW4pIHtcbiAgICAgICAgam9pbnMucHVzaCgnSk9JTiBET0NVTUVOVE9TLkRPQ1BBUlRJQ0lQQUNJT04gZHAgT04gZHAuRE9DVU1FTlRPID0gZGQuSUQnKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGZpbHRlcnM/LnBhcnRpY2lwYW50VHlwZSkge1xuICAgICAgICB3aGVyZS5wdXNoKCdkcC5ST0wgPSA6dGlwb1BhcnRpY2lwYW50ZScpO1xuICAgICAgICBwYXJhbXMudGlwb1BhcnRpY2lwYW50ZSA9IFN0cmluZyhmaWx0ZXJzLnBhcnRpY2lwYW50VHlwZSkudG9VcHBlckNhc2UoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGZpbHRlcnM/LnBhcnRpY2lwYW50KSB7XG4gICAgICAgIGNvbnN0IHBhcnRpY2lwYW50VmFsdWUgPSBTdHJpbmcoZmlsdGVycy5wYXJ0aWNpcGFudCkudHJpbSgpO1xuICAgICAgICB3aGVyZS5wdXNoKCdVUFBFUihkcC5OT01CUkVQQVJUSUNJUEFOVEUpIExJS0UgVVBQRVIoOnBhcnRpY2lwYW50ZSknKTtcbiAgICAgICAgcGFyYW1zLnBhcnRpY2lwYW50ZSA9IGAlJHtwYXJ0aWNpcGFudFZhbHVlfSVgO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1eWUgdW4gQ1RFIHByZXZpbyBwYXJhIGZpbHRyYXIgcG9yIGZlY2hhIGRlIHphcnBlIGVmaWNpZW50ZW1lbnRlXG4gICAqL1xuICBwcml2YXRlIGJ1aWxkRmVjaGFaYXJwZUNURShmaWx0ZXJzOiBHdWlkZUZpbHRlcnNEdG8sIHBhcmFtczogUmVjb3JkPHN0cmluZywgYW55Pik6IHN0cmluZyB7XG4gICAgaWYgKCFmaWx0ZXJzPy5kYXRlVHlwZSB8fCBTdHJpbmcoZmlsdGVycy5kYXRlVHlwZSkudG9VcHBlckNhc2UoKSA9PT0gJ0ZFTScgfHwgXG4gICAgICAgIFN0cmluZyhmaWx0ZXJzLmRhdGVUeXBlKS50b1VwcGVyQ2FzZSgpID09PSAnRkVDUkVBQ0lPTicgfHwgXG4gICAgICAgIFN0cmluZyhmaWx0ZXJzLmRhdGVUeXBlKS50b1VwcGVyQ2FzZSgpID09PSAnRkVDQUNFUFRBJykge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIGlmICghZmlsdGVycz8uZnJvbSB8fCAhZmlsdGVycz8udG8pIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICAvLyBDVEUgcXVlIGZpbHRyYSBkb2N1bWVudG9zIHBvciBmZWNoYSBkZSB6YXJwZSBBTlRFUyBkZSBvdHJvcyBKT0lOc1xuICAgIC8vIEVzdG8gcmVkdWNlIGRyYW3DoXRpY2FtZW50ZSBlbCBkYXRhc2V0IHBhcmEgb3BlcmFjaW9uZXMgcG9zdGVyaW9yZXNcbiAgICByZXR1cm4gYGRvY3NfY29uX2ZlY2hhX3phcnBlIEFTIChcbiAgICAgICAgICBTRUxFQ1QgLyorIElOREVYKGRmZCBJRFhfRE9DRkVDSEFET0NfRE9DX1RJUE8pICovIERJU1RJTkNUXG4gICAgICAgICAgICBkZmQuRE9DVU1FTlRPIGFzIElEXG4gICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRPQ0ZFQ0hBRE9DVU1FTlRPIGRmZFxuICAgICAgICAgIFdIRVJFIGRmZC5USVBPRkVDSEEgPSAnRlpBUlBFJ1xuICAgICAgICAgICAgQU5EIGRmZC5GRUNIQSA+PSBUT19EQVRFKDpmZWNoYUZyb20sICdERC9NTS9ZWVlZIEhIMjQ6TUk6U1MnKVxuICAgICAgICAgICAgQU5EIGRmZC5GRUNIQSA8PSBUT19EQVRFKDpmZWNoYVRvLCAnREQvTU0vWVlZWSBISDI0Ok1JOlNTJylcbiAgICAgICAgKSxcbiAgICAgICAgYDtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGREb2N1bWVudG9zRmlsdHJhZG9zQ1RFKFxuICAgIHdoZXJlOiBzdHJpbmdbXSwgXG4gICAgam9pbnM6IHN0cmluZ1tdLCBcbiAgICBoYXNGZWNoYVphcnBlQ1RFOiBib29sZWFuXG4gICk6IHN0cmluZyB7XG4gICAgbGV0IGN0ZSA9IGBkb2N1bWVudG9zX2ZpbHRyYWRvcyBBUyAoU0VMRUNUIC8qKyBGSVJTVF9ST1dTKDIwKSBJTkRFWChkZCkgKi8gZGQuSUQsZGQuTlVNRVJPRVhURVJOTyxkZC5GRUNIQUVNSVNJT04sZGQuRkVDSEFDUkVBQ0lPTixkZC5OVU1FUk9BQ0VQVEFDSU9OLGUuVFBPX0RPQ1RPLGUuRkVDQUNFUCxlLk5VTUlERU5USUYsZS5udW1fY29ub2MgQVMgTlVNX0NPTk9DIEZST00gRE9DVU1FTlRPUy5ET0NET0NVTUVOVE9CQVNFIGRkYDtcbiAgICBpZiAoaGFzRmVjaGFaYXJwZUNURSkge1xuICAgICAgY3RlICs9ICcgSU5ORVIgSk9JTiBkb2NzX2Nvbl9mZWNoYV96YXJwZSBkZnogT04gZGQuSUQ9ZGZ6LklEJztcbiAgICB9XG4gICAgY3RlICs9ICcgTEVGVCBKT0lOIGRpbi5lbmNhX2RpbiBlIE9OIGRkLk5VTUVST0VYVEVSTk89ZS5udW1fY29ub2MgQU5EIGRkLk5VTUVST0FDRVBUQUNJT049ZS5udW1fbWFuaWYgQU5EIGUuYWNlcHRhZG9yZWNoYXphZG89XFwnQVxcJyBBTkQgZS52aWFfdHJhbj0xMSc7XG4gICAgaWYgKGpvaW5zLmxlbmd0aCkge1xuICAgICAgY3RlICs9ICcgJyArIGpvaW5zLmpvaW4oJyAnKTtcbiAgICB9XG4gICAgaWYgKHdoZXJlLmxlbmd0aCkge1xuICAgICAgY3RlICs9ICcgV0hFUkUgJyArIHdoZXJlLmpvaW4oJyBBTkQgJyk7XG4gICAgfVxuICAgIGN0ZSArPSAnIEdST1VQIEJZIGRkLklELGRkLk5VTUVST0VYVEVSTk8sZGQuRkVDSEFFTUlTSU9OLGRkLkZFQ0hBQ1JFQUNJT04sZGQuTlVNRVJPQUNFUFRBQ0lPTixlLlRQT19ET0NUTyxlLkZFQ0FDRVAsZS5OVU1JREVOVElGLGUubnVtX2Nvbm9jKSc7XG4gICAgcmV0dXJuIGN0ZTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRDb21tb25DVEVzKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAsXG4gICAgICAgIG1hbmlmaWVzdG9zX3JlbGFjaW9uYWRvcyBBUyAoXG4gICAgICAgICAgU0VMRUNUIFxuICAgICAgICAgICAgZGYuSUQgQVMgZ3VpYV9pZCxcbiAgICAgICAgICAgIGRtLklEIEFTIG1hbmlmaWVzdG9faWRcbiAgICAgICAgICBGUk9NIGRvY3VtZW50b3NfZmlsdHJhZG9zIGRmXG4gICAgICAgICAgSk9JTiBET0NVTUVOVE9TLkRPQ0RPQ1VNRU5UT0JBU0UgZG0gT04gZG0uTlVNRVJPRVhURVJOTyA9IGRmLk5VTUVST0FDRVBUQUNJT05cbiAgICAgICAgICBXSEVSRSBkbS5USVBPRE9DVU1FTlRPID0gJ01GVE9DJ1xuICAgICAgICAgICAgQU5EIGRtLkFDVElWTyA9ICdTJ1xuICAgICAgICApLFxuICAgICAgICBmZWNoYV9tYXhfZXN0YWRvcyBBUyAoXG4gICAgICAgICAgU0VMRUNUIFxuICAgICAgICAgICAgZGV0LkRPQ1VNRU5UTyxcbiAgICAgICAgICAgIE1BWChkZXQuRkVDSEFBQ1RJVkEpIEFTIG1heF9mZWNoYWFjdGl2YVxuICAgICAgICAgIEZST00gZG9jdW1lbnRvc19maWx0cmFkb3MgZGZcbiAgICAgICAgICBKT0lOIERPQ1VNRU5UT1MuRE9DRVNUQURPUyBkZXQgT04gZGV0LkRPQ1VNRU5UTyA9IGRmLklEXG4gICAgICAgICAgV0hFUkUgZGV0LkFDVElWQSA9IDphY3RpdmFFc3RhZG9cbiAgICAgICAgICAgIEFORCBkZXQuVElQT0VTVEFETyBOT1QgSU4gKCdGUExBWk8nLCdDT04gTUFSQ0EnLCdWSVMnLCdSRUMnKVxuICAgICAgICAgICAgQU5EIGRldC5USVBPRVNUQURPIElOICgnQUNQJywnQU5VJywnQ01QJywnQUNMJywnTU9EJywnQ01QRlAnLCAnQUNMUCcpXG4gICAgICAgICAgR1JPVVAgQlkgZGV0LkRPQ1VNRU5UT1xuICAgICAgICApLFxuICAgICAgICBlc3RhZG9fbWF4X3RpcG8gQVMgKFxuICAgICAgICAgIFNFTEVDVCBcbiAgICAgICAgICAgIGRldC5ET0NVTUVOVE8sXG4gICAgICAgICAgICBNQVgoZGV0LlRJUE9FU1RBRE8pIEFTIG1heF90aXBvZXN0YWRvLFxuICAgICAgICAgICAgZGV0LkZFQ0hBQUNUSVZBIEFTIGZlY2hhYWN0aXZhXG4gICAgICAgICAgRlJPTSBkb2N1bWVudG9zX2ZpbHRyYWRvcyBkZlxuICAgICAgICAgIEpPSU4gRE9DVU1FTlRPUy5ET0NFU1RBRE9TIGRldCBPTiBkZXQuRE9DVU1FTlRPID0gZGYuSURcbiAgICAgICAgICBKT0lOIGZlY2hhX21heF9lc3RhZG9zIGZtZSBPTiBmbWUuRE9DVU1FTlRPID0gZGV0LkRPQ1VNRU5UTyBcbiAgICAgICAgICAgIEFORCBmbWUubWF4X2ZlY2hhYWN0aXZhID0gZGV0LkZFQ0hBQUNUSVZBXG4gICAgICAgICAgV0hFUkUgZGV0LkFDVElWQSA9IDphY3RpdmFFc3RhZG9cbiAgICAgICAgICAgIEFORCBkZXQuVElQT0VTVEFETyBJTiAoJ0FDUCcsJ0FOVScsJ0NNUCcsJ0FDTCcsJ01PRCcsJ0NNUEZQJywgJ0FDTFAnKVxuICAgICAgICAgICAgQU5EIGRldC5USVBPRE9DVU1FTlRPID0gOnRpcG9Eb2N1bWVudG9Fc3RhZG9cbiAgICAgICAgICBHUk9VUCBCWSBkZXQuRE9DVU1FTlRPLCBkZXQuRkVDSEFBQ1RJVkFcbiAgICAgICAgKSxcbiAgICAgICAgZXN0YWRvc19vcmRlbmFkb3MgQVMgKFxuICAgICAgICAgIFNFTEVDVCBcbiAgICAgICAgICAgIGVtdC5ET0NVTUVOVE8sXG4gICAgICAgICAgICBlbXQubWF4X3RpcG9lc3RhZG8gQVMgVElQT0VTVEFETyxcbiAgICAgICAgICAgIGR0ZS5OT01CUkUsXG4gICAgICAgICAgICBlbXQuZmVjaGFhY3RpdmEgQVMgRkVDSEEsXG4gICAgICAgICAgICAxIEFTIHJuXG4gICAgICAgICAgRlJPTSBlc3RhZG9fbWF4X3RpcG8gZW10XG4gICAgICAgICAgSk9JTiBET0NVTUVOVE9TLkRPQ1RJUE9FU1RBRE8gZHRlIE9OIGVtdC5tYXhfdGlwb2VzdGFkbyA9IGR0ZS5DT0RJR09cbiAgICAgICAgICBXSEVSRSBkdGUuVElQT0RPQ1VNRU5UTyA9IDp0aXBvRG9jdW1lbnRvRXN0YWRvXG4gICAgICAgICksXG4gICAgICAgIGZlY2hhc19hcnJpYm8gQVMgKFxuICAgICAgICAgIFNFTEVDVCBcbiAgICAgICAgICAgIG1yLmd1aWFfaWQsXG4gICAgICAgICAgICBNQVgoZGZkLkZFQ0hBKSBBUyBmZWNoYUFycmlib1xuICAgICAgICAgIEZST00gbWFuaWZpZXN0b3NfcmVsYWNpb25hZG9zIG1yXG4gICAgICAgICAgSk9JTiBET0NVTUVOVE9TLkRPQ0ZFQ0hBRE9DVU1FTlRPIGRmZCBPTiBtci5tYW5pZmllc3RvX2lkID0gZGZkLkRPQ1VNRU5UTyBBTkQgZGZkLlRJUE9GRUNIQSA9ICdGQVJSSUJPJ1xuICAgICAgICAgIEdST1VQIEJZIG1yLmd1aWFfaWRcbiAgICAgICAgKSxcbiAgICAgICAgZmVjaGFzX2NvbmZvcm1hY2lvbiBBUyAoXG4gICAgICAgICAgU0VMRUNUIFxuICAgICAgICAgICAgbXIuZ3VpYV9pZCxcbiAgICAgICAgICAgIE1BWChkZXQuRkVDSEEpIEFTIGZlY2hhQ29uZm9ybWFjaW9uXG4gICAgICAgICAgRlJPTSBtYW5pZmllc3Rvc19yZWxhY2lvbmFkb3MgbXJcbiAgICAgICAgICBKT0lOIERPQ1VNRU5UT1MuRE9DRVNUQURPUyBkZXQgT04gbXIubWFuaWZpZXN0b19pZCA9IGRldC5ET0NVTUVOVE8gQU5EIGRldC5USVBPRVNUQURPID0gJ0NNUCdcbiAgICAgICAgICBHUk9VUCBCWSBtci5ndWlhX2lkXG4gICAgICAgICksXG4gICAgICAgIG1vdGl2b3Nfc2VsZWNjaW9uIEFTIChcbiAgICAgICAgICBTRUxFQ1QgXG4gICAgICAgICAgICBkZi5JRCBBUyBkb2N1bWVudG9faWQsXG4gICAgICAgICAgICBMSVNUQUdHKE9wRmlzY01hcmNhLkNvZGlnb09wRmlzY01vdGl2b01hcmNhIHx8ICctJyB8fCBNb3Rpdm8uRGVzY3JpcGNpb24sICcgLyAnKSBcbiAgICAgICAgICAgICAgV0lUSElOIEdST1VQIChPUkRFUiBCWSBPcEZpc2NNYXJjYS5Db2RpZ29PcEZpc2NNb3Rpdm9NYXJjYSkgQVMgbW90aXZvU2VsZWNjaW9uXG4gICAgICAgICAgRlJPTSBkb2N1bWVudG9zX2ZpbHRyYWRvcyBkZlxuICAgICAgICAgIEpPSU4gT3BGaXNjTWFyY2EgT04gT3BGaXNjTWFyY2EuSWREb2N1bWVudG8gPSBkZi5JRCBBTkQgT3BGaXNjTWFyY2EuQWN0aXZhID0gJ1MnXG4gICAgICAgICAgSk9JTiBPcEZpc2NNb3Rpdm9NYXJjYSBNb3Rpdm8gT04gTW90aXZvLkNvZGlnbyA9IE9wRmlzY01hcmNhLkNvZGlnb09wRmlzY01vdGl2b01hcmNhXG4gICAgICAgICAgR1JPVVAgQlkgZGYuSURcbiAgICAgICAgKSxcbiAgICAgICAgcmVzdWx0YWRvc19zZWxlY2Npb24gQVMgKFxuICAgICAgICAgIFNFTEVDVCBcbiAgICAgICAgICAgIGRmLklEIEFTIGRvY3VtZW50b19pZCxcbiAgICAgICAgICAgIExJU1RBR0coUkVTLmNvZGlnb29wZmlzY3Jlc3VsdGFkbyB8fCAnIC8gJyB8fCBSRVMub2JzZXJ2YWNpb24sICcgLyAnKSBcbiAgICAgICAgICAgICAgV0lUSElOIEdST1VQIChPUkRFUiBCWSBSRVMuY29kaWdvb3BmaXNjcmVzdWx0YWRvIHx8ICcgLyAnIHx8IFJFUy5vYnNlcnZhY2lvbiBBU0MpIEFTIHJlc3VsdGFkb1NlbGVjY2lvblxuICAgICAgICAgIEZST00gZG9jdW1lbnRvc19maWx0cmFkb3MgZGZcbiAgICAgICAgICBJTk5FUiBKT0lOIGZpc2NhbGl6YWNpb25lcy5PcEZpc2NNYXJjYSBGSVMgT04gRklTLklkRG9jdW1lbnRvID0gZGYuSUQgQU5EIEZJUy5BY3RpdmEgPSAnUydcbiAgICAgICAgICBJTk5FUiBKT0lOIE9wRmlzY1JlZ2lzdHJvRmlzY2FsaXphY2kgUkVHIE9OIFJFRy5JZE9wRmlzY0FjY2lvbkZpc2NhbGl6YWNpID0gRklTLklET1BGSVNDQUNDSU9ORklTQ0FMSVpBQ0kgQU5EIFJFRy5hY3Rpdm8gPSAnUydcbiAgICAgICAgICBJTk5FUiBKT0lOIE9QRklTQ1JFU1VMVEFET0FDQ0lPTiBSRVMgT04gUkVHLklkT3BGaXNjQWNjaW9uRmlzY2FsaXphY2kgPSBSRVMuSWRPcEZpc2NBY2Npb25GaXNjYWxpemFjaSBcbiAgICAgICAgICAgIEFORCBSRUcuSUQgPSBSRVMuaWRvcGZpc2NyZWdpc3Ryb2Zpc2NhbGl6YVxuICAgICAgICAgIEdST1VQIEJZIGRmLklEXG4gICAgICAgICksXG4gICAgICAgIG9ic2VydmFjaW9uZXNfZmFsdGFfc29icmEgQVMgKFxuICAgICAgICAgIFNFTEVDVCBcbiAgICAgICAgICAgIGRmLklEIEFTIGRvY3VtZW50b19pZCxcbiAgICAgICAgICAgIENBU0UgV0hFTiBFWElTVFMgKFNFTEVDVCAxIEZST00gRE9DVU1FTlRPUy5ET0NPQlNFUlZBQ0lPTiBvYnMgV0hFUkUgb2JzLkRPQ1VNRU5UTyA9IGRmLklEIEFORCBVUFBFUihvYnMuT0JTRVJWQUNJT04pIExJS0UgJyVGQUxUQSUnKSBUSEVOICdTaScgRUxTRSAnTm8nIEVORCBBUyBmYWx0YSxcbiAgICAgICAgICAgIENBU0UgV0hFTiBFWElTVFMgKFNFTEVDVCAxIEZST00gRE9DVU1FTlRPUy5ET0NPQlNFUlZBQ0lPTiBvYnMgV0hFUkUgb2JzLkRPQ1VNRU5UTyA9IGRmLklEIEFORCBVUFBFUihvYnMuT0JTRVJWQUNJT04pIExJS0UgJyVTT0JSQSUnKSBUSEVOICdTaScgRUxTRSAnTm8nIEVORCBBUyBzb2JyYVxuICAgICAgICAgIEZST00gZG9jdW1lbnRvc19maWx0cmFkb3MgZGZcbiAgICAgICAgKSxcbiAgICAgICAgY29uc2lnbmF0YXJpbyBBUyAoXG4gICAgICAgICAgU0VMRUNUIFxuICAgICAgICAgICAgZGYuSUQgQVMgZG9jdW1lbnRvX2lkLFxuICAgICAgICAgICAgTlZMKExJU1RBR0coZHAuTk9NQlJFUEFSVElDSVBBTlRFLCAnIC8gJykgXG4gICAgICAgICAgICAgIFdJVEhJTiBHUk9VUCAoT1JERVIgQlkgZHAuTk9NQlJFUEFSVElDSVBBTlRFKSwgJycpIEFTIG5vbWJyZVBhcnRpY2lwYW50ZVxuICAgICAgICAgIEZST00gZG9jdW1lbnRvc19maWx0cmFkb3MgZGZcbiAgICAgICAgICBMRUZUIEpPSU4gRE9DVU1FTlRPUy5ET0NQQVJUSUNJUEFDSU9OIGRwIE9OIGRwLkRPQ1VNRU5UTyA9IGRmLklEIEFORCBkcC5ST0wgPSAnQ09OUydcbiAgICAgICAgICBHUk9VUCBCWSBkZi5JRFxuICAgICAgICApLFxuICAgICAgICB0cmFuc3BvcnRlIEFTIChcbiAgICAgICAgICBTRUxFQ1QgXG4gICAgICAgICAgICBkZi5JRCBBUyBkb2N1bWVudG9faWQsXG4gICAgICAgICAgICBOVkwoZHQuVE9UQUxQRVNPIHx8ICcgJyB8fCBkdC5VTklEQURQRVNPLCAnJykgQVMgdG90YWxQZXNvQ29uVW5pZGFkLFxuICAgICAgICAgICAgTlZMKGR0LlRPVEFMSVRFTSwgMCkgQVMgdG90YWxJdGVtXG4gICAgICAgICAgRlJPTSBkb2N1bWVudG9zX2ZpbHRyYWRvcyBkZlxuICAgICAgICAgIExFRlQgSk9JTiBET0NUUkFOU1BPUlRFLkRPQ1RSQU5ET0NUUkFOU1BPUlRFIGR0IE9OIGR0LklEID0gZGYuSURcbiAgICAgICAgKSxcbiAgICAgICAgZGlwc19jb3VyaWVyIEFTIChcbiAgICAgICAgICBTRUxFQ1QgIFxuICAgICAgICAgICAgZGYuSUQgQVMgZG9jdW1lbnRvX2lkLFxuICAgICAgICAgICAgTUFYKGUuRkVDQUNFUCkgQVMgZmVjaGFEaXBzLFxuICAgICAgICAgICAgTUFYKGUuTlVNSURFTlRJRikgQVMgbnVtZXJvRGlwc1xuICAgICAgICAgIEZST00gZG9jdW1lbnRvc19maWx0cmFkb3MgZGZcbiAgICAgICAgICBMRUZUIEpPSU4gRElOLkVOQ0FfRElOIGUgXG4gICAgICAgICAgICBPTiBkZi5OVU1FUk9FWFRFUk5PID0gZS5OVU1fQ09OT0NcbiAgICAgICAgICAgQU5EIGUuQUNFUFRBRE9SRUNIQVpBRE8gPSAnQSdcbiAgICAgICAgICAgQU5EIGUuVklBX1RSQU4gPSAxMVxuICAgICAgICAgICBBTkQgZS5UUE9fRE9DVE8gSU4gKDEyMiwgMTIzKVxuICAgICAgICAgIEdST1VQIEJZIGRmLklEXG4gICAgICAgICksXG4gICAgICAgIGVzX2RpbiBBUyAoXG4gICAgICAgICAgU0VMRUNUIFxuICAgICAgICAgICAgZGYuSUQgQVMgZG9jdW1lbnRvX2lkLFxuICAgICAgICAgICAgQ0FTRSBcbiAgICAgICAgICAgICAgV0hFTiBNQVgoZS5OVU1fQ09OT0MpIElTIE5PVCBOVUxMIFRIRU4gJ1NpJ1xuICAgICAgICAgICAgICBFTFNFICdObydcbiAgICAgICAgICAgIEVORCBBUyBlc0RpblxuICAgICAgICAgIEZST00gZG9jdW1lbnRvc19maWx0cmFkb3MgZGZcbiAgICAgICAgICBMRUZUIEpPSU4gRElOLkVOQ0FfRElOIGUgXG4gICAgICAgICAgICBPTiBkZi5OVU1FUk9FWFRFUk5PID0gZS5OVU1fQ09OT0NcbiAgICAgICAgICAgQU5EIGUuVFBPX0RPQ1RPIE5PVCBJTiAoMTIyLCAxMjMpXG4gICAgICAgICAgR1JPVVAgQlkgZGYuSURcbiAgICAgICAgKWA7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkTWFpblF1ZXJ5KFxuICAgIGZlY2hhWmFycGVDVEU6IHN0cmluZyxcbiAgICBkb2N1bWVudG9zRmlsdHJhZG9zQ1RFOiBzdHJpbmcsXG4gICAgc29ydENvbHVtbjogc3RyaW5nLFxuICAgIG9yZGVyOiBzdHJpbmcsXG4gICAgaGFzU3RhdHVzRmlsdGVyOiBib29sZWFuXG4gICk6IHN0cmluZyB7XG4gICAgY29uc3QgY29tbW9uQ1RFcyA9IHRoaXMuYnVpbGRDb21tb25DVEVzKCk7XG4gICAgXG4gICAgY29uc3QgZXN0YWRvSm9pbiA9IGhhc1N0YXR1c0ZpbHRlciBcbiAgICAgID8gJ0lOTkVSIEpPSU4gZXN0YWRvc19vcmRlbmFkb3MgZW8gT04gZGYuSUQgPSBlby5ET0NVTUVOVE8gQU5EIGVvLnJuID0gMSBBTkQgZW8uVElQT0VTVEFETyA9IDplc3RhZG8nXG4gICAgICA6ICdMRUZUIEpPSU4gZXN0YWRvc19vcmRlbmFkb3MgZW8gT04gZGYuSUQgPSBlby5ET0NVTUVOVE8gQU5EIGVvLnJuID0gMSc7XG4gICAgXG4gICAgLy8gSW5jbHVpciBDVEUgZGUgZmVjaGEgemFycGUgc2kgZXhpc3RlXG4gICAgY29uc3Qgd2l0aENsYXVzZSA9IGZlY2hhWmFycGVDVEUgPyBgV0lUSCAke2ZlY2hhWmFycGVDVEV9YCA6ICdXSVRIICc7XG4gICAgXG4gICAgcmV0dXJuIGAke3dpdGhDbGF1c2V9JHtkb2N1bWVudG9zRmlsdHJhZG9zQ1RFfSR7Y29tbW9uQ1RFc31cbiAgICAgICAgU0VMRUNUIERJU1RJTkNUXG4gICAgICAgICAgZGYuSUQgYXMgaWQsXG4gICAgICAgICAgZGYuTlVNRVJPRVhURVJOTyBhcyBudW1lcm9FeHRlcm5vLFxuICAgICAgICAgIGRmLkZFQ0hBRU1JU0lPTiBhcyBmZWNoYUVtaXNpb24sXG4gICAgICAgICAgZGYuTlVNRVJPQUNFUFRBQ0lPTiBhcyBudW1lcm9BY2VwdGFjaW9uLFxuICAgICAgICAgIGVvLk5PTUJSRSBhcyBlc3RhZG8sXG4gICAgICAgICAgZmFyLmZlY2hhQXJyaWJvLFxuICAgICAgICAgIGRmLkZFQ0hBQ1JFQUNJT04gYXMgZmVjaGFBY2VwdGFjaW9uLFxuICAgICAgICAgIGZjLmZlY2hhQ29uZm9ybWFjaW9uLFxuICAgICAgICAgIE5WTChtcy5tb3Rpdm9TZWxlY2Npb24sICcnKSBBUyBtb3Rpdm9TZWxlY2Npb24sXG4gICAgICAgICAgTlZMKHJzLnJlc3VsdGFkb1NlbGVjY2lvbiwgJyAnKSBBUyByZXN1bHRhZG9TZWxlY2Npb24sXG4gICAgICAgICAgTlZMKG9ic19mcy5mYWx0YSwgJ05vJykgQVMgZmFsdGEsXG4gICAgICAgICAgTlZMKG9ic19mcy5zb2JyYSwgJ05vJykgQVMgc29icmEsXG4gICAgICAgICAgTlZMKGNvbnMubm9tYnJlUGFydGljaXBhbnRlLCAnJykgQVMgbm9tYnJlUGFydGljaXBhbnRlLFxuICAgICAgICAgIE5WTCh0cmFucy50b3RhbFBlc29Db25VbmlkYWQsICcnKSBBUyB0b3RhbFBlc28sXG4gICAgICAgICAgTlZMKHRyYW5zLnRvdGFsSXRlbSwgMCkgQVMgdG90YWxJdGVtLFxuICAgICAgICAgIGRpcHMuZmVjaGFEaXBzLFxuICAgICAgICAgIGRpcHMubnVtZXJvRGlwcyxcbiAgICAgICAgICBOVkwoZWQuZXNEaW4sICdObycpIEFTIGVzRGluXG4gICAgICAgIEZST00gZG9jdW1lbnRvc19maWx0cmFkb3MgZGZcbiAgICAgICAgJHtlc3RhZG9Kb2lufVxuICAgICAgICBMRUZUIEpPSU4gZmVjaGFzX2FycmlibyBmYXIgT04gZGYuSUQgPSBmYXIuZ3VpYV9pZFxuICAgICAgICBMRUZUIEpPSU4gZmVjaGFzX2NvbmZvcm1hY2lvbiBmYyBPTiBkZi5JRCA9IGZjLmd1aWFfaWRcbiAgICAgICAgTEVGVCBKT0lOIG1vdGl2b3Nfc2VsZWNjaW9uIG1zIE9OIGRmLklEID0gbXMuZG9jdW1lbnRvX2lkXG4gICAgICAgIExFRlQgSk9JTiByZXN1bHRhZG9zX3NlbGVjY2lvbiBycyBPTiBkZi5JRCA9IHJzLmRvY3VtZW50b19pZFxuICAgICAgICBMRUZUIEpPSU4gb2JzZXJ2YWNpb25lc19mYWx0YV9zb2JyYSBvYnNfZnMgT04gZGYuSUQgPSBvYnNfZnMuZG9jdW1lbnRvX2lkXG4gICAgICAgIExFRlQgSk9JTiBjb25zaWduYXRhcmlvIGNvbnMgT04gZGYuSUQgPSBjb25zLmRvY3VtZW50b19pZFxuICAgICAgICBMRUZUIEpPSU4gdHJhbnNwb3J0ZSB0cmFucyBPTiBkZi5JRCA9IHRyYW5zLmRvY3VtZW50b19pZFxuICAgICAgICBMRUZUIEpPSU4gZGlwc19jb3VyaWVyIGRpcHMgT04gZGYuSUQgPSBkaXBzLmRvY3VtZW50b19pZFxuICAgICAgICBMRUZUIEpPSU4gZXNfZGluIGVkIE9OIGRmLklEID0gZWQuZG9jdW1lbnRvX2lkXG4gICAgICAgIE9SREVSIEJZIGRmLiR7c29ydENvbHVtbn0gJHtvcmRlcn1gO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlTWFpblF1ZXJ5KFxuICAgIGRyaXZlcjogYW55LFxuICAgIG1haW5RdWVyeTogc3RyaW5nLFxuICAgIHBhcmFtczogUmVjb3JkPHN0cmluZywgYW55PixcbiAgICBvZmZzZXQ6IG51bWJlcixcbiAgICBsaW1pdDogbnVtYmVyXG4gICk6IFByb21pc2U8YW55W10+IHtcbiAgICBjb25zdCBwYWdpbmF0ZWRTcWwgPSBgXG4gICAgICBTRUxFQ1QgKiBGUk9NIChcbiAgICAgICAgU0VMRUNUIHEuKiwgUk9XTlVNIHJuIEZST00gKFxuICAgICAgICAgICR7bWFpblF1ZXJ5fVxuICAgICAgICApIHEgV0hFUkUgUk9XTlVNIDw9IDpvZmZzZXRMaW1pdFxuICAgICAgKSBXSEVSRSBybiA+IDpvZmZzZXRgO1xuXG4gICAgY29uc3QgW3F1ZXJ5LCBxdWVyeVBhcmFtc10gPSBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhwYWdpbmF0ZWRTcWwsIHBhcmFtcywge30pO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmRvY3VtZW50b0Jhc2VSZXBvc2l0b3J5LnF1ZXJ5KHF1ZXJ5LCBxdWVyeVBhcmFtcyk7XG4gIH1cblxuICBhc3luYyBsaXN0R3VpZGVzKGZpbHRlcnM6IEd1aWRlRmlsdGVyc0R0bywgdXNlcklkPzogbnVtYmVyKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgIGlmICh1c2VySWQpIHtcbiAgICAgIGZpbHRlcnMudXNlcklkID0gdXNlcklkO1xuICAgIH1cbiAgICBpZiAoIWZpbHRlcnM/Lm1hbmlmZXN0TnVtYmVyKSB7XG4gICAgICBmaWx0ZXJzLmlzU2ltcGxpZmllZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHBhZ2UgPSBOdW1iZXIoZmlsdGVycz8ucGFnZSB8fCAxKTtcbiAgICBjb25zdCBsaW1pdCA9IE51bWJlcihmaWx0ZXJzPy5saW1pdCB8fCAxMDAwMCk7XG4gICAgY29uc3Qgc29ydCA9IGZpbHRlcnM/LnNvcnQgfHwgJ2ZlY2hhQ3JlYWNpb24nO1xuICAgIGNvbnN0IG9yZGVyID0gKGZpbHRlcnM/Lm9yZGVyID09PSAnYXNjJyB8fCBmaWx0ZXJzPy5vcmRlciA9PT0gJ2Rlc2MnKSBcbiAgICAgID8gZmlsdGVycy5vcmRlci50b1VwcGVyQ2FzZSgpIGFzICdBU0MnIHwgJ0RFU0MnXG4gICAgICA6ICdERVNDJztcbiAgICBjb25zdCBzb3J0Q29sdW1uID0gdGhpcy5nZXRTb3J0Q29sdW1uKHNvcnQpO1xuICAgIGNvbnN0IG9mZnNldCA9IChwYWdlIC0gMSkgKiBsaW1pdDtcblxuICAgIGNvbnN0IHBhcmFtcyA9IHRoaXMuYnVpbGRCYXNlUGFyYW1zKG9mZnNldCwgbGltaXQpO1xuICAgIGNvbnN0IGpvaW5zOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IHsgd2hlcmUsIGhhc0ZlY2hhWmFycGVDVEUgfSA9IHRoaXMuYnVpbGRXaGVyZUNvbmRpdGlvbnMoZmlsdGVycywgcGFyYW1zLCBqb2lucyk7XG5cbiAgICAvLyBDb25maWd1cmFyIGZpbHRybyBkZSBlc3RhZG8gc2kgZXhpc3RlXG4gICAgY29uc3QgaGFzU3RhdHVzRmlsdGVyID0gISFmaWx0ZXJzPy5zdGF0dXM7XG4gICAgaWYgKGhhc1N0YXR1c0ZpbHRlcikge1xuICAgICAgcGFyYW1zLmVzdGFkbyA9IFN0cmluZyhmaWx0ZXJzLnN0YXR1cykudG9VcHBlckNhc2UoKTtcbiAgICB9XG5cbiAgICAvLyBDb25zdHJ1aXIgQ1RFIGRlIGZlY2hhIHphcnBlIHNpIGVzIG5lY2VzYXJpbyAocGFyYSBtw6F4aW1hIG9wdGltaXphY2nDs24pXG4gICAgY29uc3QgZmVjaGFaYXJwZUNURSA9IGhhc0ZlY2hhWmFycGVDVEUgPyB0aGlzLmJ1aWxkRmVjaGFaYXJwZUNURShmaWx0ZXJzLCBwYXJhbXMpIDogJyc7XG5cbiAgICAvLyBDb25zdHJ1aXIgQ1RFIGJhc2UgZGUgZG9jdW1lbnRvcyBmaWx0cmFkb3NcbiAgICBjb25zdCBkb2N1bWVudG9zRmlsdHJhZG9zQ1RFID0gdGhpcy5idWlsZERvY3VtZW50b3NGaWx0cmFkb3NDVEUod2hlcmUsIGpvaW5zLCBoYXNGZWNoYVphcnBlQ1RFKTtcblxuICAgIC8vIENvbnN0cnVpciBxdWVyeSBwcmluY2lwYWxcbiAgICBjb25zdCBtYWluUXVlcnkgPSB0aGlzLmJ1aWxkTWFpblF1ZXJ5KGZlY2hhWmFycGVDVEUsIGRvY3VtZW50b3NGaWx0cmFkb3NDVEUsIHNvcnRDb2x1bW4sIG9yZGVyLCBoYXNTdGF0dXNGaWx0ZXIpO1xuXG4gICAgY29uc3QgY29ubmVjdGlvbiA9IHRoaXMuZG9jdW1lbnRvQmFzZVJlcG9zaXRvcnkubWFuYWdlci5jb25uZWN0aW9uO1xuICAgIGNvbnN0IGRyaXZlciA9IGNvbm5lY3Rpb24uZHJpdmVyO1xuXG4gICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHRoaXMuZXhlY3V0ZU1haW5RdWVyeShkcml2ZXIsIG1haW5RdWVyeSwgcGFyYW1zLCBvZmZzZXQsIGxpbWl0KTtcbiAgICBjb25zb2xlLmxvZyhgVG90YWwgZGUgcmVzdWx0YWRvcyBvYnRlbmlkb3MgZGUgQkQ6ICR7cmVzdWx0cy5sZW5ndGh9YCk7XG4gICAgXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICAvKipcbiAgICogT2J0aWVuZSBsb3MgbsO6bWVyb3MgZXh0ZXJub3MgZGUgRE9DRE9DVU1FTlRPQkFTRSBwYXJhIGxvcyBJRHMgZGUgZ3XDrWFzIHByb3BvcmNpb25hZG9zXG4gICAqIEJ1c2NhIGVuIGxvdGUgKDEgYSAyMCBJRHMgbcOheGltbylcbiAgICogQHBhcmFtIGd1aWRlSWRzIC0gQXJyYXkgZGUgSURzIGRlIGRvY3VtZW50b3MgYmFzZSAobcOheGltbyAyMClcbiAgICogQHJldHVybnMgTWFwIGNvbiBlbCBJRCBjb21vIGNsYXZlIHkgZWwgbsO6bWVybyBleHRlcm5vIGNvbW8gdmFsb3JcbiAgICovXG4gIGFzeW5jIGdldEV4dGVybmFsTnVtYmVyc0J5SWRzKGd1aWRlSWRzOiBudW1iZXJbXSk6IFByb21pc2U8TWFwPG51bWJlciwgc3RyaW5nPj4ge1xuICAgIGlmICghZ3VpZGVJZHMgfHwgZ3VpZGVJZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGlmIChndWlkZUlkcy5sZW5ndGggPiAyMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBzZSBwdWVkZW4gYnVzY2FyIG3DoXMgZGUgMjAgbsO6bWVyb3MgZXh0ZXJub3MgcG9yIHNvbGljaXR1ZC4gTcOheGltbyBwZXJtaXRpZG86IDIwLicpO1xuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmxvZyhgQnVzY2FuZG8gbsO6bWVyb3MgZXh0ZXJub3MgcGFyYSAke2d1aWRlSWRzLmxlbmd0aH0gZ3XDrWFzYCk7XG5cbiAgICB0cnkge1xuICAgICAgLy8gQnVzY2FyIHRvZG9zIGxvcyBkb2N1bWVudG9zIGVuIHVuYSBzb2xhIGNvbnN1bHRhIHVzYW5kbyBJTlxuICAgICAgY29uc3QgZG9jdW1lbnRzID0gYXdhaXQgdGhpcy5kb2N1bWVudG9CYXNlUmVwb3NpdG9yeVxuICAgICAgICAuY3JlYXRlUXVlcnlCdWlsZGVyKCdkZCcpXG4gICAgICAgIC5zZWxlY3QoWydkZC5JRCcsICdkZC5OVU1FUk9FWFRFUk5PJ10pXG4gICAgICAgIC53aGVyZSgnZGQuSUQgSU4gKDouLi5pZHMpJywgeyBpZHM6IGd1aWRlSWRzIH0pXG4gICAgICAgIC5hbmRXaGVyZSgnZGQuVElQT0RPQ1VNRU5UTyA9IDp0aXBvRG9jdW1lbnRvJywgeyB0aXBvRG9jdW1lbnRvOiAnR1RJTUUnIH0pXG4gICAgICAgIC5hbmRXaGVyZSgnZGQuQUNUSVZPID0gOmFjdGl2bycsIHsgYWN0aXZvOiAnUycgfSlcbiAgICAgICAgLmdldFJhd01hbnkoKTtcblxuICAgICAgLy8gQ3JlYXIgdW4gTWFwIGNvbiBsb3MgcmVzdWx0YWRvc1xuICAgICAgY29uc3QgcmVzdWx0TWFwID0gbmV3IE1hcDxudW1iZXIsIHN0cmluZz4oKTtcbiAgICAgIGRvY3VtZW50cy5mb3JFYWNoKChkb2MpID0+IHtcbiAgICAgICAgcmVzdWx0TWFwLnNldChkb2MuSUQsIGRvYy5OVU1FUk9FWFRFUk5PKTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLmxvZ2dlci5sb2coYFNlIGVuY29udHJhcm9uICR7cmVzdWx0TWFwLnNpemV9IG7Dum1lcm9zIGV4dGVybm9zIGRlICR7Z3VpZGVJZHMubGVuZ3RofSBJRHMgc29saWNpdGFkb3NgKTtcblxuICAgICAgcmV0dXJuIHJlc3VsdE1hcDtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcihgRXJyb3Igb2J0ZW5pZW5kbyBuw7ptZXJvcyBleHRlcm5vczogJHtlcnJvci5tZXNzYWdlfWAsIGVycm9yLnN0YWNrKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxufVxuXG4iXX0=