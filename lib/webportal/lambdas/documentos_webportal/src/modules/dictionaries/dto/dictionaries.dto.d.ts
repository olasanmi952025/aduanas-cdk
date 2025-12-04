export declare class GetTypeLocationsDto {
    documentType: string;
}
export declare class ObtenerUsuariosCreadoresDto {
    soloActivos?: boolean;
    searchTerm?: string;
    page?: number;
    limit?: number;
}
export declare class ObtenerLocacionesDto {
    searchTerm?: string;
    tipoLocacion?: string;
    page?: number;
    limit?: number;
}
export declare class BuscarLocalidadesDto {
    busqueda?: string;
    page?: number;
    limit?: number;
}
export declare class ObtenerEmisoresDto {
    searchTerm?: string;
    page?: number;
    limit?: number;
}
export declare class GetDocTypesDto {
    typeDoc?: string;
}
