"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CloseManifestService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloseManifestService = void 0;
const common_1 = require("@nestjs/common");
let CloseManifestService = CloseManifestService_1 = class CloseManifestService {
    constructor(dataSource) {
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(CloseManifestService_1.name);
    }
    /**
     * Ejecuta el proceso real de cierre de manifiesto version final
     * Implementa toda la lógica de consolidación de guías, actualización de estados y workflow
     */
    async closeManifest(documentoId) {
        // Obtener driver una vez (reutilizable para múltiples consultas)
        const driver = this.dataSource.driver;
        // ========================================================================
        // PASO 01: Verificar que el estado del manifiesto sea ACEPTADO y revisado diga NO
        // ========================================================================
        const paso0Params = {
            p_id_documento: documentoId,
        };
        const paso0Sql = `
      WITH estados_ordenados AS (
        SELECT 
          det.DOCUMENTO,
          det.FECHA,
          det.TIPOESTADO,
          dte.NOMBRE,
          ROW_NUMBER() OVER (PARTITION BY det.DOCUMENTO ORDER BY det.FECHA DESC) AS rn
        FROM DOCUMENTOS.DOCESTADOS det
        JOIN DOCUMENTOS.DOCTIPOESTADO dte ON det.TIPOESTADO = dte.CODIGO
        WHERE dte.TIPODOCUMENTO = 'MFTOC' 
          AND det.TIPODOCUMENTO = 'MFTOC'
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
            throw new Error(`El documento ${documentoId} no existe o no es un manifiesto válido`);
        }
        const documentoInfo = paso0Rows[0];
        const estado = documentoInfo?.ESTADO || documentoInfo?.estado;
        const tipo_estado = documentoInfo?.TIPO_ESTADO || documentoInfo?.tipo_estado;
        const revisado = documentoInfo?.REVISADO || documentoInfo?.revisado;
        // Validar que el estado sea "ACEPTADO"
        const estadoAceptado = estado && estado.toUpperCase() === "ACEPTADO";
        const tipoEstadoAceptado = tipo_estado &&
            (tipo_estado.toUpperCase().includes("ACP") || tipo_estado === "ACP");
        if (!estadoAceptado || !tipoEstadoAceptado) {
            throw new Error(`El manifiesto no está en estado Aceptado. Estado actual: ${estado}`);
        }
        // Validar que no esté revisado
        if (revisado === "SI" || revisado === "si" || revisado === "Si") {
            throw new Error("El manifiesto ya fue revisado, no se puede cerrar");
        }
        this.logger.log(`[PASO 01] Validaciones iniciales pasadas para manifiesto ${documentoId}`);
        // ========================================================================
        // PASO 02: Verificar que el estado del manifiesto no esté anulado
        // ========================================================================
        const estaAnulado = tipo_estado && tipo_estado.toUpperCase() === "ANU";
        if (estaAnulado) {
            throw new Error("El manifiesto está anulado, no se puede cerrar");
        }
        this.logger.log(`[PASO 02] Verificación de anulado pasada para manifiesto ${documentoId}`);
        // ========================================================================
        // PASO 03: Verificar que el tipo de manifiesto sea MFTOC y crear variable GTIME
        // ========================================================================
        const tipoDocumento = documentoInfo?.TIPODOCUMENTO || documentoInfo?.tipodocumento || null;
        let tipoDocT = null;
        if (tipoDocumento === "MFTOC") {
            tipoDocT = "GTIME";
        }
        if (tipoDocumento !== "MFTOC") {
            throw new Error(`El documento no es un manifiesto MFTOC. Tipo de documento: ${tipoDocumento}`);
        }
        this.logger.log(`[PASO 03] Tipo de documento validado: ${tipoDocumento}`);
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
        const idsDocumentosRelacionados = documentosRelacionadosRows?.map((row) => row.Id || row.id || row.ID) || [];
        this.logger.log(`[PASO 04] Documentos relacionados encontrados: ${idsDocumentosRelacionados.length}`);
        // INICIAR PROCESO DE TRANSACCIONES DE BD
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
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
            for (const idDocumento of idsDocumentosRelacionados) {
                const [escapedEstadosQuery, escapedEstadosParams] = driver.escapeQueryWithParameters(obtenerEstadosDocumentoSql, { idDocumento: idDocumento }, {});
                const estadosRows = await queryRunner.query(escapedEstadosQuery, escapedEstadosParams);
                let estaAnulado = false;
                for (const estadoRow of estadosRows) {
                    const estado = estadoRow.TipoEstado || estadoRow.tipoestado;
                    if (estado === "ANU") {
                        estaAnulado = true;
                        break;
                    }
                }
                if (estaAnulado) {
                    this.logger.log(`[CONSOLIDACION] Documento ${idDocumento} ANULADO no se CONSOLIDA`);
                    continue;
                }
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
                // ========================================================================
                // PASO 07: Crear el estado con el ID generado anteriormente
                // ========================================================================
                const fechaConsolidacion = new Date();
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
                    }
                    catch (error) {
                        this.logger.error(`Error al procesar relación para documento ${idDocumento}:`, error);
                        throw error;
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
                }
                // ========================================================================
                // PASO 15: Cerrar actividades y ciclos abiertos del workflow para la guía
                // ========================================================================
                let encontroCiclo = false;
                do {
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
                    encontroCiclo = ciclosRows && ciclosRows.length > 0;
                    if (encontroCiclo) {
                        const cicloRow = ciclosRows[0];
                        let activityName = cicloRow.ActivityName || cicloRow.activityname;
                        let cicleId = cicloRow.CicleId || cicloRow.cicleid || cicloRow.CICLEID;
                        while (activityName) {
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
            }
            this.logger.log(`Documentos válidos para consolidar: ${documentosParaConsolidar.length} de ${idsDocumentosRelacionados.length}`);
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
                    this.logger.log(`[PASO 16] Proceso batch de consolidación ejecutado para manifiesto ${documentoId}`);
                }
                catch (batchError) {
                    this.logger.error(`[PASO 16] Error al ejecutar proceso batch para manifiesto ${documentoId}:`, batchError);
                    // Mantener el comportamiento del código legado: registrar el error y continuar
                }
            }
            // ========================================================================
            // PASO 17: Cambiar estado del manifiesto de "Aceptado" a "Conformado"
            // ========================================================================
            if (tipoDocumento === "MFTOC") {
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
                this.logger.log(`[PASO 17] Manifiesto ${documentoId} actualizado a estado CMP`);
            }
            // Commit de la transacción si todo salió bien
            await queryRunner.commitTransaction();
            this.logger.log(`Transacción de consolidación confirmada exitosamente para manifiesto ${documentoId}`);
        }
        catch (error) {
            // Rollback de la transacción en caso de error
            await queryRunner.rollbackTransaction();
            this.logger.error(`Error en proceso de consolidación. Transacción revertida para manifiesto ${documentoId}:`, error);
            throw error;
        }
        finally {
            // Liberar el QueryRunner
            await queryRunner.release();
        }
    }
};
exports.CloseManifestService = CloseManifestService;
exports.CloseManifestService = CloseManifestService = CloseManifestService_1 = __decorate([
    (0, common_1.Injectable)()
], CloseManifestService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvc2UtbWFuaWZlc3Quc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNsb3NlLW1hbmlmZXN0LnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLDJDQUFvRDtBQUk3QyxJQUFNLG9CQUFvQiw0QkFBMUIsTUFBTSxvQkFBb0I7SUFHL0IsWUFDbUIsVUFBc0I7UUFBdEIsZUFBVSxHQUFWLFVBQVUsQ0FBWTtRQUh4QixXQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsc0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7SUFJN0QsQ0FBQztJQUVKOzs7T0FHRztJQUNILEtBQUssQ0FBQyxhQUFhLENBQUMsV0FBbUI7UUFDckMsaUVBQWlFO1FBQ2pFLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO1FBRXRDLDJFQUEyRTtRQUMzRSxrRkFBa0Y7UUFDbEYsMkVBQTJFO1FBQzNFLE1BQU0sV0FBVyxHQUE0QjtZQUMzQyxjQUFjLEVBQUUsV0FBVztTQUM1QixDQUFDO1FBRUYsTUFBTSxRQUFRLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztLQWlDaEIsQ0FBQztRQUVGLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxrQkFBa0IsQ0FBQyxHQUMzQyxNQUFNLENBQUMseUJBQXlCLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUU5RCxNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUMzQyxpQkFBaUIsRUFDakIsa0JBQWtCLENBQ25CLENBQUM7UUFFRixrQ0FBa0M7UUFDbEMsSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3pDLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLFdBQVcseUNBQXlDLENBQUMsQ0FBQztRQUN4RixDQUFDO1FBRUQsTUFB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LEVBQ0QsRUFBRSxDQUNILENBQUM7Z0JBRUosTUFBTSxXQUFXLENBQUMsS0FBSyxDQUNyQiwyQkFBMkIsRUFDM0IsNEJBQTRCLENBQzdCLENBQUM7Z0JBRUYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQ2Isd0JBQXdCLFdBQVcsMkJBQTJCLENBQy9ELENBQUM7WUFDSixDQUFDO1lBRUQsOENBQThDO1lBQzlDLE1BQU0sV0FBVyxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDdEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsd0VBQXdFLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDekcsQ0FBQztRQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7WUFDcEIsOENBQThDO1lBQzlDLE1BQU0sV0FBVyxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDeEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ2YsNEVBQTRFLFdBQVcsR0FBRyxFQUMxRixLQUFLLENBQ04sQ0FBQztZQUNGLE1BQU0sS0FBSyxDQUFDO1FBQ2QsQ0FBQztnQkFBUyxDQUFDO1lBQ1QseUJBQXlCO1lBQ3pCLE1BQU0sV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzlCLENBQUM7SUFDSCxDQUFDO0NBQ0YsQ0FBQTtBQWg0Qlksb0RBQW9COytCQUFwQixvQkFBb0I7SUFEaEMsSUFBQSxtQkFBVSxHQUFFO0dBQ0Esb0JBQW9CLENBZzRCaEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlLCBMb2dnZXIgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IERhdGFTb3VyY2UsIFF1ZXJ5UnVubmVyIH0gZnJvbSAndHlwZW9ybSc7XHJcblxyXG5ASW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBDbG9zZU1hbmlmZXN0U2VydmljZSB7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBsb2dnZXIgPSBuZXcgTG9nZ2VyKENsb3NlTWFuaWZlc3RTZXJ2aWNlLm5hbWUpO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZGF0YVNvdXJjZTogRGF0YVNvdXJjZSxcclxuICApIHt9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVqZWN1dGEgZWwgcHJvY2VzbyByZWFsIGRlIGNpZXJyZSBkZSBtYW5pZmllc3RvIHZlcnNpb24gZmluYWxcclxuICAgKiBJbXBsZW1lbnRhIHRvZGEgbGEgbMOzZ2ljYSBkZSBjb25zb2xpZGFjacOzbiBkZSBndcOtYXMsIGFjdHVhbGl6YWNpw7NuIGRlIGVzdGFkb3MgeSB3b3JrZmxvd1xyXG4gICAqL1xyXG4gIGFzeW5jIGNsb3NlTWFuaWZlc3QoZG9jdW1lbnRvSWQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgLy8gT2J0ZW5lciBkcml2ZXIgdW5hIHZleiAocmV1dGlsaXphYmxlIHBhcmEgbcO6bHRpcGxlcyBjb25zdWx0YXMpXHJcbiAgICBjb25zdCBkcml2ZXIgPSB0aGlzLmRhdGFTb3VyY2UuZHJpdmVyO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gUEFTTyAwMTogVmVyaWZpY2FyIHF1ZSBlbCBlc3RhZG8gZGVsIG1hbmlmaWVzdG8gc2VhIEFDRVBUQURPIHkgcmV2aXNhZG8gZGlnYSBOT1xyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCBwYXNvMFBhcmFtczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XHJcbiAgICAgIHBfaWRfZG9jdW1lbnRvOiBkb2N1bWVudG9JZCxcclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgcGFzbzBTcWwgPSBgXHJcbiAgICAgIFdJVEggZXN0YWRvc19vcmRlbmFkb3MgQVMgKFxyXG4gICAgICAgIFNFTEVDVCBcclxuICAgICAgICAgIGRldC5ET0NVTUVOVE8sXHJcbiAgICAgICAgICBkZXQuRkVDSEEsXHJcbiAgICAgICAgICBkZXQuVElQT0VTVEFETyxcclxuICAgICAgICAgIGR0ZS5OT01CUkUsXHJcbiAgICAgICAgICBST1dfTlVNQkVSKCkgT1ZFUiAoUEFSVElUSU9OIEJZIGRldC5ET0NVTUVOVE8gT1JERVIgQlkgZGV0LkZFQ0hBIERFU0MpIEFTIHJuXHJcbiAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRPQ0VTVEFET1MgZGV0XHJcbiAgICAgICAgSk9JTiBET0NVTUVOVE9TLkRPQ1RJUE9FU1RBRE8gZHRlIE9OIGRldC5USVBPRVNUQURPID0gZHRlLkNPRElHT1xyXG4gICAgICAgIFdIRVJFIGR0ZS5USVBPRE9DVU1FTlRPID0gJ01GVE9DJyBcclxuICAgICAgICAgIEFORCBkZXQuVElQT0RPQ1VNRU5UTyA9ICdNRlRPQydcclxuICAgICAgKVxyXG4gICAgICBTRUxFQ1RcclxuICAgICAgICBkZC5JRCBBUyBJRCxcclxuICAgICAgICBlby5USVBPRVNUQURPIEFTIFRJUE9fRVNUQURPLFxyXG4gICAgICAgIGVvLk5PTUJSRSBBUyBFU1RBRE8sXHJcbiAgICAgICAgQ0FTRSBcclxuICAgICAgICAgIFdIRU4gRVhJU1RTIChcclxuICAgICAgICAgICAgU0VMRUNUIDEgXHJcbiAgICAgICAgICAgIEZST00gRE9DVU1FTlRPUy5ET0NFU1RBRE9TIGVzdCBcclxuICAgICAgICAgICAgV0hFUkUgZXN0LnRpcG9kb2N1bWVudG8gPSBkZC50aXBvZG9jdW1lbnRvIFxyXG4gICAgICAgICAgICAgIEFORCBlc3QuZG9jdW1lbnRvID0gZGQuaWQgXHJcbiAgICAgICAgICAgICAgQU5EIGVzdC50aXBvZXN0YWRvID0gJ1ZJUycgXHJcbiAgICAgICAgICAgICAgQU5EIGVzdC5hY3RpdmEgPSAnUydcclxuICAgICAgICAgICkgVEhFTiAnU0knXHJcbiAgICAgICAgICBFTFNFICdOTydcclxuICAgICAgICBFTkQgQVMgUkVWSVNBRE8sXHJcbiAgICAgICAgZGQuVElQT0RPQ1VNRU5UTyBBUyBUSVBPRE9DVU1FTlRPXHJcbiAgICAgIEZST00gRE9DVU1FTlRPUy5ET0NET0NVTUVOVE9CQVNFIGRkXHJcbiAgICAgIEpPSU4gRE9DVFJBTlNQT1JURS5ET0NUUkFOTUFOSUZJRVNUTyBkdG0gT04gZGQuSUQgPSBkdG0uSURcclxuICAgICAgSk9JTiBlc3RhZG9zX29yZGVuYWRvcyBlbyBPTiBkZC5JRCA9IGVvLkRPQ1VNRU5UTyBBTkQgZW8ucm4gPSAxXHJcbiAgICAgIFdIRVJFIGRkLklEID0gOnBfaWRfZG9jdW1lbnRvXHJcbiAgICBgO1xyXG5cclxuICAgIGNvbnN0IFtlc2NhcGVkUGFzbzBRdWVyeSwgZXNjYXBlZFBhc28wUGFyYW1zXSA9XHJcbiAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKHBhc28wU3FsLCBwYXNvMFBhcmFtcywge30pO1xyXG5cclxuICAgIGNvbnN0IHBhc28wUm93cyA9IGF3YWl0IHRoaXMuZGF0YVNvdXJjZS5xdWVyeShcclxuICAgICAgZXNjYXBlZFBhc28wUXVlcnksXHJcbiAgICAgIGVzY2FwZWRQYXNvMFBhcmFtc1xyXG4gICAgKTtcclxuXHJcbiAgICAvLyBWYWxpZGFyIHF1ZSBlbCBkb2N1bWVudG8gZXhpc3RlXHJcbiAgICBpZiAoIXBhc28wUm93cyB8fCBwYXNvMFJvd3MubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRWwgZG9jdW1lbnRvICR7ZG9jdW1lbnRvSWR9IG5vIGV4aXN0ZSBvIG5vIGVzIHVuIG1hbmlmaWVzdG8gdsOhbGlkb2ApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRvY3VtZW50b0luZm8gPSBwYXNvMFJvd3NbMF07XHJcbiAgICBjb25zdCBlc3RhZG8gPSBkb2N1bWVudG9JbmZvPy5FU1RBRE8gfHwgZG9jdW1lbnRvSW5mbz8uZXN0YWRvO1xyXG4gICAgY29uc3QgdGlwb19lc3RhZG8gPVxyXG4gICAgICBkb2N1bWVudG9JbmZvPy5USVBPX0VTVEFETyB8fCBkb2N1bWVudG9JbmZvPy50aXBvX2VzdGFkbztcclxuICAgIGNvbnN0IHJldmlzYWRvID0gZG9jdW1lbnRvSW5mbz8uUkVWSVNBRE8gfHwgZG9jdW1lbnRvSW5mbz8ucmV2aXNhZG87XHJcblxyXG4gICAgLy8gVmFsaWRhciBxdWUgZWwgZXN0YWRvIHNlYSBcIkFDRVBUQURPXCJcclxuICAgIGNvbnN0IGVzdGFkb0FjZXB0YWRvID0gZXN0YWRvICYmIGVzdGFkby50b1VwcGVyQ2FzZSgpID09PSBcIkFDRVBUQURPXCI7XHJcbiAgICBjb25zdCB0aXBvRXN0YWRvQWNlcHRhZG8gPVxyXG4gICAgICB0aXBvX2VzdGFkbyAmJlxyXG4gICAgICAodGlwb19lc3RhZG8udG9VcHBlckNhc2UoKS5pbmNsdWRlcyhcIkFDUFwiKSB8fCB0aXBvX2VzdGFkbyA9PT0gXCJBQ1BcIik7XHJcblxyXG4gICAgaWYgKCFlc3RhZG9BY2VwdGFkbyB8fCAhdGlwb0VzdGFkb0FjZXB0YWRvKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRWwgbWFuaWZpZXN0byBubyBlc3TDoSBlbiBlc3RhZG8gQWNlcHRhZG8uIEVzdGFkbyBhY3R1YWw6ICR7ZXN0YWRvfWApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFZhbGlkYXIgcXVlIG5vIGVzdMOpIHJldmlzYWRvXHJcbiAgICBpZiAocmV2aXNhZG8gPT09IFwiU0lcIiB8fCByZXZpc2FkbyA9PT0gXCJzaVwiIHx8IHJldmlzYWRvID09PSBcIlNpXCIpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRWwgbWFuaWZpZXN0byB5YSBmdWUgcmV2aXNhZG8sIG5vIHNlIHB1ZWRlIGNlcnJhclwiKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmxvZ2dlci5sb2coYFtQQVNPIDAxXSBWYWxpZGFjaW9uZXMgaW5pY2lhbGVzIHBhc2FkYXMgcGFyYSBtYW5pZmllc3RvICR7ZG9jdW1lbnRvSWR9YCk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBQQVNPIDAyOiBWZXJpZmljYXIgcXVlIGVsIGVzdGFkbyBkZWwgbWFuaWZpZXN0byBubyBlc3TDqSBhbnVsYWRvXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIGNvbnN0IGVzdGFBbnVsYWRvID1cclxuICAgICAgdGlwb19lc3RhZG8gJiYgdGlwb19lc3RhZG8udG9VcHBlckNhc2UoKSA9PT0gXCJBTlVcIjtcclxuXHJcbiAgICBpZiAoZXN0YUFudWxhZG8pIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRWwgbWFuaWZpZXN0byBlc3TDoSBhbnVsYWRvLCBubyBzZSBwdWVkZSBjZXJyYXJcIik7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5sb2dnZXIubG9nKGBbUEFTTyAwMl0gVmVyaWZpY2FjacOzbiBkZSBhbnVsYWRvIHBhc2FkYSBwYXJhIG1hbmlmaWVzdG8gJHtkb2N1bWVudG9JZH1gKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIFBBU08gMDM6IFZlcmlmaWNhciBxdWUgZWwgdGlwbyBkZSBtYW5pZmllc3RvIHNlYSBNRlRPQyB5IGNyZWFyIHZhcmlhYmxlIEdUSU1FXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIGNvbnN0IHRpcG9Eb2N1bWVudG8gPVxyXG4gICAgICBkb2N1bWVudG9JbmZvPy5USVBPRE9DVU1FTlRPIHx8IGRvY3VtZW50b0luZm8/LnRpcG9kb2N1bWVudG8gfHwgbnVsbDtcclxuXHJcbiAgICBsZXQgdGlwb0RvY1Q6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgIGlmICh0aXBvRG9jdW1lbnRvID09PSBcIk1GVE9DXCIpIHtcclxuICAgICAgdGlwb0RvY1QgPSBcIkdUSU1FXCI7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRpcG9Eb2N1bWVudG8gIT09IFwiTUZUT0NcIikge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVsIGRvY3VtZW50byBubyBlcyB1biBtYW5pZmllc3RvIE1GVE9DLiBUaXBvIGRlIGRvY3VtZW50bzogJHt0aXBvRG9jdW1lbnRvfWApO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMubG9nZ2VyLmxvZyhgW1BBU08gMDNdIFRpcG8gZGUgZG9jdW1lbnRvIHZhbGlkYWRvOiAke3RpcG9Eb2N1bWVudG99YCk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBQQVNPIDA0OiBCdXNjYXIgdG9kYXMgbGFzIEd1w61hcyBBc29jaWFkYXMgYWwgbWFuaWZpZXN0b1xyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCBidXNjYXJEb2N1bWVudG9zUmVsYWNpb25hZG9zU3FsID0gYFxyXG4gICAgICBTRUxFQ1QgRElTVElOQ1QgUi5Eb2NPcmlnZW4gQVMgSWRcclxuICAgICAgRlJPTSBET0NVTUVOVE9TLkRPQ1JFTEFDSU9ORE9DVU1FTlRPIFJcclxuICAgICAgSk9JTiBET0NVTUVOVE9TLkRPQ0RPQ1VNRU5UT0JBU0UgRCBPTiBSLkRvY09yaWdlbiA9IEQuSWRcclxuICAgICAgV0hFUkUgUi5Eb2NEZXN0aW5vID0gOmlkTWFuaWZpZXN0b1xyXG4gICAgICAgIEFORCBSLlRpcG9SZWxhY2lvbiA9ICdSRUYnXHJcbiAgICAgICAgQU5EIEQuVGlwb0RvY3VtZW50byA9IDp0aXBvRG9jVFxyXG4gICAgICAgIEFORCBOT1QgRVhJU1RTIChcclxuICAgICAgICAgIFNFTEVDVCAxXHJcbiAgICAgICAgICBGUk9NIERPQ1VNRU5UT1MuRE9DRVNUQURPUyBFXHJcbiAgICAgICAgICBXSEVSRSBFLmRvY3VtZW50byA9IFIuRG9jT3JpZ2VuXHJcbiAgICAgICAgICAgIEFORCBFLlRpcG9Fc3RhZG8gPSAnQU5VJ1xyXG4gICAgICAgIClcclxuICAgICAgICBBTkQgRC5BY3Rpdm8gPSAnUydcclxuICAgIGA7XHJcblxyXG4gICAgY29uc3QgZG9jdW1lbnRvc1JlbGFjaW9uYWRvc1BhcmFtczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XHJcbiAgICAgIGlkTWFuaWZpZXN0bzogZG9jdW1lbnRvSWQsXHJcbiAgICAgIHRpcG9Eb2NUOiB0aXBvRG9jVCxcclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgW2VzY2FwZWRSZWxhY2lvbmFkb3NRdWVyeSwgZXNjYXBlZFJlbGFjaW9uYWRvc1BhcmFtc10gPVxyXG4gICAgICBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICBidXNjYXJEb2N1bWVudG9zUmVsYWNpb25hZG9zU3FsLFxyXG4gICAgICAgIGRvY3VtZW50b3NSZWxhY2lvbmFkb3NQYXJhbXMsXHJcbiAgICAgICAge31cclxuICAgICAgKTtcclxuXHJcbiAgICBjb25zdCBkb2N1bWVudG9zUmVsYWNpb25hZG9zUm93cyA9IGF3YWl0IHRoaXMuZGF0YVNvdXJjZS5xdWVyeShcclxuICAgICAgZXNjYXBlZFJlbGFjaW9uYWRvc1F1ZXJ5LFxyXG4gICAgICBlc2NhcGVkUmVsYWNpb25hZG9zUGFyYW1zXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGlkc0RvY3VtZW50b3NSZWxhY2lvbmFkb3MgPVxyXG4gICAgICBkb2N1bWVudG9zUmVsYWNpb25hZG9zUm93cz8ubWFwKFxyXG4gICAgICAgIChyb3c6IGFueSkgPT4gcm93LklkIHx8IHJvdy5pZCB8fCByb3cuSURcclxuICAgICAgKSB8fCBbXTtcclxuXHJcbiAgICB0aGlzLmxvZ2dlci5sb2coXHJcbiAgICAgIGBbUEFTTyAwNF0gRG9jdW1lbnRvcyByZWxhY2lvbmFkb3MgZW5jb250cmFkb3M6ICR7aWRzRG9jdW1lbnRvc1JlbGFjaW9uYWRvcy5sZW5ndGh9YFxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBJTklDSUFSIFBST0NFU08gREUgVFJBTlNBQ0NJT05FUyBERSBCRFxyXG4gICAgY29uc3QgcXVlcnlSdW5uZXI6IFF1ZXJ5UnVubmVyID0gdGhpcy5kYXRhU291cmNlLmNyZWF0ZVF1ZXJ5UnVubmVyKCk7XHJcbiAgICBhd2FpdCBxdWVyeVJ1bm5lci5jb25uZWN0KCk7XHJcbiAgICBhd2FpdCBxdWVyeVJ1bm5lci5zdGFydFRyYW5zYWN0aW9uKCk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgZG9jdW1lbnRvc1BhcmFDb25zb2xpZGFyOiBudW1iZXJbXSA9IFtdO1xyXG5cclxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgIC8vIFBBU08gMDU6IFZlcmlmaWNhciBzaSBsYSBndWlhIHF1ZSBzZSB0cmFiYWphIGVuIGVsIG1vbWVudG8gZGVsIGNpY2xvIGVzdMOhIGFudWxhZGEgYW50ZXMgZGUgY29uc29saWRhclxyXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgY29uc3Qgb2J0ZW5lckVzdGFkb3NEb2N1bWVudG9TcWwgPSBgXHJcbiAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgRG9jRXN0YWRvcy5Eb2N1bWVudG8sIFxyXG4gICAgICAgICAgRG9jRXN0YWRvcy5UaXBvRG9jdW1lbnRvLCBcclxuICAgICAgICAgIERvY0VzdGFkb3MuVGlwb0VzdGFkbywgXHJcbiAgICAgICAgICBEb2NFc3RhZG9zLkZlY2hhLCBcclxuICAgICAgICAgIERvY0VzdGFkb3MuSWRVc3VhcmlvLCBcclxuICAgICAgICAgIERvY1RpcG9Fc3RhZG8uTm9tYnJlIFxyXG4gICAgICAgIEZST00gRE9DVU1FTlRPUy5Eb2NFc3RhZG9zLCBET0NVTUVOVE9TLkRvY1RpcG9Fc3RhZG8gXHJcbiAgICAgICAgV0hFUkUgRG9jRXN0YWRvcy5Eb2N1bWVudG8gPSA6aWREb2N1bWVudG8gXHJcbiAgICAgICAgICBBTkQgRG9jRXN0YWRvcy5UaXBvRG9jdW1lbnRvID0gRG9jVGlwb0VzdGFkby5UaXBvRG9jdW1lbnRvIFxyXG4gICAgICAgICAgQU5EIERvY0VzdGFkb3MuVGlwb0VzdGFkbyA9IERvY1RpcG9Fc3RhZG8uQ29kaWdvIFxyXG4gICAgICAgICAgQU5EIERvY1RpcG9Fc3RhZG8uQWN0aXZhID0gJ1MnIFxyXG4gICAgICAgICAgQU5EIERvY0VzdGFkb3MuQWN0aXZhID0gJ1MnXHJcbiAgICAgIGA7XHJcblxyXG4gICAgICBmb3IgKGNvbnN0IGlkRG9jdW1lbnRvIG9mIGlkc0RvY3VtZW50b3NSZWxhY2lvbmFkb3MpIHtcclxuICAgICAgICBjb25zdCBbZXNjYXBlZEVzdGFkb3NRdWVyeSwgZXNjYXBlZEVzdGFkb3NQYXJhbXNdID1cclxuICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgICBvYnRlbmVyRXN0YWRvc0RvY3VtZW50b1NxbCxcclxuICAgICAgICAgICAgeyBpZERvY3VtZW50bzogaWREb2N1bWVudG8gfSxcclxuICAgICAgICAgICAge31cclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IGVzdGFkb3NSb3dzID0gYXdhaXQgcXVlcnlSdW5uZXIucXVlcnkoXHJcbiAgICAgICAgICBlc2NhcGVkRXN0YWRvc1F1ZXJ5LFxyXG4gICAgICAgICAgZXNjYXBlZEVzdGFkb3NQYXJhbXNcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBsZXQgZXN0YUFudWxhZG8gPSBmYWxzZTtcclxuICAgICAgICBmb3IgKGNvbnN0IGVzdGFkb1JvdyBvZiBlc3RhZG9zUm93cykge1xyXG4gICAgICAgICAgY29uc3QgZXN0YWRvID0gZXN0YWRvUm93LlRpcG9Fc3RhZG8gfHwgZXN0YWRvUm93LnRpcG9lc3RhZG87XHJcbiAgICAgICAgICBpZiAoZXN0YWRvID09PSBcIkFOVVwiKSB7XHJcbiAgICAgICAgICAgIGVzdGFBbnVsYWRvID0gdHJ1ZTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZXN0YUFudWxhZG8pIHtcclxuICAgICAgICAgIHRoaXMubG9nZ2VyLmxvZyhcclxuICAgICAgICAgICAgYFtDT05TT0xJREFDSU9OXSBEb2N1bWVudG8gJHtpZERvY3VtZW50b30gQU5VTEFETyBubyBzZSBDT05TT0xJREFgXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkb2N1bWVudG9zUGFyYUNvbnNvbGlkYXIucHVzaChpZERvY3VtZW50byk7XHJcblxyXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgIC8vIFBBU08gMDY6IENhbGN1bGFyIGVsIE1BWChJRCkgKzEgcGFyYSBlbCBlc3RhZG8gY29uZm9ybWFkb1xyXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgIGNvbnN0IGNhbGN1bGFyTWF4SWRFc3RhZG9TcWwgPSBgXHJcbiAgICAgICAgICBTRUxFQ1QgTUFYKElkKSBBUyBNYXhJZFxyXG4gICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRvY0VzdGFkb3NcclxuICAgICAgICAgIFdIRVJFIERvY3VtZW50byA9IDppZERvY3VtZW50b1xyXG4gICAgICAgICAgICBBTkQgVGlwb0RvY3VtZW50byA9IDp0aXBvRG9jVFxyXG4gICAgICAgICAgICBBTkQgVGlwb0VzdGFkbyA9ICdDTVAnXHJcbiAgICAgICAgYDtcclxuXHJcbiAgICAgICAgY29uc3QgW2VzY2FwZWRNYXhJZFF1ZXJ5LCBlc2NhcGVkTWF4SWRQYXJhbXNdID1cclxuICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgICBjYWxjdWxhck1heElkRXN0YWRvU3FsLFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgaWREb2N1bWVudG86IGlkRG9jdW1lbnRvLFxyXG4gICAgICAgICAgICAgIHRpcG9Eb2NUOiB0aXBvRG9jVCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge31cclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IG1heElkUm93cyA9IGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgZXNjYXBlZE1heElkUXVlcnksXHJcbiAgICAgICAgICBlc2NhcGVkTWF4SWRQYXJhbXNcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBsZXQgbmV4dElkRXN0YWRvID0gMTtcclxuXHJcbiAgICAgICAgaWYgKG1heElkUm93cyAmJiBtYXhJZFJvd3MubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgY29uc3Qgcm93ID0gbWF4SWRSb3dzWzBdO1xyXG4gICAgICAgICAgbGV0IG1heElkID0gbnVsbDtcclxuXHJcbiAgICAgICAgICBpZiAocm93Lk1BWElEICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbWF4SWQgPSByb3cuTUFYSUQ7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5NYXhJZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIG1heElkID0gcm93Lk1heElkO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChyb3cubWF4aWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBtYXhJZCA9IHJvdy5tYXhpZDtcclxuICAgICAgICAgIH0gZWxzZSBpZiAocm93Lk1BWF9JRCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIG1heElkID0gcm93Lk1BWF9JRDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAobWF4SWQgIT09IG51bGwgJiYgbWF4SWQgIT09IHVuZGVmaW5lZCAmJiBtYXhJZCAhPT0gXCJcIikge1xyXG4gICAgICAgICAgICBjb25zdCBtYXhJZE51bWJlciA9IE51bWJlcihtYXhJZCk7XHJcbiAgICAgICAgICAgIGlmICghaXNOYU4obWF4SWROdW1iZXIpKSB7XHJcbiAgICAgICAgICAgICAgbmV4dElkRXN0YWRvID0gbWF4SWROdW1iZXIgKyAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAvLyBQQVNPIDA3OiBDcmVhciBlbCBlc3RhZG8gY29uIGVsIElEIGdlbmVyYWRvIGFudGVyaW9ybWVudGVcclxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICBjb25zdCBmZWNoYUNvbnNvbGlkYWNpb24gPSBuZXcgRGF0ZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBpbnNlcnRhckVzdGFkb0NtcFNxbCA9IGBcclxuICAgICAgICAgIElOU0VSVCBJTlRPIERPQ1VNRU5UT1MuRG9jRXN0YWRvcyhcclxuICAgICAgICAgICAgRG9jdW1lbnRvLCBcclxuICAgICAgICAgICAgVGlwb0RvY3VtZW50bywgXHJcbiAgICAgICAgICAgIFRpcG9Fc3RhZG8sIFxyXG4gICAgICAgICAgICBJZCwgXHJcbiAgICAgICAgICAgIEZlY2hhLCBcclxuICAgICAgICAgICAgT2JzZXJ2YWNpb24sIFxyXG4gICAgICAgICAgICBJZFVzdWFyaW8sIFxyXG4gICAgICAgICAgICBBY3RpdmEsIFxyXG4gICAgICAgICAgICBGZWNoYUFjdGl2YSwgXHJcbiAgICAgICAgICAgIEZlY2hhRGVzYWN0aXZhXHJcbiAgICAgICAgICApIFZBTFVFUyAoXHJcbiAgICAgICAgICAgIDppZERvY3VtZW50byxcclxuICAgICAgICAgICAgOnRpcG9Eb2NULFxyXG4gICAgICAgICAgICAnQ01QJyxcclxuICAgICAgICAgICAgOm5leHRJZEVzdGFkbyxcclxuICAgICAgICAgICAgOmZlY2hhQ29uc29saWRhY2lvbixcclxuICAgICAgICAgICAgJ0NPTkZPUk1BQ0lPTiBHRU5FUkFEQSBBVVRPTUFUSUNBTUVOVEUgUE9SIElTSURPUkEgJyxcclxuICAgICAgICAgICAgJ1thdXRvbWF0aWNvXScsXHJcbiAgICAgICAgICAgICdTJyxcclxuICAgICAgICAgICAgOmZlY2hhQ29uc29saWRhY2lvbixcclxuICAgICAgICAgICAgOmZlY2hhQ29uc29saWRhY2lvblxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIGA7XHJcblxyXG4gICAgICAgIGNvbnN0IFtlc2NhcGVkSW5zZXJ0UXVlcnksIGVzY2FwZWRJbnNlcnRQYXJhbXNdID1cclxuICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgICBpbnNlcnRhckVzdGFkb0NtcFNxbCxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIGlkRG9jdW1lbnRvOiBpZERvY3VtZW50byxcclxuICAgICAgICAgICAgICB0aXBvRG9jVDogdGlwb0RvY1QsXHJcbiAgICAgICAgICAgICAgbmV4dElkRXN0YWRvOiBuZXh0SWRFc3RhZG8sXHJcbiAgICAgICAgICAgICAgZmVjaGFDb25zb2xpZGFjaW9uOiBmZWNoYUNvbnNvbGlkYWNpb24sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHt9XHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICBhd2FpdCBxdWVyeVJ1bm5lci5xdWVyeShlc2NhcGVkSW5zZXJ0UXVlcnksIGVzY2FwZWRJbnNlcnRQYXJhbXMpO1xyXG5cclxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAvLyBQQVNPIDA4OiBCdXNjYXIgcmVsYWNpb25lcyBwZW5kaWVudGVzIHBhcmEgbGEgZ3XDrWEgcXVlIHNlIGFjYWJhIGRlIHJlZ2lzdHJhclxyXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgIGNvbnN0IGJ1c2NhclJlbGFjaW9uZXNQZW5kaWVudGVzU3FsID0gYFxyXG4gICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICBSLlRpcG9SZWxhY2lvbiBBUyBUaXBvUmVsYWNpb24sIFxyXG4gICAgICAgICAgICBSLklkIEFTIElkLCBcclxuICAgICAgICAgICAgRC5JZCBBUyBEb2NJZFxyXG4gICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRvY1JlbGFjaW9uRG9jdW1lbnRvIFIsIERPQ1VNRU5UT1MuRG9jRG9jdW1lbnRvQmFzZSBEXHJcbiAgICAgICAgICBXSEVSRSBSLkRvY09yaWdlbiA9IDppZERvY3VtZW50byBcclxuICAgICAgICAgICAgQU5EIFIuRG9jRGVzdGlubyBJUyBOVUxMXHJcbiAgICAgICAgICAgIEFORCBELlRpcG9Eb2N1bWVudG8gPSBSLlRpcG9Eb2NEZXN0aW5vXHJcbiAgICAgICAgICAgIEFORCBELk51bWVyb0V4dGVybm8gPSBSLk51bURvY0Rlc3Rpbm9cclxuICAgICAgICAgICAgQU5EIEQuSWRFbWlzb3IgPSBSLkVtaXNvckRvY0Rlc3Rpbm9cclxuICAgICAgICAgICAgQU5EIEQuRmVjaGFFbWlzaW9uID0gUi5GZWNoYURvY0Rlc3Rpbm9cclxuICAgICAgICAgICAgQU5EIEQuQWN0aXZvID0gJ1MnIFxyXG4gICAgICAgICAgICBBTkQgUi5BY3Rpdm8gPSAnUydcclxuICAgICAgICBgO1xyXG5cclxuICAgICAgICBjb25zdCBbZXNjYXBlZFJlbGFjaW9uZXNRdWVyeSwgZXNjYXBlZFJlbGFjaW9uZXNQYXJhbXNdID1cclxuICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgICBidXNjYXJSZWxhY2lvbmVzUGVuZGllbnRlc1NxbCxcclxuICAgICAgICAgICAgeyBpZERvY3VtZW50bzogaWREb2N1bWVudG8gfSxcclxuICAgICAgICAgICAge31cclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlbGFjaW9uZXNQZW5kaWVudGVzUm93cyA9IGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgZXNjYXBlZFJlbGFjaW9uZXNRdWVyeSxcclxuICAgICAgICAgIGVzY2FwZWRSZWxhY2lvbmVzUGFyYW1zXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gUG9yIGNhZGEgcmVsYWNpw7NuIGVuY29udHJhZGEgYSBsYSBndcOtYVxyXG4gICAgICAgIGZvciAoY29uc3QgcmVsYWNpb25Sb3cgb2YgcmVsYWNpb25lc1BlbmRpZW50ZXNSb3dzIHx8IFtdKSB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB0aXBvUmVsYWNpb24gPVxyXG4gICAgICAgICAgICAgIHJlbGFjaW9uUm93LlRpcG9SZWxhY2lvbiB8fCByZWxhY2lvblJvdy50aXBvcmVsYWNpb247XHJcbiAgICAgICAgICAgIGNvbnN0IHJlbGFjaW9uSWQgPSByZWxhY2lvblJvdy5JZCB8fCByZWxhY2lvblJvdy5pZDtcclxuICAgICAgICAgICAgY29uc3QgZG9jSWQgPSByZWxhY2lvblJvdy5Eb2NJZCB8fCByZWxhY2lvblJvdy5kb2NpZDtcclxuXHJcbiAgICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICAgICAvLyBQQVNPIDA5OiBTRUxFQ1QgLSBPYnRlbmVyIGVsIHNpZ3VpZW50ZSBjb3JyZWxhdGl2byBwYXJhIGVsIGhpc3RvcmlhbFxyXG4gICAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgICAgY29uc3QgY2FsY3VsYXJOZXh0Q29ycmVsYXRpdmVTcWwgPSBgXHJcbiAgICAgICAgICAgICAgU0VMRUNUIE1BWChJZCkgQVMgTWF4SWRcclxuICAgICAgICAgICAgICBGUk9NIERPQ1VNRU5UT1MuRG9jSFJlbGFjaW9uRG9jdW1lbnRvXHJcbiAgICAgICAgICAgICAgV0hFUkUgVGlwb1JlbGFjaW9uID0gOnRpcG9SZWxhY2lvblxyXG4gICAgICAgICAgICAgICAgQU5EIERvY09yaWdlbiA9IDppZERvY3VtZW50b1xyXG4gICAgICAgICAgICAgICAgQU5EIFJlbGFjaW9uRG9jdW1lbnRvID0gOnJlbGFjaW9uSWRcclxuICAgICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IFtlc2NhcGVkQ29ycmVsYXRpdmVRdWVyeSwgZXNjYXBlZENvcnJlbGF0aXZlUGFyYW1zXSA9XHJcbiAgICAgICAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICAgICAgICBjYWxjdWxhck5leHRDb3JyZWxhdGl2ZVNxbCxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgdGlwb1JlbGFjaW9uOiB0aXBvUmVsYWNpb24sXHJcbiAgICAgICAgICAgICAgICAgIGlkRG9jdW1lbnRvOiBpZERvY3VtZW50byxcclxuICAgICAgICAgICAgICAgICAgcmVsYWNpb25JZDogcmVsYWNpb25JZCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7fVxyXG4gICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBjb3JyZWxhdGl2ZVJvd3MgPSBhd2FpdCBxdWVyeVJ1bm5lci5xdWVyeShcclxuICAgICAgICAgICAgICBlc2NhcGVkQ29ycmVsYXRpdmVRdWVyeSxcclxuICAgICAgICAgICAgICBlc2NhcGVkQ29ycmVsYXRpdmVQYXJhbXNcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBuZXh0Q29ycmVsYXRpdmUgPSAxO1xyXG4gICAgICAgICAgICBpZiAoY29ycmVsYXRpdmVSb3dzICYmIGNvcnJlbGF0aXZlUm93cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgY29uc3Qgcm93ID0gY29ycmVsYXRpdmVSb3dzWzBdO1xyXG4gICAgICAgICAgICAgIGxldCBtYXhJZCA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgIGlmIChyb3cuTUFYSUQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgbWF4SWQgPSByb3cuTUFYSUQ7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChyb3cuTWF4SWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgbWF4SWQgPSByb3cuTWF4SWQ7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChyb3cubWF4aWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgbWF4SWQgPSByb3cubWF4aWQ7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBpZiAobWF4SWQgIT09IG51bGwgJiYgbWF4SWQgIT09IHVuZGVmaW5lZCAmJiBtYXhJZCAhPT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbWF4SWROdW1iZXIgPSBOdW1iZXIobWF4SWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpc05hTihtYXhJZE51bWJlcikpIHtcclxuICAgICAgICAgICAgICAgICAgbmV4dENvcnJlbGF0aXZlID0gbWF4SWROdW1iZXIgKyAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICAgIC8vIFBBU08gMTA6IElOU0VSVCAtIEd1YXJkYXIgcmVnaXN0cm8gaGlzdMOzcmljbyBkZSBsYSByZWxhY2nDs25cclxuICAgICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICAgIGNvbnN0IGluc2VydGFySGlzdG9yaWFsUmVsYWNpb25TcWwgPSBgXHJcbiAgICAgICAgICAgICAgSU5TRVJUIElOVE8gRE9DVU1FTlRPUy5Eb2NIUmVsYWNpb25Eb2N1bWVudG8gKFxyXG4gICAgICAgICAgICAgICAgVGlwb1JlbGFjaW9uLFxyXG4gICAgICAgICAgICAgICAgRG9jT3JpZ2VuLFxyXG4gICAgICAgICAgICAgICAgUmVsYWNpb25Eb2N1bWVudG8sXHJcbiAgICAgICAgICAgICAgICBJZCxcclxuICAgICAgICAgICAgICAgIEZlY2hhLFxyXG4gICAgICAgICAgICAgICAgT2JzZXJ2YWNpb24sXHJcbiAgICAgICAgICAgICAgICBJZFVzdWFyaW8sXHJcbiAgICAgICAgICAgICAgICBUaXBvRG9jRGVzdGlubyxcclxuICAgICAgICAgICAgICAgIE51bURvY0Rlc3Rpbm8sXHJcbiAgICAgICAgICAgICAgICBEb2NEZXN0aW5vLFxyXG4gICAgICAgICAgICAgICAgRW1pc29yRG9jRGVzdGlubyxcclxuICAgICAgICAgICAgICAgIE5vbWJyZUVtaXNvcixcclxuICAgICAgICAgICAgICAgIEFjdGl2byxcclxuICAgICAgICAgICAgICAgIEZlY2hhQWN0aXZhLFxyXG4gICAgICAgICAgICAgICAgRmVjaGFEZXNhY3RpdmEsXHJcbiAgICAgICAgICAgICAgICBGZWNoYURvY0Rlc3Rpbm9cclxuICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICAgICAgUi5UaXBvUmVsYWNpb24sXHJcbiAgICAgICAgICAgICAgICBSLkRvY09yaWdlbixcclxuICAgICAgICAgICAgICAgIFIuSWQsXHJcbiAgICAgICAgICAgICAgICA6bmV4dENvcnJlbGF0aXZlLFxyXG4gICAgICAgICAgICAgICAgUi5GZWNoYSxcclxuICAgICAgICAgICAgICAgIFIuT2JzZXJ2YWNpb24sXHJcbiAgICAgICAgICAgICAgICBSLklkVXN1YXJpbyxcclxuICAgICAgICAgICAgICAgIFIuVGlwb0RvY0Rlc3Rpbm8sXHJcbiAgICAgICAgICAgICAgICBSLk51bURvY0Rlc3Rpbm8sXHJcbiAgICAgICAgICAgICAgICBSLkRvY0Rlc3Rpbm8sXHJcbiAgICAgICAgICAgICAgICBSLkVtaXNvckRvY0Rlc3Rpbm8sXHJcbiAgICAgICAgICAgICAgICBSLk5vbWJyZUVtaXNvcixcclxuICAgICAgICAgICAgICAgIFIuQWN0aXZvLFxyXG4gICAgICAgICAgICAgICAgUi5GZWNoYUFjdGl2YSxcclxuICAgICAgICAgICAgICAgIDpmZWNoYUNvbnNvbGlkYWNpb24sXHJcbiAgICAgICAgICAgICAgICBSLkZlY2hhRG9jRGVzdGlub1xyXG4gICAgICAgICAgICAgIEZST00gRE9DVU1FTlRPUy5Eb2NSZWxhY2lvbkRvY3VtZW50byBSXHJcbiAgICAgICAgICAgICAgV0hFUkUgUi5UaXBvUmVsYWNpb24gPSA6dGlwb1JlbGFjaW9uXHJcbiAgICAgICAgICAgICAgICBBTkQgUi5Eb2NPcmlnZW4gPSA6aWREb2N1bWVudG9cclxuICAgICAgICAgICAgICAgIEFORCBSLklkID0gOnJlbGFjaW9uSWRcclxuICAgICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IFtlc2NhcGVkSGlzdG9yaWFsUXVlcnksIGVzY2FwZWRIaXN0b3JpYWxQYXJhbXNdID1cclxuICAgICAgICAgICAgICBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICAgICAgICAgIGluc2VydGFySGlzdG9yaWFsUmVsYWNpb25TcWwsXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIG5leHRDb3JyZWxhdGl2ZTogbmV4dENvcnJlbGF0aXZlLFxyXG4gICAgICAgICAgICAgICAgICBmZWNoYUNvbnNvbGlkYWNpb246IGZlY2hhQ29uc29saWRhY2lvbixcclxuICAgICAgICAgICAgICAgICAgdGlwb1JlbGFjaW9uOiB0aXBvUmVsYWNpb24sXHJcbiAgICAgICAgICAgICAgICAgIGlkRG9jdW1lbnRvOiBpZERvY3VtZW50byxcclxuICAgICAgICAgICAgICAgICAgcmVsYWNpb25JZDogcmVsYWNpb25JZCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7fVxyXG4gICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBhd2FpdCBxdWVyeVJ1bm5lci5xdWVyeShcclxuICAgICAgICAgICAgICBlc2NhcGVkSGlzdG9yaWFsUXVlcnksXHJcbiAgICAgICAgICAgICAgZXNjYXBlZEhpc3RvcmlhbFBhcmFtc1xyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICAgIC8vIFBBU08gMTE6IFVQREFURSAtIFZpbmN1bGFyIGVsIGRvY3VtZW50byBkZXN0aW5vIGVuY29udHJhZG9cclxuICAgICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICAgIGNvbnN0IGFjdHVhbGl6YXJSZWxhY2lvblNxbCA9IGBcclxuICAgICAgICAgICAgICBVUERBVEUgRE9DVU1FTlRPUy5Eb2NSZWxhY2lvbkRvY3VtZW50byBcclxuICAgICAgICAgICAgICBTRVQgRG9jRGVzdGlubyA9IDpkb2NJZFxyXG4gICAgICAgICAgICAgIFdIRVJFIFRpcG9SZWxhY2lvbiA9IDp0aXBvUmVsYWNpb25cclxuICAgICAgICAgICAgICAgIEFORCBEb2NPcmlnZW4gPSA6aWREb2N1bWVudG9cclxuICAgICAgICAgICAgICAgIEFORCBJZCA9IDpyZWxhY2lvbklkXHJcbiAgICAgICAgICAgIGA7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBbZXNjYXBlZFVwZGF0ZVF1ZXJ5LCBlc2NhcGVkVXBkYXRlUGFyYW1zXSA9XHJcbiAgICAgICAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICAgICAgICBhY3R1YWxpemFyUmVsYWNpb25TcWwsXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIGRvY0lkOiBkb2NJZCxcclxuICAgICAgICAgICAgICAgICAgdGlwb1JlbGFjaW9uOiB0aXBvUmVsYWNpb24sXHJcbiAgICAgICAgICAgICAgICAgIGlkRG9jdW1lbnRvOiBpZERvY3VtZW50byxcclxuICAgICAgICAgICAgICAgICAgcmVsYWNpb25JZDogcmVsYWNpb25JZCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7fVxyXG4gICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBhd2FpdCBxdWVyeVJ1bm5lci5xdWVyeShlc2NhcGVkVXBkYXRlUXVlcnksIGVzY2FwZWRVcGRhdGVQYXJhbXMpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihcclxuICAgICAgICAgICAgICBgRXJyb3IgYWwgcHJvY2VzYXIgcmVsYWNpw7NuIHBhcmEgZG9jdW1lbnRvICR7aWREb2N1bWVudG99OmAsXHJcbiAgICAgICAgICAgICAgZXJyb3JcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAvLyBQQVNPIDEyOiBTRUxFQ1QgLSBWZXJpZmljYXIgc2kgbGEgZ3XDrWEgZXMgaHXDqXJmYW5hXHJcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgY29uc3QgdmVyaWZpY2FyRXNIdWVyZmFub1NxbCA9IGBcclxuICAgICAgICAgIFNFTEVDVCBDT1VOVCgxKSBBUyBUb3RhbFxyXG4gICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRvY1JlbGFjaW9uRG9jdW1lbnRvIFJcclxuICAgICAgICAgIFdIRVJFIFIuRG9jT3JpZ2VuID0gOmlkRG9jdW1lbnRvXHJcbiAgICAgICAgICAgIEFORCBSLkRvY0Rlc3Rpbm8gSVMgTlVMTFxyXG4gICAgICAgICAgICBBTkQgUi5UaXBvUmVsYWNpb24gPSAnTUFEUkUnXHJcbiAgICAgICAgICAgIEFORCBSLkFjdGl2byA9ICdTJ1xyXG4gICAgICAgIGA7XHJcblxyXG4gICAgICAgIGNvbnN0IFtlc2NhcGVkSHVlcmZhbm9RdWVyeSwgZXNjYXBlZEh1ZXJmYW5vUGFyYW1zXSA9XHJcbiAgICAgICAgICBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICAgICAgdmVyaWZpY2FyRXNIdWVyZmFub1NxbCxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIGlkRG9jdW1lbnRvOiBpZERvY3VtZW50byxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge31cclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IGh1ZXJmYW5vUm93cyA9IGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgZXNjYXBlZEh1ZXJmYW5vUXVlcnksXHJcbiAgICAgICAgICBlc2NhcGVkSHVlcmZhbm9QYXJhbXNcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBsZXQgZXNIdWVyZmFubyA9IGZhbHNlO1xyXG4gICAgICAgIGlmIChodWVyZmFub1Jvd3MgJiYgaHVlcmZhbm9Sb3dzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIGNvbnN0IHJvdyA9IGh1ZXJmYW5vUm93c1swXTtcclxuICAgICAgICAgIGNvbnN0IHRvdGFsID0gcm93LlRPVEFMIHx8IHJvdy50b3RhbCB8fCByb3cuVG90YWwgfHwgMDtcclxuICAgICAgICAgIGVzSHVlcmZhbm8gPSBOdW1iZXIodG90YWwpID4gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChlc0h1ZXJmYW5vKSB7XHJcbiAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgIC8vIFBBU08gMTM6IFNFTEVDVCAtIE9idGVuZXIgZWwgc2lndWllbnRlIElEIGRlIGVzdGFkbyBcIkhcIlxyXG4gICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICBjb25zdCBjYWxjdWxhck1heElkRXN0YWRvSFNxbCA9IGBcclxuICAgICAgICAgICAgU0VMRUNUIE1BWChJZCkgQVMgTWF4SWRcclxuICAgICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRvY0VzdGFkb3NcclxuICAgICAgICAgICAgV0hFUkUgRG9jdW1lbnRvID0gOmlkRG9jdW1lbnRvXHJcbiAgICAgICAgICAgICAgQU5EIFRpcG9Eb2N1bWVudG8gPSA6dGlwb0RvY1RcclxuICAgICAgICAgICAgICBBTkQgVGlwb0VzdGFkbyA9ICdIJ1xyXG4gICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICBjb25zdCBbZXNjYXBlZE1heElkSFF1ZXJ5LCBlc2NhcGVkTWF4SWRIUGFyYW1zXSA9XHJcbiAgICAgICAgICAgIGRyaXZlci5lc2NhcGVRdWVyeVdpdGhQYXJhbWV0ZXJzKFxyXG4gICAgICAgICAgICAgIGNhbGN1bGFyTWF4SWRFc3RhZG9IU3FsLFxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlkRG9jdW1lbnRvOiBpZERvY3VtZW50byxcclxuICAgICAgICAgICAgICAgIHRpcG9Eb2NUOiB0aXBvRG9jVCxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHt9XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgY29uc3QgbWF4SWRIUm93cyA9IGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgICBlc2NhcGVkTWF4SWRIUXVlcnksXHJcbiAgICAgICAgICAgIGVzY2FwZWRNYXhJZEhQYXJhbXNcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgbGV0IG5leHRJZEVzdGFkb0ggPSAxO1xyXG4gICAgICAgICAgaWYgKG1heElkSFJvd3MgJiYgbWF4SWRIUm93cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJvdyA9IG1heElkSFJvd3NbMF07XHJcbiAgICAgICAgICAgIGxldCBtYXhJZEggPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJvdy5NQVhJRCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgbWF4SWRIID0gcm93Lk1BWElEO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5NYXhJZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgbWF4SWRIID0gcm93Lk1heElkO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5tYXhpZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgbWF4SWRIID0gcm93Lm1heGlkO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5NQVhfSUQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIG1heElkSCA9IHJvdy5NQVhfSUQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChtYXhJZEggIT09IG51bGwgJiYgbWF4SWRIICE9PSB1bmRlZmluZWQgJiYgbWF4SWRIICE9PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgbWF4SWRITnVtYmVyID0gTnVtYmVyKG1heElkSCk7XHJcbiAgICAgICAgICAgICAgaWYgKCFpc05hTihtYXhJZEhOdW1iZXIpKSB7XHJcbiAgICAgICAgICAgICAgICBuZXh0SWRFc3RhZG9IID0gbWF4SWRITnVtYmVyICsgMTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgIC8vIFBBU08gMTQ6IElOU0VSVCAtIENyZWFyIGVsIGVzdGFkbyBcIkhcIiAoSGlqbyBzaW4gbWFkcmUpXHJcbiAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgIGNvbnN0IGZlY2hhRXN0YWRvSCA9IG5ldyBEYXRlKCk7XHJcblxyXG4gICAgICAgICAgY29uc3QgaW5zZXJ0YXJFc3RhZG9IU3FsID0gYFxyXG4gICAgICAgICAgICBJTlNFUlQgSU5UTyBET0NVTUVOVE9TLkRvY0VzdGFkb3MoXHJcbiAgICAgICAgICAgICAgRG9jdW1lbnRvLFxyXG4gICAgICAgICAgICAgIFRpcG9Eb2N1bWVudG8sXHJcbiAgICAgICAgICAgICAgVGlwb0VzdGFkbyxcclxuICAgICAgICAgICAgICBJZCxcclxuICAgICAgICAgICAgICBGZWNoYSxcclxuICAgICAgICAgICAgICBPYnNlcnZhY2lvbixcclxuICAgICAgICAgICAgICBJZFVzdWFyaW8sXHJcbiAgICAgICAgICAgICAgQWN0aXZhLFxyXG4gICAgICAgICAgICAgIEZlY2hhQWN0aXZhLFxyXG4gICAgICAgICAgICAgIEZlY2hhRGVzYWN0aXZhXHJcbiAgICAgICAgICAgICkgVkFMVUVTIChcclxuICAgICAgICAgICAgICA6aWREb2N1bWVudG8sXHJcbiAgICAgICAgICAgICAgOnRpcG9Eb2NULFxyXG4gICAgICAgICAgICAgICdIJyxcclxuICAgICAgICAgICAgICA6bmV4dElkRXN0YWRvSCxcclxuICAgICAgICAgICAgICA6ZmVjaGFFc3RhZG9ILFxyXG4gICAgICAgICAgICAgICdCTCBTSU4gTUFEUkUnLFxyXG4gICAgICAgICAgICAgICdbYXV0b21hdGljb10nLFxyXG4gICAgICAgICAgICAgICdTJyxcclxuICAgICAgICAgICAgICA6ZmVjaGFFc3RhZG9ILFxyXG4gICAgICAgICAgICAgIE5VTExcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICBjb25zdCBbZXNjYXBlZEluc2VydEhRdWVyeSwgZXNjYXBlZEluc2VydEhQYXJhbXNdID1cclxuICAgICAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICAgICAgaW5zZXJ0YXJFc3RhZG9IU3FsLFxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlkRG9jdW1lbnRvOiBpZERvY3VtZW50byxcclxuICAgICAgICAgICAgICAgIHRpcG9Eb2NUOiB0aXBvRG9jVCxcclxuICAgICAgICAgICAgICAgIG5leHRJZEVzdGFkb0g6IG5leHRJZEVzdGFkb0gsXHJcbiAgICAgICAgICAgICAgICBmZWNoYUVzdGFkb0g6IGZlY2hhRXN0YWRvSCxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHt9XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgYXdhaXQgcXVlcnlSdW5uZXIucXVlcnkoZXNjYXBlZEluc2VydEhRdWVyeSwgZXNjYXBlZEluc2VydEhQYXJhbXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgLy8gUEFTTyAxNTogQ2VycmFyIGFjdGl2aWRhZGVzIHkgY2ljbG9zIGFiaWVydG9zIGRlbCB3b3JrZmxvdyBwYXJhIGxhIGd1w61hXHJcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgbGV0IGVuY29udHJvQ2ljbG8gPSBmYWxzZTtcclxuICAgICAgICBkbyB7XHJcbiAgICAgICAgICBjb25zdCBidXNjYXJDaWNsb3NBYmllcnRvc1NxbCA9IGBcclxuICAgICAgICAgICAgU0VMRUNUIFxyXG4gICAgICAgICAgICAgIENpY2xlLkFjdGl2aXR5TmFtZSBBUyBBY3Rpdml0eU5hbWUsXHJcbiAgICAgICAgICAgICAgQ2ljbGUuSWQgQVMgQ2ljbGVJZFxyXG4gICAgICAgICAgICBGUk9NIENpY2xlLCBJbnB1dERvY3VtZW50XHJcbiAgICAgICAgICAgIFdIRVJFIENpY2xlLkFwcGxpY2F0aW9uTmFtZSA9ICdXRkRvY1RyYW5zcG9ydGUnXHJcbiAgICAgICAgICAgICAgQU5EIENpY2xlLkFwcGxpY2F0aW9uTmFtZSA9IElucHV0RG9jdW1lbnQuQXBwbGljYXRpb25OYW1lXHJcbiAgICAgICAgICAgICAgQU5EIENpY2xlLkFjdGl2aXR5TmFtZSA9IElucHV0RG9jdW1lbnQuQWN0aXZpdHlOYW1lXHJcbiAgICAgICAgICAgICAgQU5EIElucHV0RG9jdW1lbnQuQ2ljbGVJZCA9IENpY2xlLklkXHJcbiAgICAgICAgICAgICAgQU5EIENpY2xlLmlzT3BlbiA9ICdZJ1xyXG4gICAgICAgICAgICAgIEFORCBJbnB1dERvY3VtZW50LkFwcGxpY2F0aW9uTmFtZSA9ICdXRkRvY1RyYW5zcG9ydGUnXHJcbiAgICAgICAgICAgICAgQU5EIElucHV0RG9jdW1lbnQuT2JqZWN0SWQgPSA6aWREb2N1bWVudG9cclxuICAgICAgICAgIGA7XHJcblxyXG4gICAgICAgICAgY29uc3QgW2VzY2FwZWRDaWNsb3NRdWVyeSwgZXNjYXBlZENpY2xvc1BhcmFtc10gPVxyXG4gICAgICAgICAgICBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICAgICAgICBidXNjYXJDaWNsb3NBYmllcnRvc1NxbCxcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZERvY3VtZW50bzogaWREb2N1bWVudG8udG9TdHJpbmcoKSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHt9XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgY29uc3QgY2ljbG9zUm93cyA9IGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgICBlc2NhcGVkQ2ljbG9zUXVlcnksXHJcbiAgICAgICAgICAgIGVzY2FwZWRDaWNsb3NQYXJhbXNcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgZW5jb250cm9DaWNsbyA9IGNpY2xvc1Jvd3MgJiYgY2ljbG9zUm93cy5sZW5ndGggPiAwO1xyXG5cclxuICAgICAgICAgIGlmIChlbmNvbnRyb0NpY2xvKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNpY2xvUm93ID0gY2ljbG9zUm93c1swXTtcclxuICAgICAgICAgICAgbGV0IGFjdGl2aXR5TmFtZSA9IGNpY2xvUm93LkFjdGl2aXR5TmFtZSB8fCBjaWNsb1Jvdy5hY3Rpdml0eW5hbWU7XHJcbiAgICAgICAgICAgIGxldCBjaWNsZUlkID1cclxuICAgICAgICAgICAgICBjaWNsb1Jvdy5DaWNsZUlkIHx8IGNpY2xvUm93LmNpY2xlaWQgfHwgY2ljbG9Sb3cuQ0lDTEVJRDtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlIChhY3Rpdml0eU5hbWUpIHtcclxuICAgICAgICAgICAgICBjb25zdCBjZXJyYXJDaWNsb1NxbCA9IGBcclxuICAgICAgICAgICAgICAgIFVQREFURSBDaWNsZVxyXG4gICAgICAgICAgICAgICAgU0VUIGlzT3BlbiA9ICdOJ1xyXG4gICAgICAgICAgICAgICAgV0hFUkUgQXBwbGljYXRpb25OYW1lID0gJ1dGRG9jVHJhbnNwb3J0ZSdcclxuICAgICAgICAgICAgICAgICAgQU5EIEFjdGl2aXR5TmFtZSA9IDphY3Rpdml0eU5hbWVcclxuICAgICAgICAgICAgICAgICAgQU5EIElkID0gOmNpY2xlSWRcclxuICAgICAgICAgICAgICBgO1xyXG5cclxuICAgICAgICAgICAgICBjb25zdCBbZXNjYXBlZENlcnJhclF1ZXJ5LCBlc2NhcGVkQ2VycmFyUGFyYW1zXSA9XHJcbiAgICAgICAgICAgICAgICBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICAgICAgICAgICAgY2VycmFyQ2ljbG9TcWwsXHJcbiAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpdml0eU5hbWU6IGFjdGl2aXR5TmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBjaWNsZUlkOiBjaWNsZUlkLFxyXG4gICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICB7fVxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgYXdhaXQgcXVlcnlSdW5uZXIucXVlcnkoXHJcbiAgICAgICAgICAgICAgICBlc2NhcGVkQ2VycmFyUXVlcnksXHJcbiAgICAgICAgICAgICAgICBlc2NhcGVkQ2VycmFyUGFyYW1zXHJcbiAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgYnVzY2FyUGFkcmVTcWwgPSBgXHJcbiAgICAgICAgICAgICAgICBTRUxFQ1QgXHJcbiAgICAgICAgICAgICAgICAgIENpY2xlLlBhcmVudEFjdGl2aXR5IEFTIFBhcmVudEFjdGl2aXR5LFxyXG4gICAgICAgICAgICAgICAgICBDaWNsZS5QYXJlbnRDaWNsZSBBUyBQYXJlbnRDaWNsZVxyXG4gICAgICAgICAgICAgICAgRlJPTSBDaWNsZVxyXG4gICAgICAgICAgICAgICAgV0hFUkUgQXBwbGljYXRpb25OYW1lID0gJ1dGRG9jVHJhbnNwb3J0ZSdcclxuICAgICAgICAgICAgICAgICAgQU5EIEFjdGl2aXR5TmFtZSA9IDphY3Rpdml0eU5hbWVcclxuICAgICAgICAgICAgICAgICAgQU5EIElkID0gOmNpY2xlSWRcclxuICAgICAgICAgICAgICBgO1xyXG5cclxuICAgICAgICAgICAgICBjb25zdCBbZXNjYXBlZFBhZHJlUXVlcnksIGVzY2FwZWRQYWRyZVBhcmFtc10gPVxyXG4gICAgICAgICAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICAgICAgICAgIGJ1c2NhclBhZHJlU3FsLFxyXG4gICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZpdHlOYW1lOiBhY3Rpdml0eU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgY2ljbGVJZDogY2ljbGVJZCxcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgIGNvbnN0IHBhZHJlUm93cyA9IGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgICAgICAgZXNjYXBlZFBhZHJlUXVlcnksXHJcbiAgICAgICAgICAgICAgICBlc2NhcGVkUGFkcmVQYXJhbXNcclxuICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICBpZiAocGFkcmVSb3dzICYmIHBhZHJlUm93cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwYWRyZVJvdyA9IHBhZHJlUm93c1swXTtcclxuICAgICAgICAgICAgICAgIGFjdGl2aXR5TmFtZSA9XHJcbiAgICAgICAgICAgICAgICAgIHBhZHJlUm93LlBhcmVudEFjdGl2aXR5IHx8XHJcbiAgICAgICAgICAgICAgICAgIHBhZHJlUm93LnBhcmVudGFjdGl2aXR5IHx8XHJcbiAgICAgICAgICAgICAgICAgIHBhZHJlUm93LlBBUkVOVEFDVElWSVRZIHx8XHJcbiAgICAgICAgICAgICAgICAgIG51bGw7XHJcbiAgICAgICAgICAgICAgICBjaWNsZUlkID1cclxuICAgICAgICAgICAgICAgICAgcGFkcmVSb3cuUGFyZW50Q2ljbGUgfHxcclxuICAgICAgICAgICAgICAgICAgcGFkcmVSb3cucGFyZW50Y2ljbGUgfHxcclxuICAgICAgICAgICAgICAgICAgcGFkcmVSb3cuUEFSRU5UQ0lDTEUgfHxcclxuICAgICAgICAgICAgICAgICAgbnVsbDtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYWN0aXZpdHlOYW1lID0gbnVsbDtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9IHdoaWxlIChlbmNvbnRyb0NpY2xvKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5sb2dnZXIubG9nKFxyXG4gICAgICAgIGBEb2N1bWVudG9zIHbDoWxpZG9zIHBhcmEgY29uc29saWRhcjogJHtkb2N1bWVudG9zUGFyYUNvbnNvbGlkYXIubGVuZ3RofSBkZSAke2lkc0RvY3VtZW50b3NSZWxhY2lvbmFkb3MubGVuZ3RofWBcclxuICAgICAgKTtcclxuXHJcbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAvLyBQQVNPIDE2OiBFamVjdXRhciBwcm9jZXNvIGJhdGNoIHBhcmEgbWFuaWZpZXN0b3MgYcOpcmVvcyB5IGNvdXJpZXJcclxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgIGlmICh0aXBvRG9jdW1lbnRvID09PSBcIk1GVE9DXCIpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgY29uc29saWRhY2lvbkJhdGNoU3FsID0gYFxyXG4gICAgICAgICAgICBCRUdJTlxyXG4gICAgICAgICAgICAgIERPQ1VNRU5UT1MuUEtfQ09VUklFUlNfRklTQ0FMSVpBQ0lPTi5QUl9DT1VSSUVSU19CTEZJU0NBTElaQUNJT05FUyg6aWRNYW5pZmllc3RvKTtcclxuICAgICAgICAgICAgRU5EO1xyXG4gICAgICAgICAgYDtcclxuXHJcbiAgICAgICAgICBjb25zdCBbZXNjYXBlZEJhdGNoUXVlcnksIGVzY2FwZWRCYXRjaFBhcmFtc10gPVxyXG4gICAgICAgICAgICBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcclxuICAgICAgICAgICAgICBjb25zb2xpZGFjaW9uQmF0Y2hTcWwsXHJcbiAgICAgICAgICAgICAgeyBpZE1hbmlmaWVzdG86IGRvY3VtZW50b0lkIH0sXHJcbiAgICAgICAgICAgICAge31cclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBhd2FpdCBxdWVyeVJ1bm5lci5xdWVyeShlc2NhcGVkQmF0Y2hRdWVyeSwgZXNjYXBlZEJhdGNoUGFyYW1zKTtcclxuXHJcbiAgICAgICAgICB0aGlzLmxvZ2dlci5sb2coXHJcbiAgICAgICAgICAgIGBbUEFTTyAxNl0gUHJvY2VzbyBiYXRjaCBkZSBjb25zb2xpZGFjacOzbiBlamVjdXRhZG8gcGFyYSBtYW5pZmllc3RvICR7ZG9jdW1lbnRvSWR9YFxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9IGNhdGNoIChiYXRjaEVycm9yKSB7XHJcbiAgICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihcclxuICAgICAgICAgICAgYFtQQVNPIDE2XSBFcnJvciBhbCBlamVjdXRhciBwcm9jZXNvIGJhdGNoIHBhcmEgbWFuaWZpZXN0byAke2RvY3VtZW50b0lkfTpgLFxyXG4gICAgICAgICAgICBiYXRjaEVycm9yXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgLy8gTWFudGVuZXIgZWwgY29tcG9ydGFtaWVudG8gZGVsIGPDs2RpZ28gbGVnYWRvOiByZWdpc3RyYXIgZWwgZXJyb3IgeSBjb250aW51YXJcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAvLyBQQVNPIDE3OiBDYW1iaWFyIGVzdGFkbyBkZWwgbWFuaWZpZXN0byBkZSBcIkFjZXB0YWRvXCIgYSBcIkNvbmZvcm1hZG9cIlxyXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgaWYgKHRpcG9Eb2N1bWVudG8gPT09IFwiTUZUT0NcIikge1xyXG4gICAgICAgIGNvbnN0IGNhbGN1bGFyTWF4SWRNYW5pZmVzdG9TcWwgPSBgXHJcbiAgICAgICAgICBTRUxFQ1QgTUFYKElkKSBBUyBNYXhJZFxyXG4gICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRvY0VzdGFkb3NcclxuICAgICAgICAgIFdIRVJFIERvY3VtZW50byA9IDppZERvY3VtZW50b1xyXG4gICAgICAgICAgICBBTkQgVGlwb0RvY3VtZW50byA9IDp0aXBvRG9jdW1lbnRvXHJcbiAgICAgICAgICAgIEFORCBUaXBvRXN0YWRvID0gJ0NNUCdcclxuICAgICAgICBgO1xyXG5cclxuICAgICAgICBjb25zdCBbZXNjYXBlZE1heElkTWFuaWZlc3RvUXVlcnksIGVzY2FwZWRNYXhJZE1hbmlmZXN0b1BhcmFtc10gPVxyXG4gICAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICAgIGNhbGN1bGFyTWF4SWRNYW5pZmVzdG9TcWwsXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBpZERvY3VtZW50bzogZG9jdW1lbnRvSWQsXHJcbiAgICAgICAgICAgICAgdGlwb0RvY3VtZW50bzogXCJNRlRPQ1wiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7fVxyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgY29uc3QgbWF4SWRNYW5pZmVzdG9Sb3dzID0gYXdhaXQgcXVlcnlSdW5uZXIucXVlcnkoXHJcbiAgICAgICAgICBlc2NhcGVkTWF4SWRNYW5pZmVzdG9RdWVyeSxcclxuICAgICAgICAgIGVzY2FwZWRNYXhJZE1hbmlmZXN0b1BhcmFtc1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGxldCBuZXh0SWRFc3RhZG9NYW5pZmllc3RvID0gMTtcclxuXHJcbiAgICAgICAgaWYgKG1heElkTWFuaWZlc3RvUm93cyAmJiBtYXhJZE1hbmlmZXN0b1Jvd3MubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgY29uc3Qgcm93ID0gbWF4SWRNYW5pZmVzdG9Sb3dzWzBdO1xyXG4gICAgICAgICAgbGV0IG1heElkID0gbnVsbDtcclxuXHJcbiAgICAgICAgICBpZiAocm93Lk1BWElEICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbWF4SWQgPSByb3cuTUFYSUQ7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5NYXhJZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIG1heElkID0gcm93Lk1heElkO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChyb3cubWF4aWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBtYXhJZCA9IHJvdy5tYXhpZDtcclxuICAgICAgICAgIH0gZWxzZSBpZiAocm93Lk1BWF9JRCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIG1heElkID0gcm93Lk1BWF9JRDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAobWF4SWQgIT09IG51bGwgJiYgbWF4SWQgIT09IHVuZGVmaW5lZCAmJiBtYXhJZCAhPT0gXCJcIikge1xyXG4gICAgICAgICAgICBjb25zdCBtYXhJZE51bWJlciA9IE51bWJlcihtYXhJZCk7XHJcbiAgICAgICAgICAgIGlmICghaXNOYU4obWF4SWROdW1iZXIpKSB7XHJcbiAgICAgICAgICAgICAgbmV4dElkRXN0YWRvTWFuaWZpZXN0byA9IG1heElkTnVtYmVyICsgMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZmVjaGFFc3RhZG9NYW5pZmllc3RvID0gbmV3IERhdGUoKTtcclxuXHJcbiAgICAgICAgY29uc3QgaW5zZXJ0YXJFc3RhZG9NYW5pZmVzdG9TcWwgPSBgXHJcbiAgICAgICAgICBJTlNFUlQgSU5UTyBET0NVTUVOVE9TLkRvY0VzdGFkb3MoXHJcbiAgICAgICAgICAgIERvY3VtZW50byxcclxuICAgICAgICAgICAgVGlwb0RvY3VtZW50byxcclxuICAgICAgICAgICAgVGlwb0VzdGFkbyxcclxuICAgICAgICAgICAgSWQsXHJcbiAgICAgICAgICAgIEZlY2hhLFxyXG4gICAgICAgICAgICBPYnNlcnZhY2lvbixcclxuICAgICAgICAgICAgSWRVc3VhcmlvLFxyXG4gICAgICAgICAgICBBY3RpdmEsXHJcbiAgICAgICAgICAgIEZlY2hhQWN0aXZhLFxyXG4gICAgICAgICAgICBGZWNoYURlc2FjdGl2YVxyXG4gICAgICAgICAgKSBWQUxVRVMgKFxyXG4gICAgICAgICAgICA6aWREb2N1bWVudG8sXHJcbiAgICAgICAgICAgIDp0aXBvRG9jdW1lbnRvLFxyXG4gICAgICAgICAgICAnQ01QJyxcclxuICAgICAgICAgICAgOm5leHRJZEVzdGFkbyxcclxuICAgICAgICAgICAgOmZlY2hhRXN0YWRvLFxyXG4gICAgICAgICAgICAnTUFOSUZJRVNUTyBDT05GT1JNQURPIEFVVE9NQVRJQ0FNRU5URSBQT1IgSVNJRE9SQScsXHJcbiAgICAgICAgICAgICdbYXV0b21hdGljb10nLFxyXG4gICAgICAgICAgICAnUycsXHJcbiAgICAgICAgICAgIDpmZWNoYUVzdGFkbyxcclxuICAgICAgICAgICAgOmZlY2hhRXN0YWRvXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgYDtcclxuXHJcbiAgICAgICAgY29uc3QgW2VzY2FwZWRJbnNlcnRNYW5pZmVzdG9RdWVyeSwgZXNjYXBlZEluc2VydE1hbmlmZXN0b1BhcmFtc10gPVxyXG4gICAgICAgICAgZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICAgIGluc2VydGFyRXN0YWRvTWFuaWZlc3RvU3FsLFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgaWREb2N1bWVudG86IGRvY3VtZW50b0lkLFxyXG4gICAgICAgICAgICAgIHRpcG9Eb2N1bWVudG86IFwiTUZUT0NcIixcclxuICAgICAgICAgICAgICBuZXh0SWRFc3RhZG86IG5leHRJZEVzdGFkb01hbmlmaWVzdG8sXHJcbiAgICAgICAgICAgICAgZmVjaGFFc3RhZG86IGZlY2hhRXN0YWRvTWFuaWZpZXN0byxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge31cclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIGF3YWl0IHF1ZXJ5UnVubmVyLnF1ZXJ5KFxyXG4gICAgICAgICAgZXNjYXBlZEluc2VydE1hbmlmZXN0b1F1ZXJ5LFxyXG4gICAgICAgICAgZXNjYXBlZEluc2VydE1hbmlmZXN0b1BhcmFtc1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHRoaXMubG9nZ2VyLmxvZyhcclxuICAgICAgICAgIGBbUEFTTyAxN10gTWFuaWZpZXN0byAke2RvY3VtZW50b0lkfSBhY3R1YWxpemFkbyBhIGVzdGFkbyBDTVBgXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQ29tbWl0IGRlIGxhIHRyYW5zYWNjacOzbiBzaSB0b2RvIHNhbGnDsyBiaWVuXHJcbiAgICAgIGF3YWl0IHF1ZXJ5UnVubmVyLmNvbW1pdFRyYW5zYWN0aW9uKCk7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgVHJhbnNhY2Npw7NuIGRlIGNvbnNvbGlkYWNpw7NuIGNvbmZpcm1hZGEgZXhpdG9zYW1lbnRlIHBhcmEgbWFuaWZpZXN0byAke2RvY3VtZW50b0lkfWApO1xyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICAvLyBSb2xsYmFjayBkZSBsYSB0cmFuc2FjY2nDs24gZW4gY2FzbyBkZSBlcnJvclxyXG4gICAgICBhd2FpdCBxdWVyeVJ1bm5lci5yb2xsYmFja1RyYW5zYWN0aW9uKCk7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKFxyXG4gICAgICAgIGBFcnJvciBlbiBwcm9jZXNvIGRlIGNvbnNvbGlkYWNpw7NuLiBUcmFuc2FjY2nDs24gcmV2ZXJ0aWRhIHBhcmEgbWFuaWZpZXN0byAke2RvY3VtZW50b0lkfTpgLFxyXG4gICAgICAgIGVycm9yXHJcbiAgICAgICk7XHJcbiAgICAgIHRocm93IGVycm9yO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgLy8gTGliZXJhciBlbCBRdWVyeVJ1bm5lclxyXG4gICAgICBhd2FpdCBxdWVyeVJ1bm5lci5yZWxlYXNlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4iXX0=