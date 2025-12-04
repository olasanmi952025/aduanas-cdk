// Entidades Oracle para el módulo de documentos
// Basadas en el esquema existente de DOCDOCUMENTOBASE y tablas relacionadas

export interface DocDocumentoBase {
  id: number;
  tipoDocumento: string;
  version: string;
  fechaVersion: Date;
  numeroExterno: string;
  loginCreador: string;
  creador: string;
  loginDigitador: string;
  fechaCreacion: Date;
  fechaEmision: Date;
  fechaFinVigencia: Date;
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
  tipoOperacion?: string;
}


export interface DocTipoLocacion {
  codigo: string;
  descripcion: string;
  activa: string;
  fechaActiva: Date;
  fechaDesactiva: Date;
}

export interface DocRoles {
  codigo: string;
  descripcion: string;
  activa: string;
  fechaActiva: Date;
  fechaDesactiva: Date;
}

export interface DocLocacionDocumento {
  documento: number;
  idLocacion: number;
  codigoLocacion: string;
  locacion: string;
  tipoLocacion: string;
  activa: string;
  fechaActiva: Date;
  fechaDesactiva: Date;
}

export interface DocParticipacion {
  documento: number;
  rol: string;
  idPersonaParticipante: number;
  nombreParticipante?: string;
  codigoPais?: string;
  tipoId?: string;
  nacId?: string;
  numeroId?: string;
  direccion?: string;
  porcentajeParticipacion?: number;
  fechaParticipacion?: Date;
  activa?: string;
  fechaActiva?: Date;
  fechaDesactiva?: Date;
  idDireccion?: number;
  comuna?: string;
  codigoComuna?: string;
  nombrePais?: string;
  documental?: string;
  telefono?: string;
  correoElectronico?: string;
  codigoAlmacen?: string;
}
