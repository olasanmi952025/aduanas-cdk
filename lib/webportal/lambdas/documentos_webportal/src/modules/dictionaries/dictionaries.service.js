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
exports.DictionariesService = void 0;
const entities_1 = require("./entities");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const common_1 = require("@nestjs/common");
const doc_tipo_fecha_entity_1 = require("./entities/doc-tipo-fecha.entity");
const doc_tipo_estados_entity_1 = require("./entities/doc-tipo-estados.entity");
const response_util_1 = require("../../shared/utils/response.util");
const doc_documento_base_entity_1 = require("../documentos/entities/doc-documento-base.entity");
let DictionariesService = class DictionariesService {
    constructor(tipoFechaRepository, tipoEstadoRepository, documentoBaseRepository, tipoLocacionRepository, rolesRepository, locacionDocumentoRepository, participacionRepository, dinAduanRepository, dataSource) {
        this.tipoFechaRepository = tipoFechaRepository;
        this.tipoEstadoRepository = tipoEstadoRepository;
        this.documentoBaseRepository = documentoBaseRepository;
        this.tipoLocacionRepository = tipoLocacionRepository;
        this.rolesRepository = rolesRepository;
        this.locacionDocumentoRepository = locacionDocumentoRepository;
        this.participacionRepository = participacionRepository;
        this.dinAduanRepository = dinAduanRepository;
        this.dataSource = dataSource;
    }
    async getTypeLocations(documentType) {
        try {
            const sanitizedDocumentType = String(documentType ?? '')
                .replace(/[^a-zA-Z0-9]/g, '')
                .trim()
                .toUpperCase();
            if (!sanitizedDocumentType) {
                throw response_util_1.ResponseUtil.badRequest('documentType is required');
            }
            // Tipos de locación permitidos para GTIME
            const gtimeLocationTypes = ['PD', 'PE', 'LE', 'LD', 'LEM', 'LRM'];
            // Construir la query base
            let sql = `
        SELECT
          dtdl.TIPOLOCACION AS codigo,
          dtl.DESCRIPCION AS descripcion
        FROM DOCUMENTOS.DOCTIPOLOCACION dtl
        JOIN DOCUMENTOS.DOCTIPODOCLOCACION dtdl
          ON dtl.CODIGO = dtdl.TIPOLOCACION
        WHERE dtl.ACTIVA = 'S'
          AND dtdl.ACTIVA = 'S'
          AND dtdl.TIPODOCUMENTO = :documentType
      `;
            const params = {
                documentType: sanitizedDocumentType
            };
            if (sanitizedDocumentType === 'GTIME') {
                const locationTypeParams = gtimeLocationTypes.map((_, index) => `:locationType${index}`);
                sql += ` AND dtdl.TIPOLOCACION IN (${locationTypeParams.join(', ')})`;
                // Agregar cada tipo como parámetro individual
                gtimeLocationTypes.forEach((type, index) => {
                    params[`locationType${index}`] = type;
                });
            }
            sql += ` ORDER BY dtl.DESCRIPCION ASC`;
            const driver = this.dataSource.driver;
            const [escapedQuery, escapedParams] = driver.escapeQueryWithParameters(sql, params, {});
            const rows = await this.dataSource.query(escapedQuery, escapedParams);
            const mapped = rows.map((row) => ({
                codigo: row.CODIGO ?? row.codigo ?? '',
                descripcion: row.DESCRIPCION ?? row.descripcion ?? '',
            }));
            const payload = {
                documentType: sanitizedDocumentType,
                typeLocations: mapped,
                total: mapped.length,
            };
            return response_util_1.ResponseUtil.success(payload, 'Tipos de locación obtenidos exitosamente');
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
    async getRoles() {
        try {
            const roles = await this.rolesRepository.find({
                where: { activa: 'S' },
                order: { codigo: 'ASC' }
            });
            const response = {
                roles,
                total: roles.length,
                message: 'Roles obtenidos exitosamente'
            };
            return response_util_1.ResponseUtil.success(response, 'Roles obtenidos exitosamente');
        }
        catch (error) {
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
    async getUsersCreators(onlyActive = true, searchTerm = '', page = 1, limit = 20) {
        const activeFilter = onlyActive ? "AND ACTIVO = 'S'" : "";
        const searchFilter = searchTerm
            ? `AND UPPER(CREADOR) LIKE UPPER('%${searchTerm}%')`
            : '';
        const offset = (page - 1) * limit;
        const baseQuery = `
      SELECT DISTINCT 
        IDEMISOR,
        EMISOR,
        LOGINCREADOR,
        CREADOR,
        ACTIVO
      FROM DOCDOCUMENTOBASE 
      WHERE EMISOR IS NOT NULL 
        AND LENGTH(EMISOR) > 0
        ${activeFilter}
        ${searchFilter}
      ORDER BY EMISOR ASC
    `;
        const paginatedQuery = `
      SELECT * FROM (
        SELECT q.*, ROWNUM rn FROM (
          ${baseQuery}
        ) q WHERE ROWNUM <= ${offset + limit}
      ) WHERE rn > ${offset}
    `;
        const countQuery = `SELECT COUNT(1) AS TOTAL FROM (${baseQuery})`;
        const [users, countRows] = await Promise.all([
            this.documentoBaseRepository.query(paginatedQuery),
            this.documentoBaseRepository.query(countQuery)
        ]);
        const total = Number(countRows?.[0]?.TOTAL || 0);
        const usersMap = users.map((usuario) => ({
            idEmisor: usuario.IDEMISOR,
            emisor: usuario.EMISOR,
            loginCreador: usuario.LOGINCREADOR,
            creador: usuario.CREADOR,
            activo: usuario.ACTIVO,
            nombre: usuario.CREADOR || usuario.EMISOR,
            codigo: usuario.LOGINCREADOR
        }));
        return {
            usuariosCreadores: usersMap,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getLocations(filters) {
        try {
            const page = Math.max(1, parseInt(String(filters.page || 1)));
            const limit = Math.min(100, Math.max(1, parseInt(String(filters.limit || 50))));
            const offset = (page - 1) * limit;
            const searchTerm = filters.searchTerm ?
                String(filters.searchTerm).replace(/[^a-zA-Z0-9\s\-_\.]/g, '').trim() : null;
            const typeLocation = filters.tipoLocacion ?
                String(filters.tipoLocacion).replace(/[^a-zA-Z0-9]/g, '') : null;
            const conditions = ["l.ACTIVA = :activa"];
            const params = { activa: 'S' };
            if (searchTerm && searchTerm.length > 0) {
                conditions.push("UPPER(l.LOCACION) LIKE UPPER(:searchTerm)");
                params.searchTerm = `%${searchTerm}%`;
            }
            if (typeLocation && typeLocation.length > 0) {
                conditions.push("l.TIPOLOCACION = :tipoLocacion");
                params.tipoLocacion = typeLocation;
            }
            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            const baseQuery = `
        SELECT 
          l.IDLOCACION,
          l.CODIGOLOCACION,
          l.LOCACION,
          l.TIPOLOCACION,
          COUNT(*) as TOTALDOCUMENTOS
        FROM DOCLOCACIONDOCUMENTO l
        ${whereClause}
        GROUP BY l.IDLOCACION, l.CODIGOLOCACION, l.LOCACION, l.TIPOLOCACION
        ORDER BY l.LOCACION ASC
      `;
            const mainQuery = `
        SELECT * FROM (
          SELECT q.*, ROWNUM rn FROM (
            ${baseQuery}
          ) q WHERE ROWNUM <= :maxRow
        ) WHERE rn > :minRow
      `;
            const countQuery = `
        SELECT COUNT(*) as TOTAL FROM (
          SELECT l.IDLOCACION
          FROM DOCLOCACIONDOCUMENTO l
          ${whereClause}
          GROUP BY l.IDLOCACION, l.CODIGOLOCACION, l.LOCACION, l.TIPOLOCACION
        )
      `;
            const mainQueryParams = {
                ...params,
                maxRow: offset + limit,
                minRow: offset
            };
            const [locations, countRows] = await Promise.all([
                this.locacionDocumentoRepository.query(mainQuery, mainQueryParams),
                this.locacionDocumentoRepository.query(countQuery, params)
            ]);
            const total = Number(countRows?.[0]?.TOTAL || 0);
            const locationsMap = locations.map((locacion) => ({
                idLocacion: locacion.IDLOCACION,
                codigoLocacion: locacion.CODIGOLOCACION,
                locacion: locacion.LOCACION,
                tipoLocacion: locacion.TIPOLOCACION,
                totalDocumentos: locacion.TOTALDOCUMENTOS || 0,
                nombre: locacion.LOCACION,
                codigo: locacion.CODIGOLOCACION
            }));
            const response = {
                locaciones: locationsMap,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
            return response_util_1.ResponseUtil.success(response, 'Locaciones obtenidas exitosamente');
        }
        catch (error) {
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
    async getLocalitiesDictionary(filters) {
        try {
            // Paginación (mismo patrón que searchDocuments)
            const page = Number(filters?.page || 1);
            const limit = Number(filters?.limit || 20);
            const offset = (page - 1) * limit;
            // Sanitizar entrada: remover caracteres especiales que podrían usarse en inyección
            const busqueda = filters?.busqueda
                ? filters.busqueda.trim().replace(/[%_]/g, "").toUpperCase()
                : null;
            // Construir condiciones WHERE
            const conditions = [];
            const params = {};
            // Condiciones siempre aplicadas: Activa = 'S'
            conditions.push("ll.activa = 'S'");
            conditions.push("(lp.activa = 'S' OR lp.activa IS NULL)");
            if (busqueda) {
                const busquedaLike = `%${busqueda}%`;
                conditions.push(`(
          UPPER(lcv.nombreciudad) LIKE UPPER(:p_busqueda_like) 
          OR UPPER(lcv.valor) = UPPER(:p_busqueda_exact)
          OR UPPER(ll.descripcion) LIKE UPPER(:p_busqueda_like)
          )
            `);
                params.p_busqueda_like = busquedaLike;
                params.p_busqueda_exact = busqueda;
            }
            /*
                  OR UPPER(ll.descripcion) LIKE UPPER(:p_busqueda_like)
                  OR UPPER(ll.nombre) LIKE UPPER(:p_busqueda_like)
                  OR UPPER(ll.codigo) = UPPER(:p_busqueda_exact)
                  
                  */
            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            // Query SQL base con parámetros nombrados
            let sql = `
        SELECT
          ll.locacion AS locacion,
          TRIM(ll.codigo) AS locacionCodigo,
          TRIM(ll.descripcion) AS descripcionLocacion,
          TRIM(lp.Codigo) AS paisCodigo,
          TRIM(lp.Nombre) AS paisNombre,
          TRIM(lp.Descripcion) AS paisDescripcion,
          TRIM(lcv.valor) AS codigoValor,
          TRIM(ll.descripcion) || 
          CASE WHEN lcv.nombreciudad IS NOT NULL THEN ', ' || TRIM(lcv.nombreciudad) ELSE '' END ||
          ', ' || TRIM(NVL(lp.nombre, 'N/D')) || ' (' || TRIM(NVL(lcv.valor, NVL(ll.codigo, 'N/D'))) || ')' AS descripcionResumen
        FROM locaciones.loclocacion ll
        LEFT JOIN locaciones.locpais lp ON lp.pais = ll.pais
        LEFT JOIN locaciones.loccodigovalor lcv ON lcv.locacion = ll.locacion AND lcv.activa = 'S'
        ${whereClause}
        ORDER BY lp.nombre ASC
      `;
            // Paginación con ROWNUM (mismo patrón que searchDocuments)
            const paginatedSql = `
        SELECT * FROM (
          SELECT q.*, ROWNUM rn FROM (
            ${sql}
          ) q WHERE ROWNUM <= ${offset + limit}
        ) WHERE rn > ${offset}
      `;
            // Obtener driver y escapar query con parámetros (mismo método que en documentos.service.ts)
            const connection = this.documentoBaseRepository.manager.connection;
            const driver = connection.driver;
            const [escapedQuery, escapedParams] = driver.escapeQueryWithParameters(paginatedSql, params, {});
            const rows = await this.documentoBaseRepository.query(escapedQuery, escapedParams);
            // Conteo total (sin paginación) - usar parámetros sin rownum
            const countSql = `SELECT COUNT(1) AS TOTAL FROM (${sql})`;
            const [countQuery, countParameters] = driver.escapeQueryWithParameters(countSql, params, {});
            const countRows = await this.documentoBaseRepository.query(countQuery, countParameters);
            const total = Number(countRows?.[0]?.TOTAL || 0);
            const localities = rows.map((row) => {
                const trimValue = (val) => {
                    if (val === null || val === undefined)
                        return null;
                    return String(val).trim() || null;
                };
                return {
                    locacion: row.LOCACION ?? row.locacion,
                    locacionCodigo: trimValue(row.LOCACIONCODIGO ?? row.locacionCodigo),
                    descripcionLocacion: trimValue(row.DESCRIPCIONLOCACION ?? row.descripcionLocacion),
                    paisCodigo: trimValue(row.PAISCODIGO ?? row.paisCodigo),
                    paisNombre: trimValue(row.PAISNOMBRE ?? row.paisNombre),
                    paisDescripcion: trimValue(row.PAISDESCRIPCION ?? row.paisDescripcion),
                    codigoValor: trimValue(row.CODIGOVALOR ?? row.codigoValor),
                    descripcionResumen: trimValue(row.DESCRIPCIONRESUMEN ?? row.descripcionResumen),
                };
            });
            const response = {
                localities,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                filters: {
                    busqueda: filters?.busqueda ?? null,
                },
                message: "Localidades obtenidas exitosamente",
            };
            return response_util_1.ResponseUtil.success(response, "Localidades obtenidas exitosamente");
        }
        catch (error) {
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
    async getRolesParticipation() {
        try {
            const query = `
        SELECT DISTINCT 
          ROL
        FROM DOCPARTICIPACION 
        WHERE ACTIVA = 'S'
          AND NOMBREPARTICIPANTE IS NOT NULL
          AND LENGTH(NOMBREPARTICIPANTE) > 0
        GROUP BY ROL
        ORDER BY ROL ASC
      `;
            const roles = await this.participacionRepository.query(query);
            const rolesMap = roles.map((rol) => ({
                rol: rol.ROL,
                totalParticipantes: rol.TOTAL_PARTICIPANTES,
                codigo: rol.ROL,
                nombre: rol.ROL
            }));
            return response_util_1.ResponseUtil.success(rolesMap, 'Roles de participación obtenidos exitosamente');
        }
        catch (error) {
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
    // Métodos para DocTipoFecha
    async getDateTypesDoc(typeDocument = 'MFTOC') {
        try {
            const date_type = await this.tipoFechaRepository.find({
                where: {
                    activa: "S",
                    codigo: (0, typeorm_1.In)(typeDocument === 'MFTOC' ?
                        ["FARRIBO", "FZARPE", "FEM", "FEDESPEGUE", "FECACEPTA"] :
                        ["FZARPE", "FEM", "FECACEPTA"])
                },
                select: {
                    codigo: true,
                    descripcion: true,
                },
                order: { codigo: "ASC" },
            });
            const response = {
                dateType: date_type,
                total: date_type.length,
                message: "Tipos de fecha obtenidos exitosamente",
            };
            return response_util_1.ResponseUtil.success(response, "Tipos de fecha obtenidos exitosamente");
        }
        catch (error) {
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
    // Métodos para DocStatusType
    async getStatusTypesDoc(documentType = 'MFTOC') {
        try {
            const status_types = await this.tipoEstadoRepository.find({
                where: {
                    document_type: documentType,
                    active: 'S',
                    code: (0, typeorm_1.In)(documentType === 'GTIME' ?
                        ['ACP', 'ACL', 'ANU', 'CMP', 'LIBRE', 'VIS', 'CON MARCA'] :
                        ['ACP', 'ACL', 'ANU', 'VIS', 'CMP'])
                },
                select: {
                    name: true,
                    code: true,
                },
                order: { code: 'ASC' },
            });
            const mapped_status_types = status_types.map((e) => ({
                documentType: e.document_type,
                code: e.code,
                name: e.name,
                description: e.description,
                active: e.active,
                activeDate: e.active_date,
                inactiveDate: e.inactive_date,
            }));
            const response = {
                statusTypes: mapped_status_types,
                total: mapped_status_types.length,
                message: 'Tipos de estado obtenidos exitosamente',
            };
            return response_util_1.ResponseUtil.success(response, 'Tipos de estado obtenidos exitosamente');
        }
        catch (error) {
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
    // Métodos para obtener emisores desde PER_PERSONA
    async getEmitters() {
        try {
            const base_query = `
        SELECT DISTINCT 
          dp.IDPERSONAPARTICIPANTE,
          pp.NOMBRE
        FROM DOCUMENTOS.DOCPARTICIPACION dp
        JOIN DOCUMENTOS.DOCROL dr ON dp.ROL = dr.CODIGO
        JOIN ADMPERSONAS.PER_PERSONA pp ON pp.ID = dp.IDPERSONAPARTICIPANTE
        WHERE dp.ROL = 'EMI'
          AND dp.ACTIVA = 'S'
        ORDER BY pp.NOMBRE ASC
      `;
            const emitters_raw = await this.participacionRepository.query(base_query);
            const mapped_emitters = emitters_raw.map((emitter) => ({
                idPersonaParticipante: emitter.IDPERSONAPARTICIPANTE,
                nombre: emitter.NOMBRE,
                codigo: emitter.IDPERSONAPARTICIPANTE || null,
            }));
            const response = {
                emitters: mapped_emitters,
                total: mapped_emitters.length,
                message: 'Emisores obtenidos exitosamente',
            };
            return response_util_1.ResponseUtil.success(response, 'Emisores obtenidos exitosamente');
        }
        catch (error) {
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
    // Métodos para obtener emisores con filtros (búsqueda y paginación)
    async getEmittersWithFilters(searchTerm = '', page = 1, limit = 50) {
        try {
            const offset = (page - 1) * limit;
            const searchFilter = searchTerm
                ? `AND UPPER(pp.NOMBRE) LIKE UPPER('%${searchTerm}%')`
                : '';
            const baseQuery = `
        SELECT DISTINCT 
          dp.IDPERSONAPARTICIPANTE,
          pp.NOMBRE
        FROM DOCUMENTOS.DOCPARTICIPACION dp
        JOIN DOCUMENTOS.DOCROL dr ON dp.ROL = dr.CODIGO
        JOIN ADMPERSONAS.PER_PERSONA pp ON pp.ID = dp.IDPERSONAPARTICIPANTE
        WHERE dp.ROL = 'EMI'
          AND dp.ACTIVA = 'S'
          ${searchFilter}
        ORDER BY pp.NOMBRE ASC
      `;
            const paginatedQuery = `
        SELECT * FROM (
          SELECT q.*, ROWNUM rn FROM (
            ${baseQuery}
          ) q WHERE ROWNUM <= ${offset + limit}
        ) WHERE rn > ${offset}
      `;
            const countQuery = `SELECT COUNT(1) AS TOTAL FROM (${baseQuery})`;
            const [emitters, countRows] = await Promise.all([
                this.participacionRepository.query(paginatedQuery),
                this.participacionRepository.query(countQuery)
            ]);
            const total = Number(countRows?.[0]?.TOTAL || 0);
            const emittersMap = emitters.map((emitter) => ({
                idPersonaParticipante: emitter.IDPERSONAPARTICIPANTE,
                nombre: emitter.NOMBRE,
                codigo: emitter.IDPERSONAPARTICIPANTE || null,
            }));
            const response = {
                emitters: emittersMap,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
            return response_util_1.ResponseUtil.success(response, 'Emisores obtenidos exitosamente');
        }
        catch (error) {
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
    // Métodos para obtener participantes por rol usando PER_PERSONA
    async getParticipantsByRoleWithPerson(rol, searchTerm = '', page = 1, limit = 50) {
        try {
            if (!rol) {
                const response = {
                    participants: [],
                    total: 0,
                    page: 1,
                    limit: 50,
                    totalPages: 0,
                };
                return response_util_1.ResponseUtil.success(response, 'No se especificó rol');
            }
            const offset = (page - 1) * limit;
            const searchFilter = searchTerm
                ? `AND UPPER(pp.NOMBRE) LIKE UPPER('%${searchTerm}%')`
                : '';
            const baseQuery = `
        SELECT DISTINCT 
          dp.IDPERSONAPARTICIPANTE,
          pp.NOMBRE
        FROM DOCUMENTOS.DOCPARTICIPACION dp
        JOIN DOCUMENTOS.DOCROL dr ON dp.ROL = dr.CODIGO
        JOIN ADMPERSONAS.PER_PERSONA pp ON pp.ID = dp.IDPERSONAPARTICIPANTE
        WHERE dp.ROL = :rol
          AND dp.ACTIVA = 'S'
          ${searchFilter}
        ORDER BY pp.NOMBRE ASC
      `;
            const paginatedQuery = `
        SELECT * FROM (
          SELECT q.*, ROWNUM rn FROM (
            ${baseQuery}
          ) q WHERE ROWNUM <= :maxRow
        ) WHERE rn > :minRow
      `;
            const countQuery = `
        SELECT COUNT(1) AS TOTAL FROM (
          SELECT DISTINCT 
            dp.IDPERSONAPARTICIPANTE
          FROM DOCUMENTOS.DOCPARTICIPACION dp
          JOIN DOCUMENTOS.DOCROL dr ON dp.ROL = dr.CODIGO
          JOIN ADMPERSONAS.PER_PERSONA pp ON pp.ID = dp.IDPERSONAPARTICIPANTE
          WHERE dp.ROL = '${rol}'
            AND dp.ACTIVA = 'S'
            ${searchFilter}
        )
      `;
            const paginatedQueryWithParams = paginatedQuery.replace(':rol', `'${rol}'`).replace(':maxRow', String(offset + limit)).replace(':minRow', String(offset));
            const [participants, countRows] = await Promise.all([
                this.participacionRepository.query(paginatedQueryWithParams),
                this.participacionRepository.query(countQuery)
            ]);
            const total = Number(countRows?.[0]?.TOTAL || 0);
            const participantsMap = participants.map((participant) => ({
                idPersonaParticipante: participant.IDPERSONAPARTICIPANTE,
                nombre: participant.NOMBRE,
                codigo: participant.IDPERSONAPARTICIPANTE || null,
            }));
            const response = {
                participants: participantsMap,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
            return response_util_1.ResponseUtil.success(response, 'Participantes obtenidos exitosamente');
        }
        catch (error) {
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
    // Método para listar aduanas del schema DIN
    async getAduanas() {
        try {
            const aduanas = await this.dinAduanRepository.find({
                order: { codAdu: 'ASC' }
            });
            const response = {
                aduanas,
                total: aduanas.length,
                message: 'Aduanas obtenidas exitosamente'
            };
            return response_util_1.ResponseUtil.success(response, 'Aduanas obtenidas exitosamente');
        }
        catch (error) {
            throw response_util_1.ResponseUtil.internalError(error);
        }
    }
};
exports.DictionariesService = DictionariesService;
exports.DictionariesService = DictionariesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(doc_tipo_fecha_entity_1.DocTipoFecha)),
    __param(1, (0, typeorm_2.InjectRepository)(doc_tipo_estados_entity_1.DocStatusType)),
    __param(2, (0, typeorm_2.InjectRepository)(doc_documento_base_entity_1.DocDocumentoBase)),
    __param(3, (0, typeorm_2.InjectRepository)(entities_1.DocTipoLocacion)),
    __param(4, (0, typeorm_2.InjectRepository)(entities_1.DocRoles)),
    __param(5, (0, typeorm_2.InjectRepository)(entities_1.DocLocacionDocumento)),
    __param(6, (0, typeorm_2.InjectRepository)(entities_1.DocParticipacion)),
    __param(7, (0, typeorm_2.InjectRepository)(entities_1.DinAduan))
], DictionariesService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGljdGlvbmFyaWVzLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkaWN0aW9uYXJpZXMuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSx5Q0FNb0I7QUFFcEIscUNBQXFEO0FBQ3JELDZDQUFtRDtBQUNuRCwyQ0FBMkQ7QUFDM0QsNEVBQWdFO0FBQ2hFLGdGQUFtRTtBQUNuRSxvRUFBZ0U7QUFDaEUsZ0dBQW9GO0FBOEI3RSxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFtQjtJQUM5QixZQUVtQixtQkFBNkMsRUFFN0Msb0JBQStDLEVBRS9DLHVCQUFxRCxFQUVyRCxzQkFBbUQsRUFFbkQsZUFBcUMsRUFFckMsMkJBQTZELEVBRTdELHVCQUFxRCxFQUVyRCxrQkFBd0MsRUFDeEMsVUFBc0I7UUFmdEIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUEwQjtRQUU3Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQTJCO1FBRS9DLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBOEI7UUFFckQsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUE2QjtRQUVuRCxvQkFBZSxHQUFmLGVBQWUsQ0FBc0I7UUFFckMsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUFrQztRQUU3RCw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQThCO1FBRXJELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7UUFDeEMsZUFBVSxHQUFWLFVBQVUsQ0FBWTtJQUN0QyxDQUFDO0lBRUosS0FBSyxDQUFDLGdCQUFnQixDQUFDLFlBQW9CO1FBQ3pDLElBQUksQ0FBQztZQUNILE1BQU0scUJBQXFCLEdBQUcsTUFBTSxDQUFDLFlBQVksSUFBSSxFQUFFLENBQUM7aUJBQ3JELE9BQU8sQ0FBQyxlQUFlLEVBQUUsRUFBRSxDQUFDO2lCQUM1QixJQUFJLEVBQUU7aUJBQ04sV0FBVyxFQUFFLENBQUM7WUFFakIsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQzNC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Z0JBQ2YsT0FBTztnQkFDUCxLQUFLLEVBQUUsT0FBTyxDQUFDLE1BQU07Z0JBQ3JCLE9BQU8sRUFBRSxnQ0FBZ0M7YUFDMUMsQ0FBQztZQUVGLE9BQU8sNEJBQVksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLGdDQUFnQyxDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7WUFDcEIsTUFBTSw0QkFBWSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQyxDQUFDO0lBQ0gsQ0FBQztDQUNGLENBQUE7QUFoc0JZLGtEQUFtQjs4QkFBbkIsbUJBQW1CO0lBRC9CLElBQUEsbUJBQVUsR0FBRTtJQUdSLFdBQUEsSUFBQSwwQkFBZ0IsRUFBQyxvQ0FBWSxDQUFDLENBQUE7SUFFOUIsV0FBQSxJQUFBLDBCQUFnQixFQUFDLHVDQUFhLENBQUMsQ0FBQTtJQUUvQixXQUFBLElBQUEsMEJBQWdCLEVBQUMsNENBQWdCLENBQUMsQ0FBQTtJQUVsQyxXQUFBLElBQUEsMEJBQWdCLEVBQUMsMEJBQWUsQ0FBQyxDQUFBO0lBRWpDLFdBQUEsSUFBQSwwQkFBZ0IsRUFBQyxtQkFBUSxDQUFDLENBQUE7SUFFMUIsV0FBQSxJQUFBLDBCQUFnQixFQUFDLCtCQUFvQixDQUFDLENBQUE7SUFFdEMsV0FBQSxJQUFBLDBCQUFnQixFQUFDLDJCQUFnQixDQUFDLENBQUE7SUFFbEMsV0FBQSxJQUFBLDBCQUFnQixFQUFDLG1CQUFRLENBQUMsQ0FBQTtHQWhCbEIsbUJBQW1CLENBZ3NCL0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBEb2NUaXBvTG9jYWNpb24sXG4gIERvY1JvbGVzLFxuICBEb2NMb2NhY2lvbkRvY3VtZW50byxcbiAgRG9jUGFydGljaXBhY2lvbixcbiAgRGluQWR1YW4sXG59IGZyb20gJy4vZW50aXRpZXMnO1xuaW1wb3J0IHsgQnVzY2FyTG9jYWxpZGFkZXNEdG8sIE9idGVuZXJMb2NhY2lvbmVzRHRvIH0gZnJvbSAnLi9kdG8vZGljdGlvbmFyaWVzLmR0byc7XG5pbXBvcnQgeyBEYXRhU291cmNlLCBJbiwgUmVwb3NpdG9yeSB9IGZyb20gJ3R5cGVvcm0nO1xuaW1wb3J0IHsgSW5qZWN0UmVwb3NpdG9yeSB9IGZyb20gJ0BuZXN0anMvdHlwZW9ybSc7XG5pbXBvcnQgeyBIdHRwRXhjZXB0aW9uLCBJbmplY3RhYmxlIH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xuaW1wb3J0IHsgRG9jVGlwb0ZlY2hhIH0gZnJvbSAnLi9lbnRpdGllcy9kb2MtdGlwby1mZWNoYS5lbnRpdHknO1xuaW1wb3J0IHsgRG9jU3RhdHVzVHlwZSB9IGZyb20gJy4vZW50aXRpZXMvZG9jLXRpcG8tZXN0YWRvcy5lbnRpdHknO1xuaW1wb3J0IHsgUmVzcG9uc2VVdGlsIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3V0aWxzL3Jlc3BvbnNlLnV0aWwnO1xuaW1wb3J0IHsgRG9jRG9jdW1lbnRvQmFzZSB9IGZyb20gJy4uL2RvY3VtZW50b3MvZW50aXRpZXMvZG9jLWRvY3VtZW50by1iYXNlLmVudGl0eSc7XG5cbnR5cGUgUmF3VHlwZUxvY2F0aW9uUm93ID0ge1xuICBDT0RJR08/OiBzdHJpbmc7XG4gIGNvZGlnbz86IHN0cmluZztcbiAgREVTQ1JJUENJT04/OiBzdHJpbmc7XG4gIGRlc2NyaXBjaW9uPzogc3RyaW5nO1xuICBBQ1RJVkE/OiBzdHJpbmc7XG4gIGFjdGl2YT86IHN0cmluZztcbiAgRkVDSEFBQ1RJVkE/OiBEYXRlO1xuICBmZWNoYWFjdGl2YT86IERhdGU7XG4gIGZlY2hhQWN0aXZhPzogRGF0ZTtcbiAgRkVDSEFERVNBQ1RJVkE/OiBEYXRlO1xuICBmZWNoYWRlc2FjdGl2YT86IERhdGU7XG4gIGZlY2hhRGVzYWN0aXZhPzogRGF0ZTtcbn07XG5cbnR5cGUgUmF3TG9jYWxpdHlSb3cgPSB7XG4gIHRpcG9Db2RpZ286IHN0cmluZyB8IG51bGw7XG4gIGxvY2FjaW9uOiBudW1iZXI7XG4gIGNvZGlnb0xvY2FjaW9uOiBzdHJpbmc7XG4gIGRlc2NyaXBjaW9uTG9jYWNpb246IHN0cmluZztcbiAgY29kaWdvUGFpczogc3RyaW5nIHwgbnVsbDtcbiAgbm9tYnJlUGFpczogc3RyaW5nIHwgbnVsbDtcbiAgY29kaWdvVmFsb3I6IHN0cmluZyB8IG51bGw7XG4gIG5vbWJyZUNpdWRhZDogc3RyaW5nIHwgbnVsbDtcbiAgZGVzY3JpcGNpb25SZXN1bWVuOiBzdHJpbmc7XG59O1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgRGljdGlvbmFyaWVzU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIEBJbmplY3RSZXBvc2l0b3J5KERvY1RpcG9GZWNoYSlcbiAgICBwcml2YXRlIHJlYWRvbmx5IHRpcG9GZWNoYVJlcG9zaXRvcnk6IFJlcG9zaXRvcnk8RG9jVGlwb0ZlY2hhPixcbiAgICBASW5qZWN0UmVwb3NpdG9yeShEb2NTdGF0dXNUeXBlKVxuICAgIHByaXZhdGUgcmVhZG9ubHkgdGlwb0VzdGFkb1JlcG9zaXRvcnk6IFJlcG9zaXRvcnk8RG9jU3RhdHVzVHlwZT4sXG4gICAgQEluamVjdFJlcG9zaXRvcnkoRG9jRG9jdW1lbnRvQmFzZSlcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRvY3VtZW50b0Jhc2VSZXBvc2l0b3J5OiBSZXBvc2l0b3J5PERvY0RvY3VtZW50b0Jhc2U+LFxuICAgIEBJbmplY3RSZXBvc2l0b3J5KERvY1RpcG9Mb2NhY2lvbilcbiAgICBwcml2YXRlIHJlYWRvbmx5IHRpcG9Mb2NhY2lvblJlcG9zaXRvcnk6IFJlcG9zaXRvcnk8RG9jVGlwb0xvY2FjaW9uPixcbiAgICBASW5qZWN0UmVwb3NpdG9yeShEb2NSb2xlcylcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJvbGVzUmVwb3NpdG9yeTogUmVwb3NpdG9yeTxEb2NSb2xlcz4sXG4gICAgQEluamVjdFJlcG9zaXRvcnkoRG9jTG9jYWNpb25Eb2N1bWVudG8pXG4gICAgcHJpdmF0ZSByZWFkb25seSBsb2NhY2lvbkRvY3VtZW50b1JlcG9zaXRvcnk6IFJlcG9zaXRvcnk8RG9jTG9jYWNpb25Eb2N1bWVudG8+LFxuICAgIEBJbmplY3RSZXBvc2l0b3J5KERvY1BhcnRpY2lwYWNpb24pXG4gICAgcHJpdmF0ZSByZWFkb25seSBwYXJ0aWNpcGFjaW9uUmVwb3NpdG9yeTogUmVwb3NpdG9yeTxEb2NQYXJ0aWNpcGFjaW9uPixcbiAgICBASW5qZWN0UmVwb3NpdG9yeShEaW5BZHVhbilcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRpbkFkdWFuUmVwb3NpdG9yeTogUmVwb3NpdG9yeTxEaW5BZHVhbj4sXG4gICAgcHJpdmF0ZSByZWFkb25seSBkYXRhU291cmNlOiBEYXRhU291cmNlLFxuICApIHt9XG5cbiAgYXN5bmMgZ2V0VHlwZUxvY2F0aW9ucyhkb2N1bWVudFR5cGU6IHN0cmluZykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzYW5pdGl6ZWREb2N1bWVudFR5cGUgPSBTdHJpbmcoZG9jdW1lbnRUeXBlID8/ICcnKVxuICAgICAgICAucmVwbGFjZSgvW15hLXpBLVowLTldL2csICcnKVxuICAgICAgICAudHJpbSgpXG4gICAgICAgIC50b1VwcGVyQ2FzZSgpO1xuXG4gICAgICBpZiAoIXNhbml0aXplZERvY3VtZW50VHlwZSkge1xuICAgICAgICB0aHJvdyBSZXNwb25zZVV0aWwuYmFkUmVxdWVzdCgnZG9jdW1lbnRUeXBlIGlzIHJlcXVpcmVkJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRpcG9zIGRlIGxvY2FjacOzbiBwZXJtaXRpZG9zIHBhcmEgR1RJTUVcbiAgICAgIGNvbnN0IGd0aW1lTG9jYXRpb25UeXBlcyA9IFsnUEQnLCAnUEUnLCAnTEUnLCAnTEQnLCAnTEVNJywgJ0xSTSddO1xuXG4gICAgICAvLyBDb25zdHJ1aXIgbGEgcXVlcnkgYmFzZVxuICAgICAgbGV0IHNxbCA9IGBcbiAgICAgICAgU0VMRUNUXG4gICAgICAgICAgZHRkbC5USVBPTE9DQUNJT04gQVMgY29kaWdvLFxuICAgICAgICAgIGR0bC5ERVNDUklQQ0lPTiBBUyBkZXNjcmlwY2lvblxuICAgICAgICBGUk9NIERPQ1VNRU5UT1MuRE9DVElQT0xPQ0FDSU9OIGR0bFxuICAgICAgICBKT0lOIERPQ1VNRU5UT1MuRE9DVElQT0RPQ0xPQ0FDSU9OIGR0ZGxcbiAgICAgICAgICBPTiBkdGwuQ09ESUdPID0gZHRkbC5USVBPTE9DQUNJT05cbiAgICAgICAgV0hFUkUgZHRsLkFDVElWQSA9ICdTJ1xuICAgICAgICAgIEFORCBkdGRsLkFDVElWQSA9ICdTJ1xuICAgICAgICAgIEFORCBkdGRsLlRJUE9ET0NVTUVOVE8gPSA6ZG9jdW1lbnRUeXBlXG4gICAgICBgO1xuXG4gICAgICBjb25zdCBwYXJhbXM6IGFueSA9IHtcbiAgICAgICAgZG9jdW1lbnRUeXBlOiBzYW5pdGl6ZWREb2N1bWVudFR5cGVcbiAgICAgIH07XG5cbiAgICAgIGlmIChzYW5pdGl6ZWREb2N1bWVudFR5cGUgPT09ICdHVElNRScpIHtcbiAgICAgICAgY29uc3QgbG9jYXRpb25UeXBlUGFyYW1zID0gZ3RpbWVMb2NhdGlvblR5cGVzLm1hcCgoXywgaW5kZXgpID0+IGA6bG9jYXRpb25UeXBlJHtpbmRleH1gKTtcbiAgICAgICAgc3FsICs9IGAgQU5EIGR0ZGwuVElQT0xPQ0FDSU9OIElOICgke2xvY2F0aW9uVHlwZVBhcmFtcy5qb2luKCcsICcpfSlgO1xuICAgICAgICBcbiAgICAgICAgLy8gQWdyZWdhciBjYWRhIHRpcG8gY29tbyBwYXLDoW1ldHJvIGluZGl2aWR1YWxcbiAgICAgICAgZ3RpbWVMb2NhdGlvblR5cGVzLmZvckVhY2goKHR5cGUsIGluZGV4KSA9PiB7XG4gICAgICAgICAgcGFyYW1zW2Bsb2NhdGlvblR5cGUke2luZGV4fWBdID0gdHlwZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHNxbCArPSBgIE9SREVSIEJZIGR0bC5ERVNDUklQQ0lPTiBBU0NgO1xuXG4gICAgICBjb25zdCBkcml2ZXIgPSB0aGlzLmRhdGFTb3VyY2UuZHJpdmVyO1xuICAgICAgY29uc3QgW2VzY2FwZWRRdWVyeSwgZXNjYXBlZFBhcmFtc10gPSBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcbiAgICAgICAgc3FsLFxuICAgICAgICBwYXJhbXMsXG4gICAgICAgIHt9XG4gICAgICApO1xuXG4gICAgICBjb25zdCByb3dzID0gYXdhaXQgdGhpcy5kYXRhU291cmNlLnF1ZXJ5KGVzY2FwZWRRdWVyeSwgZXNjYXBlZFBhcmFtcykgYXMgUmF3VHlwZUxvY2F0aW9uUm93W107XG5cbiAgICAgIGNvbnN0IG1hcHBlZCA9IHJvd3MubWFwKChyb3cpID0+ICh7XG4gICAgICAgIGNvZGlnbzogcm93LkNPRElHTyA/PyByb3cuY29kaWdvID8/ICcnLFxuICAgICAgICBkZXNjcmlwY2lvbjogcm93LkRFU0NSSVBDSU9OID8/IHJvdy5kZXNjcmlwY2lvbiA/PyAnJyxcbiAgICAgIH0pKTtcblxuICAgICAgY29uc3QgcGF5bG9hZCA9IHtcbiAgICAgICAgZG9jdW1lbnRUeXBlOiBzYW5pdGl6ZWREb2N1bWVudFR5cGUsXG4gICAgICAgIHR5cGVMb2NhdGlvbnM6IG1hcHBlZCxcbiAgICAgICAgdG90YWw6IG1hcHBlZC5sZW5ndGgsXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gUmVzcG9uc2VVdGlsLnN1Y2Nlc3MoXG4gICAgICAgIHBheWxvYWQsXG4gICAgICAgICdUaXBvcyBkZSBsb2NhY2nDs24gb2J0ZW5pZG9zIGV4aXRvc2FtZW50ZScsXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEh0dHBFeGNlcHRpb24pIHtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9XG5cbiAgICAgIHRocm93IFJlc3BvbnNlVXRpbC5pbnRlcm5hbEVycm9yKGVycm9yKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBnZXRSb2xlcygpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgcm9sZXMgPSBhd2FpdCB0aGlzLnJvbGVzUmVwb3NpdG9yeS5maW5kKHtcbiAgICAgICAgd2hlcmU6IHsgYWN0aXZhOiAnUycgfSxcbiAgICAgICAgb3JkZXI6IHsgY29kaWdvOiAnQVNDJyB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICAgIHJvbGVzLFxuICAgICAgICB0b3RhbDogcm9sZXMubGVuZ3RoLFxuICAgICAgICBtZXNzYWdlOiAnUm9sZXMgb2J0ZW5pZG9zIGV4aXRvc2FtZW50ZSdcbiAgICAgIH07XG4gICAgICBcbiAgICAgIHJldHVybiBSZXNwb25zZVV0aWwuc3VjY2VzcyhyZXNwb25zZSwgJ1JvbGVzIG9idGVuaWRvcyBleGl0b3NhbWVudGUnKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICB0aHJvdyBSZXNwb25zZVV0aWwuaW50ZXJuYWxFcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZ2V0VXNlcnNDcmVhdG9ycyhvbmx5QWN0aXZlOiBib29sZWFuID0gdHJ1ZSwgc2VhcmNoVGVybTogc3RyaW5nID0gJycsIHBhZ2U6IG51bWJlciA9IDEsIGxpbWl0OiBudW1iZXIgPSAyMCkge1xuICAgIGNvbnN0IGFjdGl2ZUZpbHRlciA9IG9ubHlBY3RpdmUgPyBcIkFORCBBQ1RJVk8gPSAnUydcIiA6IFwiXCI7XG4gICAgXG4gICAgY29uc3Qgc2VhcmNoRmlsdGVyID0gc2VhcmNoVGVybSBcbiAgICAgID8gYEFORCBVUFBFUihDUkVBRE9SKSBMSUtFIFVQUEVSKCclJHtzZWFyY2hUZXJtfSUnKWBcbiAgICAgIDogJyc7XG4gICAgXG4gICAgY29uc3Qgb2Zmc2V0ID0gKHBhZ2UgLSAxKSAqIGxpbWl0O1xuICAgIFxuICAgIGNvbnN0IGJhc2VRdWVyeSA9IGBcbiAgICAgIFNFTEVDVCBESVNUSU5DVCBcbiAgICAgICAgSURFTUlTT1IsXG4gICAgICAgIEVNSVNPUixcbiAgICAgICAgTE9HSU5DUkVBRE9SLFxuICAgICAgICBDUkVBRE9SLFxuICAgICAgICBBQ1RJVk9cbiAgICAgIEZST00gRE9DRE9DVU1FTlRPQkFTRSBcbiAgICAgIFdIRVJFIEVNSVNPUiBJUyBOT1QgTlVMTCBcbiAgICAgICAgQU5EIExFTkdUSChFTUlTT1IpID4gMFxuICAgICAgICAke2FjdGl2ZUZpbHRlcn1cbiAgICAgICAgJHtzZWFyY2hGaWx0ZXJ9XG4gICAgICBPUkRFUiBCWSBFTUlTT1IgQVNDXG4gICAgYDtcbiAgICBcbiAgICBjb25zdCBwYWdpbmF0ZWRRdWVyeSA9IGBcbiAgICAgIFNFTEVDVCAqIEZST00gKFxuICAgICAgICBTRUxFQ1QgcS4qLCBST1dOVU0gcm4gRlJPTSAoXG4gICAgICAgICAgJHtiYXNlUXVlcnl9XG4gICAgICAgICkgcSBXSEVSRSBST1dOVU0gPD0gJHtvZmZzZXQgKyBsaW1pdH1cbiAgICAgICkgV0hFUkUgcm4gPiAke29mZnNldH1cbiAgICBgO1xuXG4gICAgY29uc3QgY291bnRRdWVyeSA9IGBTRUxFQ1QgQ09VTlQoMSkgQVMgVE9UQUwgRlJPTSAoJHtiYXNlUXVlcnl9KWA7XG4gICAgXG4gICAgY29uc3QgW3VzZXJzLCBjb3VudFJvd3NdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgdGhpcy5kb2N1bWVudG9CYXNlUmVwb3NpdG9yeS5xdWVyeShwYWdpbmF0ZWRRdWVyeSksXG4gICAgICB0aGlzLmRvY3VtZW50b0Jhc2VSZXBvc2l0b3J5LnF1ZXJ5KGNvdW50UXVlcnkpXG4gICAgXSk7XG5cbiAgICBjb25zdCB0b3RhbCA9IE51bWJlcihjb3VudFJvd3M/LlswXT8uVE9UQUwgfHwgMCk7XG5cbiAgICBjb25zdCB1c2Vyc01hcCA9IHVzZXJzLm1hcCgodXN1YXJpbzogYW55KSA9PiAoe1xuICAgICAgaWRFbWlzb3I6IHVzdWFyaW8uSURFTUlTT1IsXG4gICAgICBlbWlzb3I6IHVzdWFyaW8uRU1JU09SLFxuICAgICAgbG9naW5DcmVhZG9yOiB1c3VhcmlvLkxPR0lOQ1JFQURPUixcbiAgICAgIGNyZWFkb3I6IHVzdWFyaW8uQ1JFQURPUixcbiAgICAgIGFjdGl2bzogdXN1YXJpby5BQ1RJVk8sXG4gICAgICBub21icmU6IHVzdWFyaW8uQ1JFQURPUiB8fCB1c3VhcmlvLkVNSVNPUixcbiAgICAgIGNvZGlnbzogdXN1YXJpby5MT0dJTkNSRUFET1JcbiAgICB9KSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXN1YXJpb3NDcmVhZG9yZXM6IHVzZXJzTWFwLFxuICAgICAgdG90YWwsXG4gICAgICBwYWdlLFxuICAgICAgbGltaXQsXG4gICAgICB0b3RhbFBhZ2VzOiBNYXRoLmNlaWwodG90YWwgLyBsaW1pdCksXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIGdldExvY2F0aW9ucyhmaWx0ZXJzOiBPYnRlbmVyTG9jYWNpb25lc0R0bykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYWdlID0gTWF0aC5tYXgoMSwgcGFyc2VJbnQoU3RyaW5nKGZpbHRlcnMucGFnZSB8fCAxKSkpO1xuICAgICAgY29uc3QgbGltaXQgPSBNYXRoLm1pbigxMDAsIE1hdGgubWF4KDEsIHBhcnNlSW50KFN0cmluZyhmaWx0ZXJzLmxpbWl0IHx8IDUwKSkpKTtcbiAgICAgIGNvbnN0IG9mZnNldCA9IChwYWdlIC0gMSkgKiBsaW1pdDtcblxuICAgICAgY29uc3Qgc2VhcmNoVGVybSA9IGZpbHRlcnMuc2VhcmNoVGVybSA/IFxuICAgICAgICBTdHJpbmcoZmlsdGVycy5zZWFyY2hUZXJtKS5yZXBsYWNlKC9bXmEtekEtWjAtOVxcc1xcLV9cXC5dL2csICcnKS50cmltKCkgOiBudWxsO1xuXG4gICAgICBjb25zdCB0eXBlTG9jYXRpb24gPSBmaWx0ZXJzLnRpcG9Mb2NhY2lvbiA/IFxuICAgICAgICBTdHJpbmcoZmlsdGVycy50aXBvTG9jYWNpb24pLnJlcGxhY2UoL1teYS16QS1aMC05XS9nLCAnJykgOiBudWxsO1xuXG4gICAgICBjb25zdCBjb25kaXRpb25zOiBzdHJpbmdbXSA9IFtcImwuQUNUSVZBID0gOmFjdGl2YVwiXTtcbiAgICAgIGNvbnN0IHBhcmFtczogYW55ID0geyBhY3RpdmE6ICdTJyB9O1xuXG4gICAgICBpZiAoc2VhcmNoVGVybSAmJiBzZWFyY2hUZXJtLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uZGl0aW9ucy5wdXNoKFwiVVBQRVIobC5MT0NBQ0lPTikgTElLRSBVUFBFUig6c2VhcmNoVGVybSlcIik7XG4gICAgICAgIHBhcmFtcy5zZWFyY2hUZXJtID0gYCUke3NlYXJjaFRlcm19JWA7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlTG9jYXRpb24gJiYgdHlwZUxvY2F0aW9uLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uZGl0aW9ucy5wdXNoKFwibC5USVBPTE9DQUNJT04gPSA6dGlwb0xvY2FjaW9uXCIpO1xuICAgICAgICBwYXJhbXMudGlwb0xvY2FjaW9uID0gdHlwZUxvY2F0aW9uO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB3aGVyZUNsYXVzZSA9IGNvbmRpdGlvbnMubGVuZ3RoID4gMCA/IGBXSEVSRSAke2NvbmRpdGlvbnMuam9pbignIEFORCAnKX1gIDogJyc7XG5cbiAgICAgIGNvbnN0IGJhc2VRdWVyeSA9IGBcbiAgICAgICAgU0VMRUNUIFxuICAgICAgICAgIGwuSURMT0NBQ0lPTixcbiAgICAgICAgICBsLkNPRElHT0xPQ0FDSU9OLFxuICAgICAgICAgIGwuTE9DQUNJT04sXG4gICAgICAgICAgbC5USVBPTE9DQUNJT04sXG4gICAgICAgICAgQ09VTlQoKikgYXMgVE9UQUxET0NVTUVOVE9TXG4gICAgICAgIEZST00gRE9DTE9DQUNJT05ET0NVTUVOVE8gbFxuICAgICAgICAke3doZXJlQ2xhdXNlfVxuICAgICAgICBHUk9VUCBCWSBsLklETE9DQUNJT04sIGwuQ09ESUdPTE9DQUNJT04sIGwuTE9DQUNJT04sIGwuVElQT0xPQ0FDSU9OXG4gICAgICAgIE9SREVSIEJZIGwuTE9DQUNJT04gQVNDXG4gICAgICBgO1xuXG4gICAgICBjb25zdCBtYWluUXVlcnkgPSBgXG4gICAgICAgIFNFTEVDVCAqIEZST00gKFxuICAgICAgICAgIFNFTEVDVCBxLiosIFJPV05VTSBybiBGUk9NIChcbiAgICAgICAgICAgICR7YmFzZVF1ZXJ5fVxuICAgICAgICAgICkgcSBXSEVSRSBST1dOVU0gPD0gOm1heFJvd1xuICAgICAgICApIFdIRVJFIHJuID4gOm1pblJvd1xuICAgICAgYDtcblxuICAgICAgY29uc3QgY291bnRRdWVyeSA9IGBcbiAgICAgICAgU0VMRUNUIENPVU5UKCopIGFzIFRPVEFMIEZST00gKFxuICAgICAgICAgIFNFTEVDVCBsLklETE9DQUNJT05cbiAgICAgICAgICBGUk9NIERPQ0xPQ0FDSU9ORE9DVU1FTlRPIGxcbiAgICAgICAgICAke3doZXJlQ2xhdXNlfVxuICAgICAgICAgIEdST1VQIEJZIGwuSURMT0NBQ0lPTiwgbC5DT0RJR09MT0NBQ0lPTiwgbC5MT0NBQ0lPTiwgbC5USVBPTE9DQUNJT05cbiAgICAgICAgKVxuICAgICAgYDtcblxuICAgICAgY29uc3QgbWFpblF1ZXJ5UGFyYW1zID0ge1xuICAgICAgICAuLi5wYXJhbXMsXG4gICAgICAgIG1heFJvdzogb2Zmc2V0ICsgbGltaXQsXG4gICAgICAgIG1pblJvdzogb2Zmc2V0XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBbbG9jYXRpb25zLCBjb3VudFJvd3NdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICB0aGlzLmxvY2FjaW9uRG9jdW1lbnRvUmVwb3NpdG9yeS5xdWVyeShtYWluUXVlcnksIG1haW5RdWVyeVBhcmFtcyksXG4gICAgICAgIHRoaXMubG9jYWNpb25Eb2N1bWVudG9SZXBvc2l0b3J5LnF1ZXJ5KGNvdW50UXVlcnksIHBhcmFtcylcbiAgICAgIF0pO1xuXG4gICAgICBjb25zdCB0b3RhbCA9IE51bWJlcihjb3VudFJvd3M/LlswXT8uVE9UQUwgfHwgMCk7XG5cbiAgICAgIGNvbnN0IGxvY2F0aW9uc01hcCA9IGxvY2F0aW9ucy5tYXAoKGxvY2FjaW9uOiBhbnkpID0+ICh7XG4gICAgICAgIGlkTG9jYWNpb246IGxvY2FjaW9uLklETE9DQUNJT04sXG4gICAgICAgIGNvZGlnb0xvY2FjaW9uOiBsb2NhY2lvbi5DT0RJR09MT0NBQ0lPTixcbiAgICAgICAgbG9jYWNpb246IGxvY2FjaW9uLkxPQ0FDSU9OLFxuICAgICAgICB0aXBvTG9jYWNpb246IGxvY2FjaW9uLlRJUE9MT0NBQ0lPTixcbiAgICAgICAgdG90YWxEb2N1bWVudG9zOiBsb2NhY2lvbi5UT1RBTERPQ1VNRU5UT1MgfHwgMCxcbiAgICAgICAgbm9tYnJlOiBsb2NhY2lvbi5MT0NBQ0lPTixcbiAgICAgICAgY29kaWdvOiBsb2NhY2lvbi5DT0RJR09MT0NBQ0lPTlxuICAgICAgfSkpO1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAgICAgbG9jYWNpb25lczogbG9jYXRpb25zTWFwLFxuICAgICAgICB0b3RhbCxcbiAgICAgICAgcGFnZSxcbiAgICAgICAgbGltaXQsXG4gICAgICAgIHRvdGFsUGFnZXM6IE1hdGguY2VpbCh0b3RhbCAvIGxpbWl0KSxcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBSZXNwb25zZVV0aWwuc3VjY2VzcyhyZXNwb25zZSwgJ0xvY2FjaW9uZXMgb2J0ZW5pZGFzIGV4aXRvc2FtZW50ZScpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIHRocm93IFJlc3BvbnNlVXRpbC5pbnRlcm5hbEVycm9yKGVycm9yKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBnZXRMb2NhbGl0aWVzRGljdGlvbmFyeShmaWx0ZXJzOiBCdXNjYXJMb2NhbGlkYWRlc0R0bykge1xuICAgIHRyeSB7XG4gICAgICAvLyBQYWdpbmFjacOzbiAobWlzbW8gcGF0csOzbiBxdWUgc2VhcmNoRG9jdW1lbnRzKVxuICAgICAgY29uc3QgcGFnZSA9IE51bWJlcihmaWx0ZXJzPy5wYWdlIHx8IDEpO1xuICAgICAgY29uc3QgbGltaXQgPSBOdW1iZXIoZmlsdGVycz8ubGltaXQgfHwgMjApO1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gKHBhZ2UgLSAxKSAqIGxpbWl0O1xuXG4gICAgICAvLyBTYW5pdGl6YXIgZW50cmFkYTogcmVtb3ZlciBjYXJhY3RlcmVzIGVzcGVjaWFsZXMgcXVlIHBvZHLDrWFuIHVzYXJzZSBlbiBpbnllY2Npw7NuXG4gICAgICBjb25zdCBidXNxdWVkYSA9IGZpbHRlcnM/LmJ1c3F1ZWRhXG4gICAgICAgID8gZmlsdGVycy5idXNxdWVkYS50cmltKCkucmVwbGFjZSgvWyVfXS9nLCBcIlwiKS50b1VwcGVyQ2FzZSgpXG4gICAgICAgIDogbnVsbDtcblxuICAgICAgLy8gQ29uc3RydWlyIGNvbmRpY2lvbmVzIFdIRVJFXG4gICAgICBjb25zdCBjb25kaXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgY29uc3QgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuXG4gICAgICAvLyBDb25kaWNpb25lcyBzaWVtcHJlIGFwbGljYWRhczogQWN0aXZhID0gJ1MnXG4gICAgICBjb25kaXRpb25zLnB1c2goXCJsbC5hY3RpdmEgPSAnUydcIik7XG4gICAgICBjb25kaXRpb25zLnB1c2goXCIobHAuYWN0aXZhID0gJ1MnIE9SIGxwLmFjdGl2YSBJUyBOVUxMKVwiKTtcblxuICAgICAgaWYgKGJ1c3F1ZWRhKSB7XG4gICAgICAgIGNvbnN0IGJ1c3F1ZWRhTGlrZSA9IGAlJHtidXNxdWVkYX0lYDtcbiAgICAgICAgY29uZGl0aW9ucy5wdXNoKFxuICAgICAgICAgIGAoXG4gICAgICAgICAgVVBQRVIobGN2Lm5vbWJyZWNpdWRhZCkgTElLRSBVUFBFUig6cF9idXNxdWVkYV9saWtlKSBcbiAgICAgICAgICBPUiBVUFBFUihsY3YudmFsb3IpID0gVVBQRVIoOnBfYnVzcXVlZGFfZXhhY3QpXG4gICAgICAgICAgT1IgVVBQRVIobGwuZGVzY3JpcGNpb24pIExJS0UgVVBQRVIoOnBfYnVzcXVlZGFfbGlrZSlcbiAgICAgICAgICApXG4gICAgICAgICAgICBgXG4gICAgICAgICk7XG4gICAgICAgIHBhcmFtcy5wX2J1c3F1ZWRhX2xpa2UgPSBidXNxdWVkYUxpa2U7XG4gICAgICAgIHBhcmFtcy5wX2J1c3F1ZWRhX2V4YWN0ID0gYnVzcXVlZGE7XG4gICAgICB9XG4gICAgICAvKlxuICAgICAgICAgICAgT1IgVVBQRVIobGwuZGVzY3JpcGNpb24pIExJS0UgVVBQRVIoOnBfYnVzcXVlZGFfbGlrZSlcbiAgICAgICAgICAgIE9SIFVQUEVSKGxsLm5vbWJyZSkgTElLRSBVUFBFUig6cF9idXNxdWVkYV9saWtlKVxuICAgICAgICAgICAgT1IgVVBQRVIobGwuY29kaWdvKSA9IFVQUEVSKDpwX2J1c3F1ZWRhX2V4YWN0KVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAqL1xuICAgICAgY29uc3Qgd2hlcmVDbGF1c2UgPSBjb25kaXRpb25zLmxlbmd0aCA+IDAgPyBgV0hFUkUgJHtjb25kaXRpb25zLmpvaW4oJyBBTkQgJyl9YCA6ICcnO1xuICAgICAgXG4gICAgICAvLyBRdWVyeSBTUUwgYmFzZSBjb24gcGFyw6FtZXRyb3Mgbm9tYnJhZG9zXG4gICAgICBsZXQgc3FsID0gYFxuICAgICAgICBTRUxFQ1RcbiAgICAgICAgICBsbC5sb2NhY2lvbiBBUyBsb2NhY2lvbixcbiAgICAgICAgICBUUklNKGxsLmNvZGlnbykgQVMgbG9jYWNpb25Db2RpZ28sXG4gICAgICAgICAgVFJJTShsbC5kZXNjcmlwY2lvbikgQVMgZGVzY3JpcGNpb25Mb2NhY2lvbixcbiAgICAgICAgICBUUklNKGxwLkNvZGlnbykgQVMgcGFpc0NvZGlnbyxcbiAgICAgICAgICBUUklNKGxwLk5vbWJyZSkgQVMgcGFpc05vbWJyZSxcbiAgICAgICAgICBUUklNKGxwLkRlc2NyaXBjaW9uKSBBUyBwYWlzRGVzY3JpcGNpb24sXG4gICAgICAgICAgVFJJTShsY3YudmFsb3IpIEFTIGNvZGlnb1ZhbG9yLFxuICAgICAgICAgIFRSSU0obGwuZGVzY3JpcGNpb24pIHx8IFxuICAgICAgICAgIENBU0UgV0hFTiBsY3Yubm9tYnJlY2l1ZGFkIElTIE5PVCBOVUxMIFRIRU4gJywgJyB8fCBUUklNKGxjdi5ub21icmVjaXVkYWQpIEVMU0UgJycgRU5EIHx8XG4gICAgICAgICAgJywgJyB8fCBUUklNKE5WTChscC5ub21icmUsICdOL0QnKSkgfHwgJyAoJyB8fCBUUklNKE5WTChsY3YudmFsb3IsIE5WTChsbC5jb2RpZ28sICdOL0QnKSkpIHx8ICcpJyBBUyBkZXNjcmlwY2lvblJlc3VtZW5cbiAgICAgICAgRlJPTSBsb2NhY2lvbmVzLmxvY2xvY2FjaW9uIGxsXG4gICAgICAgIExFRlQgSk9JTiBsb2NhY2lvbmVzLmxvY3BhaXMgbHAgT04gbHAucGFpcyA9IGxsLnBhaXNcbiAgICAgICAgTEVGVCBKT0lOIGxvY2FjaW9uZXMubG9jY29kaWdvdmFsb3IgbGN2IE9OIGxjdi5sb2NhY2lvbiA9IGxsLmxvY2FjaW9uIEFORCBsY3YuYWN0aXZhID0gJ1MnXG4gICAgICAgICR7d2hlcmVDbGF1c2V9XG4gICAgICAgIE9SREVSIEJZIGxwLm5vbWJyZSBBU0NcbiAgICAgIGA7XG5cbiAgICAgIC8vIFBhZ2luYWNpw7NuIGNvbiBST1dOVU0gKG1pc21vIHBhdHLDs24gcXVlIHNlYXJjaERvY3VtZW50cylcbiAgICAgIGNvbnN0IHBhZ2luYXRlZFNxbCA9IGBcbiAgICAgICAgU0VMRUNUICogRlJPTSAoXG4gICAgICAgICAgU0VMRUNUIHEuKiwgUk9XTlVNIHJuIEZST00gKFxuICAgICAgICAgICAgJHtzcWx9XG4gICAgICAgICAgKSBxIFdIRVJFIFJPV05VTSA8PSAke29mZnNldCArIGxpbWl0fVxuICAgICAgICApIFdIRVJFIHJuID4gJHtvZmZzZXR9XG4gICAgICBgO1xuXG4gICAgICAvLyBPYnRlbmVyIGRyaXZlciB5IGVzY2FwYXIgcXVlcnkgY29uIHBhcsOhbWV0cm9zIChtaXNtbyBtw6l0b2RvIHF1ZSBlbiBkb2N1bWVudG9zLnNlcnZpY2UudHMpXG4gICAgICBjb25zdCBjb25uZWN0aW9uID0gdGhpcy5kb2N1bWVudG9CYXNlUmVwb3NpdG9yeS5tYW5hZ2VyLmNvbm5lY3Rpb247XG4gICAgICBjb25zdCBkcml2ZXIgPSBjb25uZWN0aW9uLmRyaXZlcjtcblxuICAgICAgY29uc3QgW2VzY2FwZWRRdWVyeSwgZXNjYXBlZFBhcmFtc10gPSBkcml2ZXIuZXNjYXBlUXVlcnlXaXRoUGFyYW1ldGVycyhcbiAgICAgICAgcGFnaW5hdGVkU3FsLFxuICAgICAgICBwYXJhbXMsXG4gICAgICAgIHt9XG4gICAgICApO1xuXG4gICAgICBjb25zdCByb3dzID0gYXdhaXQgdGhpcy5kb2N1bWVudG9CYXNlUmVwb3NpdG9yeS5xdWVyeShlc2NhcGVkUXVlcnksIGVzY2FwZWRQYXJhbXMpO1xuXG4gICAgICAvLyBDb250ZW8gdG90YWwgKHNpbiBwYWdpbmFjacOzbikgLSB1c2FyIHBhcsOhbWV0cm9zIHNpbiByb3dudW1cbiAgICAgIGNvbnN0IGNvdW50U3FsID0gYFNFTEVDVCBDT1VOVCgxKSBBUyBUT1RBTCBGUk9NICgke3NxbH0pYDtcbiAgICAgIGNvbnN0IFtjb3VudFF1ZXJ5LCBjb3VudFBhcmFtZXRlcnNdID0gZHJpdmVyLmVzY2FwZVF1ZXJ5V2l0aFBhcmFtZXRlcnMoXG4gICAgICAgIGNvdW50U3FsLFxuICAgICAgICBwYXJhbXMsXG4gICAgICAgIHt9XG4gICAgICApO1xuICAgICAgY29uc3QgY291bnRSb3dzID0gYXdhaXQgdGhpcy5kb2N1bWVudG9CYXNlUmVwb3NpdG9yeS5xdWVyeShcbiAgICAgICAgY291bnRRdWVyeSxcbiAgICAgICAgY291bnRQYXJhbWV0ZXJzXG4gICAgICApO1xuICAgICAgY29uc3QgdG90YWwgPSBOdW1iZXIoY291bnRSb3dzPy5bMF0/LlRPVEFMIHx8IDApO1xuXG4gICAgICBjb25zdCBsb2NhbGl0aWVzID0gcm93cy5tYXAoKHJvdzogYW55KSA9PiB7XG4gICAgICAgIGNvbnN0IHRyaW1WYWx1ZSA9ICh2YWw6IGFueSkgPT4ge1xuICAgICAgICAgIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHJldHVybiBudWxsO1xuICAgICAgICAgIHJldHVybiBTdHJpbmcodmFsKS50cmltKCkgfHwgbnVsbDtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbG9jYWNpb246IHJvdy5MT0NBQ0lPTiA/PyByb3cubG9jYWNpb24sXG4gICAgICAgICAgbG9jYWNpb25Db2RpZ286IHRyaW1WYWx1ZShyb3cuTE9DQUNJT05DT0RJR08gPz8gcm93LmxvY2FjaW9uQ29kaWdvKSxcbiAgICAgICAgICBkZXNjcmlwY2lvbkxvY2FjaW9uOiB0cmltVmFsdWUocm93LkRFU0NSSVBDSU9OTE9DQUNJT04gPz8gcm93LmRlc2NyaXBjaW9uTG9jYWNpb24pLFxuICAgICAgICAgIHBhaXNDb2RpZ286IHRyaW1WYWx1ZShyb3cuUEFJU0NPRElHTyA/PyByb3cucGFpc0NvZGlnbyksXG4gICAgICAgICAgcGFpc05vbWJyZTogdHJpbVZhbHVlKHJvdy5QQUlTTk9NQlJFID8/IHJvdy5wYWlzTm9tYnJlKSxcbiAgICAgICAgICBwYWlzRGVzY3JpcGNpb246IHRyaW1WYWx1ZShyb3cuUEFJU0RFU0NSSVBDSU9OID8/IHJvdy5wYWlzRGVzY3JpcGNpb24pLFxuICAgICAgICAgIGNvZGlnb1ZhbG9yOiB0cmltVmFsdWUocm93LkNPRElHT1ZBTE9SID8/IHJvdy5jb2RpZ29WYWxvciksXG4gICAgICAgICAgZGVzY3JpcGNpb25SZXN1bWVuOiB0cmltVmFsdWUocm93LkRFU0NSSVBDSU9OUkVTVU1FTiA/PyByb3cuZGVzY3JpcGNpb25SZXN1bWVuKSxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAgICAgbG9jYWxpdGllcyxcbiAgICAgICAgdG90YWwsXG4gICAgICAgIHBhZ2UsXG4gICAgICAgIGxpbWl0LFxuICAgICAgICB0b3RhbFBhZ2VzOiBNYXRoLmNlaWwodG90YWwgLyBsaW1pdCksXG4gICAgICAgIGZpbHRlcnM6IHtcbiAgICAgICAgICBidXNxdWVkYTogZmlsdGVycz8uYnVzcXVlZGEgPz8gbnVsbCxcbiAgICAgICAgfSxcbiAgICAgICAgbWVzc2FnZTogXCJMb2NhbGlkYWRlcyBvYnRlbmlkYXMgZXhpdG9zYW1lbnRlXCIsXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gUmVzcG9uc2VVdGlsLnN1Y2Nlc3MoXG4gICAgICAgIHJlc3BvbnNlLFxuICAgICAgICBcIkxvY2FsaWRhZGVzIG9idGVuaWRhcyBleGl0b3NhbWVudGVcIixcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgdGhyb3cgUmVzcG9uc2VVdGlsLmludGVybmFsRXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGdldFJvbGVzUGFydGljaXBhdGlvbigpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcXVlcnkgPSBgXG4gICAgICAgIFNFTEVDVCBESVNUSU5DVCBcbiAgICAgICAgICBST0xcbiAgICAgICAgRlJPTSBET0NQQVJUSUNJUEFDSU9OIFxuICAgICAgICBXSEVSRSBBQ1RJVkEgPSAnUydcbiAgICAgICAgICBBTkQgTk9NQlJFUEFSVElDSVBBTlRFIElTIE5PVCBOVUxMXG4gICAgICAgICAgQU5EIExFTkdUSChOT01CUkVQQVJUSUNJUEFOVEUpID4gMFxuICAgICAgICBHUk9VUCBCWSBST0xcbiAgICAgICAgT1JERVIgQlkgUk9MIEFTQ1xuICAgICAgYDtcblxuICAgICAgY29uc3Qgcm9sZXMgPSBhd2FpdCB0aGlzLnBhcnRpY2lwYWNpb25SZXBvc2l0b3J5LnF1ZXJ5KHF1ZXJ5KTtcblxuICAgICAgY29uc3Qgcm9sZXNNYXAgPSByb2xlcy5tYXAoKHJvbDogYW55KSA9PiAoe1xuICAgICAgICByb2w6IHJvbC5ST0wsXG4gICAgICAgIHRvdGFsUGFydGljaXBhbnRlczogcm9sLlRPVEFMX1BBUlRJQ0lQQU5URVMsXG4gICAgICAgIGNvZGlnbzogcm9sLlJPTCxcbiAgICAgICAgbm9tYnJlOiByb2wuUk9MXG4gICAgICB9KSk7XG5cbiAgICAgIHJldHVybiBSZXNwb25zZVV0aWwuc3VjY2Vzcyhyb2xlc01hcCwgJ1JvbGVzIGRlIHBhcnRpY2lwYWNpw7NuIG9idGVuaWRvcyBleGl0b3NhbWVudGUnKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICB0aHJvdyBSZXNwb25zZVV0aWwuaW50ZXJuYWxFcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cblxuICAvLyBNw6l0b2RvcyBwYXJhIERvY1RpcG9GZWNoYVxuICBhc3luYyBnZXREYXRlVHlwZXNEb2ModHlwZURvY3VtZW50ID0gJ01GVE9DJykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBkYXRlX3R5cGUgPSBhd2FpdCB0aGlzLnRpcG9GZWNoYVJlcG9zaXRvcnkuZmluZCh7XG4gICAgICAgIHdoZXJlOiB7IFxuICAgICAgICAgIGFjdGl2YTogXCJTXCIsXG4gICAgICAgICAgY29kaWdvOiBJbihcbiAgICAgICAgICAgIHR5cGVEb2N1bWVudCA9PT0gJ01GVE9DJyA/XG4gICAgICAgICAgICBbXCJGQVJSSUJPXCIsIFwiRlpBUlBFXCIsIFwiRkVNXCIsIFwiRkVERVNQRUdVRVwiLFwiRkVDQUNFUFRBXCJdIDpcbiAgICAgICAgICAgIFtcIkZaQVJQRVwiLCBcIkZFTVwiLFwiRkVDQUNFUFRBXCJdXG4gICAgICAgICAgKVxuICAgICAgICB9LFxuICAgICAgICBzZWxlY3Q6IHtcbiAgICAgICAgICBjb2RpZ286IHRydWUsXG4gICAgICAgICAgZGVzY3JpcGNpb246IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIG9yZGVyOiB7IGNvZGlnbzogXCJBU0NcIiB9LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgICBkYXRlVHlwZTogZGF0ZV90eXBlLFxuICAgICAgICB0b3RhbDogZGF0ZV90eXBlLmxlbmd0aCxcbiAgICAgICAgbWVzc2FnZTogXCJUaXBvcyBkZSBmZWNoYSBvYnRlbmlkb3MgZXhpdG9zYW1lbnRlXCIsXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gUmVzcG9uc2VVdGlsLnN1Y2Nlc3MoXG4gICAgICAgIHJlc3BvbnNlLFxuICAgICAgICBcIlRpcG9zIGRlIGZlY2hhIG9idGVuaWRvcyBleGl0b3NhbWVudGVcIlxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICB0aHJvdyBSZXNwb25zZVV0aWwuaW50ZXJuYWxFcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgLy8gTcOpdG9kb3MgcGFyYSBEb2NTdGF0dXNUeXBlXG4gIGFzeW5jIGdldFN0YXR1c1R5cGVzRG9jKGRvY3VtZW50VHlwZSA9ICdNRlRPQycpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3RhdHVzX3R5cGVzID0gYXdhaXQgdGhpcy50aXBvRXN0YWRvUmVwb3NpdG9yeS5maW5kKHtcbiAgICAgICAgd2hlcmU6IHsgXG4gICAgICAgICAgZG9jdW1lbnRfdHlwZTogZG9jdW1lbnRUeXBlLFxuICAgICAgICAgIGFjdGl2ZTogJ1MnLFxuICAgICAgICAgIGNvZGU6IEluKFxuICAgICAgICAgICAgZG9jdW1lbnRUeXBlID09PSAnR1RJTUUnID8gXG4gICAgICAgICAgICBbJ0FDUCcsICdBQ0wnLCAnQU5VJywgJ0NNUCcsICdMSUJSRScsICdWSVMnLCAnQ09OIE1BUkNBJ10gOlxuICAgICAgICAgICAgWydBQ1AnLCAnQUNMJywgJ0FOVScsICdWSVMnLCAnQ01QJ11cbiAgICAgICAgICApXG4gICAgICAgIH0sXG4gICAgICAgIHNlbGVjdDoge1xuICAgICAgICAgIG5hbWU6IHRydWUsXG4gICAgICAgICAgY29kZTogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgb3JkZXI6IHsgY29kZTogJ0FTQycgfSxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBtYXBwZWRfc3RhdHVzX3R5cGVzID0gc3RhdHVzX3R5cGVzLm1hcCgoZSkgPT4gKHtcbiAgICAgICAgZG9jdW1lbnRUeXBlOiBlLmRvY3VtZW50X3R5cGUsXG4gICAgICAgIGNvZGU6IGUuY29kZSxcbiAgICAgICAgbmFtZTogZS5uYW1lLFxuICAgICAgICBkZXNjcmlwdGlvbjogZS5kZXNjcmlwdGlvbixcbiAgICAgICAgYWN0aXZlOiBlLmFjdGl2ZSxcbiAgICAgICAgYWN0aXZlRGF0ZTogZS5hY3RpdmVfZGF0ZSxcbiAgICAgICAgaW5hY3RpdmVEYXRlOiBlLmluYWN0aXZlX2RhdGUsXG4gICAgICB9KSk7XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgICBzdGF0dXNUeXBlczogbWFwcGVkX3N0YXR1c190eXBlcyxcbiAgICAgICAgdG90YWw6IG1hcHBlZF9zdGF0dXNfdHlwZXMubGVuZ3RoLFxuICAgICAgICBtZXNzYWdlOiAnVGlwb3MgZGUgZXN0YWRvIG9idGVuaWRvcyBleGl0b3NhbWVudGUnLFxuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFJlc3BvbnNlVXRpbC5zdWNjZXNzKHJlc3BvbnNlLCAnVGlwb3MgZGUgZXN0YWRvIG9idGVuaWRvcyBleGl0b3NhbWVudGUnKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICB0aHJvdyBSZXNwb25zZVV0aWwuaW50ZXJuYWxFcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgLy8gTcOpdG9kb3MgcGFyYSBvYnRlbmVyIGVtaXNvcmVzIGRlc2RlIFBFUl9QRVJTT05BXG4gIGFzeW5jIGdldEVtaXR0ZXJzKCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBiYXNlX3F1ZXJ5ID0gYFxuICAgICAgICBTRUxFQ1QgRElTVElOQ1QgXG4gICAgICAgICAgZHAuSURQRVJTT05BUEFSVElDSVBBTlRFLFxuICAgICAgICAgIHBwLk5PTUJSRVxuICAgICAgICBGUk9NIERPQ1VNRU5UT1MuRE9DUEFSVElDSVBBQ0lPTiBkcFxuICAgICAgICBKT0lOIERPQ1VNRU5UT1MuRE9DUk9MIGRyIE9OIGRwLlJPTCA9IGRyLkNPRElHT1xuICAgICAgICBKT0lOIEFETVBFUlNPTkFTLlBFUl9QRVJTT05BIHBwIE9OIHBwLklEID0gZHAuSURQRVJTT05BUEFSVElDSVBBTlRFXG4gICAgICAgIFdIRVJFIGRwLlJPTCA9ICdFTUknXG4gICAgICAgICAgQU5EIGRwLkFDVElWQSA9ICdTJ1xuICAgICAgICBPUkRFUiBCWSBwcC5OT01CUkUgQVNDXG4gICAgICBgO1xuICAgICAgXG4gICAgICBjb25zdCBlbWl0dGVyc19yYXcgPSBhd2FpdCB0aGlzLnBhcnRpY2lwYWNpb25SZXBvc2l0b3J5LnF1ZXJ5KGJhc2VfcXVlcnkpO1xuXG4gICAgICBjb25zdCBtYXBwZWRfZW1pdHRlcnMgPSBlbWl0dGVyc19yYXcubWFwKChlbWl0dGVyOiBhbnkpID0+ICh7XG4gICAgICAgIGlkUGVyc29uYVBhcnRpY2lwYW50ZTogZW1pdHRlci5JRFBFUlNPTkFQQVJUSUNJUEFOVEUsXG4gICAgICAgIG5vbWJyZTogZW1pdHRlci5OT01CUkUsXG4gICAgICAgIGNvZGlnbzogZW1pdHRlci5JRFBFUlNPTkFQQVJUSUNJUEFOVEUgfHwgbnVsbCxcbiAgICAgIH0pKTtcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICAgIGVtaXR0ZXJzOiBtYXBwZWRfZW1pdHRlcnMsXG4gICAgICAgIHRvdGFsOiBtYXBwZWRfZW1pdHRlcnMubGVuZ3RoLFxuICAgICAgICBtZXNzYWdlOiAnRW1pc29yZXMgb2J0ZW5pZG9zIGV4aXRvc2FtZW50ZScsXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gUmVzcG9uc2VVdGlsLnN1Y2Nlc3MocmVzcG9uc2UsICdFbWlzb3JlcyBvYnRlbmlkb3MgZXhpdG9zYW1lbnRlJyk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgdGhyb3cgUmVzcG9uc2VVdGlsLmludGVybmFsRXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIC8vIE3DqXRvZG9zIHBhcmEgb2J0ZW5lciBlbWlzb3JlcyBjb24gZmlsdHJvcyAoYsO6c3F1ZWRhIHkgcGFnaW5hY2nDs24pXG4gIGFzeW5jIGdldEVtaXR0ZXJzV2l0aEZpbHRlcnMoc2VhcmNoVGVybTogc3RyaW5nID0gJycsIHBhZ2U6IG51bWJlciA9IDEsIGxpbWl0OiBudW1iZXIgPSA1MCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAocGFnZSAtIDEpICogbGltaXQ7XG4gICAgICBcbiAgICAgIGNvbnN0IHNlYXJjaEZpbHRlciA9IHNlYXJjaFRlcm0gXG4gICAgICAgID8gYEFORCBVUFBFUihwcC5OT01CUkUpIExJS0UgVVBQRVIoJyUke3NlYXJjaFRlcm19JScpYFxuICAgICAgICA6ICcnO1xuICAgICAgXG4gICAgICBjb25zdCBiYXNlUXVlcnkgPSBgXG4gICAgICAgIFNFTEVDVCBESVNUSU5DVCBcbiAgICAgICAgICBkcC5JRFBFUlNPTkFQQVJUSUNJUEFOVEUsXG4gICAgICAgICAgcHAuTk9NQlJFXG4gICAgICAgIEZST00gRE9DVU1FTlRPUy5ET0NQQVJUSUNJUEFDSU9OIGRwXG4gICAgICAgIEpPSU4gRE9DVU1FTlRPUy5ET0NST0wgZHIgT04gZHAuUk9MID0gZHIuQ09ESUdPXG4gICAgICAgIEpPSU4gQURNUEVSU09OQVMuUEVSX1BFUlNPTkEgcHAgT04gcHAuSUQgPSBkcC5JRFBFUlNPTkFQQVJUSUNJUEFOVEVcbiAgICAgICAgV0hFUkUgZHAuUk9MID0gJ0VNSSdcbiAgICAgICAgICBBTkQgZHAuQUNUSVZBID0gJ1MnXG4gICAgICAgICAgJHtzZWFyY2hGaWx0ZXJ9XG4gICAgICAgIE9SREVSIEJZIHBwLk5PTUJSRSBBU0NcbiAgICAgIGA7XG4gICAgICBcbiAgICAgIGNvbnN0IHBhZ2luYXRlZFF1ZXJ5ID0gYFxuICAgICAgICBTRUxFQ1QgKiBGUk9NIChcbiAgICAgICAgICBTRUxFQ1QgcS4qLCBST1dOVU0gcm4gRlJPTSAoXG4gICAgICAgICAgICAke2Jhc2VRdWVyeX1cbiAgICAgICAgICApIHEgV0hFUkUgUk9XTlVNIDw9ICR7b2Zmc2V0ICsgbGltaXR9XG4gICAgICAgICkgV0hFUkUgcm4gPiAke29mZnNldH1cbiAgICAgIGA7XG5cbiAgICAgIGNvbnN0IGNvdW50UXVlcnkgPSBgU0VMRUNUIENPVU5UKDEpIEFTIFRPVEFMIEZST00gKCR7YmFzZVF1ZXJ5fSlgO1xuICAgICAgXG4gICAgICBjb25zdCBbZW1pdHRlcnMsIGNvdW50Um93c10gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgIHRoaXMucGFydGljaXBhY2lvblJlcG9zaXRvcnkucXVlcnkocGFnaW5hdGVkUXVlcnkpLFxuICAgICAgICB0aGlzLnBhcnRpY2lwYWNpb25SZXBvc2l0b3J5LnF1ZXJ5KGNvdW50UXVlcnkpXG4gICAgICBdKTtcblxuICAgICAgY29uc3QgdG90YWwgPSBOdW1iZXIoY291bnRSb3dzPy5bMF0/LlRPVEFMIHx8IDApO1xuXG4gICAgICBjb25zdCBlbWl0dGVyc01hcCA9IGVtaXR0ZXJzLm1hcCgoZW1pdHRlcjogYW55KSA9PiAoe1xuICAgICAgICBpZFBlcnNvbmFQYXJ0aWNpcGFudGU6IGVtaXR0ZXIuSURQRVJTT05BUEFSVElDSVBBTlRFLFxuICAgICAgICBub21icmU6IGVtaXR0ZXIuTk9NQlJFLFxuICAgICAgICBjb2RpZ286IGVtaXR0ZXIuSURQRVJTT05BUEFSVElDSVBBTlRFIHx8IG51bGwsXG4gICAgICB9KSk7XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgICBlbWl0dGVyczogZW1pdHRlcnNNYXAsXG4gICAgICAgIHRvdGFsLFxuICAgICAgICBwYWdlLFxuICAgICAgICBsaW1pdCxcbiAgICAgICAgdG90YWxQYWdlczogTWF0aC5jZWlsKHRvdGFsIC8gbGltaXQpLFxuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFJlc3BvbnNlVXRpbC5zdWNjZXNzKHJlc3BvbnNlLCAnRW1pc29yZXMgb2J0ZW5pZG9zIGV4aXRvc2FtZW50ZScpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIHRocm93IFJlc3BvbnNlVXRpbC5pbnRlcm5hbEVycm9yKGVycm9yKTtcbiAgICB9XG4gIH1cblxuICAvLyBNw6l0b2RvcyBwYXJhIG9idGVuZXIgcGFydGljaXBhbnRlcyBwb3Igcm9sIHVzYW5kbyBQRVJfUEVSU09OQVxuICBhc3luYyBnZXRQYXJ0aWNpcGFudHNCeVJvbGVXaXRoUGVyc29uKHJvbDogc3RyaW5nLCBzZWFyY2hUZXJtOiBzdHJpbmcgPSAnJywgcGFnZTogbnVtYmVyID0gMSwgbGltaXQ6IG51bWJlciA9IDUwKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghcm9sKSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgICAgIHBhcnRpY2lwYW50czogW10sXG4gICAgICAgICAgdG90YWw6IDAsXG4gICAgICAgICAgcGFnZTogMSxcbiAgICAgICAgICBsaW1pdDogNTAsXG4gICAgICAgICAgdG90YWxQYWdlczogMCxcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFJlc3BvbnNlVXRpbC5zdWNjZXNzKHJlc3BvbnNlLCAnTm8gc2UgZXNwZWNpZmljw7Mgcm9sJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG9mZnNldCA9IChwYWdlIC0gMSkgKiBsaW1pdDtcbiAgICAgIFxuICAgICAgY29uc3Qgc2VhcmNoRmlsdGVyID0gc2VhcmNoVGVybSBcbiAgICAgICAgPyBgQU5EIFVQUEVSKHBwLk5PTUJSRSkgTElLRSBVUFBFUignJSR7c2VhcmNoVGVybX0lJylgXG4gICAgICAgIDogJyc7XG4gICAgICBcbiAgICAgIGNvbnN0IGJhc2VRdWVyeSA9IGBcbiAgICAgICAgU0VMRUNUIERJU1RJTkNUIFxuICAgICAgICAgIGRwLklEUEVSU09OQVBBUlRJQ0lQQU5URSxcbiAgICAgICAgICBwcC5OT01CUkVcbiAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRPQ1BBUlRJQ0lQQUNJT04gZHBcbiAgICAgICAgSk9JTiBET0NVTUVOVE9TLkRPQ1JPTCBkciBPTiBkcC5ST0wgPSBkci5DT0RJR09cbiAgICAgICAgSk9JTiBBRE1QRVJTT05BUy5QRVJfUEVSU09OQSBwcCBPTiBwcC5JRCA9IGRwLklEUEVSU09OQVBBUlRJQ0lQQU5URVxuICAgICAgICBXSEVSRSBkcC5ST0wgPSA6cm9sXG4gICAgICAgICAgQU5EIGRwLkFDVElWQSA9ICdTJ1xuICAgICAgICAgICR7c2VhcmNoRmlsdGVyfVxuICAgICAgICBPUkRFUiBCWSBwcC5OT01CUkUgQVNDXG4gICAgICBgO1xuICAgICAgXG4gICAgICBjb25zdCBwYWdpbmF0ZWRRdWVyeSA9IGBcbiAgICAgICAgU0VMRUNUICogRlJPTSAoXG4gICAgICAgICAgU0VMRUNUIHEuKiwgUk9XTlVNIHJuIEZST00gKFxuICAgICAgICAgICAgJHtiYXNlUXVlcnl9XG4gICAgICAgICAgKSBxIFdIRVJFIFJPV05VTSA8PSA6bWF4Um93XG4gICAgICAgICkgV0hFUkUgcm4gPiA6bWluUm93XG4gICAgICBgO1xuXG4gICAgICBjb25zdCBjb3VudFF1ZXJ5ID0gYFxuICAgICAgICBTRUxFQ1QgQ09VTlQoMSkgQVMgVE9UQUwgRlJPTSAoXG4gICAgICAgICAgU0VMRUNUIERJU1RJTkNUIFxuICAgICAgICAgICAgZHAuSURQRVJTT05BUEFSVElDSVBBTlRFXG4gICAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRPQ1BBUlRJQ0lQQUNJT04gZHBcbiAgICAgICAgICBKT0lOIERPQ1VNRU5UT1MuRE9DUk9MIGRyIE9OIGRwLlJPTCA9IGRyLkNPRElHT1xuICAgICAgICAgIEpPSU4gQURNUEVSU09OQVMuUEVSX1BFUlNPTkEgcHAgT04gcHAuSUQgPSBkcC5JRFBFUlNPTkFQQVJUSUNJUEFOVEVcbiAgICAgICAgICBXSEVSRSBkcC5ST0wgPSAnJHtyb2x9J1xuICAgICAgICAgICAgQU5EIGRwLkFDVElWQSA9ICdTJ1xuICAgICAgICAgICAgJHtzZWFyY2hGaWx0ZXJ9XG4gICAgICAgIClcbiAgICAgIGA7XG4gICAgICBcbiAgICAgIGNvbnN0IHBhZ2luYXRlZFF1ZXJ5V2l0aFBhcmFtcyA9IHBhZ2luYXRlZFF1ZXJ5LnJlcGxhY2UoJzpyb2wnLCBgJyR7cm9sfSdgKS5yZXBsYWNlKCc6bWF4Um93JywgU3RyaW5nKG9mZnNldCArIGxpbWl0KSkucmVwbGFjZSgnOm1pblJvdycsIFN0cmluZyhvZmZzZXQpKTtcblxuICAgICAgY29uc3QgW3BhcnRpY2lwYW50cywgY291bnRSb3dzXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgdGhpcy5wYXJ0aWNpcGFjaW9uUmVwb3NpdG9yeS5xdWVyeShwYWdpbmF0ZWRRdWVyeVdpdGhQYXJhbXMpLFxuICAgICAgICB0aGlzLnBhcnRpY2lwYWNpb25SZXBvc2l0b3J5LnF1ZXJ5KGNvdW50UXVlcnkpXG4gICAgICBdKTtcblxuICAgICAgY29uc3QgdG90YWwgPSBOdW1iZXIoY291bnRSb3dzPy5bMF0/LlRPVEFMIHx8IDApO1xuXG4gICAgICBjb25zdCBwYXJ0aWNpcGFudHNNYXAgPSBwYXJ0aWNpcGFudHMubWFwKChwYXJ0aWNpcGFudDogYW55KSA9PiAoe1xuICAgICAgICBpZFBlcnNvbmFQYXJ0aWNpcGFudGU6IHBhcnRpY2lwYW50LklEUEVSU09OQVBBUlRJQ0lQQU5URSxcbiAgICAgICAgbm9tYnJlOiBwYXJ0aWNpcGFudC5OT01CUkUsXG4gICAgICAgIGNvZGlnbzogcGFydGljaXBhbnQuSURQRVJTT05BUEFSVElDSVBBTlRFIHx8IG51bGwsXG4gICAgICB9KSk7XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgICBwYXJ0aWNpcGFudHM6IHBhcnRpY2lwYW50c01hcCxcbiAgICAgICAgdG90YWwsXG4gICAgICAgIHBhZ2UsXG4gICAgICAgIGxpbWl0LFxuICAgICAgICB0b3RhbFBhZ2VzOiBNYXRoLmNlaWwodG90YWwgLyBsaW1pdCksXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gUmVzcG9uc2VVdGlsLnN1Y2Nlc3MocmVzcG9uc2UsICdQYXJ0aWNpcGFudGVzIG9idGVuaWRvcyBleGl0b3NhbWVudGUnKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICB0aHJvdyBSZXNwb25zZVV0aWwuaW50ZXJuYWxFcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgLy8gTcOpdG9kbyBwYXJhIGxpc3RhciBhZHVhbmFzIGRlbCBzY2hlbWEgRElOXG4gIGFzeW5jIGdldEFkdWFuYXMoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGFkdWFuYXMgPSBhd2FpdCB0aGlzLmRpbkFkdWFuUmVwb3NpdG9yeS5maW5kKHtcbiAgICAgICAgb3JkZXI6IHsgY29kQWR1OiAnQVNDJyB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICAgIGFkdWFuYXMsXG4gICAgICAgIHRvdGFsOiBhZHVhbmFzLmxlbmd0aCxcbiAgICAgICAgbWVzc2FnZTogJ0FkdWFuYXMgb2J0ZW5pZGFzIGV4aXRvc2FtZW50ZSdcbiAgICAgIH07XG4gICAgICBcbiAgICAgIHJldHVybiBSZXNwb25zZVV0aWwuc3VjY2VzcyhyZXNwb25zZSwgJ0FkdWFuYXMgb2J0ZW5pZGFzIGV4aXRvc2FtZW50ZScpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIHRocm93IFJlc3BvbnNlVXRpbC5pbnRlcm5hbEVycm9yKGVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuIl19