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
        // Determinar la columna de ordenamiento
        // Con SELECT DISTINCT, Oracle requiere usar los alias del SELECT o expresiones completas
        let orderByColumn;
        if (sortColumn === 'ESTADO') {
            // Usar el alias del SELECT
            orderByColumn = 'estado';
        }
        else if (sortColumn === 'CONSIGNATARIO') {
            // Usar el alias del SELECT (nombreParticipante)
            orderByColumn = 'nombreParticipante';
        }
        else if (sortColumn === 'TOTALPESO') {
            // Usar el alias del SELECT (totalPeso)
            orderByColumn = 'totalPeso';
        }
        else if (sortColumn === 'CANTTOTAL') {
            // Usar el alias del SELECT (totalItem)
            orderByColumn = 'totalItem';
        }
        else if (sortColumn === 'MOTIVOMARCA') {
            // Usar el alias del SELECT (motivoSeleccion)
            orderByColumn = 'motivoSeleccion';
        }
        else if (sortColumn === 'FALTA') {
            // Usar el alias del SELECT (falta)
            orderByColumn = 'falta';
        }
        else if (sortColumn === 'SOBRA') {
            // Usar el alias del SELECT (sobra)
            orderByColumn = 'sobra';
        }
        else if (sortColumn === 'NRODIPS') {
            // Usar el alias del SELECT (numeroDips)
            orderByColumn = 'numeroDips';
        }
        else if (sortColumn === 'FECHADIPS') {
            // Usar el alias del SELECT (fechaDips)
            orderByColumn = 'fechaDips';
        }
        else if (sortColumn === 'TIENEDIN') {
            // Usar el alias del SELECT (esDin)
            orderByColumn = 'esDin';
        }
        else {
            // Para campos de df, usar el alias del SELECT si existe, sino el nombre de la columna
            const dfColumnMap = {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRvcy5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZG9jdW1lbnRvcy5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUNBLHlDQUE4QztBQUM5Qyw2Q0FBbUQ7QUFDbkQsMkNBQW9EO0FBQ3BELDREQUF3RDtBQUV4RCxvRUFBZ0U7QUFDaEUsOENBQWtFO0FBRzNELElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWdCO0lBSTNCLFlBRUUsWUFBNEMsRUFFNUMsdUJBQXNFO1FBRnJELGlCQUFZLEdBQVosWUFBWSxDQUFlO1FBRTNCLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBOEI7UUFQeEUsNENBQTRDO1FBQzNCLGNBQVMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQztJQU94QyxDQUFDO0lBRUo7Ozs7T0FJRztJQUNLLGFBQWEsQ0FBQyxJQUFZO1FBQ2hDLE1BQU0sYUFBYSxHQUEyQjtZQUM1QyxlQUFlLEVBQUUsZUFBZTtZQUNoQyxjQUFjLEVBQUUsY0FBYztZQUM5QixlQUFlLEVBQUUsZUFBZTtZQUNoQyxrQkFBa0IsRUFBRSxrQkFBa0I7WUFDdEMsUUFBUSxFQUFFLFFBQVE7WUFDbEIsZUFBZSxFQUFFLGVBQWU7WUFDaEMsV0FBVyxFQUFFLFdBQVc7WUFDeEIsV0FBVyxFQUFFLFdBQVc7WUFDeEIsYUFBYSxFQUFFLGFBQWE7WUFDNUIsT0FBTyxFQUFFLE9BQU87WUFDaEIsT0FBTyxFQUFFLE9BQU87WUFDaEIsU0FBUyxFQUFFLFNBQVM7WUFDcEIsV0FBVyxFQUFFLFdBQVc7WUFDeEIsVUFBVSxFQUFFLFVBQVU7WUFDdEIsSUFBSSxFQUFFLElBQUk7U0FDWCxDQUFDO1FBQ0YsT0FBTyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksZUFBZSxDQUFDO0lBQ2hELENBQUM7SUFHTyxnQkFBZ0IsQ0FBQyxPQUF3QixFQUFFLGVBQXdCO1FBQ3pFLE1BQU0sWUFBWSxHQUF3QixF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XHJcbmltcG9ydCB7IERvY0RvY3VtZW50b0Jhc2UgfSBmcm9tIFwiLi9lbnRpdGllc1wiO1xyXG5pbXBvcnQgeyBJbmplY3RSZXBvc2l0b3J5IH0gZnJvbSBcIkBuZXN0anMvdHlwZW9ybVwiO1xyXG5pbXBvcnQgeyBJbmplY3RhYmxlLCBJbmplY3QgfSBmcm9tIFwiQG5lc3Rqcy9jb21tb25cIjtcclxuaW1wb3J0IHsgRGF0ZVV0aWwgfSBmcm9tIFwiLi4vLi4vc2hhcmVkL3V0aWxzL2RhdGUudXRpbFwiO1xyXG5pbXBvcnQgeyBHdWlkZUZpbHRlcnNEdG8gfSBmcm9tIFwiLi9kdG8vZ3VpZGUtZmlsdGVycy5kdG9cIjtcclxuaW1wb3J0IHsgUmVzcG9uc2VVdGlsIH0gZnJvbSBcIi4uLy4uL3NoYXJlZC91dGlscy9yZXNwb25zZS51dGlsXCI7XHJcbmltcG9ydCB7IElDYWNoZVNlcnZpY2UsIENBQ0hFX1NFUlZJQ0UgfSBmcm9tIFwiLi4vLi4vc2hhcmVkL2NhY2hlXCI7XHJcblxyXG5ASW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBEb2N1bWVudHNTZXJ2aWNlIHtcclxuICAvLyBUVEwgZGVsIGNhY2hlIGVuIG1pbGlzZWd1bmRvcyAoNSBtaW51dG9zKVxyXG4gIHByaXZhdGUgcmVhZG9ubHkgQ0FDSEVfVFRMID0gNSAqIDYwICogMTAwMDtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBASW5qZWN0KENBQ0hFX1NFUlZJQ0UpXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNhY2hlU2VydmljZTogSUNhY2hlU2VydmljZSxcclxuICAgIEBJbmplY3RSZXBvc2l0b3J5KERvY0RvY3VtZW50b0Jhc2UpXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRvY3VtZW50b0Jhc2VSZXBvc2l0b3J5OiBSZXBvc2l0b3J5PERvY0RvY3VtZW50b0Jhc2U+LFxyXG4gICkge31cclxuXHJcbiAgLyoqXHJcbiAgICogT2J0aWVuZSBsYSBjb2x1bW5hIGRlIG9yZGVuYW1pZW50byBwYXJhIGxhIGNvbnN1bHRhXHJcbiAgICogQHBhcmFtIHNvcnQgXHJcbiAgICogQHJldHVybnMgXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRTb3J0Q29sdW1uKHNvcnQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBzb3J0Q29sdW1uTWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xyXG4gICAgICAnZmVjaGFDcmVhY2lvbic6ICdGRUNIQUNSRUFDSU9OJyxcclxuICAgICAgJ2ZlY2hhRW1pc2lvbic6ICdGRUNIQUVNSVNJT04nLFxyXG4gICAgICAnbnVtZXJvRXh0ZXJubyc6ICdOVU1FUk9FWFRFUk5PJyxcclxuICAgICAgJ251bWVyb0FjZXB0YWNpb24nOiAnTlVNRVJPQUNFUFRBQ0lPTicsXHJcbiAgICAgICdlc3RhZG8nOiAnRVNUQURPJyxcclxuICAgICAgJ2NvbnNpZ25hdGFyaW8nOiAnQ09OU0lHTkFUQVJJTycsXHJcbiAgICAgICd0b3RhbFBlc28nOiAnVE9UQUxQRVNPJyxcclxuICAgICAgJ2NhbnRUb3RhbCc6ICdDQU5UVE9UQUwnLFxyXG4gICAgICAnbW90aXZvTWFyY2EnOiAnTU9USVZPTUFSQ0EnLFxyXG4gICAgICAnZmFsdGEnOiAnRkFMVEEnLFxyXG4gICAgICAnc29icmEnOiAnU09CUkEnLFxyXG4gICAgICAnbnJvRElQUyc6ICdOUk9ESVBTJyxcclxuICAgICAgJ2ZlY2hhRElQUyc6ICdGRUNIQURJUFMnLFxyXG4gICAgICAndGllbmVESU4nOiAnVElFTkVESU4nLFxyXG4gICAgICAnaWQnOiAnSUQnLFxyXG4gICAgfTtcclxuICAgIHJldHVybiBzb3J0Q29sdW1uTWFwW3NvcnRdIHx8ICdGRUNIQUNSRUFDSU9OJztcclxuICB9XHJcblxyXG5cclxuICBwcml2YXRlIGdlbmVyYXRlQ2FjaGVLZXkoZmlsdGVyczogR3VpZGVGaWx0ZXJzRHRvLCBoYXNTdGF0dXNGaWx0ZXI6IGJvb2xlYW4pOiBzdHJpbmcge1xyXG4gICAgY29uc3QgY2FjaGVGaWx0ZXJzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XHJcbiAgICAvLyBBZ3JlZ2FyIGZpbHRyb3MgcmVsZXZhbnRlcyAoc2luIHBhZ2luYWNpw7NuIG5pIG9yZGVuYW1pZW50bylcclxuICAgIGlmIChmaWx0ZXJzPy5ndWlkZU51bWJlcikgY2FjaGVGaWx0ZXJzLmd1aWRlTnVtYmVyID0gU3RyaW5nKGZpbHRlcnMuZ3VpZGVOdW1iZXIpLnRyaW0oKTtcclxuICAgIGlmIChmaWx0ZXJzPy5tYW5pZmVzdE51bWJlcikgY2FjaGVGaWx0ZXJzLm1hbmlmZXN0TnVtYmVyID0gU3RyaW5nKGZpbHRlcnMubWFuaWZlc3ROdW1iZXIpLnRyaW0oKTtcclxuICAgIGlmIChmaWx0ZXJzPy5mcm9tKSBjYWNoZUZpbHRlcnMuZnJvbSA9IERhdGVVdGlsLmNyZWF0ZVVUQ0RhdGUoZmlsdGVycy5mcm9tKS50b0lTT1N0cmluZygpO1xyXG4gICAgaWYgKGZpbHRlcnM/LnRvKSBjYWNoZUZpbHRlcnMudG8gPSBEYXRlVXRpbC5jcmVhdGVVVENEYXRlKGZpbHRlcnMudG8pLnRvSVNPU3RyaW5nKCk7XHJcbiAgICBpZiAoZmlsdGVycz8uZGF0ZVR5cGUpIGNhY2hlRmlsdGVycy5kYXRlVHlwZSA9IFN0cmluZyhmaWx0ZXJzLmRhdGVUeXBlKTtcclxuICAgIGlmIChmaWx0ZXJzPy5zdGF0dXMpIGNhY2hlRmlsdGVycy5zdGF0dXMgPSBTdHJpbmcoZmlsdGVycy5zdGF0dXMpO1xyXG4gICAgaWYgKGZpbHRlcnM/LmxvY2F0aW9uVHlwZSkgY2FjaGVGaWx0ZXJzLmxvY2F0aW9uVHlwZSA9IFN0cmluZyhmaWx0ZXJzLmxvY2F0aW9uVHlwZSk7XHJcbiAgICBpZiAoZmlsdGVycz8ubG9jYXRpb24pIGNhY2hlRmlsdGVycy5sb2NhdGlvbiA9IFN0cmluZyhmaWx0ZXJzLmxvY2F0aW9uKS50cmltKCk7XHJcbiAgICBpZiAoZmlsdGVycz8ucGFydGljaXBhbnRUeXBlKSBjYWNoZUZpbHRlcnMucGFydGljaXBhbnRUeXBlID0gU3RyaW5nKGZpbHRlcnMucGFydGljaXBhbnRUeXBlKTtcclxuICAgIGlmIChmaWx0ZXJzPy5wYXJ0aWNpcGFudCkgY2FjaGVGaWx0ZXJzLnBhcnRpY2lwYW50ID0gU3RyaW5nKGZpbHRlcnMucGFydGljaXBhbnQpLnRyaW0oKTtcclxuICAgIGlmIChmaWx0ZXJzPy5vcGVyYXRpb25UeXBlKSBjYWNoZUZpbHRlcnMub3BlcmF0aW9uVHlwZSA9IFN0cmluZyhmaWx0ZXJzLm9wZXJhdGlvblR5cGUpLnRyaW0oKTtcclxuICAgIGlmIChmaWx0ZXJzPy5pc1NpbXBsaWZpZWQgIT09IHVuZGVmaW5lZCkgY2FjaGVGaWx0ZXJzLmlzU2ltcGxpZmllZCA9IGZpbHRlcnMuaXNTaW1wbGlmaWVkO1xyXG4gICAgaWYgKGZpbHRlcnM/Lm1hcmNhcykgY2FjaGVGaWx0ZXJzLm1hcmNhcyA9IFN0cmluZyhmaWx0ZXJzLm1hcmNhcykudHJpbSgpO1xyXG4gICAgaWYgKGZpbHRlcnM/LmZhbHRhbnRlU29icmFudGUpIGNhY2hlRmlsdGVycy5mYWx0YW50ZVNvYnJhbnRlID0gU3RyaW5nKGZpbHRlcnMuZmFsdGFudGVTb2JyYW50ZSkudHJpbSgpO1xyXG4gICAgaWYgKGZpbHRlcnM/LnVzZXJJZCkgY2FjaGVGaWx0ZXJzLnVzZXJJZCA9IE51bWJlcihmaWx0ZXJzLnVzZXJJZCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuY2FjaGVTZXJ2aWNlLmdlbmVyYXRlS2V5KGNhY2hlRmlsdGVycyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdHJ1eWUgbG9zIHBhcsOhbWV0cm9zIGJhc2UgcGFyYSBsYSBjb25zdWx0YVxyXG4gICAqIEBwYXJhbSBvZmZzZXQgXHJcbiAgICogQHBhcmFtIGxpbWl0IFxyXG4gICAqIEByZXR1cm5zIFxyXG4gICAqL1xyXG4gIHByaXZhdGUgYnVpbGRCYXNlUGFyYW1zKG9mZnNldDogbnVtYmVyLCBsaW1pdDogbnVtYmVyKTogUmVjb3JkPHN0cmluZywgYW55PiB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0aXBvRG9jdW1lbnRvOiAnR1RJTUUnLFxyXG4gICAgICBhY3Rpdm86ICdTJyxcclxuICAgICAgdGlwb0RvY3VtZW50b0VzdGFkbzogJ0dUSU1FJyxcclxuICAgICAgYWN0aXZhRXN0YWRvOiAnUycsXHJcbiAgICAgIG9mZnNldExpbWl0OiBvZmZzZXQgKyBsaW1pdCxcclxuICAgICAgb2Zmc2V0OiBvZmZzZXQsXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3RydXllIGxhcyBjb25kaWNpb25lcyBXSEVSRSBwYXJhIGxhIGNvbnN1bHRhXHJcbiAgICogQHBhcmFtIGZpbHRlcnMgXHJcbiAgICogQHBhcmFtIHBhcmFtcyBcclxuICAgKiBAcGFyYW0gam9pbnMgXHJcbiAgICogQHJldHVybnMgb2JqZXRvIGNvbiB3aGVyZSB5IHNpIHVzYSBmZWNoYSB6YXJwZSBDVEVcclxuICAgKi9cclxuICBwcml2YXRlIGJ1aWxkV2hlcmVDb25kaXRpb25zKFxyXG4gICAgZmlsdGVyczogR3VpZGVGaWx0ZXJzRHRvLFxyXG4gICAgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LFxyXG4gICAgam9pbnM6IHN0cmluZ1tdXHJcbiAgKTogeyB3aGVyZTogc3RyaW5nW107IGhhc0ZlY2hhWmFycGVDVEU6IGJvb2xlYW4gfSB7XHJcbiAgICBjb25zdCB3aGVyZTogc3RyaW5nW10gPSBbXTtcclxuICAgIGxldCBoYXNGZWNoYVphcnBlQ1RFID0gZmFsc2U7XHJcbiAgICBcclxuICAgIGlmIChmaWx0ZXJzPy5ndWlkZU51bWJlcikge1xyXG4gICAgICB3aGVyZS5wdXNoKCdkZC5OVU1FUk9FWFRFUk5PID0gOmd1aWRlTnVtYmVyJyk7XHJcbiAgICAgIHBhcmFtcy5ndWlkZU51bWJlciA9IFN0cmluZyhmaWx0ZXJzLmd1aWRlTnVtYmVyKS50cmltKCk7XHJcbiAgICAgIHdoZXJlLnB1c2goJ2RkLlRJUE9ET0NVTUVOVE8gPSA6dGlwb0RvY3VtZW50bycpO1xyXG4gICAgICB3aGVyZS5wdXNoKFwiZGQuQUNUSVZPID0gJ1MnXCIpO1xyXG4gICAgICBpZiAoZmlsdGVycz8udXNlcklkKSB7XHJcbiAgICAgICAgd2hlcmUucHVzaCgnZGQuSURFTUlTT1IgPSA6dXNlcklkJyk7XHJcbiAgICAgICAgcGFyYW1zLnVzZXJJZCA9IE51bWJlcihmaWx0ZXJzLnVzZXJJZCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHsgd2hlcmUsIGhhc0ZlY2hhWmFycGVDVEUgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGaWx0cm9zIGJhc2Ugc2llbXByZSBwcmVzZW50ZXNcclxuICAgIHdoZXJlLnB1c2goJ2RkLlRJUE9ET0NVTUVOVE8gPSA6dGlwb0RvY3VtZW50bycpO1xyXG4gICAgd2hlcmUucHVzaChcImRkLkFDVElWTyA9ICdTJ1wiKTtcclxuXHJcbiAgICAvLyBGaWx0cm8gZGUgdXNlcklkIHRlbXByYW5vIHBhcmEgbWVqb3IgcmVuZGltaWVudG9cclxuICAgIGlmIChmaWx0ZXJzPy51c2VySWQpIHtcclxuICAgICAgd2hlcmUucHVzaCgnZGQuSURFTUlTT1IgPSA6dXNlcklkJyk7XHJcbiAgICAgIHBhcmFtcy51c2VySWQgPSBOdW1iZXIoZmlsdGVycy51c2VySWQpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChmaWx0ZXJzPy5tYW5pZmVzdE51bWJlcikge1xyXG4gICAgICB3aGVyZS5wdXNoKCdkZC5OVU1FUk9BQ0VQVEFDSU9OID0gOm1hbmlmZXN0TnVtYmVyJyk7XHJcbiAgICAgIHBhcmFtcy5tYW5pZmVzdE51bWJlciA9IFN0cmluZyhmaWx0ZXJzLm1hbmlmZXN0TnVtYmVyKS50cmltKCk7XHJcblxyXG4gICAgICAvLyBTaSBoYXkgbWFuaWZlc3ROdW1iZXIgeSBlc3TDoSBlbiBtb2RvIHNpbXBsaWZpY2FkbywgcGVybWl0aXIgZmlsdHJhciBwb3IgZmVjaGFcclxuICAgICAgaWYgKGZpbHRlcnM/LmlzU2ltcGxpZmllZCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGhhc0ZlY2hhWmFycGVDVEUgPSB0aGlzLmFwcGx5RGF0ZUZpbHRlcnMoZmlsdGVycywgd2hlcmUsIGpvaW5zLCBwYXJhbXMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGlmICghZmlsdGVycz8ubWFuaWZlc3ROdW1iZXIpIHtcclxuICAgICAgaGFzRmVjaGFaYXJwZUNURSA9IHRoaXMuYXBwbHlEYXRlRmlsdGVycyhmaWx0ZXJzLCB3aGVyZSwgam9pbnMsIHBhcmFtcyk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5hcHBseUxvY2F0aW9uRmlsdGVycyhmaWx0ZXJzLCB3aGVyZSwgam9pbnMsIHBhcmFtcyk7XHJcblxyXG4gICAgdGhpcy5hcHBseVBhcnRpY2lwYW50RmlsdGVycyhmaWx0ZXJzLCB3aGVyZSwgam9pbnMsIHBhcmFtcyk7XHJcblxyXG4gICAgdGhpcy5hcHBseU9wZXJhdGlvblR5cGVGaWx0ZXJzKGZpbHRlcnMsIHdoZXJlLCBqb2lucywgcGFyYW1zKTtcclxuXHJcbiAgICB0aGlzLmFwcGx5TWFyY2FGaWx0ZXJzKGZpbHRlcnMsIHdoZXJlLCBqb2lucywgcGFyYW1zKTtcclxuXHJcbiAgICB0aGlzLmFwcGx5RmFsdGFudGVTb2JyYW50ZUZpbHRlcnMoZmlsdGVycywgd2hlcmUsIGpvaW5zLCBwYXJhbXMpO1xyXG5cclxuICAgIHJldHVybiB7IHdoZXJlLCBoYXNGZWNoYVphcnBlQ1RFIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcGxpY2EgbG9zIGZpbHRyb3MgZGUgZmVjaGEgYSBsYSBjb25zdWx0YVxyXG4gICAqIEBwYXJhbSBmaWx0ZXJzXHJcbiAgICogQHBhcmFtIHdoZXJlIFxyXG4gICAqIEBwYXJhbSBqb2lucyBcclxuICAgKiBAcGFyYW0gcGFyYW1zIFxyXG4gICAqIEByZXR1cm5zIHRydWUgc2kgZXMgZmlsdHJvIGRlIGZlY2hhIHphcnBlIChzZSBtYW5lamFyw6EgY29uIENURSBzZXBhcmFkbylcclxuICAgKi9cclxuICBwcml2YXRlIGFwcGx5RGF0ZUZpbHRlcnMoXHJcbiAgICBmaWx0ZXJzOiBHdWlkZUZpbHRlcnNEdG8sXHJcbiAgICB3aGVyZTogc3RyaW5nW10sXHJcbiAgICBqb2luczogc3RyaW5nW10sXHJcbiAgICBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIGFueT5cclxuICApOiBib29sZWFuIHtcclxuICAgIGlmICghZmlsdGVycz8uZGF0ZVR5cGUgJiYgIWZpbHRlcnM/LmZyb20gJiYgIWZpbHRlcnM/LnRvKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgbGV0IGNvbHVtbmFGZWNoYSA9ICdkZC5GRUNIQUVNSVNJT04nO1xyXG4gICAgbGV0IGRhdGVUeXBlID0gZmlsdGVycz8uZGF0ZVR5cGU7XHJcbiAgICBpZiAoIWRhdGVUeXBlICYmIChmaWx0ZXJzPy5mcm9tIHx8IGZpbHRlcnM/LnRvKSkge1xyXG4gICAgICBkYXRlVHlwZSA9ICdGRU0nO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBsZXQgaXNGZWNoYVphcnBlID0gZmFsc2U7XHJcbiAgICBcclxuICAgIGlmIChkYXRlVHlwZSkge1xyXG4gICAgICBjb25zdCBkYXRlVHlwZVVwcGVyID0gU3RyaW5nKGRhdGVUeXBlKS50b1VwcGVyQ2FzZSgpO1xyXG4gICAgICBpZiAoZGF0ZVR5cGVVcHBlciA9PT0gJ0ZFQ1JFQUNJT04nIHx8IGRhdGVUeXBlVXBwZXIgPT09ICdGRUNBQ0VQVEEnKSB7XHJcbiAgICAgICAgY29sdW1uYUZlY2hhID0gJ2RkLkZFQ0hBQ1JFQUNJT04nO1xyXG4gICAgICB9IGVsc2UgaWYgKGRhdGVUeXBlVXBwZXIgPT09ICdGRU0nKSB7XHJcbiAgICAgICAgY29sdW1uYUZlY2hhID0gJ2RkLkZFQ0hBRU1JU0lPTic7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRXMgZmVjaGEgZGUgemFycGUgLSBzZSBtYW5lamFyw6EgY29uIENURSBzZXBhcmFkbyBwYXJhIG3DoXhpbWEgZWZpY2llbmNpYVxyXG4gICAgICAgIC8vIE5PIGFncmVnYXIgZmlsdHJvcyBhcXXDrSwgZWwgQ1RFIHByZXZpbyB5YSBoYWJyw6EgZmlsdHJhZG8gbG9zIGRvY3VtZW50b3NcclxuICAgICAgICBpc0ZlY2hhWmFycGUgPSB0cnVlO1xyXG4gICAgICAgIGlmIChmaWx0ZXJzPy5mcm9tICYmIGZpbHRlcnM/LnRvKSB7XHJcbiAgICAgICAgICBjb25zdCBmcm9tRGF0ZSA9IERhdGVVdGlsLmNyZWF0ZVVUQ0RhdGUoZmlsdGVycy5mcm9tKTtcclxuICAgICAgICAgIGNvbnN0IGZyb21EYXRlU3RyID0gRGF0ZVV0aWwuZm9ybWF0RGF0ZUZvck9yYWNsZShmcm9tRGF0ZSk7XHJcbiAgICAgICAgICBjb25zdCB0b0RhdGUgPSBEYXRlVXRpbC5jcmVhdGVVVENEYXRlKGZpbHRlcnMudG8pO1xyXG4gICAgICAgICAgY29uc3QgdG9EYXRlU3RyID0gRGF0ZVV0aWwuZm9ybWF0RGF0ZUZvck9yYWNsZSh0b0RhdGUpO1xyXG4gICAgICAgICAgcGFyYW1zLmZlY2hhRnJvbSA9IGAke2Zyb21EYXRlU3RyfSAwMDowMDowMGA7XHJcbiAgICAgICAgICBwYXJhbXMuZmVjaGFUbyA9IGAke3RvRGF0ZVN0cn0gMjM6NTk6NTlgO1xyXG4gICAgICAgICAgcmV0dXJuIHRydWU7IC8vIEluZGljYXIgcXVlIGVzIGZlY2hhIHphcnBlIHBhcmEgdXNhciBDVEVcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBQYXJhIGZlY2hhcyBxdWUgTk8gc29uIHphcnBlLCBhcGxpY2FyIGZpbHRyb3Mgbm9ybWFsbWVudGVcclxuICAgIGlmICghaXNGZWNoYVphcnBlICYmIGZpbHRlcnM/LmZyb20gJiYgZmlsdGVycz8udG8pIHtcclxuICAgICAgY29uc3QgZnJvbURhdGUgPSBEYXRlVXRpbC5jcmVhdGVVVENEYXRlKGZpbHRlcnMuZnJvbSk7XHJcbiAgICAgIGNvbnN0IGZyb21EYXRlU3RyID0gRGF0ZVV0aWwuZm9ybWF0RGF0ZUZvck9yYWNsZShmcm9tRGF0ZSk7XHJcbiAgICAgIHdoZXJlLnB1c2goYCR7Y29sdW1uYUZlY2hhfSA+PSBUT19EQVRFKDpmZWNoYUZyb20sICdERC9NTS9ZWVlZIEhIMjQ6TUk6U1MnKWApO1xyXG4gICAgICBwYXJhbXMuZmVjaGFGcm9tID0gYCR7ZnJvbURhdGVTdHJ9IDAwOjAwOjAwYDtcclxuXHJcbiAgICAgIGNvbnN0IHRvRGF0ZSA9IERhdGVVdGlsLmNyZWF0ZVVUQ0RhdGUoZmlsdGVycy50byk7XHJcbiAgICAgIGNvbnN0IHRvRGF0ZVN0ciA9IERhdGVVdGlsLmZvcm1hdERhdGVGb3JPcmFjbGUodG9EYXRlKTtcclxuICAgICAgd2hlcmUucHVzaChgJHtjb2x1bW5hRmVjaGF9IDw9IFRPX0RBVEUoOmZlY2hhVG8sICdERC9NTS9ZWVlZIEhIMjQ6TUk6U1MnKWApO1xyXG4gICAgICBwYXJhbXMuZmVjaGFUbyA9IGAke3RvRGF0ZVN0cn0gMjM6NTk6NTlgO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBpc0ZlY2hhWmFycGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcGxpY2EgbG9zIGZpbHRyb3MgZGUgbG9jYWNpw7NuIGEgbGEgY29uc3VsdGFcclxuICAgKiBAcGFyYW0gZmlsdGVycyBcclxuICAgKiBAcGFyYW0gd2hlcmUgXHJcbiAgICogQHBhcmFtIGpvaW5zIFxyXG4gICAqIEBwYXJhbSBwYXJhbXMgXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhcHBseUxvY2F0aW9uRmlsdGVycyhcclxuICAgIGZpbHRlcnM6IEd1aWRlRmlsdGVyc0R0byxcclxuICAgIHdoZXJlOiBzdHJpbmdbXSxcclxuICAgIGpvaW5zOiBzdHJpbmdbXSxcclxuICAgIHBhcmFtczogUmVjb3JkPHN0cmluZywgYW55PlxyXG4gICk6IHZvaWQge1xyXG4gICAgaWYgKGZpbHRlcnM/LmxvY2F0aW9uVHlwZSB8fCBmaWx0ZXJzPy5sb2NhdGlvbikge1xyXG4gICAgICBjb25zdCBoYXNMb2NhdGlvbkpvaW4gPSBqb2lucy5zb21lKGpvaW4gPT4gam9pbi5pbmNsdWRlcygnRE9DTE9DQUNJT05ET0NVTUVOVE8nKSk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoIWhhc0xvY2F0aW9uSm9pbikge1xyXG4gICAgICAgIGpvaW5zLnB1c2goJ0pPSU4gRE9DVU1FTlRPUy5ET0NMT0NBQ0lPTkRPQ1VNRU5UTyBkbGQgT04gZGxkLkRPQ1VNRU5UTyA9IGRkLklEJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChmaWx0ZXJzPy5sb2NhdGlvblR5cGUpIHtcclxuICAgICAgICB3aGVyZS5wdXNoKCdkbGQuVElQT0xPQ0FDSU9OID0gOnRpcG9Mb2NhY2lvbicpO1xyXG4gICAgICAgIHBhcmFtcy50aXBvTG9jYWNpb24gPSBTdHJpbmcoZmlsdGVycy5sb2NhdGlvblR5cGUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZmlsdGVycz8ubG9jYXRpb24pIHtcclxuICAgICAgICB3aGVyZS5wdXNoKCdkbGQuSURMT0NBQ0lPTiA9IDppZExvY2FjaW9uJyk7XHJcbiAgICAgICAgcGFyYW1zLmlkTG9jYWNpb24gPSBOdW1iZXIoZmlsdGVycy5sb2NhdGlvbik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFwbGljYSBsb3MgZmlsdHJvcyBkZSBtYXJjYXMgYSBsYSBjb25zdWx0YVxyXG4gICAqIEBwYXJhbSBmaWx0ZXJzIFxyXG4gICAqIEBwYXJhbSB3aGVyZSBcclxuICAgKiBAcGFyYW0gam9pbnMgXHJcbiAgICogQHBhcmFtIHBhcmFtcyBcclxuICAgKi9cclxuICBwcml2YXRlIGFwcGx5TWFyY2FGaWx0ZXJzKFxyXG4gICAgZmlsdGVyczogR3VpZGVGaWx0ZXJzRHRvLFxyXG4gICAgd2hlcmU6IHN0cmluZ1tdLFxyXG4gICAgam9pbnM6IHN0cmluZ1tdLFxyXG4gICAgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XHJcbiAgKTogdm9pZCB7XHJcbiAgICBpZiAoZmlsdGVycz8ubWFyY2FzICYmIGZpbHRlcnMubWFyY2FzLnRyaW0oKSAhPT0gJycgJiYgZmlsdGVycy5tYXJjYXMudG9VcHBlckNhc2UoKSAhPT0gJ1RPRE9TJykge1xyXG4gICAgICBjb25zdCBoYXNNYXJjYUpvaW4gPSBqb2lucy5zb21lKGpvaW4gPT4gam9pbi5pbmNsdWRlcygnT3BGaXNjTWFyY2EnKSk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoIWhhc01hcmNhSm9pbikge1xyXG4gICAgICAgIC8vIEZpbHRyYXIgcG9yIGPDs2RpZ28gZXNwZWPDrWZpY28gZGUgbW90aXZvIGRlIHNlbGVjY2nDs25cclxuICAgICAgICBqb2lucy5wdXNoKCdKT0lOIEZJU0NBTElaQUNJT05FUy5PUEZJU0NNQVJDQSBvZm0gT04gb2ZtLklkRG9jdW1lbnRvID0gZGQuSUQgQU5EIG9mbS5BY3RpdmEgPSBcXCdTXFwnIEFORCBvZm0uQ29kaWdvT3BGaXNjTW90aXZvTWFyY2EgPSA6Y29kaWdvTWFyY2EnKTtcclxuICAgICAgICBwYXJhbXMuY29kaWdvTWFyY2EgPSBmaWx0ZXJzLm1hcmNhcy50b1VwcGVyQ2FzZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcGxpY2EgbG9zIGZpbHRyb3MgZGUgZmFsdGFudGUvc29icmFudGUgYSBsYSBjb25zdWx0YVxyXG4gICAqIEBwYXJhbSBmaWx0ZXJzIFxyXG4gICAqIEBwYXJhbSB3aGVyZSBcclxuICAgKiBAcGFyYW0gam9pbnMgXHJcbiAgICogQHBhcmFtIHBhcmFtcyBcclxuICAgKi9cclxuICBwcml2YXRlIGFwcGx5RmFsdGFudGVTb2JyYW50ZUZpbHRlcnMoXHJcbiAgICBmaWx0ZXJzOiBHdWlkZUZpbHRlcnNEdG8sXHJcbiAgICB3aGVyZTogc3RyaW5nW10sXHJcbiAgICBqb2luczogc3RyaW5nW10sXHJcbiAgICBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIGFueT5cclxuICApOiB2b2lkIHtcclxuICAgIGlmIChmaWx0ZXJzPy5mYWx0YW50ZVNvYnJhbnRlICYmIGZpbHRlcnMuZmFsdGFudGVTb2JyYW50ZS50cmltKCkgIT09ICcnICYmIGZpbHRlcnMuZmFsdGFudGVTb2JyYW50ZS50b1VwcGVyQ2FzZSgpICE9PSAnVE9EQVMnKSB7XHJcbiAgICAgIGNvbnN0IHRpcG9GaWx0cm8gPSBmaWx0ZXJzLmZhbHRhbnRlU29icmFudGUudG9VcHBlckNhc2UoKS50cmltKCk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAodGlwb0ZpbHRybyA9PT0gJ0ZBTFRBJykge1xyXG4gICAgICAgIHdoZXJlLnB1c2goYEVYSVNUUyAoXHJcbiAgICAgICAgICBTRUxFQ1QgMSBcclxuICAgICAgICAgIEZST00gRE9DVU1FTlRPUy5ET0NPQlNFUlZBQ0lPTiBvYnNfZmlsdHJvIFxyXG4gICAgICAgICAgV0hFUkUgb2JzX2ZpbHRyby5ET0NVTUVOVE8gPSBkZC5JRCBcclxuICAgICAgICAgICAgQU5EIFVQUEVSKG9ic19maWx0cm8uT0JTRVJWQUNJT04pIExJS0UgJyVGQUxUQSUnXHJcbiAgICAgICAgKWApO1xyXG4gICAgICB9IGVsc2UgaWYgKHRpcG9GaWx0cm8gPT09ICdTT0JSQScpIHtcclxuICAgICAgICB3aGVyZS5wdXNoKGBFWElTVFMgKFxyXG4gICAgICAgICAgU0VMRUNUIDEgXHJcbiAgICAgICAgICBGUk9NIERPQ1VNRU5UT1MuRE9DT0JTRVJWQUNJT04gb2JzX2ZpbHRybyBcclxuICAgICAgICAgIFdIRVJFIG9ic19maWx0cm8uRE9DVU1FTlRPID0gZGQuSUQgXHJcbiAgICAgICAgICAgIEFORCBVUFBFUihvYnNfZmlsdHJvLk9CU0VSVkFDSU9OKSBMSUtFICclU09CUkElJ1xyXG4gICAgICAgIClgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXBsaWNhIGxvcyBmaWx0cm9zIGRlIHBhcnRpY2lwYW50ZSBhIGxhIGNvbnN1bHRhXHJcbiAgICogQHBhcmFtIGZpbHRlcnMgXHJcbiAgICogQHBhcmFtIHdoZXJlIFxyXG4gICAqIEBwYXJhbSBqb2lucyBcclxuICAgKiBAcGFyYW0gcGFyYW1zIFxyXG4gICAqL1xyXG4gIHByaXZhdGUgYXBwbHlQYXJ0aWNpcGFudEZpbHRlcnMoXHJcbiAgICBmaWx0ZXJzOiBHdWlkZUZpbHRlcnNEdG8sXHJcbiAgICB3aGVyZTogc3RyaW5nW10sXHJcbiAgICBqb2luczogc3RyaW5nW10sXHJcbiAgICBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIGFueT5cclxuICApOiB2b2lkIHtcclxuICAgIC8vIFNpIGhheSBmaWx0cm8gZGUgcGFydGljaXBhbnRlLCBuZWNlc2l0YW1vcyBoYWNlciBKT0lOIGNvbiBsYSB0YWJsYSBkZSBwYXJ0aWNpcGFudGVzXHJcbiAgICBpZiAoZmlsdGVycz8ucGFydGljaXBhbnQgfHwgZmlsdGVycz8ucGFydGljaXBhbnRUeXBlKSB7XHJcbiAgICAgIGNvbnN0IGhhc1BhcnRpY2lwYW50Sm9pbiA9IGpvaW5zLnNvbWUoam9pbiA9PiBqb2luLmluY2x1ZGVzKCdET0NQQVJUSUNJUEFDSU9OJykpO1xyXG4gICAgICBcclxuICAgICAgaWYgKCFoYXNQYXJ0aWNpcGFudEpvaW4pIHtcclxuICAgICAgICBqb2lucy5wdXNoKCdKT0lOIERPQ1VNRU5UT1MuRE9DUEFSVElDSVBBQ0lPTiBkcCBPTiBkcC5ET0NVTUVOVE8gPSBkZC5JRCcpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZmlsdGVycz8ucGFydGljaXBhbnRUeXBlKSB7XHJcbiAgICAgICAgd2hlcmUucHVzaCgnZHAuUk9MID0gOnRpcG9QYXJ0aWNpcGFudGUnKTtcclxuICAgICAgICBwYXJhbXMudGlwb1BhcnRpY2lwYW50ZSA9IFN0cmluZyhmaWx0ZXJzLnBhcnRpY2lwYW50VHlwZSkudG9VcHBlckNhc2UoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGZpbHRlcnM/LnBhcnRpY2lwYW50KSB7XHJcbiAgICAgICAgY29uc3QgcGFydGljaXBhbnRWYWx1ZSA9IFN0cmluZyhmaWx0ZXJzLnBhcnRpY2lwYW50KS50cmltKCk7XHJcbiAgICAgICAgd2hlcmUucHVzaCgnVVBQRVIoZHAuTk9NQlJFUEFSVElDSVBBTlRFKSBMSUtFIFVQUEVSKDpwYXJ0aWNpcGFudGUpJyk7XHJcbiAgICAgICAgcGFyYW1zLnBhcnRpY2lwYW50ZSA9IGAlJHtwYXJ0aWNpcGFudFZhbHVlfSVgO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcGxpY2EgbG9zIGZpbHRyb3MgZGUgdGlwbyBkZSBvcGVyYWNpw7NuIGEgbGEgY29uc3VsdGFcclxuICAgKiBAcGFyYW0gZmlsdGVycyBcclxuICAgKiBAcGFyYW0gd2hlcmUgXHJcbiAgICogQHBhcmFtIGpvaW5zIFxyXG4gICAqIEBwYXJhbSBwYXJhbXMgXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhcHBseU9wZXJhdGlvblR5cGVGaWx0ZXJzKFxyXG4gICAgZmlsdGVyczogR3VpZGVGaWx0ZXJzRHRvLFxyXG4gICAgd2hlcmU6IHN0cmluZ1tdLFxyXG4gICAgam9pbnM6IHN0cmluZ1tdLFxyXG4gICAgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XHJcbiAgKTogdm9pZCB7XHJcbiAgICBpZiAoZmlsdGVycz8ub3BlcmF0aW9uVHlwZSAmJiBmaWx0ZXJzLm9wZXJhdGlvblR5cGUudHJpbSgpICE9PSAnJyAmJiBmaWx0ZXJzLm9wZXJhdGlvblR5cGUudG9VcHBlckNhc2UoKSAhPT0gJ1RPRE9TJykge1xyXG4gICAgICBjb25zdCBoYXNUcmFuc3BvcnRlSm9pbiA9IGpvaW5zLnNvbWUoam9pbiA9PiBqb2luLmluY2x1ZGVzKCdET0NUUkFORE9DVFJBTlNQT1JURScpKTtcclxuICAgICAgXHJcbiAgICAgIGlmICghaGFzVHJhbnNwb3J0ZUpvaW4pIHtcclxuICAgICAgICBqb2lucy5wdXNoKCdKT0lOIERPQ1RSQU5TUE9SVEUuRE9DVFJBTkRPQ1RSQU5TUE9SVEUgZHR0IE9OIGR0dC5JRCA9IGRkLklEJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHdoZXJlLnB1c2goJ2R0dC5TRU5USURPID0gOnRpcG9PcGVyYWNpb24nKTtcclxuICAgICAgcGFyYW1zLnRpcG9PcGVyYWNpb24gPSBTdHJpbmcoZmlsdGVycy5vcGVyYXRpb25UeXBlKS50b1VwcGVyQ2FzZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3RydXllIHVuIENURSBwcmV2aW8gcGFyYSBmaWx0cmFyIHBvciBmZWNoYSBkZSB6YXJwZSBlZmljaWVudGVtZW50ZVxyXG4gICAqIEBwYXJhbSBmaWx0ZXJzIFxyXG4gICAqIEBwYXJhbSBwYXJhbXMgXHJcbiAgICogQHJldHVybnMgXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBidWlsZEZlY2hhWmFycGVDVEUoZmlsdGVyczogR3VpZGVGaWx0ZXJzRHRvLCBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBzdHJpbmcge1xyXG4gICAgaWYgKCFmaWx0ZXJzPy5kYXRlVHlwZSB8fCBTdHJpbmcoZmlsdGVycy5kYXRlVHlwZSkudG9VcHBlckNhc2UoKSA9PT0gJ0ZFTScgfHwgXHJcbiAgICAgICAgU3RyaW5nKGZpbHRlcnMuZGF0ZVR5cGUpLnRvVXBwZXJDYXNlKCkgPT09ICdGRUNSRUFDSU9OJyB8fCBcclxuICAgICAgICBTdHJpbmcoZmlsdGVycy5kYXRlVHlwZSkudG9VcHBlckNhc2UoKSA9PT0gJ0ZFQ0FDRVBUQScpIHtcclxuICAgICAgcmV0dXJuICcnO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghZmlsdGVycz8uZnJvbSB8fCAhZmlsdGVycz8udG8pIHtcclxuICAgICAgcmV0dXJuICcnO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENURSBxdWUgZmlsdHJhIGRvY3VtZW50b3MgcG9yIGZlY2hhIGRlIHphcnBlIEFOVEVTIGRlIG90cm9zIEpPSU5zXHJcbiAgICAvLyBFc3RvIHJlZHVjZSBkcmFtw6F0aWNhbWVudGUgZWwgZGF0YXNldCBwYXJhIG9wZXJhY2lvbmVzIHBvc3RlcmlvcmVzXHJcbiAgICByZXR1cm4gYGRvY3NfY29uX2ZlY2hhX3phcnBlIEFTIChcclxuICAgICAgICAgIFNFTEVDVCAvKisgSU5ERVgoZGZkIElEWF9ET0NGRUNIQURPQ19ET0NfVElQTykgKi8gRElTVElOQ1RcclxuICAgICAgICAgICAgZGZkLkRPQ1VNRU5UTyBhcyBJRFxyXG4gICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRPQ0ZFQ0hBRE9DVU1FTlRPIGRmZFxyXG4gICAgICAgICAgV0hFUkUgZGZkLlRJUE9GRUNIQSA9ICdGWkFSUEUnXHJcbiAgICAgICAgICAgIEFORCBkZmQuRkVDSEEgPj0gVE9fREFURSg6ZmVjaGFGcm9tLCAnREQvTU0vWVlZWSBISDI0Ok1JOlNTJylcclxuICAgICAgICAgICAgQU5EIGRmZC5GRUNIQSA8PSBUT19EQVRFKDpmZWNoYVRvLCAnREQvTU0vWVlZWSBISDI0Ok1JOlNTJylcclxuICAgICAgICApLFxyXG4gICAgICAgIGA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdHJ1eWUgZWwgQ1RFIHBhcmEgbGEgY29uc3VsdGEgZGUgZG9jdW1lbnRvcyBmaWx0cmFkb3NcclxuICAgKiBAcGFyYW0gd2hlcmUgXHJcbiAgICogQHBhcmFtIGpvaW5zIFxyXG4gICAqIEBwYXJhbSBoYXNGZWNoYVphcnBlQ1RFIEluZGljYSBzaSBleGlzdGUgZWwgQ1RFIHByZXZpbyBkZSBmZWNoYSB6YXJwZVxyXG4gICAqIEByZXR1cm5zIFxyXG4gICAqL1xyXG4gIHByaXZhdGUgYnVpbGREb2N1bWVudG9zRmlsdHJhZG9zQ1RFKFxyXG4gICAgd2hlcmU6IHN0cmluZ1tdLCBcclxuICAgIGpvaW5zOiBzdHJpbmdbXSwgXHJcbiAgICBoYXNGZWNoYVphcnBlQ1RFOiBib29sZWFuXHJcbiAgKTogc3RyaW5nIHtcclxuICAgIGxldCBjdGUgPSBgZG9jdW1lbnRvc19maWx0cmFkb3MgQVMgKFNFTEVDVCAvKisgRklSU1RfUk9XUygyMCkgSU5ERVgoZGQpICovIGRkLklELGRkLk5VTUVST0VYVEVSTk8sZGQuRkVDSEFFTUlTSU9OLGRkLkZFQ0hBQ1JFQUNJT04sZGQuTlVNRVJPQUNFUFRBQ0lPTixlLlRQT19ET0NUTyxlLkZFQ0FDRVAsZS5OVU1JREVOVElGLGUubnVtX2Nvbm9jIEFTIE5VTV9DT05PQyBGUk9NIERPQ1VNRU5UT1MuRE9DRE9DVU1FTlRPQkFTRSBkZGA7XHJcbiAgICBpZiAoaGFzRmVjaGFaYXJwZUNURSkge1xyXG4gICAgICBjdGUgKz0gJyBJTk5FUiBKT0lOIGRvY3NfY29uX2ZlY2hhX3phcnBlIGRmeiBPTiBkZC5JRD1kZnouSUQnO1xyXG4gICAgfVxyXG4gICAgY3RlICs9ICcgTEVGVCBKT0lOIGRpbi5lbmNhX2RpbiBlIE9OIGRkLk5VTUVST0VYVEVSTk89ZS5udW1fY29ub2MgQU5EIGRkLk5VTUVST0FDRVBUQUNJT049ZS5udW1fbWFuaWYgQU5EIGUuYWNlcHRhZG9yZWNoYXphZG89XFwnQVxcJyBBTkQgZS52aWFfdHJhbj0xMSc7XHJcbiAgICBpZiAoam9pbnMubGVuZ3RoKSB7XHJcbiAgICAgIGN0ZSArPSAnICcgKyBqb2lucy5qb2luKCcgJyk7XHJcbiAgICB9XHJcbiAgICBpZiAod2hlcmUubGVuZ3RoKSB7XHJcbiAgICAgIGN0ZSArPSAnIFdIRVJFICcgKyB3aGVyZS5qb2luKCcgQU5EICcpO1xyXG4gICAgfVxyXG4gICAgY3RlICs9ICcgR1JPVVAgQlkgZGQuSUQsZGQuTlVNRVJPRVhURVJOTyxkZC5GRUNIQUVNSVNJT04sZGQuRkVDSEFDUkVBQ0lPTixkZC5OVU1FUk9BQ0VQVEFDSU9OLGUuVFBPX0RPQ1RPLGUuRkVDQUNFUCxlLk5VTUlERU5USUYsZS5udW1fY29ub2MpJztcclxuICAgIHJldHVybiBjdGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdHJ1eWUgbG9zIENURSBjb211bmVzIHBhcmEgbGEgY29uc3VsdGFcclxuICAgKiBAcGFyYW0gbmVlZHNNYW5pZmllc3RvcyBJbmRpY2Egc2kgc2UgbmVjZXNpdGFuIGxvcyBtYW5pZmllc3RvcyByZWxhY2lvbmFkb3NcclxuICAgKiBAcGFyYW0gaGFzU3RhdHVzRmlsdGVyIEluZGljYSBzaSBoYXkgZmlsdHJvIGRlIGVzdGFkb1xyXG4gICAqIEByZXR1cm5zIFxyXG4gICAqL1xyXG4gIHByaXZhdGUgYnVpbGRDb21tb25DVEVzKG5lZWRzTWFuaWZpZXN0b3M6IGJvb2xlYW4gPSB0cnVlLCBoYXNTdGF0dXNGaWx0ZXI6IGJvb2xlYW4gPSBmYWxzZSk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBtYW5pZmllc3Rvc0NURSA9IG5lZWRzTWFuaWZpZXN0b3MgPyBgLFxyXG4gICAgICAgIG1hbmlmaWVzdG9zX3JlbGFjaW9uYWRvcyBBUyAoXHJcbiAgICAgICAgICBTRUxFQ1QgXHJcbiAgICAgICAgICAgIGRmLklEIEFTIGd1aWFfaWQsXHJcbiAgICAgICAgICAgIGRtLklEIEFTIG1hbmlmaWVzdG9faWRcclxuICAgICAgICAgIEZST00gZG9jdW1lbnRvc19maWx0cmFkb3MgZGZcclxuICAgICAgICAgIEpPSU4gRE9DVU1FTlRPUy5ET0NET0NVTUVOVE9CQVNFIGRtIE9OIGRtLk5VTUVST0VYVEVSTk8gPSBkZi5OVU1FUk9BQ0VQVEFDSU9OXHJcbiAgICAgICAgICBXSEVSRSBkbS5USVBPRE9DVU1FTlRPID0gJ01GVE9DJ1xyXG4gICAgICAgICAgICBBTkQgZG0uQUNUSVZPID0gJ1MnXHJcbiAgICAgICAgKSxcclxuICAgICAgICBmZWNoYXNfYXJyaWJvIEFTIChcclxuICAgICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgICAgbXIuZ3VpYV9pZCxcclxuICAgICAgICAgICAgTUFYKGRmZC5GRUNIQSkgQVMgZmVjaGFBcnJpYm9cclxuICAgICAgICAgIEZST00gbWFuaWZpZXN0b3NfcmVsYWNpb25hZG9zIG1yXHJcbiAgICAgICAgICBKT0lOIERPQ1VNRU5UT1MuRE9DRkVDSEFET0NVTUVOVE8gZGZkIE9OIG1yLm1hbmlmaWVzdG9faWQgPSBkZmQuRE9DVU1FTlRPIEFORCBkZmQuVElQT0ZFQ0hBID0gJ0ZBUlJJQk8nXHJcbiAgICAgICAgICBHUk9VUCBCWSBtci5ndWlhX2lkXHJcbiAgICAgICAgKSxcclxuICAgICAgICBmZWNoYXNfY29uZm9ybWFjaW9uIEFTIChcclxuICAgICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgICAgbXIuZ3VpYV9pZCxcclxuICAgICAgICAgICAgTUFYKGRldC5GRUNIQSkgQVMgZmVjaGFDb25mb3JtYWNpb25cclxuICAgICAgICAgIEZST00gbWFuaWZpZXN0b3NfcmVsYWNpb25hZG9zIG1yXHJcbiAgICAgICAgICBKT0lOIERPQ1VNRU5UT1MuRE9DRVNUQURPUyBkZXQgT04gbXIubWFuaWZpZXN0b19pZCA9IGRldC5ET0NVTUVOVE8gQU5EIGRldC5USVBPRVNUQURPID0gJ0NNUCdcclxuICAgICAgICAgIEdST1VQIEJZIG1yLmd1aWFfaWRcclxuICAgICAgICApYCA6ICcnO1xyXG5cclxuICAgIHJldHVybiBgJHttYW5pZmllc3Rvc0NURX0sXHJcbiAgICAgICAgZmVjaGFfbWF4X2VzdGFkb3MgQVMgKFxyXG4gICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICBkZXQuRE9DVU1FTlRPLFxyXG4gICAgICAgICAgICBNQVgoZGV0LkZFQ0hBQUNUSVZBKSBBUyBtYXhfZmVjaGFhY3RpdmFcclxuICAgICAgICAgIEZST00gZG9jdW1lbnRvc19maWx0cmFkb3MgZGZcclxuICAgICAgICAgIEpPSU4gRE9DVU1FTlRPUy5ET0NFU1RBRE9TIGRldCBPTiBkZXQuRE9DVU1FTlRPID0gZGYuSURcclxuICAgICAgICAgIFdIRVJFIGRldC5BQ1RJVkEgPSA6YWN0aXZhRXN0YWRvXHJcbiAgICAgICAgICAgIEFORCBkZXQuVElQT0VTVEFETyBOT1QgSU4gKCdGUExBWk8nLCdDT04gTUFSQ0EnLCdWSVMnLCdSRUMnKVxyXG4gICAgICAgICAgICBBTkQgZGV0LlRJUE9FU1RBRE8gSU4gKCdBQ1AnLCdBTlUnLCdDTVAnLCdBQ0wnLCdNT0QnLCdDTVBGUCcsICdBQ0xQJylcclxuICAgICAgICAgIEdST1VQIEJZIGRldC5ET0NVTUVOVE9cclxuICAgICAgICApLFxyXG4gICAgICAgIGVzdGFkb19tYXhfdGlwbyBBUyAoXHJcbiAgICAgICAgICBTRUxFQ1QgXHJcbiAgICAgICAgICAgIGRldC5ET0NVTUVOVE8sXHJcbiAgICAgICAgICAgIE1BWChkZXQuVElQT0VTVEFETykgQVMgbWF4X3RpcG9lc3RhZG8sXHJcbiAgICAgICAgICAgIGRldC5GRUNIQUFDVElWQSBBUyBmZWNoYWFjdGl2YVxyXG4gICAgICAgICAgRlJPTSBkb2N1bWVudG9zX2ZpbHRyYWRvcyBkZlxyXG4gICAgICAgICAgSk9JTiBET0NVTUVOVE9TLkRPQ0VTVEFET1MgZGV0IE9OIGRldC5ET0NVTUVOVE8gPSBkZi5JRFxyXG4gICAgICAgICAgSk9JTiBmZWNoYV9tYXhfZXN0YWRvcyBmbWUgT04gZm1lLkRPQ1VNRU5UTyA9IGRldC5ET0NVTUVOVE8gXHJcbiAgICAgICAgICAgIEFORCBmbWUubWF4X2ZlY2hhYWN0aXZhID0gZGV0LkZFQ0hBQUNUSVZBXHJcbiAgICAgICAgICBXSEVSRSBkZXQuQUNUSVZBID0gOmFjdGl2YUVzdGFkb1xyXG4gICAgICAgICAgICBBTkQgZGV0LlRJUE9FU1RBRE8gSU4gKCdBQ1AnLCdBTlUnLCdDTVAnLCdBQ0wnLCdNT0QnLCdDTVBGUCcsICdBQ0xQJylcclxuICAgICAgICAgICAgQU5EIGRldC5USVBPRE9DVU1FTlRPID0gOnRpcG9Eb2N1bWVudG9Fc3RhZG9cclxuICAgICAgICAgIEdST1VQIEJZIGRldC5ET0NVTUVOVE8sIGRldC5GRUNIQUFDVElWQVxyXG4gICAgICAgICksXHJcbiAgICAgICAgZXN0YWRvc19vcmRlbmFkb3MgQVMgKFxyXG4gICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICBlbXQuRE9DVU1FTlRPLFxyXG4gICAgICAgICAgICBlbXQubWF4X3RpcG9lc3RhZG8gQVMgVElQT0VTVEFETyxcclxuICAgICAgICAgICAgZHRlLk5PTUJSRSxcclxuICAgICAgICAgICAgZW10LmZlY2hhYWN0aXZhIEFTIEZFQ0hBLFxyXG4gICAgICAgICAgICAxIEFTIHJuXHJcbiAgICAgICAgICBGUk9NIGVzdGFkb19tYXhfdGlwbyBlbXRcclxuICAgICAgICAgIEpPSU4gRE9DVU1FTlRPUy5ET0NUSVBPRVNUQURPIGR0ZSBPTiBlbXQubWF4X3RpcG9lc3RhZG8gPSBkdGUuQ09ESUdPXHJcbiAgICAgICAgICBXSEVSRSBkdGUuVElQT0RPQ1VNRU5UTyA9IDp0aXBvRG9jdW1lbnRvRXN0YWRvXHJcbiAgICAgICAgKWA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdHJ1eWUgQ1RFcyBvcGNpb25hbGVzIHBhcmEgZGF0b3MgYWRpY2lvbmFsZXMgKHNvbG8gY3VhbmRvIHNlIG5lY2VzaXRhbilcclxuICAgKiBAcmV0dXJucyBcclxuICAgKi9cclxuICBwcml2YXRlIGJ1aWxkT3B0aW9uYWxDVEVzKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYCxcclxuICAgICAgICBtb3Rpdm9zX3NlbGVjY2lvbiBBUyAoXHJcbiAgICAgICAgICBTRUxFQ1QgLyorIFVTRV9IQVNIKGRmIE9wRmlzY01hcmNhIE1vdGl2bykgKi9cclxuICAgICAgICAgICAgZGYuSUQgQVMgZG9jdW1lbnRvX2lkLFxyXG4gICAgICAgICAgICBMSVNUQUdHKE1vdGl2by5EZXNjcmlwY2lvbiwgJyAvICcpIFxyXG4gICAgICAgICAgICAgIFdJVEhJTiBHUk9VUCAoT1JERVIgQlkgT3BGaXNjTWFyY2EuQ29kaWdvT3BGaXNjTW90aXZvTWFyY2EpIEFTIG1vdGl2b1NlbGVjY2lvblxyXG4gICAgICAgICAgRlJPTSBkb2N1bWVudG9zX2ZpbHRyYWRvcyBkZlxyXG4gICAgICAgICAgSk9JTiBGSVNDQUxJWkFDSU9ORVMuT1BGSVNDTUFSQ0EgT3BGaXNjTWFyY2EgT04gT3BGaXNjTWFyY2EuSWREb2N1bWVudG8gPSBkZi5JRCBBTkQgT3BGaXNjTWFyY2EuQWN0aXZhID0gJ1MnXHJcbiAgICAgICAgICBKT0lOIEZJU0NBTElaQUNJT05FUy5PUEZJU0NNT1RJVk9NQVJDQSBNb3Rpdm8gT04gTW90aXZvLkNvZGlnbyA9IE9wRmlzY01hcmNhLkNvZGlnb09wRmlzY01vdGl2b01hcmNhXHJcbiAgICAgICAgICBHUk9VUCBCWSBkZi5JRFxyXG4gICAgICAgICksXHJcbiAgICAgICAgcmVzdWx0YWRvc19zZWxlY2Npb24gQVMgKFxyXG4gICAgICAgICAgU0VMRUNUIC8qKyBVU0VfSEFTSChkZiBGSVMgUkVHIFJFUykgKi9cclxuICAgICAgICAgICAgZGYuSUQgQVMgZG9jdW1lbnRvX2lkLFxyXG4gICAgICAgICAgICBMSVNUQUdHKFJFUy5jb2RpZ29vcGZpc2NyZXN1bHRhZG8gfHwgJyAvICcgfHwgUkVTLm9ic2VydmFjaW9uLCAnIC8gJykgXHJcbiAgICAgICAgICAgICAgV0lUSElOIEdST1VQIChPUkRFUiBCWSBSRVMuY29kaWdvb3BmaXNjcmVzdWx0YWRvIHx8ICcgLyAnIHx8IFJFUy5vYnNlcnZhY2lvbiBBU0MpIEFTIHJlc3VsdGFkb1NlbGVjY2lvblxyXG4gICAgICAgICAgRlJPTSBkb2N1bWVudG9zX2ZpbHRyYWRvcyBkZlxyXG4gICAgICAgICAgSU5ORVIgSk9JTiBGSVNDQUxJWkFDSU9ORVMuT1BGSVNDTUFSQ0EgRklTIE9OIEZJUy5JZERvY3VtZW50byA9IGRmLklEIEFORCBGSVMuQWN0aXZhID0gJ1MnXHJcbiAgICAgICAgICBJTk5FUiBKT0lOIEZJU0NBTElaQUNJT05FUy5PUEZJU0NSRUdJU1RST0ZJU0NBTElaQUNJIFJFRyBPTiBSRUcuSWRPcEZpc2NBY2Npb25GaXNjYWxpemFjaSA9IEZJUy5JRE9QRklTQ0FDQ0lPTkZJU0NBTElaQUNJIEFORCBSRUcuYWN0aXZvID0gJ1MnXHJcbiAgICAgICAgICBJTk5FUiBKT0lOIEZJU0NBTElaQUNJT05FUy5PUEZJU0NSRVNVTFRBRE9BQ0NJT04gUkVTIE9OIFJFRy5JZE9wRmlzY0FjY2lvbkZpc2NhbGl6YWNpID0gUkVTLklkT3BGaXNjQWNjaW9uRmlzY2FsaXphY2kgXHJcbiAgICAgICAgICAgIEFORCBSRUcuSUQgPSBSRVMuaWRvcGZpc2NyZWdpc3Ryb2Zpc2NhbGl6YVxyXG4gICAgICAgICAgR1JPVVAgQlkgZGYuSURcclxuICAgICAgICApLFxyXG4gICAgICAgIG9ic2VydmFjaW9uZXNfZmFsdGFfc29icmEgQVMgKFxyXG4gICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICBkZi5JRCBBUyBkb2N1bWVudG9faWQsXHJcbiAgICAgICAgICAgIENBU0UgV0hFTiBFWElTVFMgKFNFTEVDVCAxIEZST00gRE9DVU1FTlRPUy5ET0NPQlNFUlZBQ0lPTiBvYnMgV0hFUkUgb2JzLkRPQ1VNRU5UTyA9IGRmLklEIEFORCBVUFBFUihvYnMuT0JTRVJWQUNJT04pIExJS0UgJyVGQUxUQSUnKSBUSEVOICdTaScgRUxTRSAnTm8nIEVORCBBUyBmYWx0YSxcclxuICAgICAgICAgICAgQ0FTRSBXSEVOIEVYSVNUUyAoU0VMRUNUIDEgRlJPTSBET0NVTUVOVE9TLkRPQ09CU0VSVkFDSU9OIG9icyBXSEVSRSBvYnMuRE9DVU1FTlRPID0gZGYuSUQgQU5EIFVQUEVSKG9icy5PQlNFUlZBQ0lPTikgTElLRSAnJVNPQlJBJScpIFRIRU4gJ1NpJyBFTFNFICdObycgRU5EIEFTIHNvYnJhXHJcbiAgICAgICAgICBGUk9NIGRvY3VtZW50b3NfZmlsdHJhZG9zIGRmXHJcbiAgICAgICAgKSxcclxuICAgICAgICBjb25zaWduYXRhcmlvIEFTIChcclxuICAgICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgICAgZGYuSUQgQVMgZG9jdW1lbnRvX2lkLFxyXG4gICAgICAgICAgICBOVkwoTElTVEFHRyhkcC5OT01CUkVQQVJUSUNJUEFOVEUsICcgLyAnKSBcclxuICAgICAgICAgICAgICBXSVRISU4gR1JPVVAgKE9SREVSIEJZIGRwLk5PTUJSRVBBUlRJQ0lQQU5URSksICcnKSBBUyBub21icmVQYXJ0aWNpcGFudGVcclxuICAgICAgICAgIEZST00gZG9jdW1lbnRvc19maWx0cmFkb3MgZGZcclxuICAgICAgICAgIExFRlQgSk9JTiBET0NVTUVOVE9TLkRPQ1BBUlRJQ0lQQUNJT04gZHAgT04gZHAuRE9DVU1FTlRPID0gZGYuSUQgQU5EIGRwLlJPTCA9ICdDT05TJ1xyXG4gICAgICAgICAgR1JPVVAgQlkgZGYuSURcclxuICAgICAgICApLFxyXG4gICAgICAgIHRyYW5zcG9ydGUgQVMgKFxyXG4gICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICBkZi5JRCBBUyBkb2N1bWVudG9faWQsXHJcbiAgICAgICAgICAgIE5WTChkdC5UT1RBTFBFU08gfHwgJyAnIHx8IGR0LlVOSURBRFBFU08sICcnKSBBUyB0b3RhbFBlc29Db25VbmlkYWQsXHJcbiAgICAgICAgICAgIE5WTChkdC5UT1RBTElURU0sIDApIEFTIHRvdGFsSXRlbVxyXG4gICAgICAgICAgRlJPTSBkb2N1bWVudG9zX2ZpbHRyYWRvcyBkZlxyXG4gICAgICAgICAgTEVGVCBKT0lOIERPQ1RSQU5TUE9SVEUuRE9DVFJBTkRPQ1RSQU5TUE9SVEUgZHQgT04gZHQuSUQgPSBkZi5JRFxyXG4gICAgICAgICksXHJcbiAgICAgICAgZGlwc19jb3VyaWVyIEFTIChcclxuICAgICAgICAgIFNFTEVDVCAgXHJcbiAgICAgICAgICAgIGRmLklEIEFTIGRvY3VtZW50b19pZCxcclxuICAgICAgICAgICAgTUFYKGUuRkVDQUNFUCkgQVMgZmVjaGFEaXBzLFxyXG4gICAgICAgICAgICBNQVgoZS5OVU1JREVOVElGKSBBUyBudW1lcm9EaXBzXHJcbiAgICAgICAgICBGUk9NIGRvY3VtZW50b3NfZmlsdHJhZG9zIGRmXHJcbiAgICAgICAgICBMRUZUIEpPSU4gRElOLkVOQ0FfRElOIGUgXHJcbiAgICAgICAgICAgIE9OIGRmLk5VTUVST0VYVEVSTk8gPSBlLk5VTV9DT05PQ1xyXG4gICAgICAgICAgIEFORCBlLkFDRVBUQURPUkVDSEFaQURPID0gJ0EnXHJcbiAgICAgICAgICAgQU5EIGUuVklBX1RSQU4gPSAxMVxyXG4gICAgICAgICAgIEFORCBlLlRQT19ET0NUTyBJTiAoMTIyLCAxMjMpXHJcbiAgICAgICAgICBHUk9VUCBCWSBkZi5JRFxyXG4gICAgICAgICksXHJcbiAgICAgICAgZXNfZGluIEFTIChcclxuICAgICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgICAgZGYuSUQgQVMgZG9jdW1lbnRvX2lkLFxyXG4gICAgICAgICAgICBDQVNFIFxyXG4gICAgICAgICAgICAgIFdIRU4gTUFYKGUuTlVNX0NPTk9DKSBJUyBOT1QgTlVMTCBUSEVOICdTaSdcclxuICAgICAgICAgICAgICBFTFNFICdObydcclxuICAgICAgICAgICAgRU5EIEFTIGVzRGluXHJcbiAgICAgICAgICBGUk9NIGRvY3VtZW50b3NfZmlsdHJhZG9zIGRmXHJcbiAgICAgICAgICBMRUZUIEpPSU4gRElOLkVOQ0FfRElOIGUgXHJcbiAgICAgICAgICAgIE9OIGRmLk5VTUVST0VYVEVSTk8gPSBlLk5VTV9DT05PQ1xyXG4gICAgICAgICAgIEFORCBlLlRQT19ET0NUTyBOT1QgSU4gKDEyMiwgMTIzKVxyXG4gICAgICAgICAgR1JPVVAgQlkgZGYuSURcclxuICAgICAgICApYDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN0cnV5ZSBsYSBjb25zdWx0YSBwcmluY2lwYWwgcGFyYSBsYSBjb25zdWx0YSBkZSBkb2N1bWVudG9zIGZpbHRyYWRvc1xyXG4gICAqIEBwYXJhbSBmZWNoYVphcnBlQ1RFIENURSBwcmV2aW8gcGFyYSBmaWx0cmFyIHBvciBmZWNoYSB6YXJwZSAocHVlZGUgZXN0YXIgdmFjw61vKVxyXG4gICAqIEBwYXJhbSBkb2N1bWVudG9zRmlsdHJhZG9zQ1RFIFxyXG4gICAqIEBwYXJhbSBzb3J0Q29sdW1uIFxyXG4gICAqIEBwYXJhbSBvcmRlciBcclxuICAgKiBAcGFyYW0gaGFzU3RhdHVzRmlsdGVyIFxyXG4gICAqIEBwYXJhbSBuZWVkc01hbmlmaWVzdG9zIFxyXG4gICAqIEByZXR1cm5zIFxyXG4gICAqL1xyXG4gIHByaXZhdGUgYnVpbGRNYWluUXVlcnkoXHJcbiAgICBmZWNoYVphcnBlQ1RFOiBzdHJpbmcsXHJcbiAgICBkb2N1bWVudG9zRmlsdHJhZG9zQ1RFOiBzdHJpbmcsXHJcbiAgICBzb3J0Q29sdW1uOiBzdHJpbmcsXHJcbiAgICBvcmRlcjogc3RyaW5nLFxyXG4gICAgaGFzU3RhdHVzRmlsdGVyOiBib29sZWFuLFxyXG4gICAgbmVlZHNNYW5pZmllc3RvczogYm9vbGVhbiA9IHRydWVcclxuICApOiBzdHJpbmcge1xyXG4gICAgY29uc3QgY29tbW9uQ1RFcyA9IHRoaXMuYnVpbGRDb21tb25DVEVzKG5lZWRzTWFuaWZpZXN0b3MsIGhhc1N0YXR1c0ZpbHRlcik7XHJcbiAgICBjb25zdCBvcHRpb25hbENURXMgPSB0aGlzLmJ1aWxkT3B0aW9uYWxDVEVzKCk7XHJcbiAgICBcclxuICAgIGNvbnN0IGVzdGFkb0pvaW4gPSBoYXNTdGF0dXNGaWx0ZXIgXHJcbiAgICAgID8gJ0lOTkVSIEpPSU4gZXN0YWRvc19vcmRlbmFkb3MgZW8gT04gZGYuSUQgPSBlby5ET0NVTUVOVE8gQU5EIGVvLnJuID0gMSBBTkQgZW8uVElQT0VTVEFETyA9IDplc3RhZG8nXHJcbiAgICAgIDogJ0xFRlQgSk9JTiBlc3RhZG9zX29yZGVuYWRvcyBlbyBPTiBkZi5JRCA9IGVvLkRPQ1VNRU5UTyBBTkQgZW8ucm4gPSAxJztcclxuICAgIGNvbnN0IGpvaW5zID0gW2VzdGFkb0pvaW5dO1xyXG5cclxuICAgIGlmIChuZWVkc01hbmlmaWVzdG9zKSB7XHJcbiAgICAgIGpvaW5zLnB1c2goJ0xFRlQgSk9JTiBmZWNoYXNfYXJyaWJvIGZhciBPTiBkZi5JRCA9IGZhci5ndWlhX2lkJyk7XHJcbiAgICAgIGpvaW5zLnB1c2goJ0xFRlQgSk9JTiBmZWNoYXNfY29uZm9ybWFjaW9uIGZjIE9OIGRmLklEID0gZmMuZ3VpYV9pZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIGpvaW5zLnB1c2goJ0xFRlQgSk9JTiBtb3Rpdm9zX3NlbGVjY2lvbiBtcyBPTiBkZi5JRCA9IG1zLmRvY3VtZW50b19pZCcpO1xyXG4gICAgam9pbnMucHVzaCgnTEVGVCBKT0lOIHJlc3VsdGFkb3Nfc2VsZWNjaW9uIHJzIE9OIGRmLklEID0gcnMuZG9jdW1lbnRvX2lkJyk7XHJcbiAgICBqb2lucy5wdXNoKCdMRUZUIEpPSU4gb2JzZXJ2YWNpb25lc19mYWx0YV9zb2JyYSBvYnNfZnMgT04gZGYuSUQgPSBvYnNfZnMuZG9jdW1lbnRvX2lkJyk7XHJcbiAgICBqb2lucy5wdXNoKCdMRUZUIEpPSU4gY29uc2lnbmF0YXJpbyBjb25zIE9OIGRmLklEID0gY29ucy5kb2N1bWVudG9faWQnKTtcclxuICAgIGpvaW5zLnB1c2goJ0xFRlQgSk9JTiB0cmFuc3BvcnRlIHRyYW5zIE9OIGRmLklEID0gdHJhbnMuZG9jdW1lbnRvX2lkJyk7XHJcbiAgICBqb2lucy5wdXNoKCdMRUZUIEpPSU4gZGlwc19jb3VyaWVyIGRpcHMgT04gZGYuSUQgPSBkaXBzLmRvY3VtZW50b19pZCcpO1xyXG4gICAgam9pbnMucHVzaCgnTEVGVCBKT0lOIGVzX2RpbiBlZCBPTiBkZi5JRCA9IGVkLmRvY3VtZW50b19pZCcpO1xyXG4gICAgXHJcbiAgICAvLyBJbmNsdWlyIENURSBkZSBmZWNoYSB6YXJwZSBzaSBleGlzdGVcclxuICAgIGNvbnN0IHdpdGhDbGF1c2UgPSBmZWNoYVphcnBlQ1RFID8gYFdJVEggJHtmZWNoYVphcnBlQ1RFfWAgOiAnV0lUSCAnO1xyXG4gICAgXHJcbiAgICAvLyBEZXRlcm1pbmFyIGxhIGNvbHVtbmEgZGUgb3JkZW5hbWllbnRvXHJcbiAgICAvLyBDb24gU0VMRUNUIERJU1RJTkNULCBPcmFjbGUgcmVxdWllcmUgdXNhciBsb3MgYWxpYXMgZGVsIFNFTEVDVCBvIGV4cHJlc2lvbmVzIGNvbXBsZXRhc1xyXG4gICAgbGV0IG9yZGVyQnlDb2x1bW46IHN0cmluZztcclxuICAgIGlmIChzb3J0Q29sdW1uID09PSAnRVNUQURPJykge1xyXG4gICAgICAvLyBVc2FyIGVsIGFsaWFzIGRlbCBTRUxFQ1RcclxuICAgICAgb3JkZXJCeUNvbHVtbiA9ICdlc3RhZG8nO1xyXG4gICAgfSBlbHNlIGlmIChzb3J0Q29sdW1uID09PSAnQ09OU0lHTkFUQVJJTycpIHtcclxuICAgICAgLy8gVXNhciBlbCBhbGlhcyBkZWwgU0VMRUNUIChub21icmVQYXJ0aWNpcGFudGUpXHJcbiAgICAgIG9yZGVyQnlDb2x1bW4gPSAnbm9tYnJlUGFydGljaXBhbnRlJztcclxuICAgIH0gZWxzZSBpZiAoc29ydENvbHVtbiA9PT0gJ1RPVEFMUEVTTycpIHtcclxuICAgICAgLy8gVXNhciBlbCBhbGlhcyBkZWwgU0VMRUNUICh0b3RhbFBlc28pXHJcbiAgICAgIG9yZGVyQnlDb2x1bW4gPSAndG90YWxQZXNvJztcclxuICAgIH0gZWxzZSBpZiAoc29ydENvbHVtbiA9PT0gJ0NBTlRUT1RBTCcpIHtcclxuICAgICAgLy8gVXNhciBlbCBhbGlhcyBkZWwgU0VMRUNUICh0b3RhbEl0ZW0pXHJcbiAgICAgIG9yZGVyQnlDb2x1bW4gPSAndG90YWxJdGVtJztcclxuICAgIH0gZWxzZSBpZiAoc29ydENvbHVtbiA9PT0gJ01PVElWT01BUkNBJykge1xyXG4gICAgICAvLyBVc2FyIGVsIGFsaWFzIGRlbCBTRUxFQ1QgKG1vdGl2b1NlbGVjY2lvbilcclxuICAgICAgb3JkZXJCeUNvbHVtbiA9ICdtb3Rpdm9TZWxlY2Npb24nO1xyXG4gICAgfSBlbHNlIGlmIChzb3J0Q29sdW1uID09PSAnRkFMVEEnKSB7XHJcbiAgICAgIC8vIFVzYXIgZWwgYWxpYXMgZGVsIFNFTEVDVCAoZmFsdGEpXHJcbiAgICAgIG9yZGVyQnlDb2x1bW4gPSAnZmFsdGEnO1xyXG4gICAgfSBlbHNlIGlmIChzb3J0Q29sdW1uID09PSAnU09CUkEnKSB7XHJcbiAgICAgIC8vIFVzYXIgZWwgYWxpYXMgZGVsIFNFTEVDVCAoc29icmEpXHJcbiAgICAgIG9yZGVyQnlDb2x1bW4gPSAnc29icmEnO1xyXG4gICAgfSBlbHNlIGlmIChzb3J0Q29sdW1uID09PSAnTlJPRElQUycpIHtcclxuICAgICAgLy8gVXNhciBlbCBhbGlhcyBkZWwgU0VMRUNUIChudW1lcm9EaXBzKVxyXG4gICAgICBvcmRlckJ5Q29sdW1uID0gJ251bWVyb0RpcHMnO1xyXG4gICAgfSBlbHNlIGlmIChzb3J0Q29sdW1uID09PSAnRkVDSEFESVBTJykge1xyXG4gICAgICAvLyBVc2FyIGVsIGFsaWFzIGRlbCBTRUxFQ1QgKGZlY2hhRGlwcylcclxuICAgICAgb3JkZXJCeUNvbHVtbiA9ICdmZWNoYURpcHMnO1xyXG4gICAgfSBlbHNlIGlmIChzb3J0Q29sdW1uID09PSAnVElFTkVESU4nKSB7XHJcbiAgICAgIC8vIFVzYXIgZWwgYWxpYXMgZGVsIFNFTEVDVCAoZXNEaW4pXHJcbiAgICAgIG9yZGVyQnlDb2x1bW4gPSAnZXNEaW4nO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gUGFyYSBjYW1wb3MgZGUgZGYsIHVzYXIgZWwgYWxpYXMgZGVsIFNFTEVDVCBzaSBleGlzdGUsIHNpbm8gZWwgbm9tYnJlIGRlIGxhIGNvbHVtbmFcclxuICAgICAgY29uc3QgZGZDb2x1bW5NYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XHJcbiAgICAgICAgJ0ZFQ0hBQ1JFQUNJT04nOiAnZmVjaGFBY2VwdGFjaW9uJyxcclxuICAgICAgICAnRkVDSEFFTUlTSU9OJzogJ2ZlY2hhRW1pc2lvbicsXHJcbiAgICAgICAgJ05VTUVST0VYVEVSTk8nOiAnbnVtZXJvRXh0ZXJubycsXHJcbiAgICAgICAgJ05VTUVST0FDRVBUQUNJT04nOiAnbnVtZXJvQWNlcHRhY2lvbicsXHJcbiAgICAgICAgJ0lEJzogJ2lkJyxcclxuICAgICAgfTtcclxuICAgICAgb3JkZXJCeUNvbHVtbiA9IGRmQ29sdW1uTWFwW3NvcnRDb2x1bW5dIHx8IGBkZi4ke3NvcnRDb2x1bW59YDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIGAke3dpdGhDbGF1c2V9JHtkb2N1bWVudG9zRmlsdHJhZG9zQ1RFfSR7Y29tbW9uQ1RFc30ke29wdGlvbmFsQ1RFc31cclxuICAgICAgICBTRUxFQ1QgRElTVElOQ1RcclxuICAgICAgICAgIGRmLklEIGFzIGlkLFxyXG4gICAgICAgICAgZGYuTlVNRVJPRVhURVJOTyBhcyBudW1lcm9FeHRlcm5vLFxyXG4gICAgICAgICAgZGYuRkVDSEFFTUlTSU9OIGFzIGZlY2hhRW1pc2lvbixcclxuICAgICAgICAgIGRmLk5VTUVST0FDRVBUQUNJT04gYXMgbnVtZXJvQWNlcHRhY2lvbixcclxuICAgICAgICAgIGVvLk5PTUJSRSBhcyBlc3RhZG8sXHJcbiAgICAgICAgICAke25lZWRzTWFuaWZpZXN0b3MgPyAnZmFyLmZlY2hhQXJyaWJvLCcgOiAnTlVMTCBBUyBmZWNoYUFycmlibywnfVxyXG4gICAgICAgICAgZGYuRkVDSEFDUkVBQ0lPTiBhcyBmZWNoYUFjZXB0YWNpb24sXHJcbiAgICAgICAgICAke25lZWRzTWFuaWZpZXN0b3MgPyAnZmMuZmVjaGFDb25mb3JtYWNpb24sJyA6ICdOVUxMIEFTIGZlY2hhQ29uZm9ybWFjaW9uLCd9XHJcbiAgICAgICAgICBOVkwobXMubW90aXZvU2VsZWNjaW9uLCAnJykgQVMgbW90aXZvU2VsZWNjaW9uLFxyXG4gICAgICAgICAgTlZMKHJzLnJlc3VsdGFkb1NlbGVjY2lvbiwgJyAnKSBBUyByZXN1bHRhZG9TZWxlY2Npb24sXHJcbiAgICAgICAgICBOVkwob2JzX2ZzLmZhbHRhLCAnTm8nKSBBUyBmYWx0YSxcclxuICAgICAgICAgIE5WTChvYnNfZnMuc29icmEsICdObycpIEFTIHNvYnJhLFxyXG4gICAgICAgICAgTlZMKGNvbnMubm9tYnJlUGFydGljaXBhbnRlLCAnJykgQVMgbm9tYnJlUGFydGljaXBhbnRlLFxyXG4gICAgICAgICAgTlZMKHRyYW5zLnRvdGFsUGVzb0NvblVuaWRhZCwgJycpIEFTIHRvdGFsUGVzbyxcclxuICAgICAgICAgIE5WTCh0cmFucy50b3RhbEl0ZW0sIDApIEFTIHRvdGFsSXRlbSxcclxuICAgICAgICAgIGRpcHMuZmVjaGFEaXBzLFxyXG4gICAgICAgICAgZGlwcy5udW1lcm9EaXBzLFxyXG4gICAgICAgICAgTlZMKGVkLmVzRGluLCAnTm8nKSBBUyBlc0RpblxyXG4gICAgICAgIEZST00gZG9jdW1lbnRvc19maWx0cmFkb3MgZGZcclxuICAgICAgICAke2pvaW5zLmpvaW4oJ1xcbiAgICAgICAgJyl9XHJcbiAgICAgICAgT1JERVIgQlkgJHtvcmRlckJ5Q29sdW1ufSAke29yZGVyfWA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdHJ1eWUgbGEgY29uc3VsdGEgcGFyYSBjb250YXIgbG9zIGRvY3VtZW50b3MgZmlsdHJhZG9zXHJcbiAgICogQHBhcmFtIGZlY2hhWmFycGVDVEUgQ1RFIHByZXZpbyBwYXJhIGZpbHRyYXIgcG9yIGZlY2hhIHphcnBlIChwdWVkZSBlc3RhciB2YWPDrW8pXHJcbiAgICogQHBhcmFtIGRvY3VtZW50b3NGaWx0cmFkb3NDVEUgXHJcbiAgICogQHBhcmFtIGhhc1N0YXR1c0ZpbHRlciBcclxuICAgKiBAcmV0dXJucyBcclxuICAgKi9cclxuICBwcml2YXRlIGJ1aWxkQ291bnRRdWVyeShcclxuICAgIGZlY2hhWmFycGVDVEU6IHN0cmluZyxcclxuICAgIGRvY3VtZW50b3NGaWx0cmFkb3NDVEU6IHN0cmluZyxcclxuICAgIGhhc1N0YXR1c0ZpbHRlcjogYm9vbGVhblxyXG4gICk6IHN0cmluZyB7XHJcbiAgICAvLyBJbmNsdWlyIENURSBkZSBmZWNoYSB6YXJwZSBzaSBleGlzdGVcclxuICAgIGNvbnN0IHdpdGhDbGF1c2UgPSBmZWNoYVphcnBlQ1RFID8gYFdJVEggJHtmZWNoYVphcnBlQ1RFfWAgOiAnV0lUSCAnO1xyXG4gICAgXHJcbiAgICAvLyBTaSBubyBoYXkgZmlsdHJvIGRlIGVzdGFkbywgY29udGFyIGRpcmVjdGFtZW50ZSBsb3MgZG9jdW1lbnRvcyBmaWx0cmFkb3MgKG3DoXMgcsOhcGlkbylcclxuICAgIGlmICghaGFzU3RhdHVzRmlsdGVyKSB7XHJcbiAgICAgIHJldHVybiBgJHt3aXRoQ2xhdXNlfSR7ZG9jdW1lbnRvc0ZpbHRyYWRvc0NURX1cclxuICAgICAgICBTRUxFQ1QgQ09VTlQoMSkgQVMgVE9UQUwgXHJcbiAgICAgICAgRlJPTSBkb2N1bWVudG9zX2ZpbHRyYWRvc2A7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY29tbW9uQ1RFcyA9IHRoaXMuYnVpbGRDb21tb25DVEVzKGZhbHNlLCBoYXNTdGF0dXNGaWx0ZXIpO1xyXG4gICAgcmV0dXJuIGAke3dpdGhDbGF1c2V9JHtkb2N1bWVudG9zRmlsdHJhZG9zQ1RFfSR7Y29tbW9uQ1RFc31cclxuICAgICAgICBTRUxFQ1QgQ09VTlQoRElTVElOQ1QgZGYuSUQpIEFTIFRPVEFMIFxyXG4gICAgICAgIEZST00gZG9jdW1lbnRvc19maWx0cmFkb3MgZGZcclxuICAgICAgICBJTk5FUiBKT0lOIGVzdGFkb3Nfb3JkZW5hZG9zIGVvIE9OIGRmLklEID0gZW8uRE9DVU1FTlRPIFxyXG4gICAgICAgICAgQU5EIGVvLnJuID0gMSBcclxuICAgICAgICAgIEFORCBlby5USVBPRVNUQURPID0gOmVzdGFkb2A7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFamVjdXRhIGxhcyBjb25zdWx0YXMgcHJpbmNpcGFsZXMgeSBkZSBjb250ZW9cclxuICAgKiBAcGFyYW0gbWFpblF1ZXJ5IFxyXG4gICAqIEBwYXJhbSBjb3VudFF1ZXJ5IFxyXG4gICAqIEBwYXJhbSBwYXJhbXMgXHJcbiAgICogQHBhcmFtIG9mZnNldCBcclxuICAgKiBAcGFyYW0gbGltaXQgXHJcbiAgICogQHBhcmFtIGNhY2hlS2V5IFxyXG4gICAqIEByZXR1cm5zIFxyXG4gICAqL1xyXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZVF1ZXJpZXMoXHJcbiAgICBtYWluUXVlcnk6IHN0cmluZyxcclxuICAgIGNvdW50UXVlcnk6IHN0cmluZyxcclxuICAgIHBhcmFtczogUmVjb3JkPHN0cmluZywgYW55PixcclxuICAgIG9mZnNldDogbnVtYmVyLFxyXG4gICAgbGltaXQ6IG51bWJlcixcclxuICAgIGNhY2hlS2V5OiBzdHJpbmcgfCBudWxsXHJcbiAgKTogUHJvbWlzZTx7IGd1aWRlczogYW55W107IHRvdGFsOiBudW1iZXIgfT4ge1xyXG4gICAgY29uc3QgY29ubmVjdGlvbiA9IHRoaXMuZG9jdW1lbnRvQmFzZVJlcG9zaXRvcnkubWFuYWdlci5jb25uZWN0aW9uO1xyXG4gICAgY29uc3QgZHJpdmVyID0gY29ubmVjdGlvbi5kcml2ZXI7XHJcblxyXG4gICAgLy8gSW50ZW50YXIgb2J0ZW5lciBlbCB0b3RhbCBkZWwgY2FjaGVcclxuICAgIGxldCBjb3VudFJlc3VsdDogbnVtYmVyO1xyXG4gICAgaWYgKGNhY2hlS2V5KSB7XHJcbiAgICAgIGNvbnN0IGNhY2hlZFRvdGFsUmVzdWx0ID0gdGhpcy5jYWNoZVNlcnZpY2UuZ2V0PG51bWJlcj4oY2FjaGVLZXksIHRoaXMuQ0FDSEVfVFRMKTtcclxuICAgICAgY29uc3QgY2FjaGVkVG90YWwgPSBhd2FpdCBQcm9taXNlLnJlc29sdmUoY2FjaGVkVG90YWxSZXN1bHQpO1xyXG4gICAgICBpZiAoY2FjaGVkVG90YWwgIT09IG51bGwpIHtcclxuICAgICAgICBjb25zdCBndWlkZXNSZXN1bHQgPSBhd2FpdCB0aGlzLmV4ZWN1dGVNYWluUXVlcnkoZHJpdmVyLCBtYWluUXVlcnksIHBhcmFtcywgb2Zmc2V0LCBsaW1pdCk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGd1aWRlczogZ3VpZGVzUmVzdWx0LFxyXG4gICAgICAgICAgdG90YWw6IGNhY2hlZFRvdGFsLFxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBbY291bnRSZXN1bHRGcm9tRGIsIGd1aWRlc1Jlc3VsdF0gPSBhd2FpdCBQcm9taXNlLmFsbChbXHJcbiAgICAgIHRoaXMuZXhlY3V0ZUNvdW50UXVlcnkoZHJpdmVyLCBjb3VudFF1ZXJ5LCBwYXJhbXMpLFxyXG4gICAgICB0aGlzLmV4ZWN1dGVNYWluUXVlcnkoZHJpdmVyLCBtYWluUXVlcnksIHBhcmFtcywgb2Zmc2V0LCBsaW1pdCksXHJcbiAgICBdKTtcclxuXHJcbiAgICBjb3VudFJlc3VsdCA9IGNvdW50UmVzdWx0RnJvbURiO1xyXG5cclxuICAgIGlmIChjYWNoZUtleSkge1xyXG4gICAgICBjb25zdCBzZXRSZXN1bHQgPSB0aGlzLmNhY2hlU2VydmljZS5zZXQoY2FjaGVLZXksIGNvdW50UmVzdWx0LCB0aGlzLkNBQ0hFX1RUTCk7XHJcbiAgICAgIGF3YWl0IFByb21pc2UucmVzb2x2ZShzZXRSZXN1bHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGd1aWRlczogZ3VpZGVzUmVzdWx0LFxyXG4gICAgICB0b3RhbDogY291bnRSZXN1bHQsXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRWplY3V0YSBsYSBjb25zdWx0YSBwYXJhIGNvbnRhciBsb3MgZG9jdW1lbnRvcyBmaWx0cmFkb3NcclxuICAgKiBAcGFyYW0gZHJpdmVyIFxyXG4gICAqIEBwYXJhbSBjb3VudFF1ZXJ5IFxyXG4gICAqIEBwYXJhbSBwYXJhbXMgXHJcbiAgICogQHJldHVybnMgXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlQ291bnRRdWVyeShcclxuICAgIGRyaXZlcjogYW55LFxyXG4gICAgY291bnRRdWVyeTogc3RyaW5nLFxyXG4gICAgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XHJcbiAgKTogUHJvbWlzZTxudW1iZXI+IHtcclxuICAgIGNvbnN0IFtxdWVyeSwgcXVlcnlQYXJhbXNdID0gZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoY291bnRRdWVyeSwgcGFyYW1zLCB7fSk7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmRvY3VtZW50b0Jhc2VSZXBvc2l0b3J5LnF1ZXJ5KHF1ZXJ5LCBxdWVyeVBhcmFtcyk7XHJcbiAgICByZXR1cm4gTnVtYmVyKHJlc3VsdD8uWzBdPy5UT1RBTCB8fCAwKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZU1haW5RdWVyeShcclxuICAgIGRyaXZlcjogYW55LFxyXG4gICAgbWFpblF1ZXJ5OiBzdHJpbmcsXHJcbiAgICBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIGFueT4sXHJcbiAgICBvZmZzZXQ6IG51bWJlcixcclxuICAgIGxpbWl0OiBudW1iZXJcclxuICApOiBQcm9taXNlPGFueVtdPiB7XHJcbiAgICAvLyBPcHRpbWl6YWNpw7NuOiBVc2FyIEZFVENIIEZJUlNUIHBhcmEgbWVqb3IgcmVuZGltaWVudG8gZW4gT3JhY2xlIDEyYytcclxuICAgIC8vIFNpIGxhIHZlcnNpw7NuIGRlIE9yYWNsZSBsbyBzb3BvcnRhLCBlcyBtw6FzIGVmaWNpZW50ZSBxdWUgUk9XTlVNXHJcbiAgICAvLyBQb3IgY29tcGF0aWJpbGlkYWQsIG1hbnRlbmVtb3MgUk9XTlVNIHBlcm8gb3B0aW1pemFtb3MgbGEgZXN0cnVjdHVyYVxyXG4gICAgY29uc3QgcGFnaW5hdGVkU3FsID0gYFxyXG4gICAgICBTRUxFQ1QgKiBGUk9NIChcclxuICAgICAgICBTRUxFQ1QgcS4qLCBST1dOVU0gcm4gRlJPTSAoXHJcbiAgICAgICAgICAke21haW5RdWVyeX1cclxuICAgICAgICApIHEgV0hFUkUgUk9XTlVNIDw9IDpvZmZzZXRMaW1pdFxyXG4gICAgICApIFdIRVJFIHJuID4gOm9mZnNldGA7XHJcblxyXG4gICAgY29uc3QgW3F1ZXJ5LCBxdWVyeVBhcmFtc10gPSBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhwYWdpbmF0ZWRTcWwsIHBhcmFtcywge30pO1xyXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZG9jdW1lbnRvQmFzZVJlcG9zaXRvcnkucXVlcnkocXVlcnksIHF1ZXJ5UGFyYW1zKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE9idGllbmUgbGFzIGd1w61hcyBmaWx0cmFkYXNcclxuICAgKiBAcGFyYW0gZmlsdGVycyBcclxuICAgKiBAcGFyYW0gdXNlcklkIFxyXG4gICAqIEByZXR1cm5zIFxyXG4gICAqL1xyXG4gIGFzeW5jIGxpc3RHdWlkZXMoZmlsdGVyczogR3VpZGVGaWx0ZXJzRHRvLCB1c2VySWQ/OiBudW1iZXIpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIFNpIG5vIGV4aXN0ZSBtYW5pZmVzdE51bWJlciwgZXN0YWJsZWNlciBpc1NpbXBsaWZpZWQgZW4gZmFsc2VcclxuICAgICAgaWYgKCFmaWx0ZXJzPy5tYW5pZmVzdE51bWJlcikge1xyXG4gICAgICAgIGZpbHRlcnMuaXNTaW1wbGlmaWVkID0gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFNpIHVzZXJJZCB2aWVuZSBjb21vIHBhcsOhbWV0cm8gcGVybyBubyBlc3TDoSBlbiBmaWx0ZXJzLCBhZ3JlZ2FybG9cclxuICAgICAgaWYgKHVzZXJJZCAmJiAhZmlsdGVycz8udXNlcklkKSB7XHJcbiAgICAgICAgZmlsdGVycy51c2VySWQgPSB1c2VySWQ7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIE5vcm1hbGl6YXIgcGFyw6FtZXRyb3MgZGUgcGFnaW5hY2nDs24geSBvcmRlbmFtaWVudG9cclxuICAgICAgY29uc3QgcGFnZSA9IE51bWJlcihmaWx0ZXJzPy5wYWdlIHx8IDEpO1xyXG4gICAgICBjb25zdCBsaW1pdCA9IE51bWJlcihmaWx0ZXJzPy5saW1pdCB8fCAyMCk7XHJcbiAgICAgIGNvbnN0IHNvcnQgPSBmaWx0ZXJzPy5zb3J0IHx8ICdmZWNoYUNyZWFjaW9uJztcclxuICAgICAgY29uc3Qgb3JkZXIgPSAoZmlsdGVycz8ub3JkZXIgPT09ICdhc2MnIHx8IGZpbHRlcnM/Lm9yZGVyID09PSAnZGVzYycpIFxyXG4gICAgICAgID8gZmlsdGVycy5vcmRlci50b1VwcGVyQ2FzZSgpIGFzICdBU0MnIHwgJ0RFU0MnXHJcbiAgICAgICAgOiAnREVTQyc7XHJcbiAgICAgIGNvbnN0IHNvcnRDb2x1bW4gPSB0aGlzLmdldFNvcnRDb2x1bW4oc29ydCk7XHJcbiAgICAgIGNvbnN0IG9mZnNldCA9IChwYWdlIC0gMSkgKiBsaW1pdDtcclxuXHJcbiAgICAgIC8vIENvbnN0cnVpciBwYXLDoW1ldHJvcyBiYXNlIHkgY29uZGljaW9uZXMgZGUgZmlsdHJhZG9cclxuICAgICAgY29uc3QgcGFyYW1zID0gdGhpcy5idWlsZEJhc2VQYXJhbXMob2Zmc2V0LCBsaW1pdCk7XHJcbiAgICAgIGNvbnN0IGpvaW5zOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICBjb25zdCB7IHdoZXJlLCBoYXNGZWNoYVphcnBlQ1RFIH0gPSB0aGlzLmJ1aWxkV2hlcmVDb25kaXRpb25zKGZpbHRlcnMsIHBhcmFtcywgam9pbnMpO1xyXG5cclxuICAgICAgLy8gQ29uZmlndXJhciBmaWx0cm8gZGUgZXN0YWRvIHNpIGV4aXN0ZVxyXG4gICAgICBsZXQgaGFzU3RhdHVzRmlsdGVyID0gISFmaWx0ZXJzPy5zdGF0dXM7XHJcbiAgICAgIGlmIChoYXNTdGF0dXNGaWx0ZXIpIHtcclxuICAgICAgICBwYXJhbXMuZXN0YWRvID0gU3RyaW5nKGZpbHRlcnMuc3RhdHVzKS50b1VwcGVyQ2FzZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBHZW5lcmFyIGNsYXZlIGRlIGNhY2hlIGJhc2FkYSBlbiBsb3MgZmlsdHJvcyAoc2luIHBhZ2luYWNpw7NuIG5pIG9yZGVuYW1pZW50bylcclxuICAgICAgY29uc3QgY2FjaGVLZXkgPSB0aGlzLmdlbmVyYXRlQ2FjaGVLZXkoZmlsdGVycywgaGFzU3RhdHVzRmlsdGVyKTtcclxuXHJcbiAgICAgIC8vIENvbnN0cnVpciBDVEUgZGUgZmVjaGEgemFycGUgc2kgZXMgbmVjZXNhcmlvIChwYXJhIG3DoXhpbWEgb3B0aW1pemFjacOzbilcclxuICAgICAgY29uc3QgZmVjaGFaYXJwZUNURSA9IGhhc0ZlY2hhWmFycGVDVEUgPyB0aGlzLmJ1aWxkRmVjaGFaYXJwZUNURShmaWx0ZXJzLCBwYXJhbXMpIDogJyc7XHJcblxyXG4gICAgICAvLyBDb25zdHJ1aXIgQ1RFIGJhc2UgZGUgZG9jdW1lbnRvcyBmaWx0cmFkb3NcclxuICAgICAgY29uc3QgZG9jdW1lbnRvc0ZpbHRyYWRvc0NURSA9IHRoaXMuYnVpbGREb2N1bWVudG9zRmlsdHJhZG9zQ1RFKHdoZXJlLCBqb2lucywgaGFzRmVjaGFaYXJwZUNURSk7XHJcblxyXG4gICAgICAvLyBEZXRlcm1pbmFyIHNpIG5lY2VzaXRhbW9zIGRhdG9zIGRlIG1hbmlmaWVzdG9zIChzb2xvIHNpIG5vIGhheSBmaWx0cm8gZXNwZWPDrWZpY28pXHJcbiAgICAgIGNvbnN0IG5lZWRzTWFuaWZpZXN0b3MgPSAhZmlsdGVycz8uZ3VpZGVOdW1iZXI7XHJcblxyXG4gICAgICAvLyBDb25zdHJ1aXIgcXVlcmllc1xyXG4gICAgICBjb25zdCBtYWluUXVlcnkgPSB0aGlzLmJ1aWxkTWFpblF1ZXJ5KGZlY2hhWmFycGVDVEUsIGRvY3VtZW50b3NGaWx0cmFkb3NDVEUsIHNvcnRDb2x1bW4sIG9yZGVyLCBoYXNTdGF0dXNGaWx0ZXIsIG5lZWRzTWFuaWZpZXN0b3MpO1xyXG4gICAgICBjb25zdCBjb3VudFF1ZXJ5ID0gdGhpcy5idWlsZENvdW50UXVlcnkoZmVjaGFaYXJwZUNURSwgZG9jdW1lbnRvc0ZpbHRyYWRvc0NURSwgaGFzU3RhdHVzRmlsdGVyKTtcclxuXHJcbiAgICAgIC8vIEVqZWN1dGFyIHF1ZXJpZXMgKHVzYW5kbyBjYWNoZSBzaSBlc3TDoSBkaXNwb25pYmxlKVxyXG4gICAgICBjb25zdCB7IGd1aWRlcywgdG90YWwgfSA9IGF3YWl0IHRoaXMuZXhlY3V0ZVF1ZXJpZXMobWFpblF1ZXJ5LCBjb3VudFF1ZXJ5LCBwYXJhbXMsIG9mZnNldCwgbGltaXQsIGNhY2hlS2V5KTtcclxuXHJcbiAgICAgIC8vIENvbnN0cnVpciByZXNwdWVzdGFcclxuICAgICAgcmV0dXJuIFJlc3BvbnNlVXRpbC5zdWNjZXNzKHtcclxuICAgICAgICBndWlkZXMsXHJcbiAgICAgICAgdG90YWwsXHJcbiAgICAgICAgcGFnZSxcclxuICAgICAgICBsaW1pdCxcclxuICAgICAgICB0b3RhbFBhZ2VzOiBNYXRoLmNlaWwodG90YWwgLyBsaW1pdCksXHJcbiAgICAgIH0sIFwiR3XDrWFzIG9idGVuaWRhcyBleGl0b3NhbWVudGVcIik7XHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIHRocm93IFJlc3BvbnNlVXRpbC5pbnRlcm5hbEVycm9yKGVycm9yKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19