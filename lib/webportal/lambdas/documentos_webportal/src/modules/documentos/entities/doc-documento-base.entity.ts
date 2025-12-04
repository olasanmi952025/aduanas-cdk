import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('DOCDOCUMENTOBASE')
export class DocDocumentoBase {
  @PrimaryColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'TIPODOCUMENTO' })
  tipoDocumento: string;

  @Column({ name: 'VERSION' })
  version: string;

  @Column({ name: 'FECHAVERSION', type: 'date' })
  fechaVersion: Date;

  @Column({ name: 'NUMEROEXTERNO' })
  numeroExterno: string;

  @Column({ name: 'LOGINCREADOR' })
  loginCreador: string;

  @Column({ name: 'CREADOR' })
  creador: string;

  @Column({ name: 'LOGINDIGITADOR', nullable: true })
  loginDigitador?: string;

  @Column({ name: 'FECHACREACION', type: 'date' })
  fechaCreacion: Date;

  @Column({ name: 'FECHAEMISION', type: 'date' })
  fechaEmision: Date;

  @Column({ name: 'FECHAFINVIGENCIA', type: 'date', nullable: true })
  fechaFinVigencia?: Date;

  @Column({ name: 'ACTIVO' })
  activo: string;

  @Column({ name: 'VERSIONTIPODOC' })
  versionTipoDoc: string;

  @Column({ name: 'CODAREACREADOR', nullable: true })
  codAreaCreador?: string;

  @Column({ name: 'IDEMISOR' })
  idEmisor: number;

  @Column({ name: 'EMISOR' })
  emisor: string;

  @Column({ name: 'ARCHIVOXMLORIGEN', type: 'clob', nullable: true })
  archivoXmlOrigen?: string;

  @Column({ name: 'ARCHIVOXMLMODIFICACION', type: 'clob', nullable: true })
  archivoXmlModificacion?: string;

  @Column({ name: 'XML', type: 'clob', nullable: true })
  xml?: string;

  @Column({ name: 'PDF', type: 'blob', nullable: true })
  pdf?: Buffer;

  @Column({ name: 'ESVALIDOXML', nullable: true })
  esValidoXml?: string;

  @Column({ name: 'ESVALIDOPDF', nullable: true })
  esValidoPdf?: string;

  @Column({ name: 'NUMEROACEPTACION', type: 'number', nullable: true })
  numeroAceptacion?: number;
}