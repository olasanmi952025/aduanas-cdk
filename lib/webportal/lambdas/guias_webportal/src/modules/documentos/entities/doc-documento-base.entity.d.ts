export declare class DocDocumentoBase {
    id: number;
    tipoDocumento: string;
    version: string;
    fechaVersion: Date;
    numeroExterno: string;
    loginCreador: string;
    creador: string;
    loginDigitador?: string;
    fechaCreacion: Date;
    fechaEmision: Date;
    fechaFinVigencia?: Date;
    activo: string;
    versionTipoDoc: string;
    codAreaCreador?: string;
    idEmisor: number;
    emisor: string;
    archivoXmlOrigen?: string;
    archivoXmlModificacion?: string;
    xml?: string;
    pdf?: Buffer;
    esValidoXml?: string;
    esValidoPdf?: string;
    numeroAceptacion?: number;
}
