import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class CloseManifestService {
  private readonly logger = new Logger(CloseManifestService.name);

  constructor(
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Ejecuta el proceso real de cierre de manifiesto version final
   * Implementa toda la lógica de consolidación de guías, actualización de estados y workflow
   */
  async closeManifest(documentoId: number): Promise<void> {
    // Obtener driver una vez (reutilizable para múltiples consultas)
    const driver = this.dataSource.driver;

    // ========================================================================
    // PASO 01: Verificar que el estado del manifiesto sea ACEPTADO y revisado diga NO
    // ========================================================================
    const paso0Params: Record<string, unknown> = {
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

    const [escapedPaso0Query, escapedPaso0Params] =
      driver.escapeQueryWithParameters(paso0Sql, paso0Params, {});

    const paso0Rows = await this.dataSource.query(
      escapedPaso0Query,
      escapedPaso0Params
    );

    // Validar que el documento existe
    if (!paso0Rows || paso0Rows.length === 0) {
      throw new Error(`El documento ${documentoId} no existe o no es un manifiesto válido`);
    }

    const documentoInfo = paso0Rows[0];
    const estado = documentoInfo?.ESTADO || documentoInfo?.estado;
    const tipo_estado =
      documentoInfo?.TIPO_ESTADO || documentoInfo?.tipo_estado;
    const revisado = documentoInfo?.REVISADO || documentoInfo?.revisado;

    // Validar que el estado sea "ACEPTADO"
    const estadoAceptado = estado && estado.toUpperCase() === "ACEPTADO";
    const tipoEstadoAceptado =
      tipo_estado &&
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
    const estaAnulado =
      tipo_estado && tipo_estado.toUpperCase() === "ANU";

    if (estaAnulado) {
      throw new Error("El manifiesto está anulado, no se puede cerrar");
    }

    this.logger.log(`[PASO 02] Verificación de anulado pasada para manifiesto ${documentoId}`);

    // ========================================================================
    // PASO 03: Verificar que el tipo de manifiesto sea MFTOC y crear variable GTIME
    // ========================================================================
    const tipoDocumento =
      documentoInfo?.TIPODOCUMENTO || documentoInfo?.tipodocumento || null;

    let tipoDocT: string | null = null;

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

    const idsDocumentosRelacionados =
      documentosRelacionadosRows?.map(
        (row: any) => row.Id || row.id || row.ID
      ) || [];

    this.logger.log(
      `[PASO 04] Documentos relacionados encontrados: ${idsDocumentosRelacionados.length}`
    );

    // INICIAR PROCESO DE TRANSACCIONES DE BD
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
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

      for (const idDocumento of idsDocumentosRelacionados) {
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

        let estaAnulado = false;
        for (const estadoRow of estadosRows) {
          const estado = estadoRow.TipoEstado || estadoRow.tipoestado;
          if (estado === "ANU") {
            estaAnulado = true;
            break;
          }
        }

        if (estaAnulado) {
          this.logger.log(
            `[CONSOLIDACION] Documento ${idDocumento} ANULADO no se CONSOLIDA`
          );
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
          } catch (error: any) {
            this.logger.error(
              `Error al procesar relación para documento ${idDocumento}:`,
              error
            );
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

          encontroCiclo = ciclosRows && ciclosRows.length > 0;

          if (encontroCiclo) {
            const cicloRow = ciclosRows[0];
            let activityName = cicloRow.ActivityName || cicloRow.activityname;
            let cicleId =
              cicloRow.CicleId || cicloRow.cicleid || cicloRow.CICLEID;

            while (activityName) {
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
      }

      this.logger.log(
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

          this.logger.log(
            `[PASO 16] Proceso batch de consolidación ejecutado para manifiesto ${documentoId}`
          );
        } catch (batchError) {
          this.logger.error(
            `[PASO 16] Error al ejecutar proceso batch para manifiesto ${documentoId}:`,
            batchError
          );
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

        this.logger.log(
          `[PASO 17] Manifiesto ${documentoId} actualizado a estado CMP`
        );
      }

      // Commit de la transacción si todo salió bien
      await queryRunner.commitTransaction();
      this.logger.log(`Transacción de consolidación confirmada exitosamente para manifiesto ${documentoId}`);
    } catch (error: any) {
      // Rollback de la transacción en caso de error
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error en proceso de consolidación. Transacción revertida para manifiesto ${documentoId}:`,
        error
      );
      throw error;
    } finally {
      // Liberar el QueryRunner
      await queryRunner.release();
    }
  }
}

