import { ValidatorConstraintInterface, ValidationArguments, ValidationOptions } from "class-validator";
export declare class IsValidDateRangeConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments): boolean;
    defaultMessage(args: ValidationArguments): string;
}
export declare function IsValidDateRange(validationOptions?: ValidationOptions): (object: any, propertyName: string) => void;
export declare class BuscarDocumentosDto {
    userId?: number;
    tipoDocumento?: string;
    tipoLocacion?: string;
    locacion?: string;
    tipoFecha?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    limit?: number;
    sentidoOperacion?: string;
    numeroVuelo?: string;
    numeroAceptacion?: string;
    numeroManifiestoOriginal?: string;
    estado?: string;
    participante?: number;
    tipoParticipante?: string;
    emisor?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class ObtenerDetallesCompletosDto {
    tipoRelacion?: string;
    fechaInicioOperaciones?: string;
    fechaTerminoOperaciones?: string;
    tipoOperacion?: string;
}
export declare class CloseManifestDto {
    documentoId: number;
}
