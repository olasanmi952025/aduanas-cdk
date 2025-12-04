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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const entities_1 = require("./entities");
const typeorm_1 = require("@nestjs/typeorm");
const common_1 = require("@nestjs/common");
const date_util_1 = require("../../shared/utils/date.util");
const response_util_1 = require("../../shared/utils/response.util");
const cache_1 = require("../../shared/cache");
let DocumentsService = class DocumentsService {
    constructor(cacheService, documentoBaseRepository) {
        this.cacheService = cacheService;
        this.documentoBaseRepository = documentoBaseRepository;
        // TTL del cache en milisegundos (5 minutos)
        this.CACHE_TTL = 5 * 60 * 1000;
    }
    /**
     * Obtiene la columna de ordenamiento para la consulta
     * @param sort
     * @returns
     */
    getSortColumn(sort) {
        const sortColumnMap = {
            'fechaCreacion': 'FECHACREACION',
            'fechaEmision': 'FECHAEMISION',
            'numeroExterno': 'NUMEROEXTERNO',
            'id': 'ID',
        };
        return sortColumnMap[sort] || 'FECHACREACION';
    }
    generateCacheKey(filters, hasStatusFilter) {
        const cacheFilters = {};
        // Agregar filtros relevantes (sin paginación ni ordenamiento)
        if (filters?.guideNumber)
            cacheFilters.guideNumber = String(filters.guideNumber).trim();
        if (filters?.manifestNumber)
            cacheFilters.manifestNumber = String(filters.manifestNumber).trim();
        if (filters?.from)
            cacheFilters.from = date_util_1.DateUtil.createUTCDate(filters.from).toISOString();
        if (filters?.to)
            cacheFilters.to = date_util_1.DateUtil.createUTCDate(filters.to).toISOString();
        if (filters?.dateType)
            cacheFilters.dateType = String(filters.dateType);
        if (filters?.status)
            cacheFilters.status = String(filters.status);
        if (filters?.locationType)
            cacheFilters.locationType = String(filters.locationType);
        if (filters?.location)
            cacheFilters.location = String(filters.location).trim();
        if (filters?.participantType)
            cacheFilters.participantType = String(filters.participantType);
        if (filters?.participant)
            cacheFilters.participant = String(filters.participant).trim();
        if (filters?.operationType)
            cacheFilters.operationType = String(filters.operationType).trim();
        if (filters?.isSimplified !== undefined)
            cacheFilters.isSimplified = filters.isSimplified;
        if (filters?.marcas)
            cacheFilters.marcas = String(filters.marcas).trim();
        if (filters?.faltanteSobrante)
            cacheFilters.faltanteSobrante = String(filters.faltanteSobrante).trim();
        if (filters?.userId)
            cacheFilters.userId = Number(filters.userId);
        return this.cacheService.generateKey(cacheFilters);
    }
    /**
     * Construye los parámetros base para la consulta
     * @param offset
     * @param limit
     * @returns
     */
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
    /**
     * Construye las condiciones WHERE para la consulta
     * @param filters
     * @param params
     * @param joins
     * @returns objeto con where y si usa fecha zarpe CTE
     */
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
    /**
     * Aplica los filtros de fecha a la consulta
     * @param filters
     * @param where
     * @param joins
     * @param params
     * @returns true si es filtro de fecha zarpe (se manejará con CTE separado)
     */
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
    /**
     * Aplica los filtros de locación a la consulta
     * @param filters
     * @param where
     * @param joins
     * @param params
     */
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
    /**
     * Aplica los filtros de faltante/sobrante a la consulta
     * @param filters
     * @param where
     * @param joins
     * @param params
     */
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
    /**
     * Aplica los filtros de participante a la consulta
     * @param filters
     * @param where
     * @param joins
     * @param params
     */
    applyParticipantFilters(filters, where, joins, params) {
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
    /**
     * Construye un CTE previo para filtrar por fecha de zarpe eficientemente
     * @param filters
     * @param params
     * @returns
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
    /**
     * Construye el CTE para la consulta de documentos filtrados
     * @param where
     * @param joins
     * @param hasFechaZarpeCTE Indica si existe el CTE previo de fecha zarpe
     * @returns
     */
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
    /**
     * Construye los CTE comunes para la consulta
     * @param needsManifiestos Indica si se necesitan los manifiestos relacionados
     * @param hasStatusFilter Indica si hay filtro de estado
     * @returns
     */
    buildCommonCTEs(needsManifiestos = true, hasStatusFilter = false) {
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
    buildOptionalCTEs() {
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
    buildMainQuery(fechaZarpeCTE, documentosFiltradosCTE, sortColumn, order, hasStatusFilter, needsManifiestos = true) {
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
        return `${withClause}${documentosFiltradosCTE}${commonCTEs}${optionalCTEs}
        SELECT DISTINCT
          df.ID as id,
          df.NUMEROEXTERNO as numeroExterno,
          df.NUMEROACEPTACION as numeroAceptacion,
          df.FECHAEMISION as fechaEmision,
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
        ORDER BY df.${sortColumn} ${order}`;
    }
    /**
     * Construye la consulta para contar los documentos filtrados
     * @param fechaZarpeCTE CTE previo para filtrar por fecha zarpe (puede estar vacío)
     * @param documentosFiltradosCTE
     * @param hasStatusFilter
     * @returns
     */
    buildCountQuery(fechaZarpeCTE, documentosFiltradosCTE, hasStatusFilter) {
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
    async executeQueries(mainQuery, countQuery, params, offset, limit, cacheKey) {
        const connection = this.documentoBaseRepository.manager.connection;
        const driver = connection.driver;
        // Intentar obtener el total del cache
        let countResult;
        if (cacheKey) {
            const cachedTotalResult = this.cacheService.get(cacheKey, this.CACHE_TTL);
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
    async executeCountQuery(driver, countQuery, params) {
        const [query, queryParams] = driver.escapeQueryWithParameters(countQuery, params, {});
        const result = await this.documentoBaseRepository.query(query, queryParams);
        return Number(result?.[0]?.TOTAL || 0);
    }
    async executeMainQuery(driver, mainQuery, params, offset, limit) {
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
    async listGuides(filters, userId) {
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
                ? filters.order.toUpperCase()
                : 'DESC';
            const sortColumn = this.getSortColumn(sort);
            const offset = (page - 1) * limit;
            // Construir parámetros base y condiciones de filtrado
            const params = this.buildBaseParams(offset, limit);
            const joins = [];
            const { where, hasFechaZarpeCTE } = this.buildWhereConditions(filters, params, joins);
            // Configurar filtro de estado si existe
            let hasStatusFilter = !!filters?.status;
            if (hasStatusFilter) {
                params.estado = String(filters.status);
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
            return response_util_1.ResponseUtil.success({
                guides,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }, "Guías obtenidas exitosamente");
        }
        catch (error) {
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_1.CACHE_SERVICE)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.DocDocumentoBase))
], DocumentsService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRvcy5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZG9jdW1lbnRvcy5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUNBLHlDQUE4QztBQUM5Qyw2Q0FBbUQ7QUFDbkQsMkNBQW9EO0FBQ3BELDREQUF3RDtBQUV4RCxvRUFBZ0U7QUFDaEUsOENBQWtFO0FBRzNELElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWdCO0lBSTNCLFlBRUUsWUFBNEMsRUFFNUMsdUJBQXNFO1FBRnJELGlCQUFZLEdBQVosWUFBWSxDQUFlO1FBRTNCLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBOEI7UUFQeEUsNENBQTRDO1FBQzNCLGNBQVMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQztJQU94QyxDQUFDO0lBRUo7Ozs7T0FJRztJQUNLLGFBQWEsQ0FBQyxJQUFZO1FBQ2hDLE1BQU0sYUFBYSxHQUEyQjtZQUM1QyxlQUFlLEVBQUUsZUFBZTtZQUNoQyxjQUFjLEVBQUUsY0FBYztZQUM5QixlQUFlLEVBQUUsZUFBZTtZQUNoQyxJQUFJLEVBQUUsSUFBSTtTQUNYLENBQUM7UUFDRixPQUFPLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxlQUFlLENBQUM7SUFDaEQsQ0FBQztJQUdPLGdCQUFnQixDQUFDLE9BQXdCLEVBQUUsZUFBd0I7UUFDekUsTUFBTSxZQUFZLEdBQXdCLEVBQUUsQ0FBQztRQUM3Qyw4REFBOEQ7UUFDOUQsSUFBSSxPQUFPLEVBQUUsV0FBVztZQUFFLFlBQVksQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN4RixJQUFJLE9BQU8sRUFBRSxjQUFjO1lBQUUsWUFBWSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2pHLElBQUks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QUFVLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO2FBQ3JDLEVBQUUsOEJBQThCLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztZQUNwQixNQUFNLDRCQUFZLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFDLENBQUM7SUFDSCxDQUFDO0NBQ0YsQ0FBQTtBQTF5QlksNENBQWdCOzJCQUFoQixnQkFBZ0I7SUFENUIsSUFBQSxtQkFBVSxHQUFFO0lBTVIsV0FBQSxJQUFBLGVBQU0sRUFBQyxxQkFBYSxDQUFDLENBQUE7SUFFckIsV0FBQSxJQUFBLDBCQUFnQixFQUFDLDJCQUFnQixDQUFDLENBQUE7R0FQMUIsZ0JBQWdCLENBMHlCNUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSZXBvc2l0b3J5IH0gZnJvbSBcInR5cGVvcm1cIjtcclxuaW1wb3J0IHsgRG9jRG9jdW1lbnRvQmFzZSB9IGZyb20gXCIuL2VudGl0aWVzXCI7XHJcbmltcG9ydCB7IEluamVjdFJlcG9zaXRvcnkgfSBmcm9tIFwiQG5lc3Rqcy90eXBlb3JtXCI7XHJcbmltcG9ydCB7IEluamVjdGFibGUsIEluamVjdCB9IGZyb20gXCJAbmVzdGpzL2NvbW1vblwiO1xyXG5pbXBvcnQgeyBEYXRlVXRpbCB9IGZyb20gXCIuLi8uLi9zaGFyZWQvdXRpbHMvZGF0ZS51dGlsXCI7XHJcbmltcG9ydCB7IEd1aWRlRmlsdGVyc0R0byB9IGZyb20gXCIuL2R0by9ndWlkZS1maWx0ZXJzLmR0b1wiO1xyXG5pbXBvcnQgeyBSZXNwb25zZVV0aWwgfSBmcm9tIFwiLi4vLi4vc2hhcmVkL3V0aWxzL3Jlc3BvbnNlLnV0aWxcIjtcclxuaW1wb3J0IHsgSUNhY2hlU2VydmljZSwgQ0FDSEVfU0VSVklDRSB9IGZyb20gXCIuLi8uLi9zaGFyZWQvY2FjaGVcIjtcclxuXHJcbkBJbmplY3RhYmxlKClcclxuZXhwb3J0IGNsYXNzIERvY3VtZW50c1NlcnZpY2Uge1xyXG4gIC8vIFRUTCBkZWwgY2FjaGUgZW4gbWlsaXNlZ3VuZG9zICg1IG1pbnV0b3MpXHJcbiAgcHJpdmF0ZSByZWFkb25seSBDQUNIRV9UVEwgPSA1ICogNjAgKiAxMDAwO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIEBJbmplY3QoQ0FDSEVfU0VSVklDRSlcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgY2FjaGVTZXJ2aWNlOiBJQ2FjaGVTZXJ2aWNlLFxyXG4gICAgQEluamVjdFJlcG9zaXRvcnkoRG9jRG9jdW1lbnRvQmFzZSlcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZG9jdW1lbnRvQmFzZVJlcG9zaXRvcnk6IFJlcG9zaXRvcnk8RG9jRG9jdW1lbnRvQmFzZT4sXHJcbiAgKSB7fVxyXG5cclxuICAvKipcclxuICAgKiBPYnRpZW5lIGxhIGNvbHVtbmEgZGUgb3JkZW5hbWllbnRvIHBhcmEgbGEgY29uc3VsdGFcclxuICAgKiBAcGFyYW0gc29ydCBcclxuICAgKiBAcmV0dXJucyBcclxuICAgKi9cclxuICBwcml2YXRlIGdldFNvcnRDb2x1bW4oc29ydDogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IHNvcnRDb2x1bW5NYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XHJcbiAgICAgICdmZWNoYUNyZWFjaW9uJzogJ0ZFQ0hBQ1JFQUNJT04nLFxyXG4gICAgICAnZmVjaGFFbWlzaW9uJzogJ0ZFQ0hBRU1JU0lPTicsXHJcbiAgICAgICdudW1lcm9FeHRlcm5vJzogJ05VTUVST0VYVEVSTk8nLFxyXG4gICAgICAnaWQnOiAnSUQnLFxyXG4gICAgfTtcclxuICAgIHJldHVybiBzb3J0Q29sdW1uTWFwW3NvcnRdIHx8ICdGRUNIQUNSRUFDSU9OJztcclxuICB9XHJcblxyXG5cclxuICBwcml2YXRlIGdlbmVyYXRlQ2FjaGVLZXkoZmlsdGVyczogR3VpZGVGaWx0ZXJzRHRvLCBoYXNTdGF0dXNGaWx0ZXI6IGJvb2xlYW4pOiBzdHJpbmcge1xyXG4gICAgY29uc3QgY2FjaGVGaWx0ZXJzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XHJcbiAgICAvLyBBZ3JlZ2FyIGZpbHRyb3MgcmVsZXZhbnRlcyAoc2luIHBhZ2luYWNpw7NuIG5pIG9yZGVuYW1pZW50bylcclxuICAgIGlmIChmaWx0ZXJzPy5ndWlkZU51bWJlcikgY2FjaGVGaWx0ZXJzLmd1aWRlTnVtYmVyID0gU3RyaW5nKGZpbHRlcnMuZ3VpZGVOdW1iZXIpLnRyaW0oKTtcclxuICAgIGlmIChmaWx0ZXJzPy5tYW5pZmVzdE51bWJlcikgY2FjaGVGaWx0ZXJzLm1hbmlmZXN0TnVtYmVyID0gU3RyaW5nKGZpbHRlcnMubWFuaWZlc3ROdW1iZXIpLnRyaW0oKTtcclxuICAgIGlmIChmaWx0ZXJzPy5mcm9tKSBjYWNoZUZpbHRlcnMuZnJvbSA9IERhdGVVdGlsLmNyZWF0ZVVUQ0RhdGUoZmlsdGVycy5mcm9tKS50b0lTT1N0cmluZygpO1xyXG4gICAgaWYgKGZpbHRlcnM/LnRvKSBjYWNoZUZpbHRlcnMudG8gPSBEYXRlVXRpbC5jcmVhdGVVVENEYXRlKGZpbHRlcnMudG8pLnRvSVNPU3RyaW5nKCk7XHJcbiAgICBpZiAoZmlsdGVycz8uZGF0ZVR5cGUpIGNhY2hlRmlsdGVycy5kYXRlVHlwZSA9IFN0cmluZyhmaWx0ZXJzLmRhdGVUeXBlKTtcclxuICAgIGlmIChmaWx0ZXJzPy5zdGF0dXMpIGNhY2hlRmlsdGVycy5zdGF0dXMgPSBTdHJpbmcoZmlsdGVycy5zdGF0dXMpO1xyXG4gICAgaWYgKGZpbHRlcnM/LmxvY2F0aW9uVHlwZSkgY2FjaGVGaWx0ZXJzLmxvY2F0aW9uVHlwZSA9IFN0cmluZyhmaWx0ZXJzLmxvY2F0aW9uVHlwZSk7XHJcbiAgICBpZiAoZmlsdGVycz8ubG9jYXRpb24pIGNhY2hlRmlsdGVycy5sb2NhdGlvbiA9IFN0cmluZyhmaWx0ZXJzLmxvY2F0aW9uKS50cmltKCk7XHJcbiAgICBpZiAoZmlsdGVycz8ucGFydGljaXBhbnRUeXBlKSBjYWNoZUZpbHRlcnMucGFydGljaXBhbnRUeXBlID0gU3RyaW5nKGZpbHRlcnMucGFydGljaXBhbnRUeXBlKTtcclxuICAgIGlmIChmaWx0ZXJzPy5wYXJ0aWNpcGFudCkgY2FjaGVGaWx0ZXJzLnBhcnRpY2lwYW50ID0gU3RyaW5nKGZpbHRlcnMucGFydGljaXBhbnQpLnRyaW0oKTtcclxuICAgIGlmIChmaWx0ZXJzPy5vcGVyYXRpb25UeXBlKSBjYWNoZUZpbHRlcnMub3BlcmF0aW9uVHlwZSA9IFN0cmluZyhmaWx0ZXJzLm9wZXJhdGlvblR5cGUpLnRyaW0oKTtcclxuICAgIGlmIChmaWx0ZXJzPy5pc1NpbXBsaWZpZWQgIT09IHVuZGVmaW5lZCkgY2FjaGVGaWx0ZXJzLmlzU2ltcGxpZmllZCA9IGZpbHRlcnMuaXNTaW1wbGlmaWVkO1xyXG4gICAgaWYgKGZpbHRlcnM/Lm1hcmNhcykgY2FjaGVGaWx0ZXJzLm1hcmNhcyA9IFN0cmluZyhmaWx0ZXJzLm1hcmNhcykudHJpbSgpO1xyXG4gICAgaWYgKGZpbHRlcnM/LmZhbHRhbnRlU29icmFudGUpIGNhY2hlRmlsdGVycy5mYWx0YW50ZVNvYnJhbnRlID0gU3RyaW5nKGZpbHRlcnMuZmFsdGFudGVTb2JyYW50ZSkudHJpbSgpO1xyXG4gICAgaWYgKGZpbHRlcnM/LnVzZXJJZCkgY2FjaGVGaWx0ZXJzLnVzZXJJZCA9IE51bWJlcihmaWx0ZXJzLnVzZXJJZCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuY2FjaGVTZXJ2aWNlLmdlbmVyYXRlS2V5KGNhY2hlRmlsdGVycyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdHJ1eWUgbG9zIHBhcsOhbWV0cm9zIGJhc2UgcGFyYSBsYSBjb25zdWx0YVxyXG4gICAqIEBwYXJhbSBvZmZzZXQgXHJcbiAgICogQHBhcmFtIGxpbWl0IFxyXG4gICAqIEByZXR1cm5zIFxyXG4gICAqL1xyXG4gIHByaXZhdGUgYnVpbGRCYXNlUGFyYW1zKG9mZnNldDogbnVtYmVyLCBsaW1pdDogbnVtYmVyKTogUmVjb3JkPHN0cmluZywgYW55PiB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0aXBvRG9jdW1lbnRvOiAnR1RJTUUnLFxyXG4gICAgICBhY3Rpdm86ICdTJyxcclxuICAgICAgdGlwb0RvY3VtZW50b0VzdGFkbzogJ0dUSU1FJyxcclxuICAgICAgYWN0aXZhRXN0YWRvOiAnUycsXHJcbiAgICAgIG9mZnNldExpbWl0OiBvZmZzZXQgKyBsaW1pdCxcclxuICAgICAgb2Zmc2V0OiBvZmZzZXQsXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3RydXllIGxhcyBjb25kaWNpb25lcyBXSEVSRSBwYXJhIGxhIGNvbnN1bHRhXHJcbiAgICogQHBhcmFtIGZpbHRlcnMgXHJcbiAgICogQHBhcmFtIHBhcmFtcyBcclxuICAgKiBAcGFyYW0gam9pbnMgXHJcbiAgICogQHJldHVybnMgb2JqZXRvIGNvbiB3aGVyZSB5IHNpIHVzYSBmZWNoYSB6YXJwZSBDVEVcclxuICAgKi9cclxuICBwcml2YXRlIGJ1aWxkV2hlcmVDb25kaXRpb25zKFxyXG4gICAgZmlsdGVyczogR3VpZGVGaWx0ZXJzRHRvLFxyXG4gICAgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LFxyXG4gICAgam9pbnM6IHN0cmluZ1tdXHJcbiAgKTogeyB3aGVyZTogc3RyaW5nW107IGhhc0ZlY2hhWmFycGVDVEU6IGJvb2xlYW4gfSB7XHJcbiAgICBjb25zdCB3aGVyZTogc3RyaW5nW10gPSBbXTtcclxuICAgIGxldCBoYXNGZWNoYVphcnBlQ1RFID0gZmFsc2U7XHJcbiAgICBcclxuICAgIGlmIChmaWx0ZXJzPy5ndWlkZU51bWJlcikge1xyXG4gICAgICB3aGVyZS5wdXNoKCdkZC5OVU1FUk9FWFRFUk5PID0gOmd1aWRlTnVtYmVyJyk7XHJcbiAgICAgIHBhcmFtcy5ndWlkZU51bWJlciA9IFN0cmluZyhmaWx0ZXJzLmd1aWRlTnVtYmVyKS50cmltKCk7XHJcbiAgICAgIHdoZXJlLnB1c2goJ2RkLlRJUE9ET0NVTUVOVE8gPSA6dGlwb0RvY3VtZW50bycpO1xyXG4gICAgICB3aGVyZS5wdXNoKFwiZGQuQUNUSVZPID0gJ1MnXCIpO1xyXG4gICAgICBpZiAoZmlsdGVycz8udXNlcklkKSB7XHJcbiAgICAgICAgd2hlcmUucHVzaCgnZGQuSURFTUlTT1IgPSA6dXNlcklkJyk7XHJcbiAgICAgICAgcGFyYW1zLnVzZXJJZCA9IE51bWJlcihmaWx0ZXJzLnVzZXJJZCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHsgd2hlcmUsIGhhc0ZlY2hhWmFycGVDVEUgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGaWx0cm9zIGJhc2Ugc2llbXByZSBwcmVzZW50ZXNcclxuICAgIHdoZXJlLnB1c2goJ2RkLlRJUE9ET0NVTUVOVE8gPSA6dGlwb0RvY3VtZW50bycpO1xyXG4gICAgd2hlcmUucHVzaChcImRkLkFDVElWTyA9ICdTJ1wiKTtcclxuXHJcbiAgICAvLyBGaWx0cm8gZGUgdXNlcklkIHRlbXByYW5vIHBhcmEgbWVqb3IgcmVuZGltaWVudG9cclxuICAgIGlmIChmaWx0ZXJzPy51c2VySWQpIHtcclxuICAgICAgd2hlcmUucHVzaCgnZGQuSURFTUlTT1IgPSA6dXNlcklkJyk7XHJcbiAgICAgIHBhcmFtcy51c2VySWQgPSBOdW1iZXIoZmlsdGVycy51c2VySWQpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChmaWx0ZXJzPy5tYW5pZmVzdE51bWJlcikge1xyXG4gICAgICB3aGVyZS5wdXNoKCdkZC5OVU1FUk9BQ0VQVEFDSU9OID0gOm1hbmlmZXN0TnVtYmVyJyk7XHJcbiAgICAgIHBhcmFtcy5tYW5pZmVzdE51bWJlciA9IFN0cmluZyhmaWx0ZXJzLm1hbmlmZXN0TnVtYmVyKS50cmltKCk7XHJcblxyXG4gICAgICAvLyBTaSBoYXkgbWFuaWZlc3ROdW1iZXIgeSBlc3TDoSBlbiBtb2RvIHNpbXBsaWZpY2FkbywgcGVybWl0aXIgZmlsdHJhciBwb3IgZmVjaGFcclxuICAgICAgaWYgKGZpbHRlcnM/LmlzU2ltcGxpZmllZCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGhhc0ZlY2hhWmFycGVDVEUgPSB0aGlzLmFwcGx5RGF0ZUZpbHRlcnMoZmlsdGVycywgd2hlcmUsIGpvaW5zLCBwYXJhbXMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGlmICghZmlsdGVycz8ubWFuaWZlc3ROdW1iZXIpIHtcclxuICAgICAgaGFzRmVjaGFaYXJwZUNURSA9IHRoaXMuYXBwbHlEYXRlRmlsdGVycyhmaWx0ZXJzLCB3aGVyZSwgam9pbnMsIHBhcmFtcyk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5hcHBseUxvY2F0aW9uRmlsdGVycyhmaWx0ZXJzLCB3aGVyZSwgam9pbnMsIHBhcmFtcyk7XHJcblxyXG4gICAgdGhpcy5hcHBseVBhcnRpY2lwYW50RmlsdGVycyhmaWx0ZXJzLCB3aGVyZSwgam9pbnMsIHBhcmFtcyk7XHJcblxyXG4gICAgdGhpcy5hcHBseU9wZXJhdGlvblR5cGVGaWx0ZXJzKGZpbHRlcnMsIHdoZXJlLCBqb2lucywgcGFyYW1zKTtcclxuXHJcbiAgICB0aGlzLmFwcGx5TWFyY2FGaWx0ZXJzKGZpbHRlcnMsIHdoZXJlLCBqb2lucywgcGFyYW1zKTtcclxuXHJcbiAgICB0aGlzLmFwcGx5RmFsdGFudGVTb2JyYW50ZUZpbHRlcnMoZmlsdGVycywgd2hlcmUsIGpvaW5zLCBwYXJhbXMpO1xyXG5cclxuICAgIHJldHVybiB7IHdoZXJlLCBoYXNGZWNoYVphcnBlQ1RFIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcGxpY2EgbG9zIGZpbHRyb3MgZGUgZmVjaGEgYSBsYSBjb25zdWx0YVxyXG4gICAqIEBwYXJhbSBmaWx0ZXJzXHJcbiAgICogQHBhcmFtIHdoZXJlIFxyXG4gICAqIEBwYXJhbSBqb2lucyBcclxuICAgKiBAcGFyYW0gcGFyYW1zIFxyXG4gICAqIEByZXR1cm5zIHRydWUgc2kgZXMgZmlsdHJvIGRlIGZlY2hhIHphcnBlIChzZSBtYW5lamFyw6EgY29uIENURSBzZXBhcmFkbylcclxuICAgKi9cclxuICBwcml2YXRlIGFwcGx5RGF0ZUZpbHRlcnMoXHJcbiAgICBmaWx0ZXJzOiBHdWlkZUZpbHRlcnNEdG8sXHJcbiAgICB3aGVyZTogc3RyaW5nW10sXHJcbiAgICBqb2luczogc3RyaW5nW10sXHJcbiAgICBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIGFueT5cclxuICApOiBib29sZWFuIHtcclxuICAgIGlmICghZmlsdGVycz8uZGF0ZVR5cGUgJiYgIWZpbHRlcnM/LmZyb20gJiYgIWZpbHRlcnM/LnRvKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgbGV0IGNvbHVtbmFGZWNoYSA9ICdkZC5GRUNIQUVNSVNJT04nO1xyXG4gICAgbGV0IGRhdGVUeXBlID0gZmlsdGVycz8uZGF0ZVR5cGU7XHJcbiAgICBpZiAoIWRhdGVUeXBlICYmIChmaWx0ZXJzPy5mcm9tIHx8IGZpbHRlcnM/LnRvKSkge1xyXG4gICAgICBkYXRlVHlwZSA9ICdGRU0nO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBsZXQgaXNGZWNoYVphcnBlID0gZmFsc2U7XHJcbiAgICBcclxuICAgIGlmIChkYXRlVHlwZSkge1xyXG4gICAgICBjb25zdCBkYXRlVHlwZVVwcGVyID0gU3RyaW5nKGRhdGVUeXBlKS50b1VwcGVyQ2FzZSgpO1xyXG4gICAgICBpZiAoZGF0ZVR5cGVVcHBlciA9PT0gJ0ZFQ1JFQUNJT04nIHx8IGRhdGVUeXBlVXBwZXIgPT09ICdGRUNBQ0VQVEEnKSB7XHJcbiAgICAgICAgY29sdW1uYUZlY2hhID0gJ2RkLkZFQ0hBQ1JFQUNJT04nO1xyXG4gICAgICB9IGVsc2UgaWYgKGRhdGVUeXBlVXBwZXIgPT09ICdGRU0nKSB7XHJcbiAgICAgICAgY29sdW1uYUZlY2hhID0gJ2RkLkZFQ0hBRU1JU0lPTic7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRXMgZmVjaGEgZGUgemFycGUgLSBzZSBtYW5lamFyw6EgY29uIENURSBzZXBhcmFkbyBwYXJhIG3DoXhpbWEgZWZpY2llbmNpYVxyXG4gICAgICAgIC8vIE5PIGFncmVnYXIgZmlsdHJvcyBhcXXDrSwgZWwgQ1RFIHByZXZpbyB5YSBoYWJyw6EgZmlsdHJhZG8gbG9zIGRvY3VtZW50b3NcclxuICAgICAgICBpc0ZlY2hhWmFycGUgPSB0cnVlO1xyXG4gICAgICAgIGlmIChmaWx0ZXJzPy5mcm9tICYmIGZpbHRlcnM/LnRvKSB7XHJcbiAgICAgICAgICBjb25zdCBmcm9tRGF0ZSA9IERhdGVVdGlsLmNyZWF0ZVVUQ0RhdGUoZmlsdGVycy5mcm9tKTtcclxuICAgICAgICAgIGNvbnN0IGZyb21EYXRlU3RyID0gRGF0ZVV0aWwuZm9ybWF0RGF0ZUZvck9yYWNsZShmcm9tRGF0ZSk7XHJcbiAgICAgICAgICBjb25zdCB0b0RhdGUgPSBEYXRlVXRpbC5jcmVhdGVVVENEYXRlKGZpbHRlcnMudG8pO1xyXG4gICAgICAgICAgY29uc3QgdG9EYXRlU3RyID0gRGF0ZVV0aWwuZm9ybWF0RGF0ZUZvck9yYWNsZSh0b0RhdGUpO1xyXG4gICAgICAgICAgcGFyYW1zLmZlY2hhRnJvbSA9IGAke2Zyb21EYXRlU3RyfSAwMDowMDowMGA7XHJcbiAgICAgICAgICBwYXJhbXMuZmVjaGFUbyA9IGAke3RvRGF0ZVN0cn0gMjM6NTk6NTlgO1xyXG4gICAgICAgICAgcmV0dXJuIHRydWU7IC8vIEluZGljYXIgcXVlIGVzIGZlY2hhIHphcnBlIHBhcmEgdXNhciBDVEVcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBQYXJhIGZlY2hhcyBxdWUgTk8gc29uIHphcnBlLCBhcGxpY2FyIGZpbHRyb3Mgbm9ybWFsbWVudGVcclxuICAgIGlmICghaXNGZWNoYVphcnBlICYmIGZpbHRlcnM/LmZyb20gJiYgZmlsdGVycz8udG8pIHtcclxuICAgICAgY29uc3QgZnJvbURhdGUgPSBEYXRlVXRpbC5jcmVhdGVVVENEYXRlKGZpbHRlcnMuZnJvbSk7XHJcbiAgICAgIGNvbnN0IGZyb21EYXRlU3RyID0gRGF0ZVV0aWwuZm9ybWF0RGF0ZUZvck9yYWNsZShmcm9tRGF0ZSk7XHJcbiAgICAgIHdoZXJlLnB1c2goYCR7Y29sdW1uYUZlY2hhfSA+PSBUT19EQVRFKDpmZWNoYUZyb20sICdERC9NTS9ZWVlZIEhIMjQ6TUk6U1MnKWApO1xyXG4gICAgICBwYXJhbXMuZmVjaGFGcm9tID0gYCR7ZnJvbURhdGVTdHJ9IDAwOjAwOjAwYDtcclxuXHJcbiAgICAgIGNvbnN0IHRvRGF0ZSA9IERhdGVVdGlsLmNyZWF0ZVVUQ0RhdGUoZmlsdGVycy50byk7XHJcbiAgICAgIGNvbnN0IHRvRGF0ZVN0ciA9IERhdGVVdGlsLmZvcm1hdERhdGVGb3JPcmFjbGUodG9EYXRlKTtcclxuICAgICAgd2hlcmUucHVzaChgJHtjb2x1bW5hRmVjaGF9IDw9IFRPX0RBVEUoOmZlY2hhVG8sICdERC9NTS9ZWVlZIEhIMjQ6TUk6U1MnKWApO1xyXG4gICAgICBwYXJhbXMuZmVjaGFUbyA9IGAke3RvRGF0ZVN0cn0gMjM6NTk6NTlgO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBpc0ZlY2hhWmFycGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcGxpY2EgbG9zIGZpbHRyb3MgZGUgbG9jYWNpw7NuIGEgbGEgY29uc3VsdGFcclxuICAgKiBAcGFyYW0gZmlsdGVycyBcclxuICAgKiBAcGFyYW0gd2hlcmUgXHJcbiAgICogQHBhcmFtIGpvaW5zIFxyXG4gICAqIEBwYXJhbSBwYXJhbXMgXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhcHBseUxvY2F0aW9uRmlsdGVycyhcclxuICAgIGZpbHRlcnM6IEd1aWRlRmlsdGVyc0R0byxcclxuICAgIHdoZXJlOiBzdHJpbmdbXSxcclxuICAgIGpvaW5zOiBzdHJpbmdbXSxcclxuICAgIHBhcmFtczogUmVjb3JkPHN0cmluZywgYW55PlxyXG4gICk6IHZvaWQge1xyXG4gICAgaWYgKGZpbHRlcnM/LmxvY2F0aW9uVHlwZSB8fCBmaWx0ZXJzPy5sb2NhdGlvbikge1xyXG4gICAgICBjb25zdCBoYXNMb2NhdGlvbkpvaW4gPSBqb2lucy5zb21lKGpvaW4gPT4gam9pbi5pbmNsdWRlcygnRE9DTE9DQUNJT05ET0NVTUVOVE8nKSk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoIWhhc0xvY2F0aW9uSm9pbikge1xyXG4gICAgICAgIGpvaW5zLnB1c2goJ0pPSU4gRE9DVU1FTlRPUy5ET0NMT0NBQ0lPTkRPQ1VNRU5UTyBkbGQgT04gZGxkLkRPQ1VNRU5UTyA9IGRkLklEJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChmaWx0ZXJzPy5sb2NhdGlvblR5cGUpIHtcclxuICAgICAgICB3aGVyZS5wdXNoKCdkbGQuVElQT0xPQ0FDSU9OID0gOnRpcG9Mb2NhY2lvbicpO1xyXG4gICAgICAgIHBhcmFtcy50aXBvTG9jYWNpb24gPSBTdHJpbmcoZmlsdGVycy5sb2NhdGlvblR5cGUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZmlsdGVycz8ubG9jYXRpb24pIHtcclxuICAgICAgICB3aGVyZS5wdXNoKCdkbGQuSURMT0NBQ0lPTiA9IDppZExvY2FjaW9uJyk7XHJcbiAgICAgICAgcGFyYW1zLmlkTG9jYWNpb24gPSBOdW1iZXIoZmlsdGVycy5sb2NhdGlvbik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFwbGljYSBsb3MgZmlsdHJvcyBkZSBtYXJjYXMgYSBsYSBjb25zdWx0YVxyXG4gICAqIEBwYXJhbSBmaWx0ZXJzIFxyXG4gICAqIEBwYXJhbSB3aGVyZSBcclxuICAgKiBAcGFyYW0gam9pbnMgXHJcbiAgICogQHBhcmFtIHBhcmFtcyBcclxuICAgKi9cclxuICBwcml2YXRlIGFwcGx5TWFyY2FGaWx0ZXJzKFxyXG4gICAgZmlsdGVyczogR3VpZGVGaWx0ZXJzRHRvLFxyXG4gICAgd2hlcmU6IHN0cmluZ1tdLFxyXG4gICAgam9pbnM6IHN0cmluZ1tdLFxyXG4gICAgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XHJcbiAgKTogdm9pZCB7XHJcbiAgICBpZiAoZmlsdGVycz8ubWFyY2FzICYmIGZpbHRlcnMubWFyY2FzLnRyaW0oKSAhPT0gJycgJiYgZmlsdGVycy5tYXJjYXMudG9VcHBlckNhc2UoKSAhPT0gJ1RPRE9TJykge1xyXG4gICAgICBjb25zdCBoYXNNYXJjYUpvaW4gPSBqb2lucy5zb21lKGpvaW4gPT4gam9pbi5pbmNsdWRlcygnT3BGaXNjTWFyY2EnKSk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoIWhhc01hcmNhSm9pbikge1xyXG4gICAgICAgIC8vIEZpbHRyYXIgcG9yIGPDs2RpZ28gZXNwZWPDrWZpY28gZGUgbW90aXZvIGRlIHNlbGVjY2nDs25cclxuICAgICAgICBqb2lucy5wdXNoKCdKT0lOIEZJU0NBTElaQUNJT05FUy5PUEZJU0NNQVJDQSBvZm0gT04gb2ZtLklkRG9jdW1lbnRvID0gZGQuSUQgQU5EIG9mbS5BY3RpdmEgPSBcXCdTXFwnIEFORCBvZm0uQ29kaWdvT3BGaXNjTW90aXZvTWFyY2EgPSA6Y29kaWdvTWFyY2EnKTtcclxuICAgICAgICBwYXJhbXMuY29kaWdvTWFyY2EgPSBmaWx0ZXJzLm1hcmNhcy50b1VwcGVyQ2FzZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcGxpY2EgbG9zIGZpbHRyb3MgZGUgZmFsdGFudGUvc29icmFudGUgYSBsYSBjb25zdWx0YVxyXG4gICAqIEBwYXJhbSBmaWx0ZXJzIFxyXG4gICAqIEBwYXJhbSB3aGVyZSBcclxuICAgKiBAcGFyYW0gam9pbnMgXHJcbiAgICogQHBhcmFtIHBhcmFtcyBcclxuICAgKi9cclxuICBwcml2YXRlIGFwcGx5RmFsdGFudGVTb2JyYW50ZUZpbHRlcnMoXHJcbiAgICBmaWx0ZXJzOiBHdWlkZUZpbHRlcnNEdG8sXHJcbiAgICB3aGVyZTogc3RyaW5nW10sXHJcbiAgICBqb2luczogc3RyaW5nW10sXHJcbiAgICBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIGFueT5cclxuICApOiB2b2lkIHtcclxuICAgIGlmIChmaWx0ZXJzPy5mYWx0YW50ZVNvYnJhbnRlICYmIGZpbHRlcnMuZmFsdGFudGVTb2JyYW50ZS50cmltKCkgIT09ICcnICYmIGZpbHRlcnMuZmFsdGFudGVTb2JyYW50ZS50b1VwcGVyQ2FzZSgpICE9PSAnVE9EQVMnKSB7XHJcbiAgICAgIGNvbnN0IHRpcG9GaWx0cm8gPSBmaWx0ZXJzLmZhbHRhbnRlU29icmFudGUudG9VcHBlckNhc2UoKS50cmltKCk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAodGlwb0ZpbHRybyA9PT0gJ0ZBTFRBJykge1xyXG4gICAgICAgIHdoZXJlLnB1c2goYEVYSVNUUyAoXHJcbiAgICAgICAgICBTRUxFQ1QgMSBcclxuICAgICAgICAgIEZST00gRE9DVU1FTlRPUy5ET0NPQlNFUlZBQ0lPTiBvYnNfZmlsdHJvIFxyXG4gICAgICAgICAgV0hFUkUgb2JzX2ZpbHRyby5ET0NVTUVOVE8gPSBkZC5JRCBcclxuICAgICAgICAgICAgQU5EIFVQUEVSKG9ic19maWx0cm8uT0JTRVJWQUNJT04pIExJS0UgJyVGQUxUQSUnXHJcbiAgICAgICAgKWApO1xyXG4gICAgICB9IGVsc2UgaWYgKHRpcG9GaWx0cm8gPT09ICdTT0JSQScpIHtcclxuICAgICAgICB3aGVyZS5wdXNoKGBFWElTVFMgKFxyXG4gICAgICAgICAgU0VMRUNUIDEgXHJcbiAgICAgICAgICBGUk9NIERPQ1VNRU5UT1MuRE9DT0JTRVJWQUNJT04gb2JzX2ZpbHRybyBcclxuICAgICAgICAgIFdIRVJFIG9ic19maWx0cm8uRE9DVU1FTlRPID0gZGQuSUQgXHJcbiAgICAgICAgICAgIEFORCBVUFBFUihvYnNfZmlsdHJvLk9CU0VSVkFDSU9OKSBMSUtFICclU09CUkElJ1xyXG4gICAgICAgIClgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXBsaWNhIGxvcyBmaWx0cm9zIGRlIHBhcnRpY2lwYW50ZSBhIGxhIGNvbnN1bHRhXHJcbiAgICogQHBhcmFtIGZpbHRlcnMgXHJcbiAgICogQHBhcmFtIHdoZXJlIFxyXG4gICAqIEBwYXJhbSBqb2lucyBcclxuICAgKiBAcGFyYW0gcGFyYW1zIFxyXG4gICAqL1xyXG4gIHByaXZhdGUgYXBwbHlQYXJ0aWNpcGFudEZpbHRlcnMoXHJcbiAgICBmaWx0ZXJzOiBHdWlkZUZpbHRlcnNEdG8sXHJcbiAgICB3aGVyZTogc3RyaW5nW10sXHJcbiAgICBqb2luczogc3RyaW5nW10sXHJcbiAgICBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIGFueT5cclxuICApOiB2b2lkIHtcclxuICAgIC8vIFNpIGhheSBmaWx0cm8gZGUgcGFydGljaXBhbnRlLCBuZWNlc2l0YW1vcyBoYWNlciBKT0lOIGNvbiBsYSB0YWJsYSBkZSBwYXJ0aWNpcGFudGVzXHJcbiAgICBpZiAoZmlsdGVycz8ucGFydGljaXBhbnQgfHwgZmlsdGVycz8ucGFydGljaXBhbnRUeXBlKSB7XHJcbiAgICAgIGNvbnN0IGhhc1BhcnRpY2lwYW50Sm9pbiA9IGpvaW5zLnNvbWUoam9pbiA9PiBqb2luLmluY2x1ZGVzKCdET0NQQVJUSUNJUEFDSU9OJykpO1xyXG4gICAgICBcclxuICAgICAgaWYgKCFoYXNQYXJ0aWNpcGFudEpvaW4pIHtcclxuICAgICAgICBqb2lucy5wdXNoKCdKT0lOIERPQ1VNRU5UT1MuRE9DUEFSVElDSVBBQ0lPTiBkcCBPTiBkcC5ET0NVTUVOVE8gPSBkZC5JRCcpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZmlsdGVycz8ucGFydGljaXBhbnRUeXBlKSB7XHJcbiAgICAgICAgd2hlcmUucHVzaCgnZHAuUk9MID0gOnRpcG9QYXJ0aWNpcGFudGUnKTtcclxuICAgICAgICBwYXJhbXMudGlwb1BhcnRpY2lwYW50ZSA9IFN0cmluZyhmaWx0ZXJzLnBhcnRpY2lwYW50VHlwZSkudG9VcHBlckNhc2UoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGZpbHRlcnM/LnBhcnRpY2lwYW50KSB7XHJcbiAgICAgICAgY29uc3QgcGFydGljaXBhbnRWYWx1ZSA9IFN0cmluZyhmaWx0ZXJzLnBhcnRpY2lwYW50KS50cmltKCk7XHJcbiAgICAgICAgd2hlcmUucHVzaCgnVVBQRVIoZHAuTk9NQlJFUEFSVElDSVBBTlRFKSBMSUtFIFVQUEVSKDpwYXJ0aWNpcGFudGUpJyk7XHJcbiAgICAgICAgcGFyYW1zLnBhcnRpY2lwYW50ZSA9IGAlJHtwYXJ0aWNpcGFudFZhbHVlfSVgO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcGxpY2EgbG9zIGZpbHRyb3MgZGUgdGlwbyBkZSBvcGVyYWNpw7NuIGEgbGEgY29uc3VsdGFcclxuICAgKiBAcGFyYW0gZmlsdGVycyBcclxuICAgKiBAcGFyYW0gd2hlcmUgXHJcbiAgICogQHBhcmFtIGpvaW5zIFxyXG4gICAqIEBwYXJhbSBwYXJhbXMgXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhcHBseU9wZXJhdGlvblR5cGVGaWx0ZXJzKFxyXG4gICAgZmlsdGVyczogR3VpZGVGaWx0ZXJzRHRvLFxyXG4gICAgd2hlcmU6IHN0cmluZ1tdLFxyXG4gICAgam9pbnM6IHN0cmluZ1tdLFxyXG4gICAgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XHJcbiAgKTogdm9pZCB7XHJcbiAgICBpZiAoZmlsdGVycz8ub3BlcmF0aW9uVHlwZSAmJiBmaWx0ZXJzLm9wZXJhdGlvblR5cGUudHJpbSgpICE9PSAnJyAmJiBmaWx0ZXJzLm9wZXJhdGlvblR5cGUudG9VcHBlckNhc2UoKSAhPT0gJ1RPRE9TJykge1xyXG4gICAgICBjb25zdCBoYXNUcmFuc3BvcnRlSm9pbiA9IGpvaW5zLnNvbWUoam9pbiA9PiBqb2luLmluY2x1ZGVzKCdET0NUUkFORE9DVFJBTlNQT1JURScpKTtcclxuICAgICAgXHJcbiAgICAgIGlmICghaGFzVHJhbnNwb3J0ZUpvaW4pIHtcclxuICAgICAgICBqb2lucy5wdXNoKCdKT0lOIERPQ1RSQU5TUE9SVEUuRE9DVFJBTkRPQ1RSQU5TUE9SVEUgZHR0IE9OIGR0dC5JRCA9IGRkLklEJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHdoZXJlLnB1c2goJ2R0dC5TRU5USURPID0gOnRpcG9PcGVyYWNpb24nKTtcclxuICAgICAgcGFyYW1zLnRpcG9PcGVyYWNpb24gPSBTdHJpbmcoZmlsdGVycy5vcGVyYXRpb25UeXBlKS50b1VwcGVyQ2FzZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3RydXllIHVuIENURSBwcmV2aW8gcGFyYSBmaWx0cmFyIHBvciBmZWNoYSBkZSB6YXJwZSBlZmljaWVudGVtZW50ZVxyXG4gICAqIEBwYXJhbSBmaWx0ZXJzIFxyXG4gICAqIEBwYXJhbSBwYXJhbXMgXHJcbiAgICogQHJldHVybnMgXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBidWlsZEZlY2hhWmFycGVDVEUoZmlsdGVyczogR3VpZGVGaWx0ZXJzRHRvLCBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBzdHJpbmcge1xyXG4gICAgaWYgKCFmaWx0ZXJzPy5kYXRlVHlwZSB8fCBTdHJpbmcoZmlsdGVycy5kYXRlVHlwZSkudG9VcHBlckNhc2UoKSA9PT0gJ0ZFTScgfHwgXHJcbiAgICAgICAgU3RyaW5nKGZpbHRlcnMuZGF0ZVR5cGUpLnRvVXBwZXJDYXNlKCkgPT09ICdGRUNSRUFDSU9OJyB8fCBcclxuICAgICAgICBTdHJpbmcoZmlsdGVycy5kYXRlVHlwZSkudG9VcHBlckNhc2UoKSA9PT0gJ0ZFQ0FDRVBUQScpIHtcclxuICAgICAgcmV0dXJuICcnO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghZmlsdGVycz8uZnJvbSB8fCAhZmlsdGVycz8udG8pIHtcclxuICAgICAgcmV0dXJuICcnO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENURSBxdWUgZmlsdHJhIGRvY3VtZW50b3MgcG9yIGZlY2hhIGRlIHphcnBlIEFOVEVTIGRlIG90cm9zIEpPSU5zXHJcbiAgICAvLyBFc3RvIHJlZHVjZSBkcmFtw6F0aWNhbWVudGUgZWwgZGF0YXNldCBwYXJhIG9wZXJhY2lvbmVzIHBvc3RlcmlvcmVzXHJcbiAgICByZXR1cm4gYGRvY3NfY29uX2ZlY2hhX3phcnBlIEFTIChcclxuICAgICAgICAgIFNFTEVDVCAvKisgSU5ERVgoZGZkIElEWF9ET0NGRUNIQURPQ19ET0NfVElQTykgKi8gRElTVElOQ1RcclxuICAgICAgICAgICAgZGZkLkRPQ1VNRU5UTyBhcyBJRFxyXG4gICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRPQ0ZFQ0hBRE9DVU1FTlRPIGRmZFxyXG4gICAgICAgICAgV0hFUkUgZGZkLlRJUE9GRUNIQSA9ICdGWkFSUEUnXHJcbiAgICAgICAgICAgIEFORCBkZmQuRkVDSEEgPj0gVE9fREFURSg6ZmVjaGFGcm9tLCAnREQvTU0vWVlZWSBISDI0Ok1JOlNTJylcclxuICAgICAgICAgICAgQU5EIGRmZC5GRUNIQSA8PSBUT19EQVRFKDpmZWNoYVRvLCAnREQvTU0vWVlZWSBISDI0Ok1JOlNTJylcclxuICAgICAgICApLFxyXG4gICAgICAgIGA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdHJ1eWUgZWwgQ1RFIHBhcmEgbGEgY29uc3VsdGEgZGUgZG9jdW1lbnRvcyBmaWx0cmFkb3NcclxuICAgKiBAcGFyYW0gd2hlcmUgXHJcbiAgICogQHBhcmFtIGpvaW5zIFxyXG4gICAqIEBwYXJhbSBoYXNGZWNoYVphcnBlQ1RFIEluZGljYSBzaSBleGlzdGUgZWwgQ1RFIHByZXZpbyBkZSBmZWNoYSB6YXJwZVxyXG4gICAqIEByZXR1cm5zIFxyXG4gICAqL1xyXG4gIHByaXZhdGUgYnVpbGREb2N1bWVudG9zRmlsdHJhZG9zQ1RFKFxyXG4gICAgd2hlcmU6IHN0cmluZ1tdLCBcclxuICAgIGpvaW5zOiBzdHJpbmdbXSwgXHJcbiAgICBoYXNGZWNoYVphcnBlQ1RFOiBib29sZWFuXHJcbiAgKTogc3RyaW5nIHtcclxuICAgIGxldCBjdGUgPSBgZG9jdW1lbnRvc19maWx0cmFkb3MgQVMgKFNFTEVDVCAvKisgRklSU1RfUk9XUygyMCkgSU5ERVgoZGQpICovIGRkLklELGRkLk5VTUVST0VYVEVSTk8sZGQuRkVDSEFFTUlTSU9OLGRkLkZFQ0hBQ1JFQUNJT04sZGQuTlVNRVJPQUNFUFRBQ0lPTixlLlRQT19ET0NUTyxlLkZFQ0FDRVAsZS5OVU1JREVOVElGLGUubnVtX2Nvbm9jIEFTIE5VTV9DT05PQyBGUk9NIERPQ1VNRU5UT1MuRE9DRE9DVU1FTlRPQkFTRSBkZGA7XHJcbiAgICBpZiAoaGFzRmVjaGFaYXJwZUNURSkge1xyXG4gICAgICBjdGUgKz0gJyBJTk5FUiBKT0lOIGRvY3NfY29uX2ZlY2hhX3phcnBlIGRmeiBPTiBkZC5JRD1kZnouSUQnO1xyXG4gICAgfVxyXG4gICAgY3RlICs9ICcgTEVGVCBKT0lOIGRpbi5lbmNhX2RpbiBlIE9OIGRkLk5VTUVST0VYVEVSTk89ZS5udW1fY29ub2MgQU5EIGRkLk5VTUVST0FDRVBUQUNJT049ZS5udW1fbWFuaWYgQU5EIGUuYWNlcHRhZG9yZWNoYXphZG89XFwnQVxcJyBBTkQgZS52aWFfdHJhbj0xMSc7XHJcbiAgICBpZiAoam9pbnMubGVuZ3RoKSB7XHJcbiAgICAgIGN0ZSArPSAnICcgKyBqb2lucy5qb2luKCcgJyk7XHJcbiAgICB9XHJcbiAgICBpZiAod2hlcmUubGVuZ3RoKSB7XHJcbiAgICAgIGN0ZSArPSAnIFdIRVJFICcgKyB3aGVyZS5qb2luKCcgQU5EICcpO1xyXG4gICAgfVxyXG4gICAgY3RlICs9ICcgR1JPVVAgQlkgZGQuSUQsZGQuTlVNRVJPRVhURVJOTyxkZC5GRUNIQUVNSVNJT04sZGQuRkVDSEFDUkVBQ0lPTixkZC5OVU1FUk9BQ0VQVEFDSU9OLGUuVFBPX0RPQ1RPLGUuRkVDQUNFUCxlLk5VTUlERU5USUYsZS5udW1fY29ub2MpJztcclxuICAgIHJldHVybiBjdGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdHJ1eWUgbG9zIENURSBjb211bmVzIHBhcmEgbGEgY29uc3VsdGFcclxuICAgKiBAcGFyYW0gbmVlZHNNYW5pZmllc3RvcyBJbmRpY2Egc2kgc2UgbmVjZXNpdGFuIGxvcyBtYW5pZmllc3RvcyByZWxhY2lvbmFkb3NcclxuICAgKiBAcGFyYW0gaGFzU3RhdHVzRmlsdGVyIEluZGljYSBzaSBoYXkgZmlsdHJvIGRlIGVzdGFkb1xyXG4gICAqIEByZXR1cm5zIFxyXG4gICAqL1xyXG4gIHByaXZhdGUgYnVpbGRDb21tb25DVEVzKG5lZWRzTWFuaWZpZXN0b3M6IGJvb2xlYW4gPSB0cnVlLCBoYXNTdGF0dXNGaWx0ZXI6IGJvb2xlYW4gPSBmYWxzZSk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBtYW5pZmllc3Rvc0NURSA9IG5lZWRzTWFuaWZpZXN0b3MgPyBgLFxyXG4gICAgICAgIG1hbmlmaWVzdG9zX3JlbGFjaW9uYWRvcyBBUyAoXHJcbiAgICAgICAgICBTRUxFQ1QgXHJcbiAgICAgICAgICAgIGRmLklEIEFTIGd1aWFfaWQsXHJcbiAgICAgICAgICAgIGRtLklEIEFTIG1hbmlmaWVzdG9faWRcclxuICAgICAgICAgIEZST00gZG9jdW1lbnRvc19maWx0cmFkb3MgZGZcclxuICAgICAgICAgIEpPSU4gRE9DVU1FTlRPUy5ET0NET0NVTUVOVE9CQVNFIGRtIE9OIGRtLk5VTUVST0VYVEVSTk8gPSBkZi5OVU1FUk9BQ0VQVEFDSU9OXHJcbiAgICAgICAgICBXSEVSRSBkbS5USVBPRE9DVU1FTlRPID0gJ01GVE9DJ1xyXG4gICAgICAgICAgICBBTkQgZG0uQUNUSVZPID0gJ1MnXHJcbiAgICAgICAgKSxcclxuICAgICAgICBmZWNoYXNfYXJyaWJvIEFTIChcclxuICAgICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgICAgbXIuZ3VpYV9pZCxcclxuICAgICAgICAgICAgTUFYKGRmZC5GRUNIQSkgQVMgZmVjaGFBcnJpYm9cclxuICAgICAgICAgIEZST00gbWFuaWZpZXN0b3NfcmVsYWNpb25hZG9zIG1yXHJcbiAgICAgICAgICBKT0lOIERPQ1VNRU5UT1MuRE9DRkVDSEFET0NVTUVOVE8gZGZkIE9OIG1yLm1hbmlmaWVzdG9faWQgPSBkZmQuRE9DVU1FTlRPIEFORCBkZmQuVElQT0ZFQ0hBID0gJ0ZBUlJJQk8nXHJcbiAgICAgICAgICBHUk9VUCBCWSBtci5ndWlhX2lkXHJcbiAgICAgICAgKSxcclxuICAgICAgICBmZWNoYXNfY29uZm9ybWFjaW9uIEFTIChcclxuICAgICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgICAgbXIuZ3VpYV9pZCxcclxuICAgICAgICAgICAgTUFYKGRldC5GRUNIQSkgQVMgZmVjaGFDb25mb3JtYWNpb25cclxuICAgICAgICAgIEZST00gbWFuaWZpZXN0b3NfcmVsYWNpb25hZG9zIG1yXHJcbiAgICAgICAgICBKT0lOIERPQ1VNRU5UT1MuRE9DRVNUQURPUyBkZXQgT04gbXIubWFuaWZpZXN0b19pZCA9IGRldC5ET0NVTUVOVE8gQU5EIGRldC5USVBPRVNUQURPID0gJ0NNUCdcclxuICAgICAgICAgIEdST1VQIEJZIG1yLmd1aWFfaWRcclxuICAgICAgICApYCA6ICcnO1xyXG5cclxuICAgIHJldHVybiBgJHttYW5pZmllc3Rvc0NURX0sXHJcbiAgICAgICAgZmVjaGFfbWF4X2VzdGFkb3MgQVMgKFxyXG4gICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICBkZXQuRE9DVU1FTlRPLFxyXG4gICAgICAgICAgICBNQVgoZGV0LkZFQ0hBQUNUSVZBKSBBUyBtYXhfZmVjaGFhY3RpdmFcclxuICAgICAgICAgIEZST00gZG9jdW1lbnRvc19maWx0cmFkb3MgZGZcclxuICAgICAgICAgIEpPSU4gRE9DVU1FTlRPUy5ET0NFU1RBRE9TIGRldCBPTiBkZXQuRE9DVU1FTlRPID0gZGYuSURcclxuICAgICAgICAgIFdIRVJFIGRldC5BQ1RJVkEgPSA6YWN0aXZhRXN0YWRvXHJcbiAgICAgICAgICAgIEFORCBkZXQuVElQT0VTVEFETyBOT1QgSU4gKCdGUExBWk8nLCdDT04gTUFSQ0EnLCdWSVMnLCdSRUMnKVxyXG4gICAgICAgICAgICBBTkQgZGV0LlRJUE9FU1RBRE8gSU4gKCdBQ1AnLCdBTlUnLCdDTVAnLCdBQ0wnLCdNT0QnLCdDTVBGUCcsICdBQ0xQJylcclxuICAgICAgICAgIEdST1VQIEJZIGRldC5ET0NVTUVOVE9cclxuICAgICAgICApLFxyXG4gICAgICAgIGVzdGFkb19tYXhfdGlwbyBBUyAoXHJcbiAgICAgICAgICBTRUxFQ1QgXHJcbiAgICAgICAgICAgIGRldC5ET0NVTUVOVE8sXHJcbiAgICAgICAgICAgIE1BWChkZXQuVElQT0VTVEFETykgQVMgbWF4X3RpcG9lc3RhZG8sXHJcbiAgICAgICAgICAgIGRldC5GRUNIQUFDVElWQSBBUyBmZWNoYWFjdGl2YVxyXG4gICAgICAgICAgRlJPTSBkb2N1bWVudG9zX2ZpbHRyYWRvcyBkZlxyXG4gICAgICAgICAgSk9JTiBET0NVTUVOVE9TLkRPQ0VTVEFET1MgZGV0IE9OIGRldC5ET0NVTUVOVE8gPSBkZi5JRFxyXG4gICAgICAgICAgSk9JTiBmZWNoYV9tYXhfZXN0YWRvcyBmbWUgT04gZm1lLkRPQ1VNRU5UTyA9IGRldC5ET0NVTUVOVE8gXHJcbiAgICAgICAgICAgIEFORCBmbWUubWF4X2ZlY2hhYWN0aXZhID0gZGV0LkZFQ0hBQUNUSVZBXHJcbiAgICAgICAgICBXSEVSRSBkZXQuQUNUSVZBID0gOmFjdGl2YUVzdGFkb1xyXG4gICAgICAgICAgICBBTkQgZGV0LlRJUE9FU1RBRE8gSU4gKCdBQ1AnLCdBTlUnLCdDTVAnLCdBQ0wnLCdNT0QnLCdDTVBGUCcsICdBQ0xQJylcclxuICAgICAgICAgICAgQU5EIGRldC5USVBPRE9DVU1FTlRPID0gOnRpcG9Eb2N1bWVudG9Fc3RhZG9cclxuICAgICAgICAgIEdST1VQIEJZIGRldC5ET0NVTUVOVE8sIGRldC5GRUNIQUFDVElWQVxyXG4gICAgICAgICksXHJcbiAgICAgICAgZXN0YWRvc19vcmRlbmFkb3MgQVMgKFxyXG4gICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICBlbXQuRE9DVU1FTlRPLFxyXG4gICAgICAgICAgICBlbXQubWF4X3RpcG9lc3RhZG8gQVMgVElQT0VTVEFETyxcclxuICAgICAgICAgICAgZHRlLk5PTUJSRSxcclxuICAgICAgICAgICAgZW10LmZlY2hhYWN0aXZhIEFTIEZFQ0hBLFxyXG4gICAgICAgICAgICAxIEFTIHJuXHJcbiAgICAgICAgICBGUk9NIGVzdGFkb19tYXhfdGlwbyBlbXRcclxuICAgICAgICAgIEpPSU4gRE9DVU1FTlRPUy5ET0NUSVBPRVNUQURPIGR0ZSBPTiBlbXQubWF4X3RpcG9lc3RhZG8gPSBkdGUuQ09ESUdPXHJcbiAgICAgICAgICBXSEVSRSBkdGUuVElQT0RPQ1VNRU5UTyA9IDp0aXBvRG9jdW1lbnRvRXN0YWRvXHJcbiAgICAgICAgKWA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdHJ1eWUgQ1RFcyBvcGNpb25hbGVzIHBhcmEgZGF0b3MgYWRpY2lvbmFsZXMgKHNvbG8gY3VhbmRvIHNlIG5lY2VzaXRhbilcclxuICAgKiBAcmV0dXJucyBcclxuICAgKi9cclxuICBwcml2YXRlIGJ1aWxkT3B0aW9uYWxDVEVzKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYCxcclxuICAgICAgICBtb3Rpdm9zX3NlbGVjY2lvbiBBUyAoXHJcbiAgICAgICAgICBTRUxFQ1QgLyorIFVTRV9IQVNIKGRmIE9wRmlzY01hcmNhIE1vdGl2bykgKi9cclxuICAgICAgICAgICAgZGYuSUQgQVMgZG9jdW1lbnRvX2lkLFxyXG4gICAgICAgICAgICBMSVNUQUdHKE1vdGl2by5EZXNjcmlwY2lvbiwgJyAvICcpIFxyXG4gICAgICAgICAgICAgIFdJVEhJTiBHUk9VUCAoT1JERVIgQlkgT3BGaXNjTWFyY2EuQ29kaWdvT3BGaXNjTW90aXZvTWFyY2EpIEFTIG1vdGl2b1NlbGVjY2lvblxyXG4gICAgICAgICAgRlJPTSBkb2N1bWVudG9zX2ZpbHRyYWRvcyBkZlxyXG4gICAgICAgICAgSk9JTiBGSVNDQUxJWkFDSU9ORVMuT1BGSVNDTUFSQ0EgT3BGaXNjTWFyY2EgT04gT3BGaXNjTWFyY2EuSWREb2N1bWVudG8gPSBkZi5JRCBBTkQgT3BGaXNjTWFyY2EuQWN0aXZhID0gJ1MnXHJcbiAgICAgICAgICBKT0lOIEZJU0NBTElaQUNJT05FUy5PUEZJU0NNT1RJVk9NQVJDQSBNb3Rpdm8gT04gTW90aXZvLkNvZGlnbyA9IE9wRmlzY01hcmNhLkNvZGlnb09wRmlzY01vdGl2b01hcmNhXHJcbiAgICAgICAgICBHUk9VUCBCWSBkZi5JRFxyXG4gICAgICAgICksXHJcbiAgICAgICAgcmVzdWx0YWRvc19zZWxlY2Npb24gQVMgKFxyXG4gICAgICAgICAgU0VMRUNUIC8qKyBVU0VfSEFTSChkZiBGSVMgUkVHIFJFUykgKi9cclxuICAgICAgICAgICAgZGYuSUQgQVMgZG9jdW1lbnRvX2lkLFxyXG4gICAgICAgICAgICBMSVNUQUdHKFJFUy5jb2RpZ29vcGZpc2NyZXN1bHRhZG8gfHwgJyAvICcgfHwgUkVTLm9ic2VydmFjaW9uLCAnIC8gJykgXHJcbiAgICAgICAgICAgICAgV0lUSElOIEdST1VQIChPUkRFUiBCWSBSRVMuY29kaWdvb3BmaXNjcmVzdWx0YWRvIHx8ICcgLyAnIHx8IFJFUy5vYnNlcnZhY2lvbiBBU0MpIEFTIHJlc3VsdGFkb1NlbGVjY2lvblxyXG4gICAgICAgICAgRlJPTSBkb2N1bWVudG9zX2ZpbHRyYWRvcyBkZlxyXG4gICAgICAgICAgSU5ORVIgSk9JTiBGSVNDQUxJWkFDSU9ORVMuT1BGSVNDTUFSQ0EgRklTIE9OIEZJUy5JZERvY3VtZW50byA9IGRmLklEIEFORCBGSVMuQWN0aXZhID0gJ1MnXHJcbiAgICAgICAgICBJTk5FUiBKT0lOIEZJU0NBTElaQUNJT05FUy5PUEZJU0NSRUdJU1RST0ZJU0NBTElaQUNJIFJFRyBPTiBSRUcuSWRPcEZpc2NBY2Npb25GaXNjYWxpemFjaSA9IEZJUy5JRE9QRklTQ0FDQ0lPTkZJU0NBTElaQUNJIEFORCBSRUcuYWN0aXZvID0gJ1MnXHJcbiAgICAgICAgICBJTk5FUiBKT0lOIEZJU0NBTElaQUNJT05FUy5PUEZJU0NSRVNVTFRBRE9BQ0NJT04gUkVTIE9OIFJFRy5JZE9wRmlzY0FjY2lvbkZpc2NhbGl6YWNpID0gUkVTLklkT3BGaXNjQWNjaW9uRmlzY2FsaXphY2kgXHJcbiAgICAgICAgICAgIEFORCBSRUcuSUQgPSBSRVMuaWRvcGZpc2NyZWdpc3Ryb2Zpc2NhbGl6YVxyXG4gICAgICAgICAgR1JPVVAgQlkgZGYuSURcclxuICAgICAgICApLFxyXG4gICAgICAgIG9ic2VydmFjaW9uZXNfZmFsdGFfc29icmEgQVMgKFxyXG4gICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICBkZi5JRCBBUyBkb2N1bWVudG9faWQsXHJcbiAgICAgICAgICAgIENBU0UgV0hFTiBFWElTVFMgKFNFTEVDVCAxIEZST00gRE9DVU1FTlRPUy5ET0NPQlNFUlZBQ0lPTiBvYnMgV0hFUkUgb2JzLkRPQ1VNRU5UTyA9IGRmLklEIEFORCBVUFBFUihvYnMuT0JTRVJWQUNJT04pIExJS0UgJyVGQUxUQSUnKSBUSEVOICdTaScgRUxTRSAnTm8nIEVORCBBUyBmYWx0YSxcclxuICAgICAgICAgICAgQ0FTRSBXSEVOIEVYSVNUUyAoU0VMRUNUIDEgRlJPTSBET0NVTUVOVE9TLkRPQ09CU0VSVkFDSU9OIG9icyBXSEVSRSBvYnMuRE9DVU1FTlRPID0gZGYuSUQgQU5EIFVQUEVSKG9icy5PQlNFUlZBQ0lPTikgTElLRSAnJVNPQlJBJScpIFRIRU4gJ1NpJyBFTFNFICdObycgRU5EIEFTIHNvYnJhXHJcbiAgICAgICAgICBGUk9NIGRvY3VtZW50b3NfZmlsdHJhZG9zIGRmXHJcbiAgICAgICAgKSxcclxuICAgICAgICBjb25zaWduYXRhcmlvIEFTIChcclxuICAgICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgICAgZGYuSUQgQVMgZG9jdW1lbnRvX2lkLFxyXG4gICAgICAgICAgICBOVkwoTElTVEFHRyhkcC5OT01CUkVQQVJUSUNJUEFOVEUsICcgLyAnKSBcclxuICAgICAgICAgICAgICBXSVRISU4gR1JPVVAgKE9SREVSIEJZIGRwLk5PTUJSRVBBUlRJQ0lQQU5URSksICcnKSBBUyBub21icmVQYXJ0aWNpcGFudGVcclxuICAgICAgICAgIEZST00gZG9jdW1lbnRvc19maWx0cmFkb3MgZGZcclxuICAgICAgICAgIExFRlQgSk9JTiBET0NVTUVOVE9TLkRPQ1BBUlRJQ0lQQUNJT04gZHAgT04gZHAuRE9DVU1FTlRPID0gZGYuSUQgQU5EIGRwLlJPTCA9ICdDT05TJ1xyXG4gICAgICAgICAgR1JPVVAgQlkgZGYuSURcclxuICAgICAgICApLFxyXG4gICAgICAgIHRyYW5zcG9ydGUgQVMgKFxyXG4gICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICBkZi5JRCBBUyBkb2N1bWVudG9faWQsXHJcbiAgICAgICAgICAgIE5WTChkdC5UT1RBTFBFU08gfHwgJyAnIHx8IGR0LlVOSURBRFBFU08sICcnKSBBUyB0b3RhbFBlc29Db25VbmlkYWQsXHJcbiAgICAgICAgICAgIE5WTChkdC5UT1RBTElURU0sIDApIEFTIHRvdGFsSXRlbVxyXG4gICAgICAgICAgRlJPTSBkb2N1bWVudG9zX2ZpbHRyYWRvcyBkZlxyXG4gICAgICAgICAgTEVGVCBKT0lOIERPQ1RSQU5TUE9SVEUuRE9DVFJBTkRPQ1RSQU5TUE9SVEUgZHQgT04gZHQuSUQgPSBkZi5JRFxyXG4gICAgICAgICksXHJcbiAgICAgICAgZGlwc19jb3VyaWVyIEFTIChcclxuICAgICAgICAgIFNFTEVDVCAgXHJcbiAgICAgICAgICAgIGRmLklEIEFTIGRvY3VtZW50b19pZCxcclxuICAgICAgICAgICAgTUFYKGUuRkVDQUNFUCkgQVMgZmVjaGFEaXBzLFxyXG4gICAgICAgICAgICBNQVgoZS5OVU1JREVOVElGKSBBUyBudW1lcm9EaXBzXHJcbiAgICAgICAgICBGUk9NIGRvY3VtZW50b3NfZmlsdHJhZG9zIGRmXHJcbiAgICAgICAgICBMRUZUIEpPSU4gRElOLkVOQ0FfRElOIGUgXHJcbiAgICAgICAgICAgIE9OIGRmLk5VTUVST0VYVEVSTk8gPSBlLk5VTV9DT05PQ1xyXG4gICAgICAgICAgIEFORCBlLkFDRVBUQURPUkVDSEFaQURPID0gJ0EnXHJcbiAgICAgICAgICAgQU5EIGUuVklBX1RSQU4gPSAxMVxyXG4gICAgICAgICAgIEFORCBlLlRQT19ET0NUTyBJTiAoMTIyLCAxMjMpXHJcbiAgICAgICAgICBHUk9VUCBCWSBkZi5JRFxyXG4gICAgICAgICksXHJcbiAgICAgICAgZXNfZGluIEFTIChcclxuICAgICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgICAgZGYuSUQgQVMgZG9jdW1lbnRvX2lkLFxyXG4gICAgICAgICAgICBDQVNFIFxyXG4gICAgICAgICAgICAgIFdIRU4gTUFYKGUuTlVNX0NPTk9DKSBJUyBOT1QgTlVMTCBUSEVOICdTaSdcclxuICAgICAgICAgICAgICBFTFNFICdObydcclxuICAgICAgICAgICAgRU5EIEFTIGVzRGluXHJcbiAgICAgICAgICBGUk9NIGRvY3VtZW50b3NfZmlsdHJhZG9zIGRmXHJcbiAgICAgICAgICBMRUZUIEpPSU4gRElOLkVOQ0FfRElOIGUgXHJcbiAgICAgICAgICAgIE9OIGRmLk5VTUVST0VYVEVSTk8gPSBlLk5VTV9DT05PQ1xyXG4gICAgICAgICAgIEFORCBlLlRQT19ET0NUTyBOT1QgSU4gKDEyMiwgMTIzKVxyXG4gICAgICAgICAgR1JPVVAgQlkgZGYuSURcclxuICAgICAgICApYDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN0cnV5ZSBsYSBjb25zdWx0YSBwcmluY2lwYWwgcGFyYSBsYSBjb25zdWx0YSBkZSBkb2N1bWVudG9zIGZpbHRyYWRvc1xyXG4gICAqIEBwYXJhbSBmZWNoYVphcnBlQ1RFIENURSBwcmV2aW8gcGFyYSBmaWx0cmFyIHBvciBmZWNoYSB6YXJwZSAocHVlZGUgZXN0YXIgdmFjw61vKVxyXG4gICAqIEBwYXJhbSBkb2N1bWVudG9zRmlsdHJhZG9zQ1RFIFxyXG4gICAqIEBwYXJhbSBzb3J0Q29sdW1uIFxyXG4gICAqIEBwYXJhbSBvcmRlciBcclxuICAgKiBAcGFyYW0gaGFzU3RhdHVzRmlsdGVyIFxyXG4gICAqIEBwYXJhbSBuZWVkc01hbmlmaWVzdG9zIFxyXG4gICAqIEByZXR1cm5zIFxyXG4gICAqL1xyXG4gIHByaXZhdGUgYnVpbGRNYWluUXVlcnkoXHJcbiAgICBmZWNoYVphcnBlQ1RFOiBzdHJpbmcsXHJcbiAgICBkb2N1bWVudG9zRmlsdHJhZG9zQ1RFOiBzdHJpbmcsXHJcbiAgICBzb3J0Q29sdW1uOiBzdHJpbmcsXHJcbiAgICBvcmRlcjogc3RyaW5nLFxyXG4gICAgaGFzU3RhdHVzRmlsdGVyOiBib29sZWFuLFxyXG4gICAgbmVlZHNNYW5pZmllc3RvczogYm9vbGVhbiA9IHRydWVcclxuICApOiBzdHJpbmcge1xyXG4gICAgY29uc3QgY29tbW9uQ1RFcyA9IHRoaXMuYnVpbGRDb21tb25DVEVzKG5lZWRzTWFuaWZpZXN0b3MsIGhhc1N0YXR1c0ZpbHRlcik7XHJcbiAgICBjb25zdCBvcHRpb25hbENURXMgPSB0aGlzLmJ1aWxkT3B0aW9uYWxDVEVzKCk7XHJcbiAgICBcclxuICAgIGNvbnN0IGVzdGFkb0pvaW4gPSBoYXNTdGF0dXNGaWx0ZXIgXHJcbiAgICAgID8gJ0lOTkVSIEpPSU4gZXN0YWRvc19vcmRlbmFkb3MgZW8gT04gZGYuSUQgPSBlby5ET0NVTUVOVE8gQU5EIGVvLnJuID0gMSBBTkQgZW8uVElQT0VTVEFETyA9IDplc3RhZG8nXHJcbiAgICAgIDogJ0xFRlQgSk9JTiBlc3RhZG9zX29yZGVuYWRvcyBlbyBPTiBkZi5JRCA9IGVvLkRPQ1VNRU5UTyBBTkQgZW8ucm4gPSAxJztcclxuICAgIGNvbnN0IGpvaW5zID0gW2VzdGFkb0pvaW5dO1xyXG5cclxuICAgIGlmIChuZWVkc01hbmlmaWVzdG9zKSB7XHJcbiAgICAgIGpvaW5zLnB1c2goJ0xFRlQgSk9JTiBmZWNoYXNfYXJyaWJvIGZhciBPTiBkZi5JRCA9IGZhci5ndWlhX2lkJyk7XHJcbiAgICAgIGpvaW5zLnB1c2goJ0xFRlQgSk9JTiBmZWNoYXNfY29uZm9ybWFjaW9uIGZjIE9OIGRmLklEID0gZmMuZ3VpYV9pZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIGpvaW5zLnB1c2goJ0xFRlQgSk9JTiBtb3Rpdm9zX3NlbGVjY2lvbiBtcyBPTiBkZi5JRCA9IG1zLmRvY3VtZW50b19pZCcpO1xyXG4gICAgam9pbnMucHVzaCgnTEVGVCBKT0lOIHJlc3VsdGFkb3Nfc2VsZWNjaW9uIHJzIE9OIGRmLklEID0gcnMuZG9jdW1lbnRvX2lkJyk7XHJcbiAgICBqb2lucy5wdXNoKCdMRUZUIEpPSU4gb2JzZXJ2YWNpb25lc19mYWx0YV9zb2JyYSBvYnNfZnMgT04gZGYuSUQgPSBvYnNfZnMuZG9jdW1lbnRvX2lkJyk7XHJcbiAgICBqb2lucy5wdXNoKCdMRUZUIEpPSU4gY29uc2lnbmF0YXJpbyBjb25zIE9OIGRmLklEID0gY29ucy5kb2N1bWVudG9faWQnKTtcclxuICAgIGpvaW5zLnB1c2goJ0xFRlQgSk9JTiB0cmFuc3BvcnRlIHRyYW5zIE9OIGRmLklEID0gdHJhbnMuZG9jdW1lbnRvX2lkJyk7XHJcbiAgICBqb2lucy5wdXNoKCdMRUZUIEpPSU4gZGlwc19jb3VyaWVyIGRpcHMgT04gZGYuSUQgPSBkaXBzLmRvY3VtZW50b19pZCcpO1xyXG4gICAgam9pbnMucHVzaCgnTEVGVCBKT0lOIGVzX2RpbiBlZCBPTiBkZi5JRCA9IGVkLmRvY3VtZW50b19pZCcpO1xyXG4gICAgXHJcbiAgICAvLyBJbmNsdWlyIENURSBkZSBmZWNoYSB6YXJwZSBzaSBleGlzdGVcclxuICAgIGNvbnN0IHdpdGhDbGF1c2UgPSBmZWNoYVphcnBlQ1RFID8gYFdJVEggJHtmZWNoYVphcnBlQ1RFfWAgOiAnV0lUSCAnO1xyXG4gICAgXHJcbiAgICByZXR1cm4gYCR7d2l0aENsYXVzZX0ke2RvY3VtZW50b3NGaWx0cmFkb3NDVEV9JHtjb21tb25DVEVzfSR7b3B0aW9uYWxDVEVzfVxyXG4gICAgICAgIFNFTEVDVCBESVNUSU5DVFxyXG4gICAgICAgICAgZGYuSUQgYXMgaWQsXHJcbiAgICAgICAgICBkZi5OVU1FUk9FWFRFUk5PIGFzIG51bWVyb0V4dGVybm8sXHJcbiAgICAgICAgICBkZi5OVU1FUk9BQ0VQVEFDSU9OIGFzIG51bWVyb0FjZXB0YWNpb24sXHJcbiAgICAgICAgICBkZi5GRUNIQUVNSVNJT04gYXMgZmVjaGFFbWlzaW9uLFxyXG4gICAgICAgICAgZW8uTk9NQlJFIGFzIGVzdGFkbyxcclxuICAgICAgICAgICR7bmVlZHNNYW5pZmllc3RvcyA/ICdmYXIuZmVjaGFBcnJpYm8sJyA6ICdOVUxMIEFTIGZlY2hhQXJyaWJvLCd9XHJcbiAgICAgICAgICBkZi5GRUNIQUNSRUFDSU9OIGFzIGZlY2hhQWNlcHRhY2lvbixcclxuICAgICAgICAgICR7bmVlZHNNYW5pZmllc3RvcyA/ICdmYy5mZWNoYUNvbmZvcm1hY2lvbiwnIDogJ05VTEwgQVMgZmVjaGFDb25mb3JtYWNpb24sJ31cclxuICAgICAgICAgIE5WTChtcy5tb3Rpdm9TZWxlY2Npb24sICcnKSBBUyBtb3Rpdm9TZWxlY2Npb24sXHJcbiAgICAgICAgICBOVkwocnMucmVzdWx0YWRvU2VsZWNjaW9uLCAnICcpIEFTIHJlc3VsdGFkb1NlbGVjY2lvbixcclxuICAgICAgICAgIE5WTChvYnNfZnMuZmFsdGEsICdObycpIEFTIGZhbHRhLFxyXG4gICAgICAgICAgTlZMKG9ic19mcy5zb2JyYSwgJ05vJykgQVMgc29icmEsXHJcbiAgICAgICAgICBOVkwoY29ucy5ub21icmVQYXJ0aWNpcGFudGUsICcnKSBBUyBub21icmVQYXJ0aWNpcGFudGUsXHJcbiAgICAgICAgICBOVkwodHJhbnMudG90YWxQZXNvQ29uVW5pZGFkLCAnJykgQVMgdG90YWxQZXNvLFxyXG4gICAgICAgICAgTlZMKHRyYW5zLnRvdGFsSXRlbSwgMCkgQVMgdG90YWxJdGVtLFxyXG4gICAgICAgICAgZGlwcy5mZWNoYURpcHMsXHJcbiAgICAgICAgICBkaXBzLm51bWVyb0RpcHMsXHJcbiAgICAgICAgICBOVkwoZWQuZXNEaW4sICdObycpIEFTIGVzRGluXHJcbiAgICAgICAgRlJPTSBkb2N1bWVudG9zX2ZpbHRyYWRvcyBkZlxyXG4gICAgICAgICR7am9pbnMuam9pbignXFxuICAgICAgICAnKX1cclxuICAgICAgICBPUkRFUiBCWSBkZi4ke3NvcnRDb2x1bW59ICR7b3JkZXJ9YDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN0cnV5ZSBsYSBjb25zdWx0YSBwYXJhIGNvbnRhciBsb3MgZG9jdW1lbnRvcyBmaWx0cmFkb3NcclxuICAgKiBAcGFyYW0gZmVjaGFaYXJwZUNURSBDVEUgcHJldmlvIHBhcmEgZmlsdHJhciBwb3IgZmVjaGEgemFycGUgKHB1ZWRlIGVzdGFyIHZhY8OtbylcclxuICAgKiBAcGFyYW0gZG9jdW1lbnRvc0ZpbHRyYWRvc0NURSBcclxuICAgKiBAcGFyYW0gaGFzU3RhdHVzRmlsdGVyIFxyXG4gICAqIEByZXR1cm5zIFxyXG4gICAqL1xyXG4gIHByaXZhdGUgYnVpbGRDb3VudFF1ZXJ5KFxyXG4gICAgZmVjaGFaYXJwZUNURTogc3RyaW5nLFxyXG4gICAgZG9jdW1lbnRvc0ZpbHRyYWRvc0NURTogc3RyaW5nLFxyXG4gICAgaGFzU3RhdHVzRmlsdGVyOiBib29sZWFuXHJcbiAgKTogc3RyaW5nIHtcclxuICAgIC8vIEluY2x1aXIgQ1RFIGRlIGZlY2hhIHphcnBlIHNpIGV4aXN0ZVxyXG4gICAgY29uc3Qgd2l0aENsYXVzZSA9IGZlY2hhWmFycGVDVEUgPyBgV0lUSCAke2ZlY2hhWmFycGVDVEV9YCA6ICdXSVRIICc7XHJcbiAgICBcclxuICAgIC8vIFNpIG5vIGhheSBmaWx0cm8gZGUgZXN0YWRvLCBjb250YXIgZGlyZWN0YW1lbnRlIGxvcyBkb2N1bWVudG9zIGZpbHRyYWRvcyAobcOhcyByw6FwaWRvKVxyXG4gICAgaWYgKCFoYXNTdGF0dXNGaWx0ZXIpIHtcclxuICAgICAgcmV0dXJuIGAke3dpdGhDbGF1c2V9JHtkb2N1bWVudG9zRmlsdHJhZG9zQ1RFfVxyXG4gICAgICAgIFNFTEVDVCBDT1VOVCgxKSBBUyBUT1RBTCBcclxuICAgICAgICBGUk9NIGRvY3VtZW50b3NfZmlsdHJhZG9zYDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjb21tb25DVEVzID0gdGhpcy5idWlsZENvbW1vbkNURXMoZmFsc2UsIGhhc1N0YXR1c0ZpbHRlcik7XHJcbiAgICByZXR1cm4gYCR7d2l0aENsYXVzZX0ke2RvY3VtZW50b3NGaWx0cmFkb3NDVEV9JHtjb21tb25DVEVzfVxyXG4gICAgICAgIFNFTEVDVCBDT1VOVChESVNUSU5DVCBkZi5JRCkgQVMgVE9UQUwgXHJcbiAgICAgICAgRlJPTSBkb2N1bWVudG9zX2ZpbHRyYWRvcyBkZlxyXG4gICAgICAgIElOTkVSIEpPSU4gZXN0YWRvc19vcmRlbmFkb3MgZW8gT04gZGYuSUQgPSBlby5ET0NVTUVOVE8gXHJcbiAgICAgICAgICBBTkQgZW8ucm4gPSAxIFxyXG4gICAgICAgICAgQU5EIGVvLlRJUE9FU1RBRE8gPSA6ZXN0YWRvYDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVqZWN1dGEgbGFzIGNvbnN1bHRhcyBwcmluY2lwYWxlcyB5IGRlIGNvbnRlb1xyXG4gICAqIEBwYXJhbSBtYWluUXVlcnkgXHJcbiAgICogQHBhcmFtIGNvdW50UXVlcnkgXHJcbiAgICogQHBhcmFtIHBhcmFtcyBcclxuICAgKiBAcGFyYW0gb2Zmc2V0IFxyXG4gICAqIEBwYXJhbSBsaW1pdCBcclxuICAgKiBAcGFyYW0gY2FjaGVLZXkgXHJcbiAgICogQHJldHVybnMgXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlUXVlcmllcyhcclxuICAgIG1haW5RdWVyeTogc3RyaW5nLFxyXG4gICAgY291bnRRdWVyeTogc3RyaW5nLFxyXG4gICAgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LFxyXG4gICAgb2Zmc2V0OiBudW1iZXIsXHJcbiAgICBsaW1pdDogbnVtYmVyLFxyXG4gICAgY2FjaGVLZXk6IHN0cmluZyB8IG51bGxcclxuICApOiBQcm9taXNlPHsgZ3VpZGVzOiBhbnlbXTsgdG90YWw6IG51bWJlciB9PiB7XHJcbiAgICBjb25zdCBjb25uZWN0aW9uID0gdGhpcy5kb2N1bWVudG9CYXNlUmVwb3NpdG9yeS5tYW5hZ2VyLmNvbm5lY3Rpb247XHJcbiAgICBjb25zdCBkcml2ZXIgPSBjb25uZWN0aW9uLmRyaXZlcjtcclxuXHJcbiAgICAvLyBJbnRlbnRhciBvYnRlbmVyIGVsIHRvdGFsIGRlbCBjYWNoZVxyXG4gICAgbGV0IGNvdW50UmVzdWx0OiBudW1iZXI7XHJcbiAgICBpZiAoY2FjaGVLZXkpIHtcclxuICAgICAgY29uc3QgY2FjaGVkVG90YWxSZXN1bHQgPSB0aGlzLmNhY2hlU2VydmljZS5nZXQ8bnVtYmVyPihjYWNoZUtleSwgdGhpcy5DQUNIRV9UVEwpO1xyXG4gICAgICBjb25zdCBjYWNoZWRUb3RhbCA9IGF3YWl0IFByb21pc2UucmVzb2x2ZShjYWNoZWRUb3RhbFJlc3VsdCk7XHJcbiAgICAgIGlmIChjYWNoZWRUb3RhbCAhPT0gbnVsbCkge1xyXG4gICAgICAgIGNvbnN0IGd1aWRlc1Jlc3VsdCA9IGF3YWl0IHRoaXMuZXhlY3V0ZU1haW5RdWVyeShkcml2ZXIsIG1haW5RdWVyeSwgcGFyYW1zLCBvZmZzZXQsIGxpbWl0KTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgZ3VpZGVzOiBndWlkZXNSZXN1bHQsXHJcbiAgICAgICAgICB0b3RhbDogY2FjaGVkVG90YWwsXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IFtjb3VudFJlc3VsdEZyb21EYiwgZ3VpZGVzUmVzdWx0XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcclxuICAgICAgdGhpcy5leGVjdXRlQ291bnRRdWVyeShkcml2ZXIsIGNvdW50UXVlcnksIHBhcmFtcyksXHJcbiAgICAgIHRoaXMuZXhlY3V0ZU1haW5RdWVyeShkcml2ZXIsIG1haW5RdWVyeSwgcGFyYW1zLCBvZmZzZXQsIGxpbWl0KSxcclxuICAgIF0pO1xyXG5cclxuICAgIGNvdW50UmVzdWx0ID0gY291bnRSZXN1bHRGcm9tRGI7XHJcblxyXG4gICAgaWYgKGNhY2hlS2V5KSB7XHJcbiAgICAgIGNvbnN0IHNldFJlc3VsdCA9IHRoaXMuY2FjaGVTZXJ2aWNlLnNldChjYWNoZUtleSwgY291bnRSZXN1bHQsIHRoaXMuQ0FDSEVfVFRMKTtcclxuICAgICAgYXdhaXQgUHJvbWlzZS5yZXNvbHZlKHNldFJlc3VsdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZ3VpZGVzOiBndWlkZXNSZXN1bHQsXHJcbiAgICAgIHRvdGFsOiBjb3VudFJlc3VsdCxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFamVjdXRhIGxhIGNvbnN1bHRhIHBhcmEgY29udGFyIGxvcyBkb2N1bWVudG9zIGZpbHRyYWRvc1xyXG4gICAqIEBwYXJhbSBkcml2ZXIgXHJcbiAgICogQHBhcmFtIGNvdW50UXVlcnkgXHJcbiAgICogQHBhcmFtIHBhcmFtcyBcclxuICAgKiBAcmV0dXJucyBcclxuICAgKi9cclxuICBwcml2YXRlIGFzeW5jIGV4ZWN1dGVDb3VudFF1ZXJ5KFxyXG4gICAgZHJpdmVyOiBhbnksXHJcbiAgICBjb3VudFF1ZXJ5OiBzdHJpbmcsXHJcbiAgICBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIGFueT5cclxuICApOiBQcm9taXNlPG51bWJlcj4ge1xyXG4gICAgY29uc3QgW3F1ZXJ5LCBxdWVyeVBhcmFtc10gPSBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhjb3VudFF1ZXJ5LCBwYXJhbXMsIHt9KTtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZG9jdW1lbnRvQmFzZVJlcG9zaXRvcnkucXVlcnkocXVlcnksIHF1ZXJ5UGFyYW1zKTtcclxuICAgIHJldHVybiBOdW1iZXIocmVzdWx0Py5bMF0/LlRPVEFMIHx8IDApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlTWFpblF1ZXJ5KFxyXG4gICAgZHJpdmVyOiBhbnksXHJcbiAgICBtYWluUXVlcnk6IHN0cmluZyxcclxuICAgIHBhcmFtczogUmVjb3JkPHN0cmluZywgYW55PixcclxuICAgIG9mZnNldDogbnVtYmVyLFxyXG4gICAgbGltaXQ6IG51bWJlclxyXG4gICk6IFByb21pc2U8YW55W10+IHtcclxuICAgIC8vIE9wdGltaXphY2nDs246IFVzYXIgRkVUQ0ggRklSU1QgcGFyYSBtZWpvciByZW5kaW1pZW50byBlbiBPcmFjbGUgMTJjK1xyXG4gICAgLy8gU2kgbGEgdmVyc2nDs24gZGUgT3JhY2xlIGxvIHNvcG9ydGEsIGVzIG3DoXMgZWZpY2llbnRlIHF1ZSBST1dOVU1cclxuICAgIC8vIFBvciBjb21wYXRpYmlsaWRhZCwgbWFudGVuZW1vcyBST1dOVU0gcGVybyBvcHRpbWl6YW1vcyBsYSBlc3RydWN0dXJhXHJcbiAgICBjb25zdCBwYWdpbmF0ZWRTcWwgPSBgXHJcbiAgICAgIFNFTEVDVCAqIEZST00gKFxyXG4gICAgICAgIFNFTEVDVCBxLiosIFJPV05VTSBybiBGUk9NIChcclxuICAgICAgICAgICR7bWFpblF1ZXJ5fVxyXG4gICAgICAgICkgcSBXSEVSRSBST1dOVU0gPD0gOm9mZnNldExpbWl0XHJcbiAgICAgICkgV0hFUkUgcm4gPiA6b2Zmc2V0YDtcclxuXHJcbiAgICBjb25zdCBbcXVlcnksIHF1ZXJ5UGFyYW1zXSA9IGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKHBhZ2luYXRlZFNxbCwgcGFyYW1zLCB7fSk7XHJcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5kb2N1bWVudG9CYXNlUmVwb3NpdG9yeS5xdWVyeShxdWVyeSwgcXVlcnlQYXJhbXMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT2J0aWVuZSBsYXMgZ3XDrWFzIGZpbHRyYWRhc1xyXG4gICAqIEBwYXJhbSBmaWx0ZXJzIFxyXG4gICAqIEBwYXJhbSB1c2VySWQgXHJcbiAgICogQHJldHVybnMgXHJcbiAgICovXHJcbiAgYXN5bmMgbGlzdEd1aWRlcyhmaWx0ZXJzOiBHdWlkZUZpbHRlcnNEdG8sIHVzZXJJZD86IG51bWJlcikge1xyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gU2kgbm8gZXhpc3RlIG1hbmlmZXN0TnVtYmVyLCBlc3RhYmxlY2VyIGlzU2ltcGxpZmllZCBlbiBmYWxzZVxyXG4gICAgICBpZiAoIWZpbHRlcnM/Lm1hbmlmZXN0TnVtYmVyKSB7XHJcbiAgICAgICAgZmlsdGVycy5pc1NpbXBsaWZpZWQgPSBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gU2kgdXNlcklkIHZpZW5lIGNvbW8gcGFyw6FtZXRybyBwZXJvIG5vIGVzdMOhIGVuIGZpbHRlcnMsIGFncmVnYXJsb1xyXG4gICAgICBpZiAodXNlcklkICYmICFmaWx0ZXJzPy51c2VySWQpIHtcclxuICAgICAgICBmaWx0ZXJzLnVzZXJJZCA9IHVzZXJJZDtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gTm9ybWFsaXphciBwYXLDoW1ldHJvcyBkZSBwYWdpbmFjacOzbiB5IG9yZGVuYW1pZW50b1xyXG4gICAgICBjb25zdCBwYWdlID0gTnVtYmVyKGZpbHRlcnM/LnBhZ2UgfHwgMSk7XHJcbiAgICAgIGNvbnN0IGxpbWl0ID0gTnVtYmVyKGZpbHRlcnM/LmxpbWl0IHx8IDIwKTtcclxuICAgICAgY29uc3Qgc29ydCA9IGZpbHRlcnM/LnNvcnQgfHwgJ2ZlY2hhQ3JlYWNpb24nO1xyXG4gICAgICBjb25zdCBvcmRlciA9IChmaWx0ZXJzPy5vcmRlciA9PT0gJ2FzYycgfHwgZmlsdGVycz8ub3JkZXIgPT09ICdkZXNjJykgXHJcbiAgICAgICAgPyBmaWx0ZXJzLm9yZGVyLnRvVXBwZXJDYXNlKCkgYXMgJ0FTQycgfCAnREVTQydcclxuICAgICAgICA6ICdERVNDJztcclxuICAgICAgY29uc3Qgc29ydENvbHVtbiA9IHRoaXMuZ2V0U29ydENvbHVtbihzb3J0KTtcclxuICAgICAgY29uc3Qgb2Zmc2V0ID0gKHBhZ2UgLSAxKSAqIGxpbWl0O1xyXG5cclxuICAgICAgLy8gQ29uc3RydWlyIHBhcsOhbWV0cm9zIGJhc2UgeSBjb25kaWNpb25lcyBkZSBmaWx0cmFkb1xyXG4gICAgICBjb25zdCBwYXJhbXMgPSB0aGlzLmJ1aWxkQmFzZVBhcmFtcyhvZmZzZXQsIGxpbWl0KTtcclxuICAgICAgY29uc3Qgam9pbnM6IHN0cmluZ1tdID0gW107XHJcbiAgICAgIGNvbnN0IHsgd2hlcmUsIGhhc0ZlY2hhWmFycGVDVEUgfSA9IHRoaXMuYnVpbGRXaGVyZUNvbmRpdGlvbnMoZmlsdGVycywgcGFyYW1zLCBqb2lucyk7XHJcblxyXG4gICAgICAvLyBDb25maWd1cmFyIGZpbHRybyBkZSBlc3RhZG8gc2kgZXhpc3RlXHJcbiAgICAgIGxldCBoYXNTdGF0dXNGaWx0ZXIgPSAhIWZpbHRlcnM/LnN0YXR1cztcclxuICAgICAgaWYgKGhhc1N0YXR1c0ZpbHRlcikge1xyXG4gICAgICAgIHBhcmFtcy5lc3RhZG8gPSBTdHJpbmcoZmlsdGVycy5zdGF0dXMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBHZW5lcmFyIGNsYXZlIGRlIGNhY2hlIGJhc2FkYSBlbiBsb3MgZmlsdHJvcyAoc2luIHBhZ2luYWNpw7NuIG5pIG9yZGVuYW1pZW50bylcclxuICAgICAgY29uc3QgY2FjaGVLZXkgPSB0aGlzLmdlbmVyYXRlQ2FjaGVLZXkoZmlsdGVycywgaGFzU3RhdHVzRmlsdGVyKTtcclxuXHJcbiAgICAgIC8vIENvbnN0cnVpciBDVEUgZGUgZmVjaGEgemFycGUgc2kgZXMgbmVjZXNhcmlvIChwYXJhIG3DoXhpbWEgb3B0aW1pemFjacOzbilcclxuICAgICAgY29uc3QgZmVjaGFaYXJwZUNURSA9IGhhc0ZlY2hhWmFycGVDVEUgPyB0aGlzLmJ1aWxkRmVjaGFaYXJwZUNURShmaWx0ZXJzLCBwYXJhbXMpIDogJyc7XHJcblxyXG4gICAgICAvLyBDb25zdHJ1aXIgQ1RFIGJhc2UgZGUgZG9jdW1lbnRvcyBmaWx0cmFkb3NcclxuICAgICAgY29uc3QgZG9jdW1lbnRvc0ZpbHRyYWRvc0NURSA9IHRoaXMuYnVpbGREb2N1bWVudG9zRmlsdHJhZG9zQ1RFKHdoZXJlLCBqb2lucywgaGFzRmVjaGFaYXJwZUNURSk7XHJcblxyXG4gICAgICAvLyBEZXRlcm1pbmFyIHNpIG5lY2VzaXRhbW9zIGRhdG9zIGRlIG1hbmlmaWVzdG9zIChzb2xvIHNpIG5vIGhheSBmaWx0cm8gZXNwZWPDrWZpY28pXHJcbiAgICAgIGNvbnN0IG5lZWRzTWFuaWZpZXN0b3MgPSAhZmlsdGVycz8uZ3VpZGVOdW1iZXI7XHJcblxyXG4gICAgICAvLyBDb25zdHJ1aXIgcXVlcmllc1xyXG4gICAgICBjb25zdCBtYWluUXVlcnkgPSB0aGlzLmJ1aWxkTWFpblF1ZXJ5KGZlY2hhWmFycGVDVEUsIGRvY3VtZW50b3NGaWx0cmFkb3NDVEUsIHNvcnRDb2x1bW4sIG9yZGVyLCBoYXNTdGF0dXNGaWx0ZXIsIG5lZWRzTWFuaWZpZXN0b3MpO1xyXG4gICAgICBjb25zdCBjb3VudFF1ZXJ5ID0gdGhpcy5idWlsZENvdW50UXVlcnkoZmVjaGFaYXJwZUNURSwgZG9jdW1lbnRvc0ZpbHRyYWRvc0NURSwgaGFzU3RhdHVzRmlsdGVyKTtcclxuXHJcbiAgICAgIC8vIEVqZWN1dGFyIHF1ZXJpZXMgKHVzYW5kbyBjYWNoZSBzaSBlc3TDoSBkaXNwb25pYmxlKVxyXG4gICAgICBjb25zdCB7IGd1aWRlcywgdG90YWwgfSA9IGF3YWl0IHRoaXMuZXhlY3V0ZVF1ZXJpZXMobWFpblF1ZXJ5LCBjb3VudFF1ZXJ5LCBwYXJhbXMsIG9mZnNldCwgbGltaXQsIGNhY2hlS2V5KTtcclxuXHJcbiAgICAgIC8vIENvbnN0cnVpciByZXNwdWVzdGFcclxuICAgICAgcmV0dXJuIFJlc3BvbnNlVXRpbC5zdWNjZXNzKHtcclxuICAgICAgICBndWlkZXMsXHJcbiAgICAgICAgdG90YWwsXHJcbiAgICAgICAgcGFnZSxcclxuICAgICAgICBsaW1pdCxcclxuICAgICAgICB0b3RhbFBhZ2VzOiBNYXRoLmNlaWwodG90YWwgLyBsaW1pdCksXHJcbiAgICAgIH0sIFwiR3XDrWFzIG9idGVuaWRhcyBleGl0b3NhbWVudGVcIik7XHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIHRocm93IFJlc3BvbnNlVXRpbC5pbnRlcm5hbEVycm9yKGVycm9yKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19