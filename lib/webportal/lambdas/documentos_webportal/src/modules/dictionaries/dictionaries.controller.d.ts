import { BuscarLocalidadesDto, ObtenerUsuariosCreadoresDto, ObtenerLocacionesDto, ObtenerEmisoresDto, GetTypeLocationsDto, GetDocTypesDto } from "./dto/dictionaries.dto";
import { DictionariesService } from "./dictionaries.service";
export declare class DictionariesController {
    private readonly dictionariesService;
    constructor(dictionariesService: DictionariesService);
    getTypeLocations(filters: GetTypeLocationsDto): Promise<import("../../shared").ApiResponseDto<{
        documentType: string;
        typeLocations: {
            codigo: string;
            descripcion: string;
        }[];
        total: number;
    }>>;
    getRoles(): Promise<import("../../shared").ApiResponseDto<{
        roles: import("./entities").DocRoles[];
        total: number;
        message: string;
    }>>;
    getUsersCreators(filters: ObtenerUsuariosCreadoresDto): Promise<{
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
    getDateTypes(filters: GetDocTypesDto): Promise<import("../../shared").ApiResponseDto<{
        dateType: import("./entities").DocTipoFecha[];
        total: number;
        message: string;
    }>>;
    getStatusTypes(filters: GetDocTypesDto): Promise<import("../../shared").ApiResponseDto<{
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
    getEmittersFilteredByName(filters: ObtenerEmisoresDto): Promise<import("../../shared").ApiResponseDto<{
        emitters: any;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>>;
    getParticipantsByRoleWithPerson(rol: string, filtros: ObtenerEmisoresDto): Promise<import("../../shared").ApiResponseDto<{
        participants: any;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>>;
    getCustoms(): Promise<import("../../shared").ApiResponseDto<{
        aduanas: import("./entities").DinAduan[];
        total: number;
        message: string;
    }>>;
}
