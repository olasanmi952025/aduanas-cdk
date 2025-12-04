import {
  DocTipoLocacion,
  DocRoles,
  DocLocacionDocumento,
  DocParticipacion,
  DinAduan,
} from './entities';
import { BuscarLocalidadesDto, ObtenerLocacionesDto } from './dto/dictionaries.dto';
import { DataSource, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpException, Injectable } from '@nestjs/common';
import { DocTipoFecha } from './entities/doc-tipo-fecha.entity';
import { DocStatusType } from './entities/doc-tipo-estados.entity';
import { ResponseUtil } from '../../shared/utils/response.util';
import { DocDocumentoBase } from '../documentos/entities/doc-documento-base.entity';

type RawTypeLocationRow = {
  CODIGO?: string;
  codigo?: string;
  DESCRIPCION?: string;
  descripcion?: string;
  ACTIVA?: string;
  activa?: string;
  FECHAACTIVA?: Date;
  fechaactiva?: Date;
  fechaActiva?: Date;
  FECHADESACTIVA?: Date;
  fechadesactiva?: Date;
  fechaDesactiva?: Date;
};

type RawLocalityRow = {
  tipoCodigo: string | null;
  locacion: number;
  codigoLocacion: string;
  descripcionLocacion: string;
  codigoPais: string | null;
  nombrePais: string | null;
  codigoValor: string | null;
  nombreCiudad: string | null;
  descripcionResumen: string;
};

@Injectable()
export class DictionariesService {
  constructor(
    @InjectRepository(DocTipoFecha)
    private readonly tipoFechaRepository: Repository<DocTipoFecha>,
    @InjectRepository(DocStatusType)
    private readonly tipoEstadoRepository: Repository<DocStatusType>,
    @InjectRepository(DocDocumentoBase)
    private readonly documentoBaseRepository: Repository<DocDocumentoBase>,
    @InjectRepository(DocTipoLocacion)
    private readonly tipoLocacionRepository: Repository<DocTipoLocacion>,
    @InjectRepository(DocRoles)
    private readonly rolesRepository: Repository<DocRoles>,
    @InjectRepository(DocLocacionDocumento)
    private readonly locacionDocumentoRepository: Repository<DocLocacionDocumento>,
    @InjectRepository(DocParticipacion)
    private readonly participacionRepository: Repository<DocParticipacion>,
    @InjectRepository(DinAduan)
    private readonly dinAduanRepository: Repository<DinAduan>,
    private readonly dataSource: DataSource,
  ) {}

