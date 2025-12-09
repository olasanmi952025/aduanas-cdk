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
var DocumentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const entities_1 = require("./entities");
const entities_2 = require("../dictionaries/entities");
const typeorm_1 = require("@nestjs/typeorm");
const xml_util_1 = require("../../shared/utils/xml.util");
const response_util_1 = require("../../shared/utils/response.util");
const common_1 = require("@nestjs/common");
let DocumentsService = DocumentsService_1 = class DocumentsService {
    constructor(documentoBaseRepository, participacionRepository, locacionDocumentoRepository, dataSource, manifestSQSService, exportStatusService, configService) {
        this.documentoBaseRepository = documentoBaseRepository;
        this.participacionRepository = participacionRepository;
        this.locacionDocumentoRepository = locacionDocumentoRepository;
        this.dataSource = dataSource;
        this.manifestSQSService = manifestSQSService;
        this.exportStatusService = exportStatusService;
        this.configService = configService;
        this.logger = new common_1.Logger(DocumentsService_1.name);
    }
    /**
     * Build ORDER BY clause safely based on sortBy and sortOrder
     * @param sortBy - Field name from frontend
     * @param sortOrder - Direction (asc or desc)
     * @returns Safe SQL ORDER BY clause
     */
    buildOrderBy(sortBy, sortOrder) {
        const sortFieldMap = {
            'id': 'ID',
            'numeroExterno': 'NUMERO_EXTERNO',
            'numeroReferenciaOriginal': 'NUMERO_REF_ORIGINAL',
            'estado': 'ESTADO',
            'numeroMasterGa': 'NUMERO_MASTER_GA',
            'emisor': 'EMISOR',
            'fechaAceptacion': 'FECHA_ACEPTACION',
            'fechaArribo': 'FECHA_ARRIBO',
            'fechaConformacion': 'FECHA_CONFORMACION',
            'fechaDespegue': 'FECHA_DESPEGUE',
            'totalGuias': 'TOTAL_GTIME',
            'totalGuiasMarcadas': 'TOTAL_MARCADOS_GTIME',
            'revisado': 'REVISADO',
        };
        const sqlColumn = sortBy && sortFieldMap[sortBy]
            ? sortFieldMap[sortBy]
            : 'FECHACREACION';
        const direction = sortOrder === 'asc' || sortOrder === 'desc'
            ? sortOrder.toUpperCase()
            : 'DESC';
        if (sqlColumn === 'FECHACREACION')
            return `dd.FECHACREACION ${direction}`;
        return `${sqlColumn} ${direction}`;
    }
    /**
     * Search documents in the database based on filters
     * @param filters
     * @returns
     */
    async searchDocuments(filters) {
        try {
            const where = [];
            const joins = [];
            const params = {};
            let sql = `
        WITH fecha_max_estados_manifiesto AS (
          SELECT 
            det.DOCUMENTO,
            MAX(det.FECHAACTIVA) AS max_fechaactiva
          FROM DOCUMENTOS.DOCESTADOS det
          WHERE det.TIPODOCUMENTO = 'MFTOC'
            AND det.ACTIVA = 'S'
            AND det.TIPOESTADO NOT IN ('FPLAZO','CON MARCA','VIS','REC')
            AND det.TIPOESTADO IN ('ACP','ANU','CMP','ACL','MOD','CMPFP', 'ACLP')
          GROUP BY det.DOCUMENTO
        ),
        estado_max_tipo_manifiesto AS (
          SELECT 
            det.DOCUMENTO,
            MAX(det.TIPOESTADO) AS max_tipoestado,
            det.FECHAACTIVA AS fechaactiva
          FROM DOCUMENTOS.DOCESTADOS det
          JOIN fecha_max_estados_manifiesto fmem ON fmem.DOCUMENTO = det.DOCUMENTO 
            AND fmem.max_fechaactiva = det.FECHAACTIVA
          WHERE det.TIPODOCUMENTO = 'MFTOC'
            AND det.ACTIVA = 'S'
            AND det.TIPOESTADO IN ('ACP','ANU','CMP','ACL','MOD','CMPFP', 'ACLP')
          GROUP BY det.DOCUMENTO, det.FECHAACTIVA
        ),
        estados_ordenados AS (
          SELECT 
            emt.DOCUMENTO,
            emt.max_tipoestado AS TIPOESTADO,
            dte.NOMBRE,
            emt.fechaactiva AS FECHA,
            ROW_NUMBER() OVER (PARTITION BY emt.DOCUMENTO ORDER BY emt.fechaactiva DESC) AS rn
          FROM estado_max_tipo_manifiesto emt
          JOIN DOCUMENTOS.DOCTIPOESTADO dte ON emt.max_tipoestado = dte.CODIGO
          WHERE dte.TIPODOCUMENTO = 'MFTOC'
        )
        SELECT
          dd.ID AS ID,
          dd.NUMEROEXTERNO AS NUMERO_EXTERNO,
          dtm.NUMEROREFERENCIAORIGINAL AS NUMERO_REF_ORIGINAL,
          eo.NOMBRE AS ESTADO,
          (SELECT drd.NUMDOCDESTINO AS NUMERO_MASTER_GA FROM DOCUMENTOS.DOCRELACIONDOCUMENTO drd WHERE drd.DOCORIGEN=dd.ID  AND TIPODOCDESTINO = 'GA' AND ACTIVO = 'S' AND ROWNUM = 1) AS NUMERO_MASTER_GA,
          dd.EMISOR AS EMISOR,
          (SELECT dfd_ace.FECHA AS fecha FROM DOCUMENTOS.DOCFECHADOCUMENTO dfd_ace, DOCUMENTOS.DOCTIPOFECHA dtf_ace WHERE dd.ID= dfd_ace.DOCUMENTO and dtf_ace.CODIGO = dfd_ace.TIPOFECHA AND dfd_ace.TIPOFECHA = 'FECACEPTA') AS FECHA_ACEPTACION,
          (SELECT dfd_arr.FECHA AS fecha FROM DOCUMENTOS.DOCFECHADOCUMENTO dfd_arr, DOCUMENTOS.DOCTIPOFECHA dtf_arr WHERE dd.ID= dfd_arr.DOCUMENTO and dtf_arr.CODIGO = dfd_arr.TIPOFECHA AND dfd_arr.TIPOFECHA = 'FARRIBO') AS FECHA_ARRIBO,
          (SELECT MAX(det.FECHAACTIVA) AS fecha FROM DOCUMENTOS.DOCESTADOS det WHERE det.documento = dd.ID AND det.TIPODOCUMENTO = 'MFTOC' AND det.ACTIVA = 'S' AND det.TIPOESTADO NOT IN ('FPLAZO','CON MARCA','VIS','REC') AND det.TIPOESTADO IN ('ACP','ANU','CMP','ACL','MOD','CMPFP', 'ACLP') GROUP BY det.DOCUMENTO) AS FECHA_CONFORMACION,
          (SELECT dld.LOCACION AS LOCACION FROM DOCUMENTOS.DOCLOCACIONDOCUMENTO dld WHERE dld.DOCUMENTO=dd.ID AND dld.TIPOLOCACION ='LUDESPEGUE') AS LUGAR_DE_DESPEGUE,
          (SELECT dfd_des.FECHA AS fecha FROM DOCUMENTOS.DOCFECHADOCUMENTO dfd_des, DOCUMENTOS.DOCTIPOFECHA dtf_des WHERE dd.ID= dfd_des.DOCUMENTO and dtf_des.CODIGO = dfd_des.TIPOFECHA AND dfd_des.TIPOFECHA = 'FEDESPEGUE') AS FECHA_DESPEGUE,
          (SELECT COUNT(id) FROM DOCUMENTOS.DOCDOCUMENTOBASE d  WHERE d.TIPODOCUMENTO = 'GTIME' AND d.NUMEROACEPTACION = TO_CHAR(dd.NUMEROEXTERNO) AND d.ACTIVO = 'S') AS TOTAL_GTIME,
          (SELECT COUNT(DISTINCT DBG.id)
            FROM DOCUMENTOS.docrelaciondocumento RD
            JOIN DOCUMENTOS.docdocumentobase DBG ON DBG.id = RD.docorigen
            JOIN DOCTRANSPORTE.doctrandoctransporte DT ON DT.id = DBG.id
            LEFT JOIN DOCUMENTOS.docestados GANU ON GANU.documento = DBG.id AND GANU.TIPODOCUMENTO = DBG.TIPODOCUMENTO AND GANU.tipoestado = 'ANU'
            WHERE RD.tiporelacion = 'REF'
              AND RD.activo = 'S'
              AND RD.docdestino = dd.ID
              AND DBG.TIPODOCUMENTO = 'GTIME'
              AND DBG.activo = 'S'
              AND GANU.documento IS NULL
              AND DT.VALORDECLARADO <= 500
              AND EXISTS (
                SELECT 1
                FROM DOCUMENTOS.docestados E
                WHERE E.documento = DBG.id
                  AND E.TIPODOCUMENTO = DBG.TIPODOCUMENTO
                  AND E.tipoestado IN ('CON MARCA', 'VIS')
              )
          ) AS TOTAL_MARCADOS_GTIME,
          DECODE((SELECT tipoestado FROM DOCUMENTOS.DOCESTADOS est WHERE dd.tipodocumento = est.tipodocumento AND dd.id = est.documento AND est.tipoestado = 'VIS' AND est.activa = 'S' AND ROWNUM = 1),NULL,'NO','SI') as REVISADO
        FROM DOCUMENTOS.DOCDOCUMENTOBASE dd
        JOIN DOCTRANSPORTE.DOCTRANMANIFIESTO dtm ON dd.ID = dtm.ID
        JOIN estados_ordenados eo ON dd.ID = eo.DOCUMENTO AND eo.rn = 1
      `;
            // Parámetros básicos
            params.tipoDocumentoBase = "MFTOC";
            where.push("dd.TIPODOCUMENTO = :tipoDocumentoBase");
            where.push("dd.ACTIVO = 'S'");
            // JOINs opcionales según filters
            const needParticipacion = !!filters?.emisor || !!filters?.tipoParticipante;
            if (needParticipacion) {
                joins.push("LEFT JOIN DOCPARTICIPACION P ON P.DOCUMENTO = dd.ID");
                where.push("P.ACTIVA = 'S'");
            }
            /*
            const needEstado = !!filters?.estado;
            if (needEstado) {
              joins.push("JOIN DOCUMENTOS.DOCESTADOS det ON det.DOCUMENTO = dd.ID");
            }*/
            const needLocacion = !!(filters?.tipoLocacion || filters?.locacion);
            if (needLocacion) {
                joins.push("LEFT JOIN DOCUMENTOS.DOCLOCACIONDOCUMENTO dld ON dld.DOCUMENTO = dd.ID");
                where.push("dld.ACTIVA = 'S'");
            }
            // Rango de fechas por tipo
            // No aplicar filtros de fechas si se está buscando por número de aceptación o número de referencia original
            const tieneBusquedaEspecifica = !!(filters?.numeroAceptacion || filters?.numeroManifiestoOriginal);
            if (!tieneBusquedaEspecifica && (filters?.tipoFecha || filters?.fechaDesde || filters?.fechaHasta)) {
                let columnaFecha = "";
                if (filters?.tipoFecha) {
                    joins.push("JOIN DOCUMENTOS.DOCFECHADOCUMENTO dfd ON dfd.DOCUMENTO = dd.ID AND dfd.TIPOFECHA = :tipoFecha");
                    columnaFecha = "dfd.FECHA";
                    where.push("dfd.TIPOFECHA = :tipoFecha");
                    params.tipoFecha = String(filters.tipoFecha);
                }
                else {
                    // Si no se especifica tipoFecha, usar FECHAEMISION del documento
                    columnaFecha = "dd.FECHAEMISION";
                }
                if (filters.fechaDesde) {
                    console.log("fechaDesde-----------------------", filters.fechaDesde);
                    where.push(`${columnaFecha} >= TO_DATE(:fechaDesde, 'DD/MM/YYYY HH24:MI:SS')`);
                    params.fechaDesde = `${String(filters.fechaDesde)} 00:00:00`;
                }
                if (filters.fechaHasta) {
                    console.log("fechaHasta-----------------------", filters.fechaHasta);
                    where.push(`${columnaFecha} <= TO_DATE(:fechaHasta, 'DD/MM/YYYY HH24:MI:SS')`);
                    params.fechaHasta = `${String(filters.fechaHasta)} 23:59:59`;
                }
            }
            // WHERE por filters
            if (filters?.tipoDocumento) {
                where.push("dd.TIPODOCUMENTO = :tipoDocumento");
                params.tipoDocumento = String(filters.tipoDocumento);
            }
            /**es para filtrar por el userId del usuario autenticado */
            if (filters?.userId) {
                const userIdNum = Number(filters.userId);
                if (!Number.isNaN(userIdNum) && userIdNum > 0) {
                    where.push("dd.IDEMISOR = :userId");
                    params.userId = userIdNum;
                    console.log("userId-----------------------", userIdNum);
                }
            }
            /**es para filtrar por el tipo de participante (ROL) en la tabla participacion */
            if (filters?.tipoParticipante && !tieneBusquedaEspecifica) {
                if (filters.tipoParticipante.toUpperCase() === 'EMISOR') {
                    filters.tipoParticipante = 'EMI';
                }
                console.log("tipoParticipante-----------------------", filters.tipoParticipante);
                where.push("P.ROL = :tipoParticipante");
                params.tipoParticipante = String(filters.tipoParticipante).trim();
            }
            /**es para filtrar por el nombre del emisor en la tabla DOCPARTICIPACION */
            if (filters?.emisor && !tieneBusquedaEspecifica) {
                where.push("UPPER(P.NOMBREPARTICIPANTE) LIKE UPPER(:emisor)");
                params.emisor = `%${String(filters.emisor).trim()}%`;
            }
            if (filters?.tipoLocacion && !tieneBusquedaEspecifica) {
                where.push("dld.TIPOLOCACION = :tipoLocacion");
                params.tipoLocacion = String(filters.tipoLocacion);
            }
            if (filters?.locacion && !tieneBusquedaEspecifica) {
                console.log("locacion-----------------------", filters.locacion);
                const locacionValue = String(filters.locacion).trim();
                // Si es numérico, comparar con IDLOCACION
                if (/^\d+$/.test(locacionValue)) {
                    where.push("dld.IDLOCACION = :locacion");
                    params.locacion = Number(locacionValue);
                }
                else {
                    // Si es string, comparar con CODIGOLOCACION
                    where.push("UPPER(dld.CODIGOLOCACION) = UPPER(:locacion)");
                    params.locacion = locacionValue;
                }
            }
            if (filters?.numeroAceptacion) {
                // dd.NUMEROEXTERNO es VARCHAR, tratar como string
                const cleanedValue = String(filters.numeroAceptacion).trim();
                if (cleanedValue && cleanedValue.length > 0) {
                    where.push("dd.NUMEROEXTERNO = :numeroExterno");
                    params.numeroExterno = cleanedValue;
                }
            }
            if (filters?.numeroManifiestoOriginal) {
                where.push("dtm.NUMEROREFERENCIAORIGINAL = :numeroReferenciaOriginal");
                params.numeroReferenciaOriginal = String(filters.numeroManifiestoOriginal);
            }
            if (filters?.estado && !tieneBusquedaEspecifica) {
                where.push("eo.TIPOESTADO = :estado");
                params.estado = String(filters.estado);
            }
            if (filters?.sentidoOperacion && !tieneBusquedaEspecifica) {
                where.push("dtm.TIPOMANIFIESTO = :sentidoOperacion");
                params.sentidoOperacion = String(filters.sentidoOperacion);
            }
            if (filters?.numeroVuelo && !tieneBusquedaEspecifica) {
                where.push("dtm.VIAJE = :numeroVuelo");
                params.numeroVuelo = String(filters.numeroVuelo);
            }
            // Ensamblar consulta final
            if (joins.length) {
                sql += "\n" + joins.join("\n");
            }
            if (where.length) {
                sql += "\nWHERE " + where.join("\n  AND ");
            }
            // Aplicar sorting dinámico
            const orderBy = this.buildOrderBy(filters?.sortBy, filters?.sortOrder);
            sql += `\nORDER BY ${orderBy}`;
            // Paginación simple (fetch first) compatible con Oracle 12c+
            const page = Number(filters?.page || 1);
            const limit = Number(filters?.limit || 10);
            const offset = (page - 1) * limit;
            const paginatedSql = `
        SELECT * FROM (
          SELECT q.*, ROWNUM rn FROM (
            ${sql}
          ) q WHERE ROWNUM <= ${offset + limit}
        ) WHERE rn > ${offset}
      `;
            // Usar dataSource directamente (mejor práctica para múltiples consultas)
            const driver = this.dataSource.driver;
            const [paginatedQuery, paginatedParameters] = driver.escapeQueryWithParameters(paginatedSql, params, {});
            const rows = await this.dataSource.query(paginatedQuery, paginatedParameters);
            // Conteo total (sin paginación) - usar parámetros sin rownum
            const countSql = `SELECT COUNT(1) AS TOTAL FROM (${sql})`;
            const [countQuery, countParameters] = driver.escapeQueryWithParameters(countSql, params, {});
            const countRows = await this.dataSource.query(countQuery, countParameters);
            const total = Number(countRows?.[0]?.TOTAL || 0);
            // Mapear respuesta
            const documentos = rows.map((r) => ({
                id: r.ID,
                numeroExterno: r.NUMERO_EXTERNO,
                numeroReferenciaOriginal: r.NUMERO_REF_ORIGINAL,
                estado: r.ESTADO,
                numeroMasterGa: r.NUMERO_MASTER_GA,
                emisor: r.EMISOR,
                fechaAceptacion: r.FECHA_ACEPTACION,
                fechaArribo: r.FECHA_ARRIBO,
                fechaConformacion: r.FECHA_CONFORMACION,
                lugarDespegue: r.LUGAR_DE_DESPEGUE,
                fechaDespegue: r.FECHA_DESPEGUE,
                totalDocumentosGtime: r.TOTAL_GTIME,
                totalMarcadosGtime: r.TOTAL_MARCADOS_GTIME,
                revisado: r.REVISADO,
            }));
            const result = {
                documentos,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
            return response_util_1.ResponseUtil.success(result, "Documentos obtenidos exitosamente");
        }
        catch (error) {
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
    async exportDocuments(filters) {
        try {
            const where = [];
            const { numeroAceptacion, tipoDocumento } = filters;
            const typeDoc = "GTIME";
            let sql = `
        SELECT DISTINCT
          D.ID                AS ID,
          D.NUMEROEXTERNO     AS NUMEROEXTERNO,
          D.TIPODOCUMENTO     AS TIPODOCUMENTO,
          D.ACTIVO            AS ACTIVO,
          NVL((SELECT LISTAGG(OpFiscMarca.CodigoOpFiscMotivoMarca || '-' || Motivo.Descripcion, ' / ') WITHIN GROUP (ORDER BY OpFiscMarca.CodigoOpFiscMotivoMarca)
           FROM OpFiscMarca OpFiscMarca
           JOIN OpFiscMotivoMarca Motivo
             ON Motivo.Codigo = OpFiscMarca.CodigoOpFiscMotivoMarca
           WHERE OpFiscMarca.IdDocumento = D.ID
             AND OpFiscMarca.Activa = 'S'
          ), '') AS MOTIVO_SELECCION,
          NVL((SELECT LISTAGG(RES.codigoopfiscresultado || ' / ' || RES.observacion, ' / ') WITHIN GROUP (ORDER BY RES.codigoopfiscresultado || ' / ' || RES.observacion ASC)
           FROM OPFISCRESULTADOACCION RES
           INNER JOIN OpFiscRegistroFiscalizaci REG
             ON REG.IdOpFiscAccionFiscalizaci = RES.IdOpFiscAccionFiscalizaci
            AND REG.ID = RES.idopfiscregistrofiscaliza
           INNER JOIN fiscalizaciones.OpFiscMarca FIS
             ON FIS.IDOPFISCACCIONFISCALIZACI = REG.IdOpFiscAccionFiscalizaci
           WHERE FIS.IdDocumento = D.ID
             AND FIS.Activa = 'S'
             AND REG.activo = 'S'
          ), ' ') AS RESULTADO_SELECCION
        FROM DOCUMENTOS.DOCDOCUMENTOBASE D
      `;
            // WHERE por filters
            where.push(`D.ACTIVO = 'S'`);
            if (tipoDocumento) {
                where.push(`D.TIPODOCUMENTO = '${typeDoc}'`);
            }
            if (numeroAceptacion) {
                const v = String(numeroAceptacion).replace(/'/g, "''");
                where.push(`D.NUMEROACEPTACION = '${v}'`);
            }
            // Ensamblar consulta final
            // if (joins.length) {
            //   sql += "\n" + joins.join("\n");
            // }
            if (where.length) {
                sql += "\nWHERE " + where.join("\n  AND ");
            }
            // Ejecutar consulta sin límite
            const rows = await this.documentoBaseRepository.query(sql);
            // Generar XML en el formato solicitado
            let xml = xml_util_1.XmlUtil.createXmlHeader();
            xml += "<Rows>\n";
            for (const row of rows) {
                xml += "<Row>\n";
                xml += `  <NumeroDoc>${xml_util_1.XmlUtil.escapeXml(row.NUMEROEXTERNO || "")}</NumeroDoc>\n`;
                xml += `  <MotivoSeleccion>${xml_util_1.XmlUtil.escapeXml(row.MOTIVO_SELECCION || "")}</MotivoSeleccion>\n`;
                xml += `  <ResultadoSeleccion>${xml_util_1.XmlUtil.escapeXml(row.RESULTADO_SELECCION || "")}</ResultadoSeleccion>\n`;
                xml += `  <Detalle>Más Info.</Detalle>\n`;
                xml += "</Row>\n";
            }
            xml += "</Rows>";
            return xml;
        }
        catch (error) {
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
    /**
     * Envía un proceso de exportación XML a la cola SQS para procesamiento asíncrono
     * El polling process (marcos/minimis_pweb_polling_process) consumirá el mensaje y lo procesará.
     * El polling process actualizará el estado en DynamoDB usando el requestId.
     */
    async exportDocumentsSQS(filters, fileName) {
        try {
            // Convertir DTO a objeto plano para el mensaje
            const filtersObj = {};
            if (filters.numeroAceptacion)
                filtersObj.numeroAceptacion = filters.numeroAceptacion;
            if (filters.tipoDocumento)
                filtersObj.tipoDocumento = filters.tipoDocumento;
            if (filters.userId)
                filtersObj.userId = filters.userId;
            if (filters.tipoLocacion)
                filtersObj.tipoLocacion = filters.tipoLocacion;
            if (filters.locacion)
                filtersObj.locacion = filters.locacion;
            if (filters.tipoFecha)
                filtersObj.tipoFecha = filters.tipoFecha;
            if (filters.fechaDesde)
                filtersObj.fechaDesde = filters.fechaDesde;
            if (filters.fechaHasta)
                filtersObj.fechaHasta = filters.fechaHasta;
            if (filters.sentidoOperacion)
                filtersObj.sentidoOperacion = filters.sentidoOperacion;
            if (filters.numeroVuelo)
                filtersObj.numeroVuelo = filters.numeroVuelo;
            if (filters.numeroManifiestoOriginal)
                filtersObj.numeroManifiestoOriginal = filters.numeroManifiestoOriginal;
            if (filters.estado)
                filtersObj.estado = filters.estado;
            if (filters.tipoParticipante)
                filtersObj.tipoParticipante = filters.tipoParticipante;
            if (filters.emisor)
                filtersObj.emisor = filters.emisor;
            // Enviar mensaje directamente a SQS usando ManifestSQSService
            const result = await this.manifestSQSService.sendXmlExportMessage(filtersObj, fileName);
            if (!result.success) {
                throw new common_1.HttpException({
                    message: 'Error al enviar mensaje a SQS',
                    error: result.error,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            // Retornar información con el requestId para que el cliente pueda consultar el estado
            return response_util_1.ResponseUtil.success({
                requestId: result.requestId,
                messageId: result.messageId,
                status: 'pending',
                message: 'Proceso de exportación XML enviado a la cola SQS. El polling process lo procesará asíncronamente.',
                note: `Usa el requestId (${result.requestId}) para consultar el estado del proceso en DynamoDB cuando el polling process lo procese.`,
            }, 'Exportación XML enviada a SQS para procesamiento asíncrono');
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
    /**
     * Consulta el estado del proceso de exportación XML por requestId
     *
     * Consulta el estado desde DynamoDB donde el polling process lo actualiza.
     */
    async getXmlExportStatus(requestId) {
        try {
            // Consultar DynamoDB
            const statusRecord = await this.exportStatusService.getStatus(requestId);
            if (!statusRecord) {
                throw new common_1.NotFoundException(`No se encontró un proceso de exportación XML con el requestId: ${requestId}`);
            }
            return response_util_1.ResponseUtil.success({
                requestId: statusRecord.requestId,
                status: statusRecord.status,
                createdAt: statusRecord.createdAt,
                updatedAt: statusRecord.updatedAt,
                signedUrl: statusRecord.signedUrl,
                fileName: statusRecord.fileName,
                error: statusRecord.error,
            }, 'Estado del proceso de exportación XML');
        }
        catch (error) {
            if (error instanceof common_1.HttpException || error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
    async closeManifestSync(payload) {
        /*
         * ALGORITMO DE PROCESAMIENTO DE DOCUMENTOS REFERENCIADOS:
         *
         * Este bloque procesa cada documento relacionado (BL, GA o GTIME) que fue encontrado
         * en la consulta anterior y almacenado en la colección ColReferencias.
         *
         * Pasos del algoritmo:
         * 1. Verificar que existan documentos referenciados en la colección
         * 2. Iterar sobre cada documento referenciado encontrado
         * 3. Extraer el ID del documento desde el Hashtable
         * 4. Consolidar el documento (BL/GA/GTIME) - actualiza estados y relaciones
         * 5. Cerrar las actividades del documento en el workflow - finaliza procesos pendientes
         *
         * Propósito: Al consolidar un manifiesto, se deben procesar todos los documentos
         * asociados (BLs, GAs, etc.) para actualizar sus estados y cerrar sus actividades
         * en el sistema de workflow.
         */
        try {
            const { documentoId } = payload;
            // Obtener driver una vez (reutilizable para múltiples consultas)
            const driver = this.dataSource.driver;
            // ========================================================================
            // PASO 01: Verificar que el estado del manifiesto sea ACEPTADO y revisado diga NO
            // ========================================================================
            const paso0Params = {
                p_id_documento: documentoId,
            };
            const paso0Sql = `
        WITH fecha_max_estados_manifiesto AS (
          SELECT 
            det.DOCUMENTO,
            MAX(det.FECHAACTIVA) AS max_fechaactiva
          FROM DOCUMENTOS.DOCESTADOS det
          WHERE det.TIPODOCUMENTO = 'MFTOC'
            AND det.ACTIVA = 'S'
            AND det.TIPOESTADO NOT IN ('FPLAZO','CON MARCA','VIS','REC')
            AND det.TIPOESTADO IN ('ACP','ANU','CMP','ACL','MOD','CMPFP', 'ACLP')
          GROUP BY det.DOCUMENTO
        ),
        estado_max_tipo_manifiesto AS (
          SELECT 
            det.DOCUMENTO,
            MAX(det.TIPOESTADO) AS max_tipoestado,
            det.FECHAACTIVA AS fechaactiva
          FROM DOCUMENTOS.DOCESTADOS det
          JOIN fecha_max_estados_manifiesto fmem ON fmem.DOCUMENTO = det.DOCUMENTO 
            AND fmem.max_fechaactiva = det.FECHAACTIVA
          WHERE det.TIPODOCUMENTO = 'MFTOC'
            AND det.ACTIVA = 'S'
            AND det.TIPOESTADO IN ('ACP','ANU','CMP','ACL','MOD','CMPFP', 'ACLP')
          GROUP BY det.DOCUMENTO, det.FECHAACTIVA
        ),
        estados_ordenados AS (
          SELECT 
            emt.DOCUMENTO,
            emt.max_tipoestado AS TIPOESTADO,
            dte.NOMBRE,
            emt.fechaactiva AS FECHA,
            ROW_NUMBER() OVER (PARTITION BY emt.DOCUMENTO ORDER BY emt.fechaactiva DESC) AS rn
          FROM estado_max_tipo_manifiesto emt
          JOIN DOCUMENTOS.DOCTIPOESTADO dte ON emt.max_tipoestado = dte.CODIGO
          WHERE dte.TIPODOCUMENTO = 'MFTOC'
        )
        SELECT
          dd.ID AS ID,
          eo.TIPOESTADO AS TIPO_ESTADO,
          eo.NOMBRE AS ESTADO,
          CASE 
            WHEN EXISTS (
              SELECT 1 
              FROM DOCUMENTOS.DOCESTADOS est 
              WHERE est.tipodocumento = dd.tipodocumento 
                AND est.documento = dd.id 
                AND est.tipoestado = 'VIS' 
                AND est.activa = 'S'
            ) THEN 'SI'
            ELSE 'NO'
          END AS REVISADO,
          dd.TIPODOCUMENTO AS TIPODOCUMENTO
        FROM DOCUMENTOS.DOCDOCUMENTOBASE dd
        JOIN DOCTRANSPORTE.DOCTRANMANIFIESTO dtm ON dd.ID = dtm.ID
        JOIN estados_ordenados eo ON dd.ID = eo.DOCUMENTO AND eo.rn = 1
        WHERE dd.ID = :p_id_documento
      `;
            const [escapedPaso0Query, escapedPaso0Params] = driver.escapeQueryWithParameters(paso0Sql, paso0Params, {});
            const paso0Rows = await this.dataSource.query(escapedPaso0Query, escapedPaso0Params);
            // Validar que el documento existe
            if (!paso0Rows || paso0Rows.length === 0) {
                return response_util_1.ResponseUtil.success({
                    documentoId,
                    valido: false,
                    message: "El documento no existe o no es un manifiesto válido",
                }, "Documento no encontrado");
            }
            const documentoInfo = paso0Rows[0];
            const estado = documentoInfo?.ESTADO || documentoInfo?.estado;
            const tipo_estado = documentoInfo?.TIPO_ESTADO || documentoInfo?.tipo_estado;
            const revisado = documentoInfo?.REVISADO || documentoInfo?.revisado;
            // Validar que el estado sea "ACEPTADO" (la consulta ya trae el nombre del estado)
            const estadoAceptado = estado && estado.toUpperCase() === "ACEPTADO";
            // Validar también por el código del tipo de estado (ambas deben concordar)
            const tipoEstadoAceptado = tipo_estado &&
                (tipo_estado.toUpperCase().includes("ACP") || tipo_estado === "ACP");
            if (!estadoAceptado || !tipoEstadoAceptado) {
                return response_util_1.ResponseUtil.success({
                    documentoId,
                    valido: false,
                    estado: estado,
                    revisado: revisado,
                    message: `El manifiesto no está en estado Aceptado. Estado actual: ${estado}`,
                }, "Estado no válido para cerrar manifiesto");
            }
            // Validar que no esté revisado
            if (revisado === "SI" || revisado === "si" || revisado === "Si") {
                return response_util_1.ResponseUtil.success({
                    documentoId,
                    valido: false,
                    estado: estado,
                    revisado: revisado,
                    message: "El manifiesto ya fue revisado, no se puede cerrar",
                }, "Manifiesto ya revisado");
            }
            console.log("Paso el paso 01");
            // ========================================================================
            // PASO 02: Verificar que el estado del manifiesto no esté anulado
            // ========================================================================
            /*
            const params: Record<string, unknown> = {
              documentoId: documentoId,
              tipoEstado: "ANU",
              activa: "S",
            };
      
            const checkAnuladoSql = `
              SELECT
                de.DOCUMENTO,
                de.TIPODOCUMENTO,
                de.TIPOESTADO,
                de.FECHA,
                de.IDUSUARIO,
                dte.NOMBRE
              FROM DOCUMENTOS.DOCESTADOS de
              JOIN DOCUMENTOS.DOCTIPOESTADO dte
                ON de.TIPODOCUMENTO = dte.TIPODOCUMENTO
                AND de.TIPOESTADO = dte.CODIGO
              WHERE de.DOCUMENTO = :documentoId
                AND de.TIPOESTADO = :tipoEstado
                AND dte.ACTIVA = :activa
                AND de.ACTIVA = :activa
            `;
      
            const [escapedQuery, escapedParams] = driver.escapeQueryWithParameters(
              checkAnuladoSql,
              params,
              {}
            );
      
            const estadoAnuladoRows = await this.dataSource.query(
              escapedQuery,
              escapedParams
            );
      
            const estaAnulado = estadoAnuladoRows && estadoAnuladoRows.length > 0;
            */
            const estaAnulado = tipo_estado && tipo_estado.toUpperCase() === "ANU";
            // 2. Si tiene estado anulado, no ejecutar el proceso
            if (estaAnulado) {
                return response_util_1.ResponseUtil.success({
                    documentoId,
                    estaAnulado: true,
                    message: "El manifiesto está anulado, no se puede cerrar",
                }, "Manifiesto anulado");
            }
            console.log("Paso el paso 02");
            // ========================================================================
            // PASO 03: Verificar que el tipo de manifiesto sea MFTOC y crear variable GTIME
            // ========================================================================
            const tipoDocumento = documentoInfo?.TIPODOCUMENTO || documentoInfo?.tipodocumento || null;
            // 4. Comparar que sea MFTOC para buscar las guías
            let tipoDocT = null; // Variable para trabajar con el tipo de documento relacionado
            if (tipoDocumento === "MFTOC") {
                tipoDocT = "GTIME"; // Si es MFTOC, trabajamos con guías tipo GTIME
            }
            // Si no es MFTOC, no se puede cerrar el manifiesto
            if (tipoDocumento !== "MFTOC") {
                return response_util_1.ResponseUtil.success({
                    documentoId,
                    valido: false,
                    tipoDocumento: tipoDocumento,
                    message: `El documento no es un manifiesto MFTOC. Tipo de documento: ${tipoDocumento}`,
                }, "Tipo de documento no válido");
            }
            console.log("Paso el paso 03");
            // ========================================================================
            // PASO 04: Buscar todas las Guías Asociadas al manifiesto
            // ========================================================================
            const buscarDocumentosRelacionadosSql = `
        SELECT DISTINCT R.DocOrigen AS Id
        FROM DOCUMENTOS.DOCRELACIONDOCUMENTO R
        JOIN DOCUMENTOS.DOCDOCUMENTOBASE D ON R.DocOrigen = D.Id
        WHERE R.DocDestino = :idManifiesto
          AND R.TipoRelacion = 'REF'
          AND D.TipoDocumento = :tipoDocT
          AND NOT EXISTS (
            SELECT 1
            FROM DOCUMENTOS.DOCESTADOS E
            WHERE E.documento = R.DocOrigen
              AND E.TipoEstado = 'ANU'
          )
          AND D.Activo = 'S'
      `;
            const documentosRelacionadosParams = {
                idManifiesto: documentoId,
                tipoDocT: tipoDocT,
            };
            const [escapedRelacionadosQuery, escapedRelacionadosParams] = driver.escapeQueryWithParameters(buscarDocumentosRelacionadosSql, documentosRelacionadosParams, {});
            const documentosRelacionadosRows = await this.dataSource.query(escapedRelacionadosQuery, escapedRelacionadosParams);
            // Extraer los IDs de los documentos relacionados
            const idsDocumentosRelacionados = documentosRelacionadosRows?.map((row) => row.Id || row.id || row.ID) || [];
            console.log("Documentos relacionados encontrados:", idsDocumentosRelacionados.length);
            console.log("Paso el paso 04", idsDocumentosRelacionados);
            /**/
            // INICIAR PROCESO DE TRANSACCIONES DE BD
            // Crear QueryRunner para manejar la transacción
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            try {
                // Consolidación de guías: Por cada Guía asociada al manifiesto
                const documentosParaConsolidar = [];
                // ========================================================================
                // PASO 05: Verificar si la guia que se trabaja en el momento del ciclo está anulada antes de consolidar
                // ========================================================================
                const obtenerEstadosDocumentoSql = `
          SELECT 
            DocEstados.Documento, 
            DocEstados.TipoDocumento, 
            DocEstados.TipoEstado, 
            DocEstados.Fecha, 
            DocEstados.IdUsuario, 
            DocTipoEstado.Nombre 
          FROM DOCUMENTOS.DocEstados, DOCUMENTOS.DocTipoEstado 
          WHERE DocEstados.Documento = :idDocumento 
            AND DocEstados.TipoDocumento = DocTipoEstado.TipoDocumento 
            AND DocEstados.TipoEstado = DocTipoEstado.Codigo 
            AND DocTipoEstado.Activa = 'S' 
            AND DocEstados.Activa = 'S'
        `;
                /** */
                for (const idDocumento of idsDocumentosRelacionados) {
                    // Flujo igual al comentario: boolean EstaAnulado = documentosDAO.getDocTieneEstado(idBL.toString(), "ANU");
                    // Ejecutar consulta de estados para este documento
                    const [escapedEstadosQuery, escapedEstadosParams] = driver.escapeQueryWithParameters(obtenerEstadosDocumentoSql, { idDocumento: idDocumento }, {});
                    const estadosRows = await queryRunner.query(escapedEstadosQuery, escapedEstadosParams);
                    // Verificar si tiene estado 'ANU' (similar al while(rset.next()) del comentario)
                    let estaAnulado = false;
                    for (const estadoRow of estadosRows) {
                        const estado = estadoRow.TipoEstado || estadoRow.tipoestado;
                        // Si encuentra el estado 'ANU', marca como anulado (igual al comentario: if(estado.equals(tipoEstado)) return true)
                        if (estado === "ANU") {
                            estaAnulado = true;
                            break; // Similar al return true del comentario
                        }
                    }
                    // Si está anulado, omitir del proceso de consolidación (igual al comentario: if (EstaAnulado) return;)
                    if (estaAnulado) {
                        console.log(`[CONSOLIDACION] Documento ${idDocumento} ANULADO no se CONSOLIDA`);
                        continue; // Similar al return del comentario, pero continuamos con el siguiente documento
                    }
                    // Si no está anulado, agregarlo a la lista para consolidar
                    documentosParaConsolidar.push(idDocumento);
                    // ========================================================================
                    // PASO 06: Calcular el MAX(ID) +1 para el estado conformado
                    // ========================================================================
                    const calcularMaxIdEstadoSql = `
            SELECT MAX(Id) AS MaxId
            FROM DOCUMENTOS.DocEstados
            WHERE Documento = :idDocumento
              AND TipoDocumento = :tipoDocT
              AND TipoEstado = 'CMP'
          `;
                    const [escapedMaxIdQuery, escapedMaxIdParams] = driver.escapeQueryWithParameters(calcularMaxIdEstadoSql, {
                        idDocumento: idDocumento,
                        tipoDocT: tipoDocT,
                    }, {});
                    const maxIdRows = await queryRunner.query(escapedMaxIdQuery, escapedMaxIdParams);
                    let nextIdEstado = 1;
                    if (maxIdRows && maxIdRows.length > 0) {
                        const row = maxIdRows[0];
                        let maxId = null;
                        if (row.MAXID !== undefined) {
                            maxId = row.MAXID;
                        }
                        else if (row.MaxId !== undefined) {
                            maxId = row.MaxId;
                        }
                        else if (row.maxid !== undefined) {
                            maxId = row.maxid;
                        }
                        else if (row.MAX_ID !== undefined) {
                            maxId = row.MAX_ID;
                        }
                        if (maxId !== null && maxId !== undefined && maxId !== "") {
                            const maxIdNumber = Number(maxId);
                            if (!isNaN(maxIdNumber)) {
                                nextIdEstado = maxIdNumber + 1;
                            }
                        }
                    }
                    console.log(`Documento ${idDocumento}: Siguiente Id para estado CMP será ${nextIdEstado}`);
                    // ========================================================================
                    // PASO 07: Crear el estado con el ID generado anteriormente
                    // ========================================================================
                    const fechaConsolidacion = new Date(); // Fecha actual de la consolidación
                    const insertarEstadoCmpSql = `
            INSERT INTO DOCUMENTOS.DocEstados(
              Documento, 
              TipoDocumento, 
              TipoEstado, 
              Id, 
              Fecha, 
              Observacion, 
              IdUsuario, 
              Activa, 
              FechaActiva, 
              FechaDesactiva
            ) VALUES (
              :idDocumento,
              :tipoDocT,
              'CMP',
              :nextIdEstado,
              :fechaConsolidacion,
              'CONFORMACION GENERADA AUTOMATICAMENTE POR ISIDORA ',
              '[automatico]',
              'S',
              :fechaConsolidacion,
              :fechaConsolidacion
            )
          `;
                    const [escapedInsertQuery, escapedInsertParams] = driver.escapeQueryWithParameters(insertarEstadoCmpSql, {
                        idDocumento: idDocumento,
                        tipoDocT: tipoDocT,
                        nextIdEstado: nextIdEstado,
                        fechaConsolidacion: fechaConsolidacion,
                    }, {});
                    await queryRunner.query(escapedInsertQuery, escapedInsertParams);
                    console.log(`Estado CMP insertado para documento ${idDocumento} con Id ${nextIdEstado}`);
                    // ========================================================================
                    // PASO 08: Buscar relaciones pendientes para la guía que se acaba de registrar
                    // ========================================================================
                    const buscarRelacionesPendientesSql = `
            SELECT 
              R.TipoRelacion AS TipoRelacion, 
              R.Id AS Id, 
              D.Id AS DocId
            FROM DOCUMENTOS.DocRelacionDocumento R, DOCUMENTOS.DocDocumentoBase D
            WHERE R.DocOrigen = :idDocumento 
              AND R.DocDestino IS NULL
              AND D.TipoDocumento = R.TipoDocDestino
              AND D.NumeroExterno = R.NumDocDestino
              AND D.IdEmisor = R.EmisorDocDestino
              AND D.FechaEmision = R.FechaDocDestino
              AND D.Activo = 'S' 
              AND R.Activo = 'S'
          `;
                    const [escapedRelacionesQuery, escapedRelacionesParams] = driver.escapeQueryWithParameters(buscarRelacionesPendientesSql, { idDocumento: idDocumento }, {});
                    const relacionesPendientesRows = await queryRunner.query(escapedRelacionesQuery, escapedRelacionesParams);
                    console.log(`Documento ${idDocumento}: Encontradas ${relacionesPendientesRows?.length || 0} relaciones pendientes`);
                    console.log("relacionesPendientesRows", relacionesPendientesRows);
                    // Por cada relación encontrada a la guía
                    for (const relacionRow of relacionesPendientesRows || []) {
                        try {
                            const tipoRelacion = relacionRow.TipoRelacion || relacionRow.tiporelacion;
                            const relacionId = relacionRow.Id || relacionRow.id;
                            const docId = relacionRow.DocId || relacionRow.docid;
                            // ========================================================================
                            // PASO 09: SELECT - Obtener el siguiente correlativo para el historial
                            // ========================================================================
                            const calcularNextCorrelativeSql = `
                SELECT MAX(Id) AS MaxId
                FROM DOCUMENTOS.DocHRelacionDocumento
                WHERE TipoRelacion = :tipoRelacion
                  AND DocOrigen = :idDocumento
                  AND RelacionDocumento = :relacionId
              `;
                            const [escapedCorrelativeQuery, escapedCorrelativeParams] = driver.escapeQueryWithParameters(calcularNextCorrelativeSql, {
                                tipoRelacion: tipoRelacion,
                                idDocumento: idDocumento,
                                relacionId: relacionId,
                            }, {});
                            const correlativeRows = await queryRunner.query(escapedCorrelativeQuery, escapedCorrelativeParams);
                            // Calcular NextCorrelative (similar a nextIdEstado)
                            let nextCorrelative = 1;
                            if (correlativeRows && correlativeRows.length > 0) {
                                const row = correlativeRows[0];
                                let maxId = null;
                                if (row.MAXID !== undefined) {
                                    maxId = row.MAXID;
                                }
                                else if (row.MaxId !== undefined) {
                                    maxId = row.MaxId;
                                }
                                else if (row.maxid !== undefined) {
                                    maxId = row.maxid;
                                }
                                if (maxId !== null && maxId !== undefined && maxId !== "") {
                                    const maxIdNumber = Number(maxId);
                                    if (!isNaN(maxIdNumber)) {
                                        nextCorrelative = maxIdNumber + 1;
                                    }
                                }
                            }
                            // ========================================================================
                            // PASO 10: INSERT - Guardar registro histórico de la relación
                            // ========================================================================
                            const insertarHistorialRelacionSql = `
                INSERT INTO DOCUMENTOS.DocHRelacionDocumento (
                  TipoRelacion,
                  DocOrigen,
                  RelacionDocumento,
                  Id,
                  Fecha,
                  Observacion,
                  IdUsuario,
                  TipoDocDestino,
                  NumDocDestino,
                  DocDestino,
                  EmisorDocDestino,
                  NombreEmisor,
                  Activo,
                  FechaActiva,
                  FechaDesactiva,
                  FechaDocDestino
                )
                SELECT 
                  R.TipoRelacion,
                  R.DocOrigen,
                  R.Id,
                  :nextCorrelative,
                  R.Fecha,
                  R.Observacion,
                  R.IdUsuario,
                  R.TipoDocDestino,
                  R.NumDocDestino,
                  R.DocDestino,
                  R.EmisorDocDestino,
                  R.NombreEmisor,
                  R.Activo,
                  R.FechaActiva,
                  :fechaConsolidacion,
                  R.FechaDocDestino
                FROM DOCUMENTOS.DocRelacionDocumento R
                WHERE R.TipoRelacion = :tipoRelacion
                  AND R.DocOrigen = :idDocumento
                  AND R.Id = :relacionId
              `;
                            const [escapedHistorialQuery, escapedHistorialParams] = driver.escapeQueryWithParameters(insertarHistorialRelacionSql, {
                                nextCorrelative: nextCorrelative,
                                fechaConsolidacion: fechaConsolidacion,
                                tipoRelacion: tipoRelacion,
                                idDocumento: idDocumento,
                                relacionId: relacionId,
                            }, {});
                            await queryRunner.query(escapedHistorialQuery, escapedHistorialParams);
                            console.log(`Historial de relación insertado: TipoRelacion=${tipoRelacion}, RelacionId=${relacionId}, Correlative=${nextCorrelative}`);
                            // ========================================================================
                            // PASO 11: UPDATE - Vincular el documento destino encontrado
                            // ========================================================================
                            const actualizarRelacionSql = `
                UPDATE DOCUMENTOS.DocRelacionDocumento 
                SET DocDestino = :docId
                WHERE TipoRelacion = :tipoRelacion
                  AND DocOrigen = :idDocumento
                  AND Id = :relacionId
              `;
                            const [escapedUpdateQuery, escapedUpdateParams] = driver.escapeQueryWithParameters(actualizarRelacionSql, {
                                docId: docId,
                                tipoRelacion: tipoRelacion,
                                idDocumento: idDocumento,
                                relacionId: relacionId,
                            }, {});
                            await queryRunner.query(escapedUpdateQuery, escapedUpdateParams);
                            console.log(`Relación actualizada: DocDestino=${docId} asignado a TipoRelacion=${tipoRelacion}, RelacionId=${relacionId}`);
                        }
                        catch (error) {
                            console.error(`Error al procesar relación para documento ${idDocumento}:`, error);
                            throw error; // Re-lanzar el error para hacer rollback de toda la transacción
                        }
                    }
                    // ========================================================================
                    // PASO 12: SELECT - Verificar si la guía es huérfana
                    // ========================================================================
                    const verificarEsHuerfanoSql = `
            SELECT COUNT(1) AS Total
            FROM DOCUMENTOS.DocRelacionDocumento R
            WHERE R.DocOrigen = :idDocumento
              AND R.DocDestino IS NULL
              AND R.TipoRelacion = 'MADRE'
              AND R.Activo = 'S'
          `;
                    const [escapedHuerfanoQuery, escapedHuerfanoParams] = driver.escapeQueryWithParameters(verificarEsHuerfanoSql, {
                        idDocumento: idDocumento,
                    }, {});
                    const huerfanoRows = await queryRunner.query(escapedHuerfanoQuery, escapedHuerfanoParams);
                    let esHuerfano = false;
                    if (huerfanoRows && huerfanoRows.length > 0) {
                        const row = huerfanoRows[0];
                        const total = row.TOTAL || row.total || row.Total || 0;
                        esHuerfano = Number(total) > 0;
                    }
                    console.log(`Documento ${idDocumento}: Es huérfano = ${esHuerfano}`);
                    if (esHuerfano) {
                        // ========================================================================
                        // PASO 13: SELECT - Obtener el siguiente ID de estado "H"
                        // ========================================================================
                        const calcularMaxIdEstadoHSql = `
              SELECT MAX(Id) AS MaxId
              FROM DOCUMENTOS.DocEstados
              WHERE Documento = :idDocumento
                AND TipoDocumento = :tipoDocT
                AND TipoEstado = 'H'
            `;
                        const [escapedMaxIdHQuery, escapedMaxIdHParams] = driver.escapeQueryWithParameters(calcularMaxIdEstadoHSql, {
                            idDocumento: idDocumento,
                            tipoDocT: tipoDocT,
                        }, {});
                        const maxIdHRows = await queryRunner.query(escapedMaxIdHQuery, escapedMaxIdHParams);
                        let nextIdEstadoH = 1;
                        if (maxIdHRows && maxIdHRows.length > 0) {
                            const row = maxIdHRows[0];
                            let maxIdH = null;
                            if (row.MAXID !== undefined) {
                                maxIdH = row.MAXID;
                            }
                            else if (row.MaxId !== undefined) {
                                maxIdH = row.MaxId;
                            }
                            else if (row.maxid !== undefined) {
                                maxIdH = row.maxid;
                            }
                            else if (row.MAX_ID !== undefined) {
                                maxIdH = row.MAX_ID;
                            }
                            if (maxIdH !== null && maxIdH !== undefined && maxIdH !== "") {
                                const maxIdHNumber = Number(maxIdH);
                                if (!isNaN(maxIdHNumber)) {
                                    nextIdEstadoH = maxIdHNumber + 1;
                                }
                            }
                        }
                        console.log(`Documento ${idDocumento}: Siguiente Id para estado H será ${nextIdEstadoH}`);
                        // ========================================================================
                        // PASO 14: INSERT - Crear el estado "H" (Hijo sin madre)
                        // ========================================================================
                        const fechaEstadoH = new Date();
                        const insertarEstadoHSql = `
              INSERT INTO DOCUMENTOS.DocEstados(
                Documento,
                TipoDocumento,
                TipoEstado,
                Id,
                Fecha,
                Observacion,
                IdUsuario,
                Activa,
                FechaActiva,
                FechaDesactiva
              ) VALUES (
                :idDocumento,
                :tipoDocT,
                'H',
                :nextIdEstadoH,
                :fechaEstadoH,
                'BL SIN MADRE',
                '[automatico]',
                'S',
                :fechaEstadoH,
                NULL
              )
            `;
                        const [escapedInsertHQuery, escapedInsertHParams] = driver.escapeQueryWithParameters(insertarEstadoHSql, {
                            idDocumento: idDocumento,
                            tipoDocT: tipoDocT,
                            nextIdEstadoH: nextIdEstadoH,
                            fechaEstadoH: fechaEstadoH,
                        }, {});
                        await queryRunner.query(escapedInsertHQuery, escapedInsertHParams);
                        console.log(`Estado H insertado para documento ${idDocumento} con Id ${nextIdEstadoH}`);
                    }
                    // ========================================================================
                    // PASO 15: Cerrar actividades y ciclos abiertos del workflow para la guía
                    // ========================================================================
                    let encontroCiclo = false;
                    do {
                        // Buscar ciclos abiertos para el documento
                        const buscarCiclosAbiertosSql = `
              SELECT 
                Cicle.ActivityName AS ActivityName,
                Cicle.Id AS CicleId
              FROM Cicle, InputDocument
              WHERE Cicle.ApplicationName = 'WFDocTransporte'
                AND Cicle.ApplicationName = InputDocument.ApplicationName
                AND Cicle.ActivityName = InputDocument.ActivityName
                AND InputDocument.CicleId = Cicle.Id
                AND Cicle.isOpen = 'Y'
                AND InputDocument.ApplicationName = 'WFDocTransporte'
                AND InputDocument.ObjectId = :idDocumento
            `;
                        const [escapedCiclosQuery, escapedCiclosParams] = driver.escapeQueryWithParameters(buscarCiclosAbiertosSql, {
                            idDocumento: idDocumento.toString(),
                        }, {});
                        const ciclosRows = await queryRunner.query(escapedCiclosQuery, escapedCiclosParams);
                        console.log("Ciclos abiertos encontrados: ", ciclosRows);
                        encontroCiclo = ciclosRows && ciclosRows.length > 0;
                        console.log("encontroCiclo", encontroCiclo);
                        if (encontroCiclo) {
                            const cicloRow = ciclosRows[0];
                            let activityName = cicloRow.ActivityName || cicloRow.activityname;
                            let cicleId = cicloRow.CicleId || cicloRow.cicleid || cicloRow.CICLEID;
                            // Mientras haya actividad, cerrar ciclo y buscar padre
                            while (activityName) {
                                // Cerrar el ciclo (UPDATE isOpen = 'N')
                                const cerrarCicloSql = `
                  UPDATE Cicle
                  SET isOpen = 'N'
                  WHERE ApplicationName = 'WFDocTransporte'
                    AND ActivityName = :activityName
                    AND Id = :cicleId
                `;
                                const [escapedCerrarQuery, escapedCerrarParams] = driver.escapeQueryWithParameters(cerrarCicloSql, {
                                    activityName: activityName,
                                    cicleId: cicleId,
                                }, {});
                                await queryRunner.query(escapedCerrarQuery, escapedCerrarParams);
                                console.log(`Ciclo cerrado para documento ${idDocumento}: ActivityName=${activityName}, CicleId=${cicleId}`);
                                // Buscar ciclo padre (si existe)
                                const buscarPadreSql = `
                  SELECT 
                    Cicle.ParentActivity AS ParentActivity,
                    Cicle.ParentCicle AS ParentCicle
                  FROM Cicle
                  WHERE ApplicationName = 'WFDocTransporte'
                    AND ActivityName = :activityName
                    AND Id = :cicleId
                `;
                                const [escapedPadreQuery, escapedPadreParams] = driver.escapeQueryWithParameters(buscarPadreSql, {
                                    activityName: activityName,
                                    cicleId: cicleId,
                                }, {});
                                const padreRows = await queryRunner.query(escapedPadreQuery, escapedPadreParams);
                                if (padreRows && padreRows.length > 0) {
                                    const padreRow = padreRows[0];
                                    activityName =
                                        padreRow.ParentActivity ||
                                            padreRow.parentactivity ||
                                            padreRow.PARENTACTIVITY ||
                                            null;
                                    cicleId =
                                        padreRow.ParentCicle ||
                                            padreRow.parentcicle ||
                                            padreRow.PARENTCICLE ||
                                            null;
                                }
                                else {
                                    activityName = null;
                                }
                            }
                        }
                    } while (encontroCiclo);
                    /** fin dentro del for */
                } // Fin del for de documentos
                /**/
                // Fin de Consolidación de guías
                console.log(`Documentos válidos para consolidar: ${documentosParaConsolidar.length} de ${idsDocumentosRelacionados.length}`);
                // ========================================================================
                // PASO 16: Ejecutar proceso batch para manifiestos aéreos y courier
                // ========================================================================
                if (tipoDocumento === "MFTOC") {
                    try {
                        const consolidacionBatchSql = `
              BEGIN
                DOCUMENTOS.PK_COURIERS_FISCALIZACION.PR_COURIERS_BLFISCALIZACIONES(:idManifiesto);
              END;
            `;
                        const [escapedBatchQuery, escapedBatchParams] = driver.escapeQueryWithParameters(consolidacionBatchSql, { idManifiesto: documentoId }, {});
                        await queryRunner.query(escapedBatchQuery, escapedBatchParams);
                        console.log(`[PASO 16] Proceso batch de consolidación ejecutado para manifiesto ${documentoId}`);
                    }
                    catch (batchError) {
                        console.error(`[PASO 16] Error al ejecutar proceso batch para manifiesto ${documentoId}:`, batchError);
                        // Mantener el comportamiento del código legado: registrar el error y continuar
                    }
                }
                else {
                    console.log(`[PASO 16] Tipo de documento ${tipoDocumento} no requiere proceso batch`);
                }
                // ========================================================================
                // PASO 17: Cambiar estado del manifiesto de "Aceptado" a "Conformado"
                // ========================================================================
                if (tipoDocumento === "MFTOC") {
                    console.log(`[PASO 17] Iniciando cambio de estado a CMP para manifiesto ${documentoId}`);
                    const calcularMaxIdManifestoSql = `
            SELECT MAX(Id) AS MaxId
            FROM DOCUMENTOS.DocEstados
            WHERE Documento = :idDocumento
              AND TipoDocumento = :tipoDocumento
              AND TipoEstado = 'CMP'
          `;
                    const [escapedMaxIdManifestoQuery, escapedMaxIdManifestoParams] = driver.escapeQueryWithParameters(calcularMaxIdManifestoSql, {
                        idDocumento: documentoId,
                        tipoDocumento: "MFTOC",
                    }, {});
                    const maxIdManifestoRows = await queryRunner.query(escapedMaxIdManifestoQuery, escapedMaxIdManifestoParams);
                    let nextIdEstadoManifiesto = 1;
                    if (maxIdManifestoRows && maxIdManifestoRows.length > 0) {
                        const row = maxIdManifestoRows[0];
                        let maxId = null;
                        if (row.MAXID !== undefined) {
                            maxId = row.MAXID;
                        }
                        else if (row.MaxId !== undefined) {
                            maxId = row.MaxId;
                        }
                        else if (row.maxid !== undefined) {
                            maxId = row.maxid;
                        }
                        else if (row.MAX_ID !== undefined) {
                            maxId = row.MAX_ID;
                        }
                        if (maxId !== null && maxId !== undefined && maxId !== "") {
                            const maxIdNumber = Number(maxId);
                            if (!isNaN(maxIdNumber)) {
                                nextIdEstadoManifiesto = maxIdNumber + 1;
                            }
                        }
                    }
                    console.log(`[PASO 17] Manifiesto ${documentoId}: siguiente Id para estado CMP será ${nextIdEstadoManifiesto}`);
                    const fechaEstadoManifiesto = new Date();
                    const insertarEstadoManifestoSql = `
            INSERT INTO DOCUMENTOS.DocEstados(
              Documento,
              TipoDocumento,
              TipoEstado,
              Id,
              Fecha,
              Observacion,
              IdUsuario,
              Activa,
              FechaActiva,
              FechaDesactiva
            ) VALUES (
              :idDocumento,
              :tipoDocumento,
              'CMP',
              :nextIdEstado,
              :fechaEstado,
              'MANIFIESTO CONFORMADO AUTOMATICAMENTE POR ISIDORA',
              '[automatico]',
              'S',
              :fechaEstado,
              :fechaEstado
            )
          `;
                    const [escapedInsertManifestoQuery, escapedInsertManifestoParams] = driver.escapeQueryWithParameters(insertarEstadoManifestoSql, {
                        idDocumento: documentoId,
                        tipoDocumento: "MFTOC",
                        nextIdEstado: nextIdEstadoManifiesto,
                        fechaEstado: fechaEstadoManifiesto,
                    }, {});
                    await queryRunner.query(escapedInsertManifestoQuery, escapedInsertManifestoParams);
                    console.log(`[PASO 17] Manifiesto ${documentoId} actualizado a estado CMP`);
                }
                else {
                    console.log(`[PASO 17] Tipo de documento ${tipoDocumento} no requiere cambio de estado a CMP`);
                }
                // ========================================================================
                // PASO 18: Consultar nuevamente el estado del manifiesto y retornarlo
                // ========================================================================
                const paso18Params = {
                    p_id_documento: documentoId,
                };
                const [escapedPaso18Query, escapedPaso18Params] = driver.escapeQueryWithParameters(paso0Sql, paso18Params, {});
                const paso18Rows = await queryRunner.query(escapedPaso18Query, escapedPaso18Params);
                let estadoFinalManifiesto = null;
                let tipoEstadoFinalManifiesto = null;
                let tipoDocumentoFinal = null;
                if (paso18Rows && paso18Rows.length > 0) {
                    const finalInfo = paso18Rows[0];
                    estadoFinalManifiesto = finalInfo?.ESTADO || finalInfo?.estado || null;
                    tipoEstadoFinalManifiesto =
                        finalInfo?.TIPO_ESTADO || finalInfo?.tipo_estado || null;
                    tipoDocumentoFinal =
                        finalInfo?.TIPODOCUMENTO || finalInfo?.tipodocumento || null;
                    console.log(`[PASO 18] Estado final del manifiesto ${documentoId}: ${estadoFinalManifiesto} (${tipoEstadoFinalManifiesto})`);
                }
                else {
                    console.warn(`[PASO 18] No se pudo obtener el estado final del manifiesto ${documentoId}`);
                }
                /** */
                // Commit de la transacción si todo salió bien
                await queryRunner.commitTransaction();
                console.log("Transacción de consolidación confirmada exitosamente");
                const result = {
                    documentoId,
                    estaAnulado: false,
                    estadoManifiesto: estadoFinalManifiesto,
                    tipoEstadoManifiesto: tipoEstadoFinalManifiesto,
                    tipoDocumento: tipoDocumentoFinal || tipoDocumento || null,
                    message: "Manifest closed",
                };
                return response_util_1.ResponseUtil.success(result, "Manifest closed");
            }
            catch (error) {
                // Rollback de la transacción en caso de error
                await queryRunner.rollbackTransaction();
                console.error("Error en proceso de consolidación. Transacción revertida:", error);
                throw error;
            }
            finally {
                // Liberar el QueryRunner
                await queryRunner.release();
            }
        }
        catch (error) {
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
    async closeManifestSQS(payload, request) {
        /*
         * PROCESO ASÍNCRONO DE CIERRE DE MANIFIESTO:
         *
         * Este método envía el proceso de cierre de manifiesto directamente a SQS.
         * El servicio marcos/minimis_pweb_polling_process consumirá el mensaje y lo procesará.
         *
         * El polling process actualizará el estado en DynamoDB usando el requestId.
         */
        try {
            const { documentoId } = payload;
            // Obtener userId del request si está disponible
            let userId;
            if (request?.user) {
                const { sub } = request.user;
                userId = sub?.split('_').pop() || undefined;
            }
            // Enviar mensaje directamente a SQS usando ManifestSQSService
            const result = await this.manifestSQSService.sendManifestCloseMessage(documentoId, userId, 2 // delaySeconds por defecto
            );
            if (!result.success) {
                throw new common_1.HttpException({
                    message: 'Error al enviar mensaje a SQS',
                    error: result.error,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            // Retornar información con el requestId para que el cliente pueda consultar el estado
            return response_util_1.ResponseUtil.success({
                documentoId,
                requestId: result.requestId,
                messageId: result.messageId,
                status: 'pending',
                message: 'Proceso de cierre de manifiesto enviado a la cola SQS. El polling process lo procesará asíncronamente.',
                note: `Usa el requestId (${result.requestId}) para consultar el estado del proceso en DynamoDB cuando el polling process lo procese.`,
            }, 'Cierre de manifiesto enviado a SQS para procesamiento asíncrono');
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
    /**
     * Consulta el estado del proceso de cierre de manifiesto por requestId
     *
     * Consulta el estado desde DynamoDB donde el polling process lo actualiza.
     * Si no encuentra en DynamoDB, intenta consultar API Gateway como fallback
     * (para compatibilidad con procesos antiguos).
     *
     * @param requestId - Identificador único del proceso (UUID)
     */
    async getManifestCloseStatus(requestId) {
        try {
            // Consultar DynamoDB (método principal)
            try {
                const statusRecord = await this.exportStatusService.getStatus(requestId);
                if (statusRecord) {
                    // Extraer documentoId del fileName si está disponible
                    // El fileName puede contener: "Manifest closed successfully - DocumentoId: 123"
                    let documentoId;
                    if (statusRecord.fileName) {
                        const match = statusRecord.fileName.match(/DocumentoId:\s*(\d+)/i);
                        if (match) {
                            documentoId = parseInt(match[1], 10);
                        }
                    }
                    return response_util_1.ResponseUtil.success({
                        requestId: statusRecord.requestId,
                        documentoId: documentoId,
                        status: statusRecord.status,
                        createdAt: statusRecord.createdAt,
                        updatedAt: statusRecord.updatedAt,
                        signedUrl: statusRecord.signedUrl,
                        fileName: statusRecord.fileName,
                        error: statusRecord.error,
                    }, 'Estado del proceso de cierre de manifiesto');
                }
            }
            catch (dynamoError) {
                // Si DynamoDB no está configurado o hay error, intentar API Gateway como fallback
                this.logger.debug(`DynamoDB query failed, trying API Gateway fallback: ${dynamoError.message}`);
            }
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = DocumentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.DocDocumentoBase)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_2.DocParticipacion)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_2.DocLocacionDocumento))
], DocumentsService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRvcy5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZG9jdW1lbnRvcy5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFBQSx5Q0FBOEM7QUFDOUMsdURBR2tDO0FBTWxDLDZDQUFtRDtBQUNuRCwwREFBc0Q7QUFPdEQsb0VBQWdFO0FBQ2hFLDJDQUFrRztBQVEzRixJQUFNLGdCQUFnQix3QkFBdEIsTUFBTSxnQkFBZ0I7SUFFM0IsWUFFRSx1QkFBc0UsRUFFdEUsdUJBQXNFLEVBRXRFLDJCQUE4RSxFQUM3RCxVQUFzQixFQUN0QixrQkFBc0MsRUFDdEMsbUJBQXdDLEVBQ3hDLGFBQTRCO1FBUjVCLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBOEI7UUFFckQsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUE4QjtRQUVyRCxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQWtDO1FBQzdELGVBQVUsR0FBVixVQUFVLENBQVk7UUFDdEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtRQUN0Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1FBQ3hDLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1FBWDlCLFdBQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxrQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQVl6RCxDQUFDO0lBRUo7Ozs7O09BS0c7SUFDSyxZQUFZLENBQUMsTUFBZSxFQUFFLFNBQTBCO1FBQzlELE1BQU0sWUFBWSxHQUEyQjtZQUMzQyxJQUFJLEVBQUUsSUFBSTtZQUNWLGVBQWUsRUFBRSxnQkFBZ0I7WUFDakMsMEJBQTBCLEVBQUUscUJBQXFCO1lBQ2pELFFBQVEsRUFBRSxRQUFRO1lBQ2xCLGdCQUFnQixFQUFFLGtCQUFrQjtZQUNwQyxRQUFRLEVBQUUsUUFBUTtZQUNsQixpQkFBaUIsRUFBRSxrQkFBa0I7WUFDckMsYUFBYSxFQUFFLGNBQWM7WUFDN0IsbUJBQW1CLEVBQUUsb0JBQW9CO1lBQ3pD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QUFTO3dCQUNqQyxTQUFTLEVBQUUsWUFBWSxDQUFDLFNBQVM7d0JBQ2pDLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUTt3QkFDL0IsS0FBSyxFQUFFLFlBQVksQ0FBQyxLQUFLO3FCQUMxQixFQUNELDRDQUE0QyxDQUM3QyxDQUFDO2dCQUNKLENBQUM7WUFDSCxDQUFDO1lBQUMsT0FBTyxXQUFnQixFQUFFLENBQUM7Z0JBQzFCLGtGQUFrRjtnQkFDbEYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsdURBQXVELFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ2xHLENBQUM7UUFDSCxDQUFDO1FBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztZQUNwQixJQUFJLEtBQUssWUFBWSxzQkFBYSxFQUFFLENBQUM7Z0JBQ25DLE1BQU0sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELE1BQU0sNEJBQVksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUMsQ0FBQztJQUNILENBQUM7Q0FFRixDQUFBO0FBbHZEWSw0Q0FBZ0I7MkJBQWhCLGdCQUFnQjtJQUQ1QixJQUFBLG1CQUFVLEdBQUU7SUFJUixXQUFBLElBQUEsMEJBQWdCLEVBQUMsMkJBQWdCLENBQUMsQ0FBQTtJQUVsQyxXQUFBLElBQUEsMEJBQWdCLEVBQUMsMkJBQWdCLENBQUMsQ0FBQTtJQUVsQyxXQUFBLElBQUEsMEJBQWdCLEVBQUMsK0JBQW9CLENBQUMsQ0FBQTtHQVA5QixnQkFBZ0IsQ0FrdkQ1QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERvY0RvY3VtZW50b0Jhc2UgfSBmcm9tIFwiLi9lbnRpdGllc1wiO1xyXG5pbXBvcnQge1xyXG4gIERvY0xvY2FjaW9uRG9jdW1lbnRvLFxyXG4gIERvY1BhcnRpY2lwYWNpb24sXHJcbn0gZnJvbSBcIi4uL2RpY3Rpb25hcmllcy9lbnRpdGllc1wiO1xyXG5pbXBvcnQge1xyXG4gIEJ1c2NhckRvY3VtZW50b3NEdG8sXHJcbiAgT2J0ZW5lckRldGFsbGVzQ29tcGxldG9zRHRvLFxyXG4gIENsb3NlTWFuaWZlc3REdG8sXHJcbn0gZnJvbSBcIi4vZHRvL2RvY3VtZW50b3MuZHRvXCI7XHJcbmltcG9ydCB7IEluamVjdFJlcG9zaXRvcnkgfSBmcm9tIFwiQG5lc3Rqcy90eXBlb3JtXCI7XHJcbmltcG9ydCB7IFhtbFV0aWwgfSBmcm9tIFwiLi4vLi4vc2hhcmVkL3V0aWxzL3htbC51dGlsXCI7XHJcbmltcG9ydCB7XHJcbiAgUmVwb3NpdG9yeSxcclxuICBTZWxlY3RRdWVyeUJ1aWxkZXIsXHJcbiAgRGF0YVNvdXJjZSxcclxuICBRdWVyeVJ1bm5lcixcclxufSBmcm9tIFwidHlwZW9ybVwiO1xyXG5pbXBvcnQgeyBSZXNwb25zZVV0aWwgfSBmcm9tIFwiLi4vLi4vc2hhcmVkL3V0aWxzL3Jlc3BvbnNlLnV0aWxcIjtcclxuaW1wb3J0IHsgSW5qZWN0YWJsZSwgTm90Rm91bmRFeGNlcHRpb24sIEh0dHBFeGNlcHRpb24sIEh0dHBTdGF0dXMsIExvZ2dlciB9IGZyb20gXCJAbmVzdGpzL2NvbW1vblwiO1xyXG5pbXBvcnQgeyBNYW5pZmVzdFNRU1NlcnZpY2UgfSBmcm9tICcuLi8uLi9zZXJ2aWNlL21hbmlmZXN0LXNxcy5zZXJ2aWNlJztcclxuaW1wb3J0IHsgRXhwb3J0U3RhdHVzU2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZpY2UvZXhwb3J0LXN0YXR1cy5zZXJ2aWNlJztcclxuaW1wb3J0IHsgQ29uZmlnU2VydmljZSB9IGZyb20gJ0BuZXN0anMvY29uZmlnJztcclxuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcclxuaW1wb3J0IHsgUmVxdWVzdEludGVyZmFjZSB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvcmVxdWVzdC5pbnRlcmZhY2UnO1xyXG5cclxuQEluamVjdGFibGUoKVxyXG5leHBvcnQgY2xhc3MgRG9jdW1lbnRzU2VydmljZSB7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBsb2dnZXIgPSBuZXcgTG9nZ2VyKERvY3VtZW50c1NlcnZpY2UubmFtZSk7XHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBASW5qZWN0UmVwb3NpdG9yeShEb2NEb2N1bWVudG9CYXNlKVxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBkb2N1bWVudG9CYXNlUmVwb3NpdG9yeTogUmVwb3NpdG9yeTxEb2NEb2N1bWVudG9CYXNlPixcclxuICAgIEBJbmplY3RSZXBvc2l0b3J5KERvY1BhcnRpY2lwYWNpb24pXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHBhcnRpY2lwYWNpb25SZXBvc2l0b3J5OiBSZXBvc2l0b3J5PERvY1BhcnRpY2lwYWNpb24+LFxyXG4gICAgQEluamVjdFJlcG9zaXRvcnkoRG9jTG9jYWNpb25Eb2N1bWVudG8pXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGxvY2FjaW9uRG9jdW1lbnRvUmVwb3NpdG9yeTogUmVwb3NpdG9yeTxEb2NMb2NhY2lvbkRvY3VtZW50bz4sXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRhdGFTb3VyY2U6IERhdGFTb3VyY2UsXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1hbmlmZXN0U1FTU2VydmljZTogTWFuaWZlc3RTUVNTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRTdGF0dXNTZXJ2aWNlOiBFeHBvcnRTdGF0dXNTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBjb25maWdTZXJ2aWNlOiBDb25maWdTZXJ2aWNlXHJcbiAgKSB7fVxyXG5cclxuICAvKipcclxuICAgKiBCdWlsZCBPUkRFUiBCWSBjbGF1c2Ugc2FmZWx5IGJhc2VkIG9uIHNvcnRCeSBhbmQgc29ydE9yZGVyXHJcbiAgICogQHBhcmFtIHNvcnRCeSAtIEZpZWxkIG5hbWUgZnJvbSBmcm9udGVuZFxyXG4gICAqIEBwYXJhbSBzb3J0T3JkZXIgLSBEaXJlY3Rpb24gKGFzYyBvciBkZXNjKVxyXG4gICAqIEByZXR1cm5zIFNhZmUgU1FMIE9SREVSIEJZIGNsYXVzZVxyXG4gICAqL1xyXG4gIHByaXZhdGUgYnVpbGRPcmRlckJ5KHNvcnRCeT86IHN0cmluZywgc29ydE9yZGVyPzogJ2FzYycgfCAnZGVzYycpOiBzdHJpbmcge1xyXG4gICAgY29uc3Qgc29ydEZpZWxkTWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xyXG4gICAgICAnaWQnOiAnSUQnLFxyXG4gICAgICAnbnVtZXJvRXh0ZXJubyc6ICdOVU1FUk9fRVhURVJOTycsXHJcbiAgICAgICdudW1lcm9SZWZlcmVuY2lhT3JpZ2luYWwnOiAnTlVNRVJPX1JFRl9PUklHSU5BTCcsXHJcbiAgICAgICdlc3RhZG8nOiAnRVNUQURPJyxcclxuICAgICAgJ251bWVyb01hc3RlckdhJzogJ05VTUVST19NQVNURVJfR0EnLFxyXG4gICAgICAnZW1pc29yJzogJ0VNSVNPUicsXHJcbiAgICAgICdmZWNoYUFjZXB0YWNpb24nOiAnRkVDSEFfQUNFUFRBQ0lPTicsXHJcbiAgICAgICdmZWNoYUFycmlibyc6ICdGRUNIQV9BUlJJQk8nLFxyXG4gICAgICAnZmVjaGFDb25mb3JtYWNpb24nOiAnRkVDSEFfQ09ORk9STUFDSU9OJyxcclxuICAgICAgJ2ZlY2hhRGVzcGVndWUnOiAnRkVDSEFfREVTUEVHVUUnLFxyXG4gICAgICAndG90YWxHdWlhcyc6ICdUT1RBTF9HVElNRScsXHJcbiAgICAgICd0b3RhbEd1aWFzTWFyY2FkYXMnOiAnVE9UQUxfTUFSQ0FET1NfR1RJTUUnLFxyXG4gICAgICAncmV2aXNhZG8nOiAnUkVWSVNBRE8nLFxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBzcWxDb2x1bW4gPSBzb3J0QnkgJiYgc29ydEZpZWxkTWFwW3NvcnRCeV0gXHJcbiAgICAgID8gc29ydEZpZWxkTWFwW3NvcnRCeV0gXHJcbiAgICAgIDogJ0ZFQ0hBQ1JFQUNJT04nO1xyXG5cclxuICAgIGNvbnN0IGRpcmVjdGlvbiA9IHNvcnRPcmRlciA9PT0gJ2FzYycgfHwgc29ydE9yZGVyID09PSAnZGVzYycgXHJcbiAgICAgID8gc29ydE9yZGVyLnRvVXBwZXJDYXNlKCkgXHJcbiAgICAgIDogJ0RFU0MnO1xyXG5cclxuICAgIGlmIChzcWxDb2x1bW4gPT09ICdGRUNIQUNSRUFDSU9OJykgcmV0dXJuIGBkZC5GRUNIQUNSRUFDSU9OICR7ZGlyZWN0aW9ufWA7XHJcblxyXG4gICAgcmV0dXJuIGAke3NxbENvbHVtbn0gJHtkaXJlY3Rpb259YDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlYXJjaCBkb2N1bWVudHMgaW4gdGhlIGRhdGFiYXNlIGJhc2VkIG9uIGZpbHRlcnNcclxuICAgKiBAcGFyYW0gZmlsdGVyc1xyXG4gICAqIEByZXR1cm5zXHJcbiAgICovXHJcbiAgYXN5bmMgc2VhcmNoRG9jdW1lbnRzKGZpbHRlcnM6IEJ1c2NhckRvY3VtZW50b3NEdG8pIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHdoZXJlOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICBjb25zdCBqb2luczogc3RyaW5nW10gPSBbXTtcclxuICAgICAgY29uc3QgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xyXG5cclxuICAgICAgbGV0IHNxbCA9IGBcclxuICAgICAgICBXSVRIIGZlY2hhX21heF9lc3RhZG9zX21hbmlmaWVzdG8gQVMgKFxyXG4gICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICBkZXQuRE9DVU1FTlRPLFxyXG4gICAgICAgICAgICBNQVgoZGV0LkZFQ0hBQUNUSVZBKSBBUyBtYXhfZmVjaGFhY3RpdmFcclxuICAgICAgICAgIEZST00gRE9DVU1FTlRPUy5ET0NFU1RBRE9TIGRldFxyXG4gICAgICAgICAgV0hFUkUgZGV0LlRJUE9ET0NVTUVOVE8gPSAnTUZUT0MnXHJcbiAgICAgICAgICAgIEFORCBkZXQuQUNUSVZBID0gJ1MnXHJcbiAgICAgICAgICAgIEFORCBkZXQuVElQT0VTVEFETyBOT1QgSU4gKCdGUExBWk8nLCdDT04gTUFSQ0EnLCdWSVMnLCdSRUMnKVxyXG4gICAgICAgICAgICBBTkQgZGV0LlRJUE9FU1RBRE8gSU4gKCdBQ1AnLCdBTlUnLCdDTVAnLCdBQ0wnLCdNT0QnLCdDTVBGUCcsICdBQ0xQJylcclxuICAgICAgICAgIEdST1VQIEJZIGRldC5ET0NVTUVOVE9cclxuICAgICAgICApLFxyXG4gICAgICAgIGVzdGFkb19tYXhfdGlwb19tYW5pZmllc3RvIEFTIChcclxuICAgICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgICAgZGV0LkRPQ1VNRU5UTyxcclxuICAgICAgICAgICAgTUFYKGRldC5USVBPRVNUQURPKSBBUyBtYXhfdGlwb2VzdGFkbyxcclxuICAgICAgICAgICAgZGV0LkZFQ0hBQUNUSVZBIEFTIGZlY2hhYWN0aXZhXHJcbiAgICAgICAgICBGUk9NIERPQ1VNRU5UT1MuRE9DRVNUQURPUyBkZXRcclxuICAgICAgICAgIEpPSU4gZmVjaGFfbWF4X2VzdGFkb3NfbWFuaWZpZXN0byBmbWVtIE9OIGZtZW0uRE9DVU1FTlRPID0gZGV0LkRPQ1VNRU5UTyBcclxuICAgICAgICAgICAgQU5EIGZtZW0ubWF4X2ZlY2hhYWN0aXZhID0gZGV0LkZFQ0hBQUNUSVZBXHJcbiAgICAgICAgICBXSEVSRSBkZXQuVElQT0RPQ1VNRU5UTyA9ICdNRlRPQydcclxuICAgICAgICAgICAgQU5EIGRldC5BQ1RJVkEgPSAnUydcclxuICAgICAgICAgICAgQU5EIGRldC5USVBPRVNUQURPIElOICgnQUNQJywnQU5VJywnQ01QJywnQUNMJywnTU9EJywnQ01QRlAnLCAnQUNMUCcpXHJcbiAgICAgICAgICBHUk9VUCBCWSBkZXQuRE9DVU1FTlRPLCBkZXQuRkVDSEFBQ1RJVkFcclxuICAgICAgICApLFxyXG4gICAgICAgIGVzdGFkb3Nfb3JkZW5hZG9zIEFTIChcclxuICAgICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgICAgZW10LkRPQ1VNRU5UTyxcclxuICAgICAgICAgICAgZW10Lm1heF90aXBvZXN0YWRvIEFTIFRJUE9FU1RBRE8sXHJcbiAgICAgICAgICAgIGR0ZS5OT01CUkUsXHJcbiAgICAgICAgICAgIGVtdC5mZWNoYWFjdGl2YSBBUyBGRUNIQSxcclxuICAgICAgICAgICAgUk9XX05VTUJFUigpIE9WRVIgKFBBUlRJVElPTiBCWSBlbXQuRE9DVU1FTlRPIE9SREVSIEJZIGVtdC5mZWNoYWFjdGl2YSBERVNDKSBBUyByblxyXG4gICAgICAgICAgRlJPTSBlc3RhZG9fbWF4X3RpcG9fbWFuaWZpZXN0byBlbXRcclxuICAgICAgICAgIEpPSU4gRE9DVU1FTlRPUy5ET0NUSVBPRVNUQURPIGR0ZSBPTiBlbXQubWF4X3RpcG9lc3RhZG8gPSBkdGUuQ09ESUdPXHJcbiAgICAgICAgICBXSEVSRSBkdGUuVElQT0RPQ1VNRU5UTyA9ICdNRlRPQydcclxuICAgICAgICApXHJcbiAgICAgICAgU0VMRUNUXHJcbiAgICAgICAgICBkZC5JRCBBUyBJRCxcclxuICAgICAgICAgIGRkLk5VTUVST0VYVEVSTk8gQVMgTlVNRVJPX0VYVEVSTk8sXHJcbiAgICAgICAgICBkdG0uTlVNRVJPUkVGRVJFTkNJQU9SSUdJTkFMIEFTIE5VTUVST19SRUZfT1JJR0lOQUwsXHJcbiAgICAgICAgICBlby5OT01CUkUgQVMgRVNUQURPLFxyXG4gICAgICAgICAgKFNFTEVDVCBkcmQuTlVNRE9DREVTVElOTyBBUyBOVU1FUk9fTUFTVEVSX0dBIEZST00gRE9DVU1FTlRPUy5ET0NSRUxBQ0lPTkRPQ1VNRU5UTyBkcmQgV0hFUkUgZHJkLkRPQ09SSUdFTj1kZC5JRCAgQU5EIFRJUE9ET0NERVNUSU5PID0gJ0dBJyBBTkQgQUNUSVZPID0gJ1MnIEFORCBST1dOVU0gPSAxKSBBUyBOVU1FUk9fTUFTVEVSX0dBLFxyXG4gICAgICAgICAgZGQuRU1JU09SIEFTIEVNSVNPUixcclxuICAgICAgICAgIChTRUxFQ1QgZGZkX2FjZS5GRUNIQSBBUyBmZWNoYSBGUk9NIERPQ1VNRU5UT1MuRE9DRkVDSEFET0NVTUVOVE8gZGZkX2FjZSwgRE9DVU1FTlRPUy5ET0NUSVBPRkVDSEEgZHRmX2FjZSBXSEVSRSBkZC5JRD0gZGZkX2FjZS5ET0NVTUVOVE8gYW5kIGR0Zl9hY2UuQ09ESUdPID0gZGZkX2FjZS5USVBPRkVDSEEgQU5EIGRmZF9hY2UuVElQT0ZFQ0hBID0gJ0ZFQ0FDRVBUQScpIEFTIEZFQ0hBX0FDRVBUQUNJT04sXHJcbiAgICAgICAgICAoU0VMRUNUIGRmZF9hcnIuRkVDSEEgQVMgZmVjaGEgRlJPTSBET0NVTUVOVE9TLkRPQ0ZFQ0hBRE9DVU1FTlRPIGRmZF9hcnIsIERPQ1VNRU5UT1MuRE9DVElQT0ZFQ0hBIGR0Zl9hcnIgV0hFUkUgZGQuSUQ9IGRmZF9hcnIuRE9DVU1FTlRPIGFuZCBkdGZfYXJyLkNPRElHTyA9IGRmZF9hcnIuVElQT0ZFQ0hBIEFORCBkZmRfYXJyLlRJUE9GRUNIQSA9ICdGQVJSSUJPJykgQVMgRkVDSEFfQVJSSUJPLFxyXG4gICAgICAgICAgKFNFTEVDVCBNQVgoZGV0LkZFQ0hBQUNUSVZBKSBBUyBmZWNoYSBGUk9NIERPQ1VNRU5UT1MuRE9DRVNUQURPUyBkZXQgV0hFUkUgZGV0LmRvY3VtZW50byA9IGRkLklEIEFORCBkZXQuVElQT0RPQ1VNRU5UTyA9ICdNRlRPQycgQU5EIGRldC5BQ1RJVkEgPSAnUycgQU5EIGRldC5USVBPRVNUQURPIE5PVCBJTiAoJ0ZQTEFaTycsJ0NPTiBNQVJDQScsJ1ZJUycsJ1JFQycpIEFORCBkZXQuVElQT0VTVEFETyBJTiAoJ0FDUCcsJ0FOVScsJ0NNUCcsJ0FDTCcsJ01PRCcsJ0NNUEZQJywgJ0FDTFAnKSBHUk9VUCBCWSBkZXQuRE9DVU1FTlRPKSBBUyBGRUNIQV9DT05GT1JNQUNJT04sXHJcbiAgICAgICAgICAoU0VMRUNUIGRsZC5MT0NBQ0lPTiBBUyBMT0NBQ0lPTiBGUk9NIERPQ1VNRU5UT1MuRE9DTE9DQUNJT05ET0NVTUVOVE8gZGxkIFdIRVJFIGRsZC5ET0NVTUVOVE89ZGQuSUQgQU5EIGRsZC5USVBPTE9DQUNJT04gPSdMVURFU1BFR1VFJykgQVMgTFVHQVJfREVfREVTUEVHVUUsXHJcbiAgICAgICAgICAoU0VMRUNUIGRmZF9kZXMuRkVDSEEgQVMgZmVjaGEgRlJPTSBET0NVTUVOVE9TLkRPQ0ZFQ0hBRE9DVU1FTlRPIGRmZF9kZXMsIERPQ1VNRU5UT1MuRE9DVElQT0ZFQ0hBIGR0Zl9kZXMgV0hFUkUgZGQuSUQ9IGRmZF9kZXMuRE9DVU1FTlRPIGFuZCBkdGZfZGVzLkNPRElHTyA9IGRmZF9kZXMuVElQT0ZFQ0hBIEFORCBkZmRfZGVzLlRJUE9GRUNIQSA9ICdGRURFU1BFR1VFJykgQVMgRkVDSEFfREVTUEVHVUUsXHJcbiAgICAgICAgICAoU0VMRUNUIENPVU5UKGlkKSBGUk9NIERPQ1VNRU5UT1MuRE9DRE9DVU1FTlRPQkFTRSBkICBXSEVSRSBkLlRJUE9ET0NVTUVOVE8gPSAnR1RJTUUnIEFORCBkLk5VTUVST0FDRVBUQUNJT04gPSBUT19DSEFSKGRkLk5VTUVST0VYVEVSTk8pIEFORCBkLkFDVElWTyA9ICdTJykgQVMgVE9UQUxfR1RJTUUsXHJcbiAgICAgICAgICAoU0VMRUNUIENPVU5UKERJU1RJTkNUIERCRy5pZClcclxuICAgICAgICAgICAgRlJPTSBET0NVTUVOVE9TLmRvY3JlbGFjaW9uZG9jdW1lbnRvIFJEXHJcbiAgICAgICAgICAgIEpPSU4gRE9DVU1FTlRPUy5kb2Nkb2N1bWVudG9iYXNlIERCRyBPTiBEQkcuaWQgPSBSRC5kb2NvcmlnZW5cclxuICAgICAgICAgICAgSk9JTiBET0NUUkFOU1BPUlRFLmRvY3RyYW5kb2N0cmFuc3BvcnRlIERUIE9OIERULmlkID0gREJHLmlkXHJcbiAgICAgICAgICAgIExFRlQgSk9JTiBET0NVTUVOVE9TLmRvY2VzdGFkb3MgR0FOVSBPTiBHQU5VLmRvY3VtZW50byA9IERCRy5pZCBBTkQgR0FOVS5USVBPRE9DVU1FTlRPID0gREJHLlRJUE9ET0NVTUVOVE8gQU5EIEdBTlUudGlwb2VzdGFkbyA9ICdBTlUnXHJcbiAgICAgICAgICAgIFdIRVJFIFJELnRpcG9yZWxhY2lvbiA9ICdSRUYnXHJcbiAgICAgICAgICAgICAgQU5EIFJELmFjdGl2byA9ICdTJ1xyXG4gICAgICAgICAgICAgIEFORCBSRC5kb2NkZXN0aW5vID0gZGQuSURcclxuICAgICAgICAgICAgICBBTkQgREJHLlRJUE9ET0NVTUVOVE8gPSAnR1RJTUUnXHJcbiAgICAgICAgICAgICAgQU5EIERCRy5hY3Rpdm8gPSAnUydcclxuICAgICAgICAgICAgICBBTkQgR0FOVS5kb2N1bWVudG8gSVMgTlVMTFxyXG4gICAgICAgICAgICAgIEFORCBEVC5WQUxPUkRFQ0xBUkFETyA8PSA1MDBcclxuICAgICAgICAgICAgICBBTkQgRVhJU1RTIChcclxuICAgICAgICAgICAgICAgIFNFTEVDVCAxXHJcbiAgICAgICAgICAgICAgICBGUk9NIERPQ1VNRU5UT1MuZG9jZXN0YWRvcyBFXHJcbiAgICAgICAgICAgICAgICBXSEVSRSBFLmRvY3VtZW50byA9IERCRy5pZFxyXG4gICAgICAgICAgICAgICAgICBBTkQgRS5USVBPRE9DVU1FTlRPID0gREJHLlRJUE9ET0NVTUVOVE9cclxuICAgICAgICAgICAgICAgICAgQU5EIEUudGlwb2VzdGFkbyBJTiAoJ0NPTiBNQVJDQScsICdWSVMnKVxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICkgQVMgVE9UQUxfTUFSQ0FET1NfR1RJTUUsXHJcbiAgICAgICAgICBERUNPREUoKFNFTEVDVCB0aXBvZXN0YWRvIEZST00gRE9DVU1FTlRPUy5ET0NFU1RBRE9TIGVzdCBXSEVSRSBkZC50aXBvZG9jdW1lbnRvID0gZXN0LnRpcG9kb2N1bWVudG8gQU5EIGRkLmlkID0gZXN0LmRvY3VtZW50byBBTkQgZXN0LnRpcG9lc3RhZG8gPSAnVklTJyBBTkQgZXN0LmFjdGl2YSA9ICdTJyBBTkQgUk9XTlVNID0gMSksTlVMTCwnTk8nLCdTSScpIGFzIFJFVklTQURPXHJcbiAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRPQ0RPQ1VNRU5UT0JBU0UgZGRcclxuICAgICAgICBKT0lOIERPQ1RSQU5TUE9SVEUuRE9DVFJBTk1BTklGSUVTVE8gZHRtIE9OIGRkLklEID0gZHRtLklEXHJcbiAgICAgICAgSk9JTiBlc3RhZG9zX29yZGVuYWRvcyBlbyBPTiBkZC5JRCA9IGVvLkRPQ1VNRU5UTyBBTkQgZW8ucm4gPSAxXHJcbiAgICAgIGA7XHJcblxyXG4gICAgICAvLyBQYXLDoW1ldHJvcyBiw6FzaWNvc1xyXG4gICAgICBwYXJhbXMudGlwb0RvY3VtZW50b0Jhc2UgPSBcIk1GVE9DXCI7XHJcblxyXG4gICAgICB3aGVyZS5wdXNoKFwiZGQuVElQT0RPQ1VNRU5UTyA9IDp0aXBvRG9jdW1lbnRvQmFzZVwiKTtcclxuICAgICAgd2hlcmUucHVzaChcImRkLkFDVElWTyA9ICdTJ1wiKTtcclxuXHJcbiAgICAgIC8vIEpPSU5zIG9wY2lvbmFsZXMgc2Vnw7puIGZpbHRlcnNcclxuICAgICAgY29uc3QgbmVlZFBhcnRpY2lwYWNpb24gPSAhIWZpbHRlcnM/LmVtaXNvciB8fCAhIWZpbHRlcnM/LnRpcG9QYXJ0aWNpcGFudGU7XHJcbiAgICAgIGlmIChuZWVkUGFydGljaXBhY2lvbikge1xyXG4gICAgICAgIGpvaW5zLnB1c2goXCJMRUZUIEpPSU4gRE9DUEFSVElDSVBBQ0lPTiBQIE9OIFAuRE9DVU1FTlRPID0gZGQuSURcIik7XHJcbiAgICAgICAgd2hlcmUucHVzaChcIlAuQUNUSVZBID0gJ1MnXCIpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvKlxyXG4gICAgICBjb25zdCBuZWVkRXN0YWRvID0gISFmaWx0ZXJzPy5lc3RhZG87XHJcbiAgICAgIGlmIChuZWVkRXN0YWRvKSB7XHJcbiAgICAgICAgam9pbnMucHVzaChcIkpPSU4gRE9DVU1FTlRPUy5ET0NFU1RBRE9TIGRldCBPTiBkZXQuRE9DVU1FTlRPID0gZGQuSURcIik7XHJcbiAgICAgIH0qL1xyXG5cclxuICAgICAgY29uc3QgbmVlZExvY2FjaW9uID0gISEoZmlsdGVycz8udGlwb0xvY2FjaW9uIHx8IGZpbHRlcnM/LmxvY2FjaW9uKTtcclxuICAgICAgaWYgKG5lZWRMb2NhY2lvbikge1xyXG4gICAgICAgIGpvaW5zLnB1c2goXHJcbiAgICAgICAgICBcIkxFRlQgSk9JTiBET0NVTUVOVE9TLkRPQ0xPQ0FDSU9ORE9DVU1FTlRPIGRsZCBPTiBkbGQuRE9DVU1FTlRPID0gZGQuSURcIlxyXG4gICAgICAgICk7XHJcbiAgICAgICAgd2hlcmUucHVzaChcImRsZC5BQ1RJVkEgPSAnUydcIik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFJhbmdvIGRlIGZlY2hhcyBwb3IgdGlwb1xyXG4gICAgICAvLyBObyBhcGxpY2FyIGZpbHRyb3MgZGUgZmVjaGFzIHNpIHNlIGVzdMOhIGJ1c2NhbmRvIHBvciBuw7ptZXJvIGRlIGFjZXB0YWNpw7NuIG8gbsO6bWVybyBkZSByZWZlcmVuY2lhIG9yaWdpbmFsXHJcbiAgICAgIGNvbnN0IHRpZW5lQnVzcXVlZGFFc3BlY2lmaWNhID0gISEoZmlsdGVycz8ubnVtZXJvQWNlcHRhY2lvbiB8fCBmaWx0ZXJzPy5udW1lcm9NYW5pZmllc3RvT3JpZ2luYWwpO1xyXG4gICAgICBcclxuICAgICAgaWYgKCF0aWVuZUJ1c3F1ZWRhRXNwZWNpZmljYSAmJiAoZmlsdGVycz8udGlwb0ZlY2hhIHx8IGZpbHRlcnM/LmZlY2hhRGVzZGUgfHwgZmlsdGVycz8uZmVjaGFIYXN0YSkpIHtcclxuICAgICAgICBsZXQgY29sdW1uYUZlY2hhID0gXCJcIjtcclxuXHJcbiAgICAgICAgaWYgKGZpbHRlcnM/LnRpcG9GZWNoYSkge1xyXG4gICAgICAgICAgam9pbnMucHVzaChcclxuICAgICAgICAgICAgXCJKT0lOIERPQ1VNRU5UT1MuRE9DRkVDSEFET0NVTUVOVE8gZGZkIE9OIGRmZC5ET0NVTUVOVE8gPSBkZC5JRCBBTkQgZGZkLlRJUE9GRUNIQSA9IDp0aXBvRmVjaGFcIlxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIGNvbHVtbmFGZWNoYSA9IFwiZGZkLkZFQ0hBXCI7XHJcbiAgICAgICAgICB3aGVyZS5wdXNoKFwiZGZkLlRJUE9GRUNIQSA9IDp0aXBvRmVjaGFcIik7XHJcbiAgICAgICAgICBwYXJhbXMudGlwb0ZlY2hhID0gU3RyaW5nKGZpbHRlcnMudGlwb0ZlY2hhKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gU2kgbm8gc2UgZXNwZWNpZmljYSB0aXBvRmVjaGEsIHVzYXIgRkVDSEFFTUlTSU9OIGRlbCBkb2N1bWVudG9cclxuICAgICAgICAgIGNvbHVtbmFGZWNoYSA9IFwiZGQuRkVDSEFFTUlTSU9OXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZmlsdGVycy5mZWNoYURlc2RlKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcImZlY2hhRGVzZGUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVwiLCBmaWx0ZXJzLmZlY2hhRGVzZGUpO1xyXG4gICAgICAgICAgd2hlcmUucHVzaChcclxuICAgICAgICAgICAgYCR7Y29sdW1uYUZlY2hhfSA+PSBUT19EQVRFKDpmZWNoYURlc2RlLCAnREQvTU0vWVlZWSBISDI0Ok1JOlNTJylgXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgcGFyYW1zLmZlY2hhRGVzZGUgPSBgJHtTdHJpbmcoZmlsdGVycy5mZWNoYURlc2RlKX0gMDA6MDA6MDBgO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZmlsdGVycy5mZWNoYUhhc3RhKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcImZlY2hhSGFzdGEtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVwiLCBmaWx0ZXJzLmZlY2hhSGFzdGEpO1xyXG4gICAgICAgICAgd2hlcmUucHVzaChcclxuICAgICAgICAgICAgYCR7Y29sdW1uYUZlY2hhfSA8PSBUT19EQVRFKDpmZWNoYUhhc3RhLCAnREQvTU0vWVlZWSBISDI0Ok1JOlNTJylgXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgcGFyYW1zLmZlY2hhSGFzdGEgPSBgJHtTdHJpbmcoZmlsdGVycy5mZWNoYUhhc3RhKX0gMjM6NTk6NTlgO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gV0hFUkUgcG9yIGZpbHRlcnNcclxuICAgICAgaWYgKGZpbHRlcnM/LnRpcG9Eb2N1bWVudG8pIHtcclxuICAgICAgICB3aGVyZS5wdXNoKFwiZGQuVElQT0RPQ1VNRU5UTyA9IDp0aXBvRG9jdW1lbnRvXCIpO1xyXG4gICAgICAgIHBhcmFtcy50aXBvRG9jdW1lbnRvID0gU3RyaW5nKGZpbHRlcnMudGlwb0RvY3VtZW50byk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKmVzIHBhcmEgZmlsdHJhciBwb3IgZWwgdXNlcklkIGRlbCB1c3VhcmlvIGF1dGVudGljYWRvICovXHJcbiAgICAgIGlmIChmaWx0ZXJzPy51c2VySWQpIHtcclxuICAgICAgICBjb25zdCB1c2VySWROdW0gPSBOdW1iZXIoZmlsdGVycy51c2VySWQpO1xyXG4gICAgICAgIGlmICghTnVtYmVyLmlzTmFOKHVzZXJJZE51bSkgJiYgdXNlcklkTnVtID4gMCkge1xyXG4gICAgICAgICAgd2hlcmUucHVzaChcImRkLklERU1JU09SID0gOnVzZXJJZFwiKTtcclxuICAgICAgICAgIHBhcmFtcy51c2VySWQgPSB1c2VySWROdW07XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInVzZXJJZC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXCIsIHVzZXJJZE51bSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvKiplcyBwYXJhIGZpbHRyYXIgcG9yIGVsIHRpcG8gZGUgcGFydGljaXBhbnRlIChST0wpIGVuIGxhIHRhYmxhIHBhcnRpY2lwYWNpb24gKi9cclxuICAgICAgaWYgKGZpbHRlcnM/LnRpcG9QYXJ0aWNpcGFudGUgJiYgIXRpZW5lQnVzcXVlZGFFc3BlY2lmaWNhKSB7XHJcbiAgICAgICAgaWYoZmlsdGVycy50aXBvUGFydGljaXBhbnRlLnRvVXBwZXJDYXNlKCkgPT09ICdFTUlTT1InKXtcclxuICAgICAgICAgIGZpbHRlcnMudGlwb1BhcnRpY2lwYW50ZSA9ICdFTUknO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLmxvZyhcInRpcG9QYXJ0aWNpcGFudGUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVwiLCBmaWx0ZXJzLnRpcG9QYXJ0aWNpcGFudGUpO1xyXG4gICAgICAgIHdoZXJlLnB1c2goXCJQLlJPTCA9IDp0aXBvUGFydGljaXBhbnRlXCIpO1xyXG4gICAgICAgIHBhcmFtcy50aXBvUGFydGljaXBhbnRlID0gU3RyaW5nKGZpbHRlcnMudGlwb1BhcnRpY2lwYW50ZSkudHJpbSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvKiplcyBwYXJhIGZpbHRyYXIgcG9yIGVsIG5vbWJyZSBkZWwgZW1pc29yIGVuIGxhIHRhYmxhIERPQ1BBUlRJQ0lQQUNJT04gKi9cclxuICAgICAgaWYgKGZpbHRlcnM/LmVtaXNvciAmJiAhdGllbmVCdXNxdWVkYUVzcGVjaWZpY2EpIHtcclxuICAgICAgICB3aGVyZS5wdXNoKFwiVVBQRVIoUC5OT01CUkVQQVJUSUNJUEFOVEUpIExJS0UgVVBQRVIoOmVtaXNvcilcIik7XHJcbiAgICAgICAgcGFyYW1zLmVtaXNvciA9IGAlJHtTdHJpbmcoZmlsdGVycy5lbWlzb3IpLnRyaW0oKX0lYDtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGZpbHRlcnM/LnRpcG9Mb2NhY2lvbiAmJiAhdGllbmVCdXNxdWVkYUVzcGVjaWZpY2EpIHtcclxuICAgICAgICB3aGVyZS5wdXNoKFwiZGxkLlRJUE9MT0NBQ0lPTiA9IDp0aXBvTG9jYWNpb25cIik7XHJcbiAgICAgICAgcGFyYW1zLnRpcG9Mb2NhY2lvbiA9IFN0cmluZyhmaWx0ZXJzLnRpcG9Mb2NhY2lvbik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChmaWx0ZXJzPy5sb2NhY2lvbiAmJiAhdGllbmVCdXNxdWVkYUVzcGVjaWZpY2EpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcImxvY2FjaW9uLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cIiwgZmlsdGVycy5sb2NhY2lvbik7XHJcbiAgICAgICAgY29uc3QgbG9jYWNpb25WYWx1ZSA9IFN0cmluZyhmaWx0ZXJzLmxvY2FjaW9uKS50cmltKCk7XHJcbiAgICAgICAgLy8gU2kgZXMgbnVtw6lyaWNvLCBjb21wYXJhciBjb24gSURMT0NBQ0lPTlxyXG4gICAgICAgIGlmICgvXlxcZCskLy50ZXN0KGxvY2FjaW9uVmFsdWUpKSB7XHJcbiAgICAgICAgICB3aGVyZS5wdXNoKFwiZGxkLklETE9DQUNJT04gPSA6bG9jYWNpb25cIik7XHJcbiAgICAgICAgICBwYXJhbXMubG9jYWNpb24gPSBOdW1iZXIobG9jYWNpb25WYWx1ZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIFNpIGVzIHN0cmluZywgY29tcGFyYXIgY29uIENPRElHT0xPQ0FDSU9OXHJcbiAgICAgICAgICB3aGVyZS5wdXNoKFwiVVBQRVIoZGxkLkNPRElHT0xPQ0FDSU9OKSA9IFVQUEVSKDpsb2NhY2lvbilcIik7XHJcbiAgICAgICAgICBwYXJhbXMubG9jYWNpb24gPSBsb2NhY2lvblZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGZpbHRlcnM/Lm51bWVyb0FjZXB0YWNpb24pIHtcclxuICAgICAgICAvLyBkZC5OVU1FUk9FWFRFUk5PIGVzIFZBUkNIQVIsIHRyYXRhciBjb21vIHN0cmluZ1xyXG4gICAgICAgIGNvbnN0IGNsZWFuZWRWYWx1ZSA9IFN0cmluZyhmaWx0ZXJzLm51bWVyb0FjZXB0YWNpb24pLnRyaW0oKTtcclxuICAgICAgICBpZiAoY2xlYW5lZFZhbHVlICYmIGNsZWFuZWRWYWx1ZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICB3aGVyZS5wdXNoKFwiZGQuTlVNRVJPRVhURVJOTyA9IDpudW1lcm9FeHRlcm5vXCIpO1xyXG4gICAgICAgICAgcGFyYW1zLm51bWVyb0V4dGVybm8gPSBjbGVhbmVkVmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZmlsdGVycz8ubnVtZXJvTWFuaWZpZXN0b09yaWdpbmFsKSB7XHJcbiAgICAgICAgd2hlcmUucHVzaChcImR0bS5OVU1FUk9SRUZFUkVOQ0lBT1JJR0lOQUwgPSA6bnVtZXJvUmVmZXJlbmNpYU9yaWdpbmFsXCIpO1xyXG4gICAgICAgIHBhcmFtcy5udW1lcm9SZWZlcmVuY2lhT3JpZ2luYWwgPSBTdHJpbmcoXHJcbiAgICAgICAgICBmaWx0ZXJzLm51bWVyb01hbmlmaWVzdG9PcmlnaW5hbFxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChmaWx0ZXJzPy5lc3RhZG8gJiYgIXRpZW5lQnVzcXVlZGFFc3BlY2lmaWNhKSB7XHJcbiAgICAgICAgd2hlcmUucHVzaChcImVvLlRJUE9FU1RBRE8gPSA6ZXN0YWRvXCIpO1xyXG4gICAgICAgIHBhcmFtcy5lc3RhZG8gPSBTdHJpbmcoZmlsdGVycy5lc3RhZG8pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZmlsdGVycz8uc2VudGlkb09wZXJhY2lvbiAmJiAhdGllbmVCdXNxdWVkYUVzcGVjaWZpY2EpIHtcclxuICAgICAgICB3aGVyZS5wdXNoKFwiZHRtLlRJUE9NQU5JRklFU1RPID0gOnNlbnRpZG9PcGVyYWNpb25cIik7XHJcbiAgICAgICAgcGFyYW1zLnNlbnRpZG9PcGVyYWNpb24gPSBTdHJpbmcoZmlsdGVycy5zZW50aWRvT3BlcmFjaW9uKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGZpbHRlcnM/Lm51bWVyb1Z1ZWxvICYmICF0aWVuZUJ1c3F1ZWRhRXNwZWNpZmljYSkge1xyXG4gICAgICAgIHdoZXJlLnB1c2goXCJkdG0uVklBSkUgPSA6bnVtZXJvVnVlbG9cIik7XHJcbiAgICAgICAgcGFyYW1zLm51bWVyb1Z1ZWxvID0gU3RyaW5nKGZpbHRlcnMubnVtZXJvVnVlbG8pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBFbnNhbWJsYXIgY29uc3VsdGEgZmluYWxcclxuICAgICAgaWYgKGpvaW5zLmxlbmd0aCkge1xyXG4gICAgICAgIHNxbCArPSBcIlxcblwiICsgam9pbnMuam9pbihcIlxcblwiKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAod2hlcmUubGVuZ3RoKSB7XHJcbiAgICAgICAgc3FsICs9IFwiXFxuV0hFUkUgXCIgKyB3aGVyZS5qb2luKFwiXFxuICBBTkQgXCIpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBBcGxpY2FyIHNvcnRpbmcgZGluw6FtaWNvXHJcbiAgICAgIGNvbnN0IG9yZGVyQnkgPSB0aGlzLmJ1aWxkT3JkZXJCeShmaWx0ZXJzPy5zb3J0QnksIGZpbHRlcnM/LnNvcnRPcmRlcik7XHJcbiAgICAgIHNxbCArPSBgXFxuT1JERVIgQlkgJHtvcmRlckJ5fWA7XHJcblxyXG4gICAgICAvLyBQYWdpbmFjacOzbiBzaW1wbGUgKGZldGNoIGZpcnN0KSBjb21wYXRpYmxlIGNvbiBPcmFjbGUgMTJjK1xyXG4gICAgICBjb25zdCBwYWdlID0gTnVtYmVyKGZpbHRlcnM/LnBhZ2UgfHwgMSk7XHJcbiAgICAgIGNvbnN0IGxpbWl0ID0gTnVtYmVyKGZpbHRlcnM/LmxpbWl0IHx8IDEwKTtcclxuICAgICAgY29uc3Qgb2Zmc2V0ID0gKHBhZ2UgLSAxKSAqIGxpbWl0O1xyXG4gICAgICBjb25zdCBwYWdpbmF0ZWRTcWwgPSBgXHJcbiAgICAgICAgU0VMRUNUICogRlJPTSAoXHJcbiAgICAgICAgICBTRUxFQ1QgcS4qLCBST1dOVU0gcm4gRlJPTSAoXHJcbiAgICAgICAgICAgICR7c3FsfVxyXG4gICAgICAgICAgKSBxIFdIRVJFIFJPV05VTSA8PSAke29mZnNldCArIGxpbWl0fVxyXG4gICAgICAgICkgV0hFUkUgcm4gPiAke29mZnNldH1cclxuICAgICAgYDtcclxuXHJcbiAgICAgIC8vIFVzYXIgZGF0YVNvdXJjZSBkaXJlY3RhbWVudGUgKG1lam9yIHByw6FjdGljYSBwYXJhIG3Dumx0aXBsZXMgY29uc3VsdGFzKVxyXG4gICAgICBjb25zdCBkcml2ZXIgPSB0aGlzLmRhdGFTb3VyY2UuZHJpdmVyO1xyXG5cclxuICAgICAgY29uc3QgW3BhZ2luYXRlZFF1ZXJ5LCBwYWdpbmF0ZWRQYXJhbWV0ZXJzXSA9XHJcbiAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMocGFnaW5hdGVkU3FsLCBwYXJhbXMsIHt9KTtcclxuXHJcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCB0aGlzLmRhdGFTb3VyY2UucXVlcnkoXHJcbiAgICAgICAgcGFnaW5hdGVkUXVlcnksXHJcbiAgICAgICAgcGFnaW5hdGVkUGFyYW1ldGVyc1xyXG4gICAgICApO1xyXG5cclxuICAgICAgLy8gQ29udGVvIHRvdGFsIChzaW4gcGFnaW5hY2nDs24pIC0gdXNhciBwYXLDoW1ldHJvcyBzaW4gcm93bnVtXHJcbiAgICAgIGNvbnN0IGNvdW50U3FsID0gYFNFTEVDVCBDT1VOVCgxKSBBUyBUT1RBTCBGUk9NICgke3NxbH0pYDtcclxuICAgICAgY29uc3QgW2NvdW50UXVlcnksIGNvdW50UGFyYW1ldGVyc10gPSBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICBjb3VudFNxbCxcclxuICAgICAgICBwYXJhbXMsXHJcbiAgICAgICAge31cclxuICAgICAgKTtcclxuICAgICAgY29uc3QgY291bnRSb3dzID0gYXdhaXQgdGhpcy5kYXRhU291cmNlLnF1ZXJ5KFxyXG4gICAgICAgIGNvdW50UXVlcnksXHJcbiAgICAgICAgY291bnRQYXJhbWV0ZXJzXHJcbiAgICAgICk7XHJcbiAgICAgIGNvbnN0IHRvdGFsID0gTnVtYmVyKGNvdW50Um93cz8uWzBdPy5UT1RBTCB8fCAwKTtcclxuXHJcbiAgICAgIC8vIE1hcGVhciByZXNwdWVzdGFcclxuICAgICAgY29uc3QgZG9jdW1lbnRvcyA9IHJvd3MubWFwKChyOiBhbnkpID0+ICh7XHJcbiAgICAgICAgaWQ6IHIuSUQsXHJcbiAgICAgICAgbnVtZXJvRXh0ZXJubzogci5OVU1FUk9fRVhURVJOTyxcclxuICAgICAgICBudW1lcm9SZWZlcmVuY2lhT3JpZ2luYWw6IHIuTlVNRVJPX1JFRl9PUklHSU5BTCxcclxuICAgICAgICBlc3RhZG86IHIuRVNUQURPLFxyXG4gICAgICAgIG51bWVyb01hc3RlckdhOiByLk5VTUVST19NQVNURVJfR0EsXHJcbiAgICAgICAgZW1pc29yOiByLkVNSVNPUixcclxuICAgICAgICBmZWNoYUFjZXB0YWNpb246IHIuRkVDSEFfQUNFUFRBQ0lPTixcclxuICAgICAgICBmZWNoYUFycmlibzogci5GRUNIQV9BUlJJQk8sXHJcbiAgICAgICAgZmVjaGFDb25mb3JtYWNpb246IHIuRkVDSEFfQ09ORk9STUFDSU9OLFxyXG4gICAgICAgIGx1Z2FyRGVzcGVndWU6IHIuTFVHQVJfREVfREVTUEVHVUUsXHJcbiAgICAgICAgZmVjaGFEZXNwZWd1ZTogci5GRUNIQV9ERVNQRUdVRSxcclxuICAgICAgICB0b3RhbERvY3VtZW50b3NHdGltZTogci5UT1RBTF9HVElNRSxcclxuICAgICAgICB0b3RhbE1hcmNhZG9zR3RpbWU6IHIuVE9UQUxfTUFSQ0FET1NfR1RJTUUsXHJcbiAgICAgICAgcmV2aXNhZG86IHIuUkVWSVNBRE8sXHJcbiAgICAgIH0pKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHtcclxuICAgICAgICBkb2N1bWVudG9zLFxyXG4gICAgICAgIHRvdGFsLFxyXG4gICAgICAgIHBhZ2UsXHJcbiAgICAgICAgbGltaXQsXHJcbiAgICAgICAgdG90YWxQYWdlczogTWF0aC5jZWlsKHRvdGFsIC8gbGltaXQpLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgcmV0dXJuIFJlc3BvbnNlVXRpbC5zdWNjZXNzKHJlc3VsdCwgXCJEb2N1bWVudG9zIG9idGVuaWRvcyBleGl0b3NhbWVudGVcIik7XHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIHRocm93IFJlc3BvbnNlVXRpbC5pbnRlcm5hbEVycm9yKGVycm9yKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIGV4cG9ydERvY3VtZW50cyhmaWx0ZXJzOiBCdXNjYXJEb2N1bWVudG9zRHRvKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHdoZXJlOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICBjb25zdCB7IG51bWVyb0FjZXB0YWNpb24sIHRpcG9Eb2N1bWVudG8gfSA9IGZpbHRlcnM7XHJcbiAgICAgIGNvbnN0IHR5cGVEb2MgPSBcIkdUSU1FXCI7XHJcblxyXG4gICAgICBsZXQgc3FsID0gYFxyXG4gICAgICAgIFNFTEVDVCBESVNUSU5DVFxyXG4gICAgICAgICAgRC5JRCAgICAgICAgICAgICAgICBBUyBJRCxcclxuICAgICAgICAgIEQuTlVNRVJPRVhURVJOTyAgICAgQVMgTlVNRVJPRVhURVJOTyxcclxuICAgICAgICAgIEQuVElQT0RPQ1VNRU5UTyAgICAgQVMgVElQT0RPQ1VNRU5UTyxcclxuICAgICAgICAgIEQuQUNUSVZPICAgICAgICAgICAgQVMgQUNUSVZPLFxyXG4gICAgICAgICAgTlZMKChTRUxFQ1QgTElTVEFHRyhPcEZpc2NNYXJjYS5Db2RpZ29PcEZpc2NNb3Rpdm9NYXJjYSB8fCAnLScgfHwgTW90aXZvLkRlc2NyaXBjaW9uLCAnIC8gJykgV0lUSElOIEdST1VQIChPUkRFUiBCWSBPcEZpc2NNYXJjYS5Db2RpZ29PcEZpc2NNb3Rpdm9NYXJjYSlcclxuICAgICAgICAgICBGUk9NIE9wRmlzY01hcmNhIE9wRmlzY01hcmNhXHJcbiAgICAgICAgICAgSk9JTiBPcEZpc2NNb3Rpdm9NYXJjYSBNb3Rpdm9cclxuICAgICAgICAgICAgIE9OIE1vdGl2by5Db2RpZ28gPSBPcEZpc2NNYXJjYS5Db2RpZ29PcEZpc2NNb3Rpdm9NYXJjYVxyXG4gICAgICAgICAgIFdIRVJFIE9wRmlzY01hcmNhLklkRG9jdW1lbnRvID0gRC5JRFxyXG4gICAgICAgICAgICAgQU5EIE9wRmlzY01hcmNhLkFjdGl2YSA9ICdTJ1xyXG4gICAgICAgICAgKSwgJycpIEFTIE1PVElWT19TRUxFQ0NJT04sXHJcbiAgICAgICAgICBOVkwoKFNFTEVDVCBMSVNUQUdHKFJFUy5jb2RpZ29vcGZpc2NyZXN1bHRhZG8gfHwgJyAvICcgfHwgUkVTLm9ic2VydmFjaW9uLCAnIC8gJykgV0lUSElOIEdST1VQIChPUkRFUiBCWSBSRVMuY29kaWdvb3BmaXNjcmVzdWx0YWRvIHx8ICcgLyAnIHx8IFJFUy5vYnNlcnZhY2lvbiBBU0MpXHJcbiAgICAgICAgICAgRlJPTSBPUEZJU0NSRVNVTFRBRE9BQ0NJT04gUkVTXHJcbiAgICAgICAgICAgSU5ORVIgSk9JTiBPcEZpc2NSZWdpc3Ryb0Zpc2NhbGl6YWNpIFJFR1xyXG4gICAgICAgICAgICAgT04gUkVHLklkT3BGaXNjQWNjaW9uRmlzY2FsaXphY2kgPSBSRVMuSWRPcEZpc2NBY2Npb25GaXNjYWxpemFjaVxyXG4gICAgICAgICAgICBBTkQgUkVHLklEID0gUkVTLmlkb3BmaXNjcmVnaXN0cm9maXNjYWxpemFcclxuICAgICAgICAgICBJTk5FUiBKT0lOIGZpc2NhbGl6YWNpb25lcy5PcEZpc2NNYXJjYSBGSVNcclxuICAgICAgICAgICAgIE9OIEZJUy5JRE9QRklTQ0FDQ0lPTkZJU0NBTElaQUNJID0gUkVHLklkT3BGaXNjQWNjaW9uRmlzY2FsaXphY2lcclxuICAgICAgICAgICBXSEVSRSBGSVMuSWREb2N1bWVudG8gPSBELklEXHJcbiAgICAgICAgICAgICBBTkQgRklTLkFjdGl2YSA9ICdTJ1xyXG4gICAgICAgICAgICAgQU5EIFJFRy5hY3Rpdm8gPSAnUydcclxuICAgICAgICAgICksICcgJykgQVMgUkVTVUxUQURPX1NFTEVDQ0lPTlxyXG4gICAgICAgIEZST00gRE9DVU1FTlRPUy5ET0NET0NVTUVOVE9CQVNFIERcclxuICAgICAgYDtcclxuXHJcbiAgICAgIC8vIFdIRVJFIHBvciBmaWx0ZXJzXHJcbiAgICAgIHdoZXJlLnB1c2goYEQuQUNUSVZPID0gJ1MnYCk7XHJcbiAgICAgIGlmICh0aXBvRG9jdW1lbnRvKSB7XHJcbiAgICAgICAgd2hlcmUucHVzaChgRC5USVBPRE9DVU1FTlRPID0gJyR7dHlwZURvY30nYCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChudW1lcm9BY2VwdGFjaW9uKSB7XHJcbiAgICAgICAgY29uc3QgdiA9IFN0cmluZyhudW1lcm9BY2VwdGFjaW9uKS5yZXBsYWNlKC8nL2csIFwiJydcIik7XHJcbiAgICAgICAgd2hlcmUucHVzaChgRC5OVU1FUk9BQ0VQVEFDSU9OID0gJyR7dn0nYCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEVuc2FtYmxhciBjb25zdWx0YSBmaW5hbFxyXG4gICAgICAvLyBpZiAoam9pbnMubGVuZ3RoKSB7XHJcbiAgICAgIC8vICAgc3FsICs9IFwiXFxuXCIgKyBqb2lucy5qb2luKFwiXFxuXCIpO1xyXG4gICAgICAvLyB9XHJcbiAgICAgIGlmICh3aGVyZS5sZW5ndGgpIHtcclxuICAgICAgICBzcWwgKz0gXCJcXG5XSEVSRSBcIiArIHdoZXJlLmpvaW4oXCJcXG4gIEFORCBcIik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEVqZWN1dGFyIGNvbnN1bHRhIHNpbiBsw61taXRlXHJcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCB0aGlzLmRvY3VtZW50b0Jhc2VSZXBvc2l0b3J5LnF1ZXJ5KHNxbCk7XHJcblxyXG4gICAgICAvLyBHZW5lcmFyIFhNTCBlbiBlbCBmb3JtYXRvIHNvbGljaXRhZG9cclxuICAgICAgbGV0IHhtbCA9IFhtbFV0aWwuY3JlYXRlWG1sSGVhZGVyKCk7XHJcbiAgICAgIHhtbCArPSBcIjxSb3dzPlxcblwiO1xyXG5cclxuICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xyXG4gICAgICAgIHhtbCArPSBcIjxSb3c+XFxuXCI7XHJcbiAgICAgICAgeG1sICs9IGAgIDxOdW1lcm9Eb2M+JHtYbWxVdGlsLmVzY2FwZVhtbChcclxuICAgICAgICAgIHJvdy5OVU1FUk9FWFRFUk5PIHx8IFwiXCJcclxuICAgICAgICApfTwvTnVtZXJvRG9jPlxcbmA7XHJcbiAgICAgICAgeG1sICs9IGAgIDxNb3Rpdm9TZWxlY2Npb24+JHtYbWxVdGlsLmVzY2FwZVhtbChcclxuICAgICAgICAgIHJvdy5NT1RJVk9fU0VMRUNDSU9OIHx8IFwiXCJcclxuICAgICAgICApfTwvTW90aXZvU2VsZWNjaW9uPlxcbmA7XHJcbiAgICAgICAgeG1sICs9IGAgIDxSZXN1bHRhZG9TZWxlY2Npb24+JHtYbWxVdGlsLmVzY2FwZVhtbChcclxuICAgICAgICAgIHJvdy5SRVNVTFRBRE9fU0VMRUNDSU9OIHx8IFwiXCJcclxuICAgICAgICApfTwvUmVzdWx0YWRvU2VsZWNjaW9uPlxcbmA7XHJcbiAgICAgICAgeG1sICs9IGAgIDxEZXRhbGxlPk3DoXMgSW5mby48L0RldGFsbGU+XFxuYDtcclxuICAgICAgICB4bWwgKz0gXCI8L1Jvdz5cXG5cIjtcclxuICAgICAgfVxyXG5cclxuICAgICAgeG1sICs9IFwiPC9Sb3dzPlwiO1xyXG5cclxuICAgICAgcmV0dXJuIHhtbDtcclxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgdGhyb3cgUmVzcG9uc2VVdGlsLmludGVybmFsRXJyb3IoZXJyb3IpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRW52w61hIHVuIHByb2Nlc28gZGUgZXhwb3J0YWNpw7NuIFhNTCBhIGxhIGNvbGEgU1FTIHBhcmEgcHJvY2VzYW1pZW50byBhc8OtbmNyb25vXHJcbiAgICogRWwgcG9sbGluZyBwcm9jZXNzIChtYXJjb3MvbWluaW1pc19wd2ViX3BvbGxpbmdfcHJvY2VzcykgY29uc3VtaXLDoSBlbCBtZW5zYWplIHkgbG8gcHJvY2VzYXLDoS5cclxuICAgKiBFbCBwb2xsaW5nIHByb2Nlc3MgYWN0dWFsaXphcsOhIGVsIGVzdGFkbyBlbiBEeW5hbW9EQiB1c2FuZG8gZWwgcmVxdWVzdElkLlxyXG4gICAqL1xyXG4gIGFzeW5jIGV4cG9ydERvY3VtZW50c1NRUyhmaWx0ZXJzOiBCdXNjYXJEb2N1bWVudG9zRHRvLCBmaWxlTmFtZT86IHN0cmluZykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gQ29udmVydGlyIERUTyBhIG9iamV0byBwbGFubyBwYXJhIGVsIG1lbnNhamVcclxuICAgICAgY29uc3QgZmlsdGVyc09iajogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xyXG4gICAgICBpZiAoZmlsdGVycy5udW1lcm9BY2VwdGFjaW9uKSBmaWx0ZXJzT2JqLm51bWVyb0FjZXB0YWNpb24gPSBmaWx0ZXJzLm51bWVyb0FjZXB0YWNpb247XHJcbiAgICAgIGlmIChmaWx0ZXJzLnRpcG9Eb2N1bWVudG8pIGZpbHRlcnNPYmoudGlwb0RvY3VtZW50byA9IGZpbHRlcnMudGlwb0RvY3VtZW50bztcclxuICAgICAgaWYgKGZpbHRlcnMudXNlcklkKSBmaWx0ZXJzT2JqLnVzZXJJZCA9IGZpbHRlcnMudXNlcklkO1xyXG4gICAgICBpZiAoZmlsdGVycy50aXBvTG9jYWNpb24pIGZpbHRlcnNPYmoudGlwb0xvY2FjaW9uID0gZmlsdGVycy50aXBvTG9jYWNpb247XHJcbiAgICAgIGlmIChmaWx0ZXJzLmxvY2FjaW9uKSBmaWx0ZXJzT2JqLmxvY2FjaW9uID0gZmlsdGVycy5sb2NhY2lvbjtcclxuICAgICAgaWYgKGZpbHRlcnMudGlwb0ZlY2hhKSBmaWx0ZXJzT2JqLnRpcG9GZWNoYSA9IGZpbHRlcnMudGlwb0ZlY2hhO1xyXG4gICAgICBpZiAoZmlsdGVycy5mZWNoYURlc2RlKSBmaWx0ZXJzT2JqLmZlY2hhRGVzZGUgPSBmaWx0ZXJzLmZlY2hhRGVzZGU7XHJcbiAgICAgIGlmIChmaWx0ZXJzLmZlY2hhSGFzdGEpIGZpbHRlcnNPYmouZmVjaGFIYXN0YSA9IGZpbHRlcnMuZmVjaGFIYXN0YTtcclxuICAgICAgaWYgKGZpbHRlcnMuc2VudGlkb09wZXJhY2lvbikgZmlsdGVyc09iai5zZW50aWRvT3BlcmFjaW9uID0gZmlsdGVycy5zZW50aWRvT3BlcmFjaW9uO1xyXG4gICAgICBpZiAoZmlsdGVycy5udW1lcm9WdWVsbykgZmlsdGVyc09iai5udW1lcm9WdWVsbyA9IGZpbHRlcnMubnVtZXJvVnVlbG87XHJcbiAgICAgIGlmIChmaWx0ZXJzLm51bWVyb01hbmlmaWVzdG9PcmlnaW5hbCkgZmlsdGVyc09iai5udW1lcm9NYW5pZmllc3RvT3JpZ2luYWwgPSBmaWx0ZXJzLm51bWVyb01hbmlmaWVzdG9PcmlnaW5hbDtcclxuICAgICAgaWYgKGZpbHRlcnMuZXN0YWRvKSBmaWx0ZXJzT2JqLmVzdGFkbyA9IGZpbHRlcnMuZXN0YWRvO1xyXG4gICAgICBpZiAoZmlsdGVycy50aXBvUGFydGljaXBhbnRlKSBmaWx0ZXJzT2JqLnRpcG9QYXJ0aWNpcGFudGUgPSBmaWx0ZXJzLnRpcG9QYXJ0aWNpcGFudGU7XHJcbiAgICAgIGlmIChmaWx0ZXJzLmVtaXNvcikgZmlsdGVyc09iai5lbWlzb3IgPSBmaWx0ZXJzLmVtaXNvcjtcclxuXHJcbiAgICAgIC8vIEVudmlhciBtZW5zYWplIGRpcmVjdGFtZW50ZSBhIFNRUyB1c2FuZG8gTWFuaWZlc3RTUVNTZXJ2aWNlXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMubWFuaWZlc3RTUVNTZXJ2aWNlLnNlbmRYbWxFeHBvcnRNZXNzYWdlKFxyXG4gICAgICAgIGZpbHRlcnNPYmosXHJcbiAgICAgICAgZmlsZU5hbWVcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICB0aHJvdyBuZXcgSHR0cEV4Y2VwdGlvbihcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgbWVzc2FnZTogJ0Vycm9yIGFsIGVudmlhciBtZW5zYWplIGEgU1FTJyxcclxuICAgICAgICAgICAgZXJyb3I6IHJlc3VsdC5lcnJvcixcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBIdHRwU3RhdHVzLklOVEVSTkFMX1NFUlZFUl9FUlJPUlxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFJldG9ybmFyIGluZm9ybWFjacOzbiBjb24gZWwgcmVxdWVzdElkIHBhcmEgcXVlIGVsIGNsaWVudGUgcHVlZGEgY29uc3VsdGFyIGVsIGVzdGFkb1xyXG4gICAgICByZXR1cm4gUmVzcG9uc2VVdGlsLnN1Y2Nlc3MoXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgcmVxdWVzdElkOiByZXN1bHQucmVxdWVzdElkLFxyXG4gICAgICAgICAgbWVzc2FnZUlkOiByZXN1bHQubWVzc2FnZUlkLFxyXG4gICAgICAgICAgc3RhdHVzOiAncGVuZGluZycsXHJcbiAgICAgICAgICBtZXNzYWdlOiAnUHJvY2VzbyBkZSBleHBvcnRhY2nDs24gWE1MIGVudmlhZG8gYSBsYSBjb2xhIFNRUy4gRWwgcG9sbGluZyBwcm9jZXNzIGxvIHByb2Nlc2Fyw6EgYXPDrW5jcm9uYW1lbnRlLicsXHJcbiAgICAgICAgICBub3RlOiBgVXNhIGVsIHJlcXVlc3RJZCAoJHtyZXN1bHQucmVxdWVzdElkfSkgcGFyYSBjb25zdWx0YXIgZWwgZXN0YWRvIGRlbCBwcm9jZXNvIGVuIER5bmFtb0RCIGN1YW5kbyBlbCBwb2xsaW5nIHByb2Nlc3MgbG8gcHJvY2VzZS5gLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJ0V4cG9ydGFjacOzbiBYTUwgZW52aWFkYSBhIFNRUyBwYXJhIHByb2Nlc2FtaWVudG8gYXPDrW5jcm9ubydcclxuICAgICAgKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgSHR0cEV4Y2VwdGlvbikge1xyXG4gICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICB9XHJcbiAgICAgIHRocm93IFJlc3BvbnNlVXRpbC5pbnRlcm5hbEVycm9yKGVycm9yKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN1bHRhIGVsIGVzdGFkbyBkZWwgcHJvY2VzbyBkZSBleHBvcnRhY2nDs24gWE1MIHBvciByZXF1ZXN0SWRcclxuICAgKiBcclxuICAgKiBDb25zdWx0YSBlbCBlc3RhZG8gZGVzZGUgRHluYW1vREIgZG9uZGUgZWwgcG9sbGluZyBwcm9jZXNzIGxvIGFjdHVhbGl6YS5cclxuICAgKi9cclxuICBhc3luYyBnZXRYbWxFeHBvcnRTdGF0dXMocmVxdWVzdElkOiBzdHJpbmcpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIENvbnN1bHRhciBEeW5hbW9EQlxyXG4gICAgICBjb25zdCBzdGF0dXNSZWNvcmQgPSBhd2FpdCB0aGlzLmV4cG9ydFN0YXR1c1NlcnZpY2UuZ2V0U3RhdHVzKHJlcXVlc3RJZCk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoIXN0YXR1c1JlY29yZCkge1xyXG4gICAgICAgIHRocm93IG5ldyBOb3RGb3VuZEV4Y2VwdGlvbihcclxuICAgICAgICAgIGBObyBzZSBlbmNvbnRyw7MgdW4gcHJvY2VzbyBkZSBleHBvcnRhY2nDs24gWE1MIGNvbiBlbCByZXF1ZXN0SWQ6ICR7cmVxdWVzdElkfWBcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUmVzcG9uc2VVdGlsLnN1Y2Nlc3MoXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgcmVxdWVzdElkOiBzdGF0dXNSZWNvcmQucmVxdWVzdElkLFxyXG4gICAgICAgICAgc3RhdHVzOiBzdGF0dXNSZWNvcmQuc3RhdHVzLFxyXG4gICAgICAgICAgY3JlYXRlZEF0OiBzdGF0dXNSZWNvcmQuY3JlYXRlZEF0LFxyXG4gICAgICAgICAgdXBkYXRlZEF0OiBzdGF0dXNSZWNvcmQudXBkYXRlZEF0LFxyXG4gICAgICAgICAgc2lnbmVkVXJsOiBzdGF0dXNSZWNvcmQuc2lnbmVkVXJsLFxyXG4gICAgICAgICAgZmlsZU5hbWU6IHN0YXR1c1JlY29yZC5maWxlTmFtZSxcclxuICAgICAgICAgIGVycm9yOiBzdGF0dXNSZWNvcmQuZXJyb3IsXHJcbiAgICAgICAgfSxcclxuICAgICAgICAnRXN0YWRvIGRlbCBwcm9jZXNvIGRlIGV4cG9ydGFjacOzbiBYTUwnXHJcbiAgICAgICk7XHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEh0dHBFeGNlcHRpb24gfHwgZXJyb3IgaW5zdGFuY2VvZiBOb3RGb3VuZEV4Y2VwdGlvbikge1xyXG4gICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICB9XHJcbiAgICAgIHRocm93IFJlc3BvbnNlVXRpbC5pbnRlcm5hbEVycm9yKGVycm9yKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIGNsb3NlTWFuaWZlc3RTeW5jKHBheWxvYWQ6IENsb3NlTWFuaWZlc3REdG8pIHtcclxuICAgIC8qXHJcbiAgICAgKiBBTEdPUklUTU8gREUgUFJPQ0VTQU1JRU5UTyBERSBET0NVTUVOVE9TIFJFRkVSRU5DSUFET1M6XHJcbiAgICAgKlxyXG4gICAgICogRXN0ZSBibG9xdWUgcHJvY2VzYSBjYWRhIGRvY3VtZW50byByZWxhY2lvbmFkbyAoQkwsIEdBIG8gR1RJTUUpIHF1ZSBmdWUgZW5jb250cmFkb1xyXG4gICAgICogZW4gbGEgY29uc3VsdGEgYW50ZXJpb3IgeSBhbG1hY2VuYWRvIGVuIGxhIGNvbGVjY2nDs24gQ29sUmVmZXJlbmNpYXMuXHJcbiAgICAgKlxyXG4gICAgICogUGFzb3MgZGVsIGFsZ29yaXRtbzpcclxuICAgICAqIDEuIFZlcmlmaWNhciBxdWUgZXhpc3RhbiBkb2N1bWVudG9zIHJlZmVyZW5jaWFkb3MgZW4gbGEgY29sZWNjacOzblxyXG4gICAgICogMi4gSXRlcmFyIHNvYnJlIGNhZGEgZG9jdW1lbnRvIHJlZmVyZW5jaWFkbyBlbmNvbnRyYWRvXHJcbiAgICAgKiAzLiBFeHRyYWVyIGVsIElEIGRlbCBkb2N1bWVudG8gZGVzZGUgZWwgSGFzaHRhYmxlXHJcbiAgICAgKiA0LiBDb25zb2xpZGFyIGVsIGRvY3VtZW50byAoQkwvR0EvR1RJTUUpIC0gYWN0dWFsaXphIGVzdGFkb3MgeSByZWxhY2lvbmVzXHJcbiAgICAgKiA1LiBDZXJyYXIgbGFzIGFjdGl2aWRhZGVzIGRlbCBkb2N1bWVudG8gZW4gZWwgd29ya2Zsb3cgLSBmaW5hbGl6YSBwcm9jZXNvcyBwZW5kaWVudGVzXHJcbiAgICAgKlxyXG4gICAgICogUHJvcMOzc2l0bzogQWwgY29uc29saWRhciB1biBtYW5pZmllc3RvLCBzZSBkZWJlbiBwcm9jZXNhciB0b2RvcyBsb3MgZG9jdW1lbnRvc1xyXG4gICAgICogYXNvY2lhZG9zIChCTHMsIEdBcywgZXRjLikgcGFyYSBhY3R1YWxpemFyIHN1cyBlc3RhZG9zIHkgY2VycmFyIHN1cyBhY3RpdmlkYWRlc1xyXG4gICAgICogZW4gZWwgc2lzdGVtYSBkZSB3b3JrZmxvdy5cclxuICAgICAqL1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgeyBkb2N1bWVudG9JZCB9ID0gcGF5bG9hZDtcclxuXHJcbiAgICAgIC8vIE9idGVuZXIgZHJpdmVyIHVuYSB2ZXogKHJldXRpbGl6YWJsZSBwYXJhIG3Dumx0aXBsZXMgY29uc3VsdGFzKVxyXG4gICAgICBjb25zdCBkcml2ZXIgPSB0aGlzLmRhdGFTb3VyY2UuZHJpdmVyO1xyXG5cclxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgIC8vIFBBU08gMDE6IFZlcmlmaWNhciBxdWUgZWwgZXN0YWRvIGRlbCBtYW5pZmllc3RvIHNlYSBBQ0VQVEFETyB5IHJldmlzYWRvIGRpZ2EgTk9cclxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgIGNvbnN0IHBhc28wUGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcclxuICAgICAgICBwX2lkX2RvY3VtZW50bzogZG9jdW1lbnRvSWQsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCBwYXNvMFNxbCA9IGBcclxuICAgICAgICBXSVRIIGZlY2hhX21heF9lc3RhZG9zX21hbmlmaWVzdG8gQVMgKFxyXG4gICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICBkZXQuRE9DVU1FTlRPLFxyXG4gICAgICAgICAgICBNQVgoZGV0LkZFQ0hBQUNUSVZBKSBBUyBtYXhfZmVjaGFhY3RpdmFcclxuICAgICAgICAgIEZST00gRE9DVU1FTlRPUy5ET0NFU1RBRE9TIGRldFxyXG4gICAgICAgICAgV0hFUkUgZGV0LlRJUE9ET0NVTUVOVE8gPSAnTUZUT0MnXHJcbiAgICAgICAgICAgIEFORCBkZXQuQUNUSVZBID0gJ1MnXHJcbiAgICAgICAgICAgIEFORCBkZXQuVElQT0VTVEFETyBOT1QgSU4gKCdGUExBWk8nLCdDT04gTUFSQ0EnLCdWSVMnLCdSRUMnKVxyXG4gICAgICAgICAgICBBTkQgZGV0LlRJUE9FU1RBRE8gSU4gKCdBQ1AnLCdBTlUnLCdDTVAnLCdBQ0wnLCdNT0QnLCdDTVBGUCcsICdBQ0xQJylcclxuICAgICAgICAgIEdST1VQIEJZIGRldC5ET0NVTUVOVE9cclxuICAgICAgICApLFxyXG4gICAgICAgIGVzdGFkb19tYXhfdGlwb19tYW5pZmllc3RvIEFTIChcclxuICAgICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgICAgZGV0LkRPQ1VNRU5UTyxcclxuICAgICAgICAgICAgTUFYKGRldC5USVBPRVNUQURPKSBBUyBtYXhfdGlwb2VzdGFkbyxcclxuICAgICAgICAgICAgZGV0LkZFQ0hBQUNUSVZBIEFTIGZlY2hhYWN0aXZhXHJcbiAgICAgICAgICBGUk9NIERPQ1VNRU5UT1MuRE9DRVNUQURPUyBkZXRcclxuICAgICAgICAgIEpPSU4gZmVjaGFfbWF4X2VzdGFkb3NfbWFuaWZpZXN0byBmbWVtIE9OIGZtZW0uRE9DVU1FTlRPID0gZGV0LkRPQ1VNRU5UTyBcclxuICAgICAgICAgICAgQU5EIGZtZW0ubWF4X2ZlY2hhYWN0aXZhID0gZGV0LkZFQ0hBQUNUSVZBXHJcbiAgICAgICAgICBXSEVSRSBkZXQuVElQT0RPQ1VNRU5UTyA9ICdNRlRPQydcclxuICAgICAgICAgICAgQU5EIGRldC5BQ1RJVkEgPSAnUydcclxuICAgICAgICAgICAgQU5EIGRldC5USVBPRVNUQURPIElOICgnQUNQJywnQU5VJywnQ01QJywnQUNMJywnTU9EJywnQ01QRlAnLCAnQUNMUCcpXHJcbiAgICAgICAgICBHUk9VUCBCWSBkZXQuRE9DVU1FTlRPLCBkZXQuRkVDSEFBQ1RJVkFcclxuICAgICAgICApLFxyXG4gICAgICAgIGVzdGFkb3Nfb3JkZW5hZG9zIEFTIChcclxuICAgICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgICAgZW10LkRPQ1VNRU5UTyxcclxuICAgICAgICAgICAgZW10Lm1heF90aXBvZXN0YWRvIEFTIFRJUE9FU1RBRE8sXHJcbiAgICAgICAgICAgIGR0ZS5OT01CUkUsXHJcbiAgICAgICAgICAgIGVtdC5mZWNoYWFjdGl2YSBBUyBGRUNIQSxcclxuICAgICAgICAgICAgUk9XX05VTUJFUigpIE9WRVIgKFBBUlRJVElPTiBCWSBlbXQuRE9DVU1FTlRPIE9SREVSIEJZIGVtdC5mZWNoYWFjdGl2YSBERVNDKSBBUyByblxyXG4gICAgICAgICAgRlJPTSBlc3RhZG9fbWF4X3RpcG9fbWFuaWZpZXN0byBlbXRcclxuICAgICAgICAgIEpPSU4gRE9DVU1FTlRPUy5ET0NUSVBPRVNUQURPIGR0ZSBPTiBlbXQubWF4X3RpcG9lc3RhZG8gPSBkdGUuQ09ESUdPXHJcbiAgICAgICAgICBXSEVSRSBkdGUuVElQT0RPQ1VNRU5UTyA9ICdNRlRPQydcclxuICAgICAgICApXHJcbiAgICAgICAgU0VMRUNUXHJcbiAgICAgICAgICBkZC5JRCBBUyBJRCxcclxuICAgICAgICAgIGVvLlRJUE9FU1RBRE8gQVMgVElQT19FU1RBRE8sXHJcbiAgICAgICAgICBlby5OT01CUkUgQVMgRVNUQURPLFxyXG4gICAgICAgICAgQ0FTRSBcclxuICAgICAgICAgICAgV0hFTiBFWElTVFMgKFxyXG4gICAgICAgICAgICAgIFNFTEVDVCAxIFxyXG4gICAgICAgICAgICAgIEZST00gRE9DVU1FTlRPUy5ET0NFU1RBRE9TIGVzdCBcclxuICAgICAgICAgICAgICBXSEVSRSBlc3QudGlwb2RvY3VtZW50byA9IGRkLnRpcG9kb2N1bWVudG8gXHJcbiAgICAgICAgICAgICAgICBBTkQgZXN0LmRvY3VtZW50byA9IGRkLmlkIFxyXG4gICAgICAgICAgICAgICAgQU5EIGVzdC50aXBvZXN0YWRvID0gJ1ZJUycgXHJcbiAgICAgICAgICAgICAgICBBTkQgZXN0LmFjdGl2YSA9ICdTJ1xyXG4gICAgICAgICAgICApIFRIRU4gJ1NJJ1xyXG4gICAgICAgICAgICBFTFNFICdOTydcclxuICAgICAgICAgIEVORCBBUyBSRVZJU0FETyxcclxuICAgICAgICAgIGRkLlRJUE9ET0NVTUVOVE8gQVMgVElQT0RPQ1VNRU5UT1xyXG4gICAgICAgIEZST00gRE9DVU1FTlRPUy5ET0NET0NVTUVOVE9CQVNFIGRkXHJcbiAgICAgICAgSk9JTiBET0NUUkFOU1BPUlRFLkRPQ1RSQU5NQU5JRklFU1RPIGR0bSBPTiBkZC5JRCA9IGR0bS5JRFxyXG4gICAgICAgIEpPSU4gZXN0YWRvc19vcmRlbmFkb3MgZW8gT04gZGQuSUQgPSBlby5ET0NVTUVOVE8gQU5EIGVvLnJuID0gMVxyXG4gICAgICAgIFdIRVJFIGRkLklEID0gOnBfaWRfZG9jdW1lbnRvXHJcbiAgICAgIGA7XHJcblxyXG4gICAgICBjb25zdCBbZXNjYXBlZFBhc28wUXVlcnksIGVzY2FwZWRQYXNvMFBhcmFtc10gPVxyXG4gICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKHBhc28wU3FsLCBwYXNvMFBhcmFtcywge30pO1xyXG5cclxuICAgICAgY29uc3QgcGFzbzBSb3dzID0gYXdhaXQgdGhpcy5kYXRhU291cmNlLnF1ZXJ5KFxyXG4gICAgICAgIGVzY2FwZWRQYXNvMFF1ZXJ5LFxyXG4gICAgICAgIGVzY2FwZWRQYXNvMFBhcmFtc1xyXG4gICAgICApO1xyXG5cclxuICAgICAgLy8gVmFsaWRhciBxdWUgZWwgZG9jdW1lbnRvIGV4aXN0ZVxyXG4gICAgICBpZiAoIXBhc28wUm93cyB8fCBwYXNvMFJvd3MubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIFJlc3BvbnNlVXRpbC5zdWNjZXNzKFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBkb2N1bWVudG9JZCxcclxuICAgICAgICAgICAgdmFsaWRvOiBmYWxzZSxcclxuICAgICAgICAgICAgbWVzc2FnZTogXCJFbCBkb2N1bWVudG8gbm8gZXhpc3RlIG8gbm8gZXMgdW4gbWFuaWZpZXN0byB2w6FsaWRvXCIsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgXCJEb2N1bWVudG8gbm8gZW5jb250cmFkb1wiXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgZG9jdW1lbnRvSW5mbyA9IHBhc28wUm93c1swXTtcclxuICAgICAgY29uc3QgZXN0YWRvID0gZG9jdW1lbnRvSW5mbz8uRVNUQURPIHx8IGRvY3VtZW50b0luZm8/LmVzdGFkbztcclxuICAgICAgY29uc3QgdGlwb19lc3RhZG8gPVxyXG4gICAgICAgIGRvY3VtZW50b0luZm8/LlRJUE9fRVNUQURPIHx8IGRvY3VtZW50b0luZm8/LnRpcG9fZXN0YWRvO1xyXG4gICAgICBjb25zdCByZXZpc2FkbyA9IGRvY3VtZW50b0luZm8/LlJFVklTQURPIHx8IGRvY3VtZW50b0luZm8/LnJldmlzYWRvO1xyXG5cclxuICAgICAgLy8gVmFsaWRhciBxdWUgZWwgZXN0YWRvIHNlYSBcIkFDRVBUQURPXCIgKGxhIGNvbnN1bHRhIHlhIHRyYWUgZWwgbm9tYnJlIGRlbCBlc3RhZG8pXHJcbiAgICAgIGNvbnN0IGVzdGFkb0FjZXB0YWRvID0gZXN0YWRvICYmIGVzdGFkby50b1VwcGVyQ2FzZSgpID09PSBcIkFDRVBUQURPXCI7XHJcblxyXG4gICAgICAvLyBWYWxpZGFyIHRhbWJpw6luIHBvciBlbCBjw7NkaWdvIGRlbCB0aXBvIGRlIGVzdGFkbyAoYW1iYXMgZGViZW4gY29uY29yZGFyKVxyXG4gICAgICBjb25zdCB0aXBvRXN0YWRvQWNlcHRhZG8gPVxyXG4gICAgICAgIHRpcG9fZXN0YWRvICYmXHJcbiAgICAgICAgKHRpcG9fZXN0YWRvLnRvVXBwZXJDYXNlKCkuaW5jbHVkZXMoXCJBQ1BcIikgfHwgdGlwb19lc3RhZG8gPT09IFwiQUNQXCIpO1xyXG5cclxuICAgICAgaWYgKCFlc3RhZG9BY2VwdGFkbyB8fCAhdGlwb0VzdGFkb0FjZXB0YWRvKSB7XHJcbiAgICAgICAgcmV0dXJuIFJlc3BvbnNlVXRpbC5zdWNjZXNzKFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBkb2N1bWVudG9JZCxcclxuICAgICAgICAgICAgdmFsaWRvOiBmYWxzZSxcclxuICAgICAgICAgICAgZXN0YWRvOiBlc3RhZG8sXHJcbiAgICAgICAgICAgIHJldmlzYWRvOiByZXZpc2FkbyxcclxuICAgICAgICAgICAgbWVzc2FnZTogYEVsIG1hbmlmaWVzdG8gbm8gZXN0w6EgZW4gZXN0YWRvIEFjZXB0YWRvLiBFc3RhZG8gYWN0dWFsOiAke2VzdGFkb31gLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIFwiRXN0YWRvIG5vIHbDoWxpZG8gcGFyYSBjZXJyYXIgbWFuaWZpZXN0b1wiXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gVmFsaWRhciBxdWUgbm8gZXN0w6kgcmV2aXNhZG9cclxuICAgICAgaWYgKHJldmlzYWRvID09PSBcIlNJXCIgfHwgcmV2aXNhZG8gPT09IFwic2lcIiB8fCByZXZpc2FkbyA9PT0gXCJTaVwiKSB7XHJcbiAgICAgICAgcmV0dXJuIFJlc3BvbnNlVXRpbC5zdWNjZXNzKFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBkb2N1bWVudG9JZCxcclxuICAgICAgICAgICAgdmFsaWRvOiBmYWxzZSxcclxuICAgICAgICAgICAgZXN0YWRvOiBlc3RhZG8sXHJcbiAgICAgICAgICAgIHJldmlzYWRvOiByZXZpc2FkbyxcclxuICAgICAgICAgICAgbWVzc2FnZTogXCJFbCBtYW5pZmllc3RvIHlhIGZ1ZSByZXZpc2Fkbywgbm8gc2UgcHVlZGUgY2VycmFyXCIsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgXCJNYW5pZmllc3RvIHlhIHJldmlzYWRvXCJcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiUGFzbyBlbCBwYXNvIDAxXCIpO1xyXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgLy8gUEFTTyAwMjogVmVyaWZpY2FyIHF1ZSBlbCBlc3RhZG8gZGVsIG1hbmlmaWVzdG8gbm8gZXN0w6kgYW51bGFkb1xyXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgLypcclxuICAgICAgY29uc3QgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcclxuICAgICAgICBkb2N1bWVudG9JZDogZG9jdW1lbnRvSWQsXHJcbiAgICAgICAgdGlwb0VzdGFkbzogXCJBTlVcIixcclxuICAgICAgICBhY3RpdmE6IFwiU1wiLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgY2hlY2tBbnVsYWRvU3FsID0gYFxyXG4gICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgIGRlLkRPQ1VNRU5UTyxcclxuICAgICAgICAgIGRlLlRJUE9ET0NVTUVOVE8sXHJcbiAgICAgICAgICBkZS5USVBPRVNUQURPLFxyXG4gICAgICAgICAgZGUuRkVDSEEsXHJcbiAgICAgICAgICBkZS5JRFVTVUFSSU8sXHJcbiAgICAgICAgICBkdGUuTk9NQlJFXHJcbiAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRPQ0VTVEFET1MgZGVcclxuICAgICAgICBKT0lOIERPQ1VNRU5UT1MuRE9DVElQT0VTVEFETyBkdGUgXHJcbiAgICAgICAgICBPTiBkZS5USVBPRE9DVU1FTlRPID0gZHRlLlRJUE9ET0NVTUVOVE9cclxuICAgICAgICAgIEFORCBkZS5USVBPRVNUQURPID0gZHRlLkNPRElHT1xyXG4gICAgICAgIFdIRVJFIGRlLkRPQ1VNRU5UTyA9IDpkb2N1bWVudG9JZFxyXG4gICAgICAgICAgQU5EIGRlLlRJUE9FU1RBRE8gPSA6dGlwb0VzdGFkb1xyXG4gICAgICAgICAgQU5EIGR0ZS5BQ1RJVkEgPSA6YWN0aXZhXHJcbiAgICAgICAgICBBTkQgZGUuQUNUSVZBID0gOmFjdGl2YVxyXG4gICAgICBgO1xyXG5cclxuICAgICAgY29uc3QgW2VzY2FwZWRRdWVyeSwgZXNjYXBlZFBhcmFtc10gPSBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICBjaGVja0FudWxhZG9TcWwsXHJcbiAgICAgICAgcGFyYW1zLFxyXG4gICAgICAgIHt9XHJcbiAgICAgICk7XHJcblxyXG4gICAgICBjb25zdCBlc3RhZG9BbnVsYWRvUm93cyA9IGF3YWl0IHRoaXMuZGF0YVNvdXJjZS5xdWVyeShcclxuICAgICAgICBlc2NhcGVkUXVlcnksXHJcbiAgICAgICAgZXNjYXBlZFBhcmFtc1xyXG4gICAgICApO1xyXG5cclxuICAgICAgY29uc3QgZXN0YUFudWxhZG8gPSBlc3RhZG9BbnVsYWRvUm93cyAmJiBlc3RhZG9BbnVsYWRvUm93cy5sZW5ndGggPiAwO1xyXG4gICAgICAqL1xyXG4gICAgICBjb25zdCBlc3RhQW51bGFkbyA9XHJcbiAgICAgICAgdGlwb19lc3RhZG8gJiYgdGlwb19lc3RhZG8udG9VcHBlckNhc2UoKSA9PT0gXCJBTlVcIjtcclxuXHJcbiAgICAgIC8vIDIuIFNpIHRpZW5lIGVzdGFkbyBhbnVsYWRvLCBubyBlamVjdXRhciBlbCBwcm9jZXNvXHJcbiAgICAgIGlmIChlc3RhQW51bGFkbykge1xyXG4gICAgICAgIHJldHVybiBSZXNwb25zZVV0aWwuc3VjY2VzcyhcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgZG9jdW1lbnRvSWQsXHJcbiAgICAgICAgICAgIGVzdGFBbnVsYWRvOiB0cnVlLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBcIkVsIG1hbmlmaWVzdG8gZXN0w6EgYW51bGFkbywgbm8gc2UgcHVlZGUgY2VycmFyXCIsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgXCJNYW5pZmllc3RvIGFudWxhZG9cIlxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc29sZS5sb2coXCJQYXNvIGVsIHBhc28gMDJcIik7XHJcblxyXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgLy8gUEFTTyAwMzogVmVyaWZpY2FyIHF1ZSBlbCB0aXBvIGRlIG1hbmlmaWVzdG8gc2VhIE1GVE9DIHkgY3JlYXIgdmFyaWFibGUgR1RJTUVcclxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgIGNvbnN0IHRpcG9Eb2N1bWVudG8gPVxyXG4gICAgICAgIGRvY3VtZW50b0luZm8/LlRJUE9ET0NVTUVOVE8gfHwgZG9jdW1lbnRvSW5mbz8udGlwb2RvY3VtZW50byB8fCBudWxsO1xyXG5cclxuICAgICAgLy8gNC4gQ29tcGFyYXIgcXVlIHNlYSBNRlRPQyBwYXJhIGJ1c2NhciBsYXMgZ3XDrWFzXHJcbiAgICAgIGxldCB0aXBvRG9jVDogc3RyaW5nIHwgbnVsbCA9IG51bGw7IC8vIFZhcmlhYmxlIHBhcmEgdHJhYmFqYXIgY29uIGVsIHRpcG8gZGUgZG9jdW1lbnRvIHJlbGFjaW9uYWRvXHJcblxyXG4gICAgICBpZiAodGlwb0RvY3VtZW50byA9PT0gXCJNRlRPQ1wiKSB7XHJcbiAgICAgICAgdGlwb0RvY1QgPSBcIkdUSU1FXCI7IC8vIFNpIGVzIE1GVE9DLCB0cmFiYWphbW9zIGNvbiBndcOtYXMgdGlwbyBHVElNRVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBTaSBubyBlcyBNRlRPQywgbm8gc2UgcHVlZGUgY2VycmFyIGVsIG1hbmlmaWVzdG9cclxuICAgICAgaWYgKHRpcG9Eb2N1bWVudG8gIT09IFwiTUZUT0NcIikge1xyXG4gICAgICAgIHJldHVybiBSZXNwb25zZVV0aWwuc3VjY2VzcyhcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgZG9jdW1lbnRvSWQsXHJcbiAgICAgICAgICAgIHZhbGlkbzogZmFsc2UsXHJcbiAgICAgICAgICAgIHRpcG9Eb2N1bWVudG86IHRpcG9Eb2N1bWVudG8sXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBFbCBkb2N1bWVudG8gbm8gZXMgdW4gbWFuaWZpZXN0byBNRlRPQy4gVGlwbyBkZSBkb2N1bWVudG86ICR7dGlwb0RvY3VtZW50b31gLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIFwiVGlwbyBkZSBkb2N1bWVudG8gbm8gdsOhbGlkb1wiXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zb2xlLmxvZyhcIlBhc28gZWwgcGFzbyAwM1wiKTtcclxuXHJcbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAvLyBQQVNPIDA0OiBCdXNjYXIgdG9kYXMgbGFzIEd1w61hcyBBc29jaWFkYXMgYWwgbWFuaWZpZXN0b1xyXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgY29uc3QgYnVzY2FyRG9jdW1lbnRvc1JlbGFjaW9uYWRvc1NxbCA9IGBcclxuICAgICAgICBTRUxFQ1QgRElTVElOQ1QgUi5Eb2NPcmlnZW4gQVMgSWRcclxuICAgICAgICBGUk9NIERPQ1VNRU5UT1MuRE9DUkVMQUNJT05ET0NVTUVOVE8gUlxyXG4gICAgICAgIEpPSU4gRE9DVU1FTlRPUy5ET0NET0NVTUVOVE9CQVNFIEQgT04gUi5Eb2NPcmlnZW4gPSBELklkXHJcbiAgICAgICAgV0hFUkUgUi5Eb2NEZXN0aW5vID0gOmlkTWFuaWZpZXN0b1xyXG4gICAgICAgICAgQU5EIFIuVGlwb1JlbGFjaW9uID0gJ1JFRidcclxuICAgICAgICAgIEFORCBELlRpcG9Eb2N1bWVudG8gPSA6dGlwb0RvY1RcclxuICAgICAgICAgIEFORCBOT1QgRVhJU1RTIChcclxuICAgICAgICAgICAgU0VMRUNUIDFcclxuICAgICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRPQ0VTVEFET1MgRVxyXG4gICAgICAgICAgICBXSEVSRSBFLmRvY3VtZW50byA9IFIuRG9jT3JpZ2VuXHJcbiAgICAgICAgICAgICAgQU5EIEUuVGlwb0VzdGFkbyA9ICdBTlUnXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgICBBTkQgRC5BY3Rpdm8gPSAnUydcclxuICAgICAgYDtcclxuXHJcbiAgICAgIGNvbnN0IGRvY3VtZW50b3NSZWxhY2lvbmFkb3NQYXJhbXM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xyXG4gICAgICAgIGlkTWFuaWZpZXN0bzogZG9jdW1lbnRvSWQsXHJcbiAgICAgICAgdGlwb0RvY1Q6IHRpcG9Eb2NULFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgW2VzY2FwZWRSZWxhY2lvbmFkb3NRdWVyeSwgZXNjYXBlZFJlbGFjaW9uYWRvc1BhcmFtc10gPVxyXG4gICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgYnVzY2FyRG9jdW1lbnRvc1JlbGFjaW9uYWRvc1NxbCxcclxuICAgICAgICAgIGRvY3VtZW50b3NSZWxhY2lvbmFkb3NQYXJhbXMsXHJcbiAgICAgICAgICB7fVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICBjb25zdCBkb2N1bWVudG9zUmVsYWNpb25hZG9zUm93cyA9IGF3YWl0IHRoaXMuZGF0YVNvdXJjZS5xdWVyeShcclxuICAgICAgICBlc2NhcGVkUmVsYWNpb25hZG9zUXVlcnksXHJcbiAgICAgICAgZXNjYXBlZFJlbGFjaW9uYWRvc1BhcmFtc1xyXG4gICAgICApO1xyXG5cclxuICAgICAgLy8gRXh0cmFlciBsb3MgSURzIGRlIGxvcyBkb2N1bWVudG9zIHJlbGFjaW9uYWRvc1xyXG4gICAgICBjb25zdCBpZHNEb2N1bWVudG9zUmVsYWNpb25hZG9zID1cclxuICAgICAgICBkb2N1bWVudG9zUmVsYWNpb25hZG9zUm93cz8ubWFwKFxyXG4gICAgICAgICAgKHJvdzogYW55KSA9PiByb3cuSWQgfHwgcm93LmlkIHx8IHJvdy5JRFxyXG4gICAgICAgICkgfHwgW107XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICBcIkRvY3VtZW50b3MgcmVsYWNpb25hZG9zIGVuY29udHJhZG9zOlwiLFxyXG4gICAgICAgIGlkc0RvY3VtZW50b3NSZWxhY2lvbmFkb3MubGVuZ3RoXHJcbiAgICAgICk7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiUGFzbyBlbCBwYXNvIDA0XCIsIGlkc0RvY3VtZW50b3NSZWxhY2lvbmFkb3MpO1xyXG4gICAgICAvKiovXHJcbiAgICAgIC8vIElOSUNJQVIgUFJPQ0VTTyBERSBUUkFOU0FDQ0lPTkVTIERFIEJEXHJcbiAgICAgIC8vIENyZWFyIFF1ZXJ5UnVubmVyIHBhcmEgbWFuZWphciBsYSB0cmFuc2FjY2nDs25cclxuICAgICAgY29uc3QgcXVlcnlSdW5uZXI6IFF1ZXJ5UnVubmVyID0gdGhpcy5kYXRhU291cmNlLmNyZWF0ZVF1ZXJ5UnVubmVyKCk7XHJcbiAgICAgIGF3YWl0IHF1ZXJ5UnVubmVyLmNvbm5lY3QoKTtcclxuICAgICAgYXdhaXQgcXVlcnlSdW5uZXIuc3RhcnRUcmFuc2FjdGlvbigpO1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICAvLyBDb25zb2xpZGFjacOzbiBkZSBndcOtYXM6IFBvciBjYWRhIEd1w61hIGFzb2NpYWRhIGFsIG1hbmlmaWVzdG9cclxuICAgICAgICBjb25zdCBkb2N1bWVudG9zUGFyYUNvbnNvbGlkYXI6IG51bWJlcltdID0gW107XHJcblxyXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgIC8vIFBBU08gMDU6IFZlcmlmaWNhciBzaSBsYSBndWlhIHF1ZSBzZSB0cmFiYWphIGVuIGVsIG1vbWVudG8gZGVsIGNpY2xvIGVzdMOhIGFudWxhZGEgYW50ZXMgZGUgY29uc29saWRhclxyXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgIGNvbnN0IG9idGVuZXJFc3RhZG9zRG9jdW1lbnRvU3FsID0gYFxyXG4gICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICBEb2NFc3RhZG9zLkRvY3VtZW50bywgXHJcbiAgICAgICAgICAgIERvY0VzdGFkb3MuVGlwb0RvY3VtZW50bywgXHJcbiAgICAgICAgICAgIERvY0VzdGFkb3MuVGlwb0VzdGFkbywgXHJcbiAgICAgICAgICAgIERvY0VzdGFkb3MuRmVjaGEsIFxyXG4gICAgICAgICAgICBEb2NFc3RhZG9zLklkVXN1YXJpbywgXHJcbiAgICAgICAgICAgIERvY1RpcG9Fc3RhZG8uTm9tYnJlIFxyXG4gICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRvY0VzdGFkb3MsIERPQ1VNRU5UT1MuRG9jVGlwb0VzdGFkbyBcclxuICAgICAgICAgIFdIRVJFIERvY0VzdGFkb3MuRG9jdW1lbnRvID0gOmlkRG9jdW1lbnRvIFxyXG4gICAgICAgICAgICBBTkQgRG9jRXN0YWRvcy5UaXBvRG9jdW1lbnRvID0gRG9jVGlwb0VzdGFkby5UaXBvRG9jdW1lbnRvIFxyXG4gICAgICAgICAgICBBTkQgRG9jRXN0YWRvcy5UaXBvRXN0YWRvID0gRG9jVGlwb0VzdGFkby5Db2RpZ28gXHJcbiAgICAgICAgICAgIEFORCBEb2NUaXBvRXN0YWRvLkFjdGl2YSA9ICdTJyBcclxuICAgICAgICAgICAgQU5EIERvY0VzdGFkb3MuQWN0aXZhID0gJ1MnXHJcbiAgICAgICAgYDtcclxuICAgICAgICBcclxuICAgICAgICAvKiogKi9cclxuICAgICAgICBmb3IgKGNvbnN0IGlkRG9jdW1lbnRvIG9mIGlkc0RvY3VtZW50b3NSZWxhY2lvbmFkb3MpIHtcclxuICAgICAgICAgIC8vIEZsdWpvIGlndWFsIGFsIGNvbWVudGFyaW86IGJvb2xlYW4gRXN0YUFudWxhZG8gPSBkb2N1bWVudG9zREFPLmdldERvY1RpZW5lRXN0YWRvKGlkQkwudG9TdHJpbmcoKSwgXCJBTlVcIik7XHJcbiAgICAgICAgICAvLyBFamVjdXRhciBjb25zdWx0YSBkZSBlc3RhZG9zIHBhcmEgZXN0ZSBkb2N1bWVudG9cclxuICAgICAgICAgIGNvbnN0IFtlc2NhcGVkRXN0YWRvc1F1ZXJ5LCBlc2NhcGVkRXN0YWRvc1BhcmFtc10gPVxyXG4gICAgICAgICAgICBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICAgICAgICBvYnRlbmVyRXN0YWRvc0RvY3VtZW50b1NxbCxcclxuICAgICAgICAgICAgICB7IGlkRG9jdW1lbnRvOiBpZERvY3VtZW50byB9LFxyXG4gICAgICAgICAgICAgIHt9XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgY29uc3QgZXN0YWRvc1Jvd3MgPSBhd2FpdCBxdWVyeVJ1bm5lci5xdWVyeShcclxuICAgICAgICAgICAgZXNjYXBlZEVzdGFkb3NRdWVyeSxcclxuICAgICAgICAgICAgZXNjYXBlZEVzdGFkb3NQYXJhbXNcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgLy8gVmVyaWZpY2FyIHNpIHRpZW5lIGVzdGFkbyAnQU5VJyAoc2ltaWxhciBhbCB3aGlsZShyc2V0Lm5leHQoKSkgZGVsIGNvbWVudGFyaW8pXHJcbiAgICAgICAgICBsZXQgZXN0YUFudWxhZG8gPSBmYWxzZTtcclxuICAgICAgICAgIGZvciAoY29uc3QgZXN0YWRvUm93IG9mIGVzdGFkb3NSb3dzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVzdGFkbyA9IGVzdGFkb1Jvdy5UaXBvRXN0YWRvIHx8IGVzdGFkb1Jvdy50aXBvZXN0YWRvO1xyXG4gICAgICAgICAgICAvLyBTaSBlbmN1ZW50cmEgZWwgZXN0YWRvICdBTlUnLCBtYXJjYSBjb21vIGFudWxhZG8gKGlndWFsIGFsIGNvbWVudGFyaW86IGlmKGVzdGFkby5lcXVhbHModGlwb0VzdGFkbykpIHJldHVybiB0cnVlKVxyXG4gICAgICAgICAgICBpZiAoZXN0YWRvID09PSBcIkFOVVwiKSB7XHJcbiAgICAgICAgICAgICAgZXN0YUFudWxhZG8gPSB0cnVlO1xyXG4gICAgICAgICAgICAgIGJyZWFrOyAvLyBTaW1pbGFyIGFsIHJldHVybiB0cnVlIGRlbCBjb21lbnRhcmlvXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBTaSBlc3TDoSBhbnVsYWRvLCBvbWl0aXIgZGVsIHByb2Nlc28gZGUgY29uc29saWRhY2nDs24gKGlndWFsIGFsIGNvbWVudGFyaW86IGlmIChFc3RhQW51bGFkbykgcmV0dXJuOylcclxuICAgICAgICAgIGlmIChlc3RhQW51bGFkbykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICBgW0NPTlNPTElEQUNJT05dIERvY3VtZW50byAke2lkRG9jdW1lbnRvfSBBTlVMQURPIG5vIHNlIENPTlNPTElEQWBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgY29udGludWU7IC8vIFNpbWlsYXIgYWwgcmV0dXJuIGRlbCBjb21lbnRhcmlvLCBwZXJvIGNvbnRpbnVhbW9zIGNvbiBlbCBzaWd1aWVudGUgZG9jdW1lbnRvXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gU2kgbm8gZXN0w6EgYW51bGFkbywgYWdyZWdhcmxvIGEgbGEgbGlzdGEgcGFyYSBjb25zb2xpZGFyXHJcbiAgICAgICAgICBkb2N1bWVudG9zUGFyYUNvbnNvbGlkYXIucHVzaChpZERvY3VtZW50byk7XHJcblxyXG4gICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICAvLyBQQVNPIDA2OiBDYWxjdWxhciBlbCBNQVgoSUQpICsxIHBhcmEgZWwgZXN0YWRvIGNvbmZvcm1hZG9cclxuICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICAgY29uc3QgY2FsY3VsYXJNYXhJZEVzdGFkb1NxbCA9IGBcclxuICAgICAgICAgICAgU0VMRUNUIE1BWChJZCkgQVMgTWF4SWRcclxuICAgICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRvY0VzdGFkb3NcclxuICAgICAgICAgICAgV0hFUkUgRG9jdW1lbnRvID0gOmlkRG9jdW1lbnRvXHJcbiAgICAgICAgICAgICAgQU5EIFRpcG9Eb2N1bWVudG8gPSA6dGlwb0RvY1RcclxuICAgICAgICAgICAgICBBTkQgVGlwb0VzdGFkbyA9ICdDTVAnXHJcbiAgICAgICAgICBgO1xyXG5cclxuICAgICAgICAgIGNvbnN0IFtlc2NhcGVkTWF4SWRRdWVyeSwgZXNjYXBlZE1heElkUGFyYW1zXSA9XHJcbiAgICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgICAgIGNhbGN1bGFyTWF4SWRFc3RhZG9TcWwsXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWREb2N1bWVudG86IGlkRG9jdW1lbnRvLFxyXG4gICAgICAgICAgICAgICAgdGlwb0RvY1Q6IHRpcG9Eb2NULFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBjb25zdCBtYXhJZFJvd3MgPSBhd2FpdCBxdWVyeVJ1bm5lci5xdWVyeShcclxuICAgICAgICAgICAgZXNjYXBlZE1heElkUXVlcnksXHJcbiAgICAgICAgICAgIGVzY2FwZWRNYXhJZFBhcmFtc1xyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBsZXQgbmV4dElkRXN0YWRvID0gMTtcclxuXHJcbiAgICAgICAgICBpZiAobWF4SWRSb3dzICYmIG1heElkUm93cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJvdyA9IG1heElkUm93c1swXTtcclxuICAgICAgICAgICAgbGV0IG1heElkID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmIChyb3cuTUFYSUQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIG1heElkID0gcm93Lk1BWElEO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5NYXhJZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgbWF4SWQgPSByb3cuTWF4SWQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocm93Lm1heGlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICBtYXhJZCA9IHJvdy5tYXhpZDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChyb3cuTUFYX0lEICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICBtYXhJZCA9IHJvdy5NQVhfSUQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChtYXhJZCAhPT0gbnVsbCAmJiBtYXhJZCAhPT0gdW5kZWZpbmVkICYmIG1heElkICE9PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgbWF4SWROdW1iZXIgPSBOdW1iZXIobWF4SWQpO1xyXG4gICAgICAgICAgICAgIGlmICghaXNOYU4obWF4SWROdW1iZXIpKSB7XHJcbiAgICAgICAgICAgICAgICBuZXh0SWRFc3RhZG8gPSBtYXhJZE51bWJlciArIDE7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgIGBEb2N1bWVudG8gJHtpZERvY3VtZW50b306IFNpZ3VpZW50ZSBJZCBwYXJhIGVzdGFkbyBDTVAgc2Vyw6EgJHtuZXh0SWRFc3RhZG99YFxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICAgLy8gUEFTTyAwNzogQ3JlYXIgZWwgZXN0YWRvIGNvbiBlbCBJRCBnZW5lcmFkbyBhbnRlcmlvcm1lbnRlXHJcbiAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgIGNvbnN0IGZlY2hhQ29uc29saWRhY2lvbiA9IG5ldyBEYXRlKCk7IC8vIEZlY2hhIGFjdHVhbCBkZSBsYSBjb25zb2xpZGFjacOzblxyXG5cclxuICAgICAgICAgIGNvbnN0IGluc2VydGFyRXN0YWRvQ21wU3FsID0gYFxyXG4gICAgICAgICAgICBJTlNFUlQgSU5UTyBET0NVTUVOVE9TLkRvY0VzdGFkb3MoXHJcbiAgICAgICAgICAgICAgRG9jdW1lbnRvLCBcclxuICAgICAgICAgICAgICBUaXBvRG9jdW1lbnRvLCBcclxuICAgICAgICAgICAgICBUaXBvRXN0YWRvLCBcclxuICAgICAgICAgICAgICBJZCwgXHJcbiAgICAgICAgICAgICAgRmVjaGEsIFxyXG4gICAgICAgICAgICAgIE9ic2VydmFjaW9uLCBcclxuICAgICAgICAgICAgICBJZFVzdWFyaW8sIFxyXG4gICAgICAgICAgICAgIEFjdGl2YSwgXHJcbiAgICAgICAgICAgICAgRmVjaGFBY3RpdmEsIFxyXG4gICAgICAgICAgICAgIEZlY2hhRGVzYWN0aXZhXHJcbiAgICAgICAgICAgICkgVkFMVUVTIChcclxuICAgICAgICAgICAgICA6aWREb2N1bWVudG8sXHJcbiAgICAgICAgICAgICAgOnRpcG9Eb2NULFxyXG4gICAgICAgICAgICAgICdDTVAnLFxyXG4gICAgICAgICAgICAgIDpuZXh0SWRFc3RhZG8sXHJcbiAgICAgICAgICAgICAgOmZlY2hhQ29uc29saWRhY2lvbixcclxuICAgICAgICAgICAgICAnQ09ORk9STUFDSU9OIEdFTkVSQURBIEFVVE9NQVRJQ0FNRU5URSBQT1IgSVNJRE9SQSAnLFxyXG4gICAgICAgICAgICAgICdbYXV0b21hdGljb10nLFxyXG4gICAgICAgICAgICAgICdTJyxcclxuICAgICAgICAgICAgICA6ZmVjaGFDb25zb2xpZGFjaW9uLFxyXG4gICAgICAgICAgICAgIDpmZWNoYUNvbnNvbGlkYWNpb25cclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICBjb25zdCBbZXNjYXBlZEluc2VydFF1ZXJ5LCBlc2NhcGVkSW5zZXJ0UGFyYW1zXSA9XHJcbiAgICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgICAgIGluc2VydGFyRXN0YWRvQ21wU3FsLFxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlkRG9jdW1lbnRvOiBpZERvY3VtZW50byxcclxuICAgICAgICAgICAgICAgIHRpcG9Eb2NUOiB0aXBvRG9jVCxcclxuICAgICAgICAgICAgICAgIG5leHRJZEVzdGFkbzogbmV4dElkRXN0YWRvLFxyXG4gICAgICAgICAgICAgICAgZmVjaGFDb25zb2xpZGFjaW9uOiBmZWNoYUNvbnNvbGlkYWNpb24sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB7fVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KGVzY2FwZWRJbnNlcnRRdWVyeSwgZXNjYXBlZEluc2VydFBhcmFtcyk7XHJcblxyXG4gICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgIGBFc3RhZG8gQ01QIGluc2VydGFkbyBwYXJhIGRvY3VtZW50byAke2lkRG9jdW1lbnRvfSBjb24gSWQgJHtuZXh0SWRFc3RhZG99YFxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICAvLyBQQVNPIDA4OiBCdXNjYXIgcmVsYWNpb25lcyBwZW5kaWVudGVzIHBhcmEgbGEgZ3XDrWEgcXVlIHNlIGFjYWJhIGRlIHJlZ2lzdHJhclxyXG4gICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICBjb25zdCBidXNjYXJSZWxhY2lvbmVzUGVuZGllbnRlc1NxbCA9IGBcclxuICAgICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICAgIFIuVGlwb1JlbGFjaW9uIEFTIFRpcG9SZWxhY2lvbiwgXHJcbiAgICAgICAgICAgICAgUi5JZCBBUyBJZCwgXHJcbiAgICAgICAgICAgICAgRC5JZCBBUyBEb2NJZFxyXG4gICAgICAgICAgICBGUk9NIERPQ1VNRU5UT1MuRG9jUmVsYWNpb25Eb2N1bWVudG8gUiwgRE9DVU1FTlRPUy5Eb2NEb2N1bWVudG9CYXNlIERcclxuICAgICAgICAgICAgV0hFUkUgUi5Eb2NPcmlnZW4gPSA6aWREb2N1bWVudG8gXHJcbiAgICAgICAgICAgICAgQU5EIFIuRG9jRGVzdGlubyBJUyBOVUxMXHJcbiAgICAgICAgICAgICAgQU5EIEQuVGlwb0RvY3VtZW50byA9IFIuVGlwb0RvY0Rlc3Rpbm9cclxuICAgICAgICAgICAgICBBTkQgRC5OdW1lcm9FeHRlcm5vID0gUi5OdW1Eb2NEZXN0aW5vXHJcbiAgICAgICAgICAgICAgQU5EIEQuSWRFbWlzb3IgPSBSLkVtaXNvckRvY0Rlc3Rpbm9cclxuICAgICAgICAgICAgICBBTkQgRC5GZWNoYUVtaXNpb24gPSBSLkZlY2hhRG9jRGVzdGlub1xyXG4gICAgICAgICAgICAgIEFORCBELkFjdGl2byA9ICdTJyBcclxuICAgICAgICAgICAgICBBTkQgUi5BY3Rpdm8gPSAnUydcclxuICAgICAgICAgIGA7XHJcblxyXG4gICAgICAgICAgY29uc3QgW2VzY2FwZWRSZWxhY2lvbmVzUXVlcnksIGVzY2FwZWRSZWxhY2lvbmVzUGFyYW1zXSA9XHJcbiAgICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgICAgIGJ1c2NhclJlbGFjaW9uZXNQZW5kaWVudGVzU3FsLFxyXG4gICAgICAgICAgICAgIHsgaWREb2N1bWVudG86IGlkRG9jdW1lbnRvIH0sXHJcbiAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBjb25zdCByZWxhY2lvbmVzUGVuZGllbnRlc1Jvd3MgPSBhd2FpdCBxdWVyeVJ1bm5lci5xdWVyeShcclxuICAgICAgICAgICAgZXNjYXBlZFJlbGFjaW9uZXNRdWVyeSxcclxuICAgICAgICAgICAgZXNjYXBlZFJlbGFjaW9uZXNQYXJhbXNcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICBgRG9jdW1lbnRvICR7aWREb2N1bWVudG99OiBFbmNvbnRyYWRhcyAke1xyXG4gICAgICAgICAgICAgIHJlbGFjaW9uZXNQZW5kaWVudGVzUm93cz8ubGVuZ3RoIHx8IDBcclxuICAgICAgICAgICAgfSByZWxhY2lvbmVzIHBlbmRpZW50ZXNgXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJyZWxhY2lvbmVzUGVuZGllbnRlc1Jvd3NcIiwgcmVsYWNpb25lc1BlbmRpZW50ZXNSb3dzKTtcclxuXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIFBvciBjYWRhIHJlbGFjacOzbiBlbmNvbnRyYWRhIGEgbGEgZ3XDrWFcclxuICAgICAgICAgIGZvciAoY29uc3QgcmVsYWNpb25Sb3cgb2YgcmVsYWNpb25lc1BlbmRpZW50ZXNSb3dzIHx8IFtdKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgdGlwb1JlbGFjaW9uID1cclxuICAgICAgICAgICAgICAgIHJlbGFjaW9uUm93LlRpcG9SZWxhY2lvbiB8fCByZWxhY2lvblJvdy50aXBvcmVsYWNpb247XHJcbiAgICAgICAgICAgICAgY29uc3QgcmVsYWNpb25JZCA9IHJlbGFjaW9uUm93LklkIHx8IHJlbGFjaW9uUm93LmlkO1xyXG4gICAgICAgICAgICAgIGNvbnN0IGRvY0lkID0gcmVsYWNpb25Sb3cuRG9jSWQgfHwgcmVsYWNpb25Sb3cuZG9jaWQ7XHJcblxyXG4gICAgICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICAgICAgIC8vIFBBU08gMDk6IFNFTEVDVCAtIE9idGVuZXIgZWwgc2lndWllbnRlIGNvcnJlbGF0aXZvIHBhcmEgZWwgaGlzdG9yaWFsXHJcbiAgICAgICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICAgICAgY29uc3QgY2FsY3VsYXJOZXh0Q29ycmVsYXRpdmVTcWwgPSBgXHJcbiAgICAgICAgICAgICAgICBTRUxFQ1QgTUFYKElkKSBBUyBNYXhJZFxyXG4gICAgICAgICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRvY0hSZWxhY2lvbkRvY3VtZW50b1xyXG4gICAgICAgICAgICAgICAgV0hFUkUgVGlwb1JlbGFjaW9uID0gOnRpcG9SZWxhY2lvblxyXG4gICAgICAgICAgICAgICAgICBBTkQgRG9jT3JpZ2VuID0gOmlkRG9jdW1lbnRvXHJcbiAgICAgICAgICAgICAgICAgIEFORCBSZWxhY2lvbkRvY3VtZW50byA9IDpyZWxhY2lvbklkXHJcbiAgICAgICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgW2VzY2FwZWRDb3JyZWxhdGl2ZVF1ZXJ5LCBlc2NhcGVkQ29ycmVsYXRpdmVQYXJhbXNdID1cclxuICAgICAgICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgICAgICAgICBjYWxjdWxhck5leHRDb3JyZWxhdGl2ZVNxbCxcclxuICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRpcG9SZWxhY2lvbjogdGlwb1JlbGFjaW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkRG9jdW1lbnRvOiBpZERvY3VtZW50byxcclxuICAgICAgICAgICAgICAgICAgICByZWxhY2lvbklkOiByZWxhY2lvbklkLFxyXG4gICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICB7fVxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgY29ycmVsYXRpdmVSb3dzID0gYXdhaXQgcXVlcnlSdW5uZXIucXVlcnkoXHJcbiAgICAgICAgICAgICAgICBlc2NhcGVkQ29ycmVsYXRpdmVRdWVyeSxcclxuICAgICAgICAgICAgICAgIGVzY2FwZWRDb3JyZWxhdGl2ZVBhcmFtc1xyXG4gICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIENhbGN1bGFyIE5leHRDb3JyZWxhdGl2ZSAoc2ltaWxhciBhIG5leHRJZEVzdGFkbylcclxuICAgICAgICAgICAgICBsZXQgbmV4dENvcnJlbGF0aXZlID0gMTtcclxuICAgICAgICAgICAgICBpZiAoY29ycmVsYXRpdmVSb3dzICYmIGNvcnJlbGF0aXZlUm93cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByb3cgPSBjb3JyZWxhdGl2ZVJvd3NbMF07XHJcbiAgICAgICAgICAgICAgICBsZXQgbWF4SWQgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChyb3cuTUFYSUQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICBtYXhJZCA9IHJvdy5NQVhJRDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocm93Lk1heElkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgbWF4SWQgPSByb3cuTWF4SWQ7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5tYXhpZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgIG1heElkID0gcm93Lm1heGlkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChtYXhJZCAhPT0gbnVsbCAmJiBtYXhJZCAhPT0gdW5kZWZpbmVkICYmIG1heElkICE9PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG1heElkTnVtYmVyID0gTnVtYmVyKG1heElkKTtcclxuICAgICAgICAgICAgICAgICAgaWYgKCFpc05hTihtYXhJZE51bWJlcikpIHtcclxuICAgICAgICAgICAgICAgICAgICBuZXh0Q29ycmVsYXRpdmUgPSBtYXhJZE51bWJlciArIDE7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICAgICAgIC8vIFBBU08gMTA6IElOU0VSVCAtIEd1YXJkYXIgcmVnaXN0cm8gaGlzdMOzcmljbyBkZSBsYSByZWxhY2nDs25cclxuICAgICAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgICAgICBjb25zdCBpbnNlcnRhckhpc3RvcmlhbFJlbGFjaW9uU3FsID0gYFxyXG4gICAgICAgICAgICAgICAgSU5TRVJUIElOVE8gRE9DVU1FTlRPUy5Eb2NIUmVsYWNpb25Eb2N1bWVudG8gKFxyXG4gICAgICAgICAgICAgICAgICBUaXBvUmVsYWNpb24sXHJcbiAgICAgICAgICAgICAgICAgIERvY09yaWdlbixcclxuICAgICAgICAgICAgICAgICAgUmVsYWNpb25Eb2N1bWVudG8sXHJcbiAgICAgICAgICAgICAgICAgIElkLFxyXG4gICAgICAgICAgICAgICAgICBGZWNoYSxcclxuICAgICAgICAgICAgICAgICAgT2JzZXJ2YWNpb24sXHJcbiAgICAgICAgICAgICAgICAgIElkVXN1YXJpbyxcclxuICAgICAgICAgICAgICAgICAgVGlwb0RvY0Rlc3Rpbm8sXHJcbiAgICAgICAgICAgICAgICAgIE51bURvY0Rlc3Rpbm8sXHJcbiAgICAgICAgICAgICAgICAgIERvY0Rlc3Rpbm8sXHJcbiAgICAgICAgICAgICAgICAgIEVtaXNvckRvY0Rlc3Rpbm8sXHJcbiAgICAgICAgICAgICAgICAgIE5vbWJyZUVtaXNvcixcclxuICAgICAgICAgICAgICAgICAgQWN0aXZvLFxyXG4gICAgICAgICAgICAgICAgICBGZWNoYUFjdGl2YSxcclxuICAgICAgICAgICAgICAgICAgRmVjaGFEZXNhY3RpdmEsXHJcbiAgICAgICAgICAgICAgICAgIEZlY2hhRG9jRGVzdGlub1xyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICAgICAgICBSLlRpcG9SZWxhY2lvbixcclxuICAgICAgICAgICAgICAgICAgUi5Eb2NPcmlnZW4sXHJcbiAgICAgICAgICAgICAgICAgIFIuSWQsXHJcbiAgICAgICAgICAgICAgICAgIDpuZXh0Q29ycmVsYXRpdmUsXHJcbiAgICAgICAgICAgICAgICAgIFIuRmVjaGEsXHJcbiAgICAgICAgICAgICAgICAgIFIuT2JzZXJ2YWNpb24sXHJcbiAgICAgICAgICAgICAgICAgIFIuSWRVc3VhcmlvLFxyXG4gICAgICAgICAgICAgICAgICBSLlRpcG9Eb2NEZXN0aW5vLFxyXG4gICAgICAgICAgICAgICAgICBSLk51bURvY0Rlc3Rpbm8sXHJcbiAgICAgICAgICAgICAgICAgIFIuRG9jRGVzdGlubyxcclxuICAgICAgICAgICAgICAgICAgUi5FbWlzb3JEb2NEZXN0aW5vLFxyXG4gICAgICAgICAgICAgICAgICBSLk5vbWJyZUVtaXNvcixcclxuICAgICAgICAgICAgICAgICAgUi5BY3Rpdm8sXHJcbiAgICAgICAgICAgICAgICAgIFIuRmVjaGFBY3RpdmEsXHJcbiAgICAgICAgICAgICAgICAgIDpmZWNoYUNvbnNvbGlkYWNpb24sXHJcbiAgICAgICAgICAgICAgICAgIFIuRmVjaGFEb2NEZXN0aW5vXHJcbiAgICAgICAgICAgICAgICBGUk9NIERPQ1VNRU5UT1MuRG9jUmVsYWNpb25Eb2N1bWVudG8gUlxyXG4gICAgICAgICAgICAgICAgV0hFUkUgUi5UaXBvUmVsYWNpb24gPSA6dGlwb1JlbGFjaW9uXHJcbiAgICAgICAgICAgICAgICAgIEFORCBSLkRvY09yaWdlbiA9IDppZERvY3VtZW50b1xyXG4gICAgICAgICAgICAgICAgICBBTkQgUi5JZCA9IDpyZWxhY2lvbklkXHJcbiAgICAgICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgW2VzY2FwZWRIaXN0b3JpYWxRdWVyeSwgZXNjYXBlZEhpc3RvcmlhbFBhcmFtc10gPVxyXG4gICAgICAgICAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICAgICAgICAgIGluc2VydGFySGlzdG9yaWFsUmVsYWNpb25TcWwsXHJcbiAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBuZXh0Q29ycmVsYXRpdmU6IG5leHRDb3JyZWxhdGl2ZSxcclxuICAgICAgICAgICAgICAgICAgICBmZWNoYUNvbnNvbGlkYWNpb246IGZlY2hhQ29uc29saWRhY2lvbixcclxuICAgICAgICAgICAgICAgICAgICB0aXBvUmVsYWNpb246IHRpcG9SZWxhY2lvbixcclxuICAgICAgICAgICAgICAgICAgICBpZERvY3VtZW50bzogaWREb2N1bWVudG8sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVsYWNpb25JZDogcmVsYWNpb25JZCxcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgIGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgICAgICAgZXNjYXBlZEhpc3RvcmlhbFF1ZXJ5LFxyXG4gICAgICAgICAgICAgICAgZXNjYXBlZEhpc3RvcmlhbFBhcmFtc1xyXG4gICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgICAgYEhpc3RvcmlhbCBkZSByZWxhY2nDs24gaW5zZXJ0YWRvOiBUaXBvUmVsYWNpb249JHt0aXBvUmVsYWNpb259LCBSZWxhY2lvbklkPSR7cmVsYWNpb25JZH0sIENvcnJlbGF0aXZlPSR7bmV4dENvcnJlbGF0aXZlfWBcclxuICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgICAgICAvLyBQQVNPIDExOiBVUERBVEUgLSBWaW5jdWxhciBlbCBkb2N1bWVudG8gZGVzdGlubyBlbmNvbnRyYWRvXHJcbiAgICAgICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICAgICAgY29uc3QgYWN0dWFsaXphclJlbGFjaW9uU3FsID0gYFxyXG4gICAgICAgICAgICAgICAgVVBEQVRFIERPQ1VNRU5UT1MuRG9jUmVsYWNpb25Eb2N1bWVudG8gXHJcbiAgICAgICAgICAgICAgICBTRVQgRG9jRGVzdGlubyA9IDpkb2NJZFxyXG4gICAgICAgICAgICAgICAgV0hFUkUgVGlwb1JlbGFjaW9uID0gOnRpcG9SZWxhY2lvblxyXG4gICAgICAgICAgICAgICAgICBBTkQgRG9jT3JpZ2VuID0gOmlkRG9jdW1lbnRvXHJcbiAgICAgICAgICAgICAgICAgIEFORCBJZCA9IDpyZWxhY2lvbklkXHJcbiAgICAgICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgW2VzY2FwZWRVcGRhdGVRdWVyeSwgZXNjYXBlZFVwZGF0ZVBhcmFtc10gPVxyXG4gICAgICAgICAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICAgICAgICAgIGFjdHVhbGl6YXJSZWxhY2lvblNxbCxcclxuICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGRvY0lkOiBkb2NJZCxcclxuICAgICAgICAgICAgICAgICAgICB0aXBvUmVsYWNpb246IHRpcG9SZWxhY2lvbixcclxuICAgICAgICAgICAgICAgICAgICBpZERvY3VtZW50bzogaWREb2N1bWVudG8sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVsYWNpb25JZDogcmVsYWNpb25JZCxcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgIGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KGVzY2FwZWRVcGRhdGVRdWVyeSwgZXNjYXBlZFVwZGF0ZVBhcmFtcyk7XHJcblxyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgICAgYFJlbGFjacOzbiBhY3R1YWxpemFkYTogRG9jRGVzdGlubz0ke2RvY0lkfSBhc2lnbmFkbyBhIFRpcG9SZWxhY2lvbj0ke3RpcG9SZWxhY2lvbn0sIFJlbGFjaW9uSWQ9JHtyZWxhY2lvbklkfWBcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgICAgIGBFcnJvciBhbCBwcm9jZXNhciByZWxhY2nDs24gcGFyYSBkb2N1bWVudG8gJHtpZERvY3VtZW50b306YCxcclxuICAgICAgICAgICAgICAgIGVycm9yXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICB0aHJvdyBlcnJvcjsgLy8gUmUtbGFuemFyIGVsIGVycm9yIHBhcmEgaGFjZXIgcm9sbGJhY2sgZGUgdG9kYSBsYSB0cmFuc2FjY2nDs25cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICAgLy8gUEFTTyAxMjogU0VMRUNUIC0gVmVyaWZpY2FyIHNpIGxhIGd1w61hIGVzIGh1w6lyZmFuYVxyXG4gICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICBjb25zdCB2ZXJpZmljYXJFc0h1ZXJmYW5vU3FsID0gYFxyXG4gICAgICAgICAgICBTRUxFQ1QgQ09VTlQoMSkgQVMgVG90YWxcclxuICAgICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRvY1JlbGFjaW9uRG9jdW1lbnRvIFJcclxuICAgICAgICAgICAgV0hFUkUgUi5Eb2NPcmlnZW4gPSA6aWREb2N1bWVudG9cclxuICAgICAgICAgICAgICBBTkQgUi5Eb2NEZXN0aW5vIElTIE5VTExcclxuICAgICAgICAgICAgICBBTkQgUi5UaXBvUmVsYWNpb24gPSAnTUFEUkUnXHJcbiAgICAgICAgICAgICAgQU5EIFIuQWN0aXZvID0gJ1MnXHJcbiAgICAgICAgICBgO1xyXG5cclxuICAgICAgICAgIGNvbnN0IFtlc2NhcGVkSHVlcmZhbm9RdWVyeSwgZXNjYXBlZEh1ZXJmYW5vUGFyYW1zXSA9XHJcbiAgICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgICAgIHZlcmlmaWNhckVzSHVlcmZhbm9TcWwsXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWREb2N1bWVudG86IGlkRG9jdW1lbnRvLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBjb25zdCBodWVyZmFub1Jvd3MgPSBhd2FpdCBxdWVyeVJ1bm5lci5xdWVyeShcclxuICAgICAgICAgICAgZXNjYXBlZEh1ZXJmYW5vUXVlcnksXHJcbiAgICAgICAgICAgIGVzY2FwZWRIdWVyZmFub1BhcmFtc1xyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBsZXQgZXNIdWVyZmFubyA9IGZhbHNlO1xyXG4gICAgICAgICAgaWYgKGh1ZXJmYW5vUm93cyAmJiBodWVyZmFub1Jvd3MubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBjb25zdCByb3cgPSBodWVyZmFub1Jvd3NbMF07XHJcbiAgICAgICAgICAgIGNvbnN0IHRvdGFsID0gcm93LlRPVEFMIHx8IHJvdy50b3RhbCB8fCByb3cuVG90YWwgfHwgMDtcclxuICAgICAgICAgICAgZXNIdWVyZmFubyA9IE51bWJlcih0b3RhbCkgPiAwO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGNvbnNvbGUubG9nKGBEb2N1bWVudG8gJHtpZERvY3VtZW50b306IEVzIGh1w6lyZmFubyA9ICR7ZXNIdWVyZmFub31gKTtcclxuXHJcbiAgICAgICAgICBpZiAoZXNIdWVyZmFubykge1xyXG4gICAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgICAgLy8gUEFTTyAxMzogU0VMRUNUIC0gT2J0ZW5lciBlbCBzaWd1aWVudGUgSUQgZGUgZXN0YWRvIFwiSFwiXHJcbiAgICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICAgICBjb25zdCBjYWxjdWxhck1heElkRXN0YWRvSFNxbCA9IGBcclxuICAgICAgICAgICAgICBTRUxFQ1QgTUFYKElkKSBBUyBNYXhJZFxyXG4gICAgICAgICAgICAgIEZST00gRE9DVU1FTlRPUy5Eb2NFc3RhZG9zXHJcbiAgICAgICAgICAgICAgV0hFUkUgRG9jdW1lbnRvID0gOmlkRG9jdW1lbnRvXHJcbiAgICAgICAgICAgICAgICBBTkQgVGlwb0RvY3VtZW50byA9IDp0aXBvRG9jVFxyXG4gICAgICAgICAgICAgICAgQU5EIFRpcG9Fc3RhZG8gPSAnSCdcclxuICAgICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IFtlc2NhcGVkTWF4SWRIUXVlcnksIGVzY2FwZWRNYXhJZEhQYXJhbXNdID1cclxuICAgICAgICAgICAgICBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICAgICAgICAgIGNhbGN1bGFyTWF4SWRFc3RhZG9IU3FsLFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICBpZERvY3VtZW50bzogaWREb2N1bWVudG8sXHJcbiAgICAgICAgICAgICAgICAgIHRpcG9Eb2NUOiB0aXBvRG9jVCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7fVxyXG4gICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBtYXhJZEhSb3dzID0gYXdhaXQgcXVlcnlSdW5uZXIucXVlcnkoXHJcbiAgICAgICAgICAgICAgZXNjYXBlZE1heElkSFF1ZXJ5LFxyXG4gICAgICAgICAgICAgIGVzY2FwZWRNYXhJZEhQYXJhbXNcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBuZXh0SWRFc3RhZG9IID0gMTtcclxuICAgICAgICAgICAgaWYgKG1heElkSFJvd3MgJiYgbWF4SWRIUm93cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgY29uc3Qgcm93ID0gbWF4SWRIUm93c1swXTtcclxuICAgICAgICAgICAgICBsZXQgbWF4SWRIID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgaWYgKHJvdy5NQVhJRCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBtYXhJZEggPSByb3cuTUFYSUQ7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChyb3cuTWF4SWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgbWF4SWRIID0gcm93Lk1heElkO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAocm93Lm1heGlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIG1heElkSCA9IHJvdy5tYXhpZDtcclxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5NQVhfSUQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgbWF4SWRIID0gcm93Lk1BWF9JRDtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGlmIChtYXhJZEggIT09IG51bGwgJiYgbWF4SWRIICE9PSB1bmRlZmluZWQgJiYgbWF4SWRIICE9PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBtYXhJZEhOdW1iZXIgPSBOdW1iZXIobWF4SWRIKTtcclxuICAgICAgICAgICAgICAgIGlmICghaXNOYU4obWF4SWRITnVtYmVyKSkge1xyXG4gICAgICAgICAgICAgICAgICBuZXh0SWRFc3RhZG9IID0gbWF4SWRITnVtYmVyICsgMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgIGBEb2N1bWVudG8gJHtpZERvY3VtZW50b306IFNpZ3VpZW50ZSBJZCBwYXJhIGVzdGFkbyBIIHNlcsOhICR7bmV4dElkRXN0YWRvSH1gXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgICAgLy8gUEFTTyAxNDogSU5TRVJUIC0gQ3JlYXIgZWwgZXN0YWRvIFwiSFwiIChIaWpvIHNpbiBtYWRyZSlcclxuICAgICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gICAgICAgICAgICBjb25zdCBmZWNoYUVzdGFkb0ggPSBuZXcgRGF0ZSgpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgaW5zZXJ0YXJFc3RhZG9IU3FsID0gYFxyXG4gICAgICAgICAgICAgIElOU0VSVCBJTlRPIERPQ1VNRU5UT1MuRG9jRXN0YWRvcyhcclxuICAgICAgICAgICAgICAgIERvY3VtZW50byxcclxuICAgICAgICAgICAgICAgIFRpcG9Eb2N1bWVudG8sXHJcbiAgICAgICAgICAgICAgICBUaXBvRXN0YWRvLFxyXG4gICAgICAgICAgICAgICAgSWQsXHJcbiAgICAgICAgICAgICAgICBGZWNoYSxcclxuICAgICAgICAgICAgICAgIE9ic2VydmFjaW9uLFxyXG4gICAgICAgICAgICAgICAgSWRVc3VhcmlvLFxyXG4gICAgICAgICAgICAgICAgQWN0aXZhLFxyXG4gICAgICAgICAgICAgICAgRmVjaGFBY3RpdmEsXHJcbiAgICAgICAgICAgICAgICBGZWNoYURlc2FjdGl2YVxyXG4gICAgICAgICAgICAgICkgVkFMVUVTIChcclxuICAgICAgICAgICAgICAgIDppZERvY3VtZW50byxcclxuICAgICAgICAgICAgICAgIDp0aXBvRG9jVCxcclxuICAgICAgICAgICAgICAgICdIJyxcclxuICAgICAgICAgICAgICAgIDpuZXh0SWRFc3RhZG9ILFxyXG4gICAgICAgICAgICAgICAgOmZlY2hhRXN0YWRvSCxcclxuICAgICAgICAgICAgICAgICdCTCBTSU4gTUFEUkUnLFxyXG4gICAgICAgICAgICAgICAgJ1thdXRvbWF0aWNvXScsXHJcbiAgICAgICAgICAgICAgICAnUycsXHJcbiAgICAgICAgICAgICAgICA6ZmVjaGFFc3RhZG9ILFxyXG4gICAgICAgICAgICAgICAgTlVMTFxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IFtlc2NhcGVkSW5zZXJ0SFF1ZXJ5LCBlc2NhcGVkSW5zZXJ0SFBhcmFtc10gPVxyXG4gICAgICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgICAgICAgaW5zZXJ0YXJFc3RhZG9IU3FsLFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICBpZERvY3VtZW50bzogaWREb2N1bWVudG8sXHJcbiAgICAgICAgICAgICAgICAgIHRpcG9Eb2NUOiB0aXBvRG9jVCxcclxuICAgICAgICAgICAgICAgICAgbmV4dElkRXN0YWRvSDogbmV4dElkRXN0YWRvSCxcclxuICAgICAgICAgICAgICAgICAgZmVjaGFFc3RhZG9IOiBmZWNoYUVzdGFkb0gsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgYXdhaXQgcXVlcnlSdW5uZXIucXVlcnkoZXNjYXBlZEluc2VydEhRdWVyeSwgZXNjYXBlZEluc2VydEhQYXJhbXMpO1xyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgYEVzdGFkbyBIIGluc2VydGFkbyBwYXJhIGRvY3VtZW50byAke2lkRG9jdW1lbnRvfSBjb24gSWQgJHtuZXh0SWRFc3RhZG9IfWBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgIC8vIFBBU08gMTU6IENlcnJhciBhY3RpdmlkYWRlcyB5IGNpY2xvcyBhYmllcnRvcyBkZWwgd29ya2Zsb3cgcGFyYSBsYSBndcOtYVxyXG4gICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gICAgICAgICAgbGV0IGVuY29udHJvQ2ljbG8gPSBmYWxzZTtcclxuICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgLy8gQnVzY2FyIGNpY2xvcyBhYmllcnRvcyBwYXJhIGVsIGRvY3VtZW50b1xyXG4gICAgICAgICAgICBjb25zdCBidXNjYXJDaWNsb3NBYmllcnRvc1NxbCA9IGBcclxuICAgICAgICAgICAgICBTRUxFQ1QgXHJcbiAgICAgICAgICAgICAgICBDaWNsZS5BY3Rpdml0eU5hbWUgQVMgQWN0aXZpdHlOYW1lLFxyXG4gICAgICAgICAgICAgICAgQ2ljbGUuSWQgQVMgQ2ljbGVJZFxyXG4gICAgICAgICAgICAgIEZST00gQ2ljbGUsIElucHV0RG9jdW1lbnRcclxuICAgICAgICAgICAgICBXSEVSRSBDaWNsZS5BcHBsaWNhdGlvbk5hbWUgPSAnV0ZEb2NUcmFuc3BvcnRlJ1xyXG4gICAgICAgICAgICAgICAgQU5EIENpY2xlLkFwcGxpY2F0aW9uTmFtZSA9IElucHV0RG9jdW1lbnQuQXBwbGljYXRpb25OYW1lXHJcbiAgICAgICAgICAgICAgICBBTkQgQ2ljbGUuQWN0aXZpdHlOYW1lID0gSW5wdXREb2N1bWVudC5BY3Rpdml0eU5hbWVcclxuICAgICAgICAgICAgICAgIEFORCBJbnB1dERvY3VtZW50LkNpY2xlSWQgPSBDaWNsZS5JZFxyXG4gICAgICAgICAgICAgICAgQU5EIENpY2xlLmlzT3BlbiA9ICdZJ1xyXG4gICAgICAgICAgICAgICAgQU5EIElucHV0RG9jdW1lbnQuQXBwbGljYXRpb25OYW1lID0gJ1dGRG9jVHJhbnNwb3J0ZSdcclxuICAgICAgICAgICAgICAgIEFORCBJbnB1dERvY3VtZW50Lk9iamVjdElkID0gOmlkRG9jdW1lbnRvXHJcbiAgICAgICAgICAgIGA7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBbZXNjYXBlZENpY2xvc1F1ZXJ5LCBlc2NhcGVkQ2ljbG9zUGFyYW1zXSA9XHJcbiAgICAgICAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICAgICAgICBidXNjYXJDaWNsb3NBYmllcnRvc1NxbCxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgaWREb2N1bWVudG86IGlkRG9jdW1lbnRvLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY2ljbG9zUm93cyA9IGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgICAgIGVzY2FwZWRDaWNsb3NRdWVyeSxcclxuICAgICAgICAgICAgICBlc2NhcGVkQ2ljbG9zUGFyYW1zXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ2ljbG9zIGFiaWVydG9zIGVuY29udHJhZG9zOiBcIiwgY2ljbG9zUm93cyk7XHJcbiAgICAgICAgICAgIGVuY29udHJvQ2ljbG8gPSBjaWNsb3NSb3dzICYmIGNpY2xvc1Jvd3MubGVuZ3RoID4gMDtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJlbmNvbnRyb0NpY2xvXCIsIGVuY29udHJvQ2ljbG8pO1xyXG4gICAgICAgICAgICBpZiAoZW5jb250cm9DaWNsbykge1xyXG4gICAgICAgICAgICAgIGNvbnN0IGNpY2xvUm93ID0gY2ljbG9zUm93c1swXTtcclxuICAgICAgICAgICAgICBsZXQgYWN0aXZpdHlOYW1lID0gY2ljbG9Sb3cuQWN0aXZpdHlOYW1lIHx8IGNpY2xvUm93LmFjdGl2aXR5bmFtZTtcclxuICAgICAgICAgICAgICBsZXQgY2ljbGVJZCA9XHJcbiAgICAgICAgICAgICAgICBjaWNsb1Jvdy5DaWNsZUlkIHx8IGNpY2xvUm93LmNpY2xlaWQgfHwgY2ljbG9Sb3cuQ0lDTEVJRDtcclxuXHJcbiAgICAgICAgICAgICAgLy8gTWllbnRyYXMgaGF5YSBhY3RpdmlkYWQsIGNlcnJhciBjaWNsbyB5IGJ1c2NhciBwYWRyZVxyXG4gICAgICAgICAgICAgIHdoaWxlIChhY3Rpdml0eU5hbWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIENlcnJhciBlbCBjaWNsbyAoVVBEQVRFIGlzT3BlbiA9ICdOJylcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNlcnJhckNpY2xvU3FsID0gYFxyXG4gICAgICAgICAgICAgICAgICBVUERBVEUgQ2ljbGVcclxuICAgICAgICAgICAgICAgICAgU0VUIGlzT3BlbiA9ICdOJ1xyXG4gICAgICAgICAgICAgICAgICBXSEVSRSBBcHBsaWNhdGlvbk5hbWUgPSAnV0ZEb2NUcmFuc3BvcnRlJ1xyXG4gICAgICAgICAgICAgICAgICAgIEFORCBBY3Rpdml0eU5hbWUgPSA6YWN0aXZpdHlOYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgQU5EIElkID0gOmNpY2xlSWRcclxuICAgICAgICAgICAgICAgIGA7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgW2VzY2FwZWRDZXJyYXJRdWVyeSwgZXNjYXBlZENlcnJhclBhcmFtc10gPVxyXG4gICAgICAgICAgICAgICAgICBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICAgICAgICAgICAgICBjZXJyYXJDaWNsb1NxbCxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBhY3Rpdml0eU5hbWU6IGFjdGl2aXR5TmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgIGNpY2xlSWQ6IGNpY2xlSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7fVxyXG4gICAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgICAgICAgICBlc2NhcGVkQ2VycmFyUXVlcnksXHJcbiAgICAgICAgICAgICAgICAgIGVzY2FwZWRDZXJyYXJQYXJhbXNcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICAgIGBDaWNsbyBjZXJyYWRvIHBhcmEgZG9jdW1lbnRvICR7aWREb2N1bWVudG99OiBBY3Rpdml0eU5hbWU9JHthY3Rpdml0eU5hbWV9LCBDaWNsZUlkPSR7Y2ljbGVJZH1gXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEJ1c2NhciBjaWNsbyBwYWRyZSAoc2kgZXhpc3RlKVxyXG4gICAgICAgICAgICAgICAgY29uc3QgYnVzY2FyUGFkcmVTcWwgPSBgXHJcbiAgICAgICAgICAgICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgICAgICAgICAgICBDaWNsZS5QYXJlbnRBY3Rpdml0eSBBUyBQYXJlbnRBY3Rpdml0eSxcclxuICAgICAgICAgICAgICAgICAgICBDaWNsZS5QYXJlbnRDaWNsZSBBUyBQYXJlbnRDaWNsZVxyXG4gICAgICAgICAgICAgICAgICBGUk9NIENpY2xlXHJcbiAgICAgICAgICAgICAgICAgIFdIRVJFIEFwcGxpY2F0aW9uTmFtZSA9ICdXRkRvY1RyYW5zcG9ydGUnXHJcbiAgICAgICAgICAgICAgICAgICAgQU5EIEFjdGl2aXR5TmFtZSA9IDphY3Rpdml0eU5hbWVcclxuICAgICAgICAgICAgICAgICAgICBBTkQgSWQgPSA6Y2ljbGVJZFxyXG4gICAgICAgICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBbZXNjYXBlZFBhZHJlUXVlcnksIGVzY2FwZWRQYWRyZVBhcmFtc10gPVxyXG4gICAgICAgICAgICAgICAgICBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICAgICAgICAgICAgICBidXNjYXJQYWRyZVNxbCxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBhY3Rpdml0eU5hbWU6IGFjdGl2aXR5TmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgIGNpY2xlSWQ6IGNpY2xlSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7fVxyXG4gICAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhZHJlUm93cyA9IGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgICAgICAgICBlc2NhcGVkUGFkcmVRdWVyeSxcclxuICAgICAgICAgICAgICAgICAgZXNjYXBlZFBhZHJlUGFyYW1zXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChwYWRyZVJvd3MgJiYgcGFkcmVSb3dzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgY29uc3QgcGFkcmVSb3cgPSBwYWRyZVJvd3NbMF07XHJcbiAgICAgICAgICAgICAgICAgIGFjdGl2aXR5TmFtZSA9XHJcbiAgICAgICAgICAgICAgICAgICAgcGFkcmVSb3cuUGFyZW50QWN0aXZpdHkgfHxcclxuICAgICAgICAgICAgICAgICAgICBwYWRyZVJvdy5wYXJlbnRhY3Rpdml0eSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIHBhZHJlUm93LlBBUkVOVEFDVElWSVRZIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgbnVsbDtcclxuICAgICAgICAgICAgICAgICAgY2ljbGVJZCA9XHJcbiAgICAgICAgICAgICAgICAgICAgcGFkcmVSb3cuUGFyZW50Q2ljbGUgfHxcclxuICAgICAgICAgICAgICAgICAgICBwYWRyZVJvdy5wYXJlbnRjaWNsZSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIHBhZHJlUm93LlBBUkVOVENJQ0xFIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgbnVsbDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGFjdGl2aXR5TmFtZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IHdoaWxlIChlbmNvbnRyb0NpY2xvKTtcclxuICAgICAgICAgIC8qKiBmaW4gZGVudHJvIGRlbCBmb3IgKi9cclxuICAgICAgICB9IC8vIEZpbiBkZWwgZm9yIGRlIGRvY3VtZW50b3NcclxuICAgICAgICAvKiovXHJcbiAgICAgICAgLy8gRmluIGRlIENvbnNvbGlkYWNpw7NuIGRlIGd1w61hc1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgYERvY3VtZW50b3MgdsOhbGlkb3MgcGFyYSBjb25zb2xpZGFyOiAke2RvY3VtZW50b3NQYXJhQ29uc29saWRhci5sZW5ndGh9IGRlICR7aWRzRG9jdW1lbnRvc1JlbGFjaW9uYWRvcy5sZW5ndGh9YFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgLy8gUEFTTyAxNjogRWplY3V0YXIgcHJvY2VzbyBiYXRjaCBwYXJhIG1hbmlmaWVzdG9zIGHDqXJlb3MgeSBjb3VyaWVyXHJcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgaWYgKHRpcG9Eb2N1bWVudG8gPT09IFwiTUZUT0NcIikge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgY29uc29saWRhY2lvbkJhdGNoU3FsID0gYFxyXG4gICAgICAgICAgICAgIEJFR0lOXHJcbiAgICAgICAgICAgICAgICBET0NVTUVOVE9TLlBLX0NPVVJJRVJTX0ZJU0NBTElaQUNJT04uUFJfQ09VUklFUlNfQkxGSVNDQUxJWkFDSU9ORVMoOmlkTWFuaWZpZXN0byk7XHJcbiAgICAgICAgICAgICAgRU5EO1xyXG4gICAgICAgICAgICBgO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgW2VzY2FwZWRCYXRjaFF1ZXJ5LCBlc2NhcGVkQmF0Y2hQYXJhbXNdID1cclxuICAgICAgICAgICAgICBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICAgICAgICAgIGNvbnNvbGlkYWNpb25CYXRjaFNxbCxcclxuICAgICAgICAgICAgICAgIHsgaWRNYW5pZmllc3RvOiBkb2N1bWVudG9JZCB9LFxyXG4gICAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgYXdhaXQgcXVlcnlSdW5uZXIucXVlcnkoZXNjYXBlZEJhdGNoUXVlcnksIGVzY2FwZWRCYXRjaFBhcmFtcyk7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICBgW1BBU08gMTZdIFByb2Nlc28gYmF0Y2ggZGUgY29uc29saWRhY2nDs24gZWplY3V0YWRvIHBhcmEgbWFuaWZpZXN0byAke2RvY3VtZW50b0lkfWBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGJhdGNoRXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgICBgW1BBU08gMTZdIEVycm9yIGFsIGVqZWN1dGFyIHByb2Nlc28gYmF0Y2ggcGFyYSBtYW5pZmllc3RvICR7ZG9jdW1lbnRvSWR9OmAsXHJcbiAgICAgICAgICAgICAgYmF0Y2hFcnJvclxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAvLyBNYW50ZW5lciBlbCBjb21wb3J0YW1pZW50byBkZWwgY8OzZGlnbyBsZWdhZG86IHJlZ2lzdHJhciBlbCBlcnJvciB5IGNvbnRpbnVhclxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgYFtQQVNPIDE2XSBUaXBvIGRlIGRvY3VtZW50byAke3RpcG9Eb2N1bWVudG99IG5vIHJlcXVpZXJlIHByb2Nlc28gYmF0Y2hgXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAvLyBQQVNPIDE3OiBDYW1iaWFyIGVzdGFkbyBkZWwgbWFuaWZpZXN0byBkZSBcIkFjZXB0YWRvXCIgYSBcIkNvbmZvcm1hZG9cIlxyXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgIGlmICh0aXBvRG9jdW1lbnRvID09PSBcIk1GVE9DXCIpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICBgW1BBU08gMTddIEluaWNpYW5kbyBjYW1iaW8gZGUgZXN0YWRvIGEgQ01QIHBhcmEgbWFuaWZpZXN0byAke2RvY3VtZW50b0lkfWBcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgY29uc3QgY2FsY3VsYXJNYXhJZE1hbmlmZXN0b1NxbCA9IGBcclxuICAgICAgICAgICAgU0VMRUNUIE1BWChJZCkgQVMgTWF4SWRcclxuICAgICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRvY0VzdGFkb3NcclxuICAgICAgICAgICAgV0hFUkUgRG9jdW1lbnRvID0gOmlkRG9jdW1lbnRvXHJcbiAgICAgICAgICAgICAgQU5EIFRpcG9Eb2N1bWVudG8gPSA6dGlwb0RvY3VtZW50b1xyXG4gICAgICAgICAgICAgIEFORCBUaXBvRXN0YWRvID0gJ0NNUCdcclxuICAgICAgICAgIGA7XHJcblxyXG4gICAgICAgICAgY29uc3QgW2VzY2FwZWRNYXhJZE1hbmlmZXN0b1F1ZXJ5LCBlc2NhcGVkTWF4SWRNYW5pZmVzdG9QYXJhbXNdID1cclxuICAgICAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICAgICAgY2FsY3VsYXJNYXhJZE1hbmlmZXN0b1NxbCxcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZERvY3VtZW50bzogZG9jdW1lbnRvSWQsXHJcbiAgICAgICAgICAgICAgICB0aXBvRG9jdW1lbnRvOiBcIk1GVE9DXCIsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB7fVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIGNvbnN0IG1heElkTWFuaWZlc3RvUm93cyA9IGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgICBlc2NhcGVkTWF4SWRNYW5pZmVzdG9RdWVyeSxcclxuICAgICAgICAgICAgZXNjYXBlZE1heElkTWFuaWZlc3RvUGFyYW1zXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIGxldCBuZXh0SWRFc3RhZG9NYW5pZmllc3RvID0gMTtcclxuXHJcbiAgICAgICAgICBpZiAobWF4SWRNYW5pZmVzdG9Sb3dzICYmIG1heElkTWFuaWZlc3RvUm93cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJvdyA9IG1heElkTWFuaWZlc3RvUm93c1swXTtcclxuICAgICAgICAgICAgbGV0IG1heElkID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmIChyb3cuTUFYSUQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIG1heElkID0gcm93Lk1BWElEO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5NYXhJZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgbWF4SWQgPSByb3cuTWF4SWQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocm93Lm1heGlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICBtYXhJZCA9IHJvdy5tYXhpZDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChyb3cuTUFYX0lEICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICBtYXhJZCA9IHJvdy5NQVhfSUQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChtYXhJZCAhPT0gbnVsbCAmJiBtYXhJZCAhPT0gdW5kZWZpbmVkICYmIG1heElkICE9PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgbWF4SWROdW1iZXIgPSBOdW1iZXIobWF4SWQpO1xyXG4gICAgICAgICAgICAgIGlmICghaXNOYU4obWF4SWROdW1iZXIpKSB7XHJcbiAgICAgICAgICAgICAgICBuZXh0SWRFc3RhZG9NYW5pZmllc3RvID0gbWF4SWROdW1iZXIgKyAxO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICBgW1BBU08gMTddIE1hbmlmaWVzdG8gJHtkb2N1bWVudG9JZH06IHNpZ3VpZW50ZSBJZCBwYXJhIGVzdGFkbyBDTVAgc2Vyw6EgJHtuZXh0SWRFc3RhZG9NYW5pZmllc3RvfWBcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgY29uc3QgZmVjaGFFc3RhZG9NYW5pZmllc3RvID0gbmV3IERhdGUoKTtcclxuXHJcbiAgICAgICAgICBjb25zdCBpbnNlcnRhckVzdGFkb01hbmlmZXN0b1NxbCA9IGBcclxuICAgICAgICAgICAgSU5TRVJUIElOVE8gRE9DVU1FTlRPUy5Eb2NFc3RhZG9zKFxyXG4gICAgICAgICAgICAgIERvY3VtZW50byxcclxuICAgICAgICAgICAgICBUaXBvRG9jdW1lbnRvLFxyXG4gICAgICAgICAgICAgIFRpcG9Fc3RhZG8sXHJcbiAgICAgICAgICAgICAgSWQsXHJcbiAgICAgICAgICAgICAgRmVjaGEsXHJcbiAgICAgICAgICAgICAgT2JzZXJ2YWNpb24sXHJcbiAgICAgICAgICAgICAgSWRVc3VhcmlvLFxyXG4gICAgICAgICAgICAgIEFjdGl2YSxcclxuICAgICAgICAgICAgICBGZWNoYUFjdGl2YSxcclxuICAgICAgICAgICAgICBGZWNoYURlc2FjdGl2YVxyXG4gICAgICAgICAgICApIFZBTFVFUyAoXHJcbiAgICAgICAgICAgICAgOmlkRG9jdW1lbnRvLFxyXG4gICAgICAgICAgICAgIDp0aXBvRG9jdW1lbnRvLFxyXG4gICAgICAgICAgICAgICdDTVAnLFxyXG4gICAgICAgICAgICAgIDpuZXh0SWRFc3RhZG8sXHJcbiAgICAgICAgICAgICAgOmZlY2hhRXN0YWRvLFxyXG4gICAgICAgICAgICAgICdNQU5JRklFU1RPIENPTkZPUk1BRE8gQVVUT01BVElDQU1FTlRFIFBPUiBJU0lET1JBJyxcclxuICAgICAgICAgICAgICAnW2F1dG9tYXRpY29dJyxcclxuICAgICAgICAgICAgICAnUycsXHJcbiAgICAgICAgICAgICAgOmZlY2hhRXN0YWRvLFxyXG4gICAgICAgICAgICAgIDpmZWNoYUVzdGFkb1xyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICBgO1xyXG5cclxuICAgICAgICAgIGNvbnN0IFtlc2NhcGVkSW5zZXJ0TWFuaWZlc3RvUXVlcnksIGVzY2FwZWRJbnNlcnRNYW5pZmVzdG9QYXJhbXNdID1cclxuICAgICAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICAgICAgaW5zZXJ0YXJFc3RhZG9NYW5pZmVzdG9TcWwsXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWREb2N1bWVudG86IGRvY3VtZW50b0lkLFxyXG4gICAgICAgICAgICAgICAgdGlwb0RvY3VtZW50bzogXCJNRlRPQ1wiLFxyXG4gICAgICAgICAgICAgICAgbmV4dElkRXN0YWRvOiBuZXh0SWRFc3RhZG9NYW5pZmllc3RvLFxyXG4gICAgICAgICAgICAgICAgZmVjaGFFc3RhZG86IGZlY2hhRXN0YWRvTWFuaWZpZXN0byxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHt9XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgYXdhaXQgcXVlcnlSdW5uZXIucXVlcnkoXHJcbiAgICAgICAgICAgIGVzY2FwZWRJbnNlcnRNYW5pZmVzdG9RdWVyeSxcclxuICAgICAgICAgICAgZXNjYXBlZEluc2VydE1hbmlmZXN0b1BhcmFtc1xyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgYFtQQVNPIDE3XSBNYW5pZmllc3RvICR7ZG9jdW1lbnRvSWR9IGFjdHVhbGl6YWRvIGEgZXN0YWRvIENNUGBcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICBgW1BBU08gMTddIFRpcG8gZGUgZG9jdW1lbnRvICR7dGlwb0RvY3VtZW50b30gbm8gcmVxdWllcmUgY2FtYmlvIGRlIGVzdGFkbyBhIENNUGBcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgIC8vIFBBU08gMTg6IENvbnN1bHRhciBudWV2YW1lbnRlIGVsIGVzdGFkbyBkZWwgbWFuaWZpZXN0byB5IHJldG9ybmFybG9cclxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICBjb25zdCBwYXNvMThQYXJhbXM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xyXG4gICAgICAgICAgcF9pZF9kb2N1bWVudG86IGRvY3VtZW50b0lkLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IFtlc2NhcGVkUGFzbzE4UXVlcnksIGVzY2FwZWRQYXNvMThQYXJhbXNdID1cclxuICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKHBhc28wU3FsLCBwYXNvMThQYXJhbXMsIHt9KTtcclxuXHJcbiAgICAgICAgY29uc3QgcGFzbzE4Um93cyA9IGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgZXNjYXBlZFBhc28xOFF1ZXJ5LFxyXG4gICAgICAgICAgZXNjYXBlZFBhc28xOFBhcmFtc1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGxldCBlc3RhZG9GaW5hbE1hbmlmaWVzdG86IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gICAgICAgIGxldCB0aXBvRXN0YWRvRmluYWxNYW5pZmllc3RvOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICAgICAgICBsZXQgdGlwb0RvY3VtZW50b0ZpbmFsOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgICAgICAgaWYgKHBhc28xOFJvd3MgJiYgcGFzbzE4Um93cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICBjb25zdCBmaW5hbEluZm8gPSBwYXNvMThSb3dzWzBdO1xyXG4gICAgICAgICAgZXN0YWRvRmluYWxNYW5pZmllc3RvID0gZmluYWxJbmZvPy5FU1RBRE8gfHwgZmluYWxJbmZvPy5lc3RhZG8gfHwgbnVsbDtcclxuICAgICAgICAgIHRpcG9Fc3RhZG9GaW5hbE1hbmlmaWVzdG8gPVxyXG4gICAgICAgICAgICBmaW5hbEluZm8/LlRJUE9fRVNUQURPIHx8IGZpbmFsSW5mbz8udGlwb19lc3RhZG8gfHwgbnVsbDtcclxuICAgICAgICAgIHRpcG9Eb2N1bWVudG9GaW5hbCA9XHJcbiAgICAgICAgICAgIGZpbmFsSW5mbz8uVElQT0RPQ1VNRU5UTyB8fCBmaW5hbEluZm8/LnRpcG9kb2N1bWVudG8gfHwgbnVsbDtcclxuXHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgYFtQQVNPIDE4XSBFc3RhZG8gZmluYWwgZGVsIG1hbmlmaWVzdG8gJHtkb2N1bWVudG9JZH06ICR7ZXN0YWRvRmluYWxNYW5pZmllc3RvfSAoJHt0aXBvRXN0YWRvRmluYWxNYW5pZmllc3RvfSlgXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zb2xlLndhcm4oXHJcbiAgICAgICAgICAgIGBbUEFTTyAxOF0gTm8gc2UgcHVkbyBvYnRlbmVyIGVsIGVzdGFkbyBmaW5hbCBkZWwgbWFuaWZpZXN0byAke2RvY3VtZW50b0lkfWBcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8qKiAqL1xyXG4gICAgICAgIC8vIENvbW1pdCBkZSBsYSB0cmFuc2FjY2nDs24gc2kgdG9kbyBzYWxpw7MgYmllblxyXG4gICAgICAgIGF3YWl0IHF1ZXJ5UnVubmVyLmNvbW1pdFRyYW5zYWN0aW9uKCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJUcmFuc2FjY2nDs24gZGUgY29uc29saWRhY2nDs24gY29uZmlybWFkYSBleGl0b3NhbWVudGVcIik7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHtcclxuICAgICAgICAgIGRvY3VtZW50b0lkLFxyXG4gICAgICAgICAgZXN0YUFudWxhZG86IGZhbHNlLFxyXG4gICAgICAgICAgZXN0YWRvTWFuaWZpZXN0bzogZXN0YWRvRmluYWxNYW5pZmllc3RvLFxyXG4gICAgICAgICAgdGlwb0VzdGFkb01hbmlmaWVzdG86IHRpcG9Fc3RhZG9GaW5hbE1hbmlmaWVzdG8sXHJcbiAgICAgICAgICB0aXBvRG9jdW1lbnRvOiB0aXBvRG9jdW1lbnRvRmluYWwgfHwgdGlwb0RvY3VtZW50byB8fCBudWxsLFxyXG4gICAgICAgICAgbWVzc2FnZTogXCJNYW5pZmVzdCBjbG9zZWRcIixcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gUmVzcG9uc2VVdGlsLnN1Y2Nlc3MocmVzdWx0LCBcIk1hbmlmZXN0IGNsb3NlZFwiKTtcclxuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICAgIC8vIFJvbGxiYWNrIGRlIGxhIHRyYW5zYWNjacOzbiBlbiBjYXNvIGRlIGVycm9yXHJcbiAgICAgICAgYXdhaXQgcXVlcnlSdW5uZXIucm9sbGJhY2tUcmFuc2FjdGlvbigpO1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgICBcIkVycm9yIGVuIHByb2Nlc28gZGUgY29uc29saWRhY2nDs24uIFRyYW5zYWNjacOzbiByZXZlcnRpZGE6XCIsXHJcbiAgICAgICAgICBlcnJvclxyXG4gICAgICAgICk7XHJcbiAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgLy8gTGliZXJhciBlbCBRdWVyeVJ1bm5lclxyXG4gICAgICAgIGF3YWl0IHF1ZXJ5UnVubmVyLnJlbGVhc2UoKTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICB0aHJvdyBSZXNwb25zZVV0aWwuaW50ZXJuYWxFcnJvcihlcnJvcik7XHJcbiAgICB9XHJcbiAgfVxyXG4gIFxyXG4gIGFzeW5jIGNsb3NlTWFuaWZlc3RTUVMocGF5bG9hZDogQ2xvc2VNYW5pZmVzdER0bywgcmVxdWVzdD86IFJlcXVlc3RJbnRlcmZhY2UpIHtcclxuICAgIC8qXHJcbiAgICAgKiBQUk9DRVNPIEFTw41OQ1JPTk8gREUgQ0lFUlJFIERFIE1BTklGSUVTVE86XHJcbiAgICAgKiBcclxuICAgICAqIEVzdGUgbcOpdG9kbyBlbnbDrWEgZWwgcHJvY2VzbyBkZSBjaWVycmUgZGUgbWFuaWZpZXN0byBkaXJlY3RhbWVudGUgYSBTUVMuXHJcbiAgICAgKiBFbCBzZXJ2aWNpbyBtYXJjb3MvbWluaW1pc19wd2ViX3BvbGxpbmdfcHJvY2VzcyBjb25zdW1pcsOhIGVsIG1lbnNhamUgeSBsbyBwcm9jZXNhcsOhLlxyXG4gICAgICogXHJcbiAgICAgKiBFbCBwb2xsaW5nIHByb2Nlc3MgYWN0dWFsaXphcsOhIGVsIGVzdGFkbyBlbiBEeW5hbW9EQiB1c2FuZG8gZWwgcmVxdWVzdElkLlxyXG4gICAgICovXHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCB7IGRvY3VtZW50b0lkIH0gPSBwYXlsb2FkO1xyXG4gICAgICBcclxuICAgICAgLy8gT2J0ZW5lciB1c2VySWQgZGVsIHJlcXVlc3Qgc2kgZXN0w6EgZGlzcG9uaWJsZVxyXG4gICAgICBsZXQgdXNlcklkOiBzdHJpbmcgfCB1bmRlZmluZWQ7XHJcbiAgICAgIGlmIChyZXF1ZXN0Py51c2VyKSB7XHJcbiAgICAgICAgY29uc3QgeyBzdWIgfSA9IHJlcXVlc3QudXNlcjtcclxuICAgICAgICB1c2VySWQgPSBzdWI/LnNwbGl0KCdfJykucG9wKCkgfHwgdW5kZWZpbmVkO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBFbnZpYXIgbWVuc2FqZSBkaXJlY3RhbWVudGUgYSBTUVMgdXNhbmRvIE1hbmlmZXN0U1FTU2VydmljZVxyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLm1hbmlmZXN0U1FTU2VydmljZS5zZW5kTWFuaWZlc3RDbG9zZU1lc3NhZ2UoXHJcbiAgICAgICAgZG9jdW1lbnRvSWQsXHJcbiAgICAgICAgdXNlcklkLFxyXG4gICAgICAgIDIgLy8gZGVsYXlTZWNvbmRzIHBvciBkZWZlY3RvXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBpZiAoIXJlc3VsdC5zdWNjZXNzKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEh0dHBFeGNlcHRpb24oXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdFcnJvciBhbCBlbnZpYXIgbWVuc2FqZSBhIFNRUycsXHJcbiAgICAgICAgICAgIGVycm9yOiByZXN1bHQuZXJyb3IsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgSHR0cFN0YXR1cy5JTlRFUk5BTF9TRVJWRVJfRVJST1JcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBSZXRvcm5hciBpbmZvcm1hY2nDs24gY29uIGVsIHJlcXVlc3RJZCBwYXJhIHF1ZSBlbCBjbGllbnRlIHB1ZWRhIGNvbnN1bHRhciBlbCBlc3RhZG9cclxuICAgICAgcmV0dXJuIFJlc3BvbnNlVXRpbC5zdWNjZXNzKFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGRvY3VtZW50b0lkLFxyXG4gICAgICAgICAgcmVxdWVzdElkOiByZXN1bHQucmVxdWVzdElkLFxyXG4gICAgICAgICAgbWVzc2FnZUlkOiByZXN1bHQubWVzc2FnZUlkLFxyXG4gICAgICAgICAgc3RhdHVzOiAncGVuZGluZycsXHJcbiAgICAgICAgICBtZXNzYWdlOiAnUHJvY2VzbyBkZSBjaWVycmUgZGUgbWFuaWZpZXN0byBlbnZpYWRvIGEgbGEgY29sYSBTUVMuIEVsIHBvbGxpbmcgcHJvY2VzcyBsbyBwcm9jZXNhcsOhIGFzw61uY3JvbmFtZW50ZS4nLFxyXG4gICAgICAgICAgbm90ZTogYFVzYSBlbCByZXF1ZXN0SWQgKCR7cmVzdWx0LnJlcXVlc3RJZH0pIHBhcmEgY29uc3VsdGFyIGVsIGVzdGFkbyBkZWwgcHJvY2VzbyBlbiBEeW5hbW9EQiBjdWFuZG8gZWwgcG9sbGluZyBwcm9jZXNzIGxvIHByb2Nlc2UuYCxcclxuICAgICAgICB9LFxyXG4gICAgICAgICdDaWVycmUgZGUgbWFuaWZpZXN0byBlbnZpYWRvIGEgU1FTIHBhcmEgcHJvY2VzYW1pZW50byBhc8OtbmNyb25vJ1xyXG4gICAgICApO1xyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBIdHRwRXhjZXB0aW9uKSB7XHJcbiAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgIH1cclxuICAgICAgdGhyb3cgUmVzcG9uc2VVdGlsLmludGVybmFsRXJyb3IoZXJyb3IpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3VsdGEgZWwgZXN0YWRvIGRlbCBwcm9jZXNvIGRlIGNpZXJyZSBkZSBtYW5pZmllc3RvIHBvciByZXF1ZXN0SWRcclxuICAgKiBcclxuICAgKiBDb25zdWx0YSBlbCBlc3RhZG8gZGVzZGUgRHluYW1vREIgZG9uZGUgZWwgcG9sbGluZyBwcm9jZXNzIGxvIGFjdHVhbGl6YS5cclxuICAgKiBTaSBubyBlbmN1ZW50cmEgZW4gRHluYW1vREIsIGludGVudGEgY29uc3VsdGFyIEFQSSBHYXRld2F5IGNvbW8gZmFsbGJhY2tcclxuICAgKiAocGFyYSBjb21wYXRpYmlsaWRhZCBjb24gcHJvY2Vzb3MgYW50aWd1b3MpLlxyXG4gICAqIFxyXG4gICAqIEBwYXJhbSByZXF1ZXN0SWQgLSBJZGVudGlmaWNhZG9yIMO6bmljbyBkZWwgcHJvY2VzbyAoVVVJRClcclxuICAgKi9cclxuICBhc3luYyBnZXRNYW5pZmVzdENsb3NlU3RhdHVzKHJlcXVlc3RJZDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIENvbnN1bHRhciBEeW5hbW9EQiAobcOpdG9kbyBwcmluY2lwYWwpXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3Qgc3RhdHVzUmVjb3JkID0gYXdhaXQgdGhpcy5leHBvcnRTdGF0dXNTZXJ2aWNlLmdldFN0YXR1cyhyZXF1ZXN0SWQpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChzdGF0dXNSZWNvcmQpIHtcclxuICAgICAgICAgIC8vIEV4dHJhZXIgZG9jdW1lbnRvSWQgZGVsIGZpbGVOYW1lIHNpIGVzdMOhIGRpc3BvbmlibGVcclxuICAgICAgICAgIC8vIEVsIGZpbGVOYW1lIHB1ZWRlIGNvbnRlbmVyOiBcIk1hbmlmZXN0IGNsb3NlZCBzdWNjZXNzZnVsbHkgLSBEb2N1bWVudG9JZDogMTIzXCJcclxuICAgICAgICAgIGxldCBkb2N1bWVudG9JZDogbnVtYmVyIHwgdW5kZWZpbmVkO1xyXG4gICAgICAgICAgaWYgKHN0YXR1c1JlY29yZC5maWxlTmFtZSkge1xyXG4gICAgICAgICAgICBjb25zdCBtYXRjaCA9IHN0YXR1c1JlY29yZC5maWxlTmFtZS5tYXRjaCgvRG9jdW1lbnRvSWQ6XFxzKihcXGQrKS9pKTtcclxuICAgICAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgZG9jdW1lbnRvSWQgPSBwYXJzZUludChtYXRjaFsxXSwgMTApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmV0dXJuIFJlc3BvbnNlVXRpbC5zdWNjZXNzKFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgcmVxdWVzdElkOiBzdGF0dXNSZWNvcmQucmVxdWVzdElkLFxyXG4gICAgICAgICAgICAgIGRvY3VtZW50b0lkOiBkb2N1bWVudG9JZCxcclxuICAgICAgICAgICAgICBzdGF0dXM6IHN0YXR1c1JlY29yZC5zdGF0dXMsXHJcbiAgICAgICAgICAgICAgY3JlYXRlZEF0OiBzdGF0dXNSZWNvcmQuY3JlYXRlZEF0LFxyXG4gICAgICAgICAgICAgIHVwZGF0ZWRBdDogc3RhdHVzUmVjb3JkLnVwZGF0ZWRBdCxcclxuICAgICAgICAgICAgICBzaWduZWRVcmw6IHN0YXR1c1JlY29yZC5zaWduZWRVcmwsXHJcbiAgICAgICAgICAgICAgZmlsZU5hbWU6IHN0YXR1c1JlY29yZC5maWxlTmFtZSxcclxuICAgICAgICAgICAgICBlcnJvcjogc3RhdHVzUmVjb3JkLmVycm9yLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAnRXN0YWRvIGRlbCBwcm9jZXNvIGRlIGNpZXJyZSBkZSBtYW5pZmllc3RvJ1xyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKGR5bmFtb0Vycm9yOiBhbnkpIHtcclxuICAgICAgICAvLyBTaSBEeW5hbW9EQiBubyBlc3TDoSBjb25maWd1cmFkbyBvIGhheSBlcnJvciwgaW50ZW50YXIgQVBJIEdhdGV3YXkgY29tbyBmYWxsYmFja1xyXG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKGBEeW5hbW9EQiBxdWVyeSBmYWlsZWQsIHRyeWluZyBBUEkgR2F0ZXdheSBmYWxsYmFjazogJHtkeW5hbW9FcnJvci5tZXNzYWdlfWApO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEh0dHBFeGNlcHRpb24pIHtcclxuICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgfVxyXG4gICAgICB0aHJvdyBSZXNwb25zZVV0aWwuaW50ZXJuYWxFcnJvcihlcnJvcik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxufVxyXG4iXX0=