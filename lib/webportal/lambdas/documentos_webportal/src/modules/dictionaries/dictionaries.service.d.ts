import { DocTipoLocacion, DocRoles, DocLocacionDocumento, DocParticipacion, DinAduan } from './entities';
import { BuscarLocalidadesDto, ObtenerLocacionesDto } from './dto/dictionaries.dto';
import { DataSource, Repository } from 'typeorm';
import { DocTipoFecha } from './entities/doc-tipo-fecha.entity';
import { DocStatusType } from './entities/doc-tipo-estados.entity';
import { DocDocumentoBase } from '../documentos/entities/doc-documento-base.entity';
export declare class DictionariesService {
    private readonly tipoFechaRepository;
    private readonly tipoEstadoRepository;
    private readonly documentoBaseRepository;
    private readonly tipoLocacionRepository;
    private readonly rolesRepository;
    private readonly locacionDocumentoRepository;
    private readonly participacionRepository;
    private readonly dinAduanRepository;
    private readonly dataSource;
    constructor(tipoFechaRepository: Repository<DocTipoFecha>, tipoEstadoRepository: Repository<DocStatusType>, documentoBaseRepository: Repository<DocDocumentoBase>, tipoLocacionRepository: Repository<DocTipoLocacion>, rolesRepository: Repository<DocRoles>, locacionDocumentoRepository: Repository<DocLocacionDocumento>, participacionRepository: Repository<DocParticipacion>, dinAduanRepository: Repository<DinAduan>, dataSource: DataSource);
    getTypeLocations(documentType: string): Promise<import("../../shared").ApiResponseDto<{
        documentType: string;
        typeLocations: {
            codigo: string;
            descripcion: string;
        }[];
        total: number;
    }>>;
    getRoles(): Promise<import("../../shared").ApiResponseDto<{
        roles: DocRoles[];
        total: number;
        message: string;
    }>>;
    getUsersCreators(onlyActive?: boolean, searchTerm?: string, page?: number, limit?: number): Promise<{
        usuariosCreadores: any;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getLocations(filters: ObtenerLocacionesDto): Promise<import("../../shared").ApiResponseDto<{
        locaciones: any;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>>;
    getLocalitiesDictionary(filters: BuscarLocalidadesDto): Promise<import("../../shared").ApiResponseDto<{
        localities: any;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        filters: {
            busqueda: string | null;
        };
        message: string;
    }>>;
    getRolesParticipation(): Promise<import("../../shared").ApiResponseDto<any>>;
    getDateTypesDoc(typeDocument?: string): Promise<import("../../shared").ApiResponseDto<{
        dateType: DocTipoFecha[];
        total: number;
        message: string;
    }>>;
    getStatusTypesDoc(documentType?: string): Promise<import("../../shared").ApiResponseDto<{
        statusTypes: {
            documentType: string;
            code: string;
            name: string;
            description: string;
            active: string;
            activeDate: Date;
            inactiveDate: Date | undefined;
        }[];
        total: number;
        message: string;
    }>>;
    getEmitters(): Promise<import("../../shared").ApiResponseDto<{
        emitters: any;
        total: any;
        message: string;
    }>>;
    getEmittersWithFilters(searchTerm?: string, page?: number, limit?: number): Promise<import("../../shared").ApiResponseDto<{
        emitters: any;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>>;
    getParticipantsByRoleWithPerson(rol: string, searchTerm?: string, page?: number, limit?: number): Promise<import("../../shared").ApiResponseDto<{
        participants: any;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>>;
    getAduanas(): Promise<import("../../shared").ApiResponseDto<{
        aduanas: DinAduan[];
        total: number;
        message: string;
    }>>;
}
