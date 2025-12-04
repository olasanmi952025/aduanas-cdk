import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('DOCTIPOESTADO')
export class DocStatusType {
  @PrimaryColumn({ name: 'TIPODOCUMENTO', length: 10 })
  document_type: string;

  @PrimaryColumn({ name: 'CODIGO', length: 10 })
  code: string;

  @Column({ name: 'NOMBRE', length: 30 })
  name: string;

  @Column({ name: 'DESCRIPCION', length: 255 })
  description: string;

  @Column({ name: 'ACTIVA', length: 1 })
  active: string;

  @Column({ name: 'FECHAACTIVA', type: 'date' })
  active_date: Date;

  @Column({ name: 'FECHADESACTIVA', type: 'date', nullable: true })
  inactive_date?: Date;
}