  async getTypeLocations(documentType: string) {
    try {
      const sanitizedDocumentType = String(documentType ?? '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .trim()
        .toUpperCase();

      if (!sanitizedDocumentType) {
        throw ResponseUtil.badRequest('documentType is required');
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

      const params: any = {
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
      const [escapedQuery, escapedParams] = driver.escapeQueryWithParameters(
        sql,
        params,
        {}
      );

      const rows = await this.dataSource.query(escapedQuery, escapedParams) as RawTypeLocationRow[];

      const mapped = rows.map((row) => ({
        codigo: row.CODIGO ?? row.codigo ?? '',
        descripcion: row.DESCRIPCION ?? row.descripcion ?? '',
      }));

      const payload = {
        documentType: sanitizedDocumentType,
        typeLocations: mapped,
        total: mapped.length,
      };

      return ResponseUtil.success(
        payload,
        'Tipos de locación obtenidos exitosamente',
      );
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw ResponseUtil.internalError(error);
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
      
      return ResponseUtil.success(response, 'Roles obtenidos exitosamente');
    } catch (error: any) {
      throw ResponseUtil.internalError(error);
    }
  }

  async getUsersCreators(onlyActive: boolean = true, searchTerm: string = '', page: number = 1, limit: number = 20) {
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

    const usersMap = users.map((usuario: any) => ({
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

  async getLocations(filters: ObtenerLocacionesDto) {
    try {
      const page = Math.max(1, parseInt(String(filters.page || 1)));
      const limit = Math.min(100, Math.max(1, parseInt(String(filters.limit || 50))));
      const offset = (page - 1) * limit;

      const searchTerm = filters.searchTerm ? 
        String(filters.searchTerm).replace(/[^a-zA-Z0-9\s\-_\.]/g, '').trim() : null;

      const typeLocation = filters.tipoLocacion ? 
        String(filters.tipoLocacion).replace(/[^a-zA-Z0-9]/g, '') : null;

      const conditions: string[] = ["l.ACTIVA = :activa"];
      const params: any = { activa: 'S' };

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

      const locationsMap = locations.map((locacion: any) => ({
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

      return ResponseUtil.success(response, 'Locaciones obtenidas exitosamente');
    } catch (error: any) {
      throw ResponseUtil.internalError(error);
    }
  }

  async getLocalitiesDictionary(filters: BuscarLocalidadesDto) {
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
      const conditions: string[] = [];
      const params: Record<string, unknown> = {};

      // Condiciones siempre aplicadas: Activa = 'S'
      conditions.push("ll.activa = 'S'");
      conditions.push("(lp.activa = 'S' OR lp.activa IS NULL)");

      if (busqueda) {
        const busquedaLike = `%${busqueda}%`;
        conditions.push(
          `(
          UPPER(lcv.nombreciudad) LIKE UPPER(:p_busqueda_like) 
          OR UPPER(lcv.valor) = UPPER(:p_busqueda_exact)
          OR UPPER(ll.descripcion) LIKE UPPER(:p_busqueda_like)
          )
            `
        );
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

      const [escapedQuery, escapedParams] = driver.escapeQueryWithParameters(
        paginatedSql,
        params,
        {}
      );

      const rows = await this.documentoBaseRepository.query(escapedQuery, escapedParams);

      // Conteo total (sin paginación) - usar parámetros sin rownum
      const countSql = `SELECT COUNT(1) AS TOTAL FROM (${sql})`;
      const [countQuery, countParameters] = driver.escapeQueryWithParameters(
        countSql,
        params,
        {}
      );
      const countRows = await this.documentoBaseRepository.query(
        countQuery,
        countParameters
      );
      const total = Number(countRows?.[0]?.TOTAL || 0);

      const localities = rows.map((row: any) => {
        const trimValue = (val: any) => {
          if (val === null || val === undefined) return null;
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

      return ResponseUtil.success(
        response,
        "Localidades obtenidas exitosamente",
      );
    } catch (error: any) {
      throw ResponseUtil.internalError(error);
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

      const rolesMap = roles.map((rol: any) => ({
        rol: rol.ROL,
        totalParticipantes: rol.TOTAL_PARTICIPANTES,
        codigo: rol.ROL,
        nombre: rol.ROL
      }));

      return ResponseUtil.success(rolesMap, 'Roles de participación obtenidos exitosamente');
    } catch (error: any) {
      throw ResponseUtil.internalError(error);
    }
  }


  // Métodos para DocTipoFecha
  async getDateTypesDoc(typeDocument = 'MFTOC') {
    try {
      const date_type = await this.tipoFechaRepository.find({
        where: { 
          activa: "S",
          codigo: In(
            typeDocument === 'MFTOC' ?
            ["FARRIBO", "FZARPE", "FEM", "FEDESPEGUE","FECACEPTA"] :
            ["FZARPE", "FEM","FECACEPTA"]
          )
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

      return ResponseUtil.success(
        response,
        "Tipos de fecha obtenidos exitosamente"
      );
    } catch (error: any) {
      throw ResponseUtil.internalError(error);
    }
  }

  // Métodos para DocStatusType
  async getStatusTypesDoc(documentType = 'MFTOC') {
    try {
      const status_types = await this.tipoEstadoRepository.find({
        where: { 
          document_type: documentType,
          active: 'S',
          code: In(
            documentType === 'GTIME' ? 
            ['ACP', 'ACL', 'ANU', 'CMP', 'LIBRE', 'VIS', 'CON MARCA'] :
            ['ACP', 'ACL', 'ANU', 'VIS', 'CMP']
          )
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

      return ResponseUtil.success(response, 'Tipos de estado obtenidos exitosamente');
    } catch (error: any) {
      throw ResponseUtil.internalError(error);
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

      const mapped_emitters = emitters_raw.map((emitter: any) => ({
        idPersonaParticipante: emitter.IDPERSONAPARTICIPANTE,
        nombre: emitter.NOMBRE,
        codigo: emitter.IDPERSONAPARTICIPANTE || null,
      }));

      const response = {
        emitters: mapped_emitters,
        total: mapped_emitters.length,
        message: 'Emisores obtenidos exitosamente',
      };

      return ResponseUtil.success(response, 'Emisores obtenidos exitosamente');
    } catch (error: any) {
      throw ResponseUtil.internalError(error);
    }
  }

  // Métodos para obtener emisores con filtros (búsqueda y paginación)
  async getEmittersWithFilters(searchTerm: string = '', page: number = 1, limit: number = 50) {
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

      const emittersMap = emitters.map((emitter: any) => ({
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

      return ResponseUtil.success(response, 'Emisores obtenidos exitosamente');
    } catch (error: any) {
      throw ResponseUtil.internalError(error);
    }
  }

  // Métodos para obtener participantes por rol usando PER_PERSONA
  async getParticipantsByRoleWithPerson(rol: string, searchTerm: string = '', page: number = 1, limit: number = 50) {
    try {
      if (!rol) {
        const response = {
          participants: [],
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 0,
        };
        return ResponseUtil.success(response, 'No se especificó rol');
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

      const participantsMap = participants.map((participant: any) => ({
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

      return ResponseUtil.success(response, 'Participantes obtenidos exitosamente');
    } catch (error: any) {
      throw ResponseUtil.internalError(error);
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
      
      return ResponseUtil.success(response, 'Aduanas obtenidas exitosamente');
    } catch (error: any) {
      throw ResponseUtil.internalError(error);
    }
  }
}

