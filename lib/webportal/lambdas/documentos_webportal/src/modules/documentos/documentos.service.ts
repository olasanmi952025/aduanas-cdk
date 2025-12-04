import { DocDocumentoBase } from "./entities";
import {
  DocLocacionDocumento,
  DocParticipacion,
} from "../dictionaries/entities";
import {
  BuscarDocumentosDto,
  ObtenerDetallesCompletosDto,
  CloseManifestDto,
} from "./dto/documentos.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { XmlUtil } from "../../shared/utils/xml.util";
import {
  Repository,
  SelectQueryBuilder,
  DataSource,
  QueryRunner,
} from "typeorm";
import { ResponseUtil } from "../../shared/utils/response.util";
import { Injectable, NotFoundException, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { ManifestSQSService } from '../../service/manifest-sqs.service';
import { ExportStatusService } from '../../service/export-status.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RequestInterface } from '../../interfaces/request.interface';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  constructor(
    @InjectRepository(DocDocumentoBase)
    private readonly documentoBaseRepository: Repository<DocDocumentoBase>,
    @InjectRepository(DocParticipacion)
    private readonly participacionRepository: Repository<DocParticipacion>,
    @InjectRepository(DocLocacionDocumento)
    private readonly locacionDocumentoRepository: Repository<DocLocacionDocumento>,
    private readonly dataSource: DataSource,
    private readonly manifestSQSService: ManifestSQSService,
    private readonly exportStatusService: ExportStatusService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Build ORDER BY clause safely based on sortBy and sortOrder
   * @param sortBy - Field name from frontend
   * @param sortOrder - Direction (asc or desc)
   * @returns Safe SQL ORDER BY clause
   */
  private buildOrderBy(sortBy?: string, sortOrder?: 'asc' | 'desc'): string {
    const sortFieldMap: Record<string, string> = {
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

    if (sqlColumn === 'FECHACREACION') return `dd.FECHACREACION ${direction}`;

    return `${sqlColumn} ${direction}`;
  }

  /**
   * Search documents in the database based on filters
   * @param filters
   * @returns
   */
  async searchDocuments(filters: BuscarDocumentosDto) {
    try {
      const where: string[] = [];
      const joins: string[] = [];
      const params: Record<string, unknown> = {};

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
        joins.push(
          "LEFT JOIN DOCUMENTOS.DOCLOCACIONDOCUMENTO dld ON dld.DOCUMENTO = dd.ID"
        );
        where.push("dld.ACTIVA = 'S'");
      }

      // Rango de fechas por tipo
      // No aplicar filtros de fechas si se está buscando por número de aceptación o número de referencia original
      const tieneBusquedaEspecifica = !!(filters?.numeroAceptacion || filters?.numeroManifiestoOriginal);
      
      if (!tieneBusquedaEspecifica && (filters?.tipoFecha || filters?.fechaDesde || filters?.fechaHasta)) {
        let columnaFecha = "";

        if (filters?.tipoFecha) {
          joins.push(
            "JOIN DOCUMENTOS.DOCFECHADOCUMENTO dfd ON dfd.DOCUMENTO = dd.ID AND dfd.TIPOFECHA = :tipoFecha"
          );
          columnaFecha = "dfd.FECHA";
          where.push("dfd.TIPOFECHA = :tipoFecha");
          params.tipoFecha = String(filters.tipoFecha);
        } else {
          // Si no se especifica tipoFecha, usar FECHAEMISION del documento
          columnaFecha = "dd.FECHAEMISION";
        }

        if (filters.fechaDesde) {
          console.log("fechaDesde-----------------------", filters.fechaDesde);
          where.push(
            `${columnaFecha} >= TO_DATE(:fechaDesde, 'DD/MM/YYYY HH24:MI:SS')`
          );
          params.fechaDesde = `${String(filters.fechaDesde)} 00:00:00`;
        }
        if (filters.fechaHasta) {
          console.log("fechaHasta-----------------------", filters.fechaHasta);
          where.push(
            `${columnaFecha} <= TO_DATE(:fechaHasta, 'DD/MM/YYYY HH24:MI:SS')`
          );
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
      if (filters?.tipoParticipante) {
        if(filters.tipoParticipante.toUpperCase() === 'EMISOR'){
          filters.tipoParticipante = 'EMI';
        }
        console.log("tipoParticipante-----------------------", filters.tipoParticipante);
        where.push("P.ROL = :tipoParticipante");
        params.tipoParticipante = String(filters.tipoParticipante).trim();
      }

      /**es para filtrar por el nombre del emisor en la tabla DOCPARTICIPACION */
      if (filters?.emisor) {
        where.push("UPPER(P.NOMBREPARTICIPANTE) LIKE UPPER(:emisor)");
        params.emisor = `%${String(filters.emisor).trim()}%`;
      }

      if (filters?.tipoLocacion) {
        where.push("dld.TIPOLOCACION = :tipoLocacion");
        params.tipoLocacion = String(filters.tipoLocacion);
      }

      if (filters?.locacion) {
        console.log("locacion-----------------------", filters.locacion);
        const locacionValue = String(filters.locacion).trim();
        // Si es numérico, comparar con IDLOCACION
        if (/^\d+$/.test(locacionValue)) {
          where.push("dld.IDLOCACION = :locacion");
          params.locacion = Number(locacionValue);
        } else {
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
        params.numeroReferenciaOriginal = String(
          filters.numeroManifiestoOriginal
        );
      }

      if (filters?.estado) {
        where.push("eo.TIPOESTADO = :estado");
        params.estado = String(filters.estado);
      }

      if (filters?.sentidoOperacion) {
        where.push("dtm.TIPOMANIFIESTO = :sentidoOperacion");
        params.sentidoOperacion = String(filters.sentidoOperacion);
      }

      if (filters?.numeroVuelo) {
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

      const [paginatedQuery, paginatedParameters] =
        driver.escapeQueryWithParameters(paginatedSql, params, {});

      const rows = await this.dataSource.query(
        paginatedQuery,
        paginatedParameters
      );

      // Conteo total (sin paginación) - usar parámetros sin rownum
      const countSql = `SELECT COUNT(1) AS TOTAL FROM (${sql})`;
      const [countQuery, countParameters] = driver.escapeQueryWithParameters(
        countSql,
        params,
        {}
      );
      const countRows = await this.dataSource.query(
        countQuery,
        countParameters
      );
      const total = Number(countRows?.[0]?.TOTAL || 0);

      // Mapear respuesta
      const documentos = rows.map((r: any) => ({
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

      return ResponseUtil.success(result, "Documentos obtenidos exitosamente");
    } catch (error: any) {
      throw ResponseUtil.internalError(error);
    }
  }

  async exportDocuments(filters: BuscarDocumentosDto): Promise<string> {
    try {
      const where: string[] = [];
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
      let xml = XmlUtil.createXmlHeader();
      xml += "<Rows>\n";

      for (const row of rows) {
        xml += "<Row>\n";
        xml += `  <NumeroDoc>${XmlUtil.escapeXml(
          row.NUMEROEXTERNO || ""
        )}</NumeroDoc>\n`;
        xml += `  <MotivoSeleccion>${XmlUtil.escapeXml(
          row.MOTIVO_SELECCION || ""
        )}</MotivoSeleccion>\n`;
        xml += `  <ResultadoSeleccion>${XmlUtil.escapeXml(
          row.RESULTADO_SELECCION || ""
        )}</ResultadoSeleccion>\n`;
        xml += `  <Detalle>Más Info.</Detalle>\n`;
        xml += "</Row>\n";
      }

      xml += "</Rows>";

      return xml;
    } catch (error: any) {
      throw ResponseUtil.internalError(error);
    }
  }

  /**
   * Envía un proceso de exportación XML a la cola SQS para procesamiento asíncrono
   * El polling process (marcos/minimis_pweb_polling_process) consumirá el mensaje y lo procesará.
   * El polling process actualizará el estado en DynamoDB usando el requestId.
   */
  async exportDocumentsSQS(filters: BuscarDocumentosDto, fileName?: string) {
    try {
      // Convertir DTO a objeto plano para el mensaje
      const filtersObj: Record<string, any> = {};
      if (filters.numeroAceptacion) filtersObj.numeroAceptacion = filters.numeroAceptacion;
      if (filters.tipoDocumento) filtersObj.tipoDocumento = filters.tipoDocumento;
      if (filters.userId) filtersObj.userId = filters.userId;
      if (filters.tipoLocacion) filtersObj.tipoLocacion = filters.tipoLocacion;
      if (filters.locacion) filtersObj.locacion = filters.locacion;
      if (filters.tipoFecha) filtersObj.tipoFecha = filters.tipoFecha;
      if (filters.fechaDesde) filtersObj.fechaDesde = filters.fechaDesde;
      if (filters.fechaHasta) filtersObj.fechaHasta = filters.fechaHasta;
      if (filters.sentidoOperacion) filtersObj.sentidoOperacion = filters.sentidoOperacion;
      if (filters.numeroVuelo) filtersObj.numeroVuelo = filters.numeroVuelo;
      if (filters.numeroManifiestoOriginal) filtersObj.numeroManifiestoOriginal = filters.numeroManifiestoOriginal;
      if (filters.estado) filtersObj.estado = filters.estado;
      if (filters.tipoParticipante) filtersObj.tipoParticipante = filters.tipoParticipante;
      if (filters.emisor) filtersObj.emisor = filters.emisor;

      // Enviar mensaje directamente a SQS usando ManifestSQSService
      const result = await this.manifestSQSService.sendXmlExportMessage(
        filtersObj,
        fileName
      );

      if (!result.success) {
        throw new HttpException(
          {
            message: 'Error al enviar mensaje a SQS',
            error: result.error,
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Retornar información con el requestId para que el cliente pueda consultar el estado
      return ResponseUtil.success(
        {
          requestId: result.requestId,
          messageId: result.messageId,
          status: 'pending',
          message: 'Proceso de exportación XML enviado a la cola SQS. El polling process lo procesará asíncronamente.',
          note: `Usa el requestId (${result.requestId}) para consultar el estado del proceso en DynamoDB cuando el polling process lo procese.`,
        },
        'Exportación XML enviada a SQS para procesamiento asíncrono'
      );
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw ResponseUtil.internalError(error);
    }
  }

  /**
   * Consulta el estado del proceso de exportación XML por requestId
   * 
   * Consulta el estado desde DynamoDB donde el polling process lo actualiza.
   */
  async getXmlExportStatus(requestId: string) {
    try {
      // Consultar DynamoDB
      const statusRecord = await this.exportStatusService.getStatus(requestId);
      
      if (!statusRecord) {
        throw new NotFoundException(
          `No se encontró un proceso de exportación XML con el requestId: ${requestId}`
        );
      }

      return ResponseUtil.success(
        {
          requestId: statusRecord.requestId,
          status: statusRecord.status,
          createdAt: statusRecord.createdAt,
          updatedAt: statusRecord.updatedAt,
          signedUrl: statusRecord.signedUrl,
          fileName: statusRecord.fileName,
          error: statusRecord.error,
        },
        'Estado del proceso de exportación XML'
      );
    } catch (error: any) {
      if (error instanceof HttpException || error instanceof NotFoundException) {
        throw error;
      }
      throw ResponseUtil.internalError(error);
    }
  }

  async closeManifestSync(payload: CloseManifestDto) {
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
      const paso0Params: Record<string, unknown> = {
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

      const [escapedPaso0Query, escapedPaso0Params] =
        driver.escapeQueryWithParameters(paso0Sql, paso0Params, {});

      const paso0Rows = await this.dataSource.query(
        escapedPaso0Query,
        escapedPaso0Params
      );

      // Validar que el documento existe
      if (!paso0Rows || paso0Rows.length === 0) {
        return ResponseUtil.success(
          {
            documentoId,
            valido: false,
            message: "El documento no existe o no es un manifiesto válido",
          },
          "Documento no encontrado"
        );
      }

      const documentoInfo = paso0Rows[0];
      const estado = documentoInfo?.ESTADO || documentoInfo?.estado;
      const tipo_estado =
        documentoInfo?.TIPO_ESTADO || documentoInfo?.tipo_estado;
      const revisado = documentoInfo?.REVISADO || documentoInfo?.revisado;

      // Validar que el estado sea "ACEPTADO" (la consulta ya trae el nombre del estado)
      const estadoAceptado = estado && estado.toUpperCase() === "ACEPTADO";

      // Validar también por el código del tipo de estado (ambas deben concordar)
      const tipoEstadoAceptado =
        tipo_estado &&
        (tipo_estado.toUpperCase().includes("ACP") || tipo_estado === "ACP");

      if (!estadoAceptado || !tipoEstadoAceptado) {
        return ResponseUtil.success(
          {
            documentoId,
            valido: false,
            estado: estado,
            revisado: revisado,
            message: `El manifiesto no está en estado Aceptado. Estado actual: ${estado}`,
          },
          "Estado no válido para cerrar manifiesto"
        );
      }

      // Validar que no esté revisado
      if (revisado === "SI" || revisado === "si" || revisado === "Si") {
        return ResponseUtil.success(
          {
            documentoId,
            valido: false,
            estado: estado,
            revisado: revisado,
            message: "El manifiesto ya fue revisado, no se puede cerrar",
          },
          "Manifiesto ya revisado"
        );
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
      const estaAnulado =
        tipo_estado && tipo_estado.toUpperCase() === "ANU";

      // 2. Si tiene estado anulado, no ejecutar el proceso
      if (estaAnulado) {
        return ResponseUtil.success(
          {
            documentoId,
            estaAnulado: true,
            message: "El manifiesto está anulado, no se puede cerrar",
          },
          "Manifiesto anulado"
        );
      }
      console.log("Paso el paso 02");

      // ========================================================================
      // PASO 03: Verificar que el tipo de manifiesto sea MFTOC y crear variable GTIME
      // ========================================================================
      const tipoDocumento =
        documentoInfo?.TIPODOCUMENTO || documentoInfo?.tipodocumento || null;

      // 4. Comparar que sea MFTOC para buscar las guías
      let tipoDocT: string | null = null; // Variable para trabajar con el tipo de documento relacionado

      if (tipoDocumento === "MFTOC") {
        tipoDocT = "GTIME"; // Si es MFTOC, trabajamos con guías tipo GTIME
      }

      // Si no es MFTOC, no se puede cerrar el manifiesto
      if (tipoDocumento !== "MFTOC") {
        return ResponseUtil.success(
          {
            documentoId,
            valido: false,
            tipoDocumento: tipoDocumento,
            message: `El documento no es un manifiesto MFTOC. Tipo de documento: ${tipoDocumento}`,
          },
          "Tipo de documento no válido"
        );
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

      const documentosRelacionadosParams: Record<string, unknown> = {
        idManifiesto: documentoId,
        tipoDocT: tipoDocT,
      };

      const [escapedRelacionadosQuery, escapedRelacionadosParams] =
        driver.escapeQueryWithParameters(
          buscarDocumentosRelacionadosSql,
          documentosRelacionadosParams,
          {}
        );

      const documentosRelacionadosRows = await this.dataSource.query(
        escapedRelacionadosQuery,
        escapedRelacionadosParams
      );

      // Extraer los IDs de los documentos relacionados
      const idsDocumentosRelacionados =
        documentosRelacionadosRows?.map(
          (row: any) => row.Id || row.id || row.ID
        ) || [];

      console.log(
        "Documentos relacionados encontrados:",
        idsDocumentosRelacionados.length
      );
      console.log("Paso el paso 04", idsDocumentosRelacionados);
      /**/
      // INICIAR PROCESO DE TRANSACCIONES DE BD
      // Crear QueryRunner para manejar la transacción
      const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Consolidación de guías: Por cada Guía asociada al manifiesto
        const documentosParaConsolidar: number[] = [];

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
          const [escapedEstadosQuery, escapedEstadosParams] =
            driver.escapeQueryWithParameters(
              obtenerEstadosDocumentoSql,
              { idDocumento: idDocumento },
              {}
            );

          const estadosRows = await queryRunner.query(
            escapedEstadosQuery,
            escapedEstadosParams
          );

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
            console.log(
              `[CONSOLIDACION] Documento ${idDocumento} ANULADO no se CONSOLIDA`
            );
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

          const [escapedMaxIdQuery, escapedMaxIdParams] =
            driver.escapeQueryWithParameters(
              calcularMaxIdEstadoSql,
              {
                idDocumento: idDocumento,
                tipoDocT: tipoDocT,
              },
              {}
            );

          const maxIdRows = await queryRunner.query(
            escapedMaxIdQuery,
            escapedMaxIdParams
          );

          let nextIdEstado = 1;

          if (maxIdRows && maxIdRows.length > 0) {
            const row = maxIdRows[0];
            let maxId = null;

            if (row.MAXID !== undefined) {
              maxId = row.MAXID;
            } else if (row.MaxId !== undefined) {
              maxId = row.MaxId;
            } else if (row.maxid !== undefined) {
              maxId = row.maxid;
            } else if (row.MAX_ID !== undefined) {
              maxId = row.MAX_ID;
            }

            if (maxId !== null && maxId !== undefined && maxId !== "") {
              const maxIdNumber = Number(maxId);
              if (!isNaN(maxIdNumber)) {
                nextIdEstado = maxIdNumber + 1;
              }
            }
          }

          console.log(
            `Documento ${idDocumento}: Siguiente Id para estado CMP será ${nextIdEstado}`
          );
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

          const [escapedInsertQuery, escapedInsertParams] =
            driver.escapeQueryWithParameters(
              insertarEstadoCmpSql,
              {
                idDocumento: idDocumento,
                tipoDocT: tipoDocT,
                nextIdEstado: nextIdEstado,
                fechaConsolidacion: fechaConsolidacion,
              },
              {}
            );

          await queryRunner.query(escapedInsertQuery, escapedInsertParams);

          console.log(
            `Estado CMP insertado para documento ${idDocumento} con Id ${nextIdEstado}`
          );
          
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

          const [escapedRelacionesQuery, escapedRelacionesParams] =
            driver.escapeQueryWithParameters(
              buscarRelacionesPendientesSql,
              { idDocumento: idDocumento },
              {}
            );

          const relacionesPendientesRows = await queryRunner.query(
            escapedRelacionesQuery,
            escapedRelacionesParams
          );
          
          console.log(
            `Documento ${idDocumento}: Encontradas ${
              relacionesPendientesRows?.length || 0
            } relaciones pendientes`
          );
          console.log("relacionesPendientesRows", relacionesPendientesRows);

          
          // Por cada relación encontrada a la guía
          for (const relacionRow of relacionesPendientesRows || []) {
            try {
              const tipoRelacion =
                relacionRow.TipoRelacion || relacionRow.tiporelacion;
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

              const [escapedCorrelativeQuery, escapedCorrelativeParams] =
                driver.escapeQueryWithParameters(
                  calcularNextCorrelativeSql,
                  {
                    tipoRelacion: tipoRelacion,
                    idDocumento: idDocumento,
                    relacionId: relacionId,
                  },
                  {}
                );

              const correlativeRows = await queryRunner.query(
                escapedCorrelativeQuery,
                escapedCorrelativeParams
              );

              // Calcular NextCorrelative (similar a nextIdEstado)
              let nextCorrelative = 1;
              if (correlativeRows && correlativeRows.length > 0) {
                const row = correlativeRows[0];
                let maxId = null;

                if (row.MAXID !== undefined) {
                  maxId = row.MAXID;
                } else if (row.MaxId !== undefined) {
                  maxId = row.MaxId;
                } else if (row.maxid !== undefined) {
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

              const [escapedHistorialQuery, escapedHistorialParams] =
                driver.escapeQueryWithParameters(
                  insertarHistorialRelacionSql,
                  {
                    nextCorrelative: nextCorrelative,
                    fechaConsolidacion: fechaConsolidacion,
                    tipoRelacion: tipoRelacion,
                    idDocumento: idDocumento,
                    relacionId: relacionId,
                  },
                  {}
                );

              await queryRunner.query(
                escapedHistorialQuery,
                escapedHistorialParams
              );

              console.log(
                `Historial de relación insertado: TipoRelacion=${tipoRelacion}, RelacionId=${relacionId}, Correlative=${nextCorrelative}`
              );

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

              const [escapedUpdateQuery, escapedUpdateParams] =
                driver.escapeQueryWithParameters(
                  actualizarRelacionSql,
                  {
                    docId: docId,
                    tipoRelacion: tipoRelacion,
                    idDocumento: idDocumento,
                    relacionId: relacionId,
                  },
                  {}
                );

              await queryRunner.query(escapedUpdateQuery, escapedUpdateParams);

              console.log(
                `Relación actualizada: DocDestino=${docId} asignado a TipoRelacion=${tipoRelacion}, RelacionId=${relacionId}`
              );
            } catch (error: any) {
              console.error(
                `Error al procesar relación para documento ${idDocumento}:`,
                error
              );
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

          const [escapedHuerfanoQuery, escapedHuerfanoParams] =
            driver.escapeQueryWithParameters(
              verificarEsHuerfanoSql,
              {
                idDocumento: idDocumento,
              },
              {}
            );

          const huerfanoRows = await queryRunner.query(
            escapedHuerfanoQuery,
            escapedHuerfanoParams
          );

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

            const [escapedMaxIdHQuery, escapedMaxIdHParams] =
              driver.escapeQueryWithParameters(
                calcularMaxIdEstadoHSql,
                {
                  idDocumento: idDocumento,
                  tipoDocT: tipoDocT,
                },
                {}
              );

            const maxIdHRows = await queryRunner.query(
              escapedMaxIdHQuery,
              escapedMaxIdHParams
            );

            let nextIdEstadoH = 1;
            if (maxIdHRows && maxIdHRows.length > 0) {
              const row = maxIdHRows[0];
              let maxIdH = null;

              if (row.MAXID !== undefined) {
                maxIdH = row.MAXID;
              } else if (row.MaxId !== undefined) {
                maxIdH = row.MaxId;
              } else if (row.maxid !== undefined) {
                maxIdH = row.maxid;
              } else if (row.MAX_ID !== undefined) {
                maxIdH = row.MAX_ID;
              }

              if (maxIdH !== null && maxIdH !== undefined && maxIdH !== "") {
                const maxIdHNumber = Number(maxIdH);
                if (!isNaN(maxIdHNumber)) {
                  nextIdEstadoH = maxIdHNumber + 1;
                }
              }
            }

            console.log(
              `Documento ${idDocumento}: Siguiente Id para estado H será ${nextIdEstadoH}`
            );

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

            const [escapedInsertHQuery, escapedInsertHParams] =
              driver.escapeQueryWithParameters(
                insertarEstadoHSql,
                {
                  idDocumento: idDocumento,
                  tipoDocT: tipoDocT,
                  nextIdEstadoH: nextIdEstadoH,
                  fechaEstadoH: fechaEstadoH,
                },
                {}
              );

            await queryRunner.query(escapedInsertHQuery, escapedInsertHParams);

            console.log(
              `Estado H insertado para documento ${idDocumento} con Id ${nextIdEstadoH}`
            );
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

            const [escapedCiclosQuery, escapedCiclosParams] =
              driver.escapeQueryWithParameters(
                buscarCiclosAbiertosSql,
                {
                  idDocumento: idDocumento.toString(),
                },
                {}
              );

            const ciclosRows = await queryRunner.query(
              escapedCiclosQuery,
              escapedCiclosParams
            );
            console.log("Ciclos abiertos encontrados: ", ciclosRows);
            encontroCiclo = ciclosRows && ciclosRows.length > 0;
            console.log("encontroCiclo", encontroCiclo);
            if (encontroCiclo) {
              const cicloRow = ciclosRows[0];
              let activityName = cicloRow.ActivityName || cicloRow.activityname;
              let cicleId =
                cicloRow.CicleId || cicloRow.cicleid || cicloRow.CICLEID;

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

                const [escapedCerrarQuery, escapedCerrarParams] =
                  driver.escapeQueryWithParameters(
                    cerrarCicloSql,
                    {
                      activityName: activityName,
                      cicleId: cicleId,
                    },
                    {}
                  );

                await queryRunner.query(
                  escapedCerrarQuery,
                  escapedCerrarParams
                );

                console.log(
                  `Ciclo cerrado para documento ${idDocumento}: ActivityName=${activityName}, CicleId=${cicleId}`
                );

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

                const [escapedPadreQuery, escapedPadreParams] =
                  driver.escapeQueryWithParameters(
                    buscarPadreSql,
                    {
                      activityName: activityName,
                      cicleId: cicleId,
                    },
                    {}
                  );

                const padreRows = await queryRunner.query(
                  escapedPadreQuery,
                  escapedPadreParams
                );

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
                } else {
                  activityName = null;
                }
              }
            }
          } while (encontroCiclo);
          /** fin dentro del for */
        } // Fin del for de documentos
        /**/
        // Fin de Consolidación de guías
        
        console.log(
          `Documentos válidos para consolidar: ${documentosParaConsolidar.length} de ${idsDocumentosRelacionados.length}`
        );
        
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

            const [escapedBatchQuery, escapedBatchParams] =
              driver.escapeQueryWithParameters(
                consolidacionBatchSql,
                { idManifiesto: documentoId },
                {}
              );

            await queryRunner.query(escapedBatchQuery, escapedBatchParams);

            console.log(
              `[PASO 16] Proceso batch de consolidación ejecutado para manifiesto ${documentoId}`
            );
          } catch (batchError) {
            console.error(
              `[PASO 16] Error al ejecutar proceso batch para manifiesto ${documentoId}:`,
              batchError
            );
            // Mantener el comportamiento del código legado: registrar el error y continuar
          }
        } else {
          console.log(
            `[PASO 16] Tipo de documento ${tipoDocumento} no requiere proceso batch`
          );
        }
        // ========================================================================
        // PASO 17: Cambiar estado del manifiesto de "Aceptado" a "Conformado"
        // ========================================================================
        if (tipoDocumento === "MFTOC") {
          console.log(
            `[PASO 17] Iniciando cambio de estado a CMP para manifiesto ${documentoId}`
          );

          const calcularMaxIdManifestoSql = `
            SELECT MAX(Id) AS MaxId
            FROM DOCUMENTOS.DocEstados
            WHERE Documento = :idDocumento
              AND TipoDocumento = :tipoDocumento
              AND TipoEstado = 'CMP'
          `;

          const [escapedMaxIdManifestoQuery, escapedMaxIdManifestoParams] =
            driver.escapeQueryWithParameters(
              calcularMaxIdManifestoSql,
              {
                idDocumento: documentoId,
                tipoDocumento: "MFTOC",
              },
              {}
            );

          const maxIdManifestoRows = await queryRunner.query(
            escapedMaxIdManifestoQuery,
            escapedMaxIdManifestoParams
          );

          let nextIdEstadoManifiesto = 1;

          if (maxIdManifestoRows && maxIdManifestoRows.length > 0) {
            const row = maxIdManifestoRows[0];
            let maxId = null;

            if (row.MAXID !== undefined) {
              maxId = row.MAXID;
            } else if (row.MaxId !== undefined) {
              maxId = row.MaxId;
            } else if (row.maxid !== undefined) {
              maxId = row.maxid;
            } else if (row.MAX_ID !== undefined) {
              maxId = row.MAX_ID;
            }

            if (maxId !== null && maxId !== undefined && maxId !== "") {
              const maxIdNumber = Number(maxId);
              if (!isNaN(maxIdNumber)) {
                nextIdEstadoManifiesto = maxIdNumber + 1;
              }
            }
          }

          console.log(
            `[PASO 17] Manifiesto ${documentoId}: siguiente Id para estado CMP será ${nextIdEstadoManifiesto}`
          );

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

          const [escapedInsertManifestoQuery, escapedInsertManifestoParams] =
            driver.escapeQueryWithParameters(
              insertarEstadoManifestoSql,
              {
                idDocumento: documentoId,
                tipoDocumento: "MFTOC",
                nextIdEstado: nextIdEstadoManifiesto,
                fechaEstado: fechaEstadoManifiesto,
              },
              {}
            );

          await queryRunner.query(
            escapedInsertManifestoQuery,
            escapedInsertManifestoParams
          );

          console.log(
            `[PASO 17] Manifiesto ${documentoId} actualizado a estado CMP`
          );
        } else {
          console.log(
            `[PASO 17] Tipo de documento ${tipoDocumento} no requiere cambio de estado a CMP`
          );
        }
        // ========================================================================
        // PASO 18: Consultar nuevamente el estado del manifiesto y retornarlo
        // ========================================================================
        const paso18Params: Record<string, unknown> = {
          p_id_documento: documentoId,
        };

        const [escapedPaso18Query, escapedPaso18Params] =
          driver.escapeQueryWithParameters(paso0Sql, paso18Params, {});

        const paso18Rows = await queryRunner.query(
          escapedPaso18Query,
          escapedPaso18Params
        );

        let estadoFinalManifiesto: string | null = null;
        let tipoEstadoFinalManifiesto: string | null = null;
        let tipoDocumentoFinal: string | null = null;

        if (paso18Rows && paso18Rows.length > 0) {
          const finalInfo = paso18Rows[0];
          estadoFinalManifiesto = finalInfo?.ESTADO || finalInfo?.estado || null;
          tipoEstadoFinalManifiesto =
            finalInfo?.TIPO_ESTADO || finalInfo?.tipo_estado || null;
          tipoDocumentoFinal =
            finalInfo?.TIPODOCUMENTO || finalInfo?.tipodocumento || null;

          console.log(
            `[PASO 18] Estado final del manifiesto ${documentoId}: ${estadoFinalManifiesto} (${tipoEstadoFinalManifiesto})`
          );
        } else {
          console.warn(
            `[PASO 18] No se pudo obtener el estado final del manifiesto ${documentoId}`
          );
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

        return ResponseUtil.success(result, "Manifest closed");
      } catch (error: any) {
        // Rollback de la transacción en caso de error
        await queryRunner.rollbackTransaction();
        console.error(
          "Error en proceso de consolidación. Transacción revertida:",
          error
        );
        throw error;
      } finally {
        // Liberar el QueryRunner
        await queryRunner.release();
      }
    } catch (error: any) {
      throw ResponseUtil.internalError(error);
    }
  }
  
  async closeManifestSQS(payload: CloseManifestDto, request?: RequestInterface) {
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
      let userId: string | undefined;
      if (request?.user) {
        const { sub } = request.user;
        userId = sub?.split('_').pop() || undefined;
      }

      // Enviar mensaje directamente a SQS usando ManifestSQSService
      const result = await this.manifestSQSService.sendManifestCloseMessage(
        documentoId,
        userId,
        2 // delaySeconds por defecto
      );

      if (!result.success) {
        throw new HttpException(
          {
            message: 'Error al enviar mensaje a SQS',
            error: result.error,
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Retornar información con el requestId para que el cliente pueda consultar el estado
      return ResponseUtil.success(
        {
          documentoId,
          requestId: result.requestId,
          messageId: result.messageId,
          status: 'pending',
          message: 'Proceso de cierre de manifiesto enviado a la cola SQS. El polling process lo procesará asíncronamente.',
          note: `Usa el requestId (${result.requestId}) para consultar el estado del proceso en DynamoDB cuando el polling process lo procese.`,
        },
        'Cierre de manifiesto enviado a SQS para procesamiento asíncrono'
      );
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw ResponseUtil.internalError(error);
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
  async getManifestCloseStatus(requestId: string): Promise<any> {
    try {
      // Consultar DynamoDB (método principal)
      try {
        const statusRecord = await this.exportStatusService.getStatus(requestId);
        
        if (statusRecord) {
          // Extraer documentoId del fileName si está disponible
          // El fileName puede contener: "Manifest closed successfully - DocumentoId: 123"
          let documentoId: number | undefined;
          if (statusRecord.fileName) {
            const match = statusRecord.fileName.match(/DocumentoId:\s*(\d+)/i);
            if (match) {
              documentoId = parseInt(match[1], 10);
            }
          }

          return ResponseUtil.success(
            {
              requestId: statusRecord.requestId,
              documentoId: documentoId,
              status: statusRecord.status,
              createdAt: statusRecord.createdAt,
              updatedAt: statusRecord.updatedAt,
              signedUrl: statusRecord.signedUrl,
              fileName: statusRecord.fileName,
              error: statusRecord.error,
            },
            'Estado del proceso de cierre de manifiesto'
          );
        }
      } catch (dynamoError: any) {
        // Si DynamoDB no está configurado o hay error, intentar API Gateway como fallback
        this.logger.debug(`DynamoDB query failed, trying API Gateway fallback: ${dynamoError.message}`);
      }
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw ResponseUtil.internalError(error);
    }
  }

}
