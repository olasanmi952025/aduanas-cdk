import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('DOCLOCACIONDOCUMENTO')
export class DocLocacionDocumento {
  @PrimaryColumn({ name: 'DOCUMENTO', type: 'number' })
  documento: number;

  @PrimaryColumn({ name: 'TIPOLOCACION' })
  tipoLocacion: string;

  @Column({ name: 'IDLOCACION', type: 'number' })
  idLocacion: number;

  @Column({ name: 'CODIGOLOCACION' })
  codigoLocacion: string;

  @Column({ name: 'LOCACION' })
  locacion: string;

  @Column({ name: 'ACTIVA' })
  activa: string;

  @Column({ name: 'FECHAACTIVA', type: 'date' })
  fechaActiva: Date;

  @Column({ name: 'FECHADESACTIVA', type: 'date', nullable: true })
  fechaDesactiva?: Date;
}

