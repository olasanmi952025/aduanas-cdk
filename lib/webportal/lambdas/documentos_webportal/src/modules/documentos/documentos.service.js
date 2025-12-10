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
                const estadoValue = String(filters.estado).toUpperCase().trim();
                // Si el estado es VISADO o VIS, filtrar por REVISADO = 'SI' en lugar del filtro de estados normal
                if (estadoValue === 'VISADO' || estadoValue === 'VIS') {
                    // Filtrar por documentos que tengan estado VIS activo (revisado = 'SI')
                    where.push("EXISTS (SELECT 1 FROM DOCUMENTOS.DOCESTADOS est WHERE est.tipodocumento = dd.tipodocumento AND est.documento = dd.id AND est.tipoestado = 'VIS' AND est.activa = 'S')");
                }
                else {
                    where.push("eo.TIPOESTADO = :estado");
                    params.estado = estadoValue;
                }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRvcy5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZG9jdW1lbnRvcy5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFBQSx5Q0FBOEM7QUFDOUMsdURBR2tDO0FBTWxDLDZDQUFtRDtBQUNuRCwwREFBc0Q7QUFPdEQsb0VBQWdFO0FBQ2hFLDJDQUFrRztBQVEzRixJQUFNLGdCQUFnQix3QkFBdEIsTUFBTSxnQkFBZ0I7SUFFM0IsWUFFRSx1QkFBc0UsRUFFdEUsdUJBQXNFLEVBRXRFLDJCQUE4RSxFQUM3RCxVQUFzQixFQUN0QixrQkFBc0MsRUFDdEMsbUJBQXdDLEVBQ3hDLGFBQTRCO1FBUjVCLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBOEI7UUFFckQsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUE4QjtRQUVyRCxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQWtDO1FBQzdELGVBQVUsR0FBVixVQUFVLENBQVk7UUFDdEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtRQUN0Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1FBQ3hDLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1FBWDlCLFdBQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxrQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQVl6RCxDQUFDO0lBRUo7Ozs7O09BS0c7SUFDSyxZQUFZLENBQUMsTUFBZSxFQUFFLFNBQTBCO1FBQzlELE1BQU0sWUFBWSxHQUEyQjtZQUMzQyxJQUFJLEVBQUUsSUFBSTtZQUNWLGVBQWUsRUFBRSxnQkFBZ0I7WUFDakMsMEJBQTBCLEVBQUUscUJBQXFCO1lBQ2pELFFBQVEsRUFBRSxRQUFRO1lBQ2xCLGdCQUFnQixFQUFFLGtCQUFrQjtZQUNwQyxRQUFRLEVBQUUsUUFBUTtZQUNsQixpQkFBaUIsRUFBRSxrQkFBa0I7WUFDckMsYUFBYSxFQUFFLGNBQWM7WUFDN0IsbUJBQW1CLEVBQUUsb0JBQW9CO1lBQ3pD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bnQiOlsiaW1wb3J0IHsgRG9jRG9jdW1lbnRvQmFzZSB9IGZyb20gXCIuL2VudGl0aWVzXCI7XHJcbmltcG9ydCB7XHJcbiAgRG9jTG9jYWNpb25Eb2N1bWVudG8sXHJcbiAgRG9jUGFydGljaXBhY2lvbixcclxufSBmcm9tIFwiLi4vZGljdGlvbmFyaWVzL2VudGl0aWVzXCI7XHJcbmltcG9ydCB7XHJcbiAgQnVzY2FyRG9jdW1lbnRvc0R0byxcclxuICBPYnRlbmVyRGV0YWxsZXNDb21wbGV0b3NEdG8sXHJcbiAgQ2xvc2VNYW5pZmVzdER0byxcclxufSBmcm9tIFwiLi9kdG8vZG9jdW1lbnRvcy5kdG9cIjtcclxuaW1wb3J0IHsgSW5qZWN0UmVwb3NpdG9yeSB9IGZyb20gXCJAbmVzdGpzL3R5cGVvcm1cIjtcclxuaW1wb3J0IHsgWG1sVXRpbCB9IGZyb20gXCIuLi8uLi9zaGFyZWQvdXRpbHMveG1sLnV0aWxcIjtcclxuaW1wb3J0IHtcclxuICBSZXBvc2l0b3J5LFxyXG4gIFNlbGVjdFF1ZXJ5QnVpbGRlcixcclxuICBEYXRhU291cmNlLFxyXG4gIFF1ZXJ5UnVubmVyLFxyXG59IGZyb20gXCJ0eXBlb3JtXCI7XHJcbmltcG9ydCB7IFJlc3BvbnNlVXRpbCB9IGZyb20gXCIuLi8uLi9zaGFyZWQvdXRpbHMvcmVzcG9uc2UudXRpbFwiO1xyXG5pbXBvcnQgeyBJbmplY3RhYmxlLCBOb3RGb3VuZEV4Y2VwdGlvbiwgSHR0cEV4Y2VwdGlvbiwgSHR0cFN0YXR1cywgTG9nZ2VyIH0gZnJvbSBcIkBuZXN0anMvY29tbW9uXCI7XHJcbmltcG9ydCB7IE1hbmlmZXN0U1FTU2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZpY2UvbWFuaWZlc3Qtc3FzLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBFeHBvcnRTdGF0dXNTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vc2VydmljZS9leHBvcnQtc3RhdHVzLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBDb25maWdTZXJ2aWNlIH0gZnJvbSAnQG5lc3Rqcy9jb25maWcnO1xyXG5pbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnO1xyXG5pbXBvcnQgeyBSZXF1ZXN0SW50ZXJmYWNlIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9yZXF1ZXN0LmludGVyZmFjZSc7XHJcblxyXG5ASW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBEb2N1bWVudHNTZXJ2aWNlIHtcclxuICBwcml2YXRlIHJlYWRvbmx5IGxvZ2dlciA9IG5ldyBMb2dnZXIoRG9jdW1lbnRzU2VydmljZS5uYW1lKTtcclxuICBjb25zdHJ1Y3RvcihcclxuICAgIEBJbmplY3RSZXBvc2l0b3J5KERvY0RvY3VtZW50b0Jhc2UpXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRvY3VtZW50b0Jhc2VSZXBvc2l0b3J5OiBSZXBvc2l0b3J5PERvY0RvY3VtZW50b0Jhc2U+LFxyXG4gICAgQEluamVjdFJlcG9zaXRvcnkoRG9jUGFydGljaXBhY2lvbilcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgcGFydGljaXBhY2lvblJlcG9zaXRvcnk6IFJlcG9zaXRvcnk8RG9jUGFydGljaXBhY2lvbj4sXHJcbiAgICBASW5qZWN0UmVwb3NpdG9yeShEb2NMb2NhY2lvbkRvY3VtZW50bylcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgbG9jYWNpb25Eb2N1bWVudG9SZXBvc2l0b3J5OiBSZXBvc2l0b3J5PERvY0xvY2FjaW9uRG9jdW1lbnRvPixcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZGF0YVNvdXJjZTogRGF0YVNvdXJjZSxcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgbWFuaWZlc3RTUVNTZXJ2aWNlOiBNYW5pZmVzdFNRU1NlcnZpY2UsXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV4cG9ydFN0YXR1c1NlcnZpY2U6IEV4cG9ydFN0YXR1c1NlcnZpY2UsXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNvbmZpZ1NlcnZpY2U6IENvbmZpZ1NlcnZpY2VcclxuICApIHt9XHJcblxyXG4gIC8qKlxyXG4gICAqIEJ1aWxkIE9SREVSIEJZIGNsYXVzZSBzYWZlbHkgYmFzZWQgb24gc29ydEJ5IGFuZCBzb3J0T3JkZXJcclxuICAgKiBAcGFyYW0gc29ydEJ5IC0gRmllbGQgbmFtZSBmcm9tIGZyb250ZW5kXHJcbiAgICogQHBhcmFtIHNvcnRPcmRlciAtIERpcmVjdGlvbiAoYXNjIG9yIGRlc2MpXHJcbiAgICogQHJldHVybnMgU2FmZSBTUUwgT1JERVIgQlkgY2xhdXNlXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBidWlsZE9yZGVyQnkoc29ydEJ5Pzogc3RyaW5nLCBzb3J0T3JkZXI/OiAnYXNjJyB8ICdkZXNjJyk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBzb3J0RmllbGRNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XHJcbiAgICAgICdpZCc6ICdJRCcsXHJcbiAgICAgICdudW1lcm9FeHRlcm5vJzogJ05VTUVST19FWFRFUk5PJyxcclxuICAgICAgJ251bWVyb1JlZmVyZW5jaWFPcmlnaW5hbCc6ICdOVU1FUk9fUkVGX09SSUdJTkFMJyxcclxuICAgICAgJ2VzdGFkbyc6ICdFU1RBRE8nLFxyXG4gICAgICAnbnVtZXJvTWFzdGVyR2EnOiAnTlVNRVJPX01BU1RFUl9HQScsXHJcbiAgICAgICdlbWlzb3InOiAnRU1JU09SJyxcclxuICAgICAgJ2ZlY2hhQWNlcHRhY2lvbic6ICdGRUNIQV9BQ0VQVEFDSU9OJyxcclxuICAgICAgJ2ZlY2hhQXJyaWJvJzogJ0ZFQ0hBX0FSUklCTycsXHJcbiAgICAgICdmZWNoYUNvbmZvcm1hY2lvbic6ICdGRUNIQV9DT05GT1JNQUNJT04nLFxyXG4gICAgICAnZmVjaGFEZXNwZWd1ZSc6ICdGRUNIQV9ERVNQRUdVRScsXHJcbiAgICAgICd0b3RhbEd1aWFzJzogJ1RPVEFMX0dUSU1FJyxcclxuICAgICAgJ3RvdGFsR3VpYXNNYXJjYWRhcyc6ICdUT1RBTF9NQVJDQURPU19HVElNRScsXHJcbiAgICAgICdyZXZpc2Fkbyc6ICdSRVZJU0FETycsXHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IHNxbENvbHVtbiA9IHNvcnRCeSAmJiBzb3J0RmllbGRNYXBbc29ydEJ5XSBcclxuICAgICAgPyBzb3J0RmllbGRNYXBbc29ydEJ5XSBcclxuICAgICAgOiAnRkVDSEFDUkVBQ0lPTic7XHJcblxyXG4gICAgY29uc3QgZGlyZWN0aW9uID0gc29ydE9yZGVyID09PSAnYXNjJyB8fCBzb3J0T3JkZXIgPT09ICdkZXNjJyBcclxuICAgICAgPyBzb3J0T3JkZXIudG9VcHBlckNhc2UoKSBcclxuICAgICAgOiAnREVTQyc7XHJcblxyXG4gICAgaWYgKHNxbENvbHVtbiA9PT0gJ0ZFQ0hBQ1JFQUNJT04nKSByZXR1cm4gYGRkLkZFQ0hBQ1JFQUNJT04gJHtkaXJlY3Rpb259YDtcclxuXHJcbiAgICByZXR1cm4gYCR7c3FsQ29sdW1ufSAke2RpcmVjdGlvbn1gO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VhcmNoIGRvY3VtZW50cyBpbiB0aGUgZGF0YWJhc2UgYmFzZWQgb24gZmlsdGVyc1xyXG4gICAqIEBwYXJhbSBmaWx0ZXJzXHJcbiAgICogQHJldHVybnNcclxuICAgKi9cclxuICBhc3luYyBzZWFyY2hEb2N1bWVudHMoZmlsdGVyczogQnVzY2FyRG9jdW1lbnRvc0R0bykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3Qgd2hlcmU6IHN0cmluZ1tdID0gW107XHJcbiAgICAgIGNvbnN0IGpvaW5zOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICBjb25zdCBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XHJcblxyXG4gICAgICBsZXQgc3FsID0gYFxyXG4gICAgICAgIFdJVEggZmVjaGFfbWF4X2VzdGFkb3NfbWFuaWZpZXN0byBBUyAoXHJcbiAgICAgICAgICBTRUxFQ1QgXHJcbiAgICAgICAgICAgIGRldC5ET0NVTUVOVE8sXHJcbiAgICAgICAgICAgIE1BWChkZXQuRkVDSEFBQ1RJVkEpIEFTIG1heF9mZWNoYWFjdGl2YVxyXG4gICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRPQ0VTVEFET1MgZGV0XHJcbiAgICAgICAgICBXSEVSRSBkZXQuVElQT0RPQ1VNRU5UTyA9ICdNRlRPQydcclxuICAgICAgICAgICAgQU5EIGRldC5BQ1RJVkEgPSAnUydcclxuICAgICAgICAgICAgQU5EIGRldC5USVBPRVNUQURPIE5PVCBJTiAoJ0ZQTEFaTycsJ0NPTiBNQVJDQScsJ1ZJUycsJ1JFQycpXHJcbiAgICAgICAgICAgIEFORCBkZXQuVElQT0VTVEFETyBJTiAoJ0FDUCcsJ0FOVScsJ0NNUCcsJ0FDTCcsJ01PRCcsJ0NNUEZQJywgJ0FDTFAnKVxyXG4gICAgICAgICAgR1JPVVAgQlkgZGV0LkRPQ1VNRU5UT1xyXG4gICAgICAgICksXHJcbiAgICAgICAgZXN0YWRvX21heF90aXBvX21hbmlmaWVzdG8gQVMgKFxyXG4gICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICBkZXQuRE9DVU1FTlRPLFxyXG4gICAgICAgICAgICBNQVgoZGV0LlRJUE9FU1RBRE8pIEFTIG1heF90aXBvZXN0YWRvLFxyXG4gICAgICAgICAgICBkZXQuRkVDSEFBQ1RJVkEgQVMgZmVjaGFhY3RpdmFcclxuICAgICAgICAgIEZST00gRE9DVU1FTlRPUy5ET0NFU1RBRE9TIGRldFxyXG4gICAgICAgICAgSk9JTiBmZWNoYV9tYXhfZXN0YWRvc19tYW5pZmllc3RvIGZtZW0gT04gZm1lbS5ET0NVTUVOVE8gPSBkZXQuRE9DVU1FTlRPIFxyXG4gICAgICAgICAgICBBTkQgZm1lbS5tYXhfZmVjaGFhY3RpdmEgPSBkZXQuRkVDSEFBQ1RJVkFcclxuICAgICAgICAgIFdIRVJFIGRldC5USVBPRE9DVU1FTlRPID0gJ01GVE9DJ1xyXG4gICAgICAgICAgICBBTkQgZGV0LkFDVElWQSA9ICdTJ1xyXG4gICAgICAgICAgICBBTkQgZGV0LlRJUE9FU1RBRE8gSU4gKCdBQ1AnLCdBTlUnLCdDTVAnLCdBQ0wnLCdNT0QnLCdDTVBGUCcsICdBQ0xQJylcclxuICAgICAgICAgIEdST1VQIEJZIGRldC5ET0NVTUVOVE8sIGRldC5GRUNIQUFDVElWQVxyXG4gICAgICAgICksXHJcbiAgICAgICAgZXN0YWRvc19vcmRlbmFkb3MgQVMgKFxyXG4gICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICBlbXQuRE9DVU1FTlRPLFxyXG4gICAgICAgICAgICBlbXQubWF4X3RpcG9lc3RhZG8gQVMgVElQT0VTVEFETyxcclxuICAgICAgICAgICAgZHRlLk5PTUJSRSxcclxuICAgICAgICAgICAgZW10LmZlY2hhYWN0aXZhIEFTIEZFQ0hBLFxyXG4gICAgICAgICAgICBST1dfTlVNQkVSKCkgT1ZFUiAoUEFSVElUSU9OIEJZIGVtdC5ET0NVTUVOVE8gT1JERVIgQlkgZW10LmZlY2hhYWN0aXZhIERFU0MpIEFTIHJuXHJcbiAgICAgICAgICBGUk9NIGVzdGFkb19tYXhfdGlwb19tYW5pZmllc3RvIGVtdFxyXG4gICAgICAgICAgSk9JTiBET0NVTUVOVE9TLkRPQ1RJUE9FU1RBRE8gZHRlIE9OIGVtdC5tYXhfdGlwb2VzdGFkbyA9IGR0ZS5DT0RJR09cclxuICAgICAgICAgIFdIRVJFIGR0ZS5USVBPRE9DVU1FTlRPID0gJ01GVE9DJ1xyXG4gICAgICAgIClcclxuICAgICAgICBTRUxFQ1RcclxuICAgICAgICAgIGRkLklEIEFTIElELFxyXG4gICAgICAgICAgZGQuTlVNRVJPRVhURVJOTyBBUyBOVU1FUk9fRVhURVJOTyxcclxuICAgICAgICAgIGR0bS5OVU1FUk9SRUZFUkVOQ0lBT1JJR0lOQUwgQVMgTlVNRVJPX1JFRl9PUklHSU5BTCxcclxuICAgICAgICAgIGVvLk5PTUJSRSBBUyBFU1RBRE8sXHJcbiAgICAgICAgICAoU0VMRUNUIGRyZC5OVU1ET0NERVNUSU5PIEFTIE5VTUVST19NQVNURVJfR0EgRlJPTSBET0NVTUVOVE9TLkRPQ1JFTEFDSU9ORE9DVU1FTlRPIGRyZCBXSEVSRSBkcmQuRE9DT1JJR0VOPWRkLklEICBBTkQgVElQT0RPQ0RFU1RJTk8gPSAnR0EnIEFORCBBQ1RJVk8gPSAnUycgQU5EIFJPV05VTSA9IDEpIEFTIE5VTUVST19NQVNURVJfR0EsXHJcbiAgICAgICAgICBkZC5FTUlTT1IgQVMgRU1JU09SLFxyXG4gICAgICAgICAgKFNFTEVDVCBkZmRfYWNlLkZFQ0hBIEFTIGZlY2hhIEZST00gRE9DVU1FTlRPUy5ET0NGRUNIQURPQ1VNRU5UTyBkZmRfYWNlLCBET0NVTUVOVE9TLkRPQ1RJUE9GRUNIQSBkdGZfYWNlIFdIRVJFIGRkLklEPSBkZmRfYWNlLkRPQ1VNRU5UTyBhbmQgZHRmX2FjZS5DT0RJR08gPSBkZmRfYWNlLlRJUE9GRUNIQSBBTkQgZGZkX2FjZS5USVBPRkVDSEEgPSAnRkVDQUNFUFRBJykgQVMgRkVDSEFfQUNFUFRBQ0lPTixcclxuICAgICAgICAgIChTRUxFQ1QgZGZkX2Fyci5GRUNIQSBBUyBmZWNoYSBGUk9NIERPQ1VNRU5UT1MuRE9DRkVDSEFET0NVTUVOVE8gZGZkX2FyciwgRE9DVU1FTlRPUy5ET0NUSVBPRkVDSEEgZHRmX2FyciBXSEVSRSBkZC5JRD0gZGZkX2Fyci5ET0NVTUVOVE8gYW5kIGR0Zl9hcnIuQ09ESUdPID0gZGZkX2Fyci5USVBPRkVDSEEgQU5EIGRmZF9hcnIuVElQT0ZFQ0hBID0gJ0ZBUlJJQk8nKSBBUyBGRUNIQV9BUlJJQk8sXHJcbiAgICAgICAgICAoU0VMRUNUIE1BWChkZXQuRkVDSEFBQ1RJVkEpIEFTIGZlY2hhIEZST00gRE9DVU1FTlRPUy5ET0NFU1RBRE9TIGRldCBXSEVSRSBkZXQuZG9jdW1lbnRvID0gZGQuSUQgQU5EIGRldC5USVBPRE9DVU1FTlRPID0gJ01GVE9DJyBBTkQgZGV0LkFDVElWQSA9ICdTJyBBTkQgZGV0LlRJUE9FU1RBRE8gTk9UIElOICgnRlBMQVpPJywnQ09OIE1BUkNBJywnVklTJywnUkVDJykgQU5EIGRldC5USVBPRVNUQURPIElOICgnQUNQJywnQU5VJywnQ01QJywnQUNMJywnTU9EJywnQ01QRlAnLCAnQUNMUCcpIEdST1VQIEJZIGRldC5ET0NVTUVOVE8pIEFTIEZFQ0hBX0NPTkZPUk1BQ0lPTixcclxuICAgICAgICAgIChTRUxFQ1QgZGxkLkxPQ0FDSU9OIEFTIExPQ0FDSU9OIEZST00gRE9DVU1FTlRPUy5ET0NMT0NBQ0lPTkRPQ1VNRU5UTyBkbGQgV0hFUkUgZGxkLkRPQ1VNRU5UTz1kZC5JRCBBTkQgZGxkLlRJUE9MT0NBQ0lPTiA9J0xVREVTUEVHVUUnKSBBUyBMVUdBUl9ERV9ERVNQRUdVRSxcclxuICAgICAgICAgIChTRUxFQ1QgZGZkX2Rlcy5GRUNIQSBBUyBmZWNoYSBGUk9NIERPQ1VNRU5UT1MuRE9DRkVDSEFET0NVTUVOVE8gZGZkX2RlcywgRE9DVU1FTlRPUy5ET0NUSVBPRkVDSEEgZHRmX2RlcyBXSEVSRSBkZC5JRD0gZGZkX2Rlcy5ET0NVTUVOVE8gYW5kIGR0Zl9kZXMuQ09ESUdPID0gZGZkX2Rlcy5USVBPRkVDSEEgQU5EIGRmZF9kZXMuVElQT0ZFQ0hBID0gJ0ZFREVTUEVHVUUnKSBBUyBGRUNIQV9ERVNQRUdVRSxcclxuICAgICAgICAgIChTRUxFQ1QgQ09VTlQoaWQpIEZST00gRE9DVU1FTlRPUy5ET0NET0NVTUVOVE9CQVNFIGQgIFdIRVJFIGQuVElQT0RPQ1VNRU5UTyA9ICdHVElNRScgQU5EIGQuTlVNRVJPQUNFUFRBQ0lPTiA9IFRPX0NIQVIoZGQuTlVNRVJPRVhURVJOTykgQU5EIGQuQUNUSVZPID0gJ1MnKSBBUyBUT1RBTF9HVElNRSxcclxuICAgICAgICAgIChTRUxFQ1QgQ09VTlQoRElTVElOQ1QgREJHLmlkKVxyXG4gICAgICAgICAgICBGUk9NIERPQ1VNRU5UT1MuZG9jcmVsYWNpb25kb2N1bWVudG8gUkRcclxuICAgICAgICAgICAgSk9JTiBET0NVTUVOVE9TLmRvY2RvY3VtZW50b2Jhc2UgREJHIE9OIERCRy5pZCA9IFJELmRvY29yaWdlblxyXG4gICAgICAgICAgICBKT0lOIERPQ1RSQU5TUE9SVEUuZG9jdHJhbmRvY3RyYW5zcG9ydGUgRFQgT04gRFQuaWQgPSBEQkcuaWRcclxuICAgICAgICAgICAgTEVGVCBKT0lOIERPQ1VNRU5UT1MuZG9jZXN0YWRvcyBHQU5VIE9OIEdBTlUuZG9jdW1lbnRvID0gREJHLmlkIEFORCBHQU5VLlRJUE9ET0NVTUVOVE8gPSBEQkcuVElQT0RPQ1VNRU5UTyBBTkQgR0FOVS50aXBvZXN0YWRvID0gJ0FOVSdcclxuICAgICAgICAgICAgV0hFUkUgUkQudGlwb3JlbGFjaW9uID0gJ1JFRidcclxuICAgICAgICAgICAgICBBTkQgUkQuYWN0aXZvID0gJ1MnXHJcbiAgICAgICAgICAgICAgQU5EIFJELmRvY2Rlc3Rpbm8gPSBkZC5JRFxyXG4gICAgICAgICAgICAgIEFORCBEQkcuVElQT0RPQ1VNRU5UTyA9ICdHVElNRSdcclxuICAgICAgICAgICAgICBBTkQgREJHLmFjdGl2byA9ICdTJ1xyXG4gICAgICAgICAgICAgIEFORCBHQU5VLmRvY3VtZW50byBJUyBOVUxMXHJcbiAgICAgICAgICAgICAgQU5EIERULlZBTE9SREVDTEFSQURPIDw9IDUwMFxyXG4gICAgICAgICAgICAgIEFORCBFWElTVFMgKFxyXG4gICAgICAgICAgICAgICAgU0VMRUNUIDFcclxuICAgICAgICAgICAgICAgIEZST00gRE9DVU1FTlRPUy5kb2Nlc3RhZG9zIEVcclxuICAgICAgICAgICAgICAgIFdIRVJFIEUuZG9jdW1lbnRvID0gREJHLmlkXHJcbiAgICAgICAgICAgICAgICAgIEFORCBFLlRJUE9ET0NVTUVOVE8gPSBEQkcuVElQT0RPQ1VNRU5UT1xyXG4gICAgICAgICAgICAgICAgICBBTkQgRS50aXBvZXN0YWRvIElOICgnQ09OIE1BUkNBJywgJ1ZJUycpXHJcbiAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKSBBUyBUT1RBTF9NQVJDQURPU19HVElNRSxcclxuICAgICAgICAgIERFQ09ERSgoU0VMRUNUIHRpcG9lc3RhZG8gRlJPTSBET0NVTUVOVE9TLkRPQ0VTVEFET1MgZXN0IFdIRVJFIGRkLnRpcG9kb2N1bWVudG8gPSBlc3QudGlwb2RvY3VtZW50byBBTkQgZGQuaWQgPSBlc3QuZG9jdW1lbnRvIEFORCBlc3QudGlwb2VzdGFkbyA9ICdWSVMnIEFORCBlc3QuYWN0aXZhID0gJ1MnIEFORCBST1dOVU0gPSAxKSxOVUxMLCdOTycsJ1NJJykgYXMgUkVWSVNBRE9cclxuICAgICAgICBGUk9NIERPQ1VNRU5UT1MuRE9DRE9DVU1FTlRPQkFTRSBkZFxyXG4gICAgICAgIEpPSU4gRE9DVFJBTlNQT1JURS5ET0NUUkFOTUFOSUZJRVNUTyBkdG0gT04gZGQuSUQgPSBkdG0uSURcclxuICAgICAgICBKT0lOIGVzdGFkb3Nfb3JkZW5hZG9zIGVvIE9OIGRkLklEID0gZW8uRE9DVU1FTlRPIEFORCBlby5ybiA9IDFcclxuICAgICAgYDtcclxuXHJcbiAgICAgIC8vIFBhcsOhbWV0cm9zIGLDoXNpY29zXHJcbiAgICAgIHBhcmFtcy50aXBvRG9jdW1lbnRvQmFzZSA9IFwiTUZUT0NcIjtcclxuXHJcbiAgICAgIHdoZXJlLnB1c2goXCJkZC5USVBPRE9DVU1FTlRPID0gOnRpcG9Eb2N1bWVudG9CYXNlXCIpO1xyXG4gICAgICB3aGVyZS5wdXNoKFwiZGQuQUNUSVZPID0gJ1MnXCIpO1xyXG5cclxuICAgICAgLy8gSk9JTnMgb3BjaW9uYWxlcyBzZWfDum4gZmlsdGVyc1xyXG4gICAgICBjb25zdCBuZWVkUGFydGljaXBhY2lvbiA9ICEhZmlsdGVycz8uZW1pc29yIHx8ICEhZmlsdGVycz8udGlwb1BhcnRpY2lwYW50ZTtcclxuICAgICAgaWYgKG5lZWRQYXJ0aWNpcGFjaW9uKSB7XHJcbiAgICAgICAgam9pbnMucHVzaChcIkxFRlQgSk9JTiBET0NQQVJUSUNJUEFDSU9OIFAgT04gUC5ET0NVTUVOVE8gPSBkZC5JRFwiKTtcclxuICAgICAgICB3aGVyZS5wdXNoKFwiUC5BQ1RJVkEgPSAnUydcIik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qXHJcbiAgICAgIGNvbnN0IG5lZWRFc3RhZG8gPSAhIWZpbHRlcnM/LmVzdGFkbztcclxuICAgICAgaWYgKG5lZWRFc3RhZG8pIHtcclxuICAgICAgICBqb2lucy5wdXNoKFwiSk9JTiBET0NVTUVOVE9TLkRPQ0VTVEFET1MgZGV0IE9OIGRldC5ET0NVTUVOVE8gPSBkZC5JRFwiKTtcclxuICAgICAgfSovXHJcblxyXG4gICAgICBjb25zdCBuZWVkTG9jYWNpb24gPSAhIShmaWx0ZXJzPy50aXBvTG9jYWNpb24gfHwgZmlsdGVycz8ubG9jYWNpb24pO1xyXG4gICAgICBpZiAobmVlZExvY2FjaW9uKSB7XHJcbiAgICAgICAgam9pbnMucHVzaChcclxuICAgICAgICAgIFwiTEVGVCBKT0lOIERPQ1VNRU5UT1MuRE9DTE9DQUNJT05ET0NVTUVOVE8gZGxkIE9OIGRsZC5ET0NVTUVOVE8gPSBkZC5JRFwiXHJcbiAgICAgICAgKTtcclxuICAgICAgICB3aGVyZS5wdXNoKFwiZGxkLkFDVElWQSA9ICdTJ1wiKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gUmFuZ28gZGUgZmVjaGFzIHBvciB0aXBvXHJcbiAgICAgIC8vIE5vIGFwbGljYXIgZmlsdHJvcyBkZSBmZWNoYXMgc2kgc2UgZXN0w6EgYnVzY2FuZG8gcG9yIG7Dum1lcm8gZGUgYWNlcHRhY2nDs24gbyBuw7ptZXJvIGRlIHJlZmVyZW5jaWEgb3JpZ2luYWxcclxuICAgICAgY29uc3QgdGllbmVCdXNxdWVkYUVzcGVjaWZpY2EgPSAhIShmaWx0ZXJzPy5udW1lcm9BY2VwdGFjaW9uIHx8IGZpbHRlcnM/Lm51bWVyb01hbmlmaWVzdG9PcmlnaW5hbCk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoIXRpZW5lQnVzcXVlZGFFc3BlY2lmaWNhICYmIChmaWx0ZXJzPy50aXBvRmVjaGEgfHwgZmlsdGVycz8uZmVjaGFEZXNkZSB8fCBmaWx0ZXJzPy5mZWNoYUhhc3RhKSkge1xyXG4gICAgICAgIGxldCBjb2x1bW5hRmVjaGEgPSBcIlwiO1xyXG5cclxuICAgICAgICBpZiAoZmlsdGVycz8udGlwb0ZlY2hhKSB7XHJcbiAgICAgICAgICBqb2lucy5wdXNoKFxyXG4gICAgICAgICAgICBcIkpPSU4gRE9DVU1FTlRPUy5ET0NGRUNIQURPQ1VNRU5UTyBkZmQgT04gZGZkLkRPQ1VNRU5UTyA9IGRkLklEIEFORCBkZmQuVElQT0ZFQ0hBID0gOnRpcG9GZWNoYVwiXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgY29sdW1uYUZlY2hhID0gXCJkZmQuRkVDSEFcIjtcclxuICAgICAgICAgIHdoZXJlLnB1c2goXCJkZmQuVElQT0ZFQ0hBID0gOnRpcG9GZWNoYVwiKTtcclxuICAgICAgICAgIHBhcmFtcy50aXBvRmVjaGEgPSBTdHJpbmcoZmlsdGVycy50aXBvRmVjaGEpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvLyBTaSBubyBzZSBlc3BlY2lmaWNhIHRpcG9GZWNoYSwgdXNhciBGRUNIQUVNSVNJT04gZGVsIGRvY3VtZW50b1xyXG4gICAgICAgICAgY29sdW1uYUZlY2hhID0gXCJkZC5GRUNIQUVNSVNJT05cIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChmaWx0ZXJzLmZlY2hhRGVzZGUpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiZmVjaGFEZXNkZS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXCIsIGZpbHRlcnMuZmVjaGFEZXNkZSk7XHJcbiAgICAgICAgICB3aGVyZS5wdXNoKFxyXG4gICAgICAgICAgICBgJHtjb2x1bW5hRmVjaGF9ID49IFRPX0RBVEUoOmZlY2hhRGVzZGUsICdERC9NTS9ZWVlZIEhIMjQ6TUk6U1MnKWBcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgICBwYXJhbXMuZmVjaGFEZXNkZSA9IGAke1N0cmluZyhmaWx0ZXJzLmZlY2hhRGVzZGUpfSAwMDowMDowMGA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChmaWx0ZXJzLmZlY2hhSGFzdGEpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiZmVjaGFIYXN0YS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXCIsIGZpbHRlcnMuZmVjaGFIYXN0YSk7XHJcbiAgICAgICAgICB3aGVyZS5wdXNoKFxyXG4gICAgICAgICAgICBgJHtjb2x1bW5hRmVjaGF9IDw9IFRPX0RBVEUoOmZlY2hhSGFzdGEsICdERC9NTS9ZWVlZIEhIMjQ6TUk6U1MnKWBcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgICBwYXJhbXMuZmVjaGFIYXN0YSA9IGAke1N0cmluZyhmaWx0ZXJzLmZlY2hhSGFzdGEpfSAyMzo1OTo1OWA7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBXSEVSRSBwb3IgZmlsdGVyc1xyXG4gICAgICBpZiAoZmlsdGVycz8udGlwb0RvY3VtZW50bykge1xyXG4gICAgICAgIHdoZXJlLnB1c2goXCJkZC5USVBPRE9DVU1FTlRPID0gOnRpcG9Eb2N1bWVudG9cIik7XHJcbiAgICAgICAgcGFyYW1zLnRpcG9Eb2N1bWVudG8gPSBTdHJpbmcoZmlsdGVycy50aXBvRG9jdW1lbnRvKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqZXMgcGFyYSBmaWx0cmFyIHBvciBlbCB1c2VySWQgZGVsIHVzdWFyaW8gYXV0ZW50aWNhZG8gKi9cclxuICAgICAgaWYgKGZpbHRlcnM/LnVzZXJJZCkge1xyXG4gICAgICAgIGNvbnN0IHVzZXJJZE51bSA9IE51bWJlcihmaWx0ZXJzLnVzZXJJZCk7XHJcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNOYU4odXNlcklkTnVtKSAmJiB1c2VySWROdW0gPiAwKSB7XHJcbiAgICAgICAgICB3aGVyZS5wdXNoKFwiZGQuSURFTUlTT1IgPSA6dXNlcklkXCIpO1xyXG4gICAgICAgICAgcGFyYW1zLnVzZXJJZCA9IHVzZXJJZE51bTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwidXNlcklkLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cIiwgdXNlcklkTnVtKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKmVzIHBhcmEgZmlsdHJhciBwb3IgZWwgdGlwbyBkZSBwYXJ0aWNpcGFudGUgKFJPTCkgZW4gbGEgdGFibGEgcGFydGljaXBhY2lvbiAqL1xyXG4gICAgICBpZiAoZmlsdGVycz8udGlwb1BhcnRpY2lwYW50ZSAmJiAhdGllbmVCdXNxdWVkYUVzcGVjaWZpY2EpIHtcclxuICAgICAgICBpZihmaWx0ZXJzLnRpcG9QYXJ0aWNpcGFudGUudG9VcHBlckNhc2UoKSA9PT0gJ0VNSVNPUicpe1xyXG4gICAgICAgICAgZmlsdGVycy50aXBvUGFydGljaXBhbnRlID0gJ0VNSSc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnNvbGUubG9nKFwidGlwb1BhcnRpY2lwYW50ZS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXCIsIGZpbHRlcnMudGlwb1BhcnRpY2lwYW50ZSk7XHJcbiAgICAgICAgd2hlcmUucHVzaChcIlAuUk9MID0gOnRpcG9QYXJ0aWNpcGFudGVcIik7XHJcbiAgICAgICAgcGFyYW1zLnRpcG9QYXJ0aWNpcGFudGUgPSBTdHJpbmcoZmlsdGVycy50aXBvUGFydGljaXBhbnRlKS50cmltKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKmVzIHBhcmEgZmlsdHJhciBwb3IgZWwgbm9tYnJlIGRlbCBlbWlzb3IgZW4gbGEgdGFibGEgRE9DUEFSVElDSVBBQ0lPTiAqL1xyXG4gICAgICBpZiAoZmlsdGVycz8uZW1pc29yICYmICF0aWVuZUJ1c3F1ZWRhRXNwZWNpZmljYSkge1xyXG4gICAgICAgIHdoZXJlLnB1c2goXCJVUFBFUihQLk5PTUJSRVBBUlRJQ0lQQU5URSkgTElLRSBVUFBFUig6ZW1pc29yKVwiKTtcclxuICAgICAgICBwYXJhbXMuZW1pc29yID0gYCUke1N0cmluZyhmaWx0ZXJzLmVtaXNvcikudHJpbSgpfSVgO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZmlsdGVycz8udGlwb0xvY2FjaW9uICYmICF0aWVuZUJ1c3F1ZWRhRXNwZWNpZmljYSkge1xyXG4gICAgICAgIHdoZXJlLnB1c2goXCJkbGQuVElQT0xPQ0FDSU9OID0gOnRpcG9Mb2NhY2lvblwiKTtcclxuICAgICAgICBwYXJhbXMudGlwb0xvY2FjaW9uID0gU3RyaW5nKGZpbHRlcnMudGlwb0xvY2FjaW9uKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGZpbHRlcnM/LmxvY2FjaW9uICYmICF0aWVuZUJ1c3F1ZWRhRXNwZWNpZmljYSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwibG9jYWNpb24tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVwiLCBmaWx0ZXJzLmxvY2FjaW9uKTtcclxuICAgICAgICBjb25zdCBsb2NhY2lvblZhbHVlID0gU3RyaW5nKGZpbHRlcnMubG9jYWNpb24pLnRyaW0oKTtcclxuICAgICAgICAvLyBTaSBlcyBudW3DqXJpY28sIGNvbXBhcmFyIGNvbiBJRExPQ0FDSU9OXHJcbiAgICAgICAgaWYgKC9eXFxkKyQvLnRlc3QobG9jYWNpb25WYWx1ZSkpIHtcclxuICAgICAgICAgIHdoZXJlLnB1c2goXCJkbGQuSURMT0NBQ0lPTiA9IDpsb2NhY2lvblwiKTtcclxuICAgICAgICAgIHBhcmFtcy5sb2NhY2lvbiA9IE51bWJlcihsb2NhY2lvblZhbHVlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gU2kgZXMgc3RyaW5nLCBjb21wYXJhciBjb24gQ09ESUdPTE9DQUNJT05cclxuICAgICAgICAgIHdoZXJlLnB1c2goXCJVUFBFUihkbGQuQ09ESUdPTE9DQUNJT04pID0gVVBQRVIoOmxvY2FjaW9uKVwiKTtcclxuICAgICAgICAgIHBhcmFtcy5sb2NhY2lvbiA9IGxvY2FjaW9uVmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZmlsdGVycz8ubnVtZXJvQWNlcHRhY2lvbikge1xyXG4gICAgICAgIC8vIGRkLk5VTUVST0VYVEVSTk8gZXMgVkFSQ0hBUiwgdHJhdGFyIGNvbW8gc3RyaW5nXHJcbiAgICAgICAgY29uc3QgY2xlYW5lZFZhbHVlID0gU3RyaW5nKGZpbHRlcnMubnVtZXJvQWNlcHRhY2lvbikudHJpbSgpO1xyXG4gICAgICAgIGlmIChjbGVhbmVkVmFsdWUgJiYgY2xlYW5lZFZhbHVlLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIHdoZXJlLnB1c2goXCJkZC5OVU1FUk9FWFRFUk5PID0gOm51bWVyb0V4dGVybm9cIik7XHJcbiAgICAgICAgICBwYXJhbXMubnVtZXJvRXh0ZXJubyA9IGNsZWFuZWRWYWx1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChmaWx0ZXJzPy5udW1lcm9NYW5pZmllc3RvT3JpZ2luYWwpIHtcclxuICAgICAgICB3aGVyZS5wdXNoKFwiZHRtLk5VTUVST1JFRkVSRU5DSUFPUklHSU5BTCA9IDpudW1lcm9SZWZlcmVuY2lhT3JpZ2luYWxcIik7XHJcbiAgICAgICAgcGFyYW1zLm51bWVyb1JlZmVyZW5jaWFPcmlnaW5hbCA9IFN0cmluZyhcclxuICAgICAgICAgIGZpbHRlcnMubnVtZXJvTWFuaWZpZXN0b09yaWdpbmFsXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGZpbHRlcnM/LmVzdGFkbyAmJiAhdGllbmVCdXNxdWVkYUVzcGVjaWZpY2EpIHtcclxuICAgICAgICBjb25zdCBlc3RhZG9WYWx1ZSA9IFN0cmluZyhmaWx0ZXJzLmVzdGFkbykudG9VcHBlckNhc2UoKS50cmltKCk7XHJcbiAgICAgICAgLy8gU2kgZWwgZXN0YWRvIGVzIFZJU0FETyBvIFZJUywgZmlsdHJhciBwb3IgUkVWSVNBRE8gPSAnU0knIGVuIGx1Z2FyIGRlbCBmaWx0cm8gZGUgZXN0YWRvcyBub3JtYWxcclxuICAgICAgICBpZiAoZXN0YWRvVmFsdWUgPT09ICdWSVNBRE8nIHx8IGVzdGFkb1ZhbHVlID09PSAnVklTJykge1xyXG4gICAgICAgICAgLy8gRmlsdHJhciBwb3IgZG9jdW1lbnRvcyBxdWUgdGVuZ2FuIGVzdGFkbyBWSVMgYWN0aXZvIChyZXZpc2FkbyA9ICdTSScpXHJcbiAgICAgICAgICB3aGVyZS5wdXNoKFwiRVhJU1RTIChTRUxFQ1QgMSBGUk9NIERPQ1VNRU5UT1MuRE9DRVNUQURPUyBlc3QgV0hFUkUgZXN0LnRpcG9kb2N1bWVudG8gPSBkZC50aXBvZG9jdW1lbnRvIEFORCBlc3QuZG9jdW1lbnRvID0gZGQuaWQgQU5EIGVzdC50aXBvZXN0YWRvID0gJ1ZJUycgQU5EIGVzdC5hY3RpdmEgPSAnUycpXCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB3aGVyZS5wdXNoKFwiZW8uVElQT0VTVEFETyA9IDplc3RhZG9cIik7XHJcbiAgICAgICAgICBwYXJhbXMuZXN0YWRvID0gZXN0YWRvVmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZmlsdGVycz8uc2VudGlkb09wZXJhY2lvbiAmJiAhdGllbmVCdXNxdWVkYUVzcGVjaWZpY2EpIHtcclxuICAgICAgICB3aGVyZS5wdXNoKFwiZHRtLlRJUE9NQU5JRklFU1RPID0gOnNlbnRpZG9PcGVyYWNpb25cIik7XHJcbiAgICAgICAgcGFyYW1zLnNlbnRpZG9PcGVyYWNpb24gPSBTdHJpbmcoZmlsdGVycy5zZW50aWRvT3BlcmFjaW9uKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGZpbHRlcnM/Lm51bWVyb1Z1ZWxvICYmICF0aWVuZUJ1c3F1ZWRhRXNwZWNpZmljYSkge1xyXG4gICAgICAgIHdoZXJlLnB1c2goXCJkdG0uVklBSkUgPSA6bnVtZXJvVnVlbG9cIik7XHJcbiAgICAgICAgcGFyYW1zLm51bWVyb1Z1ZWxvID0gU3RyaW5nKGZpbHRlcnMubnVtZXJvVnVlbG8pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBFbnNhbWJsYXIgY29uc3VsdGEgZmluYWxcclxuICAgICAgaWYgKGpvaW5zLmxlbmd0aCkge1xyXG4gICAgICAgIHNxbCArPSBcIlxcblwiICsgam9pbnMuam9pbihcIlxcblwiKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAod2hlcmUubGVuZ3RoKSB7XHJcbiAgICAgICAgc3FsICs9IFwiXFxuV0hFUkUgXCIgKyB3aGVyZS5qb2luKFwiXFxuICBBTkQgXCIpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBBcGxpY2FyIHNvcnRpbmcgZGluw6FtaWNvXHJcbiAgICAgIGNvbnN0IG9yZGVyQnkgPSB0aGlzLmJ1aWxkT3JkZXJCeShmaWx0ZXJzPy5zb3J0QnksIGZpbHRlcnM/LnNvcnRPcmRlcik7XHJcbiAgICAgIHNxbCArPSBgXFxuT1JERVIgQlkgJHtvcmRlckJ5fWA7XHJcblxyXG4gICAgICAvLyBQYWdpbmFjacOzbiBzaW1wbGUgKGZldGNoIGZpcnN0KSBjb21wYXRpYmxlIGNvbiBPcmFjbGUgMTJjK1xyXG4gICAgICBjb25zdCBwYWdlID0gTnVtYmVyKGZpbHRlcnM/LnBhZ2UgfHwgMSk7XHJcbiAgICAgIGNvbnN0IGxpbWl0ID0gTnVtYmVyKGZpbHRlcnM/LmxpbWl0IHx8IDEwKTtcclxuICAgICAgY29uc3Qgb2Zmc2V0ID0gKHBhZ2UgLSAxKSAqIGxpbWl0O1xyXG4gICAgICBjb25zdCBwYWdpbmF0ZWRTcWwgPSBgXHJcbiAgICAgICAgU0VMRUNUICogRlJPTSAoXHJcbiAgICAgICAgICBTRUxFQ1QgcS4qLCBST1dOVU0gcm4gRlJPTSAoXHJcbiAgICAgICAgICAgICR7c3FsfVxyXG4gICAgICAgICAgKSBxIFdIRVJFIFJPV05VTSA8PSAke29mZnNldCArIGxpbWl0fVxyXG4gICAgICAgICkgV0hFUkUgcm4gPiAke29mZnNldH1cclxuICAgICAgYDtcclxuXHJcbiAgICAgIC8vIFVzYXIgZGF0YVNvdXJjZSBkaXJlY3RhbWVudGUgKG1lam9yIHByw6FjdGljYSBwYXJhIG3Dumx0aXBsZXMgY29uc3VsdGFzKVxyXG4gICAgICBjb25zdCBkcml2ZXIgPSB0aGlzLmRhdGFTb3VyY2UuZHJpdmVyO1xyXG5cclxuICAgICAgY29uc3QgW3BhZ2luYXRlZFF1ZXJ5LCBwYWdpbmF0ZWRQYXJhbWV0ZXJzXSA9XHJcbiAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMocGFnaW5hdGVkU3FsLCBwYXJhbXMsIHt9KTtcclxuXHJcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCB0aGlzLmRhdGFTb3VyY2UucXVlcnkoXHJcbiAgICAgICAgcGFnaW5hdGVkUXVlcnksXHJcbiAgICAgICAgcGFnaW5hdGVkUGFyYW1ldGVyc1xyXG4gICAgICApO1xyXG5cclxuICAgICAgLy8gQ29udGVvIHRvdGFsIChzaW4gcGFnaW5hY2nDs24pIC0gdXNhciBwYXLDoW1ldHJvcyBzaW4gcm93bnVtXHJcbiAgICAgIGNvbnN0IGNvdW50U3FsID0gYFNFTEVDVCBDT1VOVCgxKSBBUyBUT1RBTCBGUk9NICgke3NxbH0pYDtcclxuICAgICAgY29uc3QgW2NvdW50UXVlcnksIGNvdW50UGFyYW1ldGVyc10gPSBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICBjb3VudFNxbCxcclxuICAgICAgICBwYXJhbXMsXHJcbiAgICAgICAge31cclxuICAgICAgKTtcclxuICAgICAgY29uc3QgY291bnRSb3dzID0gYXdhaXQgdGhpcy5kYXRhU291cmNlLnF1ZXJ5KFxyXG4gICAgICAgIGNvdW50UXVlcnksXHJcbiAgICAgICAgY291bnRQYXJhbWV0ZXJzXHJcbiAgICAgICk7XHJcbiAgICAgIGNvbnN0IHRvdGFsID0gTnVtYmVyKGNvdW50Um93cz8uWzBdPy5UT1RBTCB8fCAwKTtcclxuXHJcbiAgICAgIC8vIE1hcGVhciByZXNwdWVzdGFcclxuICAgICAgY29uc3QgZG9jdW1lbnRvcyA9IHJvd3MubWFwKChyOiBhbnkpID0+ICh7XHJcbiAgICAgICAgaWQ6IHIuSUQsXHJcbiAgICAgICAgbnVtZXJvRXh0ZXJubzogci5OVU1FUk9fRVhURVJOTyxcclxuICAgICAgICBudW1lcm9SZWZlcmVuY2lhT3JpZ2luYWw6IHIuTlVNRVJPX1JFRl9PUklHSU5BTCxcclxuICAgICAgICBlc3RhZG86IHIuRVNUQURPLFxyXG4gICAgICAgIG51bWVyb01hc3RlckdhOiByLk5VTUVST19NQVNURVJfR0EsXHJcbiAgICAgICAgZW1pc29yOiByLkVNSVNPUixcclxuICAgICAgICBmZWNoYUFjZXB0YWNpb246IHIuRkVDSEFfQUNFUFRBQ0lPTixcclxuICAgICAgICBmZWNoYUFycmlibzogci5GRUNIQV9BUlJJQk8sXHJcbiAgICAgICAgZmVjaGFDb25mb3JtYWNpb246IHIuRkVDSEFfQ09ORk9STUFDSU9OLFxyXG4gICAgICAgIGx1Z2FyRGVzcGVndWU6IHIuTFVHQVJfREVfREVTUEVHVUUsXHJcbiAgICAgICAgZmVjaGFEZXNwZWd1ZTogci5GRUNIQV9ERVNQRUdVRSxcclxuICAgICAgICB0b3RhbERvY3VtZW50b3NHdGltZTogci5UT1RBTF9HVElNRSxcclxuICAgICAgICB0b3RhbE1hcmNhZG9zR3RpbWU6IHIuVE9UQUxfTUFSQ0FET1NfR1RJTUUsXHJcbiAgICAgICAgcmV2aXNhZG86IHIuUkVWSVNBRE8sXHJcbiAgICAgIH0pKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHtcclxuICAgICAgICBkb2N1bWVudG9zLFxyXG4gICAgICAgIHRvdGFsLFxyXG4gICAgICAgIHBhZ2UsXHJcbiAgICAgICAgbGltaXQsXHJcbiAgICAgICAgdG90YWxQYWdlczogTWF0aC5jZWlsKHRvdGFsIC8gbGltaXQpLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgcmV0dXJuIFJlc3BvbnNlVXRpbC5zdWNjZXNzKHJlc3VsdCwgXCJEb2N1bWVudG9zIG9idGVuaWRvcyBleGl0b3NhbWVudGVcIik7XHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIHRocm93IFJlc3BvbnNlVXRpbC5pbnRlcm5hbEVycm9yKGVycm9yKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIGV4cG9ydERvY3VtZW50cyhmaWx0ZXJzOiBCdXNjYXJEb2N1bWVudG9zRHRvKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHdoZXJlOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICBjb25zdCB7IG51bWVyb0FjZXB0YWNpb24sIHRpcG9Eb2N1bWVudG8gfSA9IGZpbHRlcnM7XHJcbiAgICAgIGNvbnN0IHR5cGVEb2MgPSBcIkdUSU1FXCI7XHJcblxyXG4gICAgICBsZXQgc3FsID0gYFxyXG4gICAgICAgIFNFTEVDVCBESVNUSU5DVFxyXG4gICAgICAgICAgRC5JRCAgICAgICAgICAgICAgICBBUyBJRCxcclxuICAgICAgICAgIEQuTlVNRVJPRVhURVJOTyAgICAgQVMgTlVNRVJPRVhURVJOTyxcclxuICAgICAgICAgIEQuVElQT0RPQ1VNRU5UTyAgICAgQVMgVElQT0RPQ1VNRU5UTyxcclxuICAgICAgICAgIEQuQUNUSVZPICAgICAgICAgICAgQVMgQUNUSVZPLFxyXG4gICAgICAgICAgTlZMKChTRUxFQ1QgTElTVEFHRyhPcEZpc2NNYXJjYS5Db2RpZ29PcEZpc2NNb3Rpdm9NYXJjYSB8fCAnLScgfHwgTW90aXZvLkRlc2NyaXBjaW9uLCAnIC8gJykgV0lUSElOIEdST1VQIChPUkRFUiBCWSBPcEZpc2NNYXJjYS5Db2RpZ29PcEZpc2NNb3Rpdm9NYXJjYSlcclxuICAgICAgICAgICBGUk9NIE9wRmlzY01hcmNhIE9wRmlzY01hcmNhXHJcbiAgICAgICAgICAgSk9JTiBPcEZpc2NNb3Rpdm9NYXJjYSBNb3Rpdm9cclxuICAgICAgICAgICAgIE9OIE1vdGl2by5Db2RpZ28gPSBPcEZpc2NNYXJjYS5Db2RpZ29PcEZpc2NNb3Rpdm9NYXJjYVxyXG4gICAgICAgICAgIFdIRVJFIE9wRmlzY01hcmNhLklkRG9jdW1lbnRvID0gRC5JRFxyXG4gICAgICAgICAgICAgQU5EIE9wRmlzY01hcmNhLkFjdGl2YSA9ICdTJ1xyXG4gICAgICAgICAgKSwgJycpIEFTIE1PVElWT19TRUxFQ0NJT04sXHJcbiAgICAgICAgICBOVkwoKFNFTEVDVCBMSVNUQUdHKFJFUy5jb2RpZ29vcGZpc2NyZXN1bHRhZG8gfHwgJyAvICcgfHwgUkVTLm9ic2VydmFjaW9uLCAnIC8gJykgV0lUSElOIEdST1VQIChPUkRFUiBCWSBSRVMuY29kaWdvb3BmaXNjcmVzdWx0YWRvIHx8ICcgLyAnIHx8IFJFUy5vYnNlcnZhY2lvbiBBU0MpXHJcbiAgICAgICAgICAgRlJPTSBPUEZJU0NSRVNVTFRBRE9BQ0NJT04gUkVTXHJcbiAgICAgICAgICAgSU5ORVIgSk9JTiBPcEZpc2NSZWdpc3Ryb0Zpc2NhbGl6YWNpIFJFR1xyXG4gICAgICAgICAgICAgT04gUkVHLklkT3BGaXNjQWNjaW9uRmlzY2FsaXphY2kgPSBSRVMuSWRPcEZpc2NBY2Npb25GaXNjYWxpemFjaVxyXG4gICAgICAgICAgICBBTkQgUkVHLklEID0gUkVTLmlkb3BmaXNjcmVnaXN0cm9maXNjYWxpemFcclxuICAgICAgICAgICBJTk5FUiBKT0lOIGZpc2NhbGl6YWNpb25lcy5PcEZpc2NNYXJjYSBGSVNcclxuICAgICAgICAgICAgIE9OIEZJUy5JRE9QRklTQ0FDQ0lPTkZJU0NBTElaQUNJID0gUkVHLklkT3BGaXNjQWNjaW9uRmlzY2FsaXphY2lcclxuICAgICAgICAgICBXSEVSRSBGSVMuSWREb2N1bWVudG8gPSBELklEXHJcbiAgICAgICAgICAgICBBTkQgRklTLkFjdGl2YSA9ICdTJ1xyXG4gICAgICAgICAgICAgQU5EIFJFRy5hY3Rpdm8gPSAnUydcclxuICAgICAgICAgICksICcgJykgQVMgUkVTVUxUQURPX1NFTEVDQ0lPTlxyXG4gICAgICAgIEZST00gRE9DVU1FTlRPUy5ET0NET0NVTUVOVE9CQVNFIERcclxuICAgICAgYDtcclxuXHJcbiAgICAgIC8vIFdIRVJFIHBvciBmaWx0ZXJzXHJcbiAgICAgIHdoZXJlLnB1c2goYEQuQUNUSVZPID0gJ1MnYCk7XHJcbiAgICAgIGlmICh0aXBvRG9jdW1lbnRvKSB7XHJcbiAgICAgICAgd2hlcmUucHVzaChgRC5USVBPRE9DVU1FTlRPID0gJyR7dHlwZURvY30nYCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChudW1lcm9BY2VwdGFjaW9uKSB7XHJcbiAgICAgICAgY29uc3QgdiA9IFN0cmluZyhudW1lcm9BY2VwdGFjaW9uKS5yZXBsYWNlKC8nL2csIFwiJydcIik7XHJcbiAgICAgICAgd2hlcmUucHVzaChgRC5OVU1FUk9BQ0VQVEFDSU9OID0gJyR7dn0nYCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEVuc2FtYmxhciBjb25zdWx0YSBmaW5hbFxyXG4gICAgICAvLyBpZiAoam9pbnMubGVuZ3RoKSB7XHJcbiAgICAgIC8vICAgc3FsICs9IFwiXFxuXCIgKyBqb2lucy5qb2luKFwiXFxuXCIpO1xyXG4gICAgICAvLyB9XHJcbiAgICAgIGlmICh3aGVyZS5sZW5ndGgpIHtcclxuICAgICAgICBzcWwgKz0gXCJcXG5XSEVSRSBcIiArIHdoZXJlLmpvaW4oXCJcXG4gIEFORCBcIik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEVqZWN1dGFyIGNvbnN1bHRhIHNpbiBsw61taXRlXHJcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCB0aGlzLmRvY3VtZW50b0Jhc2VSZXBvc2l0b3J5LnF1ZXJ5KHNxbCk7XHJcblxyXG4gICAgICAvLyBHZW5lcmFyIFhNTCBlbiBlbCBmb3JtYXRvIHNvbGljaXRhZG9cclxuICAgICAgbGV0IHhtbCA9IFhtbFV0aWwuY3JlYXRlWG1sSGVhZGVyKCk7XHJcbiAgICAgIHhtbCArPSBcIjxSb3dzPlxcblwiO1xyXG5cclxuICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xyXG4gICAgICAgIHhtbCArPSBcIjxSb3c+XFxuXCI7XHJcbiAgICAgICAgeG1sICs9IGAgIDxOdW1lcm9Eb2M+JHtYbWxVdGlsLmVzY2FwZVhtbChcclxuICAgICAgICAgIHJvdy5OVU1FUk9FWFRFUk5PIHx8IFwiXCJcclxuICAgICAgICApfTwvTnVtZXJvRG9jPlxcbmA7XHJcbiAgICAgICAgeG1sICs9IGAgIDxNb3Rpdm9TZWxlY2Npb24+JHtYbWxVdGlsLmVzY2FwZVhtbChcclxuICAgICAgICAgIHJvdy5NT1RJVk9fU0VMRUNDSU9OIHx8IFwiXCJcclxuICAgICAgICApfTwvTW90aXZvU2VsZWNjaW9uPlxcbmA7XHJcbiAgICAgICAgeG1sICs9IGAgIDxSZXN1bHRhZG9TZWxlY2Npb24+JHtYbWxVdGlsLmVzY2FwZVhtbChcclxuICAgICAgICAgIHJvdy5SRVNVTFRBRE9fU0VMRUNDSU9OIHx8IFwiXCJcclxuICAgICAgICApfTwvUmVzdWx0YWRvU2VsZWNjaW9uPlxcbmA7XHJcbiAgICAgICAgeG1sICs9IGAgIDxEZXRhbGxlPk3DoXMgSW5mby48L0RldGFsbGU+XFxuYDtcclxuICAgICAgICB4bWwgKz0gXCI8L1Jvdz5cXG5cIjtcclxuICAgICAgfVxyXG5cclxuICAgICAgeG1sICs9IFwiPC9Sb3dzPlwiO1xyXG5cclxuICAgICAgcmV0dXJuIHhtbDtcclxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgdGhyb3cgUmVzcG9uc2VVdGlsLmludGVybmFsRXJyb3IoZXJyb3IpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRW52w61hIHVuIHByb2Nlc28gZGUgZXhwb3J0YWNpw7NuIFhNTCBhIGxhIGNvbGEgU1FTIHBhcmEgcHJvY2VzYW1pZW50byBhc8OtbmNyb25vXHJcbiAgICogRWwgcG9sbGluZyBwcm9jZXNzIChtYXJjb3MvbWluaW1pc19wd2ViX3BvbGxpbmdfcHJvY2VzcykgY29uc3VtaXLDoSBlbCBtZW5zYWplIHkgbG8gcHJvY2VzYXLDoS5cclxuICAgKiBFbCBwb2xsaW5nIHByb2Nlc3MgYWN0dWFsaXphcsOhIGVsIGVzdGFkbyBlbiBEeW5hbW9EQiB1c2FuZG8gZWwgcmVxdWVzdElkLlxyXG4gICAqL1xyXG4gIGFzeW5jIGV4cG9ydERvY3VtZW50c1NRUyhmaWx0ZXJzOiBCdXNjYXJEb2N1bWVudG9zRHRvLCBmaWxlTmFtZT86IHN0cmluZykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gQ29udmVydGlyIERUTyBhIG9iamV0byBwbGFubyBwYXJhIGVsIG1lbnNhamVcclxuICAgICAgY29uc3QgZmlsdGVyc09iajogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xyXG4gICAgICBpZiAoZmlsdGVycy5udW1lcm9BY2VwdGFjaW9uKSBmaWx0ZXJzT2JqLm51bWVyb0FjZXB0YWNpb24gPSBmaWx0ZXJzLm51bWVyb0FjZXB0YWNpb247XHJcbiAgICAgIGlmIChmaWx0ZXJzLnRpcG9Eb2N1bWVudG8pIGZpbHRlcnNPYmoudGlwb0RvY3VtZW50byA9IGZpbHRlcnMudGlwb0RvY3VtZW50bztcclxuICAgICAgaWYgKGZpbHRlcnMudXNlcklkKSBmaWx0ZXJzT2JqLnVzZXJJZCA9IGZpbHRlcnMudXNlcklkO1xyXG4gICAgICBpZiAoZmlsdGVycy50aXBvTG9jYWNpb24pIGZpbHRlcnNPYmoudGlwb0xvY2FjaW9uID0gZmlsdGVycy50aXBvTG9jYWNpb247XHJcbiAgICAgIGlmIChmaWx0ZXJzLmxvY2FjaW9uKSBmaWx0ZXJzT2JqLmxvY2FjaW9uID0gZmlsdGVycy5sb2NhY2lvbjtcclxuICAgICAgaWYgKGZpbHRlcnMudGlwb0ZlY2hhKSBmaWx0ZXJzT2JqLnRpcG9GZWNoYSA9IGZpbHRlcnMudGlwb0ZlY2hhO1xyXG4gICAgICBpZiAoZmlsdGVycy5mZWNoYURlc2RlKSBmaWx0ZXJzT2JqLmZlY2hhRGVzZGUgPSBmaWx0ZXJzLmZlY2hhRGVzZGU7XHJcbiAgICAgIGlmIChmaWx0ZXJzLmZlY2hhSGFzdGEpIGZpbHRlcnNPYmouZmVjaGFIYXN0YSA9IGZpbHRlcnMuZmVjaGFIYXN0YTtcclxuICAgICAgaWYgKGZpbHRlcnMuc2VudGlkb09wZXJhY2lvbikgZmlsdGVyc09iai5zZW50aWRvT3BlcmFjaW9uID0gZmlsdGVycy5zZW50aWRvT3BlcmFjaW9uO1xyXG4gICAgICBpZiAoZmlsdGVycy5udW1lcm9WdWVsbykgZmlsdGVyc09iai5udW1lcm9WdWVsbyA9IGZpbHRlcnMubnVtZXJvVnVlbG87XHJcbiAgICAgIGlmIChmaWx0ZXJzLm51bWVyb01hbmlmaWVzdG9PcmlnaW5hbCkgZmlsdGVyc09iai5udW1lcm9NYW5pZmllc3RvT3JpZ2luYWwgPSBmaWx0ZXJzLm51bWVyb01hbmlmaWVzdG9PcmlnaW5hbDtcclxuICAgICAgaWYgKGZpbHRlcnMuZXN0YWRvKSBmaWx0ZXJzT2JqLmVzdGFkbyA9IGZpbHRlcnMuZXN0YWRvO1xyXG4gICAgICBpZiAoZmlsdGVycy50aXBvUGFydGljaXBhbnRlKSBmaWx0ZXJzT2JqLnRpcG9QYXJ0aWNpcGFudGUgPSBmaWx0ZXJzLnRpcG9QYXJ0aWNpcGFudGU7XHJcbiAgICAgIGlmIChmaWx0ZXJzLmVtaXNvcikgZmlsdGVyc09iai5lbWlzb3IgPSBmaWx0ZXJzLmVtaXNvcjtcclxuXHJcbiAgICAgIC8vIEVudmlhciBtZW5zYWplIGRpcmVjdGFtZW50ZSBhIFNRUyB1c2FuZG8gTWFuaWZlc3RTUVNTZXJ2aWNlXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMubWFuaWZlc3RTUVNTZXJ2aWNlLnNlbmRYbWxFeHBvcnRNZXNzYWdlKFxyXG4gICAgICAgIGZpbHRlcnNPYmosXHJcbiAgICAgICAgZmlsZU5hbWVcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICB0aHJvdyBuZXcgSHR0cEV4Y2VwdGlvbihcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgbWVzc2FnZTogJ0Vycm9yIGFsIGVudmlhciBtZW5zYWplIGEgU1FTJyxcclxuICAgICAgICAgICAgZXJyb3I6IHJlc3VsdC5lcnJvcixcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBIdHRwU3RhdHVzLklOVEVSTkFMX1NFUlZFUl9FUlJPUlxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFJldG9ybmFyIGluZm9ybWFjacOzbiBjb24gZWwgcmVxdWVzdElkIHBhcmEgcXVlIGVsIGNsaWVudGUgcHVlZGEgY29uc3VsdGFyIGVsIGVzdGFkb1xyXG4gICAgICByZXR1cm4gUmVzcG9uc2VVdGlsLnN1Y2Nlc3MoXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgcmVxdWVzdElkOiByZXN1bHQucmVxdWVzdElkLFxyXG4gICAgICAgICAgbWVzc2FnZUlkOiByZXN1bHQubWVzc2FnZUlkLFxyXG4gICAgICAgICAgc3RhdHVzOiAncGVuZGluZycsXHJcbiAgICAgICAgICBtZXNzYWdlOiAnUHJvY2VzbyBkZSBleHBvcnRhY2nDs24gWE1MIGVudmlhZG8gYSBsYSBjb2xhIFNRUy4gRWwgcG9sbGluZyBwcm9jZXNzIGxvIHByb2Nlc2Fyw6EgYXPDrW5jcm9uYW1lbnRlLicsXHJcbiAgICAgICAgICBub3RlOiBgVXNhIGVsIHJlcXVlc3RJZCAoJHtyZXN1bHQucmVxdWVzdElkfSkgcGFyYSBjb25zdWx0YXIgZWwgZXN0YWRvIGRlbCBwcm9jZXNvIGVuIER5bmFtb0RCIGN1YW5kbyBlbCBwb2xsaW5nIHByb2Nlc3MgbG8gcHJvY2VzZS5gLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJ0V4cG9ydGFjacOzbiBYTUwgZW52aWFkYSBhIFNRUyBwYXJhIHByb2Nlc2FtaWVudG8gYXPDrW5jcm9ubydcclxuICAgICAgKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgSHR0cEV4Y2VwdGlvbikge1xyXG4gICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICB9XHJcbiAgICAgIHRocm93IFJlc3BvbnNlVXRpbC5pbnRlcm5hbEVycm9yKGVycm9yKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN1bHRhIGVsIGVzdGFkbyBkZWwgcHJvY2VzbyBkZSBleHBvcnRhY2nDs24gWE1MIHBvciByZXF1ZXN0SWRcclxuICAgKiBcclxuICAgKiBDb25zdWx0YSBlbCBlc3RhZG8gZGVzZGUgRHluYW1vREIgZG9uZGUgZWwgcG9sbGluZyBwcm9jZXNzIGxvIGFjdHVhbGl6YS5cclxuICAgKi9cclxuICBhc3luYyBnZXRYbWxFeHBvcnRTdGF0dXMocmVxdWVzdElkOiBzdHJpbmcpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIENvbnN1bHRhciBEeW5hbW9EQlxyXG4gICAgICBjb25zdCBzdGF0dXNSZWNvcmQgPSBhd2FpdCB0aGlzLmV4cG9ydFN0YXR1c1NlcnZpY2UuZ2V0U3RhdHVzKHJlcXVlc3RJZCk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoIXN0YXR1c1JlY29yZCkge1xyXG4gICAgICAgIHRocm93IG5ldyBOb3RGb3VuZEV4Y2VwdGlvbihcclxuICAgICAgICAgIGBObyBzZSBlbmNvbnRyw7MgdW4gcHJvY2VzbyBkZSBleHBvcnRhY2nDs24gWE1MIGNvbiBlbCByZXF1ZXN0SWQ6ICR7cmVxdWVzdElkfWBcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUmVzcG9uc2VVdGlsLnN1Y2Nlc3MoXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgcmVxdWVzdElkOiBzdGF0dXNSZWNvcmQucmVxdWVzdElkLFxyXG4gICAgICAgICAgc3RhdHVzOiBzdGF0dXNSZWNvcmQuc3RhdHVzLFxyXG4gICAgICAgICAgY3JlYXRlZEF0OiBzdGF0dXNSZWNvcmQuY3JlYXRlZEF0LFxyXG4gICAgICAgICAgdXBkYXRlZEF0OiBzdGF0dXNSZWNvcmQudXBkYXRlZEF0LFxyXG4gICAgICAgICAgc2lnbmVkVXJsOiBzdGF0dXNSZWNvcmQuc2lnbmVkVXJsLFxyXG4gICAgICAgICAgZmlsZU5hbWU6IHN0YXR1c1JlY29yZC5maWxlTmFtZSxcclxuICAgICAgICAgIGVycm9yOiBzdGF0dXNSZWNvcmQuZXJyb3IsXHJcbiAgICAgICAgfSxcclxuICAgICAgICAnRXN0YWRvIGRlbCBwcm9jZXNvIGRlIGV4cG9ydGFjacOzbiBYTUwnXHJcbiAgICAgICk7XHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEh0dHBFeGNlcHRpb24gfHwgZXJyb3IgaW5zdGFuY2VvZiBOb3RGb3VuZEV4Y2VwdGlvbikge1xyXG4gICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICB9XHJcbiAgICAgIHRocm93IFJlc3BvbnNlVXRpbC5pbnRlcm5hbEVycm9yKGVycm9yKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIGNsb3NlTWFuaWZlc3RTeW5jKHBheWxvYWQ6IENsb3NlTWFuaWZlc3REdG8pIHtcclxuICAgIC8qXHJcbiAgICAgKiBBTEdPUklUTU8gREUgUFJPQ0VTQU1JRU5UTyBERSBET0NVTUVOVE9TIFJFRkVSRU5DSUFET1M6XHJcbiAgICAgKlxyXG4gICAgICogRXN0ZSBibG9xdWUgcHJvY2VzYSBjYWRhIGRvY3VtZW50byByZWxhY2lvbmFkbyAoQkwsIEdBIG8gR1RJTUUpIHF1ZSBmdWUgZW5jb250cmFkb1xyXG4gICAgICogZW4gbGEgY29uc3VsdGEgYW50ZXJpb3IgeSBhbG1hY2VuYWRvIGVuIGxhIGNvbGVjY2nDs24gQ29sUmVmZXJlbmNpYXMuXHJcbiAgICAgKlxyXG4gICAgICogUGFzb3MgZGVsIGFsZ29yaXRtbzpcclxuICAgICAqIDEuIFZlcmlmaWNhciBxdWUgZXhpc3RhbiBkb2N1bWVudG9zIHJlZmVyZW5jaWFkb3MgZW4gbGEgY29sZWNjacOzblxyXG4gICAgICogMi4gSXRlcmFyIHNvYnJlIGNhZGEgZG9jdW1lbnRvIHJlZmVyZW5jaWFkbyBlbmNvbnRyYWRvXHJcbiAgICAgKiAzLiBFeHRyYWVyIGVsIElEIGRlbCBkb2N1bWVudG8gZGVzZGUgZWwgSGFzaHRhYmxlXHJcbiAgICAgKiA0LiBDb25zb2xpZGFyIGVsIGRvY3VtZW50byAoQkwvR0EvR1RJTUUpIC0gYWN0dWFsaXphIGVzdGFkb3MgeSByZWxhY2lvbmVzXHJcbiAgICAgKiA1LiBDZXJyYXIgbGFzIGFjdGl2aWRhZGVzIGRlbCBkb2N1bWVudG8gZW4gZWwgd29ya2Zsb3cgLSBmaW5hbGl6YSBwcm9jZXNvcyBwZW5kaWVudGVzXHJcbiAgICAgKlxyXG4gICAgICogUHJvcMOzc2l0bzogQWwgY29uc29saWRhciB1biBtYW5pZmllc3RvLCBzZSBkZWJlbiBwcm9jZXNhciB0b2RvcyBsb3MgZG9jdW1lbnRvc1xyXG4gICAgICogYXNvY2lhZG9zIChCTHMsIEdBcywgZXRjLikgcGFyYSBhY3R1YWxpemFyIHN1cyBlc3RhZG9zIHkgY2VycmFyIHN1cyBhY3RpdmlkYWRlc1xyXG4gICAgICogZW4gZWwgc2lzdGVtYSBkZSB3b3JrZmxvdy5cclxuICAgICAqL1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgeyBkb2N1bWVudG9JZCB9ID0gcGF5bG9hZDtcclxuXHJcbiAgICAgIC8vIE9idGVuZXIgZHJpdmVyIHVuYSB2ZXogKHJldXRpbGl6YWJsZSBwYXJhIG3Dumx0aXBsZXMgY29uc3VsdGFzKVxyXG4gICAgICBjb25zdCBkcml2ZXIgPSB0aGlzLmRhdGFTb3VyY2UuZHJpdmVyO1xyXG5cclxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgIC8vIFBBU08gMDE6IFZlcmlmaWNhciBxdWUgZWwgZXN0YWRvIGRlbCBtYW5pZmllc3RvIHNlYSBBQ0VQVEFETyB5IHJldmlzYWRvIGRpZ2EgTk9cclxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgIGNvbnN0IHBhc28wUGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcclxuICAgICAgICBwX2lkX2RvY3VtZW50bzogZG9jdW1lbnRvSWQsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCBwYXNvMFNxbCA9IGBcclxuICAgICAgICBXSVRIIGZlY2hhX21heF9lc3RhZG9zX21hbmlmaWVzdG8gQVMgKFxyXG4gICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICBkZXQuRE9DVU1FTlRPLFxyXG4gICAgICAgICAgICBNQVgoZGV0LkZFQ0hBQUNUSVZBKSBBUyBtYXhfZmVjaGFhY3RpdmFcclxuICAgICAgICAgIEZST00gRE9DVU1FTlRPUy5ET0NFU1RBRE9TIGRldFxyXG4gICAgICAgICAgV0hFUkUgZGV0LlRJUE9ET0NVTUVOVE8gPSAnTUZUT0MnXHJcbiAgICAgICAgICAgIEFORCBkZXQuQUNUSVZBID0gJ1MnXHJcbiAgICAgICAgICAgIEFORCBkZXQuVElQT0VTVEFETyBOT1QgSU4gKCdGUExBWk8nLCdDT04gTUFSQ0EnLCdWSVMnLCdSRUMnKVxyXG4gICAgICAgICAgICBBTkQgZGV0LlRJUE9FU1RBRE8gSU4gKCdBQ1AnLCdBTlUnLCdDTVAnLCdBQ0wnLCdNT0QnLCdDTVBGUCcsICdBQ0xQJylcclxuICAgICAgICAgIEdST1VQIEJZIGRldC5ET0NVTUVOVE9cclxuICAgICAgICApLFxyXG4gICAgICAgIGVzdGFkb19tYXhfdGlwb19tYW5pZmllc3RvIEFTIChcclxuICAgICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgICAgZGV0LkRPQ1VNRU5UTyxcclxuICAgICAgICAgICAgTUFYKGRldC5USVBPRVNUQURPKSBBUyBtYXhfdGlwb2VzdGFkbyxcclxuICAgICAgICAgICAgZGV0LkZFQ0hBQUNUSVZBIEFTIGZlY2hhYWN0aXZhXHJcbiAgICAgICAgICBGUk9NIERPQ1VNRU5UT1MuRE9DRVNUQURPUyBkZXRcclxuICAgICAgICAgIEpPSU4gZmVjaGFfbWF4X2VzdGFkb3NfbWFuaWZpZXN0byBmbWVtIE9OIGZtZW0uRE9DVU1FTlRPID0gZGV0LkRPQ1VNRU5UTyBcclxuICAgICAgICAgICAgQU5EIGZtZW0ubWF4X2ZlY2hhYWN0aXZhID0gZGV0LkZFQ0hBQUNUSVZBXHJcbiAgICAgICAgICBXSEVSRSBkZXQuVElQT0RPQ1VNRU5UTyA9ICdNRlRPQydcclxuICAgICAgICAgICAgQU5EIGRldC5BQ1RJVkEgPSAnUydcclxuICAgICAgICAgICAgQU5EIGRldC5USVBPRVNUQURPIElOICgnQUNQJywnQU5VJywnQ01QJywnQUNMJywnTU9EJywnQ01QRlAnLCAnQUNMUCcpXHJcbiAgICAgICAgICBHUk9VUCBCWSBkZXQuRE9DVU1FTlRPLCBkZXQuRkVDSEFBQ1RJVkFcclxuICAgICAgICApLFxyXG4gICAgICAgIGVzdGFkb3Nfb3JkZW5hZG9zIEFTIChcclxuICAgICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgICAgZW10LkRPQ1VNRU5UTyxcclxuICAgICAgICAgICAgZW10Lm1heF90aXBvZXN0YWRvIEFTIFRJUE9FU1RBRE8sXHJcbiAgICAgICAgICAgIGR0ZS5OT01CUkUsXHJcbiAgICAgICAgICAgIGVtdC5mZWNoYWFjdGl2YSBBUyBGRUNIQSxcclxuICAgICAgICAgICAgUk9XX05VTUJFUigpIE9WRVIgKFBBUlRJVElPTiBCWSBlbXQuRE9DVU1FTlRPIE9SREVSIEJZIGVtdC5mZWNoYWFjdGl2YSBERVNDKSBBUyByblxyXG4gICAgICAgICAgRlJPTSBlc3RhZG9fbWF4X3RpcG9fbWFuaWZpZXN0byBlbXRcclxuICAgICAgICAgIEpPSU4gRE9DVU1FTlRPUy5ET0NUSVBPRVNUQURPIGR0ZSBPTiBlbXQubWF4X3RpcG9lc3RhZG8gPSBkdGUuQ09ESUdPXHJcbiAgICAgICAgICBXSEVSRSBkdGUuVElQT0RPQ1VNRU5UTyA9ICdNRlRPQydcclxuICAgICAgICApXHJcbiAgICAgICAgU0VMRUNUXHJcbiAgICAgICAgICBkZC5JRCBBUyBJRCxcclxuICAgICAgICAgIGVvLlRJUE9FU1RBRE8gQVMgVElQT19FU1RBRE8sXHJcbiAgICAgICAgICBlby5OT01CUkUgQVMgRVNUQURPLFxyXG4gICAgICAgICAgQ0FTRSBcclxuICAgICAgICAgICAgV0hFTiBFWElTVFMgKFxyXG4gICAgICAgICAgICAgIFNFTEVDVCAxIFxyXG4gICAgICAgICAgICAgIEZST00gRE9DVU1FTlRPUy5ET0NFU1RBRE9TIGVzdCBcclxuICAgICAgICAgICAgICBXSEVSRSBlc3QudGlwb2RvY3VtZW50byA9IGRkLnRpcG9kb2N1bWVudG8gXHJcbiAgICAgICAgICAgICAgICBBTkQgZXN0LmRvY3VtZW50byA9IGRkLmlkIFxyXG4gICAgICAgICAgICAgICAgQU5EIGVzdC50aXBvZXN0YWRvID0gJ1ZJUycgXHJcbiAgICAgICAgICAgICAgICBBTkQgZXN0LmFjdGl2YSA9ICdTJ1xyXG4gICAgICAgICAgICApIFRIRU4gJ1NJJ1xyXG4gICAgICAgICAgICBFTFNFICdOTydcclxuICAgICAgICAgIEVORCBBUyBSRVZJU0FETyxcclxuICAgICAgICAgIGRkLlRJUE9ET0NVTUVOVE8gQVMgVElQT0RPQ1VNRU5UT1xyXG4gICAgICAgIEZST00gRE9DVU1FTlRPUy5ET0NET0NVTUVOVE9CQVNFIGRkXHJcbiAgICAgICAgSk9JTiBET0NUUkFOU1BPUlRFLkRPQ1RSQU5NQU5JRklFU1RPIGR0bSBPTiBkZC5JRCA9IGR0bS5JRFxyXG4gICAgICAgIEpPSU4gZXN0YWRvc19vcmRlbmFkb3MgZW8gT04gZGQuSUQgPSBlby5ET0NVTUVOVE8gQU5EIGVvLnJuID0gMVxyXG4gICAgICAgIFdIRVJFIGRkLklEID0gOnBfaWRfZG9jdW1lbnRvXHJcbiAgICAgIGA7XHJcblxyXG4gICAgICBjb25zdCBbZXNjYXBlZFBhc28wUXVlcnksIGVzY2FwZWRQYXNvMFBhcmFtc10gPVxyXG4gICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKHBhc28wU3FsLCBwYXNvMFBhcmFtcywge30pO1xyXG5cclxuICAgICAgY29uc3QgcGFzbzBSb3dzID0gYXdhaXQgdGhpcy5kYXRhU291cmNlLnF1ZXJ5KFxyXG4gICAgICAgIGVzY2FwZWRQYXNvMFF1ZXJ5LFxyXG4gICAgICAgIGVzY2FwZWRQYXNvMFBhcmFtc1xyXG4gICAgICApO1xyXG5cclxuICAgICAgLy8gVmFsaWRhciBxdWUgZWwgZG9jdW1lbnRvIGV4aXN0ZVxyXG4gICAgICBpZiAoIXBhc28wUm93cyB8fCBwYXNvMFJvd3MubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIFJlc3BvbnNlVXRpbC5zdWNjZXNzKFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBkb2N1bWVudG9JZCxcclxuICAgICAgICAgICAgdmFsaWRvOiBmYWxzZSxcclxuICAgICAgICAgICAgbWVzc2FnZTogXCJFbCBkb2N1bWVudG8gbm8gZXhpc3RlIG8gbm8gZXMgdW4gbWFuaWZpZXN0byB2w6FsaWRvXCIsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgXCJEb2N1bWVudG8gbm8gZW5jb250cmFkb1wiXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgZG9jdW1lbnRvSW5mbyA9IHBhc28wUm93c1swXTtcclxuICAgICAgY29uc3QgZXN0YWRvID0gZG9jdW1lbnRvSW5mbz8uRVNUQURPIHx8IGRvY3VtZW50b0luZm8/LmVzdGFkbztcclxuICAgICAgY29uc3QgdGlwb19lc3RhZG8gPVxyXG4gICAgICAgIGRvY3VtZW50b0luZm8/LlRJUE9fRVNUQURPIHx8IGRvY3VtZW50b0luZm8/LnRpcG9fZXN0YWRvO1xyXG4gICAgICBjb25zdCByZXZpc2FkbyA9IGRvY3VtZW50b0luZm8/LlJFVklTQURPIHx8IGRvY3VtZW50b0luZm8/LnJldmlzYWRvO1xyXG5cclxuICAgICAgLy8gVmFsaWRhciBxdWUgZWwgZXN0YWRvIHNlYSBcIkFDRVBUQURPXCIgKGxhIGNvbnN1bHRhIHlhIHRyYWUgZWwgbm9tYnJlIGRlbCBlc3RhZG8pXHJcbiAgICAgIGNvbnN0IGVzdGFkb0FjZXB0YWRvID0gZXN0YWRvICYmIGVzdGFkby50b1VwcGVyQ2FzZSgpID09PSBcIkFDRVBUQURPXCI7XHJcblxyXG4gICAgICAvLyBWYWxpZGFyIHRhbWJpw6luIHBvciBlbCBjw7NkaWdvIGRlbCB0aXBvIGRlIGVzdGFkbyAoYW1iYXMgZGViZW4gY29uY29yZGFyKVxyXG4gICAgICBjb25zdCB0aXBvRXN0YWRvQWNlcHRhZG8gPVxyXG4gICAgICAgIHRpcG9fZXN0YWRvICYmXHJcbiAgICAgICAgKHRpcG9fZXN0YWRvLnRvVXBwZXJDYXNlKCkuaW5jbHVkZXMoXCJBQ1BcIikgfHwgdGlwb19lc3RhZG8gPT09IFwiQUNQXCIpO1xyXG5cclxuICAgICAgaWYgKCFlc3RhZG9BY2VwdGFkbyB8fCAhdGlwb0VzdGFkb0FjZXB0YWRvKSB7XHJcbiAgICAgICAgcmV0dXJuIFJlc3BvbnNlVXRpbC5zdWNjZXNzKFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBkb2N1bWVudG9JZCxcclxuICAgICAgICAgICAgdmFsaWRvOiBmYWxzZSxcclxuICAgICAgICAgICAgZXN0YWRvOiBlc3RhZG8sXHJcbiAgICAgICAgICAgIHJldmlzYWRvOiByZXZpc2FkbyxcclxuICAgICAgICAgICAgbWVzc2FnZTogYEVsIG1hbmlmaWVzdG8gbm8gZXN0w6EgZW4gZXN0YWRvIEFjZXB0YWRvLiBFc3RhZG8gYWN0dWFsOiAke2VzdGFkb31gLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIFwiRXN0YWRvIG5vIHbDoWxpZG8gcGFyYSBjZXJyYXIgbWFuaWZpZXN0b1wiXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gVmFsaWRhciBxdWUgbm8gZXN0w6kgcmV2aXNhZG9cclxuICAgICAgaWYgKHJldmlzYWRvID09PSBcIlNJXCIgfHwgcmV2aXNhZG8gPT09IFwic2lcIiB8fCByZXZpc2FkbyA9PT0gXCJTaVwiKSB7XHJcbiAgICAgICAgcmV0dXJuIFJlc3BvbnNlVXRpbC5zdWNjZXNzKFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBkb2N1bWVudG9JZCxcclxuICAgICAgICAgICAgdmFsaWRvOiBmYWxzZSxcclxuICAgICAgICAgICAgZXN0YWRvOiBlc3RhZG8sXHJcbiAgICAgICAgICAgIHJldmlzYWRvOiByZXZpc2FkbyxcclxuICAgICAgICAgICAgbWVzc2FnZTogXCJFbCBtYW5pZmllc3RvIHlhIGZ1ZSByZXZpc2Fkbywgbm8gc2UgcHVlZGUgY2VycmFyXCIsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgXCJNYW5pZmllc3RvIHlhIHJldmlzYWRvXCJcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiUGFzbyBlbCBwYXNvIDAxXCIpO1xyXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgLy8gUEFTTyAwMjogVmVyaWZpY2FyIHF1ZSBlbCBlc3RhZG8gZGVsIG1hbmlmaWVzdG8gbm8gZXN0w6kgYW51bGFkb1xyXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgLypcclxuICAgICAgY29uc3QgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcclxuICAgICAgICBkb2N1bWVudG9JZDogZG9jdW1lbnRvSWQsXHJcbiAgICAgICAgdGlwb0VzdGFkbzogXCJBTlVcIixcclxuICAgICAgICBhY3RpdmE6IFwiU1wiLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgY2hlY2tBbnVsYWRvU3FsID0gYFxyXG4gICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgIGRlLkRPQ1VNRU5UTyxcclxuICAgICAgICAgIGRlLlRJUE9ET0NVTUVOVE8sXHJcbiAgICAgICAgICBkZS5USVBPRVNUQURPLFxyXG4gICAgICAgICAgZGUuRkVDSEEsXHJcbiAgICAgICAgICBkZS5JRFVTVUFSSU8sXHJcbiAgICAgICAgICBkdGUuTk9NQlJFXHJcbiAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRPQ0VTVEFET1MgZGVcclxuICAgICAgICBKT0lOIERPQ1VNRU5UT1MuRE9DVElQT0VTVEFETyBkdGUgXHJcbiAgICAgICAgICBPTiBkZS5USVBPRE9DVU1FTlRPID0gZHRlLlRJUE9ET0NVTUVOVE9cclxuICAgICAgICAgIEFORCBkZS5USVBPRVNUQURPID0gZHRlLkNPRElHT1xyXG4gICAgICAgIFdIRVJFIGRlLkRPQ1VNRU5UTyA9IDpkb2N1bWVudG9JZFxyXG4gICAgICAgICAgQU5EIGRlLlRJUE9FU1RBRE8gPSA6dGlwb0VzdGFkb1xyXG4gICAgICAgICAgQU5EIGR0ZS5BQ1RJVkEgPSA6YWN0aXZhXHJcbiAgICAgICAgICBBTkQgZGUuQUNUSVZBID0gOmFjdGl2YVxyXG4gICAgICBgO1xyXG5cclxuICAgICAgY29uc3QgW2VzY2FwZWRRdWVyeSwgZXNjYXBlZFBhcmFtc10gPSBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICBjaGVja0FudWxhZG9TcWwsXHJcbiAgICAgICAgcGFyYW1zLFxyXG4gICAgICAgIHt9XHJcbiAgICAgICk7XHJcblxyXG4gICAgICBjb25zdCBlc3RhZG9BbnVsYWRvUm93cyA9IGF3YWl0IHRoaXMuZGF0YVNvdXJjZS5xdWVyeShcclxuICAgICAgICBlc2NhcGVkUXVlcnksXHJcbiAgICAgICAgZXNjYXBlZFBhcmFtc1xyXG4gICAgICApO1xyXG5cclxuICAgICAgY29uc3QgZXN0YUFudWxhZG8gPSBlc3RhZG9BbnVsYWRvUm93cyAmJiBlc3RhZG9BbnVsYWRvUm93cy5sZW5ndGggPiAwO1xyXG4gICAgICAqL1xyXG4gICAgICBjb25zdCBlc3RhQW51bGFkbyA9XHJcbiAgICAgICAgdGlwb19lc3RhZG8gJiYgdGlwb19lc3RhZG8udG9VcHBlckNhc2UoKSA9PT0gXCJBTlVcIjtcclxuXHJcbiAgICAgIC8vIDIuIFNpIHRpZW5lIGVzdGFkbyBhbnVsYWRvLCBubyBlamVjdXRhciBlbCBwcm9jZXNvXHJcbiAgICAgIGlmIChlc3RhQW51bGFkbykge1xyXG4gICAgICAgIHJldHVybiBSZXNwb25zZVV0aWwuc3VjY2VzcyhcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgZG9jdW1lbnRvSWQsXHJcbiAgICAgICAgICAgIGVzdGFBbnVsYWRvOiB0cnVlLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBcIkVsIG1hbmlmaWVzdG8gZXN0w6EgYW51bGFkbywgbm8gc2UgcHVlZGUgY2VycmFyXCIsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgXCJNYW5pZmllc3RvIGFudWxhZG9cIlxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc29sZS5sb2coXCJQYXNvIGVsIHBhc28gMDJcIik7XHJcblxyXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgLy8gUEFTTyAwMzogVmVyaWZpY2FyIHF1ZSBlbCB0aXBvIGRlIG1hbmlmaWVzdG8gc2VhIE1GVE9DIHkgY3JlYXIgdmFyaWFibGUgR1RJTUVcclxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgIGNvbnN0IHRpcG9Eb2N1bWVudG8gPVxyXG4gICAgICAgIGRvY3VtZW50b0luZm8/LlRJUE9ET0NVTUVOVE8gfHwgZG9jdW1lbnRvSW5mbz8udGlwb2RvY3VtZW50byB8fCBudWxsO1xyXG5cclxuICAgICAgLy8gNC4gQ29tcGFyYXIgcXVlIHNlYSBNRlRPQyBwYXJhIGJ1c2NhciBsYXMgZ3XDrWFzXHJcbiAgICAgIGxldCB0aXBvRG9jVDogc3RyaW5nIHwgbnVsbCA9IG51bGw7IC8vIFZhcmlhYmxlIHBhcmEgdHJhYmFqYXIgY29uIGVsIHRpcG8gZGUgZG9jdW1lbnRvIHJlbGFjaW9uYWRvXHJcblxyXG4gICAgICBpZiAodGlwb0RvY3VtZW50byA9PT0gXCJNRlRPQ1wiKSB7XHJcbiAgICAgICAgdGlwb0RvY1QgPSBcIkdUSU1FXCI7IC8vIFNpIGVzIE1GVE9DLCB0cmFiYWphbW9zIGNvbiBndcOtYXMgdGlwbyBHVElNRVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBTaSBubyBlcyBNRlRPQywgbm8gc2UgcHVlZGUgY2VycmFyIGVsIG1hbmlmaWVzdG9cclxuICAgICAgaWYgKHRpcG9Eb2N1bWVudG8gIT09IFwiTUZUT0NcIikge1xyXG4gICAgICAgIHJldHVybiBSZXNwb25zZVV0aWwuc3VjY2VzcyhcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgZG9jdW1lbnRvSWQsXHJcbiAgICAgICAgICAgIHZhbGlkbzogZmFsc2UsXHJcbiAgICAgICAgICAgIHRpcG9Eb2N1bWVudG86IHRpcG9Eb2N1bWVudG8sXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBFbCBkb2N1bWVudG8gbm8gZXMgdW4gbWFuaWZpZXN0byBNRlRPQy4gVGlwbyBkZSBkb2N1bWVudG86ICR7dGlwb0RvY3VtZW50b31gLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIFwiVGlwbyBkZSBkb2N1bWVudG8gbm8gdsOhbGlkb1wiXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zb2xlLmxvZyhcIlBhc28gZWwgcGFzbyAwM1wiKTtcclxuXHJcbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAvLyBQQVNPIDA0OiBCdXNjYXIgdG9kYXMgbGFzIEd1w61hcyBBc29jaWFkYXMgYWwgbWFuaWZpZXN0b1xyXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgY29uc3QgYnVzY2FyRG9jdW1lbnRvc1JlbGFjaW9uYWRvc1NxbCA9IGBcclxuICAgICAgICBTRUxFQ1QgRElTVElOQ1QgUi5Eb2NPcmlnZW4gQVMgSWRcclxuICAgICAgICBGUk9NIERPQ1VNRU5UT1MuRE9DUkVMQUNJT05ET0NVTUVOVE8gUlxyXG4gICAgICAgIEpPSU4gRE9DVU1FTlRPUy5ET0NET0NVTUVOVE9CQVNFIEQgT04gUi5Eb2NPcmlnZW4gPSBELklkXHJcbiAgICAgICAgV0hFUkUgUi5Eb2NEZXN0aW5vID0gOmlkTWFuaWZpZXN0b1xyXG4gICAgICAgICAgQU5EIFIuVGlwb1JlbGFjaW9uID0gJ1JFRidcclxuICAgICAgICAgIEFORCBELlRpcG9Eb2N1bWVudG8gPSA6dGlwb0RvY1RcclxuICAgICAgICAgIEFORCBOT1QgRVhJU1RTIChcclxuICAgICAgICAgICAgU0VMRUNUIDFcclxuICAgICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRPQ0VTVEFET1MgRVxyXG4gICAgICAgICAgICBXSEVSRSBFLmRvY3VtZW50byA9IFIuRG9jT3JpZ2VuXHJcbiAgICAgICAgICAgICAgQU5EIEUuVGlwb0VzdGFkbyA9ICdBTlUnXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgICBBTkQgRC5BY3Rpdm8gPSAnUydcclxuICAgICAgYDtcclxuXHJcbiAgICAgIGNvbnN0IGRvY3VtZW50b3NSZWxhY2lvbmFkb3NQYXJhbXM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xyXG4gICAgICAgIGlkTWFuaWZpZXN0bzogZG9jdW1lbnRvSWQsXHJcbiAgICAgICAgdGlwb0RvY1Q6IHRpcG9Eb2NULFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgW2VzY2FwZWRSZWxhY2lvbmFkb3NRdWVyeSwgZXNjYXBlZFJlbGFjaW9uYWRvc1BhcmFtc10gPVxyXG4gICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgYnVzY2FyRG9jdW1lbnRvc1JlbGFjaW9uYWRvc1NxbCxcclxuICAgICAgICAgIGRvY3VtZW50b3NSZWxhY2lvbmFkb3NQYXJhbXMsXHJcbiAgICAgICAgICB7fVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICBjb25zdCBkb2N1bWVudG9zUmVsYWNpb25hZG9zUm93cyA9IGF3YWl0IHRoaXMuZGF0YVNvdXJjZS5xdWVyeShcclxuICAgICAgICBlc2NhcGVkUmVsYWNpb25hZG9zUXVlcnksXHJcbiAgICAgICAgZXNjYXBlZFJlbGFjaW9uYWRvc1BhcmFtc1xyXG4gICAgICApO1xyXG5cclxuICAgICAgLy8gRXh0cmFlciBsb3MgSURzIGRlIGxvcyBkb2N1bWVudG9zIHJlbGFjaW9uYWRvc1xyXG4gICAgICBjb25zdCBpZHNEb2N1bWVudG9zUmVsYWNpb25hZG9zID1cclxuICAgICAgICBkb2N1bWVudG9zUmVsYWNpb25hZG9zUm93cz8ubWFwKFxyXG4gICAgICAgICAgKHJvdzogYW55KSA9PiByb3cuSWQgfHwgcm93LmlkIHx8IHJvdy5JRFxyXG4gICAgICAgICkgfHwgW107XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICBcIkRvY3VtZW50b3MgcmVsYWNpb25hZG9zIGVuY29udHJhZG9zOlwiLFxyXG4gICAgICAgIGlkc0RvY3VtZW50b3NSZWxhY2lvbmFkb3MubGVuZ3RoXHJcbiAgICAgICk7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiUGFzbyBlbCBwYXNvIDA0XCIsIGlkc0RvY3VtZW50b3NSZWxhY2lvbmFkb3MpO1xyXG4gICAgICAvKiovXHJcbiAgICAgIC8vIElOSUNJQVIgUFJPQ0VTTyBERSBUUkFOU0FDQ0lPTkVTIERFIEJEXHJcbiAgICAgIC8vIENyZWFyIFF1ZXJ5UnVubmVyIHBhcmEgbWFuZWphciBsYSB0cmFuc2FjY2nDs25cclxuICAgICAgY29uc3QgcXVlcnlSdW5uZXI6IFF1ZXJ5UnVubmVyID0gdGhpcy5kYXRhU291cmNlLmNyZWF0ZVF1ZXJ5UnVubmVyKCk7XHJcbiAgICAgIGF3YWl0IHF1ZXJ5UnVubmVyLmNvbm5lY3QoKTtcclxuICAgICAgYXdhaXQgcXVlcnlSdW5uZXIuc3RhcnRUcmFuc2FjdGlvbigpO1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICAvLyBDb25zb2xpZGFjacOzbiBkZSBndcOtYXM6IFBvciBjYWRhIEd1w61hIGFzb2NpYWRhIGFsIG1hbmlmaWVzdG9cclxuICAgICAgICBjb25zdCBkb2N1bWVudG9zUGFyYUNvbnNvbGlkYXI6IG51bWJlcltdID0gW107XHJcblxyXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgIC8vIFBBU08gMDU6IFZlcmlmaWNhciBzaSBsYSBndWlhIHF1ZSBzZSB0cmFiYWphIGVuIGVsIG1vbWVudG8gZGVsIGNpY2xvIGVzdMOhIGFudWxhZGEgYW50ZXMgZGUgY29uc29saWRhclxyXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgIGNvbnN0IG9idGVuZXJFc3RhZG9zRG9jdW1lbnRvU3FsID0gYFxyXG4gICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICBEb2NFc3RhZG9zLkRvY3VtZW50bywgXHJcbiAgICAgICAgICAgIERvY0VzdGFkb3MuVGlwb0RvY3VtZW50bywgXHJcbiAgICAgICAgICAgIERvY0VzdGFkb3MuVGlwb0VzdGFkbywgXHJcbiAgICAgICAgICAgIERvY0VzdGFkb3MuRmVjaGEsIFxyXG4gICAgICAgICAgICBEb2NFc3RhZG9zLklkVXN1YXJpbywgXHJcbiAgICAgICAgICAgIERvY1RpcG9Fc3RhZG8uTm9tYnJlIFxyXG4gICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRvY0VzdGFkb3MsIERPQ1VNRU5UT1MuRG9jVGlwb0VzdGFkbyBcclxuICAgICAgICAgIFdIRVJFIERvY0VzdGFkb3MuRG9jdW1lbnRvID0gOmlkRG9jdW1lbnRvIFxyXG4gICAgICAgICAgICBBTkQgRG9jRXN0YWRvcy5UaXBvRG9jdW1lbnRvID0gRG9jVGlwb0VzdGFkby5UaXBvRG9jdW1lbnRvIFxyXG4gICAgICAgICAgICBBTkQgRG9jRXN0YWRvcy5UaXBvRXN0YWRvID0gRG9jVGlwb0VzdGFkby5Db2RpZ28gXHJcbiAgICAgICAgICAgIEFORCBEb2NUaXBvRXN0YWRvLkFjdGl2YSA9ICdTJyBcclxuICAgICAgICAgICAgQU5EIERvY0VzdGFkb3MuQWN0aXZhID0gJ1MnXHJcbiAgICAgICAgYDtcclxuICAgICAgICBcclxuICAgICAgICAvKiogKi9cclxuICAgICAgICBmb3IgKGNvbnN0IGlkRG9jdW1lbnRvIG9mIGlkc0RvY3VtZW50b3NSZWxhY2lvbmFkb3MpIHtcclxuICAgICAgICAgIC8vIEZsdWpvIGlndWFsIGFsIGNvbWVudGFyaW86IGJvb2xlYW4gRXN0YUFudWxhZG8gPSBkb2N1bWVudG9zREFPLmdldERvY1RpZW5lRXN0YWRvKGlkQkwudG9TdHJpbmcoKSwgXCJBTlVcIik7XHJcbiAgICAgICAgICAvLyBFamVjdXRhciBjb25zdWx0YSBkZSBlc3RhZG9zIHBhcmEgZXN0ZSBkb2N1bWVudG9cclxuICAgICAgICAgIGNvbnN0IFtlc2NhcGVkRXN0YWRvc1F1ZXJ5LCBlc2NhcGVkRXN0YWRvc1BhcmFtc10gPVxyXG4gICAgICAgICAgICBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICAgICAgICBvYnRlbmVyRXN0YWRvc0RvY3VtZW50b1NxbCxcclxuICAgICAgICAgICAgICB7IGlkRG9jdW1lbnRvOiBpZERvY3VtZW50byB9LFxyXG4gICAgICAgICAgICAgIHt9XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgY29uc3QgZXN0YWRvc1Jvd3MgPSBhd2FpdCBxdWVyeVJ1bm5lci5xdWVyeShcclxuICAgICAgICAgICAgZXNjYXBlZEVzdGFkb3NRdWVyeSxcclxuICAgICAgICAgICAgZXNjYXBlZEVzdGFkb3NQYXJhbXNcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgLy8gVmVyaWZpY2FyIHNpIHRpZW5lIGVzdGFkbyAnQU5VJyAoc2ltaWxhciBhbCB3aGlsZShyc2V0Lm5leHQoKSkgZGVsIGNvbWVudGFyaW8pXHJcbiAgICAgICAgICBsZXQgZXN0YUFudWxhZG8gPSBmYWxzZTtcclxuICAgICAgICAgIGZvciAoY29uc3QgZXN0YWRvUm93IG9mIGVzdGFkb3NSb3dzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVzdGFkbyA9IGVzdGFkb1Jvdy5UaXBvRXN0YWRvIHx8IGVzdGFkb1Jvdy50aXBvZXN0YWRvO1xyXG4gICAgICAgICAgICAvLyBTaSBlbmN1ZW50cmEgZWwgZXN0YWRvICdBTlUnLCBtYXJjYSBjb21vIGFudWxhZG8gKGlndWFsIGFsIGNvbWVudGFyaW86IGlmKGVzdGFkby5lcXVhbHModGlwb0VzdGFkbykpIHJldHVybiB0cnVlKVxyXG4gICAgICAgICAgICBpZiAoZXN0YWRvID09PSBcIkFOVVwiKSB7XHJcbiAgICAgICAgICAgICAgZXN0YUFudWxhZG8gPSB0cnVlO1xyXG4gICAgICAgICAgICAgIGJyZWFrOyAvLyBTaW1pbGFyIGFsIHJldHVybiB0cnVlIGRlbCBjb21lbnRhcmlvXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBTaSBlc3TDoSBhbnVsYWRvLCBvbWl0aXIgZGVsIHByb2Nlc28gZGUgY29uc29saWRhY2nDs24gKGlndWFsIGFsIGNvbWVudGFyaW86IGlmIChFc3RhQW51bGFkbykgcmV0dXJuOylcclxuICAgICAgICAgIGlmIChlc3RhQW51bGFkbykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICBgW0NPTlNPTElEQUNJT05dIERvY3VtZW50byAke2lkRG9jdW1lbnRvfSBBTlVMQURPIG5vIHNlIENPTlNPTElEQWBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgY29udGludWU7IC8vIFNpbWlsYXIgYWwgcmV0dXJuIGRlbCBjb21lbnRhcmlvLCBwZXJvIGNvbnRpbnVhbW9zIGNvbiBlbCBzaWd1aWVudGUgZG9jdW1lbnRvXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gU2kgbm8gZXN0w6EgYW51bGFkbywgYWdyZWdhcmxvIGEgbGEgbGlzdGEgcGFyYSBjb25zb2xpZGFyXHJcbiAgICAgICAgICBkb2N1bWVudG9zUGFyYUNvbnNvbGlkYXIucHVzaChpZERvY3VtZW50byk7XHJcblxyXG4gICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICAvLyBQQVNPIDA2OiBDYWxjdWxhciBlbCBNQVgoSUQpICsxIHBhcmEgZWwgZXN0YWRvIGNvbmZvcm1hZG9cclxuICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICAgY29uc3QgY2FsY3VsYXJNYXhJZEVzdGFkb1NxbCA9IGBcclxuICAgICAgICAgICAgU0VMRUNUIE1BWChJZCkgQVMgTWF4SWRcclxuICAgICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRvY0VzdGFkb3NcclxuICAgICAgICAgICAgV0hFUkUgRG9jdW1lbnRvID0gOmlkRG9jdW1lbnRvXHJcbiAgICAgICAgICAgICAgQU5EIFRpcG9Eb2N1bWVudG8gPSA6dGlwb0RvY1RcclxuICAgICAgICAgICAgICBBTkQgVGlwb0VzdGFkbyA9ICdDTVAnXHJcbiAgICAgICAgICBgO1xyXG5cclxuICAgICAgICAgIGNvbnN0IFtlc2NhcGVkTWF4SWRRdWVyeSwgZXNjYXBlZE1heElkUGFyYW1zXSA9XHJcbiAgICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgICAgIGNhbGN1bGFyTWF4SWRFc3RhZG9TcWwsXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWREb2N1bWVudG86IGlkRG9jdW1lbnRvLFxyXG4gICAgICAgICAgICAgICAgdGlwb0RvY1Q6IHRpcG9Eb2NULFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBjb25zdCBtYXhJZFJvd3MgPSBhd2FpdCBxdWVyeVJ1bm5lci5xdWVyeShcclxuICAgICAgICAgICAgZXNjYXBlZE1heElkUXVlcnksXHJcbiAgICAgICAgICAgIGVzY2FwZWRNYXhJZFBhcmFtc1xyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBsZXQgbmV4dElkRXN0YWRvID0gMTtcclxuXHJcbiAgICAgICAgICBpZiAobWF4SWRSb3dzICYmIG1heElkUm93cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJvdyA9IG1heElkUm93c1swXTtcclxuICAgICAgICAgICAgbGV0IG1heElkID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmIChyb3cuTUFYSUQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIG1heElkID0gcm93Lk1BWElEO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5NYXhJZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgbWF4SWQgPSByb3cuTWF4SWQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocm93Lm1heGlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICBtYXhJZCA9IHJvdy5tYXhpZDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChyb3cuTUFYX0lEICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICBtYXhJZCA9IHJvdy5NQVhfSUQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChtYXhJZCAhPT0gbnVsbCAmJiBtYXhJZCAhPT0gdW5kZWZpbmVkICYmIG1heElkICE9PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgbWF4SWROdW1iZXIgPSBOdW1iZXIobWF4SWQpO1xyXG4gICAgICAgICAgICAgIGlmICghaXNOYU4obWF4SWROdW1iZXIpKSB7XHJcbiAgICAgICAgICAgICAgICBuZXh0SWRFc3RhZG8gPSBtYXhJZE51bWJlciArIDE7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgIGBEb2N1bWVudG8gJHtpZERvY3VtZW50b306IFNpZ3VpZW50ZSBJZCBwYXJhIGVzdGFkbyBDTVAgc2Vyw6EgJHtuZXh0SWRFc3RhZG99YFxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICAgLy8gUEFTTyAwNzogQ3JlYXIgZWwgZXN0YWRvIGNvbiBlbCBJRCBnZW5lcmFkbyBhbnRlcmlvcm1lbnRlXHJcbiAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgIGNvbnN0IGZlY2hhQ29uc29saWRhY2lvbiA9IG5ldyBEYXRlKCk7IC8vIEZlY2hhIGFjdHVhbCBkZSBsYSBjb25zb2xpZGFjacOzblxyXG5cclxuICAgICAgICAgIGNvbnN0IGluc2VydGFyRXN0YWRvQ21wU3FsID0gYFxyXG4gICAgICAgICAgICBJTlNFUlQgSU5UTyBET0NVTUVOVE9TLkRvY0VzdGFkb3MoXHJcbiAgICAgICAgICAgICAgRG9jdW1lbnRvLCBcclxuICAgICAgICAgICAgICBUaXBvRG9jdW1lbnRvLCBcclxuICAgICAgICAgICAgICBUaXBvRXN0YWRvLCBcclxuICAgICAgICAgICAgICBJZCwgXHJcbiAgICAgICAgICAgICAgRmVjaGEsIFxyXG4gICAgICAgICAgICAgIE9ic2VydmFjaW9uLCBcclxuICAgICAgICAgICAgICBJZFVzdWFyaW8sIFxyXG4gICAgICAgICAgICAgIEFjdGl2YSwgXHJcbiAgICAgICAgICAgICAgRmVjaGFBY3RpdmEsIFxyXG4gICAgICAgICAgICAgIEZlY2hhRGVzYWN0aXZhXHJcbiAgICAgICAgICAgICkgVkFMVUVTIChcclxuICAgICAgICAgICAgICA6aWREb2N1bWVudG8sXHJcbiAgICAgICAgICAgICAgOnRpcG9Eb2NULFxyXG4gICAgICAgICAgICAgICdDTVAnLFxyXG4gICAgICAgICAgICAgIDpuZXh0SWRFc3RhZG8sXHJcbiAgICAgICAgICAgICAgOmZlY2hhQ29uc29saWRhY2lvbixcclxuICAgICAgICAgICAgICAnQ09ORk9STUFDSU9OIEdFTkVSQURBIEFVVE9NQVRJQ0FNRU5URSBQT1IgSVNJRE9SQSAnLFxyXG4gICAgICAgICAgICAgICdbYXV0b21hdGljb10nLFxyXG4gICAgICAgICAgICAgICdTJyxcclxuICAgICAgICAgICAgICA6ZmVjaGFDb25zb2xpZGFjaW9uLFxyXG4gICAgICAgICAgICAgIDpmZWNoYUNvbnNvbGlkYWNpb25cclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICBjb25zdCBbZXNjYXBlZEluc2VydFF1ZXJ5LCBlc2NhcGVkSW5zZXJ0UGFyYW1zXSA9XHJcbiAgICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgICAgIGluc2VydGFyRXN0YWRvQ21wU3FsLFxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlkRG9jdW1lbnRvOiBpZERvY3VtZW50byxcclxuICAgICAgICAgICAgICAgIHRpcG9Eb2NUOiB0aXBvRG9jVCxcclxuICAgICAgICAgICAgICAgIG5leHRJZEVzdGFkbzogbmV4dElkRXN0YWRvLFxyXG4gICAgICAgICAgICAgICAgZmVjaGFDb25zb2xpZGFjaW9uOiBmZWNoYUNvbnNvbGlkYWNpb24sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB7fVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KGVzY2FwZWRJbnNlcnRRdWVyeSwgZXNjYXBlZEluc2VydFBhcmFtcyk7XHJcblxyXG4gICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgIGBFc3RhZG8gQ01QIGluc2VydGFkbyBwYXJhIGRvY3VtZW50byAke2lkRG9jdW1lbnRvfSBjb24gSWQgJHtuZXh0SWRFc3RhZG99YFxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICAvLyBQQVNPIDA4OiBCdXNjYXIgcmVsYWNpb25lcyBwZW5kaWVudGVzIHBhcmEgbGEgZ3XDrWEgcXVlIHNlIGFjYWJhIGRlIHJlZ2lzdHJhclxyXG4gICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICBjb25zdCBidXNjYXJSZWxhY2lvbmVzUGVuZGllbnRlc1NxbCA9IGBcclxuICAgICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICAgIFIuVGlwb1JlbGFjaW9uIEFTIFRpcG9SZWxhY2lvbiwgXHJcbiAgICAgICAgICAgICAgUi5JZCBBUyBJZCwgXHJcbiAgICAgICAgICAgICAgRC5JZCBBUyBEb2NJZFxyXG4gICAgICAgICAgICBGUk9NIERPQ1VNRU5UT1MuRG9jUmVsYWNpb25Eb2N1bWVudG8gUiwgRE9DVU1FTlRPUy5Eb2NEb2N1bWVudG9CYXNlIERcclxuICAgICAgICAgICAgV0hFUkUgUi5Eb2NPcmlnZW4gPSA6aWREb2N1bWVudG8gXHJcbiAgICAgICAgICAgICAgQU5EIFIuRG9jRGVzdGlubyBJUyBOVUxMXHJcbiAgICAgICAgICAgICAgQU5EIEQuVGlwb0RvY3VtZW50byA9IFIuVGlwb0RvY0Rlc3Rpbm9cclxuICAgICAgICAgICAgICBBTkQgRC5OdW1lcm9FeHRlcm5vID0gUi5OdW1Eb2NEZXN0aW5vXHJcbiAgICAgICAgICAgICAgQU5EIEQuSWRFbWlzb3IgPSBSLkVtaXNvckRvY0Rlc3Rpbm9cclxuICAgICAgICAgICAgICBBTkQgRC5GZWNoYUVtaXNpb24gPSBSLkZlY2hhRG9jRGVzdGlub1xyXG4gICAgICAgICAgICAgIEFORCBELkFjdGl2byA9ICdTJyBcclxuICAgICAgICAgICAgICBBTkQgUi5BY3Rpdm8gPSAnUydcclxuICAgICAgICAgIGA7XHJcblxyXG4gICAgICAgICAgY29uc3QgW2VzY2FwZWRSZWxhY2lvbmVzUXVlcnksIGVzY2FwZWRSZWxhY2lvbmVzUGFyYW1zXSA9XHJcbiAgICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgICAgIGJ1c2NhclJlbGFjaW9uZXNQZW5kaWVudGVzU3FsLFxyXG4gICAgICAgICAgICAgIHsgaWREb2N1bWVudG86IGlkRG9jdW1lbnRvIH0sXHJcbiAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBjb25zdCByZWxhY2lvbmVzUGVuZGllbnRlc1Jvd3MgPSBhd2FpdCBxdWVyeVJ1bm5lci5xdWVyeShcclxuICAgICAgICAgICAgZXNjYXBlZFJlbGFjaW9uZXNRdWVyeSxcclxuICAgICAgICAgICAgZXNjYXBlZFJlbGFjaW9uZXNQYXJhbXNcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICBgRG9jdW1lbnRvICR7aWREb2N1bWVudG99OiBFbmNvbnRyYWRhcyAke1xyXG4gICAgICAgICAgICAgIHJlbGFjaW9uZXNQZW5kaWVudGVzUm93cz8ubGVuZ3RoIHx8IDBcclxuICAgICAgICAgICAgfSByZWxhY2lvbmVzIHBlbmRpZW50ZXNgXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJyZWxhY2lvbmVzUGVuZGllbnRlc1Jvd3NcIiwgcmVsYWNpb25lc1BlbmRpZW50ZXNSb3dzKTtcclxuXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIFBvciBjYWRhIHJlbGFjacOzbiBlbmNvbnRyYWRhIGEgbGEgZ3XDrWFcclxuICAgICAgICAgIGZvciAoY29uc3QgcmVsYWNpb25Sb3cgb2YgcmVsYWNpb25lc1BlbmRpZW50ZXNSb3dzIHx8IFtdKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgdGlwb1JlbGFjaW9uID1cclxuICAgICAgICAgICAgICAgIHJlbGFjaW9uUm93LlRpcG9SZWxhY2lvbiB8fCByZWxhY2lvblJvdy50aXBvcmVsYWNpb247XHJcbiAgICAgICAgICAgICAgY29uc3QgcmVsYWNpb25JZCA9IHJlbGFjaW9uUm93LklkIHx8IHJlbGFjaW9uUm93LmlkO1xyXG4gICAgICAgICAgICAgIGNvbnN0IGRvY0lkID0gcmVsYWNpb25Sb3cuRG9jSWQgfHwgcmVsYWNpb25Sb3cuZG9jaWQ7XHJcblxyXG4gICAgICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICAgICAgIC8vIFBBU08gMDk6IFNFTEVDVCAtIE9idGVuZXIgZWwgc2lndWllbnRlIGNvcnJlbGF0aXZvIHBhcmEgZWwgaGlzdG9yaWFsXHJcbiAgICAgICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICAgICAgY29uc3QgY2FsY3VsYXJOZXh0Q29ycmVsYXRpdmVTcWwgPSBgXHJcbiAgICAgICAgICAgICAgICBTRUxFQ1QgTUFYKElkKSBBUyBNYXhJZFxyXG4gICAgICAgICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRvY0hSZWxhY2lvbkRvY3VtZW50b1xyXG4gICAgICAgICAgICAgICAgV0hFUkUgVGlwb1JlbGFjaW9uID0gOnRpcG9SZWxhY2lvblxyXG4gICAgICAgICAgICAgICAgICBBTkQgRG9jT3JpZ2VuID0gOmlkRG9jdW1lbnRvXHJcbiAgICAgICAgICAgICAgICAgIEFORCBSZWxhY2lvbkRvY3VtZW50byA9IDpyZWxhY2lvbklkXHJcbiAgICAgICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgW2VzY2FwZWRDb3JyZWxhdGl2ZVF1ZXJ5LCBlc2NhcGVkQ29ycmVsYXRpdmVQYXJhbXNdID1cclxuICAgICAgICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgICAgICAgICBjYWxjdWxhck5leHRDb3JyZWxhdGl2ZVNxbCxcclxuICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRpcG9SZWxhY2lvbjogdGlwb1JlbGFjaW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkRG9jdW1lbnRvOiBpZERvY3VtZW50byxcclxuICAgICAgICAgICAgICAgICAgICByZWxhY2lvbklkOiByZWxhY2lvbklkLFxyXG4gICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICB7fVxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgY29ycmVsYXRpdmVSb3dzID0gYXdhaXQgcXVlcnlSdW5uZXIucXVlcnkoXHJcbiAgICAgICAgICAgICAgICBlc2NhcGVkQ29ycmVsYXRpdmVRdWVyeSxcclxuICAgICAgICAgICAgICAgIGVzY2FwZWRDb3JyZWxhdGl2ZVBhcmFtc1xyXG4gICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIENhbGN1bGFyIE5leHRDb3JyZWxhdGl2ZSAoc2ltaWxhciBhIG5leHRJZEVzdGFkbylcclxuICAgICAgICAgICAgICBsZXQgbmV4dENvcnJlbGF0aXZlID0gMTtcclxuICAgICAgICAgICAgICBpZiAoY29ycmVsYXRpdmVSb3dzICYmIGNvcnJlbGF0aXZlUm93cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByb3cgPSBjb3JyZWxhdGl2ZVJvd3NbMF07XHJcbiAgICAgICAgICAgICAgICBsZXQgbWF4SWQgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChyb3cuTUFYSUQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICBtYXhJZCA9IHJvdy5NQVhJRDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocm93Lk1heElkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgbWF4SWQgPSByb3cuTWF4SWQ7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5tYXhpZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgIG1heElkID0gcm93Lm1heGlkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChtYXhJZCAhPT0gbnVsbCAmJiBtYXhJZCAhPT0gdW5kZWZpbmVkICYmIG1heElkICE9PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG1heElkTnVtYmVyID0gTnVtYmVyKG1heElkKTtcclxuICAgICAgICAgICAgICAgICAgaWYgKCFpc05hTihtYXhJZE51bWJlcikpIHtcclxuICAgICAgICAgICAgICAgICAgICBuZXh0Q29ycmVsYXRpdmUgPSBtYXhJZE51bWJlciArIDE7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICAgICAgIC8vIFBBU08gMTA6IElOU0VSVCAtIEd1YXJkYXIgcmVnaXN0cm8gaGlzdMOzcmljbyBkZSBsYSByZWxhY2nDs25cclxuICAgICAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgICAgICBjb25zdCBpbnNlcnRhckhpc3RvcmlhbFJlbGFjaW9uU3FsID0gYFxyXG4gICAgICAgICAgICAgICAgSU5TRVJUIElOVE8gRE9DVU1FTlRPUy5Eb2NIUmVsYWNpb25Eb2N1bWVudG8gKFxyXG4gICAgICAgICAgICAgICAgICBUaXBvUmVsYWNpb24sXHJcbiAgICAgICAgICAgICAgICAgIERvY09yaWdlbixcclxuICAgICAgICAgICAgICAgICAgUmVsYWNpb25Eb2N1bWVudG8sXHJcbiAgICAgICAgICAgICAgICAgIElkLFxyXG4gICAgICAgICAgICAgICAgICBGZWNoYSxcclxuICAgICAgICAgICAgICAgICAgT2JzZXJ2YWNpb24sXHJcbiAgICAgICAgICAgICAgICAgIElkVXN1YXJpbyxcclxuICAgICAgICAgICAgICAgICAgVGlwb0RvY0Rlc3Rpbm8sXHJcbiAgICAgICAgICAgICAgICAgIE51bURvY0Rlc3Rpbm8sXHJcbiAgICAgICAgICAgICAgICAgIERvY0Rlc3Rpbm8sXHJcbiAgICAgICAgICAgICAgICAgIEVtaXNvckRvY0Rlc3Rpbm8sXHJcbiAgICAgICAgICAgICAgICAgIE5vbWJyZUVtaXNvcixcclxuICAgICAgICAgICAgICAgICAgQWN0aXZvLFxyXG4gICAgICAgICAgICAgICAgICBGZWNoYUFjdGl2YSxcclxuICAgICAgICAgICAgICAgICAgRmVjaGFEZXNhY3RpdmEsXHJcbiAgICAgICAgICAgICAgICAgIEZlY2hhRG9jRGVzdGlub1xyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICAgICAgICBSLlRpcG9SZWxhY2lvbixcclxuICAgICAgICAgICAgICAgICAgUi5Eb2NPcmlnZW4sXHJcbiAgICAgICAgICAgICAgICAgIFIuSWQsXHJcbiAgICAgICAgICAgICAgICAgIDpuZXh0Q29ycmVsYXRpdmUsXHJcbiAgICAgICAgICAgICAgICAgIFIuRmVjaGEsXHJcbiAgICAgICAgICAgICAgICAgIFIuT2JzZXJ2YWNpb24sXHJcbiAgICAgICAgICAgICAgICAgIFIuSWRVc3VhcmlvLFxyXG4gICAgICAgICAgICAgICAgICBSLlRpcG9Eb2NEZXN0aW5vLFxyXG4gICAgICAgICAgICAgICAgICBSLk51bURvY0Rlc3Rpbm8sXHJcbiAgICAgICAgICAgICAgICAgIFIuRG9jRGVzdGlubyxcclxuICAgICAgICAgICAgICAgICAgUi5FbWlzb3JEb2NEZXN0aW5vLFxyXG4gICAgICAgICAgICAgICAgICBSLk5vbWJyZUVtaXNvcixcclxuICAgICAgICAgICAgICAgICAgUi5BY3Rpdm8sXHJcbiAgICAgICAgICAgICAgICAgIFIuRmVjaGFBY3RpdmEsXHJcbiAgICAgICAgICAgICAgICAgIDpmZWNoYUNvbnNvbGlkYWNpb24sXHJcbiAgICAgICAgICAgICAgICAgIFIuRmVjaGFEb2NEZXN0aW5vXHJcbiAgICAgICAgICAgICAgICBGUk9NIERPQ1VNRU5UT1MuRG9jUmVsYWNpb25Eb2N1bWVudG8gUlxyXG4gICAgICAgICAgICAgICAgV0hFUkUgUi5UaXBvUmVsYWNpb24gPSA6dGlwb1JlbGFjaW9uXHJcbiAgICAgICAgICAgICAgICAgIEFORCBSLkRvY09yaWdlbiA9IDppZERvY3VtZW50b1xyXG4gICAgICAgICAgICAgICAgICBBTkQgUi5JZCA9IDpyZWxhY2lvbklkXHJcbiAgICAgICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgW2VzY2FwZWRIaXN0b3JpYWxRdWVyeSwgZXNjYXBlZEhpc3RvcmlhbFBhcmFtc10gPVxyXG4gICAgICAgICAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICAgICAgICAgIGluc2VydGFySGlzdG9yaWFsUmVsYWNpb25TcWwsXHJcbiAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBuZXh0Q29ycmVsYXRpdmU6IG5leHRDb3JyZWxhdGl2ZSxcclxuICAgICAgICAgICAgICAgICAgICBmZWNoYUNvbnNvbGlkYWNpb246IGZlY2hhQ29uc29saWRhY2lvbixcclxuICAgICAgICAgICAgICAgICAgICB0aXBvUmVsYWNpb246IHRpcG9SZWxhY2lvbixcclxuICAgICAgICAgICAgICAgICAgICBpZERvY3VtZW50bzogaWREb2N1bWVudG8sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVsYWNpb25JZDogcmVsYWNpb25JZCxcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgIGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgICAgICAgZXNjYXBlZEhpc3RvcmlhbFF1ZXJ5LFxyXG4gICAgICAgICAgICAgICAgZXNjYXBlZEhpc3RvcmlhbFBhcmFtc1xyXG4gICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgICAgYEhpc3RvcmlhbCBkZSByZWxhY2nDs24gaW5zZXJ0YWRvOiBUaXBvUmVsYWNpb249JHt0aXBvUmVsYWNpb259LCBSZWxhY2lvbklkPSR7cmVsYWNpb25JZH0sIENvcnJlbGF0aXZlPSR7bmV4dENvcnJlbGF0aXZlfWBcclxuICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgICAgICAvLyBQQVNPIDExOiBVUERBVEUgLSBWaW5jdWxhciBlbCBkb2N1bWVudG8gZGVzdGlubyBlbmNvbnRyYWRvXHJcbiAgICAgICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICAgICAgY29uc3QgYWN0dWFsaXphclJlbGFjaW9uU3FsID0gYFxyXG4gICAgICAgICAgICAgICAgVVBEQVRFIERPQ1VNRU5UT1MuRG9jUmVsYWNpb25Eb2N1bWVudG8gXHJcbiAgICAgICAgICAgICAgICBTRVQgRG9jRGVzdGlubyA9IDpkb2NJZFxyXG4gICAgICAgICAgICAgICAgV0hFUkUgVGlwb1JlbGFjaW9uID0gOnRpcG9SZWxhY2lvblxyXG4gICAgICAgICAgICAgICAgICBBTkQgRG9jT3JpZ2VuID0gOmlkRG9jdW1lbnRvXHJcbiAgICAgICAgICAgICAgICAgIEFORCBJZCA9IDpyZWxhY2lvbklkXHJcbiAgICAgICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgW2VzY2FwZWRVcGRhdGVRdWVyeSwgZXNjYXBlZFVwZGF0ZVBhcmFtc10gPVxyXG4gICAgICAgICAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICAgICAgICAgIGFjdHVhbGl6YXJSZWxhY2lvblNxbCxcclxuICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGRvY0lkOiBkb2NJZCxcclxuICAgICAgICAgICAgICAgICAgICB0aXBvUmVsYWNpb246IHRpcG9SZWxhY2lvbixcclxuICAgICAgICAgICAgICAgICAgICBpZERvY3VtZW50bzogaWREb2N1bWVudG8sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVsYWNpb25JZDogcmVsYWNpb25JZCxcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgIGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KGVzY2FwZWRVcGRhdGVRdWVyeSwgZXNjYXBlZFVwZGF0ZVBhcmFtcyk7XHJcblxyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgICAgYFJlbGFjacOzbiBhY3R1YWxpemFkYTogRG9jRGVzdGlubz0ke2RvY0lkfSBhc2lnbmFkbyBhIFRpcG9SZWxhY2lvbj0ke3RpcG9SZWxhY2lvbn0sIFJlbGFjaW9uSWQ9JHtyZWxhY2lvbklkfWBcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgICAgIGBFcnJvciBhbCBwcm9jZXNhciByZWxhY2nDs24gcGFyYSBkb2N1bWVudG8gJHtpZERvY3VtZW50b306YCxcclxuICAgICAgICAgICAgICAgIGVycm9yXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICB0aHJvdyBlcnJvcjsgLy8gUmUtbGFuemFyIGVsIGVycm9yIHBhcmEgaGFjZXIgcm9sbGJhY2sgZGUgdG9kYSBsYSB0cmFuc2FjY2nDs25cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICAgLy8gUEFTTyAxMjogU0VMRUNUIC0gVmVyaWZpY2FyIHNpIGxhIGd1w61hIGVzIGh1w6lyZmFuYVxyXG4gICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICBjb25zdCB2ZXJpZmljYXJFc0h1ZXJmYW5vU3FsID0gYFxyXG4gICAgICAgICAgICBTRUxFQ1QgQ09VTlQoMSkgQVMgVG90YWxcclxuICAgICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRvY1JlbGFjaW9uRG9jdW1lbnRvIFJcclxuICAgICAgICAgICAgV0hFUkUgUi5Eb2NPcmlnZW4gPSA6aWREb2N1bWVudG9cclxuICAgICAgICAgICAgICBBTkQgUi5Eb2NEZXN0aW5vIElTIE5VTExcclxuICAgICAgICAgICAgICBBTkQgUi5UaXBvUmVsYWNpb24gPSAnTUFEUkUnXHJcbiAgICAgICAgICAgICAgQU5EIFIuQWN0aXZvID0gJ1MnXHJcbiAgICAgICAgICBgO1xyXG5cclxuICAgICAgICAgIGNvbnN0IFtlc2NhcGVkSHVlcmZhbm9RdWVyeSwgZXNjYXBlZEh1ZXJmYW5vUGFyYW1zXSA9XHJcbiAgICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgICAgIHZlcmlmaWNhckVzSHVlcmZhbm9TcWwsXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWREb2N1bWVudG86IGlkRG9jdW1lbnRvLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBjb25zdCBodWVyZmFub1Jvd3MgPSBhd2FpdCBxdWVyeVJ1bm5lci5xdWVyeShcclxuICAgICAgICAgICAgZXNjYXBlZEh1ZXJmYW5vUXVlcnksXHJcbiAgICAgICAgICAgIGVzY2FwZWRIdWVyZmFub1BhcmFtc1xyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBsZXQgZXNIdWVyZmFubyA9IGZhbHNlO1xyXG4gICAgICAgICAgaWYgKGh1ZXJmYW5vUm93cyAmJiBodWVyZmFub1Jvd3MubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBjb25zdCByb3cgPSBodWVyZmFub1Jvd3NbMF07XHJcbiAgICAgICAgICAgIGNvbnN0IHRvdGFsID0gcm93LlRPVEFMIHx8IHJvdy50b3RhbCB8fCByb3cuVG90YWwgfHwgMDtcclxuICAgICAgICAgICAgZXNIdWVyZmFubyA9IE51bWJlcih0b3RhbCkgPiAwO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGNvbnNvbGUubG9nKGBEb2N1bWVudG8gJHtpZERvY3VtZW50b306IEVzIGh1w6lyZmFubyA9ICR7ZXNIdWVyZmFub31gKTtcclxuXHJcbiAgICAgICAgICBpZiAoZXNIdWVyZmFubykge1xyXG4gICAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgICAgLy8gUEFTTyAxMzogU0VMRUNUIC0gT2J0ZW5lciBlbCBzaWd1aWVudGUgSUQgZGUgZXN0YWRvIFwiSFwiXHJcbiAgICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICAgICBjb25zdCBjYWxjdWxhck1heElkRXN0YWRvSFNxbCA9IGBcclxuICAgICAgICAgICAgICBTRUxFQ1QgTUFYKElkKSBBUyBNYXhJZFxyXG4gICAgICAgICAgICAgIEZST00gRE9DVU1FTlRPUy5Eb2NFc3RhZG9zXHJcbiAgICAgICAgICAgICAgV0hFUkUgRG9jdW1lbnRvID0gOmlkRG9jdW1lbnRvXHJcbiAgICAgICAgICAgICAgICBBTkQgVGlwb0RvY3VtZW50byA9IDp0aXBvRG9jVFxyXG4gICAgICAgICAgICAgICAgQU5EIFRpcG9Fc3RhZG8gPSAnSCdcclxuICAgICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IFtlc2NhcGVkTWF4SWRIUXVlcnksIGVzY2FwZWRNYXhJZEhQYXJhbXNdID1cclxuICAgICAgICAgICAgICBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICAgICAgICAgIGNhbGN1bGFyTWF4SWRFc3RhZG9IU3FsLFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICBpZERvY3VtZW50bzogaWREb2N1bWVudG8sXHJcbiAgICAgICAgICAgICAgICAgIHRpcG9Eb2NUOiB0aXBvRG9jVCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7fVxyXG4gICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBtYXhJZEhSb3dzID0gYXdhaXQgcXVlcnlSdW5uZXIucXVlcnkoXHJcbiAgICAgICAgICAgICAgZXNjYXBlZE1heElkSFF1ZXJ5LFxyXG4gICAgICAgICAgICAgIGVzY2FwZWRNYXhJZEhQYXJhbXNcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBuZXh0SWRFc3RhZG9IID0gMTtcclxuICAgICAgICAgICAgaWYgKG1heElkSFJvd3MgJiYgbWF4SWRIUm93cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgY29uc3Qgcm93ID0gbWF4SWRIUm93c1swXTtcclxuICAgICAgICAgICAgICBsZXQgbWF4SWRIID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgaWYgKHJvdy5NQVhJRCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBtYXhJZEggPSByb3cuTUFYSUQ7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChyb3cuTWF4SWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgbWF4SWRIID0gcm93Lk1heElkO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAocm93Lm1heGlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIG1heElkSCA9IHJvdy5tYXhpZDtcclxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5NQVhfSUQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgbWF4SWRIID0gcm93Lk1BWF9JRDtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGlmIChtYXhJZEggIT09IG51bGwgJiYgbWF4SWRIICE9PSB1bmRlZmluZWQgJiYgbWF4SWRIICE9PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBtYXhJZEhOdW1iZXIgPSBOdW1iZXIobWF4SWRIKTtcclxuICAgICAgICAgICAgICAgIGlmICghaXNOYU4obWF4SWRITnVtYmVyKSkge1xyXG4gICAgICAgICAgICAgICAgICBuZXh0SWRFc3RhZG9IID0gbWF4SWRITnVtYmVyICsgMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgIGBEb2N1bWVudG8gJHtpZERvY3VtZW50b306IFNpZ3VpZW50ZSBJZCBwYXJhIGVzdGFkbyBIIHNlcsOhICR7bmV4dElkRXN0YWRvSH1gXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgICAgLy8gUEFTTyAxNDogSU5TRVJUIC0gQ3JlYXIgZWwgZXN0YWRvIFwiSFwiIChIaWpvIHNpbiBtYWRyZSlcclxuICAgICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gICAgICAgICAgICBjb25zdCBmZWNoYUVzdGFkb0ggPSBuZXcgRGF0ZSgpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgaW5zZXJ0YXJFc3RhZG9IU3FsID0gYFxyXG4gICAgICAgICAgICAgIElOU0VSVCBJTlRPIERPQ1VNRU5UT1MuRG9jRXN0YWRvcyhcclxuICAgICAgICAgICAgICAgIERvY3VtZW50byxcclxuICAgICAgICAgICAgICAgIFRpcG9Eb2N1bWVudG8sXHJcbiAgICAgICAgICAgICAgICBUaXBvRXN0YWRvLFxyXG4gICAgICAgICAgICAgICAgSWQsXHJcbiAgICAgICAgICAgICAgICBGZWNoYSxcclxuICAgICAgICAgICAgICAgIE9ic2VydmFjaW9uLFxyXG4gICAgICAgICAgICAgICAgSWRVc3VhcmlvLFxyXG4gICAgICAgICAgICAgICAgQWN0aXZhLFxyXG4gICAgICAgICAgICAgICAgRmVjaGFBY3RpdmEsXHJcbiAgICAgICAgICAgICAgICBGZWNoYURlc2FjdGl2YVxyXG4gICAgICAgICAgICAgICkgVkFMVUVTIChcclxuICAgICAgICAgICAgICAgIDppZERvY3VtZW50byxcclxuICAgICAgICAgICAgICAgIDp0aXBvRG9jVCxcclxuICAgICAgICAgICAgICAgICdIJyxcclxuICAgICAgICAgICAgICAgIDpuZXh0SWRFc3RhZG9ILFxyXG4gICAgICAgICAgICAgICAgOmZlY2hhRXN0YWRvSCxcclxuICAgICAgICAgICAgICAgICdCTCBTSU4gTUFEUkUnLFxyXG4gICAgICAgICAgICAgICAgJ1thdXRvbWF0aWNvXScsXHJcbiAgICAgICAgICAgICAgICAnUycsXHJcbiAgICAgICAgICAgICAgICA6ZmVjaGFFc3RhZG9ILFxyXG4gICAgICAgICAgICAgICAgTlVMTFxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IFtlc2NhcGVkSW5zZXJ0SFF1ZXJ5LCBlc2NhcGVkSW5zZXJ0SFBhcmFtc10gPVxyXG4gICAgICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgICAgICAgaW5zZXJ0YXJFc3RhZG9IU3FsLFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICBpZERvY3VtZW50bzogaWREb2N1bWVudG8sXHJcbiAgICAgICAgICAgICAgICAgIHRpcG9Eb2NUOiB0aXBvRG9jVCxcclxuICAgICAgICAgICAgICAgICAgbmV4dElkRXN0YWRvSDogbmV4dElkRXN0YWRvSCxcclxuICAgICAgICAgICAgICAgICAgZmVjaGFFc3RhZG9IOiBmZWNoYUVzdGFkb0gsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgYXdhaXQgcXVlcnlSdW5uZXIucXVlcnkoZXNjYXBlZEluc2VydEhRdWVyeSwgZXNjYXBlZEluc2VydEhQYXJhbXMpO1xyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgYEVzdGFkbyBIIGluc2VydGFkbyBwYXJhIGRvY3VtZW50byAke2lkRG9jdW1lbnRvfSBjb24gSWQgJHtuZXh0SWRFc3RhZG9IfWBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgIC8vIFBBU08gMTU6IENlcnJhciBhY3RpdmlkYWRlcyB5IGNpY2xvcyBhYmllcnRvcyBkZWwgd29ya2Zsb3cgcGFyYSBsYSBndcOtYVxyXG4gICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gICAgICAgICAgbGV0IGVuY29udHJvQ2ljbG8gPSBmYWxzZTtcclxuICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgLy8gQnVzY2FyIGNpY2xvcyBhYmllcnRvcyBwYXJhIGVsIGRvY3VtZW50b1xyXG4gICAgICAgICAgICBjb25zdCBidXNjYXJDaWNsb3NBYmllcnRvc1NxbCA9IGBcclxuICAgICAgICAgICAgICBTRUxFQ1QgXHJcbiAgICAgICAgICAgICAgICBDaWNsZS5BY3Rpdml0eU5hbWUgQVMgQWN0aXZpdHlOYW1lLFxyXG4gICAgICAgICAgICAgICAgQ2ljbGUuSWQgQVMgQ2ljbGVJZFxyXG4gICAgICAgICAgICAgIEZST00gQ2ljbGUsIElucHV0RG9jdW1lbnRcclxuICAgICAgICAgICAgICBXSEVSRSBDaWNsZS5BcHBsaWNhdGlvbk5hbWUgPSAnV0ZEb2NUcmFuc3BvcnRlJ1xyXG4gICAgICAgICAgICAgICAgQU5EIENpY2xlLkFwcGxpY2F0aW9uTmFtZSA9IElucHV0RG9jdW1lbnQuQXBwbGljYXRpb25OYW1lXHJcbiAgICAgICAgICAgICAgICBBTkQgQ2ljbGUuQWN0aXZpdHlOYW1lID0gSW5wdXREb2N1bWVudC5BY3Rpdml0eU5hbWVcclxuICAgICAgICAgICAgICAgIEFORCBJbnB1dERvY3VtZW50LkNpY2xlSWQgPSBDaWNsZS5JZFxyXG4gICAgICAgICAgICAgICAgQU5EIENpY2xlLmlzT3BlbiA9ICdZJ1xyXG4gICAgICAgICAgICAgICAgQU5EIElucHV0RG9jdW1lbnQuQXBwbGljYXRpb25OYW1lID0gJ1dGRG9jVHJhbnNwb3J0ZSdcclxuICAgICAgICAgICAgICAgIEFORCBJbnB1dERvY3VtZW50Lk9iamVjdElkID0gOmlkRG9jdW1lbnRvXHJcbiAgICAgICAgICAgIGA7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBbZXNjYXBlZENpY2xvc1F1ZXJ5LCBlc2NhcGVkQ2ljbG9zUGFyYW1zXSA9XHJcbiAgICAgICAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICAgICAgICBidXNjYXJDaWNsb3NBYmllcnRvc1NxbCxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgaWREb2N1bWVudG86IGlkRG9jdW1lbnRvLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY2ljbG9zUm93cyA9IGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgICAgIGVzY2FwZWRDaWNsb3NRdWVyeSxcclxuICAgICAgICAgICAgICBlc2NhcGVkQ2ljbG9zUGFyYW1zXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ2ljbG9zIGFiaWVydG9zIGVuY29udHJhZG9zOiBcIiwgY2ljbG9zUm93cyk7XHJcbiAgICAgICAgICAgIGVuY29udHJvQ2ljbG8gPSBjaWNsb3NSb3dzICYmIGNpY2xvc1Jvd3MubGVuZ3RoID4gMDtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJlbmNvbnRyb0NpY2xvXCIsIGVuY29udHJvQ2ljbG8pO1xyXG4gICAgICAgICAgICBpZiAoZW5jb250cm9DaWNsbykge1xyXG4gICAgICAgICAgICAgIGNvbnN0IGNpY2xvUm93ID0gY2ljbG9zUm93c1swXTtcclxuICAgICAgICAgICAgICBsZXQgYWN0aXZpdHlOYW1lID0gY2ljbG9Sb3cuQWN0aXZpdHlOYW1lIHx8IGNpY2xvUm93LmFjdGl2aXR5bmFtZTtcclxuICAgICAgICAgICAgICBsZXQgY2ljbGVJZCA9XHJcbiAgICAgICAgICAgICAgICBjaWNsb1Jvdy5DaWNsZUlkIHx8IGNpY2xvUm93LmNpY2xlaWQgfHwgY2ljbG9Sb3cuQ0lDTEVJRDtcclxuXHJcbiAgICAgICAgICAgICAgLy8gTWllbnRyYXMgaGF5YSBhY3RpdmlkYWQsIGNlcnJhciBjaWNsbyB5IGJ1c2NhciBwYWRyZVxyXG4gICAgICAgICAgICAgIHdoaWxlIChhY3Rpdml0eU5hbWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIENlcnJhciBlbCBjaWNsbyAoVVBEQVRFIGlzT3BlbiA9ICdOJylcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNlcnJhckNpY2xvU3FsID0gYFxyXG4gICAgICAgICAgICAgICAgICBVUERBVEUgQ2ljbGVcclxuICAgICAgICAgICAgICAgICAgU0VUIGlzT3BlbiA9ICdOJ1xyXG4gICAgICAgICAgICAgICAgICBXSEVSRSBBcHBsaWNhdGlvbk5hbWUgPSAnV0ZEb2NUcmFuc3BvcnRlJ1xyXG4gICAgICAgICAgICAgICAgICAgIEFORCBBY3Rpdml0eU5hbWUgPSA6YWN0aXZpdHlOYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgQU5EIElkID0gOmNpY2xlSWRcclxuICAgICAgICAgICAgICAgIGA7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgW2VzY2FwZWRDZXJyYXJRdWVyeSwgZXNjYXBlZENlcnJhclBhcmFtc10gPVxyXG4gICAgICAgICAgICAgICAgICBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICAgICAgICAgICAgICBjZXJyYXJDaWNsb1NxbCxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBhY3Rpdml0eU5hbWU6IGFjdGl2aXR5TmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgIGNpY2xlSWQ6IGNpY2xlSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7fVxyXG4gICAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgICAgICAgICBlc2NhcGVkQ2VycmFyUXVlcnksXHJcbiAgICAgICAgICAgICAgICAgIGVzY2FwZWRDZXJyYXJQYXJhbXNcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICAgIGBDaWNsbyBjZXJyYWRvIHBhcmEgZG9jdW1lbnRvICR7aWREb2N1bWVudG99OiBBY3Rpdml0eU5hbWU9JHthY3Rpdml0eU5hbWV9LCBDaWNsZUlkPSR7Y2ljbGVJZH1gXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEJ1c2NhciBjaWNsbyBwYWRyZSAoc2kgZXhpc3RlKVxyXG4gICAgICAgICAgICAgICAgY29uc3QgYnVzY2FyUGFkcmVTcWwgPSBgXHJcbiAgICAgICAgICAgICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgICAgICAgICAgICBDaWNsZS5QYXJlbnRBY3Rpdml0eSBBUyBQYXJlbnRBY3Rpdml0eSxcclxuICAgICAgICAgICAgICAgICAgICBDaWNsZS5QYXJlbnRDaWNsZSBBUyBQYXJlbnRDaWNsZVxyXG4gICAgICAgICAgICAgICAgICBGUk9NIENpY2xlXHJcbiAgICAgICAgICAgICAgICAgIFdIRVJFIEFwcGxpY2F0aW9uTmFtZSA9ICdXRkRvY1RyYW5zcG9ydGUnXHJcbiAgICAgICAgICAgICAgICAgICAgQU5EIEFjdGl2aXR5TmFtZSA9IDphY3Rpdml0eU5hbWVcclxuICAgICAgICAgICAgICAgICAgICBBTkQgSWQgPSA6Y2ljbGVJZFxyXG4gICAgICAgICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBbZXNjYXBlZFBhZHJlUXVlcnksIGVzY2FwZWRQYWRyZVBhcmFtc10gPVxyXG4gICAgICAgICAgICAgICAgICBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICAgICAgICAgICAgICBidXNjYXJQYWRyZVNxbCxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBhY3Rpdml0eU5hbWU6IGFjdGl2aXR5TmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgIGNpY2xlSWQ6IGNpY2xlSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7fVxyXG4gICAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhZHJlUm93cyA9IGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgICAgICAgICBlc2NhcGVkUGFkcmVRdWVyeSxcclxuICAgICAgICAgICAgICAgICAgZXNjYXBlZFBhZHJlUGFyYW1zXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChwYWRyZVJvd3MgJiYgcGFkcmVSb3dzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgY29uc3QgcGFkcmVSb3cgPSBwYWRyZVJvd3NbMF07XHJcbiAgICAgICAgICAgICAgICAgIGFjdGl2aXR5TmFtZSA9XHJcbiAgICAgICAgICAgICAgICAgICAgcGFkcmVSb3cuUGFyZW50QWN0aXZpdHkgfHxcclxuICAgICAgICAgICAgICAgICAgICBwYWRyZVJvdy5wYXJlbnRhY3Rpdml0eSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIHBhZHJlUm93LlBBUkVOVEFDVElWSVRZIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgbnVsbDtcclxuICAgICAgICAgICAgICAgICAgY2ljbGVJZCA9XHJcbiAgICAgICAgICAgICAgICAgICAgcGFkcmVSb3cuUGFyZW50Q2ljbGUgfHxcclxuICAgICAgICAgICAgICAgICAgICBwYWRyZVJvdy5wYXJlbnRjaWNsZSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIHBhZHJlUm93LlBBUkVOVENJQ0xFIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgbnVsbDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGFjdGl2aXR5TmFtZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IHdoaWxlIChlbmNvbnRyb0NpY2xvKTtcclxuICAgICAgICAgIC8qKiBmaW4gZGVudHJvIGRlbCBmb3IgKi9cclxuICAgICAgICB9IC8vIEZpbiBkZWwgZm9yIGRlIGRvY3VtZW50b3NcclxuICAgICAgICAvKiovXHJcbiAgICAgICAgLy8gRmluIGRlIENvbnNvbGlkYWNpw7NuIGRlIGd1w61hc1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgYERvY3VtZW50b3MgdsOhbGlkb3MgcGFyYSBjb25zb2xpZGFyOiAke2RvY3VtZW50b3NQYXJhQ29uc29saWRhci5sZW5ndGh9IGRlICR7aWRzRG9jdW1lbnRvc1JlbGFjaW9uYWRvcy5sZW5ndGh9YFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgLy8gUEFTTyAxNjogRWplY3V0YXIgcHJvY2VzbyBiYXRjaCBwYXJhIG1hbmlmaWVzdG9zIGHDqXJlb3MgeSBjb3VyaWVyXHJcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgaWYgKHRpcG9Eb2N1bWVudG8gPT09IFwiTUZUT0NcIikge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgY29uc29saWRhY2lvbkJhdGNoU3FsID0gYFxyXG4gICAgICAgICAgICAgIEJFR0lOXHJcbiAgICAgICAgICAgICAgICBET0NVTUVOVE9TLlBLX0NPVVJJRVJTX0ZJU0NBTElaQUNJT04uUFJfQ09VUklFUlNfQkxGSVNDQUxJWkFDSU9ORVMoOmlkTWFuaWZpZXN0byk7XHJcbiAgICAgICAgICAgICAgRU5EO1xyXG4gICAgICAgICAgICBgO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgW2VzY2FwZWRCYXRjaFF1ZXJ5LCBlc2NhcGVkQmF0Y2hQYXJhbXNdID1cclxuICAgICAgICAgICAgICBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICAgICAgICAgIGNvbnNvbGlkYWNpb25CYXRjaFNxbCxcclxuICAgICAgICAgICAgICAgIHsgaWRNYW5pZmllc3RvOiBkb2N1bWVudG9JZCB9LFxyXG4gICAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgYXdhaXQgcXVlcnlSdW5uZXIucXVlcnkoZXNjYXBlZEJhdGNoUXVlcnksIGVzY2FwZWRCYXRjaFBhcmFtcyk7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICBgW1BBU08gMTZdIFByb2Nlc28gYmF0Y2ggZGUgY29uc29saWRhY2nDs24gZWplY3V0YWRvIHBhcmEgbWFuaWZpZXN0byAke2RvY3VtZW50b0lkfWBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGJhdGNoRXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgICBgW1BBU08gMTZdIEVycm9yIGFsIGVqZWN1dGFyIHByb2Nlc28gYmF0Y2ggcGFyYSBtYW5pZmllc3RvICR7ZG9jdW1lbnRvSWR9OmAsXHJcbiAgICAgICAgICAgICAgYmF0Y2hFcnJvclxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAvLyBNYW50ZW5lciBlbCBjb21wb3J0YW1pZW50byBkZWwgY8OzZGlnbyBsZWdhZG86IHJlZ2lzdHJhciBlbCBlcnJvciB5IGNvbnRpbnVhclxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgYFtQQVNPIDE2XSBUaXBvIGRlIGRvY3VtZW50byAke3RpcG9Eb2N1bWVudG99IG5vIHJlcXVpZXJlIHByb2Nlc28gYmF0Y2hgXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAvLyBQQVNPIDE3OiBDYW1iaWFyIGVzdGFkbyBkZWwgbWFuaWZpZXN0byBkZSBcIkFjZXB0YWRvXCIgYSBcIkNvbmZvcm1hZG9cIlxyXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgIGlmICh0aXBvRG9jdW1lbnRvID09PSBcIk1GVE9DXCIpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICBgW1BBU08gMTddIEluaWNpYW5kbyBjYW1iaW8gZGUgZXN0YWRvIGEgQ01QIHBhcmEgbWFuaWZpZXN0byAke2RvY3VtZW50b0lkfWBcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgY29uc3QgY2FsY3VsYXJNYXhJZE1hbmlmZXN0b1NxbCA9IGBcclxuICAgICAgICAgICAgU0VMRUNUIE1BWChJZCkgQVMgTWF4SWRcclxuICAgICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRvY0VzdGFkb3NcclxuICAgICAgICAgICAgV0hFUkUgRG9jdW1lbnRvID0gOmlkRG9jdW1lbnRvXHJcbiAgICAgICAgICAgICAgQU5EIFRpcG9Eb2N1bWVudG8gPSA6dGlwb0RvY3VtZW50b1xyXG4gICAgICAgICAgICAgIEFORCBUaXBvRXN0YWRvID0gJ0NNUCdcclxuICAgICAgICAgIGA7XHJcblxyXG4gICAgICAgICAgY29uc3QgW2VzY2FwZWRNYXhJZE1hbmlmZXN0b1F1ZXJ5LCBlc2NhcGVkTWF4SWRNYW5pZmVzdG9QYXJhbXNdID1cclxuICAgICAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICAgICAgY2FsY3VsYXJNYXhJZE1hbmlmZXN0b1NxbCxcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZERvY3VtZW50bzogZG9jdW1lbnRvSWQsXHJcbiAgICAgICAgICAgICAgICB0aXBvRG9jdW1lbnRvOiBcIk1GVE9DXCIsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB7fVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIGNvbnN0IG1heElkTWFuaWZlc3RvUm93cyA9IGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgICBlc2NhcGVkTWF4SWRNYW5pZmVzdG9RdWVyeSxcclxuICAgICAgICAgICAgZXNjYXBlZE1heElkTWFuaWZlc3RvUGFyYW1zXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIGxldCBuZXh0SWRFc3RhZG9NYW5pZmllc3RvID0gMTtcclxuXHJcbiAgICAgICAgICBpZiAobWF4SWRNYW5pZmVzdG9Sb3dzICYmIG1heElkTWFuaWZlc3RvUm93cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJvdyA9IG1heElkTWFuaWZlc3RvUm93c1swXTtcclxuICAgICAgICAgICAgbGV0IG1heElkID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmIChyb3cuTUFYSUQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIG1heElkID0gcm93Lk1BWElEO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5NYXhJZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgbWF4SWQgPSByb3cuTWF4SWQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocm93Lm1heGlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICBtYXhJZCA9IHJvdy5tYXhpZDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChyb3cuTUFYX0lEICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICBtYXhJZCA9IHJvdy5NQVhfSUQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChtYXhJZCAhPT0gbnVsbCAmJiBtYXhJZCAhPT0gdW5kZWZpbmVkICYmIG1heElkICE9PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgbWF4SWROdW1iZXIgPSBOdW1iZXIobWF4SWQpO1xyXG4gICAgICAgICAgICAgIGlmICghaXNOYU4obWF4SWROdW1iZXIpKSB7XHJcbiAgICAgICAgICAgICAgICBuZXh0SWRFc3RhZG9NYW5pZmllc3RvID0gbWF4SWROdW1iZXIgKyAxO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICBgW1BBU08gMTddIE1hbmlmaWVzdG8gJHtkb2N1bWVudG9JZH06IHNpZ3VpZW50ZSBJZCBwYXJhIGVzdGFkbyBDTVAgc2Vyw6EgJHtuZXh0SWRFc3RhZG9NYW5pZmllc3RvfWBcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgY29uc3QgZmVjaGFFc3RhZG9NYW5pZmllc3RvID0gbmV3IERhdGUoKTtcclxuXHJcbiAgICAgICAgICBjb25zdCBpbnNlcnRhckVzdGFkb01hbmlmZXN0b1NxbCA9IGBcclxuICAgICAgICAgICAgSU5TRVJUIElOVE8gRE9DVU1FTlRPUy5Eb2NFc3RhZG9zKFxyXG4gICAgICAgICAgICAgIERvY3VtZW50byxcclxuICAgICAgICAgICAgICBUaXBvRG9jdW1lbnRvLFxyXG4gICAgICAgICAgICAgIFRpcG9Fc3RhZG8sXHJcbiAgICAgICAgICAgICAgSWQsXHJcbiAgICAgICAgICAgICAgRmVjaGEsXHJcbiAgICAgICAgICAgICAgT2JzZXJ2YWNpb24sXHJcbiAgICAgICAgICAgICAgSWRVc3VhcmlvLFxyXG4gICAgICAgICAgICAgIEFjdGl2YSxcclxuICAgICAgICAgICAgICBGZWNoYUFjdGl2YSxcclxuICAgICAgICAgICAgICBGZWNoYURlc2FjdGl2YVxyXG4gICAgICAgICAgICApIFZBTFVFUyAoXHJcbiAgICAgICAgICAgICAgOmlkRG9jdW1lbnRvLFxyXG4gICAgICAgICAgICAgIDp0aXBvRG9jdW1lbnRvLFxyXG4gICAgICAgICAgICAgICdDTVAnLFxyXG4gICAgICAgICAgICAgIDpuZXh0SWRFc3RhZG8sXHJcbiAgICAgICAgICAgICAgOmZlY2hhRXN0YWRvLFxyXG4gICAgICAgICAgICAgICdNQU5JRklFU1RPIENPTkZPUk1BRE8gQVVUT01BVElDQU1FTlRFIFBPUiBJU0lET1JBJyxcclxuICAgICAgICAgICAgICAnW2F1dG9tYXRpY29dJyxcclxuICAgICAgICAgICAgICAnUycsXHJcbiAgICAgICAgICAgICAgOmZlY2hhRXN0YWRvLFxyXG4gICAgICAgICAgICAgIDpmZWNoYUVzdGFkb1xyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICBgO1xyXG5cclxuICAgICAgICAgIGNvbnN0IFtlc2NhcGVkSW5zZXJ0TWFuaWZlc3RvUXVlcnksIGVzY2FwZWRJbnNlcnRNYW5pZmVzdG9QYXJhbXNdID1cclxuICAgICAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICAgICAgaW5zZXJ0YXJFc3RhZG9NYW5pZmVzdG9TcWwsXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWREb2N1bWVudG86IGRvY3VtZW50b0lkLFxyXG4gICAgICAgICAgICAgICAgdGlwb0RvY3VtZW50bzogXCJNRlRPQ1wiLFxyXG4gICAgICAgICAgICAgICAgbmV4dElkRXN0YWRvOiBuZXh0SWRFc3RhZG9NYW5pZmllc3RvLFxyXG4gICAgICAgICAgICAgICAgZmVjaGFFc3RhZG86IGZlY2hhRXN0YWRvTWFuaWZpZXN0byxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHt9XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgYXdhaXQgcXVlcnlSdW5uZXIucXVlcnkoXHJcbiAgICAgICAgICAgIGVzY2FwZWRJbnNlcnRNYW5pZmVzdG9RdWVyeSxcclxuICAgICAgICAgICAgZXNjYXBlZEluc2VydE1hbmlmZXN0b1BhcmFtc1xyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgYFtQQVNPIDE3XSBNYW5pZmllc3RvICR7ZG9jdW1lbnRvSWR9IGFjdHVhbGl6YWRvIGEgZXN0YWRvIENNUGBcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICBgW1BBU08gMTddIFRpcG8gZGUgZG9jdW1lbnRvICR7dGlwb0RvY3VtZW50b30gbm8gcmVxdWllcmUgY2FtYmlvIGRlIGVzdGFkbyBhIENNUGBcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgIC8vIFBBU08gMTg6IENvbnN1bHRhciBudWV2YW1lbnRlIGVsIGVzdGFkbyBkZWwgbWFuaWZpZXN0byB5IHJldG9ybmFybG9cclxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICBjb25zdCBwYXNvMThQYXJhbXM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xyXG4gICAgICAgICAgcF9pZF9kb2N1bWVudG86IGRvY3VtZW50b0lkLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IFtlc2NhcGVkUGFzbzE4UXVlcnksIGVzY2FwZWRQYXNvMThQYXJhbXNdID1cclxuICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKHBhc28wU3FsLCBwYXNvMThQYXJhbXMsIHt9KTtcclxuXHJcbiAgICAgICAgY29uc3QgcGFzbzE4Um93cyA9IGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgZXNjYXBlZFBhc28xOFF1ZXJ5LFxyXG4gICAgICAgICAgZXNjYXBlZFBhc28xOFBhcmFtc1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGxldCBlc3RhZG9GaW5hbE1hbmlmaWVzdG86IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gICAgICAgIGxldCB0aXBvRXN0YWRvRmluYWxNYW5pZmllc3RvOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICAgICAgICBsZXQgdGlwb0RvY3VtZW50b0ZpbmFsOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgICAgICAgaWYgKHBhc28xOFJvd3MgJiYgcGFzbzE4Um93cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICBjb25zdCBmaW5hbEluZm8gPSBwYXNvMThSb3dzWzBdO1xyXG4gICAgICAgICAgZXN0YWRvRmluYWxNYW5pZmllc3RvID0gZmluYWxJbmZvPy5FU1RBRE8gfHwgZmluYWxJbmZvPy5lc3RhZG8gfHwgbnVsbDtcclxuICAgICAgICAgIHRpcG9Fc3RhZG9GaW5hbE1hbmlmaWVzdG8gPVxyXG4gICAgICAgICAgICBmaW5hbEluZm8/LlRJUE9fRVNUQURPIHx8IGZpbmFsSW5mbz8udGlwb19lc3RhZG8gfHwgbnVsbDtcclxuICAgICAgICAgIHRpcG9Eb2N1bWVudG9GaW5hbCA9XHJcbiAgICAgICAgICAgIGZpbmFsSW5mbz8uVElQT0RPQ1VNRU5UTyB8fCBmaW5hbEluZm8/LnRpcG9kb2N1bWVudG8gfHwgbnVsbDtcclxuXHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgYFtQQVNPIDE4XSBFc3RhZG8gZmluYWwgZGVsIG1hbmlmaWVzdG8gJHtkb2N1bWVudG9JZH06ICR7ZXN0YWRvRmluYWxNYW5pZmllc3RvfSAoJHt0aXBvRXN0YWRvRmluYWxNYW5pZmllc3RvfSlgXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zb2xlLndhcm4oXHJcbiAgICAgICAgICAgIGBbUEFTTyAxOF0gTm8gc2UgcHVkbyBvYnRlbmVyIGVsIGVzdGFkbyBmaW5hbCBkZWwgbWFuaWZpZXN0byAke2RvY3VtZW50b0lkfWBcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8qKiAqL1xyXG4gICAgICAgIC8vIENvbW1pdCBkZSBsYSB0cmFuc2FjY2nDs24gc2kgdG9kbyBzYWxpw7MgYmllblxyXG4gICAgICAgIGF3YWl0IHF1ZXJ5UnVubmVyLmNvbW1pdFRyYW5zYWN0aW9uKCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJUcmFuc2FjY2nDs24gZGUgY29uc29saWRhY2nDs24gY29uZmlybWFkYSBleGl0b3NhbWVudGVcIik7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHtcclxuICAgICAgICAgIGRvY3VtZW50b0lkLFxyXG4gICAgICAgICAgZXN0YUFudWxhZG86IGZhbHNlLFxyXG4gICAgICAgICAgZXN0YWRvTWFuaWZpZXN0bzogZXN0YWRvRmluYWxNYW5pZmllc3RvLFxyXG4gICAgICAgICAgdGlwb0VzdGFkb01hbmlmaWVzdG86IHRpcG9Fc3RhZG9GaW5hbE1hbmlmaWVzdG8sXHJcbiAgICAgICAgICB0aXBvRG9jdW1lbnRvOiB0aXBvRG9jdW1lbnRvRmluYWwgfHwgdGlwb0RvY3VtZW50byB8fCBudWxsLFxyXG4gICAgICAgICAgbWVzc2FnZTogXCJNYW5pZmVzdCBjbG9zZWRcIixcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gUmVzcG9uc2VVdGlsLnN1Y2Nlc3MocmVzdWx0LCBcIk1hbmlmZXN0IGNsb3NlZFwiKTtcclxuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICAgIC8vIFJvbGxiYWNrIGRlIGxhIHRyYW5zYWNjacOzbiBlbiBjYXNvIGRlIGVycm9yXHJcbiAgICAgICAgYXdhaXQgcXVlcnlSdW5uZXIucm9sbGJhY2tUcmFuc2FjdGlvbigpO1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgICBcIkVycm9yIGVuIHByb2Nlc28gZGUgY29uc29saWRhY2nDs24uIFRyYW5zYWNjacOzbiByZXZlcnRpZGE6XCIsXHJcbiAgICAgICAgICBlcnJvclxyXG4gICAgICAgICk7XHJcbiAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgLy8gTGliZXJhciBlbCBRdWVyeVJ1bm5lclxyXG4gICAgICAgIGF3YWl0IHF1ZXJ5UnVubmVyLnJlbGVhc2UoKTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICB0aHJvdyBSZXNwb25zZVV0aWwuaW50ZXJuYWxFcnJvcihlcnJvcik7XHJcbiAgICB9XHJcbiAgfVxyXG4gIFxyXG4gIGFzeW5jIGNsb3NlTWFuaWZlc3RTUVMocGF5bG9hZDogQ2xvc2VNYW5pZmVzdER0bywgcmVxdWVzdD86IFJlcXVlc3RJbnRlcmZhY2UpIHtcclxuICAgIC8qXHJcbiAgICAgKiBQUk9DRVNPIEFTw41OQ1JPTk8gREUgQ0lFUlJFIERFIE1BTklGSUVTVE86XHJcbiAgICAgKiBcclxuICAgICAqIEVzdGUgbcOpdG9kbyBlbnbDrWEgZWwgcHJvY2VzbyBkZSBjaWVycmUgZGUgbWFuaWZpZXN0byBkaXJlY3RhbWVudGUgYSBTUVMuXHJcbiAgICAgKiBFbCBzZXJ2aWNpbyBtYXJjb3MvbWluaW1pc19wd2ViX3BvbGxpbmdfcHJvY2VzcyBjb25zdW1pcsOhIGVsIG1lbnNhamUgeSBsbyBwcm9jZXNhcsOhLlxyXG4gICAgICogXHJcbiAgICAgKiBFbCBwb2xsaW5nIHByb2Nlc3MgYWN0dWFsaXphcsOhIGVsIGVzdGFkbyBlbiBEeW5hbW9EQiB1c2FuZG8gZWwgcmVxdWVzdElkLlxyXG4gICAgICovXHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCB7IGRvY3VtZW50b0lkIH0gPSBwYXlsb2FkO1xyXG4gICAgICBcclxuICAgICAgLy8gT2J0ZW5lciB1c2VySWQgZGVsIHJlcXVlc3Qgc2kgZXN0w6EgZGlzcG9uaWJsZVxyXG4gICAgICBsZXQgdXNlcklkOiBzdHJpbmcgfCB1bmRlZmluZWQ7XHJcbiAgICAgIGlmIChyZXF1ZXN0Py51c2VyKSB7XHJcbiAgICAgICAgY29uc3QgeyBzdWIgfSA9IHJlcXVlc3QudXNlcjtcclxuICAgICAgICB1c2VySWQgPSBzdWI/LnNwbGl0KCdfJykucG9wKCkgfHwgdW5kZWZpbmVkO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBFbnZpYXIgbWVuc2FqZSBkaXJlY3RhbWVudGUgYSBTUVMgdXNhbmRvIE1hbmlmZXN0U1FTU2VydmljZVxyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLm1hbmlmZXN0U1FTU2VydmljZS5zZW5kTWFuaWZlc3RDbG9zZU1lc3NhZ2UoXHJcbiAgICAgICAgZG9jdW1lbnRvSWQsXHJcbiAgICAgICAgdXNlcklkLFxyXG4gICAgICAgIDIgLy8gZGVsYXlTZWNvbmRzIHBvciBkZWZlY3RvXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBpZiAoIXJlc3VsdC5zdWNjZXNzKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEh0dHBFeGNlcHRpb24oXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdFcnJvciBhbCBlbnZpYXIgbWVuc2FqZSBhIFNRUycsXHJcbiAgICAgICAgICAgIGVycm9yOiByZXN1bHQuZXJyb3IsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgSHR0cFN0YXR1cy5JTlRFUk5BTF9TRVJWRVJfRVJST1JcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBSZXRvcm5hciBpbmZvcm1hY2nDs24gY29uIGVsIHJlcXVlc3RJZCBwYXJhIHF1ZSBlbCBjbGllbnRlIHB1ZWRhIGNvbnN1bHRhciBlbCBlc3RhZG9cclxuICAgICAgcmV0dXJuIFJlc3BvbnNlVXRpbC5zdWNjZXNzKFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGRvY3VtZW50b0lkLFxyXG4gICAgICAgICAgcmVxdWVzdElkOiByZXN1bHQucmVxdWVzdElkLFxyXG4gICAgICAgICAgbWVzc2FnZUlkOiByZXN1bHQubWVzc2FnZUlkLFxyXG4gICAgICAgICAgc3RhdHVzOiAncGVuZGluZycsXHJcbiAgICAgICAgICBtZXNzYWdlOiAnUHJvY2VzbyBkZSBjaWVycmUgZGUgbWFuaWZpZXN0byBlbnZpYWRvIGEgbGEgY29sYSBTUVMuIEVsIHBvbGxpbmcgcHJvY2VzcyBsbyBwcm9jZXNhcsOhIGFzw61uY3JvbmFtZW50ZS4nLFxyXG4gICAgICAgICAgbm90ZTogYFVzYSBlbCByZXF1ZXN0SWQgKCR7cmVzdWx0LnJlcXVlc3RJZH0pIHBhcmEgY29uc3VsdGFyIGVsIGVzdGFkbyBkZWwgcHJvY2VzbyBlbiBEeW5hbW9EQiBjdWFuZG8gZWwgcG9sbGluZyBwcm9jZXNzIGxvIHByb2Nlc2UuYCxcclxuICAgICAgICB9LFxyXG4gICAgICAgICdDaWVycmUgZGUgbWFuaWZpZXN0byBlbnZpYWRvIGEgU1FTIHBhcmEgcHJvY2VzYW1pZW50byBhc8OtbmNyb25vJ1xyXG4gICAgICApO1xyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBIdHRwRXhjZXB0aW9uKSB7XHJcbiAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgIH1cclxuICAgICAgdGhyb3cgUmVzcG9uc2VVdGlsLmludGVybmFsRXJyb3IoZXJyb3IpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3VsdGEgZWwgZXN0YWRvIGRlbCBwcm9jZXNvIGRlIGNpZXJyZSBkZSBtYW5pZmllc3RvIHBvciByZXF1ZXN0SWRcclxuICAgKiBcclxuICAgKiBDb25zdWx0YSBlbCBlc3RhZG8gZGVzZGUgRHluYW1vREIgZG9uZGUgZWwgcG9sbGluZyBwcm9jZXNzIGxvIGFjdHVhbGl6YS5cclxuICAgKiBTaSBubyBlbmN1ZW50cmEgZW4gRHluYW1vREIsIGludGVudGEgY29uc3VsdGFyIEFQSSBHYXRld2F5IGNvbW8gZmFsbGJhY2tcclxuICAgKiAocGFyYSBjb21wYXRpYmlsaWRhZCBjb24gcHJvY2Vzb3MgYW50aWd1b3MpLlxyXG4gICAqIFxyXG4gICAqIEBwYXJhbSByZXF1ZXN0SWQgLSBJZGVudGlmaWNhZG9yIMO6bmljbyBkZWwgcHJvY2VzbyAoVVVJRClcclxuICAgKi9cclxuICBhc3luYyBnZXRNYW5pZmVzdENsb3NlU3RhdHVzKHJlcXVlc3RJZDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIENvbnN1bHRhciBEeW5hbW9EQiAobcOpdG9kbyBwcmluY2lwYWwpXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3Qgc3RhdHVzUmVjb3JkID0gYXdhaXQgdGhpcy5leHBvcnRTdGF0dXNTZXJ2aWNlLmdldFN0YXR1cyhyZXF1ZXN0SWQpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChzdGF0dXNSZWNvcmQpIHtcclxuICAgICAgICAgIC8vIEV4dHJhZXIgZG9jdW1lbnRvSWQgZGVsIGZpbGVOYW1lIHNpIGVzdMOhIGRpc3BvbmlibGVcclxuICAgICAgICAgIC8vIEVsIGZpbGVOYW1lIHB1ZWRlIGNvbnRlbmVyOiBcIk1hbmlmZXN0IGNsb3NlZCBzdWNjZXNzZnVsbHkgLSBEb2N1bWVudG9JZDogMTIzXCJcclxuICAgICAgICAgIGxldCBkb2N1bWVudG9JZDogbnVtYmVyIHwgdW5kZWZpbmVkO1xyXG4gICAgICAgICAgaWYgKHN0YXR1c1JlY29yZC5maWxlTmFtZSkge1xyXG4gICAgICAgICAgICBjb25zdCBtYXRjaCA9IHN0YXR1c1JlY29yZC5maWxlTmFtZS5tYXRjaCgvRG9jdW1lbnRvSWQ6XFxzKihcXGQrKS9pKTtcclxuICAgICAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgZG9jdW1lbnRvSWQgPSBwYXJzZUludChtYXRjaFsxXSwgMTApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmV0dXJuIFJlc3BvbnNlVXRpbC5zdWNjZXNzKFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgcmVxdWVzdElkOiBzdGF0dXNSZWNvcmQucmVxdWVzdElkLFxyXG4gICAgICAgICAgICAgIGRvY3VtZW50b0lkOiBkb2N1bWVudG9JZCxcclxuICAgICAgICAgICAgICBzdGF0dXM6IHN0YXR1c1JlY29yZC5zdGF0dXMsXHJcbiAgICAgICAgICAgICAgY3JlYXRlZEF0OiBzdGF0dXNSZWNvcmQuY3JlYXRlZEF0LFxyXG4gICAgICAgICAgICAgIHVwZGF0ZWRBdDogc3RhdHVzUmVjb3JkLnVwZGF0ZWRBdCxcclxuICAgICAgICAgICAgICBzaWduZWRVcmw6IHN0YXR1c1JlY29yZC5zaWduZWRVcmwsXHJcbiAgICAgICAgICAgICAgZmlsZU5hbWU6IHN0YXR1c1JlY29yZC5maWxlTmFtZSxcclxuICAgICAgICAgICAgICBlcnJvcjogc3RhdHVzUmVjb3JkLmVycm9yLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAnRXN0YWRvIGRlbCBwcm9jZXNvIGRlIGNpZXJyZSBkZSBtYW5pZmllc3RvJ1xyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKGR5bmFtb0Vycm9yOiBhbnkpIHtcclxuICAgICAgICAvLyBTaSBEeW5hbW9EQiBubyBlc3TDoSBjb25maWd1cmFkbyBvIGhheSBlcnJvciwgaW50ZW50YXIgQVBJIEdhdGV3YXkgY29tbyBmYWxsYmFja1xyXG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKGBEeW5hbW9EQiBxdWVyeSBmYWlsZWQsIHRyeWluZyBBUEkgR2F0ZXdheSBmYWxsYmFjazogJHtkeW5hbW9FcnJvci5tZXNzYWdlfWApO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEh0dHBFeGNlcHRpb24pIHtcclxuICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgfVxyXG4gICAgICB0aHJvdyBSZXNwb25zZVV0aWwuaW50ZXJuYWxFcnJvcihlcnJvcik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxufVxyXG4iXX0=